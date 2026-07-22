import { test } from "node:test";
import assert from "node:assert/strict";

import {
  fleetName,
  randomFleetName,
  toOrdinal,
  fleetNameBank,
  FLEET_NAME_BANKS,
  DEFAULT_FLEET_NAME_BANK,
} from "../src/fleet-names.ts";
import { FACTIONS } from "../src/data/index.ts";

test("toOrdinal handles ones, teens, and twenties", () => {
  assert.equal(toOrdinal(1), "1st");
  assert.equal(toOrdinal(2), "2nd");
  assert.equal(toOrdinal(3), "3rd");
  assert.equal(toOrdinal(4), "4th");
  assert.equal(toOrdinal(11), "11th");
  assert.equal(toOrdinal(12), "12th");
  assert.equal(toOrdinal(13), "13th");
  assert.equal(toOrdinal(21), "21st");
  assert.equal(toOrdinal(22), "22nd");
  assert.equal(toOrdinal(23), "23rd");
});

test("fleetName is deterministic and well-formed", () => {
  assert.equal(fleetName("vyke", 1), fleetName("vyke", 1));
  const name = fleetName("vyke", 1);
  assert.match(name, /^1st \S.* Horde$/);
});

test("fleetName cycles the adjective bank and keeps counting ordinals", () => {
  const bank = fleetNameBank("aegis");
  const len = bank.adjectives.length;
  // Fleet 1 and fleet (len+1) reuse the same adjective but differ in ordinal.
  const first = fleetName("aegis", 1);
  const wrapped = fleetName("aegis", len + 1);
  assert.ok(first.endsWith(`${bank.adjectives[0]} ${bank.title}`));
  assert.ok(wrapped.endsWith(`${bank.adjectives[0]} ${bank.title}`));
  assert.equal(first.startsWith("1st "), true);
  assert.equal(wrapped.startsWith(`${toOrdinal(len + 1)} `), true);
});

test("unknown faction ids use the default bank", () => {
  const name = fleetName("not-a-real-faction", 1);
  assert.equal(name, `1st ${DEFAULT_FLEET_NAME_BANK.adjectives[0]} Fleet`);
});

test("randomFleetName is reproducible for a given seed", () => {
  assert.equal(randomFleetName("megamart", 4, 12345), randomFleetName("megamart", 4, 12345));
});

test("every catalog faction has its own themed bank", () => {
  for (const f of FACTIONS) {
    assert.ok(FLEET_NAME_BANKS[f.id], `${f.id} has a fleet-name bank`);
  }
});

test("all banks are non-empty and titled", () => {
  for (const [id, bank] of Object.entries(FLEET_NAME_BANKS)) {
    assert.ok(bank.title.length > 0, `${id} has a title`);
    assert.ok(bank.adjectives.length > 0, `${id} has adjectives`);
  }
});
