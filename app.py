# =========================================================
# KRYPBOT LOCAL ENGINE SERVER - v2.2
# Servidor Flask simples e rápido
# =========================================================

import sys
import os
import time
import datetime
import collections
import atexit
import functools
import threading
import logging
import subprocess
import itertools
import hashlib
import json
from decimal import Decimal, InvalidOperation
from math import ceil, floor
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8')

import chess
import chess.engine
import psutil
from flask import Flask, Response, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO

from core.smart_pacing.adapter import KomodoEngineAdapter
from core.smart_pacing.calibration import CalibrationMode, CalibrationRuntime, RolloutPolicy
from core.smart_pacing.capability import CalibrationCapabilityError, CalibrationCapabilityService, RatingScaleTranslator
from core.smart_pacing.contracts import ContractValidationError, MovePlanRequest
from core.smart_pacing.coordinator import CoordinatorDeadlineExceeded, EngineCoordinator, EngineJob
from core.smart_pacing.security import CapabilityStore, SlidingWindowRateLimiter, require_engine_capability
from core.smart_pacing.service import MovePlanService
from core.smart_pacing.idempotency import MovePlanIdempotencyStore
from core.elo_calibration import CalibrationRequest, EloCalibrator, EngineTelemetry, Side, load_artifact
from core.eval_bar import (
    StockfishEvalBarCancelled,
    StockfishEvalBarError,
    StockfishEvalBarService,
    StockfishEvalBarTimeout,
)

app = Flask(__name__)
CORS(app)

CORS(app, resources={r"/*": {"origins": "*"}})
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading', ping_timeout=30, ping_interval=10)

log = logging.getLogger("werkzeug")
log.setLevel(logging.ERROR)

capability_store = CapabilityStore()
engine_api_auth = require_engine_capability(
    capability_store,
    allowed_origins={"https://www.chess.com", "https://chess.com"},
    rate_limiter=SlidingWindowRateLimiter(limit=240, window_seconds=60),
)
eval_bar_api_auth = require_engine_capability(
    capability_store,
    allowed_origins={"https://www.chess.com", "https://chess.com"},
    rate_limiter=SlidingWindowRateLimiter(limit=240, window_seconds=60),
    concurrency_limit=16,
)
eval_bar_control_auth = require_engine_capability(
    capability_store,
    allowed_origins={"https://www.chess.com", "https://chess.com"},
    rate_limiter=SlidingWindowRateLimiter(limit=240, window_seconds=60),
    concurrency_limit=4,
)
metrics_auth = require_engine_capability(
    capability_store,
    allowed_origins={"https://www.chess.com", "https://chess.com"},
    rate_limiter=SlidingWindowRateLimiter(limit=120, window_seconds=60),
    max_payload_bytes=1024,
    concurrency_limit=2,
)
engine_telemetry = EngineTelemetry()


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
cache = {}
engine_request_lock = threading.RLock()
ANALYSIS_DEPTH = 10


def serialized_engine_request(handler):
    @functools.wraps(handler)
    def wrapped(*args, **kwargs):
        with engine_request_lock:
            return handler(*args, **kwargs)
    return wrapped

def has_live_python_parent(process):
    try:
        parent = process.parent()
        if parent is None or not parent.is_running():
            return False
        return parent.name().casefold() in {
            "python",
            "python.exe",
            "pythonw",
            "pythonw.exe",
        }
    except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
        return False


def cleanup_stale_komodo(engine_path):
    target_path = Path(engine_path).resolve()
    current_username = psutil.Process(os.getpid()).username().casefold()

    for process in psutil.process_iter(["pid", "username", "exe"]):
        try:
            if process.pid == os.getpid():
                continue
            username = (process.info["username"] or "").casefold()
            executable = process.info["exe"]
            if username != current_username or not executable:
                continue
            if Path(executable).resolve() != target_path:
                continue
            if has_live_python_parent(process):
                continue
            process.terminate()
            try:
                process.wait(timeout=1.5)
            except psutil.TimeoutExpired:
                process.kill()
                process.wait(timeout=1.5)
        except (
            psutil.NoSuchProcess,
            psutil.AccessDenied,
            psutil.ZombieProcess,
            OSError,
        ):
            continue


class KomodoSingleton:
    records_restart_metrics = True

    _instance = None
    _instance_lock = threading.Lock()

    def __new__(cls, executable_path):
        with cls._instance_lock:
            if cls._instance is None:
                cls._instance = super().__new__(cls)
                cls._instance._initialized = False
        return cls._instance

    def __init__(self, executable_path):
        if self._initialized:
            return
        self.executable_path = str(Path(executable_path).resolve())
        self._engine = None
        self._lock = threading.RLock()
        self._generation = 0
        self._ready = False
        self.expected_binary_sha256 = None
        self._last_search_stats = {}
        self._last_search_error = None
        self._initialized = True

    @property
    def generation(self):
        return f"komodo-14.1:{self._generation}"

    @property
    def ready(self):
        return self._ready and self._engine is not None

    @property
    def process_pid(self):
        with self._lock:
            if self._engine is None:
                return None
            try:
                return self._engine.transport.get_pid()
            except (AttributeError, OSError):
                return None

    @property
    def last_search_stats(self):
        with self._lock:
            return dict(self._last_search_stats)

    @property
    def last_search_error(self):
        with self._lock:
            return self._last_search_error

    @staticmethod
    def _remaining_timeout(deadline):
        if deadline is None:
            return None
        remaining = deadline - time.monotonic()
        if remaining <= 0:
            raise TimeoutError("engine operation deadline expired")
        return max(0.001, remaining)

    def _bounded_engine_call(self, callback, deadline, reserved_time=0.0):
        if deadline is None:
            return callback()
        previous_timeout = self._engine.timeout
        remaining = self._remaining_timeout(deadline) - max(0.0, reserved_time)
        if remaining <= 0:
            raise TimeoutError("engine operation cannot fit before deadline")
        timeout = max(0.001, remaining)
        self._engine.timeout = min(previous_timeout, timeout) if previous_timeout else timeout
        try:
            return callback()
        finally:
            self._engine.timeout = previous_timeout

    def _start_locked(self, deadline=None):
        if self._engine is not None:
            return
        if self.expected_binary_sha256 is not None:
            actual = hashlib.sha256(Path(self.executable_path).read_bytes()).hexdigest()
            if actual != self.expected_binary_sha256:
                raise chess.engine.EngineError("Komodo binary identity changed")
        timeout = self._remaining_timeout(deadline) if deadline is not None else 10.0
        instance = chess.engine.SimpleEngine.popen_uci(self.executable_path, timeout=timeout)
        try:
            instance.configure({"Threads": 1, "Hash": 128, "Skill": 20})
        except Exception:
            instance.close()
            raise
        self._engine = instance
        self._generation += 1
        self._ready = True
        engine_telemetry.set_engine_status("ready")

    def _restart_locked(self, deadline=None):
        previous = self._engine
        self._engine = None
        self._ready = False
        if previous is not None:
            try:
                previous.close()
            except Exception:
                pass
        engine_telemetry.record_restart("engine_failure")
        self._start_locked(deadline)

    def _clear_hash_locked(self, deadline=None):
        if "Clear Hash" not in self._engine.options:
            raise chess.engine.EngineError("Komodo does not expose Clear Hash")
        self._bounded_engine_call(
            lambda: self._engine.configure({"Clear Hash": None}),
            deadline,
        )

    def apply_profile(self, options, deadline=None):
        with self._lock:
            self._start_locked(deadline)
            self._bounded_engine_call(
                lambda: self._engine.configure(dict(options)),
                deadline,
            )
            self._clear_hash_locked(deadline)
            self._bounded_engine_call(self._engine.ping, deadline)
            self._ready = True
            return {
                "options": dict(options),
                "generation": self.generation,
            }

    def analyse(
        self,
        board,
        limit,
        multipv=None,
        clear_hash=False,
        root_moves=None,
        skill_level=20,
        allow_retry=True,
        deadline=None,
    ):
        with self._lock:
            self._last_search_stats = {}
            self._last_search_error = None
            attempts = 2 if allow_retry else 1
            for attempt in range(attempts):
                try:
                    self._start_locked(deadline)
                    if skill_level is not None:
                        self._bounded_engine_call(
                            lambda: self._engine.configure({"Skill": skill_level}),
                            deadline,
                        )
                    if clear_hash:
                        self._clear_hash_locked(deadline)
                    kwargs = {"multipv": multipv} if multipv is not None else {}
                    if root_moves is not None:
                        kwargs["root_moves"] = root_moves
                    result = self._bounded_engine_call(
                        lambda: self._engine.analyse(board, limit, **kwargs),
                        deadline,
                        reserved_time=limit.time or 0.0,
                    )
                    lines = result if isinstance(result, list) else [result]
                    pairs = []
                    for line in lines:
                        if not isinstance(line, dict):
                            continue
                        nodes = line.get("nodes")
                        seconds = line.get("time")
                        if isinstance(nodes, int) and not isinstance(nodes, bool) and nodes >= 0 and isinstance(seconds, (int, float)) and not isinstance(seconds, bool) and seconds > 0:
                            pairs.append((nodes, float(seconds)))
                    if pairs:
                        nodes, seconds = max(pairs, key=lambda pair: pair[0])
                        self._last_search_stats = {"nodes": nodes, "time": seconds}
                    return lines
                except Exception as error:
                    self._last_search_error = error
                    self._ready = False
                    Log.warning(f"Komodo indisponivel; reiniciando ({attempt + 1}/{attempts}): {error}")
                    if not allow_retry:
                        self.force_terminate()
                        break
                    try:
                        self._restart_locked(deadline)
                    except Exception as restart_error:
                        Log.error(f"Nao foi possivel reiniciar Komodo: {restart_error}")
            return None

    def play(self, board, limit, skill_level, allow_retry=True, deadline=None):
        with self._lock:
            self._last_search_stats = {}
            self._last_search_error = None
            attempts = 2 if allow_retry else 1
            for attempt in range(attempts):
                try:
                    self._start_locked(deadline)
                    if skill_level is not None:
                        self._bounded_engine_call(
                            lambda: self._engine.configure({"Skill": skill_level}),
                            deadline,
                        )
                    result = self._bounded_engine_call(
                        lambda: self._engine.play(board, limit, info=chess.engine.INFO_BASIC),
                        deadline,
                        reserved_time=limit.time or 0.0,
                    )
                    if result.move is None or result.move not in board.legal_moves:
                        raise chess.engine.EngineError("Komodo retornou um lance invalido")
                    info = result.info if isinstance(result.info, dict) else {}
                    nodes = info.get("nodes")
                    seconds = info.get("time")
                    if isinstance(nodes, int) and not isinstance(nodes, bool) and nodes >= 0 and isinstance(seconds, (int, float)) and not isinstance(seconds, bool) and seconds > 0:
                        self._last_search_stats = {"nodes": nodes, "time": float(seconds)}
                    return result.move
                except Exception as error:
                    self._last_search_error = error
                    self._ready = False
                    Log.warning(f"Komodo indisponivel; reiniciando ({attempt + 1}/{attempts}): {error}")
                    if not allow_retry:
                        self.force_terminate()
                        break
                    try:
                        self._restart_locked(deadline)
                    except Exception as restart_error:
                        Log.error(f"Nao foi possivel reiniciar Komodo: {restart_error}")
            return None

    def interrupt(self):
        current = self._engine
        if current is None:
            return
        try:
            current.protocol.send_line("stop")
        except Exception:
            pass

    def force_terminate(self, restart_reason="engine_failure"):
        current = self._engine
        self._engine = None
        self._ready = False
        self._generation += 1
        engine_telemetry.record_restart(restart_reason)
        engine_telemetry.set_engine_status("degraded")
        if current is None:
            return
        try:
            current.transport.kill()
        except Exception:
            try:
                current.close()
            except Exception:
                pass

    def close(self):
        with self._lock:
            current = self._engine
            self._engine = None
            self._ready = False
            engine_telemetry.set_engine_status("degraded")
            if current is not None:
                try:
                    current.close()
                except Exception:
                    pass


cleanup_stale_komodo(ENGINE_PATH)
komodo = KomodoSingleton(ENGINE_PATH)
atexit.register(komodo.close)
stockfish_eval_bar = StockfishEvalBarService()

def get_base_fen(fen):
    return " ".join(fen.split(" ")[:4])

def stop_ponder():
    return None


def initialize_engine():
    if komodo.ready:
        return
    Log.engine("Iniciando Komodo 14.1...")
    Log.engine("Warmup da engine...")
    warmup_board = chess.Board()
    if komodo.play(warmup_board, chess.engine.Limit(depth=10), 20) is None:
        raise RuntimeError("Komodo falhou durante o warmup")
    Log.success("Komodo ONLINE!", data={"Threads": 1, "Hash": "128MB", "Skill": 20})
    Log.success("Warmup completo!")

engine_adapter = KomodoEngineAdapter(komodo, telemetry=engine_telemetry)
engine_coordinator = EngineCoordinator(engine_adapter, telemetry=engine_telemetry)
engine_telemetry.set_engine_status("degraded")


def build_rollout_policy():
    raw_mode = os.environ.get("THINKER_ELO_CALIBRATION_MODE", "").strip().casefold()
    try:
        mode = CalibrationMode(raw_mode) if raw_mode else CalibrationMode.ACTIVE
        raw_percent = os.environ.get("THINKER_ELO_CALIBRATION_CANARY_PERCENT", "0").strip()
        percent = Decimal(raw_percent or "0")
        if not percent.is_finite() or percent < 0 or percent > 100:
            raise ValueError("canary percent must be between 0 and 100")
        basis_points = int(percent * 100)
        if percent != Decimal(basis_points) / 100:
            raise ValueError("canary percent supports at most two decimal places")
        explicit_keys = frozenset(
            key.strip()
            for key in os.environ.get("THINKER_ELO_CALIBRATION_CANARY_KEYS", "").split(",")
            if key.strip()
        )
        return RolloutPolicy(mode, basis_points, explicit_keys)
    except (InvalidOperation, ValueError):
        engine_telemetry.record_failure("configuration")
        return RolloutPolicy(CalibrationMode.SHADOW)


def build_calibration_runtime():
    rollout_policy = build_rollout_policy()
    mode = rollout_policy.mode
    default_artifact_path = Path(__file__).resolve().parent / "benchmark-runs" / "official-v1" / "stage3" / "calibration-artifact.json"
    artifact_path = os.environ.get("THINKER_ELO_CALIBRATION_ARTIFACT", "").strip() or str(default_artifact_path)
    if not artifact_path:
        return CalibrationRuntime(
            None,
            mode=mode,
            rollout_policy=rollout_policy,
            telemetry=engine_telemetry,
            active_game_predicate=engine_coordinator.is_game_active,
        )
    try:
        digest = hashlib.sha256(Path(ENGINE_PATH).read_bytes()).hexdigest()
        calibrator = EloCalibrator(load_artifact(artifact_path), digest)
        komodo.expected_binary_sha256 = digest
        payload = calibrator.artifact.payload
        engine_telemetry.set_artifact(
            version=payload.artifact_version,
            scale_id=payload.scale.scale_id,
            budget_class=payload.search_policy.budget_class,
        )
        return CalibrationRuntime(
            calibrator,
            mode=mode,
            default_scale_id=os.environ.get("THINKER_ELO_SCALE_ID") or payload.scale.scale_id,
            budget_class=os.environ.get("THINKER_ELO_BUDGET_CLASS") or payload.search_policy.budget_class,
            rollout_policy=rollout_policy,
            telemetry=engine_telemetry,
            active_game_predicate=engine_coordinator.is_game_active,
        )
    except Exception as error:
        engine_telemetry.record_failure("invalid_artifact")
        Log.warning(f"Calibracao Elo V2 indisponivel: {type(error).__name__}")
        return CalibrationRuntime(
            None,
            mode=mode,
            unavailable_reason=f"CALIBRATION_{type(error).__name__.upper()}",
            rollout_policy=rollout_policy,
            telemetry=engine_telemetry,
            active_game_predicate=engine_coordinator.is_game_active,
        )


calibration_runtime = build_calibration_runtime()


def build_rating_scale_translator():
    try:
        return RatingScaleTranslator.from_path(os.environ.get("THINKER_RATING_SCALE_MAPPING_ARTIFACT", "").strip())
    except Exception as error:
        engine_telemetry.record_failure("invalid_artifact")
        Log.warning(f"Mapeamento de escala indisponivel: {type(error).__name__}")
        return RatingScaleTranslator()


rating_scale_translator = build_rating_scale_translator()
calibration_capability_service = CalibrationCapabilityService(calibration_runtime, rating_scale_translator)

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


move_plan_service = MovePlanService(
    engine_coordinator,
    book_lookup=get_book,
    calibration=calibration_runtime,
    telemetry=engine_telemetry,
    capability_service=calibration_capability_service,
)
move_plan_idempotency_store = MovePlanIdempotencyStore(
    os.environ.get("THINKER_MOVE_PLAN_IDEMPOTENCY_DB", str(Path(__file__).with_name("move_plan_idempotency.db")))
)
_legacy_job_ids = itertools.count(1)


def _legacy_search(operation):
    started = time.monotonic()
    try:
        result = operation()
    except Exception as error:
        status = "timeout" if isinstance(error, TimeoutError) else "error"
        engine_telemetry.record_search(
            slot="0",
            stage="legacy",
            status=status,
            duration_seconds=max(0.0, time.monotonic() - started),
        )
        if isinstance(error, TimeoutError):
            engine_telemetry.record_timeout("legacy")
        else:
            engine_telemetry.record_failure("search")
        raise
    error = komodo.last_search_error
    stats = komodo.last_search_stats
    status = "timeout" if isinstance(error, TimeoutError) else "error" if error or result is None else "ok"
    engine_telemetry.record_search(
        slot="0",
        stage="legacy",
        status=status,
        duration_seconds=max(0.0, time.monotonic() - started),
        nodes=stats.get("nodes"),
        engine_seconds=stats.get("time"),
    )
    if isinstance(error, TimeoutError):
        engine_telemetry.record_timeout("legacy")
    elif error is not None:
        engine_telemetry.record_failure("search")
    return result


def play_with_recovery(board, skill_level, limit):
    budget_ms = max(250, int(((limit.time or 0.2) + 1.0) * 1000))
    result = engine_coordinator.run(
        EngineJob(request_id=f"legacy-play-{next(_legacy_job_ids)}", kind="legacy-play"),
        budget_ms,
        lambda adapter, _deadline, token: (
            token.raise_if_cancelled(),
            _legacy_search(lambda: adapter.komodo.play(board, limit, skill_level)),
        )[1],
    )
    return result.value


def analyse_with_recovery(board, limit, **kwargs):
    budget_ms = max(250, int(((limit.time or 1.0) + 1.0) * 1000))
    result = engine_coordinator.run(
        EngineJob(request_id=f"legacy-analysis-{next(_legacy_job_ids)}", kind="legacy-analysis"),
        budget_ms,
        lambda adapter, _deadline, token: (
            token.raise_if_cancelled(),
            _legacy_search(lambda: adapter.komodo.analyse(board, limit, **kwargs)),
        )[1],
    )
    return result.value


def score_to_cp(info, turn):
    score = info.get("score")
    if score is None:
        return None, False
    relative = score.pov(turn)
    return relative.score(mate_score=100_000), relative.is_mate()


def calculate_complexity(lines, turn):
    if not lines:
        return 1.0, False
    best_cp, best_is_mate = score_to_cp(lines[0], turn)
    if best_is_mate:
        return 0.15, True
    if len(lines) < 2:
        return 1.0, False
    second_cp, _ = score_to_cp(lines[1], turn)
    if best_cp is None or second_cp is None:
        return 1.0, False
    delta_cp = abs(best_cp - second_cp)
    if delta_cp > 250:
        return 0.3, False
    if delta_cp < 30:
        return 1.8, False
    return 1.0, False

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
    <div class="row">
      <div><div class="row-label">Ghost Mode</div><div class="row-desc">Hide all menus on Chess.com (stealth)</div></div>
      <label class="toggle"><input type="checkbox" id="ghostMode"><span class="slider"></span></label>
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
    color: document.getElementById('colorPicker').value,
    ghostMode: document.getElementById('ghostMode').checked
  };
}
let _fromServer = false;
function applyToUI(s) {
  _fromServer = true;
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
  document.getElementById('ghostMode').checked = s.ghostMode;
  _fromServer = false;
}
async function saveConfig() {
  if (_fromServer) return;
  const cfg = getConfig();
  try {
    const r = await fetch(API + '/config/save', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(cfg)
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
document.getElementById('ghostMode').addEventListener('change', saveConfig);
document.getElementById('applyBtn').addEventListener('click', saveConfig);
document.getElementById('refreshBtn').addEventListener('click', loadConfig);
let _lastPanelConfig = '';
async function pollConfig() {
  try {
    const r = await fetch(API + '/config/load');
    if (r.ok) {
      const s = await r.json();
      const key = JSON.stringify(s);
      if (key !== _lastPanelConfig) {
        _lastPanelConfig = key;
        applyToUI(s);
        setConnected(true);
      }
    }
  } catch(e) {}
}
pollConfig();
setInterval(pollConfig, 2000);
</script>
</body>
</html>"""

# --- External Config Panel API ---
_external_config = {
    "hint": False, "autoMove": False, "autoQueue": False,
    "autoAdjust": False, "evalBar": False, "smartPacing": False,
    "elo": 1500, "delayMode": "random", "minDelay": 0.5, "maxDelay": 2.0,
    "color": "#10B981", "ghostMode": False
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


def resolve_getmove_engine_parameters(elo, time_limit, board, runtime_game_token=None):
    calibrator = calibration_runtime.calibrator
    if calibration_runtime.mode is CalibrationMode.ACTIVE and calibrator is not None:
        payload = calibrator.artifact.payload
        minimum_elo = ceil(float(payload.anchors[0].rating))
        maximum_elo = floor(float(payload.anchors[-1].rating))
        target_elo = max(minimum_elo, min(maximum_elo, elo))
        token = runtime_game_token if isinstance(runtime_game_token, str) and runtime_game_token.strip() else "legacy-getmove"
        profile = calibrator.interpolate_uci_params(
            CalibrationRequest(
                target_elo=target_elo,
                scale_id=payload.scale.scale_id,
                budget_class=payload.search_policy.budget_class,
                runtime_game_token=token,
                side=Side.WHITE if board.turn is chess.WHITE else Side.BLACK,
            )
        )
        return profile.applied_skill, profile.move_time_ms / 1000.0
    actual_time = 0.5 if time_limit <= 0 else max(0.05, min(0.5, time_limit))
    return engine_adapter.legacy_skill_for_elo(elo), actual_time

@app.route("/getmove", methods=["POST"])
@app.route("/getMove", methods=["POST"])
@engine_api_auth
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
    try:
        elo = int(data.get("elo", 3200))
        time_limit = float(data.get("time", 0.1))
    except (TypeError, ValueError):
        return jsonify([])
    
    if fen:
        Log.request(fen, elo, time_limit)
    
    if not fen:
        return jsonify([])
    
    try:
        board = chess.Board(fen)
        if not board.is_valid() or board.is_game_over():
            return jsonify([])

        cache_key = f"{get_base_fen(board.fen())}_{elo}"
        cached_move = cache.get(cache_key)
        if cached_move:
            try:
                if chess.Move.from_uci(cached_move) in board.legal_moves:
                    elapsed = (time.perf_counter() - start_time) * 1000
                    Log.move("[CACHE]", cached_move, elapsed)
                    return jsonify([cached_move])
            except (ValueError, TypeError):
                pass
            cache.pop(cache_key, None)
        
        book_move = get_book(fen)
        try:
            legal_book_move = book_move and chess.Move.from_uci(book_move) in board.legal_moves
        except (ValueError, TypeError):
            legal_book_move = False
        if legal_book_move:
            cache[cache_key] = book_move
            elapsed = (time.perf_counter() - start_time) * 1000
            Log.move("[BOOK]", book_move, elapsed)
            return jsonify([book_move])
        
        runtime_game_token = data.get("runtimeGameToken") or data.get("gameId")
        skill_level, actual_time = resolve_getmove_engine_parameters(
            elo,
            time_limit,
            board,
            runtime_game_token,
        )
        limit = chess.engine.Limit(time=actual_time)
            
        move_obj = play_with_recovery(board, skill_level, limit)
        
        if move_obj:
            move = move_obj.uci()
            cache[cache_key] = move
            
            elapsed = (time.perf_counter() - start_time) * 1000
            Log.move("[ENGINE]", move, elapsed, extra=f"tempo: {actual_time}s")
            return jsonify([move])
        
        return jsonify([])
    except Exception as e:
        Log.error(f"Erro no getmove: {e}")
        return jsonify([])

@app.route("/eval", methods=["POST"])
@engine_api_auth
def evaluate():
    correlation = {}

    def eval_response(cp, mate, depth=0, error=None):
        payload = {"cp": cp, "mate": mate, "depth": depth, **correlation}
        if error:
            payload["error"] = error
        return jsonify(payload)

    try:
        data = request.get_json(force=True, silent=True)
        if not data:
            import json
            data = json.loads(request.data)
        if not isinstance(data, dict):
            return eval_response(0, None, error="JSON object required")

        correlation = {
            key: data[key]
            for key in ("requestId", "generation", "cacheContext")
            if key in data
        }

        fen = data.get("fen", "")
        if not fen:
            return eval_response(0, None, error="fen is required")

        try:
            board = chess.Board(fen)
        except (TypeError, ValueError):
            return eval_response(0, None, error="invalid fen")
        if not board.is_valid():
            return eval_response(0, None, error="invalid fen")
        if board.is_game_over():
            return eval_response(0, None)
        lines = analyse_with_recovery(board, chess.engine.Limit(time=0.05))
        if not lines:
            return eval_response(0, None, error="engine returned no analysis")
        info = lines[0]
        
        score = info.get("score")
        if score:
            # Pegar o score do ponto de vista das brancas
            white_score = score.white()
            
            if white_score.is_mate():
                return eval_response(None, white_score.mate(), info.get("depth", 0))
            else:
                cp = white_score.score()
                if cp is None:
                    return eval_response(0, None, error="engine score unavailable")
                return eval_response(cp, None, info.get("depth", 0))
                
        return eval_response(0, None, error="engine score missing")
    except Exception as e:
        Log.error(f"Erro no eval: {e}")
        return eval_response(0, None, error="evaluation failed")


@app.route("/eval-bar", methods=["POST"])
@eval_bar_api_auth
def evaluate_eval_bar():
    data = request.get_json(force=True, silent=True)
    if not isinstance(data, dict):
        return jsonify({"error": "JSON object required"}), 400
    request_id = str(data.get("requestId") or f"eval-bar:{time.monotonic_ns()}")
    correlation = {"requestId": request_id}
    correlation.update({key: data[key] for key in ("generation", "cacheContext") if key in data})
    context = data.get("context")
    if context not in {"analysis", "post-game"}:
        return jsonify({"error": "eval_bar_context_not_authorized", **correlation}), 403
    fen = data.get("fen")
    if not isinstance(fen, str) or not fen.strip():
        return jsonify({"error": "fen is required", **correlation}), 400
    try:
        board = chess.Board(fen)
    except (TypeError, ValueError):
        return jsonify({"error": "invalid fen", **correlation}), 400
    if not board.is_valid():
        return jsonify({"error": "invalid fen", **correlation}), 422
    if board.is_game_over():
        return jsonify({"error": "terminal position", **correlation}), 422
    try:
        result = stockfish_eval_bar.evaluate(fen, request_id)
        return jsonify({**result, **correlation})
    except StockfishEvalBarCancelled:
        return jsonify({"error": "evaluation superseded", **correlation}), 409
    except StockfishEvalBarTimeout:
        return jsonify({"error": "stockfish timeout", **correlation}), 504
    except StockfishEvalBarError as error:
        Log.error(f"Erro no Stockfish Eval Bar: {error}")
        return jsonify({"error": "stockfish unavailable", "detail": str(error), **correlation}), 503


@app.route("/eval-bar/cancel", methods=["POST"])
@eval_bar_control_auth
def cancel_eval_bar():
    data = request.get_json(force=True, silent=True)
    if not isinstance(data, dict) or not data.get("requestId"):
        return jsonify({"error": "requestId is required"}), 400
    request_id = str(data["requestId"])
    return jsonify({"requestId": request_id, "cancelRequested": stockfish_eval_bar.cancel(request_id)})


@app.route("/eval-bar/status", methods=["GET"])
@eval_bar_control_auth
def eval_bar_status():
    return jsonify(stockfish_eval_bar.status())


@app.route("/analyze", methods=["POST"])
@engine_api_auth
def analyze_position():
    data = request.get_json(silent=True)
    if data is None:
        data = {}
    if not isinstance(data, dict):
        return jsonify({"error": "invalid json object"}), 400
    fen = data.get("fen")
    if not isinstance(fen, str) or not fen.strip():
        return jsonify({"error": "fen is required"}), 400
    try:
        board = chess.Board(fen)
    except ValueError:
        return jsonify({"error": "invalid fen"}), 400
    if not board.is_valid():
        return jsonify({"error": "invalid position"}), 422
    legal_moves = list(board.legal_moves)
    if not legal_moves:
        return jsonify({"error": "terminal position"}), 422
    if len(legal_moves) == 1:
        return jsonify({
            "move": legal_moves[0].uci(),
            "complexityMultiplier": 0.15,
            "isForced": True,
        })
    lines = analyse_with_recovery(
        board,
        chess.engine.Limit(depth=ANALYSIS_DEPTH),
        multipv=2,
        clear_hash=True,
    )
    if not lines:
        return jsonify({"error": "engine unavailable"}), 503
    usable_lines = [
        line for line in lines
        if line.get("pv") and line["pv"][0] in board.legal_moves
    ]
    if not usable_lines:
        return jsonify({"error": "engine returned no legal line"}), 503
    multiplier, is_forced = calculate_complexity(usable_lines, board.turn)
    return jsonify({
        "move": usable_lines[0]["pv"][0].uci(),
        "complexityMultiplier": multiplier,
        "isForced": is_forced,
    })


@app.route("/calibration-readiness", methods=["POST"])
@engine_api_auth
def calibration_readiness():
    try:
        return jsonify(calibration_capability_service.readiness(request.get_json(silent=True)))
    except CalibrationCapabilityError as error:
        return jsonify({"error": error.code}), error.status


@app.route("/calibration-status", methods=["GET"])
@engine_api_auth
def calibration_status():
    return jsonify(calibration_capability_service.deployment_status())


@app.route("/calibration-capability", methods=["POST"])
@engine_api_auth
def calibration_capability():
    try:
        return jsonify(calibration_capability_service.pin(request.get_json(silent=True)))
    except CalibrationCapabilityError as error:
        return jsonify({"error": error.code}), error.status


@app.route("/move-plan", methods=["POST"])
@engine_api_auth
def move_plan():
    claim = None
    move_plan_request = None
    try:
        raw_payload = request.get_json(silent=True)
        move_plan_request = MovePlanRequest.from_payload(raw_payload)
        move_plan_service.validate_request(move_plan_request)
        capability_expiry = calibration_capability_service.expiry_for(move_plan_request.runtime_game_token)
        retention_expiry = (capability_expiry or int(time.time() * 1000)) + 86_400_000
        claim = move_plan_idempotency_store.claim(
            move_plan_request.runtime_game_token,
            move_plan_request.request_id,
            raw_payload,
            retention_expiry,
        )
        if claim["status"] == "conflict":
            return jsonify({"error": "REQUEST_ID_CONFLICT"}), 409
        if claim["status"] == "pending":
            response = jsonify({"error": "REQUEST_IN_PROGRESS"})
            response.status_code = 202
            response.headers["Retry-After"] = "1"
            return response
        if claim["status"] == "indeterminate":
            return jsonify({"error": "REQUEST_OUTCOME_INDETERMINATE"}), 503
        if claim["status"] == "capacity":
            return jsonify({"error": "IDEMPOTENCY_CAPACITY"}), 503
        if claim["status"] == "complete":
            return Response(claim["response"], status=200, mimetype="application/json")
        plan = move_plan_service.create_plan(move_plan_request)
        encoded = json.dumps(plan, ensure_ascii=True, separators=(",", ":"), sort_keys=True).encode("utf-8")
        move_plan_idempotency_store.complete(
            move_plan_request.runtime_game_token,
            move_plan_request.request_id,
            claim["owner"],
            encoded,
        )
        return Response(encoded, status=200, mimetype="application/json")
    except ContractValidationError as error:
        if claim and claim.get("status") == "claimed" and move_plan_request is not None:
            move_plan_idempotency_store.mark_indeterminate(move_plan_request.runtime_game_token, move_plan_request.request_id, claim["owner"])
        return jsonify(error.to_payload()), 400
    except CalibrationCapabilityError as error:
        if claim and claim.get("status") == "claimed" and move_plan_request is not None:
            move_plan_idempotency_store.mark_indeterminate(move_plan_request.runtime_game_token, move_plan_request.request_id, claim["owner"])
        return jsonify({"error": error.code}), error.status
    except CoordinatorDeadlineExceeded:
        if claim and claim.get("status") == "claimed":
            move_plan_idempotency_store.mark_indeterminate(move_plan_request.runtime_game_token, move_plan_request.request_id, claim["owner"])
        return jsonify({"error": "engine_deadline_exceeded"}), 503
    except Exception as error:
        if claim and claim.get("status") == "claimed" and move_plan_request is not None:
            move_plan_idempotency_store.mark_indeterminate(move_plan_request.runtime_game_token, move_plan_request.request_id, claim["owner"])
        Log.error(f"Erro no move-plan: {error}")
        return jsonify({"error": "move_plan_unavailable"}), 503


@app.route("/move-plan/release", methods=["POST"])
@engine_api_auth
def release_move_plan_game():
    payload = request.get_json(silent=True)
    token = payload.get("runtimeGameToken") if isinstance(payload, dict) else None
    if not isinstance(token, str) or not token.strip() or len(token) > 128:
        return jsonify({"error": "invalid_runtime_game_token"}), 400
    token = token.strip()
    engine_coordinator.release_game(token)
    calibration_runtime.release_game(token)
    return "", 204

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
    return jsonify({
        "status": "ok" if engine_coordinator.ready else "degraded",
        "ready": engine_coordinator.ready,
        "engineGeneration": engine_coordinator.generation,
        "cache": len(cache),
    })


@app.route("/metrics", methods=["GET"])
@metrics_auth
def metrics():
    return Response(engine_telemetry.render(), content_type=engine_telemetry.content_type)

def print_pairing_instructions():
    capability = capability_store.ensure()
    print("=" * 72)
    print("COLE ESTE TOKEN NO SEU SCRIPT:")
    print(capability)
    if os.environ.get("THINKER_CAPABILITY_TOKEN"):
        print("Token carregado de THINKER_CAPABILITY_TOKEN")
    else:
        print(f"Token salvo em: {capability_store.path}")
    print("=" * 72)
    return capability


if __name__ == "__main__":
    print_pairing_instructions()
    initialize_engine()
    Log.banner()
    Log.success("Rodando em http://127.0.0.1:5050")
    app.run(host="127.0.0.1", port=5050, debug=False, threaded=True)
