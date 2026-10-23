function createTransport({ baseUrl = 'http://127.0.0.1:5050', gmRequest, fetch = globalThis.fetch, timeoutMs = 8000 } = {}) {
  const allowed = new URL(baseUrl);
  if (!['127.0.0.1', 'localhost', '[::1]'].includes(allowed.hostname) || allowed.protocol !== 'http:') throw new Error('Tracker requires a loopback server');
  const active = new Set();
  async function request(path, { method = 'GET', body, signal } = {}) {
    if (!/^\/rating-(?:goals|observations|games|notifications)(?:[/?]|$)/.test(path)) throw new Error('Invalid tracker route');
    const url = allowed.origin + path;
    if (signal?.aborted) throw new Error('Request cancelled');
    if (typeof gmRequest === 'function') return new Promise((resolve, reject) => {
      let handle;
      let settled = false;
      const finish = (error, value) => {
        if (settled) return;
        settled = true;
        active.delete(cancel);
        signal?.removeEventListener('abort', cancel);
        error ? reject(error) : resolve(value);
      };
      const cancel = () => { handle?.abort(); finish(new Error('Request cancelled')); };
      active.add(cancel);
      signal?.addEventListener('abort', cancel, { once: true });
      handle = gmRequest({ method, url, timeout: timeoutMs, responseType: 'text', headers: { 'Content-Type': 'application/json' }, ...(body === undefined ? {} : { data: JSON.stringify(body) }),
        onload(response) {
          if (response.status < 200 || response.status >= 300) return finish(Object.assign(new Error('Tracker request failed'), { status: response.status }));
          try { finish(null, JSON.parse(response.responseText)); } catch (_) { finish(new Error('Invalid tracker response')); }
        }, ontimeout: () => finish(new Error('Tracker request timed out')), onerror: () => finish(new Error('Tracker server unavailable')), onabort: () => finish(new Error('Request cancelled')) });
      if (settled) active.delete(cancel);
    });
    const controller = new AbortController();
    const cancel = () => controller.abort();
    const timer = setTimeout(cancel, timeoutMs);
    active.add(cancel);
    signal?.addEventListener('abort', cancel, { once: true });
    try {
      const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, ...(body === undefined ? {} : { body: JSON.stringify(body) }), signal: controller.signal, cache: 'no-store' });
      if (!response.ok) throw Object.assign(new Error('Tracker request failed'), { status: response.status });
      return await response.json();
    } finally { clearTimeout(timer); active.delete(cancel); signal?.removeEventListener('abort', cancel); }
  }
  return { request, destroy() { [...active].forEach(cancel => cancel()); } };
}

function createOutbox({ storage, transport, key = 'tc_rating_tracker_outbox_v1', onError = () => {}, now = Date.now } = {}) {
  let queue = [];
  try { const saved = JSON.parse(storage.getItem(key) || '[]'); if (Array.isArray(saved)) queue = saved.filter(item => item && typeof item.id === 'string' && ['/rating-games/terminal', '/rating-observations/dom'].includes(item.path)).slice(-100); } catch (_) { onError('outbox-read-failed'); }
  let flushing = false;
  let destroyed = false;
  let timer;
  let attempts = 0;
  const save = () => { try { storage.setItem(key, JSON.stringify(queue)); } catch (_) { onError('outbox-save-failed'); } };
  async function flush() {
    if (flushing || destroyed || !queue.length) return;
    flushing = true;
    try {
      while (queue.length && !destroyed) {
        const item = queue[0];
        try { await transport.request(item.path, { method: 'POST', body: item.body }); }
        catch (error) {
          if ([400, 403, 404, 409, 422].includes(error.status)) { queue.shift(); save(); onError('evidence-rejected'); continue; }
          attempts++;
          onError('evidence-awaiting-server');
          timer = setTimeout(flush, Math.min(300000, 5000 * 2 ** Math.min(attempts, 6)));
          return;
        }
        queue = queue.filter(value => value.id !== item.id);
        attempts = 0;
        save();
      }
    } finally { flushing = false; }
  }
  return {
    enqueue(path, body, id) {
      if (destroyed || queue.some(item => item.id === id)) return;
      if (queue.length >= 100) { onError('outbox-full'); return; }
      queue.push({ path, body, id, createdAtMs: now() });
      save();
      void flush();
    }, flush,
    get size() { return queue.length; },
    destroy() { destroyed = true; clearTimeout(timer); }
  };
}

module.exports = { createTransport, createOutbox };
