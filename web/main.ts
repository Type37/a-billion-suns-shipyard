import { parseRoute, store } from "./state.ts";
import { MODE_BUILDER_SHAPE } from "../src/types.ts";
import { render } from "./render.ts";
import { morphInto } from "./morph.ts";
import { wireActions } from "./actions.ts";
import { decodeShare, decodeSharePayload, sharePayloadFromHash, type DecodedShare } from "./share.ts";
import { persistCustomFactions, persistLists } from "./storage.ts";
import { runDecode, DIGIT_POOL } from "./write-on.ts";
import { visibleAnchor } from "./tours.ts";
import { renderMarkdown } from "./richtext.ts";
import { FleetSync } from "./fleet-sync.ts";
import { syncCropper } from "./cropper.ts";
import { hydrateImages } from "./image-store.ts";
import "./style.css";

// Keep every Markdown notes editor's preview in step with its textarea as the
// user types. Uncontrolled on purpose (see richtext.ts): typing must not go
// through the store, so this updates the preview node directly. Idempotent - a
// data-wired flag stops a second listener being added on the next repaint.
function wireMarkdownPreviews(): void {
  for (const ed of document.querySelectorAll<HTMLElement>(".rt-editor")) {
    if (ed.dataset["wired"]) continue;
    ed.dataset["wired"] = "1";
    const ta = ed.querySelector<HTMLTextAreaElement>("textarea.rt-input");
    const preview = ed.querySelector<HTMLElement>("[data-rt-preview]");
    if (!ta || !preview) continue;
    ta.addEventListener("input", () => {
      preview.innerHTML = renderMarkdown(ta.value);
    });
  }
}

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
  // Shipyard, the other eras build a Fleet List.
  builder: "Fleet List",
  print: "Print setup",
  foundry: "Custom Rules",
  solo: "Solo",
  "solo-outfit": "Outfit",
  ships: "Ship Compendium",
  play: "Play Mode",
  learn: "Learn to Play",
  rules: "The rules",
  "learn-classic": "Learn to Play (archived)",
};

// Scroll a phase accordion into view when the route names one (#/learn/3/jump).
// Keyed on the anchor so it fires on the navigation that asked for it and not on
// every later repaint - re-running it on an ordinary click would yank the page
// back up while you were reading further down.
let lastLearnAnchor: string | null = null;
function syncLearnAnchor(): void {
  const r = store.getState().route;
  const key = r.view === "learn-classic" && r.anchor ? `${r.step}/${r.anchor}` : null;
  if (key === lastLearnAnchor) return;
  lastLearnAnchor = key;
  if (!key || r.view !== "learn-classic" || !r.anchor) return;
  const el = document.getElementById(`phase-${r.anchor}`);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

// ---------------------------------------------------------------------------
// Learn to Play: six pages, one per tab.
// ---------------------------------------------------------------------------

/** The tab the URL last asked for, so arriving on a new page scrolls exactly once. */
let lastLearnTarget: string | null = null;

/*
 * Start a newly-opened Learn page at the top.
 *
 * What used to be here was a scroll-spy: all six sections lived on one page, so
 * a scroll listener worked out which one owned the reading line, moved the tab
 * highlight, and drove a progress bar. None of that exists now - the active tab
 * is rendered by learnView, and there is no progress to report across a single
 * page. What is left is the one thing a page change still needs: if you were
 * halfway down Tactical and press Scoring, you should arrive at the top of
 * Scoring rather than halfway down it.
 *
 * Nothing happens on an ordinary repaint, only when the tab in the URL actually
 * changes, or any state change on the page would yank the reader back up.
 */
function syncLearnTarget(): void {
  const r = store.getState().route;
  const key = r.view === "learn" ? (r.tab ?? "") : null;
  if (key === null) {
    lastLearnTarget = null;
    return;
  }
  if (key === lastLearnTarget) return;
  const first = lastLearnTarget === null;
  lastLearnTarget = key;
  // A deep link arriving cold is already at the top; only a tab press mid-read
  // has anywhere to travel from.
  if (!first) window.scrollTo({ top: 0, behavior: "smooth" });
}

/**
 * Era titles inside the accordions, using the faction picker's animations.
 *
 * Opening a <details> is native and does not repaint the app, so this hangs off
 * the toggle event (captured, because toggle does not bubble) as well as being
 * called from paint() for whichever accordion renders open. Each title animates
 * once per opening: closing and reopening plays it again, which is the point.
 */
/**
 * How much longer an era title takes on the Learn to Play card than in the
 * faction picker. Big enough that you watch it rather than catch it: the picker
 * is a list you scrub through, this is a card you deliberately opened.
 */
const ERA_SLOW = 2.8;

function animateEraTitle(el: HTMLElement): void {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const era = el.dataset["era"] ?? "arma";
  const title = el.dataset["title"] ?? el.textContent ?? "";
  if (era === "hyper") {
    decodeTitle(el, title, ERA_SLOW);
    return;
  }
  if (era === "arma") {
    slamTitle(el, title, ERA_SLOW);
    // The galaxy is in flames. Two CSS layers behind the name, lit as it lands
    // and burnt out two and a half seconds later (see .is-burning in the
    // stylesheet, which also explains why they hang off the accordion body
    // rather than off the heading). The class goes on the <details>, is dropped
    // and re-added around a reflow, or reopening the card would find it already
    // there and never restart the keyframes.
    const card = el.closest(".ltp-era");
    if (card) {
      card.classList.remove("is-burning");
      void (card as HTMLElement).offsetWidth;
      card.classList.add("is-burning");
      window.setTimeout(() => card.classList.remove("is-burning"), 2600);
    }
    return;
  }
  // Age of Unity, and the one place the Star Wars reference is allowed to be
  // unsubtle: the name flies in on a perspective tilt like the opening crawl,
  // flattening as the wipe edge uncovers it. Transform here, clip-path in
  // wipeTitle - two different properties, so the two animations compose rather
  // than one replacing the other.
  wipeTitle(el, title, ERA_SLOW);
  el.animate(
    [
      { transform: "perspective(560px) rotateX(46deg) translateY(30px) scale(1.22)", opacity: 0.15 },
      { transform: "perspective(560px) rotateX(12deg) translateY(6px) scale(1.04)", opacity: 1, offset: 0.55 },
      { transform: "perspective(560px) rotateX(0deg) translateY(0) scale(1)", opacity: 1 },
    ],
    { duration: Math.round(WIPE_MS * ERA_SLOW), easing: "cubic-bezier(.25,.8,.25,1)" },
  );
}

/**
 * Learn to Play's diagrams play only while you can see them.
 *
 * Every one is an infinite CSS loop, and they were all running from the moment
 * the page painted: the one under the fold had been looping for a minute by the
 * time you scrolled to it, and the ones inside the Jump Phase's A/B/C picker
 * start `display: none`, so they either never ran or held a dead end-frame
 * forever. The stylesheet pauses `.learn-dg *` and unpauses it on
 * `.is-onscreen`; this is the only thing that sets that class.
 *
 * One observer for the life of the page, re-scanning after each paint for
 * figures it has not seen. A `data-obs` flag keeps re-observation cheap, and an
 * element the morph removes is dropped by the observer on its own.
 */
let diagramObserver: IntersectionObserver | null = null;
function observeDiagrams(): void {
  const figures = document.querySelectorAll<SVGElement>(".learn-dg");
  if (!figures.length || typeof IntersectionObserver === "undefined") return;
  if (!diagramObserver) {
    // The stylesheet only pauses diagrams once this class is on the root, and
    // only this line ever sets it. Fail-safe by construction: if
    // IntersectionObserver is missing, or this function never runs because
    // something above it threw, the pause rule never applies and every diagram
    // plays as it always did. The alternative - pausing in CSS unconditionally
    // and relying on JS to un-pause - turns any script failure into a page of
    // frozen figures, which is worse than the problem being solved.
    document.documentElement.classList.add("dg-gated");
    diagramObserver = new IntersectionObserver(
      (entries) => {
        for (const e of entries) e.target.classList.toggle("is-onscreen", e.isIntersecting);
      },
      // A sliver is enough: these are wide and short, and waiting for a quarter
      // of one meant a figure could be fully readable and still frozen.
      { threshold: 0.08 },
    );
  }
  // Disconnect and re-observe from scratch on EVERY paint rather than tracking
  // which figures are new.
  //
  // `is-onscreen` lives in the class attribute, and render() emits a plain
  // `class="learn-dg"` every time, so morphing the new HTML over the old strips
  // the class off every figure on screen. IntersectionObserver will not put it
  // back on its own: nothing has entered or left the viewport, so there is no
  // change to report, and the figure stays frozen for the rest of the session.
  // Re-observing forces a fresh initial callback for every figure, which is the
  // one thing that reliably re-derives the truth after a repaint.
  diagramObserver.disconnect();
  for (const f of figures) diagramObserver.observe(f);
}

function animateOpenEraTitles(): void {
  for (const d of document.querySelectorAll<HTMLDetailsElement>(".ltp-era[open]")) {
    const el = d.querySelector<HTMLElement>(".ltp-era-title[data-anim-title]");
    if (!el || el.dataset["animDone"] === "1") continue;
    el.dataset["animDone"] = "1";
    animateEraTitle(el);
  }
}

// The hash router repaints the whole page without touching the title, so every
// route read as the same document. A screen reader gets no signal that the view
// changed at all; the title is the primary one it has.
function syncDocumentTitle(): void {
  const s = store.getState();
  const view = s.route.view;
  // "Shipyard" is two things in this app and both are correct: the product name
  // and, in Hypergrowth, the actual game object - the stock of hulls you
  // requisition from. So the builder titles itself by what you are building, in
  // the rulebook's own words: a Shipyard in Hypergrowth, a Fleet List in the
  // other eras. Never "fleet builder" - that is the category the product sits
  // in, not a name for any screen inside it.
  let name = VIEW_TITLE[view];
  if (view === "builder") {
    const list = s.lists.find((l) => l.id === (s.route as { listId: string }).listId);
    name = list && MODE_BUILDER_SHAPE[list.mode] === "shipyard" ? "Shipyard" : "Fleet List";
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
  positionTour();

  const manifest = document.querySelector(".mf-manifest");
  if (manifest) manifest.scrollTop = manifestScroll;
  const modalPanel = document.querySelector(".modal-panel");
  if (modalPanel && modalScroll) modalPanel.scrollTop = modalScroll;

  measureStickyHeader();
  observeEmblemLibrary();
  syncCropper();
  wireMarkdownPreviews();
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
  animateOpenEraTitles();
  observeDiagrams();
  syncLearnTarget();
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
/**
 * Scale the print preview down until the whole page width is on screen.
 *
 * The sheet is laid out at the paper's true printable width (710px for Letter)
 * and must stay that way, or the preview would break in different places than
 * the printer. On a phone that left a 710px page inside a ~350px window: see
 * the .sheet-viewport comment in style.css for what that actually looked like.
 *
 * A transform, so the sheet's LAYOUT is untouched and the preview fragments
 * into exactly the pages the printer will produce (see the .sheet-viewport
 * comment in style.css for what `zoom` did instead). A transformed box still
 * reports its unscaled size to its parent, so the viewport's height is set here
 * to match what is actually painted, or the page would keep a few hundred
 * pixels of blank space under the sheet.
 *
 * Never scaled above 1: a sheet blown up past its paper size on a desktop would
 * be a preview of a page nobody is printing.
 */
function fitPrintSheet(): void {
  const sheet = document.querySelector<HTMLElement>("[data-print-sheet]");
  const view = sheet?.parentElement;
  if (!sheet || !view) return;
  const pageW = parseFloat(getComputedStyle(sheet).getPropertyValue("--page-w")) || 710;
  // clientWidth, not getBoundingClientRect: the viewport is the scroll box, and
  // its border box would count a scrollbar the sheet cannot paint into. Read
  // before the class goes on, so a fit already in force does not measure itself.
  view.classList.remove("is-fit");
  view.style.height = "";
  const avail = view.clientWidth;
  if (!avail || !pageW || avail >= pageW) return;
  const scale = avail / pageW;
  sheet.style.setProperty("--sheet-scale", String(scale));
  view.classList.add("is-fit");
  view.style.height = `${Math.ceil(sheet.offsetHeight * scale)}px`;
}

function paginatePrintPreview(): void {
  const sheet = document.querySelector<HTMLElement>("[data-print-sheet]");
  const readout = document.querySelector<HTMLElement>("[data-print-pagecount]");
  if (!sheet) return;

  for (const old of sheet.querySelectorAll(".page-guide")) old.remove();
  fitPrintSheet();

  const cs = getComputedStyle(sheet);
  const pageH = parseFloat(cs.getPropertyValue("--page-h")) || 950;
  const pageW = parseFloat(cs.getPropertyValue("--page-w")) || 710;
  const box = sheet.getBoundingClientRect();
  const sheetTop = box.top;
  // Every rect below is read through the fit-to-width transform, so it comes
  // back in painted pixels; --page-h and the guide offsets written back are in
  // layout pixels. One divisor converts between the two, and it is 1 whenever
  // the sheet is at full size. Measured off the sheet's own box rather than
  // taken from the property that set it, so it stays right even if the fit is
  // ever computed somewhere else.
  const zoom = box.width > 0 ? box.width / pageW : 1;

  // A flat list of LEAF breakable units in document order - never a container
  // and its own descendants, or the same content would be counted twice. Table
  // rows are the unit inside a table; anything else too tall to fit a page is
  // recursed into (a card grid breaks between cards).
  const units: HTMLElement[] = [];
  const walk = (el: HTMLElement): void => {
    for (const child of Array.from(el.children) as HTMLElement[]) {
      if (child.classList.contains("page-guide")) continue;
      const h = child.getBoundingClientRect().height / zoom;
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
    const top = (r.top - sheetTop) / zoom;
    const bottom = (r.bottom - sheetTop) / zoom;
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
//
// `slow` stretches the whole thing without changing its character. The faction
// picker leaves it at 1: you meet that title dozens of times a session while
// arrowing through a list, and anything longer than a flicker starts costing
// you time. Learn to Play's era cards pass a bigger number, because there are
// three of them, you open each one once, and there the animation IS the point.
function decodeTitle(el: HTMLElement, text: string, slow = 1): void {
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
      if (t < (70 + i * 26) * slow) {
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
function wipeTitle(el: HTMLElement, text: string, slow = 1): void {
  const ms = Math.round(WIPE_MS * slow);
  el.textContent = text;
  el.appendChild(titleRule());
  el.style.transformOrigin = "";
  // The travelling edge is CSS, so its duration has to reach the stylesheet
  // somehow; a custom property is the only channel, since WAAPI cannot animate
  // a pseudo-element. Both timings read from this one number and stay locked.
  el.style.setProperty("--wipe-ms", `${ms}ms`);
  el.animate([{ clipPath: "inset(-20% 100% -20% 0)" }, { clipPath: "inset(-20% 0 -20% 0)" }], {
    duration: ms,
    easing: "cubic-bezier(.3,0,.1,1)",
  });
  // Re-picking the same era re-runs this, and a class that is already present
  // will not restart a CSS animation. Drop it, force a reflow, re-add.
  el.classList.remove("is-wiping");
  void el.offsetWidth;
  el.classList.add("is-wiping");
  window.setTimeout(() => el.classList.remove("is-wiping"), ms + 60);
}

/** Shared by the clip-path reveal and the travelling edge, so they stay locked. */
const WIPE_MS = 460;

// Armageddon: the title lands big from above, overshoots small, then jolts once
// on impact (a quick diagonal recoil) before settling. The red underline is held
// collapsed through the slam and only draws in once the name has landed. This is
// the original, punchier slam - more fun to watch than the contained thump.
function slamTitle(el: HTMLElement, text: string, slow = 1): void {
  const ms = Math.round(340 * slow);
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
    { duration: ms, easing: "cubic-bezier(.2,.9,.2,1)", fill: "forwards" },
  );
  // Only once the title has landed: drop the hold and the CSS transition on
  // .nfd-rule draws the red underline in. A timer, not the finish event, so the
  // underline never gets stranded if the finish event is missed.
  window.setTimeout(() => el.classList.remove("is-landing"), ms + 20);
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
  // The LAST panel, not the first: dialogs stack (the cropper opens over the
  // emblem picker), and the trap has to hold the one actually on top or Tab
  // walks into the dialog underneath.
  const panels = document.querySelectorAll<HTMLElement>(".modal-root .modal-panel");
  const panel = panels[panels.length - 1] ?? null;

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
      const open = document.querySelectorAll<HTMLElement>(".modal-root .modal-panel");
      const live = open[open.length - 1];
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
  // Learn to Play's era headings borrow .nfd-title for its resting styles and
  // its underline, but they are driven by their own accordion toggle (see
  // animateOpenEraTitles) - so they are excluded here, or opening the page
  // would animate one of them a second time and claim the key.
  const el = document.querySelector<HTMLElement>(".nfd-title[data-anim-title]:not(.ltp-era-title)");
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

// The tour popover is a real DOM node in the rendered string, but it targets
// an arbitrary element elsewhere on the page, so it is positioned here (like
// enhanceNav's pill) rather than laid out purely in CSS.
function positionTour(): void {
  const pop = document.querySelector<HTMLElement>(".tour-pop");
  if (!pop) return;
  // Out of the way before the hit test, so a popover the last placement left
  // sitting over its own target cannot be read as something covering it.
  pop.style.display = "none";
  pop.classList.remove("placed");

  const anchor = visibleAnchor(pop.dataset["target"]);
  if (!anchor) return; // Target not on this page yet (e.g. an empty roster); stays hidden.

  const a = anchor.getBoundingClientRect();
  const gap = 14;
  pop.style.display = "flex";
  const p = pop.getBoundingClientRect();

  // Side placement needs the popover's full width clear of the anchor on one
  // side or the other. On a phone neither side has it, and the old code fell
  // through to a clamp that centred the popover ON its own target - the
  // Compendium's coachmark sat squarely over the search box it was describing.
  // When neither side fits, go below the anchor instead (or above it, if the
  // anchor is low on the screen), which always leaves the target visible.
  const fitsRight = a.right + gap + p.width <= window.innerWidth - 12;
  const fitsLeft = a.left - gap - p.width >= 12;
  let left: number;
  let top: number;
  let arrowRight = false;
  let arrowV = "";

  if (fitsRight || fitsLeft) {
    left = fitsRight ? a.right + gap : a.left - p.width - gap;
    arrowRight = !fitsRight;
    top = a.top + a.height / 2 - p.height / 2;
  } else {
    // Under the anchor by preference; flip above when there is no room under.
    const below = a.bottom + gap;
    const roomBelow = below + p.height <= window.innerHeight - 12;
    top = roomBelow ? below : a.top - p.height - gap;
    arrowV = roomBelow ? "arrow-top" : "arrow-bottom";
    // Line the popover up with the anchor's left edge where it can.
    left = a.left;
  }
  left = Math.max(12, Math.min(left, window.innerWidth - p.width - 12));
  top = Math.max(12, Math.min(top, window.innerHeight - p.height - 12));

  pop.style.left = `${left}px`;
  pop.style.top = `${top}px`;
  pop.classList.toggle("arrow-right", arrowRight);
  pop.classList.toggle("arrow-top", arrowV === "arrow-top");
  pop.classList.toggle("arrow-bottom", arrowV === "arrow-bottom");

  // The arrow sits at the popover's midpoint in CSS, which is only the anchor's
  // midpoint when nothing clamped. A tall popover beside a topbar link gets
  // pushed down to the 12px margin and its arrow then points at the space under
  // the tab rather than the tab, so aim it at the anchor explicitly. Kept 14px
  // clear of the corners, where a diamond straddling two borders looks broken.
  const arrow = pop.querySelector<HTMLElement>(".tour-pop-arrow");
  if (arrow) {
    const pin = (v: number, span: number) => Math.max(14, Math.min(v, span - 14));
    if (arrowV) {
      arrow.style.top = "";
      arrow.style.left = `${pin(a.left + a.width / 2 - left, p.width) - 8}px`;
    } else {
      arrow.style.left = "";
      arrow.style.top = `${pin(a.top + a.height / 2 - top, p.height)}px`;
    }
  }
  pop.classList.add("placed");
}

// A popover you opened by accident had exactly one way out: find the small
// summary again, or press Escape. A phone has no Escape key, so on the device
// where the mis-tap is most likely the dismissal was the least available - and
// the era switcher, the ledger and the overflow menu all sit over content you
// then cannot reach. Tapping anywhere outside closes them, which is what every
// menu on the platform does.
//
// A popover is identified by its own layout, not by a marker attribute: an
// out-of-flow panel is floating over the page and must yield to a tap
// elsewhere, whereas an in-flow <details> is an accordion whose content is part
// of the document and has to stay put. That test needs no markup in the
// eighteen templates and cannot fall out of date when a new one is added.
document.addEventListener(
  "pointerdown",
  (e) => {
    const t = e.target as Node | null;
    for (const d of document.querySelectorAll<HTMLDetailsElement>("details[open]")) {
      if (t && d.contains(t)) continue;
      const panel = d.querySelector<HTMLElement>(":scope > *:not(summary)");
      if (!panel) continue;
      const pos = getComputedStyle(panel).position;
      if (pos !== "absolute" && pos !== "fixed") continue;
      d.open = false;
    }
  },
  true,
);

window.addEventListener("resize", () => {
  enhanceNav();
  positionTour();
  // The pinned header wraps to a second line as the viewport narrows, and the
  // roster panel sticks below it, so its height has to be re-read on resize.
  measureStickyHeader();
  // Rotating a phone changes the fit scale, which changes where every page
  // guide lands. Re-paginating re-fits first, so this is the whole job.
  paginatePrintPreview();
});

// Placed against fallback metrics on the first paint, so it lands ~60px adrift
// of a target that the real fonts then move. One re-aim once they are in.
if (document.fonts) void document.fonts.ready.then(() => positionTour());

// The coachmark is position:fixed and its anchor usually is not - the topbar
// scrolls away with the page - so it has to be re-aimed as the page moves or it
// ends up pointing at whatever has slid under it. Capture, so it also follows
// anchors inside a scrolling panel; one frame at a time, since this measures.
let tourFrame = 0;
window.addEventListener(
  "scroll",
  () => {
    if (tourFrame) return;
    tourFrame = requestAnimationFrame(() => {
      tourFrame = 0;
      positionTour();
    });
  },
  { passive: true, capture: true },
);

// Opening an era accordion is a native <details> toggle: it changes nothing in
// the store, so paint() never runs and the title would never animate. Captured,
// because the toggle event does not bubble.
document.addEventListener(
  "toggle",
  (e) => {
    const d = e.target;
    if (!(d instanceof HTMLDetailsElement) || !d.classList.contains("ltp-era")) return;
    const el = d.querySelector<HTMLElement>(".ltp-era-title[data-anim-title]");
    if (!el) return;
    if (d.open) {
      el.dataset["animDone"] = "1";
      animateEraTitle(el);
    } else {
      // Closed: let it play again next time it is opened.
      delete el.dataset["animDone"];
    }
  },
  true,
);

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
  const keepsScroll =
    (next.view === "learn-classic" && !!next.anchor) ||
    // Learn to Play is one page: its tabs are scroll positions on the page you
    // are already on, so jumping to the top first would show it snap twice.
    (next.view === "learn" && store.getState().route.view === "learn");
  if (!keepsScroll) window.scrollTo(0, 0);
  store.setState((s) => ({ ...s, route: next, ui: { ...s.ui, modal: undefined } }));
});

wireActions(root);
store.subscribe(paint);

if (!tryImportShare()) {
  store.setState((s) => ({ ...s, route: parseRoute(location.hash) }));
}
paint();

/*
 * Uploaded pictures live in IndexedDB (see image-store.ts), which is async, and
 * the first paint above is not going to wait for a disk read.
 *
 * So it does not: the page paints immediately with any uploaded art missing,
 * the blobs are read, and a repaint fills them in. In practice that is one
 * frame on a warm store and nobody sees the gap - and the alternative, holding
 * the entire first paint behind an IndexedDB open, would make every page in the
 * app start later so that emblems on one of them arrive together.
 *
 * The repaint is forced rather than driven by a state change, because nothing
 * in the state changed - the references were always there. What changed is that
 * imageSrc can now resolve them.
 */
void hydrateImages().then(paint);

// Fleet Sync: a merge that lands while the app is already open (another
// device edited first) has to reach the roster on screen, not just storage.
FleetSync.onChange = (lists) => store.setState((s) => ({ ...s, lists }));
// Deferred, same as the share-link import above settling before its own
// paint: let the very first paint happen before spending a network round
// trip on a sync nobody is looking at yet.
if (FleetSync.enabled()) setTimeout(() => void FleetSync.sync().catch(() => {}), 800);
