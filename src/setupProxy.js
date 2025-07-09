const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    ['/api', '/socket.io'],
    createProxyMiddleware({
      target: 'http://localhost:4000',
      changeOrigin: true,
      ws: true,
      logLevel: 'debug'
    })
  );
};