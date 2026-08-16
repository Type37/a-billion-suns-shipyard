# Hypergrowth shipyard — build spec

Functional specification for the Hypergrowth shipyard builder. Behaviour, data and
constraints only. Visual styling follows `web/style.css`; this document does not
restate it.

Working reference implementation: `shipyard-v2.html`.

---

## 1. What this screen is

In Hypergrowth you do not build a fleet. You buy a **pool of ships**, and units are
formed later, in play, at the moment you requisition them.

Rulebook, *Construct Your Shipyard*:

> Print out a Fleet Roster sheet and fill it up with ships totalling no more than
> ¢300bn. You are buying ships; you don't have to organise them into units until you
> requisition them during the game.

Two consequences that drive every decision below:

- **There are no units on this screen.** No unit-size caps, no Mass 3 single-ship
  rule, no battlegroups. Those belong to requisition, which happens at the table.
- **¢300bn is an ownership cap, not a budget you spend.** The Credits Tracker starts
  the game at zero. Ships cost credits when you *requisition* them in play, and
  credits are victory points. Do not present the cap as money being spent.

**Unlimited Shipyards** (advanced option) is not "cap removed". The rules say do not
construct a shipyard in advance at all; you requisition anything from your faction in
any quantity. If implemented, it should suppress this screen's ship list, not show ∞.

---

## 2. Data

Per ship class, from `src/data/factions/*.ts`:

| Field | Notes |
|---|---|
| `name` | Never truncated. |
| `mass` | 0–3. Displayed as the circled lowercase m. |
| `thrust` | Inches. |
| `silhouette` | Both the to-hit threshold and starting hull points. |
| `shields` | Save threshold. |
| `primary` | 45° arc. May be empty, or Utility Bays. |
| `auxiliary` | 180° arc. May be empty, or Utility Bays. |
| `cost` | Billions of credits. |

Per HVP: `name`, `rule`. Twelve are selectable for any faction: the seven
faction-specific ones plus **five generic** (Executive Officer, Seasoned Captain,
Chief Weapons Officer, Chief Science Officer, Chief Engineer). The generics are
always available; the Hypergrowth text says "from your faction" but the core HVP
rules on p.57 govern.

### Notation, taken from the book's own tables

- Weapons render as **`Light Blasters [1D6, 0–3”]`** — `1D6`, never `1×D6`.
- Range is a minimum and a maximum in inches. The minimum matters: a `[2D10, 18–36”]`
  weapon does nothing inside 18".
- Damage per unsaved hit is fixed by die type: **D6=1, D8=2, D10=3, D12=5**. It is a
  lookup, not a stat. If shown, derive it; never invent a damage field.
- Mass is **U+24DC ⓜ**, the circled *lowercase* m. The faction data files currently
  store U+24C2 (capital) — accept both on input. **No project web font contains this
  glyph**, so it must be drawn as an inline SVG or it renders in a substituted face.

### Rules text is verbatim

Every HVP rule and faction rule is reproduced word for word, never summarised,
trimmed, or paraphrased. If it does not fit, change the layout. Do not write
explanatory copy about game mechanics in your own words — quote the book or say
nothing.

---

## 3. Screen structure, top to bottom

1. **Masthead** — fleet name, faction.
2. **Faction block** — initiative, CMD tokens, faction rule verbatim.
3. **Budget bar** — sticky. A filled bar plus the remaining figure.
4. **Ship list** — every class in the faction, ordered by ascending mass.
5. **Personnel** — faction HVPs, then generics under their own heading.

No footer summary. Derived metrics (hull counts, mass histograms, class counts) were
removed: every one restates numbers already visible, from a position where you cannot
see the source and the total together.

---

## 4. Ship row

Content, all of it always visible:

- Name and cost, adjacent, on the first line.
- Mass, thrust, silhouette, shields — each with its own icon, each in its own colour.
- Primary and auxiliary weapon, each with an arc glyph (narrow wedge for 45°, half
  disc for 180°). An empty slot shows an em dash; a utility slot says Utility Bays.
- Quantity control.

### Layout, by viewport

Measured from the widest ship (Aureus Carrier: stats plus both weapons need **370px**).

| Viewport | Layout | Row height |
|---|---|---|
| < 386px | Three lines: name+control / stats / weapons | 69px |
| ≥ 386px | Two lines: name+control / stats+weapons | 55px |
| ≥ 700px | One line, full table with a header row | ~24px |

The 386px breakpoint is 370 content + 12 padding + 3 border. Re-measure it if the
type size, gaps or weapon strings change; it is not a round number by accident.

The quantity control sits on the **name line only**, not spanning both rows. That is
what frees the full width for the data lines and makes the two-line layout possible.

Row heights are identical within a breakpoint. Wrapping is never left to chance.

---

## 5. Personnel row

Name, verbatim rule, and a **single square control**. No stepper, no counter — an HVP
is one or nothing, and a stepper on a binary is nonsense.

- Unselected: outlined square with a plus.
- Selected: filled square with a tick, row gets a coloured edge.
- At three selected, the remaining rows' controls are disabled and marked
  `aria-disabled`, so a tap is visibly refused rather than silently swallowed.

Counter reads `n of 3 chosen`.

**Assignment is out of scope for this screen.** The rules have you assign HVPs to
units of Mass 1 or higher, but units do not exist until requisition, and the core
rules explicitly cover an HVP token sitting in your shipyard granting nothing. The
builder chooses; the printed roster carries the names; assignment happens at the
table. If assignment is ever added, it must not be a dropdown — see §7.

**Choosing can wait for the table too.** p.123 makes "Choose and assign HVPs" step
4, *after* the two D12 missions are rolled, and p.141 says it outright: "In
Hypergrowth and Age of Unity era games, you select your HVP after you learn the
missions for the game." So the print bar carries an **All personnel** toggle in
these two modes: it prints all twelve blocks, marking any you have already
chosen, and prints them unasked when you have chosen nobody. Twelve blocks are
250px of a 710px Letter sheet — page one still holds them with the Actions and
Commands reference switched off, and spills to a second page with it on.

---

## 6. Interaction

### Quantity

Classic stepper: minus, count, plus. Chosen because 0–9 with a dominant value of one
or two is exactly the case NN/g describes as a stepper's sweet spot, and Baymard finds
buttons outperform the dropdown or bare field that most sites use.

- Minus disabled at 0, plus disabled at max. Disabled states are visible.
- Count renders greyed at 0 rather than hidden.
- No Update button. Totals move on the same tap.
- A typed-number field was tested and rejected: it is for unpredictable ranges, and on
  a phone it opens a keypad overlay to reach a number two taps away.

### Budget

- Bar fills with spend against the cap; remaining figure sits inside it.
- **Overspending is allowed** and shown in red rather than blocked. Legality is a
  distant third priority behind readability and totals.

### Non-negotiables

**No layout shift, ever.** Pressing a control must move nothing. Achieve this by
mutating in place — rewrite the count text, toggle a class, update the totals — and
never by re-rendering the list. Re-rendering discards the node under the user's
thumb, loses focus, and lets scroll anchoring lurch on mobile even when a desktop
measurement reads clean.

Verify by recording the absolute document offset of landmarks *below* the row you
press, including the personnel section, before and after. Expect 0.00px. Measure the
personnel side too: a control that changes width when selected (one button becoming
two) reflows its row and is the exact bug this rule exists to prevent.

**No horizontal scrolling.** Not on the page, not inside a container, not in a
scrollable table. If content does not fit the width, change the layout. Check every
element for `scrollWidth > clientWidth`, not just the document.

**Nothing truncated or hidden.** No ellipsis, no `display:none` on gameplay text. Let
rows grow taller.

**Focus survives.** After any interaction, focus remains on the pressed control.

---

## 7. Rejected approaches, and why

Recorded so they are not re-proposed.

| Approach | Why not |
|---|---|
| Horizontally scrolling stat table | Sideways scrolling is prohibited outright. |
| Tap row to cycle 0→1→2→3→0 | No way to step back; no indication of the limit; nine taps to clear a 2. |
| Split row (add and remove adjacent) | Opposite actions side by side invites mis-taps. |
| Press-and-hold to ramp | Hidden affordance with a 400ms delay; ramping solves large ranges, and 0–9 is not one. |
| Stepper with typed field | Field earns its place only when values are unpredictable. |
| Dropdown per HVP | Twelve native selects, each opening a full-screen picker. Wrong anchor: you think "who is on this ship", not "where does this person go". |
| Cycle button per HVP | Obscures state, multiple taps, and the label lies about what a tap will do. |
| Whole card as the tap target | Works, but no research supports it, and it collides with interactive glossary terms inside the card. |
| Footer with hull count and mass spread | Derived from numbers already on screen, placed where you cannot see both. |

---

## 8. Open questions

- **Touch targets.** The stepper is currently 32×34px, under the 44×44 guideline, as a
  deliberate trade for density. Decide whether to restore it.
- **Glossary terms.** A working implementation links rules keywords (Salvo, Critical
  Hit, Easy Target, Power to Shields, Red Alert, Scan, Jump Point, blockade, Dud, and
  the four commands) to verbatim popovers, and marks terms referenced by your own
  fleet rule. Not present in v2. If added: term buttons inside a card must stop
  propagation, and a `<button>` may not be nested inside another `<button>`.
- **Play mode.** Requisition, striking ships off the roster permanently, and faction
  abilities that operate during play (Galactic Credit's CMD carry-over) all live
  outside this screen.
- **Armageddon and Age of Unity.** Units exist at build time in both, so this
  Shipyard personnel pattern does not transfer. They are not the same as each
  other, though: Armageddon chooses *and* assigns at build (p.79 step 4), while
  Age of Unity chooses at build and assigns at the table once the missions are
  rolled (p.92 step 5), which is why its carrier picker lives in Play Mode.

---

## 9. Verification checklist

Before calling any change done:

1. Serve the page and **take a screenshot and look at it.** Measurements do not catch
   run-together text, overlapping grid areas, or unstyled controls. All three of those
   shipped during development because only numbers were checked.
2. Test at **360, 390 and 430** CSS pixels. 360×800 is the most common mobile viewport
   worldwide; 320 is a 2016 iPhone SE and is not the target.
3. Confirm no element has `scrollWidth > clientWidth`.
4. Confirm 0.00px movement of landmarks below a pressed control, and on the personnel
   section.
5. Confirm every rules string still matches the book character for character.
