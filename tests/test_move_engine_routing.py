import json
import os
import sys
import unittest
from pathlib import Path

import chess

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
os.environ["THINKER_CAPABILITY_TOKEN"] = "test-capability-token-that-is-long-enough"
import app


class MoveEngineRoutingTests(unittest.TestCase):
    def test_real_move_engines_and_fixed_eval_bar(self):
        self.addCleanup(app.komodo.close)
        self.addCleanup(app.stockfish_eval_bar.close)
        self.addCleanup(app.close_stockfish_move_runtime)
        client = app.app.test_client()
        headers = {"Authorization": f"Bearer {os.environ['THINKER_CAPABILITY_TOKEN']}"}
        board = chess.Board()
        board.push_san("e4")
        payload = {"fen": board.fen(), "elo": 1200}
        self.assertIn(client.post("/getmove", json=payload).status_code, (401, 403))
        for engine_id in ("stockfish-19-1mb", "stockfish-19-94mb", "komodo-14.1", "stockfish-19-1mb"):
            with self.subTest(engine=engine_id):
                response = client.post("/getmove", json={**payload, "engineId": engine_id}, headers=headers)
                self.assertEqual(response.status_code, 200)
                self.assertEqual(response.headers["X-Thinker-Move-Engine"], engine_id)
                self.assertIn(chess.Move.from_uci(response.get_json()[0]), board.legal_moves)
                if engine_id.startswith("stockfish"):
                    self.assertEqual(response.headers["X-Thinker-Effective-Elo"], "1320")
        for engine_id in ("stockfish-19-1mb", "stockfish-19-94mb", "komodo-14.1"):
            with self.subTest(immediate=engine_id):
                request_data = {**payload, "elo": 3200, "engineId": engine_id, "immediate": True}
                response = client.post("/getmove", json=request_data, headers=headers)
                self.assertEqual(response.status_code, 200)
                self.assertEqual(response.headers["X-Thinker-Move-Engine"], engine_id)
                self.assertIn(chess.Move.from_uci(response.get_json()[0]), board.legal_moves)
                self.assertEqual(client.post("/getmove", json=request_data, headers=headers).get_json(),
                                 response.get_json())
        forced = chess.Board("7k/8/5K2/8/8/8/8/7R b - - 0 1")
        self.assertEqual(list(forced.legal_moves), [chess.Move.from_uci("h8g8")])
        response = client.post("/getmove", json={
            "fen": forced.fen(), "engineId": "stockfish-19-94mb", "immediate": True,
        }, headers=headers)
        self.assertEqual(response.get_json(), ["h8g8"])
        self.assertEqual(response.headers["X-Thinker-Move-Engine"], "stockfish-19-94mb")
        response = client.post(
            "/eval-bar/stream",
            json={"fen": board.fen(), "engineId": "stockfish-19-94mb", "context": "analysis"},
            headers=headers,
            buffered=True,
        )
        self.assertEqual(response.status_code, 200)
        result = next(event for event in map(json.loads, response.data.splitlines()) if event["type"] == "result")
        self.assertEqual(result["build"], "sf_19_smallnet")
        self.assertEqual(result["network"], "nn-61e7af4bb97d.nnue")


if __name__ == "__main__":
    unittest.main()
