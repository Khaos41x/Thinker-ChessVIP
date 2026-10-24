---
title: Prevent unauthorized opponent moves
type: bugfix
created: 2026-10-24
status: done
route: one-shot
---

# Prevent unauthorized opponent moves

## Intent

**Problem:** request_move guessed unknown player identity from the side to move. Numeric player colors were unsupported. Final game.move checks established FEN/legal-move validity but not player ownership, allowing a reproduced opponent-move dispatch.

**Approach:** Fail closed on unknown identity, normalize supported API representations, reconcile turn with FEN, and revalidate identity/game/route/mode/FEN at all asynchronous and final move boundaries. Preserve timing and puzzles. Clear canceled-position latches for automatic recovery and expose safe diagnostics.

## Suggested Review Order

- [Correction details and validation](move-authority-fix/REPORT.md).
- [Authority reader and final effect boundary](../../script.js#L4474).
- [64 isolated regressions](../../tests/test_move_authority.js).
- [Actual-userscript Chromium test](../../tests/test_move_authority_chrome.js).
