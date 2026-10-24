import atexit
import json
import os
import queue
import subprocess
import threading
import time
from pathlib import Path


class StockfishEvalBarError(RuntimeError):
    pass


class StockfishEvalBarTimeout(StockfishEvalBarError):
    pass


class StockfishEvalBarCancelled(StockfishEvalBarError):
    pass


class _PendingRequest:
    def __init__(self, process=None, generation=0):
        self.event = threading.Event()
        self.result = None
        self.error = None
        self.process = process
        self.generation = generation
        self.condition = threading.Condition()
        self.latest_info = None
        self.terminal = None

    def publish_info(self, message):
        with self.condition:
            if self.terminal is None:
                self.latest_info = message
                self.condition.notify()

    def publish_terminal(self, message, *, result=None, error=None):
        with self.condition:
            if self.terminal is not None or self.event.is_set():
                return False
            self.result = result
            self.error = error
            self.terminal = message
            self.event.set()
            self.condition.notify_all()
            return True

    def next_message(self, timeout):
        deadline = time.monotonic() + timeout
        with self.condition:
            while self.latest_info is None and self.terminal is None:
                remaining = deadline - time.monotonic()
                if remaining <= 0:
                    raise queue.Empty
                self.condition.wait(remaining)
            if self.latest_info is not None:
                message = self.latest_info
                self.latest_info = None
                return message
            message = self.terminal
            self.terminal = None
            return message


class StockfishEvalBarService:
    ENGINE = "Stockfish 19"
    BUILD = "sf_19_smallnet"
    NETWORK = "nn-61e7af4bb97d.nnue"
    NETWORK_SHA256 = "61e7af4bb97d51eeeb25d322916f86513b5cd3a827ce189c98c6e31946f99e5b"
    PROFILE = "threads-3_hash-16_multipv-1_analysemode_movetime-8000"

    def __init__(self, root=None, node_path=None, timeout_seconds=20.0, build="sf_19_smallnet"):
        if build not in {"sf_19_smallnet", "sf_19"}:
            raise ValueError("unsupported Stockfish build")
        self.BUILD = build
        if build == "sf_19":
            self.NETWORK = "nn-1a298aa575a0.nnue"
            self.NETWORK_SHA256 = "1a298aa575a085434d29027978dc36867fe9c5bcea9376654b7a8eba1e52dfc2"
        self.root = Path(root or Path(__file__).resolve().parents[2])
        self.node_path = node_path or os.environ.get("THINKER_NODE_PATH", "node")
        self.timeout_seconds = float(timeout_seconds)
        self.script = self.root / "analysis_lab" / "scripts" / "stockfish-eval-bar-service.mjs"
        self.engine_root = self.root / "analysis_lab" / "node_modules" / "@lichess-org" / "stockfish-web"
        self.network_path = self.root / "analysis_lab" / "public" / "engine" / self.NETWORK
        if build == "sf_19":
            self.engine_root = self.root / "analysis_lab" / "node_modules" / "@lichess-org" / "stockfish-web"
            self.network_path = self.root / "analysis_lab" / self.NETWORK
        self._lock = threading.RLock()
        self._write_lock = threading.Lock()
        self._process = None
        self._reader = None
        self._stderr_reader = None
        self._ready = threading.Event()
        self._startup_error = None
        self._identity = None
        self._pending = {}
        self._stderr_tail = []
        self._generation = 0
        self._closed = False
        atexit.register(self.close)

    @property
    def generation(self):
        with self._lock:
            return self._generation

    @property
    def pid(self):
        with self._lock:
            return self._process.pid if self._process and self._process.poll() is None else None

    def start(self, timeout_seconds=None):
        self._ensure_started(float(timeout_seconds or self.timeout_seconds))
        return self.status()

    def status(self):
        with self._lock:
            process = self._process
            return {
                "ready": bool(process and process.poll() is None and self._ready.is_set() and not self._startup_error),
                "pid": process.pid if process and process.poll() is None else None,
                "generation": self._generation,
                "engine": self.ENGINE,
                "build": self.BUILD,
                "network": self.NETWORK,
                "networkSha256": self.NETWORK_SHA256,
                "profile": self.PROFILE,
                "identity": self._identity,
                "stderr": list(self._stderr_tail[-10:]),
            }

    def evaluate(self, fen, request_id, movetime_ms=8000, timeout_seconds=None):
        request_id = str(request_id)
        deadline_at = time.monotonic() + float(timeout_seconds or self.timeout_seconds)
        for attempt in range(2):
            remaining = deadline_at - time.monotonic()
            if remaining <= 0:
                raise StockfishEvalBarTimeout("Stockfish evaluation timed out")
            try:
                self._ensure_started(remaining)
            except StockfishEvalBarError:
                if attempt == 0 and time.monotonic() < deadline_at:
                    continue
                raise
            with self._lock:
                process = self._process
                generation = self._generation
                pending = _PendingRequest(process, generation)
                if request_id in self._pending:
                    raise StockfishEvalBarError("duplicate request id")
                self._pending[request_id] = pending
            try:
                try:
                    self._send(
                        {"type": "evaluate", "requestId": request_id, "fen": fen, "movetime": int(movetime_ms)},
                        expected_process=process,
                    )
                except StockfishEvalBarError:
                    if attempt == 0 and time.monotonic() < deadline_at:
                        self._restart(process)
                        continue
                    raise
                remaining = deadline_at - time.monotonic()
                if remaining <= 0 or not pending.event.wait(remaining):
                    self.cancel(request_id)
                    self._restart(process)
                    raise StockfishEvalBarTimeout("Stockfish evaluation timed out")
                if pending.error:
                    if pending.error == "cancelled":
                        raise StockfishEvalBarCancelled("Stockfish evaluation was superseded")
                    if pending.error == "process-exited" and attempt == 0 and time.monotonic() < deadline_at:
                        self._restart(process)
                        continue
                    raise StockfishEvalBarError(pending.error)
                return pending.result
            finally:
                with self._lock:
                    self._pending.pop(request_id, None)
        raise StockfishEvalBarError("Stockfish evaluation failed after restart")

    def evaluate_stream(self, fen, request_id, movetime_ms=8000, timeout_seconds=None):
        request_id = str(request_id)
        deadline_at = time.monotonic() + float(timeout_seconds or self.timeout_seconds)
        emitted_info = False
        for attempt in range(2):
            remaining = deadline_at - time.monotonic()
            if remaining <= 0:
                raise StockfishEvalBarTimeout("Stockfish evaluation timed out")
            try:
                self._ensure_started(remaining)
            except StockfishEvalBarError:
                if attempt == 0 and time.monotonic() < deadline_at:
                    continue
                raise
            with self._lock:
                process = self._process
                generation = self._generation
                pending = _PendingRequest(process, generation)
                if request_id in self._pending:
                    raise StockfishEvalBarError("duplicate request id")
                self._pending[request_id] = pending
            try:
                try:
                    self._send(
                        {"type": "evaluate", "requestId": request_id, "fen": fen, "movetime": int(movetime_ms)},
                        expected_process=process,
                    )
                except StockfishEvalBarError:
                    if attempt == 0 and time.monotonic() < deadline_at:
                        self._restart(process)
                        continue
                    raise
                yield {
                    "type": "started",
                    "requestId": request_id,
                    "attempt": attempt + 1,
                    "engineGeneration": generation,
                    "seq": 0,
                }
                while True:
                    remaining = deadline_at - time.monotonic()
                    if remaining <= 0:
                        raise queue.Empty
                    try:
                        message = pending.next_message(remaining)
                    except queue.Empty:
                        self.cancel(request_id)
                        self._restart(process)
                        raise StockfishEvalBarTimeout("Stockfish evaluation timed out")
                    message_type = message.get("type")
                    if message_type == "info":
                        emitted_info = True
                        yield {
                            **message,
                            "attempt": attempt + 1,
                            "engineGeneration": generation,
                        }
                        continue
                    if message_type == "result":
                        yield {
                            **message,
                            "attempt": attempt + 1,
                            "engineGeneration": generation,
                        }
                        return
                    if message_type == "cancelled":
                        raise StockfishEvalBarCancelled("Stockfish evaluation was superseded")
                    error = str(message.get("error") or "Stockfish evaluation failed")
                    if error == "process-exited" and attempt == 0 and not emitted_info and time.monotonic() < deadline_at:
                        self._restart(process)
                        break
                    raise StockfishEvalBarError(error)
            except GeneratorExit:
                self.cancel(request_id)
                raise
            finally:
                with self._lock:
                    if self._pending.get(request_id) is pending:
                        self._pending.pop(request_id, None)
        raise StockfishEvalBarError("Stockfish evaluation failed after restart")

    def cancel(self, request_id):
        with self._lock:
            process = self._process
        if process and process.poll() is None:
            try:
                self._send({"type": "cancel", "requestId": request_id})
                return True
            except StockfishEvalBarError:
                return False
        return False

    def close(self):
        with self._lock:
            if self._closed:
                return
            self._closed = True
            process = self._process
        if process and process.poll() is None:
            try:
                self._send({"type": "shutdown"})
                process.wait(timeout=3)
            except Exception:
                process.kill()
        self._close_pipes(process)
        self._fail_all("process-exited")
        with self._lock:
            self._process = None
            self._ready.clear()

    def _ensure_started(self, timeout_seconds):
        process = None
        startup_error = None
        with self._lock:
            if self._closed:
                raise StockfishEvalBarError("Stockfish service is closed")
            if self._process and self._process.poll() is None:
                startup_error = self._startup_error
                if self._ready.is_set() and not startup_error:
                    return
                process = self._process
            else:
                self._close_pipes(self._process)
                if not self.script.exists():
                    raise StockfishEvalBarError(f"Stockfish sidecar is missing: {self.script}")
                self._ready.clear()
                self._startup_error = None
                self._identity = None
                try:
                    self._process = subprocess.Popen(
                        [self.node_path, str(self.script), "--engine-root", str(self.engine_root),
                         "--build", self.BUILD, "--network-path", str(self.network_path)],
                        cwd=str(self.root),
                        stdin=subprocess.PIPE,
                        stdout=subprocess.PIPE,
                        stderr=subprocess.PIPE,
                        text=True,
                        encoding="utf-8",
                        errors="replace",
                        bufsize=1,
                        creationflags=subprocess.CREATE_NO_WINDOW if os.name == "nt" else 0,
                    )
                except OSError as error:
                    self._process = None
                    raise StockfishEvalBarError(f"Stockfish sidecar failed to start: {error}") from error
                self._generation += 1
                process = self._process
                self._reader = threading.Thread(target=self._read_stdout, args=(process,), daemon=True)
                self._stderr_reader = threading.Thread(target=self._read_stderr, args=(process,), daemon=True)
                self._reader.start()
                self._stderr_reader.start()
        if startup_error:
            self._terminate_process(process)
            with self._lock:
                if self._process is process:
                    self._process = None
                    self._ready.clear()
            raise StockfishEvalBarError(startup_error)
        if not self._ready.wait(timeout_seconds):
            detail = self._startup_error or "Stockfish startup timed out"
            self._terminate_process(process)
            raise StockfishEvalBarError(detail)
        if self._startup_error:
            raise StockfishEvalBarError(self._startup_error)

    def _restart(self, expected_process=None):
        with self._lock:
            process = self._process
            if expected_process is not None and process is not expected_process:
                return False
            self._process = None
            self._ready.clear()
        self._fail_process(process, "process-exited")
        self._terminate_process(process)
        return True

    def _terminate_process(self, process):
        if not process:
            return
        if process.poll() is None:
            try:
                process.kill()
                process.wait(timeout=3)
            except Exception:
                pass
        self._close_pipes(process)

    def _close_pipes(self, process):
        if not process:
            return
        for stream in (process.stdin, process.stdout, process.stderr):
            try:
                stream.close()
            except Exception:
                pass

    def _send(self, payload, expected_process=None):
        encoded = json.dumps(payload, separators=(",", ":")) + "\n"
        with self._write_lock:
            with self._lock:
                process = self._process
            if expected_process is not None and process is not expected_process:
                raise StockfishEvalBarError("Stockfish sidecar generation changed")
            if not process or process.poll() is not None or not process.stdin:
                raise StockfishEvalBarError("Stockfish sidecar is unavailable")
            try:
                process.stdin.write(encoded)
                process.stdin.flush()
            except (BrokenPipeError, OSError) as error:
                raise StockfishEvalBarError("Stockfish sidecar pipe failed") from error

    def _read_stdout(self, process):
        try:
            for line in process.stdout:
                try:
                    message = json.loads(line)
                except (TypeError, ValueError):
                    continue
                message_type = message.get("type")
                if message_type == "ready":
                    with self._lock:
                        if self._process is not process:
                            continue
                        self._identity = message
                        self._ready.set()
                elif message_type == "fatal":
                    with self._lock:
                        if self._process is not process:
                            continue
                        self._startup_error = str(message.get("error") or "Stockfish startup failed")
                        self._ready.set()
                    self._fail_process(process, "process-exited")
                    self._terminate_process(process)
                    break
                elif message_type in {"info", "result", "cancelled", "error"}:
                    request_id = str(message.get("requestId", ""))
                    with self._lock:
                        pending = self._pending.get(request_id)
                    if not pending or pending.process is not process:
                        continue
                    if message_type == "info":
                        pending.publish_info(message)
                        continue
                    if message_type == "result":
                        pending.publish_terminal(message, result=message.get("result"))
                    elif message_type == "cancelled":
                        pending.publish_terminal(message, error="cancelled")
                    else:
                        pending.publish_terminal(
                            message,
                            error=str(message.get("error") or "Stockfish evaluation failed"),
                        )
        finally:
            if process.poll() is None:
                process.wait()
            with self._lock:
                is_current = self._process is process
            if not is_current:
                return
            if not self._ready.is_set():
                self._startup_error = self._startup_error or "Stockfish sidecar exited during startup"
                self._ready.set()
            self._fail_process(process, "process-exited")

    def _read_stderr(self, process):
        for line in process.stderr:
            text = line.strip()
            if not text:
                continue
            with self._lock:
                self._stderr_tail.append(text)
                del self._stderr_tail[:-50]

    def _fail_all(self, reason):
        with self._lock:
            pending = list(self._pending.values())
        for item in pending:
            item.publish_terminal({"type": "error", "error": reason}, error=reason)

    def _fail_process(self, process, reason):
        with self._lock:
            pending = [item for item in self._pending.values() if item.process is process]
        for item in pending:
            item.publish_terminal({"type": "error", "error": reason}, error=reason)
