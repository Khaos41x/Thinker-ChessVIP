---
title: 'Support the legacy live/game Banner and post-game Eval Bar route'
type: 'bugfix'
created: '2026-10-23'
status: 'done'
route: 'one-shot'
---

# Support the legacy live/game Banner and post-game Eval Bar route

## Intent

**Problem:** The user's screenshots expose `/live/game/18582739876?move=0`, whereas Banner and Eval Bar route recognizers supported `/game/live/...` and `/game/...` but omitted `/live/game/...`. Enabled preferences therefore did not produce the expected visuals.

**Approach:** Add the precise legacy game route alias to Banner display, UI mount fallback and Eval Bar presentation/game-route recognition. Keep existing terminal-board plus visible terminal/review evidence requirements for engine authorization. Query navigation never grants engine permission. Do not expand the bot startup route predicate or change engine, transport, math, animation, CSS or lifecycle architecture. The userscript bundle is regenerated from the TypeScript source.

Validation: 113 Analysis Lab tests and typecheck pass. New tests cover the exact URL, malformed aliases, active-game denial, and completed-game authorization. The full userscript Chromium/Flask two-tab suite confirms Banner visibility and Eval Bar presentation on the legacy route while active-game Eval authorization remains null. Existing userscript, Banner, Scout, defaults, board resolution, move recovery, seven Flask config tests and fourteen Session Control suites pass. The real Stockfish19 Smallnet/Flask/Chromium integration now supports `--legacy-replay`: the completed-game fixture reached the first evaluation at 45.7ms, published 12 pre-final depth events, completed at 8018.8ms/depth26, animated 216 distinct frames, and passed mate/inverted-orientation checks. The fixture supplies explicit terminal evidence; no authenticated user account was available and its exact runtime status API remains unverified. Independent review prompted removal of an unnecessary startup-route expansion. Existing broader bot behavior is unchanged. Unrelated knight edits remain excluded.

## Suggested Review Order

- Recognize legacy board presentation without relaxing terminal authorization.
  [userscript-adapter.ts:134](../../frontend/eval_bar/userscript-adapter.ts#L134)
- Banner matches the exact screenshot route.
  [script.js:5335](../../script.js#L5335)
- Unit tests separate visual availability from engine permission.
  [userscript-eval-bar.spec.ts:58](../../analysis_lab/tests/userscript-eval-bar.spec.ts#L58)
- Real backend fixture exercises this route and its post-game evidence.
  [profile-userscript-eval-bar-backend.ts:12](../../analysis_lab/src/profile-userscript-eval-bar-backend.ts#L12)
- Reproducible real-engine evidence records latency, scores and animation.
  [legacy-replay-stockfish.json](../../tests/artifacts/legacy-replay-stockfish.json)
