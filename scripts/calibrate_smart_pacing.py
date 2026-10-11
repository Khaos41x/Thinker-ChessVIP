import argparse
import hashlib
import json
from pathlib import Path

import chess


ROOT = Path(__file__).resolve().parents[1]
CORPUS = ROOT / "tests" / "fixtures" / "smart_pacing_positions.json"
CONTROLS = (60_000, 120_000, 180_000, 300_000, 600_000, 900_000)


def load_corpus():
    data = json.loads(CORPUS.read_text(encoding="utf-8"))
    if data.get("schemaVersion") != 1 or data.get("corpusVersion") != 1:
        raise ValueError("unsupported corpus version")
    positions = data.get("positions")
    if not isinstance(positions, list) or len(positions) < 14:
        raise ValueError("golden corpus is incomplete")
    identifiers = set()
    label_coverage = set()
    for position in positions:
        identifier = position.get("id")
        if not identifier or identifier in identifiers:
            raise ValueError("position ids must be unique")
        identifiers.add(identifier)
        board = chess.Board(position.get("fen", ""))
        if not board.is_valid():
            raise ValueError(f"invalid position: {identifier}")
        labels = position.get("labels")
        if not isinstance(labels, list) or not labels:
            raise ValueError(f"missing labels: {identifier}")
        label_coverage.update(labels)
    required = {"book", "one-legal-move", "promotion", "terminal", "balanced-critical", "technical-ending"}
    missing = required - label_coverage
    if missing:
        raise ValueError(f"missing corpus labels: {sorted(missing)}")
    return data


def simulate_safety():
    violations = []
    rows = []
    for initial_ms in CONTROLS:
        family = "bullet" if initial_ms <= 120_000 else "rapid" if initial_ms > 600_000 else "blitz"
        reserve = {"bullet": 2_500, "blitz": 6_500, "rapid": 15_000}[family]
        floor = {"bullet": 130, "blitz": 180, "rapid": 240}[family]
        remaining = initial_ms
        debt = 0.0
        minimum_reserve = remaining
        for move_index in range(60):
            spendable = max(0, remaining - reserve - 180)
            sustainable = max(floor, spendable / max(8, 42 - move_index // 2) * 0.5)
            critical = move_index % 17 == 0 and debt < sustainable
            target = min(spendable, sustainable * (4.0 if critical else 0.8))
            if target > spendable:
                violations.append({"controlMs": initial_ms, "move": move_index + 1})
            remaining -= target
            debt = max(0, debt * 0.72 + max(0, target - sustainable) - max(0, sustainable - target) * 0.4)
            minimum_reserve = min(minimum_reserve, remaining)
        rows.append({"controlMs": initial_ms, "remainingMs": round(remaining), "minimumRemainingMs": round(minimum_reserve), "debtMs": round(debt)})
    return rows, violations


def build_report(corpus):
    corpus_bytes = CORPUS.read_bytes()
    rows, violations = simulate_safety()
    return {
        "calibrationReportVersion": 1,
        "status": "draft-unapproved",
        "corpusVersion": corpus["corpusVersion"],
        "corpusSha256": hashlib.sha256(corpus_bytes).hexdigest(),
        "positionCount": len(corpus["positions"]),
        "safety": {"violations": violations, "simulations": rows},
        "promotionEligible": False,
        "approval": {"owner": None, "approvedAt": None},
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    report = build_report(load_corpus())
    if report["safety"]["violations"]:
        raise SystemExit("unsafe pacing parameters")
    if args.output:
        args.output.write_text(json.dumps(report, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(json.dumps(report, sort_keys=True))
    if args.check and report["promotionEligible"]:
        raise SystemExit("draft report cannot be promotion eligible")


if __name__ == "__main__":
    main()
