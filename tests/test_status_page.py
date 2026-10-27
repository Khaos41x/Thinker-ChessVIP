import sys
import unittest
from pathlib import Path

from flask import Flask

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from core.status_page import status_page, status_artwork


class StatusPageTests(unittest.TestCase):
    def setUp(self):
        app = Flask(__name__)
        app.add_url_rule('/', view_func=status_page)
        app.add_url_rule('/status/horse.webp', view_func=status_artwork)
        self.client = app.test_client()

    def test_html(self):
        response = self.client.get('/', headers={'Accept': 'text/html'})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.mimetype, 'text/html')
        self.assertIn(b'<title>Thinker Chess</title>', response.data)
        self.assertIn(b'Open External Config', response.data)
        self.assertNotIn(b'Kryp', response.data)
        self.assertNotIn(b'<script', response.data)
        self.assertNotIn(b'https://', response.data)
        response.close()

    def test_plain_compatibility(self):
        for accept in [None, '*/*', 'text/plain', 'application/json']:
            response = self.client.get('/', headers={'Accept': accept} if accept else {})
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.data, b'Thinker Chess ONLINE')
            self.assertEqual(response.mimetype, 'text/plain')
            self.assertIn('Accept', response.vary)
            response.close()

    def test_same_banner_artwork(self):
        response = self.client.get('/status/horse.webp')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.mimetype, 'image/webp')
        self.assertEqual(response.data, (Path(__file__).resolve().parents[1] / 'assets/banner-horse.webp').read_bytes())
        response.close()


if __name__ == '__main__':
    unittest.main()
