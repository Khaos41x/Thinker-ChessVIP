import ipaddress
import json
import sqlite3
import time
from collections import defaultdict, deque
from urllib.parse import urlsplit

from flask import Blueprint, Response, jsonify, request

from .contracts import TrackerError, digest


def create_rating_tracker_blueprint(service):
    panel = Blueprint("rating_tracker", __name__)
    rate_windows = defaultdict(deque)

    def loopback(host):
        if host == "localhost":
            return True
        try:
            return ipaddress.ip_address(host or "").is_loopback
        except ValueError:
            return False

    def allowed_origin():
        raw = request.headers.get("Origin")
        if raw is None:
            return None
        origin = urlsplit(raw)
        if origin.scheme not in ("http", "https") or origin.username or origin.password or origin.path not in ("", "/") or origin.query or origin.fragment:
            raise TrackerError("ORIGIN_NOT_ALLOWED", 403)
        if origin.scheme == "https" and origin.hostname in ("chess.com", "www.chess.com") and origin.port in (None, 443):
            return raw
        if origin.scheme == request.scheme and origin.netloc == request.host and loopback(origin.hostname):
            return raw
        raise TrackerError("ORIGIN_NOT_ALLOWED", 403)

    @panel.before_request
    def protect():
        try:
            host = urlsplit("http://" + request.host)
            if host.username or host.password or not loopback(host.hostname):
                raise TrackerError("LOOPBACK_REQUIRED", 403)
            allowed_origin()
            if request.content_length and request.content_length > 16384:
                raise TrackerError("REQUEST_TOO_LARGE", 413)
            if request.method not in ("GET", "OPTIONS") and not request.is_json:
                raise TrackerError("JSON_REQUIRED", 415)
            now = time.monotonic()
            key = request.remote_addr or "local"
            window = rate_windows[key]
            while window and window[0] < now - 60:
                window.popleft()
            if len(window) >= 240:
                raise TrackerError("LOCAL_RATE_LIMITED", 429, True)
            window.append(now)
            if request.method == "OPTIONS":
                return "", 204
            service.start()
        except (ValueError, TrackerError) as exc:
            if not isinstance(exc, TrackerError):
                exc = TrackerError("INVALID_ORIGIN", 403)
            return jsonify(error=exc.payload()), exc.status

    @panel.after_request
    def headers(response):
        response.headers["Cache-Control"] = "no-store"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers.pop("Access-Control-Allow-Origin", None)
        try:
            origin = allowed_origin()
            host = urlsplit("http://" + request.host)
            if origin and loopback(host.hostname) and response.status_code != 403:
                response.headers["Access-Control-Allow-Origin"] = origin
                response.headers["Vary"] = "Origin"
                response.headers["Access-Control-Allow-Methods"] = "GET, POST, PATCH, DELETE, OPTIONS"
                response.headers["Access-Control-Allow-Headers"] = "Content-Type, If-None-Match"
                response.headers["Access-Control-Expose-Headers"] = "ETag"
        except (TrackerError, ValueError):
            pass
        return response

    @panel.errorhandler(TrackerError)
    def invalid(exc):
        return jsonify(error=exc.payload()), exc.status

    @panel.errorhandler(sqlite3.Error)
    def persistence_error(exc):
        return jsonify(error={"code": "HISTORY_COULD_NOT_BE_SAVED", "retryable": True, "source": "rating-tracker"}), 503

    def body():
        raw = request.stream.read(16385)
        if len(raw) > 16384:
            raise TrackerError("REQUEST_TOO_LARGE", 413)
        try:
            value = json.loads(raw)
        except (ValueError, UnicodeError) as exc:
            raise TrackerError("INVALID_JSON") from exc
        if not isinstance(value, dict):
            raise TrackerError("INVALID_JSON")
        return value

    @panel.route("/rating-goals/target", methods=["GET", "POST"])
    def target():
        return jsonify(service.rating_target(body() if request.method == "POST" else None))

    @panel.get("/rating-goals/snapshot")
    def snapshot():
        data = service.snapshot(request.args.get("accountKey"), request.args.get("username"))
        if data.get("unavailable"):
            return jsonify(data), 503
        etag = digest(data)
        if request.if_none_match.contains(etag):
            response = Response(status=304)
        else:
            response = jsonify(data)
        response.set_etag(etag)
        return response

    @panel.post("/rating-goals")
    def create():
        goal = service.create_goal(body())
        return jsonify(goal=goal, snapshot=service.snapshot()), 201

    @panel.patch("/rating-goals/<goal_id>")
    def patch(goal_id):
        goal = service.patch_goal(goal_id, body())
        return jsonify(goal=goal, snapshot=service.snapshot())

    @panel.post("/rating-goals/refresh")
    def refresh():
        data = body()
        service.refresh(data.get("accountKey"), data.get("username"))
        return jsonify(accepted=True), 202

    @panel.post("/rating-goals/preferences")
    def preferences():
        return jsonify(preferences=service.set_preferences(body()))

    @panel.delete("/rating-goals/<goal_id>")
    def delete_goal(goal_id):
        return jsonify(service.delete_goal(goal_id, body().get("revision")))

    @panel.delete("/rating-goals/accounts/<path:account_key>")
    def delete_account(account_key):
        body()
        return jsonify(service.delete_account(account_key))

    @panel.get("/rating-goals/diagnostics")
    def diagnostics():
        return jsonify(service.diagnostics())

    @panel.post("/rating-observations/dom")
    def dom():
        return jsonify(service.ingest_dom(body())), 202

    @panel.post("/rating-games/terminal")
    def terminal():
        return jsonify(service.ingest_terminal(body())), 202

    @panel.get("/rating-goals/history")
    def history():
        try:
            cursor = int(request.args.get("cursor", "0"))
        except ValueError as exc:
            raise TrackerError("INVALID_CURSOR") from exc
        return jsonify(service.history(request.args.get("accountKey"), request.args.get("username"), request.args.get("timeClass"), cursor))

    @panel.post("/rating-notifications/<notification_id>/claim")
    def claim(notification_id):
        return jsonify(service.claim(notification_id, body()))

    @panel.post("/rating-notifications/<notification_id>/ack")
    def acknowledge(notification_id):
        return jsonify(service.acknowledge(notification_id, body()))

    return panel
