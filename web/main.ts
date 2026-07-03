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
  // Text fields commit on `change` (blur), not `input`, so typing never triggers
  // a re-render and there is no focus to preserve mid-keystroke. A plain replace
  // is enough. Scroll position is kept because we swap innerHTML, not the node.
  root.innerHTML = render(store.getState());
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

window.addEventListener("hashchange", () => {
  store.setState((s) => ({ ...s, route: parseRoute(location.hash) }));
});

wireActions(root);
store.subscribe(paint);

if (!tryImportShare()) {
  store.setState((s) => ({ ...s, route: parseRoute(location.hash) }));
}
paint();
