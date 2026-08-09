import type { Faction, FactionRule, Hvp, ShipClass } from "../src/types.ts";
import { AEGIS } from "../src/data/factions/aegis.ts";
import { THE_ORDINATE } from "../src/data/factions/the-ordinate.ts";
import { GEN_OMEGA } from "../src/data/factions/gen-omega.ts";
import { w } from "../src/data/_helpers.ts";

/**
 * The three worked-example custom factions, offered from the fifth visit on
 * (see foundryListView in render.ts and the "load-example-factions" action).
 *
 * They are not seeded. Nothing arrives in anyone's browser unasked - the app
 * asks "want to see some examples?" and only writes them if the answer is
 * yes. Once loaded they are ordinary custom factions the user owns: editable,
 * renameable, deletable, and gone for good when deleted.
 *
 * WHAT THEY ARE, AND WHY THEY LOOK LIKE THIS
 *
 * Every one is a RESKIN of a published faction, exactly as worked out in
 * CUSTOM-FACTIONS.md: same stats, same dice, same ranges, same costs, same
 * rules, different names. That document is the spec for this file, and the
 * point it argues is the point these examples exist to demonstrate - the
 * easiest way to get a faction that plays well is to take one the book has
 * already balanced and rename it. The Foundry page says as much in its own
 * standfirst; this is that advice, done, three times.
 *
 * The predecessor is the reason. `cf-covenant` (removed in 52c1f03) was hand-
 * built stat by stat and drifted into a handful of oversized hulls with no
 * real Mass curve, because every number was chosen to feel right on its own
 * rather than to sit in a spread. Inheriting a roster makes that failure
 * impossible.
 *
 * So the reskins are BUILT by copying from the base faction's data file at
 * module load rather than by transcribing thirty stat lines into this file by
 * hand. A transcription can drift from its source silently; a copy cannot.
 * When 37cd7da corrected five factions' data against the rulebook, an example
 * built this way would have picked the corrections up for free.
 *
 * The one exception is the Covenant's Gigas-class Bomber Wing, which is new
 * (the Ordinate has no bomber). It is flagged as the single unbalanced stat
 * block in CUSTOM-FACTIONS.md, which is the only place that caveat lives now.
 */

/** Stable ids, so "already loaded?" is a set membership test rather than a
 *  name match, and so re-offering after a delete is possible. */
export const EXAMPLE_FACTION_IDS = ["cf-example-phr", "cf-example-covenant", "cf-example-unsc"] as const;

function slug(name: string): string {
  return name
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

interface ReskinSpec {
  id: string;
  name: string;
  /** Prefix for ship and personnel ids, keeping them unique across the catalog. */
  prefix: string;
  emblemLib?: string;
  playstyle?: string;
  /** Omit for no backstory at all - the base faction's is never inherited, or a
   *  reskin would carry a story about the faction it is no longer called. */
  backstory?: string;
  /** Replaces the base faction rule. Omit to keep the book's rule verbatim. */
  rule?: FactionRule;
  /**
   * Hulls, in the order they should appear: base ship id, then the new name.
   * Listing them out rather than passing a lookup makes the order explicit and
   * makes a base id that no longer exists a load-time error rather than a
   * quietly missing ship.
   */
  ships: [baseId: string, name: string][];
  /** Same, for personnel. */
  hvp: [baseId: string, name: string][];
  /** Stat blocks with no base to inherit from. Spliced in at `at`. */
  extraShips?: { at: number; ship: ShipClass }[];
}

function reskin(base: Faction, spec: ReskinSpec): Faction {
  const hull = ([baseId, name]: [string, string]): ShipClass => {
    const src = base.ships.find((s) => s.id === baseId);
    if (!src) throw new Error(`${spec.name}: ${base.name} has no ship "${baseId}"`);
    return { ...structuredClone(src), id: `${spec.prefix}-${slug(name)}`, name };
  };
  const person = ([baseId, name]: [string, string]): Hvp => {
    const src = base.hvp.find((h) => h.id === baseId);
    if (!src) throw new Error(`${spec.name}: ${base.name} has no personnel "${baseId}"`);
    return { ...structuredClone(src), id: `${spec.prefix}-${slug(name)}`, name };
  };

  const ships = spec.ships.map(hull);
  // Descending index, so each splice leaves the earlier positions valid.
  for (const extra of [...(spec.extraShips ?? [])].sort((a, b) => b.at - a.at)) {
    ships.splice(extra.at, 0, structuredClone(extra.ship));
  }

  return {
    ...structuredClone(base),
    id: spec.id,
    name: spec.name,
    rule: spec.rule ? { ...spec.rule } : structuredClone(base.rule),
    ships,
    hvp: spec.hvp.map(person),
    ...(spec.emblemLib ? { emblemLib: spec.emblemLib } : {}),
    ...(spec.playstyle ? { playstyle: spec.playstyle } : {}),
    backstory: spec.backstory,
  };
}

// --- Posthuman Republic = AEGIS ---------------------------------------------
// The rule is a capability propagating from one mind to everything near it,
// which is a networked posthuman intelligence written as a mechanic. Beyond
// that it is the tankiest roster in the game: three Mass 3 hulls, more than
// any other faction, carrying the highest capital shields anywhere.
const PHR: Faction = reskin(AEGIS, {
  id: "cf-example-phr",
  name: "Posthuman Republic",
  prefix: "phr",
  emblemLib: "military/posthuman-republic.webp",
  rule: {
    name: "Familiars",
    text: "When a unit in this fleet is within 6\" of a friendly unit carrying a friendly HVP (aka a 'Familiar'), it gains the benefit of that HVP, as if it were carrying it.",
  },
  playstyle:
    "The heaviest shields in the game on the most capital hulls. Keep the fleet inside 6\" of whoever carries a Familiar and the whole task force fights as though every ship had one.",
  backstory:
    "**A worked example.** This is AEGIS (Armageddon, rules p.164-165) with new names on everything. Every stat, die, range, cost and rule is the book's, so it is balanced against the twelve published factions by construction — only the names changed, and \"Protocol Shards\" became \"Familiars\".\n\nIt is here to be taken apart. Rename it, cut a hull, write your own rule text; nothing in it is precious. If you want your own faction, this is the cheapest way to get one that plays properly: start from a book faction whose *mechanics* fit your fiction, then change what it is called.",
  ships: [
    ["recon-drone", "Fighter Wing"],
    ["defence-drone", "Interceptor Wing"],
    ["assault-drone", "Bomber Wing"],
    ["repair-drone", "Cutter"],
    ["warden", "Medea-class Support Cruiser"],
    ["bastion", "Destroyer"],
    ["sentinel", "Cruiser"],
    ["citadel", "Battlecruiser"],
    ["imperator", "Battleship"],
  ],
  hvp: [
    ["anti-ordnance-protocols", "Sentry Familiar"],
    ["power-management-protocols", "Reactor Familiar"],
    ["repair-protocols", "Artificer Familiar"],
    ["security-protocols", "Warden Familiar"],
    ["snapfire-protocols", "Tactician Familiar"],
    ["threat-assessment-protocols", "Oracle Familiar"],
    ["vulnerability-analysis-protocols", "Vizier Familiar"],
  ],
});

// --- The Covenant = The Ordinate --------------------------------------------
// Highest initiative in the game at 5D6, plus a rule that lets you act before
// the enemy can react: superior technology expressed mechanically. The known
// compromise is range - see the backstory.
const COVENANT: Faction = reskin(THE_ORDINATE, {
  id: "cf-example-covenant",
  name: "The Covenant",
  prefix: "cov",
  // The Halo 1 symbol, not the "eye" glyph also in the library: it is the mark
  // that reads as Covenant at 46px, which is the size an emblem is actually
  // drawn at everywhere in the app.
  emblemLib: "nonhuman/Halo1_-_Covenant_Symbol.webp",
  playstyle:
    "Fastest to act in the game and brutal at close range, weaker at long. Get the first word in, then let passive fire punish anything that closes.",
  // No backstory. What stood here was four paragraphs of design notes - which
  // book faction this reskins, why the Attack Ship carries three pattern names,
  // that the Gigas Bomber Wing is unbalanced, and which trade was accepted on
  // range. That is the making-of, and it belongs in CUSTOM-FACTIONS.md (where
  // all of it still is), not in the field a player writes their own fiction in.
  ships: [
    ["light-fighter-wing", "Space Banshee Wing"],
    ["advanced-fighter-wing", "Seraph Wing"],
    ["epistle-class-gunship", "Attack Ship"],
    ["missionary-vessel", "Missionary Ship"],
    ["clerestory-class-monitor", "Au'zur Armored Frigate"],
    ["penance-class-escort-frigate", "Ceudar-pattern Heavy Corvette"],
    ["transept-class-strike-cruiser", "Sinaris-pattern Heavy Destroyer"],
    ["oracle-class-gun-carrier", "Ket-pattern Battlecruiser"],
    ["hierophant-cathedral-ship", "Varric-pattern Assault Carrier"],
  ],
  extraShips: [
    {
      // After the Seraph Wing, so the three wings read 5 / 10 / 16 in cost order.
      at: 2,
      ship: {
        id: "cov-gigas-class-bomber-wing",
        name: "Gigas-class Bomber Wing",
        mass: 0,
        thrust: 4,
        silhouette: 3,
        shields: 1,
        primary: [w("Ion Torpedoes", 2, "D8", 6, 12)],
        auxiliary: [w("Blasters", 2, "D6", 0, 6)],
        utilityBays: false,
        cost: 16,
      },
    },
  ],
  hvp: [
    ["arch-prelate-of-the-registrar", "San'Shyuum Prelate"],
    ["liturgical-archivist", "Huragok Shield Technician"],
    ["master-of-the-choir-computational", "Ministry of Tranquility Navigator"],
    ["quantum-seraph", "Sangheili Helmsmaster"],
    ["relic-keeper", "Reliquary Custodian"],
    ["technocratic-cabal", "Zealot Strike Commander"],
    ["the-blessed-lambda", "The Sacred Icon"],
  ],
});

// --- UNSC = Gen Ω -----------------------------------------------------------
// A fleet that hits harder the more damage it has taken is heroic sacrifice as
// a mechanic, and the personnel double down: two of them spend hull points to
// buy effect, and one turns your destruction into an explosion.
const UNSC: Faction = reskin(GEN_OMEGA, {
  id: "cf-example-unsc",
  name: "UNSC",
  prefix: "unsc",
  emblemLib: "military/UNSC_Navy_Logo.svg",
  playstyle:
    "Hits harder the worse it is going. Deliberately less top-heavy than the other two examples: one real capital, one cheap utility hull, and frigates doing the work.",
  backstory:
    "**A worked example.** This is Gen Ω (Armageddon, rules p.168-169) with new names on everything, so the numbers are the book's and stay balanced against the published factions. The faction rule keeps its printed name, \"Martyrs' Fury\".\n\n**On the roster.** Gen Ω fields only two Mass 3 hulls and one of them (here the Control Ship) is a cheap utility hull with no primary weapon at all. That makes this fleet noticeably less top-heavy than the Covenant or the Posthuman Republic, which is the trade for a rule that pays you for taking damage.\n\nThe personnel names are all invented and unreviewed — the least settled part of the example. Change any of them; that is what it is for.",
  ships: [
    ["warcry-fighter-wing", "Longsword Fighter Wing"],
    ["eidolon-yynnx-stealth-bomber", "Sabre Wing"],
    ["void-dancer-scout-marauder", "Gladius-class Corvette"],
    ["halo-class-transport", "Prowler"],
    ["werewolf-stealth-frigate", "Light Frigate"],
    ["ghost-hunter-assault-frigate", "Heavy Frigate"],
    ["torchbearer-heavy-destroyer", "Cruiser"],
    ["matryoshka-class-factory-ship", "Control Ship"],
    ["termina-class-colony-ship", "Carrier"],
  ],
  hvp: [
    ["eschatological-demagogue", "Overcharge Gunnery Chief"],
    ["ghost-hacker", "Prowler Corps Spook"],
    ["messianic-child", "Spartan-II Commando"],
    ["prophet-of-the-end-times", "Veteran Battlegroup Admiral"],
    ["righteous-saboteurs", "ODST Boarding Team"],
    ["the-nameless-punk", "Longsword Ace"],
    ["unhinged-live-streamer", "Chief of the Boat"],
  ],
});

export const EXAMPLE_FACTIONS: Faction[] = [PHR, COVENANT, UNSC];
