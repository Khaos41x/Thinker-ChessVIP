import json
import os
import queue
import re
import socket
import subprocess
import sys
import tempfile
import threading
import time
import unittest
from pathlib import Path

import psutil

ROOT = Path(__file__).resolve().parents[1]
TOKEN = 'startup-regression-isolated-capability'


class StartupTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory(dir=ROOT)
        self.processes = []

    def tearDown(self):
        for process in self.processes:
            if process.poll() is None:
                children = psutil.Process(process.pid).children(recursive=True)
                process.terminate()
                process.wait(5)
                for child in children:
                    try:
                        child.terminate()
                        child.wait(5)
                    except psutil.NoSuchProcess:
                        pass
            process.stdout.close()
        self.directory.cleanup()

    def launch(self, port):
        environment = {**os.environ, 'PYTHONUNBUFFERED': '1', 'THINKER_CAPABILITY_TOKEN': TOKEN,
                       'THINKER_RATING_TRACKER_DB': str(Path(self.directory.name) / f'ratings-{len(self.processes)}.db')}
        process = subprocess.Popen([sys.executable, '-u', '-c', f'import app;app.run_server(port={port})'],
                                   cwd=ROOT, env=environment, stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                                   text=True, encoding='utf8', errors='replace')
        self.processes.append(process)
        return process

    def ready(self, process):
        lines = queue.Queue()
        threading.Thread(target=lambda: [lines.put((time.perf_counter(), line)) for line in process.stdout], daemon=True).start()
        deadline = time.monotonic() + 20
        output = []
        while time.monotonic() < deadline:
            try:
                timestamp, line = lines.get(timeout=.1)
            except queue.Empty:
                self.assertIsNone(process.poll(), 'Server exited before readiness')
                continue
            output.append(line.replace(TOKEN, '[fixture capability redacted]'))
            match = re.search(r'Rodando em http://127\.0\.0\.1:(\d+)', line)
            if match:
                port = int(match.group(1))
                with socket.create_connection(('127.0.0.1', port), timeout=1):
                    pass
                return port, timestamp, output
        self.fail('No verified listening socket after startup')

    def test_real_app_listens_before_ready_and_serves_config_and_registry(self):
        import urllib.request
        process = self.launch(0)
        port, ready, output = self.ready(process)
        base = f'http://127.0.0.1:{port}'
        response = urllib.request.urlopen(base + '/config', timeout=5)
        self.assertEqual(response.status, 200)
        http_ms = (time.perf_counter() - ready) * 1000
        health = json.load(urllib.request.urlopen(base + '/health', timeout=5))
        self.assertTrue(health['ready'])
        registry = json.load(urllib.request.urlopen(base + '/config/engines', timeout=5))
        self.assertEqual(len(registry['engines']), 3)
        self.assertFalse(registry['analysisContextAuthorized'])
        destination = ROOT / '_bmad-output/implementation-artifacts/connectivity-finish'
        destination.mkdir(parents=True, exist_ok=True)
        (destination / 'startup-test.json').write_text(json.dumps({'port': port, 'readyToHttpMs': http_ms,
            'health': health, 'engines': [engine['id'] for engine in registry['engines']], 'log': output}, indent=2), encoding='utf8')

    def test_occupied_port_exits_without_false_readiness_or_komodo_warmup(self):
        first = self.launch(0)
        port, _, _ = self.ready(first)
        second = self.launch(port)
        output, _ = second.communicate(timeout=8)
        self.assertNotEqual(second.returncode, 0)
        self.assertNotIn('Rodando em', output)
        self.assertNotIn('Komodo ONLINE', output)
        self.assertIsNone(first.poll())
        with socket.create_connection(('127.0.0.1', port), timeout=1):
            pass

    def test_immediate_restart_after_real_http_requests(self):
        import urllib.request
        first = self.launch(0)
        port, _, _ = self.ready(first)
        for path in ['/config', '/health', '/config/engines']:
            with urllib.request.urlopen(f'http://127.0.0.1:{port}' + path, timeout=5) as response:
                response.read()
        children = psutil.Process(first.pid).children(recursive=True)
        first.terminate()
        first.wait(5)
        for child in children:
            try:
                child.terminate()
                child.wait(5)
            except psutil.NoSuchProcess:
                pass
        second = self.launch(port)
        second_port, _, _ = self.ready(second)
        self.assertEqual(second_port, port)


if __name__ == '__main__':
    unittest.main(verbosity=2)
