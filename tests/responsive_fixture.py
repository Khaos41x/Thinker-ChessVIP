import importlib.util
import sys
from pathlib import Path
from flask import Response

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT))
spec = importlib.util.spec_from_file_location('responsive_base',ROOT/'tests/phase091_visual_fixture.py')
visual = importlib.util.module_from_spec(spec)
spec.loader.exec_module(visual)
from core.status_page import status_page,status_artwork
visual.app.add_url_rule('/',view_func=status_page)
visual.app.add_url_rule('/status/horse.webp',view_func=status_artwork)

@visual.app.get('/responsive')
def responsive():
    source=visual.fixture().get_data(as_text=True).replace('width=1433, initial-scale=1','width=device-width, initial-scale=1')
    styles="""<style>
html,body{width:auto!important;min-width:0!important;overflow-x:visible!important}
.chess-navigation{width:clamp(48px,10vw,145px)}
.fixture-game-shell{margin-left:clamp(48px,10vw,145px);display:grid;grid-template-columns:minmax(0,640px) minmax(0,348px);gap:24px;padding:24px;min-height:0;align-items:start}
#board-layout-main,.board-layout-main{position:relative;left:auto;top:auto;width:100%;height:auto;display:grid;gap:10px}
wc-chess-board{position:relative;left:auto;top:auto;width:100%;height:auto;aspect-ratio:1}
#board-layout-player-top,#board-layout-player-bottom{position:relative;left:auto;top:auto;width:100%;height:30px}
.play-controller-component{position:relative;left:auto;top:auto;width:100%;height:500px}
.ad-rail{display:none}
@media(max-width:850px){.fixture-game-shell{grid-template-columns:minmax(0,1fr);padding:12px}.play-controller-component{height:260px}}
</style>"""
    rating = """<script>
    (()=>{
      const observer=new MutationObserver(()=>{
        if(!document.querySelector('#sp-on')||!window.ThinkerRatingTracker)return;
        observer.disconnect();
        ThinkerRatingTracker.start({window:new Proxy(window,{get(target,key){if(key==='location')return{hostname:'www.chess.com',href:'https://www.chess.com'+location.pathname};const value=Reflect.get(target,key,target);return typeof value==='function'&&!['MutationObserver'].includes(key)?value.bind(target):value;}}),baseUrl:location.origin,gmRequest:window.GM_xmlhttpRequest});
      });
      observer.observe(document.body,{childList:true,subtree:true});
    })();
    </script>"""
    return Response(source.replace('</head>',styles+'</head>').replace('</body>',rating+'</body>'),content_type='text/html')

visual.app.run(host='127.0.0.1',port=int(sys.argv[1]),threaded=True,use_reloader=False)
