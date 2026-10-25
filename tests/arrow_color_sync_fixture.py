import importlib.util
import sys
from pathlib import Path
from flask import Response
ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('visual', ROOT / 'tests/phase091_visual_fixture.py')
visual = importlib.util.module_from_spec(spec)
spec.loader.exec_module(visual)
def instrumented_userscript():
    source = (ROOT / 'script.js').read_text(encoding='utf8')
    anchor = '  let cached_board = null;'
    if source.count(anchor) != 1:
        raise RuntimeError('Arrow test hook anchor changed')
    source = source.replace(anchor, '  window.__arrowColorQA = { draw: create_div, highlight: create_elm };\n' + anchor)
    return Response(source, content_type='application/javascript')
visual.app.view_functions['userscript'] = instrumented_userscript
if __name__ == '__main__':
    visual.app.run(host='127.0.0.1', port=int(sys.argv[1]), threaded=True, use_reloader=False)
