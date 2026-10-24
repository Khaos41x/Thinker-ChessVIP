const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('script.js', 'utf8');
const start = source.indexOf('  const SHAFT_W =');
const end = source.indexOf('  let cached_board =', start);
const rendering = source.slice(start, end);
const sandbox = { Math, Number };
vm.runInNewContext(rendering + ';globalThis.subject={recommendationArrowPath,SHAFT_W,HEAD_W,HEAD_L,TAIL_INSET,OPACITY,SHOW_SQUARE_HIGHLIGHTS};', sandbox);
const subject = sandbox.subject;
assert.equal(subject.SHOW_SQUARE_HIGHLIGHTS, false);
for (const delta of [[0,1],[0,7],[1,0],[7,0],[4,4],[-4,-4],[1,2],[0,0.5]]) {
  const path = subject.recommendationArrowPath(0.5,0.5,0.5+delta[0],0.5+delta[1]);
  const coordinates = [...path.matchAll(/[-+]?(?:\d*\.)?\d+(?:e[-+]?\d+)?/gi)].map(match=>Number(match[0]));
  assert.equal(coordinates.length,14);
  assert(coordinates.every(Number.isFinite));
  assert(Math.abs(coordinates[6]-(0.5+delta[0]))<1e-12);
  assert(Math.abs(coordinates[7]-(0.5+delta[1]))<1e-12);
  assert(path.endsWith('Z'));
}
assert.equal(subject.recommendationArrowPath(1,1,1,1),'');
assert.equal(subject.recommendationArrowPath(NaN,1,2,2),'');
assert(!rendering.includes('<marker'));
assert(!rendering.includes('<line'));
assert(!rendering.includes('drop-shadow'));
assert.equal((source.match(/\.myarrow[^\n]*drop-shadow/g)||[]).length,0);
module.exports={rendering, constants:{SHAFT_W:subject.SHAFT_W,HEAD_W:subject.HEAD_W,HEAD_L:subject.HEAD_L,TAIL_INSET:subject.TAIL_INSET,OPACITY:subject.OPACITY}};
console.log('PASS recommendation arrow geometry: straight, diagonal, knight, short, long, zero and invalid lengths');
