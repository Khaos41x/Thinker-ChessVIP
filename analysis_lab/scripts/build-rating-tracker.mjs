import { build } from 'esbuild';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const script = path.join(root, 'script.js');
const start = '/* THINKER_RATING_TRACKER_GENERATED_START */';
const end = '/* THINKER_RATING_TRACKER_GENERATED_END */';
const result = await build({ entryPoints: [path.join(root, 'frontend/rating_tracker/index.js')], bundle: true, write: false, format: 'iife', globalName: 'ThinkerRatingTrackerBundle', platform: 'browser', target: ['es2022'], minify: true, legalComments: 'none', footer: { js: 'globalThis.ThinkerRatingTracker = ThinkerRatingTrackerBundle;' } });
const external = await build({ entryPoints: [path.join(root, 'frontend/rating_tracker/external.js')], bundle: true, write: false, format: 'iife', platform: 'browser', target: ['es2022'], minify: true, legalComments: 'none' });
const current = await readFile(script, 'utf8');
const generated = `${start}\n${result.outputFiles[0].text.trim()}\n${end}`;
const a = current.indexOf(start);
const b = current.indexOf(end);
let next;
if (a >= 0 || b >= 0) {
  if (a < 0 || b < a) throw new Error('Invalid Rating Tracker bundle markers');
  next = current.slice(0, a) + generated + current.slice(b + end.length);
} else {
  const point = current.indexOf('\n(function () {\n  "use strict";');
  if (point < 0) throw new Error('Userscript insertion point not found');
  next = current.slice(0, point) + `\n${generated}\n` + current.slice(point);
}
const externalPath = path.join(root, 'frontend/external_config/rating-tracker.js');
if (process.argv.includes('--check')) {
  if (next !== current || await readFile(externalPath, 'utf8').catch(() => '') !== external.outputFiles[0].text) { process.stderr.write('Rating Tracker bundle is stale\n'); process.exitCode = 1; }
} else {
  if (next !== current && !process.argv.includes('--external-only')) await writeFile(script, next, 'utf8');
  await writeFile(externalPath, external.outputFiles[0].text, 'utf8');
}
process.stdout.write(`Rating Tracker: ${result.outputFiles[0].contents.byteLength} bytes; userscript: ${Buffer.byteLength(next)} bytes (informational)\n`);
