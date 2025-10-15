import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

// Importação dinâmica do Handlebars
let Handlebars: any;
try {
  Handlebars = require('handlebars');
} catch (error) {
  console.error('Handlebars não encontrado. Instalando...');
  // Fallback para uma implementação simples se o Handlebars não estiver disponível
  Handlebars = {
    compile: (template: string) => (data: any) => {
      return template.replace(
        /\{\{(\w+)\}\}/g,
        (match, key) => data[key] || ''
      );
    },
    registerHelper: () => {},
  };
}

@Injectable()
export class TemplateService {
  private readonly logger = new Logger(TemplateService.name);
  private readonly templatesPath = path.join(__dirname, 'templates');
  private compiledTemplates: Map<string, any> = new Map();

  constructor() {
    this.loadTemplates();
    this.registerHelpers();
  }

  private loadTemplates(): void {
    try {
      const templateFiles = fs.readdirSync(this.templatesPath);

      templateFiles.forEach((file) => {
        if (file.endsWith('.hbs')) {
          const templateName = file.replace('.hbs', '');
          const templatePath = path.join(this.templatesPath, file);
          const templateContent = fs.readFileSync(templatePath, 'utf-8');

          const compiledTemplate = Handlebars.compile(templateContent);
          this.compiledTemplates.set(templateName, compiledTemplate);

          this.logger.log(`Template carregado: ${templateName}`);
        }
      });
    } catch (error) {
      this.logger.error('Erro ao carregar templates:', error);
    }
  }

  private registerHelpers(): void {
    // Helper para formatação de data
    Handlebars.registerHelper('formatDate', (date: Date, format: string) => {
      if (!date) return '';

      const d = new Date(date);
      switch (format) {
        case 'short':
          return d.toLocaleDateString('pt-BR');
        case 'long':
          return d.toLocaleDateString('pt-BR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          });
        default:
          return d.toLocaleDateString('pt-BR');
      }
    });

    // Helper para formatação de moeda
    Handlebars.registerHelper('formatCurrency', (value: number) => {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(value);
    });

    // Helper para capitalizar texto
    Handlebars.registerHelper('capitalize', (text: string) => {
      if (!text) return '';
      return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
    });

    // Helper para condicionais
    Handlebars.registerHelper('eq', (a: any, b: any) => {
      return a === b;
    });

    // Helper para condicionais
    Handlebars.registerHelper('ne', (a: any, b: any) => {
      return a !== b;
    });

    this.logger.log('Helpers do Handlebars registrados');
  }

  renderTemplate(templateName: string, data: any): string {
    const template = this.compiledTemplates.get(templateName);

    if (!template) {
      this.logger.error(`Template não encontrado: ${templateName}`);
      throw new Error(`Template '${templateName}' não encontrado`);
    }

    try {
      return template(data);
    } catch (error) {
      this.logger.error(`Erro ao renderizar template ${templateName}:`, error);
      throw error;
    }
  }

  renderPasswordResetEmail(data: { name: string; resetUrl: string }): string {
    const templateData = {
      name: data.name,
      resetUrl: data.resetUrl,
    };

    return this.renderTemplate('password-reset', templateData);
  }

  renderWelcomeEmail(data: { name: string; dashboardUrl: string }): string {
    const templateData = {
      name: data.name,
      dashboardUrl: data.dashboardUrl,
    };

    return this.renderTemplate('welcome', templateData);
  }

  // Método para recarregar templates (útil em desenvolvimento)
  reloadTemplates(): void {
    this.compiledTemplates.clear();
    this.loadTemplates();
    this.logger.log('Templates recarregados');
  }

  // Listar templates disponíveis
  getAvailableTemplates(): string[] {
    return Array.from(this.compiledTemplates.keys());
  }
}
