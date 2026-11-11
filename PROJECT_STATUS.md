# Gide website — publication checkpoint

- Live source: `patrickgthomas/trustedstranger-site`, `main`, baseline `a004630`.
  `CNAME` and live content confirm this serves `gidehub.com`; the older review
  branch is behind main and there are no open PRs.
- Prepared branch: `codex/more-from-gide`.
- Change: `/more/` catalog with two released games and five other apps, using
  original Gide branding and direct verified App Store links. Alien Outlaw's
  homepage card now links to its released listing and uses its published icon.
- Maintenance: update `src/data/site.json` and run `node build.mjs`. A nonempty
  verified `store` URL is required for a catalog entry. No unrelated pages changed.
- Validated: static build, JavaScript syntax, seven official store listings,
  browser checks at 320/390/768/1280 widths, 200% text, keyboard navigation,
  local images and section links. Phone and desktop previews inspected.
- Authorization: Patrick explicitly requested publication. Commit/push to main
  and verify `https://gidehub.com/more/` after GitHub Pages deployment.
- Companion change: King Edmund’s Solitaire has a local Settings link to this
  URL. Its native build/TestFlight work is tracked in the app repository.
- Resume: after publishing, record the deployment commit and confirm the live
  page contains seven store links, including app ID `6832376810`.
