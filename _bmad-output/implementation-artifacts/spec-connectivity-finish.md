---
title: 'Local-server reliability and final console correction'
status: in-review
baseline_commit: 37b878f
review_loop_iteration: 0
---

Restore a genuinely listening local app and correct the remaining Analysis error, row-pitch, dead-tail and Config parity defects with one commit per requested block. Preserve all pre-existing dirty work, capability secrets, engine binaries, rating history, banner, arrows and gameplay permissions. No remote push. The user authorizes running commands and tests; no manual command handoff.

Startup binds literal127.0.0.1:5050 before warmup/readiness, rejects a duplicate bind and releases owned resources on failure. Real subprocess tests must require TCP, /config200, health ready, three installed registry entries, clean occupied-port exit and immediate restart. Raw diagnosis distinguishes an alive process from an HTTP listener, includes IPv4/localhost curl, proxy/firewall observations and the reproduced UCI shutdown stall. Do not invent the original process's missing error log.

Analysis preserves capability auth, stale-generation rejection and context restrictions. Configuration remains usable without an active Chess.com heartbeat. A protected engine-list200 requires three options; missing/stale capability401 must be distinguished from transport failure. Recommendations remain the legacy Komodo/getmove path. Verify real UCI moves, legal own-turn gating, DOM arrows, bounds, visibility, layer11, pointer-eventsnone and opacity0.8 in both orientations. Do not enable Bot or Eval Bar in the user's real game. State clearly which evidence is isolated Chromium and which is actual authenticated Tampermonkey.

Reserve a40px hint/Retry row in Ready, transport Error and pending Retry; Retry32px at right, unchanged panel height. User refused the proposed initial-error placeholder copy, so add no new placeholder text. Preserve last known names. Reuse existing Initializing label for pending state. Disable transport-error selection and pending Retry; healthy polling remains operable. Existing request timeouts stay bounded.

All console control rows have40px boxes AND40px pitch, center deviation0. Remove the6px margins on individual Core/Visuals rows. Rebalance using only spacing between real Engine sections: Core171 + gap12 + Visuals211 = Engine394, with12px tails. Keep desktop Visuals/Engine and Scout/AutoPlay bottoms aligned0px. Smart Pacing hides only Timing; Engine keeps height394 and content at top. User expressly authorizes dynamic Scout tails in every data state, with no artificial spacing or content; other panels do not change because of Scout.

Narrow1086 Timing keeps a single row and Engine height394: numeric inputs64px, segmented158px, option padding12px, suffixes fit. Geometry at1280/1440/1920 must match the frozen earlier data exactly. Never put segmented on its own row. Whole controls have integer rectangles, and800px remainder pixels are assigned explicitly.

Arrow Color keeps existing IDs/storage, blue default and one-time green migration, preserves custom colors and affects arrows only. .myhigh remains fixed at prior green border/background/shadow. Keep component palettes, typography tokens, no decorative glow/shadow, and no global accent. Pointer focus has no ring; keyboard uses neutral1px border while retaining stateful toggle and invalid-input borders. Scout remains11px minimum with ellipsis/title/count alignment and10px chips. AutoPlay actions keep four desktop field columns, readable disabled controls and2x2 status, without changing automation or the warning.

External Config uses the same40px rows/32px controls/5px control radii and a single-row Timing layout that remains usable at390px. Preserve all fields, statuses, save acknowledgements, revisions, Clean View and authorized copy. Exclude Opponent Scout. Test genuine browser offline/reconnect, actual runtime Active/Ready with owned Smallnet proof, actual userscript heartbeat expiry and retained runtime PID. Do not fabricate session projections or manipulate gameplay.

Warning is measured only: #9AB7A3,11px/16px, targets53/61. Propose existing neutral #AAABA5 without applying, rewriting or hiding. Banner is verification only at1440×900; current18.72px and84.26% useful width already meet target.

Final evidence includes68-state before/after tables, exact row pitch, panel tails and section positions; screenshots for all requested representative widths, Ready/Error/Initializing, arrows both ways, component-color diff, and builds. Source changes live in core/local_server.py, app.py main only, engine-selection/layout modules and Config source CSS/JS/HTML. Regenerate script deterministically, stage only owned changes, commit locally by block and keep runtime alive independently of test sessions.
