# Config controls and empty Auto Play preferences

## Delivery

Four local commits, one per item. No push. Runtime source release2026-10-26.1. Actual server is running as Python8500 and /config returns200. Only the idle app process was restarted; its terminal was not closed.

Implemented shared Config toggle travel/inset, centered Config delay separator, one-time empty preference migration and8px availability-hint margins. Console1086 separator is deliberately unchanged because the requested gap would violate the64px input minimum. Preview options and the pending choice are below.

## Toggle measurements

| Property | Config before | Config after | Console (preserved) |
|---|---:|---:|---:|
|Track|40×24px|40×24px|40×24px|
|Thumb outer diameter|18px|18px|18px|
|Vertical gap top/bottom|3/3px|3/3px|3/3px|
|Off left/right clearance|3/19px|2/20px|2/20px|
|On left/right clearance|19/3px|20/2px|20/2px|
|Row height|40px|40px|40px|
|Toggle center − row center|0px|0px|0px|
|Toggle right − content right|0px|0px|0px|
|Auto Rating/Smart Pacing right − visible Timing header right|0px|0px|0px|

All9 Config toggles use the same button.switch markup from panel.js, including Auto Rating and Smart Pacing. There is no engine-only toggle class. The shared padding2px/travel16px caused the difference; it entered in69a1a53. Console travel18px was fixed inb5bdc87. Dimensions are even integers; the resulting3px vertical clearance is exactly the approved24/18 console geometry, so it was not changed to chase an even gap.

Existing surface color differences were measured and preserved:

| Paint | Config | Console |
|---|---|---|
|Off background|#393A36|#3A3A37|
|On background|#22D36B|#46D977|
|Off border|1px #3A3A36|1px #44443F|
|Thumb background|#F2F2EE|#F1F1EE|
|Thumb border|0px|1px #D5D6D2|
|Track radius / thumb radius|12px /50%|12px /50%|

Normal transition declarations now match.14s ease rather than Config.12s. The measured reduced-motion styles still differ in the existing media rules: Config track none/thumb transform.14s; console track.14s/thumb none. No palette changes were made to force visual identity across these pre-existing differences. All toggles share the corrected component geometry.

Tables for every state: [toggles.csv](after/toggles.csv).300% [before off](before/toggle-off-300.png), [before on](before/toggle-on-300.png), [after off](after/toggle-off-300.png), [after on](after/toggle-on-300.png).

## Delay measurements

Widths below distinguish numeric input from its bordered field. Suffix glyph width is4.75px; suffix container width is derived from the measured field/input widths and the existing1px borders. The separator is the existing en dash glyph,6.5px wide at13px, with unchanged secondary text color.

|Surface|Viewport|Numeric inputs before → after|Suffix container|Glyph gap left/right before → after|S glyph → dash before → after|
|---|---:|---|---:|---|---:|
|config|1440|106/107 → 100/100px|9px|2/-1.5 → 6.75/6.75px|5 → 9.75px|
|config|1280|106/107 → 100/100px|9px|2/-1.5 → 6.75/6.75px|5 → 9.75px|
|config|1024|106/107 → 100/100px|9px|2/-1.5 → 6.75/6.75px|5 → 9.75px|
|config|768|244/244 → 237/238px|9px|2/-1.5 → 6.75/6.75px|5 → 9.75px|
|config|390|67/67 → 60/61px|9px|2/-1.5 → 6.75/6.75px|5 → 9.75px|
|console|1086|64/64 → 64/64px|9px|2/-1.5 → 2/-1.5px|5 → 5px|
|console|1280|54/54 → 54/54px|24px|10.25/10.25 → 10.25/10.25px|21.25 → 21.25px|
|console|1440|54/54 → 54/54px|24px|10.25/10.25 → 10.25/10.25px|21.25 → 21.25px|
|console|1920|54/54 → 54/54px|24px|10.25/10.25 → 10.25/10.25px|21.25 → 21.25px|

Config now has an8px fixed grid column and6px gap on each side, giving actual glyph clearance6.75/6.75px. Its32px control row and Engine panel heights remain unchanged. Wider console already meets10.25/10.25px and was preserved. Full positions and every requested viewport are in [delay.csv](after/delay.csv).

### Pending1086 choice

Current numeric inputs64/64px cannot absorb the additional13px separator budget. Applying the same gap inside the existing319px content would shrink them to57/58px. That is not applied.

-[Current1086](delay-options/current.png):64/64px inputs, existing insufficient separator clearance.
-[6px-gap preview](delay-options/spacing6-inputs-too-small.png):same height, but inputs57/58px; rejected.
-[Engine+14 / Scout−14 preview](delay-options/preview-engine-plus14-scout-minus14.png):inputs64/65px, same394px Engine height, segmented stays on the same line. This changes column widths and remains an unapplied preview awaiting the user choice.

## Empty fields and migration

[Full migration contract and exact cleared keys](ITEM3.md). Duration120 came from backend DEFAULT_CONFIG and legacy console value120. The current code already had null win-rate defaults, but the actual preference file held53/61. Both surfaces now start empty with the existing Not set placeholder; Rating Goal retains its existing tracker and saved semantics.

Actual external-config-preference.json migration cleared only sessionDurationMinutes120, sessionMinimumPercent53, sessionMaximumPercent61, writing sessionFieldsVersion1 atomically. Every other config value compared equal. Browser migration uses thinker.sessionFields.v1 in localStorage/sessionStorage and clears only the three named compatibility entries; actual existing source used in-memory drafts plus server persistence, not a second browser authority. No session history, IndexedDB snapshots, Rating Goal or unrelated storage was cleared.

The real-browser migration regression seeded both browser stores, verified cleanup and unrelated-key preservation, saved90 through Config and95 through console, then reloaded both pages and restarted Flask.95 persisted and the migration did not repeat. Page exceptions:[]; evidence [migration/report.json](migration/report.json). The active native Tampermonkey profile was not modified through a profile-file workaround.

Blank duration stays null in an unfinished draft; Start is disabled immediately and executable validation/backend command admission reject it. No NaN or silent0. Both win-rate targets absent are represented by null targets/zero offsets and no goal-based mode switching. A partially filled pair still uses the existing block. Configured targets preserve strict0<minimum<maximum<100 validation and existing authorization/calibration/rollout gates.

The warning remains visible and unchanged. Its targets-not-set default statement is now coherent. Its Configure both before starting sentence remains literally present despite optional goals, per the no-copy-change instruction.

## Availability hint

|Config viewport|Bot off panel before → after|Gap above/below before → after|
|---|---:|---|
|1440|256 → 268px (+12)|4/0 →8/8px|
|1280|256 → 268px (+12)|4/0 →8/8px|
|1024|256 → 268px (+12)|4/0 →8/8px|
|768|256 → 268px (+12)|4/0 →8/8px|
|390|373 → 385px (+12)|4/0 →8/8px|

At390 with Bot on, total373→402px includes12px requested margin plus17px wrapping of the existing validation text for empty duration. Font11px, line-height17px, color #B9BAB3 and exact copy remain unchanged. See [panel/hint CSV](after/panels-and-hint.csv).

## Regression evidence

-72 before and72 after measurements at all requested viewports across Bot/Auto Rating/Smart Pacing states. The frozen baseline was replayed with the actual Rating Goal module mounted for complete four-field screenshots.
-All9 Config toggles off/on at all5 Config viewports:10 additional states, without opening a gameplay consumer.
-Zero row-center/right-edge deviations; integer control rectangles; desktop Visuals/Engine and Scout/Auto Play bottom differences0px. Console panel heights and12px gaps preserved. No new horizontal overflow or visible text below11px.
-9,600 matching component-color pairs:0 changes. Toggle pseudo-element paint also compared unchanged. [Color diff](after/color-diff.json).
-2 Python migration tests,7 Config tests,4 defaults tests,2 delivery tests,14 session-control suites, Phase09.1 real-Flask revision/lost-ack test, defaults UI/persistence test, recommendation geometry test and both deterministic build checks passed.
-Actual server5050 Config was separately tested read-only in1440/390:four blank fields, Not set placeholders, Start disabled, settings unchanged. [Report](live-real-server/report.json).
-Unrelated raw userscript source, banner and arrow code preserved: [proof](after/preservation.json). No packages downloaded or engines reinstalled.

## Screenshots and scope limits

[Console1440](after/console-1440.png) · [Console1086](after/console-1086.png) · [Config1440](after/config-1440.png) · [Config390](after/config-390.png) · [Before](before/).

[Actual5050 Config1440](live-real-server/config-1440.png) · [Actual5050 Config390](live-real-server/config-390.png).

All DOM/browser screenshots are isolated Chromium. Config was also exercised against the real running server. Authenticated Chess.com with Tampermonkey was not verified; no real game was played, no gameplay action executed and no installed userscript version was claimed. Previous native helper access ended because it could not determine the current browser URL safely.

## Commits and diffs

|Item|Commit|Scope|
|---|---|---|
|1|39fc16a|Shared Config toggle geometry|
|2|522918a|Config separator; console1086 constraint documented|
|3|aca7e69|Empty defaults/migration and safe optional goals|
|4|Commit containing this report|Targeted hint margin plus final evidence|

[Source diffs per item](diffs/). No remote push. Existing unrelated dirty work remains outside these commits.
