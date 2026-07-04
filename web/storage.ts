import type { Faction, Fleet, GameMode, OutfitShip } from "../src/types.ts";

// localStorage persistence. One key per concern, JSON payloads, versioned so a
// future format change can migrate instead of clobber.

const LISTS_KEY = "abs2.lists.v1";
const FACTIONS_KEY = "abs2.customFactions.v1";
const OUTFITS_KEY = "abs2.outfits.v1";

/** Live table-companion state for a fleet list, persisted with it. */
export interface PlayState {
  round: number;
  /** 0 Command, 1 Jump, 2 Tactical, 3 End. */
  phase: number;
  cmd: number;
  vp: number;
  oppVp: number;
}

export interface SavedList {
  id: string;
  mode: GameMode;
  /** Free Play: no faction lock, no rules enforcement, any limit. */
  freePlay: boolean;
  /** Emblem id from the built-in emblem set. */
  emblem: string;
  /** Optional uploaded image (downscaled data URL). Takes priority over emblem. */
  emblemImage?: string;
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
  return read<SavedList[]>(LISTS_KEY, []);
}

export function persistLists(lists: SavedList[]): void {
  write(LISTS_KEY, lists);
}

export function loadCustomFactions(): Faction[] {
  return read<Faction[]>(FACTIONS_KEY, []);
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
