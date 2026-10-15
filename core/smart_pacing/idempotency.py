from __future__ import annotations

import hashlib
import json
import sqlite3
import threading
import time
import uuid
from contextlib import contextmanager
from pathlib import Path


class MovePlanIdempotencyStore:
    def __init__(self, path, *, capacity=50_000, epoch=time.time):
        self.path = str(Path(path))
        self.capacity = capacity
        self.epoch = epoch
        self._writes = 0
        self._lock = threading.Lock()
        self._initialize()

    def _connect(self):
        connection = sqlite3.connect(self.path, timeout=5, isolation_level=None)
        connection.execute("PRAGMA journal_mode=WAL")
        connection.execute("PRAGMA synchronous=FULL")
        connection.execute("PRAGMA busy_timeout=5000")
        return connection

    @contextmanager
    def _connection(self):
        connection = self._connect()
        try:
            yield connection
        finally:
            connection.close()

    def _initialize(self):
        with self._connection() as connection:
            connection.execute(
                """CREATE TABLE IF NOT EXISTS move_plan_replay (
                    runtime_game_token TEXT NOT NULL,
                    request_id TEXT NOT NULL,
                    body_sha256 TEXT NOT NULL,
                    state TEXT NOT NULL CHECK(state IN ('PENDING','COMPLETE','INDETERMINATE')),
                    owner_id TEXT NOT NULL,
                    claim_epoch_ms INTEGER NOT NULL,
                    response_json BLOB,
                    expires_at_epoch_ms INTEGER NOT NULL,
                    updated_at_epoch_ms INTEGER NOT NULL,
                    PRIMARY KEY(runtime_game_token, request_id)
                )"""
            )
            connection.execute("CREATE INDEX IF NOT EXISTS move_plan_replay_expiry ON move_plan_replay(expires_at_epoch_ms)")
            now = int(self.epoch() * 1000)
            connection.execute("UPDATE move_plan_replay SET state='INDETERMINATE', updated_at_epoch_ms=? WHERE state='PENDING'", (now,))
            connection.execute("DELETE FROM move_plan_replay WHERE expires_at_epoch_ms<=? AND state!='PENDING'", (now,))

    @staticmethod
    def canonical_body_digest(payload):
        encoded = json.dumps(payload, ensure_ascii=True, separators=(",", ":"), sort_keys=True).encode("utf-8")
        return hashlib.sha256(encoded).hexdigest()

    def claim(self, runtime_game_token, request_id, payload, expires_at_epoch_ms):
        digest = self.canonical_body_digest(payload)
        owner = uuid.uuid4().hex
        now = int(self.epoch() * 1000)
        with self._lock, self._connection() as connection:
            connection.execute("BEGIN IMMEDIATE")
            row = connection.execute(
                "SELECT body_sha256,state,response_json FROM move_plan_replay WHERE runtime_game_token=? AND request_id=?",
                (runtime_game_token, request_id),
            ).fetchone()
            if row is not None:
                connection.commit()
                if row[0] != digest:
                    return {"status": "conflict"}
                if row[1] == "COMPLETE":
                    return {"status": "complete", "response": bytes(row[2])}
                return {"status": row[1].lower()}
            count = connection.execute("SELECT COUNT(*) FROM move_plan_replay").fetchone()[0]
            if count >= self.capacity:
                connection.rollback()
                return {"status": "capacity"}
            connection.execute(
                "INSERT INTO move_plan_replay VALUES (?,?,?,?,?,?,?,?,?)",
                (runtime_game_token, request_id, digest, "PENDING", owner, now, None, expires_at_epoch_ms, now),
            )
            connection.commit()
            self._writes += 1
            if self._writes % 1000 == 0:
                self.cleanup()
        return {"status": "claimed", "owner": owner}

    def complete(self, runtime_game_token, request_id, owner, response_json):
        if not isinstance(response_json, bytes):
            raise TypeError("response_json must be bytes")
        now = int(self.epoch() * 1000)
        with self._lock, self._connection() as connection:
            connection.execute("BEGIN IMMEDIATE")
            changed = connection.execute(
                "UPDATE move_plan_replay SET state='COMPLETE',response_json=?,updated_at_epoch_ms=? WHERE runtime_game_token=? AND request_id=? AND state='PENDING' AND owner_id=?",
                (response_json, now, runtime_game_token, request_id, owner),
            ).rowcount
            if changed != 1:
                connection.rollback()
                raise RuntimeError("idempotency claim is no longer owned")
            connection.commit()

    def mark_indeterminate(self, runtime_game_token, request_id, owner):
        now = int(self.epoch() * 1000)
        with self._lock, self._connection() as connection:
            connection.execute(
                "UPDATE move_plan_replay SET state='INDETERMINATE',updated_at_epoch_ms=? WHERE runtime_game_token=? AND request_id=? AND state='PENDING' AND owner_id=?",
                (now, runtime_game_token, request_id, owner),
            )

    def cleanup(self):
        now = int(self.epoch() * 1000)
        with self._connection() as connection:
            connection.execute("DELETE FROM move_plan_replay WHERE expires_at_epoch_ms<=? AND state!='PENDING'", (now,))
