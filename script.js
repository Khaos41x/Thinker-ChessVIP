// ==UserScript==
// @name         TC25
// @namespace    http://tampermonkey.net/
// @version      2026-04-26
// @description  Chess Bot com Servidor Local
// @author       You
// @match        https://www.chess.com/play/computer*
// @match        https://www.chess.com/play/*
// @match        https://www.chess.com/game/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @require      https://code.jquery.com/jquery-3.7.1.min.js
// @grant        GM_xmlhttpRequest
// @connect      localhost
// @connect      127.0.0.1
// ==/UserScript==

(function () {
  "use strict";

  const SERVER_URL = "http://127.0.0.1:5050";

  let can_interval = true,
    auto_move = false,
    current_color = "#000000",
    fen,
    checkfen,
    hint = false,
    moveCache = new Map();

  let chessBot = {
    elo: 3200,
    time: 0.02,
  };

  function log(msg) {
    console.log("[KrypBot]", msg);
  }

  function cleanCache() {
    if (moveCache.size > 100) {
      const keys = Array.from(moveCache.keys());
      keys.slice(0, 50).forEach(k => moveCache.delete(k));
    }
  }

  const auto_move_piece = function (from, to, board) {
    if (!board || !board.game) return;
    const moves = board.game.getLegalMoves();
    for (let i = 0; i < moves.length; i++) {
      if (moves[i].from == from && moves[i].to == to) {
        board.game.move({ ...moves[i], promotion: "q", animate: true, userGenerated: true });
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
      "z-index": "10"
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
    } catch (e) { log("Erro: " + e); }
  };

  function request_move() {
    if (!hint || !can_interval) return;

    try {
      const board = $("chess-board")[0] || $("wc-chess-board")[0];
      if (!board || !board.game) return;

      const turn = board.game.getTurn();
      const side = board.game.getPlayingAs();
      fen = board.game.getFEN();

      if (turn !== side) {
        $(".myhigh").remove();
        $(".myarrow").remove();
        return;
      }

      if (fen === checkfen) return;

      // Check cache
      const cacheKey = fen + "_" + chessBot.elo;
      if (moveCache.has(cacheKey)) {
        const cached = moveCache.get(cacheKey);
        if (auto_move) {
          auto_move_piece(cached.substring(0, 2), cached.substring(2, 4), board);
        } else {
          create_div(cached);
        }
        return;
      }

      checkfen = fen;
      can_interval = false;

      // GM_xmlhttpRequest - mais confiável
      GM_xmlhttpRequest({
        method: "POST",
        url: SERVER_URL + "/getmove",
        headers: { "Content-Type": "application/json" },
        data: JSON.stringify({
          fen: fen,
          elo: chessBot.elo,
          time: chessBot.time
        }),
        onload: function (resp) {
          try {
            const data = JSON.parse(resp.responseText);
            if (data && data.length > 0) {
              const move = data[0];
              log("Lance: " + move);
              cleanCache();
              moveCache.set(cacheKey, move);

              if (auto_move) {
                auto_move_piece(move.substring(0, 2), move.substring(2, 4), board);
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
        timeout: 3000
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
        #krypbot-premium-menu {
          width: 100%; max-width: 380px; background: #111112; 
          border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 16px;
          padding: 16px; box-shadow: 0 16px 32px rgba(0,0,0,0.8);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          color: #ededed; margin: 40px 0 20px 0; 
          box-sizing: border-box; grid-column: 1 / -1; 
        }
        #krypbot-premium-menu * { box-sizing: border-box; }
        .kb-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
        .kb-header-left { display: flex; align-items: center; gap: 12px; }
        .kb-icon-box {
          width: 40px; height: 40px; background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08); border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
        }
        .kb-icon-box svg { width: 20px; height: 20px; fill: none; stroke: #fff; stroke-width: 1.5; stroke-linejoin: round; }
        .kb-title-wrapper { display: flex; flex-direction: column; gap: 2px; }
        .kb-title { font-size: 14px; font-weight: 600; letter-spacing: 1.5px; margin: 0; color: #fff; }
        .kb-subtitle { font-size: 11px; color: #777; margin: 0; }
        .kb-header-actions { display: flex; gap: 6px; }
        .kb-close { background: transparent; border: none; color: #888; cursor: pointer; font-size: 18px; padding: 4px; line-height: 1; border-radius: 4px; display: flex; align-items: center; justify-content: center;}
        .kb-close:hover { color: #fff; background: rgba(255,255,255,0.1); }
        
        .kb-section { margin-bottom: 20px; }
        .kb-section-title {
          font-size: 10px; font-weight: 600; color: #666; text-transform: uppercase; letter-spacing: 1.5px;
          display: flex; align-items: center; gap: 8px; margin-bottom: 10px;
        }
        .kb-section-title svg { width: 12px; height: 12px; fill: #666; }
        
        .kb-card {
          background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.04);
          border-radius: 10px; overflow: hidden;
        }
        .kb-row {
          display: flex; justify-content: space-between; align-items: center;
          padding: 12px 14px; border-bottom: 1px solid rgba(255,255,255,0.03);
        }
        .kb-row:last-child { border-bottom: none; }
        .kb-row-info { display: flex; flex-direction: column; gap: 4px; }
        .kb-row-title { font-size: 13px; font-weight: 500; color: #ddd; }
        .kb-row-desc { font-size: 11px; color: #555; }
        
        .kb-toggle-group {
          display: flex; background: #161618; border: 1px solid rgba(255,255,255,0.05);
          border-radius: 6px; padding: 3px; gap: 3px;
        }
        .kb-toggle-btn {
          background: transparent; border: none; color: #777;
          padding: 5px 14px; font-size: 12px; font-weight: 500;
          border-radius: 5px; cursor: pointer; transition: all 0.2s;
        }
        .kb-toggle-btn.active { background: rgba(255,255,255,0.12); color: #fff; box-shadow: 0 2px 4px rgba(0,0,0,0.3); }
        
        .kb-slider-container { padding: 12px 14px; border-bottom: 1px solid rgba(255,255,255,0.03); }
        .kb-slider-container:last-child { border-bottom: none; }
        .kb-slider-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
        .kb-slider-val { font-size: 12px; color: #aaa; font-variant-numeric: tabular-nums; }
        
        .kb-slider {
          -webkit-appearance: none; width: 100%; height: 4px;
          background: rgba(255,255,255,0.1); border-radius: 2px; outline: none; margin: 0;
        }
        .kb-slider::-webkit-slider-thumb {
          -webkit-appearance: none; appearance: none;
          width: 14px; height: 14px; border-radius: 50%; background: #fff;
          cursor: pointer; box-shadow: 0 0 8px rgba(255,255,255,0.6);
        }
        .kb-ticks { display: flex; justify-content: space-between; margin-top: 6px; padding: 0 6px; }
        .kb-tick { width: 2px; height: 2px; background: rgba(255,255,255,0.2); border-radius: 50%; }
        
        .kb-color-picker-wrap {
          border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; padding: 3px;
          background: #161618; display: flex; align-items: center; gap: 6px; padding-right: 10px;
        }
        .kb-color-picker {
          -webkit-appearance: none; border: none; width: 28px; height: 20px; padding: 0;
          background: transparent; cursor: pointer; border-radius: 3px;
        }
        .kb-color-picker::-webkit-color-swatch-wrapper { padding: 0; }
        .kb-color-picker::-webkit-color-swatch { border: none; border-radius: 3px; }
        
        .kb-footer { display: flex; justify-content: flex-end; margin-top: 16px; }
        .kb-btn-pronto {
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
          color: #fff; padding: 8px 20px; border-radius: 20px; font-size: 12px; font-weight: 500;
          cursor: pointer; display: flex; align-items: center; gap: 6px; transition: all 0.2s;
        }
        .kb-btn-pronto:hover { background: rgba(255,255,255,0.1); }
        .kb-btn-pronto svg { width: 12px; height: 12px; fill: none; stroke: #fff; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }

        /* Minimized Pill CSS */
        #krypbot-minimized-pill {
          display: none;
          align-items: center;
          background: rgba(30, 32, 35, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 40px;
          padding: 8px 16px;
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          box-shadow: 0 10px 30px rgba(0,0,0,0.5);
          margin: 40px 0 20px 0;
          gap: 16px;
          width: fit-content;
        }
        .kb-pill-btn {
          background: transparent;
          border: none;
          width: 44px;
          height: 44px;
          border-radius: 22px;
          display: flex;
          justify-content: center;
          align-items: center;
          cursor: pointer;
          transition: all 0.2s ease;
          color: #888;
        }
        .kb-pill-btn:hover {
          color: #fff;
          background: rgba(255, 255, 255, 0.05);
        }
        .kb-pill-btn.home {
          background: rgba(255, 255, 255, 0.15);
          color: #fff;
        }
        .kb-pill-btn.home:hover {
          background: rgba(255, 255, 255, 0.2);
        }
        .kb-pill-btn.active-state {
          color: #81b64c;
        }
        .kb-pill-btn svg {
          width: 20px;
          height: 20px;
          stroke: currentColor;
          fill: none;
          stroke-width: 2;
          stroke-linecap: round;
          stroke-linejoin: round;
        }
      </style>
    `;

    const menuHtml = `
      <div id="krypbot-container" style="grid-column: 1 / -1;">
        <!-- Full Menu -->
        <div id="krypbot-premium-menu">
          <div class="kb-header">
            <div class="kb-header-left">
              <div class="kb-icon-box">
                <svg viewBox="0 0 24 24"><path d="M18.8 17.5l-1.3-7.5c-.2-1.3-1.1-2.4-2.3-2.8L12 6.1 8.8 7.2C7.6 7.6 6.7 8.7 6.5 10l-1.3 7.5H18.8zM12 2v4M8.5 22h7M12 2v4" stroke-width="1.5"/></svg>
              </div>
              <div class="kb-title-wrapper">
                <h2 class="kb-title">KRYPBOT</h2>
                <p class="kb-subtitle">Configure o comportamento do seu assistente</p>
              </div>
            </div>
            <div class="kb-header-actions">
              <button class="kb-close" id="kb-minimize-btn" title="Minimizar">
                <svg viewBox="0 0 24 24" width="16" height="16"><line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"></line></svg>
              </button>
              <button class="kb-close" id="kb-close-btn" title="Fechar">&times;</button>
            </div>
          </div>

          <div class="kb-section">
            <div class="kb-section-title">
              <svg viewBox="0 0 24 24"><path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.06-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.73,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.06,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.43-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.49-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/></svg>
              SISTEMA
            </div>
            <div class="kb-card">
              <div class="kb-row">
                <div class="kb-row-info">
                  <div class="kb-row-title">Bot</div>
                  <div class="kb-row-desc">Ativa ou desativa o bot.</div>
                </div>
                <div class="kb-toggle-group" id="kb-bot-toggle">
                  <button class="kb-toggle-btn" data-val="1">On</button>
                  <button class="kb-toggle-btn active" data-val="0">Off</button>
                </div>
              </div>
              <div class="kb-row">
                <div class="kb-row-info">
                  <div class="kb-row-title">Auto</div>
                  <div class="kb-row-desc">Permite que o bot jogue automaticamente.</div>
                </div>
                <div class="kb-toggle-group" id="kb-auto-toggle">
                  <button class="kb-toggle-btn" data-val="1">On</button>
                  <button class="kb-toggle-btn active" data-val="0">Off</button>
                </div>
              </div>
            </div>
          </div>

          <div class="kb-section">
            <div class="kb-section-title">
              <svg viewBox="0 0 24 24"><path d="M16,6l2.29,2.29l-4.88,4.88l-4-4L2,16.59L3.41,18l6-6l4,4l6.3-6.29L22,12V6H16z"/></svg>
              PERFORMANCE
            </div>
            <div class="kb-card">
              <div class="kb-slider-container">
                <div class="kb-slider-header">
                  <div class="kb-row-info">
                    <div class="kb-row-title">Elo</div>
                    <div class="kb-row-desc">Força de jogo do bot.</div>
                  </div>
                  <div class="kb-slider-val" id="kb-elo-val">3200</div>
                </div>
                <input type="range" class="kb-slider" id="kb-elo-range" min="800" max="3200" value="3200">
                <div class="kb-ticks"><div class="kb-tick"></div><div class="kb-tick"></div><div class="kb-tick"></div><div class="kb-tick"></div><div class="kb-tick"></div><div class="kb-tick"></div><div class="kb-tick"></div></div>
              </div>
              <div class="kb-slider-container">
                <div class="kb-slider-header">
                  <div class="kb-row-info">
                    <div class="kb-row-title">Tempo de cálculo</div>
                    <div class="kb-row-desc">Tempo antes de jogar.</div>
                  </div>
                  <div class="kb-slider-val" id="kb-time-val">0.02s</div>
                </div>
                <input type="range" class="kb-slider" id="kb-time-range" min="0.01" max="0.2" step="0.005" value="0.02">
                <div class="kb-ticks"><div class="kb-tick"></div><div class="kb-tick"></div><div class="kb-tick"></div><div class="kb-tick"></div><div class="kb-tick"></div><div class="kb-tick"></div><div class="kb-tick"></div></div>
              </div>
            </div>
          </div>

          <div class="kb-section">
            <div class="kb-section-title">
              <svg viewBox="0 0 24 24"><path d="M12,4.5C7,4.5,2.73,7.61,1,12c1.73,4.39,6,7.5,11,7.5s9.27-3.11,11-7.5C21.27,7.61,17,4.5,12,4.5z M12,17 c-2.76,0-5-2.24-5-5s2.24-5,5-5s5,2.24,5,5S14.76,17,12,17z M12,9c-1.66,0-3,1.34-3,3s1.34,3,3,3s3-1.34,3-3S13.66,9,12,9z"/></svg>
              VISUAL
            </div>
            <div class="kb-card">
              <div class="kb-row">
                <div class="kb-row-info">
                  <div class="kb-row-title">Cor da interface</div>
                </div>
                <div class="kb-color-picker-wrap">
                  <input type="color" class="kb-color-picker" id="kb-color-picker" value="#000000">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#666" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </div>
              </div>
            </div>
          </div>

          <div class="kb-footer">
            <button class="kb-btn-pronto" id="kb-btn-pronto">
              <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>
              <span id="kb-status-text">Pronto</span>
            </button>
          </div>
        </div>
        
        <!-- Minimized Pill -->
        <div id="krypbot-minimized-pill">
          <button class="kb-pill-btn home" id="kb-pill-expand" title="Configurações (Expandir)">
            <svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
          </button>
          <button class="kb-pill-btn" id="kb-pill-bot" title="Bot On/Off">
            <svg viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          </button>
          <button class="kb-pill-btn" id="kb-pill-auto" title="Auto On/Off">
            <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>
          </button>
        </div>
      </div>
    `;

    $("head").append(css);

    const checkExist = setInterval(function () {
      const board = $("chess-board")[0] || $("wc-chess-board")[0];
      if (board) {
        clearInterval(checkExist);

        let container = $(board).closest('.board-layout-main');
        if (container.length === 0) container = $(board).parent();

        container.after(menuHtml);

        // Sync Functions
        function syncBotUI() {
          if (!hint) { $(".myhigh, .myarrow").remove(); }
          
          $('#kb-bot-toggle .kb-toggle-btn').removeClass('active');
          $(`#kb-bot-toggle .kb-toggle-btn[data-val="${hint ? 1 : 0}"]`).addClass('active');
          
          if(hint) {
            $('#kb-btn-pronto').css({ 'box-shadow': '0 0 15px rgba(129, 182, 76, 0.4)', 'border-color': '#81b64c' });
            $('#kb-status-text').text('Ativado');
            $('#kb-pill-bot').addClass('active-state');
          } else {
            $('#kb-btn-pronto').css({ 'box-shadow': 'none', 'border-color': 'rgba(255,255,255,0.1)' });
            $('#kb-status-text').text('Pronto');
            $('#kb-pill-bot').removeClass('active-state');
          }
        }

        function syncAutoUI() {
          $('#kb-auto-toggle .kb-toggle-btn').removeClass('active');
          $(`#kb-auto-toggle .kb-toggle-btn[data-val="${auto_move ? 1 : 0}"]`).addClass('active');
          
          if(auto_move) {
            $('#kb-pill-auto').addClass('active-state');
          } else {
            $('#kb-pill-auto').removeClass('active-state');
          }
        }

        // Minimize / Expand logic
        $('#kb-minimize-btn').on('click', () => { 
          $('#krypbot-premium-menu').hide();
          $('#krypbot-minimized-pill').css('display', 'flex');
        });

        $('#kb-pill-expand').on('click', () => {
          $('#krypbot-minimized-pill').hide();
          $('#krypbot-premium-menu').show();
        });

        $('#kb-close-btn').on('click', () => { 
          $('#krypbot-container').hide(); 
        });

        // Toggle triggers
        $('#kb-bot-toggle .kb-toggle-btn').on('click', function () {
          hint = $(this).data('val') === 1;
          syncBotUI();
        });

        $('#kb-pill-bot').on('click', function() {
          hint = !hint;
          syncBotUI();
        });

        $('#kb-auto-toggle .kb-toggle-btn').on('click', function () {
          auto_move = $(this).data('val') === 1;
          syncAutoUI();
        });

        $('#kb-pill-auto').on('click', function() {
          auto_move = !auto_move;
          syncAutoUI();
        });

        $("#kb-elo-range").on("input", function () {
          chessBot.elo = parseInt($(this).val());
          $("#kb-elo-val").text(chessBot.elo);
        });

        $("#kb-time-range").on("input", function () {
          chessBot.time = parseFloat($(this).val());
          $("#kb-time-val").text(chessBot.time + "s");
        });

        $("#kb-color-picker").on("input", function () {
          current_color = $(this).val();
        });
      }
    }, 500);
  }

  $(document).ready(() => {
    createMenu();
    setInterval(() => {
      if (hint) request_move();
    }, 100);
  });

})();