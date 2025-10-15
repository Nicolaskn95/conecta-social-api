import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class SimpleTemplateService {
  private readonly logger = new Logger(SimpleTemplateService.name);
  private readonly templatesPath = path.join(__dirname, 'templates');

  constructor() {
    this.logger.log('SimpleTemplateService inicializado');
  }

  private loadTemplate(templateName: string): string {
    try {
      const templatePath = path.join(this.templatesPath, `${templateName}.hbs`);
      const templateContent = fs.readFileSync(templatePath, 'utf-8');
      this.logger.log(`Template carregado: ${templateName}`);
      return templateContent;
    } catch (error) {
      this.logger.error(`Erro ao carregar template ${templateName}:`, error);
      throw error;
    }
  }

  private renderTemplate(templateContent: string, data: any): string {
    let rendered = templateContent;

    // Substitui variáveis simples {{variavel}}
    Object.keys(data).forEach((key) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      rendered = rendered.replace(regex, data[key] || '');
    });

    return rendered;
  }

  renderPasswordResetEmail(data: { name: string; resetUrl: string }): string {
    const templateContent = this.loadTemplate('password-reset');
    return this.renderTemplate(templateContent, data);
  }

  renderWelcomeEmail(data: { name: string; dashboardUrl: string }): string {
    const templateContent = this.loadTemplate('welcome');
    return this.renderTemplate(templateContent, data);
  }

  getAvailableTemplates(): string[] {
    try {
      const files = fs.readdirSync(this.templatesPath);
      return files
        .filter((file) => file.endsWith('.hbs'))
        .map((file) => file.replace('.hbs', ''));
    } catch (error) {
      this.logger.error('Erro ao listar templates:', error);
      return [];
    }
  }
}
