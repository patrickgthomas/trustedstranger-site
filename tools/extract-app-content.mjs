// Reads the old per-app sites and captures their copy as JSON, so the rebuilt
// app sites can be generated from data instead of hand-edited in six repos.
//
//   node tools/extract-app-content.mjs

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const GITHUB = join(ROOT, '..');

export const APP_REPOS = {
  guard: 'trustedstranger-guard',
  calm: 'trustedstranger-calm',
  faith: 'trustedstranger-faith',
  stride: 'trustedstranger-stride',
  legacy: 'Gide-Legacy',
  roots: 'Gide-Roots-Website',
};

const clean = (s) =>
  s
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .replace(/Trusted\s+Stranger/gi, 'Gide')
    .replace(/trustedstranger\.app/gi, 'gidehub.com')
    .trim();

const site = JSON.parse(readFileSync(join(ROOT, 'src/data/site.json'), 'utf8'));

mkdirSync(join(ROOT, 'src/data/apps'), { recursive: true });

for (const [slug, repo] of Object.entries(APP_REPOS)) {
  const dir = join(GITHUB, repo);
  const file = join(dir, 'index.html');
  if (!existsSync(file)) {
    console.log(`${slug.padEnd(8)} SKIP - no index.html in ${repo}`);
    continue;
  }

  const html = readFileSync(file, 'utf8');
  const meta = site.apps.find((a) => a.slug === slug);

  // Hero
  const hero = html.match(/<section class="[^"]*hero[^"]*">([\s\S]*?)<\/section>/i);
  const heroBlock = hero ? hero[1] : '';
  const h1 = heroBlock.match(/<h1>([\s\S]*?)<\/h1>/i);
  const heroP = heroBlock.match(/<h1>[\s\S]*?<\/h1>\s*<p>([\s\S]*?)<\/p>/i);

  // Feature cards
  const features = [
    ...html.matchAll(
      /<article class="app-card">\s*<div class="app-icon">([\s\S]*?)<\/div>\s*<h3>([\s\S]*?)<\/h3>\s*<p>([\s\S]*?)<\/p>/gi
    ),
  ].map((m) => ({ icon: clean(m[1]), title: clean(m[2]), body: clean(m[3]) }));

  // Screenshots
  const screenshots = [
    ...html.matchAll(
      /<figure class="screenshot-card">\s*<img src="([^"]+)" alt="([^"]*)">\s*<figcaption>([\s\S]*?)<\/figcaption>/gi
    ),
  ].map((m) => ({ src: m[1], alt: clean(m[2]), caption: clean(m[3]) }));

  // FAQ
  const faq = [
    ...html.matchAll(/<div class="faq-item">\s*<dt>([\s\S]*?)<\/dt>\s*<dd>([\s\S]*?)<\/dd>/gi),
  ].map((m) => ({ q: clean(m[1]), a: clean(m[2]) }));

  // Closing call to action
  const cta = html.match(/<section class="final-cta">([\s\S]*?)<\/section>/i);
  const ctaBlock = cta ? cta[1] : '';
  const ctaH2 = ctaBlock.match(/<h2>([\s\S]*?)<\/h2>/i);
  const ctaP = ctaBlock.match(/<h2>[\s\S]*?<\/h2>\s*<p>([\s\S]*?)<\/p>/i);

  // Any PNG in the repo root that is not the logo is a usable screenshot.
  const available = readdirSync(dir).filter(
    (f) => /\.(png|webp|jpg)$/i.test(f) && !/^G-/.test(f)
  );

  const data = {
    slug,
    repo,
    name: meta.name,
    url: meta.url,
    store: meta.store,
    status: meta.status,
    statusLabel: meta.statusLabel,
    headline: h1 ? clean(h1[1]) : meta.tagline,
    lede: heroP ? clean(heroP[1]) : meta.summary,
    features,
    screenshots,
    faq,
    cta: {
      heading: ctaH2 ? clean(ctaH2[1]) : 'Get started with ' + meta.name,
      body: ctaP ? clean(ctaP[1]) : meta.summary,
    },
    imagesInRepo: available,
  };

  writeFileSync(join(ROOT, 'src/data/apps', `${slug}.json`), JSON.stringify(data, null, 2) + '\n');
  console.log(
    `${slug.padEnd(8)} features=${features.length} screenshots=${screenshots.length} faq=${faq.length} images=${available.length}`
  );
}
