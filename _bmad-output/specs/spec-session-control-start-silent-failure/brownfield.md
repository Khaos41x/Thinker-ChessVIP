# Brownfield Diagnosis and Fix Contract

## Confirmed diagnosis

The failure is earlier and broader than an authorization rejection:

1. `script.js` renders START with a direct jQuery handler, then `updateSessionPanel()` sets native `disabled` whenever rollout is `DISABLED`. The bridge's pre-install default and missing GM rollout default are both `DISABLED`, so the browser suppresses the click and no catch block can report a reason.
2. `sessionControlBridge.install(...)` exists but has no production caller. The only repository call is in the Chrome smoke test, where the test manually constructs and installs the controller. Production therefore keeps `controller === null`.
3. The production bridge never reads `thinker.sessionControl.authorization.v1`, never calls `evaluateAuthorization`, and never produces the `accountKey`, context, and pool input needed by START. Authorization is not currently failing closed; it is not wired into the path at all.
4. `frontend/session_control/ui.js` already implements delegated, idempotent, observable controls and has unit coverage, and the module is included in the generated bundle. `script.js` still uses the old direct handlers and renderer, so the tested presenter is dead production code.
5. The current catch path publishes `error.message`, not `error.code`, and only writes the small inline warning after a click can fire. It does not provide a prominent notification contract.
6. The 13 Session Control suites, build check, and userscript syntax check pass. They do not exercise a real production START click through bootstrap and bridge installation, so they cannot detect this incident.

## Required production flow

```text
START click
  -> Session Control presenter (always click-observable)
  -> start orchestrator
  -> await ThinkerSessionControlReady
  -> verify bootstrap/preflight state
  -> capture one validated current observation
  -> resolve exact authorization policy
  -> validate config, entry state, and calibration readiness
  -> sessionControlBridge.start(...)
  -> SessionControlController.startSession(...)
  -> repository commit + leader acquisition
  -> status refresh and success notification
```

Each rejected arrow terminates safely and calls one notification boundary with a stable `reasonCode`.

## Bootstrap and bridge wiring

Add one idempotent production bootstrap owned by the userscript, not by the panel lifecycle:

- Await `globalThis.ThinkerSessionControlReady`; do not race synchronous access to the generated namespace.
- Run `assertCanonicalOrigin` and `preflightCapabilities` with the real page environment.
- Construct one `GmStoragePort`, `IndexedDbRepository`, clock, `LeaderCoordinator`, `BoundedTelemetry`, and `SessionControlController`. Generate 128-bit session/tab IDs with Web Crypto.
- Recover the current account session where recovery is applicable, then call `sessionControlBridge.install(controller, contextProvider, { rollout, telemetry })` exactly once.
- Keep bootstrap state as `PENDING`, `READY`, or `FAILED(reasonCode)`. START during `PENDING` may await the same promise; START after failure reports its stored code.
- Resolve rollout during bootstrap. An explicit stored `DISABLED` remains disabled. A missing record uses the bridge's installed local-runtime default. Invalid records reject with `ROLLOUT_CONFIG_INVALID`.
- Bind `createSessionControlPresenter` to `#kb-session-panel`; remove the duplicate direct jQuery START/DRAIN/export bindings and duplicate renderer. Rebinding after SPA node replacement remains idempotent.

The context provider must expose one internally consistent observation snapshot. START must not combine account, context, pool, or readiness values captured at different logical times.

## Exact authorization fallback

Keep the implemented version-1 DTO:

```json
{
  "schemaVersion": 1,
  "accounts": ["<observed-account-token>"],
  "contexts": ["<observed-context-token>"],
  "pools": ["<observed-pool-token>"]
}
```

Resolution rules, in order:

1. Capture and normalize all three observed tokens. Missing or invalid evidence returns `ACCOUNT_CONTEXT_UNAVAILABLE` (or a more specific stable observation code) and performs no policy write.
2. Read the GM key with an explicit missing sentinel so missing is distinguishable from malformed data.
3. If missing/null, or if validation succeeds and all three lists are empty, create the exact policy above and persist it.
4. Read the policy back, validate it, and evaluate the same captured observation. Success may carry authorization decision reason `BOOTSTRAPPED_EXACT_CONTEXT`; an already matching policy retains `EXACT_MATCH`.
5. If the read-back no longer contains the observation, reject with `AUTHORIZATION_BOOTSTRAP_CONFLICT`.
6. A malformed policy returns `AUTHORIZATION_POLICY_INVALID`. A partially empty or non-empty mismatch returns `NOT_AUTHORIZED`. Neither case writes or merges policy.
7. GM read/write failures return `AUTHORIZATION_STORAGE_UNAVAILABLE`.

This fallback authorizes one observed tuple, not the Chess.com domain or every queue pool.

## Preflight and rejection codes

The START orchestrator must return or throw typed failures. At minimum, tests and UI mapping must cover:

| Condition | `reasonCode` |
|---|---|
| Generated module or controller bootstrap unavailable | `SESSION_RUNTIME_UNAVAILABLE` |
| Unsupported origin/browser capability | existing `UNSUPPORTED_BROWSER_CAPABILITY` |
| Explicit rollout disabled | `ROLLOUT_DISABLED` |
| Session already active | `ACTIVE_SESSION_EXISTS` |
| Invalid duration/win-rate configuration | `SESSION_CONFIG_INVALID` |
| Account/context/pool observation missing or unstable | `ACCOUNT_CONTEXT_UNAVAILABLE` |
| Stored policy malformed | `AUTHORIZATION_POLICY_INVALID` |
| Stored policy valid but does not match | `NOT_AUTHORIZED` |
| Policy storage/read-back failure | `AUTHORIZATION_STORAGE_UNAVAILABLE` |
| Competing bootstrap write changed the tuple | `AUTHORIZATION_BOOTSTRAP_CONFLICT` |
| Calibration inactive, mismatched, expired, or unavailable | existing calibration reason (`CALIBRATION_NOT_ACTIVE`, `CALIBRATION_SCALE_MISMATCH`, `CALIBRATION_EXPIRED`) or `CALIBRATION_UNAVAILABLE` |
| Repository/leadership conflict | existing typed repository/controller code |
| Unexpected exception | `SESSION_START_FAILED` |

No failure may expose only free-form exception prose.

## Visual feedback contract

- The presenter calls one notification function for every rejected START.
- The function writes the `reasonCode` to `#kb-session-warning` as the durable state and exposes it as an assertive accessible alert.
- It also displays a transient, non-blocking overlay toast containing the same code. Repeated identical failures within a short window replace/reset the current toast rather than stacking indefinitely.
- A successful start clears stale warnings and may display `SESSION_STARTED`.
- The toast is created outside the panel flow, is removed on timeout/disposal, and cannot intercept chessboard or panel input outside its own bounds.
- Availability uses `aria-disabled` and `data-disabled-reason`; START remains keyboard- and pointer-observable.

## Implementation boundaries

Expected change surface:

- `frontend/session_control/ui.js`: reason-code extraction and notification callback contract.
- `frontend/session_control/ports.js`: policy missing/empty resolution helper or equivalent focused authorization service.
- A focused runtime/bootstrap source module under `frontend/session_control/`, exported by `index.js` and included by `scripts/build_userscript.py`, or a minimal userscript adapter that composes the exported primitives.
- `script.js`: production bootstrap, presenter integration, context observation adapter, and removal of obsolete duplicate bindings/rendering; regenerate only the delimited generated region for module-source changes.
- `tests/session_control/`: unit and integration coverage described below.
- `tests/test_userscript_chrome.js`: stop relying solely on manual bridge installation for the START smoke path.

Do not change DDA/reducer behavior merely to make the UI pass.

## Verification matrix

1. Missing GM policy + valid stable observation: one click writes exactly one exact policy, calls the controller once, and leaves `IDLE`.
2. Valid fully empty policy: same behavior as missing policy.
3. Valid matching policy: no write; controller starts once.
4. Valid non-matching policy: no write; `NOT_AUTHORIZED` appears in toast and inline warning; controller is not called.
5. Partially empty policy: no write and no auto-broadening; visible rejection.
6. Malformed policy: no write; `AUTHORIZATION_POLICY_INVALID` is visible.
7. GM write/read-back failure or race: controller is not called; the typed storage/conflict reason is visible.
8. Calibration rejection, rollout rejection, invalid config, unsupported environment, repository conflict, leader conflict, and unexpected exception each produce their expected visible code.
9. Repeated binding and double-click while START is in flight produce one controller call.
10. SPA panel replacement aborts old listeners, reconnects the new panel, and preserves the draft.
11. Production bootstrap installs the bridge once and a real START DOM event traverses presenter -> orchestrator -> bridge -> controller without a test-only install call.
12. `node tests/session_control/run.js`, `python scripts/build_userscript.py --check`, and `node --check script.js` pass.
13. The existing layout invariants and visual-regression hashes remain unchanged except for the approved notification-only surface.

## Approval gate

No implementation begins until the user approves this contract. Approval authorizes the narrowly scoped notification overlay, bootstrap/wiring, authorization fallback, and associated tests; it does not authorize unrelated Module 14 or layout work.
