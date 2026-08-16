import { strict as assert } from "node:assert";
import { test } from "node:test";
import { FACTIONS, GENERIC_HVP } from "../src/data/index.ts";
import {
  CULTURES,
  cultureOdds,
  NAME_LISTS,
  NON_HUMAN_FACTIONS,
  NON_HUMAN_HVP,
  TABLES,
  canRollName,
  pickCulture,
  rollHvpName,
  rollName,
} from "../src/hvp-names.ts";

test("every table column is populated and free of duplicates", () => {
  for (const [culture, t] of Object.entries(TABLES)) {
    for (const [col, list] of Object.entries(t)) {
      assert.ok(list.length > 0, `${culture}.${col} is empty`);
      assert.equal(new Set(list).size, list.length, `${culture}.${col} has a duplicate`);
      for (const n of list) assert.ok(n.trim() === n && n.length > 0, `${culture}.${col}: "${n}"`);
    }
  }
});

test("every roster name is a whole name, not a bare given name", () => {
  // The rosters are transcribed as written, and every entry on them carries a
  // family name. A single word would mean a line got truncated in transcription.
  for (const [culture, names] of Object.entries(NAME_LISTS)) {
    assert.equal(new Set(names).size, names.length, `${culture} has a duplicate`);
    for (const n of names) assert.ok(n.includes(" "), `${culture}: "${n}" is one word`);
  }
});

test("a roll only ever returns names that came from the tables", () => {
  // The point of the whole module: nothing invented, nothing decorated. Every
  // word out of it has to be findable in the data above.
  const known = new Set<string>();
  for (const names of Object.values(NAME_LISTS)) for (const n of names) known.add(n);
  for (const t of Object.values(TABLES)) {
    for (const col of [t.male, t.female, t.surname, t.place]) for (const n of col) known.add(n);
  }
  for (let i = 0; i < 2000; i++) {
    const rolled = rollName();
    const ok = known.has(rolled) || rolled.split(" ").every((w) => known.has(w));
    assert.ok(ok, `unknown name: ${rolled}`);
  }
});

test("the job title leads, and the name follows it", () => {
  const line = rollHvpName("Chief Engineer", () => 0);
  assert.ok(line.startsWith("Chief Engineer "), line);
  assert.ok(line.length > "Chief Engineer ".length, "no name was added");
});

test("a pinned rand gives a pinned name", () => {
  assert.equal(rollHvpName("Commissar", () => 0), rollHvpName("Commissar", () => 0));
});

test("the non-human factions roll nothing at all, generics included", () => {
  // AEGIS and Golem have no person in the slot; the Vyke and the Alliance have
  // people, but not human ones. Their generic HVP go with them: AEGIS's faction
  // rule makes every HVP it holds a protocol shard.
  for (const faction of FACTIONS.filter((f) => NON_HUMAN_FACTIONS.has(f.id))) {
    for (const h of [...faction.hvp, ...GENERIC_HVP]) {
      assert.equal(canRollName(faction.id, h.id), false, `${faction.id}/${h.id}`);
    }
  }
});

test("the human factions roll, apart from their listed exceptions", () => {
  for (const faction of FACTIONS.filter((f) => !NON_HUMAN_FACTIONS.has(f.id))) {
    for (const h of [...faction.hvp, ...GENERIC_HVP]) {
      assert.equal(canRollName(faction.id, h.id), !NON_HUMAN_HVP.has(h.id), `${faction.id}/${h.id}`);
    }
  }
});

test("every exception names a real HVP", () => {
  // A renamed id would silently switch the die back on for somebody it was
  // switched off for, and nothing on screen would say so.
  const ids = new Set(FACTIONS.flatMap((f) => f.hvp.map((h) => h.id)));
  for (const id of NON_HUMAN_HVP) assert.ok(ids.has(id), `no such HVP: ${id}`);
  for (const id of NON_HUMAN_FACTIONS) {
    assert.ok(FACTIONS.some((f) => f.id === id), `no such faction: ${id}`);
  }
});

test("a homebrew faction is human until told otherwise", () => {
  assert.equal(canRollName("my-custom-faction", "some-hvp"), true);
});

test("every culture has odds, and they add up to one", () => {
  const odds = cultureOdds();
  assert.equal(Object.keys(odds).length, CULTURES.length);
  for (const c of CULTURES) assert.ok(odds[c]! > 0, `${c} can never come up`);
  const total = Object.values(odds).reduce((a, b) => a + b, 0);
  assert.ok(Math.abs(total - 1) < 1e-9, `odds sum to ${total}`);
});

test("the weights land in the order they were asked for", () => {
  const o = cultureOdds();
  // A baseline table > Japanese and Indian > Russian > any single roster.
  assert.ok(o["english"]! > o["japanese"]!);
  assert.equal(o["japanese"], o["indian"]);
  assert.ok(o["japanese"]! > o["russian"]!);
  assert.ok(o["russian"]! > o["caledonia"]!);
  // Every faction roster is weighted the same as every other. The tributes are
  // not a faction roster - they are the easter egg, and sit below everything.
  const rosters = Object.keys(NAME_LISTS).filter((k) => k !== "tribute").map((k) => o[k]!);
  assert.equal(new Set(rosters).size, 1);
  for (const c of CULTURES) {
    if (c !== "tribute") assert.ok(o[c]! > o["tribute"]!, `${c} is rarer than the easter egg`);
  }
  // And the rosters as a block no longer take most of the rolls.
  assert.ok(rosters.reduce((a, b) => a + b, 0) < 0.5);
  // An easter egg that fires one roll in twenty is not an easter egg.
  assert.ok(o["tribute"]! < 0.02, `tributes come up ${(o["tribute"]! * 100).toFixed(1)}% of the time`);
});

test("a weighted roll still visits every culture", () => {
  // A cumulative-weights bug that skipped the first or last entry would show
  // here and nowhere else: the name still looks perfectly plausible.
  const seen = new Set<string>();
  for (let i = 0; i < 400; i++) seen.add(pickCulture(() => i / 400));
  assert.equal(seen.size, CULTURES.length, [...CULTURES].filter((c) => !seen.has(c)).join(", "));
});

test("rolls reach both the rosters and the built names", () => {
  const seen = new Set<string>();
  for (let i = 0; i < 3000; i++) seen.add(rollName());
  // 24 cultures, most of them with hundreds of combinations: a generator that
  // had collapsed onto one culture or one shape could not produce this spread.
  assert.ok(seen.size > 500, `only ${seen.size} distinct names in 3000 rolls`);
  assert.ok(CULTURES.length === Object.keys(NAME_LISTS).length + Object.keys(TABLES).length);
});
