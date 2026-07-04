// In-app changelog. Newest first. Full sentences, no shorthand.

export interface ChangelogEntry {
  version: string;
  date: string;
  title: string;
  items: string[];
}

export const CHANGELOG: ChangelogEntry[] = [
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
