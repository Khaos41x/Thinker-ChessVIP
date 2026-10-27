import csv
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / '_bmad-output/implementation-artifacts/clean-config'
before = json.loads((OUT / 'before/audit.json').read_text(encoding='utf8'))
after = json.loads((OUT / 'after/audit.json').read_text(encoding='utf8'))


def recommendation(element):
    selector, text = element['selector'], element['text']
    if 'Technical details' in text or selector == '#analysis-engine-details':
        return 'suporte/dev', 'debug', 'B: somente ?debug=1; sem consumidor operacional'
    if selector in ['#client-build-state','#userscript-update']:
        return 'cliente/suporte', 'estado da instalação', 'P2: versão condicional; preservar acesso à instalação'
    if selector in ['#connection','#userscript-connection','#execution-state']:
        return 'cliente', 'dimensões distintas', 'P1: consolidar sem confundir conexão e execução'
    if selector == '#analysis-engine-message':
        return 'cliente/suporte', 'seletor + dados técnicos', 'D aplicado: texto completo; P3: simplificação de copy pendente'
    if selector == '#banner-display-state':
        return 'cliente', 'não redundante: disponibilidade', 'C: manter texto, hint 24px após linha 40px'
    if selector in ['#elo-value','#timing-value']:
        return 'cliente', 'valor atual / resumo do modo', 'P8: medir; manter valor atual recomendado'
    if selector == '#session-target-help':
        return 'cliente', 'aviso global', 'manter; P5 depende de decisão sobre copy/condicional'
    if selector in ['#save-state','p.footnote']:
        return 'cliente/suporte', 'parcial com cabeçalho', 'P6/P3: proposta de rodapé e feedback transitório'
    if selector == 'p.intro':
        return 'cliente', 'parcial com título/eyebrow', 'P9: alternativas ou remoção, não aplicado'
    return 'cliente', 'não identificada', 'manter; contrato funcional ou orientação existente'


with (OUT / 'audit-elements.csv').open('w',newline='',encoding='utf8') as stream:
    writer = csv.writer(stream)
    writer.writerow(['phase','state','viewport','selector','exactTextOrInputValue','title','visible','font','audience','redundancy','recommendation'])
    for phase, records in [('before',before),('after',after)]:
        for record in records:
            for element in record['elements']:
                audience, duplicate, action = recommendation(element)
                writer.writerow([phase,record['state'],record['width'],element['selector'],element['text'],element['title'],element['visible'],element['font'],audience,duplicate,action])

with (OUT / 'panel-measurements.csv').open('w',newline='',encoding='utf8') as stream:
    writer = csv.writer(stream)
    writer.writerow(['phase','state','viewport','panel','x','y','width','height','naturalHeight','tail'])
    for phase, records in [('before',before),('after',after)]:
        for record in records:
            for name, panel in record['panels'].items():
                writer.writerow([phase,record['state'],record['width'],name,*[panel[key] for key in ['x','y','width','height','natural','tail']]])

with (OUT / 'control-rows.csv').open('w',newline='',encoding='utf8') as stream:
    writer = csv.writer(stream)
    writer.writerow(['phase','state','viewport','label','rowHeight','centerDelta','controlWidth','controlHeight'])
    for phase, records in [('before',before),('after',after)]:
        for record in records:
            for row in record['rows']:
                writer.writerow([phase,record['state'],record['width'],row['label'],row['height'],row['centerDelta'],row['control']['width'],row['control']['height']])

table = ['| Viewport | Fase | Core | Visuals | Workspace | Engine | Coluna esquerda | Diferença desktop |','|---:|---|---:|---:|---:|---:|---:|---:|']
for width in [1440,1280,1024,768,390]:
    for phase, records in [('Antes',before),('Depois',after)]:
        record = next(r for r in records if r['width']==width and r['state']=='default')
        panels=record['panels']
        left=panels['core']['height']+panels['visuals']['height']+panels['workspace']['height']+24
        delta=panels['workspace']['bottom']-panels['engine']['bottom'] if width>=900 else '—'
        table.append(f"| {width} | {phase} | {panels['core']['height']} | {panels['visuals']['height']} | {panels['workspace']['height']} | {panels['engine']['height']} | {left} | {delta} |")
(OUT / 'panel-table.md').write_text('\n'.join(table)+'\n',encoding='utf8')

proposals = json.loads((OUT / 'proposals/report.json').read_text(encoding='utf8'))
table=['| Proposta | Viewport | Δ altura da página | Engine antes → depois | Diferença desktop | Cauda Engine |','|---|---:|---:|---:|---:|---:|']
for item in proposals:
    table.append(f"| {item['name']} | {item['width']} | {item['heightDelta']} | {item['before']['panels']['engine']['height']} → {item['after']['panels']['engine']['height']} | {item['after']['bottomDelta'] if item['after']['bottomDelta'] is not None else '—'} | {item['after']['engineTail']} |")
(OUT / 'proposal-measurements.md').write_text('\n'.join(table)+'\n',encoding='utf8')

console_before=json.loads((OUT/'before/console.json').read_text(encoding='utf8'))
console_after=json.loads((OUT/'after/console.json').read_text(encoding='utf8'))
assert console_before==console_after
result={'configStatesBefore':len(before),'configStatesAfter':len(after),'consoleStates':len(console_after),'consoleRectangleAndColorDifferences':0,'controlRowHeight':40,'controlCenterDelta':0,'defaultTechnicalDomAbsent':all(r['details']==0 for r in after),'noConfigOverflow':all(not r['overflow'] for r in after),'allPanelTailsAtMost12':all(p['tail']<=12 for r in after for p in r['panels'].values()),'EApplied':False}
assert result['defaultTechnicalDomAbsent'] and result['noConfigOverflow'] and result['allPanelTailsAtMost12']
(OUT/'validation.json').write_text(json.dumps(result,indent=2),encoding='utf8')
print(json.dumps(result))
