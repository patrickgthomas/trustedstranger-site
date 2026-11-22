#!/usr/bin/env node
// Export the current Sudoku page to its existing GitHub Pages repository.
// Run `node build.mjs` first. Shared assets remain on the main Gide site.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const target = join(root, '..', 'gide-sudoku-site');
const site = JSON.parse(readFileSync(join(root, 'src/data/site.json'), 'utf8'));
const app = site.apps.find((item) => item.slug === 'sudoku');
const domain = 'https://sudoku.gidehub.com/';

if (!existsSync(join(target, '.git'))) {
  throw new Error('Clone patrickgthomas/gide-sudoku-site beside this repository before exporting.');
}
if (app?.url !== domain) {
  throw new Error('The Sudoku catalog URL must match its published domain.');
}
const cnamePath = join(target, 'CNAME');
if (existsSync(cnamePath) && readFileSync(cnamePath, 'utf8').trim() !== new URL(domain).hostname) {
  throw new Error('The target repository has a different custom domain; nothing was exported.');
}

const page = readFileSync(join(root, 'games/sudoku/index.html'), 'utf8');
if (!page.includes(`<link rel="canonical" href="${domain}">`) ||
    !page.includes('inspector-quill-sudoku-trailer.mp4')) {
  throw new Error('Build the current Inspector Quill page with node build.mjs before exporting.');
}

// The hub forwarding script is only needed at the old address. Preserve local
// #section links, while resolving shared navigation, images, CSS and video.
const exported = page
  .replace(/<script data-sudoku-hub-redirect>[\s\S]*?<\/script>\s*/, '')
  .replace(/\b(href|src|poster)=(['"])(\/(?!\/)[^'"]*)\2/g,
    (_, attribute, quote, path) => `${attribute}=${quote}${site.domain}${path}${quote}`);

writeFileSync(join(target, 'index.html'), exported);
writeFileSync(cnamePath, new URL(domain).hostname + '\n');
writeFileSync(join(target, '.nojekyll'), '');
writeFileSync(join(target, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${domain}sitemap.xml\n`);
writeFileSync(join(target, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${domain}</loc></url>\n</urlset>\n`);

console.log(`Exported Inspector Quill’s Sudoku to ${target} for ${domain}`);
