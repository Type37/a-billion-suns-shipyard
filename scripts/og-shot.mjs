#!/usr/bin/env node
/* Shoot the 1200x630 Open Graph card straight out of the running app.
 *
 * A link preview is the only picture of this app most people ever see, so it is
 * a picture of the app: a real detachment open in the Builder with a unit
 * selected, not a wordmark on a background.
 *
 * Driven over Chrome's own DevTools Protocol, no dependencies -- same approach
 * as the Dropfleet/Dropzone shots.mjs harness. Node 22+ ships the WebSocket
 * client this needs.
 *
 *   node scripts/og-shot.mjs [baseUrl]
 *
 * WHY THE VIEWPORT IS 1120x588 AND NOT 1200x630
 *
 * The card is 1200x630. The page is laid out at 1120x588 -- the same 1.905
 * aspect, fewer CSS pixels -- shot at deviceScaleFactor 2, and the 2240x1176
 * result is downsampled to 1200x630. That is the whole trick, and it is the
 * difference between a readable card and the 1600x840 grab this replaces.
 * Shooting the page at its own width fits more UI in, and every bit of it comes
 * out proportionally smaller: a 13px stat label in an embed shown 400px wide is
 * grey fuzz. Fewer CSS pixels, rendered larger, is the only way a screenshot
 * survives being a thumbnail.
 *
 * 1120 rather than 1000, which was tried first: at 1000 the detail pane's
 * header squeezes and truncates the unit name to "He... Sec", so the app's own
 * responsive breakpoint was putting an ellipsis in the advertisement.
 */
import { writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { spawn, execFileSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BASE = process.argv[2] || 'https://type37.github.io/a-billion-suns-shipyard/';
/* web/public/, not web/. Vite copies publicDir to the build root verbatim; a
   file sitting loose in the Vite root is only emitted if something imports it.
   og-image.png lived in web/ and was referenced from index.html by absolute
   URL, which is not an import, so it never made it into dist and
   https://type37.github.io/a-billion-suns-shipyard/og-image.png returned 404 --
   every shared link to this app unfurled with no picture at all. */
const OUT = join(ROOT, 'web', 'public', 'og-image.png');
const PROFILE = join(process.env.TEMP || '/tmp', 'abs-og-profile');
const PORT = 9344;
const VIEW = { width: 1120, height: 588, deviceScaleFactor: 2, mobile: false };
const CARD = { width: 1200, height: 630 };

const CHROME = [
  process.env.CHROME_BIN,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome', '/usr/bin/chromium', '/opt/pw-browsers/chromium',
].filter(Boolean);

/* Getting to the picture.
 *
 * One of the seeded fleets rather than a hand-built one, so the card cannot
 * drift away from the data the app ships. Tide of the Brood because the Vyke
 * are the faction the previous card was built around, and because a Brood
 * fleet reads as this game rather than as a spreadsheet. */
const SEED = `
  const byText = (sel, re) => [...document.querySelectorAll(sel)]
    .find((e) => re.test((e.textContent || '').trim()));
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  location.hash = '#/fleets';
  await wait(1600);

  const card = byText('.fleet-card-open', /^Tide of the Brood/);
  if (!card) throw new Error('no "Tide of the Brood" seed fleet on the Fleets screen');
  card.click();
  await wait(1800);

  /* Dismiss anything that opened over the top: the app shows a first-run
     notice, and a card advertising a dismiss button advertises nothing. */
  const x = byText('button', /^Dismiss$/);
  if (x) { x.click(); await wait(500); }
`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const bin = CHROME.find((p) => existsSync(p));
if (!bin) { console.error('No Chrome or Edge found. Set CHROME_BIN.'); process.exit(1); }

rmSync(PROFILE, { recursive: true, force: true });
mkdirSync(dirname(OUT), { recursive: true });

const proc = spawn(bin, [
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${PROFILE}`,
  '--headless=new', '--hide-scrollbars',
  `--window-size=${VIEW.width},${VIEW.height}`,
  '--no-first-run', '--no-default-browser-check',
  ...(process.platform === 'win32' ? [] : ['--no-sandbox', '--disable-dev-shm-usage']),
  BASE,
], { stdio: 'ignore' });

let targets = [];
for (let i = 0; i < 40 && !targets.length; i++) {
  await sleep(250);
  try {
    targets = (await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json())
      .filter((t) => t.type === 'page');
  } catch {}
}
if (!targets.length) { console.error('Chrome never exposed a page target.'); proc.kill(); process.exit(1); }

const ws = new WebSocket(targets[0].webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r, { once: true }));

let msgId = 0;
const pending = new Map();
ws.addEventListener('message', (e) => {
  const m = JSON.parse(e.data);
  const p = pending.get(m.id);
  if (p) { pending.delete(m.id); m.error ? p.reject(new Error(m.error.message)) : p.resolve(m.result); }
});
const send = (method, params = {}) => {
  const id = ++msgId;
  ws.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
};

await send('Page.enable');
await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', VIEW);
await send('Page.navigate', { url: BASE });
await sleep(2600);

const r = await send('Runtime.evaluate', {
  expression: `(async()=>{ ${SEED} })()`, awaitPromise: true,
}).catch((e) => ({ error: e.message }));
if (r?.error || r?.exceptionDetails) {
  console.error('seed failed:', r.error || r.exceptionDetails?.exception?.description);
  ws.close(); proc.kill(); process.exit(1);
}

/* Finish every running animation before the shot. Headless Chrome does not
   advance the timeline when nothing asks it for frames, so anything that fades
   in captures as its 0% keyframe. */
await send('Runtime.evaluate', {
  expression: `document.getAnimations().forEach((a) => { try { a.finish(); } catch (e) {} })`,
}).catch(() => {});
await sleep(200);

const shot = await send('Page.captureScreenshot', { format: 'png' });
writeFileSync(OUT, Buffer.from(shot.data, 'base64'));

/* Downsample 2240x1176 -> 1200x630. Pillow rather than a node image library
   because this repo has no image dependency and does not need one for a script
   that runs when the app's look changes. */
execFileSync('python', ['-c', `
from PIL import Image
im = Image.open(r"${OUT}")
if im.size != (${CARD.width}, ${CARD.height}):
    im.convert("RGB").resize((${CARD.width}, ${CARD.height}), Image.LANCZOS).save(r"${OUT}", "PNG", optimize=True)
`], { stdio: 'inherit' });

ws.close();
proc.kill();
/* Best effort. proc.kill() returns before Windows has released the profile
   directory's file handles, so a hard rm here throws EPERM and fails a run that
   already wrote the picture. The next run clears it at startup anyway. */
try { rmSync(PROFILE, { recursive: true, force: true }); } catch {}
console.log(`wrote ${OUT}`);
