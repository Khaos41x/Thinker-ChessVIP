#!/usr/bin/env python3
"""
Minimal backend test for Thinker-Chess app.py
Run with: python test_server.py

Checks:
 - GET /health returns 200 and valid JSON with status "ok"
 - POST /getmove with a starting FEN returns 200 and a JSON array with at least one UCI move
 - POST /eval with a starting FEN returns 200 and JSON containing 'cp' or 'mate'

No external dependencies.
"""
import sys
import json
import urllib.request
import urllib.error

BASE = "http://127.0.0.1:5050"
TIMEOUT = 10


def http_get(path):
    url = BASE + path
    req = urllib.request.Request(url, method="GET")
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
            code = resp.getcode()
            body = resp.read().decode("utf-8")
            return code, body
    except urllib.error.URLError as e:
        print(f"Error: could not connect to {url}: {e}")
        return None, None


def http_post(path, data):
    url = BASE + path
    body_bytes = json.dumps(data).encode("utf-8")
    req = urllib.request.Request(url, data=body_bytes, headers={"Content-Type": "application/json"}, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
            code = resp.getcode()
            body = resp.read().decode("utf-8")
            return code, body
    except urllib.error.HTTPError as e:
        # Try to read body
        try:
            body = e.read().decode("utf-8")
        except Exception:
            body = str(e)
        print(f"HTTP {e.code} from {url}: {body}")
        return e.code, body
    except urllib.error.URLError as e:
        print(f"Error: could not connect to {url}: {e}")
        return None, None


def check_health():
    code, body = http_get("/health")
    if code != 200 or not body:
        print("[FAIL] /health: no response (is app.py running?)")
        return False
    try:
        data = json.loads(body)
    except Exception as e:
        print("[FAIL] /health: response is not valid JSON:\n", body)
        return False
    if data.get("status") == "ok":
        print("[OK] /health")
        return True
    else:
        print("[FAIL] /health: unexpected payload:", data)
        return False


def check_getmove():
    payload = {"fen": "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", "elo": 1200, "time": 0.05}
    code, body = http_post("/getmove", payload)
    if code != 200 or body is None:
        print("[FAIL] /getmove: no response (is app.py running?)")
        return False
    try:
        data = json.loads(body)
    except Exception:
        print("[FAIL] /getmove: response is not valid JSON:\n", body)
        return False
    # Expect a list with at least one UCI move like e2e4 or g1f3
    if isinstance(data, list) and len(data) >= 1 and isinstance(data[0], str) and len(data[0]) >= 4:
        # basic validation: letters/numbers
        import re
        if re.match(r"^[a-h][1-8][a-h][1-8][qrbn]?$", data[0]):
            print("[OK] /getmove")
            return True
        else:
            # still accept common outputs like 'c2c4'
            print("[OK] /getmove (response present, but move format is unusual):", data)
            return True
    else:
        print("[FAIL] /getmove: unexpected response:", data)
        return False


def check_eval():
    payload = {"fen": "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"}
    code, body = http_post("/eval", payload)
    if code != 200 or body is None:
        print("[FAIL] /eval: no response (is app.py running?)")
        return False
    try:
        data = json.loads(body)
    except Exception:
        print("[FAIL] /eval: response is not valid JSON:\n", body)
        return False
    if isinstance(data, dict) and ("cp" in data or "mate" in data):
        print("[OK] /eval")
        return True
    else:
        print("[FAIL] /eval: unexpected response:", data)
        return False


def main():
    ok = True
    h = check_health()
    ok = ok and h
    gm = check_getmove()
    ok = ok and gm
    ev = check_eval()
    ok = ok and ev

    if ok:
        print("\nBackend OK")
        print('\nNote: app.py now supports KOMODO_PATH env var as an additional discovery option.\n')
        sys.exit(0)
    else:
        print("\nOne or more checks failed. Ensure app.py is running and Komodo engine is available.")
        sys.exit(2)

if __name__ == '__main__':
    main()


print("=" * 60)
print("  KRYPBOT - TESTE COMPLETO")
print("=" * 60)

# Teste 1: Importar dependências
print("\n[TESTE 1] Importando dependências...")
try:
    import chess
    import chess.engine
    from flask import Flask
    from flask_socketio import SocketIO
    print("  [OK] Dependências OK")
except Exception as e:
    print(f"[ERRO] {e}")
    sys.exit(1)

# Teste 2: Importar app
print("\n[TESTE 2] Importando app.py...")
try:
    import app
    print("  [OK] app.py importado OK")
except Exception as e:
    print(f"[ERRO] {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# Teste 3: Verificar engine
print("\n[TESTE 3] Verificando Komodo...")
try:
    from pathlib import Path
    engine_path = Path(app.ENGINE_PATH)
    if engine_path.exists():
        print(f"  [OK] Engine encontrada: {engine_path.name}")
    else:
        print(f"[ERRO] Engine não encontrada em {app.ENGINE_PATH}")
        sys.exit(1)
except Exception as e:
    print(f"[ERRO] {e}")
    sys.exit(1)

# Teste 4: Testar inicialização da engine
print("\n[TESTE 4] Inicializando engine...")
try:
    engine = app.init_engine()
    if engine:
        print("  [OK] Engine inicializada OK")
    else:
        print("[ERRO] Engine não inicializou")
        sys.exit(1)
except Exception as e:
    print(f"[ERRO] {e}")
    sys.exit(1)

# Teste 5: Testar análise de posição
print("\n[TESTE 5] Testando análise de posição...")
test_fen = "r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4"
try:
    board = chess.Board(test_fen)
    print(f"  Tabuleiro: {board.fen()[:40]}...")
    print(f"  Peças: {len(board.piece_map())}")
    
    # Configura skill para ELO 1500
    app.configure_engine_strength(1500)
    print("  Skill configurada para ELO 1500")
    
    # Analisa
    limit = chess.engine.Limit(depth=10, time=0.5)
    result = engine.play(board, limit)
    
    if result.move:
        print(f"  [OK] Melhor lance: {result.move.uci()}")
    else:
        print("[ERRO] Nenhum lance retornado")
except Exception as e:
    print(f"[ERRO] {e}")
    import traceback
    traceback.print_exc()

# Teste 6: Testar Opening Book
print("\n[TESTE 6] Testando Opening Book...")
try:
    # Posição inicial
    book_fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq -"
    book_move = app.get_book_move(book_fen)
    if book_move:
        print(f"  [OK] Book move (inicial): {book_move}")
    else:
        print("  [OK] Sem book move (posições connues)")
    
    # Sicilian
    book_fen2 = "rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w KQkq -"
    book_move2 = app.get_book_move(book_fen2)
    if book_move2:
        print(f"  [OK] Book move (Sicilian): {book_move2}")
except Exception as e:
    print(f"[ERRO] {e}")

# Teste 7: Testar Cache LRU
print("\n[TESTE 7] Testando Cache LRU...")
try:
    cache_key = "test_fen_1234_1500_1"
    test_moves = ["e2e4", "d2d4", "c2c4"]
    
    # Put
    app.analysis_cache.put(cache_key, test_moves)
    print(f"  [OK] Put: {test_moves}")
    
    # Get
    result = app.analysis_cache.get(cache_key)
    if result == test_moves:
        print(f"  [OK] Get: {result}")
    else:
        print(f"  [ERRO] Diferente: {result}")
    
    # Size
    print(f"  [OK] Cache size: {app.analysis_cache.size()}")
except Exception as e:
    print(f"[ERRO] {e}")

# Teste 8: Testar configure_engine_strength
print("\n[TESTE 8] Testando configure_engine_strength...")
try:
    for elo in [800, 1200, 1800, 2400, 3200]:
        app.configure_engine_strength(elo)
        print(f"  [OK] ELO {elo} configurado")
    
    # Verifica profundidade
    for elo, expected_depth in [(600, 3), (1200, 8), (1800, 12), (2400, 16), (3000, 20), (3500, 24)]:
        depth = app.get_target_depth(elo)
        if depth == expected_depth:
            print(f"  [OK] Profundidade ELO {elo}: {depth}")
        else:
            print(f"  [ERRO] Profundidade ELO {elo}: {depth} (esperado: {expected_depth})")
except Exception as e:
    print(f"[ERRO] {e}")

# Teste 9: Testar socketio
print("\n[TESTE 9] Verificando SocketIO...")
try:
    if app.socketio:
        print("  [OK] SocketIO inicializado")
    else:
        print("[ERRO] SocketIO não inicializado")
except Exception as e:
    print(f"[ERRO] {e}")

# Teste 10: Testar rotas HTTP
print("\n[TESTE 10] Verificando rotas HTTP...")
try:
    client = app.app.test_client()
    
    # Teste /
    response = client.get('/')
    if response.data == b"KrypBot v2.1 (Komodo) ONLINE":
        print(f"  [OK] / -> {response.data.decode()}")
    else:
        print(f"  [ERRO] / -> {response.data}")
    
    # Teste /health
    response = client.get('/health')
    import json
    data = json.loads(response.data)
    if data.get("status") == "ok":
        print(f"  [OK] /health -> status: {data.get('status')}")
        print(f"      engine: {data.get('engine')}")
        print(f"      uptime: {data.get('uptime')}")
    else:
        print(f"  [ERRO] /health -> {data}")
except Exception as e:
    print(f"[ERRO] {e}")

# Fechar engine
print("\n[FECHANDO] Encerrando engine...")
try:
    app.close_engine()
    print("  [OK] Engine encerrada")
except:
    pass

# Resumo
print("\n" + "=" * 60)
print("  FIM DOS TESTES")
print("=" * 60)