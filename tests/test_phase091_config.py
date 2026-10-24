import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from flask import Flask

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from core.external_config import DEFAULT_CONFIG, create_external_config_blueprint
from core.eval_bar.registry import EngineRegistry, ENGINE_IDS
from core.eval_bar.routes import create_engine_registry_blueprint


class Phase091Tests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(dir=ROOT)
        self.preference = Path(self.temp.name) / 'engine.json'
        self.registry = EngineRegistry(ROOT, ROOT / 'engine/komodo-14.1-64bit.exe', self.preference)
        self.app = Flask(__name__)
        self.app.register_blueprint(create_external_config_blueprint())
        self.app.register_blueprint(create_engine_registry_blueprint(self.registry, lambda f: f))
        self.client = self.app.test_client()

    def tearDown(self):
        self.registry.close()
        self.temp.cleanup()

    def test_real_installation_no_heartbeat_preference_and_restart(self):
        state = self.client.get('/config/engines').json
        self.assertFalse(state['analysisContextAuthorized'])
        self.assertTrue(all(engine['installed'] for engine in state['engines']))
        for engine_id in ENGINE_IDS:
            response = self.client.post('/config/engines/select', json={'engineId': engine_id, 'expectedRevision': state['preferenceRevision']})
            self.assertEqual(response.status_code, 200)
            state = response.json
            self.assertEqual(state['selectedEngineId'], engine_id)
            self.assertIsNone(state['activeEngineId'])
            self.assertIsNone(self.registry._service)
        restored = EngineRegistry(ROOT, self.registry.komodo_path, self.preference)
        self.assertEqual(restored.snapshot()['selectedEngineId'], ENGINE_IDS[-1])
        restored.close()
        self.assertFalse(self.client.get('/config/load').json['evalBar'])
        rejected = self.client.post('/config/engines/select', json={'engineId': ENGINE_IDS[0], 'expectedRevision': 0})
        self.assertEqual(rejected.status_code, 409)
        self.assertEqual(rejected.json['selectedEngineId'], ENGINE_IDS[-1])
        self.assertEqual(self.client.post('/eval-bar/engines/select', json={'engineId': ENGINE_IDS[0], 'context': 'active-game'}).status_code, 403)

    def test_all_config_fields_round_trip_and_revision_conflict(self):
        initial = self.client.get('/config/load').json
        patch_data = {**DEFAULT_CONFIG, 'banner': False, 'sessionDurationMinutes': 63,
                      'sessionMinimumPercent': 72.5, 'sessionMaximumPercent': 85.25, 'color': '#123456'}
        accepted = self.client.post('/config/save', json={**patch_data, '_expectedRevision': initial['_revision'], '_serverId': initial['_serverId']})
        self.assertEqual(accepted.status_code, 200)
        loaded = self.client.get('/config/load').json
        for field, value in patch_data.items():
            self.assertEqual(loaded[field], value, field)
        stale = self.client.post('/config/save', json={'recentForm': False, '_expectedRevision': 0, '_serverId': initial['_serverId']})
        self.assertEqual(stale.status_code, 409)
        self.assertTrue(stale.json['config']['recentForm'])
        for data in ({'sessionDurationMinutes': 0}, {'sessionDurationMinutes': 1441}, {'sessionMinimumPercent': 90, 'sessionMaximumPercent': 80}, {'sessionMaximumPercent': 100}, {'sessionMinimumPercent': True}):
            self.assertEqual(self.client.post('/config/save', json=data).status_code, 400)
        self.assertEqual(self.client.get('/config/load').json['_revision'], 1)

    def test_relay_owner_expiry_and_at_most_once_acknowledgement(self):
        config = self.client.get('/config/load').json
        payload = {'id': 'command-123456', 'action': 'export', 'configRevision': config['_revision'], 'serverId': config['_serverId']}
        self.assertEqual(self.client.post('/config/session/commands', json=payload).status_code, 409)
        projection = {'status': {'phase': 'IDLE', 'role': 'FOLLOWER', 'remainingTtlMs': 0, 'rawWinRate': 0, 'observedCounts': {'wins': 0, 'draws': 0, 'losses': 0, 'terminalGames': 0}, 'controlCounts': {'wins': 0, 'draws': 0, 'losses': 0, 'terminalGames': 0}}, 'availability': {'start': 'BOT_DISABLED', 'stop': 'SESSION_NOT_ACTIVE', 'export': None}, 'sessionIdentity': None}
        publish = {'clientId': 'client-123456', 'projection': projection}
        self.assertTrue(self.client.post('/config/session/bridge', json=publish).json['owner'])
        self.assertFalse(self.client.post('/config/session/bridge', json={**publish, 'clientId': 'other-123456'}).json['owner'])
        self.assertEqual(self.client.post('/config/session/commands', json={**payload, 'action': 'start'}).status_code, 409)
        queued = self.client.post('/config/session/commands', json=payload)
        self.assertEqual(queued.status_code, 202)
        claimed = self.client.post('/config/session/bridge', json=publish).json['command']
        self.assertEqual(claimed['state'], 'dispatched')
        self.assertIsNone(self.client.post('/config/session/bridge', json=publish).json['command'])
        authorize = '/config/session/commands/' + payload['id'] + '/authorize'
        self.assertEqual(self.client.post(authorize, json={'clientId': 'other-123456'}).status_code, 409)
        self.assertEqual(self.client.post(authorize, json={'clientId': publish['clientId']}).status_code, 200)
        self.assertEqual(self.client.post(authorize, json={'clientId': publish['clientId']}).status_code, 409)
        self.client.post('/config/session/bridge', json={**publish, 'ack': {'id': payload['id'], 'ok': True, 'result': {'schemaVersion': 1}}})
        self.assertEqual(self.client.get('/config/session/commands/' + payload['id']).json['state'], 'completed')
        self.assertEqual(self.client.post('/config/session/commands', json=payload).json['state'], 'completed')
        payload['id'] = 'expired-123456'
        self.client.post('/config/session/commands', json=payload)
        with patch('core.external_config.time.monotonic', return_value=10**20):
            self.assertFalse(self.client.get('/config/status').json['sessionConnected'])
            self.assertEqual(self.client.get('/config/session/commands/' + payload['id']).json['state'], 'error')
        self.assertIsNone(self.client.post('/config/session/bridge', json=publish).json['command'])


if __name__ == '__main__':
    unittest.main()
