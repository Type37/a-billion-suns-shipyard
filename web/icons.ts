import creditsRaw from "./Credits.svg?raw";

// Geometric inline SVG icons. All stroke-based, inherit currentColor, drawn on
// a 24-unit grid so they align with the type baseline. No icon fonts.

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
  // wordmark companion: a planet disc with a single orbit line
  logo: '<circle cx="12" cy="12" r="5.5"/><ellipse cx="12" cy="12" rx="10" ry="3.4" transform="rotate(-18 12 12)"/>',
  // Nav marks: Material-style solid glyphs. A standings podium for Solo, a
  // shelved-volumes mark for the Compendium, a document list for Fleets, and a
  // sliders mark for Options. All 24-grid, filled, stroke-none.
  solo:
    '<path fill="currentColor" stroke="none" d="M7 2h10v2H7zm0 8h10v2H7zm8-6h2v6h-2zM7 4h2v6H7zM4 14h2v8H4zm14 0h2v8h-2zM6 14h12v2H6z"/>',
  compendium:
    '<g fill="currentColor" stroke="none"><path d="M0 3h13v2H0zm0 16h11v2H0z"/><path d="M11 3h13v2H11zm2 16h11v2H13zM11 5h2v18h-2zM0 5h2v14H0zm22 0h2v14h-2zm-7 2h5v2h-5zm0 4h5v2h-5zm0 4h2v2h-2z"/></g>',
  fleets:
    '<path fill="currentColor" stroke="none" d="M10 5h12v2H10zm0 4h8v2h-8zm0 4h12v2H10zm0 4h8v2h-8zM4 7v2h2V7zm4 4H2V5h6zm-6 2h6v2H2zm0 4h6v2H2zm0 0v-2h2v2zm4 0v-2h2v2z"/>',
  options:
    '<g fill="currentColor" stroke="none"><path d="M4 14h2v6H4zm5 0h2v6H9zm-5-2h7v2H4zm0 8h7v2H4zm-2-4h2v2H2zm20-8h-4V6h4z"/><path d="M10 16h12v2H10zm5-8H2V6h13zm5-4v2h-2V4zm0 6V8h-2v2zm-7-8h7v2h-7zm0 10h7v-2h-7zm0-8h2v2h-2zm0 6h2V8h-2z"/></g>',
  "custom-rules":
    '<path fill="currentColor" stroke="none" fill-opacity=".16" d="M8.4 14H5.6A1.6 1.6 0 0 0 4 15.6v2.8A1.6 1.6 0 0 0 5.6 20h2.8a1.6 1.6 0 0 0 1.6-1.6v-2.8A1.6 1.6 0 0 0 8.4 14m10-10h-2.8A1.6 1.6 0 0 0 14 5.6v2.8a1.6 1.6 0 0 0 1.6 1.6h2.8A1.6 1.6 0 0 0 20 8.4V5.6A1.6 1.6 0 0 0 18.4 4"/><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="10" stroke-width="1.5" d="M14 17h6m-3 3v-6M5.6 4h2.8A1.6 1.6 0 0 1 10 5.6v2.8A1.6 1.6 0 0 1 8.4 10H5.6A1.6 1.6 0 0 1 4 8.4V5.6A1.6 1.6 0 0 1 5.6 4m0 10h2.8a1.6 1.6 0 0 1 1.6 1.6v2.8A1.6 1.6 0 0 1 8.4 20H5.6A1.6 1.6 0 0 1 4 18.4v-2.8A1.6 1.6 0 0 1 5.6 14m10-10h2.8A1.6 1.6 0 0 1 20 5.6v2.8a1.6 1.6 0 0 1-1.6 1.6h-2.8A1.6 1.6 0 0 1 14 8.4V5.6A1.6 1.6 0 0 1 15.6 4"/>',
  plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
  minus: '<line x1="5" y1="12" x2="19" y2="12"/>',
  // The CMD token mark: a looped-square command glyph, used beside every CMD
  // count so the token reads as its own symbol wherever it appears.
  "cmd-delta":
    '<g fill="currentColor" stroke="none"><path d="M16 16h3a3 3 0 1 1-3 3.001zM5 16l3 .001v3a3 3 0 1 1-3-3"/><path fill-rule="evenodd" d="M19 8h-3V5a3 3 0 1 1 3 3M8 8V5a3 3 0 1 0-3 3z" clip-rule="evenodd"/><path d="M16 8H8v8h8z" opacity=".5"/></g>',
  // A twelve-sided die showing "12": the roll behind the corp-name generator.
  d12: '<path fill="currentColor" stroke="none" fill-rule="evenodd" d="M12 2L1.5 9.64L5.5 22h13l4-12.36zm5 18H7l-3.15-9.6L12 4.47l8.15 5.93zm0-4.25V17h-5.34v-1.09s3.57-3.46 3.57-4.51c0-1.28-1.05-1.15-1.05-1.15c-.68.05-1.18.62-1.18 1.3h-1.56c.06-1.46 1.28-2.61 2.83-2.55c2.47 0 2.5 1.85 2.5 2.3c0 1.77-3.19 4.47-3.19 4.47zM10.5 17H8.89v-6.11L7 11.47v-1.28L10.31 9h.19z"/>',
  // Eraser (tabler): the "blank the name" button beside the roll die.
  eraser: '<path d="M19 20H8.5l-4.21-4.3a1 1 0 0 1 0-1.41l10-10a1 1 0 0 1 1.41 0l5 5a1 1 0 0 1 0 1.41L11.5 20m6.5-6.7L11.7 7"/>',
  // Utility ship (streamline-plump wrench-circle): a Mass 1+ ship with Utility Bays.
  utility: '<path fill="currentColor" stroke="none" d="M1.5 24C1.5 11.574 11.574 1.5 24 1.5S46.5 11.574 46.5 24c0 10.493-7.182 19.308-16.899 21.797V39.69c0-1.59.974-2.987 2.287-3.884A13.98 13.98 0 0 0 38 24.24c0-5.09-2.717-9.547-6.78-11.997c-1.182-.712-2.553.242-2.553 1.622v8.223c0 .445-.147.878-.452 1.202c-.638.676-1.914 1.861-3.591 2.578c-.398.17-.849.17-1.247 0c-1.723-.736-3.022-1.967-3.64-2.632a1.7 1.7 0 0 1-.44-1.072c-.13-2.299-.172-5.234-.17-8.154c.002-1.401-1.397-2.367-2.582-1.62c-3.93 2.479-6.542 6.86-6.542 11.85c0 4.806 2.422 9.047 6.112 11.567c1.313.897 2.287 2.294 2.287 3.884v6.108C8.684 43.31 1.5 34.494 1.5 24"/>',
  close: '<line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/>',
  check: '<polyline points="5 13 10 18 19 7"/>',
  warning: '<path d="M12 3 22 20 2 20 Z"/><line x1="12" y1="9.5" x2="12" y2="14.5"/><line x1="12" y1="17" x2="12" y2="17.01"/>',
  print: '<rect x="6" y="3" width="12" height="5"/><rect x="4" y="8" width="16" height="8"/><rect x="7" y="13" width="10" height="8"/>',
  link: '<path d="M9 15a4 4 0 0 0 6 0l3-3a4 4 0 0 0-6-6l-1.5 1.5"/><path d="M15 9a4 4 0 0 0-6 0l-3 3a4 4 0 0 0 6 6l1.5-1.5"/>',
  home: '<path d="M4 11 12 4 20 11"/><path d="M6 10 V20 H18 V10"/>',
  pencil: '<path d="M4 20 5 16 16.5 4.5 19.5 7.5 8 19 Z"/><line x1="14.5" y1="6.5" x2="17.5" y2="9.5"/>',
  duplicate: '<rect x="8" y="8" width="12" height="12"/><path d="M16 4 H4 V16"/>',
  // Siemens iX-style solid marks for the three card actions. Solid, geometric,
  // 2px corner radii: they read at 18px on a card where the stroke set goes
  // muddy, and the card shows them without labels.
  "ix-duplicate":
    '<g fill="currentColor" stroke="none"><path d="M9 2h9a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-1v-2h1V4H9v1H7V4a2 2 0 0 1 2-2Z"/><rect x="3" y="7" width="13" height="15" rx="2"/></g>',
  "ix-share":
    '<g fill="currentColor" stroke="none"><circle cx="18.5" cy="5" r="3.2"/><circle cx="18.5" cy="19" r="3.2"/><circle cx="5.5" cy="12" r="3.2"/><path d="m7.9 9.9 8.2-4.1.9 1.8-8.2 4.1zm0 4.2.9-1.8 8.2 4.1-.9 1.8z"/></g>',
  // Same Siemens iX family as the card actions above: a solid right-pointing
  // triangle inside a square plate, 2px corners. Reads at 18px on the builder
  // header where a stroked outline would go muddy.
  "ix-play":
    '<g fill="currentColor" stroke="none"><path d="M4 3.6A1.6 1.6 0 0 1 5.6 2h12.8A1.6 1.6 0 0 1 20 3.6v16.8a1.6 1.6 0 0 1-1.6 1.6H5.6A1.6 1.6 0 0 1 4 20.4Zm2 .4v16h12V4Z"/><path d="M9.6 7.2v9.6l7.2-4.8z"/></g>',
  // Siemens ix:context-menu, verbatim. Vertical dots, not the horizontal ones
  // (ix:more-menu): a horizontal triplet at 18px is read as a text ellipsis -
  // "the name is truncated" - where a vertical triplet is read as a menu.
  "ix-context-menu":
    '<path fill="currentColor" stroke="none" fill-rule="evenodd" d="M256 117.333c17.673 0 32-14.327 32-32s-14.327-32-32-32s-32 14.327-32 32s14.327 32 32 32m0 341.333c17.673 0 32-14.327 32-32s-14.327-32-32-32s-32 14.327-32 32s14.327 32 32 32M256 288c17.673 0 32-14.327 32-32s-14.327-32-32-32s-32 14.327-32 32s14.327 32 32 32"/>',
  "ix-trash":
    '<g fill="currentColor" stroke="none"><path d="M9.5 2h5a1.5 1.5 0 0 1 1.5 1.5V5h5v2H3V5h5V3.5A1.5 1.5 0 0 1 9.5 2Zm.5 3h4v-1h-4z"/><path d="M5 8h14l-.8 12.1A2 2 0 0 1 16.2 22H7.8a2 2 0 0 1-2-1.9zm4 2v9h1.6v-9zm4.4 0v9H15v-9z"/></g>',
  trash: '<path d="M5 7 H19"/><path d="M9 7 V5 H15 V7"/><path d="M7 7 8 20 H16 L17 7"/>',
  save: '<path d="M5 4 H16 L20 8 V20 H5 Z"/><rect x="8" y="13" width="8" height="7"/><rect x="8" y="4" width="7" height="4"/>',
  chevronDown: '<polyline points="6 9 12 15 18 9"/>',
  chevronRight: '<polyline points="9 6 15 12 9 18"/>',
  more: '<circle cx="5" cy="12" r="1.6" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.6" fill="currentColor" stroke="none"/>',
  menu: '<line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="20" y2="17"/>',
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
  settings: '<circle cx="12" cy="12" r="3.4"/><line x1="12" y1="1.5" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="22.5"/><line x1="1.5" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="22.5" y2="12"/><line x1="4.6" y1="4.6" x2="7" y2="7"/><line x1="17" y1="17" x2="19.4" y2="19.4"/><line x1="19.4" y1="4.6" x2="17" y2="7"/><line x1="7" y1="17" x2="4.6" y2="19.4"/>',
  // Options: three horizontal sliders with offset knobs - the plain, universally
  // read "settings / tune" control, cleaner than a many-spoked gear.
  sliders: '<line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="20" y2="17"/><circle cx="9" cy="7" r="2.3" fill="var(--paper,#fff)"/><circle cx="15" cy="12" r="2.3" fill="var(--paper,#fff)"/><circle cx="8" cy="17" r="2.3" fill="var(--paper,#fff)"/>',
  compare: '<line x1="6" y1="4" x2="6" y2="20"/><line x1="18" y1="4" x2="18" y2="20"/><rect x="3" y="9" width="6" height="7"/><rect x="15" y="7" width="6" height="9"/>',
  image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.8" fill="currentColor" stroke="none"/><path d="M4 18 9 12 13 16 16 13 20 18" fill="none"/>',
  die: '<rect x="4" y="4" width="16" height="16" rx="3.5"/><circle cx="9" cy="9" r="1.5" fill="currentColor" stroke="none"/><circle cx="15" cy="9" r="1.5" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="9" cy="15" r="1.5" fill="currentColor" stroke="none"/><circle cx="15" cy="15" r="1.5" fill="currentColor" stroke="none"/>',
  // ship-stat glyphs, drawn on the 24 grid to sit inline with numbers
  "stat-mass": MASS_MARK,
  "stat-thrust":
    '<path fill="currentColor" stroke="none" d="m13.061 4.939l-2.122 2.122L15.879 12l-4.94 4.939l2.122 2.122L20.121 12z"/><path fill="currentColor" stroke="none" d="M6.061 19.061L13.121 12l-7.06-7.061l-2.122 2.122L8.879 12l-4.94 4.939z"/>',
  // si:target-fill and solar:shield-bold, both as supplied: solid marks, so they
  // carry their own fill and stroke:none and ignore icon()'s stroke wrapper.
  "stat-silhouette":
    '<path fill="currentColor" stroke="none" d="M11.997 4.5C7.312 4.5 3.5 8.312 3.5 13s3.813 8.5 8.5 8.5c4.688 0 8.5-3.812 8.5-8.5s-3.812-8.5-8.503-8.5m.003 15c-3.584 0-6.5-2.916-6.5-6.5S8.414 6.5 12 6.5c3.584 0 6.5 2.916 6.5 6.5s-2.916 6.5-6.5 6.5m3.348-7.469L15.5 12h.879A4.5 4.5 0 0 0 13 8.622V9.5c0 .551-.449 1-1 1a.99.99 0 0 1-.969-.846L11 9.5v-.88A4.5 4.5 0 0 0 7.62 12h.88l.153.031c.476.076.847.472.847.969s-.371.893-.846.969L8.5 14h-.878A4.51 4.51 0 0 0 11 17.379V16.5l.031-.154c.077-.476.472-.846.969-.846s.893.371.969.848L13 16.5v.879A4.5 4.5 0 0 0 16.379 14H15.5l-.152-.031c-.477-.076-.848-.472-.848-.969s.371-.893.848-.969m-.446 2.867a3.5 3.5 0 0 1-1.004 1.002c-.256-.81-1.004-1.401-1.897-1.401s-1.642.592-1.898 1.401c-.4-.262-.74-.603-1.003-1.002A1.995 1.995 0 0 0 10.501 13c0-.895-.592-1.643-1.402-1.898c.263-.399.603-.74 1.004-1.002a1.99 1.99 0 0 0 1.898 1.401c.894 0 1.644-.593 1.899-1.403c.399.264.74.604 1.002 1.004A1.995 1.995 0 0 0 13.501 13a1.99 1.99 0 0 0 1.401 1.898"/>',
  "stat-shields":
    '<path fill="currentColor" stroke="none" d="M11.25 2.073c-.606.113-1.318.357-2.412.732L8.265 3c-3.007 1.03-4.51 1.544-4.887 2.082C3.008 5.608 3 7.15 3 10.21l8.25-2.75zm0 6.967L3 11.79v.201c0 5.638 4.239 8.374 6.899 9.536c.51.223.84.367 1.351.432zm1.5 12.92V9.04L21 11.79v.201c0 5.638-4.239 8.374-6.899 9.536c-.51.223-.84.367-1.351.432m0-14.499V2.072c.606.113 1.318.357 2.412.732l.573.196c3.007 1.029 4.51 1.543 4.887 2.081c.37.526.378 2.068.378 5.127z"/>',
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

// Most icons here are drawn on a 24-unit grid; the few that arrive on another
// one declare it rather than being redrawn. Paths that carry their own fill or
// stroke override the wrapper's defaults, which is how the solid nav marks sit
// alongside the stroke-only set.
/**
 * The four ship-stat glyphs come from different icon sets and draw wildly
 * different amounts of ink inside the same 24 grid - measured bounding boxes are
 * Mass 23 units tall, Shields 19.9, Silhouette 17, Thrust 14.1. Rendered at one
 * pixel size they therefore looked like four different sizes, Mass reading 63%
 * bigger than Thrust.
 *
 * Each stat glyph gets a square viewBox that tightly frames its own art (plus 4%
 * air), centred on that art. The largest dimension of every glyph then fills its
 * box, so one pixel size really is one apparent size. Recompute these if a glyph
 * is ever redrawn: box side = max(bboxW, bboxH) * 1.04, centred on the bbox.
 */
const ICON_VIEWBOX: Record<string, string> = {
  utility: "0 0 48 48",
  "stat-mass": "0.04 0.04 23.92 23.92",
  "stat-thrust": "3.62 3.59 16.83 16.83",
  "stat-silhouette": "3.16 4.16 17.68 17.68",
  "stat-shields": "1.66 1.67 20.69 20.69",
  // Siemens ix icons ship on a 512 grid, not the 24 the rest of this set uses.
  "ix-context-menu": "0 0 512 512",
};

export function icon(name: string, size = 18, cls = ""): string {
  const body = PATHS[name];
  if (!body) return "";
  const vb = ICON_VIEWBOX[name] ?? "0 0 24 24";
  return `<svg class="icon ${cls}" width="${size}" height="${size}" viewBox="${vb}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="square" stroke-linejoin="miter" aria-hidden="true">${body}</svg>`;
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
  const chip = (name: string, label: string, val: string) => {
    // All four at one size. Mass and Silhouette used to be drawn larger on the
    // reasoning that a ring reads smaller than a solid mark, but in a row of
    // four the mismatch just looks like a mistake.
    const size = compact ? 14 : 16;
    return `<span class="stat-chip ${compact ? "stat-chip-mini" : ""}">${icon(name, size, `stat-ico stat-ico-${name.replace("stat-", "")}`)}<span class="stat-lbl">${label}</span><span class="stat-val">${val}</span></span>`;
  };
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
export function creditsGlyph(size = 12): string {
  const w = (size * CREDITS_VB.w) / CREDITS_VB.h;
  return `<svg class="credits-glyph" width="${w.toFixed(2)}" height="${size}" viewBox="0 0 ${CREDITS_VB.w} ${CREDITS_VB.h}" fill="currentColor" aria-hidden="true" focusable="false">${CREDITS_INNER}</svg>`;
}
