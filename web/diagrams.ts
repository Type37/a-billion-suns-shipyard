// Vector diagrams for the Learn to Play walkthrough.
//
// Each one animates, because the things being explained are movements: dice
// being rolled, a unit arriving through a jump point, a battlegroup being drawn
// around a lead ship, a hull pivoting and running forward. A static picture of a
// pivot is just an arrow, and an arrow is what the text already says.
//
// All motion is CSS (see the `learn-anim` rules in style.css) so it can be
// switched off wholesale under prefers-reduced-motion - at which point every
// diagram still reads as a labelled still, because the end state is the
// informative one and that is what the animation settles on.
//
// Geometry is drawn to scale where a distance is the point: the 6" bubbles in
// the jump and battlegroup diagrams use one unit = 4px, so a 6" radius is 24px
// against a 24px-wide hull, which is roughly the ratio on a real table.

const SHIP = (x: number, y: number, rot = 0, cls = "dg-ship") =>
  `<g class="${cls}" transform="translate(${x} ${y}) rotate(${rot})"><path d="M0 -9 L6 7 L0 4 L-6 7 Z"/></g>`;

const LABEL = (x: number, y: number, text: string, cls = "dg-label") =>
  `<text class="${cls}" x="${x}" y="${y}">${text}</text>`;

/** The Command Phase: initiative dice land, then CMD tokens stack up. */
function commandDiagram(): string {
  const die = (i: number, x: number) => `
    <g class="dg-die dg-die-${i}" transform="translate(${x} 44)">
      <rect x="-13" y="-13" width="26" height="26" rx="4"/>
      <circle class="dg-pip" cx="0" cy="0" r="2.6"/>
    </g>`;
  const token = (i: number, x: number) => `
    <g class="dg-token dg-token-${i}" transform="translate(${x} 112)">
      <circle r="11"/>
      <path class="dg-token-mark" d="M-4.5 0 L0 -5 L4.5 0 L0 5 Z"/>
    </g>`;
  return `
  <svg class="learn-dg" viewBox="0 0 320 150" role="img"
       aria-label="The Command Phase: roll your initiative dice, then take your command tokens for the round.">
    ${LABEL(160, 16, "1 · Roll your Initiative", "dg-title")}
    ${die(1, 110)}${die(2, 160)}${die(3, 210)}
    ${LABEL(160, 82, "2 · Take your CMD tokens", "dg-title")}
    ${token(1, 118)}${token(2, 146)}${token(3, 174)}${token(4, 202)}
  </svg>`;
}

/**
 * The Jump Phase: a jump point opens, then a unit arrives anywhere inside its
 * 6" bubble. The bubble is the rule - "deploy within 6 inches of a friendly
 * Jump Point" - so it is drawn to scale rather than suggested.
 */
function jumpDiagram(): string {
  return `
  <svg class="learn-dg" viewBox="0 0 320 170" role="img"
       aria-label="The Jump Phase: open a jump point, then deploy a unit wholly within six inches of it.">
    ${LABEL(160, 16, "Open a Jump Point, then Jump In", "dg-title")}
    <circle class="dg-range dg-range-grow" cx="160" cy="95" r="52"/>
    <g class="dg-jumppoint" transform="translate(160 95)">
      <circle class="dg-jp-core" r="9"/>
      <circle class="dg-jp-ring" r="9"/>
    </g>
    ${SHIP(122, 74, -20, "dg-ship dg-arrive dg-arrive-1")}
    ${SHIP(196, 78, 25, "dg-ship dg-arrive dg-arrive-2")}
    ${SHIP(160, 128, 0, "dg-ship dg-arrive dg-arrive-3")}
    <g class="dg-measure" transform="translate(160 95)">
      <line x1="0" y1="0" x2="52" y2="0"/>
      ${LABEL(26, -6, '6"', "dg-measure-text")}
    </g>
  </svg>`;
}

/**
 * Drag to Select: a lead unit, everything unactivated within 6" of it, and a
 * Combined Mass of 10 or less. The ship outside the bubble stays grey to show
 * the boundary is the rule, not a suggestion.
 */
function dragSelectDiagram(): string {
  return `
  <svg class="learn-dg" viewBox="0 0 320 170" role="img"
       aria-label="Drag to Select: a lead unit plus unactivated units within six inches of it, to a combined mass of ten or less.">
    ${LABEL(160, 16, "Drag to Select a battlegroup", "dg-title")}
    <circle class="dg-range dg-range-grow" cx="132" cy="96" r="54"/>
    ${SHIP(132, 96, 0, "dg-ship dg-lead")}
    ${LABEL(132, 118, "lead", "dg-mini")}
    ${SHIP(96, 70, 15, "dg-ship dg-picked dg-picked-1")}
    ${SHIP(170, 68, -10, "dg-ship dg-picked dg-picked-2")}
    ${SHIP(150, 134, 0, "dg-ship dg-picked dg-picked-3")}
    ${SHIP(268, 104, 0, "dg-ship dg-outside")}
    ${LABEL(268, 126, "too far", "dg-mini dg-mini-out")}
    <g class="dg-measure" transform="translate(132 96)">
      <line x1="0" y1="0" x2="54" y2="0"/>
      ${LABEL(27, -6, '6"', "dg-measure-text")}
    </g>
  </svg>`;
}

/** Movement Step: pivot on the spot by any amount, then run straight ahead. */
function movementDiagram(): string {
  return `
  <svg class="learn-dg" viewBox="0 0 320 150" role="img"
       aria-label="Movement Step: pivot any amount on the spot, then move straight ahead up to the ship's Thrust value.">
    ${LABEL(160, 16, "Pivot, then move up to Thrust", "dg-title")}
    <path class="dg-track" d="M60 96 L250 96"/>
    <g class="dg-pivot-arc" transform="translate(60 96)">
      <path d="M0 -26 A26 26 0 0 1 22 -14"/>
    </g>
    <g class="dg-mover">${SHIP(0, 0, 90, "dg-ship")}</g>
    <g class="dg-measure dg-measure-late" transform="translate(60 118)">
      <line x1="0" y1="0" x2="190" y2="0"/>
      <line x1="0" y1="-5" x2="0" y2="5"/>
      <line x1="190" y1="-5" x2="190" y2="5"/>
      ${LABEL(95, 16, "Thrust", "dg-measure-text")}
    </g>
  </svg>`;
}

/**
 * Passive Attacks Step. The rule is specific and the old drawing was not: a
 * passive (unactivated) enemy fires when an active unit moves THROUGH or ENDS
 * IN the range and arc of its AUXILIARY weapons - the 180 degree front arc, not
 * a generic wedge. So the diagram has to show the movement causing it: your
 * unit's path starts clear of the arc and ends inside it, and the shots only
 * appear once it is in there. A second enemy is drawn facing away, in range but
 * arc-excluded, because "in range AND arc" is two conditions and a picture with
 * one enemy cannot show that.
 */
function passiveDiagram(): string {
  return `
  <svg class="learn-dg" viewBox="0 0 340 186" role="img"
       aria-label="Passive Attacks Step: an unactivated enemy fires its auxiliary weapons at your unit when your unit moves through or ends inside that enemy's 180 degree auxiliary arc. An enemy facing away does not fire, even in range.">
    ${LABEL(170, 15, "Move into an enemy's AUX arc and it fires", "dg-title")}

    <!-- Passive enemy, facing right: its auxiliary arc is the 180 degrees ahead. -->
    <g transform="translate(74 104)">
      <path class="dg-arc-fill dg-arc-aux" d="M0 -72 A72 72 0 0 1 0 72 Z"/>
      ${SHIP(0, 0, 90, "dg-ship dg-enemy")}
      ${LABEL(0, 30, "passive", "dg-mini")}
    </g>
    ${LABEL(120, 52, 'AUX 180°', "dg-mini dg-mini-arc")}

    <!-- Your unit's path: begins outside the arc, ends inside it. -->
    <path class="dg-path" d="M300 150 L196 118 L134 104"/>
    <g class="dg-passive-mover">${SHIP(0, 0, -110, "dg-ship")}</g>
    ${LABEL(300, 168, "your unit moves", "dg-mini")}

    <!-- Fire only once the mover is inside the arc. -->
    <g class="dg-passive-shots">
      <line class="dg-shot dg-pshot-1" x1="88" y1="100" x2="128" y2="102"/>
      <line class="dg-shot dg-pshot-2" x1="88" y1="108" x2="128" y2="108"/>
    </g>

    <!-- In range, but facing away: no arc, no attack. -->
    <g transform="translate(232 48)">
      ${SHIP(0, 0, -90, "dg-ship dg-enemy dg-enemy-away")}
      ${LABEL(0, 26, "facing away — no shot", "dg-mini dg-mini-out")}
    </g>
  </svg>`;
}

/** Action Step: one action, Open Fire shown as the common case. */
function actionDiagram(): string {
  const die = (i: number, x: number) => `
    <g class="dg-die dg-die-${i}" transform="translate(${x} 112)">
      <rect x="-11" y="-11" width="22" height="22" rx="3.5"/>
      <circle class="dg-pip" cx="0" cy="0" r="2.2"/>
    </g>`;
  return `
  <svg class="learn-dg" viewBox="0 0 320 150" role="img"
       aria-label="Action Step: take one action. Open Fire attacks with all weapon systems, rolling equal to or under Silhouette to hit.">
    ${LABEL(160, 16, "Take one Action — here, Open Fire", "dg-title")}
    <g transform="translate(70 62)">
      <path class="dg-arc-fill dg-arc-pri" d="M0 0 L74 -31 L74 31 Z"/>
      ${SHIP(0, 0, 90, "dg-ship")}
    </g>
    ${SHIP(232, 62, -90, "dg-ship dg-enemy")}
    <line class="dg-shot dg-shot-1" x1="84" y1="62" x2="222" y2="62"/>
    ${LABEL(160, 92, "roll under Silhouette to hit", "dg-mini")}
    ${die(1, 122)}${die(2, 150)}${die(3, 178)}${die(4, 206)}
  </svg>`;
}

/**
 * The tutorial table, drawn to the scenario's own measurements rather than
 * sketched: 48" by 36", flank Jump Points at the side edges 5" in from your own
 * edge and 24" apart, the central one 15" in on the centreline, objective in the
 * middle. One inch = 7px, so the 6" deployment bubbles and the 9" Gravity Well
 * around a Planetoid are true to each other and to the table.
 */
function deploymentMap(): string {
  const IN = 7; // px per table inch
  const W = 48 * IN, H = 36 * IN;
  const x = (i: number) => i * IN;
  const y = (i: number) => i * IN;
  // Your edge is the bottom. Flank points sit on the side edges 5" in; the
  // central point 15" in on the centreline. Mirrored for the opponent.
  const side = (bottom: boolean) => {
    const edge = bottom ? 36 : 0;
    const dir = bottom ? -1 : 1;
    const cls = bottom ? "dg-you" : "dg-them";
    const flankY = edge + dir * 5;
    const centreY = edge + dir * 15;
    const jp = (cx: number, cy: number, label: string) => `
      <g class="dg-jp ${cls}" transform="translate(${x(cx)} ${y(cy)})">
        <circle class="dg-jp-halo" r="${6 * IN}"/>
        <circle class="dg-jp-dot" r="5"/>
        <text class="dg-map-lbl" y="-${6 * IN + 5}">${label}</text>
      </g>`;
    // 24" apart, centred on the 48" width: 12" and 36".
    return jp(12, flankY, "flank") + jp(36, flankY, "flank") + jp(24, centreY, "central");
  };
  return `
  <svg class="learn-dg learn-map" viewBox="-14 -22 ${W + 28} ${H + 44}" role="img"
       aria-label="Tutorial table setup: a 48 by 36 inch table, three jump points per player, and a central objective. Flank jump points sit on the side edges 5 inches in from your own edge and 24 inches apart; the central jump point is 15 inches in on the centreline.">
    <rect class="dg-map-table" x="0" y="0" width="${W}" height="${H}"/>
    <line class="dg-map-centre" x1="${x(24)}" y1="0" x2="${x(24)}" y2="${H}"/>
    ${side(false)}
    ${side(true)}
    <g class="dg-objective" transform="translate(${x(24)} ${y(18)})">
      <circle class="dg-obj-well" r="${9 * IN}"/>
      <circle class="dg-obj-core" r="8"/>
      <text class="dg-map-lbl" y="-${9 * IN + 5}">central objective</text>
    </g>
    <text class="dg-map-edge" x="${x(24)}" y="${H + 17}">your table edge</text>
    <text class="dg-map-edge" x="${x(24)}" y="-9">opponent's edge</text>
    <g class="dg-map-scale" transform="translate(0 ${H + 4})">
      <line x1="${x(0)}" y1="0" x2="${x(6)}" y2="0"/>
      <line x1="${x(0)}" y1="-4" x2="${x(0)}" y2="4"/>
      <line x1="${x(6)}" y1="-4" x2="${x(6)}" y2="4"/>
      <text class="dg-map-lbl" x="${x(3)}" y="14">6"</text>
    </g>
  </svg>`;
}

const DIAGRAMS: Record<string, () => string> = {
  deployment: deploymentMap,
  command: commandDiagram,
  jump: jumpDiagram,
  "drag-select": dragSelectDiagram,
  movement: movementDiagram,
  passive: passiveDiagram,
  action: actionDiagram,
};

/** A named Learn to Play diagram, or an empty string if the name is unknown. */
export function learnDiagram(kind: string): string {
  return DIAGRAMS[kind]?.() ?? "";
}
