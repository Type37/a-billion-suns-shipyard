import type { SavedOutfit } from "./storage.ts";
import { STARTER_OUTFITS } from "../src/data/starter-outfits.ts";
import { ALERT_START, STARTING_DEBT_K } from "../src/data/junkspace.ts";

/*
 * Pre-built outfits: the ready-made crews, shipped as real saved outfits.
 *
 * They used to be buttons inside the Start-a-new-outfit dialog ("Or start with
 * a ready-made crew"), which meant a first-time solo player had to open a
 * creation dialog and read a pitch before they could see that a crew existed at
 * all. They ship the same way the starter fleets ship on the Fleets page now
 * (see seed-lists.ts): already on the Solo page when you arrive, ordinary
 * outfits you can open, fly, rename, edit or delete without anybody having
 * asked you anything.
 *
 * Seeded once per browser and tracked by id, so deleting one makes it stick.
 *
 * Ship instance ids are s1..sn rather than the random ids the app mints at
 * runtime: a seed has to be byte-identical on every device, or Fleet Sync and
 * the "already seeded?" test would see two different objects with one id.
 */

const CREATED = "2026-01-01T00:00:00.000Z";

export const SEED_OUTFITS: SavedOutfit[] = STARTER_OUTFITS.map((s) => ({
  id: `seed-outfit-${s.key}`,
  name: s.name,
  emblem: "chevrons",
  ships: s.ships.map((ship, i) => ({
    id: `s${i + 1}`,
    shipClassId: ship.shipClassId,
    pilotClass: ship.pilotClass,
    pilotName: ship.pilotName,
  })),
  debtK: STARTING_DEBT_K,
  gamesPlayed: 0,
  gameLog: [],
  perks: [],
  alertLevel: ALERT_START,
  round: 1,
  createdAt: CREATED,
  updatedAt: CREATED,
}));
