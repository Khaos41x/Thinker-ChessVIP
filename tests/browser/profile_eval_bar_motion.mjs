import { spawn } from 'node:child_process';
import { access, mkdtemp, rm, writeFile, mkdir } from 'node:fs/promises';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { gzipSync } from 'node:zlib';

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
  const listeners = new Map();
  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (!message.id) { for (const listener of listeners.get(message.method) || []) listener(message.params); return; }
    const request = pending.get(message.id);
    if (!request) return;
    pending.delete(message.id);
    if (message.error) request.reject(new Error(message.error.message));
    else request.resolve(message.result);
  });
  return {
    socket,
    on(method, callback) { listeners.set(method, [...(listeners.get(method) || []), callback]); },
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
const pageUrl = `http://${host}:${vitePort}/profile-eval-bar-motion.html`;
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
      expression: "document.readyState === 'complete' && typeof runMotionTrace === 'function'",
      returnByValue: true,
    });
    if (ready.result.value) break;
    if (attempt === 99) throw new Error('backend integration fixture did not become ready');
    await delay(100);
  }
  await cdp.send('Page.enable');
  await cdp.send('Page.bringToFront');
  const phase = process.argv.includes('--before') ? 'before' : 'after';
  const destination = join(repositoryRoot, '_bmad-output', 'implementation-artifacts', 'phase09-2', 'motion');
  await mkdir(destination, { recursive: true });
  const trace = [];
  cdp.on('Tracing.dataCollected', event => trace.push(...event.value));
  const traceComplete = new Promise(resolveComplete => cdp.on('Tracing.tracingComplete', resolveComplete));
  await cdp.send('Tracing.start', { categories: 'devtools.timeline,blink.user_timing,v8,disabled-by-default-devtools.timeline.frame', options: 'record-continuously' });
  const results = [];
  for (const noise of [false, true]) {
    const evaluated = await cdp.send('Runtime.evaluate', {
      expression: `runMotionTrace(${JSON.stringify(backendUrl)}, ${JSON.stringify(token)}, ${noise})`,
      awaitPromise: true, returnByValue: true,
    });
    if (evaluated.exceptionDetails) throw new Error(evaluated.exceptionDetails.exception?.description || evaluated.exceptionDetails.text);
    const result = evaluated.result.value;
    results.push(result);
    console.log(JSON.stringify({ phase, noise, intervals: result.intervals, firstFrame: result.acceptedToFirstMovingFrameMs, geometryCalls: result.geometryCalls, mounts: result.mountCount, maxRAF: result.maxConcurrentAnimationFrames, completed: result.completed, error: result.transportError }));
    if (!result.completed || result.transportError || result.mountCount !== 1 || result.maxConcurrentAnimationFrames > 1 || !result.scaleYOnly || !result.noOvershoot
      || (phase === 'after' && !noise && result.geometryCalls > 5)) process.exitCode = 1;
  }
  await cdp.send('Tracing.end');
  await traceComplete;
  await writeFile(join(destination, `${phase}-frames.json`), JSON.stringify(results, null, 2));
  await writeFile(join(destination, `${phase}-chromium-trace.json.gz`), gzipSync(JSON.stringify({ traceEvents: trace })));

} finally {
  cdp?.socket.close();
  browser?.kill();
  vite.kill();
  backend.stdin.write('stop\n');
  backend.stdin.end();
  await delay(500);
  if (!profile.startsWith(join(tmpdir(), 'thinker-eval-v2-backend-'))) throw new Error('Unexpected profile cleanup path');
  await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
}
