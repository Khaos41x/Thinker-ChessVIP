---
title: 'Phase 09.1 — reliable External Config and complete workspace parity'
type: bugfix
created: '2026-10-24'
status: done
baseline_commit: '3a503f6'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="User explicitly authorized complete correction and local commit">

## Intent

**Problem:** The running server returns 404 for /config/engines while serving current frontend assets. panel.js swallows discovery failure, leaving a permanently disabled Loading selector. Even a current backend gates preference selection on analysis heartbeat. External Config also omits all Auto Play session fields/actions/status except Rating Goal.

**Approach:** Repair preference discovery/save acknowledgement independently of execution authorization, and extend the existing configuration/presenter/session bridge so both surfaces expose the same settings and genuine session state. Keep the existing session authority and execution callbacks.

## Boundaries & Constraints

**Always:** Preserve existing dirty work and all installed engines. Exactly three stable engine IDs. Preference configuration is available without Chess.com; actual analysis remains authorized exactly as before. Keep Eval Bar enabled state independent. Complete Core, Visuals, Engine Control, Auto Play and Clean View parity. Auto Play includes Duration (Min), Min Wins %, Max Wins %, Rating Goal, Start, Finish, Export Diagnostics, Status, Time Left, Score and Win Rate. Preserve current validation, master/queue/game safety checks, IndexedDB session authority, rating history and deliberate persistence boundaries. Use English labels and existing minimal dark design. Rebuild generated artifacts from source. Commit locally only.

**Ask First:** Destructive/unrelated changes, installing packages, remote push, or changing gameplay/analysis permissions.

**Never:** Duplicate the session reducer, introduce independent session persistence in Flask, synthesize active game/session state, implement new gameplay behavior, add Opponent Scout externally, replace existing duration/win-rate fields with Rating Goal, reset preferences or claim failed saves succeeded.

## I/O & Edge-Case Matrix

| Scenario | Input/state | Expected outcome | Recovery |
|---|---|---|---|
| No Chess.com | Local server/registry available | Discover/install state and preference selection remain operable | Execution remains inactive until authorized |
| Missing endpoint | Running stale backend returns 404 | Visible registry Error with restart/retry guidance | Retry reaches Ready after backend update |
| Save failure | Invalid/missing engine or IO error | Prior acknowledged preference retained | Explicit error and Retry |
| Restart/reload | Saved engine preference | Same preferred engine restored without fake Active | Lazy execution initialization |
| Poll/save race | Concurrent patches or delayed response | Revision/conflict handling prevents silent lost updates | Preserve drafts and retry safely |
| Auto Play disconnected | No live userscript projection | Full configuration visible; operations truthfully unavailable with reason | Reconnect refreshes actual availability |
| Connected session | Existing bridge status and commands | Same presenter/status/actions; command IDs and acknowledgements | Expired/duplicate commands cannot execute twice |
| Session states | Genuine idle/active/completed projections | Status, time, score and win rate match existing contract | Stale projection marked unavailable |

</frozen-after-approval>

## Code Map

- `core/eval_bar/registry.py`, `routes.py`: separate durable preferred engine from active runtime; local preference save independent of heartbeat, authorized execution retains real initialization.
- `core/external_config.py`: existing config/revision authority extended with session draft and bounded projection/command relay; sessions remain owned by Chess.com IndexedDB.
- `frontend/session_control/`: reuse models validation, config conversion, presenter, status, operation callbacks and source bridge.
- `frontend/external_config/`: reliable finite engine/connection UI, complete session fields/actions/status and responsive matching tokens.
- `frontend/eval_bar/engine-selection.js`: selected preference acknowledgement and lazy authorized runtime convergence, without stale polling overwrites.
- `scripts/build_userscript.py`, `scripts/build_analysis_engine.py`, source bridge modules: deterministic builds with minimal legacy hooks in nongenerated script integration.

## Tasks & Acceptance

- [ ] Repair engine preference endpoint, revisioned save and discovery/error/retry lifecycle without heartbeat or eager execution.
- [ ] Add shared session draft/config contracts, validation and accepted projection presentation. Preserve existing defaults from source and existing session persistence semantics.
- [ ] Add bounded commands/status relay to existing configuration service; embedded source bridge executes only existing callbacks with eligibility checks, command ownership, expiration and acknowledgements.
- [ ] Expose complete Auto Play and all generic controls; separate local server, userscript, registry and execution status. Keep Rating Goal additive and Opponent Scout absent.
- [ ] Synchronize both directions and preserve pending edits across poll/save conflicts. Failed requests never imply success.
- [ ] Add backend, shared frontend and real Flask/browser tests covering no-tab selection, restart, failures/recovery, genuine session projections, all shared fields and revision races.
- [ ] Capture before/after External Config and embedded fixture at required resolutions and 125/150% zoom; verify keyboard/overflow/grouping.
- [ ] Update actual local server safely after preserving its current configuration, regenerate deterministically, review and commit only this correction.

**Acceptance Criteria:**
- Given no Chess.com tab, when External Config opens and saves any installed engine, then discovery settles, selection is acknowledged and reload/server restart preserve it.
- Given disconnected or stale backend, when requests fail, then bounded Error/Connection Lost states and Retry replace permanent initialization text, retaining last known selection without Active claims.
- Given connected authorized analysis, when saved preference differs from runtime, then verified switching uses that preference; unauthorized analysis stays rejected.
- Given either presentation surface, when any shared setting changes, then both reflect accepted revision without silently resetting unrelated settings or overwriting in-flight edits.
- Given actual existing session status, when projected externally, then full configuration/actions/status are present and operations dispatch through existing authorization/safety callbacks only.
- Given missing runtime/connection, when actions are unavailable, then explicit reasons are visible and configuration remains editable.

## Design Notes

The currently running port 5050 has two Python app.py listeners, both from this repository; do not indiscriminately terminate processes. Preserve live /config/load values before updating the identified servers. Existing config is memory-only; retain its ordinary restart semantics while preserving current user values during this maintenance restart. Engine preference remains an engine-owned durable field.

Embedded Auto Play currently uses an in-memory presenter draft and IndexedDB session snapshot; production does not use GmStoragePort's config methods. Extend the existing authority/relay instead of creating a competing session store. Tests must use existing buildStatusView/validateSessionConfig contracts and never manipulate a real game.

## Verification

- Existing configuration, engine and session-control suites plus new focused no-tab/revision/action relay regressions.
- Real registry/Flask/browser selection, persistence through restart, error/reconnect and authorized evaluation tests.
- Real presenter contract projections for idle/unavailable/active/completed without live gameplay actions.
- Screenshots at 1280x720, 1440x900, 1920x1080 and 125/150% zoom; inspect both surfaces.
- Deterministic build/check twice, syntax/type checks, staged-only diff and local commit.


## Validation and Review

Completed real Flask/registry no-tab preference persistence, browser reload and Flask restart, failure/Retry/reconnect, HTML404 recovery, revision conflicts and retained drafts. All14 Session Control suites, 10 configuration backend tests, real session relay/idempotence regression, bidirectional browser configuration and Eval Bar lifecycle/visual regressions passed. Real installed engines switched Smallnet → Full → Komodo → Smallnet and evaluated a mate FEN with correct identities; execution authorization remained enforced. Both generated bundle checks passed.

Review patches: preserve unrelated session drafts during timing edits; merge only modified session fields against accepted configuration; apply engine conflict snapshots and retry the intended selection. No unrelated existing working-tree changes are included.

## Suggested Review Order

- Separate preference configuration from authorized engine execution.
  [routes.py:54](../../core/eval_bar/routes.py#L54)

- Persist installed-engine preference with acknowledged revisions.
  [registry.py:288](../../core/eval_bar/registry.py#L288)

- Keep existing configuration authority and bounded session relay.
  [external_config.py:50](../../core/external_config.py#L50)

- Reuse existing session callbacks with field-level synchronization.
  [external.js:20](../../frontend/session_control/external.js#L20)

- Render truthful connection, preference and session states.
  [panel.js:2](../../frontend/external_config/panel.js#L2)

- Exercise real no-tab preference persistence and recovery.
  [test_phase091_external_config.mjs:1](../../tests/browser/test_phase091_external_config.mjs#L1)
