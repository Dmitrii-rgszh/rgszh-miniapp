// src/setupProxy.js
const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Прокси для REST API
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:5000', // ← Убедитесь что Flask работает на порту 5000
      changeOrigin: true,
      logLevel: 'debug',
      onProxyReq: (proxyReq, req, res) => {
        console.log('Proxying API:', req.method, req.url);
      }
    })
  );

  // Прокси для Socket.IO
  app.use(
    '/socket.io',
    createProxyMiddleware({
      target: 'http://localhost:5000', // ← Убедитесь что Flask работает на порту 5000
      ws: true,
      changeOrigin: true,
      logLevel: 'debug',
      onProxyReq: (proxyReq, req, res) => {
        console.log('Proxying Socket.IO:', req.method, req.url);
      }
    })
  );
};