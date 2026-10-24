# Phase09.2 delivery

## Confirmed motion bottlenecks

The actual foreground Chromium trace ran at approximately60Hz; the reported30FPS appearance was not reproduced in this environment. The existing controller already had one RAF, continuous110ms exponential interpolation, Latest-Wins and transform-only rendering. No competing CSS animation or main-thread long task was observed.

The ordinary250ms target gate delayed or discarded early valid intermediate scores. It now coalesces at100ms while terminal/material/sign/mate changes stay immediate. The body observer also reacted to the bar's own label mutations; filtering only rail-owned mutations reduced normal geometry synchronizations16→4. Identical label/orientation/favored-side values avoid redundant writes. Tau remains110ms, and geometry, White POV, normalization, depth/FEN/cache provenance and cancellation remain unchanged.

Measured RAF median/p95 stayed approximately16.7ms. Accepted-target→first-moving-frame p95 improved16.5→13.3ms in the normal capture; correlated median9.1→5.5ms. One refined-run33.4ms frame is disclosed; this is not a claim that all FPS or convergence metrics improved. There was one animation callback, one mount, no overshoot and no long tasks. Native120Hz output was unavailable;30/60/120FPS irregular-target simulations passed. See [motion evidence](motion/REPORT.md), per-frame JSON and compressed actual Chromium traces. Superseded samples are counted separately from measured successful movement.

## Configuration and engine UX

Canonical new-install preferences enable only Banner and Recent Form. Bot, Auto Moves, Auto Queue, Eval Bar, Auto Rating, Smart Pacing and Clean View remain off. Removed destructive version migrations and automatic Eval Bar unlock; missing-key seeding preserves explicit existing values. Random defaults are0.50–1.00s; switching modes retains customized Random values. Ambiguous existing0.01/0.01 ranges are preserved rather than guessed to be defaults. The known Immediate0/0 representation is normalized only when switching into Random.

Optional win-rate targets are explicitly null/unset in new preferences, rendered as Not set; zero remains invalid. Existing saved numeric targets and session history survive. The existing numeric operational session contract is unchanged: both targets must be configured before starting; no percentages are invented. The displayed Win Rate still comes from recorded session results.

The existing configuration service now optionally persists accepted configuration atomically in ignored `external-config-preference.json`. Production opts in; it remains the same revisioned source of truth. Restart restores saved values before hydration. Failed disk writes return503 without acknowledgement/revision advance. Corrupt settings show a persistent error, and the original is preserved as an ignored invalid-file backup before recovery. On upgrade only original browser keys captured before default seeding can initialize an otherwise unconfigured backend, with server/revision guards;409 adopts the accepted state rather than retrying a stale overwrite. Engine preference remains separate and is unaffected by unrelated saves.

Dropdown names stay compact; contextual Fast Analysis/Deep Analysis/Classic UCI descriptions come from the shared registry. They identify verified distribution/network size or native UCI behavior, without playing-strength or time-control claims. The actual networks are1,166,381 and98,511,183bytes; those sizes are distinct from process RSS.

## Controlled response benchmark

All three installed engines ran sequentially at200/1000/3000ms, three identical FENs, two repetitions, Threads3/Hash16MiB/MultiPV1 where applicable. Warm transposition tables remain in identical run order; cold verified initialization is measured separately. At200ms, median first scores were2.2ms Smallnet,2.8ms Full and4.2ms Komodo; median complete responses were202.0/202.8/202.0ms. Every engine emitted an evaluation before200ms in all six measured searches. Komodo is not uniquely capable of fast response. Peak process RSS at200ms was225.7/725.6/44.2MiB respectively; cold verified initialization744/1516/763ms. Depth is engine-specific and is not a strength comparison. All owned engine processes exited on cleanup. See [complete benchmark](engines/BENCHMARK.md) and rawJSON with verified runtime/NNUE identities.

## Validation

- TypeScript typecheck and all115 laboratory tests passed, including2 added sample/frame-correlation tests.
- All14 Session Control suites passed.
- Existing7 and3 configuration backend tests plus4 Phase09.2 defaults/persistence/error tests passed.
- Visual preference, null-versus-zero, strict operational target guard, retained Random range and revisioned upgrade-bootstrap regressions passed.
- Real Flask/registry + Chromium both-surface regression passed: first run, saved values, mode changes, decimal target editing/clearing, F5, disconnect/reconnect, actual Flask restart, corrupt-file error/recovery, engine isolation, no uncaught JS exceptions or menu mount errors.
- Existing no-tab engine preference browser regression passed (all engines, persistence, failure/Retry/restart and unauthorized execution).
- Existing bidirectional configuration browser regression and Eval Bar geometry/animation/lifecycle browser regression passed.
- Session, engine selector and Eval Bar bundles regenerated; all deterministic checks passed. The staged Eval Bar bundle is rebuilt from the isolated committed adapter, excluding pre-existing authorization changes.

Responsive captures and keyboard/control-boundary assertions are under [UI evidence](ui/after/capture.json):1280×720,1440×900,1920×1080 and125%/150% equivalent zoom, both actual presentation components in an isolated local fixture. External Config has no horizontal overflow; required controls fit their workspace. The embedded fixture retains its pre-existing fixed board/ad-page overflow at narrow widths. These are isolated renderer screenshots, not the authenticated user tab; user browser access is unavailable. No gameplay was fabricated or manipulated.

The local server was updated and checked. A concurrently present older duplicate returned revision-zero defaults; its timing conflicted with the durable file. Automatic review initially rejected consolidating both processes. A read-only comparison proved the durable file exactly matched the original accepted revision17 snapshot, so only the verified older duplicate was stopped; the healthy current server and every preference file were retained. Final checks show one listener, saved settings restored, all three engine descriptions and unchanged selected engine. Existing accepted0.01 timing was retained deliberately under the provenance rule.

Unrelated auth, knight artwork, rating/banner/arrow/video work remains outside the local commit. No remote push.
