import io
import json
import sys
import tempfile
import threading
import unittest
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from flask import Flask
from core.rating_tracker.contracts import RatingObservation, TrackerError, game_key, username
from core.rating_tracker.goals import evaluate
from core.rating_tracker.public_client import PublicDataClient, PublicResponse, SafeRedirect
from core.rating_tracker.reconcile import reconcile
from core.rating_tracker.repository import Repository
from core.rating_tracker.routes import create_rating_tracker_blueprint
from core.rating_tracker.service import RatingTrackerService


class Clock:
    def __init__(self):
        self.now = 1792784919000

    def __call__(self):
        return self.now


class FakePublicClient:
    def __init__(self, clock):
        self.clock = clock
        self.rating = 1900
        self.effective = clock.now - 10000
        self.games = []
        self.calls = []
        self.failure = None

    def request(self, name, kind="stats", year=None, month=None):
        self.calls.append((name, kind, year, month))
        if self.failure and kind == "stats":
            raise self.failure
        body = {"username": name, "player_id": 41} if kind == "profile" else {"chess_blitz": {"last": {"rating": self.rating, "date": self.effective // 1000}}} if kind == "stats" else {"games": self.games}
        return PublicResponse(body, self.clock(), self.clock() + 60000, 200, f"https://api.chess.com/pub/player/{name}/{kind}/{year}/{month}", "digest")


def observation(rating=1900, effective=1000, source="pubapi-stats", game=None, now=2000):
    return RatingObservation("chesscom:player:41", "alice", "blitz", rating, source, now, effective, "fixture", game, str(rating)).to_dict()


class ContractTests(unittest.TestCase):
    def test_normalization_and_category(self):
        self.assertEqual(username(" ALICE "), "alice")
        for bad in ("", "a/b", "https://alice", None):
            with self.assertRaises(TrackerError):
                username(bad)

    def test_rating_never_hidden_zero(self):
        for value in (None, "", "1900", -1, True, 100001):
            with self.assertRaises(TrackerError):
                observation(value)
        self.assertEqual(observation(0)["rating"], 0)

    def test_game_aliases_namespaced(self):
        for url in ("https://www.chess.com/game/live/123", "https://www.chess.com/live/game/123"):
            self.assertEqual(game_key(url), "chesscom:live:123")
        self.assertEqual(game_key("https://www.chess.com/game/123?move=3"), "chesscom:unknown:123")
        self.assertEqual(game_key("https://www.chess.com/game/123", "daily"), "chesscom:daily:123")
        with self.assertRaises(TrackerError):
            game_key("https://evil.test/game/123")

    def test_evidence_id_excludes_receipt_generation(self):
        first = observation(now=2000)
        second = observation(now=3000)
        self.assertEqual(first["observationId"], second["observationId"])
        self.assertNotEqual(first["observationId"], observation(effective=1001)["observationId"])

    def test_schema_matches_categories(self):
        schema = json.loads((Path(__file__).resolve().parents[1] / "core/rating_tracker/contracts.schema.json").read_text())
        self.assertEqual(schema["properties"]["timeClass"]["enum"], ["bullet", "blitz", "rapid", "daily"])
        self.assertEqual(schema["properties"]["schemaVersion"]["const"], 1)


class ReconciliationTests(unittest.TestCase):
    def view(self, values, pending=0):
        return reconcile(values, 5000, pending, 5000, 10000)

    def test_older_response_does_not_replace_newer_lower_rating(self):
        for values in ([observation(1900), observation(1800, 2000)], [observation(1800, 2000), observation(1900)]):
            self.assertEqual(self.view(values)["confirmed"]["rating"], 1800)

    def test_dom_never_confirms_or_vetoes(self):
        dom = observation(2500, None, "dom-player", now=4000)
        self.assertIsNone(self.view([dom])["confirmed"])
        view = self.view([dom, observation()])
        self.assertEqual(view["confirmed"]["rating"], 1900)
        self.assertEqual(view["provisional"]["rating"], 2500)

    def test_same_time_conflict_blocks_completion(self):
        view = self.view([observation(1900), observation(2200)])
        self.assertEqual(view["state"], "conflict")
        self.assertFalse(view["eligible"])

    def test_same_game_conflicting_revisions(self):
        view = self.view([observation(1900, 1000, "pubapi-archive", "chesscom:live:1"), observation(1910, 1100, "pubapi-archive", "chesscom:live:1")])
        self.assertEqual(view["state"], "conflict")

    def test_later_verified_state_can_advance_without_repairing_history(self):
        view = self.view([observation(1900), observation(2200), observation(2000, 3000)])
        self.assertEqual(view["confirmed"]["rating"], 2000)
        self.assertTrue(view["eligible"])
        self.assertTrue(view["conflicts"])

    def test_future_quarantined_pending_stale_missing_preserved(self):
        view = self.view([observation(), observation(2900, 400000)], 1)
        self.assertEqual(view["confirmed"]["rating"], 1900)
        self.assertEqual(view["state"], "awaiting-update")
        self.assertFalse(view["eligible"])
        self.assertEqual(self.view([])["state"], "unavailable")


class GoalTests(unittest.TestCase):
    def goal(self, direction="at-least", target=2200):
        return {"goalId": "goal", "direction": direction, "threshold": target, "baselineRating": None, "state": "awaiting-baseline", "createdAtMs": 1000, "proximityArmed": True, "proximityCycle": 0}

    def view(self, rating):
        return {"confirmed": observation(rating, 2000), "eligible": True}

    def test_upward_progress_and_first_reach(self):
        goal, _ = evaluate(self.goal(), self.view(1900), 3000)
        goal, _ = evaluate(goal, self.view(2050), 4000)
        self.assertEqual(goal["progress"], 50)
        goal, events = evaluate(goal, self.view(2200), 5000)
        self.assertEqual(goal["state"], "reached")
        self.assertEqual(events[0]["kind"], "reached")
        self.assertEqual(evaluate(goal, self.view(2200), 6000)[1], [])

    def test_downward_is_passive_comparison(self):
        goal, _ = evaluate(self.goal("at-most", 1700), self.view(1900), 3000)
        goal, _ = evaluate(goal, self.view(1800), 4000)
        self.assertEqual(goal["progress"], 50)
        goal, events = evaluate(goal, self.view(1699), 5000)
        self.assertEqual(goal["state"], "reached")
        self.assertTrue(events)

    def test_already_satisfied_no_backdating_or_divzero(self):
        goal, _ = evaluate(self.goal(target=1900), self.view(1900), 3000)
        self.assertEqual(goal["progress"], 100)
        self.assertGreaterEqual(goal["achievedAtMs"], goal["createdAtMs"])

    def test_near_hysteresis(self):
        goal = self.goal(target=2200)
        count = 0
        for rating in (2175, 2185, 2180, 2179, 2165, 2185):
            goal, events = evaluate(goal, self.view(rating), 3000)
            count += sum(event["kind"] == "near" for event in events)
        self.assertEqual(count, 2)

    def test_pending_retains_progress_no_completion(self):
        goal, _ = evaluate(self.goal(), self.view(1900), 3000)
        goal, _ = evaluate(goal, self.view(2050), 4000)
        goal, events = evaluate(goal, {"confirmed": observation(2200), "eligible": False}, 5000)
        self.assertEqual(goal["progress"], 50)
        self.assertEqual(events, [])


class ServiceTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory(dir=Path(__file__).resolve().parents[1])
        self.clock = Clock()
        self.public = FakePublicClient(self.clock)
        self.path = Path(self.directory.name) / "ratings.db"
        self.service = RatingTrackerService(self.path, self.public, self.clock)
        self.goal = self.service.create_goal({"username": "alice", "timeClass": "blitz", "direction": "at-least", "threshold": 2200, "idempotencyKey": "create-key-1"})
        self.account = self.goal["accountKey"]

    def tearDown(self):
        self.service.close()
        self.directory.cleanup()

    def selected(self):
        return self.service.snapshot()["goals"][0]

    def test_real_pipeline_fixture_and_zero_engine_imports(self):
        self.service.process_account(self.account)
        self.assertEqual(self.selected()["baselineRating"], 1900)
        self.assertEqual(self.selected()["view"]["state"], "verified")
        source = (Path(__file__).resolve().parents[1] / "core/rating_tracker/service.py").read_text()
        self.assertNotIn("getmove", source)
        self.assertNotIn("core.rating", source)

    def test_dom_provisional_pending_duplicates_and_confirmation(self):
        self.service.process_account(self.account)
        self.service.ingest_dom({"username": "alice", "timeClass": "blitz", "rating": 2300, "gameUrl": "https://www.chess.com/game/123"})
        data = {"username": "alice", "timeClass": "blitz", "gameUrl": "https://www.chess.com/game/123", "result": "D", "rated": None, "endedAtMs": self.clock(), "proofDigest": "proof"}
        self.service.ingest_terminal(data)
        self.service.ingest_terminal(data)
        self.assertEqual(self.selected()["view"]["pendingGameCount"], 1)
        self.assertNotEqual(self.selected()["state"], "reached")
        self.assertEqual(len(self.service.repository.rows("SELECT * FROM completed_games")), 1)

    def test_terminal_unknown_category_accepted(self):
        self.service.ingest_terminal({"username": "alice", "timeClass": None, "gameUrl": "https://www.chess.com/game/123", "rated": None, "endedAtMs": None, "proofDigest": "proof"})
        self.assertEqual(len(self.service.repository.rows("SELECT * FROM completed_games")), 1)

    def test_stale_api_does_not_clear_postgame(self):
        self.service.process_account(self.account)
        self.service.ingest_terminal({"username": "alice", "timeClass": "blitz", "gameUrl": "https://www.chess.com/game/live/123", "proofDigest": "proof"})
        self.service.process_account(self.account)
        self.assertEqual(self.selected()["view"]["pendingGameCount"], 1)

    def test_modes_separate_hidden_no_zero(self):
        self.service.process_account(self.account)
        self.assertEqual(len(self.service.repository.rows("SELECT * FROM current_ratings")), 1)
        with self.assertRaises(TrackerError):
            self.service.ingest_dom({"username": "alice", "timeClass": "rapid", "rating": None})

    def test_wrong_identity_cannot_become_own(self):
        with self.assertRaises(TrackerError):
            self.service.ingest_dom({"username": "opponent", "timeClass": "blitz", "rating": 2900})

    def test_revision_conflict_pause_no_jobs_resume_baseline(self):
        self.service.process_account(self.account)
        paused = self.service.patch_goal(self.goal["goalId"], {"revision": 1, "action": "pause"})
        self.assertEqual(paused["baselineRating"], 1900)
        self.assertEqual(self.service.repository.rows("SELECT * FROM refresh_jobs"), [])
        with self.assertRaises(TrackerError):
            self.service.patch_goal(self.goal["goalId"], {"revision": 1, "action": "resume"})
        resumed = self.service.patch_goal(self.goal["goalId"], {"revision": 2, "action": "resume"})
        self.assertEqual(resumed["baselineRating"], 1900)

    def test_idempotent_create_and_different_payload_conflict(self):
        same = self.service.create_goal({"username": "alice", "timeClass": "blitz", "direction": "at-least", "threshold": 2200, "idempotencyKey": "create-key-1"})
        self.assertEqual(same["goalId"], self.goal["goalId"])
        with self.assertRaises(TrackerError):
            self.service.create_goal({"username": "alice", "timeClass": "blitz", "direction": "at-least", "threshold": 2300, "idempotencyKey": "create-key-1"})

    def test_snapshot_refresh_and_db_restore(self):
        self.service.process_account(self.account)
        self.service.set_preferences({"onPageVisible": True})
        self.service.close()
        self.service = RatingTrackerService(self.path, self.public, self.clock)
        self.assertEqual(self.selected()["baselineRating"], 1900)
        self.assertTrue(self.service.snapshot()["preferences"]["onPageVisible"])
        self.assertTrue(self.service.repository.rows("SELECT * FROM refresh_jobs"))

    def test_failure_preserves_previous_confirmed(self):
        self.service.process_account(self.account)
        self.public.failure = TrackerError("PROVIDER_UNAVAILABLE", 503, True)
        self.service.process_account(self.account)
        self.assertEqual(self.selected()["currentRating"], 1900)
        self.assertEqual(self.service.snapshot()["errors"][0]["code"], "PROVIDER_UNAVAILABLE")

    def test_goal_notification_unique_claim_and_ack(self):
        self.public.rating = 2300
        self.service.process_account(self.account)
        self.service.process_account(self.account)
        notification = self.service.snapshot()["notifications"][0]
        self.assertEqual(len(self.service.snapshot()["notifications"]), 1)
        claim = self.service.claim(notification["notificationId"], {"consumerId": "tab1", "revision": 0})
        with self.assertRaises(TrackerError):
            self.service.claim(notification["notificationId"], {"consumerId": "tab2", "revision": 0})
        self.service.acknowledge(notification["notificationId"], {"claimToken": claim["claimToken"]})
        self.assertTrue(self.service.snapshot()["notifications"][0]["acknowledged"])

    def test_archive_rating_confirmation_and_observed_deltas(self):
        self.service.process_account(self.account)
        end = self.clock() // 1000
        self.public.games = [{"url": f"https://www.chess.com/game/live/{number}", "rules": "chess", "time_class": "blitz", "rated": True, "end_time": end + number, "white": {"username": "alice", "rating": rating, "result": "win"}, "black": {"username": "bob", "rating": 1800, "result": "resigned"}} for number, rating in ((1, 1907), (2, 1907), (3, 1901))]
        self.clock.now += 10000
        self.service.process_account(self.account)
        history = self.service.history(self.account, mode="blitz")["items"]
        singles = [item for item in history if item["scope"] == "single-game"]
        self.assertEqual([item["delta"] for item in singles], [0, -6])
        self.assertEqual(self.selected()["currentRating"], 1901)

    def test_conflict_does_not_roll_back_previous_snapshot(self):
        self.service.process_account(self.account)
        old = self.selected()["view"]["confirmed"]
        with self.service.repository.transaction() as db:
            item = RatingObservation(self.account, "alice", "blitz", 1999, "pubapi-stats", self.clock(), old["sourceEffectiveAtMs"], "conflict").to_dict()
            self.service._store_observation(db, item)
            self.service._rebuild(db, self.account, "blitz", self.clock(), self.clock() + 5000)
        self.assertEqual(self.selected()["currentRating"], 1900)
        self.assertEqual(self.selected()["view"]["state"], "conflict")


class RouteTests(ServiceTests):
    def setUp(self):
        super().setUp()
        self.app = Flask(__name__)
        self.app.register_blueprint(create_rating_tracker_blueprint(self.service))
        self.client = self.app.test_client()
        self.start = patch.object(self.service, "start")
        self.start.start()

    def tearDown(self):
        self.start.stop()
        super().tearDown()

    def test_origin_host_json_and_etag(self):
        self.assertEqual(self.client.get("/rating-goals/snapshot", headers={"Host": "evil.test"}).status_code, 403)
        denied = self.client.get("/rating-goals/snapshot", headers={"Origin": "https://evil.test"})
        self.assertEqual(denied.status_code, 403)
        self.assertNotIn("Access-Control-Allow-Origin", denied.headers)
        allowed = self.client.get("/rating-goals/snapshot", headers={"Origin": "https://www.chess.com"})
        self.assertEqual(allowed.headers["Access-Control-Allow-Origin"], "https://www.chess.com")
        self.assertEqual(self.client.get("/rating-goals/snapshot", headers={"If-None-Match": allowed.headers["ETag"]}).status_code, 304)
        self.assertEqual(self.client.post("/rating-goals", data="{}").status_code, 415)
        self.assertEqual(self.client.post("/rating-goals", json=[]).status_code, 400)

    def test_preflight_and_mutation(self):
        response = self.client.options("/rating-observations/dom", headers={"Origin": "https://www.chess.com", "Access-Control-Request-Method": "POST"})
        self.assertEqual(response.status_code, 204)
        response = self.client.post("/rating-observations/dom", json={"username": "alice", "timeClass": "blitz", "rating": 1910})
        self.assertEqual(response.status_code, 202)

    def test_history_validation_and_nullable_terminal(self):
        self.assertEqual(self.client.get("/rating-goals/history?username=alice&cursor=bad").status_code, 400)
        self.assertEqual(self.client.post("/rating-games/terminal", json={"username": "alice", "timeClass": None, "gameUrl": "https://www.chess.com/game/123", "proofDigest": "proof"}).status_code, 202)


class HTTPResponse(io.BytesIO):
    def __init__(self, body, status=200, headers=None):
        super().__init__(json.dumps(body).encode())
        self.status = status
        self.headers = headers or {}


class PublicClientTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(dir=Path(__file__).resolve().parents[1])
        self.repository = Repository(Path(self.temp.name) / "cache.db")
        self.clock = Clock()
        self.requests = []
        self.responses = []
        owner = self

        class Opener:
            def open(self, request, timeout):
                owner.requests.append(request)
                value = owner.responses.pop(0)
                if isinstance(value, Exception):
                    raise value
                return value

        self.client = PublicDataClient(self.repository, self.clock, Opener())

    def tearDown(self):
        self.repository.close()
        self.temp.cleanup()

    def test_conditional_304_preserves_evidence(self):
        self.responses.append(HTTPResponse({"rating": 1900}, headers={"ETag": "tag", "Cache-Control": "max-age=5"}))
        first = self.client.request("alice")
        self.clock.now += 6000
        self.responses.append(HTTPResponse({}, 304, {"Cache-Control": "max-age=5"}))
        second = self.client.request("alice")
        self.assertEqual(first.digest, second.digest)
        self.assertEqual(second.status, 304)
        self.assertEqual(self.requests[1].get_header("If-none-match"), "tag")

    def test_cache_prevents_unnecessary_reads(self):
        self.responses.append(HTTPResponse({"ok": True}, headers={"Cache-Control": "max-age=5"}))
        self.client.request("alice")
        self.client.request("alice")
        self.assertEqual(len(self.requests), 1)

    def test_304_without_body_retries_once(self):
        self.responses.extend([HTTPResponse({}, 304), HTTPResponse({"ok": True})])
        self.assertTrue(self.client.request("alice").body["ok"])
        self.assertEqual(len(self.requests), 2)

    def test_429_shared_persistent_retry_after(self):
        self.responses.append(HTTPResponse({}, 429, {"Retry-After": "120"}))
        with self.assertRaises(TrackerError) as raised:
            self.client.request("alice")
        self.assertEqual(raised.exception.retry_at, self.clock() + 120000)
        with self.assertRaises(TrackerError):
            self.client.request("bob")
        self.assertEqual(len(self.requests), 1)

    def test_timeout_and_stop(self):
        self.responses.append(TimeoutError())
        with self.assertRaises(TrackerError):
            self.client.request("alice")
        self.client.stop()
        with self.assertRaises(TrackerError) as raised:
            self.client.request("alice")
        self.assertEqual(raised.exception.code, "CANCELLED")

    def test_fixed_host_paths_only(self):
        with self.assertRaises(TrackerError):
            self.client.request("https://evil.test")
        with self.assertRaises(TrackerError):
            self.client.request("alice", "private")
        with self.assertRaises(TrackerError):
            SafeRedirect().redirect_request(None, None, 302, "", {}, "http://127.0.0.1/secrets")


if __name__ == "__main__":
    unittest.main()
