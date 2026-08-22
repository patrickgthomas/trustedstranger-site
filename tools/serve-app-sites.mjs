// Local preview for the generated app sites. Serves each app repo under its
// own path so all six can be checked without deploying:
//
//   node tools/serve-app-sites.mjs      ->  http://localhost:4322/guard/ etc.

import { readFileSync, statSync, readdirSync } from 'node:fs';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'node:http';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const GITHUB = join(ROOT, '..');

const apps = readdirSync(join(ROOT, 'src/data/apps'))
  .filter((f) => f.endsWith('.json'))
  .map((f) => JSON.parse(readFileSync(join(ROOT, 'src/data/apps', f), 'utf8')));

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
};

createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  const slug = url.split('/')[1];
  const app = apps.find((a) => a.slug === slug);

  if (!app) {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    return res.end(
      '<h1>Gide app site preview</h1><ul>' +
        apps.map((a) => `<li><a href="/${a.slug}/">${a.name}</a></li>`).join('') +
        '</ul>'
    );
  }

  let rest = url.slice(slug.length + 1) || '/';
  if (rest.endsWith('/')) rest += 'index.html';
  let file = join(GITHUB, app.repo, rest);

  try {
    if (statSync(file).isDirectory()) file = join(file, 'index.html');
    const buf = readFileSync(file);
    // Dev server only: never let the browser cache a stale build.
    res.writeHead(200, {
      'content-type': MIME[extname(file)] || 'application/octet-stream',
      'cache-control': 'no-store',
    });
    res.end(buf);
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain' });
    res.end('Not found: ' + rest);
  }
}).listen(4322, () => console.log('App site preview on http://localhost:4322'));
