import type { Faction, Hvp, ShipClass } from "../types.ts";
import { GENERIC_HVP } from "./generic-hvp.ts";
import { VYKE } from "./factions/vyke.ts";
import { AEGIS } from "./factions/aegis.ts";
import { GEN_OMEGA } from "./factions/gen-omega.ts";
import { ALLIANCE } from "./factions/alliance.ts";
import { THE_UNITY } from "./factions/the-unity.ts";
import { THE_ORDINATE } from "./factions/the-ordinate.ts";
import { THE_DISCORD } from "./factions/the-discord.ts";
import { GOLEM_MEGA_SYSTEMS } from "./factions/golem-mega-systems.ts";
import { HEAVY_INDUSTRIES } from "./factions/heavy-industries.ts";
import { MEGAMART } from "./factions/megamart.ts";
import { NEWS_INC } from "./factions/news-inc.ts";
import { GALACTIC_CREDIT } from "./factions/galactic-credit.ts";

export { GENERIC_HVP };

/** All Armageddon-era factions (Phase 1). */
export const ARMAGEDDON_FACTIONS: Faction[] = [VYKE, AEGIS, GEN_OMEGA, ALLIANCE];

export const AGE_OF_UNITY_FACTIONS: Faction[] = [THE_UNITY, THE_ORDINATE, THE_DISCORD, GOLEM_MEGA_SYSTEMS];

export const HYPERGROWTH_FACTIONS: Faction[] = [HEAVY_INDUSTRIES, MEGAMART, NEWS_INC, GALACTIC_CREDIT];

/*
 * All factions currently in the catalog, in book order (rules p.142-172).
 *
 * This list was for a long time only the four Armageddon factions, left over
 * from when they were the only ones transcribed, and it stayed that way after
 * the other eight landed because nothing on screen reads it: `web/catalog.ts`
 * discovers faction files with `import.meta.glob` and hands the validator its
 * own catalog, so the app was never short a faction.
 *
 * What WAS short was `defaultCatalog` below, which every non-browser caller
 * gets - the node tests, and anything reasoning about fleet data outside the
 * app. Validating an Age of Unity or Hypergrowth fleet through it returned a
 * flat "Unknown faction" error, so a list that was perfectly legal in the app
 * looked broken here. The glob cannot be reused: it is a Vite transform and
 * there is no bundler in a `node --test` run, so `src/` names its imports.
 *
 * Adding a faction file means adding it here too. `test/data.test.ts` walks
 * FACTIONS for its data invariants, so a file left out is a file untested.
 */
export const FACTIONS: Faction[] = [
  ...HYPERGROWTH_FACTIONS,
  ...AGE_OF_UNITY_FACTIONS,
  ...ARMAGEDDON_FACTIONS,
];

const FACTION_BY_ID = new Map<string, Faction>(FACTIONS.map((f) => [f.id, f]));

export function getFaction(id: string): Faction | undefined {
  return FACTION_BY_ID.get(id);
}

export function getShipClass(faction: Faction, shipClassId: string): ShipClass | undefined {
  return faction.ships.find((s) => s.id === shipClassId);
}

/**
 * The Catalog is the data surface the validator reads from. Defaulting to the
 * real rosters, but injectable so tests can supply fixtures.
 */
export interface Catalog {
  getFaction(id: string): Faction | undefined;
  genericHvp: Hvp[];
}

export const defaultCatalog: Catalog = {
  getFaction,
  genericHvp: GENERIC_HVP,
};
