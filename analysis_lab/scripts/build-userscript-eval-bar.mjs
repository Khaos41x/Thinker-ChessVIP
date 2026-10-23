import { build } from 'esbuild';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const labRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repositoryRoot = path.resolve(labRoot, '..');
const entry = path.join(repositoryRoot, 'frontend', 'eval_bar', 'userscript-adapter.ts');
const stylesheet = path.join(labRoot, 'src', 'ui', 'eval-bar.css');
const userscript = path.join(repositoryRoot, 'script.js');
const startMarker = '/* THINKER_EVAL_BAR_V2_GENERATED_START */';
const endMarker = '/* THINKER_EVAL_BAR_V2_GENERATED_END */';
const insertionPoint = '\n(function () {\n  "use strict";';
const checkOnly = process.argv.includes('--check');

const css = await readFile(stylesheet, 'utf8');
const result = await build({
  entryPoints: [entry],
  bundle: true,
  write: false,
  format: 'iife',
  globalName: 'ThinkerEvalBarV2Bundle',
  platform: 'browser',
  target: ['es2022'],
  minify: true,
  legalComments: 'none',
  define: { __THINKER_EVAL_BAR_CSS__: JSON.stringify(css) },
  footer: { js: 'globalThis.ThinkerEvalBarV2 = ThinkerEvalBarV2Bundle;' },
});

const generated = `${startMarker}\n${result.outputFiles[0].text.trim()}\n${endMarker}`;
const current = await readFile(userscript, 'utf8');
const start = current.indexOf(startMarker);
const end = current.indexOf(endMarker);
let next;

if (start >= 0 || end >= 0) {
  if (start < 0 || end < start) throw new Error('invalid Eval Bar V2 generated markers in script.js');
  next = current.slice(0, start) + generated + current.slice(end + endMarker.length);
} else {
  const insertion = current.indexOf(insertionPoint);
  if (insertion < 0) throw new Error('userscript insertion point was not found');
  next = current.slice(0, insertion) + `\n${generated}\n` + current.slice(insertion);
}

process.stdout.write(`Userscript size (informational): ${Buffer.byteLength(next, 'utf8')} bytes\n`);

if (checkOnly) {
  if (next !== current) {
    process.stderr.write('script.js contains a stale Eval Bar V2 bundle\n');
    process.exitCode = 1;
  }
} else if (next !== current) {
  await writeFile(userscript, next, 'utf8');
  process.stdout.write('Updated script.js Eval Bar V2 bundle\n');
} else {
  process.stdout.write('script.js Eval Bar V2 bundle is current\n');
}
