import sys
import unittest
import tempfile
import json
from unittest.mock import patch
from pathlib import Path
from flask import Flask
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from core.external_config import create_external_config_blueprint

class DefaultsTests(unittest.TestCase):
    def setUp(self):
        app = Flask(__name__)
        app.register_blueprint(create_external_config_blueprint())
        self.client = app.test_client()

    def test_first_run_and_saved_roundtrip(self):
        initial = self.client.get('/config/load').json
        self.assertTrue(initial['banner'] and initial['recentForm'])
        self.assertFalse(initial['_hasSavedPreferences'])
        for field in ('hint','autoMove','autoQueue','evalBar','autoAdjust','smartPacing','ghostMode'):
            self.assertFalse(initial[field], field)
        self.assertEqual((initial['minDelay'], initial['maxDelay']), (.5, 1.0))
        self.assertIsNone(initial['sessionMinimumPercent'])
        self.assertIsNone(initial['sessionMaximumPercent'])
        saved = {'banner':False,'recentForm':False,'evalBar':True,'delayMode':'random','minDelay':.01,'maxDelay':.01,'sessionMinimumPercent':75.25,'sessionMaximumPercent':82.5}
        self.assertEqual(self.client.post('/config/save',json=saved).status_code,200)
        loaded = self.client.get('/config/load').json
        for field,value in saved.items(): self.assertEqual(loaded[field],value,field)
        for mode in ('max','random'):
            state = self.client.post('/config/save',json={'delayMode':mode}).json['config']
            self.assertEqual((state['minDelay'],state['maxDelay']),(.01,.01))
        unset = self.client.post('/config/save',json={'sessionMinimumPercent':None,'sessionMaximumPercent':None})
        self.assertEqual(unset.status_code,200)
        self.assertIsNone(unset.json['config']['sessionMinimumPercent'])
        self.assertTrue(unset.json['config']['evalBar'])

    def test_unset_not_zero_and_stale_edits(self):
        state = self.client.get('/config/load').json
        for value in (0,-1,100,10**1000,True,'',float('nan')):
            self.assertEqual(self.client.post('/config/save',json={'sessionMinimumPercent':value}).status_code,400)
        saved = self.client.post('/config/save',json={'sessionMinimumPercent':42.5,'_expectedRevision':state['_revision'],'_serverId':state['_serverId']})
        self.assertEqual(saved.status_code,200)
        stale = self.client.post('/config/save',json={'sessionMaximumPercent':80,'_expectedRevision':state['_revision'],'_serverId':state['_serverId']})
        self.assertEqual(stale.status_code,409)
        self.assertIsNone(self.client.get('/config/load').json['sessionMaximumPercent'])

    def test_durable_restart_and_failed_save(self):
        with tempfile.TemporaryDirectory(dir=Path(__file__).resolve().parents[1]) as directory:
            preference = Path(directory) / 'preferences.json'
            def connect():
                app = Flask(__name__)
                app.register_blueprint(create_external_config_blueprint(preference))
                return app.test_client()
            first = connect()
            saved = {'banner':False,'recentForm':False,'evalBar':True,'minDelay':1.25,'maxDelay':2.75,'sessionMinimumPercent':75,'sessionMaximumPercent':82}
            self.assertEqual(first.post('/config/save',json=saved).status_code,200)
            restarted = connect()
            loaded = restarted.get('/config/load').json
            for field,value in saved.items(): self.assertEqual(loaded[field],value,field)
            self.assertTrue(loaded['_hasSavedPreferences'])
            with patch('core.external_config.os.replace',side_effect=OSError('disk unavailable')):
                rejected = restarted.post('/config/save',json={'banner':True})
                self.assertEqual(rejected.status_code,503)
            self.assertFalse(restarted.get('/config/load').json['banner'])
            self.assertEqual(restarted.get('/config/load').json['_revision'],0)
            self.assertFalse(connect().get('/config/load').json['banner'])
            self.assertEqual(restarted.post('/config/save',json={'banner':True}).status_code,200)
            self.assertTrue(connect().get('/config/load').json['banner'])
            preference.write_text(json.dumps({'version':1,'config':{'evalBar':'true'}}),encoding='utf-8')
            corrupted = preference.read_bytes()
            invalid_client = connect()
            invalid = invalid_client.get('/config/load').json
            self.assertFalse(invalid['evalBar'])
            self.assertTrue(invalid['_persistenceError'])
            self.assertEqual(invalid_client.post('/config/save',json={'banner':True}).status_code,200)
            self.assertEqual(next(Path(directory).glob('*.invalid')).read_bytes(),corrupted)

    def test_known_legacy_immediate_zero_range(self):
        self.client.post('/config/save',json={'delayMode':'max','minDelay':0,'maxDelay':0})
        state = self.client.post('/config/save',json={'delayMode':'random'}).json['config']
        self.assertEqual((state['minDelay'],state['maxDelay']),(.5,1))

if __name__ == '__main__': unittest.main()
