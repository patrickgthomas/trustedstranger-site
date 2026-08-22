// Builds the six per-app sites (guard, calm, faith, stride, legacy, roots)
// from one template plus each app's own JSON and brand palette, writing the
// result into each app's own repo.
//
//   node tools/build-app-sites.mjs
//
// Each app repo receives: index.html, assets/css/app.css, assets/js/nav.js and
// a right-sized logo. Nothing else in those repos is touched, so the Legacy
// /join/ flow and .well-known/assetlinks.json stay exactly as they are.

import { readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const GITHUB = join(ROOT, '..');

const site = JSON.parse(readFileSync(join(ROOT, 'src/data/site.json'), 'utf8'));
const palettes = JSON.parse(readFileSync(join(ROOT, 'src/data/palettes.json'), 'utf8'));
const baseCss = readFileSync(join(ROOT, 'assets/css/gide.css'), 'utf8');
const navJs = readFileSync(join(ROOT, 'assets/js/nav.js'), 'utf8');

/* ------------------------------------------------------- colour utilities */

const toRgb = (hex) => hex.replace('#', '').match(/../g).map((h) => parseInt(h, 16));
const toHex = (rgb) => '#' + rgb.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');

function luminance(hex) {
  const c = toRgb(hex)
    .map((v) => v / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}

function contrast(a, b) {
  const [l1, l2] = [luminance(a), luminance(b)];
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

const mix = (a, b, amount) => {
  const [x, y] = [toRgb(a), toRgb(b)];
  return toHex(x.map((v, i) => v + (y[i] - v) * amount));
};

// Nudges a colour toward black (on light backgrounds) or white (on dark ones)
// until it clears `min` against EVERY background it will actually sit on.
// Brand accents are picked to look good as fills, so most of them need this
// before they are safe to use as text.
function adjustUntil(color, backgrounds, min = 4.5) {
  const avgBg = backgrounds.map(luminance).reduce((a, b) => a + b, 0) / backgrounds.length;
  const target = avgBg > 0.4 ? '#000000' : '#ffffff';
  let c = color;
  for (let i = 0; i < 120; i++) {
    if (backgrounds.every((bg) => contrast(c, bg) >= min)) return c;
    c = mix(c, target, 0.035);
  }
  return c;
}

// Text colour that sits on a filled accent button.
const inkOn = (fill) => (contrast(fill, '#ffffff') >= 4.5 ? '#ffffff' : '#241a02');

/* -------------------------------------------------------------- rendering */

const esc = (s) => String(s == null ? '' : s);

function renderFeatures(app) {
  return app.features
    .map(
      (f) => `        <article class="card feature-card">
          <span class="feature-icon" aria-hidden="true">${esc(f.icon)}</span>
          <h3>${esc(f.title)}</h3>
          <p>${esc(f.body)}</p>
        </article>`
    )
    .join('\n');
}

function renderScreenshots(app) {
  if (!app.screenshots.length) return '';
  const figures = app.screenshots
    .map(
      (s) => `        <figure class="shot">
          <img src="${s.webp}" alt="${esc(s.alt)}" width="${s.w}" height="${s.h}" loading="lazy">
          <figcaption>${esc(s.caption)}</figcaption>
        </figure>`
    )
    .join('\n');

  return `
  <section class="section section-cream" id="screens">
    <div class="wrap">
      <div class="section-head centered">
        <p class="eyebrow">Inside the app</p>
        <h2>A look around.</h2>
      </div>
      <div class="shot-row">
${figures}
      </div>
    </div>
  </section>
`;
}

function renderSteps(app) {
  if (!app.steps) return '';
  const items = app.steps.items
    .map((s) => `          <li><h3>${esc(s.title)}</h3><p>${esc(s.body)}</p></li>`)
    .join('\n');
  return `
  <section class="section section-cream">
    <div class="wrap wrap-narrow">
      <div class="section-head">
        <p class="eyebrow">${esc(app.steps.eyebrow)}</p>
        <h2>${esc(app.steps.heading)}</h2>
      </div>
      <ol class="steps">
${items}
      </ol>
    </div>
  </section>
`;
}

function renderPrivacy(app) {
  if (!app.privacy) return '';
  const points = (app.privacy.points || [])
    .map(
      (p) => `        <li><b>${esc(p.title)}</b><span>${esc(p.body)}</span></li>`
    )
    .join('\n');

  return `
  <section class="section section-ink" id="privacy">
    <div class="wrap">
      <div class="section-head">
        <p class="eyebrow">Private by design</p>
        <h2>${esc(app.privacy.heading)}</h2>
        <p class="lede">${esc(app.privacy.body)}</p>
      </div>
${points ? `      <ul class="feature-list grid grid-3">\n${points}\n      </ul>` : ''}
    </div>
  </section>
`;
}

function renderCompanion(app) {
  if (!app.companion) return '';
  return `
  <section class="section">
    <div class="wrap wrap-narrow centered">
      <p class="eyebrow">${esc(app.companion.eyebrow)}</p>
      <h2>${esc(app.companion.heading)}</h2>
      <p class="lede" style="margin-top: var(--sp-4);">${esc(app.companion.body)}</p>
      <div class="btn-row" style="justify-content: center;">
        <a class="btn btn-outline" href="${app.companion.link.href}">${esc(app.companion.link.label)}</a>
      </div>
    </div>
  </section>
`;
}

function renderFaq(app) {
  if (!app.faq.length) return '';
  const items = app.faq
    .map(
      (f) => `        <details>
          <summary>${esc(f.q)}</summary>
          <p>${esc(f.a)}</p>
        </details>`
    )
    .join('\n');
  return `
  <section class="section" id="faq">
    <div class="wrap wrap-narrow">
      <div class="section-head">
        <p class="eyebrow">Good to know</p>
        <h2>Frequently asked questions</h2>
      </div>
      <div class="faq">
${items}
      </div>
    </div>
  </section>
`;
}

function storeButton(app, className = 'btn btn-accent') {
  if (!app.store) return '';
  const label =
    app.storeLabel || (app.store.includes('play.google') ? 'Get it on Google Play' : 'Download on the App Store');
  return `<a class="${className}" href="${app.store}">${label}</a>`;
}

function renderPage(app, palette) {
  const meta = site.apps.find((a) => a.slug === app.slug);
  const pageTitle = `${app.name} | ${(meta.tagline || app.headline).replace(/\.$/, '')}`;
  const otherApps = site.apps
    .filter((a) => a.slug !== app.slug)
    .map((a) => `<li><a href="${a.url}">${a.name}</a></li>`)
    .join('\n            ');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${pageTitle}</title>
  <meta name="description" content="${esc(app.lede)}">
  <link rel="canonical" href="${app.url}">

  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Gide">
  <meta property="og:title" content="${pageTitle}">
  <meta property="og:description" content="${esc(app.lede)}">
  <meta property="og:url" content="${app.url}">
  <meta name="twitter:card" content="summary_large_image">

  <link rel="icon" type="image/png" href="assets/logo.png">
  <link rel="apple-touch-icon" href="assets/logo.png">
  <meta name="theme-color" content="${palette.primary}">

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap">

  <link rel="stylesheet" href="assets/css/app.css">
</head>
<body class="app-site">

<a class="skip-link" href="#main">Skip to content</a>

<header class="site-header" data-nav>
  <div class="wrap header-inner">

    <a class="brand" href="/">
      <img src="assets/logo.png" alt="" width="40" height="40" class="brand-mark">
      <span class="brand-name">${app.name}</span>
    </a>

    <nav class="nav-desktop" aria-label="Main">
      <ul>
        <li><a href="#features">Features</a></li>
        ${app.screenshots.length ? '<li><a href="#screens">Screens</a></li>' : ''}
        ${app.privacy ? '<li><a href="#privacy">Privacy</a></li>' : ''}
        ${app.faq.length ? '<li><a href="#faq">FAQ</a></li>' : ''}
        <li><a href="${site.domain}/support.html">Support</a></li>
      </ul>
    </nav>

    <div class="header-actions">
      ${app.store ? `<a class="btn btn-accent btn-sm nav-cta" href="${app.store}">Get the app</a>` : `<a class="btn btn-outline btn-sm nav-cta" href="${site.domain}/#apps">All Gide apps</a>`}
      <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="mobile-nav" aria-label="Open menu">
        <span class="nav-toggle-bars" aria-hidden="true"><i></i><i></i><i></i></span>
      </button>
    </div>

  </div>

  <div class="nav-panel" id="mobile-nav" hidden>
    <nav class="wrap" aria-label="Mobile">
      <ul class="nav-panel-primary">
        <li><a href="#features">Features</a></li>
        ${app.screenshots.length ? '<li><a href="#screens">Screens</a></li>' : ''}
        ${app.privacy ? '<li><a href="#privacy">Privacy</a></li>' : ''}
        ${app.faq.length ? '<li><a href="#faq">FAQ</a></li>' : ''}
      </ul>
      <ul class="nav-panel-secondary">
        <li><a href="${site.domain}/">All of Gide</a></li>
        <li><a href="${site.domain}/support.html">Support</a></li>
        <li><a href="${site.domain}/privacy.html">Privacy policy</a></li>
      </ul>
      ${app.store ? `<a class="btn btn-accent btn-block" href="${app.store}">Get the app</a>` : ''}
    </nav>
  </div>
</header>

<main id="main">

  <section class="hero app-hero">
    <div class="wrap">
      <span class="pill pill-${app.status}">${esc(app.statusLabel)}</span>
      <h1>${esc(app.headline)}</h1>
      <p class="lede">${esc(app.lede)}</p>
      <div class="btn-row">
        ${storeButton(app)}
        ${app.secondaryCta ? `<a class="btn btn-outline" href="${app.secondaryCta.href}">${esc(app.secondaryCta.label)}</a>` : `<a class="btn btn-outline" href="#features">See what it does</a>`}
      </div>
      ${app.heroNote ? `<p class="hero-note">${esc(app.heroNote)}</p>` : ''}
    </div>
  </section>

  <section class="section" id="features">
    <div class="wrap">
      <div class="section-head">
        <p class="eyebrow">${esc(app.sectionEyebrow || 'Features')}</p>
        <h2>${esc(app.sectionHeading || 'What it does.')}</h2>
        ${app.sectionBody ? `<p class="lede">${esc(app.sectionBody)}</p>` : ''}
      </div>
      <div class="grid grid-3">
${renderFeatures(app)}
      </div>
    </div>
  </section>
${renderScreenshots(app)}${renderSteps(app)}${renderPrivacy(app)}${renderCompanion(app)}${renderFaq(app)}
  <section class="section section-tight cta-band">
    <div class="wrap">
      <h2>${esc(app.cta.heading)}</h2>
      <p class="lede">${esc(app.cta.body)}</p>
      <div class="btn-row">
        ${storeButton(app)}
        <a class="btn btn-outline" href="${site.domain}/#apps">Explore all Gide apps</a>
      </div>
    </div>
  </section>

</main>

<footer class="site-footer">
  <div class="wrap">

    <div class="footer-top">
      <div class="footer-brand">
        <a class="brand brand-light" href="${site.domain}/">
          <img src="assets/logo.png" alt="" width="40" height="40" class="brand-mark" loading="lazy">
          <span class="brand-name">Gide</span>
        </a>
        <p class="footer-tagline">${site.tagline}</p>
        <p class="footer-blurb">${site.blurb}</p>
        <a class="footer-email" href="mailto:${site.email.support}">${site.email.support}</a>
      </div>

      <div class="footer-cols">
        <div class="footer-col">
          <h2>${app.name}</h2>
          <ul>
            <li><a href="#features">Features</a></li>
            ${app.privacy ? '<li><a href="#privacy">Privacy</a></li>' : ''}
            ${app.faq.length ? '<li><a href="#faq">FAQ</a></li>' : ''}
          </ul>
        </div>
        <div class="footer-col">
          <h2>Other apps</h2>
          <ul>
            ${otherApps}
          </ul>
        </div>
        <div class="footer-col">
          <h2>Help</h2>
          <ul>
            <li><a href="${site.domain}/support.html">Support</a></li>
            <li><a href="${site.domain}/contact.html">Contact</a></li>
            <li><a href="${site.domain}/delete-account.html">Delete account</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <h2>Legal</h2>
          <ul>
            <li><a href="${site.domain}/privacy.html">Privacy Policy</a></li>
            <li><a href="${site.domain}/terms.html">Terms of Use</a></li>
            <li><a href="${site.domain}/disclaimer.html">Disclaimer</a></li>
          </ul>
        </div>
      </div>
    </div>

    <div class="footer-bottom">
      <p>&copy; ${new Date().getFullYear()} Gide. All rights reserved.</p>
      <nav class="footer-legal" aria-label="Legal">
        <a href="${site.domain}/">gidehub.com</a>
      </nav>
    </div>

  </div>
</footer>

<script src="assets/js/nav.js" defer></script>
</body>
</html>
`;
}

/* ------------------------------------------------------------------ build */

function paletteCss(slug, p) {
  const wash = mix(p.accent, '#ffffff', 0.86);

  // Every token is derived against the real surfaces it appears on, then
  // verified by tools/check-contrast.mjs.
  const text = adjustUntil(mix(p.primary, '#000000', 0.1), ['#ffffff', p.secondary]);
  const muted = adjustUntil(mix(p.primary, '#ffffff', 0.42), ['#ffffff', p.secondary]);
  const accentText = adjustUntil(p.accent, ['#ffffff', p.secondary, wash]);
  const onInkMuted = adjustUntil(mix(p.primary, '#ffffff', 0.55), [p.primary]);
  const accentOnInk = adjustUntil(p.accent, [p.primary]);

  return `/* ${slug} palette — generated by tools/build-app-sites.mjs.
   Do not edit here: edit src/data/palettes.json in the main Gide site repo
   and re-run the generator. Contrast is verified by tools/check-contrast.mjs. */
:root {
  --ink: ${p.primary};
  --ink-soft: ${mix(p.primary, '#ffffff', 0.18)};
  --cream: ${p.secondary};
  --cream-deep: ${mix(p.secondary, p.primary, 0.08)};
  --gold: ${p.accent};
  --gold-bright: ${mix(p.accent, '#ffffff', 0.25)};
  --gold-text: ${accentText};
  --gold-ink: ${inkOn(p.accent)};
  --gold-wash: ${wash};
  --line: ${mix(p.secondary, p.primary, 0.12)};
  --line-strong: ${mix(p.secondary, p.primary, 0.26)};
  --text: ${text};
  --text-muted: ${muted};
  --text-on-dark-muted: ${onInkMuted};
  --accent-on-ink: ${accentOnInk};
}

/* On this app's dark surface the raw accent can be too low-contrast, so
   anything that reads as text there uses the lightened variant. */
.section-ink .eyebrow,
.section-ink a,
.footer-email { color: var(--accent-on-ink); }

/* The accent button uses this app's own accent rather than Gide gold. */
.btn-accent {
  background: var(--gold);
  color: var(--gold-ink);
  box-shadow: var(--shadow-sm);
}
.btn-accent:hover { background: var(--gold-bright); box-shadow: var(--shadow); }

.app-hero {
  background:
    radial-gradient(55rem 28rem at 70% -10%, var(--gold-wash), transparent 70%),
    linear-gradient(180deg, var(--cream) 0%, var(--white) 100%);
  text-align: center;
}
.app-hero .pill { margin-bottom: var(--sp-6); }
.app-hero .btn-row { justify-content: center; }

.feature-card { align-items: flex-start; }
.feature-icon {
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: var(--gold-wash);
  color: var(--gold-text);
  font-size: 1.35rem;
  margin-bottom: var(--sp-2);
}

/* Screenshot strip */
.shot-row {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(11rem, 1fr);
  gap: var(--sp-6);
  overflow-x: auto;
  padding-bottom: var(--sp-4);
  scroll-snap-type: x mandatory;
}
.shot { scroll-snap-align: start; margin: 0; }
.shot img {
  width: 100%;
  border-radius: var(--radius);
  border: 1px solid var(--line);
  box-shadow: var(--shadow);
  background: var(--cream);
}
.shot figcaption {
  margin-top: var(--sp-3);
  text-align: center;
  font-size: var(--fs-sm);
  color: var(--text-muted);
}

@media (max-width: 720px) {
  .shot-row { grid-auto-columns: minmax(9.5rem, 1fr); }
}
`;
}

const built = [];

for (const file of readdirSync(join(ROOT, 'src/data/apps')).sort()) {
  if (!file.endsWith('.json')) continue;
  const app = JSON.parse(readFileSync(join(ROOT, 'src/data/apps', file), 'utf8'));
  const repo = join(GITHUB, app.repo);

  if (!existsSync(repo)) {
    console.log(`${app.slug.padEnd(8)} SKIP - repo not cloned at ${app.repo}`);
    continue;
  }

  const palette = palettes[app.slug];
  mkdirSync(join(repo, 'assets/css'), { recursive: true });
  mkdirSync(join(repo, 'assets/js'), { recursive: true });

  writeFileSync(join(repo, 'index.html'), renderPage(app, palette));
  writeFileSync(join(repo, 'assets/css/app.css'), baseCss + '\n\n' + paletteCss(app.slug, palette));
  writeFileSync(join(repo, 'assets/js/nav.js'), navJs);

  // Right-sized logo, taken from the main repo.
  const logoSrc = join(ROOT, `assets/images/logos/G-${app.slug}-128.png`);
  if (existsSync(logoSrc)) copyFileSync(logoSrc, join(repo, 'assets/logo.png'));

  built.push(`${app.slug.padEnd(8)} -> ${app.repo}  (${app.features.length} features, ${app.screenshots.length} screens, ${app.faq.length} FAQ)`);
}

console.log('Built app sites:\n  ' + built.join('\n  '));
