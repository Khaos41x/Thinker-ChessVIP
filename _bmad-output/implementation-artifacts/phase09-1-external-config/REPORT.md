# Phase09.1 correction

Confirmed production cause: two stale Python servers listened on5050 and returned HTML404 for `/config/engines` while serving newer static UI. The frontend suppressed that discovery failure and left the selector disabled in Loading. Current-source preference selection also wrongly required an analysis heartbeat. Both paths are corrected: finite bounded discovery/error/Retry and preference-only revisioned persistence, independent of execution permission.

The two verified old app processes were replaced by one updated Flask process. `/config/engines` now returns200 and all three installed engines. Every accepted pre-maintenance setting was preserved; the selected preference remains Stockfish19·1MB. The saved Eval Bar state was retained, rather than changed by engine selection.

External Config now presents the existing session duration, minimum/maximum win rates, additional Rating Goal, Start/Finish/Export Diagnostics and genuine status/time/score/win-rate. Existing IndexedDB session state and callbacks remain authoritative; the server relays bounded owner/session-scoped commands with one-shot consumption and acknowledgements. Disconnected or blocked actions explain their reason. Opponent Scout is excluded only from External Config. Clean View remains.

Shared drafts, validation, field mapping and presenter are bundled deterministically into both surfaces. Revision checks preserve concurrent disjoint edits and invalid/in-flight input. Review fixed timing handlers clearing unrelated session drafts, full-draft writes reverting concurrent fields and stale engine revision recovery.

Validation passed:
- 7 existing and3 added backend configuration tests.
- All14 existing Session Control suites and new draft regressions.
- Real Flask session relay, genuine reducer projections, concurrent edits,409 retry and lost-ack at-most-once export.
- Engine-selection frontend conflict/retry regressions.
- Real Flask/registry/Chromium without Chess.com: all three discovered/selected, terminal Ready state, reload and Flask restart persistence, selection failure, Retry/reconnect and missing-endpoint recovery; unauthorized execution returns401.
- Existing bidirectional configuration browser suite: round-trip, revision protection, timing validation, stale poll, disjoint edits, offline recovery, Clean View and banner preservation.
- Real installed engines: Smallnet → Full → Komodo → Smallnet. Mate FEN evaluated with correct identity, positive mate semantics and streamed depths. Preference switching left Eval Bar disabled in that isolated test. See `../phase09-engine-selector/browser.json`.
- Existing Eval Bar Chromium visual/lifecycle suite: retained DOM, geometry, stale callbacks, cache isolation, mate/White POV, cancellation and continuous transitions passed.
- `python scripts/build_userscript.py --check` and `python scripts/build_analysis_engine.py --check`.

Screenshots: `before/` and `after/`, both presentation surfaces at1280×720,1440×900,1920×1080 and1440×900 with125%/150% equivalent browser zoom (CSS viewport scaled with DPR). Each size includes workspace and viewport captures. `capture.json` records control dimensions and keyboard eligibility. External Config has no horizontal overflow. Required session fields remain within workspace boundaries at every size. The embedded test host has a pre-existing fixed1433px board/ad layout causing document overflow at narrower CSS widths; workspace controls themselves fit.

Capture scope: isolated Chromium profile, real userscript renderer and local Flask registry. The Rating Goal renderer receives a test window facade to satisfy its Chess.com hostname boundary; no game/player identity or gameplay was fabricated. User browser access is disabled in Work settings, so these are reproducible fixture captures, not screenshots of the user's authenticated Chess.com tab. Genuine QUEUEING/COMPLETED contracts are tested through the existing reducer; no real gameplay was manipulated.

No remote push. Unrelated unfinished auth, knight artwork, rating, banners, arrows, video investigation and other dirty files remain outside this commit. Generic configuration keeps its established server-memory lifecycle; durable engine preference and rating data keep their existing disk persistence.
