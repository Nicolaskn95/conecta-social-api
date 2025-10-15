import { Injectable, Logger } from '@nestjs/common';
import * as Mailgun from 'mailgun.js';
import * as FormData from 'form-data';
import { InlineTemplateService } from './inline-template.service';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private mailgun: any;

  constructor(private readonly templateService: InlineTemplateService) {
    // Configuração do Mailgun - versão corrigida
    const mailgun = new (Mailgun as any)(FormData);
    this.mailgun = mailgun.client({
      username: 'api',
      key: process.env.MAILGUN_API_KEY || 'your-api-key-here',
      url: process.env.MAILGUN_URL || 'https://api.mailgun.net', // ou https://api.eu.mailgun.net para domínios EU
    });
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

      // Modo de desenvolvimento - não envia email real
      if (
        process.env.NODE_ENV === 'development' &&
        !process.env.MAILGUN_API_KEY
      ) {
        this.logger.log(`🔧 MODO DESENVOLVIMENTO - Email não enviado`);
        this.logger.log(`📧 Para: ${email}`);
        this.logger.log(`🔗 Link de Reset: ${resetUrl}`);
        this.logger.log(`👤 Nome: ${name}`);
        this.logger.log(`🎨 Template HTML gerado com sucesso!`);
        return true;
      }

      const domain =
        process.env.MAILGUN_DOMAIN ||
        'sandbox150c9aa3fc22441b9179e78d64097d88.mailgun.org';
      const fromEmail =
        process.env.MAILGUN_FROM || `Conecta Social <postmaster@${domain}>`;

      const data = await this.mailgun.messages.create(domain, {
        from: fromEmail,
        to: [email],
        subject: '🔐 Redefinição de Senha - Conecta Social',
        html: htmlContent,
        text: `Olá ${name},\n\nRecebemos uma solicitação para redefinir a senha da sua conta no Conecta Social.\n\nPara continuar com a redefinição, acesse o link abaixo:\n${resetUrl}\n\nEste link expira em 10 minutos.\n\nSe você não solicitou esta redefinição, ignore este email.\n\nObrigado por usar o Conecta Social!`,
      });

      this.logger.log(`✅ Email de reset de senha enviado para: ${email}`);
      this.logger.log(`📧 Mailgun ID: ${data.id}`);
      return true;
    } catch (error) {
      this.logger.error(
        `❌ Erro ao enviar email de reset para ${email}:`,
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

      // Modo de desenvolvimento - não envia email real
      if (
        process.env.NODE_ENV === 'development' &&
        !process.env.MAILGUN_API_KEY
      ) {
        this.logger.log(
          `🔧 MODO DESENVOLVIMENTO - Email de boas-vindas não enviado`
        );
        this.logger.log(`📧 Para: ${email}`);
        this.logger.log(`🔗 Dashboard: ${dashboardUrl}`);
        this.logger.log(`👤 Nome: ${name}`);
        this.logger.log(`🎨 Template HTML gerado com sucesso!`);
        return true;
      }

      const domain =
        process.env.MAILGUN_DOMAIN ||
        'sandbox150c9aa3fc22441b9179e78d64097d88.mailgun.org';
      const fromEmail =
        process.env.MAILGUN_FROM || `Conecta Social <postmaster@${domain}>`;

      const data = await this.mailgun.messages.create(domain, {
        from: fromEmail,
        to: [email],
        subject: '🎉 Bem-vindo ao Conecta Social!',
        html: htmlContent,
        text: `Bem-vindo(a), ${name}!\n\nÉ um prazer tê-lo(a) conosco! Sua conta foi criada com sucesso no Conecta Social.\n\nAgora você pode começar a fazer a diferença na sua comunidade:\n• Participe de eventos e ações sociais\n• Acompanhe o impacto das suas contribuições\n• Conecte-se com outros voluntários\n• Transforme vidas através da solidariedade\n\nAcesse seu dashboard: ${dashboardUrl}\n\nObrigado por fazer parte da nossa missão!`,
      });

      this.logger.log(`✅ Email de boas-vindas enviado para: ${email}`);
      this.logger.log(`📧 Mailgun ID: ${data.id}`);
      return true;
    } catch (error) {
      this.logger.error(
        `Erro ao enviar email de boas-vindas para ${email}:`,
        error
      );
      return false;
    }
  }

  async verifyConnection(): Promise<boolean> {
    try {
      // Verificação simples do Mailgun - tentar listar domínios
      const domains = await this.mailgun.domains.list();
      this.logger.log(
        `✅ Conexão com Mailgun verificada com sucesso. Domínios: ${domains.items.length}`
      );
      return true;
    } catch (error) {
      this.logger.error('❌ Erro ao verificar conexão com Mailgun:', error);
      return false;
    }
  }
}
