// Junkspace solo-play reference data, verbatim from the rulebook (p.193-215).
// Costs are in thousands of Juran credits (¢k). Kept unabbreviated on purpose:
// the app shows the full rules text, never a summary.

export interface RollRow {
  roll: string;
  result: string;
  detail?: string;
}

export interface SoloJob {
  /** Playing-card rank. Three are drawn from one shuffled suit each game (p.203). */
  key: string;
  name: string;
  text: string;
  /**
   * The most this Job can pay, in thousands of Juran credits.
   *
   * All thirteen cap at 3, which the book never states as a general rule - it
   * falls out of reading every Job. Recorded per Job anyway: a homebrew Job or
   * an erratum breaks the coincidence, and a hardcoded 3 in the tracker would
   * then be silently wrong.
   */
  capK: number;
  /**
   * When the money arrives. An "end" Job is scored once the game is over and
   * you count what survived; a "game" Job pays the moment something happens at
   * the table and cannot be un-earned.
   */
  pays: "end" | "game";
  /** What this Job does to the Alert Level, if anything. */
  alert?: string;
}

export interface Aggressor {
  blip: string;
  name: string;
  mass: number;
  thrust: number;
  silhouette: number;
  shields: number;
  primary: string;
  auxiliary: string;
}

export interface Perk {
  n: number;
  name: string;
  text: string;
}

// ---------------------------------------------------------------------------
// The round, in solo play (p.205-206)
// ---------------------------------------------------------------------------

export const SOLO_PHASES: { name: string; text: string }[] = [
  {
    name: "Command Phase",
    text: "You gain 5 CMD tokens (this can rise as your outfit gains experience). You do not make an Initiative Check: the Hostiles activate the first ship.",
  },
  {
    name: "Jump Phase",
    text: "Only you act in the Jump Phase. The Hostiles arrive via Blip markers rather than jumping in.",
  },
  {
    name: "Tactical Phase",
    text: "Alternate activating battlegroups, starting with the Hostiles. You form battlegroups as normal; the Hostiles do not, activating one ship at a time. When it is the Hostiles' turn, activate the unactivated Hostile ship with the largest Silhouette (ties: closest to your ships, then random). New command available: Seize Initiative (1 CMD), Junkspace only. At the start of the Tactical Phase, spend 1 CMD to activate the first battlegroup before the Hostiles get a chance to activate a unit.",
  },
  {
    name: "End Phase",
    text: "Increase the Alert Level by 1. Glitch the Blips (roll on the D6 table for each). Then check whether the game has ended.",
  },
];

export const SOLO_SETUP_STEPS: { name: string; text: string }[] = [
  { name: "Generate Jobs", text: "Three Jobs are available each game. Shuffle all the cards of one suit from a standard deck and flip three cards to generate the Jobs for this game." },
  { name: "Set Up Play Area", text: "Play on a 3' by 3' board. Place an Entry Jump Point within 3\" of one corner; place the Exit Jump Point within 3\" of the opposite corner. Divide the table diagonally in half, so the Exit point is at the back of the Hostile half of the table." },
  { name: "Set Up Blip Markers", text: "Shuffle the 8 Blip markers together and deploy them facedown (without looking) in the Hostile table half, each at least 7\" from all other Blip markers." },
  { name: "Set Up Objectives", text: "Set up any additional Objectives, as specified by the Jobs." },
  { name: "The Setup Glitches", text: "After setting up Objectives and Blips, scatter everything D10\". Roll a D10 for each Objective and Blip marker and push it that many inches in the direction indicated by the pointy top of the D10. Stop if it comes within 2\" of a table edge. Jump Points are not scattered." },
];

export const SOLO_ALERT_RULES = [
  "At the start of the game your Alert Level is 1. The game ends when the Alert Level hits 10.",
  "In each End Phase, increase the Alert Level by 1.",
  "When you reveal a Hostile Mass 2-3 ship, increase the Alert Level by 1.",
  "When you destroy a Hostile Mass 2-3 ship, decrease the Alert Level by 2.",
  "As the campaign progresses the starting Alert Level rises: if you have less than ¢25k Debt remaining it starts at 2; if you have cleared your Debt it starts at 3.",
];

export const SOLO_BLIP_RULES = [
  "Manufacture 8 flat Blip markers, numbered 1 to 8 on one side and indistinguishable when turned over.",
  "Blip tokens within 6\" of your ships are revealed. Flip it over without moving it and look up its number on the Aggressor list. Replace it with the indicated ship, facing the nearest of your ships.",
  "If a Blip is revealed during the Tactical Phase, the revealed ship Ambushes you: your activation ends and play passes to the Hostiles, who may immediately activate the revealed ship and attack.",
  "If a Hostile unit is revealed during the End Phase, it does not Ambush you and takes no actions until the new round.",
  "When you use the Open Fire action to attack something, Glitch all Blip tokens within 6\" of that target (after resolving your attack).",
];

// D6 tables the roller drives ------------------------------------------------

export const RANDOM_BEHAVIOUR: RollRow[] = [
  { roll: "1-2", result: "Engage Nearest Enemy, Attack Smartly" },
  { roll: "3-4", result: "Engage Strongest Enemy, Attack Smartly" },
  { roll: "5-6", result: "Defend Nearest Objective, Attack Smartly" },
];

export const GLITCH_BLIP: RollRow[] = [
  { roll: "1-2", result: "Push 3\" towards the Nearest Enemy", detail: "The ship nearest the Blip (ties: highest cost, then random)." },
  { roll: "3-4", result: "Push 3\" towards the Strongest Enemy", detail: "Your ship with the largest Silhouette (ties: most expensive, then random)." },
  { roll: "5-6", result: "Push 3\" towards the Nearest Objective", detail: "Stop as soon as it is within 2\" of that Objective." },
];

export const BEHAVIOUR_ROUTINES = [
  "Strongest Enemy: your ship with the largest Silhouette value. If tied, the most expensive; if still tied, randomise.",
  "Nearest Enemy: whichever of your ships is nearest the active Hostile ship. If tied, the highest cost; if still tied, randomise.",
  "Engage a target: pivot to face it, push its Thrust value towards it (stop once in range of any of its weapons), suffer Passive Attacks, then Attack Smartly.",
  "Defend Nearest Objective: push its Thrust value towards the nearest Objective (stop within 2\"), pivot to face the Strongest Enemy in range of a weapon, suffer Passive Attacks, then Attack Smartly.",
  "Attack Smartly: for each primary and auxiliary weapon system, assign its attack dice to the Engage target, or the Strongest Enemy in range and arc if it cannot. Multiple valid targets: choose the ship with the most damage; if still tied, randomise.",
  "Clipping: if a Hostile ship or Blip token would occupy the same position as another Hostile ship, Blip token or Objective, move it 2\" towards your Entry Jump Point.",
  "Hostiles always make passive attacks if they can. With multiple passive targets they attack the Strongest Enemy. Hostile ships suffer Inertial Strain and Easy Target as normal.",
];

// ---------------------------------------------------------------------------
// The 13 Jobs (p.207-209)
// ---------------------------------------------------------------------------

export const JUNKSPACE_JOBS: SoloJob[] = [
  { key: "A", name: "Hired Hit", text: "At the end of the game: for each Hostile Mass 2-3 ship you have destroyed (to a maximum of three) you earn ¢1k. If you have revealed and destroyed all the Hostile Mass 2-3 ships, you earn ¢3k instead.", capK: 3, pays: "end" },
  { key: "2", name: "Clean Them Out", text: "At the end of the game: earn ¢1k for each Hostile Mass 0-1 ship you destroyed during this game, less ¢1k for each revealed Hostile Mass 0-1 ship still in play at the end of the game. This Job can earn you a minimum of ¢0k and a maximum of ¢3k.", capK: 3, pays: "end" },
  { key: "3", name: "Full Sector Sweep", text: "When you reveal the last unrevealed Blip marker: if the Alert Level is 5 or less, earn ¢3k; if the Alert Level is 6 or 7, earn ¢2k; if the Alert Level is 8+, earn ¢1k.", capK: 3, pays: "game" },
  { key: "4", name: "Shut Them Down", text: "Set up a Hostile Derelict Facility (Mass 4, Silhouette 7, Shields 3, Laser Turrets 3D6 0-6\") in the centre of the board. The first time each Round that you successfully scan the Derelict Facility: earn ¢1k. This job can earn you a maximum of ¢3k.", capK: 3, pays: "game" },
  { key: "5", name: "Destroy the Derelict Facility", text: "Set up a Hostile Derelict Facility in the centre of the board. The first time in the game you cause damage to the Derelict Facility: raise the Alert Level by 1. If the Derelict Facility is destroyed, you earn ¢3k. (If several jobs refer to a Derelict Facility, use a single shared one.)", capK: 3, pays: "end", alert: "+1 the first time you damage the Derelict Facility" },
  { key: "6", name: "Reclamation", text: "Set up 5 Asteroids (Silhouette 9, no Shields) on the Hostile half of the table, each at least 7\" from any other objective. If one of your ships successfully scans an asteroid that has not yet produced a Loot token, place a Loot asset token on that ship. At the end of the game: for each Loot token carried by a friendly ship, earn ¢1k. Maximum ¢3k. (Share one set of Asteroids across jobs.)", capK: 3, pays: "end" },
  { key: "7", name: "Hack the System", text: "If you successfully scan a Hostile Mass 2-3 ship, place a 'Loot Cache Location Data' asset token on the scanning ship and increase the current Alert Level by 2. At the end of the game: if that token is carried by a friendly ship, earn ¢3k.", capK: 3, pays: "end", alert: "+2 when you scan a Hostile Mass 2-3 ship" },
  { key: "8", name: "Break Out", text: "Set up a Secure Facility (Silhouette 7, Shields 3) exactly 12\" from the Exit point and at least 7\" from any other Objective. The first time you successfully scan it, increase the Alert Level by 1. The second time you scan it, place a Prisoner asset token on the scanning ship. At the end of the game: if the Prisoner token is carried by a friendly ship, earn ¢3k.", capK: 3, pays: "end", alert: "+1 the first time you scan the Secure Facility" },
  { key: "9", name: "Call In Trouble", text: "Set up an Old Unity ComSat exactly 12\" from the Exit point and at least 7\" from any other Objective. If you successfully scan it, you have called in the Peacekeepers: place two Hostile Gunships exactly 2\" from the Exit Jump Point and as close to the scanning ship as possible. At the end of the game: if the Peacekeepers were called, for each of your ships that jumped out through the Exit point, earn ¢1k. Maximum ¢3k.", capK: 3, pays: "end" },
  { key: "10", name: "Shake Down", text: "When you successfully scan a Hostile ship that has not yet produced a Loot token, place a Loot asset token on the scanning ship. At the end of the game: for each Loot token carried by a friendly ship, earn ¢1k. Maximum ¢3k.", capK: 3, pays: "end" },
  { key: "J", name: "Demolition Contract", text: "Set up 5 Asteroids (Silhouette 9, no Shields) on the Hostile half of the table, each at least 7\" from any other Objective. At the end of the game: if you have destroyed 2 or 3 asteroids, earn ¢1k; 4 asteroids, ¢2k; all 5 asteroids, ¢3k. (Share one set of Asteroids across jobs.)", capK: 3, pays: "end" },
  { key: "Q", name: "Hack the ComSats", text: "Set up 3 ComSats in the Hostile half of the table, each at least 7\" from any other Objective. The first time during the game that each ComSat is scanned, you earn ¢1k and increase the current Alert Level by 1.", capK: 3, pays: "game", alert: "+1 the first time each ComSat is scanned" },
  { key: "K", name: "Breakthrough", text: "At the end of the game: earn ¢1k for each friendly ship that jumped out through the Exit point. This Job can earn you a maximum of ¢3k.", capK: 3, pays: "end" },
];

// ---------------------------------------------------------------------------
// Aggressors (p.211). The Blip number reveals a single ship of this class.
// ---------------------------------------------------------------------------

// CORRECTED AGAINST THE RENDERED PAGE, August 2026. Every weapon on this table
// was one column out.
//
// p.211's table has a Primary and an Auxiliary column, and the Pirate
// Starfighter has nothing in Primary - so a plain text extraction of that row
// yields one weapon with no way to tell which column it came from, and drops it
// in the first. That shunted Stub Blasters onto the Starfighter's primary,
// pushed Shred Cannons up into the Starfighter's auxiliary, and left the
// Frigate and the Cruiser with NO auxiliary weapons at all.
//
// Which is not cosmetic. Passive attacks are made with auxiliary weapons only
// (p.38), and Take No Prisoners below re-rolls the first miss "when attacking
// with auxiliary weapons" - so under the old data the two biggest pirates in
// the game could never make a passive attack and never used their own faction
// rule. The Starfighter really does have no primary weapon.
export const JUNKSPACE_PIRATES: Aggressor[] = [
  { blip: "1-4", name: "Pirate Starfighter", mass: 0, thrust: 6, silhouette: 3, shields: 0, primary: "", auxiliary: "Stub Blasters [2D6, 0-3\"]" },
  { blip: "5-6", name: "Pirate Gunship", mass: 1, thrust: 6, silhouette: 4, shields: 1, primary: "Blasters [2D6, 0-6\"]", auxiliary: "Stub Blasters [2D6, 0-3\"]" },
  { blip: "7", name: "Pirate Frigate", mass: 2, thrust: 6, silhouette: 6, shields: 2, primary: "Light Railguns [2D8, 9-18\"]", auxiliary: "Shred Cannons [3D6, 0-5\"]" },
  { blip: "8", name: "Pirate Cruiser", mass: 3, thrust: 6, silhouette: 8, shields: 4, primary: "Plasma Torpedoes [2D10, 6-12\"]", auxiliary: "Shred Cannons [3D6, 0-5\"]" },
];

/**
 * Which pirate a Blip number turns out to be (p.211).
 *
 * The table prints the mapping as a range inside a column ("1-4"), which is how
 * you read it off the page and useless as a lookup. Eight entries, keyed by the
 * number printed on the marker.
 */
export const BLIP_TO_PIRATE: Record<number, string> = {
  1: "Pirate Starfighter",
  2: "Pirate Starfighter",
  3: "Pirate Starfighter",
  4: "Pirate Starfighter",
  5: "Pirate Gunship",
  6: "Pirate Gunship",
  7: "Pirate Frigate",
  8: "Pirate Cruiser",
};

/** Eight markers, numbered 1 to 8 (p.197). */
export const BLIP_COUNT = 8;

export const PIRATE_RULE =
  "Take No Prisoners: Pirate ships re-roll the first miss when attacking with auxiliary weapons. (You are free to invent your own sets of enemy ships: borrow ship classes from the main factions and a special rule from an HVP.)";

// ---------------------------------------------------------------------------
// Post-game Perks (p.213-215), rolled on a D12 by pilot class.
// ---------------------------------------------------------------------------

export const GUNNER_PERKS: Perk[] = [
  { n: 1, name: "Apex Hunter", text: "Increase your Primary weapon systems' maximum range by 8\" and your Auxiliary weapon systems' maximum range by 2\"." },
  { n: 2, name: "Backstab", text: "When making attacks from outside the target's Auxiliary arc of fire, your unsaved hits each do 1 additional damage." },
  { n: 3, name: "Deadeye", text: "When you Open Fire, subtract 1 from the result of each attack die, to a minimum of 1. This raises the chance of critical hits but does not prevent duds." },
  { n: 4, name: "Dogfighter", text: "You may make an additional pivot at the end of your Move Step." },
  { n: 5, name: "Down In Flames", text: "When you would be destroyed, you can make a final Open Fire action before making your explosion check and being removed from play." },
  { n: 6, name: "Full-Auto", text: "When you Open Fire, roll an extra attack die of the same type." },
  { n: 7, name: "Kill Confirmed", text: "When you destroy a Hostile ship, you gain a CMD token." },
  { n: 8, name: "Killer Instincts", text: "After damaging a target, if the target has only 1HP remaining, you can attack them again." },
  { n: 9, name: "Overload", text: "Your critical hits cause 3 hits, not 2." },
  { n: 10, name: "Slick", text: "Increase this pilot's Initiative Value by 1D6." },
  { n: 11, name: "Snapfire", text: "After you are Ambushed, you can take the Open Fire action before the activation ends." },
  { n: 12, name: "Raptor", text: "You ignore the Inertial Strain rule and cannot gain Easy Target tokens." },
];

export const HAULER_PERKS: Perk[] = [
  { n: 1, name: "Auto-Repair Routines", text: "At the start of your activation, regain 1 HP." },
  { n: 2, name: "Brace", text: "While you have an Activated token, you gain +1 to your Shields value." },
  { n: 3, name: "Bulkhead", text: "Once per activation, this unit can suffer 1 damage to use a Command for 0 CMD tokens (this damage cannot be ignored)." },
  { n: 4, name: "Covering Fire", text: "Spend 1 CMD token to count your Auxiliary arc of fire as 360 degrees for this activation only." },
  { n: 5, name: "Endurance", text: "Count your ship's Shield value as 1 higher permanently." },
  { n: 6, name: "Grav Anchor", text: "Hostile units within 6\" reduce their Thrust value to 2\"." },
  { n: 7, name: "Ironheart", text: "When rolling your Shield saving throws, rolls of a 1 cancel two hits, not one." },
  { n: 8, name: "Old Dependable", text: "While within 3\" of this ship, friendly ships subtract 1 from the result of each of their attack dice, to a minimum of 1. This raises the chance of critical hits but does not prevent duds." },
  { n: 9, name: "Shields of Steel", text: "While within 3\" of this ship, friendly ships increase their shield value by 1." },
  { n: 10, name: "Snapfire", text: "After you are Ambushed, you can take the Open Fire action before the activation ends." },
  { n: 11, name: "Turbo-Spanner", text: "You can take the Patch Up action in your Action Step: regain D3 HP." },
  { n: 12, name: "What Are Friends For?", text: "If a friendly ship within 3\" suffers hits, you may suffer up to 3 of those hits instead of them." },
];

export const JUNKER_PERKS: Perk[] = [
  { n: 1, name: "Crackpot Rigger", text: "While you have one or more damage or asset tokens, you may re-roll missed attacks once." },
  { n: 2, name: "Dazzle", text: "When it is your turn, spend 2 CMD to activate this ship even if it has an Activated token. Once per Round." },
  { n: 3, name: "Elite Skills", text: "Hostile ships cannot attack you if they are more than 3\" away." },
  { n: 4, name: "Goblin", text: "At the end of the Action Step, you automatically collect all Free-floating tokens within 6\"." },
  { n: 5, name: "Ghost", text: "When this ship would cause a Blip marker to be revealed, you can choose not to reveal it." },
  { n: 6, name: "Knob-Twiddler", text: "You increase the range of your Scan action by +6\"." },
  { n: 7, name: "Multi-tasking", text: "You may take a Scan action for free (it does not count as your action)." },
  { n: 8, name: "Quarterback", text: "You gain +1 CMD token at the start of each round." },
  { n: 9, name: "Rogue", text: "Increase this pilot's Initiative Value by 2D6." },
  { n: 10, name: "Signal Jam", text: "After rolling for a Hostile ship's behaviour, you can spend 1 CMD token to re-roll the die." },
  { n: 11, name: "Tag", text: "After damaging a target, give it an Easy Target token." },
  { n: 12, name: "Turbo-Spanner", text: "You can take the Patch Up action in your Action Step: regain D3 HP." },
];

export const PERKS_BY_CLASS = {
  Gunner: GUNNER_PERKS,
  Hauler: HAULER_PERKS,
  Junker: JUNKER_PERKS,
} as const;
