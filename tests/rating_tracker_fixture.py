import atexit
import json
import sys
import tempfile
import threading
import time
from pathlib import Path

from flask import Flask, jsonify, request, send_from_directory

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from core.external_config import create_external_config_blueprint
from core.rating_tracker.contracts import digest
from core.rating_tracker.public_client import PublicResponse
from core.rating_tracker.routes import create_rating_tracker_blueprint
from core.rating_tracker.service import RatingTrackerService


class FixtureClient:
    def __init__(self):
        self.lock = threading.RLock()
        self.rating = 1900
        self.base = int(time.time()) - 120
        self.games = [self.game(9001, 1900, self.base)]
        self.requests = []

    def game(self, game_id, rating, ended):
        return {"url": f"https://www.chess.com/game/live/{game_id}", "rated": True, "rules": "chess", "time_class": "blitz", "end_time": ended,
                "white": {"username": "tracker_user", "rating": rating, "result": "win"}, "black": {"username": "fixture_opponent", "rating": 1900, "result": "resigned"}}

    def request(self, name, kind="stats", year=None, month=None):
        with self.lock:
            self.requests.append(kind)
            now = int(time.time() * 1000)
            if kind == "profile":
                body = {"username": name, "player_id": 1001}
            elif kind == "stats":
                body = {"chess_" + mode: {"last": {"rating": self.rating, "date": self.games[-1]["end_time"], "rd": 50}} for mode in ("bullet", "blitz", "rapid", "daily")}
            else:
                body = {"games": list(self.games)}
            return PublicResponse(body, now, now + 60000, 200, f"fixture:{kind}:{name}", digest(body))

    def stop(self):
        pass


temporary = tempfile.TemporaryDirectory(prefix="thinker-rating-browser-")
client = FixtureClient()
service = RatingTrackerService(Path(temporary.name) / "tracker.db", client=client)
app = Flask(__name__)
app.register_blueprint(create_external_config_blueprint())
app.register_blueprint(create_rating_tracker_blueprint(service))
effects = []


@app.before_request
def audit():
    if request.path in ("/getmove", "/move-plan", "/queue", "/resign"):
        effects.append(request.path)


@app.get("/tests/state")
def state():
    return jsonify(snapshot=service.snapshot(), effects=effects, providerRequests=client.requests)


@app.post("/tests/advance")
def advance():
    data = request.get_json()
    with client.lock:
        client.rating = int(data["rating"])
        client.games.append(client.game(9000 + len(client.games) + 1, client.rating, max(int(time.time()), client.games[-1]["end_time"] + 1)))
    service.refresh(name="tracker_user")
    return jsonify(ok=True)


@app.get("/tests/browser-fixture")
def browser_fixture():
    base = request.host_url.rstrip("/")
    template = (ROOT / "tests/fixtures/userscript_bootstrap.html").read_text(encoding="utf-8")
    template = template.replace('<script src="../../script.js?v=2026-10-04.2"></script>', '')
    addition = f'''<script>
window.effects=[];window.GM_getValue=(_,fallback)=>fallback;window.GM_setValue=()=>{{}};
window.GM_xmlhttpRequest=options=>{{const controller=new AbortController();const url=new URL(options.url);if(!/^\\/(rating-|config\\/)/.test(url.pathname)){{if(['/getmove','/move-plan','/resign','/queue'].includes(url.pathname))window.effects.push(url.pathname);setTimeout(()=>options.onerror?.({{status:401}}),0);return{{abort(){{controller.abort()}}}};}}
fetch({json.dumps(base)}+url.pathname+url.search,{{method:options.method||'GET',headers:options.headers,body:options.data,signal:controller.signal}}).then(async response=>options.onload?.({{status:response.status,responseText:await response.text()}})).catch(()=>options.onerror?.({{status:0}}));return{{abort(){{controller.abort();options.onabort?.()}}}};}};
for(const name of ['hint','autoMove','autoQueue','autoAdjust','evalBar','smartPacing','banner'])localStorage.setItem(name,'false');
mountFixtureLayout();
history.replaceState({{}},'', '/game/live/9001');
document.querySelector('.chess-navigation').innerHTML='<a data-cy="nav-profile" href="/member/tracker_user">Account</a>';
document.getElementById('board-layout-player-top').classList.add('player-component');
document.getElementById('board-layout-player-top').innerHTML='<a href="/member/fixture_opponent">Opponent</a><span class="rating">1900</span>';
document.getElementById('board-layout-player-bottom').classList.add('player-component');
document.getElementById('board-layout-player-bottom').innerHTML='<a href="/member/tracker_user">Tracker User</a><span class="rating" id="own-rating">1900</span>';
document.querySelector('wc-chess-board').setAttribute('data-time-class','blitz');
</script>'''
    template = template.replace('setTimeout(window.mountFixtureLayout, mountDelay);', '')
    return template.replace('</body>', addition + '</body>')


@app.get("/script.js")
def userscript():
    return send_from_directory(ROOT, "script.js")


def close():
    service.close()
    temporary.cleanup()


atexit.register(close)

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=int(sys.argv[1]), threaded=True, use_reloader=False)
