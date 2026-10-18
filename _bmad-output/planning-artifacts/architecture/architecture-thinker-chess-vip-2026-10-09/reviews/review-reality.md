# Reality / Brownfield Compatibility Review — Smart Pacing Architecture Spine

## Gate verdict

**CHANGES REQUIRED.** The spine is directionally compatible with the current Flask/userscript/Komodo system and names the right seams, but it does not yet close three brownfield-critical paths: admission/cancellation before the global engine lock, coexistence with `/eval`, and secure capability provisioning for a Tampermonkey client. A literal implementation by two teams could satisfy the prose while still blocking the only engine past the move deadline or leaving the local API exposed.

## Verification performed

- Reviewed `ARCHITECTURE-SPINE.md` against `app.py`, `script.js`, `tests/test_smart_pacer.js`, `tests/test_server.py`, and `requirements.txt`.
- Ran `node tests/test_smart_pacer.js`: **pass**. This confirms the current implementation, not the proposed architecture.
- Verified the active runtime: Python 3.12.7, Flask 3.1.3, Flask-Cors 6.0.2, Flask-SocketIO 5.6.1, `chess` 1.11.2, psutil 7.2.2, Node 22.23.2.
- Verified that this `chess.engine.SimpleEngine` exposes `analysis(...)` and that `SimpleAnalysisResult.stop()` exists, so cooperative UCI cancellation is feasible in this environment.
- The repository dependency declaration is not reproducible: `requirements.txt` is mostly unpinned and names `python-chess`, while the active environment has distribution `chess==1.11.2` and no `python-chess` distribution metadata.

## Critical findings

### C1 — Deadline/cancellation cannot be enforced at the boundary described while the current decorator owns admission

**Evidence:** AD-9 requires the server to count queue time, obsolete older revisions, stop work cooperatively, and never rely on HTTP abort. In the brownfield server, `@serialized_engine_request` acquires `engine_request_lock` *before the handler executes* (`app.py:269-274`). Therefore a queued `/move-plan` cannot parse its revision, register obsolescence, compute a server deadline, or reject itself until it has already waited behind earlier engine work. Inside `KomodoSingleton`, both `analyse()` and `play()` take a second process-wide lock, execute synchronous `SimpleEngine` calls, and retry/restart twice without any remaining-budget check (`app.py:403-438`). The current client cancellation only aborts `GM_xmlhttpRequest`; it cannot release either server lock.

**Why this violates the spine:** AD-9 is not enforceable merely by adding a request registry to `service.py`; admission occurs outside that service. A stale request can consume the whole global engine queue and cause the next valid request to miss its reserve boundary. The rule also says “before every queue/stage/retry”, but the current retry loop has no deadline/cancellation input.

**Required architecture fix (autofix):** Bind a concrete `EngineExecutionPort` and admission order in the spine:

1. authenticate and validate the request;
2. register `{clientSessionToken, positionRevision}` and derive `serverDeadlineMono` **before** engine serialization;
3. acquire a deadline-aware engine lease/queue that can discard obsolete queued requests;
4. run stages through an adapter receiving `{deadline, cancellationToken}`;
5. use `SimpleEngine.analysis()`/`SimpleAnalysisResult.stop()` (or explicitly choose worker-process isolation) for in-flight cooperative stop;
6. check remaining budget before each stage and before any restart; retries are forbidden after expiry;
7. release the lease and discard partial/stale cache writes atomically.

The new route must not use the current outer `@serialized_engine_request` unchanged. Add a gate test: an abandoned long request cannot delay a newer revision beyond the declared queue SLO.

## High findings

### H1 — The existing `/eval` path defeats the “one transaction” latency and contention guarantee

**Evidence:** AD-2 excludes `/getmove` and `/analyze` from the new path, but does not govern `/eval`. Today `request_move()` calls `requestEval(fen)` before `/getmove` (`script.js:3043-3055`), and a separate 500 ms poller can call it every five seconds for the same FEN (`script.js:2132-2144`). `/eval` is protected by the same global `engine_request_lock` and runs another Komodo analysis (`app.py:907-924`).

**Impact:** With Eval Bar enabled, a team can correctly implement `/move-plan` and still have unbudgeted `/eval` work queue ahead of it, corrupting the preflight latency budget and duplicating reference analysis. It also makes the AD-2 statement “prevents duplicated engine work” false in the actual integration.

**Required architecture fix (autofix):** Declare that Smart Pacing's `/move-plan` reference snapshot is the authoritative Eval Bar source for that observation. Suppress/coalesce `/eval` for an in-flight or completed matching `analysisPositionKey`, or place non-pacing eval in an explicitly lower-priority, deadline-aware queue that can never delay a move plan. Include `/eval` in the legacy coexistence/retirement rule and in contention tests.

### H2 — Two engine lenses are feasible but currently under-specified and can double the only engine's work

**Evidence:** AD-2 says the transaction has a stable reference analyzer plus an Elo-conditioned selector and claims this prevents duplicated work. The installed Komodo is a single `SimpleEngine` configured with `Threads=1`; changing `Skill` is a mutable engine-wide option (`app.py:381-408`, `app.py:422-428`). Current move selection already uses a separate `play()` call. Running staged MultiPV reference analysis and then an independent Elo selector serially is two searches, not one, and may be impossible inside Bullet preflight budgets.

**Impact:** Implementers can choose incompatible orders and fallbacks: reference-first then miss the move deadline, selector-first then return no evidence, mutate `Skill` between cached stages, or reuse a full-strength best move as if it were Elo-conditioned. “Atomic transaction” alone does not define coherence.

**Required architecture fix (discuss/autofix):** Ratify one execution plan. At minimum define a shared transaction budget and priority: legal/forced/book fast path; obtain a legal selected move before the hard cutoff; spend only remaining budget on reference refinement; bind both engine option snapshots in the response; compute regret only when the reference snapshot meets its confidence contract; never cache a stage under the other lens's configuration. Prefer deriving the selector from a declared candidate/reference snapshot when valid, or explicitly accept a second search and define the minimum budget at which it is allowed. Add cold-start and Bullet degradation fixtures.

### H3 — AD-16 lacks a realizable pairing/provisioning flow for Tampermonkey and does not cover all legacy surfaces

**Evidence:** The current service correctly binds to `127.0.0.1`, but configures wildcard CORS twice and wildcard Socket.IO origins (`app.py:26-30`). Engine, config, rating, history, health, and socket surfaces are unauthenticated. `script.js` currently stores many settings in page `localStorage`; a static token placed there would be readable/replaceable in page context. A strict origin allowlist alone is unreliable for privileged `GM_xmlhttpRequest` clients because request-origin behavior differs across userscript managers, and non-browser local clients are not governed by CORS.

**Impact:** Two teams can both “add a capability token” but choose incompatible and insecure bootstrap schemes. Protecting only `/move-plan` leaves legacy engine routes available to arbitrary local callers, while disabling all wildcard origins without testing Tampermonkey can break the product.

**Required architecture fix (discuss):** Add a local-service trust/bootstrap invariant: first-run one-time pairing or installer-provisioned random capability; storage in Tampermonkey-private `GM_*` storage (not page `localStorage`); rotation/revocation; authenticated health/version discovery that does not leak the secret; explicit permitted origin/extension behavior tested on supported userscript managers. Apply common middleware and payload/concurrency limits to every engine/config/socket route, or disable/remove legacy routes when V2 is active. Define port ownership, collision/single-instance behavior, and secret-file permissions for the Windows local service.

### H4 — The spine contains ownership/contract contradictions that will produce incompatible modules

**Evidence:**

- AD-7 says only the session reducer owns inference windows and estimates, but the capability map assigns “Clock and increment inference” to `clock-context.js` (`ARCHITECTURE-SPINE.md:87-93`, `:242`).
- AD-15 mandates three non-interchangeable identities, while the contract convention still requires a singular `positionKey` (`:147-152`, `:165`).
- AD-14 requires a replaceable platform adapter, but no platform-adapter module appears in the structural seed (`:187-216`).
- AD-9 requires cooperative engine cancellation, but the structural seed has only `analyzer.py`; no engine execution/lease/cancellation port is named.

**Impact:** These are not cosmetic. They decide which component is stateful, which key controls cache versus execution, and where platform/engine side effects can enter.

**Required architecture fix (autofix):** Make `clock-context.js` emit immutable observations only and assign inference exclusively to `session.js`; replace generic `positionKey` with the exact required identities in the contract convention; add explicit browser `platform-adapter.js` and backend `engine-port.py`/request-admission modules to the structural seed and capability map.

## Medium findings

### M1 — Opening-book behavior is a live brownfield branch but absent from the spine

`getmove()` returns a cached/book move before engine search (`app.py:862-883`). AD-2 can be read either as “always run the reference analyzer” or “book is a valid selector shortcut”; those choices have very different latency and evidence semantics. Bind a book-source contract: provenance/familiarity may justify fast timing, but book lookup must not fabricate high-confidence low complexity. State whether optional shallow evidence may consume remaining budget and how book/version enters cache keys.

### M2 — The declared stack is observed, not reproducible

The versions in the spine match this machine, but `requirements.txt` does not pin Flask, Flask-Cors, Flask-SocketIO, `python-chess`, or waitress. A clean installation can resolve different APIs/behavior. Add a constraints/lock artifact and clarify whether the supported distribution is `python-chess` meta-package or direct `chess`. Komodo 14.1 is ignored and Windows-executable-specific; its presence, checksum/license, supported OS/architecture, and option probe need an implementation preflight rather than an assumed package dependency.

### M3 — Userscript modularization is not buildable until the deferred bundler decision is made

The structural seed requires `src/smart_pacing/*.js`, but production is one Tampermonkey file and current tests extract code by string boundaries from `script.js`. Deferring the bundler while prescribing modules leaves import/runtime/test behavior undecided. Promote “reproducible userscript build + source map/banner metadata + test imports from source” to Phase 0, even if the specific tool remains replaceable. Keep a temporary compatibility test for the generated `script.js`.

### M4 — Operational envelope of the local service is incomplete

The feature depends on an eager Komodo startup/warmup at module import (`app.py:451-468`) and currently runs Flask's development server despite `waitress` being listed. The spine is silent on startup ownership, health/readiness versus liveness, port conflicts, graceful shutdown, single instance, engine crash budget, and upgrade compatibility. These are necessary to make AD-9/AD-16 real in a commercial local-first product. Add an operations seam or explicitly defer it to a named parent architecture with a minimum readiness contract here.

## What already ratifies the brownfield well

- Keeping a single scheduler with final FEN/game/enabled/legal guards preserves the strongest existing safety property; the required promotion-aware UCI upgrade correctly fixes the current unconditional `promotion: "q"` behavior (`script.js:2712-2808`).
- Separating browser clock/session ownership from backend chess analysis matches where data actually exists.
- Monotonic relative timing, partial typed outcomes, no durable-history requirement, and separate Puzzle state are feasible in the current stack.
- Local loopback binding is already present; the missing work is authentication/provisioning and consistent middleware, not a transport rewrite.
- Cooperative UCI stop is available in the installed `chess` library, so AD-9 does not require replacing python-chess if the adapter uses its streaming analysis API.

## Gate recommendation

Apply C1 and H1–H4 before finalizing the spine. M1–M4 may be concise additions or explicitly assigned to implementation bootstrap/parent architecture, but must not remain silent because they alter deadline correctness, cache behavior, buildability, or local deployment. After revision, re-run the spine linter and add the engine-queue obsolescence test as the first implementation proof.

## Recheck

**Recheck verdict: FAIL — one high fallback ambiguity remains; the other prior high/critical findings are closed.**

Scope of this recheck was limited to the five previously requested areas.

### Closed — admission before lock

AD-9 now requires revision/deadline registration before any engine lock, bounded cooperative cancellation, forced restart after the grace interval, generation invalidation, and typed fallback. AD-19 explicitly forbids a route decorator from acquiring the engine lock before admission. This resolves C1 at architecture level and is feasible with the installed `SimpleEngine.analysis()` / `SimpleAnalysisResult.stop()` API.

### Closed — `/eval` and all engine work through one coordinator

AD-19 makes `EngineCoordinator` the sole Komodo caller and explicitly includes `/eval`, legacy routes, warmup, and background work. It also establishes current move-plan priority plus preemption/rejection of non-plan work. This closes H1, subject to the implementation contention tests already recommended.

### Still open (HIGH) — selector fallback covers failure to start, not failure after start

AD-2 now fixes the order and, together with AD-9, gives every stage a shared hard deadline: shallow reference → bounded Elo selector → deep refinement over the candidate union. It also gives deep analysis a typed partial fallback. However, its selected-move fallback is defined only **“if the selector slice cannot start.”** The rule does not say what happens when the selector starts but times out, is cancelled, returns no move/illegal output, or loses the engine during its slice. Those are normal brownfield outcomes in the current retry/restart model. One implementation may return the shallow reference best, another may return an error/no move, and a third may retry past the slice.

**Required clear fix:** change the selector fallback condition to “cannot start **or cannot complete successfully with a legal move inside its slice/deadline**”; forbid retry outside the remaining transaction budget; bind a stable reason code such as `selectorFallbackReason`; then allow deep refinement only if remaining budget exists. With that sentence, H2 is closed.

### Closed — explicit userscript pairing and legacy route disposition

AD-16 now defines install-generated 256-bit capability material, explicit one-time pairing into isolated userscript storage, bearer authentication on all engine routes including `/eval` and legacy routes, origin checks when present, limits, and legacy routes disabled by default after cutover. This closes the exact H3 concern rechecked here.

### Closed with one non-high editorial cleanup — ownership and structural seed

The singular `positionKey` contradiction is removed; contract identities now match AD-15. `clock-context.js` emits observations while `session.js` owns inference. The platform adapter and coordinator are present in the structural seed and capability map. The only remaining naming wrinkle is that AD-19 says “Komodo adapter” while the seed names only `analyzer.py`; clarify in its comment that it is the deadline/cancellation-aware Komodo adapter, or add `engine.py`. This is medium/low documentation precision, not a remaining high blocker.

### Recheck disposition

After the one selector-fallback sentence is repaired, this reality lens passes. No other prior critical/high finding remains open within the requested recheck scope.

**Final targeted recheck: PASS — AD-2 now closes every selector failure mode with a legal shallow fallback, stable reason codes, and no retry outside the transaction budget; no prior high finding remains open.**
