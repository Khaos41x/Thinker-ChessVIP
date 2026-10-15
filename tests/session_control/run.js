"use strict";

const suites = [
  ["models", require("./models.test")],
  ["statistics", require("./statistics.test")],
  ["reducer", require("./reducer.test")],
  ["ports", require("./ports.test")],
  ["repository", require("./repository.test")],
  ["recovery", require("./recovery.test")],
  ["leader", require("./leader.test")],
  ["controller", require("./controller.test")],
  ["platform-chesscom", require("./platform-chesscom.test")],
  ["phase3", require("./phase3.test")],
  ["phase4", require("./phase4.test")],
  ["build", require("./build.test")],
];

(async () => {
  let passed = 0;
  for (const [name, suite] of suites) {
    await suite.run();
    passed += 1;
    process.stdout.write(`ok ${passed} - ${name}\n`);
  }
  process.stdout.write(`1..${passed}\n`);
})().catch((error) => {
  console.error(error && error.stack ? error.stack : error);
  process.exitCode = 1;
});
