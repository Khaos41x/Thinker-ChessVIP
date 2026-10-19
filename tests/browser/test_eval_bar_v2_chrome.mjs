import { spawn } from 'node:child_process';
import { access, mkdtemp, rm } from 'node:fs/promises';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const host = '127.0.0.1';
const repositoryRoot = resolve(import.meta.dirname, '..', '..');
const labRoot = join(repositoryRoot, 'analysis_lab');
const candidates = [
  process.env.CHROME_PATH,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
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
const waitJson = async url => {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) return response.json();
    } catch {}
    await delay(100);
  }
  throw new Error(`timeout waiting for ${url}`);
};
const waitAvailable = async url => {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
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

let browserPath = null;
for (const candidate of candidates) {
  try {
    await access(candidate);
    browserPath = candidate;
    break;
  } catch {}
}
if (!browserPath) {
  console.log(JSON.stringify({ unavailable: true, reason: 'Chromium not found' }, null, 2));
  process.exit(0);
}

const vitePort = await port();
let debugPort = await port();
while (debugPort === vitePort) debugPort = await port();
const profile = await mkdtemp(join(tmpdir(), 'thinker-eval-v2-'));
const url = `http://${host}:${vitePort}/profile-userscript-eval-bar.html`;
const vite = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', host, '--port', String(vitePort), '--strictPort'], {
  cwd: labRoot,
  stdio: 'ignore',
  windowsHide: true,
});
let browser;
let cdp;

try {
  await waitAvailable(url);
  browser = spawn(browserPath, [
    '--headless=new',
    '--js-flags=--expose-gc',
    `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=${profile}`,
    '--disable-background-timer-throttling',
    '--disable-renderer-backgrounding',
    'about:blank',
  ], { stdio: 'ignore', windowsHide: true });
  await waitJson(`http://${host}:${debugPort}/json/version`);
  const targetResponse = await fetch(`http://${host}:${debugPort}/json/new?${encodeURIComponent(url)}`, { method: 'PUT' });
  const target = await targetResponse.json();
  cdp = await connect(target.webSocketDebuggerUrl);
  await cdp.send('Runtime.enable');
  await cdp.send('HeapProfiler.enable');
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const ready = await cdp.send('Runtime.evaluate', {
      expression: "document.readyState === 'complete' && typeof runUserscriptEvalBarBrowserTest === 'function'",
      returnByValue: true,
    });
    if (ready.result.value) break;
    if (attempt === 99) throw new Error('browser fixture did not become ready');
    await delay(100);
  }
  await cdp.send('HeapProfiler.collectGarbage');
  const before = await cdp.send('Runtime.getHeapUsage');
  const evaluated = await cdp.send('Runtime.evaluate', {
    expression: 'runUserscriptEvalBarBrowserTest()',
    awaitPromise: true,
    returnByValue: true,
  });
  if (evaluated.exceptionDetails) throw new Error(evaluated.exceptionDetails.exception?.description || evaluated.exceptionDetails.text);
  await cdp.send('HeapProfiler.collectGarbage');
  const after = await cdp.send('Runtime.getHeapUsage');
  const result = {
    browser: browserPath,
    behavior: evaluated.result.value,
    retainedHeapDeltaBytes: after.usedSize - before.usedSize,
  };
  console.log(JSON.stringify(result, null, 2));
  const behavior = result.behavior;
  if (
    !behavior.domPreserved || !behavior.overlayAligned || !behavior.parentPreservedAfterDestroy
    || !behavior.staleRejected || !behavior.negativeRendered || !behavior.cachedOrientationRendered
    || !behavior.oldSameFenCallbacksRejected || !behavior.requestIdsMonotonic
    || !behavior.matePerspectiveRendered || !behavior.negativeMatePerspectiveRendered
    || !behavior.neutralRendered
    || !behavior.contextMissPreservedVisual || !behavior.oldContextRejected || !behavior.contextCacheSeparated
    || !behavior.cacheMissPreservedVisual || !behavior.cacheHitMarkedFresh
    || !behavior.unmountedWhenUnauthorized || !behavior.noRequestWhenUnauthorized
    || !behavior.remountedAfterSpaRoute
    || behavior.rootsAfterDestroy !== 0
    || behavior.styleMarkers !== 1 || behavior.maximumPendingFramesDuringBurst > 1
    || result.retainedHeapDeltaBytes > 1_500_000
  ) process.exitCode = 1;
} finally {
  cdp?.socket.close();
  browser?.kill();
  vite.kill();
  await delay(400);
  await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
}
