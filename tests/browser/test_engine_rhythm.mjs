import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {resolve,join} from 'node:path';
import {createServer} from 'node:net';
const root=resolve(import.meta.dirname,'../..');
const before=process.argv.includes('--before');
const configOnly=process.argv.includes('--config-only');
const output=join(root,'_bmad-output/implementation-artifacts/engine-rhythm',process.argv.includes('--after')?'after':'before');
await mkdir(output,{recursive:true});
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const port=()=>new Promise(resolve=>{const s=createServer();s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>resolve(p));});});
const serverPort=await port(),debug=await port(),base=`http://127.0.0.1:${serverPort}`;
const profile=await mkdtemp(join(tmpdir(),'thinker-phase091-capture-'));
const backend=spawn('python',['-c',before?"import importlib.util,sys;from pathlib import Path;from flask import Response,send_from_directory;baseline=Path('.definitive-finish-baseline');spec=importlib.util.spec_from_file_location('core.external_config',baseline/'core/external_config.py');old=importlib.util.module_from_spec(spec);sys.modules['core.external_config']=old;spec.loader.exec_module(old);spec=importlib.util.spec_from_file_location('visual','tests/phase091_visual_fixture.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);m.app.view_functions['userscript']=lambda:Response((baseline/'script.js').read_text(encoding='utf8'),content_type='application/javascript');m.app.view_functions['external_config.asset']=lambda filename:send_from_directory(baseline/'frontend/external_config' if (baseline/'frontend/external_config'/filename).exists() else Path.cwd()/'frontend/external_config',filename);m.app.run(host='127.0.0.1',port=int(sys.argv[1]),threaded=True,use_reloader=False)":"import importlib.util,sys;spec=importlib.util.spec_from_file_location('visual','tests/phase091_visual_fixture.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);m.app.run(host='127.0.0.1',port=int(sys.argv[1]),threaded=True,use_reloader=False)",String(serverPort)],{cwd:root,stdio:'ignore',windowsHide:true});
const browser=spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--disable-gpu','--no-first-run','--disable-background-timer-throttling','--disable-renderer-backgrounding',`--remote-debugging-port=${debug}`,`--user-data-dir=${profile}`,'about:blank'],{stdio:'ignore',windowsHide:true});
const clients=[];
async function waitFor(test){for(let i=0;i<180;i++){try{if(await test())return;}catch{}await delay(100);}throw new Error('Timed out');}
async function connect(url){const socket=new WebSocket(url);let id=0;const pending=new Map();const handlers=new Map();socket.addEventListener('message',event=>{const data=JSON.parse(event.data);if(data.method)handlers.get(data.method)?.(data.params);const p=pending.get(data.id);if(p){pending.delete(data.id);data.error?p.reject(new Error(data.error.message)):p.resolve(data.result);}});await new Promise((resolve,reject)=>{socket.addEventListener('open',resolve,{once:true});socket.addEventListener('error',reject,{once:true});});const c={socket,on:(method,handler)=>handlers.set(method,handler),send:(method,params={})=>new Promise((resolve,reject)=>{pending.set(++id,{resolve,reject});socket.send(JSON.stringify({id,method,params}));})};clients.push(c);return c;}
async function tab(url){const t=await(await fetch(`http://127.0.0.1:${debug}/json/new?${encodeURIComponent(url)}`,{method:'PUT'})).json();const c=await connect(t.webSocketDebuggerUrl);await c.send('Page.enable');return c;}
async function value(c,expression){const r=await c.send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw new Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value;}
try{
 await waitFor(async()=> (await fetch(base+'/config/load')).ok);
 await waitFor(async()=> (await fetch(`http://127.0.0.1:${debug}/json/version`)).ok);
 const embedded=await tab(base+'/tests/fixtures/userscript_bootstrap.html?delay=50');
 await waitFor(()=>value(embedded,"Boolean(document.querySelector('#dm-rand'))"));
 await embedded.send('Page.bringToFront');
 await waitFor(()=>value(embedded,"document.querySelector('.tc-analysis-status')?.textContent==='Ready'"));
 const measure=()=>{
  const rect=n=>{const b=n.getBoundingClientRect();return{x:b.x,y:b.y,width:b.width,height:b.height,bottom:b.bottom,right:b.right}};
  const visible=n=>n.getBoundingClientRect().height>0&&getComputedStyle(n).display!=='none';
  const style=n=>{const s=getComputedStyle(n);return{marginTop:s.marginTop,marginBottom:s.marginBottom,paddingTop:s.paddingTop,paddingBottom:s.paddingBottom,borderTop:s.borderTopWidth,borderColor:s.borderTopColor,background:s.backgroundColor,color:s.color,fontSize:s.fontSize,paddingLeft:s.paddingLeft,paddingRight:s.paddingRight}};
  const content=n=>{const nodes=[...n.querySelectorAll('.tc-analysis-heading,.tc-analysis-selector select,.tc-analysis-notice,.kb-strength-head,.kb-slider,.kb-strength-limits,.kb-timing-heading,.kb-run-delay-controls,.kb-dependency-hint,.kb-section')].filter(visible);return{start:Math.min(...nodes.map(n=>rect(n).y)),end:Math.max(...nodes.map(n=>rect(n).bottom))}};
  const sections=[...document.querySelectorAll('.kb-engine-section')].map(n=>({name:n.className.split('kb-engine-').pop(),...rect(n),visible:visible(n),css:style(n),content:visible(n)?content(n):null}));
  const labels=[...document.querySelectorAll('.kb-timing-mode label')].map(n=>{const range=document.createRange();range.selectNodeContents(n);return{text:n.textContent,...rect(n),css:style(n),textWidth:range.getBoundingClientRect().width,selected:document.getElementById(n.htmlFor).checked}});
  const panels=Object.fromEntries([...document.querySelectorAll('.kb-core-module,.kb-visuals-module,.kb-engine-module,.kb-auto-play-module,#oi-zone2')].map(n=>[n.id||n.className,{...rect(n),tail:rect(n).bottom-1-Math.max(...[...n.children].filter(visible).map(c=>rect(c).bottom))}]));
  const wrapper=document.querySelector('#oi-wrapper');const ancestors=[];for(let n=wrapper;n;n=n.parentElement)ancestors.push({tag:n.tagName,id:n.id,class:n.className,...rect(n),css:style(n)});
  const controls=[...document.querySelectorAll('#krypbot-container input,#krypbot-container select,#krypbot-container button,.kb-timing-mode label')].filter(visible).map(n=>({id:n.id||n.htmlFor,...rect(n)}));
  const warning=document.querySelector('#kb-session-target-help'),hint=document.querySelector('#kb-run-delay-hint');
  return{width:innerWidth,mode:document.querySelector('#dm-rand').checked?'Random':'Immediate',smartPacing:document.querySelector('#sp-on').checked,sections,labels,panels,ancestors,inputs:[...document.querySelectorAll('.kb-delay-input input')].map(n=>({id:n.id,...rect(n),css:style(n)})),controls,heading:document.querySelector('#autoDelayDisplay').textContent,warning:{text:warning.textContent,css:style(warning)},hint:{text:hint.textContent,css:style(hint)},layout:wrapper.dataset.layoutMode,overflow:document.documentElement.scrollWidth>innerWidth};
 };
 const results=[];
 for(const width of [1086,1280,1440,1920,1033,800])for(const smart of [false,true])for(const mode of ['rand','max']){
  await embedded.send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});
  const saved=await fetch(base+'/config/save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({smartPacing:smart,delayMode:mode==='rand'?'random':'max'})});assert(saved.ok);
  await waitFor(()=>value(embedded,`document.querySelector('#sp-on').checked===${smart}&&document.querySelector('#dm-${mode}').checked`));await delay(350);
  const item=await value(embedded,'('+measure.toString()+')()');results.push(item);
  if([1440,1086,800].includes(width)){const shot=await embedded.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});await writeFile(join(output,`console-${width}-${mode}-pacing${Number(smart)}.png`),Buffer.from(shot.data,'base64'));}
 }
 await writeFile(join(output,'measurements.json'),JSON.stringify(results,null,2));
 console.log(JSON.stringify(results.filter(r=>r.width===1440&&!r.smartPacing).map(r=>({width:r.width,mode:r.mode,sections:r.sections,inputs:r.inputs,labels:r.labels,ancestors:r.ancestors})),null,2));
}finally{for(const c of clients)c.socket.close();browser.kill();backend.kill();await delay(500);await rm(profile,{recursive:true,force:true,maxRetries:5,retryDelay:150});}

