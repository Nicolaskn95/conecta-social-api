import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { PasswordResetService } from './password-reset.service';
import { RequestPasswordResetDto } from './dtos/request-password-reset.dto';
import { ResetPasswordDto } from './dtos/reset-password.dto';

@ApiTags('Password Reset')
@Controller('password-reset')
export class PasswordResetController {
  constructor(private readonly passwordResetService: PasswordResetService) {}

  @Post('request')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Solicitar reset de senha via email' })
  @ApiResponse({
    status: 200,
    description:
      'Email de reset enviado com sucesso (se o email estiver cadastrado)',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos ou erro ao enviar email',
  })
  async requestPasswordReset(
    @Body() requestPasswordResetDto: RequestPasswordResetDto
  ) {
    return this.passwordResetService.requestPasswordReset(
      requestPasswordResetDto
    );
  }

  @Post('reset')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Redefinir senha usando token' })
  @ApiResponse({
    status: 200,
    description: 'Senha redefinida com sucesso',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Token inválido ou expirado',
  })
  @ApiResponse({
    status: 404,
    description: 'Usuário não encontrado',
  })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.passwordResetService.resetPassword(resetPasswordDto);
  }

  @Get('validate-token')
  @ApiOperation({ summary: 'Validar token de reset de senha' })
  @ApiQuery({
    name: 'token',
    description: 'Token de reset de senha',
    example: 'abc123def456ghi789',
  })
  @ApiResponse({
    status: 200,
    description: 'Token validado',
    schema: {
      type: 'object',
      properties: {
        valid: { type: 'boolean' },
        email: {
          type: 'string',
          description: 'Email do usuário (apenas se token válido)',
        },
      },
    },
  })
  async validateToken(@Query('token') token: string) {
    return this.passwordResetService.validateToken(token);
  }

  @Get('dev-info')
  @ApiOperation({ summary: 'Informações de desenvolvimento - Link de reset' })
  @ApiQuery({
    name: 'email',
    description: 'Email do usuário',
    example: 'nicolaskn95@yopmail.com',
  })
  @ApiResponse({
    status: 200,
    description: 'Informações de desenvolvimento',
  })
  async getDevInfo(@Query('email') email: string) {
    if (process.env.NODE_ENV !== 'development') {
      return { message: 'Endpoint disponível apenas em desenvolvimento' };
    }

    const employee = await this.passwordResetService.getEmployeeByEmail(email);
    if (!employee) {
      return { message: 'Usuário não encontrado' };
    }

    const latestToken = await this.passwordResetService.getLatestToken(email);
    if (!latestToken) {
      return { message: 'Nenhum token encontrado para este email' };
    }

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${latestToken.token}`;

    return {
      message: 'Informações de desenvolvimento',
      email: employee.email,
      name: employee.name,
      token: latestToken.token,
      expiresAt: latestToken.expiresAt,
      resetUrl: resetUrl,
      timeLeft: Math.max(
        0,
        Math.floor(
          (new Date(latestToken.expiresAt).getTime() - new Date().getTime()) /
            1000 /
            60
        )
      ),
    };
  }
}
