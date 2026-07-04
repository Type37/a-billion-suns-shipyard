import type { Era, Faction, FleetUnit, GameMode, Hvp, ShipClass } from "../src/types.ts";
import { ALLIANCE_SPECIES } from "../src/types.ts";
import { validateFleet, type ValidationIssue } from "../src/validation.ts";
import { GENERIC_HVP } from "../src/data/index.ts";
import { JUNKSPACE_SHIPS } from "../src/data/junkspace.ts";
import { allFactions, factionsByEra, findFaction, makeCatalog, ERA_ORDER } from "./catalog.ts";
import { auxSlotText, credits, escapeHtml, formatDate, primarySlotText } from "./format.ts";
import { emblem, emblemMark, EMBLEM_IDS, icon, massGlyph, statChips } from "./icons.ts";
import { iconLibraryControls, libraryUrl } from "./emblems.ts";
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
// Basic Training guided tutorials (rules p.62-68), shown above the builder
// for the two training modes and inside Play Mode.
// ---------------------------------------------------------------------------

interface GuideStep {
  title: string;
  text: string;
}

const TRAINING_GUIDES: Partial<Record<GameMode, { intro: string; steps: GuideStep[] }>> = {
  "combat-simulator": {
    intro:
      "Your first game of A Billion Suns. It plays like Armageddon and teaches the basics of activating your fleet: moving and attacking. Your Training Fleet is already loaded on the right; every entry is a single unit.",
    steps: [
      {
        title: "Set up the table",
        text: 'Clear a play area roughly 4 feet by 3 feet. Pick or roll a D6 for a Central Objective and place it in the middle of the board: 1-2 a ComSat, 3-4 a Facility, 5-6 a Planetoid. Each player deploys 3 Jump Points: the flank points 24" apart and 15" in from each short edge, the central point 5" from your own edge.',
      },
      {
        title: "Place your High-Value Personnel",
        text: "Gather three HVP tokens that are distinguishable as yours and place them on friendly ships of Mass 1 or higher. All three of your HVP are Seasoned Captains: units in their battlegroup can use the Red Alert command for 0 CMD, once per Round.",
      },
      {
        title: "Load your squadrons",
        text: "When you deploy your Heavy Cruiser or Frigate, you can load units of Fighters and Bombers into them, or deploy those units directly. A unit can carry Squadrons up to twice its Combined Mass: the Heavy Cruiser carries up to six wings, the Frigate four, and a unit of three Corvettes up to six.",
      },
      {
        title: "Play four rounds",
        text: "Your Initiative Value is 3D6. Rapid Ingress applies: all units Jump In during the Round 1 Jump Phase. Each round runs Command, Jump, Tactical, End.",
      },
      {
        title: "Score in each End Phase",
        text: "Gain 2VP for each enemy flank Jump Point you are blockading, 5VP if you are blockading the enemy's central Jump Point, and 3VP if you are blockading the central objective. Blockading means having the greatest Combined Mass of friendly ships within 6\" of it.",
      },
      {
        title: "Game end",
        text: "At the end of the game, gain 2VP for each enemy HVP token you are carrying. The game ends at the end of Round 4 and the player with the most VP is the winner.",
      },
    ],
  },
  "management-training": {
    intro:
      "Your second game, once you have played the Combat Simulator. It plays like Hypergrowth and teaches resource management: requisitioning and jumping in ships as and where you need them, across two Sectors. Your Training Fleet starts in your Shipyard, not in play.",
    steps: [
      {
        title: "Set up two Sectors",
        text: "Divide your play area into two roughly equal sections, or use two different surfaces, to represent two separate Sectors of space. You cannot fly ships between them; you have to Jump Hop.",
      },
      {
        title: "Deploy ComSats and gather Jump Points",
        text: "Deploy 3 ComSats: the first anywhere on the first Sector and the other two anywhere on the other Sector. Each player starts with 3 Jump Points in their supply. Then begin Round 1.",
      },
      {
        title: "Requisition units from your Shipyard",
        text: "You start with no units in play, nothing in Reserve, and 0 credits. In the Jump Phase, spend 1 CMD to use the Requisition command: form a new unit from any ships in your Shipyard, of any size you like, pay their cost in credits (going into debt at first), and jump them into play. Your Heavy Cruiser can carry two units of Mass 0 ships when requisitioned; the Frigate one.",
      },
      {
        title: "Reinforcements",
        text: "When a ship is destroyed it returns to your Shipyard and can be requisitioned again as a reinforcement. If you are prepared to keep paying, you can keep deploying: just watch your balance sheet.",
      },
      {
        title: "Earn credits in each End Phase",
        text: "Secure Sectors: gain ¢20bn for each Sector you control (most ships there; ties go to the greatest Combined Mass). Infowar: gain ¢20bn for each ComSat you are Blockading. There is a maximum of ¢100bn available to earn each round.",
      },
      {
        title: "Game end",
        text: "Your Initiative Value is 3D6. At the end of the third game round, the game ends and the player with the most credits is the winner.",
      },
    ],
  },
};

function trainingGuide(mode: GameMode): string {
  const g = TRAINING_GUIDES[mode];
  if (!g) return "";
  const steps = g.steps
    .map(
      (s, i) => `
      <details class="guide-step" ${i === 0 ? "open" : ""}>
        <summary><span class="guide-step-n">${i + 1}</span>${escapeHtml(s.title)}</summary>
        <p>${escapeHtml(s.text)}</p>
      </details>`,
    )
    .join("");
  return `
  <section class="guide-band">
    <div class="guide-inner">
      <h3 class="guide-title">${icon("book", 16)} Guided tutorial</h3>
      <p class="guide-intro">${escapeHtml(g.intro)}</p>
      ${steps}
    </div>
  </section>`;
}

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
      <a href="#/fleets">${icon("flag", 16)} Fleets</a>
      <a href="#/ships">${icon("compare", 16)} Compendium</a>
      <a href="#/solo">${icon("book", 16)} Solo</a>
      <a href="#/foundry">${icon("wrench", 16)} Custom Rules</a>
    </nav>
  </header>`;
}

function footer(): string {
  // A colophon, not a link bar: a bold dark imprint block with the wordmark and
  // labelled columns, in the manual/back-matter idiom.
  const v = CHANGELOG[0]?.version ?? "";
  return `
  <footer class="colophon">
    <div class="colophon-inner">
      <div class="colophon-mark">
        <span class="colophon-word">Shipyard</span>
        <span class="colophon-tag">A Billion Suns / Second Edition</span>
      </div>
      <dl class="colophon-cols">
        <div class="col">
          <dt>Game</dt>
          <dd>By <a href="https://planetsmashergames.com/a-billion-suns/" target="_blank" rel="noopener">Mike Hutchinson</a>, published by Osprey Games</dd>
        </div>
        <div class="col">
          <dt>Built by</dt>
          <dd><a href="https://linktr.ee/warlore" target="_blank" rel="noopener">WarLore</a></dd>
        </div>
        <div class="col">
          <dt>Contact</dt>
          <dd><a href="mailto:warlore1@outlook.com">Feedback</a>, <a href="https://github.com/Type37/abs-v2-fleet-builder" target="_blank" rel="noopener">Source</a>, <a href="#/changelog">v${escapeHtml(v)}</a></dd>
        </div>
      </dl>
      <p class="colophon-fine">An unofficial player aid. Not affiliated with the publisher.</p>
    </div>
  </footer>`;
}

function toast(state: AppState): string {
  return state.ui.toast ? `<div class="toast" role="status">${escapeHtml(state.ui.toast)}</div>` : "";
}


// A first-run nudge toward the tutorials, shown only on the first two visits
// (or until dismissed / a tutorial is taken). Stored in localStorage.
function tutorialCallout(state: AppState): string {
  const o = state.onboarding;
  if (o.tutorialsDismissed || o.visits > 2) return "";
  return `
  <aside class="onboard">
    <div class="onboard-main">
      <p class="onboard-title">New to A Billion Suns?</p>
      <p class="onboard-note">Basic Training loads a ready-made fleet and walks you through a game, step by step. Learn by playing.</p>
      <div class="onboard-actions">
        <button class="bar-btn" data-action="new-training" data-mode="combat-simulator">${icon("book", 14)} Combat Simulator</button>
        <button class="bar-btn" data-action="new-training" data-mode="management-training">${icon("book", 14)} Management Training</button>
      </div>
    </div>
    <button class="onboard-close" data-action="dismiss-tutorials" aria-label="Dismiss">${icon("close", 16)}</button>
  </aside>`;
}

// ---------------------------------------------------------------------------
// Home hub: decide what you want to do (Dropfleet-builder mental model)
// ---------------------------------------------------------------------------

function homeView(state: AppState): string {
  const row = (n: string, href: string, name: string, desc: string) => `
    <a class="index-row" href="${href}">
      <span class="index-num">${n}</span>
      <span class="index-main">
        <span class="index-name">${name}</span>
        <span class="index-desc">${desc}</span>
      </span>
      <span class="index-go">${icon("chevronRight", 20)}</span>
    </a>`;
  return `
  ${topbar()}
  <header class="nameplate">
    <div class="nameplate-inner">
      <h1 class="wordmark-hero">
        <span class="wm-edition">Second Edition</span>
        <span class="wm-lockup"><svg class="wm-delta" viewBox="0 0 100 100" aria-hidden="true"><path d="M50 6 L95 94 L5 94 Z" fill="none" stroke="currentColor" stroke-width="9"/><path d="M27 68 H73" stroke="currentColor" stroke-width="9"/></svg><span class="wm-billion">Billion</span><span class="wm-suns">Suns</span></span>
        <span class="wm-tag">Interstellar Fleet Battles</span>
        <span class="wm-sub">Fleet builder and ship reference</span>
      </h1>
    </div>
  </header>
  <main class="index-wrap">
    ${tutorialCallout(state)}
    <nav class="index">
      ${row("01", "#/fleets", "Fleets", "Build, save, print, and share army lists for any faction and era.")}
      ${row("02", "#/solo", "Solo Play", "Junkspace: build an outfit, roll for the enemy, run the debt campaign.")}
      ${row("03", "#/ships", "Ship Compendium", "Every ship in the game in one filterable, sortable table.")}
      ${row("04", "#/fleets", "How to Play", "The two Basic Training tutorials, with the Training Fleet pre-loaded.")}
      ${row("05", "#/foundry", "Custom Rules", "Design your own factions, ship classes, and personnel.")}
      ${row("06", "#/changelog", "Changelog", "What has changed, version by version.")}
    </nav>
  </main>
  ${toast(state)}
  ${footer()}`;
}

// ---------------------------------------------------------------------------
// Fleets: your saved lists, and a prominent Create-army flow
// ---------------------------------------------------------------------------

function fleetsView(state: AppState): string {
  const lists = [...state.lists].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  const rows = lists
    .map((l) => {
      const faction = findFaction(l.fleet.factionId, state.customFactions);
      const { total } = listTotals(l, state.customFactions);
      return `
      <tr>
        <td class="cell-emblem"><span class="emblem-chip">${emblemMark(l.emblem, l.emblemImage ?? libraryUrl(l.emblemLib), 22)}</span></td>
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
  <main class="fleets-main">
    <div class="fleets-head">
      <h1 class="page-title">Fleets</h1>
      <button class="cta-btn create-cta" data-action="open-new-fleet">${icon("plus", 18)} Create army</button>
    </div>

    ${
      lists.length === 0
        ? '<p class="muted" style="margin-top:20px">No lists yet. Use Create army to begin; lists are stored in this browser.</p>'
        : `<div class="table-scroll" style="margin-top:22px"><table class="dock-table">
            <thead><tr><th></th><th>Fleet</th><th>Faction</th><th>Mode</th><th>Cost</th><th>Updated</th><th></th></tr></thead>
            <tbody>${rows}</tbody>
          </table></div>`
    }
  </main>
  ${newFleetModal(state, state.customFactions)}
  ${toast(state)}
  ${footer()}`;
}

// The New Fleet modal (after the Dropfleet builder): pick era, then credits
// limit, then a faction. The four factions of the chosen era show first; "show
// all" reveals the rest, since any faction may be played in any era (p.141).
// This is steps 1 and 2 of the rulebook build sequence.
function newFleetModal(state: AppState, customs: Faction[]): string {
  const m = state.ui.modal;
  if (!m || m.kind !== "new-fleet") return "";
  const byEra = factionsByEra(customs);
  const eraFactions = byEra.get(m.era) ?? [];
  const others = allFactions(customs).filter((f) => !eraFactions.includes(f));
  const eraBtn = (era: Era) =>
    `<button class="nf-opt ${m.era === era ? "on" : ""}" data-action="nf-era" data-era="${era}">${era}</button>`;
  const sizeBtn = (n: number) =>
    `<button class="nf-opt ${m.limit === n ? "on" : ""}" data-action="nf-size" data-limit="${n}">${credits(n)}</button>`;
  const plaque = (f: Faction) =>
    `<button class="faction-plaque ${m.factionId === f.id ? "selected" : ""}" data-action="nf-faction" data-faction="${f.id}">
      <span class="faction-plaque-name">${escapeHtml(f.name)}</span>
      <span class="faction-plaque-rule">${escapeHtml(f.rule.name)}</span>
    </button>`;

  return `
  <div class="modal-root">
    <div class="modal-backdrop" data-action="close-modal"></div>
    <div class="modal-panel modal-lg" role="dialog" aria-modal="true" aria-label="New fleet">
      <header class="modal-header">
        <h2 class="modal-title">New fleet</h2>
        <button class="modal-close" data-action="close-modal" aria-label="Close">${icon("close", 18)}</button>
      </header>
      <div class="modal-body">
        <div class="modal-field">
          <span class="control-label">1 / Era</span>
          <div class="nf-opts">${ERA_ORDER.map(eraBtn).join("")}</div>
        </div>
        <div class="modal-field">
          <span class="control-label">2 / Credits limit</span>
          <div class="nf-opts">${[300, 400, 500].map(sizeBtn).join("")}</div>
        </div>
        <div class="modal-field">
          <span class="control-label">3 / Faction</span>
          <div class="faction-plaques">${eraFactions.map(plaque).join("")}</div>
          <button class="nf-more" data-action="nf-toggle-all">${m.showAll ? "Show fewer" : "Show all factions (any faction, any era)"}</button>
          ${m.showAll ? `<div class="faction-plaques nf-all">${others.map(plaque).join("")}</div>` : ""}
        </div>
        <div class="nf-alt">
          <span class="control-label">Or</span>
          <button class="bar-btn" data-action="new-list" data-mode="armageddon" data-faction="__free__" data-freeplay="1">${icon("plus", 14)} Free Play</button>
          <button class="bar-btn" data-action="new-training" data-mode="combat-simulator">${icon("book", 14)} Combat Simulator</button>
          <button class="bar-btn" data-action="new-training" data-mode="management-training">${icon("book", 14)} Management Training</button>
        </div>
      </div>
      <footer class="modal-footer">
        <button class="bar-btn" data-action="close-modal">Cancel</button>
        <button class="cta-btn" data-action="nf-create" ${m.factionId ? "" : "disabled"}>Create fleet</button>
      </footer>
    </div>
  </div>`;
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

// The unit configuration modal (Dropfleet-style): one enclosed surface that
// groups everything about a unit, opened on demand from its roster row.
function unitModal(state: AppState, list: SavedList, faction: Faction | undefined, customs: Faction[]): string {
  const m = state.ui.modal;
  if (!m || m.kind !== "unit") return "";
  const u = list.fleet.units.find((x) => x.id === m.unitId);
  if (!u) return "";
  const r = resolveShip(u.shipClassId, faction, customs);
  const ship = r?.ship;
  const shipName = ship?.name ?? u.shipClassId;
  const maxCount = list.freePlay || list.mode === "hypergrowth" ? 99 : ship?.mass === 3 ? 1 : 3;
  const cost = ship ? ship.cost * u.count : 0;
  const shipNameInputs = Array.from({ length: u.count })
    .map(
      (_, i) =>
        `<input class="ship-name-input" type="text" value="${escapeHtml(u.shipNames?.[i] ?? "")}" placeholder="Ship ${i + 1}" data-action="ship-name" data-unit="${u.id}" data-index="${i}" />`,
    )
    .join("");
  const carryToggles = list.fleet.hvp
    .map((sel, i) => {
      const def = hvpById(sel.hvpId, faction);
      const on = sel.assignedUnitId === u.id;
      return `<button class="carry-toggle ${on ? "on" : ""}" data-action="toggle-carry" data-unit="${u.id}" data-index="${i}">${icon(on ? "check" : "plus", 14)} ${escapeHtml(def?.name ?? sel.hvpId)}</button>`;
    })
    .join("");

  return `
  <div class="modal-root">
    <div class="modal-backdrop" data-action="close-modal"></div>
    <div class="modal-panel" role="dialog" aria-modal="true" aria-label="Unit configuration">
      <header class="modal-header">
        <h2 class="modal-title">Unit</h2>
        <button class="modal-close" data-action="close-modal" aria-label="Close">${icon("close", 18)}</button>
      </header>
      <div class="modal-body">
        <label class="modal-field">Unit name
          <input class="modal-name" type="text" value="${escapeHtml(u.name ?? "")}" placeholder="${escapeHtml(shipName)} unit" data-action="unit-name" data-unit="${u.id}" />
        </label>
        ${
          ship
            ? `<div class="modal-spec">
                <div class="spec-glyph">${massGlyph(ship.mass, 30)}</div>
                <div class="spec-body">
                  <p class="spec-name">${escapeHtml(ship.name)}<span class="spec-cost">${credits(ship.cost)} / ship</span></p>
                  <p class="ship-stats">${statChips(ship)}</p>
                  <p class="ship-weapons"><span class="slot-label">Primary</span> ${primarySlotText(ship)}</p>
                  <p class="ship-weapons"><span class="slot-label">Auxiliary</span> ${auxSlotText(ship)}</p>
                </div>
              </div>`
            : '<p class="issue-error">This ship class is not in the faction roster.</p>'
        }
        <div class="modal-grid">
          <div class="modal-field">
            <span class="control-label">Ships in unit</span>
            <span class="stepper big">
              <button data-action="unit-count" data-unit="${u.id}" data-delta="-1" title="Fewer">${icon("minus", 16)}</button>
              <span class="stepper-count">${u.count}</span>
              <button data-action="unit-count" data-unit="${u.id}" data-delta="1" ${u.count >= maxCount ? "disabled" : ""} title="More">${icon("plus", 16)}</button>
            </span>
            <span class="modal-sub">Unit cost ${credits(cost)}</span>
          </div>
          ${faction?.requiresSpecies && !list.freePlay ? `<div class="modal-field">${speciesSelect(u)}</div>` : ""}
        </div>
        <div class="modal-field">
          <span class="control-label">Ship names</span>
          <div class="ship-names-panel">${shipNameInputs}</div>
        </div>
        ${
          list.fleet.hvp.length
            ? `<div class="modal-field">
                <span class="control-label">Carried personnel</span>
                <div class="carry-list">${carryToggles}</div>
                <span class="modal-sub">Personnel ride a unit of Mass 1 or higher.</span>
              </div>`
            : ""
        }
      </div>
      <footer class="modal-footer">
        <button class="bar-btn danger" data-action="remove-unit" data-unit="${u.id}">${icon("trash", 16)} Remove unit</button>
        <button class="cta-btn" data-action="close-modal">Done</button>
      </footer>
    </div>
  </div>`;
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
    // Mode-specific relaxations: shipyard modes buy loose ships (no unit-size
    // limit at build time) and Management Training selects no HVP (p.65).
    // The Combat Simulator's three HVP are all Seasoned Captains (p.63), so
    // the duplicate check does not apply there.
    const drop = new Set<string>();
    if (list.mode === "hypergrowth" || list.mode === "management-training") {
      drop.add("UNIT_SIZE_EXCEEDED");
    }
    if (list.mode === "management-training") drop.add("HVP_COUNT");
    if (list.mode === "combat-simulator") drop.add("HVP_DUPLICATE");
    issues = result.issues.filter((i) => !drop.has(i.code));
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
  // Compact, clickable unit rows. Deep editing happens in the unit modal, so
  // the roster stays a legible manifest (uniform connectedness: one row, one
  // unit) and adding stays a one-click act (paradox of the active user).
  const unitRows = list.fleet.units
    .map((u) => {
      const r = resolveShip(u.shipClassId, faction, customs);
      const shipName = r?.ship.name ?? u.shipClassId;
      const cost = r ? r.ship.cost * u.count : 0;
      const carried = list.fleet.hvp.filter((h) => h.assignedUnitId === u.id).length;
      return `
      <button class="roster-unit ${r ? "" : "unresolved"}" data-action="open-unit" data-unit="${u.id}">
        <span class="roster-unit-glyph">${r ? massGlyph(r.ship.mass, 22) : icon("warning", 20)}</span>
        <span class="ru-main">
          <span class="ru-name">${escapeHtml(u.name || `${shipName} unit`)}</span>
          <span class="ru-sub">${escapeHtml(shipName)} <span class="ru-x">×${u.count}</span>${carried ? ` <span class="ru-carry">${icon("personnel", 12)}${carried}</span>` : ""}${r && list.freePlay ? ` <span class="muted">${escapeHtml(r.owner.name)}</span>` : ""}</span>
        </span>
        <span class="roster-unit-cost">${credits(cost)}</span>
        <span class="ru-go">${icon("chevronRight", 16)}</span>
      </button>`;
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

  const listImg = list.emblemImage ?? libraryUrl(list.emblemLib);
  const emblemPicker = `
    ${EMBLEM_IDS.map(
      (id) =>
        `<button class="emblem-choice ${list.emblem === id && !listImg ? "selected" : ""}" data-action="set-emblem" data-emblem="${id}" title="Use this emblem">${emblem(id, 24)}</button>`,
    ).join("")}
    <label class="emblem-choice emblem-upload ${list.emblemImage ? "selected" : ""}" title="Upload your own image">
      ${icon("upload", 18)}
      <input type="file" accept="image/*" data-action="emblem-upload" hidden />
    </label>
    ${iconLibraryControls("set-emblem-lib", "random-emblem", list.emblemLib)}
    ${listImg ? `<span class="emblem-choice emblem-current selected" title="Current icon">${emblemMark(list.emblem, listImg, 24)}</span><button class="emblem-choice" data-action="clear-emblem-image" title="Clear the chosen image">${icon("close", 16)}</button>` : ""}`;

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
        <input class="fleet-name-input" type="text" value="${escapeHtml(list.fleet.name ?? "")}" placeholder="Name this fleet" data-action="fleet-name" />
      </div>
      <div class="budget ${remaining < 0 ? "over" : ""}">
        <div class="budget-head">
          <span class="budget-now">${credits(total)}</span>
          <span class="budget-cap">/ ${credits(list.fleet.creditsLimit)}</span>
          <span class="budget-free">${remaining < 0 ? `OVER ${credits(-remaining)}` : `${credits(remaining)} FREE`}</span>
        </div>
        <div class="budget-track"><span class="budget-fill" style="width:${list.fleet.creditsLimit > 0 ? Math.min(100, (total / list.fleet.creditsLimit) * 100) : 0}%"></span></div>
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
  ${trainingGuide(list.mode)}

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
          <span class="roster-emblem">${emblemMark(list.emblem, list.emblemImage ?? libraryUrl(list.emblemLib), 34)}</span>
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
          <a class="bar-btn" href="#/play/${list.id}">${icon("flag", 16)} Play mode</a>
          <button class="bar-btn" data-action="share-list" data-id="${list.id}">${icon("link", 16)} Copy share link</button>
          <button class="bar-btn" data-action="duplicate-list" data-id="${list.id}">${icon("duplicate", 16)} Duplicate</button>
          <button class="bar-btn danger" data-action="delete-list" data-id="${list.id}">${icon("trash", 16)} Delete</button>
        </div>
      </div>
    </aside>
  </main>
  ${unitModal(state, list, faction, customs)}
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

  // One continuous unit-row table, in the manner of Army Forge / Infinity Army
  // roster printouts: every unit is one scannable row with stat columns, and
  // per-unit annotations (species, ship names, carried personnel) fold into a
  // quiet second line under the unit name rather than their own boxes.
  const unitRows = list.fleet.units
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
      const notes = [
        u.species ? `Species: ${u.species}` : "",
        shipNames.length ? `Ships: ${shipNames.join(", ")}` : "",
        carried.length ? `Carrying: ${carried.join("; ")}` : "",
      ]
        .filter(Boolean)
        .join(". ");
      return `
      <tr>
        <td class="pr-n">${i + 1}</td>
        <td class="pr-unit">
          <span class="pr-unit-name">${escapeHtml(title)}</span>
          <span class="pr-unit-class">${escapeHtml(ship.name)}${list.freePlay ? `, ${escapeHtml(r.owner.name)}` : ""}</span>
          ${notes ? `<span class="pr-unit-notes">${escapeHtml(notes)}</span>` : ""}
        </td>
        <td class="pr-num">${u.count}</td>
        <td class="pr-num">${ship.mass}</td>
        <td class="pr-num">${ship.thrust}"</td>
        <td class="pr-num">${ship.silhouette}</td>
        <td class="pr-num">${ship.shields}</td>
        <td class="pr-weap">${primarySlotText(ship)}</td>
        <td class="pr-weap">${auxSlotText(ship)}</td>
        <td class="pr-num pr-cost">${credits(ship.cost * u.count)}</td>
      </tr>`;
    })
    .join("");

  const unitBlocks = unitRows
    ? `
    <table class="print-roster">
      <thead>
        <tr>
          <th></th><th>Unit</th><th>Ships</th><th>Mass</th><th>Thrust</th><th>Sil.</th><th>Shields</th>
          <th>Primary weapons</th><th>Auxiliary weapons</th><th>Cost</th>
        </tr>
      </thead>
      <tbody>${unitRows}</tbody>
      <tfoot>
        <tr><td colspan="9" class="pr-total-label">Total</td><td class="pr-num pr-cost">${credits(total)}</td></tr>
      </tfoot>
    </table>`
    : "";

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
        <div class="sheet-emblem">${emblemMark(list.emblem, list.emblemImage ?? libraryUrl(list.emblemLib), 44)}</div>
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
      ${(() => {
        const maxRound = list.mode === "management-training" ? 3 : 4;
        const isCredits = list.mode === "hypergrowth" || list.mode === "management-training";
        const roundNames = ["Round One", "Round Two", "Round Three", "Round Four"].slice(0, maxRound);
        const cells = roundNames.map(() => "<td></td>").join("");
        return `
      <p class="print-note">${list.mode === "management-training" ? "Management Training ends at the end of the third round; most credits wins." : "The game ends at the end of the fourth round."}</p>
      <table class="print-score">
        <thead><tr><th></th>${roundNames.map((n) => `<th>${n}</th>`).join("")}<th>Final</th></tr></thead>
        <tbody>
          <tr><th>${isCredits ? "Credits earned" : "Victory points"}</th>${cells}<td></td></tr>
          <tr><th>Opponent</th>${cells}<td></td></tr>
          <tr><th>Command tokens spent</th>${cells}<td></td></tr>
          <tr><th>Notes</th>${cells}<td></td></tr>
        </tbody>
      </table>`;
      })()}

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
    <h1 class="page-title">Custom Rules</h1>
    <p class="panel-note">Create your own factions: a faction rule, ship classes with full weapon fits, and High-Value Personnel. They appear in every faction picker and ride along inside share links.</p>
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
    <p class="breadcrumb"><a href="#/foundry">Custom Rules</a> / ${escapeHtml(f.name)}</p>
    <h1 class="page-title">${escapeHtml(f.name)}</h1>

    <section class="cf-section">
      <h2 class="panel-title">Identity</h2>
      <div class="cf-grid">
        <label class="field-block wide">Faction name
          <input type="text" value="${escapeHtml(f.name)}" data-action="cf-field" data-field="name" /></label>
        <div class="field-block wide">Emblem
          <div class="cf-emblem-row">
            <span class="cf-emblem-preview">${emblemMark("delta", f.emblemImage ?? libraryUrl(f.emblemLib), 40)}</span>
            <label class="bar-btn file-btn">${icon("upload", 14)} Upload
              <input type="file" accept="image/*" data-action="cf-emblem-upload" hidden /></label>
            <div class="emblem-picker">${iconLibraryControls("cf-set-lib", "cf-random-emblem", f.emblemLib)}</div>
            ${f.emblemImage || f.emblemLib ? `<button class="ghost-btn danger" data-action="cf-clear-emblem" title="Remove">${icon("close", 14)}</button>` : ""}
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
// Play mode: a table companion for the fleet game
// ---------------------------------------------------------------------------

const PHASES: { name: string; text: string }[] = [
  { name: "Command Phase", text: "Gain your faction's CMD tokens, then all players make an Initiative Check. A 2 or 3 is one success; a 1 is two successes. The winner chooses who has Initiative this round; the players who did not win gain 1 extra CMD token each." },
  { name: "Jump Phase", text: "Taking turns clockwise from the player with Initiative: open a Jump Point, Jump In a unit from Reserve, or pass. The phase ends once all players have passed." },
  { name: "Tactical Phase", text: "Taking turns clockwise from the player with Initiative, Drag to Select a battlegroup (lead unit plus unactivated friendly units at least partly within 6\", Combined Mass 10 or less) and activate its units. Ends when every in-play unit has activated." },
  { name: "End Phase", text: "Check the scoring conditions on your missions, clear all Activated tokens, resolve any other End Phase effects, discard unused CMD tokens, and begin a new round." },
];

/** End Phase scoring reminders by mode, from the relevant rules pages. */
const SCORING_NOTES: Partial<Record<GameMode, string[]>> = {
  "combat-simulator": [
    "Each End Phase: 2VP per enemy flank Jump Point you are blockading; 5VP for the enemy's central Jump Point; 3VP for the central objective.",
    "Game end (end of Round 4): 2VP per enemy HVP token you are carrying.",
  ],
  armageddon: [
    "Each End Phase (core mission): 2VP per enemy flank Jump Point you are blockading; 5VP for the enemy's central Jump Point; 3VP for the central objective.",
    "Game end (end of Round 4): 2VP per enemy HVP token you are carrying. Check your chosen mission for exact scoring.",
  ],
  "management-training": [
    "Each End Phase: ¢20bn per Sector you control (most ships there; ties by Combined Mass) and ¢20bn per ComSat you are Blockading.",
    "The game ends after Round 3; most credits wins.",
  ],
  hypergrowth: [
    "Each End Phase: collect the Revenue your two rolled missions award for their objectives.",
    "Game end (end of Round 4): highest Credits wins; ties go to the player carrying the most HVP tokens.",
  ],
  "age-of-unity": [
    "Each End Phase: score the VP listed on the two rolled missions (Attacker and Defender briefings differ).",
    "Game end (end of Round 4): most VP wins; check each mission's end-of-game scoring.",
  ],
};

function playView(state: AppState): string {
  const list = activeList(state);
  if (!list)
    return `${topbar()}<main class="empty-state"><p>That fleet was not found.</p><p><a href="#/">Back to the register</a></p></main>`;
  const customs = state.customFactions;
  const faction = findFaction(list.fleet.factionId, customs);
  const play = list.play ?? { round: 1, phase: 0, cmd: faction ? Number(faction.cmdTokens) || 0 : 0, vp: 0, oppVp: 0 };
  const maxRound = list.mode === "management-training" ? 3 : 4;
  const isCredits = list.mode === "hypergrowth" || list.mode === "management-training";
  const scoreLabel = isCredits ? "Credits" : "Victory points";
  const last = state.ui.lastRoll;

  const phaseBtns = PHASES.map(
    (p, i) => `
    <button class="phase-step ${play.phase === i ? "selected" : ""}" data-action="play-phase" data-phase="${i}">
      <span class="phase-n">${i + 1}</span>${p.name.replace(" Phase", "")}
    </button>`,
  ).join("");

  const counter = (label: string, value: number, action: string, step = 1) => `
    <div class="play-counter">
      <span class="control-label">${label}</span>
      <div class="round-control">
        <button class="stepper-btn" data-action="${action}" data-delta="${-step}">${icon("minus", 16)}</button>
        <span class="round-value">${value}</span>
        <button class="stepper-btn" data-action="${action}" data-delta="${step}">${icon("plus", 16)}</button>
      </div>
    </div>`;

  const notes = (SCORING_NOTES[list.mode] ?? []).map((n) => `<li>${escapeHtml(n)}</li>`).join("");

  return `
  ${topbar()}
  <section class="setup-band">
    <div class="setup-head">
      <div class="setup-identity">
        <p class="band-eyebrow"><a href="#/list/${list.id}">${escapeHtml(list.fleet.name || "Unnamed fleet")}</a> / Play mode</p>
        <h1 class="page-title" style="margin:0">Round ${play.round} of ${maxRound}</h1>
      </div>
      <div class="band-readout">
        <div class="readout"><span class="readout-label">${scoreLabel}</span><span class="readout-value">${play.vp}</span></div>
        <div class="readout"><span class="readout-label">Opponent</span><span class="readout-value">${play.oppVp}</span></div>
        <div class="readout"><span class="readout-label">CMD</span><span class="readout-value">${play.cmd}</span></div>
      </div>
    </div>
  </section>
  <main class="solo-body">
    <div class="phase-track">${phaseBtns}</div>
    <p class="phase-text">${escapeHtml(PHASES[play.phase]?.text ?? "")}</p>

    <div class="solo-grid" style="margin-top:20px">
      <section class="solo-card">
        <h3 class="roster-section">Counters</h3>
        <div class="play-counters">
          ${counter("Round", play.round, "play-round")}
          ${counter("CMD tokens", play.cmd, "play-cmd")}
          ${counter(scoreLabel, play.vp, "play-vp")}
          ${counter("Opponent " + scoreLabel.toLowerCase(), play.oppVp, "play-oppvp")}
        </div>
        <div class="roster-actions" style="padding:14px 0 0">
          <button class="bar-btn" data-action="play-next">${icon("chevronRight", 16)} Next phase</button>
          <button class="ghost-btn danger" data-action="play-reset">Reset the game</button>
        </div>
      </section>

      <section class="solo-card">
        <h3 class="roster-section">Initiative check</h3>
        <p class="panel-note">${faction ? `${escapeHtml(faction.name)} rolls ${escapeHtml(faction.initiative)}.` : ""} A 2 or 3 counts as one success; a 1 counts as two. Most successes chooses who has Initiative; non-winners gain 1 CMD token.</p>
        <button class="bar-btn" data-action="play-initiative" data-dice="${faction ? escapeHtml(faction.initiative) : "3D6"}">Roll ${faction ? escapeHtml(faction.initiative) : "3D6"}</button>
        ${
          last && last.table.startsWith("Initiative check")
            ? `<div class="roll-result"><div class="roll-die">${last.value}</div><div class="roll-body"><p class="roll-table">${escapeHtml(last.table)}</p><p class="roll-headline">${escapeHtml(last.result)}</p>${last.detail ? `<p class="roll-detail">${escapeHtml(last.detail)}</p>` : ""}</div></div>`
            : ""
        }
      </section>

      <section class="solo-card">
        <h3 class="roster-section">Scoring reminders</h3>
        ${notes ? `<ul class="rule-list">${notes}</ul>` : '<p class="muted">Check your mission sheet for scoring.</p>'}
        ${faction ? `<h4 class="ref-sub">${escapeHtml(faction.rule.name)}</h4><p class="rule-card-text">${escapeHtml(faction.rule.text)}</p>` : ""}
      </section>
    </div>
  </main>
  ${toast(state)}
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
    case "fleets":
      return fleetsView(state);
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
    case "play":
      return playView(state);
    case "changelog":
      return changelogView();
  }
}
