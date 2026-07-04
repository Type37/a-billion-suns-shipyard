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
  link: '<path d="M10 14 L14 10"/><path d="M8.5 15.5 6.8 17.2a3.4 3.4 0 0 1-4.8-4.8l3.4-3.4a3.4 3.4 0 0 1 4.8 0"/><path d="M15.5 8.5 17.2 6.8a3.4 3.4 0 0 0-4.8-4.8l-3.4 3.4" transform="translate(4.5 4.5)"/>',
  home: '<path d="M4 11 12 4 20 11"/><path d="M6 10 V20 H18 V10"/>',
  pencil: '<path d="M4 20 5 16 16.5 4.5 19.5 7.5 8 19 Z"/><line x1="14.5" y1="6.5" x2="17.5" y2="9.5"/>',
  duplicate: '<rect x="8" y="8" width="12" height="12"/><path d="M16 4 H4 V16"/>',
  trash: '<path d="M5 7 H19"/><path d="M9 7 V5 H15 V7"/><path d="M7 7 8 20 H16 L17 7"/>',
  save: '<path d="M5 4 H16 L20 8 V20 H5 Z"/><rect x="8" y="13" width="8" height="7"/><rect x="8" y="4" width="7" height="4"/>',
  chevronDown: '<polyline points="6 9 12 15 18 9"/>',
  chevronRight: '<polyline points="9 6 15 12 9 18"/>',
  book: '<path d="M4 5 A2 2 0 0 1 6 3 H20 V19 H6 A2 2 0 0 0 4 21 Z"/><line x1="4" y1="19" x2="4" y2="5"/><line x1="20" y1="19" x2="6" y2="19"/>',
  flag: '<line x1="5" y1="3" x2="5" y2="21"/><path d="M5 4 H19 L16 8.5 19 13 H5"/>',
  wrench: '<path d="M14.5 6.5a4.5 4.5 0 0 0-6 6L3 18l3 3 5.5-5.5a4.5 4.5 0 0 0 6-6L14 13l-3-3Z"/>',
  scroll: '<path d="M7 3 H19 V17 A2 2 0 0 1 17 19 H7"/><path d="M7 3 A2 2 0 0 0 5 5 V19 A2 2 0 0 0 7 21 H17"/><line x1="9.5" y1="8" x2="16" y2="8"/><line x1="9.5" y1="12" x2="16" y2="12"/>',
  upload: '<path d="M12 15 V4"/><polyline points="7 8.5 12 3.5 17 8.5"/><path d="M4 15 V20 H20 V15"/>',
  download: '<path d="M12 4 V15"/><polyline points="7 10.5 12 15.5 17 10.5"/><path d="M4 15 V20 H20 V15"/>',
  personnel: '<circle cx="12" cy="8" r="4"/><path d="M4 21 C4 16.5 7.5 14 12 14 C16.5 14 20 16.5 20 21"/>',
  filter: '<path d="M3 5 H21 L14 13 V20 L10 18 V13 Z"/>',
  compare: '<line x1="6" y1="4" x2="6" y2="20"/><line x1="18" y1="4" x2="18" y2="20"/><rect x="3" y="9" width="6" height="7"/><rect x="15" y="7" width="6" height="9"/>',
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
};

// Fleet emblems: bolder filled marks for identity, also on the 24 grid.
export const EMBLEMS: Record<string, string> = {
  delta: '<path fill="currentColor" stroke="none" d="M12 3 21 21 H3 Z"/>',
  orbit: '<circle cx="12" cy="12" r="6" fill="currentColor" stroke="none"/><ellipse cx="12" cy="12" rx="10.5" ry="4" fill="none" stroke="currentColor" stroke-width="1.8" transform="rotate(-20 12 12)"/>',
  ring: '<circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="4"/>',
  quad: '<rect x="4" y="4" width="7" height="7" fill="currentColor" stroke="none"/><rect x="13" y="4" width="7" height="7" fill="currentColor" stroke="none"/><rect x="4" y="13" width="7" height="7" fill="currentColor" stroke="none"/><rect x="13" y="13" width="7" height="7" fill="currentColor" stroke="none"/>',
  chevrons: '<path fill="currentColor" stroke="none" d="M4 6 12 11 20 6 20 10 12 15 4 10 Z"/><path fill="currentColor" stroke="none" d="M4 12 12 17 20 12 20 16 12 21 4 16 Z"/>',
  star: '<path fill="currentColor" stroke="none" d="M12 2 14.6 8.8 22 9.2 16.3 13.9 18.2 21 12 17 5.8 21 7.7 13.9 2 9.2 9.4 8.8 Z"/>',
  eclipse: '<circle cx="12" cy="12" r="9" fill="currentColor" stroke="none"/><circle cx="15.5" cy="8.5" r="6" fill="#fff" stroke="none"/>',
  lattice: '<path fill="none" stroke="currentColor" stroke-width="2.4" d="M12 2 21 7 21 17 12 22 3 17 3 7 Z"/><path fill="none" stroke="currentColor" stroke-width="2.4" d="M12 2 V22 M3 7 21 17 M21 7 3 17"/>',
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

/** Four labelled stat chips (Mass, Thrust, Silhouette, Shields) for a ship. */
export function statChips(s: { mass: number; thrust: number; silhouette: number; shields: number }): string {
  const chip = (name: string, val: string, label: string) =>
    `<span class="stat-chip" title="${label}">${icon(name, 14, "stat-ico")}<span class="stat-val">${val}</span></span>`;
  return `<span class="stat-chips">${chip("stat-mass", String(s.mass), "Mass")}${chip("stat-thrust", `${s.thrust}"`, "Thrust")}${chip("stat-silhouette", String(s.silhouette), "Silhouette")}${chip("stat-shields", String(s.shields), "Shields")}</span>`;
}

/** Render an uploaded image if present, otherwise fall back to a built-in emblem glyph. */
export function emblemMark(emblemId: string, image: string | undefined, size = 28, cls = ""): string {
  if (image) {
    return `<img class="emblem emblem-img ${cls}" width="${size}" height="${size}" src="${image}" alt="" />`;
  }
  return emblem(emblemId, size, cls);
}

export const EMBLEM_IDS = Object.keys(EMBLEMS);
