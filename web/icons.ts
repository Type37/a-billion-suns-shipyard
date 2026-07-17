// Geometric inline SVG icons. All stroke-based, inherit currentColor, drawn on
// a 24-unit grid so they align with the type baseline. No icon fonts.

const PATHS: Record<string, string> = {
  // wordmark companion: a planet disc with a single orbit line
  logo: '<circle cx="12" cy="12" r="5.5"/><ellipse cx="12" cy="12" rx="10" ry="3.4" transform="rotate(-18 12 12)"/>',
  plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
  minus: '<line x1="5" y1="12" x2="19" y2="12"/>',
  close: '<line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/>',
  check: '<polyline points="5 13 10 18 19 7"/>',
  warning: '<path d="M12 3 22 20 2 20 Z"/><line x1="12" y1="9.5" x2="12" y2="14.5"/><line x1="12" y1="17" x2="12" y2="17.01"/>',
  print: '<rect x="6" y="3" width="12" height="5"/><rect x="4" y="8" width="16" height="8"/><rect x="7" y="13" width="10" height="8"/>',
  link: '<path d="M9 15a4 4 0 0 0 6 0l3-3a4 4 0 0 0-6-6l-1.5 1.5"/><path d="M15 9a4 4 0 0 0-6 0l-3 3a4 4 0 0 0 6 6l1.5-1.5"/>',
  home: '<path d="M4 11 12 4 20 11"/><path d="M6 10 V20 H18 V10"/>',
  pencil: '<path d="M4 20 5 16 16.5 4.5 19.5 7.5 8 19 Z"/><line x1="14.5" y1="6.5" x2="17.5" y2="9.5"/>',
  duplicate: '<rect x="8" y="8" width="12" height="12"/><path d="M16 4 H4 V16"/>',
  trash: '<path d="M5 7 H19"/><path d="M9 7 V5 H15 V7"/><path d="M7 7 8 20 H16 L17 7"/>',
  save: '<path d="M5 4 H16 L20 8 V20 H5 Z"/><rect x="8" y="13" width="8" height="7"/><rect x="8" y="4" width="7" height="4"/>',
  chevronDown: '<polyline points="6 9 12 15 18 9"/>',
  chevronRight: '<polyline points="9 6 15 12 9 18"/>',
  more: '<circle cx="5" cy="12" r="1.6" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.6" fill="currentColor" stroke="none"/>',
  info: '<circle cx="12" cy="12" r="9"/><line x1="12" y1="11" x2="12" y2="16.5"/><line x1="12" y1="7.5" x2="12" y2="7.51"/>',
  book: '<path d="M4 5 A2 2 0 0 1 6 3 H20 V19 H6 A2 2 0 0 0 4 21 Z"/><line x1="4" y1="19" x2="4" y2="5"/><line x1="20" y1="19" x2="6" y2="19"/>',
  flag: '<line x1="5" y1="3" x2="5" y2="21"/><path d="M5 4 H19 L16 8.5 19 13 H5"/>',
  wrench: '<path d="M14.5 6.5a4.5 4.5 0 0 0-6 6L3 18l3 3 5.5-5.5a4.5 4.5 0 0 0 6-6L14 13l-3-3Z"/>',
  scroll: '<path d="M7 3 H19 V17 A2 2 0 0 1 17 19 H7"/><path d="M7 3 A2 2 0 0 0 5 5 V19 A2 2 0 0 0 7 21 H17"/><line x1="9.5" y1="8" x2="16" y2="8"/><line x1="9.5" y1="12" x2="16" y2="12"/>',
  upload: '<path d="M12 15 V4"/><polyline points="7 8.5 12 3.5 17 8.5"/><path d="M4 15 V20 H20 V15"/>',
  download: '<path d="M12 4 V15"/><polyline points="7 10.5 12 15.5 17 10.5"/><path d="M4 15 V20 H20 V15"/>',
  personnel: '<circle cx="12" cy="8" r="4"/><path d="M4 21 C4 16.5 7.5 14 12 14 C16.5 14 20 16.5 20 21"/>',
  filter: '<path d="M3 5 H21 L14 13 V20 L10 18 V13 Z"/>',
  shuffle: '<path d="M3 6 H7 L17 18 H21"/><polyline points="18 3 21 6 18 9"/><path d="M3 18 H7 L10.5 14"/><path d="M13.5 10 L17 6 H21"/><polyline points="18 15 21 18 18 21"/>',
  grid: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>',
  compare: '<line x1="6" y1="4" x2="6" y2="20"/><line x1="18" y1="4" x2="18" y2="20"/><rect x="3" y="9" width="6" height="7"/><rect x="15" y="7" width="6" height="9"/>',
  image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.8" fill="currentColor" stroke="none"/><path d="M4 18 9 12 13 16 16 13 20 18" fill="none"/>',
  die: '<rect x="4" y="4" width="16" height="16" rx="3.5"/><circle cx="9" cy="9" r="1.5" fill="currentColor" stroke="none"/><circle cx="15" cy="9" r="1.5" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="9" cy="15" r="1.5" fill="currentColor" stroke="none"/><circle cx="15" cy="15" r="1.5" fill="currentColor" stroke="none"/>',
  // ship-stat glyphs, drawn on the 24 grid to sit inline with numbers
  "stat-mass": '<path fill="currentColor" stroke="none" d="M12 2 21 7 21 17 12 22 3 17 3 7 Z"/>',
  "stat-thrust": '<path d="M3 7 10 12 3 17 Z" fill="currentColor" stroke="none"/><path d="M12 7 19 12 12 17 Z" fill="currentColor" stroke="none"/>',
  "stat-silhouette": '<circle cx="12" cy="12" r="7"/><line x1="12" y1="1.5" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22.5"/><line x1="1.5" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22.5" y2="12"/>',
  "stat-shields": '<path d="M12 3 20 6 V11 C20 16 16.5 19.5 12 21 C7.5 19.5 4 16 4 11 V6 Z"/>',
  // ship silhouettes by Mass class: filled geometric hulls, not stroked
  mass0: '<path fill="currentColor" stroke="none" d="M12 4 20 20 12 16 4 20 Z"/>',
  mass1: '<path fill="currentColor" stroke="none" d="M12 3 15 9 15 17 18 21 6 21 9 17 9 9 Z"/>',
  mass2: '<path fill="currentColor" stroke="none" d="M12 2 16 7 16 14 20 18 20 21 4 21 4 18 8 14 8 7 Z"/>',
  mass3: '<path fill="currentColor" stroke="none" d="M12 2 15 5 15 9 20 13 20 22 14 22 14 18 10 18 10 22 4 22 4 13 9 9 9 5 Z"/>',
  // Firing-arc glyphs: a filled wedge fanning out from a ship's nose, same
  // radius for both so only the angle (not a fictional "reach") differs -
  // primary is the narrow 45 degree cone dead ahead, auxiliary the full 180.
  "arc-primary": '<path fill="currentColor" stroke="none" d="M12 21 8.17 11.76A10 10 0 0 1 15.83 11.76Z"/>',
  "arc-aux": '<path fill="currentColor" stroke="none" d="M12 21 2 21A10 10 0 0 1 22 21Z"/>',
};

// Fleet emblems: crisp geometric insignia on the 24 grid. Filled where a bold
// silhouette reads best; stroked where the mark needs interior structure.
export const EMBLEMS: Record<string, string> = {
  delta: '<path fill="currentColor" stroke="none" d="M12 3 21 21 H3 Z"/>',
  spear: '<path fill="currentColor" stroke="none" d="M12 2 16.6 11 12 9 7.4 11 Z"/><path fill="currentColor" stroke="none" d="M11 9 H13 V22 H11 Z"/>',
  star: '<path fill="currentColor" stroke="none" d="M12 1 14 10 23 12 14 14 12 23 10 14 1 12 10 10 Z"/>',
  wings: '<path fill="currentColor" stroke="none" d="M12 6 21 3 21 7 12 11 3 7 3 3 Z"/><path fill="currentColor" stroke="none" d="M12 11 18 9 12 15.5 6 9 Z"/>',
  atom: '<circle cx="12" cy="12" r="2.4" fill="currentColor" stroke="none"/><g fill="none" stroke="currentColor" stroke-width="1.5"><ellipse cx="12" cy="12" rx="10" ry="3.8"/><ellipse cx="12" cy="12" rx="10" ry="3.8" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="3.8" transform="rotate(120 12 12)"/></g>',
  planet: '<circle cx="12" cy="12" r="6" fill="currentColor" stroke="none"/><ellipse cx="12" cy="12" rx="11" ry="4.2" fill="none" stroke="currentColor" stroke-width="1.9" transform="rotate(-20 12 12)"/>',
  hexcore: '<path fill="none" stroke="currentColor" stroke-width="2" d="M12 2.5 20.5 7.2 V16.8 L12 21.5 3.5 16.8 V7.2 Z"/><circle cx="12" cy="12" r="3.2" fill="currentColor" stroke="none"/>',
  sunburst: '<circle cx="12" cy="12" r="3.8" fill="currentColor" stroke="none"/><g stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="1.5" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="22.5"/><line x1="1.5" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="22.5" y2="12"/><line x1="4.6" y1="4.6" x2="7" y2="7"/><line x1="17" y1="17" x2="19.4" y2="19.4"/><line x1="19.4" y1="4.6" x2="17" y2="7"/><line x1="7" y1="17" x2="4.6" y2="19.4"/></g>',
  bolt: '<path fill="currentColor" stroke="none" d="M13.5 2 4 13.5 H10 L9 22 20 10 H13.5 Z"/>',
  crosshair: '<circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="2.4" fill="currentColor" stroke="none"/><g stroke="currentColor" stroke-width="2"><line x1="12" y1="1.5" x2="12" y2="5.5"/><line x1="12" y1="18.5" x2="12" y2="22.5"/><line x1="1.5" y1="12" x2="5.5" y2="12"/><line x1="18.5" y1="12" x2="22.5" y2="12"/></g>',
};

export function icon(name: string, size = 18, cls = ""): string {
  const body = PATHS[name];
  if (!body) return "";
  return `<svg class="icon ${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="square" stroke-linejoin="miter" aria-hidden="true">${body}</svg>`;
}

export function emblem(name: string, size = 28, cls = ""): string {
  const body = EMBLEMS[name] ?? EMBLEMS["delta"];
  return `<svg class="emblem ${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true">${body}</svg>`;
}

export function massGlyph(mass: number, size = 20): string {
  return icon(`mass${Math.max(0, Math.min(3, mass))}`, size, "mass-glyph");
}

/**
 * A row of die glyphs matching an Initiative pool: "2D6" -> two dice, "3D6" ->
 * three. A bare "D12" reads as one. Purely decorative; the text stays too.
 * Capped at 6 dice so an odd value can never blow out the layout.
 */
export function initiativeDice(initiative: string, size = 16): string {
  const m = /^\s*(\d*)\s*[dD]\s*\d+/.exec(initiative);
  if (!m) return "";
  const n = Math.min(6, Math.max(1, m[1] ? parseInt(m[1], 10) : 1));
  return `<span class="init-dice" aria-hidden="true">${icon("die", size, "init-die").repeat(n)}</span>`;
}

/** How many dice an Initiative pool rolls: "2D6" -> 2, bare "D12" -> 1. */
function initiativeCount(initiative: string): number {
  const m = /^\s*(\d*)\s*[dD]\s*\d+/.exec(initiative);
  if (!m) return 0;
  return Math.min(6, Math.max(1, m[1] ? parseInt(m[1], 10) : 1));
}

// Ri dice-line: a single filled isometric die outline. Filled path, so it is
// rendered directly rather than through the stroke-based icon() helper.
const DICE_LINE =
  '<path fill="currentColor" d="M10.998 1.58a2 2 0 0 1 2.004 0l7.5 4.342a2 2 0 0 1 .998 1.731v8.694a2 2 0 0 1-.998 1.73l-7.5 4.343a2 2 0 0 1-2.004 0l-7.5-4.342a2 2 0 0 1-.998-1.731V7.653a2 2 0 0 1 .998-1.73zM4.5 7.653v.005l6.502 3.764A2 2 0 0 1 12 13.153v7.536l7.5-4.342V7.653L12 3.311zM6.132 12.3c0-.552-.388-1.224-.866-1.5s-.866-.052-.866.5s.388 1.224.866 1.5s.866.052.866-.5m2.597 6.498c.478.276.866.053.866-.5c0-.552-.388-1.224-.866-1.5s-.866-.052-.866.5s.388 1.224.866 1.5M5.266 16.8c.478.276.866.052.866-.5s-.388-1.224-.866-1.5s-.866-.052-.866.5s.388 1.224.866 1.5m3.463-2c.478.277.866.053.865-.5c0-.552-.387-1.223-.866-1.5c-.478-.276-.866-.052-.866.5c0 .553.388 1.224.867 1.5M14.898 8c.478-.276.478-.724 0-1s-1.254-.276-1.732 0c-.479.276-.479.724 0 1c.478.276 1.254.276 1.732 0m-4.8-1c.478.276.478.724 0 1s-1.254.276-1.732 0s-.478-.724 0-1s1.254-.276 1.732 0m5.897 8.35c.598-.346 1.083-1.185 1.083-1.875s-.485-.97-1.082-.625s-1.083 1.184-1.083 1.875c0 .69.485.97 1.082.625"/>';

/** A row of ri:dice-line glyphs sized to the Initiative pool (one per die). */
export function diceRow(initiative: string, size = 20): string {
  const n = initiativeCount(initiative);
  if (n === 0) return "";
  const one = `<svg class="dice-ico" width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true">${DICE_LINE}</svg>`;
  return `<span class="dice-row" aria-hidden="true">${one.repeat(n)}</span>`;
}

/**
 * The command-token glyph: a delta that draws itself in, then swells to a full
 * triangle. One-shot SMIL, so it plays when the mark first renders.
 */
export function commandToken(size = 20, cls = ""): string {
  return `<svg class="cmd-token ${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path stroke-dasharray="28" d="M12 10l4 7h-8Z"><animate fill="freeze" attributeName="stroke-dashoffset" dur="0.4s" values="28;0"/></path><path d="M12 4l9.25 16h-18.5Z" opacity="0"><set fill="freeze" attributeName="opacity" begin="0.4s" to="1"/><animate fill="freeze" attributeName="d" begin="0.4s" dur="0.2s" values="M12 10l4 7h-8Z;M12 4l9.25 16h-18.5Z"/></path></g></svg>`;
}

/**
 * Four labelled stat chips for a ship. Each shows an icon, a word, and the
 * value together, so the meaning is legible and memorable rather than a bare
 * number that has to be decoded.
 */
export function statChips(
  s: { mass: number; thrust: number; silhouette: number; shields: number },
  compact = false,
): string {
  const chip = (name: string, label: string, val: string) =>
    compact
      ? `<span class="stat-chip stat-chip-mini" title="${label}">${icon(name, 13, "stat-ico")}<span class="stat-val">${val}</span></span>`
      : `<span class="stat-chip" title="${label}">${icon(name, 14, "stat-ico")}<span class="stat-lbl">${label}</span><span class="stat-val">${val}</span></span>`;
  return `<span class="stat-chips ${compact ? "stat-chips-mini" : ""}">${chip("stat-mass", "Mass", String(s.mass))}${chip("stat-thrust", "Thrust", `${s.thrust}"`)}${chip("stat-silhouette", "Sil", String(s.silhouette))}${chip("stat-shields", "Shields", String(s.shields))}</span>`;
}

/** Render an uploaded image if present, otherwise fall back to a built-in emblem glyph. */
export function emblemMark(emblemId: string, image: string | undefined, size = 28, cls = ""): string {
  if (image) {
    return `<img class="emblem emblem-img ${cls}" width="${size}" height="${size}" src="${image}" alt="" />`;
  }
  return emblem(emblemId, size, cls);
}

export const EMBLEM_IDS = Object.keys(EMBLEMS);

/**
 * Original schematic illustrations for the two most spatially-confusing
 * tutorial concepts: how a table is laid out at setup, and what the two
 * weapon arcs actually cover. These are fresh diagrams drawn for this app in
 * its own stroke-based house style - not reproductions of any published
 * artwork - illustrating the same (uncopyrightable) rules concepts the
 * guide text already describes in words.
 */
export function tacticalDiagram(kind: "deployment" | "arcs"): string {
  if (kind === "deployment") {
    // Schematic, not a scale drawing - the numbers are the real rule values,
    // annotated onto an illustrative layout so you know which distance is
    // which before you measure it out for real at the table.
    // Per the rulebook's own setup diagram (p.62): flank points sit at the
    // table's side edges (X = 24", i.e. half the 48"-wide table) and are only
    // Z = 5" onto the table from your own edge; the central point is further
    // in, at Y = 15" from your own edge, on the centreline. (A prior version
    // of this diagram had Z and Y swapped - fixed here against the book art.)
    return `
    <svg class="tut-diagram" viewBox="0 0 320 232" role="img" aria-label="Table setup: a Central Objective in the middle, three Jump Points along each player's own edge - flank points 5 inches in from your own edge at the table's side edges, the central point 15 inches in from your own edge on the centreline">
      <rect x="4" y="16" width="312" height="212" fill="none" stroke="currentColor" stroke-width="2"/>
      <text x="160" y="12" text-anchor="middle" font-size="10" font-weight="700" fill="currentColor" opacity="0.65">OPPONENT'S EDGE</text>
      <circle cx="30" cy="45" r="7" fill="none" stroke="currentColor" stroke-width="2"/>
      <circle cx="160" cy="104" r="7" fill="none" stroke="currentColor" stroke-width="2"/>
      <circle cx="290" cy="45" r="7" fill="none" stroke="currentColor" stroke-width="2"/>
      <circle cx="160" cy="122" r="11" fill="var(--red, #fc3d21)"/>
      <text x="160" y="152" text-anchor="middle" font-size="10" font-weight="700" fill="currentColor">CENTRAL OBJECTIVE</text>
      <circle cx="30" cy="199" r="7" fill="var(--blue, #0b3d91)" stroke="currentColor" stroke-width="2"/>
      <circle cx="160" cy="140" r="7" fill="var(--blue, #0b3d91)" stroke="currentColor" stroke-width="2"/>
      <circle cx="290" cy="199" r="7" fill="var(--blue, #0b3d91)" stroke="currentColor" stroke-width="2"/>
      <text x="160" y="228" text-anchor="middle" font-size="10" font-weight="700" fill="currentColor" opacity="0.65">YOUR EDGE</text>
      <!-- dimension: 5" from your edge, to the left flank point -->
      <g opacity="0.6" stroke="currentColor">
        <line x1="4" y1="211" x2="26" y2="211" stroke-width="1"/>
        <line x1="4" y1="206" x2="4" y2="216" stroke-width="1"/>
        <line x1="26" y1="206" x2="26" y2="216" stroke-width="1"/>
      </g>
      <text x="15" y="206" text-anchor="middle" font-size="9" font-weight="700" fill="currentColor" opacity="0.75">5"</text>
      <!-- dimension: 15" from your edge, up to the central point -->
      <g opacity="0.6" stroke="currentColor">
        <line x1="300" y1="228" x2="300" y2="140" stroke-width="1"/>
        <line x1="295" y1="228" x2="305" y2="228" stroke-width="1"/>
        <line x1="295" y1="140" x2="305" y2="140" stroke-width="1"/>
      </g>
      <text x="311" y="187" text-anchor="middle" font-size="9" font-weight="700" fill="currentColor" opacity="0.75" transform="rotate(-90 311 187)">15"</text>
    </svg>`;
  }
  return `
  <svg class="tut-diagram" viewBox="0 0 200 190" role="img" aria-label="Auxiliary arc of fire is 180 degrees to the front; Primary arc of fire is a narrower 45 degree cone within it">
    <path d="M 100 150 L 30 150 A 70 70 0 0 1 170 150 Z" fill="var(--blue, #0b3d91)" opacity="0.16"/>
    <path d="M 100 150 L 73 85 A 70 70 0 0 1 127 85 Z" fill="var(--red, #fc3d21)" opacity="0.4"/>
    <path d="M100 128 L114 156 L100 148 L86 156 Z" fill="currentColor"/>
    <text x="100" y="176" text-anchor="middle" font-size="11" font-weight="700" fill="currentColor">AUXILIARY · 180°</text>
    <text x="100" y="55" text-anchor="middle" font-size="11" font-weight="700" fill="var(--red, #fc3d21)">PRIMARY · 45°</text>
  </svg>`;
}
