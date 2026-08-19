# AGENTS.md — Thinker Chess VIP

Projeto: userscript Tampermonkey + servidor Flask local que integra com Chess.com.
Stack: Python 3.12 / Flask / Flask-SocketIO / flask-cors / python-chess / engine Komodo 14.1 / SQLite (users.db) / frontend JS (script.js).

## Rodar
- Servidor: `python app.py` (porta padrão do Flask)
- Admin: `python admin.py`
- DB init: `python database.py`

## Testes (python direto, sem pytest)
- Backend: `python tests/test_server.py`
- Engine: `python tests/test_engine_speed.py`
- Latência: `python tests/test_latency.py`
- Speed experiments: `tests/speed*.py`

## Estrutura
- `app.py` — servidor/API + SocketIO
- `database.py` — schema SQLite
- `admin.py` — painel admin
- `script.js` — userscript (front)
- `core/rating.py` — sistema de rating
- `tests/` — testes e experimentos de speed
- `scripts/` — utilitários one-off (fix de encoding/banner)
- `engine/komodo-14.1-64bit.exe` — engine (não commitar)
- `users.db` — banco (não commitar)

## Docs de referência (ler sob demanda, NÃO carregar todos de uma vez)
- `docs/DOC_app.md`, `docs/DOC_database.md`, `docs/DOC_script.md`, `docs/DOC_admin.md`, `docs/SESSION.md`, `docs/architecture/`

## Convenções
- Não comentar código sem pedido.
- Não commitar `users.db` nem segredos.
- Encoding UTF-8 (projeto já teve problemas de encoding: `scripts/fix_encoding.py`, `scripts/fix*.py`).
- Seguir o padrão do arquivo que estiver editando.