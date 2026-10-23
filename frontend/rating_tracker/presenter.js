function element(document, tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}

const STATE_LABELS = { verified: 'Verified', stale: 'Last verified rating', conflict: 'Rating needs verification', 'awaiting-update': 'Awaiting Rating Update', provisional: 'Unconfirmed observation', unavailable: 'Rating unavailable' };
const modeName = mode => ({ bullet: 'Bullet', blitz: 'Blitz', rapid: 'Rapid', daily: 'Daily' })[mode] || 'Unknown category';
const ratingText = value => Number.isInteger(value) ? value.toLocaleString('en-US') : '—';
function dateText(value) { return Number.isFinite(value) ? new Date(value).toLocaleString('en-US') : 'Not yet verified'; }

function renderGoal(document, goal, { onAction, onHistory, onEdit, onDelete } = {}) {
  const article = element(document, 'article', undefined, 'rt-goal');
  article.dataset.goalId = goal.goalId;
  const heading = element(document, 'div', undefined, 'rt-heading');
  heading.append(element(document, 'h3', `${modeName(goal.timeClass)} · ${goal.direction === 'at-most' ? 'Lower threshold' : 'Rating Goal'}`), element(document, 'span', goal.completionNeedsVerification ? 'Completion needs verification' : ({ reached: goal.direction === 'at-most' ? 'Threshold Reached' : 'Goal Reached', paused: 'Paused', archived: 'Archived', 'awaiting-baseline': 'Awaiting baseline', tracking: 'Tracking' })[goal.state] || 'Awaiting baseline', 'rt-state'));
  const view = goal.view || {};
  const numbers = element(document, 'dl', undefined, 'rt-numbers');
  const add = (label, value) => { const group = element(document, 'div'); group.append(element(document, 'dt', label), element(document, 'dd', value)); numbers.append(group); };
  add('Current Rating', ratingText(view.confirmed?.rating));
  add(goal.direction === 'at-most' ? 'Lower Threshold' : 'Target Rating', ratingText(goal.threshold));
  add('Remaining Points', ratingText(goal.remainingPoints));
  article.append(heading, numbers);
  const status = element(document, 'p', STATE_LABELS[view.state] || 'Rating unavailable', 'rt-detail');
  article.append(status);
  if (view.provisional && Number.isInteger(view.provisional.rating)) article.append(element(document, 'p', `Observed ${ratingText(view.provisional.rating)} · Unconfirmed`, 'rt-detail'));
  if (Number.isFinite(goal.progress)) {
    const progress = element(document, 'progress');
    progress.max = 100;
    progress.value = Math.min(100, Math.max(0, goal.progress));
    progress.setAttribute('aria-label', `${modeName(goal.timeClass)} goal progress`);
    article.append(progress);
  }
  const details = element(document, 'details');
  details.append(element(document, 'summary', 'Details and history'));
  details.append(element(document, 'p', `Last Verified: ${dateText(view.lastVerifiedAtMs)}`, 'rt-detail'));
  if (view.confirmed) details.append(element(document, 'p', `Rating as of: ${dateText(view.confirmed.sourceEffectiveAtMs)}`, 'rt-detail'));
  if (goal.historicallyReached) details.append(element(document, 'p', 'Reached in verified game history. Current rating is shown above.', 'rt-detail'));
  if (view.pendingGameCount) details.append(element(document, 'p', `${view.pendingGameCount} completed game${view.pendingGameCount === 1 ? '' : 's'} awaiting publication.`, 'rt-detail'));
  if (goal.baselineRating !== null && goal.baselineRating !== undefined) details.append(element(document, 'p', `Initial Rating: ${ratingText(goal.baselineRating)}`, 'rt-detail'));
  if (view.conflicts?.length) details.append(element(document, 'p', 'Public sources disagree. Progress is not confirmed until the disagreement is resolved.', 'rt-detail'));
  if (view.error) details.append(element(document, 'p', 'Rating updates are temporarily unavailable. Your last verified rating is preserved.', 'rt-detail'));
  const actions = element(document, 'div', undefined, 'rt-actions');
  const button = (label, action) => { const node = element(document, 'button', label); node.type = 'button'; node.addEventListener('click', action); actions.append(node); };
  if (onHistory) button('View History', () => onHistory(goal, details));
  if (onAction && ['tracking', 'awaiting-baseline', 'paused', 'reached'].includes(goal.state)) {
    button(goal.state === 'paused' ? 'Resume' : 'Pause', () => onAction(goal, goal.state === 'paused' ? 'resume' : 'pause'));
    if (onEdit) button('Edit Threshold', () => onEdit(goal));
    button('Archive', () => onAction(goal, 'archive'));
  }
  if (onDelete && goal.state === 'archived') button('Delete Goal', () => onDelete(goal));
  details.append(actions);
  article.append(details);
  return article;
}

function renderHistory(document, response, host) {
  host.querySelector('.rt-history')?.remove();
  const section = element(document, 'div', undefined, 'rt-history');
  section.append(element(document, 'h4', 'Rating History'));
  const items = response.items || [];
  if (!items.length) section.append(element(document, 'p', 'No confirmed rating changes yet.', 'rt-detail'));
  else {
    const list = element(document, 'ul');
    items.forEach(item => {
      const delta = item.status === 'contested' ? 'Change needs verification' : Number.isInteger(item.delta) ? `${item.delta > 0 ? '+' : ''}${item.delta}` : 'Change unconfirmed';
      const scope = item.scope === 'single-game' ? 'Completed game' : item.scope === 'interval' ? 'Multiple-game interval' : 'Unattributed adjustment';
      list.append(element(document, 'li', `${scope}: ${delta} · ${dateText(item.sourceEffectiveAtMs || item.effectiveAtMs || item.createdAtMs)}`));
    });
    section.append(list);
  }
  if (response.volatility?.count >= 5) section.append(element(document, 'p', `Recent observed changes: ${response.volatility.min} to ${response.volatility.max} points. Historical variation is not a prediction.`, 'rt-detail'));
  host.append(section);
  return section;
}

module.exports = { element, renderGoal, renderHistory, ratingText, STATE_LABELS };
