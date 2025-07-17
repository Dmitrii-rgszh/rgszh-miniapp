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
      secure: false, // Добавлено для локальной разработки
      logLevel: 'info',
      onProxyReq: (proxyReq, req, res) => {
        console.log('🔄 Proxying API:', req.method, req.url, '→ http://localhost:4000' + req.url);
        
        // Добавляем заголовки для CORS
        proxyReq.setHeader('Access-Control-Allow-Origin', '*');
        proxyReq.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        proxyReq.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      },
      onProxyRes: (proxyRes, req, res) => {
        console.log('✅ Proxy response:', req.method, req.url, '→', proxyRes.statusCode);
        
        // Добавляем CORS заголовки к ответу
        proxyRes.headers['Access-Control-Allow-Origin'] = '*';
        proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
        proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';
      },
      onError: (err, req, res) => {
        console.error('❌ Proxy error for', req.method, req.url, ':', err.message);
        console.error('💡 Check if Flask server is running on http://localhost:4000');
        
        // Fallback response
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            error: `Proxy error: ${err.message}`,
            hint: 'Make sure Flask server is running on port 4000',
            timestamp: new Date().toISOString()
          });
        }
      },
      // Добавляем проверку доступности целевого сервера
      router: function(req) {
        console.log('🎯 Routing request:', req.method, req.url);
        return 'http://localhost:4000';
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
      secure: false, // Добавлено для локальной разработки
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
  console.log('📍 API requests to /api/* will be proxied to http://localhost:4000');
  console.log('📍 Socket.IO requests to /socket.io/* will be proxied to http://localhost:4000');
};