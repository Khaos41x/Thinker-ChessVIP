// ==UserScript==
// @name         KrypBot VIP
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
        board.game.move({...moves[i], promotion: "q", animate: true, userGenerated: true});
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
        onload: function(resp) {
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
        onerror: function() {
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
    if ($("#krypbot-menu").length) return;
    $("body").append(`
      <div id="krypbot-menu" style="position:fixed; top:20px; right:20px; width:240px; background:#1b1b1b; color:#81b64c; border:2px solid #81b64c; border-radius:10px; padding:15px; z-index:999999; font-family:sans-serif; box-shadow:0 0 15px rgba(0,0,0,0.5);">
        <h3 style="margin:0 0 10px 0; text-align:center;">KRYPBOT</h3>
        <div style="margin-bottom:10px;">
          <label>Bot: </label>
          <input type="radio" name="bot-status" value="1"> On
          <input type="radio" name="bot-status" value="0" checked> Off
        </div>
        <div style="margin-bottom:10px;">
          <label>Auto: </label>
          <input type="radio" name="bot-move" value="1"> On
          <input type="radio" name="bot-move" value="0" checked> Off
        </div>
        <div style="margin-bottom:10px;">
          <label>Elo: <span id="eloShow">3200</span></label><br>
          <input type="range" id="eloRange" min="800" max="3200" value="3200" style="width:100%;">
        </div>
        <div style="margin-bottom:10px;">
          <label>Tempo: <span id="timeShow">0.02</span>s</label><br>
          <input type="range" id="timeRange" min="0.01" max="0.2" step="0.005" value="0.02" style="width:100%;">
        </div>
        <div style="margin-bottom:10px;">
          <label>Cor: </label>
          <input type="color" id="colorPicker" value="#000000">
        </div>
        <div id="status" style="color:#888; font-size:11px; margin-top:10px;">Pronto</div>
      </div>
    `);

    $('input[name="bot-status"]').on("change", function() {
      hint = $(this).val() === "1";
      if (!hint) { $(".myhigh, .myarrow").remove(); }
      $("#status").text(hint ? "Ativado" : "Pronto").css("color", hint ? "#81b64c" : "#888");
    });

    $('input[name="bot-move"]').on("change", function() {
      auto_move = $(this).val() === "1";
    });

    $("#eloRange").on("input", function() {
      chessBot.elo = parseInt($(this).val());
      $("#eloShow").text(chessBot.elo);
    });

    $("#timeRange").on("input", function() {
      chessBot.time = parseFloat($(this).val());
      $("#timeShow").text(chessBot.time);
    });

    $("#colorPicker").on("input", function() {
      current_color = $(this).val();
    });
  }

  $(document).ready(() => {
    createMenu();
    setInterval(() => {
      if (hint) request_move();
    }, 100);
  });

})();