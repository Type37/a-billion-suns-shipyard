"""Generate grid thumbnails for the emblem library.

The source emblems are full-size artwork - 1024x1024 is typical, 2000x2000
happens - while the picker draws them in a ~95px tile. Opening the library with
"All" selected therefore pulled megabytes of image data to fill a grid of
thumbnails, which is the single biggest cost in that modal.

This writes a parallel web/emblem-thumbs/ tree, mirroring the folder structure,
holding a small WebP of each raster emblem. The picker grid uses those; the
originals stay untouched and are still what gets used once an emblem is actually
chosen. SVGs are skipped - they are vectors, already tiny, and scale for free.

Run: python scripts/make-emblem-thumbs.py
Re-runs are cheap: a thumbnail is only rebuilt if its source is newer.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "web" / "emblems"
OUT = ROOT / "web" / "emblem-thumbs"

# Twice the ~95px tile, so the grid stays sharp on a 2x display and there is
# headroom if the tiles grow again later.
MAX_EDGE = 192
RASTER = {".png", ".jpg", ".jpeg", ".webp"}


def has_alpha(im: Image.Image) -> bool:
    """
    True if the image actually uses transparency.

    Tinting is a CSS mask: the mark's own alpha channel is the stencil and the
    colour is painted through it. That works for any image with real
    transparency, not just vectors - but a fully opaque one would mask into a
    solid coloured rectangle, so the picker needs to know which is which.
    Checked by looking at the alpha band rather than the mode, because plenty of
    RGBA files are opaque throughout.
    """
    if im.mode == "P" and "transparency" in im.info:
        im = im.convert("RGBA")
    if im.mode not in ("RGBA", "LA"):
        return False
    alpha = im.getchannel("A")
    lo, hi = alpha.getextrema()
    # Some transparent pixel has to exist for the stencil to have a shape.
    return lo < 250


def main() -> int:
    if not SRC.is_dir():
        print(f"no emblem folder at {SRC}", file=sys.stderr)
        return 1

    made = skipped = failed = 0
    src_bytes = out_bytes = 0
    # Relative paths (no extension) of every mark that can be tinted.
    tintable: list[str] = []

    for path in sorted(SRC.rglob("*")):
        if not path.is_file() or path.suffix.lower() not in RASTER:
            continue
        rel = path.relative_to(SRC)
        dest = (OUT / rel).with_suffix(".webp")
        src_bytes += path.stat().st_size

        key = rel.with_suffix("").as_posix()

        if dest.exists() and dest.stat().st_mtime >= path.stat().st_mtime:
            skipped += 1
            out_bytes += dest.stat().st_size
            try:
                with Image.open(path) as im:
                    if has_alpha(im):
                        tintable.append(key)
            except Exception:
                pass
            continue

        try:
            with Image.open(path) as im:
                if has_alpha(im):
                    tintable.append(key)
                # Flatten palette/greyscale into something WebP handles well,
                # keeping alpha where the source has it - most of these marks are
                # transparent cut-outs and a white box behind them would ruin the
                # checkerboard tile.
                im = im.convert("RGBA" if im.mode in ("RGBA", "LA", "P") else "RGB")
                im.thumbnail((MAX_EDGE, MAX_EDGE), Image.LANCZOS)
                dest.parent.mkdir(parents=True, exist_ok=True)
                im.save(dest, "WEBP", quality=82, method=6)
            made += 1
            out_bytes += dest.stat().st_size
        except Exception as exc:  # a bad source file should not stop the run
            print(f"  ! {rel}: {exc}", file=sys.stderr)
            failed += 1

    # Remove thumbnails whose source has gone, so a renamed folder does not leave
    # stale marks in the picker.
    removed = 0
    if OUT.is_dir():
        for thumb in sorted(OUT.rglob("*.webp")):
            rel = thumb.relative_to(OUT)
            if not any((SRC / rel).with_suffix(ext).exists() for ext in RASTER):
                thumb.unlink()
                removed += 1
        for d in sorted(OUT.rglob("*"), reverse=True):
            if d.is_dir() and not any(d.iterdir()):
                d.rmdir()

    # Which marks can be tinted, for the picker to enable the Tint row against.
    # SVGs are not listed here (they are not thumbnailed) - they are always
    # tintable, and emblems.ts treats them as such.
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "tintable.json").write_text(json.dumps(sorted(set(tintable)), indent=0), encoding="utf-8")

    print(
        f"thumbs: {made} written, {skipped} current, {removed} stale removed, {failed} failed\n"
        f"source {src_bytes / 1_048_576:.1f} MB -> thumbs {out_bytes / 1_048_576:.2f} MB\n"
        f"tintable (real transparency): {len(set(tintable))} of {made + skipped} raster marks"
    )
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
