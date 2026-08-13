// Junkspace solo mode: outfit builder, live-game tracker, dice roller for the
// automated enemy, and the debt campaign. Renders from AppState like the rest
// of the app; actions.ts owns the event handling.

import { PILOT_CLASSES, type PilotClass, type ShipClass } from "../src/types.ts";
import { imageSrc } from "./image-store.ts";
import {
  JUNKSPACE_SHIPS,
  OUTFIT_BUDGET_K,
  OUTFIT_MAX_SHIPS,
  STARTING_DEBT_K,
  DEBT_CLEAR_GAMES,
  HARD_DEBT_K,
  HARD_CLEAR_GAMES,
  PILOT_PERKS,
  ALERT_START,
  LOW_DEBT_THRESHOLD_K,
  startingAlertLevel,
} from "../src/data/junkspace.ts";

// Each pilot class's starting ability (Gunner "Hot Shot", etc.).
const BASE_PERK: Record<string, { perkName: string; text: string }> = Object.fromEntries(
  PILOT_PERKS.map((p) => [p.class, { perkName: p.perkName, text: p.text }]),
);
import {
  SOLO_PHASES,
  SOLO_ALERT_RULES,
  PERKS_BY_CLASS,
  BLIP_TO_PIRATE,
  JUNKSPACE_PIRATES,
  PIRATE_RULE,
} from "../src/data/junkspace-solo.ts";
import { escapeHtml, formatDate, ruleText } from "./format.ts";
import { icon, statChips } from "./icons.ts";
import { emblemView, weaponsTable } from "./render.ts";
import { libraryUrl } from "./emblems.ts";
import gunnerIcon from "./pilots/gunner.png";
import haulerIcon from "./pilots/hauler.png";
import junkerIcon from "./pilots/junker.png";

const PILOT_ICON: Record<string, string> = { Gunner: gunnerIcon, Hauler: haulerIcon, Junker: junkerIcon };
import type { AppState, SoloTab } from "./state.ts";
import { activeOutfit } from "./state.ts";
import type { SavedOutfit } from "./storage.ts";

const ck = (n: number): string => `¢${n}k`;

const shipById = new Map<string, ShipClass>(JUNKSPACE_SHIPS.map((s) => [s.id, s]));

/**
 * The campaign's two dials, per outfit.
 *
 * p.201 sets the standard game at ¢30k over 8, then offers the harder one in a
 * NOTE box: "try to clear your debt in 6 games or increase your debt to ¢45k".
 * Two independent levers, and the book's "or" means either alone is a valid
 * harder game. Outfits made before the dials existed have neither field, so
 * both fall back to the standard.
 */
const debtStart = (o: SavedOutfit): number => o.debtStartK ?? STARTING_DEBT_K;
const gamesLimit = (o: SavedOutfit): number => o.gamesLimit ?? DEBT_CLEAR_GAMES;

export function outfitCost(o: SavedOutfit): number {
  return o.ships.reduce((sum, s) => sum + (shipById.get(s.shipClassId)?.cost ?? 0), 0);
}

// The campaign runs a fixed number of games (DEBT_CLEAR_GAMES) to clear the
// debt. Show that as a row of ticks - one per game, filled as each is played -
// rather than a "games left" countdown and a debt-percentage bar. The games ARE
// the clock, so they get counted out where you can see all of them at once.
function gameTicks(played: number, total: number): string {
  const done = Math.max(0, Math.min(total, played));
  const ticks = Array.from(
    { length: total },
    (_, i) => `<span class="game-tick ${i < done ? "is-played" : ""}"></span>`,
  ).join("");
  return `<div class="game-ticks" role="img" aria-label="${done} of ${total} games played">${ticks}<span class="game-ticks-label">${done}/${total} games</span></div>`;
}

// The Start-a-new-outfit dialog. Rendered globally (see render.ts) so it floats
// over the solo list; a blank name is fine - the card falls back to "Unnamed
// outfit". Outfits are salvage crews, not corporations, so no name is rolled.
//
// Two things: a mark, already chosen for you, and a name. The mark is rolled
// when the dialog opens so you never face an empty slot or a decision you did
// not ask to make, and tapping it opens the real emblem picker - the whole
// library, uploads, backgrounds - because the draft now lives in ui.newOutfit
// rather than on ui.modal and so survives the picker opening over it.
//
// What used to be here: a strip of ten marks with a "Surprise me" under it, and
// a "Start from" list offering every saved outfit and every main-game fleet as
// a starting hull. Three questions at a door you are trying to walk through.
// Copying an outfit is still one press of Duplicate on the dock, which is where
// you are looking when you want it.
//
// The ready-made crews used to sit here too, as an "Or start with a ready-made
// crew" list. They are pre-built outfits now (see seed-outfits.ts): already on
// the Solo page, not a pitch inside the dialog you opened to skip the pitch.
export function newOutfitModal(state: AppState): string {
  const m = state.ui.modal;
  if (!m || m.kind !== "new-outfit") return "";
  const draft = state.ui.newOutfit ?? { emblem: "delta" };
  const debt = draft.debtStartK ?? STARTING_DEBT_K;
  const games = draft.gamesLimit ?? DEBT_CLEAR_GAMES;

  return `
  <div class="modal-root">
    <div class="modal-backdrop" data-action="close-modal"></div>
    <div class="modal-panel no-modal" role="dialog" aria-modal="true" aria-label="Start a new outfit">
      <header class="modal-header">
        <h2 class="modal-title">Start a new outfit</h2>
        <button class="modal-close" data-action="close-modal" aria-label="Close">${icon("close", 18)}</button>
      </header>
      <div class="modal-body no-modal-body">
        <div class="no-identity">
          <button class="no-emblem-btn" data-action="open-emblem-modal" data-target="new-outfit" aria-label="Change emblem">
            <span class="no-emblem-mark">${emblemView(draft, 60)}</span>
            <span class="no-emblem-swap">${icon("image", 14)} Change</span>
          </button>
          <label class="no-name-field">
            <span class="control-label">Outfit name</span>
            <!-- Uncontrolled on purpose: routing it through state on every
                 keystroke would re-render the input and drop the caret. Start
                 and the emblem button read it out of the DOM instead. -->
            <input class="new-outfit-name" type="text" placeholder="Unnamed outfit" value="${escapeHtml(draft.name ?? "")}" autocomplete="off" autofocus />
          </label>
        </div>
        ${/* Two numbers you step, not two pairs of buttons.
              The book gives one standard game and one harder one - "clear your
              debt in 6 games or increase your debt to ¢45k" (p.201) - and a
              two-button segment turns that into the only two campaigns there
              are. They are just numbers; the note explaining that they were
              independent was three lines of prose doing a job the two steppers
              do by existing. The book's harder values are where the readout
              turns red, so the dial still says which way is up. */ ""}
        <div class="no-dials">
          <div class="no-dial">
            <span class="control-label">Debt</span>
            <div class="dial">
              <button class="stepper-btn" data-action="new-outfit-debt" data-delta="-5" aria-label="Less debt">${icon("minus", 15)}</button>
              <span class="dial-val ${debt >= HARD_DEBT_K ? "is-hard" : ""}">${ck(debt)}</span>
              <button class="stepper-btn" data-action="new-outfit-debt" data-delta="5" aria-label="More debt">${icon("plus", 15)}</button>
            </div>
          </div>
          <div class="no-dial">
            <span class="control-label">Games to clear it</span>
            <div class="dial">
              <button class="stepper-btn" data-action="new-outfit-games" data-delta="-1" aria-label="Fewer games">${icon("minus", 15)}</button>
              <span class="dial-val ${games <= HARD_CLEAR_GAMES ? "is-hard" : ""}">${games}</span>
              <button class="stepper-btn" data-action="new-outfit-games" data-delta="1" aria-label="More games">${icon("plus", 15)}</button>
            </div>
          </div>
        </div>
      </div>
      <footer class="modal-footer">
        <button class="bar-btn" data-action="close-modal">Cancel</button>
        <button class="cta-btn" data-action="solo-new-outfit-create">${icon("plus", 15)} Start blank</button>
      </footer>
    </div>
  </div>`;
}

// ---------------------------------------------------------------------------
// Solo list (dock of saved outfits + the pitch)
// ---------------------------------------------------------------------------

export function soloListView(state: AppState): string {
  const outfits = [...state.outfits].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const cards = outfits
    .map((o, i) => {
      const cleared = o.debtK <= 0;
      const paid = Math.max(0, debtStart(o) - Math.max(0, o.debtK));
      return `
      <article class="outfit-card" style="--i:${i}">
        <a class="outfit-card-main" href="#/solo/${o.id}">
          <span class="outfit-card-emblem">${emblemView(o, 44)}</span>
          <span class="outfit-card-id">
            <span class="outfit-card-name">${escapeHtml(o.name || "Unnamed outfit")}</span>
            <span class="outfit-card-meta">${o.ships.length} ${o.ships.length === 1 ? "ship" : "ships"} · updated ${formatDate(o.updatedAt)}</span>
          </span>
        </a>
        <div class="outfit-card-debt ${cleared ? "is-clear" : ""}">
          <div class="ocd-line"><span>${ck(Math.max(0, o.debtK))} still owed</span><span>${ck(paid)} paid</span></div>
          ${gameTicks(o.gamesPlayed, gamesLimit(o))}
        </div>
        <div class="outfit-card-actions">
          <a class="ghost-btn" href="#/solo/${o.id}">${icon("chevronRight", 15)} Continue</a>
          <button class="ghost-btn" data-action="duplicate-outfit" data-id="${o.id}" title="Duplicate">${icon("duplicate", 15)}</button>
          <button class="ghost-btn danger" data-action="delete-outfit" data-id="${o.id}" title="Delete">${icon("trash", 15)}</button>
        </div>
      </article>`;
    })
    .join("");

  return `
  <main class="home-main solo-main">
    <header class="solo-head">
      <h1 class="page-title">Junkspace</h1>
    </header>
    <section class="commission-panel">
      <div class="solo-panel-head">
        <h2 class="panel-title">Your outfits</h2>
        <button class="cta-btn" data-action="solo-new-outfit-open">${icon("plus", 18)} Start a new outfit</button>
      </div>
      ${
        outfits.length === 0
          ? // An empty <div class="solo-empty"> shipped here for a while, so a
            // first-time visitor got a page with a heading, a button and a
            // couple of hundred pixels of nothing. Say what an outfit is and
            // what the campaign asks of you.
            `<div class="solo-empty">
              <p class="solo-tagline">You are in hock to the wrong people for ${ck(STARTING_DEBT_K)}, flying salvage runs through the Junkspace to pay it off.</p>
              <ul class="solo-primer">
                <li><strong>Build an outfit.</strong> Up to ${OUTFIT_MAX_SHIPS} ships for ${ck(OUTFIT_BUDGET_K)}, and a pilot whose class sets your starting perk.</li>
                <li><strong>Fly the games.</strong> The Roller runs the Hostiles for you, so you play alone.</li>
                <li><strong>Clear the debt.</strong> You have ${DEBT_CLEAR_GAMES} games to pay back ${ck(STARTING_DEBT_K)}. What you earn pays down what you owe, and buys perks for the pilots who came home.</li>
              </ul>
            </div>`
          : `<div class="outfit-cards">${cards}</div>`
      }
    </section>
  </main>`;
}

// ---------------------------------------------------------------------------
// Outfit workspace (tabbed)
// ---------------------------------------------------------------------------

function tabBar(o: SavedOutfit, tab: SoloTab): string {
  const t = (id: SoloTab, label: string) =>
    `<button class="solo-tab ${tab === id ? "selected" : ""}" data-action="solo-tab" data-tab="${id}">${label}</button>`;
  return `<nav class="solo-tabs">${t("outfit", "Outfit")}${t("play", "Play & Roller")}${t("campaign", "Campaign")}</nav>`;
}

function soloShipCatalog(): string {
  // Same row as the fleet builder's catalogue: whole row is the add target,
  // compact stat chips, the aligned PRI/AUX weapons table, and a standing ADD cue.
  return JUNKSPACE_SHIPS.map(
    (s) => `
    <article class="ship-row is-option" data-action="outfit-add-ship" data-ship="${s.id}" role="button" tabindex="0">
      <div class="ship-row-body">
        <div class="ship-row-head">
          <h4 class="ship-name">${escapeHtml(s.name)}</h4>
          <span class="ship-cost">${ck(s.cost)}</span>
        </div>
        <div class="ship-row-details">${statChips(s, true)}${weaponsTable(s)}</div>
      </div>
      <span class="add-cue">${icon("plus", 15)}<span>Add</span></span>
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
      const pilotPicker = PILOT_CLASSES.map((p) => {
        const perk = BASE_PERK[p];
        return `
        <button class="pilot-opt ${s.pilotClass === p ? "on" : ""}" data-action="outfit-pilot-class" data-ship="${s.id}" data-class="${p}" aria-pressed="${s.pilotClass === p}" title="${perk ? escapeHtml(perk.perkName + ": " + perk.text) : p}">
          <img class="pilot-ico-img" src="${PILOT_ICON[p]}" alt="" />
          <span class="pilot-name">${p}</span>
        </button>`;
      }).join("");
      /*
       * Every class's ability is rendered, and only the chosen one is visible.
       *
       * Rendering just the active one meant the paragraph under the picker
       * changed length every time you pressed a class button, and the pilot
       * name field and Remove button under it jumped up or down by a line -
       * pressing a button must never move what is around it. The three sit in
       * one grid cell (see .pilot-abilities), so the cell is as tall as the
       * longest of them whichever is showing, and nothing below it can move.
       * `visibility`, not `display`, is what keeps the box: it also takes the
       * hidden two out of the accessibility tree.
       */
      const abilities = PILOT_CLASSES.map((p) => {
        const perk = BASE_PERK[p];
        if (!perk) return "";
        return `<p class="pilot-ability ${s.pilotClass === p ? "is-on" : ""}"><b>${escapeHtml(perk.perkName)}.</b> ${ruleText(perk.text)}</p>`;
      }).join("");
      return `
      <article class="roster-unit" data-roster-key="${s.id}">
        <div class="roster-unit-head">
          ${def ? "" : `<span class="roster-unit-glyph">${icon("warning", 20)}</span>`}
          <input class="unit-name-input" type="text" value="${escapeHtml(s.shipName ?? "")}" placeholder="${escapeHtml(def?.name ?? "Ship")}" aria-label="${escapeHtml(def?.name ?? "Ship")}" data-action="outfit-ship-name" data-ship="${s.id}" />
          <span class="roster-unit-cost">${ck(def?.cost ?? 0)}</span>
        </div>
        ${
          // Same stat chips and weapons table the catalogue uses, so a ship
          // reads identically whether you're picking it or already own it.
          // Boxed as one "spec" column so the pilot controls can sit beside it
          // instead of stacking under a half-empty row.
          def ? `<div class="ru-spec"><div class="roster-unit-stats">${statChips(def, true)}</div>${weaponsTable(def)}</div>` : ""
        }
        <!--
          The pilot's name sits with the pilot's class, on the same line, above
          the ability the class grants. It used to be a separate field UNDER the
          ability paragraph, which put four lines of rules text between "who is
          flying this" and "what are they called" and read as a different
          subject entirely. Same person, same row.
        -->
        <div class="roster-unit-tools">
          <div class="pilot-field">
            <div class="pilot-row">
              <div class="pilot-picker" role="group" aria-label="Pilot class">${pilotPicker}</div>
              <input class="pilot-name-input" type="text" value="${escapeHtml(s.pilotName ?? "")}" placeholder="Call sign" aria-label="Pilot name" data-action="outfit-pilot-name" data-ship="${s.id}" />
            </div>
            <div class="pilot-abilities">${abilities}</div>
          </div>
          <button class="ghost-btn danger" data-action="outfit-remove-ship" data-ship="${s.id}">${icon("trash", 14)} Remove</button>
        </div>
      </article>`;
    })
    .join("");

  return `
  <main class="workspace solo-workspace">
    <section class="catalog">
      <h3 class="catalog-title">Stock ship classes <span class="muted">costs in thousands of Juran credits</span></h3>
      <div class="catalog-list">${soloShipCatalog()}</div>
    </section>
    <aside class="roster">
      <div class="roster-sheet">
        <!--
          No name-and-emblem header here. The setup band directly above this
          panel already shows both, and shows them editable; repeating them
          200px lower was the same outfit introduced to you twice.
        -->
        <div class="band-readout solo-readout ${over ? "over" : ""}">
          <div class="readout"><span class="readout-label">Budget</span><span class="readout-value">${ck(OUTFIT_BUDGET_K)}</span></div>
          <div class="readout"><span class="readout-label">Spent</span><span class="readout-value">${ck(cost)}</span></div>
          <div class="readout"><span class="readout-label">Left</span><span class="readout-value ${over ? "negative" : ""}">${over ? "−" : ""}${ck(Math.abs(remaining))}</span></div>
        </div>
        <h3 class="roster-section">Ships <span class="muted">${o.ships.length}/${OUTFIT_MAX_SHIPS}${full ? " &middot; outfit full" : ""}</span></h3>
        ${shipRows || ""}
        ${over ? '<div class="inspection fail"><p class="issue-error">Over budget by ' + ck(-remaining) + ".</p></div>" : ""}
        <div class="roster-actions">
          <button class="bar-btn danger" data-action="delete-outfit" data-id="${o.id}">${icon("trash", 16)} Delete outfit</button>
        </div>
      </div>
    </aside>
  </main>`;
}

// --- Play tab ---------------------------------------------------------------

// The Alert Level counted out in ten squares rather than drawn as a percentage
// bar. It is a 1-to-10 integer that ends the game the moment it lands on 10, so
// what you need off it is "how many are left", and a 500px-wide fill bar cannot
// answer that without you measuring it against its own end. Squares can, at a
// glance, from across a table - which is the same argument (and the same shape)
// as the campaign clock in gameTicks above.
function alertPips(level: number): string {
  const on = Math.max(0, Math.min(10, level));
  const pips = Array.from(
    { length: 10 },
    (_, i) => `<span class="alert-pip ${i < on ? "is-on" : ""}"></span>`,
  ).join("");
  return `<div class="alert-pips" role="img" aria-label="Alert Level ${on} of 10">${pips}</div>`;
}

// No dice roller here any more.
//
// It had two buttons, Hostile behaviour and Glitch a Blip, that rolled a D6 and
// printed the row you landed on. Both tables are three rows of a D6 you are
// already holding: the player rolls the die on the table beside the models,
// reads the row, and moves a ship. A button that rolls it again in a browser
// asks which of the two results counts, and the honest answer is neither -
// nothing in the app's state depended on the roll, so it was a die that could
// not affect the game printing an answer to a question already answered.
//
// The tables themselves stay, in the reference column, which is what you want
// mid-game: the row, not a second die.



/**
 * The bag of eight Blip markers.
 *
 * The numbers are decided when the game is dealt and hidden until a marker is
 * flipped, which is the rule: you "deploy them facedown (without looking at the
 * numbers on them)" (p.197) and only find out what a Blip is when one of your
 * ships gets within 6" of it. So the app holds the shuffled bag and flips on
 * demand, rather than rolling a random pirate at reveal time - those are
 * different games. Rolling at reveal means the eight markers are not a fixed
 * force of four Starfighters, two Gunships, a Frigate and a Cruiser, and it
 * makes a Recon Ship's Long-Range Scan - "peek at the number on one Blip marker
 * within 12" without revealing it" (p.202) - impossible to model at all.
 *
 * Flipping is reversible because a Blip can be revealed by mistake faster than
 * a rule can be looked up, and nothing is lost: the marker's number does not
 * change.
 */
function blipsPanel(o: SavedOutfit): string {
  const blips = o.blips ?? [];
  if (!blips.length) {
    return `
    <section class="solo-card solo-blips">
      <h3 class="roster-section">Blips</h3>
      <p class="blip-note">Eight markers, numbered 1 to 8, shuffled facedown into the Hostile half.</p>
      <button class="primary-btn" data-action="solo-shuffle-blips">${icon("shuffle", 16)} Shuffle the bag</button>
    </section>`;
  }
  // NOTHING MOVES WHEN A MARKER IS FLIPPED. Every tile carries both faces at
  // once - the "?" and the pirate it turns out to be - stacked in the same grid
  // cell, so the tile is already as tall as its tallest state before you touch
  // it. Rendering only the current face meant "Pirate Starfighter" appearing
  // where "face down" had been, the row growing a line, and every marker below
  // it jumping down the page at the exact moment you were looking at one.
  // What a marker turns out to be, in the app's own stat format rather than
  // the book's table: the same four chips every ship in the app wears, then the
  // weapon systems. p.211 prints these as a row in a table with the Blip
  // numbers down the side, which is how you read it off a page and not how you
  // want it when you have just flipped one marker over mid-turn.
  const byName = new Map(JUNKSPACE_PIRATES.map((p) => [p.name, p]));
  const markers = blips
    .map((b, i) => {
      const name = BLIP_TO_PIRATE[b.n] ?? "";
      const p = byName.get(name);
      const weapons = p
        ? [
            p.primary ? `<span class="blip-w"><b>Pri</b> ${escapeHtml(p.primary)}</span>` : "",
            p.auxiliary ? `<span class="blip-w"><b>Aux</b> ${escapeHtml(p.auxiliary)}</span>` : "",
          ].join("")
        : "";
      return `
      <button class="blip ${b.revealed ? "is-revealed" : ""}" data-action="solo-blip-reveal" data-index="${i}"
              aria-label="${b.revealed ? `Blip ${b.n}, ${escapeHtml(name)}. Turn it back over.` : "Face-down Blip marker. Turn it over."}">
        <span class="blip-face blip-back">${icon("logo", 26)}</span>
        <span class="blip-face blip-front">
          <span class="blip-head"><span class="blip-n">${b.n}</span><span class="blip-what">${escapeHtml(name)}</span></span>
          ${p ? statChips(p, true) : ""}
          <span class="blip-weapons">${weapons}</span>
        </span>
      </button>`;
    })
    .join("");
  return `
    <section class="solo-card solo-blips">
      <h3 class="roster-section">Blips
        <button class="ghost-btn" data-action="solo-shuffle-blips">${icon("shuffle", 13)} Reshuffle</button>
      </h3>
      <div class="blip-grid">${markers}</div>
      <p class="blip-rule">${ruleText(PIRATE_RULE)}</p>
    </section>`;
}

function playTab(state: AppState, o: SavedOutfit): string {
  const alert = o.alertLevel;
  // Why this game is harder than the last one. The starting Alert Level climbs
  // as the debt comes down (p.195), and without saying so the player just sees
  // a number that used to be 1 and now isn't.
  const startsAt = startingAlertLevel(o.debtK);
  const startNote =
    startsAt > ALERT_START
      ? `<p class="alert-start-note">${
          o.debtK <= 0
            ? `No Debt left, so this game starts at ${startsAt}.`
            : `Under ${ck(LOW_DEBT_THRESHOLD_K)} of Debt left, so this game starts at ${startsAt}.`
        }</p>`
      : "";
  const phases = SOLO_PHASES.map((p) => `<li><strong>${escapeHtml(p.name)}.</strong> ${ruleText(p.text)}</li>`).join("");
  return `
  <section class="game-bar ${alert >= 8 ? "high" : ""}">
    <div class="gb-alert">
      <div class="gb-head">
        <span class="control-label">Alert Level</span>
        <span class="gb-note">the game ends at 10</span>
      </div>
      <div class="gb-read">
        <span class="gb-figure">${alert}</span>
        ${alertPips(alert)}
      </div>
      <div class="alert-controls">
        <!-- What just happened on the table, then what it does to the Level.
             The old labels led with the arithmetic ("+1 End Phase"), which is
             the wrong way round: you press these because a thing happened. -->
        <button class="bar-btn" data-action="alert-adjust" data-delta="1">${icon("plus", 13)} End Phase <b class="alert-delta">+1</b></button>
        <button class="bar-btn" data-action="alert-adjust" data-delta="1">${icon("plus", 13)} Reveal Mass 2-3 <b class="alert-delta">+1</b></button>
        <button class="bar-btn" data-action="alert-adjust" data-delta="-2">${icon("minus", 13)} Destroy Mass 2-3 <b class="alert-delta">&minus;2</b></button>
        <button class="ghost-btn" data-action="alert-adjust" data-delta="-1">${icon("minus", 13)} Take one back <b class="alert-delta">&minus;1</b></button>
      </div>
      ${startNote}
    </div>
    <div class="gb-round">
      <span class="control-label">Round</span>
      <div class="round-control">
        <button class="stepper-btn" data-action="round-adjust" data-delta="-1" aria-label="Previous round">${icon("minus", 16)}</button>
        <span class="round-value">${o.round}</span>
        <button class="stepper-btn" data-action="round-adjust" data-delta="1" aria-label="Next round">${icon("plus", 16)}</button>
      </div>
    </div>
  </section>
  ${blipsPanel(o)}
  <div class="solo-split solo-split-solo">
    <div class="solo-ref">
      <section class="solo-card solo-card-quiet">
        <h3 class="roster-section">The round</h3>
        <ul class="rule-list small">${phases}</ul>
      </section>
      <section class="solo-card solo-card-quiet">
        <h3 class="roster-section">Alert Level rules</h3>
        <ul class="rule-list small">${SOLO_ALERT_RULES.map((r) => `<li>${ruleText(r)}</li>`).join("")}</ul>
      </section>
    </div>
  </div>`;
}

// --- Campaign tab -----------------------------------------------------------

// The campaign has exactly one number - what you still owe - and it was sitting
// in a third of the page with 300px of nothing beside it while the game log,
// two columns over, wrapped "Game 2" onto two lines. The debt takes the band
// across the top with the campaign clock and the one button that moves either
// of them; below it the page splits the way the Play tab does, into the thing
// you act on after a game (perks) and the thing you only read (the log).
function campaignTab(o: SavedOutfit): string {
  const cleared = o.debtK <= 0;
  const paid = debtStart(o) - Math.max(0, o.debtK);
  const outOfGames = o.gamesPlayed >= gamesLimit(o) && !cleared;

  const log = o.gameLog
    .map((g) => `<tr><td>Game ${g.game}</td><td class="cell-num">${ck(g.earnedK)}</td><td>${escapeHtml(g.note ?? "")}</td></tr>`)
    .join("");

  // A perk belongs to a pilot, so it is shown under that pilot - what they have
  // already taken, then the control that grants them another. It used to be two
  // disconnected lists: five "Grant a perk" dropdowns, and somewhere below them
  // a flat roll of "Osip: Goblin" lines you had to match back up by name.
  //
  // And a taken perk prints its rule in full. The name on its own meant reaching
  // for the book every time it mattered, which is the one thing this screen
  // exists to save you.
  const takenFor = (shipId: string): string =>
    o.perks
      .map((p, i) => ({ p, i }))
      .filter((x) => x.p.shipId === shipId)
      .map(({ p, i }) => {
        const ship = o.ships.find((s) => s.id === p.shipId);
        const def = ship ? PERKS_BY_CLASS[ship.pilotClass].find((x) => x.name === p.perk) : undefined;
        return `<li>
          <div class="perk-taken">
            <p class="perk-taken-head"><b>${escapeHtml(p.perk)}</b></p>
            ${def ? `<p class="perk-taken-text">${ruleText(def.text)}</p>` : ""}
          </div>
          <button class="ghost-btn danger" data-action="remove-perk" data-index="${i}" aria-label="Remove ${escapeHtml(p.perk)}" title="Remove">${icon("close", 12)}</button>
        </li>`;
      })
      .join("");

  const perkPilots = o.ships
    .map((s) => {
      const list = PERKS_BY_CLASS[s.pilotClass];
      const has = new Set(o.perks.filter((p) => p.shipId === s.id).map((p) => p.perk));
      // "no duplicates" (p.213): a perk this pilot already has is still listed,
      // marked and unselectable, so the class list stays whole and you can see
      // what is left rather than watching options quietly disappear.
      const opts = list
        .map(
          (p) =>
            `<option value="${escapeHtml(p.name)}"${has.has(p.name) ? " disabled" : ""}>${p.n}. ${escapeHtml(p.name)}${has.has(p.name) ? " (taken)" : ""}</option>`,
        )
        .join("");
      const who = s.pilotName || s.shipName || `${s.pilotClass} pilot`;
      const taken = takenFor(s.id);
      return `<article class="perk-pilot">
        <p class="perk-pilot-head"><span class="perk-pilot-name">${escapeHtml(who)}</span> <span class="perk-pilot-class">${s.pilotClass}</span></p>
        ${taken ? `<ul class="perk-list">${taken}</ul>` : '<p class="perk-pilot-none">No perks taken.</p>'}
        <label class="inline-field">Grant a perk
          <select data-action="assign-perk" data-ship="${s.id}"><option value="">Grant a perk&hellip;</option>${opts}</select>
        </label>
      </article>`;
    })
    .join("");

  // Perks left behind by a ship that has since been removed from the outfit.
  // Shown rather than silently dropped, so the only way one leaves the sheet is
  // that you deleted it.
  const orphanPerks = o.perks
    .map((p, i) => ({ p, i }))
    .filter((x) => !o.ships.some((s) => s.id === x.p.shipId))
    .map(
      ({ p, i }) =>
        `<li><div class="perk-taken"><p class="perk-taken-head"><b>${escapeHtml(p.perk)}</b></p><p class="perk-taken-text">The pilot who took this is no longer in the outfit.</p></div>
         <button class="ghost-btn danger" data-action="remove-perk" data-index="${i}" aria-label="Remove ${escapeHtml(p.perk)}" title="Remove">${icon("close", 12)}</button></li>`,
    )
    .join("");

  return `
  <section class="game-bar debt-band ${cleared ? "won" : ""}">
    <div class="gb-debt">
      <span class="control-label">Still owed</span>
      <p class="debt-figure">${ck(Math.max(0, o.debtK))}</p>
      <p class="gb-note">${ck(paid)} of ${ck(debtStart(o))} paid down</p>
    </div>
    <div class="gb-clock">
      <span class="control-label">Campaign clock</span>
      ${gameTicks(o.gamesPlayed, gamesLimit(o))}
      ${outOfGames ? '<p class="issue-error">Eight games are up with debt remaining. Some very unpleasant people pay a visit: the campaign is lost.</p>' : ""}
    </div>
    <div class="gb-act">
      <button class="cta-btn" data-action="log-game">${icon("plus", 16)} Log a completed game</button>
    </div>
  </section>
  <div class="solo-split">
    <section class="solo-card solo-card-primary">
      <h3 class="roster-section">Pilot perks</h3>
      <p class="panel-note">For each ¢1k earned in a game, a surviving pilot may take a Perk from their class list (no duplicates). Roll a D12 in the roller, or grant one directly.</p>
      ${o.ships.length ? `<div class="perk-pilots">${perkPilots}</div>` : '<p class="muted">Add ships to your outfit first.</p>'}
      ${orphanPerks ? `<div class="perk-pilot perk-pilot-orphans"><p class="perk-pilot-head"><span class="perk-pilot-name">Pilots no longer with the outfit</span></p><ul class="perk-list">${orphanPerks}</ul></div>` : ""}
    </section>
    <div class="solo-ref">
      <section class="solo-card solo-card-quiet">
        <h3 class="roster-section">Game log</h3>
        ${log ? `<table class="dock-table"><thead><tr><th></th><th>Earned</th><th>Notes</th></tr></thead><tbody>${log}</tbody></table>` : '<p class="muted">No games logged yet.</p>'}
      </section>
    </div>
  </div>`;
}


export function soloOutfitView(state: AppState): string {
  const o = activeOutfit(state);
  if (!o) return `<main class="empty-state"><p>That outfit was not found.</p><p><a href="#/solo">Back to Junkspace</a></p></main>`;
  const tab: SoloTab = state.ui.soloTab ?? "outfit";

  let body = "";
  if (tab === "outfit") body = outfitTab(o);
  else if (tab === "play") body = `<main class="solo-body">${playTab(state, o)}</main>`;
  else body = `<main class="solo-body">${campaignTab(o)}</main>`;

  // solo-outfit on the wrapper is what the stylesheet hangs the page's own
  // typography off - see the note there about tracked-out caps.
  return `
  <div class="solo-outfit">
  <section class="setup-band solo-band">
    <div class="setup-head">
      <div class="setup-identity">
        <input class="fleet-name-input" type="text" value="${escapeHtml(o.name ?? "")}" placeholder="Name this outfit" aria-label="Outfit name" data-action="outfit-name" />
        ${/* Beside the name on the Outfit tab, because the budget is the first
              thing that confuses somebody arriving from the fleet builder: the
              number is not a points limit you rebuy against each game, it is a
              loan you spent once. p.201 buys the Outfit at the start of the
              campaign and never mentions buying again. */ ""}
        ${tab === "outfit"
          ? `<p class="outfit-budget-note">You have credits equal to the loan you took out at the start of the game.
             You don&rsquo;t buy more ships during these short Junkspace campaigns.</p>`
          : ""}
      </div>
      <div class="control-group control-group-emblem">
        <span class="control-label">Emblem</span>
        <div class="emblem-picker">${outfitEmblemPicker(o)}</div>
      </div>
      ${/* An outfit is a roster and every other roster in this app prints. This
            went to window.print() on the live tracker for one build, which puts
            the tab bar, the alert pips and a half-flipped blip grid on paper;
            it goes to the real print route now, same shell and same preview as
            a Fleet List. */ ""}
      <div class="setup-actions">
        <a class="bar-btn" href="#/print-outfit/${o.id}">${icon("print", 15)} Print</a>
      </div>
    </div>
  </section>
  ${tabBar(o, tab)}
  ${body}
  </div>`;
}

function outfitEmblemPicker(o: SavedOutfit): string {
  const img = imageSrc(o.emblemImage) ?? libraryUrl(o.emblemLib);
  return `<button class="emblem-choose-btn" data-action="open-emblem-modal" data-target="outfit">
    <span class="emblem-choose-preview">${emblemView(o, 40)}</span>
    <span class="emblem-choose-label">${icon("image", 15)} Choose emblem</span>
  </button>`;
}
