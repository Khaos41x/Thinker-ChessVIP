---
title: Engine section rhythm and console inset
type: bugfix
created: 2026-10-25
status: in-progress
baseline_commit: f6705ba
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="User supplied the exact authorized scope">

## Intent

Measure before editing, then make the smallest safe correction to Engine Control section rhythm, segmented fit and desktop console inset. Each requested item has its own commit, including observational items. Configuration semantics, names and persisted values remain intact.

## Boundaries & Constraints

Always preserve three-column desktop grid, stacked mode below1034px container, gaps12px, Visuals/Engine and Scout/AutoPlay bottom equality, integer control rectangles, existing colors, banner and arrow geometry, IDs and storage. Four engine sections retain order Analysis, Strength, Timing, Toggles. Smart Pacing hides only Timing. Separators are exactly1px and equal breathing space on both sides. Total adjustment must fit between sections with at most8px per junction; never modify row dimensions to compensate. Selected timing background uses only existing colors. Options have equal integer widths and at least12px horizontal padding. No new Timing row. Keep authorized narrow1086 compaction.

Ask first if equal section rhythm cannot preserve panel balance within the allowed spacing budget, or if matching the screenshot's content boundary would require relocating the console above gameplay. Do not change the Immediate header or the AutoPlay warning; report current code, history and measured style. Do not infer authenticated Chrome/Tampermonkey results from local fixtures.

Never change copy, automation behavior, analysis authorization, component colors outside selecting an already existing segmented state token, or unrelated dirty files. No remote operations.

## I/O & Edge-Case Matrix

| State | Expected |
|---|---|
| Random / Immediate | Same height and section rhythm; header behavior unchanged |
| Smart Pacing on | Timing hidden; surviving junctions remain valid; left column stable |
| Desktop1086–1920 | Equal bottom edges, no overflow or fractional controls |
| Stacked1033/800 | Existing placement unchanged; integer controls |

</frozen-after-approval>

## Code Map

- `frontend/eval_bar/engine-layout.js`: grouped engine sections and generated styling.
- `script.js`: legacy workspace placement and mode presentation; generated blocks rebuilt from sources.
- `tests/browser/test_engine_rhythm.mjs`: isolated Chromium plus real Flask source/registry, measurements and screenshots.
- `tests/fixtures/userscript_bootstrap.html`: existing synthetic Chess.com shell, not an authenticated page.

## Tasks & Acceptance

- [ ] Measure16 required desktop states plus stacked sentinels before editing.
- [ ] Correct section separators only if the natural height budget fits.
- [ ] Fit equal segmented options on the same line with12px padding and unchanged colors.
- [ ] Document intentional Immediate header and unchanged warning.
- [ ] Remove desktop-only console clearance while preserving gameplay clearance and stacked geometry.
- [ ] Verify before/after tables, screenshots and protected geometry; commit each item separately.

Given each mode/pacing state, after layout then boundaries and controls are integer and panel edges match. Given a layout that cannot meet the constraints, report measured options without applying an unauthorized compromise. Given desktop placement, the console begins12px after the existing safe viewport/gameplay boundary; stacked positioning and banner remain unchanged.

## Verification

Run the browser measurement matrix before and after, with visible control equality and gap assertions. Run analysis/userscript deterministic build checks. Compare source changes against the captured dirty baseline and stage only owned hunks. Use read-only independent review of the final diff. Record the limits of native browser access.
