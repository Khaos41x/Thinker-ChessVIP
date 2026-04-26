"""
Teste de velocidade integrado ao servidor
"""
import sys
sys.stdout.reconfigure(encoding='utf-8')

import chess
import chess.engine
import time
from flask import Flask, request, jsonify
from flask_cors import CORS
import threading

app = Flask(__name__)
CORS(app)

ENGINE_PATH = r"C:\Users\casa\Downloads\komodo-14\komodo-14_224afb\Windows\komodo-14.1-64bit.exe"

print("Iniciando Komodo...")
engine = chess.engine.SimpleEngine.popen_uci(ENGINE_PATH)
engine.configure({"Threads": 2, "Hash": 128})
print("Komodo ONLINE!")

last_elo = None

def configure_elo(elo):
    global last_elo
    if last_elo == elo:
        return
    skill = min(20, max(0, int((elo - 800) / 120)))
    engine.configure({"Skill": skill})
    last_elo = elo
    print(f"ELO: {elo} -> Skill: {skill}")

@app.route("/")
def index():
    return "KrypBot SPEED"

@app.route("/getmove", methods=["POST"])
def getmove():
    data = request.json or {}
    fen = data.get("fen", "")
    elo = int(data.get("elo", 3200))
    time_limit = float(data.get("time", 0.03))
    
    if not fen:
        return jsonify([])
    
    try:
        board = chess.Board(fen)
        configure_elo(elo)
        limit = chess.engine.Limit(time=time_limit)
        result = engine.play(board, limit)
        
        if result.move:
            return jsonify([result.move.uci()])
        return jsonify([])
    except Exception as e:
        print(f"Erro: {e}")
        return jsonify([])

@app.route("/test", methods=["GET"])
def test():
    """Roda teste de velocidade"""
    test_fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq -"
    elo = 3200
    time_limit = 0.03
    
    # Warmup
    board = chess.Board(test_fen)
    configure_elo(elo)
    engine.play(board, chess.engine.Limit(time=time_limit))
    
    # Test
    times = []
    for i in range(20):
        board = chess.Board(test_fen)
        start = time.perf_counter()
        result = engine.play(board, chess.engine.Limit(time=time_limit))
        elapsed = (time.perf_counter() - start) * 1000
        times.append(elapsed)
        print(f"{i+1}: {elapsed:.2f}ms - {result.move.uci() if result.move else 'None'}")
    
    avg = sum(times) / len(times)
    return jsonify({
        "min": min(times),
        "max": max(times),
        "avg": avg,
        "results": times
    })

if __name__ == "__main__":
    print("Acesse http://127.0.0.1:5052/test para ver o teste de velocidade")
    print("Servidor rodando em http://127.0.0.1:5052")
    app.run(host="127.0.0.1", port=5052, debug=False, threaded=True)