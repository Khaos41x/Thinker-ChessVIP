const MODES = new Set(['bullet', 'blitz', 'rapid', 'daily']);

function username(value) {
  const normalized = String(value || '').normalize('NFKC').trim().toLowerCase();
  return /^[a-z0-9_-]{2,50}$/.test(normalized) ? normalized : null;
}

function profileUsername(node) {
  if (!node) return null;
  const href = node.getAttribute('href') || '';
  const match = href.match(/^https?:\/\/(?:www\.)?chess\.com\/member\/([^/?#]+)|^\/member\/([^/?#]+)/i);
  return username(match ? match[1] || match[2] : node.getAttribute('data-username'));
}

function loggedInUsername(document) {
  const values = new Set();
  document.querySelectorAll('[data-cy="nav-profile"], [data-test="nav-profile"], a.nav-link-profile, [data-test="user-menu-username"], [data-logged-in-username]').forEach(node => {
    const value = username(node.getAttribute('data-logged-in-username')) || profileUsername(node);
    if (value) values.add(value);
  });
  return values.size === 1 ? [...values][0] : null;
}

function gameReference(url) {
  const path = new URL(url, 'https://www.chess.com').pathname;
  const match = path.match(/^\/(?:game\/(?:(live|daily)\/)?|live\/game\/)(\d+)\/?$/);
  if (!match) return null;
  const namespace = match[1] || (path.startsWith('/live/') ? 'live' : 'unknown');
  return { gameKey: `chesscom:${namespace}:${match[2]}`, gameUrl: `https://www.chess.com${path}`, namespace };
}

function visible(node, window) {
  if (!node || node.hidden || node.closest('[hidden], [aria-hidden="true"]')) return false;
  const style = window.getComputedStyle(node);
  return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) !== 0 && node.getClientRects().length > 0;
}

function readRating(text) {
  const match = String(text || '').trim().match(/^\(?([0-9]{1,6})\)?(?:\s*\?)?$/);
  if (!match) return null;
  const value = Number(match[1]);
  return value <= 100000 ? value : null;
}

function readPage(document, window) {
  const own = loggedInUsername(document);
  const game = gameReference(window.location.href);
  if (!own || !game) return { username: own, game, reason: own ? 'game-unavailable' : 'identity-unavailable' };
  const categories = new Set();
  document.querySelectorAll('wc-chess-board[data-time-class], chess-board[data-time-class], [data-game-time-class]').forEach(node => {
    const mode = node.getAttribute('data-time-class') || node.getAttribute('data-game-time-class');
    if (MODES.has(mode) && (!node.hasAttribute('data-rules') || node.getAttribute('data-rules') === 'chess')) categories.add(mode);
  });
  const timeClass = categories.size === 1 ? [...categories][0] : null;
  let rating = null;
  let participant = false;
  for (const link of document.querySelectorAll('.player-component a[href*="/member/"], [data-player-username] a[href*="/member/"]')) {
    if (profileUsername(link) !== own) continue;
    participant = true;
    const host = link.closest('.player-component, [data-player-username]');
    const field = host.querySelector('[data-player-rating], .user-tagline-rating, .rating');
    if (visible(field, window)) rating = readRating(field.textContent);
  }
  const terminal = participant && [...document.querySelectorAll('[data-game-result], .game-over-modal-content')].find(node => {
    if (!visible(node, window)) return false;
    const context = node.closest('[data-game-id], [data-game-url]');
    if (!context) return false;
    const id = context.getAttribute('data-game-id');
    const url = context.getAttribute('data-game-url');
    return id === game.gameKey.split(':').pop() || url && gameReference(url)?.gameKey === game.gameKey;
  });
  let result = null;
  if (terminal) {
    const raw = terminal.getAttribute('data-game-result') || terminal.textContent;
    if (/aborted/i.test(raw)) result = 'aborted';
    else if (/\bdraw\b|stalemate|repetition|insufficient material/i.test(raw)) result = 'D';
    else if (/\bwon\b|\bresignation\b|\bcheckmate\b|\btimeout\b/i.test(raw)) result = 'unknown';
  }
  return { username: own, game, timeClass, rating, result, participant, reason: !participant ? 'participant-unavailable' : timeClass ? null : 'category-unavailable' };
}

function observePage(window, callback) {
  let destroyed = false;
  let timer;
  let stableTimer;
  let previous = '';
  let terminalKey = '';
  const inspect = () => {
    clearTimeout(timer);
    timer = null;
    if (destroyed) return;
    const value = readPage(window.document, window);
    const signature = JSON.stringify(value);
    if (signature !== previous) {
      previous = signature;
      callback({ ...value, terminalStable: false });
    }
    const nextKey = value.result && value.username && value.game ? signature : '';
    if (nextKey !== terminalKey) {
      clearTimeout(stableTimer);
      terminalKey = nextKey;
      if (nextKey) stableTimer = setTimeout(() => {
        const next = readPage(window.document, window);
        if (JSON.stringify(next) === signature) callback({ ...next, terminalStable: true });
      }, 250);
    }
  };
  const schedule = () => { if (!timer) timer = setTimeout(() => { timer = null; inspect(); }, 50); };
  const observer = new window.MutationObserver(records => {
    if (records.some(record => {
      const target = record.target.nodeType === 1 ? record.target : record.target.parentElement;
      return !target?.closest('#oi-wrapper, #krypbot-container, .thinker-eval-v2-overlay, #thinker-chess-banner, .myarrow, .myhigh, .tc-hud-stats, .tc-rating-goal');
    })) schedule();
  });
  observer.observe(window.document.documentElement, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['data-time-class', 'data-game-time-class', 'data-game-result', 'data-game-id', 'hidden', 'aria-hidden', 'class', 'style'] });
  window.addEventListener('popstate', schedule);
  window.addEventListener('hashchange', schedule);
  window.navigation?.addEventListener('currententrychange', schedule);
  const fallback = setInterval(inspect, 30000);
  inspect();
  return { refresh: inspect, destroy() { destroyed = true; observer.disconnect(); clearTimeout(timer); clearTimeout(stableTimer); clearInterval(fallback); window.removeEventListener('popstate', schedule); window.removeEventListener('hashchange', schedule); window.navigation?.removeEventListener('currententrychange', schedule); } };
}

module.exports = { username, profileUsername, loggedInUsername, gameReference, readRating, readPage, observePage };
