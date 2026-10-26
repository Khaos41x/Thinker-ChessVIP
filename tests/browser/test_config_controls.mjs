import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {resolve,join} from 'node:path';
import {createServer} from 'node:net';
const root=resolve(import.meta.dirname,'../..');
const before=process.argv.includes('--before');
const configOnly=process.argv.includes('--config-only');
const output=join(root,'_bmad-output/implementation-artifacts/config-controls',process.argv.includes('--after')?'after':'before');
await mkdir(output,{recursive:true});
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const port=()=>new Promise(resolve=>{const s=createServer();s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>resolve(p));});});
const serverPort=await port(),debug=await port(),base=`http://127.0.0.1:${serverPort}`;
const profile=await mkdtemp(join(tmpdir(),'thinker-phase091-capture-'));
const backend=spawn('python',['-c',before?"import importlib.util,sys;from pathlib import Path;from flask import Response,send_from_directory;baseline=Path('.definitive-finish-baseline');spec=importlib.util.spec_from_file_location('core.external_config',baseline/'core/external_config.py');old=importlib.util.module_from_spec(spec);sys.modules['core.external_config']=old;spec.loader.exec_module(old);spec=importlib.util.spec_from_file_location('visual','tests/phase091_visual_fixture.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);m.app.view_functions['userscript']=lambda:Response((baseline/'script.js').read_text(encoding='utf8'),content_type='application/javascript');m.app.view_functions['external_config.asset']=lambda filename:send_from_directory(baseline/'frontend/external_config' if (baseline/'frontend/external_config'/filename).exists() else Path.cwd()/'frontend/external_config',filename);m.app.run(host='127.0.0.1',port=int(sys.argv[1]),threaded=True,use_reloader=False)":"import importlib.util,sys;spec=importlib.util.spec_from_file_location('visual','tests/phase091_visual_fixture.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);m.app.run(host='127.0.0.1',port=int(sys.argv[1]),threaded=True,use_reloader=False)",String(serverPort)],{cwd:root,stdio:'ignore',windowsHide:true});
const browser=spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--disable-gpu','--no-first-run','--disable-background-timer-throttling','--disable-renderer-backgrounding',`--remote-debugging-port=${debug}`,`--user-data-dir=${profile}`,'about:blank'],{stdio:'ignore',windowsHide:true});
const clients=[];
async function waitFor(test){for(let i=0;i<180;i++){try{if(await test())return;}catch{}await delay(250);}throw new Error('Timed out');}
async function connect(url){const socket=new WebSocket(url);let id=0;const pending=new Map();const handlers=new Map();socket.addEventListener('message',event=>{const data=JSON.parse(event.data);if(data.method)handlers.get(data.method)?.(data.params);const p=pending.get(data.id);if(p){pending.delete(data.id);data.error?p.reject(new Error(data.error.message)):p.resolve(data.result);}});await new Promise((resolve,reject)=>{socket.addEventListener('open',resolve,{once:true});socket.addEventListener('error',reject,{once:true});});const c={socket,on:(method,handler)=>handlers.set(method,handler),send:(method,params={})=>new Promise((resolve,reject)=>{pending.set(++id,{resolve,reject});socket.send(JSON.stringify({id,method,params}));})};clients.push(c);return c;}
async function tab(url){const t=await(await fetch(`http://127.0.0.1:${debug}/json/new?${encodeURIComponent(url)}`,{method:'PUT'})).json();const c=await connect(t.webSocketDebuggerUrl);await c.send('Page.enable');return c;}
async function value(c,expression){const r=await c.send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw new Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value;}
try{
 await waitFor(async()=> (await fetch(base+'/config/load')).ok);await waitFor(async()=> (await fetch(`http://127.0.0.1:${debug}/json/version`)).ok);
 const panel=await tab(base+'/config'),embedded=await tab(base+'/tests/fixtures/userscript_bootstrap.html?delay=50');
 await waitFor(()=>value(panel,"Boolean(document.querySelector('.switch:not(:disabled)'))"));await waitFor(()=>value(embedded,"Boolean(document.querySelector('#sp-on'))"));
 const measure=surface=>{
  const rect=n=>{const r=n.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom}};
  const visible=n=>n.getBoundingClientRect().height>0;
  const style=n=>{const s=getComputedStyle(n);return{background:s.backgroundColor,border:s.borderColor,borderWidth:s.borderWidth,radius:s.borderRadius,transition:s.transition,color:s.color,fontSize:s.fontSize,padding:s.padding,align:s.alignItems,display:s.display}};
  const text=n=>{const r=document.createRange();r.selectNodeContents(n);const b=r.getBoundingClientRect();return{x:b.x,y:b.y,width:b.width,height:b.height,right:b.right,bottom:b.bottom}};
  const host=surface==='console'?document.querySelector('#krypbot-container'):document.querySelector('main');
  const toggles=[...host.querySelectorAll(surface==='console'?'.kb-radio-group:not(:has(input[name=delayMode]))':'.switch')].filter(visible).map(n=>{
   const b=rect(n),s=getComputedStyle(n),pseudo=surface==='config';const t=pseudo?getComputedStyle(n,'::before'):getComputedStyle(n.querySelector('.kb-toggle-thumb'));const diameter=parseFloat(t.width);const move=new DOMMatrix(t.transform==='none'?undefined:t.transform).m41;
   const thumb=pseudo?{x:b.x+parseFloat(s.borderLeftWidth)+parseFloat(s.paddingLeft)+move,y:b.y+(b.height-parseFloat(t.height))/2,width:diameter,height:parseFloat(t.height)}:rect(n.querySelector('.kb-toggle-thumb'));thumb.right=thumb.x+thumb.width;thumb.bottom=thumb.y+thumb.height;
   const row=n.closest('.control-row,.kb-section');const r=rect(row);const content=n.closest('.panel,.kb-console-module');const panelStyle=getComputedStyle(content);const edge=rect(content).right-parseFloat(panelStyle.borderRightWidth)-parseFloat(panelStyle.paddingRight);
   return{key:n.dataset.key||n.querySelector('input[value="1"]')?.id,checked:pseudo?n.getAttribute('aria-checked')==='true':n.querySelector('input[value="1"]').checked,disabled:n.disabled||n.getAttribute('aria-disabled'),...b,row:r,style:style(n),thumb,thumbStyle:{background:t.backgroundColor,border:t.borderColor,borderWidth:t.borderWidth,radius:t.borderRadius,transition:t.transition},top:thumb.y-b.y,bottom:b.bottom-thumb.bottom,left:thumb.x-b.x,rightGap:b.right-thumb.right,centerDelta:b.y+b.height/2-r.y-r.height/2,rightDelta:b.right-edge};
  });
  const range=host.querySelector(surface==='console'?'.kb-delay-range':'.delay-fields');let delayInfo=null;
  if(visible(range)){const labels=[...range.querySelectorAll('label')];const separator=surface==='console'?range.querySelector('.kb-delay-separator'):range.querySelector(':scope > span');const dash=text(separator);const units=labels.map(n=>text(n.querySelector('span:last-child')));delayInfo={boxes:labels.map(rect),inputs:labels.map(n=>rect(n.querySelector('input'))),units,dash,column:rect(separator),style:style(separator),gapLeft:dash.x-rect(labels[0]).right,gapRight:rect(labels[1]).x-dash.right,sToDash:dash.x-units[0].right};}
  const fields=[...host.querySelectorAll('#kb-session-duration,#kb-session-min-rate,#kb-session-max-rate,#tc-rating-target')].map(n=>({id:n.id,value:n.value,placeholder:n.placeholder}));
  const hint=surface==='config'?host.querySelector('#session-availability'):null,actions=surface==='config'?host.querySelector('.session-actions'):null,summary=surface==='config'?host.querySelector('.session-summary'):null;
  const panels=[...host.querySelectorAll(surface==='config'?'.panel':'.kb-console-module,#oi-zone2')].filter(visible).map(n=>({id:n.id||n.className,...rect(n)}));
  return{surface,width:innerWidth,toggles,delayInfo,fields,panels,hint:hint?{...rect(hint),style:style(hint),text:hint.textContent,above:rect(hint).y-rect(actions).bottom,below:rect(summary).y-rect(hint).bottom}:null};
 };
 const results=[];
 for(const bot of (process.argv.includes('--toggle-only')?[false]:[false,true]))for(const rating of [false,true])for(const pacing of (process.argv.includes('--toggle-only')?[false]:[false,true])){
  const response=await fetch(base+'/config/save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({hint:bot,autoAdjust:rating,smartPacing:pacing,delayMode:'random'})});assert(response.ok);
  await waitFor(()=>value(panel,`document.querySelector('[data-key=autoAdjust]').getAttribute('aria-checked')==='${rating}'&&document.querySelector('[data-key=smartPacing]').getAttribute('aria-checked')==='${pacing}'`));
  await waitFor(()=>value(embedded,`document.querySelector('#sp-on').checked===${pacing}&&document.querySelector('#aa-on').checked===${rating}`));await delay(180);
  for(const [surface,c,widths] of [['config',panel,process.argv.includes('--toggle-only')?[1440]:[1440,1280,1024,768,390]],['console',embedded,process.argv.includes('--toggle-only')?[]:[1086,1280,1440,1920]]])for(const width of widths){
   await c.send('Page.bringToFront');await c.send('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:false});await delay(250);
   const r=await value(c,'('+measure.toString()+')('+JSON.stringify(surface)+')');r.state={bot,rating,pacing};results.push(r);
   if(!process.argv.includes('--toggle-only')&&!bot&&!rating&&!pacing&&[1440,1086,390].includes(width)){const b=surface==='console'?await value(c,'(()=>{const r=document.querySelector("#oi-wrapper").getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height}})()'):{x:0,y:0,width,height:await value(c,'document.documentElement.scrollHeight')};const shot=await c.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,clip:{...b,scale:1}});await writeFile(join(output,`${surface}-${width}.png`),Buffer.from(shot.data,'base64'));}
   if(surface==='config'&&width===1440&&!bot&&!pacing){const t=r.toggles.find(t=>t.key==='autoAdjust');const shot=await c.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,clip:{x:t.x-16,y:t.y-8,width:t.width+32,height:t.height+16,scale:3}});await writeFile(join(output,`toggle-${rating?'on':'off'}-300.png`),Buffer.from(shot.data,'base64'));}
  }
 }
 await writeFile(join(output,process.argv.includes('--toggle-only')?'toggle-measurements.json':'measurements.json'),JSON.stringify(results,null,2));console.log('PASS captured '+results.length+' states');
}finally{for(const c of clients)c.socket.close();browser.kill();backend.kill();await delay(500);await rm(profile,{recursive:true,force:true,maxRetries:5,retryDelay:150});}


