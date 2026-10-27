import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / '_bmad-output/implementation-artifacts/config-entry'
OUT.mkdir(parents=True, exist_ok=True)
command = ['rg', '--json', '--hidden', '--no-ignore', '-i', 'kryp|v2\.2', '.', '-g', '!.git/**', '-g', '!**/node_modules/**', '-g', '!**/__pycache__/**', '-g', '!engine/**', '-g', '!_bmad-output/implementation-artifacts/config-entry/**']
result = subprocess.run(command, cwd=ROOT, capture_output=True, encoding='utf8', errors='replace')
matches = []
for line in result.stdout.splitlines():
    entry = json.loads(line)
    if entry['type'] != 'match':
        continue
    data = entry['data']
    source = data['lines']['text']
    for match in re.finditer(r'kryp|v2\.2', source, re.I):
        context = source[max(0, match.start()-55):match.end()+100].strip()
        context = re.sub(r'(?i)Bearer\s+[\w.-]+', 'Bearer [redacted]', context)
        matches.append({'file': data['path']['text'], 'line': data['line_number'], 'context': context})
(OUT / 'brand-inventory.json').write_text(json.dumps(matches, ensure_ascii=False, indent=2), encoding='utf8')
paths = subprocess.check_output(['rg', '--files', '--hidden', '-g', '!.git/**', '-g', '!**/node_modules/**'], cwd=ROOT, encoding='utf8').splitlines()
(OUT / 'brand-paths.json').write_text(json.dumps([p for p in paths if re.search(r'kryp|v2\.2', p, re.I)], indent=2), encoding='utf8')
print(json.dumps({'occurrences':len(matches),'files':len({m['file'] for m in matches}),'excluded':'.git, dependencies, bytecode, engine binaries; private baselines included as historical copies'}))
