# Usuários de Teste - Conecta Social

## Credenciais para Teste

### 👤 Usuário Admin

- **Email:** `admin@conecta.com`
- **Senha:** `admin123`
- **Role:** `ADMIN`
- **Nome:** Admin Root

### 👤 Usuário de Teste - Nicolas Nagano

- **Email:** `nicolaskn95@yopmail.com`
- **Senha:** `admin123`
- **Role:** `VOLUNTEER`
- **Nome:** Nicolas Nagano

## Como Testar o Sistema de Reset de Senha

### 1. Teste com Email Real (YopMail)

O email `nicolaskn95@yopmail.com` é um email temporário que você pode usar para receber os emails de reset:

1. Acesse: https://yopmail.com/
2. Digite: `nicolaskn95` na caixa de entrada
3. Clique em "Check Inbox"
4. Você verá todos os emails enviados para esse endereço

### 2. Teste com TestMail.app

Configure o TestMail.app e use o email `nicolaskn95@yopmail.com` para testar o reset de senha.

### 3. Fluxo de Teste Completo

1. **Acesse a tela de login:** `http://localhost:3000/login`
2. **Clique em "Esqueci minha senha"**
3. **Digite o email:** `nicolaskn95@yopmail.com`
4. **Verifique o email recebido** (YopMail ou TestMail.app)
5. **Clique no link de reset**
6. **Digite a nova senha**
7. **Faça login com a nova senha**

## Recriar Usuários de Teste

Se precisar recriar os usuários de teste, execute:

```bash
yarn seed
```

## Observações

- ✅ Senha padrão para ambos os usuários: `admin123`
- ✅ Usuário Nicolas tem role `VOLUNTEER` (pode testar permissões)
- ✅ Usuário Admin tem role `ADMIN` (acesso completo)
- ✅ Email `nicolaskn95@yopmail.com` é temporário e público
- ✅ Todos os campos obrigatórios estão preenchidos

## Testando Templates de Email

Com o usuário Nicolas criado, você pode testar:

1. **Reset de Senha:** Solicite reset para `nicolaskn95@yopmail.com`
2. **Template Handlebars:** Verá o email com design profissional
3. **Funcionalidade Completa:** Token de 10 minutos, contador, etc.

---

**Dica:** Use o YopMail para receber emails rapidamente sem precisar configurar SMTP!
