---
title: 'Premium Thinker Chess workspace controls'
type: 'bugfix'
created: '2026-10-21'
status: 'done'
route: 'one-shot'
---

# Premium Thinker Chess workspace controls

## Intent

**Problem:** Session actions exposed duplicate generic warnings, Run Delay retained browser-native controls, advanced Auto Play settings were undiscoverable, and collapsing the two-card workspace restored only the Assistant behind an unrelated “K” launcher.

**Approach:** Make unavailable actions quiet and genuinely disabled, polish the delay inputs, label advanced settings explicitly, and treat Assistant plus Scout as one focus-safe workspace restored through a branded Thinker Chess launcher.

## Suggested Review Order

**Workspace lifecycle**

- Central collapse state restores both cards and preserves state across remounts.
  [`script.js:5374`](../../script.js#L5374)

- Branded launcher replaces the unrelated single-letter affordance.
  [`script.js:5936`](../../script.js#L5936)

**Control clarity**

- Presenter removes native tooltips and blocks unavailable actions without duplicate warnings.
  [`ui.js:79`](../../frontend/session_control/ui.js#L79)

- Styled delay fields and explicit configuration disclosure replace browser-native ambiguity.
  [`script.js:5966`](../../script.js#L5966)

**Regression coverage**

- Chromium validates focus, geometry, and bidirectional Assistant/Scout restoration.
  [`test_userscript_chrome.js:283`](../../tests/test_userscript_chrome.js#L283)

- Hermetic presenter tests lock the silent unavailable-action contract.
  [`ui.test.js:190`](../../tests/session_control/ui.test.js#L190)
