'use strict';

const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { mkdtemp, rm } = require('node:fs/promises');
const { join, resolve } = require('node:path');
const { createServer } = require('node:net');
const api = require('../frontend/session_control');
const { startEvent, event } = require('./session_control/helpers');

const root = resolve(__dirname, '..');
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const freePort = () => new Promise(resolve => { const server = createServer(); server.listen(0, '127.0.0.1', () => { const port = server.address().port; server.close(() => resolve(port)); }); });

(async () => {
  const directory = await mkdtemp(join(root, '.phase091-session-'));
  const port = await freePort();
  const base = `http://127.0.0.1:${port}`;
  const backend = spawn('python', ['tests/phase091_config_fixture.py', String(port), join(directory, 'engine.json')], { cwd: root, windowsHide: true, stdio: ['pipe', 'ignore', 'ignore'] });
  try {
    let ready = false;
    for (let i = 0; i < 100; i++) { try { ready = (await fetch(base + '/config/load')).ok; if (ready) break; } catch (_) {} await delay(100); }
    assert(ready, 'Real Flask fixture did not start');
    const request = async (path, body) => {
      const response = await fetch(base + path, { method: body ? 'POST' : 'GET', headers: { 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      return data;
    };
    const draft = { durationMinutes: '120', minimumPercent: '75.5', maximumPercent: '82.25' };
    assert.equal(api.sessionConfigFromDraft(draft).minWinRate, .755);
    assert.throws(() => api.validateSessionDraft({ ...draft, minimumPercent: 90 }));
    const snapshot = api.reduce(null, startEvent()).nextState;
    const completed = api.reduce(snapshot, event('TICK', snapshot.revision, snapshot.deadlineEpochMs + 1)).nextState;
    assert.equal(api.buildStatusView(snapshot).phase, 'QUEUEING');
    assert.equal(api.buildStatusView(completed).phase, 'COMPLETED');
    let exports = 0;
    let lostAckResponse = true;
    let appliedDraft;
    let injectConcurrentSave = false;
    const bridge = api.createExternalSessionBridge({
      clientId: 'session-source-test',
      request: async (path, body) => {
        if (path === '/config/save' && injectConcurrentSave) {
          injectConcurrentSave = false;
          await request('/config/save', { sessionMaximumPercent: 91.5 });
        }
        const result = await request(path, body);
        if (body?.ack && lostAckResponse) { lostAckResponse = false; throw new Error('Simulated lost acknowledgement response'); }
        return result;
      },
      presenter: { applyDraft: draft => { appliedDraft = draft; }, update() {} },
      bridge: { sessionSnapshot: () => null, status: () => api.buildStatusView(null), exportDiagnostic: () => { exports++; return api.diagnosticExport(api.buildStatusView(null), [], Date.now()); } },
      startBlocker: () => 'BOT_DISABLED', createConfig: api.sessionConfigFromDraft,
      setTimeout: () => 0, clearTimeout() {},
    });
    await bridge.start();
    assert.equal(appliedDraft.durationMinutes, '120');
    bridge.draftChanged(draft);
    await bridge.start();
    let config = await request('/config/load');
    assert.equal(config.sessionMinimumPercent, 75.5);
    bridge.draftChanged({ ...draft, durationMinutes: '130' }, 'durationMinutes');
    await request('/config/save', { sessionMaximumPercent: 90.5 });
    await bridge.start();
    config = await request('/config/load');
    assert.equal(config.sessionDurationMinutes, 130);
    assert.equal(config.sessionMaximumPercent, 90.5, 'Unchanged draft field overwrote a concurrent accepted edit');
    bridge.draftChanged({ ...draft, durationMinutes: '131' }, 'durationMinutes');
    injectConcurrentSave = true;
    await bridge.start();
    assert.equal((await request('/config/load')).sessionDurationMinutes, 130, 'Stale revision was accepted');
    assert.equal(bridge.snapshot().pendingDraft.durationMinutes, '131', 'Conflict lost the pending input');
    await bridge.start();
    config = await request('/config/load');
    assert.equal(config.sessionDurationMinutes, 131);
    assert.equal(config.sessionMaximumPercent, 91.5, 'Conflict retry reverted an untouched field');
    const queued = await request('/config/session/commands', { id: 'source-export-test', action: 'export', configRevision: config._revision, serverId: config._serverId });
    assert.equal(queued.state, 'queued');
    await bridge.start();
    assert.equal(exports, 1);
    await bridge.start();
    await bridge.start();
    assert.equal(exports, 1, 'Lost ack response executed export twice');
    const result = await request('/config/session/commands/source-export-test');
    assert.equal(result.state, 'completed');
    assert.equal(result.result.diagnosticVersion, 'session-control-diagnostic-v1');
    bridge.stop();
    console.log('Phase09.1 shared draft, genuine reducer projections, real Flask relay and lost-ack idempotence passed');
  } finally {
    backend.stdin.write('stop\n'); backend.stdin.end();
    await new Promise(resolve => backend.once('exit', resolve));
    await rm(directory, { recursive: true, force: true });
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
