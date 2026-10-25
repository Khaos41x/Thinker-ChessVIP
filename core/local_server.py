import socket
import sys

from werkzeug.serving import ThreadedWSGIServer


class LocalServer(ThreadedWSGIServer):
    allow_reuse_address = False
    allow_reuse_port = False

    def server_bind(self):
        if hasattr(socket, 'SO_EXCLUSIVEADDRUSE'):
            self.socket.setsockopt(socket.SOL_SOCKET, socket.SO_EXCLUSIVEADDRUSE, 1)
        super().server_bind()


def serve_local(app, initialize, ready, port=5050):
    try:
        server = LocalServer('127.0.0.1', port, app)
    except SystemExit:
        print(f'Local server did not start: 127.0.0.1:{port} could not be bound.', file=sys.stderr, flush=True)
        raise
    try:
        initialize()
        ready(server.server_port)
        server.serve_forever()
    finally:
        server.server_close()
