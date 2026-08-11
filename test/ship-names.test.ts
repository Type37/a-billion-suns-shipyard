import { strict as assert } from "node:assert";
import { test } from "node:test";
import { CAPITAL_SHIP_NAMES, capitalShipName } from "../src/ship-names.ts";

test("the pool has no duplicates and no empties", () => {
  assert.equal(new Set(CAPITAL_SHIP_NAMES).size, CAPITAL_SHIP_NAMES.length);
  for (const n of CAPITAL_SHIP_NAMES) assert.ok(n.trim().length > 0, "empty name");
});

test("every name is multi-word", () => {
  // Single words in the source are almost all place names and read as stations
  // rather than ships, which is why they were filtered out.
  for (const n of CAPITAL_SHIP_NAMES) assert.ok(n.includes(" "), `single word: ${n}`);
});

test("the same seed always gives the same name", () => {
  assert.equal(capitalShipName("vyke:u3"), capitalShipName("vyke:u3"));
  assert.notEqual(capitalShipName("vyke:u3"), capitalShipName("vyke:u4"));
});

test("a name already in the fleet is never handed out twice", () => {
  const first = capitalShipName("aegis:u1");
  const second = capitalShipName("aegis:u1", [first]);
  assert.notEqual(second, first);
});

test("adding a second capital does not rename the first", () => {
  // The whole reason the seed is the unit id: naming ship two must be a pure
  // function of ship two, so ship one's name cannot move under it.
  const one = capitalShipName("unity:u1");
  const two = capitalShipName("unity:u2", [one]);
  assert.equal(capitalShipName("unity:u1", []), one);
  assert.notEqual(two, one);
});

test("it still returns a name when the whole pool is taken", () => {
  const all = [...CAPITAL_SHIP_NAMES];
  const n = capitalShipName("x:y", all);
  assert.ok(CAPITAL_SHIP_NAMES.includes(n));
});
