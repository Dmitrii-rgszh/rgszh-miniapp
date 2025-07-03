// src/setupProxy.js
const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Прокси для REST API
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:5000',
      changeOrigin: true,
    })
  );

  // Прокси для socket.io (WebSocket + polling)
  app.use(
    '/socket.io',
    createProxyMiddleware({
      target: 'http://localhost:5000',
      ws: true,
      changeOrigin: true,
    })
  );
};