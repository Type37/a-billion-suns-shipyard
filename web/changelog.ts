// In-app changelog. Newest first. Full sentences, no shorthand.

export interface ChangelogEntry {
  version: string;
  date: string;
  title: string;
  items: string[];
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: "0.8.0",
    date: "2026-07-10",
    title: "The builder becomes a manifest, Play Mode becomes a real tutorial",
    items: [
      "The builder is rebuilt as a flat manifest ledger instead of a setup-band-plus-two-column layout: a masthead with a live budget meter, a sticky fleet manifest, and a ship/personnel yard. No SaaS-style cards, no truncation anywhere - full weapon stats and personnel rules are always visible.",
      "The ship catalog is a single click target per row (whole row adds a unit, with an always-visible ADD cue and an owned-count tag), and gets a new Compare view: a bar chart ranking every ship class in the faction by cost, mass, thrust, silhouette, or shields.",
      "Personnel are one self-contained card each: adding one opens its carried-by assigner immediately, in the same click, with zero layout shift. Only one of each HVP type may ride in a fleet (designer-confirmed); duplicates are blocked and flagged.",
      "A new segmented switcher (sliding highlight, one bordered track) replaces plain button rows anywhere there are 2 or more mutually exclusive options: the ship-classes view, the New Fleet era picker, and the Play Mode phase tracker.",
      "The Foundry's \"Forge a new faction\" now opens a picker of every existing faction, official or custom, to start from and rename - not just a blank sheet.",
      "Play Mode is a real tutorial now: each of the four round phases is a genuine checklist you tick off at the table (not a paragraph to interpret yourself), the primary action (Next phase) is a real call-to-action, and two original diagrams - a measured table/deployment layout and a firing-arc illustration - replace text-only description for the two hardest-to-picture concepts. Small firing-arc glyphs also sit permanently next to every ship's Primary/Auxiliary weapon stats.",
      "Home page rows are narrower with a \"Get the rulebook\" link alongside them; typography across the app was rebalanced so decorative labels stop competing with buttons and real content for attention.",
    ],
  },
  {
    version: "0.7.11",
    date: "2026-07-08",
    title: "Columns view goes full width",
    items: [
      "Columns view (test) now spans the full window with no side margins: the roster is a fixed left third, Mass columns fill the remaining two-thirds.",
    ],
  },
  {
    version: "0.7.10",
    date: "2026-07-08",
    title: "Builder uses far more of the page",
    items: [
      "The builder (setup band, training guide, roster and catalogue) now spans a wider shell with tighter side margins, so it actually uses a normal monitor instead of stopping at the site's article width.",
      "The roster is substantially wider as a result: on a 1920px display it grows from about 810px to about 1230px.",
    ],
  },
  {
    version: "0.7.9",
    date: "2026-07-08",
    title: "Experimental: Columns view for ship classes",
    items: [
      "New Columns view (test) button by Ship classes: lays every mass class out side by side instead of one long list, with a slim roster rail on the left. Off by default; click to try it, click List view to go back.",
    ],
  },
  {
    version: "0.7.8",
    date: "2026-07-08",
    title: "You can finally see what you're picking, and undo it",
    items: [
      "The ship classes and personnel catalogues no longer truncate names, stats, or weapons with an ellipsis: everything is fully visible before you add it.",
      "High-Value Personnel can now be deselected. A chosen card becomes a stepper (remove one, count, add another) instead of a dead-ended disabled button.",
    ],
  },
  {
    version: "0.7.7",
    date: "2026-07-08",
    title: "Full unit stats in the roster, any credits limit allowed",
    items: [
      "Each roster unit now shows its full stat line and weapons right in the row, so you can read a unit without opening it.",
      "Any credits limit is accepted without a warning; the non-standard-limit flag has been removed.",
    ],
  },
  {
    version: "0.7.6",
    date: "2026-07-08",
    title: "Colour your vector marks, fuller faction stats, tidier mobile nav",
    items: [
      "Vector (SVG) emblems can now be tinted: pick a mark and choose ink, blue, or red, or keep the original.",
      "The faction detail panel shows every ship's full stat line (mass, thrust, silhouette, shields), not just weapons and cost.",
      "On phones the top navigation is a two-column button grid instead of a strip that ran off the edge.",
    ],
  },
  {
    version: "0.7.5",
    date: "2026-07-08",
    title: "Print setup: cards, trackers, and text export",
    items: [
      "Print setup now offers two layouts: the compact roster sheet, or one stat card per unit to cut out and keep at the table.",
      "Turn on Trackers to print hull-damage boxes for every ship (a ship's silhouette is its hull), plus a command-token and balance strip.",
      "Copy as text puts the whole fleet on your clipboard as Markdown, ready to paste into Discord or a forum.",
    ],
  },
  {
    version: "0.7.4",
    date: "2026-07-08",
    title: "See a faction before you pick it",
    items: [
      "The new-fleet dialog now shows a detail panel on the right: choose a faction and its rule, every ship with weapons and cost, and its personnel appear at a glance.",
      "Covenant: the SDV-class heavy corvette is now the Ceudar-pattern Heavy Corvette.",
    ],
  },
  {
    version: "0.7.3",
    date: "2026-07-08",
    title: "Simpler emblem picker, Covenant revisions, punchier buttons",
    items: [
      "The emblem picker is now a single grid of every mark on a grey field, sorted by name. The old basic marks are gone, and the insignia set keeps its colour.",
      "The fleets page button reads Assemble new fleet, and the new-fleet dialog finishes with a GET BUILDING launch button.",
      "The print button is now labelled Print setup.",
      "Covenant test faction: reworked Energy Shielding, renamed personnel (San'Shyuum Precentor, Sangheili Shipmaster, Kig-Yar Shipmaster), a new last-stand rule for the Jiralhanae Chieftain, and the Spirit is now a Phantom.",
    ],
  },
  {
    version: "0.7.2",
    date: "2026-07-08",
    title: "Duplicate personnel, quicker roster edits, era-first factions",
    items: [
      "You may now take the same High-Value Personnel more than once; the uniqueness restriction has been removed.",
      "The personnel count reads as a simple number, such as 1/3.",
      "In the roster, when a unit is down to a single ship the minus button removes the whole unit, turning red on hover to warn you first.",
      "The new-fleet faction list shows only your era's factions; the More button (now labelled other eras and custom) reveals everything else, with your custom factions last.",
      "Every new Hypergrowth fleet starts with a random emblem from the whole library.",
    ],
  },
  {
    version: "0.7.1",
    date: "2026-07-08",
    title: "Now A Billion Suns 2e Shipyard",
    items: [
      "Renamed to A Billion Suns 2e Shipyard, and the site moved to type37.github.io/a-billion-suns-shipyard.",
    ],
  },
  {
    version: "0.7.0",
    date: "2026-07-08",
    title: "Far less scrolling, notes, bigger monochrome emblems",
    items: [
      "A much shorter builder: compact catalogue rows, an inline faction summary, and a collapsible personnel list mean a whole fleet fits with little scrolling.",
      "Every fleet now has a Notes field for tactics and reminders, saved with the fleet and printed on the roster.",
      "Emblems are bigger throughout and render in black and white, so the whole set reads as one monochrome family.",
      "Removed the emblem hover animation on the faction picker.",
      "Catalogue rows are separated by a single hairline instead of full boxes, cutting visual clutter.",
      "Removed the affiliation disclaimer from the printed roster.",
    ],
  },
  {
    version: "0.6.3",
    date: "2026-07-08",
    title: "Emblem picker out of the way, tighter builder",
    items: [
      "The emblem picker is now a single button showing your current mark; the full set of marks, the library, upload, and random open in a popover instead of filling a row in the setup bar.",
      "Tightened the setup bar and faction summary so the builder takes less vertical space and needs less scrolling.",
    ],
  },
  {
    version: "0.6.2",
    date: "2026-07-08",
    title: "A pack of new vector emblems",
    items: [
      "Twenty-six new vector emblems in a Fleet Marks set at the top of the emblem picker: atoms, a chess knight, a ship's wheel, crossed swords, a chemical hazard, news marks, and more, several rotated or flipped to taste.",
      "Emblem thumbnails now fill their tile evenly, so small vector marks read at the same size as the rest.",
      "Emblem categories show readable names instead of raw folder names.",
    ],
  },
  {
    version: "0.6.1",
    date: "2026-07-08",
    title: "Add ships inline, redrawn emblems",
    items: [
      "Change a unit's ship count right on the roster with inline plus and minus, and remove a unit in one click, without opening it first.",
      "Redrawn the default emblem set into ten cleaner marks: a spearhead, a four-point star, wings, an atom, a ringed planet, a hex core, a sunburst, a bolt, a crosshair, and the delta.",
      "A tighter builder throughout, so more fits on screen with less scrolling.",
      "The home screen's fourth entry is now Learn to Play, launching a guided tutorial battle instead of the new-fleet dialog.",
    ],
  },
  {
    version: "0.6.0",
    date: "2026-07-08",
    title: "Roster on the left, a cleaner faction picker",
    items: [
      "The builder now keeps your roster pinned on the left where it is always visible, with the ship catalogue on the right. The roster scrolls inside itself instead of dragging the page along.",
      "Faction picker: hovering a faction fades its emblem in behind the card, and the More button widens the window into sorted columns covering every faction in the game, your custom ones last.",
      "Credits limit now offers 300, 400, 500, or any custom value.",
      "Free Play has been removed; it was never a game mode.",
      "Initiative shows a die for each die in the pool, and the faction summary boxes are sized to their numbers instead of stretching across the panel.",
      "Tidied the emblem library, dropping a batch of stray non-emblem images.",
    ],
  },
  {
    version: "0.5.0",
    date: "2026-07-07",
    title: "Sharper type, a sortable compendium",
    items: [
      "The wordmark now leans with the official Second Edition logotype, and its A is the leaning delta from the cover.",
      "The Ship Compendium sorts by clicking any column heading, each shown with both its icon and its name. The old sort menu is gone; click Faction to fold the list back into faction groups.",
      "A faction's Initiative and per-round Command tokens now read as two large figures at the top of its rule card, instead of a small line of text.",
      "One typeface family retired: the interface is now Archivo, Libre Franklin, and Source Serif 4 throughout, with the monospace dropped.",
      "A single-line credits footer matched to the other WarLore builders.",
    ],
  },
  {
    version: "0.4.0",
    date: "2026-07-03",
    title: "Basic Training and the table companion",
    items: [
      "Basic Training: the two tutorial scenarios from the rulebook are now loadable lists. Combat Simulator arrives with the full Training Fleet (seven units) and three Seasoned Captains aboard; Management Training arrives with the six-unit Shipyard version and no personnel, exactly as the book sets them up.",
      "Guided tutorials: training lists show a step-by-step walkthrough above the builder covering setup, squadron carrying, special rules, scoring, and game end, written from the Basic Training chapter.",
      "Play mode: every fleet list now has a table companion. A phase track for the round (Command, Jump, Tactical, End) with the full rule for each phase, counters for round, CMD tokens, and both players' scores, an initiative-check roller that rolls your faction's dice and counts successes, and End Phase scoring reminders for each game mode.",
      "The Ship Compendium: every ship in the game in one sortable table, with filters for era, faction, and mass and a live name search.",
      "Ship stats across the app now read as labelled chips with icons for Mass, Thrust, Silhouette, and Shields.",
      "A full mobile pass: the whole app now works at phone widths, with no horizontal scrolling.",
    ],
  },
  {
    version: "0.3.0",
    date: "2026-07-03",
    title: "The Shipyard and the ruins of Jura",
    items: [
      "Renamed to A Billion Suns Shipyard.",
      "Solo play: the complete Junkspace mode. Build an outfit of up to five ships within thirty thousand, each with a pilot class, then run the roller for the automated enemy and track the debt campaign across eight games, with pilot perks for survivors.",
      "The builder controls now sit together in one labelled row: credits limit, faction, and emblem.",
      "Upload your own emblem image for any fleet, outfit, or custom faction.",
    ],
  },
  {
    version: "0.2.0",
    date: "2026-07-02",
    title: "The full register",
    items: [
      "Complete redesign in the International Typographic Style: white ground, the two NASA insignia colours (blue and rocket red), Libre Franklin for the interface and Georgia for long rules text. Libre Franklin is an open revival of Morris Fuller Benton's Franklin Gothic, the American institutional grotesque of the space age; Georgia is Matthew Carter's serif, drawn for on-screen readability.",
      "New home port: every fleet you build is saved in this browser automatically and listed there, with duplicate, share, and delete controls.",
      "The builder now shows the ship catalogue on the left and your living roster on the right, always visible while you work.",
      "Everything can be renamed: the fleet, each unit, each individual ship, and each member of your High-Value Personnel.",
      "Every fleet gets an emblem, chosen from a set of geometric marks, and every unit carries a hull silhouette matched to its Mass class.",
      "Free Play mode unlocks everything: mix ships from any faction, set any credits limit, and build outside the rules checks entirely.",
      "The Faction Foundry lets you create your own factions: name, era, faction rule, full ship classes with weapons, and High-Value Personnel.",
      "Share links now carry names, emblems, and custom factions, so the person opening your link sees exactly what you built.",
      "A dedicated print document, designed from the conventions of the best printed army lists: full rules text on the sheet so the rulebook can stay closed, black on white with hairline tables, unit blocks that never split across pages, and a four-round score grid matched to the game's fixed length.",
      "All twelve factions from the Second Edition rulebook are included as their data passes verification, together with the rule that any faction may be fielded in any era.",
    ],
  },
  {
    version: "0.1.0",
    date: "2026-07-01",
    title: "First light",
    items: [
      "Armageddon era fleet building with the four factions of the Unhuman War: The Vyke, AEGIS, Gen Omega, and The Alliance of Non-Human Worlds.",
      "The full Armageddon validation engine: credits limits, unit sizes, the Mass 3 single-ship rule, Alliance species declarations, and High-Value Personnel selection and assignment.",
      "Share links and a first printable roster.",
    ],
  },
];
