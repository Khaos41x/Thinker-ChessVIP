import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {resolve,join} from 'node:path';
import {createServer} from 'node:net';
const root=resolve(import.meta.dirname,'../..');
const before=process.argv.includes('--before');
const output=join(root,'_bmad-output/implementation-artifacts/phase09-1-external-config',before?'before':'after');
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
 await waitFor(()=>value(embedded,"Boolean(document.querySelector('#kb-session-duration'))"));
 await value(embedded, `window.ThinkerRatingTracker.start({window:new Proxy(window,{get(target,key){if(key==='location')return {hostname:'www.chess.com',href:location.href};const item=Reflect.get(target,key,target);return typeof item==='function'&&!['MutationObserver'].includes(key)?item.bind(target):item;}}),baseUrl:location.origin,gmRequest:window.GM_xmlhttpRequest});void 0`);
 await waitFor(()=>value(embedded,"Boolean(document.querySelector('#tc-rating-target'))"));
 await delay(2500);
 const report=[];
 for(const [width,height,zoom]of [[1280,720,1],[1440,900,1],[1920,1080,1],[1440,900,1.25],[1440,900,1.5]]){
  for(const [name,c]of [['external',panel],['embedded',embedded]]){
   await c.send('Page.bringToFront');
   await c.send('Emulation.setDeviceMetricsOverride',{width:Math.round(width/zoom),height:Math.round(height/zoom),deviceScaleFactor:zoom,mobile:false});
   await delay(100);
   const selector=name==='external'?'main':'#krypbot-container';
   const state=await value(c,`(()=>{const root=document.querySelector(${JSON.stringify(selector)});const box=root.getBoundingClientRect();return {text:root.innerText,width:innerWidth,height:innerHeight,documentWidth:document.documentElement.scrollWidth,box:{x:box.x+scrollX,y:box.y+scrollY,width:box.width,height:box.height,scale:1},fields:Array.from(root.querySelectorAll('input,select,button')).map(n=>({id:n.id,label:n.getAttribute('aria-label')||n.textContent,type:n.type,disabled:n.disabled,tabIndex:n.tabIndex,bounds:(()=>{const b=n.getBoundingClientRect();return {x:b.x,y:b.y,width:b.width,height:b.height};})()}))};})()`);
   if(!before){
    const ids=['kb-session-duration','kb-session-min-rate','kb-session-max-rate','tc-rating-target','kb-session-start','kb-session-stop','kb-session-export'];
    assert(ids.every(id=>state.fields.some(field=>field.id===id)),`${name}: missing Auto Play field`);
    assert(state.fields.filter(field=>ids.includes(field.id)).every(field=>field.bounds.width>0&&field.bounds.x>=state.box.x-1&&field.bounds.x+field.bounds.width<=state.box.x+state.box.width+1),`${name}: clipped workspace field`);
    if(name==='external')assert(state.documentWidth<=state.width,'External Config overflows');
    const engine=name==='external'?'analysis-engine':'tc-analysis-engine';
    assert(await value(c,`(()=>{const n=document.getElementById('${engine}');n.focus({preventScroll:true});return !n.disabled&&document.activeElement===n&&n.options.length===3;})()`),'Engine selector is not keyboard accessible');
    state.keyboardEngineSelector=true;
   }
   const screen=await c.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,clip:state.box});
   const file=`${name}-${width}x${height}-${Math.round(zoom*100)}pct.png`;
   const viewportFile=file.replace('.png','-viewport.png');
   const viewport=await c.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
   await writeFile(join(output,viewportFile),Buffer.from(viewport.data,'base64'));
   await writeFile(join(output,file),Buffer.from(screen.data,'base64'));
   report.push({surface:name,width,height,zoom,file,viewportFile,state});
  }
 }
 await writeFile(join(output,'capture.json'),JSON.stringify(report,null,2));
 console.log(JSON.stringify({phase:before?'before':'after',captures:report.map(({surface,width,height,zoom,file,state})=>({surface,width,height,zoom,file,horizontalOverflow:state.documentWidth>state.width,autoPlayFields:state.fields.filter(x=>x.id.includes('session')).map(x=>x.id)}))},null,2));
}finally{
 for(const c of clients)c.socket.close();browser.kill();backend.kill();await delay(500);await rm(profile,{recursive:true,force:true,maxRetries:5,retryDelay:150});
}
