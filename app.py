# =========================================================
# KRYPBOT LOCAL ENGINE SERVER - v2.2
# Servidor Flask simples e rápido
# =========================================================

import sys
import os
import time

sys.stdout.reconfigure(encoding='utf-8')

import chess
import chess.engine
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

ENGINE_PATH = r"C:\Users\casa\Downloads\komodo-14\komodo-14_224afb\Windows\komodo-14.1-64bit.exe"

engine = None
last_elo = None
cache = {}

print("Iniciando Komodo...")
engine = chess.engine.SimpleEngine.popen_uci(ENGINE_PATH)
engine.configure({"Threads": 2, "Hash": 128})
print("Komodo ONLINE!")

def configure_elo(elo):
    global last_elo
    if last_elo == elo:
        return
    skill = min(20, max(0, int((elo - 800) / 120)))
    engine.configure({"Skill": skill})
    last_elo = elo

# Opening Book
OPENING_BOOK = {
    "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq -": ["e2e4", "d2d4", "c2c4", "g1f3"],
    "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq -": ["g1f3", "b1c3", "f1c4", "d2d4"],
    "rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w KQkq -": ["g1f3", "b1c3", "c2c3", "d2d4"],
    "rnbqkbnr/pppp1ppp/4p3/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq -": ["d2d4", "d2d3", "b1c3"],
    "rnbqkbnr/pp1ppppp/2p5/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq -": ["d2d4", "b1c3"],
    "rnbqkbnr/ppp1pppp/8/3p4/3P4/8/PPP1PPPP/RNBQKBNR w KQkq -": ["c2c4", "g1f3", "c1f4"],
    "rnbqkb1r/pppppppp/5n2/8/3P4/8/PPP1PPPP/RNBQKBNR w KQkq -": ["c2c4", "g1f3", "c1g5"],
}

def get_book(fen):
    try:
        board = chess.Board(fen)
        key = " ".join(board.fen().split(" ")[:4])
        if key in OPENING_BOOK:
            import random
            return random.choice(OPENING_BOOK[key])
    except:
        pass
    return None

@app.route("/")
def index():
    return "KrypBot v2.2 ONLINE"

@app.route("/getmove", methods=["POST"])
@app.route("/getMove", methods=["POST"])
def getmove():
    data = request.json or {}
    fen = data.get("fen", "")
    elo = int(data.get("elo", 3200))
    time_limit = float(data.get("time", 0.03))
    
    if not fen:
        return jsonify([])
    
    # Cache
    cache_key = f"{fen}_{elo}"
    if cache_key in cache:
        return jsonify([cache[cache_key]])
    
    try:
        board = chess.Board(fen)
        
        # Book
        book_move = get_book(fen)
        if book_move:
            cache[cache_key] = book_move
            return jsonify([book_move])
        
        # Engine
        configure_elo(elo)
        limit = chess.engine.Limit(time=time_limit)
        result = engine.play(board, limit)
        
        if result.move:
            move = result.move.uci()
            cache[cache_key] = move
            return jsonify([move])
        
        return jsonify([])
    except Exception as e:
        print(f"Erro: {e}")
        return jsonify([])

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "cache": len(cache)})

if __name__ == "__main__":
    print("Rodando em http://127.0.0.1:5050")
    app.run(host="127.0.0.1", port=5050, debug=False, threaded=True)