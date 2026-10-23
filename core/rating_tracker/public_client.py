import email.utils
import hashlib
import json
import re
import socket
import threading
import time
import urllib.error
import urllib.request
from dataclasses import dataclass
from urllib.parse import urlsplit

from .contracts import TrackerError, username


@dataclass(frozen=True)
class PublicResponse:
    body: dict
    checked_at: int
    valid_until: int
    status: int
    resource: str
    digest: str


class SafeRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        parsed = urlsplit(newurl)
        if parsed.scheme != "https" or parsed.hostname != "api.chess.com" or parsed.port not in (None, 443) or parsed.username or parsed.password or parsed.query or parsed.fragment or not re.fullmatch(r"/pub/player/[a-z0-9_-]{2,50}(?:/stats|/games/archives|/games/\d{4}/\d{2})?", parsed.path):
            raise TrackerError("UNSAFE_PROVIDER_REDIRECT", 502)
        return super().redirect_request(req, fp, code, msg, headers, newurl)


class PublicDataClient:
    def __init__(self, repository, clock=None, opener=None):
        self.repository = repository
        self.clock = clock or (lambda: int(time.time() * 1000))
        self.opener = opener or urllib.request.build_opener(SafeRedirect())
        self.lock = threading.Lock()
        self.stopped = threading.Event()
        self.active_lock = threading.Lock()
        self.active_response = None
        self.active_name = None
        self.generations = {}

    def stop(self):
        self.stopped.set()
        self._abort_response()

    def cancel(self, name):
        with self.active_lock:
            self.generations[name] = self.generations.get(name, 0) + 1
            active = self.active_name == name
        if active:
            self._abort_response()

    def _abort_response(self):
        with self.active_lock:
            response = self.active_response
        if response is not None:
            try:
                raw_socket = getattr(getattr(getattr(response, "fp", None), "raw", None), "_sock", None)
                if raw_socket is not None:
                    raw_socket.shutdown(socket.SHUT_RDWR)
                response.close()
            except (OSError, ValueError):
                pass

    def _read(self, response, deadline):
        expired = threading.Event()

        def timeout():
            expired.set()
            self._abort_response()

        with self.active_lock:
            self.active_response = response
        timer = threading.Timer(max(0, deadline - time.monotonic()), timeout)
        timer.daemon = True
        timer.start()
        chunks = []
        total = 0
        try:
            read = getattr(response, "read1", response.read)
            while not self.stopped.is_set() and not expired.is_set():
                chunk = read(min(65536, 5 * 1024 * 1024 + 1 - total))
                if not chunk:
                    break
                chunks.append(chunk)
                total += len(chunk)
                if total > 5 * 1024 * 1024:
                    raise TrackerError("PROVIDER_RESPONSE_TOO_LARGE", 502)
        except (OSError, ValueError) as exc:
            if not expired.is_set() and not self.stopped.is_set():
                raise TrackerError("PROVIDER_STREAM_INTERRUPTED", 503, True) from exc
        finally:
            timer.cancel()
            with self.active_lock:
                self.active_response = None
        if self.stopped.is_set():
            raise TrackerError("CANCELLED", 503)
        if expired.is_set():
            raise TrackerError("PROVIDER_TIMEOUT", 503, True, self.clock() + 5000)
        return b"".join(chunks)

    def request(self, name, kind="stats", year=None, month=None):
        name = username(name)
        with self.active_lock:
            generation = self.generations.get(name, 0)
        suffixes = {"profile": "", "stats": "/stats", "archives": "/games/archives"}
        if kind == "month":
            if not isinstance(year, int) or not 2000 <= year <= 2200 or not isinstance(month, int) or not 1 <= month <= 12:
                raise TrackerError("INVALID_ARCHIVE_MONTH")
            suffix = f"/games/{year}/{month:02d}"
        elif kind in suffixes:
            suffix = suffixes[kind]
        else:
            raise TrackerError("INVALID_RESOURCE")
        resource = f"https://api.chess.com/pub/player/{name}{suffix}"
        with self.lock:
            if self.stopped.is_set():
                raise TrackerError("CANCELLED", 503)
            def check_generation():
                with self.active_lock:
                    if self.generations.get(name, 0) != generation:
                        raise TrackerError("CANCELLED", 503)
            check_generation()
            now = self.clock()
            cooldown = self.repository.cache_get("__provider_cooldown__")
            if cooldown and cooldown["until"] > now:
                raise TrackerError("PROVIDER_COOLDOWN", 503, True, cooldown["until"])
            cached = self.repository.cache_get(resource)
            if cached and cached.get("blocked"):
                raise TrackerError(cached.get("error", "PROVIDER_UNAVAILABLE"), cached.get("errorStatus", 502))
            if cached and cached.get("retryAtMs", 0) > now:
                raise TrackerError(cached.get("error", "PROVIDER_UNAVAILABLE"), 503, True, cached["retryAtMs"])
            if cached and cached.get("validUntil", 0) > now and "body" in cached:
                return self._response(cached, resource)
            for attempt in range(2):
                headers = {"Accept": "application/json", "User-Agent": "ThinkerChess-RatingTracker/1.0 (local read-only monitoring)"}
                if cached and attempt == 0:
                    if cached.get("etag"):
                        headers["If-None-Match"] = cached["etag"]
                    elif cached.get("lastModified"):
                        headers["If-Modified-Since"] = cached["lastModified"]
                request = urllib.request.Request(resource, headers=headers, method="GET")
                deadline = time.monotonic() + 10
                with self.active_lock:
                    self.active_name = name
                try:
                    response = self.opener.open(request, timeout=10)
                except urllib.error.HTTPError as exc:
                    response = exc
                except (OSError, TimeoutError) as exc:
                    failures = (cached or {}).get("failures", 0)
                    retry = now + (5000, 15000, 60000, 300000, 900000)[min(failures, 4)]
                    state = dict(cached or {}, retryAtMs=retry, failures=failures + 1, error="PROVIDER_UNAVAILABLE")
                    self.repository.cache_set(resource, state)
                    raise TrackerError("PROVIDER_UNAVAILABLE", 503, True, retry) from exc
                with response:
                    check_generation()
                    status = response.status
                    received = self.clock()
                    metadata = self._metadata(response.headers, received, cached or {})
                    if status == 304:
                        if not cached or "body" not in cached:
                            cached = None
                            continue
                        state = dict(cached, **metadata, status=304, retryAtMs=0)
                        self.repository.cache_set(resource, state)
                        return self._response(state, resource)
                    if status != 200:
                        failures = (cached or {}).get("failures", 0)
                        default_retry = min(900000, 60000 * (2 ** min(failures, 4))) if status == 429 else (5000, 15000, 60000, 300000, 900000)[min(failures, 4)]
                        retry = self._retry_at(response.headers.get("Retry-After"), received, default_retry)
                        if status == 429:
                            self.repository.cache_set("__provider_cooldown__", {"until": retry})
                        retryable = status == 429 or status >= 500
                        code = "PLAYER_NOT_FOUND" if status == 404 else "PLAYER_UNAVAILABLE" if status == 410 else "PROVIDER_RATE_LIMITED" if status == 429 else "PROVIDER_HTTP_ERROR"
                        self.repository.cache_set(resource, dict(cached or {}, retryAtMs=retry if retryable else 0, failures=failures + 1, error=code, errorStatus=status, blocked=not retryable))
                        raise TrackerError(code, 502 if status >= 500 else status, retryable, retry if retryable else None)
                    raw = self._read(response, deadline)
                    check_generation()
                    if self.stopped.is_set():
                        raise TrackerError("CANCELLED", 503)
                    if len(raw) > 5 * 1024 * 1024:
                        raise TrackerError("PROVIDER_RESPONSE_TOO_LARGE", 502)
                    try:
                        body = json.loads(raw)
                    except (ValueError, UnicodeError) as exc:
                        raise TrackerError("INVALID_PROVIDER_RESPONSE", 502) from exc
                    if not isinstance(body, dict):
                        raise TrackerError("INVALID_PROVIDER_RESPONSE", 502)
                    state = dict(metadata, body=body, digest=hashlib.sha256(raw).hexdigest(), status=200, retryAtMs=0)
                    self.repository.cache_set(resource, state)
                    return self._response(state, resource)
            raise TrackerError("INVALID_304", 502, True)

    @staticmethod
    def _retry_at(value, now, default):
        if value:
            if value.isdigit():
                return now + int(value) * 1000
            try:
                return max(now, int(email.utils.parsedate_to_datetime(value).timestamp() * 1000))
            except (ValueError, TypeError, OverflowError):
                pass
        return now + default

    @staticmethod
    def _metadata(headers, now, previous):
        cache_control = headers.get("Cache-Control", previous.get("cacheControl", ""))
        match = re.search(r"(?:^|,)\s*max-age=(\d+)", cache_control)
        age = headers.get("Age", "0")
        ttl = max(0, int(match[1]) - (int(age) if age.isdigit() else 0)) if match else 0
        if "no-store" in cache_control or "no-cache" in cache_control:
            ttl = 0
        return {"checkedAt": now, "validUntil": now + ttl * 1000, "etag": headers.get("ETag", previous.get("etag")),
                "lastModified": headers.get("Last-Modified", previous.get("lastModified")), "cacheControl": cache_control,
                "date": headers.get("Date"), "age": age}

    @staticmethod
    def _response(state, resource):
        return PublicResponse(state["body"], state["checkedAt"], state["validUntil"], state["status"], resource, state["digest"])
