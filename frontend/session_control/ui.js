"use strict";

const FIELD_IDS = Object.freeze({
  durationMinutes: "kb-session-duration",
  minimumPercent: "kb-session-min-rate",
  maximumPercent: "kb-session-max-rate",
});

const TERMINAL_PHASES = Object.freeze(["IDLE", "COMPLETED", "ABORTED"]);

const PHASE_LABELS = Object.freeze({
  IDLE: "Aguardando",
  QUEUEING: "Buscando...",
  IN_GAME: "Jogando...",
  DRAINING: "Finalizando sessão...",
  PAUSED_QUEUEING: "Sessão pausada",
  PAUSED_ACTIVE: "Sessão pausada",
  COMPLETED: "Concluído",
  ABORTED: "Interrompido",
});

const SUCCESS_LABELS = Object.freeze({
  SESSION_STARTED: "Sessão iniciada",
  DRAINING: "Finalizando sessão...",
  SESSION_STOPPED: "Sessão finalizada",
  COMPLETED: "Concluído",
});

function phaseLabel(phase) {
  return Object.prototype.hasOwnProperty.call(PHASE_LABELS, phase) ? PHASE_LABELS[phase] : "Atualizando...";
}

function warningLabel(code) {
  if (!code) return "";
  if (code === "DDA_MAPPING_UNAVAILABLE" || code.includes("ARTIFACT")) return "⚠️ Verifique o Artefato";
  if (code.startsWith("CALIBRATION_")) return "⚠️ Calibração não encontrada";
  return "⚠️ Não foi possível atualizar a sessão";
}

function successLabel(code) {
  return SUCCESS_LABELS[code] || "Operação concluída";
}

function reasonCode(error, fallback) {
  if (error && typeof error.code === "string" && error.code) return error.code;
  if (error && typeof error.reason === "string" && error.reason) return error.reason;
  if (error && typeof error.message === "string" && /^[A-Z][A-Z0-9_]+$/.test(error.message)) return error.message;
  return fallback;
}

function findById(panel, id) {
  return panel && typeof panel.querySelector === "function" ? panel.querySelector(`#${id}`) : null;
}

function setText(panel, id, value) {
  const node = findById(panel, id);
  if (node) node.textContent = value;
}

function actionNode(panel, target) {
  let node = target;
  while (node && node !== panel) {
    if (typeof node.getAttribute === "function" && node.getAttribute("data-action")) return node;
    node = node.parentNode;
  }
  return null;
}

function availability(status, startBlocker) {
  const terminal = TERMINAL_PHASES.includes(status.phase);
  return Object.freeze({
    start: startBlocker || (status.rolloutStage === "DISABLED"
      ? "ROLLOUT_DISABLED"
      : terminal ? null : "ACTIVE_SESSION_EXISTS"),
    stop: terminal ? "SESSION_NOT_ACTIVE" : null,
  });
}

function presentAvailability(panel, action, reason) {
  const button = panel.querySelector(`[data-action="${action}"]`);
  if (!button) return;
  button.removeAttribute("disabled");
  button.setAttribute("aria-disabled", reason ? "true" : "false");
  if (reason) {
    button.setAttribute("data-disabled-reason", reason);
    button.setAttribute("title", warningLabel(reason));
  } else {
    button.removeAttribute("data-disabled-reason");
    button.removeAttribute("title");
  }
}

function presentStatus(panel, status, formatDuration, startBlocker) {
  const counts = status.observedCounts;
  setText(panel, "kb-session-phase", phaseLabel(status.phase));
  setText(panel, "kb-session-ttl", formatDuration(status.remainingTtlMs));
  setText(panel, "kb-session-observed", `${counts.wins} V | ${counts.draws} E | ${counts.losses} D`);
  setText(panel, "kb-session-raw", `${status.rawWinRate.toFixed(0)}%`);
  setText(panel, "kb-session-warning", warningLabel(status.warningCode));
  const state = availability(status, startBlocker);
  presentAvailability(panel, "start", state.start);
  presentAvailability(panel, "stop", state.stop);
  return state;
}

function createSessionControlPresenter(options) {
  if (!options || typeof options.getPanel !== "function") throw new TypeError("getPanel is required");
  const AbortControllerType = options.AbortController || globalThis.AbortController;
  if (typeof AbortControllerType !== "function") throw new TypeError("AbortController is required");
  let panel = null;
  let abortController = null;
  let currentAvailability = Object.freeze({ start: "STATUS_UNAVAILABLE", stop: "STATUS_UNAVAILABLE" });
  let sequence = 0;
  const draft = Object.create(null);
  const inFlight = new Set();

  function emit(type, detail) {
    sequence += 1;
    if (panel) {
      panel.setAttribute("data-session-ui-event", type);
      panel.setAttribute("data-session-ui-sequence", String(sequence));
    }
    if (typeof options.onTelemetry === "function") options.onTelemetry(Object.freeze({ type, sequence, ...(detail || {}) }));
  }

  function warning(code) {
    const value = code || "STATUS_UNAVAILABLE";
    if (typeof options.setWarning === "function") options.setWarning(value);
    const label = warningLabel(value);
    if (panel) setText(panel, "kb-session-warning", label);
    if (typeof options.notify === "function") options.notify(label, { transient: true });
    emit("warning", { code: value });
  }

  function success(code) {
    if (typeof options.setWarning === "function") options.setWarning(null);
    if (panel) setText(panel, "kb-session-warning", "");
    if (typeof options.notify === "function") options.notify(successLabel(code), { transient: true, success: true });
    emit("success", { code });
  }

  function captureDraft(nextPanel) {
    for (const [field, id] of Object.entries(FIELD_IDS)) {
      const input = findById(nextPanel, id);
      if (!input) continue;
      if (Object.prototype.hasOwnProperty.call(draft, field)) input.value = draft[field];
      else draft[field] = String(input.value);
    }
  }

  function readDraft() {
    return Object.freeze({
      durationMinutes: draft.durationMinutes,
      minimumPercent: draft.minimumPercent,
      maximumPercent: draft.maximumPercent,
    });
  }

  function readConfig() {
    if (typeof options.createConfig !== "function") throw new TypeError("createConfig is required");
    return options.createConfig(readDraft());
  }

  async function run(action) {
    if (inFlight.has(action)) return;
    const blocked = currentAvailability[action];
    if (blocked) {
      warning(blocked);
      return;
    }
    inFlight.add(action);
    emit("dispatch", { action });
    try {
      if (action === "start") {
        let config;
        try {
          config = readConfig();
        } catch (error) {
          warning(reasonCode(error, "SESSION_CONFIG_INVALID"));
          return;
        }
        await options.start(config);
        success("SESSION_STARTED");
      } else if (action === "stop") {
        const result = await options.stop();
        if (!result || result.allowed !== true) {
          warning(reasonCode(result, "GRACEFUL_STOP_FAILED"));
          return;
        }
        success(reasonCode(result, "SESSION_STOPPED"));
      }
    } catch (error) {
      warning(reasonCode(error, action === "start" ? "SESSION_START_FAILED" : "GRACEFUL_STOP_FAILED"));
    } finally {
      inFlight.delete(action);
      update();
    }
  }

  function runExport() {
    emit("dispatch", { action: "export" });
    try {
      const diagnostic = options.exportDiagnostic();
      options.downloadDiagnostic(diagnostic);
    } catch (error) {
      warning(reasonCode(error, "DIAGNOSTIC_EXPORT_FAILED"));
    }
    update();
  }

  function bind(nextPanel) {
    if (nextPanel === panel && abortController) return false;
    if (abortController) abortController.abort();
    panel = nextPanel || null;
    abortController = null;
    if (!panel) return false;
    captureDraft(panel);
    abortController = new AbortControllerType();
    const signal = abortController.signal;
    panel.addEventListener("input", (event) => {
      for (const [field, id] of Object.entries(FIELD_IDS)) {
        if (event.target && event.target.id === id) {
          draft[field] = String(event.target.value);
          emit("draft", { field });
          return;
        }
      }
    }, { signal });
    panel.addEventListener("click", (event) => {
      const button = actionNode(panel, event.target);
      if (!button) return;
      event.preventDefault();
      event.stopPropagation();
      const action = button.getAttribute("data-action");
      if (action === "export") runExport();
      else if (action === "start" || action === "stop") void run(action);
    }, { signal });
    emit("bound");
    return true;
  }

  function update() {
    const nextPanel = options.getPanel();
    if (nextPanel !== panel) bind(nextPanel);
    if (!panel) return null;
    try {
      const status = options.readStatus();
      const startBlocker = typeof options.readStartBlocker === "function" ? options.readStartBlocker() : null;
      currentAvailability = presentStatus(panel, status, options.formatDuration, startBlocker);
      return status;
    } catch (error) {
      warning(reasonCode(error, "STATUS_UNAVAILABLE"));
      return null;
    }
  }

  function dispose() {
    if (abortController) abortController.abort();
    abortController = null;
    panel = null;
  }

  return Object.freeze({ bind, dispose, readConfig, readDraft, update });
}

module.exports = { FIELD_IDS, createSessionControlPresenter, phaseLabel, presentStatus, reasonCode, successLabel, warningLabel };
