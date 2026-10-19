import { spawn } from 'node:child_process';
import { access, mkdtemp, rm } from 'node:fs/promises';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { delimiter, join } from 'node:path';

const host = '127.0.0.1';
const pathCandidates = (process.env.PATH ?? '').split(delimiter).flatMap(directory => [
  join(directory, 'chrome'),
  join(directory, 'chrome.exe'),
  join(directory, 'chromium'),
  join(directory, 'chromium-browser'),
  join(directory, 'msedge'),
  join(directory, 'msedge.exe'),
]);
const browserCandidates = [
  process.env.CHROME_PATH,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  ...pathCandidates,
].filter(Boolean);

const delay = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));

const availablePort = () => new Promise((resolve, reject) => {
  const server = createServer();
  server.once('error', reject);
  server.listen(0, host, () => {
    const address = server.address();
    server.close(error => {
      if (error) reject(error);
      else resolve(address.port);
    });
  });
});

const waitForResponse = async (url, parseJson = true, attempts = 80) => {
  let lastError;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) return parseJson ? response.json() : response;
      lastError = new Error(`${response.status} ${response.statusText}`);
    } catch (error) {
      lastError = error;
    }
    await delay(100);
  }
  throw lastError ?? new Error(`timed out waiting for ${url}`);
};

const findBrowser = async () => {
  for (const candidate of browserCandidates) {
    try {
      await access(candidate);
      return candidate;
    } catch {}
  }
  throw new Error('Chrome or Edge executable was not found');
};

const metricMap = metrics => Object.fromEntries(metrics.map(metric => [metric.name, metric.value]));

const createCdpClient = async websocketUrl => {
  const socket = new WebSocket(websocketUrl);
  const pending = new Map();
  let nextId = 1;
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', reject, { once: true });
  });
  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (!message.id) return;
    const request = pending.get(message.id);
    if (!request) return;
    pending.delete(message.id);
    if (message.error) request.reject(new Error(message.error.message));
    else request.resolve(message.result);
  });
  socket.addEventListener('close', () => {
    for (const request of pending.values()) request.reject(new Error('CDP connection closed'));
    pending.clear();
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = nextId;
    nextId += 1;
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
  return { socket, send };
};

const browserPath = await findBrowser().catch(() => null);
if (!browserPath) {
  console.log(JSON.stringify({ unavailable: true, reason: 'compatible Chromium browser was not discovered' }, null, 2));
  process.exit(0);
}
const vitePort = await availablePort();
let debuggingPort = await availablePort();
while (debuggingPort === vitePort) debuggingPort = await availablePort();
const pageUrl = `http://${host}:${vitePort}/profile-eval-bar.html`;
const vite = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', host, '--port', String(vitePort), '--strictPort'], {
  cwd: process.cwd(),
  stdio: 'ignore',
  windowsHide: true,
});
const profileDirectory = await mkdtemp(join(tmpdir(), 'thinker-eval-bar-'));
let browser;
let cdp;

try {
  await waitForResponse(pageUrl, false);
  browser = spawn(browserPath, [
    '--headless=new',
    `--remote-debugging-port=${debuggingPort}`,
    `--user-data-dir=${profileDirectory}`,
    '--disable-background-timer-throttling',
    '--disable-renderer-backgrounding',
    'about:blank',
  ], { stdio: 'ignore', windowsHide: true });
  await waitForResponse(`http://${host}:${debuggingPort}/json/version`);
  const targetResponse = await fetch(`http://${host}:${debuggingPort}/json/new?${encodeURIComponent(pageUrl)}`, { method: 'PUT' });
  if (!targetResponse.ok) throw new Error(`could not create browser target: ${targetResponse.status}`);
  const target = await targetResponse.json();
  cdp = await createCdpClient(target.webSocketDebuggerUrl);
  await cdp.send('Performance.enable');

  for (let attempt = 0; attempt < 80; attempt += 1) {
    const ready = await cdp.send('Runtime.evaluate', { expression: "document.readyState === 'complete' && typeof startEvalBarProfile === 'function'", returnByValue: true });
    if (ready.result.value === true) break;
    if (attempt === 79) throw new Error('profile page did not become ready');
    await delay(100);
  }
  await delay(250);

  const baseline = metricMap((await cdp.send('Performance.getMetrics')).metrics);
  const evaluated = await cdp.send('Runtime.evaluate', {
    expression: 'startEvalBarProfile()',
    awaitPromise: true,
    returnByValue: true,
  });
  if (evaluated.exceptionDetails) throw new Error(evaluated.exceptionDetails.text);
  const finalMetrics = metricMap((await cdp.send('Performance.getMetrics')).metrics);
  const result = {
    browser: browserPath,
    workload: evaluated.result.value,
    rendering: {
      layoutCount: (finalMetrics.LayoutCount ?? 0) - (baseline.LayoutCount ?? 0),
      recalcStyleCount: (finalMetrics.RecalcStyleCount ?? 0) - (baseline.RecalcStyleCount ?? 0),
      layoutDurationMs: ((finalMetrics.LayoutDuration ?? 0) - (baseline.LayoutDuration ?? 0)) * 1000,
      scriptDurationMs: ((finalMetrics.ScriptDuration ?? 0) - (baseline.ScriptDuration ?? 0)) * 1000,
      taskDurationMs: ((finalMetrics.TaskDuration ?? 0) - (baseline.TaskDuration ?? 0)) * 1000,
    },
  };
  result.rendering.layoutDurationPerFrameMs = result.rendering.layoutDurationMs / result.workload.animationFrames;
  console.log(JSON.stringify(result, null, 2));
  if (
    result.workload.longTaskCount !== 0
    || result.workload.frameIntervalP95Ms > 20
    || result.rendering.layoutDurationPerFrameMs > 1
  ) process.exitCode = 1;
} finally {
  cdp?.socket.close();
  browser?.kill();
  vite.kill();
  await delay(500);
  await rm(profileDirectory, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
}
