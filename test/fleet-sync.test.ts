import { strict as assert } from "node:assert";
import { test } from "node:test";

import { mergeLists, FleetSync } from "../web/fleet-sync.ts";
import type { SavedList } from "../web/storage.ts";

// Merge-logic tests for fleet-sync.ts. This decides whether a user keeps or
// loses a fleet, so it is tested directly against the pure mergeLists()
// rather than only through the UI - the same reasoning Dropfleet Commander's
// own scripts/test-fleet-sync.mjs gives for its equivalent.

// A minimal but real SavedList: only `id` and `updatedAt` matter to the
// merge, but the type requires the rest, so this is a fixed, valid stand-in.
function list(id: string, updatedAt: string, extra: Partial<SavedList> = {}): SavedList {
  return {
    id,
    mode: "armageddon",
    freePlay: false,
    emblem: "delta",
    fleet: { name: id, factionId: "vyke", creditsLimit: 300, units: [], hvp: [] },
    createdAt: updatedAt,
    updatedAt,
    ...extra,
  };
}

test("union on first join: no overlap keeps every fleet from both sides", () => {
  const local = [list("P0", "2026-01-01T00:00:02.000Z"), list("P1", "2026-01-01T00:00:02.000Z"), list("P2", "2026-01-01T00:00:02.000Z")];
  const remote = {
    lists: [
      list("L0", "2026-01-01T00:00:01.000Z"),
      list("L1", "2026-01-01T00:00:01.000Z"),
      list("L2", "2026-01-01T00:00:01.000Z"),
      list("L3", "2026-01-01T00:00:01.000Z"),
      list("L4", "2026-01-01T00:00:01.000Z"),
      list("L5", "2026-01-01T00:00:01.000Z"),
    ],
    deleted: {},
  };
  const merged = mergeLists(local, {}, remote);
  assert.equal(merged.lists.length, 9, "6 remote + 3 local = 9");
  const ids = merged.lists.map((l) => l.id).sort().join(",");
  assert.equal(ids, "L0,L1,L2,L3,L4,L5,P0,P1,P2");
});

test("newest updatedAt wins on the same list id", () => {
  const local = [list("X", "2026-01-01T00:00:00.100Z", { fleet: { name: "old", factionId: "vyke", creditsLimit: 300, units: [], hvp: [] } })];
  const remote = {
    lists: [list("X", "2026-01-01T00:00:00.999Z", { fleet: { name: "NEWER", factionId: "vyke", creditsLimit: 300, units: [], hvp: [] } })],
    deleted: {},
  };
  const merged = mergeLists(local, {}, remote);
  assert.equal(merged.lists.length, 1);
  assert.equal(merged.lists[0]?.fleet.name, "NEWER");
});

test("an older remote edit does not overwrite the newer local one", () => {
  const local = [list("X", "2026-01-01T00:00:00.999Z", { fleet: { name: "LOCAL NEWER", factionId: "vyke", creditsLimit: 300, units: [], hvp: [] } })];
  const remote = {
    lists: [list("X", "2026-01-01T00:00:00.100Z", { fleet: { name: "stale", factionId: "vyke", creditsLimit: 300, units: [], hvp: [] } })],
    deleted: {},
  };
  const merged = mergeLists(local, {}, remote);
  assert.equal(merged.lists[0]?.fleet.name, "LOCAL NEWER");
});

test("a fleet deleted on one device does not come back from the cloud", () => {
  const editedAt = "2026-01-01T00:00:00.001Z";
  const tombstoneAt = Date.parse(editedAt) + 5000; // deleted well after its last edit
  const local: SavedList[] = []; // deleted here
  const localDeleted = { X: tombstoneAt };
  const remote = { lists: [list("X", editedAt)], deleted: {} }; // the other device's stale, pre-delete copy
  const merged = mergeLists(local, localDeleted, remote);
  assert.equal(merged.lists.length, 0, "the tombstone wins - X must not resurrect");
  assert.equal(merged.deleted["X"], tombstoneAt);
});

test("editing a fleet after it was deleted elsewhere resurrects it on purpose", () => {
  // The deletion happened, then - on a DIFFERENT device that had not pulled
  // the tombstone yet - the same id was edited again after that.
  const tombstoneAt = Date.parse("2026-01-01T00:00:00.000Z");
  const editedAt = new Date(tombstoneAt + 10_000).toISOString();
  const local = [list("X", editedAt)];
  const remote = { lists: [], deleted: { X: tombstoneAt } };
  const merged = mergeLists(local, {}, remote);
  assert.equal(merged.lists.length, 1, "an edit newer than the tombstone must survive it");
  assert.equal(merged.lists[0]?.id, "X");
});

test("tombstones merge to the later timestamp when both sides have deleted the same id", () => {
  const remote = { lists: [], deleted: { X: 1000 } };
  const merged = mergeLists([], { X: 9000 }, remote);
  assert.equal(merged.deleted["X"], 9000);
});

test("looksLikeToken accepts a real six-word phrase and rejects short input", () => {
  assert.equal(FleetSync.looksLikeToken("anchor-bastion-cinder-dagger-ember-forge"), true);
  assert.equal(FleetSync.looksLikeToken("Anchor Bastion, Cinder DAGGER ember forge"), true, "forgiving of case/punctuation/spacing");
  assert.equal(FleetSync.looksLikeToken("nope"), false);
  assert.equal(FleetSync.looksLikeToken(""), false);
});
