import hashlib
import json
import subprocess
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from core.smart_pacing.security import CapabilityStore


def request(headers):
    message = urllib.request.Request('http://127.0.0.1:5050/eval-bar/engines', headers=headers)
    try:
        response = urllib.request.urlopen(message, timeout=5)
    except urllib.error.HTTPError as error:
        response = error
    return {'status': response.status, 'headers': dict(response.headers), 'body': json.load(response)}


store = CapabilityStore()
token = store.ensure()
origin = {'Origin': 'https://www.chess.com'}
responses = {
    'missingCapability': request(origin),
    'staleCapability': request({**origin, 'Authorization': 'Bearer invalid-regression-capability'}),
    'validCapability': request({**origin, 'Authorization': 'Bearer ' + token}),
}
assert responses['missingCapability']['status'] == 401
assert responses['staleCapability']['status'] == 401
assert responses['validCapability']['status'] == 200
assert len(responses['validCapability']['body']['engines']) == 3
assert store.ensure() == token
history = []
for commit in ['e1e705d', '3a503f6', 'b9624eb', '1926bde', 'c8ba23f', '37b878f', '1985a33']:
    source = subprocess.check_output(['git', 'show', commit + ':script.js'], cwd=ROOT).decode('utf8')
    begin = source.index('  const SHAFT_W =')
    end = source.index('  const create_elm =', begin)
    history.append({'commit': commit, 'geometrySha256': hashlib.sha256(source[begin:end].encode()).hexdigest(),
        'transportFailureMessagePresent': 'Cannot reach analysis engine' in source,
        'getmoveUsed': '/getmove' in source, 'drawCallPresent': 'create_div(' in source})
assert len({entry['geometrySha256'] for entry in history}) == 1
destination = ROOT / '_bmad-output/implementation-artifacts/connectivity-finish/block-1'
destination.mkdir(parents=True, exist_ok=True)
(destination / 'http-responses.json').write_text(json.dumps(responses, indent=2), encoding='utf8')
(destination / 'history.json').write_text(json.dumps(history, indent=2), encoding='utf8')
print('HTTP registry: missing capability=401, stale capability=401, valid capability=200 with three engines')
print('Arrow geometry unchanged across seven historical checkpoints; no runtime git-bisect of authenticated Chess.com is claimed')
