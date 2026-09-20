---
title: 'Fix layout shell visibility regression'
type: 'bugfix'
created: '2026-09-20'
status: 'done'
route: 'one-shot'
---

# Fix layout shell visibility regression

## Intent

**Problem:** The configuration workspace appeared absent at the top of the page because it was intentionally below the fold, while the banner was genuinely hidden behind Chess.com's advertisement stacking context after changing from fixed to absolute positioning.

**Approach:** Restore the banner as a high-priority fixed layer without any scroll listener, prevent periodic reconciliation from moving it, and retain the approved below-fold workspace mounting independently from opponent detection.

## Suggested Review Order

**Visibility lifecycle**

- Reconciliation remounts detached shells without continuously repositioning stable UI.
  [`script.js:2599`](../../script.js#L2599)

- Fixed high-priority banner remains visible above Chess.com advertising containers.
  [`script.js:2926`](../../script.js#L2926)

- Sidebar replacement triggers one recalculation while ordinary scrolling triggers none.
  [`script.js:3023`](../../script.js#L3023)

**Regression coverage**

- Tests enforce fixed stacking, zero scroll listeners, and no periodic position call.
  [`test_scout_logic.js:30`](../../tests/test_scout_logic.js#L30)
