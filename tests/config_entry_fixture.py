import importlib.util
import subprocess
import sys
from flask import Response, request

spec = importlib.util.spec_from_file_location('entry_visual', 'tests/phase091_visual_fixture.py')
visual = importlib.util.module_from_spec(spec)
spec.loader.exec_module(visual)
from core.status_page import status_page, status_artwork
visual.app.add_url_rule('/', 'status_page', status_page)
visual.app.add_url_rule('/status/horse.webp', 'status_artwork', status_artwork)


@visual.app.get('/favicon.ico')
def fixture_favicon():
    return Response(status=204)


original_fixture = visual.app.view_functions['fixture']


def quiet_fixture():
    response = original_fixture()
    source = response.get_data(as_text=True)
    if request.args.get('quiet') == '1':
        bridge = '''<script>
          const fallbackGm=window.GM_xmlhttpRequest;
          window.__quietReplies=new Map();let quietSequence=0;
          window.__quietReply=(id,result)=>{const options=window.__quietReplies.get(id);if(!options)return;window.__quietReplies.delete(id);if(result.error)options.onerror?.({status:0});else options.onload?.(result);};
          window.GM_xmlhttpRequest=options=>{const endpoint=new URL(options.url);if(!['127.0.0.1','localhost'].includes(endpoint.hostname))return fallbackGm(options);const id=++quietSequence;window.__quietReplies.set(id,options);window.__quietGM(JSON.stringify({id,path:endpoint.pathname+endpoint.search,method:options.method||'GET',headers:options.headers,body:options.data}));return{abort(){window.__quietReplies.delete(id);options.onabort?.();}};};
        </script>'''
        source = source.replace('<script src="/script.js', bridge + '<script src="/script.js')
    if request.args.get('noScript') == '1':
        source = source.replace('<script src="/script.js?v=2026-10-04.2"></script>', '')
    response.set_data(source)
    return response


visual.app.view_functions['fixture'] = quiet_fixture
if '--baseline' in sys.argv:
    source = subprocess.check_output(['git', 'show', 'afbc827:script.js']).decode('utf8')
    visual.app.view_functions['userscript'] = lambda: Response(source, content_type='application/javascript')
visual.app.run(host='127.0.0.1', port=int(sys.argv[1]), threaded=True, use_reloader=False)
