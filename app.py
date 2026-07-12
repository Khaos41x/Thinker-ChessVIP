# =========================================================
# KRYPBOT LOCAL ENGINE SERVER - v2.2
# Servidor Flask simples e rápido
# =========================================================

import sys
import os
import time
import datetime
import collections
import threading
import logging
import subprocess

sys.stdout.reconfigure(encoding='utf-8')

import chess
import chess.engine
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO

app = Flask(__name__)
CORS(app)

ENGINE_PATH = r"C:\Users\2ln0g0tt7bkehifl\Downloads\komodo-extracted\komodo-14_224afb\Windows\komodo-14.1-64bit.exe"

CORS(app, resources={r"/*": {"origins": "*"}})
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading', ping_timeout=30, ping_interval=10)

log = logging.getLogger("werkzeug")
log.setLevel(logging.ERROR)


class Colors:
    HEADER = "\033[95m"
    BLUE = "\033[94m"
    CYAN = "\033[96m"
    GREEN = "\033[92m"
    YELLOW = "\033[93m"
    RED = "\033[91m"
    BOLD = "\033[1m"
    RESET = "\033[0m"
    MAGENTA = "\033[95m"
    ORANGE = "\033[38;5;208m"
    PURPLE = "\033[38;5;135m"
    PINK = "\033[38;5;213m"


class Log:
    @staticmethod
    def _time():
        now = datetime.datetime.now()
        return now.strftime("%H:%M:%S.%f")[:-3]

    @staticmethod
    def _format_data(data):
        if isinstance(data, dict):
            items = [f"{k}={v}" for k, v in data.items()]
            return " | ".join(items)
        return str(data)

    @staticmethod
    def info(msg, data=None):
        data_str = f" {Colors.YELLOW}[{Log._format_data(data)}]{Colors.RESET}" if data else ""
        print(f"{Colors.CYAN}[{Log._time()}] {Colors.BLUE}[INFO]    {Colors.RESET}{msg}{data_str}")

    @staticmethod
    def success(msg, data=None):
        data_str = f" {Colors.YELLOW}[{Log._format_data(data)}]{Colors.RESET}" if data else ""
        print(f"{Colors.CYAN}[{Log._time()}] {Colors.GREEN}[SUCCESS] {Colors.RESET}{msg}{data_str}")

    @staticmethod
    def warning(msg, data=None):
        data_str = f" {Colors.YELLOW}[{Log._format_data(data)}]{Colors.RESET}" if data else ""
        print(f"{Colors.CYAN}[{Log._time()}] {Colors.YELLOW}[WARN]    {Colors.RESET}{msg}{data_str}")

    @staticmethod
    def error(msg, data=None):
        data_str = f" {Colors.YELLOW}[{Log._format_data(data)}]{Colors.RESET}" if data else ""
        print(f"{Colors.CYAN}[{Log._time()}] {Colors.RED}[ERROR]   {Colors.RESET}{msg}{data_str}")

    @staticmethod
    def critical(msg, data=None):
        data_str = f" [{Log._format_data(data)}]" if data else ""
        print(f"{Colors.RED}{Colors.BOLD}[{Log._time()}] [CRITICAL] {msg}{data_str}{Colors.RESET}")

    @staticmethod
    def socket(msg, data=None):
        data_str = f" {Colors.YELLOW}[{Log._format_data(data)}]{Colors.RESET}" if data else ""
        print(f"{Colors.CYAN}[{Log._time()}] {Colors.PINK}[SOCKET]  {Colors.RESET}{msg}{data_str}")

    @staticmethod
    def chess(msg, data=None):
        data_str = f" {Colors.YELLOW}[{Log._format_data(data)}]{Colors.RESET}" if data else ""
        print(f"{Colors.CYAN}[{Log._time()}] {Colors.ORANGE}[CHESS]   {Colors.RESET}{msg}{data_str}")

    @staticmethod
    def engine(msg, data=None):
        data_str = f" {Colors.YELLOW}[{Log._format_data(data)}]{Colors.RESET}" if data else ""
        print(f"{Colors.CYAN}[{Log._time()}] {Colors.GREEN}[ENGINE]  {Colors.RESET}{msg}{data_str}")

    @staticmethod
    def board(msg, data=None):
        data_str = f" {Colors.YELLOW}[{Log._format_data(data)}]{Colors.RESET}" if data else ""
        print(f"{Colors.CYAN}[{Log._time()}] {Colors.BLUE}[BOARD]   {Colors.RESET}{msg}{data_str}")

    @staticmethod
    def banner():
        print(f"""
{Colors.CYAN}Servidor iniciado em: {Colors.YELLOW}{datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}{Colors.RESET}
{Colors.CYAN}Modo: {Colors.GREEN}SIMPLES{Colors.RESET} (sem autenticação)
""")

    @staticmethod
    def divider(title=""):
        if title:
            print(f"\n{Colors.BOLD}{Colors.CYAN}{'='*20} {title} {'='*20}{Colors.RESET}\n")
        else:
            print(f"{Colors.CYAN}{'='*60}{Colors.RESET}")


# =============================================================================
# CONFIGURAÇÃO DA ENGINE
# =============================================================================

import subprocess

def find_komodo_exe():
    candidates = [
        r"C:\Users\2ln0g0tt7bkehifl\Downloads\komodo-extracted\komodo-14_224afb\Windows\komodo-14.1-64bit.exe",
        r"C:\Users\2ln0g0tt7bkehifl\Downloads\komodo-extracted\komodo-14_224afb\Windows\komodo-14.1-64bit-bmi2.exe"
    ]
    for f in candidates:
        if os.path.exists(f):
            return f
    return candidates[0]

ENGINE_PATH = find_komodo_exe()

START_TIME = time.time()
STATS = {
    "requests": 0,
    "errors": 0,
    "cache_hits": 0,
    "cache_misses": 0,
}


# =============================================================================
# CACHE LRU
# =============================================================================

class LRUCache:
    def __init__(self, capacity=1000):
        self.capacity = capacity
        self.cache = collections.OrderedDict()
        self.lock = threading.Lock()

    def get(self, key):
        with self.lock:
            if key in self.cache:
                self.cache.move_to_end(key)
                STATS["cache_hits"] += 1
                return self.cache[key]
            STATS["cache_misses"] += 1
            return None

    def put(self, key, value):
        with self.lock:
            self.cache[key] = value
            self.cache.move_to_end(key)
            if len(self.cache) > self.capacity:
                self.cache.popitem(last=False)

    def size(self):
        with self.lock:
            return len(self.cache)

    def clear(self):
        with self.lock:
            self.cache.clear()
            Log.info("Cache de análise limpo.")


analysis_cache = LRUCache()
engine = None
cache = {}

def get_target_depth(elo):
    if elo <= 800:
        return 2
    if elo <= 1200:
        return 4
    if elo <= 1600:
        return 6
    if elo <= 2000:
        return 8
    if elo <= 2400:
        return 10
    if elo <= 2800:
        return 14
    if elo <= 3100:
        return 18
    return 24

def get_skill_level(elo):
    """
    Mapeia Elo (800 a 3200) para Skill (0 a 25) do Komodo 14
    """
    if elo >= 3200:
        return 25
    skill = int((elo - 800) / 120)
    return max(0, min(25, skill))

import multiprocessing

cpu_count = multiprocessing.cpu_count()

print("Iniciando Komodo 14.1...")
engine = chess.engine.SimpleEngine.popen_uci(ENGINE_PATH)
ponder_engine = chess.engine.SimpleEngine.popen_uci(ENGINE_PATH)

engine.configure({
    "Threads": cpu_count,
    "Hash": 256,
    "Skill": 20,
})

ponder_engine.configure({
    "Threads": max(1, cpu_count - 1),
    "Hash": 256,
    "Skill": 20,
})

ponder_thread = None
ponder_stop_event = threading.Event()
ponder_analysis = None
ponder_lock = threading.Lock()

def get_base_fen(fen):
    return " ".join(fen.split(" ")[:4])

def ponder_task(fen, elo):
    global ponder_analysis
    try:
        board = chess.Board(fen)
        target_depth = get_target_depth(elo)
        limit = chess.engine.Limit(time=10.0, depth=target_depth)
        
        # Ajusta o nível de Skill no Pondering
        skill_level = get_skill_level(elo)
        ponder_engine.configure({"Skill": skill_level})
        
        with ponder_engine.analysis(board, limit) as analysis:
            with ponder_lock:
                ponder_analysis = analysis
            for info in analysis:
                if ponder_stop_event.is_set():
                    break
                if "pv" in info and len(info["pv"]) >= 2:
                    opp_move = info["pv"][0]
                    our_resp = info["pv"][1]
                    
                    tmp_board = board.copy()
                    tmp_board.push(opp_move)
                    future_fen = tmp_board.fen()
                    
                    cache_key = f"{get_base_fen(future_fen)}_{elo}"
                    cache[cache_key] = our_resp.uci()
    except Exception as e:
        pass
    finally:
        with ponder_lock:
            ponder_analysis = None

print(f"Komodo ONLINE! (Threads: {cpu_count}, Hash: 256MB, Skill: 20)")

print("Warmup da engine...")
warmup_board = chess.Board()
engine.play(warmup_board, chess.engine.Limit(depth=10))
print("Warmup completo!")

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
    start_time = time.perf_counter()
    try:
        data = request.get_json(force=True, silent=True)
        if not data:
            import json
            data = json.loads(request.data)
    except:
        data = {}
        
    fen = data.get("fen", "")
    elo = int(data.get("elo", 3200))
    time_limit = float(data.get("time", 0.1))
    
    if fen:
        print(f"\n[REQUEST] FEN: {fen[:30]}... | Elo: {elo} | Time: {time_limit}s", flush=True)
    
    if not fen:
        return jsonify([])
    
    global ponder_thread, ponder_stop_event, ponder_analysis
    
    ponder_stop_event.set()
    with ponder_lock:
        if ponder_analysis:
            ponder_analysis.stop()
            
    if ponder_thread and ponder_thread.is_alive():
        ponder_thread.join(timeout=0.01)
    
    cache_key = f"{get_base_fen(fen)}_{elo}"
    if cache_key in cache:
        elapsed = (time.perf_counter() - start_time) * 1000
        print(f"[CACHE HIT] Jogada: {cache[cache_key]} | Latência Interna: {elapsed:.2f}ms", flush=True)
        return jsonify([cache[cache_key]])
    
    try:
        board = chess.Board(fen)
        
        book_move = get_book(fen)
        if book_move:
            cache[cache_key] = book_move
            elapsed = (time.perf_counter() - start_time) * 1000
            print(f"[OPENING BOOK] Jogada: {book_move} | Latência Interna: {elapsed:.2f}ms", flush=True)
            return jsonify([book_move])
        
        target_depth = get_target_depth(elo)
        skill_level = get_skill_level(elo)
        
        # Aplica o nível de Skill. Se for 3200, ele vai usar o máximo (25).
        # A força (Elo) é controlada EXCLUSIVAMENTE pelo parâmetro Skill do Komodo.
        engine.configure({"Skill": skill_level})
        
        # Limite de TEMPO DINÂMICO E ESTRITO. Se o time_limit for instantâneo (<= 0.01),
        # usamos um tempo ultra-rápido (0.02s) para a jogada sair de forma imediata.
        actual_time = 0.02 if time_limit <= 0.01 else max(0.05, min(0.2, time_limit))
        limit = chess.engine.Limit(time=actual_time)
            
        result = engine.play(board, limit)
        
        if result.move:
            move = result.move.uci()
            cache[cache_key] = move
            
            # Initiate pondering for the opponent's turn
            next_board = board.copy()
            next_board.push(result.move)
            
            ponder_stop_event.clear()
            ponder_thread = threading.Thread(target=ponder_task, args=(next_board.fen(), elo))
            ponder_thread.start()
            
            elapsed = (time.perf_counter() - start_time) * 1000
            print(f"[ENGINE LIMIT] Jogada: {move} | Latência Interna: {elapsed:.2f}ms | Tempo Configurado: {actual_time}s", flush=True)
            return jsonify([move])
        
        return jsonify([])
    except Exception as e:
        print(f"Erro: {e}")
        return jsonify([])

@app.route("/eval", methods=["POST"])
def evaluate():
    try:
        data = request.get_json(force=True, silent=True)
        if not data:
            import json
            data = json.loads(request.data)
        
        fen = data.get("fen", "")
        if not fen:
            return jsonify({"cp": 0, "mate": None})
            
        board = chess.Board(fen)
        
        # Analise super rapida para a Eval Bar (0.05s)
        # Usamos a ponder_engine para evitar concorrência com a engine principal,
        # impedindo gargalos em lances instantâneos.
        info = ponder_engine.analyse(board, chess.engine.Limit(time=0.05))
        
        score = info.get("score")
        if score:
            # Pegar o score do ponto de vista das brancas
            white_score = score.white()
            
            if white_score.is_mate():
                return jsonify({"cp": None, "mate": white_score.mate(), "depth": info.get("depth", 0)})
            else:
                return jsonify({"cp": white_score.score(), "mate": None, "depth": info.get("depth", 0)})
                
        return jsonify({"cp": 0, "mate": None})
    except Exception as e:
        print(f"Erro no eval: {e}")
        return jsonify({"cp": 0, "mate": None})

import rating
import database

@app.route("/record-match", methods=["POST"])
def record_match():
    data = request.json or {}
    white = data.get("white", "").strip().lower()
    black = data.get("black", "").strip().lower()
    result = data.get("result", "")

    if not white or not black:
        return jsonify({"error": "white and black usernames are required"}), 400

    if result not in ("white_win", "black_win", "draw"):
        return jsonify({"error": "result must be 'white_win', 'black_win', or 'draw'"}), 400

    if white == black:
        return jsonify({"error": "white and black must be different players"}), 400

    try:
        outcome = rating.calculate_ratings(white, black, result)
        Log.chess("Match recorded", data={
            "white": white, "black": black,
            "result": result,
            "white_change": outcome['white']['change'],
            "black_change": outcome['black']['change'],
        })
        return jsonify(outcome)
    except Exception as e:
        Log.error("Failed to record match", data={"error": str(e)})
        return jsonify({"error": str(e)}), 500


@app.route("/rating/<username>", methods=["GET"])
def get_rating(username):
    try:
        summary = rating.get_rating_summary(username)
        return jsonify(summary)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/ratings", methods=["GET"])
def get_all_ratings():
    try:
        order = request.args.get("order", "rating")
        players = database.get_all_players(order_by=order)
        return jsonify([dict(p) for p in players])
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/history/<username>", methods=["GET"])
def get_history(username):
    try:
        limit = int(request.args.get("limit", 50))
        history = database.get_match_history(username, limit=limit)
        return jsonify([dict(h) for h in history])
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "cache": len(cache)})

if __name__ == "__main__":
    print("Rodando em http://127.0.0.1:5050")
    app.run(host="127.0.0.1", port=5050, debug=False, threaded=True)