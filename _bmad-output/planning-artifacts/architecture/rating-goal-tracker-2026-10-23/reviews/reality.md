# Repository reality review

Implementation approval supersedes the historical payload-ceiling finding below: remove the project-defined ceiling permanently, without a replacement. Size reporting is informational; deterministic, syntax, compatibility and runtime performance checks remain mandatory.

Reviewed 2026-10-23 against HEAD `c2b18c8`. Scope: ENGINEERING-PLAN.md and ARCHITECTURE-SPINE.md versus checked-in modules, storage, build and integration seams. Static inspection only; no application changes, server startup, database import, commit, push or repeated public API probes.

Verdict: the architecture fits the existing Python/Flask/SQLite and JavaScript stack. Most statements explicitly labeled existing are accurate. The tracker remains a proposed feature: its schemas, routes, database, scheduler and passive observers do not exist yet. The following refinements make the implementation handoff more concrete.

## Actionable findings

### R1 — Resolve userscript delivery before the browser implementation phase

Priority: P2. ENGINEERING-PLAN sections 4/11 identify the payload gate but postpone the concrete delivery decision until phase 3. The current `script.js` is 635087 bytes: only 4913 bytes remain under the 640000-byte ceiling. This is a measured constraint, not an estimate. A new adapter, bridge and presenter must prove they fit or select the already-mentioned versioned local asset strategy before those modules are implemented. Move a bundle-size spike/delivery decision into phase 0 and record the full userscript byte budget.

Evidence: `tests/test_scout_logic.js:281` checks total UTF-8 bytes; `scripts/build_banner_raster.mjs:22` also rejects an oversized total. `scripts/build_userscript.py` and `analysis_lab/scripts/build-userscript-eval-bar.mjs` check generated-region consistency but do not themselves enforce that ceiling. The existing-findings table should name the actual guard locations, and the future tracker check must measure the complete output after all generated regions are present.

### R2 — Specify how the proposed root-level bundler resolves existing esbuild

Priority: P2. ENGINEERING-PLAN section 4 proposes `scripts/build_rating_tracker.mjs` using existing pinned tooling. Existing esbuild belongs to `analysis_lab/package.json` and its lockfile, and the working bundler lives under `analysis_lab/scripts/`. Standard Node bare-package resolution from a repository-root `scripts/` file does not search the sibling `analysis_lab/node_modules` tree. Merely running the root script with a different working directory does not solve that resolution rule.

Choose an explicit implementation seam: place the tracker build entry beside the existing lab bundler, or resolve the lab package tree explicitly. Specify installation through the existing lockfile and the exact check command. This needs no new runtime package; avoid adding an accidental second Node dependency authority. The manifest uses `esbuild: ^0.28.2`; reproducible pinning comes from the lockfile/`npm ci`, not that manifest range alone.

### R3 — Add tracker database artifacts to the implementation file list

Priority: P2. ENGINEERING-PLAN sections 4/8 introduce a separate durable database but omit `.gitignore` and the concrete database location. The existing ignore list covers `users.db` and `move_plan_idempotency.db*`, not `rating-tracker.db` or SQLite journal/WAL/SHM siblings. Following the file list literally can expose persisted identity/history through untracked artifacts or a later broad add.

Add a proposed `.gitignore` change covering the selected tracker database and sidecars, select a stable application-relative data path rather than an implicit process working directory, and require temporary database paths in tests. Preserve the separate-authority decision.

### R4 — Treat worker startup/shutdown as a new integration contract

Priority: P2. ENGINEERING-PLAN section 4 says routes register in `app.py` with clean shutdown through the existing application lifecycle. `app.py:643` only registers `atexit.register(komodo.close)`; the inspected app has no shared service-start/stop abstraction. The tracker needs an explicit new lifecycle seam: create/start exactly one coordinator, stop intake, signal the bounded worker, finish or safely abandon durable jobs, join with a bound and close connections. Define ownership for direct `app.py` execution and tests; importing a route blueprint must not start an uncontrolled worker. Existing `app.run(... threaded=True)` does not provide this lifecycle automatically.

### R5 — Expand the storage baseline description

Priority: P3. The existing-findings table describes `database.py` as license/account storage. It also creates local-rating `players` and `matches` tables and exposes rating/history mutation helpers; `core/rating.py` imports it. Add this detail so an implementer does not mistake those tables for a usable Chess.com rating history. The current prohibition on reusing local Elo and `users.db` is correct and should remain.

## Existing claims corroborated

| Claim | Repository evidence | Assessment |
| --- | --- | --- |
| Eval Bar defaults off; renderer selection is separate | `core/external_config.py:12`; `script.js:3042` and following | Correct. Saved `true` remains an explicit preference; server memory config can synchronize it. |
| External Config has independent UI and memory-only partial configuration | `core/external_config.py:21`; `frontend/external_config/{index.html,panel.js,panel.css}` | Correct. The tracker cannot inherit persistence from it. |
| Existing postgame observer depends on Session Control | `script.js:681` immediately gates on `sessionControlBridge.isRunning()`; subsequent logic uses admitted game/queue state | Correct. A separate passive observer is required for automation-off operation. |
| Own-identity helper assumes bottom player | `script.js:2162` | Correct. It is not evidence of authenticated own-account identity on flipped boards/replays. |
| Session Control URL parser supports only typed game paths | `frontend/session_control/platform-chesscom.js:55` | Correct: `/game/live/{id}` and `/game/daily/{id}`. Tracker aliases need separate tests and namespace rules. |
| Session Control supplies storage/leader patterns | `frontend/session_control/repository.js:68`; `frontend/session_control/leader.js:11` | Correct: IndexedDB event indexes, unique result keys and Web Locks exist, but no tracker storage or leadership contract exists. |
| Validated Python dataclasses fit existing conventions | `core/smart_pacing/contracts.py` | Correct. A tracker JSON Schema/parity suite is a new decision, not an existing shared contract. |
| Local origin protection must be deliberate | `app.py:51` and `app.py:53` install global wildcard CORS; direct entrypoint binds loopback at `app.py:1460` | Correct. Blueprint naming alone does not override global CORS. Phase 0/route tests must prove effective response headers, preflight, origin/Host validation and the actual GM/browser transport. |

## Proposed decisions versus verified behavior

Backend authority, a separate tracker database, V1 contracts, dedicated routes, durable jobs/outbox, one-process deployment, retention, proximity hysteresis, 15-minute freshness, passive DOM proof and the optional card are plan decisions. They are coherent with the stack but are not already implemented or validated by existing tests. The spine's `status: final` means the document's status only; it should not imply implementation or release readiness.

The supplied public API probe results support category-specific published ratings, postgame archive evidence and conditional HTTP revalidation. They do not establish immediate publication, authenticated selectors, hidden-rating behavior or a guaranteed per-game update delay. The plan correctly marks these limitations; this review made no new API requests. Authenticated selector smoke, transport headers, maximum archive size, global CORS interactions and crash-safe visual delivery remain implementation/release gates.
