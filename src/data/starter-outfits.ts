import type { PilotClass } from "../types.ts";

// Ready-made Outfits offered in the "Start a new outfit" dialog, so a first-time
// solo player has a crew on the table in one click instead of a blank ¢30k
// budget. Both are legal openers: 5 ships or fewer, total cost <= ¢30k (the
// Junkspace starting purse, p.201), ship ids from JUNKSPACE_SHIPS.
//
// PILOT names are drawn from the user's own "🎌" callsign pool in their Steel
// Rift builder (Gravity Rush Nevi + Vampire Hunter D). Do NOT invent names for
// these - pull from that list.
//
// SHIPS are deliberately unnamed. A ready-made crew should hand you people and
// hulls, not a set of decisions already made on your behalf: an unnamed ship
// shows its class ("Light Freighter") in the field, which tells you what it is
// AND leaves the naming - the part of this game that is yours - undone and
// obviously available. A pilot is different: a pilot is a person, and a person
// arrives with a name.

export interface StarterOutfitShip {
  shipClassId: string;
  pilotClass: PilotClass;
  pilotName: string;
}

export interface StarterOutfit {
  /** Stable key used by the create action. */
  key: string;
  name: string;
  /** One line for the picker: who they are and what the ships are. */
  blurb: string;
  ships: StarterOutfitShip[];
}

export const STARTER_OUTFITS: StarterOutfit[] = [
  {
    key: "greylancer",
    name: "Greylancer",
    blurb: "Salvage crew working the burn belts — a hauler, two scouts, and just enough guns to keep them.",
    // 10 + 2 + 2 + 5 + 10 = 29k, 5 ships.
    ships: [
      { shipClassId: "light-freighter", pilotClass: "Hauler", pilotName: "Wiseman" },
      { shipClassId: "recon-ship", pilotClass: "Junker", pilotName: "Kururu" },
      { shipClassId: "recon-ship", pilotClass: "Junker", pilotName: "Bengé" },
      { shipClassId: "starfighter", pilotClass: "Gunner", pilotName: "Nolt" },
      { shipClassId: "gunship", pilotClass: "Gunner", pilotName: "Gillis" },
    ],
  },
  {
    key: "valcua",
    name: "Valcua",
    blurb: "Bounty hunters with no patience for a long game — a corvette, a bomber, and teeth.",
    // 15 + 8 + 5 + 2 = 30k, 4 ships.
    ships: [
      { shipClassId: "corvette", pilotClass: "Gunner", pilotName: "Rocambole" },
      { shipClassId: "bomber", pilotClass: "Gunner", pilotName: "Xenon" },
      { shipClassId: "starfighter", pilotClass: "Gunner", pilotName: "Rei-Ginsei" },
      { shipClassId: "recon-ship", pilotClass: "Junker", pilotName: "Samon" },
    ],
  },
];
