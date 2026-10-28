import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {resolve,join} from 'node:path';
import {createServer} from 'node:net';
const root=resolve(import.meta.dirname,'../..'),before=process.argv.includes('--before');
const output=join(root,'_bmad-output/implementation-artifacts/delay-unit-inset',before?'before':'after');await mkdir(output,{recursive:true});
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
const reports=[];
try{
 await waitFor(async()=> (await fetch(base+'/config/load')).ok);await waitFor(async()=> (await fetch(`http://127.0.0.1:${debugPort}/json/list`)).ok);
 const tab=(await(await fetch(`http://127.0.0.1:${debugPort}/json/list`)).json()).find(t=>t.type==='page');client=await connect(tab.webSocketDebuggerUrl);await client.send('Page.enable');await client.send('Runtime.enable');client.on('Runtime.exceptionThrown',e=>exceptions.push(e));
 for(const surface of ['config','console']){
  await client.send('Page.navigate',{url:base+(surface==='config'?'/config':'/tests/fixtures/userscript_bootstrap.html?delay=20')});await waitFor(()=>value(`document.querySelector('${surface==='config'?'#analysis-engine-state':'.tc-analysis-status'}')?.textContent==='Ready'`));
  for(const width of (surface==='config'?[1440,1280,1024,768,390]:[1086,1280,1440,1920,1033,800])){
   await client.send('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:false});await pause(180);
   const r=await value(`(()=>{const units=[...document.querySelectorAll('${surface==='config'?'.delay-fields label > span:last-child':'.kb-engine-timing .kb-delay-unit'}')];const rect=n=>n.getBoundingClientRect().toJSON();return{panels:[...document.querySelectorAll('#panels>.panel,.kb-console-module,#oi-zone2,.kb-console-caption')].map(n=>({id:n.id,cls:n.className,rect:rect(n)})),units:units.map(n=>{const range=document.createRange();range.selectNodeContents(n);const glyph=range.getBoundingClientRect(),field=n.parentElement,input=field.querySelector('input'),s=getComputedStyle(input),c=document.createElement('canvas').getContext('2d');c.font=s.font;return{field:rect(field),unit:rect(n),rightInset:field.getBoundingClientRect().right-glyph.right,textWidth:c.measureText(input.value).width,textSpace:input.clientWidth-parseFloat(s.paddingLeft)-parseFloat(s.paddingRight),color:getComputedStyle(n).color}})}})()`);
   reports.push({surface,width,...r});if(!before){const original=JSON.parse(await readFile(join(output,'../before/report.json'),'utf8')).reports.find(x=>x.surface===surface&&x.width===width);assert.deepEqual(r.panels,original.panels);for(let i=0;i<r.units.length;i++){assert.deepEqual(r.units[i].field,original.units[i].field);assert.equal(r.units[i].color,original.units[i].color);assert(r.units[i].rightInset>=10);assert(r.units[i].textSpace>=r.units[i].textWidth);}}
   if([1440,1086,390].includes(width)){await value(`document.querySelector('${surface==='config'?'#timing-fields':'.kb-engine-timing'}').scrollIntoView({block:'center'})`);await client.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false}).then(r=>writeFile(join(output,`${surface}-${width}.png`),Buffer.from(r.data,'base64')));await value('scrollTo(0,0)');}
  }
 }
 assert.deepEqual(exceptions,[]);await writeFile(join(output,'report.json'),JSON.stringify({reports,exceptions},null,2));console.log('PASS delay suffix inset/number fit, original field/panel geometry and color:11 viewport cases');
}finally{client?.socket.close();chrome.kill();server.kill();await pause(500);await rm(profile,{recursive:true,force:true,maxRetries:6,retryDelay:200});}
