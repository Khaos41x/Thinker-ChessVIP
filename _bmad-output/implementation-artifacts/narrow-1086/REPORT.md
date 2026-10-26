# Approved1086px redistribution

Implemented only at CSS viewport1086px with desktop injection container1034px. Source change is one exact-width media block in frontend/eval_bar/engine-layout.js. Source release2026-10-26.2; generated script rebuilt deterministically. No copy, IDs, storage, engine behavior, banner or arrow geometry changed.

## Column widths

|Viewport|Before Core / Engine / Scout|After Core / Engine / Scout|
|---:|---|---|
|1085|345px 345px 296px|345px 345px 296px|
|1086|345px 345px 296px|345px 359px 282px|
|1087|345px 345px 296px|345px 345px 296px|
|1280|345px 345px 296px|345px 345px 296px|
|1440|345px 345px 296px|345px 345px 296px|
|1920|345px 345px 296px|345px 345px 296px|
|1033|1009px|1009px|
|800|776px|776px|

The rule is @media(width:1086px), additionally scoped to #oi-wrapper[data-layout-mode="desktop"].1085px and1087px were tested as exclusion sentinels.1280/1440/1920 and stacked1033/800 match every measured control/panel rectangle before/after exactly, not merely the column totals.

## Timing and Auto Play at1086

|Measurement|Before|After|
|---|---:|---:|
|Engine content width|319px|333px|
|Numeric delay inputs|64/64px|64/65px|
|Separator column|3px|8px|
|Grid gap each side|2px|6px|
|Actual dash-glyph clearance left/right|2/−1.5px|6.75/6.75px|
|Segmented total / option widths|158 /78/78px|158 /78/78px|
|Auto Play panel width|702px|716px|
|Four input widths|163/163/163/163px|167/167/166/166px|
|Start / Finish / Export widths|334/163/163px|342/166/166px|

The two remainder pixels are distributed one each to the first two Auto Play columns, using round(up) for those columns and round(down) for the last two. Fields and actions share the exact same column declaration. Start spans field columns1–2; Finish and Export align with fields3 and4. Export right equals Rating Goal right. Every measured input, select, toggle and button rectangle is integer.

## Scout states and heights

|Scout content|Opening rows / cadence rows|Engine before → after|Scout width before → after|Visuals/Engine bottom delta|Scout/Auto Play bottom delta|
|---|---|---|---:|---:|
|empty|0 /0|394 → 394px|296 →282px|0px|0px|
|four|4 /1|394 → 394px|296 →282px|0px|0px|
|full|4 /4|409 → 409px|296 →282px|0px|0px|

Full means the actual renderer maximum: two favorite openings per color (four total), plus all four supported cadence groups. Fixture data consists of50 public-game-shaped records rendered through the existing Scout pipeline; no extra DOM rows were inserted. Long opening variations exercise actual ellipsis and full title attributes.

All Scout visible text is at least11px. Opening names remain one line with ellipsis, overflow hidden and title equal to the full name. Other text has no detected clipping. Count columns remain56px, with identical right edges; win-rate columns remain aligned. Empty content stays anchored at the top, as previously authorized.

The full Scout already made the desktop Engine409px before this patch; empty/four-opening states use394px. Both heights are preserved, including Smart Pacing on/off. The pre-existing full-content state also leaves a27px tail in Visuals/Engine; this patch does not change that behavior. Auto Play remains252px in every desktop Scout state. All panel gaps remain12px.

## Verification

-96 before and96 after states:8 widths ×3 Scout contents ×2 Smart Pacing states ×2 timing modes. Zero page exceptions and zero changes in17056 matched color-component samples.
-The regression asserts exact unchanged geometry outside1086px, equal desktop bottom edges, unchanged panel heights, integer control rectangles, Auto Play field/action alignment, readable Scout text/title/ellipsis, aligned counts, numeric inputs64/65px and dash clearance6.75px on both sides.
-Both deterministic builds --check and2 delivery tests passed. No backend restart, package download or engine initialization was needed for this CSS-only change.
-DOM/screenshots were tested in isolated Chromium with real current userscript modules and Flask registry/configuration. Authenticated Chess.com with Tampermonkey was not tested or claimed. No gameplay action was executed.

[Full width/state table](widths.csv) · [Validation summary](validation.json) · [Before data](before/measurements.json) · [After data](after/measurements.json).

## Screenshots1086

|State|Before console|After console|Before Scout|After Scout|
|---|---|---|---|
|Empty|[before](before/console-empty-pacing0.png)|[after](after/console-empty-pacing0.png)|—|—|
|Four openings|[before](before/console-four-pacing0.png)|[after](after/console-four-pacing0.png)|[before](before/scout-four-pacing0.png)|[after](after/scout-four-pacing0.png)|
|Full|[before](before/console-full-pacing0.png)|[after](after/console-full-pacing0.png)|[before](before/scout-full-pacing0.png)|[after](after/scout-full-pacing0.png)|

Smart Pacing-on screenshots are also included with pacing1 suffixes. Source diff is in source.diff. This follow-up is one local commit; no push.
