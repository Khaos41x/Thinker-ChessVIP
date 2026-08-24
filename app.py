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
    DIM = "\033[2m"
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
    def _latency_color(ms):
        if ms < 5:
            return Colors.GREEN
        if ms < 50:
            return Colors.YELLOW
        return Colors.RED

    @staticmethod
    def request(fen, elo, time_limit):
        short_fen = fen[:35] + "..." if len(fen) > 35 else fen
        print(
            f"{Colors.CYAN}[{Log._time()}] "
            f"{Colors.BOLD}[REQUEST]{Colors.RESET}  "
            f"FEN: {Colors.DIM}{short_fen}{Colors.RESET} | "
            f"Elo: {Colors.MAGENTA}{elo}{Colors.RESET} | "
            f"Time: {time_limit}s"
        )

    @staticmethod
    def move(source, move, latency_ms, extra=""):
        color = Log._latency_color(latency_ms)
        extra_str = f" | {extra}" if extra else ""
        print(
            f"{Colors.CYAN}[{Log._time()}] "
            f"{Colors.BOLD}{source}{Colors.RESET}"
            f"  {Colors.BOLD}{move}{Colors.RESET} | "
            f"{color}{latency_ms:.2f}ms{Colors.RESET}"
            f"{extra_str}"
        )

    @staticmethod
    def banner():
        ts = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        print(f"""
{Colors.CYAN}╔══════════════════════════════════════════════╗
║  {Colors.BOLD}Thinker Chess VIP{Colors.RESET}{Colors.CYAN}  v2.2                       ║
╠══════════════════════════════════════════════╣
║  Inicio: {Colors.YELLOW}{ts}{Colors.RESET}{Colors.CYAN}  Modo: {Colors.GREEN}LOCAL{Colors.RESET}{Colors.CYAN}         ║
╚══════════════════════════════════════════════╝{Colors.RESET}
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
from pathlib import Path

def find_komodo_exe():
    """
    Localiza o Komodo chess engine de forma portável.
    Procura em:
    1. ./engine/ (relativo ao app.py)
    2. Variável de ambiente KOMODO_PATH
    3. Se nenhum for encontrado, retorna None e avisa ao usuário
    """
    base_dir = Path(__file__).resolve().parent
    
    # Estratégia 1: ./engine/ relativo ao projeto
    engine_dir = base_dir / "engine"
    candidates = [
        engine_dir / "komodo-14.1-64bit.exe",
        engine_dir / "komodo-14.1-64bit-bmi2.exe",
        engine_dir / "komodo.exe",
    ]
    
    for candidate in candidates:
        if candidate.exists():
            return str(candidate)
    
    # Estratégia 2: Variável de ambiente
    env_path = os.environ.get("KOMODO_PATH")
    if env_path:
        env_candidate = Path(env_path)
        if env_candidate.exists():
            return str(env_candidate)
        elif (env_candidate.parent / "komodo-14.1-64bit.exe").exists():
            return str(env_candidate.parent / "komodo-14.1-64bit.exe")
    
    # Nenhum encontrado
    return None

ENGINE_PATH = find_komodo_exe()

if ENGINE_PATH is None:
    base_dir = Path(__file__).resolve().parent
    print(f"\n{Colors.RED}{Colors.BOLD}╔═══ ERRO CRITICO ═══╗{Colors.RESET}")
    print(f"{Colors.RED}║ Komodo 14 nao encontrado!{Colors.RESET}")
    print(f"{Colors.RED}║{Colors.RESET}")
    print(f"{Colors.RED}║ Esperado em:{Colors.RESET}")
    print(f"{Colors.RED}║   {base_dir / 'engine' / 'komodo-14.1-64bit.exe'}{Colors.RESET}")
    print(f"{Colors.RED}║   {base_dir / 'engine' / 'komodo.exe'}{Colors.RESET}")
    print(f"{Colors.RED}║{Colors.RESET}")
    print(f"{Colors.RED}║ Solucao:{Colors.RESET}")
    print(f"{Colors.RED}║   1. Copie o Komodo para engine/{Colors.RESET}")
    print(f"{Colors.RED}║   2. set KOMODO_PATH=C:\\caminho\\komodo.exe{Colors.RESET}")
    print(f"{Colors.RED}{Colors.BOLD}╚═════════════════════╝{Colors.RESET}\n")
    sys.exit(1)

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

Log.engine("Iniciando Komodo 14.1...")
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

Log.success("Komodo ONLINE!", data={"Threads": cpu_count, "Hash": "256MB", "Skill": 20})

Log.engine("Warmup da engine...")
warmup_board = chess.Board()
engine.play(warmup_board, chess.engine.Limit(depth=10))
Log.success("Warmup completo!")

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

@app.route("/config")
def config_panel():
    return """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Thinker Chess - Config Panel</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Inter',sans-serif;background:#0a0a0f;color:#fff;min-height:100vh;display:flex;justify-content:center;padding:30px 20px}
.container{max-width:480px;width:100%}
.header{text-align:center;margin-bottom:32px}
.logo{font-size:28px;font-weight:800;background:linear-gradient(135deg,#00ff88,#00b8ff);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:6px}
.subtitle{color:rgba(255,255,255,0.4);font-size:13px;font-weight:500}
.status-bar{display:flex;align-items:center;justify-content:center;gap:8px;margin-top:12px;padding:8px 16px;background:rgba(255,255,255,0.04);border-radius:20px;border:1px solid rgba(255,255,255,0.06)}
.status-dot{width:8px;height:8px;border-radius:50%;background:#ef4444;transition:background 0.3s}
.status-dot.connected{background:#00ff88;box-shadow:0 0 8px rgba(0,255,136,0.5)}
.status-text{font-size:12px;color:rgba(255,255,255,0.5)}
.card{background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:16px;padding:20px;margin-bottom:16px;transition:border-color 0.3s}
.card:hover{border-color:rgba(255,255,255,0.1)}
.card-title{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.2px;color:rgba(255,255,255,0.35);margin-bottom:16px}
.row{display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.04)}
.row:last-child{border-bottom:none}
.row-label{font-size:14px;font-weight:500;color:rgba(255,255,255,0.9)}
.row-desc{font-size:11px;color:rgba(255,255,255,0.35);margin-top:2px}
.toggle{position:relative;width:44px;height:24px;cursor:pointer}
.toggle input{opacity:0;width:0;height:0}
.slider{position:absolute;inset:0;background:rgba(255,255,255,0.1);border-radius:12px;transition:all 0.3s}
.slider:before{content:'';position:absolute;width:18px;height:18px;left:3px;bottom:3px;background:#fff;border-radius:50%;transition:all 0.3s}
.toggle input:checked+.slider{background:linear-gradient(135deg,#00ff88,#00b8ff);box-shadow:0 0 12px rgba(0,255,136,0.3)}
.toggle input:checked+.slider:before{transform:translateX(20px)}
.slider-labels{display:flex;gap:6px}
.slider-label{padding:4px 10px;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;background:rgba(255,255,255,0.06);color:rgba(255,255,255,0.4);transition:all 0.2s;border:1px solid transparent}
.slider-label.active{background:rgba(0,255,136,0.12);color:#00ff88;border-color:rgba(0,255,136,0.2)}
.slider-label:hover{background:rgba(255,255,255,0.08)}
input[type=range]{-webkit-appearance:none;width:100%;height:6px;background:rgba(255,255,255,0.08);border-radius:3px;outline:none;margin:12px 0}
input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:18px;height:18px;background:linear-gradient(135deg,#00ff88,#00b8ff);border-radius:50%;cursor:pointer;box-shadow:0 0 10px rgba(0,255,136,0.3)}
.range-header{display:flex;justify-content:space-between;align-items:center}
.range-value{font-size:13px;font-weight:600;color:#00ff88}
input[type=number]{background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.08);border-radius:8px;color:#fff;padding:8px 12px;font-size:13px;width:80px;text-align:center;font-family:inherit;outline:none;transition:border-color 0.2s}
input[type=number]:focus{border-color:rgba(0,255,136,0.4)}
input[type=number]::-webkit-inner-spin-button{opacity:0.5}
.color-section{display:flex;align-items:center;gap:12px}
.color-preview{width:32px;height:32px;border-radius:50%;border:2px solid rgba(255,255,255,0.1);cursor:pointer;overflow:hidden;position:relative}
.color-preview input[type=color]{position:absolute;width:50px;height:50px;top:-10px;left:-10px;border:none;cursor:pointer;opacity:0}
.color-hex{font-size:13px;font-weight:600;color:rgba(255,255,255,0.7);font-family:monospace}
.btn-row{display:flex;gap:10px;margin-top:8px}
.btn{flex:1;padding:12px;border:none;border-radius:12px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;transition:all 0.2s}
.btn-primary{background:linear-gradient(135deg,#00ff88,#00b8ff);color:#000}
.btn-primary:hover{box-shadow:0 4px 20px rgba(0,255,136,0.3);transform:translateY(-1px)}
.btn-secondary{background:rgba(255,255,255,0.06);color:rgba(255,255,255,0.7);border:1px solid rgba(255,255,255,0.08)}
.btn-secondary:hover{background:rgba(255,255,255,0.1)}
.toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%) translateY(100px);background:rgba(0,255,136,0.15);border:1px solid rgba(0,255,136,0.3);color:#00ff88;padding:12px 24px;border-radius:12px;font-size:13px;font-weight:600;backdrop-filter:blur(16px);transition:transform 0.4s cubic-bezier(0.16,1,0.3,1);pointer-events:none;z-index:100}
.toast.show{transform:translateX(-50%) translateY(0)}
.fade-in{animation:fadeIn 0.5s ease-out both}
@keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
.fade-in:nth-child(2){animation-delay:0.05s}
.fade-in:nth-child(3){animation-delay:0.1s}
.fade-in:nth-child(4){animation-delay:0.15s}
.fade-in:nth-child(5){animation-delay:0.2s}
</style>
</head>
<body>
<div class="container">
  <div class="header fade-in">
    <div class="logo">Thinker Chess</div>
    <div class="subtitle">External Config Panel</div>
    <div class="status-bar">
      <div class="status-dot" id="statusDot"></div>
      <span class="status-text" id="statusText">Waiting for userscript...</span>
    </div>
  </div>

  <div class="card fade-in">
    <div class="card-title">Bot Controls</div>
    <div class="row">
      <div><div class="row-label">Bot Status</div><div class="row-desc">Enable move analysis and arrows</div></div>
      <label class="toggle"><input type="checkbox" id="hint"><span class="slider"></span></label>
    </div>
    <div class="row">
      <div><div class="row-label">Auto Moves</div><div class="row-desc">Bot plays the best move automatically</div></div>
      <label class="toggle"><input type="checkbox" id="autoMove"><span class="slider"></span></label>
    </div>
    <div class="row">
      <div><div class="row-label">Auto Queue</div><div class="row-desc">Start new game after current ends</div></div>
      <label class="toggle"><input type="checkbox" id="autoQueue"><span class="slider"></span></label>
    </div>
  </div>

  <div class="card fade-in">
    <div class="card-title">Difficulty</div>
    <div class="row">
      <div><div class="row-label">Auto Adjust Rating</div><div class="row-desc">Dynamic difficulty based on results</div></div>
      <label class="toggle"><input type="checkbox" id="autoAdjust"><span class="slider"></span></label>
    </div>
    <div class="range-header">
      <div class="row-label">Elo Level</div>
      <div class="range-value" id="eloValue">1500</div>
    </div>
    <input type="range" id="eloSlider" min="800" max="3200" step="100" value="1500">
  </div>

  <div class="card fade-in">
    <div class="card-title">Timing</div>
    <div class="row">
      <div><div class="row-label">Smart Pacing</div><div class="row-desc">Human-like adaptive delays</div></div>
      <label class="toggle"><input type="checkbox" id="smartPacing"><span class="slider"></span></label>
    </div>
    <div id="delaySection">
      <div class="row">
        <div class="row-label">Delay Mode</div>
        <div class="slider-labels">
          <span class="slider-label active" data-mode="random">RND</span>
          <span class="slider-label" data-mode="max">MAX</span>
        </div>
      </div>
      <div class="row">
        <div><div class="row-label">Min Delay</div></div>
        <input type="number" id="minDelay" min="0" max="10" step="0.1" value="0.5">
      </div>
      <div class="row">
        <div><div class="row-label">Max Delay</div></div>
        <input type="number" id="maxDelay" min="0" max="10" step="0.1" value="2.0">
      </div>
    </div>
  </div>

  <div class="card fade-in">
    <div class="card-title">Display</div>
    <div class="row">
      <div><div class="row-label">Eval Bar</div><div class="row-desc">Show position evaluation</div></div>
      <label class="toggle"><input type="checkbox" id="evalBar"><span class="slider"></span></label>
    </div>
    <div class="row">
      <div class="row-label">Theme Color</div>
      <div class="color-section">
        <div class="color-preview" id="colorPreview">
          <input type="color" id="colorPicker" value="#10B981">
        </div>
        <span class="color-hex" id="colorHex">#10B981</span>
      </div>
    </div>
  </div>

  <div class="card fade-in">
    <div class="btn-row">
      <button class="btn btn-primary" id="applyBtn">Apply All</button>
      <button class="btn btn-secondary" id="refreshBtn">Refresh</button>
    </div>
  </div>
</div>

<div class="toast" id="toast">Settings applied!</div>

<script>
const API = window.location.origin;
function showToast(text) {
  const t = document.getElementById('toast');
  t.textContent = text;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}
function setConnected(v) {
  document.getElementById('statusDot').className = 'status-dot' + (v ? ' connected' : '');
  document.getElementById('statusText').textContent = v ? 'Synced with server' : 'Server offline...';
}
function toggleDelaySection(off) {
  document.getElementById('delaySection').style.display = off ? 'none' : 'block';
}
function getConfig() {
  const m = document.querySelector('.slider-label.active');
  return {
    hint: document.getElementById('hint').checked,
    autoMove: document.getElementById('autoMove').checked,
    autoQueue: document.getElementById('autoQueue').checked,
    autoAdjust: document.getElementById('autoAdjust').checked,
    evalBar: document.getElementById('evalBar').checked,
    smartPacing: document.getElementById('smartPacing').checked,
    elo: parseInt(document.getElementById('eloSlider').value),
    delayMode: m ? m.dataset.mode : 'random',
    minDelay: parseFloat(document.getElementById('minDelay').value) || 0.5,
    maxDelay: parseFloat(document.getElementById('maxDelay').value) || 2.0,
    color: document.getElementById('colorPicker').value
  };
}
function applyToUI(s) {
  document.getElementById('hint').checked = s.hint;
  document.getElementById('autoMove').checked = s.autoMove;
  document.getElementById('autoQueue').checked = s.autoQueue;
  document.getElementById('autoAdjust').checked = s.autoAdjust;
  document.getElementById('evalBar').checked = s.evalBar;
  document.getElementById('smartPacing').checked = s.smartPacing;
  document.getElementById('eloSlider').value = s.elo;
  document.getElementById('eloValue').textContent = s.elo;
  document.getElementById('minDelay').value = s.minDelay;
  document.getElementById('maxDelay').value = s.maxDelay;
  document.getElementById('colorPicker').value = s.color;
  document.getElementById('colorHex').textContent = s.color;
  document.getElementById('colorPreview').style.background = s.color;
  document.querySelectorAll('.slider-label').forEach(l => {
    l.classList.toggle('active', l.dataset.mode === s.delayMode);
  });
  toggleDelaySection(s.smartPacing);
}
async function saveConfig() {
  try {
    const r = await fetch(API + '/config/save', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(getConfig())
    });
    if (r.ok) { setConnected(true); showToast('Settings saved!'); }
    else showToast('Error saving');
  } catch(e) { showToast('Server offline!'); }
}
async function loadConfig() {
  try {
    const r = await fetch(API + '/config/load');
    if (r.ok) { applyToUI(await r.json()); setConnected(true); }
  } catch(e) { showToast('Server offline!'); }
}
document.querySelectorAll('.toggle input').forEach(el => el.addEventListener('change', saveConfig));
document.querySelectorAll('.slider-label').forEach(el => el.addEventListener('click', () => {
  el.parentElement.querySelectorAll('.slider-label').forEach(l => l.classList.remove('active'));
  el.classList.add('active');
  saveConfig();
}));
document.getElementById('eloSlider').addEventListener('input', e => {
  document.getElementById('eloValue').textContent = e.target.value;
  saveConfig();
});
document.getElementById('minDelay').addEventListener('change', saveConfig);
document.getElementById('maxDelay').addEventListener('change', saveConfig);
document.getElementById('colorPicker').addEventListener('input', e => {
  document.getElementById('colorHex').textContent = e.target.value;
  document.getElementById('colorPreview').style.background = e.target.value;
  saveConfig();
});
document.getElementById('smartPacing').addEventListener('change', e => {
  toggleDelaySection(e.target.checked);
  saveConfig();
});
document.getElementById('applyBtn').addEventListener('click', saveConfig);
document.getElementById('refreshBtn').addEventListener('click', loadConfig);
loadConfig();
</script>
</body>
</html>"""

# --- External Config Panel API ---
_external_config = {
    "hint": False, "autoMove": False, "autoQueue": False,
    "autoAdjust": False, "evalBar": False, "smartPacing": False,
    "elo": 1500, "delayMode": "random", "minDelay": 0.5, "maxDelay": 2.0,
    "color": "#10B981"
}

@app.route("/config/save", methods=["POST"])
def config_save():
    global _external_config
    try:
        data = request.get_json(force=True, silent=True)
        if data:
            _external_config.update(data)
            return jsonify({"ok": True})
    except Exception as e:
        Log.error(f"Config save error: {e}")
    return jsonify({"ok": False}), 400

@app.route("/config/load", methods=["GET"])
def config_load():
    return jsonify(_external_config)

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
        Log.request(fen, elo, time_limit)
    
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
        Log.move("[CACHE]", cache[cache_key], elapsed)
        return jsonify([cache[cache_key]])
    
    try:
        board = chess.Board(fen)
        
        book_move = get_book(fen)
        if book_move:
            cache[cache_key] = book_move
            elapsed = (time.perf_counter() - start_time) * 1000
            Log.move("[BOOK]", book_move, elapsed)
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
            Log.move("[ENGINE]", move, elapsed, extra=f"tempo: {actual_time}s")
            return jsonify([move])
        
        return jsonify([])
    except Exception as e:
        Log.error(f"Erro no getmove: {e}")
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
        Log.error(f"Erro no eval: {e}")
        return jsonify({"cp": 0, "mate": None})

from core import rating
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
    Log.banner()
    Log.success("Rodando em http://127.0.0.1:5050")
    app.run(host="127.0.0.1", port=5050, debug=False, threaded=True)