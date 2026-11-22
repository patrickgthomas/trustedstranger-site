# Gide website — publication checkpoint

- Authoritative branch: `main` in `patrickgthomas/trustedstranger-site`.
  `CNAME` and live content confirm this serves `gidehub.com`.
- Published catalog implementation: `3ff5a40`. The `/more/` page is live and was
  verified over HTTPS with seven direct App Store links, including Alien Outlaw
  (`6832376810`). The development branch was fast-forwarded into main.
- Includes two released games and five other apps, original Gide branding and
  verified store listings. Alien Outlaw's homepage card now has its published
  icon and store link, replacing its coming-soon copy.
- Maintenance: edit `src/data/site.json`, then run `node build.mjs`. A nonempty
  verified `store` URL is required for a catalog entry. The dedicated layout is
  `src/layouts/catalog.html`; the other pages retain their layout.
- Validation: static build, JavaScript syntax, official store listings, browser
  checks at 320/390/768/1280 widths, 200% text, keyboard navigation, images and
  section links. Phone/desktop previews inspected; live page returned HTTP 200.
- Companion app: King Edmund’s Solitaire is pushed to its main branch at
  `aa05982`, with a Settings link to this URL. Local checks pass (114 tests and
  clean analysis). Codemagic build `6af403096f37641a0017a5b6` has since passed
  iOS signing, archive and App Store Connect publishing. Apple processing and
  real-device TestFlight verification remain pending.
- Next action: maintain published catalog data as apps are released. No pending
  website deployment or unmerged feature work remains for this catalog.

## Inspector Quill’s Sudoku trailer — November 21, 2026

- The initial trailer publication used `/games/sudoku/`; source is
  `src/pages/games/sudoku/index.html` on `main`. Baseline: `587daaf`.
- Replaced the illustrated placeholder board with the approved 32-second
  marketing video and a 53 KB poster from its closing artwork. The native
  player has visible controls, inline mobile playback and metadata-only preload;
  it does not autoplay. Full video playback is user initiated.
- Updated the page’s hero and metadata to Inspector Quill’s Sudoku. Shared
  navigation, footer and existing feature sections remain intact.
- Build and narrow video/mobile checks are documented in the publication
  result; GitHub Pages publishes the generated root HTML from `main`.

## Sudoku subdomain promotion — November 21, 2026

- Canonical URL: `https://sudoku.gidehub.com/`. This uses the existing
  `patrickgthomas/gide-sudoku-site` repo, `main`; preparation baseline is
  `2ee66c4a6c21c259e2d28753693789c1614ed532`. The main site's source baseline is
  `1df440cf6fa3202848ac1594725dcb063ba642fc`.
- The Sudoku source remains `src/pages/games/sudoku/index.html`. Build the hub,
  then run `node tools/build-sudoku-site.mjs` to export the current page, trailer
  links and Pages domain files to the sibling Sudoku website clone. Shared
  CSS, navigation, poster and video remain hosted on `gidehub.com`.
- The hub changes use Inspector Quill's current name and subdomain in
  the registry and shared footer. The old `/games/sudoku/` URL forwards browser
  visits with query/fragment preserved and retains content as a no-JavaScript
  fallback; its canonical URL points at the subdomain.
- Sudoku site published at `f2c560cb87b67bb34d6348138585c26da7a85d9a`;
  Pages deployment `44983988747` succeeded. Pages serves `main` / root,
  the custom domain passed its DNS check, and Enforce HTTPS is enabled.
- Verified the subdomain over HTTPS (HTTP 200), correct Quill page and poster,
  and native trailer playback: 32-second duration, playback advanced beyond
  11 seconds, ready state 4 and no media error. Shared video returned HTTP 200.
  Child-site verification was completed before publishing these hub links and
  forwarding changes. Local static build and narrow URL/forwarding checks pass.
