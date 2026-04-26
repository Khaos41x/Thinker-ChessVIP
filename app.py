# =========================================================
# KRYPBOT LOCAL ENGINE SERVER - v2.1
# Servidor Flask com Socket.IO para o Assistente de Xadrez.
# Simples, sem autenticação.
# =========================================================

import atexit
import collections
import datetime
import logging
import os
import sys
import threading
import time
import traceback
import concurrent.futures
import uuid
from functools import wraps

import chess
import chess.engine
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_socketio import SocketIO, disconnect, emit

app = Flask(__name__)
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
    base = r"C:\Users\casa\Downloads\komodo-14\komodo-14_224afb\Windows"
    candidates = [
        os.path.join(base, "komodo-14.1-64bit.exe"),
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
engine_lock = threading.Lock()


def get_uptime():
    return str(datetime.timedelta(seconds=int(time.time() - START_TIME)))


# =============================================================================
# OPENING BOOK
# =============================================================================

OPENING_BOOK = {
    "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq -": [
        "e2e4",
        "d2d4",
        "c2c4",
        "g1f3",
    ],
    "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq -": [
        "g1f3",
        "b1c3",
        "f1c4",
        "d2d4",
    ],
    "rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w KQkq -": [
        "g1f3",
        "b1c3",
        "c2c3",
        "d2d4",
    ],
    "rnbqkbnr/pppp1ppp/4p3/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq -": [
        "d2d4",
        "d2d3",
        "b1c3",
    ],
    "rnbqkbnr/pp1ppppp/2p5/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq -": ["d2d4", "b1c3"],
    "rnbqkbnr/ppp1pppp/8/3p4/3P4/8/PPP1PPPP/RNBQKBNR w KQkq -": [
        "c2c4",
        "g1f3",
        "c1f4",
    ],
    "rnbqkb1r/pppppppp/5n2/8/3P4/8/PPP1PPPP/RNBQKBNR w KQkq -": [
        "c2c4",
        "g1f3",
        "c1g5",
    ],
}


def get_book_move(fen):
    try:
        board = chess.Board(fen)
        fen_key = " ".join(board.fen().split(" ")[:4])

        if fen_key in OPENING_BOOK:
            import random
            moves = OPENING_BOOK[fen_key]
            chosen = random.choice(moves)
            Log.info(f"[Book] Lance de abertura: {chosen}")
            return chosen
    except Exception as e:
        Log.warning(f"Erro no Opening Book: {e}")
    return None


# =============================================================================
# ENGINE MANAGEMENT
# =============================================================================

last_configured_elo = None


def init_engine():
    global engine, last_configured_elo
    Log.info(f"Iniciando engine: {ENGINE_PATH}")

    if not os.path.exists(ENGINE_PATH):
        Log.critical(f"Executável não encontrado!")
        return None

    try:
        engine = chess.engine.SimpleEngine.popen_uci(ENGINE_PATH)
        engine.configure({"Threads": 2, "Hash": 128})
        last_configured_elo = None
        Log.success("Engine Komodo ONLINE!")
        return engine
    except Exception as e:
        Log.critical(f"Falha ao iniciar engine: {e}")
        return None


def close_engine():
    global engine
    if engine:
        try:
            engine.quit()
        except:
            pass
        engine = None
    Log.info("Servidor encerrado.")


atexit.register(close_engine)


def configure_engine_strength(elo):
    global last_configured_elo

    if last_configured_elo == elo:
        return

    try:
        if elo >= 2800:
            skill = 20
        elif elo >= 2000:
            skill = 10 + int((elo - 2000) / 80 * 1)
            skill = min(20, skill)
        else:
            skill = int((elo - 800) / 120)
            skill = max(0, min(10, skill))

        engine.configure({"Skill": skill})
        last_configured_elo = elo

    except Exception as e:
        Log.warning(f"Erro config força: {e}")


def get_target_depth(elo):
    if elo <= 600:
        return 3
    if elo <= 1200:
        return 8
    if elo <= 1800:
        return 12
    if elo <= 2400:
        return 16
    if elo <= 3000:
        return 20
    return 24


# =============================================================================
# Socket.IO EVENTS
# =============================================================================

@socketio.on("connect")
def handle_connect(auth=None):
    Log.socket(f"NOVA CONEXAO", {"sid": request.sid[:12], "remote": request.remote_addr})


@socketio.on("disconnect")
def handle_disconnect():
    Log.socket(f"Conexao fechada", {"sid": request.sid[:12]})


@socketio.on("get_bestmove")
def handle_bestmove(data):
    start_time = time.time()
    fen = data.get("fen")

    if not fen or not engine:
        Log.error("Requisição inválida", {"fen": bool(fen), "engine": bool(engine)})
        emit("bestmove", {"move": None, "fen": fen})
        return

    elo = int(data.get("elo", 3200))
    time_limit = float(data.get("time", 0.1))
    multipv = int(data.get("multipv", 1))

    if time_limit < 0.1:
        time_limit = 0.1

    Log.chess(f">> Lance", {"elo": elo, "multipv": multipv, "time": f"{time_limit}s"})
    Log.board(f"FEN: {fen[:50]}...")

    cache_key = f"{fen}_{elo}_{multipv}"
    cached_result = analysis_cache.get(cache_key)
    if cached_result:
        elapsed = time.time() - start_time
        remaining = max(0, time_limit - elapsed)
        if remaining > 0:
            socketio.sleep(remaining)

        total_time = time.time() - start_time
        Log.success("<< [Cache]", {"tempo": f"{total_time:.3f}s"})
        emit("bestmove", {"moves": cached_result, "fen": fen} if multipv > 1 else {"move": cached_result[0], "fen": fen})
        return

    try:
        board = chess.Board(fen)
        Log.board("Tabuleiro OK", {"peças": len(board.piece_map())})

        if multipv == 1:
            book_move = get_book_move(fen)
            if book_move:
                Log.chess(f"[Book] {book_move}")
                elapsed = time.time() - start_time
                remaining = time_limit - elapsed
                if remaining > 0:
                    socketio.sleep(remaining)
                emit("bestmove", {"move": book_move, "fen": fen})
                return

        move_list = []

        with engine_lock:
            if last_configured_elo != elo:
                Log.engine(f"Config ELO: {elo}")
                configure_engine_strength(elo)

        target_depth = get_target_depth(elo)
        limit = chess.engine.Limit(depth=target_depth)

        Log.engine(f"Análise", {"depth": target_depth})

        analysis_start = time.time()
        info_list_raw = []

        try:
            with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
                future = executor.submit(engine.analyse, board, limit, multipv=multipv)
                info_list_raw = future.result(timeout=max(time_limit * 5, 5.0))
        except concurrent.futures.TimeoutError:
            Log.warning("Timeout")
        except Exception as e:
            Log.error(f"Erro: {e}")

        analysis_time = time.time() - analysis_start
        Log.engine(f"OK", {"tempo": f"{analysis_time:.3f}s"})

        if isinstance(info_list_raw, list):
            for idx, info in enumerate(info_list_raw):
                if "pv" in info:
                    move = info["pv"][0].uci()
                    move_list.append(move)
                    score = info.get("score", "N/A")
                    Log.chess(f"  #{idx+1}: {move}", {"score": str(score)})
        else:
            if "pv" in info_list_raw:
                move = info_list_raw["pv"][0].uci()
                move_list.append(move)
                Log.chess(f"Lance: {move}")

        if move_list:
            analysis_cache.put(cache_key, move_list)

        elapsed = time.time() - start_time
        remaining = max(0, time_limit - elapsed)

        if remaining > 0:
            socketio.sleep(remaining)

        total_time = time.time() - start_time

        if multipv > 1:
            Log.success(f"<< {len(move_list)} lances", {"tempo": f"{total_time:.3f}s"})
            emit("bestmove", {"moves": move_list, "fen": fen})
        else:
            best_move = move_list[0] if move_list else None
            Log.success(f"<< {best_move}", {"tempo": f"{total_time:.3f}s"})
            emit("bestmove", {"move": best_move, "fen": fen})

    except Exception as e:
        Log.error(f"Erro: {str(e)}")
        emit("bestmove", {"move": None, "error": str(e)})


# =============================================================================
# ROTAS HTTP
# =============================================================================

@app.route("/")
def index():
    STATS["requests"] += 1
    return "KrypBot v2.1 (Komodo) ONLINE"


@app.route("/health", methods=["GET"])
def health_check():
    STATS["requests"] += 1
    return jsonify(
        {
            "status": "ok",
            "engine": "Komodo 14.1",
            "cache_size": analysis_cache.size(),
            "uptime": get_uptime(),
            "stats": STATS,
        }
    )


@app.route("/api/get_move", methods=["POST"])
def api_get_move():
    STATS["requests"] += 1
    data = request.json or {}
    fen = data.get("fen")

    if not fen or not engine:
        Log.error("Requisição inválida", {"fen": bool(fen), "engine": bool(engine)})
        return jsonify({"move": None, "error": " engine offline"})

    elo = int(data.get("elo", 3200))
    time_limit = float(data.get("time", 0.1))
    multipv = int(data.get("multipv", 1))

    if time_limit < 0.1:
        time_limit = 0.1

    try:
        board = chess.Board(fen)

        # Check cache
        cache_key = f"{fen}_{elo}_{multipv}"
        cached_result = analysis_cache.get(cache_key)
        if cached_result:
            best_move = cached_result[0] if cached_result else None
            Log.info(f"[Cache] {best_move}")
            return jsonify({"move": best_move, "fen": fen})

        # Opening Book
        book_move = get_book_move(fen)
        if book_move:
            Log.info(f"[Book] {book_move}")
            return jsonify({"move": book_move, "fen": fen})

        # Configure engine
        if last_configured_elo != elo:
            configure_engine_strength(elo)

        # Analyze
        target_depth = get_target_depth(elo)
        limit = chess.engine.Limit(depth=target_depth)
        
        result = engine.play(board, limit)
        best_move = result.move.uci() if result.move else None

        if best_move:
            analysis_cache.put(cache_key, [best_move])

        Log.info(f"Lance: {best_move}")
        return jsonify({"move": best_move, "fen": fen})

    except Exception as e:
        Log.error(f"Erro: {str(e)}")
        return jsonify({"move": None, "error": str(e)})


# =============================================================================
# MAIN
# =============================================================================

if __name__ == "__main__":
    Log.banner()

    Log.divider("INICIALIZAÇÃO")
    Log.info("Inicializando motor de xadrez...")
    engine_instance = init_engine()
    if engine_instance:
        Log.success("OK Motor inicializado")
    else:
        Log.critical("X Falha ao iniciar motor")
        sys.exit(1)

    Log.divider("SERVIDOR")
    Log.info(f"Porta: {Colors.YELLOW}5050{Colors.RESET}")
    Log.info(f"Host: {Colors.YELLOW}0.0.0.0{Colors.RESET}")
    Log.success("-> Pronto!\n")

    socketio.run(app, host="0.0.0.0", port=5050, debug=False)