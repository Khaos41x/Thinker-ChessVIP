const { observePage, loggedInUsername } = require('./dom-adapter');
const { createSessionGoalGuard } = require('./session-goal');
const { createTransport, createOutbox } = require('./bridge');
const { mountTarget } = require('./target-field');
const { staleSnapshot, snapshotCache } = require('./cache');

function start({ window = globalThis.window, baseUrl, gmRequest, storage = window.localStorage, transport: injected } = {}) {
  if (!window || !/(^|\.)chess\.com$/i.test(window.location.hostname)) return null;
  if (window.__thinkerRatingTracker) return window.__thinkerRatingTracker;
  const transport = injected || createTransport({ baseUrl, gmRequest });
  const diagnostics = { state: 'idle', identity: null, reason: null, lastSnapshotAtMs: null, snapshotLatencyMs: null, observationCount: 0, outboxError: null };
  let outboxStorage = storage;
  try { if (window.sessionStorage) outboxStorage = window.sessionStorage; } catch (_) {}
  const outbox = createOutbox({ storage: outboxStorage, transport, onError: code => { diagnostics.outboxError = code; } });
  let username = null;
  let generation = 0;
  let destroyed = false;
  let snapshotTimer;
  let active;
  let field;
  let fieldHost;
  let snapshot;
  let goalWasBlocking = false;
  const sessionGoal = createSessionGoalGuard({ transport, storage, crypto: window.crypto,
    getSession: () => window.krypbotSessionControlBridge?.sessionSnapshot(),
    getUsername: () => loggedInUsername(window.document),
    getRole: () => window.krypbotSessionControlBridge?.status().role,
    stop: () => window.krypbotSessionControlBridge?.gracefulStop(),
    onChange: value => {
      field?.setSessionState(value);
      const resume = goalWasBlocking && !value.blockQueue;
      goalWasBlocking = value.blockQueue;
      if (resume) window.krypbotSessionControlBridge?.ratingGoalUpdated();
    },
  });
  const sent = new Set();
  const draw = () => {
    if (destroyed) return;
    const host = window.document.querySelector('#kb-session-panel .kb-session-fields');
    if (!host) { field?.destroy(); field = null; fieldHost = null; return; }
    if (fieldHost === host && host.querySelector('.tc-rating-target')) return;
    field?.destroy(); fieldHost = host;
    field = mountTarget({ window, host, request: transport.request });
    field.setSessionState(sessionGoal.snapshot());
  };
  async function poll() {
    clearTimeout(snapshotTimer);
    if (destroyed || !username) return;
    const token = generation;
    active?.abort();
    active = new AbortController();
    const started = window.performance.now();
    try {
      const result = await transport.request(`/rating-goals/snapshot?username=${encodeURIComponent(username)}`, { signal: active.signal });
      if (destroyed || token !== generation) return;
      snapshot = result;
      snapshotCache(storage, `tc_rating_snapshot_v1:${username}`).write(result);
      diagnostics.state = 'connected';
      diagnostics.lastSnapshotAtMs = Date.now();
      diagnostics.snapshotLatencyMs = window.performance.now() - started;
      draw();
    } catch (_) {
      if (!destroyed && token === generation) {
        diagnostics.state = 'server-unavailable';
        snapshot = staleSnapshot(snapshot);
        draw();
      }
    }
    finally { if (!destroyed && token === generation) snapshotTimer = setTimeout(poll, 15000); }
  }
  const observer = observePage(window, page => {
    diagnostics.observationCount++;
    diagnostics.reason = page.reason;
    if (page.username !== username) {
      username = page.username;
      diagnostics.identity = username;
      generation++;
      snapshot = username ? snapshotCache(storage, `tc_rating_snapshot_v1:${username}`).read() : null;
      sent.clear();
      active?.abort();
      clearTimeout(snapshotTimer);
      draw();
      if (username) void poll();
    }
    if (!page.username || !page.game || !page.participant) return;
    const base = { username: page.username, timeClass: page.timeClass, gameUrl: page.game.gameUrl };
    if (page.timeClass && Number.isInteger(page.rating)) {
      const id = `${page.username}:${page.game.gameKey}:${page.timeClass}:${page.rating}`;
      if (!sent.has(id)) { sent.add(id); outbox.enqueue('/rating-observations/dom', { ...base, rating: page.rating, observedAtMs: Date.now() }, id); }
    }
    if (page.terminalStable) {
      const id = `${page.username}:${page.game.gameKey}:terminal`;
      if (!sent.has(id)) { sent.add(id); outbox.enqueue('/rating-games/terminal', { ...base, result: page.result, rated: null, endedAtMs: null, proofDigest: id }, id); void poll(); }
    }
  });
  const cleanObserver = new window.MutationObserver(draw);
  cleanObserver.observe(window.document.documentElement, { childList: true, subtree: true });
  window.addEventListener('storage', draw);
  const instance = { refresh() { observer.refresh(); draw(); void field?.refresh(); void sessionGoal.refresh(); return poll(); }, prepareSessionGoal: () => field?.flush(), refreshSessionGoal: sessionGoal.refresh, blocksQueue: sessionGoal.blocksQueue, onSessionGameCompleted: sessionGoal.completedGame, diagnostics() { return { ...diagnostics, sessionGoal: sessionGoal.snapshot(), pendingEvidence: outbox.size, fieldMounted: Boolean(fieldHost?.isConnected), goalCount: snapshot?.goals?.length || 0, hostFound: Boolean(window.document.getElementById('krypbot-container')) }; }, destroy() { destroyed = true; generation++; clearTimeout(snapshotTimer); active?.abort(); observer.destroy(); outbox.destroy(); sessionGoal.destroy(); cleanObserver.disconnect(); field?.destroy(); transport.destroy?.(); window.removeEventListener('storage', draw); delete window.__thinkerRatingTracker; } };
  window.__thinkerRatingTracker = instance;
  draw();
  sessionGoal.start();
  void outbox.flush();
  return instance;
}

module.exports = { start };
