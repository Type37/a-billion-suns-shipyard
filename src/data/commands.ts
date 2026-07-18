// The core Actions and Commands every fleet can use, transcribed verbatim from
// the A Billion Suns Second Edition Quick Reference. Actions are the one-per-
// activation options a unit chooses in its Action Step; Commands are the things
// you spend CMD tokens on. Faction rules, HVP, and scenario rules can GRANT
// EXTRA commands or change their cost - those ride on the individual rule text
// (faction.rule, each Hvp.rule, mode rules) and are aggregated onto the printed
// sheet alongside these, so the sheet shows everything a player can actually do.

export interface CoreAction {
  name: string;
  text: string;
}

export interface CoreCommand {
  name: string;
  /** CMD tokens to spend. */
  cost: number;
  text: string;
  /** Some commands only exist in certain modes (Requisition is Hypergrowth). */
  shipyardOnly?: boolean;
}

/** Action Step options (one per activation, no CMD cost). Quick Reference. */
export const CORE_ACTIONS: CoreAction[] = [
  { name: "Open Fire", text: "Attack with all weapon systems. Roll equal to or under Silhouette to hit. Target rolls Shield saves against the dice that hit. Assign unsaved hits to already-damaged ships first." },
  { name: "Scan", text: "Scan a single object or ship within 3\", or collect any or all Free-floating asset tokens within 3\"." },
  { name: "Scramble Squadrons", text: "Deploy one carried Mass 0 unit wholly within 6\". It takes one action, then gets an Activated token." },
  { name: "Jump Hop", text: "If all ships are within 6\" of a friendly Jump Point, remove them and set up within 6\" of a friendly Jump Point in another Sector." },
  { name: "Jump Out", text: "If all ships are within 6\" of a friendly Jump Point, remove them to your Reserves." },
  { name: "Resupply (Utility Ships)", text: "Select a friendly Mass 1–3 ship; until end of round it counts as +1 Mass for Blockading, up to its own Mass." },
];

/** Commands you spend CMD tokens on. Quick Reference. */
export const CORE_COMMANDS: CoreCommand[] = [
  { name: "All Hands", cost: 1, text: "After a unit's first action, take a second, different action with it." },
  { name: "Executive Oversight", cost: 1, text: "Re-roll one attack die, initiative die, or saving throw." },
  { name: "Power to Engines", cost: 1, text: "At the start of a unit's movement step, move twice this step (pivot and move both times)." },
  { name: "Power to Weapons", cost: 1, text: "Before rolling to attack, subtract 1 from each attack die (min 1) for this Salvo. More crits; does not prevent duds." },
  { name: "Power to Shields", cost: 1, text: "Before rolling saves (Shields 1+), add 1 to the unit's Shields for this Salvo." },
  { name: "Red Alert", cost: 1, text: "A friendly ship without an Activated token that would be destroyed is not; it regains 1HP. At the end of its next activation it drops to 0HP (no second Red Alert), unless it jumped out." },
  { name: "Requisition", cost: 1, shipyardOnly: true, text: "On your Jump In turn, form a new unit from Shipyard ships, pay their Credit cost, and jump them in as if from Reserves." },
];
