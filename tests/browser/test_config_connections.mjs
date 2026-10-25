import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {resolve,join} from 'node:path';
import {createServer} from 'node:net';
const root=resolve(import.meta.dirname,'../..');
const before=process.argv.includes('--before');
const configOnly=process.argv.includes('--config-only');
const output=join(root,'_bmad-output/implementation-artifacts/connectivity-finish','block-7');
await mkdir(output,{recursive:true});
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const port=()=>new Promise(resolve=>{const s=createServer();s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>resolve(p));});});
const serverPort=await port(),debug=await port(),base=`http://127.0.0.1:${serverPort}`;
const profile=await mkdtemp(join(tmpdir(),'thinker-phase091-capture-'));
const backend=spawn('python',['-c',before?"import importlib.util,sys;from pathlib import Path;from flask import Response,send_from_directory;baseline=Path('.definitive-finish-baseline');spec=importlib.util.spec_from_file_location('core.external_config',baseline/'core/external_config.py');old=importlib.util.module_from_spec(spec);sys.modules['core.external_config']=old;spec.loader.exec_module(old);spec=importlib.util.spec_from_file_location('visual','tests/phase091_visual_fixture.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);m.app.view_functions['userscript']=lambda:Response((baseline/'script.js').read_text(encoding='utf8'),content_type='application/javascript');m.app.view_functions['external_config.asset']=lambda filename:send_from_directory(baseline/'frontend/external_config' if (baseline/'frontend/external_config'/filename).exists() else Path.cwd()/'frontend/external_config',filename);m.app.run(host='127.0.0.1',port=int(sys.argv[1]),threaded=True,use_reloader=False)":"import importlib.util,sys;spec=importlib.util.spec_from_file_location('visual','tests/phase091_visual_fixture.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);m.app.add_url_rule('/qa/close-runtime','qa_close',lambda:(m.registry.close() or {'ok':True}),methods=['POST']);m.app.run(host='127.0.0.1',port=int(sys.argv[1]),threaded=True,use_reloader=False)",String(serverPort)],{cwd:root,stdio:'ignore',windowsHide:true});
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



 const report={};
 await panel.send('Page.bringToFront');await panel.send('Network.enable');await panel.send('Emulation.setDeviceMetricsOverride',{width:390,height:900,deviceScaleFactor:1,mobile:false});
 await waitFor(()=>value(panel,"document.querySelector('#connection').textContent==='Local server connected'"));
 const read=()=>{const b=n=>{const r=n.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height,right:r.right}};return{connection:document.querySelector('#connection').textContent,userscript:document.querySelector('#userscript-connection').textContent,state:document.querySelector('#analysis-engine-state').textContent,selectDisabled:document.querySelector('#analysis-engine').disabled,timingHidden:document.querySelector('.timing').hidden,fieldset:b(document.querySelector('#timing-fields')),inputs:[...document.querySelectorAll('#minDelay,#maxDelay')].map(b),segmented:b(document.querySelector('.segmented')),overflow:document.documentElement.scrollWidth>innerWidth,evalBar:document.querySelector('[data-key=evalBar]').getAttribute('aria-checked')}};
 report.connected=await value(panel,'('+read.toString()+')()');assert(!report.connected.overflow);assert(report.connected.inputs.every(n=>n.width>=64));assert.equal(report.connected.fieldset.height,32);assert.equal(report.connected.inputs[0].y,report.connected.segmented.y+1);
 await panel.send('Network.emulateNetworkConditions',{offline:true,latency:0,downloadThroughput:-1,uploadThroughput:-1});await waitFor(()=>value(panel,"document.querySelector('#connection').textContent==='Local server offline'"));await waitFor(()=>value(panel,"document.querySelector('#analysis-engine').disabled"));report.offline=await value(panel,'('+read.toString()+')()');let shot=await panel.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});await writeFile(join(output,'config-offline-390.png'),Buffer.from(shot.data,'base64'));
 await panel.send('Network.emulateNetworkConditions',{offline:false,latency:0,downloadThroughput:-1,uploadThroughput:-1});await value(panel,"document.querySelector('#retry').click()");await waitFor(()=>value(panel,"document.querySelector('#analysis-engine-state').textContent==='Ready'&&!document.querySelector('#analysis-engine').disabled"));
 const headers={'Content-Type':'application/json','Authorization':'Bearer phase091-visual-isolated-capability'};
 let response=await fetch(base+'/eval-bar/engines/select',{method:'POST',headers,body:JSON.stringify({engineId:'stockfish-19-1mb',context:'analysis',initializeOnly:true})});assert(response.ok);response=await fetch(base+'/eval-bar/engines?context=analysis',{headers});const active=await response.json();assert(active.engines[0].runtimeReady);assert(active.engines[0].identity.proof.depth>0);report.runtimeProof=active.engines[0].identity.proof;const pid=active.engines[0].resources.pid;
 await waitFor(()=>value(panel,"document.querySelector('#analysis-engine-state').textContent==='Active'"));report.active=await value(panel,'('+read.toString()+')()');assert.equal(report.active.evalBar,'false');shot=await panel.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});await writeFile(join(output,'config-active-390.png'),Buffer.from(shot.data,'base64'));
 await fetch(base+'/eval-bar/engines?context=active-game',{headers});await waitFor(()=>value(panel,"document.querySelector('#analysis-engine-state').textContent==='Ready'"));const retained=await(await fetch(base+'/config/engines')).json();assert.equal(retained.engines[0].resources.pid,pid);
 const info=await embedded.send('Target.getTargetInfo');await embedded.send('Target.closeTarget',{targetId:info.targetInfo.targetId});await waitFor(()=>value(panel,"document.querySelector('#userscript-connection').textContent==='Chess.com: disconnected'"));report.userscriptDisconnected=await value(panel,'('+read.toString()+')()');assert.equal(report.userscriptDisconnected.connection,'Local server connected');assert(!report.userscriptDisconnected.selectDisabled);
 await writeFile(join(output,'connections.json'),JSON.stringify(report,null,2));console.log('PASS Config 390px inline Timing, real disconnect/reconnect, genuine runtime Active/Ready, retained engine process, genuine userscript heartbeat expiry');
}finally{try{await fetch(base+'/qa/close-runtime',{method:'POST'})}catch{}for(const c of clients)c.socket.close();browser.kill();backend.kill();await delay(500);await rm(profile,{recursive:true,force:true,maxRetries:5,retryDelay:150});}
