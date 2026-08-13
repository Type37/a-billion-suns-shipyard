// Learn to Play, and the rules walkthrough.
//
// Two separate places sharing this file and its layout:
//
//   #/learn   Pick an era, Getting prepared.   What the game is, what you need.
//   #/rules   Command, Jump, Tactical, End.    One page per phase of a round.
//
// They were one six-tab route and that was wrong. The first two pages are read
// once, by somebody deciding whether to play; the last four are opened mid-game
// to settle an argument. Different jobs, different audiences at different
// moments, and a link somebody shares should say which of the two it is.
//
// Where the tab bar sits is decided by viewport, not by taste. On a phone the
// reliable one-thumb zone is the bottom third of the screen, and it shrinks as
// screens grow, so the tabs are fixed to the bottom. On a desktop there is no
// thumb, pointer travel is uniform, and a long reading page conventionally
// carries its chapter nav above the text, so they sit in the header. Same
// markup either way, moved by media query.
//
// EVERYTHING ON THESE PAGES IS SOMEBODY ELSE'S WORDS.
//
// Two sources, and no third:
//
//   1. The rulebook ("ABS 2E Layouts 7.pdf"), transcribed verbatim, with its
//      page number in the comment above each call. This includes the "why this
//      is cool" passages - those are the book's own designer notes, sidebars
//      and fiction, NOT our summary of why a rule is clever. There is no page
//      citation printed on screen; the reader knows what they are reading.
//
//   2. The era pitches on the first page, and the note under them saying what
//      this guide is and is not, which are the author's own finished copy for
//      this app, supplied as-is - capitals and all.
//
// Do not add explanatory prose. Every line of "this is the interesting bit"
// and "the short version is" got written into this file once and cut again,
// and rightly: it padded the page with a paraphrase sitting next to the real
// rule it was paraphrasing, and it restated things the diagram directly above
// it was already showing. If a rule needs an introduction, the book wrote one.

// massGlyphs, not ruleText: every string of prose on this page is an HTML
// literal in this file, with its own <b> tags and typographic entities, and
// ruleText would escape both. See massGlyphs' own note on when each applies.
import { escapeHtml, massGlyphs } from "./format.ts";
import { icon } from "./icons.ts";
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

/**
 * Where the book is sold. Named because it is now cited twice - once in the
 * scope note at the top of the first page, once on the CTA at the end of the
 * last - and a dead link in one of the two places would be worse than a dead
 * link in both.
 */
const BUY_URL = "https://planetsmashergames.com/a-billion-suns/";

/** Ids are URL surface: see LEARN_TAB_IDS / RULES_TAB_IDS in state.ts. */
export const LEARN_TABS: LearnTab[] = [
  { id: "eras", label: "Pick an era", short: "Eras", ico: "logo" },
  { id: "prepare", label: "Getting prepared", short: "Prepare", ico: "wrench" },
];

export const RULES_TABS: LearnTab[] = [
  { id: "command", label: "Command Phase", short: "Command", ico: "cmd-delta" },
  { id: "jump", label: "Jump Phase", short: "Jump", ico: "shuffle" },
  { id: "tactical", label: "Tactical Phase", short: "Tactical", ico: "arc-primary" },
  { id: "end", label: "End Phase", short: "End", ico: "flag" },
];

/**
 * A "why this is cool" passage.
 *
 * It is the BOOK talking, every time - a designer's note, a sidebar, or one of
 * the fiction vignettes that head the rules chapters. It used to be us, in a
 * bordered box with a "WHY THIS IS COOL" label over it, explaining to the
 * reader why the rule they had just read was clever. That is the single worst
 * thing a page like this can do, and it was doing it nineteen times.
 *
 * So: no box, no label, no heading. Italic serif prose, run into the page like
 * any other paragraph, which is the same treatment faction taglines get
 * elsewhere in the app - serif italic already reads as "somebody is talking to
 * you" and sans reads as "this is the rule".
 */
const cool = (body: string): string => `<div class="ltp-cool">${body}</div>`;

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

/**
 * THE ONE PLACE ON THESE PAGES THAT IS NOT THE BOOK TALKING, and it exists
 * because of a hole the verbatim rule left. "Unit" and "ship" are the two most
 * used nouns in the game and the rulebook never stops to define either - it
 * defines them by use, over sixty pages, which works for somebody reading sixty
 * pages and not for somebody reading eight. On these pages the two words are
 * used ninety times, and a reader who has not worked out that a unit is up to
 * three ships cannot parse a single sentence of the Tactical Phase.
 *
 * Everything here is drawn from rules that ARE quoted on these pages (unit
 * coherence, one action per unit, the Mass 3 limit from fleet building, the
 * battlegroup's lifetime) - it is a summary of the book, not an addition to it.
 *
 * These three used to be a bordered <dl> at the top of Drag to Select, and that
 * was the wrong shape for them twice over: it was a wall of definitions before
 * the rule they serve, on ONE of the six pages, so a reader who arrived at the
 * Movement Step from a shared link never saw it. A definition you can ask for
 * where you are already reading beats a definition you had to have read
 * earlier, so they became hover/focus notes on the word itself - see glossify()
 * below for where they land.
 */
const GLOSSARY: [string, string][] = [
  ["ship", "One miniature, with its own Mass, Thrust, HP, weapons and arcs of fire. Ships are what you move, and what takes damage."],
  [
    "unit",
    "One to three ships, grouped when the fleet is built (or when they are requisitioned mid-game) and kept together from then on. A unit moves in one step, all of its ships take the same action, and at the end of its movement they must all be within 6&rdquo; of each other. A Mass 3 ship is always a unit of one.",
  ],
  [
    "battlegroup",
    "The units you drag together for a single activation, to a Combined Mass of 10. Battlegroups are temporary formations and only exist during that activation.",
  ],
];

/**
 * Tags whose text must never be touched by glossify().
 *
 * `svg` is the one that matters: a diagram's <text> nodes say "Jump In a unit",
 * and an HTML <span> inside SVG text is not a span, it is an unknown element
 * that renders as nothing - the label would silently lose the word. The rest
 * are places where a popover is either useless or actively wrong: headings and
 * the tab rail (the word is a label, not prose), summaries and buttons (they
 * already do something when you press them), and dt/caption for the same reason
 * as headings.
 */
const NO_GLOSS = new Set(["svg", "h1", "h2", "h3", "h4", "summary", "button", "a", "caption", "dt", "nav"]);

/**
 * No role and no aria-label on the word.
 *
 * Both were tried and both are worse than nothing. `role="button"` promises
 * that pressing it does something, and it does not - it shows a note. And an
 * aria-label on the outer span REPLACES everything inside it, so a screen
 * reader stops reading the sentence at that point and says the label instead:
 * the one word a reader most needs in place is the one that would go missing.
 * Left as plain text with tabindex, the sentence reads through, the definition
 * reads after it, and a keyboard or a tap can still open it.
 */
const glossMarkup = (word: string, def: string): string =>
  `<span class="ltp-gloss" tabindex="0"
    >${word}<span class="ltp-gloss-pop" role="tooltip"
      ><span class="ltp-gloss-k">${escapeHtml(word.toLowerCase())}</span
      ><span class="ltp-gloss-d">${massGlyphs(def)}</span></span
  ></span>`;

/**
 * The stand-in a matched word leaves behind until the whole pass is done.
 *
 * U+0001, because it cannot occur in any authored string in this file and is
 * neither a letter nor a digit, so no later term can match inside it. A bare
 * index would be worse than useless: the final pass would then rewrite every
 * "6" and "10" on the page into a definition.
 */
const SENTINEL = "\u0001";

/**
 * Mark the FIRST mention of each glossary term on a page, and only the first.
 *
 * Once per page, not once per occurrence: "unit" appears fourteen times on the
 * Movement Step alone, and fourteen dotted underlines down one column reads as
 * a page of links rather than as prose with a couple of terms in it. First
 * mention is also where a reader who does not know the word is standing.
 *
 * It runs over the finished HTML rather than over the source strings because
 * the source is forty-odd separate literals and the first mention is a property
 * of the assembled page, not of any one of them. The pass is a plain tokeniser
 * - tags out, text in - with three guards: NO_GLOSS above, the SENTINEL, and
 * the picker-panel scope below.
 *
 * THE PANELS GET THEIR OWN. The Jump Phase's A/B/C cards are three siblings of
 * which two are `display: none`, and on the first build of this the only
 * mention of "ships" on that page fell inside card B: the mark was made, was
 * correct, and was invisible to anybody who did not press B. A hidden card must
 * not be able to spend the page's one mark, and a card you have opened should
 * carry its own - so each panel is its own scope with its own three terms, and
 * the page outside them keeps its own.
 */
function glossify(html: string): string {
  const slots: string[] = [];
  const page = new Map(GLOSSARY);
  let scope = page;
  let noGloss = 0;
  // Tracked so the end of a panel can be recognised: a panel's closing </div>
  // is the one that brings div nesting back to the depth it opened at.
  let divs = 0;
  let panelDepth: number | null = null;

  const out = html.replace(/<[^>]*>|[^<]+/g, (tok) => {
    if (tok.startsWith("<")) {
      const m = /^<(\/?)([a-zA-Z][\w-]*)/.exec(tok);
      if (!m) return tok;
      const closing = !!m[1];
      const tag = m[2]!.toLowerCase();
      if (NO_GLOSS.has(tag)) {
        if (closing) noGloss = Math.max(0, noGloss - 1);
        else if (!tok.endsWith("/>")) noGloss++;
      }
      if (tag === "div") {
        if (closing) {
          if (panelDepth !== null && divs === panelDepth) {
            panelDepth = null;
            scope = page;
          }
          divs--;
        } else {
          divs++;
          if (panelDepth === null && tok.includes("ltp-pick-panel")) {
            panelDepth = divs;
            scope = new Map(GLOSSARY);
          }
        }
      }
      return tok;
    }
    if (noGloss > 0 || !scope.size) return tok;
    let text = tok;
    for (const [term, def] of [...scope]) {
      // Plural too ("ships", "units"), so the first mention counts whichever
      // number it happens to be in. Word boundaries both ends: "unit" must not
      // match inside "opportunity".
      const hit = new RegExp(`\\b(${term}s?)\\b`, "i").exec(text);
      if (!hit) continue;
      slots.push(glossMarkup(hit[1]!, def));
      text = `${text.slice(0, hit.index)}${SENTINEL}${slots.length - 1}${SENTINEL}${text.slice(hit.index + hit[1]!.length)}`;
      scope.delete(term);
    }
    return text;
  });
  return out.replace(/\u0001(\d+)\u0001/g, (_, n: string) => slots[Number(n)]!);
}

/**
 * A lettered procedure: A, B, C down the side, each step named, with optional
 * riders indented under it.
 *
 * For sequences where the ORDER is the rule. The Movement Step was five
 * paragraphs of equal weight, so "first pivot, then move ahead" - which is the
 * whole procedure - read as just another note among the notes, and Inertial
 * Strain (a consequence of how far you pivoted) sat at the same level as the
 * pivot itself.
 */
const steps = (items: [string, string, string[]?][]): string => `
  <ol class="ltp-steps">
    ${items
      .map(
        ([name, text, subs]) => `
      <li class="ltp-step">
        <span class="ltp-step-k" aria-hidden="true"></span>
        <div class="ltp-step-body">
          <p class="ltp-step-name">${massGlyphs(name)}</p>
          <p class="ltp-step-text">${massGlyphs(text)}</p>
          ${subs?.length ? `<ul class="ltp-step-subs">${subs.map((x) => `<li>${massGlyphs(x)}</li>`).join("")}</ul>` : ""}
        </div>
      </li>`,
      )
      .join("")}
  </ol>`;

/**
 * One Command, in the same card the Command Phase page uses, dropped inline
 * wherever that Command is the thing being talked about.
 *
 * Power to Engines is explained on the Movement page and Requisition in the
 * Jump Phase; both used to be a sentence of ours paraphrasing the card. Showing
 * the card means the reader meets the same object in the same styling in both
 * places, and the wording stays the book's.
 */
const cmdCard = (name: string, text: string): string => `
  <div class="ltp-cmds ltp-cmds-inline">
    <div class="ltp-cmd">
      <p class="ltp-cmd-name">${icon("cmd-delta", 15, "ltp-cmd-ico")} ${escapeHtml(name)} <span class="ltp-cmd-cost">1 CMD</span></p>
      <p class="ltp-cmd-text">${massGlyphs(text)}</p>
    </div>
  </div>`;

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
    ${cool(
      // p.73, verbatim - the opening of the Eras of Play chapter.
      `<p>With A Billion Suns, I want you to have the ultimate spaceship gaming toolkit. To this end, I&rsquo;ve divided the game&rsquo;s content &ndash; its factions, missions and game modes &ndash; into Eras, each a period in the rise and fall of humanity&rsquo;s first interstellar epoch. Each Era is both a chapter in humanity&rsquo;s epic arc and a unique game mode. Each is a sandbox to tell different, but iconic, types of sci-fi stories.</p>`,
    )}
    <div class="ltp-eras">${ERA_CARDS.map((e, i) => eraAccordion(e, i === 0)).join("")}</div>`;
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
 *
 * An "Ask somebody" group (the Full Thrust list, BoardGameGeek, the Discord)
 * was cut too - a place to ask is not a place to buy spaceships, and this list
 * answers one question. The Discord moved to the site footer, where a link to
 * the community belongs on every page rather than on this one.
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
      { name: "Star Wars: Armada (out of print, secondhand only)", url: "https://boardgamegeek.com/boardgame/163745/star-wars-armada" },
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

/**
 * A closed accordion with a plain summary line.
 *
 * The same control the spaceship-source list uses, generalised: everything on
 * this page that is a shopping trip rather than a rule sits behind one of
 * these, closed. Somebody reading "what do I need" wants a short answer;
 * somebody kitting out for a campaign wants all of it.
 */
const fold = (label: string, body: string, note?: string): string => `
  <details class="ltp-fold">
    <summary class="ltp-fold-head">
      <span class="ltp-fold-l">${label}</span>
      ${note ? `<span class="ltp-fold-n">${escapeHtml(note)}</span>` : ""}
      ${icon("chevronDown", 18, "ltp-fold-chev")}
    </summary>
    <div class="ltp-fold-body">${body}</div>
  </details>`;

/**
 * One row of the stat sheet: the app's own icon for the stat, the stat's name,
 * and the rulebook's definition of it.
 *
 * The icons are the ones the builder and the compendium already print beside
 * every number, which is the whole reason this table is shaped like this rather
 * than as six more paragraphs: somebody reading here will next see these exact
 * marks on a ship card, and the point of the section is that they recognise
 * them when they do. Cost has no icon in that set - it is a number of credits,
 * printed as a number everywhere in the app - so its cell carries the same
 * currency mark the builder uses and the row lines up with the rest.
 */
const statRow = (ico: string | null, name: string, body: string): string => `
  <div class="ltp-stat">
    <div class="ltp-stat-k">
      ${ico ? icon(ico, 19, "ltp-stat-ico") : `<span class="ltp-stat-ico ltp-stat-ico-cr">cr</span>`}
      <span class="ltp-stat-n">${escapeHtml(name)}</span>
    </div>
    <div class="ltp-stat-d">${body}</div>
  </div>`;

/**
 * What a ship is, and what every number on it means. pp.24-28, verbatim.
 *
 * This page told you to bring miniatures and then sent you to the Command
 * Phase, so the first time a reader met the word Silhouette it was inside a
 * rule that assumed they already knew it - and Silhouette is the one stat in
 * this game that is three rules at once (what hits you, what your HP is, and
 * how much you can take). Six stats, three of them doing something a reader
 * cannot guess from the name, and none of them explained anywhere on these
 * pages: that is the hole this fills.
 *
 * Position and Heading come first and get the diagram, because they are the two
 * that are geometry rather than a number and every measurement in the game
 * starts from one and runs along the other.
 *
 * Every word of it is the book's, from the Spaceships chapter (pp.24-28). The
 * "See Combat, page XX" cross-references are dropped throughout - the book ships
 * with them unresolved, and a live "page XX" is worse than no citation.
 */
function sectionSpaceships(): string {
  return `
    ${h(3, "Your ships")}
    ${quote(
      // p.24, verbatim.
      `${p("You control a Fleet of Ships, organised into Units.")}
       ${p("The units in your fleet will tend to begin the game in your Reserves area. Ships in reserve are out of play, but you should have the miniatures nearby, ready to jump into the action.")}
       ${p("Each ship has a Position and a Heading, and ships are arranged into units during play. A ship&rsquo;s stats are defined by its Ship Class.")}`,
    )}
    ${learnDiagram("ship-anatomy")}
    ${quote(
      // p.25, verbatim.
      `${p("<b>Position.</b> A ship&rsquo;s Position is the location of the centrepoint of the model&rsquo;s base (likely its flight peg), or the centrepoint of the model if it has no base.")}
       ${p("<b>Heading.</b> A ship&rsquo;s Heading is the direction in which the model is pointing. While spaceships may have any number of weird and exotic designs, it must always be clear during play in which direction the ship is facing, for the purposes of determining its heading. If it isn&rsquo;t obvious from the shape of the miniature, a little mark on the model&rsquo;s base can help to indicate its heading.")}
       ${p("<b>Ship Classes.</b> Each ship has a Ship Class, which defines the statistics for that ship. The available ship classes vary by faction.")}`,
    )}

    ${h(3, "Ship stats")}
    ${quote(
      // p.26, verbatim - the one line that introduces the set.
      p("Ships are defined by a set of stats."),
    )}
    <div class="ltp-stats">
      ${statRow(
        null,
        "Cost",
        // p.26, verbatim.
        p("The cost in (billions of) credits of one ship of this class. This is used during fleet building or when jumping in new ships, depending on the Game Mode."),
      )}
      ${statRow(
        "stat-mass",
        "Mass",
        // p.26, verbatim.
        `${p("A broad description of the size and bulk of a ship. Throughout the rules, when you see the icon ⓜ, replace it with the numerical value of the mass of the unit&rsquo;s ship class. If a rule refers to the Combined Mass of ships, sum the ⓜ of all the individual related ships to form a total.")}
         ${p("Occasionally, when encountering the ⓜ icon, it may be unclear which ship&rsquo;s mass to apply. As a general rule, use the mass of the ship that is actively doing the thing, rather than the ship having the thing done to them.")}`,
      )}
      ${statRow(
        "stat-thrust",
        "Thrust",
        // p.27, verbatim.
        p("The maximum number of inches this ship can travel in a single move."),
      )}
      ${statRow(
        "stat-silhouette",
        "Silhouette",
        // p.27, verbatim. Three paragraphs and all three stay: this stat is
        // three separate rules wearing one name, and any one of them cut leaves
        // a reader who thinks Silhouette is only the other two.
        `${p("Silhouette represents both the physical size of the ship as well as the brightness of its energy signature. The larger and &lsquo;louder&rsquo; the ship, the easier it is for enemy vessels to track, target and hit it, but the more punishment it can withstand.")}
         ${p("A ship&rsquo;s Silhouette value is the highest roll on any attack die that will be considered a hit.")}
         ${p("Each ship enters play with Hull Points (HP) equal to its Silhouette. A ship&rsquo;s HP value is the number of damage tokens required to remove the ship from play.")}`,
      )}
      ${statRow(
        "stat-shields",
        "Shields",
        // p.27, verbatim.
        `${p("Most larger ships are equipped with kinetic field generators, used to absorb and disperse the energy of incoming attacks. A ship&rsquo;s Shields value indicates the strength and sophistication of the defensive shields it possesses.")}
         ${p("A ship&rsquo;s Shields value determines the highest die roll that counts as a successful saving throw when defending against attacks.")}`,
      )}
      ${statRow(
        "arc-primary",
        "Weapons",
        // p.27, verbatim.
        p("The weapons this ship is carrying and in what quantity. Ships may have Primary and/or Auxiliary weapon systems. Weapon systems have a Range (Minimum and Maximum), a number and type of Attack Dice, and a damage value."),
      )}
    </div>

    ${h(3, "Units")}
    ${quote(
      // p.28, verbatim.
      `${p("All the ships in a fleet are composed into Units. A unit can only contain ships of one class. Units can contain up to 3 ships, except for Mass 3 units, which always contain just a single ship.")}
       <figure class="ltp-fig">
         <table class="ltp-table">
           <caption>Unit size table</caption>
           <thead><tr><th scope="col">Mass</th><th scope="col">Maximum Unit Size</th></tr></thead>
           <tbody>
             <tr><td><b>0&ndash;2</b></td><td>3</td></tr>
             <tr><td><b>3</b></td><td>1</td></tr>
           </tbody>
         </table>
       </figure>
       ${p("<b>Unit Coherence.</b> After a unit jumps in, and at the end of its movement step, all the ships in the unit must be within 6&rdquo; of all other ships in that unit.")}`,
    )}

    ${h(4, "Squadrons")}
    ${quote(
      // p.28, verbatim. The Scramble Squadrons action is quoted on the Action
      // Step page, where the actions are, and not repeated here.
      `${p("Ships of Mass 0 represent small groups of tiny attack craft or starfighters rather than a single starship. Mass 0 ships are also referred to as Squadrons, and can be carried into battle in the bellies of larger ships.")}
       ${p("A unit can carry a number of Squadrons up to twice its Combined Mass. (E.g. a unit of one Mass 2 ship can carry up to 4 Squadrons, a single Mass 3 ship can carry up to 6 Squadrons, and a unit of three Mass 2 ships can carry up to 12.) Those carried Squadrons can be arranged into any number of units.")}
       ${p("For reasons of abstraction and simplicity, Squadrons are carried by &rsquo;the unit&lsquo;, not by an individual ship, and are always considered to be carried by the last surviving ship in the unit. You don&rsquo;t have to destroy the carried Squadrons until the last ship in the carrying unit is destroyed.")}`,
    )}

    ${h(4, "Naming your fleet")}
    ${cool(
      // p.24, verbatim - the author's aside under Fleets.
      `<p>When you create your fleet, give it a name. It could be your corporation&rsquo;s name (&lsquo;YouSpace ExoHome Terraforming Inc&lsquo;, rather than &rsquo;Heavy Industries&lsquo;) or the name of your task force or regiment (&lsquo;Grenadine Peacekeepers Precinct 219&lsquo; for a Unity fleet). I&rsquo;ve left you a space on your Fleet Roster for you to name your fleet.</p>`,
    )}`;
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

    ${sectionSpaceships()}

    ${h(3, "The play area")}
    ${quote(
      // p.29, verbatim.
      `${p("You will need one or more flat surfaces to play A Billion Suns across. This game is designed to be played across multiple tables at once, or with your gaming table divided into sections. These separate tables, or sections, are referred to as Sectors.")}
       ${p("You always start with a single sector. Some missions may instruct you to add additional sectors.")}`,
    )}

    ${h(4, "Multiple tables?")}
    ${quote(
      // p.29, verbatim.
      `${p("When setting up a game, your mission may instruct you to &ldquo;Add 1 Sector&rdquo; or &ldquo;Set up 2 Sectors&rdquo;. Simply agree on another flat playable surface to count as the new sector or divide your current play area in two with tape or string to create the additional sector.")}
       ${p("You don&rsquo;t have to divide your table up evenly, and sectors don&rsquo;t even have to be regular shapes. You could even use a nearby side table or counter-top as a sector. Sectors can be as small as 16&rdquo; by 16&rdquo; and still be playable. A Billion Suns is designed to be flexible to the size and shape of each play area &ndash; there is no &lsquo;standard&rsquo; size for any of the sectors. The game works perfectly on any size or shape of table.")}`,
    )}
    ${fold(
      // The summary is the reader's own second thought, in the same italic
      // serif the book's voice is set in - because what is behind it IS the
      // book's voice, answering exactly that.
      `<em class="ltp-fold-ask">No really&hellip; multiple tables?</em>`,
      cool(
        // p.29, verbatim - the sidebar beside the Sectors rules.
        `<p>It will seem weird at first, but playing with multiple opponents across multiple tables creates a joyously chaotic deep-space gaming experience. It is one of the unique elements of A Billion Suns and shouldn&rsquo;t be house-ruled out if you want to experience the game at its best, doubly-so if you are playing with 3 or 4 players.</p>
         <p>It&rsquo;s not as difficult to set up multiple sectors as it might sound. You could play across the kitchen table, a kitchen counter and a flat-seated chair. You could take a normal wargaming table and use masking tape or string to split it up into halves or quarters. If you normally use a number of smaller boards to make up a larger gaming table, just pull the board sections apart an inch or so.</p>`,
      ),
    )}

    ${sourceList()}
`;
}

/**
 * The shopping you only do once you are past your first game: the full token
 * spread and the mission terrain.
 *
 * It sat on Getting Prepared, immediately under "what you will need to play",
 * where it contradicted the thing above it - the six-line list on p.12 is the
 * whole answer to "can I play tonight", and following it with a demand for 5
 * Space Kraken makes it read as though you cannot. It is a better last page
 * than a second first one: by the End Phase the reader has been through a whole
 * round and is deciding what to buy next, which is exactly what this answers.
 */
function biggerGames(): string {
  return `
    ${h(3, "When you&rsquo;re ready for bigger games")}
    ${fold(
      "Tokens",
      quote(
        // p.12, verbatim.
        `<p>You will need a selection of scavenged tokens, gaming gems or spare dice to represent the following:</p>
         ${ul(["CMD tokens.", "Damage tokens.", "Jump points (you can also use small jump gate or navigation buoy miniatures for these).", "Activated tokens", "Easy Target tokens", "Assorted other tokens for the missions."])}
         ${p("Missions sometimes need a variety of different token types. Don&rsquo;t stress about having a matching token design for every variety of token. You can just use different coloured gems, dice or tokens scavenged from other games. As long as everyone knows which tokens represent what during a particular game, you&rsquo;ll be fine.")}`,
      ),
    )}
    ${fold(
      "Other minis &amp; terrain",
      quote(
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
      ),
    )}`;
}

// ---------------------------------------------------------------------------
// 3. Initiative & Command
// ---------------------------------------------------------------------------

/**
 * The six Core Commands, verbatim from p.50, IN THE BOOK'S ORDER and numbered
 * to match. The order is not alphabetical and not by usefulness - it is the
 * order they are printed in, so somebody holding the book can find the same one
 * in the same place.
 */
const CORE_COMMANDS: [string, string][] = [
  ["All Hands", "After a friendly unit takes its first action in the Action Step, spend 1 CMD token to take a second (different) action with it."],
  ["Executive Oversight", "Re-roll one attack die, initiative die or saving throw."],
  ["Power to Engines", "At the start of a friendly unit&rsquo;s movement step, spend 1 CMD token to move twice during this movement step (pivoting and moving ahead both times)."],
  [
    "Power to Weapons",
    "Before rolling to attack with a friendly unit, spend 1 CMD token to subtract 1 from the result of each attack dice (to a minimum of 1), for the current Salvo. This increases the chance of critical hits but doesn&rsquo;t prevent duds.",
  ],
  [
    "Power to Shields",
    "Before rolling Saving Throws with a friendly unit with a Shields value of 1 or more, spend 1 CMD token to add 1 to this unit&rsquo;s Shields value, for the current Salvo only.",
  ],
  [
    "Red Alert",
    "When a friendly ship without an Activated token would be destroyed, spend 1 CMD token: it isn&rsquo;t destroyed, and regains 1HP instead. At the end of your next activation, if this ship is still in play, it is reduced to 0HP, and you cannot use Red Alert to save it. If a ship jumps out after using Red Alert, it isn&rsquo;t reduced to 0HP and is saved from destruction, but cannot return to play.",
  ],
];

function sectionCommand(): string {
  return `
    ${h(3, "Gain CMD tokens")}
    ${quote(
      // p.30, verbatim, less the Training Fleet aside - that is a note about one
      // scenario's fleet and this page is not about that fleet.
      p("You gain a number of CMD tokens determined by your faction. Unspent CMD tokens are discarded at the end of the round."),
    )}
    ${learnDiagram("cmd-gain")}

    ${h(3, "CMD tokens")}
    ${quote(
      // p.49, verbatim.
      `${p("To use a Command, spend the listed number of CMD tokens. Each Command says when it can be used, and how many CMD tokens are needed to use it. When a CMD token is spent, discard it.")}
       ${p("Unspent CMD tokens are discarded in the End Phase.")}`,
    )}

    ${h(3, "The Core Commands")}
    ${cool(
      // p.49, verbatim - the line that opens the Commands chapter.
      `<p>Whether by well-rehearsed doctrine, cunning pre-planning or just barking orders through foam-flecked lips, the job of any commander is to expect and extract the very best from their fleet and their personnel.</p>`,
    )}
    <div class="ltp-cmds">
      ${CORE_COMMANDS.map(
        ([name, text], i) => `
        <div class="ltp-cmd">
          <p class="ltp-cmd-name"><span class="ltp-cmd-n">${i + 1}</span> ${escapeHtml(name)} <span class="ltp-cmd-cost">1 CMD</span></p>
          <p class="ltp-cmd-text">${massGlyphs(text)}</p>
        </div>`,
      ).join("")}
    </div>

    ${h(3, "Initiative")}
    <p class="ltp-p">At the start of each game round, all players roll for Initiative. (In ABS, you always want to roll low.)</p>
    ${learnDiagram("initiative")}
    ${quote(
      // p.30, verbatim, less the parenthetical cross-reference to Silhouette 3 -
      // that is a mnemonic for a rule the reader has not met yet.
      `${p("All players make an Initiative Check. Roll a number of D6 equal to your faction&rsquo;s Initiative value. Each roll of a 2 or 3 counts as one success; each roll of a 1 counts as two successes.")}
       ${p("The player that rolls the most successes wins the Initiative Check and chooses which player has the Initiative for this round. If two or more players are tied, the tied players sum their dice values: the player with the lowest sum wins the Initiative Check. If still tied, the tied player clockwise from the last player to have Initiative wins the Initiative Check.")}
       ${p("The player(s) that didn&rsquo;t win the Initiative Check receive 1 additional CMD token each.")}`,
    )}`;
}

// ---------------------------------------------------------------------------
// 4. The Jump Phase
// ---------------------------------------------------------------------------

/**
 * The three things you can do on your turn in the Jump Phase, as a picker.
 *
 * They were a bulleted list of three lines and then two headed sections further
 * down that repeated two of them at length, which buried the actual shape of a
 * turn: it is a choice of exactly one of three, and a list does not say
 * "choose". Pressing A, B or C swaps the panel underneath, each with its own
 * animation, so the rules for a choice live inside the choice.
 *
 * Three cards in a row still read as three things you might do in sequence, so
 * a fork hangs off the sentence above them: one stem out of "you do one of the
 * following", an arm across, and a drop into each card. It is the shape you
 * would draw on paper to mean "exactly one of these", and the drop into the
 * card you are reading turns red with that card's top edge, so the diagram
 * tracks the choice instead of just decorating it.
 *
 * Radios and CSS, no JavaScript and nothing in the store. Which option you are
 * looking at is not application state - nothing else on the page depends on it,
 * it should not survive a reload, and routing it through the store would mean a
 * full re-render (and a fresh diagram, restarting mid-animation) on every press.
 * A checked radio also gets keyboard arrow-key switching for free, which a set
 * of buttons would have to implement.
 */
function turnPicker(): string {
  const opts: { k: string; letter: string; name: string; body: string }[] = [
    {
      k: "a",
      letter: "A",
      name: "Open a Jump Point",
      body: `${learnDiagram("jump-point")}
        ${quote(
          // p.30 and p.32, verbatim.
          // The Gravity Well paragraph that used to close this card is gone. It
          // restated the 9" limit a third time in three sentences, and the
          // sentence above it already carries the half of the rule this card is
          // about ("anywhere outside of 9" from a planetoid"); the diagram
          // carries the rest.
          `${p("<b>Open a Jump Point:</b> Take a jump point from the supply and place it into play, anywhere you like.")}
           ${p("During the Jump Phase, you can use your turn to open a new Jump Point, if you have any remaining in your supply. Take a Jump Point from your supply, and place it into play, anywhere outside of 9&rdquo; from a planetoid.")}`,
        )}`,
    },
    {
      k: "b",
      letter: "B",
      name: "Jump In",
      body: `${learnDiagram("jump-in")}
        ${quote(
          // p.30 and p.33, verbatim.
          `${p("<b>Jump In:</b> Deploy a unit from Reserve.")}
           ${p("During the Jump Phase, you can use your turn to Jump In a single unit from your Reserves area.")}
           ${p("To Jump In a unit, deploy all ships from that unit within 6&rdquo; of a friendly Jump Point.")}`,
        )}`,
    },
    {
      k: "c",
      letter: "C",
      name: "Pass",
      body: `${learnDiagram("pass")}
        ${quote(
          // p.30, verbatim.
          `${p("<b>Pass:</b> You take no further turns during this Jump Phase.")}`,
        )}`,
    },
  ];
  return `
  <div class="ltp-pick">
    ${opts
      .map(
        (o, i) =>
          `<input class="ltp-pick-radio" type="radio" name="jump-turn" id="jt-${o.k}" ${i === 0 ? "checked" : ""}>`,
      )
      .join("")}
    <div class="ltp-pick-fork" aria-hidden="true">
      <i class="ltp-pick-stem"></i>
      <i class="ltp-pick-arm"></i>
      <span class="ltp-pick-drops">
        ${opts.map((o) => `<i class="ltp-pick-drop" data-k="${o.k}"></i>`).join("")}
      </span>
    </div>
    <div class="ltp-pick-rail">
      ${opts
        .map(
          (o) => `<label class="ltp-pick-tab" for="jt-${o.k}">
            <span class="ltp-pick-k">${o.letter}</span>
            <span class="ltp-pick-n">${escapeHtml(o.name)}</span>
          </label>`,
        )
        .join("")}
    </div>
    ${opts.map((o) => `<div class="ltp-pick-panel" data-k="${o.k}">${o.body}</div>`).join("")}
  </div>`;
}

function sectionJump(): string {
  return `
    ${quote(
      // p.30, verbatim.
      `${p("The units in your Fleet start the game in Reserve and must be jumped into the combat zone via jump point during the Jump Phase.")}
       ${p("In the Jump Phase, players take turns, clockwise from the player with Initiative. On your turn, you do one of the following:")}`,
    )}
    ${turnPicker()}
    ${quote(
      // p.30, verbatim.
      p("Once all players have passed, the Jump Phase ends."),
    )}

    ${h(3, "Jump points")}
    ${quote(
      // p.32, verbatim.
      `${p("A Jump Point is represented on the tabletop by a token approximately 1&rdquo; in diameter. You could use a gaming gem, a coin or a token. All measurements to and from jump points are from its centrepoint, so the exact size isn&rsquo;t important.")}
       ${p("The number of Jump Points you start the game with is determined by the era of play, and sometimes by the mission.")}`,
    )}`;
}

// ---------------------------------------------------------------------------
// 5. The Tactical Phase
// ---------------------------------------------------------------------------

/**
 * The Tactical Phase, as five pages.
 *
 * It is longer than the other three phases put together, and on one page you
 * scrolled past four things to reach the fifth. Each step of an activation is
 * its own page now, addressed at #/rules/tactical/<step>, with a second rail
 * under the heading. Shooting gets its own page for the same reason it goes
 * last in the book: it is the biggest single body of rules in the game and the
 * one you come back to mid-game.
 */
export const TACTICAL_SUBS: { id: string; label: string; short: string }[] = [
  { id: "select", label: "Drag to Select a battlegroup", short: "Select" },
  { id: "move", label: "Movement Step", short: "Move" },
  { id: "passive", label: "Passive Attacks Step", short: "Passive" },
  { id: "action", label: "Action Step", short: "Act" },
  { id: "shoot", label: "Shooting", short: "Shoot" },
];

const TACTICAL_PAGES: Record<string, () => string> = {
  // The shape of an activation goes FIRST, above the gesture that starts one.
  //
  // It used to close this page, four screens down, which had the five pages of
  // the Tactical Phase reading as five unrelated procedures: you learnt how to
  // draw a battlegroup, then how to move, then how passive attacks work, and
  // only at the very end were you told the three of them are one sequence run
  // by every unit in the group before the next step starts. That is the frame
  // the other four pages hang off, and a frame is no use arriving last.
  select: () => `
    ${quote(
      // p.31, verbatim. Split from the sentence that follows it, which stayed
      // down by the Drag to Select procedure it introduces. This one is the
      // frame for the whole phase - whose turn it is and in what order - and it
      // has to be read before the steps of an activation, not after them.
      p("In the Tactical Phase, players take turns to activate battlegroups, clockwise from the player with Initiative."),
    )}

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

    ${quote(
      // No heading over this. The sub-rail above the page already has the Select
      // tab lit, and this sentence is its own introduction: it names the gesture
      // and hands straight over to the procedure under it.
      // p.31, verbatim - the second half of the pair split at the top of this page.
      p("On your turn, you Drag to Select a battlegroup and activate the units in that battlegroup."),
    )}

    ${quote(
      // p.31, verbatim - five steps, not p.34's three. See the note above.
      `<p>When you Drag to Select a battlegroup:</p>
       ${ol([
         "Select a friendly unactivated unit to be the <i>lead unit.</i>",
         "Select any number of other friendly unactivated units at least partially within 6&rdquo; of the lead unit. The Combined Mass of selected units must be 10 or less.",
         "Activate the units in that Battlegroup.",
         "After a unit activates, give it an &lsquo;Activated&rsquo; token. Once you have finished activating all the units in that battlegroup, the battlegroup is deselected, and you pass play to the next player clockwise.",
         "Once all in-play units have activated, the Tactical Phase ends.",
       ])}`,
    )}
    ${learnDiagram("drag-select")}

    ${h(4, "So what is Mass?")}
    ${quote(
      // p.20 and p.26, verbatim.
      `${p("Mass is a broad measure of the size and bulk of a ship. Throughout the rules, when you see the icon ⓜ, replace it with the numerical value of the Mass of the unit&rsquo;s ship class. If a rule refers to the Combined Mass of ships, sum the ⓜ of all the related individual ships to form a total.")}
       ${p("Occasionally, when encountering the ⓜ icon, it may be unclear which ship&rsquo;s mass to apply. As a general rule, use the mass of the ship that is actively doing the thing, rather than the ship having the thing done to them.")}`,
    )}`,
  move: () => `
    ${quote(
      // p.36, verbatim.
      `${p("When you move a unit, move each of the ships once, one at a time and in any order.")}
       ${steps([
         [
           "Pivot",
           "To pivot a ship: rotate the ship about its centrepoint by any amount, without changing its position.",
           ["<b>Inertial Strain.</b> If a ship pivots more than 90 degrees in a single pivot, it cannot attack with its primary weapon systems during this activation."],
         ],
         [
           "Move ahead",
           "Move it straight ahead up to its Thrust value in inches. When measuring movement, remember to measure from the ship&rsquo;s Position (its flight peg).",
         ],
         [
           "Check coherence",
           "After a unit jumps in, and at the end of its movement step, all the ships in the unit must be within 6&rdquo; of all other ships in that unit.",
         ],
       ])}`,
    )}
    ${learnDiagram("movement")}
    ${quote(
      // p.37, verbatim.
      `${p("<b>Easy Target.</b> At the end of a ship&rsquo;s Movement Step, if it moved less than 3&rdquo; in total, and didn&rsquo;t Jump In this round, give the unit an &lsquo;Easy Target&rsquo; token. While a unit has an Easy Target token, enemy units targeting this unit may re-roll their attack dice once.")}
       ${p("At the start of a unit&rsquo;s activation, discard any Easy Target tokens on it. If a unit Jump Hops or Jumps Out, discard any Easy Target tokens on it.")}
       ${p("<b>Table Edges.</b> If a ship moves into contact with the edge of a Sector, it immediately stops moving.")}
       ${p("<b>Overlapping Bases.</b> When moving, ships ignore other ships. Ships can end their movement in a position that results in the bases of two models overlapping, as long as the miniatures are stable in their final placement. No two ships can share the same position.")}`,
    )}

    ${h(4, "Doubling your move")}
    ${cmdCard("Power to Engines", "At the start of a friendly unit&rsquo;s movement step, spend 1 CMD token to move twice during this movement step (pivoting and moving ahead both times).")}
    ${learnDiagram("double-move")}

    ${h(3, "Leaving by jump")}
    ${quote(
      // p.33, verbatim.
      `${p("<b>Jump Hop.</b> A unit can use the Jump Hop action during their activation to teleport between two sectors. If all the ships in this unit are within 6&rdquo; of a friendly Jump Point, take the Jump Hop action to remove all the ships in this unit from play and set them up within 6&rdquo; of a friendly Jump Point in another Sector.")}
       ${p("Jump Hop is exclusively for Jumping between sectors. In a game with only a single Sector (such as Combat Training), the Jump Hop action is of no use.")}
       ${p("<b>Jump Out.</b> A unit can use the Jump Out action during their activation to leave play and go into your Reserves area. When a unit Jumps Out into reserve, it keeps all its tokens, both game tokens and asset tokens. At the end of the game, asset tokens carried by ships in your reserves area will count towards revenue and victory conditions: they are safely returned to base.")}`,
    )}`,
  passive: () => `
    ${quote(
      // p.38, verbatim.
      `${p("After moving the units in the battlegroup, there is a Passive Attacks step. Every passive enemy unit that has one or more active units in range and arc of fire of their auxiliary weapons may attack once with their auxiliary weapons, targeting only active units.")}
       ${p("A unit can only make passive attacks once during this battlegroup&rsquo;s activation. It can make further passive attacks in later activations.")}
       ${p("If you have three or more players, the passive players make attacks in turns in a clockwise direction, beginning with the player to the left of the active player.")}`,
    )}
    ${learnDiagram("passive")}`,
  action: () => `
    ${quote(
      // p.38, verbatim.
      `${p("After moving and potentially suffering passive attacks, each unit in the battlegroup takes one Action.")}
       ${p("All the ships in a unit take the same action, but different units in the battlegroup can choose different actions. The basic actions are listed below, but factions, ships or scenario rules can provide additional options.")}`,
    )}
    ${learnDiagram("action")}

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
    ${quote(
      // p.28, verbatim.
      `${p("Ships of Mass 0 represent small groups of tiny attack craft or starfighters rather than a single starship. Mass 0 ships are also referred to as Squadrons, and can be carried into battle in the bellies of larger ships.")}
       ${p("A unit can carry a number of Squadrons up to twice its Combined Mass. (E.g. a unit of one Mass 2 ship can carry up to 4 Squadrons, a single Mass 3 ship can carry up to 6 Squadrons, and a unit of three Mass 2 ships can carry up to 12.) Those carried Squadrons can be arranged into any number of units.")}
       ${p("For reasons of abstraction and simplicity, Squadrons are carried by &rsquo;the unit&lsquo;, not by an individual ship, and are always considered to be carried by the last surviving ship in the unit. You don&rsquo;t have to destroy the carried Squadrons until the last ship in the carrying unit is destroyed.")}
       ${p("A unit that is carrying Squadrons can take the Scramble Squadrons action to deploy a unit of Squadrons.")}`,
    )}`,
  shoot: () => `
    ${cool(
      // p.41, verbatim - the vignette that heads the Combat chapter.
      `<p>The silent flashes of the megabombs illuminated the nightside of Beren III like an electrical storm. Black silhouettes of battleships watched from low orbit like hungry crows.</p>`,
    )}

    ${h(4, "Silhouette and Shields")}
    ${quote(
      // p.27, verbatim.
      `${p("<b>Silhouette</b> represents both the physical size of the ship as well as the brightness of its energy signature. The larger and &lsquo;louder&rsquo; the ship, the easier it is for enemy vessels to track, target and hit it, but the more punishment it can withstand.")}
       ${p("A ship&rsquo;s Silhouette value is the highest roll on any attack die that will be considered a hit. Each ship enters play with Hull Points (HP) equal to its Silhouette. A ship&rsquo;s HP value is the number of damage tokens required to remove the ship from play.")}
       ${p("<b>Shields.</b> Most larger ships are equipped with kinetic field generators, used to absorb and disperse the energy of incoming attacks. A ship&rsquo;s Shields value indicates the strength and sophistication of the defensive shields it possesses.")}
       ${p("A ship&rsquo;s Shields value determines the highest die roll that counts as a successful saving throw when defending against attacks.")}
       ${p("<b>Thrust</b> is the maximum number of inches this ship can travel in a single move.")}`,
    )}

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
    )}`,
};

/** The sub-rail: the same control as the main tab strip, one level down. */
function tacticalRail(active: string): string {
  return `
  <nav class="ltp-subrail" aria-label="Tactical Phase steps">
    ${TACTICAL_SUBS.map(
      (t, i) => `
      <a class="ltp-subtab ${t.id === active ? "on" : ""}" href="#/rules/tactical/${t.id}"
         ${t.id === active ? 'aria-current="true"' : ""}>
        <span class="ltp-subtab-n">${i + 1}</span>
        <span class="ltp-subtab-l">${escapeHtml(t.short)}</span>
      </a>`,
    ).join("")}
  </nav>`;
}

// No heading between the rail and the page.
//
// It printed the current step's full name under the rail, which was a third
// telling of the same thing: the rail is directly above it with that step's tab
// lit and numbered, and the body copy names the step again in its own first
// line ("Movement Step: Move all the units in the battlegroup..."). On Drag to
// Select it had become actively wrong - a heading saying "Drag to Select a
// battlegroup" sitting on top of a section headed "An activation, step by
// step", which is about something else.
function sectionTactical(sub?: string): string {
  const at = TACTICAL_SUBS.find((t) => t.id === sub) ?? TACTICAL_SUBS[0]!;
  return `
    ${tacticalRail(at.id)}
    ${TACTICAL_PAGES[at.id]!()}`;
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
      <figcaption>Each shape of attack dice always causes the same amount of damage. If you remember this, it will make calculating damage easier during play.</figcaption>
    </figure>`;
}

// ---------------------------------------------------------------------------
// 6. End Phase & scoring
// ---------------------------------------------------------------------------

function sectionEnd(): string {
  return `
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
    ${h(3, "Your first game")}
    ${quote(
      // p.11 and p.60, verbatim.
      `${p("To get started with A Billion Suns, read the Core Rules section, gather some miniatures to represent the Training Fleets then play the two Basic Training missions: Combat Simulator and Management Training.")}
       ${p("I recommend you play the Combat Simulator scenario first, to learn the basics of moving and shooting, then play the Management Training scenario next, to learn how to manage jumping in and reinforcing your fleet.")}`,
    )}
    ${learnDiagram("deployment")}
    <div class="ltp-launch">
      <button class="ltp-btn ltp-btn-go" data-action="learn-launch">${icon("flag", 17)} Set up the Combat Simulator</button>
      <p class="ltp-launch-note">Builds the Training Fleet for you and drops you straight into Play Mode, with the phase tracker running.</p>
    </div>

    ${biggerGames()}

    ${h(3, "Get the rulebook")}
    <div class="ltp-cta">
      <a class="ltp-btn ltp-btn-buy" href="${BUY_URL}" target="_blank" rel="noopener">${icon("book", 18)} Buy A Billion Suns 2E</a>
      <a class="ltp-btn ltp-btn-alt" href="./ABS-2E-Quick-Reference.pdf" target="_blank" rel="noopener">${icon("scroll", 17)} Quick Reference (PDF)</a>
      <a class="ltp-btn ltp-btn-alt" href="#/fleets">${icon("fleets", 17)} Build a fleet</a>
    </div>
    <p class="ltp-p ltp-p-note">A Billion Suns is by Mike Hutchinson, published by Osprey Games. This app is an unofficial companion.</p>`;
}

// ---------------------------------------------------------------------------
// The page
// ---------------------------------------------------------------------------

const SECTIONS: Record<string, (sub?: string) => string> = {
  eras: sectionEras,
  prepare: sectionPrepare,
  command: sectionCommand,
  jump: sectionJump,
  tactical: sectionTactical,
  end: sectionEnd,
};

/**
 * Every page, in reading order, each carrying the route it lives under.
 *
 * The rail shows all six even though they are split across two routes. Two
 * separate URLs was the right call - a link should say whether it is the front
 * of the game or the rules - but a rail that showed only the two or only the
 * four made the other half of the walkthrough invisible from where you were
 * standing, so you had to already know #/rules existed to get to it. One rail,
 * six stops, and pressing one changes the URL root as well as the page.
 */
interface LearnPage extends LearnTab {
  root: "#/learn" | "#/rules";
}

const ALL_PAGES: LearnPage[] = [
  ...LEARN_TABS.map((t) => ({ ...t, root: "#/learn" as const })),
  ...RULES_TABS.map((t) => ({ ...t, root: "#/rules" as const })),
];

const pageHref = (t: LearnPage): string => `${t.root}/${t.id}`;

/**
 * Every page in reading order, with the Tactical Phase expanded into its five
 * steps. The tab rail still shows six stops - this is only what Previous and
 * Next walk, so paging through does not skip four fifths of the longest phase.
 */
interface Stop {
  href: string;
  label: string;
}
const READING_ORDER: Stop[] = ALL_PAGES.flatMap((t) =>
  t.id === "tactical"
    ? TACTICAL_SUBS.map((x) => ({ href: `#/rules/tactical/${x.id}`, label: `${t.label}: ${x.label}` }))
    : [{ href: pageHref(t), label: t.label }],
);

/**
 * The tab strip. Rendered twice, identically, and placed by CSS: once inside
 * the sticky header for pointer-sized screens, once in a bar fixed to the
 * bottom of the viewport for phones. Two copies rather than one moved node,
 * because moving it would mean the header's height changes between breakpoints
 * in JS, and the sticky offset is measured from CSS.
 *
 * A thin rule between Prepare and Command marks where one route ends and the
 * other begins - enough to show the rail has two halves, without making that
 * anybody's problem to understand before they press something.
 */
function tabStrip(active: string, place: "top" | "bottom"): string {
  return `
  <nav class="ltp-tabs ltp-tabs--${place}" aria-label="Learn to Play pages">
    ${ALL_PAGES.map(
      (t, i) => `
      <a class="ltp-tab ${t.id === active ? "on" : ""} ${t.root === "#/rules" && i > 0 && ALL_PAGES[i - 1]!.root === "#/learn" ? "is-split" : ""}"
         href="${pageHref(t)}" data-ltp-tab="${t.id}" ${t.id === active ? 'aria-current="true"' : ""}>
        ${icon(t.ico, 17, "ltp-tab-ico")}
        <span class="ltp-tab-l">${escapeHtml(t.short)}</span>
        <span class="ltp-tab-n">${i + 1}</span>
      </a>`,
    ).join("")}
  </nav>`;
}

/**
 * What the game is, above everything else on the very first page.
 *
 * Two sentences of the book's own back-cover copy, then the author's own
 * one-line summary of the two facts that decide whether somebody keeps reading:
 * it alternates activations, and it does not care whose spaceships you own.
 * Only on the first page - the rest are arrived at by somebody already reading,
 * and repeating the pitch on each would be furniture.
 *
 * Then what this guide is and is not, before anybody has spent time on it. It
 * teaches the basics and the flow so you can decide whether 2E is for you; it
 * is not a substitute for the book, and somebody who reads all eight pages and
 * then finds out they still cannot play has been wasted. Said here, in bold,
 * rather than apologised for at the end. The caps are the author's.
 */
const GAME_PITCH = `
  <p class="ltp-pitch">A Billion Suns is a tabletop science-fiction miniatures wargame of interstellar
  combat for 2&ndash;4 players. You command a fleet of mighty battleships, sleek destroyers and agile
  fighters, and battle for supremacy of the stars.</p>
  <p class="ltp-pitch ltp-pitch-2">It is an alternating activations space wargame. It&rsquo;s miniature-agnostic.</p>
  <div class="ltp-scope">
    <p>This guide will teach you the BASICS of the game and give you A SENSE OF THE FLOW.
    It can help you understand IF YOU WANT TO GET INTO ABS2E.</p>
    <p>You will need to buy the <a href="${BUY_URL}" target="_blank" rel="noopener">RULEBOOK</a>
    to actually play a full game.</p>
  </div>`;

/**
 * How far through the guide you are, in the header beside the title.
 *
 * Not a scrollbar for this page: the ten stops in READING_ORDER are one read,
 * and the question somebody halfway down the Tactical Phase is asking is "how
 * much of this is left", not "how much of page six is left". So the trough
 * carries both - the pages behind you are already filled in, and the page you
 * are on fills as you scroll it. Reaching the bottom of a page leaves the fill
 * exactly on the next page's boundary, which is what makes pressing Next feel
 * like it continues rather than restarts.
 *
 * It sits in the header row and not as a full-width line under the tab strip,
 * where a reading bar normally goes, because that edge already carries two
 * coloured rules that mean something else: blue under the tab you are on, red
 * under the two pages belonging to the other route. A third line there was read
 * as a third kind of tab marker rather than as progress. Boxed, and captioned
 * with the count, it cannot be mistaken for either.
 *
 * The fill is rendered at the page's own starting fraction so a cold load shows
 * the right amount before any script runs; syncLearnProgress in main.ts takes
 * it from there. The caption counts stops, so the Tactical Phase's five steps
 * are five of them - it is the same path the Previous/Next pager walks, and a
 * count that disagreed with the buttons under it would be worse than no count.
 * The bar itself is aria-hidden with no role="progressbar": a value that
 * changes on every scroll frame is a screen reader talking over the page, and
 * the caption already says the same thing in words that hold still.
 */
function progressBar(at: number, of: number): string {
  const start = of > 0 ? at / of : 0;
  return `
  <div class="ltp-prog" data-ltp-prog data-at="${at}" data-of="${of}">
    <span class="ltp-prog-track" aria-hidden="true">
      <i class="ltp-prog-fill" style="transform: scaleX(${start.toFixed(4)})"></i>
    </span>
    <span class="ltp-prog-num">${at + 1} <span class="ltp-prog-of">of</span> ${of}</span>
  </div>`;
}

const pagerBtn = (dir: "prev" | "next", t: Stop): string => `
  <a class="ltp-pager-btn ltp-pager-${dir}" href="${t.href}">
    ${dir === "prev" ? icon("chevronLeft", 16) : ""}
    <span class="ltp-pager-txt">
      <span class="ltp-pager-dir">${dir === "prev" ? "Previous" : "Next"}</span>
      <span class="ltp-pager-name">${escapeHtml(t.label)}</span>
    </span>
    ${dir === "next" ? icon("chevronRight", 16) : ""}
  </a>`;

export function learnView(state: AppState): string {
  const root = state.route.view === "rules" ? "#/rules" : "#/learn";
  const routeTab = state.route.view === "learn" || state.route.view === "rules" ? state.route.tab : undefined;
  // Match on the route AND the tab: "command" only means the Command Phase
  // under #/rules, and an unknown tab falls back to the first page of the route
  // that was actually asked for.
  const tab =
    ALL_PAGES.find((t) => t.root === root && t.id === routeTab) ?? ALL_PAGES.find((t) => t.root === root)!;

  // Previous and next walk READING_ORDER, straight across the boundary between
  // the two routes and through the Tactical Phase's five steps, so the
  // read-it-in-order path is one path.
  const sub = state.route.view === "rules" ? state.route.sub : undefined;
  const here = tab.id === "tactical" ? `#/rules/tactical/${sub ?? TACTICAL_SUBS[0]!.id}` : pageHref(tab);
  const at = Math.max(0, READING_ORDER.findIndex((x) => x.href === here));
  const prev = READING_ORDER[at - 1];
  const next = READING_ORDER[at + 1];

  return `
  <main class="ltp" data-ltp-active="${escapeHtml(tab.id)}">
    <header class="ltp-head">
      <div class="ltp-head-in">
        <div class="ltp-head-id">
          <p class="ltp-head-title">${root === "#/rules" ? "The rules" : "Learn to Play"}</p>
        </div>
        ${progressBar(at, READING_ORDER.length)}
      </div>
      ${tabStrip(tab.id, "top")}
    </header>
    <div class="ltp-body">
      <section class="ltp-sec" id="ltp-${tab.id}" aria-labelledby="ltp-h-${tab.id}">
        ${at === 0 ? GAME_PITCH : ""}
        <header class="ltp-sec-head">
          <h2 class="ltp-sec-title" id="ltp-h-${tab.id}">${escapeHtml(tab.label)}</h2>
        </header>
        ${glossify(SECTIONS[tab.id]!(sub))}
      </section>
      <nav class="ltp-pager" aria-label="Learn to Play pages">
        ${prev ? pagerBtn("prev", prev) : `<span class="ltp-pager-gap"></span>`}
        ${next ? pagerBtn("next", next) : `<span class="ltp-pager-gap"></span>`}
      </nav>
    </div>
    ${tabStrip(tab.id, "bottom")}
  </main>`;
}
