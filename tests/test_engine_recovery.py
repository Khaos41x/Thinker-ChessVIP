import os
import sys
import threading
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import Mock, patch

import chess
import chess.engine

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
TEST_CAPABILITY = "test-capability-token-that-is-long-enough"
os.environ["THINKER_CAPABILITY_TOKEN"] = TEST_CAPABILITY
AUTH_HEADERS = {"Authorization": f"Bearer {TEST_CAPABILITY}"}
import app


class EngineRecoveryTests(unittest.TestCase):
    def test_getmove_v2_uses_calibrated_skill_and_budget(self):
        calibrator = Mock()
        calibrator.artifact.payload = SimpleNamespace(
            anchors=(SimpleNamespace(rating=780.4), SimpleNamespace(rating=3060.9)),
            scale=SimpleNamespace(scale_id="scale-v2"),
            search_policy=SimpleNamespace(budget_class="calibration-500ms-v1"),
        )
        calibrator.interpolate_uci_params.return_value = SimpleNamespace(
            applied_skill=17,
            move_time_ms=500,
        )
        with patch.object(app.calibration_runtime, "mode", app.CalibrationMode.ACTIVE), patch.object(
            app.calibration_runtime, "calibrator", calibrator
        ):
            skill, seconds = app.resolve_getmove_engine_parameters(
                3200, 0.01, chess.Board(), "game-v2"
            )
        self.assertEqual((skill, seconds), (17, 0.5))
        calibration_request = calibrator.interpolate_uci_params.call_args.args[0]
        self.assertEqual(calibration_request.target_elo, 3060)
        self.assertEqual(calibration_request.runtime_game_token, "game-v2")
        self.assertEqual(calibration_request.side, app.Side.WHITE)

    def test_getmove_without_v2_uses_legacy_skill_and_500ms_ceiling(self):
        with patch.object(app.calibration_runtime, "calibrator", None):
            skill, default_seconds = app.resolve_getmove_engine_parameters(
                2300, 0, chess.Board()
            )
            _, capped_seconds = app.resolve_getmove_engine_parameters(
                2300, 4.0, chess.Board()
            )
        self.assertEqual(skill, app.engine_adapter.legacy_skill_for_elo(2300))
        self.assertEqual(default_seconds, 0.5)
        self.assertEqual(capped_seconds, 0.5)

    def test_getmove_keeps_legacy_response_shape_with_v2_parameters(self):
        board = chess.Board()
        cache_key = f"{app.get_base_fen(board.fen())}_2300"
        app.cache.pop(cache_key, None)
        try:
            with patch.object(app, "get_book", return_value=None), patch.object(
                app, "resolve_getmove_engine_parameters", return_value=(17, 0.5)
            ) as resolve, patch.object(
                app, "play_with_recovery", return_value=chess.Move.from_uci("e2e4")
            ) as play:
                response = app.app.test_client().post(
                    "/getMove",
                    json={"fen": board.fen(), "elo": 2300, "time": 0.01},
                    headers=AUTH_HEADERS,
                )
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.get_json(), ["e2e4"])
            resolve.assert_called_once()
            self.assertEqual(play.call_args.args[1], 17)
            self.assertEqual(play.call_args.args[2].time, 0.5)
        finally:
            app.cache.pop(cache_key, None)

    def test_eval_recovers_dead_engine(self):
        dead = Mock()
        dead.analyse.side_effect = chess.engine.EngineTerminatedError("engine event loop dead")
        replacement = Mock()
        replacement.configure.return_value = None
        replacement.analyse.return_value = {
            "score": chess.engine.PovScore(chess.engine.Cp(34), chess.WHITE),
            "depth": 6,
        }
        with patch.object(app.komodo, "_engine", dead), patch.object(
            app.chess.engine.SimpleEngine, "popen_uci", return_value=replacement
        ) as create:
            response = app.app.test_client().post(
                "/eval", json={"fen": chess.STARTING_FEN}, headers=AUTH_HEADERS
            )
            self.assertEqual(response.get_json(), {"cp": 34, "mate": None, "depth": 6})
            create.assert_called_once_with(app.komodo.executable_path, timeout=10.0)
            dead.close.assert_called_once()

    def test_illegal_fen_never_reaches_native_engine_or_cache(self):
        illegal_fen = "bqp5/8/NKR5/8/8/8/8/8 w - - 0 1"
        with patch.object(app, "play_with_recovery") as play:
            response = app.app.test_client().post(
                "/getmove", json={"fen": illegal_fen, "elo": 2400, "time": 0}, headers=AUTH_HEADERS
            )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json(), [])
        play.assert_not_called()

    def test_dead_engine_is_replaced_and_request_retried(self):
        board = chess.Board()
        dead = Mock()
        dead.play.side_effect = chess.engine.EngineTerminatedError("engine event loop dead")
        replacement = Mock()
        replacement.play.return_value.move = chess.Move.from_uci("e2e4")
        with patch.object(app.komodo, "_engine", dead), patch.object(
            app.chess.engine.SimpleEngine, "popen_uci", return_value=replacement
        ) as create:
            move = app.play_with_recovery(board, 20, chess.engine.Limit(time=0.02))
            self.assertEqual(move.uci(), "e2e4")
            self.assertIs(app.komodo._engine, replacement)
            create.assert_called_once_with(app.komodo.executable_path, timeout=10.0)
            dead.close.assert_called_once()

    def test_cached_move_is_checked_against_current_legal_moves(self):
        board = chess.Board()
        board.push_san("e4")
        board.push_san("e5")
        key = f"{app.get_base_fen(board.fen())}_2400"
        app.cache[key] = "a1a8"
        try:
            with patch.object(app, "stop_ponder"), patch.object(app, "get_book", return_value=None), patch.object(app, "play_with_recovery", return_value=None):
                response = app.app.test_client().post(
                    "/getmove", json={"fen": board.fen(), "elo": 2400, "time": 0}, headers=AUTH_HEADERS
                )
            self.assertEqual(response.get_json(), [])
            self.assertNotIn(key, app.cache)
        finally:
            app.cache.pop(key, None)

    def test_repeated_failure_returns_no_move_instead_of_poisoning_next_request(self):
        board = chess.Board()
        dead = Mock()
        dead.play.side_effect = chess.engine.EngineTerminatedError("process died")
        replacement = Mock()
        replacement.play.side_effect = RuntimeError("engine event loop dead")
        healthy = Mock()
        healthy.play.return_value.move = chess.Move.from_uci("d2d4")
        with patch.object(app.komodo, "_engine", dead), patch.object(
            app.chess.engine.SimpleEngine, "popen_uci", side_effect=[replacement, healthy]
        ):
            self.assertIsNone(app.play_with_recovery(board, 20, chess.engine.Limit(time=0.02)))
            self.assertIs(app.komodo._engine, healthy)
            self.assertEqual(app.play_with_recovery(board, 20, chess.engine.Limit(time=0.02)).uci(), "d2d4")

    def test_overlapping_requests_cannot_interleave_ponder_lifecycle(self):
        board = chess.Board()
        board.push_san("e4")
        board.push_san("e5")
        first_entered = threading.Event()
        second_entered = threading.Event()
        release_first = threading.Event()
        calls = []
        results = []

        def controlled_play(*_args, **_kwargs):
            calls.append(threading.current_thread().name)
            if len(calls) == 1:
                first_entered.set()
                release_first.wait(timeout=2)
            else:
                second_entered.set()
            return None

        def send_request():
            response = app.app.test_client().post(
                "/getmove", json={"fen": board.fen(), "elo": 2400, "time": 0}, headers=AUTH_HEADERS
            )
            results.append((response.status_code, response.get_json()))

        cache_key = f"{app.get_base_fen(board.fen())}_2400"
        app.cache.pop(cache_key, None)
        with patch.object(app, "get_book", return_value=None), patch.object(
            app.komodo, "play", side_effect=controlled_play
        ):
            first = threading.Thread(target=send_request, name="first")
            second = threading.Thread(target=send_request, name="second")
            first.start()
            try:
                self.assertTrue(first_entered.wait(timeout=2))
                second.start()
                self.assertFalse(second_entered.wait(timeout=0.2))
            finally:
                release_first.set()
                first.join(timeout=2)
                if second.ident is not None:
                    second.join(timeout=2)
        self.assertFalse(first.is_alive())
        self.assertFalse(second.is_alive())
        self.assertEqual(sorted(results), [(200, []), (200, [])])
        self.assertEqual(len(calls), 2)

    def test_invalid_book_uci_falls_through_to_engine(self):
        board = chess.Board()
        with patch.object(app, "stop_ponder"), patch.object(app, "get_book", return_value="not-a-move"), patch.object(app, "play_with_recovery", return_value=None) as play:
            response = app.app.test_client().post(
                "/getmove", json={"fen": board.fen(), "elo": 2400, "time": 0}, headers=AUTH_HEADERS
            )
        self.assertEqual(response.get_json(), [])
        play.assert_called_once()


def tearDownModule():
    app.komodo.close()


if __name__ == "__main__":
    unittest.main()
