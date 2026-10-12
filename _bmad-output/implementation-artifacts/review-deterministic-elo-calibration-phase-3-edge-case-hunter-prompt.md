# Edge Case Hunter Review Prompt — Deterministic Elo Calibration Phase 3

Invoke the `bmad-review-edge-case-hunter` skill on the Phase 3 working-tree diff against baseline commit `f04630d`.

Review the complete changes in:

- `app.py`
- `core/smart_pacing/__init__.py`
- `core/smart_pacing/adapter.py`
- `core/smart_pacing/analyzer.py`
- `core/smart_pacing/calibration.py`
- `core/smart_pacing/contracts.py`
- `core/smart_pacing/coordinator.py`
- `core/smart_pacing/service.py`
- `core/smart_pacing/testing.py`
- `tests/test_move_plan.py`
- `tests/test_server.py`
- `tests/elo_calibration/test_coordinator_contract.py`
- `_bmad-output/implementation-artifacts/spec-deterministic-elo-calibration-phase-3.md`

Use `git diff f04630d -- <tracked paths>` for tracked changes and read the untracked Phase 3 files directly. Exclude unrelated pre-existing changes in `tests/test_scout_logic.js`, `TC157.user.js`, move-panel artifacts, and other planning artifacts.

Walk every branch and boundary involving missing or invalid artifacts, unsupported Elo, pin eviction and repeated revisions, side changes, forced/book/terminal positions, cache hits, budget admission, cancellation between stages, selector failure, restore failure, generation changes, concurrent games, configuration/readiness failures, and Shadow/Active flag behavior. Confirm calibrated play is time-only and never falsely reports applied calibration.

Return only unhandled edge cases with file, location, triggering state, observed behavior, expected behavior, and a minimal regression test. Do not modify files.
