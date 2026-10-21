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
  const liveChess = process.env.CHESS_LIVE === "1" || process.argv.includes("--live");

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
        sessionPanel: Boolean(document.getElementById("kb-session-panel")),
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

    const disclosureSmokeResult = await client.send("Runtime.evaluate", {
      expression: `(() => {
        const toggle = document.getElementById("kb-advanced-settings-toggle");
        const panel = document.getElementById("advanced-settings-panel");
        const duration = document.getElementById("kb-session-duration");
        const minimum = document.getElementById("kb-session-min-rate");
        const maximum = document.getElementById("kb-session-max-rate");
        const delayMinimum = document.getElementById("minDelayInput");
        const delayMaximum = document.getElementById("maxDelayInput");
        const delayMode = document.getElementById("dm-max");
        const sessionPanel = document.getElementById("kb-session-panel");
        if (!toggle || !panel || !duration || !minimum || !maximum || !delayMinimum || !delayMaximum || !delayMode || !sessionPanel) return { ok: false, reason: "advanced-disclosure-missing" };
        const phaseBefore = window.krypbotSessionControlBridge?.status?.().phase || null;
        const sequenceBefore = sessionPanel.getAttribute("data-session-ui-sequence");
        const initial = { expanded: toggle.getAttribute("aria-expanded"), hidden: panel.getAttribute("aria-hidden"), inert: panel.hasAttribute("inert"), open: panel.dataset.open };
        duration.focus();
        const collapsedFocusBlocked = document.activeElement !== duration;
        toggle.click();
        const opened = { expanded: toggle.getAttribute("aria-expanded"), hidden: panel.getAttribute("aria-hidden"), inert: panel.hasAttribute("inert"), open: panel.dataset.open };
        const sequenceAfterOpen = sessionPanel.getAttribute("data-session-ui-sequence");
        duration.focus();
        const expandedFocusAllowed = document.activeElement === duration;
        duration.value = "240";
        duration.dispatchEvent(new Event("input", { bubbles: true }));
        minimum.value = "74";
        minimum.dispatchEvent(new Event("input", { bubbles: true }));
        maximum.value = "83";
        maximum.dispatchEvent(new Event("input", { bubbles: true }));
        delayMinimum.value = "0.75";
        delayMaximum.value = "1.80";
        delayMode.checked = true;
        const sequenceAfterDraft = sessionPanel.getAttribute("data-session-ui-sequence");
        toggle.click();
        const closed = { expanded: toggle.getAttribute("aria-expanded"), hidden: panel.getAttribute("aria-hidden"), inert: panel.hasAttribute("inert"), open: panel.dataset.open };
        const sequenceAfterClose = sessionPanel.getAttribute("data-session-ui-sequence");
        toggle.click();
        const retained = { duration: duration.value, minimum: minimum.value, maximum: maximum.value, delayMinimum: delayMinimum.value, delayMaximum: delayMaximum.value, delayMode: delayMode.checked };
        toggle.click();
        const phaseAfter = window.krypbotSessionControlBridge?.status?.().phase || null;
        const sequenceAfter = sessionPanel.getAttribute("data-session-ui-sequence");
        const style = getComputedStyle(document.getElementById("krypbot-container"));
        const scout = document.getElementById("oi-zone2");
        const scoutStyle = scout ? getComputedStyle(scout) : null;
        return {
          ok: initial.expanded === "false" && initial.hidden === "true" && initial.inert && initial.open === "false"
            && opened.expanded === "true" && opened.hidden === "false" && !opened.inert && opened.open === "true"
            && closed.expanded === "false" && closed.hidden === "true" && closed.inert && closed.open === "false"
            && collapsedFocusBlocked && expandedFocusAllowed
            && retained.duration === "240" && retained.minimum === "74" && retained.maximum === "83"
            && retained.delayMinimum === "0.75" && retained.delayMaximum === "1.80" && retained.delayMode
            && phaseBefore === phaseAfter && sequenceBefore === sequenceAfterOpen && sequenceAfterDraft === sequenceAfterClose && sequenceAfterClose === sequenceAfter,
          initial, opened, closed, retained, collapsedFocusBlocked, expandedFocusAllowed, phaseBefore, phaseAfter, sequenceBefore, sequenceAfterOpen, sequenceAfterDraft, sequenceAfterClose, sequenceAfter,
          glass: { background: style.backgroundColor, radius: style.borderRadius, backdrop: style.backdropFilter || style.webkitBackdropFilter, font: style.fontFamily },
          scoutGlass: scoutStyle ? { background: scoutStyle.backgroundColor, radius: scoutStyle.borderRadius, backdrop: scoutStyle.backdropFilter || scoutStyle.webkitBackdropFilter, font: scoutStyle.fontFamily } : null,
        };
      })()`,
      returnByValue: true,
    });
    const disclosureSmoke = disclosureSmokeResult.result.value;

    assert(disclosureSmoke.ok, `Advanced settings disclosure smoke failed: ${JSON.stringify(disclosureSmoke)}`);
    assert(disclosureSmoke.glass.background === "rgba(20, 20, 25, 0.65)", `Session panel glass background regressed: ${JSON.stringify(disclosureSmoke.glass)}`);
    assert(disclosureSmoke.glass.radius === "20px" && disclosureSmoke.glass.backdrop.includes("16px"), `Session panel glass geometry regressed: ${JSON.stringify(disclosureSmoke.glass)}`);
    assert(disclosureSmoke.glass.font.includes("-apple-system") || disclosureSmoke.glass.font.includes("BlinkMacSystemFont") || disclosureSmoke.glass.font.includes("Segoe UI"), `Session panel system font regressed: ${JSON.stringify(disclosureSmoke.glass)}`);

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
        button.click();
        await new Promise((resolve) => setTimeout(resolve, 250));
        const disabledWarning = document.getElementById("kb-session-warning")?.textContent || "";
        const disabledToast = document.getElementById("kb-session-toast")?.textContent || "";
        const disabledPhase = window.krypbotSessionControlBridge.status().phase;
        ${liveChess ? "" : `
        window.krypbotSetMasterEnabled?.(true);
        await new Promise((resolve) => setTimeout(resolve, 50));
        button.click();
        await new Promise((resolve) => setTimeout(resolve, 250));
        `}
        const warning = document.getElementById("kb-session-warning")?.textContent || "";
        const toast = document.getElementById("kb-session-toast")?.textContent || "";
        const sessionStatus = window.krypbotSessionControlBridge.status();
        const bootstrapState = bootstrap.state();
        return {
          ok: !button.hasAttribute("disabled") && disabledWarning === "⚠️ Não foi possível atualizar a sessão" && disabledToast === "⚠️ Não foi possível atualizar a sessão" && disabledPhase === "IDLE"${liveChess ? "" : ` && Boolean(warning) && sessionStatus.phase === "QUEUEING" && sessionStatus.executionMode === "COMPATIBILITY" && sessionStatus.warningCode === "DDA_MAPPING_UNAVAILABLE" && warning === "⚠️ Verifique o Artefato" && toast === "Sessão iniciada" && document.getElementById("aq-on")?.checked && document.getElementById("aq-on")?.disabled && document.getElementById("aq-off")?.disabled && !document.getElementById("kb-auto-queue-session-note")?.hidden`},
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
        return { ok: commit.status === "committed" && restored.revision === 1 && duplicate.status === "duplicate" && a.status === "acquired" && b.status === "contended" && failClosedBeforeValidation && queueGate.allowed && legacySuspended && status.phase === "QUEUEING" && ui.phase === "Buscando..." && ui.advancedPresent === false && !diagnosticText.includes("chrome-smoke") && !diagnosticText.includes("runtimeGameToken") && !diagnosticText.includes("lastFen"), commit: commit.status, recoveryRevision: restored.revision, duplicate: duplicate.status, leases: [a.status, b.status], failClosedBeforeValidation, queueGate, legacySuspended, status, ui };
        } catch (error) {
          return { ok: false, name: error.name, code: error.code, message: error.message, causeName: error.cause?.name, causeMessage: error.cause?.message, stack: error.stack };
        }
      })()`,
      awaitPromise: true,
      returnByValue: true,
    });
    const module14 = module14Smoke.result.value;

    assert(exceptions.length === 0, `Userscript exception: ${exceptions[0]?.text || "unknown"}`);
    assert(disclosureSmoke.scoutGlass?.background === "rgba(20, 20, 25, 0.65)" && disclosureSmoke.scoutGlass.radius === "20px" && disclosureSmoke.scoutGlass.backdrop.includes("16px"), `Scout glass styling regressed: ${JSON.stringify(disclosureSmoke.scoutGlass)}`);
    assert(disclosureSmoke.scoutGlass.font.includes("-apple-system") || disclosureSmoke.scoutGlass.font.includes("BlinkMacSystemFont") || disclosureSmoke.scoutGlass.font.includes("Segoe UI"), `Scout system font regressed: ${JSON.stringify(disclosureSmoke.scoutGlass)}`);
    assert(productionStart.ok, `Production START wiring smoke failed: ${JSON.stringify(productionStart)}`);
    if (!liveChess) assert(productionStart.warning === "⚠️ Verifique o Artefato" && productionStart.rawWarningCode === "DDA_MAPPING_UNAVAILABLE", `Default compatibility START did not leave IDLE: ${JSON.stringify(productionStart)}`);
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
    assert(
      state.documentHeight > state.viewportHeight,
      `page cannot scroll to the configuration menu: ${state.documentHeight}px document / ${state.viewportHeight}px viewport`,
    );
    assert(state.bannerLayout.display === "flex", "banner is still hidden on a desktop viewport");
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
