import json
import sqlite3
import threading
from contextlib import contextmanager
from pathlib import Path


class Repository:
    def __init__(self, path):
        self.path = str(Path(path).resolve())
        Path(self.path).parent.mkdir(parents=True, exist_ok=True)
        self.lock = threading.RLock()
        self.connection = sqlite3.connect(self.path, timeout=3, check_same_thread=False)
        try:
            self.connection.row_factory = sqlite3.Row
            self.connection.execute("PRAGMA foreign_keys=ON")
            self.connection.execute("PRAGMA journal_mode=WAL")
            version = self.connection.execute("PRAGMA user_version").fetchone()[0]
            if version not in (0, 1):
                raise RuntimeError("Unsupported rating tracker schema")
            self.connection.executescript((Path(__file__).parent / "migrations/001.sql").read_text(encoding="utf-8"))
        except BaseException:
            self.connection.close()
            raise

    @contextmanager
    def transaction(self):
        with self.lock:
            self.connection.execute("BEGIN IMMEDIATE")
            try:
                yield self.connection
                self.connection.execute("UPDATE metadata SET value=CAST(value AS INTEGER)+1 WHERE key='revision'")
                self.connection.commit()
            except BaseException:
                self.connection.rollback()
                raise

    def rows(self, query, parameters=()):
        with self.lock:
            return [dict(row) for row in self.connection.execute(query, parameters).fetchall()]

    def cache_get(self, resource):
        values = self.rows("SELECT data FROM http_cache WHERE resource=?", (resource,))
        return json.loads(values[0]["data"]) if values else None

    def cache_set(self, resource, value):
        with self.transaction() as db:
            db.execute("INSERT INTO http_cache VALUES(?,?) ON CONFLICT(resource) DO UPDATE SET data=excluded.data", (resource, json.dumps(value)))

    def close(self):
        with self.lock:
            self.connection.close()
