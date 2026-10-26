import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {resolve,join} from 'node:path';
import {createServer} from 'node:net';
const root=resolve(import.meta.dirname,'../..');
const before=process.argv.includes('--before');
const configOnly=process.argv.includes('--config-only');
const output=join(root,'_bmad-output/implementation-artifacts/config-controls/delay-options');
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
 const c=await tab(base+'/tests/fixtures/userscript_bootstrap.html?delay=50');await c.send('Page.bringToFront');await c.send('Emulation.setDeviceMetricsOverride',{width:1086,height:1000,deviceScaleFactor:1,mobile:false});await waitFor(()=>value(c,"Boolean(document.querySelector('#minDelayInput'))"));await delay(500);
 const spacing='#krypbot-container .kb-engine-timing .kb-delay-range{grid-template-columns:round(down,calc((100% - 20px)/2),1px) 8px minmax(0,1fr);gap:6px}#krypbot-container .kb-engine-timing .kb-delay-separator{width:8px;text-align:center;line-height:16px}';
 const options=[['current',''],['spacing6-inputs-too-small',spacing],['preview-engine-plus14-scout-minus14',spacing+'#oi-wrapper[data-layout-mode=desktop] #krypbot-container .kb-console-grid{grid-template-columns:345px 359px 282px!important}']];const report=[];
 for(const [name,css] of options){
  await value(c,`(()=>{document.querySelector('#qa-spacing')?.remove();const n=document.createElement('style');n.id='qa-spacing';n.textContent=${JSON.stringify(css)};document.head.append(n)})()`);await delay(100);
  const r=await value(c,`(()=>{const rect=n=>{const b=n.getBoundingClientRect();return{x:b.x,y:b.y,width:b.width,height:b.height}};return{engine:rect(document.querySelector('.kb-engine-module')),inputs:[...document.querySelectorAll('.kb-delay-input input')].map(rect),separator:rect(document.querySelector('.kb-delay-separator')),console:rect(document.querySelector('#oi-wrapper'))}})()`);report.push({name,...r});const shot=await c.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,clip:{...r.console,scale:1}});await writeFile(join(output,name+'.png'),Buffer.from(shot.data,'base64'));
 }
 assert.deepEqual(report[0].inputs.map(n=>n.width),[64,64]);assert(report[1].inputs.some(n=>n.width<64));assert(report[2].inputs.every(n=>n.width>=64));assert(report.every(r=>r.engine.height===report[0].engine.height));
 await writeFile(join(output,'options.json'),JSON.stringify(report,null,2));console.log('PASS1086 options captured without production changes; +14px Engine retains >=64px inputs and same height');
}finally{for(const c of clients)c.socket.close();browser.kill();backend.kill();await delay(500);await rm(profile,{recursive:true,force:true,maxRetries:5,retryDelay:150});}
