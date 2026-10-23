[
  {
    "location": "core/rating_tracker/goals.py:12-22",
    "trigger_condition": "Completion evidence becomes contested while a later public observation confirms current rating",
    "guard_snippet": "if any(result.get('reachedObservationId') in c['observationIds'] for c in view.get('conflicts', [])): result['completionNeedsVerification'] = True",
    "potential_consequence": "Historical completion remains presented as verified despite contested evidence supporting its original crossing"
  },
  {
    "location": "core/rating_tracker/goals.py:26; core/rating_tracker/service.py:522",
    "trigger_condition": "A resumed goal crosses later, or late archive evidence proves a crossing after resume",
    "guard_snippet": "if evidence_effective_at > goal.get('resumedAtMs', 0): evaluate_post_resume_crossing_with_original_baseline()",
    "potential_consequence": "Exact later achievement times disappear and historically reached goals after resume can remain tracking"
  },
  {
    "location": "frontend/rating_tracker/index.js:45; frontend/rating_tracker/external.js:125",
    "trigger_condition": "Backend becomes unavailable after a verified snapshot has rendered",
    "guard_snippet": "catch (_) { markCachedViewsStale(snapshot); draw(); showOfflineStatus(); }",
    "potential_consequence": "Cached cards continue labeling ratings Verified indefinitely; on-page users see no visible connection failure"
  }
]
