# Instagram Embed Microservice

Microserviço para gerar embeds HTML de posts do Instagram a partir de uma lista de URLs.

## 🚀 Como usar

### Instalação

```bash
npm install
```

### Executar o serviço

```bash
# Modo desenvolvimento
npm run dev

# Modo produção
npm start
```

O serviço estará disponível em `http://localhost:3008`

## 📡 Endpoints

### POST /generate-embeds

Gera embeds HTML para uma lista de posts do Instagram.

**Request Body:**
```json
{
  "urls": [
    "https://www.instagram.com/p/POST_ID1/",
    "https://www.instagram.com/p/POST_ID2/"
  ]
}
```

**Response:**
```json
{
  "success": true,
  "embeds": [
    "<blockquote class=\"instagram-media\" data-instgrm-permalink=\"https://www.instagram.com/p/POST_ID1/\" data-instgrm-version=\"14\"></blockquote>",
    "<blockquote class=\"instagram-media\" data-instgrm-permalink=\"https://www.instagram.com/p/POST_ID2/\" data-instgrm-version=\"14\"></blockquote>"
  ],
  "total": 2,
  "processed": 2
}
```

### POST /validate-url

Valida se uma URL é válida do Instagram e extrai o POST_ID.

**Request Body:**
```json
{
  "url": "https://www.instagram.com/p/POST_ID/"
}
```

**Response:**
```json
{
  "success": true,
  "url": "https://www.instagram.com/p/POST_ID/",
  "isValid": true,
  "postId": "POST_ID",
  "message": "URL válida do Instagram"
}
```

### GET /health

Health check do serviço.

**Response:**
```json
{
  "status": "OK",
  "service": "instagram-embed",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### GET /

Documentação e informações do serviço.

### GET /api-docs

Documentação interativa da API usando Swagger UI.

## 🔧 Exemplos de uso

### Gerar embeds
```bash
curl -X POST http://localhost:3008/generate-embeds \
  -H "Content-Type: application/json" \
  -d '{
    "urls": [
      "https://www.instagram.com/p/ABC123/",
      "https://www.instagram.com/p/DEF456/"
    ]
  }'
```

### Validar URL
```bash
curl -X POST http://localhost:3008/validate-url \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.instagram.com/p/ABC123/"
  }'
```

### Health check
```bash
curl http://localhost:3008/health
```

### Acessar documentação Swagger
Abra no navegador: `http://localhost:3008/api-docs`

## 📝 Formato do Embed

O serviço gera embeds no formato:

```html
<blockquote class="instagram-media"
  data-instgrm-permalink="https://www.instagram.com/p/POST_ID/"
  data-instgrm-version="14">
</blockquote>
```

## ⚠️ Validação

- URLs devem seguir o formato: `https://www.instagram.com/p/POST_ID/`
- POST_ID deve conter apenas caracteres alfanuméricos, hífens e underscores
- URLs inválidas são ignoradas e comentadas no resultado

## 🛠️ Tecnologias

- Node.js
- Express.js
- Swagger UI Express
- Swagger JSDoc