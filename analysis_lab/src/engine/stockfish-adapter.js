import { UciProtocol } from './uci-protocol.js';

const ENGINE_ROOT = 'engine/';
const ENGINE_MODULE = 'sf_19_smallnet.js';
const NNUE_FILE = 'nn-61e7af4bb97d.nnue';

function wasmSupported() {
  const header = Uint8Array.of(0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00);
  return typeof WebAssembly === 'object' && WebAssembly.validate(header);
}

function simdSupported() {
  const probe = Uint8Array.of(
    0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00,
    0x01, 0x05, 0x01, 0x60, 0x00, 0x01, 0x7b, 0x03,
    0x02, 0x01, 0x00, 0x0a, 0x0a, 0x01, 0x08, 0x00,
    0x41, 0x00, 0xfd, 0x0f, 0xfd, 0x62, 0x0b,
  );
  return wasmSupported() && WebAssembly.validate(probe);
}

function deviceMemoryMaximum() {
  const memory = Number(globalThis.navigator?.deviceMemory);
  if (!Number.isFinite(memory)) return 8192;
  if (memory >= 16) return 16384;
  if (memory >= 8) return 8192;
  if (memory >= 4) return 6144;
  return 4096;
}

function allocateSharedMemory(initial = 1536, maximum = deviceMemoryMaximum()) {
  let ceiling = maximum;
  let divisor = 4;
  while (true) {
    try {
      return new WebAssembly.Memory({ shared: true, initial, maximum: ceiling });
    } catch (error) {
      if (!(error instanceof RangeError) || ceiling <= initial) throw error;
      ceiling = Math.max(initial, Math.ceil(ceiling - ceiling / divisor));
      divisor = divisor === 4 ? 3 : 4;
    }
  }
}

export function browserEngineSupport() {
  const missing = [];
  if (!wasmSupported()) missing.push('WebAssembly');
  if (!simdSupported()) missing.push('WASM SIMD');
  if (typeof SharedArrayBuffer !== 'function') missing.push('SharedArrayBuffer');
  if (typeof Atomics !== 'object') missing.push('Atomics');
  if (!globalThis.crossOriginIsolated) missing.push('isolamento COOP/COEP');
  return { supported: missing.length === 0, missing };
}

export class StockfishAdapter {
  constructor(handlers = {}) {
    this.handlers = handlers;
    this.module = null;
    this.bootPromise = null;
    this.protocol = new UciProtocol({
      onEvaluation: handlers.onEvaluation,
      onSearchComplete: handlers.onSearchComplete,
      onSearchState: handlers.onSearchState,
      onState: handlers.onState,
      onError: handlers.onError,
    });
  }

  async boot() {
    if (this.module) return;
    if (this.bootPromise) return this.bootPromise;
    const support = browserEngineSupport();
    if (!support.supported) throw new Error(`Recursos ausentes: ${support.missing.join(', ')}`);
    this.bootPromise = this.load();
    try {
      await this.bootPromise;
    } finally {
      this.bootPromise = null;
    }
  }

  async load() {
    this.handlers.onState?.('loading');
    const baseUrl = new URL(import.meta.env.BASE_URL, globalThis.location.href);
    const engineUrl = file => new URL(`${ENGINE_ROOT}${file}`, baseUrl).href;
    const moduleUrl = engineUrl(ENGINE_MODULE);
    let engine = null;
    try {
      const factory = await import(/* @vite-ignore */ moduleUrl);
      engine = await factory.default({
        wasmMemory: allocateSharedMemory(),
        locateFile: file => engineUrl(file),
        mainScriptUrlOrBlob: moduleUrl,
      });
      engine.onError = message => this.handlers.onError?.(new Error(message));
      const networkResponse = await fetch(engineUrl(NNUE_FILE));
      if (!networkResponse.ok) throw new Error(`NNUE indisponível (${networkResponse.status})`);
      engine.setNnueBuffer(new Uint8Array(await networkResponse.arrayBuffer()));
      engine.listen = command => this.protocol.receive(command);
      this.protocol.connect(command => engine.uci(command));
      await this.protocol.waitUntilReady();
      this.module = engine;
    } catch (error) {
      this.protocol.disconnect();
      try {
        engine?.uci('quit');
      } catch {}
      throw error;
    }
  }

  analyze(work) {
    if (!this.module) throw new Error('A engine ainda não está pronta');
    this.protocol.compute(work);
  }

  stop() {
    this.protocol.stop();
  }

  destroy() {
    this.protocol.disconnect();
    this.module?.uci('quit');
    this.module = null;
  }

  get name() {
    return this.protocol.engineName;
  }
}
