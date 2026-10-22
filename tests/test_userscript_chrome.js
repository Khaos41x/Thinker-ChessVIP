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

const geometryExpression = `(() => {
  const selectors = {
    workspace:"#oi-wrapper", assistant:"#krypbot-container", core:".kb-core-module",
    visuals:".kb-visuals-module", engine:".kb-engine-module", autoPlay:".kb-auto-play-module",
    scout:"#oi-zone2", coreTitle:".kb-core-module .kb-console-caption",
    engineTitle:".kb-engine-module .kb-console-caption", scoutTitle:"#oi-zone2 .tc-scout-title",
    duration:"#kb-session-duration", minWins:"#kb-session-min-rate", maxWins:"#kb-session-max-rate",
    start:"#kb-session-start", finish:"#kb-session-stop", export:"#kb-session-export",
    status:".kb-session-status-item:nth-child(1)", stats:".kb-session-status-item:nth-child(3)", minDelay:"#minDelayInput",
    maxDelay:"#maxDelayInput", strength:"#kb-elo-slider", theme:"#kb-color-picker"
  };
  const values = {};
  for (const [name, selector] of Object.entries(selectors)) {
    const node = document.querySelector(selector);
    if (!node) { values[name] = null; continue; }
    const rect = node.getBoundingClientRect();
    values[name] = { x:Math.round(rect.x * 100) / 100, y:Math.round(rect.y * 100) / 100, width:Math.round(rect.width * 100) / 100, height:Math.round(rect.height * 100) / 100, right:Math.round(rect.right * 100) / 100, bottom:Math.round(rect.bottom * 100) / 100 };
  }
  const wrapper = document.getElementById("oi-wrapper");
  values.viewport = { width:innerWidth, height:innerHeight, scrollWidth:document.documentElement.scrollWidth, injectionWidth:wrapper?.getBoundingClientRect().width || 0, layoutMode:wrapper?.dataset.layoutMode || "" };
  return values;
})()`;

const layoutAuditExpression = `(() => {
  const q = (selector) => document.querySelector(selector);
  const rect = (selector) => q(selector)?.getBoundingClientRect() || null;
  const integerRect = (value) => value && [value.x,value.y,value.width,value.height,value.right,value.bottom].every(Number.isInteger);
  const wrapper = rect("#oi-wrapper");
  const core = rect(".kb-core-module");
  const visuals = rect(".kb-visuals-module");
  const engine = rect(".kb-engine-module");
  const autoPlay = rect(".kb-auto-play-module");
  const scout = rect("#oi-zone2");
  const layoutMode = q("#oi-wrapper")?.dataset.layoutMode || "";
  const desktop = (wrapper?.width || 0) >= 1034;
  const titleSelectors = [".kb-core-module .kb-console-caption", ".kb-visuals-module .kb-console-caption", ".kb-engine-module .kb-console-caption", ".kb-auto-play-module .kb-console-caption", "#oi-zone2 .tc-scout-title"];
  const titles = titleSelectors.map((selector) => {
    const node = q(selector); const box = node?.getBoundingClientRect(); const style = node ? getComputedStyle(node) : null;
    return node ? { y:box.y, height:box.height, fontSize:style.fontSize, lineHeight:style.lineHeight, fontWeight:style.fontWeight, color:style.color, letterSpacing:style.letterSpacing } : null;
  });
  const contentRight = (panel) => panel.right - 13;
  const visibleRows = Array.from(document.querySelectorAll(".kb-console-module .kb-section")).filter((node) => getComputedStyle(node).display !== "none" && node.getClientRects().length > 0).map((node) => node.getBoundingClientRect().height);
  const aligned = (values, target) => values.every((value) => Math.abs(value - target) < .01);
  const rightEdges = {
    core:Array.from(document.querySelectorAll(".kb-core-module .kb-radio-group")).map((node) => node.getBoundingClientRect().right),
    visuals:[rect(".kb-visuals-module .kb-radio-group")?.right,rect("#kb-color-picker")?.right].filter(Number.isFinite),
    engine:[rect(".kb-delay-input:last-of-type")?.right,rect("#kb-elo-slider")?.right,rect(".kb-engine-module .kb-radio-group:not(:has(input[name='delayMode']))")?.right].filter(Number.isFinite),
    autoPlay:[rect("#kb-session-max-rate")?.right,rect("#kb-session-export")?.right,rect(".kb-session-status")?.right].filter(Number.isFinite),
  };
  const waiting = q("#oi-zone2[data-state='waiting'] .tc-scout-status");
  const waitingInteractive = Boolean(waiting?.closest("button,a,[role='button']") || waiting?.onclick || waiting?.hasAttribute("tabindex"));
  const hint = q("#kb-run-delay-hint");
  const hintStyle = hint ? getComputedStyle(hint) : null;
  const rgb = (text) => (text.match(/[\\d.]+/g) || []).slice(0,3).map(Number);
  const luminance = (values) => { const channels=values.map((v) => { const s=v/255; return s <= .03928 ? s/12.92 : Math.pow((s+.055)/1.055,2.4); }); return .2126*channels[0]+.7152*channels[1]+.0722*channels[2]; };
  const contrast = hintStyle ? (() => { const a=luminance(rgb(hintStyle.color)); const b=luminance(rgb(hintStyle.backgroundColor === "rgba(0, 0, 0, 0)" ? getComputedStyle(hint.parentElement).backgroundColor : hintStyle.backgroundColor)); return (Math.max(a,b)+.05)/(Math.min(a,b)+.05); })() : 0;
  const layoutRects = [wrapper,core,visuals,engine,autoPlay,scout,rect("#kb-session-duration"),rect("#kb-session-min-rate"),rect("#kb-session-max-rate"),rect("#kb-session-start"),rect("#kb-session-stop"),rect("#kb-session-export"),rect("#minDelayInput"),rect("#maxDelayInput"),rect("#kb-elo-slider"),rect("#kb-color-picker")];
  const result = {
    viewport:innerWidth, injectionWidth:wrapper?.width || 0, layoutMode, desktop,
    margins:{ left:wrapper?.left || 0, right:innerWidth-(wrapper?.right || 0), topInset:(core?.top || 0)-(wrapper?.top || 0) },
    bottoms:{ visualsEngine:(visuals?.bottom || 0)-(engine?.bottom || 0), scoutAutoPlay:(scout?.bottom || 0)-(autoPlay?.bottom || 0) },
    gaps:desktop ? { horizontal:(engine?.left || 0)-(core?.right || 0), vertical:(autoPlay?.top || 0)-(engine?.bottom || 0), scout:(scout?.left || 0)-(engine?.right || 0) } : null,
    titles, rows:visibleRows, rightEdges, waitingInteractive,
    hint:{ fontSize:hintStyle?.fontSize || "", contrast },
    integerRects:layoutRects.every(integerRect), horizontalOverflow:q("#oi-wrapper").scrollWidth > q("#oi-wrapper").clientWidth,
  };
  result.ok = Math.abs(result.margins.left-result.margins.right) < .01 && result.margins.topInset === 12
    && layoutMode === (desktop ? "desktop" : "stacked") && !result.horizontalOverflow && result.integerRects
    && titles.every(Boolean) && titles.every((title) => title.height === titles[0].height && title.fontSize === titles[0].fontSize && title.lineHeight === titles[0].lineHeight && title.fontWeight === titles[0].fontWeight && title.color === titles[0].color)
    && visibleRows.every((height) => height === 36) && !waitingInteractive
    && Number.parseFloat(result.hint.fontSize) >= 11 && result.hint.contrast >= 4.5
    && aligned(rightEdges.core,contentRight(core)) && aligned(rightEdges.visuals,contentRight(visuals)) && aligned(rightEdges.engine,contentRight(engine)) && aligned(rightEdges.autoPlay,contentRight(autoPlay))
    && (!desktop || (result.bottoms.visualsEngine === 0 && result.bottoms.scoutAutoPlay === 0 && Object.values(result.gaps).every((gap) => gap === 12)));
  return result;
})()`;

const printGeometryTable = (label, geometry) => {
  console.log(`\n${label}`);
  console.table(Object.entries(geometry).filter(([name]) => name !== "viewport").map(([element, rect]) => ({ element, ...(rect || {}) })));
  console.log(`viewport: ${JSON.stringify(geometry.viewport)}`);
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
  const liveChess = process.env.CHESS_LIVE === "1" || process.argv.includes("--live");
  const captureVisual = process.argv.includes("--screenshot");
  const captureBaseline = process.argv.includes("--baseline-screenshot");
  const userscriptRef = process.env.THINKER_USERSCRIPT_REF || "";

  const server = http.createServer((request, response) => {
    const pathname = decodeURIComponent(new URL(request.url, "http://127.0.0.1").pathname);
    if (pathname === "/script.js" && userscriptRef) {
      const source = childProcess.execFileSync("git", ["show", `${userscriptRef}:script.js`], { cwd: root, encoding: "utf8" });
      response.writeHead(200, { "Content-Type": "text/javascript; charset=utf-8" }).end(source);
      return;
    }
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
        const board = document.querySelector("wc-chess-board, chess-board, #board-single, .board, .chess-board, [class*='board-component']");
        const sidebar = document.querySelector(".play-controller-component:not(.stale-controller)");
        const gameplayBottom = Math.max(board?.getBoundingClientRect().bottom || 0, sidebar?.getBoundingClientRect().bottom || 0) + scrollY;
        const wrapperTop = (document.getElementById("oi-wrapper")?.getBoundingClientRect().top || 0) + scrollY;
        return ({
        readyState: document.readyState,
        menu: Boolean(document.getElementById("krypbot-container")),
        sessionPanel: Boolean(document.getElementById("kb-session-panel")),
        banner: Boolean(document.getElementById("thinker-chess-banner")),
        wrapper: Boolean(document.getElementById("oi-wrapper")),
        documentHeight: Math.max(document.body.scrollHeight, document.documentElement.scrollHeight),
        viewportHeight: window.innerHeight,
        menuDisplay: document.getElementById("krypbot-container")?.style.display || "",
        bannerDisplay: document.getElementById("thinker-chess-banner")?.style.display || "",
        menuLayout: describe(document.getElementById("krypbot-container")),
        menuChildren: Array.from(document.getElementById("krypbot-container")?.children || []).map((node) => ({ id: node.id, className: node.className, height: node.getBoundingClientRect().height, display: getComputedStyle(node).display })),
        bannerLayout: describe(document.getElementById("thinker-chess-banner")),
        ancestors,
        mountError: document.getElementById("kb-ghost-recovery")?.dataset.mountError || "",
        workspaceGap: wrapperTop - gameplayBottom,
        href: location.href,
      });
      })()`,
      returnByValue: true,
    });
    const state = result.result.value;

    if (captureBaseline) {
      await client.send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 778, deviceScaleFactor: 1, mobile: false });
      await client.send("Runtime.evaluate", { expression: "scrollTo(0, Math.max(0, document.getElementById('oi-wrapper').offsetTop - 40))" });
      await sleep(150);
      const geometry = await client.send("Runtime.evaluate", { expression: geometryExpression, returnByValue: true });
      printGeometryTable("ANTES", geometry.result.value);
      fs.writeFileSync(path.join(root, "tests", "artifacts", "thinker-console-geometry-before.json"), JSON.stringify(geometry.result.value, null, 2));
      const screenshot = await client.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
      const artifactPath = path.join(root, "tests", "artifacts", "thinker-console-reference-before.png");
      fs.writeFileSync(artifactPath, Buffer.from(screenshot.data, "base64"));
      console.log(`Baseline visual evidence: ${artifactPath}`);
      return;
    }

    if (captureVisual) {
      const layoutAudits = {};
      await client.send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 778, deviceScaleFactor: 1, mobile: false });
      await client.send("Runtime.evaluate", { expression: "scrollTo(0, Math.max(0, document.getElementById('oi-wrapper').offsetTop - 40))" });
      await sleep(150);
      const geometry = await client.send("Runtime.evaluate", { expression: geometryExpression, returnByValue: true });
      printGeometryTable("DEPOIS", geometry.result.value);
      fs.writeFileSync(path.join(root, "tests", "artifacts", "thinker-console-geometry-after.json"), JSON.stringify(geometry.result.value, null, 2));
      const screenshot = await client.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
      const artifactPath = path.join(root, "tests", "artifacts", "thinker-console-reference-after.png");
      fs.writeFileSync(artifactPath, Buffer.from(screenshot.data, "base64"));
      console.log(`Default console evidence: ${artifactPath}`);
      for (const width of [1086, 1280, 1440, 1920]) {
        await client.send("Emulation.setDeviceMetricsOverride", { width, height: 900, deviceScaleFactor: 1, mobile: false });
        await client.send("Runtime.evaluate", { expression: "scrollTo(0, Math.max(0, document.getElementById('oi-wrapper').offsetTop - 40))" });
        await sleep(150);
        const auditResult = await client.send("Runtime.evaluate", { expression: layoutAuditExpression, returnByValue: true });
        const audit = auditResult.result.value;
        layoutAudits[String(width)] = audit;
        console.log(`Layout audit ${width}px: ${JSON.stringify(audit)}`);
        assert(audit.ok, `Layout invariant failed at ${width}px: ${JSON.stringify(audit)}`);
        const viewportShot = await client.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
        fs.writeFileSync(path.join(root, "tests", "artifacts", `thinker-console-${width}-after.png`), Buffer.from(viewportShot.data, "base64"));
      }
      for (const width of [1033, 1034]) {
        await client.send("Emulation.setDeviceMetricsOverride", { width, height: 900, deviceScaleFactor: 1, mobile: false });
        await sleep(150);
        const auditResult = await client.send("Runtime.evaluate", { expression: layoutAuditExpression, returnByValue: true });
        const audit = auditResult.result.value;
        layoutAudits[String(width)] = audit;
        assert(audit.injectionWidth === width, `Injection width mismatch at ${width}px: ${JSON.stringify(audit)}`);
        assert(audit.layoutMode === (audit.injectionWidth >= 1034 ? "desktop" : "stacked"), `Container breakpoint failed at ${width}px: ${JSON.stringify(audit)}`);
      }
      fs.writeFileSync(path.join(root, "tests", "artifacts", "thinker-console-layout-audits-after.json"), JSON.stringify(layoutAudits, null, 2));
      await client.send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
      await sleep(150);
    }

    const disclosureSmokeResult = await client.send("Runtime.evaluate", {
      expression: `(() => {
        const state = (toggle, panel) => ({ expanded:toggle.getAttribute("aria-expanded"), hidden:panel.getAttribute("aria-hidden"), inert:panel.hasAttribute("inert"), open:panel.dataset.open });
        const menu = document.getElementById("krypbot-container");
        const sessionPanel = document.getElementById("kb-session-panel");
        const advancedToggle = document.getElementById("kb-advanced-settings-toggle");
        const advancedPanel = document.getElementById("advanced-settings-panel");
        const timingToggle = document.getElementById("kb-move-timing-toggle");
        const timingPanel = document.getElementById("kb-move-timing-panel");
        const timingCard = document.getElementById("auto-delay-section");
        const moreToggle = document.getElementById("kb-more-settings-toggle");
        const morePanel = document.getElementById("kb-more-settings-panel");
        const duration = document.getElementById("kb-session-duration");
        const minimum = document.getElementById("kb-session-min-rate");
        const maximum = document.getElementById("kb-session-max-rate");
        const delayMinimum = document.getElementById("minDelayInput");
        const delayMaximum = document.getElementById("maxDelayInput");
        const strength = document.getElementById("kb-elo-slider");
        const scout = document.getElementById("oi-zone2");
        if (![menu, sessionPanel, advancedToggle, advancedPanel, timingToggle, timingPanel, timingCard, moreToggle, morePanel, duration, minimum, maximum, delayMinimum, delayMaximum, strength, scout].every(Boolean)) return { ok:false, reason:"disclosure-missing" };
        const phaseBefore = window.krypbotSessionControlBridge?.status?.().phase || null;
        const sequenceBefore = sessionPanel.getAttribute("data-session-ui-sequence");
        const initial = { advanced:state(advancedToggle, advancedPanel), timing:state(timingToggle, timingPanel), more:state(moreToggle, morePanel) };
        delayMinimum.focus();
        const timingFocusAllowed = document.activeElement === delayMinimum;
        const selectedModeStyle = getComputedStyle(timingCard.querySelector('input[name="delayMode"]:checked + label'));
        delayMaximum.focus();
        delayMinimum.value = "0,25";
        delayMaximum.value = "0.500";
        delayMaximum.dispatchEvent(new KeyboardEvent("keydown", { key:"Enter", bubbles:true, cancelable:true }));
        const enterCommitted = delayMinimum.value === "0.25" && delayMaximum.value === "0.50";
        delayMinimum.value = "1,80";
        delayMaximum.value = "0.75";
        delayMaximum.dispatchEvent(new FocusEvent("blur", { bubbles:true }));
        const delayPersisted = localStorage.getItem("autoMinDelay") === "0.75" && localStorage.getItem("autoMaxDelay") === "1.8";
        delayMinimum.value = "1.2abc";
        delayMinimum.dispatchEvent(new FocusEvent("blur", { bubbles:true }));
        const invalidDelayRejected = delayMinimum.value === "0.75" && delayMaximum.value === "1.80"
          && localStorage.getItem("autoMinDelay") === "0.75" && localStorage.getItem("autoMaxDelay") === "1.8";
        duration.focus();
        const advancedFocusAllowed = document.activeElement === duration;
        duration.value = "240"; duration.dispatchEvent(new Event("input", { bubbles:true }));
        minimum.value = "74"; minimum.dispatchEvent(new Event("input", { bubbles:true }));
        maximum.value = "83"; maximum.dispatchEvent(new Event("input", { bubbles:true }));
        const secondarySwitch = document.getElementById("aq-off")?.closest("[role=switch]");
        secondarySwitch?.focus();
        const moreFocusAllowed = document.activeElement === secondarySwitch;
        const sequenceAfter = sessionPanel.getAttribute("data-session-ui-sequence");
        const style = getComputedStyle(menu);
        const scoutStyle = getComputedStyle(scout);
        const scoutEmpty = scout.querySelector(".tc-scout-empty");
        const visibleCopy = (menu.innerText + " " + scout.innerText).replace(/\\s+/g, " ").trim();
        const forbidden = ["Assistente", "Jogadas automáticas", "Ritmo de jogada", "Nível de força", "Mais ajustes", "Aguardando", "Concluído", "Iniciar", "Finalizar", "Configurar", "Taxa de vitória", "Tema", "Oponente"].filter((word) => visibleCopy.includes(word));
        const timingInputs = Array.from(timingPanel.querySelectorAll(".kb-num-input"));
        const timingShells = Array.from(timingPanel.querySelectorAll(".kb-delay-input"));
        const strengthRatio = (Number(strength.value) - Number(strength.min)) / (Number(strength.max) - Number(strength.min));
        return {
          ok: Object.values(initial).every((item) => item.expanded === "true" && item.hidden === "false" && !item.inert && item.open === "true")
            && timingFocusAllowed && advancedFocusAllowed && moreFocusAllowed && enterCommitted
            && duration.value === "240" && minimum.value === "74" && maximum.value === "83" && delayMinimum.value === "0.75" && delayMaximum.value === "1.80" && delayPersisted && invalidDelayRejected
            && !sessionPanel.contains(timingCard) && document.querySelector(".kb-engine-module")?.contains(timingCard) && document.querySelector(".kb-core-module")?.contains(document.getElementById("aq-on"))
            && timingInputs.every((node) => ["none", "textfield"].includes(getComputedStyle(node).appearance)) && timingShells.every((node) => getComputedStyle(node).borderRadius === "5px")
            && selectedModeStyle.backgroundColor !== "rgb(34, 197, 94)" && strength.min === "800" && strength.max === "3200" && strengthRatio >= 0 && strengthRatio <= 1
            && forbidden.length === 0 && phaseBefore === (window.krypbotSessionControlBridge?.status?.().phase || null),
          initial,
          focus:{ timingFocusAllowed, advancedFocusAllowed, moreFocusAllowed },
          retained:{ duration:duration.value, minimum:minimum.value, maximum:maximum.value, delayMinimum:delayMinimum.value, delayMaximum:delayMaximum.value, delayPersisted, enterCommitted, invalidDelayRejected },
          forbidden, visibleCopy,
          panel:{ background:style.backgroundColor, backgroundImage:style.backgroundImage, radius:style.borderRadius, font:style.fontFamily, width:style.width, height:menu.getBoundingClientRect().height, padding:style.padding },
          scout:{ background:scoutStyle.backgroundColor, backgroundImage:scoutStyle.backgroundImage, radius:scoutStyle.borderRadius, font:scoutStyle.fontFamily, width:scoutStyle.width, height:scout.getBoundingClientRect().height, menuHeight:menu.getBoundingClientRect().height, hasRadar:Boolean(scout.querySelector(".tc-scout-radar")), emptyDetail:Boolean(scout.querySelector(".tc-scout-empty-detail")) && getComputedStyle(scout.querySelector(".tc-scout-empty-detail")).display !== "none", emptyAlign:scoutEmpty ? getComputedStyle(scoutEmpty).alignItems : null, rawRate:menu.querySelector("#kb-session-raw")?.textContent || null, sessionState:sessionPanel.dataset.sessionState || null },
        };
      })()`,
      returnByValue: true,
    });
    const disclosureSmoke = disclosureSmokeResult.result.value;

    assert(disclosureSmoke.ok, `Advanced settings disclosure smoke failed: ${JSON.stringify(disclosureSmoke)}`);
    assert(disclosureSmoke.panel.background === "rgba(0, 0, 0, 0)" && disclosureSmoke.panel.backgroundImage === "none", `Session panel embedded surface regressed: ${JSON.stringify(disclosureSmoke.panel)}`);
    assert(disclosureSmoke.panel.radius === "0px" && disclosureSmoke.panel.width === "1010px", `Session panel geometry regressed: ${JSON.stringify(disclosureSmoke.panel)}`);
    assert(disclosureSmoke.panel.font.includes("Segoe UI") || disclosureSmoke.panel.font.includes("Arial"), `Session panel system font regressed: ${JSON.stringify(disclosureSmoke.panel)}`);
    assert(disclosureSmoke.panel.height >= 560 && disclosureSmoke.panel.height <= 620, `Idle workspace height is outside the 560–620px target: ${JSON.stringify(disclosureSmoke.panel)}`);

    const workspaceSmokeResult = await client.send("Runtime.evaluate", {
      expression: `(() => {
        const menu = document.getElementById("krypbot-container");
        const scout = document.getElementById("oi-zone2");
        const launcher = document.getElementById("kb-workspace-launcher");
        if (!menu || !scout || !launcher) return { ok:false, reason:"workspace-missing" };
        const assistantClose = document.getElementById("kb-minimize-toggle");
        const scoutClose = scout.querySelector(".tc-scout-close");
        return { ok:!assistantClose && !scoutClose && !menu.classList.contains("minimized") && getComputedStyle(scout).display === "flex", assistantClose:Boolean(assistantClose), scoutClose:Boolean(scoutClose), launcherText:launcher.textContent.trim() };
      })()`,
      returnByValue: true,
    });
    const workspaceSmoke = workspaceSmokeResult.result.value;
    assert(workspaceSmoke.ok, `Workspace dismiss-control smoke failed: ${JSON.stringify(workspaceSmoke)}`);
    assert(workspaceSmoke.launcherText.includes("Thinker Chess"), `Workspace launcher lost product identity: ${JSON.stringify(workspaceSmoke)}`);
    await sleep(300);

    if (liveChess) {
      console.log(JSON.stringify({ state, consoleErrors }, null, 2));
      assert(exceptions.length === 0, `Userscript exception: ${exceptions[0]?.text || "unknown"}`);
      assert(state.menu, "configuration menu was not mounted");
      assert(state.banner, "banner was not mounted");
      assert(state.wrapper, "scout panel wrapper was not mounted");
      assert(state.documentHeight > state.viewportHeight, "page cannot scroll to the configuration menu");
      assert(state.bannerLayout.display === "flex", "banner is still hidden on a desktop viewport");
      console.log("Live Chess.com userscript shell passed.");
      return;
    }

    const productionStartSmokeResult = await client.send("Runtime.evaluate", {
      expression: `(async () => {
        const bootstrap = window.krypbotSessionControlBootstrap;
        const button = document.getElementById("kb-session-start");
        if (!bootstrap || !button) return { ok: false, reason: "production-wiring-missing" };
        ${liveChess ? "" : `
        const api = window.ThinkerSessionControl;
        const repository = new api.IndexedDbRepository({ indexedDB: window.indexedDB, crypto: window.crypto });
        const clock = { now: () => Date.now() };
        const leader = new api.LeaderCoordinator({ repository, locks: navigator.locks, clock });
        const controller = new api.SessionControlController({ repository, leader, clock, ownerTabId: "dddddddddddddddddddddddddddddddd", idFactory: (() => { let value = 100; return () => (value++).toString(16).padStart(32, "0"); })(), rolloutStage: "ACTIVE_DDA" });
        const values = new Map();
        const storagePort = new api.GmStoragePort((key, fallback) => values.has(key) ? values.get(key) : fallback, (key, value) => values.set(key, value));
        const runtime = api.createSessionControlRuntime({ controller, repository, leader, storagePort, clock, rollout: { schemaVersion: 1, stage: "ACTIVE_DDA" }, observeStartContext: async () => ({ accountKey: "fixture-account", context: "chesscom-queue-sidebar-start-game-v1", pool: "chesscom-live-rapid-v1", intendedQueueScaleId: "chesscom-live-rapid-v1", calibrationReadiness: { schemaVersion: 1, active: false, executionMode: "compatibility", reasonCode: "DDA_MAPPING_UNAVAILABLE", opponentRatingScaleId: "chesscom-live-rapid-v1", targetScaleId: "unavailable-calibration-scale-v1", generatedAtEpochMs: Date.now(), expiresAtEpochMs: Date.now() + 60000 } }), setInterval: () => 1, clearInterval() {} });
        window.krypbotSessionControlBridge.install(controller, () => ({}), { rollout: runtime.rollout, start: runtime.start });
        window.krypbotSessionControlUI.update();
        `}
        const initiallyDisabled = button.hasAttribute("disabled");
        const disabledTitle = button.getAttribute("title");
        button.click();
        await new Promise((resolve) => setTimeout(resolve, 250));
        const disabledWarning = document.getElementById("kb-session-warning")?.textContent || "";
        const disabledToast = document.getElementById("kb-session-toast")?.textContent || "";
        const disabledPhase = window.krypbotSessionControlBridge.status().phase;
        ${liveChess ? "" : `
        for (let attempt = 0; attempt < 10 && button.hasAttribute("disabled"); attempt += 1) {
          window.krypbotSetMasterEnabled?.(true);
          window.krypbotSessionControlUI.update();
          await new Promise((resolve) => setTimeout(resolve, 25));
        }
        const enabledAfterMaster = !button.hasAttribute("disabled");
        button.click();
        await new Promise((resolve) => setTimeout(resolve, 250));
        `}
        const warning = document.getElementById("kb-session-warning")?.textContent || "";
        const toast = document.getElementById("kb-session-toast")?.textContent || "";
        const sessionStatus = window.krypbotSessionControlBridge.status();
        const bootstrapState = bootstrap.state();
        return {
          ok: initiallyDisabled && disabledTitle === null && disabledWarning === "" && disabledToast === "" && disabledPhase === "IDLE"${liveChess ? "" : ` && enabledAfterMaster && button.hasAttribute("disabled") && warning === "" && sessionStatus.phase === "QUEUEING" && sessionStatus.executionMode === "COMPATIBILITY" && sessionStatus.warningCode === "DDA_MAPPING_UNAVAILABLE" && toast === "Session started" && document.getElementById("aq-on")?.checked && document.getElementById("aq-on")?.disabled && document.getElementById("aq-off")?.disabled && !document.getElementById("kb-auto-queue-session-note")?.hidden`},
          initiallyDisabled,
          disabledTitle,
          disabledWarning,
          disabledToast,
          disabledPhase,
          warning,
          toast,
          rawWarningCode: sessionStatus.warningCode,
          queueOnChecked: document.getElementById("aq-on")?.checked,
          queueControlsDisabled: document.getElementById("aq-on")?.disabled && document.getElementById("aq-off")?.disabled,
          queueSessionNoteVisible: !document.getElementById("kb-auto-queue-session-note")?.hidden,
          ariaDisabled: button.getAttribute("aria-disabled"),
          bootstrapPhase: bootstrapState.phase,
          bootstrapReason: bootstrapState.reasonCode,
        };
      })()`,
      awaitPromise: true,
      returnByValue: true,
    });
    const productionStart = productionStartSmokeResult.result.value;

    const module14Smoke = await client.send("Runtime.evaluate", {
      expression: `(async () => { try {
        const api = globalThis.ThinkerSessionControl;
        if (!api) return { ok: false, reason: "namespace-missing" };
        const repository = new api.IndexedDbRepository({ indexedDB: globalThis.indexedDB, crypto: globalThis.crypto });
        const event = {
          schemaVersion: 1,
          eventId: "session:start",
          sessionId: "11111111111111111111111111111111",
          authorityEpoch: 1,
          expectedRevision: 0,
          sequence: 1,
          occurredAtEpochMs: Date.now(),
          type: "SESSION_STARTED",
          payload: { accountKey: "chrome-smoke", authorizationDecision: { schemaVersion: 1, allowed: true, reason: "OPAQUE_POLICY_MATCH" }, config: {
            schemaVersion: 1, durationMs: 60000, minWinRate: 0.25, maxWinRate: 0.75,
            boostOffsetElo: 200, correctionOffsetElo: -200, minCompletedGames: 2,
            perceptionElo: 1700, scaleId: "opaque-scale-v1",
            estimatorVersion: api.ESTIMATOR_VERSION, controllerVersion: api.CONTROLLER_VERSION,
            minimumAdmissionHeadroomMs: 5000, queueObservationTimeoutMs: 10000,
            maximumDrainMs: 60000, maximumConsecutiveSaturatedGames: 2,
          } },
          reducerVersion: api.REDUCER_VERSION,
        };
        const snapshot = api.reduce(null, event).nextState;
        const commit = await repository.commit(event, snapshot);
        const restored = await repository.loadSession(snapshot.sessionId);
        const duplicate = await repository.commit(event, snapshot);
        const locks = navigator.locks;
        const clock = { now: () => Date.now() };
        const smokeLeaseName = "thinker-session-control-smoke-" + Date.now();
        const first = new api.LeaderCoordinator({ repository, locks, clock, leaseName: smokeLeaseName });
        const second = new api.LeaderCoordinator({ repository, locks, clock, leaseName: smokeLeaseName });
        const [a, b] = await Promise.all([
          first.acquire({ authorityEpoch: 1, sessionId: snapshot.sessionId, ownerTabId: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" }),
          second.acquire({ authorityEpoch: 1, sessionId: snapshot.sessionId, ownerTabId: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb" }),
        ]);
        const winner = a.status === "acquired"
          ? { leader: first, ownerTabId: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", lease: a.lease }
          : { leader: second, ownerTabId: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb", lease: b.lease };
        const controller = new api.SessionControlController({ repository, leader: winner.leader, clock, ownerTabId: winner.ownerTabId, idFactory: () => "cccccccccccccccccccccccccccccccc" });
        controller.setSnapshot(restored);
        controller.setLease(winner.lease);
        const bridge = window.krypbotSessionControlBridge;
        bridge.install(controller, () => ({ queue: {
          calibrationReadiness: { active: true, opponentRatingScaleId: "opaque-scale-v1", expiresAtEpochMs: Date.now() + 30000 },
          intendedQueueScaleId: "opaque-scale-v1",
        } }));
        const failClosedBeforeValidation = !bridge.effectiveAutoQueue(true) && !bridge.effectiveAutoMove(true) && !bridge.isActive();
        bridge.setCalibrationValidated(true);
        const queueGate = bridge.queueGate(true);
        const legacySuspended = bridge.suspendsLegacyAutoAdjust();
        window.krypbotSessionControlUI.update();
        const status = bridge.status();
        const diagnosticText = JSON.stringify(bridge.exportDiagnostic());
        const ui = {
          phase: document.getElementById("kb-session-phase")?.textContent,
          observed: document.getElementById("kb-session-observed")?.textContent,
          advancedPresent: ["kb-session-rollout", "kb-session-role", "kb-session-drain", "kb-session-control", "kb-session-posterior", "kb-session-band", "kb-session-dda", "kb-session-target"].some((id) => document.getElementById(id)),
        };
        bridge.clear();
        repository.close();
        return { ok: commit.status === "committed" && restored.revision === 1 && duplicate.status === "duplicate" && a.status === "acquired" && b.status === "contended" && failClosedBeforeValidation && queueGate.allowed && legacySuspended && status.phase === "QUEUEING" && ui.phase === "Searching..." && ui.advancedPresent === false && !diagnosticText.includes("chrome-smoke") && !diagnosticText.includes("runtimeGameToken") && !diagnosticText.includes("lastFen"), commit: commit.status, recoveryRevision: restored.revision, duplicate: duplicate.status, leases: [a.status, b.status], failClosedBeforeValidation, queueGate, legacySuspended, status, ui };
        } catch (error) {
          return { ok: false, name: error.name, code: error.code, message: error.message, causeName: error.cause?.name, causeMessage: error.cause?.message, stack: error.stack };
        }
      })()`,
      awaitPromise: true,
      returnByValue: true,
    });
    const module14 = module14Smoke.result.value;

    assert(exceptions.length === 0, `Userscript exception: ${exceptions[0]?.text || "unknown"}`);
    assert(disclosureSmoke.scout?.background === "rgb(37, 37, 35)" && disclosureSmoke.scout.backgroundImage === "none" && disclosureSmoke.scout.radius === "8px", `Scout neutral styling regressed: ${JSON.stringify(disclosureSmoke.scout)}`);
    assert(disclosureSmoke.scout.font.includes("Segoe UI") || disclosureSmoke.scout.font.includes("Arial"), `Scout system font regressed: ${JSON.stringify(disclosureSmoke.scout)}`);
    assert(disclosureSmoke.scout.width === "296px" && disclosureSmoke.scout.height === disclosureSmoke.scout.menuHeight && !disclosureSmoke.scout.hasRadar && disclosureSmoke.scout.emptyDetail, `Scout waiting state did not fill the named grid: ${JSON.stringify(disclosureSmoke.scout)}`);
    assert(disclosureSmoke.scout.rawRate === "—" && disclosureSmoke.scout.sessionState === "never-started", `Idle presentation state regressed: ${JSON.stringify(disclosureSmoke.scout)}`);
    assert(productionStart.ok, `Production START wiring smoke failed: ${JSON.stringify(productionStart)}`);
    if (!liveChess) assert(productionStart.warning === "" && productionStart.rawWarningCode === "DDA_MAPPING_UNAVAILABLE", `Default compatibility START did not leave IDLE: ${JSON.stringify(productionStart)}`);
    assert(module14.ok, `Module 14 browser smoke failed: ${JSON.stringify(module14)}`);
    assert(state.menu, "configuration menu was not mounted");
    assert(state.sessionPanel, "session control panel was not mounted");
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
    assert(state.workspaceGap >= 112, `Workspace gap is below 112px: ${state.workspaceGap}`);
    assert(
      state.documentHeight > state.viewportHeight,
      `page cannot scroll to the configuration menu: ${state.documentHeight}px document / ${state.viewportHeight}px viewport`,
    );
    assert(state.bannerLayout.display === "flex", "banner is still hidden on a desktop viewport");
    await client.send("Emulation.setDeviceMetricsOverride", { width: 1033, height: 900, deviceScaleFactor: 1, mobile: false });
    await sleep(100);
    const responsiveResult = await client.send("Runtime.evaluate", {
      expression: `(() => {
        const wrapper = document.getElementById("oi-wrapper");
        const menu = document.getElementById("krypbot-container");
        const scout = document.getElementById("oi-zone2");
        const style = getComputedStyle(wrapper);
        return {
          mode: wrapper.dataset.layoutMode,
          wrapperWidth: wrapper.getBoundingClientRect().width,
          menuWidth: menu.getBoundingClientRect().width,
          scoutWidth: scout?.getBoundingClientRect().width || 0,
          viewportWidth: innerWidth,
        };
      })()`,
      returnByValue: true,
    });
    const responsive = responsiveResult.result.value;
    assert(responsive.mode === "stacked", `Workspace did not stack below the injection-container breakpoint: ${JSON.stringify(responsive)}`);
    assert(responsive.wrapperWidth <= responsive.viewportWidth && responsive.menuWidth <= responsive.wrapperWidth && responsive.scoutWidth <= responsive.wrapperWidth, `Workspace overflowed the narrow viewport: ${JSON.stringify(responsive)}`);
    await client.send("Emulation.setDeviceMetricsOverride", { width: 1034, height: 900, deviceScaleFactor: 1, mobile: false });
    await sleep(100);
    const wideBoundaryResult = await client.send("Runtime.evaluate", {
      expression: `(() => {
        const wrapper = document.getElementById("oi-wrapper");
        return { mode:wrapper.dataset.layoutMode, width:wrapper.getBoundingClientRect().width, viewportWidth:innerWidth };
      })()`,
      returnByValue: true,
    });
    const wideBoundary = wideBoundaryResult.result.value;
    assert(wideBoundary.mode === "desktop" && wideBoundary.width === 1034, `Workspace breakpoint regressed at 1034px: ${JSON.stringify(wideBoundary)}`);
    for (const [width, height, scale] of [[320, 900, 1], [375, 900, 1], [640, 900, 1], [768, 900, 1], [820, 900, 1], [900, 900, 1], [1024, 900, 1], [1033, 900, 1], [1034, 900, 1], [1086, 900, 1], [1280, 720, 1], [1440, 778, 1], [1440, 900, 1], [1440, 900, 1.25], [1920, 1080, 1.5]]) {
      const cssWidth = Math.round(width / scale);
      const cssHeight = Math.round(height / scale);
      await client.send("Emulation.setDeviceMetricsOverride", { width: cssWidth, height: cssHeight, deviceScaleFactor: scale, mobile: false });
      await sleep(80);
      const viewportResult = await client.send("Runtime.evaluate", {
        expression: `(() => {
          const wrapper = document.getElementById("oi-wrapper");
          const menu = document.getElementById("krypbot-container");
          const scout = document.getElementById("oi-zone2");
          const controls = Array.from(menu.querySelectorAll("button, input:not([type=radio]), [role=switch]")).filter((node) => !node.hidden && !node.closest("[inert]") && getComputedStyle(node).display !== "none" && node.getClientRects().length > 0);
          const hiddenControls = controls.filter((node) => { const rect = node.getBoundingClientRect(); return rect.width <= 0 || rect.height <= 0 || rect.left < 0 || rect.right > innerWidth; }).map((node) => node.id || node.type);
          const wrapperRect = wrapper.getBoundingClientRect();
          return {
            width: innerWidth,
            wrapper: wrapperRect.width,
            wrapperLeft: wrapperRect.left,
            wrapperRight: wrapperRect.right,
            wrapperBottom: wrapperRect.bottom + scrollY,
            documentHeight: document.documentElement.scrollHeight,
            menu: menu.getBoundingClientRect().width,
            scout: scout.getBoundingClientRect().width,
            switchCount: controls.filter((node) => node.getAttribute("role") === "switch").length,
            allReachable: hiddenControls.length === 0,
            hiddenControls,
          };
        })()`,
        returnByValue: true,
      });
      const viewport = viewportResult.result.value;
      assert(viewport.wrapper <= viewport.width && viewport.wrapperLeft >= 0 && viewport.wrapperRight <= viewport.width && viewport.wrapperBottom <= viewport.documentHeight + 1 && viewport.menu <= viewport.width && viewport.scout <= viewport.width && viewport.switchCount > 0 && viewport.allReachable, `Workspace failed responsive ${width}×${height} @ ${Math.round(scale * 100)}%: ${JSON.stringify(viewport)}`);
    }
    await client.send("Emulation.clearDeviceMetricsOverride");
    await sleep(100);
    const switchKeyboardResult = await client.send("Runtime.evaluate", {
      expression: `(() => {
        const group = document.getElementById("am-on")?.closest("[role=switch]");
        if (!group) return { ok:false };
        const before = group.getAttribute("aria-checked");
        group.focus();
        group.dispatchEvent(new KeyboardEvent("keydown", { key:"Enter", bubbles:true }));
        const after = group.getAttribute("aria-checked");
        group.dispatchEvent(new KeyboardEvent("keydown", { key:"Enter", bubbles:true }));
        return { ok:document.activeElement === group && before !== after && group.getAttribute("aria-checked") === before, before, after };
      })()`,
      returnByValue: true,
    });
    assert(switchKeyboardResult.result.value.ok, `Switch keyboard interaction regressed: ${JSON.stringify(switchKeyboardResult.result.value)}`);
    const timingKeyboardResult = await client.send("Runtime.evaluate", {
      expression: `(() => {
        const random = document.getElementById("dm-rand");
        const immediate = document.getElementById("dm-max");
        if (!random || !immediate) return { ok:false, reason:"timing-radios-missing" };
        random.focus();
        const randomReachable = document.activeElement === random && getComputedStyle(random).display !== "none";
        immediate.focus();
        return { ok:randomReachable && document.activeElement === immediate && getComputedStyle(immediate).display !== "none" };
      })()`,
      returnByValue: true,
    });
    assert(timingKeyboardResult.result.value.ok, `Move Timing radios are not keyboard reachable: ${JSON.stringify(timingKeyboardResult.result.value)}`);
    if (captureVisual) {
      await client.send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 778, deviceScaleFactor: 1, mobile: false });
      await client.send("Runtime.evaluate", { expression: `(() => { const toast = document.getElementById("kb-session-toast"); if (toast) { toast.dataset.visible = "false"; toast.textContent = ""; } window.krypbotSessionControlUI?.update?.(); })()` });
      await client.send("Runtime.evaluate", { expression: "scrollTo(0, Math.max(0, document.getElementById('oi-wrapper').offsetTop - 40))" });
      await sleep(150);
      const screenshot = await client.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
      const artifactPath = path.join(root, "tests", "artifacts", "thinker-panels-phase-08-1-after.png");
      fs.writeFileSync(artifactPath, Buffer.from(screenshot.data, "base64"));
      console.log(`Visual evidence: ${artifactPath}`);
    }
    console.log(JSON.stringify({ state, productionStart, module14, consoleErrors }, null, 2));
    console.log(liveChess ? "Live Chess.com userscript bootstrap passed." : "Chrome userscript bootstrap passed.");
  } finally {
    client?.close();
    chrome.kill();
    server.closeAllConnections?.();
    server.close();
  }
})().catch((error) => {
  process.stderr.write(`${error.stack || error}\n`);
  process.exitCode = 1;
});
