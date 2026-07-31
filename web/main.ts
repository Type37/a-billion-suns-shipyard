import { parseRoute, store } from "./state.ts";
import { MODE_BUILDER_SHAPE } from "../src/types.ts";
import { render } from "./render.ts";
import { morphInto } from "./morph.ts";
import { wireActions } from "./actions.ts";
import { decodeShare, decodeSharePayload, sharePayloadFromHash, type DecodedShare } from "./share.ts";
import { persistCustomFactions, persistLists } from "./storage.ts";
import { runDecode, DIGIT_POOL } from "./write-on.ts";
import "./style.css";

// The app is a hash-routed, single-store, full-re-render SPA. state.ts holds the
// store, render.ts turns state into HTML, actions.ts owns all event handling.

const rootEl = document.getElementById("app");
if (!rootEl) throw new Error("Missing #app root element.");
const root: HTMLElement = rootEl;

// Identifies an interactive element across a re-render. innerHTML replacement
// destroys the node you just used, so the only way to hand focus back is to
// find its replacement by something stable. Almost nothing here carries an id -
// controls are identified by data-action plus whatever data-* narrows it to one
// element (data-id, data-index, data-ship...), so that tuple IS the identity.
// Returns null for anything unidentifiable, which simply means no restore.
function focusKey(el: Element | null): string | null {
  if (!(el instanceof HTMLElement)) return null;
  if (el.id) return `id:${el.id}`;
  if (!el.dataset["action"]) return null;
  const parts: string[] = [];
  for (const k of Object.keys(el.dataset).sort()) {
    const v = el.dataset[k];
    if (v !== undefined) parts.push(`${k}=${v}`);
  }
  return `data:${parts.join("&")}`;
}

const SITE_NAME = "A Billion Suns 2e Shipyard";
const VIEW_TITLE: Record<string, string> = {
  home: "Home",
  fleets: "Fleets",
  // builder is set per game mode in syncDocumentTitle - Hypergrowth builds a
  // Shipyard, the other eras build a fleet list.
  builder: "Fleet builder",
  print: "Print setup",
  foundry: "Custom Rules",
  solo: "Solo",
  "solo-outfit": "Outfit",
  ships: "Ship Compendium",
  play: "Play Mode",
  learn: "Learn to Play",
};

// Scroll a phase accordion into view when the route names one (#/learn/3/jump).
// Keyed on the anchor so it fires on the navigation that asked for it and not on
// every later repaint - re-running it on an ordinary click would yank the page
// back up while you were reading further down.
let lastLearnAnchor: string | null = null;
function syncLearnAnchor(): void {
  const r = store.getState().route;
  const key = r.view === "learn" && r.anchor ? `${r.step}/${r.anchor}` : null;
  if (key === lastLearnAnchor) return;
  lastLearnAnchor = key;
  if (!key || r.view !== "learn" || !r.anchor) return;
  const el = document.getElementById(`phase-${r.anchor}`);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

// The hash router repaints the whole page without touching the title, so every
// route read as the same document. A screen reader gets no signal that the view
// changed at all; the title is the primary one it has.
function syncDocumentTitle(): void {
  const s = store.getState();
  const view = s.route.view;
  // "Shipyard" is two things in this app and both are correct: the product name
  // and, in Hypergrowth, the actual game object - the stock of hulls you
  // requisition from. So the builder titles itself by what you are building.
  // Calling a Hypergrowth session a "Fleet builder" is wrong on the rules'
  // own terms: you are not building a fleet, you are stocking a Shipyard and
  // units are not formed until you requisition them mid-game.
  let name = VIEW_TITLE[view];
  if (view === "builder") {
    const list = s.lists.find((l) => l.id === (s.route as { listId: string }).listId);
    name = list && MODE_BUILDER_SHAPE[list.mode] === "shipyard" ? "Shipyard" : "Fleet builder";
  }
  document.title = name ? `${name} - ${SITE_NAME}` : SITE_NAME;
}

// The control you just pressed keeps its position on screen across the repaint
// that follows. Adding a ship grows the roster by a whole row; where the roster
// sits above the catalogue (any width narrow enough for the two to stack) that
// pushed every catalogue row down ~240px, so the list jumped under your cursor
// at the moment you were clicking through it.
//
// The browser's own scroll anchoring does this, but only for growth ABOVE the
// viewport - at the top of the page it has nothing to anchor to and gives up.
// This does it from the pressed element itself, so it holds at any scroll
// position, including 0.
//
// Recorded on pointerdown (before any state change) in the capture phase, so it
// is captured even for controls that stop propagation.
let pressAnchor: { scrollY: number; route: string } | null = null;

document.addEventListener(
  "pointerdown",
  (e) => {
    const el = e.target instanceof Element ? e.target.closest("[data-action]") : null;
    // Record only the page's scroll position at press time, not the pressed
    // element's box. See holdAnchor: pinning absolute scroll is drift-proof,
    // element-relative anchoring is not.
    pressAnchor = el instanceof HTMLElement ? { scrollY: window.scrollY, route: location.hash } : null;
  },
  true,
);

function holdAnchor(): void {
  const a = pressAnchor;
  pressAnchor = null;
  // Not across a navigation: a new view is supposed to start where it starts.
  if (!a || a.route !== location.hash) return;
  // Pin the page exactly where it was when the control was pressed. The old
  // version anchored to the pressed element's own top and scrollBy'd the
  // difference - but with real fonts a single click reflows the content above
  // the control by a pixel or two, so the "difference" was never zero and every
  // click crept the view downward. An absolute scroll pin cannot drift.
  if (window.scrollY !== a.scrollY) window.scrollTo(0, a.scrollY);
}

function paint(): void {
  // Most text fields commit on `change` (blur), so typing does not re-render.
  // The compendium search is the exception: it filters live on `input`, so
  // focus and caret are preserved for the focused control either way.
  const active = document.activeElement;
  const activeKey = focusKey(active);
  const caret = active instanceof HTMLInputElement ? active.selectionStart : null;

  // The builder's roster panel scrolls independently (position: sticky,
  // overflow-y: auto). Morphing preserves the element, and with it the scroll
  // position, so this is now a fallback for the case where the panel genuinely
  // is replaced (switching into the builder from another view). Nothing may
  // move on a click that isn't the point of the click.
  const manifestScroll = document.querySelector(".mf-manifest")?.scrollTop ?? 0;
  // A modal panel scrolls internally (overflow:auto, max-height). Adding a unit
  // from the picker re-renders the whole page; without this the modal jumps back
  // to the top and you have to scroll down again to add another.
  const modalScroll = document.querySelector(".modal-panel")?.scrollTop ?? 0;

  // A <details> the player opened is a decision, and re-rendering must not undo
  // it. Without this, adding a ship from the "Add ships" catalog collapses the
  // catalog you are adding from, so a second ship means opening it again. Only
  // panels marked data-persist are carried; transient popovers (the overflow
  // menu, the faction switcher) are deliberately left to close on re-render.
  // Closed is tracked as well as open, so a panel the player shut does not
  // spring back open just because it renders open by default.
  const openPanels = new Set<string>();
  const closedPanels = new Set<string>();
  for (const d of document.querySelectorAll<HTMLDetailsElement>("details[data-persist]")) {
    const key = d.dataset["persist"];
    if (!key) continue;
    (d.open ? openPanels : closedPanels).add(key);
  }

  // Update in place rather than reassigning innerHTML: see web/morph.ts. The
  // save/restore hooks around this call are kept as a safety net for the cases
  // morphing genuinely does replace a node (a changed tag, a keyless list that
  // reordered), but on an ordinary click they now have nothing to restore.
  morphInto(root, render(store.getState()));
  // Every view builds its own <main>; tagging the first one here rather than in
  // eighteen templates keeps the skip link's target correct on all of them.
  const mainEl = root.querySelector("main");
  if (mainEl) mainEl.id = "main-content";
  holdAnchor();
  syncDocumentTitle();
  enhanceNav();

  const manifest = document.querySelector(".mf-manifest");
  if (manifest) manifest.scrollTop = manifestScroll;
  const modalPanel = document.querySelector(".modal-panel");
  if (modalPanel && modalScroll) modalPanel.scrollTop = modalScroll;

  measureStickyHeader();
  observeEmblemLibrary();
  markJustPickedFaction();
  animateFactionTitle();
  animateNewRosterRows();
  animateCountChanges();
  // After layout settles: measuring mid-paint reads pre-layout boxes, and web
  // fonts landing later reflow the sheet and move every page boundary.
  requestAnimationFrame(() => paginatePrintPreview());
  void document.fonts?.ready.then(() => paginatePrintPreview());

  for (const d of document.querySelectorAll<HTMLDetailsElement>("details[data-persist]")) {
    const key = d.dataset["persist"];
    if (!key) continue;
    // A key seen in neither set is new this render: leave its authored default.
    if (openPanels.has(key)) d.open = true;
    else if (closedPanels.has(key)) d.open = false;
  }

  // Hand focus back to the control the player was actually using. Without this
  // every click lands focus on <body>, so a keyboard user re-tabs from the top
  // of the document after every single interaction.
  if (activeKey) {
    const restored = activeKey.startsWith("id:")
      ? document.getElementById(activeKey.slice(3))
      : [...root.querySelectorAll<HTMLElement>("[data-action]")].find((el) => focusKey(el) === activeKey);
    if (restored instanceof HTMLElement) {
      // preventScroll: restoring focus after a re-render must not scroll the
      // control into view. Without it, clicking a button near a viewport edge
      // (the d12 roll, a +/- stepper) nudged the page a few pixels every click.
      restored.focus({ preventScroll: true });
      if (restored instanceof HTMLInputElement && caret !== null) {
        try {
          restored.setSelectionRange(caret, caret);
        } catch {
          // Some input types do not support selection ranges; ignore.
        }
      }
    }
  }

  // After the focus restore above, not before: opening the picker restored focus
  // to the button that opened it, which immediately undid the dialog's own
  // focus. A newly opened modal owns the focus.
  syncModalFocus();
  revealSelectedSigil();
  syncLearnAnchor();
}

// A share link carries the whole list (and any custom faction) in the hash. Import
// it once, drop it into the register, then rewrite the URL to the new list's
// builder route so a refresh cannot import a second copy.
function importDecodedShare(decoded: DecodedShare): void {
  store.setState((s) => {
    const lists = [...s.lists, decoded.list];
    const customFactions = decoded.customFaction
      ? [...s.customFactions.filter((f) => f.id !== decoded.customFaction!.id), decoded.customFaction]
      : s.customFactions;
    persistLists(lists);
    if (decoded.customFaction) persistCustomFactions(customFactions);
    return { ...s, lists, customFactions, route: { view: "builder", listId: decoded.list.id } };
  });
  // Keep the address bar in step. This fires hashchange, which re-derives the
  // same route - harmless and idempotent.
  location.replace(`#/list/${decoded.list.id}`);
}

// Returns true if the hash held a share link. Compressed ("z=") links inflate
// asynchronously and import a moment later (store.subscribe(paint) repaints);
// plain/legacy links import synchronously.
function tryImportShare(): boolean {
  const payload = sharePayloadFromHash(location.hash);
  if (!payload) return false;
  if (payload.kind === "z") {
    void decodeSharePayload(payload).then((decoded) => {
      if (decoded) importDecodedShare(decoded);
      else {
        store.setState((s) => ({ ...s, route: parseRoute(location.hash) }));
      }
    });
    return true;
  }
  const decoded = decodeShare(payload.data);
  if (!decoded) return false;
  importDecodedShare(decoded);
  return true;
}

/**
 * Draw real page boundaries on the print preview, and report the page count.
 *
 * The sheet is laid out at the true printable width for the chosen paper, so
 * the preview is 1:1 with what the printer gets (same DOM, same stylesheet -
 * there is deliberately no second renderer to drift out of sync). This walks the
 * sheet's breakable units in document order and starts a new page whenever the
 * next one would cross the page height, which mirrors how the browser fragments
 * given our `break-inside: avoid` rules. Table rows are the breakable unit
 * inside a table; everything else breaks between top-level blocks.
 *
 * The guides are absolutely positioned inside the (relative) sheet, so drawing
 * them never moves any content.
 */
function paginatePrintPreview(): void {
  const sheet = document.querySelector<HTMLElement>("[data-print-sheet]");
  const readout = document.querySelector<HTMLElement>("[data-print-pagecount]");
  if (!sheet) return;

  for (const old of sheet.querySelectorAll(".page-guide")) old.remove();

  const pageH = parseFloat(getComputedStyle(sheet).getPropertyValue("--page-h")) || 950;
  const sheetTop = sheet.getBoundingClientRect().top;

  // A flat list of LEAF breakable units in document order - never a container
  // and its own descendants, or the same content would be counted twice. Table
  // rows are the unit inside a table; anything else too tall to fit a page is
  // recursed into (a card grid breaks between cards).
  const units: HTMLElement[] = [];
  const walk = (el: HTMLElement): void => {
    for (const child of Array.from(el.children) as HTMLElement[]) {
      if (child.classList.contains("page-guide")) continue;
      const h = child.getBoundingClientRect().height;
      if (h <= 0) continue;
      const rows = child.querySelectorAll<HTMLElement>("tbody tr");
      if (rows.length > 1) {
        const thead = child.querySelector<HTMLElement>("thead");
        if (thead) units.push(thead);
        rows.forEach((tr) => units.push(tr));
        continue;
      }
      if (h > pageH * 0.9 && child.children.length > 1) {
        walk(child);
        continue;
      }
      units.push(child);
    }
  };
  walk(sheet);

  // Walk in order; when a unit would cross the current page's bottom edge it
  // moves whole onto the next page, which is where the break goes.
  const breaks: number[] = [];
  let pageBottom = pageH;
  for (const u of units) {
    const r = u.getBoundingClientRect();
    const top = r.top - sheetTop;
    const bottom = r.bottom - sheetTop;
    if (bottom > pageBottom) {
      if (top > 0 && top < bottom) breaks.push(top);
      pageBottom = top + pageH;
    }
  }

  breaks.forEach((y, i) => {
    const g = document.createElement("div");
    g.className = "page-guide";
    g.style.top = `${y}px`;
    g.dataset["page"] = String(i + 2);
    g.setAttribute("aria-hidden", "true");
    sheet.appendChild(g);
  });

  const pages = breaks.length + 1;
  if (readout) {
    const paperLabel = sheet.dataset["paperLabel"] ?? "";
    readout.textContent = `${pages} ${pages === 1 ? "page" : "pages"}${paperLabel ? ` · ${paperLabel}` : ""}`;
  }
}

// A single highlight that slides between the top-right nav items. It rests on
// the item matching the current route and follows the pointer on hover, easing
// on Fluent's decelerate curve (set in CSS). Re-wired after every re-render.
function enhanceNav(): void {
  const nav = document.querySelector<HTMLElement>(".topnav");
  const pill = nav?.querySelector<HTMLElement>(".nav-pill");
  if (!nav || !pill) return;
  // Options is a <button>, not a link, but it is an item on this rail like any
  // other: the pill has to follow the pointer onto it, or it reads as something
  // bolted on beside the nav rather than part of it.
  const items = Array.from(nav.querySelectorAll<HTMLElement>("a, .topnav-btn"));
  const links = items.filter((el): el is HTMLAnchorElement => el.tagName === "A");
  const path = location.hash.replace(/^#/, "") || "/";
  const active = links.find((a) => {
    const h = a.getAttribute("href")?.replace(/^#/, "") ?? "";
    return h !== "/" && (path === h || path.startsWith(h + "/"));
  });
  // The pill is aria-hidden, so it tells a screen reader nothing about where it
  // is. Mark the same item programmatically. Hover moves the pill but must not
  // move aria-current - that tracks the route, not the pointer.
  for (const a of links) a.removeAttribute("aria-current");
  if (active) active.setAttribute("aria-current", "page");

  const place = (el?: HTMLElement): void => {
    if (!el) {
      pill.style.opacity = "0";
      pill.style.width = "0";
      return;
    }
    pill.style.opacity = "1";
    pill.style.width = `${el.offsetWidth}px`;
    pill.style.transform = `translateX(${el.offsetLeft}px)`;
  };
  // innerHTML rebuilds the pill from scratch on every re-render, so it starts
  // at width 0 each time. Placing it with the CSS transition live would slide it
  // in from nothing on every single click - it reads as the nav reloading. Kill
  // the transition for this first placement only, then restore it so hover still
  // eases.
  pill.style.transition = "none";
  place(active);
  void pill.offsetWidth; // force reflow so the instant placement commits
  pill.style.transition = "";
  items.forEach((el) => el.addEventListener("mouseenter", () => place(el)));
  nav.addEventListener("mouseleave", () => place(active));
}

// The faction info panel plays a short, era-keyed entrance on its title whenever
// the panel content changes (a new faction picked, the panel first opening).
// Desktop only, and skipped for reduced-motion: on those the server-rendered
// resting state stands. Keyed by era+title so it fires only when the title
// actually changes - never on unrelated re-renders, which would otherwise
// re-scramble the title on every single click.
let lastTitleKey: string | null = null;
const DECODE_POOL = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/<>*-_".split("");

function titleRule(): HTMLSpanElement {
  const rule = document.createElement("span");
  rule.className = "nfd-underline";
  rule.setAttribute("aria-hidden", "true");
  return rule;
}

// Hypergrowth: each glyph flickers through random characters and settles
// left-to-right - mechanical, fast, transactional.
function decodeTitle(el: HTMLElement, text: string): void {
  el.textContent = "";
  const spans = [...text].map((c) => {
    const s = document.createElement("span");
    s.className = "c";
    s.setAttribute("aria-hidden", "true");
    s.dataset["o"] = c;
    // Seed with the real character (not blank): the first frame overwrites it
    // with a random glyph, so the scramble still reads, but if rAF never runs
    // the title shows correctly instead of empty.
    s.textContent = c;
    el.appendChild(s);
    return s;
  });
  el.appendChild(titleRule());
  const start = performance.now();
  const frame = (now: number): void => {
    if (!el.isConnected) return; // element replaced by a re-render; abandon
    const t = now - start;
    let done = true;
    spans.forEach((s, i) => {
      const o = s.dataset["o"] ?? "";
      if (o === " ") return;
      if (t < 70 + i * 26) {
        s.textContent = DECODE_POOL[Math.floor(Math.random() * DECODE_POOL.length)] ?? o;
        done = false;
      } else {
        s.textContent = o;
      }
    });
    if (!done) requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

// Age of Unity: a Star Wars scene wipe. A hard bright edge crosses the title
// from left to right and the name is uncovered behind it. This replaced a
// scale-and-fade recede: the fade was the softest thing on a screen that is
// otherwise all hard edges, and a wipe is both more Star Wars and more Swiss.
// Nothing fades - a letter is either behind the wipe or fully drawn.
//
// The clip-path does the uncovering and deliberately does NOT fill forwards: it
// must revert to `none` so the red underline can overhang the box afterwards.
// The travelling edge is a pseudo-element (see .nfd-title.is-wiping::before),
// which WAAPI cannot reach, so it is driven by a class instead.
function wipeTitle(el: HTMLElement, text: string): void {
  el.textContent = text;
  el.appendChild(titleRule());
  el.style.transformOrigin = "";
  el.animate([{ clipPath: "inset(-20% 100% -20% 0)" }, { clipPath: "inset(-20% 0 -20% 0)" }], {
    duration: WIPE_MS,
    easing: "cubic-bezier(.3,0,.1,1)",
  });
  // Re-picking the same era re-runs this, and a class that is already present
  // will not restart a CSS animation. Drop it, force a reflow, re-add.
  el.classList.remove("is-wiping");
  void el.offsetWidth;
  el.classList.add("is-wiping");
  window.setTimeout(() => el.classList.remove("is-wiping"), WIPE_MS + 60);
}

/** Shared by the clip-path reveal and the travelling edge, so they stay locked. */
const WIPE_MS = 460;

// Armageddon: the title lands big from above, overshoots small, then jolts once
// on impact (a quick diagonal recoil) before settling. The red underline is held
// collapsed through the slam and only draws in once the name has landed. This is
// the original, punchier slam - more fun to watch than the contained thump.
function slamTitle(el: HTMLElement, text: string): void {
  el.textContent = text;
  el.appendChild(titleRule());
  el.classList.add("is-landing"); // hold the underline collapsed through the slam
  // Centre-bottom origin so the scale-in grows symmetrically and lands on the
  // baseline - a left origin plus a big scale pushed a long faction name off the
  // right edge and toggled a scrollbar every frame (the whole-screen "shake").
  // The .nf-detail container also clips, so no residual overflow can move layout.
  el.style.transformOrigin = "50% 100%";
  el.animate(
    [
      { opacity: 0, transform: "scale(1.45)" },
      { opacity: 1, transform: "scale(.97)", offset: 0.6 },
      { transform: "translateY(-2px) scale(1.01)", offset: 0.78 },
      { transform: "translateY(1px) scale(0.995)", offset: 0.9 },
      { transform: "translate(0,0) scale(1)" },
    ],
    { duration: 340, easing: "cubic-bezier(.2,.9,.2,1)", fill: "forwards" },
  );
  // Only once the title has landed (slam is 340ms): drop the hold and the CSS
  // transition on .nfd-rule draws the red underline in. A timer, not the finish
  // event, so the underline never gets stranded if the finish event is missed.
  window.setTimeout(() => el.classList.remove("is-landing"), 360);
}

// The dice / command glyphs pop in with a short left-to-right stagger just after
// the title, so the two figures feel like they resolve into place.
function animateStatGlyphs(): void {
  // Only the dice pop via WAAPI; the command tokens draw + swell on their own
  // SMIL timeline (commandToken), so leave them out or the two fight.
  const glyphs = document.querySelectorAll<HTMLElement>(".nfd-stats .dice-ico");
  glyphs.forEach((g, i) => {
    g.animate(
      [
        { opacity: 0, transform: "translateY(5px) scale(0.6)" },
        { opacity: 1, transform: "translateY(0) scale(1)" },
      ],
      { duration: 300, delay: 140 + i * 70, easing: "cubic-bezier(.2,.9,.3,1.4)", fill: "backwards" },
    );
  });
}

// A ship added to a roster or outfit gets a short, subtle entrance so the change
// registers. Rows are keyed by unit id; each render compares the current keys to
// the last set and animates only the ones that are new - so nothing plays on an
// unrelated re-render, and existing rows never re-animate when a view first opens
// (the first sighting just seeds the set).
let prevRosterKeys: Set<string> | null = null;
function animateNewRosterRows(): void {
  // Distinguish "the roster isn't on screen" from "the roster is empty". If we
  // reset on an empty roster, the FIRST ship you add is the first sighting and
  // never animates - which is exactly the add most worth acknowledging.
  const rosterOnScreen = document.querySelector(".mf-manifest, .roster-sheet") !== null;
  const rows = Array.from(document.querySelectorAll<HTMLElement>("[data-roster-key]"));
  if (!rosterOnScreen) {
    prevRosterKeys = null; // roster left the page; a fresh one should not animate on open
    return;
  }
  if (rows.length === 0) {
    prevRosterKeys = new Set(); // on screen but empty: the next add IS new
    return;
  }
  const current = new Set<string>();
  for (const r of rows) {
    const k = r.dataset["rosterKey"];
    if (k) current.add(k);
  }
  const seen = prevRosterKeys;
  prevRosterKeys = current;
  if (seen === null) return; // first sight of this roster - seed only, no animation
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  for (const r of rows) {
    const k = r.dataset["rosterKey"];
    if (!k || seen.has(k)) continue;
    r.animate(
      [
        { opacity: 0, transform: "translateY(-8px)", boxShadow: "inset 3px 0 0 rgba(11,61,145,0.9)" },
        { opacity: 1, transform: "translateY(0)", boxShadow: "inset 0 0 0 rgba(11,61,145,0)" },
      ],
      { duration: 320, easing: "cubic-bezier(.2,.8,.2,1)" },
    );
  }
}

/**
 * A Shipyard stacks: adding a ship you already hold only raises its number, so
 * no new row appears and animateNewRosterRows has nothing to play. Pop the
 * figure instead, so every add is acknowledged on the roster and not only in
 * the toast. Same prev-set diffing pattern as the row entrance above.
 */
let prevUnitCounts: Map<string, string> | null = null;
function animateCountChanges(): void {
  const rosterOnScreen = document.querySelector(".mf-manifest, .roster-sheet, .shipyard") !== null;
  const rows = Array.from(document.querySelectorAll<HTMLElement>("[data-roster-key]"));
  if (!rosterOnScreen) {
    prevUnitCounts = null;
    return;
  }
  if (rows.length === 0) {
    prevUnitCounts = new Map();
    return;
  }
  const current = new Map<string, string>();
  for (const r of rows) {
    const key = r.dataset["rosterKey"];
    const countEl = r.querySelector<HTMLElement>(".stepper-count");
    if (key && countEl) current.set(key, countEl.textContent ?? "");
  }
  const seen = prevUnitCounts;
  prevUnitCounts = current;
  if (seen === null) return; // first sight - seed only
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  for (const r of rows) {
    const key = r.dataset["rosterKey"];
    const countEl = r.querySelector<HTMLElement>(".stepper-count");
    if (!key || !countEl) continue;
    const before = seen.get(key);
    const after = current.get(key);
    if (before === undefined || after === undefined || before === after) continue;
    // The digits write on with the Hypergrowth decode (mechanical, transactional)
    // over the top of the pop, scrambling through numerals before settling on the
    // new count.
    runDecode(after, (partial) => {
      countEl.textContent = partial;
    }, { pool: DIGIT_POOL, base: 60, step: 22, isAlive: () => countEl.isConnected });
    // Going up pops big and blue; going down gives a smaller, quieter settle so
    // both the + and the - are acknowledged where the eye already is.
    const up = Number(after) > Number(before);
    countEl.animate(
      up
        ? [
            { transform: "scale(1)", color: "var(--ink)" },
            { transform: "scale(1.5)", color: "var(--blue)", offset: 0.4 },
            { transform: "scale(1)", color: "var(--ink)" },
          ]
        : [
            { transform: "scale(1)" },
            { transform: "scale(0.72)", offset: 0.4 },
            { transform: "scale(1)" },
          ],
      { duration: up ? 340 : 220, easing: "cubic-bezier(.2,.9,.3,1.2)" },
    );
  }
}

/**
 * Publish the pinned roster header's real height as --mf-head-h, so the roster
 * panel can stick directly beneath it. The header wraps to two lines on a narrow
 * viewport and changes height when the credits limit control opens, so a
 * hard-coded offset would either overlap the header or leave a gap under it.
 */
/**
 * Grow the emblem library as its foot comes into view. The whole library is
 * 250+ tiles; rendering it in one go took about a second and, because the grid
 * extended far below the fold, `loading="lazy"` correctly fetched none of the
 * images - so the picker opened slowly onto an empty checkerboard. A page at a
 * time keeps opening instant and keeps the images close enough to load.
 *
 * The observer is rebuilt each paint because the sentinel is a fresh element
 * whenever the page count changes; disconnecting the previous one avoids
 * stacking observers across renders.
 */
let libMoreObserver: IntersectionObserver | null = null;
function observeEmblemLibrary(): void {
  libMoreObserver?.disconnect();
  libMoreObserver = null;
  const sentinel = document.querySelector("[data-lib-more]");
  if (!sentinel) return;
  const scroller = sentinel.closest<HTMLElement>(".em-body") ?? null;
  libMoreObserver = new IntersectionObserver(
    (entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      libMoreObserver?.disconnect();
      libMoreObserver = null;
      store.setState((s) =>
        s.ui.modal?.kind === "emblem"
          ? { ...s, ui: { ...s.ui, modal: { ...s.ui.modal, libShown: (s.ui.modal.libShown ?? 72) + 72 } } }
          : s,
      );
    },
    // Start fetching before it is actually on screen, so scrolling stays smooth.
    { root: scroller, rootMargin: "300px" },
  );
  libMoreObserver.observe(sentinel);
}

/**
 * Make an open modal behave like a dialog.
 *
 * It carried role="dialog" aria-modal="true" and none of the behaviour: focus
 * stayed on <body> when it opened, all 63 controls behind the backdrop stayed
 * tabbable (the search box was roughly the 65th stop), the page behind still
 * scrolled, and closing dropped focus to <body> rather than back to the button
 * that opened it.
 */
let modalReturnFocus: HTMLElement | null = null;
let trapHandler: ((e: KeyboardEvent) => void) | null = null;

function focusables(root: Element): HTMLElement[] {
  return [
    ...root.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ].filter((el) => el.offsetParent !== null || el === document.activeElement);
}

function syncModalFocus(): void {
  const panel = document.querySelector<HTMLElement>(".modal-root .modal-panel");

  if (!panel) {
    if (trapHandler) {
      document.removeEventListener("keydown", trapHandler, true);
      trapHandler = null;
    }
    document.body.style.removeProperty("overflow");
    // Hand focus back to whatever opened the dialog, not to <body>.
    if (modalReturnFocus?.isConnected) modalReturnFocus.focus();
    modalReturnFocus = null;
    return;
  }

  if (!trapHandler) {
    // Opening: remember the trigger, stop the page behind from scrolling, and
    // put the caret somewhere useful rather than nowhere.
    const active = document.activeElement;
    modalReturnFocus = active instanceof HTMLElement && active !== document.body ? active : null;
    document.body.style.overflow = "hidden";
    const first = panel.querySelector<HTMLElement>("#emblem-lib-search") ?? focusables(panel)[0];
    first?.focus();

    trapHandler = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const live = document.querySelector<HTMLElement>(".modal-root .modal-panel");
      if (!live) return;
      const items = focusables(live);
      if (items.length === 0) return;
      const firstItem = items[0]!;
      const lastItem = items[items.length - 1]!;
      // Wrap at both ends, and pull focus back in if it has escaped entirely.
      if (!live.contains(document.activeElement)) {
        e.preventDefault();
        (e.shiftKey ? lastItem : firstItem).focus();
      } else if (e.shiftKey && document.activeElement === firstItem) {
        e.preventDefault();
        lastItem.focus();
      } else if (!e.shiftKey && document.activeElement === lastItem) {
        e.preventDefault();
        firstItem.focus();
      }
    };
    document.addEventListener("keydown", trapHandler, true);
  }
}

/**
 * Bring the chosen sigil into view. Reopening the picker showed no sign of what
 * you were already using (it is usually past the first page of tiles), and
 * Random put its pick off-screen four times in six.
 */
function revealSelectedSigil(): void {
  const sel = document.querySelector<HTMLElement>(".em-modal .lib-icon.selected");
  if (!sel) return;
  const scroller = sel.closest<HTMLElement>(".em-body");
  if (!scroller) return;
  const s = scroller.getBoundingClientRect();
  const b = sel.getBoundingClientRect();
  if (b.top >= s.top && b.bottom <= s.bottom) return;
  scroller.scrollTop += b.top - s.top - scroller.clientHeight / 2 + b.height / 2;
}

function measureStickyHeader(): void {
  const head = document.querySelector<HTMLElement>(".mf-head");
  if (!head) return;
  const h = Math.round(head.getBoundingClientRect().height);
  if (h > 0) document.documentElement.style.setProperty("--mf-head-h", `${h + 12}px`);
}

/**
 * Flag the faction plaque that just became selected so its wipe plays once.
 *
 * The app re-renders by replacing HTML, so the plaque is a brand new element on
 * every state change. A CSS `transition` therefore never fires (there is no old
 * computed value to move from) and a keyframe animation fires on EVERY render,
 * which would re-wipe the selected faction every time you added a ship. So the
 * animation hangs off an extra `.just-picked` class added here, and only when
 * the selection actually changed since the last render.
 *
 * Keyed by picker (`.nf-modal`, the builder switcher, the Foundry) so opening a
 * modal that shows an already-selected faction does not count as a fresh pick.
 * The settled look does not depend on any of this: `.selected::before` already
 * rests at scaleX(1), so a missed frame just means no animation, never a plaque
 * that is half-filled or missing its fill.
 */
const lastSelectedFaction = new Map<string, string>();
function markJustPickedFaction(): void {
  for (const group of document.querySelectorAll<HTMLElement>(".faction-plaques")) {
    const scope = group.closest(".nf-modal, .faction-switch, .foundry-main, main")?.className ?? "loose";
    const sel = group.querySelector<HTMLElement>(".faction-plaque.selected");
    const id = sel?.dataset["faction"] ?? "";
    const key = `${scope}|${group.className}`;
    const before = lastSelectedFaction.get(key);
    lastSelectedFaction.set(key, id);
    // `undefined` is the first sight of this picker - seed it, do not animate,
    // or every picker would wipe on open.
    if (before === undefined || before === id || !sel) continue;
    sel.classList.add("just-picked");
  }
}

function animateFactionTitle(): void {
  const el = document.querySelector<HTMLElement>(".nfd-title[data-anim-title]");
  if (!el) {
    lastTitleKey = null; // panel gone - reopening it should animate afresh
    return;
  }
  const era = el.dataset["era"] ?? "unity";
  const title = el.dataset["title"] ?? el.textContent ?? "";
  const key = `${era}|${title}`;
  if (key === lastTitleKey) return; // unchanged - leave the resting state be
  lastTitleKey = key;

  // This was gated to desktop pointers at 992px and up. Phones got a plain
  // title, which was the wrong call: picking a faction is the most-repeated
  // moment in the app and the era animations are the best thing in it. The only
  // gate left is the OS reduced-motion preference. All three are transform,
  // opacity and clip-path on one element, so they stay cheap on a phone.
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  if (era === "hyper") decodeTitle(el, title);
  else if (era === "arma") slamTitle(el, title);
  else wipeTitle(el, title);
  animateStatGlyphs();
}

window.addEventListener("resize", () => {
  enhanceNav();
  // The pinned header wraps to a second line as the viewport narrows, and the
  // roster panel sticks below it, so its height has to be re-read on resize.
  measureStickyHeader();
});

window.addEventListener("hashchange", () => {
  // Dismiss any open dialog on navigation. render() appends the modals after the
  // view regardless of route, so an emblem picker left open followed the player
  // from the builder into Play Mode and sat on top of it - and, once the dialog
  // started locking body scroll, took the page's scrollbar with it.
  const next = parseRoute(location.hash);
  // A new view starts at its top. Hash routing does not reset scroll, so
  // navigating away from a page you had scrolled down dropped you into the
  // middle of the next one. The exception is a route that names a target
  // (#/learn/3/jump) - syncLearnAnchor scrolls to it after this paint, and
  // fighting it here would show the page snapping twice.
  if (!(next.view === "learn" && next.anchor)) window.scrollTo(0, 0);
  store.setState((s) => ({ ...s, route: next, ui: { ...s.ui, modal: undefined } }));
});

wireActions(root);
store.subscribe(paint);

if (!tryImportShare()) {
  store.setState((s) => ({ ...s, route: parseRoute(location.hash) }));
}
paint();
