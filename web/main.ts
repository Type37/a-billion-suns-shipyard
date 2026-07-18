import { parseRoute, store } from "./state.ts";
import { render } from "./render.ts";
import { wireActions } from "./actions.ts";
import { decodeShare, sharePayloadFromHash } from "./share.ts";
import { persistCustomFactions, persistLists } from "./storage.ts";
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
  builder: "Fleet builder",
  print: "Print setup",
  foundry: "Custom Rules",
  solo: "Solo",
  "solo-outfit": "Outfit",
  ships: "Ship Compendium",
  play: "Play Mode",
  changelog: "Changelog",
};

// The hash router repaints the whole page without touching the title, so every
// route read as the same document. A screen reader gets no signal that the view
// changed at all; the title is the primary one it has.
function syncDocumentTitle(): void {
  const view = store.getState().route.view;
  const name = VIEW_TITLE[view];
  document.title = name ? `${name} - ${SITE_NAME}` : SITE_NAME;
}

function paint(): void {
  // Most text fields commit on `change` (blur), so typing does not re-render.
  // The compendium search is the exception: it filters live on `input`, so
  // focus and caret are preserved for the focused control either way.
  const active = document.activeElement;
  const activeKey = focusKey(active);
  const caret = active instanceof HTMLInputElement ? active.selectionStart : null;

  // The builder's roster panel scrolls independently (position: sticky,
  // overflow-y: auto) and is fully destroyed and recreated by innerHTML
  // replacement below, which resets scrollTop to 0. Nothing may move on a
  // click that isn't the point of the click, so its scroll position is
  // carried across the re-render like focus and caret are.
  const manifestScroll = document.querySelector(".mf-manifest")?.scrollTop ?? 0;

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

  root.innerHTML = render(store.getState());
  // Every view builds its own <main>; tagging the first one here rather than in
  // eighteen templates keeps the skip link's target correct on all of them.
  const mainEl = root.querySelector("main");
  if (mainEl) mainEl.id = "main-content";
  syncDocumentTitle();
  enhanceNav();
  positionTour();

  const manifest = document.querySelector(".mf-manifest");
  if (manifest) manifest.scrollTop = manifestScroll;

  animateFactionTitle();

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
      restored.focus();
      if (restored instanceof HTMLInputElement && caret !== null) {
        try {
          restored.setSelectionRange(caret, caret);
        } catch {
          // Some input types do not support selection ranges; ignore.
        }
      }
    }
  }
}

// A share link carries the whole list (and any custom faction) in the hash. Import
// it once, drop it into the register, then rewrite the URL to the new list's
// builder route so a refresh cannot import a second copy.
function tryImportShare(): boolean {
  const payload = sharePayloadFromHash(location.hash);
  if (!payload) return false;
  const decoded = decodeShare(payload);
  if (!decoded) return false;

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
  // same route below - harmless and idempotent.
  location.replace(`#/list/${decoded.list.id}`);
  return true;
}

// A single highlight that slides between the top-right nav items. It rests on
// the item matching the current route and follows the pointer on hover, easing
// on Fluent's decelerate curve (set in CSS). Re-wired after every re-render.
function enhanceNav(): void {
  const nav = document.querySelector<HTMLElement>(".topnav");
  const pill = nav?.querySelector<HTMLElement>(".nav-pill");
  if (!nav || !pill) return;
  const links = Array.from(nav.querySelectorAll<HTMLAnchorElement>("a"));
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
  links.forEach((a) => a.addEventListener("mouseenter", () => place(a)));
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

// Age of Unity: the title comes in like the Star Wars logo - huge and distant,
// then recedes into place, fading up only as it shrinks. Composed, inevitable.
function recedeTitle(el: HTMLElement, text: string): void {
  el.textContent = text;
  el.appendChild(titleRule());
  el.style.transformOrigin = "50% 50%";
  el.animate(
    [
      { opacity: 0, transform: "scale(2.1)" },
      { opacity: 0.12, transform: "scale(1.45)", offset: 0.45 },
      { opacity: 1, transform: "scale(1)" },
    ],
    { duration: 520, fill: "forwards", easing: "cubic-bezier(.2,.75,.2,1)" },
  );
}

// Armageddon: the title thumps straight down and squashes on impact, then
// rebounds - contained to the text itself (vertical only, no sideways shake),
// and the red underline draws in only once it has landed.
function slamTitle(el: HTMLElement, text: string): void {
  el.textContent = text;
  el.appendChild(titleRule());
  el.classList.add("is-landing"); // hold the underline collapsed through the thump
  el.style.transformOrigin = "50% 100%"; // land on the baseline
  el.animate(
    [
      { opacity: 0, transform: "translateY(-18px) scaleY(1.14)" },
      { opacity: 1, transform: "translateY(0) scaleY(0.84)", offset: 0.5 },
      { transform: "translateY(0) scaleY(1.07)", offset: 0.72 },
      { transform: "translateY(0) scaleY(1)" },
    ],
    { duration: 360, easing: "cubic-bezier(.2,.9,.2,1)", fill: "forwards" },
  );
  // Once the title has landed, drop the hold; the CSS transition on the
  // underline draws it in. A timer, so it never gets stranded if the finish
  // event is missed.
  window.setTimeout(() => el.classList.remove("is-landing"), 380);
}

// The dice / command glyphs pop in with a short left-to-right stagger just after
// the title, so the two figures feel like they resolve into place.
function animateStatGlyphs(): void {
  const glyphs = document.querySelectorAll<HTMLElement>(".nfd-stats .dice-ico, .nfd-stats .cmd-token");
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

  // Desktop only ("this order is just for desktop"), and never against the OS
  // reduced-motion preference. In both cases the resting markup is already right.
  const canMotion =
    window.matchMedia("(hover: hover) and (min-width: 992px)").matches &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!canMotion) return;

  if (era === "hyper") decodeTitle(el, title);
  else if (era === "arma") slamTitle(el, title);
  else recedeTitle(el, title);
  animateStatGlyphs();
}

// The tour popover is a real DOM node in the rendered string, but it targets
// an arbitrary element elsewhere on the page, so it is positioned here (like
// enhanceNav's pill) rather than laid out purely in CSS.
function positionTour(): void {
  const pop = document.querySelector<HTMLElement>(".tour-pop");
  if (!pop) return;
  const selector = pop.dataset["target"];
  const anchor = selector ? document.querySelector<HTMLElement>(selector) : null;
  if (!anchor) return; // Target not on this page yet (e.g. an empty roster); stays hidden.

  const a = anchor.getBoundingClientRect();
  const gap = 14;
  pop.style.display = "flex";
  const p = pop.getBoundingClientRect();

  let left = a.right + gap;
  let arrowRight = false;
  if (left + p.width > window.innerWidth - 12) {
    left = a.left - p.width - gap;
    arrowRight = true;
  }
  left = Math.max(12, Math.min(left, window.innerWidth - p.width - 12));
  let top = a.top + a.height / 2 - p.height / 2;
  top = Math.max(12, Math.min(top, window.innerHeight - p.height - 12));

  pop.style.left = `${left}px`;
  pop.style.top = `${top}px`;
  pop.classList.toggle("arrow-right", arrowRight);
  pop.classList.add("placed");
}

window.addEventListener("resize", () => {
  enhanceNav();
  positionTour();
});

window.addEventListener("hashchange", () => {
  store.setState((s) => ({ ...s, route: parseRoute(location.hash) }));
});

wireActions(root);
store.subscribe(paint);

if (!tryImportShare()) {
  store.setState((s) => ({ ...s, route: parseRoute(location.hash) }));
}
paint();
