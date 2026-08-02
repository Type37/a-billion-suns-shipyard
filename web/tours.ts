import type { AppState, Route } from "./state.ts";
import { FleetSync } from "./fleet-sync.ts";

// First-visit coachmarks: small popovers anchored to a live DOM element,
// shown once per tour until dismissed or completed. Each tour is scoped to
// a single route; positioning happens in main.ts against the real element,
// since this is a full-string re-render app (no component refs to measure).

export interface TourStep {
  /**
   * CSS selector for the element this step points at. Several selectors can be
   * given separated by "|", and positionTour takes the first one that is
   * actually laid out - the topbar nav is a flat row on desktop but folds
   * behind the hamburger on a phone, so which element is on screen depends on
   * the viewport, not the route.
   */
  selector: string;
  /** Optional: a step that is one sentence of prose does not need a headline. */
  title?: string;
  body: string;
  /**
   * Where "Check it out now!" goes: a hash route. Omit and the button acts on
   * the target itself instead - focuses the field, opens the row - which is
   * what "check it out" means for a step pointing at something already on the
   * page rather than at another screen.
   */
  go?: string;
}

export interface TourDef {
  id: string;
  view: Route["view"];
  steps: TourStep[];
  /** Extra gate beyond "this route, not yet seen" - e.g. wait for the third visit. */
  when?: (state: AppState) => boolean;
}

/**
 * THE HOME-PAGE SCHEDULE
 *
 *   visits 1-2   "New to A Billion Suns?" (an inline card, not a tour - see
 *                tutorialCallout in render.ts)
 *   visits 3+    Fleet Sync, pointing at Options
 *   visits 5+    the example factions, pointing at Custom Rules
 *
 * One nudge per visit. Only one coachmark can be on screen at a time and
 * activeTour takes the FIRST eligible entry in this array, so the home-view
 * tours are listed in the order they are meant to fire and the gates are
 * open-ended (">= 3", not "3 to 4"). Open-ended matters: a hard window drops
 * the nudge on the floor for anyone who skips a session, and these are shown
 * once each in a lifetime.
 *
 * There used to be a third home nudge, "foundry-tab", asking on visits 3-4
 * whether you wanted your own faction, and then "example-factions" asked much
 * the same thing again from visit 5. Asking twice is worse than not asking:
 * the second time reads as not having been listened to the first time. One
 * ask, at visit 5, is the whole of it now.
 */
export const TOURS: TourDef[] = [
  {
    id: "compendium-search",
    view: "ships",
    steps: [
      {
        selector: "#ship-search",
        title: "Search",
        body: "Search for ships by name or faction. Combine it with the era, faction, and mass filters to narrow the table further.",
      },
    ],
  },
  /**
   * Renaming, taught in two goes rather than one.
   *
   * A single coachmark saying "anything in a box can be renamed" was asking a
   * first-time reader to hold an abstraction about the whole app. Split, each
   * one points at a single thing and says what to do with it:
   *
   *   visit 2  the fleet's own name, the easiest and most obviously yours
   *   visit 3  the personnel, where the naming is the point of the exercise
   *
   * Visits 2 and 3, not 1: the first-run tutorial callout owns the first visit,
   * and stacking a coachmark on top of it is a wall. They are also one visit
   * apart on purpose, so neither lands in the same session as the other.
   * "foundry-tab" also fires on visit 3 but on the home view, so the two never
   * share a screen.
   */
  {
    id: "rename-fleet",
    view: "builder",
    // >= 2, not === 2: somebody who does not open the builder on their second
    // visit should still get this, and it stays ahead of the personnel one
    // because activeTour takes the first eligible tour in this array's order.
    when: (s) => s.onboarding.visits >= 2,
    steps: [
      {
        // The die is the point of this one, so it must be on screen: both the
        // Fleet List builder and the Shipyard put it next to the name.
        selector: ".mf-name",
        body: "Rename your fleet! If you need ideas, click the die button to randomize and get some ideas. It's fun to make it *yours*.",
      },
    ],
  },
  {
    /**
     * The personnel, on visit 3.
     *
     * This step used to point at ".roster-unit" and describe opening a row to
     * rename what was inside it. Neither survives: the class is gone and there
     * is no drill-in any more, so it anchored to nothing and taught a gesture
     * the app does not have.
     *
     * It points at a chosen person's name field now, because that is where the
     * copy's own example lives. If nobody has been chosen yet there is no field
     * to point at, so it falls back to the section heading and waits to be
     * useful rather than pointing at empty air.
     */
    id: "rename-personnel",
    view: "builder",
    when: (s) => s.onboarding.visits >= 3,
    steps: [
      {
        // The user's own words, near enough verbatim. No headline: the first
        // sentence is the headline, and a title above it saying the same thing
        // is exactly the doubling they threw out.
        selector: ".hvp-name-input|.sy-hvp-count",
        body: "Anything in a box like this can be renamed. Mike gave them generic titles but you are encouraged to name them; try “Chief Engineer Sadie Hyatt” instead of just “Chief Engineer.” It’s fun!",
      },
    ],
  },
  {
    /**
     * Fleet Sync, from the 3rd visit on.
     *
     * The tutorial card owns the first two visits, so this is the first thing
     * the home page says once that is done. Third rather than fifth because by
     * now there are saved fleets on this browser and nowhere else, and the
     * sooner someone knows that is fixable the less work is stranded when they
     * pick up their phone.
     *
     * Silent once syncing is already on: they have found it.
     */
    id: "fleet-sync",
    view: "home",
    when: (s) => s.onboarding.visits >= 3 && !FleetSync.enabled(),
    steps: [
      {
        selector: '.topnav-btn[data-action="open-options"]|.nav-fold-btn',
        body: "Want the same fleets on your phone and your computer? Options has a Sync Fleets Online button now, no account needed, just a phrase you copy between devices.",
      },
    ],
  },
  {
    /**
     * The worked examples, from the 5th visit on. The one and only time the
     * app asks whether you want a faction of your own.
     *
     * The offer itself lives on the Foundry page (examplesCallout in
     * render.ts) because that is where the three factions land and where they
     * make sense. This is the only thing that tells you it is there: nobody
     * opens Custom Rules on a hunch that something new appeared inside it.
     *
     * After "fleet-sync" in this array, so on the visit where both are
     * eligible sync goes first and this waits for the next one. Neither is
     * lost and neither shares a screen.
     *
     * Silent once the offer has been answered either way, and silent for
     * anyone already building their own factions: they do not need the example.
     */
    id: "example-factions",
    view: "home",
    when: (s) =>
      s.onboarding.visits >= 5 && !s.onboarding.examplesDismissed && s.customFactions.length === 0,
    steps: [
      {
        selector: '.topnav a[href="#/foundry"]|.nav-fold-btn',
        go: "#/foundry",
        body: "Do you want to make your *OWN* faction? There are some examples of rethemes waiting in the “Custom Rules.” Each is a faction from the book with some slight tweaks and rethemes, so you can see the easiest way to make your own.",
      },
    ],
  },
];

/** The tour + step that should be visible right now, if any. */
export function activeTour(state: AppState): { tour: TourDef; step: number } | undefined {
  const override = state.ui.tour;
  if (override) {
    const tour = TOURS.find((t) => t.id === override.tourId && t.view === state.route.view);
    return tour ? { tour, step: override.step } : undefined;
  }
  const tour = TOURS.find(
    (t) =>
      t.view === state.route.view &&
      !state.onboarding.toursSeen.includes(t.id) &&
      (!t.when || t.when(state)),
  );
  return tour ? { tour, step: 0 } : undefined;
}

/**
 * The first target in a step's selector that the user can actually see.
 *
 * "a|b" means "a, or b if a is not on screen" - not a CSS selector list, which
 * would return whichever comes first in the document. The case it exists for is
 * the topbar: the phone's hamburger and the desktop nav row are siblings that
 * are both always in the DOM.
 *
 * Having a box is not enough of a test. The folded nav lives in a closed
 * <details> and still measures 230x41, several hundred pixels down the page
 * under the menu it is hiding behind, so the check is a hit test at the centre
 * of that box: if the point belongs to something else, the user is not looking
 * at this element and the coachmark must not point there.
 *
 * Lives here rather than in main.ts because "Check it out now!" resolves the
 * same target from actions.ts, and it must land on the element the arrow was
 * pointing at - not a second, differently-chosen one.
 */
export function visibleAnchor(selector: string | undefined): HTMLElement | null {
  for (const sel of (selector ?? "").split("|")) {
    const el = document.querySelector<HTMLElement>(sel.trim());
    if (!el) continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    if (hit && (el.contains(hit) || hit.contains(el))) return el;
  }
  return null;
}
