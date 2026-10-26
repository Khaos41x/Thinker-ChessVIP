import assert from 'node:assert/strict';
import {spawn,execFileSync} from 'node:child_process';
import {mkdtemp,mkdir,writeFile,rm,access} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {resolve,join} from 'node:path';
import {createServer} from 'node:net';
const root=resolve(import.meta.dirname,'../..');
const before=process.argv.includes('--before');
const configOnly=process.argv.includes('--config-only');
const output=join(root,'_bmad-output/implementation-artifacts/narrow-1086',before?'before':'after');
await mkdir(output,{recursive:true});
if(before){const path=join(root,'.narrow-1086-baseline/script.js');try{await access(path)}catch{await mkdir(join(root,'.narrow-1086-baseline'),{recursive:true});await writeFile(path,execFileSync('git',['show','27c09cc:script.js'],{cwd:root}));}}

const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const port=()=>new Promise(resolve=>{const s=createServer();s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>resolve(p));});});
const serverPort=await port(),debug=await port(),base=`http://127.0.0.1:${serverPort}`;
const profile=await mkdtemp(join(tmpdir(),'thinker-phase091-capture-'));
const backend=spawn('python',['-c',"import importlib.util,sys;from pathlib import Path;from flask import Response,request;spec=importlib.util.spec_from_file_location('visual','tests/phase091_visual_fixture.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)\noriginal=m.app.view_functions['fixture']\ndef fixture():\n response=original()\n if request.args.get('scoutFull')=='1':\n  source=response.get_data(as_text=True).replace('time_class: index < 46 ? \\\"bullet\\\" : \\\"blitz\\\"','time_class: [\\\"bullet\\\",\\\"blitz\\\",\\\"rapid\\\",\\\"daily\\\"][index % 4]').replace('GMTestTC01','GMTestFull')\n  source=source.replace('Pirc Defense: Classical Variation','Pirc Defense: Classical Variation, Austrian Attack, Deep Main Line with a deliberately long opening name').replace('Caro-Kann Defense: Exchange Variation','Caro-Kann Defense: Exchange Variation, Panov Attack, a deliberately long opening variation')\n  response.set_data(source)\n return response\nm.app.view_functions['fixture']=fixture\nif '--baseline' in sys.argv:m.app.view_functions['userscript']=lambda:Response(Path('.narrow-1086-baseline/script.js').read_text(encoding='utf8'),content_type='application/javascript')\nm.app.run(host='127.0.0.1',port=int(sys.argv[1]),threaded=True,use_reloader=False)",String(serverPort),...(before?['--baseline']:[])],{cwd:root,stdio:'ignore',windowsHide:true});
const browser=spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--disable-gpu','--no-first-run','--disable-background-timer-throttling','--disable-renderer-backgrounding',`--remote-debugging-port=${debug}`,`--user-data-dir=${profile}`,'about:blank'],{stdio:'ignore',windowsHide:true});
const clients=[];
async function waitFor(test){for(let i=0;i<180;i++){try{if(await test())return;}catch{}await delay(250);}throw new Error('Timed out');}
async function connect(url){const socket=new WebSocket(url);let id=0;const pending=new Map();const handlers=new Map();socket.addEventListener('message',event=>{const data=JSON.parse(event.data);if(data.method)handlers.get(data.method)?.(data.params);const p=pending.get(data.id);if(p){pending.delete(data.id);data.error?p.reject(new Error(data.error.message)):p.resolve(data.result);}});await new Promise((resolve,reject)=>{socket.addEventListener('open',resolve,{once:true});socket.addEventListener('error',reject,{once:true});});const c={socket,on:(method,handler)=>handlers.set(method,handler),send:(method,params={})=>new Promise((resolve,reject)=>{pending.set(++id,{resolve,reject});socket.send(JSON.stringify({id,method,params}));})};clients.push(c);return c;}
async function tab(url){const t=await(await fetch(`http://127.0.0.1:${debug}/json/new?${encodeURIComponent(url)}`,{method:'PUT'})).json();const c=await connect(t.webSocketDebuggerUrl);await c.send('Page.enable');return c;}
async function value(c,expression){const r=await c.send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw new Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value;}
try{
 await waitFor(async()=> (await fetch(base+'/config/load')).ok);await waitFor(async()=> (await fetch(`http://127.0.0.1:${debug}/json/version`)).ok);
 const results=[];const errors=[];
 const measure=()=>{
  const rect=n=>{const b=n.getBoundingClientRect();return{x:b.x,y:b.y,width:b.width,height:b.height,right:b.right,bottom:b.bottom}};
  const visible=n=>{const b=n.getBoundingClientRect(),s=getComputedStyle(n);return b.width>0&&b.height>0&&s.display!=='none'&&s.visibility!=='hidden'&&s.opacity!=='0'};
  const wrapper=document.querySelector('#oi-wrapper'),grid=document.querySelector('.kb-console-grid'),scout=document.querySelector('#oi-zone2');
  const panels=Object.fromEntries([...document.querySelectorAll('.kb-core-module,.kb-visuals-module,.kb-engine-module,#kb-session-panel,#oi-zone2')].map(n=>[n.id||n.className,{...rect(n),tail:rect(n).bottom-1-Math.max(...[...n.children].filter(visible).map(c=>rect(c).bottom))}]));
  const fields=[...document.querySelectorAll('#kb-session-duration,#kb-session-min-rate,#kb-session-max-rate,#tc-rating-target')].map(n=>({id:n.id,...rect(n)}));const buttons=[...document.querySelectorAll('#kb-session-start,#kb-session-stop,#kb-session-export')].map(n=>({id:n.id,...rect(n)}));
  const range=document.querySelector('.kb-delay-range');let timing=null;if(visible(range)){const labels=[...range.querySelectorAll('.kb-delay-input')],dash=range.querySelector('.kb-delay-separator'),r=document.createRange();r.selectNodeContents(dash);const d=r.getBoundingClientRect();timing={inputs:labels.map(n=>rect(n.querySelector('input'))),boxes:labels.map(rect),separator:rect(dash),gapLeft:d.x-rect(labels[0]).right,gapRight:rect(labels[1]).x-d.right,options:[...document.querySelectorAll('.kb-timing-mode label')].map(rect)};}
  const nodes=[...scout.querySelectorAll('*')].filter(visible);const small=nodes.filter(n=>[...n.childNodes].some(c=>c.nodeType===3&&c.textContent.trim())&&parseFloat(getComputedStyle(n).fontSize)<11).map(n=>n.className);
  const openings=[...scout.querySelectorAll('.tc-scout-opening-row')].map(n=>{const name=n.querySelector('.tc-scout-opening-name'),count=n.querySelector('.tc-scout-opening-count');return{name:name.textContent,title:name.title,box:rect(name),row:rect(n),count:rect(count),ellipsis:getComputedStyle(name).textOverflow,whiteSpace:getComputedStyle(name).whiteSpace,overflow:getComputedStyle(name).overflow,scrollWidth:name.scrollWidth,clientWidth:name.clientWidth}});
  const stats=[...scout.querySelectorAll('.tc-scout-stat-value')].map(rect);
  const clipping=nodes.filter(n=>n.matches('b,small,.tc-scout-subtitle,.tc-scout-record,.tc-scout-section-title')&&n.scrollWidth>n.clientWidth+1&&n.clientWidth>0).map(n=>({class:n.className,text:n.textContent,scroll:n.scrollWidth,client:n.clientWidth}));
  const controls=[...document.querySelectorAll('#krypbot-container input,#krypbot-container select,#krypbot-container button,#krypbot-container .kb-radio-group')].filter(visible).map(n=>({id:n.id,...rect(n)}));
  const colors=[...document.querySelectorAll('#krypbot-container *,#oi-zone2 *')].filter(visible).map(n=>{const s=getComputedStyle(n);return{tag:n.tagName,id:n.id,class:String(n.className),color:s.color,background:s.backgroundColor,border:s.borderColor}});
  return{width:innerWidth,mode:wrapper.dataset.layoutMode,wrapper:rect(wrapper),columns:getComputedStyle(grid).gridTemplateColumns,gaps:getComputedStyle(grid).gap,panels,fields,buttons,timing,scout:{box:rect(scout),openings,stats,small,clipping},controls,colors};
 };
 for(const content of ['empty','four','full']){
  const c=await tab(base+'/tests/fixtures/userscript_bootstrap.html?delay=50'+(content==='full'?'&scoutFull=1':''));await c.send('Runtime.enable');c.on('Runtime.exceptionThrown',e=>errors.push(e.exceptionDetails.text));await waitFor(()=>value(c,"Boolean(document.querySelector('#sp-on'))"));
  await value(c,`window.ThinkerRatingTracker.start({window:new Proxy(window,{get(target,key){if(key==='location')return {hostname:'www.chess.com',href:location.href};const item=Reflect.get(target,key,target);return typeof item==='function'&&!['MutationObserver'].includes(key)?item.bind(target):item;}}),baseUrl:location.origin,gmRequest:window.GM_xmlhttpRequest});void 0`);await waitFor(()=>value(c,"Boolean(document.querySelector('#tc-rating-target'))"));
  await value(c,`document.querySelector('#board-layout-player-top .user-username-component').textContent=${JSON.stringify(content==='empty'?'Waiting for opponent':content==='full'?'GMTestFull':'GMTestTC01')}`);
  if(content!=='empty')await waitFor(()=>value(c,"document.querySelectorAll('.tc-scout-opening-row').length===4"));
  await waitFor(()=>value(c,"document.querySelector('.tc-analysis-status')?.textContent==='Ready'"));
  for(const pacing of [false,true])for(const delayMode of ['random','max']){
   const saved=await fetch(base+'/config/save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({smartPacing:pacing,delayMode})});assert(saved.ok);await waitFor(()=>value(c,`document.querySelector('#sp-on').checked===${pacing}&&document.querySelector('#dm-${delayMode==='random'?'rand':'max'}').checked`));
   for(const width of [1085,1086,1087,1280,1440,1920,1033,800]){
    await c.send('Page.bringToFront');await c.send('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:false});await delay(200);const r=await value(c,'('+measure.toString()+')()');r.state={content,pacing,delayMode};results.push(r);
    if(width===1086&&delayMode==='random'){const shot=await c.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,clip:{...r.wrapper,scale:1}});await writeFile(join(output,`console-${content}-pacing${Number(pacing)}.png`),Buffer.from(shot.data,'base64'));if(content!=='empty'){const b=r.scout.box;const shot=await c.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,clip:{...b,scale:1}});await writeFile(join(output,`scout-${content}-pacing${Number(pacing)}.png`),Buffer.from(shot.data,'base64'));}}
   }
  }
  await c.send('Page.navigate',{url:'about:blank'});
 }
 assert.deepEqual(errors,[]);await writeFile(join(output,'measurements.json'),'[\n'+results.map(x=>JSON.stringify(x)).join(',\n')+'\n]');console.log('PASS captured'+results.length+' states including empty/four/full Scout, mode/pacing and exact-width sentinels');
}finally{for(const c of clients)c.socket.close();browser.kill();backend.kill();await delay(500);await rm(profile,{recursive:true,force:true,maxRetries:5,retryDelay:150});}
