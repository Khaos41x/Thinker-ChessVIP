import sys
import unittest
from pathlib import Path
from unittest.mock import patch

import chess
import chess.engine

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import app


def line(score, move="e2e4", turn=chess.WHITE):
    return {
        "score": chess.engine.PovScore(score, turn),
        "pv": [chess.Move.from_uci(move)],
        "depth": 10,
    }


class ComplexityTests(unittest.TestCase):
    def test_thresholds(self):
        self.assertEqual(app.calculate_complexity([line(chess.engine.Cp(100)), line(chess.engine.Cp(71), "d2d4")], chess.WHITE), (1.8, False))
        self.assertEqual(app.calculate_complexity([line(chess.engine.Cp(100)), line(chess.engine.Cp(70), "d2d4")], chess.WHITE), (1.0, False))
        self.assertEqual(app.calculate_complexity([line(chess.engine.Cp(300)), line(chess.engine.Cp(50), "d2d4")], chess.WHITE), (1.0, False))
        self.assertEqual(app.calculate_complexity([line(chess.engine.Cp(301)), line(chess.engine.Cp(50), "d2d4")], chess.WHITE), (0.3, False))

    def test_best_mate_is_forced(self):
        self.assertEqual(app.calculate_complexity([line(chess.engine.Mate(2)), line(chess.engine.Cp(500), "d2d4")], chess.WHITE), (0.15, True))

    def test_positional_best_vs_losing_mate_is_easy_not_forced(self):
        lines = [
            line(chess.engine.Cp(200)),
            line(chess.engine.Mate(-2), "d2d4"),
        ]
        self.assertEqual(app.calculate_complexity(lines, chess.WHITE), (0.3, False))

    def test_missing_second_line_is_neutral(self):
        self.assertEqual(app.calculate_complexity([line(chess.engine.Cp(20))], chess.WHITE), (1.0, False))


class AnalyzeEndpointTests(unittest.TestCase):
    def setUp(self):
        self.client = app.app.test_client()

    def test_invalid_fen_does_not_reach_engine(self):
        with patch.object(app.komodo, "analyse") as analyse:
            response = self.client.post("/analyze", json={"fen": "invalid"})
        self.assertEqual(response.status_code, 400)
        analyse.assert_not_called()

    def test_non_object_json_is_rejected(self):
        with patch.object(app.komodo, "analyse") as analyse:
            response = self.client.post("/analyze", json=[chess.STARTING_FEN])
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.get_json(), {"error": "invalid json object"})
        analyse.assert_not_called()

    def test_depth_ten_multipv_contract(self):
        lines = [line(chess.engine.Cp(40)), line(chess.engine.Cp(20), "d2d4")]
        with patch.object(app.komodo, "analyse", return_value=lines) as analyse:
            response = self.client.post("/analyze", json={"fen": chess.STARTING_FEN})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json(), {
            "move": "e2e4",
            "complexityMultiplier": 1.8,
            "isForced": False,
        })
        _, limit = analyse.call_args.args
        self.assertEqual(limit.depth, 10)
        self.assertEqual(analyse.call_args.kwargs, {"multipv": 2, "clear_hash": True})


def tearDownModule():
    app.komodo.close()


if __name__ == "__main__":
    unittest.main()
