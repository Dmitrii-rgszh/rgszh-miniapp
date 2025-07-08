// src/setupProxy.js - ОБНОВЛЕНО для порта 5000
const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Прокси для REST API - ИЗМЕНЕНО с 4000 на 5000
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:5000',  // ← БЫЛО 4000, СТАЛО 5000
      changeOrigin: true,
      onError: (err, req, res) => {
        console.error('Proxy error:', err);
        res.status(500).send('Proxy error');
      }
    })
  );

  // Прокси для socket.io (WebSocket + polling) - ИЗМЕНЕНО с 4000 на 5000
  app.use(
    '/socket.io',
    createProxyMiddleware({
      target: 'http://localhost:5000',  // ← БЫЛО 4000, СТАЛО 5000
      ws: true,
      changeOrigin: true,
      onError: (err, req, res) => {
        console.error('Socket proxy error:', err);
      }
    })
  );
};