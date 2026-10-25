import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {resolve,join} from 'node:path';
import {createServer} from 'node:net';
const root=resolve(import.meta.dirname,'../..');
const before=process.argv.includes('--before');
const configOnly=process.argv.includes('--config-only');
const output=join(root,'_bmad-output/implementation-artifacts/definitive-finish',before?'before':(configOnly?'block-h':'after'));
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
 const measure=surface=>{
  const host=surface==='console'?document.querySelector('#krypbot-container'):document.querySelector('main');
  const selector=n=>n.id?'#'+n.id:n.className&&typeof n.className==='string'?n.tagName.toLowerCase()+'.'+n.className.trim().split(/\s+/).join('.'):n.tagName.toLowerCase();
  const rect=n=>{const r=n.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom,right:r.right,centerY:r.y+r.height/2}};
  const visible=n=>{const r=n.getBoundingClientRect(),s=getComputedStyle(n);return r.width>0&&r.height>0&&s.display!=='none'&&s.visibility!=='hidden'&&n.getClientRects().length>0};
  const textRect=n=>{const walker=document.createTreeWalker(n,NodeFilter.SHOW_TEXT);let text;while(text=walker.nextNode()){if(!text.textContent.trim())continue;const range=document.createRange();range.selectNodeContents(text);const b=range.getBoundingClientRect();if(b.width&&b.height)return{x:b.x,y:b.y,width:b.width,height:b.height,centerY:b.y+b.height/2};}return null};
  const rows=[...host.querySelectorAll(surface==='console'?'.kb-section,.kb-footer>div,.kb-strength-head,.kb-timing-heading,.tc-analysis-heading':'.control-row,.field-heading,.delay-fields,.segmented,.session-summary>div')].filter(visible).map(n=>{const b=rect(n),s=getComputedStyle(n);const text=n.querySelector('.kb-section-label,label,span')||n;const t=textRect(text);const control=n.querySelector('.kb-radio-group,.switch,input[type=color],input[type=range],select,button');const c=control&&visible(control)?rect(control):null;return {selector:selector(n),text:n.innerText.trim().replace(/\s+/g,' ').slice(0,120),...b,borderTop:s.borderTopWidth,borderBottom:s.borderBottomWidth,dividerAboveY:parseFloat(s.borderTopWidth)>0||s.backgroundImage!=='none'?b.y:null,dividerBelowY:parseFloat(s.borderBottomWidth)>0?b.bottom-parseFloat(s.borderBottomWidth):null,marginTop:s.marginTop,marginBottom:s.marginBottom,paddingTop:s.paddingTop,paddingBottom:s.paddingBottom,alignItems:s.alignItems,textCenterY:t?.centerY,textOffset:t?t.centerY-b.centerY:null,controlCenterY:c?.centerY,controlOffset:c?c.centerY-b.centerY:null}});
  const smallText=[];const colorComponents=[];
  for(const n of host.querySelectorAll('*')){if(!visible(n))continue;const s=getComputedStyle(n);const direct=[...n.childNodes].filter(x=>x.nodeType===3).map(x=>x.textContent).join('').trim();if(direct&&parseFloat(s.fontSize)<11)smallText.push({selector:selector(n),text:direct.slice(0,100),fontSize:s.fontSize,color:s.color,lineHeight:s.lineHeight});if(n.matches('input,select,button,a,.kb-radio-group,.switch,.tc-scout-dot,.tc-scout-speed-icon,.tc-analysis-status,.tc-scout-opening-row,.kb-section-label,.session-summary strong')||n.id==='kb-run-delay-hint'){colorComponents.push({selector:selector(n),text:n.innerText?.slice(0,45),type:n.getAttribute('type'),checked:n.checked,disabled:n.disabled,color:s.color,background:s.backgroundColor,border:s.borderColor,outline:s.outlineColor,outlineStyle:s.outlineStyle,shadow:s.boxShadow,opacity:s.opacity,accentColor:s.accentColor,before:{background:getComputedStyle(n,'::before').backgroundColor,color:getComputedStyle(n,'::before').color},after:{background:getComputedStyle(n,'::after').backgroundColor,color:getComputedStyle(n,'::after').color}});}}
  const panels=Object.fromEntries([...document.querySelectorAll(surface==='console'?'#krypbot-container .kb-console-module,#oi-zone2':'.panel')].filter(visible).map(n=>{const b=rect(n);const last=Math.max(...[...n.children].filter(visible).map(c=>c.getBoundingClientRect().bottom));return[n.id||n.className,{...b,tail:b.bottom-1-last}]}));
  const banner=document.querySelector('#thinker-chess-banner .tc-banner-title');const bannerStyle=banner?getComputedStyle(banner):null;const bannerRect=banner?rect(banner):null;const bannerText=banner?textRect(banner):null;
  const fractions=[...host.querySelectorAll('input,select,button,.kb-radio-group,.switch')].filter(visible).map(n=>({selector:selector(n),...rect(n)})).filter(r=>['x','y','width','height'].some(k=>!Number.isInteger(r[k])));
  return{surface,width:innerWidth,mode:document.querySelector('#oi-wrapper')?.dataset.layoutMode,host:rect(host),documentWidth:document.documentElement.scrollWidth,rows,smallText,colorComponents,panels,fractionalControls:fractions,banner:{fontSize:bannerStyle?.fontSize,box:bannerRect,text:bannerText,visible:banner?visible(banner):false},sections:surface==='console'?[...host.querySelectorAll('.kb-engine-section')].map(n=>({class:n.className,...rect(n)})):[],scout:{populated:!!document.querySelector('.tc-scout-opening-row'),text:document.querySelector('#oi-zone2')?.innerText},tokens:Object.fromEntries(['--row-height','--row-h','--panel-gap','--panel-padding','--tc-console-accent','--tc-console-border','--tc-console-focus'].map(key=>[key,getComputedStyle(host).getPropertyValue(key)]))};
 };
 const save=async patch=>{const response=await fetch(base+'/config/save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(patch)});if(!response.ok)throw new Error('Fixture config save failed');};
 await save({sessionMinimumPercent:53,sessionMaximumPercent:61});
 for(const populated of configOnly?[]:[false,true]){
  await value(embedded,`document.querySelector('#board-layout-player-top .user-username-component').textContent=${JSON.stringify(populated?'GMTestTC01':'Waiting for opponent')}`);
  if(populated)await waitFor(()=>value(embedded,"Boolean(document.querySelector('.tc-scout-opening-row'))"));else await delay(400);
  for(const bot of [false,true])for(const smartPacing of [false,true]){
   await save({hint:bot,smartPacing});await waitFor(()=>value(embedded,`document.getElementById('sp-on').checked===${smartPacing} && document.getElementById('st-on').checked===${bot}`));await delay(450);
   for(const width of [1086,1280,1440,1920,1033,800]){
    await embedded.send('Page.bringToFront');await embedded.send('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:false});await delay(100);
    await waitFor(()=>value(embedded,`document.getElementById('sp-on').checked===${smartPacing} && (getComputedStyle(document.getElementById('auto-delay-section')).display==='none')===${smartPacing}`));await delay(300);
    const state=await value(embedded,'('+measure.toString()+')('+JSON.stringify('console')+')');state.state={bot,smartPacing,populated};state.actual=await value(embedded,"({smartPacing:document.getElementById('sp-on').checked,bot:document.getElementById('st-on').checked,timingDisplay:getComputedStyle(document.getElementById('auto-delay-section')).display})");results.push(state);
    if([1440,1086,800].includes(width)){const b=state.host;const shot=await embedded.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,clip:{x:b.x,y:b.y,width:b.width,height:b.height,scale:1}});await writeFile(join(output,`console-${width}-bot${Number(bot)}-pacing${Number(smartPacing)}-scout${Number(populated)}.png`),Buffer.from(shot.data,'base64'));}
   }
  }
 }
 for(const bot of [false,true])for(const smartPacing of [false,true]){
  await save({hint:bot,smartPacing});await waitFor(()=>value(panel,`document.querySelector('[data-key=smartPacing]').getAttribute('aria-checked')==='${smartPacing}'&&document.querySelector('[data-key=hint]').getAttribute('aria-checked')==='${bot}'`));await delay(300);
  for(const width of [1440,1280,1024,768,390]){
   await panel.send('Page.bringToFront');await panel.send('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:false});await delay(100);
   const state=await value(panel,'('+measure.toString()+')('+JSON.stringify('config')+')');state.state={bot,smartPacing};results.push(state);
   if([1440,1024,390].includes(width)){const height=await value(panel,'document.documentElement.scrollHeight');const shot=await panel.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,clip:{x:0,y:0,width,height,scale:1}});await writeFile(join(output,`config-${width}-bot${Number(bot)}-pacing${Number(smartPacing)}.png`),Buffer.from(shot.data,'base64'));}
  }
 }
 await writeFile(join(output,'audit.json'),JSON.stringify(results,null,2));
 console.log(JSON.stringify({runs:results.length,console:results.filter(x=>x.surface==='console').length,config:results.filter(x=>x.surface==='config').length,smallText:results.filter(x=>x.width===1440).map(x=>({surface:x.surface,state:x.state,small:x.smallText.length,rows:x.rows.map(r=>({text:r.text,height:r.height,textOffset:r.textOffset,controlOffset:r.controlOffset,marginTop:r.marginTop})),banner:x.banner}))},null,2));
}finally{
 for(const c of clients)c.socket.close();browser.kill();backend.kill();await delay(500);await rm(profile,{recursive:true,force:true,maxRetries:5,retryDelay:150});
}
