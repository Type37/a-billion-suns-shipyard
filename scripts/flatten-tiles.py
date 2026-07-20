"""Flatten the tile set to its actual design palette.

The tiles arrive as resampled/compressed raster: a median of 453 distinct RGB
values each, where roughly 15% of pixels are edge fringe rather than design
colour. That fringe is why they cannot be tinted or scaled. This finds the
colours a tile is genuinely made of, then snaps every pixel to the nearest one,
which leaves flat art with a countable palette.

Adaptive rather than fixed-k: a two-colour stencil keeps two colours, a noisy
Armageddon tile keeps as many as it actually uses.
"""
import sys
from collections import Counter
from pathlib import Path

import numpy as np
from PIL import Image

SRC = Path(r"C:/Users/wongj/Downloads/updated-emblems-shit-marathon")
DST = Path(r"D:/wargaming/Web Apps/ABS-V2/web/emblems/tiles")

MERGE_DIST = 40.0   # squared-distance threshold for treating two colours as one
MIN_SHARE = 0.004   # a colour must hold 0.4% of the tile to be a design colour
MAX_COLORS = 24     # ceiling for the genuinely painterly tiles
EXPLAIN_DIST = 900.0  # squared RGB distance counted as 'this pixel is that colour'
EXPLAIN_MIN = 0.90    # below this, the tile is textured and needs median-cut
VISIBLE_ALPHA = 32    # a pixel counts as visible art above this alpha


def design_palette(im, rgb, alpha):
    """Colours the tile is actually built from, most common first.

    Median-cut first, so dithered and textured art is represented by the
    clusters it actually occupies rather than by its individual pixel values.
    Counting raw values instead loses any region built from noise: every single
    shade falls under the share threshold and the whole region snaps away.
    """
    # Anything visible counts, not just fully opaque pixels. Some tiles draw
    # whole elements at low alpha (sticker 12's shield sits at alpha 64), and
    # sampling only opaque pixels drops those elements out of the palette.
    op = rgb[alpha > VISIBLE_ALPHA]
    if not len(op):
        return np.zeros((1, 3), np.float64)

    # Pass 1: the colours the tile literally spends most of its pixels on.
    # Correct for flat stencil art, which is most of the set.
    counts = Counter(map(tuple, op))
    total = len(op)
    kept = []
    for col, n in counts.most_common():
        if n / total < MIN_SHARE and kept:
            continue          # skip, do not stop: later entries may still qualify
        c = np.array(col, np.float64)
        if any(((c - k) ** 2).sum() < MERGE_DIST for k in kept):
            continue
        kept.append(c)
        if len(kept) >= MAX_COLORS:
            break
    pal = np.array(kept)

    # How much of the tile does that palette actually explain? Flat art is
    # explained almost entirely; dithered or textured art is not, because its
    # regions are built from many individually-rare values.
    d = ((op[:, None, :] - pal[None, :, :]) ** 2).sum(axis=2)
    explained = (d.min(axis=1) < EXPLAIN_DIST).mean()
    if explained >= EXPLAIN_MIN:
        return pal

    # Pass 2: textured art. Median-cut finds the clusters those regions occupy.
    q = im.convert("RGB").quantize(colors=MAX_COLORS, method=Image.MEDIANCUT, dither=Image.NONE)
    mpal = np.array(q.getpalette()[: MAX_COLORS * 3], np.float64).reshape(-1, 3)
    share = np.bincount(
        ((op[:, None, :] - mpal[None, :, :]) ** 2).sum(axis=2).argmin(axis=1),
        minlength=len(mpal),
    ) / total
    kept = []
    for i in np.argsort(-share):
        if share[i] < MIN_SHARE and kept:
            continue
        c = mpal[i]
        if any(((c - k) ** 2).sum() < MERGE_DIST for k in kept):
            continue
        kept.append(c)
    return np.array(kept)


def flatten(path, out):
    im = Image.open(path).convert("RGBA")
    arr = np.array(im)
    rgb = arr[..., :3].reshape(-1, 3).astype(np.float64)
    alpha = arr[..., 3].reshape(-1)

    pal = design_palette(im, rgb, alpha)
    # nearest palette entry for every pixel
    d = ((rgb[:, None, :] - pal[None, :, :]) ** 2).sum(axis=2)
    snapped = pal[d.argmin(axis=1)].astype(np.uint8)

    # Only RGB is flattened. Alpha is left exactly as authored: the fringe
    # problem is in the colour channels, and binarising alpha destroys elements
    # that were deliberately drawn semi-transparent.
    flat = arr.copy()
    flat[..., :3] = snapped.reshape(arr.shape[0], arr.shape[1], 3)

    out.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(flat, "RGBA").save(out)

    before = len(set(map(tuple, rgb[alpha > VISIBLE_ALPHA].astype(np.uint8))))
    after = len(pal)
    return before, after


def main():
    files = sorted(SRC.rglob("*.png"))
    befores, afters = [], []
    for f in files:
        rel = f.relative_to(SRC)
        # flatten the folder structure; the group is kept as a filename prefix
        group = rel.parent.name.lower().replace(" ", "-") or "misc"
        name = rel.stem.replace("pfp ", "p").replace("sticker ", "s")
        name = name.replace("(", "").replace(")", "").strip()
        out = DST / f"{group}-{name}.png" if group != "." else DST / f"{name}.png"
        b, a = flatten(f, out)
        befores.append(b)
        afters.append(a)

    import statistics
    print(f"flattened {len(files)} tiles -> {DST}")
    print(f"  exact colours before: median {statistics.median(befores):.0f}, max {max(befores)}")
    print(f"  exact colours after:  median {statistics.median(afters):.0f}, max {max(afters)}")
    print(f"  tiles now at 2 colours: {sum(1 for a in afters if a <= 2)}")
    print(f"  tiles now at 3-4:       {sum(1 for a in afters if 3 <= a <= 4)}")
    print(f"  tiles now at 5+:        {sum(1 for a in afters if a >= 5)}")


if __name__ == "__main__":
    sys.exit(main())
