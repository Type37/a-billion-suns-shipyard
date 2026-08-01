import type { SavedList } from "./storage.ts";
import {
  loadLists,
  persistLists,
  setListsWrittenHook,
  loadSyncToken,
  persistSyncToken,
  loadSyncLastSync,
  persistSyncLastSync,
  loadSyncDeleted,
  persistSyncDeleted,
} from "./storage.ts";

/**
 * Fleet Sync — opt-in cross-device sync of `abs2.lists.v1`.
 *
 * This is the same design as Fleet Sync in the Dropfleet Commander builder
 * (js/fleet-sync.js there), ported to this app's data model. Re-read that
 * file's header if this one gets edited without understanding why - the
 * shape below is not arbitrary.
 *
 * Design, and why it looks like this:
 *
 * - There is no account and no password. A Sync Token is a six-word phrase
 *   that doubles as the Firestore document id. Knowing the phrase is the
 *   entire credential. This is deliberate (no sign-in), and the UI copy says
 *   so plainly, because anyone holding the token can read AND edit.
 *
 * - Talks to Firestore over its plain REST API rather than the Firebase SDK,
 *   which is ~400 KB and would need a CDN or a bundled dependency this
 *   framework-free app does not otherwise have. `fetch` costs nothing extra.
 *
 * - Reuses the `dropfleet-builder` Firebase project (same author, same free
 *   Firestore instance) under its OWN top-level collection, `abs-sync`, so
 *   this app's documents never collide with Dropfleet Commander's `sync`
 *   collection even if two tokens happened to match. The API key below is
 *   not a secret - Firebase web keys ship in client JS by design, they
 *   identify the project rather than authorise anything. Access control is
 *   entirely in firestore.rules (see that file in this repo).
 *
 * - The whole list registry travels as ONE JSON string in a single `payload`
 *   field, exactly like Dropfleet's. Firestore's REST format otherwise
 *   requires tagging every value with its type, which for nested Fleet
 *   objects (units, HVP, play state) would be a lot of pointless conversion.
 *
 * - Unlike Dropfleet, this app already stamps `updatedAt` on every list
 *   centrally (state.ts's `updateList`/`createList`/`persistAll`), so there
 *   is no need for Dropfleet's change-detection signature hack
 *   (`stampChanged`) - every SavedList that ever reaches `persistLists()`
 *   already carries a trustworthy `updatedAt`. Sync just has to READ it.
 *
 * Merge rules: union by list id, newest `updatedAt` wins on a collision, and
 * deletions travel as tombstones so a fleet deleted on one device does not
 * come back from the cloud on the next pull. Nothing is ever silently
 * dropped - see `mergeLists` below, which is a pure function so the rules
 * can be tested directly (test/fleet-sync.test.ts).
 */

const PROJECT = "dropfleet-builder";
const API_KEY = "AIzaSyCuVs19-E131IHSZ_smWcLLl52djAZuJ60";
const COLLECTION = "abs-sync";
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/${COLLECTION}/`;

const WORDS_PER_TOKEN = 6;

/* Same wordlist as Dropfleet Commander's Fleet Sync: naval/sci-fi flavoured,
 * homophone-safe words a person can read aloud without a mishear. Strength:
 * 6 words from these 304 gives 49.5 bits (~7.9e14 phrases); every guess costs
 * an HTTPS round trip, so brute-forcing a token is not a practical attack.
 * If this list is ever edited, keep it long - shortening it weakens every
 * token issued afterwards. */
const WORDS = (
  "abyss admiral aegis aether afterburn agile albion amber anchor anvil arc archer " +
  "argent armour ashen asteroid atlas augur aurora azure ballast banner barrage basalt " +
  "beacon bearing bellows bishop bastion blackout bolt bounty bracket breach bridge " +
  "bronze bulwark burner cadence caldera cannon canopy capital captain cargo cascade " +
  "catapult cinder cipher citadel cleave cobalt comet compass conduit convoy copper " +
  "corona corsair cradle crater crimson crucible cruiser cutter cyclone dagger dawn " +
  "deckhand deploy derelict diadem diode dockyard dorsal dreadnought drift driver " +
  "dropship dusk dynamo echelon eclipse ember engine ensign epoch equinox escort " +
  "exhaust falcon fathom ferrous fission flagship flare flotilla forge foundry " +
  "frigate fulcrum furnace gambit gantry garrison gauntlet girder glacier gradient " +
  "granite gravity gunnery halcyon hangar harbour harrier hazard helix helmsman " +
  "herald hollow horizon hull ignition impulse ingot inland ironside jetty jovian " +
  "keel kestrel keystone kiln lancer lantern lattice launch legion lighthouse " +
  "lodestar longbow lumen lunar magnet mainsail mantle mariner marker marshal " +
  "mercury meridian mesa monolith monsoon mortar muster nadir naval nebula nexus " +
  "nickel nimbus nomad northern oculus offshore onyx orbit ordnance outpost " +
  "overwatch paladin parallax parapet payload pennant perigee phalanx pilot pinnacle " +
  "pioneer piston pivot plating plummet polaris portside prism prospect prow pulsar " +
  "quarry quasar quiver radiant rampart ranger ravine reactor redoubt reef regent " +
  "relay rescue reserve resolve retinue revenant ridge rifle rigging ripcord river " +
  "rocket rudder ruin runway sable salvage sapper scaffold scarlet schooner scout " +
  "sentinel sextant shadow shipyard shoal shroud signal silica siren skiff slipway " +
  "solar sonar southern spanner sparrow spinnaker spire squall stanchion starboard " +
  "stellar steward stockade stratum stronghold summit sundial surge swallow talon " +
  "tandem tempest tender terminus thruster tidal timber titan tonnage topsail torrent " +
  "trawler tremor trident triumph tundra turbine turret twilight umbra undertow " +
  "valiant vanguard vector vellum venture vertex vessel viaduct vigil visor voltage " +
  "voyager warden warrant watchman waypoint western wharf whistle winch windward " +
  "wireframe wolfpack yardarm zenith zephyr zircon"
)
  .split(" ")
  .filter(Boolean);

export interface SyncPayload {
  lists: SavedList[];
  deleted: Record<string, number>;
}
const EMPTY: SyncPayload = { lists: [], deleted: {} };

/* ── Local state ─────────────────────────────────────────────────────── */

function supported(): boolean {
  try {
    return (
      typeof crypto !== "undefined" &&
      typeof crypto.getRandomValues === "function" &&
      typeof fetch === "function" &&
      typeof localStorage !== "undefined"
    );
  } catch {
    return false;
  }
}
function token(): string | null {
  return loadSyncToken();
}
function enabled(): boolean {
  return !!token();
}
function lastSync(): number | null {
  return loadSyncLastSync();
}

/* Writes fleet-sync's own merge results back to storage. Goes through the
 * same persistLists() the rest of the app uses (so seeds/exports see the
 * same data) but suppresses the write-hook while doing it - otherwise a
 * sync's own write would immediately schedule ANOTHER sync of itself. */
let suppressNotify = false;
function writeLocal(lists: SavedList[]): void {
  suppressNotify = true;
  try {
    persistLists(lists);
  } finally {
    suppressNotify = false;
  }
}

/* Both the builder's delete-list action and the Junkspace/solo equivalents
 * (if they ever grow sync) call this from their delete path. Without a
 * tombstone the next pull would helpfully restore the fleet just discarded. */
function recordDeleted(id: string): void {
  if (!id) return;
  const m = loadSyncDeleted();
  m[id] = Date.now();
  persistSyncDeleted(m);
}

/* ── Tokens ──────────────────────────────────────────────────────────── */

function randomToken(): string {
  const buf = new Uint32Array(WORDS_PER_TOKEN);
  crypto.getRandomValues(buf);
  return Array.from(buf, (n) => WORDS[n % WORDS.length]).join("-");
}

/* Forgiving on input: users will paste with stray spaces, capitals, curly
 * punctuation from a messaging app, or commas instead of hyphens. */
function normaliseToken(raw: string): string {
  return String(raw || "")
    .toLowerCase()
    .replace(/[^a-z]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
function looksLikeToken(raw: string): boolean {
  const t = normaliseToken(raw);
  return t.length >= 24 && t.split("-").filter(Boolean).length >= 4;
}

/* ── Firestore REST ──────────────────────────────────────────────────── */

async function failure(res: Response): Promise<Error> {
  let detail = "";
  try {
    const j = (await res.json()) as { error?: { message?: string } };
    detail = j?.error?.message ?? "";
  } catch {
    // Body wasn't JSON; fall through to the generic message below.
  }
  if (res.status === 403) return new Error(`Sync was refused by the server. ${detail}`);
  if (res.status === 429) return new Error("Sync is busy, try again in a minute.");
  return new Error(detail || `Sync failed (HTTP ${res.status}).`);
}

async function remoteGet(tok: string): Promise<SyncPayload | null> {
  const res = await fetch(`${BASE}${encodeURIComponent(tok)}?key=${API_KEY}`, { cache: "no-store" });
  if (res.status === 404) return null; // token has never been used
  if (!res.ok) throw await failure(res);
  const doc = (await res.json()) as { fields?: { payload?: { stringValue?: string } } };
  const raw = doc.fields?.payload?.stringValue;
  if (!raw) return EMPTY;
  try {
    const p = JSON.parse(raw) as Partial<SyncPayload>;
    return {
      lists: Array.isArray(p.lists) ? p.lists : [],
      deleted: p.deleted && typeof p.deleted === "object" ? p.deleted : {},
    };
  } catch {
    return EMPTY;
  }
}

async function remotePut(tok: string, payload: SyncPayload): Promise<void> {
  const body = {
    fields: {
      payload: { stringValue: JSON.stringify(payload) },
      updatedAt: { integerValue: String(Date.now()) },
      version: { integerValue: "1" },
    },
  };
  // PATCH upserts in the Firestore REST API, so this both creates and updates.
  const res = await fetch(`${BASE}${encodeURIComponent(tok)}?key=${API_KEY}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw await failure(res);
}

async function remoteDelete(tok: string): Promise<void> {
  const res = await fetch(`${BASE}${encodeURIComponent(tok)}?key=${API_KEY}`, { method: "DELETE" });
  if (!res.ok && res.status !== 404) throw await failure(res);
}

/* ── Merge ───────────────────────────────────────────────────────────── */

/**
 * Union by id, newest `updatedAt` wins, tombstones applied last. Pure and
 * side-effect free on purpose - this is the one function that decides
 * whether a user keeps or loses a fleet, so it is tested directly rather
 * than only through the UI (test/fleet-sync.test.ts).
 *
 * A tombstone only wins if the surviving list has NOT been edited since it
 * was set, so re-creating or editing a fleet with the same id on another
 * device resurrects it on purpose rather than being silently re-deleted.
 */
export function mergeLists(
  localLists: SavedList[],
  localDeleted: Record<string, number>,
  remote: SyncPayload,
): SyncPayload {
  const byId = new Map<string, SavedList>();
  for (const l of localLists) if (l?.id) byId.set(l.id, l);

  for (const l of remote.lists || []) {
    if (!l?.id) continue;
    const mine = byId.get(l.id);
    if (!mine || Date.parse(l.updatedAt || "") > Date.parse(mine.updatedAt || "")) byId.set(l.id, l);
  }

  const deleted: Record<string, number> = {};
  for (const src of [remote.deleted || {}, localDeleted]) {
    for (const [id, t] of Object.entries(src)) {
      const n = Number(t) || 0;
      if (n > (deleted[id] || 0)) deleted[id] = n;
    }
  }
  for (const [id, deletedAt] of Object.entries(deleted)) {
    const l = byId.get(id);
    if (l && Date.parse(l.updatedAt || "") <= deletedAt) byId.delete(id);
  }

  return { lists: [...byId.values()], deleted };
}

/* ── Public operations ──────────────────────────────────────────────── */

export interface PreviewResult {
  token: string;
  exists: boolean;
  remoteCount: number;
  localCount: number;
}

/** Look at a token without touching anything, so the dialog can show
 *  "that token has 6 fleets, this device has 3" before the user commits. */
async function preview(raw: string): Promise<PreviewResult> {
  const tok = normaliseToken(raw);
  const remote = await remoteGet(tok);
  return {
    token: tok,
    exists: remote !== null,
    remoteCount: remote ? remote.lists.length : 0,
    localCount: loadLists().length,
  };
}

export interface JoinResult {
  token: string;
  total: number;
  fromToken: number;
  fromDevice: number;
}

/** Adopt a token: pull, merge into local, then push the merged result back
 *  so every device converges on the same registry. */
async function join(raw: string): Promise<JoinResult> {
  const tok = normaliseToken(raw);
  if (!looksLikeToken(tok)) throw new Error("That does not look like a Sync Token.");
  const remote = (await remoteGet(tok)) ?? EMPTY;
  const localLists = loadLists();
  const before = localLists.length;
  const merged = mergeLists(localLists, loadSyncDeleted(), remote);
  writeLocal(merged.lists);
  persistSyncDeleted(merged.deleted);
  persistSyncToken(tok);
  await remotePut(tok, merged);
  persistSyncLastSync(Date.now());
  return { token: tok, total: merged.lists.length, fromToken: remote.lists.length, fromDevice: before };
}

/** Create a brand new token and upload this device's fleets to it. */
async function start(): Promise<JoinResult> {
  return join(randomToken());
}

export interface SyncResult {
  total: number;
  changed: boolean;
}

/* Pull, merge, push. Used on app start and after local edits. Always reads
 * before writing so a stale device cannot clobber another device's work. */
let inFlight: Promise<SyncResult | null> | null = null;
async function sync(): Promise<SyncResult | null> {
  const tok = token();
  if (!tok) return null;
  if (inFlight) return inFlight; // coalesce overlapping calls
  inFlight = (async () => {
    try {
      const remote = (await remoteGet(tok)) ?? EMPTY;
      const localLists = loadLists();
      const beforeIds = localLists.map((l) => l.id).join(",");
      const merged = mergeLists(localLists, loadSyncDeleted(), remote);
      writeLocal(merged.lists);
      persistSyncDeleted(merged.deleted);
      await remotePut(tok, merged);
      persistSyncLastSync(Date.now());
      const changed = merged.lists.map((l) => l.id).join(",") !== beforeIds;
      if (changed) FleetSync.onChange?.(merged.lists);
      return { total: merged.lists.length, changed };
    } finally {
      inFlight = null;
    }
  })();
  return inFlight;
}

/* Debounced sync for "keep both in step" after an edit. Failures are
 * swallowed on purpose: a background sync must never interrupt list
 * building, and the next change (or next app start) retries.
 *
 * Also rate limited. The free Firestore tier has a hard daily write
 * allowance, and building a fleet is a burst activity - adding eight ships
 * is eight saves. Without a floor between automatic syncs, heavy list
 * building could spend the day's quota and take sync down until it resets.
 * The floor applies ONLY to automatic syncs; "Sync now" always goes through
 * immediately. */
const MIN_AUTO_GAP = 15000;
let debounceTimer: ReturnType<typeof setTimeout> | undefined;
function notifyChanged(delay?: number): void {
  if (!enabled()) return;
  const base = delay ?? 2500;
  const since = Date.now() - (lastSync() ?? 0);
  const wait = Math.max(base, MIN_AUTO_GAP - since);
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    sync().catch(() => {});
  }, wait);
}

/* Stop syncing on THIS device only. The token and its cloud copy survive, so
 * the user can rejoin later or keep using it elsewhere. Local fleets are kept. */
function stop(): void {
  persistSyncToken(null);
  clearTimeout(debounceTimer);
}

/** Erase the cloud copy outright, then stop syncing here. Local fleets are
 *  kept: this deletes the ONLINE copy, not the user's work. Any other device
 *  still holding the token keeps its own local fleets and would re-upload
 *  them if it syncs again, so this going away on one device is not the same
 *  as the token being retired everywhere. */
async function deleteRemote(): Promise<boolean> {
  const tok = token();
  if (!tok) return false;
  await remoteDelete(tok);
  stop();
  return true;
}

/* ── Staying in step ─────────────────────────────────────────────────
 * A device syncs on app start and after its own edits, but a phone sitting
 * open while you edit on the desktop has no reason to look again, so it
 * quietly shows a stale list.
 *
 * Closed with events rather than polling, which would spend the free tier's
 * daily reads doing nothing useful and keep a phone's radio awake at a
 * table. These three cover what actually happens in practice:
 *
 *   visibilitychange  you switch back to the app (the big one on a phone,
 *                     where you are constantly leaving and returning)
 *   focus             same idea on a desktop with the app in a background tab
 *   online            signal came back, which is the games-hall case
 *
 * All three go through the same MIN_AUTO_GAP floor, so flicking between
 * apps cannot turn into a burst of writes. */
function maybeAutoSync(): void {
  if (!enabled()) return;
  if (Date.now() - (lastSync() ?? 0) < MIN_AUTO_GAP) return;
  sync().catch(() => {});
}
try {
  if (typeof document !== "undefined" && document.addEventListener) {
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") maybeAutoSync();
    });
  }
  if (typeof window !== "undefined" && window.addEventListener) {
    window.addEventListener("focus", maybeAutoSync);
    window.addEventListener("online", maybeAutoSync);
  }
} catch {
  // Non-browser host (the node --test sandbox); nothing to attach to.
}

setListsWrittenHook(() => {
  if (!suppressNotify) notifyChanged();
});

export const FleetSync = {
  supported,
  enabled,
  token,
  lastSync,
  looksLikeToken,
  preview,
  join,
  start,
  sync,
  notifyChanged,
  maybeAutoSync,
  stop,
  deleteRemote,
  recordDeleted,
  wordCount: WORDS.length,
  WORDS_PER_TOKEN,
  onChange: null as ((lists: SavedList[]) => void) | null,
};
