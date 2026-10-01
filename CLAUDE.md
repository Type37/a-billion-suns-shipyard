# Working on this repo

## Git: commit to `main`, always, without being asked

There are no feature branches and no pull requests here. Work goes onto `main`
and gets pushed. Do not open a PR, do not ask whether to open one, and do not
park finished work on a branch waiting for approval.

Do not wait to be told to commit, either. Finish a change, check it, commit it,
push it. "Push?" should never need to be asked.

If a session starts you on a `claude/*` branch, that is the harness's default,
not an instruction: fast-forward `main` onto the work and push `main`.

## Every push deploys

Pushing `main` does NOT update the live site. GitHub Pages serves
https://type37.github.io/a-billion-suns-shipyard/ from the `gh-pages` branch,
which only moves when somebody publishes a build. Source on `main` and a stale
site is the failure mode this rule exists to prevent: a change that is committed
but not deployed has not shipped, and the person who asked for it will look at
the site and correctly say they cannot see it.

So deploying is part of pushing, not a separate errand and not something to ask
about. Every time work lands on `main`, publish it (see "Deploying" in
README.md). Then say so.

## Before pushing

- `npm run typecheck`
- `npm test`
- `npm run build` if anything under `web/` changed

## Don't ask, decide

Questions that end "want me to?" are not wanted. If something is clearly part of
finishing the job - deploying, updating docs a change made wrong, cleaning up a
branch - do it and report it. Ask only when proceeding either way would be
genuinely unsafe or would waste real work if the guess is wrong.

## Keep chat replies short

Long explanatory comments belong in the code. Replies in chat do not. Answer in
a few lines: what you found, what you changed, anything genuinely blocking. No
tables of measurements, no restating the question, no summarising work the user
just watched you do.

## House style

The code carries long explanatory comments about *why* a thing is the way it is
- measured numbers, rulebook page references, approaches that were tried and
abandoned. Match that when you change something with a reason behind it; a
change that alters a documented decision should update the documentation of it
rather than leaving the old rationale sitting above new code.

## Jet's rules for this app (from review, October 2026)

These came out of a mobile review session. They override any default taste.

### How to work
- Things AI makes are inherently bad and usually slop. A first draft is never
  worth showing. Fix it before anyone sees it.
- Do not invent a design system. The app uses IBM Carbon
  (`@carbon/web-components`). Move homemade components onto Carbon instead of
  restyling them. A Carbon component beats anything written here by hand.
- No hand-drawn icons. Interface icons come from Carbon's set
  (`@carbon/icons`). Game marks with no Carbon equivalent (the Mass ⓜ, firing
  arcs, faction emblems) come from the rulebook or the publisher, never drawn
  here. `web/icons.ts` still holds older hand-drawn glyphs; replace them, do
  not add to them.
- Colour is fine. Do not retint, add dark mode or chase contrast unless asked.
- Work from real phone screenshots (Playwright touch contexts: iPhone 13, Pixel
  7, a 360px Android, portrait AND landscape) and real taps. A finding without
  a screenshot is a guess. Show the screenshot when the change ships.
- Do what was asked, the way it was asked. Do not substitute a bigger project.

### What the screens must not do
- No middots (`·`) as separators. Two facts get two labelled lines.
- No counts that restate the list ("2 classes", "0 units") and no numbered
  markers unless the order is real.
- No single letter labels (P, A, T, S). Write Primary, Auxiliary, Thrust.
- No over-explaining copy, no cheer ("Check it out now!", "Get building!").
- No toast for something the screen already shows. Toasts never take taps.
- An empty list shows nothing, not a dashed box telling you to press the button
  above it. An empty fleet is not an error.
- One filled button per screen.

### Layout rules
- Guns go to the right of the ship stats. Stats left column, weapons right,
  at every width.
- On the Alliance, species is picked in Add unit before adding, and shown as
  buttons, not a select.
- Nothing pinned may eat the screen: Play mode's pinned block was 42% of a
  portrait screen and 70% of landscape. That is a bug.
- Dialogs keep their confirm button on screen (Carbon does this) and Back
  closes a dialog instead of leaving the page.
- Layout must not jump under the thumb. A double tap must never hit what just
  appeared (see armTapGuard in web/actions.ts).
