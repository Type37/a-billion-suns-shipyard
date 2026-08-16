// Plain-text / Markdown export of a fleet list, for pasting into Discord,
// forums, or a notes app. Built from the same catalogue the builder uses.

import type { Faction, Hvp } from "../src/types.ts";
import { GENERIC_HVP } from "../src/data/index.ts";
import { creditsText, formatWeapon } from "./format.ts";
import { findFaction } from "./catalog.ts";
import { resolveShip, listTotals } from "./render.ts";
import type { SavedList } from "./storage.ts";

function hvpDef(id: string, faction: Faction | undefined): Hvp | undefined {
  return faction?.hvp.find((x) => x.id === id) ?? GENERIC_HVP.find((x) => x.id === id);
}

const MODE_ERA: Record<string, string> = {
  armageddon: "Armageddon",
  "age-of-unity": "Age of Unity",
  hypergrowth: "Hypergrowth",
  "combat-simulator": "Combat Simulator",
  "management-training": "Management Training",
};

/** Render a fleet as Markdown. Reflects only the ships and personnel chosen. */
export function fleetToMarkdown(list: SavedList, customs: Faction[]): string {
  const faction = findFaction(list.fleet.factionId, customs);
  const { total } = listTotals(list, customs);
  const era = MODE_ERA[list.mode] ?? "";
  const lines: string[] = [];

  lines.push(`# ${list.fleet.name || "Unnamed fleet"}`);
  const sub = [faction?.name ?? "Mixed forces", era].filter(Boolean).join(" — ");
  lines.push(`${sub} · ${creditsText(total)} of ${creditsText(list.fleet.creditsLimit)}`);
  if (faction) lines.push(`**${faction.rule.name}:** ${faction.rule.text}`);
  lines.push("");

  lines.push("## Units");
  if (list.fleet.units.length === 0) {
    lines.push("_No units._");
  } else {
    // Lightest Mass first, the same order every on-screen and printed view uses.
    const ordered = [...list.fleet.units].sort((a, b) => {
      const x = resolveShip(a.shipClassId, faction, customs)?.ship;
      const y = resolveShip(b.shipClassId, faction, customs)?.ship;
      return (x?.mass ?? Infinity) - (y?.mass ?? Infinity) || (x?.cost ?? Infinity) - (y?.cost ?? Infinity);
    });
    for (const u of ordered) {
      const r = resolveShip(u.shipClassId, faction, customs);
      const ship = r?.ship;
      const name = u.name || `${ship?.name ?? u.shipClassId} unit`;
      const cost = ship ? ship.cost * u.count : 0;
      // The line already opens with the count, so the sum reads "¢10 each = ¢30"
      // rather than repeating the 3× the way the on-screen breakdown does.
      const price =
        ship && u.count > 1
          ? `${creditsText(ship.cost)} each = ${creditsText(cost)}`
          : creditsText(cost);
      lines.push(`- **${name}** — ${u.count}× ${ship?.name ?? u.shipClassId} (Mass ${ship?.mass ?? "?"}), ${price}`);
      if (ship) {
        const weapons = [...ship.primary, ...ship.auxiliary].map(formatWeapon);
        for (const wline of weapons) lines.push(`    - ${wline}`);
      }
      const carried = list.fleet.hvp.filter((h) => h.assignedUnitId === u.id);
      for (const h of carried) {
        const def = hvpDef(h.hvpId, faction);
        lines.push(`    - Carrying: ${h.customName || def?.name || h.hvpId}`);
      }
    }
  }
  lines.push("");

  lines.push("## High-Value Personnel");
  if (list.fleet.hvp.length === 0) {
    lines.push("_None selected._");
  } else {
    for (const sel of list.fleet.hvp) {
      const def = hvpDef(sel.hvpId, faction);
      // The whole line as the player wrote it ("Kyle Hawkins, Flight
      // Controller"), or the job title if they never wrote one. Nothing here
      // composes the two halves; the field they typed into already did.
      const name = sel.customName || def?.name || sel.hvpId;
      lines.push(`- **${name}**${def ? `: ${def.rule}` : ""}`);
    }
  }


  return lines.join("\n");
}
