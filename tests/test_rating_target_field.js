const assert = require('node:assert/strict');
const { mountTarget } = require('../frontend/rating_tracker/target-field');

class Node {
  constructor() { this.children = []; this.events = {}; this.attributes = {}; this.value = ''; }
  append(...nodes) { this.children.push(...nodes); }
  remove() {}
  addEventListener(name, listener) { this.events[name] = listener; }
  setAttribute(name, value) { this.attributes[name] = value; }
  removeAttribute(name) { delete this.attributes[name]; }
  setCustomValidity(value) { this.validationMessage = value; }
  reportValidity() {}
}
const tick = () => new Promise(resolve => setImmediate(resolve));
(async () => {
  const document = { head: new Node(), createElement: () => new Node() };
  const host = new Node();
  let value = null;
  let release;
  let delayRead = false;
  let releaseRead;
  const writes = [];
  const field = mountTarget({ window: { document }, host, request: async (_, options = {}) => {
    if (!options.method && delayRead) { delayRead = false; return new Promise(resolve => { releaseRead = resolve; }); }
    if (options.method === 'POST') {
      writes.push(options.body.target);
      await new Promise(resolve => { release = resolve; });
      value = options.body.target;
    }
    return { target: value };
  } });
  const input = host.children[0].children[1];
  const type = text => { input.value = text; input.events.input(); };
  const enter = () => input.events.keydown({ key: 'Enter', preventDefault() {} });
  try {
    await tick();
    type('2200'); enter();
    type('23'); release(); await tick();
    assert.deepEqual(writes, [2200], 'Typing during an in-flight save must not commit a partial draft');
    assert.equal(input.value, '23');
    type('2300'); enter();
    type('2400'); enter(); release(); await tick();
    assert.deepEqual(writes, [2200, 2300, 2400], 'An explicit queued commit must be honored');
    release(); await tick();
    assert.equal(input.value, '2400');
    value = 2500; await field.refresh(); assert.equal(input.value, '2500');
    type('2600'); value = 2700; await field.refresh(); assert.equal(input.value, '2600');
    type('invalid'); enter(); assert.equal(input.attributes['aria-invalid'], 'true');
    assert.equal(writes.length, 3);
    type(''); input.events.blur(); release(); await tick(); assert.equal(value, null);
    delayRead = true;
    const staleRead = field.refresh();
    type('2800'); enter(); release(); await tick();
    releaseRead({target: null}); await staleRead;
    assert.equal(input.value, '2800', 'A delayed pre-save GET cannot replace the saved value');
    type('2900'); enter();
    type('3000'); enter();
    type('30'); release(); await tick();
    assert.equal(writes.at(-1), 2900, 'Editing after a queued commit invalidates that commit');
    assert.equal(input.value, '30');
    console.log('PASS target field: explicit commit boundaries, queued edits, live synchronization, draft preservation, validation and clear');
  } finally { field.destroy(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
