import { Injectable, Logger } from '@nestjs/common';
import { InlineTemplateService } from './inline-template.service';

@Injectable()
export class SimpleEmailService {
  private readonly logger = new Logger(SimpleEmailService.name);

  constructor(private readonly templateService: InlineTemplateService) {
    this.logger.log('SimpleEmailService inicializado');
  }

  async sendPasswordResetEmail(
    email: string,
    token: string,
    name: string
  ): Promise<boolean> {
    try {
      const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;

      // Gerar HTML usando template Handlebars
      const htmlContent = this.templateService.renderPasswordResetEmail({
        name,
        resetUrl,
      });

      // Log das informações para desenvolvimento
      this.logger.log(`🔧 MODO DESENVOLVIMENTO - Email não enviado`);
      this.logger.log(`📧 Para: ${email}`);
      this.logger.log(`🔗 Link de Reset: ${resetUrl}`);
      this.logger.log(`👤 Nome: ${name}`);
      this.logger.log(`🎨 Template HTML gerado com sucesso!`);

      // Log do HTML para debug (opcional)
      this.logger.debug(`📄 HTML Content: ${htmlContent.substring(0, 200)}...`);

      return true;
    } catch (error) {
      this.logger.error(
        `❌ Erro ao gerar template de reset para ${email}:`,
        error
      );
      return false;
    }
  }

  async sendWelcomeEmail(email: string, name: string): Promise<boolean> {
    try {
      const dashboardUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard`;

      // Gerar HTML usando template Handlebars
      const htmlContent = this.templateService.renderWelcomeEmail({
        name,
        dashboardUrl,
      });

      // Log das informações para desenvolvimento
      this.logger.log(
        `🔧 MODO DESENVOLVIMENTO - Email de boas-vindas não enviado`
      );
      this.logger.log(`📧 Para: ${email}`);
      this.logger.log(`🔗 Dashboard: ${dashboardUrl}`);
      this.logger.log(`👤 Nome: ${name}`);
      this.logger.log(`🎨 Template HTML gerado com sucesso!`);

      return true;
    } catch (error) {
      this.logger.error(
        `❌ Erro ao gerar template de boas-vindas para ${email}:`,
        error
      );
      return false;
    }
  }

  async verifyConnection(): Promise<boolean> {
    this.logger.log('✅ SimpleEmailService - Sempre disponível');
    return true;
  }
}
