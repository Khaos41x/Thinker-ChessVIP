from __future__ import annotations

import argparse
from collections import defaultdict
from math import isfinite, log, log10, sqrt
from pathlib import Path

from .io import write_canonical_json
from .models import CellEstimate, GameOutcome, PairRecord, SubjectColor
from .run_matches import decode_pair


ESTIMATOR_VERSION = "pentanomial-delta-v1"
_Z_975 = 1.959963984540054


def _subject_points(pair: PairRecord) -> float:
    total = 0.0
    for game in pair.games:
        if game.outcome is GameOutcome.DRAW:
            total += 0.5
        elif (game.outcome is GameOutcome.WHITE_WIN) == (game.subject_color is SubjectColor.WHITE):
            total += 1.0
    return total


def _elo(score: float) -> float:
    return 400.0 * log10(score / (1.0 - score))


def estimate_cell(pairs: tuple[PairRecord, ...]) -> CellEstimate:
    if not pairs:
        raise ValueError("at least one pair is required")
    first = pairs[0]
    if any((pair.manifest_sha256, pair.skill, pair.reference_id, pair.reference_rating) != (first.manifest_sha256, first.skill, first.reference_id, first.reference_rating) for pair in pairs):
        raise ValueError("all pairs in a cell must share skill and reference")
    complete = tuple(pair for pair in pairs if pair.estimable)
    if not complete:
        raise ValueError("cell contains no estimable pairs")
    normalized = tuple(_subject_points(pair) / 2.0 for pair in complete)
    counts = [0, 0, 0, 0, 0]
    for value in normalized:
        counts[int(round(value * 4.0))] += 1
    count = len(normalized)
    score = sum(normalized) / count
    if score <= 0.0:
        delta = low = high = None
        boundary = "negative_infinity"
        weight = float(count)
    elif score >= 1.0:
        delta = low = high = None
        boundary = "positive_infinity"
        weight = float(count)
    else:
        delta = _elo(score)
        categories = (0.0, 0.25, 0.5, 0.75, 1.0)
        denominator = count + 2.5
        probabilities = tuple((observed + 0.5) / denominator for observed in counts)
        regularized_mean = sum(value * probability for value, probability in zip(categories, probabilities))
        pair_variance = sum(probability * (value - regularized_mean) ** 2 for value, probability in zip(categories, probabilities))
        standard_error = sqrt(pair_variance / count)
        derivative = 400.0 / (log(10.0) * score * (1.0 - score))
        elo_standard_error = derivative * standard_error
        low = delta - _Z_975 * elo_standard_error
        high = delta + _Z_975 * elo_standard_error
        elo_variance = elo_standard_error**2
        weight = 1.0 / elo_variance
        boundary = None
    return CellEstimate(1, ESTIMATOR_VERSION, first.manifest_sha256, first.skill, first.reference_id, first.reference_rating, tuple(counts), count, score, delta, low, high, weight, boundary)


def estimate_cells(pairs: tuple[PairRecord, ...]) -> tuple[CellEstimate, ...]:
    pair_ids = [pair.pair_id for pair in pairs]
    if len(set(pair_ids)) != len(pair_ids):
        raise ValueError("duplicate pair IDs are forbidden")
    manifests = {pair.manifest_sha256 for pair in pairs}
    if len(manifests) > 1:
        raise ValueError("all records must bind the same manifest")
    grouped: dict[tuple[int, str, float], list[PairRecord]] = defaultdict(list)
    for pair in pairs:
        if pair.estimable:
            grouped[(pair.skill, pair.reference_id, pair.reference_rating)].append(pair)
    estimates = tuple(estimate_cell(tuple(grouped[key])) for key in sorted(grouped))
    if any(not isfinite(estimate.weight) or estimate.weight <= 0 for estimate in estimates):
        raise ValueError("estimator produced invalid weight")
    return estimates


def decode_estimate(raw: dict[str, object]) -> CellEstimate:
    required = {"boundary", "ci_high", "ci_low", "counts", "elo_delta", "estimator_version", "manifest_sha256", "pair_count", "reference_id", "reference_rating", "schema_version", "score", "skill", "weight"}
    if set(raw) != required:
        raise ValueError("invalid estimate keys")
    return CellEstimate(
        raw["schema_version"], raw["estimator_version"], raw["manifest_sha256"], raw["skill"], raw["reference_id"], raw["reference_rating"], tuple(raw["counts"]), raw["pair_count"], raw["score"], raw["elo_delta"], raw["ci_low"], raw["ci_high"], raw["weight"], raw["boundary"]
    )


def main() -> int:
    parser = argparse.ArgumentParser(description="Estimate pentanomial calibration cells")
    parser.add_argument("records", nargs="+")
    parser.add_argument("--output", required=True)
    args = parser.parse_args()
    records = tuple(decode_pair(Path(path).read_bytes()) for path in args.records)
    write_canonical_json(
        args.output,
        {
            "estimatorVersion": ESTIMATOR_VERSION,
            "estimates": estimate_cells(records),
            "operationalFailures": sum(not record.estimable for record in records),
            "recordCount": len(records),
        },
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
