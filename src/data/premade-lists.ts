import type { GameMode } from "../types.ts";

/*
 * PREMADE STARTER FLEETS — one legal ~¢300bn list per Era.
 * ==========================================================
 *
 * These are ready-to-play lists a new player can load and field without having
 * to understand the whole faction catalogue first. Each uses the faction we
 * judge EASIEST FOR A NEW PLAYER in its Era.
 *
 * A word of honesty first: the rulebook (Documents/ABS 2E Layouts 7.pdf) does
 * NOT rank factions by difficulty. It says the opposite — it hands you the
 * corporations "as templates for your own interstellar corporation" (p.142) and
 * the Armageddon powers as flavourful equals. So the "easiest" call below is a
 * derivation from the printed rules, not something the book asserts. The test we
 * applied, per Era: is the faction ability passive/always-on (nothing to
 * remember, nothing to spend) rather than a conditional trigger or a fiddly
 * command? Is the roster plain — no species tagging, the standard three HVP, no
 * running token bookkeeping? Is the Initiative / CMD economy a flat, predictable
 * number? The faction that best clears all three wins the Era.
 *
 * ARMAGEDDON → THE VYKE (p.162). Ability "Overwhelm": "Enemy units cannot target
 *   Vyke units within 3\" of them." It is entirely passive and always on — a new
 *   player makes zero decisions and spends zero tokens to benefit, they just keep
 *   their ships close and become hard to shoot. Flat CMD 9 and 2D6 Initiative are
 *   simple. Standard three HVP, no species. Its Armageddon rivals are each a step
 *   harder: AEGIS's "Protocol Shards" is a positioning puzzle (you must chain
 *   units within 6\" to share HVP), Gen Ω's "Martyrs' Fury" only fires once a unit
 *   has already been damaged this round, and the Alliance carries the book's one
 *   truly complex build rule — Fractious Coalition forces every single unit to
 *   declare a species and forbids mixed-species battlegroups (requiresSpecies).
 *   The Vyke is the clean pick.
 *
 * AGE OF UNITY → THE ORDINATE (p.154). Ability "Predictive Algorithms (1 CMD)":
 *   an OPTIONAL command to reorder a battlegroup's activation steps. The key point
 *   for a beginner is that it is opt-in — you can ignore it entirely and still
 *   play a legal, coherent fleet, then reach for it once you are ready. There is
 *   no persistent bookkeeping. Standard three HVP, no species. Its rivals all add
 *   ongoing overhead: Golem Mega-Systems' "Drone Swarms" spawns new drone tokens
 *   every time a unit takes 2+ damage (constant table-state to track), The Unity's
 *   "Mobile Force" makes you shuttle destroyed squadrons into Reserve and scramble
 *   them back, and The Discord bends the build itself — variable 3-to-5 HVP and
 *   Mass-0 personnel carriers (hvpMin/hvpMax, hvpMass0Carriers). The Ordinate asks
 *   the least of a first-timer.
 *
 * HYPERGROWTH → HEAVY INDUSTRIES (p.142). Ability "Tough": "Units in this fleet
 *   ignore the first Ⓜ damage received in each Salvo, to a minimum of 1 damage."
 *   Passive, always-on, and — crucially for a learner — FORGIVING: it blunts every
 *   incoming salvo automatically, so early positioning mistakes cost less. Flat
 *   CMD 7, plain roster, standard three HVP. Galactic Credit's "Credit Control"
 *   (keep unspent CMD between rounds) is just as passive but only pays off once you
 *   already understand the CMD economy; Megamart's fast-but-fragile ships and
 *   News Inc.'s CMD-stealing personnel both reward finesse a beginner does not yet
 *   have. Heavy Industries lets a new player survive their mistakes, which is the
 *   most useful thing an ability can do while you are still learning.
 *
 * Every shipClassId and hvpId below is copied from the faction data files and
 * verified to exist; every unit count respects maxUnitSize (Mass 3 = 1 ship,
 * Mass 0/1/2 = up to 3). Totals are held under the ¢300bn limit.
 */

export interface PremadeList {
  /** Stable slug. */
  id: string;
  /** An evocative but plain fleet name. */
  name: string;
  era: "Armageddon" | "Age of Unity" | "Hypergrowth";
  /** The GameMode this list is built for. */
  mode: GameMode;
  factionId: string;
  /** Agreed credits limit (¢bn). */
  creditsLimit: number;
  /** Units, each one ship class. count must respect maxUnitSize for that Mass. */
  units: { shipClassId: string; count: number }[];
  /** Real HVP ids from the faction: three for every Era. */
  hvpIds: string[];
  /** 1-2 sentences: why the faction is beginner-friendly and how the list plays. */
  blurb: string;
}

export const PREMADE_LISTS: PremadeList[] = [
  {
    id: "starter-armageddon",
    name: "Tide of the Brood",
    era: "Armageddon",
    mode: "armageddon",
    factionId: "vyke",
    creditsLimit: 300,
    // 52+35 + 75+45 + 27+18 + 15+9+6 = ¢282bn
    units: [
      { shipClassId: "leviathan", count: 1 }, // Mass 3, 52
      { shipClassId: "king-crab", count: 1 }, // Mass 3, 35
      { shipClassId: "dragonfish", count: 3 }, // Mass 2, 25 x3 = 75
      { shipClassId: "latchweaver", count: 3 }, // Mass 2, 15 x3 = 45
      { shipClassId: "needlespitter", count: 3 }, // Mass 1, 9 x3 = 27
      { shipClassId: "snarefang", count: 3 }, // Mass 1, 6 x3 = 18
      { shipClassId: "orbspinner", count: 3 }, // Mass 0, 5 x3 = 15
      { shipClassId: "needlefin", count: 3 }, // Mass 0, 3 x3 = 9
      { shipClassId: "viperfish", count: 3 }, // Mass 0, 2 x3 = 6
    ],
    hvpIds: ["brood-mother", "seer-empath", "war-singer"],
    blurb:
      "The Vyke's Overwhelm keeps your ships unshootable while an enemy is within 3\", so this swarm plays by simply staying close and packed. Two capital hulls anchor a wall of cheap wings and frigates that shrug off targeting and grind the enemy down at knife range.",
  },
  {
    id: "starter-age-of-unity",
    name: "Writ of the Registrar",
    era: "Age of Unity",
    mode: "age-of-unity",
    factionId: "the-ordinate",
    creditsLimit: 300,
    // 80+35 + 60+40 + 30+10 + 20+15 = ¢290bn
    units: [
      { shipClassId: "hierophant-cathedral-ship", count: 1 }, // Mass 3, 80
      { shipClassId: "transept-class-strike-cruiser", count: 1 }, // Mass 3, 35
      { shipClassId: "penance-class-escort-frigate", count: 2 }, // Mass 2, 30 x2 = 60
      { shipClassId: "clerestory-class-monitor", count: 2 }, // Mass 2, 20 x2 = 40
      { shipClassId: "epistle-class-gunship", count: 2 }, // Mass 1, 15 x2 = 30
      { shipClassId: "missionary-vessel", count: 1 }, // Mass 1, 10
      { shipClassId: "advanced-fighter-wing", count: 2 }, // Mass 0, 10 x2 = 20
      { shipClassId: "light-fighter-wing", count: 3 }, // Mass 0, 5 x3 = 15
    ],
    hvpIds: ["liturgical-archivist", "relic-keeper", "the-blessed-lambda"],
    blurb:
      "The Ordinate's Predictive Algorithms is an optional command you can lean on once you're ready and ignore until then, so nothing forces a beginner to juggle it. The list is built for close-range passive fire: a Cathedral Ship and Strike Cruiser hold the centre while gunships and monitors punish anything that closes in.",
  },
  {
    id: "starter-hypergrowth",
    name: "Atlas Extraction Group",
    era: "Hypergrowth",
    mode: "hypergrowth",
    factionId: "heavy-industries",
    creditsLimit: 300,
    // 75+40 + 50+25+45 + 20 + 21+14+6 = ¢296bn
    units: [
      { shipClassId: "andromeda-battlecruiser", count: 1 }, // Mass 3, 75
      { shipClassId: "orion-heavy-freighter", count: 1 }, // Mass 3, 40
      { shipClassId: "vulcan-class-monitor", count: 2 }, // Mass 2, 25 x2 = 50
      { shipClassId: "poseidon-class-monitor", count: 1 }, // Mass 2, 25
      { shipClassId: "foundry-class-hauler", count: 3 }, // Mass 2, 15 x3 = 45
      { shipClassId: "lyra-light-mining-tug", count: 2 }, // Mass 1, 10 x2 = 20
      { shipClassId: "taurus-assault-wing", count: 3 }, // Mass 0, 7 x3 = 21
      { shipClassId: "ursus-bomber-wing", count: 2 }, // Mass 0, 7 x2 = 14
      { shipClassId: "pegasus-recon-wing", count: 3 }, // Mass 0, 2 x3 = 6
    ],
    hvpIds: ["demolition-chief", "penal-crew-overseer", "survey-director"],
    blurb:
      "Heavy Industries' Tough shrugs off the first chunk of every salvo, so a beginner survives the positioning mistakes they're bound to make. This is a durable, slow-moving line that grabs objectives and refuses to be pushed off them, with lighter wings screening the heavy freighters.",
  },
];
