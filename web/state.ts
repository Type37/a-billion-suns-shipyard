import type { Faction, Fleet, GameMode } from "../src/types.ts";
import { STARTING_DEBT_K, ALERT_START } from "../src/data/junkspace.ts";
import {
  loadCustomFactions,
  loadLists,
  loadOutfits,
  newId,
  persistCustomFactions,
  persistLists,
  persistOutfits,
} from "./storage.ts";
import type { SavedList, SavedOutfit } from "./storage.ts";

// A minimal store: state + subscribers, no framework. The whole app re-renders
// on every change (main.ts).

export type Listener = () => void;

export interface Store<T> {
  getState(): T;
  setState(updater: (state: T) => T): void;
  subscribe(fn: Listener): () => void;
}

export function createStore<T>(initial: T): Store<T> {
  let state = initial;
  const listeners = new Set<Listener>();
  return {
    getState: () => state,
    setState(updater) {
      state = updater(state);
      for (const l of listeners) l();
    },
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };
}

// ---------------------------------------------------------------------------
// Routing
// ---------------------------------------------------------------------------

export type Route =
  | { view: "home" }
  | { view: "builder"; listId: string }
  | { view: "print"; listId: string }
  | { view: "foundry"; factionId?: string }
  | { view: "solo" }
  | { view: "solo-outfit"; outfitId: string }
  | { view: "ships" }
  | { view: "play"; listId: string }
  | { view: "changelog" };

export function parseRoute(hash: string): Route {
  const h = hash.replace(/^#/, "");
  const parts = h.split("/").filter(Boolean);
  if (parts[0] === "list" && parts[1]) return { view: "builder", listId: parts[1] };
  if (parts[0] === "print" && parts[1]) return { view: "print", listId: parts[1] };
  if (parts[0] === "foundry") return parts[1] ? { view: "foundry", factionId: parts[1] } : { view: "foundry" };
  if (parts[0] === "solo") return parts[1] ? { view: "solo-outfit", outfitId: parts[1] } : { view: "solo" };
  if (parts[0] === "ships") return { view: "ships" };
  if (parts[0] === "play" && parts[1]) return { view: "play", listId: parts[1] };
  if (parts[0] === "changelog") return { view: "changelog" };
  return { view: "home" };
}

export function routeHash(route: Route): string {
  switch (route.view) {
    case "home":
      return "#/";
    case "builder":
      return `#/list/${route.listId}`;
    case "print":
      return `#/print/${route.listId}`;
    case "foundry":
      return route.factionId ? `#/foundry/${route.factionId}` : "#/foundry";
    case "solo":
      return "#/solo";
    case "solo-outfit":
      return `#/solo/${route.outfitId}`;
    case "ships":
      return "#/ships";
    case "play":
      return `#/play/${route.listId}`;
    case "changelog":
      return "#/changelog";
  }
}

export interface ShipFilter {
  era: string;
  faction: string;
  mass: string;
  q: string;
  sort: string;
}

export type SoloTab = "outfit" | "play" | "campaign" | "reference";

export interface LastRoll {
  table: string;
  value: number;
  result: string;
  detail?: string;
}

// ---------------------------------------------------------------------------
// App state
// ---------------------------------------------------------------------------

export interface AppState {
  route: Route;
  lists: SavedList[];
  customFactions: Faction[];
  outfits: SavedOutfit[];
  /** Monotonic counter for generating unit instance ids within the active list. */
  nextUnitSeq: number;
  /** Transient UI state, never persisted. */
  ui: {
    /** Unit id whose per-ship naming panel is open. */
    openShipNames?: string;
    /** Toast message shown briefly after copy actions. */
    toast?: string;
    /** Faction picker: show every era, not just the list's era. */
    showAllFactions: boolean;
    /** Active tab within a solo outfit workspace. */
    soloTab?: SoloTab;
    /** Result of the most recent solo dice roll, shown in the roller. */
    lastRoll?: LastRoll;
    /** Filters on the ship compendium. */
    shipFilter?: ShipFilter;
  };
}

export const EMPTY_SHIP_FILTER: ShipFilter = { era: "", faction: "", mass: "", q: "", sort: "faction" };

export function initialState(): AppState {
  return {
    route: parseRoute(location.hash),
    lists: loadLists(),
    customFactions: loadCustomFactions(),
    outfits: loadOutfits(),
    nextUnitSeq: 1,
    ui: { showAllFactions: false, soloTab: "outfit" },
  };
}

export const store = createStore<AppState>(initialState());

// ---------------------------------------------------------------------------
// List helpers
// ---------------------------------------------------------------------------

export function activeList(state: AppState): SavedList | undefined {
  const r = state.route;
  if (r.view !== "builder" && r.view !== "print" && r.view !== "play") return undefined;
  return state.lists.find((l) => l.id === r.listId);
}

export function freshPlayState(faction?: { cmdTokens: string }): import("./storage.ts").PlayState {
  // Seed the CMD counter from the faction's per-round value where it is a
  // plain number ("7"); dice values ("D12") start at 0 and are set by hand.
  const cmd = faction ? Number(faction.cmdTokens) || 0 : 0;
  return { round: 1, phase: 0, cmd, vp: 0, oppVp: 0 };
}

/**
 * The two Basic Training scenarios ship as pre-built, loadable lists using the
 * Training Fleet (p.60): "each bullet point in the list above is a single
 * unit". Management Training starts the same hulls in a Shipyard instead
 * (p.65, no Light Utility Ships) and selects no HVP.
 */
export function createTrainingList(mode: "combat-simulator" | "management-training"): SavedList {
  const now = new Date().toISOString();
  const u = (id: string, shipClassId: string, count: number) => ({ id, shipClassId, count });
  const units =
    mode === "combat-simulator"
      ? [
          u("u1", "heavy-cruiser", 1),
          u("u2", "frigate", 1),
          u("u3", "corvette", 3),
          u("u4", "gunship", 3),
          u("u5", "light-utility-ship", 3),
          u("u6", "fighter-wing", 3),
          u("u7", "bomber-wing", 3),
        ]
      : [
          u("u1", "heavy-cruiser", 1),
          u("u2", "frigate", 1),
          u("u3", "corvette", 3),
          u("u4", "gunship", 3),
          u("u5", "fighter-wing", 3),
          u("u6", "bomber-wing", 3),
        ];
  // Combat Simulator: "All three of your HVP are 'Seasoned Captains'" (p.63).
  const hvp =
    mode === "combat-simulator"
      ? [{ hvpId: "seasoned-captain" }, { hvpId: "seasoned-captain" }, { hvpId: "seasoned-captain" }]
      : [];
  return {
    id: newId("fl"),
    mode,
    freePlay: false,
    emblem: "ring",
    fleet: {
      name: mode === "combat-simulator" ? "Combat Simulator" : "Management Training",
      factionId: "training-fleet",
      creditsLimit: 300,
      units,
      hvp,
    },
    createdAt: now,
    updatedAt: now,
  };
}

export function createList(mode: GameMode, factionId: string, freePlay: boolean): SavedList {
  const now = new Date().toISOString();
  const fleet: Fleet = { name: "", factionId, creditsLimit: 300, units: [], hvp: [] };
  return {
    id: newId("fl"),
    mode,
    freePlay,
    emblem: "delta",
    fleet,
    createdAt: now,
    updatedAt: now,
  };
}

/** Immutably update one saved list and persist the registry. */
export function updateList(state: AppState, listId: string, fn: (l: SavedList) => SavedList): AppState {
  const lists = state.lists.map((l) =>
    l.id === listId ? { ...fn(l), updatedAt: new Date().toISOString() } : l,
  );
  persistLists(lists);
  return { ...state, lists };
}

export function updateFleet(state: AppState, listId: string, fn: (f: Fleet) => Fleet): AppState {
  return updateList(state, listId, (l) => ({ ...l, fleet: fn(l.fleet) }));
}

export function persistAll(state: AppState): void {
  persistLists(state.lists);
  persistCustomFactions(state.customFactions);
}

/** Highest existing unit sequence in a fleet, so new ids never collide. */
export function nextUnitIdFor(fleet: Fleet): string {
  let max = 0;
  for (const u of fleet.units) {
    const m = /^u(\d+)$/.exec(u.id);
    if (m) max = Math.max(max, Number(m[1]));
  }
  return `u${max + 1}`;
}

// ---------------------------------------------------------------------------
// Solo outfit helpers
// ---------------------------------------------------------------------------

export function activeOutfit(state: AppState): SavedOutfit | undefined {
  const r = state.route;
  if (r.view !== "solo-outfit") return undefined;
  return state.outfits.find((o) => o.id === r.outfitId);
}

export function createOutfit(): SavedOutfit {
  const now = new Date().toISOString();
  return {
    id: newId("of"),
    name: "",
    emblem: "chevrons",
    ships: [],
    debtK: STARTING_DEBT_K,
    gamesPlayed: 0,
    gameLog: [],
    perks: [],
    alertLevel: ALERT_START,
    round: 1,
    createdAt: now,
    updatedAt: now,
  };
}

export function updateOutfit(state: AppState, outfitId: string, fn: (o: SavedOutfit) => SavedOutfit): AppState {
  const outfits = state.outfits.map((o) =>
    o.id === outfitId ? { ...fn(o), updatedAt: new Date().toISOString() } : o,
  );
  persistOutfits(outfits);
  return { ...state, outfits };
}

export function nextOutfitShipId(o: SavedOutfit): string {
  let max = 0;
  for (const s of o.ships) {
    const m = /^s(\d+)$/.exec(s.id);
    if (m) max = Math.max(max, Number(m[1]));
  }
  return `s${max + 1}`;
}
