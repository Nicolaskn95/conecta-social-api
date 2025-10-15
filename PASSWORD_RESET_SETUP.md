# Configuração do Sistema de Reset de Senha

## Variáveis de Ambiente Necessárias

Adicione as seguintes variáveis ao seu arquivo `.env`:

```env
# Email Configuration (SMTP) - TestMail.app
SMTP_HOST="smtp.testmail.app"
SMTP_PORT="587"
SMTP_USER="your-api-key"
SMTP_PASS="your-api-key"
SMTP_FROM="test@testmail.app"

# Frontend URL
FRONTEND_URL="http://localhost:3000"
```

## Configuração do TestMail.app (Recomendado para Desenvolvimento)

O [TestMail.app](https://testmail.app/console/#apikeys) é perfeito para testes de email durante o desenvolvimento:

1. Acesse: https://testmail.app/console/#apikeys
2. Crie uma conta gratuita
3. Gere uma API Key
4. Configure as variáveis:

```env
SMTP_HOST="smtp.testmail.app"
SMTP_PORT="587"
SMTP_USER="your-api-key"
SMTP_PASS="your-api-key"
SMTP_FROM="test@testmail.app"
```

**Vantagens do TestMail.app:**

- ✅ API Key simples (mesmo valor para user e pass)
- ✅ Emails são capturados para teste
- ✅ Não precisa de verificação de email
- ✅ Ideal para desenvolvimento
- ✅ Interface web para visualizar emails

## Configuração do Gmail (Produção)

1. Ative a verificação em duas etapas na sua conta Google
2. Gere uma senha de aplicativo:
   - Acesse: https://myaccount.google.com/apppasswords
   - Selecione "Aplicativo" e "Outro"
   - Digite um nome (ex: "Conecta Social API")
   - Use a senha gerada na variável `SMTP_PASS`

## Outros Provedores SMTP

### Outlook/Hotmail

```env
SMTP_HOST="smtp-mail.outlook.com"
SMTP_PORT="587"
```

### Yahoo

```env
SMTP_HOST="smtp.mail.yahoo.com"
SMTP_PORT="587"
```

### SendGrid

```env
SMTP_HOST="smtp.sendgrid.net"
SMTP_PORT="587"
SMTP_USER="apikey"
SMTP_PASS="your-sendgrid-api-key"
```

## Endpoints Disponíveis

### POST /password-reset/request

Solicita reset de senha

```json
{
  "email": "user@example.com"
}
```

### POST /password-reset/reset

Redefine a senha usando token

```json
{
  "token": "abc123def456ghi789",
  "newPassword": "NewPassword123"
}
```

### GET /password-reset/validate-token?token=abc123def456ghi789

Valida se o token é válido

## Funcionalidades Implementadas

- ✅ Token com expiração de 10 minutos
- ✅ Email HTML responsivo com templates Handlebars
- ✅ Templates modernos e profissionais
- ✅ Validação de token no frontend
- ✅ Contador de tempo restante
- ✅ Interface de usuário moderna
- ✅ Segurança (não revela se email existe)
- ✅ Limpeza automática de tokens expirados
- ✅ Sistema de templates extensível

## Testando o Sistema

1. Configure as variáveis de ambiente
2. Inicie o backend: `yarn dev`
3. Inicie o frontend: `yarn dev`
4. Acesse `/login` e clique em "Esqueci minha senha"
5. Digite um email cadastrado
6. Verifique o email recebido no TestMail.app
7. Clique no link e redefina a senha

## Visualizando Emails no TestMail.app

Após configurar o TestMail.app:

1. Acesse: https://testmail.app/console/
2. Faça login com sua conta
3. Vá para a seção "Emails" ou "Inbox"
4. Todos os emails enviados pelo sistema aparecerão lá
5. Você pode visualizar o HTML do email e copiar links

**Dica:** Use emails com o domínio `@testmail.app` para garantir que sejam capturados pelo serviço.

## Sistema de Templates Handlebars

O sistema agora usa templates Handlebars para criar emails HTML profissionais e responsivos.

### Templates Disponíveis

- **`password-reset.hbs`** - Template para reset de senha
- **`welcome.hbs`** - Template para email de boas-vindas
- **`base.hbs`** - Template base com layout comum

### Localização dos Templates

```
src/modules/email/templates/
├── base.hbs
├── password-reset.hbs
└── welcome.hbs
```

### Criando Novos Templates

1. Crie um arquivo `.hbs` na pasta `templates/`
2. Use a sintaxe Handlebars para variáveis: `{{variableName}}`
3. Adicione um método no `TemplateService` para renderizar o template
4. Use o template no `EmailService`

### Exemplo de Template

```handlebars
<html>
  <head>
    <title>{{title}}</title>
  </head>
  <body>
    <h1>Olá {{name}}!</h1>
    <p>{{message}}</p>
    <a href='{{buttonUrl}}'>{{buttonText}}</a>
  </body>
</html>
```

### Helpers Disponíveis

- `{{formatDate date 'short'}}` - Formatação de data
- `{{formatCurrency value}}` - Formatação de moeda
- `{{capitalize text}}` - Capitalização de texto
- `{{#if condition}}...{{/if}}` - Condicionais
- `{{#each items}}...{{/each}}` - Loops
