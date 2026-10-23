import sys
from pathlib import Path

from flask import Flask, send_from_directory

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from core.external_config import create_external_config_blueprint

app = Flask(__name__)
app.register_blueprint(create_external_config_blueprint())


@app.get('/tests/fixtures/userscript_bootstrap.html')
def fixture():
    return send_from_directory(ROOT / 'tests' / 'fixtures', 'userscript_bootstrap.html')


@app.get('/script.js')
def userscript():
    return send_from_directory(ROOT, 'script.js')


if __name__ == '__main__':
    app.run(host='127.0.0.1', port=int(sys.argv[1]), threaded=True)
