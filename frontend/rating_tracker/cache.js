function staleSnapshot(snapshot) {
  if (!snapshot || snapshot.schemaVersion !== 1 || !Array.isArray(snapshot.goals)) return null;
  return { ...snapshot, notifications: [], goals: snapshot.goals.map(goal => ({ ...goal, view: { ...goal.view, state: goal.view?.confirmed ? 'stale' : 'unavailable', eligible: false, freshness: 'stale', error: { code: 'BACKEND_OFFLINE', source: 'rating-tracker', retryable: true } } })) };
}

function snapshotCache(storage, key) {
  return {
    read() { try { return staleSnapshot(JSON.parse(storage.getItem(key) || 'null')); } catch (_) { return null; } },
    clear() { try { storage.removeItem(key); } catch (_) {} },
    write(snapshot) { try { storage.setItem(key, JSON.stringify({ ...snapshot, accounts: (snapshot.accounts || []).slice(0, 100), goals: (snapshot.goals || []).slice(0, 100), notifications: [] })); } catch (_) {} }
  };
}

module.exports = { staleSnapshot, snapshotCache };
