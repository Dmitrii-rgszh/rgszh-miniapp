// src/setupProxy.js - ИСПРАВЛЕНО: изменен порт с 5000 на 4000
const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Прокси для REST API - ИСПРАВЛЕНО: порт изменен на 4000
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:4000', // ← ИЗМЕНЕНО с 5000 на 4000
      changeOrigin: true,
      logLevel: 'debug',
      onProxyReq: (proxyReq, req, res) => {
        console.log('Proxying API:', req.method, req.url);
      }
    })
  );

  // Прокси для Socket.IO - ИСПРАВЛЕНО: порт изменен на 4000
  app.use(
    '/socket.io',
    createProxyMiddleware({
      target: 'http://localhost:4000', // ← ИЗМЕНЕНО с 5000 на 4000
      ws: true,
      changeOrigin: true,
      logLevel: 'debug',
      onProxyReq: (proxyReq, req, res) => {
        console.log('Proxying Socket.IO:', req.method, req.url);
      }
    })
  );
};