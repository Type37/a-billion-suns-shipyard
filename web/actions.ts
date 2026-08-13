import type { Faction, Fleet, FleetHvp, GameMode, Mass, PilotClass, Weapon } from "../src/types.ts";
import { maxUnitSize } from "../src/validation.ts";
import { MODE_BUILDER_SHAPE } from "../src/types.ts";
import { JUNKSPACE_SHIPS, OUTFIT_MAX_SHIPS, recastAsOutfit, startingAlertLevel } from "../src/data/junkspace.ts";
import { w } from "../src/data/_helpers.ts";
import { randomFleetName } from "../src/fleet-names.ts";
import { capitalShipName } from "../src/ship-names.ts";
import { announce } from "./announce.ts";
import { findFaction, isCustom } from "./catalog.ts";
import { ERA_MODES, resolveShip } from "./render.ts";
import {
  clearAllData,
  exportAllData,
  importAllData,
  loadLists,
  newId,
  persistCustomFactions,
  persistLists,
  persistOnboarding,
  persistSettings,
  persistPrintOpts,
  persistOutfits,
  setStorageFullHook,
} from "./storage.ts";
import type { SavedOutfit } from "./storage.ts";
import { FleetSync } from "./fleet-sync.ts";
import {
  createList,
  createOutfit,
  activeOutfit,
  createTrainingList,
  DEFAULT_PRINT,
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
import type { AppState, PrintOpts, ShipFilter } from "./state.ts";
import { JUNKSPACE_JOBS, BLIP_COUNT } from "../src/data/junkspace-solo.ts";
import { EXAMPLE_FACTIONS, EXAMPLE_FACTION_IDS } from "./example-factions.ts";
import { renderMarkdown } from "./richtext.ts";
import { LIB_PAGE, libraryIcon, randomIconId } from "./emblems.ts";
import { EMBLEM_IDS } from "./icons.ts";
import { randomCorpName } from "../src/corp-names.ts";
import { creditsText } from "./format.ts";
import { writeOnInput } from "./write-on.ts";
import { shareUrl } from "./share.ts";
import { visibleAnchor } from "./tours.ts";
import { activeCropper } from "./cropper.ts";
import { putImage } from "./image-store.ts";
import { fleetToMarkdown } from "./export-text.ts";

// --- Solo dice roller -------------------------------------------------------

/**
 * The fields to write when a library mark is chosen. emblemColor is always
 * cleared: tinting is gone, and leaving a stale colour in storage would keep it
 * in exported and shared fleets long after nothing reads it.
 */
/**
 * Fisher-Yates, and it has to be a real shuffle rather than sort(() => rnd).
 *
 * The eight Blip markers are the only hidden information a solo game has
 * (p.197): they are shuffled facedown and the numbers stay unknown until one is
 * flipped. A comparator-based shuffle is biased, which for a bag of eight means
 * some arrangements are quietly more likely than others, and the player has no
 * way to notice.
 */
function shuffle<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const a = out[i]!, b = out[j]!;
    out[i] = b;
    out[j] = a;
  }
  return out;
}

function libFields(lib: string): { emblemLib: string; emblemImage: undefined; emblemColor: undefined } {
  return { emblemLib: lib, emblemImage: undefined, emblemColor: undefined };
}

/**
 * A newly chosen HVP, carrying back whatever you last called them.
 *
 * Unchoosing somebody drops their selection, and their name went with it, so
 * an accidental tap on the tick erased "Chief Engineer Sadie Hyatt" with no way
 * back. The fleet remembers names by role (Fleet.hvpNames) precisely so that
 * choosing them again returns the person you had, not a blank job title.
 */
function chosenHvp(fleet: Fleet, hvpId: string): FleetHvp {
  const remembered = fleet.hvpNames?.[hvpId];
  return remembered ? { hvpId, customName: remembered } : { hvpId };
}

function d(sides: number): number {
  return Math.floor(Math.random() * sides) + 1;
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

/** Edit the outfit being started in the dialog (ui.newOutfit). */
type NewOutfitDraft = NonNullable<AppState["ui"]["newOutfit"]>;
function editNewOutfit(fn: (d: NewOutfitDraft) => NewOutfitDraft): void {
  store.setState((s) =>
    s.ui.newOutfit ? { ...s, ui: { ...s.ui, newOutfit: fn(s.ui.newOutfit) } } : s,
  );
}

/**
 * What is typed in the new-outfit dialog right now.
 *
 * The name field is uncontrolled while the dialog is open - it is not written
 * to state on every keystroke, because that would re-render the input and move
 * the caret. So anything that DOES re-render the dialog (picking a source
 * outfit, picking an emblem) has to carry the typed name across by hand, and
 * Start has to read it from the DOM rather than from state.
 */
function liveOutfitName(): string {
  return (document.querySelector<HTMLInputElement>(".new-outfit-name")?.value ?? "").trim();
}

// All interaction goes through delegated listeners on #app. Elements declare
// intent with data-action attributes; this module mutates state and persists.

let toastTimer: ReturnType<typeof setTimeout> | undefined;

function showToast(message: string, opts: { icon?: string; loud?: boolean } = {}): void {
  if (toastTimer) clearTimeout(toastTimer);
  // The toast is rendered inside #app, which is replaced wholesale on every
  // state change, so it cannot announce itself. Speak it separately.
  announce(message);
  store.setState((s) => ({
    ...s,
    ui: { ...s.ui, toast: message, toastIcon: opts.icon, toastLoud: opts.loud },
  }));
  // A loud toast is a confirmation you are meant to read, so it holds longer.
  toastTimer = setTimeout(
    () => {
      store.setState((s) => ({ ...s, ui: { ...s.ui, toast: undefined, toastIcon: undefined, toastLoud: undefined } }));
    },
    opts.loud ? 3000 : 2200,
  );
}

/**
 * Busy/error text for the Fleet Sync dialog. Deliberately NOT store state: a
 * fetch takes real time, and the join flow's token field is a live input the
 * user may still be typing into - routing "loading…" through setState would
 * re-render the whole dialog mid-keystroke and drop focus/selection, the same
 * reason richtext.ts's Markdown preview updates the DOM directly instead of
 * going through the store. These two spans are the one place this app writes
 * outside the render cycle for something other than a live preview.
 */
function syncBusy(on: boolean, label?: string): void {
  const el = document.getElementById("sync-busy");
  if (el) {
    el.textContent = on ? label || "Working…" : "";
    el.hidden = !on;
  }
  // Only one modal is ever open at once, so while this dialog is up ".opt-modal"
  // unambiguously means the Sync dialog (Options uses the same class, but the
  // two can never be on screen together).
  document
    .querySelectorAll<HTMLButtonElement | HTMLInputElement>(".opt-modal button, .opt-modal input")
    .forEach((b) => (b.disabled = on));
}
function syncError(msg?: string): void {
  const el = document.getElementById("sync-error");
  if (el) {
    el.textContent = msg || "";
    el.hidden = !msg;
  }
}

/**
 * The floor for a score counter. Hypergrowth is played in credits and you spend
 * them before you earn them, so it has no floor; every other mode scores victory
 * points, which cannot be negative.
 */
function floorScore(mode: GameMode, value: number): number {
  return mode === "hypergrowth" ? value : Math.max(0, value);
}

function currentListId(): string | null {
  const r = store.getState().route;
  return r.view === "builder" || r.view === "print" || r.view === "play" ? r.listId : null;
}

/**
 * Put the three worked examples in, or take them back out.
 *
 * On: adds only the ones that are missing, so someone who deleted one of the
 * three and switched this back on gets that one back rather than a second copy
 * of the other two. Off: removes them by id, which also takes any edits made to
 * them - they are a sample, and the switch says so.
 *
 * structuredClone matters. EXAMPLE_FACTIONS are module constants and the
 * Foundry editor mutates what it is handed; without the copy, editing a loaded
 * example would reach back and edit the template itself.
 */
function setExampleFactions(on: boolean): void {
  const ids = new Set<string>(EXAMPLE_FACTION_IDS);
  store.setState((s) => {
    const kept = s.customFactions.filter((f) => !ids.has(f.id));
    const missing = on ? EXAMPLE_FACTIONS.filter((f) => !s.customFactions.some((x) => x.id === f.id)) : [];
    const customFactions = on ? [...s.customFactions, ...missing.map((f) => structuredClone(f))] : kept;
    persistCustomFactions(customFactions);
    const settings = { ...s.settings, exampleFactions: on };
    persistSettings(settings);
    return { ...s, customFactions, settings };
  });
}

function editFaction(factionId: string, fn: (f: Faction) => Faction): void {
  store.setState((s) => {
    const customFactions = s.customFactions.map((f) => (f.id === factionId ? fn(f) : f));
    persistCustomFactions(customFactions);
    return { ...s, customFactions };
  });
}

/** Update print setup and remember it, so reprinting after an edit is one click. */
function patchPrint(patch: Partial<PrintOpts>): void {
  store.setState((s) => {
    const next: PrintOpts = { ...DEFAULT_PRINT, ...s.ui.print, ...patch };
    persistPrintOpts(next);
    return { ...s, ui: { ...s.ui, print: next } };
  });
}

function currentFoundryId(): string | null {
  const r = store.getState().route;
  return r.view === "foundry" && r.factionId ? r.factionId : null;
}

/** Apply an emblem patch (colour/background) to whichever entity the emblem
 *  modal currently targets: the active list, custom faction, or outfit. */
function patchEmblemTarget(
  state: AppState,
  patch: { emblemColor?: "ink" | "blue" | "red" },
): void {
  const m = state.ui.modal;
  if (m?.kind !== "emblem") return;
  if (m.target === "list") {
    const id = currentListId();
    if (id) store.setState((s) => updateList(s, id, (l) => ({ ...l, ...patch })));
  } else if (m.target === "faction") {
    const fid = currentFoundryId();
    if (fid) editFaction(fid, (f) => ({ ...f, ...patch }));
  } else if (m.target === "new-outfit") {
    editNewOutfit((d) => ({ ...d, ...patch }));
  } else {
    editOutfit((o) => ({ ...o, ...patch }));
  }
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

/*
 * IMAGES
 *
 * One pipeline, three ways in and one way out. A File arrives (from the file
 * dialog, a drag from the desktop, or a paste), is decoded at full size, and is
 * handed to the cropper. Whatever region you choose there is redrawn onto a
 * canvas at a fixed output size and comes back as a data URL small enough to
 * live in localStorage beside the fleet that uses it.
 *
 * The crop step is not decoration. This used to centre-crop whatever it was
 * given, which is right about half the time and silently wrong the rest - a
 * logo whose mark sits off to one side, a photo of a hull that is mostly sky.
 * The automatic fit is still what the cropper OPENS on, so accepting the
 * default is one press and nothing got slower for the centred case.
 *
 * The two frames are deliberate. An emblem is a badge drawn in a circle at
 * 40-60px almost everywhere, so it is square. Ship art is a picture of a hull
 * drawn in a landscape frame, so it is 5:3.
 */

/** Output frame per destination: what the cropper crops to. */
const IMAGE_FRAME: Record<string, { outW: number; outH: number; round: boolean }> = {
  "emblem-upload": { outW: 480, outH: 480, round: true },
  "cf-emblem-upload": { outW: 480, outH: 480, round: true },
  "outfit-emblem-upload": { outW: 480, outH: 480, round: true },
  "no-emblem-upload": { outW: 480, outH: 480, round: true },
  "cf-ship-image-upload": { outW: 320, outH: 192, round: false },
};

/** What a rejected upload was: used to say something more useful than "nope". */
type ImageFault = "type" | "read" | "decode" | "canvas";

function imageFailure(fault: ImageFault): string {
  switch (fault) {
    case "type":
      return "That file is not an image. Try a PNG, JPEG, WebP or GIF.";
    case "decode":
      return "That image could not be opened - it may be damaged, or in a format this browser cannot read.";
    default:
      return "That image could not be read. Try saving it again, or use a different file.";
  }
}

/** The file at full size, as a data URL. Rejects non-images. */
function readImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("type"));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("read"));
    reader.onload = () => {
      // Decoded once here rather than trusted: a .png that is not a PNG should
      // fail at the door, not inside the cropper with a broken-image icon.
      const img = new Image();
      img.onerror = () => reject(new Error("decode"));
      img.onload = () => resolve(reader.result as string);
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Open the cropper on a chosen file.
 *
 * Everything that accepts an image comes through here: the file dialog, a drop,
 * a paste. The destination is carried as the action name the file input already
 * had, so nothing downstream needs to know which of the three brought it.
 */
function startImageCrop(action: string, data: DOMStringMap, file: File): void {
  const frame = IMAGE_FRAME[action];
  if (!frame) return;
  readImageFile(file)
    .then((src) => {
      store.setState((s) => ({
        ...s,
        ui: {
          ...s.ui,
          crop: { src, action, ...(data["ship"] ? { ship: data["ship"] } : {}), ...frame },
        },
      }));
    })
    .catch((err: unknown) => {
      const code = err instanceof Error ? err.message : "read";
      showToast(imageFailure(code as ImageFault), { icon: "close" });
    });
}

/**
 * Place a cropped image where it was headed.
 *
 * Five destinations - the four emblem targets (a fleet, a custom faction, a
 * saved outfit, the outfit being started in the dialog) and per-ship art in the
 * Foundry - reached by the same action name the upload carried all the way
 * through. Wiring three input events to five destinations separately would be
 * fifteen copies of "put it there", which is what the change handler alone used
 * to hold five of.
 */
function applyImageUpload(action: string, data: DOMStringMap, ref: string): void {
  const done = (): void => showToast("Image added.", { icon: "check" });
  switch (action) {
    case "emblem-upload": {
      const id = currentListId();
      if (!id) return;
      store.setState((s) => updateList(s, id, (l) => ({ ...l, emblemImage: ref })));
      done();
      break;
    }
    case "cf-emblem-upload": {
      const fid = currentFoundryId();
      if (!fid) return;
      editFaction(fid, (f) => ({ ...f, emblemImage: ref }));
      done();
      break;
    }
    case "outfit-emblem-upload": {
      editOutfit((o) => ({ ...o, emblemImage: ref }));
      done();
      break;
    }
    case "no-emblem-upload": {
      editNewOutfit((d) => ({ ...d, emblemImage: ref }));
      done();
      break;
    }
    case "cf-ship-image-upload": {
      const fid = currentFoundryId();
      const si = Number(data["ship"]);
      if (!fid || !Number.isInteger(si)) return;
      editFaction(fid, (f) => ({
        ...f,
        ships: f.ships.map((s, i) => (i === si ? { ...s, image: ref } : s)),
      }));
      done();
      break;
    }
    default:
      break;
  }
}

/** True if this action is one applyImageUpload knows how to place. */
function isImageUpload(action: string | undefined): action is string {
  return (
    action === "emblem-upload" ||
    action === "cf-emblem-upload" ||
    action === "outfit-emblem-upload" ||
    action === "no-emblem-upload" ||
    action === "cf-ship-image-upload"
  );
}

/**
 * The first image on a DataTransfer, from a drag or a paste.
 *
 * A paste of a screenshot arrives as an item with no name and a copied file
 * arrives as a real one; both are Files by the time they get here. Anything
 * that is not an image (a dragged link, the text that rides along with a
 * copied image) is skipped rather than rejected, so dropping a picture that
 * happens to carry an HTML fragment still works.
 */
function firstImage(dt: DataTransfer | null): File | null {
  if (!dt) return null;
  for (const item of Array.from(dt.items ?? [])) {
    if (item.kind !== "file") continue;
    const f = item.getAsFile();
    if (f?.type.startsWith("image/")) return f;
  }
  for (const f of Array.from(dt.files ?? [])) {
    if (f.type.startsWith("image/")) return f;
  }
  return null;
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
  dispatchAction(target);
}

/**
 * Ask before doing something destructive, then come back and do it.
 *
 * Every confirm in the app was a native `window.confirm()`, whose buttons are
 * always OK/Cancel and cannot be relabelled - so "name the action in the
 * button" was unreachable and the sentence had to carry it. This puts the
 * question in a real dialog, where the confirm button can say "Delete fleet".
 *
 * It works by replaying the click: the pending action's name and data-* payload
 * are parked on the modal, and confirming rebuilds a detached element carrying
 * them plus data-confirmed, then dispatches that. So a destructive case only
 * needs one guard line at the top and its body is untouched - and because the
 * replay is the same dispatch path, there is no second copy of the logic that
 * could drift.
 */
function needsConfirm(
  target: HTMLElement,
  ask: { title: string; body: string; confirmLabel: string; danger?: boolean },
): boolean {
  if (target.dataset["confirmed"]) return false;
  const data: Record<string, string> = {};
  for (const [k, v] of Object.entries(target.dataset)) {
    if (k !== "action" && typeof v === "string") data[k] = v;
  }
  const action = target.dataset["action"] ?? "";
  store.setState((s) => ({ ...s, ui: { ...s.ui, modal: { kind: "confirm", ...ask, intent: { action, data } } } }));
  return true;
}

function dispatchAction(target: HTMLElement): void {
  const action = target.dataset["action"];
  const state = store.getState();

  switch (action) {
    case "confirm-cancel": {
      store.setState((s) => ({ ...s, ui: { ...s.ui, modal: undefined } }));
      break;
    }
    case "confirm-go": {
      const m = state.ui.modal;
      if (m?.kind !== "confirm") return;
      const el = document.createElement("button");
      el.dataset["action"] = m.intent.action;
      for (const [k, v] of Object.entries(m.intent.data)) el.dataset[k] = v;
      el.dataset["confirmed"] = "1";
      store.setState((s) => ({ ...s, ui: { ...s.ui, modal: undefined } }));
      dispatchAction(el);
      break;
    }
    case "close-popover": {
      // Visible X inside a popover: close the nearest open <details> around it.
      target.closest<HTMLDetailsElement>("details[open]")?.removeAttribute("open");
      break;
    }
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
    case "gen-fleet-name": {
      const id = currentListId();
      if (!id) return;
      const source = state.lists.find((l) => l.id === id);
      if (!source) return;
      const factionId = source.fleet.factionId;
      // Ordinal = this fleet's position among your fleets of the same faction,
      // so the 3rd Vyke list you own reads "3rd ... Horde". Adjective is rolled
      // fresh each click, so the button re-rolls a new name.
      const sameFaction = state.lists.filter((l) => l.fleet.factionId === factionId);
      const ordinal = Math.max(1, sameFaction.findIndex((l) => l.id === id) + 1);
      const name = randomFleetName(factionId, ordinal);
      store.setState((s) => updateFleet(s, id, (f) => ({ ...f, name })));
      break;
    }
    case "reroll-corp-name": {
      // Hypergrowth shipyard's d12 button: roll a fresh corporation name and
      // let it write on with the decode effect. The name flickers into the live
      // input first (no re-render, so the field does not blur or jump); the
      // rolled value is committed to state only once it has settled.
      const id = currentListId();
      if (!id) return;
      const factionId = state.lists.find((l) => l.id === id)?.fleet.factionId;
      const name = randomCorpName(factionId);
      const input = document.querySelector<HTMLInputElement>(".sy-name");
      if (input) {
        writeOnInput(input, name, () => {
          store.setState((s) => updateFleet(s, id, (f) => ({ ...f, name })));
        });
      } else {
        store.setState((s) => updateFleet(s, id, (f) => ({ ...f, name })));
      }
      break;
    }
    case "blank-fleet-name": {
      // Eraser button beside the roll die: clear the name back to empty.
      const id = currentListId();
      if (!id) return;
      const input = document.querySelector<HTMLInputElement>(".sy-name, .mf-name");
      if (input) input.value = "";
      store.setState((s) => updateFleet(s, id, (f) => ({ ...f, name: "" })));
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
      if (
        needsConfirm(target, {
          title: "Delete this fleet?",
          body: `"${doomed.fleet.name || "Unnamed fleet"}" and everything in it goes for good. This cannot be undone.`,
          confirmLabel: "Delete fleet",
          danger: true,
        })
      )
        return;
      // Tombstone first: without it, the next Fleet Sync pull would helpfully
      // restore the fleet just deleted.
      if (id) FleetSync.recordDeleted(id);
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
      void shareUrl(list, cf).then((url) => {
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
      });
      break;
    }
    case "set-emblem": {
      const id = currentListId();
      const emblemId = target.dataset["emblem"];
      if (!id || !emblemId) return;
      store.setState((s) => updateList(s, id, (l) => ({ ...l, emblem: emblemId })));
      break;
    }
    case "open-emblem-modal": {
      const tgt = target.dataset["target"];
      const emblemTarget =
        tgt === "faction" || tgt === "outfit" || tgt === "new-outfit" ? tgt : "list";
      // The new-outfit name field is uncontrolled, so anything that re-renders
      // the dialog has to bank what is typed first. Opening the picker replaces
      // the dialog outright, so this is the last chance to read it.
      const typed = emblemTarget === "new-outfit" ? liveOutfitName() : undefined;
      store.setState((s) => ({
        ...s,
        ui: {
          ...s.ui,
          ...(typed !== undefined && s.ui.newOutfit ? { newOutfit: { ...s.ui.newOutfit, name: typed } } : {}),
          modal: { kind: "emblem", target: emblemTarget, tab: "library" },
        },
      }));
      break;
    }
    case "emblem-modal-tab": {
      const raw = target.dataset["tab"];
      const tab = raw === "upload" || raw === "colour" ? raw : "library";
      store.setState((s) =>
        s.ui.modal?.kind === "emblem" ? { ...s, ui: { ...s.ui, modal: { ...s.ui.modal, tab } } } : s,
      );
      break;
    }
    // No "emblem-upload-pick". The drop box IS the file input now (stretched
    // invisibly across it), so there is nothing left to forward a click to.

    // ---- The crop step ----------------------------------------------------
    case "crop-cancel": {
      // Drops the pending image and leaves whatever opened the cropper standing
      // - the emblem picker if it came from there, the Foundry page if not.
      store.setState((s) => ({ ...s, ui: { ...s.ui, crop: undefined } }));
      break;
    }
    case "crop-rotate": {
      activeCropper()?.rotate(90);
      break;
    }
    case "crop-reset": {
      activeCropper()?.reset();
      break;
    }
    case "crop-apply": {
      const c = state.ui.crop;
      const cr = activeCropper();
      if (!c || !cr) return;
      /*
       * The chosen region, redrawn at the destination's own size.
       *
       * getCroppedCanvas does the scaling, so the stored image is exactly as
       * big as it needs to be however large the original was - a 12MP phone
       * photo and a 200px logo both come out at 480px. imageSmoothingQuality is
       * worth setting: the default makes a heavy downscale visibly crunchy.
       */
      const canvas = cr.getCroppedCanvas({
        width: c.outW,
        height: c.outH,
        fillColor: "#ffffff",
        imageSmoothingEnabled: true,
        imageSmoothingQuality: "high",
      });
      if (!canvas) {
        showToast(imageFailure("canvas"), { icon: "close" });
        return;
      }
      /*
       * JPEG, and as a Blob rather than a data URL.
       *
       * JPEG because the canvas is filled white before the image is drawn, so
       * there is no transparency in the output to preserve; keeping a PNG
       * because the SOURCE was a PNG (what the old pipeline did) bought nothing
       * and cost several times the bytes. Emblems get the higher quality of the
       * two - they are usually line art or a logo, where hard edges show
       * ringing first.
       *
       * A Blob because that is what the image store wants (see image-store.ts).
       * toDataURL would base64 it, which inflates by a third, only for the
       * store to have to decode it again.
       */
      const data = { ...(c.ship !== undefined ? { ship: c.ship } : {}) } as DOMStringMap;
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            showToast(imageFailure("canvas"), { icon: "close" });
            return;
          }
          void putImage(blob).then((ref) => {
            store.setState((s) => ({ ...s, ui: { ...s.ui, crop: undefined } }));
            applyImageUpload(c.action, data, ref);
          });
        },
        "image/jpeg",
        c.round ? 0.9 : 0.85,
      );
      break;
    }
    case "emblem-lib-more": {
      // Fired by the sentinel at the foot of the grid scrolling into view.
      store.setState((s) =>
        s.ui.modal?.kind === "emblem"
          ? { ...s, ui: { ...s.ui, modal: { ...s.ui.modal, libShown: (s.ui.modal.libShown ?? LIB_PAGE) + LIB_PAGE } } }
          : s,
      );
      break;
    }
    case "clear-emblem-image": {
      const id = currentListId();
      if (!id) return;
      store.setState((s) =>
        updateList(s, id, (l) => ({
          ...l,
          emblemImage: undefined,
          emblemLib: undefined,
          emblemColor: undefined,
        })),
      );
      break;
    }
    case "cf-clear-emblem": {
      const fid = currentFoundryId();
      if (!fid) return;
      editFaction(fid, (f) => ({
        ...f,
        emblemImage: undefined,
        emblemLib: undefined,
        emblemColor: undefined,
      }));
      break;
    }
    // --- icon library + random, across the three contexts ---
    case "set-emblem-lib": {
      const id = currentListId();
      const lib = target.dataset["lib"];
      if (!id || !lib) return;
      store.setState((s) => updateList(s, id, (l) => ({ ...l, ...libFields(lib) })));
      break;
    }
    case "random-emblem": {
      const id = currentListId();
      const lib = randomIconId();
      if (!id || !lib) return;
      store.setState((s) => updateList(s, id, (l) => ({ ...l, ...libFields(lib) })));
      break;
    }
    case "outfit-set-lib": {
      const lib = target.dataset["lib"];
      if (lib) editOutfit((o) => ({ ...o, ...libFields(lib) }));
      break;
    }
    case "outfit-random-emblem": {
      const lib = randomIconId();
      if (lib) editOutfit((o) => ({ ...o, ...libFields(lib) }));
      break;
    }
    // Same three again for the outfit that does not exist yet. They write the
    // draft instead of a saved outfit; everything else about the picker - the
    // library, the folders, the search, the upload, the background - is the
    // one shared component and does not know the difference.
    case "no-set-lib": {
      const lib = target.dataset["lib"];
      if (lib) editNewOutfit((d) => ({ ...d, ...libFields(lib) }));
      break;
    }
    case "no-random-emblem": {
      const lib = randomIconId();
      if (lib) editNewOutfit((d) => ({ ...d, ...libFields(lib) }));
      break;
    }
    case "no-clear-emblem":
      editNewOutfit((d) => ({ ...d, emblemImage: undefined, emblemLib: undefined, emblemColor: undefined }));
      break;
    case "cf-set-lib": {
      const fid = currentFoundryId();
      const lib = target.dataset["lib"];
      if (fid && lib) editFaction(fid, (f) => ({ ...f, ...libFields(lib) }));
      break;
    }
    case "cf-random-emblem": {
      const fid = currentFoundryId();
      const lib = randomIconId();
      if (fid && lib) editFaction(fid, (f) => ({ ...f, ...libFields(lib) }));
      break;
    }
    case "set-limit": {
      const id = currentListId();
      const limit = Number(target.dataset["limit"]);
      if (!id || !Number.isFinite(limit)) return;
      store.setState((s) => ({ ...updateFleet(s, id, (f) => ({ ...f, creditsLimit: limit })), ui: { ...s.ui, limitCustomOpen: false } }));
      break;
    }
    case "open-limit-custom": {
      store.setState((s) => ({ ...s, ui: { ...s.ui, limitCustomOpen: true } }));
      break;
    }
    case "toggle-unlimited-shipyards": {
      const id = currentListId();
      if (!id) return;
      store.setState((s) => updateList(s, id, (l) => ({ ...l, unlimitedShipyards: !l.unlimitedShipyards })));
      break;
    }
    // Shipyard cap is a plain two-way choice: ¢300bn (limited) or No Limit. Set
    // the flag explicitly so the two buttons are real radio choices, not a toggle.
    case "sy-cap-limited": {
      const id = currentListId();
      if (!id) return;
      store.setState((s) => updateList(s, id, (l) => ({ ...l, unlimitedShipyards: false, fleet: { ...l.fleet, creditsLimit: 300 } })));
      break;
    }
    case "sy-cap-nolimit": {
      const id = currentListId();
      if (!id) return;
      store.setState((s) => updateList(s, id, (l) => ({ ...l, unlimitedShipyards: true })));
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
        // Names the action rather than asking "Continue?". A native confirm's
        // buttons are always OK/Cancel and cannot be relabelled, so the sentence
        // has to carry what OK is going to do.
        if (
          needsConfirm(target, {
            title: "Change faction?",
            body: "Every unit and all personnel in this list are cleared. The fleet name, emblem and credit limit are kept.",
            confirmLabel: "Change faction",
            danger: true,
          })
        )
          return;
      }
      store.setState((s) => updateFleet(s, id, (f) => ({ ...f, factionId, units: [], hvp: [] })));
      break;
    }
    case "add-unit": {
      const id = currentListId();
      const shipId = target.dataset["ship"];
      if (!id || !shipId) return;
      const list = state.lists.find((l) => l.id === id);
      if (!list) return;
      // A Shipyard mode (Hypergrowth) stocks ship CLASSES, not units: the first
      // add creates the entry, every add after that raises how many you hold.
      // Nothing here ever forms a unit - that happens at requisition, in play.
      const stocking = MODE_BUILDER_SHAPE[list.mode] === "shipyard";
      const faction = findFaction(list.fleet.factionId, state.customFactions);
      const addedName = resolveShip(shipId, faction, state.customFactions)?.ship.name ?? "Unit";
      const held = stocking ? (list.fleet.units.find((u) => u.shipClassId === shipId)?.count ?? 0) + 1 : 1;
      // This used to say nothing, on the reasoning that the roster row animates
      // in where you are already looking. That reasoning does not survive
      // contact with the Add Unit dialog: the dialog STAYS OPEN so you can add
      // several ships in a row, and it is covering the roster the whole time.
      // So the row you were supposed to watch land is behind the dialog, and
      // the add had no feedback at all. Loud, because it is the confirmation
      // for the single most repeated action in the app.
      const cost = resolveShip(shipId, faction, state.customFactions)?.ship.cost;
      showToast(
        stocking
          ? `${addedName} stocked${held > 1 ? ` (${held} held)` : ""}${cost === undefined ? "" : ` · ${creditsText(cost)}`}`
          : `${addedName} added to the fleet${cost === undefined ? "" : ` · ${creditsText(cost)}`}`,
        { icon: "check", loud: true },
      );
      store.setState((s) =>
        updateFleet(s, id, (f) => {
          if (stocking) {
            const idx = f.units.findIndex((u) => u.shipClassId === shipId);
            if (idx >= 0) {
              return { ...f, units: f.units.map((u, i) => (i === idx ? { ...u, count: u.count + 1 } : u)) };
            }
          }
          // Mass 3 is the top of the scale and a fleet holds one or two, so
          // they are the hulls people talk about afterwards. They get christened
          // on the way in, from the unit's own id, so the name is stable and
          // never re-rolls on an unrelated re-render. Everything smaller stays
          // unnamed - naming nine corvettes is noise, and the roster already
          // shows what they are.
          const unitId = nextUnitIdFor(f);
          const mass = resolveShip(shipId, faction, s.customFactions)?.ship.mass;
          const named =
            mass === 3
              ? { name: capitalShipName(`${f.factionId}:${unitId}`, f.units.map((u) => u.name ?? "")) }
              : {};
          return { ...f, units: [...f.units, { id: unitId, shipClassId: shipId, count: 1, ...named }] };
        }),
      );
      break;
    }
    /**
     * Move a saved fleet to another era.
     *
     * What survives, and why: ship classes belong to FACTIONS, not eras, and a
     * faction is playable in any era ("You are free to select a faction from
     * any Era", Hypergrowth p.124). So the faction, every unit, the credit
     * limit, the name and the emblem all carry over untouched. What changes is
     * the shape of the builder and the rules wrapped around the fleet.
     *
     * What is cleared, and why:
     *  - Personnel. Each era chooses HVPs at a different moment - Armageddon at
     *    build time, Age of Unity after the missions are generated, Hypergrowth
     *    at requisition - so an assignment made under one era's rules is not a
     *    valid assignment under another's.
     *  - Any game in progress, because the round structure and the requisition
     *    model differ; a Hypergrowth Shipyard tracker means nothing to
     *    Armageddon and vice versa.
     *  - unlimitedShipyards, which only exists in Hypergrowth.
     */
    case "set-era": {
      const id = currentListId();
      const mode = target.dataset["mode"] as GameMode | undefined;
      if (!id || !mode) return;
      const list = state.lists.find((l) => l.id === id);
      if (!list || list.mode === mode) return;
      const toEra = ERA_MODES.find((e) => e.mode === mode);
      const hadHvp = list.fleet.hvp.length > 0;
      const hadPlay = !!list.play;
      const losing = [hadHvp ? "your personnel choices" : "", hadPlay ? "the game in progress" : ""].filter(Boolean);
      if (
        losing.length &&
        needsConfirm(target, {
          title: `Move to ${toEra?.era ?? mode}?`,
          body: `Your ships, faction and credit limit all come with you. This clears ${losing.join(" and ")}, because ${toEra?.era ?? "each era"} handles ${hadHvp ? "personnel" : "play"} differently.`,
          confirmLabel: `Move to ${toEra?.era ?? "this era"}`,
        })
      )
        return;
      store.setState((s) =>
        updateList(s, id, (l) => ({
          ...l,
          mode,
          fleet: { ...l.fleet, hvp: [] },
          play: undefined,
          unlimitedShipyards: mode === "hypergrowth" ? l.unlimitedShipyards : undefined,
        })),
      );
      const kept = list.fleet.units.reduce((n, u) => n + u.count, 0);
      showToast(
        `Now building for ${toEra?.era ?? mode}. ${kept} ship${kept === 1 ? "" : "s"} kept${losing.length ? `, ${losing.join(" and ")} cleared` : ""}.`,
        { icon: "check", loud: true },
      );
      break;
    }
    case "close-modal": {
      store.setState((s) => {
        // The picker opened OVER the new-outfit dialog, so closing it hands
        // back to the dialog rather than dropping you on the dock with a
        // half-typed name gone. Closing the dialog itself is what discards.
        const backToDialog = s.ui.modal?.kind === "emblem" && s.ui.modal.target === "new-outfit";
        return {
          ...s,
          ui: {
            ...s.ui,
            modal: backToDialog ? { kind: "new-outfit" } : undefined,
            ...(backToDialog ? {} : { newOutfit: undefined }),
          },
        };
      });
      break;
    }
    case "open-add-unit": {
      store.setState((s) => ({ ...s, ui: { ...s.ui, modal: { kind: "add-unit" } } }));
      break;
    }
    case "open-ship-reference": {
      store.setState((s) => ({ ...s, ui: { ...s.ui, modal: { kind: "ship-reference" } } }));
      break;
    }
    case "open-options": {
      store.setState((s) => ({ ...s, ui: { ...s.ui, modal: { kind: "options" } } }));
      break;
    }
    // ---- Fleet Sync ---------------------------------------------------
    case "open-sync": {
      store.setState((s) => ({ ...s, ui: { ...s.ui, modal: { kind: "sync" } } }));
      break;
    }
    case "sync-generate": {
      syncError();
      syncBusy(true, "Creating your Sync Token…");
      void FleetSync.start()
        .then((r) => {
          store.setState((s) => ({ ...s, lists: loadLists() }));
          showToast(r.total === 1 ? "1 fleet is now syncing" : `${r.total} fleets are now syncing`);
        })
        .catch((e: unknown) => {
          syncBusy(false);
          syncError(e instanceof Error ? e.message : "Could not create a Sync Token.");
        });
      break;
    }
    case "sync-join": {
      const input = document.getElementById("sync-input") as HTMLInputElement | null;
      if (!input) return;
      const raw = input.value;
      syncError();
      if (!FleetSync.looksLikeToken(raw)) {
        syncError("That does not look like a Sync Token. It should be six words.");
        return;
      }
      syncBusy(true, "Looking up that token…");
      void FleetSync.preview(raw)
        .then((info) => {
          store.setState((s) => ({
            ...s,
            ui: { ...s.ui, modal: { kind: "sync", pendingJoin: info } },
          }));
        })
        .catch((e: unknown) => {
          syncBusy(false);
          syncError(e instanceof Error ? e.message : "Could not reach the sync service.");
        });
      break;
    }
    case "sync-join-cancel": {
      store.setState((s) => ({ ...s, ui: { ...s.ui, modal: { kind: "sync" } } }));
      break;
    }
    case "sync-join-confirmed": {
      const tok = target.dataset["token"];
      if (!tok) return;
      syncError();
      syncBusy(true, "Loading fleets…");
      void FleetSync.join(tok)
        .then((r) => {
          store.setState((s) => ({ ...s, lists: loadLists(), ui: { ...s.ui, modal: { kind: "sync" } } }));
          showToast(`${r.total} fleet${r.total === 1 ? "" : "s"} now syncing`);
        })
        .catch((e: unknown) => {
          syncBusy(false);
          syncError(e instanceof Error ? e.message : "Could not load that token.");
        });
      break;
    }
    case "sync-now": {
      syncError();
      syncBusy(true, "Syncing…");
      void FleetSync.sync()
        .then((r) => {
          store.setState((s) => ({ ...s, lists: loadLists() }));
          showToast(r?.changed ? "Fleets updated" : "Already up to date");
        })
        .catch((e: unknown) => {
          syncBusy(false);
          syncError(e instanceof Error ? e.message : "Sync failed.");
        });
      break;
    }
    case "sync-copy": {
      const tok = FleetSync.token() ?? "";
      void navigator.clipboard.writeText(tok).then(
        () => showToast("Sync Token copied"),
        () => {
          // Clipboard can be blocked; select the text so it can be copied by hand.
          const el = document.getElementById("sync-token-text");
          if (el) {
            const r = document.createRange();
            r.selectNodeContents(el);
            const sel = window.getSelection();
            sel?.removeAllRanges();
            sel?.addRange(r);
          }
          showToast("Select and copy the token");
        },
      );
      break;
    }
    case "sync-stop": {
      if (
        needsConfirm(target, {
          title: "Stop syncing on this device?",
          body: "Your fleets stay on this device, and the online copy is left alone. You can rejoin any time with the same token.",
          confirmLabel: "Stop syncing",
        })
      )
        return;
      FleetSync.stop();
      store.setState((s) => ({ ...s, ui: { ...s.ui, modal: { kind: "sync" } } }));
      showToast("Syncing stopped on this device");
      break;
    }
    case "sync-delete": {
      if (
        needsConfirm(target, {
          title: "Delete the online copy?",
          body: "This removes the synced fleets from the server. Your fleets on THIS device are kept. Other devices still holding the token keep their own copies.",
          confirmLabel: "Delete online copy",
          danger: true,
        })
      )
        return;
      syncError();
      syncBusy(true, "Deleting…");
      void FleetSync.deleteRemote()
        .then(() => {
          store.setState((s) => ({ ...s, ui: { ...s.ui, modal: { kind: "sync" } } }));
          showToast("Online copy deleted");
        })
        .catch((e: unknown) => {
          syncBusy(false);
          syncError(e instanceof Error ? e.message : "Could not delete the online copy.");
        });
      break;
    }
    case "export-data": {
      // A self-initiated backup of the user's own browser-stored data.
      const blob = new Blob([exportAllData()], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "a-billion-suns-backup.json";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      showToast("Backup downloaded.");
      break;
    }
    case "clear-data": {
      if (
        needsConfirm(target, {
          title: "Clear all data?",
          body: "Every saved fleet, outfit and custom faction is deleted from this browser. Export a backup first if you want to keep any of it. This cannot be undone.",
          confirmLabel: "Clear all data",
          danger: true,
        })
      )
        return;
      clearAllData();
      location.hash = "#/";
      location.reload();
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
    case "tour-go": {
      const tourId = target.dataset["tour"];
      if (!tourId) return;
      const href = target.dataset["href"];
      const sel = target.dataset["target"];
      // Close first. That repaints the page, so the element resolved below is
      // the live one and not a node the re-render is about to throw away.
      finishTour(tourId);
      // "Check it out now!" on the examples coachmark IS the yes. It loads the
      // three factions and then walks you to the page they landed on, because
      // arriving at Custom Rules to be asked the same question a second time is
      // not a confirmation, it is a stutter. Closing the coachmark is the no,
      // and it is silent: nothing loads and nothing is asked again.
      if (tourId === "example-factions") setExampleFactions(true);
      if (href) {
        location.hash = href;
        break;
      }
      // No route to send them to means the feature is already on this screen,
      // so put them in it: a field takes focus, anything else takes the click
      // the coachmark was describing.
      const el = visibleAnchor(sel);
      if (!el) break;
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
        el.focus();
        el.select();
      } else {
        el.click();
      }
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
    /**
     * Put an HVP aboard a unit (or take it off, with an empty data-unit).
     *
     * Distinct from "toggle-carry", which flips the same pair on and off from
     * the unit's side. This one comes from the carrier picker, where you choose
     * a destination outright, so re-picking the unit it is already on is a
     * no-op rather than a removal - tapping the highlighted row to confirm your
     * own choice should not silently undo it.
     *
     * Mass 1 or higher is the rule (Armageddon p.80, Age of Unity p.95,
     * Hypergrowth p.125), unless the faction says otherwise - The Discord's
     * "Aces and Heroes" lets their tokens ride Mass 0 units (p.156). Re-checked
     * here so a stale DOM cannot smuggle an illegal carrier in.
     */
    case "hvp-assign-to": {
      const id = currentListId();
      const index = Number(target.dataset["index"]);
      const unitId = target.dataset["unit"] || undefined;
      if (!id || !Number.isInteger(index)) return;
      const list = state.lists.find((l) => l.id === id);
      if (!list) return;
      if (unitId) {
        const unit = list.fleet.units.find((u) => u.id === unitId);
        const faction = findFaction(list.fleet.factionId, state.customFactions);
        const mass = unit ? (resolveShip(unit.shipClassId, faction, state.customFactions)?.ship.mass ?? 0) : 0;
        if (!unit || mass < (faction?.hvpMass0Carriers ? 0 : 1)) return;
      }
      store.setState((s) =>
        updateFleet(s, id, (f) => ({
          ...f,
          hvp: f.hvp.map((h, i) => (i === index ? { ...h, assignedUnitId: unitId } : h)),
        })),
      );
      // Close the picker: it is a <details>, and the re-render would otherwise
      // leave it hanging open over the row you just chose.
      target.closest<HTMLDetailsElement>("details.hvp-pick")?.removeAttribute("open");
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
      store.setState((s) => {
        const list = s.lists.find((l) => l.id === id);
        const faction = list ? findFaction(list.fleet.factionId, s.customFactions) : undefined;
        // The (+) is aria-disabled at the cap rather than disabled, so it stays
        // focusable and still fires - the ceiling has to be enforced here rather
        // than by the browser refusing the click.
        const uncapped = list?.freePlay || list?.mode === "hypergrowth";
        return updateFleet(s, id, (f) => {
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
              const ship = resolveShip(u.shipClassId, faction, s.customFactions)?.ship;
              const ceiling = uncapped ? 99 : ship ? maxUnitSize(ship.mass) : 3;
              const count = Math.min(ceiling, Math.max(1, u.count + delta));
              const shipNames = u.shipNames ? u.shipNames.slice(0, count) : undefined;
              return { ...u, count, ...(shipNames ? { shipNames } : {}) };
            }),
          };
        });
      });
      break;
    }
    case "add-hvp": {
      // Only one of each HVP type may ride in a fleet at a time, so this is a
      // no-op if that type is already selected (guards a stale/replayed click).
      const id = currentListId();
      const hvpId = target.dataset["hvp"];
      if (!id || !hvpId) return;
      store.setState((s) =>
        updateFleet(s, id, (f) =>
          f.hvp.some((h) => h.hvpId === hvpId) ? f : { ...f, hvp: [...f.hvp, chosenHvp(f, hvpId)] },
        ),
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
    // Hypergrowth Shipyard: the pool holds a count per ship CLASS, not units.
    // Both steppers key on the ship class (not a unit instance) so focus and the
    // press anchor survive the 0<->1 boundary where a unit is created or dropped.
    case "sy-inc": {
      const id = currentListId();
      const shipId = target.dataset["ship"];
      if (!id || !shipId) return;
      store.setState((s) =>
        updateFleet(s, id, (f) => {
          const idx = f.units.findIndex((u) => u.shipClassId === shipId);
          if (idx >= 0) {
            return {
              ...f,
              units: f.units.map((u, i) => (i === idx ? { ...u, count: Math.min(99, u.count + 1) } : u)),
            };
          }
          return { ...f, units: [...f.units, { id: nextUnitIdFor(f), shipClassId: shipId, count: 1 }] };
        }),
      );
      break;
    }
    case "sy-dec": {
      const id = currentListId();
      const shipId = target.dataset["ship"];
      if (!id || !shipId) return;
      store.setState((s) =>
        updateFleet(s, id, (f) => {
          const cur = f.units.find((u) => u.shipClassId === shipId);
          if (!cur) return f;
          // Stepping to zero drops the class from the pool entirely; the (-) is
          // aria-disabled at zero so it never fires below one, but guard anyway.
          if (cur.count <= 1) return { ...f, units: f.units.filter((u) => u.shipClassId !== shipId) };
          return {
            ...f,
            units: f.units.map((u) => (u.shipClassId === shipId ? { ...u, count: u.count - 1 } : u)),
          };
        }),
      );
      break;
    }
    case "sy-hvp-toggle": {
      // One square per person: choose or unchoose. An HVP is one or nothing, and
      // only one of each type may be held, so the square is a pure toggle. The
      // three-chosen ceiling is enforced HERE, not just by the disabled look: the
      // over-cap control is aria-disabled and still fires (so a tap is visibly
      // refused rather than silently swallowed), so the handler must refuse it.
      const id = currentListId();
      const hvpId = target.dataset["hvp"];
      if (!id || !hvpId) return;
      store.setState((s) => {
        const list = s.lists.find((l) => l.id === id);
        const faction = list ? findFaction(list.fleet.factionId, s.customFactions) : undefined;
        const hvpMax = faction?.hvpMax ?? 3;
        return updateFleet(s, id, (f) => {
          if (f.hvp.some((h) => h.hvpId === hvpId)) {
            return { ...f, hvp: f.hvp.filter((h) => h.hvpId !== hvpId) };
          }
          if (f.hvp.length >= hvpMax) return f;
          return { ...f, hvp: [...f.hvp, chosenHvp(f, hvpId)] };
        });
      });
      break;
    }
    case "do-print": {
      window.print();
      break;
    }
    case "set-catalog-view": {
      // Clicking the already-active view returns to the plain list, so each
      // button is a real on/off toggle rather than a one-way switch.
      // "chart" is the only non-list view; anything else (i.e. "list") clears it.
      const view = target.dataset["view"];
      const next = view === "chart" ? view : undefined;
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
      const raw = target.dataset["format"];
      const format = raw === "cards" ? "cards" : raw === "guide" ? "guide" : "roster";
      patchPrint({ format });
      break;
    }
    case "print-paper": {
      const raw = target.dataset["paper"];
      patchPrint({ paper: raw === "a4" ? "a4" : "letter" });
      break;
    }
    case "print-trackers": {
      patchPrint({ trackers: !(store.getState().ui.print ?? DEFAULT_PRINT).trackers });
      break;
    }
    case "print-rules": {
      patchPrint({ rules: !(store.getState().ui.print ?? DEFAULT_PRINT).rules });
      break;
    }
    case "print-jumptrackers": {
      patchPrint({ jumpTrackers: !(store.getState().ui.print ?? DEFAULT_PRINT).jumpTrackers });
      break;
    }
    case "print-actions": {
      patchPrint({ actions: !(store.getState().ui.print ?? DEFAULT_PRINT).actions });
      break;
    }
    case "print-commands": {
      patchPrint({ commands: !(store.getState().ui.print ?? DEFAULT_PRINT).commands });
      break;
    }
    case "print-inksaver": {
      patchPrint({ inkSaver: !(store.getState().ui.print ?? DEFAULT_PRINT).inkSaver });
      break;
    }
    case "print-exclude-unit": {
      const unit = target.dataset["unit"];
      if (!unit) return;
      const cur = (store.getState().ui.print ?? DEFAULT_PRINT).excluded ?? [];
      patchPrint({ excluded: cur.includes(unit) ? cur.filter((u) => u !== unit) : [...cur, unit] });
      break;
    }
    case "print-include-all": {
      patchPrint({ excluded: [] });
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
    // The mark is rolled here, on open, rather than left blank for you to fill
    // in: an outfit should arrive already looking like something. It comes from
    // the same library the picker offers, so "random" means the same thing in
    // the dialog as it does everywhere else in the app.
    case "solo-new-outfit-open":
      store.setState((s) => ({
        ...s,
        ui: {
          ...s.ui,
          modal: { kind: "new-outfit" },
          newOutfit: { emblem: "delta", ...libFields(randomIconId() ?? "") },
        },
      }));
      break;
    case "solo-new-outfit-cancel":
      store.setState((s) => ({ ...s, ui: { ...s.ui, modal: undefined, newOutfit: undefined } }));
      break;
    case "solo-new-outfit-create": {
      const draft = state.ui.newOutfit;
      const outfit: SavedOutfit = {
        ...createOutfit(),
        name: liveOutfitName(),
        ...(draft
          ? {
              emblem: draft.emblem,
              emblemImage: draft.emblemImage,
              emblemLib: draft.emblemLib,
              emblemColor: draft.emblemColor,
            }
          : {}),
      };
      store.setState((s) => {
        const outfits = [...s.outfits, outfit];
        persistOutfits(outfits);
        return { ...s, outfits, ui: { ...s.ui, modal: undefined, newOutfit: undefined, soloTab: "outfit" } };
      });
      location.hash = routeHash({ view: "solo-outfit", outfitId: outfit.id });
      break;
    }
    // No "solo-new-outfit-preset". The ready-made crews are pre-built outfits
    // sitting on the Solo page now (see seed-outfits.ts), so starting one is
    // opening it, not asking the dialog to build it.
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
      if (
        needsConfirm(target, {
          title: "Delete this outfit?",
          body: `"${doomed.name || "Unnamed outfit"}", its ships and its whole campaign go for good. This cannot be undone.`,
          confirmLabel: "Delete outfit",
          danger: true,
        })
      )
        return;
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
      const outfit = activeOutfit(state);
      const full = (outfit?.ships.length ?? 0) >= OUTFIT_MAX_SHIPS;
      const shipName = JUNKSPACE_SHIPS.find((s2) => s2.id === shipId)?.name ?? "Ship";
      // Only the refusal is announced. A successful add shows itself in the
      // roster; being silently ignored because the outfit is full does not.
      if (full) {
        showToast(`Outfit is full at ${OUTFIT_MAX_SHIPS} ships`);
        return;
      }
      editOutfit((o) => ({
        ...o,
        ships: [...o.ships, { id: nextOutfitShipId(o), shipClassId: shipId, pilotClass: "Gunner" as PilotClass }],
      }));
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
    case "outfit-pilot-class": {
      const shipId = target.dataset["ship"];
      const cls = target.dataset["class"] as PilotClass;
      editOutfit((o) => ({
        ...o,
        ships: o.ships.map((s) => (s.id === shipId ? { ...s, pilotClass: cls } : s)),
      }));
      break;
    }
    case "outfit-clear-emblem": {
      editOutfit((o) => ({
        ...o,
        emblemImage: undefined,
        emblemLib: undefined,
        emblemColor: undefined,
      }));
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
    // You deal the cards, the app writes down what you drew.
    //
    // This dealt the three Jobs itself for one build, and dealing is the one
    // job here the app has no business doing: the rule is "get a deck of
    // standard playing cards and shuffle all the cards of one suit together"
    // (p.203), and a player following that already knows their three. An app
    // that deals a DIFFERENT three is either overriding the cards on the table
    // or asking you to ignore them.
    case "solo-job-pick": {
      const key = target.dataset["key"] ?? "";
      editOutfit((o) => {
        const jobs = o.jobs ?? [];
        const already = jobs.some((j) => j.key === key);
        if (already) return { ...o, jobs: jobs.filter((j) => j.key !== key) };
        if (jobs.length >= 3) return o;
        return { ...o, jobs: [...jobs, { key, earnedK: 0 }] };
      });
      break;
    }
    // The bag of markers, though, IS the app's to hold: the numbers have to be
    // decided facedown and stay unknown (p.197), which is the one piece of
    // hidden information a solo game has and the one thing a player cannot
    // keep from themselves.
    case "solo-shuffle-blips": {
      editOutfit((o) => ({
        ...o,
        blips: shuffle(Array.from({ length: BLIP_COUNT }, (_, i) => i + 1)).map((n) => ({
          n,
          revealed: false,
        })),
      }));
      break;
    }
    case "solo-job-earn": {
      const index = Number(target.dataset["index"]);
      const delta = Number(target.dataset["delta"]);
      editOutfit((o) => ({
        ...o,
        jobs: (o.jobs ?? []).map((j, i) => {
          if (i !== index) return j;
          const cap = JUNKSPACE_JOBS.find((x) => x.key === j.key)?.capK ?? 3;
          return { ...j, earnedK: Math.max(0, Math.min(cap, j.earnedK + delta)) };
        }),
      }));
      break;
    }
    // Flipping a marker over. The number was decided when the game was dealt,
    // so this reveals it rather than rolling for it - which is the difference
    // between a bag of markers and a random table, and the reason a Recon
    // Ship's Long-Range Scan can peek at one without revealing it.
    case "solo-blip-reveal": {
      const index = Number(target.dataset["index"]);
      editOutfit((o) => ({
        ...o,
        blips: (o.blips ?? []).map((b, i) => (i === index ? { ...b, revealed: !b.revealed } : b)),
      }));
      break;
    }

    // Settling the game. The earnings are the sum of what the three dealt Jobs
    // paid, so there is nothing to type in: a prompt() asking "credits earned
    // this game" was the app admitting it had not been watching. Outfits with
    // no game dealt still get the prompt, because there is nothing to sum.
    case "log-game": {
      const dealt = activeOutfit(store.getState())?.jobs;
      let earnedK: number;
      if (dealt?.length) {
        earnedK = dealt.reduce((sum, j) => sum + j.earnedK, 0);
      } else {
        const raw = prompt("Credits earned this game (in thousands, ¢k):", "0");
        if (raw === null) return;
        earnedK = Math.max(0, Math.round(Number(raw) || 0));
      }
      editOutfit((o) => {
        const debtK = Math.max(0, o.debtK - earnedK);
        return {
          ...o,
          debtK,
          gamesPlayed: o.gamesPlayed + 1,
          gameLog: [...o.gameLog, { game: o.gamesPlayed + 1, earnedK }],
          // The next game starts at whatever the NEW debt says, not at 1. The
          // campaign is supposed to get harder as you pay it off (p.195), and
          // this was hardcoded to 1, so it never did.
          alertLevel: startingAlertLevel(debtK),
          round: 1,
          // The Jobs and the markers belong to the game just finished. Clearing
          // them puts the tracker back to its between-games state, which is the
          // state that offers to deal the next one.
          jobs: undefined,
          blips: undefined,
        };
      });
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
    // Contextual deep-link from the Compendium or Custom Rules: opens the New
    // Fleet modal (on the Fleets page, where it renders) with this faction and
    // its era already selected.
    case "open-new-fleet-with-faction": {
      const factionId = target.dataset["faction"];
      if (!factionId) return;
      const fac = findFaction(factionId, state.customFactions);
      const era = fac?.era ?? "Armageddon";
      store.setState((s) => ({
        ...s,
        ui: { ...s.ui, modal: { kind: "new-fleet", era, limit: 300, factionId, showAll: true } },
      }));
      if (location.hash !== "#/fleets") location.hash = "#/fleets";
      break;
    }
    case "nf-era": {
      const era = target.dataset["era"] as "Hypergrowth" | "Age of Unity" | "Armageddon";
      store.setState((s) =>
        s.ui.modal?.kind === "new-fleet"
          ? {
              ...s,
              ui: {
                ...s.ui,
                // Hypergrowth is a 300bn Shipyard by default (or unlimited), so
                // snap the cap to 300 when switching to it.
                modal: { ...s.ui.modal, era, factionId: undefined, limit: era === "Hypergrowth" ? 300 : s.ui.modal.limit, customOpen: false },
              },
            }
          : s,
      );
      break;
    }
    case "nf-size": {
      const limit = Number(target.dataset["limit"]);
      store.setState((s) =>
        s.ui.modal?.kind === "new-fleet"
          ? { ...s, ui: { ...s.ui, modal: { ...s.ui.modal, limit, customOpen: false, noLimit: false } } }
          : s,
      );
      break;
    }
    case "nf-nolimit": {
      // Hypergrowth's second choice: no credit ceiling at all.
      store.setState((s) =>
        s.ui.modal?.kind === "new-fleet"
          ? { ...s, ui: { ...s.ui, modal: { ...s.ui.modal, noLimit: true, customOpen: false } } }
          : s,
      );
      break;
    }
    case "nf-size-custom-open": {
      // Reveal the custom-amount field. Just opens it - the value only changes
      // once the user types into the number input (nf-size-custom).
      store.setState((s) =>
        s.ui.modal?.kind === "new-fleet"
          ? { ...s, ui: { ...s.ui, modal: { ...s.ui.modal, customOpen: true } } }
          : s,
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
      // No Limit (Hypergrowth): no credit ceiling at all.
      if (m.noLimit) list.unlimitedShipyards = true;
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
        // A Hypergrowth fleet is a corporation: if the player named nothing,
        // roll one from the corp-name generator so it never opens "Untitled".
        if (!list.fleet.name) list.fleet.name = randomCorpName(m.factionId);
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
        // The training list lives in memory for this session so the builder and
        // Play Mode can run, but it is never written to storage - it is not a
        // saved fleet you can load again.
        const lists = [...s.lists, list];
        persistLists(lists.filter((l) => l.mode !== "combat-simulator" && l.mode !== "management-training"));
        // Taking a tutorial retires the suggestion.
        const onboarding = { ...s.onboarding, tutorialsDismissed: true };
        persistOnboarding(onboarding);
        return { ...s, lists, onboarding, ui: { ...s.ui, modal: undefined } };
      });
      location.hash = routeHash({ view: "builder", listId: list.id });
      break;
    }
    case "learn-launch": {
      // End of the Learn to Play walkthrough: load the ready-made Combat
      // Simulator fleet and drop straight into Play Mode (not the builder).
      const list = createTrainingList("combat-simulator");
      const faction = findFaction(list.fleet.factionId, state.customFactions);
      const played = { ...list, play: freshPlayState(faction) };
      store.setState((s) => {
        const lists = [...s.lists, played];
        persistLists(lists.filter((l) => l.mode !== "combat-simulator" && l.mode !== "management-training"));
        const onboarding = { ...s.onboarding, tutorialsDismissed: true };
        persistOnboarding(onboarding);
        return { ...s, lists, onboarding, ui: { ...s.ui, modal: undefined } };
      });
      location.hash = routeHash({ view: "play", listId: played.id });
      break;
    }

    // ---- Play mode ----------------------------------------------------------
    case "play-phase":
    case "play-next":
    case "play-round":
    case "play-cmd":
    case "play-cmd-set":
    case "play-pos":
    case "play-vp":
    case "play-oppvp":
    case "play-reset": {
      const id = currentListId();
      if (!id) return;
      if (
        action === "play-reset" &&
        needsConfirm(target, {
          title: "Reset this game?",
          body: "The round, the phase, your CMD tokens, both scores and where every unit is all go back to the start. Your fleet is untouched.",
          confirmLabel: "Reset game",
          danger: true,
        })
      )
        return;
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
              // Advancing past the End Phase rolls into the next round. Unspent
              // CMD tokens are discarded at the end of the round and you gain
              // your faction's value again, so the pool refills to the faction
              // number rather than carrying over - including any +1 you took
              // for losing the Initiative Check, which is re-rolled each round.
              if (p.phase >= 3) {
                const base = faction ? Number(faction.cmdTokens) || (p.cmdMax ?? p.cmd) : (p.cmdMax ?? p.cmd);
                return {
                  ...l,
                  play: { ...p, phase: 0, round: Math.min(maxRound, p.round + 1), cmd: base, cmdMax: base, checks: [] },
                };
              }
              return { ...l, play: { ...p, phase: p.phase + 1, checks: [] } };
            }
            case "play-round":
              return { ...l, play: { ...p, round: Math.max(1, Math.min(maxRound, p.round + delta)) } };
            // The +/- beside the token row sizes the POOL, not what is left of
            // it: losing the Initiative Check is +1 token, and several HVPs give
            // and take tokens outright. Growing the pool hands you live tokens;
            // shrinking it never leaves more unspent than the pool holds.
            case "play-cmd": {
              const max = Math.max(0, (p.cmdMax ?? p.cmd) + delta);
              return { ...l, play: { ...p, cmdMax: max, cmd: Math.max(0, Math.min(p.cmd + delta, max)) } };
            }
            // Tapping token i: if it is live, it and everything to its right is
            // spent (so spending one is a tap on the last live token); if it is
            // already spent, it and everything to its left comes back. One tap
            // for any number of tokens, and misclicks are undone the same way.
            case "play-cmd-set": {
              const i = Number(target.dataset["i"] ?? -1);
              const max = p.cmdMax ?? p.cmd;
              if (!Number.isFinite(i) || i < 0 || i >= max) return l;
              return { ...l, play: { ...p, cmd: i < p.cmd ? i : i + 1 } };
            }
            // Reserve <-> jumped in, per unit. Units start in Reserve and jump
            // in via a Jump Point; the Jump Out action puts one straight back.
            case "play-pos": {
              const unit = target.dataset["unit"];
              const to = target.dataset["to"];
              if (!unit || (to !== "reserve" && to !== "play")) return l;
              return { ...l, play: { ...p, pos: { ...(p.pos ?? {}), [unit]: to } } };
            }
            // Hypergrowth is played in credits, and you requisition ships out of
            // your Shipyard before you have earned anything: "You start with 0
            // credits, and recover that expenditure by earning credits from the
            // objectives." A debt is the normal state of the first two rounds,
            // so the counter must go below zero there. Victory points cannot.
            case "play-vp":
              return { ...l, play: { ...p, vp: floorScore(l.mode, p.vp + delta) } };
            case "play-oppvp":
              return { ...l, play: { ...p, oppVp: floorScore(l.mode, p.oppVp + delta) } };
            case "play-reset":
              // The question was asked before we got here (see needsConfirm).
              return { ...l, play: freshPlayState(faction) };
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
    // Hypergrowth requisition tracker. A ship moves Shipyard -> In play (Deploy),
    // In play -> Reserves (Jumped out), and Reserves -> In play (Jump in). yard =
    // total - play - reserve, and Deploy is one-way (struck off the Shipyard).
    case "play-deploy":
    case "play-jumpout":
    case "play-jumpin": {
      const id = currentListId();
      const shipId = target.dataset["ship"];
      if (!id || !shipId) return;
      store.setState((s) =>
        updateList(s, id, (l) => {
          const faction = findFaction(l.fleet.factionId, s.customFactions);
          const p = l.play ?? freshPlayState(faction);
          const ship = resolveShip(shipId, faction, s.customFactions)?.ship;
          // No Limit: any ship, any quantity - the yard never runs out.
          const total = l.unlimitedShipyards
            ? Infinity
            : l.fleet.units.filter((u) => u.shipClassId === shipId).reduce((n, u) => n + u.count, 0);
          const req = { ...(p.req ?? {}) };
          const cur = req[shipId] ?? { play: 0, reserve: 0 };
          let { play, reserve } = cur;
          let vp = p.vp;
          const yard = total - play - reserve;
          const log = [...(p.log ?? [])];
          const name = ship?.name ?? shipId;
          // Deploying (Requisition) pays the ship's Credit cost - Credits drop,
          // usually into debt. Jumping out to Reserves or back In costs nothing
          // more; you already paid when you requisitioned. Every move is logged.
          if (action === "play-deploy" && yard > 0) {
            play += 1;
            vp -= ship?.cost ?? 0;
            log.push({ kind: "deploy", ship: name, cost: ship?.cost ?? 0 });
          } else if (action === "play-jumpout" && play > 0) {
            play -= 1;
            reserve += 1;
            log.push({ kind: "jumpout", ship: name, cost: 0 });
          } else if (action === "play-jumpin" && reserve > 0) {
            reserve -= 1;
            play += 1;
            log.push({ kind: "jumpin", ship: name, cost: 0 });
          } else return l;
          req[shipId] = { play, reserve };
          return { ...l, play: { ...p, req, vp, log } };
        }),
      );
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
    case "new-faction-template": {
      // A starter fleet you rename and edit - a friendlier entry than a blank
      // sheet. (The pirate-raider enemy template was removed: raiders are an
      // opponent, not a playable/pickable faction.)
      const faction: Faction = {
        id: newId("cf"),
        name: "My Fleet",
        era: "Armageddon",
        initiative: "3D6",
        cmdTokens: "5",
        rule: { name: "House rule", text: "Your own fleet. Rename it and edit its rule, ships, and personnel however you like." },
        ships: [
          { id: "scout", name: "Scout", mass: 1, thrust: 8, silhouette: 4, shields: 1, primary: [w("Light Blasters", 2, "D6", 0, 6)], auxiliary: [], utilityBays: false, cost: 10 },
          { id: "cruiser", name: "Cruiser", mass: 2, thrust: 6, silhouette: 6, shields: 3, primary: [w("Railguns", 2, "D8", 9, 18)], auxiliary: [w("Blasters", 2, "D6", 0, 6)], utilityBays: false, cost: 22 },
        ],
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
      if (
        needsConfirm(target, {
          title: "Delete this faction?",
          body: `"${doomed.name}" is deleted. Any fleet built with it stops resolving its ships and rules.`,
          confirmLabel: "Delete faction",
          danger: true,
        })
      )
        return;
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
    // Settings switches. In handleChange, not handleClick: `change` is the
    // event that means "the box is now in this state", and it is also what a
    // keyboard toggle fires.
    case "toggle-example-factions": {
      setExampleFactions(target.checked);
      break;
    }
    case "fleet-name": {
      if (!listId) return;
      store.setState((s) => updateFleet(s, listId, (f) => ({ ...f, name: inputValue })));
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
    /**
     * Name a person. p.57 "Naming Your HVP" - "not just 'Chief Engineer', but
     * 'Lt. Commander Sadie Hyatt, Chief Engineer'".
     *
     * Keyed by the selection's index rather than its hvpId, because Combat
     * Simulator issues three of the same HVP ("All three of your HVP are
     * Seasoned Captains", p.63) and the whole point of naming them there is to
     * tell three identical people apart.
     *
     * A blank field drops the key rather than storing "", so an emptied name
     * cannot print or export as a stray leading comma.
     */
    case "hvp-name": {
      if (!listId) return;
      const index = Number(target.dataset["index"]);
      if (!Number.isInteger(index) || index < 0) return;
      // The field starts out holding the job title, so "unchanged" and "empty"
      // both mean the same thing: nobody has been named. Neither is stored, and
      // an untouched person keeps no custom name at all.
      const typed = inputValue.trim();
      const name = typed === (target.dataset["default"] ?? "") ? "" : typed;
      store.setState((s) =>
        updateFleet(s, listId, (f) => {
          const sel = f.hvp[index];
          if (!sel) return f;
          // Remembered by role as well as held on the selection, so unchoosing
          // somebody and choosing them again brings their name back with them.
          const names = { ...(f.hvpNames ?? {}) };
          if (name) names[sel.hvpId] = name;
          else delete names[sel.hvpId];
          return {
            ...f,
            hvpNames: names,
            hvp: f.hvp.map((h, i) => {
              if (i !== index) return h;
              if (name) return { ...h, customName: name };
              const { customName: _cleared, ...rest } = h;
              return rest;
            }),
          };
        }),
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
    case "ship-group-faction": {
      // The obvious control for grouping: checked groups the table by faction
      // (the default); unchecked drops to a flat list sorted by name, which the
      // column headers can then re-sort by any stat.
      store.setState((s) => {
        const current = s.ui.shipFilter ?? { ...EMPTY_SHIP_FILTER };
        const sort = target.checked ? "faction" : "name";
        return { ...s, ui: { ...s.ui, shipFilter: { ...current, sort } } };
      });
      break;
    }
    case "emblem-lib-search": {
      // Live-filters the sigil grid as you type; the input carries an id so
      // focus and caret survive the re-render.
      const q = inputValue;
      store.setState((s) =>
        s.ui.modal?.kind === "emblem"
          ? {
              ...s,
              ui: {
                ...s.ui,
                modal: {
                  ...s.ui.modal,
                  libQuery: q,
                  libShown: LIB_PAGE,
                },
              },
            }
          : s,
      );
      break;
    }
    case "ship-show-custom": {
      // Custom-faction ships stay out of the compendium unless asked for.
      store.setState((s) => {
        const current = s.ui.shipFilter ?? { ...EMPTY_SHIP_FILTER };
        return { ...s, ui: { ...s.ui, shipFilter: { ...current, showCustom: target.checked } } };
      });
      break;
    }
    case "import-data": {
      const file = target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        if (importAllData(String(reader.result ?? ""))) {
          location.hash = "#/";
          location.reload();
        } else {
          showToast("That file was not a recognised backup.");
        }
      };
      reader.onerror = () => showToast("Could not read that file.");
      reader.readAsText(file);
      break;
    }

    // ---- Foundry ----------------------------------------------------------
    case "md-wrap": {
      // A Markdown toolbar button: wrap or prefix the sibling textarea's current
      // selection. No state change here - the textarea commits on blur like any
      // other field; this just edits its text and refreshes the live preview.
      const editor = target.closest(".rt-editor");
      const ta = editor?.querySelector<HTMLTextAreaElement>("textarea.rt-input");
      if (!ta) return;
      const kind = target.dataset["md"];
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const sel = ta.value.slice(start, end);
      if (kind === "bold" || kind === "italic") {
        const marks = kind === "bold" ? "**" : "*";
        const inner = sel || (kind === "bold" ? "bold text" : "italic text");
        ta.setRangeText(`${marks}${inner}${marks}`, start, end, "select");
      } else if (kind === "link") {
        const url = prompt("Link URL (https://…)", "https://") ?? "";
        if (!/^https?:\/\//i.test(url)) return;
        ta.setRangeText(`[${sel || "link"}](${url})`, start, end, "select");
      } else if (kind === "h" || kind === "ul" || kind === "ol") {
        // Line-wise: prefix each line of the selection (or the current line).
        const lineStart = ta.value.lastIndexOf("\n", start - 1) + 1;
        const lineEnd = ta.value.indexOf("\n", end);
        const blockEnd = lineEnd === -1 ? ta.value.length : lineEnd;
        const block = ta.value.slice(lineStart, blockEnd);
        const prefix = kind === "h" ? "## " : kind === "ul" ? "- " : "1. ";
        const prefixed = block
          .split("\n")
          .map((l) => (l.trim() ? prefix + l.replace(/^(#{1,3}\s+|[-*]\s+|\d+\.\s+)/, "") : l))
          .join("\n");
        ta.setRangeText(prefixed, lineStart, blockEnd, "select");
      } else {
        return;
      }
      ta.focus();
      // Refresh the preview without a state round-trip (main.ts wires the same on input).
      const preview = editor?.querySelector<HTMLElement>("[data-rt-preview]");
      if (preview) preview.innerHTML = renderMarkdown(ta.value);
      break;
    }
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
          case "backstory":
            return { ...f, backstory: inputValue };
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
    // Every image upload, whichever of the five inputs fired it. The value is
    // cleared so picking the SAME file again still fires a change event.
    case "emblem-upload":
    case "cf-emblem-upload":
    case "outfit-emblem-upload":
    case "no-emblem-upload":
    case "cf-ship-image-upload": {
      const file = target.files?.[0];
      if (file) startImageCrop(action, target.dataset, file);
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

/**
 * Drag an image onto a drop zone, and paste one into the emblem picker.
 *
 * Delegated, like every other handler here, because the app replaces its own
 * DOM on each state change - a listener bound to a particular drop zone would
 * be attached to a node that no longer exists by the time you let go of the
 * file. A zone is marked with a bare `data-drop`; what it is a zone FOR comes
 * off the <input type="file"> inside it, so the markup carries the action name
 * exactly once.
 *
 * The document-level preventDefault is the important half. A file dropped
 * anywhere on a page the browser has not been told about NAVIGATES to it: miss
 * the 100x60 art tile by ten pixels and the app is replaced by a JPEG, with the
 * dialog you had open gone. Cancelling both events everywhere makes a missed
 * drop do nothing, which is the only acceptable outcome.
 */
function zoneFor(e: Event): { zone: HTMLElement; input: HTMLInputElement } | null {
  const el = e.target instanceof Element ? e.target.closest<HTMLElement>("[data-drop]") : null;
  const input = el?.querySelector<HTMLInputElement>('input[type="file"]');
  return el && input && isImageUpload(input.dataset["action"]) ? { zone: el, input } : null;
}

function wireImageDrops(): void {
  document.addEventListener("dragover", (e) => {
    e.preventDefault();
    const hit = zoneFor(e);
    if (!hit) return;
    if (e.dataTransfer) e.dataTransfer.dropEffect = "copy";
    hit.zone.classList.add("is-dropping");
  });
  // dragleave fires when the pointer crosses onto a CHILD as well, so the class
  // comes off only once the pointer has genuinely left the zone's box.
  document.addEventListener("dragleave", (e) => {
    const hit = zoneFor(e);
    if (hit && !hit.zone.contains(e.relatedTarget as Node | null)) hit.zone.classList.remove("is-dropping");
  });
  document.addEventListener("drop", (e) => {
    e.preventDefault();
    const hit = zoneFor(e);
    if (!hit) return;
    hit.zone.classList.remove("is-dropping");
    const file = firstImage(e.dataTransfer);
    if (!file) {
      showToast("That was not an image. Drop a PNG, JPEG, WebP or GIF.", { icon: "close" });
      return;
    }
    startImageCrop(hit.input.dataset["action"]!, hit.input.dataset, file);
  });

  /*
   * Paste, but only into the emblem picker.
   *
   * A screenshot on the clipboard is the single most likely source of a fleet
   * badge, and until now the only way to use one was to save it to disk first.
   * It is scoped to the open picker because that is the one place in the app
   * with exactly one unambiguous destination - the Foundry has nine ship art
   * slots on screen at once and no way to know which one a paste meant.
   *
   * Ignored while the caret is in a text field, where Ctrl+V means paste text.
   */
  document.addEventListener("paste", (e) => {
    const s = store.getState();
    if (s.ui.modal?.kind !== "emblem") return;
    const active = document.activeElement;
    if (active instanceof HTMLInputElement && active.type !== "file") return;
    if (active instanceof HTMLTextAreaElement) return;
    const file = firstImage(e.clipboardData);
    if (!file) return;
    const input = document.querySelector<HTMLInputElement>('.em-modal input[type="file"]');
    const action = input?.dataset["action"];
    if (!isImageUpload(action)) return;
    e.preventDefault();
    startImageCrop(action, input!.dataset, file);
  });
}

export function wireActions(root: HTMLElement): void {
  root.addEventListener("click", handleClick);
  root.addEventListener("change", handleChange);
  wireImageDrops();
  // Loud, because it is the one message in the app that means work is about to
  // be lost. Uploaded art is named as the cause: it is what fills the budget,
  // and deleting one image buys back what a hundred fleets of text would.
  setStorageFullHook(() =>
    showToast("That did not save - this browser's storage for the app is full. Remove an uploaded image or an old fleet, then try again.", {
      icon: "close",
      loud: true,
    }),
  );
  /**
   * Naming a person puts the caret at the END of their job, ready to type.
   *
   * The field opens holding "Commissar " and the whole point is that clicking
   * it is the only thing you have to do before typing "Sadie Hyatt". Left to
   * itself a click drops the caret wherever the pointer landed, mid-word as
   * often as not, and tabbing in selects the lot so the first keystroke wipes
   * the job. Both are fixed by putting it at the end and selecting nothing.
   *
   * focusin, not click, for two reasons. It fires for the keyboard as well as
   * the pointer, and it fires only on ENTERING the field - so once you are
   * inside, clicking again positions the caret exactly where you clicked, which
   * is what anyone editing the middle of a name expects.
   *
   * Set twice, on purpose. The immediate call is the one that works for the
   * keyboard, and it is the only one that runs at all on a backgrounded tab,
   * where rAF is paused. The deferred call is for the pointer: focus arrives on
   * mousedown, and the mouseup that follows sets its own caret position and
   * would undo an immediate-only fix. Waiting a frame puts this last. Setting
   * the same position twice costs nothing and is invisible.
   */
  root.addEventListener("focusin", (e) => {
    const t = e.target;
    if (!(t instanceof HTMLInputElement) || t.dataset["action"] !== "hvp-name") return;
    const end = t.value.length;
    t.setSelectionRange(end, end);
    requestAnimationFrame(() => {
      if (document.activeElement === t) t.setSelectionRange(t.value.length, t.value.length);
    });
  });
  // Keyboard activation for the custom role="button" controls (the ship-row and
  // personnel-row "Add" tiles are <article>s, which - unlike <button>/<a>/
  // <summary> - do not fire click on Enter/Space on their own). Route those keys
  // through the same click path so the core "add to fleet" action is reachable
  // without a mouse. Native controls handle their own keys and are left alone.
  root.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const t = e.target as HTMLElement | null;
      if (t?.classList.contains("new-outfit-name")) {
        e.preventDefault();
        document.querySelector<HTMLButtonElement>('[data-action="solo-new-outfit-create"]')?.click();
        return;
      }
    }
    if (e.key !== "Enter" && e.key !== " ") return;
    const el = (e.target as HTMLElement | null)?.closest<HTMLElement>('[role="button"][data-action]');
    if (!el || el.tagName === "BUTTON" || el.tagName === "A") return;
    e.preventDefault(); // stop Space from scrolling the page
    el.click();
  });
  // Live-filter the compendium search as the user types. Only this field is
  // routed on input; it carries an id, so focus and caret survive re-render.
  root.addEventListener("input", (e) => {
    const t = e.target as HTMLElement | null;
    const liveAction = t?.dataset?.["action"];
    if (liveAction === "ship-search" || liveAction === "emblem-lib-search") handleChange(e);
  });
  // Escape closes whatever is on top. Bound to the document, not root, because
  // focus can legitimately sit outside #app (the skip link, the address bar
  // returning focus to body) and Escape must still work from there.
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    const s = store.getState();
    // The cropper is the topmost layer when it is open, so it unstacks first -
    // back to the emblem picker that launched it, if that is what launched it.
    if (s.ui.crop) {
      e.preventDefault();
      store.setState((st) => ({ ...st, ui: { ...st.ui, crop: undefined } }));
      return;
    }
    if (s.ui.modal) {
      e.preventDefault();
      // Escape unstacks one layer, the same as the X and Done: from the emblem
      // picker back to the new-outfit dialog it opened over, and only then out.
      // Leaving the draft behind here as well, so Escape out of the dialog
      // discards it exactly like Cancel does.
      const backToDialog = s.ui.modal.kind === "emblem" && s.ui.modal.target === "new-outfit";
      store.setState((st) => ({
        ...st,
        ui: {
          ...st.ui,
          modal: backToDialog ? { kind: "new-outfit" } : undefined,
          ...(backToDialog ? {} : { newOutfit: undefined }),
        },
      }));
      return;
    }
    // No modal: fall back to closing an open transient popover, innermost first.
    const open = document.querySelector<HTMLDetailsElement>("details[open]:not([data-persist])");
    if (open) {
      e.preventDefault();
      open.open = false;
      open.querySelector<HTMLElement>("summary")?.focus();
    }
  });
}
