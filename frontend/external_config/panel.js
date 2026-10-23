(() => {
  const controls = {
    core: [['hint', 'Bot'], ['autoMove', 'Auto Moves'], ['autoQueue', 'Auto Queue']],
    engine: [['autoAdjust', 'Auto Rating']],
    pacing: [['smartPacing', 'Smart Pacing']],
    visuals: [['evalBar', 'Evaluation Bar'], ['banner', 'Banner'], ['recentForm', 'Recent Form']],
    workspace: [['ghostMode', 'Hide On-Page Interface']],
  };
  const byId = id => document.getElementById(id);
  let config = null;
  let pending = {};
  let saving = false;
  let polling = false;
  let timer = null;
  let pollTimer = null;
  let editVersion = 0;
  const drafts = new Set();
  const invalid = new Set();

  function message(text, error = false) {
    byId('save-state').textContent = text;
    byId('save-state').dataset.error = String(error);
  }

  async function request(url, options = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    try {
      const response = await fetch(url, { ...options, signal: controller.signal, cache: 'no-store' });
      if (!response.ok) throw Object.assign(new Error('request-failed'), { status: response.status });
      return await response.json();
    } finally { clearTimeout(timeout); }
  }

  function render() {
    if (!config) return;
    byId('panels').setAttribute('aria-busy', 'false');
    document.querySelectorAll('[data-key]').forEach(node => {
      node.disabled = false;
      if (drafts.has(node.id) || node === document.activeElement && node.matches('input')) return;
      const value = config[node.dataset.key];
      if (node.matches('[role="switch"]')) node.setAttribute('aria-checked', String(value));
      else node.value = node.dataset.key.endsWith('Delay') ? Number(value).toFixed(2) : value;
    });
    byId('timing-fields').disabled = false;
    const immediate = config.delayMode === 'max';
    ['minDelay', 'maxDelay'].forEach(id => {
      byId(id).disabled = immediate;
      if (immediate) byId(id).value = '0.00';
    });
    document.querySelectorAll('[data-mode]').forEach(node => node.setAttribute('aria-pressed', String(node.dataset.mode === config.delayMode)));
    byId('elo-value').textContent = config.elo;
    byId('elo').style.setProperty('--range-fill', `calc(${(config.elo - 800) / 2400} * (100% - 16px) + 8px)`);
    byId('timing-value').textContent = immediate ? 'Immediate' : `${Number(config.minDelay).toFixed(2)}–${Number(config.maxDelay).toFixed(2)} s`;
  }

  function queue(patch) {
    if (!config) return;
    editVersion++;
    Object.assign(pending, patch);
    Object.assign(config, patch);
    render();
    message('Saving changes…');
    clearTimeout(timer);
    timer = setTimeout(save, 200);
  }

  async function save() {
    if (saving || !Object.keys(pending).length) return;
    saving = true;
    const patch = pending;
    pending = {};
    const version = editVersion;
    try {
      const response = await request('/config/save', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch),
      });
      if (!response.ok || !response.config) throw new Error('invalid-response');
      if (version === editVersion) config = response.config;
      message(Object.keys(pending).length ? 'Saving changes…' : 'Saved to server · waiting for Chess.com');
      render();
    } catch (error) {
      pending = { ...patch, ...pending };
      const permanent = error.status === 400 || error.status === 403;
      message(permanent ? 'Settings were rejected. Review the values and try again.' : 'Could not save. Check the local server; changes will retry.', true);
      if (!permanent) timer = setTimeout(save, 2500);
    } finally {
      saving = false;
      if (Object.keys(pending).length && version !== editVersion) {
        clearTimeout(timer);
        timer = setTimeout(save, 200);
      }
    }
  }

  async function poll() {
    if (polling) return;
    polling = true;
    const version = editVersion;
    try {
      const [next, status] = await Promise.all([request('/config/load'), request('/config/status')]);
      if (!saving && !Object.keys(pending).length && version === editVersion &&
          (!config || next._serverId !== config._serverId || next._revision >= config._revision)) {
        config = next;
        render();
        if (!drafts.size && !invalid.size) message(status.applied && status.revision === next._revision ? 'Applied in a Chess.com tab' : 'Saved to server · waiting for Chess.com');
      }
      const synced = status.userscriptConnected;
      document.querySelector('.connection').dataset.state = synced ? 'synced' : 'waiting';
      byId('connection').textContent = synced ? 'Chess.com tab connected' : 'Waiting for Chess.com';
    } catch (_) {
      document.querySelector('.connection').dataset.state = 'offline';
      byId('connection').textContent = 'Local server offline';
      message('Cannot reach the local server. Check that it is running.', true);
    } finally {
      polling = false;
      clearTimeout(pollTimer);
      pollTimer = setTimeout(poll, 2000);
    }
  }

  Object.entries(controls).forEach(([group, items]) => {
    const host = document.querySelector(`[data-controls="${group}"]`);
    items.forEach(([key, label]) => {
      const row = document.createElement('div');
      row.className = 'control-row';
      const caption = document.createElement('span');
      caption.id = `${key}-label`;
      caption.textContent = label;
      const toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'switch';
      toggle.dataset.key = key;
      toggle.setAttribute('role', 'switch');
      toggle.setAttribute('aria-checked', 'false');
      toggle.setAttribute('aria-labelledby', caption.id);
      toggle.disabled = true;
      toggle.addEventListener('click', () => queue({ [key]: toggle.getAttribute('aria-checked') !== 'true' }));
      row.append(caption, toggle);
      host.append(row);
    });
  });

  function commitTiming() {
    if (!config || config.delayMode === 'max') return;
    if (!drafts.size) { render(); return; }
    const keys = ['minDelay', 'maxDelay'];
    const values = keys.map(id => drafts.has(id) ? byId(id).value.trim().replace(',', '.') : String(config[id]));
    invalid.clear();
    values.forEach((value, index) => {
      const bad = !/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(value) || !Number.isFinite(Number(value));
      byId(keys[index]).setAttribute('aria-invalid', String(bad));
      if (bad) invalid.add(keys[index]);
    });
    if (invalid.size) {
      message('Enter a delay between 0.01 and 10 seconds.', true);
      return;
    }
    drafts.clear();
    const [minDelay, maxDelay] = values.map(value => Math.min(10, Math.max(0.01, Number(value)))).sort((a, b) => a - b);
    if (minDelay !== config.minDelay || maxDelay !== config.maxDelay) queue({ minDelay, maxDelay });
    ['minDelay', 'maxDelay'].forEach(id => { byId(id).value = (id === 'minDelay' ? minDelay : maxDelay).toFixed(2); });
  }
  ['minDelay', 'maxDelay'].forEach(id => {
    byId(id).setAttribute('aria-describedby', 'save-state');
    byId(id).addEventListener('input', () => { drafts.add(id); message('Unsaved timing edit · press Enter or leave the field to apply'); });
    byId(id).addEventListener('blur', commitTiming);
    byId(id).addEventListener('keydown', event => {
      if (event.key === 'Enter') { event.preventDefault(); commitTiming(); byId(id).blur(); }
    });
  });
  document.querySelectorAll('[data-mode]').forEach(node => node.addEventListener('click', () => {
    const discarded = node.dataset.mode === 'max' && drafts.size > 0;
    if (node.dataset.mode === 'max') {
      drafts.clear();
      invalid.clear();
      ['minDelay', 'maxDelay'].forEach(id => byId(id).setAttribute('aria-invalid', 'false'));
    }
    queue({ delayMode: node.dataset.mode });
    if (discarded) message('Unsaved timing edit discarded · saving Immediate mode…');
  }));
  byId('elo').addEventListener('input', event => queue({ elo: Number(event.target.value) }));
  byId('color').addEventListener('input', event => queue({ color: event.target.value }));
  byId('retry').addEventListener('click', () => { clearTimeout(timer); save(); poll(); });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) poll(); });
  window.addEventListener('online', () => { save(); poll(); });
  document.addEventListener('pointerdown', () => { document.body.dataset.focusInput = 'pointer'; }, true);
  document.addEventListener('keydown', event => { if (event.key === 'Tab') document.body.dataset.focusInput = 'keyboard'; }, true);
  poll();
})();
