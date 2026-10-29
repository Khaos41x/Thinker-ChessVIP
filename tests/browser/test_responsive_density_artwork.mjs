import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {resolve,join} from 'node:path';
import {createServer} from 'node:net';
const root=resolve(import.meta.dirname,'../..'),before=process.argv.includes('--before');
const output=join(root,'_bmad-output/implementation-artifacts/responsive-display','density-artwork');await mkdir(output,{recursive:true});
const pause=ms=>new Promise(r=>setTimeout(r,ms));
const port=()=>new Promise(r=>{const s=createServer();s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>r(p));});});
const serverPort=await port(),debugPort=await port(),base=`http://127.0.0.1:${serverPort}`;
const profile=await mkdtemp(join(tmpdir(),'thinker-config-entry-'));
const preference=join(profile,'preferences.json');
const server=spawn('python',['tests/responsive_fixture.py',String(serverPort),'--preferences',preference],{cwd:root,stdio:'ignore',windowsHide:true});
await mkdir(join(profile,'Default'),{recursive:true});const level=Math.log(2)/Math.log(1.2);await writeFile(join(profile,'Default','Preferences'),JSON.stringify({partition:{default_zoom_level:{'':level,x:level}},profile:{default_zoom_level:level}}));
const chrome=spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--force-device-scale-factor=1.5','--disable-gpu','--no-first-run','--disable-background-timer-throttling',`--remote-debugging-port=${debugPort}`,`--user-data-dir=${profile}`,'about:blank'],{stdio:'ignore',windowsHide:true});
let client;const messages=[],exceptions=[],network=[];
async function waitFor(test){for(let i=0;i<240;i++){try{if(await test())return;}catch{}await pause(100);}throw Error('Timeout');}
async function connect(url){const socket=new WebSocket(url),pending=new Map(),handlers=new Map();let id=0;socket.addEventListener('message',e=>{const m=JSON.parse(e.data);handlers.get(m.method)?.(m.params);const p=pending.get(m.id);if(p){pending.delete(m.id);m.error?p.reject(Error(m.error.message)):p.resolve(m.result);}});await new Promise(r=>socket.addEventListener('open',r,{once:true}));return{socket,on:(m,f)=>handlers.set(m,f),send:(method,params={})=>new Promise((resolve,reject)=>{pending.set(++id,{resolve,reject});socket.send(JSON.stringify({id,method,params}));})};}
async function value(expression){const r=await client.send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value;}
const reports=[];
try{
 await waitFor(async()=> (await fetch(base+'/config/load')).ok);await waitFor(async()=> (await fetch(`http://127.0.0.1:${debugPort}/json/list`)).ok);const tab=(await(await fetch(`http://127.0.0.1:${debugPort}/json/list`)).json()).find(t=>t.type==='page');client=await connect(tab.webSocketDebuggerUrl);await client.send('Page.enable');await client.send('Runtime.enable');const windowId=(await client.send('Browser.getWindowForTarget',{targetId:tab.id})).windowId;const old=execFileSync('git',['show','6979de2:script.js'],{cwd:root,maxBuffer:2000000}).toString('base64');let baseline=true;await client.send('Fetch.enable',{patterns:[{urlPattern:'*/script.js*'}]});client.on('Fetch.requestPaused',e=>client.send(baseline?'Fetch.fulfillRequest':'Fetch.continueRequest',{requestId:e.requestId,...(baseline?{responseCode:200,responseHeaders:[{name:'Content-Type',value:'application/javascript'}],body:old}:{})}).catch(()=>{}));
 for(const phase of ['before','after']){
  baseline=phase==='before';await client.send('Page.navigate',{url:base+'/responsive?delay=20'});await waitFor(()=>value("document.querySelector('.tc-analysis-status')?.textContent==='Ready'"));await client.send('Browser.setWindowBounds',{windowId,bounds:{width:2896,height:1895}});await pause(300);await value('scrollTo(0,0)');await waitFor(()=>value("document.querySelector('#thinker-chess-banner img').getBoundingClientRect().width>0"));
  const r=await value("({dpr:devicePixelRatio,innerWidth,innerHeight,pinch:visualViewport.scale,art:document.querySelector('#thinker-chess-banner img').getBoundingClientRect().toJSON(),card:document.querySelector('#thinker-chess-banner').getBoundingClientRect().toJSON()})");assert.equal(r.dpr,3);assert.equal(r.pinch,1);assert.equal(r.innerWidth,1440);if(phase==='after')assert.equal(r.art.width,70);reports.push({phase,...r});const shot=await client.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});await writeFile(join(output,phase+'.png'),Buffer.from(shot.data,'base64'));
 }
 assert.equal(reports[0].card.width,reports[1].card.width);await writeFile(join(output,'report.json'),JSON.stringify({method:'Native browser zoom200%, OS scale150% simulated with isolated Chrome flag; actual multi-monitor hardware not tested',reports},null,2));console.log('PASS effectiveDPR3: card unchanged, artwork CSS width restored from46px to70px');
}finally{client?.socket.close();chrome.kill();server.kill();await pause(500);await rm(profile,{recursive:true,force:true,maxRetries:6,retryDelay:200});}