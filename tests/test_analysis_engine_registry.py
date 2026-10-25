import json
import sys
import tempfile
import threading
import time
import unittest
from pathlib import Path
from unittest.mock import patch

import chess
import psutil

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from core.eval_bar.registry import EngineRegistry, ENGINE_IDS
from core.eval_bar.stockfish_service import StockfishEvalBarError, StockfishEvalBarCancelled, StockfishEvalBarTimeout


class RegistryTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.preference = Path(self.temp.name) / 'engine.json'
        self.registry = EngineRegistry(ROOT, ROOT / 'engine/komodo-14.1-64bit.exe', self.preference)

    def tearDown(self):
        self.registry.close()
        self.temp.cleanup()

    def test_default_authorization_and_installation(self):
        state = self.registry.snapshot()
        self.assertEqual(state['selectedEngineId'], ENGINE_IDS[0])
        self.assertIsNone(state['activeEngineId'])
        self.assertEqual(len(state['engines']), 3)
        self.assertFalse(state['analysisContextAuthorized'])
        self.registry.authorize_context('analysis')
        self.assertTrue(self.registry.has_authorized_context())
        self.registry.authorize_context('active-game')
        self.assertFalse(self.registry.has_authorized_context())
        with self.assertRaises(ValueError):
            self.registry.select('generic-stockfish')

    def test_real_native_supersession_timeout_and_process_death(self):
        state = self.registry.select(ENGINE_IDS[2])
        service = self.registry._service
        first = service.evaluate_stream(chess.STARTING_FEN, 'native-old', movetime_ms=5000)
        next(first)
        newest = service.evaluate_stream(chess.STARTING_FEN, 'native-new', movetime_ms=100)
        next(newest)
        with self.assertRaises(StockfishEvalBarCancelled):
            list(first)
        self.assertEqual(list(newest)[-1]['type'], 'result')
        stalled = service.evaluate_stream(chess.STARTING_FEN, 'native-stall', timeout_seconds=0.1)
        next(stalled)
        process = psutil.Process(service.pid)
        process.suspend()
        try:
            with self.assertRaises(StockfishEvalBarTimeout):
                list(stalled)
        finally:
            try:
                process.resume()
            except psutil.Error:
                pass
        self.assertFalse(service.status()['ready'])
        service.start()
        process = psutil.Process(service.pid)
        old_pid = process.pid
        process.kill()
        process.wait()
        service.start()
        self.assertNotEqual(service.pid, old_pid)
        self.assertTrue(service.status()['ready'])

    def test_real_corrupt_network_restores_previous_runtime(self):
        state = self.registry.select(ENGINE_IDS[0])
        previous_pid = self.registry._service.pid
        corrupt = Path(self.temp.name) / 'corrupt.nnue'
        corrupt.write_bytes(b'invalid network')
        create = self.registry._create
        def candidate(engine_id):
            service = create(engine_id)
            service.network_path = corrupt
            return service
        with patch.object(self.registry, '_create', side_effect=candidate):
            with self.assertRaisesRegex(StockfishEvalBarError, 'integrity mismatch'):
                self.registry.select(ENGINE_IDS[1])
        self.assertEqual(self.registry.snapshot()['activeEngineId'], state['activeEngineId'])
        self.assertEqual(self.registry._service.pid, previous_pid)
        self.assertTrue(self.registry._service.status()['ready'])

    def test_real_engines_switch_recovery_and_benchmarks(self):
        self.registry.prefer(ENGINE_IDS[1])
        self.registry.prefer(ENGINE_IDS[0])
        self.assertIsNone(self.registry.snapshot()['activeEngineId'])
        self.assertEqual(json.loads(self.preference.read_text())['analysisEngine'], ENGINE_IDS[0])
        report = {'engines': [], 'switches': []}
        positions = [('initial', chess.STARTING_FEN),
                     ('middlegame', 'r2q1rk1/pp1bbppp/2np1n2/2p1p3/4P3/2NP1N2/PPPQBPPP/R1B1K2R w KQ - 4 9'),
                     ('mate', '7k/5Q2/6K1/8/8/8/8/8 w - - 0 1')]
        contexts = set()
        previous_pid = None
        for engine_id in (*ENGINE_IDS, ENGINE_IDS[0]):
            started = time.perf_counter()
            state = self.registry.select(engine_id)
            switch_ms = (time.perf_counter() - started) * 1000
            entry = next(e for e in state['engines'] if e['id'] == engine_id)
            self.assertEqual(state['activeEngineId'], engine_id)
            self.assertTrue(entry['runtimeReady'])
            pid = entry['resources']['pid']
            if previous_pid:
                self.assertFalse(psutil.pid_exists(previous_pid), 'retired runtime leaked')
            previous_pid = pid
            report['switches'].append({'engineId': engine_id, 'latencyMs': switch_ms, 'pid': pid})
            contexts.add(state['cacheContext'])
            if len(report['engines']) == 3:
                break
            self.assertTrue(entry['identity']['proof']['depth'] > 0)
            warm = time.perf_counter()
            self.registry.select(engine_id)
            warm_ms = (time.perf_counter() - warm) * 1000
            self.assertEqual(self.registry._service.pid, pid)
            rows = []
            for name, fen in positions:
                process = psutil.Process(pid)
                cpu = sum(process.cpu_times()[:2])
                began = time.perf_counter()
                first = None
                depths = []
                peak = process.memory_info().rss
                stream = self.registry.evaluate_stream(fen, name, engine_id, state['selectionGeneration'], cache_context=state['cacheContext'])
                result = None
                for item in stream:
                    self.assertEqual(item['engineId'], engine_id)
                    self.assertEqual(item['selectionGeneration'], state['selectionGeneration'])
                    if item['type'] in {'info', 'result'}:
                        elapsed = (time.perf_counter() - began) * 1000
                        if first is None:
                            first = elapsed
                        score = item['result']
                        if not depths or depths[-1]['depth'] != score['depth']:
                            depths.append({'depth': score['depth'], 'elapsedMs': elapsed})
                        peak = max(peak, process.memory_info().rss)
                    if item['type'] == 'result':
                        result = item['result']
                elapsed = time.perf_counter() - began
                self.assertIsNotNone(result)
                self.assertGreater(result['depth'], 0)
                if name == 'mate':
                    self.assertGreater(result['mate'], 0)
                    self.assertIsNone(result['cp'])
                else:
                    self.assertIsInstance(result['cp'], int)
                rows.append({'position': name, 'firstEvaluationMs': first, 'elapsedMs': elapsed * 1000,
                             'depthProgression': depths, 'cpuPercent': (sum(process.cpu_times()[:2])-cpu)/elapsed*100,
                             'peakSampledRssBytes': peak, 'result': result})
            black = list(self.registry.evaluate_stream('8/8/8/8/8/6k1/5q2/7K b - - 0 1', 'black-mate', engine_id, state['selectionGeneration'], movetime_ms=250))[-1]['result']
            self.assertLess(black['mate'], 0)
            self.assertIsNone(black['cp'])
            same = self.registry.select(ENGINE_IDS[(ENGINE_IDS.index(engine_id)+1)%3], initialize_only=True)
            self.assertEqual(same['activeEngineId'], engine_id, 'stale automatic initialization changed explicit selection')
            cancel_stream = self.registry.evaluate_stream(chess.STARTING_FEN, 'cancel', engine_id, state['selectionGeneration'])
            next(cancel_stream)
            began = time.perf_counter()
            self.assertTrue(self.registry.cancel('cancel'))
            with self.assertRaises(StockfishEvalBarCancelled):
                list(cancel_stream)
            cancel_ms = (time.perf_counter()-began)*1000
            stale = self.registry.evaluate_stream(chess.STARTING_FEN, 'wrong-engine', ENGINE_IDS[(ENGINE_IDS.index(engine_id)+1)%3], state['selectionGeneration'])
            with self.assertRaises(StockfishEvalBarCancelled):
                next(stale)
            began = time.perf_counter()
            with patch.object(self.registry, '_create', side_effect=StockfishEvalBarError('injected initialization failure')):
                target = ENGINE_IDS[(ENGINE_IDS.index(engine_id)+1)%3]
                with self.assertRaises(StockfishEvalBarError):
                    self.registry.select(target)
            self.assertEqual(self.registry.snapshot()['activeEngineId'], engine_id)
            self.assertEqual(json.loads(self.preference.read_text())['analysisEngine'], engine_id)
            restored = EngineRegistry(ROOT, self.registry.komodo_path, self.preference)
            self.assertEqual(restored.snapshot()['selectedEngineId'], engine_id)
            self.assertIsNone(restored.snapshot()['activeEngineId'])
            restored.close()
            report['engines'].append({'engineId': engine_id, 'coldInitializationMs': switch_ms,
                'warmInitializationMs': warm_ms, 'identity': entry['identity'], 'resources': entry['resources'],
                'positions': rows, 'blackMateEvidence': black, 'cancellationMs': cancel_ms, 'errorRecovery': True, 'preferenceReload': True})
        self.assertEqual(len(contexts), 3)
        self.registry.select(ENGINE_IDS[2])
        service = self.registry._service
        stalled = service.evaluate_stream(chess.STARTING_FEN, 'deadline', timeout_seconds=0.15)
        next(stalled)
        process = psutil.Process(service.pid)
        process.suspend()
        try:
            with self.assertRaises(StockfishEvalBarTimeout):
                list(stalled)
        finally:
            try:
                process.resume()
            except psutil.Error:
                pass
        self.assertFalse(service.status()['ready'])
        self.assertEqual(self.registry.snapshot()['engines'][2]['status'], 'Error')
        self.registry.select(ENGINE_IDS[0])
        report['nativeStallDeadlineRecovery'] = True
        state = self.registry.snapshot()
        stale = self.registry.evaluate_stream(chess.STARTING_FEN, 'obsolete', state['activeEngineId'], state['selectionGeneration'])
        next(stale)
        self.registry.select(ENGINE_IDS[1])
        with self.assertRaises(StockfishEvalBarCancelled):
            list(stale)
        pid = self.registry._service.pid
        began = time.perf_counter()
        self.registry.close()
        self.assertFalse(psutil.pid_exists(pid))
        report['cleanupMs'] = (time.perf_counter()-began)*1000
        report['staleStreamRejected'] = True
        output = ROOT / '_bmad-output/implementation-artifacts/phase09-engine-selector'
        output.mkdir(exist_ok=True)
        (output/'benchmark.json').write_text(json.dumps(report, indent=2), encoding='utf8')


if __name__ == '__main__':
    unittest.main(verbosity=2)
