import os
import sys
import threading
import time
import unittest
from pathlib import Path

import chess
import psutil

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import app


class LiveAnalysisTests(unittest.TestCase):
    def setUp(self):
        self.client = app.app.test_client()

    def test_real_endpoints_and_memory_budget(self):
        python_process = psutil.Process(os.getpid())
        engine_pid = app.komodo.process_pid
        self.assertIsNotNone(engine_pid)
        engine_process = psutil.Process(engine_pid)
        stop_sampling = threading.Event()
        first_sample = threading.Event()
        peak_rss = [0]

        def sample_memory():
            while not stop_sampling.is_set():
                total = (
                    python_process.memory_info().rss
                    + engine_process.memory_info().rss
                )
                peak_rss[0] = max(peak_rss[0], total)
                first_sample.set()
                time.sleep(0.002)

        sampler = threading.Thread(target=sample_memory, daemon=True)
        sampler.start()
        self.assertTrue(first_sample.wait(timeout=1))
        analyze = self.client.post("/analyze", json={"fen": chess.STARTING_FEN})
        stop_sampling.set()
        sampler.join(timeout=1)
        self.assertEqual(analyze.status_code, 200)
        self.assertEqual(
            set(analyze.get_json()),
            {"move", "complexityMultiplier", "isForced"},
        )

        getmove = self.client.post(
            "/getmove",
            json={"fen": chess.STARTING_FEN, "elo": 2400, "time": 0.05},
        )
        self.assertEqual(getmove.status_code, 200)
        self.assertIsInstance(getmove.get_json(), list)
        self.assertEqual(len(getmove.get_json()), 1)

        evaluate = self.client.post("/eval", json={"fen": chess.STARTING_FEN})
        self.assertEqual(evaluate.status_code, 200)
        self.assertIn("cp", evaluate.get_json())
        self.assertIn("mate", evaluate.get_json())

        total_rss = (
            python_process.memory_info().rss
            + engine_process.memory_info().rss
        )
        total_mib = total_rss / (1024 * 1024)
        peak_mib = peak_rss[0] / (1024 * 1024)

        matching_engines = []
        target = Path(app.ENGINE_PATH).resolve()
        for process in psutil.process_iter(["pid", "exe"]):
            try:
                if process.info["exe"] and Path(process.info["exe"]).resolve() == target:
                    matching_engines.append(process.pid)
            except (psutil.NoSuchProcess, psutil.AccessDenied, OSError):
                continue

        print(f"ANALYZE_JSON={analyze.get_json()}")
        print(f"GETMOVE_JSON={getmove.get_json()}")
        print(f"EVAL_JSON={evaluate.get_json()}")
        print(f"PYTHON_RSS_MIB={python_process.memory_info().rss / (1024 * 1024):.2f}")
        print(f"KOMODO_RSS_MIB={engine_process.memory_info().rss / (1024 * 1024):.2f}")
        print(f"AGGREGATE_RSS_MIB={total_mib:.2f}")
        print(f"ANALYZE_PEAK_RSS_MIB={peak_mib:.2f}")
        print(f"KOMODO_PIDS={matching_engines}")

        self.assertEqual(matching_engines, [engine_pid])
        self.assertLess(total_mib, 250)
        self.assertLess(peak_mib, 250)


def tearDownModule():
    app.komodo.close()


if __name__ == "__main__":
    unittest.main()
