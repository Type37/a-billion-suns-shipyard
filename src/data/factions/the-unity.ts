import type { Faction } from "../../types.ts";
import { w } from "../_helpers.ts";

// The Unity: Age of Unity faction (rules p.151-153).
export const THE_UNITY: Faction = {
  id: "the-unity",
  name: "The Unity",
  era: "Age of Unity",
  initiative: "3D6",
  cmdTokens: "7",
  rule: {
    name: "Mobile Force",
    text: "When a Squadron is destroyed, set it aside. In the Command Phase, move all such set aside Squadrons into Reserve. You can scramble Squadron units in Reserve from any friendly Mass 2 or Mass 3 unit, as if they were already being carried by it.",
  },
  // Table rows reconstructed from drifted pdftotext output: 9 names and 9 stat
  // rows paired in printed order (anchored by the wrapped "M2 Light Fighter
  // Wing" name around the first stats row).
  ships: [
    { id: "m2-light-fighter-wing", name: "M2 Light Fighter Wing", mass: 0, thrust: 8, silhouette: 2, shields: 0,
      primary: [], auxiliary: [w("Light Blasters", 2, "D6", 0, 3)], utilityBays: false, cost: 2 },
    { id: "io-fighter-wing", name: "IO Fighter Wing", mass: 0, thrust: 6, silhouette: 3, shields: 0,
      primary: [], auxiliary: [w("Blasters", 2, "D6", 0, 6)], utilityBays: false, cost: 4 },
    { id: "bomber-wing", name: "Bomber Wing", mass: 0, thrust: 6, silhouette: 3, shields: 0,
      primary: [w("Torpedoes", 1, "D10", 6, 12)], auxiliary: [], utilityBays: false, cost: 5 },
    { id: "fighter-bomber-wing", name: "Fighter-Bomber Wing", mass: 0, thrust: 4, silhouette: 4, shields: 1,
      primary: [w("Ion Torpedoes", 1, "D8", 6, 12)], auxiliary: [w("Blasters", 1, "D6", 0, 6)], utilityBays: false, cost: 7 },
    { id: "troop-transport", name: "Troop Transport", mass: 1, thrust: 5, silhouette: 4, shields: 1,
      primary: [w("Ion Torpedoes", 1, "D8", 6, 12)], auxiliary: [], utilityBays: true, auxiliaryUtility: true, cost: 10 },
    { id: "patrol-monitor", name: "Patrol Monitor", mass: 1, thrust: 3, silhouette: 4, shields: 1,
      primary: [w("Particle Beams", 1, "D10", 12, 24)], auxiliary: [w("Blasters", 2, "D6", 0, 6)], utilityBays: false, cost: 12 },
    { id: "void-cruiser", name: "Void Cruiser", mass: 2, thrust: 8, silhouette: 5, shields: 2,
      primary: [w("Plasma Torpedoes", 2, "D10", 6, 12)], auxiliary: [w("Turbo Blasters", 4, "D6", 0, 6)], utilityBays: false, cost: 20 },
    { id: "battlecarrier", name: "Battlecarrier", mass: 3, thrust: 6, silhouette: 8, shields: 5,
      primary: [w("Micro Missiles", 8, "D6", 12, 24)], auxiliary: [w("Defence Grid", 4, "D8", 0, 9)], utilityBays: false, cost: 45 },
    { id: "dreadnaught", name: "Dreadnaught", mass: 3, thrust: 6, silhouette: 9, shields: 6,
      primary: [w("Heavy Railguns", 2, "D12", 9, 18)], auxiliary: [w("Defence Grid", 4, "D8", 0, 9)], utilityBays: false, cost: 60 },
  ],
  hvp: [
    { id: "brutal-wing-commander", name: "Brutal Wing Commander",
      rule: "Mass 0 units in this fleet can take the Red Alert command for 0 CMD Tokens." },
    // UNCERTAIN: pdftotext dropped a glyph, printing "by +\" (i.e. 3\")". The Vyke
    // Drone-Warden (p.163) uses the circled-M range symbol ("to 3M-circle\""), so the
    // dropped glyph is read as that symbol in both places here.
    { id: "chief-engineer", name: "Chief Engineer",
      rule: "Ships in this fleet increase the range of their Mother's Wing effect by +ⓜ\" (i.e. 3ⓜ\")." },
    { id: "commissar", name: "Commissar",
      rule: "While under Mother's Wing, ships in this fleet subtract 1 from the result of each of their attack dice, to a minimum of 1. This increases the chance of critical hits, but doesn't prevent duds." },
    { id: "flight-controller", name: "Flight Controller",
      rule: "Ships in this fleet may take the Scramble action as an additional free action." },
    { id: "the-hand-of-the-registrar", name: "The Hand of the Registrar",
      rule: "You start each Round with 3 additional CMD tokens that can only be spent on this unit." },
    { id: "tractor-beam-officer", name: "Tractor Beam Officer",
      rule: "Units in this fleet have access to the following command: Tractor Beam Locked On (1 CMD): After damaging an enemy unit with a lower Mass, spend 1 CMD to give the target unit a 'Trapped' token. A unit with a Trapped token reduces its Thrust value to 2\" until the end of its next activation." },
    { id: "weapons-officer", name: "Weapons Officer",
      rule: "During its Action Step, this unit can gain an Easy Target token to Open Fire as a free action (and can Open Fire a second time by use of this effect)." },
  ],
  playstyle: "A backbone of devastating capital ships supported by endless waves of starfighters. Field enough wings to take full advantage of your faction ability and overwhelm the enemy with both small-arms fire and artillery.",
};
