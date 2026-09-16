// Faction emblems: one locked default mark per faction, authored on a 0 0 100 100
// grid. These are the marks designed for the twelve rulebook factions, distinct
// from the generic emblem set in icons.ts (delta, orbit, ring, and so on).
//
// Rendering model, so the picker can tint them later:
//   - `currentColor` is the tintable field. It follows the SVG's CSS `color`,
//     which factionEmblemSvg sets from the chosen colour (or the mark's default).
//   - `var(--paper)` is negative space: it reads as a knockout on any coloured
//     field and stays paper-white when the field is tinted.
//   - The Alliance mark is intrinsically three-colour (three species) and so is
//     flagged `multicolor`; it ignores tinting and keeps its fixed fills.
//
// Treatment tracks era: Hypergrowth factions are line/letter brand marks, Age of
// Unity factions are solid black-and-white symbols, and the Armageddon war
// factions are bold colour roundels with the symbol cut out as negative space.

export type EmblemColor = "ink" | "blue" | "red";

export interface FactionEmblem {
  /** Stable id stored on a list, e.g. "vyke-fangs". */
  id: string;
  /** The faction this is the default mark for. */
  factionId: string;
  label: string;
  /** Default tint. B&W marks use "ink"; the Armageddon roundels default to colour. */
  defaultColor: EmblemColor;
  /** True when the mark carries its own fixed colours and cannot be tinted (Alliance). */
  multicolor?: boolean;
  /** SVG inner body on a 0 0 100 100 grid. */
  body: string;
}

const COLOR_VAR: Record<EmblemColor, string> = {
  ink: "var(--ink)",
  blue: "var(--blue)",
  red: "var(--red)",
};

export const FACTION_EMBLEMS: FactionEmblem[] = [
  // --- Hypergrowth: line and letter brand marks ---------------------------
  {
    id: "heavy-industries-hbeam",
    factionId: "heavy-industries",
    label: "H-beam",
    defaultColor: "ink",
    body:
      '<g fill="currentColor"><rect x="20" y="18" width="15" height="64"/><rect x="65" y="18" width="15" height="64"/><rect x="35" y="42" width="30" height="16"/></g>' +
      '<g fill="var(--paper)"><circle cx="27" cy="27" r="3"/><circle cx="27" cy="73" r="3"/><circle cx="72" cy="27" r="3"/><circle cx="72" cy="73" r="3"/></g>',
  },
  {
    // Id kept from the old stencil M so saved lists still resolve. The mark is
    // the Phantom Megamart logo (teal roundel, M over a mirrored M), rescaled
    // from its -1412..1412 grid. The source let the lower M run past the circle
    // onto a white square; here that M is cut at the circle edge instead so the
    // mark sits on any background. Fixed teal, so it is multicolor.
    id: "megamart-stencil-m",
    factionId: "megamart",
    label: "Megamart M",
    defaultColor: "ink",
    multicolor: true,
    body:
      '<circle cx="50" cy="50" r="50" fill="rgb(57,127,139)"/>' +
      '<g fill="#fff"><polygon points="20.25,22.84 50,44.44 79.75,22.84 79.75,67.81 65.93,67.81 65.93,48.69 50,60.3 34.07,48.69 34.07,67.81 20.25,67.81"/>' +
      '<path d="M20.25 77.37 H34.07 V96.49 L50 84.88 L65.93 96.49 V77.37 H79.75 V90.19 A50 50 0 0 1 20.25 90.19 Z"/></g>',
  },
  {
    id: "news-masthead-n",
    factionId: "news-inc",
    label: "Masthead N",
    defaultColor: "ink",
    body:
      '<g fill="currentColor"><rect x="14" y="12" width="72" height="2"/>' +
      '<path d="M22 78 L22 22 L34 22 L64 60 L64 22 L76 22 L76 78 L64 78 L34 40 L34 78 Z"/>' +
      '<rect x="14" y="86" width="72" height="5"/><rect x="14" y="94" width="72" height="2"/></g>',
  },
  {
    id: "galactic-credit-gc",
    factionId: "galactic-credit",
    label: "GC monogram",
    defaultColor: "ink",
    body:
      '<path d="M74 30 A30 30 0 1 0 74 70" fill="none" stroke="currentColor" stroke-width="10"/>' +
      '<path d="M66 40 A17 17 0 1 0 66 60 L66 50 L56 50" fill="none" stroke="currentColor" stroke-width="9"/>',
  },
  // --- Age of Unity: solid black-and-white symbols ------------------------
  {
    id: "unity-fasces",
    factionId: "the-unity",
    label: "Fasces",
    defaultColor: "ink",
    body:
      '<g fill="currentColor"><path d="M28 8 Q50 2 72 8 L66 20 L34 20 Z"/>' +
      '<rect x="24" y="20" width="8" height="72" rx="3"/><rect x="35" y="20" width="8" height="72" rx="3"/>' +
      '<rect x="46" y="20" width="8" height="72" rx="3"/><rect x="57" y="20" width="8" height="72" rx="3"/>' +
      '<rect x="68" y="20" width="8" height="72" rx="3"/>' +
      '<rect x="20" y="40" width="60" height="6"/><rect x="20" y="66" width="60" height="6"/></g>',
  },
  {
    id: "ordinate-grid",
    factionId: "the-ordinate",
    label: "Predicted grid",
    defaultColor: "ink",
    body:
      '<g fill="none" stroke="currentColor" stroke-width="3">' +
      '<rect x="11" y="11" width="22" height="22"/><rect x="39" y="11" width="22" height="22"/>' +
      '<rect x="11" y="39" width="22" height="22"/><rect x="39" y="39" width="22" height="22"/><rect x="67" y="39" width="22" height="22"/>' +
      '<rect x="11" y="67" width="22" height="22"/><rect x="39" y="67" width="22" height="22"/><rect x="67" y="67" width="22" height="22"/></g>' +
      '<rect x="67" y="11" width="22" height="22" fill="currentColor"/>',
  },
  {
    id: "discord-starbird",
    factionId: "the-discord",
    label: "Starbird",
    defaultColor: "ink",
    body:
      '<circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" stroke-width="3"/>' +
      '<path fill="currentColor" d="M50 14 C47 26 46 32 45 38 C38 30 28 28 18 32 C27 37 35 44 39 54 C32 52 24 55 20 62 C30 66 42 64 46 58 C47 68 48 76 50 86 C52 76 53 68 54 58 C58 64 70 66 80 62 C76 55 68 52 61 54 C65 44 73 37 82 32 C72 28 62 30 55 38 C54 32 53 26 50 14 Z"/>',
  },
  {
    id: "golem-replication-trail",
    factionId: "golem-mega-systems",
    label: "Replication trail",
    defaultColor: "ink",
    body:
      '<g fill="currentColor"><polygon points="28,60 42,88 14,88"/><polygon points="44,49 55,71 33,71"/>' +
      '<polygon points="58,39.5 66.5,56.5 49.5,56.5"/><polygon points="70,32 76,50 64,50"/>' +
      '<polygon points="80,25.5 84.5,39.5 75.5,39.5"/></g>',
  },
  // --- Armageddon: colour roundels, symbol as negative space --------------
  {
    id: "vyke-fangs",
    factionId: "vyke",
    label: "Fangs",
    defaultColor: "red",
    body:
      '<circle cx="50" cy="50" r="44" fill="currentColor"/>' +
      '<path d="M33 26 C20 42 26 66 48 80" stroke="var(--paper)" stroke-width="9" fill="none" stroke-linecap="round"/>' +
      '<path d="M67 26 C80 42 74 66 52 80" stroke="var(--paper)" stroke-width="9" fill="none" stroke-linecap="round"/>' +
      '<path d="M50 40 L45 60 L50 72 L55 60 Z" fill="var(--paper)"/>',
  },
  {
    id: "aegis-shards",
    factionId: "aegis",
    label: "Interlocked shards",
    defaultColor: "blue",
    body:
      '<circle cx="50" cy="50" r="44" fill="currentColor"/>' +
      '<g fill="var(--paper)"><polygon points="24,58 44,58 52,74 32,74"/>' +
      '<polygon points="38,44 58,44 66,60 46,60"/><polygon points="52,30 72,30 80,46 60,46"/></g>',
  },
  {
    id: "gen-omega-void",
    factionId: "gen-omega",
    label: "Omega void",
    defaultColor: "red",
    body:
      '<circle cx="50" cy="50" r="44" fill="currentColor"/>' +
      '<path fill="var(--paper)" d="M50 24 C37 24 28 35 28 49 C28 59 33 67 42 71 L42 74 L31 74 L31 82 L47 82 L47 65 C39 62 35 56 35 48 C35 38 42 32 50 32 C58 32 65 38 65 48 C65 56 61 62 53 65 L53 82 L69 82 L69 74 L58 74 L58 71 C67 67 72 59 72 49 C72 35 63 24 50 24 Z"/>',
  },
  {
    id: "alliance-triskele",
    factionId: "alliance",
    label: "Fractious triskele",
    defaultColor: "blue",
    multicolor: true,
    body:
      '<path d="M50 50 L14.4 24.1 A44 44 0 0 1 85.6 24.1 Z" fill="var(--blue)"/>' +
      '<path d="M50 50 L90.2 32.1 A44 44 0 0 1 54.6 93.8 Z" fill="var(--red)"/>' +
      '<path d="M50 50 L45.4 93.8 A44 44 0 0 1 9.8 32.1 Z" fill="var(--ink)"/>' +
      '<circle cx="50" cy="50" r="12" fill="var(--paper)"/>',
  },
];

const BY_ID = new Map(FACTION_EMBLEMS.map((e) => [e.id, e]));
const BY_FACTION = new Map(FACTION_EMBLEMS.map((e) => [e.factionId, e]));

export function getFactionEmblem(id: string): FactionEmblem | undefined {
  return BY_ID.get(id);
}

/** The default mark for a faction, if one exists (built-in factions only). */
export function defaultEmblemFor(factionId: string): FactionEmblem | undefined {
  return BY_FACTION.get(factionId);
}

export const FACTION_EMBLEM_IDS = FACTION_EMBLEMS.map((e) => e.id);

/**
 * Render a faction emblem as a standalone SVG string. `color` tints the field;
 * omit it to use the mark's default. Multi-colour marks (Alliance) ignore it.
 */
export function factionEmblemSvg(
  id: string,
  size = 28,
  color?: EmblemColor,
  cls = "",
): string {
  const e = BY_ID.get(id);
  if (!e) return "";
  const tint = e.multicolor ? "" : `color:${COLOR_VAR[color ?? e.defaultColor]};`;
  return `<svg class="emblem ${cls}" width="${size}" height="${size}" viewBox="0 0 100 100" style="${tint}" aria-hidden="true">${e.body}</svg>`;
}
