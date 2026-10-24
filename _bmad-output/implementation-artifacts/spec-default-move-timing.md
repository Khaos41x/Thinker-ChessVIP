---
title: Consistent default move timing
type: bugfix
created: 2026-10-23
status: done
route: one-shot
---

# Consistent default move timing

## Intent

**Problem:** Userscript initial reset, fallback and external configuration still defaulted maximum Move Timing to 2.00 seconds. Eval Bar was already off by default.

**Approach:** Use Random with minimum 0.50 and maximum 1.00 seconds consistently. Retain Eval Bar false and preserve deliberate saved preferences instead of resetting them on reload. Add explicit backend and executable userscript preference assertions. Reconfirm Rating Goal's previously recorded Chromium/Flask evidence without promising authenticated-site behavior.

Validation: seven configuration tests, executable userscript preference regression, 34 Rating Goal backend tests and session guard tests pass. All three deterministic build checks and JavaScript syntax validation pass. Read-only review found no introduced defects; the pre-existing first-version migration semantics are unchanged. No push.

## Suggested Review Order

- Initial/reset/runtime defaults and existing saved-preference behavior.
  [script.js](../../script.js#L787)
- Matching server defaults.
  [external_config.py](../../core/external_config.py#L12)
- Regression assertions.
  [test_visual_preferences.js](../../tests/test_visual_preferences.js#L1)
  [test_external_config.py](../../tests/test_external_config.py#L30)
