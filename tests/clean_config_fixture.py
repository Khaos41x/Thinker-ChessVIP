import importlib.util
import json
from pathlib import Path
import sys
import time
import subprocess
from flask import jsonify, request, Response

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from core.external_config import DEFAULT_CONFIG
from core.rating_tracker.repository import Repository
import core.rating_tracker as tracker

preference = Path(sys.argv[sys.argv.index('--preferences') + 1])
if not preference.exists():
    preference.write_text(json.dumps({'version':1,'arrowColorVersion':1,'sessionFieldsVersion':1,'config':{**DEFAULT_CONFIG,'banner':False}}), encoding='utf8')
database = preference.with_suffix('.db')
repository = Repository(database)
if not repository.rows("SELECT value FROM metadata WHERE key='qaSeed'"):
    with repository.transaction() as db:
        db.execute("INSERT INTO metadata(key,value) VALUES('ratingTarget','1300')")
        db.execute("INSERT INTO metadata(key,value) VALUES('qaSeed','1')")
repository.close()
service_class = tracker.RatingTrackerService
tracker.RatingTrackerService = lambda *args, **kwargs: service_class(database, **kwargs)
spec = importlib.util.spec_from_file_location('clean_visual', ROOT / 'tests/phase091_visual_fixture.py')
visual = importlib.util.module_from_spec(spec)
spec.loader.exec_module(visual)
if '--console-baseline' in sys.argv:
    baseline_source = subprocess.check_output(['git','show','c884834:script.js'], cwd=ROOT).decode('utf8')
    visual.app.view_functions['userscript'] = lambda: Response(baseline_source, content_type='application/javascript')
qa = {}
original_status = visual.app.view_functions['external_config.status']
original_engines = visual.app.view_functions['analysis_engine_config.registry_status'] if 'analysis_engine_config.registry_status' in visual.app.view_functions else None


@visual.app.post('/qa/state')
def qa_state():
    qa.clear()
    qa.update(request.get_json())
    return jsonify(ok=True)


@visual.app.before_request
def qa_transport():
    if qa.get('offline') and request.path.startswith(('/config/load', '/config/status', '/config/engines')):
        return jsonify(error='Local server unavailable'), 503
    if request.path == '/config/engines':
        if qa.get('engineError'):
            return jsonify(error='Analysis engine unavailable'), 503
        if qa.get('loading'):
            time.sleep(4)


def qa_status():
    response = original_status()
    result = response.get_json()
    if 'connected' in qa:
        result.update(userscriptConnected=qa['connected'], applied=qa['connected'])
        result['userscriptVersion'] = qa.get('version', result['serverVersion']) if qa['connected'] else None
        result['userscriptUpdateRequired'] = qa['connected'] and result['userscriptVersion'] != result['serverVersion']
    return jsonify(result)


visual.app.view_functions['external_config.status'] = qa_status


@visual.app.get('/favicon.ico')
def favicon():
    return Response(status=204)

visual.app.run(host='127.0.0.1', port=int(sys.argv[1]), threaded=True, use_reloader=False)
