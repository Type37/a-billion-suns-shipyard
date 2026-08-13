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
const SHIP = (x: number, y: number, rot = 0, cls = "dg-ship", scale = 1) =>
  `<g transform="translate(${x} ${y}) rotate(${rot})${scale === 1 ? "" : ` scale(${scale})`}"><g class="${cls}"><path d="M0 -9 L6 7 L0 4 L-6 7 Z"/></g></g>`;

const LABEL = (x: number, y: number, text: string, cls = "dg-label") =>
  `<text class="${cls}" x="${x}" y="${y}">${text}</text>`;

/**
 * Gaining CMD tokens: they arrive at the top of the round, and they are spent.
 *
 * This and initiativeDiagram used to be one picture with a "1 - Roll your
 * Initiative" half and a "2 - Take your CMD tokens" half stacked in one box.
 * The Command Phase page puts those two things under their own headings now,
 * several screens apart, so one diagram could only ever sit under the wrong
 * half of it.
 */
function cmdGainDiagram(): string {
  const token = (i: number, x: number) => `
    <g transform="translate(${x} 66)">
      <g class="dg-token dg-token-${i}">
        <circle r="14"/>
        <path class="dg-token-mark" d="M-5.5 0 L0 -6.5 L5.5 0 L0 6.5 Z"/>
      </g>
    </g>`;
  return `
  <svg class="learn-dg" viewBox="0 0 320 116" role="img"
       aria-label="Gaining CMD tokens: at the start of the round you take the number of command tokens your faction gives you.">
    ${LABEL(160, 18, "Take your CMD tokens", "dg-title")}
    ${token(1, 92)}${token(2, 128)}${token(3, 164)}${token(4, 200)}${token(5, 236)}
    ${LABEL(160, 104, "Your faction says how many", "dg-measure-text")}
  </svg>`;
}

/**
 * The Initiative Check: roll low.
 *
 * Every die is drawn with its face value, because "each roll of a 2 or 3 counts
 * as one success; each roll of a 1 counts as two successes" is a rule about
 * numbers and a picture of blank dice cannot show it. Two hits, one double, one
 * miss - which is also a legible score to put under it.
 */
function initiativeDiagram(): string {
  const die = (i: number, x: number, pips: string, cls: string, note: string) => `
    <g transform="translate(${x} 52)">
      <g class="dg-die dg-die-${i} ${cls}">
        <rect x="-17" y="-17" width="34" height="34" rx="5"/>
        ${pips}
      </g>
    </g>
    <g class="dg-die-note dg-die-${i}">${LABEL(x, 88, note, "dg-measure-text")}</g>`;
  const pip = (x: number, y: number) => `<circle class="dg-pip" cx="${x}" cy="${y}" r="3"/>`;
  return `
  <svg class="learn-dg" viewBox="0 0 320 108" role="img"
       aria-label="An Initiative Check: roll low. A 1 is two successes, a 2 or a 3 is one success, and anything higher is nothing.">
    ${LABEL(160, 16, "Roll low", "dg-title")}
    ${die(1, 66, pip(0, 0), "is-crit", "1 = two")}
    ${die(2, 128, pip(-7, -7) + pip(7, 7), "is-hit", "2 = one")}
    ${die(3, 190, pip(-7, -7) + pip(0, 0) + pip(7, 7), "is-hit", "3 = one")}
    ${die(4, 252, pip(-7, -7) + pip(7, -7) + pip(-7, 7) + pip(7, 7) + pip(0, 0), "is-miss", "5 = nothing")}
  </svg>`;
}

/**
 * Opening a Jump Point, on its own.
 *
 * This and jumpInDiagram used to be one picture that opened a point and landed
 * three ships in a single loop. They are two different turns you can take in
 * the Jump Phase - you either open a point OR jump a unit in, never both - and
 * drawing them together said the opposite of the rule they illustrate.
 *
 * What this one has to show is that the point comes out of a finite supply and
 * can go anywhere: a token leaves the tray on the left, crosses open space and
 * settles, and the tray is visibly one token shorter for the rest of the loop.
 */
function jumpPointDiagram(): string {
  return `
  <svg class="learn-dg" viewBox="0 0 320 178" role="img"
       aria-label="Opening a Jump Point: take a token from your supply and place it into play, anywhere you like on any table, as long as it is more than nine inches from a planetoid.">
    ${LABEL(160, 16, "Open a Jump Point", "dg-title")}

    <!-- The 9" gravity well, drawn to the same scale as everything else (one
         unit = 4px, so 9" is 36px against a 1" token). It is here because
         "anywhere you like" is only true outside it, and the two halves of that
         rule are printed a paragraph apart in the book - a reader can easily
         take the first half and place a point on top of a planet. -->
    <circle class="dg-well" cx="72" cy="96" r="36"/>
    <circle class="dg-planet" cx="72" cy="96" r="15"/>
    <g class="dg-measure" transform="translate(72 96)">
      <line x1="0" y1="0" x2="36" y2="0"/>
      ${LABEL(18, -5, '9"', "dg-measure-text")}
    </g>
    ${LABEL(72, 152, "Planetoid", "dg-measure-text")}
    <g class="dg-no"><g transform="translate(96 70)">
      <circle class="dg-no-ring" r="11"/>
      <line class="dg-no-bar" x1="-7" y1="7" x2="7" y2="-7"/>
    </g></g>

    <!-- Where it CAN go: anywhere outside the well, including a different
         table. The dashed edge is the sector boundary. -->
    <line class="dg-sector-edge" x1="196" y1="40" x2="196" y2="152"/>
    ${LABEL(258, 40, "Any table", "dg-measure-text")}
    <!-- No dg-jp-landed here. That class animates transform, and this element
         carries a transform ATTRIBUTE - the collision documented at the top of
         this file, which drops the element on the SVG origin. It also has
         nothing to animate into any more: the token no longer flies in from a
         supply tray, because this diagram is about WHERE a point may go, not
         about the journey. The ring keeps pulsing on its own. -->
    <g transform="translate(252 96)">
      <circle class="dg-jp-core" r="9"/>
      <circle class="dg-jp-ring" r="9"/>
    </g>
    ${LABEL(252, 152, "Anywhere out here", "dg-measure-text")}
  </svg>`;
}

/**
 * Passing: the third thing you can do on your turn in the Jump Phase.
 *
 * The only one of the three with nothing to draw on the table, so it draws the
 * turn order instead - four seats, play going clockwise, and one seat going
 * quiet and being skipped from then on. That is the rule it has to carry:
 * passing is not "do nothing this turn", it is "take no further turns this
 * phase", and the phase ends when the last seat has gone quiet.
 */
function passDiagram(): string {
  // Four seats on a 52px ring at 12, 3, 6 and 9 o'clock. Written out rather
  // than computed so the keyframes below can name the same coordinates.
  const seats: [number, number][] = [
    [160, 44],
    [212, 96],
    [160, 148],
    [108, 96],
  ];
  const seat = (i: number, x: number, y: number) => `
    <g transform="translate(${x} ${y})">
      <g class="dg-seat dg-seat-${i + 1}">
        <circle r="16"/>
        <text class="dg-seat-l" y="4">P${i + 1}</text>
      </g>
    </g>`;
  return `
  <svg class="learn-dg" viewBox="0 0 320 186" role="img"
       aria-label="Passing: you take no further turns this Jump Phase. Play carries on clockwise without you, and when everyone has passed the phase ends.">
    ${LABEL(160, 18, "Pass", "dg-title")}
    <!-- Everything that loops sits inside dg-glitch, which tears for a fifth of
         a second at the end of each cycle.

         This is the only diagram on these pages whose loop is a LIE: the other
         seven repeat a thing that genuinely repeats (a die is rolled, a ship
         moves, a unit arrives), but a Jump Phase ends when the last player has
         passed and does not then run again with P1 back in their seat. It ran
         anyway, silently, and read as a rule - that a passed player comes back
         round. The tear says "this is the picture starting over, not the game",
         which is the one thing a seamless loop could not. -->
    <g class="dg-glitch">
      <circle class="dg-turn-ring" cx="160" cy="96" r="52"/>
      ${seats.map(([x, y], i) => seat(i, x, y)).join("")}
      <!-- The marker hops seat to seat. Position on the outer group, motion on
           the inner one, same as everything else in this file. -->
      <g transform="translate(160 96)"><g class="dg-turn-mark">
        <circle class="dg-turn-dot" r="7"/>
      </g></g>
    </g>
    <!-- Three scan-tears, timed to the same 5200ms cycle as the marker. -->
    <rect class="dg-glitch-bar dg-glitch-bar-1" x="86" y="0" width="148" height="7"/>
    <rect class="dg-glitch-bar dg-glitch-bar-2" x="102" y="0" width="116" height="5"/>
    <rect class="dg-glitch-bar dg-glitch-bar-3" x="94" y="0" width="132" height="6"/>
    ${LABEL(160, 178, "P1 passes. Play carries on without them.", "dg-measure-text")}
  </svg>`;
}

/**
 * Jumping in a unit: every ship of it deployed inside the point's 6" bubble.
 *
 * The bubble is the rule - "deploy all ships from that unit within 6 inches of
 * a friendly Jump Point" - so it is drawn to scale rather than suggested, and
 * the radius carries its measurement.
 *
 * Redrawn August 2026, three ways, all one complaint: it blinked.
 *
 *   1. The ships arrive to the RIGHT of the point and stay on that side. They
 *      used to straddle it - one above, one right, one below - which drew the
 *      eye to the token and made the bubble look like a thing the unit is
 *      wrapped around. A unit is a formation that came through a door: it reads
 *      as one when it is on one side of the door.
 *   2. The point is SMALLER (r6, was r9) and the illustration is BIGGER (the 6"
 *      bubble is r68, was r52, in a taller box). The two go together: a 1" token
 *      drawn nearly a fifth the width of a 6" radius was the one thing on the
 *      picture not drawn to scale, and shrinking it is what buys the room to
 *      draw everything else larger. One inch is 11.33px here, up from 8.67, so
 *      the hulls scale by the same 1.3 and the geometry stays honest.
 *   3. Only the SHIPS animate. The whole picture - bubble, measurements,
 *      labels, the lot - used to fade to nothing and pop back every 3.4
 *      seconds, which is not a diagram animating, it is a diagram flickering,
 *      and it made the panel unreadable next to body text you were trying to
 *      read. The table is now permanent and a unit arrives onto it.
 */
function jumpInDiagram(): string {
  // Three hulls in a wedge on the far side of the point, every pair inside 6"
  // of every other pair, because that is Unit Coherence and a picture of three
  // ships scattered around a bubble says the opposite.
  //
  // The bubble is 68px for 6", so one inch is 11.33px. Distances, checked: each
  // ship sits 46, 58 and 45px from the point (4.1", 5.1", 4.0" - inside the
  // deployment bubble with room), and the widest pair, A to C, is 56px apart
  // (4.9"), which is in coherence and not merely in coherence by rounding.
  const JP: [number, number] = [146, 110];
  const A: [number, number] = [184, 82];
  const B: [number, number] = [204, 112];
  const C: [number, number] = [180, 138];
  return `
  <svg class="learn-dg" viewBox="0 0 320 206" role="img"
       aria-label="Jumping in: deploy all the ships of one unit within six inches of a friendly jump point, and in coherence - every ship within six inches of every other ship in its unit.">
    ${LABEL(160, 17, "Jump In a unit", "dg-title")}
    <circle class="dg-range" cx="${JP[0]}" cy="${JP[1]}" r="68"/>
    <g class="dg-jumppoint dg-jp-sm" transform="translate(${JP[0]} ${JP[1]})">
      <circle class="dg-jp-core" r="6"/>
      <circle class="dg-jp-ring" r="6"/>
    </g>

    <!-- The 6" deployment radius, drawn out to the empty left-hand side so the
         line does not cross the formation it is measuring to. It names the
         point as well as measuring from it, which is why there is no separate
         "Jump Point" caption: one under the token was the only thing on this
         picture the unit's own coherence caption could be confused with. -->
    <g class="dg-measure" transform="translate(${JP[0]} ${JP[1]})">
      <line x1="0" y1="0" x2="-68" y2="0"/>
      ${LABEL(-34, -10, '6" of the point', "dg-measure-text")}
    </g>

    <!-- The unit, in formation, all of it on one side. Coherence is drawn
         between A and C, the furthest-apart pair, which is the one the rule
         actually constrains, and its caption hangs off the BOTTOM of that line
         on a leader in the same dash. It sat out to the right on its own for
         one draft, sixty pixels clear of the line with a hull in between, and
         at that distance a caption is not labelling anything - it just floats. -->
    <g class="dg-coh dg-jin-coh">
      <line x1="${A[0]}" y1="${A[1]}" x2="${C[0]}" y2="${C[1]}"/>
      <line x1="${C[0] + 2}" y1="${C[1] + 12}" x2="${C[0] + 2}" y2="186"/>
      <!-- The caption read 'every pair within 6"' for one draft. It was true -
           "within 6" of all other ships" is a statement about every pair - but
           "pair" is a word the rulebook never uses, and on a diagram that draws
           exactly one line it invites the reading that the RULE is about one
           pair. p.36's own phrasing does the job and is shorter than the gloss
           of it. -->
      ${LABEL(C[0] + 2, 197, 'within 6" of every other ship', "dg-measure-text")}
    </g>
    ${SHIP(A[0], A[1], 12, "dg-ship dg-jin dg-jin-1", 1.3)}
    ${SHIP(B[0], B[1], 12, "dg-ship dg-jin dg-jin-2", 1.3)}
    ${SHIP(C[0], C[1], 12, "dg-ship dg-jin dg-jin-3", 1.3)}
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
  const LEAD_X = 120, LEAD_Y = 100, R6 = 54;

  /**
   * Hull size follows Mass, hard.
   *
   * Every ship used to be drawn the same size with its Mass written underneath,
   * so the one number this picture exists to explain was carried entirely by a
   * caption. The ramp is deliberately steep - a Mass 3 capital is nearly four
   * times a Mass 0 squadron - because a gentle one just looks like sloppy
   * drawing rather than a difference you are meant to read.
   *
   * Mass tops out at 3. An earlier version of this diagram had a Mass 4 lead
   * and summed to exactly 10, which is not a fleet that can exist.
   */
  const sizeFor = (m: number): number => 0.55 + m * 0.5;

  const mass = (x: number, y: number, label: string, cls = "dgs-mass") =>
    `<text class="${cls}" x="${x}" y="${y}">${label}</text>`;

  /** A hull and its Mass label, the label clearing the (very variable) hull. */
  const unit = (x: number, y: number, rot: number, cls: string, m: number, label?: string, labelCls?: string) => {
    const sc = sizeFor(m);
    const txt = label === undefined ? `M:${m}` : label;
    return `${SHIP(x, y, rot, cls, sc)}${txt ? mass(x, y + 11 + Math.round(11 * sc), txt, labelCls) : ""}`;
  };

  return `
  <svg class="learn-dg" viewBox="0 0 320 200" role="img"
       aria-label="Drag to Select: click a lead unit of Mass 3 and a pulse goes out six inches. Every unactivated unit it reaches joins the battlegroup - a Mass 2, two Mass 1s and three Mass 0 squadrons - for a Combined Mass of 7, under the maximum of 10. A Mass 2 unit beyond the pulse is out of range and stays unselected.">
    <style>
      .learn-dg .dgs-mass { font-family: var(--narrow); font-size: calc(10.5px * var(--dgf)); font-weight: 700; fill: var(--ink-2); text-anchor: middle; letter-spacing: 0.03em; }
      .learn-dg .dgs-mass-out { fill: var(--ink-3); }
      .learn-dg .dgs-total { font-family: var(--narrow); font-size: calc(10.5px * var(--dgf)); font-weight: 700; fill: var(--blue); text-anchor: middle; text-transform: uppercase; letter-spacing: 0.04em; }
      .learn-dg .dgs-cursor { fill: var(--ink); stroke: var(--paper); stroke-width: 1; stroke-linejoin: round; }

      /* The pulse IS the range. It leaves the lead on the click, runs out to
         exactly 6", and stays there as the boundary for the rest of the loop -
         one shape doing the job a static dashed circle and a separate throwaway
         ripple were splitting between them. */
      .learn-dg .dgs-wave { fill: var(--blue-wash); stroke: var(--blue); stroke-width: 1.5; }
      .learn-dg .dgs-wave-2 { fill: none; stroke: var(--blue); stroke-width: 2; }

      @keyframes dgs-wave {
        0%, 4%   { r: 9; opacity: 0; }
        7%       { r: 9; opacity: 0.95; }
        24%      { r: 54px; opacity: 0.95; }
        30%, 88% { r: 54px; opacity: 0.85; }
        97%, 100% { r: 54px; opacity: 0; }
      }
      /* A second, thinner front that keeps going and dies just past the
         boundary, so the wave reads as expanding rather than as a circle that
         faded up. */
      @keyframes dgs-wave-2 {
        0%, 6%  { r: 9; opacity: 0.8; }
        34%     { r: 74; opacity: 0; }
        100%    { r: 74; opacity: 0; }
      }
      @keyframes dgs-click { 0%, 3% { transform: scale(1); } 7% { transform: scale(0.82); } 13%, 100% { transform: scale(1); } }
      /* Each hull lights the moment the front reaches it. Staggered wider apart
         than the true distances, which are within a few px of each other -
         everything flicking on in one frame reads as a single event, and the
         point is that the wave picks them up one by one. */
      @keyframes dgs-tint-1 { 0%, 11% { fill: var(--ink); } 14%, 90% { fill: var(--blue); } 97%, 100% { fill: var(--ink); } }
      @keyframes dgs-tint-2 { 0%, 15% { fill: var(--ink); } 18%, 90% { fill: var(--blue); } 97%, 100% { fill: var(--ink); } }
      @keyframes dgs-tint-3 { 0%, 19% { fill: var(--ink); } 22%, 90% { fill: var(--blue); } 97%, 100% { fill: var(--ink); } }
      @keyframes dgs-tint-4 { 0%, 23% { fill: var(--ink); } 26%, 90% { fill: var(--blue); } 97%, 100% { fill: var(--ink); } }
      @keyframes dgs-total { 0%, 30% { opacity: 0; } 38%, 92% { opacity: 1; } 98%, 100% { opacity: 0; } }

      .learn-dg .dgs-wave { animation: dgs-wave 3600ms cubic-bezier(0.15, 0.85, 0.25, 1) infinite; }
      .learn-dg .dgs-wave-2 { animation: dgs-wave-2 3600ms cubic-bezier(0.1, 0.9, 0.3, 1) infinite; }
      .learn-dg .dgs-cursor { animation: dgs-click 3600ms ease-out infinite; transform-box: fill-box; transform-origin: 10% 6%; }
      .learn-dg .dgs-catch-1 { animation: dgs-tint-1 3600ms step-end infinite; }
      .learn-dg .dgs-catch-2 { animation: dgs-tint-2 3600ms step-end infinite; }
      .learn-dg .dgs-catch-3 { animation: dgs-tint-3 3600ms step-end infinite; }
      .learn-dg .dgs-catch-4 { animation: dgs-tint-4 3600ms step-end infinite; }
      .learn-dg .dgs-total { animation: dgs-total 3600ms ease infinite; }

      /* Motion off: settle on the informative frame - the wave sits at 6" and
         everything inside it is selected. */
      @media (prefers-reduced-motion: reduce) {
        .learn-dg .dg-ship.dgs-catch-1,
        .learn-dg .dg-ship.dgs-catch-2,
        .learn-dg .dg-ship.dgs-catch-3,
        .learn-dg .dg-ship.dgs-catch-4 { fill: var(--blue); }
        .learn-dg .dgs-wave { r: 54px; opacity: 0.85; }
        .learn-dg .dgs-wave-2 { display: none; }
      }
    </style>

    ${LABEL(160, 16, "Drag to Select a battlegroup", "dg-title")}

    <!-- No marquee, no selection brackets, no dashed range ring.
         There were five squares of lines on this diagram at one point, sitting
         on top of a circle, a cursor and a ripple, and it had stopped being a
         picture of anything. What is left is the gesture: you press the big
         ship, a pulse goes out six inches, and whatever it touches turns blue.
         The ship it does not reach stays grey. -->
    <circle class="dgs-wave" cx="${LEAD_X}" cy="${LEAD_Y}" r="9"/>
    <circle class="dgs-wave-2" cx="${LEAD_X}" cy="${LEAD_Y}" r="9"/>

    ${LABEL(LEAD_X, LEAD_Y - 30, "lead", "dg-mini")}
    ${unit(LEAD_X, LEAD_Y, 0, "dg-ship dg-lead", 3)}
    ${unit(78, 72, 15, "dg-ship dgs-catch-1", 2)}
    ${unit(162, 70, -10, "dg-ship dgs-catch-2", 1)}
    ${unit(156, 140, 0, "dg-ship dgs-catch-3", 1)}

    <!-- Three Mass 0 squadrons, labelled once as a group. They ride along for
         free, which is the whole reason to draw them: the Combined Mass below
         comes to 7 with all three of them in the battlegroup. -->
    ${unit(86, 130, 5, "dg-ship dgs-catch-4", 0, "")}
    ${unit(101, 143, -8, "dg-ship dgs-catch-4", 0, "")}
    ${unit(72, 145, 12, "dg-ship dgs-catch-4", 0, "")}
    ${LABEL(88, 164, "M:0 &#215;3", "dgs-mass")}

    ${unit(272, 96, 0, "dg-ship dg-outside", 2, "M:2", "dgs-mass dgs-mass-out")}
    ${LABEL(272, 134, "too far", "dg-mini dg-mini-out")}

    <!-- The pointer, tip on the lead's hull. -->
    <g transform="translate(126 94)">
      <path class="dgs-cursor" d="M0 0 L0 15 L4 11.2 L6.4 16.6 L9.4 15.2 L7 10 L11.6 9.6 Z"/>
    </g>

    <!-- The radius runs left, the only quarter of the wave with nothing in it. -->
    <g class="dg-measure" transform="translate(${LEAD_X} ${LEAD_Y})">
      <line x1="0" y1="0" x2="${-R6}" y2="0"/>
      ${LABEL(-R6 / 2, 14, '6"', "dg-measure-text")}
    </g>

    <text class="dgs-total" x="160" y="192">Combined Mass 3+2+1+1 = 7 (max 10)</text>
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
    <!-- The static transform is the animation's END frame (translate(250,92) in
         dg-pivot-then-run). A running CSS animation overrides this attribute, so
         the mover still animates; but under prefers-reduced-motion the animation
         is disabled and this attribute is what keeps the ship at the Thrust mark
         instead of collapsing onto the SVG origin. -->
    <g class="dg-mover" transform="translate(${END} ${Y})">${SHIP(0, 0, 90, "dg-ship")}</g>

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
  // Two legs at an angle, not one straight line broken in the middle.
  //
  // "Move twice during this movement step (pivoting and moving ahead both
  // times)" is the rule, and the pivot is the half of it worth drawing: a ship
  // that runs in a straight line for double its Thrust has only shown you the
  // distance. The second leg turns, so the picture says you get a second PIVOT
  // as well as a second move - which is what actually makes the Command worth
  // a token.
  const A: [number, number] = [40, 66];
  const B: [number, number] = [148, 66];
  const C: [number, number] = [238, 124];
  return `
  <svg class="learn-dg" viewBox="0 0 320 152" role="img"
       aria-label="Power to Engines: spend one CMD token at the start of the movement step to take that step twice - pivot and move ahead, then pivot again and move ahead again.">
    <line class="dg-straight" x1="${A[0]}" y1="${A[1]}" x2="${B[0]}" y2="${B[1]}"/>
    <line class="dg-straight dg-straight-2" x1="${B[0]}" y1="${B[1]}" x2="${C[0]}" y2="${C[1]}"/>
    <!-- The turn at the halfway point, marked so it reads as a decision rather
         than as a kink in the line. -->
    <path class="dg-turn-arc" d="M${B[0] + 22} ${B[1]} A22 22 0 0 1 ${B[0] + 15.6} ${B[1] + 15.6}"/>

    <!-- Static transform = the animation's END frame, so the reduced-motion
         still-frame rests at the end of the second leg rather than collapsing
         onto the SVG origin. The running animation overrides this attribute. -->
    <g class="dg-dbl-mover" transform="translate(${C[0]} ${C[1]}) rotate(33)">${SHIP(0, 0, 90, "dg-ship")}</g>

    ${LABEL(94, 56, "1 · Thrust", "dg-measure-text")}
    ${LABEL(216, 84, "2 · Thrust again", "dg-measure-text")}
    ${LABEL(160, 146, "One CMD, one movement step, done twice", "dg-measure-text")}
  </svg>`;
}

/**
 * Passive Attacks Step, redrawn August 2026 after an audit against p.38.
 *
 * The rule, in full: "After moving the units in the battlegroup, there is a
 * Passive Attacks step. Every passive enemy unit that has one or more active
 * units in range and arc of fire of their auxiliary weapons may attack once
 * with their auxiliary weapons, targeting only active units."
 *
 * Three things the previous drawing got wrong, all of them the same mistake -
 * drawing the journey instead of the position it ends in:
 *
 *   1. It was titled "Move INTO an enemy's AUX arc and it fires", and the
 *      animation existed to show a ship crossing the boundary. Nothing in the
 *      rule is about crossing anything. The check happens once, after the
 *      movement step, on where the units ARE: a unit that began the phase
 *      inside an enemy's arc and did not move an inch is shot at exactly the
 *      same. "Moving in" is the common case, not the rule.
 *   2. "in range AND arc of fire" is two conditions and only one of them was
 *      labelled. The half-disc always had a finite radius, but nothing said
 *      that radius WAS the weapon's maximum range, so it read as a pure arc and
 *      the range half of the rule was invisible.
 *   3. The path bent. Movement in this game is p.36's "first pivot it by any
 *      amount, and then move it straight ahead" - two straight legs. A curved
 *      trail drawn under a rule about straight-line movement is a picture of
 *      something the game does not let you do.
 *
 * And it drew one ship against one enemy, which cannot show the shape of the
 * step: a battlegroup of several units finishes moving and then EVERY passive
 * enemy that can see any of them fires. Three active ships in one unit, two
 * passive enemies, one of which has them and one of which does not.
 */
function passiveDiagram(): string {
  // The firing enemy, facing left, and the maximum range of its auxiliary
  // weapons. The half-disc is both conditions at once and that is the point of
  // drawing it this way: inside the shape is "in range and in arc", outside it
  // is not, and there is no third thing to check.
  const EX = 268, EY = 106, R = 78;

  // An exact half-disc. Both endpoints are (0, -R) and (0, +R) in the enemy's
  // own frame, so the chord between them is the vertical diameter: dead
  // straight, and passing through the ship's centre by construction rather than
  // by eye. sweep-flag 0 bulges the curve towards -x (SVG's y axis points down,
  // so sweep 1 would put the bulge behind the ship); at exactly 180 degrees the
  // large-arc-flag is degenerate and either value gives the same semicircle.
  const disc = (r: number) => `M0 -${r} A${r} ${r} 0 0 0 0 ${r} Z`;

  // The three ships of one active unit, each ending inside the half-disc.
  // Distances from the enemy, checked: 68, 47 and 72 against a radius of 78.
  const A: [number, number] = [206, 78];
  const B: [number, number] = [222, 114];
  const C: [number, number] = [204, 138];
  // One leg of travel, identical for all three because a unit moves as a unit.
  // Straight, not bent: pivot happened before the leg began.
  const LEG: [number, number] = [-58, 12];
  const trail = ([x, y]: [number, number]) =>
    `<line class="dg-path" x1="${x + LEG[0]}" y1="${y + LEG[1]}" x2="${x}" y2="${y}"/>`;

  return `
  <svg class="learn-dg" viewBox="0 0 340 208" role="img"
       aria-label="Passive Attacks Step: after the battlegroup has finished moving, every passive enemy that has an active unit inside the range and 180 degree auxiliary arc of its weapons fires once. Here a unit of three ships has ended its move inside one enemy's arc, and that enemy fires at all three. A second enemy is facing away, so the same ships are behind it and it does not fire.">
    <style>
      .learn-dg .dgp-arc-edge { fill: none; stroke: var(--red); stroke-width: 1; stroke-opacity: 0.55; }
      .learn-dg .dgp-arc-dia { stroke: var(--red); stroke-width: 1.2; stroke-opacity: 0.8; }
      .learn-dg .dgp-arc-away { fill: var(--ink-3); fill-opacity: 0.09; }
      .learn-dg .dgp-arc-away-edge { fill: none; stroke: var(--ink-3); stroke-width: 1; stroke-dasharray: 3 3; }
    </style>

    ${LABEL(170, 15, "End in range and arc, and it fires", "dg-title")}

    <!-- The enemy that has them. Everything inside this shape is both in range
         and in arc; the radius IS the weapon's maximum range. -->
    <g transform="translate(${EX} ${EY})">
      <path class="dg-arc-fill dg-arc-aux" d="${disc(R)}"/>
      <path class="dgp-arc-edge" d="${disc(R)}"/>
      <line class="dgp-arc-dia" x1="0" y1="-${R}" x2="0" y2="${R}"/>
      ${SHIP(0, 0, -90, "dg-ship dg-enemy")}
      ${LABEL(0, 32, "passive", "dg-mini")}
    </g>
    ${LABEL(232, 40, "aux 180°", "dg-mini dg-mini-arc")}
    <g class="dg-measure" transform="translate(${EX} ${EY})">
      <line x1="0" y1="0" x2="-${R}" y2="0"/>
      ${LABEL(-R / 2, -6, "max range", "dg-measure-text")}
    </g>

    <!-- The enemy that does not. Its arc is drawn too, greyed and dashed,
         because "facing away" is only an explanation if you can see where the
         ship IS facing - the previous drawing asserted it and left the reader to
         take it on trust. -->
    <g transform="translate(78 58)">
      <path class="dgp-arc-away" d="${disc(46)}"/>
      <path class="dgp-arc-away-edge" d="${disc(46)}"/>
      ${SHIP(0, 0, -90, "dg-ship dg-enemy dg-enemy-away")}
    </g>
    <!-- Under the ship, not over it: at y=26 this caption lay across its own
         greyed arc, which is the one thing on that half of the picture the
         reader has to be able to see the shape of. -->
    ${LABEL(64, 126, "facing away — no shot", "dg-mini dg-mini-out")}

    <!-- One unit of three, where it ended up. The trails are three parallel
         straight legs, because that is what a unit's movement step looks like. -->
    ${trail(A)}${trail(B)}${trail(C)}
    <g class="dg-passive-mover-3">
      ${SHIP(A[0], A[1], 78, "dg-ship")}
      ${SHIP(B[0], B[1], 78, "dg-ship")}
      ${SHIP(C[0], C[1], 78, "dg-ship")}
    </g>
    ${LABEL(120, 176, "your unit ends its move here", "dg-mini")}

    <!-- One attack, at all three: the enemy unit fires once, and it may target
         any active unit it has in range and arc. -->
    <g class="dg-passive-shots">
      <line class="dg-shot dg-pshot-1" x1="${EX - 12}" y1="${EY - 6}" x2="${A[0] + 8}" y2="${A[1] + 4}"/>
      <line class="dg-shot dg-pshot-2" x1="${EX - 12}" y1="${EY}" x2="${B[0] + 8}" y2="${B[1]}"/>
      <line class="dg-shot dg-pshot-3" x1="${EX - 12}" y1="${EY + 6}" x2="${C[0] + 8}" y2="${C[1] - 2}"/>
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
      .learn-dg .dgof-tag { font-family: var(--narrow); font-size: calc(9.5px * var(--dgf)); font-weight: 700; text-anchor: middle; text-transform: uppercase; letter-spacing: 0.05em; }
      .learn-dg .dgof-tag-hit { fill: var(--blue); }
      .learn-dg .dgof-tag-miss { fill: var(--ink-3); }
      .learn-dg .dgof-sil { font-family: var(--narrow); font-size: calc(9.5px * var(--dgf)); font-weight: 700; text-anchor: middle; letter-spacing: 0.03em; fill: var(--ink-2); }
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

/**
 * One ship, labelled: Position, Heading, and where its stats come from.
 *
 * Position and Heading are the two properties on p.25 that are geometry rather
 * than a number, and they are the two the book cannot draw for you - "the
 * centrepoint of the model's base (likely its flight peg)" and "the direction
 * in which the model is pointing" are both sentences you have to build a
 * picture from before you can measure anything. Every measurement in the game
 * starts at one and runs along the other, so they go first and they go together.
 *
 * The hull is drawn at 3x the size the other diagrams use, because this is the
 * only one where the ship is the subject rather than a counter being moved
 * around, and the base ring under it is dashed: p.12 says ship bases are
 * ignored for the purposes of measuring, so the ring is drawn as the thing that
 * is there and does not count, with the Position dot on top of it as the thing
 * that does.
 */
function shipAnatomyDiagram(): string {
  const CX = 150, CY = 118;
  return `
  <svg class="learn-dg" viewBox="0 0 320 208" role="img"
       aria-label="One ship, labelled: its Position is the centrepoint of the model's base, its Heading is the direction the model points, and its stats come from its ship class.">
    ${LABEL(160, 17, "Position and Heading", "dg-title")}

    <!-- The base, dashed: it is there, and it is ignored when measuring. -->
    <circle class="dg-base-ring" cx="${CX}" cy="${CY}" r="27"/>

    <!-- Heading: a ray out of the nose, along the direction the hull points. -->
    <g class="dg-heading">
      <line x1="${CX}" y1="${CY - 30}" x2="${CX}" y2="52"/>
      <path d="M${CX - 5} 59 L${CX} 49 L${CX + 5} 59 Z"/>
    </g>
    ${LABEL(CX, 42, "Heading", "dg-measure-text")}

    ${SHIP(CX, CY, 0, "dg-ship", 2.1)}

    <!-- Position: the dot ON the centrepoint, with a leader out to its label so
         the dot itself is not obscured by the word. -->
    <g class="dg-leader">
      <line x1="${CX + 4}" y1="${CY}" x2="238" y2="${CY}"/>
    </g>
    <circle class="dg-position-dot" cx="${CX}" cy="${CY}" r="3.5"/>
    ${LABEL(262, CY - 6, "Position", "dg-measure-text")}
    ${LABEL(262, CY + 10, "(the flight peg)", "dg-measure-text")}

    <g class="dg-leader">
      <line x1="${CX - 27}" y1="${CY + 14}" x2="66" y2="176"/>
    </g>
    ${LABEL(58, 190, "base — ignored", "dg-measure-text")}
    ${LABEL(58, 202, "when measuring", "dg-measure-text")}
  </svg>`;
}

const DIAGRAMS: Record<string, () => string> = {
  "ship-anatomy": shipAnatomyDiagram,
  deployment: deploymentMap,
  "gravity-well": gravityWellDiagram,
  "jump-strain": jumpStrainDiagram,
  "cmd-gain": cmdGainDiagram,
  initiative: initiativeDiagram,
  "jump-point": jumpPointDiagram,
  "jump-in": jumpInDiagram,
  pass: passDiagram,
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
