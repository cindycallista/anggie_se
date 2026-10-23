import { createReadStream, existsSync } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, extname, join, normalize } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createBookingStore } from './domain.mjs';

const root = dirname(fileURLToPath(import.meta.url));
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8' };

function json(response, status, payload) {
  response.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(payload));
}

async function readJson(request) {
  let body = '';
  for await (const chunk of request) {
    body += chunk;
    if (body.length > 100_000) throw new Error('Request is too large.');
  }
  return JSON.parse(body || '{}');
}

export function createStudyServer(options = {}) {
  const store = options.store || createBookingStore(options.seed || []);

  return createServer(async (request, response) => {
    const url = new URL(request.url, 'http://localhost');

    if (request.method === 'GET' && url.pathname === '/api/health') return json(response, 200, { status: 'ok' });
    if (request.method === 'GET' && url.pathname === '/api/bookings') return json(response, 200, store.list(url.searchParams.get('date')));

    if (request.method === 'POST' && url.pathname === '/api/bookings') {
      try {
        return json(response, 201, store.add(await readJson(request)));
      } catch (error) {
        return json(response, error.message.includes('already booked') ? 409 : 400, { error: error.message });
      }
    }

    const match = /^\/api\/bookings\/(\d+)$/.exec(url.pathname);
    if (request.method === 'DELETE' && match) return json(response, store.remove(match[1]) ? 204 : 404, {});
    if (url.pathname.startsWith('/api/')) return json(response, 404, { error: 'Not found.' });

    const requestPath = url.pathname === '/' ? 'index.html' : url.pathname.slice(1);
    const safePath = normalize(requestPath).replace(/^(\.\.(\\|\/|$))+/, '');
    const filePath = join(root, safePath);
    if (!filePath.startsWith(root) || !existsSync(filePath)) {
      response.writeHead(404);
      return response.end('Not found');
    }
    response.writeHead(200, { 'content-type': types[extname(filePath)] || 'application/octet-stream' });
    createReadStream(filePath).pipe(response);
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = Number(process.env.PORT || 4173);
  createStudyServer().listen(port, () => console.log(`StudySlot is running at http://localhost:${port}`));
}
