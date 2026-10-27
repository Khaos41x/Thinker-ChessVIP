import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {resolve,join} from 'node:path';
import {createServer} from 'node:net';
const root=resolve(import.meta.dirname,'../..'),before=process.argv.includes('--before');
const output=join(root,'_bmad-output/implementation-artifacts/clean-config','proposals');await mkdir(output,{recursive:true});
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
const metrics=()=>{
 const box=n=>n.getBoundingClientRect().toJSON(),nodes={header:document.querySelector('.page-header'),connection:document.querySelector('.connection-status'),core:document.querySelector('#core'),visuals:document.querySelector('#visuals'),workspace:document.querySelector('#workspace'),engine:document.querySelector('#engine'),autoplay:document.querySelector('#autoplay'),footer:document.querySelector('footer')};
 const panels=Object.fromEntries(Object.entries(nodes).filter(([,n])=>n?.isConnected).map(([k,n])=>[k,box(n)]));
 const engine=document.querySelector('#engine'),last=engine.lastElementChild,slider=document.querySelector('#elo'),labels=document.querySelector('.range-labels'),heading=document.querySelector('.strength .field-heading');
 return{width:innerWidth,pageHeight:document.documentElement.scrollHeight,panels,engineTail:box(engine).bottom-1-box(last).bottom,slider:{headingToSlider:box(slider).top-box(heading).bottom,sliderToLabels:box(labels).top-box(slider).bottom,trackCenterToLabels:box(labels).top-(box(slider).y+box(slider).height/2)},bottomDelta:innerWidth<900?null:Math.max(box(document.querySelector('#visuals')).bottom,document.querySelector('#workspace')?box(document.querySelector('#workspace')).bottom:0)-box(engine).bottom};
};
const changes={
 P1:()=>{const line=document.querySelector('.connection'),label=document.querySelector('#connection');label.textContent=[label.textContent,document.querySelector('#userscript-connection').textContent,document.querySelector('#execution-state').textContent].join(' · ');line.style.maxWidth='100%';document.querySelector('.notice').style.display='none';},
 P2:()=>{document.querySelector('#client-build-state').style.display='none';const p=document.querySelector('#client-build-state').parentElement;for(const n of p.childNodes)if(n.nodeType===3)n.textContent='';},
 P3:()=>{document.querySelector('.intro').textContent='Your Thinker Chess settings.';document.querySelector('#connection').textContent='Thinker Chess is running';document.querySelector('#analysis-engine-message').textContent='Fast position analysis with Stockfish.';document.querySelector('#client-build-state').textContent='Update the userscript, then reload Chess.com.';document.querySelector('.footnote').textContent='Your settings are saved. Open Chess.com to use Auto Play.';document.querySelector('#save-state').textContent='Settings saved.';},
 P4:()=>{document.querySelector('#kb-session-start').style.display='none';document.querySelector('#kb-session-stop').style.display='none';document.querySelector('.session-summary').style.display='none';},
 P5:()=>{const hint=document.querySelector('#session-availability');document.querySelector('.session-actions').before(hint);},
 P6:()=>{const footer=document.querySelector('footer'),button=document.querySelector('#retry'),status=document.querySelector('#save-state');footer.prepend(button);status.textContent=document.querySelector('#userscript-connection').textContent;const saved=document.createElement('span');saved.textContent=' · Settings saved';status.append(saved);saved.id='qa-saved-feedback';document.querySelector('.footnote').style.display='none';},
 P7:()=>{const workspace=document.querySelector('#workspace'),visuals=document.querySelector('#visuals'),controls=workspace.querySelector('[data-controls]'),hint=workspace.querySelector('.hint');visuals.append(controls,hint);workspace.remove();document.querySelector('.panels').style.gridTemplateAreas=innerWidth>=900?'"core engine" "visuals engine" "autoplay autoplay"':'"core" "engine" "visuals" "autoplay"';document.querySelector('.panels').style.gridTemplateRows=innerWidth>=900?'repeat(3,max-content)':'repeat(4,max-content)';},
 P8:()=>{document.querySelector('#elo-value').style.display='none';document.querySelector('#timing-value').style.display='none';document.querySelector('.strength').style.gap='0px';},
 P9:()=>{document.querySelector('.intro').style.display='none';},
 E_stretch:()=>{document.querySelector('#engine').style.alignSelf='stretch';},
 E_P7:()=>{changes.P7();document.querySelector('.analysis-engine').style.paddingTop='10px';document.querySelectorAll('#engine .engine-group + .engine-group').forEach(n=>n.style.marginTop='12px');},
};
changes.P7_SP=changes.P7;changes.E_P7_SP=changes.E_P7;
try{
 await waitFor(async()=> (await fetch(base+'/config/load')).ok);await waitFor(async()=> (await fetch(`http://127.0.0.1:${debugPort}/json/list`)).ok);
 const tab=(await(await fetch(`http://127.0.0.1:${debugPort}/json/list`)).json()).find(t=>t.type==='page');client=await connect(tab.webSocketDebuggerUrl);await client.send('Page.enable');const results=[];
 for(const width of [1440,390])for(const name of Object.keys(changes)){
  await fetch(base+'/qa/state',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(name==='P2'?{connected:true}:{})});
  await fetch(base+'/config/save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({smartPacing:name.endsWith('_SP')})});
  await client.send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});await client.send('Page.navigate',{url:base+'/config?preview='+name});await waitFor(()=>value("document.querySelector('#analysis-engine-state').textContent==='Ready'&&Boolean(document.querySelector('#tc-rating-target'))"));await pause(100);
  const capture=async suffix=>{const shot=await client.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});await writeFile(join(output,`${name}-${width}-${suffix}.png`),Buffer.from(shot.data,'base64'));};
  const original=await value('('+metrics.toString()+')()');await capture('before');
  if(name.startsWith('E_P7'))await value('('+changes.P7.toString()+')()');
  if(name.startsWith('E_P7'))await value("document.querySelector('.analysis-engine').style.paddingTop='10px';document.querySelectorAll('#engine .engine-group + .engine-group').forEach(n=>n.style.marginTop='12px');");else await value('('+changes[name].toString()+')()');
  await capture('after');const proposed=await value('('+metrics.toString()+')()');results.push({name,width,before:original,after:proposed,heightDelta:proposed.pageHeight-original.pageHeight,scope:'Isolated DOM preview only; no production files or actual user preferences changed'});
  if(name==='P6'){await value("document.querySelector('#qa-saved-feedback').textContent=''");await capture('settled');}
  if(name==='P9')for(const [i,text]of ['Your Thinker Chess settings.','Control Thinker Chess.','Everything in one place.'].entries()){await value(`document.querySelector('.intro').style.display='block';document.querySelector('.intro').textContent=${JSON.stringify(text)}`);await capture('alternative-'+(i+1));}
 }
 await writeFile(join(output,'report.json'),JSON.stringify(results,null,2));console.log('PASS rendered P1–P9 and E alternatives in isolated DOM; no product proposal applied');
}finally{client?.socket.close();chrome.kill();server.kill();await pause(500);await rm(profile,{recursive:true,force:true,maxRetries:6,retryDelay:200});}
