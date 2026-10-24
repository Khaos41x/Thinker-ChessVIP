---
title: Rating Goal single-field correction
type: bugfix
created: 2026-10-23
status: done
baseline_commit: 08a2f27
---

## Intent

Replace the excessive Rating Goals dashboard with one Rating Goal text field in both existing Engine Control panels. Save the same value on the local server and synchronize both surfaces. Do not change gameplay, engine strength, console layout or unrelated artwork.

## Code Map

- `frontend/rating_tracker/target-field.js`: shared field presenter and synchronization.
- `frontend/rating_tracker/index.js`: attach field to Chess.com console; retain passive observations.
- `frontend/rating_tracker/external.js`: mount identical field in External Config.
- `core/rating_tracker/service.py`, `routes.py`: durable target preference.
- `frontend/external_config/index.html`: remove dashboard.

## Tasks & Acceptance

- [x] Replace extra UI with a single labeled text input in both panels.
- [x] Persist and synchronize valid integers; support clearing, Enter and blur; preserve invalid/unsaved drafts on connection failures.
- [x] Test both real Chromium surfaces, refresh, cross-tab updates and no extra dashboard.
- [x] Regenerate deterministic bundles and run backend regression tests.

Given either panel, entering a rating updates the other panel without resetting engine strength or starting games. Given an unavailable backend, the draft remains and an accessible save error is available. Existing rating history remains intact.

## Verification

Python tracker regression suite, dedicated field tests, Chromium cross-surface test and deterministic build check. Authenticated Chess.com/Tampermonkey remains a manual check when unavailable.

The field is intentionally a saved desired-rating preference, not an implicit account/category subscription. Existing monitoring data remains untouched. Review fixed unintended partial-draft commits, focused clean-value synchronization, External Config CSP styling and BFCache lifecycle.

Validation: 53 tracker tests, 17 reliability tests, 7 app tests, 8 JavaScript contracts, single-field concurrency regression and both Chromium suites passed. All three deterministic build checks passed. Browser tests use real Flask and the actual built userscript with a privileged-request shim, not an authenticated Tampermonkey session.

## Suggested Review Order

- Shared input and explicit save boundaries.
  [target-field.js](../../frontend/rating_tracker/target-field.js#L3)
- Attach the same field to the existing console.
  [index.js](../../frontend/rating_tracker/index.js#L23)
- Durable preference without engine or monitoring side effects.
  [service.py](../../core/rating_tracker/service.py#L63)
- Bidirectional browser and draft-concurrency regression.
  [test_rating_tracker_chrome.js](../../tests/test_rating_tracker_chrome.js#L40)
  [test_rating_target_field.js](../../tests/test_rating_target_field.js#L1)
