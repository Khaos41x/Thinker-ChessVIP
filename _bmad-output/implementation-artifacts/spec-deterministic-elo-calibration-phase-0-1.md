---
title: 'Deterministic Elo Calibration Phase 0-1'
type: 'feature'
created: '2026-10-11'
status: 'done'
baseline_commit: '3a2156ada0388d4957c8ecec4d14b91c3031a250'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/planning-artifacts/architecture/deterministic-elo-calibration-v2-2026-10-11/ARCHITECTURE-SPINE.md'
  - '{project-root}/_bmad-output/planning-artifacts/architecture/deterministic-elo-calibration-v2-2026-10-11/ENGINEERING-PLAN.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The repository has no strict, reproducible contract for turning a named target Elo into a legal Komodo 14.1 profile. The current production mapper is heuristic and couples rating to search controls, but production integration is intentionally outside this phase.

**Approach:** Build a hermetic `core/elo_calibration` package containing Phase-0 measurement DTOs, immutable calibration artifacts, pure forward PCHIP/generalized-inverse evaluation, deterministic adjacent-Skill resolution, an initial `EloCalibrator`, and a scripted Fake UCI contract. Verify everything with direct `unittest` tests that never import `app.py` or launch Komodo.

## Boundaries & Constraints

**Always:** Use frozen/strictly typed DTOs; require `scaleId` and `budgetClass`; restrict Skill to integral `[0,25]`; evaluate precomputed forward PCHIP coefficients in pure Python; resolve plateaus with the lowest-Skill left-continuous generalized inverse; use the approved length-prefixed SHA-256 seed policy; reject malformed/checksum-mismatched artifacts and unsupported ratings; keep Threads, Hash, MultiPV, and time-only search policy invariant by artifact; make Fake UCI reject arbitrary options and depth/node limits; preserve unrelated dirty files.

**Ask First:** Any change to existing Smart Pacing, `app.py`, requirements, production API/cache identity, real coordinator/Komodo integration, or the ratified seed/inverse contract.

**Never:** Fit curves at runtime; import SciPy in production modules; extrapolate or silently clamp outside measured support; derive Depth/Nodes from Elo; add an underspecified 800–1200 human-error policy; create empty activation/telemetry placeholders; depend on the commercial engine in tests.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Exact anchor | Valid request at an anchor rating | Exact latent Skill and same integral applied Skill | N/A |
| Between anchors | Valid rating inside a rising segment | Monotone latent Skill; seeded adjacent legal Skill | N/A |
| Plateau | Rating equals a pooled plateau | Lowest Skill on that plateau | N/A |
| Unsupported target | Rating below Skill 0 or above Skill 25 support | No profile | Typed `UnsupportedRatingRange` |
| Invalid artifact | Bad checksum/schema/hash/anchors/segments | Artifact rejected before lookup | Typed artifact error with field/reason |
| Deterministic replay | Same artifact, game token, side, target | Byte-stable resolution key and identical applied Skill | N/A |
| Fake UCI stages | Reference→selector→reference manual contract | Clear Hash and `isready` before every stage; no warm-state leak | Injected failures remain observable |

</frozen-after-approval>

## Code Map

- `core/elo_calibration/models.py` — strict enums and immutable Phase-0/1 DTOs, including experiment manifest and effective engine profile.
- `core/elo_calibration/errors.py` — typed fail-closed domain errors with field/reason metadata.
- `core/elo_calibration/interpolation.py` — pure PCHIP validation/evaluation, generalized inverse, canonical seed and adjacent-Skill resolver.
- `core/elo_calibration/artifact.py` — canonical JSON, checksum, load/round-trip, and artifact invariants.
- `core/elo_calibration/calibrator.py` — public artifact-bound `EloCalibrator` facade.
- `core/elo_calibration/testing.py` — scripted Fake UCI engine, event log, failure injection, option/limit enforcement.
- `core/elo_calibration/__init__.py` — explicit supported public API.
- `tests/elo_calibration/` — hermetic unittest modules and synthetic fixture builders.

## Tasks & Acceptance

**Execution:**
- [x] `core/elo_calibration/errors.py`, `models.py` — define strict DTOs and all validation invariants for requests, manifests, artifacts, policies, identities, anchors, segments, and profiles.
- [x] `core/elo_calibration/interpolation.py` — implement forward cubic evaluation, monotonic/no-overshoot validation, deterministic bisection inverse, plateau rule, canonical SHA-256 resolution and profile identity.
- [x] `core/elo_calibration/artifact.py`, `calibrator.py`, `__init__.py` — implement canonical immutable artifact loading/checksums and the public target-to-profile path.
- [x] `core/elo_calibration/testing.py` — implement Fake UCI desired/applied state, generation, clear/isready/warm lifecycle, scripted results, and failure injection.
- [x] `tests/elo_calibration/*.py` — cover the complete I/O matrix, manifest invariants, golden seed vectors, artifact corruption, process replay, profile allowlist, and fake stage ordering.

**Acceptance Criteria:**
- Given a valid synthetic artifact, when every supported integer target is evaluated in ascending order, then latent Skill is nondecreasing and applied Skill is always an adjacent integer in `[0,25]`.
- Given identical canonical inputs in separate Python processes, when profiles are resolved, then checksum, resolution key, profile digest, and applied Skill are identical.
- Given any changed game token, side, artifact checksum, or target, when identity is derived, then the relevant deterministic identity changes without creating arbitrary UCI options.
- Given the Phase-1 test command, when run without Komodo, Flask, SciPy, or network access, then all tests pass and emit a reproducible unittest log.

## Spec Change Log

## Design Notes

`rating = R(skill)` is the only spline direction. Segment coefficients use `dx = skill - leftSkill`; runtime inversion uses fixed-iteration bisection and never constructs a spline with rating as the independent axis. Synthetic fixtures are explicitly non-production and cannot claim a real Elo scale.

## Verification

**Commands:**
- `python -m unittest discover -s tests/elo_calibration -p "test_*.py" -v` — expected: all hermetic Phase-0/1 tests pass.
- `python -m compileall -q core/elo_calibration tests/elo_calibration` — expected: no syntax/import errors.
- `git diff --check` — expected: no whitespace errors and no unrelated file modifications from this implementation.

## Suggested Review Order

**Runtime mapping**

- Start with the fail-closed artifact-to-profile entry point.
  [`calibrator.py:17`](../../core/elo_calibration/calibrator.py#L17)

- Inspect PCHIP validation and coefficient verification.
  [`interpolation.py:46`](../../core/elo_calibration/interpolation.py#L46)

- Review generalized inversion and plateau behavior.
  [`interpolation.py:128`](../../core/elo_calibration/interpolation.py#L128)

- Verify canonical per-game deterministic resolution.
  [`interpolation.py:158`](../../core/elo_calibration/interpolation.py#L158)

**Contracts and artifacts**

- Review the immutable experiment contract and statistical identity.
  [`models.py:133`](../../core/elo_calibration/models.py#L133)

- Confirm artifacts bind manifests, engine identity, policies, and curves.
  [`models.py:331`](../../core/elo_calibration/models.py#L331)

- Inspect strict JSON parsing, duplicate rejection, and checksum verification.
  [`artifact.py:211`](../../core/elo_calibration/artifact.py#L211)

- Confirm effective profiles preserve adjacency and admission budgets.
  [`models.py:441`](../../core/elo_calibration/models.py#L441)

**Hermetic verification**

- Review desired/applied state, cold resets, and failure injection.
  [`testing.py:21`](../../core/elo_calibration/testing.py#L21)

- Follow end-to-end calibrator invariants across every supported integer target.
  [`test_calibrator.py:30`](../../tests/elo_calibration/test_calibrator.py#L30)

- Check cross-process replay and the golden seed vector.
  [`test_determinism.py:14`](../../tests/elo_calibration/test_determinism.py#L14)

- Inspect corruption and manifest-contract coverage.
  [`test_artifact.py:26`](../../tests/elo_calibration/test_artifact.py#L26)

- Verify stage ordering and no warm-state leakage.
  [`test_fake_uci.py:20`](../../tests/elo_calibration/test_fake_uci.py#L20)

- Review anchors, plateaus, PCHIP rejection, and unsupported ranges.
  [`test_interpolation.py:16`](../../tests/elo_calibration/test_interpolation.py#L16)
