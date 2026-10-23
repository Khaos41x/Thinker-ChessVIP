# Rating Goal Tracker — Implementation-Ready Engineering Plan

Date: 2026-10-23. Repository baseline: `c2b18c8`.

Status: approved for full implementation, including permanent removal of the project-defined userscript size ceiling, without a substitute ceiling. Bundle size is informational. Deterministic generation, syntax, compatibility and measured runtime performance remain mandatory. New paths below remain proposed until implementation is verified.

Implementation record: [validation and known verification boundaries](../../../implementation-artifacts/rating-goal-tracker/VALIDATION.md). Authenticated Chess.com/Tampermonkey smoke is separate from the completed fixture/public-API checks.

## 1. Findings and boundaries

### Confirmed repository behavior

| Existing location | Finding | Consequence |
| --- | --- | --- |
| `script.js`, initialization and `evalBarEnabled` | Migration sets `evalBar=false`; startup enables only if saved value equals `true` | Eval Bar is already off by default. Do not force-reset a deliberate saved preference. `evalBarV2` selects the renderer, not visibility. |
| `core/external_config.py`, `DEFAULT_CONFIG` | `evalBar=False`, Banner/Recent Form true, engine strength 3200; configuration is memory-only | A running server can synchronize a previous true value. Tracker persistence must not live in this dictionary. |
| `frontend/external_config/*` | Separate en-US workspace, partial saves, revisions, draft protection, connection status | Reuse presentation/synchronization conventions, not tracker data inside generic config. |
| `script.js`, `OpponentIntel.classifyGame/processGames/createMonthlyRequest` | Public monthly archive reads, normalized usernames, W/D/L and mode classification, bounded cache, fetch/GM fallback | Reuse validated ideas; existing Scout cache and opponent-derived presentation are not tracker authority. |
| `script.js`, `OpponentIntel.getMyOwnUsername/findPlayerElement` | Bottom-player fallback and geometric matching | Not reliable own-account identity in flipped boards or third-party replays. |
| `script.js`, `observeSessionLifecycle` | Completion observation is gated by a running Session Control session and uses its admitted game/queue context | Tracker needs independent passive lifecycle observation, not another automation controller. |
| `frontend/session_control/platform-chesscom.js` | Normalization, stable evidence, strict DTOs; canonical ID recognizes `/game/live/` and `/game/daily/` only | Reuse pure utilities where compatible; add a separately tested tracker URL parser for `/game/{id}`, `/live/game/{id}` aliases. Do not broaden automation admission. |
| `frontend/session_control/{repository,reducer,leader,telemetry}.js` | IndexedDB events/snapshots, unique result keys, Web Locks/fencing, allowlisted telemetry | Reuse patterns, not private Session Control state or effects. |
| `core/rating.py` | Internally calculated rating and performance multipliers | Never use it as the user's Chess.com rating or estimated delta. |
| `database.py` | `users.db` contains license/account and local-rating players/matches tables | None is authoritative Chess.com rating history. Use a separate tracker database; do not couple public chess identity to license credentials or local ratings. |
| `scripts/build_userscript.py` and Analysis Lab bundler | Deterministic embedded modules; planning baseline was 635087 bytes. The former project-defined guard was not a Tampermonkey platform limit | Remove size rejection from builds, tests and CI. Report bytes informationally; retain deterministic, syntax, compatibility and measured runtime performance checks. |

### Architectural decision

Use a passive, event-driven observation pipeline with pure reconciliation/evaluation and one backend-owned persistent authority. The alternative, Chess.com-origin IndexedDB as authority, would require a second cross-origin bridge for External Config and prevent standalone API monitoring. The backend already exists and SQLite is already in the stack; no new runtime dependency is required.

The tracker must work with Bot, Auto Moves, Auto Queue, Smart Pacing and Auto Play all disabled. It never imports their controllers, asks for engine capability, changes difficulty, clicks controls or submits moves. Clean View suppresses its Chess.com presentation but not passive observation or the external workspace.

## 2. Verified public-data capabilities

Official reference: [Chess.com Published-Data API](https://www.chess.com/news/view/published-data-api).

The PubAPI is read-only. Stats use category-specific `last.rating` and `last.date`; absent categories are omitted. The profile exposes a stable `player_id`, but its continued availability is not promised. Monthly archives document completed games and player ratings after completion; time-class, rules, end time and game URL support attribution. Conditional requests use ETag/Last-Modified and may return 304. Parallel requests may receive 429. Documentation contains inconsistent 12/24-hour cache-refresh statements; it supplies no immediate post-game SLA. These are provider facts, not tracker guarantees.

Read-only probes on 2026-10-23, against the public account `erik`, additionally verified:

| Probe | Observed result | Limit |
| --- | --- | --- |
| `GET /pub/player/erik/stats` | HTTP 200, all four categories, ETag, Last-Modified, `Cache-Control: public, max-age=5` | One account/response; no universal TTL or latency assumption. |
| Same URL with `If-None-Match` | HTTP 304 | Confirms cache validator behavior, not freshness relative to an unreported game. |
| Stats CORS | `Access-Control-Allow-Origin: *`; no exposed-header list in sample | Browser fetch may not expose validators; backend client avoids that dependency. |
| `GET /pub/player/erik/games/2026/10` | HTTP 200; 13 games; `rated`, `time_class`, `rules`, `end_time`, URL and participant rating present | Schema fields must still be validated individually. |
| Latest rated Daily example | Archive rating 1506 matched stats 1506; archive end 1792784918, stats last date 1792784919 | Exact second equality is unsafe; this single match proves no delivery-order guarantee. |

Use documented `/pub/player/{username}`, `/stats`, `/games/archives` and `/games/{YYYY}/{MM}`. Do not use online status as completion evidence, current Daily games as finished results, numeric game IDs as chronological order, undocumented per-game JSON URLs, or PGN Elo headers as a guaranteed post-game rating. Archive ratings are game-specific; stats are the current published category state. Live archives by time control are documented but unnecessary for the initial implementation.

## 3. Contracts and validation

Authoritative contracts live as Python validated dataclasses plus a checked-in JSON Schema; frontend consumers use JSDoc typedefs consistent with current JS modules. Fixture round-trips enforce cross-language parity. Do not introduce a TypeScript runtime or a second schema authority.

All timestamps at the application boundary are integer UTC epoch milliseconds. Convert provider seconds once at ingress. Ratings/targets are nonnegative safe integers or null, never parsed from a missing string. Provider values have a defensive upper bound of 100000; unknown future values are quarantined rather than clipped. User target validation uses the same bound, not the engine's 800–3200 scale.

| Contract | Required fields and semantics |
| --- | --- |
| `PlayerIdentityV1` | `accountKey`, `usernameCanonical`, `displayUsername`, `playerId:null|integer`, `identityStatus:verified|unverified|conflict`, aliases and identity revision. Prefer `chesscom:player:{id}`; unresolved username keys cannot merge with verified accounts automatically. |
| `RatingCategoryV1` | `platform=chesscom`, `rules=chess`, `timeClass=bullet|blitz|rapid|daily`. All indexes include the full category. Exclude Chess960/variants, puzzles, engine Elo and local ratings. |
| `RatingObservationV1` | `schemaVersion`, deterministic `observationId`, identity/category keys, `rating:null|integer`, `source:pubapi-stats|pubapi-archive|dom-player|dom-result`, `observedAtMs` (server receipt), `sourceEffectiveAtMs:null|integer`, `gameKey:null|string`, `lastConfirmedGameKey:null|string`, `requestGeneration`, provenance digest/version, `verification:provisional|verified|conflict|rejected`, `freshness:fresh|stale|unknown`, structured error or null. Verified state is server-derived, never accepted from client. |
| HTTP provenance | URL key, request start/finish, status, ETag, Last-Modified raw value, Date/Age, Cache-Control, revalidation time, body digest. Fetch time is not rating-effective time. |
| `CompletedGameV1` | `gameKey`, account/category, canonical URL, participant side, `rated:true|false|null`, result W/D/L/aborted/unknown, `endedAtMs:null|integer`, terminal proof source/version/digest, publication state, revision. Unknown mode/rated/identity prevents rated-history attribution. |
| `RatingChangeV1` | `fromObservationId`, `toObservationId`, `delta`, `scope:single-game|interval|unattributed-adjustment`, `gameKeys`, `sequenceComplete`, confirmed/contested status. Null delta when anchors are missing. |
| `RatingGoalV1` | `goalId`, account/category, `revision`, `direction:at-least|at-most`, `threshold`, `baselineObservationId:null|string`, immutable baseline rating/time once set, `state:awaiting-baseline|tracking|reached|paused|archived`, creation time, `achievedAtMs:null`, `confirmedReachedAtMs:null`, evidence IDs, `proximityPoints=20`. |
| `RatingViewV1` | Confirmed snapshot separate from provisional candidate; state, last verified/fetch times, pending game count, nullable progress/distance, conflicts, bounded error and next eligible refresh. Never serialize a provisional value into the confirmed slot. |

Errors use `{code,retryable,retryAtMs,source,correlationId}`. No passwords, cookies, capability tokens or full raw DOM in telemetry.

Evidence identity is fixed: `observationId` is SHA-256 of canonical UTF-8 JSON containing schema version, source, normalized provider resource key, observed participant identifier, category, rating, effective timestamp, resolved game key or null, and relevant provider record digest. Sort object keys, encode integers without decimals, preserve nulls, and publish shared canonicalization fixtures. Exclude receipt time, validators, request generation and derived state. Identity promotion changes relational ownership/aliases, not the original hashed payload. Keep immutable evidence separate from append-only classification revisions; freshness is derived at read time. Repeated HTTP checks append cache-revalidation metadata referring to the same evidence, not new rating events. A 304 never creates a rating observation or mutates its effective time.

## 4. Components, paths and integration seams

```text
Public API GET ──> PublicDataClient ─┐
                                   ├─> validated evidence ─> reconciler ─> SQLite
Chess.com read-only DOM adapter ────┘                         │
                                                            ├─> goal evaluator
                                                            ├─> durable notification outbox
                                                            └─> versioned read model
                                                                  ├─ External Config presenter
                                                                  └─ optional Chess.com presenter
```

| Proposed component | Responsibility |
| --- | --- |
| `core/rating_tracker/contracts.py`, `contracts.schema.json` | Exact field validation, timestamp conversion and category/identity types. |
| `public_client.py` | Fixed-host GET client, serial scheduler, conditional cache, response bounds, abort/deadline, error classification. No arbitrary URL proxy. |
| `repository.py`, `migrations/001.sql` | Separate `rating-tracker.db`, transactions, revision CAS, uniqueness, restart-safe pending work/outbox. |
| `reconcile.py`, `goals.py` | Pure deterministic functions; injectable time. No network or engine imports. |
| `service.py` | One application-owned coordinator for observations, due jobs and snapshots; one bounded worker, no per-goal threads. |
| `routes.py` | Dedicated Flask blueprint, local request validation, pagination and optimistic concurrency. Register in `app.py`; add an idempotent worker stop/join hook beside the existing Komodo-only `atexit` hook, without changing Komodo shutdown. |
| `frontend/rating_tracker/{dom-adapter,bridge,presenter}.js` | Passive participant/terminal observation; batched localhost evidence transport; compact accessible rendering. No second game-playing controller. |
| `frontend/external_config/{index.html,panel.js,panel.css}` | Goal form and tracker card; distinct from engine Strength Level. Use dedicated tracker routes, not `/config/save`. |
| `analysis_lab/scripts/build-rating-tracker.mjs` | Deterministic tracker bundle resolving the existing locked esbuild from Analysis Lab; isolated marker in `script.js`. Report total bytes informationally; validate determinism, syntax, compatibility and runtime performance without a size ceiling. No unresolved root-level package import. |

Reuse pure normalization and stable-evidence patterns. Do not modify existing Session Control DTOs, reducer, IndexedDB schema, Web Lock names or leader fencing. A backend-authoritative tracker does not need a second browser leader: duplicate tabs are deduplicated on ingest and jobs are coalesced per account/category.

Proposed local routes:

- `GET /rating-goals/snapshot?accountKey=...` — revisioned current read model, ETag/304 supported.
- `POST /rating-goals` — create goal with idempotency key; settings only, no game action.
- `PATCH /rating-goals/{id}` — pause/archive/change threshold with expected revision; 409 requires reload. Threshold edits create a new baseline revision, never rewrite history silently.
- `POST /rating-observations/dom` and `/rating-games/terminal` — bounded untrusted evidence, never client confirmation.
- `GET /rating-goals/history?...&cursor=...` — deterministic pagination.
- `POST /rating-notifications/{id}/ack` — UI delivery acknowledgment only.

Restrict binding to loopback, validate Host and explicit expected origins, reject other browser origins, JSON-only writes, body limits and request-rate bounds. Do not inherit the application's wildcard CORS for this blueprint. Fixed provider host/path allowlist, bounded redirects to the same host, no credentials forwarded. Initial deployment remains a trusted single-user local desktop, not remotely exposed multi-user hosting. An unrecognized local-process attacker is outside that envelope; remote support requires a separate authentication design before exposure.

## 5. Identity, classification and reconciliation rules

### Identity and DOM extraction

1. Discover the logged-in identity from an explicit account/navigation link, cross-check with public profile identity. Bottom-of-board position is never identity proof.
2. If unavailable, let the user select a public account once in the external workspace; label it as monitored, not inferred logged-in identity. This is not manual rating synchronization.
3. Bind a DOM rating to the participant username/profile link in the same player container; determine white/black by membership and board orientation. A replay of someone else's game contributes no own-player DOM observation.
4. Read only visible rendered rating text. Do not read hidden text, expand UI, enable visibility or change preferences. `—`, empty, concealed and nonnumeric values yield unavailable, not zero. Rating change text and provisional `?` markers are distinct tokens, not the rating itself.
5. Category requires explicit scoped game metadata or an archive match. Clock time remaining, selected next-game queue, board orientation and a bare rating cannot establish category. Unknown means pending classification.
6. Store aliases only after same `player_id` verification. A username resolving to another stable ID is an identity conflict; do not inherit its goals/history. If stable ID is unavailable, retain verified mappings without inferring a rename.

Identity promotion is a repository transaction, not a presenter rename: acquire both identity keys in deterministic order, verify the same provider ID, migrate references and alias mappings, deduplicate evidence/jobs, then invalidate old generations. Two active goals for the same promoted account/category stop automatic promotion and require an explicit goal selection; neither is overwritten. Unknown game keys are ingress references only, never rated-history keys. Resolve them to one verified live/daily key transactionally, retaining aliases; ambiguous namespace remains pending, never duplicated into both pools.

### Deterministic reconciliation

1. Reject invalid identity/category/time/rating. Treat future timestamps beyond five minutes as quarantined clock anomalies; do not advance a watermark.
2. Serialize state mutation per account/category in one database transaction. A unique evidence digest makes repeated 200/304/DOM observations idempotent.
3. Preserve raw evidence; select confirmed state by effective chronology, never rating magnitude or arrival order. A lower new rating is valid. An older observation may enrich historical records but cannot replace a newer confirmed current snapshot.
4. A valid public stats value with a valid category timestamp may establish a confirmed **as-of** baseline. Its last-confirmed-game ID remains null unless separately matched; recently fetched does not mean recently played.
5. A documented rated standard-chess archive result, matching player/category and exact game identity, confirms that game's post-game rating. This confirmation does not require DOM visibility or stats agreement when stats are demonstrably older.
6. DOM-only values remain provisional, even if read twice; stability prevents transient reads, not provider-level confirmation. Show the candidate separately and retain the last confirmed rating. No goal completion from DOM-only evidence.
7. Stats may cover pending games only when its effective date is no earlier than the latest known completed rated game; do not demand exact seconds. It cannot assign a rating to each covered game. If completion time is only local/untrusted, require archive corroboration before clearing the exact game backlog.
8. Public observations are comparable when they share a canonical game key, or share the same account/category/effective timestamp. Equal ratings corroborate; different ratings create a contested cohort. Never infer same-game identity from a time tolerance. DOM disagreement remains an explicit unconfirmed candidate but cannot veto an otherwise eligible public observation. A valid later timestamp advances public current state; an unresolved same-time cohort cannot. Missing effective time cannot replace confirmed current state. Stats without a game key cannot confirm an individual game's rating.
9. Same-second games with unknown order must not be ordered by numeric ID, rating, request arrival or lexical URL. Keep the group unresolved for individual deltas; a later stats snapshot can confirm current state but not reconstruct internal order.
10. An unchanged number does not establish zero delta until it is explicitly confirmed after the relevant game. A 304 preserves cached evidence and its effective timestamp; it cannot clear a newer pending game.
11. Unexpected provider corrections without an attributable game become `unattributed-adjustment`, not a fabricated game result. Corrections of an existing event preserve versions and evidence rather than silently rewriting deltas.

Conflict resolution: repeated fetches or a new ETag alone do not establish truth. A later valid public as-of observation can resolve the current-state conflict while leaving earlier contested history/deltas excluded. An existing game's conflicting revisions require independently corroborated provider correction/retraction before historical attribution resumes; otherwise preserve the dispute indefinitely. Provenance body digest and validators identify versions, not a majority vote. Goal notifications stay blocked for the conflicted evidence, not forever for unrelated later verified state.

Freshness policy, separate from verification:

- `fresh`: response checked within 15 minutes, cache metadata not expired, and no later unresolved rated-game evidence in that category.
- `stale`: check age/cache expiration exceeded or a newer rated game is pending. Last confirmed observation remains available as an as-of value.
- `unknown`: missing effective time or uncertain provenance; never silently promoted.
- `unavailable`: no valid observation yet; a transport error alone does not erase prior state.

An old last-game date can still describe the user's current rating if the account is inactive; distinguish effective age, last checked time and known pending games. These freshness thresholds are proposed product policies, not provider guarantees.

## 6. Passive post-game lifecycle

State sequence: `observed-active → terminal-candidate → awaiting-publication → confirmed | unchanged-confirmed | skipped-unrated | skipped-aborted | unresolved`.

1. Capture participant identity, URL aliases, rules, category and rated status while observing; do not wait for the modal to infer every field.
2. A game is genuinely finished when a matching published archive record exists, or scoped terminal UI with matching game/participants is stable across two observations separated by at least 250ms. A route query, FEN mate, review button alone or an old modal is only a hint.
3. Canonical keys use `chesscom:{live|daily|unknown}:{id}` plus URL alias mapping. Preserve live/daily namespaces. `/game/{id}` aliases need matching game/archive context before namespace resolution. Never deduplicate solely by FEN or timestamp.
4. Transactionally upsert the game and due refresh job under unique keys. Duplicate modal events, tab reloads, multiple tabs and API rediscovery become one game history entry.
5. Read allowed DOM candidates immediately. Schedule a stats revalidation and, when a game remains unresolved, its UTC end-month archive; consider the adjacent month at a boundary. Missing local end time permits bounded current/previous-month discovery, not all-history downloads.
6. Shared API queue has concurrency one, request timeout 10s, cancellation on account deletion/change, and single-flight per resource. Handle endpoints independently so one failed source does not block another.
7. Proposed post-game attempts: immediate, 5s, 15s, 30s, 60s, 120s and 300s, each delayed further by Cache-Control/Retry-After. After five minutes, show Awaiting Rating Update and defer to 15-minute background checks while a goal is enabled, not a tight retry loop. No SLA that five minutes suffices.
8. Use ETag first, otherwise Last-Modified; preserve values verbatim and update HTTP validators correctly on 304. 304 without a cached representation permits one unconditional retry. Never append cache-busting query strings or claim request `no-cache` forces publication.
9. 429 honors Retry-After seconds/date when present, otherwise shared exponential cooldown starting at 60s with bounded jitter. Timeout/5xx: exponential 5/15/60/300s, capped at 15 minutes. Unknown 4xx stop that resource; 404 schedules one profile recheck, then requires changed identity evidence; 410 stops requests. These cooldowns survive restart.
10. On each accepted observation, reconcile, record any attributable rating change, and evaluate goals atomically. Multiple quickly completed games stay a backlog; coalesce network reads, not game identities.
11. Unrated and aborted games do not advance rated history or trigger rating-delta assumptions. Draws may produce positive, negative or zero confirmed changes. Unknown rated state stays unresolved until public evidence classifies it.
12. Browser refresh reloads local unsent evidence from a tracker-specific bounded outbox; backend restart resumes persistent due jobs. No Chess.com tab is required for API polling of an explicitly monitored account. With server offline, display last cached read model as stale; never declare a goal reached from the browser cache.

## 7. Goal semantics and uncertainty

One active goal per account/category; other categories and archived goal revisions remain independent. Baseline eligibility refers to validation at goal creation or afterward, not the last game's effective timestamp: an inactive account may use a successfully revalidated published rating whose effective date is old. At creation, accept a confirmed cached rating only while its HTTP validity remains current and no later pending game/conflict is known; otherwise revalidate. Preserve its actual as-of date. A provisional or unresolved value cannot initialize the baseline. Missing baseline means Awaiting Rating Update, not zero progress. Store the original baseline even if later ratings move away.

- Upward condition: confirmed `current >= threshold`.
- Downward observation condition: confirmed `current <= threshold`.
- Remaining distance: upward `max(0, threshold-current)`; downward `max(0, current-threshold)`.
- Upward progress: `(current-baseline)/(threshold-baseline)`.
- Downward progress: `(baseline-current)/(baseline-threshold)`.
- UI progress is clamped to 0–100%; keep raw signed progress for history. Missing rating/baseline gives null, not 0%. A target already satisfied at creation is reached immediately from eligible evidence; avoid division by zero.
- First crossing transaction inserts a unique completion event/outbox key `(goalId, goalRevision, reached)`; record evidence-effective `achievedAtMs` and separate receipt/confirmation time. If the condition is already satisfied at creation, achievement is at goal creation, with the older source date retained separately; never claim a goal existed before creation. An unknown crossing time remains null, never backdated from guesswork.
- Completion is historical and does not toggle gameplay. If a later correction contests the evidence, show Completion needs verification, preserve the original record and do not send a second completion. Revising a threshold creates a new goal revision and notification namespace.
- Late complete history can demonstrate an earlier crossing after baseline even if current rating has moved away; label it historically reached. Gaps or ambiguous order cannot prove an unseen crossing.

Per-game delta requires both confirmed adjacent rating anchors and an unbroken own rated-game sequence in that category. Missing intermediate games yield a labeled interval delta with its time range, excluded from per-game volatility. Provider adjustments and incomplete ordering are also excluded. Never reuse local Elo formulas, opponent rating or game outcome to manufacture a delta.

Descriptive volatility: last 20 verified single-game deltas, require at least five; display count, median signed delta, minimum/maximum and median absolute delta under History. Do not promise games remaining, win requirements or a constant point change. `rd` may be retained as provider metadata, but is not the tracker uncertainty percentage or a calibrated forecast.

Near-target policy: one advisory on entering 1–20 remaining points using eligible confirmed state. Re-arm only after confirmed distance exceeds 30. State exact distance and window, never tell the user to play/lose another game. Completion supersedes proximity. Downward crossing uses neutral wording Threshold Reached rather than celebrating a loss. The 20/30-point thresholds are explicit proposed UX decisions.

Persist `proximityCycle` (initially 0) and `proximityArmed` (initially true) per goal revision. Eligible entry into 1–20 emits unique `(goalId, revision, near, proximityCycle)` and disarms. Only an eligible confirmed distance greater than 30 after disarming increments the cycle and re-arms. Noise at 20/21 or repeated observations cannot re-arm. Thus distances 25→15→35→15 yield two logical advisories in different cycles; completion emits only reached and disarms. Pause/off never manufactures an entry from provisional evidence.

Transitions: creation explicitly opts this account/category into monitoring; visibility alone never starts jobs. Persist monitoring preference separately from goal/card state. Pause suppresses evaluation/alerts and polling when no other enabled consumer needs the resource. Resume revalidates before evaluation, retains the baseline and reports any already-satisfied condition as confirmed on resume, without inventing its crossing time. Monitoring off retains history but cancels due work/generations. A threshold edit archives the old goal revision and starts a new baseline/proximity lifecycle; pause/resume and UI visibility changes do not reset the baseline. Previously queued alerts retain their inbox record but do not produce a new toast while monitoring is off. Archived goals cannot resume.

## 8. Persistence and operations

Separate `rating-tracker.db` using standard-library SQLite and transactional migrations. Add this file and its WAL/SHM/journal sidecars to `.gitignore` before first execution; the current ignore file does not cover them. Tables: `players`, `player_aliases`, `monitoring_preferences`, `goals`, `observations`, `current_ratings`, `completed_games`, `rating_changes`, `refresh_jobs`, `http_cache`, `notifications`, `metadata`. Uniqueness covers observation digest, canonical account/game, job resource, and goal notification transition. One transaction commits current state, progress and notification enqueue; no network request holds a database transaction open.

Use explicit SQL revision/CAS for concurrent requests; a short busy timeout and retriable conflict result, never last-writer-wins goal edits. Initially run one Flask application process; multiple WSGI workers require DB job claims/leases and must not be enabled silently. On failure, retain read-only access to last confirmed state and show History could not be saved. Do not fall back to a second authority in localStorage or users.db.

Resolve the database from the application's absolute project root, never the shell's working directory; inject a temporary database path for tests. Worker startup is single/idempotent, stop cancels HTTP work and prevents new jobs, join is bounded, and in-flight work is safely retryable on restart. Flask debug-reloader processes must not each start an independent worker. Test actual responses/preflights against the existing global Flask CORS configuration; blueprint settings alone do not prove origin isolation.

Proposed retention: detailed observation evidence 30 days, compact confirmed history one year, goals/completion records until user removal. Evidence digests and referenced anchor summaries survive raw-observation pruning; completion evidence cannot become dangling. Document retention in Settings. Deleting an account/goal cancels due requests/jobs and removes dependent caches/outbox records transactionally. Paginate history, cap response bodies at 5MiB and game records at a documented bound; oversized archives fail visibly and retain state rather than partial silent ingestion. Review bounds against actual large-account fixtures before release.

Notifications use an in-app durable inbox; optional operating-system notifications require explicit permission and are not an MVP dependency. A unique database event prevents duplicate logical alerts; presentation uses a delivery claim across tabs. Delivery is at-least-once across crashes, not an unsupported exactly-once toast guarantee. A stable notification ID lets re-delivery reuse the same inbox item.

The delivery contract adds `POST /rating-notifications/{id}/claim` with consumer ID and expected revision. A single transactional 30-second lease returns an opaque claim token; acknowledgment requires that token, and another tab cannot display a claimed toast before expiry. Claims are separate from read/unread inbox state. A crashed unacknowledged consumer permits redelivery of the same notification ID, not a new logical event. All claims/acks obey the same loopback origin/JSON protections.

Operational signals: refresh latency, response code/cache status, pending-game age, stale/conflict counts, missing identity/mode reasons, idempotency hits, delta attribution gaps, goal transition IDs, persistence failures and notification claims. Diagnostic export is a new allowlisted tracker payload, not a change to Session Control telemetry schema. No continuous normal-console logging, public uploads, raw page HTML, auth secrets or opponent profiles.

## 9. Compact en-US UI

External Config owns creation/edit/history; optional collapsed Chess.com card in the existing workspace shows one selected category. Do not insert a new full-size column or modify the current Core/Visuals/Engine grid. An off-by-default Rating Goal visibility control can reveal this card; monitoring opt-in is separate from visibility, and Clean View always suppresses it. Keyboard-accessible mode/category selector never controls matchmaking.

Example primary content: Rating Goal · Blitz; Current Rating 1,900; Target Rating 2,200; 300 points remaining; small progress bar; Last verified 2m ago. More reveals baseline, history and source details. Downward goal form: Alert when rating is at or below, with a passive-monitoring explanation.

| State | Primary display | Behavior |
| --- | --- | --- |
| Confirmed/fresh | 1,900 · Verified | Eligible for progress/notifications. |
| Provisional | Last verified 1,900; Observed 1,912 · Unconfirmed | Candidate never overwrites verified slot; no completion notification. |
| Awaiting publication | 1,900 · Awaiting Rating Update | Preserve previous progress; show pending-game count in details. |
| Stale | 1,900 · Last verified yesterday | As-of value, not implied current truth. |
| Conflict | Rating needs verification | Show the differing values/source dates in details. |
| Unavailable | Rating unavailable | No fake 0; no pressure to enable rating visibility. |
| Reached | Goal Reached / Threshold Reached | Effective and confirmation dates available; no gameplay effects. |

Use existing system font, neutral dark surfaces, green accent, 1px borders, 12px spacing, minimum 11px secondary text and 4.5:1 text contrast. Distinguish state with words/icons, not color alone. Labeled inputs, `aria-describedby`/`aria-invalid`, non-noisy `aria-live=polite`, tabular numerals, reduced-motion support, visible keyboard focus and no pointer-only focus rings. Test 390/800/1280/1440 plus actual console container widths 1033/1034/1035. Avoid announcing every provisional DOM update.

## 10. Tests and acceptance matrix

| Fixture / action | Required result |
| --- | --- |
| Ratings hidden, API works | Tracker initializes automatically; no preference changes or hidden DOM reads. |
| API old body/304 after a game | Previous confirmed value remains; game unresolved; no false zero delta or completion. |
| DOM only, API unavailable | Provisional candidate displayed; prior confirmed retained; completion withheld. |
| API/archive older vs newer | Effective-time watermark never moves backward, even if older request arrives last. |
| Same-period conflicting ratings | Conflict explicit; no silent source priority winner. |
| Bullet/Blitz/Rapid/Daily, Chess960 | Separate standard categories; variants excluded; no clock-based guessing. |
| Inverted board / third-party replay / account switch | Identity is correct or unknown; opponent rating never becomes own rating. |
| Natural upward crossing / downward crossing | One persisted completion, correct comparison, no network request to engine or matchmaking. |
| Fast consecutive games / same-second games | Unique backlog; no dropped game IDs; ambiguous order never fabricates deltas. |
| Duplicate modal/API/tab events | One game record, idempotent observation and one logical goal event. |
| Draw / unrated / aborted / missing rated flag | Correctly classify or defer; never assume a draw has zero delta. |
| Variable deltas / history gap / provider correction | Exact measured deltas or labeled interval/unattributed changes; no predictions. |
| API429/5xx/timeouts/404/410/301 | Cooldowns and bounded redirects enforced; one source failure does not erase state. |
| Headers missing / malformed Last-Modified / 304 without cache | Unknown freshness preserved, opaque validator handled, bounded retry. |
| Reload/server restart/DB migration/DB locked | Goal and backlog restored or explicit degraded state; no duplicate completion. |
| One tab edits while another polls | Expected-revision conflict handling; no stale form overwrite. |
| Web notification denied / multiple tabs/crash | In-app inbox works; no permission requirement, no repeated logical alert. |
| Clean View / keyboard / narrow layouts | Presentation suppressed/restored independently; all controls reachable; no horizontal overflow. |
| Feature disabled / all automation disabled | No tracking jobs when opted out; passive tracker still works with all automation off. |
| Inactive account / already-satisfied creation / resume | Old effective date can initialize from eligible revalidation; no pre-creation achievement; resume never guesses crossing time. |
| Observation replay / identity promotion / cache304 | Canonical IDs match across JS/Python; immutable payload stable; relational migration atomic; no new rating event on304. |
| Near distances25→15→35→15 / repeated21→20 | Exactly two cycle-keyed advisories in the first case; no repeated threshold chatter in the second. |
| Conflicting public records / later as-of / DOM disagreement | Same-key/time conflict deterministic; later current state may advance without repairing disputed history; DOM remains separate. |

Implement pure unit tests with injected clocks/HTTP, Flask route tests against temporary SQLite, deterministic recorded API headers/bodies, generated event permutations and a small stateful cross-language contract fixture suite. Browser tests use the actual built userscript with two Chromium tabs plus real Flask; simulate public API timing, never play ranked games. Add negative spies asserting zero calls to `/getmove`, `/move-plan`, engine services, click/move/resign/queue effects throughout tracker scenarios.

## 11. Implementation phases and release gates

| Phase | Files / work | Exit criteria |
| --- | --- | --- |
| 0 — evidence contract | Identity/game/category adapters, recorded public fixtures, schemas, exact route aliases | Hidden/inverted/replay/malformed fixtures pass. Confirm own-account and category selectors in an authenticated browser; unknown cases are explicit. |
| 1 — durable core | contracts/repository/migrations/reconcile/goals and unit tests | Property tests prove no chronological rollback, mode/identity mixing or fabricated delta. Atomic game/goal/outbox commit and restart recovery pass. |
| 2 — public acquisition | public_client/service and fixed-host API routes | Serial single-flight, validators/304, cache age, 429 and restart cooldowns pass. No new package required. |
| 3 — passive browser ingress | dom-adapter/bridge, separate userscript bundle | Completion detection works without Session Control; duplicates and rapid endings pass; zero engine/queue/move effects. Report payload size informationally and validate deterministic output, syntax, compatibility and measured runtime performance. |
| 4 — presenters | external workspace and compact optional on-page card | All en-US states, source disagreement, Clean View, keyboard and responsive tests pass; no current-console layout regression. |
| 5 — end-to-end/reliability | browser suites, crash/restart tests, diagnostics and docs | Every acceptance row automated where practical; authenticated read-only DOM smoke separately recorded. No release claims if rating visibility-off scenario still needs a user preference change. |

Reproducible validation commands to add during implementation: `python tests/test_rating_tracker.py`; `node tests/test_rating_tracker_contracts.js`; `node tests/test_rating_tracker_chrome.js`; existing Session Control/config/Scout/Banner suites; both userscript build checks; Analysis Lab typecheck/tests. Engine benchmarks are irrelevant to this passive feature and should not be invoked as proof of tracker correctness.

## 12. Explicit decisions and remaining verification

Chosen for the plan: backend authority, conservative DOM confirmation, standard-chess categories, per-category goals, as-of ratings, separate goal history/inbox, no automation integration. Proposed product policies: 20/30-point proximity hysteresis, 15-minute UI freshness and later polling, retention windows and one active goal per category. These can be reviewed without changing data-safety invariants.

Pre-release verification, not invented guarantees: authenticated own-identity/rating/result selectors with ratings hidden and orientation flipped; public fields for missing/provisional/unrated/aborted cases; DOM result meaning and category attribution; maximum archive size; exact Tampermonkey observation origin/headers; goal-write origin protection under current Flask CORS; informational payload size and measured runtime performance; notification delivery under multi-tab crash. No authenticated browser smoke or immediate publication latency guarantee has been established in this planning pass.

Planning-pass provenance: public API bodies and headers were read sequentially, no games were played, no account preferences were changed, and that planning pass made no application changes or commit. The subsequently approved implementation is recorded in the validation link above; no remote push is authorized.
