import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {resolve,join} from 'node:path';
import {createServer} from 'node:net';
const root=resolve(import.meta.dirname,'../..'),before=process.argv.includes('--before'),quick=process.argv.includes('--quick');
const output=join(root,'_bmad-output/implementation-artifacts/responsive-display',before?'before':'after');await mkdir(output,{recursive:true});
const pause=ms=>new Promise(r=>setTimeout(r,ms)),port=()=>new Promise(r=>{const s=createServer();s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>r(p));});});
const serverPort=await port(),labPort=await port(),base=`http://127.0.0.1:${serverPort}`;
const work=await mkdtemp(join(tmpdir(),'thinker-responsive-'));
const server=spawn('python',['tests/responsive_fixture.py',String(serverPort),'--preferences',join(work,'preferences.json')],{cwd:root,stdio:['ignore','ignore','pipe'],windowsHide:true});
const lab=spawn('node',['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port',String(labPort),'--strictPort'],{cwd:join(root,'analysis_lab'),stdio:['ignore','ignore','pipe'],windowsHide:true});
let fixtureError='',labError='';server.stderr.on('data',b=>fixtureError+=b);lab.stderr.on('data',b=>labError+=b);
let chrome,client,windowId;const reports=[],issues=[],exceptions=[];
async function waitFor(test){for(let i=0;i<300;i++){try{if(await test())return;}catch{}await pause(100);}throw Error('Timeout');}
async function connect(url){const socket=new WebSocket(url),pending=new Map(),handlers=new Map();let id=0;socket.addEventListener('message',e=>{const m=JSON.parse(e.data);handlers.get(m.method)?.(m.params);const p=pending.get(m.id);if(p){pending.delete(m.id);m.error?p.reject(Error(m.error.message)):p.resolve(m.result);}});await new Promise(r=>socket.addEventListener('open',r,{once:true}));return{socket,on:(m,f)=>handlers.set(m,f),send:(method,params={})=>new Promise((resolve,reject)=>{pending.set(++id,{resolve,reject});socket.send(JSON.stringify({id,method,params}));})};}
async function value(expression){const r=await client.send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value;}
async function size(width,height,zoom){const s=await value('({w:innerWidth,h:innerHeight,ow:outerWidth,oh:outerHeight})');await client.send('Browser.setWindowBounds',{windowId,bounds:{width:Math.round(width+s.ow-s.w*zoom),height:Math.round(height+s.oh-s.h*zoom)}});await pause(180);}
const inspect=()=>{
 const rect=n=>n.getBoundingClientRect().toJSON(),visible=n=>{const r=rect(n),s=getComputedStyle(n);return r.width>0&&r.height>0&&s.display!=='none'&&s.visibility!=='hidden'},bad=[];
 const panels=[...document.querySelectorAll('#panels>.panel,.kb-console-module,#oi-zone2,.status-card,.analysis-column > .panel,.board-column,.import-dialog[open]')].filter(visible).map(n=>({id:n.id,cls:n.className,rect:rect(n),overflow:n.scrollWidth>n.clientWidth+2}));
 for(const p of panels){if(p.rect.left< -1||p.rect.right>innerWidth+1)bad.push('panel-outside:'+p.id+':'+p.cls);if(p.overflow)bad.push('panel-clips:'+p.id+':'+p.cls)}
 const fields=[...document.querySelectorAll('.delay-fields input,.kb-engine-timing .kb-num-input')].filter(visible).map(n=>{const s=getComputedStyle(n),c=document.createElement('canvas').getContext('2d');c.font=s.font;return{id:n.id,width:rect(n).width,space:n.clientWidth-parseFloat(s.paddingLeft)-parseFloat(s.paddingRight),needed:c.measureText(n.value).width}});
 for(const f of fields)if(f.space+1<f.needed)bad.push('number-clips:'+f.id);
 const banner=document.querySelector('#thinker-chess-banner'),sidebar=document.querySelector('.play-controller-component:not(.stale-controller)');
 const b=banner&&visible(banner)?{rect:rect(banner),sidebar:rect(sidebar),image:rect(banner.querySelector('img'))}:null;
 if(b&&(b.rect.left<0||b.rect.right>innerWidth+1))bad.push('banner-outside');
 const wrapper=document.querySelector('#oi-wrapper'),w=wrapper?rect(wrapper):null;
 return{innerWidth,innerHeight,dpr:devicePixelRatio,visualScale:visualViewport?.scale,pageWidth:document.documentElement.scrollWidth,overflow:document.documentElement.scrollWidth>innerWidth+1,panels,fields,banner:b,wrapper:w,layout:wrapper?.dataset.layoutMode,bad};
};
async function shot(name){const r=await client.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});await writeFile(join(output,name+'.png'),Buffer.from(r.data,'base64'));}
try{
 try{await waitFor(async()=> (await fetch(base+'/config/load')).ok);await waitFor(async()=> (await fetch(`http://127.0.0.1:${labPort}`)).ok);}catch(error){throw Error(JSON.stringify({error:error.message,server:server.exitCode,lab:lab.exitCode,fixtureError,labError}));}
 for(const zoom of (quick?[1,2]:[.67,.75,.8,.9,1,1.1,1.25,1.5,1.75,2])){
  const profile=join(work,'chrome-'+zoom),debugPort=await port();await mkdir(join(profile,'Default'),{recursive:true});const level=Math.log(zoom)/Math.log(1.2);await writeFile(join(profile,'Default','Preferences'),JSON.stringify({partition:{default_zoom_level:{'':level,x:level}},profile:{default_zoom_level:level}}));
  chrome=spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--disable-gpu','--no-first-run','--disable-background-timer-throttling',`--remote-debugging-port=${debugPort}`,`--user-data-dir=${profile}`,'about:blank'],{stdio:'ignore',windowsHide:true});
  await waitFor(async()=> (await fetch(`http://127.0.0.1:${debugPort}/json/list`)).ok);const tab=(await(await fetch(`http://127.0.0.1:${debugPort}/json/list`)).json()).find(t=>t.type==='page');client=await connect(tab.webSocketDebuggerUrl);await client.send('Page.enable');await client.send('Runtime.enable');await client.send('Emulation.setFocusEmulationEnabled',{enabled:true});client.on('Runtime.exceptionThrown',e=>exceptions.push({zoom,...e}));windowId=(await client.send('Browser.getWindowForTarget',{targetId:tab.id})).windowId;
  for(const surface of ['config','console','status','lab']){
   await client.send('Page.navigate',{url:surface==='lab'?`http://127.0.0.1:${labPort}`:base+(surface==='config'?'/config':surface==='console'?'/responsive?delay=20':'/')});
   await waitFor(()=>value(surface==='config'?"document.querySelector('#analysis-engine-state')?.textContent==='Ready'":surface==='console'?"document.querySelector('.tc-analysis-status')?.textContent==='Ready'":surface==='lab'?"Boolean(document.querySelector('cg-board'))":"Boolean(document.querySelector('.status-card'))"));
   if(surface==='console')await waitFor(()=>value("Boolean(document.querySelector('#tc-rating-target'))"));
   assert(Math.abs(await value('devicePixelRatio')-zoom)<.02,'Real browser zoom not applied');assert.equal(await value('visualViewport.scale'),1,'Pinch zoom is not browser zoom');
   for(const [width,height]of (quick?[[1280,720],[780,520],[640,480],[640,240]]:[[1280,720],[1366,768],[1440,900],[1920,1080],[2560,1440],[780,520],[980,640],[640,480],[640,240]])){
    await size(width,height,zoom);await value('scrollTo(0,0)');await pause(150);const m=await value('('+inspect.toString()+')()');
    const result={surface,zoom,requested:{width,height},...m};reports.push(result);for(const issue of m.bad)issues.push({surface,zoom,width,height,issue});if(m.overflow)issues.push({surface,zoom,width,height,issue:'page-overflow'});
    if((zoom===1||zoom===2)&&width===1280){if(surface==='console')await value("document.querySelector('#oi-wrapper').scrollIntoView({block:'start'})");await shot(`${surface}-${width}-zoom-${zoom*100}`);}
    if(surface==='config'||surface==='console'){
     const id=surface==='config'?'analysis-engine':'tc-analysis-engine';await value(`document.querySelector('#${id}').scrollIntoView({block:'center'});document.querySelector('#${id}-picker').click()`);await pause(30);const menu=await value(`(()=>{const n=document.querySelector('#${id}-options'),r=n.getBoundingClientRect();return{open:document.querySelector('#${id}-picker').getAttribute('aria-expanded'),rect:r.toJSON(),overflow:n.scrollWidth>n.clientWidth+1}})()`);result.menu=menu;
     if(menu.open==='true'&&(menu.rect.left<0||menu.rect.right>m.innerWidth+1||menu.rect.top<0||menu.rect.bottom>m.innerHeight+1||menu.overflow))issues.push({surface,zoom,width,height,issue:'menu-outside-or-clipped',menu});
     await size(width-100,height-80,zoom);const selection=await value(`document.querySelector('#${id}').value`);await size(width,height,zoom);assert.equal(await value(`document.querySelector('#${id}').value`),selection);
     await value(`document.body.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));document.querySelector('#${id}-picker').getAttribute('aria-expanded')==='true'&&document.querySelector('#${id}-picker').click()`);
    }
    if(surface==='lab'){
     await value("document.querySelector('#import-open').click()");const dialog=await value('('+inspect.toString()+')()');if(dialog.bad.length)issues.push(...dialog.bad.map(issue=>({surface:'lab-dialog',zoom,width,height,issue})));await value("document.querySelector('#import-value').value='synthetic resize draft'");await size(width-50,height-30,zoom);assert.equal(await value("document.querySelector('#import-dialog').open&&document.querySelector('#import-value').value==='synthetic resize draft'"),true);await size(width,height,zoom);const bounds=await value("document.querySelector('#import-dialog').getBoundingClientRect().toJSON()");if(bounds.top< -1||bounds.bottom>m.innerHeight+1)issues.push({surface,zoom,width,height,issue:'dialog-outside'});await value("document.querySelector('#import-dialog').close()");
    }
   }
   if(surface==='console'&&zoom===1){
    await size(1440,900,zoom);await value('scrollTo(0,0)');await pause(150);const prior=await value('('+inspect.toString()+')()');await value("document.querySelector('.play-controller-component:not(.stale-controller)').style.transform='translateY(30px)'");await pause(250);const moved=await value('('+inspect.toString()+')()');reports.push({case:'sidebar-translation',prior,moved});if(prior.banner&&moved.banner&&Math.abs(moved.banner.rect.top-prior.banner.rect.top-30)>1)issues.push({surface,issue:'stale-banner-after-sidebar-translation'});
   }
  }
  await writeFile(join(output,'progress.json'),JSON.stringify({reports,issues,exceptions},null,2));client.socket.close();client=null;chrome.kill();chrome=null;await pause(200);
 }
 await writeFile(join(output,'report.json'),JSON.stringify({method:'Native Chrome profile default zoom, Browser.setWindowBounds; no Emulation.setDeviceMetricsOverride/deviceScaleFactor/pageScaleFactor',reports,issues,exceptions},null,2));console.log(JSON.stringify({before,cases:reports.length,issues:issues.length,exceptions:exceptions.length}));if(!before){assert.deepEqual(exceptions,[]);assert.deepEqual(issues,[]);}
}finally{client?.socket.close();chrome?.kill();server.kill();lab.kill();await pause(500);assert(work.startsWith(join(tmpdir(),'thinker-responsive-')));await rm(work,{recursive:true,force:true,maxRetries:6,retryDelay:200});}
