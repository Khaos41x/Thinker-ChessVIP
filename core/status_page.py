from pathlib import Path

from flask import Response, request, send_file

ROOT = Path(__file__).resolve().parents[1]


def status_page():
    if 'text/html' in request.headers.get('Accept', '').lower() and request.accept_mimetypes.best_match(['text/html', 'text/plain']) == 'text/html':
        response = send_file(ROOT / 'frontend/status/index.html', mimetype='text/html')
    else:
        response = Response('Thinker Chess ONLINE', mimetype='text/plain')
    response.vary.add('Accept')
    return response


def status_artwork():
    return send_file(ROOT / 'assets/banner-horse.webp', mimetype='image/webp')
