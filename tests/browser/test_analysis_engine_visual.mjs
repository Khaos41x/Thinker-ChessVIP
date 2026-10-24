import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const result=spawnSync(process.execPath,[resolve(import.meta.dirname,'test_eval_bar_v2_chrome.mjs')],{encoding:'utf8',windowsHide:true});
const start=result.stdout.indexOf('\n{');
assert(start>=0,result.stderr||result.stdout);
const report=JSON.parse(result.stdout.slice(start+1));
const checks=report.visual.map(visual=>({viewport:visual.viewport,
  geometry:[visual.baseline,visual.resized,visual.scrolled].every(x=>x.heightDelta<=1 && x.topDelta<=1 && Math.abs(x.gap-10)<=1),
  width:Math.abs(visual.baseline.width-visual.expectedWidth)<=1,
  immediateScroll:visual.immediateScrollFrames.length===30 && visual.immediateScrollFrames.every(x=>x.topDelta<=1 && x.bottomDelta<=1 && x.anchorUnchanged),
  transformOnly:/^scaleY\(/.test(visual.styles.fillTransform)&&visual.styles.fillInlineHeight==='',
  typography:/Segoe UI|system-ui/.test(visual.styles.fontFamily),
  cleanup:visual.hostPreserved&&visual.rootsAfterDestroy===0}));
for(const check of checks)for(const [key,value]of Object.entries(check))if(key!=='viewport')assert.equal(value,true,JSON.stringify(check));
assert.equal(report.behavior.domPreserved,true);
assert.equal(report.behavior.contextCacheSeparated,true);
assert.equal(report.continuitySummary.domRemounts,0);
assert.equal(report.continuitySummary.obsoleteEventsRejected,30);
const output={checks,continuity:report.continuitySummary,originalHarnessExitCode:result.status,
  preexistingAuthorizationFixtureFailures:['mountedBlockedWhenUnauthorized','activePlayDispatches'].filter(k=>report.behavior[k]!==true)};
await writeFile(resolve(import.meta.dirname,'../../_bmad-output/implementation-artifacts/phase09-engine-selector/visual-regression.json'),JSON.stringify(output,null,2));
console.log(JSON.stringify(output,null,2));
