import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {resolve,join} from 'node:path';
import {createServer} from 'node:net';
const root=resolve(import.meta.dirname,'../..'),before=process.argv.includes('--before');
const output=join(root,'_bmad-output/implementation-artifacts/config-entry',before?'before':'after');await mkdir(output,{recursive:true});
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
const measure=()=>{
 const box=n=>{const r=n.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom}};
 const visible=n=>{const r=n.getBoundingClientRect(),s=getComputedStyle(n);return r.width>0&&r.height>0&&s.display!=='none'&&s.visibility!=='hidden'&&s.opacity!=='0';};
 const panels=Object.fromEntries([...document.querySelectorAll('.kb-console-module,#oi-zone2')].map((n,i)=>[n.id||n.className,{box:box(n),title:n.querySelector('.kb-console-caption,.tc-scout-title')?box(n.querySelector('.kb-console-caption,.tc-scout-title')):null}]));
 const colors=[...document.querySelectorAll('#krypbot-container *,#oi-zone2 *')].filter(n=>visible(n)&&!n.closest('.kb-config-shortcut')).map(n=>{const s=getComputedStyle(n);return{id:n.id,tag:n.tagName,cls:String(n.className),color:s.color,background:s.backgroundColor,border:s.borderColor}});
 const link=document.querySelector('.kb-config-shortcut'),toggle=document.querySelector('.kb-core-module .kb-radio-group');
 const small=[...document.querySelectorAll('#krypbot-container *,#oi-zone2 *')].filter(n=>visible(n)&&[...n.childNodes].some(c=>c.nodeType===3&&c.textContent.trim())&&parseFloat(getComputedStyle(n).fontSize)>0&&parseFloat(getComputedStyle(n).fontSize)<11).map(n=>({tag:n.tagName,id:n.id,text:n.textContent,font:getComputedStyle(n).fontSize,color:getComputedStyle(n).color,textIndent:getComputedStyle(n).textIndent,overflow:getComputedStyle(n).overflow}));
 return{width:innerWidth,mode:document.querySelector('#oi-wrapper').dataset.layoutMode,panels,colors,link:link?{box:box(link),svg:box(link.querySelector('svg')),href:link.href,target:link.target,rel:link.rel,label:link.getAttribute('aria-label'),title:link.title}:null,toggle:box(toggle),small,overflow:document.querySelector("#oi-wrapper").scrollWidth>document.querySelector("#oi-wrapper").clientWidth};
};
try{
 await waitFor(async()=> (await fetch(base+'/config/load')).ok);await waitFor(async()=> (await fetch(`http://127.0.0.1:${debugPort}/json/list`)).ok);
 const tab=(await(await fetch(`http://127.0.0.1:${debugPort}/json/list`)).json()).find(t=>t.type==='page');client=await connect(tab.webSocketDebuggerUrl);
 client.on('Runtime.consoleAPICalled',m=>messages.push(m));client.on('Runtime.exceptionThrown',m=>exceptions.push(m));client.on('Network.loadingFailed',m=>network.push(m));
 await client.send('Runtime.enable');await client.send('Page.enable');await client.send('Network.enable');
 await client.send('Page.navigate',{url:base+'/tests/fixtures/userscript_bootstrap.html?delay=50'});
 await waitFor(()=>value("Boolean(document.querySelector('#sp-on'))"));
 await value(`window.ThinkerRatingTracker.start({window:new Proxy(window,{get(t,k){if(k==='location')return{hostname:'www.chess.com',href:location.href};const v=Reflect.get(t,k,t);return typeof v==='function'&&!['MutationObserver'].includes(k)?v.bind(t):v;}}),baseUrl:location.origin,gmRequest:window.GM_xmlhttpRequest});void 0`);
 await waitFor(()=>value("Boolean(document.querySelector('#tc-rating-target'))"));await waitFor(()=>value("document.querySelector('.tc-analysis-status')?.textContent==='Ready'"));
 const results=[];
 for(const pacing of [false,true])for(const width of [1086,1280,1440,1920,1033,800]){
  await fetch(base+'/config/save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({smartPacing:pacing})});await waitFor(()=>value(`document.querySelector('#sp-on').checked===${pacing}`));
  await client.send('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:false});await pause(250);const r=await value('('+measure.toString()+')()');r.pacing=pacing;results.push(r);
  assert.deepEqual(r.small,[]);assert.equal(r.overflow,false);
  if(!before){assert(r.link);assert.equal(r.link.href,'http://127.0.0.1:5050/config');assert.equal(r.link.label,'Open External Config');assert.equal(r.link.title,r.link.label);assert.equal(r.link.target,'_blank');assert.equal(r.link.rel,'noopener noreferrer');assert.equal(r.link.box.right,r.toggle.right);assert(r.link.box.width>=24&&r.link.box.height>=24);for(const v of Object.values(r.link.box))assert(Number.isInteger(v));}
  if([1086,1440,800].includes(width)&&!pacing){const area=await value('document.querySelector("#oi-wrapper").getBoundingClientRect().toJSON()');const shot=await client.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,clip:{x:0,y:area.y-12,width,height:area.height+24,scale:1}});await writeFile(join(output,`console-${width}.png`),Buffer.from(shot.data,'base64'));}
 }
 if(!before){
  const baseline=JSON.parse(await readFile(join(output,'../before/measurements.json'),'utf8'));for(let i=0;i<results.length;i++){assert.deepEqual(results[i].panels,baseline[i].panels,'Panel/title geometry changed');assert.deepEqual(results[i].colors,baseline[i].colors,'Existing component colors changed');}
  await client.send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});await value('window.scrollTo(0,document.querySelector(".kb-core-module").getBoundingClientRect().top+scrollY-60)');await pause(100);
  const r=await value('('+measure.toString()+')()'),b=r.link.box;
  const shot=async name=>{const image=await client.send('Page.captureScreenshot',{format:'png',clip:{x:b.x-8,y:b.y-8,width:b.width+16,height:b.height+16,scale:3}});await writeFile(join(output,name+'.png'),Buffer.from(image.data,'base64'));};
  await shot('shortcut-rest-300');await client.send('Input.dispatchMouseEvent',{type:'mouseMoved',x:b.x+12,y:b.y+12});await shot('shortcut-hover-300');
  await value('document.activeElement?.blur()');let focused=false;for(let i=0;i<100;i++){await client.send('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});await client.send('Input.dispatchKeyEvent',{type:'keyUp',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});if(await value('document.activeElement?.matches(".kb-config-shortcut")')){focused=true;break;}}assert(focused,'Shortcut unreachable by Tab');await shot('shortcut-keyboard-300');
  const count=async()=> (await(await fetch(`http://127.0.0.1:${debugPort}/json/list`)).json()).filter(t=>t.type==='page').length;
  let n=await count();await client.send('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});await client.send('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});await waitFor(async()=>await count()>n);
  const opened=(await(await fetch(`http://127.0.0.1:${debugPort}/json/list`)).json()).find(t=>t.url==='http://127.0.0.1:5050/config');assert(opened,'New tab did not navigate to Config');
  await client.send('Page.bringToFront');await value('document.querySelector(".kb-config-shortcut").focus()');n=await count();
  await client.send('Input.dispatchKeyEvent',{type:'keyDown',key:' ',code:'Space',windowsVirtualKeyCode:32});await client.send('Input.dispatchKeyEvent',{type:'keyUp',key:' ',code:'Space',windowsVirtualKeyCode:32});await waitFor(async()=>await count()>n);
  for(const [button,buttons,modifiers] of [['left',1,0],['middle',4,0],['left',1,2]]){
   await client.send('Page.bringToFront');n=await count();await client.send('Input.dispatchMouseEvent',{type:'mousePressed',x:b.x+12,y:b.y+12,button,buttons,modifiers,clickCount:1});await client.send('Input.dispatchMouseEvent',{type:'mouseReleased',x:b.x+12,y:b.y+12,button,buttons:0,modifiers,clickCount:1});await waitFor(async()=>await count()>n);
  }
  await value('document.querySelector("#krypbot-container").classList.add("minimized")');assert.equal(await value('document.querySelector(".kb-config-shortcut").getBoundingClientRect().width'),0);await value('document.querySelector("#krypbot-container").classList.remove("minimized")');
 }
 await writeFile(join(output,'measurements.json'),JSON.stringify(results,null,2));await writeFile(join(output,'console.json'),JSON.stringify({messages,exceptions,network},null,2));assert.deepEqual(exceptions,[]);
 console.log(JSON.stringify({passed:true,before,states:results.length,panelGeometryUnchanged:!before,colorsUnchanged:!before,messages:messages.length}));
}finally{client?.socket.close();chrome.kill();server.kill();await pause(500);await rm(profile,{recursive:true,force:true,maxRetries:6,retryDelay:200});}
