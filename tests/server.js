// Minimal static file server for the tests, so they need nothing but Node.
const http = require('http');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const port = Number(process.argv[2]) || 8123;

const TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json',
    '.webmanifest': 'application/manifest+json',
    '.png': 'image/png',
    '.svg': 'image/svg+xml'
};

http.createServer((req, res) => {
    const urlPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const file = path.join(root, urlPath.endsWith('/') ? urlPath + 'index.html' : urlPath);
    if (!file.startsWith(root + path.sep)) {
        res.writeHead(403).end();
        return;
    }
    fs.readFile(file, (err, data) => {
        if (err) {
            res.writeHead(404).end('Not found');
            return;
        }
        res.writeHead(200, {
            'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream',
            'Cache-Control': 'no-store'
        });
        res.end(data);
    });
}).listen(port, () => console.log(`Serving ${root} on http://localhost:${port}`));
