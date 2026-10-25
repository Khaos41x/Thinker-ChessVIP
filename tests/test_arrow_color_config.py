import sys
import json
import tempfile
import unittest
from pathlib import Path
from flask import Flask
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from core.external_config import create_external_config_blueprint


class ArrowColorTests(unittest.TestCase):
    def connect(self, path=None):
        app = Flask(__name__)
        app.register_blueprint(create_external_config_blueprint(path))
        return app.test_client()

    def test_default_legacy_and_custom_colors(self):
        client = self.connect()
        self.assertEqual(client.get('/config/load').json['color'], '#3B82F6')
        client.post('/config/save', json={'color': '#10b981'})
        self.assertEqual(client.get('/config/load').json['color'], '#3B82F6')
        client.post('/config/save', json={'color': '#a24fd1'})
        self.assertEqual(client.get('/config/load').json['color'], '#a24fd1')
        for bad in ('', 'blue', '#123', '#00000080'):
            self.assertEqual(client.post('/config/save', json={'color': bad}).status_code, 400)

    def test_migration_persists_without_resetting_other_values(self):
        with tempfile.TemporaryDirectory(dir=Path(__file__).resolve().parents[1]) as directory:
            path = Path(directory) / 'preferences.json'
            path.write_text(json.dumps({'version': 1, 'config': {'color': '#10B981', 'minDelay': .75, 'maxDelay': 1.5, 'sessionMinimumPercent': 53, 'sessionMaximumPercent': 61}}), encoding='utf8')
            client = self.connect(path)
            config = client.get('/config/load').json
            self.assertEqual(config['color'], '#3B82F6')
            self.assertEqual(config['minDelay'], .75)
            self.assertEqual(config['sessionMinimumPercent'], 53)
            self.assertEqual(json.loads(path.read_text())['config']['color'], '#3B82F6')
            client.post('/config/save', json={'color': '#c65d42'})
            self.assertEqual(self.connect(path).get('/config/load').json['color'], '#c65d42')


if __name__ == '__main__':
    unittest.main()
