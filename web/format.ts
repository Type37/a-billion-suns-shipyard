import type { ShipClass, Weapon } from "../src/types.ts";
import { creditsGlyph, MASS_MARK } from "./icons.ts";

// Project style rules: no abbreviations in anything user-visible, no monospace,
// and a hard budget of one em-dash and one interpunct across the whole project
// (both are spent in the print document, nowhere else).

// Bracket notation, matching the book's own ship-class table: name, then
// [dice, range] in brackets. Damage isn't printed - it's a fixed lookup from
// the die, not a separate figure the book gives a column to.
export function formatWeapon(weapon: Weapon): string {
  return `${weapon.name} [${weapon.count}${weapon.die}, ${weapon.rangeMin}-${weapon.rangeMax}"]`;
}

/** Primary column content: full weapon lines, "Utility Bays", or "None". */
export function primarySlotText(ship: ShipClass): string {
  if (ship.primary.length > 0) return ship.primary.map(formatWeapon).join("<br />");
  if (ship.primaryUtility) return "Utility Bays";
  if (ship.utilityBays && !ship.auxiliaryUtility && ship.auxiliary.length > 0) return "Utility Bays";
  if (ship.utilityBays && ship.auxiliary.length === 0 && !ship.auxiliaryFitting) return "Utility Bays";
  return "None";
}

/** Auxiliary column content. */
export function auxSlotText(ship: ShipClass): string {
  if (ship.auxiliary.length > 0) return ship.auxiliary.map(formatWeapon).join("<br />");
  if (ship.auxiliaryFitting) return ship.auxiliaryFitting;
  if (ship.auxiliaryUtility) return "Utility Bays";
  return "None";
}

/**
 * A credits figure for display: the credits mark followed by the amount. Main
 * (fleet) modes only - solo money is ¢k and keeps the plain cent sign.
 * Returns markup, so use creditsText() anywhere the result is not HTML.
 */
export function credits(n: number): string {
  // 12 -> 13.5: the credits mark sits beside every price in the app and was the
  // smallest glyph on screen.
  return `${creditsGlyph(13.5)}${n}`;
}

/** The same figure as plain text, for exports, attributes and clipboard copy. */
export function creditsText(n: number): string {
  return `¢${n}`;
}

const ESCAPE_MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ESCAPE_MAP[c] ?? c);
}

/**
 * Escape rules prose for display. Same as escapeHtml, but also swaps the
 * circled-m Mass symbol (ⓜ, U+24DC) - which none of the body fonts include, so
 * as a bare character it falls back to whatever the OS has and renders in a
 * foreign face at the wrong weight - for the real glyph as inline SVG, which
 * renders identically everywhere, on screen and in print. Use for any faction
 * rule, HVP rule, or tutorial text; do NOT use for <textarea> values (the raw
 * character must survive a round-trip there).
 */
export function ruleText(s: string): string {
  // The SAME drawing as the stat-mass icon, not a second one that happens to
  // also be a circled m - see MASS_MARK in icons.ts for where the outline comes
  // from. Filled, so no stroke attributes here.
  const mass =
    '<svg class="mass-inline" viewBox="0 0 24 24" role="img" aria-label="Mass">' + MASS_MARK + "</svg>";
  // U+24DC is the correct character (circled lowercase m, what the book prints).
  // U+24C2 (the capital) is accepted too: it is what the data used until the
  // codepoint was corrected, and custom factions people have already written
  // and saved in their own browsers still contain it.
  //
  // *asterisks* become italics. The Quick Reference italicises the qualifier
  // that scopes a rule - "*Utility Ships only*", "*Hypergrowth only*" - and the
  // transcription has to carry that, since dropping it would change how the
  // line reads. Applied AFTER escaping, so the markers are the only markup that
  // can ever get through; user-authored faction text is still fully escaped.
  return escapeHtml(s)
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/[ⓜⓂ]/g, mass);
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}
