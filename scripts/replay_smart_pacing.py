import argparse
import hashlib
import json
from pathlib import Path


def replay(events):
    accepted = []
    last_revision = -1
    for event in events:
        revision = int(event["positionRevision"])
        if revision <= last_revision:
            continue
        remaining = int(event["userRemainingAtObservationMs"])
        reserve = int(event["reserveMs"])
        margin = int(event.get("executionMarginMs", 180))
        target = int(event["targetTotalMs"])
        if target > max(0, remaining - reserve - margin):
            raise ValueError(f"reserve violation at revision {revision}")
        accepted.append(event)
        last_revision = revision
    canonical = json.dumps(accepted, separators=(",", ":"), sort_keys=True).encode("utf-8")
    return {"replayVersion": 1, "acceptedEvents": len(accepted), "digest": hashlib.sha256(canonical).hexdigest()}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("input", type=Path)
    args = parser.parse_args()
    events = json.loads(args.input.read_text(encoding="utf-8"))
    if not isinstance(events, list):
        raise SystemExit("replay input must be a JSON array")
    print(json.dumps(replay(events), sort_keys=True))


if __name__ == "__main__":
    main()
