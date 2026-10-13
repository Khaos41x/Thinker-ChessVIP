import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const engineRoot = resolve(here, '..', 'public', 'engine');
const modulePath = resolve(engineRoot, 'sf_19_smallnet.js');
const moduleUrl = pathToFileURL(modulePath).href;
const factory = await import(moduleUrl);
const memory = new WebAssembly.Memory({ shared: true, initial: 1536, maximum: 32767 });
const engine = await factory.default({
  wasmMemory: memory,
  locateFile: file => resolve(engineRoot, file),
  mainScriptUrlOrBlob: modulePath,
});

const networkName = engine.getRecommendedNnue();
if (networkName !== 'nn-61e7af4bb97d.nnue') throw new Error(`Unexpected NNUE: ${networkName}`);
engine.setNnueBuffer(new Uint8Array(await readFile(resolve(engineRoot, networkName))));

const result = await new Promise((resolveResult, reject) => {
  const timeout = setTimeout(() => reject(new Error('Stockfish smoke test timed out')), 15000);
  engine.onError = message => {
    clearTimeout(timeout);
    reject(new Error(message));
  };
  engine.listen = line => {
    if (line === 'uciok') {
      engine.uci('isready');
    } else if (line === 'readyok') {
      engine.uci('position startpos');
      engine.uci('go movetime 150');
    } else if (line.startsWith('bestmove ')) {
      clearTimeout(timeout);
      resolveResult(line);
    }
  };
  engine.uci('uci');
});

engine.uci('quit');
console.log(result);
