const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { createHash } = require('node:crypto');
const { username, gameReference, readRating, readPage } = require('../frontend/rating_tracker/dom-adapter');
const { createTransport, createOutbox } = require('../frontend/rating_tracker/bridge');
const { staleSnapshot, snapshotCache } = require('../frontend/rating_tracker/cache');

const tests = [];
function test(name, run) { tests.push([name, run]); }
test('Python and JavaScript share canonical evidence identity', () => {
  const record = { schemaVersion: 1, platform: 'chesscom', rules: 'chess', source: 'pubapi-stats', resourceKey: 'fixture', usernameCanonical: 'alice', timeClass: 'blitz', rating: 1900, sourceEffectiveAtMs: 1000, gameKey: null, recordDigest: 'fixture-record' };
  const canonical = JSON.stringify(Object.fromEntries(Object.keys(record).sort().map(key => [key, record[key]])));
  const expected = createHash('sha256').update(canonical, 'utf8').digest('hex');
  const source = "import json;from core.rating_tracker.contracts import RatingObservation;print(json.dumps(RatingObservation('chesscom:player:41','alice','blitz',1900,'pubapi-stats',2000,1000,'fixture',recordDigest='fixture-record').to_dict()))";
  const observed = JSON.parse(execFileSync('python', ['-c', source], { cwd: path.resolve(__dirname, '..'), encoding: 'utf8' }));
  assert.equal(observed.observationId, expected);
  const schema = JSON.parse(fs.readFileSync(path.join(__dirname, '../core/rating_tracker/contracts.schema.json'), 'utf8'));
  schema.required.forEach(key => assert(Object.hasOwn(observed, key), key));
});
test('identity and route contracts do not infer board ownership', () => {
  assert.equal(username(' TEST_User '), 'test_user');
  assert.equal(username('opponent<script>'), null);
  assert.equal(gameReference('https://www.chess.com/game/123?move=18').gameKey, 'chesscom:unknown:123');
  assert.equal(gameReference('https://www.chess.com/live/game/123').gameKey, 'chesscom:live:123');
  assert.equal(gameReference('https://www.chess.com/game/daily/123').gameKey, 'chesscom:daily:123');
  assert.equal(gameReference('https://www.chess.com/analysis'), null);
});
test('missing and concealed ratings are never zero', () => {
  for (const value of ['', '—', 'Hidden', '+19', '1900 +19', '-1', '100001']) assert.equal(readRating(value), null, value);
  assert.equal(readRating('(1900)'), 1900);
  assert.equal(readRating('0'), 0);
});
test('offline snapshot cache is presentation-only and always stale', () => {
  const original = { schemaVersion: 1, goals: [{ goalId: 'goal', progress: 40, view: { confirmed: { rating: 1900 }, state: 'verified', eligible: true } }], notifications: [{ message: 'Goal Reached' }] };
  const stale = staleSnapshot(original);
  assert.equal(stale.goals[0].view.confirmed.rating, 1900);
  assert.equal(stale.goals[0].progress, 40);
  assert.equal(stale.goals[0].view.eligible, false);
  assert.equal(stale.goals[0].view.state, 'stale');
  assert.deepEqual(stale.notifications, []);
  assert.equal(original.goals[0].view.state, 'verified');
  let saved; const cache = snapshotCache({ setItem(_, value) { saved = value; }, getItem() { return saved; } }, 'fixture');
  cache.write(original); assert.equal(cache.read().goals[0].view.state, 'stale');
});
test('DOM observer requires explicit account navigation and category', () => {
  const document = { querySelectorAll() { return []; } };
  const result = readPage(document, { location: { href: 'https://www.chess.com/game/123' } });
  assert.equal(result.username, null);
  assert.equal(result.reason, 'identity-unavailable');
});
test('GM transport serializes local JSON and supports cancellation/timeouts/errors', async () => {
  let options;
  let aborted = 0;
  const transport = createTransport({ gmRequest(value) { options = value; return { abort() { aborted++; } }; } });
  let result = transport.request('/rating-goals/snapshot');
  options.onload({ status: 200, responseText: '{"schemaVersion":1}' });
  assert.deepEqual(await result, { schemaVersion: 1 });
  result = transport.request('/rating-games/terminal', { method: 'POST', body: { username: 'test' } });
  assert.equal(options.data, '{"username":"test"}');
  options.ontimeout(); await assert.rejects(result, /timed out/);
  result = transport.request('/rating-goals/snapshot'); options.onload({ status: 429 }); await assert.rejects(result, error => error.status === 429);
  result = transport.request('/rating-goals/snapshot'); options.onload({ status: 200, responseText: 'bad-json' }); await assert.rejects(result, /Invalid/);
  const controller = new AbortController(); result = transport.request('/rating-goals/snapshot', { signal: controller.signal }); controller.abort(); await assert.rejects(result, /cancelled/); assert.equal(aborted, 1);
  await assert.rejects(transport.request('/getmove'), /Invalid tracker route/);
  assert.throws(() => createTransport({ baseUrl: 'https://example.com' }), /loopback/);
  transport.destroy();
});
test('persistent outbox deduplicates, restores and never remaps account evidence', async () => {
  let saved = null;
  const storage = { getItem() { return saved; }, setItem(_, value) { saved = value; } };
  const writes = [];
  const transport = { async request(url, options) { writes.push([url, options.body]); } };
  const outbox = createOutbox({ storage, transport });
  outbox.enqueue('/rating-games/terminal', { username: 'first', gameUrl: '/game/live/1' }, 'first:1');
  outbox.enqueue('/rating-games/terminal', { username: 'first', gameUrl: '/game/live/1' }, 'first:1');
  outbox.enqueue('/rating-games/terminal', { username: 'second', gameUrl: '/game/live/2' }, 'second:2');
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(writes.length, 2);
  assert.deepEqual(writes.map(item => item[1].username), ['first', 'second']);
  assert.equal(outbox.size, 0);
  assert.deepEqual(JSON.parse(saved), []);
  outbox.destroy();
});
test('outbox persistence failure is explicit and schema category enums match frontend', async () => {
  const errors = [];
  const outbox = createOutbox({ storage: { getItem() { throw Error(); }, setItem() { throw Error(); } }, transport: { async request() {} }, onError: value => errors.push(value) });
  outbox.enqueue('/rating-observations/dom', { username: 'sample', rating: 1900 }, 'sample:rating');
  await new Promise(resolve => setImmediate(resolve));
  assert(errors.includes('outbox-read-failed'));
  assert(errors.includes('outbox-save-failed'));
  outbox.destroy();
  const schema = JSON.parse(fs.readFileSync(path.join(__dirname, '../core/rating_tracker/contracts.schema.json'), 'utf8'));
  assert.deepEqual(schema.properties.timeClass.enum, ['bullet', 'blitz', 'rapid', 'daily']);
});

(async () => {
  for (const [name, run] of tests) { await run(); process.stdout.write(`PASS ${name}\n`); }
  process.stdout.write(`${tests.length} Rating Tracker frontend contract tests passed\n`);
})().catch(error => { console.error(error); process.exitCode = 1; });
