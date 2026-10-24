---
title: Auto Play confirmed-rating stop condition
type: feature
created: 2026-10-23
status: done
baseline_commit: 55cd9a3
---

## Intent

Complete the pending Rating Goal behavior without adding another dashboard or altering engine strength. The saved field is an optional stop condition for an explicitly started Auto Play session. Pin its value, own username and the admitted queue category per session. Obtain confirmed public ratings through the existing tracker. Stop using the existing graceful-stop flow when the threshold is genuinely confirmed; never change move selection, seek losses, resign, or initiate matchmaking from the tracker.

## Boundaries

Keep the tracker itself observational. A separate session guard consumes its data and can block new queue admission or request graceful stop. Existing engine, normalization, animation, banner, locks, reducer, DTOs, IndexedDB and passive goals stay intact. Scope the session goal to the session account hash and pool. Never use opponent ratings, infer a category from clocks, or accept hidden/provisional/stale/conflicting values as completion. All visible text is concise English. Preserve unrelated modified artwork and untracked evidence; commit only task files, no push.

## Data and behavior

The backend persists an independent session binding in tracker metadata, avoiding collisions with existing per-category goals. POST `/rating-goals/session` accepts sessionId (128-bit hex), sessionAccountKey (existing SHA256 account identity), username, timeClass, active boolean and optional completedGameUrl hint. A disabled (null target) binding needs no public lookup. Enabled binding verifies public profile identity before registering the account for the existing observation worker. Response includes schemaVersion, sessionId, sessionAccountKey, username, timeClass, target, state, eligible and reached. The target is pinned for that session; edits configure the next session.

Only an eligible, freshly reconciled public observation establishes the baseline and direction: target at/above baseline means upward, below means downward observation. Reuse pure goal evaluation. A lower threshold never instructs play. Pending completed-game publication blocks queueing and completion. Duplicate hints deduplicate through the existing completed-games mechanism. Errors retain history and block new automated queueing while a configured goal is unresolved. Reached stop remains latched for that session, including after graceful completion, so legacy queue preferences cannot restart it. A new explicit session resets the latch. Blank goal preserves normal session behavior.

## Code Map

- `core/rating_tracker/session_goal.py`, `service.py`, `routes.py`: independent durable binding and confirmed-observation response using existing worker/reconciliation.
- `frontend/rating_tracker/session-goal.js`, `index.js`: Latest-Wins session/account correlation, retries, leader-only graceful stopping and synchronous queue gate.
- `script.js`: narrowly scoped queue checks and terminal notification through the existing bridge; no reducer/config schema change.
- `frontend/rating_tracker/target-field.js`: compact accessible session state, no layout reconstruction.
- Tests and fixtures: deterministic SQLite/public-data tests, fake session guard and Chromium actual-bundle integration; no ranked games played.

## Tasks & Acceptance

- [x] Backend: pin independent binding, validate account/category, reuse worker, reject stale/conflicting observations and preserve existing goals.
- [x] Frontend: block queue until bound/confirmed, reject old responses and account mismatch, stop once per leader/session, retry errors without interrupting a game.
- [x] Wire the existing bridge and post-game evidence; retain field in Auto Play and keep original visual fixes.
- [x] Cover upward/downward crossing, blank target, delayed publication, terminal deduplication, conflicts, refresh, account/category changes, followers, retries and next-session behavior.
- [x] Deterministic userscript regeneration and regressions; stage only task files for the local delivery commit.

Given a blank target, a session retains its previous behavior. Given a configured target, no queue is admitted until its binding has valid current data. Given a genuinely confirmed crossing, only the current session leader requests graceful stop; a running game is not resigned. Given obsolete or mismatched data, no completion is reported. Given an offline backend, drafts/history remain intact and pending status is explicit. Given a new session, the current saved target is pinned afresh.

## Verification

Python tracker/application suites; dedicated backend and frontend guard tests; Chromium actual userscript plus local Flask and controlled public provider; session-control regressions, Analysis Lab tests/typecheck/build; all deterministic build checks. Authenticated Chess.com and real publication latency remain separately documented manual limits.

## Review and corrections

Review identified missing queue reconciliation after confirmation, non-durable completion/pending evidence, blank-target failures after an accepted disabled binding, in-flight finish retirement and abandoned monitoring. Fixed with an existing-bridge queue reconciliation callback, identity-scoped completion/pending-game restoration, durable disabled bindings, request-body retirement acknowledgement and a 15-minute monitoring heartbeat lease. Lease expiry is dormancy, not session completion; resumption preserves the pinned baseline and requires fresh public revalidation. Start awaits an edited field save to prevent a blur/request race. Invalid or mismatched payloads cannot claim completion.

Initial local binding requires the server, including a blank goal. Once an empty goal is pinned it remains a no-op during tracker outages. A missing trusted account/category fails closed rather than guessing. The existing controller writer lease may require expiry before a new session; browser tests respect this existing behavior rather than modifying leadership semantics.

## Validation record

- Backend: 34 new session-goal tests, 53 tracker tests, 17 reliability tests and 7 app tests pass.
- Frontend: 8 existing contract tests, dedicated draft/flush tests and session guard tests pass.
- Session Control: all 14 existing suites pass without reducer, DTO, IndexedDB or leadership changes.
- Analysis Lab: 113 tests, typecheck and production build pass.
- Chromium: actual built userscript, real Flask/SQLite, actual IndexedDB/Web Locks/controller with deterministic public provider. Upward 2300→confirmed 2310 and downward 1800→confirmed 1790 produce COMPLETED/GRACEFUL_STOP. Restore retains reached queue latch. No ranked games are played and recorded gameplay effects are empty. External Config/clean-view/banner regression and Eval Bar geometry/animation fixture pass. Evidence: `rating-goal-tracker/browser/single-field-report.json`.
- Syntax and all three deterministic build checks pass; bundle size remains informational.
- Final userscript: 656458 bytes. All 209 pre-existing protected/unrelated files hash-identical. No push.

## Suggested Review Order

- Independent durable session binding and confirmed-only evaluation.
  [session_goal.py](../../core/rating_tracker/session_goal.py#L1)
- Correlation, queue safety, restoration and graceful stopping.
  [session-goal.js](../../frontend/rating_tracker/session-goal.js#L3)
- Existing bridge integration without move or engine modifications.
  [script.js](../../script.js#L303)
- Browser proof and deterministic lifecycle regressions.
  [test_rating_tracker_chrome.js](../../tests/test_rating_tracker_chrome.js#L117)
  [test_rating_session_goal.py](../../tests/test_rating_session_goal.py#L19)
  [test_rating_session_guard.js](../../tests/test_rating_session_guard.js#L1)
