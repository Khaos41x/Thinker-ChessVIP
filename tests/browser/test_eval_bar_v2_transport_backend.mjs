import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import { resolve } from 'node:path';

const host = '127.0.0.1';
const repositoryRoot = resolve(import.meta.dirname, '..', '..');
const token = 'eval-bar-transport-proof-0123456789abcdef';
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

const backendPort = await port();
const backendUrl = `http://${host}:${backendPort}`;
const backendCode = `import app, threading, sys; from werkzeug.serving import make_server; app.stockfish_eval_bar.start(); server=make_server('${host}', ${backendPort}, app.app, threaded=True); thread=threading.Thread(target=server.serve_forever); thread.start(); sys.stdin.readline(); server.shutdown(); thread.join(); app.stockfish_eval_bar.close(); app.komodo.close()`;
const backend = spawn('python', ['-c', backendCode], {
  cwd: repositoryRoot,
  env: { ...process.env, THINKER_CAPABILITY_TOKEN: token },
  stdio: ['pipe', 'ignore', 'inherit'],
  windowsHide: true,
});
backend.stdin.on('error', () => {});

try {
  const backendFailure = Promise.race([
    once(backend, 'error').then(([error]) => { throw error; }),
    once(backend, 'exit').then(([code, signal]) => { throw new Error(`backend exited before health: code=${code} signal=${signal}`); }),
  ]);
  await Promise.race([waitAvailable(`${backendUrl}/health`), backendFailure]);
  const userscript = await readFile(resolve(repositoryRoot, 'script.js'), 'utf8');
  const transportSource = userscript.slice(
    userscript.indexOf('  function requestEvalBarV2('),
    userscript.indexOf('  function ensureEvalBarV2()'),
  );
  const diagnostics = [];
  const gmRequest = options => {
    const abort = new AbortController();
    void fetch(options.url, {
      method: options.method,
      headers: { ...options.headers, Origin: 'https://www.chess.com' },
      body: options.data,
      signal: abort.signal,
    }).then(async response => {
      const fallback = response.clone();
      options.onloadstart?.({ status: response.status, response: response.body });
      options.onload?.({ status: response.status, responseText: await fallback.text() });
    }).catch(error => {
      if (error?.name === 'AbortError') options.onabort?.();
      else options.onerror?.(error);
    });
    return { abort: () => abort.abort() };
  };
  const requestEvaluation = Function('dependencies', `
    const {
      SERVER_URL,
      GM_xmlhttpRequest,
      engineRequestHeaders,
      evalBarAuthorization,
      evalBarClientId,
      handleEngineUnauthorized,
      reportEvalBarDiagnostic,
      setEvalBarTransportDiagnostic,
    } = dependencies;
    ${transportSource}
    return requestEvalBarV2;
  `)({
    SERVER_URL: backendUrl,
    GM_xmlhttpRequest: gmRequest,
    engineRequestHeaders: () => ({ Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }),
    evalBarAuthorization: () => 'analysis',
    evalBarClientId: 'real-transport-client',
    handleEngineUnauthorized: response => Number(response?.status) === 401,
    reportEvalBarDiagnostic: (stage, value) => diagnostics.push({ stage, value }),
    setEvalBarTransportDiagnostic: (stage, value) => diagnostics.push({ stage: `transport:${stage}`, value }),
  });
  const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  const startedAt = performance.now();
  const progress = [];
  const evaluation = new Promise((resolveResult, rejectResult) => {
      requestEvaluation({
        fen,
        generation: 1,
        requestId: 1,
        cacheContext: 'real-transport-proof',
        onProgress: event => progress.push({
          type: event.type,
          depth: event.depth,
          cp: event.cp,
          mate: event.mate,
          elapsedMs: performance.now() - startedAt,
        }),
        onResult: event => resolveResult({ ...event, elapsedMs: performance.now() - startedAt }),
        onError: rejectResult,
      });
  });
  let timeoutHandle;
  let result;
  try {
    result = await Promise.race([
      evaluation,
      new Promise((_, reject) => {
        timeoutHandle = setTimeout(() => reject(new Error('real transport timeout')), 20000);
      }),
    ]);
  } finally {
    clearTimeout(timeoutHandle);
  }
  const infos = progress.filter(event => event.type === 'info');
  const evidence = {
    firstEvaluationMs: infos[0]?.elapsedMs ?? null,
    finalMs: result.elapsedMs,
    preFinalDepths: infos.map(event => event.depth),
    result: {
      depth: result.depth,
      cp: result.cp,
      mate: result.mate,
      engine: result.engine,
      package: result.package,
      build: result.build,
      network: result.network,
    },
    diagnostics: diagnostics.map(entry => entry.stage),
  };
  console.log(JSON.stringify(evidence, null, 2));
  if (new Set(infos.map(event => event.depth)).size < 2
    || !(evidence.firstEvaluationMs > 0 && evidence.firstEvaluationMs < evidence.finalMs)
    || result.engine !== 'Stockfish 19'
    || result.package !== '@lichess-org/stockfish-web@0.5.0'
    || result.build !== 'sf_19_smallnet'
    || result.network !== 'nn-61e7af4bb97d.nnue') process.exitCode = 1;
} finally {
  if (backend.exitCode === null && backend.stdin.writable) backend.stdin.end('stop\n');
  if (backend.exitCode === null) await Promise.race([once(backend, 'exit'), delay(3000)]);
}
