import type { Faction } from "../../types.ts";
import { w } from "../_helpers.ts";

// The Alliance of Non-Human Worlds - Armageddon faction (rules p.170-171).
// Fractious Coalition: every unit must declare a species (Rannari / Yynnx / Gorgronti).
export const ALLIANCE: Faction = {
  id: "alliance",
  name: "The Alliance of Non-Human Worlds",
  era: "Armageddon",
  initiative: "1D6",
  cmdTokens: "D12",
  requiresSpecies: true,
  rule: {
    name: "Fractious Coalition",
    text: "When adding a unit to your fleet, you must state if it is from the Rannari, Yynnx or Gorgronti species. You cannot form Battlegroups containing units from multiple species. Also gains: Alliance of Necessity (1 CMD): Select a friendly unit. Count this unit as being of another species until the end of the round.",
  },
  ships: [
    { id: "recon-wing", name: "Recon Wing", mass: 0, thrust: 8, silhouette: 2, shields: 0,
      primary: [w("Blasters", 2, "D6", 0, 6)], auxiliary: [], utilityBays: false, cost: 3 },
    { id: "patrol-wing", name: "Patrol Wing", mass: 0, thrust: 6, silhouette: 3, shields: 0,
      primary: [w("Blasters", 1, "D6", 0, 6)], auxiliary: [w("Auto Blasters", 3, "D6", 0, 6)], utilityBays: false, cost: 6 },
    { id: "bomber-wing", name: "Bomber Wing", mass: 0, thrust: 4, silhouette: 3, shields: 0,
      primary: [w("Ion Torpedoes", 2, "D8", 6, 12)], auxiliary: [], utilityBays: false, cost: 6 },
    { id: "tug", name: "Tug", mass: 1, thrust: 3, silhouette: 4, shields: 1,
      primary: [], auxiliary: [w("Light Blasters", 2, "D6", 0, 3)], utilityBays: true, cost: 5 },
    { id: "striker", name: "Striker", mass: 1, thrust: 6, silhouette: 5, shields: 2,
      primary: [w("Torpedoes", 1, "D10", 6, 12)], auxiliary: [w("Auto Blasters", 3, "D6", 0, 6)], utilityBays: false, cost: 14 },
    { id: "mining-ship", name: "Mining Ship", mass: 2, thrust: 5, silhouette: 6, shields: 3,
      primary: [w("Laser Cannon", 1, "D8", 0, 9)], auxiliary: [], utilityBays: true, cost: 12 },
    { id: "frigate", name: "Frigate", mass: 2, thrust: 6, silhouette: 7, shields: 4,
      primary: [w("Cruise Missiles", 1, "D10", 18, 36)], auxiliary: [w("Laser Cannon", 2, "D8", 0, 9)], utilityBays: false, cost: 28 },
    { id: "cruiser", name: "Cruiser", mass: 3, thrust: 4, silhouette: 8, shields: 5,
      primary: [w("Cyclone Array", 6, "D6", 12, 24)], auxiliary: [w("Defence Grid", 3, "D8", 0, 9)], utilityBays: false, cost: 36 },
    { id: "supercruiser", name: "Supercruiser", mass: 3, thrust: 3, silhouette: 10, shields: 6,
      primary: [w("Planet Smasher", 1, "D12", 12, 24)], auxiliary: [w("Defence Grid", 4, "D8", 0, 9)], utilityBays: false, cost: 70 },
  ],
  hvp: [
    { id: "gorgronti-magtech-overseer", name: "Gorgronti Magtech Overseer",
      rule: "Gorgronti units in this fleet gain: Tractor Beam Locked On (1 CMD): After damaging an enemy unit with a lower Mass, spend 1 CMD to give the target a 'Trapped' token (Thrust reduced to 2\" until the end of its next activation)." },
    { id: "gorgronti-safety-inspector", name: "Gorgronti Safety Inspector",
      rule: "Gorgronti units in this fleet may re-roll failed Shields saving throws once per salvo." },
    { id: "rannari-hunt-mistress", name: "Rannari Hunt-Mistress",
      rule: "When a Rannari unit in this fleet attacks, reduce the target's Shields value by the target's ⓜ." },
    { id: "rannari-void-stalker", name: "Rannari Void Stalker",
      rule: "Rannari units in this fleet roll a D6 at the start of their activation: increase their Thrust by that many inches for the rest of this activation." },
    { id: "yynnx-cipher-warden", name: "Yynnx Cipher Warden",
      rule: "Yynnx units in this fleet can Jump In and Jump Hop using enemy Jump Points. When they do, all in-play Jump Points count as connected." },
    { id: "yynnx-data-wraith", name: "Yynnx Data Wraith",
      rule: "Units in this unit's battlegroup cannot be targeted by passive attacks." },
    { id: "the-council-of-heth-memnah", name: "The Council of Heth-Memnah",
      rule: "In the Command Phase, you gain an additional 3 CMD tokens (e.g. D12+3 in total)." },
  ],
};
