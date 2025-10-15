# 📧 Configuração Mailgun - Conecta Social

## ✅ Mailgun Integrado com Sucesso!

O sistema agora usa **Mailgun** para envio de emails com templates profissionais.

### 🎯 **Variáveis de Ambiente Necessárias:**

Crie um arquivo `.env` na raiz do projeto com:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/conecta_social"

# JWT
JWT_SECRET="your-jwt-secret-key"

# Mailgun Configuration
MAILGUN_API_KEY="your-mailgun-api-key"
MAILGUN_DOMAIN="your-domain.mailgun.org"
MAILGUN_FROM="Conecta Social <noreply@yourdomain.com>"
MAILGUN_URL="https://api.mailgun.net"  # ou https://api.eu.mailgun.net para domínios EU

# Frontend URL
FRONTEND_URL="http://localhost:3000"

# Environment
NODE_ENV="development"  # ou "production"
```

### 🔧 **Configuração do Mailgun:**

#### **1. Conta Sandbox (Para Testes):**

```env
MAILGUN_API_KEY="your-sandbox-api-key-here"
MAILGUN_DOMAIN="sandbox150c9aa3fc22441b9179e78d64097d88.mailgun.org"
MAILGUN_FROM="Conecta Social <postmaster@sandbox150c9aa3fc22441b9179e78d64097d88.mailgun.org>"
```

#### **2. Domínio Próprio (Para Produção):**

```env
MAILGUN_API_KEY="your-production-api-key"
MAILGUN_DOMAIN="yourdomain.com"
MAILGUN_FROM="Conecta Social <noreply@yourdomain.com>"
```

### 🚀 **Como Funciona:**

#### **Modo de Desenvolvimento:**

- Se `NODE_ENV=development` e não há `MAILGUN_API_KEY`
- Sistema não envia email real
- Logs informativos no console
- Templates HTML são gerados

#### **Modo de Produção:**

- Com `MAILGUN_API_KEY` configurado
- Emails enviados via Mailgun
- Templates HTML profissionais
- Logs de sucesso com Mailgun ID

### 📧 **Templates Disponíveis:**

1. **Email de Reset de Senha:**

   - Template HTML responsivo
   - Gradiente azul profissional
   - Botão de ação destacado
   - Aviso de expiração (10 min)
   - Link alternativo

2. **Email de Boas-vindas:**
   - Template com features
   - Call-to-action para dashboard
   - Design moderno
   - Responsivo

### 🎨 **Recursos dos Templates:**

- ✅ **Design Profissional:** Gradientes e cores da marca
- ✅ **Responsivo:** Funciona em mobile e desktop
- ✅ **Acessível:** Boa legibilidade e contraste
- ✅ **Fallback:** Versão texto para clientes antigos
- ✅ **Segurança:** Links seguros e tokens únicos

### 🔄 **Fluxo de Teste:**

1. **Configurar Mailgun:**

   ```bash
   # Adicionar variáveis ao .env
   MAILGUN_API_KEY="sua-chave"
   MAILGUN_DOMAIN="seu-dominio"
   ```

2. **Testar Reset de Senha:**

   ```bash
   POST http://localhost:3001/password-reset/request
   {
     "email": "nicolaskn95@yopmail.com"
   }
   ```

3. **Verificar Logs:**

   ```
   ✅ Email de reset de senha enviado para: nicolaskn95@yopmail.com
   📧 Mailgun ID: 2024-10-15-abc123...
   ```

4. **Verificar Email:**
   - Email recebido com template profissional
   - Link funcional para reset
   - Token válido por 10 minutos

### 📊 **Monitoramento:**

- **Logs de Sucesso:** ✅ com Mailgun ID
- **Logs de Erro:** ❌ com detalhes do erro
- **Verificação de Conexão:** Endpoint para testar Mailgun
- **Templates:** HTML gerado e validado

### 🛠️ **Endpoints Úteis:**

```bash
# Verificar conexão Mailgun
GET /email/verify-connection

# Informações de desenvolvimento
GET /password-reset/dev-info?email=nicolaskn95@yopmail.com

# Solicitar reset
POST /password-reset/request

# Validar token
GET /password-reset/validate-token?token=abc123

# Resetar senha
POST /password-reset/reset
```

### 🎉 **Status:**

- ✅ **Mailgun Integrado**
- ✅ **Templates Profissionais**
- ✅ **Modo Dev/Prod**
- ✅ **Logs Informativos**
- ✅ **Fallbacks de Segurança**
- ✅ **Responsivo**
- ✅ **Sistema Completo**

**Agora você tem um sistema de email profissional com Mailgun!** 🚀
