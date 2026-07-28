// The Hypergrowth "write-on" decode: each glyph flickers through random
// characters and settles left-to-right - mechanical, fast, transactional. The
// faction-title version in main.ts (decodeTitle) builds per-character spans; the
// callers here drive a plain text sink instead (an input's value, a count's
// textContent), so the same feel can front the corp-name roll and the +/-
// steppers without duplicating the timing.

export const DECODE_POOL = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/<>*-_".split("");
// Counts scramble through digits only: letters mid-roll on a number read as a
// glitch, not a decode.
export const DIGIT_POOL = "0123456789".split("");

interface DecodeOpts {
  /** Character set to scramble through before each glyph settles. */
  pool?: string[];
  /** ms before the FIRST glyph locks; each later glyph adds `step`. */
  base?: number;
  /** ms of stagger added per glyph position. */
  step?: number;
  /** Return false to abort mid-run (e.g. the element was replaced by a re-render). */
  isAlive?: () => boolean;
  /** Called once, after the text has fully settled to `text`. */
  done?: () => void;
}

/**
 * Scramble `text` into place, calling `apply(partial)` each animation frame with
 * the current partially-decoded string and, when settled, `done()`. Guarded by
 * `isAlive` so a re-render that swaps the target simply drops the loop.
 */
export function runDecode(text: string, apply: (partial: string) => void, opts: DecodeOpts = {}): void {
  const pool = opts.pool ?? DECODE_POOL;
  const base = opts.base ?? 70;
  const step = opts.step ?? 26;
  const isAlive = opts.isAlive ?? (() => true);
  const chars = [...text];
  const start = performance.now();
  const frame = (now: number): void => {
    if (!isAlive()) return;
    const t = now - start;
    let settled = true;
    let out = "";
    chars.forEach((c, i) => {
      if (c === " ") {
        out += " ";
        return;
      }
      if (t < base + i * step) {
        out += pool[Math.floor(Math.random() * pool.length)] ?? c;
        settled = false;
      } else {
        out += c;
      }
    });
    apply(out);
    if (!settled) requestAnimationFrame(frame);
    else opts.done?.();
  };
  requestAnimationFrame(frame);
}

/**
 * Not reduced-motion. This used to also require `(hover: hover)` at 768px and
 * up, which quietly meant "desktop only" - phones got the plain value and none
 * of the decode. The animation is a string swap on one element, so there was no
 * performance reason for the gate, and the phone is where the app is used most.
 */
export function canWriteOn(): boolean {
  return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Write `text` into an input with the decode effect, then call `done` (used to
 * commit the value to state once the flicker has settled). Seeds the final value
 * first so a dropped animation frame leaves the real text, never a scramble.
 */
export function writeOnInput(el: HTMLInputElement, text: string, done?: () => void): void {
  if (!canWriteOn()) {
    el.value = text;
    done?.();
    return;
  }
  el.value = text;
  runDecode(text, (partial) => {
    el.value = partial;
  }, {
    isAlive: () => el.isConnected,
    done: () => {
      el.value = text;
      done?.();
    },
  });
}
