import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {resolve,join} from 'node:path';
import {createServer} from 'node:net';
const root=resolve(import.meta.dirname,'../..');
const before=process.argv.includes('--before');
const output=join(root,'_bmad-output/implementation-artifacts/definitive-finish/before');
await mkdir(output,{recursive:true});
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const port=()=>new Promise(resolve=>{const s=createServer();s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>resolve(p));});});
const serverPort=await port(),debug=await port(),base=`http://127.0.0.1:${serverPort}`;
const profile=await mkdtemp(join(tmpdir(),'thinker-phase091-capture-'));
const backend=spawn('python',['tests/phase091_visual_fixture.py',String(serverPort),...(before?['--before']:[])],{cwd:root,stdio:'ignore',windowsHide:true});
const browser=spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--disable-gpu','--no-first-run','--disable-background-timer-throttling','--disable-renderer-backgrounding',`--remote-debugging-port=${debug}`,`--user-data-dir=${profile}`,'about:blank'],{stdio:'ignore',windowsHide:true});
const clients=[];
async function waitFor(test){for(let i=0;i<180;i++){try{if(await test())return;}catch{}await delay(100);}throw new Error('Timed out');}
async function connect(url){const socket=new WebSocket(url);let id=0;const pending=new Map();const handlers=new Map();socket.addEventListener('message',event=>{const data=JSON.parse(event.data);if(data.method)handlers.get(data.method)?.(data.params);const p=pending.get(data.id);if(p){pending.delete(data.id);data.error?p.reject(new Error(data.error.message)):p.resolve(data.result);}});await new Promise((resolve,reject)=>{socket.addEventListener('open',resolve,{once:true});socket.addEventListener('error',reject,{once:true});});const c={socket,on:(method,handler)=>handlers.set(method,handler),send:(method,params={})=>new Promise((resolve,reject)=>{pending.set(++id,{resolve,reject});socket.send(JSON.stringify({id,method,params}));})};clients.push(c);return c;}
async function tab(url){const t=await(await fetch(`http://127.0.0.1:${debug}/json/new?${encodeURIComponent(url)}`,{method:'PUT'})).json();const c=await connect(t.webSocketDebuggerUrl);await c.send('Page.enable');return c;}
async function value(c,expression){const r=await c.send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw new Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value;}
try{
 await waitFor(async()=> (await fetch(base+'/config/load')).ok);
 await waitFor(async()=> (await fetch(`http://127.0.0.1:${debug}/json/version`)).ok);
 const panel=await tab(base+'/config');
 await waitFor(()=>value(panel,"Boolean(document.querySelector('[data-key=hint]') && !document.querySelector('[data-key=hint]').disabled)"));
 const embedded=await tab(base+'/tests/fixtures/userscript_bootstrap.html?delay=50');
 await embedded.send('Runtime.enable');embedded.on('Runtime.exceptionThrown',event=>console.log('Browser exception',event.exceptionDetails.exception?.description||event.exceptionDetails.text));
 await embedded.send('Network.enable');embedded.on('Network.responseReceived',event=>{if(event.response.url.includes('/engines/preference'))console.log('Preference response',event.response.status);});
 await waitFor(()=>value(embedded,"Boolean(document.querySelector('#kb-session-duration'))"));
 await value(embedded, `window.ThinkerRatingTracker.start({window:new Proxy(window,{get(target,key){if(key==='location')return {hostname:'www.chess.com',href:location.href};const item=Reflect.get(target,key,target);return typeof item==='function'&&!['MutationObserver'].includes(key)?item.bind(target):item;}}),baseUrl:location.origin,gmRequest:window.GM_xmlhttpRequest});void 0`);
 await waitFor(()=>value(embedded,"Boolean(document.querySelector('#tc-rating-target'))"));
 await embedded.send('Page.bringToFront');
 await delay(2500);
 await embedded.send('Emulation.setDeviceMetricsOverride',{width:1086,height:1000,deviceScaleFactor:1,mobile:false});
 await delay(300);
 const original=await value(embedded,`(()=>{const read=()=>({engine:document.querySelector('.kb-engine-module').getBoundingClientRect().height,inputs:[...document.querySelectorAll('#minDelayInput,#maxDelayInput')].map(n=>({id:n.id,width:n.getBoundingClientRect().width,wrapper:n.parentElement.getBoundingClientRect().width})),segmented:(()=>{const n=document.querySelector('.kb-engine-timing .kb-timing-mode'),b=n.getBoundingClientRect();return{width:b.width,labels:[...n.querySelectorAll('label')].map(l=>{const r=document.createRange();r.selectNodeContents(l);return{text:l.textContent,width:l.getBoundingClientRect().width,textWidth:r.getBoundingClientRect().width}})}})()});return read();})()`);
 const third=await value(embedded,`(()=>{const style=document.createElement('style');style.textContent='@media(min-width:1034px) and (max-width:1086px){#krypbot-container .kb-engine-timing .kb-delay-range{gap:2px;grid-template-columns:round(down,calc((100% - 3px - 2px - 2px)/2),1px) 3px minmax(0,1fr)}}';document.head.append(style);const inputs=[...document.querySelectorAll('#minDelayInput,#maxDelayInput')].map(n=>({id:n.id,width:n.getBoundingClientRect().width,wrapper:n.parentElement.getBoundingClientRect().width}));return{engine:document.querySelector('.kb-engine-module').getBoundingClientRect().height,inputs,separator:document.querySelector('.kb-delay-separator').getBoundingClientRect().width,gap:getComputedStyle(document.querySelector('.kb-engine-timing .kb-delay-range')).gap};})()`);
 const ownRow=await value(embedded,`(()=>{const style=document.createElement('style');style.textContent='#krypbot-container .kb-engine-timing .kb-run-delay-controls{grid-template-columns:minmax(0,1fr)}#krypbot-container .kb-engine-timing .kb-delay-range{gap:8px;grid-template-columns:round(down,calc((100% - 11px - 8px - 8px)/2),1px) 11px minmax(0,1fr)}';document.head.append(style);return{engine:document.querySelector('.kb-engine-module').getBoundingClientRect().height,inputs:[...document.querySelectorAll('#minDelayInput,#maxDelayInput')].map(n=>({id:n.id,width:n.getBoundingClientRect().width,wrapper:n.parentElement.getBoundingClientRect().width})),segmented:document.querySelector('.kb-engine-timing .kb-timing-mode').getBoundingClientRect().width};})()`);
 await embedded.send('Emulation.setDeviceMetricsOverride',{width:1280,height:1000,deviceScaleFactor:1,mobile:false});
 const wide=await value(embedded,`(()=>{const styles=[...document.head.querySelectorAll('style')];styles[styles.length-1].remove();return{engine:document.querySelector('.kb-engine-module').getBoundingClientRect().height,inputs:[...document.querySelectorAll('#minDelayInput,#maxDelayInput')].map(n=>({id:n.id,width:n.getBoundingClientRect().width}))};})()`);
 const createSource=await import('node:fs/promises').then(fs=>fs.readFile(join(root,'script.js'),'utf8'));
 const extracted=createSource.slice(createSource.indexOf('  const create_elm = (num, board) => {'),createSource.indexOf('  const create_div = (str1) => {'))+';return create_elm;';
 const highlights=await value(embedded,`(()=>{const create=(new Function('current_color','$','document',${JSON.stringify(extracted)}));const results=[];const board=document.querySelector('wc-chess-board');for(const color of ['#10B981','#3B82F6']){const fn=create(color,window.jQuery,document);fn(11,board);const n=board.querySelector('.myhigh');const s=getComputedStyle(n);results.push({configured:color,border:s.border,borderColor:s.borderColor,background:s.backgroundColor,boxShadow:s.boxShadow,opacity:s.opacity,borderRadius:s.borderRadius});n.remove();}return results;})()`);
 await writeFile(join(output,'timing-proposals-and-highlight-baseline.json'),JSON.stringify({original,third,ownRow,wide,highlights},null,2));console.log(JSON.stringify({original,third,ownRow,wide,highlights},null,2));
}finally{for(const c of clients)c.socket.close();browser.kill();backend.kill();await delay(500);await rm(profile,{recursive:true,force:true,maxRetries:5,retryDelay:150});}
