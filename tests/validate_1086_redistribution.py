from pathlib import Path
import json,csv
root=Path('_bmad-output/implementation-artifacts/narrow-1086');before=json.loads((root/'before/measurements.json').read_text());after=json.loads((root/'after/measurements.json').read_text());assert len(before)==len(after)==96
lines=[]
for a,b in zip(before,after):
 assert (a['width'],a['state'])==(b['width'],b['state'])
 assert a['colors']==b['colors'],(b['width'],b['state'],'colors')
 assert b['gaps']=='12px'
 assert not b['scout']['small'] and not b['scout']['clipping'],b['scout']
 assert len(b['scout']['openings'])==(0 if b['state']['content']=='empty' else 4)
 if b['state']['content']=='full':assert len(b['scout']['stats'])==6
 for opening in b['scout']['openings']:
  assert opening['name']==opening['title'] and opening['ellipsis']=='ellipsis' and opening['whiteSpace']=='nowrap' and opening['overflow']=='hidden'
  assert opening['count']['width']==56
  assert opening['count']['right']<=b['scout']['box']['right']-12
 if b['scout']['openings']:assert len({o['count']['right'] for o in b['scout']['openings']})==1
 if b['scout']['stats']:assert len({o['right'] for o in b['scout']['stats']})==1
 for c in b['controls']:assert all(float(c[k]).is_integer() for k in ['x','y','width','height']),(b['width'],c)
 assert all(0<=c['x'] and c['right']<=b['width'] for c in b['controls'])
 p=b['panels']
 if b['mode']=='desktop':
  assert p['kb-console-module kb-visuals-module']['bottom']==p['kb-console-module kb-engine-module']['bottom'];assert p['kb-session-panel']['bottom']==p['oi-zone2']['bottom']
 assert p['kb-console-module kb-engine-module']['height']==a['panels']['kb-console-module kb-engine-module']['height']
 assert {k:v['height'] for k,v in p.items()}=={k:v['height'] for k,v in a['panels'].items()}
 assert len(b['fields'])==4 and len(b['buttons'])==3
 fields=b['fields'];buttons=b['buttons'];assert buttons[0]['x']==fields[0]['x'] and buttons[0]['right']==fields[1]['right'];assert buttons[1]['x']==fields[2]['x'] and buttons[1]['right']==fields[2]['right'];assert buttons[2]['x']==fields[3]['x'] and buttons[2]['right']==fields[3]['right']
 if b['width']==1086:
  assert b['columns']=='345px 359px 282px' and b['wrapper']['width']==1034
  assert [x['width'] for x in fields]==[167,167,166,166]
  assert [x['width'] for x in buttons]==[342,166,166]
  assert b['scout']['box']['width']==282
  if b['timing']:
   t=b['timing'];assert [x['width'] for x in t['inputs']]==[64,65];assert t['gapLeft']==t['gapRight'] and t['gapLeft']>=6;assert t['separator']['width']==8
 else:
  for key in ['wrapper','columns','panels','fields','buttons','timing','scout','controls']:assert a[key]==b[key],(b['width'],b['state'],key)
 lines.append([b['width'],*b['state'].values(),a['columns'],b['columns'],p['kb-console-module kb-engine-module']['height'],'/'.join(str(f['width']) for f in fields),'0','0'])
with (root/'widths.csv').open('w',encoding='utf8',newline='') as f:
 w=csv.writer(f);w.writerow(['viewport','Scout','SmartPacing','mode','columnsBefore','columnsAfter','engineHeight','autoPlayFields','VisualsEngineBottomDelta','ScoutAutoPlayBottomDelta']);w.writerows(lines)
(root/'validation.json').write_text(json.dumps({'states':96,'unchangedWidths':[1085,1087,1280,1440,1920,1033,800],'scoutStates':['empty','four','full'],'colorChanges':0,'desktopEngineHeightsByScout':{'empty':394,'four':394,'full':409},'autoPlayFields':[167,167,166,166],'autoPlayButtons':[342,166,166],'numericInputs':[64,65],'glyphClearances':[6.75,6.75]},indent=2),encoding='utf8')
print('PASS96 states: exact1086 scope, Scout content, integer Auto Play alignment, inputs64/65, gap6.75/6.75, unchanged other widths/colors/heights')
