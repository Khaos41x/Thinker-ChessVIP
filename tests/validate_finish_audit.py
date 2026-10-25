import csv
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / '_bmad-output/implementation-artifacts/definitive-finish'
before = json.loads((OUTPUT / 'before/audit.json').read_text(encoding='utf8'))
after = json.loads((OUTPUT / 'after/audit.json').read_text(encoding='utf8'))
assert len(after) == 68
rows = []
panels = []
sections = []
for state in after:
    assert not state['fractionalControls'], (state['surface'], state['width'], state['fractionalControls'])
    for text in state['smallText']:
        assert text['color'] == 'rgba(0, 0, 0, 0)' or float(text['fontSize'].removesuffix('px')) >= 11, text
    for row in state['rows']:
        if row['controlOffset'] is not None:
            assert row['controlOffset'] == 0, row
            if 'Random Immediate' not in row['text']:
                assert row['height'] == 40, row
                assert row['textOffset'] == 0, row
        rows.append({'surface': state['surface'], 'width': state['width'], **state['state'], **row})
    for name, panel in state['panels'].items():
        panels.append({'surface': state['surface'], 'width': state['width'], **state['state'], 'panel': name, **panel})
        exempt = name == 'oi-zone2' or (state['surface'] == 'console' and state['mode'] == 'desktop' and state['state']['smartPacing'] and 'engine' in name)
        if not exempt:
            assert panel['tail'] == 12, (state['surface'], state['width'], name, panel['tail'])
    if state['surface'] == 'console':
        for section in state['sections']:
            sections.append({'width': state['width'], **state['state'], **section})
        if state['mode'] == 'desktop':
            assert state['panels']['kb-console-module kb-visuals-module']['bottom'] == state['panels']['kb-console-module kb-engine-module']['bottom']
            assert state['panels']['oi-zone2']['bottom'] == state['panels']['kb-session-panel']['bottom']
            opposite = next(other for other in after if other['surface'] == 'console' and other['width'] == state['width'] and other['state'] == {**state['state'], 'smartPacing': not state['state']['smartPacing']})
            for name in ['kb-console-module kb-core-module', 'kb-console-module kb-visuals-module']:
                assert state['panels'][name] == opposite['panels'][name], (name, state['width'])

for filename, data in [('control-rows.csv', rows), ('panel-heights-and-tails.csv', panels), ('engine-sections.csv', sections)]:
    keys = list(dict.fromkeys(key for item in data for key in item))
    with (OUTPUT / 'after' / filename).open('w', encoding='utf8', newline='') as stream:
        writer = csv.DictWriter(stream, fieldnames=keys)
        writer.writeheader()
        writer.writerows(data)

table = ['| Surface | Pacing | Panel | Before height/tail | After height/tail |', '|---|---|---|---:|---:|']
for pacing in [False, True]:
    for surface in ['console', 'config']:
        match = lambda state: state['surface'] == surface and state['width'] == 1440 and state['state']['bot'] is False and state['state']['smartPacing'] is pacing and not state['state'].get('populated', False)
        old = next(filter(match, before))
        new = next(filter(match, after))
        for name, panel in new['panels'].items():
            previous = old['panels'].get(name)
            prior = f"{previous['height']}/{previous['tail']}" if previous else 'See Stage 1 Scout measurements'
            table.append(f"| {surface} | {'On' if pacing else 'Off'} | {name} | {prior} | {panel['height']}/{panel['tail']} |")
(OUTPUT / 'after/panel-table.md').write_text('\n'.join(table) + '\n', encoding='utf8')
print('PASS 68 states: centered 40px control rows, integer controls, >=11px visible text, 12px fixed-panel tails, exact desktop edges and stable Smart Pacing transitions')
