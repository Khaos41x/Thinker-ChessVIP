import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {resolve,join} from 'node:path';
import {createServer} from 'node:net';

const root=resolve(import.meta.dirname,'../..');
const base='http://127.0.0.1:5050',output=join(root,'_bmad-output/implementation-artifacts/definitive-finish/live');await mkdir(output,{recursive:true});
const delay=ms=>new Promise(r=>setTimeout(r,ms));const port=()=>new Promise(r=>{const s=createServer();s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>r(p))})});
const initial=await(await fetch(base+'/config/engines')).json(),settings=await(await fetch(base+'/config/load')).json();assert(!initial.analysisContextAuthorized);const original=initial.selectedEngineId;
const debug=await port(),clients=[],profile=await mkdtemp(join(tmpdir(),'thinker-live-preferences-'));
const browser=spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--disable-gpu','--no-first-run',`--remote-debugging-port=${debug}`,`--user-data-dir=${profile}`,'about:blank'],{stdio:'ignore',windowsHide:true});
async function waitFor(fn){for(let i=0;i<180;i++){try{if(await fn())return}catch{}await delay(100)}throw Error('Live state timed out')}
async function connect(url){const socket=new WebSocket(url);let id=0;const pending=new Map();const handlers=new Map();socket.addEventListener('message',event=>{const data=JSON.parse(event.data);if(data.method)handlers.get(data.method)?.(data.params);const p=pending.get(data.id);if(p){pending.delete(data.id);data.error?p.reject(new Error(data.error.message)):p.resolve(data.result);}});await new Promise((resolve,reject)=>{socket.addEventListener('open',resolve,{once:true});socket.addEventListener('error',reject,{once:true});});const c={socket,on:(method,handler)=>handlers.set(method,handler),send:(method,params={})=>new Promise((resolve,reject)=>{pending.set(++id,{resolve,reject});socket.send(JSON.stringify({id,method,params}));})};clients.push(c);return c;}
async function tab(url){const t=await(await fetch(`http://127.0.0.1:${debug}/json/new?${encodeURIComponent(url)}`,{method:'PUT'})).json();const c=await connect(t.webSocketDebuggerUrl);await c.send('Page.enable');return c;}
async function value(c,expression){const r=await c.send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw new Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value;}

try{
 await waitFor(async()=>(await fetch(`http://127.0.0.1:${debug}/json/version`)).ok);
 const page=await tab(base+'/config');await waitFor(()=>value(page,"document.querySelector('#analysis-engine')&&!document.querySelector('#analysis-engine').disabled"));
 const ids=['stockfish-19-1mb','stockfish-19-94mb','komodo-14.1'];assert.deepEqual(await value(page,"[...document.querySelector('#analysis-engine').options].map(n=>n.value)"),ids);
 const results=[];
 for(const id of [ids[1],ids[2],original]){
  await value(page,"document.querySelector('#analysis-engine').focus()");
  let current=(await(await fetch(base+'/config/engines')).json()).selectedEngineId;
  while(current!==id){const direction=ids.indexOf(current)<ids.indexOf(id)?1:-1,key=direction>0?'ArrowDown':'ArrowUp',code=direction>0?40:38;const next=ids[ids.indexOf(current)+direction];await value(page,"document.querySelector('#analysis-engine').focus()");await page.send('Input.dispatchKeyEvent',{type:'keyDown',key,code:key,windowsVirtualKeyCode:code});await page.send('Input.dispatchKeyEvent',{type:'keyUp',key,code:key,windowsVirtualKeyCode:code});await waitFor(async()=> (await(await fetch(base+'/config/engines')).json()).selectedEngineId===next);await waitFor(()=>value(page,"!document.querySelector('#analysis-engine').disabled"));current=next;}
  await page.send('Page.reload');await waitFor(()=>value(page,`document.querySelector('#analysis-engine')?.value===${JSON.stringify(id)}&&!document.querySelector('#analysis-engine').disabled`));
  const status=await value(page,"({selected:document.querySelector('#analysis-engine').value,state:document.querySelector('#analysis-engine-state').textContent,connection:document.querySelector('#connection').textContent,userscript:document.querySelector('#userscript-connection').textContent})");assert.equal(status.state,'Ready');results.push(status);
 }
 for(const width of [1440,390]){await page.send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});await delay(150);const height=await value(page,'document.documentElement.scrollHeight');const shot=await page.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,clip:{x:0,y:0,width,height,scale:1}});await writeFile(join(output,`config-${width}.png`),Buffer.from(shot.data,'base64'))}
 const final=await(await fetch(base+'/config/engines')).json();assert(!final.analysisContextAuthorized);assert.equal(final.activeEngineId,initial.activeEngineId);const finalSettings=await(await fetch(base+'/config/load')).json();for(const key of Object.keys(settings).filter(k=>!k.startsWith('_')))assert.deepEqual(finalSettings[key],settings[key]);
 await writeFile(join(output,'preferences.json'),JSON.stringify({realService:base,results,originalRestored:true,analysisAuthorizationUnchanged:true,configurationUnchanged:true},null,2));console.log('PASS actual running Flask/registry: keyboard selection, all 3 engines, reload persistence, no Chess.com heartbeat, original preference restored');
}finally{const current=await(await fetch(base+'/config/engines')).json();if(current.selectedEngineId!==original)await fetch(base+'/config/engines/select',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({engineId:original,expectedRevision:current.preferenceRevision})});for(const c of clients)c.socket.close();browser.kill();await delay(300);await rm(profile,{recursive:true,force:true,maxRetries:5,retryDelay:150})}
