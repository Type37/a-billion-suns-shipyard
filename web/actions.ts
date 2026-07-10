import type { Faction, GameMode, Mass, PilotClass, Weapon } from "../src/types.ts";
import { findFaction, isCustom } from "./catalog.ts";
import { newId, persistCustomFactions, persistLists, persistOnboarding, persistOutfits } from "./storage.ts";
import type { SavedOutfit } from "./storage.ts";
import {
  createList,
  createOutfit,
  createTrainingList,
  EMPTY_SHIP_FILTER,
  freshPlayState,
  nextOutfitShipId,
  nextUnitIdFor,
  routeHash,
  store,
  updateFleet,
  updateList,
  updateOutfit,
} from "./state.ts";
import type { LastRoll, ShipFilter } from "./state.ts";
import { RANDOM_BEHAVIOUR, GLITCH_BLIP, type RollRow } from "../src/data/junkspace-solo.ts";
import { randomIconId } from "./emblems.ts";
import { shareUrl } from "./share.ts";
import { fleetToMarkdown } from "./export-text.ts";

// --- Solo dice roller -------------------------------------------------------

function d(sides: number): number {
  return Math.floor(Math.random() * sides) + 1;
}

function rowFor(rows: RollRow[], v: number): RollRow | undefined {
  return rows.find((r) => {
    const [lo, hi] = r.roll.includes("-") ? r.roll.split("-").map(Number) : [Number(r.roll), Number(r.roll)];
    return v >= lo && v <= hi;
  });
}

function rollTable(table: string): LastRoll {
  switch (table) {
    case "behaviour": {
      const v = d(6);
      const row = rowFor(RANDOM_BEHAVIOUR, v);
      return { table: "Hostile behaviour (D6)", value: v, result: row?.result ?? "" };
    }
    case "glitch": {
      const v = d(6);
      const row = rowFor(GLITCH_BLIP, v);
      return { table: "Glitch a Blip (D6)", value: v, result: row?.result ?? "", detail: row?.detail };
    }
    case "initiative": {
      const v = d(6);
      const result = v === 1 ? "Two successes" : v === 2 || v === 3 ? "One success" : "No success";
      return { table: "Initiative die (D6)", value: v, result, detail: "A 2 or 3 is one success; a 1 is two successes." };
    }
    case "scatter": {
      const v = d(10);
      return {
        table: "Setup scatter (D10)",
        value: v,
        result: `Scatter ${v}"`,
        detail: "Push the object that many inches in the direction of the D10's pointed top. Stop within 2\" of a table edge.",
      };
    }
    case "perk": {
      const v = d(12);
      return {
        table: "Perk (D12)",
        value: v,
        result: `Perk ${v}`,
        detail: "Take that numbered perk from the pilot's class list. If you already have it, pick another from the list.",
      };
    }
    default:
      return { table, value: d(6), result: "" };
  }
}

function currentOutfitId(): string | null {
  const r = store.getState().route;
  return r.view === "solo-outfit" ? r.outfitId : null;
}

function editOutfit(fn: (o: SavedOutfit) => SavedOutfit): void {
  const id = currentOutfitId();
  if (!id) return;
  store.setState((s) => updateOutfit(s, id, fn));
}

// All interaction goes through delegated listeners on #app. Elements declare
// intent with data-action attributes; this module mutates state and persists.

let toastTimer: ReturnType<typeof setTimeout> | undefined;

function showToast(message: string): void {
  if (toastTimer) clearTimeout(toastTimer);
  store.setState((s) => ({ ...s, ui: { ...s.ui, toast: message } }));
  toastTimer = setTimeout(() => {
    store.setState((s) => ({ ...s, ui: { ...s.ui, toast: undefined } }));
  }, 2200);
}

function currentListId(): string | null {
  const r = store.getState().route;
  return r.view === "builder" || r.view === "print" || r.view === "play" ? r.listId : null;
}

function editFaction(factionId: string, fn: (f: Faction) => Faction): void {
  store.setState((s) => {
    const customFactions = s.customFactions.map((f) => (f.id === factionId ? fn(f) : f));
    persistCustomFactions(customFactions);
    return { ...s, customFactions };
  });
}

function currentFoundryId(): string | null {
  const r = store.getState().route;
  return r.view === "foundry" && r.factionId ? r.factionId : null;
}

function downloadJson(filename: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// Import a faction from a JSON string (file or clipboard). Assigns a fresh id
// so imports never collide with an existing custom faction, then persists.
function importFactionJson(text: string, notFactionMessage: string): void {
  let parsed: Faction;
  try {
    parsed = JSON.parse(text) as Faction;
  } catch {
    showToast("That could not be read as a faction.");
    return;
  }
  if (typeof parsed.name !== "string" || !Array.isArray(parsed.ships) || !Array.isArray(parsed.hvp)) {
    showToast(notFactionMessage);
    return;
  }
  parsed.id = newId("cf");
  store.setState((s) => {
    const customFactions = [...s.customFactions, parsed];
    persistCustomFactions(customFactions);
    return { ...s, customFactions };
  });
  showToast(`Imported "${parsed.name}".`);
}

// Read an uploaded image, downscale it to a square emblem, and return a compact
// data URL. Keeping it small (240px, JPEG) means it survives localStorage and
// does not bloat the app. Rejects non-images.
function readEmblemImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("not an image"));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("read failed"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("decode failed"));
      img.onload = () => {
        const size = 240;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("no canvas"));
          return;
        }
        // Cover-fit: crop to a centred square, then scale.
        const side = Math.min(img.width, img.height);
        const sx = (img.width - side) / 2;
        const sy = (img.height - side) / 2;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, size, size);
        ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);
        const hasAlpha = file.type === "image/png";
        resolve(canvas.toDataURL(hasAlpha ? "image/png" : "image/jpeg", 0.82));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

// Ship art is landscape, not a square badge: cover-fit into a 5:3 frame so a
// hull keeps its proportions instead of being centre-cropped to a square.
function readShipImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("not an image"));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("read failed"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("decode failed"));
      img.onload = () => {
        const w = 320;
        const h = 192; // 5:3
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("no canvas"));
          return;
        }
        // Cover-fit: scale so the frame is filled, crop the overflow, centred.
        const scale = Math.max(w / img.width, h / img.height);
        const dw = img.width * scale;
        const dh = img.height * scale;
        const dx = (w - dw) / 2;
        const dy = (h - dh) / 2;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, dx, dy, dw, dh);
        const hasAlpha = file.type === "image/png";
        resolve(canvas.toDataURL(hasAlpha ? "image/png" : "image/jpeg", 0.82));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

// ---------------------------------------------------------------------------
// First-visit coachmark tours
// ---------------------------------------------------------------------------

/** Marks a tour as seen for good (dedup, since dismiss and the last "next" both call this) and closes it. */
function finishTour(tourId: string): void {
  store.setState((s) => {
    const toursSeen = s.onboarding.toursSeen.includes(tourId)
      ? s.onboarding.toursSeen
      : [...s.onboarding.toursSeen, tourId];
    const onboarding = { ...s.onboarding, toursSeen };
    persistOnboarding(onboarding);
    return { ...s, onboarding, ui: { ...s.ui, tour: undefined } };
  });
}

// ---------------------------------------------------------------------------
// Click handling
// ---------------------------------------------------------------------------

function handleClick(e: MouseEvent): void {
  const target = (e.target as HTMLElement).closest<HTMLElement>("[data-action]");
  if (!target) return;
  const action = target.dataset["action"];
  const state = store.getState();

  switch (action) {
    case "new-list": {
      const mode = (target.dataset["mode"] ?? "armageddon") as GameMode;
      const factionId = target.dataset["faction"] ?? "vyke";
      const freePlay = target.dataset["freeplay"] === "1";
      const list = createList(mode, factionId, freePlay);
      store.setState((s) => {
        const lists = [...s.lists, list];
        persistLists(lists);
        return { ...s, lists, ui: { ...s.ui, modal: undefined } };
      });
      location.hash = routeHash({ view: "builder", listId: list.id });
      break;
    }
    case "duplicate-list": {
      const id = target.dataset["id"];
      const source = state.lists.find((l) => l.id === id);
      if (!source) return;
      const copy = structuredClone(source);
      copy.id = newId("fl");
      copy.fleet.name = source.fleet.name ? `${source.fleet.name} (copy)` : "";
      copy.createdAt = new Date().toISOString();
      copy.updatedAt = copy.createdAt;
      store.setState((s) => {
        const lists = [...s.lists, copy];
        persistLists(lists);
        return { ...s, lists };
      });
      // From the Fleets table, stay put - the toast is enough, the row shows up
      // below. From inside the builder, a silent copy sitting off-screen in the
      // list looks like the button did nothing, so jump straight to the copy.
      if (currentListId() === id) {
        location.hash = routeHash({ view: "builder", listId: copy.id });
      } else {
        showToast("Fleet duplicated.");
      }
      break;
    }
    case "delete-list": {
      const id = target.dataset["id"];
      const doomed = state.lists.find((l) => l.id === id);
      if (!doomed) return;
      if (!confirm(`Delete "${doomed.fleet.name || "Unnamed fleet"}"? This cannot be undone.`)) return;
      store.setState((s) => {
        const lists = s.lists.filter((l) => l.id !== id);
        persistLists(lists);
        return { ...s, lists };
      });
      if (currentListId() === id) location.hash = "#/";
      break;
    }
    case "share-list": {
      const id = target.dataset["id"];
      const list = state.lists.find((l) => l.id === id);
      if (!list) return;
      const cf = isCustom(list.fleet.factionId, state.customFactions)
        ? findFaction(list.fleet.factionId, state.customFactions)
        : undefined;
      const url = shareUrl(list, cf);
      // window.prompt() itself can throw in some embedded/mobile contexts, so
      // it is wrapped: whatever happens, the user gets a toast either way.
      const manualFallback = () => {
        try {
          prompt("Copy this link:", url);
        } catch {
          // No prompt available either; the toast below is the only feedback left.
        }
        showToast("Copy the link from the box above.");
      };
      if (navigator.clipboard?.writeText) {
        navigator.clipboard
          .writeText(url)
          .then(() => showToast("Share link copied to the clipboard."))
          .catch(manualFallback);
      } else {
        manualFallback();
      }
      break;
    }
    case "set-emblem": {
      const id = currentListId();
      const emblemId = target.dataset["emblem"];
      if (!id || !emblemId) return;
      store.setState((s) => updateList(s, id, (l) => ({ ...l, emblem: emblemId })));
      break;
    }
    case "clear-emblem-image": {
      const id = currentListId();
      if (!id) return;
      store.setState((s) => updateList(s, id, (l) => ({ ...l, emblemImage: undefined, emblemLib: undefined })));
      break;
    }
    case "cf-clear-emblem": {
      const fid = currentFoundryId();
      if (!fid) return;
      editFaction(fid, (f) => ({ ...f, emblemImage: undefined, emblemLib: undefined }));
      break;
    }
    // --- icon library + random, across the three contexts ---
    case "set-emblem-lib": {
      const id = currentListId();
      const lib = target.dataset["lib"];
      if (!id || !lib) return;
      store.setState((s) => updateList(s, id, (l) => ({ ...l, emblemLib: lib, emblemImage: undefined })));
      break;
    }
    case "set-emblem-color": {
      const id = currentListId();
      if (!id) return;
      const raw = target.dataset["color"];
      const color = raw === "ink" || raw === "blue" || raw === "red" ? raw : undefined;
      store.setState((s) => updateList(s, id, (l) => ({ ...l, emblemColor: color })));
      break;
    }
    case "random-emblem": {
      const id = currentListId();
      const lib = randomIconId();
      if (!id || !lib) return;
      store.setState((s) => updateList(s, id, (l) => ({ ...l, emblemLib: lib, emblemImage: undefined })));
      break;
    }
    case "outfit-set-lib": {
      const lib = target.dataset["lib"];
      if (lib) editOutfit((o) => ({ ...o, emblemLib: lib, emblemImage: undefined }));
      break;
    }
    case "outfit-random-emblem": {
      const lib = randomIconId();
      if (lib) editOutfit((o) => ({ ...o, emblemLib: lib, emblemImage: undefined }));
      break;
    }
    case "cf-set-lib": {
      const fid = currentFoundryId();
      const lib = target.dataset["lib"];
      if (fid && lib) editFaction(fid, (f) => ({ ...f, emblemLib: lib, emblemImage: undefined }));
      break;
    }
    case "cf-random-emblem": {
      const fid = currentFoundryId();
      const lib = randomIconId();
      if (fid && lib) editFaction(fid, (f) => ({ ...f, emblemLib: lib, emblemImage: undefined }));
      break;
    }
    case "set-limit": {
      const id = currentListId();
      const limit = Number(target.dataset["limit"]);
      if (!id || !Number.isFinite(limit)) return;
      store.setState((s) => updateFleet(s, id, (f) => ({ ...f, creditsLimit: limit })));
      break;
    }
    case "set-faction": {
      const id = currentListId();
      const factionId = target.dataset["faction"];
      if (!id || !factionId) return;
      // Units and personnel from the old faction would no longer resolve; the
      // inspector would flag every one. A faction change starts the list clean.
      const list = store.getState().lists.find((l) => l.id === id);
      if (list && (list.fleet.units.length > 0 || list.fleet.hvp.length > 0)) {
        if (!confirm("Changing faction clears the units and personnel in this list. Continue?")) return;
      }
      store.setState((s) => updateFleet(s, id, (f) => ({ ...f, factionId, units: [], hvp: [] })));
      break;
    }
    case "add-unit": {
      const id = currentListId();
      const shipId = target.dataset["ship"];
      if (!id || !shipId) return;
      store.setState((s) =>
        updateFleet(s, id, (f) => ({
          ...f,
          units: [...f.units, { id: nextUnitIdFor(f), shipClassId: shipId, count: 1 }],
        })),
      );
      break;
    }
    case "open-unit": {
      const unitId = target.dataset["unit"];
      if (!unitId) return;
      store.setState((s) => ({ ...s, ui: { ...s.ui, modal: { kind: "unit", unitId } } }));
      break;
    }
    case "close-modal": {
      store.setState((s) => ({ ...s, ui: { ...s.ui, modal: undefined } }));
      break;
    }
    case "tour-next": {
      const tourId = target.dataset["tour"];
      const step = Number(target.dataset["step"]);
      const len = Number(target.dataset["len"]);
      if (!tourId) return;
      if (step + 1 >= len) {
        finishTour(tourId);
      } else {
        store.setState((s) => ({ ...s, ui: { ...s.ui, tour: { tourId, step: step + 1 } } }));
      }
      break;
    }
    case "tour-dismiss": {
      const tourId = target.dataset["tour"];
      if (!tourId) return;
      finishTour(tourId);
      break;
    }
    case "toggle-carry": {
      const id = currentListId();
      const unitId = target.dataset["unit"];
      const index = Number(target.dataset["index"]);
      if (!id || !unitId || !Number.isInteger(index)) return;
      store.setState((s) =>
        updateFleet(s, id, (f) => ({
          ...f,
          hvp: f.hvp.map((h, i) =>
            i === index ? { ...h, assignedUnitId: h.assignedUnitId === unitId ? undefined : unitId } : h,
          ),
        })),
      );
      break;
    }
    case "remove-unit": {
      const id = currentListId();
      const unitId = target.dataset["unit"];
      if (!id || !unitId) return;
      store.setState((s) => ({
        ...updateFleet(s, id, (f) => ({
          ...f,
          units: f.units.filter((u) => u.id !== unitId),
          hvp: f.hvp.map((h) => (h.assignedUnitId === unitId ? { ...h, assignedUnitId: undefined } : h)),
        })),
        ui: { ...s.ui, modal: undefined },
      }));
      break;
    }
    case "unit-count": {
      const id = currentListId();
      const unitId = target.dataset["unit"];
      const delta = Number(target.dataset["delta"]);
      if (!id || !unitId || !Number.isFinite(delta)) return;
      store.setState((s) =>
        updateFleet(s, id, (f) => {
          // Stepping below 1 removes the unit entirely (its (-) button turns
          // red at count 1 to signal the delete).
          const current = f.units.find((u) => u.id === unitId);
          if (current && current.count + delta < 1) {
            return {
              ...f,
              units: f.units.filter((u) => u.id !== unitId),
              // Unassign any HVP that were riding the deleted unit.
              hvp: f.hvp.map((h) =>
                h.assignedUnitId === unitId ? { ...h, assignedUnitId: undefined } : h,
              ),
            };
          }
          return {
            ...f,
            units: f.units.map((u) => {
              if (u.id !== unitId) return u;
              const count = Math.max(1, u.count + delta);
              const shipNames = u.shipNames ? u.shipNames.slice(0, count) : undefined;
              return { ...u, count, ...(shipNames ? { shipNames } : {}) };
            }),
          };
        }),
      );
      break;
    }
    case "toggle-ship-names": {
      const unitId = target.dataset["unit"];
      store.setState((s) => ({
        ...s,
        ui: { ...s.ui, openShipNames: s.ui.openShipNames === unitId ? undefined : unitId },
      }));
      break;
    }
    case "add-hvp": {
      // Only one of each HVP type may ride in a fleet at a time, so this is a
      // no-op if that type is already selected (guards a stale/replayed click).
      const id = currentListId();
      const hvpId = target.dataset["hvp"];
      if (!id || !hvpId) return;
      store.setState((s) =>
        updateFleet(s, id, (f) => (f.hvp.some((h) => h.hvpId === hvpId) ? f : { ...f, hvp: [...f.hvp, { hvpId }] })),
      );
      // The store re-renders synchronously, so the chosen card (with its
      // still-closed config popover) already exists in the DOM by this line.
      // Open it immediately - the assigner should be visible the instant you
      // add someone, not wait for a second click on the pencil icon. The
      // popover is position: absolute, so opening it never touches layout.
      const opened = document.querySelector<HTMLDetailsElement>(`.personnel-config[data-hvp="${hvpId}"]`);
      if (opened) opened.open = true;
      break;
    }
    case "remove-hvp": {
      const id = currentListId();
      const index = Number(target.dataset["index"]);
      if (!id || !Number.isInteger(index)) return;
      store.setState((s) => updateFleet(s, id, (f) => ({ ...f, hvp: f.hvp.filter((_, i) => i !== index) })));
      break;
    }
    case "do-print": {
      window.print();
      break;
    }
    case "set-catalog-view": {
      // Clicking the already-active view returns to the plain list, so each
      // button is a real on/off toggle rather than a one-way switch.
      const view = target.dataset["view"];
      const next = view === "mass" || view === "chart" ? view : undefined;
      store.setState((s) => ({
        ...s,
        ui: { ...s.ui, catalogView: s.ui.catalogView === next ? undefined : next },
      }));
      break;
    }
    case "set-chart-stat": {
      const stat = target.dataset["stat"];
      if (stat !== "cost" && stat !== "mass" && stat !== "thrust" && stat !== "silhouette" && stat !== "shields") return;
      store.setState((s) => ({ ...s, ui: { ...s.ui, catalogChartStat: stat } }));
      break;
    }
    case "print-format": {
      const format = target.dataset["format"] === "cards" ? "cards" : "roster";
      store.setState((s) => ({
        ...s,
        ui: { ...s.ui, print: { format, trackers: s.ui.print?.trackers ?? false } },
      }));
      break;
    }
    case "print-trackers": {
      store.setState((s) => ({
        ...s,
        ui: { ...s.ui, print: { format: s.ui.print?.format ?? "roster", trackers: !(s.ui.print?.trackers ?? false) } },
      }));
      break;
    }
    case "copy-list-text": {
      const id = target.dataset["id"];
      const list = state.lists.find((l) => l.id === id);
      if (!list) return;
      const text = fleetToMarkdown(list, state.customFactions);
      navigator.clipboard
        .writeText(text)
        .then(() => showToast("Fleet copied as text."))
        .catch(() => prompt("Copy this list:", text));
      break;
    }

    // ---- Solo / Junkspace -------------------------------------------------
    case "new-outfit": {
      const outfit = createOutfit();
      store.setState((s) => {
        const outfits = [...s.outfits, outfit];
        persistOutfits(outfits);
        return { ...s, outfits, ui: { ...s.ui, soloTab: "outfit" } };
      });
      location.hash = routeHash({ view: "solo-outfit", outfitId: outfit.id });
      break;
    }
    case "duplicate-outfit": {
      const id = target.dataset["id"];
      const src = state.outfits.find((o) => o.id === id);
      if (!src) return;
      const copy = structuredClone(src);
      copy.id = newId("of");
      copy.name = src.name ? `${src.name} (copy)` : "";
      copy.createdAt = new Date().toISOString();
      copy.updatedAt = copy.createdAt;
      store.setState((s) => {
        const outfits = [...s.outfits, copy];
        persistOutfits(outfits);
        return { ...s, outfits };
      });
      showToast("Outfit duplicated.");
      break;
    }
    case "delete-outfit": {
      const id = target.dataset["id"];
      const doomed = state.outfits.find((o) => o.id === id);
      if (!doomed) return;
      if (!confirm(`Delete "${doomed.name || "Unnamed outfit"}"? This cannot be undone.`)) return;
      store.setState((s) => {
        const outfits = s.outfits.filter((o) => o.id !== id);
        persistOutfits(outfits);
        return { ...s, outfits };
      });
      if (currentOutfitId() === id) location.hash = "#/solo";
      break;
    }
    case "solo-tab": {
      const tab = target.dataset["tab"] as "outfit" | "play" | "campaign" | "reference";
      store.setState((s) => ({ ...s, ui: { ...s.ui, soloTab: tab } }));
      break;
    }
    case "outfit-add-ship": {
      const shipId = target.dataset["ship"];
      if (!shipId) return;
      editOutfit((o) => {
        if (o.ships.length >= 5) return o;
        return {
          ...o,
          ships: [...o.ships, { id: nextOutfitShipId(o), shipClassId: shipId, pilotClass: "Gunner" as PilotClass }],
        };
      });
      break;
    }
    case "outfit-remove-ship": {
      const shipId = target.dataset["ship"];
      editOutfit((o) => ({
        ...o,
        ships: o.ships.filter((s) => s.id !== shipId),
        perks: o.perks.filter((p) => p.shipId !== shipId),
      }));
      break;
    }
    case "outfit-clear-emblem": {
      editOutfit((o) => ({ ...o, emblemImage: undefined }));
      break;
    }
    case "alert-adjust": {
      const delta = Number(target.dataset["delta"]);
      editOutfit((o) => ({ ...o, alertLevel: Math.max(1, Math.min(10, o.alertLevel + delta)) }));
      break;
    }
    case "round-adjust": {
      const delta = Number(target.dataset["delta"]);
      editOutfit((o) => ({ ...o, round: Math.max(1, o.round + delta) }));
      break;
    }
    case "solo-roll": {
      const table = target.dataset["table"] ?? "behaviour";
      const roll = rollTable(table);
      store.setState((s) => ({ ...s, ui: { ...s.ui, lastRoll: roll } }));
      break;
    }
    case "log-game": {
      const raw = prompt("Credits earned this game (in thousands, ¢k):", "0");
      if (raw === null) return;
      const earnedK = Math.max(0, Math.round(Number(raw) || 0));
      editOutfit((o) => ({
        ...o,
        debtK: Math.max(0, o.debtK - earnedK),
        gamesPlayed: o.gamesPlayed + 1,
        gameLog: [...o.gameLog, { game: o.gamesPlayed + 1, earnedK }],
        alertLevel: 1,
        round: 1,
      }));
      break;
    }
    case "remove-perk": {
      const index = Number(target.dataset["index"]);
      editOutfit((o) => ({ ...o, perks: o.perks.filter((_, i) => i !== index) }));
      break;
    }

    // ---- Ship compendium --------------------------------------------------
    case "ship-filter-clear": {
      store.setState((s) => ({ ...s, ui: { ...s.ui, shipFilter: { ...EMPTY_SHIP_FILTER } } }));
      break;
    }
    case "ship-sort": {
      const sort = target.dataset["sort"];
      if (!sort) return;
      store.setState((s) => {
        const current = s.ui.shipFilter ?? { ...EMPTY_SHIP_FILTER };
        return { ...s, ui: { ...s.ui, shipFilter: { ...current, sort } } };
      });
      break;
    }
    case "toggle-create": {
      store.setState((s) => ({ ...s, ui: { ...s.ui, showCreate: !(s.ui.showCreate ?? s.lists.length === 0) } }));
      break;
    }

    // ---- New Fleet modal (era, size, faction) -----------------------------
    case "open-new-fleet": {
      store.setState((s) => ({
        ...s,
        ui: { ...s.ui, modal: { kind: "new-fleet", era: "Armageddon", limit: 300, showAll: false } },
      }));
      break;
    }
    case "nf-era": {
      const era = target.dataset["era"] as "Hypergrowth" | "Age of Unity" | "Armageddon";
      store.setState((s) =>
        s.ui.modal?.kind === "new-fleet"
          ? { ...s, ui: { ...s.ui, modal: { ...s.ui.modal, era, factionId: undefined } } }
          : s,
      );
      break;
    }
    case "nf-size": {
      const limit = Number(target.dataset["limit"]);
      store.setState((s) =>
        s.ui.modal?.kind === "new-fleet" ? { ...s, ui: { ...s.ui, modal: { ...s.ui.modal, limit } } } : s,
      );
      break;
    }
    case "nf-faction": {
      const factionId = target.dataset["faction"];
      store.setState((s) =>
        s.ui.modal?.kind === "new-fleet" ? { ...s, ui: { ...s.ui, modal: { ...s.ui.modal, factionId } } } : s,
      );
      break;
    }
    case "nf-toggle-all": {
      store.setState((s) =>
        s.ui.modal?.kind === "new-fleet"
          ? { ...s, ui: { ...s.ui, modal: { ...s.ui.modal, showAll: !s.ui.modal.showAll } } }
          : s,
      );
      break;
    }
    case "nf-create": {
      const m = state.ui.modal;
      if (m?.kind !== "new-fleet" || !m.factionId) return;
      const mode: GameMode =
        m.era === "Armageddon" ? "armageddon" : m.era === "Age of Unity" ? "age-of-unity" : "hypergrowth";
      const list = createList(mode, m.factionId, false);
      list.fleet.creditsLimit = m.limit;
      // A new fleet inherits its faction's emblem, if that faction has one set
      // (custom factions can carry an uploaded image or a library icon).
      const chosen = findFaction(m.factionId, state.customFactions);
      if (chosen?.emblemImage) list.emblemImage = chosen.emblemImage;
      else if (chosen?.emblemLib) list.emblemLib = chosen.emblemLib;
      // Hypergrowth fleets start with a random mark from across the whole
      // library rather than the faction's own, so each new shipyard reads
      // distinctly at a glance.
      if (mode === "hypergrowth") {
        const mark = randomIconId();
        if (mark) {
          list.emblemLib = mark;
          list.emblemImage = undefined;
        }
      }
      store.setState((s) => {
        const lists = [...s.lists, list];
        persistLists(lists);
        return { ...s, lists, ui: { ...s.ui, modal: undefined } };
      });
      location.hash = routeHash({ view: "builder", listId: list.id });
      break;
    }

    case "dismiss-tutorials": {
      store.setState((s) => {
        const onboarding = { ...s.onboarding, tutorialsDismissed: true };
        persistOnboarding(onboarding);
        return { ...s, onboarding };
      });
      break;
    }

    // ---- Basic Training ---------------------------------------------------
    case "new-training": {
      const mode = target.dataset["mode"] as "combat-simulator" | "management-training";
      const list = createTrainingList(mode);
      store.setState((s) => {
        const lists = [...s.lists, list];
        persistLists(lists);
        // Taking a tutorial retires the suggestion.
        const onboarding = { ...s.onboarding, tutorialsDismissed: true };
        persistOnboarding(onboarding);
        return { ...s, lists, onboarding, ui: { ...s.ui, modal: undefined } };
      });
      location.hash = routeHash({ view: "builder", listId: list.id });
      break;
    }

    // ---- Play mode ----------------------------------------------------------
    case "play-phase":
    case "play-next":
    case "play-round":
    case "play-cmd":
    case "play-vp":
    case "play-oppvp":
    case "play-reset": {
      const id = currentListId();
      if (!id) return;
      const delta = Number(target.dataset["delta"] ?? 0);
      const phaseTo = Number(target.dataset["phase"] ?? -1);
      store.setState((s) =>
        updateList(s, id, (l) => {
          const faction = findFaction(l.fleet.factionId, s.customFactions);
          const p = l.play ?? freshPlayState(faction);
          const maxRound = l.mode === "management-training" ? 3 : 4;
          switch (action) {
            // Each phase is its own checklist walkthrough, not a running log,
            // so moving to a (possibly different) phase clears the ticks.
            case "play-phase":
              return { ...l, play: { ...p, phase: Math.max(0, Math.min(3, phaseTo)), checks: [] } };
            case "play-next": {
              // Advancing past the End Phase rolls into the next round and
              // refreshes the CMD counter from the faction value.
              if (p.phase >= 3) {
                const cmd = faction ? Number(faction.cmdTokens) || p.cmd : p.cmd;
                return { ...l, play: { ...p, phase: 0, round: Math.min(maxRound, p.round + 1), cmd, checks: [] } };
              }
              return { ...l, play: { ...p, phase: p.phase + 1, checks: [] } };
            }
            case "play-round":
              return { ...l, play: { ...p, round: Math.max(1, Math.min(maxRound, p.round + delta)) } };
            case "play-cmd":
              return { ...l, play: { ...p, cmd: Math.max(0, p.cmd + delta) } };
            case "play-vp":
              return { ...l, play: { ...p, vp: Math.max(0, p.vp + delta) } };
            case "play-oppvp":
              return { ...l, play: { ...p, oppVp: Math.max(0, p.oppVp + delta) } };
            case "play-reset":
              return confirm("Reset the round, phase, CMD, and scores for this game?")
                ? { ...l, play: freshPlayState(faction) }
                : l;
            default:
              return l;
          }
        }),
      );
      break;
    }
    case "play-check-step": {
      const id = currentListId();
      const index = Number(target.dataset["index"]);
      if (!id || !Number.isInteger(index)) return;
      store.setState((s) =>
        updateList(s, id, (l) => {
          const faction = findFaction(l.fleet.factionId, s.customFactions);
          const p = l.play ?? freshPlayState(faction);
          const checks = [...(p.checks ?? [])];
          checks[index] = !checks[index];
          return { ...l, play: { ...p, checks } };
        }),
      );
      break;
    }
    case "play-initiative": {
      const spec = target.dataset["dice"] ?? "3D6";
      const m = /(\d+)\s*D6/i.exec(spec);
      const n = m ? Math.max(1, Number(m[1])) : 3;
      const rolls: number[] = [];
      let successes = 0;
      for (let i = 0; i < n; i++) {
        const v = d(6);
        rolls.push(v);
        if (v === 1) successes += 2;
        else if (v === 2 || v === 3) successes += 1;
      }
      store.setState((s) => ({
        ...s,
        ui: {
          ...s.ui,
          lastRoll: {
            table: `Initiative check (${n}D6)`,
            value: successes,
            result: `${successes} ${successes === 1 ? "success" : "successes"}`,
            detail: `Rolled ${rolls.join(", ")}. A 2 or 3 is one success; a 1 is two successes.`,
          },
        },
      }));
      // Ties the roll to its checklist step (index 1: "Roll your Initiative
      // Check"), but only while actually in the Command Phase - this button
      // is always on screen, this checklist item only means something there.
      const id = currentListId();
      if (id) {
        store.setState((s) =>
          updateList(s, id, (l) => {
            if (!l.play || l.play.phase !== 0) return l;
            const checks = [...(l.play.checks ?? [])];
            checks[1] = true;
            return { ...l, play: { ...l.play, checks } };
          }),
        );
      }
      break;
    }

    // ---- Foundry ----------------------------------------------------------
    case "new-faction": {
      const faction: Faction = {
        id: newId("cf"),
        name: "New Faction",
        era: "Armageddon",
        initiative: "3D6",
        cmdTokens: "5",
        rule: { name: "Faction rule", text: "" },
        ships: [],
        hvp: [],
      };
      store.setState((s) => {
        const customFactions = [...s.customFactions, faction];
        persistCustomFactions(customFactions);
        return { ...s, customFactions };
      });
      location.hash = routeHash({ view: "foundry", factionId: faction.id });
      break;
    }
    case "clone-faction": {
      // Starting from an existing faction (official or custom) is offered
      // alongside a blank slate in the same picker, so cloning-then-renaming
      // is the path of least resistance rather than something explained.
      const sourceId = target.dataset["source"];
      const source = sourceId ? findFaction(sourceId, state.customFactions) : undefined;
      if (!source) return;
      const faction: Faction = { ...structuredClone(source), id: newId("cf"), name: `${source.name} (Copy)` };
      store.setState((s) => {
        const customFactions = [...s.customFactions, faction];
        persistCustomFactions(customFactions);
        return { ...s, customFactions };
      });
      location.hash = routeHash({ view: "foundry", factionId: faction.id });
      break;
    }
    case "delete-faction": {
      const id = target.dataset["id"];
      const doomed = state.customFactions.find((f) => f.id === id);
      if (!doomed) return;
      if (!confirm(`Delete the faction "${doomed.name}"? Lists that use it will stop resolving.`)) return;
      store.setState((s) => {
        const customFactions = s.customFactions.filter((f) => f.id !== id);
        persistCustomFactions(customFactions);
        return { ...s, customFactions };
      });
      break;
    }
    case "export-faction": {
      const id = target.dataset["id"];
      const faction = state.customFactions.find((f) => f.id === id);
      if (!faction) return;
      downloadJson(`${faction.name.toLowerCase().replace(/\s+/g, "-")}.faction.json`, faction);
      break;
    }
    case "copy-faction": {
      const id = target.dataset["id"];
      const faction = state.customFactions.find((f) => f.id === id);
      if (!faction) return;
      navigator.clipboard
        .writeText(JSON.stringify(faction, null, 2))
        .then(() => showToast(`Copied "${faction.name}" to the clipboard. Paste it to share.`))
        .catch(() => showToast("Could not copy. Try the download button instead."));
      break;
    }
    case "cf-ship-add": {
      const fid = currentFoundryId();
      if (!fid) return;
      editFaction(fid, (f) => ({
        ...f,
        ships: [
          ...f.ships,
          {
            id: newId("sh"),
            name: "New ship class",
            mass: 0 as Mass,
            thrust: 6,
            silhouette: 3,
            shields: 0,
            primary: [],
            auxiliary: [],
            utilityBays: false,
            cost: 5,
          },
        ],
      }));
      break;
    }
    case "cf-ship-remove": {
      const fid = currentFoundryId();
      const si = Number(target.dataset["ship"]);
      if (!fid || !Number.isInteger(si)) return;
      editFaction(fid, (f) => ({ ...f, ships: f.ships.filter((_, i) => i !== si) }));
      break;
    }
    case "cf-ship-image-clear": {
      const fid = currentFoundryId();
      const si = Number(target.dataset["ship"]);
      if (!fid || !Number.isInteger(si)) return;
      editFaction(fid, (f) => ({
        ...f,
        ships: f.ships.map((s, i) => (i === si ? { ...s, image: undefined } : s)),
      }));
      break;
    }
    case "cf-weapon-add": {
      const fid = currentFoundryId();
      const si = Number(target.dataset["ship"]);
      const slot = target.dataset["slot"] as "primary" | "auxiliary";
      if (!fid || !Number.isInteger(si)) return;
      const weapon: Weapon = { name: "New weapon", count: 1, die: "D6", rangeMin: 0, rangeMax: 6 };
      editFaction(fid, (f) => ({
        ...f,
        ships: f.ships.map((s, i) => (i === si ? { ...s, [slot]: [...s[slot], weapon] } : s)),
      }));
      break;
    }
    case "cf-weapon-remove": {
      const fid = currentFoundryId();
      const si = Number(target.dataset["ship"]);
      const wi = Number(target.dataset["index"]);
      const slot = target.dataset["slot"] as "primary" | "auxiliary";
      if (!fid || !Number.isInteger(si) || !Number.isInteger(wi)) return;
      editFaction(fid, (f) => ({
        ...f,
        ships: f.ships.map((s, i) => (i === si ? { ...s, [slot]: s[slot].filter((_, j) => j !== wi) } : s)),
      }));
      break;
    }
    case "cf-hvp-add": {
      const fid = currentFoundryId();
      if (!fid) return;
      editFaction(fid, (f) => ({ ...f, hvp: [...f.hvp, { id: newId("hv"), name: "New person", rule: "" }] }));
      break;
    }
    case "cf-hvp-remove": {
      const fid = currentFoundryId();
      const hi = Number(target.dataset["index"]);
      if (!fid || !Number.isInteger(hi)) return;
      editFaction(fid, (f) => ({ ...f, hvp: f.hvp.filter((_, i) => i !== hi) }));
      break;
    }
  }
}

// ---------------------------------------------------------------------------
// Change handling (text fields commit on change, so typing never re-renders)
// ---------------------------------------------------------------------------

function handleChange(e: Event): void {
  const target = e.target as HTMLInputElement;
  const action = target.dataset["action"];
  if (!action) return;
  const listId = currentListId();
  const inputValue = target.value ?? "";

  switch (action) {
    case "fleet-name": {
      if (!listId) return;
      store.setState((s) => updateFleet(s, listId, (f) => ({ ...f, name: inputValue })));
      break;
    }
    case "fleet-notes": {
      if (!listId) return;
      store.setState((s) => updateFleet(s, listId, (f) => ({ ...f, notes: inputValue })));
      break;
    }
    case "set-limit-free": {
      if (!listId) return;
      const n = Math.max(1, Math.round(Number(inputValue) || 1));
      store.setState((s) => updateFleet(s, listId, (f) => ({ ...f, creditsLimit: n })));
      break;
    }
    case "nf-size-custom": {
      const n = Math.max(1, Math.round(Number(inputValue) || 0));
      if (!n) return;
      store.setState((s) =>
        s.ui.modal?.kind === "new-fleet" ? { ...s, ui: { ...s.ui, modal: { ...s.ui.modal, limit: n } } } : s,
      );
      break;
    }
    case "unit-name": {
      if (!listId) return;
      const unitId = target.dataset["unit"];
      store.setState((s) =>
        updateFleet(s, listId, (f) => ({
          ...f,
          units: f.units.map((u) => (u.id === unitId ? { ...u, name: inputValue } : u)),
        })),
      );
      break;
    }
    case "ship-name": {
      if (!listId) return;
      const unitId = target.dataset["unit"];
      const index = Number(target.dataset["index"]);
      store.setState((s) =>
        updateFleet(s, listId, (f) => ({
          ...f,
          units: f.units.map((u) => {
            if (u.id !== unitId) return u;
            const shipNames = [...(u.shipNames ?? [])];
            while (shipNames.length < u.count) shipNames.push("");
            shipNames[index] = inputValue;
            return { ...u, shipNames };
          }),
        })),
      );
      break;
    }
    case "unit-species": {
      if (!listId) return;
      const unitId = target.dataset["unit"];
      const species = inputValue as "Rannari" | "Yynnx" | "Gorgronti" | "";
      store.setState((s) =>
        updateFleet(s, listId, (f) => ({
          ...f,
          units: f.units.map((u) =>
            u.id === unitId ? { ...u, species: species === "" ? undefined : species } : u,
          ),
        })),
      );
      break;
    }
    case "hvp-name": {
      if (!listId) return;
      const index = Number(target.dataset["index"]);
      store.setState((s) =>
        updateFleet(s, listId, (f) => ({
          ...f,
          hvp: f.hvp.map((h, i) => (i === index ? { ...h, customName: inputValue || undefined } : h)),
        })),
      );
      break;
    }
    case "hvp-assign": {
      if (!listId) return;
      const index = Number(target.dataset["index"]);
      store.setState((s) =>
        updateFleet(s, listId, (f) => ({
          ...f,
          hvp: f.hvp.map((h, i) => (i === index ? { ...h, assignedUnitId: inputValue || undefined } : h)),
        })),
      );
      break;
    }

    // ---- Solo / Junkspace -------------------------------------------------
    case "outfit-name": {
      editOutfit((o) => ({ ...o, name: inputValue }));
      break;
    }
    case "outfit-ship-name": {
      const shipId = target.dataset["ship"];
      editOutfit((o) => ({
        ...o,
        ships: o.ships.map((s) => (s.id === shipId ? { ...s, shipName: inputValue } : s)),
      }));
      break;
    }
    case "outfit-pilot-name": {
      const shipId = target.dataset["ship"];
      editOutfit((o) => ({
        ...o,
        ships: o.ships.map((s) => (s.id === shipId ? { ...s, pilotName: inputValue } : s)),
      }));
      break;
    }
    case "outfit-pilot-class": {
      const shipId = target.dataset["ship"];
      editOutfit((o) => ({
        ...o,
        ships: o.ships.map((s) => (s.id === shipId ? { ...s, pilotClass: inputValue as PilotClass } : s)),
      }));
      break;
    }
    case "assign-perk": {
      const shipId = target.dataset["ship"];
      if (!shipId || !inputValue) return;
      editOutfit((o) =>
        o.perks.some((p) => p.shipId === shipId && p.perk === inputValue)
          ? o
          : { ...o, perks: [...o.perks, { shipId, perk: inputValue }] },
      );
      target.value = "";
      break;
    }
    case "outfit-emblem-upload": {
      const file = target.files?.[0];
      if (!file) return;
      readEmblemImage(file)
        .then((dataUrl) => editOutfit((o) => ({ ...o, emblemImage: dataUrl })))
        .catch(() => showToast("That image could not be used. Try a PNG or JPEG."));
      target.value = "";
      break;
    }

    // ---- Ship compendium --------------------------------------------------
    case "ship-filter":
    case "ship-search": {
      const field = (action === "ship-search" ? "q" : target.dataset["field"]) as keyof ShipFilter;
      store.setState((s) => {
        const current = s.ui.shipFilter ?? { ...EMPTY_SHIP_FILTER };
        return { ...s, ui: { ...s.ui, shipFilter: { ...current, [field]: inputValue } } };
      });
      break;
    }

    // ---- Foundry ----------------------------------------------------------
    case "cf-field": {
      const fid = currentFoundryId();
      const field = target.dataset["field"];
      if (!fid || !field) return;
      editFaction(fid, (f) => {
        switch (field) {
          case "name":
            return { ...f, name: inputValue };
          case "era":
            return { ...f, era: inputValue as Faction["era"] };
          case "initiative":
            return { ...f, initiative: inputValue };
          case "cmdTokens":
            return { ...f, cmdTokens: inputValue };
          case "ruleName":
            return { ...f, rule: { ...f.rule, name: inputValue } };
          case "ruleText":
            return { ...f, rule: { ...f.rule, text: inputValue } };
          default:
            return f;
        }
      });
      break;
    }
    case "cf-ship": {
      const fid = currentFoundryId();
      const si = Number(target.dataset["ship"]);
      const field = target.dataset["field"];
      if (!fid || !Number.isInteger(si) || !field) return;
      const checked = target.checked;
      editFaction(fid, (f) => ({
        ...f,
        ships: f.ships.map((s, i) => {
          if (i !== si) return s;
          switch (field) {
            case "name":
              return { ...s, name: inputValue };
            case "mass":
              return { ...s, mass: Number(inputValue) as Mass };
            case "thrust":
              return { ...s, thrust: Number(inputValue) || 0 };
            case "silhouette":
              return { ...s, silhouette: Number(inputValue) || 1 };
            case "shields":
              return { ...s, shields: Number(inputValue) || 0 };
            case "cost":
              return { ...s, cost: Math.max(1, Number(inputValue) || 1) };
            case "primaryUtility":
              return {
                ...s,
                primaryUtility: checked,
                primary: checked ? [] : s.primary,
                utilityBays: checked || s.auxiliaryUtility === true,
              };
            case "auxiliaryUtility":
              return {
                ...s,
                auxiliaryUtility: checked,
                auxiliary: checked ? [] : s.auxiliary,
                utilityBays: checked || s.primaryUtility === true,
              };
            default:
              return s;
          }
        }),
      }));
      break;
    }
    case "cf-weapon": {
      const fid = currentFoundryId();
      const si = Number(target.dataset["ship"]);
      const wi = Number(target.dataset["index"]);
      const slot = target.dataset["slot"] as "primary" | "auxiliary";
      const field = target.dataset["field"];
      if (!fid || !Number.isInteger(si) || !Number.isInteger(wi) || !field) return;
      editFaction(fid, (f) => ({
        ...f,
        ships: f.ships.map((s, i) => {
          if (i !== si) return s;
          const weapons = s[slot].map((w, j) => {
            if (j !== wi) return w;
            switch (field) {
              case "name":
                return { ...w, name: inputValue };
              case "count":
                return { ...w, count: Math.max(1, Number(inputValue) || 1) };
              case "die":
                return { ...w, die: inputValue as Weapon["die"] };
              case "rangeMin":
                return { ...w, rangeMin: Math.max(0, Number(inputValue) || 0) };
              case "rangeMax":
                return { ...w, rangeMax: Math.max(0, Number(inputValue) || 0) };
              default:
                return w;
            }
          });
          return { ...s, [slot]: weapons };
        }),
      }));
      break;
    }
    case "cf-hvp": {
      const fid = currentFoundryId();
      const hi = Number(target.dataset["index"]);
      const field = target.dataset["field"];
      if (!fid || !Number.isInteger(hi) || !field) return;
      editFaction(fid, (f) => ({
        ...f,
        hvp: f.hvp.map((h, i) =>
          i === hi ? (field === "name" ? { ...h, name: inputValue } : { ...h, rule: inputValue }) : h,
        ),
      }));
      break;
    }
    case "emblem-upload": {
      const id = currentListId();
      const file = target.files?.[0];
      if (!id || !file) return;
      readEmblemImage(file)
        .then((dataUrl) => {
          store.setState((s) => updateList(s, id, (l) => ({ ...l, emblemImage: dataUrl })));
        })
        .catch(() => showToast("That image could not be used. Try a PNG or JPEG."));
      target.value = "";
      break;
    }
    case "cf-emblem-upload": {
      const fid = currentFoundryId();
      const file = target.files?.[0];
      if (!fid || !file) return;
      readEmblemImage(file)
        .then((dataUrl) => editFaction(fid, (f) => ({ ...f, emblemImage: dataUrl })))
        .catch(() => showToast("That image could not be used. Try a PNG or JPEG."));
      target.value = "";
      break;
    }
    case "cf-ship-image-upload": {
      const fid = currentFoundryId();
      const si = Number(target.dataset["ship"]);
      const file = target.files?.[0];
      if (!fid || !file || !Number.isInteger(si)) return;
      readShipImage(file)
        .then((dataUrl) =>
          editFaction(fid, (f) => ({
            ...f,
            ships: f.ships.map((s, i) => (i === si ? { ...s, image: dataUrl } : s)),
          })),
        )
        .catch(() => showToast("That image could not be used. Try a PNG or JPEG."));
      target.value = "";
      break;
    }
    case "import-faction": {
      const file = target.files?.[0];
      if (!file) return;
      file.text().then((text) => importFactionJson(text, "That file does not look like a faction."));
      target.value = "";
      break;
    }
    case "paste-faction": {
      navigator.clipboard
        .readText()
        .then((text) => {
          if (!text.trim()) {
            showToast("The clipboard is empty. Copy a faction's JSON first.");
            return;
          }
          importFactionJson(text, "The clipboard does not hold a faction.");
        })
        .catch(() => showToast("Could not read the clipboard. Use Import from a file instead."));
      break;
    }
  }
}

export function wireActions(root: HTMLElement): void {
  root.addEventListener("click", handleClick);
  root.addEventListener("change", handleChange);
  // Live-filter the compendium search as the user types. Only this field is
  // routed on input; it carries an id, so focus and caret survive re-render.
  root.addEventListener("input", (e) => {
    const t = e.target as HTMLElement | null;
    if (t?.dataset?.["action"] === "ship-search") handleChange(e);
  });
}
