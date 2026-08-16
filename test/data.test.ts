import { test } from "node:test";
import assert from "node:assert/strict";

import { ARMAGEDDON_FACTIONS, FACTIONS, GENERIC_HVP, getFaction } from "../src/data/index.ts";
import { JUNKSPACE_SHIPS } from "../src/data/junkspace.ts";
import { TRAINING_FLEET } from "../src/data/training-fleet.ts";
import { DAMAGE_BY_DIE } from "../src/types.ts";

const DIE_TYPES = new Set(Object.keys(DAMAGE_BY_DIE));

test("there are exactly 4 Armageddon factions", () => {
  assert.equal(ARMAGEDDON_FACTIONS.length, 4);
  assert.deepEqual(
    ARMAGEDDON_FACTIONS.map((f) => f.id).sort(),
    ["aegis", "alliance", "gen-omega", "vyke"],
  );
});

test("faction ids are unique", () => {
  const ids = FACTIONS.map((f) => f.id);
  assert.equal(new Set(ids).size, ids.length);
});

// This used to assert every faction was Armageddon-era, which was true only
// because src/data/index.ts still listed the four Armageddon factions long
// after the other eight were transcribed. The shape it was really checking -
// a full roster and the printed seven personnel - holds for all twelve.
test("every faction has a roster and 7 HVP, in one of the three eras", () => {
  const ERAS = new Set(["Hypergrowth", "Age of Unity", "Armageddon"]);
  assert.equal(FACTIONS.length, 12);
  for (const f of FACTIONS) {
    assert.ok(f.ships.length > 0, `${f.id} has ships`);
    assert.equal(f.hvp.length, 7, `${f.id} has 7 HVP`);
    assert.ok(ERAS.has(f.era), `${f.id} has a real era, got "${f.era}"`);
  }
});

test("ship ids are unique within each faction", () => {
  for (const f of FACTIONS) {
    const ids = f.ships.map((s) => s.id);
    assert.equal(new Set(ids).size, ids.length, `${f.id} ship ids unique`);
  }
});

/*
 * HVP ids have to be globally unique because an id is all a saved fleet stores:
 * `FleetHvp.hvpId`, resolved later against the faction's seven plus the five
 * generics. Two people sharing an id are one person as far as storage is
 * concerned, and the two places that resolve them disagree about which one wins
 * (web/render.ts's findHvp takes the faction's first; src/validation.ts lets the
 * generic overwrite it), so the rule shown and the rule validated can differ.
 *
 * There is exactly one such collision in the book data today, listed below. It
 * is NOT fixed here on purpose: renaming either id silently changes what an
 * already-saved fleet is carrying, and which of the two a Unity player is
 * entitled to is a rules question, not a code one. The test pins the known
 * collision instead of ignoring the check, so a NEW one still fails loudly.
 */
const KNOWN_HVP_ID_COLLISIONS = ["chief-engineer"]; // The Unity's, and the generic

test("HVP ids are globally unique across factions + generic, bar the known collision", () => {
  const counts = new Map<string, number>();
  for (const h of [...FACTIONS.flatMap((f) => f.hvp), ...GENERIC_HVP]) {
    counts.set(h.id, (counts.get(h.id) ?? 0) + 1);
  }
  const duplicated = [...counts.entries()].filter(([, n]) => n > 1).map(([id]) => id);
  assert.deepEqual(duplicated.sort(), [...KNOWN_HVP_ID_COLLISIONS].sort());
});

test("ship stats are internally consistent", () => {
  for (const f of FACTIONS) {
    for (const s of f.ships) {
      assert.ok([0, 1, 2, 3].includes(s.mass), `${s.id} mass in range`);
      assert.ok(Number.isInteger(s.cost) && s.cost > 0, `${s.id} cost is positive int`);
      assert.ok(s.silhouette > 0, `${s.id} silhouette > 0`);
      assert.ok(s.shields >= 0, `${s.id} shields >= 0`);
      assert.ok(s.thrust > 0, `${s.id} thrust > 0`);
      // A ship has at least one weapon system OR utility bays.
      const hasWeapon = s.primary.length > 0 || s.auxiliary.length > 0;
      assert.ok(hasWeapon || s.utilityBays, `${s.id} has weapons or utility bays`);
      for (const wpn of [...s.primary, ...s.auxiliary]) {
        assert.ok(DIE_TYPES.has(wpn.die), `${s.id} ${wpn.name} valid die`);
        assert.ok(wpn.count > 0, `${s.id} ${wpn.name} count > 0`);
        assert.ok(wpn.rangeMin >= 0 && wpn.rangeMax >= wpn.rangeMin, `${s.id} ${wpn.name} range ok`);
      }
    }
  }
});

/**
 * The book prints "Utility Bays" *in one of the two weapon columns*, so which
 * column it sits in is data, not decoration - it decides what the spec table
 * prints. utilityBays alone does not say which, and six ships (AEGIS Repair
 * Drone and Warden, Vyke Snarefang, Gen O Matryoshka, Alliance Tug and Mining
 * Ship) were set without it. Four still rendered right by way of the fallback
 * in primarySlotText; the two with a primary weapon and an empty aux slot -
 * Repair Drone and Mining Ship - printed "None" where the book says Utility
 * Bays. Requiring the flag is what makes that a test failure rather than a
 * quiet wrong cell.
 */
test("every utility-bay ship says which column the bays are in", () => {
  const ships = [...FACTIONS.flatMap((f) => f.ships), ...TRAINING_FLEET.ships, ...JUNKSPACE_SHIPS];
  for (const s of ships) {
    if (!s.utilityBays) {
      assert.ok(!s.primaryUtility && !s.auxiliaryUtility, `${s.id} flags a column without utilityBays`);
      continue;
    }
    assert.ok(s.primaryUtility || s.auxiliaryUtility, `${s.id} has utility bays but no column`);
    assert.ok(!(s.primaryUtility && s.auxiliaryUtility), `${s.id} claims bays in both columns`);
    // The bays occupy the slot, so that slot carries no weapons.
    if (s.primaryUtility) assert.equal(s.primary.length, 0, `${s.id} primary is bays, so no primary weapons`);
    if (s.auxiliaryUtility) assert.equal(s.auxiliary.length, 0, `${s.id} aux is bays, so no aux weapons`);
  }
});

test("spot-check known stat blocks from the rulebook", () => {
  const vyke = getFaction("vyke")!;
  const leviathan = vyke.ships.find((s) => s.id === "leviathan")!;
  assert.equal(leviathan.mass, 3);
  assert.equal(leviathan.cost, 52);
  assert.equal(leviathan.silhouette, 9);

  const aegis = getFaction("aegis")!;
  const imperator = aegis.ships.find((s) => s.id === "imperator")!;
  assert.equal(imperator.cost, 75);
  assert.equal(imperator.mass, 3);
  assert.equal(imperator.primary[0]!.die, "D12");

  const alliance = getFaction("alliance")!;
  assert.equal(alliance.requiresSpecies, true);

  const gen = getFaction("gen-omega")!;
  const punk = gen.hvp.find((h) => h.id === "the-nameless-punk")!;
  assert.equal(punk.canEmbarkMass0, true);
});

test("Mass 3 ships exist in every faction (capital ships)", () => {
  for (const f of FACTIONS) {
    assert.ok(f.ships.some((s) => s.mass === 3), `${f.id} has a Mass 3 ship`);
  }
});
