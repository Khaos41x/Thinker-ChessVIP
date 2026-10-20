---
title: 'Fix Tampermonkey Eval Bar streaming and diagnostics'
type: 'bugfix'
created: '2026-10-20'
status: 'done'
baseline_commit: '5aed2494acb66748dbe49e8d02afd18ab271a5e3'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** After `5aed2494acb66748dbe49e8d02afd18ab271a5e3`, the production userscript consumes NDJSON through repeated `GM_xmlhttpRequest.onprogress` callbacks and cumulative `responseText`. Tampermonkey's Chromium/MV3 implementation documents `onprogress` as potentially firing only once and exposes reliable incremental bodies through `responseType: "stream"` plus `onloadstart`; therefore real intermediate evaluations never reach the adapter and the request can end in timeout/error. Diagnostics are assigned to the userscript sandbox's `globalThis`, so the Chess.com page console cannot call them.

**Approach:** Replace only the production transport reader with Tampermonkey's supported `ReadableStream` contract, retaining a final-response fallback and all existing correlation/cancellation rules. Publish a redacted diagnostic API into the page realm through Tampermonkey's supported bridge, then cover the real transport contract and error recovery in regression tests.

## Boundaries & Constraints

**Always:** Preserve Stockfish 19 Smallnet, the Flask stream schema, request/generation/FEN checks, real cancellation, 15 s timeout, authorized-analysis routing, Lichess mathematics, controller/RAF/tau, cache, lifecycle, pixel-perfect CSS, and all Komodo behavior. Never expose authorization headers, tokens, or mutable internal objects through diagnostics.

**Ask First:** Any server contract change, dependency upgrade, use of a transport other than Tampermonkey APIs, or modification outside Eval Bar scope.

**Never:** Enable engine assistance in active competitive games, replace the controller, weaken stale-result rejection, alter `/eval` or `/getmove`, push remotely, or treat DOM presence/simulated scores as end-to-end success.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|---------------|----------------------------|----------------|
| Stream success | Fragmented UTF-8 NDJSON through `onloadstart` ReadableStream | At least two `info` callbacks precede `result`; each is parsed once | Terminal completion is idempotent |
| Legacy fallback | No readable stream, complete `responseText` at `onload` | Final response is parsed without duplicate events | Missing terminal becomes explicit error |
| HTTP/auth failure | 401/403/5xx JSON body | No identity/parser misclassification | Original HTTP/auth cause appears in diagnostics |
| Interrupted stream | reader rejection, timeout, abort, or truncated NDJSON | Request terminates once and cancellation stays bounded | Bar reports error, then clears red `!` after next valid info |
| Stale event | Wrong requestId, generation, FEN, context, or sequence | Event never mutates score/fill | Diagnostic identifies correlation failure |
| Page-console diagnostics | Tampermonkey isolated world | Redacted snapshot is callable from page console | No token/header/internal handle is exposed |

</frozen-after-approval>

## Code Map

- `script.js` -- userscript metadata, production GM transport, diagnostics bridge, generated artifact.
- `frontend/eval_bar/userscript-adapter.ts` -- progressive state transitions and recovery from error.
- `app.py` -- authenticated NDJSON endpoint retained as the server contract.
- `tests/browser/` -- Chromium integration fixtures and real-backend evidence.
- `analysis_lab/tests/` -- bundle and transport regression coverage.

## Tasks & Acceptance

**Execution:**
- [x] `script.js` -- consume `responseType: "stream"` from `onloadstart` with `TextDecoder`, chunk-safe NDJSON parsing, final fallback, and single settlement.
- [x] `script.js` -- expose only redacted diagnostics to the page realm while retaining sandbox diagnostics.
- [x] Test harnesses -- model Tampermonkey stream/fallback/error/isolation behavior and verify red-state recovery.
- [x] Build/test artifacts -- regenerate and validate `script.js`, exercise real Smallnet + Flask + Chromium, and record timing/depth evidence.

**Acceptance Criteria:**
- Given a real 8 s Smallnet search, when the production userscript transport runs, then at least two distinct depth events update the Eval Bar before `bestmove` and the first arrives before final completion.
- Given a transport failure followed by a healthy request, when the first valid evaluation arrives, then the red outline and `!` disappear.
- Given the Chess.com page console, when diagnostics are requested, then a callable redacted snapshot explains route, board/FEN, transport, adapter, and last error without secrets.
- Existing Python, frontend, build, userscript, Komodo, and layout regression suites pass; no unrelated files or remote state change.

## Spec Change Log

## Verification

**Commands:**
- `python tests/test_stockfish_eval_bar.py` -- backend stream and real-engine cases pass.
- `python tests/test_server.py` -- legacy endpoints and Komodo behavior pass.
- `npm test`, `npm run typecheck`, `npm run build`, `npm run build:userscript-eval-bar` in `analysis_lab` -- frontend and artifact validation pass.
- Browser transport regression and real Flask/Smallnet Chromium E2E -- multiple pre-final updates, measured first-event latency, no stale update, and visual recovery.

**Manual checks:**
- If no authenticated Tampermonkey browser is available, explicitly report that real extension/page validation remains manual while preserving automated transport-contract evidence.

## Suggested Review Order

**Production transport boundary**

- Start with the supported Tampermonkey stream contract and idempotent settlement.
  [`script.js:3044`](../../script.js#L3044)

- Follow incremental reader setup, chunk decoding, fallback, timeout, and cancellation.
  [`script.js:3122`](../../script.js#L3122)

**Diagnostics and recovery**

- Inspect the safe transport snapshot recorded without credentials.
  [`script.js:2999`](../../script.js#L2999)

- Verify the page-realm bridge exposes only allowlisted diagnostic fields.
  [`script.js:3269`](../../script.js#L3269)

- Confirm a valid evaluation clears the prior red error state.
  [`profile-userscript-eval-bar.ts:193`](../../analysis_lab/src/profile-userscript-eval-bar.ts#L193)

**Regression evidence**

- Review fragmented streams, fallback, HTTP failures, aborts, timeout, and sandbox isolation.
  [`userscript-transport.test.js:62`](../../analysis_lab/tests/userscript-transport.test.js#L62)

- Trace real Flask and Smallnet events through the production transport function.
  [`test_eval_bar_v2_transport_backend.mjs:30`](../../tests/browser/test_eval_bar_v2_transport_backend.mjs#L30)

- Verify Chromium enforces visual recovery and all geometry invariants.
  [`test_eval_bar_v2_chrome.mjs:233`](../../tests/browser/test_eval_bar_v2_chrome.mjs#L233)
