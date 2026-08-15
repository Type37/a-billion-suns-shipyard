import type { Faction, Fleet, GameMode, OutfitShip } from "../src/types.ts";
import { SEED_LISTS } from "./seed-lists.ts";
import { SEED_OUTFITS } from "./seed-outfits.ts";
import { sweepImages } from "./image-store.ts";

// localStorage persistence. One key per concern, JSON payloads, versioned so a
// future format change can migrate instead of clobber.

const LISTS_KEY = "abs2.lists.v1";
const FACTIONS_KEY = "abs2.customFactions.v1";
const OUTFITS_KEY = "abs2.outfits.v1";
const LIST_SEEDS_APPLIED_KEY = "abs2.listSeedsApplied.v1";
const OUTFIT_SEEDS_APPLIED_KEY = "abs2.outfitSeedsApplied.v1";
const SYNC_TOKEN_KEY = "abs2.sync.token.v1";
const SYNC_LASTSYNC_KEY = "abs2.sync.lastSync.v1";
const SYNC_DELETED_KEY = "abs2.sync.deleted.v1";

/** Live table-companion state for a fleet list, persisted with it. */
export interface PlayState {
  round: number;
  /** 0 Command, 1 Jump, 2 Tactical, 3 End. */
  phase: number;
  /** CMD tokens still unspent this round. */
  cmd: number;
  /**
   * How many the round started with, so the token row knows how many pips to
   * draw and which of them are spent. Adjustable, because the pool is not just
   * the faction value: losing the Initiative Check is +1 (core rules, Command
   * Phase), and HVPs hand tokens back and forth. Optional so play states saved
   * before the token row existed still load - read it as `cmdMax ?? cmd`.
   */
  cmdMax?: number;
  vp: number;
  oppVp: number;
  /** Which of the current phase's checklist steps are ticked. Reset every
   * time the phase changes - it is a per-phase walkthrough, not a log. */
  checks?: boolean[];
  /**
   * Hypergrowth requisition tracker, keyed by ship-class id: how many of that
   * class are currently in play and how many sit in Reserves (jumped out). The
   * rest of the class's total are still in the Shipyard (yard = total - play -
   * reserve). Once deployed a ship is struck from the Shipyard for good, so the
   * yard figure only ever falls.
   */
  req?: Record<string, { play: number; reserve: number }>;
  /**
   * Append-only activity log for the Shipyard: every Deploy / Jumped out / Jump
   * in, newest last. Feeds the ledger so you can see the whole history of what
   * you moved in, out and to Reserves, with the Credit cost of each requisition.
   */
  log?: { kind: "deploy" | "jumpout" | "jumpin"; ship: string; cost: number }[];
  /**
   * Fleet-list modes (Armageddon, Age of Unity): where each unit is, keyed by
   * unit id. "The units in your Fleet start the game in Reserve and must be
   * jumped into the combat zone via jump point during the Jump Phase" (core
   * rules, Jump Phase), and a unit can take the Jump Out action to go straight
   * back to Reserves. Those are the only two places a unit can be, and an
   * absent key means Reserve - which is also the correct starting state.
   *
   * Hypergrowth does not use this: its ships move Shipyard -> Reserves -> play
   * by Requisition and are tracked per ship class in `req` above, because a
   * Hypergrowth unit is not formed until the moment you requisition it.
   */
  pos?: Record<string, UnitPosition>;
  /**
   * Fleet-list modes: which units have an Activated token, keyed by unit id.
   * "Activate every unit in that battlegroup... The phase ends once every unit
   * in play has activated" (core rules, Tactical Phase), and the End Phase
   * clears every Activated token. That end condition is the one question the
   * Tactical Phase asks over and over, and it was the one thing on this screen
   * you had to answer by looking at the table and counting.
   *
   * Independent of `pos` rather than folded into it: a unit that takes the Jump
   * Out action has activated AND is in Reserve, which is two facts. Only units
   * in play are counted, so a jumped-out unit correctly leaves both sides of
   * "n of m activated" without its token being a lie.
   *
   * Hypergrowth is excluded for the same reason it gets no HVP carrier picker:
   * `req` is a ledger of ship CLASSES, not units, and a Hypergrowth unit does
   * not exist until you requisition one (p.122). An "activated" flag per class
   * would be marking something the rules do not have.
   */
  acted?: Record<string, boolean>;
  /**
   * The game is over: the End Phase of the last round (Round 4, or Round 3 in
   * Management Training) has been closed out. Play Mode used to roll silently
   * back to that same round's Command Phase forever, which meant the one screen
   * holding both scores never said the game had finished or who had won.
   *
   * Set by Next phase on the final End Phase, cleared by picking any phase (a
   * mis-tap is not the end of a game) and by Reset.
   */
  over?: boolean;
}

/** Where a unit is. Absent from `pos` means "reserve". */
export type UnitPosition = "reserve" | "play";

export interface SavedList {
  id: string;
  mode: GameMode;
  /** Free Play: no faction lock, no rules enforcement, any limit. */
  freePlay: boolean;
  /** Emblem id from the built-in emblem set. */
  emblem: string;
  /** Optional uploaded image, as an image-store reference ("img:..."). Takes
   *  priority over emblem. Resolve with imageSrc() before putting it in an <img>. */
  emblemImage?: string;
  /** Optional icon-library id (see emblems.ts). Used when no upload is set. */
  emblemLib?: string;
  /** Optional tint for a vector (SVG) library mark: ink, blue, or red. */
  emblemColor?: "ink" | "blue" | "red";
  /** Optional background colour behind the emblem (works for any sigil). */
  /** Hypergrowth only: lift the credits cap on the Shipyard. Default false. */
  unlimitedShipyards?: boolean;
  fleet: Fleet;
  play?: PlayState;
  createdAt: string;
  updatedAt: string;
}

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/*
 * A save that did not fit used to be swallowed here, with a comment claiming
 * "the app keeps working in memory". It does - and that is the problem. The
 * write simply did not happen: you carry on editing, everything on screen looks
 * saved, and the work is gone at the next reload with nothing having said so.
 *
 * So a full-storage failure is reported rather than hidden. Anything else
 * (private-mode blocking, a disabled store) still fails quietly, because there
 * is nothing the player can do about those and nothing was going to persist in
 * that session anyway.
 *
 * This is now a backstop rather than a live risk. It was written when uploaded
 * pictures were base64 data URLs sitting in this very string - localStorage is
 * UTF-16, so one 480px emblem could be half a megabyte of a ~5MB budget, and
 * art on nine ship classes reached the ceiling. Pictures live in IndexedDB now
 * (image-store.ts) and what is left here is text, which has never come close.
 */
let onStorageFull: (() => void) | undefined;
export function setStorageFullHook(fn: () => void): void {
  onStorageFull = fn;
}

function isQuotaError(e: unknown): boolean {
  // Firefox uses its own name, and older Safari only sets the legacy code.
  return (
    e instanceof DOMException &&
    (e.name === "QuotaExceededError" || e.name === "NS_ERROR_DOM_QUOTA_REACHED" || e.code === 22)
  );
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    if (isQuotaError(e)) onStorageFull?.();
    // Anything else: blocked or unavailable storage; the session runs in memory.
  }
}

/** Roughly how many bytes this app is holding, for the storage readout. */
export function storageBytes(): number {
  let total = 0;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k?.startsWith("abs2.")) continue;
      // UTF-16: two bytes per code unit, key included.
      total += (k.length + (localStorage.getItem(k)?.length ?? 0)) * 2;
    }
  } catch {
    return 0;
  }
  return total;
}

export function loadLists(): SavedList[] {
  return applyListSeeds(read<SavedList[]>(LISTS_KEY, []));
}

// Fleet Sync (fleet-sync.ts) needs to know whenever the saved-list registry
// changes, from WHATEVER call site changed it, so a debounced push to the
// cloud copy never needs a matching call added by hand at each one. Rather
// than have fleet-sync.ts import this module and this module import it back,
// it registers itself here once at load; storage.ts stays ignorant of what
// sync even is.
let onListsWritten: (() => void) | undefined;
export function setListsWrittenHook(fn: () => void): void {
  onListsWritten = fn;
}

export function persistLists(lists: SavedList[]): void {
  // Training scenarios are filtered on the way OUT, not just on the way back in
  // (see loadTrainingGame below). They were being written to the registry and
  // then discarded at load, which is the same result by a longer road and left
  // every call site having to remember the filter for itself.
  write(LISTS_KEY, lists.filter((l) => !isTrainingMode(l.mode)));
  onListsWritten?.();
  sweepOrphanImages();
}

export function isTrainingMode(mode: GameMode): boolean {
  return mode === "combat-simulator" || mode === "management-training";
}

/*
 * The training game in progress, saved on its own away from the fleet registry.
 *
 * Combat Simulator and Management Training are deliberately not saved fleets:
 * they are pre-built tutorial scenarios, and a browser that had run one used to
 * carry it on the Fleets page for ever, which is why they are filtered out of
 * the registry on both read and write.
 *
 * That is still right, and it had a cost nobody had priced. Those two are the
 * modes a new player is most likely to be running at an actual table on an
 * actual phone - Learn to Play ends by dropping you straight into Play Mode
 * with one - and "not a saved fleet" was being enforced by not saving it at
 * all. Lock the phone, let Safari evict the tab, and the round, the phase, the
 * CMD pool and both scores were gone with no warning that they were never being
 * kept.
 *
 * So exactly one training game is held here, in its own key, and it never joins
 * the registry: it is not loadable from Fleets, it does not sync, and starting
 * another tutorial replaces it. It survives a reload, which is the only thing it
 * ever needed to do.
 */
const TRAINING_GAME_KEY = "abs2.trainingGame.v1";

export function loadTrainingGame(): SavedList | undefined {
  const l = read<SavedList | null>(TRAINING_GAME_KEY, null);
  if (!l || !isTrainingMode(l.mode)) return undefined;
  return l;
}

export function persistTrainingGame(list: SavedList | undefined): void {
  if (!list) {
    try {
      localStorage.removeItem(TRAINING_GAME_KEY);
    } catch {
      /* blocked or unavailable storage; nothing was going to persist anyway */
    }
    return;
  }
  write(TRAINING_GAME_KEY, list);
}
/*
 * Drop stored pictures nothing points at any more.
 *
 * Pictures live in IndexedDB (image-store.ts) and the saved state keeps only a
 * reference to each, so deleting a fleet or clearing a ship class's art no
 * longer deletes the bytes with it. This runs after every save and asks the
 * question from the whole of what is saved, rather than trying to catch each
 * removal at its own call site: there are a dozen of those, they are ordinary
 * state edits that know nothing about images, and missing one would leak
 * silently for ever.
 *
 * Reading all three registries on each save is cheap - they are already parsed
 * objects in memory - and being wrong in the safe direction matters more than
 * being quick: a picture still referenced must never be swept, so every holder
 * of an image reference has to be listed here. There are four.
 */
function sweepOrphanImages(): void {
  const inUse = new Set<string>();
  const keep = (v: string | undefined): void => {
    if (v) inUse.add(v);
  };
  for (const l of read<SavedList[]>(LISTS_KEY, [])) keep(l.emblemImage);
  for (const o of read<SavedOutfit[]>(OUTFITS_KEY, [])) keep(o.emblemImage);
  for (const f of read<Faction[]>(FACTIONS_KEY, [])) {
    keep(f.emblemImage);
    for (const s of f.ships ?? []) keep(s.image);
  }
  void sweepImages(inUse);
}


// Seed fleets ship as ready-made starter lists (see seed-lists.ts), one per
// browser, same rule as applySeeds below: added at most once, tracked by id
// so a deleted seed never reappears on the next visit.
function applyListSeeds(stored: SavedList[]): SavedList[] {
  const applied = new Set(read<string[]>(LIST_SEEDS_APPLIED_KEY, []));
  const additions = SEED_LISTS.filter((seed) => !applied.has(seed.id) && !stored.some((l) => l.id === seed.id));
  if (additions.length === 0) return stored;

  const merged = [...stored, ...additions];
  write(LISTS_KEY, merged);
  for (const seed of SEED_LISTS) applied.add(seed.id);
  write(LIST_SEEDS_APPLIED_KEY, [...applied]);
  return merged;
}

export function loadCustomFactions(): Faction[] {
  const stored = read<Faction[]>(FACTIONS_KEY, []);
  // One-time cleanup: the Covenant prototype ("cf-covenant") used to be seeded
  // into every browser (see git history for seed-factions.ts, now removed).
  // Anyone who already had it seeded still has it sitting in this list even
  // though nothing writes it anymore - strip it and persist the cut so it
  // does not come back next load.
  if (stored.some((f) => f.id === "cf-covenant")) {
    const cleaned = stored.filter((f) => f.id !== "cf-covenant");
    write(FACTIONS_KEY, cleaned);
    return cleaned;
  }
  return stored;
}

export function persistCustomFactions(factions: Faction[]): void {
  write(FACTIONS_KEY, factions);
  sweepOrphanImages();
}

// --- Junkspace solo outfits -------------------------------------------------

export interface OutfitGameLog {
  game: number;
  earnedK: number;
  /** ISO date the game was played. Absent on entries logged before it existed. */
  date?: string;
  /** What happened. A campaign is a story and the log was three numbers. */
  note?: string;
}

/** A saved solo Junkspace outfit: the ships plus its debt campaign and the
 *  live state of the game in progress. */
export interface SavedOutfit {
  id: string;
  name: string;
  emblem: string;
  emblemImage?: string;
  emblemLib?: string;
  emblemColor?: "ink" | "blue" | "red";
  ships: OutfitShip[];
  /** Remaining Debt in ¢k. Clearing it wins the campaign. */
  debtK: number;
  /**
   * The two dials of the campaign, set once when the outfit is created.
   *
   * p.201 gives the standard game (¢30k over 8 games) and then, in a NOTE box,
   * the harder one: "try to clear your debt in 6 games or increase your debt to
   * ¢45k". Two separate levers, and the book says "or" - you can pull either or
   * both. They were constants, so every campaign was the standard one.
   *
   * Optional, because outfits created before this exist and are all standard;
   * everything that reads them falls back to 30 and 8.
   */
  debtStartK?: number;
  gamesLimit?: number;
  gamesPlayed: number;
  gameLog: OutfitGameLog[];
  /** Campaign notes. The one place to write down what the Junkspace did to you. */
  notes?: string;
  /** Freeform perk tracking: which perk each pilot has taken. */
  perks: { shipId: string; perk: string }[];
  /** Live game tracking. */
  alertLevel: number;
  round: number;
  /**
   * The eight Blip markers, in the order they were shuffled into (p.197).
   *
   * `n` is the number printed on the marker's face, which the player is not
   * supposed to know until it is revealed - the app holds it because it IS the
   * bag of markers, and the whole point of shuffling facedown is that the
   * number is decided before you get near it.
   */
  blips?: { n: number; revealed: boolean }[];
  createdAt: string;
  updatedAt: string;
}

// Pre-built outfits ship as ready-made crews (see seed-outfits.ts), same rule
// as the fleet seeds above: added at most once per browser, tracked by id so a
// deleted one never reappears on the next visit.
function applyOutfitSeeds(stored: SavedOutfit[]): SavedOutfit[] {
  const applied = new Set(read<string[]>(OUTFIT_SEEDS_APPLIED_KEY, []));
  const additions = SEED_OUTFITS.filter((seed) => !applied.has(seed.id) && !stored.some((o) => o.id === seed.id));
  if (additions.length === 0) return stored;

  const merged = [...stored, ...additions];
  write(OUTFITS_KEY, merged);
  for (const seed of SEED_OUTFITS) applied.add(seed.id);
  write(OUTFIT_SEEDS_APPLIED_KEY, [...applied]);
  return merged;
}

export function loadOutfits(): SavedOutfit[] {
  return applyOutfitSeeds(read<SavedOutfit[]>(OUTFITS_KEY, []));
}

export function persistOutfits(outfits: SavedOutfit[]): void {
  write(OUTFITS_KEY, outfits);
  sweepOrphanImages();
}

export function newId(prefix: string): string {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

// --- Fleet Sync (cross-device) ----------------------------------------------
// Just the local bookkeeping a sync engine needs: which token (if any) this
// device has joined, when it last synced, and a tombstone per list deleted
// locally so a later pull never resurrects it. The engine itself, and why it
// looks like this, is in fleet-sync.ts.

export function loadSyncToken(): string | null {
  return read<string | null>(SYNC_TOKEN_KEY, null);
}

export function persistSyncToken(token: string | null): void {
  if (token) write(SYNC_TOKEN_KEY, token);
  else localStorage.removeItem(SYNC_TOKEN_KEY);
}

export function loadSyncLastSync(): number | null {
  return read<number | null>(SYNC_LASTSYNC_KEY, null);
}

export function persistSyncLastSync(ms: number): void {
  write(SYNC_LASTSYNC_KEY, ms);
}

/** Fleet id -> when it was deleted (epoch ms). */
export function loadSyncDeleted(): Record<string, number> {
  return read<Record<string, number>>(SYNC_DELETED_KEY, {});
}

export function persistSyncDeleted(map: Record<string, number>): void {
  write(SYNC_DELETED_KEY, map);
}

// --- First-run onboarding ---------------------------------------------------

const ONBOARDING_KEY = "abs2.onboarding.v1";

export interface Onboarding {
  /** How many times the app has been opened. */
  visits: number;
  /** True once the tutorial suggestion has been dismissed or acted on. */
  tutorialsDismissed: boolean;
  /**
   * True once the visit-5 examples coachmark has been answered either way, so
   * it is never shown twice. Whether the examples are actually IN this browser
   * is a separate thing and lives in Settings.exampleFactions - closing the
   * coachmark declines them now, and Options is where you change your mind.
   */
  examplesDismissed: boolean;
  /** Ids of first-visit coachmark tours the user has finished or closed. */
  toursSeen: string[];
}

export function loadOnboarding(): Onboarding {
  const o = read<Partial<Onboarding>>(ONBOARDING_KEY, {});
  return {
    visits: o.visits ?? 0,
    tutorialsDismissed: o.tutorialsDismissed ?? false,
    examplesDismissed: o.examplesDismissed ?? false,
    toursSeen: Array.isArray(o.toursSeen) ? o.toursSeen : [],
  };
}

// --- Display / content settings (the Options dialog) ------------------------

const SETTINGS_KEY = "abs2.settings.v1";

export interface Settings {
  /**
   * Whether the three worked-example custom factions are in this browser.
   * OFF by default - nothing arrives unasked. The visit-5 coachmark turns it
   * on if you take it, and this is the switch for turning them on later or
   * getting rid of them again.
   */
  exampleFactions: boolean;
  // `discCrop` used to live here: emblem art cropped to a circle, on by
  // default, off for the handful of marks drawn as squares. It is unconditional
  // now (see .emblem-img in style.css), so the setting is gone. A stored value
  // from an older build is simply ignored - nothing reads it, and dropping it
  // needs no migration.
}

const DEFAULT_SETTINGS: Settings = { exampleFactions: false };

export function loadSettings(): Settings {
  const s = read<Partial<Settings>>(SETTINGS_KEY, {});
  return {
    exampleFactions: s.exampleFactions ?? DEFAULT_SETTINGS.exampleFactions,
  };
}

export function persistSettings(s: Settings): void {
  write(SETTINGS_KEY, s);
}

const PRINT_KEY = "abs2.print.v1";

/** Print setup is remembered, so reprinting after an edit is one click. */
export function loadPrintOpts<T>(fallback: T): T {
  const p = read<Partial<T>>(PRINT_KEY, {});
  return { ...fallback, ...p };
}

export function persistPrintOpts(o: unknown): void {
  write(PRINT_KEY, o);
}

export function persistOnboarding(o: Onboarding): void {
  write(ONBOARDING_KEY, o);
}

// --- Whole-app data export / import / clear (the Options dialog) -------------
// Everything the app stores lives under the "abs2." prefix, so a backup is just
// every such key, and a restore or wipe is the same set. Robust to new keys.

function absKeys(): string[] {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith("abs2.")) keys.push(k);
  }
  return keys;
}

/** A JSON snapshot of every saved fleet, outfit, custom faction, and setting. */
export function exportAllData(): string {
  const data: Record<string, unknown> = {};
  for (const k of absKeys()) {
    const raw = localStorage.getItem(k);
    if (raw == null) continue;
    try {
      data[k] = JSON.parse(raw);
    } catch {
      data[k] = raw;
    }
  }
  return JSON.stringify({ app: "abs-v2-builder", version: 1, exportedAt: new Date().toISOString(), data }, null, 2);
}

/** Restore a snapshot produced by exportAllData. Returns false if unrecognised. */
export function importAllData(json: string): boolean {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return false;
  }
  const data = (parsed as { data?: unknown } | null)?.data;
  if (!data || typeof data !== "object") return false;
  for (const [k, v] of Object.entries(data as Record<string, unknown>)) {
    if (k.startsWith("abs2.")) write(k, v);
  }
  return true;
}

/** Remove every saved fleet, outfit, custom faction, and setting. */
export function clearAllData(): void {
  for (const k of absKeys()) localStorage.removeItem(k);
}
