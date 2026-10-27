import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {resolve,join} from 'node:path';
import {createServer} from 'node:net';
const root=resolve(import.meta.dirname,'../..'),before=false;
const output=join(root,'_bmad-output/implementation-artifacts/config-entry','quiet');await mkdir(output,{recursive:true});
const pause=ms=>new Promise(r=>setTimeout(r,ms));
const port=()=>new Promise(r=>{const s=createServer();s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>r(p));});});
const serverPort=await port(),debugPort=await port(),base=`http://127.0.0.1:${serverPort}`;
const profile=await mkdtemp(join(tmpdir(),'thinker-config-entry-'));
const server=spawn('python',['tests/config_entry_fixture.py',String(serverPort),...(before?['--baseline']:[])],{cwd:root,stdio:'ignore',windowsHide:true});
const chrome=spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--disable-gpu','--no-first-run','--disable-background-timer-throttling',`--remote-debugging-port=${debugPort}`,`--user-data-dir=${profile}`,'about:blank'],{stdio:'ignore',windowsHide:true});
let client;const messages=[],exceptions=[],network=[],browserMessages=[];
async function waitFor(test){for(let i=0;i<240;i++){try{if(await test())return;}catch{}await pause(100);}throw Error('Timeout');}
async function connect(url){const socket=new WebSocket(url),pending=new Map(),handlers=new Map();let id=0;socket.addEventListener('message',e=>{const m=JSON.parse(e.data);handlers.get(m.method)?.(m.params);const p=pending.get(m.id);if(p){pending.delete(m.id);m.error?p.reject(Error(m.error.message)):p.resolve(m.result);}});await new Promise(r=>socket.addEventListener('open',r,{once:true}));return{socket,on:(m,f)=>handlers.set(m,f),send:(method,params={})=>new Promise((resolve,reject)=>{pending.set(++id,{resolve,reject});socket.send(JSON.stringify({id,method,params}));})};}
async function value(expression){const r=await client.send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value;}
let running=server;const requests=[],states=[];
try{
 await waitFor(async()=> (await fetch(base+'/config/load')).ok);await waitFor(async()=> (await fetch(`http://127.0.0.1:${debugPort}/json/list`)).ok);
 const tab=(await(await fetch(`http://127.0.0.1:${debugPort}/json/list`)).json()).find(t=>t.type==='page');client=await connect(tab.webSocketDebuggerUrl);
 client.on('Log.entryAdded',event=>browserMessages.push(event.entry));client.on('Runtime.consoleAPICalled',m=>messages.push(m));client.on('Runtime.exceptionThrown',m=>exceptions.push(m));client.on('Network.loadingFailed',m=>network.push(m));
 client.on('Runtime.bindingCalled',event=>{if(event.name!=='__quietGM')return;const r=JSON.parse(event.payload);const record={path:r.path,method:r.method};requests.push(record);(async()=>{let result;try{const response=await fetch(base+r.path,{method:r.method,headers:r.headers,body:r.body,signal:AbortSignal.timeout(3000)});result={status:response.status,responseText:await response.text()};}catch{result={error:true};}record.status=result.status;record.failed=Boolean(result.error);await value(`window.__quietReply?.(${r.id},${JSON.stringify(result)})`);})().catch(()=>{});});
 await client.send('Log.enable');await client.send('Runtime.enable');await client.send('Page.enable');await client.send('Network.enable');await client.send('Runtime.addBinding',{name:'__quietGM'});
 await client.send('Page.navigate',{url:base+'/tests/fixtures/userscript_bootstrap.html?delay=50&quiet=1&noScript=1'});await pause(1200);assert.equal(await value('Boolean(document.querySelector("#krypbot-container"))'),false);states.push({state:'without-userscript',messages:messages.length,exceptions:exceptions.length});
 await client.send('Page.navigate',{url:base+'/tests/fixtures/userscript_bootstrap.html?delay=50&quiet=1'});await waitFor(()=>value("document.querySelector('.tc-analysis-status')?.textContent==='Ready'"));states.push({state:'ready',messages:messages.length});
 for(const id of ['#st-on','#st-off','#sp-on','#sp-off']){await value(`document.querySelector(${JSON.stringify(id)}).closest(".kb-radio-group").click()`);await pause(150);assert.equal(await value(`document.querySelector(${JSON.stringify(id)}).checked`),true);states.push({state:id,messages:messages.length});}
 await value("{const n=document.querySelector('#kb-color-picker');n.value='#e879f9';n.dispatchEvent(new Event('input',{bubbles:true}));}");await pause(250);states.push({state:'arrow-color',messages:messages.length});
 running.kill();await new Promise(r=>running.once('exit',r));await waitFor(()=>value("document.querySelector('.tc-analysis-status')?.textContent==='Error'"));
 await pause(6000);const count=()=>requests.filter(r=>r.path==='/config/load'||r.path.startsWith('/eval-bar/engines')).length,n=count();await pause(6000);assert.equal(count(),n,'Config/engine polling continued while connection was lost');states.push({state:'server-off/error',messages:messages.length,pollRequests:n,paused:true});
 const shot=await client.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});await writeFile(join(output,'error.png'),Buffer.from(shot.data,'base64'));
 running=spawn('python',['tests/config_entry_fixture.py',String(serverPort)],{cwd:root,stdio:'ignore',windowsHide:true});await waitFor(async()=> (await fetch(base+'/config/load')).ok);
 await value("document.querySelector('.tc-analysis-selector button').click()");await waitFor(()=>value("document.querySelector('.tc-analysis-status')?.textContent==='Ready'"));states.push({state:'retry/reconnected',messages:messages.length});
 await client.send('Page.reload');await waitFor(()=>value("document.querySelector('.tc-analysis-status')?.textContent==='Ready'"));states.push({state:'reload',messages:messages.length});
 assert.equal(browserMessages.filter(m=>/script\.js|Thinker|KrypBot/.test(m.url||m.text||'')).length,0);assert.deepEqual(messages,[],'Userscript emitted console messages in isolated host');assert.deepEqual(exceptions,[]);assert.deepEqual(network,[],'GM-style out-of-page transport leaked page network errors');
 await writeFile(join(output,'console-report.json'),JSON.stringify({passed:true,states,messages,browserMessages,exceptions,network,requests,thirdPartyMessages:browserMessages,scope:'Isolated Chromium; real Flask stopped/restarted; GM transport faithfully relayed outside page via CDP binding; no authenticated Tampermonkey or third-party ads loaded'},null,2));
 console.log('PASS quiet console: ready/offline/error/retry/reload, control actions, no messages/exceptions/page network errors; config/registry polls pause');
}catch(error){await writeFile(join(output,'failure.json'),JSON.stringify({error:String(error),states,requests,messages,exceptions,snapshot:client?await value('({state:document.querySelector(".tc-analysis-status")?.textContent,message:document.querySelector("#tc-analysis-message")?.textContent,pending:window.__quietReplies?.size,body:document.body.innerText.slice(-800)})').catch(()=>null):null},null,2));throw error;}finally{client?.socket.close();chrome.kill();running.kill();await pause(500);await rm(profile,{recursive:true,force:true,maxRetries:6,retryDelay:200});}
