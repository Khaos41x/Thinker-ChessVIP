(function(root){
  'use strict';
  function create(options) {
    let state = null;
    let pending = false;
    let lastRefresh = -Infinity;
    let error = null;
    const allowed = () => ['analysis', 'post-game'].includes(options.authorize());
    function send(path, payload) {
      return new Promise((resolve, reject) => {
        options.request({method: payload ? 'POST' : 'GET', url: options.serverUrl + path,
          headers: options.headers(), ...(payload ? {data: JSON.stringify(payload)} : {}), timeout: 30000,
          onload(response) {
            try {
              const result = JSON.parse(response.responseText);
              if (response.status !== 200) throw new Error(result.error || 'Analysis engine unavailable');
              resolve(result);
            } catch (cause) { reject(cause); }
          }, onerror() {reject(new Error('Cannot reach analysis engine'));},
          ontimeout() {reject(new Error('Analysis engine initialization timed out'));}
        });
      });
    }
    async function refresh(force = false, initialize = false) {
      if (!allowed() || pending || (!force && performance.now() - lastRefresh < 1500)) return;
      pending = true;
      lastRefresh = performance.now();
      try {
        let next = await send('/eval-bar/engines?context=' + encodeURIComponent(options.authorize()));
        state = next;
        if (initialize && !next.activeEngineId && !next.loadingEngineId) {
          next = await send('/eval-bar/engines/select', {engineId: next.selectedEngineId, context: options.authorize(), initializeOnly: true});
        }
        state = next;
        try { options.storage?.setItem("thinkerAnalysisEngine", next.selectedEngineId); } catch (_) {}
        error = null;
      } catch (cause) { error = String(cause.message || cause); }
      finally { pending = false; }
    }
    return Object.freeze({
      cacheContext() { refresh(false, true); return allowed() && state?.activeEngineId ? state.cacheContext : ''; },
      requestIdentity() { return state && allowed() ? {engineId: state.activeEngineId, selectionGeneration: state.selectionGeneration} : {}; },
      refresh,
      snapshot() { return {state, pending, error}; }
    });
  }
  root.ThinkerAnalysisEngine = Object.freeze({create});
})(globalThis);
