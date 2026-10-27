import importlib.util
import subprocess
import sys
from flask import Response

spec = importlib.util.spec_from_file_location('entry_visual', 'tests/phase091_visual_fixture.py')
visual = importlib.util.module_from_spec(spec)
spec.loader.exec_module(visual)
if '--baseline' in sys.argv:
    source = subprocess.check_output(['git', 'show', 'afbc827:script.js']).decode('utf8')
    visual.app.view_functions['userscript'] = lambda: Response(source, content_type='application/javascript')
visual.app.run(host='127.0.0.1', port=int(sys.argv[1]), threaded=True, use_reloader=False)
