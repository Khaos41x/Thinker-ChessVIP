import argparse
import json
import statistics
import sys
import threading
import time
from pathlib import Path

import chess
import chess.engine
import psutil

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from core.eval_bar import StockfishEvalBarCancelled, StockfishEvalBarService


POSITIONS = (
    ("initial", chess.STARTING_FEN),
    ("middlegame", "r2q1rk1/pp1bbppp/2np1n2/2p1p3/4P3/2NP1N2/PPPQBPPP/R1B1K2R w KQ - 4 9"),
    ("endgame", "8/5pk1/6p1/3p4/3P4/5P2/5KPP/8 w - - 0 35"),
)


def process_metrics(pid, operation):
    process = psutil.Process(pid)
    before_cpu = process.cpu_times()
    peak_rss = process.memory_info().rss
    result = {}
    error = []

    def run():
        try:
            result["value"] = operation()
        except Exception as exception:
            error.append(exception)

    started = time.perf_counter()
    worker = threading.Thread(target=run)
    worker.start()
    while worker.is_alive():
        try:
            peak_rss = max(peak_rss, process.memory_info().rss)
        except psutil.Error:
            pass
        worker.join(0.05)
    elapsed = time.perf_counter() - started
    if error:
        raise error[0]
    after_cpu = process.cpu_times()
    cpu_seconds = (after_cpu.user + after_cpu.system) - (before_cpu.user + before_cpu.system)
    return result["value"], {
        "wallMs": elapsed * 1000,
        "cpuPercentOfOneCore": cpu_seconds / elapsed * 100 if elapsed else 0,
        "peakRssBytes": peak_rss,
    }


def benchmark_smallnet(movetime_ms, soak_seconds):
    service = StockfishEvalBarService(timeout_seconds=max(20, movetime_ms / 1000 + 8))
    try:
        launched = time.perf_counter()
        service._ensure_started(max(20, movetime_ms / 1000 + 8))
        startup_wall_ms = (time.perf_counter() - launched) * 1000
        first, first_metrics = process_metrics(
            service.pid,
            lambda: service.evaluate(POSITIONS[0][1], "benchmark-startup", movetime_ms=movetime_ms),
        )
        rows = [{"position": POSITIONS[0][0], "evaluation": first, **first_metrics}]
        print("Smallnet reference position 1/3 complete", file=sys.stderr, flush=True)
        for index, (name, fen) in enumerate(POSITIONS[1:], 1):
            value, metrics = process_metrics(
                service.pid,
                lambda fen=fen, index=index: service.evaluate(fen, f"benchmark-{index}", movetime_ms=movetime_ms),
            )
            rows.append({"position": name, "evaluation": value, **metrics})
            print(f"Smallnet reference position {index + 1}/3 complete", file=sys.stderr, flush=True)

        soak_started = time.perf_counter()
        soak_samples = []
        soak_count = 0
        while time.perf_counter() - soak_started < soak_seconds:
            name, fen = POSITIONS[soak_count % len(POSITIONS)]
            service.evaluate(fen, f"benchmark-soak-{soak_count}", movetime_ms=min(1000, movetime_ms))
            soak_samples.append({
                "elapsedMs": (time.perf_counter() - soak_started) * 1000,
                "position": name,
                "rssBytes": psutil.Process(service.pid).memory_info().rss,
            })
            soak_count += 1
        print(f"Smallnet soak complete ({soak_count} positions)", file=sys.stderr, flush=True)

        cancellation = {}
        superseded_at = {}

        def obsolete():
            try:
                service.evaluate(POSITIONS[0][1], "benchmark-obsolete", movetime_ms=max(1000, movetime_ms))
            except StockfishEvalBarCancelled:
                cancellation["observedAfterSupersessionMs"] = (
                    time.perf_counter() - superseded_at["value"]
                ) * 1000

        thread = threading.Thread(target=obsolete)
        thread.start()
        time.sleep(0.2)
        superseded_at["value"] = time.perf_counter()
        service.evaluate(POSITIONS[1][1], "benchmark-newest", movetime_ms=min(250, movetime_ms))
        thread.join()
        print("Smallnet cancellation measurement complete", file=sys.stderr, flush=True)
        status = service.status()
        rss_after = psutil.Process(service.pid).memory_info().rss
        rss_values = [sample["rssBytes"] for sample in soak_samples]
        return {
            "identity": status["identity"],
            "startupWallMs": startup_wall_ms,
            "positions": rows,
            "cancellation": cancellation,
            "soak": {
                "requestedSeconds": soak_seconds,
                "completedPositions": soak_count,
                "samples": soak_samples,
                "minRssBytes": min(rss_values) if rss_values else rss_after,
                "maxRssBytes": max(rss_values) if rss_values else rss_after,
                "rssGrowthBytes": (rss_values[-1] - rss_values[0]) if len(rss_values) > 1 else 0,
            },
            "rssAfterBytes": rss_after,
            "meanNps": statistics.mean(row["evaluation"]["nps"] for row in rows),
            "meanDepth": statistics.mean(row["evaluation"]["depth"] for row in rows),
            "meanFirstInfoMs": statistics.mean(row["evaluation"]["firstInfoMs"] for row in rows),
        }
    finally:
        service.close()


def benchmark_komodo(seconds):
    repository = Path(__file__).resolve().parents[1]
    candidates = (
        repository / "engine" / "komodo-14.1-64bit.exe",
        repository / "engine" / "komodo-14.1-64bit-bmi2.exe",
        repository / "engine" / "komodo.exe",
    )
    executable = next((candidate for candidate in candidates if candidate.exists()), None)
    if executable is None:
        return {"engine": "Komodo 14.1", "unavailable": "binary not found", "positions": []}
    engine = chess.engine.SimpleEngine.popen_uci(str(executable), timeout=10)
    engine.configure({"Threads": 3, "Hash": 16, "Skill": 25})
    pid = engine.transport.get_pid()
    rows = []
    try:
        for name, fen in POSITIONS:
            board = chess.Board(fen)
            lines, metrics = process_metrics(
                pid,
                lambda board=board: engine.analyse(board, chess.engine.Limit(time=seconds), multipv=1),
            )
            info = lines[0]
            score = info["score"].white()
            rows.append({
                "position": name,
                **metrics,
                "depth": info.get("depth", 0),
                "nodes": info.get("nodes", 0),
                "nps": info.get("nps", 0),
                "cp": None if score.is_mate() else score.score(),
                "mate": score.mate() if score.is_mate() else None,
            })
            print(f"Komodo reference position {len(rows)}/3 complete", file=sys.stderr, flush=True)
    finally:
        engine.close()
    return {
        "engine": "Komodo 14.1",
        "comparisonProfile": "matched-search-profile-not-production-defaults",
        "profile": {"threads": 3, "hash": 16, "multiPv": 1, "skill": 25},
        "positions": rows,
    }


def markdown(report):
    lines = [
        "# Eval Bar Engine Benchmark",
        "",
        f"Search time: {report['conditions']['movetimeMs']} ms; Threads=3, Hash=16 MB, MultiPV=1 for Smallnet.",
        "",
        "| Engine | Position | Depth | NPS | Wall ms | CPU % one core | Score |",
        "|---|---|---:|---:|---:|---:|---:|",
    ]
    for row in report["stockfish"]["positions"]:
        value = row["evaluation"]
        score = f"#{value['mate']}" if value["mate"] is not None else f"{value['cp'] / 100:+.2f}"
        lines.append(f"| Stockfish 19 Smallnet | {row['position']} | {value['depth']} | {value['nps']} | {row['wallMs']:.1f} | {row['cpuPercentOfOneCore']:.1f} | {score} |")
    if report.get("komodo"):
        for row in report["komodo"]["positions"]:
            score = f"#{row['mate']}" if row["mate"] is not None else f"{row['cp'] / 100:+.2f}"
            lines.append(f"| Komodo 14.1 | {row['position']} | {row['depth']} | {row['nps']} | {row['wallMs']:.1f} | {row['cpuPercentOfOneCore']:.1f} | {score} |")
    lines.extend([
        "",
        f"Smallnet startup: {report['stockfish']['startupWallMs']:.1f} ms; mean first evaluation: {report['stockfish']['meanFirstInfoMs']:.1f} ms.",
        f"Smallnet RSS after the run: {report['stockfish']['rssAfterBytes'] / 1048576:.1f} MiB.",
        f"Cancellation observed after supersession: {report['stockfish']['cancellation'].get('observedAfterSupersessionMs', float('nan')):.1f} ms.",
        f"Smallnet soak: {report['stockfish']['soak']['completedPositions']} positions over {report['stockfish']['soak']['requestedSeconds']} s; RSS growth {report['stockfish']['soak']['rssGrowthBytes'] / 1048576:+.1f} MiB.",
        "Komodo comparison uses the documented matched search profile (Threads=3, Hash=16 MB, MultiPV=1, Skill=25), not production defaults.",
        "",
    ])
    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--movetime-ms", type=int, default=8000)
    parser.add_argument("--soak-seconds", type=int, default=30)
    parser.add_argument("--skip-komodo", action="store_true")
    parser.add_argument(
        "--output",
        default=str(
            Path(__file__).resolve().parents[1]
            / "_bmad-output"
            / "implementation-artifacts"
            / "stockfish-19-smallnet-benchmark"
        ),
    )
    args = parser.parse_args()
    report = {
        "schemaVersion": 1,
        "conditions": {
            "movetimeMs": args.movetime_ms,
            "soakSeconds": args.soak_seconds,
            "positions": [name for name, _ in POSITIONS],
        },
        "stockfish": benchmark_smallnet(args.movetime_ms, args.soak_seconds),
    }
    if not args.skip_komodo:
        report["komodo"] = benchmark_komodo(args.movetime_ms / 1000)
    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.with_suffix(".json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    output.with_suffix(".md").write_text(markdown(report), encoding="utf-8")
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
