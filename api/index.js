// Import do serviço instagram-embed
const app = require('../services/instagram-embed/index.js');

// Para Vercel, precisamos exportar como handler
module.exports = (req, res) => {
  return app(req, res);
};
