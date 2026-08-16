import { strict as assert } from "node:assert";
import { test } from "node:test";
import { SHIP_NAME_POOLS, UNSC_CAPITAL_SHIP_NAMES, capitalShipName } from "../src/ship-names.ts";
import { TRIBUTE_NAMES } from "../src/tributes.ts";

const UNSC = "cf-example-unsc";

test("every pool has no duplicates and no empties", () => {
  for (const [factionId, pool] of Object.entries(SHIP_NAME_POOLS)) {
    assert.equal(new Set(pool).size, pool.length, `${factionId} has a duplicate`);
    for (const n of pool) assert.ok(n.trim().length > 0, `${factionId}: empty name`);
  }
});

test("every UNSC name is multi-word", () => {
  // Single words in the source are almost all place names and read as stations
  // rather than ships, which is why they were filtered out.
  for (const n of UNSC_CAPITAL_SHIP_NAMES) assert.ok(n.includes(" "), `single word: ${n}`);
});

test("the same seed always gives the same name", () => {
  assert.equal(capitalShipName(UNSC, "u3"), capitalShipName(UNSC, "u3"));
  assert.notEqual(capitalShipName(UNSC, "u3"), capitalShipName(UNSC, "u4"));
});

test("a name already in the fleet is never handed out twice", () => {
  const first = capitalShipName(UNSC, "u1")!;
  const second = capitalShipName(UNSC, "u1", [first]);
  assert.notEqual(second, first);
});

test("adding a second capital does not rename the first", () => {
  // The whole reason the seed is the unit id: naming ship two must be a pure
  // function of ship two, so ship one's name cannot move under it.
  const one = capitalShipName(UNSC, "u1")!;
  const two = capitalShipName(UNSC, "u2", [one]);
  assert.equal(capitalShipName(UNSC, "u1", []), one);
  assert.notEqual(two, one);
});

test("it still returns a name when the whole pool is taken", () => {
  const pool = SHIP_NAME_POOLS[UNSC]!;
  const n = capitalShipName(UNSC, "x:y", [...pool]);
  assert.ok(pool.includes(n!));
});

test("no ship pool carries a tribute name", () => {
  // The easter egg lives in the HVP roller, where it can be weighted down to
  // one roll in seventy-five. A capital-ship pool has no weights - the name is
  // hashed out of a fixed list - so ten tributes there was one hull in twelve.
  for (const pool of Object.values(SHIP_NAME_POOLS)) {
    for (const t of TRIBUTE_NAMES) assert.ok(!pool.includes(t), t);
  }
});

test("a faction with no pool is not christened at all", () => {
  // The twelve published factions get ship CLASSES from the book, not registers
  // of named hulls. Handing a Vyke bio-ship a UNSC naval name was the bug this
  // fixed, so it is pinned: no pool, no name.
  for (const id of ["vyke", "aegis", "megamart", "the-unity", "cf-something-homebrew"]) {
    assert.equal(capitalShipName(id, `${id}:u1`), undefined, id);
  }
});
