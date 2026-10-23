def reconcile(observations, now_ms, pending_games=0, checked_at=None, cache_until=None):
    valid = [item for item in observations if item["sourceEffectiveAtMs"] is None or item["sourceEffectiveAtMs"] <= now_ms + 300000]
    provisional = [item for item in valid if item["source"].startswith("dom-")]
    public = [item for item in valid if item["source"].startswith("pubapi-") and item["sourceEffectiveAtMs"] is not None]
    contested = set()
    conflicts = []
    cohorts = {}
    for item in public:
        keys = [("time", item["sourceEffectiveAtMs"])]
        if item.get("gameKey"):
            keys.append(("game", item["gameKey"]))
        for key in keys:
            cohorts.setdefault(key, []).append(item)
    for key, cohort in cohorts.items():
        ratings = {item["rating"] for item in cohort}
        if len(ratings) > 1:
            contested.update(item["observationId"] for item in cohort)
            conflicts.append({"cohort": list(key), "observationIds": [item["observationId"] for item in cohort], "ratings": sorted(ratings)})
    eligible = [item for item in public if item["observationId"] not in contested]
    confirmed = max(eligible, key=lambda item: (item["sourceEffectiveAtMs"], item["observationId"]), default=None)
    latest_conflict_time = max((item["sourceEffectiveAtMs"] for item in public if item["observationId"] in contested), default=-1)
    current_conflict = bool(conflicts and (confirmed is None or latest_conflict_time >= confirmed["sourceEffectiveAtMs"]))
    candidate = max(provisional, key=lambda item: (item.get("sourceObservedAtMs", item["observedAtMs"]), item["observedAtMs"]), default=None)
    fresh = checked_at is not None and now_ms - checked_at <= 900000 and cache_until is not None and cache_until >= now_ms and not pending_games
    state = "conflict" if current_conflict else "awaiting-update" if pending_games else "provisional" if candidate and (confirmed is None or candidate["rating"] != confirmed["rating"]) else "verified" if confirmed and fresh else "stale" if confirmed else "unavailable"
    return {"confirmed": confirmed, "provisional": candidate, "state": state, "pendingGameCount": pending_games,
            "conflicts": conflicts, "eligible": bool(confirmed and fresh and not current_conflict),
            "lastVerifiedAtMs": checked_at, "freshness": "fresh" if fresh else "stale" if confirmed else "unknown", "error": None}
