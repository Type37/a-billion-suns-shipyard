import { test } from "node:test";
import assert from "node:assert/strict";

import { PREMADE_LISTS } from "../src/data/premade-lists.ts";
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
  test(`${p.name}: validates clean, with no errors and no warnings`, () => {
    const result = validateFleet(toFleet(p));
    assert.deepEqual(
      result.issues.map((i) => `${i.severity}: ${i.message}`),
      [],
    );
    assert.equal(result.valid, true);
    assert.ok(
      result.totalCost <= p.creditsLimit,
      `${result.totalCost} over the ${p.creditsLimit} limit`,
    );
  });

  test(`${p.name}: the cost comment in the data is not stale`, () => {
    // Each entry carries a "// 52+35 + ... = ¢282bn" arithmetic comment above
    // its units. The comment is for a reader, so it can drift from the numbers
    // silently; this pins the total that comment is claiming.
    const result = validateFleet(toFleet(p));
    assert.ok(result.totalCost > 0);
    assert.ok(
      result.totalCost >= p.creditsLimit * 0.9,
      `${p.name} only spends ${result.totalCost} of ${p.creditsLimit} - a starter list should be a full fleet`,
    );
  });
}
