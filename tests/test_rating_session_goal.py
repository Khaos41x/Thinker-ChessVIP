import hashlib
import json
import sys
import tempfile
import threading
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
sys.path.insert(0, str(Path(__file__).resolve().parent))

from flask import Flask
from core.rating_tracker.contracts import TrackerError
from core.rating_tracker.routes import create_rating_tracker_blueprint
from core.rating_tracker.service import RatingTrackerService
from core.rating_tracker.session_goal import HEARTBEAT_TTL_MS, active_sessions
from test_rating_tracker import Clock, FakePublicClient


class SessionGoalTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="rating-session-", dir=Path(__file__).resolve().parents[1])
        self.path = Path(self.temp.name) / "tracker.db"
        self.clock = Clock()
        self.client = FakePublicClient(self.clock)
        self.service = RatingTrackerService(self.path, self.client, self.clock)
        self.body = {"sessionId": "a" * 32, "sessionAccountKey": hashlib.sha256(b"chess.com:alice").hexdigest(), "username": "alice", "timeClass": "blitz", "active": True}
        self.service.rating_target({"target": 2000})

    def tearDown(self):
        self.service.close()
        self.temp.cleanup()

    def request(self, **patch):
        return self.service.session_goal(dict(self.body, **patch))

    def process(self):
        self.service.process_account("chesscom:player:41")

    def change_rating(self, rating):
        self.clock.now += 10000
        self.client.rating = rating
        self.client.effective = self.clock.now - 1000
        self.process()

    def test_disabled_is_durable_and_does_not_lookup(self):
        self.service.rating_target({"target": None})
        result = self.request()
        self.assertEqual(result["state"], "disabled")
        self.assertFalse(result["reached"])
        self.assertFalse(result["eligible"])
        self.assertEqual(self.client.calls, [])
        self.service.rating_target({"target": 2200})
        self.assertEqual(self.request()["state"], "disabled")
        self.assertEqual(self.client.calls, [])

    def test_upward_crossing_uses_real_reconciliation_and_pins_target(self):
        self.assertEqual(self.request()["state"], "awaiting-rating")
        self.process()
        first = self.request()
        self.assertEqual((first["currentRating"], first["direction"], first["eligible"]), (1900, "at-least", True))
        self.service.rating_target({"target": 3000})
        self.change_rating(2005)
        result = self.request()
        self.assertEqual(result["target"], 2000)
        self.assertTrue(result["reached"])
        self.assertEqual(result["state"], "reached")
        self.assertEqual(self.service.repository.rows("SELECT * FROM goals"), [])
        self.assertEqual(self.service.repository.rows("SELECT * FROM notifications"), [])

    def test_downward_monitoring_never_changes_engine_configuration(self):
        self.service.rating_target({"target": 1700})
        self.request()
        self.process()
        self.assertEqual(self.request()["direction"], "at-most")
        self.change_rating(1700)
        self.assertTrue(self.request()["reached"])

    def test_equal_baseline_reaches_immediately(self):
        self.service.rating_target({"target": 1900})
        self.request()
        self.process()
        result = self.request()
        self.assertTrue(result["reached"])
        self.assertEqual(result["direction"], "at-least")

    def test_stale_does_not_create_baseline_and_schedules_once(self):
        self.request()
        self.process()
        self.clock.now += 60001
        result = self.request()
        self.assertFalse(result["eligible"])
        self.assertFalse(result["reached"])
        row = self.service.repository.rows("SELECT * FROM refresh_jobs")[0]
        self.assertEqual(row["due_at"], self.clock())
        self.request()
        self.assertEqual(self.service.repository.rows("SELECT * FROM refresh_jobs")[0]["data"], row["data"])
        stored = json.loads(self.service.repository.rows("SELECT value FROM metadata WHERE key=?", ("sessionGoal:" + self.body["sessionId"],))[0]["value"])
        self.assertNotIn("goal", stored)

    def test_pending_game_blocks_goal_and_duplicate_hint_does_not_restart(self):
        self.request()
        self.process()
        self.request()
        self.change_rating(2100)
        result = self.request(completedGameUrl="https://www.chess.com/live/game/123")
        self.assertFalse(result["eligible"])
        self.assertFalse(result["reached"])
        job = self.service.repository.rows("SELECT data FROM refresh_jobs")[0]
        self.request(completedGameUrl="https://www.chess.com/live/game/123")
        self.assertEqual(self.service.repository.rows("SELECT data FROM refresh_jobs")[0], job)
        self.assertEqual(len(self.service.repository.rows("SELECT * FROM completed_games")), 1)

    def test_hint_on_registration_processed_before_response(self):
        result = self.request(completedGameUrl="https://www.chess.com/game/live/123")
        self.assertFalse(result["eligible"])
        self.assertEqual(len(self.service.repository.rows("SELECT * FROM completed_games")), 1)

    def test_conflicting_data_blocks_goal(self):
        self.request()
        self.process()
        self.client.rating = 2100
        self.process()
        result = self.request()
        self.assertFalse(result["eligible"])
        self.assertFalse(result["reached"])

    def test_offline_preserves_confirmed_value_and_respects_retry_job(self):
        self.request()
        self.process()
        self.request()
        self.client.failure = TrackerError("UPSTREAM_UNAVAILABLE", 502, True)
        self.process()
        job = self.service.repository.rows("SELECT * FROM refresh_jobs")[0]
        result = self.request()
        self.assertEqual(result["state"], "error")
        self.assertEqual(result["confirmedRating"], 1900)
        self.assertFalse(result["eligible"])
        self.assertEqual(self.service.repository.rows("SELECT * FROM refresh_jobs")[0], job)

    def test_initial_profile_failure_retries_without_fabricated_rating(self):
        original = self.client.request
        self.client.request = lambda *args, **kwargs: (_ for _ in ()).throw(TrackerError("UPSTREAM_TIMEOUT", 504, True))
        first = self.request()
        self.assertEqual(first["state"], "error")
        self.assertIsNone(first["confirmedRating"])
        self.service.rating_target({"target": 2900})
        self.client.request = original
        self.request()
        self.process()
        result = self.request()
        self.assertEqual(result["target"], 2000)
        self.assertTrue(result["eligible"])

    def test_completed_binding_cannot_be_reactivated(self):
        self.request()
        self.process()
        self.request()
        self.assertEqual(self.request(active=False)["state"], "completed")
        before = list(self.client.calls)
        self.assertEqual(self.request()["state"], "completed")
        self.assertEqual(self.client.calls, before)
        self.assertEqual(self.service.repository.rows("SELECT enabled FROM monitoring_preferences")[0]["enabled"], 0)

    def test_inactive_unknown_binding_does_not_register(self):
        self.assertEqual(self.request(active=False)["state"], "completed")
        self.assertEqual(self.client.calls, [])
        self.assertEqual(self.service.repository.rows("SELECT value FROM metadata WHERE key LIKE 'sessionGoal:%'"), [])

    def test_reached_latches_after_finish_and_restart(self):
        self.request()
        self.process()
        self.request()
        self.change_rating(2100)
        self.assertTrue(self.request()["reached"])
        self.assertTrue(self.request(active=False)["reached"])
        self.service.close()
        self.service = RatingTrackerService(self.path, self.client, self.clock)
        result = self.request()
        self.assertTrue(result["reached"])
        self.assertFalse(result["eligible"])
        self.assertEqual(result["state"], "reached")

    def test_next_session_pins_new_target_and_resets_direction(self):
        self.request()
        self.process()
        self.request()
        self.request(active=False)
        self.service.rating_target({"target": 1800})
        result = self.request(sessionId="b" * 32)
        self.assertEqual(result["target"], 1800)
        self.assertEqual(result["direction"], "at-most")
        self.assertFalse(result["reached"])

    def test_concurrent_sessions_share_worker_without_replacing_jobs(self):
        self.request()
        job = self.service.repository.rows("SELECT * FROM refresh_jobs")[0]
        errors = []
        def register(number):
            try:
                self.request(sessionId=f"{number:032x}")
            except Exception as exc:
                errors.append(exc)
        threads = [threading.Thread(target=register, args=(number,)) for number in range(4)]
        for thread in threads:
            thread.start()
        for thread in threads:
            thread.join()
        self.assertEqual(errors, [])
        self.assertEqual(self.service.repository.rows("SELECT * FROM refresh_jobs")[0], job)
        self.request(active=False)
        self.assertEqual(self.service.repository.rows("SELECT enabled FROM monitoring_preferences")[0]["enabled"], 1)

    def test_regular_goals_preserved_and_not_unpaused(self):
        goal = self.service.create_goal({"username": "alice", "timeClass": "blitz", "direction": "at-least", "threshold": 2600, "idempotencyKey": "regular-goal"})
        self.service.patch_goal(goal["goalId"], {"revision": 1, "action": "pause"})
        self.request()
        self.assertEqual(json.loads(self.service.repository.rows("SELECT data FROM goals")[0]["data"])["state"], "paused")
        self.service.delete_goal(goal["goalId"], 2)
        self.assertEqual(self.service.repository.rows("SELECT enabled FROM monitoring_preferences")[0]["enabled"], 1)

    def test_pausing_regular_goal_does_not_disable_active_session(self):
        goal = self.service.create_goal({"username": "alice", "timeClass": "blitz", "direction": "at-least", "threshold": 2600, "idempotencyKey": "regular-goal"})
        self.request()
        self.service.patch_goal(goal["goalId"], {"revision": 1, "action": "pause"})
        self.assertEqual(self.service.repository.rows("SELECT enabled FROM monitoring_preferences")[0]["enabled"], 1)

    def test_polling_does_not_lookup_or_replace_existing_worker_job(self):
        self.request()
        self.process()
        job = self.service.repository.rows("SELECT * FROM refresh_jobs")[0]
        calls = list(self.client.calls)
        for _ in range(20):
            self.assertTrue(self.request()["eligible"])
        self.assertEqual(self.client.calls, calls)
        self.assertEqual(self.service.repository.rows("SELECT * FROM refresh_jobs")[0], job)

    def test_identity_change_in_public_profile_cannot_register_wrong_account(self):
        original = self.client.request
        def wrong_profile(*args, **kwargs):
            result = original(*args, **kwargs)
            result.body["username"] = "opponent"
            return result
        self.client.request = wrong_profile
        result = self.request()
        self.assertEqual(result["error"]["code"], "IDENTITY_CONFLICT")
        self.assertFalse(result["eligible"])
        self.assertEqual(self.service.repository.rows("SELECT * FROM players"), [])

    def test_active_session_recovers_paused_monitoring_without_unpausing_goal(self):
        self.request()
        self.process()
        with self.service.repository.transaction() as db:
            db.execute("UPDATE monitoring_preferences SET enabled=0")
            db.execute("DELETE FROM refresh_jobs")
        self.request()
        self.assertEqual(self.service.repository.rows("SELECT enabled FROM monitoring_preferences")[0]["enabled"], 1)
        self.assertEqual(len(self.service.repository.rows("SELECT * FROM refresh_jobs")), 1)

    def test_finish_retains_monitoring_for_active_regular_goal(self):
        self.request()
        self.service.create_goal({"username": "alice", "timeClass": "blitz", "direction": "at-least", "threshold": 2600, "idempotencyKey": "regular-goal"})
        self.request(active=False)
        self.assertEqual(self.service.repository.rows("SELECT enabled FROM monitoring_preferences")[0]["enabled"], 1)

    def test_privacy_delete_prevents_old_binding_resurrection(self):
        self.request()
        self.service.delete_account("chesscom:player:41")
        before = list(self.client.calls)
        self.assertEqual(self.request()["state"], "disabled")
        self.assertEqual(self.client.calls, before)
        self.assertEqual(self.service.repository.rows("SELECT * FROM players"), [])

    def test_abandoned_session_expires_before_next_background_lookup(self):
        self.request()
        self.process()
        calls = list(self.client.calls)
        self.clock.now += HEARTBEAT_TTL_MS
        self.process()
        self.assertEqual(self.client.calls, calls)
        self.assertEqual(self.service.repository.rows("SELECT enabled FROM monitoring_preferences")[0]["enabled"], 0)
        self.assertEqual(self.service.repository.rows("SELECT * FROM refresh_jobs"), [])
        binding = json.loads(self.service.repository.rows("SELECT value FROM metadata WHERE key LIKE 'sessionGoal:%'")[0]["value"])
        self.assertTrue(binding["active"])
        self.assertIn("dormantAtMs", binding)
        self.assertFalse(active_sessions(self.service.repository.connection, "chesscom:player:41", self.clock()))

    def test_worker_loop_sweeps_leases_without_due_jobs(self):
        self.request()
        self.process()
        self.clock.now += HEARTBEAT_TTL_MS
        with self.service.repository.transaction() as db:
            db.execute("UPDATE refresh_jobs SET due_at=?", (self.clock() + 1000000,))
        self.service.wake.wait = lambda seconds: self.service.stopping.set()
        self.service._run()
        self.assertEqual(self.service.repository.rows("SELECT enabled FROM monitoring_preferences")[0]["enabled"], 0)
        self.assertEqual(self.service.repository.rows("SELECT * FROM refresh_jobs"), [])

    def test_expired_session_resume_preserves_target_baseline_and_requires_fresh_data(self):
        self.request()
        self.process()
        self.request()
        self.clock.now += HEARTBEAT_TTL_MS
        self.process()
        self.service.rating_target({"target": 1800})
        resumed = self.request()
        self.assertEqual(resumed["target"], 2000)
        self.assertFalse(resumed["eligible"])
        self.assertFalse(resumed["reached"])
        self.assertEqual(self.service.repository.rows("SELECT enabled FROM monitoring_preferences")[0]["enabled"], 1)
        self.change_rating(2001)
        result = self.request()
        self.assertTrue(result["reached"])
        self.assertEqual(result["direction"], "at-least")
        binding = json.loads(self.service.repository.rows("SELECT value FROM metadata WHERE key LIKE 'sessionGoal:%'")[0]["value"])
        self.assertEqual(binding["goal"]["baselineRating"], 1900)
        self.assertNotIn("dormantAtMs", binding)

    def test_active_heartbeat_extends_lease(self):
        self.request()
        self.clock.now += HEARTBEAT_TTL_MS - 1
        self.request()
        self.clock.now += HEARTBEAT_TTL_MS - 1
        self.process()
        self.assertEqual(self.service.repository.rows("SELECT enabled FROM monitoring_preferences")[0]["enabled"], 1)
        self.assertTrue(active_sessions(self.service.repository.connection, "chesscom:player:41", self.clock()))

    def test_expiry_retains_active_regular_goal_monitoring(self):
        self.request()
        goal = self.service.create_goal({"username": "alice", "timeClass": "blitz", "direction": "at-least", "threshold": 2600, "idempotencyKey": "regular-goal"})
        self.clock.now += HEARTBEAT_TTL_MS
        self.process()
        self.assertEqual(self.service.repository.rows("SELECT enabled FROM monitoring_preferences")[0]["enabled"], 1)
        self.assertEqual(json.loads(self.service.repository.rows("SELECT data FROM goals")[0]["data"])["goalId"], goal["goalId"])
        self.service.patch_goal(goal["goalId"], {"revision": 1, "action": "pause"})
        self.assertEqual(self.service.repository.rows("SELECT enabled FROM monitoring_preferences")[0]["enabled"], 0)

    def test_expiry_retains_other_live_session(self):
        self.request()
        self.clock.now += HEARTBEAT_TTL_MS - 1
        self.request(sessionId="b" * 32)
        self.clock.now += 1
        self.process()
        self.assertEqual(self.service.repository.rows("SELECT enabled FROM monitoring_preferences")[0]["enabled"], 1)
        self.request(sessionId="b" * 32, active=False)
        self.assertEqual(self.service.repository.rows("SELECT enabled FROM monitoring_preferences")[0]["enabled"], 0)

    def test_finished_binding_stays_finished_after_lease_expiry(self):
        self.request()
        self.request(active=False)
        self.clock.now += HEARTBEAT_TTL_MS + 1
        self.process()
        self.assertEqual(self.request()["state"], "completed")
        self.assertEqual(self.service.repository.rows("SELECT enabled FROM monitoring_preferences")[0]["enabled"], 0)

    def test_dormant_sweep_does_not_write_repeatedly(self):
        self.request()
        self.clock.now += HEARTBEAT_TTL_MS
        self.service._retire_session_leases()
        before = self.service.repository.rows("SELECT value FROM metadata WHERE key='revision'")[0]
        self.service._retire_session_leases()
        self.assertEqual(self.service.repository.rows("SELECT value FROM metadata WHERE key='revision'")[0], before)

    def test_resume_invalidates_cache_freshness_but_preserves_conditional_headers(self):
        self.request()
        resource = "https://api.chess.com/pub/player/alice/stats"
        self.service.repository.cache_set(resource, {"validUntil": self.clock() + 2000000, "etag": "version-one", "body": {}, "retryAtMs": self.clock() + 2000001})
        self.clock.now += HEARTBEAT_TTL_MS
        self.request()
        cached = self.service.repository.cache_get(resource)
        self.assertEqual(cached["validUntil"], 0)
        self.assertEqual(cached["etag"], "version-one")
        self.assertGreater(cached["retryAtMs"], self.clock())

    def test_wrong_account_category_session_or_flag_rejected(self):
        for patch in ({"sessionId": "bad"}, {"sessionAccountKey": "a" * 64}, {"timeClass": "chess960"}, {"active": 1}, {"username": "opponent"}, {"unexpected": True}):
            with self.subTest(patch=patch), self.assertRaises(TrackerError):
                self.request(**patch)
        self.request()
        with self.assertRaises(TrackerError):
            self.request(timeClass="rapid")

    def test_missing_category_cannot_use_blitz_rating(self):
        self.request(timeClass="rapid")
        self.process()
        result = self.request(timeClass="rapid")
        self.assertIsNone(result["currentRating"])
        self.assertFalse(result["eligible"])

    def test_flask_contract_and_strict_json(self):
        app = Flask(__name__)
        self.service.start = lambda: None
        app.register_blueprint(create_rating_tracker_blueprint(self.service))
        client = app.test_client()
        result = client.post("/rating-goals/session", json=self.body)
        self.assertEqual(result.status_code, 200)
        data = result.get_json()
        for key in ("schemaVersion", "sessionId", "sessionAccountKey", "username", "timeClass", "target", "state", "eligible", "reached"):
            self.assertIn(key, data)
        self.assertEqual(client.post("/rating-goals/session", json=[]).status_code, 400)
        self.assertEqual(client.post("/rating-goals/session", json=dict(self.body, extra=1)).status_code, 400)
        duplicate = json.dumps(self.body)[:-1] + ',"active":true}'
        self.assertEqual(client.post("/rating-goals/session", data=duplicate, content_type="application/json").status_code, 400)
        self.assertEqual(client.post("/rating-goals/session", data=json.dumps(self.body)[:-1] + ',"other":NaN}', content_type="application/json").status_code, 400)
        self.assertEqual(client.post("/rating-goals/session", data="{}", content_type="text/plain").status_code, 415)
        self.assertEqual(client.post("/rating-goals/session", json=self.body, headers={"Origin": "https://evil.test"}).status_code, 403)


if __name__ == "__main__":
    unittest.main()
