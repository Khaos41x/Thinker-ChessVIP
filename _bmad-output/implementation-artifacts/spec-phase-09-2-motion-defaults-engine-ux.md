---
title: 'Phase09.2 — measured motion and consistent first-run configuration'
type: bugfix
created: '2026-10-24'
status: done
baseline_commit: b9624eb
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="User authorizes direct implementation, validation and local commit">

## Intent

**Problem:** Eval Bar movement needs objective frame-level diagnosis; first-run feature/timing preferences and prefilled optional win-rate targets are inconsistent or misleading. Engine selection needs concise explanations grounded in actual resource and latency measurements.

**Approach:** Instrument the current real Stockfish NDJSON→selector→RAF pipeline before tuning it. Refine proven presentation bottlenecks while preserving engine truth and animation invariants. Correct defaults only where no deliberate saved values exist, represent optional win-rate targets explicitly as unset, and use the existing registry/presenter/configuration authorities on both surfaces.

## Boundaries & Constraints

**Always:** Preserve unrelated dirty work, White-POV and Lichess mathematics, NNUE validation, all three existing engines, existing authorization boundaries, request/FEN/cache provenance, Eval Bar geometry and lifecycle, existing Auto Play authority/safety/history, Rating Goal, Scout, Banner, Recent Form and External Config design. Use canonical Random0.50–1.00 seconds, first-run Banner/Recent Form only, and unset optional win-rate targets. Keep enabled state separate from engine preference. Existing saved values win over defaults. Keep interpolation frame-rate independent and retarget from the current fraction. Produce deterministic script.js and local commit only.

**Ask First:** Only changes outside the authorized presentation/configuration scope require further user direction.

**Never:** Reconstruct architecture, modify chess automation or matchmaking, hide manipulation through chosen target rates, imply unauthorized assistance, force saved feature resets, blindly migrate ambiguous0.01/0.01 settings, degrade engine quality, add conflicting CSS animation, queue old scores, reset to50%, flash gray, introduce duplicate RAF loops, claim fixed120Hz on unsupported hardware, or push remotely.

## I/O & Edge-Case Matrix

| Scenario | Input/state | Expected behavior | Recovery |
|---|---|---|---|
| First run | No saved browser/config preferences | Banner/Recent Form on; listed other switches off; Random0.50–1.00; win-rate fields empty | Missing optional targets explain required configuration before existing session start |
| Existing install | Explicit timing/features/win rates including legacy-looking0.01 | Values preserved across refresh/reconnect | Only proven seeded values may migrate |
| Unset vs zero | Both optional rates absent/null versus0 | Null renders empty; zero rejected; numeric pairs retain strict bounds | Inputs/drafts retained on validation/save error |
| Rapid analysis | Irregular accepted UCI results mid-transition | Latest Wins, continuous current-position retargeting, no overshoot or DOM rebuild | Cancel obsolete callbacks by existing guards |
| Disconnect | Offline config or stale revision | Last accepted state retained, unsaved edits survive | Existing Retry/revision merge applies |
| Engine selection | Any installed preferred engine | Concise name plus verified description | Unrelated settings never reset preference or enable evaluation |

</frozen-after-approval>

## Code Map

- `analysis_lab/src/ui/eval-bar.ts` — exponential110ms RAF controller and transform commit.
- `frontend/eval_bar/userscript-adapter.ts` —250ms ordinary presentation coalescing, selector and geometry reconciliation; pre-existing dirty authorization changes must remain isolated.
- `core/external_config.py` — shared defaults, revision validation and session relay.
- `frontend/session_control/presentation.js` — shared draft/schema mapping; numeric operational session contract remains strict.
- `frontend/session_control/ui.js` and `external.js` — existing embedded draft/relay availability.
- `script.js` — nongenerated startup/migration/config hooks plus deterministically generated bundles; preserve prior dirty sections.
- `core/eval_bar/registry.py` and `frontend/eval_bar/engine-selection.js` — stable engine metadata and compact embedded description.
- `frontend/external_config/panel.js` and `index.html` — matching defaults, optional target display and registry description.
- `scripts/benchmark_eval_bar_engines.py` — existing benchmark patterns reused in dedicated controlled200ms comparison.

## Tasks & Acceptance

**Execution:**
- [x] Instrument baseline/after actual Stockfish streaming with Chromium trace, RAF intervals/long tasks/latency/convergence/loop/mount continuity.
- [x] Refine only confirmed rendering bottlenecks, test30/60/120 simulated schedules and document supported actual display cadence.
- [x] Remove unsafe startup migrations and make first-run flags/timing canonical while retaining deliberate saved values and sync semantics.
- [x] Extend optional presentation/configuration rates to null without changing strict numeric session execution or inventing substitute thresholds.
- [x] Add shared verified engine descriptions and benchmark common200/1000/3000ms budgets over identical real FENs and3threads/16MB hash where supported.
- [x] Add first-run, saved/null/zero, concurrent/failed-save and engine preference nonregression tests; run existing relevant suites.
- [x] Rebuild generated bundles, review the isolated feature diff, write technical evidence and commit locally without push.

**Acceptance Criteria:**
- Given a new installation, when both surfaces hydrate, then exactly Banner/Recent Form are enabled and optional rates are empty.
- Given saved custom settings, when refresh/reconnect occurs, then accepted values survive and background polling retains unsaved input.
- Given a missing optional rate, when session configuration is attempted, then a truthful configure-targets error prevents inventing execution thresholds.
- Given actual authorized analysis streaming, when new scores arrive, then one controller animates continuously from its rendered value, preserving stale-FEN guards and geometry.
- Given measured real RAF cadence, when comparing before/after, then reports distinguish target sparsity from dropped frames and state hardware limitations honestly.
- Given all three real engines, when budgets and FENs match, then measured response/evaluation/resource data supports descriptions without strength/time-control claims.

## Spec Change Log

## Design Notes

The existing operational session schema requires two numeric win-rate thresholds. Optional unset is a preference/draft state, not a fabricated numeric execution value: saves allow the unset pair, while session conversion requires a valid configured pair. No existing numeric session snapshots migrate. Ambiguous legacy values remain untouched.

Tau110ms is the initial reference. A coalesced presentation deadline can defer target acceptance independently of RAF cadence; timing measurements must report both. Changes must retain the existing Latest-Wins mailbox and one scheduled frame invariant. Controlled engine timing measures cold verified startup separately from warm search budgets; network size is not process memory.

## Verification

Run targeted Python configuration tests; all Session Control and engine selection tests; browser no-tab/persistence/revision tests; real streamed-engine motion and geometry regressions; TypeScript/vitest; deterministic userscript/evalbar/engine bundle checks. Capture trace plus JSON/Markdown metrics and responsive screenshots. Verify staged source-generated bundle consistency separately from unrelated working-tree content.


## Review and Evidence

Adversarial and edge review completed. Fixed obsolete startup variable ReferenceError, upgrade preference provenance, persistent-error visibility and sample/frame correlation. Optional durable persistence extends the existing service to satisfy restart retention; no operational session schema or gameplay behavior changed. Motion evidence reports the native60Hz limit and an isolated missed frame honestly. Detailed tests, traces and benchmark are in `phase09-2/REPORT.md`.

## Suggested Review Order

- Reduce measured target delay without changing authorization or engine truth.
  [userscript-adapter.ts:127](../../frontend/eval_bar/userscript-adapter.ts#L127)

- Avoid redundant writes while retaining the110ms single-RAF controller.
  [eval-bar.ts:172](../../analysis_lab/src/ui/eval-bar.ts#L172)

- Persist the same accepted configuration authority and expose restore errors.
  [external_config.py:80](../../core/external_config.py#L80)

- Represent optional targets honestly while retaining strict execution validation.
  [presentation.js:7](../../frontend/session_control/presentation.js#L7)

- Explain verified engine differences in the existing compact selector.
  [engine-selection.js:90](../../frontend/eval_bar/engine-selection.js#L90)

- Verify actual startup, both surfaces, refresh, restart and error recovery.
  [test_phase092_defaults.mjs:7](../../tests/browser/test_phase092_defaults.mjs#L7)

- Measure common real search budgets with controlled resources.
  [benchmark_phase092_engines.py:27](../../scripts/benchmark_phase092_engines.py#L27)
