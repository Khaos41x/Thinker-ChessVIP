(function(root){
  'use strict';
  function create(options) {
    let state = null;
    let pending = false;
    let lastRefresh = -Infinity;
    let error = null;
    let selecting = false;
    let mounted = null;
    let selectionEpoch = 0;
    let attemptedEngineId = null;
    const allowed = () => ['analysis', 'post-game'].includes(options.authorize());
    function send(path, payload) {
      return new Promise((resolve, reject) => {
        options.request({method: payload ? 'POST' : 'GET', url: options.serverUrl + path,
          headers: options.headers(), ...(payload ? {data: JSON.stringify(payload)} : {}), timeout: 30000,
          onload(response) {
            try {
              const result = JSON.parse(response.responseText);
              if (response.status !== 200) throw Object.assign(new Error(result.error || 'Analysis engine unavailable'), { status: response.status, data: result });
              resolve(result);
            } catch (cause) { reject(cause); }
          }, onerror() {reject(new Error('Cannot reach analysis engine'));},
          ontimeout() {reject(new Error('Analysis engine initialization timed out'));}
        });
      });
    }
    async function refresh(force = false, initialize = false) {
      if (pending || selecting || (!force && performance.now() - lastRefresh < 1500)) return;
      pending = true;
      const epoch = selectionEpoch;
      lastRefresh = performance.now();
      try {
        let next = await send('/eval-bar/engines' + (allowed() ? '?context=' + encodeURIComponent(options.authorize()) : ''));
        if (epoch !== selectionEpoch) return;
        state = next;
        if (allowed() && initialize && next.activeEngineId !== next.selectedEngineId && !next.loadingEngineId) {
          next = await send('/eval-bar/engines/select', {engineId: next.selectedEngineId, context: options.authorize(), initializeOnly: true});
        }
        if (epoch !== selectionEpoch) return;
        state = next;
        try { options.storage?.setItem("thinkerAnalysisEngine", next.selectedEngineId); } catch (_) {}
        if (!attemptedEngineId) error = null;
      } catch (cause) {
        if (epoch !== selectionEpoch) return;
        if (cause.data?.engines) state = cause.data;
        error = String(cause.message || cause);
      }
      finally { pending = false; render(); }
    }
    async function selectPreference(engineId) {
      if (selecting || !state) return;
      attemptedEngineId = engineId;
      selecting = true; selectionEpoch++; error = null; render();
      try {
        const result = await send('/eval-bar/engines/preference', { engineId, expectedRevision: state.preferenceRevision });
        if (!result.ok || result.selectedEngineId !== engineId) throw new Error('Preference was not acknowledged');
        state = result;
        attemptedEngineId = null;
      } catch (cause) {
        if (cause.data?.engines) state = cause.data;
        error = String(cause.message || cause);
      } finally { selecting = false; render(); }
    }
    function render() {
      const host = options.getHost?.();
      if (!host) return;
      if (!mounted || mounted.parentNode !== host) {
        const doc = host.ownerDocument;
        mounted = doc.createElement('div'); mounted.className = 'tc-analysis-selector';
        const heading = doc.createElement('div'); heading.className = 'tc-analysis-heading';
        const label = doc.createElement('label'); label.htmlFor = 'tc-analysis-engine'; label.textContent = 'Analysis Engine';
        const status = doc.createElement('span'); status.className = 'tc-analysis-status'; status.setAttribute('role', 'status');
        const select = doc.createElement('select'); select.id = 'tc-analysis-engine'; select.setAttribute('aria-describedby', 'tc-analysis-message');
        const message = doc.createElement('p'); message.id = 'tc-analysis-message'; message.setAttribute('role', 'status');
        const retry = doc.createElement('button'); retry.type = 'button'; retry.textContent = 'Retry'; retry.addEventListener('click', () => attemptedEngineId ? selectPreference(attemptedEngineId) : refresh(true));
        select.addEventListener('change', () => selectPreference(select.value));
        heading.append(label, status); mounted.append(heading, select, message, retry);
        const caption = host.querySelector('.kb-console-caption');
        if (caption) caption.after(mounted); else host.prepend(mounted);
      }
      const select = mounted.querySelector('select');
      const selected = state?.engines?.find(engine => engine.id === state.selectedEngineId);
      if (state?.engines && select.options.length !== state.engines.length) {
        select.replaceChildren(...state.engines.map(engine => { const option = host.ownerDocument.createElement('option'); option.value = engine.id; option.textContent = engine.name; option.disabled = !engine.installed; return option; }));
      }
      if (!selecting && state) select.value = state.selectedEngineId;
      select.disabled = selecting || !state;
      mounted.querySelector('.tc-analysis-status').textContent = selecting ? 'Switching' : error ? 'Error' : selected?.initializationError ? 'Error' : selected ? selected.installed ? selected.runtimeReady && allowed() ? 'Active' : 'Ready' : 'Unavailable' : 'Initializing';
      mounted.querySelector('p').textContent = error || selected?.initializationError || (state ? 'Preference saved. Analysis follows the existing authorization.' : 'Checking installed engines…');
      mounted.querySelector('button').hidden = !error;
    }
    return Object.freeze({
      cacheContext() { refresh(false, true); return allowed() && state?.activeEngineId ? state.cacheContext : ''; },
      requestIdentity() { return state && allowed() ? {engineId: state.activeEngineId, selectionGeneration: state.selectionGeneration} : {}; },
      refresh,
      selectPreference,
      snapshot() { return {state, pending, error, attemptedEngineId}; }
    });
  }
  root.ThinkerAnalysisEngine = Object.freeze({create});
})(globalThis);
