import sys
import unittest
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from flask import Flask
from core.external_config import create_external_config_blueprint


class ExternalConfigTests(unittest.TestCase):
    def setUp(self):
        self.app = Flask(__name__)
        self.app.register_blueprint(create_external_config_blueprint())
        self.client = self.app.test_client()

    def test_page_and_assets(self):
        page = self.client.get('/config')
        self.assertEqual(page.status_code, 200)
        self.assertIn(b'lang="en-US"', page.data)
        self.assertIn("script-src 'self'", page.headers['Content-Security-Policy'])
        page.close()
        for filename in ('panel.css', 'panel.js'):
            response = self.client.get('/config/assets/' + filename)
            self.assertEqual(response.status_code, 200)
            response.close()
        self.assertEqual(self.client.get('/config/assets/../../app.py').status_code, 404)

    def test_defaults_partial_merge_and_revision(self):
        initial = self.client.get('/config/load').json
        self.assertTrue(initial['banner'] and initial['recentForm'])
        self.assertFalse(initial['hint'] or initial['autoMove'])
        self.assertEqual(initial['delayMode'], 'random')
        self.assertEqual(initial['elo'], 3200)
        response = self.client.post('/config/save', json={'banner': False}).json
        self.assertEqual(response['revision'], 1)
        self.assertFalse(response['config']['banner'])
        self.assertTrue(response['config']['recentForm'])
        self.assertEqual(self.client.post('/config/save', json={'banner': False}).json['revision'], 1)

    def test_invalid_writes_are_atomic(self):
        for payload in ([], {}, {'unknown': 1}, {'hint': 1}, {'elo': True}, {'elo': 3201},
                        {'minDelay': float('nan')}, {'minDelay': 10**1000}, {'maxDelay': 11}, {'color': 'red'},
                        {'delayMode': 'instant'}, {'banner': False, 'elo': -1}):
            self.assertEqual(self.client.post('/config/save', json=payload).status_code, 400, payload)
            self.assertEqual(self.client.get('/config/load').json['_revision'], 0)
        self.assertEqual(self.client.post('/config/save', data='{}').status_code, 400)

    def test_timing_bounds_and_swap(self):
        response = self.client.post('/config/save', json={'minDelay': 8, 'maxDelay': 0}).json['config']
        self.assertEqual((response['minDelay'], response['maxDelay']), (0.01, 8))
        self.assertEqual(self.client.post('/config/save', json={'delayMode': 'max', 'minDelay': 0}).status_code, 200)

    def test_connection_is_not_inferred_from_panel_requests(self):
        server_id = self.client.get('/config/load').json['_serverId']
        self.assertFalse(self.client.get('/config/status').json['userscriptConnected'])
        self.client.get('/config/load', headers={'X-Thinker-Client': 'userscript', 'X-Thinker-Applied-Revision': '99', 'X-Thinker-Server': server_id})
        self.assertFalse(self.client.get('/config/status').json['applied'])
        self.client.get('/config/load', headers={'X-Thinker-Client': 'userscript', 'X-Thinker-Applied-Revision': '0', 'X-Thinker-Server': 'old-server'})
        self.assertFalse(self.client.get('/config/status').json['applied'])
        self.client.get('/config/load', headers={'X-Thinker-Client': 'userscript', 'X-Thinker-Applied-Revision': '0', 'X-Thinker-Server': server_id})
        self.assertTrue(self.client.get('/config/status').json['applied'])
        self.client.post('/config/save', json={'banner': False})
        self.assertFalse(self.client.get('/config/status').json['applied'])
        self.client.get('/config/load', headers={'X-Thinker-Client': 'userscript', 'X-Thinker-Applied-Revision': '1', 'X-Thinker-Server': server_id})
        self.assertTrue(self.client.get('/config/status').json['applied'])
        with patch('core.external_config.time.monotonic', return_value=10**20):
            self.assertFalse(self.client.get('/config/status').json['userscriptConnected'])

    def test_origin_guard_and_parallel_updates(self):
        self.assertEqual(self.client.post('/config/save', json={'hint': True}, headers={'Origin': 'https://evil.example'}).status_code, 403)
        self.assertEqual(self.client.post('/config/save', json={'hint': False}, headers={'Origin': 'https://www.chess.com'}).status_code, 200)
        def save(patch):
            with self.app.test_client() as client:
                return client.post('/config/save', json=patch).status_code
        with ThreadPoolExecutor(max_workers=2) as pool:
            self.assertEqual(list(pool.map(save, [{'banner': False}, {'recentForm': False}])), [200, 200])
        state = self.client.get('/config/load').json
        self.assertFalse(state['banner'] or state['recentForm'])
        self.assertEqual(state['_revision'], 2)

    def test_banner_status_is_bounded_and_expires(self):
        self.client.get('/config/load', headers={'X-Thinker-Client': 'userscript', 'X-Thinker-Banner-State': 'visible'})
        self.assertEqual(self.client.get('/config/status').json['bannerState'], 'visible')
        self.client.get('/config/load', headers={'X-Thinker-Client': 'userscript', 'X-Thinker-Banner-State': 'unexpected-private-data'})
        self.assertEqual(self.client.get('/config/status').json['bannerState'], 'unknown')
        with patch('core.external_config.time.monotonic', return_value=10**20):
            self.assertEqual(self.client.get('/config/status').json['bannerState'], 'disconnected')


if __name__ == '__main__':
    unittest.main()
