- source_spec: `_bmad-output/implementation-artifacts/spec-session-control-start-silent-failure.md`
  summary: Complete the production game-observation, result-accounting, and Auto Move context adapters for Module 14.
  evidence: The pre-existing userscript has no production path for `GAME_OBSERVED` or `GAME_RESULT_OBSERVED` and supplies no stable `context().move` identity, so this broader lifecycle remains outside the approved START integration fix.

- source_spec: `_bmad-output/implementation-artifacts/spec-session-control-start-silent-failure.md`
  summary: Add account-aware active-session recovery during production bootstrap.
  evidence: The pre-existing recovery API requires an account key, but bootstrap can run before stable account DOM evidence exists; recovery currently occurs on START and correctly renews afterward but initially renders `IDLE` after reload.

- source_spec: `_bmad-output/implementation-artifacts/spec-session-control-start-silent-failure.md`
  summary: Make initial session commit and writer-lease acquisition one recoverable orchestration unit.
  evidence: The pre-existing controller persists `SESSION_STARTED` before acquiring the writer lease, so contention can leave a committed active follower session even though START reports `LEADER_REQUIRED`.
