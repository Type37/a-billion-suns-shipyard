# Name audit: AI-generated-sounding proper nouns

Six genuinely suspect names, all of them generated or invented by a previous
session of this project. Five sit in one file, `src/fleet-names.ts`. Everything
else that reads slop-ish traces back to the rulebook or to a deliberate
franchise homage.

## Suspects

| Name | File:line | Why it reads as slop | Source | Suggested replacement |
|---|---|---|---|---|
| Revelated | `src/fleet-names.ts:141` | Not an English word. A coined participle in the Ordinate's adjective bank, so the generator emits "5th Revelated Communion". Coining a past participle off an abstract noun is the exact Ashborn move. | Invented by a previous session | **Rubricated** — the Ordinate's whole vocabulary is liturgical-bureaucratic (Liturgical Archivist, Algorithmic Liturgy, Arch-Prelate of the Registrar), and a rubric is both a church instruction and a spreadsheet heading |
| Providence | `src/fleet-names.ts:141` | A noun sitting in an adjective slot: "7th Providence Communion" is not English. The word is also pure epic-register filler. | Invented by a previous session | **Providential**, or drop it for **Notarised** |
| Inevitable | `src/fleet-names.ts:141` | Literally in the requested slop family ("The Inevitable"). It carries no setting flavour: it would fit a fantasy game, a soulslike, or a card game unchanged. | Invented by a previous session | **Pre-Ordained** — the Ordinate's own printed tagline is "Our victory is pre-ordained" (p.154), so the faction already owns the idea in its own words |
| Eternal / Forever / Transcendental | `src/fleet-names.ts:98-99` | Three of AEGIS's ten adjectives are abstract grandeur, and "Eternal Wardens" is one letter from "Eternal Vigil". The file claims these are lifted wholesale from Endless Space 2's Riftborn, but nothing in the repo verifies that, and the other seven in the bank (Void, Null, Binary, Zero, Vacuum, Logical, Dark) are machine words while these three are not. | Invented by a previous session, or an unverifiable lift | **Persistent / Standing / Deterministic** — AEGIS names everything else after computing (all seven of its personnel are "... Protocols") |
| Questing | `src/fleet-names.ts:194` | The fallback bank every custom and homebrew faction gets. "1st Questing Fleet" is a D&D party, not a corporate battlegroup, and this is the one bank a user is most likely to see. | Invented by a previous session | **Chartered** — the neutral bank's other nine (Wandering, Roaming, Drifting, Errant, Nomad, Wayfaring) are fine and mean roughly the same thing without the sword |
| Vizier Familiar | `web/example-factions.ts:147` | The only one of the seven PHR Familiars named after a fantasy court role rather than a function. Artificer and Oracle are borderline for the same reason; Vizier has no mechanical or setting hook at all. Its base personnel is Vulnerability Analysis Protocols, which raises D10/D12 damage. | Invented by a previous session | **Ballistics Familiar** — names what it does, and matches Sentry / Reactor / Warden in the same list |

### Borderline, listed for honesty rather than as findings

`Tide of the Brood` (`src/data/premade-lists.ts:84`) is the Vyke starter fleet's
name. "Brood" is the book's own word (Brood-Mother, p.163), so it is not
detached from the setting, but "Tide of the ..." is the epic register the rest
of this audit is about. The generator already gives this faction "Horde" as its
fleet title, so `1st Crushing Horde` would be both in-tone and internally
consistent. The other two starter names are fine and are cleared below.

## Cleared

**From the rulebook.** Every faction name, ship class, personnel name, solo Job,
pilot perk and Aggressor in `src/data/**` was checked against text extracted
from `Documents/ABS 2E Layouts 7.pdf` with pypdf. The names that read most like
slop are all printed:

- Gen Ω: `Warcry Fighter Wing`, `Torchbearer Heavy Destroyer`, `Void Dancer
  Scout Marauder`, `Eidolon-Yynnx Stealth Bomber`, `Werewolf Stealth Frigate`,
  `Ghost Hunter Assault Frigate`, `Matryoshka-class Factory Ship`,
  `Termina-class Colony Ship`, plus `The Nameless Punk` and `Prophet of the End
  Times` (p.168-169). All found in the extracted text.
- Vyke: `Leviathan`, `King Crab`, `Snarefang`, `Latchweaver`, `Orbspinner`,
  `Needlespitter`, `Dragonfish`, `Viperfish`, `Needlefin`, and the personnel
  `Brood-Mother`, `Clade-Principle`, `Drone-Warden`, `Molt-Priest`,
  `Seer-Empath`, `Warrior-Architect`, `War-Singer` (p.162-163). All found.
- The Ordinate: `Hierophant Cathedral Ship`, `The Blessed Lambda`, `Quantum
  Seraph` (p.154-155). Golem: `Macroforge Supercruiser`, `Blackmill Refinery`.
  Alliance: `The Council of Heth-Memnah`, `Rannari`, `Yynnx`, `Gorgronti`.
  News Inc.: `Grand Arenaship`, `Miss Universe`. Megamart: `Titan Mallship`,
  `Star Cutter`. Galactic Credit: `Aureus`, `Denarius`, `Argenteus`, `Litra`,
  `Sovereign Battleship`. AEGIS: `Imperator`, `Citadel`, `Sentinel`, `Bastion`,
  `Warden`. Heavy Industries: `Andromeda`. All found.

The faction data files also carry their own page citations in comments, and
those citations check out against the book's table of contents.

**From a deliberate franchise reskin.** `web/example-factions.ts` builds three
opt-in worked examples by copying a book faction's stats and renaming them, as
specified in `CUSTOM-FACTIONS.md`. The names are Halo and Dropfleet Commander:

- Covenant: `Au'zur Armored Frigate`, `Ceudar-pattern Heavy Corvette`,
  `Sinaris-pattern Heavy Destroyer`, `Ket-pattern Battlecruiser`,
  `Varric-pattern Assault Carrier`, `Gigas-class Bomber Wing`, `Seraph Wing`,
  `Space Banshee Wing`, and the personnel `San'Shyuum Prelate`, `Huragok Shield
  Technician`, `Ministry of Tranquility Navigator`, `Sangheili Helmsmaster`,
  `The Sacred Icon`. All Halo.
- UNSC: `Longsword`, `Sabre`, `Gladius-class Corvette`, `Prowler`, `Spartan-II
  Commando`, `ODST Boarding Team`. All Halo.
- Posthuman Republic: the faction name and `Medea-class Support Cruiser` are
  Dropfleet Commander. The other eight hulls are plain naval nouns.

**Name pools sourced externally.**

- `src/ship-names.ts` — the 108 capital-ship names are transcribed from
  `unsc-ships-halopedia.md`, which is 309 vessels pulled from Halopedia's API.
  `Forward Unto Dawn`, `Witch Bucket`, `Two for Flinching` and the rest are
  Halo, not invention.
- `src/corp-names.ts` — ported from the user's own tabletop Corporation
  Generator at jetwong.neocities.org. `Häx Industrial`, `The Squimm Group`,
  `Heirz of Kergoz` all come from there.
- `src/data/starter-outfits.ts` — the outfit names `Greylancer` and `Valcua`
  and every pilot name (`Wiseman`, `Kururu`, `Bengé`, `Nolt`, `Gillis`,
  `Rocambole`, `Xenon`, `Rei-Ginsei`, `Samon`) come from the user's own
  callsign pool, drawn from Vampire Hunter D and Gravity Rush. The file says so
  and tells future sessions not to invent replacements. Neither name appears in
  the rulebook, which is expected.
- `destroyer-names.md` — a Helldivers 2 reference list, wired into nothing. It
  says so in its own first paragraph.
- `web/fleet-sync.ts` — the 304-word sync-token list is common nouns in
  lowercase, not proper nouns, and is shared with Dropfleet Commander's Fleet
  Sync.

**Generated fleet-name banks that are fine.** News Inc. (Breaking, Primetime,
Front-Page, Viral), Megamart (Doorstep, Same-Day, Wholesale, Clearance),
Galactic Credit (Liquidation, Repossession, Arrogation), Heavy Industries
(Iron, Cobalt, Kovar, Invar, Melchior), Golem (Strip, Excavating, Fabricating)
and the Alliance (Fractious, Discordant, Unbowed) all take their vocabulary
from what the faction actually does. Vyke, Gen Ω, The Discord and The Unity are
documented as Endless Space 2 lifts and read consistently.

**Other cleared names.** `Writ of the Registrar` (`premade-lists.ts:110`) —
"Registrar" appears 14 times in the rulebook and is the Age of Unity's central
institution; "Writ" is a legal-bureaucratic noun that matches it exactly.
`Atlas Extraction Group` (`premade-lists.ts:132`) — Heavy Industries names its
entire roster after Greek myth and constellations (Pegasus, Ursus, Taurus,
Lyra, Orion, Andromeda, Poseidon, Vulcan), so Atlas is on-pattern, and
"Extraction Group" is flat corporate. Seed list names are all descriptive
("Aegis Starter Fleet"). Emblem labels are either descriptive of the artwork
("H-beam", "Stencil M", "Interlocked shards") or derived from real franchise
asset filenames. The custom-faction default is "My Fleet" with a "Scout" and a
"Cruiser".

## Notes on tone

The book almost never reaches for grandeur. Its dominant move is to bolt a
mundane commercial noun onto a warship class and let the joke land by itself:
`Titan Mallship`, `Grand Arenaship`, `Interview Barge`, `Pleasure Cruiser`,
`Delivery Drone Wing`, `Foundry-Class Hauler`. Personnel are job titles off an
org chart, never epithets, and the longer and more boring the better: `Hedge
Fund Manager`, `Junior Lawyer`, `Head of Customer Empathy`, `Penal Crew
Overseer`, `Hyperspatial Gravimetrics Research Fellow`, `Chief of the Boat`.
Where a faction gets a coherent naming system it is borrowed from a real
vocabulary rather than invented from vibes: coinage for the bank (`Aureus`,
`Denarius`, `Argenteus`, `Florin`, `Litra`), constellations and Greek myth for
the miners (`Pegasus`, `Lyra`, `Orion`, `Andromeda`, `Vulcan`), church
architecture for the Ordinate (`Hierophant`, `Clerestory`, `Transept`,
`Penance`, `Epistle`). The two apocalyptic factions are the only place the book
goes big, with `Warcry`, `Torchbearer`, `Void Dancer` and `Leviathan`, and it
earns that by having spent 140 pages not doing it. Replacements should aim at
the boring end: a real occupation, a real material, a real piece of jargon.
