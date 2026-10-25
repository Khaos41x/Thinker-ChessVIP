import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,mkdir,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {resolve,join} from 'node:path';
import {createServer} from 'node:net';
const root=resolve(import.meta.dirname,'../..');
const before=process.argv.includes('--before');
const output=join(root,process.argv.includes('--connectivity')?'_bmad-output/implementation-artifacts/connectivity-finish/block-1/arrow-ui':'_bmad-output/implementation-artifacts/definitive-finish/block-b');
await mkdir(output,{recursive:true});
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const port=()=>new Promise(resolve=>{const s=createServer();s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>resolve(p));});});
const serverPort=await port(),debug=await port(),base=`http://127.0.0.1:${serverPort}`;
const profile=await mkdtemp(join(tmpdir(),'thinker-phase091-capture-'));
const backend=spawn('python',['tests/arrow_color_sync_fixture.py',String(serverPort)],{cwd:root,stdio:'ignore',windowsHide:true});
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
 await waitFor(()=>value(panel,"Boolean(document.querySelector('#color') && !document.querySelector('#color').disabled)"));
 const embedded=await tab(base+'/tests/fixtures/userscript_bootstrap.html?delay=50');
 await waitFor(()=>value(embedded,"Boolean(window.__arrowColorQA && document.querySelector('#kb-color-picker'))"));
 await delay(2500);
 const paint=()=>{
   const board=document.querySelector('wc-chess-board');
   window.__arrowColorQA.draw('e2e4');
   window.__arrowColorQA.highlight('52',board);
   window.__arrowColorQA.highlight('54',board);
 };
 const arrow=()=>{
   const n=document.querySelector('.myarrow'),p=n?.querySelector('path'),b=document.querySelector('wc-chess-board');
   const rect=e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom}};
   const style=n&&getComputedStyle(n);const a=n&&rect(n);const overlays=[...document.querySelectorAll('#thinker-chess-banner,#oi-zone2,.tc-hud-stats')].map(e=>{const x=rect(e),s=getComputedStyle(e);return{selector:e.id||e.className,box:x,display:s.display,overlapsArrow:Boolean(a&&x.width&&x.height&&x.x<a.right&&x.right>a.x&&x.y<a.bottom&&x.bottom>a.y)}});
   return{display:style?.display,visibility:style?.visibility,zIndex:style?.zIndex,pointerEvents:style?.pointerEvents,inCorrectBoard:n?.parentElement===b,overlays,board:rect(b),box:n&&rect(n),fill:p?.getAttribute('fill'),opacity:p?.getAttribute('fill-opacity'),path:p?.getAttribute('d'),orientation:b.getAttribute('orientation'),flipped:b.classList.contains('flipped'),high:[...document.querySelectorAll('.myhigh')].map(e=>{const s=getComputedStyle(e);return{border:s.borderColor,background:s.backgroundColor,shadow:s.boxShadow}})};
 };
 const colors=()=>[...document.querySelectorAll('#krypbot-container *,#oi-zone2 *,#thinker-chess-banner *, .myhigh')].filter(n=>n.getBoundingClientRect().width&&n.getBoundingClientRect().height&&!n.matches('#kb-color-picker,.myarrow,.myarrow *')).map(n=>{const s=getComputedStyle(n);return{tag:n.tagName,id:n.id,cls:String(n.className),color:s.color,background:s.backgroundColor,border:s.borderColor,shadow:s.boxShadow,fill:s.fill,stroke:s.stroke,opacity:s.opacity}});
 await value(embedded,'('+paint.toString()+')()');
 const initial=await value(embedded,'('+arrow.toString()+')()');
 const initialColors=await value(embedded,'('+colors.toString()+')()');
 assert.equal(initial.fill.toUpperCase(),'#3B82F6');
 const evidence=[];
 for(const orientation of ['white','black','flipped']){
   await value(embedded,`{const b=document.querySelector('wc-chess-board');b.setAttribute('orientation',${JSON.stringify(orientation==='black'?'black':'white')});b.classList.toggle('flipped',${orientation==='flipped'});}`);
   await value(embedded,'('+paint.toString()+')()');
   const a=await value(embedded,'('+arrow.toString()+')()');
   assert.equal(a.opacity,'0.8');assert(a.path.length>30);assert(a.inCorrectBoard);assert.equal(a.visibility,'visible');assert.notEqual(a.display,'none');assert.equal(a.zIndex,'11');assert.equal(a.pointerEvents,'none');assert(a.overlays.every(o=>o.display==='none'||!o.overlapsArrow),'Overlay covers the recommendation board');
   assert.equal(a.box.x,a.board.x);assert.equal(a.box.y,a.board.y);assert.equal(a.box.width,a.board.width);assert.equal(a.box.height,a.board.height);
   const shot=await embedded.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,clip:{x:a.board.x,y:a.board.y,width:a.board.width,height:a.board.height,scale:1}});
   await writeFile(join(output,'arrow-'+orientation+'.png'),Buffer.from(shot.data,'base64'));
   evidence.push({orientation,...a});
 }
 const unchanged=async(label)=>{
   const after=await value(embedded,'('+colors.toString()+')()');
   const differences=after.flatMap((item,i)=>JSON.stringify(item)===JSON.stringify(initialColors[i])?[]:[{before:initialColors[i],after:item}]);
   await writeFile(join(output,'color-diff-'+label+'.json'),JSON.stringify(differences,null,2));
   assert.equal(differences.length,0,'A non-arrow component changed computed colors');
   const a=await value(embedded,'('+arrow.toString()+')()');
   assert.deepEqual(a.high,initial.high);assert(a.high.length===2);assert(a.high.every(h=>h.border==='rgb(16, 185, 129)'&&h.background.startsWith('rgba(16, 185, 129,')&&h.shadow.includes('16, 185, 129')));
   evidence.push({action:label,...a});
 };
 await value(embedded,"{const n=document.querySelector('#kb-color-picker');n.value='#e879f9';n.dispatchEvent(new Event('input',{bubbles:true}));}");
 await waitFor(()=>value(embedded,"document.querySelector('.myarrow path')?.getAttribute('fill')?.toLowerCase()==='#e879f9'"));
 await unchanged('embedded-swatch');
 await waitFor(()=>value(panel,"document.querySelector('#color').value.toLowerCase()==='#e879f9'"));
 const externalColors=()=>[...document.querySelectorAll('body *')].filter(n=>n.getBoundingClientRect().width&&n.getBoundingClientRect().height&&!n.matches('#color,script,style')).map(n=>{const s=getComputedStyle(n);return{tag:n.tagName,id:n.id,cls:String(n.className),color:s.color,background:s.backgroundColor,border:s.borderColor,shadow:s.boxShadow,fill:s.fill,stroke:s.stroke,opacity:s.opacity}});
 const externalBefore=await value(panel,'('+externalColors.toString()+')()');
 await value(panel,"{const n=document.querySelector('#color');n.value='#f59e0b';n.dispatchEvent(new Event('input',{bubbles:true}));}");
 await waitFor(()=>value(embedded,"document.querySelector('.myarrow path')?.getAttribute('fill')?.toLowerCase()==='#f59e0b'"));
 await unchanged('external-swatch');
 const externalAfter=await value(panel,'('+externalColors.toString()+')()');
 const externalDifferences=externalAfter.flatMap((item,i)=>JSON.stringify(item)===JSON.stringify(externalBefore[i])?[]:[{before:externalBefore[i],after:item}]);
 await writeFile(join(output,'color-diff-external-components.json'),JSON.stringify(externalDifferences,null,2));
 assert.equal(externalDifferences.length,0,'External Config non-arrow component changed colors');
 await waitFor(()=>value(embedded,"document.querySelector('#kb-color-picker').value.toLowerCase()==='#f59e0b'"));
 const saved=await(await fetch(base+'/config/load')).json();assert.equal(saved.color.toLowerCase(),'#f59e0b');
 await value(panel,"{const n=document.querySelector('#color');n.value='#10b981';n.dispatchEvent(new Event('input',{bubbles:true}));}");
 await waitFor(()=>value(embedded,"document.querySelector('.myarrow path')?.getAttribute('fill')?.toLowerCase()==='#10b981'"));
 assert.equal((await(await fetch(base+'/config/load')).json()).color.toLowerCase(),'#10b981');
 await embedded.send('Page.reload');
 await waitFor(()=>value(embedded,"document.querySelector('#kb-color-picker')?.value.toLowerCase()==='#10b981'"));

 await writeFile(join(output,'arrow-color-sync.json'),JSON.stringify({passed:true,initial,evidence,componentCount:initialColors.length,externalComponentCount:externalBefore.length,fixture:'Local Chromium + actual userscript, Flask config and draw closure; test-only closure exposure, no game recommendation authority bypass'},null,2));
 console.log(JSON.stringify({passed:true,orientations:3,swatchSurfaces:2,componentCount:initialColors.length,externalComponentCount:externalBefore.length,highlight:initial.high[0],colorDiffs:0}));
}finally{
 for(const c of clients)c.socket.close();browser.kill();backend.kill();await delay(500);await rm(profile,{recursive:true,force:true,maxRetries:5,retryDelay:150});
}
