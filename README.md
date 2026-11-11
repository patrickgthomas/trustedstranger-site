# Gide website

The main Gide site, served at [gidehub.com](https://gidehub.com/) via GitHub Pages,
plus the tooling that generates the six per-app subdomain sites.

Current publication checkpoint: [PROJECT_STATUS.md](PROJECT_STATUS.md).

## More from Gide

`https://gidehub.com/more/` is the dedicated catalog opened from app Settings.
It has a minimal layout, two sections (Games and Other apps), and direct store
links. Listings come from the same `src/data/site.json` registry as the homepage:

- `catalogGroup`: `games` or `apps`.
- `catalogSummary`: a short description for this page.
- `store`: a verified, public App Store URL. Empty values hide upcoming apps.

To add or update a listing, edit that registry, run `node build.mjs`, review the
generated `more/index.html` and homepage changes, then publish the website.
Apps already pointing to `/more/` need no release for catalog-only updates.
The catalog currently lists seven verified App Store releases, including Alien
Outlaw: Crop Circles. Android store buttons can be added when verified URLs are
available. Do not list unreleased products as downloads.

The page uses `src/layouts/catalog.html` and `assets/css/catalog.css`; the other
pages keep their existing layout. Maintain the source, not generated HTML.

## Building

    node build.mjs            # build the main site
    node build.mjs --serve    # build, then preview on http://localhost:4321

Pages are authored in `src/pages/**.html`, each starting with a JSON meta block,
and are wrapped in `src/layouts/base.html` with the shared header and footer.
Output is written as plain static HTML to the repo root, so GitHub Pages needs no
build step of its own. **Do not edit the generated HTML at the repo root** — edit
`src/` and rebuild.

`sitemap.xml` and `robots.txt` are generated too, so they cannot drift from the
real pages. Shared content — apps, books, podcast episodes, nav and footer links —
lives in `src/data/site.json`.

## The app subdomain sites

    node tools/build-app-sites.mjs     # regenerate all six app sites
    node tools/serve-app-sites.mjs     # preview them on http://localhost:4322
    node tools/check-contrast.mjs      # verify every palette against WCAG AA
    python tools/resize-app-shots.py   # rebuild web-sized screenshots

Each app site is generated from `src/data/apps/<slug>.json` plus its brand palette
in `src/data/palettes.json`, and written into that app's own repo as a sibling
directory of this one.

## Images

`tools/resize-app-shots.py` and the sized variants under `assets/images/` keep the
page weight down. Originals are kept; the pages reference the sized copies.
