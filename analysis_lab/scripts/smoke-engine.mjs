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

const scholarMode = process.argv.includes('--scholar');
const scholarFen = 'rnbqkbnr/1ppp1pp1/p6p/4p3/2B1P3/P4Q2/1PPP1PPP/RNB1K1NR b KQkq - 1 4';

let result;
try {
  result = await new Promise((resolveResult, reject) => {
    const timeout = setTimeout(() => reject(new Error('Stockfish smoke test timed out')), scholarMode ? 30000 : 15000);
    engine.onError = message => {
      clearTimeout(timeout);
      reject(new Error(message));
    };
    engine.listen = line => {
      if (line === 'uciok') {
        engine.uci('setoption name UCI_AnalyseMode value true');
        engine.uci('ucinewgame');
        if (scholarMode) {
          engine.uci('setoption name Threads value 2');
          engine.uci('setoption name Hash value 64');
          engine.uci('setoption name MultiPV value 2');
        }
        engine.uci('isready');
      } else if (line === 'readyok') {
        engine.uci(scholarMode ? `position fen ${scholarFen}` : 'position startpos');
        engine.uci(`go movetime ${scholarMode ? 3000 : 150}`);
      } else if (line.startsWith('bestmove ')) {
        clearTimeout(timeout);
        resolveResult(line);
      }
    };
    engine.uci('uci');
  });
} finally {
  engine.uci('quit');
}
const [, bestMove] = result.split(/\s+/);
if (scholarMode && bestMove !== 'g8f6') throw new Error(`Expected g8f6 in reported position, received: ${result}`);
console.log(result);
