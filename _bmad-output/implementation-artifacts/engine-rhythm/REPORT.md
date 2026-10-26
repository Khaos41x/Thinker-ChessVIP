# Engine Control — rhythm and inset

## Outcome

Implemented symmetric2px /1px divider /2px junctions and removed112px excess desktop clearance. Panel heights, rows, bottom alignments, colors and banner/arrow code are preserved. Wider segmented expansion is intentionally not applied: the required158px width conflicts with retaining the wider desktop input geometry; options requiring approval are below. No UI copy was changed.

## Positions before/after

All positions below are document y at1440×900 with scroll0. The same vertical values were measured at1086/1280/1920; Random and Immediate have the same geometry. Full24-state data and every divider position are in [before CSV](before/sections.csv) and [after CSV](after/sections.csv).

| Smart Pacing | Section | Before start–end | After start–end | Before divider | After divider |
|---|---|---:|---:|---:|---:|
| Off | analysis | 1062–1166 | 950–1054 | — | — |
| Off | strength | 1166–1234 | 1056–1122 | 1166 | 1056 |
| Off | timing | 1234–1320 | 1124–1208 | 1234 | 1124 |
| Off | toggles | 1320–1405 | 1210–1293 | 1320 | 1210 |
| On | analysis | 1062–1166 | 950–1054 | — | — |
| On | strength | 1166–1234 | 1056–1122 | 1166 | 1056 |
| On | timing | hidden | hidden | — | — |
| On | toggles | 1234–1319 | 1124–1207 | 1234 | 1124 |

| Each visible junction | Before | After |
|---|---:|---:|
| End of previous content → divider |0px|2px|
| Divider thickness |1px|1px|
| Divider end → next content |4px|2px|
| Total content gap |5px|5px|

A divider already existed between Strength and Timing in this source revision. The before test found it in computed CSS; the final test additionally verified painted #32322F pixels and exactly1px thickness in18 screenshots. This is not a claim about an unknown installed Tampermonkey version.

## Protected geometry

| Panel | Height off/on | Tail off/on |
|---|---:|---:|
|Core|171/171px|12/12px|
|Visuals|211/211px|12/12px|
|Engine|394/394px|12/98px (accepted Smart Pacing exception)|
|Auto Play|252/252px|12/12px|

Desktop Visuals/Engine and Scout/Auto Play bottom difference remains0px. Panel gaps remain12px. No control rectangles are fractional. No new horizontal overflow was introduced in the console; the synthetic page has a pre-existing fixed1433px body, while console wrapper bounds remain inside every requested viewport. The final screenshots are clipped to the wrapper so both inset and complete console are visible.

## Segmented constraint

[Measurements and alternatives](ITEM3.md):1086 already has78px equal options and12px horizontal padding. At1280/1440/1920, options are61px; Immediate measures53.55px and needs78px per option for12px padding. Total segmented would need158px instead of124px. Without authorized wider compaction, numeric inputs fall54→37px and their decimal content clips. Height stays unchanged, but this is not a usable solution, so it was not applied.

Decision needed: authorize extending the existing1086 compaction to wider desktop viewports (recommended), or authorize reallocation of34px from another grid column to Engine. No option is moved to another row. Existing selected/unselected backgrounds #3A3A36/#252523 are distinct; active-state colors are unchanged.

## Inset and intentional presentation

[Offset source/history and measured correction](ITEM5.md): desktop first panel1024→912px at900px safe boundary, reducing124px to12px. Stacked1033/800 wrapper placement is byte-for-byte equal in measured geometry. This preserves the console below gameplay; it does not move it above or onto the board. Banner positioning code is identical.

[Timing header](ITEM4.md): Immediate is intentional since1cf0af3,2026-10-21; left unchanged. [Warning style proposal](ITEM6.md): #9AB7A3,11px; propose only existing neutral #AAABA5. Saved53/61 confirmed read-only; warning copy/visibility preserved.

## Validation and limits

-24 before and24 after Chromium states: requested desktop widths plus stacked1033/800, both modes and Smart Pacing states.
-Automated assertions: equal breathing room, painted1px dividers, unchanged heights/tails, exact bottom edges, integer controls, unchanged segmented and warning colors,12px desktop inset and unchanged stacked placement.
-Recommendation geometry test passed. Delivery2 tests and both deterministic build checks passed. Source version2026-10-25.3.
-The existing broad banner unit harness fails with readThinkerMoveAuthority is not defined in both the captured pre-change source and the final staged source. This is a pre-existing extraction-harness dependency failure; it was not fixed outside scope or reported as passed. The complete banner lifecycle block is verified byte-for-byte unchanged in after/preservation.json.
-Two independent reviews completed. Edge review found no introduced issue. Blind review flagged that separator redistribution also applies in stacked mode; triaged against the request: item5 protects stacked positioning, which is verified unchanged; item2 applies uniform section rhythm. No extra behavior change was made.
-All DOM measurements and screenshots are Chromium local with the real current source and Flask fixture/registry, not authenticated Chess.com. No real game was played, no automation enabled, and no Tampermonkey installation/version verification is claimed. The previous native automation attempt ended because its helper could not determine the current browser URL safely.

## Screenshots

[1440 Random](after/console-1440-rand-pacing0.png) · [1440 Immediate](after/console-1440-max-pacing0.png) · [1440 Smart Pacing on](after/console-1440-rand-pacing1.png).

[1086 Random](after/console-1086-rand-pacing0.png) · [1086 Immediate](after/console-1086-max-pacing0.png) · [800 stacked](after/console-800-rand-pacing0.png).

[Before screenshots and measurements](before/) · [Full final measurements](after/measurements.json) · [Painted dividers](after/painted-dividers.json).

## One local commit per item

|Item|Commit|Scope|
|---|---|---|
|1|f02e6d7|Before measurements/tests|
|2|60df790|One CSS declaration plus deterministic generated block|
|3|44138d4|Constraint report only|
|4|16db836|Intent/history report only|
|5|f56328b|Desktop placement and release metadata|
|6|Commit containing this report|Warning observation/proposal and final delivery evidence|

Diffs for each item are in diffs/. No remote push. All unrelated dirty changes remain outside these commits.
