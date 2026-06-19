# =========================================================
# SERVIDOR MINIMALISTA DE TESTE
# =========================================================

import chess
import chess.engine

FLASK_APP = None

def create_app():
    from flask import Flask, request, jsonify
    from flask_cors import CORS
    
    app = Flask(__name__)
    CORS(app)
    
    ENGINE_PATH = r"C:\Users\GG\Downloads\komodo-14\komodo-14_224afb\Windows\komodo-14.1-64bit.exe"
    engine = None
    last_elo = None
    
    print("Iniciando engine...")
    engine = chess.engine.SimpleEngine.popen_uci(ENGINE_PATH)
    engine.configure({"Threads": 2, "Hash": 128})
    print("Engine ONLINE!")
    
    def configure(elo):
        nonlocal last_elo
        if last_elo == elo:
            return
        skill = min(20, max(0, int((elo - 800) / 120)))
        engine.configure({"Skill": skill})
        last_elo = elo
    
    @app.route("/getmove", methods=["POST"])
    def get_move():
        data = request.json or {}
        fen = data.get("fen", "")
        elo = int(data.get("elo", 3200))
        time_limit = float(data.get("time", 0.03))
        
        if not fen:
            return jsonify([])
        
        try:
            board = chess.Board(fen)
            configure(elo)
            limit = chess.engine.Limit(time=time_limit)
            result = engine.play(board, limit)
            
            if result.move:
                return jsonify([result.move.uci()])
            return jsonify([])
        except Exception as e:
            print(f"Erro: {e}")
            return jsonify([])
    
    @app.route("/")
    def index():
        return "KrypBot SPEED TEST"
    
    return app

if __name__ == "__main__":
    app = create_app()
    print("Rodando em http://127.0.0.1:5050")
    app.run(host="127.0.0.1", port=5050, debug=False, threaded=True)