// In-app changelog. Newest first. Full sentences, no shorthand.

export interface ChangelogEntry {
  version: string;
  date: string;
  title: string;
  items: string[];
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: "0.8.47",
    date: "2026-07-18",
    title: "Solo mode stops looking squashed",
    items: [
      "The solo workspace had its columns the wrong way round: the outfit list, which holds at most five ships, was taking the wide side while the ship picker was crushed into a narrow one. The picker was so tight that the ADD button ran into the damage column and the header note got cut off. Both columns are now split the same way as the fleet builder, and the picker has room to breathe.",
      "Ships in your outfit now show their weapons in exactly the same table as the picker beside them, instead of a different text layout, so a ship reads the same whether you're choosing it or you already own it.",
      "Weapon tables now fold themselves neatly whenever their column is narrow, whatever the window size, so nothing can overlap or spill again.",
    ],
  },
  {
    version: "0.8.46",
    date: "2026-07-18",
    title: "Preview shows collapsed sections expanded, like the printer will",
    items: [
      "Anything that prints expanded now shows expanded in the preview too, so the page count can't under-report by hiding folded-away content.",
    ],
  },
  {
    version: "0.8.45",
    date: "2026-07-18",
    title: "Print setup finally shows you the actual pages",
    items: [
      "The preview is now laid out at the real printable width of the paper, with a dashed line and a label everywhere the page will actually break. What you see is what comes out of the printer.",
      "It tells you the page count next to the Print button, and every option updates it straight away — turn the rules off and watch it drop from two pages to one, so you can see what a choice costs in paper before you commit.",
      "Choose Letter or A4, and the whole preview relays out to match.",
      "Ink saver, on by default: no coloured fills or bars, so the sheet looks the same whether or not your browser prints backgrounds, and it uses far less toner.",
      "Leave individual units out of a printout with the small cross beside each one, without touching the fleet itself. A note tells you what's held back and puts it all back in one click.",
      "Your print setup is remembered, so reprinting after an edit is one click.",
    ],
  },
  {
    version: "0.8.44",
    date: "2026-07-18",
    title: "A damage mark of its own",
    items: [
      "Damage now has its own symbol, a hull struck side-on, in a hot red that's deliberately not the same red as an over-budget warning. It marks the damage column on every weapon table.",
    ],
  },
  {
    version: "0.8.43",
    date: "2026-07-18",
    title: "The printed sheet tells you if the list is legal",
    items: [
      "The print header now shows the unit count and whether the fleet is legal, so the sheet you hand across the table is also the proof it checks out. It follows the mode: an Armageddon list without its HVP reads \"to resolve\", while a Hypergrowth Shipyard that doesn't take HVP reads \"Legal\".",
    ],
  },
  {
    version: "0.8.42",
    date: "2026-07-18",
    title: "Cleaner page breaks when you actually print",
    items: [
      "On paper, an action or command is never split from its own rules text across a page break, and a section heading is never left stranded at the bottom of a page.",
    ],
  },
  {
    version: "0.8.41",
    date: "2026-07-18",
    title: "Nothing scrolls sideways on a phone any more",
    items: [
      "Fixed pages sliding left and right on a narrow screen. The print sheet and the solo tab bar were stretching the whole page instead of scrolling on their own, so the print roster, the score table, and the outfit tabs now stay put and scroll within themselves. Checked every page at phone width.",
      "Solo roster ships show their stats and weapons on their own full-width lines instead of being squashed into a column.",
    ],
  },
  {
    version: "0.8.40",
    date: "2026-07-18",
    title: "Play Mode shows the commands you can use right now",
    items: [
      "Play Mode now lists the commands you can actually spend CMD tokens on in the phase you're in, with the cost and the full effect text, so you never go hunting through the rulebook mid-turn. Commands you can't currently afford are dimmed, and the Jump Phase only offers Requisition in the Shipyard modes where it exists.",
    ],
  },
  {
    version: "0.8.39",
    date: "2026-07-18",
    title: "Bigger emblems everywhere, and a tidy-up under the hood",
    items: [
      "Emblems are bigger across the app now, not just in the builder header: fleet cards, the print sheet, solo outfit cards, and the outfit roster all show a larger mark.",
      "Cleared out the code left behind by the picker rework: the old inline emblem pickers and their styles are gone, which trims the stylesheet and keeps the app quick to load.",
    ],
  },
  {
    version: "0.8.38",
    date: "2026-07-18",
    title: "The sigil picker sorts and searches properly",
    items: [
      "Search the sigil library by name, and the folders now read A to Z with a count on each, with the loose-files General bucket last where it belongs.",
      "Sigil names are cleaned up: the boilerplate in the source filenames is stripped and run-together names are split into words, so a sigil is listed as \"Arcus Tigers\" rather than \"HINF Emblem icon Arcus Tigers\". Searching actually finds things now.",
    ],
  },
  {
    version: "0.8.37",
    date: "2026-07-18",
    title: "Solo catalogue matches the fleet builder, and the emblem picker grows up",
    items: [
      "The solo Stock Ship Classes catalogue now looks and behaves exactly like the fleet builder's: click the whole row to add, compact stat chips, and the same aligned PRI/AUX weapons table.",
      "The emblem library is now organised into folders you can filter by, and the sigil tiles sit on a faint checkerboard so all-white marks are visible while you browse. The mouseover labels are gone.",
      "New emblem customisation for fleets, custom factions, and solo outfits alike: pick a background colour behind any sigil (great for all-white marks) and, for vector marks, a tint colour — all from the Colour tab.",
      "The emblem in the builder header is bigger.",
    ],
  },
  {
    version: "0.8.36",
    date: "2026-07-18",
    title: "Hypergrowth is 300 or Unlimited, and solo ships show their stats",
    items: [
      "Hypergrowth's credits are now just what they should be: a 300bn cap or Unlimited Shipyards, with no 400/500 or custom amount cluttering it — in both the New Fleet card and the builder.",
      "Every ship in a solo outfit now shows its full stats (Mass, Thrust, Silhouette, Shields) and both weapon lines right in the roster, so you can see what each pick does without leaving the page.",
    ],
  },
  {
    version: "0.8.35",
    date: "2026-07-18",
    title: "Unlimited Shipyards, matching builder controls, and Age of Unity HVP on print",
    items: [
      "Hypergrowth now has an Unlimited Shipyards switch (off by default) in the credits popover: turn it on and the 300bn cap comes off entirely — the tally reads ∞ and nothing counts as over budget.",
      "The builder's credits control now matches the New Fleet card: the same preset buttons and the same click-to-open Custom field.",
      "Age of Unity prints for its deferred HVP: every ship gets an HVP write-in slot, and the sheet lists every High-Value Personnel available to the faction with a line to note who carries each once your missions are generated.",
    ],
  },
  {
    version: "0.8.34",
    date: "2026-07-18",
    title: "One emblem picker everywhere: a Choose-emblem dialog with tabs",
    items: [
      "The emblem picker is now the same everywhere — the fleet builder, Custom Rules, and solo outfits all use a single \"Choose emblem\" button that opens one dialog. It has Library, Upload, and (for fleets) Colour tabs, with the full icon library given real room to browse instead of a cramped popover. Pick an icon and the dialog stays open so you can keep trying; Done closes it.",
    ],
  },
  {
    version: "0.8.33",
    date: "2026-07-17",
    title: "Shorter share links and a solo menu that shows your campaign",
    items: [
      "Share links are now compressed, so they're much shorter — especially fleets that carry a custom faction. Old links still work.",
      "The Solo landing page now shows each outfit as a card with a debt progress bar and how many games you have left to clear it, so you can see where every campaign stands at a glance.",
    ],
  },
  {
    version: "0.8.32",
    date: "2026-07-17",
    title: "A print sheet that replaces the rulebook, and a clearer solo builder",
    items: [
      "Print mode is tighter and printer-friendly: the section headings are no longer solid dark bars that drink toner, spacing is much denser, and it now prints an Actions & Commands reference — every action and every command with its CMD cost and full effect text, taken verbatim from the Quick Reference. Requisition only shows in the Shipyard modes. Your faction rule and carried HVP still print in full, since that's where extra commands come from.",
      "Solo pilot-class picker is now a compact chip for each class, and it shows the selected class's actual ability (Hot Shot, Tough, Smartass) right below, so you know what it does.",
      "Custom Rules factions now have a proper Duplicate button (makes an editable copy in the app) alongside Copy and Download.",
      "Uploading a ship image is now an obvious click-to-upload tile instead of a tiny button.",
    ],
  },
  {
    version: "0.8.31",
    date: "2026-07-17",
    title: "Learn to Play is a real guided walkthrough now",
    items: [
      "Learn to Play from the home menu now opens a five-step walkthrough instead of dropping you in the builder. It sets the scene (it's a two-player game), hands you the ready-made Training Fleet with its stats, walks the four-round structure with a looping move-then-shoot animation, shows the table and how you score, then loads the fleet straight into Play Mode.",
    ],
  },
  {
    version: "0.8.30",
    date: "2026-07-17",
    title: "Per-mode HVP, a reworked emblem picker, and a tighter builder header",
    items: [
      "HVP now follows the mode. Hypergrowth is a Shipyard and shows no HVP at build. Age of Unity treats HVP as optional at build and tells you they're assigned after the missions are generated. Only Armageddon still requires them chosen up front. No more spurious 'must select HVP' error on the modes that defer them.",
      "The emblem picker is reworked everywhere it's used (Custom Rules, solo outfits): a large preview beside clearly labelled Upload, Library, Random, and Remove actions. The library now opens in a panel you can close with an X.",
      "The builder header is a single line now: name, faction, era badge, and budget all on one row, and the whole builder is no longer stretched too wide.",
      "Custom Rules can start from a template you rename and edit: an Enemy Pirate Fleet or a Solo Fleet.",
      "Removed the 'Smaller game / Larger game' toast when changing the credits limit.",
    ],
  },
  {
    version: "0.8.29",
    date: "2026-07-17",
    title: "Steadier Armageddon slam, tighter red underline",
    items: [
      "The Armageddon title slam no longer shakes the screen on a long faction name like the Alliance of Non-Human Worlds. The scale-in is centred and bounded, and the panel clips so the animation can never spill out and toggle a scrollbar.",
      "Raised the red underline on the faction title so it sits right under the name instead of floating low beneath it.",
      "New Solo Play blurb on the home menu: \"Solitaire narrative campaign. Now with Debt!\"",
    ],
  },
  {
    version: "0.8.28",
    date: "2026-07-17",
    title: "A clearer builder header, labelled weapon arcs, and a tidier footer",
    items: [
      "The builder header is tighter and reads on fewer lines: the era you're building for is now a bold badge up top so it's unmistakable, and the big credits figure sits out to the right instead of leaving a wide empty gap.",
      "Weapon tables now label each arc PRI or AUX in words alongside the arc icon, and the table only takes the width it needs rather than stretching the figures far from the weapon name.",
      "The fleet Actions menu on the builder is now a proper labelled button, not a bare set of dots.",
      "The top navigation now matches the home menu in order, and adds a Learn to Play entry. Cleaner Options icon.",
      "The Junkspace intro reads as flavor text now: serif, with a red rule down the side. The footer drops its dot separators for plain spacing.",
    ],
  },
  {
    version: "0.8.27",
    date: "2026-07-17",
    title: "The command tokens draw themselves in again, and the Armageddon slam is back",
    items: [
      "Command tokens on the New Fleet card draw themselves in and swell to full, one after another, the way they used to. They still show one triangle per token so the count reads at a glance.",
      "Armageddon titles get their original slam back: the name lands big from above, overshoots, and jolts once on impact before settling. It was more fun to watch than the quieter thump, so it's back.",
      "On the New Fleet card, Credits limit \"Custom\" is now just a word until you click it. Click it and it opens into a field to type your own cap.",
      "The builder now offers both ways to finish at the foot of your fleet: Enter Play Mode and Print setup sit together as a pair. Print used to be tucked away in the overflow menu.",
    ],
  },
  {
    version: "0.8.26",
    date: "2026-07-17",
    title: "Two-column builder: your fleet on the left, the catalogue on the right",
    items: [
      "The builder is back to a straightforward two-column layout. Your fleet sits on the left and follows you down the page; the full ship-class catalogue is on the right. Click a ship on the right and it drops into your fleet on the left, where you set its count and carried personnel.",
    ],
  },
  {
    version: "0.8.25",
    date: "2026-07-17",
    title: "A properly centred Mass symbol, distinct era buttons, tighter slam",
    items: [
      "The circled Mass symbol in rules text is now drawn as an SVG with the M centred exactly, instead of a bordered text box that could never line the letter up reliably.",
      "The era chooser in New Fleet is now three separate buttons that each name what you build with it (a Shipyard for Hypergrowth, a Fleet List for Age of Unity and Armageddon).",
      "The Armageddon title's red underline now draws in the instant the name lands, rather than after the whole bounce settles.",
    ],
  },
  {
    version: "0.8.24",
    date: "2026-07-17",
    title: "Layout fix, tidier compendium controls, and small faction-panel touches",
    items: [
      "Fixed a layout regression from the footer change: the main content had gone narrow and centred and the fleet cards stacked into a single column. The page is full width again and the cards tile properly.",
      "In the Ship Compendium, the Sort by faction and Show custom ships toggles now sit in the same bar as the search and dropdowns, in a conventional order, with the result count on its own line beneath.",
      "Choosing a credits limit now shows a brief Smaller game or Larger game note.",
      "Machine-log faction slogans (AEGIS, Golem) now read as a terminal line: monospace, upright, with a blinking cursor.",
      "The command-tokens-per-round figure now shows that many triangle marks, mirroring the initiative dice, and the version and changelog link moved out of the footer into the Options dialog.",
    ],
  },
  {
    version: "0.8.23",
    date: "2026-07-17",
    title: "A real pilot-class picker, and ships that arrive with a flourish",
    items: [
      "In Solo, choosing a pilot is now a prominent three-way picker with the Gunner, Hauler, and Junker artwork instead of a plain dropdown, and the separate starting-perks reference box has been removed.",
      "Adding a ship to a fleet or a Solo outfit now plays a short entrance on just the new row, so the addition registers at a glance.",
    ],
  },
  {
    version: "0.8.22",
    date: "2026-07-17",
    title: "Dice on the value's line, and better title motion",
    items: [
      "In the faction panel, the Initiative dice and the command symbol now sit on the same line as their value (3D6 shown with three dice, the command total with its mark), and the glyphs pop in with a short stagger.",
      "Age of Unity titles now recede into place like the Star Wars logo, arriving huge and distant and settling as they fade up.",
      "Armageddon titles now thump straight down and squash on impact rather than shaking side to side, so only the text moves, not the whole panel.",
    ],
  },
  {
    version: "0.8.21",
    date: "2026-07-17",
    title: "Options menu with backups, and custom ships in the compendium",
    items: [
      "A new Options button in the top bar opens a dialog for your data: export a backup of every fleet, outfit, and custom faction to a file, import one back (to move between devices), or clear everything. It also gathers the about-and-links in one place.",
      "The Ship Compendium can now include your custom-faction ships with a Show custom ships checkbox, off by default, so the official ships stand alone until you ask for the rest.",
    ],
  },
  {
    version: "0.8.20",
    date: "2026-07-17",
    title: "Clearer custom-rules editor and a footer that sits at the bottom",
    items: [
      "In Custom Rules, each weapon now reads as two clear groups, the attack (number of dice times the die) and the range (minimum to maximum, in inches), with column labels above them and the die selector lined up with the other fields.",
      "The High-Value Personnel list in Custom Rules is now numbered.",
      "The circled Mass symbol used in rules text is larger, bolder, and sits better on the line.",
      "The footer now rests at the bottom of the page on short views instead of floating up beneath the content.",
    ],
  },
  {
    version: "0.8.19",
    date: "2026-07-17",
    title: "The faction title arrives in its era's own style",
    items: [
      "When you pick a faction in New Fleet, its name now plays a short entrance that matches the era. Hypergrowth names flicker through random glyphs and settle left to right; Age of Unity names wipe in from the left in blue; Armageddon names slam in oversized, shudder, and land, then a red underline draws in beneath them.",
      "This is a desktop flourish only, and it steps aside entirely if your system asks for reduced motion. The era tabs themselves stay instant, and the animation fires only when the title actually changes, not on every click.",
    ],
  },
  {
    version: "0.8.18",
    date: "2026-07-17",
    title: "Steadier faction panel, an obvious compendium toggle, and a calmer nav",
    items: [
      "In the New Fleet faction panel, the Initiative and Command figures now sit above the signature ability text, so both plates stay in exactly the same place as you click between factions instead of drifting with the length of each rule. The command symbol is blue to match the dice and lines up beside its number.",
      "The Ship Compendium gained a clear Sort by faction checkbox, on by default, in place of the hidden behaviour where clicking the Faction column heading quietly re-grouped the table.",
      "The highlight on the top-right navigation no longer slides in from nothing every time you click something; it just rests on the current section and only moves when you hover.",
      "The Junkspace page now uses the same heading as the rest of the app rather than its own large dark banner.",
    ],
  },
  {
    version: "0.8.17",
    date: "2026-07-17",
    title: "Faction panel shows just the slogan",
    items: [
      "The one-line playstyle summary was dropped from the New Fleet faction panel; the faction's slogan carries the flavour on its own. The Signature ability heading below it still holds its position as you click between factions.",
    ],
  },
  {
    version: "0.8.16",
    date: "2026-07-17",
    title: "New fleet button sits by the heading",
    items: [
      "The Assemble new fleet button now sits just to the right of the Fleets heading, rather than pushed out to the far edge of the page.",
    ],
  },
  {
    version: "0.8.15",
    date: "2026-07-17",
    title: "One builder list, fleets as cards, and a livelier New Fleet",
    items: [
      "The builder's Ship Classes and Roster are now a single list. The units you have added sit at the top with their steppers, the rest of the faction's classes follow under an Add ships heading, and the personnel pool moved to the bottom. No more jumping between a catalogue on the right and a roster on the left.",
      "Saved fleets are shown as cards rather than table rows, each rising into place with a short stagger. When you have none, the page says so plainly and notes that all fleets are saved to your browser's cache.",
      "Learn to Play no longer drops a Training Fleet into your saved list. The tutorial is its own thing now: you play it, but it is never saved and cannot be loaded again, and any training fleets left in storage from before are cleared out.",
      "Choosing a faction in New Fleet shows its slogan, a single sentence on how it plays, its signature ability, and two figures: Initiative, with a die drawn for each you roll, and Command tokens per round marked with the command symbol. The old Ship classes and Personnel counts were dropped, and the long rulebook descriptions were replaced with that one plain sentence.",
      "The faction panel keeps its shape as you click between factions. The Signature ability heading and the figures beneath it hold their position instead of jumping around, and the four era cards are all the same size whichever era you are browsing.",
      "The home page rows regained their old hover, a blue panel that sweeps in from the left behind the text with a red leading edge, and footer links gained an underline that wipes in from the left and slides off to the right.",
      "Two new emblems, Ishtar Commander and TrueCommand, joined the picker, and the button that reveals other eras and custom factions now reads More Fleets and Custom.",
    ],
  },
  {
    version: "0.8.14",
    date: "2026-07-17",
    title: "Usable without a mouse, and readable on a phone",
    items: [
      "The control you just used keeps the focus. Every click used to throw focus back to the top of the page, so anyone working by keyboard had to tab all the way in again after each step, add, or removal.",
      "Weapons are readable on a phone. The five aligned columns did not fit a narrow screen and squeezed the weapon's name down to about a centimetre; the row now breaks onto two lines instead, with the name on its own line and Attack, Range and Damage labelled underneath. The wide layout is unchanged.",
      "Actions like copying or duplicating a fleet are now announced to screen readers, the page title says which view you are on, Escape closes the New Fleet dialog and any open menu, and a Skip to main content link appears when you tab into the page.",
      "Errors and warnings say which they are and carry their own symbol, instead of relying on a red-or-amber colour difference that is invisible to many readers. Placeholder text, the over-budget figure, small labels on tinted panels, and the focus ring on the blue masthead were all too faint to meet contrast guidelines and have been darkened.",
      "The plus button at a unit's maximum size no longer drops out of the keyboard order; it stays reachable and now says which unit it belongs to and what the maximum is. All the steppers name their unit rather than each announcing an identical \"one more ship\".",
      "Animations are dropped when the system asks for reduced motion, instead of only the sliding masthead highlight.",
    ],
  },
  {
    version: "0.8.13",
    date: "2026-07-17",
    title: "The tutorial no longer opens broken",
    items: [
      "Combat Simulator arrives with the three Seasoned Captains the rulebook issues it (p.63), and the builder now says so: all three are listed, each with its own carrier, under a heading that reads \"Issued by the scenario\". Previously the fleet opened with two red errors complaining that Seasoned Captain was picked more than once, while the personnel list could only show one of them and offered no way to fix anything. Picking one of each remains the rule for fleets you build yourself.",
      "The Discord may take between three and five High-Value Personnel, as their Aces and Heroes rule allows. The builder always offered the choice; taking a fourth now stops reporting the fleet as illegal.",
      "The builder calls them High-Value Personnel, the rulebook's own term, rather than the \"Personnel pool\".",
    ],
  },
  {
    version: "0.8.12",
    date: "2026-07-17",
    title: "Panels you open stay open",
    items: [
      "Adding a ship no longer closes the Add ships catalog you added it from, so you can add several without reopening it each time. The same fix keeps the tutorial band, your fleet notes, and the Free Play faction sections in whatever state you left them, while menus and popovers still close behind you as before.",
    ],
  },
  {
    version: "0.8.11",
    date: "2026-07-17",
    title: "Denser on every screen, and a print sheet that stops repeating itself",
    items: [
      "Faction entries in the New Fleet dialog are now a single original sentence on how the faction plays, in place of the transcribed rulebook briefings.",
      "Print: the Steps sheet is now just the tutorial, with no personnel list or score table stapled to the back of it. An empty personnel section no longer prints a heading over the words \"None selected\", the score table has dropped its Command tokens row (command tokens are a per-round pool, not something the rules ask you to score), and a new Rules toggle sits beside Trackers for players who know their faction rule by heart.",
      "Print: ships you have named now appear on both the roster and the cards, the sheet is dated the day you print it rather than the day you last edited the fleet, and the cards use the mass glyph instead of spelling it out.",
      "Print: the faction rule bar, the personnel bar and the tactical diagrams now survive printing with background graphics turned off, weapon columns wrap instead of running off the edge of the page, and pressing Ctrl+P on the builder now opens every tutorial step instead of printing them collapsed.",
      "Phones: the navigation is one row instead of two, the home nameplate folds to a single line, and the Fleets and Compendium tables become stacked cards with every column still labelled and readable. Nothing is hidden or truncated to make room, and no text is left below 11px.",
      "Phones: the faction list in the New Fleet dialog no longer traps your scroll, the Print button sits at the top of the print controls where you can reach it, and long faction names stop pushing the era label off the screen.",
      "Builder: the tutorial band collapses to its title after your first session, the ship catalog folds away once your fleet has ships in it, and a legal fleet no longer spends a line telling you so. Section headings are tighter throughout.",
    ],
  },
  {
    version: "0.8.10",
    date: "2026-07-12",
    title: "Faction briefings, straight from the rulebook",
    items: [
      "Every faction now shows its full flavour text when you pick it in the New Fleet dialog: the epigraph, the in-universe briefing (set in italic serif), and Mike Hutchinson's note on the faction's strengths and intended playstyle. All transcribed verbatim from the rulebook's Factions chapter.",
    ],
  },
  {
    version: "0.8.9",
    date: "2026-07-11",
    title: "Quick Reference PDF corrected and expanded",
    items: [
      "Fixed Explosion Check: the trigger is the ship's Mass, not its Silhouette. The original third-party card had it wrong; the actual rulebook says Mass.",
      "Fixed Escort and Blockade: they were combined into one bullet with the criteria swapped. They are now two separate entries with the correct tie-break for each (Escort: most ships wins; Blockade: greatest Combined Mass wins).",
      "Added Mother's Wing to the reference card (radius is 2×Mass\"; can protect Objectives) — it was on the book's own QR page but missing from our card.",
      "Added Dangerous Space rule: movement that passes through or ends in Dangerous Space inflicts a Mass×D6 attack on the unit at the end of the movement step.",
      "Added Line of Sight rule: draw lines from the attacker to each ship in the target unit; if all lines pass through Obscuring terrain the target cannot be attacked.",
    ],
  },
  {
    version: "0.8.8",
    date: "2026-07-11",
    title: "Quick Reference is now a proper PDF",
    items: [
      "The Quick Reference is now a downloadable PDF — a single-sheet card in the app's NASA/Swiss house style, with every section (round structure, initiative, activations, actions, all seven commands, combat rules, and the rules-you-might-forget checklist) laid out in a clean two-column format. All text is verbatim from the rulebook. Open it from the footer link.",
      "The old in-app HTML reference page has been retired in favour of the PDF.",
    ],
  },
  {
    version: "0.8.7",
    date: "2026-07-11",
    title: "The tutorials now print the real rules, word for word",
    items: [
      "The Combat Simulator and Management Training guides are now the rulebook's own text, transcribed verbatim rather than summarised. Every section the book prints is here in full: setup, the Central Objective table, High-Value Personnel with the Seasoned Captain and Red Alert wording, the special rules, the victory-point breakdown, and the standing rules. Both the on-screen guide and the printable \"Steps\" sheet read from the same complete text.",
      "The printable \"Steps\" sheet now lays each section out as a proper numbered walkthrough with the setup diagram in place and sub-rules as bullet lists, so it reads like a page from the book instead of a set of collapsed chips.",
      "Fixed the Mass symbol (the circled M used all through the rules) rendering as a stray \"@\" in faction rules, personnel rules, and the tutorials. It now draws as a real circled M everywhere, on screen and in print.",
    ],
  },
  {
    version: "0.8.6",
    date: "2026-07-11",
    title: "Printable reference, sharper rosters, and an accuracy pass",
    items: [
      "A new Quick Reference page (linked in the footer) prints the whole round structure, actions, commands, and rules-you-might-forget on one sheet, taken word for word from the rulebook. It replaces the old link to the separate PDF.",
      "The roster printout dropped its line-number column and now shows each ship's own cost alongside the stack total. Turn on Trackers to add a per-ship hull-damage box row.",
      "Shipyard modes (Hypergrowth, Management Training) now print as an actual Shipyard: a catalog of what you can requisition, with a tick box per ship to check off as it jumps into play, rather than a fixed pre-built roster.",
      "The two tutorials (Combat Simulator, Management Training) gained a \"Steps\" print layout: the full how-to-play walkthrough in plain numbered steps, for reading at the table.",
      "The Ship Compendium and each Custom Rules faction now have a \"Build a fleet with this faction\" shortcut straight into the new-fleet flow.",
      "Fixed the Combat Simulator setup diagram: the flank Jump Points are 5\" in from your own edge and the central point is 15\" in, which the previous diagram had the wrong way round.",
      "Corrected the Junkspace Gunship and Light Freighter, whose stats were entered swapped. The Light Freighter is the faster twin-Blaster hull; the Gunship is the slower Laser Cannon one.",
      "The faction rule on the Play Mode screen is no longer clipped to three lines, so long rules read in full during a game.",
      "The ship and personnel \"Add\" tiles are now reachable and operable by keyboard, and every control shows a clear focus outline when tabbed to.",
    ],
  },
  {
    version: "0.8.5",
    date: "2026-07-10",
    title: "Quieter hierarchy, real weapon columns, a status that fits",
    items: [
      "The weapons list was rebuilt as CSS grid instead of an HTML table, which was stretching short columns apart into huge, uneven gaps. Attack, range and damage are now tight and aligned under their own header, in both the catalog and the roster.",
      "Cut most of the black rules that made the builder feel busy: section labels (Roster, Ship classes, Personnel pool) are now quiet small-caps eyebrows instead of bold underlined headings, and the many 2px black dividers are gone except the one under the masthead.",
      "The legality status moved out of the roster and into a single small line next to the ship-buying section: a quiet checkmark when the fleet is legal, or a tiny count that opens a popover with the actual issues when it isn't.",
      "The experimental \"By mass\" ship-classes view is gone - it broke badly in narrower layouts (the Add control overlapped the weapon list). List and Compare remain.",
      "Adding a unit now shows a toast confirming what was added.",
      "The roster panel's own scroll position now survives every re-render instead of snapping back to the top - a subtler version of the same jump bug as the catalog fix.",
    ],
  },
  {
    version: "0.8.4",
    date: "2026-07-10",
    title: "Adding a unit no longer makes the screen jump",
    items: [
      "Tapping Add on a ship used to shove the whole catalog around. Now it doesn't move anything: the owned count is a small badge on the ship's icon (no reflow), and on phones the ship list sits above your roster, so adding to the roster grows it below your finger instead of pushing the list up.",
      "Weapons are now a proper table everywhere - one row per weapon system with its firing arc, attack dice, range and damage in aligned columns - instead of a run-on comma string.",
      "Enter Play Mode is now a full-width button at the very bottom of the whole builder, below both columns.",
      "Faction summaries are explicitly non-italic.",
    ],
  },
  {
    version: "0.8.3",
    date: "2026-07-10",
    title: "Small wording fix",
    items: ["The builder's unit list is now headed \"Roster\" instead of \"Fleet manifest\"."],
  },
  {
    version: "0.8.2",
    date: "2026-07-10",
    title: "The builder works on a phone now",
    items: [
      "Mobile builder rebuilt: each unit in the manifest now stacks into a legible card (name, then stats and weapons on their own lines, then a controls row with the ship-count stepper and cost), instead of five kinds of data crushed into one unreadable line. Nothing is clipped and there is no more sideways scrolling.",
      "Carried personnel are tappable everywhere they appear on a unit: tap a name like \"Seasoned Captain\" to see exactly what they do, in a popover that shifts nothing.",
      "The fleet header is reorganised: the budget sits on its own line under the name so the big figure never gets clipped, and a single dots (More) menu now holds Print, Share link, Duplicate, and Delete.",
      "Play Mode is now a full-width call-to-action at the foot of the manifest - the clear next step - with Notes tucked below it.",
      "The New Fleet dialog's faction preview is now just the summary and signature ability, not a full ship-and-personnel dump. The era switcher fits and slides cleanly on a phone.",
      "Faction pickers are grouped by era (Hypergrowth, Age of Unity, Armageddon) with custom factions gathered at the bottom, and every faction box is now the same size, so long names like The Alliance of Non-Human Worlds no longer blow out the grid.",
    ],
  },
  {
    version: "0.8.1",
    date: "2026-07-10",
    title: "Unit and personnel modals are gone",
    items: [
      "Units are auto-numbered instead of labelled \"Ship Name unit\": the first Warcry Fighter Wing you add is \"Warcry Fighter Wing\", the second is \"Warcry Fighter Wing 2\", and so on. Click straight into the name to override it - no modal, no duplicated name line.",
      "The unit configuration modal is gone. Ship count, species (Alliance only), carried-personnel count, and remove are all inline on the roster row now.",
      "The personnel config popover is gone too: assigning who carries a chosen HVP is a plain dropdown right on its row. Renaming an HVP is off the table for now.",
      "The faction picker in the manifest header now matches the dotted-underline style of the fleet name and credits cap, instead of a bold underlined button.",
    ],
  },
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
