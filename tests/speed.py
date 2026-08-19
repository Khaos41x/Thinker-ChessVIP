"""
Servidor minimalista para teste de velocidade
"""
import sys
sys.stdout.reconfigure(encoding='utf-8')

import chess
import chess.engine
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

ENGINE_PATH = r"C:\Users\2ln0g0tt7bkehifl\Downloads\komodo-extracted\komodo-14_224afb\Windows\komodo-14.1-64bit.exe"

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
    print(f"ELO configurado: {elo} -> Skill: {skill}")

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
            move = result.move.uci()
            return jsonify([move])
        return jsonify([])
    except Exception as e:
        print(f"Erro: {e}")
        return jsonify([])

if __name__ == "__main__":
    print("Servidor rodando em http://127.0.0.1:5051")
    app.run(host="127.0.0.1", port=5051, debug=False, threaded=True)