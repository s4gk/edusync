const http = require('http');
const httpProxy = require('http-proxy');
const fs = require('fs');
const path = require('path');

const proxy = httpProxy.createProxyServer({});

const DIST = path.join(__dirname, 'apps/frontend/dist');
const MIME = {
  '.html': 'text/html', '.js': 'application/javascript',
  '.css': 'text/css', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon', '.woff': 'font/woff',
  '.woff2': 'font/woff2', '.json': 'application/json',
};

function serveStatic(req, res) {
  let filePath = path.join(DIST, req.url.split('?')[0]);
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(DIST, 'index.html');
  }
  const ext = path.extname(filePath);
  res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream');
  if (ext === '.html') res.setHeader('Cache-Control', 'no-cache');
  else res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  fs.createReadStream(filePath).pipe(res);
}

const server = http.createServer((req, res) => {
  if (req.url.startsWith('/api') || req.url.startsWith('/socket.io')) {
    proxy.web(req, res, { target: 'http://127.0.0.1:5000', changeOrigin: true }, (err) => {
      res.writeHead(502); res.end('Backend unavailable');
    });
  } else {
    serveStatic(req, res);
  }
});

proxy.on('error', (err, req, res) => {
  res.writeHead(502); res.end('Proxy error');
});

server.listen(6060, () => console.log('🚀 Proxy en http://0.0.0.0:6060'));
