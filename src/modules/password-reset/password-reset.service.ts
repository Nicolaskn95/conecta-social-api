import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@/config/prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { RequestPasswordResetDto } from './dtos/request-password-reset.dto';
import { ResetPasswordDto } from './dtos/reset-password.dto';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class PasswordResetService {
  private readonly logger = new Logger(PasswordResetService.name);

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService
  ) {}

  async requestPasswordReset(
    requestPasswordResetDto: RequestPasswordResetDto
  ): Promise<{ message: string }> {
    const { email } = requestPasswordResetDto;

    // Verificar se o usuário existe
    const employee = await this.prisma.employee.findUnique({
      where: { email },
    });

    if (!employee) {
      // Por segurança, não revelamos se o email existe ou não
      return {
        message:
          'Se o email estiver cadastrado, você receberá um link para redefinir sua senha.',
      };
    }

    // Invalidar tokens anteriores para este email
    await this.prisma.passwordResetToken.updateMany({
      where: { email, used: false },
      data: { used: true },
    });

    // Gerar novo token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10); // 10 minutos

    // Salvar token no banco
    await this.prisma.passwordResetToken.create({
      data: {
        token,
        email,
        expiresAt,
      },
    });

    // Enviar email
    const emailSent = await this.emailService.sendPasswordResetEmail(
      email,
      token,
      employee.name
    );

    if (!emailSent) {
      this.logger.error(`Falha ao enviar email de reset para: ${email}`);
      throw new BadRequestException(
        'Erro ao enviar email de reset. Tente novamente.'
      );
    }

    this.logger.log(`Token de reset gerado para: ${email}`);
    return {
      message:
        'Se o email estiver cadastrado, você receberá um link para redefinir sua senha.',
    };
  }

  async resetPassword(
    resetPasswordDto: ResetPasswordDto
  ): Promise<{ message: string }> {
    const { token, newPassword } = resetPasswordDto;

    // Buscar token válido
    const resetToken = await this.prisma.passwordResetToken.findFirst({
      where: {
        token,
        used: false,
        expiresAt: {
          gt: new Date(), // Token ainda não expirou
        },
      },
    });

    if (!resetToken) {
      throw new BadRequestException('Token inválido ou expirado.');
    }

    // Verificar se o usuário ainda existe
    const employee = await this.prisma.employee.findUnique({
      where: { email: resetToken.email },
    });

    if (!employee) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    // Hash da nova senha
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Atualizar senha do usuário
    await this.prisma.employee.update({
      where: { id: employee.id },
      data: { password: hashedPassword },
    });

    // Marcar token como usado
    await this.prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { used: true },
    });

    this.logger.log(`Senha redefinida com sucesso para: ${resetToken.email}`);
    return { message: 'Senha redefinida com sucesso.' };
  }

  async validateToken(
    token: string
  ): Promise<{ valid: boolean; email?: string }> {
    const resetToken = await this.prisma.passwordResetToken.findFirst({
      where: {
        token,
        used: false,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!resetToken) {
      return { valid: false };
    }

    return { valid: true, email: resetToken.email };
  }

  async cleanupExpiredTokens(): Promise<void> {
    const result = await this.prisma.passwordResetToken.deleteMany({
      where: {
        OR: [{ used: true }, { expiresAt: { lt: new Date() } }],
      },
    });

    this.logger.log(`${result.count} tokens expirados removidos`);
  }

  async getEmployeeByEmail(email: string) {
    return this.prisma.employee.findUnique({
      where: { email },
    });
  }

  async getLatestToken(email: string) {
    return this.prisma.passwordResetToken.findFirst({
      where: {
        email,
        used: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
