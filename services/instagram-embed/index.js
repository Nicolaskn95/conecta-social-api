const express = require('express');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const app = express();
const PORT = process.env.PORT || 3008;

// Middleware para parsing JSON
app.use(express.json());

// Configuração do Swagger
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Instagram Embed API',
      version: '1.0.0',
      description: 'Microserviço para gerar embeds HTML de posts do Instagram',
      contact: {
        name: 'Instagram Embed Service',
        email: 'support@example.com',
      },
    },
    // Use relative server URL to work both locally and remotely
    servers: [
      {
        url: '/',
        description: 'Servidor atual',
      },
    ],
    components: {
      schemas: {
        GenerateEmbedsRequest: {
          type: 'object',
          required: ['urls'],
          properties: {
            urls: {
              type: 'array',
              items: {
                type: 'string',
                example: 'https://www.instagram.com/p/POST_ID/',
              },
              description: 'Lista de URLs do Instagram',
            },
          },
        },
        GenerateEmbedsResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            embeds: {
              type: 'array',
              items: {
                type: 'string',
              },
              example: [
                '<blockquote class="instagram-media" data-instgrm-permalink="https://www.instagram.com/p/POST_ID/" data-instgrm-version="14"></blockquote>',
              ],
            },
            total: {
              type: 'number',
              example: 1,
            },
            processed: {
              type: 'number',
              example: 1,
            },
          },
        },
        ValidateUrlRequest: {
          type: 'object',
          required: ['url'],
          properties: {
            url: {
              type: 'string',
              example: 'https://www.instagram.com/p/POST_ID/',
              description: 'URL do Instagram para validar',
            },
          },
        },
        ValidateUrlResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            url: {
              type: 'string',
              example: 'https://www.instagram.com/p/POST_ID/',
            },
            isValid: {
              type: 'boolean',
              example: true,
            },
            postId: {
              type: 'string',
              example: 'POST_ID',
            },
            message: {
              type: 'string',
              example: 'URL válida do Instagram',
            },
          },
        },
        HealthResponse: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              example: 'OK',
            },
            service: {
              type: 'string',
              example: 'instagram-embed',
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-01T00:00:00.000Z',
            },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              example: 'Mensagem de erro',
            },
            message: {
              type: 'string',
              example: 'Detalhes do erro',
            },
          },
        },
      },
    },
  },
  apis: ['./index.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Serve assets + UI a partir do spec em memória (evita 404/MIME errado na Vercel)
app.use(
  '/api-docs',
  (req, _res, next) => {
    // opcional dinâmico:
    swaggerSpec.servers = [{ url: `${req.protocol}://${req.get('host')}` }];
    next();
  },
  swaggerUi.serveFiles(swaggerSpec),
  swaggerUi.setup(swaggerSpec, { explorer: true })
);

/**
 * Extrai o POST_ID de um link do Instagram
 * @param {string} url - URL do post do Instagram
 * @returns {string|null} - POST_ID extraído ou null se inválido
 */
function extractPostId(url) {
  try {
    // Regex para capturar o POST_ID de URLs do Instagram
    const regex = /https:\/\/www\.instagram\.com\/p\/([A-Za-z0-9_-]+)\/?/;
    const match = url.match(regex);

    if (match && match[1]) {
      return match[1];
    }

    return null;
  } catch (error) {
    console.error('Erro ao extrair POST_ID:', error);
    return null;
  }
}

/**
 * Gera o embed HTML para um post do Instagram
 * @param {string} postId - ID do post do Instagram
 * @param {string} originalUrl - URL original do post
 * @returns {string} - HTML do embed
 */
function generateInstagramEmbed(postId, originalUrl) {
  return `<blockquote class="instagram-media"
  data-instgrm-permalink="${originalUrl}"
  data-instgrm-version="14"
  style="max-width:540px; min-width:326px; width:99.375%; width:-webkit-calc(100% - 2px); width:calc(100% - 2px);">
</blockquote>`;
}

/**
 * Processa uma lista de URLs do Instagram e retorna os embeds
 * @param {string[]} urls - Array de URLs do Instagram
 * @returns {string[]} - Array de embeds HTML
 */
function processInstagramUrls(urls) {
  const embeds = [];

  for (const url of urls) {
    const postId = extractPostId(url);

    if (postId) {
      const embed = generateInstagramEmbed(postId, url);
      embeds.push(embed);
    } else {
      // Se não conseguir extrair o POST_ID, adiciona um embed vazio ou erro
      console.warn(`URL inválida do Instagram: ${url}`);
      embeds.push(`<!-- URL inválida: ${url} -->`);
    }
  }

  return embeds;
}

/**
 * @swagger
 * /generate-embeds:
 *   post:
 *     summary: Gera embeds HTML para posts do Instagram
 *     description: Recebe uma lista de URLs do Instagram e retorna os embeds HTML correspondentes
 *     tags: [Instagram]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GenerateEmbedsRequest'
 *           examples:
 *             example1:
 *               summary: Exemplo com múltiplas URLs
 *               value:
 *                 urls:
 *                   - "https://www.instagram.com/p/ABC123/"
 *                   - "https://www.instagram.com/p/DEF456/"
 *     responses:
 *       200:
 *         description: Embeds gerados com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GenerateEmbedsResponse'
 *             examples:
 *               success:
 *                 summary: Resposta de sucesso
 *                 value:
 *                   success: true
 *                   embeds:
 *                     - "<blockquote class=\"instagram-media\" data-instgrm-permalink=\"https://www.instagram.com/p/ABC123/\" data-instgrm-version=\"14\"></blockquote>"
 *                     - "<blockquote class=\"instagram-media\" data-instgrm-permalink=\"https://www.instagram.com/p/DEF456/\" data-instgrm-version=\"14\"></blockquote>"
 *                   total: 2
 *                   processed: 2
 *       400:
 *         description: Erro de validação
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
app.post('/generate-embeds', (req, res) => {
  try {
    const { urls } = req.body;

    // Validação da entrada
    if (!urls || !Array.isArray(urls)) {
      return res.status(400).json({
        error: 'Body deve conter um array "urls" com links do Instagram',
      });
    }

    if (urls.length === 0) {
      return res.status(400).json({
        error: 'Array "urls" não pode estar vazio',
      });
    }

    // Processa as URLs e gera os embeds
    const embeds = processInstagramUrls(urls);

    res.json({
      success: true,
      embeds: embeds,
      total: embeds.length,
      processed: urls.length,
    });
  } catch (error) {
    console.error('Erro no endpoint:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message,
    });
  }
});

/**
 * @swagger
 * /validate-url:
 *   post:
 *     summary: Valida se uma URL é válida do Instagram
 *     description: Recebe uma URL e verifica se é uma URL válida do Instagram, extraindo o POST_ID
 *     tags: [Instagram]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ValidateUrlRequest'
 *           examples:
 *             validUrl:
 *               summary: URL válida
 *               value:
 *                 url: "https://www.instagram.com/p/ABC123/"
 *             invalidUrl:
 *               summary: URL inválida
 *               value:
 *                 url: "https://invalid-url.com"
 *     responses:
 *       200:
 *         description: Validação realizada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidateUrlResponse'
 *             examples:
 *               valid:
 *                 summary: URL válida
 *                 value:
 *                   success: true
 *                   url: "https://www.instagram.com/p/ABC123/"
 *                   isValid: true
 *                   postId: "ABC123"
 *                   message: "URL válida do Instagram"
 *               invalid:
 *                 summary: URL inválida
 *                 value:
 *                   success: true
 *                   url: "https://invalid-url.com"
 *                   isValid: false
 *                   postId: null
 *                   message: "URL inválida do Instagram"
 *       400:
 *         description: Erro de validação
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
app.post('/validate-url', (req, res) => {
  try {
    const { url } = req.body;

    // Validação da entrada
    if (!url || typeof url !== 'string') {
      return res.status(400).json({
        error: 'Body deve conter uma string "url"',
      });
    }

    const postId = extractPostId(url);
    const isValid = postId !== null;

    res.json({
      success: true,
      url: url,
      isValid: isValid,
      postId: postId,
      message: isValid
        ? 'URL válida do Instagram'
        : 'URL inválida do Instagram',
    });
  } catch (error) {
    console.error('Erro no endpoint validate-url:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message,
    });
  }
});

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check do serviço
 *     description: Verifica se o serviço está funcionando corretamente
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Serviço funcionando normalmente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthResponse'
 *             example:
 *               status: "OK"
 *               service: "instagram-embed"
 *               timestamp: "2024-01-01T00:00:00.000Z"
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'instagram-embed',
    timestamp: new Date().toISOString(),
  });
});

/**
 * @swagger
 * /:
 *   get:
 *     summary: Informações do serviço
 *     description: Retorna informações sobre o serviço e endpoints disponíveis
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Informações do serviço
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 service:
 *                   type: string
 *                   example: "Instagram Embed Generator"
 *                 version:
 *                   type: string
 *                   example: "1.0.0"
 *                 swagger:
 *                   type: string
 *                   example: "http://localhost:3008/api-docs"
 *                 endpoints:
 *                   type: object
 *                   description: "Lista de endpoints disponíveis"
 */
app.get('/', (req, res) => {
  res.json({
    service: 'Instagram Embed Generator',
    version: '1.0.0',
    swagger: 'http://localhost:3008/api-docs',
    endpoints: {
      'POST /generate-embeds': {
        description: 'Gera embeds HTML para posts do Instagram',
        body: {
          urls: ['https://www.instagram.com/p/POST_ID/'],
        },
        response: {
          success: true,
          embeds: ['<blockquote class="instagram-media"...>'],
          total: 1,
          processed: 1,
        },
      },
      'POST /validate-url': {
        description: 'Valida se uma URL é válida do Instagram',
        body: {
          url: 'https://www.instagram.com/p/POST_ID/',
        },
        response: {
          success: true,
          url: 'https://www.instagram.com/p/POST_ID/',
          isValid: true,
          postId: 'POST_ID',
          message: 'URL válida do Instagram',
        },
      },
      'GET /health': 'Health check do serviço',
      'GET /api-docs': 'Documentação Swagger da API',
    },
  });
});

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
  console.error('Erro não tratado:', err);
  res.status(500).json({
    error: 'Erro interno do servidor',
    message: err.message,
  });
});

// Middleware para rotas não encontradas
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint não encontrado',
    availableEndpoints: [
      'POST /generate-embeds',
      'POST /validate-url',
      'GET /health',
      'GET /',
      'GET /api-docs',
    ],
  });
});

// Inicia o servidor apenas se não estiver em ambiente serverless
if (process.env.NODE_ENV !== 'production' || process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`🚀 Instagram Embed Service rodando na porta ${PORT}`);
    console.log(`📖 Documentação disponível em: http://localhost:${PORT}`);
    console.log(
      `📚 Swagger UI disponível em: http://localhost:${PORT}/api-docs`
    );
    console.log(`❤️  Health check em: http://localhost:${PORT}/health`);
  });
}

module.exports = app;

// Só escuta porta quando rodar via `node index.js` (dev local)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Dev local em http://localhost:${PORT}`);
    console.log(`📚 Swagger UI: http://localhost:${PORT}/api-docs`);
  });
}