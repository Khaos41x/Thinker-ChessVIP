import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {resolve,join} from 'node:path';
import {createServer} from 'node:net';
const root=resolve(import.meta.dirname,'../..'),before=process.argv.includes('--before');
const output=join(root,'_bmad-output/implementation-artifacts/retry-header','header-states');await mkdir(output,{recursive:true});
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
const geometry=()=>{
 const rect=n=>n.getBoundingClientRect().toJSON();
 const all=[...document.querySelectorAll('#panels>.panel,.kb-console-module,#oi-zone2,.kb-console-caption,.tc-scout-title')];
 const rows=[...document.querySelectorAll('.control-row')].map(n=>{const c=n.querySelector('button,input'),label=n.querySelector('label,span'),r=rect(n),v=rect(c),l=rect(label);return{key:c.dataset.key,height:r.height,y:r.y,labelCenter:l.y+l.height/2,controlCenter:v.y+v.height/2,center:r.y+r.height/2,delta:v.y+v.height/2-r.y-r.height/2,paddingAbove:v.y-r.y,paddingBelow:r.bottom-v.bottom};});
 return{panels:all.map(n=>({id:n.id,cls:n.className,rect:rect(n)})),rows,header:document.querySelector('.page-header')?{eyebrow:rect(document.querySelector('.eyebrow')),title:rect(document.querySelector('h1')),connection:rect(document.querySelector('.connection')),status:rect(document.querySelector('.connection-status')),notice:rect(document.querySelector('.connection-status .notice')),version:rect(document.querySelector('#client-build-state').parentElement),panelsTop:rect(document.querySelector('#panels')).top,topPadding:getComputedStyle(document.querySelector('main')).paddingTop}:null,overflow:document.documentElement.scrollWidth>innerWidth,colors:[...document.querySelectorAll('button,input,select,.tc-analysis-status,#analysis-engine-state')].map(n=>{const s=getComputedStyle(n);return{id:n.id,key:n.dataset.key,cls:String(n.className),color:s.color,background:s.backgroundColor,border:s.borderColor}})};
};
const results=[];
try{
 await waitFor(async()=> (await fetch(base+'/config/load')).ok);await waitFor(async()=> (await fetch(`http://127.0.0.1:${debugPort}/json/list`)).ok);
 const tab=(await(await fetch(`http://127.0.0.1:${debugPort}/json/list`)).json()).find(t=>t.type==='page');client=await connect(tab.webSocketDebuggerUrl);await client.send('Page.enable');await client.send('Runtime.enable');client.on('Runtime.exceptionThrown',e=>exceptions.push(e));client.on('Runtime.consoleAPICalled',e=>messages.push(e));
 for(const width of [1440,1280,1024,768,390]){
  await client.send('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:false});
  await fetch(base+'/qa/state',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({connected:true})});
  await client.send('Page.navigate',{url:base+'/config'});await waitFor(()=>value("document.querySelector('#analysis-engine-state')?.textContent==='Ready'&&document.querySelector('#client-build-state').parentElement.hidden"));
  for(const state of ['current','outdated','absent']){
   if(state!=='current'){await fetch(base+'/qa/state',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(state==='outdated'?{connected:true,version:'2026-10-01.1'}:{connected:false})});await pause(2300);}
   const r=await value('('+geometry.toString()+')()');const text=await value(`(()=>{const line=document.querySelector('#client-build-state').parentElement;return{hidden:line.hidden,text:line.textContent,link:document.querySelector('#userscript-update').getBoundingClientRect().toJSON(),bannerHint:document.querySelector('#banner-display-state')!==null,rowH:getComputedStyle(document.documentElement).getPropertyValue('--row-h'),gap:document.querySelector('#panels').getBoundingClientRect().top-document.querySelector('.connection-status').getBoundingClientRect().bottom}})()`);
   assert.equal(r.overflow,false);assert.equal(text.gap,12);assert.equal(text.hidden,state==='current');assert.equal(text.bannerHint,false);if(state!=='current')assert.equal(text.link.left,r.header.status.left);
   const original=JSON.parse(await readFile(join(output,'../before/measurements.json'),'utf8')).results.find(x=>x.surface==='config'&&x.width===width&&!x.banner);
   if(state==='current')assert.equal(r.header.panelsTop,original.header.panelsTop);
   results.push({width,state,...r,...text});
   if([1440,1024,390].includes(width))await client.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true}).then(r=>writeFile(join(output,`config-${width}-${state}.png`),Buffer.from(r.data,'base64')));
  }
 }
 await fetch(base+'/qa/state',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({offline:true})});await waitFor(()=>value("document.querySelector('#connection').textContent==='Local server offline'"));
 for(const width of [1440,1024,390]){await client.send('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:false});await pause(150);await client.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true}).then(r=>writeFile(join(output,`config-${width}-offline.png`),Buffer.from(r.data,'base64')));}
 await client.send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
 await fetch(base+'/qa/state',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({connected:true})});await value("document.querySelector('#retry').click()");await waitFor(()=>value("document.querySelector('#analysis-engine-state').textContent==='Ready'&&document.querySelector('#client-build-state').parentElement.hidden"));
 const original=await value('('+geometry.toString()+')()');
 await value(`document.querySelector('main').style.setProperty('padding-top','40px','important')`);await client.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false}).then(r=>writeFile(join(output,'PROPOSAL-move-panels-up-25.png'),Buffer.from(r.data,'base64')));const topProposal=await value('('+geometry.toString()+')()');
 await value(`document.querySelector('main').style.removeProperty('padding-top');document.querySelector('main').style.setProperty('--version-inset','25px');const visuals=document.querySelector('#visuals'),workspace=document.querySelector('#workspace');visuals.append(...[...workspace.children].filter(n=>n.tagName!=='H2'));workspace.remove();document.querySelector('#panels').style.gridTemplateAreas='"core engine" "visuals engine" "autoplay autoplay"';document.querySelector('#panels').style.gridTemplateRows='175px 289px auto';visuals.querySelector('[data-controls=workspace]').style.marginTop='8px';visuals.querySelector(':scope > .control-row').style.marginTop='2px'`);await client.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false}).then(r=>writeFile(join(output,'PROPOSAL-clean-view-in-visuals.png'),Buffer.from(r.data,'base64')));const alignmentProposal=await value('('+geometry.toString()+')()');
 assert.deepEqual(messages,[]);assert.deepEqual(exceptions,[]);await writeFile(join(output,'report.json'),JSON.stringify({results,proposals:{original,topProposal,alignmentProposal},messages,exceptions},null,2));console.log('PASS15 header states,version visibility,left link,no orphan delimiter,12px gap,current panel y unchanged,390 overflow0');
}finally{client?.socket.close();chrome.kill();server.kill();await pause(500);await rm(profile,{recursive:true,force:true,maxRetries:6,retryDelay:200});}
