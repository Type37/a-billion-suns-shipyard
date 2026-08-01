import type { PilotClass } from "../types.ts";

// Ready-made Outfits offered in the "Start a new outfit" dialog, so a first-time
// solo player has a crew on the table in one click instead of a blank ¢30k
// budget. Both are legal openers: 5 ships or fewer, total cost <= ¢30k (the
// Junkspace starting purse, p.201), ship ids from JUNKSPACE_SHIPS.
//
// Every name here is drawn from the user's own "🎌" callsign pool in their Steel
// Rift builder (Gravity Rush Nevi + Vampire Hunter D). Do NOT invent names for
// these - pull from that list.

export interface StarterOutfitShip {
  shipClassId: string;
  pilotClass: PilotClass;
  shipName: string;
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
      { shipClassId: "light-freighter", pilotClass: "Hauler", shipName: "Nushi", pilotName: "Wiseman" },
      { shipClassId: "recon-ship", pilotClass: "Junker", shipName: "Shiga", pilotName: "Kururu" },
      { shipClassId: "recon-ship", pilotClass: "Junker", shipName: "Minaye", pilotName: "Bengé" },
      { shipClassId: "starfighter", pilotClass: "Gunner", shipName: "Taki", pilotName: "Nolt" },
      { shipClassId: "gunship", pilotClass: "Gunner", shipName: "Mashira", pilotName: "Gillis" },
    ],
  },
  {
    key: "valcua",
    name: "Valcua",
    blurb: "Bounty hunters with no patience for a long game — a corvette, a bomber, and teeth.",
    // 15 + 8 + 5 + 2 = 30k, 4 ships.
    ships: [
      { shipClassId: "corvette", pilotClass: "Gunner", shipName: "Sunhawk", pilotName: "Rocambole" },
      { shipClassId: "bomber", pilotClass: "Gunner", shipName: "Braujou", pilotName: "Xenon" },
      { shipClassId: "starfighter", pilotClass: "Gunner", shipName: "Garou", pilotName: "Rei-Ginsei" },
      { shipClassId: "recon-ship", pilotClass: "Junker", shipName: "Iriya", pilotName: "Samon" },
    ],
  },
];
