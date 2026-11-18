'use strict';
/**
 * Server xem thử trên máy:  npm run dev  →  http://localhost:3000
 * manifest.json được tạo lại mỗi lần tải trang, nên thêm/sửa JSON hay ảnh
 * chỉ cần F5 là thấy, không phải chạy lại lệnh.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { buildManifest } = require('./manifest');

const ROOT = path.resolve(__dirname, '..', 'public');
let port = Number(process.env.PORT) || 3000;

const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.avif': 'image/avif', '.ico': 'image/x-icon',
  '.mp4': 'video/mp4', '.m4v': 'video/mp4', '.webm': 'video/webm', '.mov': 'video/quicktime', '.ogv': 'video/ogg',
  '.woff2': 'font/woff2',
};

function sendManifest(res) {
  let body;
  try {
    body = JSON.stringify(buildManifest(ROOT));
  } catch (e) {
    body = JSON.stringify({ error: e.message });
    console.error('✖ ' + e.message);
  }
  res.writeHead(200, { 'Content-Type': MIME['.json'], 'Cache-Control': 'no-store' });
  res.end(body);
}

const server = http.createServer((req, res) => {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  } catch {
    res.writeHead(400); return res.end('Bad request');
  }
  if (pathname === '/manifest.json') return sendManifest(res);

  let file = path.join(ROOT, pathname);
  if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end('Forbidden'); }

  let st;
  try {
    st = fs.statSync(file);
    if (st.isDirectory()) { file = path.join(file, 'index.html'); st = fs.statSync(file); }
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('Không tìm thấy: ' + pathname);
  }

  const type = MIME[path.extname(file).toLowerCase()] || 'application/octet-stream';
  const size = st.size;
  const range = req.headers.range && /bytes=(\d*)-(\d*)/.exec(req.headers.range);
  if (range) {
    // Safari cần hỗ trợ Range để phát video mp4
    let start = range[1] === '' ? size - Number(range[2]) : Number(range[1]);
    let end = range[1] !== '' && range[2] !== '' ? Number(range[2]) : size - 1;
    start = Math.max(0, start); end = Math.min(end, size - 1);
    if (start > end) {
      res.writeHead(416, { 'Content-Range': `bytes */${size}` });
      return res.end();
    }
    res.writeHead(206, {
      'Content-Type': type, 'Content-Length': end - start + 1, 'Accept-Ranges': 'bytes',
      'Content-Range': `bytes ${start}-${end}/${size}`, 'Cache-Control': 'no-cache',
    });
    return fs.createReadStream(file, { start, end }).pipe(res);
  }
  res.writeHead(200, { 'Content-Type': type, 'Content-Length': size, 'Accept-Ranges': 'bytes', 'Cache-Control': 'no-cache' });
  if (req.method === 'HEAD') return res.end();
  fs.createReadStream(file).pipe(res);
});

server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') { port += 1; server.listen(port); } else throw e;
});
server.on('listening', () => {
  try {
    const m = buildManifest(ROOT);
    const total = m.categories.reduce((n, c) => n + c.products.length, 0);
    console.log(`\n  PrinTee đang chạy: http://localhost:${port}`);
    console.log(`  ${m.categories.length} danh mục · ${total} sản phẩm`);
    m.warnings.forEach((w) => console.log('  ⚠ ' + w));
  } catch (e) {
    console.log(`\n  PrinTee đang chạy: http://localhost:${port}`);
    console.error('  ✖ ' + e.message);
  }
  console.log('  Sửa JSON / thêm ảnh xong chỉ cần F5. Bấm Ctrl+C để dừng.\n');
});
server.listen(port);
