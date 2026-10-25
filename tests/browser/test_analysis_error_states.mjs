import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {resolve,join} from 'node:path';
import {createServer} from 'node:net';
const root=resolve(import.meta.dirname,'../..');
const before=process.argv.includes('--before');
const configOnly=process.argv.includes('--config-only');
const output=join(root,'_bmad-output/implementation-artifacts/connectivity-finish','block-2');
await mkdir(output,{recursive:true});
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const port=()=>new Promise(resolve=>{const s=createServer();s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>resolve(p));});});
const serverPort=await port(),debug=await port(),base=`http://127.0.0.1:${serverPort}`;
const profile=await mkdtemp(join(tmpdir(),'thinker-phase091-capture-'));
const backend=spawn('python',['-c',before?"import importlib.util,sys;from pathlib import Path;from flask import Response,send_from_directory;baseline=Path('.definitive-finish-baseline');spec=importlib.util.spec_from_file_location('core.external_config',baseline/'core/external_config.py');old=importlib.util.module_from_spec(spec);sys.modules['core.external_config']=old;spec.loader.exec_module(old);spec=importlib.util.spec_from_file_location('visual','tests/phase091_visual_fixture.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);m.app.view_functions['userscript']=lambda:Response((baseline/'script.js').read_text(encoding='utf8'),content_type='application/javascript');m.app.view_functions['external_config.asset']=lambda filename:send_from_directory(baseline/'frontend/external_config' if (baseline/'frontend/external_config'/filename).exists() else Path.cwd()/'frontend/external_config',filename);m.app.run(host='127.0.0.1',port=int(sys.argv[1]),threaded=True,use_reloader=False)":"import importlib.util,sys;spec=importlib.util.spec_from_file_location('visual','tests/phase091_visual_fixture.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);m.app.run(host='127.0.0.1',port=int(sys.argv[1]),threaded=True,use_reloader=False)",String(serverPort)],{cwd:root,stdio:'ignore',windowsHide:true});
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


 const results=[];
 const measure=surface=>{const n=document.querySelector(surface==='console'?'.kb-engine-module':'#engine'),select=n.querySelector('select'),row=n.querySelector(surface==='console'?'.tc-analysis-notice':'.analysis-engine-notice'),retry=row.querySelector('button'),rect=x=>{const b=x.getBoundingClientRect();return{x:b.x,y:b.y,width:b.width,height:b.height,right:b.right,bottom:b.bottom}};return{state:n.querySelector(surface==='console'?'.tc-analysis-status':'#analysis-engine-state').textContent,panel:rect(n),row:rect(row),select:{...rect(select),disabled:select.disabled,options:select.options.length},retry:{...rect(retry),hidden:retry.hidden,disabled:retry.disabled}}};
 for(const [surface,client,path]of [['console',embedded,'/eval-bar/engines*'],['config',panel,'/config/engines*']]){
  await client.send('Page.bringToFront');await client.send('Network.enable');await client.send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});
  const status=surface==='console'?'.tc-analysis-status':'#analysis-engine-state';await waitFor(()=>value(client,`document.querySelector('${status}')?.textContent==='Ready'`));
  const states={ready:await value(client,'('+measure.toString()+')('+JSON.stringify(surface)+')')};assert.equal(states.ready.select.options,3);
  let shot=await client.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});await writeFile(join(output,`${surface}-ready.png`),Buffer.from(shot.data,'base64'));
  await client.send('Network.setBlockedURLs',{urls:[base+path]});await waitFor(()=>value(client,`['Error','Connection Lost'].includes(document.querySelector('${status}')?.textContent)`));states.error=await value(client,'('+measure.toString()+')('+JSON.stringify(surface)+')');assert(states.error.select.disabled);assert.equal(states.error.retry.height,32);assert.equal(states.error.row.height,40);assert.equal(states.error.retry.right,states.error.row.right);assert.equal(states.error.panel.height,states.ready.panel.height);
  shot=await client.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});await writeFile(join(output,`${surface}-error.png`),Buffer.from(shot.data,'base64'));
  await client.send('Network.setBlockedURLs',{urls:[]});await client.send('Network.emulateNetworkConditions',{offline:false,latency:800,downloadThroughput:-1,uploadThroughput:-1});await value(client,`document.querySelector('${surface==='console'?'.tc-analysis-notice button':'#engine-retry'}').click()`);await waitFor(()=>value(client,`document.querySelector('${status}')?.textContent==='Initializing'`));states.retry=await value(client,'('+measure.toString()+')('+JSON.stringify(surface)+')');assert(states.retry.retry.disabled);assert(!states.retry.retry.hidden);assert.equal(states.retry.panel.height,states.ready.panel.height);
  shot=await client.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});await writeFile(join(output,`${surface}-initializing.png`),Buffer.from(shot.data,'base64'));await waitFor(()=>value(client,`document.querySelector('${status}')?.textContent==='Ready'`));await client.send('Network.emulateNetworkConditions',{offline:false,latency:0,downloadThroughput:-1,uploadThroughput:-1});results.push({surface,...states});
 }
 await writeFile(join(output,'states.json'),JSON.stringify(results,null,2));console.log('PASS Ready, transport Error and actual pending Retry: unchanged panel height, 40px notice row, 32px right-aligned Retry, preserved engine options');
}finally{for(const c of clients)c.socket.close();browser.kill();backend.kill();await delay(500);await rm(profile,{recursive:true,force:true,maxRetries:5,retryDelay:150});}
