const { observePage } = require('./dom-adapter');
const { createTransport, createOutbox } = require('./bridge');
const { renderGoal } = require('./presenter');
const { staleSnapshot, snapshotCache } = require('./cache');

const CARD_CSS = '.tc-rating-goal{box-sizing:border-box;max-width:680px;padding:12px;margin-top:12px;border:1px solid #3a3a36;border-radius:8px;color:#f2f2ee;background:#252523;font:13px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.tc-rating-goal h3{font-size:13px;margin:0}.tc-rating-goal .rt-heading{display:flex;justify-content:space-between;gap:12px}.tc-rating-goal .rt-state,.tc-rating-goal .rt-detail,.tc-rating-goal dt{color:#b9bab3;font-size:11px}.tc-rating-goal .rt-numbers{display:flex;gap:16px}.tc-rating-goal dd{margin:0;font-variant-numeric:tabular-nums}.tc-rating-goal progress{width:100%;accent-color:#22d36b}.tc-clean-view .tc-rating-goal{display:none!important}';

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
  let card;
  let snapshot;
  let renderedKey;
  const sent = new Set();
  const draw = () => {
    const enabled = snapshot?.preferences?.onPageVisible === true;
    const clean = window.document.documentElement.classList.contains('tc-clean-view');
    if (!enabled || clean || !snapshot?.goals?.length) { card?.remove(); card = null; renderedKey = null; return; }
    const host = window.document.getElementById('krypbot-container');
    if (!host) return;
    const goal = snapshot.goals.find(item => item.state !== 'archived') || snapshot.goals[0];
    const key = JSON.stringify(goal);
    if (card?.isConnected && renderedKey === key) return;
    if (!card || !card.isConnected) { card = window.document.createElement('section'); card.className = 'tc-rating-goal'; card.setAttribute('aria-label', 'Rating Goal'); host.append(card); }
    card.replaceChildren(renderGoal(window.document, goal));
    renderedKey = key;
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
      card?.remove(); card = null;
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
  const style = window.document.createElement('style');
  style.dataset.thinkerRatingTracker = 'true';
  style.textContent = CARD_CSS;
  window.document.head.append(style);
  const cleanObserver = new window.MutationObserver(draw);
  cleanObserver.observe(window.document.documentElement, { attributes: true, attributeFilter: ['class'] });
  window.addEventListener('storage', draw);
  const instance = { refresh() { observer.refresh(); draw(); return poll(); }, diagnostics() { return { ...diagnostics, pendingEvidence: outbox.size, cardMounted: Boolean(card?.isConnected), onPageVisible: snapshot?.preferences?.onPageVisible === true, goalCount: snapshot?.goals?.length || 0, hostFound: Boolean(window.document.getElementById('krypbot-container')) }; }, destroy() { destroyed = true; generation++; clearTimeout(snapshotTimer); active?.abort(); observer.destroy(); outbox.destroy(); transport.destroy?.(); cleanObserver.disconnect(); window.removeEventListener('storage', draw); card?.remove(); style.remove(); delete window.__thinkerRatingTracker; } };
  window.__thinkerRatingTracker = instance;
  void outbox.flush();
  return instance;
}

module.exports = { start };
