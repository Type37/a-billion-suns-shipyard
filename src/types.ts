// Core domain types for A Billion Suns 2E fleet building.
// Shared across all eras and game modes.

export type Era = "Hypergrowth" | "Age of Unity" | "Armageddon";

/**
 * The playable game modes (rules: Eras of Play p.73, Basic Training p.59,
 * Junkspace p.193). Factions belong to an Era; a fleet is built for a Mode.
 * Any faction may be used in any era-mode (rules p.141 sidebar).
 */
export type GameMode =
  | "combat-simulator"
  | "management-training"
  | "armageddon"
  | "age-of-unity"
  | "hypergrowth"
  | "junkspace";

/** Which builder shape a mode uses (see memory: 3 eras -> 2 builder shapes, + solo). */
export type BuilderShape = "fleet-list" | "shipyard" | "outfit";

export const MODE_BUILDER_SHAPE: Record<GameMode, BuilderShape> = {
  "combat-simulator": "fleet-list", // build your own ¢300bn fleet, or use the Training Fleet (p.62)
  "management-training": "shipyard", // uses the Training Fleet as a Shipyard (p.65)
  armageddon: "fleet-list",
  "age-of-unity": "fleet-list",
  hypergrowth: "shipyard",
  junkspace: "outfit",
};

/** Ship Mass. Drives unit-size limits: Mass 3 units are always a single ship. */
export type Mass = 0 | 1 | 2 | 3;

export type DieType = "D6" | "D8" | "D10" | "D12";

/** Damage per unsaved hit is fixed by the attack-die type (rules p.42). */
export const DAMAGE_BY_DIE: Record<DieType, number> = {
  D6: 1,
  D8: 2,
  D10: 3,
  D12: 5,
};

/** The Alliance of Non-Human Worlds tags every unit with a species (Fractious Coalition). */
export type AllianceSpecies = "Rannari" | "Yynnx" | "Gorgronti";
export const ALLIANCE_SPECIES: readonly AllianceSpecies[] = ["Rannari", "Yynnx", "Gorgronti"];

export interface Weapon {
  name: string;
  /** Number of attack dice (the N in "NdX"). */
  count: number;
  die: DieType;
  /** Inches. */
  rangeMin: number;
  rangeMax: number;
}

export interface ShipClass {
  /** Unique within a faction. */
  id: string;
  name: string;
  mass: Mass;
  /** Movement, in inches. */
  thrust: number;
  /** Silhouette: highest die roll that hits, and the ship's starting HP. */
  silhouette: number;
  shields: number;
  /** Primary weapon systems (45° arc). Empty if the primary slot holds Utility Bays or nothing. */
  primary: Weapon[];
  /** Auxiliary weapon systems (180° arc). Empty if the aux slot holds Utility Bays or nothing. */
  auxiliary: Weapon[];
  /** True if a weapon slot is "Utility Bays" - makes the ship a Utility Ship (p.58). */
  utilityBays: boolean;
  /** True when the primary slot specifically holds Utility Bays (for spec-table rendering). */
  primaryUtility?: boolean;
  /** True when the auxiliary slot specifically holds Utility Bays (for spec-table rendering). */
  auxiliaryUtility?: boolean;
  /**
   * Non-weapon auxiliary fitting printed in the spec table (e.g. Junkspace
   * Recon Ship "Long-Range Scanners", p.202).
   */
  auxiliaryFitting?: string;
  /** Cost in billions of credits, per single ship of this class. */
  cost: number;
  /** Optional uploaded ship art (downscaled data URL). Shown in catalog/roster. */
  image?: string;
}

export interface Hvp {
  /** Unique across the whole catalog (faction + generic). */
  id: string;
  name: string;
  rule: string;
  /** True if this HVP may be carried by a Mass 0 unit (e.g. Gen Ω "The Nameless Punk"). */
  canEmbarkMass0?: boolean;
}

export interface FactionRule {
  name: string;
  text: string;
}

export interface Faction {
  id: string;
  name: string;
  era: Era;
  /** Initiative dice pool, e.g. "2D6" (kept as text; not used by build validation). */
  initiative: string;
  /** CMD tokens per Command Phase, e.g. "9" or "D12" (text; not used by build validation). */
  cmdTokens: string;
  rule: FactionRule;
  ships: ShipClass[];
  hvp: Hvp[];
  /** Optional uploaded emblem image (downscaled data URL). Custom factions only. */
  emblemImage?: string;
  /** Optional icon-library id (see web/emblems.ts). */
  emblemLib?: string;
  /** When true, every unit in a fleet must declare a species (Alliance only). */
  requiresSpecies?: boolean;
  /**
   * HVP selection bounds. Default 3..3 ("you select three", p.141).
   * The Discord's "Aces and Heroes" allows 3, 4 or 5 (p.156).
   */
  hvpMin?: number;
  hvpMax?: number;
  /** One-line strengths/playstyle note from the faction page, for the picker UI. */
  playstyle?: string;
}

// ---------------------------------------------------------------------------
// Fleet list (the thing the user builds)
// ---------------------------------------------------------------------------

export interface FleetUnit {
  /** Instance id, unique within the fleet. Referenced by HVP assignments. */
  id: string;
  /** References a ShipClass.id within the selected faction. */
  shipClassId: string;
  /** Number of ships in this unit. */
  count: number;
  /** Required only when the faction requires species (Alliance). */
  species?: AllianceSpecies;
  /** Player-given unit name (e.g. "Task Force Beta"). Cosmetic. */
  name?: string;
  /** Player-given names for the individual ships, index-aligned with count. Cosmetic. */
  shipNames?: string[];
}

export interface FleetHvp {
  /** References an Hvp.id from the faction list or the generic list. */
  hvpId: string;
  /** Optional at build time; if set, must reference a fleet unit (Mass >= 1 except Nameless Punk). */
  assignedUnitId?: string;
  /**
   * Player-given personal name, printed alongside the title (p.57 "Naming Your
   * HVP": not just "Chief Engineer" but "Lt. Commander Sadie Hyatt, Chief Engineer").
   */
  customName?: string;
}

/** Fleet List - the pre-built list used by Armageddon, Age of Unity, Combat Simulator. */
export interface Fleet {
  name?: string;
  factionId: string;
  /** Agreed credits limit. Recommended values: 300 / 400 / 500 (p.80). */
  creditsLimit: number;
  units: FleetUnit[];
  hvp: FleetHvp[];
  /** Freeform player notes (tactics, list rationale, reminders). */
  notes?: string;
}

// ---------------------------------------------------------------------------
// Shipyard (Hypergrowth / Management Training)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Outfit (Junkspace solo play)
// ---------------------------------------------------------------------------

/** Junkspace pilot classes (p.202). Each ship has exactly one pilot. */
export type PilotClass = "Gunner" | "Hauler" | "Junker";
export const PILOT_CLASSES: readonly PilotClass[] = ["Gunner", "Hauler", "Junker"];

export interface OutfitShip {
  /** Instance id, unique within the outfit. */
  id: string;
  /** References a Junkspace ShipClass.id. Costs are in ¢k (thousands), not ¢bn. */
  shipClassId: string;
  pilotClass: PilotClass;
  /** Cosmetic names. */
  shipName?: string;
  pilotName?: string;
}

/**
 * Outfit - Junkspace's builder shape (p.201): "You get ¢30k with which to buy
 * ships, and you can buy up to a maximum of 5 ships." In Junkspace, all units
 * consist of exactly one ship (p.195).
 */
export interface Outfit {
  name?: string;
  /** Budget in ¢k. 30 at campaign start. */
  creditsLimit: number;
  ships: OutfitShip[];
}

