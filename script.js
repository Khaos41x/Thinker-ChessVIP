// ==UserScript==
// @name         TC63
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

  // --- CONFIGURAÇÕES PADRÃO (AUTO RUN DELAY) ---
  const DEFAULT_MIN_DELAY = 0.5,
    DEFAULT_MAX_DELAY = 2.0,
    DEFAULT_DELAY_MODE = "random";

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

        // Precisão média
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

        // Últimas 5
        const last5 = processed
          .slice(-5)
          .reverse()
          .map((g) => ({
            result: g.result,
            opening: g.opening,
            accuracy: g.accuracy,
          }));

        // Por horário
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
          timeout: 5000,
          onload: (resp) => {
            try {
              const data = JSON.parse(resp.responseText);
              log(
                "fetchData: archives recebidos, total meses: " +
                  (data.archives ? data.archives.length : 0),
              );
              log(
                "OpponentIntel: archives recebidos → " +
                  JSON.stringify(
                    data.archives ? data.archives.length + " meses" : "vazio",
                  ),
              );
              const archives = data.archives || [];
              if (archives.length === 0) return;

              // Busca mês atual primeiro, depois decide se precisa do anterior
              GM_xmlhttpRequest({
                method: "GET",
                url: archives[archives.length - 1],
                timeout: 5000,
                onload: (r) => {
                  try {
                    const d = JSON.parse(r.responseText);
                    const currentGames = d.games || [];
                    const filteredCurrent = currentGames.filter(
                      (g) => g.time_class === timeControl,
                    );

                    if (filteredCurrent.length >= 15 || archives.length < 2) {
                      // Suficiente, processa só o mês atual
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
                      }
                    } else {
                      // Busca mês anterior também
                      GM_xmlhttpRequest({
                        method: "GET",
                        url: archives[archives.length - 2],
                        timeout: 5000,
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
                          }
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
          onerror: () => {
            log("OpponentIntel.fetchData erro de rede");
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
        log("renderZone1: data recebida → " + JSON.stringify(data.wld));
        if (!target) return;

        const { wld, streak, winRateByColor } = data;
        const streakEmoji =
          streak.type === "W" ? "🔥" : streak.type === "L" ? "💀" : "➖";
        const wr = winRateByColor;

        const html = `<span id="oi-zone1" style="font-size:11px;color:#e0e0e0;margin-left:8px;display:inline-flex;gap:8px;align-items:center;">
      <span><span style="color:#4caf50">${wld.w}</span>-<span style="color:#9e9e9e">${wld.d}</span>-<span style="color:#f44336">${wld.l}</span></span>
      <span>${streakEmoji}${streak.type}${streak.count}</span>
      ${wr.white !== null ? `<span style="color:#fff">B:${wr.white}%</span> <span style="color:#aaa">P:${wr.black !== null ? wr.black : "?"}%</span>` : ""}
    </span>`;

        $(target).parent().append(html);
      } catch (e) {
        log("OpponentIntel.renderZone1 erro: " + e);
      }
    },
    renderZone2(data) {
      try {
        $("#oi-zone2").remove();
        log(
          "renderZone2: #krypbot-container existe? " +
            !!$("#krypbot-container").length,
        );
        if (!$("#krypbot-container").length) return;

        const { avgAccuracy, topOpeningWhite, topOpeningBlack, last5, byHour } =
          data;

        const resultIcon = (r) => (r === "W" ? "✅" : r === "L" ? "❌" : "➖");

        const last5Html = last5
          .map(
            (g) =>
              `<div style="margin:3px 0;">${resultIcon(g.result)} ${g.opening || "Unknown"}${g.accuracy !== null ? ` · ${g.accuracy}%` : ""}</div>`,
          )
          .join("");

        const hourHtml = [
          byHour.morning.total
            ? `☀️ ${byHour.morning.wr}% (${byHour.morning.total}g)`
            : null,
          byHour.afternoon.total
            ? `🌤️ ${byHour.afternoon.wr}% (${byHour.afternoon.total}g)`
            : null,
          byHour.night.total
            ? `🌙 ${byHour.night.wr}% (${byHour.night.total}g)`
            : null,
        ]
          .filter(Boolean)
          .join(" · ");

        const html = `
      <div id="oi-zone2" style="background:linear-gradient(135deg,#121212,#1f1f1f);color:#f0e68c;border-radius:14px;box-shadow:0 6px 20px rgba(0,0,0,0.7);padding:16px 24px;font-family:'Roboto',sans-serif;margin-top:10px;font-size:12px;display:flex;flex-direction:column;gap:10px;">
        <div style="font-size:14px;font-weight:700;color:#00ff88;padding-bottom:8px;border-bottom:1px solid #333;">Opponent Intel</div>
        ${avgAccuracy !== null ? `<div>Precisão média: <span style="color:#fff">${avgAccuracy}%</span></div>` : ""}
        ${topOpeningWhite ? `<div><span style="color:#fff">Brancas:</span> ${topOpeningWhite}</div>` : ""}
        ${topOpeningBlack ? `<div><span style="color:#aaa">Pretas:</span> ${topOpeningBlack}</div>` : ""}
        ${hourHtml ? `<div style="color:#aaa">${hourHtml}</div>` : ""}
        ${last5Html ? `<div style="border-top:1px solid #222;padding-top:8px;color:#e0e0e0;">${last5Html}</div>` : ""}
      </div>`;

        $("#krypbot-container").after(html);
      } catch (e) {
        log("OpponentIntel.renderZone2 erro: " + e);
      }
    },
    startObserver() {
      // Pega o username do jogador logado pelo link de perfil no nav
      const getMyOwnUsername = () => {
        // Chess.com tem o username do usuário logado no nav
        const navLink = document.querySelector('a[href*="/member/"]');
        if (navLink) {
          const match = navLink.href.match(/\/member\/([^/?]+)/i);
          if (match) return match[1].toLowerCase();
        }
        // Fallback: botão de perfil
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
          log("OpponentIntel: novo oponente → " + username);

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
            $("#krypbot-container").after(`
          <div id="oi-zone2" style="background:linear-gradient(135deg,#121212,#1f1f1f);color:#666;border-radius:14px;box-shadow:0 6px 20px rgba(0,0,0,0.7);padding:16px 24px;font-family:'Roboto',sans-serif;margin-top:10px;font-size:12px;">
            <div style="font-size:14px;font-weight:700;color:#00ff88;padding-bottom:8px;border-bottom:1px solid #333;">Opponent Intel</div>
            <div style="margin-top:8px;">Carregando dados...</div>
          </div>
        `);
          }

          observer.observe(document.body, { childList: true, subtree: true });

          const timeControl = OpponentIntel.getTimeControl();
          log("OpponentIntel: time control → " + timeControl);
          OpponentIntel.fetchData(username, timeControl);
        }
      };

      // Guarda referência pro renderZone1 usar
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
        return "blitz"; // padrão
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

  // Validação inicial
  if (isNaN(autoDelayMin) || autoDelayMin <= 0)
    autoDelayMin = DEFAULT_MIN_DELAY;
  if (isNaN(autoDelayMax) || autoDelayMax <= 0)
    autoDelayMax = DEFAULT_MAX_DELAY;
  if (autoDelayMin > autoDelayMax)
    [autoDelayMin, autoDelayMax] = [autoDelayMax, autoDelayMin];
  if (
    autoDelayMode !== "random" &&
    autoDelayMode !== "average" &&
    autoDelayMode !== "max"
  )
    autoDelayMode = DEFAULT_DELAY_MODE;

  let chessBot = {
    elo: 3200,
    time: 0.02,
  };

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
        streakType === "W" ? "🔥" : streakType === "L" ? "💀" : "➖";
      const streakStr = streakType ? `${emoji}${streakType}${streak} · ` : "";

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

  // --- LÓGICA DE CÁLCULO DE DELAY ---
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

  // --- LÓGICA DE AUTO QUEUE (INDEPENDENTE DE IDIOMA) ---
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

    // Fallback: buscar por texto (apenas botões, não links de menu)
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
      ".board-component, .game-component, [data-board], .board-layout-main",
    );
  }

  function clickNewGame() {
    if (!auto_queue || auto_queue_clicking) return;
    if (!isInGame()) return;

    const btn = findNewGameButton();
    if (btn && btn.offsetParent !== null) {
      auto_queue_clicking = true;
      log("Auto Queue: Botão detectado. Iniciando em 3s...");
      setTimeout(() => {
        if (auto_queue) {
          btn.click();
          log("Auto Queue: Clique executado!");
        }
        auto_queue_clicking = false;
      }, 3000);
    }
  }

  function handleAutoQueue() {
    // Limpar interval anterior se existir
    if (auto_queue_checkInterval) {
      clearInterval(auto_queue_checkInterval);
      auto_queue_checkInterval = null;
    }

    if (!auto_queue) {
      if (auto_queue_observer) {
        auto_queue_observer.disconnect();
        auto_queue_observer = null;
      }
      return;
    }

    // Verificar imediatamente se o botão já está visível
    clickNewGame();

    // Configurar MutationObserver para detectar novos botões
    if (!auto_queue_observer) {
      auto_queue_observer = new MutationObserver(() => clickNewGame());
      auto_queue_observer.observe(document.body, {
        childList: true,
        subtree: true,
      });
    }

    // Verificação periódica adicional (a cada 2 segundos)
    // Isso garante que mesmo sem mutação, se o botão aparecer, será detectado
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
    if (!board || !board.game) return;
    const moves = board.game.getLegalMoves();
    for (let i = 0; i < moves.length; i++) {
      if (moves[i].from == from && moves[i].to == to) {
        board.game.move({
          ...moves[i],
          promotion: "q",
          animate: true,
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
    const board = $("chess-board")[0] || $("wc-chess-board")[0];
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
      const target = $("chess-board")[0] || $("wc-chess-board")[0];
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

  function request_move() {
    if (!can_interval) return;

    detectGameMode();

    const isPuzzleMode = gameMode === "puzzle";
    const shouldRun = isPuzzleMode ? puzzleHint || puzzleAutoMove : hint;
    if (!shouldRun) return;

    try {
      const board = $("chess-board")[0] || $("wc-chess-board")[0];
      if (!board || !board.game) return;

      fen = board.game.getFEN();

      if (!isPuzzleMode) {
        const turn = board.game.getTurn();
        let side = board.game.getPlayingAs();

        // Detectar cor do jogador se getPlayingAs() retornar algo inválido
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
      const currentElo = isPuzzleMode ? puzzleElo : chessBot.elo;
      const cacheKey = fen + "_" + currentElo;
      const currentCache = isPuzzleMode ? puzzleMoveCache : moveCache;
      const isAutoMove = isPuzzleMode ? puzzleAutoMove : auto_move;

      if (currentCache.has(cacheKey)) {
        const cached = currentCache.get(cacheKey);
        chessBot.time = computeDelayValue();
        if (isAutoMove) {
          setTimeout(() => {
            auto_move_piece(
              cached.substring(0, 2),
              cached.substring(2, 4),
              board,
            );
          }, chessBot.time * 1000);
        } else {
          create_div(cached);
        }
        return;
      }

      checkfen = fen;
      can_interval = false;

      chessBot.time = computeDelayValue();
      log(`Modo: ${gameMode} | Delay: ${chessBot.time}s | Elo: ${currentElo}`);

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
                setTimeout(() => {
                  auto_move_piece(
                    move.substring(0, 2),
                    move.substring(2, 4),
                    board,
                  );
                }, chessBot.time * 1000);
              } else {
                create_div(move);
              }
            }
          } catch (e) {
            log("Erro parse: " + e);
          }
          can_interval = true;
        },
        onerror: function () {
          log("Erro request");
          can_interval = true;
        },
        timeout: 3000,
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
        #krypbot-container {
          background: linear-gradient(135deg, #121212, #1f1f1f);
          color: #f0e68c;
          border-radius: 14px;
          box-shadow: 0 6px 20px rgba(0,0,0,0.7);
          padding: 25px 35px;
          max-width: 400px;
          margin: 30px 0;
          font-family: 'Roboto', sans-serif;
          display: flex;
          flex-direction: column;
          gap: 18px;
          clear: both;
        }
        .kb-title { font-size: 22px; font-weight: 700; color: #00ff88; margin-bottom: 10px; border-bottom: 1px solid #333; padding-bottom: 10px; }
        .kb-section { display: flex; flex-direction: column; gap: 8px; }
        .kb-section-label { font-size: 18px; font-weight: 600; color: #f0e68c; }

        .kb-controls { display: flex; gap: 15px; }
        .kb-radio-label { display: flex; align-items: center; gap: 6px; cursor: pointer; font-size: 15px; }
        .kb-radio-label input { accent-color: #00ff88; }

        .kb-slider-group { display: flex; align-items: center; gap: 15px; }
        .kb-slider { flex-grow: 1; accent-color: #00ff88; cursor: pointer; }
        .kb-slider-val { font-size: 14px; min-width: 45px; color: #fff; }

        .kb-footer { margin-top: 10px; padding-top: 15px; border-top: 1px solid #222; display: flex; justify-content: space-between; align-items: center; }
        .kb-status { font-size: 13px; color: #00ff88; font-weight: bold; }
        .kb-color-input { background: none; border: 1px solid #444; padding: 0; width: 40px; height: 25px; cursor: pointer; }

        .kb-num-input { width: 70px; background: #1a1a1a; border: 1px solid #333; color: #fff; padding: 6px; border-radius: 4px; font-size: 13px; }
        .kb-delay-header { display: flex; justify-content: space-between; align-items: center; }
        .kb-delay-display { font-size: 14px; color: #fff; font-weight: 500; }
      </style>
    `;

    const menuHtml = `
      <div id="krypbot-container">
        <div class="kb-title">KrypBot Control Panel</div>

        <div class="kb-section">
          <p class="kb-section-label">Bot Status</p>
          <div class="kb-controls">
            <label class="kb-radio-label"><input type="radio" name="kb-bot-status" value="1"> On</label>
            <label class="kb-radio-label"><input type="radio" name="kb-bot-status" value="0" checked> Off</label>
          </div>
        </div>

        <div class="kb-section">
          <p class="kb-section-label">Auto Moves</p>
          <div class="kb-controls">
            <label class="kb-radio-label"><input type="radio" name="kb-auto-move" value="1"> On</label>
            <label class="kb-radio-label"><input type="radio" name="kb-auto-move" value="0" checked> Off</label>
          </div>
        </div>

        <div class="kb-section">
          <p class="kb-section-label">Auto Queue</p>
          <div class="kb-controls">
            <label class="kb-radio-label"><input type="radio" name="kb-auto-queue" value="1"> On</label>
            <label class="kb-radio-label"><input type="radio" name="kb-auto-queue" value="0" checked> Off</label>
          </div>
        </div>

        <div class="kb-section" id="puzzle-section" style="display: none;">
          <p class="kb-section-label">Puzzle Mode <span style="font-size:11px; color:#888; font-weight:normal;">(Elo 3200)</span></p>
          <div class="kb-controls">
            <label class="kb-radio-label"><input type="radio" name="kb-puzzle-hint" value="1"> Hint</label>
            <label class="kb-radio-label"><input type="radio" name="kb-puzzle-hint" value="0" checked> Off</label>
          </div>
          <div class="kb-controls" style="margin-top: 5px;">
            <label class="kb-radio-label"><input type="radio" name="kb-puzzle-auto" value="1"> Auto</label>
            <label class="kb-radio-label"><input type="radio" name="kb-puzzle-auto" value="0" checked> Off</label>
          </div>
        </div>

        <div class="kb-section">
          <p class="kb-section-label">Elo Level</p>
          <div class="kb-slider-group">
            <span style="font-size:12px">800</span>
            <input id="kb-elo-slider" class="kb-slider" type="range" min="800" max="3200" step="100" value="3200">
            <span id="kb-elo-val" class="kb-slider-val">3200</span>
          </div>
        </div>

        <div class="kb-section">
          <div class="kb-delay-header">
            <p class="kb-section-label" style="margin:0">Auto Run Delay</p>
            <span id="autoDelayDisplay" class="kb-delay-display">0.50–2.00s</span>
          </div>
          <div style="display:flex; gap:10px; align-items:center; margin-top:5px;">
            <input type="number" id="minDelayInput" class="kb-num-input" min="0.01" step="0.01">
            <span style="color:#888; font-size:12px">to</span>
            <input type="number" id="maxDelayInput" class="kb-num-input" min="0.01" step="0.01">
          </div>
          <div style="display:flex; gap:15px; margin-top:8px;">
            <label class="kb-radio-label" style="font-size:13px"><input type="radio" name="delayMode" value="random"> Random</label>
            <label class="kb-radio-label" style="font-size:13px"><input type="radio" name="delayMode" value="average"> Avg</label>
            <label class="kb-radio-label" style="font-size:13px"><input type="radio" name="delayMode" value="max"> MAX</label>
          </div>
        </div>

        <div class="kb-footer">
          <div style="display:flex; align-items:center; gap:10px;">
            <span style="font-size:12px; color:#888;">Color:</span>
            <input type="color" id="kb-color-picker" class="kb-color-input" value="#00ff88">
          </div>
          <div class="kb-status">SYSTEM ONLINE</div>
        </div>
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

      if (mainDiv.length) {
        clearInterval(checkExist);
        mainDiv.first().append(menuHtml);
        OpponentIntel.startObserver();

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
              `${autoDelayMin.toFixed(2)}–${autoDelayMax.toFixed(2)}s`,
            );
          }

          $("#kb-elo-val").text(chessBot.elo);
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
            `${autoDelayMin.toFixed(2)}–${autoDelayMax.toFixed(2)}s`,
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
            $(".kb-num-input")
              .val("0.00")
              .css({
                "border-color": "#fff",
                "box-shadow": "0 0 8px rgba(255,255,255,0.6)",
                color: "#fff",
              });
            $("#autoDelayDisplay").text("INSTANT");
          } else {
            // Restaurar valores padrão ao voltar para Random/Avg
            autoDelayMin = 0.5;
            autoDelayMax = 1.0;
            localStorage.setItem("autoMinDelay", 0.5);
            localStorage.setItem("autoMaxDelay", 1.0);
            $(".kb-num-input")
              .val("")
              .css({
                "border-color": "#333",
                "box-shadow": "none",
                color: "#fff",
              });
            $("#minDelayInput").val("0.50").css("color", "#fff");
            $("#maxDelayInput").val("1.00").css("color", "#fff");
            $("#autoDelayDisplay").text("0.50–1.00s");
          }

          window.krypbotUpdateUI();
        });

        $("#kb-elo-slider").on("input", function () {
          chessBot.elo = parseInt($(this).val());
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
            detectGameMode();
            window.krypbotUpdateUI();

            // Tenta detectar resultado da última partida
            const resultEl = document.querySelector(".game-result");
            if (resultEl) {
              const text = resultEl.textContent.trim().toLowerCase();
              if (
                text.includes("win") ||
                text.includes("won") ||
                text.includes("vitória")
              )
                updateMySession("W");
              else if (text.includes("draw") || text.includes("empate"))
                updateMySession("D");
              else if (
                text.includes("loss") ||
                text.includes("lost") ||
                text.includes("derrota")
              )
                updateMySession("L");
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
      detectGameMode();
      if (gameMode === "puzzle") {
        if (puzzleHint || puzzleAutoMove) request_move();
      } else {
        if (hint) request_move();
      }
    }, 100);
  });
})();
