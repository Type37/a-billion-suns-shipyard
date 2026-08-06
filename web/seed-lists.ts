import type { SavedList } from "./storage.ts";
import { PREMADE_LISTS } from "../src/data/premade-lists.ts";

// Seed fleets: eight ready-built lists, shipped so every new browser has a set
// of worked examples on the Fleets page rather than an empty state. Seeded once
// per browser (see storage.ts applyListSeeds) - deleting one makes it stick.
//
// Every one of them costs exactly ¢300bn. Not "under the limit": exactly on it,
// because a starter list is also a worked example of what a full fleet at the
// standard limit looks like, and one that stops at ¢282bn quietly teaches that
// leaving ¢18bn on the table is normal. Where hitting 300 exactly forced a
// change of shape, the reason is written above the list it changed.
//
// Book order (see catalog.ts BOOK_ORDER): Megamart (Hypergrowth), The Unity
// and Golem Mega-Systems (Age of Unity), Aegis and Gen Omega (Armageddon),
// plus the three per-era starters mapped in at the bottom of this file.

const CREATED = "2026-01-01T00:00:00.000Z";

function u(id: string, shipClassId: string, count: number) {
  return { id, shipClassId, count };
}

// --- Megamart (Hypergrowth shipyard) ----------------------------------------
// A shipyard pool, not a battle fleet: every class here is stock you may or
// may not requisition. Weighted toward the wing that actually earns its keep
// - Fighter Wing's 2D6 out to 6" beats Delivery Drone Wing's 1D6 at 0-3" by
// enough that only a couple of Drone Wings are worth carrying as cheap fillers.
const MEGAMART_LIST: SavedList = {
  id: "seed-megamart",
  mode: "hypergrowth",
  freePlay: false,
  emblem: "delta",
  fleet: {
    name: "Megamart Starter Shipyard",
    factionId: "megamart",
    creditsLimit: 300,
    units: [
      u("u1", "titan-mallship", 2),
      u("u2", "delivery-cruiser", 2),
      u("u3", "logistics-monitor", 2),
      u("u4", "ranger-dropship", 2),
      u("u5", "bomber-wing", 3),
      u("u6", "fighter-wing", 5),
      u("u7", "delivery-drone-wing", 2),
    ],
    hvp: [
      { hvpId: "head-of-customer-empathy" },
      { hvpId: "veteran-navigator" },
      { hvpId: "chief-operational-officer" },
    ],
    notes:
      "¢300bn shipyard, not a single fleet: this is everything on the roster, not everything you requisition in one game. Two Titan Mallships anchor it, Delivery Cruisers and Logistics Monitors give mid-range punch, and the wing mix leans Fighter over Drone Wing for the extra range and dice. HVP left unassigned - Hypergrowth assigns them to units at requisition, not at build time.",
  },
  createdAt: CREATED,
  updatedAt: CREATED,
};

// --- The Unity (Age of Unity fleet list) ------------------------------------
const THE_UNITY_LIST: SavedList = {
  id: "seed-the-unity",
  mode: "age-of-unity",
  freePlay: false,
  emblem: "delta",
  fleet: {
    name: "The Unity Starter Fleet",
    factionId: "the-unity",
    creditsLimit: 300,
    units: [
      u("u1", "dreadnaught", 1),
      u("u2", "battlecarrier", 1),
      u("u3", "void-cruiser", 2),
      u("u4", "patrol-monitor", 3),
      u("u5", "troop-transport", 2),
      u("u6", "io-fighter-wing", 3),
      u("u7", "io-fighter-wing", 3),
      u("u8", "io-fighter-wing", 3),
      u("u9", "bomber-wing", 3),
      u("u10", "bomber-wing", 3),
      u("u11", "fighter-bomber-wing", 3),
      u("u12", "m2-light-fighter-wing", 3),
      u("u13", "m2-light-fighter-wing", 3),
    ],
    hvp: [
      { hvpId: "weapons-officer", assignedUnitId: "u1" },
      { hvpId: "flight-controller", assignedUnitId: "u2" },
      { hvpId: "brutal-wing-commander", assignedUnitId: "u5" },
    ],
    notes:
      "The capital-ship-plus-endless-wings build the faction page asks for: a Dreadnaught and Battlecarrier behind 24 squadron craft across 8 units. Squadrons keep dying, rotating to Reserve under Mobile Force, and scrambling straight back out of the Mass 2/3 units.",
  },
  createdAt: CREATED,
  updatedAt: CREATED,
};

// --- Golem Mega-Systems (Age of Unity fleet list) ---------------------------
// Only 5 starting Drones on purpose: Drone Swarms mints new ones for free
// every time a unit eats 2+ damage in a salvo, so the list doesn't need to
// buy a big standing swarm up front.
const GOLEM_LIST: SavedList = {
  id: "seed-golem-mega-systems",
  mode: "age-of-unity",
  freePlay: false,
  emblem: "delta",
  fleet: {
    name: "Golem Mega-Systems Starter Fleet",
    factionId: "golem-mega-systems",
    creditsLimit: 300,
    units: [
      u("u1", "macroforge-supercruiser", 1),
      u("u2", "dx-1-constructor-dreadnought", 1),
      u("u3", "director-class-assembly-engine", 2),
      u("u4", "obelisk-class-processor", 2),
      u("u5", "al-3-harvester", 3),
      u("u6", "blackmill-refinery", 2),
      u("u7", "titus-excavator", 2),
      u("u8", "drone", 3),
      u("u9", "drone", 2),
    ],
    hvp: [
      { hvpId: "targeting-matrix", assignedUnitId: "u1" },
      { hvpId: "assimilation-cluster", assignedUnitId: "u2" },
      { hvpId: "forge-overseer-core", assignedUnitId: "u3" },
    ],
    notes:
      "The book's 'aggressive' build: Assimilation Cluster, Forge-Overseer Core and Targeting Matrix. Kills and any 2+ damage salvo dump drones onto the field; once a drone sits on a target, the whole fleet gets +4\" primary range and an easier time landing hits on it.",
  },
  createdAt: CREATED,
  updatedAt: CREATED,
};

// --- Aegis (Armageddon fleet list) ------------------------------------------
const AEGIS_LIST: SavedList = {
  id: "seed-aegis",
  mode: "armageddon",
  freePlay: false,
  emblem: "delta",
  fleet: {
    name: "Aegis Starter Fleet",
    factionId: "aegis",
    creditsLimit: 300,
    // Landing on exactly ¢300bn forces the shape of this one. Aegis prices its
    // four heavies at 75/65/55/45 and everything else at 4/6/10/12/20, so the
    // total is odd whenever an odd NUMBER of heavies is fielded. The old list
    // ran three (Imperator, Citadel, Bastion) and could only ever reach 299 or
    // 301. A fourth heavy fixes the parity, and the Sentinel is the one that
    // was missing, so the screen thins to one of each drone to pay for it.
    units: [
      u("u1", "imperator", 1),
      u("u2", "citadel", 1),
      u("u3", "bastion", 1),
      u("u4", "sentinel", 1),
      u("u5", "warden", 1),
      u("u6", "repair-drone", 1),
      u("u7", "assault-drone", 1),
      u("u8", "defence-drone", 1),
      u("u9", "recon-drone", 3),
    ],
    hvp: [
      { hvpId: "power-management-protocols", assignedUnitId: "u1" },
      { hvpId: "vulnerability-analysis-protocols", assignedUnitId: "u2" },
      { hvpId: "threat-assessment-protocols", assignedUnitId: "u4" },
    ],
    notes:
      "All four D10/D12-armed heavies (Imperator, Citadel, Sentinel, Bastion) plus a Warden and one of every drone, built to stay clustered within 6\" so Protocol Shards shares all three HVP across the whole task force.",
  },
  createdAt: CREATED,
  updatedAt: CREATED,
};

// --- Gen Omega (Armageddon fleet list) --------------------------------------
const GEN_OMEGA_LIST: SavedList = {
  id: "seed-gen-omega",
  mode: "armageddon",
  freePlay: false,
  emblem: "delta",
  fleet: {
    name: "Gen Ω Starter Fleet",
    factionId: "gen-omega",
    creditsLimit: 300,
    units: [
      u("u1", "termina-class-colony-ship", 1),
      u("u2", "torchbearer-heavy-destroyer", 1),
      u("u3", "ghost-hunter-assault-frigate", 2),
      u("u4", "werewolf-stealth-frigate", 2),
      u("u5", "eidolon-yynnx-stealth-bomber", 3),
      u("u6", "void-dancer-scout-marauder", 1),
      u("u7", "warcry-fighter-wing", 3),
      // A second Warcry unit rather than a bigger one: Mass 0 caps a unit at 3.
      // These two wings and the scout dropped from the old list are what take
      // this from 298 to exactly 300.
      u("u8", "warcry-fighter-wing", 2),
    ],
    hvp: [
      { hvpId: "the-nameless-punk", assignedUnitId: "u5" },
      { hvpId: "unhinged-live-streamer", assignedUnitId: "u3" },
      { hvpId: "prophet-of-the-end-times", assignedUnitId: "u2" },
    ],
    notes:
      "Unhinged Live-Streamer makes Red Alert free, Prophet of the End Times turns any nearby Red Alert into a fleet-wide re-roll, and the Nameless Punk (legal on a Mass 0 unit) stacks a shields debuff onto the stealth bombers. Martyrs' Fury means every hit taken just makes the counterpunch worse.",
  },
  createdAt: CREATED,
  updatedAt: CREATED,
};

/*
 * The three per-era starter lists (src/data/premade-lists.ts) ship the same
 * way: as fleets that are simply already there.
 *
 * They were briefly offered instead - a card in the New Fleet modal with a
 * "load this list" button - which is one more thing to read and dismiss on the
 * way to the screen you opened. A ready-made fleet does not need to be pitched.
 * It needs to be sitting on the Fleets page when you arrive, so you can open it,
 * play it, edit it or delete it without anybody having asked you anything.
 *
 * Kept as a mapping rather than eight hand-written SavedLists because
 * premade-lists.ts also carries the reasoning for which faction each era got,
 * and test/premade-lists.test.ts validates those three against the catalogue.
 */
const PREMADE_SEEDS: SavedList[] = PREMADE_LISTS.map((p) => ({
  id: `seed-${p.id}`,
  mode: p.mode,
  freePlay: false,
  emblem: "delta",
  fleet: {
    name: p.name,
    factionId: p.factionId,
    creditsLimit: p.creditsLimit,
    units: p.units.map((unit, i) => u(`u${i + 1}`, unit.shipClassId, unit.count)),
    hvp: p.hvpIds.map((hvpId) => ({ hvpId })),
    notes: p.blurb,
  },
  createdAt: CREATED,
  updatedAt: CREATED,
}));

export const SEED_LISTS: SavedList[] = [
  ...PREMADE_SEEDS,
  MEGAMART_LIST,
  THE_UNITY_LIST,
  GOLEM_LIST,
  AEGIS_LIST,
  GEN_OMEGA_LIST,
];
