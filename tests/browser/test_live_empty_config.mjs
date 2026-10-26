import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {resolve,join} from 'node:path';
import {createServer} from 'node:net';

const root=resolve(import.meta.dirname,'../..');
const base='http://127.0.0.1:5050',output=join(root,'_bmad-output/implementation-artifacts/config-controls/live-real-server');await mkdir(output,{recursive:true});
const delay=ms=>new Promise(r=>setTimeout(r,ms));const port=()=>new Promise(r=>{const s=createServer();s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>r(p))})});
const initial=await(await fetch(base+'/config/engines')).json(),settings=await(await fetch(base+'/config/load')).json();assert(!initial.analysisContextAuthorized);const original=initial.selectedEngineId;
const debug=await port(),clients=[],profile=await mkdtemp(join(tmpdir(),'thinker-live-preferences-'));
const browser=spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--disable-gpu','--no-first-run',`--remote-debugging-port=${debug}`,`--user-data-dir=${profile}`,'about:blank'],{stdio:'ignore',windowsHide:true});
async function waitFor(fn){for(let i=0;i<180;i++){try{if(await fn())return}catch{}await delay(100)}throw Error('Live state timed out')}
async function connect(url){const socket=new WebSocket(url);let id=0;const pending=new Map();const handlers=new Map();socket.addEventListener('message',event=>{const data=JSON.parse(event.data);if(data.method)handlers.get(data.method)?.(data.params);const p=pending.get(data.id);if(p){pending.delete(data.id);data.error?p.reject(new Error(data.error.message)):p.resolve(data.result);}});await new Promise((resolve,reject)=>{socket.addEventListener('open',resolve,{once:true});socket.addEventListener('error',reject,{once:true});});const c={socket,on:(method,handler)=>handlers.set(method,handler),send:(method,params={})=>new Promise((resolve,reject)=>{pending.set(++id,{resolve,reject});socket.send(JSON.stringify({id,method,params}));})};clients.push(c);return c;}
async function tab(url){const t=await(await fetch(`http://127.0.0.1:${debug}/json/new?${encodeURIComponent(url)}`,{method:'PUT'})).json();const c=await connect(t.webSocketDebuggerUrl);await c.send('Page.enable');return c;}
async function value(c,expression){const r=await c.send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw new Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value;}
try{
 await waitFor(async()=> (await fetch(`http://127.0.0.1:${debug}/json/version`)).ok);const page=await tab(base+'/config');await waitFor(()=>value(page,"document.querySelector('#kb-session-duration')?.placeholder==='Not set'&&!document.querySelector('#kb-session-duration').disabled"));
 const results=[];
 for(const width of [1440,390]){
  await page.send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});await delay(250);
  const r=await value(page,"({fields:[...document.querySelectorAll('#kb-session-duration,#kb-session-min-rate,#kb-session-max-rate,#tc-rating-target')].map(n=>({id:n.id,value:n.value,placeholder:n.placeholder})),startDisabled:document.querySelector('#kb-session-start').disabled,engine:document.querySelector('#analysis-engine-state').textContent,connection:document.querySelector('#connection-text')?.textContent})");
  assert.equal(r.fields.length,4);for(const f of r.fields){assert.equal(f.value,'');assert.equal(f.placeholder,'Not set');}assert(r.startDisabled);results.push({width,...r});
  const height=await value(page,'document.documentElement.scrollHeight');const shot=await page.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,clip:{x:0,y:0,width,height,scale:1}});await writeFile(join(output,`config-${width}.png`),Buffer.from(shot.data,'base64'));
 }
 const finalSettings=await(await fetch(base+'/config/load')).json();for(const key of Object.keys(settings).filter(k=>!k.startsWith('_')))assert.deepEqual(finalSettings[key],settings[key]);
 await writeFile(join(output,'report.json'),JSON.stringify({results,configurationUnchanged:true,realServer:base},null,2));console.log('PASS actual5050 Config1440/390: four empty fields, Not set placeholders, Start disabled, no config changes');
}finally{for(const c of clients)c.socket.close();browser.kill();await delay(300);await rm(profile,{recursive:true,force:true,maxRetries:5,retryDelay:150})}
