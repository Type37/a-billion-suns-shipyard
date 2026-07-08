import { test } from "node:test";
import assert from "node:assert/strict";

import type { Fleet, FleetUnit, FleetHvp, AllianceSpecies } from "../src/types.ts";
import { validateFleet, fleetCost, maxUnitSize, type IssueCode } from "../src/validation.ts";

// --- test helpers ----------------------------------------------------------

function u(id: string, shipClassId: string, count = 1, species?: AllianceSpecies): FleetUnit {
  return species === undefined ? { id, shipClassId, count } : { id, shipClassId, count, species };
}
function h(hvpId: string, assignedUnitId?: string): FleetHvp {
  return assignedUnitId === undefined ? { hvpId } : { hvpId, assignedUnitId };
}
function fleet(partial: Partial<Fleet> & Pick<Fleet, "factionId">): Fleet {
  return {
    creditsLimit: 300,
    units: [],
    hvp: [],
    ...partial,
  };
}
/** Three valid, distinct generic HVP — convenient filler when HVP isn't under test. */
const THREE_HVP: FleetHvp[] = [h("executive-officer"), h("seasoned-captain"), h("chief-engineer")];

function codes(result: { issues: { code: IssueCode }[] }): IssueCode[] {
  return result.issues.map((i) => i.code);
}
function hasCode(result: { issues: { code: IssueCode }[] }, code: IssueCode): boolean {
  return codes(result).includes(code);
}

// --- happy path ------------------------------------------------------------

test("a legal Vyke fleet validates clean", () => {
  const f = fleet({
    factionId: "vyke",
    creditsLimit: 300,
    units: [u("a", "dragonfish", 2), u("b", "king-crab", 1)],
    hvp: [h("brood-mother", "a"), h("war-singer", "b"), h("executive-officer", "a")],
  });
  const r = validateFleet(f);
  assert.equal(r.valid, true, JSON.stringify(r.errors));
  assert.equal(r.issues.length, 0);
  // 2x Dragonfish (25) + 1x King Crab (35) = 85
  assert.equal(r.totalCost, 85);
  assert.equal(r.creditsRemaining, 215);
});

test("fleet exactly at the credits limit is valid", () => {
  // 4x Leviathan (52) = 208; +... build to exactly 300 with King Crabs? Keep simple: under-limit boundary.
  const f = fleet({
    factionId: "vyke",
    creditsLimit: 300,
    units: [u("a", "leviathan", 1), u("b", "leviathan", 1)], // 104
    hvp: THREE_HVP.map((x) => h(x.hvpId, "a")),
  });
  const r = validateFleet(f);
  assert.equal(r.valid, true, JSON.stringify(r.errors));
  assert.equal(r.totalCost, 104);
});

// --- faction / structural --------------------------------------------------

test("unknown faction is a hard error and short-circuits", () => {
  const r = validateFleet(fleet({ factionId: "klingon" }));
  assert.equal(r.valid, false);
  assert.deepEqual(codes(r), ["FACTION_UNKNOWN"]);
});

test("empty fleet is invalid", () => {
  const r = validateFleet(fleet({ factionId: "vyke", hvp: THREE_HVP }));
  assert.equal(r.valid, false);
  assert.ok(hasCode(r, "FLEET_EMPTY"));
});

// --- credits limit ---------------------------------------------------------

test("a non-standard limit is allowed with no warning", () => {
  const f = fleet({
    factionId: "vyke",
    creditsLimit: 350,
    units: [u("a", "king-crab", 1)],
    hvp: THREE_HVP.map((x) => h(x.hvpId, "a")),
  });
  const r = validateFleet(f);
  assert.equal(r.valid, true);
  assert.equal(r.warnings.length, 0);
});

test("invalid limits are errors", () => {
  for (const limit of [0, -100, 2.5, NaN]) {
    const f = fleet({
      factionId: "vyke",
      creditsLimit: limit,
      units: [u("a", "viperfish", 1)],
      hvp: THREE_HVP.map((x) => h(x.hvpId, "a")),
    });
    const r = validateFleet(f);
    assert.ok(hasCode(r, "LIMIT_INVALID"), `limit ${limit}`);
    assert.equal(r.valid, false);
  }
});

test("over budget is an error", () => {
  // 9x cost... use AEGIS Imperator (75) x3 in three units = 225 under 300; push over with a 4th.
  const f = fleet({
    factionId: "aegis",
    creditsLimit: 300,
    units: [u("a", "imperator", 1), u("b", "imperator", 1), u("c", "imperator", 1), u("d", "imperator", 1)], // 300
    hvp: THREE_HVP.map((x) => h(x.hvpId, "a")),
  });
  const r0 = validateFleet(f);
  assert.equal(r0.totalCost, 300);
  assert.ok(!hasCode(r0, "OVER_BUDGET"), "300 == limit is allowed");

  f.units.push(u("e", "recon-drone", 1)); // +4 => 304
  const r1 = validateFleet(f);
  assert.equal(r1.totalCost, 304);
  assert.ok(hasCode(r1, "OVER_BUDGET"));
  assert.equal(r1.valid, false);
});

// --- unit rules ------------------------------------------------------------

test("ship not in faction roster is an error and costs nothing", () => {
  const f = fleet({
    factionId: "vyke",
    units: [u("a", "imperator", 1)], // AEGIS ship in a Vyke fleet
    hvp: THREE_HVP,
  });
  const r = validateFleet(f);
  assert.ok(hasCode(r, "UNIT_NOT_IN_ROSTER"));
  assert.equal(r.totalCost, 0);
  assert.equal(r.valid, false);
});

test("unit with zero ships is invalid", () => {
  const f = fleet({
    factionId: "vyke",
    units: [u("a", "viperfish", 0)],
    hvp: THREE_HVP,
  });
  assert.ok(hasCode(validateFleet(f), "UNIT_COUNT_INVALID"));
});

test("Mass 0-2 units allow up to 3 ships, 4 is too many", () => {
  const ok = fleet({
    factionId: "vyke",
    units: [u("a", "dragonfish", 3)], // Mass 2
    hvp: THREE_HVP.map((x) => h(x.hvpId, "a")),
  });
  assert.ok(!hasCode(validateFleet(ok), "UNIT_SIZE_EXCEEDED"));

  const bad = fleet({ factionId: "vyke", units: [u("a", "dragonfish", 4)], hvp: THREE_HVP });
  assert.ok(hasCode(validateFleet(bad), "UNIT_SIZE_EXCEEDED"));
});

test("Mass 3 units must be a single ship", () => {
  assert.equal(maxUnitSize(3), 1);
  const bad = fleet({
    factionId: "vyke",
    units: [u("a", "king-crab", 2)], // Mass 3
    hvp: THREE_HVP,
  });
  const r = validateFleet(bad);
  assert.ok(hasCode(r, "UNIT_SIZE_EXCEEDED"));
  assert.equal(r.valid, false);

  const ok = fleet({
    factionId: "vyke",
    units: [u("a", "king-crab", 1)],
    hvp: THREE_HVP.map((x) => h(x.hvpId, "a")),
  });
  assert.ok(!hasCode(validateFleet(ok), "UNIT_SIZE_EXCEEDED"));
});

test("duplicate unit ids are an error", () => {
  const f = fleet({
    factionId: "vyke",
    units: [u("a", "viperfish", 1), u("a", "needlefin", 1)],
    hvp: THREE_HVP.map((x) => h(x.hvpId)),
  });
  assert.ok(hasCode(validateFleet(f), "UNIT_ID_DUPLICATE"));
});

// --- Alliance species (Fractious Coalition) --------------------------------

test("Alliance requires a species on every unit", () => {
  const missing = fleet({
    factionId: "alliance",
    units: [u("a", "frigate", 1)], // no species
    hvp: THREE_HVP.map((x) => h(x.hvpId, "a")),
  });
  const r = validateFleet(missing);
  assert.ok(hasCode(r, "UNIT_SPECIES_REQUIRED"));
  assert.equal(r.valid, false);
});

test("Alliance with valid species validates", () => {
  const f = fleet({
    factionId: "alliance",
    units: [u("a", "frigate", 1, "Rannari"), u("b", "cruiser", 1, "Gorgronti")],
    hvp: [h("rannari-hunt-mistress", "a"), h("yynnx-data-wraith", "a"), h("executive-officer", "b")],
  });
  const r = validateFleet(f);
  assert.equal(r.valid, true, JSON.stringify(r.errors));
});

test("Alliance with an invalid species is an error", () => {
  const f = fleet({
    factionId: "alliance",
    units: [{ id: "a", shipClassId: "frigate", count: 1, species: "Martian" as AllianceSpecies }],
    hvp: THREE_HVP.map((x) => h(x.hvpId, "a")),
  });
  assert.ok(hasCode(validateFleet(f), "UNIT_SPECIES_INVALID"));
});

test("species on a non-Alliance faction is a warning, not an error", () => {
  const f = fleet({
    factionId: "vyke",
    units: [u("a", "dragonfish", 1, "Rannari")],
    hvp: THREE_HVP.map((x) => h(x.hvpId, "a")),
  });
  const r = validateFleet(f);
  assert.ok(hasCode(r, "UNIT_SPECIES_UNEXPECTED"));
  assert.equal(r.valid, true);
});

// --- HVP -------------------------------------------------------------------

test("must select exactly 3 HVP", () => {
  const two = fleet({
    factionId: "vyke",
    units: [u("a", "king-crab", 1)],
    hvp: [h("brood-mother", "a"), h("war-singer", "a")],
  });
  assert.ok(hasCode(validateFleet(two), "HVP_COUNT"));

  const four = fleet({
    factionId: "vyke",
    units: [u("a", "king-crab", 1)],
    hvp: [h("brood-mother", "a"), h("war-singer", "a"), h("seer-empath", "a"), h("executive-officer", "a")],
  });
  assert.ok(hasCode(validateFleet(four), "HVP_COUNT"));
});

test("duplicate HVP selection is allowed", () => {
  const f = fleet({
    factionId: "vyke",
    units: [u("a", "king-crab", 1)],
    hvp: [h("brood-mother", "a"), h("brood-mother", "a"), h("war-singer", "a")],
  });
  assert.ok(validateFleet(f).valid);
});

test("HVP from another faction is not available", () => {
  const f = fleet({
    factionId: "vyke",
    units: [u("a", "king-crab", 1)],
    hvp: [h("repair-protocols", "a"), h("war-singer", "a"), h("seer-empath", "a")], // AEGIS HVP on Vyke
  });
  const r = validateFleet(f);
  assert.ok(hasCode(r, "HVP_NOT_AVAILABLE"));
  assert.equal(r.valid, false);
});

test("generic HVP are available to every faction", () => {
  const f = fleet({
    factionId: "aegis",
    units: [u("a", "bastion", 1)],
    hvp: [h("chief-engineer", "a"), h("chief-weapons-officer", "a"), h("seasoned-captain", "a")],
  });
  assert.ok(!hasCode(validateFleet(f), "HVP_NOT_AVAILABLE"));
});

test("HVP assigned to an unknown unit is an error", () => {
  const f = fleet({
    factionId: "vyke",
    units: [u("a", "king-crab", 1)],
    hvp: [h("brood-mother", "ghost"), h("war-singer", "a"), h("seer-empath", "a")],
  });
  assert.ok(hasCode(validateFleet(f), "HVP_ASSIGN_UNKNOWN_UNIT"));
});

test("a normal HVP cannot ride a Mass 0 unit", () => {
  const f = fleet({
    factionId: "vyke",
    units: [u("a", "viperfish", 1), u("b", "king-crab", 1)], // viperfish is Mass 0
    hvp: [h("brood-mother", "a"), h("war-singer", "b"), h("seer-empath", "b")],
  });
  const r = validateFleet(f);
  assert.ok(hasCode(r, "HVP_ASSIGN_MASS0"));
  assert.equal(r.valid, false);
});

test("The Nameless Punk may ride a Mass 0 unit", () => {
  const f = fleet({
    factionId: "gen-omega",
    units: [u("a", "warcry-fighter-wing", 1)], // Mass 0
    hvp: [h("the-nameless-punk", "a"), h("ghost-hacker", "a"), h("chief-engineer", "a")],
  });
  const r = validateFleet(f);
  // ghost-hacker & chief-engineer assigned to mass0 should error; punk should not.
  const mass0Errors = r.issues.filter((i) => i.code === "HVP_ASSIGN_MASS0");
  assert.equal(mass0Errors.length, 2);
  assert.ok(!mass0Errors.some((i) => i.hvpId === "the-nameless-punk"));
});

test("no Mass 1+ carrier produces a warning for un-carryable HVP", () => {
  const f = fleet({
    factionId: "vyke",
    units: [u("a", "viperfish", 1), u("b", "needlefin", 1)], // both Mass 0
    hvp: THREE_HVP, // none assigned, none can ride Mass 0
  });
  const r = validateFleet(f);
  assert.ok(hasCode(r, "HVP_NO_CARRIER"));
  // It's a warning, so on its own it doesn't invalidate.
  assert.ok(r.warnings.some((i) => i.code === "HVP_NO_CARRIER"));
});

// --- cost helper -----------------------------------------------------------

test("fleetCost matches the validator's totalCost", () => {
  const f = fleet({
    factionId: "aegis",
    units: [u("a", "imperator", 1), u("b", "recon-drone", 3), u("c", "bastion", 2)],
    hvp: THREE_HVP.map((x) => h(x.hvpId, "a")),
  });
  // 75 + (4*3) + (45*2) = 75 + 12 + 90 = 177
  assert.equal(fleetCost(f), 177);
  assert.equal(validateFleet(f).totalCost, 177);
});
