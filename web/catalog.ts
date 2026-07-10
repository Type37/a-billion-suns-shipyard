import type { Era, Faction, Hvp } from "../src/types.ts";
import type { Catalog } from "../src/data/index.ts";
import { GENERIC_HVP } from "../src/data/index.ts";
import { TRAINING_FLEET } from "../src/data/training-fleet.ts";

// The web catalog discovers every faction data file at build time, so newly
// transcribed factions appear in the app the moment their file exists. Custom
// factions from the Foundry are merged on top at runtime.

const modules = import.meta.glob("../src/data/factions/*.ts", { eager: true }) as Record<
  string,
  Record<string, unknown>
>;

function looksLikeFaction(v: unknown): v is Faction {
  return (
    typeof v === "object" &&
    v !== null &&
    typeof (v as Faction).id === "string" &&
    typeof (v as Faction).name === "string" &&
    Array.isArray((v as Faction).ships) &&
    Array.isArray((v as Faction).hvp)
  );
}

const discovered: Faction[] = [];
for (const mod of Object.values(modules)) {
  for (const value of Object.values(mod)) {
    if (looksLikeFaction(value)) discovered.push(value);
  }
}

export const ERA_ORDER: Era[] = ["Hypergrowth", "Age of Unity", "Armageddon"];

// Book order within each era (rules p.142-172). Unknown ids sort after, alphabetically.
const BOOK_ORDER = [
  "heavy-industries",
  "megamart",
  "news-inc",
  "galactic-credit",
  "the-unity",
  "the-ordinate",
  "the-discord",
  "golem-mega-systems",
  "vyke",
  "aegis",
  "gen-omega",
  "alliance",
];

function bookRank(id: string): number {
  const i = BOOK_ORDER.indexOf(id);
  return i === -1 ? BOOK_ORDER.length : i;
}

export const BUILT_IN_FACTIONS: Faction[] = discovered.sort(
  (a, b) => bookRank(a.id) - bookRank(b.id) || a.name.localeCompare(b.name),
);

// Seed factions that ship as ready-made test content (see seed-factions.ts)
// but shouldn't clutter every faction picker. Hidden from selection, browsing,
// and cloning - but still resolvable by id, so a fleet someone already built
// with one keeps working, and it stays visible/manageable in the Foundry list
// (which reads state.customFactions directly, not this function).
const HIDDEN_FACTION_IDS = new Set<string>(["cf-covenant"]);

export function allFactions(customs: Faction[]): Faction[] {
  return [...BUILT_IN_FACTIONS, ...customs].filter((f) => !HIDDEN_FACTION_IDS.has(f.id));
}

function allFactionsUnfiltered(customs: Faction[]): Faction[] {
  return [...BUILT_IN_FACTIONS, ...customs];
}

export function factionsByEra(customs: Faction[]): Map<Era, Faction[]> {
  const map = new Map<Era, Faction[]>();
  for (const era of ERA_ORDER) map.set(era, []);
  for (const f of allFactions(customs)) {
    const list = map.get(f.era) ?? [];
    list.push(f);
    map.set(f.era, list);
  }
  return map;
}

export function findFaction(id: string, customs: Faction[]): Faction | undefined {
  // The Training Fleet resolves for Basic Training lists but stays out of the
  // faction pickers: it is a tutorial roster, not a faction you choose.
  if (id === TRAINING_FLEET.id) return TRAINING_FLEET;
  // Unfiltered: a fleet already built with a hidden faction must keep resolving.
  return allFactionsUnfiltered(customs).find((f) => f.id === id);
}

export function makeCatalog(customs: Faction[]): Catalog {
  return {
    getFaction: (id: string) => findFaction(id, customs),
    genericHvp: GENERIC_HVP as Hvp[],
  };
}

export function isCustom(id: string, customs: Faction[]): boolean {
  return customs.some((f) => f.id === id);
}
