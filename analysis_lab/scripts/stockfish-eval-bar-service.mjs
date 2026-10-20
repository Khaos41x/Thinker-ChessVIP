import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { createInterface } from 'node:readline';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ENGINE = 'Stockfish 19';
const PACKAGE = '@lichess-org/stockfish-web@0.5.0';
const BUILD = 'sf_19_smallnet';
const NETWORK = 'nn-61e7af4bb97d.nnue';
const NETWORK_SHA256 = '61e7af4bb97d51eeeb25d322916f86513b5cd3a827ce189c98c6e31946f99e5b';
const PROFILE = Object.freeze({ threads: 3, hash: 16, multiPv: 1, analyseMode: true, movetime: 8000 });
const INFO_THROTTLE_MS = 100;
const engineRootIndex = process.argv.indexOf('--engine-root');
const engineRoot = resolve(engineRootIndex >= 0 ? process.argv[engineRootIndex + 1] : 'analysis_lab/public/engine');
const modulePath = resolve(engineRoot, `${BUILD}.js`);
const packagePath = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'node_modules', '@lichess-org', 'stockfish-web', 'package.json');
const startedAt = performance.now();
const output = message => process.stdout.write(`${JSON.stringify(message)}\n`);

let engine;
let engineName = ENGINE;
let active = null;
let pending = null;
let state = 'booting';
let latestInfo = null;
let stopStartedAt = null;
let shutdownRequested = false;
let factoryMs = 0;
let nnueMs = 0;
let uciMs = 0;
let readyMs = 0;
let firstInfoMs = null;

function parseInfo(line, whiteToMove) {
  const tokens = line.trim().split(/\s+/);
  const value = key => {
    const index = tokens.indexOf(key);
    return index >= 0 ? tokens[index + 1] : undefined;
  };
  const depth = Number(value('depth'));
  const scoreIndex = tokens.indexOf('score');
  if (scoreIndex < 0 || !Number.isFinite(depth)) return null;
  const scoreType = tokens[scoreIndex + 1];
  const rawScore = Number(tokens[scoreIndex + 2]);
  if (!['cp', 'mate'].includes(scoreType) || !Number.isFinite(rawScore) || rawScore === 0 && scoreType === 'mate') return null;
  const sign = whiteToMove ? 1 : -1;
  const nodes = Number(value('nodes'));
  const nps = Number(value('nps'));
  const time = Number(value('time'));
  const rawBound = tokens.includes('lowerbound') ? 'lowerbound' : tokens.includes('upperbound') ? 'upperbound' : null;
  const bound = sign < 0 && rawBound
    ? rawBound === 'lowerbound' ? 'upperbound' : 'lowerbound'
    : rawBound;
  return {
    cp: scoreType === 'cp' ? rawScore * sign : null,
    mate: scoreType === 'mate' ? rawScore * sign : null,
    depth,
    seldepth: Number(value('seldepth')) || 0,
    nodes: Number.isFinite(nodes) ? nodes : 0,
    nps: Number.isFinite(nps) ? nps : 0,
    time: Number.isFinite(time) ? time : 0,
    bound,
  };
}

function cancelQueued(request, reason = 'cancelled') {
  if (!request) return;
  output({ type: 'cancelled', requestId: request.requestId, reason, seq: 1 });
}

function requestStop() {
  if (!active || active.stopping) return;
  active.stopping = true;
  stopStartedAt = performance.now();
  state = 'stopping';
  engine.uci('stop');
}

function startSearch(request) {
  active = {
    ...request,
    stopping: false,
    startedAt: performance.now(),
    lastPublishedAt: null,
    lastPublishedInfo: null,
    seq: 0,
  };
  latestInfo = null;
  firstInfoMs = null;
  stopStartedAt = null;
  state = 'searching';
  const whiteToMove = request.fen.trim().split(/\s+/)[1] === 'w';
  active.whiteToMove = whiteToMove;
  engine.uci(`position fen ${request.fen}`);
  engine.uci(`go movetime ${request.movetime}`);
}

function sameInfo(left, right) {
  return Boolean(left && right
    && left.cp === right.cp
    && left.mate === right.mate
    && left.depth === right.depth
    && left.seldepth === right.seldepth
    && left.nodes === right.nodes
    && left.nps === right.nps
    && left.time === right.time
    && left.bound === right.bound);
}

function publishInfo(force = false) {
  if (!active || active.stopping || !latestInfo || sameInfo(latestInfo, active.lastPublishedInfo)) return;
  const now = performance.now();
  if (!force && active.lastPublishedAt !== null && now - active.lastPublishedAt < INFO_THROTTLE_MS) return;
  active.seq += 1;
  active.lastPublishedAt = now;
  active.lastPublishedInfo = { ...latestInfo };
  output({ type: 'info', requestId: active.requestId, seq: active.seq, result: latestInfo });
}

function schedule(request) {
  if (pending) cancelQueued(pending, 'superseded-before-start');
  pending = request;
  if (active) requestStop();
  else {
    const next = pending;
    pending = null;
    startSearch(next);
  }
}

function finishBestmove(line) {
  if (!active) return;
  publishInfo(true);
  const completed = active;
  const bestmove = line.trim().split(/\s+/)[1] || null;
  active = null;
  state = 'idle';
  const cancelMs = stopStartedAt === null ? null : performance.now() - stopStartedAt;
  if (completed.stopping) {
    output({ type: 'cancelled', requestId: completed.requestId, reason: 'superseded', cancelMs, seq: completed.seq + 1 });
  } else if (!latestInfo) {
    output({ type: 'error', requestId: completed.requestId, error: 'engine returned no evaluation', seq: completed.seq + 1 });
  } else {
    output({
      type: 'result',
      requestId: completed.requestId,
      seq: completed.seq + 1,
      result: {
        ...latestInfo,
        bestmove: bestmove === '(none)' ? null : bestmove,
        engine: ENGINE,
        package: PACKAGE,
        engineName,
        build: BUILD,
        network: NETWORK,
        networkSha256: NETWORK_SHA256,
        profile: PROFILE,
        firstInfoMs,
        searchMs: performance.now() - completed.startedAt,
      },
    });
  }
  stopStartedAt = null;
  if (pending) {
    const next = pending;
    pending = null;
    startSearch(next);
  } else if (shutdownRequested) shutdown();
}

function onLine(line) {
  const text = String(line).trim();
  if (text.startsWith('id name ')) engineName = text.slice(8);
  else if (text === 'uciok') {
    uciMs = performance.now() - startedAt;
    engine.uci('setoption name UCI_AnalyseMode value true');
    engine.uci(`setoption name Threads value ${PROFILE.threads}`);
    engine.uci(`setoption name Hash value ${PROFILE.hash}`);
    engine.uci(`setoption name MultiPV value ${PROFILE.multiPv}`);
    engine.uci('ucinewgame');
    engine.uci('isready');
  } else if (text === 'readyok') {
    readyMs = performance.now() - startedAt;
    state = 'idle';
    output({
      type: 'ready', engine: ENGINE, engineName, package: PACKAGE, build: BUILD, network: NETWORK,
      networkSha256: NETWORK_SHA256, profile: PROFILE,
      startup: { factoryMs, nnueMs, uciMs, readyMs }, pid: process.pid,
    });
  } else if (text.startsWith('info ') && active && !active.stopping) {
    const parsed = parseInfo(text, active.whiteToMove);
    if (parsed) {
      if (firstInfoMs === null) firstInfoMs = performance.now() - active.startedAt;
      if (!latestInfo || parsed.depth >= latestInfo.depth) latestInfo = parsed;
      publishInfo();
    }
  } else if (text.startsWith('bestmove ')) finishBestmove(text);
}

function shutdown() {
  try { engine?.uci('quit'); } catch {}
  setTimeout(() => process.exit(0), 25).unref();
}

async function boot() {
  const packageMetadata = JSON.parse(await readFile(packagePath, 'utf8'));
  if (packageMetadata.name !== '@lichess-org/stockfish-web' || packageMetadata.version !== '0.5.0') {
    throw new Error(`unexpected Stockfish package: ${packageMetadata.name}@${packageMetadata.version}`);
  }
  const factoryStarted = performance.now();
  const factory = await import(pathToFileURL(modulePath).href);
  const memory = new WebAssembly.Memory({ shared: true, initial: 1024, maximum: 32767 });
  engine = await factory.default({
    wasmMemory: memory,
    locateFile: file => resolve(engineRoot, file),
    mainScriptUrlOrBlob: modulePath,
  });
  factoryMs = performance.now() - factoryStarted;
  const recommended = engine.getRecommendedNnue();
  if (recommended !== NETWORK) throw new Error(`unexpected NNUE: ${recommended}`);
  const nnueStarted = performance.now();
  const network = await readFile(resolve(engineRoot, NETWORK));
  const sha256 = createHash('sha256').update(network).digest('hex');
  if (sha256 !== NETWORK_SHA256) throw new Error(`NNUE integrity mismatch: ${sha256}`);
  engine.setNnueBuffer(new Uint8Array(network));
  nnueMs = performance.now() - nnueStarted;
  engine.onError = error => output({ type: 'fatal', error: String(error) });
  engine.listen = onLine;
  engine.uci('uci');
}

createInterface({ input: process.stdin, crlfDelay: Infinity }).on('line', line => {
  let message;
  try { message = JSON.parse(line); } catch { return; }
  if (message.type === 'evaluate') {
    const requestId = String(message.requestId || '');
    const fen = String(message.fen || '').trim();
    const movetime = Number(message.movetime ?? PROFILE.movetime);
    if (!requestId || fen.split(/\s+/).length !== 6 || !Number.isFinite(movetime) || movetime < 1) {
      output({ type: 'error', requestId, error: 'invalid evaluation request' });
      return;
    }
    schedule({ requestId, fen, movetime: Math.trunc(movetime) });
  } else if (message.type === 'cancel') {
    const requestId = String(message.requestId || '');
    if (pending?.requestId === requestId) {
      const cancelled = pending;
      pending = null;
      cancelQueued(cancelled);
    }
    if (active?.requestId === requestId) requestStop();
  } else if (message.type === 'status') {
    output({ type: 'status', requestId: String(message.requestId || ''), state, active: active?.requestId ?? null, pending: pending?.requestId ?? null });
  } else if (message.type === 'shutdown') {
    shutdownRequested = true;
    if (pending) {
      cancelQueued(pending, 'shutdown');
      pending = null;
    }
    if (active) requestStop();
    else shutdown();
  }
});

boot().catch(error => {
  output({ type: 'fatal', error: error instanceof Error ? error.message : String(error) });
  process.exit(1);
});
