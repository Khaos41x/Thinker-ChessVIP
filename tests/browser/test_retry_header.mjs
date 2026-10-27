import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {resolve,join} from 'node:path';
import {createServer} from 'node:net';
const root=resolve(import.meta.dirname,'../..'),before=process.argv.includes('--before');
const output=join(root,'_bmad-output/implementation-artifacts/retry-header',process.argv.includes('--banner-only')?'banner':before?'before':'after');await mkdir(output,{recursive:true});
const pause=ms=>new Promise(r=>setTimeout(r,ms));
const port=()=>new Promise(r=>{const s=createServer();s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>r(p));});});
const serverPort=await port(),debugPort=await port(),base=`http://127.0.0.1:${serverPort}`;
const profile=await mkdtemp(join(tmpdir(),'thinker-config-entry-'));
const preference=join(profile,'preferences.json');
const server=spawn('python',['tests/clean_config_fixture.py',String(serverPort),'--preferences',preference],{cwd:root,stdio:'ignore',windowsHide:true});
const chrome=spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--disable-gpu','--no-first-run','--disable-background-timer-throttling',`--remote-debugging-port=${debugPort}`,`--user-data-dir=${profile}`,'about:blank'],{stdio:'ignore',windowsHide:true});
let client;const messages=[],exceptions=[],network=[];
async function waitFor(test){for(let i=0;i<240;i++){try{if(await test())return;}catch{}await pause(100);}throw Error('Timeout');}
async function connect(url){const socket=new WebSocket(url),pending=new Map(),handlers=new Map();let id=0;socket.addEventListener('message',e=>{const m=JSON.parse(e.data);handlers.get(m.method)?.(m.params);const p=pending.get(m.id);if(p){pending.delete(m.id);m.error?p.reject(Error(m.error.message)):p.resolve(m.result);}});await new Promise(r=>socket.addEventListener('open',r,{once:true}));return{socket,on:(m,f)=>handlers.set(m,f),send:(method,params={})=>new Promise((resolve,reject)=>{pending.set(++id,{resolve,reject});socket.send(JSON.stringify({id,method,params}));})};}
async function value(expression){const r=await client.send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value;}
const results=[];
const geometry=()=>{
 const rect=n=>n.getBoundingClientRect().toJSON();
 const all=[...document.querySelectorAll('#panels>.panel,.kb-console-module,#oi-zone2,.kb-console-caption,.tc-scout-title')];
 const rows=[...document.querySelectorAll('.control-row')].map(n=>{const c=n.querySelector('button,input'),label=n.querySelector('label,span'),r=rect(n),v=rect(c),l=rect(label);return{key:c.dataset.key,height:r.height,y:r.y,labelCenter:l.y+l.height/2,controlCenter:v.y+v.height/2,center:r.y+r.height/2,delta:v.y+v.height/2-r.y-r.height/2,paddingAbove:v.y-r.y,paddingBelow:r.bottom-v.bottom};});
 return{panels:all.map(n=>({id:n.id,cls:n.className,rect:rect(n)})),rows,header:document.querySelector('.page-header')?{eyebrow:rect(document.querySelector('.eyebrow')),title:rect(document.querySelector('h1')),connection:rect(document.querySelector('.connection')),status:rect(document.querySelector('.connection-status')),notice:rect(document.querySelector('.connection-status .notice')),version:rect(document.querySelector('#client-build-state').parentElement),panelsTop:rect(document.querySelector('#panels')).top,topPadding:getComputedStyle(document.querySelector('main')).paddingTop}:null,overflow:document.documentElement.scrollWidth>innerWidth,colors:[...document.querySelectorAll('button,input,select,.tc-analysis-status,#analysis-engine-state')].map(n=>{const s=getComputedStyle(n);return{id:n.id,key:n.dataset.key,cls:String(n.className),color:s.color,background:s.backgroundColor,border:s.borderColor}})};
};
try{
 await waitFor(async()=> (await fetch(base+'/config/load')).ok);await waitFor(async()=> (await fetch(`http://127.0.0.1:${debugPort}/json/list`)).ok);
 const tab=(await(await fetch(`http://127.0.0.1:${debugPort}/json/list`)).json()).find(t=>t.type==='page');client=await connect(tab.webSocketDebuggerUrl);await client.send('Page.enable');await client.send('Runtime.enable');await client.send('Network.enable');await client.send('Emulation.setFocusEmulationEnabled',{enabled:true});
 client.on('Runtime.exceptionThrown',e=>exceptions.push(e));client.on('Runtime.consoleAPICalled',e=>messages.push(e));let fault=false,count=0;await client.send('Fetch.enable',{patterns:[{urlPattern:'*config/engines*'},{urlPattern:'*eval-bar/engines*'}]});client.on('Fetch.requestPaused',e=>{count++;client.send(fault?'Fetch.failRequest':'Fetch.continueRequest',{requestId:e.requestId,...(fault?{errorReason:'ConnectionRefused'}:{})}).catch(()=>{});});
 for(const surface of (process.argv.includes('--banner-only')?['config']:['config','console'])){
  const status=surface==='config'?'#analysis-engine-state':'.tc-analysis-status',retry=surface==='config'?'#engine-retry':'.tc-analysis-notice button';
  await fetch(base+'/qa/state',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({connected:true})});
  await client.send('Page.navigate',{url:base+(surface==='config'?'/config':'/tests/fixtures/userscript_bootstrap.html?delay=20')});await waitFor(()=>value(`document.querySelector('${status}')?.textContent==='Ready'`));
  const widths=surface==='config'?[1440,1280,1024,768,390]:[1086,1280,1440,1920,1033,800];
  for(const width of widths)for(const banner of [false,true]){
   await fetch(base+'/config/save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({banner})});await pause(2200);await client.send('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:false});await pause(200);
   const current={surface,width,banner,...await value('('+geometry.toString()+')()')};results.push(current);
   if(!before&&surface==='config'){assert.equal(await value("document.querySelector('#banner-display-state')"),null);assert(current.rows.every(r=>r.height===40&&r.delta===0));const original=JSON.parse(await readFile(join(output,'../before/measurements.json'),'utf8')).results.find(r=>r.surface===surface&&r.width===width&&r.banner===banner);assert.equal(current.panels.find(p=>p.id==='visuals').rect.height,original.panels.find(p=>p.id==='visuals').rect.height-24);}
   if(!before){const original=JSON.parse(await readFile(join(output,'../before/measurements.json'),'utf8')).results.find(r=>r.surface===surface&&r.width===width&&r.banner===banner);assert.deepEqual(current.colors,original.colors);if(surface==='console')assert.deepEqual(current.panels,original.panels);else assert.equal(current.header.panelsTop,original.header.panelsTop);}
   if(surface==='config'&&[1440,1024,390].includes(width)&&!banner)await client.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true}).then(r=>writeFile(join(output,`config-${width}-online.png`),Buffer.from(r.data,'base64')));
  }
  if(process.argv.includes('--banner-only'))continue;
  await client.send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
  fault=true;await waitFor(()=>value(`['Connection Lost','Error'].includes(document.querySelector('${status}')?.textContent)`));
  await value(`window.qaTimeline=[];new MutationObserver(()=>qaTimeline.push({at:performance.now(),text:document.querySelector('${status}').textContent})).observe(document.querySelector('${status}'),{subtree:true,childList:true});window.qaStart=performance.now();document.querySelector('${retry}').focus();document.querySelector('${retry}').click();`);
  const start=Date.now();for(const ms of [0,150,400,700,1000]){await pause(Math.max(0,ms-(Date.now()-start)));await client.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false}).then(r=>writeFile(join(output,`${surface}-retry-${ms}.png`),Buffer.from(r.data,'base64')));}
  await pause(200);const timeline=await value(`({start:qaStart,events:qaTimeline.map(e=>({...e,at:e.at-qaStart})),state:document.querySelector('${status}').textContent,animations:document.querySelector('${status}').getAnimations().length})`);results.push({surface,retryOffline:timeline});
  fault=false;await value(`document.querySelector('${retry}').click()`);await waitFor(()=>value(`document.querySelector('${status}')?.textContent==='Ready'`));
 }
 await writeFile(join(output,'measurements.json'),JSON.stringify({results,messages,exceptions},null,2));assert.deepEqual(messages,[]);assert.deepEqual(exceptions,[]);console.log('PASS capture retry/header baseline '+results.length+' cases');
}finally{client?.socket.close();chrome.kill();server.kill();await pause(500);await rm(profile,{recursive:true,force:true,maxRetries:6,retryDelay:200});}
