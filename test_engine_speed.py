# =========================================================
# TESTE DIRETO DE VELOCIDADE DA ENGINE
# =========================================================

import sys
import time
sys.stdout.reconfigure(encoding='utf-8')

import chess
import chess.engine

ENGINE_PATH = r"C:\Users\casa\Downloads\komodo-14\komodo-14_224afb\Windows\komodo-14.1-64bit.exe"

print("Iniciando Komodo...")
engine = chess.engine.SimpleEngine.popen_uci(ENGINE_PATH)
engine.configure({"Threads": 2, "Hash": 128})
print("Komodo ONLINE!")

def configure_elo(elo):
    skill = min(20, max(0, int((elo - 800) / 120)))
    engine.configure({"Skill": skill})
    print(f"ELO: {elo} -> Skill: {skill}")

# Posição inicial
test_fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq -"

# Warmup
print("\nWarmup...")
board = chess.Board(test_fen)
configure_elo(3200)
result = engine.play(board, chess.engine.Limit(time=0.03))
print(f"Warmup: {result.move.uci()}")

# Teste
print("\n" + "="*50)
print("TESTE DE VELOCIDADE - 20 iterações")
print("="*50)

times = []
for i in range(20):
    board = chess.Board(test_fen)
    start = time.perf_counter()
    result = engine.play(board, chess.engine.Limit(time=0.03))
    elapsed = (time.perf_counter() - start) * 1000
    times.append(elapsed)
    print(f"{i+1:2d}: {elapsed:6.2f}ms - {result.move.uci() if result.move else 'None'}")

print("="*50)
print(f"MIN:  {min(times):6.2f}ms")
print(f"MAX:  {max(times):6.2f}ms")
print(f"MEDIA:{sum(times)/len(times):6.2f}ms")
print("="*50)

engine.quit()
print("\nEncerrado.")