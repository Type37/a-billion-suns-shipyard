import type { Era, Faction, FleetUnit, GameMode, Hvp, ShipClass, Weapon } from "../src/types.ts";
import { ALLIANCE_SPECIES, DAMAGE_BY_DIE, MODE_BUILDER_SHAPE } from "../src/types.ts";
import { validateFleet, type ValidationIssue } from "../src/validation.ts";
import { GENERIC_HVP } from "../src/data/index.ts";
import { JUNKSPACE_SHIPS } from "../src/data/junkspace.ts";
import { TRAINING_FLEET } from "../src/data/training-fleet.ts";
import { ACTIVATION_STEPS, CORE_ACTIONS, CORE_COMMANDS, ROUND_PHASES } from "../src/data/commands.ts";
import { deriveCommandEffects, effectiveCost } from "../src/command-effects.ts";
import type { CommandCostChange, CommandEffects, RuleSource } from "../src/command-effects.ts";
import { allFactions, factionsByEra, findFaction, makeCatalog, ERA_ORDER } from "./catalog.ts";
import { auxSlotText, credits, escapeHtml, formatDate, primarySlotText, ruleText } from "./format.ts";
import {
  commandRow,
  diceRow,
  emblemMark,
  fleetsMark,
  optionsMark,
  icon,
  statChips,
  tacticalDiagram,
} from "./icons.ts";
import {
  ICON_CATEGORIES,
  LIB_PAGE,
  categoryLabel,
  iconLibraryGrid,
  libraryIcon,
  libraryUrl,
  matchCount,
} from "./emblems.ts";
import pkg from "../package.json";
import { learnDiagram } from "./diagrams.ts";
import { FACTION_LORE } from "./faction-lore.ts";
import type { AppState } from "./state.ts";
import { activeList, activeOutfit, DEFAULT_PRINT, PAPER } from "./state.ts";
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
// as ⓜ. This is the source of both the on-screen guide and the printable "Steps"
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
          "Red Alert (1 CMD): When a friendly ship without an Activated token would be destroyed, spend 1 CMD token: it isn't destroyed, and regains ⓜ HP instead. At the end of your next activation, if this ship is still in play, it is reduced to 0HP, and you cannot use Red Alert to save it.",
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

/**
 * Every rule actually in play for a list: the faction rule plus each carried
 * HVP's rule. Feeds the command reader, so the command lists can show what this
 * particular fleet's rules do to them instead of telling the player to go and
 * look it up mid-game.
 */
function rulesInPlay(list: SavedList, faction: Faction | undefined): RuleSource[] {
  const rules: RuleSource[] = faction ? [{ name: faction.rule.name, text: faction.rule.text }] : [];
  for (const sel of list.fleet.hvp) {
    const def = hvpById(sel.hvpId, faction);
    if (def) rules.push({ name: def.name, text: def.rule });
  }
  return rules;
}

/** Effects of this list's rules on the command list. */
function commandEffectsFor(list: SavedList, faction: Faction | undefined): CommandEffects {
  return deriveCommandEffects(rulesInPlay(list, faction));
}

/** "0 CMD" / "1 CMD", with the qualifiers a rule attaches. */
function costChangeSuffix(change: CommandCostChange): string {
  const bits = [change.scope, change.limit].filter(Boolean).join(", ");
  return bits ? ` (${ruleText(bits)})` : "";
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

export const EMBLEM_BG: Record<string, string> = {
  ink: "var(--ink)",
  blue: "var(--blue)",
  red: "var(--red)",
  steel: "#5b6472",
  sand: "#caa96a",
};

interface EmblemFields {
  emblem?: string;
  emblemImage?: string;
  emblemLib?: string;
  emblemColor?: string;
  emblemBg?: string;
}

// The bare sigil: a tinted vector (SVG + chosen colour, painted via CSS mask),
// or the shared emblemMark for uploads / raster marks / built-in glyphs.
/**
 * A faction's rule and its two per-round numbers, as one block: the rule on the
 * left, Initiative over CMD / round on the right.
 *
 *   Faction rule        | Initiative    3D6
 *                       | CMD / round   7
 *
 * Used everywhere a faction rule appears - the picker, the builder's roster, the
 * printed sheet and Play Mode - so the three facts that describe a faction are
 * always in the same arrangement rather than three different ones per screen.
 */
function factionRuleBlock(f: Faction, size: "full" | "compact" = "full"): string {
  const glyph = size === "full" ? 18 : 13;
  // The compact variant drops Initiative. Every place it is used sits next to a
  // "Roll 3D6" button that already states the value and is the thing you press,
  // so printing it again beside the button was the same number twice a few
  // pixels apart. The full variant keeps it - there is no roll button there.
  const initiative =
    size === "full"
      ? `<div class="frv">
        <span class="frv-label">Initiative</span>
        <span class="frv-figure"><span class="frv-value">${escapeHtml(f.initiative)}</span>${diceRow(f.initiative, glyph)}</span>
      </div>`
      : "";
  return `
  <div class="frule frule-${size}">
    <div class="frule-main">
      <h4 class="frule-name">${escapeHtml(f.rule.name)}</h4>
      <p class="frule-text">${ruleText(f.rule.text)}</p>
    </div>
    <div class="frule-vitals">
      ${initiative}
      <div class="frv">
        <span class="frv-label">CMD / round</span>
        <span class="frv-figure"><span class="frv-value">${escapeHtml(f.cmdTokens)}</span>${commandRow(f.cmdTokens, glyph)}</span>
      </div>
    </div>
  </div>`;
}

function renderSigil(e: EmblemFields, size: number, cls = ""): string {
  return emblemMark(e.emblem ?? "delta", e.emblemImage ?? libraryUrl(e.emblemLib), size, cls);
}

// Full emblem: the sigil, optionally on a coloured background tile (so an
// all-white sigil is visible, and any mark can be given a colour ground).
export function emblemView(e: EmblemFields, size: number, cls = ""): string {
  // A near-white mark gets a black tile whether or not anyone asked for one.
  // Without it the sigil is white-on-white and there is simply nothing on the
  // page - which is the actual problem tinting was invented to work around.
  // An explicit choice still wins; this only fills in where none was made.
  const autoDark = !e.emblemBg && !e.emblemImage && e.emblemLib && libraryIcon(e.emblemLib)?.light;
  const bg = e.emblemBg ? EMBLEM_BG[e.emblemBg] : autoDark ? EMBLEM_BG["ink"] : undefined;
  if (bg) {
    const inSize = Math.round(size * 0.72);
    return `<span class="emblem-bgbox ${cls}" style="width:${size}px;height:${size}px;background:${bg};">${renderSigil(e, inSize)}</span>`;
  }
  return renderSigil(e, size, cls);
}

function listEmblem(l: SavedList, size: number, cls = ""): string {
  return emblemView(l, size, cls);
}

// The sliding highlight that marks the current page is aria-hidden decoration.
// enhanceNav() in main.ts already resolves which item the route lands on, so it
// sets aria-current there rather than every caller threading the route in here.
function topbar(): string {
  return `
  <header class="topbar">
    <a class="wordmark" href="#/">${icon("logo", 26)}<span class="wordmark-text">A Billion Suns 2e</span><span class="wordmark-sub">Shipyard</span></a>
    <!--
      On a phone the five nav targets fold into a menu behind the hamburger; on
      desktop the summary is hidden and the nav is the usual flat row (.nav-fold).
    -->
    <details class="nav-fold">
      <summary class="nav-fold-btn" aria-label="Menu">${icon("menu", 20)}<span class="nav-fold-label">Menu</span></summary>
      <nav class="topnav" aria-label="Main">
        <span class="nav-pill" aria-hidden="true"></span>
        <a href="#/fleets">${fleetsMark(17)} Fleets</a>
        <a href="#/solo">${icon("solo", 17)} Solo</a>
        <a href="#/ships">${icon("compendium", 17)} Compendium</a>
        <a href="#/foundry">${icon("custom-rules", 17)} Custom Rules</a>
        <button class="topnav-btn" data-action="open-options" title="Options">${optionsMark(17)} Options</button>
      </nav>
    </details>
  </header>`;
}

function footer(): string {
  // The uniform WarLore builder footer: one centered line. No interpunct
  // separators - the items are spaced apart by the flex gap instead. The version
  // / changelog link lives in the Options dialog now, not here.
  return `
  <footer class="game-info-footer">
    <div class="gif-inner">
      <span class="gif-title">A Billion Suns</span>
      <span>by <a href="https://planetsmashergames.com/a-billion-suns/" target="_blank" rel="noopener">Mike Hutchinson</a>, Osprey Games</span>
      <a href="./ABS-2E-Quick-Reference.pdf" target="_blank" rel="noopener">${icon("scroll", 13)} Quick Reference</a>
      <span class="gif-builder">Fleet builder by <a class="wl-sig" href="https://linktr.ee/warlore" target="_blank" rel="noopener">WarLore</a></span>
      <a href="mailto:warlore1@outlook.com">Send Feedback</a>
      <a href="https://github.com/Type37/a-billion-suns-shipyard" target="_blank" rel="noopener">Source on GitHub</a>
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
        ${row("02", "#/solo", "Solo Play", "Play the Junkspace in solo/campaign mode.")}
        ${row("03", "#/ships", "Ship Compendium", "Compare all ships and stats.")}
        ${row("04", "#/learn", "Learn to Play", "A guided walkthrough of the rules.")}
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
          <span class="fleet-card-emblem">${listEmblem(l, 52)}</span>
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
            <button class="card-act" data-action="duplicate-list" data-id="${l.id}" title="Duplicate this fleet" aria-label="Duplicate this fleet">${icon("ix-duplicate", 18)}</button>
            <button class="card-act" data-action="share-list" data-id="${l.id}" title="Copy a share link" aria-label="Copy a share link">${icon("ix-share", 18)}</button>
            <button class="card-act is-danger" data-action="delete-list" data-id="${l.id}" title="Delete this fleet" aria-label="Delete this fleet">${icon("ix-trash", 18)}</button>
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
        ? `<p class="fleets-empty">No fleets yet.</p>`
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
  const slogan = lore?.tagline;
  // Custom factions have no slogan on file; fall back to their own playstyle
  // blurb so their panel is not left blank.
  const fallback = slogan ? undefined : f.playstyle;
  // Era keys the title's desktop entrance animation (see animateFactionTitle in
  // main.ts): hyper = decode, arma = slam, everything else = wipe. The era class
  // also carries the resting colour and, for Armageddon, the red underline, so
  // the title looks right without JS (mobile, reduced-motion, unrelated repaint).
  const eraKey = f.era === "Hypergrowth" ? "hyper" : f.era === "Armageddon" ? "arma" : "unity";
  const name = escapeHtml(f.name);
  return `
    <div class="nf-detail">
      <h3 class="nfd-title nfd-title--${eraKey}" data-anim-title data-era="${eraKey}" data-title="${name}" aria-label="${name}">${name}<span class="nfd-underline" aria-hidden="true"></span></h3>
      <p class="nfd-era-tag">${escapeHtml(f.era)}</p>
      <div class="nfd-intro">
        ${slogan ? `<p class="nfd-tagline ${slogan.startsWith(">") ? "nfd-tagline--term" : ""}">${escapeHtml(slogan)}</p>` : ""}
        ${fallback ? `<p class="nfd-summary">${escapeHtml(fallback)}</p>` : ""}
      </div>
      ${factionRuleBlock(f, "full")}
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
  const customIsPreset = [300, 400, 500].includes(m.limit);
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
            <div class="nf-eras" role="group" aria-label="Era">
              ${ERA_ORDER.map((era) => {
                const build = era === "Hypergrowth" ? "Build a Shipyard" : "Build a Fleet List";
                return `<button class="nf-era-btn ${m.era === era ? "on" : ""}" data-action="nf-era" data-era="${era}" aria-pressed="${m.era === era}">
                  <span class="nf-era-name">${escapeHtml(era)}</span>
                  <span class="nf-era-hint">${build}</span>
                </button>`;
              }).join("")}
            </div>
          </div>
          <div class="modal-field">
            <span class="control-label">2 / Credits limit</span>
            <div class="nf-opts">
              ${
                // Hypergrowth is just two choices: ¢300bn or No Limit. No custom
                // cap, no explainer - No Limit means no credit ceiling at all.
                m.era === "Hypergrowth"
                  ? `<button class="nf-opt ${!m.noLimit && m.limit === 300 ? "on" : ""}" data-action="nf-size" data-limit="300">${credits(300)}</button>
                     <button class="nf-opt ${m.noLimit ? "on" : ""}" data-action="nf-nolimit">No Limit</button>`
                  : `${[300, 400, 500].map(sizeBtn).join("")}
              ${
                !customIsPreset || m.customOpen
                  ? `<label class="nf-custom on">Custom
                <input type="number" min="1" step="10" value="${!customIsPreset ? m.limit : ""}" placeholder="¢bn" data-action="nf-size-custom" autofocus /></label>`
                  : `<button type="button" class="nf-custom nf-custom-btn" data-action="nf-size-custom-open">Custom</button>`
              }`
              }
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
/**
 * Weapons for a print card, in the hand-drawn layout: the arc and its glyph
 * beside the weapon name, then range / attack / damage on the line beneath.
 * Deliberately not weaponsTable() - that is a five-column grid built for a
 * screen-width panel, and inside a card three to a page it wastes most of its
 * width on column gutters.
 */
function cardWeapons(ship: ShipClass): string {
  const one = (w: Weapon, arc: "primary" | "aux") => `
    <div class="pcw">
      <div class="pcw-head">
        <span class="pcw-arc">${arc === "primary" ? "PRI" : "AUX"}${icon(arc === "primary" ? "arc-primary" : "arc-aux", 13, "slot-arc")}</span>
        <span class="pcw-name">${escapeHtml(w.name)}</span>
      </div>
      <div class="pcw-figures">
        <span>${w.rangeMin}-${w.rangeMax}"</span>
        <span>${w.count}${w.die}</span>
        <span>DMG ${DAMAGE_BY_DIE[w.die]}</span>
      </div>
    </div>`;
  const rows = [
    ...ship.primary.map((w) => one(w, "primary")),
    ...ship.auxiliary.map((w) => one(w, "aux")),
  ];
  // A fitting or utility bay is not a weapon but it occupies the slot, so the
  // card has to say so rather than leaving the auxiliary line blank.
  if (ship.auxiliary.length === 0 && (ship.auxiliaryFitting || ship.auxiliaryUtility)) {
    rows.push(`
    <div class="pcw">
      <div class="pcw-head">
        <span class="pcw-arc">AUX${icon("arc-aux", 13, "slot-arc")}</span>
        <span class="pcw-name">${escapeHtml(ship.auxiliaryFitting ?? "Utility Bays")}</span>
      </div>
    </div>`);
  }
  return rows.length ? `<div class="pc-weapons">${rows.join("")}</div>` : "";
}

export function weaponsTable(ship: ShipClass): string {
  // Plain lines, not a column table: the book's own notation is
  //   Pri: Cruise Missiles [4D10, 18-36"]
  // so each weapon is one line - an arc glyph, the Pri/Aux label, the name, and
  // the dice and range in brackets. No column headers, no separate DMG column
  // (damage is a fixed lookup from the die, never shown here). An empty slot is
  // an em dash; a utility slot names itself.
  const weaponLine = (w: Weapon, arc: "pri" | "aux") =>
    `<p class="weap-line"><span class="wl-arc">${icon(arc === "pri" ? "arc-primary" : "arc-aux", 13, "slot-arc")}${arc === "pri" ? "Pri" : "Aux"}:</span> <span class="wl-name">${escapeHtml(w.name)}</span> <span class="wl-fig">[${w.count}${w.die}, ${w.rangeMin}–${w.rangeMax}"]</span></p>`;
  const slotLine = (arc: "pri" | "aux", text: string) =>
    `<p class="weap-line"><span class="wl-arc">${icon(arc === "pri" ? "arc-primary" : "arc-aux", 13, "slot-arc")}${arc === "pri" ? "Pri" : "Aux"}:</span> <span class="wl-name">${text}</span></p>`;

  const lines: string[] = [];
  // Primary
  if (ship.primary.length) ship.primary.forEach((w) => lines.push(weaponLine(w, "pri")));
  else {
    const t = primarySlotText(ship);
    lines.push(slotLine("pri", t === "None" ? "—" : escapeHtml(t)));
  }
  // Auxiliary
  if (ship.auxiliary.length) ship.auxiliary.forEach((w) => lines.push(weaponLine(w, "aux")));
  else {
    const t = auxSlotText(ship);
    lines.push(slotLine("aux", t === "None" ? "—" : escapeHtml(t)));
  }
  return `<div class="weap-lines">${lines.join("")}</div>`;
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
    <div class="ship-row-body">
      <div class="ship-row-head">
        <h4 class="ship-name">${escapeHtml(ship.name)}</h4>
        <span class="ship-cost">${credits(ship.cost)}</span>
      </div>
      <div class="ship-row-details">
        ${statChips(ship, true)}
        <!--
          The weapons table is ALWAYS here, whether or not the class is already
          in your fleet. It was briefly swapped for a "weapons on your roster"
          line once you owned one, to stop the same grid being drawn twice on
          one screen. That was a bad trade twice over: it took the stats off the
          thing you were deciding whether to buy more of, and because the
          substitute line is shorter than the table, the row COLLAPSED by ~50px
          the instant you clicked ADD - so the catalogue jumped under your
          cursor at the exact moment you were using it. A row must be the same
          height before and after you press its button.
        -->
        ${weaponsTable(ship)}
      </div>
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


// ---------------------------------------------------------------------------
// Hypergrowth Shipyard  (spec: HYPERGROWTH-SHIPYARD.md)
// ---------------------------------------------------------------------------
// A dedicated single-column screen, not the two-column Fleet-List builder. In
// Hypergrowth you do not build a fleet: you buy a POOL of ships and form units
// later, at requisition, at the table ("Construct Your Shipyard"). So there are
// no units, no unit-size caps, no battlegroups here; ¢300bn is an OWNERSHIP cap,
// not money spent (the Credits Tracker starts the game at zero, in play). Top to
// bottom: masthead, faction block, sticky budget bar, ship list (every class,
// ascending mass), personnel (7 faction + 5 generic, choose up to three).

// One class in the pool: name and cost adjacent on the first line with the
// quantity stepper, then every stat and both weapons always visible below. The
// row is the same height whatever the count, so pressing a stepper never reflows
// it (the stepper keys on the class, so focus survives the 0<->1 boundary too).
function shipyardShipRow(s: ShipClass, count: number): string {
  const zero = count < 1;
  // data-roster-key (not data-key) so the count-change pop animation in main.ts
  // picks these rows up, same as the fleet-list roster.
  return `
  <article class="sy-ship" data-roster-key="syship-${s.id}">
    <div class="sy-ship-head">
      <h4 class="sy-ship-name">${escapeHtml(s.name)}</h4>
      <span class="sy-ship-cost">${credits(s.cost)}</span>
      <span class="stepper sy-qty">
        <button data-action="sy-dec" data-ship="${s.id}" ${zero ? 'aria-disabled="true"' : ""} aria-label="One fewer ${escapeHtml(s.name)}" title="One fewer">${icon("minus", 14)}</button>
        <span class="stepper-count ${zero ? "is-zero" : ""}">${count}</span>
        <button data-action="sy-inc" data-ship="${s.id}" aria-label="One more ${escapeHtml(s.name)}" title="One more">${icon("plus", 14)}</button>
      </span>
    </div>
    <div class="sy-ship-data">
      ${statChips(s, true)}
      ${weaponsTable(s)}
    </div>
  </article>`;
}

// One person: the name and its verbatim rule, then a single square control on
// the RIGHT (an HVP is one or nothing - not a stepper). Chosen rows fill the
// square; at the three-chosen cap the remaining squares are aria-disabled so a
// tap is visibly refused. The square is a fixed box whether it shows a plus or a
// tick, so toggling it never changes the row's width.
function shipyardHvpRow(h: Hvp, chosen: boolean, atCap: boolean, generic = false): string {
  const disabled = !chosen && atCap;
  const label = chosen
    ? `Remove ${h.name}`
    : disabled
      ? `${h.name} unavailable, three personnel already chosen`
      : `Choose ${h.name}`;
  // Generics stay in the one flat list but read a touch quieter (slightly greyer,
  // slightly smaller) so a faction's own HVP feel the more characterful pick.
  return `
  <article class="sy-hvp ${chosen ? "is-chosen" : ""} ${generic ? "is-generic" : ""}" data-key="syhvp-${h.id}">
    <div class="sy-hvp-body">
      <span class="sy-hvp-name">${escapeHtml(h.name)}</span>
      <span class="sy-hvp-rule">${ruleText(h.rule)}</span>
    </div>
    <button class="sy-hvp-check ${chosen ? "is-on" : ""}" data-action="sy-hvp-toggle" data-hvp="${h.id}" aria-pressed="${chosen}" ${disabled ? 'aria-disabled="true"' : ""} aria-label="${escapeHtml(label)}" title="${chosen ? "Chosen" : "Choose"}">${icon(chosen ? "check" : "plus", 16)}</button>
  </article>`;
}

function shipyardView(state: AppState): string {
  const list = activeList(state);
  if (!list)
    return `${topbar()}<main class="empty-state"><p>That fleet was not found.</p><p><a href="#/">Back to the register</a></p></main>`;

  const customs = state.customFactions;
  const faction = findFaction(list.fleet.factionId, customs);
  const { total, remaining } = listTotals(list, customs);
  const cap = list.fleet.creditsLimit;
  const unlimited = list.unlimitedShipyards === true;
  const over = !unlimited && remaining < 0;
  const pct = !unlimited && cap > 0 ? Math.min(100, (total / cap) * 100) : 0;

  // Masthead chrome, the same pieces the Fleet-List builder uses.
  const emblemPicker = `<button class="emblem-current-btn" data-action="open-emblem-modal" data-target="list" title="Choose an emblem">${listEmblem(list, 46)}${icon("pencil", 12, "emblem-edit-cue")}</button>`;
  const moreMenu = `
    <details class="mf-menu">
      <summary class="mf-menu-btn" title="Fleet options: share, duplicate, delete" aria-label="Fleet options">${icon("more", 18)}</summary>
      <div class="mf-menu-panel">
        <button data-action="share-list" data-id="${list.id}">${icon("ix-share", 16)} Share link</button>
        <button data-action="copy-list-text" data-id="${list.id}">${icon("scroll", 16)} Copy as text</button>
        <button data-action="duplicate-list" data-id="${list.id}">${icon("ix-duplicate", 16)} Duplicate</button>
        <button class="danger" data-action="delete-list" data-id="${list.id}">${icon("ix-trash", 16)} Delete fleet</button>
      </div>
    </details>`;

  // Faction picker (identical to the builder's), so you can switch faction here.
  const byEra = factionsByEra(customs);
  const customIds = new Set(customs.map((c) => c.id));
  const factionOption = (f: Faction) => `
      <button class="faction-plaque ${f.id === list.fleet.factionId && !list.freePlay ? "selected" : ""}" data-action="set-faction" data-faction="${f.id}">
        <span class="faction-plaque-name">${escapeHtml(f.name)}</span>
        <span class="faction-plaque-rule">${escapeHtml(f.rule.name)}</span>
      </button>`;
  const factionSection = (label: string, fs: Faction[]) =>
    fs.length
      ? `<div class="faction-era-group"><p class="faction-era-label">${escapeHtml(label)}</p><div class="faction-plaques">${fs.map(factionOption).join("")}</div></div>`
      : "";
  const factionPickerBody =
    ERA_ORDER.map((e) => factionSection(e, (byEra.get(e) ?? []).filter((f) => !customIds.has(f.id)))).join("") +
    factionSection("Custom", allFactions(customs).filter((f) => customIds.has(f.id)));
  const factionControl = list.freePlay
    ? '<span class="freeplay-badge">All ships unlocked</span>'
    : `<details class="faction-switch">
        <summary>${faction ? escapeHtml(faction.name) : "Choose faction"}</summary>
        <div class="faction-switch-panel">${factionPickerBody}</div>
      </details>`;

  // The cap is the control: click it for a popover with the only two choices,
  // ¢300bn or No Limit. No explainer text - No Limit means no credit ceiling.
  const capControl = `<details class="limit-switch sy-cap">
      <summary>${unlimited ? "No Limit" : `of ${credits(cap)}`}</summary>
      <div class="limit-switch-panel">
        <div class="nf-opts">
          <button class="nf-opt ${!unlimited ? "on" : ""}" data-action="sy-cap-limited">${credits(300)}</button>
          <button class="nf-opt ${unlimited ? "on" : ""}" data-action="sy-cap-nolimit">No Limit</button>
        </div>
      </div>
    </details>`;

  // Ship list: every class in the faction, ascending mass. The pool holds a
  // count per class (zero when unowned). Unlimited Shipyards is not "cap lifted":
  // Every class in the faction, ascending mass. No Limit does NOT hide the list:
  // it just means every ship is available with no credit ceiling, so the whole
  // list stays visible and you can still stock a pool if you want.
  const held = (shipId: string) => list.fleet.units.find((u) => u.shipClassId === shipId)?.count ?? 0;
  const ships = faction && !list.freePlay ? [...faction.ships].sort((a, b) => a.mass - b.mass) : [];
  const shipList = ships.length
    ? ships.map((s) => shipyardShipRow(s, held(s.id))).join("")
    : `<p class="mf-empty">Pick a faction to see its ships.</p>`;

  // Personnel: the seven faction HVP and the five generics, in ONE flat list (no
  // heading, no faction/generic split - the generics are always available and
  // the divider was noise). Choose up to three; assignment happens at
  // requisition, not here. A small counter tracks the cap.
  const hvpMax = faction?.hvpMax ?? 3;
  const chosen = new Set(list.fleet.hvp.map((h) => h.hvpId));
  const atCap = chosen.size >= hvpMax;
  const genericIds = new Set(GENERIC_HVP.map((g) => g.id));
  const allHvp = [...(faction?.hvp ?? []), ...GENERIC_HVP];
  const hvpRows = allHvp.map((h) => shipyardHvpRow(h, chosen.has(h.id), atCap, genericIds.has(h.id))).join("");

  return `
  ${topbar()}
  <main class="shipyard ${over ? "is-over" : ""}">
    <header class="sy-head">
      <div class="sy-id">
        <span class="mf-emblem">${emblemPicker}</span>
        <input class="mf-name sy-name" type="text" value="${escapeHtml(list.fleet.name ?? "")}" placeholder="Untitled fleet" data-action="fleet-name" />
        <button class="mf-name-gen" data-action="gen-fleet-name" title="Roll a fleet name" aria-label="Roll a fleet name">${icon("die", 18)}</button>
        ${moreMenu}
      </div>
      <div class="sy-fac">
        <span class="mf-fac">${factionControl}</span>
        <span class="mf-era-badge" title="Era you are building for">Hypergrowth</span>
      </div>
    </header>

    ${faction && !list.freePlay ? `<section class="sy-faction">${factionRuleBlock(faction, "full")}</section>` : ""}

    <div class="sy-budget ${over ? "is-over" : ""}">
      <div class="sy-budget-row">
        <span class="sy-budget-now">${credits(total)}</span>
        <span class="sy-budget-cap">${capControl}</span>
        <span class="sy-budget-free">${
          unlimited ? "No Limit" : over ? `${credits(-remaining)} over` : `${credits(remaining)} remaining`
        }</span>
      </div>
      ${unlimited ? "" : `<div class="sy-meter"><span class="sy-meter-fill" style="width:${pct}%"></span></div>`}
    </div>

    <div class="sy-list sy-ship-list">${shipList}</div>

    ${
      faction && !list.freePlay
        ? `<div class="sy-personnel">
      <p class="sy-hvp-count">Personnel <span>${chosen.size} of ${hvpMax} chosen</span></p>
      <div class="sy-hvp-list">${hvpRows}</div>
    </div>`
        : ""
    }

    <div class="sy-finish mf-finish">
      <a class="mf-play-cta" href="#/play/${list.id}">${icon("flag", 18)} Enter Play Mode</a>
      <a class="mf-print-cta" href="#/print/${list.id}">${icon("print", 18)} Print setup</a>
    </div>
  </main>
  ${toast(state)}
  ${footer()}`;
}

function builderView(state: AppState): string {
  const list = activeList(state);
  if (!list)
    return `${topbar()}<main class="empty-state"><p>That fleet was not found.</p><p><a href="#/">Back to the register</a></p></main>`;

  // Hypergrowth uses its own single-column Shipyard screen, not this two-column
  // Fleet-List builder (see shipyardView and HYPERGROWTH-SHIPYARD.md).
  if (list.mode === "hypergrowth") return shipyardView(state);

  const customs = state.customFactions;
  const faction = findFaction(list.fleet.factionId, customs);
  const { total, remaining } = listTotals(list, customs);
  // Hypergrowth (the only mode with the Unlimited Shipyards toggle) has its own
  // screen now (shipyardView), so nothing that reaches this builder is uncapped.
  const unlimited = false;
  // A Shipyard holds ship CLASSES with a quantity, never units - units are only
  // formed at requisition, in play. So the whole panel drops "unit" language.
  // Declared here because the roster rows below read it.
  const isStocking = MODE_BUILDER_SHAPE[list.mode] === "shipyard";
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
    // Management Training uses the Training Fleet as a Shipyard (p.65): loose
    // ships, no unit-size limit at build time.
    if (list.mode === "management-training") {
      drop.add("UNIT_SIZE_EXCEEDED");
    }
    // HVP is not chosen at build for Management Training (no HVP), nor for Age of
    // Unity, where HVP are deferred until the missions are known and assigned in
    // print/play. Only Armageddon requires HVP chosen pre-play.
    if (list.mode === "management-training" || list.mode === "age-of-unity") {
      drop.add("HVP_COUNT");
    }
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
      <div class="roster-unit ${r ? "" : "unresolved"}" data-roster-key="${u.id}">
        <span class="ru-id">
          ${r ? "" : `<span class="roster-unit-glyph">${icon("warning", 20)}</span>`}
          <span class="ru-main">
            ${
              isStocking
                ? `<span class="ru-classname">${escapeHtml(r?.ship.name ?? unitName)}</span>`
                : `<input class="unit-name-input" type="text" value="${escapeHtml(u.name ?? "")}" placeholder="${escapeHtml(unitName)}" data-action="unit-name" data-unit="${u.id}" />`
            }
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
  const emblemPicker = `<button class="emblem-current-btn" data-action="open-emblem-modal" data-target="list" title="Choose an emblem">${listEmblem(list, 46)}${icon("pencil", 12, "emblem-edit-cue")}</button>`;

  const limitIsPreset = [300, 400, 500].includes(list.fleet.creditsLimit);
  const limitCustomOpen = state.ui.limitCustomOpen === true;
  // Hypergrowth (the only mode offering Unlimited Shipyards and a fixed ¢300 cap)
  // has its own screen; this builder serves the fleet-list / training modes.
  const isHyper = false;
  // The cap lives inline as "/500" in the tally itself, not a standing row of
  // buttons — click the cap to change it in a popover. The popover mirrors the
  // New Fleet modal: the same nf-opt preset buttons and a click-to-open Custom.
  const limitControl = `<details class="limit-switch">
      <summary class="mf-tally-cap">${unlimited ? "∞" : `/${credits(list.fleet.creditsLimit)}`}</summary>
      <div class="limit-switch-panel">
        ${
          isHyper
            ? `<label class="nf-unlimited-toggle">
                <input type="checkbox" data-action="toggle-unlimited-shipyards" ${unlimited ? "checked" : ""} />
                <span class="nf-unlimited-box">${icon("check", 13)}</span>
                <span>Unlimited Shipyards <span class="nf-unlimited-hint">no credit cap</span></span>
              </label>`
            : ""
        }
        <div class="nf-opts ${unlimited ? "is-disabled" : ""}">
          ${(isHyper ? [300] : [300, 400, 500])
            .map(
              (n) =>
                `<button class="nf-opt ${!unlimited && list.fleet.creditsLimit === n ? "on" : ""}" data-action="set-limit" data-limit="${n}" ${unlimited ? "disabled" : ""}>${credits(n)}</button>`,
            )
            .join("")}
          ${
            // Hypergrowth is "just 300, or Unlimited" (no other caps) - so no
            // custom amount there. Every other mode keeps the click-to-open Custom.
            isHyper
              ? ""
              : !limitIsPreset || limitCustomOpen
                ? `<label class="nf-custom on">Custom
              <input type="number" min="1" step="10" value="${!limitIsPreset ? list.fleet.creditsLimit : ""}" placeholder="¢bn" data-action="set-limit-free" autofocus /></label>`
                : `<button type="button" class="nf-custom nf-custom-btn" data-action="open-limit-custom">Custom</button>`
          }
        </div>
      </div>
    </details>`;

  const factionControl = list.freePlay
    ? '<span class="freeplay-badge">All ships unlocked</span>'
    : `<details class="faction-switch">
        <summary>${faction ? escapeHtml(faction.name) : "Choose faction"}</summary>
        <div class="faction-switch-panel">${factionPickerBody}</div>
      </details>`;

  // Overflow menu for the secondary fleet actions (share, duplicate, delete). A
  // position:absolute popover so opening it shifts nothing. Play Mode and Print
  // are deliberately NOT in here - they are the two "you're done building"
  // output actions and get their own buttons at the foot of the manifest.
  const moreMenu = `
    <details class="mf-menu">
      <summary class="mf-menu-btn" title="Fleet options: share, duplicate, delete" aria-label="Fleet options">${icon("more", 18)}</summary>
      <div class="mf-menu-panel">
        <button data-action="share-list" data-id="${list.id}">${icon("ix-share", 16)} Share link</button>
        <button data-action="copy-list-text" data-id="${list.id}">${icon("scroll", 16)} Copy as text</button>
        <button data-action="duplicate-list" data-id="${list.id}">${icon("ix-duplicate", 16)} Duplicate</button>
        <button class="danger" data-action="delete-list" data-id="${list.id}">${icon("ix-trash", 16)} Delete fleet</button>
      </div>
    </details>`;

  const nUnits = list.fleet.units.length;
  const unitWord = isStocking ? (nUnits === 1 ? "ship class" : "ship classes") : nUnits === 1 ? "unit" : "units";
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

  <main class="builder ${!unlimited && remaining < 0 ? "is-over" : ""}">
    <header class="mf-head">
      <!--
        Three groups, each a unit that wraps as a whole: what this fleet IS
        (emblem, name, and the menu that acts on it), what it is BUILT FROM
        (faction and era), and what it COSTS (spent / limit / free). Everything
        used to be one flat run of siblings, so on a phone the ... menu wrapped
        onto a line of its own under the budget and read as an orphan - which is
        what "nothing is logically grouped" meant.
      -->
      <div class="mf-topline">
        <div class="mf-grp mf-grp-id">
          <span class="mf-emblem">${emblemPicker}</span>
          <input class="mf-name" type="text" value="${escapeHtml(list.fleet.name ?? "")}" placeholder="Untitled fleet" data-action="fleet-name" />
          <button class="mf-name-gen" data-action="gen-fleet-name" title="Roll a fleet name" aria-label="Roll a fleet name">${icon("die", 18)}</button>
          ${moreMenu}
        </div>
        <div class="mf-grp mf-grp-fac">
          <span class="mf-fac">${factionControl}</span>
          ${era ? `<span class="mf-era-badge" title="Era you are building for">${escapeHtml(era)}</span>` : ""}
        </div>
        <div class="mf-grp mf-grp-budget">
          <span class="mf-budget">
            <span class="mf-tally">
              <span class="mf-tally-now">${credits(total)}</span>${limitControl}
              <span class="mf-tally-free">${unlimited ? "unlimited" : remaining < 0 ? `${credits(-remaining)} over` : `${credits(remaining)} free`}</span>
            </span>
          </span>
        </div>
      </div>
      <div class="mf-meter"><span class="mf-meter-fill" style="width:${unlimited ? 0 : list.fleet.creditsLimit > 0 ? Math.min(100, (total / list.fleet.creditsLimit) * 100) : 0}%"></span></div>
    </header>

    <div class="mf-body">
      <section class="mf-manifest">
        <h3 class="mf-h">${isStocking ? "Your shipyard" : "Your fleet"} <span class="mf-h-count">${nUnits} ${unitWord}</span></h3>
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
              : `<p class="yard-status is-ok">${icon("check", 12)} Legal</p>`
        }
        <div class="mf-list">
          ${unitRows}
        </div>


        <div class="mf-finish">
          <a class="mf-play-cta" href="#/play/${list.id}">${icon("flag", 18)} Enter Play Mode</a>
          <a class="mf-print-cta" href="#/print/${list.id}">${icon("print", 18)} Print setup</a>
        </div>
      </section>

      <section class="mf-yard">
        ${
          faction && !list.freePlay
            ? `<div class="mf-rule">${factionRuleBlock(faction, "compact")}</div>`
            : ""
        }
        <h3 class="mf-h">Ship classes${
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
            : `<div class="mf-list">${catalogHtml || '<p class="mf-empty">Pick a faction to see its ships.</p>'}</div>`
        }
        ${
          // Age of Unity defers HVP until the missions are known, so they are
          // optional here and assigned later. Armageddon requires them pre-play.
          // (Hypergrowth, the only mode with no HVP at build, has its own screen.)
          `<h3 class="mf-h">High-Value Personnel <span class="mf-h-count">${hvpCount}</span></h3>
        ${list.mode === "age-of-unity" ? '<p class="mf-hvp-note">Optional now. In Age of Unity you assign HVP after the missions are generated.</p>' : ""}
        <div class="mf-list personnel-grid">${personnelCatalog}</div>`
        }
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
  const opts = state.ui.print ?? DEFAULT_PRINT;
  const paper = PAPER[opts.paper] ?? PAPER.letter;
  const excluded = new Set(opts.excluded ?? []);
  // Shipyard-shape modes (Hypergrowth, Management Training) don't bring a
  // fixed pre-built roster to the table (p.122): the printed sheet is a
  // shopping catalogue of what's in the Shipyard, requisitioned piecemeal
  // over the game, not a list of units already committed to the fight.
  const isShipyard = MODE_BUILDER_SHAPE[list.mode] === "shipyard";
  // Age of Unity assigns HVP only after the missions are generated, so the sheet
  // prints every available HVP plus a blank write-in slot on each ship.
  const isUnity = list.mode === "age-of-unity";

  // The printed sheet doubles as the legality check, so the header says whether
  // this list is legal. Same mode-aware relaxations the builder applies (null =
  // Free Play or no faction, i.e. nothing to check).
  const printIssues: number | null = (() => {
    if (list.freePlay || !faction) return null;
    const drop = new Set<string>();
    if (isShipyard) drop.add("UNIT_SIZE_EXCEEDED");
    if (isShipyard || isUnity) drop.add("HVP_COUNT");
    if (list.mode === "combat-simulator") drop.add("HVP_DUPLICATE");
    if (list.mode === "hypergrowth" && list.unlimitedShipyards) drop.add("OVER_BUDGET");
    return validateFleet(list.fleet, makeCatalog(customs)).issues.filter(
      (i) => !drop.has(i.code) && i.severity === "error",
    ).length;
  })();

  // A ship's silhouette is its starting HP; the tracker prints that many empty
  // boxes to tick off as damage lands.
  const hpBoxes = (hp: number) => `<span class="pr-hp">${Array.from({ length: hp }, () => '<span class="pr-hp-box"></span>').join("")}</span>`;

  const unitNames = unitDisplayNames(list.fleet.units, faction, customs);
  // Units the player has dropped from this printout (still in the fleet).
  const printUnits = list.fleet.units.filter((u) => !excluded.has(u.id));

  // HVP ride a unit, and they MOVE: the benefit applies only while an in-play
  // unit carries the token, the token drops as free-floating salvage when the
  // last ship of its unit dies, and an enemy Scan can take it. So a carrier
  // printed as fixed text would be wrong by the second round. Every mode that
  // fields personnel gets a write-in box on each unit; where the carrier is
  // already chosen it is printed faintly as the starting position, with room to
  // strike it out and write the new one.
  const fieldsHvp = isUnity || list.fleet.hvp.length > 0;
  const hvpCarrierCell = (u: FleetUnit): string => {
    if (!fieldsHvp) return "";
    const held = list.fleet.hvp
      .filter((h) => h.assignedUnitId === u.id)
      .map((h) => {
        const def = hvpById(h.hvpId, faction);
        return h.customName ? `${h.customName}, ${def?.name ?? h.hvpId}` : (def?.name ?? h.hvpId);
      });
    return `<td class="pr-hvp-slot">${
      held.length ? `<span class="pr-hvp-start">${escapeHtml(held.join("; "))}</span>` : ""
    }<span class="pr-writein"></span></td>`;
  };

  // One continuous unit-row table, in the manner of Army Forge / Infinity Army
  // roster printouts: every unit is one scannable row with stat columns, and
  // per-unit annotations (species, carried personnel) fold into a quiet
  // second line under the unit name rather than their own boxes.
  const unitRows = printUnits
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
      // Carried personnel used to be repeated here as well as in the HVP
      // column; the column is the one that can be amended mid-game, so this
      // line carries only what the column does not.
      const notes = u.species ? `Species: ${u.species}` : "";
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
      // An unnamed unit takes its ship class as its display name, so printing
      // the class underneath repeated it verbatim - "Hierophant Cathedral Ship"
      // twice, once bold and once grey. The class line is only worth ink when it
      // differs from the title. The count rides in the name ("Epistle-Class
      // Gunship x2") rather than earning a column of its own.
      const showClass = title !== ship.name || list.freePlay;
      const countSuffix = u.count > 1 ? ` <span class="pr-unit-x">&times;${u.count}</span>` : "";
      return `
      <tr>
        <td class="pr-unit">
          <button class="pr-drop" data-action="print-exclude-unit" data-unit="${u.id}" title="Leave this unit out of the printout" aria-label="Leave ${escapeHtml(title)} out of the printout">${icon("close", 12)}</button>
          <span class="pr-unit-name">${escapeHtml(title)}${countSuffix}</span>
          ${showClass ? `<span class="pr-unit-class">${escapeHtml(ship.name)}${list.freePlay ? `, ${escapeHtml(r.owner.name)}` : ""}</span>` : ""}
          ${named.length ? `<span class="pr-unit-ships">${escapeHtml(named.join(" / "))}</span>` : ""}
          ${notes ? `<span class="pr-unit-notes">${escapeHtml(notes)}</span>` : ""}
        </td>
        <td class="pr-num">${ship.mass}</td>
        <td class="pr-num">${ship.thrust}"</td>
        <td class="pr-num">${ship.silhouette}</td>
        <td class="pr-num">${ship.shields}</td>
        <td class="pr-weap">${primarySlotText(ship)}</td>
        <td class="pr-weap">${auxSlotText(ship)}</td>
        <td class="pr-num pr-cost">${credits(ship.cost * u.count)}</td>
        ${reqCell}
        ${trackCell}
        ${hvpCarrierCell(u)}
      </tr>`;
    })
    .join("");

  const unitBlocks = unitRows
    ? `
    <table class="print-roster">
      <thead>
        <tr>
          <th class="pr-unit">${isShipyard ? "Ship class" : "Unit"}</th><th class="pr-num">Mass</th><th class="pr-num">Thrust</th><th class="pr-num">Sil.</th><th class="pr-num">Shields</th>
          <th class="pr-weap">Primary weapons</th><th class="pr-weap">Auxiliary weapons</th><th class="pr-cost">Cost</th>${isShipyard ? '<th class="pr-req">Requisitioned</th>' : ""}${opts.trackers ? '<th class="pr-track">Hull tracker</th>' : ""}${fieldsHvp ? '<th class="pr-hvp-slot">HVP carried</th>' : ""}
        </tr>
      </thead>
      <tbody>${unitRows}</tbody>
    </table>`
    : "";

  // Per-unit cards: a stat card each, several to a page, cut-and-keep at the
  // table. Never split across a page. HP boxes appear when trackers are on.
  const unitCards = printUnits
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
      const named = (u.shipNames ?? []).slice(0, u.count).filter((n) => n && n.trim());
      // Card layout follows the sketch: name and count on one line with the
      // cost, a 2x2 stat block, then each weapon as arc + name over its figures.
      const classLine = title === ship.name ? "" : escapeHtml(ship.name);
      const extras = [classLine, u.species ? escapeHtml(u.species) : ""].filter(Boolean).join(" · ");
      return `
      <article class="print-card">
        <header class="pc-head">
          <span class="pc-name">${escapeHtml(title)}${u.count > 1 ? ` <span class="pc-x">&times;${u.count}</span>` : ""}</span>
          <span class="pc-cost">${credits(ship.cost * u.count)}</span>
          <button class="pr-drop" data-action="print-exclude-unit" data-unit="${u.id}" title="Leave this unit out of the printout" aria-label="Leave ${escapeHtml(title)} out of the printout">${icon("close", 12)}</button>
        </header>
        ${extras ? `<p class="pc-sub">${extras}</p>` : ""}
        <div class="pc-stats-chips">${statChips(ship)}</div>
        ${cardWeapons(ship)}
        ${named.length ? `<p class="pc-ships">${escapeHtml(named.join(" / "))}</p>` : ""}
        ${carried.length ? `<p class="pc-carry">Carrying: ${escapeHtml(carried.join("; "))}</p>` : ""}
        ${
          // One row per ship in the unit, one box per point of Silhouette,
          // because Silhouette is the ship's starting HP (src/types.ts). It
          // used to print as an unheaded block of empty squares, which read as
          // a printing fault rather than a damage tracker. It says what it is
          // now, and each ship's row is numbered so you can tell them apart.
          opts.trackers
            ? `<div class="pc-track">
                 <p class="pc-track-h">Damage <span class="pc-track-sub">one box per HP, cross off as taken</span></p>
                 ${Array.from(
                   { length: u.count },
                   (_, i) =>
                     `<span class="pc-track-row"><span class="pc-track-label">${u.count > 1 ? `Ship ${i + 1}` : "Hull"}</span>${hpBoxes(ship.silhouette)}</span>`,
                 ).join("")}
               </div>`
            : ""
        }
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

  const selectedBlock = (sel: (typeof list.fleet.hvp)[number]) => {
    const def = hvpById(sel.hvpId, faction);
    if (!def) return "";
    const displayName = sel.customName ? `${sel.customName}, ${def.name}` : def.name;
    // Name the starting carrier here as well as in the roster column: the
    // column is where you amend it, this is where you read what it does.
    const carrier = sel.assignedUnitId
      ? (list.fleet.units.find((u) => u.id === sel.assignedUnitId)?.name ??
         unitNames.get(sel.assignedUnitId) ??
         "")
      : "";
    const generic = GENERIC_HVP.some((g) => g.id === sel.hvpId);
    return `
      <section class="print-hvp ${generic ? "is-generic" : ""}">
        <h4>${escapeHtml(displayName)} <span class="print-hvp-slot">${carrier ? `starts on ${escapeHtml(carrier)}` : "carrier: _______________"}</span></h4>
        <p>${ruleText(def.rule)}</p>
      </section>`;
  };
  const isGenericSel = (sel: (typeof list.fleet.hvp)[number]) => GENERIC_HVP.some((g) => g.id === sel.hvpId);
  const hvpBlocks = {
    own: list.fleet.hvp.filter((h) => !isGenericSel(h)).map(selectedBlock).join(""),
    shared: list.fleet.hvp.filter(isGenericSel).map(selectedBlock).join(""),
  };
  const hasHvpBlocks = hvpBlocks.own !== "" || hvpBlocks.shared !== "";

  // Age of Unity: every HVP the faction can field, so you can assign them to the
  // ship slots above once the missions are known. Faction HVP first, then generics.
  const availableHvp: Hvp[] = [...(faction?.hvp ?? []), ...GENERIC_HVP];
  // No "carried by ______" line here. The roster above now has an HVP column
  // per unit, which is where the assignment is actually written and amended, so
  // a second blank on each of these twelve blocks was twelve lines of ink
  // recording the same thing in a worse place.
  // Generic personnel are the shared pool; the faction's own are the ones worth
  // reading first. Printed in the same black, twelve blocks read as one
  // undifferentiated wall, so the generics sit back in grey.
  const hvpEntry = (def: Hvp, generic: boolean) => `
      <section class="print-hvp ${generic ? "is-generic" : ""}">
        <h4>${escapeHtml(def.name)}</h4>
        <p>${ruleText(def.rule)}</p>
      </section>`;
  // Faction personnel fill the left two columns; the generic pool - the same
  // five for everybody - is kept together in the right-hand column so the
  // faction's own are read as a set rather than interleaved with them.
  const availableHvpBlocks = `
    <div class="print-hvp-own">${(faction?.hvp ?? []).map((d) => hvpEntry(d, false)).join("")}</div>
    <div class="print-hvp-shared">${GENERIC_HVP.map((d) => hvpEntry(d, true)).join("")}</div>`;

  // Actions and Commands reference: the full set every fleet can use, so the
  // sheet replaces the rulebook at the table. Requisition is Hypergrowth-only,
  // so it only appears for the Shipyard-shape modes.
  //
  // This fleet's own rules are read (see src/command-effects.ts) and folded in:
  // a discounted command prints at its real cost with the old one struck out, a
  // granted command prints as a full entry alongside the core ones, and a rule
  // that alters a command prints under it. The sheet is meant to replace the
  // rulebook, so it has to answer "what does Red Alert cost ME" without sending
  // the reader off to cross-reference their own faction rule.
  const effects = commandEffectsFor(list, faction);
  const usableCommands = CORE_COMMANDS.filter((c) => !c.shipyardOnly || isShipyard);
  const commandEntry = (name: string, cost: number, text: string, extra: string) =>
    `<dt>${escapeHtml(name)} <span class="print-ref-cost">${cost} CMD</span></dt><dd>${ruleText(text)}${extra}</dd>`;

  const coreEntries = usableCommands
    .map((c) => {
      const { cost, change } = effectiveCost(c.name, c.cost, effects.costChanges);
      const discount = change
        ? `<span class="print-ref-mod">${cost} CMD for you${costChangeSuffix(change)} — ${escapeHtml(change.source)}</span>`
        : "";
      const mods = effects.notes
        .filter((n) => n.command === c.name)
        .map((n) => `<span class="print-ref-mod">${ruleText(n.text)} — ${escapeHtml(n.source)}</span>`)
        .join("");
      // Print the original cost struck through when a rule undercuts it, so the
      // reader can see it IS the discounted one and not a misprint.
      const costCell = change
        ? `<span class="print-ref-cost"><s>${c.cost}</s> ${cost} CMD</span>`
        : `<span class="print-ref-cost">${c.cost} CMD</span>`;
      return `<dt>${escapeHtml(c.name)} ${costCell}</dt><dd>${ruleText(c.text)}${discount}${mods}</dd>`;
    })
    .join("");

  const grantedEntries = effects.granted
    .map((g) => commandEntry(g.name, g.cost, g.text, `<span class="print-ref-mod">from ${escapeHtml(g.source)}</span>`))
    .join("");
  // No separate heading for granted commands: they sit in the one list with the
  // core ones, each already labelled with the rule that granted it.
  const grantedBlock = "";
  const globalBlock = effects.global.length
    ? `<p class="print-ref-note">${effects.global
        .map((n) => `${ruleText(n.text)} <em>(${escapeHtml(n.source)})</em>`)
        .join(" ")}</p>`
    : "";

  const commandsSection = `
      <div class="print-ref-cols">
        <div class="print-ref-col">
          <h4 class="print-ref-h">Actions <span class="print-ref-sub">one per activation</span></h4>
          <dl class="print-ref-list">
            ${CORE_ACTIONS.map((a) => `<dt>${escapeHtml(a.name)}</dt><dd>${ruleText(a.text)}</dd>`).join("")}
          </dl>
        </div>
        <div class="print-ref-col">
          <h4 class="print-ref-h">Commands <span class="print-ref-sub">spend CMD tokens</span></h4>
          ${globalBlock}
          <dl class="print-ref-list">${coreEntries}${grantedEntries}</dl>
          ${grantedBlock}
        </div>
      </div>`;

  // The project's single interpunct lives in this subtitle, and its single
  // em-dash lives in the attribution line below. Nowhere else, ever.
  const subtitle = `${escapeHtml(faction?.name ?? "Mixed forces")}${era ? ` · ${era}` : ""}`;
  const guideAvailable = !!TRAINING_GUIDES[list.mode];

  return `
  ${topbar()}
  <main class="print-page ${opts.inkSaver ? "is-inksaver" : ""}">
    <div class="print-toolbar">
      <a class="bar-btn" href="#/list/${list.id}">${icon("chevronRight", 15, "flip-x")} Back to the builder</a>
      <div class="print-opts">
        <span class="segment" role="group" aria-label="Layout">
          <button class="${opts.format === "roster" ? "selected" : ""}" data-action="print-format" data-format="roster">Roster</button>
          <button class="${opts.format === "cards" ? "selected" : ""}" data-action="print-format" data-format="cards">Cards</button>
          ${guideAvailable ? `<button class="${opts.format === "guide" ? "selected" : ""}" data-action="print-format" data-format="guide">Steps</button>` : ""}
        </span>
        <span class="segment" role="group" aria-label="Paper size">
          <button class="${opts.paper === "letter" ? "selected" : ""}" data-action="print-paper" data-paper="letter">Letter</button>
          <button class="${opts.paper === "a4" ? "selected" : ""}" data-action="print-paper" data-paper="a4">A4</button>
        </span>
        <label class="print-toggle"><input type="checkbox" data-action="print-trackers" ${opts.trackers ? "checked" : ""} /> Trackers</label>
        <label class="print-toggle"><input type="checkbox" data-action="print-rules" ${opts.rules ? "checked" : ""} /> Rules</label>
        <label class="print-toggle" title="No coloured fills, so it survives your browser's Background graphics setting and saves toner"><input type="checkbox" data-action="print-inksaver" ${opts.inkSaver ? "checked" : ""} /> Ink saver</label>
      </div>
      <div class="print-go">
        <span class="print-pagecount" data-print-pagecount>&nbsp;</span>
        <button class="cta-btn" data-action="do-print">${icon("print", 17)} Print</button>
      </div>
    </div>
    ${
      excluded.size
        ? `<p class="print-excluded-note">${excluded.size} ${excluded.size === 1 ? "unit is" : "units are"} left out of this printout. <button class="linklike" data-action="print-include-all">Put them back</button></p>`
        : ""
    }

    <div class="sheet-viewport">
    <article class="sheet" data-print-sheet data-paper-label="${paper.label}" style="--page-w:${paper.w}px;--page-h:${paper.h}px">
      <header class="sheet-head">
        <div class="sheet-emblem">${listEmblem(list, 52)}</div>
        <div class="sheet-title-block">
          <h1 class="sheet-title">${escapeHtml(list.fleet.name || "Unnamed fleet")}</h1>
          <p class="sheet-subtitle">${subtitle}</p>
        </div>
        <div class="sheet-totals">
          <p class="sheet-total-line">${credits(total)}${list.mode === "hypergrowth" && list.unlimitedShipyards ? " · unlimited shipyard" : ` of ${credits(list.fleet.creditsLimit)}`}</p>
          <p class="sheet-count">${list.fleet.units.length} ${list.fleet.units.length === 1 ? "unit" : "units"}</p>
        </div>
      </header>


      ${
        faction && opts.rules
          ? `<section class="print-rule">${factionRuleBlock(faction, "compact")}</section>`
          : ""
      }

      ${trackerStrip}

      ${
        opts.format === "guide" && guideAvailable
          ? `<h2 class="sheet-section">How to play</h2>${trainingPrintBlocks(list.mode)}`
          : `${(opts.format === "cards" ? cardBlocks : unitBlocks) || '<p class="print-note">No units.</p>'}`
      }

      ${
        // The Steps sheet is a how-to-play handout, not a fleet record: HVP
        // rules and a score table belong on the roster the player brings to the
        // table, not stapled to the back of the tutorial. An empty HVP section
        // is dropped outright rather than printing a header over "None selected".
        opts.format === "guide"
          ? ""
          : `
      ${opts.rules ? commandsSection : ""}

      ${
        isUnity
          ? `<div class="print-hvp-cols">${availableHvpBlocks}</div>`
          : hasHvpBlocks
            ? `<div class="print-hvp-cols">
                 <div class="print-hvp-own">${hvpBlocks.own}</div>
                 <div class="print-hvp-shared">${hvpBlocks.shared}</div>
               </div>`
            : ""
      }

      ${(() => {
        const maxRound = list.mode === "management-training" ? 3 : 4;
        const isCredits = list.mode === "hypergrowth" || list.mode === "management-training";
        const roundNames = ["Round One", "Round Two", "Round Three", "Round Four"].slice(0, maxRound);
        const cells = roundNames.map(() => "<td></td>").join("");
        return `
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
    </article>
    </div>
  </main>`;
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
        <!-- data-label carries the column name into the mobile card layout, where
             the real <thead> is off-screen and "9" / "7" alone mean nothing. -->
        <td data-label="Era">${f.era}</td>
        <td class="cell-num" data-label="Ships">${f.ships.length}</td>
        <td class="cell-num" data-label="Personnel">${f.hvp.length}</td>
        <td class="cell-actions">
          <button class="ghost-btn" data-action="clone-faction" data-source="${f.id}" title="Duplicate this faction">${icon("ix-duplicate", 16)} Duplicate</button>
          <button class="ghost-btn" data-action="copy-faction" data-id="${f.id}" title="Copy as JSON to share">${icon("scroll", 16)} Copy</button>
          <button class="ghost-btn" data-action="export-faction" data-id="${f.id}" title="Download as a file">${icon("download", 16)} Download</button>
          <button class="ghost-btn danger" data-action="delete-faction" data-id="${f.id}" title="Delete">${icon("ix-trash", 16)} Delete</button>
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
          <p class="cf-new-heading">Or start from a template you can rename and change</p>
          <div class="faction-plaques">
            <button class="faction-plaque" data-action="new-faction-template" data-template="pirate">
              <span class="faction-plaque-name">${icon("flag", 15)} Enemy Pirate Fleet</span>
              <span class="faction-plaque-rule">A scrappy raider fleet to fight against</span>
            </button>
            <button class="faction-plaque" data-action="new-faction-template" data-template="solo">
              <span class="faction-plaque-name">${icon("book", 15)} Solo Fleet</span>
              <span class="faction-plaque-rule">A starter outfit of your own to build out</span>
            </button>
          </div>
          <p class="cf-new-heading">Or clone an existing faction</p>
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
  const cell = (wi: number, field: string, extra: string): string =>
    `data-action="cf-weapon" data-ship="${shipIndex}" data-slot="${slot}" data-index="${wi}" data-field="${field}" ${extra}`;
  const rows = weapons
    .map(
      (w, wi) => `
      <div class="weapon-edit-row">
        <input class="we-name" type="text" value="${escapeHtml(w.name)}" placeholder="Weapon name" ${cell(wi, "name", "")} />
        <span class="we-group" title="Attack: number of dice and die type">
          <span class="we-inline-lbl">Attack</span>
          <input class="we-num" type="number" min="1" value="${w.count}" aria-label="Number of dice" ${cell(wi, "count", "")} />
          <span class="we-x">&times;</span>
          <select class="we-die" aria-label="Die type" ${cell(wi, "die", "")}>
            ${["D6", "D8", "D10", "D12"].map((d) => `<option ${w.die === d ? "selected" : ""}>${d}</option>`).join("")}
          </select>
        </span>
        <span class="we-group we-range" title="Range in inches, minimum to maximum">
          <span class="we-inline-lbl">Range</span>
          <input class="we-num" type="number" min="0" value="${w.rangeMin}" aria-label="Minimum range in inches" ${cell(wi, "rangeMin", "")} />
          <span class="we-dash">&ndash;</span>
          <input class="we-num" type="number" min="0" value="${w.rangeMax}" aria-label="Maximum range in inches" ${cell(wi, "rangeMax", "")} />
          <span class="we-unit">in</span>
        </span>
        <button class="ghost-btn danger" data-action="cf-weapon-remove" data-ship="${shipIndex}" data-slot="${slot}" data-index="${wi}" title="Remove weapon">${icon("close", 14)}</button>
      </div>`,
    )
    .join("");
  const head = weapons.length
    ? `<div class="weapon-edit-head"><span>Weapon</span><span>Attack</span><span>Range (inches)</span><span></span></div>`
    : "";
  return `${head}${rows}
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
            <label class="cf-shipimg-drop ${s.image ? "has-img" : ""}" title="Click to choose an image">
              ${s.image ? `<img src="${s.image}" alt="" />` : `<span class="cf-shipimg-cue">${icon("upload", 20)}<span>Click to upload an image</span></span>`}
              <input type="file" accept="image/*" data-action="cf-ship-image-upload" data-ship="${si}" hidden />
            </label>
            ${s.image ? `<button class="ghost-btn danger" data-action="cf-ship-image-clear" data-ship="${si}" title="Remove image">${icon("close", 14)} Remove</button>` : ""}
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
      <span class="cf-hvp-num" aria-hidden="true">${hi + 1}</span>
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
      <!--
        No <h1> of the faction's name here. The breadcrumb above ends in it and
        the "Faction name" field below holds the same string a third time, live
        and editable. One of the three had to go, and the heading was the one
        that did nothing the other two do not.
      -->
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
          <button class="emblem-choose-btn" data-action="open-emblem-modal" data-target="faction">
            <span class="emblem-choose-preview">${emblemView({ emblem: "delta", ...f }, 40)}</span>
            <span class="emblem-choose-label">${icon("image", 15)} Choose emblem</span>
          </button>
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
// Play mode: a table companion for the fleet game
// ---------------------------------------------------------------------------

// Each phase as a real checklist rather than a paragraph to read and
// interpret yourself - the player ticks steps off as they do them at the
// table. The Initiative step (index 1 of Command Phase) auto-ticks when the
// player uses the Roll button below, since that's an unambiguous 1:1 link;
// everything else is self-reported, because this is a physical miniatures
// game and the app cannot see the table.
/** A checklist step: the line to tick, plus an optional italic aside. */
interface PhaseStep {
  text: string;
  note?: string;
}
/** A reference bullet (no checkbox), with optional nested sub-bullets. */
interface PhaseRef {
  text: string;
  sub?: string[];
}
interface PhaseGuide {
  name: string;
  /** Tickable checklist steps. */
  steps?: PhaseStep[];
  /** A no-checkbox reference block: a lead line and bullets you read, not tick. */
  intro?: string;
  reference?: PhaseRef[];
  /** True on the End Phase, where the mode's scoring reminders belong. */
  scoring?: boolean;
}

// Command Phase, verbatim (A and B). The +1-CMD-for-losers line is not in the
// player's transcription, so it is not invented back in here.
const COMMAND_PHASE: PhaseGuide = {
  name: "Command Phase",
  steps: [
    {
      text: "You gain a number of CMD tokens determined by your faction (if you are using the Training Fleet, you gain 7 CMD tokens).",
      note: "Unspent CMD tokens are discarded at the end of the round.",
    },
    {
      text: "All players make an Initiative Check. Roll a number of D6 equal to your faction's Initiative value. Each roll of a 2 or 3 counts as one success; each roll of a 1 counts as two successes. The player that rolls the most successes wins the Initiative Check and chooses which player has the Initiative for this round.",
    },
  ],
};

// Jump Phase for the Shipyard modes: reference text, not a checklist, because
// requisitioning happens repeatedly on your turns, not once. Verbatim.
const JUMP_PHASE_SHIPYARD: PhaseGuide = {
  name: "Jump Phase",
  intro:
    "In the Jump Phase, players take turns, clockwise from the player with Initiative. On your turn, you do one of the following:",
  reference: [
    {
      text: 'Open a Jump Point: Take a jump point from the supply and place it into play, anywhere you like at least 9" outside of any planetoids. (Some missions have other restrictions.) You have access to 3 jump points +1 if there are 3 sectors.',
    },
    {
      text: "Requisition (1 CMD): When it is your turn, spend 1 CMD token to form a new unit using ships in your Shipyard, paying their cost in credits. Move the appropriate miniatures into your Reserves area and then jump them into play. Once you have requisitioned a particular ship, strike it off your Shipyard Roster – you cannot requisition it again.",
      sub: [
        "When you requisition a unit, you can additionally requisition Squadron units, without spending additional CMD tokens, if they can all be carried by the first unit.",
      ],
    },
    {
      text: "Jump In a Unit - If you have any units in your Reserves (IE If units Jumped Out) you may have the Jump In without paying a command token or their cost in credits.",
    },
  ],
};

// Jump Phase for the Fleet-List modes: a short checklist (no requisition).
const JUMP_PHASE_DEFAULT: PhaseGuide = {
  name: "Jump Phase",
  steps: [
    { text: "Starting with whoever has Initiative, take turns clockwise." },
    { text: "On your turn: open a Jump Point, Jump In a unit from Reserve, or pass." },
    { text: "Once everyone has passed in a row, the phase ends." },
  ],
};

const TACTICAL_PHASE: PhaseGuide = {
  name: "Tactical Phase",
  steps: [
    { text: "Starting with whoever has Initiative, take turns clockwise." },
    { text: 'Drag to Select a battlegroup: a lead unit, plus any unactivated friendly units within 6" of it (Combined Mass 10 or less).' },
    { text: "Activate every unit in that battlegroup, then pass to the next player." },
    { text: "The phase ends once every unit in play has activated." },
  ],
};

const END_PHASE: PhaseGuide = {
  name: "End Phase",
  scoring: true,
  steps: [
    { text: "Check your mission(s) for anything you scored this round." },
    { text: "Clear every Activated token." },
    { text: "Resolve any other End Phase effects your mission or faction calls for." },
    { text: "Discard any unused CMD tokens." },
    { text: "Start the next round." },
  ],
};

function phasesFor(mode: GameMode): PhaseGuide[] {
  const shipyard = MODE_BUILDER_SHAPE[mode] === "shipyard";
  return [COMMAND_PHASE, shipyard ? JUMP_PHASE_SHIPYARD : JUMP_PHASE_DEFAULT, TACTICAL_PHASE, END_PHASE];
}

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

/**
 * The commands you can actually spend CMD on *right now*: the core list filtered
 * to the current phase (the single highest-value in-game feature across the
 * trackers I looked at - you never scan a rulebook mid-turn to find what
 * applies). Requisition only exists in the Shipyard modes. Faction rules and
 * carried HVP can grant more or change the cost, so a standing note says so.
 */
/**
 * The fleet, as a reference block for Play Mode. Every unit with its stats and
 * weapons and a hull tracker per ship, because "I cannot see my fleet" was the
 * single loudest complaint about Play Mode: it tracked the round for you while
 * hiding the ships the round is about.
 */
function playFleetPanel(list: SavedList, faction: Faction | undefined, customs: Faction[]): string {
  const names = unitDisplayNames(list.fleet.units, faction, customs);
  const rows = list.fleet.units
    .map((u) => {
      const r = resolveShip(u.shipClassId, faction, customs);
      if (!r) return "";
      const ship = r.ship;
      const title = u.name || names.get(u.id) || ship.name;
      const carried = list.fleet.hvp
        .filter((h) => h.assignedUnitId === u.id)
        .map((h) => hvpById(h.hvpId, faction)?.name ?? h.hvpId);
      return `
      <article class="pf-unit">
        <header class="pf-head">
          <span class="pf-name">${escapeHtml(title)}${u.count > 1 ? ` <span class="pf-x">&times;${u.count}</span>` : ""}</span>
        </header>
        <div class="pf-data">${statChips(ship, true)}${weaponsTable(ship)}</div>
        ${carried.length ? `<p class="pf-carry">Carrying: ${escapeHtml(carried.join("; "))}</p>` : ""}
        <div class="pf-track">${Array.from(
          { length: u.count },
          () => `<span class="pf-track-row">${Array.from({ length: ship.silhouette }, () => '<span class="pf-hp"></span>').join("")}</span>`,
        ).join("")}</div>
      </article>`;
    })
    .join("");
  if (!rows) return "";
  return `<section class="play-fleet">
    <h3 class="roster-section">Your fleet</h3>
    <div class="pf-list">${rows}</div>
  </section>`;
}

// Hypergrowth's Play Mode fleet panel: not a damage tracker (nothing is printed
// here) but a live Shipyard. Every class you own is always visible, with its
// stats and weapons, and three moves per class: Deploy (requisition one out of
// the Shipyard, struck off for good), Jumped out (a unit in play retreats to
// Reserves), and Jump in (a unit in Reserves returns to play). yard = total in
// the Shipyard still, play = in play, reserve = jumped out.
function playShipyardTracker(list: SavedList, faction: Faction | undefined, customs: Faction[]): string {
  // No Limit: any ship in the faction can be requisitioned, in any quantity, so
  // the tracker lists the whole faction with no Shipyard cap. Otherwise it lists
  // the classes actually stocked in the Shipyard, capped at what you hold.
  const unlimited = list.unlimitedShipyards === true;
  const byClass = new Map<string, number>();
  const order: string[] = [];
  if (unlimited && faction) {
    for (const s of faction.ships) { order.push(s.id); byClass.set(s.id, Infinity); }
  } else {
    for (const u of list.fleet.units) {
      if (!byClass.has(u.shipClassId)) order.push(u.shipClassId);
      byClass.set(u.shipClassId, (byClass.get(u.shipClassId) ?? 0) + u.count);
    }
  }
  const req = list.play?.req ?? {};

  // Ledger: the full activity log - every Deploy / Jumped out / Jump in, newest
  // first, with the Credit cost of each requisition and a running total spent.
  // It sits to the RIGHT of the heading and opens on a tap.
  const logEntries = list.play?.log ?? [];
  const totalSpent = logEntries.filter((e) => e.kind === "deploy").reduce((n, e) => n + e.cost, 0);
  const logVerb = { deploy: "Deployed", jumpout: "Jumped out", jumpin: "Jumped in" } as const;
  const logHtml = logEntries.length
    ? `<ul class="sy-ledger-list">${[...logEntries]
        .reverse()
        .map(
          (e) =>
            `<li class="sy-log sy-log-${e.kind}"><span class="sy-log-verb">${logVerb[e.kind]}</span> <span class="sy-log-ship">${escapeHtml(e.ship)}</span>${e.kind === "deploy" ? `<span class="sy-ledger-cost">${credits(e.cost)}</span>` : `<span class="sy-log-move">${e.kind === "jumpout" ? "to reserve" : "to play"}</span>`}</li>`,
        )
        .join("")}</ul>
       <p class="sy-ledger-sum">Total requisitioned <span>${credits(totalSpent)}</span></p>`
    : "";
  const ledger = `<details class="sy-ledger" data-persist="sy-ledger">
      <summary class="sy-ledger-btn">${icon("scroll", 14)} Ledger <span class="sy-ledger-total">${credits(totalSpent)}</span></summary>
      <div class="sy-ledger-panel">${logHtml}</div>
    </details>`;

  const rows = order
    .map((cid) => {
      const r = resolveShip(cid, faction, customs);
      if (!r) return "";
      const ship = r.ship;
      const total = byClass.get(cid) ?? 0;
      const inPlay = req[cid]?.play ?? 0;
      const reserve = req[cid]?.reserve ?? 0;
      const yard = total === Infinity ? Infinity : Math.max(0, total - inPlay - reserve);
      // `html` is trusted markup (a rendered glyph); `label` is plain text and
      // gets escaped. The Deploy button carries the credits glyph, so it uses the
      // html form - escaping it was printing the raw <svg> source on the button.
      const btn = (act: string, label: string, on: boolean) =>
        `<button class="sy-req-btn" data-action="${act}" data-ship="${cid}" ${on ? "" : "disabled"}>${escapeHtml(label)}</button>`;
      const yardLabel = yard === Infinity ? "∞" : String(yard);
      return `
      <article class="pf-unit sy-req" data-roster-key="req-${cid}">
        <header class="pf-head">
          <span class="pf-name">${escapeHtml(ship.name)} <span class="sy-req-cost">${credits(ship.cost)}</span>${total !== Infinity && total > 1 ? ` <span class="pf-x">&times;${total}</span>` : ""}</span>
          <span class="sy-req-tally"><span class="sy-req-yard">${yardLabel}</span> yard <span class="sy-req-sep">·</span> ${inPlay} in play <span class="sy-req-sep">·</span> ${reserve} reserve</span>
        </header>
        <div class="pf-data">${statChips(ship, true)}${weaponsTable(ship)}</div>
        <div class="sy-req-acts">
          <button class="sy-req-btn" data-action="play-deploy" data-ship="${cid}" ${yard > 0 ? "" : "disabled"}>Deploy · ${credits(ship.cost)}</button>
          ${btn("play-jumpout", "Jumped out", inPlay > 0)}
          ${btn("play-jumpin", "Jump in", reserve > 0)}
        </div>
      </article>`;
    })
    .join("");
  if (!rows) return "";
  return `<section class="play-fleet play-shipyard">
    <div class="sy-shipyard-head">
      <h3 class="roster-section">Your shipyard</h3>
      ${ledger}
    </div>
    <div class="pf-list sy-req-list">${rows}</div>
  </section>`;
}

function playCommandsPanel(list: SavedList, cmdLeft: number, faction: Faction | undefined): string {
  const isShipyard = MODE_BUILDER_SHAPE[list.mode] === "shipyard";
  const effects = commandEffectsFor(list, faction);

  // Every command, always. CMD tokens are a single free pool in 2E and may be
  // spent on any command at any legal moment, so filtering this list to the
  // current phase hid options the player could legitimately take - including
  // reactive ones like Red Alert and Power to Shields, which are spent during an
  // OPPONENT's activation and so would never show under your own phase.
  const core = CORE_COMMANDS.filter((c) => !c.shipyardOnly || isShipyard).map((c) => {
    const { cost, change } = effectiveCost(c.name, c.cost, effects.costChanges);
    return {
      name: c.name,
      cost,
      text: c.text,
      base: c.cost,
      change,
      notes: effects.notes.filter((n) => n.command === c.name),
    };
  });
  const granted = effects.granted.map((g) => ({
    name: g.name,
    cost: g.cost,
    text: g.text,
    base: g.cost,
    change: undefined as CommandCostChange | undefined,
    notes: [] as { text: string; source: string }[],
    from: g.source,
  }));
  const usable = [...core, ...granted];

  const body = usable.length
    ? `<div class="pc-cmd-grid">${usable
        .map((c) => {
          const from = "from" in c && c.from ? `<span class="pc-cmd-from">from ${escapeHtml(c.from)}</span>` : "";
          const disc = c.change
            ? `<span class="pc-cmd-from">${c.cost} CMD${costChangeSuffix(c.change)} — ${escapeHtml(c.change.source)}</span>`
            : "";
          const mods = c.notes
            .map((n) => `<span class="pc-cmd-from">${ruleText(n.text)} — ${escapeHtml(n.source)}</span>`)
            .join("");
          const costLabel = c.change ? `<s>${c.base}</s> ${c.cost} CMD` : `${c.cost} CMD`;
          // Commands are never greyed out: you can always choose to spend on any
          // command, and faction/HVP rules can change what you can afford, so the
          // list stays fully live rather than dimming ones the raw CMD count
          // cannot cover this instant.
          return `
        <article class="pc-cmd ${c.change ? "is-discounted" : ""}">
          <header class="pc-cmd-head">
            <h4 class="pc-cmd-name">${escapeHtml(c.name)}</h4>
            <span class="pc-cmd-cost">${costLabel}</span>
          </header>
          <p class="pc-cmd-text">${ruleText(c.text)}</p>
          ${from}${disc}${mods}
        </article>`;
        })
        .join("")}</div>
      ${effects.global
        .map((n) => `<p class="pc-cmd-note">${ruleText(n.text)} <em>(${escapeHtml(n.source)})</em></p>`)
        .join("")}`
    : `<p class="pc-cmd-none">No commands are spent in this phase.</p>`;
  return `
    <section class="pc-cmds">
      <div class="pc-cmds-head">
        <h3 class="roster-section">Commands</h3>
      </div>
      ${body}
    </section>`;
}

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
  const PHASES = phasesFor(list.mode);
  const currentPhase = PHASES[play.phase];
  const checks = play.checks ?? [];
  const stepCount = currentPhase?.steps?.length ?? 0;
  const doneCount = checks.filter(Boolean).length;
  // A reference phase (e.g. the Shipyard Jump Phase) has nothing to tick, so it
  // is never "done" via the checklist and shows no count or checkmark.
  const phaseDone = stepCount > 0 && doneCount === stepCount;

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

  // Each phase renders either as a tickable checklist (steps, with an optional
  // italic aside) or as a read-only reference block (a lead line and bullets you
  // do not tick, because the action repeats on every turn).
  const checklistHtml = currentPhase?.reference
    ? `<div class="phase-ref">
        ${currentPhase.intro ? `<p class="phase-ref-lead">${ruleText(currentPhase.intro)}</p>` : ""}
        <ul class="phase-ref-list">
          ${currentPhase.reference
            .map(
              (r) => `<li>${ruleText(r.text)}${
                r.sub ? `<ul class="phase-ref-sub">${r.sub.map((s) => `<li>${ruleText(s)}</li>`).join("")}</ul>` : ""
              }</li>`,
            )
            .join("")}
        </ul>
      </div>`
    : (currentPhase?.steps ?? [])
        .map(
          (step, i) => `
    <label class="phase-check ${checks[i] ? "done" : ""}">
      <input type="checkbox" data-action="play-check-step" data-index="${i}" ${checks[i] ? "checked" : ""} />
      <span>${ruleText(step.text)}${step.note ? `<em class="phase-check-note">${ruleText(step.note)}</em>` : ""}</span>
    </label>`,
        )
        .join("");

  // Management Training scores in ¢20bn awards ("¢20bn per Sector"), so it steps
  // by ten. Hypergrowth credits are the granular cost of requisitioning ships
  // (¢4bn, ¢8bn, ¢25bn...), so they step by one - single digits, not tens.
  // Victory points step by one and read as a bare number.
  const scoreStep = list.mode === "management-training" ? 10 : 1;
  const scoreFmt = (n: number) => (isCredits ? credits(n) : String(n));
  const counter = (
    label: string,
    value: number,
    action: string,
    step = 1,
    fmt: (n: number) => string = (n) => String(n),
    glyph = "",
  ) => `
    <div class="play-counter">
      <span class="control-label">${label}</span>
      <div class="round-control">
        <button class="stepper-btn" data-action="${action}" data-delta="${-step}" aria-label="Decrease ${escapeHtml(label)}" title="Decrease ${escapeHtml(label)}">${icon("minus", 16)}</button>
        <span class="round-value ${value < 0 ? "is-debt" : ""}">${glyph}${fmt(value)}</span>
        <button class="stepper-btn" data-action="${action}" data-delta="${step}" aria-label="Increase ${escapeHtml(label)}" title="Increase ${escapeHtml(label)}">${icon("plus", 16)}</button>
      </div>
    </div>`;

  // Scoring reminders live in the End Phase only now (that is when you score),
  // not in a standing block that repeated on every phase.
  const scoringNotes = currentPhase?.scoring
    ? (SCORING_NOTES[list.mode] ?? []).map((n) => `<li>${ruleText(n)}</li>`).join("")
    : "";

  // On a phone the phase steps fold behind a tap so the play screen fits; on
  // desktop the toggle disappears and they are always shown (see .phase-fold).
  const checklistBlock = `<details class="phase-fold" data-persist="phase-fold">
      <summary class="phase-fold-summary">
        ${icon("chevronDown", 15, "phase-fold-caret")}
        <span class="phase-fold-label">${currentPhase?.reference ? "This phase" : "Steps"}</span>
        ${stepCount > 0 ? `<span class="phase-checklist-count">${doneCount} of ${stepCount} done</span>` : ""}
      </summary>
      <div class="phase-checklist phase-fold-body">
        ${checklistHtml}
        ${scoringNotes ? `<div class="phase-scoring"><ul class="rule-list">${scoringNotes}</ul></div>` : ""}
      </div>
    </details>`;

  // Hypergrowth is played from a Shipyard, so its Play Mode is laid out
  // differently: the faction ability and the Commands sit together (commands
  // right under the ability), and the right column is the live Shipyard where
  // you Deploy ships, always visible, rather than a damage tracker.
  const isShipyard = MODE_BUILDER_SHAPE[list.mode] === "shipyard";
  const factionBlock = faction ? factionRuleBlock(faction, "compact") : "";
  const commandsPanel = playCommandsPanel(list, play.cmd, faction);
  // This screen is used standing at a table mid-turn, so it has one job the rest
  // of the app doesn't: fit on the screen. Everything below is in service of
  // that, and the height came from three places.
  //
  // The masthead was a 137px band whose headline said "Round 1 of 4" while a
  // Round stepper sat 200px below saying "1" - the same fact twice, one of them
  // in 26px type. The band is gone; the round now reads and is adjusted in one
  // compact control on a single header line.
  //
  // The counters were a repeat(auto-fit, minmax(170px)) grid, so the fourth one
  // wrapped to a second row and cost ~80px for one number. Moving Round into
  // the header leaves exactly three, which fit one row at any usable width.
  //
  // Reset moved up here too. It was the last thing on the page, which meant the
  // page had to be scrollable to reach a button you press once per game.
  return `
  ${topbar()}
  <main class="solo-body play-body">
    <header class="play-bar">
      <p class="play-bar-id"><a href="#/list/${list.id}">${escapeHtml(list.fleet.name || "Unnamed fleet")}</a> <span aria-hidden="true">/</span> Play mode</p>
      <!--
        A readout, not a control. The round only ever moves one way and it moves
        by itself: Next phase past the End Phase rolls it over. A pair of steppers
        beside it was two more things to look at that nobody needed to press.
      -->
      <p class="play-bar-round">
        <span class="control-label">Round</span>
        <span class="round-value">${play.round}</span>
        <span class="play-bar-of">of ${maxRound}</span>
      </p>
      <button class="ghost-btn play-bar-reset" data-action="play-reset">Reset</button>
    </header>
    <div class="phase-track">${phaseBtns}</div>
    ${
      isShipyard
        ? // Shipyard layout: left column is what you're doing PLUS the faction
          // ability with the Commands right underneath it; right column is the
          // live Shipyard, always in view, and the counters above it.
          `<div class="play-cols">
      <div class="play-col play-col-do">
        ${checklistBlock}
        <div class="play-actions">
          <button class="cta-btn" data-action="play-next">${icon("chevronRight", 16)} Next phase</button>
        </div>
        <div class="play-counters">
          ${counter("CMD tokens", play.cmd, "play-cmd", 1, (n) => String(n), icon("cmd-delta", 15, "cmd-delta-glyph"))}
          ${counter(scoreLabel, play.vp, "play-vp", scoreStep, scoreFmt)}
          ${counter("Opponent " + scoreLabel.toLowerCase(), play.oppVp, "play-oppvp", scoreStep, scoreFmt)}
        </div>
        ${factionBlock ? `<div class="play-notes">${factionBlock}</div>` : ""}
        ${commandsPanel}
      </div>

      <div class="play-col play-col-spend">
        ${playShipyardTracker(list, faction, customs)}
      </div>
    </div>`
        : // Fleet-List layout (unchanged): left is the checklist and faction rule,
          // right is the counters, the fleet with its damage tracker, then commands.
          `<div class="play-cols">
      <div class="play-col play-col-do">
        ${checklistBlock}
        <div class="play-actions">
          <button class="cta-btn" data-action="play-next">${icon("chevronRight", 16)} Next phase</button>
        </div>
        <div class="play-counters">
          ${counter("CMD tokens", play.cmd, "play-cmd", 1, (n) => String(n), icon("cmd-delta", 15, "cmd-delta-glyph"))}
          ${counter(scoreLabel, play.vp, "play-vp", scoreStep, scoreFmt)}
          ${counter("Opponent " + scoreLabel.toLowerCase(), play.oppVp, "play-oppvp", scoreStep, scoreFmt)}
        </div>
        ${factionBlock ? `<div class="play-notes">${factionBlock}</div>` : ""}
      </div>

      <div class="play-col play-col-spend">
        ${playFleetPanel(list, faction, customs)}
        ${commandsPanel}
      </div>
    </div>`
    }

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
  isCustom: boolean;
}

function shipsView(state: AppState): string {
  const customs = state.customFactions;
  const f = state.ui.shipFilter ?? { era: "", faction: "", mass: "", q: "", sort: "faction" };

  const rows: CompRow[] = [];
  const pushFaction = (fac: Faction, isCustom: boolean): void => {
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
        isCustom,
      });
    }
  };
  // Official ships from the built-in factions (allFactions([]) is built-ins
  // only), then every custom faction the user has - including hidden seeds like
  // the Covenant, which "Show custom" is exactly the way to surface here.
  for (const fac of allFactions([])) pushFaction(fac, false);
  for (const fac of customs) pushFaction(fac, true);
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
      isCustom: false,
    });
  }

  const customCount = rows.filter((r) => r.isCustom).length;
  const q = f.q.trim().toLowerCase();
  let shown = rows.filter(
    (r) =>
      (f.showCustom || !r.isCustom) &&
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
    : `<tr>${textH("name", "Ship")}<th>Faction</th>${statHeaders}<th>Primary</th><th>Auxiliary</th>${textH("cost", "Cost")}</tr>`;
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
      <label class="comp-groupcheck ${grouped ? "on" : ""}">
        <input type="checkbox" data-action="ship-group-faction" ${grouped ? "checked" : ""} />
        <span class="comp-groupcheck-box">${icon("check", 14)}</span>
        <span class="comp-groupcheck-label">Sort by faction</span>
      </label>
      ${
        customCount > 0
          ? `<label class="comp-groupcheck ${f.showCustom ? "on" : ""}">
              <input type="checkbox" data-action="ship-show-custom" ${f.showCustom ? "checked" : ""} />
              <span class="comp-groupcheck-box">${icon("check", 14)}</span>
              <span class="comp-groupcheck-label">Show custom ships</span>
            </label>`
          : ""
      }
      ${f.era || f.faction || f.mass || f.q ? '<button class="ghost-btn comp-clear" data-action="ship-filter-clear">Clear filters</button>' : ""}
    </div>

    <p class="comp-count">${shown.length} of ${f.showCustom ? rows.length : rows.length - customCount} ships</p>
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
      <button class="tour-close" data-action="tour-dismiss" data-tour="${tour.id}">${icon("close", 15)} Skip</button>
    </div>
    <p class="tour-body">${escapeHtml(s.body)}</p>
    <div class="tour-foot">
      <span class="tour-dots">${dots}</span>
      <button class="tour-next" data-action="tour-next" data-tour="${tour.id}" data-step="${step}" data-len="${tour.steps.length}">${icon(isLast ? "check" : "chevronRight", 15)} ${isLast ? "Done" : "Next"}</button>
    </div>
  </div>`;
}

// App-wide Options dialog: back up / restore / wipe the browser-stored data,
// plus the about-and-links that also live in the footer. Rendered from the root
// so it is reachable on every view.
function optionsModal(state: AppState): string {
  const m = state.ui.modal;
  if (!m || m.kind !== "options") return "";
  const v = pkg.version;
  return `
  <div class="modal-root">
    <div class="modal-backdrop" data-action="close-modal"></div>
    <div class="modal-panel opt-modal" role="dialog" aria-modal="true" aria-label="Options">
      <header class="modal-header">
        <h2 class="modal-title">Options</h2>
        <button class="modal-close" data-action="close-modal" aria-label="Close">${icon("close", 18)}</button>
      </header>
      <div class="modal-body opt-body">
        <section class="opt-section">
          <h3 class="opt-h">Your data</h3>
          <p class="opt-note">Everything you build is saved in this browser only. Back it up to a file, move it to another device, or start over.</p>
          <div class="opt-actions">
            <button class="bar-btn" data-action="export-data">${icon("download", 15)} Export a backup</button>
            <label class="bar-btn file-btn">${icon("upload", 15)} Import a backup
              <input type="file" accept="application/json,.json" data-action="import-data" hidden /></label>
            <button class="bar-btn danger" data-action="clear-data">${icon("trash", 15)} Clear all data</button>
          </div>
        </section>
        <section class="opt-section">
          <h3 class="opt-h">About</h3>
          <!-- The rulebook, the Quick Reference and the feedback address are
               all in the footer, which is on every page including this one, so
               listing them here put each of them on screen twice. That leaves
               the version, which is a fact rather than a link. -->
          <p class="opt-version">Version ${escapeHtml(v)}</p>
        </section>
      </div>
    </div>
  </div>`;
}

// ---------------------------------------------------------------------------
// Learn to Play: a short guided explainer that hands you a ready-made fleet,
// walks the round structure with a looping demo, then drops you into Play Mode.
// ---------------------------------------------------------------------------

// The walkthrough. Five pages, and the four phases live as accordions INSIDE
// "The round" rather than as four more pages after it.
//
// They used to be both, which is what made the tutorial repeat itself: "The
// round" listed all four phases with their summary text, then listed all four
// again as links, and then each phase got its own page that opened by repeating
// that same name and summary a third time. Reading it straight through you met
// the words "Command Phase" three times before learning anything about it. Now
// each phase is stated exactly once, in one accordion that carries its summary
// in the header and everything else in the body.
interface LearnStep {
  label: string;
  /** Renders the four phase accordions, and gets sub-anchors in the progress nav. */
  phases?: boolean;
}
// Battle is deliberately NOT in here. It was a fifth page whose entire content
// was a heading and a button that did the thing the page was named after, so
// reaching the battle took two clicks where one would do. It is an action in the
// progress rail now, and the last page's Next button launches directly.
const LEARN_STEPS: LearnStep[] = [
  { label: "Mission" },
  { label: "Your fleet" },
  { label: "The table" },
  { label: "The round", phases: true },
];

/** "Command Phase" -> "command". The anchor in #/learn/3/command. */
const phaseSlug = (name: string): string => name.replace(/ Phase$/, "").toLowerCase();

function learnCounts(): Map<string, number> {
  // Combat Simulator fleet composition (Basic Training p.60).
  return new Map([
    ["heavy-cruiser", 1],
    ["frigate", 1],
    ["corvette", 3],
    ["gunship", 3],
    ["light-utility-ship", 3],
    ["fighter-wing", 3],
    ["bomber-wing", 3],
  ]);
}

function learnFleetTable(): string {
  const counts = learnCounts();
  const order = ["heavy-cruiser", "frigate", "corvette", "gunship", "light-utility-ship", "fighter-wing", "bomber-wing"];
  const byId = new Map(TRAINING_FLEET.ships.map((s) => [s.id, s]));
  const rows = order
    .map((id) => {
      const s = byId.get(id);
      if (!s) return "";
      const weap = (arc: "PRI" | "AUX", ws: Weapon[]) =>
        ws.map((w) => `<span class="lf-arc lf-arc-${arc.toLowerCase()}">${arc}</span> ${escapeHtml(w.name)} ${w.count}${w.die}`).join("<br>");
      const cells = [
        [...s.primary.length ? [weap("PRI", s.primary)] : []],
        [...s.auxiliary.length ? [weap("AUX", s.auxiliary)] : []],
      ]
        .flat()
        .join("<br>");
      return `<tr>
        <td class="lf-qty">${counts.get(id) ?? 1}</td>
        <td class="lf-ship">${escapeHtml(s.name)}</td>
        <td>${s.mass}</td><td>${s.thrust}"</td><td>${s.silhouette}</td><td>${s.shields}</td>
        <td class="lf-weap">${cells || (s.utilityBays ? "Utility bays" : "&mdash;")}</td>
      </tr>`;
    })
    .join("");
  return `<div class="lf-table-wrap"><table class="lf-table">
    <thead><tr><th>Qty</th><th>Ship</th>
      ${(
        [
          ["stat-mass", "Mass"],
          ["stat-thrust", "Thrust"],
          ["stat-silhouette", "Sil"],
          ["stat-shields", "Shields"],
        ] as const
      )
        // Symbol AND word in the header, in the stat's own colour, so the
        // reader meets each glyph here attached to its name before running
        // into it bare in a rule further down the walkthrough.
        .map(([ico, label]) => `<th><span class="lf-h">${icon(ico, 14, `stat-ico stat-ico-${ico.replace("stat-", "")}`)}${label}</span></th>`)
        .join("")}
      <th>Weapons</th></tr></thead>
    <tbody>${rows}</tbody>
  </table></div>`;
}

// A short, endlessly looping SVG: a ship advances, then its firing cone sweeps
// out and a target flashes. Pure CSS keyframes (see .learn-demo in style.css),
// so it plays on its own timeline and honours reduced-motion.
function learnActivationDemo(): string {
  return `
  <svg class="learn-demo" viewBox="0 0 320 150" role="img" aria-label="A ship moves forward, then fires its weapons at a target within its firing arc">
    <line class="ld-track" x1="46" y1="75" x2="150" y2="75" stroke-dasharray="4 4"/>
    <circle class="ld-target" cx="250" cy="75" r="11"/>
    <g class="ld-unit">
      <path class="ld-cone" d="M0 0 L104 -38 A110 110 0 0 1 104 38 Z"/>
      <path class="ld-ship" d="M12 0 L-9 9 L-3 0 L-9 -9 Z"/>
    </g>
    <text x="46" y="128" class="ld-label">1 &middot; MOVE up to Thrust</text>
    <text x="196" y="128" class="ld-label">2 &middot; SHOOT within arc</text>
  </svg>`;
}

function learnView(state: AppState): string {
  const step = state.route.view === "learn" ? state.route.step : 0;
  const anchor = state.route.view === "learn" ? state.route.anchor : undefined;

  // Two rows, not one. The phase links used to live inside step 4's chip, which
  // made that one chip as wide as four links and shoved "Battle" out to the far
  // edge with a dead span between them. They are their own row now: the main
  // track of five steps on top, the four phases of step 4 underneath it.
  const chips = LEARN_STEPS.map(
    (s2, i) =>
      `<a class="learn-dot ${i === step ? "on" : ""} ${i < step ? "done" : ""}" href="#/learn${i > 0 ? "/" + i : ""}"><span class="learn-dot-n">${i + 1}</span><span class="learn-dot-l">${escapeHtml(s2.label)}</span></a>`,
  )
    .concat([
      `<button class="learn-dot learn-dot-go" data-action="learn-launch"><span class="learn-dot-n">${LEARN_STEPS.length + 1}</span><span class="learn-dot-l">Battle</span></button>`,
    ])
    .join("");

  const phaseStep = LEARN_STEPS.findIndex((s2) => s2.phases);
  const subs = ROUND_PHASES.map((p2) => {
    const slug = phaseSlug(p2.name);
    const on = phaseStep === step && anchor === slug;
    return `<a class="learn-dot is-sub ${on ? "on" : ""}" href="#/learn/${phaseStep}/${slug}"><span class="learn-dot-l">${escapeHtml(p2.name.replace(" Phase", ""))}</span></a>`;
  }).join("");
  const progress = `<div class="learn-rail">${chips}</div><div class="learn-dot-subs"><span class="learn-subs-tag">Step ${phaseStep + 1}</span>${subs}</div>`;

  // Rules text on these pages comes from TRAINING_GUIDES (transcribed from the
  // Combat Simulator scenario) and ROUND_PHASES / ACTIVATION_STEPS (transcribed
  // from the Quick Reference). Nothing here is a summary written from memory -
  // the previous scoring bullets were, and they both softened the Blockading
  // rule and dropped the end-of-game HVP scoring entirely.
  const cs = TRAINING_GUIDES["combat-simulator"];
  const csStep = (title: string) => cs?.steps.find((x) => x.title === title);
  const bullets = (b: GuideStep | undefined, match?: RegExp) =>
    (b?.points ?? [])
      .filter((t) => !match || match.test(t))
      .map((t) => `<li>${ruleText(t)}</li>`)
      .join("");

  // One activation step: its name, its Quick Reference line, its diagram and its
  // rules, in that order, in one block.
  //
  // These used to be listed as a numbered <ol> of all three steps and THEN
  // explained further down, with the diagrams floating between the two - so the
  // movement diagram sat under a list item about the Action Step, and Passive
  // Attacks was written out twice. The animation for a step belongs under that
  // step's heading and nowhere else.
  const activationStep = (i: number, body: string) => {
    const a = ACTIVATION_STEPS[i]!;
    return `<section class="learn-step">
      <h3 class="learn-step-h"><span class="learn-step-n">${i + 1}</span>${escapeHtml(a.name)}</h3>
      <p class="learn-note">${ruleText(a.text)}</p>
      ${body}
    </section>`;
  };

  // One phase, stated once. The name and the Quick Reference summary live in the
  // header, the detail in the body, and nothing repeats either of them. Opening
  // is driven by the URL, so #/learn/3/tactical is a real, shareable link to the
  // Tactical Phase rather than a scroll position.
  const phaseAccordion = (i: number, body: string) => {
    const ph = ROUND_PHASES[i]!;
    const slug = phaseSlug(ph.name);
    const open = anchor ? anchor === slug : i === 0;
    return `<details class="learn-acc" id="phase-${slug}" ${open ? "open" : ""}>
      <summary class="learn-acc-head">
        <span class="learn-acc-n">${i + 1}</span>
        <span class="learn-acc-text">
          <span class="learn-acc-title">${escapeHtml(ph.name)}</span>
          <span class="learn-acc-lede">${ruleText(ph.text)}</span>
        </span>
        ${icon("chevronRight", 17, "learn-acc-chev")}
      </summary>
      <div class="learn-acc-body">${body}</div>
    </details>`;
  };

  const screens = [
    // 0 - Mission brief
    `<div class="learn-screen">
      <h1 class="learn-title">Your first battle</h1>
      <p class="learn-lede">This step-by-step guide will explain to you the basics of playing &ldquo;A Billion Suns.&rdquo; You can read through the basics to get a feel for it, then dive in to the &ldquo;Combat Simulator&rdquo; at the end by going to the &ldquo;Battle&rdquo; section up top.</p>
    </div>`,
    // 1 - Your fleet
    `<div class="learn-screen">
      <h1 class="learn-title">The Training Fleet</h1>
      <p class="learn-lede">This is a sample fleet that can be used in the tutorials. Here&rsquo;s the ship and the relevant statistics:</p>
      ${learnFleetTable()}
      <div class="learn-stat-defs">
        <p><b>Mass</b> is a broad measure of the size and bulk of a ship. Throughout the rules, when you see the icon ${icon("stat-mass", 15, "stat-ico stat-ico-mass")}, replace that with the value of the Mass of the unit&rsquo;s ship class. If a rule refers to the Combined Mass of ships, sum the ${icon("stat-mass", 15, "stat-ico stat-ico-mass")} of all the related individual ships to form a total.</p>
        <p><b>Thrust</b> ${icon("stat-thrust", 15, "stat-ico stat-ico-thrust")} is the maximum number of inches this ship can travel in a single move.</p>
        <p><b>Silhouette</b> ${icon("stat-silhouette", 15, "stat-ico stat-ico-silhouette")} is the highest die roll that hits this ship, and its starting HP.</p>
        <p><b>Shields</b> ${icon("stat-shields", 15, "stat-ico stat-ico-shields")} is the damage this ship soaks from each hit.</p>
      </div>
    </div>`,
    // 2 - The table
    `<div class="learn-screen">
      <h1 class="learn-title">Setup and winning</h1>
      <p class="learn-lede">${ruleText(csStep("Setup")?.text ?? "")}</p>
      ${learnDiagram("deployment")}
      <h2 class="learn-sub">Blockading</h2>
      <ul class="learn-rules">${bullets(csStep("Special rules"), /^Blockading/)}</ul>
      <h2 class="learn-sub">Victory points</h2>
      <ul class="learn-rules">${bullets(csStep("Victory points"))}</ul>
      <p class="learn-note">${ruleText(csStep("Game end and victory")?.text ?? "")}</p>
    </div>`,
    // 3 - The round. Four accordions, one per phase, each stated exactly once.
    `<div class="learn-screen">
      <h1 class="learn-title">The round</h1>
      <p class="learn-lede">Four rounds, each running the same four phases in the same order.</p>
      <div class="learn-accs">
        ${phaseAccordion(
          0,
          `${learnDiagram("command")}
           <ul class="learn-rules">
             <li>Roll a number of D6 equal to your faction's Initiative value.</li>
             <li>Each 2 or 3 is one success; each 1 is two successes.</li>
             <li>Most successes wins and chooses who holds Initiative this round. Ties: lowest dice sum wins, then clockwise from the last holder.</li>
             <li>Every player who did not win gains +1 CMD token.</li>
             ${bullets(csStep("Special rules"), /^Initiative Checks/)}
           </ul>`,
        )}
        ${phaseAccordion(
          1,
          `${learnDiagram("jump")}
           <h3 class="learn-sub">On your turn, do one thing</h3>
           <ul class="learn-rules">
             <li>Open a Jump Point, Jump In a unit, or Pass.</li>
             <li>Turn order follows Initiative: the Initiative holder chooses who goes first.</li>
             <li>The phase ends once every player has passed in a row.</li>
           </ul>
           <p class="learn-fn">All three are free. Some faction rules and commands add a cost of their own.</p>

           <h3 class="learn-sub">Jumping a unit in</h3>
           <ul class="learn-rules">
             <li>The unit comes out of your Reserves and deploys wholly within 6" of a friendly Jump Point.</li>
             <li>Unit coherence applies on arrival, exactly as it does after moving: every ship in the unit must end within 6" of every other ship in it.</li>
             <li>Arriving is harmless to everything around it.</li>
             <li>Jump Strain: each unit jumps once per round. Jump In, Jump Hop or Jump Out &mdash; pick one.</li>
             ${bullets(csStep("Special rules"), /^Rapid Ingress/)}
           </ul>
           <p class="learn-fn">The 6" is a flat distance for every unit, whatever its Mass. Nothing takes damage from a ship arriving &mdash; the Jump Shock rule from first edition is not in these rules.</p>
           ${learnDiagram("jump-strain")}

           <h3 class="learn-sub">Placing a Jump Point</h3>
           <ul class="learn-rules">
             <li>Jump Points sit on the table and belong to the player who opened them.</li>
             <li>Gravity Well: a Jump Point must be more than 9" from a Planetoid, and no jumping happens inside that 9" either.</li>
             <li>Blockading an enemy Jump Point scores you points, but the Jump Point still belongs to its owner and still works for them.</li>
           </ul>
           ${learnDiagram("gravity-well")}

           <h3 class="learn-sub">Leaving by jump</h3>
           <ul class="learn-rules">
             <li>Jump Hop: if all ships are within 6" of a friendly Jump Point, remove them and set up within 6" of a friendly Jump Point in another Sector.</li>
             <li>Jump Out: if all ships are within 6" of a friendly Jump Point, remove them to your Reserves.</li>
             <li>Both count as the unit&rsquo;s one jump for the round, and both discard its Activated token.</li>
           </ul>`,
        )}
        ${phaseAccordion(
          2,
          `<h3 class="learn-sub">Drag to Select</h3>
           <p class="learn-note">A lead unit plus unactivated units within 6" of it; Combined Mass 10 or less.</p>
           ${learnDiagram("drag-select")}
           <p class="learn-note">Then every unit in the battlegroup works through three steps, finishing each step before the next one starts.</p>
           ${activationStep(
             0,
             `${learnDiagram("movement")}
              <p class="learn-fn">A single pivot of more than 90&deg; costs this unit its Primary attacks for the activation (Inertial Strain). A unit that moved under 3" and did not jump becomes an Easy Target: enemies re-roll attack dice against it.</p>
              <h4 class="learn-sub-min">Doubling your move</h4>
              <p class="learn-note">Spend 1 CMD on <b>Power to Engines</b> at the start of a unit&rsquo;s movement step and it takes the whole step twice &mdash; pivot and move, then pivot and move again. It is the only way a ship covers more than its Thrust in one activation.</p>
              ${learnDiagram("double-move")}`,
           )}
           ${activationStep(
             1,
             `${learnDiagram("passive")}
              <ul class="learn-rules">
                <li>It triggers when an active unit moves <b>through or ends in</b> the range and arc of a passive enemy's auxiliary weapons.</li>
                <li>Passive means unactivated: an enemy that has already activated this round does not fire.</li>
                <li>They fire <b>auxiliary weapons only</b> &mdash; the 180&deg; front arc, never the primary 45&deg; cone.</li>
                <li>Each passive enemy unit fires <b>once per activation</b> of your battlegroup. It can fire again when your next battlegroup activates.</li>
                <li>Only units that actually moved in this activation can be targeted.</li>
                <li>Facilities have a 360&deg; arc and so always fire in this step at every active unit in range.</li>
                <li>Easy Target: moving less than 3" lets enemies re-roll attack dice against you.</li>
              </ul>`,
           )}
           ${activationStep(2, learnDiagram("action"))}
           <p class="learn-note">Give each activated unit an Activated token. The phase ends when all units have activated.</p>`,
        )}
        ${phaseAccordion(
          3,
          `<h3 class="learn-sub">Score</h3>
           <ul class="learn-rules">${bullets(csStep("Victory points"))}</ul>
           <h3 class="learn-sub">Then clear the table</h3>
           <ul class="learn-rules">
             <li>Remove every Activated token &mdash; all units can act again next round.</li>
             <li>Discard any CMD tokens you did not spend. They do not carry over, so a token saved for later is a token wasted. (Some faction rules change this.)</li>
             <li>Begin the next round. The game ends after Round 4.</li>
           </ul>
           <p class="learn-note">${ruleText(csStep("Game end and victory")?.text ?? "")}</p>`,
        )}
      </div>
    </div>`,
  ];

  const atEnd = step >= LEARN_STEPS.length - 1;
  const backHref = step > 0 ? `#/learn${step - 1 > 0 ? "/" + (step - 1) : ""}` : "#/";
  const backLabel = step > 0 ? `${icon("chevronRight", 16, "flip-x")} Back` : `${icon("home", 16)} Home`;
  // At the end, Next becomes the launch itself rather than a link to a page whose
  // only job was to hold the same button.
  const nav = `
    <div class="learn-nav">
      <a class="learn-btn learn-btn-back" href="${backHref}">${backLabel}</a>
      <a class="learn-btn learn-btn-ref" href="./ABS-2E-Quick-Reference.pdf" target="_blank" rel="noopener">${icon("scroll", 16)} Quick Reference (PDF)</a>
      ${
        atEnd
          ? `<button class="learn-btn learn-btn-next" data-action="learn-launch">${icon("flag", 16)} Start the battle</button>`
          : `<a class="learn-btn learn-btn-next" href="#/learn/${step + 1}">Next ${icon("chevronRight", 16)}</a>`
      }
    </div>`;

  // data-learn-step changes on every page turn, so morphing swaps the node
  // rather than patching it in place - which is what lets the entrance
  // animation re-run instead of firing once and never again.
  return `
  ${topbar()}
  <main class="learn-main">
    <nav class="learn-progress" aria-label="Tutorial progress">${progress}</nav>
    <div class="learn-stage" data-learn-step="${step}${anchor ? "-" + escapeHtml(anchor) : ""}">${screens[step] ?? screens[0]}</div>
    ${nav}
  </main>
  ${footer()}`;
}

// The unified emblem picker (Option B): a single "Choose emblem" button in the
// builder, foundry, and solo opens this one modal. The Library / Upload / Colour
// tabs and Random / Remove actions dispatch to the existing per-context emblem
// actions, which resolve their own target (active list / faction / outfit), so
// the modal only needs to know which target it's editing to pick action names.
function emblemModal(state: AppState): string {
  const m = state.ui.modal;
  if (!m || m.kind !== "emblem") return "";

  interface Cfg {
    fields: EmblemFields;
    currentLib?: string;
    hasImage: boolean;
    libA: string;
    upA: string;
    rndA: string;
    clrA: string;
    currentColor?: string;
    currentBg?: string;
  }
  let cfg: Cfg | undefined;
  if (m.target === "list") {
    const l = activeList(state);
    if (l)
      cfg = {
        fields: l,
        currentLib: l.emblemLib,
        hasImage: Boolean(l.emblemImage || l.emblemLib),
        libA: "set-emblem-lib",
        upA: "emblem-upload",
        rndA: "random-emblem",
        clrA: "clear-emblem-image",
        currentColor: l.emblemColor,
        currentBg: l.emblemBg,
      };
  } else if (m.target === "faction") {
    const fid = state.route.view === "foundry" ? state.route.factionId : undefined;
    const f = fid ? state.customFactions.find((x) => x.id === fid) : undefined;
    if (f)
      cfg = {
        fields: { emblem: "delta", ...f },
        currentLib: f.emblemLib,
        hasImage: Boolean(f.emblemImage || f.emblemLib),
        libA: "cf-set-lib",
        upA: "cf-emblem-upload",
        rndA: "cf-random-emblem",
        clrA: "cf-clear-emblem",
        currentColor: f.emblemColor,
        currentBg: f.emblemBg,
      };
  } else {
    const o = activeOutfit(state);
    if (o)
      cfg = {
        fields: o,
        currentLib: o.emblemLib,
        hasImage: Boolean(o.emblemImage || o.emblemLib),
        libA: "outfit-set-lib",
        upA: "outfit-emblem-upload",
        rndA: "outfit-random-emblem",
        clrA: "outfit-clear-emblem",
        currentColor: o.emblemColor,
        currentBg: o.emblemBg,
      };
  }
  if (!cfg) return "";

  // Two tabs, not three. Colour used to be its own tab, which meant picking a
  // sigil and then colouring it were separate places - you could not see the
  // mark you were tinting. The colour controls now sit under the grid in the
  // Library tab, with the live preview in the header above both.
  const tabDefs: Array<[string, string]> = [["library", "Library"], ["upload", "Upload"]];
  const tab = tabDefs.some(([id]) => id === m.tab) ? m.tab : "library";
  const tabBtns = tabDefs
    .map(
      ([id, label]) =>
        `<button class="em-tab ${tab === id ? "on" : ""}" role="tab" aria-selected="${tab === id}" data-action="emblem-modal-tab" data-tab="${id}">${escapeHtml(label)}</button>`,
    )
    .join("");

  const bgSwatch = (val: string, style: string, label: string) =>
    `<button class="bg-swatch ${(cfg!.currentBg ?? "") === val ? "selected" : ""}" data-action="emblem-set-bg" data-bg="${val}" aria-label="${label}" title="${label}" style="${style}">${val === "" ? icon("close", 12) : ""}</button>`;

  // Folder chips. Counts follow the active search, so a chip cannot promise
  // "All 253" while the grid shows eleven; a folder with no match is dimmed
  // rather than removed, so the row does not reflow as you type.
  const activeCat = m.libCat ?? "all";
  const q = m.libQuery ?? "";
  const folderChips = `<div class="em-folders">
      <button class="em-folder ${activeCat === "all" ? "on" : ""}" data-action="emblem-lib-cat" data-cat="all">All <span class="em-folder-n">${matchCount(q)}</span></button>
      ${ICON_CATEGORIES.map((c) => {
        const n = matchCount(q, c);
        return `<button class="em-folder ${activeCat === c ? "on" : ""} ${n === 0 ? "is-empty" : ""}" data-action="emblem-lib-cat" data-cat="${escapeHtml(c)}">${escapeHtml(categoryLabel(c))} <span class="em-folder-n">${n}</span></button>`;
      }).join("")}
    </div>`;

  // Background only. The Tint row is gone: painting a colour through the mark's
  // alpha channel flattens it to a silhouette, so any logo with internal detail
  // came out as a shape, and the one real problem it was reaching for - a white
  // mark vanishing on white - is now handled automatically by giving measured
  // near-white marks a black ground (see emblemView).
  //
  // These sit directly above the footer rather than under the grid: below it
  // they were 1156px off-screen at the default page size and 4886px after
  // "Show all". Shown on both tabs, since a background applies to an upload too.
  const colourBlock = `<div class="em-colour">
      <div class="em-colour-row">
        <span class="em-colour-label">Background</span>
        <div class="em-swatches">${bgSwatch("", "", "None")}${bgSwatch("ink", "background:var(--ink)", "Ink")}${bgSwatch("blue", "background:var(--blue)", "Blue")}${bgSwatch("red", "background:var(--red)", "Red")}${bgSwatch("steel", "background:#5b6472", "Steel")}${bgSwatch("sand", "background:#caa96a", "Sand")}</div>
      </div>
    </div>`;

  const body =
    tab === "upload"
      ? // A real button, not a bare <label> wrapping a hidden input: the input is
        // out of the tab order, so there was no way to open the file dialog
        // without a mouse. The button forwards the click to the input.
        `<div class="em-upload">
           <button class="em-drop" data-action="emblem-upload-pick">
             <span class="em-drop-cue">${icon("upload", 22)}<span>Choose an image to upload</span></span>
           </button>
           <input id="emblem-upload-input" type="file" accept="image/*" data-action="${cfg.upA}" hidden />
         </div>`
      : `<input id="emblem-lib-search" class="em-search" type="search" placeholder="Search sigils: try skull, wings, money" value="${escapeHtml(m.libQuery ?? "")}" data-action="emblem-lib-search" aria-label="Search sigils" />
         ${folderChips}
         <div class="em-scroll">${iconLibraryGrid(cfg.libA, cfg.currentLib, activeCat, m.libQuery, m.libShown ?? LIB_PAGE)}</div>`;

  return `
  <div class="modal-root">
    <div class="modal-backdrop" data-action="close-modal"></div>
    <div class="modal-panel em-modal" role="dialog" aria-modal="true" aria-label="Choose an emblem">
      <header class="modal-header">
        <div class="em-head"><span class="em-preview">${emblemView(cfg.fields, 40)}</span><h2 class="modal-title">Choose an emblem</h2></div>
        <button class="modal-close" data-action="close-modal" aria-label="Close">${icon("close", 18)}</button>
      </header>
      <div class="em-tabs" role="tablist">${tabBtns}</div>
      <div class="em-body">${body}</div>
      ${colourBlock}
      <div class="em-foot">
        <button class="bar-btn" data-action="${cfg.rndA}">${icon("shuffle", 15)} Random</button>
        ${cfg.hasImage ? `<button class="bar-btn danger" data-action="${cfg.clrA}">${icon("close", 15)} Remove</button>` : ""}
        <button class="cta-btn em-done" data-action="close-modal">${icon("check", 16)} Done</button>
      </div>
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
      case "learn":
        return learnView(state);
    }
  })();
  return `${body}${optionsModal(state)}${emblemModal(state)}${tourPopover(state)}`;
}
