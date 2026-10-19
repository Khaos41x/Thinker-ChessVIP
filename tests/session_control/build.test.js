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
  assert(after.includes("refreshDeploymentStatus(recovered).catch(() => {})"), "production recovery does not retry calibration status asynchronously");
  assert(after.includes("publishRecoveredQueue(recovered, unavailableReadiness(recovered, \"CALIBRATION_REVALIDATION_REQUIRED\"))"), "production recovery does not restore persisted queue context before server revalidation");
  assert.equal(after.includes("const deploymentStatus = await globalThis.krypbotCalibrationApi.status();\n    sessionControlTargetScaleId"), false, "calibration status still blocks production bootstrap");
  assert.equal(after, before, "consecutive userscript builds are not byte-identical");
  assert.equal(partsAfter.before, partsBefore.before, "build changed bytes before the generated region");
  assert.equal(partsAfter.after, partsBefore.after, "build changed bytes after the generated region");
  const forbiddenLoaderTokens = [
    /\beval\s*\(/,
    /\b(?:new\s+)?Function\s*\(/,
    /\bDecompressionStream\b/,
    /\bBlob\b/,
    /\bResponse\b/,
    /\batob\b/,
    /\bdata:/,
    /\bblob:/,
    /createElement\s*\(\s*["']script["']\s*\)/,
    /URL\.createObjectURL\s*\(/,
  ];
  for (const token of forbiddenLoaderTokens) {
    assert.equal(token.test(partsAfter.region), false, `generated region contains forbidden dynamic-loader token ${token}`);
  }
  const restrictedContextOptions = { codeGeneration: { strings: false, wasm: false } };
  const context = vm.createContext({ console, crypto: globalThis.crypto }, restrictedContextOptions);
  vm.runInContext(partsAfter.region, context);
  assert.equal(typeof context.ThinkerSessionControlReady.then, "function");
  const api = await context.ThinkerSessionControlReady;
  assert(context.ThinkerSessionControl);
  assert.equal(api, context.ThinkerSessionControl);
  assert.equal(typeof context.ThinkerSessionControl.reduce, "function");
  assert.equal(typeof context.ThinkerSessionControl.IndexedDbRepository, "function");

  const failingContext = vm.createContext({ console, crypto: globalThis.crypto }, restrictedContextOptions);
  const indexFactory = 'factories["index"]=function(module,exports,require){';
  assert(partsAfter.region.includes(indexFactory), "generated region is missing the index module factory");
  const failingRegion = partsAfter.region.replace(indexFactory, `${indexFactory}throw new Error("MODULE_INITIALIZATION_FAILED");`);
  vm.runInContext(failingRegion, failingContext);
  assert.equal(typeof failingContext.ThinkerSessionControlReady.then, "function");
  await assert.rejects(failingContext.ThinkerSessionControlReady, /MODULE_INITIALIZATION_FAILED/);
  assert.equal(failingContext.ThinkerSessionControl, undefined);
}

module.exports = { run };
