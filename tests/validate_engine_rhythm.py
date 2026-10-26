from pathlib import Path
import json,csv
root=Path('_bmad-output/implementation-artifacts/engine-rhythm');before=json.loads((root/'before/measurements.json').read_text(encoding='utf8'));after=json.loads((root/'after/measurements.json').read_text(encoding='utf8'))
for old,new in zip(before,after):
 if 'safeBoundary' in new:
  if new['layout']=='desktop':
   assert new['consoleTop']-new['safeBoundary']==12
   assert new['ancestors'][0]['y']==old['ancestors'][0]['y']-112
  else:
   assert new['ancestors'][0]==old['ancestors'][0]
 for a,b in zip(old['labels'],new['labels']):assert a['css']==b['css']
 assert old['warning']==new['warning']
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


from PIL import Image
pixels=[]
for r in after:
 if r['width'] not in [1440,1086,800]:continue
 mode='rand' if r['mode']=='Random' else 'max'
 path=root/'after'/f"console-{r['width']}-{mode}-pacing{int(r['smartPacing'])}.png"
 im=Image.open(path).convert('RGB');host=r['ancestors'][0]
 for section in r['sections']:
  if not section['visible'] or section['css']['borderTop']!='1px':continue
  x=int(section['x']-host['x']+10);y=int(section['y']-host['y'])
  assert im.getpixel((x,y))==(50,50,47),(path,section['name'],im.getpixel((x,y)))
  assert im.getpixel((x,y-1))==(37,37,35)
  assert im.getpixel((x,y+1))==(37,37,35)
  pixels.append({'screenshot':path.name,'section':section['name'],'dividerPixel':[x,y],'rgb':[50,50,47],'thickness':1})
(root/'after/painted-dividers.json').write_text(json.dumps(pixels,indent=2),encoding='utf8')
print('PASS painted1px dividers, desktop inset12px, stacked placement and colors unchanged')
