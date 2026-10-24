import math
import re
import threading
import time
import uuid
import json
from pathlib import Path
from urllib.parse import urlsplit

from flask import Blueprint, jsonify, request, send_from_directory


DEFAULT_CONFIG = {
    "hint": False, "autoMove": False, "autoQueue": False,
    "autoAdjust": False, "evalBar": False, "smartPacing": False,
    "banner": True, "recentForm": True, "elo": 3200,
    "delayMode": "random", "minDelay": 0.5, "maxDelay": 1.0,
    "color": "#10B981", "ghostMode": False,
    "sessionDurationMinutes": 120, "sessionMinimumPercent": 75, "sessionMaximumPercent": 82,
}


def valid_session_projection(projection):
    if not isinstance(projection, dict) or set(projection) != {'status', 'availability', 'sessionIdentity'}:
        return False
    status = projection['status']
    availability = projection['availability']
    identity = projection['sessionIdentity']
    if identity is not None and (not isinstance(identity, str) or not re.fullmatch(r'[0-9a-f]{32}:\d{1,16}', identity)):
        return False
    if not isinstance(availability, dict) or set(availability) != {'start', 'stop', 'export'} or any(value is not None and (not isinstance(value, str) or len(value) > 120) for value in availability.values()):
        return False
    if not isinstance(status, dict) or status.get('phase') not in {'IDLE', 'QUEUEING', 'IN_GAME', 'DRAINING', 'PAUSED_QUEUEING', 'PAUSED_ACTIVE', 'COMPLETED', 'ABORTED'} or status.get('role') not in {'LEADER', 'FOLLOWER'}:
        return False
    for key in ('remainingTtlMs', 'rawWinRate'):
        value = status.get(key)
        if type(value) not in (int, float) or not math.isfinite(value) or value < 0 or (key == 'rawWinRate' and value > 100):
            return False
    for key in ('posteriorWinRate', 'wilsonLower', 'wilsonUpper', 'minWinRate', 'maxWinRate'):
        value = status.get(key)
        if value is not None and (type(value) not in (int, float) or not math.isfinite(value) or not 0 <= value <= 100):
            return False
    for key in ('observedCounts', 'controlCounts'):
        counts = status.get(key)
        if not isinstance(counts, dict) or set(counts) != {'wins', 'draws', 'losses', 'terminalGames'} or any(type(value) is not int or not 0 <= value <= 2**53 - 1 for value in counts.values()) or counts['wins'] + counts['draws'] + counts['losses'] != counts['terminalGames']:
            return False
    return len(json.dumps(projection)) <= 16000


def create_external_config_blueprint():
    assets = Path(__file__).resolve().parents[1] / "frontend" / "external_config"
    panel = Blueprint("external_config", __name__)
    lock = threading.Lock()
    config = dict(DEFAULT_CONFIG)
    revision = 0
    last_seen = None
    applied_revision = -1
    banner_state = "unknown"
    server_id = uuid.uuid4().hex
    session = {"ownerId": None, "seen": 0, "sequence": 0, "projection": None}
    commands = {}

    def session_connected():
        return session['ownerId'] is not None and time.monotonic() - session['seen'] < 7

    def expire_commands():
        for command in commands.values():
            if command['state'] in {'queued', 'dispatched'} and (time.time() * 1000 >= command['expiresAt'] or not session_connected()):
                command.update(state='error', error='Chess.com connection was lost. Check the session before retrying.')

    @panel.before_request
    def protect_session_bridge():
        if request.path.startswith('/config/session'):
            origin = request.headers.get('Origin')
            allowed = {request.host_url.rstrip('/'), 'https://www.chess.com', 'https://chess.com'}
            if origin and origin.rstrip('/') not in allowed:
                return jsonify({'error': 'Origin not allowed'}), 403
            if request.headers.get('Sec-Fetch-Site') == 'cross-site' and origin not in {'https://www.chess.com', 'https://chess.com'}:
                return jsonify({'error': 'Origin not allowed'}), 403
            if request.remote_addr not in {'127.0.0.1', '::1'}:
                return jsonify({'error': 'Local configuration access required'}), 403

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
        nonlocal last_seen, applied_revision, banner_state
        with lock:
            if request.headers.get("X-Thinker-Client") == "userscript":
                last_seen = time.monotonic()
                value = request.headers.get("X-Thinker-Applied-Revision", "-1")
                applied_revision = int(value) if re.fullmatch(r"-?\d{1,12}", value) and request.headers.get("X-Thinker-Server") == server_id else -1
                value = request.headers.get("X-Thinker-Banner-State", "unknown")
                banner_state = value if value in {"visible", "disabled", "ghost-mode", "board-unavailable", "sidebar-unavailable", "route-not-supported", "insufficient-space-or-height", "awaiting-layout"} else "unknown"
            return jsonify({**config, "_revision": revision, "_serverId": server_id})

    @panel.get("/config/status")
    def status():
        with lock:
            expire_commands()
            connected = last_seen is not None and time.monotonic() - last_seen < 7
            return jsonify({"revision": revision, "userscriptConnected": connected,
                            "applied": connected and applied_revision == revision,
                            "bannerState": banner_state if connected else "disconnected",
                            "sessionConnected": session_connected(), "sessionProjection": session['projection'] if session_connected() else None,
                            "sessionSequence": session['sequence']})

    @panel.post('/config/session/bridge')
    def session_bridge():
        data = request.get_json(silent=True)
        if not isinstance(data, dict) or not isinstance(data.get('clientId'), str) or not re.fullmatch(r'[a-zA-Z0-9-]{8,80}', data['clientId']) or len(json.dumps(data)) > 1048576:
            return jsonify({'error': 'Invalid session projection'}), 400
        projection = data.get('projection')
        if not valid_session_projection(projection):
            return jsonify({'error': 'Session status and availability are required'}), 400
        with lock:
            expire_commands()
            owner = data['clientId']
            if session_connected() and session['ownerId'] != owner:
                leader_takeover = projection['status']['role'] == 'LEADER' and session['projection']['status'].get('role') != 'LEADER' and not any(item['state'] in {'queued', 'dispatched'} for item in commands.values())
                if not leader_takeover:
                    return jsonify({'owner': False, 'command': None})
            session.update(ownerId=owner, seen=time.monotonic(), projection=projection, sequence=session['sequence'] + 1)
            ack = data.get('ack')
            if isinstance(ack, dict) and ack.get('id') in commands:
                command = commands[ack['id']]
                if command['ownerId'] == owner and command['state'] == 'dispatched':
                    completed = ack.get('ok') is True and command.get('consumed') is True
                    command.update(state='completed' if completed else 'error', error=str(ack.get('error', 'Session action was not authorized'))[:300], result=ack.get('result') if completed else None)
            command = next((item for item in commands.values() if item['state'] == 'queued' and item['ownerId'] == owner), None)
            if command:
                command['state'] = 'dispatched'
            return jsonify({'owner': True, 'command': command, 'serverId': server_id})

    @panel.post('/config/session/commands')
    def session_command():
        data = request.get_json(silent=True)
        if not isinstance(data, dict) or data.get('action') not in {'start', 'stop', 'export'} or not isinstance(data.get('id'), str) or not re.fullmatch(r'[a-zA-Z0-9-]{8,80}', data['id']):
            return jsonify({'error': 'Invalid session action'}), 400
        with lock:
            expire_commands()
            if data['id'] in commands:
                return jsonify(commands[data['id']])
            if not session_connected():
                return jsonify({'error': 'Open Chess.com with the userscript to use session actions.'}), 409
            projection = session['projection']
            blocker = projection['availability'].get(data['action'], 'STATUS_UNAVAILABLE')
            if blocker:
                return jsonify({'error': str(blocker)}), 409
            if data.get('configRevision') != revision or data.get('serverId') != server_id:
                return jsonify({'error': 'Settings changed. Refresh and retry.'}), 409
            if any(item['state'] in {'queued', 'dispatched'} for item in commands.values()):
                return jsonify({'error': 'A session action is already pending.'}), 409
            if len(commands) >= 100:
                commands.pop(next(iter(commands)))
            command = {'id': data['id'], 'action': data['action'], 'ownerId': session['ownerId'], 'state': 'queued',
                       'expiresAt': time.time() * 1000 + 8000, 'sessionIdentity': projection.get('sessionIdentity'),
                       'config': {key: config[key] for key in ('sessionDurationMinutes', 'sessionMinimumPercent', 'sessionMaximumPercent')}}
            commands[data['id']] = command
            return jsonify(command), 202

    @panel.get('/config/session/commands/<command_id>')
    def session_command_result(command_id):
        with lock:
            expire_commands()
            command = commands.get(command_id)
            return (jsonify(command), 200) if command else (jsonify({'error': 'Session action expired'}), 404)

    @panel.post('/config/session/commands/<command_id>/authorize')
    def authorize_session_command(command_id):
        data = request.get_json(silent=True) or {}
        with lock:
            expire_commands()
            command = commands.get(command_id)
            if not command or command['state'] != 'dispatched' or command.get('consumed') or not session_connected() or data.get('clientId') != session['ownerId'] or command['ownerId'] != session['ownerId'] or command['sessionIdentity'] != session['projection'].get('sessionIdentity'):
                return jsonify({'error': 'Session action is no longer current'}), 409
            command['consumed'] = True
            return jsonify({'ok': True})

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
        expected_revision = data.pop('_expectedRevision', None) if isinstance(data, dict) else None
        expected_server = data.pop('_serverId', None) if isinstance(data, dict) else None
        if not isinstance(data, dict) or not data or set(data) - set(DEFAULT_CONFIG):
            return jsonify({"ok": False, "error": "Unknown or empty configuration fields"}), 400
        for key, value in data.items():
            default = DEFAULT_CONFIG[key]
            valid = True
            if isinstance(default, bool):
                valid = type(value) is bool
            elif key == "elo":
                valid = type(value) is int and 800 <= value <= 3200
            elif key == 'sessionDurationMinutes':
                valid = type(value) is int and 1 <= value <= 1440
            elif key in ('sessionMinimumPercent', 'sessionMaximumPercent'):
                valid = type(value) in (int, float) and math.isfinite(value) and 0 < value < 100
            elif key in ("minDelay", "maxDelay"):
                valid = type(value) in (int, float) and 0 <= value <= 10 and math.isfinite(value)
            elif key == "delayMode":
                valid = value in ("random", "max")
            elif key == "color":
                valid = isinstance(value, str) and re.fullmatch(r"#[0-9a-fA-F]{6}", value)
            if not valid:
                return jsonify({"ok": False, "error": f"Invalid {key}"}), 400
        with lock:
            if expected_revision is not None and (expected_revision != revision or expected_server != server_id):
                return jsonify({'ok': False, 'error': 'Configuration revision changed', 'config': {**config, '_revision': revision, '_serverId': server_id}}), 409
            updated = {**config, **data}
            if updated['sessionMinimumPercent'] >= updated['sessionMaximumPercent']:
                return jsonify({'ok': False, 'error': 'Minimum win rate must be below maximum win rate'}), 400
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
