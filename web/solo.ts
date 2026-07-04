// Junkspace solo mode: outfit builder, live-game tracker, dice roller for the
// automated enemy, and the debt campaign. Renders from AppState like the rest
// of the app; actions.ts owns the event handling.

import { PILOT_CLASSES, type PilotClass, type ShipClass } from "../src/types.ts";
import {
  JUNKSPACE_SHIPS,
  PILOT_PERKS,
  OUTFIT_BUDGET_K,
  OUTFIT_MAX_SHIPS,
  STARTING_DEBT_K,
  DEBT_CLEAR_GAMES,
} from "../src/data/junkspace.ts";
import {
  JUNKSPACE_JOBS,
  JUNKSPACE_PIRATES,
  PIRATE_RULE,
  RANDOM_BEHAVIOUR,
  GLITCH_BLIP,
  BEHAVIOUR_ROUTINES,
  SOLO_PHASES,
  SOLO_SETUP_STEPS,
  SOLO_ALERT_RULES,
  SOLO_BLIP_RULES,
  PERKS_BY_CLASS,
} from "../src/data/junkspace-solo.ts";
import { auxSlotText, escapeHtml, formatDate, primarySlotText } from "./format.ts";
import { emblem, emblemMark, icon, massGlyph, statChips } from "./icons.ts";
import type { AppState, SoloTab } from "./state.ts";
import { activeOutfit } from "./state.ts";
import type { SavedOutfit } from "./storage.ts";

const ck = (n: number): string => `¢${n}k`;

const shipById = new Map<string, ShipClass>(JUNKSPACE_SHIPS.map((s) => [s.id, s]));

export function outfitCost(o: SavedOutfit): number {
  return o.ships.reduce((sum, s) => sum + (shipById.get(s.shipClassId)?.cost ?? 0), 0);
}

// ---------------------------------------------------------------------------
// Solo list (dock of saved outfits + the pitch)
// ---------------------------------------------------------------------------

export function soloListView(state: AppState): string {
  const outfits = [...state.outfits].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const rows = outfits
    .map((o) => {
      const cleared = o.debtK <= 0;
      return `
      <tr>
        <td class="cell-emblem"><span class="emblem-chip">${emblemMark(o.emblem, o.emblemImage, 22)}</span></td>
        <td class="cell-name"><a href="#/solo/${o.id}">${escapeHtml(o.name || "Unnamed outfit")}</a></td>
        <td>${o.ships.length} ${o.ships.length === 1 ? "ship" : "ships"}</td>
        <td class="cell-num">${cleared ? "Debt cleared" : ck(o.debtK) + " debt"}</td>
        <td class="cell-num">Game ${o.gamesPlayed} of ${DEBT_CLEAR_GAMES}</td>
        <td class="cell-date">${formatDate(o.updatedAt)}</td>
        <td class="cell-actions">
          <button class="ghost-btn" data-action="duplicate-outfit" data-id="${o.id}" title="Duplicate">${icon("duplicate", 16)}</button>
          <button class="ghost-btn danger" data-action="delete-outfit" data-id="${o.id}" title="Delete">${icon("trash", 16)}</button>
        </td>
      </tr>`;
    })
    .join("");

  return `
  <section class="solo-hero">
    <div class="hero-inner">
      <p class="hero-eyebrow">Solo Play</p>
      <h1 class="hero-title">Junkspace</h1>
      <p class="hero-sub">The Unhuman War has shattered the galaxy. In the ruins of the Jura system you lead a rag-tag outfit of scavengers, in debt to a dangerous local gangster, flying Jobs against an automated enemy to clear what you owe. A full solo game: build your outfit, run the roller for the Hostiles, and track the campaign.</p>
    </div>
  </section>
  <main class="home-main solo-main">
    <section class="commission-panel">
      <h2 class="panel-title">Your outfits</h2>
      <p class="panel-note">Each outfit starts ${ck(STARTING_DEBT_K)} in debt. Clear it within ${DEBT_CLEAR_GAMES} games to win.</p>
      <button class="cta-btn" data-action="new-outfit">${icon("plus", 18)} Start a new outfit</button>
      ${
        outfits.length === 0
          ? '<p class="muted" style="margin-top:18px">No outfits yet. Start one above.</p>'
          : `<div class="table-scroll" style="margin-top:18px"><table class="dock-table">
              <thead><tr><th></th><th>Outfit</th><th>Ships</th><th>Debt</th><th>Progress</th><th>Updated</th><th></th></tr></thead>
              <tbody>${rows}</tbody></table></div>`
      }
    </section>
    <section class="fleet-dock">
      <h2 class="panel-title">How solo works</h2>
      <ol class="solo-primer">
        <li><strong>Build your outfit.</strong> Up to ${OUTFIT_MAX_SHIPS} ships within ${ck(OUTFIT_BUDGET_K)}, each with a pilot class.</li>
        <li><strong>Set up the board.</strong> A 3' by 3' table, Entry and Exit Jump Points, 8 face-down Blip markers, and three Jobs dealt from one suit.</li>
        <li><strong>Play the round.</strong> Command, Jump, Tactical, End. You run both sides: the roller decides what the Hostiles do.</li>
        <li><strong>Pay your debts.</strong> Earnings from Jobs reduce your debt; surviving pilots earn Perks.</li>
      </ol>
    </section>
  </main>`;
}

// ---------------------------------------------------------------------------
// Outfit workspace (tabbed)
// ---------------------------------------------------------------------------

function tabBar(o: SavedOutfit, tab: SoloTab): string {
  const t = (id: SoloTab, label: string) =>
    `<button class="solo-tab ${tab === id ? "selected" : ""}" data-action="solo-tab" data-tab="${id}">${label}</button>`;
  return `<nav class="solo-tabs">${t("outfit", "Outfit")}${t("play", "Play & Roller")}${t("campaign", "Campaign")}${t("reference", "Reference")}</nav>`;
}

function soloShipCatalog(): string {
  return JUNKSPACE_SHIPS.map(
    (s) => `
    <article class="ship-row">
      <div class="ship-row-glyph">${massGlyph(s.mass, 26)}</div>
      <div class="ship-row-body">
        <div class="ship-row-head">
          <h4 class="ship-name">${escapeHtml(s.name)}</h4>
          <span class="ship-cost">${ck(s.cost)}</span>
        </div>
        <p class="ship-stats">${statChips(s)}</p>
        <p class="ship-weapons"><span class="slot-label">Primary</span> ${primarySlotText(s)}</p>
        <p class="ship-weapons"><span class="slot-label">Auxiliary</span> ${s.auxiliaryFitting ? escapeHtml(s.auxiliaryFitting) : auxSlotText(s)}</p>
      </div>
      <button class="add-btn" data-action="outfit-add-ship" data-ship="${s.id}" title="Add ${escapeHtml(s.name)}">${icon("plus", 18)}<span>Add</span></button>
    </article>`,
  ).join("");
}

function outfitTab(o: SavedOutfit): string {
  const cost = outfitCost(o);
  const remaining = OUTFIT_BUDGET_K - cost;
  const full = o.ships.length >= OUTFIT_MAX_SHIPS;
  const over = remaining < 0;

  const shipRows = o.ships
    .map((s) => {
      const def = shipById.get(s.shipClassId);
      const pilotOpts = PILOT_CLASSES.map(
        (p) => `<option value="${p}" ${s.pilotClass === p ? "selected" : ""}>${p}</option>`,
      ).join("");
      return `
      <article class="roster-unit">
        <div class="roster-unit-head">
          <span class="roster-unit-glyph">${def ? massGlyph(def.mass, 22) : icon("warning", 20)}</span>
          <input class="unit-name-input" type="text" value="${escapeHtml(s.shipName ?? "")}" placeholder="${escapeHtml(def?.name ?? "Ship")}" data-action="outfit-ship-name" data-ship="${s.id}" />
          <span class="roster-unit-cost">${ck(def?.cost ?? 0)}</span>
        </div>
        <div class="roster-unit-tools">
          <label class="inline-field">Pilot class
            <select data-action="outfit-pilot-class" data-ship="${s.id}">${pilotOpts}</select>
          </label>
          <label class="inline-field">Pilot name
            <input class="ship-name-input" type="text" value="${escapeHtml(s.pilotName ?? "")}" placeholder="Call sign" data-action="outfit-pilot-name" data-ship="${s.id}" />
          </label>
          <button class="ghost-btn danger" data-action="outfit-remove-ship" data-ship="${s.id}">${icon("trash", 14)} Remove</button>
        </div>
      </article>`;
    })
    .join("");

  const perkRef = PILOT_PERKS.map(
    (p) => `<li><strong>${escapeHtml(p.class)}, ${escapeHtml(p.perkName)}:</strong> ${escapeHtml(p.text)}</li>`,
  ).join("");

  return `
  <main class="workspace">
    <section class="catalog">
      <h3 class="catalog-title">Stock ship classes <span class="muted">costs in thousands of Juran credits</span></h3>
      <div class="catalog-list">${soloShipCatalog()}</div>
      <article class="rule-card" style="margin-top:26px">
        <h3 class="rule-card-title">Starting pilot perks</h3>
        <ul class="rule-list">${perkRef}</ul>
      </article>
    </section>
    <aside class="roster">
      <div class="roster-sheet">
        <header class="roster-head">
          <span class="roster-emblem">${emblemMark(o.emblem, o.emblemImage, 34)}</span>
          <div>
            <h2 class="roster-title">${escapeHtml(o.name || "Unnamed outfit")}</h2>
            <p class="roster-subtitle">Junkspace outfit</p>
          </div>
        </header>
        <div class="band-readout solo-readout ${over ? "over" : ""}">
          <div class="readout"><span class="readout-label">Budget</span><span class="readout-value">${ck(OUTFIT_BUDGET_K)}</span></div>
          <div class="readout"><span class="readout-label">Spent</span><span class="readout-value">${ck(cost)}</span></div>
          <div class="readout"><span class="readout-label">Left</span><span class="readout-value ${over ? "negative" : ""}">${over ? "−" : ""}${ck(Math.abs(remaining))}</span></div>
          <div class="readout"><span class="readout-label">Ships</span><span class="readout-value">${o.ships.length}/${OUTFIT_MAX_SHIPS}</span></div>
        </div>
        <h3 class="roster-section">Ships ${full ? '<span class="muted">outfit full</span>' : ""}</h3>
        ${shipRows || '<p class="muted roster-hint">Add up to five ships from the left. In Junkspace every unit is a single ship, and each needs a pilot class.</p>'}
        ${over ? '<div class="inspection fail"><p class="issue-error">Over budget by ' + ck(-remaining) + ".</p></div>" : ""}
        <div class="roster-actions">
          <button class="bar-btn danger" data-action="delete-outfit" data-id="${o.id}">${icon("trash", 16)} Delete outfit</button>
        </div>
      </div>
    </aside>
  </main>`;
}

// --- Play tab ---------------------------------------------------------------

function rollerPanel(state: AppState): string {
  const last = state.ui.lastRoll;
  const btn = (table: string, label: string) =>
    `<button class="bar-btn" data-action="solo-roll" data-table="${table}">${label}</button>`;
  return `
  <section class="solo-card">
    <h3 class="roster-section">The roller</h3>
    <p class="panel-note">Roll for the automated enemy and setup. Each roll shows the exact rule.</p>
    <div class="roller-buttons">
      ${btn("behaviour", "Hostile behaviour (D6)")}
      ${btn("glitch", "Glitch a Blip (D6)")}
      ${btn("initiative", "Initiative die (D6)")}
      ${btn("scatter", "Setup scatter (D10)")}
      ${btn("perk", "Perk (D12)")}
    </div>
    ${
      last
        ? `<div class="roll-result">
            <div class="roll-die">${last.value}</div>
            <div class="roll-body">
              <p class="roll-table">${escapeHtml(last.table)}</p>
              <p class="roll-headline">${escapeHtml(last.result)}</p>
              ${last.detail ? `<p class="roll-detail">${escapeHtml(last.detail)}</p>` : ""}
            </div>
          </div>`
        : '<p class="muted" style="margin-top:14px">No roll yet.</p>'
    }
  </section>`;
}

function playTab(state: AppState, o: SavedOutfit): string {
  const alert = o.alertLevel;
  const pct = Math.min(100, (alert / 10) * 100);
  const phases = SOLO_PHASES.map((p) => `<li><strong>${escapeHtml(p.name)}.</strong> ${escapeHtml(p.text)}</li>`).join("");
  return `
  <div class="solo-grid">
    <section class="solo-card">
      <h3 class="roster-section">Alert Level <span class="muted">ends the game at 10</span></h3>
      <div class="alert-track ${alert >= 8 ? "high" : ""}">
        <div class="alert-fill" style="width:${pct}%"></div>
        <span class="alert-value">${alert}</span>
      </div>
      <div class="alert-controls">
        <button class="bar-btn" data-action="alert-adjust" data-delta="1">+1 End Phase</button>
        <button class="bar-btn" data-action="alert-adjust" data-delta="1">+1 reveal Mass 2-3</button>
        <button class="bar-btn" data-action="alert-adjust" data-delta="-2">-2 destroy Mass 2-3</button>
        <button class="ghost-btn" data-action="alert-adjust" data-delta="1">+1</button>
        <button class="ghost-btn" data-action="alert-adjust" data-delta="-1">-1</button>
      </div>
      <ul class="rule-list small">${SOLO_ALERT_RULES.map((r) => `<li>${escapeHtml(r)}</li>`).join("")}</ul>
    </section>
    <section class="solo-card">
      <h3 class="roster-section">Round</h3>
      <div class="round-control">
        <button class="stepper-btn" data-action="round-adjust" data-delta="-1">${icon("minus", 16)}</button>
        <span class="round-value">${o.round}</span>
        <button class="stepper-btn" data-action="round-adjust" data-delta="1">${icon("plus", 16)}</button>
      </div>
      <ul class="rule-list small">${phases}</ul>
    </section>
    ${rollerPanel(state)}
  </div>`;
}

// --- Campaign tab -----------------------------------------------------------

function campaignTab(o: SavedOutfit): string {
  const cleared = o.debtK <= 0;
  const paid = STARTING_DEBT_K - Math.max(0, o.debtK);
  const pct = Math.min(100, (paid / STARTING_DEBT_K) * 100);
  const outOfGames = o.gamesPlayed >= DEBT_CLEAR_GAMES && !cleared;

  const log = o.gameLog
    .map((g) => `<tr><td>Game ${g.game}</td><td class="cell-num">${ck(g.earnedK)}</td><td>${escapeHtml(g.note ?? "")}</td></tr>`)
    .join("");

  const perkList = o.perks
    .map((p, i) => {
      const ship = o.ships.find((s) => s.id === p.shipId);
      const who = ship ? ship.pilotName || ship.shipName || "A pilot" : "A pilot";
      return `<li>${escapeHtml(who)}: ${escapeHtml(p.perk)} <button class="ghost-btn danger" data-action="remove-perk" data-index="${i}" title="Remove">${icon("close", 12)}</button></li>`;
    })
    .join("");

  const perkAssign = o.ships
    .map((s) => {
      const list = PERKS_BY_CLASS[s.pilotClass];
      const opts = list.map((p) => `<option value="${escapeHtml(p.name)}">${p.n}. ${escapeHtml(p.name)}</option>`).join("");
      const who = s.pilotName || s.shipName || `${s.pilotClass} pilot`;
      return `<label class="inline-field">${escapeHtml(who)} (${s.pilotClass})
        <select data-action="assign-perk" data-ship="${s.id}"><option value="">Grant a perk...</option>${opts}</select>
      </label>`;
    })
    .join("");

  return `
  <div class="solo-grid">
    <section class="solo-card debt-card ${cleared ? "won" : ""}">
      <h3 class="roster-section">Debt</h3>
      <p class="debt-figure">${cleared ? "Cleared" : ck(o.debtK)}</p>
      <div class="alert-track"><div class="alert-fill go" style="width:${pct}%"></div></div>
      <p class="panel-note">${paid} of ${STARTING_DEBT_K} paid down. Game ${o.gamesPlayed} of ${DEBT_CLEAR_GAMES}.</p>
      ${cleared ? '<p class="inspection-pass">You have cleared your debt. Campaign won.</p>' : ""}
      ${outOfGames ? '<p class="issue-error">Eight games are up with debt remaining. Some very unpleasant people pay a visit: the campaign is lost.</p>' : ""}
      <div class="roster-actions">
        <button class="cta-btn" data-action="log-game">${icon("plus", 16)} Log a completed game</button>
      </div>
    </section>
    <section class="solo-card">
      <h3 class="roster-section">Game log</h3>
      ${log ? `<table class="dock-table"><thead><tr><th></th><th>Earned</th><th>Notes</th></tr></thead><tbody>${log}</tbody></table>` : '<p class="muted">No games logged yet.</p>'}
    </section>
    <section class="solo-card">
      <h3 class="roster-section">Pilot perks</h3>
      <p class="panel-note">For each ¢1k earned in a game, a surviving pilot may take a Perk from their class list (no duplicates). Roll a D12 in the roller, or grant one directly.</p>
      ${o.ships.length ? `<div class="perk-assign">${perkAssign}</div>` : '<p class="muted">Add ships to your outfit first.</p>'}
      ${perkList ? `<ul class="perk-list">${perkList}</ul>` : ""}
    </section>
  </div>`;
}

// --- Reference tab ----------------------------------------------------------

function referenceTab(): string {
  const steps = SOLO_SETUP_STEPS.map((s) => `<li><strong>${escapeHtml(s.name)}.</strong> ${escapeHtml(s.text)}</li>`).join("");
  const phases = SOLO_PHASES.map((p) => `<li><strong>${escapeHtml(p.name)}.</strong> ${escapeHtml(p.text)}</li>`).join("");
  const blips = SOLO_BLIP_RULES.map((r) => `<li>${escapeHtml(r)}</li>`).join("");
  const behaviour = BEHAVIOUR_ROUTINES.map((r) => `<li>${escapeHtml(r)}</li>`).join("");
  const rollRows = (rows: typeof RANDOM_BEHAVIOUR) =>
    rows.map((r) => `<tr><td class="cell-num">${r.roll}</td><td>${escapeHtml(r.result)}${r.detail ? `<br><span class="muted">${escapeHtml(r.detail)}</span>` : ""}</td></tr>`).join("");
  const jobs = JUNKSPACE_JOBS.map(
    (j) => `<article class="ref-item"><h4>${j.key}. ${escapeHtml(j.name)}</h4><p>${escapeHtml(j.text)}</p></article>`,
  ).join("");
  const pirates = JUNKSPACE_PIRATES.map(
    (p) => `<tr><td class="cell-num">${p.blip}</td><td>${escapeHtml(p.name)}</td><td>${p.mass}</td><td>${p.thrust}"</td><td>${p.silhouette}</td><td>${p.shields}</td><td>${escapeHtml(p.primary)}</td><td>${escapeHtml(p.auxiliary)}</td></tr>`,
  ).join("");
  const perkBlock = (name: string, list: readonly { n: number; name: string; text: string }[]) =>
    `<h4 class="ref-sub">${name}</h4><ul class="rule-list small">${list.map((p) => `<li><strong>${p.n}. ${escapeHtml(p.name)}:</strong> ${escapeHtml(p.text)}</li>`).join("")}</ul>`;

  return `
  <div class="reference">
    <section class="ref-section">
      <h3 class="sheet-section">Getting set up</h3>
      <ul class="rule-list">${steps}</ul>
    </section>
    <section class="ref-section">
      <h3 class="sheet-section">The round</h3>
      <ul class="rule-list">${phases}</ul>
    </section>
    <section class="ref-section">
      <h3 class="sheet-section">Alert Level</h3>
      <ul class="rule-list">${SOLO_ALERT_RULES.map((r) => `<li>${escapeHtml(r)}</li>`).join("")}</ul>
    </section>
    <section class="ref-section">
      <h3 class="sheet-section">Blips</h3>
      <ul class="rule-list">${blips}</ul>
      <div class="ref-tables">
        <div><h4 class="ref-sub">Random behaviour (D6)</h4><table class="ref-table"><tbody>${rollRows(RANDOM_BEHAVIOUR)}</tbody></table></div>
        <div><h4 class="ref-sub">Glitch a Blip (D6)</h4><table class="ref-table"><tbody>${rollRows(GLITCH_BLIP)}</tbody></table></div>
      </div>
    </section>
    <section class="ref-section">
      <h3 class="sheet-section">Hostile behaviour routines</h3>
      <ul class="rule-list">${behaviour}</ul>
    </section>
    <section class="ref-section">
      <h3 class="sheet-section">Aggressors</h3>
      <div class="table-scroll"><table class="ref-table pirates"><thead><tr><th>Blip</th><th>Class</th><th>Mass</th><th>Thrust</th><th>Sil</th><th>Shields</th><th>Primary</th><th>Auxiliary</th></tr></thead><tbody>${pirates}</tbody></table></div>
      <p class="print-note">${escapeHtml(PIRATE_RULE)}</p>
    </section>
    <section class="ref-section">
      <h3 class="sheet-section">The Jobs</h3>
      <div class="ref-jobs">${jobs}</div>
    </section>
    <section class="ref-section">
      <h3 class="sheet-section">Pilot perks</h3>
      ${perkBlock("Gunner", PERKS_BY_CLASS.Gunner)}
      ${perkBlock("Hauler", PERKS_BY_CLASS.Hauler)}
      ${perkBlock("Junker", PERKS_BY_CLASS.Junker)}
    </section>
  </div>`;
}

export function soloOutfitView(state: AppState): string {
  const o = activeOutfit(state);
  if (!o) return `<main class="empty-state"><p>That outfit was not found.</p><p><a href="#/solo">Back to Junkspace</a></p></main>`;
  const tab: SoloTab = state.ui.soloTab ?? "outfit";

  let body = "";
  if (tab === "outfit") body = outfitTab(o);
  else if (tab === "play") body = `<main class="solo-body">${playTab(state, o)}</main>`;
  else if (tab === "campaign") body = `<main class="solo-body">${campaignTab(o)}</main>`;
  else body = `<main class="solo-body">${referenceTab()}</main>`;

  return `
  <section class="setup-band">
    <div class="setup-head">
      <div class="setup-identity">
        <p class="band-eyebrow"><a href="#/solo">Junkspace</a></p>
        <input class="fleet-name-input" type="text" value="${escapeHtml(o.name ?? "")}" placeholder="Name this outfit" data-action="outfit-name" />
      </div>
      <div class="control-group control-group-emblem">
        <span class="control-label">Emblem</span>
        <div class="emblem-picker">${outfitEmblemPicker(o)}</div>
      </div>
    </div>
  </section>
  ${tabBar(o, tab)}
  ${body}`;
}

function outfitEmblemPicker(o: SavedOutfit): string {
  return `
    <label class="emblem-choice emblem-upload ${o.emblemImage ? "selected" : ""}" title="Upload your own image">
      ${o.emblemImage ? emblemMark(o.emblem, o.emblemImage, 24) : icon("upload", 18)}
      <input type="file" accept="image/*" data-action="outfit-emblem-upload" hidden />
    </label>
    ${o.emblemImage ? `<button class="emblem-choice" data-action="outfit-clear-emblem" title="Remove image">${icon("close", 16)}</button>` : ""}`;
}
