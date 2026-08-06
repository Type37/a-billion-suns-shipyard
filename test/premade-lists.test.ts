import { test } from "node:test";
import assert from "node:assert/strict";

import { PREMADE_LISTS } from "../src/data/premade-lists.ts";
import { SEED_LISTS } from "../web/seed-lists.ts";
import { validateFleet, HVP_REQUIRED } from "../src/validation.ts";
import { getFaction } from "../src/data/index.ts";
import type { Fleet } from "../src/types.ts";

// The starter lists are hand-written data, not generated from the catalogue, so
// every shipClassId and hvpId in them is a copied string that a later rename of
// a ship or a personnel role would quietly break. Nothing in the app would
// complain: the list would just load short a ship, or with an HVP the validator
// rejects, and the person it was meant to help would be the one to find out.
// These tests are the thing that notices instead.

function toFleet(p: (typeof PREMADE_LISTS)[number]): Fleet {
  return {
    name: p.name,
    factionId: p.factionId,
    creditsLimit: p.creditsLimit,
    units: p.units.map((u, i) => ({ id: `u${i + 1}`, shipClassId: u.shipClassId, count: u.count })),
    hvp: p.hvpIds.map((hvpId) => ({ hvpId })),
  };
}

test("there is exactly one starter list per era", () => {
  const eras = PREMADE_LISTS.map((p) => p.era).sort();
  assert.deepEqual(eras, ["Age of Unity", "Armageddon", "Hypergrowth"]);
  assert.equal(new Set(PREMADE_LISTS.map((p) => p.id)).size, PREMADE_LISTS.length);
});

for (const p of PREMADE_LISTS) {
  test(`${p.name}: faction "${p.factionId}" exists and matches the era`, () => {
    const faction = getFaction(p.factionId);
    assert.ok(faction, `no faction with id "${p.factionId}"`);
    assert.equal(faction.era, p.era);
  });

  test(`${p.name}: every ship class is on the faction's roster`, () => {
    const faction = getFaction(p.factionId);
    assert.ok(faction);
    const roster = new Set(faction.ships.map((s) => s.id));
    for (const u of p.units) {
      assert.ok(roster.has(u.shipClassId), `"${u.shipClassId}" is not a ${faction.name} ship`);
    }
  });

  test(`${p.name}: selects ${HVP_REQUIRED} available personnel`, () => {
    assert.equal(p.hvpIds.length, HVP_REQUIRED);
    assert.equal(new Set(p.hvpIds).size, HVP_REQUIRED, "the same person is chosen twice");
  });

  // The real check. It covers unit sizes against maxUnitSize, the credits
  // ceiling, HVP availability and duplication, and species requirements, so it
  // catches a bad edit even in a rule these tests do not name individually.
  //
  // UNIT_SIZE_EXCEEDED is skipped for a Shipyard, and only there: in Hypergrowth
  // an entry is a ship CLASS you hold stock of, not a unit that deploys, so the
  // per-unit cap of 1 (Mass 3) or 3 does not apply to it. The Megamart seed
  // stocks 5 Fighter Wings and 2 Titan Mallships in single entries on the same
  // reasoning. Every other issue still has to be clear.
  test(`${p.name}: validates clean, with no errors and no warnings`, () => {
    const result = validateFleet(toFleet(p));
    const shipyard = p.mode === "hypergrowth";
    const issues = result.issues.filter((i) => !(shipyard && i.code === "UNIT_SIZE_EXCEEDED"));
    assert.deepEqual(
      issues.map((i) => `${i.severity}: ${i.message}`),
      [],
    );
  });

  // Exactly on the limit, not merely under it. A starter list doubles as a
  // worked example of a full fleet at the standard ¢300bn, and one that stops
  // short quietly teaches that leaving credits unspent is normal. This is also
  // what catches a stale "// 52+35 + ... = ¢300bn" comment above the units,
  // which is written for a reader and can drift from the numbers silently.
  test(`${p.name}: costs exactly its ¢${p.creditsLimit}bn limit`, () => {
    assert.equal(validateFleet(toFleet(p)).totalCost, p.creditsLimit);
  });
}

// --- The seeded fleets ------------------------------------------------------
// Every list that ships pre-saved into a new browser (web/seed-lists.ts), which
// is these three plus the five per-faction ones, on the same "exactly ¢300bn"
// rule. They are the first fleets anybody sees, so they are also the app's
// worked examples of a legal, fully-spent list.

test("every seeded fleet has a unique id and a name", () => {
  const ids = SEED_LISTS.map((l) => l.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const l of SEED_LISTS) assert.ok(l.fleet.name, `${l.id} has no name`);
});

for (const l of SEED_LISTS) {
  test(`seed ${l.id}: costs exactly ¢300bn and validates clean`, () => {
    const result = validateFleet(l.fleet);
    assert.equal(result.totalCost, 300);
    // Same Shipyard exception as above: a Hypergrowth entry is stock of a ship
    // class, not a unit that deploys, so the per-unit size cap does not bind.
    const shipyard = l.mode === "hypergrowth";
    const issues = result.issues.filter((i) => !(shipyard && i.code === "UNIT_SIZE_EXCEEDED"));
    assert.deepEqual(
      issues.map((i) => `${i.severity}: ${i.message}`),
      [],
    );
  });
}
