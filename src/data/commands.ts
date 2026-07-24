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

/**
 * Action Step options (one per activation, no CMD cost).
 *
 * VERBATIM from the Quick Reference. These were previously condensed - "remove
 * them to your Reserves" for a sentence that actually reads "remove all the
 * ships in this unit from play and place them into your Reserves area" - and a
 * shortened rule is a changed rule. Do not tighten, re-word, or trim these to
 * make them fit a layout; change the layout.
 *
 * The trailing "(action)" is part of the printed name. Asterisks mark the
 * italics the Quick Reference uses to scope a rule (see ruleText).
 */
export const CORE_ACTIONS: CoreAction[] = [
  { name: "Open Fire (action)", text: "Attack with all weapon systems. Roll equal or under Silhouette to hit. Target makes shield saves on the dice that hit. Assigned unsaved hits to damaged ships first. Page XX." },
  { name: "Scan (action)", text: "Scan a single object or ship within 3\" or collect any/all Free-floating asset tokens within 3\"." },
  { name: "Scramble Squadrons (action)", text: "Select one Mass 0 unit carried by the unit and deploy it wholly within 6\". The scrambled unit takes one action and then receives an Activated token." },
  { name: "Jump Hop (action)", text: "If all the ships in this unit are within 6\" of a friendly Jump Point, remove all the ships in this unit from play and set them up within 6\" of a friendly Jump Point in another Sector." },
  { name: "Jump Out (action)", text: "If all the ships in this unit are within 6\" of a friendly Jump Point, remove all the ships in this unit from play and place them into your Reserves area." },
  { name: "Resupply (action)", text: "*Utility Ships only*. Select a friendly Mass 1, 2 or 3 ship to resupply. Until the end of the round, the resupplied ship counts as +1 Mass for the purposes of Blockading, up to a maximum of +ⓜ (where ⓜ is the mass of the resupplied ship)." },
];

/** Commands you spend CMD tokens on. VERBATIM from the Quick Reference. */
export const CORE_COMMANDS: CoreCommand[] = [
  { name: "All Hands", cost: 1, phases: [2], text: "After a friendly unit takes its first action in the Action Step, spend 1 CMD token to take a second (different) action with it." },
  // Re-rolls an initiative die (Command Phase) or an attack/save (Tactical).
  { name: "Executive Oversight", cost: 1, phases: [0, 2], text: "Re-roll one attack die, initiative die or saving throw." },
  { name: "Power to Engines", cost: 1, phases: [2], text: "At the start of a friendly unit's movement step, spend 1 CMD token to move twice during this movement step (pivoting and moving ahead both times)." },
  { name: "Power to Weapons", cost: 1, phases: [2], text: "Before rolling to attack with a friendly unit, spend 1 CMD token to subtract 1 from the result of each attack dice (to a minimum of 1), for the current Salvo. This increases the chance of critical hits but doesn't prevent duds." },
  { name: "Power to Shields", cost: 1, phases: [2], text: "Before rolling Saving Throws with a friendly unit with a Shields value of 1 or more, spend 1 CMD token to add 1 to this unit's Shields value, for the current Salvo only." },
  { name: "Red Alert", cost: 1, phases: [2], text: "When a friendly ship without an Activated token would be destroyed, spend 1 CMD token: it isn't destroyed, and regains 1HP instead. At the end of your next activation, if this ship is still in play, it is reduced to 0HP, and you cannot use Red Alert to save it. If a ship jumps out after using Red Alert, it isn't reduced to 0HP and is saved from destruction, but cannot return to play." },
  { name: "Requisition", cost: 1, shipyardOnly: true, phases: [1], text: "*Hypergrowth only*. When it is your turn to Jump In a unit, you can spend 1 CMD token to form a new unit using the ships in your Shipyard. Pay their cost in Credits. Gather the appropriate miniatures and jump them into play as if they were in your Reserves area." },
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
    text: "Gain CMD tokens. Make Initiative Check: winner picks who gets Initiative. Loser gets +1 CMD token.",
  },
  {
    name: "Jump Phase",
    text: "Take turns. On your turn: Open A Jump Point, Jump In unit (within 6\" of Jump Point), or Pass (take no further turns). If all players have passed, the phase ends.",
  },
  {
    name: "Tactical Phase",
    text: "Take turns. On your turn, Drag To Select a battlegroup and activate it, completing each activation step with all units before starting the next step. After activating a unit, give it an Activated token. If all units have activated, the phase ends.",
  },
  {
    name: "End Phase",
    text: "Clear Activated tokens. Discard unused CMD tokens.",
  },
];

/** The three steps every unit works through when it activates. Quick Reference. */
export const ACTIVATION_STEPS: RoundPhase[] = [
  { name: "Movement Step", text: "Pivot any amount, then move ahead up to Thrust value. Page XX." },
  { name: "Passive Attacks Step", text: "Suffer Passive Attacks. Page XX." },
  { name: "Action Step", text: "Take one Action. Page XX." },
];

/**
 * "Rules You Might Forget", VERBATIM from the Quick Reference. The easy-to-miss
 * geometry and edge cases - arcs, explosion checks, coherence, gravity wells -
 * that a player looks up mid-game rather than memorises.
 */
export const RULES_YOU_MIGHT_FORGET: RoundPhase[] = [
  { name: "Unit Coherence", text: "Ships have to stay within 6\" of all other ships in their unit. Page XX." },
  { name: "Drag To Select a Battlegroup", text: "Select an unactivated unit as lead. Select unactivated units within 6\" of the lead unit, with a combined Mass of 10 or less. Page XX." },
  { name: "Squadron Capacity", text: "A unit can carry a number of Squadrons up to twice its Combined Mass. Page XX." },
  { name: "Attack Dice Damage Values", text: "D6 is 1, D8 is 2, D10 is 3, and D12 is 5." },
  { name: "Primary Arc", text: "45° arc of fire to front. Auxiliary Arc: 180° arc of fire to front. Page XX." },
  { name: "Facilities", text: "360° arc of fire. Will Passive attack every unit in range." },
  { name: "Explosion Check", text: "Roll a D6. If you roll equal to or under the ship's ⓜ, it Explodes and all units within 3\" suffers a ⓜD6 attack, causing 1 damage per hit. Page XX." },
  { name: "Easy Target", text: "If a unit moved less than 3\" and didn't Jump, it is an 'Easy Target': enemy units may re-roll attack dice. Page XX." },
  { name: "Inertial Strain", text: "If any single pivot is more than 90 degrees, ship cannot make Primary attacks. Page XX." },
  { name: "Mother's Wing", text: "radius is 2ⓜ. Can protect Objectives. Page XX." },
  { name: "Escort", text: "Most ships within 6\". Tie-break on greatest Combined Mass within 6\". Page XX." },
  { name: "Blockade", text: "Greatest Combined Mass within 6\". Tie-break on most ships within 6\". Page XX." },
  { name: "Gravity Well", text: "Jump Points cannot be placed within 9\" of a Planetoid. Units cannot jump within 9\" of a Planetoid." },
];
