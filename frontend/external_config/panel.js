(() => {
  const controls = {
    core: [['hint', 'Bot'], ['autoMove', 'Auto Moves'], ['autoQueue', 'Auto Queue']],
    engine: [['autoAdjust', 'Auto Rating']],
    pacing: [['smartPacing', 'Smart Pacing']],
    visuals: [['evalBar', 'Evaluation Bar'], ['banner', 'Banner'], ['recentForm', 'Recent Form']],
    workspace: [['ghostMode', 'Clean View']],
  };
  const byId = id => document.getElementById(id);
  let config = null;
  let engineRegistry = null;
  let engineSwitching = false;
  let engineRefreshing = false;
  let engineError = null;
  let engineOnline = false;
  let engineRequestVersion = 0;
  let sessionProjection = null;
  let sessionBusy = false;
  let sessionError = null;
  const sessionApi = globalThis.ThinkerSessionControl;
  let pending = {};
  let saving = false;
  let polling = false;
  let timer = null;
  let pollTimer = null;
  let editVersion = 0;
  const drafts = new Set();
  const invalid = new Set();

  function message(text, error = false) {
    if (config?._persistenceError && !error) { text = config._persistenceError; error = true; }
    byId('save-state').textContent = text;
    byId('save-state').dataset.error = String(error);
  }

  async function request(url, options = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeoutMs || 4000);
    try {
      const response = await fetch(url, { ...options, signal: controller.signal, cache: 'no-store' });
      let data;
      try { data = await response.json(); }
      catch (_) { throw Object.assign(new Error('Invalid server response'), { status: response.status }); }
      if (!response.ok) throw Object.assign(new Error(data.error || 'request-failed'), { status: response.status, data });
      return data;
    } finally { clearTimeout(timeout); }
  }


  function renderEngine() {
    const select = byId('analysis-engine');
    const selected = engineRegistry?.engines.find(engine => engine.id === engineRegistry.selectedEngineId);
    if (!engineSwitching && engineRegistry) select.value = engineRegistry.selectedEngineId;
    select.disabled = !engineOnline || engineSwitching || !engineRegistry;
    for (const option of select.options) {
      const engine = engineRegistry?.engines.find(item => item.id === option.value);
      option.disabled = engine ? !engine.installed : false;
    }
    const active = selected?.runtimeReady && engineRegistry?.analysisContextAuthorized;
    const state = engineSwitching ? 'Switching' : engineRefreshing && (!engineOnline || engineError) ? 'Initializing' : engineError ? (!engineOnline && engineRegistry ? 'Connection Lost' : 'Error') : !selected ? 'Initializing' : !selected.installed ? 'Unavailable' : selected.initializationError ? 'Error' : active ? 'Active' : 'Ready';
    byId('analysis-engine-state').textContent = state;
    byId('analysis-engine-message').textContent = engineError || (engineSwitching ? 'Saving engine preference…' : selected?.initializationError || (active ? 'Running in an authorized analysis context.' : selected ? `${selected.description || 'Preference saved.'} Analysis starts only in an authorized context.` : 'Checking installed engines…'));
    byId('analysis-engine-message').dataset.error = String(Boolean(engineError || selected?.initializationError));
    byId('analysis-engine-message').title = byId('analysis-engine-message').textContent;
    byId('engine-retry').hidden = !engineError && !selected?.initializationError;
    byId('engine-retry').disabled = engineRefreshing || engineSwitching;
    byId('analysis-engine-details').textContent = selected ? JSON.stringify(selected, null, 2) : '';
    byId('execution-state').textContent = `Analysis: ${!engineOnline ? 'unavailable' : engineRegistry?.analysisRunning ? 'running' : 'inactive'}`;
  }

  function registryFailure(error) {
    engineOnline = false;
    engineError = error.status === 404 ? 'Engine registry unavailable. Restart the local server, then Retry.' : 'Engine registry unavailable. Check the local server, then Retry.';
    renderEngine();
  }

  async function refreshEngines(clearError = false) {
    if (engineRefreshing) return;
    engineRefreshing = true;
    renderEngine();
    const version = engineRequestVersion;
    try {
      const engines = await request('/config/engines');
      if (!Array.isArray(engines.engines) || !engines.selectedEngineId) throw new Error('Invalid registry response');
      if (!engineSwitching && version === engineRequestVersion) {
        engineRegistry = engines; engineOnline = true;
        if (clearError || !engineError?.startsWith('Could not save')) engineError = null;
        renderEngine();
      }
    } catch (error) { if (!engineSwitching && version === engineRequestVersion) registryFailure(error); }
    finally { engineRefreshing = false; renderEngine(); }
  }

  byId('analysis-engine').addEventListener('change', async event => {
    if (engineSwitching || !engineRegistry) return;
    const engineId = event.target.value;
    engineSwitching = true; engineError = null; engineRequestVersion++;
    renderEngine();
    try {
      const result = await request('/config/engines/select', { method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ engineId, expectedRevision: engineRegistry.preferenceRevision }) });
      if (!result.ok || result.selectedEngineId !== engineId) throw new Error('Preference was not acknowledged');
      engineRegistry = result; engineOnline = true;
    } catch (error) {
      if (error.data?.engines) engineRegistry = error.data;
      engineError = `Could not save engine preference: ${error.message}. Previous saved preference retained.`;
      if (!error.status) engineOnline = false;
    } finally { engineSwitching = false; renderEngine(); }
  });
  byId('engine-retry').addEventListener('click', () => refreshEngines(true));

  const sessionReasons = {
    BOT_DISABLED: 'Enable Bot in Core to start a session.', ROLLOUT_DISABLED: 'Session Control is disabled in this userscript.',
    ACTIVE_SESSION_EXISTS: 'A session is already running.', SESSION_NOT_ACTIVE: 'No session is running.',
    STATUS_UNAVAILABLE: 'Session status is unavailable. Reconnect the Chess.com userscript.',
    SESSION_TARGETS_UNSET: 'Configure both win-rate targets before starting a session.',
  };
  function renderSession(projection) {
    sessionProjection = projection;
    const panel = byId('kb-session-panel');
    const autoQueue = document.querySelector('[data-key="autoQueue"]');
    if (autoQueue && config) {
      const sessionOwnsQueue = Boolean(projection?.status && !['IDLE', 'COMPLETED', 'ABORTED'].includes(projection.status.phase));
      autoQueue.disabled = sessionOwnsQueue;
      autoQueue.setAttribute('aria-disabled', String(sessionOwnsQueue));
      autoQueue.setAttribute('aria-checked', String(sessionOwnsQueue || config.autoQueue));
      autoQueue.title = sessionOwnsQueue ? 'Auto Play controls the queue until this session ends. Your saved preference is unchanged.' : '';
    }
    if (projection?.status) {
      sessionApi.presentStatus(panel, projection.status, sessionApi.formatDuration, projection.availability.start);
      for (const action of ['start', 'stop', 'export']) {
        const node = panel.querySelector(`[data-action="${action}"]`);
        const reason = projection.availability[action];
        node.disabled = sessionBusy || Boolean(reason);
        node.setAttribute('aria-disabled', String(node.disabled));
        node.title = reason ? sessionReasons[reason] || reason : '';
      }
    } else {
      panel.querySelectorAll('[data-action]').forEach(node => { node.disabled = true; node.setAttribute('aria-disabled', 'true'); });
      byId('kb-session-phase').textContent = 'Unavailable';
      ['kb-session-ttl', 'kb-session-observed', 'kb-session-raw'].forEach(id => { byId(id).textContent = '—'; });
    }
    const reason = projection?.availability.start;
    byId('session-availability').textContent = sessionError || (sessionBusy ? 'Waiting for the Chess.com session acknowledgement…' : !projection ? 'Open Chess.com with the userscript to use session actions. Settings remain editable.' : reason && reason !== 'ACTIVE_SESSION_EXISTS' ? sessionReasons[reason] || reason : 'Session actions run through the connected Chess.com workspace.');
    byId('session-availability').dataset.error = String(Boolean(sessionError));
  }
  function downloadDiagnostic(value) {
    const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a'); link.href = url; link.download = `thinker-session-diagnostic-${Date.now()}.json`; link.click(); URL.revokeObjectURL(url);
  }
  byId('kb-session-panel').addEventListener('click', async event => {
    const button = event.target.closest('[data-action]');
    if (!button || button.disabled || sessionBusy) return;
    if (saving || Object.keys(pending).length || drafts.size) {
      sessionError = 'Save all settings before starting a session action.'; renderSession(sessionProjection); return;
    }
    sessionBusy = true; sessionError = null; renderSession(sessionProjection);
    try {
      const id = crypto.randomUUID();
      await request('/config/session/commands', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ id, action: button.dataset.action, configRevision: config._revision, serverId: config._serverId }) });
      const deadline = Date.now() + 12000;
      let result;
      while (Date.now() < deadline) {
        result = await request('/config/session/commands/' + id);
        if (result.state === 'completed' || result.state === 'error') break;
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      if (result?.state !== 'completed') throw new Error(result?.error || 'No acknowledgement. Check the session before retrying.');
      if (button.dataset.action === 'export') downloadDiagnostic(result.result);
    } catch (error) { sessionError = error.message; }
    finally { sessionBusy = false; renderSession(sessionProjection); poll(); }
  });

  function render() {
    if (!config) return;
    byId('panels').setAttribute('aria-busy', 'false');
    if (config._persistenceError) message(config._persistenceError, true);
    document.querySelectorAll('[data-key]').forEach(node => {
      node.disabled = false;
      if (drafts.has(node.id) || node === document.activeElement && node.matches('input')) return;
      const value = config[node.dataset.key];
      if (node.matches('[role="switch"]')) node.setAttribute('aria-checked', String(value));
      else node.value = node.dataset.key.endsWith('Delay') ? Number(value).toFixed(2) : value;
    });
    byId('timing-fields').disabled = config.smartPacing;
    byId('timing-fields').closest('.timing').hidden = config.smartPacing;
    const immediate = config.delayMode === 'max';
    ['minDelay', 'maxDelay'].forEach(id => {
      byId(id).disabled = immediate || config.smartPacing;
      if (immediate) byId(id).value = '0.00';
    });
    document.querySelectorAll('[data-mode]').forEach(node => node.setAttribute('aria-pressed', String(node.dataset.mode === config.delayMode)));
    byId('elo-value').textContent = config.elo;
    byId('elo').style.setProperty('--range-fill', `calc(${(config.elo - 800) / 2400} * (100% - 16px) + 8px)`);
    byId('timing-value').textContent = immediate ? 'Immediate' : `${Number(config.minDelay).toFixed(2)}–${Number(config.maxDelay).toFixed(2)} s`;
    byId('timing-hint').textContent = config.smartPacing ? 'Smart Pacing controls move timing. Manual settings are retained.' : 'Enable Auto Moves to apply this timing.';
    renderSession(sessionProjection);
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
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...patch, _expectedRevision: config._revision, _serverId: config._serverId }),
      });
      if (!response.ok || !response.config) throw new Error('invalid-response');
      if (version === editVersion) config = response.config;
      message(Object.keys(pending).length ? 'Saving changes…' : 'Settings saved');
      render();
    } catch (error) {
      pending = { ...patch, ...pending };
      if (error.status === 409 && error.data?.config) config = { ...error.data.config, ...pending };
      const permanent = error.status === 400 || error.status === 403;
      message(permanent ? 'Settings were rejected. Review the values and try again.' : 'Could not save. Check the local server; changes will retry.', true);
      if (!permanent) timer = setTimeout(save, error.status === 409 ? 100 : 2500);
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
        if (!drafts.size && !invalid.size) message(status.applied && status.revision === next._revision ? 'Applied in a Chess.com tab' : 'Settings saved · Chess.com disconnected');
      }
      document.querySelector('.connection').dataset.state = 'synced';
      byId('connection').textContent = 'Local server connected';
      byId('userscript-connection').textContent = status.userscriptConnected ? 'Chess.com: connected' : 'Chess.com: disconnected';
      byId('client-build-state').textContent = !status.serverVersion ? 'Restart the local server to verify the installed userscript.' : !status.userscriptConnected ? `Local version ${status.serverVersion} · Reload Chess.com after updating the userscript.` : status.userscriptUpdateRequired ? `Userscript update required · local version ${status.serverVersion}, browser ${status.userscriptVersion || 'not verified'}.` : `Userscript ${status.userscriptVersion} · up to date`;
      byId('userscript-update').textContent = status.userscriptUpdateRequired ? 'Update userscript now' : 'Install / update userscript';
      renderSession(status.sessionConnected ? status.sessionProjection : null);
      const bannerLabels = {
        visible: 'Visible on Chess.com', disabled: 'Disabled', 'ghost-mode': 'Hidden by Clean View',
        'board-unavailable': 'Waiting for board', 'sidebar-unavailable': 'Waiting for side panel',
        'route-not-supported': 'Not shown on this page', 'insufficient-space-or-height': 'Not enough room (96 px minimum)',
        'awaiting-layout': 'Updating position…', disconnected: 'Waiting for Chess.com',
      };
      byId('banner-display-state').textContent = config?.ghostMode ? bannerLabels['ghost-mode'] : config?.banner === false ? bannerLabels.disabled : bannerLabels[status.bannerState] || 'Waiting for display status';
    } catch (_) {
      renderSession(null);
      byId('userscript-connection').textContent = 'Chess.com: connection unknown';
      document.querySelector('.connection').dataset.state = 'offline';
      byId('connection').textContent = 'Local server offline';
      message('Cannot reach the local server. Check that it is running.', true);
    } finally {
      polling = false;
      clearTimeout(pollTimer);
      pollTimer = setTimeout(poll, 2000);
      refreshEngines();
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
      const copy = document.createElement('div');
      copy.append(caption);
      if (key === 'banner') {
        const detail = document.createElement('small');
        detail.id = 'banner-display-state';
        detail.className = 'control-detail';
        detail.textContent = 'Waiting for display status';
        row.setAttribute('aria-describedby', detail.id);
        row._detail = detail;
      }
      row.append(copy, toggle);
      host.append(row);
      if (row._detail) { host.append(row._detail); delete row._detail; }
    });
  });

  function commitTiming() {
    if (!config || config.delayMode === 'max') return;
    const keys = ['minDelay', 'maxDelay'];
    if (!keys.some(id => drafts.has(id))) { render(); return; }
    const values = keys.map(id => drafts.has(id) ? byId(id).value.trim().replace(',', '.') : String(config[id]));
    keys.forEach(id => invalid.delete(id));
    values.forEach((value, index) => {
      const bad = !/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(value) || !Number.isFinite(Number(value));
      byId(keys[index]).setAttribute('aria-invalid', String(bad));
      if (bad) invalid.add(keys[index]);
    });
    if (keys.some(id => invalid.has(id))) {
      message('Enter a delay between 0.01 and 10 seconds.', true);
      return;
    }
    keys.forEach(id => drafts.delete(id));
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
    const timingKeys = ['minDelay', 'maxDelay'];
    const discarded = node.dataset.mode === 'max' && timingKeys.some(id => drafts.has(id));
    if (node.dataset.mode === 'max') {
      timingKeys.forEach(id => { drafts.delete(id); invalid.delete(id); });
      ['minDelay', 'maxDelay'].forEach(id => byId(id).setAttribute('aria-invalid', 'false'));
    }
    queue({ delayMode: node.dataset.mode });
    if (discarded) message('Unsaved timing edit discarded · saving Immediate mode…');
  }));
  function commitSessionDraft() {
    const nodes = [...document.querySelectorAll('#kb-session-panel [data-key]')];
    if (!config || !nodes.some(node => drafts.has(node.id))) return;
    try {
      const value = sessionApi.validateSessionDraft({ durationMinutes: byId('kb-session-duration').value, minimumPercent: byId('kb-session-min-rate').value, maximumPercent: byId('kb-session-max-rate').value });
      nodes.forEach(node => { drafts.delete(node.id); node.setAttribute('aria-invalid', 'false'); });
      queue(sessionApi.draftPatch(value));
    } catch (error) {
      nodes.forEach(node => node.setAttribute('aria-invalid', 'true'));
      message(error.message, true);
    }
  }
  document.querySelectorAll('#kb-session-panel [data-key]').forEach(node => {
    node.addEventListener('input', () => { drafts.add(node.id); message('Unsaved session edit · press Enter or leave the field to apply'); });
    node.addEventListener('blur', commitSessionDraft);
    node.addEventListener('keydown', event => { if (event.key === 'Enter') { event.preventDefault(); commitSessionDraft(); node.blur(); } });
  });
  byId('elo').addEventListener('input', event => queue({ elo: Number(event.target.value) }));
  byId('color').addEventListener('input', event => queue({ color: event.target.value }));
  byId('retry').addEventListener('click', () => { clearTimeout(timer); save(); poll(); engineError = null; refreshEngines(); });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) poll(); });
  window.addEventListener('online', () => { save(); poll(); engineError = null; refreshEngines(); });
  document.addEventListener('pointerdown', event => {
    document.body.dataset.focusInput = 'pointer';
    const control = event.target.closest('button,input,select,a,[tabindex]');
    if (control && control !== document.activeElement) control.style.setProperty('--tc-idle-border', getComputedStyle(control).borderColor);
  }, true);
  document.addEventListener('keydown', event => { if (event.key === 'Tab') document.body.dataset.focusInput = 'keyboard'; }, true);
  poll();
})();
