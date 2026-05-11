// ==UserScript==
// @name         TC102
// @namespace    http://tampermonkey.net/
// @version      2026-04-26
// @description  Chess Bot com Servidor Local
// @author       You
// @match        https://www.chess.com/play/computer*
// @match        https://www.chess.com/play/*
// @match        https://www.chess.com/game/*
// @match        https://www.chess.com/puzzles/*
// @match        https://www.chess.com/puzzle/*
// @match        https://www.chess.com/puzzles/rated*
// @match        https://www.chess.com/puzzles/rush*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @require      https://code.jquery.com/jquery-3.7.1.min.js
// @grant        GM_xmlhttpRequest
// @connect      localhost
// @connect      127.0.0.1
// @connect      api.chess.com
// ==/UserScript==

(function () {
  "use strict";

  const SERVER_URL = "http://127.0.0.1:5050";

  // --- CONFIGURAÃ‡Ã•ES PADRÃƒO (AUTO RUN DELAY) ---
  const DEFAULT_MIN_DELAY = 0.5,
    DEFAULT_MAX_DELAY = 2.0,
    DEFAULT_DELAY_MODE = "random";

  // --- CONFIGURAÃ‡Ã•ES DO AUTO ADJUST RATING ---
  const AUTO_ADJUST_N = 5,
    AUTO_ADJUST_MIN_ELO = 800,
    AUTO_ADJUST_MAX_ELO = 3200,
    AUTO_ADJUST_STEP = 100;

  class AutoAdjustRating {
    constructor(baseElo, storage = localStorage) {
      this._storage = storage;
      this._enabled = false;
      this._baseElo = baseElo;
      this._currentDifficulty = baseElo;
      this._history = [];
    }

    _loadHistory() {
      try {
        const data = JSON.parse(
          this._storage.getItem("kb-auto-adjust-history"),
        );
        return Array.isArray(data) ? data : [];
      } catch {
        return [];
      }
    }

    _saveHistory() {
      this._storage.setItem(
        "kb-auto-adjust-history",
        JSON.stringify(this._history),
      );
    }

    _loadDifficulty() {
      const val = parseInt(this._storage.getItem("kb-auto-adjust-elo"), 10);
      return !isNaN(val) &&
        val >= AUTO_ADJUST_MIN_ELO &&
        val <= AUTO_ADJUST_MAX_ELO
        ? val
        : this._baseElo;
    }

    _saveDifficulty() {
      this._storage.setItem(
        "kb-auto-adjust-elo",
        this._currentDifficulty.toString(),
      );
    }

    enable() {
      this._enabled = true;
      this._currentDifficulty = this._baseElo;
      this._history = [];
      this._saveHistory();
      this._saveDifficulty();
      this._storage.setItem("kb-auto-adjust", "true");
    }

    disable() {
      this._enabled = false;
      this._storage.setItem("kb-auto-adjust", "false");
    }

    isEnabled() {
      return this._enabled;
    }

    recordResult(result) {
      if (!this._enabled) return;
      if (result !== "W" && result !== "L") return;
      this._history.push(result);
      if (this._history.length > AUTO_ADJUST_N) {
        this._history.shift();
      }
      this._saveHistory();
      this._adjustDifficulty();
    }

    _adjustDifficulty() {
      if (this._history.length < AUTO_ADJUST_N) return;
      const wins = this._history.filter((r) => r === "W").length;
      if (wins > AUTO_ADJUST_N / 2) {
        this._currentDifficulty = Math.min(
          this._currentDifficulty + AUTO_ADJUST_STEP,
          AUTO_ADJUST_MAX_ELO,
        );
      } else if (AUTO_ADJUST_N - wins > AUTO_ADJUST_N / 2) {
        this._currentDifficulty = Math.max(
          this._currentDifficulty - AUTO_ADJUST_STEP,
          AUTO_ADJUST_MIN_ELO,
        );
      }
      this._saveDifficulty();
    }

    getCurrentDifficulty() {
      return this._currentDifficulty;
    }

    updateBaseElo(newBase) {
      this._baseElo = newBase;
    }

    setOpponentRating(opponentRating) {
      if (!this._enabled) return;
      this._currentDifficulty = Math.min(
        opponentRating + 200,
        AUTO_ADJUST_MAX_ELO,
      );
      this._saveDifficulty();
    }

    resetToBase() {
      this._currentDifficulty = this._baseElo;
      this._saveDifficulty();
    }
  }

  function getOpponentRating() {
    const screenMiddle = window.innerHeight / 2;

    const players = document.querySelectorAll(
      ".player-component, .board-layout-player, .user-tagline-component, .user-tagline, [class*='player']",
    );

    let opponentEl = null;
    let minTop = Infinity;

    players.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.top > screenMiddle) return;
      if (rect.top >= 0 && rect.top < minTop && rect.bottom > 0) {
        minTop = rect.top;
        opponentEl = el;
      }
    });

    if (!opponentEl) {
      const allLinks = document.querySelectorAll("a[href*='/member/']");
      for (const link of allLinks) {
        const rect = link.getBoundingClientRect();
        if (rect.top > screenMiddle || rect.top < 0) continue;
        const text = link.innerText;
        const match = text.match(/\((\d{3,4})\)/);
        if (match) {
          return parseInt(match[1], 10);
        }
      }
      return null;
    }

    const rawText = opponentEl.innerText || "";
    const regex = /(?<!\w)\(?(\d{3,4})\)?(?!:)/g;
    const matches = [...rawText.matchAll(regex)];

    let foundElo = null;
    for (const m of matches) {
      if (m[0].includes("(")) {
        foundElo = parseInt(m[1]);
        break;
      }
    }

    if (!foundElo && matches.length > 0) {
      const candidates = matches
        .map((m) => parseInt(m[1]))
        .filter((n) => n >= 400 && n < 3200);
      if (candidates.length > 0) foundElo = candidates[0];
    }

    return foundElo;
  }

  let can_interval = true,
    auto_move = false,
    auto_queue = false,
    current_color = "#000000",
    fen,
    checkfen,
    hint = false,
    moveCache = new Map(),
    auto_queue_observer = null,
    auto_queue_clicking = false,
    gameMode = "play",
    puzzleHint = false,
    puzzleAutoMove = false,
    puzzleFenCache = "",
    puzzleMoveCache = new Map();

  let mySession = { wins: 0, losses: 0, draws: 0, streak: 0, streakType: null };

  const OpponentIntel = {
    lastOpponent: null,
    processGames(games, username, timeControl) {
      try {
        const filtered = games.filter((g) => g.time_class === timeControl);
        if (filtered.length === 0) return null;

        const last20 = filtered.slice(-20);
        const last10 = filtered.slice(-10);

        const processed = last20.map((game) => {
          const isWhite =
            game.white.username.toLowerCase() === username.toLowerCase();
          const playerData = isWhite ? game.white : game.black;
          const drawResults = [
            "agreed",
            "repetition",
            "stalemate",
            "insufficient",
            "50move",
            "timevsinsufficient",
          ];
          const result =
            playerData.result === "win"
              ? "W"
              : drawResults.includes(playerData.result)
                ? "D"
                : "L";
          const openingMatch = game.pgn
            ? game.pgn.match(/\[Opening "(.+?)"\]/) ||
              game.pgn.match(
                /\[ECOUrl "https?:\/\/www\.chess\.com\/openings\/([^"]+)"\]/,
              )
            : null;
          const opening = openingMatch
            ? openingMatch[1].replace(/-/g, " ")
            : null;
          return {
            result,
            color: isWhite ? "white" : "black",
            accuracy:
              typeof playerData.accuracy === "number"
                ? playerData.accuracy
                : null,
            opening,
            timestamp: game.end_time,
          };
        });

        const last10p = processed.slice(-10);

        // W/L/D
        const wld = {
          w: last10p.filter((g) => g.result === "W").length,
          d: last10p.filter((g) => g.result === "D").length,
          l: last10p.filter((g) => g.result === "L").length,
        };

        // Streak
        let streakCount = 0;
        const streakType = processed[processed.length - 1].result;
        for (let i = processed.length - 1; i >= 0; i--) {
          if (processed[i].result === streakType) streakCount++;
          else break;
        }

        // Win rate por cor
        const asWhite = processed.filter((g) => g.color === "white");
        const asBlack = processed.filter((g) => g.color === "black");
        const winRateByColor = {
          white: asWhite.length
            ? Math.round(
                (asWhite.filter((g) => g.result === "W").length /
                  asWhite.length) *
                  100,
              )
            : null,
          black: asBlack.length
            ? Math.round(
                (asBlack.filter((g) => g.result === "W").length /
                  asBlack.length) *
                  100,
              )
            : null,
        };

        // PrecisÃ£o mÃ©dia
        const withAcc = last10p.filter((g) => g.accuracy !== null);
        const avgAccuracy = withAcc.length
          ? parseFloat(
              (
                withAcc.reduce((s, g) => s + g.accuracy, 0) / withAcc.length
              ).toFixed(1),
            )
          : null;

        // Opening mais jogada por cor
        const topOpening = (color) => {
          const map = {};
          processed
            .filter((g) => g.color === color && g.opening)
            .forEach((g) => {
              map[g.opening] = (map[g.opening] || 0) + 1;
            });
          return Object.keys(map).sort((a, b) => map[b] - map[a])[0] || null;
        };

        // Ãšltimas 5
        const last5 = processed
          .slice(-5)
          .reverse()
          .map((g) => ({
            result: g.result,
            opening: g.opening,
            accuracy: g.accuracy,
          }));

        // Por horÃ¡rio
        const byHour = (start, end) => {
          const range = processed.filter((g) => {
            const h = new Date(g.timestamp * 1000).getHours();
            return h >= start && h < end;
          });
          return {
            total: range.length,
            wr: range.length
              ? Math.round(
                  (range.filter((g) => g.result === "W").length /
                    range.length) *
                    100,
                )
              : null,
          };
        };

        return {
          wld,
          streak: { type: streakType, count: streakCount },
          winRateByColor,
          avgAccuracy,
          topOpeningWhite: topOpening("white"),
          topOpeningBlack: topOpening("black"),
          last5,
          byHour: {
            morning: byHour(6, 12),
            afternoon: byHour(12, 18),
            night: byHour(18, 24),
          },
        };
      } catch (e) {
        log("OpponentIntel.processGames erro: " + e);
        return null;
      }
    },
    fetchData(username, timeControl) {
      try {
        const cacheKey = username + "_" + timeControl;
        const cached = OpponentIntel._cache && OpponentIntel._cache[cacheKey];
        if (cached && Date.now() - cached.ts < 300000) {
          log("OpponentIntel: usando cache para " + username);
          OpponentIntel.renderZone1(cached.data);
          OpponentIntel.renderZone2(cached.data);
          return;
        }
        if (!OpponentIntel._cache) OpponentIntel._cache = {};

        log("fetchData: chamado para " + username + " tc:" + timeControl);
        log(
          "OpponentIntel: fetchData iniciado para " +
            username +
            " | timeControl: " +
            timeControl,
        );
        const baseUrl = `https://api.chess.com/pub/player/${username}`;

        // Chamada de archives
        GM_xmlhttpRequest({
          method: "GET",
          url: `${baseUrl}/games/archives`,
          timeout: 12000,
          onload: (resp) => {
            try {
              const data = JSON.parse(resp.responseText);
              log(
                "fetchData: archives recebidos, total meses: " +
                  (data.archives ? data.archives.length : 0),
              );
              log(
                "OpponentIntel: archives recebidos â†’ " +
                  JSON.stringify(
                    data.archives ? data.archives.length + " meses" : "vazio",
                  ),
              );
              const archives = data.archives || [];
              if (archives.length === 0) return;

              // Busca mÃªs atual primeiro, depois decide se precisa do anterior
              GM_xmlhttpRequest({
                method: "GET",
                url: archives[archives.length - 1],
                timeout: 12000,
                onload: (r) => {
                  try {
                    const d = JSON.parse(r.responseText);
                    const currentGames = d.games || [];
                    const filteredCurrent = currentGames.filter(
                      (g) => g.time_class === timeControl,
                    );

                    if (filteredCurrent.length >= 15 || archives.length < 2) {
                      // Suficiente, processa sÃ³ o mÃªs atual
                      const processed = OpponentIntel.processGames(
                        currentGames,
                        username,
                        timeControl,
                      );
                      if (processed) {
                        OpponentIntel._cache[cacheKey] = {
                          data: processed,
                          ts: Date.now(),
                        };
                        OpponentIntel.renderZone1(processed);
                        OpponentIntel.renderZone2(processed);
                      } else {
                        $("#oi-zone2").html(
                          '<div style="padding:16px; color:#666; font-size:12px;">Sem dados suficientes para este oponente neste time control.</div>',
                        );
                        $("#oi-zone1").html(
                          '<span style="color:#666; font-size:11px; margin-left:8px;">sem dados</span>',
                        );
                      }
                    } else {
                      // Busca mÃªs anterior tambÃ©m
                      GM_xmlhttpRequest({
                        method: "GET",
                        url: archives[archives.length - 2],
                        timeout: 12000,
                        onload: (r2) => {
                          try {
                            const d2 = JSON.parse(r2.responseText);
                            const allGames = [
                              ...(d2.games || []),
                              ...currentGames,
                            ];
                            const processed = OpponentIntel.processGames(
                              allGames,
                              username,
                              timeControl,
                            );
                            if (processed) {
                              OpponentIntel._cache[cacheKey] = {
                                data: processed,
                                ts: Date.now(),
                              };
                              OpponentIntel.renderZone1(processed);
                              OpponentIntel.renderZone2(processed);
                            } else {
                              $("#oi-zone2").html(
                                '<div style="padding:16px; color:#666; font-size:12px;">Sem dados suficientes para este oponente neste time control.</div>',
                              );
                              $("#oi-zone1").html(
                                '<span style="color:#666; font-size:11px; margin-left:8px;">sem dados</span>',
                              );
                            }
                          } catch (e) {}
                        },
                        onerror: () => {
                          const processed = OpponentIntel.processGames(
                            currentGames,
                            username,
                            timeControl,
                          );
                          if (processed) {
                            OpponentIntel._cache[cacheKey] = {
                              data: processed,
                              ts: Date.now(),
                            };
                            OpponentIntel.renderZone1(processed);
                            OpponentIntel.renderZone2(processed);
                          } else {
                            $("#oi-zone2").html(
                              '<div style="padding:16px; color:#666; font-size:12px;">Sem dados suficientes para este oponente neste time control.</div>',
                            );
                            $("#oi-zone1").html(
                              '<span style="color:#666; font-size:11px; margin-left:8px;">sem dados</span>',
                            );
                          }
                        },
                        ontimeout: () => {
                          log("OpponentIntel: timeout");
                          $("#oi-zone2").html(
                            '<div style="padding:16px; color:#666; font-size:12px;">Tempo esgotado ao buscar dados.</div>',
                          );
                        },
                        ontimeout: () => {
                          log("OpponentIntel: timeout");
                          $("#oi-zone2").html(
                            '<div style="padding:16px; color:#666; font-size:12px;">Tempo esgotado ao buscar dados.</div>',
                          );
                        },
                      });
                    }
                  } catch (e) {
                    log("OpponentIntel fallback erro: " + e);
                  }
                },
                onerror: () => {
                  log("OpponentIntel: erro ao buscar jogos");
                },
              });
            } catch (e) {
              log("OpponentIntel.fetchData parse erro: " + e);
            }
          },
          onerror: (err) => {
            log("OpponentIntel.fetchData erro de rede: " + JSON.stringify(err));
          },
          ontimeout: () => {
            log("OpponentIntel.fetchData TIMEOUT na chamada de archives");
          },
        });
      } catch (e) {
        log("OpponentIntel.fetchData erro: " + e);
      }
    },
    renderZone1(data) {
      try {
        $("#oi-zone1").remove();
        const target = OpponentIntel._getOpponentElement
          ? OpponentIntel._getOpponentElement()
          : null;
        log("renderZone1: target encontrado? " + !!target);
        log("renderZone1: data recebida â†’ " + JSON.stringify(data.wld));
        if (!target) return;

        const { wld, streak } = data;
        const streakEmoji =
          streak.type === "W" ? "ðŸ”¥" : streak.type === "L" ? "ðŸ’€" : "âž–";

        const html = `<span id="oi-zone1" style="font-size:11px; margin-left:10px; display:inline-flex; gap:6px; align-items:center; vertical-align:middle;">
          <span style="color:#4caf50; font-weight:700;">${wld.w}V</span>
          <span style="color:#888;">Â·</span>
          <span style="color:#f44336; font-weight:700;">${wld.l}D</span>
          <span style="color:#888;">Â·</span>
          <span style="color:#9e9e9e;">${wld.d}E</span>
          <span style="color:#888; margin-left:4px;">${streakEmoji}${streak.count}</span>
        </span>`;

        $(target).parent().append(html);
      } catch (e) {
        log("OpponentIntel.renderZone1 erro: " + e);
      }
    },
    renderZone2(data) {
      try {
        const cleanOpeningName = (name) => {
          if (!name) return "";
          // Remove notaÃ§Ãµes tipo "2.e5 c5", "3.Nc3 d5", etc.
          return name
            .replace(/\s+\d+\..+$/, "")
            .replace(/-/g, " ")
            .trim();
        };

        log(
          "renderZone2: #krypbot-container existe? " +
            !!$("#krypbot-container").length,
        );
        if (!$("#krypbot-container").length) return;

        const {
          avgAccuracy,
          topOpeningWhite,
          topOpeningBlack,
          last5,
          byHour,
          winRateByColor,
        } = data;

        const html = `
      <div id="oi-zone2" style="width:320px; flex-shrink:0; background:linear-gradient(135deg,#121212,#1e1e1e); border-radius:14px; box-shadow:0 6px 20px rgba(0,0,0,0.7); padding:18px 20px; font-family:'Roboto',sans-serif; font-size:12px; color:#e0e0e0; display:flex; flex-direction:column; gap:14px; margin-top:47px;">
        <!-- TÃ­tulo -->
        <div style="font-size:13px; font-weight:700; color:#00ff88; border-bottom:1px solid #2a2a2a; padding-bottom:10px; letter-spacing:0.5px;">
          SCOUT DO OPONENTE
        </div>

        <!-- Win rate por cor - sÃ³ aparece se tiver dados -->
        ${
          winRateByColor.white !== null
            ? `
        <div style="display:flex; gap:8px;">
          <div style="flex:1; background:#1a1a1a; border-radius:8px; padding:10px; text-align:center;">
            <div style="font-size:10px; color:#888; margin-bottom:4px;">JOGANDO DE BRANCAS</div>
            <div style="font-size:20px; font-weight:700; color:#fff;">${winRateByColor.white}%</div>
            <div style="font-size:10px; color:#888;">de vitÃ³ria</div>
          </div>
          <div style="flex:1; background:#1a1a1a; border-radius:8px; padding:10px; text-align:center;">
            <div style="font-size:10px; color:#888; margin-bottom:4px;">JOGANDO DE PRETAS</div>
            <div style="font-size:20px; font-weight:700; color:#fff;">${winRateByColor.black !== null ? winRateByColor.black : "?"}%</div>
            <div style="font-size:10px; color:#888;">de vitÃ³ria</div>
          </div>
        </div>`
            : ""
        }

        <!-- Abertura favorita - sem notaÃ§Ã£o, sÃ³ o nome limpo -->
        ${
          topOpeningWhite || topOpeningBlack
            ? `
        <div style="background:#1a1a1a; border-radius:8px; padding:10px; display:flex; flex-direction:column; gap:6px;">
          <div style="font-size:10px; color:#888; margin-bottom:2px;">ABRE NORMALMENTE COM</div>
          ${
            topOpeningWhite
              ? `<div style="display:flex; justify-content:space-between; align-items:center;">
            <span style="color:#ccc;">Brancas</span>
            <span style="color:#fff; font-weight:600; text-align:right; max-width:200px;">${cleanOpeningName(topOpeningWhite)}</span>
          </div>`
              : ""
          }
          ${
            topOpeningBlack
              ? `<div style="display:flex; justify-content:space-between; align-items:center;">
            <span style="color:#ccc;">Pretas</span>
            <span style="color:#fff; font-weight:600; text-align:right; max-width:200px;">${cleanOpeningName(topOpeningBlack)}</span>
          </div>`
              : ""
          }
        </div>`
            : ""
        }

        <!-- PrecisÃ£o mÃ©dia -->
        ${
          avgAccuracy !== null
            ? `
        <div style="display:flex; justify-content:space-between; align-items:center; background:#1a1a1a; border-radius:8px; padding:10px;">
          <span style="color:#888; font-size:11px;">PrecisÃ£o mÃ©dia</span>
          <span style="color:#00ff88; font-weight:700; font-size:16px;">${avgAccuracy}%</span>
        </div>`
            : ""
        }

        <!-- Performance por horÃ¡rio - linguagem humana -->
        ${
          byHour.morning.total || byHour.afternoon.total || byHour.night.total
            ? `
        <div style="background:#1a1a1a; border-radius:8px; padding:10px; display:flex; flex-direction:column; gap:6px;">
          <div style="font-size:10px; color:#888; margin-bottom:2px;">MELHOR HORÃRIO PARA ENFRENTAR</div>
          ${
            byHour.morning.total
              ? `<div style="display:flex; justify-content:space-between;">
            <span style="color:#ccc;">ManhÃ£</span>
            <span style="color:${byHour.morning.wr >= 60 ? "#f44336" : byHour.morning.wr <= 40 ? "#4caf50" : "#fff"}; font-weight:600;">
              ${byHour.morning.wr}% de vitÃ³ria em ${byHour.morning.total} partida${byHour.morning.total > 1 ? "s" : ""}
            </span>
          </div>`
              : ""
          }
          ${
            byHour.afternoon.total
              ? `<div style="display:flex; justify-content:space-between;">
            <span style="color:#ccc;">Tarde</span>
            <span style="color:${byHour.afternoon.wr >= 60 ? "#f44336" : byHour.afternoon.wr <= 40 ? "#4caf50" : "#fff"}; font-weight:600;">
              ${byHour.afternoon.wr}% de vitÃ³ria em ${byHour.afternoon.total} partida${byHour.afternoon.total > 1 ? "s" : ""}
            </span>
          </div>`
              : ""
          }
          ${
            byHour.night.total
              ? `<div style="display:flex; justify-content:space-between;">
            <span style="color:#ccc;">Noite</span>
            <span style="color:${byHour.night.wr >= 60 ? "#f44336" : byHour.night.wr <= 40 ? "#4caf50" : "#fff"}; font-weight:600;">
              ${byHour.night.wr}% de vitÃ³ria em ${byHour.night.total} partida${byHour.night.total > 1 ? "s" : ""}
            </span>
          </div>`
              : ""
          }
        </div>`
            : ""
        }

        <!-- Ãšltimas 5 partidas -->
        ${
          last5.length
            ? `
        <div style="display:flex; flex-direction:column; gap:4px;">
          <div style="font-size:10px; color:#888; margin-bottom:2px;">ÃšLTIMAS PARTIDAS</div>
          ${last5
            .map(
              (g) => `
            <div style="display:flex; align-items:center; gap:8px; padding:6px 8px; background:#1a1a1a; border-radius:6px; border-left:3px solid ${g.result === "W" ? "#4caf50" : g.result === "L" ? "#f44336" : "#9e9e9e"};">
              <span style="font-size:10px; font-weight:700; color:${g.result === "W" ? "#4caf50" : g.result === "L" ? "#f44336" : "#9e9e9e"}; width:20px;">
                ${g.result === "W" ? "VIT" : g.result === "L" ? "DER" : "EMP"}
              </span>
              <span style="color:#ccc; flex:1; font-size:11px;">${g.opening ? cleanOpeningName(g.opening) : "Abertura desconhecida"}</span>
              ${g.accuracy !== null ? `<span style="color:#666; font-size:10px;">${g.accuracy}%</span>` : ""}
            </div>
          `,
            )
            .join("")}
        </div>`
            : ""
        }
      </div>`;

        // Cria wrapper flex se nÃ£o existir
        $("#oi-zone2").remove();
        if (!$("#oi-wrapper").length) {
          $("#krypbot-container").wrap(
            '<div id="oi-wrapper" style="display:flex; flex-direction:row; gap:16px; align-items:stretch; flex-wrap:wrap;"></div>',
          );
        }
        $("#oi-wrapper").append(html);
      } catch (e) {
        log("OpponentIntel.renderZone2 erro: " + e);
      }
    },
    startObserver() {
      // Pega o username do jogador logado pelo link de perfil no nav
      const getMyOwnUsername = () => {
        // Chess.com tem o username do usuÃ¡rio logado no nav
        const navLink = document.querySelector('a[href*="/member/"]');
        if (navLink) {
          const match = navLink.href.match(/\/member\/([^/?]+)/i);
          if (match) return match[1].toLowerCase();
        }
        // Fallback: botÃ£o de perfil
        const profileBtn = document.querySelector(".user-username-component");
        if (profileBtn) return profileBtn.textContent.trim().toLowerCase();
        return null;
      };

      const getOpponentUsername = () => {
        const myUsername = getMyOwnUsername();
        const all = document.querySelectorAll("a.user-username.username");
        for (const el of all) {
          const name = el.textContent.trim();
          if (name && (!myUsername || name.toLowerCase() !== myUsername)) {
            return name;
          }
        }
        return null;
      };

      const getMyUsernameElement = () => {
        const myUsername = getMyOwnUsername();
        if (!myUsername) return null;
        const all = document.querySelectorAll("a.user-username.username");
        for (const el of all) {
          if (el.textContent.trim().toLowerCase() === myUsername) return el;
        }
        return null;
      };

      const getOpponentElement = () => {
        const myUsername = getMyOwnUsername();
        const all = document.querySelectorAll("a.user-username.username");
        for (const el of all) {
          const name = el.textContent.trim();
          if (name && (!myUsername || name.toLowerCase() !== myUsername))
            return el;
        }
        return null;
      };

      const check = () => {
        const username = getOpponentUsername();
        log(
          "OpponentIntel: check. Oponente: " +
            username +
            " | last: " +
            OpponentIntel.lastOpponent,
        );
        if (username && username !== OpponentIntel.lastOpponent) {
          OpponentIntel.lastOpponent = username;
          log("OpponentIntel: novo oponente â†’ " + username);

          if (autoAdjust.isEnabled()) {
            setTimeout(() => {
              const oppRating = getOpponentRating();
              if (oppRating) {
                autoAdjust.setOpponentRating(oppRating);
                window.krypbotUpdateUI();
              }
            }, 500);
          }

          observer.disconnect();

          $("#oi-zone1").remove();
          $("#oi-zone2").remove();

          const target = getOpponentElement();
          if (target) {
            $(target).after(
              '<span id="oi-zone1" style="font-size:11px;color:#666;margin-left:8px;">...</span>',
            );
          }

          if ($("#krypbot-container").length) {
            if (!$("#oi-wrapper").length) {
              $("#krypbot-container").wrap(
                '<div id="oi-wrapper" style="display:flex; flex-direction:row; gap:16px; align-items:stretch; flex-wrap:wrap;"></div>',
              );
            }
            $("#oi-zone2").remove();
            $("#oi-wrapper").append(`
    <div id="oi-zone2" style="width:320px; flex-shrink:0; background:linear-gradient(135deg,#121212,#1f1f1f); color:#666; border-radius:14px; box-shadow:0 6px 20px rgba(0,0,0,0.7); padding:18px 20px; font-family:'Roboto',sans-serif; font-size:12px; display:flex; flex-direction:column; gap:14px; margin-top:47px;">
      <div style="font-size:13px; font-weight:700; color:#00ff88; border-bottom:1px solid #2a2a2a; padding-bottom:10px; letter-spacing:0.5px;">SCOUT DO OPONENTE</div>
      <div style="margin-top:8px; color:#666;">Carregando dados...</div>
    </div>
  `);
          }
          observer.observe(document.body, { childList: true, subtree: true });

          const timeControl = OpponentIntel.getTimeControl();
          log("OpponentIntel: time control â†’ " + timeControl);
          OpponentIntel.fetchData(username, timeControl);
        }
      };

      // Guarda referÃªncia pro renderZone1 usar
      OpponentIntel._getOpponentElement = getOpponentElement;
      OpponentIntel._getMyUsernameElement = getMyUsernameElement;

      const observer = new MutationObserver(check);
      observer.observe(document.body, { childList: true, subtree: true });
      check();
    },
    getTimeControl() {
      try {
        const el = document.querySelector(".time-selector-button-text");
        if (el) {
          const text = el.textContent.trim();
          const minutes = parseFloat(text);
          if (minutes < 3) return "bullet";
          if (minutes < 10) return "blitz";
          return "rapid";
        }
        // Fallback pela URL
        const url = window.location.href;
        if (url.includes("1|") || url.includes("1/") || url.includes("2|"))
          return "bullet";
        if (url.includes("3|") || url.includes("5|")) return "blitz";
        return "blitz"; // padrÃ£o
      } catch (e) {
        return "blitz";
      }
    },
  };

  // --- ESTADO DO AUTO RUN DELAY (PERSISTENTE) ---
  let autoDelayMin =
      parseFloat(localStorage.getItem("autoMinDelay")) || DEFAULT_MIN_DELAY,
    autoDelayMax =
      parseFloat(localStorage.getItem("autoMaxDelay")) || DEFAULT_MAX_DELAY,
    autoDelayMode = localStorage.getItem("autoDelayMode") || DEFAULT_DELAY_MODE;

  // Sempre forÃ§ar modo Random como padrÃ£o
  autoDelayMode = "random";
  autoDelayMin = 0.5;
  autoDelayMax = 2.0;
  localStorage.setItem("autoDelayMode", "random");
  localStorage.setItem("autoMinDelay", 0.5);
  localStorage.setItem("autoMaxDelay", 2.0);

  // ValidaÃ§Ã£o inicial
  if (isNaN(autoDelayMin) || autoDelayMin <= 0)
    autoDelayMin = DEFAULT_MIN_DELAY;
  if (isNaN(autoDelayMax) || autoDelayMax <= 0)
    autoDelayMax = DEFAULT_MAX_DELAY;
  if (autoDelayMin > autoDelayMax)
    [autoDelayMin, autoDelayMax] = [autoDelayMax, autoDelayMin];

  let chessBot = {
    elo: 3200,
    time: 0.02,
  };

  let autoAdjust = new AutoAdjustRating(chessBot.elo);

  function log(msg) {
    console.log("[KrypBot]", msg);
  }

  function updateMySession(result) {
    try {
      if (result === "W") {
        mySession.wins++;
      } else if (result === "L") {
        mySession.losses++;
      } else {
        mySession.draws++;
      }

      if (mySession.streakType === result) {
        mySession.streak++;
      } else {
        mySession.streakType = result;
        mySession.streak = 1;
      }

      renderMySession();
    } catch (e) {
      log("updateMySession erro: " + e);
    }
  }

  function renderMySession() {
    try {
      $("#oi-mysession").remove();
      const target = OpponentIntel._getMyUsernameElement
        ? OpponentIntel._getMyUsernameElement()
        : null;

      if (!target) return;

      const { wins, losses, draws, streak, streakType } = mySession;
      const emoji =
        streakType === "W" ? "ðŸ”¥" : streakType === "L" ? "ðŸ’€" : "âž–";
      const streakStr = streakType ? `${emoji}${streakType}${streak} Â· ` : "";

      const html = `<span id="oi-mysession" style="font-size:11px;color:#e0e0e0;margin-left:8px;">
      ${streakStr}<span style="color:#4caf50">${wins}</span>-<span style="color:#9e9e9e">${draws}</span>-<span style="color:#f44336">${losses}</span>
    </span>`;

      $(target).after(html);
    } catch (e) {
      log("renderMySession erro: " + e);
    }
  }

  const detectGameMode = () => {
    const url = window.location.href;
    if (url.includes("/puzzle") || url.includes("/puzzles")) {
      gameMode = "puzzle";
    } else {
      gameMode = "play";
    }
    return gameMode;
  };

  // --- LÃ“GICA DE CÃLCULO DE DELAY ---
  const computeDelayValue = () => {
    let min = parseFloat(autoDelayMin);
    let max = parseFloat(autoDelayMax);
    if (isNaN(min)) min = DEFAULT_MIN_DELAY;
    if (isNaN(max)) max = DEFAULT_MAX_DELAY;
    if (min > max) [min, max] = [max, min];

    if (autoDelayMode === "max") return 0;
    if (autoDelayMode === "average") {
      return Number(((min + max) / 2).toFixed(2));
    } else {
      const r = Math.random() * (max - min) + min;
      return Number(r.toFixed(2));
    }
  };

  // --- LÃ“GICA DE AUTO QUEUE (INDEPENDENTE DE IDIOMA) ---
  let auto_queue_checkInterval = null;

  function findNewGameButton() {
    const selectors = [
      'button[data-control-view="play-again"]',
      ".ui_v5-button-primary.ui_v5-button-full",
      ".game-over-controls-button",
      "button.suggestion-button",
      ".rematch.button",
      ".new-game-button",
      ".play-again-button",
    ];

    let btn = null;
    for (const sel of selectors) {
      btn = document.querySelector(sel);
      if (btn && btn.offsetParent !== null) break;
    }

    // Fallback: buscar por texto (apenas botÃµes, nÃ£o links de menu)
    if (!btn || btn.offsetParent === null) {
      const buttons = document.querySelectorAll("button");
      for (const b of buttons) {
        const text = b.innerText ? b.innerText.toLowerCase() : "";
        const isVisible = b.offsetParent !== null;
        const isGameButton =
          !b.closest("nav") && !b.closest(".menu") && !b.closest("header");

        if (
          isVisible &&
          isGameButton &&
          (text.includes("new") ||
            text.includes("jogar") ||
            text.includes("play") ||
            text.includes("partida") ||
            text.includes("rematch") ||
            text.includes("again"))
        ) {
          btn = b;
          break;
        }
      }
    }

    return btn;
  }

  function isInGame() {
    return !!document.querySelector(
      ".board-component, .game-component, [data-board], .board-layout-main, .chess-board, .board, wc-board, [class*='board']",
    );
  }

  function clickNewGame() {
    if (!auto_queue || auto_queue_clicking) return;
    if (!isInGame()) return;

    const btn = findNewGameButton();
    if (btn && btn.offsetParent !== null) {
      auto_queue_clicking = true;
      log("Auto Queue: BotÃ£o detectado. Clicando instantaneamente...");
      if (auto_queue) {
        btn.click();
        log("Auto Queue: Clique executado!");
      }
      auto_queue_clicking = false;
    }
  }

  function handleAutoQueue() {
    if (auto_queue_checkInterval) {
      clearInterval(auto_queue_checkInterval);
      auto_queue_checkInterval = null;
    }

    if (auto_queue_observer) {
      auto_queue_observer.disconnect();
      auto_queue_observer = null;
    }

    if (!auto_queue) {
      return;
    }

    clickNewGame();

    auto_queue_observer = new MutationObserver(() => {
      if (auto_queue && !auto_queue_clicking) {
        clickNewGame();
      }
    });
    auto_queue_observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    auto_queue_checkInterval = setInterval(() => {
      if (auto_queue && !auto_queue_clicking) {
        clickNewGame();
      }
    }, 2000);
  }

  function cleanCache() {
    if (moveCache.size > 100) {
      const keys = Array.from(moveCache.keys());
      keys.slice(0, 50).forEach((k) => moveCache.delete(k));
    }
  }

  const auto_move_piece = function (from, to, board) {
    if (!board) return;
    const game = board.game || (board.gameManager && board.gameManager.game);
    if (!game) return;
    const moves = game.getLegalMoves();
    for (let i = 0; i < moves.length; i++) {
      if (moves[i].from == from && moves[i].to == to) {
        game.move({
          ...moves[i],
          promotion: "q",
          animate: false,
          userGenerated: true,
        });
        break;
      }
    }
  };

  const get_number = (elm) => {
    const data = ["a", "b", "c", "d", "e", "f", "g", "h"];
    return data.indexOf(elm) + 1;
  };

  const create_elm = (num) => {
    const board =
      $("chess-board")[0] ||
      $("wc-chess-board")[0] ||
      $(".board")[0] ||
      $(".chess-board")[0] ||
      $("[class*='board-component']")[0] ||
      $("wc-board")[0];
    if (!board) return [0, 0];
    const elm = document.createElement("div");
    elm.setAttribute("class", `highlight square-${num} myhigh`);
    $(elm).css({
      opacity: "0.6",
      border: `4px solid ${current_color}`,
      background: "rgba(15, 10, 222, 0.4)",
      "border-radius": "50%",
      "z-index": "10",
    });
    $(board).append(elm);
    const jelm = $(elm);
    const x = jelm.position().left;
    const y = jelm.position().top;
    const w = jelm.outerWidth();
    const h = jelm.outerHeight();
    return [(x + w + x) / 2, (y + h + y) / 2];
  };

  const create_div = (str1) => {
    try {
      const target =
        $("chess-board")[0] ||
        $("wc-chess-board")[0] ||
        $(".board")[0] ||
        $(".chess-board")[0] ||
        $("[class*='board-component']")[0] ||
        $("wc-board")[0];

      if (!target) return;
      $(".myhigh").remove();
      $(".myarrow").remove();

      if (!str1 || str1.length < 4) return;

      const a = get_number(str1[0]);
      const b = get_number(str1[2]);
      const first_elm = create_elm(a + str1[1]);
      const last_element = create_elm(b + str1[3]);

      if (first_elm[0] > 0) {
        $(target).append(`
          <svg width="100%" height="100%" class='myarrow' style="position: absolute; top: 0; left: 0; pointer-events: none; z-index: 11;">
            <defs>
              <marker id="arrowhead" markerWidth="12" markerHeight="10" refX="10" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="${current_color}" />
              </marker>
            </defs>
            <line x1="${first_elm[0]}" y1="${first_elm[1]}" x2="${last_element[0]}" y2="${last_element[1]}"
                  stroke="${current_color}" stroke-width="4" marker-end="url(#arrowhead)" />
          </svg>
        `);
      }
    } catch (e) {
      log("Erro: " + e);
    }
  };

  let cached_board = null;
  let cached_game = null;
  function get_cached_game() {
    if (cached_game && typeof cached_game.getFEN === "function" && document.body.contains(cached_board)) {
        return {board: cached_board, game: cached_game};
    }
    cached_board = $("chess-board")[0] || $("wc-chess-board")[0] || $(".board")[0] || $(".chess-board")[0] || $("[class*='board-component']")[0] || $("wc-board")[0];
    cached_game = null;
    if (cached_board) {
        if (cached_board.game) cached_game = cached_board.game;
        else if (cached_board.gameManager && cached_board.gameManager.game) cached_game = cached_board.gameManager.game;
        else {
          const keys = Object.keys(cached_board).filter((k) => k.toLowerCase().includes("game") || k.toLowerCase().includes("chess"));
          for (const k of keys) {
            if (cached_board[k] && cached_board[k].getFEN) { cached_game = cached_board[k]; break; }
          }
          if (!cached_game) {
            for (const k in cached_board) {
              try { if (cached_board[k] && typeof cached_board[k].getFEN === "function") { cached_game = cached_board[k]; break; } } catch (e) {}
            }
          }
        }
    }
    return {board: cached_board, game: cached_game};
  }

  function request_move() {
    if (!can_interval) return;

    const isPuzzleMode = gameMode === "puzzle";
    const shouldRun = isPuzzleMode ? puzzleHint || puzzleAutoMove : hint;
    if (!shouldRun) return;

    try {
      const {board, game} = get_cached_game();

      if (!board || !game) {
        return;
      }

      fen = game.getFEN();

      if (!isPuzzleMode) {
        const turn = game ? game.getTurn() : null;
        let side = game ? game.getPlayingAs() : null;

        // Detectar cor do jogador se getPlayingAs() retornar algo invÃ¡lido
        if (!side || side === null || side === undefined) {
          const url = window.location.href;
          if (url.includes("color=white") || url.includes("color=w"))
            side = "w";
          else if (url.includes("color=black") || url.includes("color=b"))
            side = "b";

          if (!side) side = turn;
        }

        if (turn !== side) {
          $(".myhigh, .myarrow").remove();
          return;
        }
      }

      if (fen === checkfen) return;

      const puzzleElo = 3200;
      const currentElo = isPuzzleMode
        ? puzzleElo
        : autoAdjust.isEnabled()
          ? autoAdjust.getCurrentDifficulty()
          : chessBot.elo;
      const cacheKey = fen + "_" + currentElo;
      const currentCache = isPuzzleMode ? puzzleMoveCache : moveCache;
      const isAutoMove = isPuzzleMode ? puzzleAutoMove : auto_move;

      if (currentCache.has(cacheKey)) {
        const cached = currentCache.get(cacheKey);
        chessBot.time = computeDelayValue();
        if (isAutoMove) {
          if (chessBot.time <= 0) {
            auto_move_piece(
              cached.substring(0, 2),
              cached.substring(2, 4),
              board,
            );
          } else {
            setTimeout(() => {
              auto_move_piece(
                cached.substring(0, 2),
                cached.substring(2, 4),
                board,
              );
            }, chessBot.time * 1000);
          }
        } else {
          create_div(cached);
        }
        return;
      }

      checkfen = fen;
      can_interval = false;

      chessBot.time = computeDelayValue();
      log(`Modo: ${gameMode} | Delay: ${chessBot.time}s | Elo: ${currentElo}`);
      log("Enviando request para " + SERVER_URL + "/getmove");

      GM_xmlhttpRequest({
        method: "POST",
        url: SERVER_URL + "/getmove",
        headers: { "Content-Type": "application/json" },
        data: JSON.stringify({
          fen: fen,
          elo: currentElo,
          time: chessBot.time,
        }),
        onload: function (resp) {
          try {
            const data = JSON.parse(resp.responseText);
            if (data && data.length > 0) {
              const move = data[0];
              log("Lance: " + move);
              if (!isPuzzleMode) cleanCache();
              currentCache.set(cacheKey, move);

              if (isAutoMove) {
                if (chessBot.time <= 0) {
                  auto_move_piece(move.substring(0, 2), move.substring(2, 4), board);
                } else {
                  setTimeout(() => {
                    auto_move_piece(
                      move.substring(0, 2),
                      move.substring(2, 4),
                      board,
                    );
                  }, chessBot.time * 1000);
                }
              } else {
                create_div(move);
              }
            }
          } catch (e) {
            log("Erro parse: " + e);
          }
          can_interval = true;
        },
        onerror: function (resp) {
          log("Erro request: " + (resp ? resp.status : "unknown"));
          can_interval = true;
        },
        ontimeout: function () {
          log("Timeout: servidor nao respondeu em 5s");
          can_interval = true;
        },
        timeout: 5000,
      });
    } catch (e) {
      log("Erro: " + e);
      can_interval = true;
    }
  }

  function createMenu() {
    if ($("#krypbot-container").length) return;

    const css = `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        
        #krypbot-container {
          margin: 30px 0;
          max-width: 400px;
          clear: both;
          background: rgba(18, 18, 22, 0.75);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 20px;
          color: #fff;
          padding: 22px;
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1);
          font-family: 'Inter', sans-serif;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        #krypbot-container.minimized {
          width: 60px;
          height: 60px;
          padding: 0;
          border-radius: 30px;
          cursor: pointer;
          display: flex;
          justify-content: center;
          align-items: center;
          background: rgba(0, 255, 136, 0.15);
          border-color: rgba(0, 255, 136, 0.3);
        }
        
        #krypbot-container.minimized:hover {
          background: rgba(0, 255, 136, 0.25);
          box-shadow: 0 0 20px rgba(0, 255, 136, 0.4);
        }

        #krypbot-container.minimized > *:not(.kb-logo) {
          display: none !important;
        }

        .kb-logo {
          display: none;
          font-size: 26px;
          font-weight: 800;
          color: #00ff88;
          text-shadow: 0 0 12px rgba(0, 255, 136, 0.6);
        }
        
        #krypbot-container.minimized .kb-logo {
          display: block;
        }

        .kb-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }

        .kb-title { 
          font-size: 22px; 
          font-weight: 800; 
          background: linear-gradient(90deg, #00ff88, #00b8ff);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin: 0;
        }
        
        .kb-minimize-btn {
          background: rgba(255, 255, 255, 0.08);
          border: none;
          color: #fff;
          width: 30px;
          height: 30px;
          border-radius: 15px;
          cursor: pointer;
          display: flex;
          justify-content: center;
          align-items: center;
          transition: background 0.2s;
        }
        .kb-minimize-btn:hover { background: rgba(255, 255, 255, 0.15); }

        .kb-section { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
        .kb-section-col { display: flex; flex-direction: column; gap: 8px; margin-bottom: 14px; }
        .kb-section-label { font-size: 14px; font-weight: 500; color: rgba(255,255,255,0.9); margin: 0; }

        .kb-radio-group { 
          display: flex; 
          background: rgba(0, 0, 0, 0.3); 
          border-radius: 20px; 
          padding: 3px; 
          border: 1px solid rgba(255,255,255,0.05);
        }
        .kb-radio-group input[type="radio"] { display: none; }
        .kb-radio-group label {
          padding: 5px 14px;
          font-size: 12px;
          font-weight: 600;
          border-radius: 16px;
          cursor: pointer;
          color: rgba(255,255,255,0.5);
          transition: all 0.3s;
          margin: 0;
        }
        .kb-radio-group input[type="radio"]:checked + label {
          background: linear-gradient(135deg, #00ff88, #00cc6a);
          color: #000;
          box-shadow: 0 2px 10px rgba(0, 255, 136, 0.3);
        }

        .kb-slider-group { display: flex; align-items: center; gap: 12px; }
        .kb-slider { 
          flex-grow: 1; 
          accent-color: #00ff88; 
          cursor: pointer;
          height: 4px;
          background: rgba(255,255,255,0.1);
          border-radius: 2px;
          outline: none;
        }
        .kb-slider-val { font-size: 13px; font-weight: 600; min-width: 40px; color: #00ff88; text-align: right; }

        .kb-footer { 
          margin-top: 15px; 
          padding-top: 15px; 
          border-top: 1px solid rgba(255,255,255,0.06); 
          display: flex; justify-content: space-between; align-items: center; 
        }
        .kb-status { font-size: 12px; color: #00ff88; font-weight: 700; letter-spacing: 0.5px; }
        .kb-color-input { 
          background: none; border: 1px solid rgba(255,255,255,0.1); 
          border-radius: 4px; padding: 0; width: 28px; height: 28px; cursor: pointer; 
        }

        .kb-num-input { 
          width: 60px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); 
          color: #fff; padding: 6px; border-radius: 6px; font-size: 12px; font-family: 'Inter', sans-serif;
        }
        .kb-num-input:focus { outline: none; border-color: #00ff88; }
        .kb-delay-display { font-size: 13px; color: #00ff88; font-weight: 600; }
      </style>
    `;

    const menuHtml = `
      <div id="krypbot-container">
        <div class="kb-logo">K</div>
        
        <div class="kb-header">
          <h2 class="kb-title">Thinker Chess</h2>
          <button class="kb-minimize-btn" id="kb-minimize-toggle">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          </button>
        </div>

        <div class="kb-section">
          <p class="kb-section-label">Bot Status</p>
          <div class="kb-radio-group">
            <input type="radio" id="st-on" name="kb-bot-status" value="1"><label for="st-on">ON</label>
            <input type="radio" id="st-off" name="kb-bot-status" value="0" checked><label for="st-off">OFF</label>
          </div>
        </div>

        <div class="kb-section">
          <p class="kb-section-label">Auto Moves</p>
          <div class="kb-radio-group">
            <input type="radio" id="am-on" name="kb-auto-move" value="1"><label for="am-on">ON</label>
            <input type="radio" id="am-off" name="kb-auto-move" value="0" checked><label for="am-off">OFF</label>
          </div>
        </div>

        <div class="kb-section">
          <p class="kb-section-label">Auto Queue</p>
          <div class="kb-radio-group">
            <input type="radio" id="aq-on" name="kb-auto-queue" value="1"><label for="aq-on">ON</label>
            <input type="radio" id="aq-off" name="kb-auto-queue" value="0" checked><label for="aq-off">OFF</label>
          </div>
        </div>

        <div class="kb-section">
          <p class="kb-section-label">Auto Adjust Rating</p>
          <div class="kb-radio-group">
            <input type="radio" id="aa-on" name="kb-auto-adjust" value="1"><label for="aa-on">ON</label>
            <input type="radio" id="aa-off" name="kb-auto-adjust" value="0" checked><label for="aa-off">OFF</label>
          </div>
        </div>

        <div class="kb-section-col" id="puzzle-section" style="display: none;">
          <p class="kb-section-label">Puzzle Mode <span style="font-size:11px; color:rgba(255,255,255,0.4); font-weight:normal;">(Elo 3200)</span></p>
          <div class="kb-section" style="margin:0">
            <p style="font-size:12px; margin:0; color:rgba(255,255,255,0.6)">Hint Lines</p>
            <div class="kb-radio-group">
              <input type="radio" id="ph-on" name="kb-puzzle-hint" value="1"><label for="ph-on">ON</label>
              <input type="radio" id="ph-off" name="kb-puzzle-hint" value="0" checked><label for="ph-off">OFF</label>
            </div>
          </div>
          <div class="kb-section" style="margin:0">
            <p style="font-size:12px; margin:0; color:rgba(255,255,255,0.6)">Auto Solve</p>
            <div class="kb-radio-group">
              <input type="radio" id="pa-on" name="kb-puzzle-auto" value="1"><label for="pa-on">ON</label>
              <input type="radio" id="pa-off" name="kb-puzzle-auto" value="0" checked><label for="pa-off">OFF</label>
            </div>
          </div>
        </div>

        <div class="kb-section-col">
          <p class="kb-section-label">Elo Level Engine</p>
          <div class="kb-slider-group">
            <span style="font-size:11px; color:rgba(255,255,255,0.4)">800</span>
            <input id="kb-elo-slider" class="kb-slider" type="range" min="800" max="3200" step="100" value="3200">
            <span id="kb-elo-val" class="kb-slider-val">3200</span>
          </div>
        </div>

        <div class="kb-section-col">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <p class="kb-section-label">Auto Run Delay</p>
            <span id="autoDelayDisplay" class="kb-delay-display">0.50 - 2.00s</span>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px;">
            <div style="display:flex; gap:8px; align-items:center;">
              <input type="number" id="minDelayInput" class="kb-num-input" min="0.01" step="0.01">
              <span style="color:rgba(255,255,255,0.4); font-size:11px">to</span>
              <input type="number" id="maxDelayInput" class="kb-num-input" min="0.01" step="0.01">
            </div>
            <div class="kb-radio-group">
              <input type="radio" id="dm-rand" name="delayMode" value="random"><label for="dm-rand">RND</label>
              <input type="radio" id="dm-max" name="delayMode" value="max"><label for="dm-max" style="color:#00b8ff">MAX</label>
            </div>
          </div>
        </div>

        <div class="kb-footer">
          <div style="display:flex; align-items:center; gap:10px;">
            <span style="font-size:12px; color:rgba(255,255,255,0.5);">Theme Color</span>
            <input type="color" id="kb-color-picker" class="kb-color-input" value="#00ff88">
          </div>
          <div &bull; ONLINE</div>
        </div>
      </div>
      

    `;
    
    const bannerHtml = `
      <!-- Thinker Chess Banner -->
      <div id="thinker-chess-banner" style="position: fixed; right: -9999px; top: 100px; z-index: 999999; display: flex; background-color: #ffffff;">
        <img src="data:image/jpeg;base64,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EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEHUBwAAAAAAAAAAAAAEEEEEEEEAAAADgHEHjAAAAAAkAAEEAAAAEEEEEEU0kEEEEBCg0wAAEEUQ0A0E00EUEVjTwBygQgAgCAUEEASgAwkEhCBCADAACABA3333332V3gBDAQgUAAUBSCAR0gQgAAABA333X133330AAQAQgEABChCSD333gBQBT3333U13333320SyBCwEEAgBRAjU2kAAAT3nG3wxX13313332AwDAEEGgBQEB32lSAD2nBzDzxzn3333333322gEEGgAgSj1FCAADFzDzjzzzxz3332H3333QEEAABzDD30AQBXDzzDjjzzzX333333320gEEAFCkAjCgBADxz2TyzyjCjgD3330DHHTAFED3wACAAwAAADy3TzwgBiQAwR300AAAAAEABWgEEgTxyFhRz2SRzjgRbyBz33kAyACkkABWAEGwAACihDz1RzxW4GeABC32kCAABQEAAHAkEgBxCGgRzz3zighCTSgT330AQARwEABWikURCAQWBDzznzwRo4jADTH30jABDwEABSwEBUAACgADz2yyxRRSgIASj130QQBAEAAQCAFDzjEGBFz3zz7wRQ4JQxzxn33xDwFAAEBQWAADhAADzzTziizxABTjTyD210AAkAAEBAFATzzSA3zzwCzAQzQQDDTjX332xyEAAEAASwgDCADnz3xgSDbzjwzADXX3n3mQEAAQgQSAQgAwjnTmITAsCraD6uiH3232wgEAgChQyBzBTwD3nzzzyQxzzxyDX33333igEAAAAAwAAAAAADW0DAAzC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" alt="Thinker Chess" style="width: 100%; height: 100%; object-fit: contain; border-radius: 12px; box-shadow: 0 15px 40px rgba(0,0,0,0.6);">
      </div>
    `;

    $("head").append(css);

    const checkExist = setInterval(function () {
      let mainDiv = $("#board-layout-main");
      if (!mainDiv.length) mainDiv = $(".puzzle-layout");
      if (!mainDiv.length) mainDiv = $(".puzzle-container");
      if (!mainDiv.length) mainDiv = $(".chess-board-wrapper");
      if (!mainDiv.length) mainDiv = $(".board-wrapper");
      if (!mainDiv.length) mainDiv = $("[class*='puzzle-board']");
      if (!mainDiv.length) mainDiv = $(".board");
      if (!mainDiv.length) mainDiv = $(".chess-board");
      if (!mainDiv.length) mainDiv = $("[class*='board-component']");

      if (mainDiv.length) {
        clearInterval(checkExist);
        mainDiv.first().append(menuHtml);
        $("body").append(bannerHtml);
        
        // Dynamically position the banner perfectly next to the sidebar
        function updateBannerPosition() {
          const sidebar = document.querySelector('.board-layout-sidebar, .layout-board-sidebar, #board-layout-sidebar, .play-controller-component');
          const banner = document.getElementById('thinker-chess-banner');
          if (sidebar && banner) {
            const rect = sidebar.getBoundingClientRect();
            banner.style.right = 'auto';
            banner.style.left = (rect.right + 15) + 'px';
            banner.style.top = rect.top + 'px';
            banner.style.height = rect.height + 'px';
            
            let exactWidth = window.innerWidth - rect.right - 25; 
            if (exactWidth < 80) exactWidth = 80;
            
            banner.style.width = exactWidth + 'px';
            banner.style.display = 'flex';
            document.body.style.overflowX = '';
          }
          requestAnimationFrame(updateBannerPosition);
        }
        requestAnimationFrame(updateBannerPosition);

        OpponentIntel.startObserver();
        // Add Minimize Logic
        $("#kb-minimize-toggle").on("click", function (e) {
          e.stopPropagation();
          $("#krypbot-container").addClass("minimized");
        });
        $("#krypbot-container").on("click", function (e) {
          if ($(this).hasClass("minimized")) {
            $(this).removeClass("minimized");
          }
        });

        window.krypbotUpdateUI = function () {
          detectGameMode();
          $(`input[name="kb-bot-status"][value="${hint ? 1 : 0}"]`).prop(
            "checked",
            true,
          );
          $(`input[name="kb-auto-move"][value="${auto_move ? 1 : 0}"]`).prop(
            "checked",
            true,
          );
          $(`input[name="kb-auto-queue"][value="${auto_queue ? 1 : 0}"]`).prop(
            "checked",
            true,
          );
          $(`input[name="kb-puzzle-hint"][value="${puzzleHint ? 1 : 0}"]`).prop(
            "checked",
            true,
          );
          $(
            `input[name="kb-puzzle-auto"][value="${puzzleAutoMove ? 1 : 0}"]`,
          ).prop("checked", true);
          $(
            `input[name="kb-auto-adjust"][value="${autoAdjust.isEnabled() ? 1 : 0}"]`,
          ).prop("checked", true);

          $("#minDelayInput").val(autoDelayMin.toFixed(2));
          $("#maxDelayInput").val(autoDelayMax.toFixed(2));
          $(`input[name="delayMode"][value="${autoDelayMode}"]`).prop(
            "checked",
            true,
          );

          if (autoDelayMode === "max") {
            $(".kb-num-input").css({
              "border-color": "#fff",
              "box-shadow": "0 0 6px rgba(255,255,255,0.5)",
              color: "#fff",
            });
            $("#autoDelayDisplay").text("INSTANT");
          } else {
            $("#autoDelayDisplay").text(
              `${autoDelayMin.toFixed(2)}â€“${autoDelayMax.toFixed(2)}s`,
            );
          }

          const displayElo = autoAdjust.isEnabled()
            ? autoAdjust.getCurrentDifficulty()
            : chessBot.elo;
          $("#kb-elo-val").text(displayElo);
          $("#kb-elo-slider").val(displayElo);
          $("#kb-color-picker").val(current_color);

          // Show/hide puzzle section based on current mode
          if (gameMode === "puzzle") {
            $("#puzzle-section").show();
          } else {
            $("#puzzle-section").hide();
          }
        };

        $('input[name="kb-bot-status"]').on("change", function () {
          hint = $(this).val() == "1";
          if (!hint) $(".myhigh, .myarrow").remove();
          window.krypbotUpdateUI();
        });

        $('input[name="kb-auto-move"]').on("change", function () {
          auto_move = $(this).val() == "1";
          window.krypbotUpdateUI();
        });

        $('input[name="kb-auto-queue"]').on("change", function () {
          auto_queue = $(this).val() == "1";
          handleAutoQueue();
          window.krypbotUpdateUI();
        });

        $('input[name="kb-puzzle-hint"]').on("change", function () {
          puzzleHint = $(this).val() == "1";
          if (!puzzleHint) $(".myhigh, .myarrow").remove();
          window.krypbotUpdateUI();
        });

        $('input[name="kb-puzzle-auto"]').on("change", function () {
          puzzleAutoMove = $(this).val() == "1";
          window.krypbotUpdateUI();
        });

        $('input[name="kb-auto-adjust"]').on("change", function () {
          if ($(this).val() == "1") {
            autoAdjust.updateBaseElo(chessBot.elo);
            autoAdjust.enable();
          } else {
            autoAdjust.disable();
          }
          window.krypbotUpdateUI();
        });

        $("#minDelayInput, #maxDelayInput").on("input change", function () {
          let min = parseFloat($("#minDelayInput").val()) || 0.1;
          let max = parseFloat($("#maxDelayInput").val()) || 0.1;
          if (min > max) {
            autoDelayMin = max;
            autoDelayMax = min;
          } else {
            autoDelayMin = min;
            autoDelayMax = max;
          }
          localStorage.setItem("autoMinDelay", autoDelayMin);
          localStorage.setItem("autoMaxDelay", autoDelayMax);
          $("#autoDelayDisplay").text(
            `${autoDelayMin.toFixed(2)}â€“${autoDelayMax.toFixed(2)}s`,
          );
        });

        $("input[name='delayMode']").on("change", function () {
          autoDelayMode = $(this).val();
          localStorage.setItem("autoDelayMode", autoDelayMode);

          if (autoDelayMode === "max") {
            autoDelayMin = 0;
            autoDelayMax = 0;
            localStorage.setItem("autoMinDelay", 0);
            localStorage.setItem("autoMaxDelay", 0);
            $(".kb-num-input").val("0.00").css({
              "border-color": "#fff",
              "box-shadow": "0 0 8px rgba(255,255,255,0.6)",
              color: "#fff",
            });
            $("#autoDelayDisplay").text("INSTANT");
          } else {
            // Restaurar valores padrÃ£o ao voltar para Random/Avg
            autoDelayMin = 0.5;
            autoDelayMax = 1.0;
            localStorage.setItem("autoMinDelay", 0.5);
            localStorage.setItem("autoMaxDelay", 1.0);
            $(".kb-num-input").val("").css({
              "border-color": "#333",
              "box-shadow": "none",
              color: "#fff",
            });
            $("#minDelayInput").val("0.50").css("color", "#fff");
            $("#maxDelayInput").val("1.00").css("color", "#fff");
            $("#autoDelayDisplay").text("0.50â€“1.00s");
          }

          window.krypbotUpdateUI();
        });

        $("#kb-elo-slider").on("input", function () {
          chessBot.elo = parseInt($(this).val());
          autoAdjust.updateBaseElo(chessBot.elo);
          window.krypbotUpdateUI();
        });

        $("#kb-color-picker").on("input", function () {
          current_color = $(this).val();
        });

        // Monitor URL changes to detect puzzle/play mode
        let lastUrl = window.location.href;
        setInterval(() => {
          if (window.location.href !== lastUrl) {
            lastUrl = window.location.href;
            OpponentIntel.lastOpponent = null;
            if (autoAdjust.isEnabled()) {
              autoAdjust.resetToBase();
            }
            detectGameMode();
            window.krypbotUpdateUI();

            // Tenta detectar resultado da Ãºltima partida
            const resultEl = document.querySelector(".game-result");
            if (resultEl) {
              const text = resultEl.textContent.trim().toLowerCase();
              if (
                text.includes("win") ||
                text.includes("won") ||
                text.includes("vitÃ³ria")
              ) {
                updateMySession("W");
                if (gameMode === "play") autoAdjust.recordResult("W");
              } else if (text.includes("draw") || text.includes("empate")) {
                updateMySession("D");
              } else if (
                text.includes("loss") ||
                text.includes("lost") ||
                text.includes("derrota")
              ) {
                updateMySession("L");
                if (gameMode === "play") autoAdjust.recordResult("L");
              }
            }
          }
        }, 1000);

        window.krypbotUpdateUI();
      }
    }, 500);
  }

  function removeAds() {
    const adSelectors = [
      ".ad-container",
      ".ad-unit",
      "#ad-sidebar",
      ".board-layout-ad",
      ".sky-ad",
      ".ads-container",
      ".chess-ad-wrapper",
      'iframe[id*="google_ads"]',
    ];
    const style = document.createElement("style");
    style.innerHTML =
      adSelectors.join(", ") +
      " { display: none !important; visibility: hidden !important; height: 0 !important; width: 0 !important; }";
    document.head.appendChild(style);
    setInterval(() => {
      adSelectors.forEach((selector) => $(selector).remove());
      $(".board-layout-ad").remove();
    }, 1000);
  }

  $(document).ready(() => {
    createMenu();
    removeAds();

    // Monitor game mode changes and update UI
    setInterval(() => {
      const newMode = detectGameMode();
      if (window.krypbotLastMode !== newMode) {
        window.krypbotLastMode = newMode;
        log("Modo detectado: " + newMode);
        if (typeof window.krypbotUpdateUI === "function")
          window.krypbotUpdateUI();
      }
    }, 500);

    setInterval(() => {
      if (gameMode === "puzzle") {
        if (puzzleHint || puzzleAutoMove) request_move();
      } else {
        if (hint) request_move();
      }
    }, 10);
  });
})();

