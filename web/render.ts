import type { Era, Faction, FleetUnit, GameMode, Hvp, ShipClass } from "../src/types.ts";
import { ALLIANCE_SPECIES } from "../src/types.ts";
import { validateFleet, type ValidationIssue } from "../src/validation.ts";
import { GENERIC_HVP } from "../src/data/index.ts";
import { JUNKSPACE_SHIPS } from "../src/data/junkspace.ts";
import { allFactions, factionsByEra, findFaction, makeCatalog, ERA_ORDER } from "./catalog.ts";
import { auxSlotText, credits, escapeHtml, formatDate, primarySlotText } from "./format.ts";
import { emblem, emblemMark, EMBLEM_IDS, icon, massGlyph, statChips } from "./icons.ts";
import { CHANGELOG } from "./changelog.ts";
import type { AppState } from "./state.ts";
import { activeList } from "./state.ts";
import type { SavedList } from "./storage.ts";
import { soloListView, soloOutfitView } from "./solo.ts";

// The whole app renders from state into #app. Interactive elements carry
// data-action attributes; actions.ts owns all event handling.

const MODE_LABEL: Record<GameMode, string> = {
  "combat-simulator": "Combat Simulator",
  "management-training": "Management Training",
  armageddon: "Armageddon",
  "age-of-unity": "The Age of Unity",
  hypergrowth: "Hypergrowth",
  junkspace: "Junkspace",
};

const MODE_ERA: Partial<Record<GameMode, Era>> = {
  armageddon: "Armageddon",
  "age-of-unity": "Age of Unity",
  hypergrowth: "Hypergrowth",
};

// ---------------------------------------------------------------------------
// Composite ship class ids: Free Play units may borrow from any faction, so
// their shipClassId is stored as "factionId/shipId".
// ---------------------------------------------------------------------------

export function resolveShip(
  shipClassId: string,
  faction: Faction | undefined,
  customs: Faction[],
): { ship: ShipClass; owner: Faction } | undefined {
  if (shipClassId.includes("/")) {
    const [fid, sid] = shipClassId.split("/");
    const owner = findFaction(fid ?? "", customs);
    const ship = owner?.ships.find((s) => s.id === sid);
    return ship && owner ? { ship, owner } : undefined;
  }
  const ship = faction?.ships.find((s) => s.id === shipClassId);
  return ship && faction ? { ship, owner: faction } : undefined;
}

function hvpById(id: string, faction: Faction | undefined): Hvp | undefined {
  return faction?.hvp.find((h) => h.id === id) ?? GENERIC_HVP.find((h) => h.id === id);
}

export function listTotals(list: SavedList, customs: Faction[]): { total: number; remaining: number } {
  const faction = findFaction(list.fleet.factionId, customs);
  let total = 0;
  for (const u of list.fleet.units) {
    const r = resolveShip(u.shipClassId, faction, customs);
    if (r && Number.isInteger(u.count) && u.count > 0) total += r.ship.cost * u.count;
  }
  return { total, remaining: list.fleet.creditsLimit - total };
}

// ---------------------------------------------------------------------------
// Shared chrome
// ---------------------------------------------------------------------------

function topbar(): string {
  return `
  <header class="topbar">
    <a class="wordmark" href="#/">${icon("logo", 26)}<span class="wordmark-text">A Billion Suns</span><span class="wordmark-sub">Shipyard</span></a>
    <nav class="topnav">
      <a href="#/ships">${icon("compare", 16)} Compendium</a>
      <a href="#/solo">${icon("flag", 16)} Solo / Junkspace</a>
      <a href="#/foundry">${icon("wrench", 16)} Faction Foundry</a>
      <a href="#/changelog">${icon("scroll", 16)} Changelog</a>
    </nav>
  </header>`;
}

function footer(): string {
  return `
  <footer class="app-footer">
    <p>An unofficial player aid for A Billion Suns, Second Edition, a game by Mike Hutchinson, published by Osprey Games.</p>
    <p><a href="#/changelog">Version ${CHANGELOG[0]?.version}</a></p>
  </footer>`;
}

function toast(state: AppState): string {
  return state.ui.toast ? `<div class="toast" role="status">${escapeHtml(state.ui.toast)}</div>` : "";
}

// ---------------------------------------------------------------------------
// Home
// ---------------------------------------------------------------------------

function homeView(state: AppState): string {
  const byEra = factionsByEra(state.customFactions);
  const lists = [...state.lists].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  const eraCards = ERA_ORDER.map((era) => {
    const factions = byEra.get(era) ?? [];
    const mode: GameMode = era === "Armageddon" ? "armageddon" : era === "Age of Unity" ? "age-of-unity" : "hypergrowth";
    const plaques = factions
      .map(
        (f) => `
        <button class="faction-plaque" data-action="new-list" data-mode="${mode}" data-faction="${f.id}">
          <span class="faction-plaque-name">${escapeHtml(f.name)}</span>
          <span class="faction-plaque-rule">${escapeHtml(f.rule.name)}</span>
        </button>`,
      )
      .join("");
    return `
    <section class="era-block">
      <h3 class="era-title">${era}</h3>
      <div class="faction-plaques">${plaques || '<p class="muted">Faction records pending.</p>'}</div>
    </section>`;
  }).join("");

  const rows = lists
    .map((l) => {
      const faction = findFaction(l.fleet.factionId, state.customFactions);
      const { total } = listTotals(l, state.customFactions);
      return `
      <tr>
        <td class="cell-emblem"><span class="emblem-chip">${emblemMark(l.emblem, l.emblemImage, 22)}</span></td>
        <td class="cell-name"><a href="#/list/${l.id}">${escapeHtml(l.fleet.name || "Unnamed fleet")}</a></td>
        <td>${escapeHtml(faction?.name ?? "Mixed forces")}</td>
        <td>${l.freePlay ? "Free Play" : MODE_LABEL[l.mode]}</td>
        <td class="cell-num">${credits(total)}</td>
        <td class="cell-date">${formatDate(l.updatedAt)}</td>
        <td class="cell-actions">
          <button class="ghost-btn" data-action="duplicate-list" data-id="${l.id}" title="Duplicate this fleet">${icon("duplicate", 16)}</button>
          <button class="ghost-btn" data-action="share-list" data-id="${l.id}" title="Copy a share link">${icon("link", 16)}</button>
          <button class="ghost-btn danger" data-action="delete-list" data-id="${l.id}" title="Delete this fleet">${icon("trash", 16)}</button>
        </td>
      </tr>`;
    })
    .join("");

  return `
  ${topbar()}
  <section class="hero">
    <div class="hero-inner">
      <p class="hero-eyebrow">The Shipyard</p>
      <h1 class="hero-title">A Billion<br />Suns</h1>
      <p class="hero-sub">Build, save, print, and share fleets for the Second Edition. Every faction, every era, every rule written out in full.</p>
    </div>
  </section>

  <main class="home-main">
    <section class="commission-panel">
      <h2 class="panel-title">Commission a new fleet</h2>
      <p class="panel-note">Choose the era you are playing, then a faction. The rulebook allows any faction to be fielded in any era, and the builder honours that.</p>
      ${eraCards}
      <section class="era-block freeplay-block">
        <h3 class="era-title">Free Play</h3>
        <p class="panel-note">Everything unlocked: mix ships from any faction, set any credits limit, and build outside the rules checks entirely.</p>
        <button class="cta-btn" data-action="new-list" data-mode="armageddon" data-faction="__free__" data-freeplay="1">${icon("plus", 18)} Open a free build</button>
      </section>
      <section class="era-block freeplay-block">
        <h3 class="era-title">Solo Play</h3>
        <p class="panel-note">Junkspace: a full solo game in the ruins of Jura. Build an outfit, run the roller for the automated enemy, and clear your debt across a campaign.</p>
        <a class="cta-btn" href="#/solo">${icon("flag", 18)} Enter Junkspace</a>
      </section>
      <section class="era-block freeplay-block">
        <h3 class="era-title">Reference</h3>
        <p class="panel-note">The Ship Compendium: every ship in the game in one table. Filter by era, faction, or mass and sort by any stat to compare.</p>
        <a class="cta-btn" href="#/ships">${icon("compare", 18)} Open the compendium</a>
      </section>
    </section>

    <section class="fleet-dock">
      <h2 class="panel-title">Your fleets</h2>
      ${
        lists.length === 0
          ? '<p class="muted">Nothing here yet. Commission your first fleet on the left; everything you build is saved in this browser automatically.</p>'
          : `<div class="table-scroll"><table class="dock-table">
              <thead><tr><th></th><th>Fleet</th><th>Faction</th><th>Mode</th><th>Cost</th><th>Updated</th><th></th></tr></thead>
              <tbody>${rows}</tbody>
            </table></div>`
      }
    </section>
  </main>
  ${toast(state)}
  ${footer()}`;
}

// ---------------------------------------------------------------------------
// Builder
// ---------------------------------------------------------------------------

function issueLine(issue: ValidationIssue): string {
  const cls = issue.severity === "error" ? "issue-error" : "issue-warning";
  return `<li class="${cls}">${icon("warning", 15)}<span>${escapeHtml(issue.message)}</span></li>`;
}

function speciesSelect(unit: FleetUnit): string {
  const opts = ALLIANCE_SPECIES.map(
    (s) => `<option value="${s}" ${unit.species === s ? "selected" : ""}>${s}</option>`,
  ).join("");
  return `
    <label class="inline-field">Species
      <select data-action="unit-species" data-unit="${unit.id}">
        <option value="">Choose</option>${opts}
      </select>
    </label>`;
}

function catalogShipRow(ship: ShipClass, ownerFaction: Faction, composite: boolean): string {
  const addId = composite ? `${ownerFaction.id}/${ship.id}` : ship.id;
  return `
  <article class="ship-row">
    <div class="ship-row-glyph">${massGlyph(ship.mass, 26)}</div>
    <div class="ship-row-body">
      <div class="ship-row-head">
        <h4 class="ship-name">${escapeHtml(ship.name)}</h4>
        <span class="ship-cost">${credits(ship.cost)}</span>
      </div>
      <p class="ship-stats">${statChips(ship)}</p>
      <p class="ship-weapons"><span class="slot-label">Primary</span> ${primarySlotText(ship)}</p>
      <p class="ship-weapons"><span class="slot-label">Auxiliary</span> ${auxSlotText(ship)}</p>
    </div>
    <button class="add-btn" data-action="add-unit" data-ship="${addId}" title="Add a unit of ${escapeHtml(ship.name)}">${icon("plus", 18)}<span>Add</span></button>
  </article>`;
}

function builderView(state: AppState): string {
  const list = activeList(state);
  if (!list)
    return `${topbar()}<main class="empty-state"><p>That fleet was not found.</p><p><a href="#/">Back to the register</a></p></main>`;

  const customs = state.customFactions;
  const faction = findFaction(list.fleet.factionId, customs);
  const { total, remaining } = listTotals(list, customs);
  const era = MODE_ERA[list.mode];

  // Validation: the full engine for rules play, none for Free Play. The
  // Hypergrowth shipyard has no unit-size limits at build time (rules p.122),
  // ships are bought loose and only form units at requisition.
  let issues: ValidationIssue[] = [];
  let valid = true;
  if (!list.freePlay && faction) {
    const result = validateFleet(list.fleet, makeCatalog(customs));
    issues =
      list.mode === "hypergrowth" ? result.issues.filter((i) => i.code !== "UNIT_SIZE_EXCEEDED") : result.issues;
    valid = !issues.some((i) => i.severity === "error");
  }

  // Faction picker: the list's era first, everything else behind the same panel.
  const byEra = factionsByEra(customs);
  const eraFactions = era ? (byEra.get(era) ?? []) : allFactions(customs);
  const otherFactions = allFactions(customs).filter((f) => !eraFactions.includes(f));
  const factionOptions = (fs: Faction[]) =>
    fs
      .map(
        (f) => `
      <button class="faction-plaque ${f.id === list.fleet.factionId && !list.freePlay ? "selected" : ""}" data-action="set-faction" data-faction="${f.id}">
        <span class="faction-plaque-name">${escapeHtml(f.name)}</span>
        <span class="faction-plaque-rule">${escapeHtml(f.rule.name)}</span>
      </button>`,
      )
      .join("");

  // Catalog: one faction in rules play; every faction grouped in Free Play.
  let catalogHtml = "";
  if (list.freePlay) {
    catalogHtml = allFactions(customs)
      .map(
        (f, i) => `
        <details class="catalog-group" ${i === 0 ? "open" : ""}>
          <summary>${escapeHtml(f.name)} <span class="muted">${f.era}</span></summary>
          ${f.ships.map((s) => catalogShipRow(s, f, true)).join("")}
        </details>`,
      )
      .join("");
  } else if (faction) {
    catalogHtml = faction.ships.map((s) => catalogShipRow(s, faction, false)).join("");
  }

  // Personnel catalog.
  const chosenIds = new Set(list.fleet.hvp.map((h) => h.hvpId));
  const hvpMax = list.freePlay ? 99 : (faction?.hvpMax ?? 3);
  const hvpMin = faction?.hvpMin ?? 3;
  const atHvpCap = list.fleet.hvp.length >= hvpMax;
  const personnelCard = (h: Hvp, source: string) => `
    <article class="personnel-row ${chosenIds.has(h.id) ? "chosen" : ""}">
      <div class="personnel-body">
        <h4 class="personnel-name">${escapeHtml(h.name)} <span class="muted">${source}</span></h4>
        <p class="personnel-rule">${escapeHtml(h.rule)}</p>
      </div>
      <button class="add-btn" data-action="add-hvp" data-hvp="${h.id}" ${chosenIds.has(h.id) || atHvpCap ? "disabled" : ""}>${icon("plus", 16)}<span>Select</span></button>
    </article>`;
  const personnelCatalog = faction
    ? faction.hvp.map((h) => personnelCard(h, escapeHtml(faction.name))).join("") +
      GENERIC_HVP.map((h) => personnelCard(h, "Generic")).join("")
    : GENERIC_HVP.map((h) => personnelCard(h, "Generic")).join("");

  // Roster units.
  const unitRows = list.fleet.units
    .map((u) => {
      const r = resolveShip(u.shipClassId, faction, customs);
      const shipName = r?.ship.name ?? u.shipClassId;
      const maxCount = list.freePlay || list.mode === "hypergrowth" ? 99 : r?.ship.mass === 3 ? 1 : 3;
      const cost = r ? r.ship.cost * u.count : 0;
      const namesOpen = state.ui.openShipNames === u.id;
      const shipNameInputs = Array.from({ length: u.count })
        .map(
          (_, i) => `
          <input class="ship-name-input" type="text" value="${escapeHtml(u.shipNames?.[i] ?? "")}"
            placeholder="Name ship ${i + 1}" data-action="ship-name" data-unit="${u.id}" data-index="${i}" />`,
        )
        .join("");
      return `
      <article class="roster-unit ${r ? "" : "unresolved"}">
        <div class="roster-unit-head">
          <span class="roster-unit-glyph">${r ? massGlyph(r.ship.mass, 22) : icon("warning", 20)}</span>
          <input class="unit-name-input" type="text" value="${escapeHtml(u.name ?? "")}" placeholder="${escapeHtml(shipName)} unit" data-action="unit-name" data-unit="${u.id}" />
          <span class="roster-unit-cost">${credits(cost)}</span>
        </div>
        <div class="roster-unit-sub">
          <span class="roster-unit-class">${escapeHtml(shipName)}${r && list.freePlay ? ` <span class="muted">${escapeHtml(r.owner.name)}</span>` : ""}</span>
          <span class="stepper">
            <button data-action="unit-count" data-unit="${u.id}" data-delta="-1" title="One ship fewer">${icon("minus", 14)}</button>
            <span class="stepper-count">${u.count} ${u.count === 1 ? "ship" : "ships"}</span>
            <button data-action="unit-count" data-unit="${u.id}" data-delta="1" ${u.count >= maxCount ? "disabled" : ""} title="One ship more">${icon("plus", 14)}</button>
          </span>
        </div>
        <div class="roster-unit-tools">
          ${faction?.requiresSpecies && !list.freePlay ? speciesSelect(u) : ""}
          <button class="ghost-btn" data-action="toggle-ship-names" data-unit="${u.id}">${icon("pencil", 14)} ${namesOpen ? "Hide ship names" : "Name the ships"}</button>
          <button class="ghost-btn danger" data-action="remove-unit" data-unit="${u.id}">${icon("trash", 14)} Remove</button>
        </div>
        ${namesOpen ? `<div class="ship-names-panel">${shipNameInputs}</div>` : ""}
      </article>`;
    })
    .join("");

  // Roster personnel.
  const carrierOptions = (assignedId?: string) =>
    list.fleet.units
      .map((u) => {
        const r = resolveShip(u.shipClassId, faction, customs);
        const label = u.name || r?.ship.name || u.shipClassId;
        return `<option value="${u.id}" ${assignedId === u.id ? "selected" : ""}>${escapeHtml(label)}</option>`;
      })
      .join("");
  const hvpRows = list.fleet.hvp
    .map((sel, i) => {
      const def = hvpById(sel.hvpId, faction);
      return `
      <article class="roster-personnel">
        <div class="roster-unit-head">
          <span class="roster-unit-glyph">${icon("personnel", 20)}</span>
          <input class="unit-name-input" type="text" value="${escapeHtml(sel.customName ?? "")}"
            placeholder="Name this person" data-action="hvp-name" data-index="${i}" />
          <button class="ghost-btn danger" data-action="remove-hvp" data-index="${i}" title="Remove">${icon("close", 16)}</button>
        </div>
        <p class="roster-personnel-title">${escapeHtml(def?.name ?? sel.hvpId)}</p>
        <label class="inline-field">Carried by
          <select data-action="hvp-assign" data-index="${i}">
            <option value="">Not assigned yet</option>
            ${carrierOptions(sel.assignedUnitId)}
          </select>
        </label>
      </article>`;
    })
    .join("");

  const emblemPicker = `
    ${EMBLEM_IDS.map(
      (id) =>
        `<button class="emblem-choice ${list.emblem === id && !list.emblemImage ? "selected" : ""}" data-action="set-emblem" data-emblem="${id}" title="Use this emblem">${emblem(id, 24)}</button>`,
    ).join("")}
    <label class="emblem-choice emblem-upload ${list.emblemImage ? "selected" : ""}" title="Upload your own image">
      ${list.emblemImage ? emblemMark(list.emblem, list.emblemImage, 24) : icon("upload", 18)}
      <input type="file" accept="image/*" data-action="emblem-upload" hidden />
    </label>
    ${list.emblemImage ? `<button class="emblem-choice" data-action="clear-emblem-image" title="Remove the uploaded image">${icon("close", 16)}</button>` : ""}`;

  const limitControl = list.freePlay
    ? `<input class="limit-input" type="number" min="1" value="${list.fleet.creditsLimit}" data-action="set-limit-free" />`
    : `<div class="segment" role="group" aria-label="Credits limit">
        ${[300, 400, 500]
          .map(
            (n) =>
              `<button class="${list.fleet.creditsLimit === n ? "selected" : ""}" data-action="set-limit" data-limit="${n}">${credits(n)}</button>`,
          )
          .join("")}
      </div>`;

  const factionControl = list.freePlay
    ? '<span class="freeplay-badge">All ships unlocked</span>'
    : `<details class="faction-switch">
        <summary>${faction ? escapeHtml(faction.name) : "Choose faction"}</summary>
        <div class="faction-switch-panel">
          <div class="faction-plaques">${factionOptions(eraFactions)}</div>
          ${otherFactions.length ? `<p class="muted picker-note">From other eras, allowed by the rulebook:</p><div class="faction-plaques">${factionOptions(otherFactions)}</div>` : ""}
        </div>
      </details>`;

  return `
  ${topbar()}
  <section class="setup-band ${remaining < 0 ? "over" : ""}">
    <div class="setup-head">
      <div class="setup-identity">
        <p class="band-eyebrow">${list.freePlay ? "Free Play" : MODE_LABEL[list.mode]}</p>
        <input class="fleet-name-input" type="text" value="${escapeHtml(list.fleet.name ?? "")}" placeholder="Name this fleet" data-action="fleet-name" />
      </div>
      <div class="band-readout">
        <div class="readout"><span class="readout-label">Limit</span><span class="readout-value">${credits(list.fleet.creditsLimit)}</span></div>
        <div class="readout"><span class="readout-label">Committed</span><span class="readout-value">${credits(total)}</span></div>
        <div class="readout"><span class="readout-label">Remaining</span><span class="readout-value ${remaining < 0 ? "negative" : ""}">${remaining < 0 ? "&#8722;" : ""}${credits(Math.abs(remaining))}</span></div>
      </div>
    </div>
    <div class="setup-controls">
      <div class="control-group">
        <span class="control-label">Credits limit</span>
        ${limitControl}
      </div>
      <div class="control-group">
        <span class="control-label">Faction</span>
        ${factionControl}
      </div>
      <div class="control-group control-group-emblem">
        <span class="control-label">Emblem</span>
        <div class="emblem-picker">${emblemPicker}</div>
      </div>
    </div>
  </section>

  <main class="workspace">
    <section class="catalog">
      ${
        faction && !list.freePlay
          ? `<article class="rule-card">
              <h3 class="rule-card-title">${escapeHtml(faction.rule.name)}</h3>
              <p class="rule-card-text">${escapeHtml(faction.rule.text)}</p>
              <p class="rule-card-meta">Initiative ${escapeHtml(faction.initiative)}. Command tokens each round: ${escapeHtml(faction.cmdTokens)}.</p>
            </article>`
          : ""
      }
      <h3 class="catalog-title">Ship classes</h3>
      <div class="catalog-list">${catalogHtml || '<p class="muted">Pick a faction to see its ships.</p>'}</div>
      <h3 class="catalog-title">High-Value Personnel <span class="muted">${list.freePlay ? "select any number" : hvpMin === hvpMax ? `select ${hvpMax}` : `select ${hvpMin} to ${hvpMax}`}</span></h3>
      <div class="catalog-list">${personnelCatalog}</div>
    </section>

    <aside class="roster">
      <div class="roster-sheet">
        <header class="roster-head">
          <span class="roster-emblem">${emblemMark(list.emblem, list.emblemImage, 34)}</span>
          <div>
            <h2 class="roster-title">${escapeHtml(list.fleet.name || "Unnamed fleet")}</h2>
            <p class="roster-subtitle">${escapeHtml(faction?.name ?? "Mixed forces")}${era ? `, ${era}` : ""}</p>
          </div>
        </header>

        <h3 class="roster-section">Units <span class="muted">${list.fleet.units.length}</span></h3>
        ${unitRows || '<p class="muted roster-hint">Add ships from the catalogue on the left. Each addition starts a new unit.</p>'}

        <h3 class="roster-section">High-Value Personnel <span class="muted">${list.fleet.hvp.length}${list.freePlay ? "" : ` of ${hvpMax}`}</span></h3>
        ${hvpRows || '<p class="muted roster-hint">Select personnel from the catalogue. They ride units of Mass 1 or higher.</p>'}

        ${
          list.freePlay
            ? '<div class="inspection freeplay"><p>Free Play: the rules inspector is off. Build whatever you like.</p></div>'
            : `<div class="inspection ${valid ? "pass" : "fail"}">
                <h3 class="roster-section">Inspection report</h3>
                ${
                  issues.length === 0
                    ? `<p class="inspection-pass">${icon("check", 16)} This fleet list is legal and ready for the table.</p>`
                    : `<ul class="issue-list">${issues.map(issueLine).join("")}</ul>`
                }
              </div>`
        }

        <div class="roster-actions">
          <a class="cta-btn" href="#/print/${list.id}">${icon("print", 17)} Print roster</a>
          <button class="bar-btn" data-action="share-list" data-id="${list.id}">${icon("link", 16)} Copy share link</button>
          <button class="bar-btn" data-action="duplicate-list" data-id="${list.id}">${icon("duplicate", 16)} Duplicate</button>
          <button class="bar-btn danger" data-action="delete-list" data-id="${list.id}">${icon("trash", 16)} Delete</button>
        </div>
      </div>
    </aside>
  </main>
  ${toast(state)}
  ${footer()}`;
}

// ---------------------------------------------------------------------------
// Print
// ---------------------------------------------------------------------------

function printView(state: AppState): string {
  const list = activeList(state);
  if (!list) return `${topbar()}<main class="empty-state"><p>That fleet was not found.</p></main>`;
  const customs = state.customFactions;
  const faction = findFaction(list.fleet.factionId, customs);
  const { total } = listTotals(list, customs);
  const era = MODE_ERA[list.mode];

  const unitBlocks = list.fleet.units
    .map((u, i) => {
      const r = resolveShip(u.shipClassId, faction, customs);
      if (!r) return "";
      const ship = r.ship;
      const title = u.name || `${ship.name} unit`;
      const shipNames = (u.shipNames ?? []).filter(Boolean);
      const carried = list.fleet.hvp
        .filter((h) => h.assignedUnitId === u.id)
        .map((h) => {
          const def = hvpById(h.hvpId, faction);
          return h.customName ? `${h.customName}, ${def?.name ?? h.hvpId}` : (def?.name ?? h.hvpId);
        });
      return `
      <section class="print-unit">
        <header class="print-unit-head">
          <span class="print-unit-index">${i + 1}</span>
          <h3 class="print-unit-name">${escapeHtml(title)}</h3>
          <span class="print-unit-cost">${u.count} ${u.count === 1 ? "ship" : "ships"} at ${credits(ship.cost)} each: ${credits(ship.cost * u.count)}</span>
        </header>
        <table class="print-stats">
          <thead><tr><th>Ship class</th><th>Mass</th><th>Thrust</th><th>Silhouette</th><th>Shields</th></tr></thead>
          <tbody><tr>
            <td>${escapeHtml(ship.name)}${list.freePlay ? ` (${escapeHtml(r.owner.name)})` : ""}</td>
            <td>${ship.mass}</td><td>${ship.thrust}"</td><td>${ship.silhouette}</td><td>${ship.shields}</td>
          </tr></tbody>
        </table>
        <table class="print-weapons">
          <tbody>
            <tr><th>Primary weapons</th><td>${primarySlotText(ship)}</td></tr>
            <tr><th>Auxiliary weapons</th><td>${auxSlotText(ship)}</td></tr>
          </tbody>
        </table>
        ${u.species ? `<p class="print-note">Species: ${u.species}</p>` : ""}
        ${shipNames.length ? `<p class="print-note">Ships: ${shipNames.map(escapeHtml).join(", ")}</p>` : ""}
        ${carried.length ? `<p class="print-note">Carrying: ${carried.map(escapeHtml).join("; ")}</p>` : ""}
      </section>`;
    })
    .join("");

  const hvpBlocks = list.fleet.hvp
    .map((sel) => {
      const def = hvpById(sel.hvpId, faction);
      if (!def) return "";
      const displayName = sel.customName ? `${sel.customName}, ${def.name}` : def.name;
      return `
      <section class="print-hvp">
        <h4>${escapeHtml(displayName)}</h4>
        <p>${escapeHtml(def.rule)}</p>
      </section>`;
    })
    .join("");

  // The project's single interpunct lives in this subtitle, and its single
  // em-dash lives in the attribution line below. Nowhere else, ever.
  const subtitle = `${escapeHtml(faction?.name ?? "Mixed forces")}${era ? ` · ${era}` : ""}`;

  return `
  <div class="print-page">
    <div class="print-toolbar">
      <a class="bar-btn" href="#/list/${list.id}">Back to the builder</a>
      <button class="cta-btn" data-action="do-print">${icon("print", 17)} Print this document</button>
    </div>

    <article class="sheet">
      <header class="sheet-head">
        <div class="sheet-emblem">${emblemMark(list.emblem, list.emblemImage, 44)}</div>
        <div class="sheet-title-block">
          <h1 class="sheet-title">${escapeHtml(list.fleet.name || "Unnamed fleet")}</h1>
          <p class="sheet-subtitle">${subtitle}</p>
        </div>
        <div class="sheet-totals">
          <p class="sheet-total-line">${credits(total)} of ${credits(list.fleet.creditsLimit)}</p>
          <p class="sheet-date">${formatDate(list.updatedAt)}</p>
        </div>
      </header>

      ${
        faction
          ? `<section class="print-rule">
              <h3>Faction rule: ${escapeHtml(faction.rule.name)}</h3>
              <p>${escapeHtml(faction.rule.text)}</p>
              <p class="print-note">Initiative ${escapeHtml(faction.initiative)}. Command tokens each round: ${escapeHtml(faction.cmdTokens)}.</p>
            </section>`
          : ""
      }

      <h2 class="sheet-section">Units</h2>
      ${unitBlocks || '<p class="print-note">No units.</p>'}

      <h2 class="sheet-section">High-Value Personnel</h2>
      ${hvpBlocks || '<p class="print-note">None selected.</p>'}

      <h2 class="sheet-section">Score record</h2>
      <p class="print-note">Games of Armageddon, the Age of Unity, and Hypergrowth all end after the fourth round.</p>
      <table class="print-score">
        <thead><tr><th></th><th>Round One</th><th>Round Two</th><th>Round Three</th><th>Round Four</th><th>Final</th></tr></thead>
        <tbody>
          <tr><th>Victory points or revenue</th><td></td><td></td><td></td><td></td><td></td></tr>
          <tr><th>Command tokens spent</th><td></td><td></td><td></td><td></td><td></td></tr>
          <tr><th>Notes</th><td></td><td></td><td></td><td></td><td></td></tr>
        </tbody>
      </table>

      <footer class="sheet-foot">
        <p>A Billion Suns, Second Edition, is a game by Mike Hutchinson — this roster is an unofficial player aid and is not affiliated with the publisher.</p>
      </footer>
    </article>
  </div>`;
}

// ---------------------------------------------------------------------------
// Foundry (custom factions)
// ---------------------------------------------------------------------------

function foundryListView(state: AppState): string {
  const rows = state.customFactions
    .map(
      (f) => `
      <tr>
        <td class="cell-name"><a href="#/foundry/${f.id}">${escapeHtml(f.name)}</a></td>
        <td>${f.era}</td>
        <td class="cell-num">${f.ships.length} ship classes</td>
        <td class="cell-num">${f.hvp.length} personnel</td>
        <td class="cell-actions">
          <button class="ghost-btn" data-action="export-faction" data-id="${f.id}" title="Download as a file">${icon("download", 16)}</button>
          <button class="ghost-btn danger" data-action="delete-faction" data-id="${f.id}" title="Delete">${icon("trash", 16)}</button>
        </td>
      </tr>`,
    )
    .join("");

  return `
  ${topbar()}
  <main class="foundry-main">
    <h1 class="page-title">Faction Foundry</h1>
    <p class="panel-note">Design your own factions: a faction rule, ship classes with full weapon fits, and High-Value Personnel. They appear in every faction picker and ride along inside share links.</p>
    <div class="foundry-actions">
      <button class="cta-btn" data-action="new-faction">${icon("plus", 18)} Forge a new faction</button>
      <label class="bar-btn file-btn">${icon("upload", 16)} Import from a file
        <input type="file" accept="application/json" data-action="import-faction" hidden />
      </label>
    </div>
    ${
      state.customFactions.length === 0
        ? '<p class="muted">No custom factions yet.</p>'
        : `<div class="table-scroll"><table class="dock-table">
            <thead><tr><th>Faction</th><th>Era</th><th>Ships</th><th>Personnel</th><th></th></tr></thead>
            <tbody>${rows}</tbody>
          </table></div>`
    }
  </main>
  ${toast(state)}
  ${footer()}`;
}

function weaponEditor(shipIndex: number, slot: "primary" | "auxiliary", weapons: ShipClass["primary"]): string {
  const rows = weapons
    .map(
      (w, wi) => `
      <div class="weapon-edit-row">
        <input type="text" value="${escapeHtml(w.name)}" placeholder="Weapon name" data-action="cf-weapon" data-ship="${shipIndex}" data-slot="${slot}" data-index="${wi}" data-field="name" />
        <input type="number" min="1" value="${w.count}" title="Number of dice" data-action="cf-weapon" data-ship="${shipIndex}" data-slot="${slot}" data-index="${wi}" data-field="count" />
        <select title="Die type" data-action="cf-weapon" data-ship="${shipIndex}" data-slot="${slot}" data-index="${wi}" data-field="die">
          ${["D6", "D8", "D10", "D12"].map((d) => `<option ${w.die === d ? "selected" : ""}>${d}</option>`).join("")}
        </select>
        <input type="number" min="0" value="${w.rangeMin}" title="Minimum range in inches" data-action="cf-weapon" data-ship="${shipIndex}" data-slot="${slot}" data-index="${wi}" data-field="rangeMin" />
        <input type="number" min="0" value="${w.rangeMax}" title="Maximum range in inches" data-action="cf-weapon" data-ship="${shipIndex}" data-slot="${slot}" data-index="${wi}" data-field="rangeMax" />
        <button class="ghost-btn danger" data-action="cf-weapon-remove" data-ship="${shipIndex}" data-slot="${slot}" data-index="${wi}">${icon("close", 14)}</button>
      </div>`,
    )
    .join("");
  return `${rows}
    <button class="ghost-btn" data-action="cf-weapon-add" data-ship="${shipIndex}" data-slot="${slot}">${icon("plus", 14)} Add a ${slot} weapon</button>`;
}

function foundryEditView(state: AppState, factionId: string): string {
  const f = state.customFactions.find((x) => x.id === factionId);
  if (!f)
    return `${topbar()}<main class="empty-state"><p>That faction was not found.</p><p><a href="#/foundry">Back to the Foundry</a></p></main>`;

  const shipBlocks = f.ships
    .map(
      (s, si) => `
    <article class="cf-ship">
      <div class="cf-ship-grid">
        <label class="field-block wide">Ship class name
          <input type="text" value="${escapeHtml(s.name)}" data-action="cf-ship" data-ship="${si}" data-field="name" /></label>
        <label class="field-block">Mass
          <select data-action="cf-ship" data-ship="${si}" data-field="mass">
            ${[0, 1, 2, 3].map((m) => `<option value="${m}" ${s.mass === m ? "selected" : ""}>${m}</option>`).join("")}
          </select></label>
        <label class="field-block">Thrust in inches
          <input type="number" min="0" value="${s.thrust}" data-action="cf-ship" data-ship="${si}" data-field="thrust" /></label>
        <label class="field-block">Silhouette
          <input type="number" min="1" max="12" value="${s.silhouette}" data-action="cf-ship" data-ship="${si}" data-field="silhouette" /></label>
        <label class="field-block">Shields
          <input type="number" min="0" value="${s.shields}" data-action="cf-ship" data-ship="${si}" data-field="shields" /></label>
        <label class="field-block">Cost in billions
          <input type="number" min="1" value="${s.cost}" data-action="cf-ship" data-ship="${si}" data-field="cost" /></label>
      </div>
      <div class="cf-slots">
        <div class="cf-slot">
          <h5>Primary weapons <label class="check-inline"><input type="checkbox" ${s.primaryUtility ? "checked" : ""} data-action="cf-ship" data-ship="${si}" data-field="primaryUtility" /> Utility Bays instead</label></h5>
          ${s.primaryUtility ? "" : weaponEditor(si, "primary", s.primary)}
        </div>
        <div class="cf-slot">
          <h5>Auxiliary weapons <label class="check-inline"><input type="checkbox" ${s.auxiliaryUtility ? "checked" : ""} data-action="cf-ship" data-ship="${si}" data-field="auxiliaryUtility" /> Utility Bays instead</label></h5>
          ${s.auxiliaryUtility ? "" : weaponEditor(si, "auxiliary", s.auxiliary)}
        </div>
      </div>
      <button class="ghost-btn danger" data-action="cf-ship-remove" data-ship="${si}">${icon("trash", 14)} Remove this ship class</button>
    </article>`,
    )
    .join("");

  const hvpBlocks = f.hvp
    .map(
      (h, hi) => `
    <article class="cf-hvp">
      <input type="text" value="${escapeHtml(h.name)}" placeholder="Name or title" data-action="cf-hvp" data-index="${hi}" data-field="name" />
      <textarea rows="2" placeholder="Their special rule, written in full" data-action="cf-hvp" data-index="${hi}" data-field="rule">${escapeHtml(h.rule)}</textarea>
      <button class="ghost-btn danger" data-action="cf-hvp-remove" data-index="${hi}">${icon("close", 14)}</button>
    </article>`,
    )
    .join("");

  return `
  ${topbar()}
  <main class="foundry-main">
    <p class="breadcrumb"><a href="#/foundry">Faction Foundry</a> / ${escapeHtml(f.name)}</p>
    <h1 class="page-title">${escapeHtml(f.name)}</h1>

    <section class="cf-section">
      <h2 class="panel-title">Identity</h2>
      <div class="cf-grid">
        <label class="field-block wide">Faction name
          <input type="text" value="${escapeHtml(f.name)}" data-action="cf-field" data-field="name" /></label>
        <div class="field-block">Emblem image
          <div class="cf-emblem-row">
            <span class="cf-emblem-preview">${emblemMark("delta", f.emblemImage, 40)}</span>
            <label class="bar-btn file-btn">${icon("upload", 14)} Upload
              <input type="file" accept="image/*" data-action="cf-emblem-upload" hidden /></label>
            ${f.emblemImage ? `<button class="ghost-btn danger" data-action="cf-clear-emblem" title="Remove">${icon("close", 14)}</button>` : ""}
          </div>
        </div>
        <label class="field-block">Era
          <select data-action="cf-field" data-field="era">
            ${ERA_ORDER.map((e) => `<option ${f.era === e ? "selected" : ""}>${e}</option>`).join("")}
          </select></label>
        <label class="field-block">Initiative, for example 3D6
          <input type="text" value="${escapeHtml(f.initiative)}" data-action="cf-field" data-field="initiative" /></label>
        <label class="field-block">Command tokens each round
          <input type="text" value="${escapeHtml(f.cmdTokens)}" data-action="cf-field" data-field="cmdTokens" /></label>
        <label class="field-block wide">Faction rule name
          <input type="text" value="${escapeHtml(f.rule.name)}" data-action="cf-field" data-field="ruleName" /></label>
        <label class="field-block wide">Faction rule, written in full
          <textarea rows="3" data-action="cf-field" data-field="ruleText">${escapeHtml(f.rule.text)}</textarea></label>
      </div>
    </section>

    <section class="cf-section">
      <h2 class="panel-title">Ship classes</h2>
      ${shipBlocks || '<p class="muted">No ships yet.</p>'}
      <button class="cta-btn" data-action="cf-ship-add">${icon("plus", 16)} Add a ship class</button>
    </section>

    <section class="cf-section">
      <h2 class="panel-title">High-Value Personnel</h2>
      ${hvpBlocks || '<p class="muted">None yet.</p>'}
      <button class="cta-btn" data-action="cf-hvp-add">${icon("plus", 16)} Add a person</button>
    </section>
  </main>
  ${toast(state)}
  ${footer()}`;
}

// ---------------------------------------------------------------------------
// Changelog
// ---------------------------------------------------------------------------

function changelogView(): string {
  const entries = CHANGELOG.map(
    (e) => `
    <section class="log-entry">
      <header class="log-head">
        <h2 class="log-version">${e.version}</h2>
        <div>
          <h3 class="log-title">${escapeHtml(e.title)}</h3>
          <p class="log-date">${formatDate(e.date)}</p>
        </div>
      </header>
      <ul class="log-items">${e.items.map((i) => `<li>${escapeHtml(i)}</li>`).join("")}</ul>
    </section>`,
  ).join("");
  return `
  ${topbar()}
  <main class="changelog-main">
    <h1 class="page-title">Changelog</h1>
    ${entries}
  </main>
  ${footer()}`;
}

// ---------------------------------------------------------------------------
// Ship compendium (reference tool)
// ---------------------------------------------------------------------------

interface CompRow {
  name: string;
  factionName: string;
  factionKey: string;
  era: string;
  mass: number;
  thrust: number;
  silhouette: number;
  shields: number;
  primary: string;
  auxiliary: string;
  cost: number;
  costLabel: string;
}

function shipsView(state: AppState): string {
  const customs = state.customFactions;
  const f = state.ui.shipFilter ?? { era: "", faction: "", mass: "", q: "", sort: "faction" };

  const rows: CompRow[] = [];
  for (const fac of allFactions(customs)) {
    for (const s of fac.ships) {
      rows.push({
        name: s.name,
        factionName: fac.name,
        factionKey: fac.id,
        era: fac.era,
        mass: s.mass,
        thrust: s.thrust,
        silhouette: s.silhouette,
        shields: s.shields,
        primary: primarySlotText(s),
        auxiliary: s.auxiliaryFitting ? escapeHtml(s.auxiliaryFitting) : auxSlotText(s),
        cost: s.cost,
        costLabel: credits(s.cost),
      });
    }
  }
  for (const s of JUNKSPACE_SHIPS) {
    rows.push({
      name: s.name,
      factionName: "Junkspace (solo)",
      factionKey: "__junkspace__",
      era: "Junkspace",
      mass: s.mass,
      thrust: s.thrust,
      silhouette: s.silhouette,
      shields: s.shields,
      primary: primarySlotText(s),
      auxiliary: s.auxiliaryFitting ? escapeHtml(s.auxiliaryFitting) : auxSlotText(s),
      cost: s.cost,
      costLabel: `&cent;${s.cost}k`,
    });
  }

  const q = f.q.trim().toLowerCase();
  let shown = rows.filter(
    (r) =>
      (!f.era || r.era === f.era) &&
      (!f.faction || r.factionKey === f.faction) &&
      (!f.mass || String(r.mass) === f.mass) &&
      (!q || r.name.toLowerCase().includes(q) || r.factionName.toLowerCase().includes(q)),
  );
  const eraRank = (e: string) => ["Hypergrowth", "Age of Unity", "Armageddon", "Junkspace"].indexOf(e);
  shown = shown.sort((a, b) => {
    switch (f.sort) {
      case "cost":
        return b.cost - a.cost || a.name.localeCompare(b.name);
      case "mass":
        return a.mass - b.mass || a.name.localeCompare(b.name);
      case "silhouette":
        return b.silhouette - a.silhouette || a.name.localeCompare(b.name);
      case "thrust":
        return b.thrust - a.thrust || a.name.localeCompare(b.name);
      case "shields":
        return b.shields - a.shields || a.name.localeCompare(b.name);
      case "name":
        return a.name.localeCompare(b.name);
      default:
        return eraRank(a.era) - eraRank(b.era) || a.factionName.localeCompare(b.factionName) || a.mass - b.mass;
    }
  });

  const facOptions = [
    ...allFactions(customs).map((x) => `<option value="${x.id}" ${f.faction === x.id ? "selected" : ""}>${escapeHtml(x.name)}</option>`),
    `<option value="__junkspace__" ${f.faction === "__junkspace__" ? "selected" : ""}>Junkspace (solo)</option>`,
  ].join("");
  const eraOptions = ["Hypergrowth", "Age of Unity", "Armageddon", "Junkspace"]
    .map((e) => `<option value="${e}" ${f.era === e ? "selected" : ""}>${e}</option>`)
    .join("");
  const massOptions = [0, 1, 2, 3]
    .map((m) => `<option value="${m}" ${f.mass === String(m) ? "selected" : ""}>Mass ${m}</option>`)
    .join("");
  const sortOptions = [
    ["faction", "Era and faction"],
    ["name", "Name"],
    ["cost", "Cost (high to low)"],
    ["mass", "Mass (low to high)"],
    ["silhouette", "Silhouette (high to low)"],
    ["thrust", "Thrust (high to low)"],
    ["shields", "Shields (high to low)"],
  ]
    .map(([v, l]) => `<option value="${v}" ${f.sort === v ? "selected" : ""}>${l}</option>`)
    .join("");

  const statH = (name: string, label: string) => `<th class="comp-stat" title="${label}">${icon(name, 15, "stat-ico")}</th>`;
  const body = shown
    .map(
      (r) => `
      <tr>
        <td class="comp-name">${escapeHtml(r.name)}</td>
        <td>${escapeHtml(r.factionName)}</td>
        <td class="comp-era">${escapeHtml(r.era)}</td>
        <td class="comp-num">${r.mass}</td>
        <td class="comp-num">${r.thrust}"</td>
        <td class="comp-num">${r.silhouette}</td>
        <td class="comp-num">${r.shields}</td>
        <td class="comp-weap">${r.primary || '<span class="muted">None</span>'}</td>
        <td class="comp-weap">${r.auxiliary || '<span class="muted">None</span>'}</td>
        <td class="comp-num comp-cost">${r.costLabel}</td>
      </tr>`,
    )
    .join("");

  return `
  ${topbar()}
  <main class="compendium">
    <header class="comp-head">
      <div>
        <p class="hero-eyebrow">Reference</p>
        <h1 class="page-title">Ship Compendium</h1>
        <p class="panel-note">Every ship in the game, side by side. Filter by era, faction, or mass, search by name, and sort by any stat to compare.</p>
      </div>
    </header>

    <div class="comp-filters">
      <label class="control-group"><span class="control-label">Search</span>
        <input id="ship-search" class="limit-input comp-search" type="text" value="${escapeHtml(f.q)}" placeholder="Ship or faction" data-action="ship-search" /></label>
      <label class="control-group"><span class="control-label">Era</span>
        <select data-action="ship-filter" data-field="era"><option value="">All eras</option>${eraOptions}</select></label>
      <label class="control-group"><span class="control-label">Faction</span>
        <select data-action="ship-filter" data-field="faction"><option value="">All factions</option>${facOptions}</select></label>
      <label class="control-group"><span class="control-label">Mass</span>
        <select data-action="ship-filter" data-field="mass"><option value="">All masses</option>${massOptions}</select></label>
      <label class="control-group"><span class="control-label">Sort</span>
        <select data-action="ship-filter" data-field="sort">${sortOptions}</select></label>
      ${f.era || f.faction || f.mass || f.q ? '<button class="ghost-btn" data-action="ship-filter-clear">Clear filters</button>' : ""}
    </div>

    <p class="comp-count">${shown.length} of ${rows.length} ships</p>
    <div class="table-scroll comp-scroll">
      <table class="comp-table">
        <thead>
          <tr>
            <th>Ship</th><th>Faction</th><th>Era</th>
            ${statH("stat-mass", "Mass")}${statH("stat-thrust", "Thrust")}${statH("stat-silhouette", "Silhouette")}${statH("stat-shields", "Shields")}
            <th>Primary</th><th>Auxiliary</th><th>Cost</th>
          </tr>
        </thead>
        <tbody>${body || '<tr><td colspan="10" class="muted" style="padding:20px">No ships match these filters.</td></tr>'}</tbody>
      </table>
    </div>
  </main>
  ${toast(state)}
  ${footer()}`;
}

// ---------------------------------------------------------------------------
// Root
// ---------------------------------------------------------------------------

export function render(state: AppState): string {
  switch (state.route.view) {
    case "home":
      return homeView(state);
    case "builder":
      return builderView(state);
    case "print":
      return printView(state);
    case "foundry":
      return state.route.factionId ? foundryEditView(state, state.route.factionId) : foundryListView(state);
    case "solo":
      return `${topbar()}${soloListView(state)}${toast(state)}${footer()}`;
    case "solo-outfit":
      return `${topbar()}${soloOutfitView(state)}${toast(state)}${footer()}`;
    case "ships":
      return shipsView(state);
    case "changelog":
      return changelogView();
  }
}
