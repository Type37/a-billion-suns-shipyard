import { get, set, del, keys, getMany } from "idb-keyval";

/*
 * Where uploaded pictures actually live.
 *
 * They used to live in the saved state, as base64 data URLs inside the same
 * localStorage blob as the fleets. That works and is what every other field
 * here does, but images are not like the other fields:
 *
 *   - localStorage stores UTF-16, so a base64 string costs about TWO bytes per
 *     character - and base64 has already inflated the bytes by a third. A 50KB
 *     JPEG lands as roughly 133KB of quota. A 3.5x tax to store a file.
 *   - The whole budget is about 5MB, for everything. Art on a fleet's worth of
 *     ship classes reached the ceiling, and reaching it meant a save that
 *     silently did not happen.
 *
 * IndexedDB has neither problem. It stores Blobs as bytes, so a 50KB JPEG is
 * 50KB, and the quota is a share of free disk - hundreds of megabytes rather
 * than five. So that is where the pictures go, and the saved state keeps a
 * short reference to each one instead of its contents.
 *
 * idb-keyval does the talking. Raw IndexedDB is an event-based API with
 * transactions and version upgrades, none of which is interesting when what you
 * want is get/set/delete on one store; this is ~600 bytes and exactly that
 * shape. localForage was the other candidate and is ten times the size for a
 * driver system (WebSQL, localStorage fallbacks) aimed at browsers that no
 * longer exist.
 *
 * ---------------------------------------------------------------------------
 * The contract for everything else in the app
 *
 * A stored image is a string like "img:k3f9a2". Anything holding one - a
 * fleet's emblemImage, a ship class's image - passes it through imageSrc() to
 * get something an <img src> will accept.
 *
 * imageSrc() is SYNCHRONOUS, because render() is. That works because every blob
 * is read once at boot (hydrate) and turned into an object URL held in memory,
 * so by the time anything renders, resolving a reference is a Map lookup. The
 * alternative - an async render, or a per-image placeholder that swaps in later
 * - would have meant threading promises through a renderer that is deliberately
 * a pure function of state.
 *
 * A value that is NOT an "img:" reference is passed straight back. That covers
 * the built-in emblem library's URLs, and any data URL still sitting in a
 * browser from before this existed.
 */

/** In-memory ref -> object URL. Populated once by hydrate(), added to by put(). */
const urls = new Map<string, string>();

const PREFIX = "img:";

/** Keys in IndexedDB are the full reference, so a sweep can compare like for like. */
function isRef(v: string | undefined): v is string {
  return typeof v === "string" && v.startsWith(PREFIX);
}

/**
 * Read every stored picture and hold an object URL for each.
 *
 * Called once, at boot, before the app has painted anything that could want an
 * image. Failure is not fatal and is not reported: a browser that refuses
 * IndexedDB (private mode in some versions, storage disabled) should still run
 * the builder, just without previously uploaded art.
 */
export async function hydrateImages(): Promise<void> {
  try {
    const ks = (await keys()) as string[];
    const refs = ks.filter(isRef);
    if (!refs.length) return;
    const blobs = await getMany<Blob | undefined>(refs);
    refs.forEach((ref, i) => {
      const blob = blobs[i];
      if (blob) urls.set(ref, URL.createObjectURL(blob));
    });
  } catch {
    // No image store this session; imageSrc falls through to "".
  }
}

/**
 * Store a picture and return the reference to keep in state.
 *
 * The id is random rather than a hash of the contents: two fleets that happen
 * to use the same picture should be able to lose one without blanking the
 * other, and the sweep below is what keeps the store from growing.
 */
export async function putImage(blob: Blob): Promise<string> {
  const ref = `${PREFIX}${Math.random().toString(36).slice(2, 10)}`;
  await set(ref, blob);
  urls.set(ref, URL.createObjectURL(blob));
  return ref;
}

/** What to put in an <img src>. Non-references (library URLs, data URLs) pass through. */
export function imageSrc(value: string | undefined): string | undefined {
  if (!value) return value;
  if (!isRef(value)) return value;
  return urls.get(value) ?? "";
}

/** True if this value is one of ours, i.e. worth resolving to bytes before sending. */
export function isImageRef(value: string | undefined): boolean {
  return isRef(value);
}

/**
 * A stored picture as a data URL.
 *
 * Only Fleet Sync needs this. Its wire format carries emblems inline and has to
 * keep doing so - the far end is another device with its own image store and no
 * way to read this one's.
 */
export async function imageDataUrl(ref: string): Promise<string | undefined> {
  try {
    const blob = await get<Blob>(ref);
    if (!blob) return undefined;
    return await new Promise((resolve) => {
      const r = new FileReader();
      r.onerror = () => resolve(undefined);
      r.onload = () => resolve(r.result as string);
      r.readAsDataURL(blob);
    });
  } catch {
    return undefined;
  }
}

/** Store a data URL that arrived from somewhere else, and return a local reference. */
export async function internDataUrl(dataUrl: string): Promise<string | undefined> {
  try {
    const res = await fetch(dataUrl);
    return await putImage(await res.blob());
  } catch {
    return undefined;
  }
}

/**
 * Delete stored pictures nothing points at any more.
 *
 * Removing an emblem or a ship class drops the reference from state; without
 * this the bytes would stay in IndexedDB for ever, which is exactly the leak
 * the old inline storage could not have (there, the picture WAS the state).
 * Called after each save with every reference the app still holds, so the
 * question is answered from the whole store rather than by trying to notice
 * each individual removal at its call site - there are a dozen of those and
 * missing one would leak silently.
 */
export async function sweepImages(inUse: Set<string>): Promise<void> {
  try {
    const ks = (await keys()) as string[];
    for (const k of ks) {
      if (!isRef(k) || inUse.has(k)) continue;
      await del(k);
      const url = urls.get(k);
      if (url) URL.revokeObjectURL(url);
      urls.delete(k);
    }
  } catch {
    // Leaving orphans is survivable; failing a save over it is not.
  }
}
