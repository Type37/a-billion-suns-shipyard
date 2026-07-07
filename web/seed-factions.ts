import type { Faction } from "../src/types.ts";
import { w } from "../src/data/_helpers.ts";

// Seed custom factions: shipped as real *custom* factions (they live in the
// customFactions store, not the built-in glob) so they exercise the whole
// Foundry / export / share path. Seeded once per browser, then owned by the
// user - deleting one makes it stick (see storage.ts seedDefaultFactions).

// The Covenant (Halo). A prototype test faction: names and flavour lifted
// straight from Halo, stats hand-balanced against the twelve book factions -
// nine ship classes on the usual 3/2/2/2 Mass spread, seven personnel, costs
// and dice in the same bands as everyone else. Identity: energy shields on
// even the smallest craft, plasma that reaches, and a shield that shrugs off
// the first hit each round. Deliberately no five-kilometre supercarriers.
export const COVENANT_SEED: Faction = {
  id: "cf-covenant",
  name: "The Covenant",
  era: "Armageddon",
  initiative: "3D6",
  cmdTokens: "8",
  playstyle: "Durable energy shields and long-range plasma; fragile once the shields fall.",
  rule: {
    name: "Energy Shielding",
    text: "The first point of damage each Covenant unit would suffer each Round is ignored.",
  },
  ships: [
    // Mass 0 - strike craft. Even these carry a shield, which is unusual.
    { id: "seraph", name: "Seraph", mass: 0, thrust: 12, silhouette: 2, shields: 1,
      primary: [w("Plasma Cannons", 2, "D6", 0, 6)], auxiliary: [], utilityBays: false, cost: 4 },
    { id: "banshee", name: "Banshee", mass: 0, thrust: 10, silhouette: 2, shields: 0,
      primary: [w("Fuel Rod Cannon", 1, "D8", 0, 6)], auxiliary: [], utilityBays: false, cost: 3 },
    { id: "spirit", name: "Spirit", mass: 0, thrust: 8, silhouette: 3, shields: 1,
      primary: [], auxiliary: [w("Plasma Bolt Turret", 1, "D6", 0, 3)], utilityBays: true, primaryUtility: true, cost: 5 },
    // Mass 1 - corvettes.
    { id: "dav-corvette", name: "DAV-class Corvette", mass: 1, thrust: 10, silhouette: 4, shields: 2,
      primary: [w("Pulse Laser Turrets", 3, "D6", 0, 6)], auxiliary: [w("Plasma Cannon", 1, "D10", 2, 12)], utilityBays: false, cost: 10 },
    { id: "sdv-heavy-corvette", name: "SDV-class Heavy Corvette", mass: 1, thrust: 9, silhouette: 4, shields: 2,
      primary: [w("Plasma Torpedo", 1, "D10", 6, 18)], auxiliary: [w("Pulse Lasers", 2, "D6", 0, 6)], utilityBays: false, cost: 12 },
    // Mass 2 - cruisers.
    { id: "rpv-destroyer", name: "RPV-class Light Destroyer", mass: 2, thrust: 8, silhouette: 6, shields: 3,
      primary: [w("Plasma Beam", 2, "D10", 0, 12)], auxiliary: [w("Pulse Laser Batteries", 3, "D6", 0, 6)], utilityBays: false, cost: 20 },
    { id: "crs-light-cruiser", name: "CRS-class Light Cruiser", mass: 2, thrust: 7, silhouette: 6, shields: 3,
      primary: [w("Plasma Torpedoes", 2, "D10", 6, 18)], auxiliary: [w("Plasma Cannons", 3, "D8", 0, 9)], utilityBays: false, cost: 25 },
    // Mass 3 - capital ships. The glassing beam lives here, not on a supercarrier.
    { id: "ors-heavy-cruiser", name: "ORS-class Heavy Cruiser", mass: 3, thrust: 6, silhouette: 8, shields: 5,
      primary: [w("Energy Projector", 1, "D12", 0, 15)], auxiliary: [w("Plasma Cannons", 4, "D8", 0, 9)], utilityBays: false, cost: 48 },
    { id: "ccs-battlecruiser", name: "CCS-class Battlecruiser", mass: 3, thrust: 6, silhouette: 9, shields: 5,
      primary: [w("Plasma Torpedo Array", 3, "D10", 6, 18)], auxiliary: [w("Pulse Laser Batteries", 8, "D6", 0, 6)], utilityBays: false, cost: 55 },
  ],
  hvp: [
    { id: "cov-hierarch", name: "Prophet of Regret (Hierarch)",
      rule: "This unit gains the command Rally the Faithful (1 CMD): friendly units within 12\" may each immediately make a free move of up to 6\". Once per Round." },
    { id: "cov-fleet-master", name: "Fleet Master (Sangheili Ship Master)",
      rule: "Ships in this unit's battlegroup increase the damage values of their D10 and D12 weapon systems by 1." },
    { id: "cov-spec-ops", name: "Special Operations Commander",
      rule: "When ships in this unit's battlegroup use the Power to Weapons command, they subtract 2 from the result of each attack dice, instead of 1." },
    { id: "cov-huragok", name: "Huragok Engineer",
      rule: "This unit gains the command Reweave (1 CMD): discard 1 damage token from every friendly unit within 12\". Once per Round." },
    { id: "cov-ranger", name: "Kig-Yar Ranger",
      rule: "Ships in this unit's battlegroup increase the maximum range of all their weapon systems by 3\"." },
    { id: "cov-deacon", name: "Unggoy Deacon",
      rule: "Friendly ships within 12\" of this unit count their Shields value as 1 higher. Nobody, least of all the Deacon, is sure why this works." },
    { id: "cov-chieftain", name: "Jiralhanae Chieftain",
      rule: "The first time this unit's ship would be destroyed each game, it is instead reduced to 1 HP and survives, bellowing." },
  ],
};

export const SEED_FACTIONS: Faction[] = [COVENANT_SEED];
