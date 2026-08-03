import type { Faction, Fleet, GameMode, OutfitShip } from "../src/types.ts";
import { SEED_LISTS } from "./seed-lists.ts";

// localStorage persistence. One key per concern, JSON payloads, versioned so a
// future format change can migrate instead of clobber.

const LISTS_KEY = "abs2.lists.v1";
const FACTIONS_KEY = "abs2.customFactions.v1";
const OUTFITS_KEY = "abs2.outfits.v1";
const LIST_SEEDS_APPLIED_KEY = "abs2.listSeedsApplied.v1";
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
  /** Optional uploaded image (downscaled data URL). Takes priority over emblem. */
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

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or blocked: the app keeps working in memory.
  }
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
  write(LISTS_KEY, lists);
  onListsWritten?.();
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
}

// --- Junkspace solo outfits -------------------------------------------------

export interface OutfitGameLog {
  game: number;
  earnedK: number;
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
  /** Remaining Debt in ¢k. Starts at 30; clearing it wins the campaign. */
  debtK: number;
  gamesPlayed: number;
  gameLog: OutfitGameLog[];
  /** Freeform perk tracking: which perk each pilot has taken. */
  perks: { shipId: string; perk: string }[];
  /** Live game tracking. */
  alertLevel: number;
  round: number;
  createdAt: string;
  updatedAt: string;
}

export function loadOutfits(): SavedOutfit[] {
  return read<SavedOutfit[]>(OUTFITS_KEY, []);
}

export function persistOutfits(outfits: SavedOutfit[]): void {
  write(OUTFITS_KEY, outfits);
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
  /**
   * Crop emblem artwork to a circle. ON by default.
   *
   * Most of the library is circular badge art painted onto a square canvas,
   * where the corners are flat colour around the mark and the disc removes
   * exactly those and nothing else. It is wrong for the minority drawn AS
   * squares, and no rule can tell the two apart from the pixels, so it is a
   * switch rather than a guess.
   */
  discCrop: boolean;
}

const DEFAULT_SETTINGS: Settings = { exampleFactions: false, discCrop: true };

export function loadSettings(): Settings {
  const s = read<Partial<Settings>>(SETTINGS_KEY, {});
  return {
    exampleFactions: s.exampleFactions ?? DEFAULT_SETTINGS.exampleFactions,
    discCrop: s.discCrop ?? DEFAULT_SETTINGS.discCrop,
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
