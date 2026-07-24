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

// Position lives on an OUTER group, the animatable class on an inner one.
//
// This split is load-bearing, not tidiness. A CSS `transform` overrides an SVG
// `transform=` presentation attribute outright, so any element that carried both
// its position attribute AND an animation class whose keyframes touch transform
// lost its position the moment the animation applied: dg-roll settles on
// `translateY(0) rotate(0)` and dg-pop on `scale(1)`, both identity matrices,
// and with `animation-fill-mode: both` that identity sticks forever. Every die,
// token and arriving ship collapsed onto the SVG origin and was clipped by the
// corner of the viewBox - which is why the Command and Jump diagrams rendered as
// empty boxes with a single smudge in the top-left. Keeping the two on separate
// elements means the keyframes can own transform completely without the layout
// depending on it.
const SHIP = (x: number, y: number, rot = 0, cls = "dg-ship") =>
  `<g transform="translate(${x} ${y}) rotate(${rot})"><g class="${cls}"><path d="M0 -9 L6 7 L0 4 L-6 7 Z"/></g></g>`;

const LABEL = (x: number, y: number, text: string, cls = "dg-label") =>
  `<text class="${cls}" x="${x}" y="${y}">${text}</text>`;

/** The Command Phase: initiative dice land, then CMD tokens stack up. */
function commandDiagram(): string {
  const die = (i: number, x: number) => `
    <g transform="translate(${x} 44)">
      <g class="dg-die dg-die-${i}">
        <rect x="-13" y="-13" width="26" height="26" rx="4"/>
        <circle class="dg-pip" cx="0" cy="0" r="2.6"/>
      </g>
    </g>`;
  const token = (i: number, x: number) => `
    <g transform="translate(${x} 112)">
      <g class="dg-token dg-token-${i}">
        <circle r="11"/>
        <path class="dg-token-mark" d="M-4.5 0 L0 -5 L4.5 0 L0 5 Z"/>
      </g>
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
 *
 * Drawn as the RTS gesture it is named after, because "drag to select" is a verb
 * players already own from a thousand strategy games and the picture may as well
 * borrow it: a pointer clicks the lead, a click ripple goes out, marquee corners
 * snap open around the bubble, and each ship the ripple reaches turns blue and
 * gains its own selection brackets. The order is the rule - lead first, then
 * whoever is inside 6" - so the timing carries the same information the text does.
 *
 * Every hull is labelled with its Mass, because the Combined Mass limit is half
 * the rule and an unlabelled picture cannot show a sum. 4 + 3 + 2 + 1 = 10 puts
 * the battlegroup exactly on the cap, which is more useful than a comfortable
 * number: the M:2 ship outside the bubble is out on range, and the total tells
 * you it could not have joined on Mass either.
 *
 * One 3600ms cycle drives everything and the per-ship stagger is baked into
 * keyframe percentages rather than animation-delay - a delay on an infinite
 * animation shifts that element's whole loop and the four ships drift out of
 * step with the ripple within a few passes.
 */
function dragSelectDiagram(): string {
  const LEAD_X = 128, LEAD_Y = 100, R6 = 54;

  // Selection brackets: four corner ticks, not a box, so they read as a UI
  // affordance sitting on top of the table rather than another range shape.
  const brackets = (x: number, y: number, cls: string, h = 13, arm = 5) => `
    <g transform="translate(${x} ${y})"><g class="dgs-lock ${cls}">
      <path d="M${-h} ${-h + arm} L${-h} ${-h} L${-h + arm} ${-h}
               M${h - arm} ${-h} L${h} ${-h} L${h} ${-h + arm}
               M${h} ${h - arm} L${h} ${h} L${h - arm} ${h}
               M${-h + arm} ${h} L${-h} ${h} L${-h} ${h - arm}"/>
    </g></g>`;

  const mass = (x: number, y: number, m: number, cls = "dgs-mass") =>
    `<text class="${cls}" x="${x}" y="${y}">M:${m}</text>`;

  return `
  <svg class="learn-dg" viewBox="0 0 320 192" role="img"
       aria-label="Drag to Select: click a lead unit of Mass 4, then drag a selection over the other unactivated units at least partially within six inches of it - Mass 3, Mass 2 and Mass 1 - for a Combined Mass of 10, which is the maximum. A Mass 2 unit further away is out of range and is not selected.">
    <style>
      .learn-dg .dgs-mass { font-family: var(--narrow); font-size: 9.5px; font-weight: 700; fill: var(--ink-2); text-anchor: middle; letter-spacing: 0.03em; }
      .learn-dg .dgs-mass-out { fill: var(--ink-3); }
      .learn-dg .dgs-total { font-family: var(--narrow); font-size: 10px; font-weight: 700; fill: var(--blue); text-anchor: middle; text-transform: uppercase; letter-spacing: 0.04em; }
      .learn-dg .dgs-marq path { fill: none; stroke: var(--blue); stroke-width: 1.6; stroke-linecap: square; }
      .learn-dg .dgs-lock path { fill: none; stroke: var(--blue); stroke-width: 1.4; stroke-linecap: square; }
      .learn-dg .dgs-pulse { fill: none; stroke: var(--blue); stroke-width: 1.5; }
      .learn-dg .dgs-cursor { fill: var(--ink); stroke: var(--paper); stroke-width: 1; stroke-linejoin: round; }

      @keyframes dgs-pulse { 0% { r: 7; opacity: 0.75; } 6% { opacity: 0.7; } 40%, 100% { r: 62; opacity: 0; } }
      @keyframes dgs-click { 0%, 3% { transform: scale(1); } 7% { transform: scale(0.82); } 13%, 100% { transform: scale(1); } }
      @keyframes dgs-marq { 0%, 5% { transform: scale(0.06); opacity: 0; } 11% { opacity: 1; } 26%, 88% { transform: scale(1); opacity: 1; } 96%, 100% { transform: scale(1); opacity: 0; } }
      @keyframes dgs-lock-0 { 0%, 12% { opacity: 0; transform: scale(1.5); } 18%, 90% { opacity: 1; transform: scale(1); } 96%, 100% { opacity: 0; transform: scale(1); } }
      @keyframes dgs-lock-1 { 0%, 22% { opacity: 0; transform: scale(1.5); } 28%, 90% { opacity: 1; transform: scale(1); } 96%, 100% { opacity: 0; transform: scale(1); } }
      @keyframes dgs-lock-2 { 0%, 28% { opacity: 0; transform: scale(1.5); } 34%, 90% { opacity: 1; transform: scale(1); } 96%, 100% { opacity: 0; transform: scale(1); } }
      @keyframes dgs-lock-3 { 0%, 34% { opacity: 0; transform: scale(1.5); } 40%, 90% { opacity: 1; transform: scale(1); } 96%, 100% { opacity: 0; transform: scale(1); } }
      @keyframes dgs-tint-1 { 0%, 22% { fill: var(--ink); } 28%, 90% { fill: var(--blue); } 96%, 100% { fill: var(--ink); } }
      @keyframes dgs-tint-2 { 0%, 28% { fill: var(--ink); } 34%, 90% { fill: var(--blue); } 96%, 100% { fill: var(--ink); } }
      @keyframes dgs-tint-3 { 0%, 34% { fill: var(--ink); } 40%, 90% { fill: var(--blue); } 96%, 100% { fill: var(--ink); } }
      @keyframes dgs-total { 0%, 44% { opacity: 0; } 52%, 92% { opacity: 1; } 98%, 100% { opacity: 0; } }

      .learn-dg .dgs-pulse { animation: dgs-pulse 3600ms ease-out infinite; }
      .learn-dg .dgs-pulse-2 { animation-delay: 260ms; }
      .learn-dg .dgs-cursor { animation: dgs-click 3600ms ease-out infinite; transform-box: fill-box; transform-origin: 10% 6%; }
      .learn-dg .dgs-marq { animation: dgs-marq 3600ms cubic-bezier(0.2, 0.9, 0.3, 1) infinite; }
      .learn-dg .dgs-lock { transform-box: fill-box; transform-origin: center; }
      .learn-dg .dgs-lock-0 { animation: dgs-lock-0 3600ms ease-out infinite; }
      .learn-dg .dgs-lock-1 { animation: dgs-lock-1 3600ms ease-out infinite; }
      .learn-dg .dgs-lock-2 { animation: dgs-lock-2 3600ms ease-out infinite; }
      .learn-dg .dgs-lock-3 { animation: dgs-lock-3 3600ms ease-out infinite; }
      .learn-dg .dgs-catch-1 { animation: dgs-tint-1 3600ms step-end infinite; }
      .learn-dg .dgs-catch-2 { animation: dgs-tint-2 3600ms step-end infinite; }
      .learn-dg .dgs-catch-3 { animation: dgs-tint-3 3600ms step-end infinite; }
      .learn-dg .dgs-total { animation: dgs-total 3600ms ease infinite; }

      /* Motion off: settle on the informative frame - everything inside 6" is
         selected and blue, the ripple is just a ring on the lead. */
      @media (prefers-reduced-motion: reduce) {
        .learn-dg .dg-ship.dgs-catch-1,
        .learn-dg .dg-ship.dgs-catch-2,
        .learn-dg .dg-ship.dgs-catch-3 { fill: var(--blue); }
        .learn-dg .dgs-pulse-2 { display: none; }
      }
    </style>

    ${LABEL(160, 16, "Drag to Select a battlegroup", "dg-title")}
    <circle class="dg-range dg-range-grow" cx="${LEAD_X}" cy="${LEAD_Y}" r="${R6}"/>

    <!-- The click, and the ripple it throws out. -->
    <circle class="dgs-pulse dgs-pulse-1" cx="${LEAD_X}" cy="${LEAD_Y}" r="7"/>
    <circle class="dgs-pulse dgs-pulse-2" cx="${LEAD_X}" cy="${LEAD_Y}" r="7"/>

    <!-- Marquee corners, snapping open from the lead. -->
    <g transform="translate(${LEAD_X} ${LEAD_Y})"><g class="dgs-marq">
      <path d="M-52 -38 L-52 -50 L-40 -50
               M40 -50 L52 -50 L52 -38
               M52 38 L52 50 L40 50
               M-40 50 L-52 50 L-52 38"/>
    </g></g>

    <!-- Every Mass sits 24 below its hull, which clears the selection brackets
         (13 half-height) rather than landing on their bottom corners. "lead" goes
         above its ship for the same reason: below, it ran into the top-left
         bracket of the M:1 ship. -->
    ${LABEL(LEAD_X, LEAD_Y - 22, "lead", "dg-mini")}
    ${brackets(LEAD_X, LEAD_Y, "dgs-lock-0")}
    ${SHIP(LEAD_X, LEAD_Y, 0, "dg-ship dg-lead")}
    ${mass(LEAD_X, LEAD_Y + 24, 4)}

    ${brackets(92, 68, "dgs-lock-1")}
    ${SHIP(92, 68, 15, "dg-ship dgs-catch-1")}
    ${mass(92, 92, 3)}

    ${brackets(166, 66, "dgs-lock-2")}
    ${SHIP(166, 66, -10, "dg-ship dgs-catch-2")}
    ${mass(166, 90, 2)}

    ${brackets(152, 138, "dgs-lock-3")}
    ${SHIP(152, 138, 0, "dg-ship dgs-catch-3")}
    ${mass(152, 162, 1)}

    ${SHIP(266, 104, 0, "dg-ship dg-outside")}
    ${mass(266, 128, 2, "dgs-mass dgs-mass-out")}
    ${LABEL(266, 140, "too far", "dg-mini dg-mini-out")}

    <!-- The pointer sits on the lead, tip on the hull. -->
    <g transform="translate(133 92)">
      <path class="dgs-cursor" d="M0 0 L0 15 L4 11.2 L6.4 16.6 L9.4 15.2 L7 10 L11.6 9.6 Z"/>
    </g>

    <g class="dg-measure" transform="translate(${LEAD_X} ${LEAD_Y})">
      <line x1="0" y1="0" x2="${R6}" y2="0"/>
      <!-- Under the rule, not over it: above the line the figure landed on the
           M:2 of the ship at the top right. -->
      ${LABEL(R6 / 2, 12, '6"', "dg-measure-text")}
    </g>

    <text class="dgs-total" x="160" y="182">Combined Mass 4+3+2+1 = 10 (max 10)</text>
  </svg>`;
}

/**
 * Movement Step. Pivot on the spot by any amount, then move STRAIGHT ahead up to
 * Thrust. The earlier drawing put a curved arc across the middle of the frame,
 * which read as though the ship travelled a curve - it does not, and testers
 * said so. The turn is now shown as a rotation in place at the start line, with
 * the travel drawn as one straight rule to the Thrust mark.
 */
function movementDiagram(): string {
  const START = 62, END = 250, Y = 92;
  return `
  <svg class="learn-dg" viewBox="0 0 320 150" role="img"
       aria-label="Movement Step: pivot on the spot by any amount, then move straight ahead up to the ship's Thrust value.">
    ${LABEL(160, 15, "Pivot on the spot, then move straight", "dg-title")}

    <!-- The turn happens here, before any travel: a rotation marker at the start. -->
    <g class="dg-turnmark" transform="translate(${START} ${Y})">
      <circle class="dg-turn-ring" r="19"/>
      <path class="dg-turn-arrow" d="M0 -19 A19 19 0 0 1 16 -10"/>
    </g>
    ${LABEL(START, Y + 36, "pivot", "dg-mini")}

    <!-- Travel: one straight line, nothing curved. -->
    <line class="dg-straight" x1="${START}" y1="${Y}" x2="${END}" y2="${Y}"/>
    <g class="dg-mover">${SHIP(0, 0, 90, "dg-ship")}</g>

    <g class="dg-measure dg-measure-late" transform="translate(${START} ${Y + 22})">
      <line x1="0" y1="0" x2="${END - START}" y2="0"/>
      <line x1="0" y1="-5" x2="0" y2="5"/>
      <line x1="${END - START}" y1="-5" x2="${END - START}" y2="5"/>
      ${LABEL((END - START) / 2, 16, 'up to Thrust', "dg-measure-text")}
    </g>
  </svg>`;
}

/**
 * Power to Engines: the double move. Spend 1 CMD at the start of the movement
 * step and take the whole step twice - pivot and move, then pivot and move
 * again. Worth its own picture because it is the one command that changes where
 * a ship can physically reach, and the walkthrough never mentioned it.
 */
function doubleMoveDiagram(): string {
  const Y = 96, A = 52, B = 150, C = 250;
  return `
  <svg class="learn-dg" viewBox="0 0 320 150" role="img"
       aria-label="Power to Engines: spend one CMD token at the start of the movement step to take that step twice - pivot and move, then pivot and move again.">
    ${LABEL(160, 15, "Power to Engines — move twice", "dg-title")}
    <line class="dg-straight" x1="${A}" y1="${Y}" x2="${B}" y2="${Y}"/>
    <line class="dg-straight dg-straight-2" x1="${B}" y1="${Y}" x2="${C}" y2="${Y}"/>
    <g class="dg-dbl-mover">${SHIP(0, 0, 90, "dg-ship")}</g>
    <g class="dg-measure" transform="translate(${A} ${Y + 24})">
      <line x1="0" y1="0" x2="${B - A}" y2="0"/>
      <line x1="0" y1="-5" x2="0" y2="5"/>
      <line x1="${B - A}" y1="-5" x2="${B - A}" y2="5"/>
      ${LABEL((B - A) / 2, 16, "Thrust", "dg-measure-text")}
    </g>
    <g class="dg-measure" transform="translate(${B} ${Y + 24})">
      <line x1="0" y1="0" x2="${C - B}" y2="0"/>
      <line x1="${C - B}" y1="-5" x2="${C - B}" y2="5"/>
      ${LABEL((C - B) / 2, 16, "Thrust again", "dg-measure-text")}
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
  // Friendly on the left, hostile on the right, and the movement therefore runs
  // left to right. Every other drawing in this set reads that way round and this
  // one did not, which made it the only diagram where you had to work out which
  // ship was yours before you could read it.
  const EX = 266, EY = 104; // the passive enemy, facing LEFT
  const R = 72; // arc radius

  // An exact half-disc. Both endpoints are (0, -R) and (0, +R) in the enemy's own
  // frame, so the chord between them is the vertical diameter: dead straight, and
  // passing through (0,0), the ship's centre, by construction rather than by eye.
  // sweep-flag 0 bulges the curve towards -x (SVG's y axis points down, so
  // sweep 1 is clockwise on screen and would put the bulge behind the ship); at
  // exactly 180 degrees the large-arc-flag is degenerate and either value gives
  // the same semicircle, so it stays 0. `Z` draws the diameter as a straight
  // closing line - the flat side is a line segment, never a second arc.
  const HALF_DISC = `M0 -${R} A${R} ${R} 0 0 0 0 ${R} Z`;

  // Your unit's path: begins outside the arc, ends inside it. SHIP() points up at
  // rotation 0, so the heading angle is atan2(dx, -dy). The run from (46,150) to
  // (206,104) is dx +160, dy -46, which is +74deg; 76 splits the difference with
  // the shallower final leg.
  const END_X = 206, END_Y = 104;

  return `
  <svg class="learn-dg" viewBox="0 0 340 186" role="img"
       aria-label="Passive Attacks Step: your unit moves from the left into the 180 degree auxiliary arc of an unactivated enemy on the right, and that enemy fires its auxiliary weapons at it. A second enemy is facing away: it is in range but your unit is behind it, so it does not fire.">
    <style>
      .learn-dg .dgp-arc-edge { fill: none; stroke: var(--red); stroke-width: 1; stroke-opacity: 0.55; }
      .learn-dg .dgp-arc-dia { stroke: var(--red); stroke-width: 1.2; stroke-opacity: 0.8; }
      @keyframes dgp-move {
        0%, 10% { transform: translate(-160px, 46px); }
        55%, 100% { transform: translate(0px, 0px); }
      }
      .learn-dg .dgp-mover { animation: dgp-move 3200ms ease-in-out infinite; }
    </style>

    ${LABEL(170, 15, "Move into an enemy's AUX arc and it fires", "dg-title")}

    <!-- Passive enemy, facing left: its auxiliary arc is the 180 degrees ahead of
         it, drawn as an exact half-disc with its diameter on the hull's centre. -->
    <g transform="translate(${EX} ${EY})">
      <path class="dg-arc-fill dg-arc-aux" d="${HALF_DISC}"/>
      <path class="dgp-arc-edge" d="${HALF_DISC}"/>
      <line class="dgp-arc-dia" x1="0" y1="-${R}" x2="0" y2="${R}"/>
      ${SHIP(0, 0, -90, "dg-ship dg-enemy")}
      ${LABEL(0, 30, "passive", "dg-mini")}
    </g>
    ${LABEL(228, 58, 'AUX 180°', "dg-mini dg-mini-arc")}

    <!-- In range, but facing away: no arc, no attack. Both enemies face the same
         way; the only difference is which side of them you finish on, which is
         exactly the rule. Your unit ends at ${END_X},${END_Y} - behind this one. -->
    <g transform="translate(108 48)">
      ${SHIP(0, 0, -90, "dg-ship dg-enemy dg-enemy-away")}
      ${LABEL(0, 26, "facing away — no shot", "dg-mini dg-mini-out")}
    </g>

    <path class="dg-path" d="M46 150 L146 118 L${END_X} ${END_Y}"/>
    <g transform="translate(${END_X} ${END_Y})">
      <g class="dgp-mover">${SHIP(0, 0, 76, "dg-ship")}</g>
    </g>
    ${LABEL(54, 170, "your unit moves", "dg-mini")}

    <!-- Fire only once the mover is inside the arc. -->
    <g class="dg-passive-shots">
      <line class="dg-shot dg-pshot-1" x1="252" y1="100" x2="214" y2="102"/>
      <line class="dg-shot dg-pshot-2" x1="252" y1="108" x2="214" y2="108"/>
    </g>
  </svg>`;
}

/**
 * Action Step: one action, Open Fire shown as the common case.
 *
 * The dice used to be four rounded squares with one 2.2px pip in the middle of
 * each, which is a die face showing 1 - four times - and at the size this
 * renders it read as four empty boxes. They now carry real pip layouts for the
 * values they rolled, and the values are chosen against the target's Silhouette
 * so the picture states the rule instead of gesturing at it: a ship's Silhouette
 * is the highest roll on an attack die that counts as a hit, so against
 * Silhouette 4 the 2 and the 4 hit and the 5 and the 6 miss. Both hulls are
 * labelled with their own Silhouette, because "roll under Silhouette" is
 * ambiguous until you can see there are two of them and only the target's
 * matters.
 */
function actionDiagram(): string {
  // Pip layout on the usual 3x3 grid. Values are drawn, not counted, so a face
  // is always the arrangement a real die shows.
  const PIPS: Record<number, Array<[number, number]>> = {
    1: [[0, 0]],
    2: [[-1, -1], [1, 1]],
    3: [[-1, -1], [0, 0], [1, 1]],
    4: [[-1, -1], [1, -1], [-1, 1], [1, 1]],
    5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]],
    6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]],
  };

  const HALF = 14, GAP = 6.5, PIP = 2.9;
  const die = (i: number, x: number, y: number, value: number, hit: boolean) => {
    const pips = (PIPS[value] ?? [])
      .map(([px, py]) => `<circle cx="${px * GAP}" cy="${py * GAP}" r="${PIP}"/>`)
      .join("");
    const cls = hit ? "dgof-die dgof-hit" : "dgof-die dgof-miss";
    return `
    <g transform="translate(${x} ${y})">
      <g class="dg-die dg-die-${i} ${cls}">
        <rect x="-${HALF}" y="-${HALF}" width="${HALF * 2}" height="${HALF * 2}" rx="4"/>
        <g class="dgof-pips">${pips}</g>
      </g>
    </g>
    <text class="dgof-tag ${hit ? "dgof-tag-hit" : "dgof-tag-miss"}" x="${x}" y="${y + 28}">${hit ? "hit" : "miss"}</text>`;
  };

  const ATK_SIL = 3, DEF_SIL = 4;
  const ROLLS: Array<[number, boolean]> = [
    [2, 2 <= DEF_SIL],
    [4, 4 <= DEF_SIL],
    [5, 5 <= DEF_SIL],
    [6, 6 <= DEF_SIL],
  ];
  const DICE_Y = 128;
  const dice = ROLLS.map(([v, hit], i) => die(i + 1, 88 + i * 48, DICE_Y, v, hit)).join("");

  return `
  <svg class="learn-dg" viewBox="0 0 320 176" role="img"
       aria-label="Action Step: take one action. Open Fire attacks with every weapon system. Your ship of Silhouette 3 fires at an enemy of Silhouette 4: a ship's Silhouette is the highest roll on an attack die that counts as a hit, so of the four dice rolled - 2, 4, 5 and 6 - the 2 and the 4 hit and the 5 and the 6 miss.">
    <style>
      .learn-dg .dgof-die rect { fill: var(--paper); stroke: var(--ink); stroke-width: 1.6; }
      .learn-dg .dgof-die .dgof-pips circle { fill: var(--ink); }
      .learn-dg .dgof-hit rect { stroke: var(--blue); stroke-width: 2; }
      .learn-dg .dgof-hit .dgof-pips circle { fill: var(--blue); }
      .learn-dg .dgof-miss rect { stroke: var(--ink-3); stroke-width: 1.4; }
      .learn-dg .dgof-miss .dgof-pips circle { fill: var(--ink-3); }
      .learn-dg .dgof-miss { opacity: 0.65; }
      .learn-dg .dgof-tag { font-family: var(--narrow); font-size: 9.5px; font-weight: 700; text-anchor: middle; text-transform: uppercase; letter-spacing: 0.05em; }
      .learn-dg .dgof-tag-hit { fill: var(--blue); }
      .learn-dg .dgof-tag-miss { fill: var(--ink-3); }
      .learn-dg .dgof-sil { font-family: var(--narrow); font-size: 9.5px; font-weight: 700; text-anchor: middle; letter-spacing: 0.03em; fill: var(--ink-2); }
      .learn-dg .dgof-sil-t { fill: var(--red); }
      /* The shared .dg-shot dash is cut for a 138px beam; this one is 154. */
      .learn-dg .dgof-beam { stroke-dasharray: 160; }
    </style>

    ${LABEL(160, 15, "Take one Action — here, Open Fire", "dg-title")}

    <g transform="translate(66 58)">
      <path class="dg-arc-fill dg-arc-pri" d="M0 0 L74 -31 L74 31 Z"/>
      ${SHIP(0, 0, 90, "dg-ship")}
    </g>
    <text class="dgof-sil" x="66" y="82">SIL ${ATK_SIL}</text>
    ${LABEL(66, 94, "attacker", "dg-mini")}

    ${SHIP(244, 58, -90, "dg-ship dg-enemy")}
    <text class="dgof-sil dgof-sil-t" x="244" y="82">SIL ${DEF_SIL}</text>
    ${LABEL(244, 94, "target", "dg-mini")}

    <line class="dg-shot dg-shot-1 dgof-beam" x1="80" y1="58" x2="234" y2="58"/>
    ${LABEL(160, 108, "roll equal to or under the target's Silhouette", "dg-mini")}
    ${dice}
  </svg>`;
}

/**
 * The tutorial table as a dimensioned setup drawing rather than a sketch.
 *
 * The job of this one picture is that after reading the Setup paragraph once you
 * can lay out a real table without going back to the text. That means every
 * number in the paragraph has to appear ON the drawing: the 48x36 table, the 5"
 * inset to the flank Jump Points, the 24" between them, the 15" to the central
 * one. The previous version drew the positions correctly but dimensioned none of
 * them, so it could show you roughly where things went and never how far.
 *
 * Two things were removed to make room for those dimensions. The 6" deployment
 * bubble is drawn on each of the six Jump Points no longer - six overlapping
 * 42px halos turned the middle of the table into mud, and the 6" rule is taught
 * properly on the Jump page where it belongs. The 9" ring around the objective
 * went too: that is the Gravity Well, which has its own diagram and only applies
 * at all if the objective happens to roll up as a Planetoid.
 *
 * Only YOUR half is dimensioned. The opponent's three points are the mirror of
 * yours, so dimensioning them twice doubles the ink for no extra information.
 *
 * Dimensions are drawn against features already on the drawing - the 15" runs up
 * the centreline, the 5" up the flank point's own column - so no extension lines
 * have to be dragged across the table to reach a margin.
 */
function deploymentMap(): string {
  const IN = 9; // px per table inch
  const W = 48 * IN, H = 36 * IN;
  const x = (i: number) => i * IN;
  const y = (i: number) => i * IN;

  // 24" apart, centred on the 48" width: 12" and 36".
  const FLANK_L = x(12), FLANK_R = x(36), CENTRE = x(24);
  const yFlank = y(31), yCentral = y(21); // 5" and 15" in from your edge (y=36")

  const dimH = (x1: number, x2: number, yy: number, label: string, ly: number) => `
    <g class="dg-dim">
      <line x1="${x1}" y1="${yy}" x2="${x2}" y2="${yy}"/>
      <line x1="${x1}" y1="${yy - 4}" x2="${x1}" y2="${yy + 4}"/>
      <line x1="${x2}" y1="${yy - 4}" x2="${x2}" y2="${yy + 4}"/>
      <text class="dg-dim-t" x="${(x1 + x2) / 2}" y="${ly}">${label}</text>
    </g>`;
  const dimV = (y1: number, y2: number, xx: number, label: string, lx: number, ly: number) => `
    <g class="dg-dim">
      <line x1="${xx}" y1="${y1}" x2="${xx}" y2="${y2}"/>
      <line x1="${xx - 4}" y1="${y1}" x2="${xx + 4}" y2="${y1}"/>
      <line x1="${xx - 4}" y1="${y2}" x2="${xx + 4}" y2="${y2}"/>
      <text class="dg-dim-t dg-dim-t-s" x="${lx}" y="${ly}">${label}</text>
    </g>`;
  const jp = (cx: number, cy: number, cls: string) =>
    `<g class="dg-jp ${cls}" transform="translate(${cx} ${cy})"><circle class="dg-jp-dot" r="5"/></g>`;

  return `
  <svg class="learn-dg learn-map" viewBox="-42 -26 ${W + 84} ${H + 122}" role="img"
       aria-label="Tutorial table setup, dimensioned. The table is 48 inches by 36 inches. Your three jump points: two flank points 5 inches in from your own table edge and 24 inches apart from each other, and a central point 15 inches in from your edge on the centreline. A central objective sits in the middle of the table. Your opponent's three jump points mirror yours from the opposite edge.">
    <rect class="dg-map-table" x="0" y="0" width="${W}" height="${H}"/>
    <line class="dg-map-centre" x1="${CENTRE}" y1="0" x2="${CENTRE}" y2="${H}"/>

    <!-- Opponent's half: the mirror of yours, stated once rather than dimensioned. -->
    ${jp(FLANK_L, y(5), "dg-them")}${jp(FLANK_R, y(5), "dg-them")}${jp(CENTRE, y(15), "dg-them")}
    <text class="dg-map-note" x="${CENTRE}" y="${y(8)}">opponent's 3 points mirror yours</text>

    <!-- Central objective, labelled out to the left so it clears the two central
         Jump Points that sit 3" above and below it. -->
    <g transform="translate(${CENTRE} ${y(18)})">
      <circle class="dg-obj-core" r="7"/>
      <line class="dg-leader" x1="-9" y1="0" x2="-72" y2="0"/>
      <text class="dg-map-lbl-e" x="-78" y="4">central objective</text>
    </g>

    <!-- Your half. -->
    ${jp(FLANK_L, yFlank, "dg-you")}${jp(FLANK_R, yFlank, "dg-you")}${jp(CENTRE, yCentral, "dg-you")}
    <g transform="translate(${CENTRE} ${yCentral})">
      <line class="dg-leader" x1="9" y1="0" x2="66" y2="0"/>
      <text class="dg-map-lbl-s" x="72" y="4">central jump point</text>
    </g>
    <text class="dg-map-lbl" x="${FLANK_L}" y="${yFlank - 21}">flank jump point</text>
    <text class="dg-map-lbl" x="${FLANK_R}" y="${yFlank - 21}">flank jump point</text>

    ${dimH(FLANK_L, FLANK_R, yFlank, '24&quot;', yFlank - 7)}
    ${dimV(yFlank, H, FLANK_L, '5&quot;', FLANK_L + 8, yFlank + 28)}
    ${dimV(yCentral, H, CENTRE, '15&quot;', CENTRE + 8, yCentral + 46)}

    <text class="dg-map-edge" x="${CENTRE}" y="${H + 18}">your table edge</text>
    <text class="dg-map-edge" x="${CENTRE}" y="-11">opponent's edge</text>
    ${dimH(0, W, H + 42, '48&quot; (4 ft)', H + 36)}
    <g class="dg-dim">
      <line x1="-24" y1="0" x2="-24" y2="${H}"/>
      <line x1="-28" y1="0" x2="-20" y2="0"/>
      <line x1="-28" y1="${H}" x2="-20" y2="${H}"/>
      <text class="dg-dim-t" x="-24" y="${H / 2}" transform="rotate(-90 -24 ${H / 2})" dy="-6">36&quot; (3 ft)</text>
    </g>
  </svg>`;
}

/**
 * Gravity Well: no Jump Point may be placed, and no jumping may happen, within
 * 9" of a Planetoid. Drawn at the same 7px-per-inch scale as the table map, so
 * the 9" exclusion reads as the large area it actually is.
 */
function gravityWellDiagram(): string {
  const IN = 7;
  return `
  <svg class="learn-dg" viewBox="0 0 320 190" role="img"
       aria-label="Gravity Well: no jump point may be placed, and no jumping may happen, within nine inches of a planetoid.">
    ${LABEL(160, 15, 'Gravity Well — 9" around a Planetoid', "dg-title")}
    <g transform="translate(150 104)">
      <circle class="dg-well" r="${9 * IN}"/>
      <circle class="dg-planetoid" r="17"/>
      ${LABEL(0, 5, "", "dg-mini")}
      <g class="dg-measure">
        <line x1="0" y1="0" x2="${9 * IN}" y2="0"/>
        ${LABEL(32, -6, '9"', "dg-measure-text")}
      </g>
    </g>
    ${LABEL(150, 148, "planetoid", "dg-mini")}
    <g class="dg-jp dg-jp-bad" transform="translate(196 74)">
      <circle class="dg-jp-dot" r="5"/>
      <path class="dg-no" d="M-7 -7 L7 7 M7 -7 L-7 7"/>
    </g>
    ${LABEL(226, 62, "no jump point", "dg-mini dg-mini-out")}
    <g class="dg-jp" transform="translate(285 150)">
      <circle class="dg-jp-dot" r="5"/>
    </g>
    ${LABEL(285, 170, "fine", "dg-mini")}
  </svg>`;
}

/**
 * Jump Strain: a unit jumps once per round and picks which kind. Three routes,
 * one choice - the rule most easily missed, because each of the three reads
 * like an independent option elsewhere in the reference.
 */
// Stacked vertically, not in a row. Side by side, each option got a 92px-wide
// box in a 320-unit viewBox, and "to another Sector" measures 117 units at this
// font - so the middle label burst its own box by 13 units at each end and ran
// into the boxes either side of it, which is what made this diagram read as
// broken and cut off. Down the page each row has the full width to itself, so no
// label can outgrow its box however long the wording gets.
function jumpStrainDiagram(): string {
  const opt = (i: number, y: number, title: string, sub: string) => `
    <g class="dg-strain dg-strain-${i}" transform="translate(0 ${y})">
      <rect class="dg-strain-box" x="26" y="-17" width="268" height="34" rx="3"/>
      <text class="dg-strain-t" x="42" y="5">${title}</text>
      <text class="dg-strain-s" x="278" y="4">${sub}</text>
    </g>`;
  return `
  <svg class="learn-dg" viewBox="0 0 320 182" role="img"
       aria-label="Jump Strain: a unit may only jump once per round. Choose one of Jump In from Reserves, Jump Hop to another Sector, or Jump Out to Reserves.">
    ${LABEL(160, 16, "One jump per unit, per round", "dg-title")}
    ${opt(1, 48, "Jump In", "from Reserves")}
    ${opt(2, 92, "Jump Hop", "to another Sector")}
    ${opt(3, 136, "Jump Out", "to Reserves")}
    ${LABEL(160, 172, "pick one", "dg-mini")}
  </svg>`;
}

const DIAGRAMS: Record<string, () => string> = {
  deployment: deploymentMap,
  "gravity-well": gravityWellDiagram,
  "jump-strain": jumpStrainDiagram,
  command: commandDiagram,
  jump: jumpDiagram,
  "drag-select": dragSelectDiagram,
  "double-move": doubleMoveDiagram,
  movement: movementDiagram,
  passive: passiveDiagram,
  action: actionDiagram,
};

/** A named Learn to Play diagram, or an empty string if the name is unknown. */
export function learnDiagram(kind: string): string {
  return DIAGRAMS[kind]?.() ?? "";
}
