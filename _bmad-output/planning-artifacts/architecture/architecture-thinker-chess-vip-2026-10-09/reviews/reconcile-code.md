# Reconciliation review — brownfield code vs Smart Pacing architecture

## Verdict

**NEEDS CHANGES before implementation.** The architecture preserves most of the important existing guarantees: one scheduling owner, elapsed wall-time accounting, expected-FEN/game/enabled/legal guards, MAX immediacy, cache/version discipline, typed degraded outcomes, local-first operation, and gradual cutover. Five load-bearing gaps remain. Two can produce incorrect moves or a blocked engine even if the implementation follows the documents literally; three drop approved product semantics or conflate identities that the current code keeps distinct.

## Findings

### 1. [P0] Browser cancellation cannot enforce the promised backend deadline

**Evidence.** `app.py:269-274` holds a process-wide `engine_request_lock` for the complete route. `KomodoSingleton.analyse()` then holds a second lock while the synchronous `SimpleEngine.analyse()` runs (`app.py:403-420`). The current browser can abort a `GM_xmlhttpRequest`, but that only rejects the client promise; it does not interrupt the already-running Python handler or release either lock. The design promises a hard analysis deadline, partial return, and cancellation of staged analysis on position change (`SOLUTION-DESIGN.md:128`, `:311-316`, `:1031`), without defining the server-side mechanism that makes those guarantees true.

**Impact.** A stale deep stage can continue occupying the only Komodo instance, so the next live position waits behind work the browser has already abandoned. In Bullet/Blitz this defeats the survival fast path and turns client-side cancellation into cosmetic cancellation.

**Required correction.** Bind the deadline to engine limits before each stage and define a cooperative server cancellation/obsolescence contract. At minimum: monotonic absolute deadline received/derived server-side; remaining-budget check before every stage/retry; time-limited engine calls rather than depth-only calls; no retry/restart once the request deadline is exhausted; and a tested rule for stale queued requests. If true in-flight interruption is required, specify `analysis()`/`stop` or worker/process isolation rather than assuming HTTP abort interrupts `analyse()`. Add a concurrency test proving an abandoned long plan cannot block the next plan beyond its tier SLO.

### 2. [P1] The approved Puzzle exclusion was dropped

**Evidence.** The current `request_move()` is shared by live play and Puzzle (`script.js:2943-3007`); Puzzle uses Elo 3200 and can also enter the current Smart Pacing analysis branch. The approved scope was Bullet + Blitz + Rapid, with Puzzle explicitly outside the competitive time-bank model. Neither `ARCHITECTURE-SPINE.md` nor `SOLUTION-DESIGN.md` states that exclusion or defines a separate Puzzle policy. The Phase 5 instruction to replace the v2 branch with `/move-plan` therefore leaves an implementer free to run the stateful clock model in Puzzle.

**Impact.** Puzzle can contaminate session state, invoke clock inference where no competitive clock exists, or gain arbitrary long-think behavior. It also muddies tests and future commercial packaging.

**Required correction.** Add an invariant and integration gate: competitive Smart Pacing V2 is entered only for clocked live-game modes; Puzzle has its own stateless presentation policy (configured immediate or simple delay), its own cache/session namespace, and never updates the competitive reducer, debt, increment estimator, or telemetry class. Add explicit Puzzle routing tests.

### 3. [P1] Elo ownership and Auto Adjust smoothing are underspecified

**Evidence.** Today the browser computes `currentElo` on every request from Auto Adjust or the slider (`script.js:2983-2989`), `/getmove` converts it to Komodo Skill (`app.py:885-892`), while `/analyze` always resets Skill 20 (`app.py:403-413`, `:970-975`). The new request has one `elo`, and the session type has one `effectiveElo`, but the documents never define (a) whether staged evidence is generated at full engine strength or at the weakened move-selection skill, (b) how one transaction may use different engine configurations without invalidating evidence, or (c) the approved rule that Auto Adjust changes are smoothed during a game. `SOLUTION-DESIGN.md:1139` acknowledges the interaction only as a risk, and `:1201` leaves selection strategy for later confirmation.

**Impact.** Two compliant implementations can disagree fundamentally: one measures difficulty through a weakened search and another through full-strength search; one changes timing personality immediately mid-game and another pins it. Cache bucketing by `effectiveElo` then becomes ambiguous as well.

**Required correction.** Make Elo a two-part contract: `moveSelectionElo` controls the played move, while `perceptionElo` controls evidence interpretation/timing. Define the engine-strength policy for each stage, record both in diagnostics/cache keys, and define the reducer transition for Auto Adjust (for example bounded EMA/step per own move, reset only on a new runtime game token). Test mid-game Elo changes and cache isolation.

### 4. [P1] Position identity conflates cache equivalence, stale-execution identity, and unavailable history

**Evidence.** Current backend move caching intentionally uses the first four FEN fields plus Elo (`app.py:455-456`, `:862`), while the frontend uses the full observed FEN for request/schedule staleness (`script.js:2981-2990`; `auto_move_piece` compares the exact expected FEN at `:2745-2752`). The spine instead declares one “normalized full FEN plus runtime game token” identity for position and cache. Meanwhile the design asks Stage 0 to detect repetition (`SOLUTION-DESIGN.md:292`) even though a FEN does not contain repetition history, and AD-10 says session state is reconstructible from live position and clocks.

**Impact.** Using full FEN as a plan-cache key needlessly misses equivalent positions when only halfmove/fullmove counters differ; dropping counters from the execution key can accept a stale observation; and exact threefold-repetition state cannot be reconstructed from one FEN. This also makes `positionKey` validation and telemetry replay non-deterministic across implementations.

**Required correction.** Specify separate identities: an exact `observationKey` (full FEN + runtime game token/revision) for cancellation and execution guards; a canonical `analysisPositionKey` with explicitly listed FEN fields and history-dependent qualifiers for cache reuse; and an optional ephemeral repetition/history digest with confidence. After restart, repetition/surprise/last-move signals must degrade explicitly until rebuilt; do not claim they are reconstructed from FEN alone. Add transposition, fifty-move-counter, repetition-loss, and restart tests.

### 5. [P1] The executor contract loses promotion identity

**Evidence.** `/move-plan` returns a complete UCI move, but the existing integration calls `auto_move_piece(move.substring(0, 2), move.substring(2, 4), ...)` (`script.js:3008-3016`). The executor finds legality only by `from`/`to` and always sends `promotion: "q"` (`script.js:2733-2761`). Thus a legal engine underpromotion such as `e7e8n` can pass the guard and execute `e7e8q` instead. AD-8 says “legal move” but does not require equality with the selected full move; current tests cover only `e2e4`.

**Impact.** Move and evidence can belong to the same plan yet the browser executes a different move, violating the central `/move-plan` invariant and potentially invalidating subsequent session/evidence state.

**Required correction.** Change the scheduler seam to accept the complete normalized UCI move (or structured `{from,to,promotion}`), match the exact legal move including promotion, and execute that exact promotion. Treat malformed/ambiguous promotion as no execution. Add queen and underpromotion integration tests plus a stale/cancelled promotion case.

## Preserved constraints confirmed

- Existing one-scheduler rule and final stale-state guards are represented by AD-8 and Phase 5.
- Engine latency remains part of total observed think time, as required by the current test and design.
- Legacy `/getmove` compatibility, opening book/cache integration, feature-flag rollout, and hermetic fake-engine testing are retained.
- Missing clock/evidence signals degrade explicitly instead of silently becoming a fixed delay.
- Local storage is no longer a correctness dependency, matching the commercialization constraint.

