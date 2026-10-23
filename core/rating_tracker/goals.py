def evaluate(goal, view, now_ms):
    result = dict(goal)
    events = []
    observation = view.get("confirmed")
    disputed = {identity for conflict in view.get("conflicts", []) for identity in conflict.get("observationIds", [])}
    if result.get("reachedObservationId") in disputed:
        result["completionNeedsVerification"] = True
    current = observation["rating"] if observation else None
    result.update(currentRating=current)
    result.setdefault("progress", None)
    result.setdefault("rawProgress", None)
    result.setdefault("remainingPoints", None)
    if current is not None:
        result["remainingPoints"] = max(0, result["threshold"] - current) if result["direction"] == "at-least" else max(0, current - result["threshold"])
    if not view.get("eligible") or result["state"] in ("paused", "archived"):
        if result["state"] == "reached" and view.get("state") == "conflict":
            result["completionNeedsVerification"] = True
        return result, events
    if result.get("baselineRating") is None:
        result.update(baselineRating=current, baselineObservationId=observation["observationId"], baselineAtMs=now_ms, state="tracking")
    baseline = result["baselineRating"]
    denominator = result["threshold"] - baseline
    raw = (current - baseline) / denominator if denominator else 1.0
    result.update(rawProgress=raw, progress=max(0, min(100, raw * 100)))
    reached = current >= result["threshold"] if result["direction"] == "at-least" else current <= result["threshold"]
    if reached:
        result["progress"] = 100
    if result["state"] == "reached":
        return result, events
    if reached:
        result.update(state="reached", achievedAtMs=max(result["createdAtMs"], observation["sourceEffectiveAtMs"]) if observation["sourceEffectiveAtMs"] > result.get("resumedAtMs", -1) else None,
                      confirmedReachedAtMs=now_ms, reachedObservationId=observation["observationId"], proximityArmed=False)
        events.append({"kind": "reached", "cycle": 0})
    elif result["remainingPoints"] > 30 and not result.get("proximityArmed", True):
        result.update(proximityArmed=True, proximityCycle=result.get("proximityCycle", 0) + 1)
    elif 1 <= result["remainingPoints"] <= 20 and result.get("proximityArmed", True):
        result["proximityArmed"] = False
        events.append({"kind": "near", "cycle": result.get("proximityCycle", 0)})
    return result, events
