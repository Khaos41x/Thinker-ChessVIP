import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {resolve,join} from 'node:path';
import {createServer} from 'node:net';
const root=resolve(import.meta.dirname,'../..'),before=process.argv.includes('--before');
const output=join(root,'_bmad-output/implementation-artifacts/retry-header','baseline-timing');await mkdir(output,{recursive:true});
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
try{
 await waitFor(async()=> (await fetch(base+'/config/load')).ok);await waitFor(async()=> (await fetch(`http://127.0.0.1:${debugPort}/json/list`)).ok);
 const tab=(await(await fetch(`http://127.0.0.1:${debugPort}/json/list`)).json()).find(t=>t.type==='page');client=await connect(tab.webSocketDebuggerUrl);await client.send('Page.enable');await client.send('Runtime.enable');await client.send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
 const files={'/config':'frontend/external_config/index.html','/config/assets/panel.js':'frontend/external_config/panel.js','/config/assets/panel.css':'frontend/external_config/panel.css','/config/assets/status-runtime.js':'frontend/external_config/status-runtime.js','/script.js':'script.js'};
 const baseline=Object.fromEntries(Object.entries(files).map(([url,path])=>[url,execFileSync('git',['show','cbee05a:'+path],{cwd:root,maxBuffer:2000000}).toString('base64')]));
 let fault=false;await client.send('Fetch.enable',{patterns:[{urlPattern:base+'/config'},{urlPattern:'*config/assets/*'},{urlPattern:'*/script.js*'},{urlPattern:'*engines*'},{urlPattern:base+'/config/load'},{urlPattern:base+'/config/status'}]});client.on('Fetch.requestPaused',e=>{const path=new URL(e.request.url).pathname;if(baseline[path])client.send('Fetch.fulfillRequest',{requestId:e.requestId,responseCode:200,responseHeaders:[{name:'Content-Type',value:path==='/config'?'text/html':path.endsWith('css')?'text/css':'application/javascript'}],body:baseline[path]}).catch(()=>{});else client.send(fault?'Fetch.failRequest':'Fetch.continueRequest',{requestId:e.requestId,...(fault?{errorReason:'ConnectionRefused'}:{})}).catch(()=>{});});
 for(const surface of ['config','console']){
  fault=false;const status=surface==='config'?'#analysis-engine-state':'.tc-analysis-status',retry=surface==='config'?'#engine-retry':'.tc-analysis-notice button';
  await client.send('Page.navigate',{url:base+(surface==='config'?'/config':'/tests/fixtures/userscript_bootstrap.html?delay=20')});await waitFor(()=>value(`document.querySelector('${status}')?.textContent==='Ready'`));
  if(surface==='config')for(const width of [1440,1024,390]){await client.send('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:false});await pause(100);await client.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true}).then(r=>writeFile(join(output,`config-${width}-online.png`),Buffer.from(r.data,'base64')));}
  fault=true;await waitFor(()=>value(`['Error','Connection Lost'].includes(document.querySelector('${status}').textContent)`));
  if(surface==='config'){await waitFor(()=>value("document.querySelector('#connection').textContent==='Local server offline'"));for(const width of [1440,1024,390]){await client.send('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:false});await pause(100);await client.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true}).then(r=>writeFile(join(output,`config-${width}-offline.png`),Buffer.from(r.data,'base64')));}await client.send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});}
  for(const state of ['offline','online']){fault=state==='offline';await value(`(()=>{window.baselineEvents=[];window.baselineObserver?.disconnect();window.baselineStart=performance.now();const n=document.querySelector('${status}');window.baselineObserver=new MutationObserver(()=>baselineEvents.push({at:performance.now()-baselineStart,text:n.textContent}));baselineObserver.observe(n,{childList:true});document.querySelector('${retry}').click();})()`);await pause(700);reports.push({surface,state,events:await value('baselineEvents')});}
 }
 await writeFile(join(output,'report.json'),JSON.stringify({commit:'cbee05a',reports},null,2));console.log('PASS baseline offline and online Retry timing captured from original source');
}finally{client?.socket.close();chrome.kill();server.kill();await pause(500);await rm(profile,{recursive:true,force:true,maxRetries:6,retryDelay:200});}
