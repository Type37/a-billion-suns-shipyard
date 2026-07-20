# ABS-V2 Builder — Session Handoff

A Billion Suns 2E fleet builder. Framework-free TypeScript SPA, deployed to GitHub Pages.

**Live version:** v0.8.46 (deployed to gh-pages). The per-mode builder redesign (Phases A–E) is **complete**, and print setup has been rebuilt around a real paginated preview.
(Older v0.8.0 / v0.8.26 handoffs previously lived here; superseded by this file.)

---

## Open work

Nothing is mid-flight. Known deferred items, in rough priority order:

- **All-caps / wide letter-spacing restyle.** ~79 CSS rules use `text-transform: uppercase` + `letter-spacing` (the house "label" style: `.control-label`, `.sheet-section`, `.nfd-*`, `.learn-*`, print headers…). The user asked for the full list, then said to leave it for now. If revisited, decide once: drop the letter-spacing, sentence-case everything but tiny eyebrow labels, or keep.
- **The "General" emblem bucket.** 88 of 153 library sigils are loose files at `web/emblems/` root, so they all land in the catch-all "General" folder. The other 11 folders are tidy. Filing those into folders is a content decision for the user, not code.
- **Play Mode depth.** Research (see below) suggests the biggest wins would be: phase-filtered command list (show only commands legal in the current phase), per-ship damage/shield tracking, and an activation-order tracker. Currently Play Mode is a phase/round/CMD/VP tracker only.

### The three modes — the mental model (implemented)

| Mode | You build a… | Ships | HVPs (High-Value Personnel) |
|---|---|---|---|
| **Hypergrowth** | **Shipyard** | Ship types with a quantity. Cap is **300bn only**, or an **"Unlimited Shipyards"** switch (OFF by default) lifts it entirely. No 400/500/custom. | **None at build** — HVP section hidden. |
| **Armageddon** | **Fleet List** | Discrete units. | **Chosen + assigned pre-play** (enforced). |
| **Age of Unity** | **Fleet List** | Discrete units. | **Deferred.** Optional at build (with a note); print shows ALL available HVP plus a write-in slot per ship. |

### ✅ Phases A–E — all DONE
- **A** (v0.8.26) Two-column builder: sticky roster LEFT, catalogue + HVP pool RIGHT. `builderView()`, CSS `.mf-body`/`.mf-manifest`/`.mf-yard`.
- **B** (v0.8.35/.36) `SavedList.unlimitedShipyards` + toggle in the credits popover; drops `OVER_BUDGET`, shows `∞`. Hypergrowth credits = 300 or Unlimited only, in both the New Fleet modal and the builder.
- **C** (v0.8.30) Per-mode HVP: `HVP_COUNT` dropped for hypergrowth / age-of-unity / management-training; HVP section hidden for hypergrowth, "assigned after missions" note for Age of Unity.
- **D** (v0.8.32/.35) Print: an **Actions & Commands** reference (see `src/data/commands.ts`), ink-friendly headings, much tighter spacing; Age of Unity gets an "HVP carried" write-in column + an "Available High-Value Personnel" section. Shipyard modes keep their requisition tick-boxes.
- **E** (v0.8.34/.37/.38) Emblem picker rebuilt as **one modal** (`emblemModal()`) with Library / Upload / Colour tabs, used by the builder, foundry, and solo alike. Library has folder chips + search; sigil labels are cleaned of filename boilerplate. Ship image is a click-to-upload tile.

---

### Print setup (v0.8.45/.46) — how the preview works
The sheet is laid out at the **true printable width** for the chosen paper (`PAPER` in `state.ts`: Letter 710×950, A4 688×1017 CSS px inside the 14mm `@page` margin) at *every* screen size. On a narrow screen it scrolls inside `.sheet-viewport` rather than reflowing — if it reflowed, it would break in different places than the printer and the page count would lie. `paginatePrintPreview()` (`main.ts`) walks the sheet's **leaf** breakable units (table rows inside tables; recurses into any block taller than a page) and draws absolutely-positioned `.page-guide` lines plus a live page count. It runs after layout settles (rAF) and again on `document.fonts.ready`. There is deliberately **one renderer** — preview and paper are the same DOM and stylesheet.
`PrintOpts` (format, trackers, rules, paper, inkSaver, excluded[]) persists to `abs2.print.v1`. Ink saver (default on) drops every coloured fill so output is identical whether or not the browser prints background graphics.
**Not built:** a real "Download PDF" — that needs a PDF lib, and a button that just calls `window.print()` would be a lie. Chrome's "Save as PDF" destination covers it for now.

## Recently done (verify on live, don't redo)
- **Learn to Play** (v0.8.31): 5-screen walkthrough at `#/learn` (`learnView()`), looping CSS/SVG activation demo, launches into Play Mode via `learn-launch`. Home-menu entry only.
- **Emblem colour system** (v0.8.37): `emblemColor` (SVG tint, via CSS mask) + `emblemBg` (coloured ground, works on any sigil) on `SavedList` / `Faction` / `SavedOutfit`; rendered by `emblemView()` in `web/render.ts`; generic `emblem-set-color` / `emblem-set-bg` actions patch whichever target the modal edits.
- **Share links are compressed** (v0.8.33): `deflate-raw` via Compression Streams behind a `#z=` prefix, plain `#s=` fallback; both decode. See `web/share.ts`.
- **Solo** (v0.8.36/.37): outfit roster shows full stats + PRI/AUX weapons; the Stock Ship Classes catalogue reuses the fleet builder's row (shared `weaponsTable()`, exported from `render.ts`); landing page shows debt-progress cards.
- Mass Ⓜ glyph → inline SVG circled-M, centred (v0.8.25, `ruleText()` in `web/format.ts`).
- Mass Ⓜ glyph → inline SVG circled-M, centred (v0.8.25, `ruleText()` in `web/format.ts`).
- Age of Unity title = Star Wars recede; Hypergrowth = decode/scramble; Armageddon = vertical thump + red underline drawn at ~190ms (v0.8.22/.25). Desktop ≥992px, non-reduced-motion only.
- New Fleet era chooser = 3 distinct buttons (v0.8.25). Command tokens shown as N triangle marks like the dice; AEGIS/Golem `>`-slogans render as a mono terminal line with a blinking cursor (v0.8.24). Initiative dice + command marks share the value's line and pop in.
- Options dialog (top-bar gear) = data export/import/clear + about links (v0.8.21). Version/changelog link removed from the footer (it's in Options now).
- Compendium: filters + "Sort by faction" + "Show custom ships" (off by default) all in one bar (v0.8.21/.24). Solo pilot-class = 3-way icon picker (gunner/hauler/junker, `web/pilots/*.png`) (v0.8.23). Adding a ship animates just the new roster row (v0.8.23).

---

## Architecture

- **Framework-free.** One `Store<AppState>` (`web/state.ts`, `web/store.ts`). Every state change re-renders the WHOLE app as an HTML string (`render(state)` in `web/render.ts`) and replaces `#app.innerHTML` (`paint()` in `web/main.ts`). No DOM diffing. `setState` is synchronous — the DOM is repainted by the time it returns.
- **Events:** `data-action="..."` + delegated `click`/`change`/`input` in `web/actions.ts`. Add a `case` in `handleClick` (clicks) or `handleChange` (selects/inputs/file). `actions.ts` is the only place that mutates state.
- **Routing (hash):** `#/fleets`, `#/list/:id` (builder), `#/ships` (compendium), `#/solo`, `#/foundry` (Custom Rules), `#/play/:id`, `#/print/:id`, `#/learn[/:step]` (Learn to Play), `#/changelog`. Share links are NOT routes: `#s=`/`#z=` payloads are intercepted at boot by `tryImportShare()`.
- **Post-render imperative hooks** in `paint()` (`web/main.ts`), run after `innerHTML` is replaced: `enhanceNav()` (nav pill placed WITHOUT transition so it doesn't re-animate each click), `animateFactionTitle()` (era-keyed title entrance, keyed to fire only on a real title change), `animateNewRosterRows()` (entrance on a newly-added roster row — rows carry `data-roster-key="<unitId>"`, diffed vs the previous set), `positionTour()`. Reusable pattern: track a prev-key set in a module var, diff each render, act only on new elements, reset the var when the target is absent.
- **Persistence:** `web/storage.ts`, one `abs2.*.v1` localStorage key per concern (`abs2.lists.v1`, `abs2.customFactions.v1`, `abs2.outfits.v1`, `abs2.onboarding.v1`, `abs2.seedsApplied.v1`). `exportAllData`/`importAllData`/`clearAllData` scan the `abs2.` prefix.
- **Data model:** `SavedList` (`web/storage.ts`) = `{ id, mode: GameMode, freePlay, emblem/emblemImage/emblemLib/emblemColor, fleet: Fleet, play?, createdAt, updatedAt }`. `Fleet` (`src/types.ts`) = `{ name?, factionId, creditsLimit, units: FleetUnit[], hvp: FleetHvp[], notes? }`. `FleetUnit` = `{ id, shipClassId, count, name?, species?, ... }`. `GameMode` = `combat-simulator | management-training | armageddon | age-of-unity | hypergrowth | junkspace`. Factions/ships in `src/data/`; rules + validation engine in `src/` (has `node --test` tests). Custom factions live in `state.customFactions`. The **Covenant** (`cf-covenant`) is a seed custom faction HIDDEN from `allFactions()` via `HIDDEN_FACTION_IDS` in `web/catalog.ts` (still resolvable for saved fleets via `findFaction`).
- **Solo/Junkspace:** `web/solo.ts` (own outfit/pilot/campaign model).

## Design system + hard rules
- Light NASA/Swiss theme. Tokens: `--blue #0b3d91`, `--red #fc3d21`, `--ink #0a0e14`, white ground. Fonts: Archivo (`--display`), Libre Franklin (`--sans`), Source Serif 4 (`--serif`). `* { box-sizing: border-box }`. Flat, square corners, no gradients/shadows.
- **Non-negotiable UI rules (user's global CLAUDE.md):** (1) never truncate/hide gameplay text — no ellipsis / `overflow:hidden`+nowrap / `display:none` on names, stats, rules; let containers grow. (2) No layout shift from any state change — popovers/panels are `position:absolute/fixed` off a relative trigger; never an inline-expanding `<details>` that shoves content. (3) Every button/link pairs an icon WITH a visible text label.
- Copy/writing style: no em-dashes; plain, varied prose (changelog entries and UI copy).
- **RULES TEXT IS VERBATIM. ALWAYS.** Any string the app presents as a rule — faction rules, HVP rules, Commands, Actions, phase and activation-step text, scenario and solo rules, the Learn to Play pages — is transcribed word for word from the book or the Quick Reference and displayed in full. Never summarise it, never paraphrase it, never tighten it, never write it from memory, never shorten it to fit a layout, and never drop a qualifying clause because it is long. If it does not fit, change the layout. If you cannot find the source text, extract it from `web/public/ABS-2E-Quick-Reference.pdf` or ask — do not reconstruct it. This has been got wrong repeatedly (see the changelog entries about the Passive Attacks Step and the Blockading tie-breaks), and each time it shipped a rule that was simply false.
- **Mass is Ⓜ** (U+24C2, the circled M) — the game's own symbol, in the data and in the UI. Rules prose goes through `ruleText()` (`web/format.ts`), NOT `escapeHtml()`, which is what draws the circled M; the only exceptions are `<textarea>` values, where the raw character must survive the round-trip, and `title=` attributes, which cannot hold markup. The `stat-mass` icon in `web/icons.ts` is the same mark; if one changes, change the other. It is not a hexagon.

## Build / test / deploy

```bash
# from D:/wargaming/Web Apps/ABS-V2  (Git Bash)
npx tsc --noEmit -p web/tsconfig.json   # typecheck — MUST pass
node --test                              # unit tests — MUST pass
npm run build                            # vite build -> dist/
```

**Deploy — GitHub Pages serves the `gh-pages` branch (legacy Pages, NOT Actions). Pushing `main` does NOT deploy.**
1. Bump `package.json` "version" AND add a top entry to `CHANGELOG` in `web/changelog.ts` (footer/Options read `CHANGELOG[0].version`).
2. On `main`: stage changed files **explicitly** (not `-A`), commit, `git push origin main`.
3. Sync `dist/` into the gh-pages worktree and push:
```bash
MSYS_NO_PATHCONV=1 robocopy "D:\wargaming\Web Apps\ABS-V2\dist" \
  "C:\Users\wongj\AppData\Local\Temp\abs-gh-pages-worktree" /MIR /XF .git .nojekyll /NFL /NDL /NJH /NJS
# robocopy exit 0-7 = success (3 = files copied). MSYS_NO_PATHCONV=1 stops Git Bash mangling the /flags.
cd /c/Users/wongj/AppData/Local/Temp/abs-gh-pages-worktree
git add -A && git commit -m "Deploy vX.Y.Z" && git push origin gh-pages   # -A is fine here (deploy output only)
```
- gh-pages worktree: `C:/Users/wongj/AppData/Local/Temp/abs-gh-pages-worktree` (its `.git` is a pointer → `.../.git/worktrees/abs-gh-pages-worktree`; recreate if missing). Keep `.nojekyll` and `ABS-2E-Quick-Reference.pdf` in the worktree (hence `/XF .git .nojekyll`; Vite copies the PDF from `web/public/`).
- Git conventions: explicit staging on `main`, never force-push, never `--no-verify`, always new commits (never amend). Co-author line: `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.
- Live: https://type37.github.io/a-billion-suns-shipyard . Repo: Type37/a-billion-suns-shipyard.
- Leave untracked: `HANDOFF.md` (this file), `abs-1e-vs-2e-comparison.docx`, `abs-play-mechanics-delta.docx`.

## Verification gotchas (IMPORTANT)
- The **in-app preview Browser freezes its animation timeline** — WAAPI (`element.animate`), `requestAnimationFrame`, AND CSS transitions do NOT advance there, and screenshots hang. You CAN verify structure/layout/computed-styles/which element got an animation via `javascript_tool` DOM measurement; you CANNOT watch motion play. So any animation that relies on the timeline to reach its visible end-state must have a correct **resting** state in the server-rendered HTML (e.g. decode spans seed the real character; the Armageddon underline is shown at rest and only held collapsed via an `is-landing` class during the slam). Verify motion structurally, eyeball it on the live site.
- Viewport sometimes reports 0×0 — measure text with a fixed-width OFF-screen element rather than trusting `getBoundingClientRect` on laid-out flex/grid children.
- `preview_start { name: "abs-builder-dev" }` runs the vite dev server (`.claude/launch.json`). Reload after edits if HMR looks stale.

## Key files
- `web/render.ts` — all views (large): `builderView`, `newFleetModal`, `factionDetailPane`, `foundryEditView`/`foundryListView`, `printView`, `playView`, `learnView`, `shipsView`, `soloListView`(via solo.ts), `optionsModal`, `emblemModal`, `footer`, `topbar`, `catalogShipRow`, `weaponsTable` (exported — solo reuses it), `emblemView`, `weaponEditor`.
- `web/actions.ts` — all `data-action` handlers.
- `web/main.ts` — `paint()` + post-render animation/nav hooks.
- `web/state.ts` / `web/store.ts` / `web/storage.ts` — state, store, persistence, data export/import.
- `web/style.css` — all CSS (single file).
- `web/icons.ts` — inline SVG icons + `diceRow`/`commandRow`/`commandToken`/`massGlyph`/`initiativeDice`.
- `web/format.ts` — `ruleText` (renders the Ⓜ SVG), escaping, dates.
- `web/solo.ts` — Junkspace solo mode; `web/catalog.ts` — `allFactions`/`HIDDEN_FACTION_IDS`; `web/faction-lore.ts` — per-faction slogans (`tagline` only); `web/changelog.ts` — in-app changelog; `web/emblems.ts` — emblem/icon library (`import.meta.glob` over `web/emblems/**`).
- `src/` — rules data + validation engine + tests. `src/data/commands.ts` holds the 7 core Commands + 6 Actions, transcribed verbatim from `web/public/ABS-2E-Quick-Reference.pdf` (that PDF is the authoritative source; extract it with `python -c "import pypdf; ..."` if you need the text again). Faction rules, HVP rules, and scenario rules are where EXTRA commands come from, so the print sheet prints those in full alongside the core list.
