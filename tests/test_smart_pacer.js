const fs = require("fs");
const vm = require("vm");
const source = fs.readFileSync("script.js", "utf8");
const start = source.indexOf("  class SmartPacer {");
const end = source.indexOf("  const smartPacer = new SmartPacer();", start);
if (start < 0 || end < 0) throw new Error("SmartPacer block not found");
const SmartPacer = vm.runInNewContext(`${source.slice(start, end)}\nSmartPacer`, { setTimeout, clearTimeout, DOMException });
const integrationStart = source.indexOf("  const getSmartPacerClockValues =");
const integrationEnd = source.indexOf("  const get_number =", integrationStart);
const rect = (top, left = 900) => ({ top, bottom: top + 40, left, right: left + 80, width: 80, height: 40 });
const container = (top, left) => ({ nodeType: 1, getBoundingClientRect: () => rect(top, left), getAttribute: () => null });
const topClock = container(100, 900);
const bottomClock = container(760, 900);
const clocks = [
  { textContent: "0:42", nodeType: 1, closest: () => topClock, getAttribute: () => null },
  { textContent: "0:42", nodeType: 1, closest: () => topClock, getAttribute: () => null },
  { textContent: "1:18", nodeType: 1, closest: () => bottomClock, getAttribute: () => null },
  { textContent: "4:44", nodeType: 1, hidden: true, closest: () => container(400, 900), getAttribute: () => null },
  { textContent: "9:59", nodeType: 1, closest: () => container(1400, 20), getAttribute: () => null },
  { textContent: "broken", nodeType: 1, closest: () => container(300, 900), getAttribute: () => null },
];
const clockRoot = { querySelectorAll: () => clocks };
const boardElement = { getBoundingClientRect: () => ({ top: 140, bottom: 740, left: 220, right: 820, width: 600, height: 600 }), closest: () => clockRoot };
const integration = vm.runInNewContext(`${source.slice(start, end)}
const smartPacer = new SmartPacer({ random: () => 0.5 });
let lastEvalFen = ""; let lastEvalData = null;
${source.slice(integrationStart, integrationEnd)}
({ auto_move_piece, smartPacer, getSmartPacerClockValues, deriveSmartPacerPhase, getSmartPacerEvaluation,
setEval: (fen, data) => { lastEvalFen = fen; lastEvalData = data; } })`, {
  setTimeout, clearTimeout, DOMException, log: () => {}, window: { getComputedStyle: () => ({ display: "block", visibility: "visible", opacity: "1" }) },
  document: { querySelector: () => boardElement, querySelectorAll: () => clocks },
});
const assert = (condition, message) => { if (!condition) throw new Error(message); };

(async () => {
  const pacer = new SmartPacer({ random: () => 0.5 });
  assert(pacer.parseTime("9.8") === 9800 && pacer.parseTime("1:05") === 65000, "clock parsing failed");
  for (const malformed of ["", "1:", "1:60", "1:60:00", "1:02:99"]) {
    let rejected = false; try { pacer.parseTime(malformed); } catch (error) { rejected = error?.name === "TypeError"; }
    assert(rejected, `malformed clock accepted: ${malformed}`);
  }
  const delay = (extra = {}) => pacer.calculateDelay({ userTime: "1:00", opponentTime: "1:00", phase: "middlegame", legalMovesCount: 18, evaluation: { cp: 220, mate: null }, ...extra });
  const opening = delay({ phase: "opening", legalMovesCount: 20, evaluation: null });
  const quiet = delay({ legalMovesCount: 12 });
  const complex = delay({ legalMovesCount: 40, evaluation: { cp: 0, mate: null } });
  assert(complex > quiet && quiet > opening && complex - opening > 700, "adaptive timing ordering failed");
  assert(delay({ userTime: "1:30", opponentTime: "0:45", legalMovesCount: 26 }) > delay({ userTime: "0:45", opponentTime: "1:30", legalMovesCount: 26 }), "clock balance failed");
  assert(delay({ userTime: null, opponentTime: null, legalMovesCount: 40, evaluation: { cp: 0 } }) > delay({ userTime: null, opponentTime: null, legalMovesCount: 10, evaluation: { cp: 300 } }), "missing clocks collapsed adaptation");
  for (const emergency of [delay({ isForced: true }), delay({ userTime: "9.8" })]) assert(emergency >= 150 && emergency <= 250, "emergency bounds failed");
  assert(delay({ userTime: 100, isForced: true }) <= 4, "very-low clock exceeded safe-share cap");
  assert(integration.deriveSmartPacerPhase("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 4") === "opening", "opening FEN failed");
  assert(integration.deriveSmartPacerPhase("8/8/4k3/8/8/4K3/6R1/8 w - - 0 42") === "endgame", "endgame FEN failed");
  for (const malformedFen of ["", "fen-old", "8/8/8 w - - 0 1", "9/8/8/8/8/8/8/8 w - - 0 1"]) assert(integration.deriveSmartPacerPhase(malformedFen) === "middlegame", "malformed FEN was classified");
  assert(integration.getSmartPacerClockValues().userTime === "1:18", "player clock identity failed");
  integration.setEval("old", { cp: 0 });
  assert(integration.getSmartPacerEvaluation("new") === null && integration.getSmartPacerEvaluation("old").cp === 0, "FEN eval guard failed");

  const move = { from: "e2", to: "e4" }; let legal = [move, { from: "d2", to: "d4" }]; let fen = "r3k2r/pp1n1ppp/2pbpn2/q7/2BPP3/2N2N2/PPQ2PPP/R3K2R w KQkq - 2 14"; const played = [];
  const board = { game: { getLegalMoves: () => legal, getFEN: () => fen, move: (m) => played.push(m) } };
  assert(integration.auto_move_piece("e2", "e4", board, 5, { forceImmediate: true }) === true, "MAX forceImmediate was not synchronous");
  played.length = 0;
  let input; let options; const original = integration.smartPacer.schedule.bind(integration.smartPacer);
  integration.smartPacer.schedule = (cb, value, opts) => { input = value; options = opts; return original(cb, value, opts); };
  const scheduled = integration.auto_move_piece("e2", "e4", board, 0.01);
  assert(input.phase === "middlegame" && input.legalMovesCount === 2 && options.exactDelay === false, "production snapshot failed");
  await scheduled.promise;
  played.length = 0; const expectedFen = fen; const stale = integration.auto_move_piece("e2", "e4", board, 0.01, { expectedFen }); fen = "changed";
  assert(await stale.promise === false && played.length === 0, "stale move guard failed");
  fen = expectedFen; let enabled = true; const disabled = integration.auto_move_piece("e2", "e4", board, 0.01, { expectedFen, shouldExecute: () => enabled }); enabled = false;
  assert(await disabled.promise === false, "automation guard failed");
  const originalGame = board.game; const replaced = integration.auto_move_piece("e2", "e4", board, 0.01, { expectedFen }); board.game = { ...originalGame };
  assert(await replaced.promise === false && played.length === 0, "replacement game object guard failed"); board.game = originalGame;
  const exact = integration.auto_move_piece("e2", "e4", board, 0.01, { useSmartPacing: false }); assert(exact.delayMs === 10, "Smart Pacing OFF changed delay"); await exact.promise;
  legal = [move]; const pending = integration.auto_move_piece("e2", "e4", board, 10); assert(integration.auto_move_piece("a1", "a2", board, 0) === null, "invalid replacement executed");
  let cancelled; try { await pending.promise; } catch (error) { cancelled = error; } assert(cancelled?.name === "AbortError", "superseded schedule not cancelled");
  assert(!source.includes("computeSmartPacing"), "legacy pacing policy remains");
  const requestSource = source.slice(source.indexOf("  function request_move()"), source.indexOf("  function ensureGhostRecoveryControl"));
  assert((requestSource.match(/auto_move_piece\s*\(/g) || []).length === 2 && !/setTimeout\s*\([\s\S]{0,300}auto_move_piece/.test(requestSource), "scheduler ownership changed");
  const cacheStart = requestSource.indexOf("if (currentCache.has(cacheKey))");
  const cacheSchedule = requestSource.indexOf("auto_move_piece(", cacheStart);
  assert(cacheStart >= 0 && requestSource.indexOf("checkfen = fen", cacheStart) < cacheSchedule, "cached branch did not set checkfen before scheduling");
  console.log("SmartPacer adaptive timing, MAX, FEN/eval, clocks, and execution safety passed.");
})().catch((error) => { process.stderr.write(`${error.stack || error}\n`); process.exitCode = 1; });
