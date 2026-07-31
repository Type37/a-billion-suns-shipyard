import type { AllianceSpecies, Faction, Fleet, GameMode } from "../src/types.ts";
import type { SavedList } from "./storage.ts";
import { newId } from "./storage.ts";

// List <-> URL codec. JSON, trimmed keys, base64url in the location hash after
// "#s=". No server: the link IS the list. When the list uses a Foundry-made
// faction, the whole faction definition rides along so the link works anywhere.

interface UnitTuple {
  s: string; // shipClassId
  c: number; // count
  p?: AllianceSpecies; // species
  n?: string; // unit name
  m?: string[]; // ship names
}

interface HvpTuple {
  h: string; // hvpId
  u?: number; // assigned unit index
  n?: string; // custom personal name
}

interface PayloadV2 {
  v: 2;
  d: GameMode; // mode
  f: string; // factionId
  c: number; // creditsLimit
  n?: string; // fleet name
  e?: string; // emblem id
  x?: boolean; // free play
  u: UnitTuple[];
  h: HvpTuple[];
  cf?: Faction; // embedded custom faction
}

// Legacy v1 payload (pre-0.2.0 links): keep decoding forever.
interface PayloadV1 {
  n?: string;
  f: string;
  c: number;
  u: Array<[string, number, AllianceSpecies?]>;
  h: Array<[string, number?]>;
}

function bytesToB64Url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function b64UrlToBytes(s: string): Uint8Array {
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

function toB64Url(json: string): string {
  return bytesToB64Url(new TextEncoder().encode(json));
}

function fromB64Url(s: string): string {
  return new TextDecoder().decode(b64UrlToBytes(s));
}

// Optional gzip-style compression (deflate-raw), used to shrink the link when
// the browser supports the Compression Streams API. Compressed links carry a
// "z=" prefix; plain base64url links keep "s=". Both are always decodable.
const CAN_COMPRESS =
  typeof CompressionStream !== "undefined" && typeof DecompressionStream !== "undefined";

async function pipeThrough(bytes: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const writer = stream.writable.getWriter();
  void writer.write(bytes as unknown as BufferSource);
  void writer.close();
  const buf = await new Response(stream.readable).arrayBuffer();
  return new Uint8Array(buf);
}

async function deflateToB64Url(json: string): Promise<string> {
  const out = await pipeThrough(new TextEncoder().encode(json), new CompressionStream("deflate-raw"));
  return bytesToB64Url(out);
}

async function inflateFromB64Url(b64: string): Promise<string> {
  const out = await pipeThrough(b64UrlToBytes(b64), new DecompressionStream("deflate-raw"));
  return new TextDecoder().decode(out);
}

/** The trimmed payload JSON for a list (shared by encodeList and shareUrl). */
function payloadJson(list: SavedList, customFaction?: Faction): string {
  return JSON.stringify(buildPayload(list, customFaction));
}

function buildPayload(list: SavedList, customFaction?: Faction): PayloadV2 {
  const fleet = list.fleet;
  const payload: PayloadV2 = {
    v: 2,
    d: list.mode,
    f: fleet.factionId,
    c: fleet.creditsLimit,
    u: fleet.units.map((u) => {
      const t: UnitTuple = { s: u.shipClassId, c: u.count };
      if (u.species) t.p = u.species;
      if (u.name) t.n = u.name;
      if (u.shipNames?.some((s) => s)) t.m = u.shipNames;
      return t;
    }),
    h: fleet.hvp.map((h) => {
      const t: HvpTuple = { h: h.hvpId };
      const idx = h.assignedUnitId ? fleet.units.findIndex((u) => u.id === h.assignedUnitId) : -1;
      if (idx >= 0) t.u = idx;
      if (h.customName) t.n = h.customName;
      return t;
    }),
  };
  if (fleet.name) payload.n = fleet.name;
  if (list.emblem && list.emblem !== "delta") payload.e = list.emblem;
  if (list.freePlay) payload.x = true;
  if (customFaction) payload.cf = customFaction;
  return payload;
}

/** Plain base64url encoding of a list (the "s=" form). Kept for compatibility. */
export function encodeList(list: SavedList, customFaction?: Faction): string {
  return toB64Url(payloadJson(list, customFaction));
}

export interface DecodedShare {
  list: SavedList;
  customFaction?: Faction;
}

/** Decode a base64url share payload (v2 or legacy v1) into a fresh SavedList. */
export function decodeShare(raw: string): DecodedShare | null {
  try {
    return decodeShareJson(fromB64Url(raw));
  } catch {
    return null;
  }
}

/** Decode a raw JSON payload string (v2 or legacy v1) into a fresh SavedList. */
export function decodeShareJson(jsonStr: string): DecodedShare | null {
  try {
    const parsed = JSON.parse(jsonStr) as PayloadV2 | PayloadV1;
    const now = new Date().toISOString();

    if ((parsed as PayloadV2).v === 2) {
      const p = parsed as PayloadV2;
      if (typeof p.f !== "string" || !Array.isArray(p.u) || !Array.isArray(p.h)) return null;
      const units = p.u.map((t, i) => ({
        id: `u${i + 1}`,
        shipClassId: t.s,
        count: t.c,
        ...(t.p ? { species: t.p } : {}),
        ...(t.n ? { name: t.n } : {}),
        ...(t.m ? { shipNames: t.m } : {}),
      }));
      const hvp = p.h.map((t) => ({
        hvpId: t.h,
        ...(typeof t.u === "number" && units[t.u] ? { assignedUnitId: units[t.u]!.id } : {}),
        ...(t.n ? { customName: t.n } : {}),
      }));
      // Rebuild the by-role name memory from the selections rather than putting
      // it in the payload twice: an imported fleet should survive unchoosing
      // somebody just as well as one built here.
      const hvpNames: Record<string, string> = {};
      for (const h of hvp) if (h.customName) hvpNames[h.hvpId] = h.customName;
      const fleet: Fleet = {
        name: p.n ?? "",
        factionId: p.f,
        creditsLimit: p.c,
        units,
        hvp,
        ...(Object.keys(hvpNames).length ? { hvpNames } : {}),
      };
      const list: SavedList = {
        id: newId("fl"),
        mode: p.d ?? "armageddon",
        freePlay: p.x === true,
        emblem: p.e ?? "delta",
        fleet,
        createdAt: now,
        updatedAt: now,
      };
      return p.cf ? { list, customFaction: p.cf } : { list };
    }

    const p = parsed as PayloadV1;
    if (typeof p.f !== "string" || typeof p.c !== "number" || !Array.isArray(p.u)) return null;
    const units = p.u.map(([shipClassId, count, species], i) => ({
      id: `u${i + 1}`,
      shipClassId,
      count,
      ...(species ? { species } : {}),
    }));
    const hvp = (p.h ?? []).map(([hvpId, idx]) =>
      typeof idx === "number" && units[idx] ? { hvpId, assignedUnitId: units[idx]!.id } : { hvpId },
    );
    return {
      list: {
        id: newId("fl"),
        mode: "armageddon",
        freePlay: false,
        emblem: "delta",
        fleet: { name: p.n ?? "", factionId: p.f, creditsLimit: p.c, units, hvp },
        createdAt: now,
        updatedAt: now,
      },
    };
  } catch {
    return null;
  }
}

/** A share payload lifted from the hash, tagged compressed ("z") or plain ("s"). */
export interface SharePayload {
  kind: "s" | "z";
  data: string;
}

/** Extract a share payload from a URL hash: "#z=" (compressed), "#s=", or legacy raw. */
export function sharePayloadFromHash(hash: string): SharePayload | null {
  const h = hash.replace(/^#/, "");
  if (h.startsWith("z=")) return { kind: "z", data: h.slice(2) };
  if (h.startsWith("s=")) return { kind: "s", data: h.slice(2) };
  // Legacy links put the payload directly in the hash. Route hashes start with
  // "/", payloads never do.
  if (h && !h.startsWith("/")) return { kind: "s", data: h };
  return null;
}

/** Decode a payload of either kind into a fresh SavedList (async: may inflate). */
export async function decodeSharePayload(p: SharePayload): Promise<DecodedShare | null> {
  if (p.kind === "z") {
    try {
      return decodeShareJson(await inflateFromB64Url(p.data));
    } catch {
      return null;
    }
  }
  return decodeShare(p.data);
}

/**
 * Build a share URL, compressed when the browser supports it and the compressed
 * form is actually shorter (it usually is for anything but a tiny fleet).
 */
export async function shareUrl(list: SavedList, customFaction?: Faction): Promise<string> {
  const base = `${location.origin}${location.pathname}`;
  const json = payloadJson(list, customFaction);
  const plain = toB64Url(json);
  if (CAN_COMPRESS) {
    try {
      const z = await deflateToB64Url(json);
      if (z.length < plain.length) return `${base}#z=${z}`;
    } catch {
      // fall through to the plain link
    }
  }
  return `${base}#s=${plain}`;
}
