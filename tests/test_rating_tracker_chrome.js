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
    await waitFor(() => evaluate(panel, `document.querySelector('#rt-goals')?.textContent.includes('No rating goals')`));
    await evaluate(panel, `document.getElementById('rt-create').open=true;document.getElementById('rt-username').value='tracker_user';document.getElementById('rt-threshold').value='1910';document.getElementById('rt-form').requestSubmit()`);
    await waitFor(async () => { const state = await fetch(base + '/tests/state').then(r => r.json()); return state.snapshot.goals[0]?.view?.confirmed?.rating === 1900; });
    await waitFor(() => evaluate(panel, `document.querySelector('.rt-numbers')?.textContent.includes('1,900')`));
    report.checks.push('Create goal and confirmed public baseline rendered');
    console.log('Rating Tracker browser: confirmed baseline');
    const second = await tab(base + '/config');
    await waitFor(() => evaluate(second, `document.querySelector('.rt-numbers')?.textContent.includes('1,900')`));
    await evaluate(panel, `document.querySelector('.rt-goal details').open=true;[...document.querySelectorAll('.rt-goal button')].find(x=>x.textContent==='Pause').click()`);
    await waitFor(() => evaluate(second, `document.querySelector('.rt-state')?.textContent==='Paused'`));
    await evaluate(second, `document.querySelector('.rt-goal details').open=true;[...document.querySelectorAll('.rt-goal button')].find(x=>x.textContent==='Resume').click()`);
    await waitFor(() => evaluate(panel, `document.querySelector('.rt-state')?.textContent==='Tracking'`));
    report.checks.push('Pause/resume synchronized across two browser tabs');
    console.log('Rating Tracker browser: cross-tab settings passed');
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
    await evaluate(panel, `document.getElementById('rt-page-visible').click()`);
    await waitFor(async () => (await fetch(base + '/tests/state').then(r => r.json())).snapshot.preferences.onPageVisible === true);
    console.log('Rating Tracker browser: visibility preference confirmed');
    await evaluate(board, `void window.__thinkerRatingTracker.refresh()`);
    console.log('Rating Tracker browser: refresh dispatched');
    try { await waitFor(() => evaluate(board, `document.querySelector('.tc-rating-goal')!==null`), 20000); }
    catch (error) { console.error(await evaluate(board, `window.__thinkerRatingTracker.diagnostics()`)); throw error; }
    console.log('Rating Tracker browser: optional card mounted');
    const before = await evaluate(board, `window.__thinkerRatingTracker.diagnostics().observationCount`);
    await evaluate(board, `(()=>{const n=document.createElement('div');n.className='thinker-eval-v2-overlay';document.body.append(n);for(let i=0;i<100;i++)n.style.transform='scaleY('+i/100+')';})()`);
    await sleep(250);
    const after = await evaluate(board, `window.__thinkerRatingTracker.diagnostics().observationCount`);
    assert(after - before <= 1, 'Own visual mutations must not trigger observation storms');
    report.ownMutationObservationDelta = after - before;
    await evaluate(board, `document.documentElement.classList.add('tc-clean-view')`);
    await waitFor(() => evaluate(board, `document.querySelector('.tc-rating-goal')===null`));
    await evaluate(board, `document.documentElement.classList.remove('tc-clean-view')`);
    await waitFor(() => evaluate(board, `document.querySelector('.tc-rating-goal')!==null`));
    report.checks.push('Built userscript, GM JSON transport, optional card and Clean View');
    await fetch(base + '/tests/advance', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rating: 1920 }) });
    await waitFor(async () => { const data = await fetch(base + '/tests/state').then(r => r.json()); return data.snapshot.goals[0]?.state === 'reached'; });
    await waitFor(() => evaluate(panel, `document.querySelector('.rt-state')?.textContent==='Goal Reached'`));
    await evaluate(panel, `document.querySelector('.rt-goal details').open=true;[...document.querySelectorAll('.rt-goal button')].find(x=>x.textContent==='View History').click()`);
    await waitFor(() => evaluate(panel, `document.querySelector('.rt-history')?.textContent.includes('20')`));
    await evaluate(panel, `document.getElementById('rt-inbox').open=true`);
    await waitFor(() => evaluate(panel, `document.querySelector('.rt-notification button')!==null`));
    await evaluate(panel, `document.querySelector('.rt-notification button').click()`);
    await waitFor(async () => { const data = await fetch(base + '/tests/state').then(r => r.json()); return data.snapshot.notifications.some(n => n.acknowledged); });
    report.checks.push('Real domain reached notification, durable claim/ack and measured history rendered');
    for (const width of [390, 800, 1033, 1034, 1035, 1280, 1440]) {
      await panel.send('Emulation.setDeviceMetricsOverride', { width, height: 1000, deviceScaleFactor: 1, mobile: false });
      await sleep(100);
      const dimensions = await evaluate(panel, `({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,tracker:document.getElementById('rating-tracker').getBoundingClientRect().toJSON(),english:document.documentElement.lang})`);
      assert(dimensions.scrollWidth <= width, `Horizontal overflow at ${width}`); assert.equal(dimensions.english, 'en-US');
      const image = await panel.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
      const filename = path.join(output, `rating-tracker-${width}.png`); fs.writeFileSync(filename, Buffer.from(image.data, 'base64')); report.screenshots.push({ width, path: filename, dimensions });
    }
    await evaluate(panel, `document.getElementById('rt-create').open=true;document.getElementById('rt-username').focus()`);
    await panel.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
    await panel.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
    assert.equal(await evaluate(panel, `document.activeElement.id`), 'rt-mode');
    const finalState = await fetch(base + '/tests/state').then(r => r.json());
    assert.deepEqual(finalState.effects, []); assert.deepEqual(await evaluate(board, `window.effects`), []);
    report.checks.push('Keyboard navigation; 390/800/1033/1034/1035/1280/1440 no overflow; no gameplay effects');
    report.longTasksMs = await evaluate(board, `window.longTasks`);
    report.finalDiagnostics = await evaluate(board, `window.__thinkerRatingTracker.diagnostics()`);
    panel.on('Page.javascriptDialogOpening', () => { void panel.send('Page.handleJavaScriptDialog', { accept: true }); });
    await evaluate(panel, `document.querySelector('.rt-goal details').open=true;[...document.querySelectorAll('.rt-goal button')].find(x=>x.textContent==='Archive').click()`);
    await waitFor(() => evaluate(panel, `document.querySelector('.rt-state')?.textContent==='Archived'`));
    await evaluate(panel, `document.querySelector('.rt-goal details').open=true;[...document.querySelectorAll('.rt-goal button')].find(x=>x.textContent==='Delete Goal').click()`);
    await waitFor(async () => (await fetch(base + '/tests/state').then(r => r.json())).snapshot.goals.length === 0);
    await evaluate(panel, `document.getElementById('rt-create').open=true;document.getElementById('rt-mode').value='rapid';document.getElementById('rt-direction').value='at-most';document.getElementById('rt-threshold').value='1900';document.getElementById('rt-form').requestSubmit()`);
    await waitFor(async () => (await fetch(base + '/tests/state').then(r => r.json())).snapshot.goals[0]?.baselineRating === 1920);
    await fetch(base + '/tests/advance', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rating: 1880 }) });
    await waitFor(() => evaluate(panel, `document.querySelector('.rt-state')?.textContent==='Threshold Reached'`));
    report.checks.push('Downward Rapid threshold crosses passively, independently of Blitz history');
    await waitFor(() => evaluate(panel, `document.querySelector('#rt-accounts button')!==null`));
    await evaluate(panel, `document.getElementById('rt-accounts').closest('details').open=true;document.querySelector('#rt-accounts button').click()`);
    await waitFor(async () => (await fetch(base + '/tests/state').then(r => r.json())).snapshot.accounts.length === 0);
    report.checks.push('Archive, confirmed deletion of goal and account data through the UI');
    fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report, null, 2));
  } finally { clients.forEach(client => client.close()); chrome.kill(); server.kill(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
