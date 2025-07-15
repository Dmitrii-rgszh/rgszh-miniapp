// src/setupProxy.js - Улучшенный с диагностикой
const { createProxyMiddleware } = require('http-proxy-middleware');

console.log('🔧 Setting up proxy middleware...');

module.exports = function(app) {
  console.log('🔧 Configuring API proxy to http://localhost:4000');
  
  // Прокси для REST API
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:4000',
      changeOrigin: true,
      logLevel: 'info', // Изменено с debug на info для меньшего спама
      onProxyReq: (proxyReq, req, res) => {
        console.log('🔄 Proxying API:', req.method, req.url, '→ http://localhost:4000' + req.url);
      },
      onProxyRes: (proxyRes, req, res) => {
        console.log('✅ Proxy response:', req.method, req.url, '→', proxyRes.statusCode);
      },
      onError: (err, req, res) => {
        console.error('❌ Proxy error for', req.method, req.url, ':', err.message);
        // Fallback response
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            error: `Proxy error: ${err.message}`,
            hint: 'Make sure Flask server is running on port 4000'
          });
        }
      }
    })
  );

  // Прокси для Socket.IO
  app.use(
    '/socket.io',
    createProxyMiddleware({
      target: 'http://localhost:4000',
      ws: true,
      changeOrigin: true,
      logLevel: 'info',
      onProxyReq: (proxyReq, req, res) => {
        console.log('🔄 Proxying Socket.IO:', req.method, req.url);
      },
      onError: (err, req, res) => {
        console.error('❌ Socket.IO proxy error:', err.message);
      }
    })
  );
  
  console.log('✅ Proxy middleware configured successfully');
};