import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {resolve,join} from 'node:path';
import {createServer} from 'node:net';
const root=resolve(import.meta.dirname,'../..'),before=process.argv.includes('--before');
const output=join(root,'_bmad-output/implementation-artifacts/responsive-display','scenes');await mkdir(output,{recursive:true});
const pause=ms=>new Promise(r=>setTimeout(r,ms));
const port=()=>new Promise(r=>{const s=createServer();s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>r(p));});});
const serverPort=await port(),debugPort=await port(),base=`http://127.0.0.1:${serverPort}`;
const profile=await mkdtemp(join(tmpdir(),'thinker-config-entry-'));
const preference=join(profile,'preferences.json');
const server=spawn('python',['tests/responsive_fixture.py',String(serverPort),'--preferences',preference],{cwd:root,stdio:'ignore',windowsHide:true});
await mkdir(join(profile,'Default'),{recursive:true});const level=Math.log(1)/Math.log(1.2);await writeFile(join(profile,'Default','Preferences'),JSON.stringify({partition:{default_zoom_level:{'':level,x:level}},profile:{default_zoom_level:level}}));
const chrome=spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--disable-gpu','--no-first-run','--disable-background-timer-throttling',`--remote-debugging-port=${debugPort}`,`--user-data-dir=${profile}`,'about:blank'],{stdio:'ignore',windowsHide:true});
let client;const messages=[],exceptions=[],network=[];
async function waitFor(test){for(let i=0;i<240;i++){try{if(await test())return;}catch{}await pause(100);}throw Error('Timeout');}
async function connect(url){const socket=new WebSocket(url),pending=new Map(),handlers=new Map();let id=0;socket.addEventListener('message',e=>{const m=JSON.parse(e.data);handlers.get(m.method)?.(m.params);const p=pending.get(m.id);if(p){pending.delete(m.id);m.error?p.reject(Error(m.error.message)):p.resolve(m.result);}});await new Promise(r=>socket.addEventListener('open',r,{once:true}));return{socket,on:(m,f)=>handlers.set(m,f),send:(method,params={})=>new Promise((resolve,reject)=>{pending.set(++id,{resolve,reject});socket.send(JSON.stringify({id,method,params}));})};}
async function value(expression){const r=await client.send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value;}
const reports=[];
try{
 await waitFor(async()=> (await fetch(base+'/config/load')).ok);await waitFor(async()=> (await fetch(`http://127.0.0.1:${debugPort}/json/list`)).ok);const tab=(await(await fetch(`http://127.0.0.1:${debugPort}/json/list`)).json()).find(t=>t.type==='page');client=await connect(tab.webSocketDebuggerUrl);await client.send('Page.enable');await client.send('Runtime.enable');const errors=[];client.on('Runtime.exceptionThrown',e=>errors.push(e));const windowId=(await client.send('Browser.getWindowForTarget',{targetId:tab.id})).windowId;
 const old=execFileSync('git',['show','6979de2:script.js'],{cwd:root,maxBuffer:2000000}).toString('base64');let baseline=true;await client.send('Fetch.enable',{patterns:[{urlPattern:'*/script.js*'}]});client.on('Fetch.requestPaused',e=>client.send(baseline?'Fetch.fulfillRequest':'Fetch.continueRequest',{requestId:e.requestId,...(baseline?{responseCode:200,responseHeaders:[{name:'Content-Type',value:'application/javascript'}],body:old}:{})}).catch(()=>{}));
 const shot=async name=>{const r=await client.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});await writeFile(join(output,name+'.png'),Buffer.from(r.data,'base64'));};
 const resize=async(w,h)=>{await client.send('Browser.setWindowBounds',{windowId,bounds:{width:w+16,height:h+95}});await pause(200);};
 for(const phase of ['before','after']){
  baseline=phase==='before';await resize(1440,900);await client.send('Page.navigate',{url:base+'/responsive?delay=20'});await waitFor(()=>value("document.querySelector('.tc-analysis-status')?.textContent==='Ready'"));await value("document.querySelector('#board-layout-player-top .user-username-component').textContent='GMTestTC01'");await waitFor(()=>value("document.querySelectorAll('.tc-scout-opening-row').length>0"));await pause(250);
  await value('scrollTo(0,0)');await shot(phase+'-banner-1440');await value("document.querySelector('#oi-wrapper').scrollIntoView({block:'start'})");await shot(phase+'-console-1440-populated');
  const first=await value("({width:document.querySelector('#oi-wrapper').getBoundingClientRect().width,left:document.querySelector('#oi-wrapper').getBoundingClientRect().left+scrollX,top:document.querySelector('#oi-wrapper').getBoundingClientRect().top+scrollY})");
  for(let cycle=0;cycle<3;cycle++){for(const [w,h]of [[780,520],[1086,720],[1440,900]])await resize(w,h);}
  const last=await value("({width:document.querySelector('#oi-wrapper').getBoundingClientRect().width,left:document.querySelector('#oi-wrapper').getBoundingClientRect().left+scrollX,top:document.querySelector('#oi-wrapper').getBoundingClientRect().top+scrollY})");assert.deepEqual(last,first);
  const widths=[];for(const width of [1086,1440,780,320]){await resize(width,720);await value('scrollTo(0,0)');const r=await value(`(()=>{const hud=document.querySelector('.tc-hud-stats'),scout=document.querySelector('#oi-zone2'),rect=n=>n?.getBoundingClientRect().toJSON();return{width:innerWidth,pageOverflow:document.documentElement.scrollWidth>innerWidth+1,hud:rect(hud),board:rect(document.querySelector('wc-chess-board')),scout:rect(scout),scoutOverflow:scout.scrollWidth>scout.clientWidth+1,openings:document.querySelectorAll('.tc-scout-opening-row').length,engine:document.querySelector('#tc-analysis-engine').value}})()`);widths.push(r);if(phase==='after'){assert.equal(r.pageOverflow,false);assert.equal(r.scoutOverflow,false);assert.equal(r.openings,4);}
   await value("document.querySelector('#oi-wrapper').scrollIntoView({block:'start'})");if([1086,780,320].includes(width))await shot(`${phase}-console-${r.width}-populated`);
  }
  await resize(1440,900);await value("scrollTo(0,0);document.body.style.position='relative';document.body.style.marginLeft='30px'");await pause(250);
  await value("for(const id of ['bn-off','bn-on']){const n=document.getElementById(id);n.checked=true;n.dispatchEvent(new Event('change',{bubbles:true}));}");
  const positioned=await value("(()=>{const w=document.querySelector('#oi-wrapper').getBoundingClientRect(),b=document.querySelector('#thinker-chess-banner').getBoundingClientRect(),s=document.querySelector('.play-controller-component:not(.stale-controller)').getBoundingClientRect();return{workspaceLeft:w.left,expectedLeft:(document.documentElement.clientWidth-w.width)/2,bannerLeft:b.left,expectedBannerLeft:s.right+15}})()");if(phase==='after'){assert(Math.abs(positioned.workspaceLeft-positioned.expectedLeft)<=1);assert(Math.abs(positioned.bannerLeft-positioned.expectedBannerLeft)<=1);}await value("document.body.style.position='';document.body.style.marginLeft=''");
  reports.push({phase,first,last,widths,positioned});
 }
 assert.deepEqual(errors,[]);await writeFile(join(output,'report.json'),JSON.stringify({scope:'Synthetic host and public game archive fixtures; actual source renderer; no real game/session manipulated',reports,errors},null,2));console.log('PASS populated Scout/recent form scenes, four widths,9 resize transitions per phase, no accumulated position drift');
}finally{client?.socket.close();chrome.kill();server.kill();await pause(500);await rm(profile,{recursive:true,force:true,maxRetries:6,retryDelay:200});}