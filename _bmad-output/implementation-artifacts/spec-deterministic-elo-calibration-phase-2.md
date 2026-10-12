---
title: 'Deterministic Elo Calibration Phase 2'
type: 'feature'
created: '2026-10-12'
status: 'done'
baseline_commit: '8b39015'
review_loop_iteration: 1
context:
  - '{project-root}/_bmad-output/planning-artifacts/architecture/deterministic-elo-calibration-v2-2026-10-11/ARCHITECTURE-SPINE.md'
  - '{project-root}/_bmad-output/planning-artifacts/architecture/deterministic-elo-calibration-v2-2026-10-11/ENGINEERING-PLAN.md'
  - '{project-root}/_bmad-output/implementation-artifacts/spec-deterministic-elo-calibration-phase-0-1.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Phase 1 can consume a validated calibration artifact, but the repository cannot yet produce one reproducibly from headless paired engine matches.

**Approach:** Build an offline, resumable python-chess pipeline that records color-reversed opening pairs, derives versioned pentanomial sufficient statistics, applies weighted isotonic regression and forward PCHIP fitting, then emits a strict Phase-1 `CalibrationArtifact` and validation report.

## Boundaries & Constraints

**Always:** Keep all orchestration outside Flask; use one time-only search limit per manifest; clear hash and await readiness before every move; fingerprint binaries, UCI options, corpus, schedule, hardware envelope, and tool versions; treat a pair as the atomic idempotency unit; preserve failures separately; fit only `rating = R(skill)` for all Skills `0..25`; use deterministic canonical JSON and atomic same-volume file replacement; make every statistical method explicitly versioned; support injected fake adapters for hermetic tests.

**Ask First:** Adding or pinning dependencies, changing Phase-1 seed/inverse semantics, integrating with `app.py` or EngineCoordinator, inventing production reference ratings, or running a long real-engine tournament.

**Never:** Import `app.py`; require Komodo, Stockfish, SciPy, network, or Flask in unit tests; use Depth/Nodes as Elo controls; count half-pairs or operational failures in the estimator; overwrite conflicting completed records; extrapolate missing Skills; label an approximate interval as profile likelihood; activate an artifact in production.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|---------------|----------------------------|----------------|
| New pair | Manifest, scheduled Skill/reference cell, opening | Two games with reversed colors; canonical pair JSON and PGN | Publish only after both games complete |
| Resume | Existing byte-valid complete pair | Skip without launching engines | Conflicting/tampered ID fails closed |
| Engine failure | Crash, timeout, illegal move, or max-ply adjudication | Preserve classified failure and telemetry | Pair excluded from strength estimate |
| Estimate | Complete normal-result pairs | Ordered `[LL, LD, DD_or_WL, WD, WW]`, Elo delta, CI, weight | Boundary scores produce explicit infinite/unbounded result |
| Fit | Training estimates covering Skills 0–25 | Weighted isotonic anchors and forward PCHIP artifact | Missing/nonfinite/nonpositive-weight Skill rejected |
| Validate | Candidate plus independently hash-split holdout | Rebuild candidate byte-for-byte and evaluate frozen gates | Any mismatch or failed gate yields nonzero verdict |

</frozen-after-approval>

## Code Map

- `tools/elo_calibration/models.py` — strict benchmark-plan, record, estimate, fit-report, validation-report, and attestation DTOs.
- `tools/elo_calibration/io.py` — canonical JSON, duplicate-key rejection, checksums, atomic writes, and strict loaders.
- `tools/elo_calibration/run_matches.py` — injectable python-chess UCI adapter, paired runner, canonical IDs, resume, PGN/JSON output, CLI.
- `tools/elo_calibration/estimate.py` — pair normalization, pentanomial counts, deterministic score/Elo/interval/weight estimation, CLI.
- `tools/elo_calibration/fit_curve.py` — weighted PAVA, forward PCHIP coefficient generation, fit report, Phase-1 artifact emission, CLI.
- `tools/elo_calibration/validate.py` — train/holdout replay, environment and equivalence gates, report/attestation, CLI.
- `core/elo_calibration/interpolation.py` — expose one shared PCHIP builder so offline fitting and runtime validation cannot diverge.
- `tests/elo_calibration_phase2/` — miniature-corpus and fake-adapter contract tests.

## Tasks & Acceptance

**Execution:**
- [x] Define strict Phase-2 schemas and canonical, content-addressed storage.
- [x] Implement color-reversed, pair-atomic, resumable headless match orchestration.
- [x] Implement versioned pentanomial sufficient statistics and honest deterministic confidence intervals.
- [x] Implement weighted PAVA and shared forward-PCHIP artifact construction.
- [x] Implement independent holdout validation, byte-rebuild proof, gates, and immutable attestation.
- [x] Add hermetic tests and CLI smoke coverage without commercial engines.

**Acceptance Criteria:**
- Given identical benchmark inputs and records in separate processes, when the pipeline runs, then records, estimates, artifact bytes, checksum, reports, and verdict are byte-identical.
- Given a complete 26-Skill synthetic training corpus, when fitting runs, then the emitted JSON loads through Phase-1 `load_artifact_bytes` and every segment passes its PCHIP validator.
- Given interrupted or duplicated work, when resume runs, then only missing whole pairs execute and conflicts fail closed.
- Given the Phase-2 unittest command, when run offline, then no Flask, SciPy, network, or real engine process is required.

## Spec Change Log

## Design Notes

The initial estimator is named `pentanomial-delta-v1`: it uses pair-score categories as clustered observations, reports the conventional Elo transform, and applies a deterministic delta-method confidence interval. It must not claim `profile-likelihood-v1`. Reference ratings and Skill/reference allocation live in the immutable benchmark plan; no repository default claims a real Elo scale. A checked-in synthetic miniature corpus proves mechanics only, never Komodo strength.

## Verification

**Commands:**
- `python -m unittest discover -s tests/elo_calibration_phase2 -p "test_*.py" -v` — all offline pipeline tests pass.
- `python -m unittest discover -s tests/elo_calibration -p "test_*.py" -v` — Phase-1 compatibility remains green.
- `python -m compileall -q core/elo_calibration tools/elo_calibration tests/elo_calibration_phase2` — no syntax/import failures.
- `git diff --check` — no whitespace errors or unrelated edits.

## Suggested Review Order

**Offline orchestration and integrity**

- Start with pair-atomic execution, cold-state moves, resume checks, and immutable publication.
  [`run_matches.py:199`](../../tools/elo_calibration/run_matches.py#L199)

- Canonical checksummed envelopes make completed pair records tamper-evident.
  [`run_matches.py:175`](../../tools/elo_calibration/run_matches.py#L175)

- The immutable manifest freezes environment, algorithms, thresholds, and stopping policy.
  [`models.py:63`](../../tools/elo_calibration/models.py#L63)

**Statistical pipeline**

- Pentanomial estimation uses clustered pair scores and regularized delta-method Elo intervals.
  [`estimate.py:31`](../../tools/elo_calibration/estimate.py#L31)

- Weighted PAVA produces monotone Skill anchors before Phase-1 artifact construction.
  [`fit_curve.py:63`](../../tools/elo_calibration/fit_curve.py#L63)

- Offline fitting reuses the exact PCHIP builder enforced by runtime validation.
  [`interpolation.py:46`](../../core/elo_calibration/interpolation.py#L46)

**Independent validation**

- Validation binds split evidence, manifests, byte rebuilds, statistical gates, NPS, and color balance.
  [`validate.py:93`](../../tools/elo_calibration/validate.py#L93)

- Reports record evidence digests and immutable promotion-relevant measurements.
  [`models.py:398`](../../tools/elo_calibration/models.py#L398)

**Hermetic verification**

- Cross-process tests prove byte-identical pipeline results without commercial engines.
  [`test_determinism_cli.py:16`](../../tests/elo_calibration_phase2/test_determinism_cli.py#L16)

- Fake-adapter tests cover reversed colors, resume, tamper detection, and preflight rejection.
  [`test_runner_io.py:26`](../../tests/elo_calibration_phase2/test_runner_io.py#L26)

- Holdout tests exercise evidence separation, frozen gates, subject-only NPS, and immutable attestations.
  [`test_validate.py:17`](../../tests/elo_calibration_phase2/test_validate.py#L17)
