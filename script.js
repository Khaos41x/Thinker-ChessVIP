// ==UserScript==
// @name         KrypBot VIP
// @namespace    http://tampermonkey.net/
// @version      2026-04-25
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
  let authToken = null;

  const gmRequest = (endpoint, data, callback) => {
    GM_xmlhttpRequest({
      method: "POST",
      url: SERVER_URL + endpoint,
      headers: { "Content-Type": "application/json", "X-Auth-Token": authToken || "" },
      data: JSON.stringify(data),
      onload: (resp) => { 
        try { 
          callback(JSON.parse(resp.responseText)); 
        } catch(e) { 
          callback({error:"Parse error"}); 
        } 
      },
      onerror: () => { callback({error:"Servidor offline"}); },
      ontimeout: () => { callback({error:"Timeout"}); },
      timeout: 30000,
    });
  };

  let can_interval = true,
    main_interval = true,
    auto_move = false,
    current_color = "#000000",
    fen,
    checkfen,
    hint = false,
    lastRequestTime = 0;

  let chessBot = {
    elo: 3200,
    time: 0.3,
    multipv: 1
  };

  function log(msg, data = "") {
    console.log(`[KrypBot] ${msg}`, data);
  }

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

  const create_div = (str1) => {
    try {
      const target = $("chess-board")[0] || $("wc-chess-board")[0];
      if (!target) return;
      $(".myhigh").remove();
      $(".myarrow").remove();

      if (auto_move && str1 && str1.length >= 4) {
        auto_move_piece(str1.substring(0, 2), str1.substring(2, 4), target);
      }

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
    } catch (e) { log("Erro create_div:", e); }
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

      checkfen = fen;
      can_interval = false;
      lastRequestTime = Date.now();

      log(`Req: ELO=${chessBot.elo}, time=${chessBot.time}`);

      gmRequest("/api/get_move", {
        fen: fen,
        elo: chessBot.elo,
        time: chessBot.time,
        multipv: chessBot.multipv
      }, (resp) => {
        log("Resp:", resp);
        if (resp && resp.move) {
          create_div(resp.move);
        } else if (resp && resp.error) {
          log("Erro:", resp.error);
        }
        can_interval = true;
      });

    } catch (e) { 
      log("Erro request_move:", e); 
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
          <label>Tempo: <span id="timeShow">0.3</span>s</label><br>
          <input type="range" id="timeRange" min="0.1" max="2" step="0.1" value="0.3" style="width:100%;">
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
      if (hint && main_interval) request_move();
    }, 500);
  });

})();