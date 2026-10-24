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



const assert = (condition, message) => { if (!condition) throw new Error(message); };
let browserPath;
for (const candidate of candidates) { try { await access(candidate); browserPath = candidate; break; } catch {} }
if (!browserPath) throw new Error('Chromium is required');
const backendPort = await port();
const debugPort = await port();
const base = `http://${host}:${backendPort}`;
const profile = await mkdtemp(join(repositoryRoot, '.phase091-browser-'));
const preference = join(profile, 'preference.json');
let backend;
const start = async () => {
  backend = spawn('python', ['tests/phase091_config_fixture.py', String(backendPort), preference], {cwd:repositoryRoot,stdio:['pipe','ignore','inherit'],windowsHide:true});
  await waitAvailable(base + '/config/load');
};
const stop = async () => {
  backend.stdin.write('stop\n'); backend.stdin.end();
  await new Promise(resolve => backend.once('exit', resolve));
};
let browser, cdp;
const evaluate = async expression => {
  const result = await cdp.send('Runtime.evaluate', {expression, returnByValue:true, awaitPromise:true});
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
  return result.result.value;
};
const waitFor = async expression => {
  for (let i=0;i<150;i++) { if (await evaluate(expression)) return; await delay(100); }
  throw new Error('Timed out: '+expression);
};
try {
  await start();
  browser=spawn(browserPath,['--headless=new',`--remote-debugging-port=${debugPort}`,`--user-data-dir=${profile}`,'--no-first-run','about:blank'],{stdio:'ignore',windowsHide:true});
  await waitJson(`http://${host}:${debugPort}/json/version`);
  const target=await(await fetch(`http://${host}:${debugPort}/json/new?${encodeURIComponent(base+'/config')}`,{method:'PUT'})).json();
  cdp=await connect(target.webSocketDebuggerUrl); await cdp.send('Page.enable');
  await waitFor("document.querySelector('#analysis-engine-state')?.textContent==='Ready'");
  assert(await evaluate("!document.getElementById('analysis-engine').disabled"), 'No-tab dropdown disabled');
  const installed=await(await fetch(base+'/config/engines')).json();
  assert(!installed.analysisContextAuthorized && !installed.activeEngineId && installed.engines.every(e=>e.installed), 'No-tab discovery incorrect');
  assert(await evaluate("document.getElementById('connection').textContent==='Local server connected' && document.getElementById('userscript-connection').textContent==='Chess.com: disconnected'"),'Connection dimensions collapsed');
  const report={noChessTab:true, installed:installed.engines.map(e=>e.id), selections:[], preferenceReload:false, preferenceRestart:false, errorRecovery:false, sessionParity:false};
  await evaluate("window.missingRegistryFetch=window.fetch;window.fetch=(url,options)=>String(url)==='/config/engines'?Promise.resolve(new Response('<!doctype html><title>404 Not Found</title>',{status:404,headers:{'Content-Type':'text/html'}})):window.missingRegistryFetch(url,options);document.getElementById('engine-retry').click()");
  await waitFor("document.getElementById('analysis-engine-message').textContent.includes('Restart the local server')");
  await evaluate("window.fetch=window.missingRegistryFetch;document.getElementById('engine-retry').click()");
  await waitFor("document.getElementById('analysis-engine-state').textContent==='Ready'");
  report.missingEndpointRecovery=true;

  for(const engineId of installed.engines.map(e=>e.id)) {
    await evaluate(`(()=>{const s=document.getElementById('analysis-engine');s.focus();s.value=${JSON.stringify(engineId)};s.dispatchEvent(new Event('change',{bubbles:true}));})()`);
    await waitFor(`document.getElementById('analysis-engine-state').textContent==='Ready' && document.getElementById('analysis-engine').value===${JSON.stringify(engineId)}`);
    const state=await(await fetch(base+'/config/engines')).json();
    assert(state.selectedEngineId===engineId && state.activeEngineId===null,'Preference incorrectly initialized execution');
    report.selections.push(engineId);
  }
  await cdp.send('Page.reload');
  await waitFor("document.getElementById('analysis-engine')?.value==='komodo-14.1' && document.getElementById('analysis-engine-state').textContent==='Ready'"); report.preferenceReload=true;
  const fields=['kb-session-duration','kb-session-min-rate','kb-session-max-rate','tc-rating-target','kb-session-start','kb-session-stop','kb-session-export','kb-session-phase','kb-session-ttl','kb-session-observed','kb-session-raw'];
  assert(await evaluate(`${JSON.stringify(fields)}.every(id=>document.getElementById(id))`),'Session parity fields missing');
  assert(await evaluate("document.getElementById('kb-session-phase').textContent==='Unavailable' && document.getElementById('kb-session-start').disabled"),'Disconnected session status false');
  await evaluate("(()=>{for(const [id,value] of [['kb-session-duration','85'],['kb-session-min-rate','72.5'],['kb-session-max-rate','87.25']]){const n=document.getElementById(id);n.value=value;n.dispatchEvent(new Event('input',{bubbles:true}));}document.getElementById('kb-session-max-rate').dispatchEvent(new Event('blur'));})()");
  await waitFor("document.getElementById('save-state').textContent.includes('saved')");
  const config=await(await fetch(base+'/config/load')).json();
  assert(config.sessionDurationMinutes===85&&config.sessionMinimumPercent===72.5&&config.sessionMaximumPercent===87.25&&!config.evalBar,'Session values dropped or Eval Bar enabled');
  await evaluate("(()=>{const n=document.getElementById('kb-session-duration');n.value='';n.dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('[data-mode=max]').click()})()");
  await waitFor("document.querySelector('[data-mode=max]').getAttribute('aria-pressed')==='true'");
  await delay(700);
  assert(await evaluate("document.getElementById('kb-session-duration').value===''") ,'Immediate mode discarded an unrelated invalid session draft');
  await evaluate("(()=>{document.querySelector('[data-mode=random]').click();const n=document.getElementById('minDelay');n.value='0.75';n.dispatchEvent(new Event('input',{bubbles:true}));n.dispatchEvent(new Event('blur'));})()");
  await delay(700);
  assert(await evaluate("document.getElementById('kb-session-duration').value===''") ,'Timing save discarded an unrelated invalid session draft');
  await evaluate("(()=>{const n=document.getElementById('kb-session-duration');n.value='85';n.dispatchEvent(new Event('input',{bubbles:true}));n.dispatchEvent(new Event('blur'));})()");
  await delay(500);
  const projection=await evaluate("({status:ThinkerSessionControl.buildStatusView(null),availability:{start:'BOT_DISABLED',stop:'SESSION_NOT_ACTIVE',export:null},sessionIdentity:null})");
  await fetch(base+'/config/session/bridge',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({clientId:'browser-test-client',projection})});
  await evaluate("document.getElementById('retry').click()");
  await waitFor("document.getElementById('kb-session-phase').textContent==='Idle' && document.getElementById('kb-session-observed').textContent==='0 W | 0 D | 0 L'");
  report.sessionParity=true;
  await evaluate("window.originalFetch=window.fetch;window.fetch=(url,options)=>String(url)==='/config/engines/select'?Promise.reject(new Error('test disconnect')):window.originalFetch(url,options);const s=document.getElementById('analysis-engine');s.value='stockfish-19-1mb';s.dispatchEvent(new Event('change',{bubbles:true}));");
  await waitFor("document.getElementById('analysis-engine-message').textContent.includes('Could not save') && !document.getElementById('engine-retry').hidden");
  assert(await evaluate("document.getElementById('analysis-engine').value==='komodo-14.1'"),'Failed selection replaced saved value');
  await evaluate("window.fetch=window.originalFetch;document.getElementById('engine-retry').click()");
  await waitFor("document.getElementById('analysis-engine-state').textContent==='Ready'"); report.errorRecovery=true;
  await stop();
  await evaluate("document.getElementById('retry').click()");
  await waitFor("document.getElementById('connection').textContent==='Local server offline'");
  await start();
  await evaluate("document.getElementById('retry').click()");
  await waitFor("document.getElementById('analysis-engine-state').textContent==='Ready' && document.getElementById('analysis-engine').value==='komodo-14.1'"); report.preferenceRestart=true;
  const unauthorized=await fetch(base+'/eval-bar/engines/select',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({engineId:'komodo-14.1',context:'analysis'})});
  assert(unauthorized.status===401,'Control authorization expanded');
  console.log(JSON.stringify(report,null,2));
} finally {
  cdp?.socket.close(); browser?.kill();
  if(backend?.exitCode===null) await stop();
  await rm(profile,{recursive:true,force:true,maxRetries:5,retryDelay:100});
}
