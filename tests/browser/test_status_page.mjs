import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {resolve,join} from 'node:path';
import {createServer} from 'node:net';
const root=resolve(import.meta.dirname,'../..'),output=join(root,'_bmad-output/implementation-artifacts/config-entry/root');await mkdir(output,{recursive:true});
const wait=ms=>new Promise(r=>setTimeout(r,ms)),port=()=>new Promise(r=>{const s=createServer();s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>r(p));});});
const http=await port(),debug=await port(),base=`http://127.0.0.1:${http}`,profile=await mkdtemp(join(tmpdir(),'thinker-status-'));
const backend=spawn('python',['tests/config_entry_fixture.py',String(http)],{cwd:root,stdio:'ignore',windowsHide:true});
const browser=spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--disable-gpu','--no-first-run',`--remote-debugging-port=${debug}`,`--user-data-dir=${profile}`,'about:blank'],{stdio:'ignore',windowsHide:true});
let socket;
async function until(fn){for(let i=0;i<200;i++){try{if(await fn())return;}catch{}await wait(100);}throw Error('Timeout');}
try{
 await until(async()=> (await fetch(base)).ok);await until(async()=> (await fetch(`http://127.0.0.1:${debug}/json/list`)).ok);
 const tab=(await(await fetch(`http://127.0.0.1:${debug}/json/list`)).json()).find(t=>t.type==='page');socket=new WebSocket(tab.webSocketDebuggerUrl);await new Promise(r=>socket.addEventListener('open',r,{once:true}));let id=0;const pending=new Map(),requests=[],errors=[];
 socket.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.method==='Network.requestWillBeSent')requests.push(m.params.request.url);if(m.method==='Runtime.exceptionThrown')errors.push(m.params);const p=pending.get(m.id);if(p){pending.delete(m.id);m.error?p.reject(Error(m.error.message)):p.resolve(m.result);}});
 const send=(method,params={})=>new Promise((resolve,reject)=>{pending.set(++id,{resolve,reject});socket.send(JSON.stringify({id,method,params}));});
 const value=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});assert(!r.exceptionDetails);return r.result.value;};
 await send('Page.enable');await send('Network.enable');await send('Runtime.enable');await send('Page.navigate',{url:base+'/'});await until(()=>value("document.readyState==='complete'&&document.querySelector('img')?.complete&&getComputedStyle(document.documentElement).getPropertyValue('--panel').trim()==='#252523'"));
 const results=[];
 for(const width of [390,768,1440,2560])for(const dpr of [1,2]){
  await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:dpr,mobile:false});await wait(50);
  const r=await value(`(()=>{const n=document.querySelector('main'),i=document.querySelector('img'),a=document.querySelector('a'),b=n.getBoundingClientRect(),s=getComputedStyle(n);return{width:innerWidth,children:[...n.children].map(x=>x.getBoundingClientRect().toJSON()),box:b.toJSON(),natural:[i.naturalWidth,i.naturalHeight],image:i.getBoundingClientRect().toJSON(),href:a.getAttribute('href'),text:n.innerText,background:s.backgroundColor,border:s.borderColor,overflow:document.documentElement.scrollWidth>innerWidth}})()`);
  await writeFile(join(output,"latest.json"),JSON.stringify({r,requests},null,2));assert.equal(r.overflow,false);assert.equal(r.href,'/config');assert.equal(r.text,'Thinker Chess\n\nOnline\n\nOpen External Config');assert.equal(r.box.x,r.width-r.box.right);assert(r.image.width*dpr<=r.natural[0]);assert(r.image.height*dpr<=r.natural[1]);for(const n of [r.box.x,r.box.y,r.box.width,r.box.height])assert(Number.isInteger(n));for(const c of r.children)for(const v of [c.x,c.y,c.width,c.height])assert(Number.isInteger(v));results.push({...r,dpr});
  const shot=await send('Page.captureScreenshot',{format:'png'});await writeFile(join(output,`status-${width}-dpr${dpr}.png`),Buffer.from(shot.data,'base64'));
 }
 assert(requests.every(url=>url.startsWith(base)));assert.deepEqual(errors,[]);await writeFile(join(output,'report.json'),JSON.stringify({passed:true,results,requests,errors,scope:'Isolated Chromium + actual Flask routes; no authenticated Chess.com'},null,2));console.log('PASS status page: eight viewport/DPR cases, integer geometry, no external requests');
}finally{socket?.close();browser.kill();backend.kill();await wait(500);await rm(profile,{recursive:true,force:true,maxRetries:5,retryDelay:200});}
