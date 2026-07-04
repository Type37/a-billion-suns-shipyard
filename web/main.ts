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

  root.innerHTML = render(store.getState());
  enhanceNav();

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

window.addEventListener("resize", enhanceNav);

window.addEventListener("hashchange", () => {
  store.setState((s) => ({ ...s, route: parseRoute(location.hash) }));
});

wireActions(root);
store.subscribe(paint);

if (!tryImportShare()) {
  store.setState((s) => ({ ...s, route: parseRoute(location.hash) }));
}
paint();
