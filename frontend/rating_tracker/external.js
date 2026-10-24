const { mountTarget } = require('./target-field');

function mount(document, window) {
  const host = document.getElementById('rating-target-field');
  if (!host) return;
  const active = new Set();
  const field = mountTarget({ window, host, installStyle: false, request: async (path, options = {}) => {
    const controller = new AbortController(); active.add(controller);
    const timer = setTimeout(() => controller.abort(), 8000);
    try {
      const response = await window.fetch(path, { method: options.method || 'GET', cache: 'no-store', signal: controller.signal, headers: { 'Content-Type': 'application/json' }, ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }) });
      if (!response.ok) throw new Error('Rating goal unavailable');
      return await response.json();
    } finally { clearTimeout(timer); active.delete(controller); }
  } });
  window.addEventListener('pagehide', event => { if (!event.persisted) { field.destroy(); active.forEach(controller => controller.abort()); } });
}

if (typeof document !== 'undefined') mount(document, window);
module.exports = { mount };
