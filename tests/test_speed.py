# =========================================================
# TESTE DE VELOCIDADE DO KRYPBOT
# =========================================================

import sys
import io
import time
import statistics
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

try:
    import requests
except ImportError:
    print("[ERRO] Instale requests: pip install requests")
    sys.exit(1)

SERVER_URL = "http://127.0.0.1:5050/getMove"
TARGET_LATENCY_MS = 75  # 50ms engine + 25ms overhead
ITERATIONS = 20

# Posição inicial - a mais comum
payload = {
    "fen": "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    "elo": 3200,
    "time": 0.03  # 30ms - super rápido
}

print("=" * 60)
print("  KRYPBOT - TESTE DE VELOCIDADE")
print("=" * 60)
print(f"\nAlvo: {TARGET_LATENCY_MS}ms por requisição")
print(f"Engine time: {payload['time']}s\n")

latencies = []
session = requests.Session()

# Warm-up
print("Aquecendo motores...", end=" ")
try:
    response = session.post(SERVER_URL, json=payload, timeout=5)
    print(f"OK - {response.json()}")
except Exception as e:
    print(f"ERRO: {e}")
    print("\nCertifique-se que o servidor está rodando: python app.py")
    sys.exit(1)

print(f"\n{'REQ #':<10} {'STATUS':<10} {'LATENCIA':<15}")
print("-" * 40)

for i in range(ITERATIONS):
    start = time.perf_counter()
    response = session.post(SERVER_URL, json=payload)
    end = time.perf_counter()
    
    latency_ms = (end - start) * 1000
    latencies.append(latency_ms)
    
    status = "OK" if response.status_code == 200 else "ERRO"
    color = "\033[92m" if latency_ms <= TARGET_LATENCY_MS else "\033[91m"
    reset = "\033[0m"
    print(f"{i+1:<10} {status:<10} {color}{latency_ms:.2f}ms{reset}")

avg_latency = statistics.mean(latencies)
min_latency = min(latencies)
max_latency = max(latencies)

print("-" * 40)
print(f"\nRESULTADOS:")
print(f"  Media: {avg_latency:.2f}ms")
print(f"  Minima: {min_latency:.2f}ms")
print(f"  Maxima: {max_latency:.2f}ms")

if avg_latency <= TARGET_LATENCY_MS:
    print(f"\n\033[92mSUCESSO: Sistema ultra-rapido!\033[0m")
else:
    print(f"\n\033[91mATENCAO: Esta {avg_latency - TARGET_LATENCY_MS:.2f}ms acima do alvo\033[0m")