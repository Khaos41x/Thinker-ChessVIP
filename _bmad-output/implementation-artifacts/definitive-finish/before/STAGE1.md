# Definitive finish — stage1 baseline audit

This is a read-only implementation audit. QA files and evidence were created; production source and live preferences were not changed. Baseline uses the preserved `.definitive-finish-baseline/script.js`, configuration module and frontend assets.68measurements cover48console cases and20External Config cases. Every requested console state was verified against actual checked Bot/Smart Pacing inputs and settled Timing display before measurement; transient animation frames are not labelled as settled states.

## Matrix and provenance

Console widths1086/1280/1440/1920/1033/800 × Bot OFF/ON × Smart Pacing OFF/ON × Scout empty/populated. Config widths1440/1280/1024/768/390 × Bot OFF/ON × Smart Pacing OFF/ON. Fixture config uses saved53/61targets; Rating Goal is unset. Genuine existing OpponentIntel rendering and its existing fixture data path produce the populated Scout. Browserprofile is isolated; there is no authenticated real Chess.com game in these measurements. No game is played or automated.

The JSON retains yposition, top/bottom divider positions, content center, row center, center deviation, margins, paddings and align-items for every measured row. CSV exports make each row/state auditable: `control-rows.csv`, `small-text.csv` and `component-colors.csv`. Text centers are measured from the first real text-node Range; toggle/swatch centers use their actual element rectangles. A13pxfont may yield a15pxtext fragment, so glyph-Range centers and even-height label-box centers are not interchangeable.

## Current control alignment at1440px

Representative populatedScout, Bot OFF, Smart Pacing OFF. All offsets are content center minus row center, inpx.

| Surface | Row | Height | Text offset | Toggle/swatch offset | Top margin |
|---|---|---:|---:|---:|---|
| Console | Bot ON OFF | 36 | -0.5 | 0 | 0px |
| Console | Auto Moves ON OFF | 36 | -0.5 | 0 | 8px |
| Console | Auto Queue ON OFF | 36 | -0.5 | 0 | 0px |
| Console | Evaluation Bar ON OFF | 36 | -0.5 | 0 | 0px |
| Console | Banner ON OFF | 36 | 0 | 0.5 | 8px |
| Console | Recent Form ON OFF | 36 | 0 | 0.5 | 0px |
| Console | Theme | 36 | -0.5 | 0 | 0px |
| Console | Analysis Engine Ready | 16 | 0 | None | 0px |
| Console | Auto Rating ON OFF | 36 | -0.5 | 0 | 0px |
| Console | Strength Level Current 3200 | 17 | -1 | None | 0px |
| Console | Move Timing 0.50–1.00 s | 17 | -1 | None | 0px |
| Console | Smart Pacing ON OFF | 36 | -0.5 | 0 | 0px |
| Config | Bot | 36 | 0 | 0 | 0px |
| Config | Auto Moves | 36 | 0.5 | 0.5 | 0px |
| Config | Auto Queue | 36 | 0.5 | 0.5 | 0px |
| Config | Analysis Engine Ready | 17 | 0 | None | 0px |
| Config | Auto Rating | 36 | 0 | 0 | 0px |
| Config | Strength Level 3200 | 17 | 0 | None | 0px |
| Config | Move Timing 0.50–1.00 s | 17 | 0 | None | 0px |
| Config | Minimum delay s – Maximum delay s | 32 | 8 | None | 0px |
| Config | Random Immediate | 32 | 0 | 0 | 0px |
| Config | Smart Pacing | 36 | 0 | 0 | 0px |
| Config | Evaluation Bar | 36 | 0 | 0 | 0px |
| Config | Banner Not enough room (96 px minimum) | 36 | -7.5 | 0.5 | 0px |
| Config | Recent Form | 36 | 0.5 | 0.5 | 0px |
| Config | Theme | 36 | 0 | 0 | 0px |
| Config | Clean View | 36 | 0 | 0 | 0px |
| Config | Status Idle | 15 | 0 | None | 0px |
| Config | Time Left 00:00:00 | 15 | 0 | None | 0px |
| Config | Score 0 W / 0 D / 0 L | 15 | 0 | None | 0px |
| Config | Win Rate — | 15 | 0 | None | 0px |

## Origin of apparent alternating36/44px pitch

The baseline is not alternating actual36/44pxrow-box heights: normal control-rowboxes measure36px. The prior layout-B balance adds `margin-top:var(--space-2)` (8px) through `.kb-core-spacing` on Auto Moves and `.kb-visuals-spacing` on the Banner control group and Theme footer. These rules are in `frontend/eval_bar/engine-layout.js` and are reflected in the generated userscript. They create44px vertical pitch across selected boundaries while the control box itself remains36px. The margin is attached to a row, visually resembling uneven whitespace rather than an explicit section gap.

There is also a distinct1pxborder problem. Rows with a real top border reserve1px out of36px, leaving35px for centered children;24pxtoggles then acquire half-pixel ypositions and+0.5pxcenter displacement. Banner/Recent Form show this in the console, and adjacent `.control-row + .control-row` rows show it in Config. In Config Banner the hint is inside the label group: the first-line label center is7.5pxabove the rowcenter while the switch is0.5pxbelow. These are not repaired by indiscriminately adding bottom padding.

## Frozen color inventory

Existing component colors differ across surfaces and must remain distinct. This task must not merge them into a shared accent. The stateful complete inventory is in `component-colors.csv`/JSON. Representative computed values:

| Component | Console | External Config |
|---|---|---|
| Enabled switch background/border | #46D977 | #22D36B |
| Start enabled background | #46D977 | transparent |
| Start enabled text | #0C1D12 | #F2F2EE |
| Start enabled border | #46D977 | #22D36B |
| Disabled switch background | #3A3A37 | #393A36 |
| Normal input/panel border | #3A3A36 | #3A3A36 |
| Focus token | #9BE9B6 | #22D36B |
| PopulatedScout percentage green | #46D977 | not present |
| Existing update link | not present | #9E9EFF |
| Saved Theme | #10B981 swatch value | #10B981 swatch value |

Slider styling uses its pre-existing surface color token, not the swatch. The console slider track uses the existing#46D977 token; Config uses#22D36B. Full CSS pseudo-element declarations remain separate from ordinary computed input backgrounds. The swatch native internals are not a theme/accent authority.

## Text below11px

Switch ON/OFF labels have intentional0pxtransparent text because the control renders a thumb instead. They are not visible readable content and are excluded from the exported small-textCSV. Every visible-small entry/state is retained in thatCSV. Representative entries:

| Selector | Current size | Text |
|---|---:|---|
| #kb-session-target-help | 9px /13px lineheight | Win-rate targets are not set by default… |
| #oi-zone2 .tc-scout-stat-copy b | 10px | White, Black, Bullet, etc. |
| #oi-zone2 .tc-scout-stat-value b | 10px | win-rate percentage |
| #oi-zone2 .tc-scout-section-title | 9px | Most-played openings |
| #oi-zone2 .tc-scout-opening-name | 8px | opening names |
| #oi-zone2 .tc-scout-opening-count b | 9px | count |
| #oi-zone2 .tc-scout-opening-count small | 7px | of25 / other totals |
| .engine-details pre | 10px | advanced registryJSON |

Other Scout `<small>`labels are7pxin its stylesheet and must be measured after making them visible where data supplies them. Table selectors should be matched to actual classnames in rawJSON/DOM; anonymous `b`/`small`entries there retain their visible text. Technical disclosure text needs11px even though it is normally collapsed.

## Existing contrast conflict

At panel#252523, the currentScoutmuted#777873 measures3.45:1, below the requested4.5:1. Raising font size alone does not change this ratio. Since all component colors are frozen, these two acceptance criteria conflict for that text. Report it and obtain a decision; do not silently recolor. Existing#9AB7A3warningis7.08:1;#B9BAB3muted7.85:1;#D9D9D5is10.85:1;#A0A19Bsection5.90:1;#46D977green8.37:1 against the same panel. Disabled text requires compositing its ancestor opacity before final contrast verification.

## Cross-surface primitive differences

| Primitive | Current console | Current Config |
|---|---|---|
| Toggle |40×24, switch-radio wrapper, green#46D977 |40×24 button with ::before thumb, green#22D36B |
| Analysis select |32px, appearance:none, SVGchevron, radius/controltoken |36px/nativeappearance,6pxradius, nativechevron |
| Timing inputs |32px wrappers,30px textinputs, unit24px |32px flexlabels, textinput intrinsiclinebox, suffixspan |
| Segmented |32px, compact124px adjacent to inputs |32px full Timing column below inputs |
| Slider |16px box,4pxtrack, surfacegreen, underlying base0.5pxgeometry risk |16pxbox,4pxtrack, Configgreen |
| Buttons |32px,11pxcopy, specialized existingStartstate |32pxminimum,12pxcopy in session actions |
| Status |11px, fixed compactline |11px in engine,12px footer,15px summarylinebox |
| Focus |runtimepointertrackingplus green/neutraltokenmix |global2pxgreenoutlinewithoffset, inconsistentpointerexception |
| Hint |11px/15px,8pxtopgap Timing |11px/17px,4pxtopmargin; Bannerdetailinside36pxlabel |

Sharing dimension/spacing primitives is possible without merging component color tokens. The sources currently have independent token vocabularies; global color-token sharing would violate the approved palette freeze.

## What Theme actually controls

Internal consoleID `kb-color-picker`; ConfigID/data-key `color`; browserstorage `kb_color`; GMstorage `kb_color`; runtime `current_color`. The recommendation arrow currently ignores it and uses the constant `ARROW_COLOR=#3B82F6`. Both the swatch input handler and remote-config hydration write `.myarrow path` fill from that constant. The original geometry/opacity code remains unchanged.

The same current_color still feeds square-highlights `.myhigh`: border3px, backgroundalpha0x26≈0.15, shadowalpha0x33=0.2, opacity0.85 and radius25%. `SHOW_SQUARE_HIGHLIGHTS=false` prevents their normal creation, but these style/update hooks still exist. Direct execution of the existing create_elm function in the isolated board confirmed:

| Saved color | Border | Background | Shadow |
|---|---|---|---|
| #10B981 |3px solid rgb(16,185,129)|rgba(16,185,129,0.15)|rgba(16,185,129,0.2)0px4px12px0px|
| #3B82F6 |3px solid rgb(59,130,246)|rgba(59,130,246,0.15)|rgba(59,130,246,0.2)0px4px12px0px|

No component token, Banner art or Eval Bar normalization reads current_color. Freezing the square-highlight appearance, if approved, must retain the current saved-green appearance rather than adopting blue. The raw values are in `timing-proposals-and-highlight-baseline.json`.

## Timing proposals at1086px

Existing actual textinput widths54/54px, wrappers80/80px, segmented124px with61pxlabels. Randomtext41.95px, Immediate53.55px; the currentlabels do fit but have little room.

1. Keep as-is:54/54px, Engine391px; fails64pxinputminimum.
2. Own segmented row:120/120px, Engine431px; adds40pxheight and changes column balancing. Do not apply without approval.
3. Narrow-only gap/separator proposal: range gap2px, separator3px (instead of8px/11px), same segmented124px and inputpadding. Actual input widths64/64px, Engine391px unchanged. At1280px and above the rule is absent and values remain54/54px. This is only a measured disposable DOM/CSS proposal until explicitly approved.

## Banner verification (BlockI)

At1440px/1000pxviewport, existing actual titlecomputedfont18.72px; textfragmentwidth121.328px inside144pxusefulcontent=84.25%. Text is already enlarged and meets the75–85%width direction; it is not the old~11px rendering. The screenshotviewport height is1000px for full-console audit; final1440×900 check should be repeated if exacthostcard geometry differs. Do not change art/position/responsive logic.

## Measurements and limitations

RawJSON includes fractional control rects and documentwidth. Config has half-pixel tracks at1440/1280 due its odd available innerwidth and equal fractions; console Banner/Recent Form have half-pixel switch ypositions from1pxborders. At390px all page content must be inspected after the final single-column changes. Hostfixtureboard/ad geometry is intentionally pre-existing and can exceed narrow documentwidth; actual console/control overflow is measured separately.

This audit is isolated Chromium source-level evidence, not proof of the user's installed Tampermonkey revision or active-game engine pipeline. BlockA must report real browser/integration evidence separately. No authenticated-game or competitive-action simulation is performed here.
