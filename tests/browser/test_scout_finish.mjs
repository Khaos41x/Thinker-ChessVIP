import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,mkdir,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {resolve,join} from 'node:path';
import {createServer} from 'node:net';
const root=resolve(import.meta.dirname,'../..');
const integrated=process.argv.includes('--integrated');
const output=join(root,'_bmad-output/implementation-artifacts/definitive-finish/block-f');
await mkdir(output,{recursive:true});
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const port=()=>new Promise(resolve=>{const s=createServer();s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>resolve(p));});});
const serverPort=await port(),debug=await port(),base=`http://127.0.0.1:${serverPort}`;
const profile=await mkdtemp(join(tmpdir(),'thinker-phase091-capture-'));
const backend=spawn('python',integrated?['tests/phase091_visual_fixture.py',String(serverPort)]:['-c',"import importlib.util,sys;from pathlib import Path;from flask import Response,send_from_directory;baseline=Path('.definitive-finish-baseline');spec=importlib.util.spec_from_file_location('core.external_config',baseline/'core/external_config.py');old=importlib.util.module_from_spec(spec);sys.modules['core.external_config']=old;spec.loader.exec_module(old);spec=importlib.util.spec_from_file_location('visual','tests/phase091_visual_fixture.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);m.app.view_functions['userscript']=lambda:Response((baseline/'script.js').read_text(encoding='utf8'),content_type='application/javascript');m.app.view_functions['external_config.asset']=lambda filename:send_from_directory(baseline/'frontend/external_config' if (baseline/'frontend/external_config'/filename).exists() else Path.cwd()/'frontend/external_config',filename);m.app.run(host='127.0.0.1',port=int(sys.argv[1]),threaded=True,use_reloader=False)",String(serverPort)],{cwd:root,stdio:'ignore',windowsHide:true});
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
 const moduleSource=await readFile(join(root,'frontend/eval_bar/scout-finish.js'),'utf8');
 const measure=()=>{
   const panel=document.getElementById('oi-zone2');
   const rect=n=>{const b=n.getBoundingClientRect();return{x:b.x,y:b.y,width:b.width,height:b.height,right:b.right,bottom:b.bottom}};
   const visible=n=>{const b=n.getBoundingClientRect();return b.width>0&&b.height>0&&getComputedStyle(n).visibility!=='hidden'};
   const text=[...panel.querySelectorAll('*')].filter(n=>visible(n)&&[...n.childNodes].some(x=>x.nodeType===3&&x.textContent.trim())).map(n=>{const s=getComputedStyle(n);return{selector:n.className||n.tagName,text:n.textContent,font:parseFloat(s.fontSize),line:parseFloat(s.lineHeight),color:s.color}});
   const colors=[panel,...panel.querySelectorAll('*')].filter(n=>visible(n)&&n.tagName!=='STYLE').map(n=>{const s=getComputedStyle(n);return{tag:n.tagName,class:String(n.className).replace(' tc-scout-populated',''),color:s.color,background:s.backgroundColor,border:s.borderColor,opacity:s.opacity}});
   const rows=[...panel.querySelectorAll('.tc-scout-stat-row')].map(n=>{const b=n.querySelector('.tc-scout-stat-copy b'),value=n.querySelector('.tc-scout-stat-value'),first=value.querySelector('b'),small=value.querySelector('small');return{label:b.textContent,left:rect(b),value:rect(value),first:rect(first),small:rect(small)}});
   const openings=[...panel.querySelectorAll('.tc-scout-opening-row')].map(n=>{const name=n.querySelector('.tc-scout-opening-name'),count=n.querySelector('.tc-scout-opening-count');return{name:name.textContent,title:name.title,box:rect(name),scroll:name.scrollWidth,client:name.clientWidth,ellipsis:getComputedStyle(name).textOverflow,whiteSpace:getComputedStyle(name).whiteSpace,count:rect(count)}});
   const markers=[...panel.querySelectorAll('.tc-scout-color-chip,.tc-scout-speed-icon')].map(n=>({...rect(n),radius:getComputedStyle(n).borderRadius,pointerEvents:getComputedStyle(n).pointerEvents,hidden:n.getAttribute('aria-hidden')}));
   const style=panel.getAttribute('style');panel.style.setProperty('height','max-content','important');panel.style.setProperty('align-self','start','important');const natural=rect(panel).height;if(style===null)panel.removeAttribute('style');else panel.setAttribute('style',style);
   return{text,colors,rows,openings,markers,natural,panel:rect(panel),empty:!panel.querySelector('.tc-scout-stat-row')};
 };
 await value(embedded,"document.querySelector('#board-layout-player-top .user-username-component').textContent='GMTestTC01'");
 await waitFor(()=>value(embedded,"Boolean(document.querySelector('.tc-scout-opening-row'))"));
 await embedded.send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});await delay(200);
 const before=await value(embedded,'('+measure.toString()+')()');
 if(integrated) assert(await value(embedded,"document.querySelector('#oi-zone2').classList.contains('tc-scout-populated')"),'Production Scout hook did not run');
 else await value(embedded,moduleSource+';ThinkerScoutFinish.decorate(document.getElementById("oi-zone2"));const scoutStyle=document.createElement("style");scoutStyle.textContent=ThinkerScoutFinish.css;document.head.append(scoutStyle);');
 const results=[];
 for(const width of [1086,1280,1440,1920,1033,800]){
   await embedded.send('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:false});await delay(100);
   const state=await value(embedded,'('+measure.toString()+')()');
   const expectedColors=before.colors.map(n=>n.tag==='SMALL'&&n.color==='rgb(119, 120, 115)'?{...n,color:'rgb(160, 161, 155)'}:n);
   assert(JSON.stringify(state.colors)===JSON.stringify(expectedColors),'Block F changed an unapproved component color');
   assert(state.text.filter(n=>/^of \d/.test(n.text)).every(n=>n.color==='rgb(160, 161, 155)'),'Opening secondary contrast correction missing');
   assert(state.text.every(n=>n.font>=11),'Scout still contains text below11px');
   assert(state.openings.every(n=>n.name===n.title&&n.ellipsis==='ellipsis'&&n.whiteSpace==='nowrap'&&n.count.width===56));
   assert(state.rows.every(n=>n.value.width===72&&Math.abs(n.first.y-n.small.y)<1&&n.value.right===state.rows[0].value.right),'Win-rate columns/baselines mismatch');
   assert(state.markers.every(n=>n.width===10&&n.height===10&&n.radius==='2px'&&n.pointerEvents==='none'&&n.hidden==='true'));
   assert(state.openings.every(n=>n.count.right<=state.panel.right&&n.box.x>=state.panel.x),'Scout overflow');
   results.push({width,...state});
   if([1440,1086,800].includes(width)){const b=state.panel;const shot=await embedded.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,clip:{x:b.x,y:b.y,width:b.width,height:b.height,scale:1}});await writeFile(join(output,'scout-'+width+'.png'),Buffer.from(shot.data,'base64'));}
 }
 await writeFile(join(output,integrated?'integrated-measurements.json':'measurements.json'),JSON.stringify({before,results},null,2));
 console.log(JSON.stringify({passed:true,beforeNatural:before.natural,after:results.map(r=>({width:r.width,natural:r.natural,panelHeight:r.panel.height,textBelow11:r.text.filter(n=>n.font<11).length,colorsUnchanged:true,rows:r.rows.length,openings:r.openings.length}))},null,2));
}finally{
 for(const c of clients)c.socket.close();browser.kill();backend.kill();await delay(500);await rm(profile,{recursive:true,force:true,maxRetries:5,retryDelay:150});
}

