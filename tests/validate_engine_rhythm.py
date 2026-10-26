from pathlib import Path
import json,csv
root=Path('_bmad-output/implementation-artifacts/engine-rhythm');before=json.loads((root/'before/measurements.json').read_text(encoding='utf8'));after=json.loads((root/'after/measurements.json').read_text(encoding='utf8'))
for old,new in zip(before,after):
 assert (old['width'],old['mode'],old['smartPacing'])==(new['width'],new['mode'],new['smartPacing'])
 prev=None
 for s in new['sections']:
  if not s['visible']:continue
  if prev:
   assert s['css']['borderTop']=='1px'
   assert s['y']-prev['content']['end']==2,(new['width'],s)
   assert s['content']['start']-s['y']-1==2,(new['width'],s)
  prev=s
 for panel in new['panels']:
  assert new['panels'][panel]['height']==old['panels'][panel]['height']
  assert new['panels'][panel]['tail']==old['panels'][panel]['tail']
 for c in new['controls']:
  assert all(float(c[k]).is_integer() for k in ['x','y','width','height']),(new['width'],c)
 assert not new['overflow'] or old['overflow']
 if new['layout']=='desktop':
  p=new['panels'];assert p['kb-console-module kb-visuals-module']['bottom']==p['kb-console-module kb-engine-module']['bottom'];assert p['oi-zone2']['bottom']==p['kb-session-panel']['bottom']
with (root/'after/sections.csv').open('w',encoding='utf8',newline='') as f:
 w=csv.writer(f);w.writerow(['viewport','mode','smartPacing','section','startY','endY','height','contentStartY','contentEndY','dividerY','spaceAboveDivider','spaceBelowDivider'])
 for r in after:
  prev=None
  for s in r['sections']:
   if not s['visible']:continue
   border=float(s['css']['borderTop'].replace('px',''));divider=s['y'] if border else None
   w.writerow([r['width'],r['mode'],r['smartPacing'],s['name'],s['y'],s['bottom'],s['height'],s['content']['start'],s['content']['end'],divider,divider-prev['content']['end'] if prev and divider else '',s['content']['start']-divider-border if divider else ''])
   prev=s
print('PASS24 states: 2px/1px/2px all junctions; unchanged heights/tails, integer controls, exact edges')

