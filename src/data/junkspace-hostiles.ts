// Junkspace hostiles: the pirates, Blips, Glitch, Hostile Behaviour and its
// routines, transcribed verbatim from Jet's copy of the Junkspace chapter
// (screenshots and pasted text, 1 October 2026; pp.197-200 and p.211). Shown
// on the Solo Play tab so a game can be run from the app without the book open
// at these pages. Jobs are deliberately NOT here: Jet plays them from cards.
//
// Where Jet's copy and the Layouts 7 PDF in Documents/ differ, Jet's copy wins
// (the Pirate Cruiser's Thrust is 3" in it, 6" in the PDF).
//
// "(see page XX)" is the book's own unfinished cross-reference, kept as printed.

export interface RuleEntry {
  /** Bold lead-in, printed before the text. */
  name?: string;
  text: string;
  /** Indented steps under the entry (Engage, Defend Nearest Objective). */
  steps?: string[];
}

export const PIRATES_INTRO =
  "The Jura system is filled with violent and desperate people, as well as some crooked and criminal ones too. Wherever you go to try and make a spacebuck, you can be certain that your jetstreams will be dogged by pirates of one stripe or another. The “Blip” numbers in the tables indicate which Blip marker reveals a single ship of this class.";

export const PIRATES_NOTE =
  "You should feel free to invent your own sets of enemy ships to harass your solo games. Maybe take some of the ship classes from the main factions and borrow a special rule from an HVP.";

export const REVEALING_BLIPS: RuleEntry[] = [
  {
    text: "Blip tokens within 6” of your ships are revealed. To reveal a Blip, flip it over without altering its position, and look up its number against your Aggressor list. Replace the Blip marker with the indicated ship, facing the nearest of your ships. If this happens during the Tactical Phase, the revealed ship Ambushes you.",
  },
  {
    text: "If a Hostile unit is revealed during the End Phase, it doesn’t Ambush you (and doesn’t take any actions until the new round).",
  },
];

export const AMBUSH =
  "When a Hostile unit is revealed in the Tactical Phase, it Ambushes you: your activation ends. Play passes to the Hostiles, meaning they might get to immediately activate the revealed ship and attack.";

export const BLIP_REACTIONS =
  "When you use the Open Fire action to attack something, Glitch all Blip tokens within 6” of that target (after resolving your Open Fire action).";

export const GLITCH_INTRO =
  "When instructed to ‘Glitch’ a Blip token, roll a D6 on this table and carry out the instructions:";

export const GLITCH_TABLE: [string, string][] = [
  ["1–2", "Push 3” towards the Nearest Enemy."],
  ["3–4", "Push 3” towards the Strongest Enemy."],
  ["5–6", "Push 3” towards the Nearest Objective."],
];

const CLIPPING: RuleEntry = {
  name: "Clipping:",
  text: "If a Hostile ship or Blip token wants to occupy the same position as another Hostile Ship, Blip token or Objective for any reason, move it 2” towards your Entry Jump Point.",
};

export const GLITCH_RULES: RuleEntry[] = [
  {
    name: "Push 3” towards the Strongest Enemy:",
    text: "Pick your ship with the largest Silhouette value. If tied, pick the most expensive ship. If still tied, randomise. Push the Blip token 3” towards it.",
  },
  {
    name: "Push 3” towards the Nearest Enemy:",
    text: "Pick whichever of your ships is nearest to the Blip token. If there’s a tie, pick the tied ship with the highest cost. If still tied, randomise. Push the Blip token 3” towards it.",
  },
  {
    name: "Push 3” towards the Nearest Objective:",
    text: "Push the Blip token 3” towards the objective nearest to it (but stop as soon as it is within 2” of that Objective).",
  },
  CLIPPING,
];

export const HOSTILE_BEHAVIOUR =
  "Hostile ships follow set behaviour when activated. They are mostly aggressive but may attempt to defend Objectives.";

export const RANDOM_BEHAVIOUR_INTRO =
  "When you activate a Hostile ship, roll a D6 on this table and carry out the instructions:";

export const RANDOM_BEHAVIOUR_TABLE: [string, string][] = [
  ["1–2", "Engage Nearest Enemy, Attack Smartly"],
  ["3–4", "Engage Strongest Enemy, Attack Smartly"],
  ["5–6", "Defend Nearest Objective, Attack Smartly."],
];

export const RANDOM_BEHAVIOUR_AFTER = "All of the words in this table refer to ‘routines’ that are described below.";

export const ROUTINES: RuleEntry[] = [
  {
    name: "Strongest Enemy:",
    text: "Pick your ship with the largest Silhouette value. If tied, pick the most expensive ship. If still tied, randomise.",
  },
  {
    name: "Nearest Enemy:",
    text: "Pick whichever of your ships is nearest to the active Hostile ship. If there’s a tie, pick the tied ship with the highest cost. If still tied, randomise.",
  },
  {
    name: "Engage:",
    text: "When instructed to ‘Engage’ a particular target:",
    steps: [
      "Pivot this ship to face the target.",
      "Push this ship its Thrust value towards the target (but stop as soon as the target is in range of any of the active ship’s weapons).",
      "Suffer Passive Attacks.",
      "Attack Smartly.",
    ],
  },
  {
    name: "Defend Nearest Objective:",
    text: "When instructed to ‘Defend Nearest Objective’:",
    steps: [
      "Push this ship its Thrust value towards the Objective nearest to it (but stop as soon as it is within 2” of that Objective).",
      "Pivot to face the Strongest Enemy within range of one or more of its weapons (with the priority of bringing its primary weapon system to bear).",
      "Suffer Passive Attacks.",
      "Attack Smartly.",
    ],
  },
  {
    name: "Attack Smartly:",
    text: "When instructed to ‘Attack Smartly’, for each of the active ship’s primary and auxiliary weapon systems: assign the attack dice to its Engage target, or to the Strongest Enemy within range and arc if it cannot. If there are multiple equally valid targets, choose the ship with the most damage. If still tied, randomise.",
  },
  CLIPPING,
];

export const HOSTILES_NOTE = "Note: Hostile Ships suffer from Inertial Strain and Easy Target as normal.";

export const ACTIVATING_HOSTILES =
  "When it is the Hostiles’ turn to activate, you activate the unactivated Hostile ship with the largest Silhouette. If there are multiple ships that match these criteria, pick the one closest to your ships. If still tied, randomise between them. During their activations, you control the Hostiles, but you follow their Behaviour rules (see page XX).";

export const HOSTILE_PASSIVE_ATTACKS =
  "Hostiles always make passive attacks if they can. If they have multiple passive targets, they attack the Strongest Enemy.";
