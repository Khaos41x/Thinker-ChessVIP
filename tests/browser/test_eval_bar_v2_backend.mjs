import { spawn } from 'node:child_process';
import { access, mkdtemp, rm } from 'node:fs/promises';
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

const allocatedPorts = new Set();
const uniquePort = async () => {
  let candidate = await port();
  while (allocatedPorts.has(candidate)) candidate = await port();
  allocatedPorts.add(candidate);
  return candidate;
};
const vitePort = await uniquePort();
const backendPort = await uniquePort();
const debugPort = await uniquePort();
const profile = await mkdtemp(join(tmpdir(), 'thinker-eval-v2-backend-'));
const pageUrl = `http://${host}:${vitePort}/profile-userscript-eval-bar-backend.html`;
const backendUrl = `http://${host}:${backendPort}`;
const backendCode = `import app, threading, sys; from werkzeug.serving import make_server; app.stockfish_eval_bar.start(); server=make_server('${host}', ${backendPort}, app.app, threaded=True); thread=threading.Thread(target=server.serve_forever); thread.start(); sys.stdin.readline(); server.shutdown(); thread.join(); app.stockfish_eval_bar.close(); app.komodo.close()`;
const backend = spawn('python', ['-c', backendCode], {
  cwd: repositoryRoot,
  env: { ...process.env, THINKER_CAPABILITY_TOKEN: token },
  stdio: ['pipe', 'ignore', 'inherit'],
  windowsHide: true,
});
const vite = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', host, '--port', String(vitePort), '--strictPort'], {
  cwd: labRoot,
  stdio: ['ignore', 'inherit', 'inherit'],
  windowsHide: true,
});
let browser;
let cdp;

try {
  console.log('eval-bar backend browser: waiting for fixture and Flask');
  await Promise.all([waitAvailable(pageUrl), waitAvailable(`${backendUrl}/health`)]);
  console.log('eval-bar backend browser: fixture and Flask ready');
  browser = spawn(browserPath, [
    '--headless=new',
    '--disable-web-security',
    `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=${profile}`,
    '--disable-background-timer-throttling',
    '--disable-renderer-backgrounding',
    'about:blank',
  ], { stdio: 'ignore', windowsHide: true });
  await waitJson(`http://${host}:${debugPort}/json/version`);
  console.log('eval-bar backend browser: chromium ready');
  const targetResponse = await fetch(`http://${host}:${debugPort}/json/new?${encodeURIComponent(pageUrl)}`, { method: 'PUT' });
  const target = await targetResponse.json();
  cdp = await connect(target.webSocketDebuggerUrl);
  console.log('eval-bar backend browser: CDP connected');
  await cdp.send('Runtime.enable');
  await cdp.send('Network.enable');
  await cdp.send('Network.setExtraHTTPHeaders', { headers: { Origin: 'https://www.chess.com' } });
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const ready = await cdp.send('Runtime.evaluate', {
      expression: "document.readyState === 'complete' && typeof runEvalBarBackendIntegration === 'function'",
      returnByValue: true,
    });
    if (ready.result.value) break;
    if (attempt === 99) throw new Error('backend integration fixture did not become ready');
    await delay(100);
  }
  const evaluated = await cdp.send('Runtime.evaluate', {
    expression: `Promise.race([
      runEvalBarBackendIntegration(${JSON.stringify(backendUrl)}, ${JSON.stringify(token)}),
      new Promise((_, reject) => setTimeout(() => reject(new Error('backend fixture timeout')), 35000)),
    ])`,
    awaitPromise: true,
    returnByValue: true,
  });
  if (evaluated.exceptionDetails) throw new Error(evaluated.exceptionDetails.exception?.description || evaluated.exceptionDetails.text);
  const result = evaluated.result.value;
  console.log(JSON.stringify(result, null, 2));
  const realCp = result.cpBackend && Number.isFinite(result.cpBackend.cp) && result.cpBackend.mate === null;
  const realMate = result.mateBackend && Number.isInteger(result.mateBackend.mate) && result.mateBackend.cp === null;
  const progressive = result.preFinalDepths.length >= 2
    && result.firstEvaluationMs > 0
    && result.firstEvaluationMs < result.firstFinalMs;
  if (!result.fenRead || result.requestCount !== 2 || !realCp || !realMate || !result.smallnetIdentity || !result.connected
    || !result.mateLabel.startsWith('#')
    || !result.orientationInverted || !result.scaleYOnly || result.smoothFrames < 3
    || !result.geometry || result.geometry.height < 500 || !progressive) process.exitCode = 1;
} finally {
  cdp?.socket.close();
  browser?.kill();
  vite.kill();
  backend.stdin.write('stop\n');
  backend.stdin.end();
  await delay(500);
  await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
}
