const fs = require("fs");
const vm = require("vm");

const source = fs.readFileSync("script.js", "utf8");
const classStart = source.indexOf("  class SmartPacer {");
const classEnd = source.indexOf("  const smartPacer = new SmartPacer();", classStart);
if (classStart < 0 || classEnd < 0) throw new Error("SmartPacer block not found");

const SmartPacer = vm.runInNewContext(
  `${source.slice(classStart, classEnd)}\nSmartPacer`,
  { setTimeout, clearTimeout, DOMException },
);

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
];
const clockRoot = { querySelectorAll: () => clocks };
const boardElement = {
  getBoundingClientRect: () => ({ top: 140, bottom: 740, left: 220, right: 820, width: 600, height: 600 }),
  closest: () => clockRoot,
};
const integrationStart = source.indexOf("  const getSmartPacerClockValues =");
const integrationEnd = source.indexOf("  const get_number =", integrationStart);
const integration = vm.runInNewContext(`${source.slice(classStart, classEnd)}
const smartPacer = new SmartPacer({ random: () => 0.5 });
${source.slice(integrationStart, integrationEnd)}
({ auto_move_piece, smartPacer, getSmartPacerClockValues, deriveSmartPacerPhase, isSmartPacerTimeTrouble })`, {
  setTimeout,
  clearTimeout,
  DOMException,
  log: () => {},
  window: { getComputedStyle: () => ({ display: "block", visibility: "visible", opacity: "1" }) },
  document: { querySelector: () => boardElement, querySelectorAll: () => clocks },
});

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

(async () => {
  const pacer = new SmartPacer({ random: () => 0.5 });
  assert(pacer.parseTime("9.8") === 9800 && pacer.parseTime("1:05") === 65000, "clock parsing failed");
  for (const malformed of ["", "1:", "1:60", "1:60:00", "1:02:99"]) {
    let rejected = false;
    try { pacer.parseTime(malformed); } catch (error) { rejected = error?.name === "TypeError"; }
    assert(rejected, `malformed clock accepted: ${malformed}`);
  }

  const delay = (complexityMultiplier, extra = {}) => pacer.calculateDelay({
    userTime: "1:00",
    opponentTime: "1:00",
    phase: "middlegame",
    complexityMultiplier,
    ...extra,
  });
  const forced = delay(0.15, { isForced: true });
  const obvious = delay(0.3);
  const neutral = delay(1);
  const complex = delay(1.8);
  assert(forced >= 150 && forced <= 250, "forced target escaped reflex band");
  assert(obvious < 250, "obvious bullet target was not reflex-fast");
  assert(complex > neutral && neutral > obvious, "MultiPV complexity ordering failed");
  assert(complex <= 950, "complex bullet target exceeded the sub-second cap");
  const blitzNeutral = delay(1, { userTime: "3:00", opponentTime: "3:00" });
  const blitzComplex = delay(1.8, { userTime: "3:00", opponentTime: "3:00" });
  assert(blitzNeutral > neutral * 1.7, "bullet and blitz neutral pacing remained clustered");
  assert(blitzComplex > complex * 1.7, "bullet and blitz complex pacing remained clustered");
  assert(delay(1, { userTime: "1:30", opponentTime: "0:45" }) > delay(1, { userTime: "0:45", opponentTime: "1:30" }), "clock balance failed");
  assert(delay(1.8, { userTime: "9.8" }) >= 150 && delay(1.8, { userTime: "9.8" }) <= 250, "time trouble escaped survival band");
  assert(delay(1.8, { userTime: 100, isForced: true }) <= 4, "very-low clock exceeded safe-share cap");

  for (const randomValue of [0.01, 0.1, 0.25, 0.5, 0.75, 0.9, 0.99]) {
    const matrixPacer = new SmartPacer({ random: () => randomValue });
    for (const phase of ["opening", "middlegame", "endgame"]) {
      for (const clock of ["0:20", "0:45", "1:00", "1:30", "3:00", "5:00"]) {
        const target = (multiplier) => matrixPacer.calculateDelay({
          userTime: clock,
          opponentTime: clock,
          phase,
          complexityMultiplier: multiplier,
        });
        assert(target(0.3) < target(1) && target(1) < target(1.8), `complexity bands overlapped for ${phase} at ${clock}`);
      }
    }
  }

  let now = 3000;
  const elapsedPacer = new SmartPacer({ random: () => 0.5, now: () => now });
  const elapsed = elapsedPacer.schedule(() => true, {
    userTime: "1:00",
    opponentTime: "1:00",
    phase: "middlegame",
    complexityMultiplier: 1,
    positionObservedAt: 0,
  });
  assert(elapsed.targetDelayMs > 0 && elapsed.delayMs === 0, "engine latency was followed by an artificial delay tail");
  assert(await elapsed.promise === true, "zero remaining budget did not execute");
  const exact = elapsedPacer.schedule(() => true, { baseDelayMs: 12, positionObservedAt: 0 }, { exactDelay: true });
  assert(exact.delayMs === 12, "Smart Pacing OFF no longer preserves the configured delay");
  await exact.promise;

  assert(integration.deriveSmartPacerPhase("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 4") === "opening", "opening FEN failed");
  assert(integration.deriveSmartPacerPhase("8/8/4k3/8/8/4K3/6R1/8 w - - 0 42") === "endgame", "endgame FEN failed");
  assert(integration.getSmartPacerClockValues().userTime === "1:18", "player clock identity failed");
  assert(integration.isSmartPacerTimeTrouble("9.9") && !integration.isSmartPacerTimeTrouble("10.0"), "time-trouble boundary failed");

  const move = { from: "e2", to: "e4" };
  let fen = "r3k2r/pp1n1ppp/2pbpn2/q7/2BPP3/2N2N2/PPQ2PPP/R3K2R w KQkq - 2 14";
  const played = [];
  const board = { game: { getLegalMoves: () => [move, { from: "d2", to: "d4" }], getFEN: () => fen, move: (value) => played.push(value) } };
  assert(integration.auto_move_piece("e2", "e4", board, 5, { forceImmediate: true }) === true, "MAX was not synchronous");
  const promotionBoard = {
    game: {
      getLegalMoves: () => [{ from: "a7", to: "a8", promotion: "n" }, { from: "a7", to: "a8", promotion: "q" }],
      getFEN: () => "promotion-fen",
      move: (value) => played.push(value),
    },
  };
  played.length = 0;
  assert(integration.auto_move_piece("a7", "a8", promotionBoard, 0, { forceImmediate: true, promotion: "n" }) === true, "underpromotion was rejected");
  assert(played[0]?.promotion === "n", "underpromotion was replaced with a queen");
  played.length = 0;
  let pacingInput;
  const originalSchedule = integration.smartPacer.schedule.bind(integration.smartPacer);
  integration.smartPacer.schedule = (callback, input, options) => {
    pacingInput = input;
    return originalSchedule(callback, input, options);
  };
  const scheduled = integration.auto_move_piece("e2", "e4", board, 0.01, {
    analysis: { complexityMultiplier: 1.8, isForced: false },
    positionObservedAt: Date.now(),
  });
  assert(pacingInput.complexityMultiplier === 1.8 && pacingInput.evaluation === undefined, "real complexity did not reach the policy");
  integration.smartPacer.cancel();
  try { await scheduled.promise; } catch (error) { assert(error?.name === "AbortError", "schedule cancellation failed"); }

  const expectedFen = fen;
  const stale = integration.auto_move_piece("e2", "e4", board, 0.01, { expectedFen });
  fen = "changed";
  assert(await stale.promise === false && played.length === 0, "stale FEN executed a move");
  fen = expectedFen;
  let enabled = true;
  const disabled = integration.auto_move_piece("e2", "e4", board, 0.01, { expectedFen, shouldExecute: () => enabled });
  enabled = false;
  assert(await disabled.promise === false, "disabled automation executed a move");

  const analysisStart = source.indexOf("  const smartPacingAnalysisCache =");
  const analysisEnd = source.indexOf("  const gaussianRandom =", analysisStart);
  const pendingRequests = [];
  const analysisClient = vm.runInNewContext(`${source.slice(classStart, classEnd)}
const smartPacer = new SmartPacer({ random: () => 0.5 });
const SERVER_URL = "http://127.0.0.1:5000";
${source.slice(analysisStart, analysisEnd)}
({ requestSmartPacingAnalysis, observeSmartPacingPosition })`, {
    setTimeout,
    clearTimeout,
    DOMException,
    Date,
    JSON,
    GM_getValue: () => "test-browser-capability",
    GM_setValue: () => {},
    GM_xmlhttpRequest: (options) => {
      const request = { options, aborted: false, abort() { this.aborted = true; } };
      pendingRequests.push(request);
      return request;
    },
  });
  const first = analysisClient.requestSmartPacingAnalysis("fen-a");
  const duplicate = analysisClient.requestSmartPacingAnalysis("fen-a");
  assert(first === duplicate && pendingRequests.length === 1, "duplicate /analyze request was started for one FEN");
  assert(
    pendingRequests[0].options.headers.Authorization === "Bearer test-browser-capability",
    "Bearer capability was not attached to engine requests",
  );
  pendingRequests[0].options.onload({ status: 200, responseText: JSON.stringify({ complexityMultiplier: 1.8, isForced: false }) });
  assert((await first).complexityMultiplier === 1.8, "MultiPV response was not retained");
  await analysisClient.requestSmartPacingAnalysis("fen-a");
  assert(pendingRequests.length === 1, "cached analysis was requested again");
  const staleAnalysis = analysisClient.requestSmartPacingAnalysis("fen-b");
  analysisClient.observeSmartPacingPosition("fen-c");
  let analysisCancellation = null;
  try { await staleAnalysis; } catch (error) { analysisCancellation = error; }
  assert(analysisCancellation?.name === "AbortError" && pendingRequests[1].aborted, "old-FEN analysis was not cancelled");

  const requestSource = source.slice(source.indexOf("  function request_move()"), source.indexOf("  let scheduleThinkerBannerPosition"));
  assert(requestSource.includes("requestSmartPacingAnalysis(fen)"), "request_move never calls /analyze");
  assert(requestSource.includes("requestSmartPacingV2Plan"), "request_move never calls /move-plan");
  assert(requestSource.includes("!isPuzzleMode && (smartPacingV2Enabled"), "Puzzle can enter competitive Smart Pacing V2");
  assert(requestSource.includes("!isSmartPacerTimeTrouble(clockValues.userTime)"), "time trouble does not bypass analysis");
  assert(requestSource.includes('forceImmediate: !smartPacingEnabled && autoDelayMode === "max"'), "manual MAX still overrides Smart Pacing");
  assert(!requestSource.includes('smartPacingEnabled &&\n        isAutoMove &&\n        autoDelayMode !== "max"'), "manual delay mode still blocks Smart Pacing analysis");
  assert((requestSource.match(/auto_move_piece\s*\(/g) || []).length === 1, "more than one move scheduler remains");
  assert(!/setTimeout\s*\([\s\S]{0,300}auto_move_piece/.test(requestSource), "raw timer bypasses SmartPacer");

  console.log("SmartPacer MultiPV bands, wall-clock budget, deduplication, cancellation, and execution guards passed.");
})().catch((error) => {
  process.stderr.write(`${error.stack || error}\n`);
  process.exitCode = 1;
});
