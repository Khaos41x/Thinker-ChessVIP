---
title: 'Phase 08 interface refinement and design system'
type: 'refactor'
created: '2026-10-21'
status: 'done'
baseline_commit: 'f02e7cae7f79aacab0d15d12539733445d2e9d23'
review_loop_iteration: 0
context:
  - 'AGENTS.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The Thinker Chess and Opponent Scout workspace appears as a set of oversized, inconsistently styled widgets. The empty Scout consumes a full column, Auto Play can display misleading inactive metrics, dependency relationships are unclear, and visible text mixes Portuguese and English.

**Approach:** Refine the existing presenters, markup, and shared CSS into a compact Portuguese-first interface system. Use real session and feature state to drive contextual disclosure, compact empty states, accurate zero-sample statistics, predictable focus behavior, and responsive content sizing.

## Boundaries & Constraints

**Always:** Preserve the current userscript architecture, Session Control DTO/reducer/IndexedDB/telemetry, automation behavior, safety gates, backend and engines. Keep Assistant and Scout independently renderable but jointly collapsible/restorable. Use semantic controls, visible focus, reduced-motion support, content-driven sizing, and system typography. Make the empty Scout compact; expand only for loading, unavailable, or real public data. Centralize Portuguese labels and presentation-only status formatting. Show raw win rate as `—` when zero completed games. Map true idle state to an inactive-friendly label, not `Concluído`.

**Ask First:** Any change to automation behavior, feature dependencies, persisted configuration semantics, Session Control state transitions, feature availability policy, database schema, server APIs, engine integration, or live-game assistance permissions.

**Never:** Add dependencies, rewrite the interface architecture, alter calculations/rating/matchmaking, expose technical telemetry, fabricate operational states, or push to a remote.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|---|---|---|---|
| Empty Scout | No opponent identified | Compact card with concise neutral explanation; no fake searching/radar column | Close/reopen remains available |
| Scout data | Public opponent data available | Card grows only to its rendered content | Existing privacy/data validation remains unchanged |
| Idle Auto Play | No session snapshot, no completed games | `Aguardando`, `00:00:00`, clean zero record, win rate `—` | No false completed state |
| Active session | Queueing/game/draining/paused real phase | Friendly localized phase, relevant primary/secondary actions | No DTO or lifecycle mutation |
| Dependent control off | Parent feature is disabled | Child setting is hidden or visibly disabled according to existing relevance | No automation configuration changed |
| Narrow/zoomed viewport | 1280×720, 1440×900, 1920×1080 and 125/150% zoom | No clipped controls, overlap, or horizontal overflow | Internal scrolling only when necessary |

</frozen-after-approval>

## Code Map

- `script.js` -- workspace shell, Scout render states, markup, CSS tokens, localized labels, control dependencies, and visual lifecycle.
- `frontend/session_control/ui.js` -- display-only session phase, counts, and win-rate formatting.
- `tests/session_control/ui.test.js` -- presenter semantic-state and static UI contracts.
- `tests/test_userscript_chrome.js` -- Chromium interaction, responsive, focus, overflow, state, and screenshot verification.
- `scripts/build_userscript.py` -- deterministic embedding of the shared Session Control module.

## Tasks & Acceptance

**Execution:**

- [x] `script.js` -- consolidate design tokens and rebuild layout composition around content-sized cards, compact Scout states, contextual groups, localized labels, and consistent accessible controls.
- [x] `frontend/session_control/ui.js` -- add presentation-only idle/zero-sample projections without altering status construction or calculations.
- [x] `script.js` -- connect visual dependency treatment to already-existing feature state without changing feature behavior or persistence.
- [x] `tests/session_control/ui.test.js` -- cover idle/terminal/active projections, zero-sample rate, localization, and preserved action semantics.
- [x] `tests/test_userscript_chrome.js` -- test empty/populated Scout sizing, focus order, open/close/restore, dependent-control states, 1280/1440/1920 viewports, 125/150% zoom, overflow, and screenshots.
- [x] `script.js` -- regenerate deterministically and retain existing userscript contracts.

**Acceptance Criteria:**

- Given no identified opponent, when the workspace renders, then Scout remains compact and does not reserve a full-height column.
- Given idle, active, paused, terminal, and zero-sample session status, when the presenter updates, then status, time, record, and rate use truthful Portuguese display values without changing the source DTO.
- Given a parent feature is disabled, when its child configuration is shown, then the UI clearly communicates its inactive relationship while preserving the saved setting and automation behavior.
- Given the required viewports and zoom levels, when panels render and are collapsed/restored, then controls remain reachable, visible, keyboard-operable, and free of overflow or orphaned panels.
- Given two deterministic builds, when `script.js` is regenerated, then the outputs are byte-identical and all existing Session Control regressions pass.

## Design Notes

The workspace is one small product surface, not two equal dashboards. The Assistant carries controls and session state; Scout starts as a compact adjacent module and earns vertical space only when it has public data. Green communicates active/available state only. Neutral graphite surfaces, one typography scale, fewer nested cards, and disclosure driven by relevance provide compactness without shrinking text below legibility.

## Verification

**Commands:**

- `node tests/session_control/run.js` -- expected: all presenter/runtime/build tests pass.
- `node tests/test_userscript_chrome.js --screenshot` -- expected: behavior, focus, geometry, overflow, responsive and screenshot assertions pass.
- `python scripts/build_userscript.py` twice plus SHA-256 comparison -- expected: byte-identical `script.js`.
- `git diff --check` -- expected: clean patch.

## Suggested Review Order

**Workspace composition**

- Start with the compact Scout state that removes decorative dead space.
  [`script.js:1733`](../../script.js#L1733)

- Review shared glass tokens, responsive stacking, and content-sized card geometry.
  [`script.js:5520`](../../script.js#L5520)

- Inspect the localized Assistant and Auto Play markup hierarchy.
  [`script.js:5945`](../../script.js#L5945)

- Verify board-relative placement clamps the workspace inside the viewport.
  [`script.js:6139`](../../script.js#L6139)

**Truthful presentation**

- Confirm zero-sample rates use control-game provenance without changing statistics.
  [`ui.js:92`](../../frontend/session_control/ui.js#L92)

- Check dependency styling communicates context while preserving editable settings.
  [`script.js:5775`](../../script.js#L5775)

**Regression evidence**

- Presenter tests cover phases, rate provenance, labels, and preserved actions.
  [`ui.test.js:136`](../../tests/session_control/ui.test.js#L136)

- Chromium tests exercise zoomed viewports, overflow, keyboard interaction, and screenshots.
  [`test_userscript_chrome.js:510`](../../tests/test_userscript_chrome.js#L510)

- Compare the previous full-height Scout against the compact final workspace.
  [`thinker-panels-before.png`](../../tests/artifacts/thinker-panels-before.png)

- Inspect the final captured UI after all interaction and responsive checks.
  [`thinker-panels-final.png`](../../tests/artifacts/thinker-panels-final.png)
