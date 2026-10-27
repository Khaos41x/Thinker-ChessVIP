import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {resolve,join} from 'node:path';
import {createServer} from 'node:net';
const root=resolve(import.meta.dirname,'../..'),before=process.argv.includes('--before');
const output=join(root,'_bmad-output/implementation-artifacts/retry-header','interaction');await mkdir(output,{recursive:true});
const pause=ms=>new Promise(r=>setTimeout(r,ms));
const port=()=>new Promise(r=>{const s=createServer();s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>r(p));});});
const serverPort=await port(),debugPort=await port(),base=`http://127.0.0.1:${serverPort}`;
const profile=await mkdtemp(join(tmpdir(),'thinker-config-entry-'));
const preference=join(profile,'preferences.json');
const server=spawn('python',['tests/clean_config_fixture.py',String(serverPort),'--preferences',preference],{cwd:root,stdio:'ignore',windowsHide:true});
const chrome=spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--disable-gpu','--no-first-run','--disable-background-timer-throttling',`--remote-debugging-port=${debugPort}`,`--user-data-dir=${profile}`,'about:blank'],{stdio:'ignore',windowsHide:true});
let client;const messages=[],exceptions=[],network=[];
async function waitFor(test){for(let i=0;i<240;i++){try{if(await test())return;}catch{}await pause(100);}throw Error('Timeout');}
async function connect(url){const socket=new WebSocket(url),pending=new Map(),handlers=new Map();let id=0;socket.addEventListener('message',e=>{const m=JSON.parse(e.data);handlers.get(m.method)?.(m.params);const p=pending.get(m.id);if(p){pending.delete(m.id);m.error?p.reject(Error(m.error.message)):p.resolve(m.result);}});await new Promise(r=>socket.addEventListener('open',r,{once:true}));return{socket,on:(m,f)=>handlers.set(m,f),send:(method,params={})=>new Promise((resolve,reject)=>{pending.set(++id,{resolve,reject});socket.send(JSON.stringify({id,method,params}));})};}
async function value(expression){const r=await client.send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value;}
const reports=[];
try {
 await waitFor(async()=> (await fetch(base+'/config/load')).ok);await waitFor(async()=> (await fetch(`http://127.0.0.1:${debugPort}/json/list`)).ok);
 const tab=(await(await fetch(`http://127.0.0.1:${debugPort}/json/list`)).json()).find(t=>t.type==='page');client=await connect(tab.webSocketDebuggerUrl);await client.send('Page.enable');await client.send('Runtime.enable');await client.send('Network.enable');await client.send('Emulation.setFocusEmulationEnabled',{enabled:true});
 client.on('Runtime.exceptionThrown',e=>exceptions.push(e));client.on('Runtime.consoleAPICalled',e=>messages.push(e));let fault=false,delay=0,count=0,posts=0;
 await client.send('Fetch.enable',{patterns:[{urlPattern:'*config/engines*'},{urlPattern:'*eval-bar/engines*'}]});client.on('Fetch.requestPaused',e=>{count++;if(e.request.method==='POST')posts++;const fail=fault;setTimeout(()=>client.send(fail?'Fetch.failRequest':'Fetch.continueRequest',{requestId:e.requestId,...(fail?{errorReason:'ConnectionRefused'}:{})}).catch(()=>{}),delay);});
 for(const surface of ['config','console']) {
  fault=false;delay=0;
  await client.send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
  const status=surface==='config'?'#analysis-engine-state':'.tc-analysis-status',retry=surface==='config'?'#engine-retry':'.tc-analysis-notice button',select=surface==='config'?'#analysis-engine':'#tc-analysis-engine';
  await client.send('Page.navigate',{url:base+(surface==='config'?'/config':'/tests/fixtures/userscript_bootstrap.html?delay=20')});await waitFor(()=>value(`document.querySelector('${status}')?.textContent==='Ready'`));
  fault=true;await waitFor(()=>value(`['Error','Connection Lost'].includes(document.querySelector('${status}').textContent)`));
  for(const scenario of ['offline','reduced','online','switch','slow-switch','failed-switch']) {
   const reduced=scenario==='reduced';fault=['offline','reduced','failed-switch'].includes(scenario);delay=scenario==='slow-switch'?1000:0;
   await client.send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:reduced?'reduce':'no-preference'}]});
   await value(`(()=>{window.qa={events:[],announcements:[],shifts:[],cls:0,start:performance.now()};const n=document.querySelector('${status}');window.qaObserver?.disconnect();window.qaObserver=new MutationObserver(()=>qa.events.push({at:performance.now()-qa.start,text:n.textContent}));qaObserver.observe(n,{childList:true,subtree:true});const region=n.closest('.analysis-engine,.tc-analysis-selector');const live=[...region.querySelectorAll('[aria-live="polite"]')].at(-1);window.qaLiveObserver?.disconnect();window.qaLiveObserver=new MutationObserver(()=>{if(live.textContent)qa.announcements.push(live.textContent)});qaLiveObserver.observe(live,{childList:true,subtree:true});window.qaPerf?.disconnect();window.qaPerf=new PerformanceObserver(l=>{for(const e of l.getEntries())if(!e.hadRecentInput){qa.cls+=e.value;qa.shifts.push({value:e.value,sources:e.sources.map(s=>({id:s.node?.id,cls:s.node?.className,previous:s.previousRect.toJSON(),current:s.currentRect.toJSON()}))})}});qaPerf.observe({type:'layout-shift'});})()`);
   const initialCount=count,initialPosts=posts;
   await value(`(()=>{const n=document.querySelector('${retry}');${scenario.includes('switch')?`const s=document.querySelector('${select}');document.getElementById(s.id+'-picker').focus({preventScroll:true});s.value=s.value==='komodo-14.1'?'stockfish-19-1mb':'komodo-14.1';s.dispatchEvent(new Event('change',{bubbles:true}));`:`n.focus({preventScroll:true});for(let i=0;i<6;i++)n.click();`}})()`);
   await pause(80);assert.equal(await value(`document.querySelector('${status}').textContent`),'Initializing');
   await pause(680);const during=await value(`({text:document.querySelector('${status}').textContent,animations:document.querySelector('${status}').getAnimations().map(a=>a.effect.getTiming().duration),busy:document.querySelector('${status}').closest('.analysis-engine,.tc-analysis-selector').getAttribute('aria-busy')})`);
   await waitFor(()=>value(`document.querySelector('${status}').textContent!=='Initializing'`));await pause(220);
   const r=await value(`({...qa,final:document.querySelector('${status}').textContent,animations:document.querySelector('${status}').getAnimations().length,focus:document.activeElement.id||(document.activeElement.tagName==='BUTTON'?document.activeElement.textContent:document.activeElement.tagName),disabled:document.querySelector('${retry}').disabled})`);
   const final=r.events.find(e=>e.text!=='Initializing');const init=r.events.find(e=>e.text==='Initializing');assert(final&&init);assert(final.at-init.at>=699,JSON.stringify(r));assert.equal(r.animations,0);assert.equal(r.cls,0,JSON.stringify({surface,scenario,r}));assert.equal(r.announcements.length,1,JSON.stringify({surface,scenario,r}));assert.equal(scenario.includes('switch')?posts-initialPosts:count-initialCount,1,JSON.stringify({surface,scenario,r,count,initialCount,posts,initialPosts}));assert.equal(r.disabled,false);if(reduced)assert.deepEqual(during.animations,[]);else if(scenario!=='slow-switch')assert.deepEqual(during.animations,[180]);
   if(!scenario.includes('switch')||scenario==='failed-switch')assert(r.focus===(fault?(surface==='config'?'engine-retry':'Retry'):select.slice(1)+'-picker'),r.focus);
   reports.push({surface,scenario,during,requests:count-initialCount,...r});
  }
  delay=0;fault=false;
 }
 assert.deepEqual(messages,[]);assert.deepEqual(exceptions,[]);await writeFile(join(output,'report.json'),JSON.stringify({reports,messages,exceptions},null,2));console.log('PASS explicit Retry/selection minimum700ms,180ms fade,reduced motion,single attempt/final announcement,focus,CLS0');
} finally {client?.socket.close();chrome.kill();server.kill();await pause(500);await rm(profile,{recursive:true,force:true,maxRetries:6,retryDelay:200});}
