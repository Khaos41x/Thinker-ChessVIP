"use strict";

const assert = require("node:assert/strict");
const childProcess = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

function splitArtifact(source) {
  const startMarker = "/* THINKER_SESSION_CONTROL_GENERATED_START */";
  const endMarker = "/* THINKER_SESSION_CONTROL_GENERATED_END */";
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker);
  assert(start >= 0 && end > start, "generated region markers are missing");
  return { before: source.slice(0, start), region: source.slice(start, end + endMarker.length), after: source.slice(end + endMarker.length) };
}

async function run() {
  const root = path.resolve(__dirname, "../..");
  const target = path.join(root, "script.js");
  const before = fs.readFileSync(target, "utf8");
  const partsBefore = splitArtifact(before);
  childProcess.execFileSync("python", [path.join(root, "scripts", "build_userscript.py")], { cwd: root });
  const after = fs.readFileSync(target, "utf8");
  const partsAfter = splitArtifact(after);
  assert.equal(after, before, "consecutive userscript builds are not byte-identical");
  assert.equal(partsAfter.before, partsBefore.before, "build changed bytes before the generated region");
  assert.equal(partsAfter.after, partsBefore.after, "build changed bytes after the generated region");
  const context = vm.createContext({ TextDecoder, TextEncoder, DecompressionStream, Blob, Response, Uint8Array, atob, console, crypto: globalThis.crypto });
  vm.runInContext(partsAfter.region, context);
  await context.ThinkerSessionControlReady;
  assert(context.ThinkerSessionControl);
  assert.equal(typeof context.ThinkerSessionControl.reduce, "function");
  assert.equal(typeof context.ThinkerSessionControl.IndexedDbRepository, "function");
}

module.exports = { run };
