import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {resolve,join} from 'node:path';
import {createServer} from 'node:net';
const root=resolve(import.meta.dirname,'../..'),before=process.argv.includes('--before');
const output=join(root,'_bmad-output/implementation-artifacts/responsive-display',process.argv.includes('--density-simulation')?'density-simulation':'dynamic-zoom');await mkdir(output,{recursive:true});
const pause=ms=>new Promise(r=>setTimeout(r,ms));
const port=()=>new Promise(r=>{const s=createServer();s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>r(p));});});
const serverPort=await port(),debugPort=await port(),base=`http://127.0.0.1:${serverPort}`;
const profile=await mkdtemp(join(tmpdir(),'thinker-config-entry-'));
const preference=join(profile,'preferences.json');
const server=spawn('python',['tests/responsive_fixture.py',String(serverPort),'--preferences',preference],{cwd:root,stdio:'ignore',windowsHide:true});
await mkdir(join(profile,'Default'),{recursive:true});const level=Math.log(2)/Math.log(1.2);await writeFile(join(profile,'Default','Preferences'),JSON.stringify({partition:{default_zoom_level:{'':level,x:level}},profile:{default_zoom_level:level}}));
const chrome=spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new',...(process.argv.includes('--density-simulation')?['--force-device-scale-factor=1.5']:[]),'--disable-gpu','--no-first-run','--disable-background-timer-throttling',`--remote-debugging-port=${debugPort}`,`--user-data-dir=${profile}`,'about:blank'],{stdio:'ignore',windowsHide:true});
let client;const messages=[],exceptions=[],network=[];
async function waitFor(test){for(let i=0;i<240;i++){try{if(await test())return;}catch{}await pause(100);}throw Error('Timeout');}
async function connect(url){const socket=new WebSocket(url),pending=new Map(),handlers=new Map();let id=0;socket.addEventListener('message',e=>{const m=JSON.parse(e.data);handlers.get(m.method)?.(m.params);const p=pending.get(m.id);if(p){pending.delete(m.id);m.error?p.reject(Error(m.error.message)):p.resolve(m.result);}});await new Promise(r=>socket.addEventListener('open',r,{once:true}));return{socket,on:(m,f)=>handlers.set(m,f),send:(method,params={})=>new Promise((resolve,reject)=>{pending.set(++id,{resolve,reject});socket.send(JSON.stringify({id,method,params}));})};}
async function value(expression){const r=await client.send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value;}
const reports=[];let settings;
try{
 await waitFor(async()=> (await fetch(base+'/config/load')).ok);await waitFor(async()=> (await fetch(`http://127.0.0.1:${debugPort}/json/list`)).ok);const tab=(await(await fetch(`http://127.0.0.1:${debugPort}/json/list`)).json()).find(t=>t.type==='page');client=await connect(tab.webSocketDebuggerUrl);await client.send('Page.enable');await client.send('Runtime.enable');const errors=[];client.on('Runtime.exceptionThrown',e=>errors.push(e));
 const settingsTab=await(await fetch(`http://127.0.0.1:${debugPort}/json/new?chrome://settings/appearance`,{method:'PUT'})).json();settings=await connect(settingsTab.webSocketDebuggerUrl);await settings.send('Runtime.enable');
 const settingsValue=async expression=>{const r=await settings.send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value;};
 await waitFor(()=>settingsValue("typeof chrome.settingsPrivate?.setDefaultZoom==='function'"));const density=process.argv.includes('--density-simulation')?1.5:1;
 for(const surface of ['config','console']){
  await settingsValue('chrome.settingsPrivate.setDefaultZoom(1)');await client.send('Page.navigate',{url:base+(surface==='config'?'/config':'/responsive?delay=20')});await client.send('Page.bringToFront');
  const id=surface==='config'?'analysis-engine':'tc-analysis-engine';await waitFor(()=>value(`document.querySelector('#${id}')?.options.length===3&&!document.querySelector('#${id}').disabled`));
  await value(`document.querySelector('#${id}').value='komodo-14.1';document.querySelector('#${id}').dispatchEvent(new Event('change',{bubbles:true}));window.qaRoot=document.querySelector('${surface==='config'?'#panels':'#krypbot-container'}');window.qaOrigin=performance.timeOrigin;`);await waitFor(()=>value(`document.querySelector('#${id}').value==='komodo-14.1'&&!document.querySelector('#${id}').disabled`));
  for(const zoom of [1,1.25,2,.67,1.75,1]){
   await value(`document.querySelector('#${id}').scrollIntoView({block:'center'});if(document.querySelector('#${id}-picker').getAttribute('aria-expanded')!=='true')document.querySelector('#${id}-picker').click()`);
   await settingsValue(`chrome.settingsPrivate.setDefaultZoom(${zoom})`);await waitFor(()=>value(`Math.abs(devicePixelRatio-${zoom*density})<.03`));await pause(300);
   const r=await value(`(()=>{const menu=document.querySelector('#${id}-options'),b=document.querySelector('#${id}-picker'),v=b.getAttribute('aria-expanded'),r=menu.getBoundingClientRect(),banner=document.querySelector('#thinker-chess-banner'),im=banner?.querySelector('img');return{width:innerWidth,height:innerHeight,dpr:devicePixelRatio,pinch:visualViewport.scale,selection:document.querySelector('#${id}').value,sameRoot:qaRoot===document.querySelector('${surface==='config'?'#panels':'#krypbot-container'}'),sameNavigation:qaOrigin===performance.timeOrigin,menuOpen:v==='true',menu:r.toJSON(),bannerImage:im?.getBoundingClientRect().toJSON(),overflow:document.documentElement.scrollWidth>innerWidth+1}})()`);
   assert.equal(r.selection,'komodo-14.1');assert.equal(r.sameRoot,true);assert.equal(r.sameNavigation,true);assert.equal(r.pinch,1);assert.equal(r.overflow,false);if(r.menuOpen){assert(r.menu.left>=0&&r.menu.right<=r.width+1&&r.menu.top>=0&&r.menu.bottom<=r.height+1);}
   if(surface==='console'&&zoom===2){
    const state=await client.send('Browser.getWindowForTarget',{targetId:tab.id});await client.send('Browser.setWindowBounds',{windowId:state.windowId,bounds:{width:656,height:335}});await pause(180);await value("const t=document.querySelector('#kb-session-toast');t.textContent=ThinkerSessionControl.warningLabel('SESSION_TARGETS_UNSET');t.dataset.visible='true'");await pause(200);
    const toast=await value("({rect:document.querySelector('#kb-session-toast').getBoundingClientRect().toJSON(),width:innerWidth,height:innerHeight})");assert(toast.rect.left>=0&&toast.rect.right<=toast.width+1&&toast.rect.top>=0&&toast.rect.bottom<=toast.height+1,JSON.stringify(toast));reports.push({case:'notification-presentation-only',...toast});await value("document.querySelector('#kb-session-toast').dataset.visible='false'");await client.send('Browser.setWindowBounds',{windowId:state.windowId,bounds:{width:state.bounds.width,height:state.bounds.height}});await pause(180);
   }
   reports.push({surface,zoom,...r});
  }
  if(surface==='console'){
   const w=await client.send('Browser.getWindowForTarget',{targetId:tab.id});await client.send('Browser.setWindowBounds',{windowId:w.windowId,bounds:{width:1456,height:995}});await value('scrollTo(0,0)');await pause(200);
   await value("const off=document.querySelector('#bn-off');off.checked=true;off.dispatchEvent(new Event('change',{bubbles:true}));document.querySelector('.play-controller-component:not(.stale-controller)').style.display='none'");await pause(150);
   await value("const sidebar=document.querySelector('.play-controller-component:not(.stale-controller)');sidebar.style.height='1200px';sidebar.style.display='block'");await pause(220);
   const layout=await value("({workspace:document.querySelector('#oi-wrapper').getBoundingClientRect().top,sidebar:document.querySelector('.play-controller-component:not(.stale-controller)').getBoundingClientRect().bottom,bannerHidden:document.querySelector('#thinker-chess-banner').style.display==='none'})");assert.equal(layout.bannerHidden,true);assert(layout.workspace>=layout.sidebar,JSON.stringify(layout));reports.push({case:'hidden-sidebar-appears-banner-off',...layout});
  }
  await value(`window.qaResizeRecords=0;window.qaResizeObserver=new MutationObserver(records=>qaResizeRecords+=records.length);qaResizeObserver.observe(document.querySelector('${surface==='config'?'#panels':'#oi-wrapper'}'),{attributes:true});for(let i=0;i<200;i++)window.dispatchEvent(new Event('resize'));`);await pause(200);const resizeWrites=await value('qaResizeRecords');assert.equal(resizeWrites,0);await value('qaResizeObserver.disconnect()');reports.push({case:'200-same-size-resize-events',surface,panelMutations:resizeWrites});
  await client.send('Page.reload');await waitFor(()=>value(`document.querySelector('#${id}')?.value==='komodo-14.1'&&!document.querySelector('#${id}').disabled`));
 }
 assert.deepEqual(errors,[]);await writeFile(join(output,'report.json'),JSON.stringify({method:'Native Chrome settings UI setDefaultZoom in separate temporary profile; app document is never reloaded during sequence',density,densityIsSimulation:density!==1,reports,errors},null,2));console.log(JSON.stringify({passed:true,dynamicCases:reports.length,density,realBrowserZoom:true,appReloadsDuringSequence:0}));
}finally{settings?.socket.close();client?.socket.close();chrome.kill();server.kill();await pause(500);await rm(profile,{recursive:true,force:true,maxRetries:6,retryDelay:200});}
