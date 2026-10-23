import math
import re
import threading
import time
import uuid
from pathlib import Path
from urllib.parse import urlsplit

from flask import Blueprint, jsonify, request, send_from_directory


DEFAULT_CONFIG = {
    "hint": False, "autoMove": False, "autoQueue": False,
    "autoAdjust": False, "evalBar": False, "smartPacing": False,
    "banner": True, "recentForm": True, "elo": 3200,
    "delayMode": "random", "minDelay": 0.5, "maxDelay": 2.0,
    "color": "#10B981", "ghostMode": False,
}


def create_external_config_blueprint():
    assets = Path(__file__).resolve().parents[1] / "frontend" / "external_config"
    panel = Blueprint("external_config", __name__)
    lock = threading.Lock()
    config = dict(DEFAULT_CONFIG)
    revision = 0
    last_seen = None
    applied_revision = -1
    server_id = uuid.uuid4().hex

    @panel.after_request
    def prevent_cache(response):
        response.headers["Cache-Control"] = "no-store"
        return response

    @panel.get("/config")
    def page():
        response = send_from_directory(assets, "index.html")
        response.headers["Content-Security-Policy"] = "default-src 'self'; style-src 'self'; script-src 'self'; connect-src 'self'; img-src 'self' data:; frame-ancestors 'none'; base-uri 'none'"
        response.headers["X-Content-Type-Options"] = "nosniff"
        return response

    @panel.get("/config/assets/<path:filename>")
    def asset(filename):
        return send_from_directory(assets, filename)

    @panel.get("/config/load")
    def load():
        nonlocal last_seen, applied_revision
        with lock:
            if request.headers.get("X-Thinker-Client") == "userscript":
                last_seen = time.monotonic()
                value = request.headers.get("X-Thinker-Applied-Revision", "-1")
                applied_revision = int(value) if re.fullmatch(r"-?\d{1,12}", value) and request.headers.get("X-Thinker-Server") == server_id else -1
            return jsonify({**config, "_revision": revision, "_serverId": server_id})

    @panel.get("/config/status")
    def status():
        with lock:
            connected = last_seen is not None and time.monotonic() - last_seen < 7
            return jsonify({"revision": revision, "userscriptConnected": connected,
                            "applied": connected and applied_revision == revision})

    @panel.post("/config/save")
    def save():
        nonlocal revision
        origin = request.headers.get("Origin")
        local = urlsplit(request.host_url)
        allowed = {f"http://{host}:{local.port or 80}" for host in ("localhost", "127.0.0.1")}
        allowed.update({request.host_url.rstrip("/"), "https://www.chess.com", "https://chess.com"})
        normalized_origin = origin.rstrip("/") if origin else None
        if normalized_origin and normalized_origin not in allowed:
            return jsonify({"ok": False, "error": "Origin not allowed"}), 403
        if not request.is_json or request.content_length is None or request.content_length > 4096:
            return jsonify({"ok": False, "error": "Expected a small JSON configuration"}), 400
        data = request.get_json(silent=True)
        if not isinstance(data, dict) or not data or set(data) - set(DEFAULT_CONFIG):
            return jsonify({"ok": False, "error": "Unknown or empty configuration fields"}), 400
        for key, value in data.items():
            default = DEFAULT_CONFIG[key]
            valid = True
            if isinstance(default, bool):
                valid = type(value) is bool
            elif key == "elo":
                valid = type(value) is int and 800 <= value <= 3200
            elif key in ("minDelay", "maxDelay"):
                valid = type(value) in (int, float) and 0 <= value <= 10 and math.isfinite(value)
            elif key == "delayMode":
                valid = value in ("random", "max")
            elif key == "color":
                valid = isinstance(value, str) and re.fullmatch(r"#[0-9a-fA-F]{6}", value)
            if not valid:
                return jsonify({"ok": False, "error": f"Invalid {key}"}), 400
        with lock:
            updated = {**config, **data}
            if updated["delayMode"] == "random":
                updated["minDelay"] = max(0.01, updated["minDelay"])
                updated["maxDelay"] = max(0.01, updated["maxDelay"])
                updated["minDelay"], updated["maxDelay"] = sorted((updated["minDelay"], updated["maxDelay"]))
            if updated != config:
                config.clear()
                config.update(updated)
                revision += 1
            return jsonify({"ok": True, "revision": revision, "config": {**config, "_revision": revision, "_serverId": server_id}})

    return panel
