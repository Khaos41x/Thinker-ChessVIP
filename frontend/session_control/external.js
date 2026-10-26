"use strict";

const { availability } = require('./ui');
const { draftFromConfig, draftPatch, SESSION_FIELDS } = require('./presentation');

function createGmConfigRequest(request, serverUrl) {
  return (path, body) => new Promise((resolve, reject) => request({
    method: body ? 'POST' : 'GET', url: serverUrl + path, timeout: 5000,
    headers: { 'Content-Type': 'application/json' }, ...(body ? { ['data']: JSON.stringify(body) } : {}),
    onload(response) {
      try {
        const result = JSON.parse(response.responseText);
        if (response.status < 200 || response.status >= 300) throw new Error(result.error || 'Configuration unavailable');
        resolve(result);
      } catch (error) { reject(error); }
    }, onerror: () => reject(new Error('Local server unavailable')), ontimeout: () => reject(new Error('Local server timed out')),
  }));
}

function createExternalSessionBridge(options) {
  const clientId = options.clientId;
  let busy = false;
  let stopped = false;
  let timer = null;
  let ack = null;
  const pendingDraft = {};
  let accepted = null;
  const seen = new Set();
  const identity = () => {
    const snapshot = options.bridge.sessionSnapshot();
    return snapshot ? `${snapshot.sessionId}:${snapshot.revision}` : null;
  };
  function draftChanged(draft, changedField) {
    const fields = changedField && SESSION_FIELDS[changedField] ? [changedField] : Object.keys(SESSION_FIELDS);
    for (const field of fields) {
      const value = String(draft[field]);
      if (changedField || !accepted || Number(value) !== accepted[SESSION_FIELDS[field]] || value.trim() === '') pendingDraft[field] = value;
    }
  }
  async function tick() {
    if (busy || stopped) return;
    busy = true;
    try {
      const config = await options.request('/config/load');
      accepted = config;
      options.presenter.applyDraft(draftFromConfig(config));
      if (Object.keys(pendingDraft).length) {
        const edits = { ...pendingDraft };
        try {
          const validated = draftPatch({ ...draftFromConfig(config), ...edits });
          const patch = Object.fromEntries(Object.keys(edits).map(field => [SESSION_FIELDS[field], validated[SESSION_FIELDS[field]]]));
          const result = await options.request('/config/save', { ...patch, _expectedRevision: config._revision, _serverId: config._serverId });
          for (const field of Object.keys(edits)) if (pendingDraft[field] === edits[field]) delete pendingDraft[field];
          accepted = result.config;
          options.presenter.applyDraft(draftFromConfig(result.config));
        } catch (error) {
          options.onError?.(error);
        }
      }
      const status = options.bridge.status();
      const blockers = availability(status, options.startBlocker());
      const projection = { status, availability: { ...blockers, export: null }, sessionIdentity: identity() };
      const result = await options.request('/config/session/bridge', { clientId, projection, ...(ack ? { ack } : {}) });
      ack = null;
      const command = result.command;
      if (result.owner && command && !seen.has(command.id)) {
        seen.add(command.id);
        if (seen.size > 200) seen.delete(seen.values().next().value);
        ack = { id: command.id, ok: false, error: 'Session action expired. Check the session before retrying.' };
        if (command.ownerId === clientId && command.expiresAt > Date.now() && command.sessionIdentity === identity()) {
          try {
            await options.request(`/config/session/commands/${command.id}/authorize`, { clientId });
            if (command.expiresAt <= Date.now() || command.sessionIdentity !== identity()) throw new Error('Session action is no longer current');
            const current = availability(options.bridge.status(), options.startBlocker());
            if (command.action !== 'export' && current[command.action]) throw new Error(current[command.action]);
            let value;
            if (command.action === 'start') value = await options.bridge.start(options.createConfig(draftFromConfig(command.config)));
            else if (command.action === 'stop') {
              value = await options.bridge.gracefulStop();
              if (value?.allowed !== true) throw new Error(value?.reason || 'Session could not finish');
            } else value = options.bridge.exportDiagnostic();
            ack = { id: command.id, ok: true, result: command.action === 'export' ? value : null };
          } catch (error) { ack.error = String(error.code || error.message || error); }
          options.presenter.update();
        }
      }
    } catch (error) { options.onError?.(error); }
    finally {
      busy = false;
      if (!stopped) timer = options.setTimeout(tick, 1000);
    }
  }
  return Object.freeze({ start: tick, draftChanged, stop() { stopped = true; options.clearTimeout(timer); }, snapshot: () => ({ accepted, pendingDraft: { ...pendingDraft }, busy }) });
}

module.exports = { createExternalSessionBridge, createGmConfigRequest };
