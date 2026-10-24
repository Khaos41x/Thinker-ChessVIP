import sys
import threading
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
import app
from werkzeug.serving import make_server


def main():
    app.initialize_engine()
    server = make_server('127.0.0.1', 0, app.app, threaded=True)
    worker = threading.Thread(target=server.serve_forever)
    worker.start()
    namespace = {'__file__': str(ROOT / 'tests/test_server.py'), '__name__': 'phase09_smoke'}
    source = (ROOT / 'tests/test_server.py').read_text(encoding='utf8').split("if __name__ == '__main__':")[0]
    exec(compile(source, str(ROOT / 'tests/test_server.py'), 'exec'), namespace)
    namespace['BASE'] = f'http://127.0.0.1:{server.server_port}'
    namespace['CAPABILITY'] = app.capability_store.ensure()
    try:
        assert namespace['check_health']()
        assert namespace['check_getmove']()
        assert namespace['check_eval']()
        legacy_pid = app.komodo.process_pid
        for engine_id in ('stockfish-19-1mb', 'stockfish-19-94mb', 'komodo-14.1', 'stockfish-19-1mb'):
            app.analysis_engine_registry.select(engine_id, persist=False)
            assert namespace['check_eval']()
            assert app.komodo.process_pid == legacy_pid, 'analysis switch terminated legacy Komodo'
        print('Legacy endpoint contracts and Komodo process ownership preserved')
    finally:
        server.shutdown()
        worker.join()
        server.server_close()
        app.analysis_engine_registry.close()
        app.stockfish_eval_bar.close()
        app.komodo.close()


if __name__ == '__main__':
    main()
