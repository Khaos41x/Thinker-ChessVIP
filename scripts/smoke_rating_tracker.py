import argparse
import json
import sys
import tempfile
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from core.rating_tracker.public_client import PublicDataClient
from core.rating_tracker.service import RatingTrackerService


def main():
    parser = argparse.ArgumentParser(description="Read-only Rating Goal Tracker smoke with a temporary database")
    parser.add_argument("username")
    parser.add_argument("--category", choices=("bullet", "blitz", "rapid", "daily"), default="blitz")
    args = parser.parse_args()
    with tempfile.TemporaryDirectory(prefix=".rating-smoke-", dir=ROOT) as directory:
        service = RatingTrackerService(Path(directory) / "tracker.db")
        timings = []
        client = PublicDataClient(service.repository)
        original = client.request

        def measured(*values, **options):
            started = time.perf_counter()
            result = original(*values, **options)
            timings.append({"resource": result.resource, "status": result.status,
                            "latencyMs": round((time.perf_counter() - started) * 1000, 2)})
            return result

        client.request = measured
        service.client = client
        try:
            goal = service.create_goal({"username": args.username, "timeClass": args.category,
                                        "direction": "at-least", "threshold": 100000,
                                        "idempotencyKey": "read-only-smoke-1"})
            service.process_account(goal["accountKey"])
            snapshot = service.snapshot(goal["accountKey"])
            selected = snapshot["goals"][0]
            confirmed = selected["view"].get("confirmed")
            report = {"readOnly": True, "temporaryDatabase": True, "requests": timings,
                      "goalState": selected["state"], "ratingState": selected["view"]["state"],
                      "confirmedRating": confirmed["rating"] if confirmed else None,
                      "source": confirmed["source"] if confirmed else None,
                      "sourceEffectiveAtMs": confirmed["sourceEffectiveAtMs"] if confirmed else None,
                      "errors": snapshot["errors"]}
            print(json.dumps(report, indent=2))
            return 0 if confirmed and not report["errors"] else 1
        finally:
            service.close()


if __name__ == "__main__":
    raise SystemExit(main())
