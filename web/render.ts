import type { Era, Faction, FleetUnit, GameMode, Hvp, ShipClass } from "../src/types.ts";
import { ALLIANCE_SPECIES } from "../src/types.ts";
import { validateFleet, type ValidationIssue } from "../src/validation.ts";
import { GENERIC_HVP } from "../src/data/index.ts";
import { JUNKSPACE_SHIPS } from "../src/data/junkspace.ts";
import { allFactions, factionsByEra, findFaction, makeCatalog, ERA_ORDER } from "./catalog.ts";
import { auxSlotText, credits, escapeHtml, formatDate, primarySlotText } from "./format.ts";
import { emblemMark, icon, initiativeDice, massGlyph, statChips, tacticalDiagram } from "./icons.ts";
import { iconLibraryControls, iconLibraryGrid, libraryUrl } from "./emblems.ts";
import { CHANGELOG } from "./changelog.ts";
import type { AppState } from "./state.ts";
import { activeList } from "./state.ts";
import type { SavedList } from "./storage.ts";
import { soloListView, soloOutfitView } from "./solo.ts";
import { activeTour } from "./tours.ts";

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
  diagram?: "deployment" | "arcs";
}

const TRAINING_GUIDES: Partial<Record<GameMode, { intro: string; steps: GuideStep[]; notes: GuideStep[] }>> = {
  "combat-simulator": {
    intro:
      "Your first game of A Billion Suns. It plays like Armageddon and teaches the basics of activating your fleet: moving and attacking. Your Training Fleet is already loaded.",
    // What you actually DO, once, in order, before and during the game.
    steps: [
      {
        title: "Set up the table",
        text: 'Clear a play area roughly 4 feet by 3 feet. Pick or roll a D6 for a Central Objective and place it in the middle of the board: 1-2 a ComSat, 3-4 a Facility, 5-6 a Planetoid. Each player deploys 3 Jump Points: the flank points 24" apart and 15" in from each short edge, the central point 5" from your own edge.',
        diagram: "deployment",
      },
      {
        title: "Place your High-Value Personnel",
        text: "Gather three HVP tokens that are distinguishable as yours and place them on friendly ships of Mass 1 or higher. All three of your HVP are Seasoned Captains: units in their battlegroup can use the Red Alert command for 0 CMD, once per Round.",
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
    // Good-to-know rules that apply throughout, not a moment you act on once -
    // "Load your squadrons" used to sit in the numbered sequence above like it
    // was step 3 of setup, when it's really a standing reminder about how
    // carrying capacity works whenever you deploy those two hulls.
    notes: [
      {
        title: "Loading squadrons",
        text: "When you deploy your Heavy Cruiser or Frigate, you can load units of Fighters and Bombers into them, or deploy those units directly. A unit can carry Squadrons up to twice its Combined Mass: the Heavy Cruiser carries up to six wings, the Frigate four, and a unit of three Corvettes up to six.",
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
        title: "Earn credits in each End Phase",
        text: "Secure Sectors: gain ¢20bn for each Sector you control (most ships there; ties go to the greatest Combined Mass). Infowar: gain ¢20bn for each ComSat you are Blockading. There is a maximum of ¢100bn available to earn each round.",
      },
      {
        title: "Game end",
        text: "Your Initiative Value is 3D6. At the end of the third game round, the game ends and the player with the most credits is the winner.",
      },
    ],
    // Same fix as Combat Simulator: this was sitting in the numbered sequence
    // as if it were a discrete action, when it's really a standing rule about
    // what happens whenever a ship dies over the course of the game.
    notes: [
      {
        title: "Reinforcements",
        text: "When a ship is destroyed it returns to your Shipyard and can be requisitioned again as a reinforcement. If you are prepared to keep paying, you can keep deploying: just watch your balance sheet.",
      },
    ],
  },
};

function trainingGuide(mode: GameMode): string {
  const g = TRAINING_GUIDES[mode];
  if (!g) return "";
  const stepHtml = (s: GuideStep, n?: number) => `
      <details class="guide-step ${n ? "" : "guide-step-note"}" ${n === 1 ? "open" : ""}>
        <summary>${n ? `<span class="guide-step-n">${n}</span>` : ""}${escapeHtml(s.title)}</summary>
        <div class="guide-step-body">
          <p>${escapeHtml(s.text)}</p>
          ${s.diagram ? tacticalDiagram(s.diagram) : ""}
        </div>
      </details>`;
  const steps = g.steps.map((s, i) => stepHtml(s, i + 1)).join("");
  const notes = g.notes.map((s) => stepHtml(s)).join("");
  return `
  <section class="guide-band">
    <div class="guide-inner">
      <h3 class="guide-title">${icon("book", 16)} Guided tutorial</h3>
      <p class="guide-intro">${escapeHtml(g.intro)}</p>
      ${steps}
      ${
        notes
          ? `<h4 class="guide-notes-title">Good to know</h4>
             <p class="guide-notes-sub">Rules that apply throughout the game, not a step you take once.</p>
             ${notes}`
          : ""
      }
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

// Auto-numbered unit names: the first unit of a ship class gets the ship's
// own name, the second gets "Ship Name 2", and so on. Computed once in fleet
// order so the roster, HVP carrier dropdown, and print/play views all agree
// on the same numbering. A player-set custom name always overrides this.
function unitDisplayNames(units: FleetUnit[], faction: Faction | undefined, customs: Faction[]): Map<string, string> {
  const names = new Map<string, string>();
  const seen = new Map<string, number>();
  for (const u of units) {
    const r = resolveShip(u.shipClassId, faction, customs);
    const shipName = r?.ship.name ?? u.shipClassId;
    const count = (seen.get(u.shipClassId) ?? 0) + 1;
    seen.set(u.shipClassId, count);
    names.set(u.id, count === 1 ? shipName : `${shipName} ${count}`);
  }
  return names;
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

const EMBLEM_TINT: Record<string, string> = { ink: "var(--ink)", blue: "var(--blue)", red: "var(--red)" };

// Render a list's emblem. A vector (SVG) library mark with a chosen tint is
// painted as a solid colour via CSS mask; everything else (uploads, raster
// marks, built-in glyphs) falls back to the shared emblemMark.
function listEmblem(l: SavedList, size: number, cls = ""): string {
  if (!l.emblemImage && l.emblemLib && /\.svg$/i.test(l.emblemLib) && l.emblemColor) {
    const url = libraryUrl(l.emblemLib);
    if (url) {
      const color = EMBLEM_TINT[l.emblemColor] ?? "var(--ink)";
      return `<span class="emblem emblem-tint ${cls}" style="width:${size}px;height:${size}px;background-color:${color};-webkit-mask-image:url('${url}');mask-image:url('${url}');" role="img" aria-hidden="true"></span>`;
    }
  }
  return emblemMark(l.emblem, l.emblemImage ?? libraryUrl(l.emblemLib), size, cls);
}

function topbar(): string {
  return `
  <header class="topbar">
    <a class="wordmark" href="#/">${icon("logo", 26)}<span class="wordmark-text">A Billion Suns 2e</span><span class="wordmark-sub">Shipyard</span></a>
    <nav class="topnav">
      <span class="nav-pill" aria-hidden="true"></span>
      <a href="#/fleets">${icon("flag", 16)} Fleets</a>
      <a href="#/ships">${icon("compare", 16)} Compendium</a>
      <a href="#/solo">${icon("book", 16)} Solo</a>
      <a href="#/foundry">${icon("wrench", 16)} Custom Rules</a>
    </nav>
  </header>`;
}

function footer(): string {
  // The uniform WarLore builder footer: one centered line, dot-separated. The
  // separators are styled spans, not literal interpunct characters.
  const v = CHANGELOG[0]?.version ?? "";
  const sep = '<span class="gif-sep" aria-hidden="true"></span>';
  return `
  <footer class="game-info-footer">
    <div class="gif-inner">
      <span class="gif-title">A Billion Suns</span>${sep}
      <span>by <a href="https://planetsmashergames.com/a-billion-suns/" target="_blank" rel="noopener">Mike Hutchinson</a>, Osprey Games</span>${sep}
      <a href="./ABS-2E-Quick-Reference.pdf" target="_blank" rel="noopener">Quick Reference</a>${sep}
      <span class="gif-builder">Fleet builder by <a class="wl-sig" href="https://linktr.ee/warlore" target="_blank" rel="noopener">WarLore</a></span>${sep}
      <a href="mailto:warlore1@outlook.com">Send Feedback</a>${sep}
      <a href="https://github.com/Type37/a-billion-suns-shipyard" target="_blank" rel="noopener">Source on GitHub</a>${sep}
      <a href="#/changelog">v${escapeHtml(v)}</a>
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
      <p class="onboard-note">Basic Training loads a ready-made fleet and walks you through a game, step by step. Start with the Combat Simulator.</p>
      <div class="onboard-options">
        <button class="onboard-opt" data-action="new-training" data-mode="combat-simulator">
          <span class="oo-name">${icon("book", 15)} Combat Simulator</span>
          <span class="oo-desc">Learn the core game. A quick skirmish with a ready-made fleet: move, shoot, and activate your battlegroups.</span>
        </button>
        <button class="onboard-opt" data-action="new-training" data-mode="management-training">
          <span class="oo-name">${icon("book", 15)} Management Training</span>
          <span class="oo-desc">Learn the economy. Buy a Shipyard, then requisition and jump ships into play as the game unfolds.</span>
        </button>
      </div>
    </div>
    <button class="onboard-close" data-action="dismiss-tutorials" aria-label="Dismiss">${icon("close", 16)}</button>
  </aside>`;
}

// ---------------------------------------------------------------------------
// Home hub: decide what you want to do (Dropfleet-builder mental model)
// ---------------------------------------------------------------------------

function homeView(state: AppState): string {
  // Rows are links, except when an action is given (Learn to Play launches a
  // guided tutorial battle rather than routing to a dead page).
  const row = (n: string, href: string, name: string, desc: string, action?: string, extra = "") => {
    const inner = `
      <span class="index-num">${n}</span>
      <span class="index-main">
        <span class="index-name">${name}</span>
        <span class="index-desc">${desc}</span>
      </span>
      <span class="index-go">${icon("chevronRight", 20)}</span>`;
    return action
      ? `<button class="index-row" data-action="${action}" ${extra}>${inner}</button>`
      : `<a class="index-row" href="${href}">${inner}</a>`;
  };
  return `
  ${topbar()}
  <header class="nameplate">
    <div class="nameplate-inner">
      <h1 class="wordmark-hero">
        <span class="wm-edition">Second Edition</span>
        <span class="wm-lockup"><svg class="wm-delta" viewBox="0 0 104 104" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="10" stroke-linejoin="round" stroke-linecap="round"><path d="M52 13 L96 93 L8 93 Z"/></svg><span class="wm-billion">Billion</span><span class="wm-suns">Suns</span></span>
        <span class="wm-tag">Interstellar Fleet Battles</span>
      </h1>
    </div>
  </header>
  <main class="index-wrap">
    <div class="index-col">
      ${tutorialCallout(state)}
      <nav class="index">
        ${row("01", "#/fleets", "Fleets", "Build, save, print, and share army lists for any faction and era.")}
        ${row("02", "#/solo", "Solo Play", "Junkspace: build an outfit, roll for the enemy, run the debt campaign.")}
        ${row("03", "#/ships", "Ship Compendium", "Every ship in the game in one filterable, sortable table.")}
        ${row("04", "#/fleets", "Learn to Play", "A guided tutorial battle: the Training Fleet loaded, walked through setup, every phase, and scoring.", "new-training", 'data-mode="combat-simulator"')}
        ${row("05", "#/foundry", "Custom Rules", "Design your own factions, ship classes, and personnel.")}
      </nav>
    </div>
    <aside class="index-book">
      <a class="index-book-link" href="https://planetsmashergames.com/a-billion-suns/" target="_blank" rel="noopener">
        <span class="index-book-cta">${icon("book", 20)} Get the rulebook</span>
      </a>
    </aside>
  </main>
  ${newFleetModal(state, state.customFactions)}
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
        <td class="cell-emblem"><span class="emblem-chip">${listEmblem(l, 28)}</span></td>
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
      <button class="cta-btn create-cta" data-action="open-new-fleet">${icon("plus", 18)} Assemble new fleet</button>
    </div>

    ${
      lists.length === 0
        ? '<p class="muted" style="margin-top:20px">No lists yet. Use Assemble new fleet to begin; lists are stored in this browser.</p>'
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
// The detail pane shown on the right of the new-fleet dialog once a faction is
// picked: its summary and signature ability only - not a full ship/personnel
// dump. The point at pick-time is "who are these people and what do they do",
// which the builder itself lays out in full once you commit.
function factionDetailPane(f: Faction): string {
  return `
    <div class="nf-detail">
      <h3 class="nfd-title">${escapeHtml(f.name)}</h3>
      <p class="nfd-era-tag">${escapeHtml(f.era)}</p>
      ${f.playstyle ? `<p class="nfd-playstyle">${escapeHtml(f.playstyle)}</p>` : ""}
      <div class="nfd-ability">
        <h4 class="nfd-h">Signature ability</h4>
        <p class="nfd-rule"><span class="nfd-rule-name">${escapeHtml(f.rule.name)}.</span> ${escapeHtml(f.rule.text)}</p>
      </div>
      <dl class="nfd-stats">
        <div><dt>Initiative</dt><dd>${escapeHtml(f.initiative)}</dd></div>
        <div><dt>CMD / round</dt><dd>${escapeHtml(f.cmdTokens)}</dd></div>
        <div><dt>Ship classes</dt><dd>${f.ships.length}</dd></div>
        <div><dt>Personnel</dt><dd>${f.hvp.length}</dd></div>
      </dl>
    </div>`;
}

function newFleetModal(state: AppState, customs: Faction[]): string {
  const m = state.ui.modal;
  if (!m || m.kind !== "new-fleet") return "";
  const byEra = factionsByEra(customs);
  const customIds = new Set(customs.map((c) => c.id));
  // The default list shows only this era's *official* factions. Custom/seed
  // factions (e.g. the Covenant) and every other era live behind "More".
  const eraFactions = (byEra.get(m.era) ?? []).filter((f) => !customIds.has(f.id));
  // The rest, sorted: other-era book factions first (by era, then name), then
  // any custom factions last, so the expanded grid reads in a stable order.
  const others = allFactions(customs)
    .filter((f) => !eraFactions.includes(f))
    .sort((a, b) => {
      const ca = customIds.has(a.id) ? 1 : 0;
      const cb = customIds.has(b.id) ? 1 : 0;
      return ca - cb || ERA_ORDER.indexOf(a.era) - ERA_ORDER.indexOf(b.era) || a.name.localeCompare(b.name);
    });
  const sizeBtn = (n: number) =>
    `<button class="nf-opt ${m.limit === n ? "on" : ""}" data-action="nf-size" data-limit="${n}">${credits(n)}</button>`;
  const plaque = (f: Faction) =>
    `<button class="faction-plaque ${m.factionId === f.id ? "selected" : ""}" data-action="nf-faction" data-faction="${f.id}">
      <span class="faction-plaque-name">${escapeHtml(f.name)}</span>
      <span class="faction-plaque-rule">${escapeHtml(f.rule.name)}</span>
    </button>`;

  const selected = m.factionId ? findFaction(m.factionId, customs) : undefined;

  return `
  <div class="modal-root">
    <div class="modal-backdrop" data-action="close-modal"></div>
    <div class="modal-panel modal-wide nf-modal" role="dialog" aria-modal="true" aria-label="New fleet">
      <header class="modal-header">
        <h2 class="modal-title">New fleet</h2>
        <button class="modal-close" data-action="close-modal" aria-label="Close">${icon("close", 18)}</button>
      </header>
      <div class="modal-body nf-body">
        <div class="nf-controls">
          <div class="modal-field">
            <span class="control-label">1 / Era</span>
            ${switcher(
              "Era",
              "nf-era",
              "era",
              ERA_ORDER.map((era) => [era, era] as [string, string]),
              m.era,
            )}
          </div>
          <div class="modal-field">
            <span class="control-label">2 / Credits limit</span>
            <div class="nf-opts">
              ${[300, 400, 500].map(sizeBtn).join("")}
              <label class="nf-custom ${![300, 400, 500].includes(m.limit) ? "on" : ""}">Custom
                <input type="number" min="1" step="10" value="${![300, 400, 500].includes(m.limit) ? m.limit : ""}" placeholder="¢bn" data-action="nf-size-custom" /></label>
            </div>
          </div>
          <div class="modal-field">
            <span class="control-label">3 / Faction</span>
            <!-- Fixed-height frame: switching era or toggling "More" changes how
                 many plaques there are, but never the modal's outer layout - it
                 scrolls inside this box instead of shoving everything below it. -->
            <div class="nf-faction-scroll">
              <div class="faction-plaques">${eraFactions.map(plaque).join("")}</div>
              <button class="nf-more" data-action="nf-toggle-all">${m.showAll ? "Show fewer" : `${icon("plus", 13)} More — other eras &amp; custom`}</button>
              ${
                m.showAll
                  ? `<p class="muted picker-note">Any faction may be fielded in any era. Other eras first, then your custom factions.</p>
                     <div class="faction-plaques nf-all">${others.map(plaque).join("")}</div>`
                  : ""
              }
            </div>
          </div>
          <div class="nf-alt">
            <span class="control-label">Or try a tutorial</span>
            <div class="nf-alt-opts">
              <button class="bar-btn" data-action="new-training" data-mode="combat-simulator">${icon("book", 14)} Combat Simulator</button>
              <button class="bar-btn" data-action="new-training" data-mode="management-training">${icon("book", 14)} Management Training</button>
            </div>
          </div>
        </div>
        <div class="nf-detail-col">
          ${selected ? factionDetailPane(selected) : '<div class="nf-detail nf-detail-empty"><p class="muted">Pick a faction to see its ships, rule, and personnel.</p></div>'}
        </div>
      </div>
      <footer class="modal-footer">
        <button class="bar-btn" data-action="close-modal">Cancel</button>
        <button class="cta-btn cta-go" data-action="nf-create" ${m.factionId ? "" : "disabled"}>${icon("flag", 16)} GET BUILDING</button>
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

// A segmented switcher with a sliding highlight, for any number of mutually
// exclusive options - one bordered track instead of N independent boxes,
// rather than N buttons each carrying its own border (which is exactly how
// the old 4-box phase tracker turned into a wall of lines). The highlight is
// a single absolutely-positioned bar sized and moved via CSS custom
// properties, so it generalises to any option count with no per-N CSS.
function switcher(
  groupLabel: string,
  action: string,
  dataKey: string,
  opts: readonly [value: string, label: string][],
  selectedValue: string,
): string {
  const selectedIndex = Math.max(
    0,
    opts.findIndex(([value]) => value === selectedValue),
  );
  return `<div class="switcher" role="group" aria-label="${escapeHtml(groupLabel)}" style="--switcher-count:${opts.length};--switcher-selected:${selectedIndex}">
    <span class="switcher-thumb" aria-hidden="true"></span>
    ${opts
      .map(
        ([value, label], i) =>
          `<button class="switcher-opt ${i === selectedIndex ? "selected" : ""}" data-action="${action}" data-${dataKey}="${escapeHtml(value)}">${escapeHtml(label)}</button>`,
      )
      .join("")}
  </div>`;
}

function catalogShipRow(ship: ShipClass, ownerFaction: Faction, composite: boolean, owned = 0): string {
  const addId = composite ? `${ownerFaction.id}/${ship.id}` : ship.id;
  const wp = primarySlotText(ship).replace(/<br \/>/g, ", ");
  const wa = auxSlotText(ship).replace(/<br \/>/g, ", ");
  const weapons = [wp === "None" ? "" : wp, wa === "None" ? "" : wa].filter(Boolean).join("; ") || "No weapons";
  // The whole row is the click target (add a unit), with a standing ADD cue on
  // the right so the affordance is never hover-only. Name and cost on their own
  // line so a long name never gets cut; full stats and weapons always visible.
  return `
  <article class="ship-row is-option ${ship.image ? "has-art" : ""}" data-action="add-unit" data-ship="${addId}" role="button" title="Add a unit of ${escapeHtml(ship.name)}">
    <div class="ship-row-glyph">${ship.image ? `<img class="ship-thumb" src="${ship.image}" alt="" loading="lazy" />` : massGlyph(ship.mass, 22)}</div>
    <div class="ship-row-body">
      <div class="ship-row-head">
        <h4 class="ship-name">${escapeHtml(ship.name)}</h4>
        <span class="ship-cost">${credits(ship.cost)}</span>
        ${owned > 0 ? `<span class="owned-tag">${owned} in fleet</span>` : ""}
      </div>
      <div class="ship-row-details">
        ${statChips(ship, true)}
        <span class="ship-weapons">${escapeHtml(weapons)}</span>
      </div>
    </div>
    <span class="add-cue">${icon("plus", 15)}<span>Add</span></span>
  </article>`;
}

// Experimental: ship classes grouped into Mass columns instead of one flat
// list, so a faction's whole roster is visible with less vertical scrolling.
function catalogColumnsByMass(faction: Faction, owned: (addId: string) => number): string {
  const groups = [0, 1, 2, 3]
    .map((mass) => ({ mass, ships: faction.ships.filter((s) => s.mass === mass) }))
    .filter((g) => g.ships.length > 0);
  return `<div class="mass-columns">${groups
    .map(
      (g) => `
      <div class="mass-col">
        <h4 class="mass-col-title">Mass ${g.mass} <span class="muted">${g.ships.length}</span></h4>
        <div class="mass-col-body">${g.ships.map((s) => catalogShipRow(s, faction, false, owned(s.id))).join("")}</div>
      </div>`,
    )
    .join("")}</div>`;
}

// Stat comparison chart: every ship class in the faction as a horizontal bar,
// ranked by a chosen stat, so a build decision ("which is the cheapest Mass 2
// hull?") is a glance instead of scanning a dozen rows by eye.
type ChartStatKey = "cost" | "mass" | "thrust" | "silhouette" | "shields";
const CHART_STATS: Record<ChartStatKey, { label: string; icon: string; get: (s: ShipClass) => number; fmt: (n: number) => string }> = {
  cost: { label: "Cost", icon: "", get: (s) => s.cost, fmt: (n) => credits(n) },
  mass: { label: "Mass", icon: "stat-mass", get: (s) => s.mass, fmt: (n) => String(n) },
  thrust: { label: "Thrust", icon: "stat-thrust", get: (s) => s.thrust, fmt: (n) => `${n}"` },
  silhouette: { label: "Sil", icon: "stat-silhouette", get: (s) => s.silhouette, fmt: (n) => String(n) },
  shields: { label: "Shields", icon: "stat-shields", get: (s) => s.shields, fmt: (n) => String(n) },
};

function catalogChartPicker(stat: ChartStatKey): string {
  return `<div class="chart-picker" role="group" aria-label="Compare ship classes by">
    ${(Object.keys(CHART_STATS) as ChartStatKey[])
      .map((key) => {
        const m = CHART_STATS[key];
        return `<button class="chart-picker-btn ${stat === key ? "selected" : ""}" data-action="set-chart-stat" data-stat="${key}">${m.icon ? icon(m.icon, 13) : ""}${m.label}</button>`;
      })
      .join("")}
  </div>`;
}

function catalogChart(faction: Faction, stat: ChartStatKey): string {
  const meta = CHART_STATS[stat];
  const rows = [...faction.ships].sort((a, b) => meta.get(b) - meta.get(a));
  const max = Math.max(1, ...rows.map(meta.get));
  return `<div class="chart">${rows
    .map((s) => {
      const v = meta.get(s);
      const pct = Math.max(2, Math.round((v / max) * 100));
      return `
      <div class="chart-row">
        <span class="chart-label">${escapeHtml(s.name)}</span>
        <span class="chart-track"><span class="chart-bar" style="width:${pct}%"></span></span>
        <span class="chart-val">${meta.fmt(v)}</span>
      </div>`;
    })
    .join("")}</div>`;
}


function builderView(state: AppState): string {
  const list = activeList(state);
  if (!list)
    return `${topbar()}<main class="empty-state"><p>That fleet was not found.</p><p><a href="#/">Back to the register</a></p></main>`;

  const customs = state.customFactions;
  const faction = findFaction(list.fleet.factionId, customs);
  const { total, remaining } = listTotals(list, customs);
  const era = MODE_ERA[list.mode];
  const catalogView = state.ui.catalogView;
  const chartStat = state.ui.catalogChartStat ?? "cost";

  // Validation: the full engine for rules play, none for Free Play. The
  // Hypergrowth shipyard has no unit-size limits at build time (rules p.122),
  // ships are bought loose and only form units at requisition.
  let issues: ValidationIssue[] = [];
  let valid = true;
  if (!list.freePlay && faction) {
    const result = validateFleet(list.fleet, makeCatalog(customs));
    // Mode-specific relaxations: shipyard modes buy loose ships (no unit-size
    // limit at build time) and Management Training selects no HVP (p.65).
    const drop = new Set<string>();
    if (list.mode === "hypergrowth" || list.mode === "management-training") {
      drop.add("UNIT_SIZE_EXCEEDED");
    }
    if (list.mode === "management-training") drop.add("HVP_COUNT");
    issues = result.issues.filter((i) => !drop.has(i.code));
    valid = !issues.some((i) => i.severity === "error");
  }

  // Faction picker: every faction, grouped by era in reading order, with custom
  // factions gathered in their own section at the bottom.
  const byEra = factionsByEra(customs);
  const customIds = new Set(customs.map((c) => c.id));
  const factionOption = (f: Faction) => `
      <button class="faction-plaque ${f.id === list.fleet.factionId && !list.freePlay ? "selected" : ""}" data-action="set-faction" data-faction="${f.id}">
        <span class="faction-plaque-name">${escapeHtml(f.name)}</span>
        <span class="faction-plaque-rule">${escapeHtml(f.rule.name)}</span>
      </button>`;
  const factionSection = (label: string, fs: Faction[]) =>
    fs.length
      ? `<div class="faction-era-group">
          <p class="faction-era-label">${escapeHtml(label)}</p>
          <div class="faction-plaques">${fs.map(factionOption).join("")}</div>
        </div>`
      : "";
  const factionPickerBody =
    ERA_ORDER.map((e) =>
      factionSection(
        e,
        (byEra.get(e) ?? []).filter((f) => !customIds.has(f.id)),
      ),
    ).join("") + factionSection("Custom", allFactions(customs).filter((f) => customIds.has(f.id)));

  // How many units of a given class the fleet already holds, keyed by the id we
  // add with. Shown on each option so the picker reads like a live tally.
  const ownedCount = (addId: string) => list.fleet.units.filter((u) => u.shipClassId === addId).length;

  const unitNames = unitDisplayNames(list.fleet.units, faction, customs);
  const autoUnitName = (unitId: string) => unitNames.get(unitId) ?? "";

  // Catalog: one faction in rules play; every faction grouped in Free Play.
  let catalogHtml = "";
  if (list.freePlay) {
    catalogHtml = allFactions(customs)
      .map(
        (f, i) => `
        <details class="catalog-group" ${i === 0 ? "open" : ""}>
          <summary>${escapeHtml(f.name)} <span class="muted">${f.era}</span></summary>
          ${f.ships.map((s) => catalogShipRow(s, f, true, ownedCount(`${f.id}/${s.id}`))).join("")}
        </details>`,
      )
      .join("");
  } else if (faction) {
    catalogHtml = faction.ships.map((s) => catalogShipRow(s, faction, false, ownedCount(s.id))).join("");
  }

  // Personnel catalog. Turning one on is the whole interaction: the card you
  // just clicked becomes its own complete record, holding the carried-by
  // assignment and a rename field right there. Nothing lives in a second
  // place, so there is no separate roster-personnel list to keep in sync.
  const hvpMax = list.freePlay ? 99 : (faction?.hvpMax ?? 3);
  const hvpMin = faction?.hvpMin ?? 3;
  const atHvpCap = list.fleet.hvp.length >= hvpMax;
  const carrierOptions = (assignedId?: string) =>
    list.fleet.units
      .map((u) => {
        const label = u.name || autoUnitName(u.id);
        return `<option value="${u.id}" ${assignedId === u.id ? "selected" : ""}>${escapeHtml(label)}</option>`;
      })
      .join("");
  const personnelCard = (h: Hvp, source: string) => {
    const selIndex = list.fleet.hvp.findIndex((sel) => sel.hvpId === h.id);
    const isChosen = selIndex !== -1;
    const isGeneric = source === "Generic";
    const body = `<div class="personnel-body">
        <span class="personnel-name ${isGeneric ? "is-generic" : ""}">${escapeHtml(h.name)}</span>
        <span class="personnel-rule">${escapeHtml(h.rule)}</span>
      </div>`;
    if (isChosen) {
      const sel = list.fleet.hvp[selIndex]!;
      // The chosen row has a simple dropdown to assign a carrier.
      return `
      <article class="personnel-row chosen">
        ${body}
        <span class="personnel-actions">
          <select class="personnel-assign" data-action="hvp-assign" data-index="${selIndex}" title="Assign a carrier">
            <option value="">Not assigned</option>
            ${carrierOptions(sel.assignedUnitId)}
          </select>
          <button class="ghost-btn danger" data-action="remove-hvp" data-index="${selIndex}" title="Remove ${escapeHtml(h.name)}">${icon("close", 16)}</button>
        </span>
      </article>`;
    }
    if (atHvpCap) {
      return `<article class="personnel-row is-full">${body}<span class="add-cue is-off">Full</span></article>`;
    }
    return `
    <article class="personnel-row is-option" data-action="add-hvp" data-hvp="${h.id}" role="button" title="Add ${escapeHtml(h.name)}">
      ${body}
      <span class="add-cue">${icon("plus", 15)}<span>Add</span></span>
    </article>`;
  };
  const personnelCatalog = faction
    ? faction.hvp.map((h) => personnelCard(h, escapeHtml(faction.name))).join("") +
      GENERIC_HVP.map((h) => personnelCard(h, "Generic")).join("")
    : GENERIC_HVP.map((h) => personnelCard(h, "Generic")).join("");

  // Roster units.
  // Compact rows with inline controls (ship count stepper, HVP carrier assignment).
  const unitRows = list.fleet.units
    .map((u) => {
      const r = resolveShip(u.shipClassId, faction, customs);
      const unitName = autoUnitName(u.id);
      const cost = r ? r.ship.cost * u.count : 0;
      const carried = list.fleet.hvp
        .filter((h) => h.assignedUnitId === u.id)
        .map((h) => {
          const def = hvpById(h.hvpId, faction);
          return { name: def?.name ?? h.hvpId, rule: def?.rule ?? "" };
        });
      const maxCount = list.freePlay || list.mode === "hypergrowth" ? 99 : r?.ship.mass === 3 ? 1 : 3;
      const wp = r ? primarySlotText(r.ship).replace(/<br \/>/g, ", ") : "";
      const wa = r ? auxSlotText(r.ship).replace(/<br \/>/g, ", ") : "";
      const weapons = r ? [wp === "None" ? "" : wp, wa === "None" ? "" : wa].filter(Boolean).join("; ") : "";
      const showSpecies = faction?.requiresSpecies && !list.freePlay;
      // Each carried person is a tap target: the title shows, a popover reveals
      // the rule. Popover is position:absolute, so opening it shifts nothing.
      const carryMarkup = carried.length
        ? `<span class="ru-carry">${icon("personnel", 12)}${carried
            .map(
              (c) => `<details class="hvp-pop"><summary title="What does ${escapeHtml(c.name)} do?">${escapeHtml(c.name)}</summary><span class="hvp-pop-panel"><span class="hvp-pop-name">${escapeHtml(c.name)}</span><span class="hvp-pop-rule">${escapeHtml(c.rule)}</span></span></details>`,
            )
            .join('<span class="ru-carry-sep">,</span> ')}</span>`
        : "";
      const subline = carried.length || (r && list.freePlay);
      return `
      <div class="roster-unit ${r ? "" : "unresolved"}">
        <span class="ru-id">
          <span class="roster-unit-glyph">${r ? massGlyph(r.ship.mass, 22) : icon("warning", 20)}</span>
          <span class="ru-main">
            <input class="unit-name-input" type="text" value="${escapeHtml(u.name ?? "")}" placeholder="${escapeHtml(unitName)}" data-action="unit-name" data-unit="${u.id}" />
            ${subline ? `<span class="ru-sub">${r && list.freePlay ? `<span class="muted">${escapeHtml(r.owner.name)}</span>` : ""}${carryMarkup}</span>` : ""}
            ${showSpecies ? speciesSelect(u) : ""}
          </span>
        </span>
        ${
          r
            ? `<div class="ru-details">
                ${statChips(r.ship, true)}
                ${weapons ? `<span class="ru-weap">${weapons}</span>` : `<span class="ru-weap muted">No weapons</span>`}
              </div>`
            : ""
        }
        <div class="ru-controls">
          ${
            r
              ? `<span class="stepper ru-stepper">
                  <button class="${u.count <= 1 ? "will-remove" : ""}" data-action="unit-count" data-unit="${u.id}" data-delta="-1" title="${u.count <= 1 ? "Remove this unit" : "One fewer ship"}">${icon("minus", 14)}</button>
                  <span class="stepper-count">${u.count}</span>
                  <button data-action="unit-count" data-unit="${u.id}" data-delta="1" ${u.count >= maxCount ? "disabled" : ""} title="One more ship">${icon("plus", 14)}</button>
                </span>`
              : ""
          }
          <span class="roster-unit-cost">${credits(cost)}</span>
          <button class="ru-remove" data-action="remove-unit" data-unit="${u.id}" title="Remove this unit">${icon("trash", 14)}</button>
        </div>
      </div>`;
    })
    .join("");

  // One button showing the current mark; the whole picker lives in a popover so
  // it stops eating a row in the setup band.
  const listImg = list.emblemImage ?? libraryUrl(list.emblemLib);
  const emblemPicker = `
    <details class="emblem-menu">
      <summary class="emblem-current-btn" title="Choose an emblem">${listEmblem(list, 34)}${icon("chevronDown", 14, "emblem-caret")}</summary>
      <div class="emblem-menu-panel">
        <div class="emblem-menu-tools">
          <label class="bar-btn file-btn">${icon("upload", 14)} Upload<input type="file" accept="image/*" data-action="emblem-upload" hidden /></label>
          <button class="bar-btn" data-action="random-emblem">${icon("shuffle", 14)} Random</button>
          ${listImg ? `<button class="bar-btn danger" data-action="clear-emblem-image">${icon("close", 14)} Clear image</button>` : ""}
        </div>
        ${
          list.emblemLib && /\.svg$/i.test(list.emblemLib)
            ? `<div class="emblem-tint-row">
                <span class="control-label">Vector colour</span>
                <button class="tint-swatch tint-none ${!list.emblemColor ? "selected" : ""}" data-action="set-emblem-color" data-color="" title="Original">${icon("close", 12)}</button>
                <button class="tint-swatch tint-ink ${list.emblemColor === "ink" ? "selected" : ""}" data-action="set-emblem-color" data-color="ink" title="Ink" aria-label="Ink"></button>
                <button class="tint-swatch tint-blue ${list.emblemColor === "blue" ? "selected" : ""}" data-action="set-emblem-color" data-color="blue" title="Blue" aria-label="Blue"></button>
                <button class="tint-swatch tint-red ${list.emblemColor === "red" ? "selected" : ""}" data-action="set-emblem-color" data-color="red" title="Red" aria-label="Red"></button>
              </div>`
            : ""
        }
        ${iconLibraryGrid("set-emblem-lib", list.emblemLib)}
      </div>
    </details>`;

  const limitIsPreset = [300, 400, 500].includes(list.fleet.creditsLimit);
  // The cap lives inline as "/500" in the tally itself, not a standing row of
  // buttons — click the cap to change it in a popover.
  const limitControl = `<details class="limit-switch">
      <summary class="mf-tally-cap">/${credits(list.fleet.creditsLimit)}</summary>
      <div class="limit-switch-panel">
        <div class="segment segment-limit" role="group" aria-label="Credits limit">
          ${[300, 400, 500]
            .map(
              (n) =>
                `<button class="${list.fleet.creditsLimit === n ? "selected" : ""}" data-action="set-limit" data-limit="${n}">${credits(n)}</button>`,
            )
            .join("")}
          <input class="limit-input ${limitIsPreset ? "" : "selected"}" type="number" min="1" step="10" value="${limitIsPreset ? "" : list.fleet.creditsLimit}" placeholder="Custom" data-action="set-limit-free" aria-label="Custom credits limit" />
        </div>
      </div>
    </details>`;

  const factionControl = list.freePlay
    ? '<span class="freeplay-badge">All ships unlocked</span>'
    : `<details class="faction-switch">
        <summary>${faction ? escapeHtml(faction.name) : "Choose faction"}</summary>
        <div class="faction-switch-panel">${factionPickerBody}</div>
      </details>`;

  // Overflow menu for the secondary fleet actions (print, share, duplicate,
  // delete). A position:absolute popover so opening it shifts nothing. Play
  // Mode is deliberately NOT in here - it is the primary action and gets its
  // own button at the foot of the manifest.
  const moreMenu = `
    <details class="mf-menu">
      <summary class="mf-menu-btn" title="More actions" aria-label="More actions">${icon("more", 20)}</summary>
      <div class="mf-menu-panel">
        <a href="#/print/${list.id}">${icon("print", 16)} Print setup</a>
        <button data-action="share-list" data-id="${list.id}">${icon("link", 16)} Share link</button>
        <button data-action="duplicate-list" data-id="${list.id}">${icon("duplicate", 16)} Duplicate</button>
        <button class="danger" data-action="delete-list" data-id="${list.id}">${icon("trash", 16)} Delete fleet</button>
      </div>
    </details>`;

  const unitWord = list.fleet.units.length === 1 ? "unit" : "units";
  const hvpCount = list.freePlay
    ? `${list.fleet.hvp.length}`
    : hvpMin === hvpMax
      ? `${list.fleet.hvp.length}/${hvpMax}`
      : `${list.fleet.hvp.length}/${hvpMin}–${hvpMax}`;

  return `
  ${topbar()}
  ${trainingGuide(list.mode)}

  <main class="builder ${remaining < 0 ? "is-over" : ""}">
    <header class="mf-head">
      <div class="mf-headline">
        <span class="mf-emblem">${emblemPicker}</span>
        <input class="mf-name" type="text" value="${escapeHtml(list.fleet.name ?? "")}" placeholder="Untitled fleet" data-action="fleet-name" />
        ${moreMenu}
      </div>
      <div class="mf-budget">
        <span class="mf-tally">
          <span class="mf-tally-now">${credits(total)}</span>${limitControl}
          <span class="mf-tally-free">${remaining < 0 ? `${credits(-remaining)} over` : `${credits(remaining)} free`}</span>
        </span>
        <div class="mf-meter"><span class="mf-meter-fill" style="width:${list.fleet.creditsLimit > 0 ? Math.min(100, (total / list.fleet.creditsLimit) * 100) : 0}%"></span></div>
      </div>
      <div class="mf-subline">
        <span class="mf-fac">${factionControl}</span>
        ${era ? `<span class="mf-sep">/</span><span class="mf-era">${escapeHtml(era)}</span>` : ""}
      </div>
    </header>

    <div class="mf-body">
      <section class="mf-manifest">
        <h3 class="mf-h">Roster <span class="mf-h-count">${list.fleet.units.length} ${unitWord}</span></h3>
        <div class="mf-list">
          ${unitRows || '<p class="mf-empty">Nothing requisitioned yet. Add classes from the yard on the right.</p>'}
        </div>

        ${
          list.freePlay
            ? '<p class="mf-inspect freeplay">Free Play. The rules inspector is off.</p>'
            : issues.length === 0
              ? `<p class="mf-inspect pass">${icon("check", 15)} Legal and ready for the table.</p>`
              : `<div class="mf-inspect fail"><span class="mf-inspect-h">${issues.length} to resolve</span><ul class="issue-list">${issues.map(issueLine).join("")}</ul></div>`
        }

        <a class="mf-play-cta" href="#/play/${list.id}">${icon("flag", 18)} Enter Play Mode</a>

        <details class="mf-notes" ${list.fleet.notes ? "open" : ""}>
          <summary>Notes${list.fleet.notes ? ` <span class="mf-h-count">${list.fleet.notes.trim().length} chars</span>` : ""}</summary>
          <textarea class="notes-input" rows="3" placeholder="Tactics, list rationale, reminders..." data-action="fleet-notes">${escapeHtml(list.fleet.notes ?? "")}</textarea>
        </details>
      </section>

      <section class="mf-yard">
        ${
          faction && !list.freePlay
            ? `<div class="mf-rule">
                <div class="mf-rule-meta">Init <b>${escapeHtml(faction.initiative)}</b> ${initiativeDice(faction.initiative, 13)} <span class="mf-sep">/</span> CMD <b>${escapeHtml(faction.cmdTokens)}</b>/rd</div>
                <div class="mf-rule-name">${escapeHtml(faction.rule.name)}</div>
                <div class="mf-rule-text">${escapeHtml(faction.rule.text)}</div>
              </div>`
            : ""
        }
        <h3 class="mf-h">Ship classes ${
          faction && !list.freePlay
            ? switcher(
                "Ship classes view",
                "set-catalog-view",
                "view",
                [
                  ["list", "List"],
                  ["mass", "By mass"],
                  ["chart", "Compare"],
                ],
                catalogView ?? "list",
              )
            : ""
        }</h3>
        ${
          catalogView === "mass" && faction && !list.freePlay
            ? catalogColumnsByMass(faction, ownedCount)
            : catalogView === "chart" && faction && !list.freePlay
              ? `${catalogChartPicker(chartStat)}${catalogChart(faction, chartStat)}`
              : `<div class="mf-list">${catalogHtml || '<p class="mf-empty">Pick a faction to see its ships.</p>'}</div>`
        }
        <h3 class="mf-h">Personnel pool <span class="mf-h-count">${hvpCount}</span></h3>
        <div class="mf-list personnel-grid">${personnelCatalog}</div>
      </section>
    </div>
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
  const opts = state.ui.print ?? { format: "roster" as const, trackers: false };

  // A ship's silhouette is its starting HP; the tracker prints that many empty
  // boxes to tick off as damage lands.
  const hpBoxes = (hp: number) => `<span class="pr-hp">${Array.from({ length: hp }, () => '<span class="pr-hp-box"></span>').join("")}</span>`;

  const unitNames = unitDisplayNames(list.fleet.units, faction, customs);

  // One continuous unit-row table, in the manner of Army Forge / Infinity Army
  // roster printouts: every unit is one scannable row with stat columns, and
  // per-unit annotations (species, carried personnel) fold into a quiet
  // second line under the unit name rather than their own boxes.
  const unitRows = list.fleet.units
    .map((u, i) => {
      const r = resolveShip(u.shipClassId, faction, customs);
      if (!r) return "";
      const ship = r.ship;
      const title = u.name || unitNames.get(u.id) || ship.name;
      const carried = list.fleet.hvp
        .filter((h) => h.assignedUnitId === u.id)
        .map((h) => {
          const def = hvpById(h.hvpId, faction);
          return h.customName ? `${h.customName}, ${def?.name ?? h.hvpId}` : (def?.name ?? h.hvpId);
        });
      const notes = [
        u.species ? `Species: ${u.species}` : "",
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
    <div class="pr-scroll">
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
    </table>
    </div>`
    : "";

  // Per-unit cards: a stat card each, several to a page, cut-and-keep at the
  // table. Never split across a page. HP boxes appear when trackers are on.
  const unitCards = list.fleet.units
    .map((u, i) => {
      const r = resolveShip(u.shipClassId, faction, customs);
      if (!r) return "";
      const ship = r.ship;
      const title = u.name || unitNames.get(u.id) || ship.name;
      const carried = list.fleet.hvp
        .filter((h) => h.assignedUnitId === u.id)
        .map((h) => {
          const def = hvpById(h.hvpId, faction);
          return h.customName ? `${h.customName}, ${def?.name ?? h.hvpId}` : (def?.name ?? h.hvpId);
        });
      return `
      <article class="print-card">
        <header class="pc-head">
          <span class="pc-index">${i + 1}</span>
          <span class="pc-name">${escapeHtml(title)}</span>
          <span class="pc-cost">${credits(ship.cost * u.count)}</span>
        </header>
        <p class="pc-sub">${u.count}× ${escapeHtml(ship.name)} · Mass ${ship.mass}${u.species ? ` · ${escapeHtml(u.species)}` : ""}</p>
        <table class="pc-stats"><tbody>
          <tr><th>Thrust</th><td>${ship.thrust}"</td><th>Silhouette</th><td>${ship.silhouette}</td><th>Shields</th><td>${ship.shields}</td></tr>
        </tbody></table>
        <p class="pc-weap"><span class="pc-wlabel">${icon("arc-primary", 11, "slot-arc")} Primary</span> ${primarySlotText(ship)}</p>
        <p class="pc-weap"><span class="pc-wlabel">${icon("arc-aux", 11, "slot-arc")} Auxiliary</span> ${auxSlotText(ship)}</p>
        ${carried.length ? `<p class="pc-carry">Carrying: ${escapeHtml(carried.join("; "))}</p>` : ""}
        ${opts.trackers ? `<div class="pc-track">${Array.from({ length: u.count }, () => `<span class="pc-track-row"><span class="pc-track-label">Hull</span>${hpBoxes(ship.silhouette)}</span>`).join("")}</div>` : ""}
      </article>`;
    })
    .join("");

  const cardBlocks = unitCards ? `<div class="print-cards">${unitCards}</div>` : "";

  // A small tracker strip (command tokens, credit balance) for at-table use,
  // shown only when trackers are enabled.
  const cmdCount = faction ? Number(faction.cmdTokens) : NaN;
  const trackerStrip = opts.trackers
    ? `<section class="print-track-strip">
        <div class="pts-item"><span class="pts-label">Command tokens</span>${Number.isFinite(cmdCount) && cmdCount > 0 ? hpBoxes(cmdCount) : `<span class="pts-blank"></span>`}</div>
        <div class="pts-item"><span class="pts-label">${list.mode === "hypergrowth" || list.mode === "management-training" ? "Credit balance" : "Reserve / notes"}</span><span class="pts-blank"></span></div>
      </section>`
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
      <div class="print-opts">
        <span class="segment" role="group" aria-label="Layout">
          <button class="${opts.format === "roster" ? "selected" : ""}" data-action="print-format" data-format="roster">Roster</button>
          <button class="${opts.format === "cards" ? "selected" : ""}" data-action="print-format" data-format="cards">Cards</button>
        </span>
        <label class="print-toggle"><input type="checkbox" data-action="print-trackers" ${opts.trackers ? "checked" : ""} /> Trackers</label>
        <button class="bar-btn" data-action="copy-list-text" data-id="${list.id}">${icon("duplicate", 15)} Copy as text</button>
      </div>
      <button class="cta-btn" data-action="do-print">${icon("print", 17)} Print this document</button>
    </div>

    <article class="sheet">
      <header class="sheet-head">
        <div class="sheet-emblem">${listEmblem(list, 44)}</div>
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

      ${trackerStrip}

      <h2 class="sheet-section">Units</h2>
      ${(opts.format === "cards" ? cardBlocks : unitBlocks) || '<p class="print-note">No units.</p>'}

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
      ${list.fleet.notes ? `<section class="print-notes"><h3 class="sheet-section">Notes</h3><p>${escapeHtml(list.fleet.notes)}</p></section>` : ""}
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
          <button class="ghost-btn" data-action="copy-faction" data-id="${f.id}" title="Copy as JSON to share">${icon("duplicate", 16)}</button>
          <button class="ghost-btn" data-action="export-faction" data-id="${f.id}" title="Download as a file">${icon("download", 16)}</button>
          <button class="ghost-btn danger" data-action="delete-faction" data-id="${f.id}" title="Delete">${icon("trash", 16)}</button>
        </td>
      </tr>`,
    )
    .join("");

  // Starting from an existing faction sits right alongside a blank slate, on
  // equal footing in the same picker, so cloning-then-renaming is at least as
  // easy as starting from nothing.
  const startPlaques = allFactions(state.customFactions)
    .map(
      (f) => `
      <button class="faction-plaque" data-action="clone-faction" data-source="${f.id}">
        <span class="faction-plaque-name">${escapeHtml(f.name)}</span>
        <span class="faction-plaque-rule">${escapeHtml(f.rule.name)}</span>
      </button>`,
    )
    .join("");

  return `
  ${topbar()}
  <main class="foundry-main">
    <h1 class="page-title">Custom Rules</h1>
    <p class="panel-note">You can use this section to <strong>create your own factions</strong>. It may be easiest to just take an existing faction and rename certain elements; for example, taking the Unity and renaming them to "The Empire."</p>
    <div class="foundry-actions">
      <details class="cf-new-picker">
        <summary class="cta-btn">${icon("plus", 18)} Forge a new faction</summary>
        <div class="cf-new-panel">
          <button class="faction-plaque faction-plaque-blank" data-action="new-faction">
            <span class="faction-plaque-name">${icon("plus", 15)} Start from a blank sheet</span>
            <span class="faction-plaque-rule">No ships, no rule, no personnel yet</span>
          </button>
          <div class="faction-plaques">${startPlaques}</div>
        </div>
      </details>
      <label class="bar-btn file-btn">${icon("upload", 16)} Import from a file
        <input type="file" accept="application/json" data-action="import-faction" hidden />
      </label>
      <button class="bar-btn" data-action="paste-faction">${icon("duplicate", 16)} Paste from clipboard</button>
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
    return `${topbar()}<main class="empty-state"><p>That faction was not found.</p><p><a href="#/foundry">Back to Custom Rules</a></p></main>`;

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
        <div class="field-block wide">Ship image
          <div class="cf-shipimg-row">
            <span class="cf-shipimg-preview ${s.image ? "has-img" : ""}">${s.image ? `<img src="${s.image}" alt="" />` : icon("image", 22)}</span>
            <label class="bar-btn file-btn">${icon("upload", 14)} Upload
              <input type="file" accept="image/*" data-action="cf-ship-image-upload" data-ship="${si}" hidden /></label>
            ${s.image ? `<button class="ghost-btn danger" data-action="cf-ship-image-clear" data-ship="${si}" title="Remove image">${icon("close", 14)}</button>` : ""}
          </div>
        </div>
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

// Each phase as a real checklist rather than a paragraph to read and
// interpret yourself - the player ticks steps off as they do them at the
// table. The Initiative step (index 1 of Command Phase) auto-ticks when the
// player uses the Roll button below, since that's an unambiguous 1:1 link;
// everything else is self-reported, because this is a physical miniatures
// game and the app cannot see the table.
interface PhaseGuide {
  name: string;
  steps: string[];
}
const PHASES: PhaseGuide[] = [
  {
    name: "Command Phase",
    steps: [
      "Gain your faction's CMD tokens for the round.",
      "Roll your Initiative Check.",
      "Compare successes — the winner picks who has Initiative this round.",
      "Everyone who didn't win Initiative gains 1 extra CMD token.",
    ],
  },
  {
    name: "Jump Phase",
    steps: [
      "Starting with whoever has Initiative, take turns clockwise.",
      "On your turn: open a Jump Point, Jump In a unit from Reserve, or pass.",
      "Once everyone has passed in a row, the phase ends.",
    ],
  },
  {
    name: "Tactical Phase",
    steps: [
      "Starting with whoever has Initiative, take turns clockwise.",
      'Drag to Select a battlegroup: a lead unit, plus any unactivated friendly units within 6" of it (Combined Mass 10 or less).',
      "Activate every unit in that battlegroup, then pass to the next player.",
      "The phase ends once every unit in play has activated.",
    ],
  },
  {
    name: "End Phase",
    steps: [
      "Check your mission(s) for anything you scored this round.",
      "Clear every Activated token.",
      "Resolve any other End Phase effects your mission or faction calls for.",
      "Discard any unused CMD tokens.",
      "Start the next round.",
    ],
  },
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

  const currentPhase = PHASES[play.phase];
  const checks = play.checks ?? [];
  const doneCount = checks.filter(Boolean).length;
  const phaseDone = currentPhase !== undefined && doneCount === currentPhase.steps.length;

  // A bespoke instance of the switcher pattern (one bordered track, a
  // sliding highlight) rather than the plain switcher() helper, since this
  // one needs a per-option checkmark once that phase's checklist is clear -
  // the four-separate-boxes version this replaced was the single biggest
  // contributor to "too many lines" on this page.
  const phaseBtns = `<div class="switcher" role="group" aria-label="Round phase" style="--switcher-count:${PHASES.length};--switcher-selected:${play.phase}">
    <span class="switcher-thumb" aria-hidden="true"></span>
    ${PHASES.map(
      (p, i) => `
      <button class="switcher-opt ${play.phase === i ? "selected" : ""}" data-action="play-phase" data-phase="${i}">
        <span class="phase-n">${play.phase === i && phaseDone ? icon("check", 13) : i + 1}</span>${p.name.replace(" Phase", "")}
      </button>`,
    ).join("")}
  </div>`;

  const checklistHtml = (currentPhase?.steps ?? [])
    .map(
      (step, i) => `
    <label class="phase-check ${checks[i] ? "done" : ""}">
      <input type="checkbox" data-action="play-check-step" data-index="${i}" ${checks[i] ? "checked" : ""} />
      <span>${escapeHtml(step)}</span>
    </label>`,
    )
    .join("");

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
        <div class="readout readout-primary"><span class="readout-label">${scoreLabel}</span><span class="readout-value">${play.vp}</span></div>
        <div class="readout readout-quiet"><span class="readout-label">Opponent</span><span class="readout-value">${play.oppVp}</span></div>
        <div class="readout readout-accent"><span class="readout-label">CMD</span><span class="readout-value">${play.cmd}</span></div>
      </div>
    </div>
  </section>
  <main class="solo-body">
    <div class="phase-track">${phaseBtns}</div>
    <div class="phase-checklist">
      <div class="phase-checklist-head">
        <h3 class="phase-checklist-title">${escapeHtml(currentPhase?.name ?? "")}</h3>
        <span class="phase-checklist-count">${doneCount} of ${currentPhase?.steps.length ?? 0}</span>
      </div>
      ${checklistHtml}
      ${
        play.phase === 2
          ? `<p class="phase-diagram-caption">Primary weapons only fire in the narrow cone dead ahead; auxiliary weapons cover the whole front half.</p>${tacticalDiagram("arcs")}`
          : ""
      }
    </div>

    <div class="solo-grid" style="margin-top:20px">
      <section class="solo-card solo-card-primary">
        <h3 class="roster-section">Counters</h3>
        <div class="play-counters">
          ${counter("Round", play.round, "play-round")}
          ${counter("CMD tokens", play.cmd, "play-cmd")}
          ${counter(scoreLabel, play.vp, "play-vp")}
          ${counter("Opponent " + scoreLabel.toLowerCase(), play.oppVp, "play-oppvp")}
        </div>
        <div class="roster-actions" style="padding:14px 0 0">
          <button class="cta-btn" data-action="play-next">${icon("chevronRight", 16)} Next phase</button>
          <button class="ghost-btn danger" data-action="play-reset">Reset the game</button>
        </div>
      </section>

      <section class="solo-card solo-card-quiet">
        <h3 class="roster-section">Initiative check</h3>
        <p class="panel-note">${faction ? `${escapeHtml(faction.name)} rolls ${escapeHtml(faction.initiative)}.` : ""} A 2 or 3 counts as one success; a 1 counts as two. Most successes chooses who has Initiative; non-winners gain 1 CMD token.</p>
        <button class="bar-btn" data-action="play-initiative" data-dice="${faction ? escapeHtml(faction.initiative) : "3D6"}">Roll ${faction ? escapeHtml(faction.initiative) : "3D6"}</button>
        ${
          last && last.table.startsWith("Initiative check")
            ? `<div class="roll-result"><div class="roll-die">${last.value}</div><div class="roll-body"><p class="roll-table">${escapeHtml(last.table)}</p><p class="roll-headline">${escapeHtml(last.result)}</p>${last.detail ? `<p class="roll-detail">${escapeHtml(last.detail)}</p>` : ""}</div></div>`
            : ""
        }
      </section>

      <section class="solo-card solo-card-quiet">
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
  const grouped = f.sort === "faction";
  // Clickable sort headers, each showing icon AND text. Click a column to sort
  // by it; click Faction to fold back into groups. No sort dropdown.
  const sortH = (key: string, ico: string, label: string) =>
    `<th class="comp-stat comp-sortable ${f.sort === key ? "sorted" : ""}" data-action="ship-sort" data-sort="${key}" title="Sort by ${label}">${icon(ico, 13, "stat-ico")}<span class="comp-hlabel">${label}</span></th>`;
  const textH = (key: string, label: string) =>
    `<th class="comp-sortable ${f.sort === key ? "sorted" : ""}" data-action="ship-sort" data-sort="${key}">${label}</th>`;
  const statHeaders = `${sortH("mass", "stat-mass", "Mass")}${sortH("thrust", "stat-thrust", "Thr")}${sortH("silhouette", "stat-silhouette", "Sil")}${sortH("shields", "stat-shields", "Shd")}`;

  // A ship's data cells (stats + weapons + cost), shared by both layouts.
  const shipCells = (r: CompRow) => `
    <td class="comp-num">${r.mass}</td>
    <td class="comp-num">${r.thrust}"</td>
    <td class="comp-num">${r.silhouette}</td>
    <td class="comp-num">${r.shields}</td>
    <td class="comp-weap">${r.primary || '<span class="muted">None</span>'}</td>
    <td class="comp-weap">${r.auxiliary || '<span class="muted">None</span>'}</td>
    <td class="comp-num comp-cost">${r.costLabel}</td>`;

  // Grouped by faction (the default): a full-width faction bar, then its ships,
  // with the redundant Faction/Era columns dropped. Sorted by a stat instead:
  // a flat list with a faction tag, so cross-faction comparison stays global.
  let bodyHtml: string;
  if (grouped) {
    const groups: { key: string; name: string; era: string; rows: CompRow[] }[] = [];
    for (const r of shown) {
      let g = groups[groups.length - 1];
      if (!g || g.key !== r.factionKey) {
        g = { key: r.factionKey, name: r.factionName, era: r.era, rows: [] };
        groups.push(g);
      }
      g.rows.push(r);
    }
    bodyHtml = groups
      .map(
        (g) => `
        <tr class="comp-group"><td colspan="8"><span class="cg-name">${escapeHtml(g.name)}</span><span class="cg-era">${escapeHtml(g.era)}</span><span class="cg-count">${g.rows.length} ${g.rows.length === 1 ? "ship" : "ships"}</span></td></tr>
        ${g.rows.map((r) => `<tr><td class="comp-name">${escapeHtml(r.name)}</td>${shipCells(r)}</tr>`).join("")}`,
      )
      .join("");
  } else {
    bodyHtml = shown
      .map(
        (r) => `<tr><td class="comp-name">${escapeHtml(r.name)}</td><td class="comp-fac">${escapeHtml(r.factionName)}</td>${shipCells(r)}</tr>`,
      )
      .join("");
  }

  const headRow = grouped
    ? `<tr>${textH("name", "Ship")}${statHeaders}<th>Primary</th><th>Auxiliary</th>${textH("cost", "Cost")}</tr>`
    : `<tr>${textH("name", "Ship")}${textH("faction", "Faction")}${statHeaders}<th>Primary</th><th>Auxiliary</th>${textH("cost", "Cost")}</tr>`;
  const colspan = grouped ? 8 : 9;

  return `
  ${topbar()}
  <main class="compendium">
    <header class="comp-head">
      <h1 class="page-title">Ship Compendium</h1>
      <p class="panel-note">Every ship in the game. Grouped by faction, or sort by any stat to compare across the whole galaxy.</p>
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
      ${f.era || f.faction || f.mass || f.q ? '<button class="ghost-btn" data-action="ship-filter-clear">Clear filters</button>' : ""}
    </div>

    <p class="comp-count">${shown.length} of ${rows.length} ships</p>
    <div class="table-scroll comp-scroll">
      <table class="comp-table ${grouped ? "grouped" : ""}">
        <thead>${headRow}</thead>
        <tbody>${bodyHtml || `<tr><td colspan="${colspan}" class="muted" style="padding:20px">No ships match these filters.</td></tr>`}</tbody>
      </table>
    </div>
  </main>
  ${toast(state)}
  ${footer()}`;
}

// ---------------------------------------------------------------------------
// Root
// ---------------------------------------------------------------------------

// A first-visit coachmark: a small white popover anchored to a live element
// (positioned in main.ts, since this app re-renders as a plain HTML string).
// Hidden until positioning finds its target, so it never flashes at 0,0.
function tourPopover(state: AppState): string {
  const active = activeTour(state);
  if (!active) return "";
  const { tour, step } = active;
  const s = tour.steps[step];
  if (!s) return "";
  const dots = tour.steps
    .map((_, i) => `<span class="tour-dot ${i === step ? "on" : ""}"></span>`)
    .join("");
  const isLast = step >= tour.steps.length - 1;
  return `
  <div class="tour-pop" data-target="${escapeHtml(s.selector)}">
    <div class="tour-pop-arrow"></div>
    <div class="tour-head">
      <h4 class="tour-title">${escapeHtml(s.title)}</h4>
      <button class="tour-close" data-action="tour-dismiss" data-tour="${tour.id}" aria-label="Close">${icon("close", 16)}</button>
    </div>
    <p class="tour-body">${escapeHtml(s.body)}</p>
    <div class="tour-foot">
      <span class="tour-dots">${dots}</span>
      <button class="tour-next" data-action="tour-next" data-tour="${tour.id}" data-step="${step}" data-len="${tour.steps.length}" aria-label="${isLast ? "Done" : "Next"}">${icon(isLast ? "check" : "chevronRight", 16)}</button>
    </div>
  </div>`;
}

export function render(state: AppState): string {
  const body = (() => {
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
  })();
  return `${body}${tourPopover(state)}`;
}
