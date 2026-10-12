# Blind Hunter Review Prompt — Deterministic Elo Calibration Phase 3

Invoke the `bmad-review-adversarial-general` skill on the Phase 3 working-tree diff against baseline commit `f04630d`.

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

Validate the implementation against the approved spec, especially the single coordinator lease, reference-shallow → selector → reference-deep ordering, cold profile transitions, Clear Hash/readiness, active admission, default Shadow Mode, per-game/side pinning, cache identity, typed fallback, and removal of Elo-derived Depth/Nodes from V2.

Return only concrete findings with file, location, evidence, consequence, and suggested remediation. Do not modify files.
