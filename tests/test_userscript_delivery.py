import sys
import unittest
from pathlib import Path
from flask import Flask
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from core.external_config import create_external_config_blueprint


class DeliveryTests(unittest.TestCase):
    def setUp(self):
        app = Flask(__name__)
        app.register_blueprint(create_external_config_blueprint())
        self.client = app.test_client()
        self.version = self.client.get("/config/status").json["serverVersion"]

    def test_real_userscript_and_metadata_delivery(self):
        source = self.client.get('/thinker-chess.user.js')
        self.assertEqual(source.status_code, 200)
        self.assertIn('no-store', source.headers['Cache-Control'])
        self.assertIn(('@version      ' + self.version).encode(), source.data)
        self.assertIn(('globalThis.ThinkerClientVersion="' + self.version + '";').encode(), source.data)
        self.assertIn(b'X-Thinker-Version', source.data)
        metadata = self.client.get('/thinker-chess.meta.js')
        self.assertEqual(metadata.status_code, 200)
        self.assertIn(b'@downloadURL  http://127.0.0.1:5050/thinker-chess.user.js', metadata.data)
        self.assertNotIn(b'globalThis.ThinkerSessionControlReady', metadata.data)
        denied = self.client.get('/thinker-chess.user.js', environ_overrides={'REMOTE_ADDR': '192.0.2.1'})
        self.assertEqual(denied.status_code, 403)

    def test_runtime_version_acknowledgement(self):
        status = self.client.get('/config/status').json
        self.assertFalse(status['userscriptConnected'])
        self.client.get('/config/load', headers={'X-Thinker-Client': 'userscript'})
        self.assertTrue(self.client.get('/config/status').json['userscriptUpdateRequired'])
        self.client.get('/config/load', headers={'X-Thinker-Client': 'userscript', 'X-Thinker-Version': '2026-10-23.7'})
        self.assertTrue(self.client.get('/config/status').json['userscriptUpdateRequired'])
        self.client.get('/config/load', headers={'X-Thinker-Client': 'userscript', 'X-Thinker-Version': self.version})
        status = self.client.get('/config/status').json
        self.assertEqual(status['userscriptVersion'], status['serverVersion'])
        self.assertFalse(status['userscriptUpdateRequired'])
        self.client.get('/config/load', headers={'X-Thinker-Client': 'userscript'})
        self.assertTrue(self.client.get('/config/status').json['userscriptUpdateRequired'])


if __name__ == '__main__':
    unittest.main()
