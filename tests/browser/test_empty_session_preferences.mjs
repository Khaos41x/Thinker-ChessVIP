import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {resolve,join} from 'node:path';
import {createServer} from 'node:net';
const root=resolve(import.meta.dirname,'../..');
const before=process.argv.includes('--before');
const configOnly=process.argv.includes('--config-only');
const output=join(root,'_bmad-output/implementation-artifacts/config-controls/migration');
await mkdir(output,{recursive:true});
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const port=()=>new Promise(resolve=>{const s=createServer();s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>resolve(p));});});
const serverPort=await port(),debug=await port(),base=`http://127.0.0.1:${serverPort}`;
const profile=await mkdtemp(join(tmpdir(),'thinker-phase091-capture-'));
const preference=join(profile,'preferences.json');
await writeFile(preference,JSON.stringify({version:1,arrowColorVersion:1,config:{sessionDurationMinutes:120,sessionMinimumPercent:53,sessionMaximumPercent:61,color:'#Ab1234',elo:1800}}));
const launch=()=>spawn('python',['-c',"import importlib.util,sys;spec=importlib.util.spec_from_file_location('visual','tests/phase091_visual_fixture.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);m.app.run(host='127.0.0.1',port=int(sys.argv[1]),threaded=True,use_reloader=False)",String(serverPort),'--preferences',preference],{cwd:root,stdio:'ignore',windowsHide:true});
let backend=launch();
const browser=spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--disable-gpu','--no-first-run','--disable-background-timer-throttling','--disable-renderer-backgrounding',`--remote-debugging-port=${debug}`,`--user-data-dir=${profile}`,'about:blank'],{stdio:'ignore',windowsHide:true});
const clients=[];
async function waitFor(test){for(let i=0;i<180;i++){try{if(await test())return;}catch{}await delay(250);}throw new Error('Timed out');}
async function connect(url){const socket=new WebSocket(url);let id=0;const pending=new Map();const handlers=new Map();socket.addEventListener('message',event=>{const data=JSON.parse(event.data);if(data.method)handlers.get(data.method)?.(data.params);const p=pending.get(data.id);if(p){pending.delete(data.id);data.error?p.reject(new Error(data.error.message)):p.resolve(data.result);}});await new Promise((resolve,reject)=>{socket.addEventListener('open',resolve,{once:true});socket.addEventListener('error',reject,{once:true});});const c={socket,on:(method,handler)=>handlers.set(method,handler),send:(method,params={})=>new Promise((resolve,reject)=>{pending.set(++id,{resolve,reject});socket.send(JSON.stringify({id,method,params}));})};clients.push(c);return c;}
async function tab(url){const t=await(await fetch(`http://127.0.0.1:${debug}/json/new?${encodeURIComponent(url)}`,{method:'PUT'})).json();const c=await connect(t.webSocketDebuggerUrl);await c.send('Page.enable');return c;}
async function value(c,expression){const r=await c.send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw new Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value;}
try{
 await waitFor(async()=> (await fetch(base+'/config/load')).ok);await waitFor(async()=> (await fetch(`http://127.0.0.1:${debug}/json/version`)).ok);
 const panel=await tab('about:blank'),embedded=await tab('about:blank');const pageErrors=[];
 for(const c of [panel,embedded]){await c.send('Runtime.enable');c.on('Runtime.exceptionThrown',e=>pageErrors.push(e.exceptionDetails.text));await c.send('Page.addScriptToEvaluateOnNewDocument',{source:"for(const store of [localStorage,sessionStorage]){if(!store.getItem('qaSessionSeed')){store.setItem('sessionDurationMinutes','120');store.setItem('sessionMinimumPercent','53');store.setItem('sessionMaximumPercent','61');store.setItem('qaPreserve','keep');store.setItem('qaSessionSeed','1')}}"});}
 await panel.send('Page.navigate',{url:base+'/config'});await embedded.send('Page.navigate',{url:base+'/tests/fixtures/userscript_bootstrap.html?delay=50'});
 await waitFor(()=>value(embedded,"Boolean(window.ThinkerRatingTracker && document.querySelector('#sp-on'))"));
 await value(embedded,`window.ThinkerRatingTracker.start({window:new Proxy(window,{get(target,key){if(key==='location')return {hostname:'www.chess.com',href:location.href};const item=Reflect.get(target,key,target);return typeof item==='function'&&!['MutationObserver'].includes(key)?item.bind(target):item;}}),baseUrl:location.origin,gmRequest:window.GM_xmlhttpRequest});void 0`);
 const snapshot=()=>({fields:[...document.querySelectorAll('#kb-session-duration,#kb-session-min-rate,#kb-session-max-rate,#tc-rating-target')].map(n=>({id:n.id,value:n.value,placeholder:n.placeholder})),disabled:document.querySelector('#kb-session-start').disabled,marker:localStorage.getItem('thinker.sessionFields.v1')});
 for(const c of [panel,embedded])await waitFor(()=>value(c,"document.querySelector('#kb-session-duration')?.placeholder==='Not set'&&document.querySelector('#kb-session-duration').value===''&&Boolean(document.querySelector('#tc-rating-target'))"));
 for(const c of [panel,embedded])assert(await value(c,"[localStorage,sessionStorage].every(s=>s.getItem('thinker.sessionFields.v1')==='1'&&s.getItem('sessionDurationMinutes')===null&&s.getItem('sessionMinimumPercent')===null&&s.getItem('sessionMaximumPercent')===null&&s.getItem('qaPreserve')==='keep')"));
 const report={initial:{config:await value(panel,'('+snapshot.toString()+')()'),console:await value(embedded,'('+snapshot.toString()+')()')}};
 for(const state of Object.values(report.initial)){assert(state.fields.length>=3);for(const f of state.fields){assert.equal(f.value,'');assert.equal(f.placeholder,'Not set');}assert(state.disabled);assert.equal(state.marker,'1');}
 let stored=JSON.parse(await readFile(preference,'utf8'));assert.equal(stored.sessionFieldsVersion,1);assert.equal(stored.config.color,'#Ab1234');report.serverMigration={cleared:['sessionDurationMinutes','sessionMinimumPercent','sessionMaximumPercent'],version:stored.sessionFieldsVersion,unrelatedColorPreserved:true};
 await value(panel,"(()=>{const n=document.querySelector('#kb-session-duration');n.value='90';n.dispatchEvent(new Event('input',{bubbles:true}));n.dispatchEvent(new Event('blur'));})()");
 await waitFor(async()=> (await(await fetch(base+'/config/load')).json()).sessionDurationMinutes===90);await waitFor(()=>value(embedded,"document.querySelector('#kb-session-duration').value==='90'"));
 await value(embedded,"(()=>{const n=document.querySelector('#kb-session-duration');n.value='95';n.dispatchEvent(new Event('input',{bubbles:true}));n.blur();})()");
 await waitFor(async()=> (await(await fetch(base+'/config/load')).json()).sessionDurationMinutes===95);await waitFor(()=>value(panel,"document.querySelector('#kb-session-duration').value==='95'"));
 for(const c of [panel,embedded]){await value(c,"localStorage.setItem('sessionDurationMinutes','95')");await c.send('Page.reload',{ignoreCache:true});await waitFor(()=>value(c,"document.querySelector('#kb-session-duration')?.value==='95'"));assert.equal(await value(c,"localStorage.getItem('sessionDurationMinutes')"),'95');}
 await new Promise(resolve=>{backend.once('exit',resolve);backend.kill();});backend=launch();await waitFor(async()=> (await fetch(base+'/config/load')).ok);stored=await(await fetch(base+'/config/load')).json();assert.equal(stored.sessionDurationMinutes,95);assert.equal(stored.sessionMinimumPercent,null);assert.equal(stored.sessionMaximumPercent,null);
 assert.deepEqual(pageErrors,[]);report.pageErrors=pageErrors;report.seededLocalAndSessionStorageClearedOnce=true;
 report.bidirectionalAndReload=true;report.restartPreserved95=true;report.migrationDidNotRepeat=true;
 await writeFile(join(output,'report.json'),JSON.stringify(report,null,2));console.log('PASS real Flask/browser migration once, blank fields both surfaces, safe disabled Start, bidirectional save, reload and Flask restart');
}finally{for(const c of clients)c.socket.close();browser.kill();backend.kill();await delay(500);await rm(profile,{recursive:true,force:true,maxRetries:5,retryDelay:150});}
