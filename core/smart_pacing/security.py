import json
import os
import secrets
import stat
import threading
import time
from collections import defaultdict, deque
from functools import wraps
from pathlib import Path

from flask import current_app, jsonify, request


class CapabilityStore:
    def __init__(self, path=None, environ=None):
        self.environ = environ if environ is not None else os.environ
        self.path = Path(path) if path else self._default_path()
        self._token = None
        self._lock = threading.Lock()

    def _default_path(self):
        configured = self.environ.get("THINKER_CAPABILITY_FILE")
        if configured:
            return Path(configured)
        local_app_data = self.environ.get("LOCALAPPDATA")
        if local_app_data:
            return Path(local_app_data) / "ThinkerChessVIP" / "capability.json"
        return Path.home() / ".config" / "thinker-chess-vip" / "capability.json"

    def ensure(self):
        configured_token = self.environ.get("THINKER_CAPABILITY_TOKEN")
        if configured_token:
            token = configured_token.strip()
            if len(token) < 32:
                raise ValueError("THINKER_CAPABILITY_TOKEN must contain at least 32 characters")
            return token
        with self._lock:
            if self._token:
                return self._token
            if self.path.exists():
                payload = json.loads(self.path.read_text(encoding="utf-8"))
                token = payload.get("token")
                if not isinstance(token, str) or len(token) < 32:
                    raise ValueError("invalid capability file")
                self._token = token
                return token
            token = secrets.token_urlsafe(32)
            self.path.parent.mkdir(parents=True, exist_ok=True)
            self.path.write_text(
                json.dumps({"schemaVersion": 1, "token": token}, indent=2) + "\n",
                encoding="utf-8",
            )
            try:
                self.path.chmod(stat.S_IRUSR | stat.S_IWUSR)
            except OSError:
                pass
            self._token = token
            return token

    def rotate(self):
        if self.environ.get("THINKER_CAPABILITY_TOKEN"):
            raise RuntimeError("environment-managed capability must be rotated externally")
        with self._lock:
            self._token = None
            if self.path.exists():
                self.path.unlink()
        return self.ensure()


class SlidingWindowRateLimiter:
    def __init__(self, limit=120, window_seconds=60, monotonic=time.monotonic):
        self.limit = int(limit)
        self.window_seconds = float(window_seconds)
        self.monotonic = monotonic
        self._events = defaultdict(deque)
        self._lock = threading.Lock()

    def allow(self, identity):
        now = self.monotonic()
        cutoff = now - self.window_seconds
        with self._lock:
            events = self._events[identity]
            while events and events[0] <= cutoff:
                events.popleft()
            if len(events) >= self.limit:
                return False
            events.append(now)
            return True


def require_engine_capability(
    store,
    *,
    allowed_origins,
    rate_limiter,
    max_payload_bytes=16_384,
    concurrency_limit=8,
):
    normalized_origins = {origin.rstrip("/").casefold() for origin in allowed_origins}
    concurrency = threading.BoundedSemaphore(concurrency_limit)

    def decorator(handler):
        @wraps(handler)
        def protected(*args, **kwargs):
            remote = request.remote_addr or ""
            if remote not in {"127.0.0.1", "::1", "localhost"}:
                return jsonify({"error": "loopback_required"}), 403
            origin = request.headers.get("Origin")
            if origin and origin.rstrip("/").casefold() not in normalized_origins:
                return jsonify({"error": "origin_not_allowed"}), 403
            if request.content_length is not None and request.content_length > max_payload_bytes:
                return jsonify({"error": "payload_too_large"}), 413
            if not rate_limiter.allow(remote):
                return jsonify({"error": "rate_limited"}), 429
            authorization = request.headers.get("Authorization", "")
            if not authorization.startswith("Bearer "):
                return jsonify({"error": "capability_required"}), 401
            supplied = authorization[7:].strip()
            expected = store.ensure()
            if not supplied or not secrets.compare_digest(supplied, expected):
                return jsonify({"error": "invalid_capability"}), 401
            if not concurrency.acquire(blocking=False):
                return jsonify({"error": "concurrency_limited"}), 429
            release_lease = True
            try:
                response = current_app.make_response(handler(*args, **kwargs))
                if response.is_streamed:
                    iterable = response.response

                    def guarded_stream():
                        try:
                            yield from iterable
                        finally:
                            close = getattr(iterable, "close", None)
                            try:
                                if callable(close):
                                    close()
                            finally:
                                concurrency.release()

                    response.response = guarded_stream()
                    release_lease = False
                return response
            finally:
                if release_lease:
                    concurrency.release()

        return protected

    return decorator
