#!/usr/bin/env node
// Gide site builder.
//
// Reads src/pages/**.html, wraps each one in src/layouts/base.html with the
// shared header and footer, and writes plain static HTML to the repo root so
// GitHub Pages can serve it with no build step of its own.
//
//   node build.mjs           build once
//   node build.mjs --serve   build, then serve the repo on :4321 and rebuild on request

import { readFileSync, writeFileSync, readdirSync, mkdirSync, statSync } from 'node:fs';
import { join, dirname, relative, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'node:http';

const ROOT = dirname(fileURLToPath(import.meta.url));
const SRC = join(ROOT, 'src');
const site = JSON.parse(readFileSync(join(SRC, 'data', 'site.json'), 'utf8'));

/* ---------------------------------------------------------------- helpers */

const read = (...p) => readFileSync(join(SRC, ...p), 'utf8');

// Replaces {{key}} with values from the given map. Unknown keys resolve to ''
// so a page never ships a literal {{placeholder}}.
function fill(template, values) {
  return template.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, key) => {
    const value = key.split('.').reduce((acc, part) => (acc == null ? acc : acc[part]), values);
    return value == null ? '' : String(value);
  });
}

function walk(dir, base = dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full, base));
    else if (extname(full) === '.html') out.push(relative(base, full).split('\\').join('/'));
  }
  return out;
}

/* -------------------------------------------------------------- fragments */

function renderNav(current) {
  return site.nav
    .map((item) => {
      const active = current && item.href.startsWith(current) ? ' class="is-current"' : '';
      return `<li><a href="${item.href}"${active}>${item.label}</a></li>`;
    })
    .join('\n          ');
}

function renderFooterColumns() {
  return site.footer
    .map(
      (col) => `<div class="footer-col">
          <h2>${col.heading}</h2>
          <ul>
            ${col.links.map((l) => `<li><a href="${l.href}">${l.label}</a></li>`).join('\n            ')}
          </ul>
        </div>`
    )
    .join('\n        ');
}

function renderLegalLinks() {
  return site.legal.map((l) => `<a href="${l.href}">${l.label}</a>`).join('\n          ');
}

const logo = (slug) => `/assets/images/logos/G-${slug}-128.png`;

// Full card for the apps people can download today.
function renderAppCards(statuses) {
  return site.apps
    .filter((app) => statuses.includes(app.status))
    .map((app) => {
      const store = app.store
        ? `<a class="btn btn-gold btn-sm" href="${app.store}">Get the app</a>`
        : '';
      return `<article class="card app-card" data-app="${app.slug}">
            <img class="card-icon" src="${logo(app.slug)}" alt="" width="52" height="52" loading="lazy">
            <span class="pill pill-${app.status}">${app.statusLabel}</span>
            <h3>${app.name}</h3>
            <p>${app.summary}</p>
            <div class="btn-row">
              ${store}
              <a class="btn btn-outline btn-sm" href="${app.url}">Learn more</a>
            </div>
          </article>`;
    })
    .join('\n          ');
}

// Quieter row for what is still on the way.
function renderAppCardsQuiet(statuses) {
  return site.apps
    .filter((app) => statuses.includes(app.status))
    .map(
      (app) => `<a class="card app-card-quiet" data-app="${app.slug}" href="${app.url}">
            <img class="card-icon" src="${logo(app.slug)}" alt="" width="40" height="40" loading="lazy">
            <div>
              <h3>${app.name}</h3>
              <p>${app.tagline} <span class="muted">&middot; ${app.statusLabel}</span></p>
            </div>
          </a>`
    )
    .join('\n          ');
}

function renderBookCards(limit) {
  return site.books
    .slice(0, limit || site.books.length)
    .map(
      (book) => `<a class="book-card" href="/books/${book.slug}/">
            <img class="book-cover" src="${book.cover.replace('.webp', '-400.webp')}" alt="${book.title} cover" width="267" height="400" loading="lazy">
            <h3>${book.title}</h3>
            <p>${book.summary}</p>
            <span class="pill pill-available">Free</span>
          </a>`
    )
    .join('\n          ');
}

function renderEpisodes() {
  return site.podcast
    .map(
      (ep) => `<article class="episode">
          <p class="episode-meta">Episode ${ep.n}</p>
          <h3>${ep.title}</h3>
          <p>${ep.summary}</p>
          <audio controls preload="none" src="${ep.file}">Your browser does not support audio playback.</audio>
          <p><a class="small" href="${ep.file}" download>Download this episode</a></p>
        </article>`
    )
    .join('\n        ');
}

/* ------------------------------------------------------------------ build */

let base, header, footer, year;

function renderPage(meta, body) {
  const out = meta.out;
  const canonical = `${site.domain}/${out.replace(/index\.html$/, '')}`;

  const values = {
    ...meta,
    site,
    year,
    canonical,
    ogImage: meta.ogImage || '/assets/images/logos/G-main.png',
    bodyClass: meta.bodyClass || '',
    header: fill(header, { site, nav: renderNav(meta.nav) }),
    footer: fill(footer, {
      site,
      year,
      columns: renderFooterColumns(),
      legalLinks: renderLegalLinks(),
    }),
    content: fill(body, {
      site,
      year,
      appCards: renderAppCards(['available']),
      appCardsAll: renderAppCards(['available', 'review', 'development', 'soon']),
      appCardsQuiet: renderAppCardsQuiet(['review', 'development', 'soon']),
      bookCards: renderBookCards(),
      bookCardsFeatured: renderBookCards(3),
      episodes: renderEpisodes(),
    }),
  };

  const dest = join(ROOT, out);
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, fill(base, values));
}

// One detail page per book, straight from site.books.
function buildBookPages() {
  for (const book of site.books) {
    const inside = book.inside.map((item) => `<li>${item}</li>`).join('\n          ');
    const body = `
  <section class="page-head">
    <div class="wrap">
      <p class="eyebrow">${book.series}</p>
      <h1>${book.title}</h1>
      <p class="lede">${book.tagline}</p>
    </div>
  </section>

  <section class="section">
    <div class="wrap book-detail">
      <img class="book-cover book-detail-cover" src="${book.cover}" alt="${book.title} cover" width="400" height="600">
      <div class="book-detail-body">
        <h2>${book.hook}</h2>
        <p class="lede">${book.hookBody}</p>

        <h3>Inside the guide</h3>
        <ul class="check-list">
          ${inside}
        </ul>

        <p class="book-format"><span class="pill pill-available">Free</span> <span class="muted">${book.format}</span></p>

        <div class="btn-row">
          <a class="btn btn-gold" href="${book.pdf}" download>Download the free PDF</a>
          <a class="btn btn-outline" href="/books/">All guides</a>
        </div>

        <p class="small muted" style="margin-top: var(--sp-8);">
          <strong>A practical snapshot.</strong> AI changes quickly, so this guide is offered as a
          plain-English starting point rather than a permanent technical manual.
        </p>
      </div>
    </div>
  </section>
`;

    renderPage(
      {
        out: `books/${book.slug}/index.html`,
        title: `${book.title} | Free AI Guide from Gide`,
        description: book.summary,
        ogImage: book.cover,
        bodyClass: 'page-book',
      },
      body
    );
  }
  return site.books.length;
}

// The old /apps/<slug>/ URLs still exist in the wild, so keep them alive as
// redirects to each app's own subdomain rather than letting them 404.
function buildAppRedirects() {
  for (const app of site.apps) {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${app.name} has moved</title>
<link rel="canonical" href="${app.url}">
<meta http-equiv="refresh" content="0; url=${app.url}">
<meta name="robots" content="noindex, follow">
</head>
<body>
<p>${app.name} now lives at <a href="${app.url}">${app.url}</a>.</p>
</body>
</html>
`;
    const dest = join(ROOT, 'apps', app.slug, 'index.html');
    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(dest, html);
  }
  return site.apps.length;
}

function build() {
  base = read('layouts', 'base.html');
  header = read('partials', 'header.html');
  footer = read('partials', 'footer.html');
  year = new Date().getFullYear();

  const pages = walk(join(SRC, 'pages'));
  for (const page of pages) {
    const raw = read('pages', page);
    const match = raw.match(/^<!--([\s\S]*?)-->\s*/);
    if (!match) throw new Error(`${page} is missing its <!--{ ... }--> meta block`);

    let meta;
    try {
      meta = JSON.parse(match[1]);
    } catch (err) {
      throw new Error(`${page} has an invalid meta block: ${err.message}`);
    }

    renderPage({ ...meta, out: meta.out || page }, raw.slice(match[0].length));
  }

  const books = buildBookPages();
  const redirects = buildAppRedirects();
  const urls = buildSitemap(pages);

  console.log(
    `Built ${pages.length} pages, ${books} book pages, ${redirects} app redirects, sitemap with ${urls} URLs`
  );
}

// Sitemap and robots.txt are generated so they cannot drift from the real pages.
function buildSitemap(pages) {
  const paths = [
    ...pages.map((page) => {
      const raw = read('pages', page);
      const meta = JSON.parse(raw.match(/^<!--([\s\S]*?)-->/)[1]);
      return (meta.out || page).replace(/index\.html$/, '');
    }),
    ...site.books.map((book) => `books/${book.slug}/`),
  ]
    // 404 is not a destination.
    .filter((path) => path !== '404.html')
    .sort();

  const body = paths
    .map((path) => `  <url><loc>${site.domain}/${path}</loc></url>`)
    .join('\n');

  writeFileSync(
    join(ROOT, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`
  );

  writeFileSync(
    join(ROOT, 'robots.txt'),
    `User-agent: *\nAllow: /\n\nSitemap: ${site.domain}/sitemap.xml\n`
  );

  return paths.length;
}

/* ------------------------------------------------------------------ serve */

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.mp3': 'audio/mpeg',
  '.mp4': 'video/mp4',
  '.pdf': 'application/pdf',
  '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8',
};

function serve(port = 4321) {
  createServer((req, res) => {
    let path = decodeURIComponent(req.url.split('?')[0]);
    if (path.endsWith('/')) path += 'index.html';

    let file = join(ROOT, path);
    try {
      if (statSync(file).isDirectory()) file = join(file, 'index.html');
    } catch {
      // fall through to the 404 below
    }

    try {
      const buf = readFileSync(file);
      res.writeHead(200, { 'content-type': MIME[extname(file)] || 'application/octet-stream' });
      res.end(buf);
    } catch {
      try {
        res.writeHead(404, { 'content-type': 'text/html; charset=utf-8' });
        res.end(readFileSync(join(ROOT, '404.html')));
      } catch {
        res.writeHead(404).end('Not found');
      }
    }
  }).listen(port, () => console.log(`Serving http://localhost:${port}`));
}

build();
if (process.argv.includes('--serve')) serve();
