// Capital-ship names.
//
// Mass 3 is the top of the scale and a fleet holds at most one or two of them,
// so those are the hulls people talk about after the game - "the one that ate
// three salvos and kept going". A ship you remember deserves a name, and it is
// the sort of thing nobody gets round to typing in themselves, so the app does
// it: every Mass 3 unit is christened the moment it joins a fleet.
//
// WHERE THESE COME FROM
//
// Transcribed from unsc-ships-halopedia.md, which is 546 named UNSC vessels
// pulled off Halopedia. Only the multi-word ones are here, because that is
// where the character is - the single-word entries are almost all places
// (Cairo, Dusk, Musashi) and read as a list of station names rather than as
// ships. Disambiguation artefacts and numbered sequels are dropped.
//
// Halo names capital ships the way the Culture names its Minds: half of them
// are grave and half are taking the piss, often in the same fleet. "Forward
// Unto Dawn" and "Say My Name". "Of Uncommon Courage" and "Two for Flinching".
// That range is the reason this list is the source rather than a generated
// adjective-noun pattern like the fleet namer uses - a generator produces
// consistent output, and consistency is exactly what makes ship names boring.
//
// WHO GETS THEM
//
// The UNSC example faction, and nobody else. These went to every faction once,
// on the argument that they are naval-register names rather than Halo lore and
// a corporate battlegroup called the Witch Bucket is funnier than one called
// the Profit Margin. It is still funnier, and it is still wrong: the Vyke are
// an alien hive and Megamart is a shop, and neither of them christens a hull
// "Of Uncommon Courage". A pool belongs to the fleet it was written for.
//
// So pools are keyed by faction id (SHIP_NAME_POOLS) and a faction without one
// simply does not auto-name, the way every hull under Mass 3 already does not.

import { TRIBUTE_NAMES } from "./tributes.ts";

/** The UNSC pool. 108 names, all multi-word, in the order Halopedia lists them. */
export const UNSC_CAPITAL_SHIP_NAMES: string[] = [
  "Totem Lake",
  "Fifth Winter",
  "Victory of Samothrace",
  "Euclid’s Anvil",
  "Song of the East",
  "Unto the Breach",
  "Feeling Lucky",
  "Say My Name",
  "Dawn Under Heaven",
  "Persian Gate",
  "Pillar of Autumn",
  "Roman Blue",
  "Weeping Willows",
  "Winged Hussar",
  "Armageddon’s Edge",
  "Burden of Proof",
  "Mesa Verde",
  "Rio Grande",
  "The Heart of Midlothian",
  "Buenos Aires",
  "Las Vegas",
  "Bunker Hill",
  "Campo Grande",
  "Glasgow Kiss",
  "Iwo Jima",
  "Lance Held High",
  "Monte Cassino",
  "Virginia Capes",
  "Blank Check",
  "Promise of Dawn",
  "Aegis Fate",
  "Forward Unto Dawn",
  "Fearful Symmetry",
  "Mortal Reverie",
  "In Amber Clad",
  "Meriwether Lewis",
  "Midsummer Night",
  "Stalwart Dawn",
  "Fair Weather",
  "Ready or Not",
  "Swift Justice",
  "Tripping Light",
  "Welcome to the Snipehunt",
  "Bum Rush",
  "Coral Sea",
  "Two for Flinching",
  "Sagan Blue",
  "Pony Express",
  "Bad Moon Rising",
  "Hidden Point",
  "Point Blank",
  "Point of No Return",
  "Relentless Watch",
  "Vanishing Point",
  "Edge of Umbra",
  "Last Gleaming",
  "Razor’s Edge",
  "Wink of an Eye",
  "Black Widow",
  "Ghost Song",
  "Ghost Star",
  "Ghost Wind",
  "Night Watch",
  "Starry Night",
  "Port Stanley",
  "Silent Joe",
  "Red Horse",
  "Fast Gus",
  "From the Ashes",
  "Perilous Contest",
  "Spirit of Fire",
  "Silent Claw",
  "Special Delivery",
  "Walk of Shame",
  "Abstract Endurance",
  "All Under Heaven",
  "Amicable Disagreement",
  "Argyle Gift",
  "Battle of Minden",
  "Brilliant Shores",
  "Buteo’s Talon",
  "Dark Was the Night",
  "Do You Feel Lucky?",
  "Down Out and Go",
  "Eminent Domain",
  "Final Summit",
  "Irish Goodbye",
  "Melbourne’s Pride",
  "Of Uncommon Courage",
  "Phyllis Wheatley",
  "Resolute Harmony",
  "Sentry of El Morro",
  "Sevenfold Gates",
  "Tokyo Rules",
  "Verdant Sumerian",
  "Witch Bucket",
  "Carl Sagan",
  "Casa del Esparza",
  "Easy Does It",
  "Get My Drift",
  "Hazard Pay",
  "Hush Now",
  "Ice Storm",
  "Mirthless Smile",
  "Quiet Death",
  "Quiet Man",
  "Sword of Ascalaphus",
  "Widow Maker",
];

/**
 * The Covenant pool. 113 names, alphabetical, as Halopedia lists them.
 *
 * Same source and same method as the UNSC pool above: Halopedia's ship
 * category, transcribed. An earlier cut of this list was pulled out of the Halo
 * Encyclopedia (2022) instead and ran to fourteen - the book is organised by
 * ship CLASS rather than as a register, so it names a single example hull per
 * class and no more. The category has the register.
 *
 * Seven of the category's 120 entries are not names and are not here: two hull
 * codes (CCS-U321, CCS-U624), three placeholders for ships the fiction never
 * named ("Covenant cruiser at Longhorn Valley", "Unnamed Kig-Yar transport",
 * "Var 'Gatanai's ship"), an index page, and the second Devotion, which is the
 * same name twice with a disambiguator. Halopedia's other disambiguators are
 * dropped rather than the entries - Penance, Revenant and Swordsman are the
 * ships' actual names, and the "(ship)" is the wiki telling itself apart.
 *
 * Unlike the UNSC list, single-word names stay. On the UNSC side those were
 * nearly all places and read as stations; here they are Absolution, Pitiless,
 * Lawgiver and Contrition, which is the Covenant naming a hull after a verdict.
 */
export const COVENANT_CAPITAL_SHIP_NAMES: string[] = [
  "A Psalm Every Day", "Absolution", "Adherent", "Almighty Persuasion", "Ardent Prayer",
  "Ascendant Justice", "Axiom", "Blameless Conceit", "Blight of the Profane",
  "Bloodied Spirit", "Breath of Annihilation", "Brilliant Gift", "Burgeoning Fealty",
  "Certain Prophecy", "Clarity of Faith", "Cleansing Truth", "Commitment and Patience",
  "Contrition", "Dagger of Mercy", "Daggerboard", "Day of Jubilation", "Defender of Faith",
  "Devotion", "Divine Breath", "Divine Whisper", "Doctrine’s Command", "Elegy’s Lament",
  "Enduring Conviction", "Esteem", "Eternal Reward", "Far Sight Lost", "Far Vision",
  "Fighter’s Blood", "Great Light", "Hammer of Faith", "Hammer of Fate", "Hammerstrike",
  "Harbinger of Piety", "Heaven’s Brilliant Bier", "Heresy’s Sorrow", "Incorruptible",
  "Indulgence of Conviction", "Infinite Sacrifice", "Infinite Spoils", "Infinite Succor",
  "Journey’s Sustenance", "Lawgiver", "Long Night of Solace", "Mark of Prophecy", "Mayhem",
  "Minor Transgression", "Panom’s Canticle", "Paragon", "Penance", "Perpetual Devotion",
  "Piety", "Pious Inquisitor", "Pious Rampage", "Pitiless", "Pledge of Holiness",
  "Proclamation’s Tithe", "Promised Redemption", "Promised Revelation", "Pure Resolve",
  "Purifying Flame", "Purity of Spirit", "Purveyor of Serenity", "Purveyor of Virtue",
  "Quiet Faith", "Radiant Arrow", "Radiant Perception", "Rampant Perdition",
  "Rapid Conversion", "Rapturous Arc", "Reckless Pursuit", "Reprisal’s Fire",
  "Resplendent Fervor", "Retribution’s Promise", "Retribution’s Thunder", "Revenant",
  "Reverence", "Sacred Promise", "Sacred Whisper", "Sanctity of Purification",
  "Seeker of Truth", "Serene Certainty", "Shadow of Intent", "Silent Truth",
  "Solemn Penance", "Song of Retribution", "Song of Wrath", "Spear of Light",
  "Splendid Intention", "Steadfast Strike", "Still Devotion", "Sublime Transcendence",
  "Sundered Psalm", "Supplication of Purity", "Swordsman", "Tenebrous", "The Lookout",
  "Transforming Splendor", "Triumphant Declaration", "Truth and Reconciliation",
  "Twilight Compunction", "Undiminished Entelechy", "Unflinching Resolve", "Unrelenting",
  "Upright Chalice", "Valorous Salvation", "Vengeful Deed", "Vengeful Vitality",
  "Worthy Silence",
];
/**
 * Capital-ship name pools, keyed by faction id.
 *
 * Only the UNSC example has one. Adding another is a list and a line here; a
 * faction with no entry auto-names nothing, which is the right default for the
 * twelve published factions - the book gives them ship CLASSES, not registers
 * of named hulls, and inventing a naming tradition for somebody else's faction
 * is a bigger liberty than leaving the field blank for the player.
 */
export const SHIP_NAME_POOLS: Record<string, readonly string[]> = {
  // The tributes ride along with the UNSC list rather than sitting in it: that
  // list is a transcription and stays one. A UNSC fleet is about one name in
  // twelve away from a designer, and naming a hull after a person is already
  // what that pool does - Carl Sagan and Phyllis Wheatley are in there.
  "cf-example-unsc": [...UNSC_CAPITAL_SHIP_NAMES, ...TRIBUTE_NAMES],
  // The Covenant name ships after virtues and verdicts, never after people,
  // so no tributes here.
  "cf-example-covenant": COVENANT_CAPITAL_SHIP_NAMES,
};

/**
 * A stable 32-bit hash of a string. Not cryptographic - it exists so a name is
 * a pure function of the unit it belongs to.
 */
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Name a capital ship, deterministically, from a seed.
 *
 * Returns undefined for a faction with no pool of its own - that fleet's Mass 3
 * hulls arrive unnamed and the player names them or does not.
 *
 * Deterministic on purpose: the seed is the unit's own id, so the name is
 * decided once by WHICH unit it is and never drifts. The app re-renders the
 * whole page on every state change, and a name that came from Math.random()
 * would be re-rolled on every keystroke elsewhere in the builder.
 *
 * `taken` keeps a fleet from fielding two ships of the same name: it walks
 * forward from the hashed index rather than re-rolling, so adding a second
 * capital never changes the first one's name.
 */
export function capitalShipName(
  factionId: string,
  seed: string,
  taken: readonly string[] = [],
): string | undefined {
  const pool = SHIP_NAME_POOLS[factionId];
  if (!pool?.length) return undefined;
  const start = hash(seed) % pool.length;
  const used = new Set(taken);
  for (let i = 0; i < pool.length; i++) {
    const n = pool[(start + i) % pool.length]!;
    if (!used.has(n)) return n;
  }
  // Every name in use. A fleet that big is not reachable under any credits
  // limit in the game, but returning something is better than returning
  // nothing.
  return pool[start]!;
}
