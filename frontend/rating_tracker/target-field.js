const FIELD_CSS = '.tc-rating-target{display:flex;align-items:center;justify-content:space-between;gap:8px;min-height:36px;border-top:1px solid var(--tc-divider,#3a3a36);font:500 13px/20px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.tc-rating-target input{box-sizing:border-box;width:96px;min-width:0;height:32px;border:1px solid var(--tc-border,#3a3a36);border-radius:6px;padding:0 10px;background:#1d1d1b;color:#f2f2ee;font:inherit;font-variant-numeric:tabular-nums}.tc-rating-target input:focus-visible{outline:1px solid #b9bab3;outline-offset:2px}.tc-rating-target input[aria-invalid=true]{border-color:#e6ac72}';

function mountTarget({ window, host, request, id = 'tc-rating-target', installStyle = true }) {
  const document = window.document;
  const row = document.createElement('div'); row.className = 'tc-rating-target';
  const label = document.createElement('label'); label.htmlFor = id; label.textContent = 'Rating Goal';
  const input = document.createElement('input'); input.id = id; input.type = 'text'; input.inputMode = 'numeric'; input.autocomplete = 'off'; input.placeholder = 'Not set'; input.maxLength = 6;
  const style = document.createElement('style'); style.textContent = FIELD_CSS;
  row.append(label, input); host.append(row); if (installStyle) document.head.append(style);
  let dirty = false;
  let version = 0;
  let stopped = false;
  let saving = false;
  let queuedCommit = false;
  let mutationEpoch = 0;
  let saved = '';
  let timer;
  function apply(value) {
    saved = value.target === null ? '' : String(value.target);
    if (!dirty && !saving) input.value = saved;
  }
  async function refresh() {
    clearTimeout(timer);
    const started = version;
    const epoch = mutationEpoch;
    try { const value = await request('/rating-goals/target'); if (!stopped && started === version && epoch === mutationEpoch && !saving) apply(value); }
    catch (_) {}
    finally { if (!stopped) timer = setTimeout(refresh, 2000); }
  }
  async function commit() {
    if (stopped || !dirty) return;
    if (saving) { queuedCommit = true; return; }
    queuedCommit = false;
    const text = input.value.trim();
    if (text !== '' && (!/^\d+$/.test(text) || Number(text) > 100000)) {
      input.setAttribute('aria-invalid', 'true'); input.setCustomValidity('Enter a whole-number rating between 0 and 100,000.'); input.reportValidity(); return;
    }
    input.setAttribute('aria-invalid', 'false'); input.setCustomValidity('');
    const started = version;
    saving = true;
    mutationEpoch++;
    try {
      const value = await request('/rating-goals/target', { method: 'POST', body: { target: text === '' ? null : Number(text) } });
      if (!stopped && started === version) { dirty = false; apply(value); input.value = saved; input.removeAttribute('title'); }
    } catch (_) { if (!stopped) input.title = 'Not saved. Check the local server and press Enter to retry.'; }
    finally { saving = false; mutationEpoch++; if (!stopped && queuedCommit) void commit(); }
  }
  input.addEventListener('input', () => { dirty = true; version++; queuedCommit = false; input.removeAttribute('aria-invalid'); input.setCustomValidity(''); });
  input.addEventListener('blur', () => { if (dirty) void commit(); else input.value = saved; });
  input.addEventListener('keydown', event => { if (event.key === 'Enter') { event.preventDefault(); void commit(); } });
  void refresh();
  return { refresh, destroy() { stopped = true; clearTimeout(timer); row.remove(); style.remove(); } };
}

module.exports = { mountTarget };
