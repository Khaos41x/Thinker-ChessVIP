const fs = require("fs");
const vm = require("vm");

const source = fs.readFileSync("script.js", "utf8");
const helperStart = source.indexOf('  const THINKER_PAGE_SCROLLBAR_CLASS = "tc-page-scrollbar-hidden";');
const helperEnd = source.indexOf("\n  function getThinkerRect", helperStart);
if (helperStart < 0 || helperEnd < 0) throw new Error("root scrollbar helper not found");

const classes = new Set();
const classList = {
  toggle(name, force) {
    if (force) classes.add(name);
    else classes.delete(name);
    return force;
  },
};
const context = { document: { documentElement: { classList } } };
vm.createContext(context);
vm.runInContext(
  source.slice(helperStart, helperEnd) +
    "\nglobalThis.setHidden=setThinkerPageScrollbarHidden;" +
    "\nglobalThis.className=THINKER_PAGE_SCROLLBAR_CLASS;",
  context,
);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

context.setHidden(true);
context.setHidden(true);
assert(classes.size === 1 && classes.has(context.className), "repeated enable was not idempotent");
context.setHidden(false);
context.setHidden(false);
assert(classes.size === 0, "repeated disable was not idempotent");

for (const marker of [
  "html.tc-page-scrollbar-hidden,",
  "html.tc-page-scrollbar-hidden body",
  "html.tc-page-scrollbar-hidden::-webkit-scrollbar",
  "html.tc-page-scrollbar-hidden body::-webkit-scrollbar",
  "scrollbar-width: none !important",
  "-ms-overflow-style: none !important",
]) {
  assert(source.includes(marker), `root scrollbar CSS marker missing: ${marker}`);
}

const styleStart = source.indexOf('<style id="tc-userscript-style">');
const styleEnd = source.indexOf("</style>", styleStart);
const styleSource = source.slice(styleStart, styleEnd);
const rootRuleStart = styleSource.indexOf("html.tc-page-scrollbar-hidden");
const wrapperRuleStart = styleSource.indexOf("#oi-wrapper", rootRuleStart);
const rootRules = styleSource.slice(rootRuleStart, wrapperRuleStart);
assert(!/overflow\s*:\s*(hidden|clip)/i.test(rootRules), "root scrollbar CSS locks document overflow");
assert(!source.includes('addEventListener("wheel"'), "userscript intercepts wheel scrolling");
assert(!source.includes('addEventListener("touchmove"'), "userscript intercepts touch scrolling");

const cleanupStart = source.indexOf("  function cleanupThinkerUiLifecycle");
const cleanupEnd = source.indexOf("\n  function failThinkerUiMount", cleanupStart);
assert(source.slice(cleanupStart, cleanupEnd).includes("setThinkerPageScrollbarHidden(false)"),
  "cleanup does not restore the root scrollbar");

const startupStart = source.indexOf("  function startThinkerUserscript");
const startupEnd = source.indexOf("\n  function maybeStartThinkerUserscript", startupStart);
const startupSource = source.slice(startupStart, startupEnd);
assert(startupSource.includes("setThinkerPageScrollbarHidden(isThinkerSupportedRoute())"),
  "initial route does not set root scrollbar visibility");
assert(startupSource.includes("setThinkerPageScrollbarHidden(false)"),
  "unsupported SPA route does not restore the root scrollbar");
assert(startupSource.includes("setThinkerPageScrollbarHidden(true)"),
  "supported SPA route does not suppress the root scrollbar");

console.log("root scrollbar suppression tests: ok");
