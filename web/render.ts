import type { Era, Faction, FleetUnit, GameMode, Hvp, ShipClass, Weapon } from "../src/types.ts";
import { ALLIANCE_SPECIES, DAMAGE_BY_DIE, MODE_BUILDER_SHAPE } from "../src/types.ts";
import { validateFleet, type ValidationIssue } from "../src/validation.ts";
import { GENERIC_HVP } from "../src/data/index.ts";
import { JUNKSPACE_SHIPS } from "../src/data/junkspace.ts";
import { allFactions, factionsByEra, findFaction, makeCatalog, ERA_ORDER } from "./catalog.ts";
import { auxSlotText, credits, escapeHtml, formatDate, primarySlotText, ruleText } from "./format.ts";
import {
  commandToken,
  diceRow,
  emblemMark,
  icon,
  initiativeDice,
  massGlyph,
  statChips,
  tacticalDiagram,
} from "./icons.ts";
import { iconLibraryControls, iconLibraryGrid, libraryUrl } from "./emblems.ts";
import { CHANGELOG } from "./changelog.ts";
import { FACTION_LORE } from "./faction-lore.ts";
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
  /** Lead paragraph. Verbatim from the rulebook. */
  text?: string;
  /** Sub-points / table rows the book prints as a bulleted or tabulated list. */
  points?: string[];
  diagram?: "deployment" | "arcs";
}

// The two Basic Training scenarios, transcribed VERBATIM from the rulebook
// (Combat Simulator p.62-64, Management Training p.65-68), not summarised. The
// book's own section headings are the step titles, and sub-rules the book
// prints as lists are carried in `points`. Only mechanical smoothing is applied:
// dropped "see page XX" cross-references, and the circled-M mass symbol rendered
// as Ⓜ. This is the source of both the on-screen guide and the printable "Steps"
// sheet, so a player reads the real, complete rules either way.
const TRAINING_GUIDES: Partial<Record<GameMode, { intro: string; steps: GuideStep[]; notes: GuideStep[] }>> = {
  "combat-simulator": {
    intro:
      "This scenario is intended as a two-player tutorial, to be played as your first game of A Billion Suns. It is a simple era of play that provides a pre-set fleet, a limited set of ship classes, and simple setup and victory conditions. It focuses on teaching you the basics of activating your fleet: moving and attacking. Combat Simulator operates in basically the same way as Armageddon and so acts as a tutorial for that era of play too. To play, you either build your own ¢300bn fleet or use the Training Fleet. At the start of the game, all your units start in your Reserves area, and will be jumped in during the first Round.",
    steps: [
      {
        title: "Setup",
        text: 'Clear a play area roughly 4 feet by 3 feet. Pick or roll for a Central Objective and place it in the middle of the board. Deploy 3 Jump Points for each player, according to the setup diagram: the two flank Jump Points sit at the table\'s side edges, 5" in from your own edge and 24" apart; the central Jump Point is 15" in from your own edge, on the centreline.',
        diagram: "deployment",
      },
      {
        title: "Central Objective",
        text: "Pick or roll for a Central Objective and place a single object of the selected type in the centre of the play area.",
        points: ["D6 1-2: ComSat", "D6 3-4: Facility", "D6 5-6: Planetoid"],
      },
      {
        title: "High Value Personnel",
        text: "Before the game, gather three High Value Personnel (HVP) tokens or miniatures that are distinguishable as belonging to you. Place them on friendly ships of Mass 1 or higher. HVP tokens are asset tokens. Units can carry any number of HVP tokens. All three of your HVP are Seasoned Captains.",
        points: [
          "Seasoned Captain: Units in this unit's battlegroup can use the Red Alert command for 0 CMD, once per Round.",
          "Red Alert (1 CMD): When a friendly ship without an Activated token would be destroyed, spend 1 CMD token: it isn't destroyed, and regains Ⓜ HP instead. At the end of your next activation, if this ship is still in play, it is reduced to 0HP, and you cannot use Red Alert to save it.",
        ],
      },
      {
        title: "Special rules",
        points: [
          "Initiative Checks: During Basic Training, your Initiative Value is 3D6.",
          "Rapid Ingress: All units Jump In during the Round 1 Jump Phase.",
          "Blockading Objectives: You can Blockade enemy Jump Points and the central objective. (Blockading a Jump Point doesn't affect who it belongs to, or stop its owner from Jumping In or Jump Hopping with it.) While you have the greatest Combined Mass of friendly ships within 6\" of an objective, you are Blockading it. In the case of a tie, the player with the greatest number of friendly ships within 6\" is Blockading it. (In the case of a further tie, no player is Blockading it.)",
        ],
      },
      {
        title: "Victory points",
        points: [
          "In each End Phase: gain 2VP for each enemy flank Jump Point you are blockading.",
          "Gain 5VP if you are blockading the enemy's central Jump Point.",
          "Gain 3VP if you are blockading the central objective.",
          "At the end of the game: gain 2VP for each enemy HVP token you are carrying.",
        ],
      },
      {
        title: "Game end and victory",
        text: "The game ends at the end of Round 4 and the player with the most VP is the winner.",
      },
    ],
    notes: [
      {
        title: "Carrying Squadrons",
        text: "When you deploy your Heavy Cruiser or Frigate, you can load units of Fighters and Bombers into them, or you can deploy those units directly. A unit can carry a number of Squadrons up to twice its Combined Mass, so the Heavy Cruiser can carry up to six Fighter or Bomber Wings; the Frigate can carry four; and a unit of three Corvettes can carry up to six.",
      },
    ],
  },
  "management-training": {
    intro:
      "This scenario is intended as a two-player tutorial, to be played as your second game of A Billion Suns, once you have played the Combat Simulator scenario. It focuses on teaching you the basics of managing your resources: requisitioning and jumping in ships as and where you need them, as well as playing across multiple tables. Management Training operates very similarly to the Hypergrowth game mode and so acts as a tutorial for that.",
    steps: [
      {
        title: "Shipyard",
        text: "At the start of a game of Management Training, the ships in your Training Fleet start in your Shipyard, and must be requisitioned before you can jump them in. When you requisition your Heavy Cruiser or Frigate, you can load units of Fighters and Bombers into them, or you can deploy those units individually. The Heavy Cruiser can carry two units of Mass 0 ships, the Frigate can carry one. You can pick and choose from the ships in your Shipyard to form units of any size you like, deciding only at the point you requisition them.",
      },
      {
        title: "Setup",
        text: "Divide your play area into two roughly equal sections (or use two different surfaces, like a table and a counter-top) to represent two separate Sectors of space. You can't fly ships between these two Sectors, you have to Jump Hop between them.",
        points: [
          "ComSats: Deploy 3 ComSats, the first anywhere on the first Sector and the other two anywhere on the other Sector.",
          "Jump Points: Each player starts the game with 3 Jump Points in their supply.",
          "Start the game: Once you have the tables and ComSats set up, begin Round 1.",
        ],
      },
      {
        title: "Initiative Checks",
        text: "During Basic Training, your Initiative Value is 3D6.",
      },
      {
        title: "Requisitioning units",
        text: "You start with no units in play and nothing in Reserve; the ships in your fleet are all in your Shipyard. You must spend credits (initially putting you into debt) to Requisition units from your Shipyard. In the Jump Phase, when you want to jump in a unit, first requisition it: spend a CMD token to use the Requisition command, check off the ships from your Roster Sheet, and jump the appropriate miniatures into play. You start with 0 credits, and recover that expenditure by earning credits from the objectives. There are a maximum of ¢100bn credits available to earn on each of the three game rounds, so be careful not to spend outside your means.",
      },
      {
        title: "Reinforcements",
        text: "When a ship is destroyed, it returns to your Shipyard and can be requisitioned again as a reinforcement. This represents the massive wealth and construction power of your corporation. If you are prepared to keep paying for more ships, you can keep deploying more ships: just keep an eye on your balance sheet.",
      },
      {
        title: "Earning credits",
        points: [
          "Secure Sectors: In each End Phase, you gain ¢20bn for each Sector you control. You control a Sector if you are the player with the greatest number of ships in that Sector. In the case of a tie, the tied player with the greatest Combined Mass in that Sector controls it.",
          "Infowar: In each End Phase, you gain ¢20bn for each ComSat you are Blockading.",
        ],
      },
      {
        title: "Winning the game",
        text: "At the end of the third game round, the game ends and the player with the most credits is the winner.",
      },
    ],
    notes: [],
  },
};

// `firstSession` opens the band outright for a player who has never been here;
// after that it collapses to its title bar, because a tutorial you have already
// read is a wall of text between you and the builder. The steps inside keep
// their own open/closed state either way.
function trainingGuide(mode: GameMode, firstSession: boolean): string {
  const g = TRAINING_GUIDES[mode];
  if (!g) return "";
  const pointsHtml = (points?: string[]) =>
    points && points.length
      ? `<ul class="guide-points">${points.map((p) => `<li>${ruleText(p)}</li>`).join("")}</ul>`
      : "";
  const stepHtml = (s: GuideStep, n?: number) => `
      <details class="guide-step ${n ? "" : "guide-step-note"}" ${n === 1 ? "open" : ""}>
        <summary>${n ? `<span class="guide-step-n">${n}</span>` : ""}${escapeHtml(s.title)}</summary>
        <div class="guide-step-body">
          ${s.text ? `<p>${ruleText(s.text)}</p>` : ""}
          ${pointsHtml(s.points)}
          ${s.diagram ? tacticalDiagram(s.diagram) : ""}
        </div>
      </details>`;
  const steps = g.steps.map((s, i) => stepHtml(s, i + 1)).join("");
  const notes = g.notes.map((s) => stepHtml(s)).join("");
  return `
  <section class="guide-band">
    <details class="guide-shell" data-persist="guide" ${firstSession ? "open" : ""}>
      <summary class="guide-title">${icon("book", 16)} Guided tutorial</summary>
      <div class="guide-inner">
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
    </details>
  </section>`;
}

// A dense, fully-expanded print rendering of the same guide content used by
// trainingGuide() above - full sentences in a numbered list, not collapsible
// chips, so it reads as an at-table reference sheet rather than a UI widget.
function trainingPrintBlocks(mode: GameMode): string {
  const g = TRAINING_GUIDES[mode];
  if (!g) return "";
  const subPoints = (points?: string[]) =>
    points && points.length
      ? `<ul class="ref-list ref-subpoints">${points.map((p) => `<li>${ruleText(p)}</li>`).join("")}</ul>`
      : "";
  const stepItems = g.steps
    .map(
      (s) => `<li><b>${escapeHtml(s.title)}${s.text ? ":" : ""}</b>${s.text ? " " + ruleText(s.text) : ""}${subPoints(
        s.points,
      )}${s.diagram ? tacticalDiagram(s.diagram) : ""}</li>`,
    )
    .join("");
  const noteItems = g.notes
    .map((s) => `<li><b>${escapeHtml(s.title)}:</b> ${ruleText(s.text ?? "")}${subPoints(s.points)}</li>`)
    .join("");
  return `
    <p class="print-guide-intro">${ruleText(g.intro)}</p>
    <div class="ref-block">
      <ol class="ref-list ref-list-numbered">${stepItems}</ol>
    </div>
    ${
      noteItems
        ? `<h3 class="sheet-section">Good to know</h3>
           <p class="print-note" style="padding:0 0 8px">Rules that apply throughout the game, not a step you take once.</p>
           <div class="ref-block"><ul class="ref-list">${noteItems}</ul></div>`
        : ""
    }`;
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

// The sliding highlight that marks the current page is aria-hidden decoration.
// enhanceNav() in main.ts already resolves which item the route lands on, so it
// sets aria-current there rather than every caller threading the route in here.
function topbar(): string {
  return `
  <header class="topbar">
    <a class="wordmark" href="#/">${icon("logo", 26)}<span class="wordmark-text">A Billion Suns 2e</span><span class="wordmark-sub">Shipyard</span></a>
    <nav class="topnav" aria-label="Main">
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
      <a href="./ABS-2E-Quick-Reference.pdf" target="_blank" rel="noopener">${icon("scroll", 13)} Quick Reference</a>${sep}
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
        ${row("04", "#/fleets", "Learn to Play", "A guided tutorial battle with a ready-made Training Fleet: setup, every phase, and scoring, walked through step by step.", "new-training", 'data-mode="combat-simulator"')}
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
  // Training lists (Combat Simulator, Management Training) are their own thing:
  // launched from Learn to Play, never saved into your fleets and never loaded
  // from here. They stay out of this list entirely.
  const lists = [...state.lists]
    .filter((l) => l.mode !== "combat-simulator" && l.mode !== "management-training")
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  const cards = lists
    .map((l, i) => {
      const faction = findFaction(l.fleet.factionId, state.customFactions);
      const { total } = listTotals(l, state.customFactions);
      return `
      <article class="fleet-card" style="--i:${i}">
        <a class="fleet-card-open" href="#/list/${l.id}" aria-label="Open ${escapeHtml(l.fleet.name || "Unnamed fleet")}">
          <span class="fleet-card-emblem">${listEmblem(l, 40)}</span>
          <span class="fleet-card-body">
            <span class="fleet-card-name">${escapeHtml(l.fleet.name || "Unnamed fleet")}</span>
            <span class="fleet-card-faction">${escapeHtml(faction?.name ?? "Mixed forces")}</span>
          </span>
        </a>
        <div class="fleet-card-meta">
          <span class="fleet-card-mode">${l.freePlay ? "Free Play" : MODE_LABEL[l.mode]}</span>
          <span class="fleet-card-cost">${credits(total)}</span>
        </div>
        <div class="fleet-card-foot">
          <span class="fleet-card-date">Updated ${formatDate(l.updatedAt)}</span>
          <span class="fleet-card-actions">
            <button class="ghost-btn" data-action="duplicate-list" data-id="${l.id}" title="Duplicate this fleet">${icon("duplicate", 16)}</button>
            <button class="ghost-btn" data-action="share-list" data-id="${l.id}" title="Copy a share link">${icon("link", 16)}</button>
            <button class="ghost-btn danger" data-action="delete-list" data-id="${l.id}" title="Delete this fleet">${icon("trash", 16)}</button>
          </span>
        </div>
      </article>`;
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
        ? `<p class="fleets-empty">No fleets built yet.<br /><span class="fleets-empty-sub">All fleets are saved to your browser's cache.</span></p>`
        : `<div class="fleet-cards">${cards}</div>`
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
  const lore = FACTION_LORE[f.id];
  const summary = lore?.summary ?? f.playstyle;
  return `
    <div class="nf-detail">
      <h3 class="nfd-title">${escapeHtml(f.name)}</h3>
      <p class="nfd-era-tag">${escapeHtml(f.era)}</p>
      <div class="nfd-intro">
        ${lore?.tagline ? `<p class="nfd-tagline">${escapeHtml(lore.tagline)}</p>` : ""}
        ${summary ? `<p class="nfd-summary">${escapeHtml(summary)}</p>` : ""}
      </div>
      <div class="nfd-ability">
        <h4 class="nfd-h">Signature ability</h4>
        <p class="nfd-rule"><span class="nfd-rule-name">${escapeHtml(f.rule.name)}.</span> ${ruleText(f.rule.text)}</p>
      </div>
      <div class="nfd-stats">
        <div class="nfd-stat">
          <span class="nfd-stat-label">Initiative</span>
          <span class="nfd-stat-val">${escapeHtml(f.initiative)}</span>
          ${diceRow(f.initiative, 22)}
        </div>
        <div class="nfd-stat">
          <span class="nfd-stat-label">CMD / round</span>
          <span class="nfd-stat-val">${escapeHtml(f.cmdTokens)} ${commandToken(24, "nfd-cmd-token")}</span>
        </div>
      </div>
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
              <button class="nf-more" data-action="nf-toggle-all">${m.showAll ? "Show fewer" : `${icon("plus", 13)} More Fleets &amp; Custom`}</button>
              ${
                m.showAll
                  ? `<div class="faction-plaques nf-all">${others.map(plaque).join("")}</div>`
                  : ""
              }
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

// An error and a warning used the same glyph and differed only by colour - and
// by a red/amber pair at that, which is the one pair a red-green colour-blind
// reader cannot separate. The severity is now said in words and carries its own
// glyph, so the colour is reinforcement rather than the whole message.
function issueLine(issue: ValidationIssue): string {
  const isError = issue.severity === "error";
  const cls = isError ? "issue-error" : "issue-warning";
  return `<li class="${cls}">${icon(isError ? "close" : "warning", 15)}<span><b class="issue-sev">${
    isError ? "Error" : "Warning"
  }:</b> ${escapeHtml(issue.message)}</span></li>`;
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

// A ship's weapons as an aligned column layout: firing arc, name, attack
// dice, range and damage. Built with CSS grid (not a <table>) so column
// widths are fixed by the grid template instead of an HTML table's auto
// layout, which stretches short columns apart with huge, uneven gaps.
function weaponsTable(ship: ShipClass): string {
  // Each weapon is wrapped in its own role="row". Previously the cells were
  // direct children of the role="table" with no row between them, which is
  // invalid ARIA - cells without an owning row get dropped or flattened, so the
  // grid lost its structure entirely for anyone using a screen reader.
  //
  // The row wrapper also carries the responsive layout: five aligned columns on
  // desktop, and on a phone the fixed columns plus gaps come to 184px of a
  // ~196px track, leaving ~12px for the weapon name. There the row reflows -
  // name on its own line, figures beneath it - and each figure shows the inline
  // label that the column header carries on desktop. Nothing is dropped at
  // either size; only which of the two labels is visible changes.
  const row = (w: Weapon, arc: "primary" | "aux") => {
    const arcLabel = arc === "primary" ? "Primary, 45 degree arc" : "Auxiliary, 180 degree arc";
    return `<div class="wt-row" role="row">
      <span class="wt-arc" role="cell"><span class="visually-hidden">${arcLabel}</span>${icon(arc === "primary" ? "arc-primary" : "arc-aux", 11, "slot-arc")}</span>
      <span class="wt-name" role="cell">${escapeHtml(w.name)}</span>
      <span class="wt-num wt-atk" role="cell"><span class="wt-inline-lbl">Attack </span>${w.count}${w.die}</span>
      <span class="wt-num wt-rng" role="cell"><span class="wt-inline-lbl">Range </span>${w.rangeMin}-${w.rangeMax}"</span>
      <span class="wt-num wt-dmg" role="cell"><span class="wt-inline-lbl">Damage </span>${DAMAGE_BY_DIE[w.die]}</span>
    </div>`;
  };
  const rows = [...ship.primary.map((w) => row(w, "primary")), ...ship.auxiliary.map((w) => row(w, "aux"))];
  // Utility Bays / non-weapon fittings that are not in the weapon arrays.
  const notes: string[] = [];
  const pText = primarySlotText(ship);
  const aText = auxSlotText(ship);
  if (ship.primary.length === 0 && pText !== "None") notes.push(pText);
  if (ship.auxiliary.length === 0 && aText !== "None") notes.push(aText);
  if (rows.length === 0 && notes.length === 0) return '<p class="weap-none">No weapons</p>';
  const noteRow = notes.length
    ? `<div class="wt-row wt-noterow" role="row"><span class="wt-arc" role="cell"></span><span class="wt-note" role="cell">${notes
        .map(escapeHtml)
        .join(", ")}</span></div>`
    : "";
  return `<div class="weap-table" role="table" aria-label="Weapons">
    <div class="wt-row wt-headrow" role="row">
      <span class="wt-arc wt-h" role="columnheader"><span class="visually-hidden">Firing arc</span></span><span class="wt-h" role="columnheader">Weapon</span><span class="wt-h wt-num" role="columnheader">Attack</span><span class="wt-h wt-num" role="columnheader">Range</span><span class="wt-h wt-num" role="columnheader">Dmg</span>
    </div>
    ${rows.join("")}${noteRow}
  </div>`;
}

function catalogShipRow(ship: ShipClass, ownerFaction: Faction, composite: boolean, owned = 0): string {
  const addId = composite ? `${ownerFaction.id}/${ship.id}` : ship.id;
  // The whole row is the click target (add a unit), with a standing ADD cue on
  // the right so the affordance is never hover-only. Name and cost on their own
  // line so a long name never gets cut; full stats and weapons always visible.
  // The "owned" count is an absolutely-positioned badge on the glyph, so it
  // appears when you add a unit without reflowing (and shifting) the catalog.
  return `
  <article class="ship-row is-option ${ship.image ? "has-art" : ""}" data-action="add-unit" data-ship="${addId}" role="button" tabindex="0" title="Add a unit of ${escapeHtml(ship.name)}">
    <div class="ship-row-glyph">${ship.image ? `<img class="ship-thumb" src="${ship.image}" alt="" loading="lazy" />` : massGlyph(ship.mass, 22)}${owned > 0 ? `<span class="owned-badge" title="${owned} in fleet">${owned}</span>` : ""}</div>
    <div class="ship-row-body">
      <div class="ship-row-head">
        <h4 class="ship-name">${escapeHtml(ship.name)}</h4>
        <span class="ship-cost">${credits(ship.cost)}</span>
      </div>
      <div class="ship-row-details">
        ${statChips(ship, true)}
      </div>
      ${weaponsTable(ship)}
    </div>
    <span class="add-cue">${icon("plus", 15)}<span>Add</span></span>
  </article>`;
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
    // Combat Simulator does not let you pick personnel: the scenario issues
    // three Seasoned Captains (p.63, transcribed in the guide above). One of
    // each is a fleet-BUILDING rule, and this fleet was not built - so the
    // duplicate check does not apply to it.
    if (list.mode === "combat-simulator") drop.add("HVP_DUPLICATE");
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
        <details class="catalog-group" data-persist="catalog-${f.id}" ${i === 0 ? "open" : ""}>
          <summary>${escapeHtml(f.name)} <span class="muted">${f.era}</span></summary>
          ${f.ships.map((s) => catalogShipRow(s, f, true, ownedCount(`${f.id}/${s.id}`))).join("")}
        </details>`,
      )
      .join("");
  } else if (faction) {
    catalogHtml = faction.ships.map((s) => catalogShipRow(s, faction, false, ownedCount(s.id))).join("");
  }

  // Merged view: catalog filtered to ship classes not yet in fleet.
  const ownedClassIds = new Set(list.fleet.units.map((u) => u.shipClassId));
  let unownedCatalogHtml = "";
  let unownedCount = 0;
  if (list.freePlay) {
    // Free Play keeps its faction grouping (and so its full class list) rather
    // than filtering: a class already in the fleet may legitimately be taken
    // again from another faction's section.
    unownedCatalogHtml = catalogHtml;
    unownedCount = allFactions(customs).reduce((n, f) => n + f.ships.length, 0);
  } else if (faction) {
    const unowned = faction.ships.filter((s) => !ownedClassIds.has(s.id));
    unownedCount = unowned.length;
    unownedCatalogHtml = unowned.map((s) => catalogShipRow(s, faction, false, 0)).join("");
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
        <span class="personnel-rule">${ruleText(h.rule)}</span>
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
    <article class="personnel-row is-option" data-action="add-hvp" data-hvp="${h.id}" role="button" tabindex="0" title="Add ${escapeHtml(h.name)}">
      ${body}
      <span class="add-cue">${icon("plus", 15)}<span>Add</span></span>
    </article>`;
  };
  // Combat Simulator issues a fixed crew rather than offering a choice: "All
  // three of your HVP are Seasoned Captains" (p.63). The picker below is one
  // card per HVP *type*, so it physically cannot show three of one person - it
  // would collapse them to a single card and strand the other two, unremovable,
  // while the counter still read 3/3. The scenario gets its own roster instead:
  // one row per captain issued, each assignable, none removable.
  const isFixedCrew = list.mode === "combat-simulator";
  const fixedCrewRoster = list.fleet.hvp
    .map((sel, i) => {
      const def = hvpById(sel.hvpId, faction);
      if (!def) return "";
      return `
      <article class="personnel-row chosen">
        <div class="personnel-body">
          <span class="personnel-name">${escapeHtml(def.name)}</span>
          <span class="personnel-rule">${ruleText(def.rule)}</span>
        </div>
        <span class="personnel-actions">
          <select class="personnel-assign" data-action="hvp-assign" data-index="${i}" title="Assign a carrier for ${escapeHtml(def.name)}">
            <option value="">Not assigned</option>
            ${carrierOptions(sel.assignedUnitId)}
          </select>
        </span>
      </article>`;
    })
    .join("");

  const personnelCatalog = isFixedCrew
    ? fixedCrewRoster
    : faction
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
      // What this unit is called out loud: the player's own name for it if they
      // gave it one, otherwise the auto-generated one shown in the field.
      const unitLabel = u.name || unitName || r?.ship.name || "this unit";
      const showSpecies = faction?.requiresSpecies && !list.freePlay;
      // Each carried person is a tap target: the title shows, a popover reveals
      // the rule. Popover is position:absolute, so opening it shifts nothing.
      const carryMarkup = carried.length
        ? `<span class="ru-carry">${icon("personnel", 12)}${carried
            .map(
              (c) => `<details class="hvp-pop"><summary title="What does ${escapeHtml(c.name)} do?">${escapeHtml(c.name)}</summary><span class="hvp-pop-panel"><span class="hvp-pop-name">${escapeHtml(c.name)}</span><span class="hvp-pop-rule">${ruleText(c.rule)}</span></span></details>`,
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
                ${weaponsTable(r.ship)}
              </div>`
            : ""
        }
        <div class="ru-controls">
          ${
            r
              ? // Every stepper on the roster used to announce the identical
                // "One fewer ship" / "One more ship", so with eight units a
                // screen reader heard the same two strings sixteen times with
                // no way to tell which unit it was on. The unit's name goes in
                // the label. At the cap the (+) is aria-disabled rather than
                // disabled: a disabled button cannot hold focus, so pressing it
                // up to the limit threw focus to the top of the document.
                `<span class="stepper ru-stepper">
                  <button class="${u.count <= 1 ? "will-remove" : ""}" data-action="unit-count" data-unit="${u.id}" data-delta="-1" aria-label="${u.count <= 1 ? `Remove ${escapeHtml(unitLabel)}` : `One fewer ship in ${escapeHtml(unitLabel)}`}" title="${u.count <= 1 ? "Remove this unit" : "One fewer ship"}">${icon("minus", 14)}</button>
                  <span class="stepper-count">${u.count}</span>
                  <button data-action="unit-count" data-unit="${u.id}" data-delta="1" ${
                    u.count >= maxCount ? 'aria-disabled="true"' : ""
                  } aria-label="${
                    u.count >= maxCount
                      ? `${escapeHtml(unitLabel)} is at its maximum of ${maxCount} ships`
                      : `One more ship in ${escapeHtml(unitLabel)}`
                  }" title="${u.count >= maxCount ? `Maximum ${maxCount} ships in a unit` : "One more ship"}">${icon("plus", 14)}</button>
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
        <button data-action="copy-list-text" data-id="${list.id}">${icon("scroll", 16)} Copy as text</button>
        <button data-action="duplicate-list" data-id="${list.id}">${icon("duplicate", 16)} Duplicate</button>
        <button class="danger" data-action="delete-list" data-id="${list.id}">${icon("trash", 16)} Delete fleet</button>
      </div>
    </details>`;

  const unitWord = list.fleet.units.length === 1 ? "unit" : "units";
  // A fixed crew is not a tally against a cap - there is nothing to fill.
  const hvpCount = isFixedCrew
    ? "Issued by the scenario"
    : list.freePlay
      ? `${list.fleet.hvp.length}`
      : hvpMin === hvpMax
        ? `${list.fleet.hvp.length}/${hvpMax}`
        : `${list.fleet.hvp.length}/${hvpMin}–${hvpMax}`;

  return `
  ${topbar()}
  ${trainingGuide(list.mode, state.onboarding.visits <= 1)}

  <main class="builder mf-preview-merged ${remaining < 0 ? "is-over" : ""}">
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
        ${
          // A legal fleet says nothing worth a standing line: silence is the
          // confirmation, and the line is only spent when there is something to
          // resolve. Free Play still announces itself, because "no rules check"
          // is not the absence of a result, it is a different result.
          list.freePlay
            ? '<p class="yard-status is-muted">Free Play, no rules check</p>'
            : issues.length > 0
              ? `<details class="yard-status-pop">
                  <summary class="yard-status is-fail">${icon("warning", 12)} ${issues.length} to resolve</summary>
                  <ul class="yard-status-panel issue-list">${issues.map(issueLine).join("")}</ul>
                </details>`
              : ""
        }
        ${
          faction && !list.freePlay
            ? `<div class="mf-rule">
                <div class="mf-rule-meta">Init <b>${escapeHtml(faction.initiative)}</b> ${initiativeDice(faction.initiative, 13)} <span class="mf-sep">/</span> CMD <b>${escapeHtml(faction.cmdTokens)}</b>/rd</div>
                <div class="mf-rule-name">${escapeHtml(faction.rule.name)}</div>
                <div class="mf-rule-text">${ruleText(faction.rule.text)}</div>
              </div>`
            : ""
        }
        <h3 class="mf-h">Ships <span class="mf-h-count">${list.fleet.units.length} ${unitWord}</span>${
          faction && !list.freePlay
            ? switcher(
                "Ship classes view",
                "set-catalog-view",
                "view",
                [
                  ["list", "List"],
                  ["chart", "Compare"],
                ],
                catalogView ?? "list",
              )
            : ""
        }</h3>
        ${
          catalogView === "chart" && faction && !list.freePlay
            ? `${catalogChartPicker(chartStat)}${catalogChart(faction, chartStat)}`
            : `<div class="mf-list">
                ${unitRows}
                ${
                  // An empty fleet needs the catalog open - it is the only thing
                  // to do. Once units are aboard the catalog is a wall of rows
                  // between the roster and everything below it, so it folds away
                  // behind its own title until asked for.
                  !unownedCatalogHtml
                    ? list.fleet.units.length === 0
                      ? '<p class="mf-empty">Pick a faction and add ships below.</p>'
                      : ""
                    : list.fleet.units.length === 0
                      ? unownedCatalogHtml
                      : `<details class="mf-addships" data-persist="addships">
                          <summary class="mf-sub-h">${icon("plus", 14)} Add ships <span class="mf-h-count">${unownedCount} ${unownedCount === 1 ? "class" : "classes"}</span></summary>
                          ${unownedCatalogHtml}
                        </details>`
                }
              </div>`
        }
        <h3 class="mf-h">High-Value Personnel <span class="mf-h-count">${hvpCount}</span></h3>
        <div class="mf-list personnel-grid">${personnelCatalog}</div>

        <details class="mf-notes" data-persist="notes" ${list.fleet.notes ? "open" : ""}>
          <summary>Notes${list.fleet.notes ? ` <span class="mf-h-count">${list.fleet.notes.trim().length} chars</span>` : ""}</summary>
          <textarea class="notes-input" rows="3" placeholder="Tactics, list rationale, reminders..." data-action="fleet-notes">${escapeHtml(list.fleet.notes ?? "")}</textarea>
        </details>
      </section>
    </div>

    <a class="mf-play-cta" href="#/play/${list.id}">${icon("flag", 18)} Enter Play Mode</a>
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
  const opts = state.ui.print ?? { format: "roster" as const, trackers: false, rules: true };
  // Shipyard-shape modes (Hypergrowth, Management Training) don't bring a
  // fixed pre-built roster to the table (p.122): the printed sheet is a
  // shopping catalogue of what's in the Shipyard, requisitioned piecemeal
  // over the game, not a list of units already committed to the fight.
  const isShipyard = MODE_BUILDER_SHAPE[list.mode] === "shipyard";

  // A ship's silhouette is its starting HP; the tracker prints that many empty
  // boxes to tick off as damage lands.
  const hpBoxes = (hp: number) => `<span class="pr-hp">${Array.from({ length: hp }, () => '<span class="pr-hp-box"></span>').join("")}</span>`;

  const unitNames = unitDisplayNames(list.fleet.units, faction, customs);

  // One continuous unit-row table, in the manner of Army Forge / Infinity Army
  // roster printouts: every unit is one scannable row with stat columns, and
  // per-unit annotations (species, carried personnel) fold into a quiet
  // second line under the unit name rather than their own boxes.
  const unitRows = list.fleet.units
    .map((u) => {
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
      // Player-given ship names are cosmetic but they are how the player refers
      // to the ship at the table, so the sheet has to carry them. Blank slots in
      // a partially-named stack are dropped rather than printed as gaps.
      const named = (u.shipNames ?? []).slice(0, u.count).filter((n) => n && n.trim());
      // One hull-tracker box group per ship in the stack, so a 4-ship unit gets
      // four separately-trackable damage tallies, not one shared box.
      const trackCell = opts.trackers
        ? `<td class="pr-track">${Array.from({ length: u.count }, () => `<span class="pr-track-ship">${hpBoxes(ship.silhouette)}</span>`).join("")}</td>`
        : "";
      // Shipyard modes: one checkbox per ship, ticked off as each is
      // requisitioned into play over the course of the game (p.122).
      const reqCell = isShipyard
        ? `<td class="pr-req">${Array.from({ length: u.count }, () => `<span class="pr-req-box"></span>`).join("")}</td>`
        : "";
      return `
      <tr>
        <td class="pr-unit">
          <span class="pr-unit-name">${escapeHtml(title)}</span>
          <span class="pr-unit-class">${escapeHtml(ship.name)}${list.freePlay ? `, ${escapeHtml(r.owner.name)}` : ""}</span>
          ${named.length ? `<span class="pr-unit-ships">${escapeHtml(named.join(" / "))}</span>` : ""}
          ${notes ? `<span class="pr-unit-notes">${escapeHtml(notes)}</span>` : ""}
        </td>
        <td class="pr-num">${u.count}</td>
        <td class="pr-num">${ship.mass}</td>
        <td class="pr-num">${ship.thrust}"</td>
        <td class="pr-num">${ship.silhouette}</td>
        <td class="pr-num">${ship.shields}</td>
        <td class="pr-weap">${primarySlotText(ship)}</td>
        <td class="pr-weap">${auxSlotText(ship)}</td>
        <td class="pr-num pr-cost">${credits(ship.cost)}</td>
        <td class="pr-num pr-cost">${credits(ship.cost * u.count)}</td>
        ${reqCell}
        ${trackCell}
      </tr>`;
    })
    .join("");

  const rosterColCount = 9 + (isShipyard ? 1 : 0) + (opts.trackers ? 1 : 0);
  const unitBlocks = unitRows
    ? `
    <div class="pr-scroll">
    <table class="print-roster">
      <thead>
        <tr>
          <th>${isShipyard ? "Ship class" : "Unit"}</th><th>${isShipyard ? "In Shipyard" : "Ships"}</th><th>Mass</th><th>Thrust</th><th>Sil.</th><th>Shields</th>
          <th>Primary weapons</th><th>Auxiliary weapons</th><th>Cost each</th><th>Total</th>${isShipyard ? "<th>Requisitioned</th>" : ""}${opts.trackers ? "<th>Hull tracker</th>" : ""}
        </tr>
      </thead>
      <tbody>${unitRows}</tbody>
      <tfoot>
        <tr><td colspan="9" class="pr-total-label">Total</td><td class="pr-num pr-cost">${credits(total)}</td>${Array.from({ length: rosterColCount - 9 }, () => "<td></td>").join("")}</tr>
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
      const named = (u.shipNames ?? []).slice(0, u.count).filter((n) => n && n.trim());
      return `
      <article class="print-card">
        <header class="pc-head">
          <span class="pc-index">${i + 1}</span>
          <span class="pc-name">${escapeHtml(title)}</span>
          <span class="pc-cost">${credits(ship.cost * u.count)}</span>
        </header>
        <p class="pc-sub">${u.count}× ${escapeHtml(ship.name)} · ${massGlyph(ship.mass, 13)} Mass ${ship.mass}${u.species ? ` · ${escapeHtml(u.species)}` : ""}</p>
        ${named.length ? `<p class="pc-ships">${escapeHtml(named.join(" / "))}</p>` : ""}
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
        <p>${ruleText(def.rule)}</p>
      </section>`;
    })
    .join("");

  // The project's single interpunct lives in this subtitle, and its single
  // em-dash lives in the attribution line below. Nowhere else, ever.
  const subtitle = `${escapeHtml(faction?.name ?? "Mixed forces")}${era ? ` · ${era}` : ""}`;
  const guideAvailable = !!TRAINING_GUIDES[list.mode];

  return `
  ${topbar()}
  <div class="print-page">
    <div class="print-toolbar">
      <a class="bar-btn" href="#/list/${list.id}">Back to the builder</a>
      <div class="print-opts">
        <span class="segment" role="group" aria-label="Layout">
          <button class="${opts.format === "roster" ? "selected" : ""}" data-action="print-format" data-format="roster">Roster</button>
          <button class="${opts.format === "cards" ? "selected" : ""}" data-action="print-format" data-format="cards">Cards</button>
          ${guideAvailable ? `<button class="${opts.format === "guide" ? "selected" : ""}" data-action="print-format" data-format="guide">Steps</button>` : ""}
        </span>
        <label class="print-toggle"><input type="checkbox" data-action="print-trackers" ${opts.trackers ? "checked" : ""} /> Trackers</label>
        <label class="print-toggle"><input type="checkbox" data-action="print-rules" ${opts.rules ? "checked" : ""} /> Rules</label>
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
          <p class="sheet-date">${formatDate(new Date().toISOString())}</p>
        </div>
      </header>

      ${
        faction && opts.rules
          ? `<section class="print-rule">
              <h3>Faction rule: ${escapeHtml(faction.rule.name)}</h3>
              <p>${ruleText(faction.rule.text)}</p>
              <p class="print-note">Initiative ${escapeHtml(faction.initiative)}. Command tokens each round: ${escapeHtml(faction.cmdTokens)}.</p>
            </section>`
          : ""
      }

      ${trackerStrip}

      ${
        opts.format === "guide" && guideAvailable
          ? `<h2 class="sheet-section">How to play</h2>${trainingPrintBlocks(list.mode)}`
          : `<h2 class="sheet-section">${isShipyard ? "Shipyard" : "Units"}</h2>${(opts.format === "cards" ? cardBlocks : unitBlocks) || '<p class="print-note">No units.</p>'}`
      }

      ${
        // The Steps sheet is a how-to-play handout, not a fleet record: HVP
        // rules and a score table belong on the roster the player brings to the
        // table, not stapled to the back of the tutorial. An empty HVP section
        // is dropped outright rather than printing a header over "None selected".
        opts.format === "guide"
          ? ""
          : `
      ${hvpBlocks ? `<h2 class="sheet-section">High-Value Personnel</h2>${hvpBlocks}` : ""}

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
          <tr><th>Notes</th>${cells}<td></td></tr>
        </tbody>
      </table>`;
      })()}`
      }
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
    <div class="cf-title-row">
      <h1 class="page-title">${escapeHtml(f.name)}</h1>
      ${
        f.ships.length
          ? `<button class="bar-btn" data-action="open-new-fleet-with-faction" data-faction="${f.id}">${icon("flag", 14)} Build a fleet with this faction</button>`
          : ""
      }
    </div>

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
        ${faction ? `<h4 class="ref-sub">${escapeHtml(faction.rule.name)}</h4><p class="rule-card-text">${ruleText(faction.rule.text)}</p>` : ""}
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
  // data-label carries each column's heading down into the cell, so the mobile
  // card layout can label every value in place once the <thead> is off-screen.
  const shipCells = (r: CompRow) => `
    <td class="comp-num" data-label="Mass">${r.mass}</td>
    <td class="comp-num" data-label="Thrust">${r.thrust}"</td>
    <td class="comp-num" data-label="Silhouette">${r.silhouette}</td>
    <td class="comp-num" data-label="Shields">${r.shields}</td>
    <td class="comp-weap" data-label="Primary">${r.primary || '<span class="muted">None</span>'}</td>
    <td class="comp-weap" data-label="Auxiliary">${r.auxiliary || '<span class="muted">None</span>'}</td>
    <td class="comp-num comp-cost" data-label="Cost">${r.costLabel}</td>`;

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
    // A build-with-this-faction deep link into the actual builders: Junkspace
    // ships route to Solo (there is no fleet list for them), everyone else to
    // the New Fleet modal, pre-selected.
    const buildLink = (g: { key: string; name: string }) =>
      g.key === "__junkspace__"
        ? `<a class="cg-build" href="#/solo">${icon("book", 13)} Build an outfit</a>`
        : `<button class="cg-build" data-action="open-new-fleet-with-faction" data-faction="${g.key}">${icon("flag", 13)} Build a fleet</button>`;
    bodyHtml = groups
      .map(
        (g) => `
        <tr class="comp-group"><td colspan="8"><span class="cg-name">${escapeHtml(g.name)}</span><span class="cg-era">${escapeHtml(g.era)}</span><span class="cg-count">${g.rows.length} ${g.rows.length === 1 ? "ship" : "ships"}</span>${buildLink(g)}</td></tr>
        ${g.rows.map((r) => `<tr><td class="comp-name">${escapeHtml(r.name)}</td>${shipCells(r)}</tr>`).join("")}`,
      )
      .join("");
  } else {
    bodyHtml = shown
      .map(
        (r) =>
          `<tr><td class="comp-name">${escapeHtml(r.name)}</td><td class="comp-fac" data-label="Faction">${escapeHtml(r.factionName)}</td>${shipCells(r)}</tr>`,
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
