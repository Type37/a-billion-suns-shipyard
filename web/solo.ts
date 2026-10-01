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
  LONG_RANGE_SCANNERS_TEXT,
  LONG_RANGE_SCAN_TEXT,
} from "../src/data/junkspace.ts";
import {
  type RuleEntry,
  REVEALING_BLIPS,
  AMBUSH,
  BLIP_REACTIONS,
  GLITCH_INTRO,
  GLITCH_TABLE,
  GLITCH_RULES,
  HOSTILE_BEHAVIOUR,
  RANDOM_BEHAVIOUR_INTRO,
  RANDOM_BEHAVIOUR_TABLE,
  RANDOM_BEHAVIOUR_AFTER,
  ROUTINES,
  HOSTILES_NOTE,
  ACTIVATING_HOSTILES,
  HOSTILE_PASSIVE_ATTACKS,
} from "../src/data/junkspace-hostiles.ts";

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
import { emblemView, statGuns } from "./render.ts";
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
/** What this outfit has to spend: ¢30k whatever its Debt (see OUTFIT_BUDGET_K). */
const budgetK = (_o: SavedOutfit): number => OUTFIT_BUDGET_K;
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
// The ready-made crews used to sit here too, then became pre-built outfits on
// the Solo page; both are gone (Jet: "they suck"). See dropUntouchedSeedOutfits.
/** Log a finished game: what it earned, and an optional note (p.211: "Reduce your Debt by the amount you earned in this game"). */
export function logGameModal(state: AppState): string {
  const m = state.ui.modal;
  if (!m || m.kind !== "log-game") return "";
  return `
  <cds-modal open size="sm" class="no-modal lg-modal" data-key="lg-modal">
    <cds-modal-header>
      <cds-modal-close-button></cds-modal-close-button>
      <cds-modal-heading>Log a game</cds-modal-heading>
    </cds-modal-header>
    <cds-modal-body data-modal-primary-focus tabindex="-1">
      ${/* Carbon's own number input (Jet: "carbon my friend, carbon"), read
            when Log game is pressed, so typing and stepping both count. */ ""}
      <cds-number-input type="number" pattern="[0-9]*" locale="en-US" input-mode="decimal" placeholder="" max="" id="log-game-earned" class="lg-earned" label="Credits earned (¢k)" min="0" step="1" value="${m.earnedK}" size="lg"></cds-number-input>
      <label class="cf-f lg-note"><span class="cf-l">Note</span>
        <textarea id="log-game-note" rows="3"></textarea></label>
    </cds-modal-body>
    <cds-modal-footer>
      <cds-modal-footer-button kind="secondary" data-action="close-modal">Cancel</cds-modal-footer-button>
      <cds-modal-footer-button kind="primary" data-action="log-game-confirm">Log game</cds-modal-footer-button>
    </cds-modal-footer>
  </cds-modal>`;
}

export function newOutfitModal(state: AppState): string {
  const m = state.ui.modal;
  if (!m || m.kind !== "new-outfit") return "";
  const draft = state.ui.newOutfit ?? { emblem: "delta" };
  const debt = draft.debtStartK ?? STARTING_DEBT_K;
  const games = draft.gamesLimit ?? DEBT_CLEAR_GAMES;

  return `
  <cds-modal open size="sm" class="no-modal" data-key="no-modal">
    <cds-modal-header>
      <cds-modal-close-button></cds-modal-close-button>
      <cds-modal-heading>Start a new outfit</cds-modal-heading>
    </cds-modal-header>
    <cds-modal-body class="no-modal-body" data-modal-primary-focus tabindex="-1">
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
        ${/* Carbon number inputs, uncontrolled like the name above and read
              when the outfit is created. Typed or stepped, both count. */ ""}
        <div class="no-dials">
          <cds-number-input type="number" pattern="[0-9]*" locale="en-US" input-mode="decimal" placeholder="" id="no-debt" label="Debt (¢k)" min="5" max="200" step="5" value="${debt}" size="lg"></cds-number-input>
          <cds-number-input type="number" pattern="[0-9]*" locale="en-US" input-mode="decimal" placeholder="" id="no-games" label="Games to clear it" min="1" max="30" step="1" value="${games}" size="lg"></cds-number-input>
        </div>
    </cds-modal-body>
    <cds-modal-footer>
      <cds-modal-footer-button kind="secondary" data-action="close-modal">Cancel</cds-modal-footer-button>
      <cds-modal-footer-button kind="primary" data-action="solo-new-outfit-create">Start blank</cds-modal-footer-button>
    </cds-modal-footer>
  </cds-modal>`;
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
            <span class="outfit-card-meta">${o.ships.length} ${o.ships.length === 1 ? "ship" : "ships"}, updated ${formatDate(o.updatedAt)}</span>
          </span>
        </a>
        <div class="outfit-card-debt ${cleared ? "is-clear" : ""}">
          <div class="ocd-line"><span>${ck(Math.max(0, o.debtK))} still owed</span><span>${ck(paid)} paid</span></div>
          ${gameTicks(o.gamesPlayed, gamesLimit(o))}
        </div>
        <div class="outfit-card-actions">
          <cds-button has-main-content kind="tertiary" size="lg" class="btn" href="#/solo/${o.id}">Continue${icon("chevronRight", 15).replace("<svg ", '<svg slot="icon" ')}</cds-button>
          ${/* Labelled, in a Carbon menu like the fleet cards: the two bare icons
                explained themselves only in hover text, which a phone never shows. */ ""}
          <cds-overflow-menu kind="ghost" class="card-menu" label="Actions" size="lg" enable-v12-overflowmenu menu-alignment="bottom-end">
            ${icon("ix-context-menu", 20).replace("<svg ", '<svg slot="icon" ')}
            <cds-menu>
              <cds-menu-item label="Duplicate" data-action="duplicate-outfit" data-id="${o.id}"></cds-menu-item>
              <cds-menu-item label="Delete" kind="danger" data-action="delete-outfit" data-id="${o.id}"></cds-menu-item>
            </cds-menu>
          </cds-overflow-menu>
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
        <cds-button has-main-content kind="primary" size="lg" class="btn" data-action="solo-new-outfit-open">Start a new outfit${icon("plus", 18).replace("<svg ", '<svg slot="icon" ')}</cds-button>
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
  return `<nav class="solo-tabs">${t("outfit", "Outfit")}${t("play", "Play")}${t("campaign", "Campaign")}</nav>`;
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
        <div class="ship-row-details">${statGuns(s)}</div>
        ${/* The Recon Ship's scanner rule, p.202 verbatim. It was transcribed
              but never shown anywhere, so the one thing that makes a ¢2k Recon
              Ship worth taking was invisible. */ ""}
        ${s.auxiliaryFitting === "Long-Range Scanners" ? `<p class="ship-rule">${ruleText(LONG_RANGE_SCANNERS_TEXT)}</p><p class="ship-rule">${ruleText(LONG_RANGE_SCAN_TEXT)}</p>` : ""}
      </div>
      <span class="add-cue">${icon("plus", 15)}<span>Add</span></span>
    </article>`,
  ).join("");
}

/*
 * What a pilot has earned, and the control that grants them another.
 *
 * This lived on the Campaign tab, one screen away from the pilot it belonged
 * to. A perk is not a campaign fact like the debt or the game count - it is
 * part of what a ship DOES, sitting directly under the class ability it is
 * bought alongside. So it goes where the pilot is.
 *
 * "No duplicates" (p.213): a perk this pilot already has is still listed,
 * marked and unselectable, so the class list stays whole and you can see what
 * is left rather than watching options quietly disappear.
 *
 * A taken perk prints its rule in full. The name on its own meant reaching for
 * the book every time it mattered, which is the one thing this screen exists to
 * save you.
 */
function perkBlock(o: SavedOutfit, sh: SavedOutfit["ships"][number]): string {
  const list = PERKS_BY_CLASS[sh.pilotClass] ?? [];
  // p.212: one Perk per surviving pilot per game, one per ¢1k earned. Shown
  // as tags; nothing is blocked (house rules happen).
  const pb = o.perkBudget;
  const status = !pb
    ? ""
    : pb.given.includes(sh.id)
      ? `<cds-tag type="gray" size="md">Perk taken after game ${pb.game}</cds-tag>`
      : !pb.surviving.includes(sh.id)
        ? `<cds-tag type="gray" size="md">Destroyed in game ${pb.game}</cds-tag>`
        : "";
  const has = new Set(o.perks.filter((p) => p.shipId === sh.id).map((p) => p.perk));
  const opts = list
    .map(
      (p) =>
        `<cds-select-item value="${escapeHtml(p.name)}" data-action="assign-perk-item" data-ship="${sh.id}" data-perk="${escapeHtml(p.name)}"${has.has(p.name) ? " disabled" : ""}>${p.n}. ${escapeHtml(p.name)}${has.has(p.name) ? " (taken)" : ""}</cds-select-item>`,
    )
    .join("");
  const taken = o.perks
    .map((p, i) => ({ p, i }))
    .filter((x) => x.p.shipId === sh.id)
    .map(({ p, i }) => {
      const def = list.find((x) => x.name === p.perk);
      return `<li><div class="perk-taken">
          <p class="perk-taken-head"><b>${escapeHtml(p.perk)}</b></p>
          ${def ? `<p class="perk-taken-text">${ruleText(def.text)}</p>` : ""}
        </div>
        <button class="ghost-btn danger" data-action="remove-perk" data-index="${i}" aria-label="Remove ${escapeHtml(p.perk)}" title="Remove">${icon("close", 12)}</button></li>`;
    })
    .join("");
  const who = sh.pilotName || sh.shipName || `${sh.pilotClass} pilot`;
  return `<div class="perk-block">${status}
      ${taken ? `<ul class="perk-list">${taken}</ul>` : ""}
      ${/* Carbon select (a native one before). The items carry the action, so
            main.ts's cds-select bridge runs it; value stays empty, so the
            field reads "Grant a perk" again after each grant. */ ""}
      <cds-select class="perk-select" label-text="Grant a perk to ${escapeHtml(who)}" hide-label placeholder="Grant a perk" value="" size="lg">${opts}</cds-select>
    </div>`;
}

function outfitTab(o: SavedOutfit): string {
  const cost = outfitCost(o);
  const remaining = budgetK(o) - cost;
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
          <cds-button has-main-content kind="danger-ghost" size="lg" class="btn" data-action="outfit-remove-ship" data-ship="${s.id}">Remove${icon("trash", 14).replace("<svg ", '<svg slot="icon" ')}</cds-button>
        </div>
        ${
          // Same stat chips and weapons table the catalogue uses, so a ship
          // reads identically whether you're picking it or already own it.
          // Boxed as one "spec" column so the pilot controls can sit beside it
          // instead of stacking under a half-empty row.
          def ? `<div class="ru-spec">${statGuns(def)}</div>` : ""
        }
        ${/* A Recon Ship in the outfit carries its scanner rule here too, so
              the Long-Range Scan is in front of you while you play (Jet:
              "remind players that the long range scanner is a thing"). p.202,
              verbatim, same text as the catalogue row. */ ""}
        ${def?.auxiliaryFitting === "Long-Range Scanners" ? `<p class="ship-rule">${ruleText(LONG_RANGE_SCANNERS_TEXT)}</p><p class="ship-rule">${ruleText(LONG_RANGE_SCAN_TEXT)}</p>` : ""}
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
            ${perkBlock(o, s)}
          </div>
        </div>
      </article>`;
    })
    .join("");

  return `
  <main class="workspace solo-workspace">
    <section class="catalog">
      <h3 class="catalog-title">Stock ship classes</h3>
      <div class="catalog-list">${soloShipCatalog()}</div>
    </section>
    <aside class="roster">
      <div class="roster-sheet">
        <!--
          No name-and-emblem header here. The setup band directly above this
          panel already shows both, and shows them editable; repeating them
          200px lower was the same outfit introduced to you twice.
        -->
        ${/* No running count. "3/5" beside a list of three ships you can see is
              the app counting to three for you, every time you look at it. The
              cap only matters at the moment it stops you, so it only speaks
              then. */ ""}
        <h3 class="roster-section">Ships${full ? ` <span class="roster-warn">Outfit full</span>` : ""}${
          o.perkBudget && o.perkBudget.left > 0
            ? ` <cds-tag type="blue" size="md">${o.perkBudget.left} ${o.perkBudget.left === 1 ? "perk" : "perks"} to grant</cds-tag>`
            : ""
        }</h3>
        ${/* Budget as Carbon's progress bar (Jet, 1 October 2026: remove the
              Budget / Spent / Left readout, "have a simple meter"). One label,
              one bar, one line of helper text; over budget it goes to
              Carbon's error state and says by how much. */ ""}
        ${/* The figure rides on the label line, not a helper line under the bar
              (Jet: "put the budget to the right of the word budget"). */ ""}
        <cds-progress-bar class="solo-budget" label="Budget ${over ? `¢${-remaining}k over ¢${budgetK(o)}k` : `¢${cost}k of ¢${budgetK(o)}k`}" max="${budgetK(o)}" value="${Math.min(cost, budgetK(o))}" ${over ? 'status="error"' : ""}></cds-progress-bar>
        ${/* p.212, verbatim. The old one-line paraphrase dropped the
              one-Perk-per-pilot-per-game limit and the D12 roll. */ ""}
        <p class="panel-note">For each ¢1k you earned during this game, choose one of your surviving pilots to gain a Perk. Each pilot can only gain a maximum of one Perk after each game. When you gain a Perk, roll a D12. If you roll a Perk you already have, you can select and gain another Perk from your class list.</p>
        ${shipRows || ""}
        ${over ? '<div class="inspection fail"><p class="issue-error">Over budget by ' + ck(-remaining) + ".</p></div>" : ""}
        <div class="roster-actions">
          <cds-button has-main-content kind="danger-tertiary" size="lg" class="btn" data-action="delete-outfit" data-id="${o.id}">Delete outfit${icon("trash", 16).replace("<svg ", '<svg slot="icon" ')}</cds-button>
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
      ${/* A Carbon button. It was a class with no styles at all, under a line
            of explainer that was not the book's. */ ""}
      <cds-button has-main-content kind="tertiary" size="lg" class="btn" data-action="solo-shuffle-blips">Shuffle the bag${icon("random", 15).replace("<svg ", '<svg slot="icon" ')}</cds-button>
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
            p.primary ? `<span class="blip-w"><b>Primary</b> ${escapeHtml(p.primary)}</span>` : "",
            p.auxiliary ? `<span class="blip-w"><b>Auxiliary</b> ${escapeHtml(p.auxiliary)}</span>` : "",
          ].join("")
        : "";
      return `
      <button class="blip ${b.revealed ? "is-revealed" : ""}" data-action="solo-blip-reveal" data-index="${i}"
              aria-label="${b.revealed ? `Blip ${b.n}, ${escapeHtml(name)}. Turn it back over.` : "Face-down Blip marker. Turn it over."}">
        ${/* Each face-down marker carries its place in the row (Jet: "add
              numbers to the blips"), so the tile can be matched to the marker
              on the table. */ ""}
        <span class="blip-face blip-back"><span class="blip-slot">${i + 1}</span>${BLIP_PING}</span>
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
        <cds-button has-main-content kind="tertiary" size="lg" class="btn" data-action="solo-shuffle-blips" title="Shuffle the eight blips into a random order">Reshuffle${icon("random", 10).replace("<svg ", '<svg slot="icon" ')}</cds-button>
      </h3>
      <div class="blip-grid">${markers}</div>
      ${(() => {
        const up = blips
          .map((b, i) => ({ b, i, p: byName.get(BLIP_TO_PIRATE[b.n] ?? "") }))
          .filter((x) => x.b.revealed && x.p);
        if (!up.length) return "";
        return `<ul class="sip-list blip-hp">${up
          .map(
            ({ i, b, p }) => `<li class="sip-row">
              <span class="sip-name"><b>${escapeHtml(p!.name)}</b><span class="sip-who">Blip ${i + 1}, marker ${b.n}</span></span>
              ${hpField(o, `blip:${i}`, p!.silhouette, `${p!.name}, Blip ${i + 1}`)}
            </li>`,
          )
          .join("")}</ul>`;
      })()}
    </section>`;
}

/** CMD tokens gained each Command Phase: 5 (p.205), +1 per Quarterback (p.213). */
export function cmdGain(o: SavedOutfit): number {
  return 5 + o.perks.filter((p) => p.perk === "Quarterback").length;
}

/** A pilot's Initiative Value in D6: 2 to start (p.202), +1 Slick, +2 Rogue (pp.212-213). */
function initiativeDice(o: SavedOutfit, shipId: string): number {
  const mine = o.perks.filter((p) => p.shipId === shipId).map((p) => p.perk);
  return 2 + (mine.includes("Slick") ? 1 : 0) + (mine.includes("Rogue") ? 2 : 0);
}

/** One HP field: Carbon number input, 0 to the ship's Silhouette (HP = Silhouette, p.47). */
/*
 * Every <cds-number-input> here spells out the attributes Carbon reflects onto
 * itself (type, pattern, locale, input-mode, placeholder, max, step). morph
 * removes host attributes the new markup lacks, so on the first repaint after
 * any change those went and the field drew in Carbon's red invalid state with
 * an error icon ("Please match the requested format"). Same trap as the
 * modal footer's has-three-buttons.
 */
function hpField(o: SavedOutfit, key: string, max: number, label: string): string {
  const hp = Math.max(0, max - (o.damage?.[key] ?? 0));
  return `<span class="hp-cell">
      <cds-number-input type="number" pattern="[0-9]*" locale="en-US" input-mode="decimal" placeholder="" class="hp-input" label="${escapeHtml(label)} HP" hide-label min="0" max="${max}" step="1" value="${hp}" size="md" data-action="ship-hp" data-key="${escapeHtml(key)}" data-max="${max}"></cds-number-input>
      <span class="hp-of">of ${max} HP</span>
      ${hp === 0 ? `<cds-tag type="red" size="md">Destroyed</cds-tag>` : ""}
    </span>`;
}

/*
 * The outfit's ships during a game: who is flying, their Initiative, and HP.
 * Found playing a campaign through the app (1 October 2026): nothing on Play
 * tracked damage, so the tracker could not tell you which ship was down. A
 * Carbon structured-list look: one row per ship, quiet row lines.
 */
function shipsInPlay(o: SavedOutfit): string {
  if (!o.ships.length) return "";
  const rows = o.ships
    .map((sh) => {
      const def = shipById.get(sh.shipClassId);
      if (!def) return "";
      const who = sh.pilotName ? `${escapeHtml(sh.pilotName)}, ${sh.pilotClass}` : sh.pilotClass;
      return `<li class="sip-row">
        <span class="sip-name"><b>${escapeHtml(sh.shipName || def.name)}</b><span class="sip-who">${who}</span></span>
        <span class="sip-init">Initiative ${initiativeDice(o, sh.id)}D6</span>
        ${hpField(o, sh.id, def.silhouette, sh.shipName || def.name)}
      </li>`;
    })
    .join("");
  return `<section class="solo-card sip">
      <h3 class="roster-section">Your ships</h3>
      <ul class="sip-list">${rows}</ul>
    </section>`;
}

/*
 * The face-down Blip mark: Stash's radar-duotone ("stash:radar-duotone", Jet's
 * pick, 1 October 2026), drawn large. Copied from the set, not drawn here.
 */
const BLIP_PING = `<svg class="blip-ping" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 7.75A4.25 4.25 0 1 0 16.25 12a.75.75 0 0 1 1.5 0a5.75 5.75 0 1 1-3.45-5.271a.75.75 0 0 1-.6 1.374A4.2 4.2 0 0 0 12 7.75" opacity=".5"/><path fill="currentColor" d="M12 4.75a7.25 7.25 0 0 0-1.233 14.396a1.498 1.498 0 0 1 2.466 0A7.25 7.25 0 0 0 19.25 12a.75.75 0 0 1 1.5 0a8.75 8.75 0 0 1-7.396 8.646a1.5 1.5 0 0 1-2.708 0a8.75 8.75 0 1 1 4.636-16.76a.75.75 0 1 1-.563 1.39A7.2 7.2 0 0 0 12 4.75"/><path fill="currentColor" d="M14 12a2 2 0 1 1-1.219-1.842L17.97 4.97a.75.75 0 1 1 1.06 1.06l-5.188 5.189c.102.24.158.504.158.781m-7 1.5a1.5 1.5 0 1 0 0-3a1.5 1.5 0 0 0 0 3"/></svg>`;

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
        <cds-button has-main-content kind="tertiary" size="lg" class="btn" data-action="alert-adjust" data-delta="1" data-end-phase="1">End Phase <b class="alert-delta">+1</b>${icon("plus", 13).replace("<svg ", '<svg slot="icon" ')}</cds-button>
        <cds-button has-main-content kind="tertiary" size="lg" class="btn" data-action="alert-adjust" data-delta="1">Reveal Mass 2-3 <b class="alert-delta">+1</b>${icon("plus", 13).replace("<svg ", '<svg slot="icon" ')}</cds-button>
        <cds-button has-main-content kind="tertiary" size="lg" class="btn" data-action="alert-adjust" data-delta="-2">Destroy Mass 2-3 <b class="alert-delta">&minus;2</b>${icon("minus", 13).replace("<svg ", '<svg slot="icon" ')}</cds-button>
        <cds-button has-main-content kind="tertiary" size="lg" class="btn" data-action="alert-adjust" data-delta="-1">Take one back <b class="alert-delta">&minus;1</b>${icon("minus", 13).replace("<svg ", '<svg slot="icon" ')}</cds-button>
      </div>
      ${startNote}
    </div>
    <div class="gb-round">
      <span class="control-label">Round</span>
      <cds-number-input type="number" pattern="[0-9]*" locale="en-US" input-mode="decimal" placeholder="" max="" class="round-input" label="Round" hide-label min="1" step="1" value="${o.round}" size="lg" data-action="round-set"></cds-number-input>
      <span class="control-label">CMD tokens</span>
      <cds-number-input type="number" pattern="[0-9]*" locale="en-US" input-mode="decimal" placeholder="" max="" class="round-input" label="CMD tokens" hide-label min="0" step="1" value="${o.cmd ?? cmdGain(o)}" size="lg" data-action="cmd-set"></cds-number-input>
    </div>
  </section>
  ${shipsInPlay(o)}
  ${blipsPanel(o)}
  ${soloRefTabs(state)}`;
}

/*
 * The rules a solo game is run from, under the tracker, as Carbon line tabs
 * (Jet, 1 October 2026: put the pirates and the hostile rules on, "use carbon
 * design and figure out how stuff gets set up"). One tab open at a time, so
 * the tracker above never sits on top of four screens of rules:
 *   Round     - the four phases and the Alert Level rules, as before
 *   Hostiles  - Hostile Behaviour, the Random Behaviour table, routines,
 *               activating Hostiles, their passive attacks
 *   Blips     - revealing, Ambush, Blip reactions, Glitch a Blip
 *   Pirates   - the Aggressor list the Blips are revealed against
 * All text verbatim (src/data/junkspace-hostiles.ts). Jobs are not here: they
 * are played from cards.
 */
function ruleEntry(e: RuleEntry): string {
  return `<p class="rule-entry">${e.name ? `<b>${ruleText(e.name)}</b> ` : ""}${ruleText(e.text)}</p>${
    e.steps ? `<ol class="rule-steps">${e.steps.map((t) => `<li>${ruleText(t)}</li>`).join("")}</ol>` : ""
  }`;
}

function d6Table(head: string, rows: [string, string][]): string {
  return `<table class="ref-table ref-d6"><thead><tr><th scope="col">D6</th><th scope="col">${escapeHtml(head)}</th></tr></thead><tbody>${rows
    .map(([d, t]) => `<tr><td>${escapeHtml(d)}</td><td>${ruleText(t)}</td></tr>`)
    .join("")}</tbody></table>`;
}

function piratesTable(): string {
  const cols = ["Blip", "Ship Class", "Mass", "Thrust", "Sil.", "Shields", "Primary Weapons", "Auxiliary Weapons"];
  const rows = JUNKSPACE_PIRATES.map((p) => {
    const cells = [p.blip, p.name, String(p.mass), `${p.thrust}"`, String(p.silhouette), String(p.shields), p.primary, p.auxiliary];
    return `<tr>${cells.map((c, i) => `<td data-label="${escapeHtml(cols[i]!)}">${ruleText(c)}</td>`).join("")}</tr>`;
  }).join("");
  return `<table class="ref-table ref-pirates"><thead><tr>${cols.map((c) => `<th scope="col">${escapeHtml(c)}</th>`).join("")}</tr></thead><tbody>${rows}</tbody></table>`;
}

function soloRefTabs(state: AppState): string {
  const tab = state.ui.soloRefTab ?? "round";
  const tabs: [NonNullable<AppState["ui"]["soloRefTab"]>, string][] = [
    ["round", "Round"],
    ["hostiles", "Hostiles"],
    ["blips", "Blips"],
    ["pirates", "Pirates"],
  ];
  const phases = SOLO_PHASES.map((p) => `<li><b>${escapeHtml(p.name)}.</b> ${ruleText(p.text)}</li>`).join("");
  let body = "";
  if (tab === "round") {
    body = `
      <h4 class="ref-h">The round</h4>
      <ul class="rule-list">${phases}</ul>
      <h4 class="ref-h">Alert Level</h4>
      <ul class="rule-list">${SOLO_ALERT_RULES.map((r) => `<li>${ruleText(r)}</li>`).join("")}</ul>`;
  } else if (tab === "hostiles") {
    body = `
      <h4 class="ref-h">Activating Hostiles</h4>
      <p class="rule-entry">${ruleText(ACTIVATING_HOSTILES)}</p>
      <h4 class="ref-h">Hostile behaviour</h4>
      <p class="rule-entry">${ruleText(HOSTILE_BEHAVIOUR)}</p>
      <h4 class="ref-h">Random behaviour</h4>
      <p class="rule-entry">${ruleText(RANDOM_BEHAVIOUR_INTRO)}</p>
      ${d6Table("Behaviour", RANDOM_BEHAVIOUR_TABLE)}
      <p class="rule-entry">${ruleText(RANDOM_BEHAVIOUR_AFTER)}</p>
      <h4 class="ref-h">Routines</h4>
      ${ROUTINES.map(ruleEntry).join("")}
      <p class="rule-entry ref-note">${ruleText(HOSTILES_NOTE)}</p>
      <h4 class="ref-h">Passive attacks</h4>
      <p class="rule-entry">${ruleText(HOSTILE_PASSIVE_ATTACKS)}</p>`;
  } else if (tab === "blips") {
    body = `
      <h4 class="ref-h">Revealing Blips</h4>
      ${REVEALING_BLIPS.map(ruleEntry).join("")}
      <h4 class="ref-h">Ambush</h4>
      <p class="rule-entry">${ruleText(AMBUSH)}</p>
      <h4 class="ref-h">Blip reactions</h4>
      <p class="rule-entry">${ruleText(BLIP_REACTIONS)}</p>
      <h4 class="ref-h">Glitch a Blip</h4>
      <p class="rule-entry">${ruleText(GLITCH_INTRO)}</p>
      ${d6Table("Glitch the Blip", GLITCH_TABLE)}
      ${GLITCH_RULES.map(ruleEntry).join("")}`;
  } else {
    body = `
      ${piratesTable()}
      <p class="rule-entry">${ruleText(PIRATE_RULE)}</p>`;
  }
  return `
  <section class="solo-ref-block">
    <nav class="solo-tabs solo-ref-tabs" role="tablist" aria-label="Rules">${tabs
      .map(
        ([id, label]) =>
          `<button class="solo-tab ${tab === id ? "selected" : ""}" role="tab" aria-selected="${tab === id}" data-action="solo-ref-tab" data-tab="${id}">${label}</button>`,
      )
      .join("")}</nav>
    <div class="solo-ref-panel" role="tabpanel">${body}</div>
  </section>`;
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
      ${/* p.201, verbatim, with this campaign's game count in place of the
            standard 8 (it said "Eight" whatever the dial was set to). */ ""}
      ${outOfGames ? `<p class="issue-error">If, after ${gamesLimit(o)} games, you still have outstanding debt, some very unpleasant people pay a visit to your space dock and you lose the campaign (and your ships).</p>` : ""}
    </div>
    ${/* Logging stays available after the campaign is won or lost. A
          playtest logged a ninth game of an eight-game campaign and hiding
          the button was tried; it was the strict reading (Jet: "postel's
          law"). The outcome line above says where the campaign stands; a
          player who keeps going, house rules or not, is not stopped. */ ""}
    <div class="gb-act">
      <cds-button has-main-content kind="primary" size="lg" class="btn" data-action="log-game">Log a completed game${icon("plus", 16).replace("<svg ", '<svg slot="icon" ')}</cds-button>
    </div>
  </section>
  <div class="solo-split solo-split-solo">
    <div class="solo-ref">
      ${orphanPerks ? `<section class="solo-card solo-card-quiet"><h3 class="roster-section">Perks with no pilot</h3><ul class="perk-list">${orphanPerks}</ul></section>` : ""}
      ${/* No games yet, no section: an empty list shows nothing rather than a
            "No games logged yet." line (Jet's rules for this app). */ ""}
      ${o.gameLog.length ? `<section class="solo-card solo-card-quiet">
        <h3 class="roster-section">Game log</h3>
        ${
          o.gameLog.length
            ? `<ol class="game-log">${o.gameLog
                .map(
                  (g) => `<li class="game-log-row">
                    <span class="glr-head">
                      <span class="glr-n">Game ${g.game}</span>
                      <span class="glr-earned">${ck(g.earnedK)}</span>
                      ${g.date ? `<span class="glr-date">${escapeHtml(formatDate(g.date))}</span>` : ""}
                    </span>
                    ${g.note ? `<span class="glr-note">${escapeHtml(g.note)}</span>` : ""}
                    ${/* A mis-logged game can be taken out again (Jet: "can you
                          even remove anything"). Removing it gives the Debt back
                          and recounts games and the next starting Alert. */ ""}
                    <cds-button has-main-content kind="danger-ghost" size="sm" class="btn glr-remove" data-action="remove-game" data-game="${g.game}">Remove${icon("trash", 14).replace("<svg ", '<svg slot="icon" ')}</cds-button>
                  </li>`,
                )
                .join("")}</ol>`
            : ""
        }
      </section>` : ""}
      ${/* Somewhere to write down what the Junkspace did to you. A campaign is
            a story told over eight games and the app recorded three integers of
            it. Uncontrolled, and saved on blur: routing every keystroke through
            the store would re-render the textarea and drop the caret. */ ""}
      <section class="solo-card solo-card-quiet">
        <h3 class="roster-section">Campaign notes</h3>
        <textarea class="outfit-notes" data-action="outfit-notes" rows="6"
                  aria-label="Campaign notes">${escapeHtml(o.notes ?? "")}</textarea>
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
    ${/* One fixed row on every tab: emblem, name, Print. The Outfit tab used
          to add a note under the name ("You have credits equal to the loan you
          took out...") that the other tabs lacked, so the name moved 65px up
          and down as you switched tabs (Jet: "the jump continues"). The note
          was also untrue once the budget became a flat ¢30k, and not the
          book's words, so it is gone rather than moved. The fields are
          Carbon's: label above, grey field, bottom line. */ ""}
    <div class="solo-head">
      <button class="cf-art solo-emblem" data-action="open-emblem-modal" data-target="outfit" aria-label="Choose emblem" title="Choose emblem">${emblemView(o, 48)}</button>
      <label class="cf-f solo-name"><span class="cf-l">Outfit name</span>
        <input class="fleet-name-input" type="text" value="${escapeHtml(o.name ?? "")}" data-action="outfit-name" /></label>
      ${/* An outfit is a roster and every other roster in this app prints, on
            the real print route (#/print-outfit), not window.print(). */ ""}
      ${/* The tabs share the head row on a desktop (Jet: "put outfit/play/
            campaign on that same line"); on a phone they take a row of their
            own under the name. */ ""}
      ${tabBar(o, tab)}
      <cds-button has-main-content kind="tertiary" size="lg" class="btn solo-print" href="#/print-outfit/${o.id}">Print${icon("print", 15).replace("<svg ", '<svg slot="icon" ')}</cds-button>
    </div>
  </section>
  ${body}
  </div>`;
}

