import importlib.util
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

from flask import Flask, Response, send_from_directory

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
BEFORE = '--before' in sys.argv
baseline = ROOT / '.phase091-baseline'
if BEFORE and not baseline.exists():
    baseline_temporary = tempfile.TemporaryDirectory(prefix='thinker-phase091-before-')
    baseline = Path(baseline_temporary.name)
    for name in ('core/external_config.py', 'frontend/external_config/index.html', 'frontend/external_config/panel.js', 'frontend/external_config/panel.css', 'frontend/external_config/rating-tracker.js', 'script.js'):
        target = baseline / name
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(subprocess.check_output(['git', 'show', f'3a503f6:{name}'], cwd=ROOT))
if BEFORE:
    for name in ('rating-tracker.js',):
        shutil.copyfile(ROOT / 'frontend/external_config' / name, baseline / 'frontend/external_config' / name)
    spec = importlib.util.spec_from_file_location('external_visual_baseline', baseline / 'core/external_config.py')
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    create_external_config_blueprint = module.create_external_config_blueprint
else:
    from core.external_config import create_external_config_blueprint

app = Flask(__name__)
app.register_blueprint(create_external_config_blueprint())
temporary = tempfile.TemporaryDirectory(prefix='thinker-phase091-visual-')
from core.rating_tracker import RatingTrackerService, create_rating_tracker_blueprint
rating_service = RatingTrackerService(str(Path(temporary.name) / 'ratings.db'))
app.register_blueprint(create_rating_tracker_blueprint(rating_service))
if not BEFORE:
    from core.eval_bar.registry import EngineRegistry
    from core.eval_bar.routes import create_engine_registry_blueprint
    from core.smart_pacing.security import CapabilityStore, SlidingWindowRateLimiter, require_engine_capability
    registry = EngineRegistry(ROOT, ROOT / 'engine/komodo-14.1-64bit.exe', Path(temporary.name) / 'engine.json')
    auth = require_engine_capability(CapabilityStore(environ={'THINKER_CAPABILITY_TOKEN': 'phase091-visual-isolated-capability'}),
        allowed_origins={'https://www.chess.com'}, rate_limiter=SlidingWindowRateLimiter(limit=1000))
    app.register_blueprint(create_engine_registry_blueprint(registry, auth))

@app.get('/tests/fixtures/userscript_bootstrap.html')
def fixture():
    source = (ROOT / 'tests/fixtures/userscript_bootstrap.html').read_text(encoding='utf8')
    bridge = '''<script>
      window.GM_getValue=(key,fallback)=>key==='thinkerEngineCapability'?'phase091-visual-isolated-capability':fallback;
      localStorage.setItem('evalBar','false');localStorage.setItem('kb_eval_unlock_v7','true');
      const originalFixtureRequest = window.GM_xmlhttpRequest;
      window.GM_xmlhttpRequest = options => {
        const endpoint = new URL(options.url);
        if (!['/config/','/rating-','/eval-bar/engines'].some(prefix=>endpoint.pathname.startsWith(prefix))) return originalFixtureRequest(options);
        const controller = new AbortController();
        fetch(location.origin + endpoint.pathname + endpoint.search, {method:options.method || 'GET', headers:{...options.headers,...(endpoint.pathname.startsWith('/eval-bar/engines')?{Authorization:'Bearer phase091-visual-isolated-capability'}:{})}, body:options.data, signal:controller.signal})
          .then(async response => options.onload?.({status:response.status,responseText:await response.text()}))
          .catch(error => options.onerror?.({status:0,error:String(error)}));
        return {abort:()=>controller.abort()};
      };
    </script>'''
    source = source.replace('<script src="../../script.js', bridge + '<script src="/script.js')
    return Response(source, content_type='text/html')

@app.get('/script.js')
def userscript():
    return send_from_directory(baseline if BEFORE else ROOT, 'script.js')

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=int(sys.argv[1]), threaded=True, use_reloader=False)
