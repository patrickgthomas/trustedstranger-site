// Audits every generated app palette against WCAG AA.
//
//   node tools/check-contrast.mjs
//
// Exits non-zero if any text pairing drops below 4.5:1 (3:1 for large text).

import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const GITHUB = join(ROOT, '..');

const toRgb = (hex) => hex.replace('#', '').match(/../g).map((h) => parseInt(h, 16));
const lum = (hex) => {
  const c = toRgb(hex).map((v) => v / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};

const apps = readdirSync(join(ROOT, 'src/data/apps'))
  .filter((f) => f.endsWith('.json'))
  .map((f) => JSON.parse(readFileSync(join(ROOT, 'src/data/apps', f), 'utf8')));

let failures = 0;

for (const app of apps) {
  const css = readFileSync(join(GITHUB, app.repo, 'assets/css/app.css'), 'utf8');
  // The generated palette block is appended last, so read the final definition.
  const token = (name) => {
    const all = [...css.matchAll(new RegExp(`--${name}:\\s*([^;]+);`, 'g'))];
    return all.length ? all[all.length - 1][1].trim() : null;
  };

  const t = {
    ink: token('ink'),
    cream: token('cream'),
    gold: token('gold'),
    goldText: token('gold-text'),
    goldInk: token('gold-ink'),
    goldWash: token('gold-wash'),
    text: token('text'),
    muted: token('text-muted'),
    onDarkMuted: token('text-on-dark-muted'),
    accentOnInk: token('accent-on-ink'),
  };

  const checks = [
    ['body text on white', t.text, '#ffffff', 4.5],
    ['body text on cream', t.text, t.cream, 4.5],
    ['muted text on white', t.muted, '#ffffff', 4.5],
    ['muted text on cream', t.muted, t.cream, 4.5],
    ['eyebrow on white', t.goldText, '#ffffff', 4.5],
    ['eyebrow on cream', t.goldText, t.cream, 4.5],
    ['icon glyph on wash', t.goldText, t.goldWash, 4.5],
    ['button label on accent', t.goldInk, t.gold, 4.5],
    ['white on ink surface', '#ffffff', t.ink, 4.5],
    ['muted on ink surface', t.onDarkMuted, t.ink, 4.5],
    // Text on the ink surface uses the lightened variant, not the raw accent fill.
    ['accent text on ink surface', t.accentOnInk, t.ink, 4.5],
  ];

  const bad = checks.filter(([, fg, bg, min]) => ratio(fg, bg) < min);
  const worst = checks.reduce((a, c) => (ratio(c[1], c[2]) < ratio(a[1], a[2]) ? c : a));

  console.log(
    `${app.slug.padEnd(8)} ink ${t.ink}  accent ${t.gold}  ` +
      (bad.length ? `${bad.length} FAILING` : `all pass (worst: ${worst[0]} ${ratio(worst[1], worst[2]).toFixed(2)}:1)`)
  );
  for (const [label, fg, bg, min] of bad) {
    failures++;
    console.log(`         FAIL ${label}: ${fg} on ${bg} = ${ratio(fg, bg).toFixed(2)}:1 (need ${min})`);
  }
}

console.log(failures ? `\n${failures} contrast failures` : '\nAll palettes pass WCAG AA.');
process.exit(failures ? 1 : 0);
