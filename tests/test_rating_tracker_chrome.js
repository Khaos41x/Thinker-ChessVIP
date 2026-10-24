const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawn } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const output = path.join(root, '_bmad-output/implementation-artifacts/rating-goal-tracker/browser');
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
function connect(url) {
  const socket = new WebSocket(url); let id = 0; const pending = new Map(); const handlers = new Map();
  socket.addEventListener('message', event => { const message = JSON.parse(event.data); if (message.id) { const pair = pending.get(message.id); if (pair) { pending.delete(message.id); message.error ? pair[1](Error(message.error.message)) : pair[0](message.result); } } else handlers.get(message.method)?.(message.params); });
  return { ready: new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); }),
    send(method, params = {}) { return new Promise((resolve, reject) => { const key = ++id; const timeout = setTimeout(() => { pending.delete(key); reject(Error(`CDP timeout: ${method}`)); }, 20000); pending.set(key, [value => { clearTimeout(timeout); resolve(value); }, error => { clearTimeout(timeout); reject(error); }]); socket.send(JSON.stringify({ id: key, method, params })); }); }, on(method, handler) { handlers.set(method, handler); }, close() { socket.close(); } };
}
async function evaluate(client, expression) {
  let result;
  try { result = await client.send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }); }
  catch (error) { error.message += ` (${expression.slice(0, 140)})`; throw error; }
  assert(!result.exceptionDetails, JSON.stringify(result.exceptionDetails)); return result.result.value;
}
async function waitFor(test, timeout = 18000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) { try { const value = await test(); if (value) return value; } catch (_) {} await sleep(100); }
  throw Error('Timed out waiting for Rating Tracker browser state');
}
(async () => {
  const port = 24400 + process.pid % 500; const debug = port + 1000; const base = `http://127.0.0.1:${port}`;
  const server = spawn('python', ['tests/rating_tracker_fixture.py', String(port)], { cwd: root, stdio: 'ignore' });
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'thinker-rating-chrome-'));
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', `--remote-debugging-port=${debug}`, `--user-data-dir=${profile}`, 'about:blank'], { stdio: 'ignore' });
  const clients = []; const report = { fixture: 'Real Flask + temporary SQLite + deterministic public provider + actual built userscript; not authenticated Chess.com', screenshots: [], checks: [] };
  fs.mkdirSync(output, { recursive: true });
  async function tab(url) {
    const target = await fetch(`http://127.0.0.1:${debug}/json/new?${encodeURIComponent(url)}`, { method: 'PUT' }).then(response => response.json());
    const client = connect(target.webSocketDebuggerUrl); await client.ready; await client.send('Page.enable'); clients.push(client); return client;
  }
  try {
    await waitFor(async () => (await fetch(base + '/tests/state')).ok);
    await waitFor(async () => (await fetch(`http://127.0.0.1:${debug}/json/list`)).ok);
    console.log('Rating Tracker browser: fixture and Chromium ready');
    const panel = await tab(base + '/config');
    await waitFor(() => evaluate(panel, `document.getElementById('tc-rating-target')!==null`));
    const second = await tab(base + '/config');
    await waitFor(() => evaluate(second, `document.getElementById('tc-rating-target')!==null`));
    async function enter(client, value, blur = false) {
      await client.send('Page.bringToFront');
      await evaluate(client, `(()=>{const i=document.getElementById('tc-rating-target');i.focus();i.value=${JSON.stringify(value)};i.dispatchEvent(new Event('input',{bubbles:true}));${blur ? 'i.blur()' : "i.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}))"};})()`);
    }
    await enter(panel, '2200');
    await waitFor(() => evaluate(second, `document.getElementById('tc-rating-target').value==='2200'`));
    report.checks.push('One field in both External Config tabs; Enter persists and synchronizes');
    const board = await tab('about:blank');
    board.on('Inspector.targetCrashed', event => console.error('Renderer crashed', event));
    board.on('Page.javascriptDialogOpening', () => { void board.send('Page.handleJavaScriptDialog', { accept: false }); });
    await board.send('Runtime.enable');
    board.on('Runtime.exceptionThrown', event => console.error('Browser exception:', event.exceptionDetails.text, event.exceptionDetails.exception?.description));
    const html = await fetch(base + '/tests/browser-fixture').then(r => r.text());
    await board.send('Fetch.enable', { patterns: [{ urlPattern: 'https://www.chess.com/*' }] });
    board.on('Fetch.requestPaused', data => { void board.send('Fetch.fulfillRequest', { requestId: data.requestId, responseCode: 200, responseHeaders: [{ name: 'Content-Type', value: 'text/html; charset=utf-8' }], body: Buffer.from(html).toString('base64') }); });
    await board.send('Page.navigate', { url: 'https://www.chess.com/game/live/9001' });
    console.log('Rating Tracker browser: synthetic Chess.com origin ready');
    await waitFor(() => evaluate(board, `document.readyState==='complete' && document.getElementById('own-rating') && typeof GM_xmlhttpRequest==='function'`));
    await board.send('Runtime.addBinding', { name: 'trackerGMBridge' });
    const requests = new Map();
    board.on('Runtime.bindingCalled', data => {
      if (data.name !== 'trackerGMBridge') return;
      const item = JSON.parse(data.payload);
      if (item.abort) { requests.get(item.id)?.abort(); requests.delete(item.id); return; }
      const controller = new AbortController(); requests.set(item.id, controller);
      void fetch(base + item.path, { method: item.method, headers: item.headers, body: item.body, signal: controller.signal }).then(async response => {
        const payload = { status: response.status, responseText: await response.text() };
        await evaluate(board, `window.gmReplies?.[${JSON.stringify(item.id)}]?.onload?.(${JSON.stringify(payload)});delete window.gmReplies?.[${JSON.stringify(item.id)}]`);
      }).catch(async () => { try { await evaluate(board, `window.gmReplies?.[${JSON.stringify(item.id)}]?.onerror?.({status:0});delete window.gmReplies?.[${JSON.stringify(item.id)}]`); } catch (_) {} }).finally(() => requests.delete(item.id));
    });
    await evaluate(board, `window.gmReplies={};window.GM_xmlhttpRequest=options=>{const id=crypto.randomUUID();const url=new URL(options.url);if(!/^\\/(rating-|config\\/)/.test(url.pathname)){if(['/getmove','/move-plan','/queue','/resign'].includes(url.pathname))effects.push(url.pathname);setTimeout(()=>options.onerror?.({status:401}),0);return{abort(){}};}gmReplies[id]=options;trackerGMBridge(JSON.stringify({id,path:url.pathname+url.search,method:options.method||'GET',headers:options.headers,body:options.data}));return{abort(){trackerGMBridge(JSON.stringify({id,abort:true}));delete gmReplies[id];options.onabort?.();}};}`);
    await evaluate(board, `window.longTasks=[];new PerformanceObserver(list=>longTasks.push(...list.getEntries().map(x=>x.duration))).observe({type:'longtask',buffered:true});window.trackerStart=performance.now()`);
    await evaluate(board, fs.readFileSync(path.join(root, 'script.js'), 'utf8') + '\n;void 0');
    console.log('Rating Tracker browser: actual userscript evaluated');
    await waitFor(() => evaluate(board, `document.getElementById('krypbot-container')!==null`));
    console.log('Rating Tracker browser: existing console mounted');
    await waitFor(() => evaluate(board, `window.__thinkerRatingTracker?.diagnostics().state==='connected'`));
    report.startupMs = await evaluate(board, `performance.now()-trackerStart`);
    report.initialDiagnostics = await evaluate(board, `window.__thinkerRatingTracker.diagnostics()`);
    await waitFor(() => evaluate(board, `document.querySelectorAll('#krypbot-container .tc-rating-target').length===1`));
    await waitFor(() => evaluate(board, `document.getElementById('tc-rating-target').value==='2200'`));
    assert.equal(await evaluate(panel, `document.getElementById('rating-tracker')`), null);
    assert.equal(await evaluate(board, `document.querySelector('.tc-rating-goal')`), null);
    await enter(board, '2300', true);
    await waitFor(() => evaluate(panel, `document.getElementById('tc-rating-target').value==='2300'`));
    await waitFor(() => evaluate(second, `document.getElementById('tc-rating-target').value==='2300'`));
    report.checks.push('Actual built userscript field visible by default and synchronized both ways through GM transport');
    await board.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1100, deviceScaleFactor: 1, mobile: false });
    await evaluate(board, `document.getElementById('tc-rating-target').blur();document.getElementById('tc-rating-target').scrollIntoView({block:'center'})`);
    const boardImage = await board.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
    fs.writeFileSync(path.join(output, 'rating-field-chess-console.png'), Buffer.from(boardImage.data, 'base64'));
    await board.send('Page.reload');
    await waitFor(() => evaluate(board, `document.readyState==='complete' && document.getElementById('own-rating')`));
    const configTarget = await fetch(base + '/rating-goals/target').then(r=>r.json());
    assert.equal(configTarget.target, 2300);
    await enter(panel, 'bad');
    assert.equal(await evaluate(panel, `document.getElementById('tc-rating-target').getAttribute('aria-invalid')`), 'true');
    assert.equal((await fetch(base + '/rating-goals/target').then(r=>r.json())).target,2300);
    await enter(panel, '2100', true);
    await waitFor(() => evaluate(second, `document.getElementById('tc-rating-target').value==='2100'`));
    await panel.send('Page.reload');
    await waitFor(() => evaluate(panel, `document.getElementById('tc-rating-target')?.value==='2100'`));
    await enter(panel, '');
    await waitFor(() => evaluate(second, `document.getElementById('tc-rating-target').value===''`));
    await enter(panel, '2200');
    await waitFor(() => evaluate(second, `document.getElementById('tc-rating-target').value==='2200'`));
    report.checks.push('Invalid values rejected, blur commits, refresh restores, blank clears');
    for (const width of [390,800,1033,1034,1280,1440]) {
      await panel.send('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:false});
      await sleep(100);
      const dimensions=await evaluate(panel,`({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,field:document.getElementById('tc-rating-target').getBoundingClientRect().toJSON()})`);
      assert(dimensions.scrollWidth<=width);
      const image=await panel.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});
      const filename=path.join(output,`rating-field-${width}.png`);fs.writeFileSync(filename,Buffer.from(image.data,'base64'));report.screenshots.push({width,path:filename,dimensions});
    }
    await panel.send('Network.enable');
    await panel.send('Network.emulateNetworkConditions',{offline:true,latency:0,downloadThroughput:-1,uploadThroughput:-1});
    await enter(panel,'2400');
    await waitFor(()=>evaluate(panel,`document.getElementById('tc-rating-target').title.includes('Not saved')`));
    await sleep(2200);
    assert.equal(await evaluate(panel,`document.getElementById('tc-rating-target').value`),'2400');
    await panel.send('Network.emulateNetworkConditions',{offline:false,latency:0,downloadThroughput:-1,uploadThroughput:-1});
    await enter(panel,'2400');
    await waitFor(()=>evaluate(second,`document.getElementById('tc-rating-target').value==='2400'`));
    report.checks.push('Offline draft preserved; explicit retry saves after recovery; no dashboard or extra controls');
    const state=await fetch(base+'/tests/state').then(r=>r.json());assert.deepEqual(state.effects,[]);
    fs.writeFileSync(path.join(output,'single-field-report.json'),JSON.stringify(report,null,2));
    console.log(JSON.stringify(report,null,2));
  } finally { clients.forEach(client=>client.close());chrome.kill();server.kill(); }
})().catch(error=>{console.error(error);process.exitCode=1;});
