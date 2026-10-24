import atexit
import asyncio
import concurrent.futures
import json
import os
import threading
import time
from pathlib import Path

import chess
import chess.engine
import psutil

from .stockfish_service import StockfishEvalBarService, StockfishEvalBarError, StockfishEvalBarCancelled, StockfishEvalBarTimeout

ENGINE_IDS = ('stockfish-19-1mb', 'stockfish-19-94mb', 'komodo-14.1')
NAMES = ('Stockfish 19 · 1MB', 'Stockfish 19 · 94MB', 'Komodo 14.1')
DESCRIPTIONS = (
    'Fast Analysis · Lichess Stockfish with a 1.11 MiB NNUE network.',
    'Deep Analysis · Lichess Stockfish with a 93.95 MiB NNUE network.',
    'Classic UCI · Native Komodo 14.1 with streaming position analysis.',
)


class NativeAnalysisService:
    def __init__(self, executable):
        self.executable = str(executable)
        self._engine = None
        self._analysis = {}
        self._pending = {}
        self._lock = threading.RLock()
        self._closed = False
        self._proof = None
        self._configuration = {}
        self._name = "Komodo 14.1"

    @property
    def pid(self):
        with self._lock:
            return self._engine.transport.get_pid() if self._engine else None

    def start(self):
        with self._lock:
            if self._closed:
                raise StockfishEvalBarError('Analysis runtime retired')
            if self._engine:
                if self.status()['ready']:
                    return self.status()
                self._engine.close()
                self._engine = None
                self._proof = None
            try:
                self._engine = chess.engine.SimpleEngine.popen_uci(self.executable, timeout=15)
                self._name = self._engine.id.get("name", "Komodo 14.1")
                options = self._engine.options
                self._configuration = {key: value for key, value in {'Threads': 3, 'Hash': 16}.items() if key in options}
                if 'Skill' in options:
                    self._configuration['Skill'] = options['Skill'].max
                if 'Skill Level' in options:
                    self._configuration['Skill Level'] = options['Skill Level'].max
                self._engine.configure(self._configuration)
                proof = self._engine.analyse(chess.Board(), chess.engine.Limit(time=0.08))
                if not proof.get('score') or proof.get('depth', 0) < 1:
                    raise StockfishEvalBarError('Native engine search verification failed')
                self._proof = self._score(proof)
            except Exception as error:
                self.close()
                raise StockfishEvalBarError(str(error)) from error
            return self.status()

    def _score(self, info):
        score = info['score'].white()
        return {'cp': score.score(), 'mate': score.mate(), 'depth': info.get('depth', 0),
                'nodes': info.get('nodes', 0), 'nps': info.get('nps', 0),
                'time': round(info.get('time', 0) * 1000), 'engine': 'Komodo 14.1',
                'engineName': self._name,
                'profile': self._configuration}

    def status(self):
        engine = self._engine
        pid = engine.transport.get_pid() if engine else None
        ready = bool(engine and not engine.returncode.done() and self._proof and not self._closed)
        ready = ready and bool(pid and psutil.pid_exists(pid))
        return {'ready': ready, 'pid': pid if ready else None,
                'identity': {'engineName': self._name,
                             'proof': self._proof, 'profile': self._configuration}, 'profile': self._configuration}

    def evaluate_stream(self, fen, request_id, movetime_ms=8000, timeout_seconds=None):
        self.start()
        with self._lock:
            if self._closed:
                raise StockfishEvalBarCancelled('Analysis runtime retired')
            for previous in self._analysis.values():
                try:
                    previous.stop()
                except chess.engine.EngineError:
                    pass
            self._analysis.clear()
            self._pending.clear()
            token = object()
            self._pending[request_id] = token
            engine = self._engine
        try:
            analysis = engine.analysis(chess.Board(fen), chess.engine.Limit(time=movetime_ms / 1000))
        except (chess.engine.EngineError, TimeoutError) as error:
            with self._lock:
                if self._pending.pop(request_id, None) is not token:
                    raise StockfishEvalBarCancelled('Analysis superseded') from error
                if engine is self._engine:
                    self._engine = None
                    self._proof = None
            engine.close()
            raise StockfishEvalBarError(str(error)) from error
        with self._lock:
            if self._closed or self._pending.pop(request_id, None) is not token or engine is not self._engine:
                try:
                    analysis.stop()
                except chess.engine.EngineError:
                    pass
                raise StockfishEvalBarCancelled('Analysis superseded')
            completion = asyncio.run_coroutine_threadsafe(analysis.inner.wait(), engine.protocol.loop)
            completion.add_done_callback(lambda future: None if future.cancelled() else future.exception())
            self._analysis[request_id] = analysis
        seq, last = 0, None
        deadline = time.monotonic() + float(timeout_seconds or 20)
        try:
            yield {'type': 'started', 'seq': 0}
            while True:
                future = asyncio.run_coroutine_threadsafe(analysis.inner.next(), analysis.simple_engine.protocol.loop)
                try:
                    while True:
                        with self._lock:
                            if self._analysis.get(request_id) is not analysis:
                                raise StockfishEvalBarCancelled('Analysis superseded')
                        remaining = deadline - time.monotonic()
                        if remaining <= 0:
                            with self._lock:
                                if self._analysis.get(request_id) is not analysis:
                                    raise StockfishEvalBarCancelled('Analysis superseded')
                                engine, self._engine = self._engine, None
                                self._proof = None
                            if engine:
                                engine.close()
                            raise StockfishEvalBarTimeout('Native analysis timed out')
                        try:
                            info = future.result(timeout=min(0.05, remaining))
                            break
                        except concurrent.futures.TimeoutError:
                            continue
                finally:
                    if not future.done():
                        future.cancel()
                if info is None:
                    break
                if info.get('score'):
                    seq += 1
                    last = self._score(info)
                    yield {'type': 'info', 'seq': seq, 'result': last}
            with self._lock:
                if self._analysis.get(request_id) is not analysis:
                    raise StockfishEvalBarCancelled('Analysis superseded')
            if last is None:
                raise StockfishEvalBarError('Native engine returned no score')
            yield {'type': 'result', 'seq': seq + 1, 'result': last}
        except chess.engine.EngineError as error:
            raise StockfishEvalBarError(str(error)) from error
        finally:
            try:
                analysis.stop()
            except chess.engine.EngineError:
                pass
            with self._lock:
                self._analysis.pop(request_id, None)

    def cancel(self, request_id):
        with self._lock:
            pending = self._pending.pop(request_id, None)
            analysis = self._analysis.pop(request_id, None)
            if analysis:
                try:
                    analysis.stop()
                except chess.engine.EngineError:
                    pass
            return bool(analysis or pending)

    def close(self):
        with self._lock:
            self._closed = True
            self._pending.clear()
            for analysis in self._analysis.values():
                try:
                    analysis.stop()
                except chess.engine.EngineError:
                    pass
            self._analysis.clear()
            engine, self._engine = self._engine, None
        if engine:
            try:
                engine.timeout = 3
                engine.quit()
            except Exception:
                engine.close()


class EngineRegistry:
    def __init__(self, root, komodo_path, preference_path=None):
        self.root = Path(root)
        self.komodo_path = komodo_path
        self.preference_path = Path(preference_path or self.root / 'analysis-engine-preference.json')
        self._lock = threading.RLock()
        self._switch_lock = threading.Lock()
        self._service = None
        self._active_id = None
        self._preferred = ENGINE_IDS[0]
        self._generation = 0
        self._preference_revision = 0
        self._loading = None
        self._errors = {}
        self._requests = {}
        self._authorization_seen = 0.0
        self._authorization_context = None
        try:
            saved_data = json.loads(self.preference_path.read_text(encoding='utf8'))
            saved = saved_data.get('analysisEngine')
            self._preference_revision = int(saved_data.get('revision', 0))
            if saved in ENGINE_IDS:
                self._preferred = saved
        except (OSError, ValueError, AttributeError):
            pass
        atexit.register(self.close)

    def _create(self, engine_id):
        if engine_id == ENGINE_IDS[2]:
            return NativeAnalysisService(self.komodo_path)
        return StockfishEvalBarService(root=self.root, build='sf_19' if engine_id == ENGINE_IDS[1] else 'sf_19_smallnet')

    def _installed(self, engine_id):
        if engine_id == ENGINE_IDS[2]:
            return bool(self.komodo_path and Path(self.komodo_path).is_file())
        package = self.root / 'analysis_lab' / 'node_modules' / '@lichess-org' / 'stockfish-web'
        build = 'sf_19' if engine_id == ENGINE_IDS[1] else 'sf_19_smallnet'
        net = self.root / 'analysis_lab' / ('nn-1a298aa575a0.nnue' if build == 'sf_19' else 'public/engine/nn-61e7af4bb97d.nnue')
        return all(p.is_file() for p in (package / (build + '.js'), package / (build + '.wasm'), net))

    def authorize_context(self, context):
        with self._lock:
            self._authorization_seen = time.monotonic()
            self._authorization_context = context if context in {'analysis', 'post-game'} else None

    def has_authorized_context(self):
        with self._lock:
            return bool(self._authorization_context and time.monotonic() - self._authorization_seen < 7)

    def snapshot(self):
        with self._lock:
            runtime = self._service.status() if self._service else {}
            ready = bool(runtime.get('ready'))
            resources = {}
            if runtime.get('pid'):
                try:
                    process = psutil.Process(runtime['pid'])
                    resources = {'rssBytes': process.memory_info().rss, 'cpuSeconds': sum(process.cpu_times()[:2]),
                                 'osThreads': process.num_threads(), 'pid': process.pid}
                except (psutil.Error, OSError):
                    pass
            entries = []
            for engine_id, name in zip(ENGINE_IDS, NAMES):
                installed = self._installed(engine_id)
                active = engine_id == self._active_id and ready
                runtime_failed = engine_id == self._active_id and self._service is not None and not ready
                status = 'Loading' if self._loading == engine_id else 'Active' if active else 'Error' if engine_id in self._errors or runtime_failed else 'Ready' if installed else 'Not Installed'
                entries.append({'id': engine_id, 'name': name, 'version': '14.1' if engine_id == ENGINE_IDS[2] else '19',
                                'installed': installed, 'status': status, 'runtimeReady': active,
                                'description': DESCRIPTIONS[ENGINE_IDS.index(engine_id)],
                                'networkBytes': (1166381, 98511183, None)[ENGINE_IDS.index(engine_id)],
                                'capabilities': ['analysis', 'streaming', 'cancellation', 'centipawns', 'mate', 'white-pov'],
                                'configuration': runtime.get('profile') if active else None,
                                'initializationError': self._errors.get(engine_id) or ('Analysis runtime is unavailable' if runtime_failed else None),
                                'identity': runtime.get('identity') if active else None,
                                'resources': resources if active else {}})
            return {'engines': entries, 'selectedEngineId': self._preferred,
                    'preferenceRevision': self._preference_revision,
                    'analysisRunning': any(service is self._service and not cancelled.is_set() for service, cancelled in self._requests.values()),
                    'activeEngineId': self._active_id if ready else None, 'selectionGeneration': self._generation,
                    'loadingEngineId': self._loading, 'analysisContextAuthorized': self.has_authorized_context(),
                    'cacheContext': self._context()}

    def _context(self):
        if not self._service or not self._active_id:
            return ''
        status = self._service.status()
        return '|'.join([self._active_id, str(status.get('build', 'native')), str(status.get('networkSha256', '')),
                         json.dumps(status.get('profile'), sort_keys=True), 'white-pov', 'lichess-winning-chances-0.00368208-v1'])

    def prefer(self, engine_id, expected_revision=None):
        if engine_id not in ENGINE_IDS:
            raise ValueError('Unknown analysis engine')
        with self._lock:
            if expected_revision is not None and expected_revision != self._preference_revision:
                raise ValueError('Engine preference changed. Retry your selection.')
            if not self._installed(engine_id):
                raise StockfishEvalBarError('Engine assets are not installed')
            if engine_id != self._preferred:
                revision = self._preference_revision + 1
                self.preference_path.parent.mkdir(parents=True, exist_ok=True)
                temporary = self.preference_path.with_suffix('.tmp')
                temporary.write_text(json.dumps({'analysisEngine': engine_id, 'revision': revision}) + '\n', encoding='utf8')
                os.replace(temporary, self.preference_path)
                self._preferred = engine_id
                self._preference_revision = revision
            return self.snapshot()

    def select(self, engine_id, persist=True, initialize_only=False):
        if engine_id not in ENGINE_IDS:
            raise ValueError('Unknown analysis engine')
        with self._switch_lock:
            with self._lock:
                if initialize_only:
                    engine_id = self._preferred
                if self._active_id == engine_id and self._service and self._service.status().get('ready'):
                    return self.snapshot()
                self._loading = engine_id
            candidate = None
            try:
                if not self._installed(engine_id):
                    raise StockfishEvalBarError('Engine assets are not installed')
                candidate = self._create(engine_id)
                candidate.start()
                if not candidate.status().get('ready'):
                    raise StockfishEvalBarError('Engine did not initialize')
                with self._lock:
                    if persist and not initialize_only:
                        self.prefer(engine_id)
                    old = self._service
                    self._generation += 1
                    self._service, self._active_id = candidate, engine_id
                    self._errors.pop(engine_id, None)
                    self._loading = None
                if old:
                    try:
                        old.close()
                    except Exception:
                        pass
                return self.snapshot()
            except Exception as error:
                if candidate:
                    candidate.close()
                with self._lock:
                    self._loading = None
                    self._errors[engine_id] = str(error)
                raise StockfishEvalBarError(str(error)) from error

    def evaluate_stream(self, fen, request_id, engine_id, selection_generation, movetime_ms=8000, cache_context=None):
        with self._lock:
            if engine_id != self._active_id or selection_generation != self._generation or not self._service:
                raise StockfishEvalBarCancelled('Analysis engine selection changed')
            if cache_context is not None and cache_context != self._context():
                raise StockfishEvalBarCancelled('Analysis engine configuration changed')
            service, generation = self._service, self._generation
            if request_id in self._requests:
                raise StockfishEvalBarError('Duplicate analysis request')
            cancelled = threading.Event()
            self._requests[request_id] = (service, cancelled)
            stream = service.evaluate_stream(fen, request_id, movetime_ms=movetime_ms)
        try:
            message = next(stream)
            while True:
                with self._lock:
                    if cancelled.is_set() or generation != self._generation or service is not self._service:
                        raise StockfishEvalBarCancelled('Analysis engine selection changed')
                yield {**message, 'engineId': engine_id, 'selectionGeneration': generation}
                try:
                    message = next(stream)
                except StopIteration:
                    return
        except StockfishEvalBarError:
            with self._lock:
                if cancelled.is_set() or generation != self._generation or service is not self._service:
                    raise StockfishEvalBarCancelled('Analysis engine selection changed') from None
            raise
        finally:
            service.cancel(request_id)
            stream.close()
            with self._lock:
                self._requests.pop(request_id, None)

    def cancel(self, request_id):
        with self._lock:
            entry = self._requests.get(request_id)
            if entry:
                entry[1].set()
        if entry:
            entry[0].cancel(request_id)
        return bool(entry)

    def close(self):
        with self._switch_lock:
            with self._lock:
                service, self._service = self._service, None
                self._generation += 1
            if service:
                service.close()
