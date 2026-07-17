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

function paint(): void {
  // Most text fields commit on `change` (blur), so typing does not re-render.
  // The compendium search is the exception: it filters live on `input`, so we
  // preserve focus and caret for any focused element that carries an id.
  const active = document.activeElement;
  const activeId = active instanceof HTMLElement && active.id ? active.id : null;
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
  enhanceNav();
  positionTour();

  const manifest = document.querySelector(".mf-manifest");
  if (manifest) manifest.scrollTop = manifestScroll;

  for (const d of document.querySelectorAll<HTMLDetailsElement>("details[data-persist]")) {
    const key = d.dataset["persist"];
    if (!key) continue;
    // A key seen in neither set is new this render: leave its authored default.
    if (openPanels.has(key)) d.open = true;
    else if (closedPanels.has(key)) d.open = false;
  }

  if (activeId) {
    const restored = document.getElementById(activeId);
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
  place(active);
  links.forEach((a) => a.addEventListener("mouseenter", () => place(a)));
  nav.addEventListener("mouseleave", () => place(active));
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
