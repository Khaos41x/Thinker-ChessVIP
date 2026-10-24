import json
import secrets
import sqlite3
import statistics
import threading
import time
import uuid
from datetime import datetime, timezone

from .contracts import RatingGoal, RatingObservation, TrackerError, category, digest, game_key, integer, timestamp, username
from .goals import evaluate
from .public_client import PublicDataClient
from .reconcile import reconcile
from .repository import Repository
from .session_goal import active_sessions, lease_live, retire_expired_sessions, session_goal


class RatingTrackerService:
    def __init__(self, database_path, client=None, clock=None):
        self.clock = clock or (lambda: int(time.time() * 1000))
        self.repository = Repository(database_path)
        self.client = client or PublicDataClient(self.repository, self.clock)
        self.stopping = threading.Event()
        self.wake = threading.Event()
        self.worker = None
        self.worker_lock = threading.Lock()
        self.session_goal_lock = threading.RLock()
        self.last_error = None

    def session_goal(self, body):
        return session_goal(self, body)

    def _retire_session_leases(self, account_key=None):
        bindings = [json.loads(row["value"]) for row in self.repository.rows("SELECT value FROM metadata WHERE key LIKE 'sessionGoal:%'")]
        if any(binding.get("active") and binding.get("target") is not None and binding.get("accountKey") and not binding.get("dormantAtMs") and (not account_key or binding["accountKey"] == account_key) and not lease_live(binding, self.clock()) for binding in bindings):
            with self.repository.transaction() as db:
                retire_expired_sessions(self, db, account_key)

    def start(self):
        with self.worker_lock:
            if self.worker is not None or self.stopping.is_set():
                return
            self.worker = threading.Thread(target=self._run, name="rating-goal-monitor", daemon=True)
            self.worker.start()

    def stop(self):
        self.stopping.set()
        self.wake.set()
        if hasattr(self.client, "stop"):
            self.client.stop()
        if self.worker and self.worker is not threading.current_thread():
            self.worker.join(timeout=11)

    def close(self):
        self.stop()
        if not self.worker or not self.worker.is_alive():
            self.repository.close()

    def _account(self, db, key=None, name=None):
        if key:
            row = db.execute("SELECT * FROM players WHERE account_key=?", (key,)).fetchone()
        else:
            row = db.execute("SELECT p.* FROM players p LEFT JOIN player_aliases a ON a.account_key=p.account_key WHERE p.username=? OR a.username=?", (name, name)).fetchone()
        if row is None:
            raise TrackerError("ACCOUNT_NOT_MONITORED", 404)
        return dict(row)

    def _goal(self, db, goal_id):
        row = db.execute("SELECT data FROM goals WHERE goal_id=?", (goal_id,)).fetchone()
        if not row:
            raise TrackerError("GOAL_NOT_FOUND", 404)
        return json.loads(row[0])

    def rating_target(self, body=None):
        if body is not None:
            if set(body) != {"target"}:
                raise TrackerError("INVALID_TARGET")
            target = body["target"]
            if target is not None:
                target = integer(target, "target")
            with self.repository.transaction() as db:
                db.execute("INSERT INTO metadata(key,value) VALUES('ratingTarget',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value", (json.dumps(target),))
        saved = self.repository.rows("SELECT value FROM metadata WHERE key='ratingTarget'")
        return {"target": json.loads(saved[0]["value"]) if saved else None}

    def create_goal(self, body):
        RatingGoal(body.get("username"), body.get("timeClass"), body.get("direction"), body.get("threshold"), body.get("idempotencyKey"))
        name, mode = username(body.get("username")), category(body.get("timeClass"))
        threshold = integer(body.get("threshold"), "threshold")
        direction = body.get("direction")
        if direction not in ("at-least", "at-most"):
            raise TrackerError("INVALID_DIRECTION")
        key = body.get("idempotencyKey")
        if not isinstance(key, str) or not 8 <= len(key) <= 128:
            raise TrackerError("INVALID_IDEMPOTENCY_KEY")
        fingerprint = digest({"username": name, "timeClass": mode, "threshold": threshold, "direction": direction})
        old = self.repository.rows("SELECT data FROM goals WHERE idempotency_key=?", (key,))
        if old:
            goal = json.loads(old[0]["data"])
            if goal["creationFingerprint"] != fingerprint:
                raise TrackerError("IDEMPOTENCY_CONFLICT", 409)
            return goal
        profile = self.client.request(name, "profile").body
        if username(profile.get("username", "")) != name:
            raise TrackerError("IDENTITY_CONFLICT", 409)
        player_id = profile.get("player_id")
        if player_id is not None:
            integer(player_id, "player_id", 1, 9007199254740991)
        account_key = f"chesscom:player:{player_id}" if player_id is not None else f"chesscom:username:{name}"
        now = self.clock()
        goal = {"schemaVersion": 1, "goalId": uuid.uuid4().hex, "accountKey": account_key, "timeClass": mode,
                "platform": "chesscom", "rules": "chess", "username": name, "direction": direction,
                "threshold": threshold, "revision": 1, "state": "awaiting-baseline", "createdAtMs": now,
                "baselineRating": None, "baselineObservationId": None, "baselineAtMs": None,
                "achievedAtMs": None, "confirmedReachedAtMs": None, "proximityPoints": 20,
                "proximityCycle": 0, "proximityArmed": True, "creationFingerprint": fingerprint}
        try:
            with self.repository.transaction() as db:
                existing = db.execute("SELECT account_key,player_id FROM players WHERE username=?", (name,)).fetchone()
                if existing and existing["account_key"] != account_key:
                    raise TrackerError("IDENTITY_CONFLICT", 409)
                owner = db.execute("SELECT * FROM players WHERE account_key=?", (account_key,)).fetchone()
                if owner and owner["username"] != name:
                    db.execute("INSERT OR IGNORE INTO player_aliases VALUES(?,?)", (owner["username"], account_key))
                db.execute("INSERT INTO players(account_key,username,player_id,identity_status) VALUES(?,?,?,'verified') ON CONFLICT(account_key) DO UPDATE SET username=excluded.username,player_id=excluded.player_id,identity_status='verified'", (account_key, name, player_id))
                db.execute("INSERT OR IGNORE INTO player_aliases VALUES(?,?)", (name, account_key))
                db.execute("INSERT OR REPLACE INTO monitoring_preferences VALUES(?,1)", (account_key,))
                self._save_goal(db, goal, key)
                self._schedule(db, account_key, now)
        except sqlite3.IntegrityError as exc:
            raise TrackerError("ACTIVE_GOAL_EXISTS", 409) from exc
        self.wake.set()
        return goal

    def _save_goal(self, db, goal, idempotency=None):
        if idempotency is not None:
            db.execute("INSERT INTO goals VALUES(?,?,?,?,?,?,?)", (goal["goalId"], goal["accountKey"], goal["timeClass"], goal["state"], goal["revision"], json.dumps(goal), idempotency))
        else:
            db.execute("UPDATE goals SET state=?,revision=?,data=? WHERE goal_id=?", (goal["state"], goal["revision"], json.dumps(goal), goal["goalId"]))

    def patch_goal(self, goal_id, body):
        revision = integer(body.get("revision"), "revision", 1, 9007199254740991)
        action = body.get("action")
        if action not in ("pause", "resume", "archive", "update"):
            raise TrackerError("INVALID_ACTION")
        with self.repository.transaction() as db:
            goal = self._goal(db, goal_id)
            if goal["revision"] != revision:
                raise TrackerError("REVISION_CONFLICT", 409)
            if goal["state"] == "archived":
                raise TrackerError("GOAL_ARCHIVED", 409)
            if action == "pause":
                if goal["state"] == "paused":
                    raise TrackerError("GOAL_ALREADY_PAUSED", 409)
                goal.update(state="paused", stateBeforePause=goal["state"])
            elif action == "archive":
                goal["state"] = "archived"
            elif action == "resume":
                if goal["state"] != "paused":
                    raise TrackerError("GOAL_NOT_PAUSED", 409)
                goal.update(state="reached" if goal.get("stateBeforePause") == "reached" else "tracking" if goal.get("baselineRating") is not None else "awaiting-baseline", resumedAtMs=self.clock(), needsRevalidation=True)
                account = self._account(db, key=goal["accountKey"])
                prefix = "https://api.chess.com/pub/player/" + account["username"]
                for cached in db.execute("SELECT resource,data FROM http_cache WHERE resource=? OR resource LIKE ?", (prefix, prefix + "/%" )).fetchall():
                    cache = json.loads(cached["data"])
                    cache["validUntil"] = 0
                    db.execute("UPDATE http_cache SET data=? WHERE resource=?", (json.dumps(cache), cached["resource"]))
            else:
                history = goal.get("previousRevisions", []) + [{key: value for key, value in goal.items() if key != "previousRevisions"}]
                goal.update(threshold=integer(body.get("threshold"), "threshold"), baselineRating=None,
                            baselineObservationId=None, baselineAtMs=None, state="awaiting-baseline",
                            createdAtMs=self.clock(), achievedAtMs=None, confirmedReachedAtMs=None,
                            proximityCycle=0, proximityArmed=True, previousRevisions=history)
                for field in ("reachedObservationId", "completionNeedsVerification", "resumedAtMs", "currentRating", "progress", "rawProgress", "remainingPoints"):
                    goal.pop(field, None)
            goal["revision"] += 1
            self._save_goal(db, goal)
            active = db.execute("SELECT 1 FROM goals WHERE account_key=? AND state IN ('tracking','awaiting-baseline','reached') LIMIT 1", (goal["accountKey"],)).fetchone() or active_sessions(db, goal["accountKey"], self.clock())
            db.execute("UPDATE monitoring_preferences SET enabled=? WHERE account_key=?", (int(bool(active)), goal["accountKey"]))
            if active:
                self._schedule(db, goal["accountKey"], self.clock())
            else:
                db.execute("DELETE FROM refresh_jobs WHERE account_key=?", (goal["accountKey"],))
                db.execute("UPDATE players SET generation=generation+1 WHERE account_key=?", (goal["accountKey"],))
        self.wake.set()
        return goal

    def _schedule(self, db, account_key, due, attempt=0):
        db.execute("INSERT INTO refresh_jobs(resource,account_key,due_at,attempt,data) VALUES(?,?,?,?,?) ON CONFLICT(resource) DO UPDATE SET due_at=MIN(due_at,excluded.due_at),data=excluded.data,attempt=0", (account_key, account_key, due, attempt, json.dumps({"token": uuid.uuid4().hex})))

    def refresh(self, account_key=None, name=None):
        with self.repository.transaction() as db:
            account = self._account(db, account_key, username(name) if name else None)
            enabled = db.execute("SELECT enabled FROM monitoring_preferences WHERE account_key=?", (account["account_key"],)).fetchone()
            if not enabled or not enabled[0]:
                raise TrackerError("MONITORING_PAUSED", 409)
            self._schedule(db, account["account_key"], self.clock())
        self.wake.set()

    def ingest_dom(self, body):
        name, mode = username(body.get("username")), category(body.get("timeClass"))
        rating = integer(body.get("rating"))
        now = self.clock()
        supplied_time = body.get("observedAtMs", now)
        timestamp(supplied_time)
        if supplied_time > now + 300000 or supplied_time < now - 86400000:
            raise TrackerError("INVALID_OBSERVATION_TIME")
        with self.repository.transaction() as db:
            account = self._account(db, name=name)
            self._require_monitoring(db, account["account_key"])
            key = game_key(body["gameUrl"], mode) if body.get("gameUrl") else None
            observation = RatingObservation(account["account_key"], name, mode, rating, "dom-player", now, None,
                                            "chesscom-dom-player", key, digest({"rating": rating, "gameKey": key, "sourceObservedAtMs": supplied_time})).to_dict()
            observation["sourceObservedAtMs"] = supplied_time
            self._store_observation(db, observation)
            self._rebuild(db, account["account_key"], mode)
        return {"accepted": True}

    @staticmethod
    def _require_monitoring(db, account_key):
        enabled = db.execute("SELECT enabled FROM monitoring_preferences WHERE account_key=?", (account_key,)).fetchone()
        if not enabled or not enabled[0]:
            raise TrackerError("MONITORING_PAUSED", 409)

    def ingest_terminal(self, body):
        name = username(body.get("username"))
        mode = category(body["timeClass"]) if body.get("timeClass") is not None else None
        key = game_key(body.get("gameUrl"), mode)
        rated = body.get("rated")
        if rated is not None and not isinstance(rated, bool):
            raise TrackerError("INVALID_RATED_FLAG")
        ended = body.get("endedAtMs")
        if ended is not None:
            timestamp(ended)
            if ended > self.clock() + 300000:
                raise TrackerError("INVALID_GAME_TIME")
        proof = body.get("proofDigest")
        if not isinstance(proof, str) or not 1 <= len(proof) <= 128:
            raise TrackerError("MISSING_TERMINAL_PROOF")
        result = body.get("result", "unknown")
        if result not in ("W", "D", "L", "aborted", "unknown", "win", "draw", "loss"):
            raise TrackerError("INVALID_RESULT")
        with self.repository.transaction() as db:
            account = self._account(db, name=name)
            self._require_monitoring(db, account["account_key"])
            data = {"gameKey": key, "username": name, "timeClass": mode, "rated": rated, "endedAtMs": ended,
                    "result": result, "proofDigest": proof, "proofSource": "dom", "observedAtMs": self.clock()}
            previous = db.execute("SELECT time_class FROM completed_games WHERE account_key=? AND game_key=?", (account["account_key"], key)).fetchone()
            db.execute("INSERT INTO completed_games VALUES(?,?,?,?,?,?,?) ON CONFLICT(account_key,game_key) DO UPDATE SET time_class=COALESCE(completed_games.time_class,excluded.time_class)", (account["account_key"], key, mode, None if rated is None else int(rated), ended, "awaiting-publication", json.dumps(data)))
            if mode and ":daily:" in key:
                db.execute("UPDATE completed_games SET time_class=? WHERE account_key=? AND game_key=? AND time_class IS NULL", (mode, account["account_key"], key.replace(":daily:", ":unknown:")))
            if previous is None or previous["time_class"] is None and mode:
                self._schedule(db, account["account_key"], self.clock())
            if mode:
                self._rebuild(db, account["account_key"], mode)
        self.wake.set()
        return {"accepted": True}

    @staticmethod
    def _store_observation(db, item):
        db.execute("INSERT OR IGNORE INTO observations VALUES(?,?,?,?,?,?,?,?)", (item["observationId"], item["accountKey"], item["timeClass"], item["sourceEffectiveAtMs"], item["source"], item["rating"], item.get("gameKey"), json.dumps(item)))

    def _rebuild(self, db, account_key, mode, checked_at=None, cache_until=None, resource=None, evaluate_goals=True):
        old_row = db.execute("SELECT data FROM current_ratings WHERE account_key=? AND time_class=?", (account_key, mode)).fetchone()
        old = json.loads(old_row[0]) if old_row else {}
        observations = [json.loads(row[0]) for row in db.execute("SELECT data FROM observations WHERE account_key=? AND time_class=?", (account_key, mode))]
        pending = db.execute("SELECT COUNT(*) FROM completed_games WHERE account_key=? AND (time_class=? OR time_class IS NULL) AND state='awaiting-publication'", (account_key, mode)).fetchone()[0]
        now = self.clock()
        checks = old.get("resourceChecks", {})
        if resource is not None:
            checks[resource] = {"checkedAtMs": checked_at, "cacheUntilMs": cache_until}
        initial = reconcile(observations, now, pending)
        selected_resource = initial["confirmed"]["resourceKey"] if initial.get("confirmed") else None
        selected_check = checks.get(selected_resource, {})
        if resource is None and checked_at is not None:
            selected_check = {"checkedAtMs": checked_at, "cacheUntilMs": cache_until}
        view = reconcile(observations, now, pending, selected_check.get("checkedAtMs"), selected_check.get("cacheUntilMs"))
        view.update(checkedAtMs=selected_check.get("checkedAtMs"), cacheUntilMs=selected_check.get("cacheUntilMs"), resourceChecks=checks)
        if old.get("confirmed") and (not view["confirmed"] or view["confirmed"]["sourceEffectiveAtMs"] < old["confirmed"]["sourceEffectiveAtMs"]):
            view["confirmed"] = old["confirmed"]
            view["eligible"] = False
        db.execute("INSERT INTO current_ratings VALUES(?,?,?) ON CONFLICT(account_key,time_class) DO UPDATE SET data=excluded.data", (account_key, mode, json.dumps(view)))
        previous = old.get("confirmed")
        selected = view.get("confirmed")
        if previous and selected and view["state"] != "conflict" and previous["observationId"] != selected["observationId"] and previous["rating"] != selected["rating"]:
            change_id = digest([previous["observationId"], selected["observationId"]])
            change = {"changeId": change_id, "fromObservationId": previous["observationId"], "toObservationId": selected["observationId"], "delta": selected["rating"] - previous["rating"], "scope": "interval" if selected.get("gameKey") else "unattributed-adjustment", "sequenceComplete": False, "gameKeys": [selected["gameKey"]] if selected.get("gameKey") else [], "observedAtMs": now, "sourceEffectiveAtMs": selected["sourceEffectiveAtMs"], "status": "confirmed"}
            db.execute("INSERT OR IGNORE INTO rating_changes VALUES(?,?,?,?)", (change_id, account_key, mode, json.dumps(change)))
        if not evaluate_goals:
            return
        for row in db.execute("SELECT data FROM goals WHERE account_key=? AND time_class=?", (account_key, mode)).fetchall():
            existing_goal = json.loads(row[0])
            disputed_ids = {value for conflict in view["conflicts"] for value in conflict.get("observationIds", [])}
            if existing_goal.get("reachedObservationId") in disputed_ids:
                existing_goal["completionNeedsVerification"] = True
            goal_view = dict(view)
            if existing_goal.get("needsRevalidation"):
                goal_view["eligible"] = False
            goal, events = evaluate(existing_goal, goal_view, now)
            self._save_goal(db, goal)
            for event in events:
                notification_id = digest([goal["goalId"], goal["revision"], event["kind"], event["cycle"]])
                message = "Goal Reached" if event["kind"] == "reached" and goal["direction"] == "at-least" else "Threshold Reached" if event["kind"] == "reached" else f"{goal['remainingPoints']} points from your rating threshold"
                notification = dict(event, notificationId=notification_id, accountKey=account_key, goalId=goal["goalId"], message=message, createdAtMs=now, revision=0, acknowledged=False)
                db.execute("INSERT OR IGNORE INTO notifications(notification_id,account_key,goal_id,data) VALUES(?,?,?,?)", (notification_id, account_key, goal["goalId"], json.dumps(notification)))

    def process_account(self, account_key):
        self._retire_session_leases(account_key)
        enabled = self.repository.rows("SELECT enabled FROM monitoring_preferences WHERE account_key=?", (account_key,))
        if not enabled or not enabled[0]["enabled"]:
            return
        accounts = self.repository.rows("SELECT * FROM players WHERE account_key=?", (account_key,))
        if not accounts:
            return
        account = accounts[0]
        original_job = self.repository.rows("SELECT data FROM refresh_jobs WHERE account_key=?", (account_key,))
        original_job_data = original_job[0]["data"] if original_job else None
        generation = account["generation"]
        name = account["username"]
        errors = []
        try:
            profile = self.client.request(name, "profile").body
            verified_name = username(profile.get("username"))
            provider_id = profile.get("player_id")
            if account["player_id"] is not None and provider_id != account["player_id"]:
                raise TrackerError("IDENTITY_CONFLICT", 409)
            if account["player_id"] is None and verified_name != name:
                raise TrackerError("IDENTITY_CONFLICT", 409)
            if account["player_id"] is None and provider_id is not None:
                integer(provider_id, "player_id", 1, 9007199254740991)
                with self.repository.transaction() as db:
                    self._promote_identity(db, account_key, verified_name, provider_id)
                return
            if verified_name != name:
                with self.repository.transaction() as db:
                    other = db.execute("SELECT account_key FROM players WHERE username=?", (verified_name,)).fetchone()
                    if other and other[0] != account_key:
                        raise TrackerError("IDENTITY_CONFLICT", 409)
                    db.execute("INSERT OR IGNORE INTO player_aliases VALUES(?,?)", (name, account_key))
                    db.execute("UPDATE players SET username=? WHERE account_key=?", (verified_name, account_key))
                    db.execute("INSERT OR IGNORE INTO player_aliases VALUES(?,?)", (verified_name, account_key))
                account["username"] = name = verified_name
        except TrackerError as exc:
            self.last_error = exc.payload()
            with self.repository.transaction() as db:
                db.execute("INSERT INTO metadata VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value", ("error:" + account_key, json.dumps(self.last_error)))
                if exc.code == "IDENTITY_CONFLICT":
                    db.execute("UPDATE players SET identity_status='conflict',generation=generation+1 WHERE account_key=?", (account_key,))
                    db.execute("UPDATE monitoring_preferences SET enabled=0 WHERE account_key=?", (account_key,))
                    db.execute("DELETE FROM refresh_jobs WHERE account_key=?", (account_key,))
                else:
                    db.execute("UPDATE refresh_jobs SET due_at=?,attempt=attempt+1,data=? WHERE account_key=?", (exc.retry_at or self.clock() + 60000, json.dumps({"error": exc.payload()}), account_key))
            return
        verified_resources = set()
        try:
            response = self.client.request(name, "stats")
            verified_resources.add(response.resource)
            with self.repository.transaction() as db:
                current = self._account(db, key=account_key)
                self._require_monitoring(db, account_key)
                if current["generation"] != generation or self.stopping.is_set():
                    return
                for mode in ("bullet", "blitz", "rapid", "daily"):
                    container = response.body.get("chess_" + mode)
                    if container is None:
                        continue
                    if not isinstance(container, dict):
                        errors.append(TrackerError("INVALID_STATS_RESPONSE", 502, True))
                        continue
                    record = container.get("last")
                    if not isinstance(record, dict):
                        continue
                    try:
                        rating = integer(record.get("rating"))
                        date = timestamp(record.get("date")) * 1000
                        if date > self.clock() + 300000:
                            continue
                        item = RatingObservation(account_key, name, mode, rating, "pubapi-stats", self.clock(), date, response.resource,
                                                 recordDigest=digest(record), requestGeneration=generation).to_dict()
                    except TrackerError:
                        continue
                    self._store_observation(db, item)
                    self._rebuild(db, account_key, mode, response.checked_at, response.valid_until, response.resource, False)
        except TrackerError as exc:
            errors.append(exc)
        now = self.clock()
        date = datetime.fromtimestamp(now / 1000, timezone.utc)
        months = {(date.year, date.month)}
        pending = self.repository.rows("SELECT ended_at FROM completed_games WHERE account_key=? AND state='awaiting-publication'", (account_key,))
        for row in pending:
            if row["ended_at"]:
                ended = datetime.fromtimestamp(row["ended_at"] / 1000, timezone.utc)
                months.add((ended.year, ended.month))
        if date.day <= 2 or pending:
            months.add((date.year - 1, 12) if date.month == 1 else (date.year, date.month - 1))
        for year, month in sorted(months, reverse=True)[:12]:
            if self.stopping.is_set():
                return
            try:
                response = self.client.request(name, "month", year, month)
                verified_resources.add(response.resource)
                self._ingest_archive(account, generation, response)
            except TrackerError as exc:
                errors.append(exc)
        self.last_error = errors[0].payload() if errors else None
        with self.repository.transaction() as db:
            enabled = db.execute("SELECT enabled FROM monitoring_preferences WHERE account_key=?", (account_key,)).fetchone()
            if not enabled or not enabled[0]:
                return
            db.execute("INSERT INTO metadata VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value", ("error:" + account_key, json.dumps(self.last_error)))
            current = self._account(db, key=account_key)
            if current["generation"] != generation:
                return
            modes = [row[0] for row in db.execute("SELECT DISTINCT time_class FROM observations WHERE account_key=?", (account_key,))]
            for mode in modes:
                for row in db.execute("SELECT data FROM goals WHERE account_key=? AND time_class=?", (account_key, mode)).fetchall():
                    goal = json.loads(row[0])
                    stored_view = db.execute("SELECT data FROM current_ratings WHERE account_key=? AND time_class=?", (account_key, mode)).fetchone()
                    goal_current = json.loads(stored_view[0]) if stored_view else {}
                    source_resource = (goal_current.get("confirmed") or {}).get("resourceKey")
                    if goal.get("needsRevalidation") and source_resource in verified_resources and (goal_current.get("checkedAtMs") or 0) >= goal.get("resumedAtMs", 0):
                        goal["needsRevalidation"] = False
                        self._save_goal(db, goal)
                self._rebuild(db, account_key, mode)
                self._historical_completion(db, account_key, mode)
            self._prune(db)
            row = db.execute("SELECT attempt FROM refresh_jobs WHERE account_key=?", (account_key,)).fetchone()
            attempt = row[0] if row else 0
            unresolved = db.execute("SELECT 1 FROM completed_games WHERE account_key=? AND state='awaiting-publication'", (account_key,)).fetchone()
            delays = (5000, 15000, 30000, 60000, 120000, 300000)
            delay = delays[min(attempt, len(delays) - 1)] if unresolved and attempt < len(delays) else 900000
            if errors:
                delay = max(delay if unresolved else 5000, min(900000, (5000, 15000, 60000, 300000)[min(attempt, 3)]))
            retry_at = max([now + delay] + [error.retry_at for error in errors if error.retry_at])
            next_data = json.dumps({"error": self.last_error, "token": uuid.uuid4().hex})
            if original_job_data is not None:
                db.execute("UPDATE refresh_jobs SET due_at=?,attempt=?,data=? WHERE resource=? AND data=?", (retry_at, attempt + 1 if unresolved or errors else 0, next_data, account_key, original_job_data))
            else:
                db.execute("INSERT OR IGNORE INTO refresh_jobs VALUES(?,?,?,?,?)", (account_key, account_key, retry_at, 0, next_data))

    def _promote_identity(self, db, old_key, name, player_id):
        new_key = f"chesscom:player:{player_id}"
        if old_key == new_key:
            return
        collisions = db.execute("SELECT 1 FROM goals a JOIN goals b ON a.time_class=b.time_class WHERE a.account_key=? AND b.account_key=? AND a.state!='archived' AND b.state!='archived' LIMIT 1", (old_key, new_key)).fetchone()
        if collisions:
            raise TrackerError("IDENTITY_GOAL_CONFLICT", 409)
        db.execute("UPDATE players SET username=? WHERE account_key=?", ("__promotion__" + uuid.uuid4().hex, old_key))
        db.execute("INSERT INTO players(account_key,username,player_id,identity_status,generation) VALUES(?,?,?,'verified',1) ON CONFLICT(account_key) DO UPDATE SET username=excluded.username,identity_status='verified',generation=generation+1", (new_key, name, player_id))
        for table in ("goals", "observations", "completed_games", "rating_changes", "notifications"):
            for row in db.execute("SELECT rowid,data FROM " + table + " WHERE account_key=?", (old_key,)).fetchall():
                payload = json.loads(row["data"])
                payload["accountKey"] = new_key
                db.execute("UPDATE OR IGNORE " + table + " SET account_key=?,data=? WHERE rowid=?", (new_key, json.dumps(payload), row["rowid"]))
            db.execute("DELETE FROM " + table + " WHERE account_key=?", (old_key,))
        for table in ("player_aliases", "game_aliases"):
            db.execute("UPDATE OR IGNORE " + table + " SET account_key=? WHERE account_key=?", (new_key, old_key))
            db.execute("DELETE FROM " + table + " WHERE account_key=?", (old_key,))
        db.execute("DELETE FROM current_ratings WHERE account_key=?", (old_key,))
        db.execute("DELETE FROM refresh_jobs WHERE account_key=?", (old_key,))
        db.execute("DELETE FROM monitoring_preferences WHERE account_key=?", (old_key,))
        db.execute("INSERT OR REPLACE INTO monitoring_preferences VALUES(?,1)", (new_key,))
        db.execute("DELETE FROM players WHERE account_key=?", (old_key,))
        for row in db.execute("SELECT key,value FROM metadata WHERE key LIKE 'sessionGoal:%'").fetchall():
            binding = json.loads(row["value"])
            if binding.get("accountKey") == old_key:
                binding["accountKey"] = new_key
                db.execute("UPDATE metadata SET value=? WHERE key=?", (json.dumps(binding), row["key"]))
        self._schedule(db, new_key, self.clock())

    def _ingest_archive(self, account, generation, response):
        games = response.body.get("games")
        if not isinstance(games, list) or len(games) > 20000:
            raise TrackerError("INVALID_ARCHIVE_RESPONSE", 502)
        parsed = []
        complete_modes = {"bullet", "blitz", "rapid", "daily"}
        for game in games:
            if not isinstance(game, dict) or game.get("rules") != "chess" or game.get("time_class") not in ("bullet", "blitz", "rapid", "daily"):
                continue
            participant = next((game.get(side) for side in ("white", "black") if isinstance(game.get(side), dict) and str(game[side].get("username", "")).lower() == account["username"]), None)
            if not participant:
                continue
            try:
                mode = category(game["time_class"])
                key = game_key(game.get("url"), mode)
                if ":unknown:" in key:
                    key = key.replace(":unknown:", ":daily:" if mode == "daily" else ":live:")
                ended = timestamp(game.get("end_time")) * 1000
                if ended > self.clock() + 300000:
                    complete_modes.discard(mode)
                    continue
                rated = game.get("rated")
                if rated is not None and not isinstance(rated, bool):
                    complete_modes.discard(mode)
                    continue
                rating = integer(participant.get("rating")) if rated is True else None
            except TrackerError:
                complete_modes.discard(game.get("time_class"))
                continue
            if rated is None:
                complete_modes.discard(mode)
            parsed.append((game, participant, mode, key, ended, rated, rating))
        with self.repository.transaction() as db:
            current = self._account(db, key=account["account_key"])
            self._require_monitoring(db, current["account_key"])
            if current["generation"] != generation or self.stopping.is_set():
                return
            modes = set()
            for game, participant, mode, key, ended, rated, rating in parsed:
                account_key = account["account_key"]
                data = {"gameKey": key, "username": account["username"], "timeClass": mode, "rated": rated,
                        "endedAtMs": ended, "result": participant.get("result", "unknown"), "proofSource": "pubapi-archive", "recordDigest": digest(game)}
                state = "confirmed" if rated else "skipped-unrated" if rated is False else "unresolved"
                unknown_key = key.replace(":live:", ":unknown:").replace(":daily:", ":unknown:")
                unknown = db.execute("SELECT time_class FROM completed_games WHERE account_key=? AND game_key=?", (account_key, unknown_key)).fetchone()
                if unknown and unknown["time_class"] == mode:
                    db.execute("INSERT OR IGNORE INTO game_aliases VALUES(?,?,?)", (account_key, unknown_key, key))
                    db.execute("UPDATE completed_games SET state='resolved-alias' WHERE account_key=? AND game_key=?", (account_key, unknown_key))
                db.execute("INSERT INTO completed_games VALUES(?,?,?,?,?,?,?) ON CONFLICT(account_key,game_key) DO UPDATE SET time_class=excluded.time_class,rated=excluded.rated,ended_at=excluded.ended_at,state=excluded.state,data=excluded.data", (account_key, key, mode, None if rated is None else int(rated), ended, state, json.dumps(data)))
                if rated is True:
                    item = RatingObservation(account_key, account["username"], mode, rating, "pubapi-archive", self.clock(), ended,
                                             response.resource, key, digest(game), generation).to_dict()
                    self._store_observation(db, item)
                modes.add(mode)
            for mode in modes:
                self._archive_changes(db, account["account_key"], mode, response.resource, mode in complete_modes)
                self._rebuild(db, account["account_key"], mode, response.checked_at, response.valid_until, response.resource, False)

    def _archive_changes(self, db, account_key, mode, resource, complete=True):
        observations = [json.loads(row[0]) for row in db.execute("SELECT data FROM observations WHERE account_key=? AND time_class=? AND source='pubapi-archive' ORDER BY effective_at", (account_key, mode))]
        by_time = {}
        by_game = {}
        for item in observations:
            by_time.setdefault(item["sourceEffectiveAtMs"], []).append(item)
            by_game.setdefault(item["gameKey"], []).append(item)
        contested = {item["observationId"] for cohort in by_game.values() if len({(item["rating"], item["sourceEffectiveAtMs"]) for item in cohort}) > 1 for item in cohort}
        for row in db.execute("SELECT change_id,data FROM rating_changes WHERE account_key=? AND time_class=?", (account_key, mode)).fetchall():
            change = json.loads(row["data"])
            if change.get("scope") == "single-game" and (not complete or change.get("fromObservationId") in contested or change.get("toObservationId") in contested):
                change.update(status="contested", sequenceComplete=False)
                db.execute("UPDATE rating_changes SET data=? WHERE change_id=?", (json.dumps(change), row["change_id"]))
        if not complete:
            return
        previous = None
        for effective in sorted(by_time):
            cohort = by_time[effective]
            if any(item["observationId"] in contested for item in cohort) or len({item.get("gameKey") for item in cohort}) != 1 or len({item["rating"] for item in cohort}) != 1:
                previous = None
                continue
            current = cohort[0]
            if previous and current["resourceKey"] == previous["resourceKey"] == resource:
                change_id = digest(["single-game", previous["observationId"], current["observationId"]])
                change = {"changeId": change_id, "fromObservationId": previous["observationId"], "toObservationId": current["observationId"], "delta": current["rating"] - previous["rating"], "scope": "single-game", "sequenceComplete": True, "gameKeys": [current["gameKey"]], "observedAtMs": self.clock(), "sourceEffectiveAtMs": effective, "status": "confirmed"}
                db.execute("INSERT OR IGNORE INTO rating_changes VALUES(?,?,?,?)", (change_id, account_key, mode, json.dumps(change)))
            previous = current

    def set_preferences(self, body):
        visible = body.get("onPageVisible")
        if not isinstance(visible, bool):
            raise TrackerError("INVALID_VISIBILITY")
        with self.repository.transaction() as db:
            db.execute("INSERT INTO metadata VALUES('onPageVisible',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value", (json.dumps(visible),))
        return {"onPageVisible": visible}

    def _historical_completion(self, db, account_key, mode):
        observations = [json.loads(row[0]) for row in db.execute("SELECT data FROM observations WHERE account_key=? AND time_class=? AND source='pubapi-archive' ORDER BY effective_at", (account_key, mode))]
        if not observations:
            return
        verified = reconcile(observations, self.clock())
        disputed = {value for conflict in verified["conflicts"] for value in conflict["observationIds"]}
        changes = [json.loads(row[0]) for row in db.execute("SELECT data FROM rating_changes WHERE account_key=? AND time_class=?", (account_key, mode))]
        completed_ids = {change["toObservationId"] for change in changes if change.get("scope") == "single-game" and change.get("sequenceComplete") and change.get("status") == "confirmed"}
        for row in db.execute("SELECT data FROM goals WHERE account_key=? AND time_class=? AND state='tracking'", (account_key, mode)).fetchall():
            goal = json.loads(row[0])
            if goal.get("baselineRating") is None or goal.get("needsRevalidation"):
                continue
            threshold = goal["threshold"]
            candidates = [item for item in observations if item["observationId"] not in disputed and item["observationId"] in completed_ids and item["sourceEffectiveAtMs"] >= max(goal["createdAtMs"], goal.get("baselineAtMs") or goal["createdAtMs"], goal.get("resumedAtMs", 0)) and (item["rating"] >= threshold if goal["direction"] == "at-least" else item["rating"] <= threshold)]
            if not candidates:
                continue
            first = candidates[0]
            reached, events = evaluate(goal, {"confirmed": first, "eligible": True}, self.clock())
            for field in ("currentRating", "progress", "rawProgress", "remainingPoints"):
                reached[field] = goal.get(field)
            reached["historicallyReached"] = True
            self._save_goal(db, reached)
            for event in events:
                notification_id = digest([goal["goalId"], goal["revision"], event["kind"], event["cycle"]])
                message = "Goal Reached" if goal["direction"] == "at-least" else "Threshold Reached"
                payload = dict(event, notificationId=notification_id, accountKey=account_key, goalId=goal["goalId"], message=message, createdAtMs=self.clock(), revision=0, acknowledged=False)
                db.execute("INSERT OR IGNORE INTO notifications(notification_id,account_key,goal_id,data) VALUES(?,?,?,?)", (notification_id, account_key, goal["goalId"], json.dumps(payload)))

    def _prune(self, db):
        now = self.clock()
        day = 86400000
        anchors = set()
        for row in db.execute("SELECT change_id,data FROM rating_changes").fetchall():
            item = json.loads(row["data"])
            if item.get("observedAtMs", now) < now - 365 * day:
                db.execute("DELETE FROM rating_changes WHERE change_id=?", (row["change_id"],))
            else:
                anchors.update((item.get("fromObservationId"), item.get("toObservationId")))
        for row in db.execute("SELECT data FROM goals"):
            item = json.loads(row[0])
            for revision in [item] + item.get("previousRevisions", []):
                anchors.update((revision.get("baselineObservationId"), revision.get("reachedObservationId")))
        for row in db.execute("SELECT data FROM current_ratings"):
            view = json.loads(row[0])
            for name in ("confirmed", "provisional"):
                if view.get(name):
                    anchors.add(view[name]["observationId"])
        for row in db.execute("SELECT observation_id,data FROM observations").fetchall():
            if row["observation_id"] not in anchors and json.loads(row["data"])["observedAtMs"] < now - 30 * day:
                db.execute("DELETE FROM observations WHERE observation_id=?", (row["observation_id"],))
        retained_games = {row[0] for row in db.execute("SELECT game_key FROM observations WHERE game_key IS NOT NULL")}
        for row in db.execute("SELECT account_key,game_key FROM completed_games WHERE ended_at<? AND state!='awaiting-publication'", (now - 365 * day,)).fetchall():
            if row["game_key"] not in retained_games:
                db.execute("DELETE FROM game_aliases WHERE account_key=? AND (game_key=? OR alias_key=?)", (row["account_key"], row["game_key"], row["game_key"]))
                db.execute("DELETE FROM completed_games WHERE account_key=? AND game_key=?", (row["account_key"], row["game_key"]))
        for row in db.execute("SELECT resource,data FROM http_cache").fetchall():
            value = json.loads(row["data"])
            if not value.get("blocked") and value.get("retryAtMs", 0) <= now and value.get("checkedAt", now) < now - 30 * day:
                db.execute("DELETE FROM http_cache WHERE resource=?", (row["resource"],))

    def delete_goal(self, goal_id, revision):
        integer(revision, "revision", 1, 9007199254740991)
        with self.repository.transaction() as db:
            goal = self._goal(db, goal_id)
            if goal["revision"] != revision:
                raise TrackerError("REVISION_CONFLICT", 409)
            db.execute("DELETE FROM notifications WHERE goal_id=?", (goal_id,))
            db.execute("DELETE FROM goals WHERE goal_id=?", (goal_id,))
            if not db.execute("SELECT 1 FROM goals WHERE account_key=? AND state IN ('tracking','awaiting-baseline','reached')", (goal["accountKey"],)).fetchone() and not active_sessions(db, goal["accountKey"], self.clock()):
                db.execute("UPDATE monitoring_preferences SET enabled=0 WHERE account_key=?", (goal["accountKey"],))
                db.execute("UPDATE players SET generation=generation+1 WHERE account_key=?", (goal["accountKey"],))
                db.execute("DELETE FROM refresh_jobs WHERE account_key=?", (goal["accountKey"],))
        return {"deleted": True}

    def delete_account(self, account_key):
        with self.repository.transaction() as db:
            account = self._account(db, key=account_key)
            aliases = [row[0] for row in db.execute("SELECT username FROM player_aliases WHERE account_key=?", (account_key,))]
            for table in ("notifications", "goals", "observations", "current_ratings", "completed_games", "game_aliases", "rating_changes", "refresh_jobs", "monitoring_preferences", "player_aliases"):
                db.execute("DELETE FROM " + table + " WHERE account_key=?", (account_key,))
            for name in set(aliases + [account["username"]]):
                db.execute("DELETE FROM http_cache WHERE resource=? OR resource LIKE ?", ("https://api.chess.com/pub/player/" + name, "https://api.chess.com/pub/player/" + name + "/%"))
            db.execute("DELETE FROM players WHERE account_key=?", (account_key,))
            db.execute("DELETE FROM metadata WHERE key=?", ("error:" + account_key,))
            for row in db.execute("SELECT key,value FROM metadata WHERE key LIKE 'sessionGoal:%'").fetchall():
                binding = json.loads(row["value"])
                if binding.get("accountKey") == account_key:
                    binding.update(active=False, target=None, deletedAtMs=self.clock())
                    binding.pop("goal", None)
                    binding.pop("accountKey", None)
                    db.execute("UPDATE metadata SET value=? WHERE key=?", (json.dumps(binding), row["key"]))
        if hasattr(self.client, "cancel"):
            for name in set(aliases + [account["username"]]):
                self.client.cancel(name)
        return {"deleted": True}

    def diagnostics(self):
        rows = self.repository.rows("SELECT resource,due_at,attempt FROM refresh_jobs")
        return {"schemaVersion": 1, "kind": "rating-tracker-diagnostics", "generatedAtMs": self.clock(),
                "workerRunning": bool(self.worker and self.worker.is_alive()), "pendingJobs": len(rows),
                "jobs": [{"dueAtMs": row["due_at"], "attempt": row["attempt"]} for row in rows],
                "lastError": self.last_error, "counts": {table: self.repository.rows("SELECT COUNT(*) AS count FROM " + table)[0]["count"] for table in ("players", "goals", "observations", "completed_games", "notifications")}}

    def snapshot(self, account_key=None, name=None):
        if name:
            name = username(name)
            found = self.repository.rows("SELECT account_key FROM players WHERE username=? UNION SELECT account_key FROM player_aliases WHERE username=?", (name, name))
            if not found:
                return {"schemaVersion": 1, "revision": 0, "accounts": [], "goals": [], "notifications": [], "errors": [], "preferences": {"onPageVisible": False}}
            account_key = found[0]["account_key"]
        condition, params = (" WHERE account_key=?", (account_key,)) if account_key else ("", ())
        with self.repository.lock:
            accounts = [{"accountKey": row["account_key"], "usernameCanonical": row["username"], "displayUsername": row["username"], "playerId": row["player_id"], "identityStatus": row["identity_status"]} for row in self.repository.rows("SELECT * FROM players" + condition, params)]
            goals = []
            account_errors = {}
            for account in accounts:
                failure = self.repository.rows("SELECT value FROM metadata WHERE key=?", ("error:" + account["accountKey"],))
                if failure and json.loads(failure[0]["value"]):
                    account_errors[account["accountKey"]] = json.loads(failure[0]["value"])
            now = self.clock()
            for row in self.repository.rows("SELECT data FROM goals" + condition + " ORDER BY rowid DESC", params):
                goal = json.loads(row["data"])
                views = self.repository.rows("SELECT data FROM current_ratings WHERE account_key=? AND time_class=?", (goal["accountKey"], goal["timeClass"]))
                view = json.loads(views[0]["data"]) if views else reconcile([], now)
                view["error"] = account_errors.get(goal["accountKey"])
                if not view.get("checkedAtMs") or now - view["checkedAtMs"] > 900000 or (view.get("cacheUntilMs") or 0) < now:
                    view["eligible"] = False
                    view["freshness"] = "stale"
                    if view["state"] == "verified":
                        view["state"] = "stale"
                goal["view"] = view
                goal.setdefault("currentRating", view["confirmed"]["rating"] if view["confirmed"] else None)
                goal.setdefault("remainingPoints", None)
                goal.setdefault("progress", None)
                goals.append(goal)
            notifications = []
            for row in self.repository.rows("SELECT data,acknowledged,revision FROM notifications" + condition + " ORDER BY rowid DESC LIMIT 100", params):
                notifications.append(dict(json.loads(row["data"]), acknowledged=bool(row["acknowledged"]), revision=row["revision"]))
            revision = int(self.repository.rows("SELECT value FROM metadata WHERE key='revision'")[0]["value"])
            preferences = self.repository.rows("SELECT value FROM metadata WHERE key='onPageVisible'")
        return {"schemaVersion": 1, "revision": revision, "accounts": accounts, "goals": goals, "notifications": notifications,
                "errors": list(account_errors.values()), "preferences": {"onPageVisible": json.loads(preferences[0]["value"]) if preferences else False}}

    def history(self, account_key=None, name=None, mode=None, cursor=0):
        if mode:
            category(mode)
        if not account_key:
            with self.repository.lock:
                account_key = self._account(self.repository.connection, name=username(name))["account_key"]
        cursor = integer(cursor, "cursor", 0, 100000000)
        query = "SELECT rowid,data FROM rating_changes WHERE account_key=?"
        parameters = [account_key]
        if mode:
            query += " AND time_class=?"
            parameters.append(mode)
        all_rows = self.repository.rows(query + " ORDER BY rowid DESC LIMIT 1000", parameters)
        rows = self.repository.rows(query + " AND rowid>? ORDER BY rowid LIMIT 101", parameters + [cursor])
        items = [dict(json.loads(row["data"]), cursor=row["rowid"]) for row in rows[:100]]
        deltas = [json.loads(row["data"])["delta"] for row in all_rows if json.loads(row["data"])["scope"] == "single-game" and json.loads(row["data"]).get("status") == "confirmed"][:20]
        volatility = {"count": len(deltas), "median": statistics.median(deltas), "min": min(deltas), "max": max(deltas), "medianAbsolute": statistics.median(map(abs, deltas))} if len(deltas) >= 5 else None
        return {"items": items, "nextCursor": rows[99]["rowid"] if len(rows) > 100 else None, "volatility": volatility}

    def claim(self, notification_id, body):
        revision = integer(body.get("revision"), "revision", 0, 9007199254740991)
        consumer = body.get("consumerId")
        if not isinstance(consumer, str) or not 1 <= len(consumer) <= 128:
            raise TrackerError("INVALID_CONSUMER")
        with self.repository.transaction() as db:
            row = db.execute("SELECT * FROM notifications WHERE notification_id=?", (notification_id,)).fetchone()
            if not row:
                raise TrackerError("NOTIFICATION_NOT_FOUND", 404)
            enabled = db.execute("SELECT enabled FROM monitoring_preferences WHERE account_key=?", (row["account_key"],)).fetchone()
            if not enabled or not enabled[0] or row["acknowledged"] or row["revision"] != revision or row["claim_until"] > self.clock():
                raise TrackerError("NOTIFICATION_UNAVAILABLE", 409)
            token = secrets.token_urlsafe(24)
            db.execute("UPDATE notifications SET claim_token=?,claim_until=?,revision=revision+1 WHERE notification_id=?", (token, self.clock() + 30000, notification_id))
            return {"claimToken": token, "notification": json.loads(row["data"])}

    def acknowledge(self, notification_id, body):
        token = body.get("claimToken")
        if not isinstance(token, str):
            raise TrackerError("INVALID_CLAIM")
        with self.repository.transaction() as db:
            row = db.execute("SELECT claim_token,claim_until FROM notifications WHERE notification_id=?", (notification_id,)).fetchone()
            if not row or row["claim_token"] != token or row["claim_until"] < self.clock():
                raise TrackerError("INVALID_CLAIM", 409)
            db.execute("UPDATE notifications SET acknowledged=1,revision=revision+1 WHERE notification_id=?", (notification_id,))
        return {"acknowledged": True}

    def _run(self):
        while not self.stopping.is_set():
            try:
                self._retire_session_leases()
                jobs = self.repository.rows("SELECT account_key FROM refresh_jobs WHERE due_at<=? ORDER BY due_at LIMIT 1", (self.clock(),))
                if jobs:
                    self.process_account(jobs[0]["account_key"])
                    continue
            except (sqlite3.Error, TrackerError, ValueError, OSError):
                self.last_error = {"code": "TRACKER_UPDATE_FAILED", "retryable": True, "source": "rating-tracker"}
            self.wake.wait(1)
            self.wake.clear()


class UnavailableRatingTrackerService:
    def start(self):
        return None

    def stop(self):
        return None

    def snapshot(self, account_key=None, name=None):
        return {"schemaVersion": 1, "revision": 0, "accounts": [], "goals": [], "notifications": [],
                "unavailable": True, "preferences": {"onPageVisible": False}, "errors": [{"code": "HISTORY_COULD_NOT_BE_SAVED", "retryable": True, "source": "rating-tracker"}]}

    def __getattr__(self, name):
        def unavailable(*args, **kwargs):
            raise TrackerError("HISTORY_COULD_NOT_BE_SAVED", 503, True)
        return unavailable
