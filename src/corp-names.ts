// Corporation-name generator for Hypergrowth companies.
//
// Ported from the tabletop "Corporation Generator"
// (jetwong.neocities.org/rpgs/corp-generator): a two-part name, a prefix rolled
// against a suffix, so a Hypergrowth megacorp reads like "Gene Labs", "Hax
// Industrial", or "Progen Wave" - deliberately grim and faux-corporate to match
// the era's satire. On top of that, roughly one roll in thirteen ("a 13 on the
// d13 first roll") yields a complete, hand-written name instead of an assembled
// pairing, and those include faction-specific one-offs.

/** Part one: the prefix roll. */
export const CORP_NAME_PART_ONE: readonly string[] = [
  "Cy", "Kifo", "Fosse", "Ütga", "Crown's", "Galg",
  "Smrt", "Gene", "Pereo", "Progen", "Häx", "Futura",
  "Atinko", "Sudermann", "Markova",
];

/** Part two: the suffix roll. */
export const CORP_NAME_PART_TWO: readonly string[] = [
  "Futures", "Tech", "Inc", "Industrial", "Labs", "Nero",
  "Mgmt", "Svärta", "Wave", "Institute", "Division", "Malum",
  "Bioware",
];

/**
 * Whole-name table: complete company names that arrive intact, not assembled
 * from the two parts. Rolled on the ~1-in-13 whole-name result (see below).
 */
export const CORP_NAME_WHOLE: readonly string[] = [
  "Okazaki Offworld",
  "Canaan GmbH",
  "Bell Supersystems",
  "Shimago-Dominguez",
  "Shimata",
  "First Allied Company",
  "The Squimm Group",
  "Anmok Ocean & Space & More (OSM)",
  "Kabukicho Arcade",
  "Shanghai Export & Import",
  "MirrorWare Industries",
  "Cynergy Water & Power Co",
  "Fideistic Transformation",
  "Kaytell Makers",
  "Spectral FT Banks & Holdings",
];

/**
 * Faction-flavoured whole names: these only ever surface when the fleet belongs
 * to the keyed faction, mixed into that faction's whole-name pool. Keyed by
 * faction id (galactic-credit is the "law" faction, with the in-house lawyers).
 */
export const CORP_NAME_WHOLE_BY_FACTION: Readonly<Record<string, readonly string[]>> = {
  "galactic-credit": ["Gravf, Mellberg & Tosk"],
  "gen-omega": ["Heirz of Kergoz"],
  "megamart": ["Royal West Shipping Co"],
};

function roll(list: readonly string[]): string {
  return list[Math.floor(Math.random() * list.length)]!;
}

/**
 * A random corporation name. The prefix roll is a d13: twelve-in-thirteen it
 * pairs a part-one prefix with a part-two suffix, exactly as the paper generator
 * ("Gene Labs", "Häx Industrial"). The thirteenth result pulls a complete name
 * from the whole-name table instead - which, for a known faction, also includes
 * that faction's own one-offs (e.g. "Heirz of Kergoz" only for Gen Omega).
 */
export function randomCorpName(factionId?: string): string {
  if (Math.random() < 1 / 13) {
    const factionWhole = factionId ? CORP_NAME_WHOLE_BY_FACTION[factionId] ?? [] : [];
    return roll([...CORP_NAME_WHOLE, ...factionWhole]);
  }
  return `${roll(CORP_NAME_PART_ONE)} ${roll(CORP_NAME_PART_TWO)}`;
}
