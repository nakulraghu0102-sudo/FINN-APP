---
name: FINN
description: A station board for an Indian-equities portfolio; it shows only your trains and how many need you.
colors:
  coach: "#1d3b8f"
  coach-deep: "#142b6b"
  coach-soft: "#e3e9f8"
  accent-ink: "#1d3b8f"
  on-coach: "#ffffff"
  on-coach-2: "#c9d5f5"
  plate: "#ffcc00"
  plate-ink: "#111111"
  plate-ink-2: "#3b3000"
  ground: "#eef1f5"
  surface: "#ffffff"
  surface-2: "#f5f7fa"
  timecol: "#fbf7e4"
  ink: "#111418"
  ink-2: "#39414d"
  muted: "#5d6673"
  line: "#d8dde5"
  line-2: "#c3cad5"
  up: "#0a7a4f"
  down: "#c2361f"
  coach-dark: "#1a2f6e"
  coach-deep-dark: "#10204f"
  coach-soft-dark: "#1b2850"
  accent-ink-dark: "#9fb4ff"
  on-coach-2-dark: "#b9c7ef"
  ground-dark: "#0c1016"
  surface-dark: "#141a22"
  surface-2-dark: "#1a222c"
  timecol-dark: "#1d1f17"
  ink-dark: "#e9edf2"
  ink-2-dark: "#bcc5d0"
  muted-dark: "#8f9aa8"
  line-dark: "#26303d"
  line-2-dark: "#34404f"
  up-dark: "#43c690"
  down-dark: "#ff7f69"
  chart-coach-dark: "#7d97ec"
typography:
  board-count:
    fontFamily: "Rajdhani, Mukta, system-ui, sans-serif"
    fontSize: "74px"
    fontWeight: 700
    lineHeight: 0.86
    letterSpacing: "0.01em"
  board-word:
    fontFamily: "Rajdhani, Mukta, system-ui, sans-serif"
    fontSize: "36px"
    fontWeight: 700
    letterSpacing: "0.07em"
  wordmark:
    fontFamily: "Rajdhani, Mukta, system-ui, sans-serif"
    fontSize: "25px"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.07em"
  headline:
    fontFamily: "Mukta, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "30px"
    fontWeight: 700
    lineHeight: 1.08
    letterSpacing: "-0.01em"
  page-title:
    fontFamily: "Mukta, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "26px"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Mukta, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "17px"
    fontWeight: 600
    lineHeight: 1.32
  body:
    fontFamily: "Mukta, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
    fontFeature: "\"tnum\" 1"
  body-small:
    fontFamily: "Mukta, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
    fontFeature: "\"tnum\" 1"
  tier-head:
    fontFamily: "Rajdhani, Mukta, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.12em"
  control-label:
    fontFamily: "Rajdhani, Mukta, system-ui, sans-serif"
    fontSize: "13.5px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.07em"
  label:
    fontFamily: "Rajdhani, Mukta, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.1em"
  time-date:
    fontFamily: "Rajdhani, Mukta, system-ui, sans-serif"
    fontSize: "22px"
    fontWeight: 700
    lineHeight: 1.15
  figure-display:
    fontFamily: "Rajdhani, Mukta, system-ui, sans-serif"
    fontSize: "26px"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.02em"
rounded:
  coach: "2px"
  stamp: "3px"
  sm: "4px"
  md: "6px"
  sheet: "12px"
spacing:
  hair: "3px"
  xs: "6px"
  sm: "8px"
  md: "10px"
  card: "12px"
  panel: "14px"
  view: "16px"
  timecol: "58px"
  column: "600px"
  tabbar: "62px"
components:
  board:
    backgroundColor: "{colors.plate}"
    textColor: "{colors.plate-ink}"
    rounded: "{rounded.md}"
    padding: "6px"
    typography: "{typography.board-count}"
  board-clear:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "6px"
  stamp-e5:
    backgroundColor: "{colors.plate}"
    textColor: "{colors.plate-ink}"
    rounded: "{rounded.stamp}"
    padding: "4px 7px 3px"
    typography: "{typography.label}"
  stamp-e4:
    backgroundColor: "{colors.plate}"
    textColor: "{colors.plate-ink}"
    rounded: "{rounded.stamp}"
    padding: "4px 7px 3px"
    typography: "{typography.label}"
  stamp-e3:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.stamp}"
    padding: "4px 7px 3px"
    typography: "{typography.label}"
  stamp-e2:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-2}"
    rounded: "{rounded.stamp}"
    padding: "4px 7px 3px"
    typography: "{typography.label}"
  stamp-e1:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.muted}"
    rounded: "{rounded.stamp}"
    padding: "4px 7px 3px"
    typography: "{typography.label}"
  ticker:
    backgroundColor: "{colors.coach}"
    textColor: "{colors.on-coach}"
    rounded: "{rounded.stamp}"
    padding: "4px 7px 3px"
  ticker-hover:
    backgroundColor: "{colors.coach-deep}"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "11px 12px"
  time-column:
    backgroundColor: "{colors.timecol}"
    textColor: "{colors.ink-2}"
    width: "58px"
    typography: "{typography.time-date}"
  chip:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-2}"
    rounded: "{rounded.sm}"
    padding: "5px 11px"
    typography: "{typography.control-label}"
  chip-pressed:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.surface}"
  button:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "6px 11px"
    typography: "{typography.control-label}"
  button-hover:
    backgroundColor: "{colors.surface-2}"
  button-primary:
    backgroundColor: "{colors.coach}"
    textColor: "{colors.on-coach}"
    rounded: "{rounded.sm}"
    padding: "6px 11px"
  button-primary-hover:
    backgroundColor: "{colors.coach-deep}"
  button-ghost:
    textColor: "{colors.muted}"
    rounded: "{rounded.sm}"
    padding: "6px 11px"
  shell-bar:
    backgroundColor: "{colors.coach}"
    textColor: "{colors.on-coach}"
    padding: "11px 16px"
  tab:
    textColor: "{colors.muted}"
    rounded: "{rounded.md}"
    typography: "{typography.control-label}"
  tab-active:
    textColor: "{colors.accent-ink}"
  tier-head:
    textColor: "{colors.ink-2}"
    typography: "{typography.tier-head}"
  ask-box:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "5px 5px 5px 13px"
  sheet:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.sheet}"
    padding: "18px"
---

# Design System: FINN

## Overview

**Creative North Star: "The Platform Board"**

FINN is an Indian Railways platform at office daylight. The day's filings arrive like trains; a chrome-yellow station-name plate with a black keyline announces how many need you, coach-blue livery carries the shell and every selected state, and below it the brief reads like a reservation chart: ruled, dense rows, each with a cream time column, a coach-blue ticker plate and a status stamp. The ground is cool platform grey; work surfaces are white; ink is near-black.

Density is chart-density, not dashboard-density. Rows are tight (10px between cards, 1px rules), figures align on shared columns, and emphasis is carried by one five-step materiality ramp rather than by card size or color variety. Rajdhani, a condensed signage face, speaks for the board, stamps, tier heads, tickers and display-size figures; Mukta, with tabular figures switched on at the body, carries every sentence and every table. The system rejects the grey dashboard of identical rounded cards: no card is ever just a card; it is a chart row with a time.

Light is the primary scene. Dark is a secondary variant that keeps every role and leaves the yellow plate untouched: the board is the same physical sign at night.

**Key Characteristics:**
- Coach-blue shell bar, ticker plates and selection; chrome-yellow plate reserved for "needs you".
- A station-board count that flips like a split-flap when a card is cleared, and turns into a white board when nothing needs you.
- Five materiality steps (e1–e5) that drive stamp, heading weight and time-column tint together.
- Green and red appear only on signed numbers.
- Every card and chart row leads with a 58px time column.
- 4–6px corners, 1px rules, 1.5px stamp and control keylines.

## Colors

A livery palette: one blue, one yellow, cool greys, black ink, and two price colors that never leave the numbers.

### Primary
- **Coach Blue** (coach): the shell bar, the iOS safe-area strip, ticker plates, the primary button, the person avatar, switch-on and range-slider fill, the filled cars of the coach strip, and chart bars and lines. It is livery and selection, never decoration.
- **Coach Blue Deep** (coach-deep): hover and press for anything coach-blue (ticker, primary button).
- **Coach Mist** (coach-soft): quiet positive fills: the "ok" advice note, positive signal tiles, delivered/beat badges, the chart area under a line, the ask-box focus halo.
- **Accent Ink** (accent-ink): coach blue as text. Links, the active tab, focus rings, tripwire threshold readouts, the page-title emphasis. In dark it lifts to a pale periwinkle (accent-ink-dark) so blue text stays legible, while coach itself darkens.
- **On Coach** / **On Coach Muted** (on-coach, on-coach-2): text and keylines on the blue bar; the muted step carries the snapshot/live pill.

### Secondary
- **Chrome Yellow Plate** (plate): the station board, the Brief tab badge, "needs you" stamps and the stamps of materiality steps 4 and 5. Always paired with **Plate Black** (plate-ink) as text and keyline; **Plate Umber** (plate-ink-2) sets the board's secondary lines. Unchanged in dark.

### Tertiary
- **Rising Green** (up) and **Falling Red** (down): price and percentage deltas, results-table QoQ/YoY cells, signed chart bars, CAGR tiles, holding day-change, portfolio and Nifty day lines. Dark lifts them (up-dark, down-dark).

### Neutral
- **Platform Grey** (ground): the page ground and the sticky lens bar.
- **Work White** (surface): cards, panels, chart lists, the tab bar, sheets, the clear board.
- **Concourse Grey** (surface-2): hover fills, reaction strips, notes, routine groups, the time column of lower-materiality rows, the e1 stamp.
- **Chart Cream** (timecol): the time column of high-materiality cards and rows. In dark it becomes a warm near-black olive (timecol-dark).
- **Black Ink** (ink), **Slate Ink** (ink-2), **Muted Slate** (muted): primary text, secondary text and reasons, labels and meta.
- **Rule** (line) and **Strong Rule** (line-2): 1px dividers and borders; line-2 for stamp, chip and button keylines and the empty cars of the coach strip.
- **Dark chart line** (chart-coach-dark): dark-theme fill and stroke for coach-blue chart bars, lines and points, where coach-dark would vanish. It is written as a literal in three selectors, not as a custom property.

### Named Rules
**The One Plate Rule.** Chrome yellow with a black keyline means "needs you" and nothing else: the board while anything is open, the tab badge with its count, and stamps on act cards and materiality steps 4–5. When nothing needs you, the board itself goes white.

**The Delta-Only Rule.** Green and red appear only on signed numbers. Negative signals, missed promises and warnings are carried by solid ink (black tile, black badge, ink-outlined advice), never by red.

**The Livery Rule.** Coach blue is the selection and identity color: shell, tickers, primary action, active tab, focus. A chip that is pressed turns black, not blue; blue stays with navigation, identity and the one primary action.

## Typography

**Display Font:** Rajdhani 600/700 (with Mukta, system-ui fallback)
**Body Font:** Mukta 400–700 (with system-ui, -apple-system, Segoe UI, Roboto)

**Character:** Rajdhani is the painted signage on the platform: condensed, uppercase, generously tracked. Mukta is the clerk's hand on the chart: an Indian-designed humanist sans with tabular figures, so rupee columns line up.

### Hierarchy
- **Board count** (700, 74px, 0.86; 88px at ≥900px): the number that needs you. Its word ("NEED YOU", "NOTHING URGENT", "ALL QUIET") sits beside it at 36px (42px at ≥900px), tracked 0.07em.
- **Wordmark** (Rajdhani 700, 25px, 0.07em): "FINN" in the shell bar.
- **Headline** (Mukta 700, 30px, 1.08): the dossier company name. **Page title** (Mukta 700, 26px, 1.15) heads Holdings and similar tab openers.
- **Title** (Mukta 600, 17px, 1.32): card headlines; the ramp adjusts it per materiality step.
- **Body** (Mukta 400, 16px, 1.5, tabular figures): base text; lede at 15.5px capped at 60ch; reasons, notes and lists at 14px; meta at 13–13.5px.
- **Tier head** (Rajdhani 700, 14px, 0.12em, uppercase): "NEEDS YOU 3", section heads, figure titles.
- **Control label** (Rajdhani 700, 13.5px, 0.07em, uppercase): chips, buttons, tab labels (12.5px).
- **Label** (Rajdhani 700, 12px, 0.1em, uppercase): stamps, table column heads, inline field keys ("TRIPPED", "LIKELY WHY"), stat captions.
- **Display figures** (Rajdhani 700, 18–40px): board stats (26px), the dayline (24px), time-column dates (22px; 20px in chart lists), chart-list figures (18px), the noise-meter rate (40px), the dossier price (26px).

### Named Rules
**The Two Hands Rule.** Rajdhani is for signage: the board, stamps, tickers, tier heads, controls, labels and figures shown at display size. Every sentence, every table cell and every figure at reading size is Mukta with tabular figures. Rajdhani is never used for a sentence.

**The Uppercase Signage Rule.** Rajdhani at label and control sizes is uppercase and tracked 0.07–0.12em; Mukta is never uppercased.

## Layout

One column, one thumb. Content sits in a centered column capped at 600px with 16px side gutters (respecting safe-area insets). The coach-blue shell bar is sticky at the top; the four-tab bar is fixed at the bottom (62px), and the view reserves its height plus 28px. Views are a grid with a 16px gap; card stacks use 10px; panels pad 14px; cards pad 11px 12px.

Every brief card and every chart row is a two-column grid: a 58px time column (date large, month and 24-hour time below, or "close" for end-of-day events) and the body. Inside chart rows the first line is a shared grid (104px ticker, 64px figure, rest) so tickers and figures align down the list.

The coach strip sits in the tier head on a three-part grid (label and count, strip, "n/m cleared"): one 18×9px car per item in the tier, filled coach-blue while open, outlined in line-2 once cleared, wrapping when the tier is long.

Breakpoints are few: at 520px bull/bear splits into two columns; at 900px the board count grows to 88px. Research tiles use three or four equal columns at every width. The lens chips stick under the shell bar on the platform-grey ground.

### Named Rules
**The Time Column Rule.** Anything that arrived at a moment (a filing, a tripped price move) leads with the 58px time column. Static entities (holdings, tiles, figures) do not.

**The Extent Rule.** A tier head shows its full extent as a coach strip with one car per item, alongside the cleared count. Clearing empties a car; it never removes one.

## Elevation & Depth

Mostly flat, with one soft lift. The board, act cards and the toast carry a two-layer ambient shadow; everything else (worth-a-glance cards, panels, chart lists, holdings) sits flat on 1px rules. Depth in the brief comes from the plate, the time-column tint and the materiality ramp, not from stacking.

### Shadow Vocabulary
- **Platform lift** (`box-shadow: 0 1px 2px rgb(17 20 24 / 6%), 0 4px 14px -8px rgb(17 20 24 / 22%)`; dark: `0 1px 2px rgb(0 0 0 / 35%), 0 6px 18px -10px rgb(0 0 0 / 70%)`): the board, full brief cards, the toast.
- **Plate halo** (`box-shadow: 0 0 0 2px var(--plate)`): a zero-offset yellow ring outside the keyline on e5 stamps only.
- **Focus halo** (`box-shadow: 0 0 0 3px var(--coach-soft)`): the ask box while focused.

### Named Rules
**The Compact-Is-Flat Rule.** Only "needs you" cards lift; worth-a-glance cards drop the shadow. Elevation follows the tier.

## Shapes

Small, sign-like corners: 6px on cards, panels, the board and icon buttons; 4px on chips, buttons, notes and tiles; 3px on stamps, tickers and badges; 2px on coach cars and chart bars; 12px only on the top corners of the bottom sheet. The board nests a 2.5px black keyline (3px radius) inside 6px of yellow, with a 2.5px black rule under the count, the way a station-name plate is framed. Stamps, chips, buttons and inputs carry 1.5px keylines; dividers are 1px. The routine block is the one dashed border: filed and handled, not deleted.

## Components

### The Station Board (signature)
- **Plate:** chrome yellow, 6px padding, 6px radius, platform lift; inner 2.5px plate-ink keyline at 3px radius, padding 10px 14px.
- **Content:** the count in a split-flap cell, the word beside it, a 2.5px black rule, three stats (26px figures over 12px uppercase captions: worth a glance, routine filed, of N quiet), then the date and window line under a 25%-black hairline.
- **Split-flap:** when the open count changes, the numeral flips once (0.42s; rotateX to −88°, swap, from +88° back to 0, dimmed to 70% brightness at the fold).
- **Clear state:** with nothing needing you, the plate becomes a white board (surface fill, line-2 keyline and rule, muted captions, ink figures) and shows the word alone: "NOTHING URGENT" or "ALL QUIET".

### Status Stamps (materiality ramp)
Rajdhani 12px uppercase, 0.1em, 3px radius, 1.5px keyline, padding 4px 7px 3px. The ramp is driven by the materiality score (85 / 70 / 55 / 40):
- **e5:** plate fill, black keyline, plus the 2px plate halo. Card headline 18px/700, card border line-2, cream time column.
- **e4:** plate fill, black keyline. Headline 17px/600, cream time column.
- **e3:** white fill, ink keyline and text. Headline 16.5px, concourse-grey time column.
- **e2:** white fill, line-2 keyline, slate text. Headline 16px/500, grey time column, slate date.
- **e1:** concourse fill, line-2 keyline, muted text; also the "Handled" stamp on routine filings.
Holdings stamps shrink to 11px.

### Ticker Plate
Coach-blue fill, white Rajdhani 14px tracked 0.06em, 3px radius. Always a button that opens research; hover deepens to coach-deep.

### Brief Cards (chart rows)
- **Corner Style:** 6px. **Background:** white with a 1px rule border. **Shadow:** platform lift on act cards; flat on compact (worth-a-glance) cards.
- **Structure:** time column, then body (11px 12px, 8px gap): ticker · company and age · stamp; headline; filed title; reason line (bold reason, then its proof figure); optional results table, person block, reaction strip; actions (Filing, Dig in, ghost Done at the right).
- **Swipe to clear:** the card follows a rightward drag up to 140px; past 100px it clears, slides out (translateX 110%, fade, 0.22s) and the list redraws so the next card takes the slot. A vertical drag over 24px cancels. Cleared cards sit at 55% opacity at the end of their tier with Undo.

### Reservation-Chart List
One white, ruled, 6px-radius list. Each row: the 58px time column (cream at e4–e5, grey otherwise; 20px date) and a body whose first line is the shared ticker / figure / rest grid. Figures are Rajdhani 18px, colored by sign; field keys are 12px uppercase labels ("TRIPPED", "LIKELY WHY"). Used for tripped price moves and filing alerts.

### Results Table
Mukta 15px, tabular; column heads in 12px Rajdhani labels; 1px rules between rows; current value 600 weight; QoQ and YoY cells in green or red by sign.

### Chips
- **Style:** white fill, 1.5px line-2 keyline, 4px radius, Rajdhani 13.5px uppercase; a plain variant in Mukta 14px sentence case for suggested questions.
- **State:** hover darkens the keyline to slate; pressed fills solid ink with white text. Rows scroll horizontally without a scrollbar.

### Buttons
- **Shape:** 4px radius, 1.5px keyline, padding 6px 11px, Rajdhani 13.5px uppercase, inline 16px SVG icon.
- **Default:** white with line-2 keyline; hover slate keyline and concourse fill.
- **Primary:** coach-blue fill and keyline, white text; hover coach-deep. Used for the single recovery action on an empty brief ("Widen to 3 days").
- **Ghost:** no keyline, muted text; hover ink on concourse. Used for Done/Undo and Show.
- **Disabled:** 50% opacity, not-allowed cursor.
- **Focus:** 2px accent-ink outline, 2px offset, everywhere.

### Inputs / Fields
- **Ask box:** white, 1.5px line-2 keyline, 6px radius, borderless 16px input with a 38px icon button; focus turns the keyline coach blue with a 3px coach-mist halo.
- **Switch:** 44×26 track, line-2 off, coach on, white 20px knob sliding 18px.
- **Range:** native slider tinted coach; the live value reads in Rajdhani 20px accent-ink.
- **Date fields:** concourse fill, 1.5px keyline, 4px radius.

### Navigation
- **Shell bar:** coach blue, sticky; wordmark, snapshot/live pill (outlined in 32% white; hollow dot for snapshot, filled for live), 36px outlined info button.
- **Tab bar:** white, fixed, 1px top rule, four equal tabs with 22px stroke icons over 12.5px Rajdhani labels. Muted at rest, concourse on hover; the active tab turns accent-ink with a 3px bar at the top edge. The Brief tab carries a plate badge with the open count.

### Sheets, Toast, Loading
- **Sheet:** white, 12px top corners, over a 45% near-black scrim; rises 24px in 0.25s. Titles in Rajdhani 22px uppercase; definition rows on a 112px key column.
- **Toast:** solid ink with white text, 6px radius, platform lift, above the tab bar, 3.8s.
- **Skeleton:** 4px-radius bars shimmering line to concourse grey on a 1.2s loop.

### Motion grammar
One ease for everything: `cubic-bezier(.16, 1, .3, 1)`, a fast-out settle. Hover and state changes 0.15–0.18s; card exit 0.22s; sheet and toast rise 0.22–0.25s; the split-flap 0.42s and only on a changed count. Under `prefers-reduced-motion` every animation and transition is off, and clearing redraws without the slide.

## Do's and Don'ts

### Do:
- **Do** reserve chrome yellow with a black keyline for "needs you": the board, the Brief badge, act stamps and materiality steps 4–5.
- **Do** turn the board white when nothing needs you, and flip the count only when it changes.
- **Do** lead every arrival (filing, tripped move) with the 58px time column: cream at high materiality, concourse grey below.
- **Do** carry emphasis through the single e1–e5 ramp (stamp, headline size and weight, time-column tint together), driven by the materiality score.
- **Do** end every reason line with its proof figure.
- **Do** show tier extent with the coach strip, one car per item, emptied rather than removed on clear.
- **Do** set every sentence and table in Mukta with tabular figures; keep Rajdhani for signage and display-size figures.
- **Do** keep corners at 6px (containers), 4px (controls) and 3px (stamps, tickers).

### Don't:
- **Don't** use green or red for anything but signed numbers; carry negative or missed states in solid ink.
- **Don't** use chrome yellow for emphasis, highlights or brand moments outside "needs you".
- **Don't** fill a pressed chip with coach blue; pressed chips are ink.
- **Don't** add shadows to flat surfaces; only the board, act cards and the toast lift.
- **Don't** build a grey dashboard of identical rounded cards: no card without a time column, no emphasis by card size alone.
- **Don't** set sentences in Rajdhani or uppercase Mukta.
- **Don't** change the plate in dark; only the surrounding roles shift.
