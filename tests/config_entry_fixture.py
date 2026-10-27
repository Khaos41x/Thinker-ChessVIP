import importlib.util
import subprocess
import sys
from flask import Response

spec = importlib.util.spec_from_file_location('entry_visual', 'tests/phase091_visual_fixture.py')
visual = importlib.util.module_from_spec(spec)
spec.loader.exec_module(visual)
from core.status_page import status_page, status_artwork
visual.app.add_url_rule('/', 'status_page', status_page)
visual.app.add_url_rule('/status/horse.webp', 'status_artwork', status_artwork)
if '--baseline' in sys.argv:
    source = subprocess.check_output(['git', 'show', 'afbc827:script.js']).decode('utf8')
    visual.app.view_functions['userscript'] = lambda: Response(source, content_type='application/javascript')
visual.app.run(host='127.0.0.1', port=int(sys.argv[1]), threaded=True, use_reloader=False)
