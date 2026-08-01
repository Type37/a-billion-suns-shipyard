# Custom factions: Covenant, UNSC, Posthuman Republic

Three custom factions built as **rethemes of book factions**, not as new stat
blocks. Every number, dice pool, range band, cost and rule below is taken
unchanged from its base faction, so all three stay balanced against the twelve
published factions by construction. Only names change.

The one exception is the Covenant, which gains a tenth ship (see that section).

## Why reskin instead of building from scratch

A hand-built faction drifts. The first attempt at a Covenant (the old
`cf-covenant` seed, deleted in 37cd7da) ended up as a handful of oversized
hulls with no real Mass curve, because every stat was chosen to feel right in
isolation rather than to sit in a spread. Inheriting a published roster means
the Mass 0/1/2/3 spread, the cost curve and the weapon range bands are already
correct, and the work is limited to picking the base whose *mechanics* match
the fiction.

Names of guns and hulls were deliberately not part of the matching. Only rules
and stat shapes were.

---

## Posthuman Republic = AEGIS

**Base:** AEGIS (Armageddon, rules p.164-165)
**Era:** Armageddon · **Initiative:** 4D6 · **CMD Tokens:** 5

**Faction Rule, "Familiars"** (base: Protocol Shards):
> When a unit in this fleet is within 6" of a friendly unit carrying a friendly
> HVP (aka a 'Familiar'), it gains the benefit of that HVP, as if it were
> carrying it.

**Why this base.** The rule is a capability propagating from one mind to
everything near it, which is a networked posthuman intelligence written as a
mechanic. Beyond that it is the tankiest roster in the game: three Mass 3 hulls
(more than any other faction) carrying Shields 4/5/6, the highest capital
shields anywhere. Two mid-mass hulls carry Utility Bays, covering the good
Mass 1/2 utility ships PHR spam. Fighters exist on the roster but no faction
rule or HVP keys off Mass 0, so nothing pushes you toward them.

### Ships

| Ship | Base name | ⓜ | Thrust | Sil | Shields | Primary | Auxiliary | Cost |
|---|---|---|---|---|---|---|---|---|
| Fighter Wing | Recon Drone | 0 | 8 | 2 | 0 | Light Blasters 1×D6 · 0–3" | — | 4 |
| Interceptor Wing | Defence Drone | 0 | 4 | 4 | 1 | — | Laser Cannon 1×D8 · 0–9" | 6 |
| Bomber Wing | Assault Drone | 0 | 6 | 3 | 1 | Torpedoes 1×D10 · 6–12" | — | 12 |
| Cutter | Repair Drone | 1 | 6 | 4 | 1 | Blasters 2×D6 · 0–6" | **Utility Bays** | 10 |
| Medea-class Support Cruiser | Warden | 2 | 8 | 5 | 2 | **Utility Bays** | Turbo Blasters 4×D6 · 0–6" | 20 |
| Destroyer | Bastion | 2 | 5 | 6 | 3 | Heavy Railguns 2×D12 · 9–18" | Turbo Blasters 8×D6 · 0–6" | 45 |
| Cruiser | Sentinel | 3 | 6 | 7 | 4 | Cyclone Array 12×D6 · 12–24" | Defence Grid 4×D8 · 0–9" | 55 |
| Battlecruiser | Citadel | 3 | 3 | 8 | 5 | Cruise Missiles 4×D10 · 18–36" | Turbo Blasters 8×D6 · 0–6" | 65 |
| Battleship | Imperator | 3 | 5 | 9 | 6 | Planet Smasher 2×D12 · 12–24" | Defence Grid 4×D8 · 0–9" | 75 |

### HVP (Familiars)

| Familiar | Base name | Rule |
|---|---|---|
| Sentry Familiar | Anti-Ordnance Protocols | Ships in this unit increase the maximum range of their Auxiliary Weapons by +3". |
| Reactor Familiar | Power Management Protocols | This unit reduces the cost of the 'Power to Weapons' and 'Power to Shields' commands to 0 CMD tokens. |
| Artificer Familiar | Repair Protocols | Ships in this unit can scan a friendly unit to transfer one damage token to itself from the scanned unit. |
| Warden Familiar | Security Protocols | Ships in this unit count their Mass for Blockading as 1 higher. |
| Tactician Familiar | Snapfire Protocols | This unit may reverse the order of the activation steps during its activation, taking them in this order: Action Step, Passive Attacks Step, Movement Step. |
| Oracle Familiar | Threat Assessment Protocols | When making Passive Attacks, ships in this unit may attack each active unit within range once (meaning they can attack multiple times in a single Passive Attacks Step if there are multiple active units within range). |
| Vizier Familiar | Vulnerability Analysis Protocols | Ships in this unit increase the damage values of their D10 and D12 weapon systems by 1. |

---

## The Covenant = The Ordinate

**Base:** The Ordinate (Age of Unity, rules p.154-155)
**Era:** Age of Unity · **Initiative:** 5D6 · **CMD Tokens:** 5

**Faction Rule, "Predictive Algorithms"** (name unchanged):
> (1 CMD): At the start of any player's battlegroup activation, spend 1 CMD
> token to reorder the activation steps to be Passive Attacks Step, Move Step,
> Action Step for this battlegroup's activation only.

**Why this base.** Highest initiative in the game at 5D6, plus a rule that lets
you act before the enemy can react, which is superior technology expressed
mechanically. Three Mass 3 hulls at Shields 5/5/6. The playstyle is built on
passive fire, meaning these capitals shoot back every time something activates
near them, which is how Covenant ships behave when you close on them.

**Known compromise.** The Ordinate is explicitly weaker at long range, and the
Covenant arguably should out-range you. The Transept in particular tops out at
a 0-9" Laser Cannon. This was accepted because AEGIS went to the PHR and no
remaining faction covered shields, capitals and superior tech together.

### Ships

Ten hulls, not nine. The base roster has no dedicated bomber, so one was added
(see below).

| Ship | Base name | ⓜ | Thrust | Sil | Shields | Primary | Auxiliary | Cost |
|---|---|---|---|---|---|---|---|---|
| Space Banshee Wing | Light Fighter Wing | 0 | 8 | 2 | 0 | — | Blasters 2×D6 · 0–6" | 5 |
| Seraph Wing | Advanced Fighter Wing | 0 | 4 | 4 | 1 | — | Turbo Blasters 4×D6 · 0–6" | 10 |
| **Gigas-class Bomber Wing** | *(new)* | 0 | 4 | 3 | 1 | Ion Torpedoes 2×D8 · 6–12" | Blasters 2×D6 · 0–6" | 16 |
| Zanar-pattern Storm Cutter | Epistle-Class Gunship | 1 | 6 | 4 | 1 | Blasters 4×D6 · 0–6" | Turbo Blasters 4×D6 · 0–6" | 15 |
| Missionary Ship | Missionary Vessel | 1 | 6 | 5 | 2 | **Utility Bays** | Auto Blasters 3×D6 · 0–6" | 10 |
| Au'zur-pattern Frigate | Clerestory-Class Monitor | 2 | 3 | 6 | 3 | Particle Beams 1×D10 · 12–24" | — | 20 |
| Ceudar-pattern Heavy Corvette | Penance-Class Escort Frigate | 2 | 6 | 7 | 4 | Ion Torpedoes 2×D8 · 6–12" | Ion Torpedoes 2×D8 · 6–12" | 30 |
| Sinaris-pattern Heavy Destroyer | Transept-Class Strike Cruiser | 3 | 4 | 8 | 5 | Laser Cannon 2×D8 · 0–9" | Laser Cannon 2×D8 · 0–9" | 35 |
| Ket-pattern Battlecruiser | Oracle-Class Gun Carrier | 3 | 4 | 8 | 5 | **Utility Bays** | Light Railguns 4×D8 · 9–18" | 40 |
| Varric-pattern Assault Carrier | Hierophant Cathedral Ship | 3 | 4 | 10 | 6 | Micro Missiles 10×D6 · 12–24" | Defence Grid 4×D8 · 0–9" | 80 |

#### The added bomber

**Gigas-class Bomber Wing, 16 cr.** Mass 0 · Thrust 4" · Sil 3 · Shields 1 ·
Primary: Ion Torpedoes [2D8, 6-12"] · Auxiliary: Blasters [2D6, 0-6"].

This is the only stat block in this document that is not inherited. It slots
between the two existing wings on cost (5 / 10 / 16) and gives the fleet a
torpedo-armed Mass 0 option the base roster lacks. Worth a look after some
games: it is the one thing here that has not been balanced by the book.

### HVP

| HVP | Base name | Rule |
|---|---|---|
| San'Shyuum Prelate | Arch-Prelate of the Registrar | This fleet gains access to the following command: Algorithmic Liturgy (1 CMD): During an opponent's Passive Attacks Step, spend 1 CMD token to select one of your units and count its Auxiliary arc of fire as 360° for this activation only. |
| Huragok Shield Technician | Liturgical Archivist | Units in this fleet that have an Activated token gain +1 to their Shields value until the end of the round. (Activated tokens are placed at the end of a unit's activation.) |
| Ministry of Tranquility Navigator | Master of the Choir Computational | In the Jump Phase, each unit in this fleet may take the Jump Hop action once. |
| Sangheili Helmsmaster | Quantum Seraph | Ships in this battlegroup may make an additional pivot at the end of their Move Step (which still counts towards their Inertial Strain calculation). |
| Reliquary Custodian | Relic Keeper | When a friendly unit attacks an enemy unit with an Activated token, they subtract 1 from the result of each of their attack dice, to a minimum of 1. This increases the chance of critical hits but doesn't prevent duds. (Activated tokens are placed at the end of a unit's activation.) |
| Zealot Strike Commander | Technocratic Cabal | The units in the first battlegroup in this fleet to activate each round double their Thrust value (for this activation only). |
| The Sacred Icon | The Blessed Lambda | If a ship in this fleet attacks from outside of its target's Auxiliary arc of fire, it can re-roll any misses once. |

---

## UNSC = Gen Ω

**Base:** Gen Ω (Armageddon, rules p.168-169)
**Era:** Armageddon · **Initiative:** 3D6 · **CMD Tokens:** 5

**Faction Rule, "Martyrs' Fury"** (name to be decided, see open questions):
> Units in this fleet gain the following rule: If this unit has suffered damage
> this round, increase the Damage value of each of its weapons by 1.

**Why this base.** A fleet that hits harder the more damage it has taken is
heroic sacrifice as a mechanic, and the HVP list doubles down: two of them let
you spend hull points to buy effect, and one turns your destruction into an
explosion. That is the UNSC way of fighting a war it is losing.

**Note on the roster.** Gen Ω fields only two Mass 3 hulls, and one of them
(the Control Ship) is a cheap utility hull with no primary weapon at all. This
faction is deliberately less top-heavy than the other two.

### Ships

| Ship | Base name | ⓜ | Thrust | Sil | Shields | Primary | Auxiliary | Cost |
|---|---|---|---|---|---|---|---|---|
| Longsword Fighter Wing | Warcry Fighter Wing | 0 | 8 | 2 | 1 | — | Light Blasters 2×D6 · 0–3" | 6 |
| Sabre Wing | Eidolon-Yynnx Stealth Bomber | 0 | 6 | 2 | 1 | Plasma Torpedoes 2×D10 · 6–12" | — | 15 |
| Gladius-class Corvette | Void Dancer Scout Marauder | 1 | 10 | 3 | 1 | Blasters 2×D6 · 0–6" | Blasters 2×D6 · 0–6" | 10 |
| Prowler | Halo-class Transport | 1 | 4 | 6 | 3 | Blasters 2×D6 · 0–6" | **Utility Bays** | 15 |
| Light Frigate | Werewolf Stealth Frigate | 2 | 8 | 5 | 2 | Light Railguns 2×D8 · 9–18" | Turbo Blasters 4×D6 · 0–6" | 20 |
| Heavy Frigate | Ghost Hunter Assault Frigate | 2 | 6 | 7 | 4 | Light Railguns 2×D8 · 9–18" | Turbo Blasters 4×D6 · 0–6" | 30 |
| Cruiser | Torchbearer Heavy Destroyer | 2 | 4 | 8 | 5 | Particle Beams 2×D10 · 12–24" | Light Blasters 2×D6 · 0–3" | 45 |
| Control Ship | Matryoshka-class Factory Ship | 3 | 3 | 8 | 5 | **Utility Bays** | Laser Cannon 2×D8 · 0–9" | 30 |
| Carrier | Termina-class Colony Ship | 3 | 5 | 9 | 6 | Cruise Missiles 4×D10 · 18–36" | Defence Grid 4×D8 · 0–9" | 70 |

### HVP

All seven names below are guesses and are the least settled part of this
document.

| HVP | Base name | Rule |
|---|---|---|
| Overcharge Gunnery Chief | Eschatological Demagogue | When a unit in this fleet Opens Fire, it may suffer up to 3 damage to reduce the target's shield value by 1 for each damage suffered, for this salvo only. (This damage cannot take the unit below 0HP.) |
| Prowler Corps Spook | Ghost Hacker | Attackers count the Silhouette value of units in this fleet as 1 lower when rolling to hit. |
| Spartan-II Commando | Messianic Child | Friendly units within 12" of this unit gain the following rule: Once per activation, this unit may suffer 1 damage to use a Command for 0 CMD tokens. |
| Veteran Battlegroup Admiral | Prophet of the End Times | Units in this fleet gain the following rule: While there is a friendly ship within 6" that has been given the 'Red Alert' command this round, including this unit itself, this unit may re-roll any misses once each time it attacks. |
| ODST Boarding Team | Righteous Saboteurs | When an enemy ship within 6" of a ship in this fleet is reduced to 0HP it automatically explodes, during which it counts its Mass as D3 higher. |
| Longsword Ace | The Nameless Punk | *(May be carried by a Mass 0 unit.)* When units in this unit's battlegroup make attacks, they count their targets' Shields values as 2 lower than the listed value. |
| Chief of the Boat | Unhinged Live-Streamer | Ships in this fleet can use the 'Red Alert' command for 0 CMD tokens. |

---

## Sample ¢300 lists

Illustrative only — built from the ship names above, sized to a small game
rather than to either collection in full. Both hit the limit exactly and
carry the required 3 HVP.

### Covenant, ¢300

| Unit | Count | Cost each | Cost |
|---|---|---|---|
| Varric-pattern Assault Carrier — carries **San'Shyuum Prelate** | 1 | 80 | 80 |
| Ket-pattern Battlecruiser — carries **Sangheili Helmsmaster** | 1 | 40 | 40 |
| Sinaris-pattern Heavy Destroyer | 1 | 35 | 35 |
| Ceudar-pattern Heavy Corvette | 2 | 30 | 60 |
| Au'zur-pattern Frigate | 2 | 20 | 40 |
| Missionary Ship — one carries **Huragok Shield Technician** | 2 | 10 | 20 |
| Zanar-pattern Storm Cutter | 1 | 15 | 15 |
| Seraph Wing | 1 | 10 | 10 |
| **Total** | | | **300** |

Leans on the collection as described: both heavy corvettes, a couple each of
the Au'zur and Missionary hulls, one Zanar, one wing, and the three capitals
(Varric/Ket/Sinaris) fielded together rather than spread across separate lists.

### UNSC, ¢300

| Unit | Count | Cost each | Cost |
|---|---|---|---|
| Carrier — carries **Veteran Battlegroup Admiral** | 1 | 70 | 70 |
| Cruiser — carries **Overcharge Gunnery Chief** | 1 | 45 | 45 |
| Heavy Frigate — one carries **ODST Boarding Team** | 2 | 30 | 60 |
| Light Frigate | 3 | 20 | 60 |
| Control Ship | 1 | 30 | 30 |
| Gladius-class Corvette | 2 | 10 | 20 |
| Sabre Wing | 1 | 15 | 15 |
| **Total** | | | **300** |

Built around what you already have in hand (Light and Heavy Frigates as the
core of the fleet) plus one each of the ship types your "want" list hadn't
gotten to yet, so this doubles as a shopping-priority guide, not just a list.

---

## Open questions

1. **Faction rule names.** Only the PHR rule was renamed (Protocol Shards to
   Familiars). "Predictive Algorithms" and "Martyrs' Fury" are still the book
   names. Both work as-is but could be rethemed.
2. **Command names inside rule text.** "Algorithmic Liturgy" on the San'Shyuum
   Prelate is still a book name. Rule text was otherwise left mechanically
   identical on purpose so nothing gets lost in translation.
3. **UNSC HVP names** are all invented and unreviewed.
4. **The Gigas bomber** is the only unbalanced stat block here.
5. **Covenant range weakness** is a real trade, noted above, and may want a
   house fix if it plays badly.
