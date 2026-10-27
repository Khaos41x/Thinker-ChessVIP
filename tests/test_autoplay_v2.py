import json
from pathlib import Path
import sys
import tempfile
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from flask import Flask
from core.external_config import create_external_config_blueprint, DEFAULT_CONFIG
from core.rating_tracker.repository import Repository
from core.rating_tracker.service import RatingTrackerService


class AutoPlayMigrationTests(unittest.TestCase):
    def test_rating_target_once_preserves_history_and_new_target(self):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / 'ratings.db'
            repository = Repository(path)
            with repository.transaction() as db:
                db.execute("INSERT INTO metadata(key,value) VALUES('ratingTarget','1300')")
                db.execute("INSERT INTO metadata(key,value) VALUES('history-sentinel','keep')")
            repository.close()
            service = RatingTrackerService(path)
            self.assertEqual(service.rating_target(), {'target':None})
            self.assertEqual(service.repository.rows("SELECT value FROM metadata WHERE key='autoPlayFieldsVersion'")[0]['value'], '2')
            service.rating_target({'target':1740})
            service.close()
            service = RatingTrackerService(path)
            self.assertEqual(service.rating_target(), {'target':1740})
            self.assertEqual(service.repository.rows("SELECT value FROM metadata WHERE key='history-sentinel'")[0]['value'], 'keep')
            service.rating_target({'target':None})
            self.assertEqual(service.rating_target(), {'target':None})
            service.close()

    def test_new_config_marker_clears_prior_v1_once(self):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / 'prefs.json'
            path.write_text(json.dumps({'version':1,'arrowColorVersion':1,'sessionFieldsVersion':1,'config':{**DEFAULT_CONFIG,'sessionDurationMinutes':120,'sessionMinimumPercent':53,'sessionMaximumPercent':61,'elo':1800}}), encoding='utf8')
            def client():
                app = Flask(__name__)
                app.register_blueprint(create_external_config_blueprint(path))
                return app.test_client()
            current = client()
            config = current.get('/config/load').json
            for key in ['sessionDurationMinutes','sessionMinimumPercent','sessionMaximumPercent']:
                self.assertIsNone(config[key])
            self.assertEqual(json.loads(path.read_text())['autoPlayFieldsVersion'], 2)
            current.post('/config/save', json={'sessionDurationMinutes':95,'sessionMinimumPercent':55,'sessionMaximumPercent':65})
            accepted = client().get('/config/load').json
            self.assertEqual(accepted['sessionDurationMinutes'],95)
            self.assertEqual(accepted['sessionMinimumPercent'],55)
            self.assertEqual(accepted['sessionMaximumPercent'],65)
            self.assertEqual(accepted['elo'],1800)


if __name__ == '__main__':
    unittest.main()
