from __future__ import annotations

import argparse
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass
from pathlib import Path
from statistics import median
from threading import Barrier
from typing import Callable

import chess

from .io import write_immutable_json
from .prepare_benchmark import HASH_MB, MOVE_TIME_MS, SUBJECT_OPTIONS, file_sha256
from .run_matches import EngineAdapter, PythonChessUciAdapter


PREFLIGHT_FEN = "r2q1rk1/pp2bppp/2n1pn2/2bp4/8/1PN1PN2/PBQP1PPP/R3KB1R w KQ - 2 10"


@dataclass(frozen=True, slots=True)
class ProbeSpec:
    role: str
    engine_id: str
    binary_sha256: str
    options: tuple[tuple[str, str | int | bool], ...]


def _probe_pair(
    subject_factory: Callable[[], EngineAdapter],
    reference_factory: Callable[[], EngineAdapter],
    subject: ProbeSpec,
    reference: ProbeSpec,
    samples: int,
    barrier: Barrier | None,
) -> dict[str, tuple[tuple[float, ...], int, float, tuple[tuple[str, str], ...]]]:
    engines = {
        "subject": subject_factory(),
        "reference": reference_factory(),
    }
    specs = {"subject": subject, "reference": reference}
    try:
        board = chess.Board(PREFLIGHT_FEN)
        identities: dict[str, tuple[tuple[str, str], ...]] = {}
        for role in ("subject", "reference"):
            engine = engines[role]
            spec = specs[role]
            identity = tuple(sorted(engine.identity().items()))
            if dict(identity).get("name") != spec.engine_id:
                raise ValueError(f"{role} UCI identity does not exactly match {spec.engine_id}")
            identities[role] = identity
            engine.configure(dict(spec.options))
            engine.new_game()
            engine.clear_hash()
            engine.ready()
            engine.play(board, MOVE_TIME_MS)
        if barrier is not None:
            barrier.wait(timeout=30)
        values: dict[str, list[float]] = {"subject": [], "reference": []}
        nodes: dict[str, int] = {"subject": 0, "reference": 0}
        seconds: dict[str, float] = {"subject": 0.0, "reference": 0.0}
        for _ in range(samples):
            for role in ("subject", "reference"):
                engine = engines[role]
                engine.clear_hash()
                engine.ready()
                move = engine.play(board, MOVE_TIME_MS)
                if move.nodes <= 0 or move.elapsed_seconds <= 0:
                    raise ValueError(f"{role} returned invalid NPS telemetry")
                values[role].append(move.nodes / move.elapsed_seconds)
                nodes[role] += move.nodes
                seconds[role] += move.elapsed_seconds
        return {
            role: (tuple(values[role]), nodes[role], seconds[role], identities[role])
            for role in ("subject", "reference")
        }
    finally:
        for engine in engines.values():
            try:
                engine.close()
            except Exception:
                pass


def _measure_mixed(
    subject_factory: Callable[[], EngineAdapter],
    reference_factory: Callable[[], EngineAdapter],
    subject: ProbeSpec,
    reference: ProbeSpec,
    workers: int,
    samples: int,
) -> dict[str, tuple[tuple[float, ...], int, float, tuple[tuple[str, str], ...]]]:
    barrier = Barrier(workers) if workers > 1 else None
    with ThreadPoolExecutor(max_workers=workers, thread_name_prefix="preflight-pair") as executor:
        batches = tuple(executor.map(lambda _: _probe_pair(subject_factory, reference_factory, subject, reference, samples, barrier), range(workers)))
    result = {}
    for role in ("subject", "reference"):
        identities = {batch[role][3] for batch in batches}
        if len(identities) != 1:
            raise ValueError(f"{role} workers reported inconsistent UCI identities")
        result[role] = (
            tuple(value for batch in batches for value in batch[role][0]),
            sum(batch[role][1] for batch in batches),
            sum(batch[role][2] for batch in batches),
            identities.pop(),
        )
    return result


def run_preflight(
    subject_factory: Callable[[], EngineAdapter],
    reference_factory: Callable[[], EngineAdapter],
    subject: ProbeSpec,
    reference: ProbeSpec,
    *,
    loaded_workers: int = 4,
    samples_per_worker: int = 3,
    maximum_drift_fraction: float = 0.2,
    hardware_fingerprint: str = "test-hardware",
) -> dict[str, object]:
    if not 2 <= loaded_workers <= 4:
        raise ValueError("loaded_workers must be in [2, 4]")
    if samples_per_worker <= 0:
        raise ValueError("samples_per_worker must be positive")
    if not 0 <= maximum_drift_fraction < 1:
        raise ValueError("maximum_drift_fraction must be in [0, 1)")
    if not hardware_fingerprint.strip():
        raise ValueError("hardware_fingerprint must be non-empty")
    expected_subject = SUBJECT_OPTIONS + (("Skill", 25),)
    expected_reference = (("Threads", 1), ("Hash", HASH_MB), ("MultiPV", 1), ("Ponder", False), ("UCI_LimitStrength", True), ("UCI_Elo", 2100))
    if subject.role != "subject" or subject.options != expected_subject:
        raise ValueError("subject preflight options violate the frozen engine profile")
    if reference.role != "reference" or reference.options != expected_reference:
        raise ValueError("reference preflight options violate the frozen engine profile")
    isolated_results = _measure_mixed(subject_factory, reference_factory, subject, reference, 1, samples_per_worker)
    loaded_results = _measure_mixed(subject_factory, reference_factory, subject, reference, loaded_workers, samples_per_worker)
    results: dict[str, object] = {}
    safe = True
    for spec in (subject, reference):
        isolated, isolated_nodes, isolated_seconds, isolated_identity = isolated_results[spec.role]
        loaded, loaded_nodes, loaded_seconds, loaded_identity = loaded_results[spec.role]
        if isolated_identity != loaded_identity:
            raise ValueError(f"{spec.role} UCI identity changed between measurements")
        isolated_median = median(isolated)
        loaded_median = median(loaded)
        isolated_pooled = isolated_nodes / isolated_seconds
        loaded_pooled = loaded_nodes / loaded_seconds
        drift = max(0.0, (isolated_pooled - loaded_pooled) / isolated_pooled)
        safe = safe and drift <= maximum_drift_fraction
        results[spec.role] = {
            "binarySha256": spec.binary_sha256,
            "engineId": spec.engine_id,
            "uciIdentity": dict(isolated_identity),
            "isolatedNps": list(isolated),
            "isolatedNpsMedian": isolated_median,
            "isolatedNpsPooled": isolated_pooled,
            "loadedNps": list(loaded),
            "loadedNpsMedian": loaded_median,
            "loadedNpsPooled": loaded_pooled,
            "npsDriftFraction": drift,
        }
    return {
        "schemaVersion": 1,
        "hardwareFingerprint": hardware_fingerprint,
        "moveTimeMs": MOVE_TIME_MS,
        "loadedWorkers": loaded_workers,
        "samplesPerWorker": samples_per_worker,
        "maximumDriftFraction": maximum_drift_fraction,
        "engines": results,
        "safeWorkerRecommendation": loaded_workers if safe else 1,
        "verdict": "pass" if safe else "fail",
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Measure isolated and loaded engine NPS before a calibration campaign")
    parser.add_argument("--subject-engine", required=True)
    parser.add_argument("--reference-engine", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--workers", type=int, default=4)
    parser.add_argument("--samples", type=int, default=3)
    parser.add_argument("--maximum-drift", type=float, default=0.2)
    parser.add_argument("--hardware-fingerprint", required=True)
    args = parser.parse_args()
    subject = ProbeSpec(
        "subject",
        "Komodo 14.1 64-bit",
        file_sha256(args.subject_engine),
        (
            *SUBJECT_OPTIONS,
            ("Skill", 25),
        ),
    )
    reference = ProbeSpec(
        "reference",
        "Stockfish 19",
        file_sha256(args.reference_engine),
        (("Threads", 1), ("Hash", HASH_MB), ("MultiPV", 1), ("Ponder", False), ("UCI_LimitStrength", True), ("UCI_Elo", 2100)),
    )
    report = run_preflight(
        lambda: PythonChessUciAdapter(args.subject_engine),
        lambda: PythonChessUciAdapter(args.reference_engine),
        subject,
        reference,
        loaded_workers=args.workers,
        samples_per_worker=args.samples,
        maximum_drift_fraction=args.maximum_drift,
        hardware_fingerprint=args.hardware_fingerprint,
    )
    write_immutable_json(Path(args.output), report)
    return 0 if report["verdict"] == "pass" else 1


if __name__ == "__main__":
    raise SystemExit(main())
