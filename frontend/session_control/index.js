"use strict";

module.exports = Object.freeze({
  ...require("./clock"),
  ...require("./controller"),
  ...require("./leader"),
  ...require("./models"),
  ...require("./ports"),
  ...require("./platform-chesscom"),
  ...require("./reducer"),
  ...require("./repository"),
  ...require("./runtime"),
  ...require("./statistics"),
  ...require("./status"),
  ...require("./telemetry"),
  ...require("./ui"),
  ...require("./presentation"),
  ...require("./external"),
});
