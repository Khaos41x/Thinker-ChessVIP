import os
import sys
import tempfile
import threading
from pathlib import Path

from flask import Flask, Response, jsonify, request
from werkzeug.serving import make_server

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
temporary = tempfile.TemporaryDirectory(prefix='runtime-', dir=ROOT / '_bmad-output/implementation-artifacts/definitive-finish/block-a/pipeline')
os.environ['THINKER_CAPABILITY_TOKEN'] = 'recommendation-pipeline-local-fixture-token'
os.environ['THINKER_RATING_TRACKER_DB'] = str(Path(temporary.name) / 'ratings.db')
os.environ['THINKER_MOVE_PLAN_IDEMPOTENCY_DB'] = str(Path(temporary.name) / 'idempotency.db')
import app as production

production.get_book = lambda fen: None
production.initialize_engine()
app = Flask(__name__)
requests = []


@app.get('/')
def page():
    return Response('<!doctype html><html><head><meta charset="utf-8"></head><body></body></html>', content_type='text/html')


@app.post('/recommendation')
def recommendation():
    data = request.get_json()
    with production.app.test_client() as client:
        response = client.post('/getmove', json=data, headers={
            'Authorization': 'Bearer recommendation-pipeline-local-fixture-token',
            'Origin': 'https://www.chess.com',
        })
    requests.append({'fen': data.get('fen'), 'status': response.status_code, 'result': response.get_json(),
                     'engineReady': production.komodo.ready, 'engineGeneration': production.komodo.generation})
    return Response(response.data, status=response.status_code, content_type='application/json')


@app.get('/evidence')
def evidence():
    return jsonify({'engine': 'Komodo 14.1 via actual /getmove', 'requests': requests,
                    'engineReady': production.komodo.ready, 'engineGeneration': production.komodo.generation,
                    'lastSearchStats': production.komodo.last_search_stats})


server = make_server('127.0.0.1', int(sys.argv[1]), app, threaded=True)
thread = threading.Thread(target=server.serve_forever)
thread.start()
try:
    sys.stdin.readline()
finally:
    server.shutdown()
    thread.join()
    production.komodo.close()
    production.stockfish_eval_bar.close()
    production.analysis_engine_registry.close()
    production.rating_tracker.stop()
    production.rating_tracker.close()
    temporary.cleanup()
