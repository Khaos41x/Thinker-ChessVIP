import atexit
import os
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
temporary = tempfile.TemporaryDirectory(prefix="thinker-rating-app-")
os.environ["THINKER_RATING_TRACKER_DB"] = str(Path(temporary.name) / "tracker.db")
os.environ.setdefault("THINKER_CAPABILITY_TOKEN", "rating-tracker-app-regression-test-token")
import app


def cleanup():
    app.rating_tracker.stop()
    app.rating_tracker.repository.close()
    temporary.cleanup()


atexit.register(cleanup)


class AppIntegrationTests(unittest.TestCase):
    def setUp(self):
        self.client = app.app.test_client()

    def test_snapshot_is_independent_of_all_engine_services(self):
        with patch.object(app, "analyse_with_recovery") as analyse, patch.object(app, "play_with_recovery") as play, patch.object(app.stockfish_eval_bar, "evaluate") as evaluate:
            response = self.client.get("/rating-goals/snapshot", headers={"Origin": "https://www.chess.com"})
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.json["schemaVersion"], 1)
            self.assertEqual(response.headers.get("Access-Control-Allow-Origin"), "https://www.chess.com")
            analyse.assert_not_called()
            play.assert_not_called()
            evaluate.assert_not_called()

    def test_global_cors_does_not_reopen_tracker(self):
        for method in ("GET", "OPTIONS"):
            response = self.client.open("/rating-goals/snapshot", method=method, headers={"Origin": "https://attacker.example", "Access-Control-Request-Method": "GET"})
            self.assertEqual(response.status_code, 403)
            self.assertIsNone(response.headers.get("Access-Control-Allow-Origin"))
        response = self.client.get("/rating-goals/snapshot", headers={"Host": "attacker.example"})
        self.assertEqual(response.status_code, 403)

    def test_preflight_allows_only_expected_methods_and_headers(self):
        response = self.client.options("/rating-goals", headers={"Origin": "https://www.chess.com", "Access-Control-Request-Method": "POST", "Access-Control-Request-Headers": "content-type"})
        self.assertIn(response.status_code, (200, 204))
        self.assertEqual(response.headers.get("Access-Control-Allow-Origin"), "https://www.chess.com")
        self.assertNotIn("*", response.headers.get("Access-Control-Allow-Headers", ""))

    def test_config_defaults_and_legacy_routes_remain_available(self):
        response = self.client.get("/config/load", headers={"Origin": "https://www.chess.com"})
        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.json["evalBar"])
        self.assertEqual(response.json["elo"], 3200)
        self.assertEqual(response.headers.get("Access-Control-Allow-Origin"), "https://www.chess.com")
        paths = {rule.rule for rule in app.app.url_map.iter_rules()}
        for route in ("/getmove", "/eval", "/eval-bar", "/eval-bar/stream", "/move-plan", "/record-match"):
            self.assertIn(route, paths)

    def test_unsafe_writes_and_provider_proxy_are_not_available(self):
        for route in ("/rating-goals", "/rating-observations/dom", "/rating-games/terminal"):
            response = self.client.post(route, json={"username": "tester"}, headers={"Origin": "https://attacker.example"})
            self.assertEqual(response.status_code, 403)
            self.assertIsNone(response.headers.get("Access-Control-Allow-Origin"))
        self.assertEqual(self.client.post("/rating-goals", data="{}").status_code, 415)
        self.assertIn(self.client.get("/rating-goals/proxy?url=https://attacker.example").status_code, (404, 405))

    def test_unavailable_database_preserves_client_cache_by_returning_503(self):
        with patch.object(app.rating_tracker, "snapshot", return_value={"unavailable": True, "errors": [{"code": "HISTORY_COULD_NOT_BE_SAVED"}]}):
            response = self.client.get("/rating-goals/snapshot")
        self.assertEqual(response.status_code, 503)
        self.assertTrue(response.json["unavailable"])

    def test_request_limit_applies_without_content_length(self):
        response = self.client.post("/rating-goals", data=b'{"padding":"' + b'a' * 17000 + b'"}', content_type="application/json",
                                    environ_overrides={"CONTENT_LENGTH": "", "wsgi.input_terminated": True})
        self.assertEqual(response.status_code, 413)


if __name__ == "__main__":
    unittest.main()
