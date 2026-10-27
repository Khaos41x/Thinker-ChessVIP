import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {resolve,join} from 'node:path';
import {createServer} from 'node:net';
const root=resolve(import.meta.dirname,'../..'),before=process.argv.includes('--before');
const output=join(root,'_bmad-output/implementation-artifacts/clean-config','debug');await mkdir(output,{recursive:true});
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
 const tab=(await(await fetch(`http://127.0.0.1:${debugPort}/json/list`)).json()).find(t=>t.type==='page');client=await connect(tab.webSocketDebuggerUrl);await client.send('Page.enable');await client.send('Runtime.enable');client.on('Runtime.exceptionThrown',m=>exceptions.push(m));
 const results=[];
 for(const suffix of ['', '?debug=1','?debug=0']){
  await client.send('Page.navigate',{url:base+'/config'+suffix});await waitFor(()=>value("document.querySelector('#analysis-engine-state').textContent==='Ready'"));
  const result=await value(`(()=>{const pre=document.querySelector('#analysis-engine-details');return{count:document.querySelectorAll('.engine-details').length,hasText:document.body.textContent.includes('Technical details'),json:pre?JSON.parse(pre.textContent):null,overflow:pre?getComputedStyle(pre).overflow:null,maxHeight:pre?getComputedStyle(pre).maxHeight:null}})()`);results.push({suffix,...result});
  assert.equal(result.count,suffix==='?debug=1'?1:0);assert.equal(result.hasText,suffix==='?debug=1');
  if(result.json){assert.equal(result.json.id,'stockfish-19-1mb');assert.equal(result.overflow,'visible');assert.equal(result.maxHeight,'none');}
 }
 const registry=await(await fetch(base+'/config/engines')).json();assert.equal(registry.engines.length,3);assert(registry.engines.every(e=>typeof e.installed==='boolean'&&e.capabilities));
 assert.deepEqual(exceptions,[]);await writeFile(join(output,'report.json'),JSON.stringify({passed:true,results,serverJsonPreserved:true,exceptions},null,2));console.log('PASS no technical DOM by default; debug opt-in works; no nested scrolling; JSON preserved');
}finally{client?.socket.close();chrome.kill();server.kill();await pause(500);await rm(profile,{recursive:true,force:true,maxRetries:6,retryDelay:200});}
