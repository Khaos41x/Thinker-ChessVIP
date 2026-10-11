const childProcess = require("child_process");
const fs = require("fs");
const http = require("http");
const os = require("os");
const path = require("path");

const root = path.resolve(__dirname, "..");
const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

async function waitForJson(url, timeoutMs = 10000) {
  const deadline = Date.now() + timeoutMs;
  let lastError;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return response.json();
    } catch (error) {
      lastError = error;
    }
    await sleep(100);
  }
  throw lastError || new Error(`Timed out waiting for ${url}`);
}

function createCdpClient(webSocketUrl) {
  const socket = new WebSocket(webSocketUrl);
  const pending = new Map();
  const listeners = new Map();
  let nextId = 1;

  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) reject(new Error(message.error.message));
      else resolve(message.result);
      return;
    }
    for (const listener of listeners.get(message.method) || []) listener(message.params);
  });

  return {
    opened: new Promise((resolve, reject) => {
      socket.addEventListener("open", resolve, { once: true });
      socket.addEventListener("error", reject, { once: true });
    }),
    on(method, listener) {
      if (!listeners.has(method)) listeners.set(method, []);
      listeners.get(method).push(listener);
    },
    send(method, params = {}) {
      const id = nextId++;
      return new Promise((resolve, reject) => {
        pending.set(id, { resolve, reject });
        socket.send(JSON.stringify({ id, method, params }));
      });
    },
    close() {
      socket.close();
    },
  };
}

(async () => {
  assert(fs.existsSync(chromePath), "Chrome executable not found");
  const liveChess = process.env.CHESS_LIVE === "1";

  const server = http.createServer((request, response) => {
    const pathname = decodeURIComponent(new URL(request.url, "http://127.0.0.1").pathname);
    const filePath = path.resolve(root, `.${pathname}`);
    if (!filePath.startsWith(root + path.sep) || !fs.existsSync(filePath)) {
      response.writeHead(404).end("not found");
      return;
    }
    const type = filePath.endsWith(".js") ? "text/javascript" : "text/html";
    response.writeHead(200, { "Content-Type": `${type}; charset=utf-8` });
    fs.createReadStream(filePath).pipe(response);
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const fixturePort = server.address().port;
  const debugPort = 18000 + (process.pid % 1000);
  const profileDir = fs.mkdtempSync(path.join(os.tmpdir(), "thinker-chrome-"));
  const chrome = childProcess.spawn(chromePath, [
    "--headless=new",
    "--disable-gpu",
    "--window-size=1433,900",
    "--no-first-run",
    "--no-default-browser-check",
    `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=${profileDir}`,
    "about:blank",
  ], { stdio: "ignore" });

  let client;
  try {
    const tabs = await waitForJson(`http://127.0.0.1:${debugPort}/json/list`);
    const page = tabs.find((tab) => tab.type === "page");
    assert(page?.webSocketDebuggerUrl, "Chrome page target not found");
    client = createCdpClient(page.webSocketDebuggerUrl);
    await client.opened;

    const exceptions = [];
    const consoleErrors = [];
    client.on("Runtime.exceptionThrown", ({ exceptionDetails }) => exceptions.push(exceptionDetails));
    client.on("Runtime.consoleAPICalled", ({ type, args }) => {
      if (type === "error") consoleErrors.push(args.map((item) => item.value || item.description).join(" "));
    });
    await client.send("Runtime.enable");
    await client.send("Page.enable");
    await client.send("Page.navigate", {
      url: liveChess
        ? "https://www.chess.com/play/online"
        : `http://127.0.0.1:${fixturePort}/tests/fixtures/userscript_bootstrap.html?delay=100`,
    });
    await sleep(liveChess ? 8000 : 3500);

    if (liveChess) {
      const userscript = fs.readFileSync(path.join(root, "script.js"), "utf8");
      await client.send("Runtime.evaluate", {
        expression: `window.GM_xmlhttpRequest = (options) => {
          if (options.url?.includes("/config/load")) {
            setTimeout(() => options.onload?.({ status: 200, responseText: "{}" }), 0);
          }
          return { abort() {} };
        };\n${userscript}\n//# sourceURL=thinker-userscript.js`,
      });
      await sleep(3500);
    }

    const result = await client.send("Runtime.evaluate", {
      expression: `(() => {
        const describe = (node) => {
          if (!node) return null;
          const rect = node.getBoundingClientRect();
          const style = getComputedStyle(node);
          return {
            rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
            display: style.display,
            visibility: style.visibility,
            opacity: style.opacity,
            zIndex: style.zIndex,
            position: style.position,
          };
        };
        const ancestors = [];
        for (let node = document.getElementById("krypbot-container"); node && ancestors.length < 7; node = node.parentElement) {
          const details = describe(node);
          ancestors.push({
            tag: node.tagName,
            id: node.id,
            className: typeof node.className === "string" ? node.className : "",
            transform: getComputedStyle(node).transform,
            overflow: getComputedStyle(node).overflow,
            ...details,
          });
        }
        return ({
        readyState: document.readyState,
        menu: Boolean(document.getElementById("krypbot-container")),
        banner: Boolean(document.getElementById("thinker-chess-banner")),
        wrapper: Boolean(document.getElementById("oi-wrapper")),
        documentHeight: Math.max(document.body.scrollHeight, document.documentElement.scrollHeight),
        viewportHeight: window.innerHeight,
        menuDisplay: document.getElementById("krypbot-container")?.style.display || "",
        bannerDisplay: document.getElementById("thinker-chess-banner")?.style.display || "",
        menuLayout: describe(document.getElementById("krypbot-container")),
        bannerLayout: describe(document.getElementById("thinker-chess-banner")),
        ancestors,
        mountError: document.getElementById("kb-ghost-recovery")?.dataset.mountError || "",
        href: location.href,
      });
      })()`,
      returnByValue: true,
    });
    const state = result.result.value;

    assert(exceptions.length === 0, `Userscript exception: ${exceptions[0]?.text || "unknown"}`);
    assert(state.menu, "configuration menu was not mounted");
    assert(state.banner, "banner was not mounted");
    assert(state.wrapper, "scout panel wrapper was not mounted");
    assert(
      state.menuLayout.position !== "fixed" && state.menuLayout.position !== "absolute",
      `configuration menu escaped normal document flow: ${JSON.stringify(state.menuLayout)}`,
    );
    assert(
      state.menuLayout.rect.y >= state.viewportHeight,
      `configuration menu overlaps the initial viewport: ${JSON.stringify(state.menuLayout.rect)}`,
    );
    assert(
      state.documentHeight > state.viewportHeight,
      `page cannot scroll to the configuration menu: ${state.documentHeight}px document / ${state.viewportHeight}px viewport`,
    );
    assert(state.bannerLayout.display === "flex", "banner is still hidden on a desktop viewport");
    console.log(JSON.stringify({ state, consoleErrors }, null, 2));
    console.log(liveChess ? "Live Chess.com userscript bootstrap passed." : "Chrome userscript bootstrap passed.");
  } finally {
    client?.close();
    chrome.kill();
    server.close();
  }
})().catch((error) => {
  process.stderr.write(`${error.stack || error}\n`);
  process.exitCode = 1;
});
