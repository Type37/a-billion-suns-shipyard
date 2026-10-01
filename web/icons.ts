import creditsRaw from "./Credits.svg?raw";
import { CARBON_ICONS, carbonSvg } from "./carbon-icons.ts";

// icon(name, size): interface icons come from Carbon (carbon-icons.ts); the
// few game marks Carbon cannot supply live in PATHS below. No icon fonts.

/**
 * The Mass mark: ⓜ, U+24DC, CIRCLED LATIN SMALL LETTER M - the circled
 * LOWERCASE m, which is what the rulebook prints (see the Tough rule, PDF page
 * 142). Not the capital Ⓜ (U+24C2), and not a hexagon.
 *
 * NOT drawn by hand. This is the actual glyph outline, converted straight out of
 * the font the book renders it in. The layout sets that run in Akzidenz Grotesk
 * Pro, but Akzidenz has no U+24DC, so InDesign fell back to MS Gothic for this
 * one character - the circled m you see printed IS MS Gothic's. Extracted from
 * C:/Windows/Fonts/msgothic.ttc with fontTools, glyph uni24DC, and mapped from
 * its 256-unit em box (6,-31)-(252,215) into this 24x24 viewBox.
 *
 * THE definition: used both as the `stat-mass` icon and, by `ruleText()` in
 * format.ts, inline inside rules prose. Those were two separate hand drawings
 * for a while and did not match each other on the page. Filled, so it carries
 * its own fill and overrides icon()'s stroke wrapper.
 */
// The outline is untouched; the hairline stroke on top is optical compensation,
// not a redraw. MS Gothic's ring is 0.93 units thick in this 24-unit box - about
// 1/25 of the diameter - so at the 13px the compact stat chips use it lands on
// 0.5 of a device pixel and greys out to a smudge. Stroking the same path in the
// same colour brings the ring back over 1px without changing its shape.
export const MASS_MARK =
  '<path fill="currentColor" stroke="currentColor" stroke-width="0.45" d="M20.13 3.87Q23.5 7.23 23.5 12Q23.5 16.77 20.13 20.13Q16.77 23.5 12 23.5Q7.23 23.5 3.87 20.13Q0.5 16.77 0.5 12Q0.5 7.23 3.87 3.87Q7.23 0.5 12 0.5Q16.77 0.5 20.13 3.87ZM4.52 4.52Q1.43 7.61 1.43 12Q1.43 16.39 4.52 19.48Q7.61 22.57 12 22.57Q16.39 22.57 19.48 19.48Q22.57 16.39 22.57 12Q22.57 7.61 19.48 4.52Q16.39 1.43 12 1.43Q7.61 1.43 4.52 4.52ZM5.83 11.07V17.42H3.96V6.76H5.83V8.07Q7.23 6.39 9.01 6.39Q10.78 6.39 11.72 7.33Q12.37 7.98 12.56 8.54Q14.24 6.39 16.58 6.39Q18.17 6.39 19.2 7.42Q20.04 8.26 20.04 10.13V17.42H18.17V10.5Q18.17 9.29 17.52 8.63Q16.96 8.07 16.02 8.07Q14.9 8.07 14.06 8.91Q12.84 10.13 12.84 11.35V17.42H10.97V10.04Q10.97 9.1 10.41 8.54Q9.94 8.07 8.91 8.07Q7.61 8.07 6.67 9.01Q5.83 9.85 5.83 11.07Z"/>';

const PATHS: Record<string, string> = {
  // What Carbon has no icon for: the rulebook's Mass mark (see MASS_MARK) and
  // the firing arcs, which Jet kept. Everything else is in carbon-icons.ts.
  "stat-mass": MASS_MARK,
  // Firing-arc glyphs: two solid filled sectors on the same baseline, told apart
  // purely by how wide they open. PRIMARY is a narrow ~45 degree cone straight
  // ahead; AUXILIARY is a full 180 degree half-disc. Filled (not outlined) so
  // they still read as distinct shapes at 13px.
  "arc-primary":
    '<path fill="currentColor" stroke="none" opacity="0.22" d="M1 20 A11 11 0 0 1 23 20 Z"/><path fill="currentColor" stroke="none" d="M12 20 L7.79 9.84 A11 11 0 0 1 16.21 9.84 Z"/>',
  "arc-aux":
    '<path fill="currentColor" stroke="none" d="M1 20 A11 11 0 0 1 23 20 Z"/>',
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

// The Mass mark is lifted from a font's 256-unit em box and framed to its own
// art (plus 4% air) so it reads the same size as the Carbon glyphs beside it.
const ICON_VIEWBOX: Record<string, string> = {
  "stat-mass": "0.04 0.04 23.92 23.92",
};

/**
 * Stroke width, in viewBox units, that keeps a drawn line the same THICKNESS ON
 * SCREEN whatever size the icon is asked for.
 *
 * stroke-width is measured in viewBox units, so a flat 1.8 on a 24-unit grid is
 * 1.8 device px at 24px and 0.98 at 13px - the small icons were drawn at little
 * over half the weight of the big ones and went spindly and grey, which is most
 * of why the symbols were hard to see. 18px is the reference size, so anything
 * at or above it is untouched and only the small ones are thickened, to a
 * ceiling that stops a 12px glyph filling in solid.
 */
function strokeFor(size: number, vb: string): number {
  const units = Number(vb.split(/\s+/)[2]) || 24;
  const scale = units / 24; // non-24 grids (the 512 ix icons) scale with it
  return Math.min(2.6 * scale, 1.8 * scale * Math.max(1, 18 / size));
}

export function icon(name: string, size = 18, cls = ""): string {
  // Carbon first (see carbon-icons.ts); PATHS keeps only what Carbon has no
  // equivalent for.
  const carbon = CARBON_ICONS[name];
  if (carbon) return carbonSvg(carbon, size, cls);
  const body = PATHS[name];
  if (!body) return "";
  const vb = ICON_VIEWBOX[name] ?? "0 0 24 24";
  const sw = strokeFor(size, vb).toFixed(2);
  // `size` is the icon's HEIGHT. Every glyph in the set but one is square, so
  // for those the width is the same number; a wide viewBox gets a wide box, or
  // the browser would letterbox it and draw it smaller than everything beside
  // it at the same nominal size.
  const [, , vbW = "24", vbH = "24"] = vb.split(/\s+/);
  const w = (size * (Number(vbW) / Number(vbH))).toFixed(2).replace(/\.?0+$/, "");
  return `<svg class="icon ${cls}" width="${w}" height="${size}" viewBox="${vb}" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="square" stroke-linejoin="miter" aria-hidden="true">${body}</svg>`;
}

export function emblem(name: string, size = 28, cls = ""): string {
  const body = EMBLEMS[name] ?? EMBLEMS["delta"];
  return `<svg class="emblem ${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true">${body}</svg>`;
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
 * The command-token glyph: a small delta draws itself in, then swells to a full
 * triangle. One-shot SMIL, so it plays when the mark first renders. `delay`
 * staggers the start so a row of them cascades left to right.
 */
export function commandToken(size = 20, cls = "", delay = 0): string {
  const d = delay.toFixed(2);
  const swell = (delay + 0.4).toFixed(2);
  return `<svg class="cmd-token ${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path stroke-dasharray="28" stroke-dashoffset="28" d="M12 10l4 7h-8Z"><animate fill="freeze" attributeName="stroke-dashoffset" begin="${d}s" dur="0.4s" values="28;0"/></path><path d="M12 10l4 7h-8Z" opacity="0"><set fill="freeze" attributeName="opacity" begin="${swell}s" to="1"/><animate fill="freeze" attributeName="d" begin="${swell}s" dur="0.2s" values="M12 10l4 7h-8Z;M12 4l9.25 16h-18.5Z"/></path></g></svg>`;
}

/**
 * A row of command-token deltas sized to the faction's CMD-per-round value: a
 * numeric value shows that many triangles (capped), a die value (e.g. D12)
 * shows a single token. Each draws itself in and swells, staggered, so the row
 * resolves like a hazard mark forming. Mirrors diceRow for Initiative.
 */
export function commandRow(cmdTokens: string, size = 20): string {
  const m = /^\s*(\d+)/.exec(cmdTokens);
  const n = m ? Math.min(9, Math.max(1, parseInt(m[1] ?? "1", 10))) : 1;
  let out = "";
  for (let i = 0; i < n; i++) out += commandToken(size, "", i * 0.12);
  return `<span class="dice-row cmd-row" aria-hidden="true">${out}</span>`;
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
  // Every chip carries its word as well as its glyph, at every size: a bare
  // icon + number is a puzzle. Compact only shrinks the type, it never drops
  // the label (the labels use a condensed face so they stay cheap in width).
  //
  // Mass is ALWAYS here. It was briefly dropped from rows that drew a hull
  // silhouette beside them, on the reasoning that the shape made the chip
  // redundant - but a silhouette is not a numeral, so that removed the only
  // readable Mass value in the app. Those silhouettes are gone entirely now;
  // this chip is the whole story.
  // Each glyph carries its own stat's colour class, so the four are told apart
  // by shape AND hue before the label is read.
  // Mass is drawn 3px larger than its neighbours. It is a ring with a letter
  // inside where the others are solid marks, and a ring needs more box to read:
  // at the same 13px the hairline circle greyed out to a smudge. Same optical
  // weight, different measured size.
    // All four at one size. Mass and Silhouette used to be drawn larger on the
    // reasoning that a ring reads smaller than a solid mark, but in a row of
    // four the mismatch just looks like a mistake.
    //
    // 16/14 -> 18/16. These four are the most-read glyphs in the app and they
    // are SOLID marks, so the stroke-width fix above does nothing for them -
    // size is the only lever. The Silhouette target in particular carries
    // interior detail that closed up into a blob at 14px.

  return `<span class="stat-chips ${compact ? "stat-chips-mini" : ""}">${statChipList(s, compact).join("")}</span>`;
}

/** The four chips on their own, in reading order: Mass, Thrust, Sil, Shields. */
export function statChipList(
  s: { mass: number; thrust: number; silhouette: number; shields: number },
  compact = false,
): string[] {
  const size = compact ? 16 : 18;
  const chip = (name: string, label: string, val: string) =>
    `<span class="stat-chip ${compact ? "stat-chip-mini" : ""}">${icon(name, size, `stat-ico stat-ico-${name.replace("stat-", "")}`)}<span class="stat-lbl">${label}</span><span class="stat-val">${val}</span></span>`;
  return [
    chip("stat-mass", "Mass", String(s.mass)),
    chip("stat-thrust", "Thrust", `${s.thrust}"`),
    chip("stat-silhouette", "Sil", String(s.silhouette)),
    chip("stat-shields", "Shields", String(s.shields)),
  ];
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
    <text x="100" y="176" text-anchor="middle" font-size="11" font-weight="700" fill="currentColor">AUXILIARY 180°</text>
    <text x="100" y="55" text-anchor="middle" font-size="11" font-weight="700" fill="var(--red, #fc3d21)">PRIMARY 45°</text>
  </svg>`;
}

// The "billions credits" mark, used wherever a fleet's cost is shown in the
// main (fleet-building) modes. Solo money is ¢k and keeps the plain cent sign.
//
// The artwork ships as a drawing: a hard-coded white fill and its own canvas.
// Strip both so it behaves like every other icon in this file - inherits
// currentColor, sized by the caller - rather than being a white-on-white
// rectangle everywhere the theme is light.
const CREDITS_INNER = creditsRaw
  .replace(/^[\s\S]*?<svg[^>]*>/i, "")
  .replace(/<\/svg>[\s\S]*$/i, "")
  .replace(/\sstyle="[^"]*"/gi, "")
  .replace(/\sfill="(?!none)[^"]*"/gi, "")
  .trim();

const CREDITS_VB = { w: 44.81, h: 41.45 };

/** The credits mark, sized by height so it sits on the type baseline. */
/**
 * The credits mark. The glyph itself means "billions of credits" - the "bn"
 * suffix was dropped from every figure because the mark already carries it -
 * which is only obvious once somebody tells you. A <title> does that: hovering
 * any figure on a desktop says it, so the mark stops being an unexplained
 * squiggle.
 *
 * It stays aria-hidden. Exposing the title to assistive tech would read
 * "billions of credits" before every single number, and this glyph appears
 * beside a hundred-odd figures on the Compendium alone - the tooltip is the
 * one-off explanation, not something to repeat on every row.
 */
export function creditsGlyph(size = 12): string {
  const w = (size * CREDITS_VB.w) / CREDITS_VB.h;
  return `<svg class="credits-glyph" width="${w.toFixed(2)}" height="${size}" viewBox="0 0 ${CREDITS_VB.w} ${CREDITS_VB.h}" fill="currentColor" aria-hidden="true" focusable="false"><title>billions of credits</title>${CREDITS_INNER}</svg>`;
}
