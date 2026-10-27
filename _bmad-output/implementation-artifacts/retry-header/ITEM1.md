# Item1 — explicit-action feedback

Baseline cbee05a. Network-refused Retry lasted4.0ms in Config and2.2ms in the console (MutationObserver, real Flask frontend with Chromium fault injection). The handlers immediately cleared their interactive flag in finally. Retry was disabled only while that flag was set. Background3-failure/6s health logic had no presentation minimum.

Shared ThinkerStatus.interaction now holds only explicit user actions for700ms from start, then fades the final status opacity0→1 in180ms. Slow responses incur only the remaining minimum, never an extra700ms. The optional1.2s point cycle was deliberately omitted. Reduced motion keeps700ms without animation. Final errors remain static; no new error keyframes/transitions. Existing copy is retained: Config says Connection Lost, console says Error (renaming it is outside authorization).

The original message slot remains40px, Retry32px; aria-busy covers the attempt, hidden polite live region announces one existing final state. Repeat clicks are ignored. Keyboard focus returns to Retry or the existing picker on success. Background verification retains difference-only rendering, hysteresis, timings and backoff; operational requests are unchanged.

Sources: status-runtime.js, panel.js, engine-selection.js; script.js rebuilt deterministically. Browser tests: test_retry_interaction.mjs; before/measurements.json records the baseline. Only isolated Chromium and genuine Flask processes, no authenticated Chess.com/Tampermonkey installation verification.
