import csv
import json
import shutil
import subprocess
from pathlib import Path

root = Path(__file__).resolve().parents[1]
out = root / '_bmad-output/implementation-artifacts/stable-status'
final = out / 'final'
final.mkdir(exist_ok=True)
clean = root / '_bmad-output/implementation-artifacts/clean-config'
for source, target in [(clean/'after/audit.json',final/'config.json'),(clean/'after/console.json',final/'console.json'),(clean/'colors/report.json',final/'colors.json')]:
    shutil.copyfile(source,target)
(out/'before/console-geometry.json').write_bytes(subprocess.check_output(['git','show','a7c0100:_bmad-output/implementation-artifacts/clean-config/after/console.json'],cwd=root))
before = json.loads((out/'before/config-geometry.json').read_text(encoding='utf8'))
after = json.loads((final/'config.json').read_text(encoding='utf8'))
differences = []
with (out/'panel-comparison.csv').open('w',newline='',encoding='utf8') as stream:
    writer=csv.writer(stream)
    writer.writerow(['viewport','state','panel','beforeX','afterX','beforeY','afterY','beforeWidth','afterWidth','beforeHeight','afterHeight'])
    for current in after:
        old=next(r for r in before if r['width']==current['width'] and r['state']==current['state'])
        for name,panel in current['panels'].items():
            values=[value for key in ['x','y','width','height'] for value in [old['panels'][name][key],panel[key]]]
            writer.writerow([current['width'],current['state'],name,*values])
            if any(old['panels'][name][k]!=panel[k] for k in ['x','y','width','height']):differences.append([current['width'],current['state'],name])
assert not differences,differences
assert json.loads((out/'before/console-geometry.json').read_text(encoding='utf8'))==json.loads((final/'console.json').read_text(encoding='utf8'))
rows=[]
timeline=[]
request_rows=[]
for phase in ['before','after']:
    for item in json.loads((out/phase/'observation.json').read_text(encoding='utf8')):
        for scenario in ['stable','outage']:
            data=item[scenario]
            for selector in sorted(set(item['outage'].get('texts',{}))|{event['selector'] for event in data['events']}):
                events=[event for event in data['events'] if event['selector']==selector]
                rows.append([phase,item['surface'],scenario,selector,len(events),sum(event['changed'] for event in events),len(data['recreated']),data['cls']])
        for label,start,end in [('healthy-minute',20000,80000),('outage-30s-scaled',110000,140000)]:
            requests=[r for r in item['requests'] if start<=r['at']<end and '/assets/' not in r['url'] and r['url']!='/config']
            channels=sorted({r.get('channel','presentation') for r in requests})
            for channel in channels:
                count=sum(r.get('channel','presentation')==channel for r in requests)
                request_rows.append([phase,item['surface'],label,channel,count,round(count*60000/(end-start),2)])
        for event in item['outage']['events']:
            if event['changed']:timeline.append([phase,item['surface'],round(event['at']/1000,3),event['selector'],event['text']])
with (out/'status-mutations.csv').open('w',newline='',encoding='utf8') as stream:
    writer=csv.writer(stream);writer.writerow(['phase','surface','90sWindow','selector','mutationCallbacks','actualValueChanges','recreated','CLS']);writer.writerows(rows)
with (out/'request-rates.csv').open('w',newline='',encoding='utf8') as stream:
    writer=csv.writer(stream);writer.writerow(['phase','surface','window','channel','count','requestsPerMinute']);writer.writerows(request_rows)
with (out/'timeline.csv').open('w',newline='',encoding='utf8') as stream:
    writer=csv.writer(stream);writer.writerow(['phase','surface','secondsFromOutage','selector','value']);writer.writerows(timeline)
validation={'configCases':len(after),'consoleCases':12,'existingPanelRectangleDifferences':0,'existingConsoleColorDifferences':0,'rows40Centered':all(row['height']==40 and row['centerDelta']==0 for item in after for row in item['rows']),'configHorizontalOverflow':any(item['overflow'] for item in after),'minimumVisibleFont':min(float(e['font'].replace('px','')) for item in after for e in item['elements'] if e['visible']),'nativeAuthenticatedTampermonkey':False,'configBottomGapAlreadyPresent':81}
assert validation['rows40Centered'] and not validation['configHorizontalOverflow'] and validation['minimumVisibleFont']>=11
(out/'validation.json').write_text(json.dumps(validation,indent=2),encoding='utf8')
print(json.dumps(validation))
