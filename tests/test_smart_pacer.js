const fs = require("fs");
const vm = require("vm");

const source = fs.readFileSync("script.js", "utf8");
const start = source.indexOf("  class SmartPacer {");
const end = source.indexOf("  const smartPacer = new SmartPacer();", start);

if (start < 0 || end < 0) {
  throw new Error("SmartPacer block not found in script.js");
}

const SmartPacer = vm.runInNewContext(
  `${source.slice(start, end)}\nSmartPacer`,
  { setTimeout, clearTimeout, DOMException },
);

const integrationStart = source.indexOf("  const getSmartPacerClockValues =");
const integrationEnd = source.indexOf("  const get_number =", integrationStart);
if (integrationStart < 0 || integrationEnd < 0) {
  throw new Error("auto_move_piece SmartPacer integration block not found");
}

const integrationContext = {
  setTimeout,
  clearTimeout,
  DOMException,
  document: {
    querySelectorAll: () => [
      { textContent: "1:00" },
      { textContent: "1:00" },
    ],
  },
  log: () => {},
};
const integration = vm.runInNewContext(
  `${source.slice(start, end)}
const smartPacer = new SmartPacer({ random: () => 0.5 });
${source.slice(integrationStart, integrationEnd)}
({ auto_move_piece, smartPacer })`,
  integrationContext,
);

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

(async () => {
  const pacer = new SmartPacer({ random: () => 0.5 });

  assert(pacer.parseTime(9800) === 9800, "numeric milliseconds changed");
  assert(pacer.parseTime("9.8") === 9800, "decimal clock seconds were not converted");
  assert(pacer.parseTime("1:05") === 65000, "minute clock parsing failed");
  assert(pacer.parseTime("1:02:03.5") === 3723500, "hour clock parsing failed");
  for (const invalid of ["", "1:", "1:60", "1:60:00", "1:02:99"]) {
    let rejected = false;
    try {
      pacer.parseTime(invalid);
    } catch (error) {
      rejected = error?.name === "TypeError";
    }
    assert(rejected, `invalid clock was accepted: ${invalid}`);
  }

  const forced = pacer.calculateDelay({
    userTime: "45",
    opponentTime: "40",
    baseDelayMs: 1000,
    complexityMultiplier: 1.8,
    isForced: true,
  });
  assert(forced >= 150 && forced <= 250, "forced delay escaped emergency bounds");

  const lowTime = pacer.calculateDelay({
    userTime: "9.8",
    opponentTime: "8.1",
    baseDelayMs: 1000,
    complexityMultiplier: 1.8,
    isForced: false,
  });
  assert(lowTime >= 150 && lowTime <= 250, "sub-ten-second delay escaped emergency bounds");

  const bounded = new SmartPacer({ random: () => 0 });
  const delay = bounded.calculateDelay({
    userTime: 60000,
    opponentTime: 60000,
    baseDelayMs: 1000,
    complexityMultiplier: 1,
  });
  assert(delay >= 820 && delay <= 1180, "Gaussian jitter escaped +/-18 percent");

  const scheduled = pacer.schedule(
    () => "late",
    {
      userTime: "45",
      opponentTime: "45",
      baseDelayMs: 1000,
      complexityMultiplier: 1,
    },
  );
  pacer.cancel();
  let cancellation = null;
  try {
    await scheduled.promise;
  } catch (error) {
    cancellation = error;
  }
  assert(cancellation?.name === "AbortError", "cancel did not reject the pending promise");

  const exact = pacer.schedule(
    () => "exact",
    {
      userTime: "1:00",
      opponentTime: "1:00",
      baseDelayMs: 1,
      complexityMultiplier: 1,
    },
    { exactDelay: true },
  );
  assert(exact.delayMs === 1, "exact-delay scheduling modified the base delay");
  await exact.promise;

  const legalMove = { from: "e2", to: "e4" };
  const playedMoves = [];
  let currentMoves = [legalMove, { from: "d2", to: "d4" }];
  const game = {
    getLegalMoves: () => currentMoves,
    move: (move) => playedMoves.push(move),
    getFEN: () => currentFen,
  };
  const board = { game };
  let currentFen = "fen-1";

  const immediate = integration.auto_move_piece("e2", "e4", board, 0);
  assert(immediate === true, "zero-delay move was not executed synchronously");
  assert(playedMoves.length === 1, "zero-delay move executed more than once");

  playedMoves.length = 0;
  let observedPacingInput = null;
  let observedScheduleOptions = null;
  const originalSchedule = integration.smartPacer.schedule.bind(
    integration.smartPacer,
  );
  integration.smartPacer.schedule = (callback, pacingInput, options) => {
    observedPacingInput = pacingInput;
    observedScheduleOptions = options;
    return originalSchedule(callback, pacingInput, options);
  };
  const delayed = integration.auto_move_piece("e2", "e4", board, 0.01);
  assert(delayed && delayed.delayMs >= 0, "positive delay did not use SmartPacer");
  assert(observedPacingInput.baseDelayMs === 10, "seconds were not converted to milliseconds");
  assert(observedPacingInput.userTime === "1:00", "player clock was not passed to SmartPacer");
  assert(observedPacingInput.opponentTime === "1:00", "opponent clock was not passed to SmartPacer");
  assert(observedPacingInput.isForced === false, "forced state was not passed to SmartPacer");
  assert(observedScheduleOptions.exactDelay === false, "valid clocks bypassed SmartPacer refinement");
  await delayed.promise;
  assert(playedMoves.length === 1, "scheduled move did not execute exactly once");

  playedMoves.length = 0;
  currentMoves = [legalMove, { from: "d2", to: "d4" }];
  currentFen = "fen-1";
  const stale = integration.auto_move_piece("e2", "e4", board, 0.02, {
    expectedFen: currentFen,
  });
  currentFen = "fen-2";
  const staleResult = await stale.promise;
  assert(staleResult === false, "stale scheduled move was not suppressed");
  assert(playedMoves.length === 0, "stale scheduled move reached game.move");

  currentFen = "fen-2";
  let automationEnabled = true;
  const disabled = integration.auto_move_piece("e2", "e4", board, 0.02, {
    expectedFen: currentFen,
    shouldExecute: () => automationEnabled,
  });
  automationEnabled = false;
  const disabledResult = await disabled.promise;
  assert(disabledResult === false, "disabled automation still executed a move");
  assert(playedMoves.length === 0, "disabled automation reached game.move");

  const exactAutoMove = integration.auto_move_piece("e2", "e4", board, 0.01, {
    expectedFen: currentFen,
    useSmartPacing: false,
  });
  assert(exactAutoMove.delayMs === 10, "Smart Pacing OFF changed the configured delay");
  await exactAutoMove.promise;

  currentMoves = [legalMove];
  const pending = integration.auto_move_piece("e2", "e4", board, 10);
  const replacement = integration.auto_move_piece("a1", "a2", board, 0);
  let pendingCancellation = null;
  try {
    await pending.promise;
  } catch (error) {
    pendingCancellation = error;
  }
  assert(pendingCancellation?.name === "AbortError", "new move did not cancel old schedule");
  assert(replacement === null, "invalid replacement was unexpectedly executed");

  const immediateReplacement = integration.auto_move_piece("e2", "e4", board, 0);
  assert(immediateReplacement === true, "valid replacement move did not execute immediately");

  const requestMoveStart = source.indexOf("  function request_move()");
  const requestMoveEnd = source.indexOf("  function ensureGhostRecoveryControl", requestMoveStart);
  const requestMoveSource = source.slice(requestMoveStart, requestMoveEnd);
  assert(
    !/setTimeout\s*\([\s\S]{0,300}auto_move_piece/.test(requestMoveSource),
    "request_move still wraps auto_move_piece in raw setTimeout",
  );
  assert(
    (requestMoveSource.match(/auto_move_piece\s*\(/g) || []).length === 2,
    "cached and fresh auto-move branches are not both connected",
  );
  const cacheBranch = requestMoveSource.slice(
    requestMoveSource.indexOf("if (currentCache.has(cacheKey))"),
    requestMoveSource.indexOf("checkfen = fen", requestMoveSource.indexOf("if (currentCache.has(cacheKey))")) + 14,
  );
  assert(
    cacheBranch.includes("checkfen = fen"),
    "cached auto-move does not mark the FEN before scheduling",
  );

  console.log("SmartPacer parsing, pacing, cancellation, and auto-move assertions passed.");
})().catch((error) => {
  process.stderr.write(`${error.stack || error}\n`);
  process.exitCode = 1;
});
