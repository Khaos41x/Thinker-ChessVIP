import sys
import threading
from pathlib import Path

from flask import Flask, jsonify, request
from werkzeug.serving import make_server

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from core.external_config import create_external_config_blueprint
from core.eval_bar.registry import EngineRegistry
from core.eval_bar.routes import create_engine_registry_blueprint

app = Flask(__name__)
registry = EngineRegistry(ROOT, ROOT / 'engine/komodo-14.1-64bit.exe', Path(sys.argv[2]))
app.register_blueprint(create_external_config_blueprint())


def control_auth(function):
    def authenticated():
        if request.headers.get('Authorization') != 'Bearer phase091-test':
            return jsonify({'error': 'Unauthorized'}), 401
        return function()
    authenticated.__name__ = function.__name__
    return authenticated


app.register_blueprint(create_engine_registry_blueprint(registry, control_auth))
server = make_server('127.0.0.1', int(sys.argv[1]), app, threaded=True)
thread = threading.Thread(target=server.serve_forever)
thread.start()
try:
    sys.stdin.readline()
finally:
    server.shutdown()
    thread.join()
    registry.close()
