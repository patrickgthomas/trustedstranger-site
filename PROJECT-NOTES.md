# Gide site requirements

Standing requirements for every future website update.

## Brand

- The brand is **Gide**. "Trusted Stranger" is retired and must not reappear in
  copy, titles, metadata, or links.
- The domain is **gidehub.com**. Every link points there.
- Keep the Gide logo in the header of every page, linking back to
  `https://gidehub.com/`.

## Footer

- Every public page carries the standard Gide footer: brand, app links,
  books and resources, company links, support email, legal links, copyright.
- Keep footer navigation and app availability accurate across every page.

## App destinations

- Gide Guard: `https://guard.gidehub.com/`
- Gide Calm: `https://calm.gidehub.com/`
- Gide Faith: `https://faith.gidehub.com/`
- Gide Stride: `https://stride.gidehub.com/`
- Gide Legacy: `https://legacy.gidehub.com/`
- Gide Roots: `https://roots.gidehub.com/`

The old `/apps/<slug>/` URLs are kept as `noindex` redirects to these subdomains
so existing links do not break.

Books, resources, the podcast, and the blog stay as paths on `gidehub.com` rather
than getting their own subdomains, so search authority stays consolidated on one
domain.

## Current availability

- Gide Guard: available on the App Store.
- Gide Calm: available on the App Store.
- Gide Faith: available on the App Store.
- Gide Stride: in App Store review and testing.
- Gide Legacy: in development.
- Gide Roots: coming soon to Android and iOS.

Availability is stored once, in `src/data/site.json`. Update it there.

## Design rules

These came out of a rebuild after a reviewer said the old site was poor. Measured
problems then: no mobile navigation at all below 900px, 12.5px body text, 22
distinct font sizes, and a 5.2 MB homepage. Do not reintroduce them.

- **One type scale.** Six steps, defined as `--fs-*` tokens. Body text is 17px.
  Playfair Display is for display headings only; Inter for everything else.
  No font weight above 700.
- **Mobile navigation is required.** Never hide the nav without a working
  replacement. The menu button and panel live in `src/partials/header.html`.
- **Tap targets are at least 44px**, 40px for dense footer link lists.
- **Gold `#D4AF37` is a fill colour, not a text colour.** It fails AA on white
  (2.1:1). Use `--gold-text` for small gold type on light surfaces.
  `tools/check-contrast.mjs` enforces this across every app palette.
- **Alternating section surfaces** (white / cream / ink) so the page reads as
  chapters rather than one long scroll.
- **Page weight under 500 KB.** Every image gets explicit `width`/`height`,
  `loading="lazy"` below the fold, and a size variant matching its display size.
- **One `h1` per page**, a unique `<title>`, a meta description, and a canonical
  URL. `build.mjs` supplies the canonical automatically.

## Editing rules

- The HTML at the repo root is generated. Edit `src/` and run `node build.mjs`.
- The six app sites are generated into their own repos. Edit
  `src/data/apps/<slug>.json` and run `node tools/build-app-sites.mjs`.
- Brand palettes live in `src/data/palettes.json`, taken from the official Gide
  brand cards. After changing one, re-run the generator and
  `node tools/check-contrast.mjs`.
