from __future__ import annotations

import unittest
from dataclasses import replace

import chess

from tools.elo_calibration.io import canonical_json_bytes
from tools.elo_calibration.models import CellEstimate
from tools.elo_calibration.prepare_benchmark import (
    STOCKFISH_RATINGS,
    STAGE1_SKILLS,
    Opening,
    PreparationEnvironment,
    artifact_build_config,
    build_adaptive_plan,
    build_stage1_plan,
    parse_opening_corpus,
    plan_self_digest,
    reference_id,
    environment_from_preflight,
    validate_prior_evidence,
    _write_outputs_idempotently,
)


def openings(count: int = 300) -> tuple[Opening, ...]:
    board = chess.Board()
    cycle = ("g1f3", "g8f6", "f3g1", "f6g8")
    result = []
    for index in range(count):
        board.push_uci(cycle[index % len(cycle)])
        result.append(Opening(f"opening-{index:03d}", board.fen(en_passant="fen")))
    return tuple(result)


def environment() -> PreparationEnvironment:
    return PreparationEnvironment("Komodo 14.1", "a" * 64, "b" * 64, "c" * 64, "xeon-test", 100000.0, 4)


def estimate(skill: int, measured_rating: float) -> CellEstimate:
    reference = min(STOCKFISH_RATINGS, key=lambda rating: (abs(rating - measured_rating), rating))
    return CellEstimate(1, "pentanomial-delta-v1", "d" * 64, skill, reference_id(reference), float(reference), (0, 1, 8, 1, 0), 10, 0.5, 0.0, -20.0, 20.0, 1.0, None)


def exact_estimate(skill: int, rating: int, manifest: str, count: int = 1) -> CellEstimate:
    return CellEstimate(1, "pentanomial-delta-v1", manifest, skill, reference_id(rating), float(rating), (0, 0, count, 0, 0), count, 0.5, 0.0, -20.0, 20.0, 1.0, None)


class PrepareBenchmarkTests(unittest.TestCase):
    def test_environment_is_bound_to_passing_preflight(self) -> None:
        import json
        import tempfile
        from pathlib import Path

        with tempfile.TemporaryDirectory(dir=Path.cwd()) as directory:
            root = Path(directory)
            subject = root / "komodo.exe"
            reference = root / "stockfish.exe"
            corpus = root / "book.pgn"
            subject.write_bytes(b"komodo")
            reference.write_bytes(b"stockfish")
            corpus.write_bytes(b"pgn")
            report = {
                "schemaVersion": 1,
                "verdict": "pass",
                "moveTimeMs": 500,
                "loadedWorkers": 4,
                "safeWorkerRecommendation": 4,
                "hardwareFingerprint": "xeon-test",
                "engines": {
                    "subject": {"engineId": "Komodo 14.1 64-bit", "binarySha256": __import__("hashlib").sha256(b"komodo").hexdigest(), "loadedNpsPooled": 123456.0},
                    "reference": {"engineId": "Stockfish 19", "binarySha256": __import__("hashlib").sha256(b"stockfish").hexdigest()},
                },
            }
            report_path = root / "preflight.json"
            report_path.write_text(json.dumps(report), encoding="utf-8")
            result = environment_from_preflight(report_path, subject, reference, corpus, 4)
            self.assertEqual(result.subject_id, "Komodo 14.1 64-bit")
            self.assertEqual(result.baseline_nps, 123456.0)
            report["verdict"] = "fail"
            report_path.write_text(json.dumps(report), encoding="utf-8")
            with self.assertRaisesRegex(ValueError, "passing"):
                environment_from_preflight(report_path, subject, reference, corpus, 4)

    def test_stage1_is_deterministic_and_uses_frozen_profile(self) -> None:
        first = build_stage1_plan(environment(), openings(), opening_count=2)
        second = build_stage1_plan(environment(), tuple(reversed(openings())), opening_count=2)
        self.assertEqual(canonical_json_bytes(first), canonical_json_bytes(second))
        self.assertEqual(len(first.cells), len(STAGE1_SKILLS) * len(STOCKFISH_RATINGS) * 2)
        self.assertEqual(first.move_time_ms, 500)
        self.assertEqual(first.concurrency, 4)
        self.assertEqual(dict(first.subject_options)["Threads"], 1)
        self.assertIs(dict(first.subject_options)["OwnBook"], False)
        self.assertIs(dict(first.subject_options)["Use Syzygy"], False)
        self.assertTrue(all(dict(options)["Threads"] == 1 for _, options in first.reference_options))

    def test_stage2_interpolates_measured_samples_and_stage3_requires_every_skill(self) -> None:
        sampled = tuple(estimate(skill, 1350.0 + skill * 65.0) for skill in STAGE1_SKILLS)
        stage2 = build_adaptive_plan(environment(), openings(), sampled, 2, opening_count=2)
        self.assertEqual(len(stage2.cells), 26 * 2)
        self.assertEqual({cell.skill for cell in stage2.cells}, set(range(26)))
        all_skills = tuple(estimate(skill, 1350.0 + skill * 65.0) for skill in range(26))
        stage3 = build_adaptive_plan(environment(), openings(), all_skills, 3, opening_count=3)
        self.assertEqual(len(stage3.cells), 26 * 3)
        config = artifact_build_config(stage3)
        self.assertEqual(config.manifest_sha256, stage3.manifest_sha256)
        self.assertEqual(config.search_policy.move_time_ms, 500)
        with self.assertRaisesRegex(ValueError, "unbounded required Skill"):
            build_adaptive_plan(environment(), openings(), all_skills[:-1], 3, opening_count=3)

    def test_unbounded_and_out_of_range_measurements_fail_closed(self) -> None:
        sampled = list(estimate(skill, 1400.0 + skill * 60.0) for skill in STAGE1_SKILLS)
        sampled[0] = replace(sampled[0], counts=(10, 0, 0, 0, 0), score=0.0, elo_delta=None, ci_low=None, ci_high=None, boundary="negative_infinity")
        with self.assertRaisesRegex(ValueError, "unbounded required"):
            build_adaptive_plan(environment(), openings(), tuple(sampled), 2, opening_count=1)
        sampled[0] = estimate(0, 1400.0)
        sampled[1] = replace(sampled[1], reference_id="unknown")
        with self.assertRaisesRegex(ValueError, "inconsistent reference"):
            build_adaptive_plan(environment(), openings(), tuple(sampled), 2, opening_count=1)

    def test_prior_evidence_is_bound_to_manifest_stage_and_environment(self) -> None:
        prior = build_stage1_plan(environment(), openings())
        prior_estimates = tuple(exact_estimate(skill, rating, prior.manifest_sha256, 12) for skill in STAGE1_SKILLS for rating in STOCKFISH_RATINGS)
        validate_prior_evidence(prior, prior_estimates, environment(), 1)
        with self.assertRaisesRegex(ValueError, "do not match"):
            validate_prior_evidence(prior, (replace(prior_estimates[0], manifest_sha256="e" * 64),) + prior_estimates[1:], environment(), 1)
        with self.assertRaisesRegex(ValueError, "environment"):
            validate_prior_evidence(prior, prior_estimates, replace(environment(), hardware_fingerprint="other"), 1)
        with self.assertRaisesRegex(ValueError, "self-digest"):
            validate_prior_evidence(replace(prior, baseline_nps=90000.0), prior_estimates, environment(), 1)
        with self.assertRaisesRegex(ValueError, "pair counts"):
            validate_prior_evidence(prior, (replace(prior_estimates[0], counts=(0, 0, 2, 0, 0), pair_count=2),) + prior_estimates[1:], environment(), 1)
        self.assertEqual(plan_self_digest(prior), prior.manifest_sha256)

    def test_staged_outputs_are_idempotent_and_conflicts_fail_before_writes(self) -> None:
        import tempfile
        from pathlib import Path

        with tempfile.TemporaryDirectory(dir=Path.cwd()) as directory:
            first = Path(directory) / "plan.json"
            second = Path(directory) / "config.json"
            _write_outputs_idempotently(((first, b"plan"), (second, b"config")))
            _write_outputs_idempotently(((first, b"plan"), (second, b"config")))
            third = Path(directory) / "new.json"
            with self.assertRaisesRegex(FileExistsError, "conflicting"):
                _write_outputs_idempotently(((first, b"changed"), (third, b"new")))
            self.assertFalse(third.exists())

    def test_pgn_parser_uses_final_positions_and_rejects_terminal_games(self) -> None:
        parsed = parse_opening_corpus(b"[Event \"one\"]\n\n1. Nf3 Nf6 *\n\n[Event \"two\"]\n\n1. d4 d5 *\n")
        self.assertEqual(len(parsed), 2)
        repeated = parse_opening_corpus(b"[Event \"repeat\"]\n\n1. Nf3 Nf6 2. Ng1 Ng8 3. Nf3 Nf6 4. Ng1 Ng8 *\n")
        self.assertEqual(len(repeated), 1)
        with self.assertRaisesRegex(ValueError, "terminal"):
            parse_opening_corpus(b"[Event \"mate\"]\n\n1. f3 e5 2. g4 Qh4# 0-1\n")


if __name__ == "__main__":
    unittest.main()
