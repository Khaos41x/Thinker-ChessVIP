import hashlib
import json
import re

from .contracts import TrackerError, category, game_key, integer, username
from .goals import evaluate


PREFIX = "sessionGoal:"
HEARTBEAT_TTL_MS = 900000


def lease_live(binding, now):
    return 0 <= now - binding.get("lastSeenAtMs", binding["createdAtMs"]) < HEARTBEAT_TTL_MS


def active_sessions(db, account_key, now):
    return any(item.get("active") and item.get("accountKey") == account_key and item.get("target") is not None and lease_live(item, now)
               for item in (json.loads(row[0]) for row in db.execute("SELECT value FROM metadata WHERE key LIKE 'sessionGoal:%'")))


def retire_expired_sessions(service, db, account_key=None):
    affected = set()
    for row in db.execute("SELECT value FROM metadata WHERE key LIKE 'sessionGoal:%'").fetchall():
        binding = json.loads(row[0])
        key = binding.get("accountKey")
        if not binding.get("active") or binding.get("target") is None or not key or account_key and key != account_key or lease_live(binding, service.clock()):
            continue
        affected.add(key)
        if not binding.get("dormantAtMs"):
            binding["dormantAtMs"] = service.clock()
            save(db, binding)
    for key in affected:
        if active_sessions(db, key, service.clock()) or db.execute("SELECT 1 FROM goals WHERE account_key=? AND state IN ('tracking','awaiting-baseline','reached') LIMIT 1", (key,)).fetchone():
            continue
        enabled = db.execute("SELECT enabled FROM monitoring_preferences WHERE account_key=?", (key,)).fetchone()
        if enabled and enabled[0]:
            db.execute("UPDATE monitoring_preferences SET enabled=0 WHERE account_key=?", (key,))
            db.execute("UPDATE players SET generation=generation+1 WHERE account_key=?", (key,))
        db.execute("DELETE FROM refresh_jobs WHERE account_key=?", (key,))


def save(db, binding):
    db.execute("INSERT INTO metadata VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
               (PREFIX + binding["sessionId"], json.dumps(binding)))


def validate(body):
    required = {"sessionId", "sessionAccountKey", "username", "timeClass", "active"}
    if not isinstance(body, dict) or not required <= set(body) or set(body) - required - {"completedGameUrl"}:
        raise TrackerError("INVALID_SESSION_BINDING")
    session_id = body["sessionId"]
    if not isinstance(session_id, str) or not re.fullmatch(r"[0-9a-f]{32}", session_id):
        raise TrackerError("INVALID_SESSION_ID")
    name = username(body["username"])
    mode = category(body["timeClass"])
    account_hash = hashlib.sha256(("chess.com:" + name).encode("utf-8")).hexdigest()
    if body["sessionAccountKey"] != account_hash:
        raise TrackerError("SESSION_ACCOUNT_MISMATCH", 409)
    if not isinstance(body["active"], bool):
        raise TrackerError("INVALID_ACTIVE_FLAG")
    if body.get("completedGameUrl") is not None:
        game_key(body["completedGameUrl"], mode)
    return session_id, name, mode


def register(service, db, binding, profile):
    name = binding["username"]
    if username(profile.get("username", "")) != name:
        raise TrackerError("IDENTITY_CONFLICT", 409)
    player_id = profile.get("player_id")
    if player_id is not None:
        integer(player_id, "player_id", 1, 9007199254740991)
    key = f"chesscom:player:{player_id}" if player_id is not None else f"chesscom:username:{name}"
    existing = db.execute("SELECT account_key,player_id FROM players WHERE username=?", (name,)).fetchone()
    if existing and existing["account_key"] != key:
        if existing["player_id"] is None and player_id is not None:
            service._promote_identity(db, existing["account_key"], name, player_id)
        else:
            raise TrackerError("IDENTITY_CONFLICT", 409)
    owner = db.execute("SELECT username,identity_status FROM players WHERE account_key=?", (key,)).fetchone()
    if owner and (owner["username"] != name or owner["identity_status"] == "conflict"):
        raise TrackerError("IDENTITY_CONFLICT", 409)
    db.execute("INSERT INTO players(account_key,username,player_id,identity_status) VALUES(?,?,?,'verified') ON CONFLICT(account_key) DO UPDATE SET identity_status='verified'", (key, name, player_id))
    db.execute("INSERT OR IGNORE INTO player_aliases VALUES(?,?)", (name, key))
    db.execute("INSERT INTO monitoring_preferences VALUES(?,1) ON CONFLICT(account_key) DO UPDATE SET enabled=1", (key,))
    if not db.execute("SELECT 1 FROM refresh_jobs WHERE account_key=?", (key,)).fetchone():
        service._schedule(db, key, service.clock())
    binding["accountKey"] = key
    binding.pop("error", None)


def response(service, db, binding):
    result = {name: binding[name] for name in ("sessionId", "sessionAccountKey", "username", "timeClass", "target")}
    result.update(schemaVersion=1, state="awaiting-rating", eligible=False, reached=False, confirmedRating=None, currentRating=None)
    if binding["target"] is None:
        result["state"] = "disabled"
        return result
    goal = binding.get("goal", {})
    if not binding["active"]:
        result.update(state="reached" if goal.get("state") == "reached" else "completed", reached=goal.get("state") == "reached",
                      confirmedRating=goal.get("currentRating"), currentRating=goal.get("currentRating"))
        return result
    key = binding.get("accountKey")
    if not key:
        if binding.get("error"):
            result.update(state="error", error=binding["error"])
        return result
    player = db.execute("SELECT username,identity_status FROM players WHERE account_key=?", (key,)).fetchone()
    if not player or player["username"] != binding["username"] or player["identity_status"] != "verified":
        result.update(state="error", error=TrackerError("IDENTITY_CONFLICT", 409).payload())
        return result
    row = db.execute("SELECT data FROM current_ratings WHERE account_key=? AND time_class=?", (key, binding["timeClass"])).fetchone()
    view = json.loads(row[0]) if row else {}
    failure = db.execute("SELECT value FROM metadata WHERE key=?", ("error:" + key,)).fetchone()
    error = json.loads(failure[0]) if failure else None
    confirmed = view.get("confirmed")
    if confirmed:
        result.update(confirmedRating=confirmed["rating"], currentRating=confirmed["rating"])
    pending = db.execute("SELECT 1 FROM completed_games WHERE account_key=? AND (time_class=? OR time_class IS NULL) AND state='awaiting-publication' LIMIT 1", (key, binding["timeClass"])).fetchone()
    now = service.clock()
    eligible = bool(view.get("eligible") and confirmed and confirmed.get("source", "").startswith("pubapi-")
                    and confirmed.get("usernameCanonical") == binding["username"] and confirmed.get("timeClass") == binding["timeClass"]
                    and confirmed.get("accountKey") == key and not pending and not error
                    and view.get("checkedAtMs") is not None and 0 <= now - view["checkedAtMs"] <= 900000
                    and view["checkedAtMs"] >= binding.get("revalidateAfterMs", 0)
                    and (view.get("cacheUntilMs") or 0) >= now and view.get("state") != "conflict")
    if error:
        result.update(state="error", error=error)
    if not eligible:
        job = db.execute("SELECT due_at FROM refresh_jobs WHERE account_key=?", (key,)).fetchone()
        if not error and (job is None or job["due_at"] > now) and not pending:
            service._schedule(db, key, now)
            service.wake.set()
        return result
    if not goal:
        goal = {"state": "awaiting-baseline", "threshold": binding["target"], "createdAtMs": binding["createdAtMs"],
                "direction": "at-least" if binding["target"] >= confirmed["rating"] else "at-most",
                "baselineRating": None, "proximityArmed": True, "proximityCycle": 0}
    goal, _ = evaluate(goal, dict(view, eligible=True), now)
    binding["goal"] = goal
    binding.pop("revalidateAfterMs", None)
    result.update(state=goal["state"], eligible=True, reached=goal["state"] == "reached", direction=goal["direction"])
    return result


def session_goal(service, body):
    session_id, name, mode = validate(body)
    with service.session_goal_lock:
        with service.repository.transaction() as db:
            row = db.execute("SELECT value FROM metadata WHERE key=?", (PREFIX + session_id,)).fetchone()
            binding = json.loads(row[0]) if row else None
            if binding and any(binding[key] != value for key, value in (("username", name), ("timeClass", mode), ("sessionAccountKey", body["sessionAccountKey"]))):
                raise TrackerError("SESSION_IDENTITY_CONFLICT", 409)
            if binding is None:
                target_row = db.execute("SELECT value FROM metadata WHERE key='ratingTarget'").fetchone()
                target = json.loads(target_row[0]) if target_row else None
                if target is not None:
                    integer(target, "target")
                binding = {"sessionId": session_id, "sessionAccountKey": body["sessionAccountKey"], "username": name,
                           "timeClass": mode, "target": target, "active": body["active"], "createdAtMs": service.clock(), "lastSeenAtMs": service.clock()}
                if not body["active"]:
                    return response(service, db, binding)
                save(db, binding)
            if not body["active"] and binding["active"]:
                binding["active"] = False
                binding["finishedAtMs"] = service.clock()
                save(db, binding)
                key = binding.get("accountKey")
                if key and not active_sessions(db, key, service.clock()) and not db.execute("SELECT 1 FROM goals WHERE account_key=? AND state IN ('tracking','awaiting-baseline','reached') LIMIT 1", (key,)).fetchone():
                    db.execute("UPDATE monitoring_preferences SET enabled=0 WHERE account_key=?", (key,))
                    db.execute("UPDATE players SET generation=generation+1 WHERE account_key=?", (key,))
                    db.execute("DELETE FROM refresh_jobs WHERE account_key=?", (key,))
            if binding["target"] is None or not binding["active"]:
                return response(service, db, binding)
            if not lease_live(binding, service.clock()):
                binding["revalidateAfterMs"] = service.clock()
                prefix = "https://api.chess.com/pub/player/" + name
                for cached in db.execute("SELECT resource,data FROM http_cache WHERE resource=? OR resource LIKE ?", (prefix, prefix + "/%")).fetchall():
                    value = json.loads(cached["data"])
                    value["validUntil"] = 0
                    db.execute("UPDATE http_cache SET data=? WHERE resource=?", (json.dumps(value), cached["resource"]))
            binding["lastSeenAtMs"] = service.clock()
            binding.pop("dormantAtMs", None)
            save(db, binding)
        if not binding.get("accountKey"):
            try:
                profile = service.client.request(name, "profile").body
                with service.repository.transaction() as db:
                    register(service, db, binding, profile)
                    save(db, binding)
                service.wake.set()
            except TrackerError as exc:
                binding["error"] = exc.payload()
                with service.repository.transaction() as db:
                    save(db, binding)
                    return response(service, db, binding)
        with service.repository.transaction() as db:
            key = binding["accountKey"]
            player = db.execute("SELECT username,identity_status FROM players WHERE account_key=?", (key,)).fetchone()
            preference = db.execute("SELECT enabled FROM monitoring_preferences WHERE account_key=?", (key,)).fetchone()
            if player and player["username"] == name and player["identity_status"] == "verified" and (not preference or not preference[0]):
                db.execute("INSERT INTO monitoring_preferences VALUES(?,1) ON CONFLICT(account_key) DO UPDATE SET enabled=1", (key,))
                if not db.execute("SELECT 1 FROM refresh_jobs WHERE account_key=?", (key,)).fetchone():
                    service._schedule(db, key, service.clock())
                    service.wake.set()
        if body.get("completedGameUrl"):
            service.ingest_terminal({"username": name, "timeClass": mode, "gameUrl": body["completedGameUrl"], "proofDigest": "session:" + session_id})
        with service.repository.transaction() as db:
            result = response(service, db, binding)
            save(db, binding)
        return result
