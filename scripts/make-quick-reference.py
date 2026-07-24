"""Build web/public/ABS-2E-Quick-Reference.pdf, the one-page reference sheet.

This PDF used to be produced ad hoc, with no generator kept, so every correction
meant rebuilding it from scratch and guessing at the previous layout. It is a
script now: edit CONTENT below, re-run, commit the result.

    python scripts/make-quick-reference.py

Two things this file is strict about.

RULES TEXT IS VERBATIM. Every rule string here is transcribed word for word from
the published Quick Reference. Do not tighten, re-word, or trim one to make the
page fit - change the type size or the layout instead. A shortened rule is a
changed rule, and this sheet is what someone reads at the table.

NO SOLID BARS. Section headings used to be white type reversed out of seven
full-width black rectangles. On screen that reads as structure; printed, it is
seven bands of solid toner across a sheet people run off on a home printer.
Headings are set in the house blue over a hairline rule instead - same reading
order, a fraction of the ink.

Typography is the app's own: Libre Franklin for text, Archivo for the display
headings, converted from the woff2 files the site already serves so the sheet
and the app cannot drift apart.
"""

from __future__ import annotations

import sys
from pathlib import Path

from fontTools.ttLib import TTFont
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont as RLTTFont
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    KeepTogether,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)

ROOT = Path(__file__).resolve().parent.parent
FONT_DIR = ROOT / "web" / "fonts"
OUT = ROOT / "web" / "public" / "ABS-2E-Quick-Reference.pdf"
BUILD = ROOT / "build" / "fonts"

# House palette, matching web/style.css.
INK = colors.HexColor("#0a0e14")
INK2 = colors.HexColor("#3a424f")
INK3 = colors.HexColor("#5c6472")
BLUE = colors.HexColor("#0b3d91")
RED = colors.HexColor("#fc3d21")
HAIR = colors.HexColor("#d3d8e0")

# ---------------------------------------------------------------------------
# Fonts. The site ships woff2; reportlab needs TTF, and fontTools will do the
# conversion losslessly (woff2 is just a compressed wrapper around the same
# glyph data). Converted copies are cached under build/ and are not committed.
# ---------------------------------------------------------------------------
FONTS = {
    "QR": "libre-franklin-500",
    "QR-Bold": "libre-franklin-700",
    "QR-Italic": "libre-franklin-italic",
    "QR-Display": "archivo-800",
}


def register_fonts() -> None:
    BUILD.mkdir(parents=True, exist_ok=True)
    for name, stem in FONTS.items():
        src = FONT_DIR / f"{stem}.woff2"
        if not src.exists():
            sys.exit(f"missing font {src}")
        ttf = BUILD / f"{stem}.ttf"
        if not ttf.exists() or ttf.stat().st_mtime < src.stat().st_mtime:
            f = TTFont(str(src))
            f.flavor = None
            f.save(str(ttf))
        pdfmetrics.registerFont(RLTTFont(name, str(ttf)))
    pdfmetrics.registerFontFamily("QR", normal="QR", bold="QR-Bold", italic="QR-Italic")


# The Mass mark (U+24DC, circled latin small m) is not in Libre Franklin. The
# published sheet prints the symbol, so we substitute a font that has it when
# the machine offers one and fall back to the word otherwise - a fallback that
# is still correct English, never a missing-glyph box.
MASS_FONT = None
for candidate in ("C:/Windows/Fonts/seguisym.ttf", "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"):
    if Path(candidate).exists():
        try:
            if 0x24DC in TTFont(candidate, fontNumber=0).getBestCmap():
                pdfmetrics.registerFont(RLTTFont("QR-Sym", candidate))
                MASS_FONT = "QR-Sym"
                break
        except Exception:
            pass


def mass(text: str) -> str:
    """Render the circled-m Mass mark, or spell it out if no font has the glyph."""
    if MASS_FONT:
        return text.replace("\u24dc", f'<font face="{MASS_FONT}">\u24dc</font>')
    return text.replace("\u24dc", "Mass")


# ---------------------------------------------------------------------------
# CONTENT - verbatim from the published Quick Reference.
# <b> and <i> are reportlab inline markup and carry the source's own emphasis.
# ---------------------------------------------------------------------------

ROUND_STRUCTURE = [
    ("Command Phase:", "Gain CMD tokens. Make Initiative Check: winner picks who gets Initiative. Loser gets +1 CMD token."),
    ("Jump Phase:", "Take turns. On your turn: Open A Jump Point, Jump In unit (within 6\" of Jump Point), or Pass (take no further turns). If all players have passed, the phase ends."),
    ("Tactical Phase:", "Take turns. On your turn, Drag To Select a battlegroup and activate it, completing each activation step with all units before starting the next step. After activating a unit, give it an Activated token. If all units have activated, the phase ends."),
    ("End Phase:", "Clear Activated tokens. Discard unused CMD tokens."),
]

ACTIVATIONS = [
    ("Movement Step:", "Pivot any amount, then move ahead up to Thrust value. Page XX."),
    ("Passive Attacks Step:", "Suffer Passive Attacks. Page XX."),
    ("Action Step:", "Take one Action. Page XX."),
]

ACTIONS = [
    ("Open Fire (action):", "Attack with all weapon systems. Roll equal or under Silhouette to hit. Target makes shield saves on the dice that hit. Assigned unsaved hits to damaged ships first. Page XX."),
    # The published sheet sets Scan's colon outside the bold; reproduced as printed.
    ("Scan (action)", ": Scan a single object or ship within 3\" or collect any/all Free-floating asset tokens within 3\"."),
    ("Scramble Squadrons (action):", "Select one Mass 0 unit carried by the unit and deploy it wholly within 6\". The scrambled unit takes one action and then receives an Activated token."),
    ("Jump Hop (action):", "If all the ships in this unit are within 6\" of a friendly Jump Point, remove all the ships in this unit from play and set them up within 6\" of a friendly Jump Point in another Sector."),
    ("Jump Out (action):", "If all the ships in this unit are within 6\" of a friendly Jump Point, remove all the ships in this unit from play and place them into your Reserves area."),
    ("Resupply (action):", "<i>Utility Ships only</i>. Select a friendly Mass 1, 2 or 3 ship to resupply. Until the end of the round, the resupplied ship counts as +1 Mass for the purposes of Blockading, up to a maximum of +\u24dc (where \u24dc is the mass of the resupplied ship)."),
]

COMMANDS = [
    ("All Hands (1 CMD):", "After a friendly unit takes its first action in the Action Step, spend 1 CMD token to take a second (different) action with it."),
    ("Executive Oversight (1 CMD):", "Re-roll one attack die, initiative die or saving throw."),
    ("Power to Engines (1 CMD):", "At the start of a friendly unit's movement step, spend 1 CMD token to move twice during this movement step (pivoting and moving ahead both times)."),
    ("Power to Weapons (1 CMD):", "Before rolling to attack with a friendly unit, spend 1 CMD token to subtract 1 from the result of each attack dice (to a minimum of 1), for the current Salvo. This increases the chance of critical hits but doesn't prevent duds."),
    ("Power to Shields (1 CMD):", "Before rolling Saving Throws with a friendly unit with a Shields value of 1 or more, spend 1 CMD token to add 1 to this unit's Shields value, for the current Salvo only."),
    ("Red Alert (1 CMD):", "When a friendly ship without an Activated token would be destroyed, spend 1 CMD token: it isn't destroyed, and regains 1HP instead. At the end of your next activation, if this ship is still in play, it is reduced to 0HP, and you cannot use Red Alert to save it. If a ship jumps out after using Red Alert, it isn't reduced to 0HP and is saved from destruction, but cannot return to play."),
    ("Requisition (1 CMD):", "<i>Hypergrowth only</i>. When it is your turn to Jump In a unit, you can spend 1 CMD token to form a new unit using the ships in your Shipyard. Pay their cost in Credits. Gather the appropriate miniatures and jump them into play as if they were in your Reserves area."),
]

FORGET = [
    ("Unit Coherence:", "Ships have to stay within 6\" of all other ships in their unit. Page XX."),
    ("Drag To Select a Battlegroup:", "Select an unactivated unit as lead. Select unactivated units within 6\" of the lead unit, with a combined Mass of 10 or less. Page XX."),
    ("Squadron Capacity", ": A unit can carry a number of Squadrons up to twice its Combined Mass. Page XX."),
    ("Attack Dice Damage Values:", "D6 is 1, D8 is 2, D10 is 3, and D12 is 5."),
    ("Primary Arc:", "45° arc of fire to front. Auxiliary Arc: 180° arc of fire to front. Page XX."),
    ("Facilities:", "360° arc of fire. Will Passive attack every unit in range."),
    ("Explosion Check:", "Roll a D6. If you roll equal to or under the ship's \u24dc, it Explodes and all units within 3\" suffers a \u24dcD6 attack, causing 1 damage per hit. Page XX."),
    ("Easy Target:", "If a unit moved less than 3\" and didn't Jump, it is an 'Easy Target': enemy units may re-roll attack dice. Page XX."),
    ("Inertial Strain:", "If any single pivot is more than 90 degrees, ship cannot make Primary attacks. Page XX."),
    ("Mother's Wing:", "radius is 2\u24dc. Can protect Objectives. Page XX."),
    ("Escort:", "Most ships within 6\". Tie-break on greatest Combined Mass within 6\". Page XX."),
    ("Blockade:", "Greatest Combined Mass within 6\". Tie-break on most ships within 6\". Page XX."),
    ("Gravity Well:", "Jump Points cannot be placed within 9\" of a Planetoid. Units cannot jump within 9\" of a Planetoid."),
]

# Not on the published Quick Reference page, kept from the rulebook because the
# sheet is meant to answer these at the table.
INITIATIVE = [
    "Roll a number of D6 equal to your faction's Initiative value.",
    "Each 2 or 3 is one success; each 1 is two successes.",
    "Most successes wins and chooses who holds Initiative this round. Ties: lowest dice sum wins, then clockwise from the last holder.",
    "Every player who did not win gains +1 CMD token.",
]

COMBAT = [
    "Roll equal to or under Silhouette to hit. Target rolls Shield saves against the dice that hit.",
    "Critical: a natural 1 adds a bonus hit of the same die type. Dud: a die at its max value always misses and is never saved.",
    "Saving throws use the same die type as the weapon; roll equal to or under Shields to deflect.",
]

# ---------------------------------------------------------------------------
# Styles
# ---------------------------------------------------------------------------
BODY_SIZE = 8.2
LEAD = 9.9

body = ParagraphStyle(
    "body", fontName="QR", fontSize=BODY_SIZE, leading=LEAD, textColor=INK2,
    alignment=TA_LEFT, spaceAfter=0,
)
entry = ParagraphStyle("entry", parent=body, leftIndent=8.5, firstLineIndent=-8.5, spaceAfter=3.1)
bullet = ParagraphStyle("bullet", parent=body, leftIndent=8.5, firstLineIndent=-8.5, spaceAfter=3.1)
head = ParagraphStyle(
    "head", fontName="QR-Display", fontSize=9.4, leading=11, textColor=BLUE,
    spaceBefore=0, spaceAfter=3.4,
)


class Rule(Spacer):
    """A hairline under a section heading - the replacement for the black bar."""

    def __init__(self, width=0, thickness=0.7, colour=BLUE, gap=3.0):
        Spacer.__init__(self, width, thickness + gap)
        self.thickness = thickness
        self.colour = colour
        self.gap = gap

    def draw(self):
        self.canv.setStrokeColor(self.colour)
        self.canv.setLineWidth(self.thickness)
        y = self.gap
        self.canv.line(0, y, self.width, y)


def section(title: str):
    return [Paragraph(title.upper(), head), Rule()]


def numbered(rows):
    out = []
    for i, (name, text) in enumerate(rows, 1):
        out.append(Paragraph(
            f'<font color="#fc3d21"><b>{i}</b></font>&nbsp;&nbsp;'
            f'<b><font color="#0a0e14">{name}</font></b> {mass(text)}',
            entry,
        ))
    return out


def listed(rows):
    out = []
    for name, text in rows:
        joiner = "" if text.startswith(":") else " "
        out.append(Paragraph(
            f'<font color="#0b3d91">\u2013</font>&nbsp;&nbsp;'
            f'<b><font color="#0a0e14">{name}</font></b>{joiner}{mass(text)}',
            entry,
        ))
    return out


def plain(items):
    return [
        Paragraph(f'<font color="#0b3d91">\u2013</font>&nbsp;&nbsp;{mass(t)}', bullet)
        for t in items
    ]


def damage_table():
    data = [["DIE", "D6", "D8", "D10", "D12"], ["DMG", "1", "2", "3", "5"]]
    t = Table(data, colWidths=[26, 25, 25, 27, 27], rowHeights=[13, 15])
    t.setStyle(TableStyle([
        ("FONT", (0, 0), (-1, 0), "QR-Bold", 6.6),
        ("FONT", (0, 1), (0, 1), "QR-Bold", 6.6),
        ("FONT", (1, 1), (-1, 1), "QR-Display", 10),
        ("TEXTCOLOR", (0, 0), (-1, 0), INK3),
        ("TEXTCOLOR", (0, 1), (0, 1), INK3),
        ("TEXTCOLOR", (1, 1), (-1, 1), INK),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        # Hairlines only. This grid used to be drawn in full-strength ink.
        ("GRID", (0, 0), (-1, -1), 0.4, HAIR),
        ("LINEBELOW", (0, 0), (-1, 0), 0.6, INK3),
    ]))
    return t


def build():
    register_fonts()
    doc = BaseDocTemplate(
        str(OUT), pagesize=LETTER,
        leftMargin=12 * mm, rightMargin=12 * mm, topMargin=12 * mm, bottomMargin=10 * mm,
        title="A Billion Suns Second Edition - Quick Reference",
        author="A Billion Suns 2e Shipyard",
        subject="Quick Reference",
    )
    gutter = 7 * mm
    col_w = (doc.width - gutter) / 2
    top = doc.bottomMargin + doc.height - 46
    frames = [
        Frame(doc.leftMargin, doc.bottomMargin, col_w, doc.height - 46, id="l",
              leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0),
        Frame(doc.leftMargin + col_w + gutter, doc.bottomMargin, col_w, doc.height - 46, id="r",
              leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0),
    ]

    def masthead(canv, _doc):
        canv.saveState()
        x, y = doc.leftMargin, doc.bottomMargin + doc.height
        # The delta-A: a clean upright triangle, never slanted, no crossbar.
        canv.setStrokeColor(BLUE)
        canv.setLineWidth(2.0)
        p = canv.beginPath()
        p.moveTo(x + 11, y - 4)
        p.lineTo(x + 22, y - 26)
        p.lineTo(x, y - 26)
        p.close()
        canv.drawPath(p, stroke=1, fill=0)
        canv.setFillColor(BLUE)
        canv.setFont("QR-Bold", 7.2)
        canv.drawString(x + 30, y - 10, "A BILLION SUNS  ·  SECOND EDITION")
        canv.setFillColor(INK)
        canv.setFont("QR-Display", 21)
        canv.drawString(x + 29, y - 27, "QUICK REFERENCE")
        # One hairline under the masthead, where a 3pt black bar used to sit.
        canv.setStrokeColor(HAIR)
        canv.setLineWidth(0.7)
        canv.line(doc.leftMargin, y - 36, doc.leftMargin + doc.width, y - 36)
        canv.setFillColor(INK3)
        canv.setFont("QR", 6.4)
        canv.drawRightString(
            doc.leftMargin + doc.width, y - 10,
            "type37.github.io/a-billion-suns-shipyard",
        )
        canv.restoreState()

    doc.addPageTemplates([PageTemplate(id="two", frames=frames, onPage=masthead)])

    story: list = []
    story += section("Round Structure") + numbered(ROUND_STRUCTURE)
    story.append(Spacer(0, 6))
    story += section("Initiative Check") + plain(INITIATIVE)
    story.append(Spacer(0, 6))
    story += section("Activations") + numbered(ACTIVATIONS)
    story.append(Spacer(0, 6))
    story += section("Actions") + listed(ACTIONS)
    story.append(Spacer(0, 6))
    story += section("Commands") + listed(COMMANDS)
    story.append(Spacer(0, 6))
    story += section("Combat") + [KeepTogether(damage_table()), Spacer(0, 5)] + plain(COMBAT)
    story.append(Spacer(0, 6))
    story += section("Rules You Might Forget") + listed(FORGET)

    doc.build(story)
    print(f"wrote {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    build()
