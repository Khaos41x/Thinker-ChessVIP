import io
import json
import sys
import tempfile
import threading
import time
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
sys.path.insert(0, str(Path(__file__).resolve().parent))

from test_rating_tracker import Clock, FakePublicClient, observation
from core.rating_tracker.contracts import RatingObservation, TrackerError
from core.rating_tracker.goals import evaluate
from core.rating_tracker.public_client import PublicDataClient, PublicResponse
from core.rating_tracker.service import RatingTrackerService, UnavailableRatingTrackerService


class ReliabilityTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(dir=Path(__file__).resolve().parents[1])
        self.clock = Clock()
        self.public = FakePublicClient(self.clock)
        self.service = RatingTrackerService(Path(self.temp.name) / "tracker.db", self.public, self.clock)
        self.goal = self.service.create_goal({"username": "alice", "timeClass": "blitz", "direction": "at-least", "threshold": 2000, "idempotencyKey": "reliability-create-1"})
        self.account = self.goal["accountKey"]

    def tearDown(self):
        self.service.close()
        self.temp.cleanup()

    def selected(self):
        return self.service.snapshot()["goals"][0]

    def game(self, number, rating, ended=None, **extra):
        return {"url": f"https://www.chess.com/game/live/{number}", "rules": "chess", "time_class": "blitz", "rated": True,
                "end_time": self.clock() // 1000 if ended is None else ended,
                "white": {"username": "alice", "rating": rating, "result": "win"},
                "black": {"username": "bob", "rating": 1800, "result": "resigned"}, **extra}

    def test_late_historical_crossing_preserves_latest_current(self):
        self.service.process_account(self.account)
        start = self.clock() // 1000
        self.public.games = [self.game(1, 1900, start), self.game(2, 2010, start + 2), self.game(3, 1990, start + 4)]
        self.clock.now += 10000
        self.public.rating = 1990
        self.public.effective = (start + 4) * 1000
        self.service.process_account(self.account)
        goal = self.selected()
        self.assertEqual(goal["state"], "reached")
        self.assertTrue(goal["historicallyReached"])
        self.assertEqual(goal["currentRating"], 1990)
        self.assertEqual(goal["view"]["confirmed"]["rating"], 1990)
        self.assertEqual(goal["remainingPoints"], 10)
        self.assertEqual(goal["achievedAtMs"], (start + 2) * 1000)

    def test_resume_does_not_complete_before_public_revalidation(self):
        self.service.process_account(self.account)
        self.service.create_goal({"username": "alice", "timeClass": "rapid", "direction": "at-least", "threshold": 2200, "idempotencyKey": "reliability-rapid-1"})
        self.service.patch_goal(self.goal["goalId"], {"revision": 1, "action": "pause"})
        with self.service.repository.transaction() as db:
            item = RatingObservation(self.account, "alice", "blitz", 2050, "pubapi-stats", self.clock(), self.clock(), "fixture-new").to_dict()
            self.service._store_observation(db, item)
        self.service.patch_goal(self.goal["goalId"], {"revision": 2, "action": "resume"})
        self.service.ingest_dom({"username": "alice", "timeClass": "blitz", "rating": 2050})
        goal = next(item for item in self.service.snapshot()["goals"] if item["goalId"] == self.goal["goalId"])
        self.assertNotEqual(goal["state"], "reached")
        self.assertTrue(goal["needsRevalidation"])

    def test_disputed_historical_completion_even_when_current_is_valid(self):
        crossing = observation(2010, 2000)
        goal = {"state": "reached", "threshold": 2000, "direction": "at-least", "createdAtMs": 1000,
                "baselineRating": 1900, "reachedObservationId": crossing["observationId"]}
        result, events = evaluate(goal, {"eligible": True, "state": "verified", "confirmed": observation(2020, 3000),
                                        "conflicts": [{"observationIds": [crossing["observationId"]]}]}, 4000)
        self.assertTrue(result["completionNeedsVerification"])
        self.assertEqual(events, [])

    def test_repeated_pause_cannot_erase_completed_state(self):
        self.public.rating = 2050
        self.service.process_account(self.account)
        self.service.patch_goal(self.goal["goalId"], {"revision": 1, "action": "pause"})
        with self.assertRaises(TrackerError):
            self.service.patch_goal(self.goal["goalId"], {"revision": 2, "action": "pause"})
        goal = self.service.patch_goal(self.goal["goalId"], {"revision": 2, "action": "resume"})
        self.assertEqual(goal["state"], "reached")

    def test_duplicate_terminal_does_not_reset_retry_budget(self):
        payload = {"username": "alice", "timeClass": "blitz", "gameUrl": "https://www.chess.com/game/live/333", "proofDigest": "duplicate"}
        self.service.ingest_terminal(payload)
        with self.service.repository.transaction() as db:
            db.execute("UPDATE refresh_jobs SET attempt=4,due_at=?", (self.clock() + 60000,))
        before = self.service.repository.rows("SELECT * FROM refresh_jobs")[0]
        self.service.ingest_terminal(payload)
        self.assertEqual(self.service.repository.rows("SELECT * FROM refresh_jobs")[0], before)

    def test_late_outbox_does_not_replace_newer_dom_candidate(self):
        self.service.process_account(self.account)
        self.service.ingest_dom({"username": "alice", "timeClass": "blitz", "rating": 1910, "observedAtMs": self.clock()})
        self.clock.now += 1000
        self.service.ingest_dom({"username": "alice", "timeClass": "blitz", "rating": 2500, "observedAtMs": self.clock() - 10000})
        self.assertEqual(self.selected()["view"]["provisional"]["rating"], 1910)
        self.assertEqual(self.selected()["view"]["confirmed"]["rating"], 1900)

    def test_post_resume_later_crossing_has_exact_timestamp(self):
        goal = {"state": "tracking", "threshold": 2000, "direction": "at-least", "createdAtMs": 1000,
                "baselineRating": 1900, "resumedAtMs": 2000}
        result, _ = evaluate(goal, {"eligible": True, "confirmed": observation(2010, 3000)}, 4000)
        self.assertEqual(result["achievedAtMs"], 3000)

    def test_already_satisfied_threshold_has_complete_progress(self):
        for direction, rating in (("at-least", 2050), ("at-most", 1950)):
            goal = {"state": "awaiting-baseline", "threshold": 2000, "direction": direction, "createdAtMs": 3000, "baselineRating": None}
            result, events = evaluate(goal, {"eligible": True, "confirmed": observation(rating, 1000)}, 4000)
            self.assertEqual(result["state"], "reached")
            self.assertEqual(result["progress"], 100)
            self.assertEqual(result["achievedAtMs"], 3000)
            self.assertEqual(events, [{"kind": "reached", "cycle": 0}])

    def test_new_terminal_during_refresh_keeps_immediate_job(self):
        self.service.process_account(self.account)
        with self.service.repository.transaction() as db:
            db.execute("UPDATE refresh_jobs SET attempt=8,due_at=?", (self.clock(),))
        request = self.public.request
        emitted = False

        def during(*args, **kwargs):
            nonlocal emitted
            if len(args) > 1 and args[1] == "month" and not emitted:
                emitted = True
                self.service.ingest_terminal({"username": "alice", "timeClass": "blitz", "gameUrl": "https://www.chess.com/game/live/333", "proofDigest": "new-game"})
            return request(*args, **kwargs)

        self.public.request = during
        self.service.process_account(self.account)
        job = self.service.repository.rows("SELECT * FROM refresh_jobs")[0]
        self.assertLessEqual(job["due_at"], self.clock())
        self.assertEqual(job["attempt"], 0)

    def test_malformed_provider_category_is_recoverable(self):
        request = self.public.request

        def malformed(*args, **kwargs):
            response = request(*args, **kwargs)
            if len(args) > 1 and args[1] == "stats":
                return PublicResponse({"chess_blitz": []}, response.checked_at, response.valid_until, 200, response.resource, "bad")
            return response

        self.public.request = malformed
        self.service.process_account(self.account)
        self.assertEqual(self.service.snapshot()["errors"][0]["code"], "INVALID_STATS_RESPONSE")
        self.public.request = request
        self.service.process_account(self.account)
        self.assertEqual(self.selected()["currentRating"], 1900)

    def test_profile_recycling_stops_before_stats(self):
        request = self.public.request

        def recycled(*args, **kwargs):
            response = request(*args, **kwargs)
            if len(args) > 1 and args[1] == "profile":
                return PublicResponse({"username": "alice", "player_id": 999}, response.checked_at, response.valid_until, 200, response.resource, "other")
            return response

        self.public.request = recycled
        self.public.calls.clear()
        self.service.process_account(self.account)
        self.assertFalse(any(call[1] == "stats" for call in self.public.calls))
        self.assertEqual(self.service.snapshot()["accounts"][0]["identityStatus"], "conflict")
        self.assertEqual(self.service.repository.rows("SELECT * FROM refresh_jobs"), [])

    def test_source_specific_cache_does_not_bless_stale_stats(self):
        self.service.process_account(self.account)
        self.clock.now += 120000
        request = self.public.request

        def stale(*args, **kwargs):
            response = request(*args, **kwargs)
            if len(args) > 1 and args[1] == "stats":
                return PublicResponse(response.body, self.clock() - 120000, self.clock() - 60000, 200, response.resource, response.digest)
            if len(args) > 1 and args[1] == "month":
                return PublicResponse({"games": [self.game(1, 1800, (self.clock() - 600000) // 1000)]}, self.clock(), self.clock() + 60000, 200, response.resource, "archive")
            return response

        self.public.request = stale
        self.service.process_account(self.account)
        self.assertEqual(self.selected()["view"]["state"], "stale")
        self.assertFalse(self.selected()["view"]["eligible"])

    def test_invalid_archive_record_does_not_bridge_deltas(self):
        self.service.process_account(self.account)
        start = self.clock() // 1000
        for broken in (self.game(2, 1950, start + 1, rated="yes"), self.game(2, 1950, start + 10000)):
            self.public.games = [self.game(1, 1900, start), broken, self.game(3, 1920, start + 2)]
            self.service.process_account(self.account)
            singles = [item for item in self.service.history(self.account)["items"] if item["scope"] == "single-game" and item["status"] == "confirmed"]
            self.assertEqual(singles, [])

    def test_delete_account_cannot_be_recreated_by_inflight_response(self):
        request = self.public.request

        def deleted(*args, **kwargs):
            response = request(*args, **kwargs)
            if len(args) > 1 and args[1] == "stats":
                self.service.delete_account(self.account)
            return response

        self.public.request = deleted
        self.service.process_account(self.account)
        self.assertEqual(self.service.snapshot()["accounts"], [])
        self.assertEqual(self.service.repository.rows("SELECT * FROM refresh_jobs"), [])

    def test_retention_preserves_baseline_and_completion_anchors(self):
        self.service.process_account(self.account)
        self.public.rating = 2050
        self.public.effective = self.clock()
        self.service.process_account(self.account)
        goal = self.selected()
        self.clock.now += 400 * 86400000
        with self.service.repository.transaction() as db:
            self.service._prune(db)
        ids = {row["observation_id"] for row in self.service.repository.rows("SELECT observation_id FROM observations")}
        self.assertIn(goal["baselineObservationId"], ids)
        self.assertIn(goal["reachedObservationId"], ids)

    def test_unavailable_storage_service_does_not_touch_engine(self):
        unavailable = UnavailableRatingTrackerService()
        self.assertEqual(unavailable.snapshot()["errors"][0]["code"], "HISTORY_COULD_NOT_BE_SAVED")
        with self.assertRaises(TrackerError):
            unavailable.create_goal({})

    def test_stream_deadline_and_stop_abort_active_response(self):
        class SlowResponse:
            def __init__(self):
                self.closed = threading.Event()

            def read(self, size):
                self.closed.wait(2)
                return b""

            def close(self):
                self.closed.set()

        client = PublicDataClient(self.service.repository, self.clock)
        response = SlowResponse()
        started = time.monotonic()
        with self.assertRaises(TrackerError) as raised:
            client._read(response, started + 0.05)
        self.assertEqual(raised.exception.code, "PROVIDER_TIMEOUT")
        self.assertLess(time.monotonic() - started, 1)
        response = SlowResponse()
        timer = threading.Timer(0.05, client.stop)
        timer.start()
        try:
            with self.assertRaises(TrackerError) as raised:
                client._read(response, time.monotonic() + 2)
            self.assertEqual(raised.exception.code, "CANCELLED")
        finally:
            timer.join()


if __name__ == "__main__":
    unittest.main()
