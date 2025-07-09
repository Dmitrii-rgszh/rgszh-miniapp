// src/setupProxy.js
const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Для версии 3.x используем один middleware для всех путей
  app.use(
    createProxyMiddleware({
      context: ['/api', '/socket.io'],
      target: 'http://localhost:4000',
      changeOrigin: true,
      ws: true, // Включаем поддержку WebSocket
      logLevel: 'debug',
      onProxyReq: (proxyReq, req, res) => {
        console.log('[Proxy]', req.method, req.url, '→', 'http://localhost:4000' + req.url);
      },
      onError: (err, req, res) => {
        console.error('[Proxy Error]', err);
      }
    })
  );
};