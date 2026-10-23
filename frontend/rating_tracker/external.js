const { element, renderGoal, renderHistory } = require('./presenter');
const { staleSnapshot, snapshotCache } = require('./cache');

function mount(document, window) {
  const host = document.getElementById('rating-tracker');
  if (!host) return;
  const $ = id => document.getElementById(id);
  let stopped = false;
  let loading = false;
  let timer;
  let snapshot;
  let signature;
  const cache = snapshotCache(window.localStorage, 'tc_rating_external_snapshot_v1');
  const consumerId = window.crypto.randomUUID();
  const claims = new Map();
  const active = new Set();
  async function request(path, method = 'GET', body) {
    const controller = new AbortController();
    active.add(controller);
    const deadline = setTimeout(() => controller.abort(), 10000);
    try {
      const response = await window.fetch(path, { method, cache: 'no-store', signal: controller.signal, headers: { 'Content-Type': 'application/json' }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
      if (!response.ok) throw Object.assign(new Error('request-failed'), { status: response.status });
      return await response.json();
    } finally { active.delete(controller); clearTimeout(deadline); }
  }
  const message = (text, error = false) => { $('rt-status').textContent = text; $('rt-status').dataset.error = String(error); };
  async function mutate(path, method, body) {
    try { const result = await request(path, method, body); signature = null; await refresh(); return result; }
    catch (error) { message(error.status === 409 ? 'This goal changed in another tab. Review the latest values and try again.' : 'Could not save this change. Your verified ratings and history are preserved.', true); return null; }
  }
  async function history(goal, detail) {
    try {
      const route = `/rating-goals/history?accountKey=${encodeURIComponent(goal.accountKey)}&timeClass=${encodeURIComponent(goal.timeClass)}`;
      const page = async (cursor, prior) => {
        const response = await request(route + (cursor === null ? '' : `&cursor=${encodeURIComponent(cursor)}`));
        const items = [...prior, ...(response.items || [])];
        const historyHost = renderHistory(document, { ...response, items }, detail);
        if (response.nextCursor !== null && response.nextCursor !== undefined) {
          const more = element(document, 'button', 'More History'); more.type = 'button';
          more.addEventListener('click', async () => {
            more.disabled = true;
            try { await page(response.nextCursor, items); } catch (_) { more.disabled = false; message('History is temporarily unavailable.', true); }
          }); historyHost.append(more);
        }
      };
      await page(null, []);
    } catch (_) { message('History is temporarily unavailable. Your last verified rating is preserved.', true); }
  }
  function edit(goal) {
    let expectedRevision = goal.revision;
    const form = document.createElement('form'); form.className = 'rt-actions';
    const input = document.createElement('input'); input.type = 'text'; input.inputMode = 'numeric'; input.value = String(goal.threshold); input.required = true; input.pattern = '[0-9]{1,6}'; input.setAttribute('aria-label', 'New rating threshold');
    const save = element(document, 'button', 'Save Threshold'); save.type = 'submit';
    const cancel = element(document, 'button', 'Cancel'); cancel.type = 'button'; cancel.addEventListener('click', () => form.remove());
    form.append(input, save, cancel);
    const card = [...$('rt-goals').children].find(node => node.dataset.goalId === goal.goalId);
    card?.querySelector('.rt-edit')?.remove(); form.classList.add('rt-edit'); card?.append(form); input.focus();
    form.addEventListener('submit', async event => {
      event.preventDefault();
      const threshold = Number(input.value);
      if (!/^\d+$/.test(input.value) || !Number.isInteger(threshold) || threshold > 100000) { input.setAttribute('aria-invalid', 'true'); return; }
      save.disabled = true;
      try {
        await request(`/rating-goals/${encodeURIComponent(goal.goalId)}`, 'PATCH', { revision: expectedRevision, action: 'update', threshold });
        form.remove(); signature = null; await refresh();
      } catch (error) {
        if (error.status === 409) {
          try {
            snapshot = await request('/rating-goals/snapshot');
            const latest = snapshot.goals.find(item => item.goalId === goal.goalId);
            if (latest) {
              expectedRevision = latest.revision;
              message(`This goal changed in another tab. Latest threshold: ${latest.threshold.toLocaleString('en-US')}. Your draft is preserved; review it before saving again.`, true);
            } else message('This goal is no longer available. Your draft is preserved.', true);
          } catch (_) { message('Could not reload this goal. Your draft is preserved; try again when connected.', true); }
        } else message('Could not save the threshold. Your draft is preserved.', true);
        save.disabled = false;
      }
    });
  }
  function render(next, offline = false) {
    const key = JSON.stringify(next);
    if (key === signature) return;
    if (host.querySelector('.rt-edit')) return;
    const activeGoalId = document.activeElement?.closest('.rt-goal')?.dataset.goalId;
    const activeLabel = document.activeElement?.matches('button') ? document.activeElement.textContent : null;
    signature = key;
    $('rt-page-visible').checked = next.preferences?.onPageVisible === true;
    const opened = new Set([...$('rt-goals').querySelectorAll('article')].filter(node => node.querySelector('details')?.open).map(node => node.dataset.goalId));
    $('rt-goals').replaceChildren();
    if (!next.goals?.length) $('rt-goals').append(element(document, 'p', 'No rating goals yet. Add a goal to begin passive monitoring.', 'hint'));
    for (const goal of next.goals || []) {
      const card = renderGoal(document, goal, { onAction: offline ? undefined : (item, action) => mutate(`/rating-goals/${encodeURIComponent(item.goalId)}`, 'PATCH', { revision: item.revision, action }), onHistory: history, onEdit: offline ? undefined : edit,
        onDelete: offline ? undefined : item => {
          if (window.confirm('Delete this archived goal and its notifications? This cannot be undone.')) void mutate(`/rating-goals/${encodeURIComponent(item.goalId)}`, 'DELETE', { revision: item.revision });
        } });
      if (opened.has(goal.goalId)) card.querySelector('details').open = true;
      $('rt-goals').append(card);
    }
    const management = $('rt-accounts');
    management.replaceChildren();
    if (next.accounts?.length) {
      next.accounts.forEach(account => {
        const remove = element(document, 'button', `Remove ${account.displayUsername} and Data`);
        remove.type = 'button'; remove.disabled = offline;
        remove.addEventListener('click', async () => {
          if (!window.confirm(`Remove ${account.displayUsername}, all goals, history and notifications? This cannot be undone.`)) return;
          remove.disabled = true;
          const result = await mutate(`/rating-goals/accounts/${encodeURIComponent(account.accountKey)}`, 'DELETE', {});
          if (result) cache.clear(); else remove.disabled = false;
        });
        management.append(remove);
      });
    }
    if (activeGoalId && activeLabel) {
      const goal = next.goals.find(item => item.goalId === activeGoalId);
      const label = activeLabel === 'Pause' && goal?.state === 'paused' ? 'Resume' : activeLabel === 'Resume' && goal?.state !== 'paused' ? 'Pause' : activeLabel;
      const card = [...$('rt-goals').children].find(node => node.dataset.goalId === activeGoalId);
      [...(card?.querySelectorAll('button') || [])].find(node => node.textContent === label)?.focus({ preventScroll: true });
    }
    const unread = (next.notifications || []).filter(item => !item.acknowledged);
    $('rt-notification-count').textContent = String(unread.length);
    $('rt-notifications').replaceChildren();
    if (!unread.length) $('rt-notifications').append(element(document, 'p', 'No unread notifications.', 'hint'));
    for (const notice of unread) {
      const row = element(document, 'div', undefined, 'rt-notification');
      row.append(element(document, 'p', notice.message));
      const button = element(document, 'button', 'Mark Read'); button.type = 'button';
      button.addEventListener('click', async () => {
        button.disabled = true;
        try {
          const result = await request(`/rating-notifications/${encodeURIComponent(notice.notificationId)}/claim`, 'POST', { consumerId, revision: notice.revision });
          claims.set(notice.notificationId, result.claimToken);
          await mutate(`/rating-notifications/${encodeURIComponent(notice.notificationId)}/ack`, 'POST', { claimToken: result.claimToken });
        } catch (_) { message('This notification is open in another tab. Try again shortly.', true); button.disabled = false; }
      }); row.append(button); $('rt-notifications').append(row);
    }
  }
  async function refresh() {
    clearTimeout(timer);
    if (stopped || loading) return;
    loading = true;
    try { snapshot = await request('/rating-goals/snapshot'); if (!stopped) { cache.write(snapshot); render(snapshot); message(snapshot.errors?.length ? 'Some rating updates are unavailable. Your last verified ratings are preserved; see goal details.' : 'Ratings update automatically. Public data may be delayed.', Boolean(snapshot.errors?.length)); } }
    catch (_) { if (!stopped) { snapshot = staleSnapshot(snapshot); if (snapshot) render(snapshot, true); message('Rating tracker offline. Previously displayed ratings are preserved.', true); } }
    finally { loading = false; if (!stopped) timer = setTimeout(refresh, 5000); }
  }
  $('rt-form').addEventListener('submit', async event => {
    event.preventDefault();
    const threshold = Number($('rt-threshold').value);
    if (!/^\d+$/.test($('rt-threshold').value) || !Number.isInteger(threshold) || threshold > 100000) { $('rt-threshold').setAttribute('aria-invalid', 'true'); message('Enter a whole-number rating between 0 and 100,000.', true); return; }
    $('rt-threshold').setAttribute('aria-invalid', 'false');
    const button = $('rt-form').querySelector('[type=submit]'); button.disabled = true;
    const result = await mutate('/rating-goals', 'POST', { username: $('rt-username').value.trim().toLowerCase(), timeClass: $('rt-mode').value, direction: $('rt-direction').value, threshold, idempotencyKey: window.crypto.randomUUID() });
    button.disabled = false;
    if (result) $('rt-create').open = false;
  });
  $('rt-page-visible').addEventListener('change', async event => {
    try { await request('/rating-goals/preferences', 'POST', { onPageVisible: event.target.checked }); signature = null; await refresh(); message('Display preference saved. Monitoring is unchanged.'); }
    catch (_) { event.target.checked = !event.target.checked; message('Could not save display preference.', true); }
  });
  const visible = () => { if (!document.hidden) void refresh(); };
  document.addEventListener('visibilitychange', visible);
  window.addEventListener('pagehide', () => { stopped = true; clearTimeout(timer); active.forEach(controller => controller.abort()); document.removeEventListener('visibilitychange', visible); }, { once: true });
  snapshot = cache.read();
  if (snapshot) render(snapshot, true);
  void refresh();
}

if (typeof document !== 'undefined') mount(document, window);
module.exports = { mount };
