import type { Faction } from "../../types.ts";
import { w } from "../_helpers.ts";

// The Discord, Age of Unity faction (rules p.156-158).
// The extracted spec table drifted ship names off their stat lines; the 9 names
// and 9 stat rows were re-paired in printed order (both sequences preserve the
// table order, so the pairing is unambiguous).
export const THE_DISCORD: Faction = {
  id: "the-discord",
  name: "The Discord",
  era: "Age of Unity",
  initiative: "4D6",
  cmdTokens: "5",
  rule: {
    name: "Aces and Heroes",
    text: "You select 3, 4 or 5 HVP for your fleet. Your HVP tokens can be carried by your Mass 0 units. Your units regain an additional HP when they use the Red Alert command if they are carrying a friendly HVP token.",
  },
  // Aces and Heroes: "You select 3, 4 or 5 HVP for your fleet."
  hvpMin: 3,
  hvpMax: 5,
  // ...and "Your HVP tokens can be carried by your Mass 0 units", which is the
  // whole point of the faction - their squadrons are their strength, and the
  // core Mass 1+ rule would bar personnel from four of their nine ship classes.
  hvpMass0Carriers: true,
  ships: [
    { id: "viper-interceptor-wing", name: "Viper Interceptor Wing", mass: 0, thrust: 10, silhouette: 2, shields: 1,
      primary: [], auxiliary: [w("Blasters", 2, "D6", 0, 6)], utilityBays: false, cost: 8 },
    { id: "cobra-starfighter-wing", name: "Cobra Starfighter Wing", mass: 0, thrust: 6, silhouette: 3, shields: 1,
      primary: [], auxiliary: [w("Turbo Blasters", 4, "D6", 0, 6)], utilityBays: false, cost: 12 },
    { id: "rapter-assault-fighters", name: "Rapter Assault Fighters", mass: 0, thrust: 6, silhouette: 3, shields: 2,
      primary: [w("Ion Torpedoes", 1, "D8", 6, 12)], auxiliary: [w("Auto Blasters", 1, "D6", 0, 6)], utilityBays: false, cost: 15 },
    { id: "buffalo-heavy-bombers", name: "Buffalo Heavy Bombers", mass: 0, thrust: 4, silhouette: 4, shields: 2,
      primary: [w("Torpedoes", 1, "D10", 6, 12)], auxiliary: [], utilityBays: false, cost: 10 },
    { id: "light-freighter", name: "Light Freighter", mass: 1, thrust: 6, silhouette: 4, shields: 2,
      primary: [], auxiliary: [w("Laser Cannon", 2, "D8", 0, 9)], utilityBays: true, primaryUtility: true, cost: 10 },
    { id: "vanguard-corvette", name: "Vanguard Corvette", mass: 2, thrust: 8, silhouette: 5, shields: 3,
      primary: [w("Turbo Blasters", 4, "D6", 0, 6)], auxiliary: [w("Blasters", 2, "D6", 0, 6)], utilityBays: false, cost: 25 },
    { id: "escort-frigate", name: "Escort Frigate", mass: 2, thrust: 5, silhouette: 6, shields: 4,
      primary: [w("Light Railguns", 2, "D8", 9, 18)], auxiliary: [w("Turbo Blasters", 4, "D6", 0, 6)], utilityBays: false, cost: 30 },
    { id: "assault-carrier", name: "Assault Carrier", mass: 3, thrust: 8, silhouette: 7, shields: 4,
      primary: [], auxiliary: [w("Defence Grid", 4, "D8", 0, 9)], utilityBays: true, primaryUtility: true, cost: 40 },
    { id: "command-ship", name: "Command Ship", mass: 3, thrust: 5, silhouette: 8, shields: 5,
      primary: [w("Heavy Railguns", 2, "D12", 9, 18)], auxiliary: [w("Defence Grid", 4, "D8", 0, 9)], utilityBays: false, cost: 55 },
  ],
  // canEmbarkMass0 on every Discord HVP: Aces and Heroes says "Your HVP tokens
  // can be carried by your Mass 0 units."
  hvp: [
    { id: "battle-hardened-admiral", name: "Battle-Hardened Admiral", canEmbarkMass0: true,
      rule: "When this unit activates, give one enemy unit within 12\" an Easy Target token." },
    { id: "fallen-princess", name: "Fallen Princess", canEmbarkMass0: true,
      rule: "This fleet gains access to the following command: Heroic Intervention (2 CMD): When it is your turn to activate a battlegroup, spend 2 CMD to remove an Activated token from a friendly unit." },
    { id: "gorgronti-veteran", name: "Gorgronti Veteran", canEmbarkMass0: true,
      rule: "Units in this fleet may assign incoming damage to a friendly unit of a higher mass within 6\" (this reassigned damage cannot be reassigned)." },
    { id: "hot-shot-pilot", name: "Hot-Shot Pilot", canEmbarkMass0: true,
      rule: "This unit's critical hits add D12s to the dice pool, rather than another of the same dice size. (Those D12s cause 5 damage.)" },
    { id: "idealistic-diplomat", name: "Idealistic Diplomat", canEmbarkMass0: true,
      rule: "Each ship in this unit counts as two ships for the purposes of Escorting, and counts their Mass as 1 higher for the purposes of Blockading." },
    { id: "impetuous-flight-commander", name: "Impetuous Flight Commander", canEmbarkMass0: true,
      rule: "Units in this fleet using the Scramble Squadrons action, may deploy within 12\" of the active unit (instead of 6\") and may Jump Hop from and to within 12\" of friendly Jump Points in different Sectors (instead of 6\")." },
    { id: "rebellious-tactician", name: "Rebellious Tactician", canEmbarkMass0: true,
      rule: "This fleet gains access to the following command: Co-ordinated Strike (1 CMD): When it is your turn to activate a battlegroup, spend 1 CMD to add any unactivated units to your battlegroup, even ones in different Sectors. (Your battlegroup must still total a combined mass of 10 or less.)" },
  ],
  playstyle: "The Discord are an elite faction with strong squadrons and powerful personnel. They lack hard-hitting ranged firepower, outside of their Command Ship, but the squadrons can provide much of the damage output. You are likely to take the initiative and have a bunch of tools to control the flow of the battle, then strike hard where needed.",
};
