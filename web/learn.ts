// Learn to Play.
//
// Six pages, one per tab, reached at #/learn/<tab>. Only the current one is
// rendered.
//
// This was briefly built the other way - all six on one long scrolling page,
// with the tabs as scroll positions and a reading-progress bar across the top.
// That is a good shape for an article somebody reads start to finish, and the
// wrong one for this: each tab is a self-contained part of the rules that
// people arrive at directly and leave from directly, and stitching them
// together meant every visit began by scrolling past parts you were not asking
// about. Separate pages, so a tab is a place rather than a position. The pager
// at the foot of each one keeps the read-it-in-order path.
//
// Where the tab bar sits is decided by viewport, not by taste. On a phone the
// reliable one-thumb zone is the bottom third of the screen, and it shrinks as
// screens grow, so the tabs are fixed to the bottom. On a desktop there is no
// thumb, pointer travel is uniform, and a long reading page conventionally
// carries its chapter nav above the text, so they sit in the header. Same six
// tabs, same markup, moved by media query.
//
// RULES TEXT IS VERBATIM. Everything quoted from the rulebook below is
// transcribed from "ABS 2E Layouts 7.pdf" with its page number in the comment
// above it. Do not tighten, summarise or re-order it. The one thing that may be
// dropped is a run-in line whose only job in the book was to introduce a list on
// a page with no heading over it - here there IS a heading saying the same
// thing, and printing both says it twice. Prose that is ours - the
// "why this is cool" callouts, the section ledes - is clearly ours, sits in its
// own elements, and is written in italic serif so a reader can tell at a glance
// which voice they are hearing.

// massGlyphs, not ruleText: every string of prose on this page is an HTML
// literal in this file, with its own <b> tags and typographic entities, and
// ruleText would escape both. See massGlyphs' own note on when each applies.
import { escapeHtml, massGlyphs } from "./format.ts";
import { emblem, icon } from "./icons.ts";
import { learnDiagram } from "./diagrams.ts";
import type { AppState } from "./state.ts";

export interface LearnTab {
  id: string;
  /** Full section heading, used on the page and in the desktop tab strip. */
  label: string;
  /** Two words at most: the bottom bar on a 375px phone has six of these. */
  short: string;
  ico: string;
}

/** The six sections, in reading order. Ids are URL surface (see state.ts). */
export const LEARN_TABS: LearnTab[] = [
  { id: "eras", label: "Pick an era", short: "Eras", ico: "logo" },
  { id: "prepare", label: "Getting prepared", short: "Prepare", ico: "wrench" },
  { id: "command", label: "Initiative & Command", short: "Command", ico: "cmd-delta" },
  { id: "jump", label: "The Jump Phase", short: "Jump", ico: "shuffle" },
  { id: "tactical", label: "The Tactical Phase", short: "Tactical", ico: "arc-primary" },
  { id: "end", label: "End Phase & scoring", short: "Scoring", ico: "flag" },
];

/**
 * A "why this is cool" callout: our voice, not the rulebook's.
 *
 * Always italic serif, which is the same treatment faction taglines get
 * elsewhere in the app, so the register is already established - serif italic
 * means "someone is talking to you" and sans means "this is the rule".
 */
const cool = (body: string): string => `
  <aside class="ltp-cool">
    <p class="ltp-cool-tag">${emblem("star", 13, "ltp-cool-star")} Why this is cool</p>
    <div class="ltp-cool-body">${body}</div>
  </aside>`;

/**
 * A block of rulebook text, marked as quoted.
 *
 * It used to print "A Billion Suns 2E, p.12" under every block. Thirty-odd of
 * those down one page read as a bibliography rather than a rulebook, and the
 * reader already knows what they are reading. The page number still matters to
 * whoever maintains this file, so it stays as the `// p.12, verbatim.` comment
 * above each call - which is where it was always written anyway.
 */
const quote = (body: string): string => `
  <blockquote class="ltp-quote">${body}</blockquote>`;

const h = (level: 2 | 3 | 4, text: string, cls = ""): string =>
  `<h${level} class="ltp-h${level} ${cls}">${text}</h${level}>`;

const p = (text: string): string => `<p class="ltp-p">${massGlyphs(text)}</p>`;

const ul = (items: string[], cls = ""): string =>
  `<ul class="ltp-list ${cls}">${items.map((i) => `<li>${massGlyphs(i)}</li>`).join("")}</ul>`;

const ol = (items: string[]): string =>
  `<ol class="ltp-list ltp-list-num">${items.map((i) => `<li>${massGlyphs(i)}</li>`).join("")}</ol>`;

// ---------------------------------------------------------------------------
// 1. Pick an era
// ---------------------------------------------------------------------------

interface EraCard {
  /** Matches the era keys the title animators switch on in main.ts. */
  key: "hyper" | "unity" | "arma";
  name: string;
  tagline: string;
  players: string;
  complexity: string;
  body: string[];
  /** Optional "why this is cool" copy, where the author gave us one. */
  cool?: string;
}

// This copy is the author's, supplied verbatim, and is NOT from the rulebook -
// it is the pitch for each era written for this page. Same rule applies: it is
// finished text, so it gets typed in and left alone.
const ERA_CARDS: EraCard[] = [
  {
    key: "hyper",
    name: "Hypergrowth",
    tagline: "The future belongs to the ruthless.",
    players: "2&ndash;4 players",
    complexity: "High complexity",
    body: [
      "Hypergrowth is the most complex game mode. You command a ruthless corporation bent on profits at any cost. You have an entire shipyard&rsquo;s worth of vessels at your beck and call, but the shareholders are always watching. This is the original mode from ABS 1e. Complexity is high, and the focus is on completing missions. It&rsquo;s a puzzle solved with missiles, for 2 to 4 players.",
    ],
    cool: "Hypergrowth offers a light-hearted take on cut-throat cyberpunk corporate cynicism. It is a time of hyper-capitalism, in space, with cool spaceships.",
  },
  {
    key: "unity",
    name: "Age of Unity",
    tagline: "Turmoil has engulfed the galaxy. The taxation of trade routes to outlying star systems is in dispute.",
    players: "2 players",
    complexity: "Medium complexity",
    body: [
      "This is an age of heroic resistance against fascism and dogma. This mode has traditional listbuilding and missions about operatic sci-fi tales of heroism and daring; of rebellion, of war in the stars. By default, it always uses two tables, is only for two players, and victory is attained via an equal mix of objectives and winning battles.",
    ],
  },
  {
    key: "arma",
    name: "Armageddon",
    tagline: "The galaxy is in flames.",
    players: "2&ndash;4 players",
    complexity: "Low complexity",
    body: [
      "This is an era of desperate, total war. Battlefleets engage in titanic engagements deep in space as our own protectors become our inhuman captors.",
      "This is the simplest way to play A Billion Suns 2e. It has overtly militaristic factions, listbuilding, and straightforward objectives; it works great at 2-4 players. Victory comes through winning battle, first and foremost.",
    ],
  },
];

/**
 * One era, as an accordion.
 *
 * The title carries data-anim-title and data-era, which is the same contract the
 * faction picker's title uses: main.ts reads them and runs that era's entrance
 * animation - Hypergrowth decodes character by character, Age of Unity wipes,
 * Armageddon slams. Reusing the contract rather than the markup means an era
 * gains its animation here for free, and the resting state in CSS is correct
 * before any script runs.
 *
 * Open state is native <details>. This one genuinely does expand in flow, which
 * is what an accordion in an article is; the no-layout-shift rule is about
 * menus and popovers opening over content you were reading, not about a section
 * you deliberately unfolded.
 */
function eraAccordion(e: EraCard, first: boolean): string {
  return `
  <details class="ltp-era ltp-era--${e.key}" data-era-acc="${e.key}" ${first ? "open" : ""}>
    <summary class="ltp-era-head">
      <span class="ltp-era-head-text">
        <span class="ltp-era-name">${escapeHtml(e.name)}</span>
        <span class="ltp-era-meta">${e.players} <span class="ltp-dot">&middot;</span> ${escapeHtml(e.complexity)}</span>
      </span>
      ${icon("chevronDown", 20, "ltp-era-chev")}
    </summary>
    <div class="ltp-era-body">
      <h3 class="nfd-title nfd-title--${e.key} ltp-era-title" data-anim-title data-era="${e.key}" data-title="${escapeHtml(e.name)}">${escapeHtml(e.name)}</h3>
      <p class="ltp-era-tagline">${e.tagline}</p>
      ${e.body.map((b) => `<p class="ltp-p">${b}</p>`).join("")}
      ${e.cool ? cool(`<p>${e.cool}</p>`) : ""}
    </div>
  </details>`;
}

function sectionEras(): string {
  return `
    <div class="ltp-eras">${ERA_CARDS.map((e, i) => eraAccordion(e, i === 0)).join("")}</div>
    ${roundStrip()}`;
}

/**
 * The round, as four labelled stops.
 *
 * It lives on the first section because the reader needs the shape of a round
 * before any single phase means anything - "Jump Phase" is a name, not
 * information, until you know it is the second of four things that happen every
 * round.
 *
 * It sits BELOW the eras, not above them. It used to open the page, which put a
 * diagram of the turn sequence in front of somebody who did not yet know what
 * game they were choosing: the first question this page answers is which era
 * you are playing, and the round only becomes readable once that is settled.
 */
function roundStrip(): string {
  const stops: [string, string][] = [
    ["Command", "Take your CMD tokens and roll for Initiative."],
    ["Jump", "Open jump points and bring ships in from Reserve."],
    ["Tactical", "Take turns activating battlegroups: move, get shot at, act."],
    ["End", "Score, clear tokens, and start the next round."],
  ];
  return `<ol class="ltp-round">${stops
    .map(
      ([name, what], i) => `
      <li class="ltp-round-stop">
        <span class="ltp-round-n">${i + 1}</span>
        <span class="ltp-round-name">${escapeHtml(name)} Phase</span>
        <span class="ltp-round-what">${escapeHtml(what)}</span>
      </li>`,
    )
    .join("")}</ol>`;
}

// ---------------------------------------------------------------------------
// 2. Getting prepared
// ---------------------------------------------------------------------------

interface MiniSource {
  name: string;
  url: string;
}

/**
 * Where to get spaceships.
 *
 * The game is explicitly manufacturer-agnostic, so this list mixes the
 * publisher's own partners, other companies' game ranges, STL files and free
 * paper. Grouped, not ranked.
 *
 * Names and links only. There used to be a line of description under each
 * entry - what the range is, what scale, how many fleets - and the whole lot
 * was cut in August 2026 for reading like marketing copy. A name and a link is
 * the entire useful content of a row; anything past that is guesswork about
 * stock that goes stale the week after it is written.
 *
 * Every URL was checked in August 2026. Ranges go out of print and shops
 * close, so if one of these 404s, delete the row rather than guessing a
 * replacement URL. That audit removed ten rows: EC3D Design's MyMiniFactory
 * collection (hard 404), and nine that resolved but were not worth linking -
 * the generic marketplace searches (MyMiniFactory, Cults3D, Printables,
 * Thangs, Gambody), Game God Terrain, 3D Breed, the Zhodani counter generator
 * and the BoardGameGeek papercraft thread. Star Wars: Armada and Firestorm
 * Armada both stay, out of print or not, because people own them and they play
 * fine.
 */
const MINI_SOURCES: { group: string; items: MiniSource[] }[] = [
  {
    group: "From the publisher",
    items: [
      { name: "Planet Smasher Games: free downloads", url: "https://planetsmashergames.com/a-billion-suns/downloads/" },
      { name: "Planet Smasher: spaceship miniatures directory", url: "https://planetsmashergames.com/a-billion-suns-blog/spaceship-miniatures/" },
      { name: "What size spaceships?", url: "https://planetsmashergames.com/a-billion-suns-blog/what-size-spaceships/" },
    ],
  },
  {
    group: "Spaceship miniature ranges",
    items: [
      { name: "Brigade Models", url: "https://brigademodels.co.uk/product-category/spaceships/" },
      { name: "Ground Zero Games: Full Thrust", url: "https://shop.groundzerogames.co.uk/full-thrust-starships.html" },
      { name: "em4 Miniatures", url: "https://em4miniatures.com/collections/a-billion-suns" },
      { name: "Scourge Scenics", url: "https://www.scourgescenics.co.uk/shop/product-category/gothic-space-combat-miniatures-and-battlefleets" },
      { name: "Vanguard Miniatures: Battlegroup Helios", url: "https://vanguardminiatures.co.uk/product-category/battlegroup-helios/" },
      { name: "TTCombat: Dropfleet Commander", url: "https://ttcombat.com/collections/dropfleet-commander" },
      { name: "Kallistra: Space Dreadnought 3000", url: "https://www.kallistra.co.uk/index.php?page=22" },
      { name: "Studio Bergstrom", url: "https://studiobergstrom.com/" },
      { name: "Laserforge: Grand Fleet Admiral", url: "https://www.laserforgeminiatures.com/collections/grand-fleet-admiral" },
      { name: "Ravenstar Studios: Cold Navy", url: "https://www.ravenstarstudio.com/store/c4/Cold_Navy.html" },
      { name: "Dream Pod 9: Jovian Wars", url: "https://store.dp9.com/index.php?route=product/category&path=127" },
      { name: "Acheson Creations: Stars Reach", url: "https://achesoncreations.com/index.php/products/starsreach" },
      { name: "Amarillo Design Bureau: Starline 2400", url: "https://www.starfleetstore.com/starline-2400-miniatures-c-12/" },
      { name: "Little Metal Spaceships", url: "https://littlemetalspaceships.com/" },
      { name: "Krakon Games", url: "https://krakongames.com/product-category/affiliated-games/a-billion-suns/" },
      { name: "Star Wars: Armada (out of print, secondhand only)", url: "https://boardgamegeek.com/boardgame/181834/star-wars-armada" },
      { name: "Firestorm Armada (Warcradle, mid-rewrite)", url: "https://blog.warcradle.com/firestorm-armada-news" },
    ],
  },
  {
    group: "STLs and 3D printing",
    items: [
      { name: "Hardware Studios: Consortium Spacefleet", url: "https://hardwarestudios.co/product/consortium-spacefleet/" },
      { name: "Skull Forge Studios: Sanhalran Fleet", url: "https://skullforgestudios.gumroad.com/l/sanhalran" },
      { name: "Martian Models", url: "https://martianmodels.com/" },
      { name: "Brander Roullett on MyMiniFactory", url: "https://www.myminifactory.com/object/3d-print-a-billion-suns-the-kiriian-collective-fleet-of-spaceships-169957" },
    ],
  },
  {
    group: "Free, and free to print at home",
    items: [
      { name: "Thingiverse: the A Billion Suns tag", url: "https://www.thingiverse.com/tag:a_billion_suns" },
      { name: "Tinnut&rsquo;s free A Billion Suns fleets", url: "https://www.printables.com/model/442285-space-ship-fleet-for-a-billion-suns" },
      { name: "OnePageRules: Warfleets paper minis", url: "https://www.drivethrurpg.com/browse/pub/16079/onepagerules" },
    ],
  },
  {
    group: "Ask somebody",
    items: [
      { name: "Full Thrust miniatures list", url: "https://faq.fullthrust.net/miniatures" },
      { name: "A Billion Suns on BoardGameGeek", url: "https://boardgamegeek.com/boardgame/265304/a-billion-suns-interstellar-fleet-battles" },
      { name: "The Planet Smasher Discord", url: "https://planetsmashergames.com/discord/" },
    ],
  },
];

/*
 * Every source, behind one closed accordion.
 *
 * The list runs to thirty entries across five groups, which is the right
 * length for the question it answers and completely the wrong length to have
 * sitting open in the middle of "what you need to play". Somebody reading the
 * page wants one line about miniatures and to move on; somebody shopping wants
 * all thirty. One <details> serves both, and it is closed by default because
 * the reading case is the common one.
 */
function sourceList(): string {
  const groups = MINI_SOURCES.filter((g) => g.items.length);
  const total = groups.reduce((n, g) => n + g.items.length, 0);
  return `
  <details class="ltp-src-acc">
    <summary class="ltp-src-summary">
      ${icon("link", 15)}
      <span class="ltp-src-summary-l">Where to get spaceships</span>
      <span class="ltp-src-summary-n">${total} sources</span>
      ${icon("chevronDown", 18, "ltp-src-chev")}
    </summary>
    <div class="ltp-src-acc-body">
      ${groups
        .map(
          (g) => `
        <div class="ltp-src-group">
          <h4 class="ltp-h4">${g.group}</h4>
          <ul class="ltp-src-list">
            ${g.items
              .map(
                // name is an authored constant above and carries its own entities
                // (curly quotes, dashes); only the URL is escaped, which is also
                // what turns a query string's & into &amp;.
                (s) => `<li><a class="ltp-src" href="${escapeHtml(s.url)}" target="_blank" rel="noopener">
                  <span class="ltp-src-name">${icon("link", 13)} ${s.name}</span>
                </a></li>`,
              )
              .join("")}
          </ul>
        </div>`,
        )
        .join("")}
    </div>
  </details>`;
}

function sectionPrepare(): string {
  return `
    ${h(3, "What you will need to play")}
    ${quote(
      // p.12, verbatim. The rulebook's lead-in ("To play A Billion Suns, you
      // will need the following:") is dropped: the heading above it is our
      // wording of the same sentence, and printing both said it twice. See the
      // verbatim rule at the top of this file - it governs the rules, not a
      // run-in line that only existed to introduce a list in a book with no
      // heading over it.
      `${ul([
         "One or more flat surfaces to play on.",
         "Miniatures or counters to represent your spaceships.",
         "At least a dozen D6 dice.",
         "Two or three each of D8, D10, D12 and D20 dice.",
         "A selection of tokens, gaming gems or spare dice.",
         "A measuring tape in inches.",
       ])}`,
    )}

    ${h(3, "Miniatures")}
    ${quote(
      // p.12, verbatim.
      `${p("A Billion Suns is designed to be played with spaceship miniatures of any scale, from any manufacturer, mounted on any shape or size of base. During play, ship bases are ignored for the purposes of measuring.")}`,
    )}
    ${sourceList()}

    ${h(3, "Tokens")}
    ${quote(
      // p.12, verbatim.
      `<p>You will need a selection of scavenged tokens, gaming gems or spare dice to represent the following:</p>
       ${ul(["CMD tokens.", "Damage tokens.", "Jump points (you can also use small jump gate or navigation buoy miniatures for these).", "Activated tokens", "Easy Target tokens", "Assorted other tokens for the missions."])}
       ${p("Missions sometimes need a variety of different token types. Don&rsquo;t stress about having a matching token design for every variety of token. You can just use different coloured gems, dice or tokens scavenged from other games. As long as everyone knows which tokens represent what during a particular game, you&rsquo;ll be fine.")}`,
    )}

    ${h(3, "Other miniatures")}
    ${quote(
      // p.13, verbatim.
      `${p("As well as your fleets, the missions in this book require you to have a specific set of miniatures and terrain pieces in your collection. You can use miniatures for these, scratch-build them, or make flat tokens for them.")}
       ${ul([
         "1 Planetoid. A circular object between 4&rdquo;&ndash;8&rdquo; in diameter. (You may very occasionally need a second planetoid, although you can just re-roll the mission if you only have one planetoid.)",
         "3 Facilities, which can be space stations, asteroid bases, weapons platforms or floating space ports.",
         "5 Comsats, or other small nav-buoys, satellites or technological space junk.",
         "5 Container Ships, which I recommend are numbered with some form of markings.",
         "5 Asteroids, each a couple of inches across.",
         "5 Space Kraken, or similar interstellar beasts.",
       ])}
       ${p("You might also choose to make terrain or tokens for the following, but they are not required")}
       ${ul(["3 Gas Clouds", "3 Debris Fields"])}`,
    )}

    ${h(3, "The play area")}
    ${quote(
      // p.29, verbatim.
      `${p("You will need one or more flat surfaces to play A Billion Suns across. This game is designed to be played across multiple tables at once, or with your gaming table divided into sections. These separate tables, or sections, are referred to as Sectors.")}
       ${p("You always start with a single sector. Some missions may instruct you to add additional sectors.")}
       ${p("When setting up a game, your mission may instruct you to &ldquo;Add 1 Sector&rdquo; or &ldquo;Set up 2 Sectors&rdquo;. Simply agree on another flat playable surface to count as the new sector or divide your current play area in two with tape or string to create the additional sector.")}
       ${p("You don&rsquo;t have to divide your table up evenly, and sectors don&rsquo;t even have to be regular shapes. You could even use a nearby side table or counter-top as a sector. Sectors can be as small as 16&rdquo; by 16&rdquo; and still be playable. A Billion Suns is designed to be flexible to the size and shape of each play area &ndash; there is no &lsquo;standard&rsquo; size for any of the sectors. The game works perfectly on any size or shape of table.")}`,
    )}
    ${learnDiagram("deployment")}
`;
}

// ---------------------------------------------------------------------------
// 3. Initiative & Command
// ---------------------------------------------------------------------------

/** The six Core Commands, verbatim from p.50. */
const CORE_COMMANDS: [string, string][] = [
  ["All Hands (1 CMD)", "After a friendly unit takes its first action in the Action Step, spend 1 CMD token to take a second (different) action with it."],
  ["Executive Oversight (1 CMD)", "Re-roll one attack die, initiative die or saving throw."],
  ["Power to Engines (1 CMD)", "At the start of a friendly unit&rsquo;s movement step, spend 1 CMD token to move twice during this movement step (pivoting and moving ahead both times)."],
  [
    "Power to Weapons (1 CMD)",
    "Before rolling to attack with a friendly unit, spend 1 CMD token to subtract 1 from the result of each attack dice (to a minimum of 1), for the current Salvo. This increases the chance of critical hits but doesn&rsquo;t prevent duds.",
  ],
  [
    "Power to Shields (1 CMD)",
    "Before rolling Saving Throws with a friendly unit with a Shields value of 1 or more, spend 1 CMD token to add 1 to this unit&rsquo;s Shields value, for the current Salvo only.",
  ],
  [
    "Red Alert (1 CMD)",
    "When a friendly ship without an Activated token would be destroyed, spend 1 CMD token: it isn&rsquo;t destroyed, and regains 1HP instead. At the end of your next activation, if this ship is still in play, it is reduced to 0HP, and you cannot use Red Alert to save it.",
  ],
];

function sectionCommand(): string {
  return `
    ${learnDiagram("command")}

    ${h(3, "Gain CMD tokens")}
    ${quote(
      // p.30, verbatim.
      p("You gain a number of CMD tokens determined by your faction (if you are using the Training Fleet, you gain 7 CMD tokens). Unspent CMD tokens are discarded at the end of the round."),
    )}

    ${h(3, "Seize Initiative")}
    ${quote(
      // p.30, verbatim.
      `${p("All players make an Initiative Check. Roll a number of D6 equal to your faction&rsquo;s Initiative value. Each roll of a 2 or 3 counts as one success; each roll of a 1 counts as two successes. (This is equivalent to rolling to hit against a unit with Silhouette 3, if that helps you remember this mechanic.)")}
       ${p("The player that rolls the most successes wins the Initiative Check and chooses which player has the Initiative for this round. If two or more players are tied, the tied players sum their dice values: the player with the lowest sum wins the Initiative Check. If still tied, the tied player clockwise from the last player to have Initiative wins the Initiative Check.")}
       ${p("The player(s) that didn&rsquo;t win the Initiative Check receive 1 additional CMD token each.")}`,
    )}
    ${cool(`
      <p>Two things are quietly excellent here. Winning the Initiative Check lets you <em>choose</em> who has the Initiative, which is not always yourself &mdash; going first means committing first, and sometimes you would much rather watch. And losing pays: everyone who did not win gets an extra CMD token, so a bad roll hands you more to spend for the rest of the round.</p>`)}

    ${h(3, "What CMD tokens are")}
    ${quote(
      // p.49, verbatim.
      `${p("Commands are special effects that you can spend CMD tokens to invoke. The Core Commands are always available, and your faction rules, High-Value Personnel, or era of play may provide additional options.")}
       ${p("Each CMD token represents an amount of influence that the fleet commander, admiral or CEO can exert on their fleet. You start the game with zero CMD tokens. During each Command Phase, you receive fresh CMD tokens. Use gaming gems, beads or coins to represent them.")}
       ${p("To use a Command, spend the listed number of CMD tokens. Each Command says when it can be used, and how many CMD tokens are needed to use it. When a CMD token is spent, discard it.")}
       ${p("Unspent CMD tokens are discarded in the End Phase.")}`,
    )}

    ${h(3, "The Core Commands")}
    <p class="ltp-p">Six of them, always available to every fleet in every era. They are the whole reason a CMD token is interesting: one token can be a second action, a re-roll, a double move, sharper guns, stronger shields, or a ship that refuses to die.</p>
    <div class="ltp-cmds">
      ${CORE_COMMANDS.map(
        ([name, text]) => `
        <div class="ltp-cmd">
          <p class="ltp-cmd-name">${icon("cmd-delta", 15, "ltp-cmd-ico")} ${escapeHtml(name.replace(/ \(1 CMD\)$/, ""))} <span class="ltp-cmd-cost">1 CMD</span></p>
          <p class="ltp-cmd-text">${massGlyphs(text)}</p>
        </div>`,
      ).join("")}
    </div>
    ${p("There is a seventh, in Hypergrowth only: <b>Requisition</b>, which pulls a new unit out of your Shipyard. That one is in the Jump Phase, below.")}
    ${cool(`
      <p>Every one of these costs exactly one token. There is no ladder of expensive super-powers to save up for, so the whole decision is <em>when</em>, not <em>whether</em>. Tokens do not carry over to the next round either &mdash; anything you are still holding at the end of the round is thrown away. Hoarding is always a mistake, and the game keeps proving it to you.</p>`)}`;
}

// ---------------------------------------------------------------------------
// 4. The Jump Phase
// ---------------------------------------------------------------------------

function sectionJump(): string {
  return `
    <p class="ltp-lede">Nothing starts on the table. Your fleet arrives, round by round, wherever you decide to tear a hole in space.</p>
    ${learnDiagram("jump")}

    ${h(3, "Your fleet starts off-board")}
    ${quote(
      // p.30, verbatim.
      `${p("The units in your Fleet start the game in Reserve and must be jumped into the combat zone via jump point during the Jump Phase.")}
       ${p("In the Jump Phase, players take turns, clockwise from the player with Initiative. On your turn, you do one of the following:")}
       ${ul([
         "<b>Open a Jump Point:</b> Take a jump point from the supply and place it into play, anywhere you like.",
         "<b>Jump In:</b> Deploy a unit from Reserve.",
         "<b>Pass:</b> You take no further turns during this Jump Phase.",
       ])}
       ${p("Once all players have passed, the Jump Phase ends.")}`,
    )}
    ${cool(`
      <p>There is no deployment zone. There is no table edge you have to trudge in from. You put a token down and your ships appear around it, which means the shape of the battle is something you are still writing in round three. Holding half your fleet back is not cowardice, it is a plan.</p>`)}

    ${h(3, "Jump points")}
    ${quote(
      // p.32, verbatim.
      `${p("A Jump Point is represented on the tabletop by a token approximately 1&rdquo; in diameter. You could use a gaming gem, a coin or a token. All measurements to and from jump points are from its centrepoint, so the exact size isn&rsquo;t important.")}
       ${p("The number of Jump Points you start the game with is determined by the era of play, and sometimes by the mission.")}`,
    )}

    ${h(3, "Opening a jump point")}
    ${quote(
      // p.32, verbatim.
      `${p("During the Jump Phase, you can use your turn to open a new Jump Point, if you have any remaining in your supply. Take a Jump Point from your supply, and place it into play, anywhere outside of 9&rdquo; from a planetoid.")}
       ${p("<b>Gravity Well:</b> Jump Points cannot be placed within 9&rdquo; of a planetoid. Units cannot Jump into a position within 9&rdquo; of a planetoid. A unit cannot Jump Hop or Jump Out if a ship in that unit is within 9&rdquo; of a planetoid.")}`,
    )}

    ${h(3, "Jumping in")}
    ${quote(
      // p.33, verbatim.
      `${p("During the Jump Phase, you can use your turn to Jump In a single unit from your Reserves area.")}
       ${p("To Jump In a unit, deploy all ships from that unit within 6&rdquo; of a friendly Jump Point.")}`,
    )}
    ${p("Then check cohesion: after a unit jumps in, and at the end of its movement step, all the ships in the unit must be within 6&rdquo; of all other ships in that unit.")}

    ${h(3, "Jump strain")}
    ${quote(
      // p.32, verbatim.
      p("Due to gravitational strains, the complexities of &micro;-space calculations, and the time required to recharge the &micro;-fold drives: each unit can only &lsquo;jump&rsquo; once per round. This means that, for example, a unit that Jumped In this round cannot Jump Hop or Jump Out later in the same round."),
    )}

    ${h(3, "Leaving by jump")}
    ${quote(
      // p.33, verbatim.
      `${p("<b>Jump Hop.</b> A unit can use the Jump Hop action during their activation to teleport between two sectors. If all the ships in this unit are within 6&rdquo; of a friendly Jump Point, take the Jump Hop action to remove all the ships in this unit from play and set them up within 6&rdquo; of a friendly Jump Point in another Sector.")}
       ${p("Jump Hop is exclusively for Jumping between sectors. In a game with only a single Sector (such as Combat Training), the Jump Hop action is of no use.")}
       ${p("<b>Jump Out.</b> A unit can use the Jump Out action during their activation to leave play and go into your Reserves area. When a unit Jumps Out into reserve, it keeps all its tokens, both game tokens and asset tokens. At the end of the game, asset tokens carried by ships in your reserves area will count towards revenue and victory conditions: they are safely returned to base.")}`,
    )}
    ${cool(`
      <p>Jumping out with the loot still in the hold and calling that a win is entirely legal, and in Hypergrowth it is often the correct play. A ship that runs away carrying the objective has done its job better than a ship that died gloriously next to it.</p>`)}

    ${h(3, "In Hypergrowth, you start in the Shipyard")}
    <p class="ltp-p">The other two eras hand you a finished fleet list and let you jump it in. Hypergrowth does not: you buy a Shipyard full of hulls, and pulling any of them out costs both a CMD token and hard credits, in the middle of the game, while you are trying to score.</p>
    ${quote(
      // p.122, verbatim.
      `${p("Print out a Fleet Roster sheet and fill it up with ships totalling no more than &cent;300bn. You are buying ships; you don&rsquo;t have to organise them into units until you requisition them during the game. Ideally, you have miniatures ready for all the ships in your Shipyard.")}
       ${p("In the Jump Phase, you use the Requisition command to move ships from your shipyard to the play area, via your Reserves area.")}
       ${p("When it is your turn to Jump In a unit, if you have nothing in your reserves, use the Requisition command to form a unit from ships in your Shipyard, and then move it to your Reserves. From there, you Jump the unit into play.")}
       ${p("When you requisition a unit, you can additionally requisition Squadron units, without spending additional CMD tokens, if they can all be carried by the first unit.")}
       ${p("Once you have requisitioned a particular ship, strike it off your Shipyard Roster &ndash; you cannot requisition it again.")}`,
    )}
    ${quote(
      // p.50, verbatim.
      p("<b>Requisition (1 CMD).</b> (Hypergrowth Game Mode only) When it is your turn to Jump In a unit, you can spend 1 CMD token to form a new unit using the ships in your Shipyard. Pay their cost in credits. Gather the appropriate miniatures and jump them into play as if they were in your Reserves area."),
    )}
    ${quote(
      // p.121-122, verbatim.
      `${p("In Hypergrowth games, deploying ships costs you the very victory points you are seeking to capture and defend, represented by Credits (&cent;).")}
       ${p("In the first round of a game of Hypergrowth, you will move your Credit Tracker into deficit, because an upfront investment of Credits is needed to requisition the ships required to earn revenue from the missions.")}`,
    )}
    ${cool(`
      <p>This is the puzzle the whole era is built on. The ships are the cost <em>and</em> the score is measured in the same currency, so every hull you requisition is a point you have spent to try and win two. You open every game of Hypergrowth in the red on purpose, and you spend the next four rounds arguing your way out of it.</p>`)}`;
}

// ---------------------------------------------------------------------------
// 5. The Tactical Phase
// ---------------------------------------------------------------------------

function sectionTactical(): string {
  return `
    <p class="ltp-lede">The big one. Players take turns grabbing a handful of ships and using them, back and forth, until nothing is left unactivated.</p>

    ${quote(
      // p.31, verbatim.
      `${p("In the Tactical Phase, players take turns to activate battlegroups, clockwise from the player with Initiative.")}
       ${p("On your turn, you Drag to Select a battlegroup and activate the units in that battlegroup.")}`,
    )}
    ${cool(`
      <p>This is the alternating activation engine, and it is why the game stays tense for all four rounds. You do not get to move your fleet; you get to move <em>some</em> of it, and then you have to hand the table over and watch what that decision cost you. Everything you have not activated yet is still a threat, and so is everything they have not activated yet.</p>`)}

    ${h(3, "Drag to Select")}
    ${quote(
      // p.34, verbatim.
      `<p>When you Drag To Select a battlegroup:</p>
       ${ol([
         "Select a friendly unactivated unit to be the lead unit.",
         "Select any number of other friendly unactivated units at least partially within 6&rdquo; of the lead unit. The combined mass of selected units must be 10 or less.",
         "Activate the units in that battlegroup.",
       ])}
       ${p("After a unit activates, give it an &lsquo;Activated&rsquo; token. Once you have finished activating all the units in that battlegroup, the battlegroup is deselected, and you pass play to the next player clockwise.")}`,
    )}
    ${learnDiagram("drag-select")}

    ${h(4, "So what is Mass?")}
    ${quote(
      // p.20 and p.26, verbatim.
      `${p("Mass is a broad measure of the size and bulk of a ship. Throughout the rules, when you see the icon ⓜ, replace it with the numerical value of the Mass of the unit&rsquo;s ship class. If a rule refers to the Combined Mass of ships, sum the ⓜ of all the related individual ships to form a total.")}
       ${p("Occasionally, when encountering the ⓜ icon, it may be unclear which ship&rsquo;s mass to apply. As a general rule, use the mass of the ship that is actively doing the thing, rather than the ship having the thing done to them.")}`,
    )}
    ${p("Mass is the budget on that 10-point drag: a Mass 3 battleship and a couple of escorts fill it, or seven Mass 0 squadrons do. It also sets how big a unit can be &mdash; units cap at 3 ships, except Mass 3 units, which are always a single ship.")}
    ${cool(`
      <p>Mass is doing four jobs at once, which is why it is worth learning first. It is your battlegroup budget, your unit size limit, the radius of the protective bubble a big ship throws over its little friends, and the size of the fireball when it dies. One number, and it tells you almost everything about how a ship behaves.</p>`)}

    ${h(3, "An activation, step by step")}
    ${quote(
      // p.35, verbatim.
      `<p>When you activate a battlegroup, you activate all the units in that battlegroup, completing each step with all units before starting the next step:</p>
       ${ol([
         "<b>Movement Step:</b> Move all the units in the battlegroup, one unit at a time, in any order.",
         "<b>Passive Attacks Step:</b> The battlegroup suffers passive attacks.",
         "<b>Action Step:</b> Choose one action for each unit in the battlegroup. (You can choose different actions for different units.) Each ship in the unit takes that action. Resolve all the actions from one unit before starting the next unit.",
       ])}
       ${p("After activating a unit, give it an Activated token.")}`,
    )}

    ${h(4, "1 &middot; Movement Step")}
    ${quote(
      // p.36, verbatim.
      `${p("When you move a unit, move each of the ships once, one at a time and in any order.")}
       ${p("When you move a ship, first pivot it by any amount, and then move it straight ahead up to its Thrust value in inches. When measuring movement, remember to measure from the ship&rsquo;s Position (its flight peg).")}
       ${p("<b>Pivot.</b> To pivot a ship: rotate the ship about its centrepoint by any amount, without changing its position.")}
       ${p("<b>Inertial Strain.</b> If a ship pivots more than 90 degrees in a single pivot, it cannot attack with its primary weapon systems during this activation.")}
       ${p("<b>Unit Cohesion.</b> After a unit jumps in, and at the end of its movement step, all the ships in the unit must be within 6&rdquo; of all other ships in that unit.")}`,
    )}
    ${learnDiagram("movement")}
    ${quote(
      // p.37, verbatim.
      `${p("<b>Easy Target.</b> At the end of a ship&rsquo;s Movement Step, if it moved less than 3&rdquo; in total, and didn&rsquo;t Jump In this round, give the unit an &lsquo;Easy Target&rsquo; token. While a unit has an Easy Target token, enemy units targeting this unit may re-roll their attack dice once.")}
       ${p("At the start of a unit&rsquo;s activation, discard any Easy Target tokens on it. If a unit Jump Hops or Jumps Out, discard any Easy Target tokens on it.")}
       ${p("<b>Table Edges.</b> If a ship moves into contact with the edge of a Sector, it immediately stops moving.")}
       ${p("<b>Overlapping Bases.</b> When moving, ships ignore other ships. Ships can end their movement in a position that results in the bases of two models overlapping, as long as the miniatures are stable in their final placement. No two ships can share the same position.")}`,
    )}
    ${p("Spend 1 CMD on <b>Power to Engines</b> and the whole step happens twice &mdash; pivot and move, then pivot and move again. It is the only way a ship covers more than its Thrust in one activation.")}
    ${learnDiagram("double-move")}
    ${cool(`
      <p>Sitting still is punished. Move less than three inches and you hand every enemy in range a free re-roll on everything they shoot at you with. There is no hunkering down in this game &mdash; a stationary ship is not a fortress, it is a target that has stopped trying.</p>`)}

    ${h(4, "2 &middot; Passive Attacks Step")}
    ${quote(
      // p.38, verbatim.
      `${p("After moving the units in the battlegroup, there is a Passive Attacks step. Every passive enemy unit that has one or more active units in range and arc of fire of their auxiliary weapons may attack once with their auxiliary weapons, targeting only active units.")}
       ${p("A unit can only make passive attacks once during this battlegroup&rsquo;s activation. It can make further passive attacks in later activations.")}
       ${p("If you have three or more players, the passive players make attacks in turns in a clockwise direction, beginning with the player to the left of the active player.")}`,
    )}
    ${learnDiagram("passive")}
    ${cool(`
      <p>You shoot on your opponent&rsquo;s turn. Every time somebody drives a battlegroup past your guns, your guns answer, without you spending an activation on it. It means there is no dead time while the other player thinks, and it means the space in front of your fleet is genuinely dangerous to cross.</p>`)}

    ${h(4, "3 &middot; Action Step")}
    ${quote(
      // p.38, verbatim.
      `${p("After moving and potentially suffering passive attacks, each unit in the battlegroup takes one Action.")}
       ${p("All the ships in a unit take the same action, but different units in the battlegroup can choose different actions. The basic actions are listed below, but factions, ships or scenario rules can provide additional options.")}`,
    )}
    ${learnDiagram("action")}
    ${p("Spend 1 CMD on <b>All Hands</b> after a unit&rsquo;s first action and it takes a second, different one.")}

    ${h(3, "Shooting")}
    <p class="ltp-p">Open Fire is the action you will take most often and the one with the most rules attached, so it goes first. The short version: pick targets, group your dice into salvos, roll to hit under the target&rsquo;s Silhouette, they roll to save under their Shields, and whatever is left does damage.</p>

    ${h(4, "Silhouette and Shields")}
    ${quote(
      // p.27, verbatim.
      `${p("<b>Silhouette</b> represents both the physical size of the ship as well as the brightness of its energy signature. The larger and &lsquo;louder&rsquo; the ship, the easier it is for enemy vessels to track, target and hit it, but the more punishment it can withstand.")}
       ${p("A ship&rsquo;s Silhouette value is the highest roll on any attack die that will be considered a hit. Each ship enters play with Hull Points (HP) equal to its Silhouette. A ship&rsquo;s HP value is the number of damage tokens required to remove the ship from play.")}
       ${p("<b>Shields.</b> Most larger ships are equipped with kinetic field generators, used to absorb and disperse the energy of incoming attacks. A ship&rsquo;s Shields value indicates the strength and sophistication of the defensive shields it possesses.")}
       ${p("A ship&rsquo;s Shields value determines the highest die roll that counts as a successful saving throw when defending against attacks.")}
       ${p("<b>Thrust</b> is the maximum number of inches this ship can travel in a single move.")}`,
    )}
    ${cool(`
      <p>Silhouette is one of the neatest stats in wargaming. It is how easy you are to hit <em>and</em> how much damage you can soak, in a single number, because both come from being enormous. A battleship is not hard to shoot &mdash; it is trivially easy to shoot, and simply does not care. Meanwhile a fighter wing is nearly impossible to hit and evaporates the moment you do.</p>`)}

    ${h(4, "Weapon systems, range and arc")}
    ${quote(
      // p.41-42, verbatim.
      `${p("Ships have weapon systems, which are either Primary or Auxiliary. Each weapon system has a minimum and maximum range, an amount and type of attack dice, and an amount of damage caused by successful hits.")}
       ${p("<b>Range.</b> Weapon systems have a minimum and maximum range. To be considered in range of the attacking ship, the target must be no closer than the minimum range of the weapon system, and no further away than the maximum range of the weapon system.")}
       ${p("<b>Attack Dice.</b> A weapon system&rsquo;s Attack Dice value indicates the number and type of dice rolled when attacking with that weapon. For example, an Attack Dice value of &lsquo;4D8&rsquo; means that you roll four eight-sided dice to attack, checking each die individually to see if it scores a hit on the target.")}
       ${p("<b>Damage.</b> A weapon system&rsquo;s Damage value is the number of damage tokens the target receives for each unsaved hit. The Damage value always relates to the Attack Die type.")}
       ${p("<b>Arc of Fire.</b> To attack something, it must lie within that weapon system&rsquo;s arc of fire. Primary Arc of Fire is a 45-degree arc to the front of a ship. Auxiliary Arc of Fire is a 180-degree arc to the front of a ship.")}
       ${p("<b>Line of Sight.</b> To attack something, the target must lie within that ship&rsquo;s line of sight. To check if a ship has line of sight to a target unit or object, draw a straight line between their two positions: if it crosses obscuring terrain, line of sight is blocked; otherwise they have line of sight to each other.")}`,
    )}
    ${damageTable()}

    ${h(4, "Select targets")}
    ${quote(
      // p.43-44, verbatim.
      `${p("When a unit attacks, each ship in the unit chooses its targets separately, then you resolve all the unit&rsquo;s attacks, one target at a time. The attack dice from a single weapon system targeting a given unit are called a Salvo.")}
       ${p("Each ship may declare one enemy unit as a Primary Target and any number of enemy units as Auxiliary Targets.")}
       ${p("For a unit to be selected as a target, at least one ship from the target unit must lie within range, line of sight and arc of fire of the attacking ship. You can only target neutral or enemy ships.")}
       ${p("<b>Primary Target.</b> When a ship attacks with a primary weapon system, you select a single Primary Target. You attack this primary target with all of your primary attack dice.")}
       ${p("<b>Auxiliary Targets.</b> When a ship attacks with an auxiliary weapon system, you can select any number of Auxiliary Targets. You can divide your auxiliary attack dice as you wish between these Auxiliary Targets, but must declare which dice will attack which target before rolling any attacks.")}`,
    )}

    ${h(4, "Resolve attacks")}
    ${quote(
      // p.44, verbatim.
      `${p("A unit&rsquo;s attacks are grouped into Salvos. A Salvo is all the attack dice of the same type that are attacking the same target. E.g. &ldquo;all the D6 attack dice targeting that unit of Corvettes over there.&rdquo;")}
       ${p("After declaring all your targets, you resolve your Salvos, one at a time. You must fully resolve the current Salvo before moving on to the next Salvo.")}
       <p>To resolve a Salvo, follow this sequence:</p>
       ${ol(["Roll attack dice", "Roll saving throws", "Assign hits", "Apply damage"])}
       ${p("When attacking, all ships in the attacking unit must declare all targets before rolling any attack dice. Commands such as Power to Weapons and Power to Shields apply only to the dice in a given Salvo.")}`,
    )}

    ${h(4, "Roll attack dice")}
    ${quote(
      // p.45, verbatim.
      `${ol([
        "<b>Gather attack dice:</b> The attacking player gathers the attack dice for this Salvo (all the attack dice of the same type assigned to this target).",
        "<b>Roll To Hit:</b> The attacking player rolls the gathered attack dice. Attack dice that roll equal to or under the target&rsquo;s Silhouette value are Hits. An attack dice that rolls a 1 is a Critical Hit.",
        "<b>Discard Misses:</b> Discard attack dice that are misses. (I.e. Attack dice that rolled over the target&rsquo;s Silhouette value, and duds.)",
      ])}
       ${p("<b>Critical Hits.</b> Any attack dice that results in a (natural or modified) 1 is a Critical Hit and adds a bonus hit from the same weapon system. This affects the number of saving throws that must be made, so add another dice of the same type to the pool of hits.")}
       ${p("If Power to Weapons was used, dice rolls of both 1 and 2 cause critical hits. Duds are still duds.")}
       ${p("<b>Duds.</b> You discard attack dice that rolled a dud (which is a die that rolled the maximum value possible on that die type), even if that die would otherwise have scored a hit.")}`,
    )}
    ${cool(`
      <p>Low is good, and the highest face on any die is always a total failure. Roll a 6 on a D6 and it is a &lsquo;dud&rsquo; &mdash; discarded, no matter what it would otherwise have hit. So every single die you throw has a natural triumph and a natural disaster on opposite faces, and the fleets that are easiest to hit are the ones you are most likely to embarrass yourself against.</p>`)}

    ${h(4, "Roll saving throws")}
    ${quote(
      // p.46, verbatim.
      `${p("Pick up the successful attack dice and add additional dice to the pool for any bonus hits generated by critical hits. These dice are then re-rolled by the target&rsquo;s controller as Saving Throws.")}
       ${ol([
         "Total up the number of hits.",
         "The target&rsquo;s controller makes one saving throw for each hit. Each saving throw must use the same type of dice as the weapon system that caused the hit (making it harder to deflect more powerful weapons).",
         "Any saving throw that rolls equal to or under the target&rsquo;s Shields value deflects one hit. Duds do not deflect hits.",
       ])}`,
    )}

    ${h(4, "Assign hits and apply damage")}
    ${quote(
      // p.46, verbatim.
      `${p("After rolling Saving Throws, the defender assigns the undeflected hits to ships in the target unit, one hit at a time. When a ship is assigned a hit, reduce that ship&rsquo;s HP by the damage value of that weapon, to a minimum of 0HP.")}
       <p>When assigning each hit:</p>
       ${ul([
         "If there is a damaged ship in the unit, assign the hit to that ship.",
         "Otherwise, the defender assigns the hit to a ship in the unit (even one that is out of range of the attack).",
         "You cannot assign hits to ships that have 0HP remaining.",
         "If all the ships in the unit have already been reduced to 0HP, discard the hit.",
       ])}`,
    )}

    ${h(4, "Destroyed ships and explosions")}
    ${quote(
      // p.47, verbatim.
      `${p("After assigning all hits from the current Salvo, any ship that has 0HP is Destroyed.")}
       <p>When a ship is destroyed:</p>
       ${ol([
         "Roll a D6. If you roll equal to or under the ship&rsquo;s ⓜ, it explodes; Explosion Checks are needed for each other unit (friend or foe) within 3&rdquo; to see if they suffer damage.",
         "Drop each carried asset token within 1&rdquo;.",
         "Remove the ship from play.",
       ])}
       ${p("<b>Explosion.</b> When a ship explodes, each other unit (friend or foe) within 3&rdquo; suffers a ⓜD6 attack, causing 1 damage per hit.")}`,
    )}

    ${h(4, "Mother&rsquo;s Wing")}
    ${quote(
      // p.48, verbatim.
      `${p("Large ships can offer protection to their smaller fleet-mates in the form of heavy shielding, point defence coverage, and pure physical bulk. Ships benefitting from such protection are referred to as being &lsquo;Under Mother&rsquo;s Wing&rsquo;.")}
       ${p("Every ship has a Mother&rsquo;s Wing Zone of radius 2ⓜ&rdquo; which can protect friendly units of a lower mass. If every ship in a friendly unit is within the Mother&rsquo;s Wing Zone of a friendly unit of a higher mass, the lower mass unit can use the Shields value of the higher mass unit in place of its own (and may further boost this with Power to Shields).")}
       ${p("<b>Protecting Objectives.</b> When an objective (such as a neutral ship or a facility) is attacked by a player, another player may use the Mother&rsquo;s Wing effect from one of their nearby units to protect that objective (if that objective has a lighter mass).")}`,
    )}
    ${cool(`
      <p>Fighters have no shields worth the name, so they hide under a battleship and borrow its. The picture of a swarm of tiny craft flying in the lee of a capital ship, alive purely because it is there, is the sort of thing rules almost never manage to say out loud. This one says it in two sentences.</p>`)}

    ${h(3, "The other actions")}
    ${quote(
      // p.38-39, verbatim.
      `${ul([
        "<b>Open Fire (action):</b> Attack with all this ship&rsquo;s weapon systems.",
        "<b>Scan (action):</b> Scan a single object or ship within 3&rdquo; or collect any/all Free-floating asset tokens within 3&rdquo;.",
        "<b>Scramble Squadrons (action):</b> Select one Mass 0 unit carried by the unit and deploy it wholly within 6&rdquo;. The scrambled unit takes one action and then receives an Activated token.",
        "<b>Jump Hop (action):</b> If all the ships in this unit are within 6&rdquo; of a friendly Jump Point, remove all the ships in this unit from play and set them up within 6&rdquo; of a friendly Jump Point in another Sector.",
        "<b>Jump Out (action):</b> If all the ships in this unit are within 6&rdquo; of a friendly Jump Point, remove all the ships in this unit from play and place them into your Reserves area.",
      ])}
       ${p("<b>Scan.</b> Scanning requires no arc of fire; it can target any object or ship within range in any direction. Scan has no built-in effect but might be required to fulfil a contract or some other special rule. When scanning, you must declare a single purpose for that scan.")}`,
    )}

    ${h(3, "Carrying fighters")}
    <p class="ltp-p">Worth knowing now, because it is where Scramble Squadrons comes from, and because it changes what a big ship is for.</p>
    ${quote(
      // p.28, verbatim.
      `${p("Ships of Mass 0 represent small groups of tiny attack craft or starfighters rather than a single starship. Mass 0 ships are also referred to as Squadrons, and can be carried into battle in the bellies of larger ships.")}
       ${p("A unit can carry a number of Squadrons up to twice its Combined Mass. (E.g. a unit of one Mass 2 ship can carry up to 4 Squadrons, a single Mass 3 ship can carry up to 6 Squadrons, and a unit of three Mass 2 ships can carry up to 12.) Those carried Squadrons can be arranged into any number of units.")}
       ${p("For reasons of abstraction and simplicity, Squadrons are carried by &rsquo;the unit&lsquo;, not by an individual ship, and are always considered to be carried by the last surviving ship in the unit. You don&rsquo;t have to destroy the carried Squadrons until the last ship in the carrying unit is destroyed.")}
       ${p("A unit that is carrying Squadrons can take the Scramble Squadrons action to deploy a unit of Squadrons.")}`,
    )}
    ${cool(`
      <p>Any ship can be a carrier. There is no carrier ship class to buy &mdash; every hull with Mass to spare has room for fighters, so a cruiser can turn up carrying four squadrons and unfold into a small air force the moment it gets where it is going.</p>`)}`;
}

/** The attack die to damage table, p.42. Four rows, so it reads as a figure. */
function damageTable(): string {
  const rows: [string, string][] = [
    ["D6", "1"],
    ["D8", "2"],
    ["D10", "3"],
    ["D12", "5"],
  ];
  return `
    <figure class="ltp-fig">
      <table class="ltp-table">
        <caption>Attack die damage values</caption>
        <thead><tr><th scope="col">Attack die</th><th scope="col">Damage</th></tr></thead>
        <tbody>${rows.map(([d, dmg]) => `<tr><td><b>${d}</b></td><td>${dmg}</td></tr>`).join("")}</tbody>
      </table>
      <figcaption>Each shape of attack dice always causes the same amount of damage. If you remember this, it will make calculating damage easier during play. <span class="ltp-fig-cite">&mdash; p.42</span></figcaption>
    </figure>`;
}

// ---------------------------------------------------------------------------
// 6. End Phase & scoring
// ---------------------------------------------------------------------------

function sectionEnd(): string {
  return `
    <p class="ltp-lede">Tidy up, count up, go again. The shortest phase in the game, and the one that decides who is winning.</p>

    ${h(3, "The End Phase")}
    ${quote(
      // p.31, verbatim.
      `<p>In the End Phase:</p>
       ${ol([
         "Check the scoring conditions on contracts or missions.",
         "Clear all &rsquo;Activated&lsquo; tokens.",
         "Resolve any other &rsquo;End Phase&lsquo; game effects.",
         "Discard all unused CMD tokens.",
         "Begin a new Round.",
       ])}`,
    )}
    ${cool(`
      <p>Scoring is checked <em>every</em> round, not at the end of the game. Holding an objective for one round in the middle of a four-round game is worth something real, so there is no last-turn rush where everything that happened before it stops mattering. And every unspent CMD token you were saving is binned in step four, which is the game reminding you, once a round, that caution has a price.</p>`)}

    ${h(3, "How you win depends on the era")}
    <p class="ltp-p">The four phases above are the same everywhere. Victory is not:</p>
    ${ul([
      "<b>Armageddon</b> &mdash; free-for-all space battles with straightforward objectives. Victory comes through winning the battle, first and foremost.",
      "<b>Age of Unity</b> &mdash; two players, usually two tables, and victory split evenly between mission objectives and beating the other fleet.",
      "<b>Hypergrowth</b> &mdash; Credits. Your score and your spending are the same number, and the game lasts 4 Rounds. Requisitioning a fleet puts you in deficit; the missions are how you climb back out and into profit.",
    ])}

    ${h(3, "Your first game")}
    <p class="ltp-p">You now know a full round of A Billion Suns. The rulebook&rsquo;s own advice on where to go from here:</p>
    ${quote(
      // p.11 and p.60, verbatim.
      `${p("To get started with A Billion Suns, read the Core Rules section, gather some miniatures to represent the Training Fleets then play the two Basic Training missions: Combat Simulator and Management Training.")}
       ${p("I recommend you play the Combat Simulator scenario first, to learn the basics of moving and shooting, then play the Management Training scenario next, to learn how to manage jumping in and reinforcing your fleet.")}`,
    )}
    ${p("Combat Simulator operates in basically the same way as Armageddon, and Management Training operates very similarly to Hypergrowth &mdash; so playing the two tutorials is also how you try both halves of the game before choosing an era.")}
    <div class="ltp-launch">
      <button class="ltp-btn ltp-btn-go" data-action="learn-launch">${icon("flag", 17)} Set up the Combat Simulator</button>
      <p class="ltp-launch-note">Builds the Training Fleet for you and drops you straight into Play Mode, with the phase tracker running.</p>
    </div>

    ${h(3, "Get the rulebook")}
    <p class="ltp-p">This page is a walkthrough of the core rules. The book is the missions, the campaigns, the factions and their ships, the High-Value Personnel, the solo rules, and the actual first scenario in full.</p>
    <div class="ltp-cta">
      <a class="ltp-btn ltp-btn-buy" href="https://planetsmashergames.com/a-billion-suns/" target="_blank" rel="noopener">${icon("book", 18)} Buy A Billion Suns 2E</a>
      <a class="ltp-btn ltp-btn-alt" href="./ABS-2E-Quick-Reference.pdf" target="_blank" rel="noopener">${icon("scroll", 17)} Quick Reference (PDF)</a>
      <a class="ltp-btn ltp-btn-alt" href="#/fleets">${icon("fleets", 17)} Build a fleet</a>
    </div>
    <p class="ltp-p ltp-p-note">A Billion Suns is by Mike Hutchinson, published by Osprey Games. This app is an unofficial companion.</p>`;
}

// ---------------------------------------------------------------------------
// The page
// ---------------------------------------------------------------------------

const SECTIONS: Record<string, () => string> = {
  eras: sectionEras,
  prepare: sectionPrepare,
  command: sectionCommand,
  jump: sectionJump,
  tactical: sectionTactical,
  end: sectionEnd,
};

/**
 * The tab strip. Rendered twice, identically, and placed by CSS: once inside
 * the sticky header for pointer-sized screens, once in a bar fixed to the
 * bottom of the viewport for phones. Two copies rather than one moved node,
 * because moving it would mean the header's height changes between breakpoints
 * in JS, and the sticky offset is measured from CSS.
 */
function tabStrip(active: string, place: "top" | "bottom"): string {
  return `
  <nav class="ltp-tabs ltp-tabs--${place}" aria-label="Learn to Play sections">
    ${LEARN_TABS.map(
      (t, i) => `
      <a class="ltp-tab ${t.id === active ? "on" : ""}" href="#/learn/${t.id}" data-ltp-tab="${t.id}"
         ${t.id === active ? 'aria-current="true"' : ""}>
        ${icon(t.ico, 17, "ltp-tab-ico")}
        <span class="ltp-tab-l">${escapeHtml(t.short)}</span>
        <span class="ltp-tab-n">${i + 1}</span>
      </a>`,
    ).join("")}
  </nav>`;
}

/**
 * What the game is, in three lines, above everything else on the first page.
 *
 * This is the back-of-the-box pitch and it goes first because the page opened
 * on "Pick an era" - asking a reader to choose between three versions of a game
 * nobody had yet told them about. Only on the first tab: the other five are
 * arrived at by somebody already reading, and repeating the pitch on each would
 * be furniture.
 */
const GAME_PITCH = `
  <p class="ltp-pitch">A Billion Suns is a tabletop science-fiction miniatures wargame of interstellar
  combat for 2&ndash;4 players. You command a fleet of mighty battleships, sleek destroyers and agile
  fighters, and battle for supremacy of the stars.</p>`;

export function learnView(state: AppState): string {
  const routeTab = state.route.view === "learn" ? state.route.tab : undefined;
  const tab = LEARN_TABS.find((t) => t.id === routeTab) ?? LEARN_TABS[0]!;

  // The previous and next pages, so the reader can walk the six in order
  // without going back up to the tabs. Absent at each end rather than disabled:
  // a control that cannot do anything is worse than no control.
  const at = LEARN_TABS.indexOf(tab);
  const prev = LEARN_TABS[at - 1];
  const next = LEARN_TABS[at + 1];

  return `
  <main class="ltp" data-ltp-active="${escapeHtml(tab.id)}">
    <header class="ltp-head">
      <div class="ltp-head-in">
        <div class="ltp-head-id">
          <p class="ltp-head-title">Learn to Play</p>
        </div>
      </div>
      ${tabStrip(tab.id, "top")}
    </header>
    <div class="ltp-body">
      <section class="ltp-sec" id="ltp-${tab.id}" aria-labelledby="ltp-h-${tab.id}">
        ${at === 0 ? GAME_PITCH : ""}
        <header class="ltp-sec-head">
          <h2 class="ltp-sec-title" id="ltp-h-${tab.id}">${escapeHtml(tab.label)}</h2>
        </header>
        ${SECTIONS[tab.id]!()}
      </section>
      <nav class="ltp-pager" aria-label="Learn to Play pages">
        ${
          prev
            ? `<a class="ltp-pager-btn ltp-pager-prev" href="#/learn/${prev.id}">
                 ${icon("chevronLeft", 16)}
                 <span class="ltp-pager-txt"><span class="ltp-pager-dir">Previous</span><span class="ltp-pager-name">${escapeHtml(prev.label)}</span></span>
               </a>`
            : `<span class="ltp-pager-gap"></span>`
        }
        ${
          next
            ? `<a class="ltp-pager-btn ltp-pager-next" href="#/learn/${next.id}">
                 <span class="ltp-pager-txt"><span class="ltp-pager-dir">Next</span><span class="ltp-pager-name">${escapeHtml(next.label)}</span></span>
                 ${icon("chevronRight", 16)}
               </a>`
            : `<span class="ltp-pager-gap"></span>`
        }
      </nav>
    </div>
    ${tabStrip(tab.id, "bottom")}
  </main>`;
}
