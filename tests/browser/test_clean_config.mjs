import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {resolve,join} from 'node:path';
import {createServer} from 'node:net';
const root=resolve(import.meta.dirname,'../..'),before=process.argv.includes('--before');
const output=join(root,'_bmad-output/implementation-artifacts/clean-config',before?'before':'after');await mkdir(output,{recursive:true});
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
const measure=()=>{
 const rect=n=>{const r=n.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom}};
 const visible=n=>{const r=n.getBoundingClientRect(),s=getComputedStyle(n);return r.width>0&&r.height>0&&s.display!=='none'&&s.visibility!=='hidden'&&s.opacity!=='0';};
 const selector=n=>n.id?'#'+n.id:n.dataset.key?'[data-key="'+n.dataset.key+'"]':n.tagName.toLowerCase()+(n.className?'.'+String(n.className).trim().split(/\s+/).join('.'):'');
 const panels=Object.fromEntries([...document.querySelectorAll('#panels>.panel')].map(n=>{const clone=n.cloneNode(true);Object.assign(clone.style,{position:'fixed',visibility:'hidden',width:n.getBoundingClientRect().width+'px',height:'max-content',alignSelf:'start'});document.body.append(clone);const natural=clone.getBoundingClientRect().height;clone.remove();const last=[...n.children].filter(visible).at(-1);return[n.id,{...rect(n),natural,tail:rect(n).bottom-1-rect(last).bottom}]}));
 const elements=[...document.querySelectorAll('h1,h2,p,small,span,button,input,select,summary,label,output,a')].filter(n=>!n.closest('script,style')&&(n.textContent.trim()||n.matches('input'))).map(n=>({selector:selector(n),text:n.matches('input')?n.value:n.textContent.trim(),title:n.title||'',visible:visible(n),font:getComputedStyle(n).fontSize,disabled:Boolean(n.disabled),box:rect(n)}));
 const rows=[...document.querySelectorAll('.control-row')].map(n=>{const c=n.querySelector('button,input'),label=n.querySelector('label,span');return{label:label?.textContent,...rect(n),control:rect(c),centerDelta:rect(c).y+rect(c).height/2-rect(n).y-rect(n).height/2}});
 const hint=document.querySelector('#analysis-engine-message'),s=getComputedStyle(hint),clone=hint.cloneNode(true);Object.assign(clone.style,{position:'fixed',width:hint.clientWidth+'px',font:s.font,lineHeight:s.lineHeight,whiteSpace:'normal',height:'auto',maxHeight:'none',overflow:'visible',margin:'0'});clone.style.setProperty('white-space','normal','important');document.body.append(clone);const fullHeight=clone.getBoundingClientRect().height;clone.remove();
 return{width:innerWidth,panels,rows,elements,hint:{text:hint.textContent,title:hint.title,box:rect(hint),fullHeight,lineHeight:s.lineHeight,whiteSpace:s.whiteSpace,overflow:s.overflow,textOverflow:s.textOverflow},details:document.querySelectorAll('.engine-details').length,fields:[...document.querySelectorAll('#kb-session-duration,#kb-session-min-rate,#kb-session-max-rate,#tc-rating-target')].map(n=>({id:n.id,value:n.value,placeholder:n.placeholder})),startDisabled:document.querySelector('#kb-session-start').disabled,overflow:document.documentElement.scrollWidth>innerWidth};
};
try{
 await waitFor(async()=> (await fetch(base+'/config/load')).ok);await waitFor(async()=> (await fetch(`http://127.0.0.1:${debugPort}/json/list`)).ok);
 const tab=(await(await fetch(`http://127.0.0.1:${debugPort}/json/list`)).json()).find(t=>t.type==='page');client=await connect(tab.webSocketDebuggerUrl);await client.send('Page.enable');await client.send('Runtime.enable');client.on('Runtime.exceptionThrown',m=>exceptions.push(m));
 const results=[];
 const states=[['default',{},{}],['bot-on',{}, {hint:true}],['rating-on',{}, {autoAdjust:true}],['pacing-on',{}, {smartPacing:true}],['all-on',{}, {hint:true,autoAdjust:true,smartPacing:true}],['connected',{connected:true},{}],['outdated',{connected:true,version:'2026-10-24.1'},{}],['absent',{connected:false},{}],['loading',{loading:true},{}],['engine-error',{engineError:true},{}],['server-lost',{offline:true},{}],['immediate',{connected:true},{delayMode:'max'}]];
 for(const [state,projection,patch] of states)for(const width of [1440,1280,1024,768,390]){
  await fetch(base+'/qa/state',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});
  await fetch(base+'/config/save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({hint:false,autoAdjust:false,smartPacing:false,delayMode:'random',...patch})});
  await fetch(base+'/qa/state',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(projection)});
  await client.send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});await client.send('Page.navigate',{url:base+'/config?audit='+state});
  await waitFor(()=>value("document.readyState==='complete'&&Boolean(document.querySelector('[data-key=ghostMode]'))"));if(state!=='loading')await waitFor(()=>value("document.querySelector('#analysis-engine-state').textContent!=='Initializing'"));await pause(100);
  const r=await value('('+measure.toString()+')()');r.state=state;results.push(r);
  if((state==='default'&&[1440,1024,390].includes(width))||(state!=='default'&&width===1440)){const shot=await client.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});await writeFile(join(output,state==='default'?`config-${width}.png`:`config-${state}-${width}.png`),Buffer.from(shot.data,'base64'));}
 }
 await writeFile(join(output,'audit.json'),'[\n'+results.map(r=>JSON.stringify(r)).join(',\n')+'\n]');
 await fetch(base+'/qa/state',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});await fetch(base+'/config/save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({hint:false,autoAdjust:false,smartPacing:false,delayMode:'random'})});
 await client.send('Page.navigate',{url:base+'/tests/fixtures/userscript_bootstrap.html?delay=50'});await waitFor(()=>value("Boolean(document.querySelector('#sp-on'))"));
 await value(`window.ThinkerRatingTracker.start({window:new Proxy(window,{get(t,k){if(k==='location')return{hostname:'www.chess.com',href:location.href};const v=Reflect.get(t,k,t);return typeof v==='function'&&!['MutationObserver'].includes(k)?v.bind(t):v;}}),baseUrl:location.origin,gmRequest:window.GM_xmlhttpRequest});void 0`);await waitFor(()=>value("Boolean(document.querySelector('#tc-rating-target'))"));
 const consoleResults=[];
 for(const pacing of [false,true])for(const width of [1086,1280,1440,1920,1033,800]){
  await fetch(base+'/config/save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({smartPacing:pacing})});await waitFor(()=>value(`document.querySelector('#sp-on').checked===${pacing}`));await waitFor(()=>value(`(getComputedStyle(document.querySelector('#auto-delay-section')).display==='none')===${pacing}`));await client.send('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:false});await pause(250);
  const r=await value(`(()=>{const rect=n=>n.getBoundingClientRect().toJSON();return{panels:[...document.querySelectorAll('.kb-console-module,#oi-zone2,.kb-console-caption,.tc-scout-title')].map(n=>({id:n.id,cls:n.className,box:rect(n)})),colors:[...document.querySelectorAll('#krypbot-container *,#oi-zone2 *')].filter(n=>!n.classList.contains('tc-engine-picker')&&n.getBoundingClientRect().width&&n.getBoundingClientRect().height).map(n=>{const s=getComputedStyle(n);return{tag:n.tagName,id:n.id,cls:String(n.className),color:s.color,background:s.backgroundColor,border:s.borderColor}})}})()`);consoleResults.push({width,pacing,...r});
 }
 await writeFile(join(output,'console.json'),JSON.stringify(consoleResults));
 if(!before){const old=JSON.parse(await readFile(join(output,'../before/console.json'),'utf8'));if(JSON.stringify(consoleResults)!==JSON.stringify(old))throw Error('Console changed; inspect before/after console.json');for(const r of results){assert.equal(r.details,0);assert.equal(r.overflow,false);assert(r.rows.every(x=>x.height===40&&x.centerDelta===0));}}
 await writeFile(join(output,'console.json'),JSON.stringify(consoleResults));await writeFile(join(output,'exceptions.json'),JSON.stringify(exceptions));assert.deepEqual(exceptions,[]);console.log(JSON.stringify({passed:true,before,configStates:results.length,consoleStates:consoleResults.length}));
}finally{client?.socket.close();chrome.kill();server.kill();await pause(500);await rm(profile,{recursive:true,force:true,maxRetries:6,retryDelay:200});}
