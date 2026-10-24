const RUNNING = new Set(['QUEUEING', 'IN_GAME', 'DRAINING', 'PAUSED_QUEUEING', 'PAUSED_ACTIVE']);

function createSessionGoalGuard({ transport, getSession, getUsername, getRole, stop, storage, crypto = globalThis.crypto, now = Date.now, onChange = () => {}, setTimer = setTimeout, clearTimer = clearTimeout }) {
  let state = { state: 'idle', target: null, eligible: false, reached: false, blockQueue: false };
  let binding = null;
  let epoch = 0;
  let timer;
  let controller;
  let busy = false;
  let rerun = false;
  let destroyed = false;
  let stoppedSession = null;
  let stopPending = false;
  let lastSuccess = 0;
  const hints = new Map();
  const deliveredHints = new Set();
  const proofKey = 'tc_rating_session_proof_v1';
  function proofFor(session) {
    try {
      const proof = JSON.parse(storage?.getItem(proofKey) || 'null');
      return proof?.sessionId === session.sessionId && proof?.sessionAccountKey === session.accountKey ? proof : null;
    } catch (_) { return null; }
  }
  function saveProof(current, result) {
    try { storage?.setItem(proofKey, JSON.stringify({ sessionId: current.session.sessionId, sessionAccountKey: current.session.accountKey, disabled: result.state === 'disabled' && result.target === null, reached: current.reachedProof === true, pendingGames: [...hints.entries()] })); } catch (_) {}
  }
  const snapshot = () => ({ ...state });
  const publish = patch => { state = { ...state, ...patch }; onChange(snapshot()); };
  function context() {
    const session = getSession();
    if (!session?.sessionId) return null;
    const match = /^chesscom-live-(bullet|blitz|rapid)-v1$/.exec(session.activationContext?.pool || '');
    return { session, username: getUsername(), timeClass: match?.[1] || null, active: RUNNING.has(session.phase) };
  }
  function syncContext() {
    const current = context();
    if (!current) return null;
    const key = `${current.session.sessionId}:${current.session.accountKey}:${current.username}:${current.timeClass}`;
    if (binding?.key !== key) {
      if (binding?.body?.active && binding.session.sessionId !== current.session.sessionId) void transport.request('/rating-goals/session', { method: 'POST', body: { ...binding.body, active: false, completedGameUrl: undefined } }).catch(() => {});
      epoch++; controller?.abort(); hints.clear(); deliveredHints.clear(); lastSuccess = 0;
      const proof = proofFor(current.session);
      for (const item of Array.isArray(proof?.pendingGames) ? proof.pendingGames : []) {
        if (Array.isArray(item) && item.length === 2 && typeof item[0] === 'string' && /^https:\/\/www\.chess\.com\/game\/live\/\d+$/.test(item[1])) hints.set(item[0], item[1]);
      }
      binding = { key, ...current, body: null, ended: false, resolved: Boolean(proof), disabled: proof?.disabled === true, reachedProof: proof?.reached === true };
      publish({ state: current.active ? 'awaiting-rating' : 'idle', sessionId: current.session.sessionId, target: null, eligible: false, reached: stoppedSession === current.session.sessionId, blockQueue: current.active || stoppedSession === current.session.sessionId, error: null });
    } else binding.session = current.session;
    binding.active = current.active;
    return binding;
  }
  function blocksQueue() {
    if (destroyed) return false;
    let current;
    try { current = syncContext(); } catch (_) { return true; }
    if (!current) return false;
    if (current.disabled) return false;
    if (current.reachedProof) return true;
    if (stoppedSession === current.session.sessionId) return true;
    if (!current.active) return !current.resolved;
    if (!lastSuccess || now() - lastSuccess > 6000) {
      if (!state.blockQueue) publish({ state: 'awaiting-rating', blockQueue: true, eligible: false });
      return true;
    }
    return state.blockQueue;
  }
  async function refresh() {
    clearTimer(timer);
    if (destroyed) return;
    if (busy) { rerun = true; return; }
    let current;
    try { current = syncContext(); }
    catch (_) { publish({ state: 'error', eligible: false, blockQueue: true, error: 'RATING_CONTEXT_UNAVAILABLE' }); timer = setTimer(refresh, 2000); return; }
    if (!current || !current.active && current.ended) { timer = setTimer(refresh, 2000); return; }
    if (!current.username || !current.timeClass) {
      publish({ state: current.disabled ? 'disabled' : 'error', eligible: false, blockQueue: !current.disabled && current.active, error: current.disabled ? null : 'RATING_CONTEXT_UNAVAILABLE' });
      timer = setTimer(refresh, 2000); return;
    }
    busy = true;
    const token = epoch;
    controller = new AbortController();
    try {
      const bytes = new TextEncoder().encode(`chess.com:${current.username}`);
      const hash = [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(value => value.toString(16).padStart(2, '0')).join('');
      if (destroyed || token !== epoch || syncContext()?.key !== current.key) return;
      if (hash !== current.session.accountKey) throw new Error('RATING_ACCOUNT_MISMATCH');
      const hint = hints.entries().next().value;
      const body = { sessionId: current.session.sessionId, sessionAccountKey: hash, username: current.username, timeClass: current.timeClass, active: current.active, ...(hint ? { completedGameUrl: hint[1] } : {}) };
      current.body = body;
      const result = await transport.request('/rating-goals/session', { method: 'POST', body, signal: controller.signal });
      if (destroyed || token !== epoch || syncContext()?.key !== current.key) return;
      if (result.schemaVersion !== 1 || result.sessionId !== body.sessionId || result.sessionAccountKey !== hash || result.username !== body.username || result.timeClass !== body.timeClass) throw new Error('RATING_RESPONSE_MISMATCH');
      if (hint) { hints.delete(hint[0]); deliveredHints.add(hint[0]); }
      lastSuccess = now();
      current.ended = body.active === false;
      current.resolved = true;
      const disabled = result.state === 'disabled' && result.target === null;
      current.disabled = disabled;
      const ratingValid = Number.isInteger(result.confirmedRating) && result.confirmedRating >= 0 && result.confirmedRating <= 100000
        && Number.isInteger(result.target) && result.target >= 0 && result.target <= 100000;
      const valid = result.eligible === true && ratingValid && ['tracking', 'reached'].includes(result.state);
      current.reachedProof = result.reached === true && ratingValid && (valid || !body.active && result.state === 'reached');
      saveProof(current, result);
      const reached = valid && result.reached === true;
      publish({ ...result, reached: current.reachedProof, state: result.state === 'reached' && !current.reachedProof ? 'awaiting-rating' : result.state, blockQueue: !disabled && (current.reachedProof || current.active && (!valid || reached || hints.size > 0)), error: result.error || null });
      if (reached && current.active && getRole() === 'LEADER' && stoppedSession !== body.sessionId && !stopPending) {
        stopPending = true;
        try {
          if (syncContext()?.key !== current.key) return;
          const response = await stop();
          if (response?.allowed !== true) throw new Error(response?.reason || 'RATING_STOP_UNAVAILABLE');
          stoppedSession = body.sessionId;
          if (!destroyed && token === epoch && syncContext()?.key === current.key) publish({ state: 'reached', reached: true, blockQueue: true });
        } finally { stopPending = false; }
      }
    } catch (error) {
      if (!destroyed && token === epoch) publish({ state: current.disabled ? 'disabled' : 'error', eligible: false, blockQueue: !current.disabled && (current.active || stoppedSession === current.session.sessionId), error: current.disabled ? null : error.code || error.message || 'RATING_SERVER_UNAVAILABLE' });
    } finally {
      busy = false;
      if (!destroyed) { const delay = rerun ? 0 : 2000; rerun = false; timer = setTimer(refresh, delay); }
    }
  }
  function completedGame(observation) {
    const current = syncContext();
    const id = observation?.canonicalPlatformGameId;
    if (!current?.active || observation.accountKey !== current.session.accountKey || !/^\d+$/.test(String(id))) return;
    if (state.state === 'disabled' && state.target === null) return;
    const key = `${current.session.sessionId}:${id}`;
    if (hints.has(key) || deliveredHints.has(key)) return;
    hints.set(key, `https://www.chess.com/game/live/${id}`);
    epoch++; controller?.abort();
    publish({ state: 'awaiting-rating', eligible: false, reached: false, blockQueue: true });
    saveProof(current, state);
    void refresh();
  }
  return { start() { void refresh(); }, refresh, blocksQueue, completedGame, snapshot,
    destroy() { destroyed = true; epoch++; clearTimer(timer); controller?.abort(); } };
}

module.exports = { createSessionGoalGuard };
