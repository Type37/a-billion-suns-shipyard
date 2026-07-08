// In-app changelog. Newest first. Full sentences, no shorthand.

export interface ChangelogEntry {
  version: string;
  date: string;
  title: string;
  items: string[];
}

export const CHANGELOG: ChangelogEntry[] = [
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
