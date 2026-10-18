# Module 14 — Design Document and Engineering Plan

## 1. Critical risk analysis

### R1 — Multiple tabs create split-brain automation

**Failure:** two tabs observe the same terminal modal, both increment W/L/D, both choose a DDA mode, and both click New Game. A stale tab can also execute an already scheduled move after leadership changes.

**Exact mitigation:**

1. Permit Module 14 only on top-level `https://www.chess.com`; other origins cannot start automation.
2. Require the origin-scoped Web Locks API. Lease acquisition/takeover and every irreversible DOM effect run under the same exclusive Web Lock.
3. Persist one lease row `{leaseName, authorityEpoch, sessionId, ownerTabId, fencingToken, expiresAtEpochMs}` in IndexedDB.
4. Acquire/take over with one read-write transaction. Acquisition/takeover increments `fencingToken`; renewal retains the token.
3. Put the current fence in every reducer command and state-changing transaction.
5. While still holding the Web Lock, revalidate the unexpired fence in IndexedDB, then synchronously dispatch `click()` or the final move without an intervening `await`.
6. Make results unique by `[sessionId, canonicalPlatformGameId]`; duplicate insertion is a no-op.
7. Use `BroadcastChannel` only to accelerate notification. It cannot grant ownership.
8. During an active game, only a tab observing the persisted canonical game ID is eligible to acquire the lease.

### R2 — Chrome suspension invalidates timer assumptions

**Failure:** background throttling, sleep, discarded tabs, or machine suspend delays callbacks for minutes/hours. A two-hour session could continue queuing after its deadline if correctness depends on `setTimeout`.

**Exact mitigation:**

1. Persist `deadlineEpochMs=startedAtEpochMs+durationMs` before automation starts.
2. Treat timers as hints; all gates compare an effective wall time against the persisted deadline.
3. Reconcile on `pageshow`, `visibilitychange`, `focus`, `online`, heartbeat, and before every automation effect.
4. Keep `lastObservedEpochMs=max(lastObservedEpochMs, Date.now())` so a backward clock adjustment cannot move the observed deadline backward during a session.
5. Require configurable admission headroom before a queue intent. If expired with no dispatched work, complete immediately. If a dispatched intent or game exists, enter `DRAINING` and finish only that work up to `drainDeadlineEpochMs`.

### R3 — F5/crash between DDA computation and outcome commit

**Failure:** reload may generate a new runtime token, recompute a different target, lose the active game, or count the same result again.

**Exact mitigation:**

1. Calculate target Elo once at game admission inside the same IndexedDB transaction that persists `ActiveGame`.
2. Persist `runtimeGameToken`, `lastFen`, `positionRevision`, opponent observation, controller mode, offset, raw/effective targets, and calibration capability identity.
3. Restore the snapshot before enabling Auto Move after reload.
4. Persist the result event and updated counters atomically; use deterministic event key `result:<canonicalPlatformGameId>`.
5. Never reconstruct missing counters from DOM. A missing/corrupt authority pauses the session for explicit recovery and disables Auto Move as well as Auto Queue.

## 2. Scope

Module 14 runs bounded automated test sessions using the existing Auto Queue, Auto Move, Smart Pacing V2, and `/move-plan` infrastructure. It owns session lifecycle and the next game's target Elo. It does not select chess moves, configure UCI options, mutate the Elo artifact, or alter the engine coordinator.

The system is environment-agnostic. The only admission authority is the user's configured authorization allowlists: an exact string match on those allowlists permits operation whether the observed environment is public, private, or rated.

## 3. Control semantics

### 3.1 Outcome estimator

For a session with terminal counts `W`, `D`, `L`:

```text
n = W + D + L
posteriorWinRate = (controlWins + 1) / (controlTerminalGames + 2)
```

This is a Beta(1,1) posterior mean. Draws are terminal non-wins, matching the requested literal win rate rather than chess score. The UI separately shows all observed session W/D/L and controller-eligible W/D/L. A closed-form Wilson interval with `z=1.959963984540054` is presentation telemetry only and is never persisted as authoritative state. No actuation occurs before `controlTerminalGames >= minCompletedGames`.

### 3.2 Hysteresis

```text
initial mode = BOOST

BOOST:
  if n >= minimum and posteriorWinRate > maxWinRate -> CORRECT
  else remain BOOST

CORRECT:
  if n >= minimum and posteriorWinRate < minWinRate -> BOOST
  else remain CORRECT
```

Inside the band the controller retains its prior mode. This is essential: immediately forcing `+200` everywhere inside the band would remove hysteresis and make the actuator chatter near the ceiling.

### 3.3 Actuator

```text
offsetElo = mode == BOOST ? +200 : -200
rawTargetElo = opponentElo + offsetElo
effectiveTargetElo = clamp(rawTargetElo, capability.minimumElo, capability.maximumElo)
```

Saturation is explicit. It never changes the measured opponent rating or claims support outside the promoted calibration artifact.

A saturated game remains controller-eligible because its applied strength is known. The snapshot tracks consecutive saturated eligible games in the same controller mode. At `maximumConsecutiveSaturatedGames` the next admission pauses with `ACTUATOR_SATURATED`; the loop never pretends it still has directional authority.

The target is pinned per game. A result may alter only the next game's mode and target.

## 4. State machine

### 4.1 Durable lifecycle states

| State | Auto Queue | Auto Move | Meaning |
| --- | --- | --- | --- |
| `IDLE` | Off | Off | No running session. |
| `QUEUEING` | Leader-gated | Off until game bind | Session may admit exactly one queue intent before TTL. |
| `IN_GAME` | Off | Leader-gated on | One persisted game is running. |
| `DRAINING` | Off | On for persisted game only | TTL/stop occurred after admission; finish and stop. |
| `PAUSED_QUEUEING` | Off | Off | Queue-side dependency failure requires recovery. |
| `PAUSED_ACTIVE` | Off | Off | Active game exists but automated continuation is unsafe; resume or transition to `DRAINING` is explicit. |
| `COMPLETED` | Off | Off | Immutable terminal session snapshot. |
| `ABORTED` | Off | Off | Immutable force-stopped snapshot; no result is synthesized. |

`RECOVERING` is a transient process state, not persisted. Bootstrap reads configuration, opens/migrates IndexedDB, validates the snapshot, reconciles wall time/context, then emits one durable transition.

Durable `phase` is exactly one of the eight values above. Storage/context/calibration details are never phase aliases; they are strict `pauseReason` values such as `STORAGE_UNAVAILABLE`, `ACCOUNT_MISMATCH`, `QUEUE_EFFECT_AMBIGUOUS`, or `CALIBRATION_NOT_ACTIVE`.

### 4.2 Transition table

| From | Event/guard | To | Atomic effects |
| --- | --- | --- | --- |
| `IDLE` | `START` + valid preflight | `QUEUEING` | Create session, deadline, counters, BOOST controller. |
| `QUEUEING` | `ADMIT_QUEUE` before TTL | `QUEUEING` | Persist one `QueueIntent` before click. |
| `QUEUEING` | stable game consumes intent | `IN_GAME` | Persist provisional `ActiveGame` with `targetPinStatus=PENDING`; no Auto Move yet. |
| `IN_GAME` | capability translation/pin succeeds | `IN_GAME` | Atomically persist actuator identity/target and `targetPinStatus=PINNED`; enable guarded Auto Move. |
| `IN_GAME` | capability translation/pin fails | `PAUSED_ACTIVE` | Preserve provisional game; `CALIBRATION_NOT_ACTIVE`; no Auto Move. |
| `QUEUEING` | TTL, no intent or `PREPARED` | `COMPLETED` | Cancel `PREPARED`; terminal reason `TTL_EXPIRED`. |
| `QUEUEING` | TTL, `CLAIMED` | `PAUSED_QUEUEING` | Mark `AMBIGUOUS`; never dispatch; require positive platform reconciliation. |
| `QUEUEING` | TTL, `DISPATCHED` | `DRAINING` | Cancel further queue effects; wait for bound game until the earlier intent/drain deadline. |
| `IN_GAME` | TTL or graceful stop | `DRAINING` | Retain active game and Auto Move permission. |
| `IN_GAME` | unique terminal result before TTL | `QUEUEING` | Append result, update counters/controller, clear game. |
| `DRAINING` | unique terminal result | `COMPLETED` | Append result, clear game, terminal snapshot. |
| any running | storage unsafe | matching paused phase | Disable all automated effects; preserve audit state. |
| any running | context/calibration unsafe | matching paused phase | Stop automated effects; a separate successful reconciliation event may resume or enter `DRAINING`. |
| paused phase | explicit resume + valid preflight | reconciled phase | New fence; ambiguous effects are never replayed. |
| any nonterminal | `REQUEST_GRACEFUL_STOP` | `COMPLETED` or `DRAINING` | Cancel unclaimed intent; drain dispatched intent/active game. |
| any nonterminal | confirmed `FORCE_STOP` | `ABORTED` | Cancel automation immediately; no outcome synthesized. |

### 4.3 Queue-intent deadline matrix

| Intent at TTL/stop | Reducer action | May dispatch afterward? |
| --- | --- | --- |
| none | Complete if no active game | No |
| `PREPARED` | Atomically `CANCELLED`, then complete | No |
| `CLAIMED` | Atomically `AMBIGUOUS`, pause queueing | No |
| `DISPATCHED` | Enter draining and observe until `min(observeUntilEpochMs, drainDeadlineEpochMs)` | Never re-dispatch |
| `MATCH_OBSERVED` | Drain the bound active game | No new queue |
| `AMBIGUOUS` | Remain paused/draining until reconciliation | No |

On first entry to `DRAINING`, persist `enteredDrainingAtEpochMs=effectiveNowMs` and `drainDeadlineEpochMs=effectiveNowMs+maximumDrainMs`; neither value is recomputed or extended. An ambiguous effect may be released only after positive platform cancellation/idle evidence observed twice at least 250 ms apart plus a 30-second quarantine. A late game during that interval binds the old intent and drains. Without positive evidence, only confirmed force-stop can abort the session, and the global orphan guard still blocks a new Module 14 session while a live/queued platform context remains.

### 4.4 Effect ordering

The reducer returns `{nextState, effects[]}`. The controller executes only after the state transaction commits:

1. Read snapshot and lease in one transaction.
2. Validate command schema, session revision, account, phase, fence, and TTL.
3. Reduce to a new immutable snapshot.
4. Insert idempotent event, replace snapshot, and update `metadata.currentSessionId` atomically.
5. Commit.
6. Update GM recovery pointer best-effort.
7. Execute declared DOM/network/timer effects. Irreversible effects acquire the shared Web Lock.
8. Under that Web Lock, re-open a short transaction, validate the fence/session revision, then dispatch synchronously without releasing the lock.

## 5. Durable contracts

### 5.1 Session configuration

```json
{
  "schemaVersion": 1,
  "durationMs": 7200000,
  "minWinRate": 0.75,
  "maxWinRate": 0.82,
  "boostOffsetElo": 200,
  "correctionOffsetElo": -200,
  "minCompletedGames": 8,
  "perceptionElo": 1700,
  "scaleId": "stockfish19-uci-elo-500ms-xeon-envelope-v1",
  "estimatorVersion": "beta-binomial-terminal-v1",
  "controllerVersion": "two-threshold-hysteresis-v1",
  "minimumAdmissionHeadroomMs": 30000,
  "queueObservationTimeoutMs": 120000,
  "maximumDrainMs": 7200000,
  "maximumConsecutiveSaturatedGames": 2
}
```

Validation rules:

- `durationMs`: integer `[60000, 86400000]`.
- `0 < minWinRate < maxWinRate < 1`.
- offsets: integers `[-1000,1000]`; v1 UI defaults to `+200/-200`.
- `minCompletedGames`: integer `[1,100]`.
- `minimumAdmissionHeadroomMs`: integer `[5000,600000]` and less than `durationMs`.
- `queueObservationTimeoutMs`: integer `[10000,600000]`.
- `maximumDrainMs`: integer `[60000,14400000]`.
- `maximumConsecutiveSaturatedGames`: integer `[1,20]`.
- `perceptionElo`: integer accepted by `/move-plan` and independent from DDA.
- unknown fields or unknown versions fail closed.

### 5.2 Session snapshot

```json
{
  "schemaVersion": 1,
  "sessionId": "128-bit-hex",
  "revision": 42,
  "accountKey": "local-normalized-account-key",
  "phase": "IN_GAME",
  "createdAtEpochMs": 1791853200000,
  "startedAtEpochMs": 1791853200000,
  "deadlineEpochMs": 1791860400000,
  "enteredDrainingAtEpochMs": null,
  "drainDeadlineEpochMs": null,
  "lastObservedEpochMs": 1791856800000,
  "config": {},
  "observedCounts": {
    "wins": 9,
    "draws": 1,
    "losses": 2,
    "terminalGames": 12
  },
  "controlCounts": {
    "wins": 8,
    "draws": 1,
    "losses": 2,
    "terminalGames": 11
  },
  "consecutiveSaturatedEligibleGames": 0,
  "saturationControllerMode": null,
  "controller": {
    "mode": "CORRECT",
    "posteriorWinRate": 0.7142857142857143,
    "decisionAtGameCount": 12
  },
  "queueIntent": null,
  "activeGame": {},
  "pauseReason": null,
  "completionReason": null
}
```

Derived values are recomputed and verified during decode; a persisted posterior inconsistent with control counts is corruption. Wilson display bounds are recomputed and not persisted.

### 5.3 Active game

```json
{
  "schemaVersion": 1,
  "canonicalPlatformGameId": "stable-platform-game-id",
  "queueIntentId": "128-bit-hex",
  "admittedAtEpochMs": 1791856700000,
  "runtimeGameToken": "128-bit-hex",
  "targetPinStatus": "PINNED",
  "calibrationCapabilityExpiresAtEpochMs": 1791943200000,
  "lastFen": "exact-six-field-fen",
  "positionRevision": 17,
  "opponent": {
    "rating": 1824,
    "ratingScaleId": "chesscom-live-rapid-v1",
    "source": "platform-adapter-v1",
    "confidence": 1.0,
    "observedAtEpochMs": 1791856700500
  },
  "actuator": {
    "controllerMode": "CORRECT",
    "offsetElo": -200,
    "rawTargetElo": 1588,
    "effectiveTargetElo": 1588,
    "ratingScaleMappingVersion": "chesscom-rapid-to-sf19-v1",
    "ratingScaleMappingChecksum": "lowercase-sha256",
    "saturated": false,
    "saturationReason": null,
    "scaleId": "stockfish19-uci-elo-500ms-xeon-envelope-v1",
    "artifactChecksum": "lowercase-sha256",
    "artifactVersion": "komodo-14.1-sf19-500ms-v1",
    "cohort": "canary",
    "rolloutVersion": "canary-sha256-v1",
    "seedPolicyVersion": "sha256-lp64-v1",
    "requiredBudgetClass": "selector-500ms-v1"
  },
  "actuation": {
    "valid": true,
    "invalidReason": null,
    "appliedMoveCount": 16,
    "nonAppliedMoveCount": 0,
    "resolvedProfile": {
      "resolverVersion": "pchip-inverse-bisection-v1",
      "resolutionKey": "lowercase-sha256",
      "latentSkill": 12.42,
      "appliedSkill": 12,
      "budgetClass": "selector-500ms-v1",
      "profileDigest": "lowercase-sha256"
    }
  }
}
```

Control eligibility is irreversible per game. `source=book|forced` with `calibrationStatus=not_applied` is neutral. The first applied engine response atomically pins `resolvedProfile`; all later engine responses must match the complete actuator and profile identity. The first fallback, shadow, mismatch, or invalid engine response sets `valid=false` and preserves the first reason. The terminal outcome always enters `observedCounts`, but enters `controlCounts` only when `valid=true && appliedMoveCount >= 1`; otherwise use `ACTUATOR_NOT_EXERCISED` for the zero-applied case. After an eligible saturated result, increment `consecutiveSaturatedEligibleGames` only when `controller.mode` equals `saturationControllerMode`; reset to zero on an unsaturated eligible result or controller-mode change. At the configured maximum, pause before the next admission with `ACTUATOR_SATURATED`.

### 5.4 Canonical event envelope

```json
{
  "schemaVersion": 1,
  "eventId": "result:<canonicalPlatformGameId>",
  "sessionId": "128-bit-hex",
  "authorityEpoch": 3,
  "expectedRevision": 41,
  "sequence": 42,
  "occurredAtEpochMs": 1791856800000,
  "type": "GAME_RESULT_OBSERVED",
  "payload": {},
  "reducerVersion": "session-control-reducer-v1"
}
```

`sequence=expectedRevision+1`; `(sessionId,eventId)` and `(sessionId,sequence)` are unique. Timestamps are event inputs, not generated by the reducer. Snapshots carry a canonical SHA-256 over state excluding the checksum. Snapshot/journal divergence pauses migration; v1 does not silently replay across reducer versions.

### 5.5 Queue intent

```json
{
  "schemaVersion": 1,
  "intentId": "128-bit-hex",
  "runtimeGameToken": "128-bit-hex",
  "status": "DISPATCHED",
  "preparedAtEpochMs": 1791856700000,
  "claimedByFence": 8,
  "dispatchedAtEpochMs": 1791856700100,
  "observeUntilEpochMs": 1791856820100
}
```

Allowed transitions are `PREPARED→CLAIMED→DISPATCHED→MATCH_OBSERVED`, `PREPARED→CANCELLED`, and `CLAIMED|DISPATCHED→AMBIGUOUS`. A recovered `CLAIMED` or timed-out `DISPATCHED` intent is never replayed; it becomes `PAUSED_QUEUEING/QUEUE_EFFECT_AMBIGUOUS`. It may close only after positive idle/cancellation evidence plus quarantine, or be consumed by a late canonical game. Closure never fabricates W/D/L.

## 6. Persistence topology

### 6.1 IndexedDB

Database: `thinker-session-control`, version `1`.

| Store | Key | Purpose |
| --- | --- | --- |
| `sessions` | `sessionId` | Current and completed snapshots. |
| `events` | `[sessionId,eventId]` | Immutable command/outcome journal and deduplication. |
| `leases` | `leaseName` | Leader lease and fencing token. |
| `metadata` | `key` | DB schema/migration, authority epoch, and current-session pointer. |

Required indexes: `sessions.phase`, `events.sessionId`, unique `events.[sessionId,sequence]`, and unique `events.[sessionId,canonicalPlatformGameId]` for results. Initial event, session snapshot, account-scoped `metadata.currentSessionId`, and lease binding share one transaction. At most one nonterminal session per account is valid.

Runtime compatibility is capability-based: top-level secure context, IndexedDB transactions, Web Locks, BroadcastChannel, Web Crypto SHA-256, and Tampermonkey `GM_getValue`/`GM_setValue` are mandatory. Preflight tests each capability and blocks start with `UNSUPPORTED_BROWSER_CAPABILITY`; there is no weakened fallback. Retain the latest 30 completed/aborted sessions per account and all nonterminal sessions. Pruning is an explicit post-commit maintenance transaction, never part of result admission; quota failure pauses before the next effect and never deletes the current session.

### 6.2 GM storage

| Key | Content |
| --- | --- |
| `thinker.sessionControl.config.v1` | Validated `SessionConfig`. |
| `thinker.sessionControl.recovery.v1` | `{schemaVersion, sessionId, revision, deadlineEpochMs, dbName}` only. |

The bearer capability remains in its existing isolated GM key and is never copied into IndexedDB, events, logs, or session state.

### 6.3 Recovery algorithm

1. Disable effective Auto Queue/Move during bootstrap.
2. Open and migrate IndexedDB transactionally.
3. Load current session pointer and snapshot.
4. Verify schema, derived statistics, account binding, active-game identity, and deadline.
5. Acquire a new lease/fence only if this tab is eligible for the current phase/game.
6. Increment `authorityEpoch` for an explicit reset; every callback binds the epoch. Reset is forbidden while a dispatched/ambiguous queue effect or active game is unresolved.
7. Cancel all pre-reload timers by construction; rebuild effects from durable state.
8. Reconcile TTL and current page context.
9. Enable only effects allowed by the reconciled phase.

If the GM pointer references a missing DB snapshot, enter the context-appropriate paused phase with `pauseReason=STORAGE_UNAVAILABLE` and show explicit “recover/reset” UI. Never treat it as a fresh session.

## 7. Calibration capability and exact `/move-plan` integration

### 7.0 Rating-scale boundary

Chess.com ratings and the Stockfish-UCI benchmark scale are not numerically interchangeable. The platform adapter emits a time-control-specific `opponent.ratingScaleId` (for example `chesscom-live-rapid-v1`). The configured DDA offsets are points on that same platform scale. A separately validated, immutable cross-scale artifact computes:

```text
platformAdjustedRating = opponent.rating + selectedOffsetElo
rawTargetElo = translate(
  platformAdjustedRating,
  opponent.ratingScaleId,
  calibration.scaleId,
  ratingScaleMappingVersion
)
```

The translator is monotonic, content-addressed, versioned, and pinned per game. It must be estimated from matched outcome data for the relevant Chess.com pool/time class; it cannot be inferred from the engine curve. Missing, stale, unsupported, or out-of-support translation blocks admission with `RATING_SCALE_UNMAPPED`. If a future Elo artifact is calibrated directly against that Chess.com pool, it declares the same input scale and translation is the versioned identity mapping.

The backend owns a read-only `RatingScaleTranslator`. Its promoted JSON artifact contains `schemaVersion`, `mappingVersion`, `sourceScaleId`, `targetScaleId`, supported source/target bounds, monotonic PCHIP knots/coefficients, dataset checksum, validation-attestation checksum, and artifact checksum. An offline `tools/rating_scale_mapping/` pipeline ingests consented matched-game outcomes for one time class, fits weighted isotonic anchors plus PCHIP, performs a held-out calibration check, and publishes only attested artifacts. Module 14 active DDA cannot launch until such an artifact is promoted; lifecycle-only shadow testing may proceed.

### 7.1 Capability pin

Queue admission first calls authenticated `POST /calibration-readiness` with `{schemaVersion:1, opponentRatingScaleId, targetScaleId, requiredMode:"active"}`. The response contains only readiness, mapping/artifact identity, supported source bounds, `generatedAtEpochMs`, and `expiresAtEpochMs`; it does not allocate a runtime token or target. It is cacheable only until expiry. Missing readiness blocks queue admission. Opponent-specific capability pinning happens only after stable match observation:

Add authenticated `POST /calibration-capability`:

```json
{
  "schemaVersion": 1,
  "runtimeGameToken": "128-bit-hex",
  "scaleId": "stockfish19-uci-elo-500ms-xeon-envelope-v1",
  "opponentRatingScaleId": "chesscom-live-rapid-v1",
  "opponentRating": 1824,
  "offsetElo": -200,
  "platformAdjustedRating": 1624,
  "requiredMode": "active"
}
```

It atomically uses the existing calibration runtime registry to pin cohort/artifact and returns:

```json
{
  "schemaVersion": 1,
  "runtimeGameToken": "128-bit-hex",
  "mode": "active",
  "cohort": "canary",
  "scaleId": "stockfish19-uci-elo-500ms-xeon-envelope-v1",
  "opponentRatingScaleId": "chesscom-live-rapid-v1",
  "ratingScaleMappingVersion": "chesscom-rapid-to-sf19-v1",
  "ratingScaleMappingChecksum": "lowercase-sha256",
  "platformAdjustedRating": 1624,
  "translatedTargetElo": 1588,
  "effectiveTargetElo": 1588,
  "targetSaturated": false,
  "artifactVersion": "komodo-14.1-sf19-500ms-v1",
  "artifactChecksum": "lowercase-sha256",
  "seedPolicyVersion": "sha256-lp64-v1",
  "allowedBudgetClasses": ["selector-500ms-v1"],
  "minimumElo": 900,
  "maximumElo": 3064,
  "expiresAtEpochMs": 1791943200000,
  "rolloutVersion": "canary-sha256-v1"
}
```

The server verifies `platformAdjustedRating == opponentRating + offsetElo`, translates and clamps it, and returns the only target accepted for that runtime token. The client never evaluates mapping coefficients. The capability is valid only for the exact runtime token and until expiry. Activation changes affect new tokens; the pinned token retains both mapping and Elo artifacts under existing capacity/TTL policy.

### 7.2 Move plan schema v2

Module 14 adds only a declarative calibration precondition, never engine controls:

```json
{
  "schemaVersion": 2,
  "requestId": "<runtimeGameToken>-<positionRevision>",
  "runtimeGameToken": "<activeGame.runtimeGameToken>",
  "positionRevision": 17,
  "observationKey": "obs2:<sha256>",
  "analysisPositionKey": "ana1:<sha256>",
  "fen": "<exact six-field FEN>",
  "lastMove": null,
  "historyDigest": null,
  "moveSelectionElo": 1588,
  "perceptionElo": 1700,
  "analysisTier": "standard",
  "clientBudgetMs": 700,
  "analysisBudgetVersion": 1,
  "evidenceModelVersion": 1,
  "calibrationRequirement": {
    "requiredMode": "active",
    "scaleId": "stockfish19-uci-elo-500ms-xeon-envelope-v1",
    "artifactVersion": "komodo-14.1-sf19-500ms-v1",
    "artifactChecksum": "lowercase-sha256",
    "cohort": "canary",
    "rolloutVersion": "canary-sha256-v1",
    "seedPolicyVersion": "sha256-lp64-v1",
    "budgetClass": "selector-500ms-v1",
    "ratingScaleMappingVersion": "chesscom-rapid-to-sf19-v1",
    "ratingScaleMappingChecksum": "lowercase-sha256"
  }
}
```

Binding rules:

- `moveSelectionElo = activeGame.actuator.effectiveTargetElo`.
- `perceptionElo = session.config.perceptionElo`; it does not flip with DDA.
- Schema v1 remains accepted for legacy callers and retains `obs1`. Schema v2 computes `observationKey = "obs2:" + SHA-256(canonical JSON of {schemaVersion:2,runtimeGameToken,positionRevision,fen})`; `analysisPositionKey` remains `ana1` because its algorithm is unchanged. Client and backend add v2 in the same release.
- `POSITION_OBSERVED` is the only event that advances `positionRevision`. A new exact six-field FEN, stable across two reads, commits `positionRevision+1`, FEN, and observation key before any request. The same FEN is a no-op. A corrected/different FEN always receives a new revision; a revision is never rewritten.
- Request identity uses the persisted active-game runtime token and revision. An exact retry reuses the identical request ID, body digest, and response. A new SQLite-WAL `MovePlanIdempotencyStore` keyed by `(runtimeGameToken,requestId)` stores body SHA-256, state `PENDING|COMPLETE|INDETERMINATE`, claim owner/epoch, complete response, and expiry. `BEGIN IMMEDIATE` plus the unique key elects one caller; concurrent identical callers seeing `PENDING` receive `202 REQUEST_IN_PROGRESS` with `Retry-After` and never invoke the engine. The owner atomically changes `PENDING→COMPLETE` before reply. A process crash leaving `PENDING` is changed to `INDETERMINATE` at startup; it returns `503 REQUEST_OUTCOME_INDETERMINATE` and is never automatically re-executed, making that game non-controlling. Entries remain until 24 hours after runtime-token expiry; capacity is 50,000, cleanup removes expired terminal rows at startup and every 1,000 writes, and full capacity returns `503 IDEMPOTENCY_CAPACITY` before engine work. Reusing an ID with a different body digest returns `409 REQUEST_ID_CONFLICT` before engine admission.
- The active game and position snapshot are committed before this request can be issued. Persisted FEN/revision are reconciliation identity only; recovery must re-observe the live board and never execute a stored move or restore Smart Pacing timing debt from them.
- The final request guard checks session phase, game ID, FEN/revision, leader fence, user Auto Move, and Puzzle exclusion.
- Authorization remains `Authorization: Bearer <capability>` through the existing isolated GM credential.

The response is accepted for DDA evidence only if:

```text
response identity matches request
AND calibration.calibrationStatus == "applied"
AND calibration.targetElo == activeGame.actuator.effectiveTargetElo
AND calibration.scaleId == activeGame.actuator.scaleId
AND calibration.artifactVersion == activeGame.actuator.artifactVersion
AND calibration.artifactChecksum == activeGame.actuator.artifactChecksum
AND calibration.calibrationCohort == activeGame.actuator.cohort
AND calibration.rolloutVersion == activeGame.actuator.rolloutVersion
AND calibration.seedPolicyVersion == activeGame.actuator.seedPolicyVersion
AND calibration.budgetClass == activeGame.actuator.requiredBudgetClass
AND calibration.ratingScaleMappingVersion/checksum match activeGame.actuator
AND calibration.resolverVersion/resolutionKey/latentSkill/appliedSkill/profileDigest
    match the profile pinned by the first applied engine response
```

For `source=book|forced`, `not_applied` is neutral. Schema-v2 cache responses must include immutable `originSource` and the original calibration identity: cached `book|forced` is neutral; cached `engine` is treated exactly like the original applied plan; missing/unknown `originSource` is invalid. `source=static` is always a degraded fallback and invalidates control eligibility. For engine-origin responses, `shadow`, `not_applied`, fallback, identity mismatch, timeout, or unsupported target irreversibly marks the game non-controlling and blocks the next admission. It does not cause an out-of-budget retry.

## 8. Integration with existing Auto Queue and Auto Move

### 8.1 Platform evidence contract

Module 14 is enabled only on top-level `https://www.chess.com`. The bare host and any frame cannot acquire leadership. The platform adapter must emit:

```json
{
  "schemaVersion": 1,
  "canonicalPlatformGameId": "normalized immutable game id",
  "accountKey": "sha256",
  "opponentKey": "sha256",
  "opponentRating": 1824,
  "opponentRatingScaleId": "chesscom-live-rapid-v1",
  "userSide": "white",
  "contextClass": "opaque-context-a",
  "poolId": "opaque-pool-a",
  "rated": false,
  "observedAtEpochMs": 1791856700500,
  "sourceVersion": "chesscom-context-v1"
}
```

Account identity uses the ASCII username parsed from the canonical authenticated account-link href, normalized with JavaScript `normalize("NFKC").toLowerCase()`, and hashed with the fixed `chess.com:` namespace. It must agree with the user's board-side identity. Opponent identity/rating must be bound to the other side of the same canonical game. Two byte-equivalent observations at least 250 ms apart are required. A provisional URL identity may be aliased once to a platform UUID atomically; conflicting aliases pause. Missing/unstable evidence times out to `PAUSED_ACTIVE/OPPONENT_UNCERTAIN`, never to a guessed rating.

Session start additionally requires `accountKey` and the observed opaque context tokens in `GM_getValue("thinker.sessionControl.authorization.v1")`, validated as `{schemaVersion:1, enabled:boolean, allowedTestAccountKeys:string[], allowedContextClasses:string[], allowedPoolIds:string[]}` with unique, non-empty values and no unknown fields. The evaluator contains no platform-specific context/pool literals and performs only normalized `Array.includes`-equivalent membership checks; it does not inspect the meaning of any token or the platform `rated` field. `"*"`, regex syntax, empty entries, and pattern matching are invalid because they make exact authorization unreviewable. This authorization DTO is separate from `SessionConfig`, is never copied into session state, and defaults disabled with empty allowlists. Exact membership is the complete decision: when the observed account, context, and pool strings match the configured arrays, session start is permitted regardless of whether the environment is public, private, or rated. Tokens absent from the allowlists fail closed.

Terminal results use a separate strict DTO:

```json
{
  "schemaVersion": 1,
  "canonicalPlatformGameId": "normalized immutable game id",
  "accountKey": "sha256",
  "userSide": "white",
  "outcome": "W",
  "termination": "checkmate",
  "source": "terminal-modal-v1",
  "observedAtEpochMs": 1791857000000,
  "proofDigest": "sha256-over-canonical-evidence"
}
```

`outcome` is always from the bound account's perspective and belongs to `{W,D,L}`. `terminal-modal-v1` requires two identical observations at least 250 ms apart, both bound to the active canonical game and user side. A future authoritative platform-response source may satisfy the contract once explicitly implemented and versioned. The existing URL-change `.game-result` heuristic alone is insufficient and cannot feed Module 14.

### 8.2 Effective gates

Replace direct checks of `auto_queue` with an injected gate:

```text
canQueue =
  userAutoQueue
  && isLeader
  && phase == QUEUEING
  && effectiveNowMs + minimumAdmissionHeadroomMs < deadlineEpochMs
  && storageHealthy
  && calibrationReadiness.active
  && calibrationReadiness.opponentRatingScaleId == intendedQueueScaleId
  && effectiveNowMs < calibrationReadiness.expiresAtEpochMs
  && queueIntent == null
  && activeGame == null
```

The queue controller persists `PREPARED`, claims it, then acquires the shared effect Web Lock. Under that lock it revalidates the fence/revision and readiness expiry, transitions to `DISPATCHED`, and synchronously invokes the existing safe clicker. After stable game/opponent observation it calls `/calibration-capability`, persists the returned translated/pinned target, and only then enables the first move-plan. The existing one-second fallback/re-click path is disabled for Module 14; a missing game observation becomes ambiguity, not a second click. A recovered claimed/dispatched effect is observed but never clicked again.

```text
canAutoMove =
  userAutoMove
  && isLeader
  && phase in {IN_GAME, DRAINING}
  && activeGame.targetPinStatus == PINNED
  && activeGame.actuator != null
  && activeGame.calibrationCapabilityExpiresAtEpochMs > effectiveNowMs
  && observedCanonicalPlatformGameId == activeGame.canonicalPlatformGameId
  && persisted observation identity matches
  && gameMode == "play"
```

The existing single scheduler remains the sole move executor. Module 14 supplies guards/context and an `effectEpoch`; start, pause, leadership change, graceful stop, force stop, and completion increment the epoch and invalidate legacy callbacks. Final move dispatch uses the same Web Lock/fence protocol. It does not create another move timer. V1 rejects start while a live game is visible; implicit adoption is forbidden. It permits start from a stable terminal modal: that already-finished game is a pre-session baseline and never counted, while the existing “new game” control may dispatch the first durable QueueIntent. It also permits start from a stable idle lobby through a versioned `idle-lobby-v1` queue adapter. If neither entry adapter is positively identified, start fails closed.

When session phase is running, legacy `AutoAdjustRating` is suspended. Its stored preference/history remains untouched and resumes only outside Module 14. Turning the user's Auto Move toggle off is an explicit force-stop of automation for the active game; the session becomes `PAUSED_ACTIVE/USER_AUTOMOVE_DISABLED` and never ignores user intent merely to satisfy graceful drain.

## 9. Failure behavior

| Failure | Current game | New games | State/reason |
| --- | --- | --- | --- |
| Lease lost | Cancel pending effects; another eligible leader may resume | Block | follower, `LEADER_LOST` diagnostic |
| IndexedDB write fails | Stop automated moves; user may continue manually | Block | matching paused phase / `STORAGE_UNAVAILABLE` |
| Chrome wakes after TTL | Drain admitted work | Block | `DRAINING` or `COMPLETED` |
| Opponent rating uncertain | No first DDA plan until stable | Block | `PAUSED_ACTIVE/OPPONENT_UNCERTAIN` |
| Account changes | Stop automation | Block | `PAUSED_ACTIVE/ACCOUNT_MISMATCH` |
| Calibration shadow/unavailable on engine-sourced plan | Mark control eligibility invalid; no retry | Block | `DRAINING/CALIBRATION_NOT_ACTIVE` |
| Target outside support | Use declared bound and record saturation | Continue unless saturation policy trips | `TARGET_SATURATED` telemetry |
| Duplicate result | No-op | Unchanged | Existing unique event returned |
| Unknown terminal outcome | Record excluded audit event; never synthesize W/D/L | Block until authoritative reconciliation or explicit exclusion | `PAUSED_ACTIVE/OUTCOME_UNKNOWN` |
| Puzzle navigation | Cancel competitive effects | Block | session preserved, no mutation |
| Queue effect survives owner/crash without game | Never replay click | Block | `PAUSED_QUEUEING/QUEUE_EFFECT_AMBIGUOUS` |
| Drain deadline expires | Stop automation; no fabricated outcome | Block | `ABORTED/UNRECONCILED_DRAIN_TIMEOUT` |

### 9.1 Exhaustive pause policy

No paused phase permits Auto Move. A successful reconciliation event must first commit a transition to `IN_GAME`, `DRAINING`, or `QUEUEING`; only then may an effect run.

| Pause reason | Durable phase | Resume requirement | Destination |
| --- | --- | --- | --- |
| `STORAGE_UNAVAILABLE` | queue/active matching context | IndexedDB write/read/checksum probe succeeds and context revalidates | reconciled prior phase; `DRAINING` if TTL passed |
| `QUEUE_EFFECT_AMBIGUOUS` | `PAUSED_QUEUEING` | positive idle/cancel evidence + quarantine, or late game binds intent | `QUEUEING`/`COMPLETED`, or `DRAINING` for late game |
| `OPPONENT_UNCERTAIN` | `PAUSED_ACTIVE` | two stable bound observations and target pin succeeds | `IN_GAME` or `DRAINING` |
| `ACCOUNT_MISMATCH` | `PAUSED_ACTIVE` | original account/game identity returns; otherwise force-stop only | `IN_GAME`/`DRAINING`, or `ABORTED` |
| `CALIBRATION_NOT_ACTIVE` | queue/active matching context | exact pinned capability becomes serviceable; invalid game stays non-controlling | prior phase or `DRAINING` |
| `USER_AUTOMOVE_DISABLED` | `PAUSED_ACTIVE` | user explicitly re-enables and all final guards pass | `IN_GAME` or `DRAINING` |
| `OUTCOME_UNKNOWN` | `PAUSED_ACTIVE` | authoritative terminal evidence or explicit excluded-result reconciliation | `QUEUEING`/`COMPLETED` |
| `ACTUATOR_SATURATED` | `PAUSED_QUEUEING` | new validated mapping/range or explicit new-session policy | `QUEUEING` or `ABORTED` |

## 10. Observability

Local structured events:

- `session_started`, `session_recovered`, `session_draining`, `session_completed`;
- `leader_acquired`, `leader_lost`, `lease_takeover`;
- `queue_intent_admitted`, `queue_intent_consumed`, `queue_intent_expired`;
- `game_target_pinned`, `result_committed`, `duplicate_result_ignored`;
- `dda_mode_changed`, `target_saturated`, `calibration_mismatch`, `session_paused`.

Each includes versions, phase, revision, observed/control counts, controller mode, posterior rate, offset, raw/effective target, clamp status, and reason code. Default events exclude usernames, bearer tokens, FEN, and raw game records.

UI status must show: remaining TTL, drain deadline, lifecycle phase, leader/follower, observed W-D-L, control-eligible W-D-L, raw and posterior win rate, configured band, current DDA mode/offset, active game's opponent/target, saturation, and last typed warning.

## 11. Implementation phases

### Phase 0 — Contracts and pure core

- Add strict DTO validators and enums.
- Implement pure reducer, Beta posterior, presentation-only Wilson interval, and hysteresis.
- Add property tests: counters never negative, one result changes counts once, inside-band mode stability, TTL never returns from draining to queueing.

Exit gate: deterministic replay of an event sequence yields byte-equivalent canonical snapshot.

Add `frontend/session_control/` as source and `scripts/build_userscript.py` as a deterministic assembler. It replaces only a delimited generated region in `script.js`; CI rebuilds and requires zero diff. Tampermonkey continues installing `script.js`.

### Phase 1 — Transactional repository and leadership

- Add IndexedDB migrations, event uniqueness, atomic snapshot commit.
- Add GM config/recovery adapter.
- Add canonical-origin guard, Web Lock effect critical section, and lease/fencing with fake-clock multi-tab tests. Lease duration is 15 seconds, renewal every 5 seconds, renewal retains the token, and takeover uses the persisted monotonic wall-clock floor.
- Implement bootstrap/recovery and typed corruption handling.

Exit gate: two simulated tabs cannot both commit an effect; stale fencing tokens always fail.

### Phase 2 — Auto Queue/Move gates

- Wrap existing Auto Queue decision/click with `QueueIntent` admission.
- Add final fence/revision guard to queue click and single move executor.
- Bind stable platform game/result identity.
- Suspend legacy AutoAdjust ownership while session runs.

Exit gate: reload and leader takeover during queue delay, active game, and terminal modal produce no duplicate click/result/move.

### Phase 3 — DDA and `/move-plan`

- Split Smart Pacing client input into `moveSelectionElo` and `perceptionElo`.
- Persist/reuse runtime game token and position revision.
- Add the authenticated capability-pin endpoint, `/move-plan` schema v2 requirement, and response identity validation.
- Add the SQLite-WAL request replay store and its PENDING/concurrency/crash recovery contract.
- Build `tools/rating_scale_mapping/`, validate/promote the first time-class-specific cross-scale artifact, and integrate the backend `RatingScaleTranslator`; active DDA remains gated until promotion.
- Pin target before first request and block mid-game retargeting.

Exit gate: every request in one game carries one target; the next terminal result alone may alter the next target.

### Phase 4 — UI, telemetry, rollout

- Add duration/band/start/drain controls and clear degraded-state messaging.
- Add bounded local telemetry and diagnostic export without secrets.
- Ship disabled, then shadow reducer, then Auto Queue gate canary, then active DDA.

Exit gate: recovery, sleep, multi-tab, F5, TTL, missing opponent, unsupported Elo, shadow calibration, and backend timeout scenarios pass end-to-end.

## 12. Test matrix

Minimum hermetic coverage:

1. Two tabs race for the Web Lock/lease; exactly one fence wins and renewal retains its token.
2. Old leader wakes and attempts queued click/move; effect lock plus fence rejects it.
3. Tab sleeps past TTL in `QUEUEING`; no click occurs.
4. Tab sleeps past TTL in `IN_GAME`; Auto Move may finish, Auto Queue cannot restart.
5. F5 after target commit but before `/move-plan`; restored request uses identical target/token.
6. F5 after result event insert; replay cannot double count.
7. URL changes twice around terminal modal; one result event exists.
8. Result detection returns unknown; controller counts remain unchanged and admission pauses.
9. Opponent rating changes across observations; no target pins until stable.
10. Raw target below/above artifact range; declared saturation is deterministic.
11. Calibration response is `shadow` or wrong artifact; current game becomes non-controlling and next admission blocks.
12. Inside-band value preserves prior BOOST/CORRECT mode.
13. Exact min/max boundaries do not transition.
14. Puzzle navigation cannot acquire or mutate session state.
15. Account switch pauses without leaking prior account counts.
16. IndexedDB transaction fails; no DOM/network effect executes.
17. GM mirror write fails after DB commit; DB remains authority and recovery remains safe.
18. Manual graceful stop during active game drains; forced stop is a separate explicit command.
19. Crash before/after queue dispatch produces `AMBIGUOUS` and never automatically clicks again.
20. `chess.com` and framed contexts cannot start Module 14; only canonical top-level origin may own IndexedDB authority.
21. Book/forced `not_applied` remains neutral; engine-sourced `not_applied` invalidates control eligibility.
22. Existing legacy callbacks carry an old effect epoch and cannot execute after Module 14 acquires control.
23. Build regeneration produces byte-identical `script.js` and CI detects manual generated-region edits.
24. Start from terminal modal excludes the prior game and dispatches one first QueueIntent; idle-lobby adapter does the same; live-game start is rejected.
25. Chess.com rapid/blitz scales without an exact mapping fail closed; mapped targets pin mapping version/checksum.
26. Cached engine/book plans preserve `originSource`; unknown cache origin and every static fallback invalidate controller evidence.
27. Exact request retry returns byte-equivalent stored response; conflicting body returns 409; full replay store returns 503 before engine work.
28. Consecutive saturation increments/resets by controller mode and pauses exactly at the configured boundary.
29. Queue readiness succeeds without opponent identity; after match observation, Auto Move remains blocked until opponent-specific capability/target pin commits.

## 13. Acceptance criteria

- No more than one irreversible automation effect can pass the shared Web Lock and fencing for a session revision; ambiguous effects are never replayed automatically.
- TTL prevents every queue admission at `effectiveNowMs >= deadlineEpochMs`.
- A game admitted before TTL may finish; no later game can start.
- Every observed/control terminal result is unique by session/canonical game and traceable to one event; excluded games remain auditable.
- All moves in one game use the persisted target and calibration identity.
- DDA never changes UCI options or `perceptionElo`.
- Unsupported/unavailable calibration and uncertain persistence/context stop new admissions with typed reasons.
- Reload, browser sleep, tab discard, and leader takeover preserve counters and target without duplicate side effects.
