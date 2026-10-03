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

  console.log("SmartPacer parsing, pacing, and cancellation assertions passed.");
})().catch((error) => {
  process.stderr.write(`${error.stack || error}\n`);
  process.exitCode = 1;
});
