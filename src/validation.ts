import type { Fleet, ShipClass, Hvp, Mass } from "./types.ts";
import { ALLIANCE_SPECIES } from "./types.ts";
import { defaultCatalog, type Catalog } from "./data/index.ts";

// ---------------------------------------------------------------------------
// Issue model
// ---------------------------------------------------------------------------

export type Severity = "error" | "warning";

export type IssueCode =
  | "FACTION_UNKNOWN"
  | "FLEET_EMPTY"
  | "LIMIT_INVALID"
  | "OVER_BUDGET"
  | "UNIT_ID_DUPLICATE"
  | "UNIT_NOT_IN_ROSTER"
  | "UNIT_COUNT_INVALID"
  | "UNIT_SIZE_EXCEEDED"
  | "UNIT_SPECIES_REQUIRED"
  | "UNIT_SPECIES_INVALID"
  | "UNIT_SPECIES_UNEXPECTED"
  | "HVP_COUNT"
  | "HVP_DUPLICATE"
  | "HVP_NOT_AVAILABLE"
  | "HVP_ASSIGN_UNKNOWN_UNIT"
  | "HVP_ASSIGN_MASS0"
  | "HVP_NO_CARRIER";

export interface ValidationIssue {
  code: IssueCode;
  severity: Severity;
  message: string;
  /** Index into fleet.units, when the issue concerns a specific unit. */
  unitIndex?: number;
  unitId?: string;
  /** Index into fleet.hvp, when the issue concerns a specific HVP selection. */
  hvpIndex?: number;
  hvpId?: string;
}

export interface ValidationResult {
  valid: boolean;
  totalCost: number;
  creditsLimit: number;
  creditsRemaining: number;
  issues: ValidationIssue[];
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
}

/** Canonical Armageddon credits limits (rules p.80). */
export const STANDARD_LIMITS: readonly number[] = [300, 400, 500];

/** Number of HVP every fleet selects (rules p.80). */
export const HVP_REQUIRED = 3;

/** Maximum ships in a unit, by ship Mass. Mass 3 units are always a single ship. */
export function maxUnitSize(mass: Mass): number {
  return mass === 3 ? 1 : 3;
}

// ---------------------------------------------------------------------------
// Validator
// ---------------------------------------------------------------------------

export function validateFleet(fleet: Fleet, catalog: Catalog = defaultCatalog): ValidationResult {
  const issues: ValidationIssue[] = [];
  const add = (i: ValidationIssue) => issues.push(i);

  const faction = catalog.getFaction(fleet.factionId);
  const limit = fleet.creditsLimit;

  // Resolve faction first. Without it, roster checks are meaningless.
  if (!faction) {
    add({
      code: "FACTION_UNKNOWN",
      severity: "error",
      message: `Unknown faction "${fleet.factionId}".`,
    });
    return finalize(issues, 0, limit);
  }

  // --- Credits limit sanity -------------------------------------------------
  if (!Number.isFinite(limit) || !Number.isInteger(limit) || limit <= 0) {
    add({
      code: "LIMIT_INVALID",
      severity: "error",
      message: `Credits limit must be a positive whole number (got ${String(limit)}).`,
    });
  }
  // Any positive whole-number limit is allowed; non-standard values are not
  // flagged (players agree their own limit).

  // --- Empty fleet ----------------------------------------------------------
  if (fleet.units.length === 0) {
    add({ code: "FLEET_EMPTY", severity: "error", message: "A fleet must contain at least one unit." });
  }

  // --- Units ----------------------------------------------------------------
  const shipById = new Map<string, ShipClass>(faction.ships.map((s) => [s.id, s]));
  const seenUnitIds = new Set<string>();
  /** Resolved ship Mass per unit id, used later for HVP assignment checks. */
  const unitMass = new Map<string, Mass>();
  let totalCost = 0;

  fleet.units.forEach((unit, unitIndex) => {
    if (seenUnitIds.has(unit.id)) {
      add({
        code: "UNIT_ID_DUPLICATE",
        severity: "error",
        message: `Duplicate unit id "${unit.id}". Unit ids must be unique within a fleet.`,
        unitIndex,
        unitId: unit.id,
      });
    }
    seenUnitIds.add(unit.id);

    const ship = shipById.get(unit.shipClassId);
    if (!ship) {
      add({
        code: "UNIT_NOT_IN_ROSTER",
        severity: "error",
        message: `Ship class "${unit.shipClassId}" is not available to ${faction.name}.`,
        unitIndex,
        unitId: unit.id,
      });
    } else {
      unitMass.set(unit.id, ship.mass);

      // Count must be a positive integer.
      if (!Number.isInteger(unit.count) || unit.count < 1) {
        add({
          code: "UNIT_COUNT_INVALID",
          severity: "error",
          message: `Unit "${unit.id}" must contain at least one ship (got ${String(unit.count)}).`,
          unitIndex,
          unitId: unit.id,
        });
      } else {
        const max = maxUnitSize(ship.mass);
        if (unit.count > max) {
          add({
            code: "UNIT_SIZE_EXCEEDED",
            severity: "error",
            message:
              ship.mass === 3
                ? `${ship.name} is Mass 3: a unit may contain only 1 ship (got ${unit.count}).`
                : `A unit may contain at most ${max} ships (got ${unit.count}).`,
            unitIndex,
            unitId: unit.id,
          });
        }
        // Cost counts only when the ship resolves and the count is usable.
        totalCost += ship.cost * unit.count;
      }
    }

    // Species (Alliance: Fractious Coalition).
    if (faction.requiresSpecies) {
      if (unit.species === undefined) {
        add({
          code: "UNIT_SPECIES_REQUIRED",
          severity: "error",
          message: `${faction.name} requires every unit to declare a species (Rannari, Yynnx or Gorgronti). Unit "${unit.id}" has none.`,
          unitIndex,
          unitId: unit.id,
        });
      } else if (!ALLIANCE_SPECIES.includes(unit.species)) {
        add({
          code: "UNIT_SPECIES_INVALID",
          severity: "error",
          message: `Unit "${unit.id}" has invalid species "${String(unit.species)}".`,
          unitIndex,
          unitId: unit.id,
        });
      }
    } else if (unit.species !== undefined) {
      add({
        code: "UNIT_SPECIES_UNEXPECTED",
        severity: "warning",
        message: `Unit "${unit.id}" declares a species but ${faction.name} does not use species. It will be ignored.`,
        unitIndex,
        unitId: unit.id,
      });
    }
  });

  // --- Budget ---------------------------------------------------------------
  if (Number.isInteger(limit) && limit > 0 && totalCost > limit) {
    add({
      code: "OVER_BUDGET",
      severity: "error",
      message: `Fleet costs ¢${totalCost}bn, over the ¢${limit}bn limit by ¢${totalCost - limit}bn.`,
    });
  }

  // --- HVP ------------------------------------------------------------------
  const allowedHvp = new Map<string, Hvp>();
  for (const h of faction.hvp) allowedHvp.set(h.id, h);
  for (const h of catalog.genericHvp) allowedHvp.set(h.id, h);

  // Three is the standard, but a faction may print its own range - The Discord's
  // "Aces and Heroes" takes 3 to 5 (p.170). The builder already offers the wider
  // range, so the validator has to honour the same numbers or it rejects a
  // legal fleet the UI invited the player to build.
  const hvpMin = faction.hvpMin ?? HVP_REQUIRED;
  const hvpMax = faction.hvpMax ?? HVP_REQUIRED;
  if (fleet.hvp.length < hvpMin || fleet.hvp.length > hvpMax) {
    add({
      code: "HVP_COUNT",
      severity: "error",
      message:
        hvpMin === hvpMax
          ? `A fleet must select exactly ${hvpMin} HVP (got ${fleet.hvp.length}).`
          : `${faction.name} must select between ${hvpMin} and ${hvpMax} HVP (got ${fleet.hvp.length}).`,
    });
  }

  const fleetHasCarrier = [...unitMass.values()].some((m) => m >= 1);

  fleet.hvp.forEach((sel, hvpIndex) => {
    const def = allowedHvp.get(sel.hvpId);
    if (!def) {
      add({
        code: "HVP_NOT_AVAILABLE",
        severity: "error",
        message: `HVP "${sel.hvpId}" is not available to ${faction.name} (must be a ${faction.name} HVP or a generic HVP).`,
        hvpIndex,
        hvpId: sel.hvpId,
      });
    }

    // Only one of each HVP type may ride in a fleet at a time. The builder UI
    // already prevents this, but a hand-edited or older shared list could
    // still carry a duplicate, so it is still flagged here.
    if (fleet.hvp.findIndex((other) => other.hvpId === sel.hvpId) !== hvpIndex) {
      add({
        code: "HVP_DUPLICATE",
        severity: "error",
        message: `"${def?.name ?? sel.hvpId}" is selected more than once; only one of each HVP type is allowed.`,
        hvpIndex,
        hvpId: sel.hvpId,
      });
    }

    // Assignment (optional at build time, but validated when present).
    if (sel.assignedUnitId !== undefined) {
      if (!seenUnitIds.has(sel.assignedUnitId)) {
        add({
          code: "HVP_ASSIGN_UNKNOWN_UNIT",
          severity: "error",
          message: `HVP "${sel.hvpId}" is assigned to unknown unit "${sel.assignedUnitId}".`,
          hvpIndex,
          hvpId: sel.hvpId,
        });
      } else {
        const mass = unitMass.get(sel.assignedUnitId);
        const canMass0 = def?.canEmbarkMass0 === true;
        if (mass === 0 && !canMass0) {
          add({
            code: "HVP_ASSIGN_MASS0",
            severity: "error",
            message: `HVP "${sel.hvpId}" must ride a unit of Mass 1 or higher; "${sel.assignedUnitId}" is Mass 0.`,
            hvpIndex,
            hvpId: sel.hvpId,
          });
        }
      }
    }
  });

  // If the fleet fields no Mass >= 1 unit, only canEmbarkMass0 HVP can ever be carried.
  if (!fleetHasCarrier && fleet.units.length > 0) {
    const nonMass0 = fleet.hvp.filter((sel) => allowedHvp.get(sel.hvpId)?.canEmbarkMass0 !== true);
    if (nonMass0.length > 0) {
      add({
        code: "HVP_NO_CARRIER",
        severity: "warning",
        message: `This fleet has no Mass 1+ unit to carry HVP. ${nonMass0.length} of your HVP cannot be deployed.`,
      });
    }
  }

  return finalize(issues, totalCost, limit);
}

function finalize(issues: ValidationIssue[], totalCost: number, limit: number): ValidationResult {
  const errors = issues.filter((i) => i.severity === "error");
  const warnings = issues.filter((i) => i.severity === "warning");
  const safeLimit = Number.isFinite(limit) ? limit : 0;
  return {
    valid: errors.length === 0,
    totalCost,
    creditsLimit: safeLimit,
    creditsRemaining: safeLimit - totalCost,
    issues,
    errors,
    warnings,
  };
}

// ---------------------------------------------------------------------------
// Convenience helpers
// ---------------------------------------------------------------------------

/** Total credits cost of a fleet, ignoring validity. */
export function fleetCost(fleet: Fleet, catalog: Catalog = defaultCatalog): number {
  const faction = catalog.getFaction(fleet.factionId);
  if (!faction) return 0;
  const shipById = new Map(faction.ships.map((s) => [s.id, s]));
  let total = 0;
  for (const unit of fleet.units) {
    const ship = shipById.get(unit.shipClassId);
    if (ship && Number.isInteger(unit.count) && unit.count > 0) total += ship.cost * unit.count;
  }
  return total;
}
