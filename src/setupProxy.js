// src/setupProxy.js - ИСПРАВЛЕНО: правильная настройка путей
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
      secure: false,
      logLevel: 'info',
      // ИСПРАВЛЕНО: НЕ меняем путь, просто перенаправляем
      pathRewrite: {
        // Убираем pathRewrite - он мешает
      },
      onProxyReq: (proxyReq, req, res) => {
        console.log('🔄 Proxying API:', req.method, req.url, '→ http://localhost:4000' + req.url);
        console.log('🎯 Target URL:', 'http://localhost:4000' + req.url);
      },
      onProxyRes: (proxyRes, req, res) => {
        console.log('✅ Proxy response:', req.method, req.url, '→', proxyRes.statusCode);
      },
      onError: (err, req, res) => {
        console.error('❌ Proxy error for', req.method, req.url, ':', err.message);
        console.error('💡 Check if Flask server is running on http://localhost:4000');
        console.error('🔍 Full target URL would be: http://localhost:4000' + req.url);
        
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            error: `Proxy error: ${err.message}`,
            hint: 'Make sure Flask server is running on port 4000',
            targetUrl: 'http://localhost:4000' + req.url,
            timestamp: new Date().toISOString()
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
      secure: false,
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
  console.log('📍 API requests to /api/* will be proxied to http://localhost:4000/api/*');
  console.log('📍 Socket.IO requests to /socket.io/* will be proxied to http://localhost:4000/socket.io/*');
};