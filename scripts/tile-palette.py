"""Extract the design palette of every emblem, and sort the whole library by colour.

The naive approach counts antialiased edge pixels as design colours: a black
glyph on red produces a run of intermediate dark-reds, each of which survives a
small merge threshold, so a two-colour tile reports five. Two rules fix that.

  1. Merge aggressively. Design colours in this set are far apart; anything
     within MERGE units of a kept colour is the same colour.
  2. Reject blends. A pixel colour produced by antialiasing A against B lies on
     the line segment between them. Real design colours almost never do, so a
     candidate close to segment AB is discarded as an edge artifact.

Covers every mark in web/emblems, not just the flattened tiles: rasters are
sampled, SVGs have their fills and strokes read out of the source. Marks that
are white-on-transparent are flagged so the picker can give them a dark ground
instead of rendering them invisible on paper.
"""
import colorsys
import json
import re
import sys
from collections import Counter
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "web" / "emblems"
OUT = ROOT / "web" / "emblem-thumbs" / "tile-palette.json"

RASTER = {".png", ".jpg", ".jpeg", ".webp"}
MERGE = 62.0        # RGB units; below this two colours are the same colour
BLEND_DIST = 26.0   # RGB units from segment AB before a colour is called a blend
MIN_SHARE = 0.008   # a design colour holds at least 0.8% of the visible mark
VISIBLE_ALPHA = 32
MAX_COLORS = 16

HEX = re.compile(r"#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b")
NAMED = {"black": (0, 0, 0), "white": (255, 255, 255), "red": (255, 0, 0),
         "none": None, "currentColor": None}


def _seg_dist(c, a, b):
    ab = b - a
    denom = float(ab @ ab)
    if denom < 1e-9:
        return float(np.linalg.norm(c - a))
    t = max(0.0, min(1.0, float((c - a) @ ab) / denom))
    return float(np.linalg.norm(c - (a + t * ab)))


def _reduce(candidates):
    """candidates: [(rgb tuple, share)] most common first."""
    kept, shares = [], []
    for col, share in candidates:
        if share < MIN_SHARE and kept:
            continue
        c = np.array(col, np.float64)
        if any(np.linalg.norm(c - k) < MERGE for k in kept):
            continue
        if any(_seg_dist(c, kept[i], kept[j]) < BLEND_DIST
               for i in range(len(kept)) for j in range(i + 1, len(kept))):
            continue
        kept.append(c)
        shares.append(share)
        if len(kept) >= MAX_COLORS:
            break
    return [tuple(int(v) for v in k) for k in kept], shares


def raster_palette(path):
    im = Image.open(path).convert("RGBA")
    arr = np.array(im)
    rgb = arr[..., :3].reshape(-1, 3)
    alpha = arr[..., 3].reshape(-1)
    vis = rgb[alpha > VISIBLE_ALPHA]
    if not len(vis):
        return [], [], False
    counts = Counter(map(tuple, vis))
    total = len(vis)
    pal, shares = _reduce([(c, n / total) for c, n in counts.most_common()])
    # a mark is unusable on paper when nearly all of it is near-white
    light = sum(s for c, s in zip(pal, shares) if min(c) > 205)
    return pal, shares, light > 0.85


def svg_palette(path):
    """Colours declared in the source. These marks are hand-authored and flat."""
    txt = path.read_text(encoding="utf-8", errors="ignore")
    cols = []
    for m in HEX.finditer(txt):
        h = m.group(1)
        if len(h) == 3:
            h = "".join(ch * 2 for ch in h)
        cols.append(tuple(int(h[i:i + 2], 16) for i in (0, 2, 4)))
    for name, rgb in NAMED.items():
        if rgb and re.search(rf'"{name}"', txt):
            cols.append(rgb)
    if not cols and re.search(r"<(path|circle|rect|polygon|ellipse|g)\b", txt):
        # no colour declared anywhere: SVG's initial fill is black
        cols = [(0, 0, 0)]
    if not cols:
        return [], [], False
    counts = Counter(cols)
    total = sum(counts.values())
    pal, shares = _reduce([(c, n / total) for c, n in counts.most_common()])
    return pal, shares, False


def accent(pal, shares):
    best, best_share = None, -1.0
    for c, s in zip(pal, shares):
        r, g, b = [v / 255 for v in c]
        h, l, sat = colorsys.rgb_to_hls(r, g, b)
        if sat > 0.22 and 0.10 < l < 0.92 and s > best_share:
            best, best_share = (h, l, sat, c), s
    if best:
        return dict(hue=best[0], light=best[1], sat=best[2], rgb=list(best[3]), neutral=False)
    c = pal[0] if pal else (0, 0, 0)
    r, g, b = [v / 255 for v in c]
    h, l, s = colorsys.rgb_to_hls(r, g, b)
    return dict(hue=h, light=l, sat=s, rgb=list(c), neutral=True)


def main():
    rows, skipped = [], []
    for f in sorted(SRC.rglob("*")):
        if not f.is_file():
            continue
        ext = f.suffix.lower()
        try:
            if ext in RASTER:
                pal, shares, pale = raster_palette(f)
            elif ext == ".svg":
                pal, shares, pale = svg_palette(f)
            else:
                continue
        except Exception as exc:
            skipped.append(f"{f.name}: {exc}")
            continue
        if not pal:
            skipped.append(f"{f.name}: no visible colour")
            continue
        rel = f.relative_to(SRC).as_posix()
        rows.append(dict(file=rel, folder=(f.parent.name if f.parent != SRC else "(root)"),
                         kind="svg" if ext == ".svg" else "raster",
                         colors=len(pal), palette=[list(c) for c in pal],
                         needsDark=pale, **accent(pal, shares)))

    rows.sort(key=lambda r: (r["neutral"], round(r["hue"] * 24), -r["sat"], r["light"]))
    OUT.write_text(json.dumps(rows, indent=0), encoding="utf-8")

    import statistics
    n = [r["colors"] for r in rows]
    print(f"{len(rows)} marks -> {OUT.name}   ({sum(1 for r in rows if r['kind']=='svg')} svg)")
    print(f"  colours: median {statistics.median(n):.0f}  mean {statistics.mean(n):.1f}  max {max(n)}")
    print(f"  exactly 2: {sum(1 for x in n if x == 2)}   3: {sum(1 for x in n if x == 3)}"
          f"   4: {sum(1 for x in n if x == 4)}   5+: {sum(1 for x in n if x >= 5)}")
    print(f"  neutral: {sum(1 for r in rows if r['neutral'])}"
          f"   need a dark ground: {sum(1 for r in rows if r['needsDark'])}")
    if skipped:
        print(f"  skipped {len(skipped)}:")
        for s in skipped[:10]:
            print(f"    {s}")


if __name__ == "__main__":
    sys.exit(main())
