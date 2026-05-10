import requests
import time

url = "http://127.0.0.1:5050/getmove"
fens = [
    "r1bqkbnr/pppp1ppp/2n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3",
    "r1bqkbnr/pppp1ppp/2n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 4",
    "r1bqkbnr/pppp1ppp/2n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 5",
    "r1bqkbnr/pppp1ppp/2n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 6",
    "r1bqkbnr/pppp1ppp/2n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 7",
]

print("Starting latency test against app.py...")
try:
    for i, fen in enumerate(fens):
        data = {
            "fen": fen,
            "elo": 3200,
            "time": 0
        }
        start = time.perf_counter()
        res = requests.post(url, json=data)
        end = time.perf_counter()
        
        print(f"Move {i+1} time: {(end - start) * 1000:.2f} ms | Move: {res.json()}")
except requests.exceptions.ConnectionError:
    print("Error: Could not connect to http://127.0.0.1:5050. Is app.py running?")
