import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {resolve,join} from 'node:path';
import {createServer} from 'node:net';
const root=resolve(import.meta.dirname,'../..'),before=process.argv.includes('--before');
const output=join(root,'_bmad-output/implementation-artifacts/clean-config','hint');await mkdir(output,{recursive:true});
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
try{
 await waitFor(async()=> (await fetch(base+'/config/load')).ok);await waitFor(async()=> (await fetch(`http://127.0.0.1:${debugPort}/json/list`)).ok);
 const tab=(await(await fetch(`http://127.0.0.1:${debugPort}/json/list`)).json()).find(t=>t.type==='page');client=await connect(tab.webSocketDebuggerUrl);await client.send('Page.enable');
 const results=[];
 for(const id of ['stockfish-19-1mb','stockfish-19-94mb','komodo-14.1']){
  const registry=await(await fetch(base+'/config/engines')).json();const saved=await fetch(base+'/config/engines/select',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({engineId:id,expectedRevision:registry.preferenceRevision})});assert.equal(saved.status,200);
  await client.send('Page.navigate',{url:base+'/config'});await waitFor(()=>value("document.querySelector('#analysis-engine-state').textContent==='Ready'"));
  for(const width of [1440,1280,1024,768,390]){
   await client.send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});await pause(50);
   const r=await value(`(()=>{const p=document.querySelector('#analysis-engine-message'),e=document.querySelector('#engine'),r=p.getBoundingClientRect();return{width:innerWidth,text:p.textContent,title:p.title,hintHeight:r.height,lineHeight:parseFloat(getComputedStyle(p).lineHeight),notice:p.parentElement.getBoundingClientRect().height,engineHeight:e.getBoundingClientRect().height,scroll:p.scrollHeight,whiteSpace:getComputedStyle(p).whiteSpace}})()`);assert(r.hintHeight<=2*r.lineHeight);assert(r.scroll<=r.hintHeight);assert.equal(r.notice,40);assert.equal(r.engineHeight,476);assert.equal(r.title,r.text);results.push({id,...r});
  }
 }
 await writeFile(join(output,'report.json'),JSON.stringify({passed:true,results},null,2));console.log('PASS full engine hints: all three engines × five widths; ≤2 lines in unchanged 40px notice and 476px Engine');
}finally{client?.socket.close();chrome.kill();server.kill();await pause(500);await rm(profile,{recursive:true,force:true,maxRetries:6,retryDelay:200});}
