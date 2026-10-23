---
title: Rating Goal Tracker
type: feature
created: 2026-10-23
status: done
baseline_commit: c2b18c8
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

Implement the approved passive Rating Goal Tracker engineering plan, phases 0–5. Users can monitor naturally occurring upward or downward thresholds independently per Bullet, Blitz, Rapid and Daily. Remove the project-defined 640000-byte limit permanently; report size informationally without a replacement ceiling.

## Boundaries & Constraints

Always preserve confirmed/provisional separation, chronology, provider identity, category, durable SQLite authority, bounded serialized public GET acquisition, cancellation, optimistic revisions, idempotent history/notifications and compact English UI. Preserve artwork and every unrelated pre-existing untracked file exactly. Stage only this feature. Preserve engine, automation, Session Control persistence/contracts, Clean View and current console layout.

Ask first only for an actual architectural incompatibility, undocumented external dependency or security-critical design change. Routine approvals are already granted.

Never manipulate outcomes, submit moves, resign, queue games, require visible ratings or invent deltas. No remote push.

## I/O & Edge-Case Matrix

| Scenario | Input | Expected | Failure handling |
| --- | --- | --- | --- |
| Published baseline | Valid identity/category stats | Confirmed as-of rating | Missing category unavailable |
| Hidden rating | No visible DOM rating | API still works | No preference changes |
| Provisional candidate | Visible matching player rating | Candidate separate | Cannot complete goal |
| Publication delay | Finished rated game, old API/304 | Last confirmed retained | Retry respects cache/cooldown |
| Conflict/out-of-order | Contradictory same-time or old evidence | Deterministic conflict/no rollback | Preserve evidence |
| Natural crossing | Eligible confirmed rating | Correct threshold/progress/event | Unique logical notification |
| Duplicate/restart | Replayed game/event or server restart | Same durable history | Resume bounded jobs |
| Multi-tab edits | Stale expected revision |409, preserve draft | No silent overwrite |
| Unrated/draw/variant | Completed game metadata | Classify or defer | No inferred zero delta |

</frozen-after-approval>

## Code Map

- `core/rating_tracker/` owns schema, validation, persistence, pure domain, public client, service and routes.
- `app.py` registers isolated tracker service/routes/shutdown; `.gitignore` protects local database sidecars.
- `frontend/rating_tracker/` owns passive DOM adapter, bounded bridge and optional presenter.
- `frontend/external_config/` owns compact settings/history UI using dedicated tracker routes.
- `analysis_lab/scripts/build-rating-tracker.mjs` embeds deterministic isolated module; existing builders/tests lose arbitrary size guards.
- Approved detailed contract: `../planning-artifacts/architecture/rating-goal-tracker-2026-10-23/ENGINEERING-PLAN.md`.

## Tasks & Acceptance

- [x] Phase0: contracts, source fixtures and read-only DOM identity/category tests.
- [x] Phase1: SQLite schema/reconciliation/goals with temporal, conflict, idempotency and restart tests.
- [x] Phase2: serial conditional public client, jobs, safe local routes and shutdown; HTTP failure tests.
- [x] Phase3: passive browser bridge, outbox, source correlation and deterministic bundle.
- [x] Phase4: English external and optional compact on-page presentation with responsive/keyboard tests.
- [x] Phase5: integration/regression/browser validation, docs, isolation verification and local commit.
- [x] Remove arbitrary payload ceiling everywhere active; retain deterministic builds, syntax/performance checks and informational sizes.

Acceptance: Given two public states, when older evidence arrives last, confirmed state never rolls back. Given hidden DOM or transport failure, prior confirmed state survives and uncertainty is explicit. Given naturally confirmed threshold crossing, one durable event appears without any gameplay effect. Given account/category differences, no state mixes. Given repeated completed-game evidence, history remains unique. Given Clean View, optional page visuals disappear while external monitoring remains usable. Given supported viewports, every control is reachable without horizontal overflow. Given existing dirty artwork/banner files, final hashes remain identical.

## Spec Change Log

## Design Notes

The approved engineering plan and spine remain the detailed architecture authority. User supersedes their payload ceiling and routine checkpoints. Public publication latency and authenticated selectors are not guaranteed by fixtures; report real-browser limitations rather than imply verification.

## Verification

Run new Python contract/domain/client/route tests, JS adapter tests, Chromium integration, existing config/Session Control/Scout/Banner/Eval Bar suites, both legacy build checks plus tracker build check, Analysis Lab typecheck/tests, syntax checks and preserved-file hash comparison. Test temporary databases and fixture servers, not the user's live database or games.

Results and exact verification boundary: [validation](rating-goal-tracker/VALIDATION.md), [review disposition](rating-goal-tracker/REVIEW-RESOLUTION.md), [browser measurements](rating-goal-tracker/browser/report.json). No authenticated extension/Chess.com smoke is claimed. Unknown live selectors fail closed to public-API monitoring.

## Suggested Review Order

- Start with passive acquisition, durable state and game/goal coordination.
  [service.py:18](../../core/rating_tracker/service.py#L18)
- Review public-only transport, cache validation and cancellation.
  [public_client.py:33](../../core/rating_tracker/public_client.py#L33)
- Inspect source chronology separately from goal semantics.
  [reconcile.py:1](../../core/rating_tracker/reconcile.py#L1)
  [goals.py:1](../../core/rating_tracker/goals.py#L1)
- Check loopback ingress isolation before UI integration.
  [routes.py:13](../../core/rating_tracker/routes.py#L13)
- Follow passive browser observation into English presenters.
  [index.js:8](../../frontend/rating_tracker/index.js#L8)
  [external.js:4](../../frontend/rating_tracker/external.js#L4)
- Finish with race, offline, historical and browser regression evidence.
  [test_rating_tracker_reliability.py:20](../../tests/test_rating_tracker_reliability.py#L20)
  [test_rating_tracker_chrome.js:25](../../tests/test_rating_tracker_chrome.js#L25)
