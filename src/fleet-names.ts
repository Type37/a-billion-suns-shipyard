// Fleet-name generator for A Billion Suns.
//
// Inspired by the auto-naming system in Endless Space 2, where every fleet gets
// a flavourful default name built from three parts:
//
//     [ordinal] [adjective] [faction title-noun]
//        1st      Crushing        Horde
//
// Here we apply the same idea to A Billion Suns factions. Each faction has a
// fixed TITLE noun (what its fleets are called) and a bank of ADJECTIVES themed
// to that faction's character. The ordinal counts up per faction (1st, 2nd, 3rd
// Fleet...), so a corporation's third battlegroup might read
// "3rd Liquidation Portfolio" and a zealot armada "7th Ascendant Crusade".
//
// ---------------------------------------------------------------------------
// HOW TO USE
// ---------------------------------------------------------------------------
//
//   import { fleetName, randomFleetName } from "./fleet-names.ts";
//
//   // Deterministic: the Nth fleet you raise for a faction always gets the
//   // same name. Great for stable, repeatable rosters and tests.
//   fleetName("vyke", 1);   // -> "1st Ravening Shoal"
//   fleetName("vyke", 2);   // -> "2nd Boiling Shoal"
//   fleetName("aegis", 1);  // -> "1st Sanctioned Wardens"
//
//   // Random: pick any adjective from the faction's bank. Pass a seed for a
//   // reproducible-but-shuffled result, or omit it for true randomness.
//   randomFleetName("megamart", 4);          // -> e.g. "4th Doorstep Convoy"
//   randomFleetName("megamart", 4, 12345);   // -> stable for that seed
//
//   // Unknown / custom faction ids fall back to a neutral bank:
//   fleetName("some-homebrew-faction", 1);   // -> "1st Wandering Fleet"
//
// To add a faction, drop a new entry in FLEET_NAME_BANKS keyed by the faction's
// `id` (the same id used in src/data/factions/*). Give it a `title` and a bank
// of `adjectives` (ten is the house style, but any non-empty list works).

/** A faction's fleet-naming vocabulary. */
export interface FleetNameBank {
  /** The noun every fleet of this faction is called, e.g. "Horde", "Portfolio". */
  title: string;
  /** Themed adjectives. One is chosen per fleet to sit before the title. */
  adjectives: string[];
}

/**
 * Turn a positive integer into an English ordinal: 1 -> "1st", 2 -> "2nd",
 * 11 -> "11th", 23 -> "23rd". Works for any n >= 1.
 */
export function toOrdinal(n: number): string {
  const abs = Math.abs(Math.trunc(n));
  const tens = abs % 100;
  const ones = abs % 10;
  let suffix = "th";
  if (tens < 11 || tens > 13) {
    if (ones === 1) suffix = "st";
    else if (ones === 2) suffix = "nd";
    else if (ones === 3) suffix = "rd";
  }
  return `${abs}${suffix}`;
}

/**
 * Per-faction fleet vocabularies, keyed by faction id (see
 * src/data/factions/*). Each title/adjective set is themed to the faction's
 * rules text and flavour.
 */
export const FLEET_NAME_BANKS: Record<string, FleetNameBank> = {
  // --- Armageddon era ---------------------------------------------------
  vyke: {
    // Overwhelm: swarming aquatic predators.
    title: "Shoal",
    adjectives: [
      "Ravening", "Boiling", "Seething", "Voracious", "Teeming",
      "Frenzied", "Swarming", "Gnashing", "Writhing", "Engulfing",
    ],
  },
  aegis: {
    // Protocol Shards: cold, networked AI defence grid. "Wardens" (cf. ES2's
    // Riftborn) reads as a guarding formation.
    title: "Wardens",
    adjectives: [
      "Sanctioned", "Hardened", "Vigilant", "Encrypted", "Failsafe",
      "Sentinel", "Recursive", "Absolute", "Unyielding", "Zero-Fault",
    ],
  },
  "gen-omega": {
    // Martyrs' Fury: doomed zealot generation.
    title: "Crusade",
    adjectives: [
      "Ascendant", "Martyred", "Wrathful", "Undying", "Immolate",
      "Sacred", "Vengeful", "Rapturous", "Doomsworn", "Final",
    ],
  },
  alliance: {
    // Fractious Coalition of non-human worlds.
    title: "Coalition",
    adjectives: [
      "Fractious", "Manifold", "Sovereign", "Discordant", "Allied",
      "Untamed", "Myriad", "Defiant", "Kindred", "Unbowed",
    ],
  },

  // --- Age of Unity era -------------------------------------------------
  "golem-mega-systems": {
    // Drone Swarms: strip-mining automata.
    title: "Swarm",
    adjectives: [
      "Harvesting", "Grinding", "Tireless", "Strip", "Rendering",
      "Consuming", "Fabricating", "Relentless", "Excavating", "Autonomous",
    ],
  },
  "the-discord": {
    // Aces and Heroes: hotshot fighter jocks.
    title: "Armada",
    adjectives: [
      "Ace", "Screaming", "Renegade", "Daredevil", "Maverick",
      "Reckless", "Gilded", "Hotshot", "Legendary", "Fearless",
    ],
  },
  "the-ordinate": {
    // Predictive Algorithms: technocratic prophets.
    title: "Communion",
    adjectives: [
      "Foreseen", "Ordained", "Calculated", "Prophetic", "Certain",
      "Providence", "Anointed", "Inevitable", "Revelated", "Converging",
    ],
  },
  "the-unity": {
    // Mobile Force: fast-moving unified column.
    title: "Vanguard",
    adjectives: [
      "United", "Onward", "Marching", "Steadfast", "Resolute",
      "Bannered", "Foremost", "Rallied", "Unbroken", "Advancing",
    ],
  },

  // --- Hypergrowth era (corporate factions) -----------------------------
  "galactic-credit": {
    // Credit Control: predatory finance. "Venture" mirrors ES2's Lumeris.
    title: "Venture",
    adjectives: [
      "Liquidation", "Leveraged", "Compound", "Foreclosure", "Aggregate",
      "Blue-Chip", "Hostile", "Prime", "Dividend", "Insolvent",
    ],
  },
  "heavy-industries": {
    // Tough: heavy industrial combine.
    title: "Combine",
    adjectives: [
      "Ironclad", "Forged", "Riveted", "Tempered", "Overbuilt",
      "Blastproof", "Load-Bearing", "Reinforced", "Cast-Iron", "Unbreakable",
    ],
  },
  megamart: {
    // Time Is Money: hyper-efficient retail logistics. "Convoy" mirrors ES2's
    // Lumeris and fits a supply fleet.
    title: "Convoy",
    adjectives: [
      "Doorstep", "Same-Day", "Express", "Bulk", "Discount",
      "Rush", "Wholesale", "On-Demand", "Overnight", "Clearance",
    ],
  },
  "news-inc": {
    // Live News Feeds: 24/7 media war machine. "Dispatch" doubles as a news
    // dispatch and a fleet sent out on assignment.
    title: "Dispatch",
    adjectives: [
      "Breaking", "Live", "Primetime", "Headline", "Exclusive",
      "Trending", "Unfiltered", "Front-Page", "Viral", "Sensational",
    ],
  },
};

/** Fallback bank for unknown / custom faction ids. */
export const DEFAULT_FLEET_NAME_BANK: FleetNameBank = {
  title: "Fleet",
  adjectives: [
    "Wandering", "Roaming", "Questing", "Ranging", "Drifting",
    "Seeking", "Trailing", "Errant", "Nomad", "Wayfaring",
  ],
};

/** Look up a faction's bank, falling back to the neutral bank. */
export function fleetNameBank(factionId: string): FleetNameBank {
  return FLEET_NAME_BANKS[factionId] ?? DEFAULT_FLEET_NAME_BANK;
}

/**
 * Deterministic fleet name: the `n`th fleet raised for a faction always gets
 * the same name. The adjective cycles through the faction's bank as n grows.
 *
 *   fleetName("vyke", 1) === "1st Ravening Shoal"   (always)
 *
 * @param factionId  A faction id (src/data/factions/*), or any string.
 * @param n          The fleet's sequence number, 1-based.
 */
export function fleetName(factionId: string, n: number): string {
  const bank = fleetNameBank(factionId);
  const index = (Math.max(1, Math.trunc(n)) - 1) % bank.adjectives.length;
  return `${toOrdinal(n)} ${bank.adjectives[index]} ${bank.title}`;
}

/**
 * Random fleet name: picks any adjective from the faction's bank. Supply a
 * `seed` for a reproducible result, or omit it for genuine randomness.
 *
 * @param factionId  A faction id, or any string.
 * @param n          The fleet's sequence number, 1-based (drives the ordinal).
 * @param seed       Optional. Same seed + faction + n -> same name.
 */
export function randomFleetName(factionId: string, n: number, seed?: number): string {
  const bank = fleetNameBank(factionId);
  const roll = seed === undefined
    ? Math.floor(Math.random() * bank.adjectives.length)
    : Math.abs(Math.trunc(seed)) % bank.adjectives.length;
  return `${toOrdinal(n)} ${bank.adjectives[roll]} ${bank.title}`;
}
