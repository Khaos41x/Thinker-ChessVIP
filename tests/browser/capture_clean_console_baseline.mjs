import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {resolve,join} from 'node:path';
import {createServer} from 'node:net';
const root=resolve(import.meta.dirname,'../..'),before=process.argv.includes('--before');
const output=join(root,'_bmad-output/implementation-artifacts/clean-config',before?'before':'after');await mkdir(output,{recursive:true});
const pause=ms=>new Promise(r=>setTimeout(r,ms));
const port=()=>new Promise(r=>{const s=createServer();s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>r(p));});});
const serverPort=await port(),debugPort=await port(),base=`http://127.0.0.1:${serverPort}`;
const profile=await mkdtemp(join(tmpdir(),'thinker-config-entry-'));
const preference=join(profile,'preferences.json');
const server=spawn('python',['tests/clean_config_fixture.py',String(serverPort),'--preferences',preference,'--console-baseline'],{cwd:root,stdio:'ignore',windowsHide:true});
const chrome=spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--disable-gpu','--no-first-run','--disable-background-timer-throttling',`--remote-debugging-port=${debugPort}`,`--user-data-dir=${profile}`,'about:blank'],{stdio:'ignore',windowsHide:true});
let client;const messages=[],exceptions=[],network=[];
async function waitFor(test){for(let i=0;i<240;i++){try{if(await test())return;}catch{}await pause(100);}throw Error('Timeout');}
async function connect(url){const socket=new WebSocket(url),pending=new Map(),handlers=new Map();let id=0;socket.addEventListener('message',e=>{const m=JSON.parse(e.data);handlers.get(m.method)?.(m.params);const p=pending.get(m.id);if(p){pending.delete(m.id);m.error?p.reject(Error(m.error.message)):p.resolve(m.result);}});await new Promise(r=>socket.addEventListener('open',r,{once:true}));return{socket,on:(m,f)=>handlers.set(m,f),send:(method,params={})=>new Promise((resolve,reject)=>{pending.set(++id,{resolve,reject});socket.send(JSON.stringify({id,method,params}));})};}
async function value(expression){const r=await client.send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value;}
try{await waitFor(async()=> (await fetch(base+'/config/load')).ok);await waitFor(async()=> (await fetch(`http://127.0.0.1:${debugPort}/json/list`)).ok);const tab=(await(await fetch(`http://127.0.0.1:${debugPort}/json/list`)).json()).find(t=>t.type==='page');client=await connect(tab.webSocketDebuggerUrl);await client.send('Page.enable');
 await client.send('Page.navigate',{url:base+'/tests/fixtures/userscript_bootstrap.html?delay=50'});await waitFor(()=>value("Boolean(document.querySelector('#sp-on'))"));
 await value(`window.ThinkerRatingTracker.start({window:new Proxy(window,{get(t,k){if(k==='location')return{hostname:'www.chess.com',href:location.href};const v=Reflect.get(t,k,t);return typeof v==='function'&&!['MutationObserver'].includes(k)?v.bind(t):v;}}),baseUrl:location.origin,gmRequest:window.GM_xmlhttpRequest});void 0`);await waitFor(()=>value("Boolean(document.querySelector('#tc-rating-target'))"));
 const consoleResults=[];
 for(const pacing of [false,true])for(const width of [1086,1280,1440,1920,1033,800]){
  await fetch(base+'/config/save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({smartPacing:pacing})});await waitFor(()=>value(`document.querySelector('#sp-on').checked===${pacing}`));await waitFor(()=>value(`(getComputedStyle(document.querySelector('#auto-delay-section')).display==='none')===${pacing}`));await client.send('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:false});await pause(250);
  const r=await value(`(()=>{const rect=n=>n.getBoundingClientRect().toJSON();return{panels:[...document.querySelectorAll('.kb-console-module,#oi-zone2,.kb-console-caption,.tc-scout-title')].map(n=>({id:n.id,cls:n.className,box:rect(n)})),colors:[...document.querySelectorAll('#krypbot-container *,#oi-zone2 *')].filter(n=>n.getBoundingClientRect().width&&n.getBoundingClientRect().height).map(n=>{const s=getComputedStyle(n);return{tag:n.tagName,id:n.id,cls:String(n.className),color:s.color,background:s.backgroundColor,border:s.borderColor}})}})()`);consoleResults.push({width,pacing,...r});
 }
 await writeFile(join(output,'console.json'),JSON.stringify(consoleResults));
console.log('PASS captured stable console baseline from c884834');}finally{client?.socket.close();chrome.kill();server.kill();await pause(500);await rm(profile,{recursive:true,force:true,maxRetries:6,retryDelay:200});}
