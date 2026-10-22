---
title: 'Enlarge and Lower the Compact Console'
type: 'bugfix'
created: '2026-10-21'
status: 'done'
route: 'one-shot'
---

# Enlarge and Lower the Compact Console

## Intent

**Problem:** The Thinker Chess console remained visually undersized and too close to the Chess.com board because runtime positioning overrode the CSS spacing with a hardcoded 32px gap.

**Approach:** Increase the console, controls, typography, and Scout dimensions, then centralize and enforce a 112px gameplay gap in both initial CSS and live layout recalculation.

## Suggested Review Order

**Runtime geometry**

- Centralized clearance prevents CSS and live positioning from drifting again.
  [`script.js:5411`](../../script.js#L5411)

- Live positioning preserves the full board gap during resize and asynchronous layout changes.
  [`script.js:6348`](../../script.js#L6348)

**Visual scale**

- Larger console, controls, typography, and responsive breakpoint provide a clearly visible size increase.
  [`script.js:5946`](../../script.js#L5946)

- Responsive stacking retains safe horizontal headroom below desktop widths.
  [`script.js:6058`](../../script.js#L6058)

**Regression coverage**

- Chromium now measures the actual gameplay-to-workspace gap.
  [`test_userscript_chrome.js:471`](../../tests/test_userscript_chrome.js#L471)

- Static UI checks lock the shared gap constant and runtime calculation.
  [`ui.test.js:371`](../../tests/session_control/ui.test.js#L371)
