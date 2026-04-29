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
          <p class="kb-section-label">Elo Level</p>
          <div class="kb-slider-group">
            <span style="font-size:12px">800</span>
            <input id="kb-elo-slider" class="kb-slider" type="range" min="800" max="3200" step="100" value="3200">
            <span id="kb-elo-val" class="kb-slider-val">3200</span>
          </div>
        </div>

        <div class="kb-section">
          <p class="kb-section-label">Move Delay (Speed)</p>
          <div class="kb-slider-group">
            <span style="font-size:12px">0.01s</span>
            <input id="kb-time-slider" class="kb-slider" type="range" min="0.01" max="0.5" step="0.01" value="0.02">
            <span id="kb-time-val" class="kb-slider-val">0.02s</span>
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
      const mainDiv = $('#board-layout-main');
      if (mainDiv.length) {
        clearInterval(checkExist);
        
        mainDiv.append(menuHtml);

        function updateUI() {
          $(`input[name="kb-bot-status"][value="${hint ? 1 : 0}"]`).prop('checked', true);
          $(`input[name="kb-auto-move"][value="${auto_move ? 1 : 0}"]`).prop('checked', true);
          $("#kb-elo-val").text(chessBot.elo);
          $("#kb-time-val").text(chessBot.time + "s");
          $("#kb-color-picker").val(current_color);
        }

        $('input[name="kb-bot-status"]').on('change', function() {
          hint = $(this).val() == "1";
          if (!hint) $(".myhigh, .myarrow").remove();
          updateUI();
        });

        $('input[name="kb-auto-move"]').on('change', function() {
          auto_move = $(this).val() == "1";
          updateUI();
        });

        $("#kb-elo-slider").on("input", function() {
          chessBot.elo = parseInt($(this).val());
          updateUI();
        });

        $("#kb-time-slider").on("input", function() {
          chessBot.time = parseFloat($(this).val());
          updateUI();
        });

        $("#kb-color-picker").on("input", function() {
          current_color = $(this).val();
        });

        updateUI();
      }
    }, 500);
  }

  function removeAds() {
    const adSelectors = [
      '.ad-container',
      '.ad-unit',
      '#ad-sidebar',
      '.board-layout-ad',
      '.sky-ad',
      '.ads-container',
      '.chess-ad-wrapper',
      'iframe[id*="google_ads"]'
    ];
    
    // Immediate CSS hide
    const style = document.createElement('style');
    style.innerHTML = adSelectors.join(', ') + ' { display: none !important; visibility: hidden !important; height: 0 !important; width: 0 !important; }';
    document.head.appendChild(style);

    // Continuous removal for dynamic ads
    setInterval(() => {
      adSelectors.forEach(selector => {
        $(selector).remove();
      });
      // Specifically target the right sidebar ad area usually found on chess.com
      $('.board-layout-ad').remove();
    }, 1000);
  }

  $(document).ready(() => {
    createMenu();
    removeAds();
    setInterval(() => {
      if (hint) request_move();
    }, 100);
  });

})();