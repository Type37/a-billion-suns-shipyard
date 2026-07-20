import type { Faction } from "../../types.ts";
import { w } from "../_helpers.ts";

// Golem Mega-Systems, Age of Unity faction (rules p.159-161).
// The book titles the HVP section "Mission Critical Systems (High-Value Personnel)".
export const GOLEM_MEGA_SYSTEMS: Faction = {
  id: "golem-mega-systems",
  name: "Golem Mega-Systems",
  era: "Age of Unity",
  initiative: "2D6",
  cmdTokens: "5",
  rule: {
    name: "Drone Swarms",
    text: "When a unit in this fleet suffers 2 or more damage in a single salvo, place a new Drone within 6\" of the damaged unit. Add this Drone to an existing friendly Drone unit if possible, or else place it as a new unit. (You might want to use tokens for your drones, instead of miniatures.)",
  },
  ships: [
    { id: "drone", name: "Drone", mass: 0, thrust: 8, silhouette: 2, shields: 0,
      primary: [], auxiliary: [w("Light Blasters", 1, "D6", 0, 3)], utilityBays: false, cost: 2 },
    { id: "al-3-harvester", name: "AL-3 Harvester", mass: 1, thrust: 10, silhouette: 4, shields: 0,
      primary: [w("Laser Cannon", 1, "D8", 0, 9)], auxiliary: [], utilityBays: true, auxiliaryUtility: true, cost: 10 },
    { id: "titus-excavator", name: "Titus Excavator", mass: 1, thrust: 6, silhouette: 5, shields: 1,
      primary: [w("Mining Laser", 1, "D12", 0, 2)], auxiliary: [], utilityBays: true, auxiliaryUtility: true, cost: 10 },
    { id: "blackmill-refinery", name: "Blackmill Refinery", mass: 1, thrust: 5, silhouette: 5, shields: 1,
      primary: [], auxiliary: [w("Blasters", 2, "D6", 0, 6)], utilityBays: true, primaryUtility: true, cost: 10 },
    { id: "obelisk-class-processor", name: "Obelisk-Class Processor", mass: 2, thrust: 5, silhouette: 7, shields: 3,
      primary: [], auxiliary: [w("Blasters", 2, "D6", 0, 6)], utilityBays: true, primaryUtility: true, cost: 15 },
    { id: "anvil-class-auto-foundry", name: "Anvil-Class Auto-Foundry", mass: 2, thrust: 3, silhouette: 7, shields: 3,
      primary: [w("Cruise Missiles", 2, "D10", 18, 36)], auxiliary: [w("Blasters", 2, "D6", 0, 6)], utilityBays: false, cost: 30 },
    { id: "director-class-assembly-engine", name: "Director-Class Assembly Engine", mass: 2, thrust: 3, silhouette: 7, shields: 3,
      primary: [w("Light Railguns", 4, "D8", 9, 18)], auxiliary: [w("Blasters", 2, "D6", 0, 6)], utilityBays: false, cost: 30 },
    { id: "dx-1-constructor-dreadnought", name: "DX-1 Constructor Dreadnought", mass: 3, thrust: 4, silhouette: 9, shields: 5,
      primary: [w("Particle Beams", 4, "D10", 12, 24)], auxiliary: [w("Blasters", 2, "D6", 0, 6)], utilityBays: false, cost: 50 },
    { id: "macroforge-supercruiser", name: "Macroforge Supercruiser", mass: 3, thrust: 3, silhouette: 11, shields: 6,
      primary: [w("Heavy Railguns", 2, "D12", 9, 18)], auxiliary: [w("Plasma Batteries", 4, "D6", 0, 9)], utilityBays: false, cost: 80 },
  ],
  hvp: [
    // UNCERTAIN: source extraction reads "place -1 ( minus 1) Drones", with the
    // glyph before "-1" and inside the parenthetical dropped. The dropped glyph
    // is almost certainly the Mass symbol (rendered "M-in-circle" elsewhere in this
    // codebase), i.e. "place M-1 (M minus 1) Drones".
    { id: "assimilation-cluster", name: "Assimilation Cluster",
      rule: "When this fleet destroys an enemy ship, place ⓜ-1 (ⓜ minus 1) Drones within 3\" of it (to a minimum of 0) before it is removed." },
    { id: "adaptive-configuration-processor", name: "Adaptive Configuration Processor",
      rule: "This fleet gains access to the following command: Rapid Reconfiguration (1 CMD): Before attacking, spend 1 CMD to exchange all the dice in your attack dice pool as follows: 1D12 = 1D10 = 2D8 = 4D6. All the dice have to end up as the same type." },
    { id: "forge-overseer-core", name: "Forge-Overseer Core",
      rule: "While there is at least one friendly drone within 3\" of an enemy unit, units in this fleet count the maximum range of their primary weapon system as +4\" to target that enemy unit." },
    { id: "targeting-matrix", name: "Targeting Matrix",
      rule: "While there is at least one friendly drone within 3\" of an enemy unit, units in this fleet count the silhouette of that unit as 1 higher when targeting that enemy unit." },
    { id: "fabrication-cycler", name: "Fabrication Cycler",
      rule: "Friendly Mass 3 units can take a special 'Fabricate' action: remove 5 friendly Drones within 6\" to put a single Mass 2 ship into play within 6\" of this unit." },
    { id: "resource-allocation-algorithm", name: "Resource Allocation Algorithm",
      rule: "When you use a command on a friendly unit in this fleet, you may remove a friendly Drone within 6\" of that unit to reduce the cost of the command by 1 CMD token." },
    // UNCERTAIN: source extraction reads "for every  Drones removed" with a
    // dropped glyph in the gap. Read as the Mass symbol by analogy with the
    // dropped glyphs in Assimilation Cluster, i.e. "for every M Drones".
    { id: "auto-repair-relay", name: "Auto-Repair Relay",
      rule: "At the end of any friendly unit's activation, you may remove any number of friendly Drones within 6\" of that unit: for every ⓜ Drones removed in this way, this unit recovers 1 HP." },
  ],
  playstyle: "Golem Mega-Systems is a living machine, evolving as the battle unfolds, and able to adapt to counter the strengths or exploit the weakness of the enemy. Damage to your ships spawns ever more drones, the utility of which vary depending on the HVP you pick (representing various machine minds or specialist facilities on board your ships). You can build aggressively with Assimilation Cluster, Forge-Overseer and Targeting Matrix, construct a defensive aegis with Auto-Repair Relay and Fabrication Cycler, or make a more tactically flexible hive-machine with Adaptive Configuration Processor and a Resource Allocation Algorithm.",
};
