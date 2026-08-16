import type { Era, Faction, Fleet, GameMode } from "../src/types.ts";
import { STARTING_DEBT_K, ALERT_START } from "../src/data/junkspace.ts";
import {
  loadCustomFactions,
  loadSettings,
  loadLists,
  loadOnboarding,
  loadPrintOpts,
  loadOutfits,
  loadTrainingGame,
  isTrainingMode,
  newId,
  persistCustomFactions,
  persistLists,
  persistOnboarding,
  persistOutfits,
  persistTrainingGame,
} from "./storage.ts";
import type { Onboarding, SavedList, SavedOutfit, Settings } from "./storage.ts";

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
  | { view: "fleets" }
  | { view: "builder"; listId: string }
  | { view: "print"; listId: string }
  | { view: "print-outfit"; outfitId: string }
  | { view: "foundry"; factionId?: string }
  | { view: "solo" }
  | { view: "solo-outfit"; outfitId: string }
  | { view: "ships" }
  | { view: "play"; listId: string }
  | { view: "learn"; tab?: string }
  | { view: "rules"; tab?: string; sub?: string }
  | { view: "learn-classic"; step: number; anchor?: string };

// Kept as a literal rather than derived from ROUND_PHASES: the router must not
// depend on the rules data, and these four strings are URL surface now, so they
// should only ever change deliberately.
const PHASE_SLUGS = ["command", "jump", "tactical", "end"] as const;
const phaseSlugFor = (i: number): string => PHASE_SLUGS[i] ?? "command";
/** 0 Mission, 1 Your fleet, 2 The table, 3 The round. Battle is an action, not a page. */
const LEARN_LAST_STEP = 3;

/**
 * Two separate places, not one with six tabs.
 *
 * `#/learn` is the front of the game - which era you are playing and what you
 * need on the table. `#/rules` is the round, phase by phase. They were one
 * route and they should not have been: the first is read once while you are
 * deciding whether to play, the second is opened mid-game to settle an
 * argument, and a shared link should say which of those two things it is.
 *
 * Named segments, not numbers, which is also what keeps the archived
 * walkthrough alive under the same root: `#/learn/prepare` is a word and
 * `#/learn/3` is a digit, so the router can tell them apart with no ambiguity.
 * A phase name under `#/learn` is forwarded to `#/rules`, because those links
 * were live for a while.
 */
const LEARN_TAB_IDS = ["eras", "prepare"] as const;
const RULES_TAB_IDS = ["command", "jump", "tactical", "end"] as const;
/**
 * The Tactical Phase is four pages, not one - one per step of an activation.
 *
 * It is longer than the other three phases put together and reading it meant
 * scrolling past three things to reach the fourth, so a third path segment
 * splits it: #/rules/tactical/passive is the one you open mid-game to settle an
 * argument about duds.
 *
 * There WAS a fifth, "shoot", holding the whole Combat chapter. It is folded
 * into passive now. Combat is not a step of an activation - it is what happens
 * inside two of them - and giving it a stop on a rail that otherwise reads
 * select, move, passive, act made it look like a fifth thing you do in order.
 * The Passive Attacks Step is where the round first resolves an attack, so it
 * is where the attack sequence belongs. Old #/rules/tactical/shoot links land
 * on the first page of the Tactical Phase rather than 404ing, since `sub` falls
 * back when it does not match.
 */
const TACTICAL_SUB_IDS = ["select", "move", "passive", "action"] as const;

export function parseRoute(hash: string): Route {
  const h = hash.replace(/^#/, "");
  const parts = h.split("/").filter(Boolean);
  if (parts[0] === "fleets") return { view: "fleets" };
  if (parts[0] === "list" && parts[1]) return { view: "builder", listId: parts[1] };
  if (parts[0] === "print-outfit" && parts[1]) return { view: "print-outfit", outfitId: parts[1] };
  if (parts[0] === "print" && parts[1]) return { view: "print", listId: parts[1] };
  if (parts[0] === "foundry") return parts[1] ? { view: "foundry", factionId: parts[1] } : { view: "foundry" };
  if (parts[0] === "solo") return parts[1] ? { view: "solo-outfit", outfitId: parts[1] } : { view: "solo" };
  if (parts[0] === "ships") return { view: "ships" };
  if (parts[0] === "play" && parts[1]) return { view: "play", listId: parts[1] };
  if (parts[0] === "rules") {
    const tab = RULES_TAB_IDS.find((t) => t === parts[1]);
    if (!tab) return { view: "rules" };
    // Only the Tactical Phase has sub-pages; a third segment anywhere else is
    // ignored rather than 404ing.
    const sub = tab === "tactical" ? TACTICAL_SUB_IDS.find((x) => x === parts[2]) : undefined;
    return sub ? { view: "rules", tab, sub } : { view: "rules", tab };
  }
  if (parts[0] === "learn" && !/^\d+$/.test(parts[1] ?? "")) {
    // An unknown tab name lands on the first page of Learn to Play rather than
    // 404ing. A phase name is forwarded to its page under #/rules, where the
    // phases moved to.
    const tab = LEARN_TAB_IDS.find((t) => t === parts[1]);
    if (tab) return { view: "learn", tab };
    const moved = RULES_TAB_IDS.find((t) => t === parts[1]);
    if (moved) return { view: "rules", tab: moved };
    return { view: "learn" };
  }
  if (parts[0] === "learn" || parts[0] === "learn-classic") {
    // The archived five-page walkthrough. Unlinked from the app since the
    // rewrite, but every URL anyone ever shared still resolves - including the
    // numbered `#/learn/3/tactical` form, which is why a numeric first segment
    // under `learn` falls through to here.
    //
    // 0 Mission, 1 Fleet, 2 Table, 3 Round, 4 Launch. The four phases are
    // accordions inside step 3, addressed as #/learn-classic/3/command and so on.
    let step = parts[1] ? Math.max(0, parseInt(parts[1], 10) || 0) : 0;
    // Legacy links from when each phase was its own page: 4-7 were Command,
    // Jump, Tactical and End, and 8 was the launch screen.
    //
    // 5-7 are past the end of the new walkthrough, so they can be redirected to
    // their phase accordion with nothing to lose. 4 cannot: it is a live step in
    // the new numbering (Battle), and a live route beats a dead one, so an old
    // link to the Command Phase lands on Battle instead. That is the least bad
    // of the two, and Command is the accordion that opens by default anyway.
    let anchor = parts[2];
    if (step >= 5 && step <= 7) {
      anchor = phaseSlugFor(step - 4);
      step = 3;
    }
    step = Math.min(LEARN_LAST_STEP, step);
    return anchor ? { view: "learn-classic", step, anchor } : { view: "learn-classic", step };
  }
  return { view: "home" };
}

export function routeHash(route: Route): string {
  switch (route.view) {
    case "home":
      return "#/";
    case "fleets":
      return "#/fleets";
    case "builder":
      return `#/list/${route.listId}`;
    case "print":
      return `#/print/${route.listId}`;
    case "print-outfit":
      return `#/print-outfit/${route.outfitId}`;
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
    case "learn":
      return route.tab ? `#/learn/${route.tab}` : "#/learn";
    case "rules":
      if (!route.tab) return "#/rules";
      return route.sub ? `#/rules/${route.tab}/${route.sub}` : `#/rules/${route.tab}`;
    case "learn-classic": {
      if (route.anchor) return `#/learn-classic/${route.step}/${route.anchor}`;
      return route.step > 0 ? `#/learn-classic/${route.step}` : "#/learn-classic";
    }
  }
}

export interface ShipFilter {
  era: string;
  faction: string;
  mass: string;
  q: string;
  sort: string;
  /** Whether custom-faction ships are included. Off by default. */
  showCustom?: boolean;
}

export type SoloTab = "outfit" | "play" | "campaign" | "reference";


// ---------------------------------------------------------------------------
// App state
// ---------------------------------------------------------------------------

/** Print setup options. Persisted (abs2.print.v1) so reprinting is one click. */
export interface PrintOpts {
  format: "roster" | "cards" | "guide";
  /**
   * Damage trackers: a row of HP boxes per ship. Off by default - most sheets
   * are printed to build from and to read at the table, and a fleet's worth of
   * hull boxes is a lot of ink for something only some players cross off.
   */
  trackers: boolean;
  /**
   * Jump trackers: a box per ship for "Jumped in", plus "In reserve" in
   * Hypergrowth, where a Shipyard's ships sit out of play until they are
   * requisitioned. Separate from damage, because they answer a different
   * question - where is this unit, not how hurt is it.
   */
  jumpTrackers: boolean;
  rules: boolean;
  /**
   * Print every HVP available to you, not just the ones you chose.
   *
   * Only offered where the rules defer the choice: Hypergrowth (p.123 step 4)
   * and Age of Unity (p.92 step 5) both have you select AFTER the missions are
   * rolled, so the sheet you carry to the table is the menu you pick from. The
   * ones you have already chosen still print marked, because burying your three
   * in nine you did not take is the reason the old always-print-everything
   * behaviour was removed.
   */
  allHvp: boolean;
  /**
   * The two halves of the reference section, each on its own. They used to ride
   * `rules` with the faction block, so wanting your faction's rule on the sheet
   * meant taking four pages of core reference with it, and wanting the reference
   * meant taking the faction block. Both default on: the sheet has always
   * printed them, and a default that drops content is a default that loses work.
   */
  actions: boolean;
  commands: boolean;
  /**
   * The table at the foot of the sheet: credits or victory points per round,
   * the opponent, and a notes line. Default on - it has always printed, and a
   * default that drops content is a default that loses work - but it is the one
   * block on the sheet that is a scorepad rather than a record of your fleet,
   * and a player who keeps score somewhere else was stuck with it.
   */
  score: boolean;
  /** Paper the preview is laid out at, and what the page count is based on. */
  paper: "letter" | "a4";
  /** No coloured fills or bars: survives "Background graphics: off" and saves toner. */
  inkSaver: boolean;
  /** Unit ids left out of this printout. */
  excluded: string[];
}

export const DEFAULT_PRINT: PrintOpts = {
  format: "roster",
  trackers: false,
  jumpTrackers: false,
  rules: true,
  allHvp: false,
  actions: true,
  commands: true,
  score: true,
  paper: "letter",
  inkSaver: false,
  excluded: [],
};

/** Printable page geometry in CSS px at 96dpi, inside the @page 14mm margin. */
export const PAPER: Record<"letter" | "a4", { w: number; h: number; label: string }> = {
  letter: { w: 710, h: 950, label: "Letter" },
  a4: { w: 688, h: 1017, label: "A4" },
};

export interface AppState {
  route: Route;
  lists: SavedList[];
  customFactions: Faction[];
  outfits: SavedOutfit[];
  onboarding: Onboarding;
  /** Display and content switches from the Options dialog (abs2.settings.v1). */
  settings: Settings;
  /** Monotonic counter for generating unit instance ids within the active list. */
  nextUnitSeq: number;
  /** Transient UI state, never persisted. */
  ui: {
    /** Toast message shown briefly after copy actions. */
    toast?: string;
    /**
     * Optional glyph for the current toast, and a flag for the loud variant.
     * Confirmations you asked for ("added", "duplicated") get the loud one;
     * incidental notices stay quiet. Both are the same element, so only one
     * toast is ever on screen.
     */
    toastIcon?: string;
    toastLoud?: boolean;
    /** Faction picker: show every era, not just the list's era. */
    showAllFactions: boolean;
    /** Active tab within a solo outfit workspace. */
    soloTab?: SoloTab;
    /** Which Hostile-behaviour routine is open, if any. One at a time. */
    soloDef?: string;
    /** Result of the most recent solo dice roll, shown in the roller. */
    /** Filters on the ship compendium. */
    shipFilter?: ShipFilter;
    /** The new-fleet panel is open on the Fleets page. */
    showCreate?: boolean;
    /** Builder credits popover: the Custom amount field is revealed. */
    limitCustomOpen?: boolean;
    /** An open modal dialog. */
    modal?:
      | { kind: "new-fleet"; era: Era; limit: number; factionId?: string; showAll: boolean; customOpen?: boolean; noLimit?: boolean }
      | { kind: "add-unit" }
      | { kind: "ship-reference" }
      | {
          kind: "emblem";
          /** "new-outfit" is the outfit being started in the dialog, which does
           *  not exist in `outfits` yet - it writes into ui.newOutfit instead. */
          target: "list" | "faction" | "outfit" | "new-outfit";
          tab: "library" | "upload" | "colour";
          libQuery?: string;
          /**
           * How many library tiles are currently rendered. The library holds 250+
           * marks; building and laying out all of them at once took about a
           * second and left every image unloaded, because with the whole grid
           * off-screen `loading="lazy"` correctly declines to fetch any of it -
           * so the picker opened slowly onto an empty grid. Tiles are added a
           * page at a time as you scroll instead. Nothing is hidden; scrolling
           * reaches all of it.
           */
          libShown?: number;
        }
      | { kind: "options" }
      /**
       * Fleet Sync (fleet-sync.ts). `pendingJoin` holds a token the user is
       * about to adopt, once its remote/local counts have come back from
       * `preview()`, so the dialog can show "combine 6 + 3 fleets?" before
       * anything is written - it is NOT set for the plain off/on panel.
       */
      | {
          kind: "sync";
          pendingJoin?: { token: string; remoteCount: number; localCount: number; exists: boolean };
        }
      /**
       * A destructive action waiting on a yes. `intent` is the click that was
       * intercepted - its action name and data-* payload - so confirming can
       * replay it rather than duplicating what it does. See needsConfirm.
       */
      | {
          kind: "confirm";
          title: string;
          body: string;
          confirmLabel: string;
          danger?: boolean;
          intent: { action: string; data: Record<string, string> };
        }
      /** The new-outfit dialog is showing. Its answers live in ui.newOutfit,
       *  not here - see the note there. */
      | { kind: "new-outfit" };
    /**
     * The outfit being started, held until you press Start so the outfit is
     * only written once.
     *
     * This is deliberately NOT on ui.modal. It used to be, and that is why the
     * dialog offered ten marks and a "Surprise me" instead of the real emblem
     * picker: opening the picker sets ui.modal, which would have thrown the
     * half-filled dialog away. Kept beside the modal rather than inside it, the
     * picker can open over the dialog and hand back to it - so the dialog gets
     * the whole library, and the strip is gone.
     *
     * The emblem fields mirror SavedOutfit's, so the shared picker writes into
     * this the same way it writes into a saved outfit.
     */
    newOutfit?: {
      name?: string;
      emblem: string;
      emblemImage?: string;
      emblemLib?: string;
      emblemColor?: "ink" | "blue" | "red";
      /** The two campaign dials, chosen before the outfit exists (p.201). */
      debtStartK?: number;
      gamesLimit?: number;
    };
    /**
     * An image waiting to be cropped, and where it is going once it is.
     *
     * Every upload lands here first now. The app used to centre-crop whatever
     * it was given and store the result, which is right about half the time and
     * silently wrong the rest: a logo with its mark off to one side, a photo of
     * a hull that is mostly sky. Nothing about the destination is decided here
     * beyond the frame - `action` and `ship` are the same values the file input
     * carried, replayed against applyImageUpload once you press Use.
     *
     * `src` is the file at full size, untouched. The downscale happens on the
     * way OUT of the cropper, from the region you chose.
     */
    crop?: {
      src: string;
      /** The upload action to replay: "emblem-upload", "cf-ship-image-upload"... */
      action: string;
      /** Ship index, for per-ship art. */
      ship?: string;
      /** Output size in px. Square for emblems, 5:3 for ship art. */
      outW: number;
      outH: number;
      /** Draw the crop box as a circle: emblems are always shown in one. */
      round: boolean;
    };
    /** In-progress first-visit coachmark tour, once the user has advanced past step 0. */
    tour?: { tourId: string; step: number };
    /** Print-setup options. Persisted (abs2.print.v1) so reprinting after an
     * edit is one click. `rules` prints the faction rule + commands reference;
     * on by default so a first-time printer gets it. */
    print?: PrintOpts;
    /** Ship-classes catalog view: undefined is the flat list, "chart" is a
     * bar-chart stat comparison. */
    catalogView?: "chart";
    /** Which stat the chart view is currently comparing. */
    catalogChartStat?: "cost" | "mass" | "thrust" | "silhouette" | "shields";
  };
}

export const EMPTY_SHIP_FILTER: ShipFilter = { era: "", faction: "", mass: "", q: "", sort: "faction" };

export function initialState(): AppState {
  // Count this visit so the first-run tutorial suggestion can retire itself.
  const onboarding = loadOnboarding();
  onboarding.visits += 1;
  persistOnboarding(onboarding);
  // A training scenario is not a saved fleet, so it never comes back from the
  // registry - but the ONE that has a game running comes back from its own key,
  // because a tutorial being played at a table is exactly the thing a locked
  // phone or an evicted tab used to throw away. See persistTrainingGame.
  const training = loadTrainingGame();
  return {
    route: parseRoute(location.hash),
    lists: [...loadLists().filter((l) => !isTrainingMode(l.mode)), ...(training ? [training] : [])],
    customFactions: loadCustomFactions(),
    outfits: loadOutfits(),
    settings: loadSettings(),
    onboarding,
    nextUnitSeq: 1,
    ui: { showAllFactions: false, soloTab: "outfit", print: loadPrintOpts(DEFAULT_PRINT) },
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
  // No `pos`: every unit starts in Reserve, and an absent key already reads as
  // Reserve, so a fresh game needs no seeding.
  return { round: 1, phase: 0, cmd, cmdMax: cmd, vp: 0, oppVp: 0 };
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
  // persistLists keeps training scenarios out of the registry, so the one with
  // a game in it is saved here instead - every Play Mode action lands in this
  // function, which makes it the one place that has to remember.
  const edited = lists.find((l) => l.id === listId);
  if (edited && isTrainingMode(edited.mode)) persistTrainingGame(edited);
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
