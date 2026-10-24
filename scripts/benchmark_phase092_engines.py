import json
import statistics
import sys
import time
from pathlib import Path

import chess
import psutil

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from core.eval_bar.registry import ENGINE_IDS, NAMES, NativeAnalysisService
from core.eval_bar.stockfish_service import StockfishEvalBarService

POSITIONS = (
    ('initial', chess.STARTING_FEN),
    ('middlegame', 'r2q1rk1/pp1bbppp/2np1n2/2p1p3/4P3/2NP1N2/PPPQBPPP/R1B1K2R w KQ - 4 9'),
    ('endgame', '8/5pk1/6p1/3p4/3P4/5P2/5KPP/8 w - - 0 35'),
)
OUTPUT = ROOT / '_bmad-output/implementation-artifacts/phase09-2/engines'


def clock_ms():
    return time.perf_counter() * 1000


def benchmark(engine_id, name):
    if engine_id == ENGINE_IDS[2]:
        service = NativeAnalysisService(ROOT / 'engine/komodo-14.1-64bit.exe')
    else:
        service = StockfishEvalBarService(root=ROOT, build='sf_19' if engine_id == ENGINE_IDS[1] else 'sf_19_smallnet')
    try:
        started = clock_ms()
        service.start()
        cold = clock_ms() - started
        started = clock_ms()
        service.start()
        warm = clock_ms() - started
        status = service.status()
        process = psutil.Process(status['pid'])
        rows = []
        for budget in (200, 1000, 3000):
            for label, fen in POSITIONS:
                for repetition in range(2):
                    first = None
                    progress = []
                    peak_rss = process.memory_info().rss
                    before_cpu = sum(process.cpu_times()[:2])
                    launched = clock_ms()
                    final = None
                    for event in service.evaluate_stream(fen, f'phase092:{budget}:{label}:{repetition}', movetime_ms=budget):
                        peak_rss = max(peak_rss, process.memory_info().rss)
                        result = event.get('result')
                        if not result:
                            continue
                        elapsed = clock_ms() - launched
                        if first is None:
                            first = elapsed
                        progress.append({'elapsedMs': elapsed, 'depth': result.get('depth'), 'type': event['type']})
                        final = result
                    wall = clock_ms() - launched
                    cpu_seconds = sum(process.cpu_times()[:2]) - before_cpu
                    assert final and final.get('depth', 0) > 0
                    rows.append({'budgetMs': budget, 'position': label, 'fen': fen, 'repetition': repetition,
                        'firstEvaluationMs': first, 'within200Ms': first <= 200, 'finalLatencyMs': wall,
                        'depth': final.get('depth'), 'cp': final.get('cp'), 'mate': final.get('mate'),
                        'nodes': final.get('nodes'), 'progression': progress, 'peakRssBytes': peak_rss,
                        'cpuSeconds': cpu_seconds, 'cpuPercentOfOneCore': cpu_seconds / (wall / 1000) * 100})
            print(name, budget, 'ms completed', flush=True)
        pid = status['pid']
        close_at = clock_ms()
        service.close()
        closed_ms = clock_ms() - close_at
        return {'id': engine_id, 'name': name, 'verifiedStatus': status, 'coldVerifiedInitializationMs': cold,
            'warmInitializationMs': warm, 'positions': rows, 'cleanupMs': closed_ms,
            'processExited': not psutil.pid_exists(pid),
            'summary': [{'budgetMs': budget,
                'medianFirstEvaluationMs': statistics.median(r['firstEvaluationMs'] for r in rows if r['budgetMs'] == budget),
                'medianFinalLatencyMs': statistics.median(r['finalLatencyMs'] for r in rows if r['budgetMs'] == budget),
                'medianDepth': statistics.median(r['depth'] for r in rows if r['budgetMs'] == budget),
                'peakRssMiB': max(r['peakRssBytes'] for r in rows if r['budgetMs'] == budget) / 1048576,
                'meanCpuPercentOfOneCore': statistics.mean(r['cpuPercentOfOneCore'] for r in rows if r['budgetMs'] == budget),
                'evaluationsWithin200Ms': sum(r['within200Ms'] for r in rows if r['budgetMs'] == budget),
                'evaluations': sum(r['budgetMs'] == budget for r in rows)} for budget in (200, 1000, 3000)]}
    finally:
        service.close()


def main():
    OUTPUT.mkdir(parents=True, exist_ok=True)
    report = {'conditions': {'threads': 3, 'hashMiB': 16, 'multiPv': 1, 'repetitions': 2,
        'budgetsMs': [200, 1000, 3000], 'engineRunsSequential': True,
        'cache': 'Warm runtime and engine transposition table; identical position/budget order. Cold verified startup recorded separately.',
        'memory': 'Process RSS including WASM worker threads; NNUE file size is not runtime memory.',
        'timing': 'Python receipt of actual streamed score, includes transport; requested search budget is not a hard wall-clock deadline.'},
        'engines': [benchmark(engine_id, name) for engine_id, name in zip(ENGINE_IDS, NAMES)]}
    (OUTPUT / 'benchmark.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf8')
    lines = ['# Controlled engine response comparison', '',
        'Real installed builds; Threads3, Hash16MiB, MultiPV1. Two repetitions of three identical FENs. Warm transposition tables retained in identical run order; these measurements are not playing-strength comparisons.', '',
        '| Engine | Budget ms | First score median ms | Complete median ms | Median depth | Peak RSS MiB | Mean CPU % one core | Scores received within200ms |',
        '|---|---:|---:|---:|---:|---:|---:|---:|']
    startup = []
    for engine in report['engines']:
        for row in engine['summary']:
            lines.append(f"| {engine['name']} | {row['budgetMs']} | {row['medianFirstEvaluationMs']:.1f} | {row['medianFinalLatencyMs']:.1f} | {row['medianDepth']:.1f} | {row['peakRssMiB']:.1f} | {row['meanCpuPercentOfOneCore']:.1f} | {row['evaluationsWithin200Ms']}/{row['evaluations']} |")
        startup += ['', f"{engine['name']}: cold verified startup {engine['coldVerifiedInitializationMs']:.1f}ms, warm start {engine['warmInitializationMs']:.2f}ms, cleanup {engine['cleanupMs']:.1f}ms, owned process exited: {engine['processExited']}.", '']
    lines += startup
    lines += ['Requested200ms search time does not guarantee completion within200ms. All engines can emit early evaluations; compare observed availability rather than claiming a unique fast-response engine. Depth is engine-specific and is not a common strength unit.',
        'CPU is relative to one logical core and can exceed100% with three search threads. RSS includes engine/runtime allocations. Startup includes UCI readiness and actual network/search verification; network file sizes remain distinct from process memory.']
    (OUTPUT / 'BENCHMARK.md').write_text('\n'.join(lines) + '\n', encoding='utf8')
    print('Saved', OUTPUT / 'BENCHMARK.md')


if __name__ == '__main__':
    main()
