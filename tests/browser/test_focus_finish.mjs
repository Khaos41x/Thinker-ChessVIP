import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {resolve,join} from 'node:path';
import {createServer} from 'node:net';
const root=resolve(import.meta.dirname,'../..');
const before=process.argv.includes('--before');
const configOnly=process.argv.includes('--config-only');
const output=join(root,'_bmad-output/implementation-artifacts/definitive-finish','block-e');
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

 const report=[];
 for(const [surface,client,selectors] of [['console',embedded,['#tc-analysis-engine','#minDelayInput','#kb-session-duration','#kb-color-picker','#kb-session-start','.kb-timing-mode label','.kb-radio-group']],['config',panel,['#analysis-engine','#minDelay','#kb-session-duration','#color','#kb-session-start','[data-mode=random]','[data-key=hint]']]]){
  await client.send('Page.bringToFront');
  await client.send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
  for(const selector of selectors){
   const b=await value(client,`(()=>{const n=document.querySelector(${JSON.stringify(selector)});n.scrollIntoView({block:'center'});const b=n.getBoundingClientRect();return{x:b.x+b.width/2,y:b.y+b.height/2}})()`);
   await client.send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...b});await client.send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,...b});
   await client.send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});await client.send('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
   const state=await value(client,`(()=>{const n=document.querySelector(${JSON.stringify(selector)}),s=getComputedStyle(n);return{selector:${JSON.stringify(selector)},active:document.activeElement.id,outline:s.outlineStyle,shadow:s.boxShadow,border:s.borderColor}})()`);
   assert.equal(state.outline,'none');assert.equal(state.shadow,'none');report.push({surface,pointer:state});
   const pointerShot=await client.send('Page.captureScreenshot',{format:'png'});await writeFile(join(output,`${surface}-pointer-${selectors.indexOf(selector)}.png`),Buffer.from(pointerShot.data,'base64'));
  }

  if(surface==='config'){
   for(let i=0;i<2;i++){
    const b=await value(client,"(()=>{const n=document.querySelector('[data-key=hint]');n.scrollIntoView({block:'center'});const b=n.getBoundingClientRect();return{x:b.x+b.width/2,y:b.y+b.height/2}})()");
    await client.send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...b});await client.send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,...b});await delay(100);
    const transition=await value(client,"(()=>{const n=document.querySelector('[data-key=hint]'),focused=getComputedStyle(n).borderColor,state=n.getAttribute('aria-checked');n.blur();return{state,focused,idle:getComputedStyle(n).borderColor}})()");
    assert.equal(transition.focused,transition.idle,'Pointer focus freezes the previous toggle border');report.push({surface,transition});
   }
   await value(client,"(()=>{const n=document.querySelector('#kb-session-duration');n.focus();n.value='0';n.dispatchEvent(new Event('input',{bubbles:true}));n.blur()})()");
   const invalid=await value(client,"(()=>{const n=document.querySelector('#kb-session-duration');return{invalid:n.getAttribute('aria-invalid'),border:getComputedStyle(n).borderColor}})()");
   assert.equal(invalid.invalid,'true');
   const b=await value(client,"(()=>{const n=document.querySelector('#kb-session-duration');n.scrollIntoView({block:'center'});const b=n.getBoundingClientRect();return{x:b.x+b.width/2,y:b.y+b.height/2}})()");
   await client.send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...b});await client.send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,...b});
   assert.equal(await value(client,"getComputedStyle(document.querySelector('#kb-session-duration')).borderColor"),invalid.border,'Pointer focus suppresses validation border');
   await value(client,"(()=>{const n=document.querySelector('#kb-session-duration');n.value='120';n.dispatchEvent(new Event('input',{bubbles:true}));n.blur()})()");
  }
  await client.send('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});await client.send('Input.dispatchKeyEvent',{type:'keyUp',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});
  await value(client,`document.querySelector(${JSON.stringify(selectors[0])}).focus()`);
  const keyboard=await value(client,"(()=>{const n=document.activeElement,s=getComputedStyle(n);return{id:n.id,visible:n.matches(':focus-visible'),border:s.borderColor,outline:s.outlineStyle,shadow:s.boxShadow}})()");
  assert(keyboard.visible);assert.equal(keyboard.border,'rgb(160, 161, 155)');assert.equal(keyboard.shadow,'none');assert.equal(keyboard.outline,'none');report.push({surface,keyboard});
  const shot=await client.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});await writeFile(join(output,`${surface}-keyboard.png`),Buffer.from(shot.data,'base64'));
 }
 await writeFile(join(output,'focus.json'),JSON.stringify(report,null,2));console.log('PASS pointer focus without rings and keyboard neutral border on both surfaces');
}finally{for(const c of clients)c.socket.close();browser.kill();backend.kill();await delay(500);await rm(profile,{recursive:true,force:true,maxRetries:5,retryDelay:150});}
