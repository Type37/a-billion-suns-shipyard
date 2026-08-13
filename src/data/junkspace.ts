import type { PilotClass, ShipClass } from "../types.ts";
import { w } from "./_helpers.ts";

// Junkspace (Solo Play) data, rules p.193-215.
//
// NOTE ON COSTS: all Junkspace ship costs are in thousands of Juran credits
// (¢k), not the billions of Galactic Universal Credits (¢bn) used everywhere
// else in the rulebook (p.202).

// ---------------------------------------------------------------------------
// Stock ship classes (p.202)
// ---------------------------------------------------------------------------

// Ship stats table p.202, confirmed against the final layout. (An earlier
// text-only extraction drifted the class names off their stat rows and led to
// the Light Freighter and Gunship being entered swapped; the printed table has
// Light Freighter as the Thrust 6 / dual-Blasters row and Gunship as the
// Thrust 4 / single-Laser-Cannon row, corrected below.)
export const JUNKSPACE_SHIPS: ShipClass[] = [
  { id: "recon-ship", name: "Recon Ship", mass: 0, thrust: 8, silhouette: 2, shields: 1,
    primary: [w("Light Blasters", 1, "D6", 0, 3)], auxiliary: [], utilityBays: false,
    auxiliaryFitting: "Long-Range Scanners", cost: 2 },
  { id: "starfighter", name: "Starfighter", mass: 0, thrust: 6, silhouette: 3, shields: 1,
    primary: [], auxiliary: [w("Auto Blasters", 3, "D6", 0, 6)], utilityBays: false, cost: 5 },
  { id: "bomber", name: "Bomber", mass: 0, thrust: 4, silhouette: 3, shields: 1,
    primary: [w("Torpedoes", 1, "D10", 6, 12)], auxiliary: [], utilityBays: false, cost: 8 },
  { id: "light-freighter", name: "Light Freighter", mass: 1, thrust: 6, silhouette: 4, shields: 2,
    primary: [w("Blasters", 2, "D6", 0, 6)], auxiliary: [w("Blasters", 2, "D6", 0, 6)],
    utilityBays: false, cost: 10 },
  { id: "gunship", name: "Gunship", mass: 1, thrust: 4, silhouette: 4, shields: 2,
    primary: [], auxiliary: [w("Laser Cannon", 2, "D8", 0, 6)], utilityBays: false, cost: 10 },
  { id: "corvette", name: "Corvette", mass: 2, thrust: 8, silhouette: 5, shields: 3,
    primary: [w("Turbo Blasters", 4, "D6", 0, 6)], auxiliary: [w("Blasters", 2, "D6", 0, 6)],
    utilityBays: false, cost: 15 },
  { id: "frigate", name: "Frigate", mass: 2, thrust: 5, silhouette: 6, shields: 4,
    primary: [w("Light Railguns", 2, "D8", 9, 18)], auxiliary: [w("Turbo Blasters", 4, "D6", 0, 6)],
    utilityBays: false, cost: 25 },
];

/** Long-Range Scan action granted by the Recon Ship's Long-Range Scanners (p.202). */
export const LONG_RANGE_SCAN_TEXT =
  "Long-Range Scan (action): Make an Initiative Test. If you succeed, peek at the number on one Blip marker within 12\" without revealing it.";

// ---------------------------------------------------------------------------
// Pilot classes and starting perks (p.202)
// ---------------------------------------------------------------------------

export interface PilotPerk {
  class: PilotClass;
  perkName: string;
  text: string;
}

export const PILOT_PERKS: PilotPerk[] = [
  { class: "Gunner", perkName: "Hot Shot",
    text: "A ship with a Gunner as a pilot can re-roll one attack die in each salvo." },
  { class: "Hauler", perkName: "Tough",
    text: "A ship with a Hauler as a pilot ignores the first damage received from each salvo." },
  // Transcribed verbatim: "Hauler" here is an obvious typo in the source book,
  // this is the Junker starting perk and should read "Junker".
  { class: "Junker", perkName: "Smartass",
    text: "A ship with a Hauler as a pilot rolls two extra dice when making an Initiative Check as part of a Scan action." },
];

// ---------------------------------------------------------------------------
// Outfit building and campaign parameters (p.195, p.201)
// ---------------------------------------------------------------------------

/**
 * The loan, which is also the budget, which is also the Debt.
 *
 * p.201 says it three ways about one number: "you take out a loan of ¢30k to
 * create an Outfit, and then fly Jobs to clear your debt" and "You get ¢30k
 * with which to buy ships". So the money you spend on hulls is exactly the
 * money you owe, and an outfit that starts on the harder ¢45k debt has ¢45k to
 * spend. This constant is the standard game's figure and the default for
 * outfits that predate the campaign dials; the live number is
 * outfitBudgetK(outfit) below.
 */
export const OUTFIT_BUDGET_K = 30;

/** "you can buy up to a maximum of 5 ships" (p.201). */
export const OUTFIT_MAX_SHIPS = 5;

/** "You start the campaign with a Debt of ¢30k." (p.201). In ¢k. */
export const STARTING_DEBT_K = 30;

/** "If you clear your debt within 8 games, you have won the campaign." (p.201). */
export const DEBT_CLEAR_GAMES = 8;

/** The harder campaign offered in the NOTE box on p.201: fewer games, or a bigger hole. */
export const HARD_DEBT_K = 45;
export const HARD_CLEAR_GAMES = 6;

/** "At the start of the game, your Alert Level is 1." (p.195). */
export const ALERT_START = 1;

/** "If you have less than ¢25k Debt remaining, the Alert Level starts the game at 2." (p.195). */
export const ALERT_START_LOW_DEBT = 2;

/** Debt threshold (in ¢k) below which the Alert Level starts at 2 (p.195). */
export const LOW_DEBT_THRESHOLD_K = 25;

/** "If you have cleared your Debt completely, the Alert Level starts at 3." (p.195). */
export const ALERT_START_DEBT_CLEARED = 3;

/**
 * The Alert Level a game starts at, given how much Debt is left.
 *
 * "As you progress through the campaign, the starting Alert Level increases,
 * making the game more difficult. If you have less than ¢25k Debt remaining,
 * the Alert Level starts the game at 2. If you have cleared your Debt
 * completely, the Alert Level starts at 3." (p.195)
 *
 * The three constants above existed but nothing called them, so every game
 * started at 1 and the campaign never got harder - which is the whole shape of
 * the Junkspace campaign. Note the threshold is strict: exactly ¢25k remaining
 * is NOT "less than ¢25k", so it still starts at 1.
 */
export function startingAlertLevel(debtK: number): number {
  if (debtK <= 0) return ALERT_START_DEBT_CLEARED;
  if (debtK < LOW_DEBT_THRESHOLD_K) return ALERT_START_LOW_DEBT;
  return ALERT_START;
}

/**
 * Translate a main-game fleet into a Junkspace outfit.
 *
 * These are two different economies and there is no shared ship list: the main
 * game is factions of bespoke classes costed in billions, Junkspace is seven
 * stock hulls costed in thousands with a five-ship cap. So an "import" cannot
 * be a copy, and pretending otherwise would produce an outfit that is illegal
 * on arrival. It is a RECAST: each unit becomes the stock hull closest to it in
 * Mass, biggest first, and it stops at whichever limit bites first - five ships
 * or the budget.
 *
 * Take the heaviest five and then DOWNGRADE until it fits, rather than filling
 * greedily from the top. Greedy fill is what you reach for first and it is
 * useless here, because the budget is tiny against the biggest hull: the
 * heaviest unit maps to a Frigate at 25 of the 30 available, every other unit
 * then fails to fit, and a 33-ship fleet recasts to a single ship. Measured
 * exactly that before fixing it.
 *
 * Downgrading keeps the crew at five and keeps the fleet's shape: the most
 * expensive hull steps down one class at a time until the whole outfit is
 * affordable, so a capital-heavy list still arrives with its biggest ship
 * biggest, just smaller in absolute terms.
 *
 * Returns what it fitted and what it left behind, so the UI can say so rather
 * than silently dropping half a fleet.
 */
export function recastAsOutfit(unitMasses: number[]): { shipClassIds: string[]; spentK: number; dropped: number } {
  const cheapestFirst = [...JUNKSPACE_SHIPS].sort((a, b) => a.cost - b.cost);
  const nearest = (mass: number) =>
    cheapestFirst.reduce(
      (best, s) => (Math.abs(s.mass - mass) < Math.abs(best.mass - mass) ? s : best),
      cheapestFirst[0]!,
    );

  const wanted = [...unitMasses].sort((a, b) => b - a);
  const taken = wanted.slice(0, OUTFIT_MAX_SHIPS);
  const dropped = wanted.length - taken.length;
  let picks = taken.map((m) => ({ mass: m, ship: nearest(m) }));

  const total = () => picks.reduce((n, p) => n + p.ship.cost, 0);
  // Step the priciest hull down one class at a time, breaking ties in favour of
  // the LIGHTEST original unit. Without that tie-break the loop keeps hitting
  // index 0 - the heaviest ship in the fleet - and the result comes out
  // inverted, with the flagship reduced to a fighter while a squadron ends up
  // in the biggest hull. Terminates: each pass strictly lowers the total, or
  // there is nothing cheaper left and it stops.
  while (total() > OUTFIT_BUDGET_K) {
    let at = -1;
    for (let i = 0; i < picks.length; i += 1) {
      if (at === -1) {
        at = i;
        continue;
      }
      const a = picks[i]!;
      const b = picks[at]!;
      if (a.ship.cost > b.ship.cost || (a.ship.cost === b.ship.cost && a.mass < b.mass)) at = i;
    }
    const current = picks[at]!.ship;
    const cheaper = [...cheapestFirst].reverse().find((s) => s.cost < current.cost);
    if (!cheaper) break; // everything is already the cheapest hull
    picks = picks.map((p, i) => (i === at ? { ...p, ship: cheaper } : p));
  }
  // If even five of the cheapest will not fit, shed ships until it does.
  while (picks.length && total() > OUTFIT_BUDGET_K) picks = picks.slice(0, -1);

  return { shipClassIds: picks.map((p) => p.ship.id), spentK: total(), dropped };
}
