import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {resolve,join} from 'node:path';
import {createServer} from 'node:net';
const root=resolve(import.meta.dirname,'../..'),before=process.argv.includes('--before');
const output=join(root,'_bmad-output/implementation-artifacts/config-entry','overlap');await mkdir(output,{recursive:true});
const pause=ms=>new Promise(r=>setTimeout(r,ms));
const port=()=>new Promise(r=>{const s=createServer();s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>r(p));});});
const serverPort=await port(),debugPort=await port(),base=`http://127.0.0.1:${serverPort}`;
const profile=await mkdtemp(join(tmpdir(),'thinker-config-entry-'));
const server=spawn('python',['tests/config_entry_fixture.py',String(serverPort),...(before?['--baseline']:[])],{cwd:root,stdio:'ignore',windowsHide:true});
const chrome=spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--disable-gpu','--no-first-run','--disable-background-timer-throttling',`--remote-debugging-port=${debugPort}`,`--user-data-dir=${profile}`,'about:blank'],{stdio:'ignore',windowsHide:true});
let client;const messages=[],exceptions=[],network=[];
async function waitFor(test){for(let i=0;i<240;i++){try{if(await test())return;}catch{}await pause(100);}throw Error('Timeout');}
async function connect(url){const socket=new WebSocket(url),pending=new Map(),handlers=new Map();let id=0;socket.addEventListener('message',e=>{const m=JSON.parse(e.data);handlers.get(m.method)?.(m.params);const p=pending.get(m.id);if(p){pending.delete(m.id);m.error?p.reject(Error(m.error.message)):p.resolve(m.result);}});await new Promise(r=>socket.addEventListener('open',r,{once:true}));return{socket,on:(m,f)=>handlers.set(m,f),send:(method,params={})=>new Promise((resolve,reject)=>{pending.set(++id,{resolve,reject});socket.send(JSON.stringify({id,method,params}));})};}
async function value(expression){const r=await client.send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value;}
try{
 await waitFor(async()=> (await fetch(base+'/config/load')).ok);await waitFor(async()=> (await fetch(`http://127.0.0.1:${debugPort}/json/list`)).ok);
 const tab=(await(await fetch(`http://127.0.0.1:${debugPort}/json/list`)).json()).find(t=>t.type==='page');client=await connect(tab.webSocketDebuggerUrl);await client.send('Page.enable');
 await client.send('Emulation.setDeviceMetricsOverride',{width:800,height:900,deviceScaleFactor:1,mobile:false});await client.send('Page.navigate',{url:base+'/tests/fixtures/userscript_bootstrap.html?delay=50'});await waitFor(()=>value("Boolean(document.querySelector('.kb-core-module'))"));await pause(300);
 const evidence=await value(`(()=>{const wrapper=document.querySelector('#oi-wrapper'),core=document.querySelector('.kb-core-module'),visuals=document.querySelector('.kb-visuals-module'),r=core.getBoundingClientRect(),v=visuals.getBoundingClientRect();const host=document.createElement('div');host.className='host-move-timer-probe';host.textContent='0.7s';Object.assign(host.style,{position:'absolute',left:(r.x+16)+'px',top:(r.bottom+scrollY)+'px',width:'48px',height:'12px',font:'11px/12px Arial',color:'#b9bab3',zIndex:'0'});document.body.insertBefore(host,wrapper);const s=getComputedStyle(wrapper);return{mode:wrapper.dataset.layoutMode,parent:wrapper.parentElement.tagName,position:s.position,zIndex:s.zIndex,pointerEvents:s.pointerEvents,background:s.backgroundColor,core:r.toJSON(),visuals:v.toJSON(),gap:v.y-r.bottom,host:host.getBoundingClientRect().toJSON(),scope:'Synthetic host timer deliberately extending behind the transparent console gap; demonstrates mechanism, not authenticated Chess.com geometry'}})()`);
 assert.equal(evidence.gap,12);assert.equal(evidence.background,'rgba(0, 0, 0, 0)');const shot=await client.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,clip:{x:0,y:evidence.core.bottom-60,width:800,height:140,scale:1}});await writeFile(join(output,'stacked-gap.png'),Buffer.from(shot.data,'base64'));await writeFile(join(output,'report.json'),JSON.stringify(evidence,null,2));console.log('PASS documented existing stacked transparency; no production layout changed');
}finally{client?.socket.close();chrome.kill();server.kill();await pause(500);await rm(profile,{recursive:true,force:true,maxRetries:6,retryDelay:200});}
