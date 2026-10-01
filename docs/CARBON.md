# Carbon, as it applies here

Read from carbondesignsystem.com on 1 October 2026 (about 60 pages, usage and
style for each component, plus the forms and empty-state patterns and the 2x
grid). Fetched through a summariser, so quoted text is near-verbatim, not
guaranteed word for word. Anything not on a fetched page is marked
**unverified**. Re-read the source page before relying on a number here for
something that matters.

We keep our two faces (Archivo for headings, Libre Franklin for everything
else) on Carbon's type scale. Carbon's own face is IBM Plex. Segmented controls
follow Astryx's SegmentedControl (astryx.atmeta.com/components/SegmentedControl)
drawn in Carbon tokens, because Carbon has no segmented input of its own.

The working sample of every fork is `web/samples/carbon-fork.html` (dev server
only, not built).

## Where Carbon disagrees with the house rules

- **Truncation.** Carbon truncates with a tooltip in tags, dropdown options,
  tab overflow, progress-indicator labels, structured-list and data-table
  headers, and file names. The house rule is never truncate. House rule wins:
  wrap instead. Carbon itself forbids truncation for radio, checkbox and button
  labels, so those agree.
- **Tag "do not wrap".** Same conflict, same answer: let it wrap.
- **Accordion.** Carbon's accordion expands inline and pushes content down.
  The house rule bans a disclosure that displaces content when it opens. Where
  a `<details>` holds reading material on a page you scroll (Learn), the push is
  the point and the rule is about menus and popovers; anything that behaves
  like a menu or popover becomes a toggletip or overflow menu instead.
- **Microcopy.** Carbon's patterns allow descriptions and helper text. The
  house rule bans instructional copy. Helper text is used only for a real
  constraint (a min or max), never for instructions.

## Choosing the component

| Situation | Carbon says | Source |
| --- | --- | --- |
| One choice, 2 options | radio | dropdown, select |
| One choice, 3+ options, form | select (dropdown for filtering/sorting) | dropdown, select |
| One choice that needs context per option | selectable tile | radio |
| One choice from multi-column data | structured list | radio |
| Several choices | checkbox | checkbox |
| On/off, applies immediately | toggle | toggle, checkbox |
| On/off inside a flow that is confirmed later | checkbox | checkbox |
| Alternate views of the same content | content switcher | content switcher |
| Distinct content areas, subpages | tabs | content switcher, tabs |
| Mode or value from 2 to 5 options, all visible | segmented control (Astryx) | Astryx |
| Linear user-driven steps, 3+ | progress indicator | progress indicator |
| Measurable system progress | progress bar | progress bar |
| Small relative numeric change | number input | number input |
| Free text | text input | text input |
| Extra actions on a card or row | overflow menu (ghost trigger only) | menu buttons |
| Brief non-interactive hint | tooltip; with links or buttons, toggletip | tooltip, toggletip |
| A term inside text | definition tooltip | tooltip |
| Status message in flow | inline notification | notification |
| Brief status that goes away | toast (top right, about 5 s) | notification |
| Navigation | link; an action that changes data is a button | link |

## Components

### Button
- Primary appears once per screen. Secondary only alongside a primary,
  usually the negative action. Tertiary alone or with a primary. Ghost is the
  least emphasis.
- Sizes: xs 24, sm 32, md 40, lg 48 ("most common in software products"),
  xl 64 (bleeds to the edge of modals and side panels), 2xl 80.
- Padding 16px; fixed-width buttons are 16px left, 64px right. Icon 16px, to
  the right of the label. Type `body-compact-01`.
- Groups: on a page the primary is on the left; in dialogs and wizards on the
  right. Two or three buttons, more go in a menu button. Same width in a group.
  16px between buttons.
- Labels sentence case, verb + noun (Done, Close, Cancel, Add, Delete are
  fine alone). Never truncate. Left-align the label even on wide buttons.
- Icon-only: a tooltip is always required. Danger buttons cannot be icon-only.
- Danger: primary when the destructive action is the main step, tertiary or
  ghost when it is one option among several.

### Modal
- Passive (no buttons), transactional (Cancel + primary), danger,
  acknowledgment (one button), progress (Cancel ghost, Previous secondary,
  Next primary).
- Sizes xs, sm, md (default), lg: 24 / 36 / 48 / 72% wide at 1584, all 100%
  at 320. Brief text: xs or sm. Data tables: md or lg.
- Footer: at most three buttons. Two buttons are 50% each, secondary left,
  primary right. One button is 50% wide, right-aligned. Buttons are full
  bleed, 64px.
- Title `heading-03`, a brief verb phrase matching the primary button. Body
  `body-01`. Padding 16px. Body text keeps a 20% right margin; inputs span the
  full width. Close button 48×48.
- Not for non-critical messages (notifications), repetitive tasks, or lots of
  content (use a page).

### Forms pattern
- Fewer than five inputs: a dialog. More than five: a side panel. Complex or
  multistep: a page.
- Labels top-aligned, sentence case, no colon. Mark only the minority: if most
  fields are required, mark the optional ones "(optional)".
- 32px between inputs on a page, 24 or 16 in a modal or panel. 48px from the
  last input to the button group.
- Single column. Two or three related inputs may share a line.
- Buttons at the bottom, never the top. In panels, dialogs and tiles the group
  spans the container and bleeds to the bottom edge. Name the action, never
  "Submit".
- Validate inline when a field loses focus.

### Text input
- Sizes xs 24, sm 32, md 40 (default), lg 48, fluid 64.
- `field` fill, 1px `border-strong` bottom line, placeholder
  `text-placeholder`. Label 8px above. Padding 16px.
- The placeholder never replaces the label. Width reflects expected length.

### Number input
- For small relative changes. Large ranges: slider. Continuous values like
  prices or distances: text input.
- Sizes sm 32, md 40 (default), lg 48, fluid 64.
- `field` fill, 1px `border-strong` bottom line (2px on focus or error).
  Label `label-01` in `text-secondary`, 8px above. Value `body-compact-01`,
  16px in. Subtract and add sit together at the right end. Icons
  `icon-primary`, hover `field-hover`.
- Always has a default value. Arrow keys step it. Helper text states min/max.

### Select and dropdown
- Select: one choice in a form, 3+ options. Fewer than 3: radio. Options in a
  sensible order (alphabetical, numeric or by frequency).
- Dropdown: filtering, sorting, limited space. Not for two options. Field
  padding 16px left, 48px right. Menu on `layer`, selected item
  `layer-selected` with a check.
- Sizes xs 24, sm 32, md 40 (default), lg 48.

### Radio button
- One of several mutually exclusive options. Nothing preselected by default.
- 20px ring, 8px dot, 8px to the label. Items 8px apart. Group label
  `label-01`, labels `body-compact-01`. Labels under three words, wrap beneath,
  top-aligned with the control. Never truncate.

### Checkbox
- Several choices; filtering; terms; parent/child selection.
- 16px box. Label 8px to the right. Items 4px apart. Checked: `icon-primary`
  fill, `icon-inverse` check. Labels under three words, never truncated.

### Toggle
- One on/off setting that applies immediately and is reversible. Not for
  anything needing confirmation or a save step, and never for more than two
  options.
- Default 24×48 with an 18px handle and visible state text. Small 16×32.
- Off `toggle-off`, on `support-success`. Label `label-01`, state text
  `body-compact-01`, three words or fewer, adjectives ("On", "Off").

### Content switcher
- Alternate views of the same content. Not for subpages (tabs), not for
  yes/no (toggle).
- Sizes sm 32, md 40, lg 48. Equal widths, set by the longest label. Do not
  mix icon and text segments. Do not flush it to the container edge.
- Low contrast (in cards and modals, near buttons): `content-switcher-
  background` with a `border-strong` edge; selected
  `content-switcher-selected`, `text-primary`, `heading-compact-01`.
- High contrast (higher in the page): transparent with `border-inverse`;
  selected `layer-selected-inverse` with `text-inverse`.
- Labels are two or three words, nouns, never actions.

### Segmented control (Astryx)
- One selection from 2 to 5 mutually exclusive options, all visible, where
  the selection sets a value or mode. Always exactly one selected.
- Not for page navigation (tabs) and not for a single on/off (toggle button).
- Needs an accessible label for the group. Segments may carry icons, may
  stretch to fill the width, may be individually disabled.

### Tabs
- Related but different content on one page. Not for filtering the same
  content (content switcher), not for linear steps (progress indicator).
- Line tabs: md 40 default, 2px bottom border in `border-subtle`, selected
  `border-interactive`, selected label `heading-compact-01`. Padding 16px by
  8px. Labels one or two words. Contained tabs attach to a panel and carry more
  weight.

### Accordion
- Organises information the reader doesn't need in full. Starts collapsed;
  several sections may be open. Chevron at the end. Sizes sm 32, md 40, lg 48.
  Title `body-01`, borders `border-subtle`, hover `layer-hover`.

### Tile
- Base: short content, may hold buttons or links. Links bottom-left; buttons
  span the full width at the bottom.
- Clickable: the whole tile is one target; no internal CTAs. Arrow icon bottom
  right in `icon-interactive`.
- Selectable: single (radio icon) or multi (checkbox icon). Internal CTAs only
  with their own click targets.
- Expandable: whole container toggles, or a chevron button does when the tile
  holds controls.
- Min 64 high × 128 wide, padding 16px, `layer` fill, `body-compact-01`.
  Selected border `border-inverse`. Don't mix variants in a group.

### Tag
- Read-only (categorise), dismissible (filters), selectable (filter on page),
  operational (reveals overflow). Not a link. One job per tag.
- sm 18, md 24 (default), lg 32. Radius 16px. Padding 8px. `label-01`.
  Labels under 20 characters. Colour may tell categories apart.

### Progress bar
- Long system operations with measurable progress. Determinate never goes
  backwards. Not for user-driven steps (progress indicator).
- 8px or 4px high. Track `border-subtle`, bar `border-interactive`; success
  and error bars `support-success` / `support-error`. Label above or beside,
  never inside; helper text gives the count.

### Progress indicator
- A linear process of 3+ steps the user drives. Vertical when possible. Step
  min width 128px, 16px icon. Complete and current `interactive`, active line
  `border-interactive`, not started `border-subtle`. Labels one or two words.

### Notification
- Inline: in the flow, near what it refers to. Persists.
- Toast: top right, about 5 s, 288px wide, newest on top.
- Actionable: one action; ghost inline, tertiary in a toast.
- Callout: info or warning, cannot be dismissed.
- 3px left edge and icon in `support-{status}`. Min height 48px. Title
  `heading-compact-01`, body one or two sentences.

### Overflow menu (Menu buttons, Menu)
- Extra options when space is short, usually in rows or cards. The trigger is
  always a ghost button, xs 24 to lg 48; menu items match its height.
- Danger items last, after a divider. Most-used at the top. At most 12 items.

### Tooltip, toggletip
- Tooltip: hover or focus, brief, non-interactive, never information needed to
  finish the task. Toggletip: click, may hold links or buttons, max 288px.
  Definition tooltip for terms in text. `background-inverse` with
  `text-inverse`, padding 16px.

### Link
- Navigation only. Anything that changes data or state is a button.
- Standalone links underline on hover/focus and may carry an icon; inline
  links are always underlined and never carry one. `link-primary`, hover
  `link-primary-hover`.

### Structured list, data table, file uploader, pagination
- Structured list: browsing or one selection from rows; radio on the left.
  Rows 60px default, 36px condensed.
- Data table: rows xs 24 to xl 64, md 40 default, never mixed. Header
  `layer-accent`, cells `body-compact-01`, padding 16px.
- File uploader: button or drop zone; md 40 default. Tertiary button if the
  page already has a primary. Not multi-file inside a modal.
- Pagination: under data tables, matching their row height. Not for form steps.

### Empty states
- Title, body, one primary action, optional help link. Left-aligned. No dead
  ends, no jargon, no menu of options.

## Foundations

- **Type, productive set:** `label-01` 12/16 · `helper-text-01` 12/16 ·
  `body-compact-01` 14/18 · `body-01` 14/20 · `body-compact-02` 16/22 ·
  `body-02` 16/24 · `heading-compact-01` 14/18 600 · `heading-01` 14/20 600 ·
  `heading-02` 16/24 600 · `heading-03` 20/28 400 · `heading-04` 28/36 400 ·
  `heading-05` 32/40 400 · `heading-06` 42/50 300 · `heading-07` 54/64 300.
  Weights 300, 400, 600; semibold for section heads, not long text.
- **Spacing:** 2, 4, 8, 12, 16, 24, 32, 40, 48, 64, 80, 96, 160
  (`spacing-01` to `spacing-13`).
- **2x grid:** 8px mini unit. sm 320 (4 columns), md 672 (8), lg 1056 (16),
  xlg 1312 (16), max 1584 (16). Column padding 16px. Wide gutter 32px
  (required for labelled components), narrow 16px (most common), condensed
  1px. Type never hangs into gutters. Max width 1584px.
- **How the app uses the grid** (2x grid Overview, Guidelines and Code tabs,
  read in the browser 1 October 2026): editorial style model, the grid held at
  the lg width (1056px) and centred. Type sits on one key line 32px in (16
  margin + 16 column padding), the masthead wordmark included. Card grids use
  narrow gutter mode: containers hang 16px into the gutter, 16px apart, 16px
  padding, so a card's text meets the page title's key line. Form fields keep
  wide gutters (Carbon: labelled components must). "Type never hangs into the
  gutter." Vertical spacing uses the fixed scale 8, 16, 24, 32, 48, 64, 80.
  Implementation: `--grid-max`, `--key`, `--gutter-narrow`, `--gutter-wide`
  in `web/style.css`, under "One page width on a desktop".
- **Colour (White theme):** see the `--cds-*` mapping in `web/style.css`
  `:root`, values from the color/tokens page.

## What each of our controls becomes

| Our control | Where | Becomes |
| --- | --- | --- |
| Era chooser `.nf-era-btn` | New fleet | segmented control |
| Credits limit `.nf-opt` + Custom | New fleet | segmented control; Custom shows a number input |
| Faction plaques `.faction-plaque` | New fleet, Custom Rules | selectable tile (single) |
| Species switch `.species-opt` | builder | segmented control |
| Phase tabs `.switcher` | Play | progress indicator (four linear steps) |
| Print layout and paper `.segment` | Print | segmented control |
| Reserve / Jumped in `.pf-pos-opt` | Play | segmented control |
| Table / Compare `.comp-view-btn` | Compendium | content switcher |
| Chart stat `.chart-picker-btn` | Compendium | content switcher |
| Pilot class `.pilot-opt` | Solo | selectable tile (single) |
| Carrier picker `details.hvp-pick` | builder, Play | dropdown |
| Emblem library `.lib-icon` | emblem dialog | selectable tile grid |
| Jump turn picker `.ltp-pick` | Learn | tabs |
| Personnel choose `.sy-hvp-check` | Shipyard, builder | selectable tile (multi) |
| Activated `.pf-acted` | Play | checkbox |
| CMD pips `.cmd-pip` | Play | stays custom (a game token) |
| Steppers `.stepper`, `.stepper-btn`, `.dial` | builder, Shipyard, Play, Solo | number input |
| Native number inputs | Custom Rules | number input |
| Solo tabs, emblem tabs, Learn tabs | Solo, emblem dialog, Learn | line tabs |
| Learn progress, credits meter | Learn, builder | progress bar |
| Game ticks, alert pips | Solo | progress bar |
| Rules-check and personnel popovers | builder | toggletip |
| Learn folds, era accordion, guide steps | Learn, builder | accordion |
| Fleet card, outfit card | Fleets, Solo | base tile, link bottom left, overflow menu |
| Add-unit card, home rows | Add unit, Home | clickable tile |
| Name fields, Solo fields, Custom Rules fields | everywhere | text input / text area |
| Native selects | Compendium, Solo, Custom Rules | select |
| File buttons and drop boxes | Custom Rules, Options, emblem dialog | file uploader |
| Badges `.freeplay-badge`, `.au-card-owned` and the rest | various | read-only tag |
| Toast `.toast` | everywhere | toast notification |
| Glossary term `.ltp-gloss` | Learn | definition tooltip |
| Sortable headers `.comp-sortable` | Compendium | data table |
| Links that change data (`.linklike`) | Print | ghost button |
