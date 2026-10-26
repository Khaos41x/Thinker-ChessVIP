const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawn } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

function connect(url) {
  const socket = new WebSocket(url);
  const pending = new Map();
  let id = 0;
  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (!pending.has(message.id)) return;
    const [resolve, reject] = pending.get(message.id);
    pending.delete(message.id);
    message.error ? reject(new Error(message.error.message)) : resolve(message.result);
  });
  return {
    ready: new Promise((resolve, reject) => {
      socket.addEventListener('open', resolve, { once: true });
      socket.addEventListener('error', reject, { once: true });
    }),
    send(method, params = {}) {
      return new Promise((resolve, reject) => {
        pending.set(++id, [resolve, reject]);
        socket.send(JSON.stringify({ id, method, params }));
      });
    },
    close() { socket.close(); },
  };
}

async function waitFor(test, timeout = 12000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    try { if (await test()) return; } catch (_) {}
    await sleep(100);
  }
  throw new Error('Timed out waiting for browser state');
}

async function evaluate(client, expression) {
  const response = await client.send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  assert(!response.exceptionDetails, JSON.stringify(response.exceptionDetails));
  return response.result.value;
}

(async () => {
  const port = 22000 + process.pid % 1000;
  const debug = port + 1000;
  const base = `http://127.0.0.1:${port}`;
  const server = spawn('python', ['tests/external_config_fixture.py', String(port)], { cwd: root, stdio: 'ignore' });
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'thinker-external-'));
  const chrome = spawn(chromePath, ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
    '--disable-background-timer-throttling', '--disable-renderer-backgrounding', `--remote-debugging-port=${debug}`,
    `--user-data-dir=${profile}`, 'about:blank'], { stdio: 'ignore' });
  const clients = [];
  try {
    await waitFor(async () => (await fetch(base + '/config/load')).ok);
    let tabs;
    await waitFor(async () => { tabs = await (await fetch(`http://127.0.0.1:${debug}/json/list`)).json(); return tabs.length; });
    const board = connect(tabs.find(tab => tab.type === 'page').webSocketDebuggerUrl);
    clients.push(board);
    await board.ready;
    await board.send('Page.enable');
    await board.send('Page.addScriptToEvaluateOnNewDocument', { source: 'window.prompt=()=>null;' });
    await board.send('Emulation.setDeviceMetricsOverride', { width: 1433, height: 900, deviceScaleFactor: 1, mobile: false });
    await board.send('Page.navigate', { url: base + '/tests/fixtures/userscript_bootstrap.html?delay=50' });
    await waitFor(() => evaluate(board, `Boolean(document.getElementById('bn-on'))`));
    await evaluate(board, `(() => {
      const original=window.GM_xmlhttpRequest;
      window.GM_xmlhttpRequest=options=>{
        const url=new URL(options.url);
        if(!url.pathname.startsWith('/config/'))return original(options);
        const controller=new AbortController();
        fetch(location.origin+url.pathname,{method:options.method||'GET',headers:options.headers,body:options.data,signal:controller.signal})
          .then(async r=>options.onload?.({status:r.status,responseText:await r.text()})).catch(()=>options.onerror?.({status:0}));
        return {abort:()=>controller.abort()};
      };
    })()`);
    const created = await board.send('Target.createTarget', { url: base + '/config' });
    tabs = await (await fetch(`http://127.0.0.1:${debug}/json/list`)).json();
    const panel = connect(tabs.find(tab => tab.id === created.targetId).webSocketDebuggerUrl);
    clients.push(panel);
    await panel.ready;
    await waitFor(() => evaluate(panel, `document.querySelector('[data-key="banner"]')?.disabled===false`));
    await waitFor(() => evaluate(panel, `document.getElementById('connection').textContent==='Local server connected' && document.getElementById('userscript-connection').textContent==='Chess.com: connected'`));
    await evaluate(panel, `document.querySelector('[data-key="banner"]').click()`);
    await waitFor(() => evaluate(board, `document.getElementById('bn-on').checked===false`));
    await waitFor(() => evaluate(panel, `document.getElementById('save-state').textContent==='Applied in a Chess.com tab'`));
    await evaluate(board, `document.getElementById('bn-on').closest('[role="switch"]').click()`);
    await waitFor(() => evaluate(panel, `document.querySelector('[data-key="banner"]').getAttribute('aria-checked')==='true'`));
    assert.equal(await evaluate(panel, `document.getElementById('elo').value`), '3200', 'External panel did not default to maximum strength');
    await waitFor(() => evaluate(board, `document.getElementById('kb-elo-slider').value==='3200'`));
    await evaluate(board, `(() => {
      scrollTo(0,document.documentElement.scrollHeight);
      const sidebar=document.querySelector('.play-controller-component:not(.stale-controller)');
      sidebar.replaceWith(sidebar.cloneNode(true));
    })()`);
    await waitFor(() => evaluate(board, `window.thinkerChessDiagnostics().banner.reason==='visible'&&getComputedStyle(document.getElementById('thinker-chess-banner')).display==='flex'`));
    const scrolledBanner=await evaluate(board, `(() => {const b=document.getElementById('thinker-chess-banner').getBoundingClientRect(),s=document.querySelector('.play-controller-component:not(.stale-controller)').getBoundingClientRect();return {scrollY,topDelta:b.top-s.top,bottomDelta:b.bottom-s.bottom};})()`);
    assert(scrolledBanner.scrollY>879&&scrolledBanner.topDelta===0&&scrolledBanner.bottomDelta===0,JSON.stringify(scrolledBanner));
    await evaluate(board, `document.getElementById('thinker-chess-banner').style.display='none'`);
    await waitFor(() => evaluate(board, `getComputedStyle(document.getElementById('thinker-chess-banner')).display==='flex'`));
    await evaluate(board, `history.pushState({},'','/analysis/game/fixture/review')`);
    await waitFor(() => evaluate(board, `getComputedStyle(document.getElementById('thinker-chess-banner')).display==='none'`));
    await evaluate(board, `history.pushState({},'','/game/fixture-restored')`);
    await waitFor(() => evaluate(board, `getComputedStyle(document.getElementById('thinker-chess-banner')).display==='flex'`));
    await evaluate(board, `history.pushState({},'','/live/game/18582739876?move=0');scrollTo(0,0)`);
    await waitFor(() => evaluate(board, `window.thinkerChessDiagnostics().banner.reason==='visible'&&getComputedStyle(document.getElementById('thinker-chess-banner')).display==='flex'`));
    const legacyRoute=await evaluate(board, `({route:location.pathname,evalPresentation:window.ThinkerEvalBarV2.resolveChessComEvalPresentation(location),activeAuthorization:window.ThinkerEvalBarV2.resolveChessComEvalAuthorization(location,document)})`);
    assert(legacyRoute.evalPresentation && legacyRoute.activeAuthorization==='active-game',JSON.stringify(legacyRoute));
    await evaluate(panel, `document.querySelector('[data-key="ghostMode"]').click()`);
    await waitFor(() => evaluate(board, `document.documentElement.classList.contains('tc-clean-view')`));
    const cleanView = await evaluate(board, `(() => {
      for(const name of ['myarrow','myhigh','thinker-eval-v2-overlay','tc-hud-stats']){const n=document.createElement('div');n.className=name;n.dataset.fixtureClean='true';document.body.appendChild(n);}
      const session=document.createElement('span');session.id='oi-mysession';session.textContent='0 W | 0 D | 0 L';session.dataset.fixtureClean='true';document.body.appendChild(session);
      const old=document.createElement('button');old.id='kb-ghost-recovery';old.textContent='TC';document.body.appendChild(old);
      const selectors=['#oi-wrapper','#krypbot-container','#oi-zone2','#oi-mysession','#thinker-chess-banner','#kb-ghost-recovery','.myarrow','.myhigh','.thinker-eval-v2-overlay','.tc-hud-stats'];
      return {hidden:selectors.every(s=>Array.from(document.querySelectorAll(s)).every(n=>getComputedStyle(n).display==='none')),boardVisible:getComputedStyle(document.querySelector('wc-chess-board')).display!=='none'};
    })()`);
    assert(cleanView.hidden&&cleanView.boardVisible,JSON.stringify(cleanView));
    await waitFor(() => evaluate(board, `!document.getElementById('kb-ghost-recovery')`));
    await evaluate(board, `scrollTo(0,0)`);
    const cleanScreenshot=await board.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
    fs.writeFileSync(path.join(root,'tests','artifacts','clean-view-hidden.png'),Buffer.from(cleanScreenshot.data,'base64'));
    await waitFor(() => evaluate(panel, `document.getElementById('banner-display-state').textContent==='Hidden by Clean View'`));
    assert.equal((await (await fetch(base+'/config/load')).json()).banner,true,'Clean View changed the Banner preference');
    await evaluate(panel, `document.querySelector('[data-key="ghostMode"]').click()`);
    await waitFor(() => evaluate(board, `!document.documentElement.classList.contains('tc-clean-view')&&getComputedStyle(document.getElementById('thinker-chess-banner')).display==='flex'`));
    await evaluate(board, `document.querySelectorAll('[data-fixture-clean]').forEach(n=>n.remove())`);
    await waitFor(() => evaluate(panel, `document.getElementById('banner-display-state').textContent==='Visible on Chess.com'`));
    const restoredBox=await evaluate(board, `(() => {const r=document.getElementById('thinker-chess-banner').getBoundingClientRect();return {x:r.x+scrollX,y:r.y+scrollY,width:r.width,height:r.height,scale:1};})()`);
    const restoredScreenshot=await board.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,clip:restoredBox});
    fs.writeFileSync(path.join(root,'tests','artifacts','banner-restored-from-clean-view.png'),Buffer.from(restoredScreenshot.data,'base64'));
    await evaluate(panel, `document.querySelector('[data-key="recentForm"]').click()`);
    await waitFor(() => evaluate(board, `document.getElementById('rf-on').checked===false`));
    await evaluate(panel, `(() => {const a=document.getElementById('minDelay'),b=document.getElementById('maxDelay');a.value='2.00';b.value='0.50';a.dispatchEvent(new Event('input'));b.dispatchEvent(new Event('input'));a.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}));})()`);
    await waitFor(() => evaluate(board, `document.getElementById('minDelayInput').value==='0.50'&&document.getElementById('maxDelayInput').value==='2.00'`));
    await evaluate(panel, `document.getElementById('minDelay').focus();document.getElementById('minDelay').value='0.85';document.getElementById('minDelay').dispatchEvent(new Event('input'));`);
    await sleep(2300);
    assert.equal(await evaluate(panel, `document.getElementById('minDelay').value`), '0.85', 'Polling overwrote the focused draft');
    await evaluate(panel, `document.getElementById('minDelay').blur()`);
    await waitFor(() => evaluate(board, `document.getElementById('minDelayInput').value==='0.85'`));
    await evaluate(panel, `document.querySelector('[data-mode="max"]').click()`);
    await waitFor(() => evaluate(board, `document.getElementById('dm-max').checked`));
    await evaluate(panel, `document.querySelector('[data-mode="random"]').click()`);
    await waitFor(() => evaluate(board, `document.getElementById('dm-rand').checked`));
    await evaluate(panel, `(() => {const input=document.getElementById('minDelay');input.focus();input.value='bad';input.dispatchEvent(new Event('input'));input.blur();})()`);
    await sleep(2300);
    assert.equal(await evaluate(panel, `document.getElementById('minDelay').value`), 'bad', 'Invalid timing draft was silently discarded');
    assert.equal(await evaluate(panel, `document.getElementById('minDelay').getAttribute('aria-invalid')`), 'true');
    await evaluate(panel, `document.querySelector('[data-mode="max"]').click()`);
    await waitFor(() => evaluate(board, `document.getElementById('dm-max').checked`));
    await evaluate(panel, `document.querySelector('[data-mode="random"]').click()`);
    await waitFor(() => evaluate(panel, `document.getElementById('minDelay').value==='0.85'&&document.getElementById('minDelay').getAttribute('aria-invalid')==='false'`));
    await evaluate(panel, `(() => {const input=document.getElementById('minDelay');input.value='0,85';input.dispatchEvent(new Event('input'));input.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}));})()`);
    await waitFor(() => evaluate(panel, `document.getElementById('minDelay').value==='0.85'`));
    await evaluate(panel, `(async () => {
      const native=window.fetch;
      const old=await (await native('/config/load')).json();
      window.fixtureOriginalFetch=native;
      window.fetch=async(url,options)=>String(url)==='/config/load'
        ? (await new Promise(r=>setTimeout(r,1200)),new Response(JSON.stringify(old),{status:200,headers:{'Content-Type':'application/json'}}))
        : native(url,options);
      document.querySelector('[data-key="banner"]').click();
      document.getElementById('retry').click();
    })()`);
    await sleep(1700);
    assert.equal(await evaluate(panel, `document.querySelector('[data-key="banner"]').getAttribute('aria-checked')`), 'false', 'Stale polling reverted the saved Banner');
    await evaluate(panel, `window.fetch=window.fixtureOriginalFetch`);
    await evaluate(board, `(async () => {
      await fetch('/config/save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({recentForm:true})});
      const input=document.getElementById('kb-color-picker');input.value='#22d36b';input.dispatchEvent(new Event('input',{bubbles:true}));
    })()`);
    await waitFor(async () => (await (await fetch(base + '/config/load')).json()).recentForm === true);
    await sleep(500);
    assert.equal((await (await fetch(base + '/config/load')).json()).recentForm, true, 'Unrelated on-page changes overwrote remote settings');
    await waitFor(() => evaluate(panel, `document.getElementById('color').value==='#22d36b'&&document.querySelector('[data-key="recentForm"]').getAttribute('aria-checked')==='true'&&document.getElementById('save-state').textContent==='Applied in a Chess.com tab'`));
    const metrics = [];
    for (const width of [1280, 800, 390]) {
      await panel.send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: false });
      await sleep(100);
      const measure = await evaluate(panel, `(() => {const r=document.querySelector('main').getBoundingClientRect();return {viewport:innerWidth,width:r.width,overflow:document.documentElement.scrollWidth>innerWidth,toggles:document.querySelectorAll('[role="switch"]').length,language:document.documentElement.lang};})()`);
      assert(!measure.overflow && measure.toggles === 9 && measure.language === 'en-US', JSON.stringify(measure));
      metrics.push(measure);
      const pageHeight=await evaluate(panel, `document.documentElement.scrollHeight`);
      const screenshot = await panel.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip:{x:0,y:0,width,height:pageHeight,scale:1} });
      fs.writeFileSync(path.join(root, 'tests', 'artifacts', `external-config-${width}.png`), Buffer.from(screenshot.data, 'base64'));
    }
    await evaluate(panel, `window.fixtureFetch=window.fetch;window.fetch=()=>Promise.reject(new Error('offline'));document.getElementById('retry').click()`);
    await waitFor(() => evaluate(panel, `document.getElementById('connection').textContent==='Local server offline'`));
    await evaluate(panel, `window.fetch=window.fixtureFetch;document.getElementById('retry').click()`);
    await waitFor(() => evaluate(panel, `document.getElementById('connection').textContent==='Local server connected' && document.getElementById('userscript-connection').textContent==='Chess.com: connected'`));
    await evaluate(panel, `(() => {
      const native=window.fetch;let fail=true;
      window.fetch=(url,options)=>String(url)==='/config/save'&&fail
        ? (fail=false,Promise.reject(new Error('temporary failure'))) : native(url,options);
      document.querySelector('[data-key="banner"]').click();
    })()`);
    await waitFor(() => evaluate(panel, `document.getElementById('save-state').textContent.includes('changes will retry')`));
    await waitFor(() => evaluate(board, `document.getElementById('bn-on').checked===true`));
    const exportFit = await evaluate(board, `(() => {const node=document.getElementById('kb-session-export'),range=document.createRange();range.selectNodeContents(node);const b=node.getBoundingClientRect(),r=range.getBoundingClientRect();return {text:node.textContent,width:b.width,height:b.height,textWidth:r.width,textHeight:r.height,fits:r.width<=b.width-2&&r.height<=b.height-2};})()`);
    assert(exportFit.fits && exportFit.text==='Export Diagnostics',JSON.stringify(exportFit));
    const diagnostic = await evaluate(board, `window.thinkerChessDiagnostics().externalConfig`);
    assert.equal(diagnostic.error, null);
    const report={ bidirectionalSync: true, legacyRoute, cleanView, noFloatingRecovery:true, hiddenBannerRecovered:true, routeBannerRecovered:true, defaultStrength:3200, scrolledBanner, timingSwap: true, focusedDraftPreserved: true, invalidDraftPreserved:true, stalePollRejected:true, disjointEditsPreserved:true, saveRetry:true, offlineRecovery: true, exportFit, diagnostic, metrics };
    fs.writeFileSync(path.join(root,'tests','artifacts','clean-view-validation.json'),JSON.stringify(report,null,2));
    console.log(JSON.stringify(report, null, 2));
  } finally {
    clients.forEach(client => client.close());
    chrome.kill();
    server.kill();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
