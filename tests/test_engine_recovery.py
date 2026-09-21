import sys
import threading
import unittest
from pathlib import Path
from unittest.mock import Mock, patch

import chess
import chess.engine

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import app


class EngineRecoveryTests(unittest.TestCase):
    def test_eval_recovers_dead_ponder_engine(self):
        dead = Mock()
        dead.analyse.side_effect = chess.engine.EngineTerminatedError("engine event loop dead")
        replacement = Mock()
        replacement.analyse.return_value = {
            "score": chess.engine.PovScore(chess.engine.Cp(34), chess.WHITE),
            "depth": 6,
        }
        with patch.object(app, "ponder_engine", dead), patch.object(app, "create_engine", return_value=replacement) as create, patch.object(app, "stop_ponder"):
            response = app.app.test_client().post("/eval", json={"fen": chess.STARTING_FEN})
            self.assertEqual(response.get_json(), {"cp": 34, "mate": None, "depth": 6})
            create.assert_called_once_with(True)
            dead.close.assert_called_once()

    def test_illegal_fen_never_reaches_native_engine_or_cache(self):
        illegal_fen = "bqp5/8/NKR5/8/8/8/8/8 w - - 0 1"
        with patch.object(app, "play_with_recovery") as play:
            response = app.app.test_client().post(
                "/getmove", json={"fen": illegal_fen, "elo": 2400, "time": 0}
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
        with patch.object(app, "engine", dead), patch.object(app, "create_engine", return_value=replacement) as create:
            move = app.play_with_recovery(board, 20, chess.engine.Limit(time=0.02))
            self.assertEqual(move.uci(), "e2e4")
            self.assertIs(app.engine, replacement)
            create.assert_called_once_with(False)
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
                    "/getmove", json={"fen": board.fen(), "elo": 2400, "time": 0}
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
        with patch.object(app, "engine", dead), patch.object(app, "create_engine", side_effect=[replacement, healthy]):
            self.assertIsNone(app.play_with_recovery(board, 20, chess.engine.Limit(time=0.02)))
            self.assertIs(app.engine, healthy)
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

        def controlled_stop():
            calls.append(threading.current_thread().name)
            if len(calls) == 1:
                first_entered.set()
                release_first.wait(timeout=2)
            else:
                second_entered.set()

        def send_request():
            response = app.app.test_client().post(
                "/getmove", json={"fen": board.fen(), "elo": 2400, "time": 0}
            )
            results.append((response.status_code, response.get_json()))

        with patch.object(app, "stop_ponder", side_effect=controlled_stop), patch.object(app, "get_book", return_value=None), patch.object(app, "play_with_recovery", return_value=None):
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
                "/getmove", json={"fen": board.fen(), "elo": 2400, "time": 0}
            )
        self.assertEqual(response.get_json(), [])
        play.assert_called_once()


def tearDownModule():
    app.stop_ponder()
    app.engine.close()
    app.ponder_engine.close()


if __name__ == "__main__":
    unittest.main()
