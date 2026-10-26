from pathlib import Path
import json,csv
root=Path('_bmad-output/implementation-artifacts/config-controls');before=json.loads((root/'before/measurements.json').read_text());after=json.loads((root/'after/measurements.json').read_text());colors=[];pairs=0
with (root/'after/toggles.csv').open('w',newline='',encoding='utf8') as f:
 w=csv.writer(f);w.writerow(['surface','viewport','bot','rating','pacing','key','checked','trackWidth','trackHeight','thumb','top','bottom','left','right','rowCenterDelta','contentRightDelta','timingHeaderDelta'])
 for old,new in zip(before,after):
  assert (old['surface'],old['width'],old['state'])==(new['surface'],new['width'],new['state'])
  assert not new['smallText'],new['smallText']
  for c in new['controls']:assert all(float(c[k]).is_integer() for k in ['x','y','width','height']),(new['surface'],new['width'],c)
  for field in new['fields']:assert field['value']=='' and field['placeholder']=='Not set',field
  assert len(new['fields'])==4
  for a,b in zip(old['allColors'],new['allColors']):
   assert (a['selector'],a['index'])==(b['selector'],b['index'])
   pairs+=1
   if a!=b:colors.append({'surface':new['surface'],'width':new['width'],'state':new['state'],'before':a,'after':b})
  for a,b in zip(old['toggles'],new['toggles']):
   assert a['thumbStyle']['background']==b['thumbStyle']['background'] and a['thumbStyle']['border']==b['thumbStyle']['border']
  for t in new['toggles']:
   assert t['width']==40 and t['height']==24 and t['thumb']['width']==18
   assert t['top']==t['bottom']==3,(new['surface'],t)
   assert t['left']==(20 if t['checked'] else 2) and t['rightGap']==(2 if t['checked'] else 20),(new['surface'],t)
   assert t['centerDelta']==0 and t['row']['height']==40 and t['rightDelta']==0
   delta=None if new['timingHeader'] is None else t['right']-new['timingHeader']['right']
   if t['key'] in ['autoAdjust','smartPacing','aa-on','sp-on'] and delta is not None:assert delta==0
   w.writerow([new['surface'],new['width'],*new['state'].values(),t['key'],t['checked'],t['width'],t['height'],t['thumb']['width'],t['top'],t['bottom'],t['left'],t['rightGap'],t['centerDelta'],t['rightDelta'],delta])
  d=new['delayInfo']
  if d and (new['surface']=='config' or new['width']!=1086):assert d['gapLeft']==d['gapRight'] and d['gapLeft']>=6,(new['surface'],new['width'],d)
  if new['surface']=='config':assert new['hint']['above']==new['hint']['below']==8
  else:
   p={x['id']:x for x in new['panels']};assert p['kb-console-module kb-engine-module']['bottom']==p['kb-console-module kb-visuals-module']['bottom'];assert p['kb-session-panel']['bottom']==p['oi-zone2']['bottom']
  assert new['host']['x']>=0 and new['host']['right']<=new['width'],(new['surface'],new['width'],new['host'])
(root/'after/color-diff.json').write_text(json.dumps({'pairs':pairs,'differences':colors},indent=2),encoding='utf8')
assert not colors,colors[:3]
print(f'PASS72 states: toggles geometry/centers, empty4 fields, integer controls, desktop edges, hint8/8; {pairs} color pairs unchanged;1086 delay explicitly excluded as pending')

with (root/'after/delay.csv').open('w',newline='',encoding='utf8') as f:
 w=csv.writer(f);w.writerow(['phase','surface','viewport','bot','rating','pacing','input1','input2','unit1','unit2','dashGlyph','column','borderGapLeft','borderGapRight','sToDash'])
 for phase,rows in [('before',before),('after',after)]:
  for r in rows:
   if not r['delayInfo']:continue
   d=r['delayInfo'];w.writerow([phase,r['surface'],r['width'],*r['state'].values(),*[n['width'] for n in d['inputs']],*[n['width'] for n in d['units']],d['dash']['width'],d['column']['width'],d['gapLeft'],d['gapRight'],d['sToDash']])
with (root/'after/panels-and-hint.csv').open('w',newline='',encoding='utf8') as f:
 w=csv.writer(f);w.writerow(['phase','surface','viewport','bot','rating','pacing','panel','height','bottom','hintAbove','hintBelow'])
 for phase,rows in [('before',before),('after',after)]:
  for r in rows:
   for p in r['panels']:w.writerow([phase,r['surface'],r['width'],*r['state'].values(),p['id'],p['height'],p['bottom'],r['hint']['above'] if r['hint'] else '',r['hint']['below'] if r['hint'] else ''])
