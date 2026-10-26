import json
from pathlib import Path
import sys
import tempfile
import unittest
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from flask import Flask
from core.external_config import create_external_config_blueprint, DEFAULT_CONFIG

class EmptySessionTests(unittest.TestCase):
    def client(self,path):
        app=Flask(__name__);app.register_blueprint(create_external_config_blueprint(path));return app.test_client()
    def test_once_and_restart(self):
        with tempfile.TemporaryDirectory() as d:
            path=Path(d)/'prefs.json';saved={**DEFAULT_CONFIG,'sessionDurationMinutes':120,'sessionMinimumPercent':53,'sessionMaximumPercent':61,'color':'#Ab1234','elo':1800}
            path.write_text(json.dumps({'version':1,'arrowColorVersion':1,'config':saved}),encoding='utf8')
            c=self.client(path);r=c.get('/config/load').json
            for field in ('sessionDurationMinutes','sessionMinimumPercent','sessionMaximumPercent'):self.assertIsNone(r[field])
            self.assertEqual(r['color'],'#Ab1234');self.assertEqual(r['elo'],1800)
            self.assertEqual(json.loads(path.read_text())['sessionFieldsVersion'],1)
            response=c.post('/config/save',json={'sessionDurationMinutes':90,'sessionMinimumPercent':55,'sessionMaximumPercent':65});self.assertEqual(response.status_code,200)
            r=self.client(path).get('/config/load').json;self.assertEqual(r['sessionDurationMinutes'],90);self.assertEqual(r['sessionMinimumPercent'],55);self.assertEqual(r['sessionMaximumPercent'],65)
    def test_empty_validation_and_revision(self):
        c=self.client(None);r=c.get('/config/load').json;self.assertIsNone(r['sessionDurationMinutes'])
        self.assertEqual(c.post('/config/save',json={'sessionDurationMinutes':None}).status_code,200)
        for value in (0,-1,1441,1.5,True,''):
            self.assertEqual(c.post('/config/save',json={'sessionDurationMinutes':value}).status_code,400)
        for value in (-1,0,100,101):self.assertEqual(c.post('/config/save',json={'sessionMinimumPercent':value}).status_code,400)
        self.assertEqual(c.post('/config/save',json={'sessionMinimumPercent':61,'sessionMaximumPercent':53}).status_code,400)
        self.assertEqual(c.post('/config/save',json={'sessionDurationMinutes':30,'_expectedRevision':r['_revision'],'_serverId':r['_serverId']}).status_code,200)
        self.assertEqual(c.post('/config/save',json={'sessionDurationMinutes':90,'_expectedRevision':r['_revision'],'_serverId':r['_serverId']}).status_code,409)
if __name__=='__main__':unittest.main()
