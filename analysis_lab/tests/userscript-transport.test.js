import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import vm from 'node:vm';
import { describe, expect, it } from 'vitest';

const userscript = readFileSync(resolve(process.cwd(), '..', 'script.js'), 'utf8');
const transportSource = userscript.slice(
  userscript.indexOf('  function requestEvalBarV2('),
  userscript.indexOf('  function ensureEvalBarV2()'),
);

function createTransport(gmRequest, diagnosticEvents = []) {
  return Function('dependencies', `
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
    SERVER_URL: 'http://127.0.0.1:5000',
    GM_xmlhttpRequest: gmRequest,
    engineRequestHeaders: () => ({ Authorization: 'Bearer secret', 'Content-Type': 'application/json' }),
    evalBarAuthorization: () => 'analysis',
    evalBarClientId: 'client',
    handleEngineUnauthorized: response => Number(response?.status) === 401,
    reportEvalBarDiagnostic: (stage, value) => diagnosticEvents.push({ stage, value }),
    setEvalBarTransportDiagnostic: (stage, value) => diagnosticEvents.push({ stage: `transport:${stage}`, value }),
  });
}

function event(type, sequence, extra = {}) {
  return {
    requestId: 'eval-v2:client:7',
    generation: 3,
    cacheContext: 'context-v1',
    fen: '8/8/8/8/8/8/4K3/7k w - - 0 1',
    perspective: 'white',
    type,
    sequence,
    status: type === 'result' ? 'complete' : 'searching',
    ...extra,
  };
}

function requestOptions(callbacks) {
  return {
    fen: '8/8/8/8/8/8/4K3/7k w - - 0 1',
    generation: 3,
    requestId: 7,
    cacheContext: 'context-v1',
    ...callbacks,
  };
}

describe('production Tampermonkey Eval Bar transport', () => {
  it('reads fragmented UTF-8 NDJSON from the Tampermonkey ReadableStream exactly once', async () => {
    const payload = [
      event('started', 1),
      event('info', 2, { cp: 12, mate: null, depth: 4, detail: 'rápida' }),
      event('info', 3, { cp: 28, mate: null, depth: 8 }),
      event('result', 4, { cp: 35, mate: null, depth: 12 }),
    ].map(value => `${JSON.stringify(value)}\n`).join('');
    const encoded = new TextEncoder().encode(payload);
    const accentedByte = encoded.findIndex((value, index) => value === 0xc3 && encoded[index + 1] === 0xa1);
    const chunks = [
      encoded.slice(0, 19),
      encoded.slice(19, accentedByte + 1),
      encoded.slice(accentedByte + 1, accentedByte + 37),
      encoded.slice(accentedByte + 37),
    ];
    let captured;
    const gmRequest = options => {
      captured = options;
      queueMicrotask(() => {
        options.onloadstart({
          status: 200,
          response: new ReadableStream({
            start(controller) {
              for (const chunk of chunks) controller.enqueue(chunk);
              controller.close();
            },
          }),
        });
        options.onload({ status: 200, responseText: payload });
      });
      return { abort() {} };
    };
    const progress = [];
    const errors = [];
    const result = await new Promise(resolve => {
      createTransport(gmRequest)(requestOptions({
        onProgress: value => progress.push(value),
        onResult: resolve,
        onError: error => errors.push(error),
      }));
    });

    expect(captured.responseType).toBe('stream');
    expect(typeof captured.onloadstart).toBe('function');
    expect(progress.map(value => [value.type, value.depth])).toEqual([
      ['started', undefined],
      ['info', 4],
      ['info', 8],
    ]);
    expect(result.depth).toBe(12);
    expect(errors).toEqual([]);
  });

  it('uses the complete onload body as a legacy fallback without duplicate events', async () => {
    const payload = [
      event('info', 1, { cp: -10, mate: null, depth: 5 }),
      event('result', 2, { cp: -15, mate: null, depth: 9 }),
    ].map(value => `${JSON.stringify(value)}\n`).join('');
    const gmRequest = options => {
      queueMicrotask(() => options.onload({ status: 200, responseText: payload }));
      return { abort() {} };
    };
    const progress = [];
    const result = await new Promise(resolve => {
      createTransport(gmRequest)(requestOptions({
        onProgress: value => progress.push(value),
        onResult: resolve,
        onError: error => { throw error; },
      }));
    });

    expect(progress.map(value => value.depth)).toEqual([5]);
    expect(result.depth).toBe(9);
  });

  it('falls back to the final body when the stream reader cannot be acquired', async () => {
    const payload = `${JSON.stringify(event('result', 1, { cp: 8, mate: null, depth: 7 }))}\n`;
    const diagnostics = [];
    const gmRequest = options => {
      queueMicrotask(() => {
        options.onloadstart({ status: 200, response: { getReader: () => { throw new Error('locked stream'); } } });
        options.onload({ status: 200, responseText: payload });
      });
      return { abort() {} };
    };
    const result = await new Promise((resolve, reject) => {
      createTransport(gmRequest, diagnostics)(requestOptions({
        onProgress() {},
        onResult: resolve,
        onError: reject,
      }));
    });

    expect(result.depth).toBe(7);
    expect(diagnostics.some(entry => entry.stage === 'stream-init-error')).toBe(true);
  });

  it('preserves an HTTP stream error instead of misclassifying it as an identity failure', async () => {
    const gmRequest = options => {
      queueMicrotask(() => options.onloadstart({
        status: 503,
        response: new ReadableStream({
          start(controller) {
            controller.enqueue(new TextEncoder().encode('{"error":"stockfish unavailable"}'));
            controller.close();
          },
        }),
      }));
      return { abort() {} };
    };
    const error = await new Promise(resolve => {
      createTransport(gmRequest)(requestOptions({
        onProgress() {},
        onResult() {},
        onError: resolve,
      }));
    });

    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('stockfish unavailable (HTTP 503)');
  });

  it.each([
    [401, 'invalid_capability', 'invalid_capability (HTTP 401)'],
    [403, 'origin_not_allowed', 'origin_not_allowed (HTTP 403)'],
  ])('preserves HTTP %i authentication details', async (status, detail, expected) => {
    const gmRequest = options => {
      queueMicrotask(() => options.onloadstart({
        status,
        response: new ReadableStream({
          start(controller) {
            controller.enqueue(new TextEncoder().encode(JSON.stringify({ error: detail })));
            controller.close();
          },
        }),
      }));
      return { abort() {} };
    };
    const error = await new Promise(resolve => {
      createTransport(gmRequest)(requestOptions({ onProgress() {}, onResult() {}, onError: resolve }));
    });

    expect(error.message).toBe(expected);
  });

  it('preserves a buffered fallback 401 response body and status', async () => {
    const gmRequest = options => {
      queueMicrotask(() => options.onload({
        status: 401,
        responseText: JSON.stringify({ error: 'invalid_capability' }),
      }));
      return { abort() {} };
    };
    const error = await new Promise(resolve => {
      createTransport(gmRequest)(requestOptions({ onProgress() {}, onResult() {}, onError: resolve }));
    });

    expect(error.message).toBe('invalid_capability (HTTP 401)');
  });

  it('settles only once when a stream interruption is followed by a transport callback', async () => {
    let captured;
    const gmRequest = options => {
      captured = options;
      queueMicrotask(() => options.onloadstart({
        status: 200,
        response: new ReadableStream({
          start(controller) {
            controller.error(new Error('stream interrupted'));
          },
        }),
      }));
      return { abort() {} };
    };
    const errors = [];
    createTransport(gmRequest)(requestOptions({
      onProgress() {},
      onResult() {},
      onError: error => errors.push(error),
    }));
    await new Promise(resolve => setTimeout(resolve, 0));
    captured.onerror(new Error('duplicate transport error'));

    expect(errors).toHaveLength(1);
    expect(errors[0].message).toBe('stream interrupted');
  });

  it('cancels a pending reader and reports a timeout only once', async () => {
    let captured;
    let readerCancelled = false;
    const gmRequest = options => {
      captured = options;
      queueMicrotask(() => options.onloadstart({
        status: 200,
        response: new ReadableStream({
          cancel() {
            readerCancelled = true;
          },
        }),
      }));
      return { abort() {} };
    };
    const errors = [];
    createTransport(gmRequest)(requestOptions({
      onProgress() {},
      onResult() {},
      onError: error => errors.push(error),
    }));
    await new Promise(resolve => setTimeout(resolve, 0));
    captured.ontimeout();
    captured.onerror(new Error('late transport error'));
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(readerCancelled).toBe(true);
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toBe('Eval timeout');
    expect(errors[0].elapsedMs).toBeTypeOf('number');
  });

  it('settles intentional cancellation before the transport abort callback', () => {
    let request;
    let transportAborts = 0;
    let cancelRequests = 0;
    const gmRequest = options => {
      if (options.url.endsWith('/eval-bar/cancel')) {
        cancelRequests += 1;
        return { abort() {} };
      }
      request = options;
      return {
        abort() {
          transportAborts += 1;
          request.onabort();
        },
      };
    };
    const errors = [];
    const handle = createTransport(gmRequest)(requestOptions({
      onProgress() {},
      onResult() {},
      onError: error => errors.push(error),
    }));
    handle.abort();
    handle.abort();

    expect(cancelRequests).toBe(1);
    expect(transportAborts).toBe(1);
    expect(errors).toEqual([]);
  });

  it('reports a spontaneous transport abort exactly once', () => {
    let captured;
    const errors = [];
    const gmRequest = options => {
      captured = options;
      return { abort() {} };
    };
    createTransport(gmRequest)(requestOptions({
      onProgress() {},
      onResult() {},
      onError: error => errors.push(error),
    }));
    captured.onabort();
    captured.onabort();

    expect(errors).toHaveLength(1);
    expect(errors[0].message).toBe('Eval request aborted');
  });

  it('rejects truncated NDJSON and identifies the mismatched correlation field', async () => {
    const malformedRequest = options => {
      queueMicrotask(() => options.onload({ status: 200, responseText: '{"type":"info"' }));
      return { abort() {} };
    };
    const malformed = await new Promise(resolve => {
      createTransport(malformedRequest)(requestOptions({ onProgress() {}, onResult() {}, onError: resolve }));
    });
    expect(malformed).toBeInstanceOf(SyntaxError);

    const wrongFen = `${JSON.stringify(event('result', 1, { fen: 'wrong-fen', cp: 0, mate: null, depth: 1 }))}\n`;
    const mismatchedRequest = options => {
      queueMicrotask(() => options.onload({ status: 200, responseText: wrongFen }));
      return { abort() {} };
    };
    const mismatch = await new Promise(resolve => {
      createTransport(mismatchedRequest)(requestOptions({ onProgress() {}, onResult() {}, onError: resolve }));
    });
    expect(mismatch.message).toBe('Eval response identity mismatch: fen');
  });

  it('publishes redacted diagnostics into the page realm from an isolated sandbox', () => {
    const bridgeSource = userscript.slice(
      userscript.indexOf('  const evalBarPageWindow ='),
      userscript.indexOf('  function syncEvalBarRenderer()'),
    );
    const pageWorld = {};
    const sandboxWindow = {};
    const context = {
      unsafeWindow: pageWorld,
      window: sandboxWindow,
      getEvalBarDiagnostics: () => ({
        route: '/analysis/collection/example/analysis?move=18',
        boardFound: true,
        fen: '8/8/8/8/8/8/4K3/7k w - - 0 1',
        authorization: 'analysis',
        token: 'must-not-leak',
        transport: { stage: 'stream-info', status: 200, depth: 12, secret: 'must-not-leak' },
        adapter: { state: 'connected', headers: { Authorization: 'Bearer secret' } },
      }),
      krypbotSetEvalBarDiagnostics: () => undefined,
    };
    vm.runInNewContext(bridgeSource, context);

    expect(sandboxWindow.krypbotEvalBarDiagnostics).toBeUndefined();
    expect(pageWorld.krypbotEvalBarDiagnostics).toBeTypeOf('function');
    const snapshot = pageWorld.krypbotEvalBarDiagnostics();
    expect(snapshot.route).toContain('/analysis/collection/');
    expect(snapshot.adapter.state).toBe('connected');
    expect(snapshot).not.toHaveProperty('token');
    expect(snapshot.adapter).not.toHaveProperty('headers');
    expect(snapshot.transport).toEqual({
      stage: 'stream-info',
      status: 200,
      elapsedMs: undefined,
      eventType: undefined,
      depth: 12,
      error: undefined,
    });
    expect(JSON.stringify(snapshot)).not.toContain('secret');
  });
});
