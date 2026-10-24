import { spawn } from 'node:child_process';
import { access, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const host = '127.0.0.1';
const repositoryRoot = resolve(import.meta.dirname, '..', '..');
const labRoot = join(repositoryRoot, 'analysis_lab');
const token = 'eval-bar-backend-integration-token';
const candidates = [
  process.env.CHROME_PATH,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
].filter(Boolean);
const delay = milliseconds => new Promise(resolveDelay => setTimeout(resolveDelay, milliseconds));
const port = () => new Promise((resolvePort, reject) => {
  const server = createServer();
  server.once('error', reject);
  server.listen(0, host, () => {
    const address = server.address();
    server.close(error => error ? reject(error) : resolvePort(address.port));
  });
});
const waitAvailable = async url => {
  for (let attempt = 0; attempt < 200; attempt += 1) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(500) });
      if (response.ok) return;
    } catch {}
    await delay(100);
  }
  throw new Error(`timeout waiting for ${url}`);
};
const waitJson = async url => {
  for (let attempt = 0; attempt < 200; attempt += 1) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(500) });
      if (response.ok) return response.json();
    } catch {}
    await delay(100);
  }
  throw new Error(`timeout waiting for ${url}`);
};
const connect = async url => {
  const socket = new WebSocket(url);
  await new Promise((resolveOpen, reject) => {
    socket.addEventListener('open', resolveOpen, { once: true });
    socket.addEventListener('error', reject, { once: true });
  });
  let nextId = 1;
  const pending = new Map();
  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    const request = pending.get(message.id);
    if (!request) return;
    pending.delete(message.id);
    if (message.error) request.reject(new Error(message.error.message));
    else request.resolve(message.result);
  });
  return {
    socket,
    send(method, params = {}) {
      return new Promise((resolveSend, reject) => {
        const id = nextId++;
        pending.set(id, { resolve: resolveSend, reject });
        socket.send(JSON.stringify({ id, method, params }));
      });
    },
  };
};


const output = join(repositoryRoot, '_bmad-output/implementation-artifacts/phase09-engine-selector');
let browserPath;
for (const candidate of candidates) { try { await access(candidate); browserPath = candidate; break; } catch {} }
if (!browserPath) throw new Error('Chromium is required');
const backendPort = await port();
const debugPort = await port();
const backendUrl = `http://${host}:${backendPort}`;
const profile = await mkdtemp(join(tmpdir(), 'thinker-engine-selector-'));
const preference = join(profile, 'preference.json');
const code = `import app, threading, sys; from pathlib import Path; from werkzeug.serving import make_server; app.analysis_engine_registry.preference_path=Path(${JSON.stringify(preference)}); server=make_server('${host}', ${backendPort}, app.app, threaded=True); thread=threading.Thread(target=server.serve_forever); thread.start(); sys.stdin.readline(); server.shutdown(); thread.join(); app.analysis_engine_registry.close(); app.stockfish_eval_bar.close(); app.komodo.close()`;
const backend = spawn('python', ['-c', code], {cwd:repositoryRoot, env:{...process.env,THINKER_CAPABILITY_TOKEN:token}, stdio:['pipe','ignore','inherit'],windowsHide:true});
let browser, cdp, heartbeat;
const auth = {Authorization:`Bearer ${token}`,Origin:'https://www.chess.com'};
const evaluate = async expression => {
 const result=await cdp.send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
 if(result.exceptionDetails)throw new Error(result.exceptionDetails.exception?.description||result.exceptionDetails.text);
 return result.result.value;
};
const waitFor = async expression => {
 for(let i=0;i<250;i++){if(await evaluate(expression))return;await delay(100);}
 throw new Error('Timed out: '+expression);
};
try {
 await waitAvailable(backendUrl+'/health');
 const authorize=()=>fetch(backendUrl+'/eval-bar/engines?context=analysis',{headers:auth});
 await authorize(); heartbeat=setInterval(()=>authorize().catch(()=>{}),2000);
 browser=spawn(browserPath,['--headless=new',`--remote-debugging-port=${debugPort}`,`--user-data-dir=${profile}`,'--no-first-run','about:blank'],{stdio:'ignore',windowsHide:true});
 await waitJson(`http://${host}:${debugPort}/json/version`);
 const target=await(await fetch(`http://${host}:${debugPort}/json/new?${encodeURIComponent(backendUrl+'/config')}`,{method:'PUT'})).json();
 cdp=await connect(target.webSocketDebuggerUrl);await cdp.send('Page.enable');
 await cdp.send('Emulation.setDeviceMetricsOverride',{width:1100,height:1000,deviceScaleFactor:1,mobile:false});
 await waitFor("document.querySelector('#analysis-engine') && !document.querySelector('#analysis-engine').disabled");
 const options=await evaluate("Array.from(document.querySelector('#analysis-engine').options).map(x=>x.textContent)");
 if(options.join('|')!=='Stockfish 19 · 1MB|Stockfish 19 · 94MB|Komodo 14.1')throw new Error('Wrong engine labels '+options);
 const report={options,switches:[],screenshots:[]};
 for(const engineId of ['stockfish-19-1mb','stockfish-19-94mb','komodo-14.1','stockfish-19-1mb']){
  await evaluate(`(()=>{const s=document.querySelector('#analysis-engine');s.value=${JSON.stringify(engineId)};s.dispatchEvent(new Event('change',{bubbles:true}));})()`);
  if(await evaluate("document.querySelector('#analysis-engine-state').textContent")!=='Switching')throw new Error('Missing Switching feedback');
  await waitFor("document.querySelector('#analysis-engine-state').textContent!=='Switching' && !document.querySelector('#analysis-engine').disabled");
  const initialized=await fetch(backendUrl+'/eval-bar/engines/select',{method:'POST',headers:{...auth,'Content-Type':'application/json'},body:JSON.stringify({engineId,context:'analysis',initializeOnly:true})});
  if(!initialized.ok)throw new Error('Authorized runtime initialization failed '+await initialized.text());
  await waitFor("document.querySelector('#analysis-engine-state').textContent==='Active'");
  const state=await(await fetch(backendUrl+'/eval-bar/engines',{headers:auth})).json();
  if(state.activeEngineId!==engineId)throw new Error('Wrong active engine '+engineId+' '+JSON.stringify(state));
  const response=await fetch(backendUrl+'/eval-bar/stream',{method:'POST',headers:{...auth,'Content-Type':'application/json'},body:JSON.stringify({engineId,selectionGeneration:state.selectionGeneration,cacheContext:state.cacheContext,context:'analysis',fen:'7k/5Q2/6K1/8/8/8/8/8 w - - 0 1',requestId:'browser-'+report.switches.length,generation:1})});
  const events=(await response.text()).trim().split('\n').map(JSON.parse);
  if(!events.every(e=>e.engineId===engineId)||events.at(-1).type!=='result'||events.at(-1).mate<1)throw new Error('Invalid real evaluation '+JSON.stringify(events.at(-1)));
  report.switches.push({engineId,depth:events.at(-1).depth,mate:events.at(-1).mate,events:events.length});
  const screenshot=await cdp.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
  const file=engineId+'.png';await writeFile(join(output,file),Buffer.from(screenshot.data,'base64'));report.screenshots.push(file);
 }
 const before=await(await fetch(backendUrl+'/config/load')).json();
 if(before.evalBar!==false)throw new Error('Engine selection enabled Eval Bar');
 await cdp.send('Page.reload');
 await waitFor("document.querySelector('#analysis-engine')?.value==='stockfish-19-1mb' && document.querySelector('#analysis-engine-state')?.textContent==='Active'");
 report.reloadPreference=true;report.evalBarRemainedDisabled=true;
 clearInterval(heartbeat);heartbeat=null;
 await fetch(backendUrl+'/eval-bar/engines?context=active-game',{headers:auth});
 const blocked=await fetch(backendUrl+'/config/engines/select',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({engineId:'komodo-14.1',context:'analysis'})});
 if(blocked.status!==200)throw new Error('Preference configuration incorrectly requires analysis context');
 const rejected=await fetch(backendUrl+'/eval-bar/engines/select',{method:'POST',headers:{...auth,'Content-Type':'application/json'},body:JSON.stringify({engineId:'komodo-14.1',context:'active-game'})});
 if(rejected.status!==403)throw new Error('Unauthorized execution context was accepted');report.unauthorizedBlocked=true;
 await writeFile(join(output,'browser.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
} finally {
 clearInterval(heartbeat);cdp?.socket.close();browser?.kill();backend.stdin.write('stop\n');backend.stdin.end();
 await new Promise(resolveExit=>{backend.once('exit',resolveExit);setTimeout(resolveExit,5000)});
 await rm(profile,{recursive:true,force:true,maxRetries:5,retryDelay:100});
}
