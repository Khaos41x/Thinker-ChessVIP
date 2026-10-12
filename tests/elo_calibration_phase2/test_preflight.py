from __future__ import annotations

import threading
import unittest

from tools.elo_calibration.preflight import ProbeSpec, run_preflight
from tools.elo_calibration.run_matches import EngineMove


SUBJECT_OPTIONS = (("Threads", 1), ("Hash", 128), ("MultiPV", 1), ("Ponder", False), ("OwnBook", False), ("Use Syzygy", False), ("Skill", 25))
REFERENCE_OPTIONS = (("Threads", 1), ("Hash", 128), ("MultiPV", 1), ("Ponder", False), ("UCI_LimitStrength", True), ("UCI_Elo", 2100))


class ProbeAdapter:
    lock = threading.Lock()
    active = 0
    peak = 0
    alive = 0
    peak_alive = 0

    def __init__(self, name: str, nodes: int = 1000) -> None:
        self.name = name
        self.nodes = nodes
        with self.lock:
            type(self).alive += 1
            type(self).peak_alive = max(type(self).peak_alive, type(self).alive)

    def identity(self): return {"name": self.name, "author": "test"}
    def configure(self, options): self.options = options
    def new_game(self): pass
    def clear_hash(self): pass
    def ready(self): pass
    def play(self, board, move_time_ms):
        with self.lock:
            type(self).active += 1
            type(self).peak = max(type(self).peak, type(self).active)
        try:
            threading.Event().wait(0.01)
            return EngineMove("a2a3", self.nodes, 0.01)
        finally:
            with self.lock:
                type(self).active -= 1
    def close(self):
        with self.lock:
            type(self).alive -= 1


class PreflightTests(unittest.TestCase):
    def setUp(self) -> None:
        ProbeAdapter.active = 0
        ProbeAdapter.peak = 0
        ProbeAdapter.alive = 0
        ProbeAdapter.peak_alive = 0
        self.subject = ProbeSpec("subject", "Fake Komodo", "a" * 64, SUBJECT_OPTIONS)
        self.reference = ProbeSpec("reference", "Fake Stockfish", "b" * 64, REFERENCE_OPTIONS)

    def test_report_contains_hashes_samples_drift_and_safe_recommendation(self) -> None:
        report = run_preflight(lambda: ProbeAdapter("Fake Komodo"), lambda: ProbeAdapter("Fake Stockfish"), self.subject, self.reference, loaded_workers=4, samples_per_worker=1)
        self.assertEqual(report["verdict"], "pass")
        self.assertEqual(report["safeWorkerRecommendation"], 4)
        self.assertEqual(report["engines"]["subject"]["binarySha256"], "a" * 64)
        self.assertEqual(report["engines"]["subject"]["loadedNpsPooled"], 100000.0)
        self.assertEqual(len(report["engines"]["reference"]["loadedNps"]), 4)
        self.assertGreaterEqual(ProbeAdapter.peak, 4)
        self.assertGreaterEqual(ProbeAdapter.peak_alive, 8)

    def test_contention_failure_recommends_one_worker(self) -> None:
        class Factory:
            def __init__(self): self.count = 0
            def __call__(self):
                self.count += 1
                return ProbeAdapter("Fake Komodo" if self is subject_factory else "Fake Stockfish", 1000 if self.count == 1 else 500)
        subject_factory = Factory()
        reference_factory = Factory()
        report = run_preflight(subject_factory, reference_factory, self.subject, self.reference, loaded_workers=4, samples_per_worker=1, maximum_drift_fraction=0.2)
        self.assertEqual(report["verdict"], "fail")
        self.assertEqual(report["safeWorkerRecommendation"], 1)

    def test_profile_rejects_more_than_one_thread(self) -> None:
        invalid = ProbeSpec("subject", "bad", "a" * 64, (("Threads", 2), ("Hash", 128), ("MultiPV", 1), ("Ponder", False)))
        with self.assertRaisesRegex(ValueError, "frozen engine profile"):
            run_preflight(lambda: ProbeAdapter("bad"), lambda: ProbeAdapter("Fake Stockfish"), invalid, self.reference)

    def test_identity_must_match_exactly(self) -> None:
        with self.assertRaisesRegex(ValueError, "exactly match"):
            run_preflight(lambda: ProbeAdapter("Fake Komodo 14.1"), lambda: ProbeAdapter("Fake Stockfish"), self.subject, self.reference, samples_per_worker=1)


if __name__ == "__main__":
    unittest.main()
