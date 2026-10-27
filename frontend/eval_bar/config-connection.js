  let _lastExternalConfig = null;
  let _ghostModeActive = false;
  let _menuReady = false;
  let _localConfigRevision = 0;
  let _localConfigPending = false;
  let _configSaveInFlight = false;
  let _queuedConfigSnapshot = null;
  let _configRetryTimer = null;
  let _configPollId = 0;
  let _externalAppliedRevision = -1;
  let _externalServerId = "";
  let _externalPollPending = false;
  let _externalConfigError = null;
  let _externalServerOffline = false;

  const externalConnection = globalThis.ThinkerStatus.health();
  let externalReconnectTimer = null;
  function markServerUnavailable() {
    if (externalConnection.failure()) _externalServerOffline = true;
    clearTimeout(externalReconnectTimer);
    if (!document.hidden) externalReconnectTimer = setTimeout(pollExternalConfig, externalConnection.delay());
  }
  document.addEventListener('visibilitychange', () => {
    clearTimeout(externalReconnectTimer);
    if (!document.hidden) { externalConnection.reset(); pollExternalConfig(); }
  });

  function pollExternalConfig() {
    if (!document.hidden) analysisEngineSelection.refresh();
    if (!externalConnection.due()) return;
    if (!_menuReady || _localConfigPending && !_externalServerOffline || _externalPollPending) return;
    const requestRevision = _localConfigRevision;
    const pollId = ++_configPollId;
    let bannerState = "unknown";
    try { bannerState = getThinkerRuntimeDiagnostics().banner.reason; } catch (_) {}
    _externalPollPending = true;
    GM_xmlhttpRequest({
      method: "GET",
      url: SERVER_URL + "/config/load",
      headers: { "X-Thinker-Channel":"workspace-sync", "X-Thinker-Version": globalThis.ThinkerClientVersion || "", "X-Thinker-Client": "userscript", "X-Thinker-Applied-Revision": String(_externalAppliedRevision), "X-Thinker-Server": _externalServerId, "X-Thinker-Banner-State": bannerState },
      timeout: 5000,
      onerror() { markServerUnavailable(); _externalPollPending = false; _externalConfigError = "network"; },
      ontimeout() { markServerUnavailable(); _externalPollPending = false; _externalConfigError = "timeout"; },
      onabort() { _externalPollPending = false; },
      onload(resp) {
        _externalPollPending = false;
        if (resp.status === 200) {
          const recovering = _externalServerOffline;
          externalConnection.success(); _externalServerOffline = false;
          clearTimeout(externalReconnectTimer);
          if (recovering) resumeExternalSessionConnection();
        } else { markServerUnavailable(); }
        try {
          if (!_menuReady || _localConfigPending || requestRevision !== _localConfigRevision || pollId !== _configPollId) return;
          if (resp.status !== 200) { _externalConfigError = "http-" + resp.status; return; }
          const s = JSON.parse(resp.responseText);
          if (s._hasSavedPreferences === false && s._revision === 0 && !s._persistenceError && window.krypbotRestoreSavedPreferences?.(s)) return;
          const key = JSON.stringify(s);
          _externalConfigError = null;
          if (key === _lastExternalConfig) return;
          if (typeof s.banner === "boolean" && thinkerBannerEnabled !== s.banner) setThinkerBannerEnabled(s.banner);
          if (typeof s.recentForm === "boolean" && recentFormEnabled !== s.recentForm) {
            recentFormEnabled = s.recentForm;
            localStorage.setItem("recentForm", String(recentFormEnabled));
            if (OpponentIntel.currentEntry) OpponentIntel.renderHUD(OpponentIntel.currentEntry.hudStats);
            else document.querySelectorAll(".tc-hud-stats").forEach(node => node.remove());
          }

          // Ghost Mode — apply immediately, hide EVERYTHING
          if (typeof s.ghostMode === "boolean") {
            applyGhostModeVisibility(s.ghostMode);
          }

          // Bot Status
          if (typeof s.hint === "boolean" && (!masterStatusKnown || hint !== s.hint)) {
            setMasterEnabled(s.hint, false);
            $('input[name="kb-bot-status"][value="' + (hint ? "1" : "0") + '"]').prop("checked", true);
          }

          // Only apply UI-bound values if menu exists (createMenu already ran)
          if (!$("#krypbot-container").length) return;
          // Auto Moves
          if (typeof s.autoMove === "boolean" && auto_move !== s.autoMove) {
            auto_move = s.autoMove;
            checkfen = "";
            $('input[name="kb-auto-move"][value="' + (auto_move ? "1" : "0") + '"]').prop("checked", true);
            if (!auto_move) {
              smartPacer.cancel();
              sessionControlBridge.autoMoveChanged(false).catch((error) => debug("error", "[Session Control] Auto Move pause failed", error));
            }
          }
          // Auto Queue
          if (typeof s.autoQueue === "boolean" && auto_queue !== s.autoQueue) {
            auto_queue = s.autoQueue;
            localStorage.setItem("kb-auto-queue", auto_queue ? "true" : "false");
            if (!sessionControlBridge.isRunning()) $('input[name="kb-auto-queue"][value="' + (auto_queue ? "1" : "0") + '"]').prop("checked", true);
            handleAutoQueue();
            if (typeof window.krypbotUpdateUI === "function") window.krypbotUpdateUI();
          }
          // Auto Adjust
          if (typeof s.autoAdjust === "boolean") {
            const isAdj = typeof autoAdjust !== "undefined" && autoAdjust.isEnabled();
            if (isAdj !== s.autoAdjust) {
              if (s.autoAdjust) { autoAdjust.updateBaseElo(chessBot.elo); autoAdjust.enable(); }
              else { autoAdjust.disable(); }
              $('input[name="kb-auto-adjust"][value="' + (s.autoAdjust ? "1" : "0") + '"]').prop("checked", true);
            }
          }
          // Eval Bar
          if (typeof s.evalBar === "boolean" && evalBarEnabled !== s.evalBar) {
            evalBarEnabled = s.evalBar;
            localStorage.setItem("evalBar", evalBarEnabled);
            $('input[name="kb-eval-bar"][value="' + (evalBarEnabled ? "1" : "0") + '"]').prop("checked", true);
            lastEvalFen = "";
            syncEvalBarRenderer();
          }
          // Smart Pacing
          if (typeof s.smartPacing === "boolean" && smartPacingEnabled !== s.smartPacing) {
            smartPacingEnabled = s.smartPacing;
            localStorage.setItem("smartPacing", smartPacingEnabled);
            $('input[name="kb-smart-pacing"][value="' + (smartPacingEnabled ? "1" : "0") + '"]').prop("checked", true);
            if (smartPacingEnabled) { $("#auto-delay-section").slideUp(200); } else { $("#auto-delay-section").slideDown(200); }
          }
          // Elo
          if (typeof s.elo === "number" && chessBot.elo !== s.elo) {
            chessBot.elo = s.elo;
            $("#kb-elo-slider").val(s.elo);
            autoAdjust.updateBaseElo(s.elo);
          }
          // Delay Mode
          if (s.delayMode && autoDelayMode !== s.delayMode) {
            autoDelayMode = s.delayMode;
            localStorage.setItem("autoDelayMode", autoDelayMode);
            $('input[name="delayMode"][value="' + autoDelayMode + '"]').prop("checked", true);
          }
          const normalizeDelay = (value, fallback) => typeof value === "number" && Number.isFinite(value) ? Math.min(10, Math.max(0.01, value)) : fallback;
          const nextDelayMin = normalizeDelay(s.minDelay, autoDelayMin || DEFAULT_MIN_DELAY);
          const nextDelayMax = normalizeDelay(s.maxDelay, autoDelayMax || DEFAULT_MAX_DELAY);
          let normalizedDelayMin = nextDelayMin;
          let normalizedDelayMax = nextDelayMax;
          if (autoDelayMode !== "max" && normalizedDelayMin > normalizedDelayMax) {
            [normalizedDelayMin, normalizedDelayMax] = [normalizedDelayMax, normalizedDelayMin];
          }
          if (autoDelayMin !== normalizedDelayMin || autoDelayMax !== normalizedDelayMax) {
            autoDelayMin = normalizedDelayMin;
            autoDelayMax = normalizedDelayMax;
            localStorage.setItem("autoMinDelay", String(autoDelayMin));
            localStorage.setItem("autoMaxDelay", String(autoDelayMax));
          }
          // Color
          if (s.color && current_color !== s.color) {
            current_color = normalizeArrowColor(s.color);
            localStorage.setItem("kb_color", current_color);
            if (typeof GM_setValue !== "undefined") GM_setValue("kb_color", current_color);
            $("#kb-color-picker").val(current_color);
            $(".myarrow path").attr("fill", normalizeArrowColor(current_color));

          }
          if (typeof window.krypbotUpdateUI === "function") window.krypbotUpdateUI();
          if (typeof window.krypbotConfigApplied === "function") window.krypbotConfigApplied();
          _lastExternalConfig = key;
          if (Number.isInteger(s._revision)) _externalAppliedRevision = s._revision;
          if (typeof s._serverId === "string") _externalServerId = s._serverId;
          _externalConfigError = null;
        } catch(e) { _externalConfigError = "apply-failed"; }
      }
    });
  }
