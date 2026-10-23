# Rating Goal Tracker — Validation

Date: 2026-10-23. No remote push. No ranked game was played or account preference changed for testing.

## Implementation

Phases 0–5 produced contracts, SQLite authority, deterministic reconciliation/goals, serialized conditional PubAPI client, durable refresh jobs, passive DOM/GM ingress, compact English presenters, inbox claims, diagnostics and deterministic bundles. The on-page card is opt-in; monitoring is created explicitly through External Config. Existing console grids and engine controllers are not rebuilt.

The artificial total userscript byte ceiling is removed. Final reported size is 651339 bytes; the embedded tracker is 15903 bytes. Deterministic checks and syntax validation remain. A >1 MB fixture verifies absence of a replacement ceiling.

## Automated results

| Command / suite | Result |
| --- | --- |
| `python tests/test_rating_tracker.py` |51 tests pass. |
| `python tests/test_rating_tracker_reliability.py` |17 tests pass. |
| `python tests/test_rating_tracker_app.py` |7 tests pass against real app integration, temporary SQLite. |
| `python tests/test_userscript_build_size.py` |4 tests pass. |
| `node tests/test_rating_tracker_contracts.js` |8 contract/transport/cache checks pass, including Python/JavaScript canonical evidence-ID parity. |
| `node tests/test_rating_tracker_chrome.js` |Real Flask/SQLite + built userscript, two external tabs, keyboard, Clean View, thresholds, history, notifications, removal and responsive screenshots. See `browser/report.json`. |
| `node tests/test_external_config_chrome.js` |Bidirectional sync, Clean View, Banner recovery, timing, drafts, retry/offline and responsive checks pass. |
| `node tests/session_control/run.js` |14 suites pass. |
| Existing backend config/recovery/Stockfish/pacing/move-plan/Session Control |88 tests pass. |
| Analysis Lab typecheck / Vitest / Vite build |Typecheck passes;113 tests in10 files pass; production build passes. |
| Visual preferences / Scout / Banner / board resolution / scrollbar / move recovery / queue fallbacks / rating / pacing sequences |Pass. |
| Python and both JS bundle `--check`, raster `--check`, JS syntax, Python compile, `git diff --check` |Pass. |

The legacy Smart Pacer isolated test fails with `ReferenceError: resolveThinkerBoardGame is not defined`; the same failure was reproduced using the original Git HEAD source. This is not reported as a passing suite.

## Live public-data smoke

`python scripts/smoke_rating_tracker.py erik --category blitz` used a temporary database and the actual public client. Profile, stats and current-month archive returned200. Confirmed Blitz rating1912, source `pubapi-stats`, effective timestamp1739572600000, state `verified`, no errors. The old effective date is preserved, not confused with fetch time.

Measured requests: profile328.56ms; cached profile0.08ms; stats278.82ms; archive348.86ms. These are individual local measurements, not a publication SLA. The script performs only public GETs and local temporary tracker writes.

## Browser and performance evidence

Screenshots:390/800/1033/1034/1035/1280/1440px, with English labels and no horizontal overflow. Exact DOM rectangles and paths are in `browser/report.json`. The external workspace retains its pre-existing centering/subpixel coordinates; this task does not alter its global layout tokens.

The recorded fixture runs connected the tracker with approximately12–13ms initial snapshot latency and5–7ms subsequent latency. Startup including the complete userscript and legacy console was approximately647–673ms. One58–68ms long task was observed for the whole userscript; attribution to this new module alone was not established. One hundred own-overlay mutations caused zero additional tracker observations. These measurements are informational and machine-specific; the latest exact measurements are in the JSON report.

## Repository isolation

All209 protected pre-existing files matched their initial SHA-256 hashes, including both modified knight files and all untracked banner files/evidence. Those paths are excluded from staging. No user database, engine binary, capability token or browser profile is included in the commit.

## Explicit limitations

- No authenticated Chess.com/Tampermonkey extension session was available. DOM selectors must pass a separate read-only smoke; unknown identity/category remains unavailable and public API polling continues.
- Public publication can lag. A fresh fetch or304 does not guarantee a completed game has been published.
- The supported deployment is one loopback Flask process. Remote exposure and multiple workers are not enabled.
- Active response/body cancellation is tested. Operating-system DNS/connect behavior can still affect wall-clock latency before a response exists.
- In-app notifications are durable, with stable IDs and claims. Exactly-once toast delivery and OS notifications are not claimed.
- Database startup failure shows a degraded tracker without breaking other functions; correct the storage issue and restart to recover initialization.
