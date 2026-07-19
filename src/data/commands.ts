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

/** Round phases, in order, matching the Play Mode phase track. */
export const PHASE_COMMAND = { command: 0, jump: 1, tactical: 2, end: 3 } as const;

export interface CoreCommand {
  name: string;
  /** CMD tokens to spend. */
  cost: number;
  text: string;
  /** Some commands only exist in certain modes (Requisition is Hypergrowth). */
  shipyardOnly?: boolean;
  /**
   * Which round phases this command can actually be spent in, by index into the
   * Play Mode phase track (0 Command, 1 Jump, 2 Tactical, 3 End). Derived from
   * each command's own timing wording in the Quick Reference - e.g. Requisition
   * says "on your Jump In turn", Power to Engines "at the start of a unit's
   * movement step". Used to show only what's usable right now during play.
   */
  phases: number[];
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
  { name: "All Hands", cost: 1, phases: [2], text: "After a unit's first action, take a second, different action with it." },
  // Re-rolls an initiative die (Command Phase) or an attack/save (Tactical).
  { name: "Executive Oversight", cost: 1, phases: [0, 2], text: "Re-roll one attack die, initiative die, or saving throw." },
  { name: "Power to Engines", cost: 1, phases: [2], text: "At the start of a unit's movement step, move twice this step (pivot and move both times)." },
  { name: "Power to Weapons", cost: 1, phases: [2], text: "Before rolling to attack, subtract 1 from each attack die (min 1) for this Salvo. More crits; does not prevent duds." },
  { name: "Power to Shields", cost: 1, phases: [2], text: "Before rolling saves (Shields 1+), add 1 to the unit's Shields for this Salvo." },
  { name: "Red Alert", cost: 1, phases: [2], text: "A friendly ship without an Activated token that would be destroyed is not; it regains 1HP. At the end of its next activation it drops to 0HP (no second Red Alert), unless it jumped out." },
  { name: "Requisition", cost: 1, shipyardOnly: true, phases: [1], text: "On your Jump In turn, form a new unit from Shipyard ships, pay their Credit cost, and jump them in as if from Reserves." },
];

/** One phase of the round. Transcribed from the Quick Reference. */
export interface RoundPhase {
  name: string;
  text: string;
}

/**
 * The four phases of a round, verbatim from the Quick Reference. Kept as source
 * text rather than paraphrased: a summary written from memory got the Tactical
 * Phase wrong, describing an activation as "move, then fire any weapons whose
 * arc covers a target" - which skips the Passive Attacks Step entirely and
 * implies firing is automatic rather than one of the Actions you may choose.
 */
export const ROUND_PHASES: RoundPhase[] = [
  {
    name: "Command Phase",
    text: "Gain CMD tokens (set by your faction). Make an Initiative Check: the winner picks who has Initiative; each loser gets +1 CMD token.",
  },
  {
    name: "Jump Phase",
    text: "Take turns. On your turn: Open a Jump Point, Jump In a unit (deploy within 6\" of a friendly Jump Point), or Pass. Ends when all players have passed.",
  },
  {
    name: "Tactical Phase",
    text: "Take turns. Drag to Select a battlegroup and activate it, finishing each step for every unit before the next. Give each activated unit an Activated token. Ends when all units have activated.",
  },
  {
    name: "End Phase",
    text: "Check mission scoring. Clear Activated tokens. Discard unused CMD tokens. Begin a new round.",
  },
];

/** The three steps every unit works through when it activates. Quick Reference. */
export const ACTIVATION_STEPS: RoundPhase[] = [
  { name: "Movement Step", text: "Pivot any amount, then move ahead up to the Thrust value." },
  { name: "Passive Attacks Step", text: "Suffer passive attacks from enemies in range and arc." },
  { name: "Action Step", text: "Take one Action." },
];
