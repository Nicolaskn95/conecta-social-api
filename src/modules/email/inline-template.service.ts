import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class InlineTemplateService {
  private readonly logger = new Logger(InlineTemplateService.name);

  constructor() {
    this.logger.log('InlineTemplateService inicializado');
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
    const templateContent = `
<!DOCTYPE html>
<html lang='pt-BR'>
  <head>
    <meta charset='UTF-8' />
    <meta name='viewport' content='width=device-width, initial-scale=1.0' />
    <title>Redefinição de Senha - Conecta Social</title>
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
        line-height: 1.6;
        color: #1a202c;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        min-height: 100vh;
        padding: 20px;
      }

      .email-wrapper {
        max-width: 600px;
        margin: 0 auto;
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(10px);
        border-radius: 20px;
        overflow: hidden;
        box-shadow: 
          0 20px 40px rgba(0, 0, 0, 0.1),
          0 0 0 1px rgba(255, 255, 255, 0.2);
        border: 1px solid rgba(255, 255, 255, 0.3);
      }

      .header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
        color: white;
        padding: 50px 40px;
        text-align: center;
        position: relative;
        overflow: hidden;
      }

      .header::before {
        content: '';
        position: absolute;
        top: -50%;
        left: -50%;
        width: 200%;
        height: 200%;
        background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
        animation: shimmer 3s ease-in-out infinite;
      }

      @keyframes shimmer {
        0%, 100% { transform: rotate(0deg) translateX(-50%); }
        50% { transform: rotate(180deg) translateX(50%); }
      }

      .header-content {
        position: relative;
        z-index: 2;
      }

      .logo {
        font-size: 32px;
        font-weight: 800;
        margin-bottom: 12px;
        text-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
        letter-spacing: -0.5px;
      }

      .tagline {
        font-size: 16px;
        opacity: 0.95;
        font-weight: 400;
        letter-spacing: 0.5px;
      }

      .content {
        padding: 50px 40px;
        background: #ffffff;
      }

      .greeting {
        font-size: 24px;
        font-weight: 700;
        color: #2d3748;
        margin-bottom: 24px;
        background: linear-gradient(135deg, #667eea, #764ba2);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }

      .message {
        font-size: 16px;
        color: #4a5568;
        margin-bottom: 32px;
        line-height: 1.8;
      }

      .button-container {
        text-align: center;
        margin: 40px 0;
      }

      .button {
        display: inline-block;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
        color: white !important;
        padding: 18px 40px;
        text-decoration: none;
        border-radius: 50px;
        font-weight: 600;
        font-size: 16px;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 
          0 10px 30px rgba(102, 126, 234, 0.4),
          0 4px 12px rgba(0, 0, 0, 0.15);
        border: none;
        position: relative;
        overflow: hidden;
        text-transform: uppercase;
        letter-spacing: 1px;
      }

      .button::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
        transition: left 0.5s;
      }

      .button:hover::before {
        left: 100%;
      }

      .button:hover {
        transform: translateY(-2px);
        box-shadow: 
          0 15px 40px rgba(102, 126, 234, 0.5),
          0 8px 20px rgba(0, 0, 0, 0.2);
      }

      .security-card {
        background: linear-gradient(135deg, #fff5f5 0%, #fed7d7 100%);
        border: 1px solid #feb2b2;
        border-radius: 16px;
        padding: 24px;
        margin: 32px 0;
        position: relative;
        overflow: hidden;
      }

      .security-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 4px;
        background: linear-gradient(90deg, #ff6b6b, #ffa726, #42a5f5);
      }

      .security-icon {
        display: inline-block;
        margin-right: 12px;
        font-size: 20px;
        animation: pulse 2s infinite;
      }

      @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.1); }
      }

      .security-title {
        font-weight: 700;
        color: #c53030;
        margin-bottom: 8px;
        font-size: 16px;
      }

      .security-text {
        color: #742a2a;
        font-size: 14px;
        line-height: 1.6;
      }

      .link-container {
        background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
        border: 1px solid #e2e8f0;
        border-radius: 16px;
        padding: 24px;
        margin: 32px 0;
        position: relative;
      }

      .link-container::before {
        content: '🔗';
        position: absolute;
        top: -10px;
        left: 20px;
        background: white;
        padding: 0 8px;
        font-size: 16px;
      }

      .link-label {
        font-size: 14px;
        color: #4a5568;
        margin-bottom: 12px;
        font-weight: 500;
      }

      .link-text {
        font-family: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;
        font-size: 12px;
        color: #2d3748;
        word-break: break-all;
        background: #ffffff;
        padding: 16px;
        border-radius: 8px;
        border: 1px solid #e2e8f0;
        box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.05);
      }

      .footer {
        background: linear-gradient(135deg, #2d3748 0%, #1a202c 100%);
        color: #a0aec0;
        padding: 40px;
        text-align: center;
        position: relative;
      }

      .footer::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 1px;
        background: linear-gradient(90deg, transparent, #4a5568, transparent);
      }

      .footer-logo {
        font-size: 18px;
        font-weight: 700;
        color: #ffffff;
        margin-bottom: 16px;
        background: linear-gradient(135deg, #667eea, #764ba2);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }

      .footer-text {
        font-size: 12px;
        color: #718096;
        margin-bottom: 8px;
        line-height: 1.5;
      }

      .social-links {
        margin-top: 20px;
      }

      .social-link {
        display: inline-block;
        width: 40px;
        height: 40px;
        background: linear-gradient(135deg, #667eea, #764ba2);
        border-radius: 50%;
        margin: 0 8px;
        text-decoration: none;
        color: white;
        line-height: 40px;
        font-size: 16px;
        transition: transform 0.3s ease;
      }

      .social-link:hover {
        transform: translateY(-2px) scale(1.1);
      }

      @media (max-width: 600px) {
        body {
          padding: 10px;
        }
        
        .email-wrapper {
          border-radius: 16px;
        }

        .header,
        .content,
        .footer {
          padding: 30px 20px;
        }

        .logo {
          font-size: 28px;
        }

        .greeting {
          font-size: 20px;
        }

        .button {
          padding: 16px 32px;
          font-size: 14px;
        }
      }

      @media (prefers-color-scheme: dark) {
        .content {
          background: #1a202c;
          color: #e2e8f0;
        }
        
        .greeting {
          color: #e2e8f0;
        }
        
        .message {
          color: #a0aec0;
        }
      }
    </style>
  </head>
  <body>
    <div class='email-wrapper'>
      <div class='header'>
        <div class='header-content'>
          <div class='logo'>🚀 Conecta Social</div>
          <div class='tagline'>Conectando pessoas, transformando vidas</div>
        </div>
      </div>

      <div class='content'>
        <div class='greeting'>Olá, {{name}}! 👋</div>

        <div class='message'>
          Recebemos uma solicitação para redefinir a senha da sua conta no
          <strong>Conecta Social</strong>.
          <br /><br />
          Para continuar com a redefinição de forma segura, clique no botão abaixo:
        </div>

        <div class='button-container'>
          <a href='{{resetUrl}}' class='button'>🔐 Redefinir Senha</a>
        </div>

        <div class='security-card'>
          <div class='security-title'>
            <span class='security-icon'>⚠️</span>
            Importante - Segurança
          </div>
          <div class='security-text'>
            <strong>Este link expira em 10 minutos</strong> por motivos de segurança.<br />
            Se você não solicitou esta redefinição, ignore este email. Sua senha não será alterada.
          </div>
        </div>

        <div class='link-container'>
          <div class='link-label'>
            📋 Link alternativo (caso o botão não funcione):
          </div>
          <div class='link-text'>{{resetUrl}}</div>
        </div>

        <div class='message'>
          Se você tiver alguma dúvida ou não solicitou esta redefinição, entre
          em contato conosco imediatamente através do nosso suporte.
          <br /><br />
          <strong>Obrigado por fazer parte da nossa comunidade! 💙</strong>
        </div>
      </div>

      <div class='footer'>
        <div class='footer-logo'>Conecta Social</div>
        <div class='footer-text'>
          Este é um email automático, não responda a esta mensagem.
        </div>
        <div class='footer-text'>
          © 2024 Conecta Social. Todos os direitos reservados.
        </div>
        <div class='social-links'>
          <a href='#' class='social-link'>📘</a>
          <a href='#' class='social-link'>📷</a>
          <a href='#' class='social-link'>🐦</a>
          <a href='#' class='social-link'>💼</a>
        </div>
      </div>
    </div>
  </body>
</html>
    `;

    return this.renderTemplate(templateContent, data);
  }

  renderWelcomeEmail(data: { name: string; dashboardUrl: string }): string {
    const templateContent = `
<!DOCTYPE html>
<html lang='pt-BR'>
  <head>
    <meta charset='UTF-8' />
    <meta name='viewport' content='width=device-width, initial-scale=1.0' />
    <title>Bem-vindo ao Conecta Social</title>
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
        line-height: 1.6;
        color: #1a202c;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        min-height: 100vh;
        padding: 20px;
      }

      .email-wrapper {
        max-width: 600px;
        margin: 0 auto;
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(10px);
        border-radius: 20px;
        overflow: hidden;
        box-shadow: 
          0 20px 40px rgba(0, 0, 0, 0.1),
          0 0 0 1px rgba(255, 255, 255, 0.2);
        border: 1px solid rgba(255, 255, 255, 0.3);
      }

      .header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
        color: white;
        padding: 50px 40px;
        text-align: center;
        position: relative;
        overflow: hidden;
      }

      .header::before {
        content: '';
        position: absolute;
        top: -50%;
        left: -50%;
        width: 200%;
        height: 200%;
        background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
        animation: shimmer 3s ease-in-out infinite;
      }

      @keyframes shimmer {
        0%, 100% { transform: rotate(0deg) translateX(-50%); }
        50% { transform: rotate(180deg) translateX(50%); }
      }

      .header-content {
        position: relative;
        z-index: 2;
      }

      .logo {
        font-size: 32px;
        font-weight: 800;
        margin-bottom: 12px;
        text-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
        letter-spacing: -0.5px;
      }

      .tagline {
        font-size: 16px;
        opacity: 0.95;
        font-weight: 400;
        letter-spacing: 0.5px;
      }

      .content {
        padding: 50px 40px;
        background: #ffffff;
      }

      .greeting {
        font-size: 28px;
        font-weight: 800;
        color: #2d3748;
        margin-bottom: 24px;
        background: linear-gradient(135deg, #667eea, #764ba2);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        text-align: center;
      }

      .message {
        font-size: 18px;
        color: #4a5568;
        margin-bottom: 32px;
        line-height: 1.8;
        text-align: center;
      }

      .features {
        margin: 40px 0;
        display: grid;
        gap: 20px;
      }

      .feature-item {
        display: flex;
        align-items: center;
        padding: 24px;
        background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
        border-radius: 16px;
        border: 1px solid #e2e8f0;
        transition: all 0.3s ease;
        position: relative;
        overflow: hidden;
      }

      .feature-item::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 4px;
        background: linear-gradient(135deg, #667eea, #764ba2);
      }

      .feature-item:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
      }

      .feature-icon {
        font-size: 28px;
        margin-right: 20px;
        background: linear-gradient(135deg, #667eea, #764ba2);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        animation: bounce 2s infinite;
      }

      @keyframes bounce {
        0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
        40% { transform: translateY(-10px); }
        60% { transform: translateY(-5px); }
      }

      .feature-text {
        font-size: 16px;
        color: #2d3748;
        font-weight: 500;
        flex: 1;
      }

      .button-container {
        text-align: center;
        margin: 40px 0;
      }

      .button {
        display: inline-block;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
        color: white !important;
        padding: 20px 50px;
        text-decoration: none;
        border-radius: 50px;
        font-weight: 700;
        font-size: 18px;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 
          0 15px 35px rgba(102, 126, 234, 0.4),
          0 5px 15px rgba(0, 0, 0, 0.1);
        border: none;
        position: relative;
        overflow: hidden;
        text-transform: uppercase;
        letter-spacing: 1px;
      }

      .button::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
        transition: left 0.5s;
      }

      .button:hover::before {
        left: 100%;
      }

      .button:hover {
        transform: translateY(-3px) scale(1.05);
        box-shadow: 
          0 20px 40px rgba(102, 126, 234, 0.5),
          0 10px 20px rgba(0, 0, 0, 0.2);
      }

      .welcome-card {
        background: linear-gradient(135deg, #e6fffa 0%, #b2f5ea 100%);
        border: 1px solid #81e6d9;
        border-radius: 16px;
        padding: 30px;
        margin: 32px 0;
        text-align: center;
        position: relative;
        overflow: hidden;
      }

      .welcome-card::before {
        content: '✨';
        position: absolute;
        top: -10px;
        right: 20px;
        font-size: 24px;
        animation: sparkle 2s ease-in-out infinite;
      }

      @keyframes sparkle {
        0%, 100% { transform: rotate(0deg) scale(1); }
        50% { transform: rotate(180deg) scale(1.2); }
      }

      .welcome-title {
        font-size: 20px;
        font-weight: 700;
        color: #234e52;
        margin-bottom: 12px;
      }

      .welcome-text {
        font-size: 16px;
        color: #2c7a7b;
        line-height: 1.6;
      }

      .footer {
        background: linear-gradient(135deg, #2d3748 0%, #1a202c 100%);
        color: #a0aec0;
        padding: 40px;
        text-align: center;
        position: relative;
      }

      .footer::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 1px;
        background: linear-gradient(90deg, transparent, #4a5568, transparent);
      }

      .footer-logo {
        font-size: 18px;
        font-weight: 700;
        color: #ffffff;
        margin-bottom: 16px;
        background: linear-gradient(135deg, #667eea, #764ba2);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }

      .footer-text {
        font-size: 12px;
        color: #718096;
        margin-bottom: 8px;
        line-height: 1.5;
      }

      .social-links {
        margin-top: 20px;
      }

      .social-link {
        display: inline-block;
        width: 40px;
        height: 40px;
        background: linear-gradient(135deg, #667eea, #764ba2);
        border-radius: 50%;
        margin: 0 8px;
        text-decoration: none;
        color: white;
        line-height: 40px;
        font-size: 16px;
        transition: transform 0.3s ease;
      }

      .social-link:hover {
        transform: translateY(-2px) scale(1.1);
      }

      @media (max-width: 600px) {
        body {
          padding: 10px;
        }
        
        .email-wrapper {
          border-radius: 16px;
        }

        .header,
        .content,
        .footer {
          padding: 30px 20px;
        }

        .logo {
          font-size: 28px;
        }

        .greeting {
          font-size: 24px;
        }

        .button {
          padding: 18px 40px;
          font-size: 16px;
        }

        .feature-item {
          padding: 20px;
        }

        .feature-icon {
          font-size: 24px;
        }
      }

      @media (prefers-color-scheme: dark) {
        .content {
          background: #1a202c;
          color: #e2e8f0;
        }
        
        .greeting {
          color: #e2e8f0;
        }
        
        .message {
          color: #a0aec0;
        }
      }
    </style>
  </head>
  <body>
    <div class='email-wrapper'>
      <div class='header'>
        <div class='header-content'>
          <div class='logo'>🎉 Conecta Social</div>
          <div class='tagline'>Conectando pessoas, transformando vidas</div>
        </div>
      </div>

      <div class='content'>
        <div class='greeting'>Bem-vindo(a), {{name}}! 🚀</div>

        <div class='message'>
          É um prazer imenso tê-lo(a) conosco! Sua conta foi criada com sucesso no
          <strong>Conecta Social</strong>.
          <br /><br />
          Agora você pode começar a fazer a diferença na sua comunidade e transformar vidas através da solidariedade!
        </div>

        <div class='welcome-card'>
          <div class='welcome-title'>🎯 Sua jornada de impacto começa agora!</div>
          <div class='welcome-text'>
            Explore todas as funcionalidades incríveis que preparamos para você.
            Junte-se a milhares de pessoas que já estão fazendo a diferença!
          </div>
        </div>

        <div class='features'>
          <div class='feature-item'>
            <span class='feature-icon'>🤝</span>
            <span class='feature-text'>Participe de eventos e ações sociais impactantes</span>
          </div>
          <div class='feature-item'>
            <span class='feature-icon'>📊</span>
            <span class='feature-text'>Acompanhe o impacto real das suas contribuições</span>
          </div>
          <div class='feature-item'>
            <span class='feature-icon'>👥</span>
            <span class='feature-text'>Conecte-se com outros voluntários apaixonados</span>
          </div>
          <div class='feature-item'>
            <span class='feature-icon'>🎯</span>
            <span class='feature-text'>Transforme vidas através da solidariedade</span>
          </div>
          <div class='feature-item'>
            <span class='feature-icon'>🏆</span>
            <span class='feature-text'>Ganhe reconhecimento por suas ações sociais</span>
          </div>
        </div>

        <div class='button-container'>
          <a href='{{dashboardUrl}}' class='button'>🚀 Acessar Dashboard</a>
        </div>

        <div class='message'>
          Se você tiver alguma dúvida ou precisar de ajuda, nossa equipe de suporte está sempre pronta para ajudar!
          <br /><br />
          <strong>Obrigado por fazer parte da nossa missão de transformar o mundo! 🌍💙</strong>
        </div>
      </div>

      <div class='footer'>
        <div class='footer-logo'>Conecta Social</div>
        <div class='footer-text'>
          Este é um email automático, não responda a esta mensagem.
        </div>
        <div class='footer-text'>
          © 2024 Conecta Social. Todos os direitos reservados.
        </div>
        <div class='social-links'>
          <a href='#' class='social-link'>📘</a>
          <a href='#' class='social-link'>📷</a>
          <a href='#' class='social-link'>🐦</a>
          <a href='#' class='social-link'>💼</a>
        </div>
      </div>
    </div>
  </body>
</html>
    `;

    return this.renderTemplate(templateContent, data);
  }
}
