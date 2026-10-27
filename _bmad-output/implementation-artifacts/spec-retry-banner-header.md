---
title: Retry rhythm, Banner hint removal and current-version header cleanup
type: bugfix
created: 2026-10-27
status: in-progress
baseline_commit: cbee05a
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="explicit user authorization">
## Intent
Three small presentation corrections, each with an independent local commit. Retry and engine choice initiated by the user retain Initializing for at least700ms and fade to the final state in180ms. Background verification retains the previous silent behavior. Remove the redundant Banner subtitle in Config and remove the up-to-date userscript header row, keeping existing update guidance in all other states.

## Boundaries & Constraints
Preserve all existing copy except expressly authorized removals. No new visible labels. No changes to storage, preference acknowledgement, revision handling, operational polling, authorization, analysis, arrows, banner artwork or colors. Console rectangles must be unchanged across1086/1280/1440/1920/1033/800. Config rows remain40px and centered across1440/1280/1024/768/390. Header panels remain at their original y when the current-version row disappears: transfer removed height to top inset, not an empty row. Report alignment constraints and update-state header shifts without making unrelated layout changes. Retry repeats are ignored; reduced motion retains minimum duration without animation. Result region announces final existing state only. Keep installation href and all non-current version copy. No remote push.

## I/O & Edge-Case Matrix
|Input|Expected behavior|
|User Retry, immediate refusal|Initializing>=700ms, static final error after180ms fade|
|User Retry, fast success|Initializing>=700ms then Ready; focus returns to picker|
|Slow result|Initializing persists until result; no extra700ms after response|
|Multiple Retry clicks|One request, no queued retry|
|Background refresh|No minimum wait/fade/intermediate state, no equal DOM writes|
|Reduced motion|700ms minimum; no animations|
|Banner all states|No subtitle node; role switch/name/state preserved|
|Connected current userscript|No visible build row/link or leftover gap|
|Outdated/absent/unknown|Existing guidance and link remain left-aligned|
</frozen-after-approval>

## Code Map
- frontend/external_config/status-runtime.js: common idempotent updates and connection health; add explicit-action presentation helper.
- frontend/eval_bar/engine-selection.js: console Retry and preference lifecycle.
- frontend/external_config/panel.js: Config Retry, preferences, Banner hint and version state.
- frontend/external_config/index.html: header row delimiter and live status structure.
- frontend/external_config/panel.css: existing header geometry and control tokens.
- tests/browser/test_retry_header.mjs: real Flask/isolated Chromium geometry, timing and screenshots.

## Tasks & Acceptance
- [ ] Shared explicit-action minimum, final fade, reduced-motion, focus and single announcement.
- [ ] Keep background health/backoff and zero mutation contract.
- [ ] Remove Banner hint creation/update and dangling description; preserve switch.
- [ ] Hide only current userscript row; left-align remaining link; preserve panel top in current state.
- [ ] Compare console rectangles/colors and Config rows across requested widths.
- [ ] Capture before/after screenshots and Retry frame strip; report infeasible alignment constraints.
- [ ] Three commits, one per item; deterministic generated userscript.

Given stable background polling, indicators never change for identical responses. Given a user action, Initializing stays visible>=700ms and only final status announces. Given Banner on/off, Config control row40px and center delta0; console geometry unaffected. Given current version row removal, first panel y equals baseline and final header gap12px.

## Verification
Use real Flask fixture with actual frontend/userscript and Chromium CDP, plus existing60s status regression. Network faults are injected, never competitive gameplay. No authenticated Tampermonkey claim without direct verification. Browser-generated fetch refusal logs are distinguished from JS production messages. All new screenshots/results live under retry-header, preserving unrelated artifacts.
