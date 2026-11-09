# Website update — November 9, 2026

The website source was refreshed after checking the public sites and their repositories.

## Changes

- Added Sudoku at /games/sudoku/ and linked it throughout the app catalog and shared footers. The separate gide-sudoku-site repository now has a mirror; sudoku.gidehub.com was not serving a working page during this audit, so navigation uses the hub URL.
- Added in-development story pages for Brightstar and Ethan Ellis' New Base Adventure. No manuscript excerpts or release dates are published.
- Added Alien Outlaw to the hub navigation. Its independent website now has a full Crop Circles landing page plus dedicated support and privacy pages.
- Updated Legacy's App Store link and regenerated Roots' current sharing description.
- Regenerated the existing Calm, Faith, Guard, Stride, Legacy, Roots, Solitaire, FreeCell and Reversi pages with the expanded app navigation.
- Removed outdated blanket claims about the number of apps and universal account requirements.

## Source and validation

Edit src/data and src/pages, then run node build.mjs. Regenerate the nine shared app sites with node tools/build-app-sites.mjs. The custom Alien Outlaw page lives in gide-alien-outlaw-site. Sudoku's primary source is src/pages/games/sudoku/index.html; the mirror repository README documents its copy process.

Validation checked 40 public/generated HTML files for local links, image paths, fragment targets, image alt text, headings and unresolved template placeholders. The shared app palette checker passed all nine palettes. Alien Outlaw and Sudoku layouts were inspected at desktop and phone widths, with no horizontal overflow at 375 CSS pixels.

All ten independent app website deployments passed. The hub's first publication built successfully but timed out while GitHub Pages synced the approximately 152 MB existing media bundle; its failed deployment was retried. This documentation commit starts a fresh Pages publication after that retry remained queued. Podcasts, videos, books and downloads were retained.

Check the latest Pages action and the live site before treating a source commit as deployed.
