import os
import json
import sys
import threading
import time
import unittest
from pathlib import Path
from unittest.mock import patch

import chess

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
TEST_CAPABILITY = "stockfish-eval-bar-test-capability-token"
os.environ["THINKER_CAPABILITY_TOKEN"] = TEST_CAPABILITY
AUTH_HEADERS = {
    "Authorization": f"Bearer {TEST_CAPABILITY}",
    "Origin": "https://www.chess.com",
}

import app
from core.eval_bar import (
    StockfishEvalBarCancelled,
    StockfishEvalBarError,
    StockfishEvalBarService,
    StockfishEvalBarTimeout,
)


class StockfishEvalBarEndpointTests(unittest.TestCase):
    def setUp(self):
        global AUTH_HEADERS
        AUTH_HEADERS = {
            "Authorization": f"Bearer {app.capability_store.ensure()}",
            "Origin": "https://www.chess.com",
        }
        self.client = app.app.test_client()

    def test_endpoint_uses_isolated_stockfish_contract(self):
        result = {
            "cp": -44,
            "mate": None,
            "depth": 16,
            "nodes": 1234,
            "nps": 456789,
            "engine": "Stockfish 19",
            "package": "@lichess-org/stockfish-web@0.5.0",
            "build": "sf_19_smallnet",
            "network": "nn-61e7af4bb97d.nnue",
        }
        payload = {
            "fen": chess.STARTING_FEN,
            "requestId": "eval-v2:8",
            "generation": 3,
            "cacheContext": "smallnet-v1",
            "context": "analysis",
        }
        with patch.object(app.stockfish_eval_bar, "evaluate", return_value=result) as evaluate, patch.object(
            app, "analyse_with_recovery"
        ) as komodo_eval, patch.object(app, "play_with_recovery") as komodo_play:
            response = self.client.post("/eval-bar", json=payload, headers=AUTH_HEADERS)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()["engine"], "Stockfish 19")
        self.assertEqual(response.get_json()["package"], "@lichess-org/stockfish-web@0.5.0")
        self.assertEqual(response.get_json()["requestId"], "eval-v2:8")
        evaluate.assert_called_once_with(chess.STARTING_FEN, "eval-v2:8")
        komodo_eval.assert_not_called()
        komodo_play.assert_not_called()

    def test_endpoint_accepts_declared_contexts_and_rejects_terminal_position(self):
        result = {"cp": 0, "mate": None, "depth": 1}
        with patch.object(app.stockfish_eval_bar, "evaluate", return_value=result):
            live = self.client.post(
                "/eval-bar",
                json={"fen": chess.STARTING_FEN, "context": "active-game", "requestId": "live-game"},
                headers=AUTH_HEADERS,
            )
        self.assertEqual(live.status_code, 200)
        self.assertEqual(live.get_json()["cp"], 0)
        anonymous = self.client.post(
            "/eval-bar",
            json={"fen": chess.STARTING_FEN, "requestId": "no-context"},
            headers=AUTH_HEADERS,
        )
        self.assertEqual(anonymous.status_code, 200)
        terminal = self.client.post(
            "/eval-bar",
            json={"fen": "7k/5Q2/6K1/8/8/8/8/8 b - - 0 1", "context": "analysis"},
            headers=AUTH_HEADERS,
        )
        self.assertEqual(terminal.status_code, 422)

    def test_eval_bar_endpoints_require_engine_capability(self):
        evaluate = self.client.post(
            "/eval-bar", json={"fen": chess.STARTING_FEN, "context": "analysis"}
        )
        cancel = self.client.post("/eval-bar/cancel", json={"requestId": "blocked"})
        status = self.client.get("/eval-bar/status")
        self.assertEqual(evaluate.status_code, 401)
        self.assertEqual(cancel.status_code, 401)
        self.assertEqual(status.status_code, 401)

    def test_cancel_endpoint_targets_only_smallnet(self):
        with patch.object(app.stockfish_eval_bar, "cancel", return_value=True) as cancel, patch.object(
            app.komodo, "close"
        ) as komodo_close:
            response = self.client.post(
                "/eval-bar/cancel", json={"requestId": "eval-v2:9"}, headers=AUTH_HEADERS
            )
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.get_json()["cancelRequested"])
        cancel.assert_called_once_with("eval-v2:9")
        komodo_close.assert_not_called()

    def test_endpoint_returns_generated_request_id(self):
        with patch.object(app.stockfish_eval_bar, "evaluate", return_value={"cp": 0, "mate": None}):
            response = self.client.post(
                "/eval-bar",
                json={"fen": chess.STARTING_FEN, "context": "analysis"},
                headers=AUTH_HEADERS,
            )
        self.assertEqual(response.status_code, 200)
        self.assertRegex(response.get_json()["requestId"], r"^eval-bar:\d+$")

    def test_stream_endpoint_emits_correlated_progress_before_result(self):
        payload = {
            "fen": chess.STARTING_FEN,
            "requestId": "eval-v2:stream",
            "generation": 7,
            "cacheContext": "smallnet-stream-v1",
            "context": "analysis",
        }
        messages = iter([
            {"type": "started", "seq": 0, "attempt": 1, "engineGeneration": 4},
            {"type": "info", "seq": 1, "result": {"cp": 12, "mate": None, "depth": 6}},
            {"type": "info", "seq": 2, "result": {"cp": 21, "mate": None, "depth": 10}},
            {"type": "result", "seq": 3, "result": {
                "cp": 18,
                "mate": None,
                "depth": 12,
                "requestId": "malformed-override",
                "fen": "malformed-override",
                "type": "error",
            }},
        ])
        with patch.object(app.stockfish_eval_bar, "evaluate_stream", return_value=messages), patch.object(
            app, "analyse_with_recovery"
        ) as komodo_eval:
            response = self.client.post("/eval-bar/stream", json=payload, headers=AUTH_HEADERS)
        events = [json.loads(line) for line in response.get_data(as_text=True).splitlines()]
        self.assertEqual(response.mimetype, "application/x-ndjson")
        self.assertEqual(response.headers["X-Accel-Buffering"], "no")
        self.assertEqual([event["type"] for event in events], ["started", "info", "info", "result"])
        self.assertEqual([event.get("depth") for event in events[1:]], [6, 10, 12])
        self.assertTrue(all(event["requestId"] == payload["requestId"] for event in events))
        self.assertTrue(all(event["generation"] == 7 for event in events))
        self.assertTrue(all(event["fen"] == chess.STARTING_FEN for event in events))
        self.assertTrue(all(event["perspective"] == "white" for event in events))
        komodo_eval.assert_not_called()

    def test_stream_protocol_failure_emits_terminal_error_event(self):
        with patch.object(app.stockfish_eval_bar, "evaluate_stream", return_value=iter([
            {"type": "info", "seq": "not-a-number", "result": {"cp": 0, "mate": None, "depth": 1}},
        ])):
            response = self.client.post(
                "/eval-bar/stream",
                json={
                    "fen": chess.STARTING_FEN,
                    "requestId": "bad-protocol",
                    "generation": 1,
                    "cacheContext": "bad-protocol",
                    "context": "analysis",
                },
                headers=AUTH_HEADERS,
            )
        event = json.loads(response.get_data(as_text=True))
        self.assertEqual(event["type"], "error")
        self.assertEqual(event["status"], "error")
        self.assertEqual(event["requestId"], "bad-protocol")

    def test_closing_stream_cancels_only_its_smallnet_request(self):
        def messages():
            yield {"type": "started", "seq": 0, "attempt": 1, "engineGeneration": 1}
            yield {"type": "info", "seq": 1, "result": {"cp": 1, "mate": None, "depth": 1}}

        with patch.object(app.stockfish_eval_bar, "evaluate_stream", return_value=messages()), patch.object(
            app.stockfish_eval_bar, "cancel", return_value=True
        ) as cancel, patch.object(app.komodo, "close") as komodo_close:
            response = self.client.post(
                "/eval-bar/stream",
                json={
                    "fen": chess.STARTING_FEN,
                    "requestId": "disconnect-me",
                    "generation": 1,
                    "cacheContext": "stream-close",
                    "context": "analysis",
                },
                headers=AUTH_HEADERS,
                buffered=False,
            )
            next(iter(response.response))
            response.close()
        cancel.assert_called_once_with("disconnect-me")
        komodo_close.assert_not_called()

    def test_collection_analysis_context_is_accepted_by_stream_contract(self):
        with patch.object(app.stockfish_eval_bar, "evaluate_stream", return_value=iter([
            {"type": "result", "seq": 1, "result": {"cp": 0, "mate": None, "depth": 1}},
        ])):
            response = self.client.post(
                "/eval-bar/stream",
                json={
                    "fen": chess.STARTING_FEN,
                    "requestId": "collection-analysis",
                    "generation": 1,
                    "cacheContext": "collection-analysis?move=18",
                    "context": "analysis",
                },
                headers=AUTH_HEADERS,
            )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(json.loads(response.get_data(as_text=True))["type"], "result")

    def test_missing_node_is_reported_as_stockfish_error(self):
        service = StockfishEvalBarService(node_path="definitely-missing-node", timeout_seconds=1)
        try:
            with self.assertRaisesRegex(StockfishEvalBarError, "failed to start"):
                service.start()
        finally:
            service.close()

    def test_legacy_eval_contract_remains_komodo_backed(self):
        info = {
            "score": chess.engine.PovScore(chess.engine.Cp(31), chess.WHITE),
            "depth": 7,
        }
        with patch.object(app, "analyse_with_recovery", return_value=[info]) as komodo_eval, patch.object(
            app.stockfish_eval_bar, "evaluate"
        ) as smallnet:
            response = self.client.post("/eval", json={"fen": chess.STARTING_FEN}, headers=AUTH_HEADERS)
        self.assertEqual(response.get_json(), {"cp": 31, "mate": None, "depth": 7})
        komodo_eval.assert_called_once()
        smallnet.assert_not_called()


class StockfishEvalBarRealEngineTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.service = StockfishEvalBarService(timeout_seconds=20)

    @classmethod
    def tearDownClass(cls):
        cls.service.close()

    def test_real_smallnet_identity_network_and_white_pov(self):
        result = self.service.evaluate(chess.STARTING_FEN, "real-identity", movetime_ms=250, timeout_seconds=20)
        self.assertEqual(result["engine"], "Stockfish 19")
        self.assertEqual(result["package"], "@lichess-org/stockfish-web@0.5.0")
        self.assertEqual(result["build"], "sf_19_smallnet")
        self.assertEqual(result["network"], "nn-61e7af4bb97d.nnue")
        self.assertEqual(
            result["networkSha256"],
            "61e7af4bb97d51eeeb25d322916f86513b5cd3a827ce189c98c6e31946f99e5b",
        )
        self.assertEqual(result["profile"], {
            "threads": 3,
            "hash": 16,
            "multiPv": 1,
            "analyseMode": True,
            "movetime": 8000,
        })
        self.assertIsInstance(result["cp"], int)
        self.assertIsNone(result["mate"])
        self.assertGreater(result["depth"], 0)
        self.assertGreater(result["nps"], 0)

        black_fen = "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 2"
        black = self.service.evaluate(black_fen, "real-black", movetime_ms=250, timeout_seconds=20)
        self.assertIsInstance(black["cp"], int)
        self.assertIsNone(black["mate"])

    def test_real_latest_request_cancels_obsolete_search(self):
        self.service.start(timeout_seconds=20)
        outcomes = {}

        def first_search():
            try:
                outcomes["first"] = self.service.evaluate(
                    chess.STARTING_FEN, "obsolete", movetime_ms=5000, timeout_seconds=20
                )
            except Exception as error:
                outcomes["first"] = error

        first = threading.Thread(target=first_search)
        first.start()
        deadline = time.monotonic() + 5
        while time.monotonic() < deadline:
            with self.service._lock:
                if "obsolete" in self.service._pending:
                    break
            time.sleep(0.01)
        else:
            self.fail("obsolete search did not start")
        time.sleep(0.05)
        newest = self.service.evaluate(
            "r1bqkbnr/pppp1ppp/2n5/4p3/4P3/2N5/PPPP1PPP/R1BQKBNR w KQkq - 2 3",
            "newest",
            movetime_ms=250,
            timeout_seconds=20,
        )
        first.join(timeout=5)
        self.assertFalse(first.is_alive())
        self.assertIsInstance(outcomes.get("first"), StockfishEvalBarCancelled)
        self.assertGreater(newest["depth"], 0)

    def test_real_positive_negative_and_mate_scores_are_white_pov(self):
        positive = self.service.evaluate(
            "8/5pk1/6p1/3p4/3P4/5P2/5KPP/8 w - - 0 35",
            "positive",
            movetime_ms=150,
            timeout_seconds=20,
        )
        negative = self.service.evaluate(
            "4k3/4q3/8/8/8/8/8/4K3 w - - 0 1",
            "negative",
            movetime_ms=150,
            timeout_seconds=20,
        )
        mate_positive = self.service.evaluate(
            "7k/5Q2/6K1/8/8/8/8/8 w - - 0 1",
            "mate-positive",
            movetime_ms=150,
            timeout_seconds=20,
        )
        mate_negative = self.service.evaluate(
            "7K/5q2/6k1/8/8/8/8/8 b - - 0 1",
            "mate-negative",
            movetime_ms=150,
            timeout_seconds=20,
        )
        self.assertGreater(positive["mate"] if positive["mate"] is not None else positive["cp"], 0)
        self.assertLess(negative["mate"] if negative["mate"] is not None else negative["cp"], 0)
        self.assertGreater(mate_positive["mate"], 0)
        self.assertLess(mate_negative["mate"], 0)

    def test_real_process_restart(self):
        self.service.evaluate(chess.STARTING_FEN, "before-restart", movetime_ms=100, timeout_seconds=20)
        previous_generation = self.service.generation
        process = self.service._process
        process.kill()
        process.wait(timeout=5)
        recovered = self.service.evaluate(chess.STARTING_FEN, "after-restart", movetime_ms=100, timeout_seconds=20)
        self.assertGreater(self.service.generation, previous_generation)
        self.assertGreater(recovered["depth"], 0)

    def test_real_stream_publishes_multiple_depths_before_bestmove(self):
        started = time.monotonic()
        timeline = []
        for event in self.service.evaluate_stream(
            chess.STARTING_FEN, "real-progressive", movetime_ms=1200, timeout_seconds=20
        ):
            timeline.append((time.monotonic() - started, event))
        infos = [(elapsed, event) for elapsed, event in timeline if event["type"] == "info"]
        result_time, result = next((elapsed, event) for elapsed, event in timeline if event["type"] == "result")
        self.assertGreaterEqual(len(infos), 2)
        self.assertLess(infos[0][0], result_time)
        self.assertGreater(infos[-1][1]["result"]["depth"], infos[0][1]["result"]["depth"])
        self.assertEqual(result["result"]["engine"], "Stockfish 19")
        self.assertEqual(result["result"]["build"], "sf_19_smallnet")
        self.assertEqual(result["result"]["network"], "nn-61e7af4bb97d.nnue")

    def test_real_stream_timeout_restarts_and_recovers(self):
        self.service.start(timeout_seconds=20)
        generation = self.service.generation
        with self.assertRaises(StockfishEvalBarTimeout):
            list(self.service.evaluate_stream(
                chess.STARTING_FEN, "stream-timeout", movetime_ms=5000, timeout_seconds=0.05
            ))
        recovered = self.service.evaluate(
            chess.STARTING_FEN, "after-stream-timeout", movetime_ms=100, timeout_seconds=20
        )
        self.assertGreater(self.service.generation, generation)
        self.assertGreater(recovered["depth"], 0)

    def test_real_inflight_process_failure_retries_once_without_duplicate_process(self):
        self.service.start(timeout_seconds=20)
        previous_generation = self.service.generation
        outcome = {}

        def evaluate():
            try:
                outcome["result"] = self.service.evaluate(
                    chess.STARTING_FEN, "inflight-restart", movetime_ms=250, timeout_seconds=20
                )
            except Exception as error:
                outcome["error"] = error

        worker = threading.Thread(target=evaluate)
        worker.start()
        deadline = time.monotonic() + 5
        while time.monotonic() < deadline:
            with self.service._lock:
                if "inflight-restart" in self.service._pending:
                    break
            time.sleep(0.01)
        else:
            self.fail("in-flight search did not start")
        time.sleep(0.05)
        process = self.service._process
        process.kill()
        process.wait(timeout=5)
        worker.join(timeout=20)
        self.assertFalse(worker.is_alive())
        self.assertNotIn("error", outcome)
        self.assertGreater(outcome["result"]["depth"], 0)
        self.assertEqual(self.service.generation, previous_generation + 1)
        stable_pid = self.service.pid
        self.service.evaluate(chess.STARTING_FEN, "same-process", movetime_ms=50, timeout_seconds=20)
        self.assertEqual(self.service.pid, stable_pid)


def tearDownModule():
    app.stockfish_eval_bar.close()
    app.komodo.close()


if __name__ == "__main__":
    unittest.main()
