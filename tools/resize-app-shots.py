"""Builds web-sized WebP screenshots for each app site.

Reads the full-size PNGs sitting in each app repo and writes 800px-tall WebP
copies into that repo's assets/shots/ folder. Originals are left alone.

    python tools/resize-app-shots.py
"""

import json
import os
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
GITHUB = os.path.dirname(ROOT)

APPS_DIR = os.path.join(ROOT, "src", "data", "apps")

total_before = 0
total_after = 0

for name in sorted(os.listdir(APPS_DIR)):
    if not name.endswith(".json"):
        continue
    app = json.load(open(os.path.join(APPS_DIR, name), encoding="utf-8"))
    shots = app.get("screenshots") or []
    if not shots:
        print(f"{app['slug']:8s} no screenshots")
        continue

    repo = os.path.join(GITHUB, app["repo"])
    out_dir = os.path.join(repo, "assets", "shots")
    os.makedirs(out_dir, exist_ok=True)

    for shot in shots:
        src = os.path.join(repo, shot["src"])
        if not os.path.exists(src):
            print(f"  {app['slug']:8s} MISSING {shot['src']}")
            continue

        stem = os.path.splitext(os.path.basename(shot["src"]))[0].lower()
        dst = os.path.join(out_dir, stem + ".webp")

        img = Image.open(src).convert("RGB")
        w, h = img.size
        scale = min(1.0, 800 / h)
        out = img.resize((round(w * scale), round(h * scale)), Image.LANCZOS)
        out.save(dst, "WEBP", quality=80, method=6)

        before = os.path.getsize(src)
        after = os.path.getsize(dst)
        total_before += before
        total_after += after
        shot["webp"] = f"assets/shots/{stem}.webp"
        shot["w"], shot["h"] = out.size
        print(
            f"  {app['slug']:8s} {shot['src']:20s} {before/1024:8.0f} KB -> "
            f"{out.size[0]}x{out.size[1]} {after/1024:6.0f} KB"
        )

    # Record the generated paths so the site generator can reference them.
    json.dump(app, open(os.path.join(APPS_DIR, name), "w", encoding="utf-8"), indent=2)

print(f"\nscreenshots: {total_before/1024/1024:.1f} MB -> {total_after/1024:.0f} KB")
