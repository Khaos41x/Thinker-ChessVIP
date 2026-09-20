---
title: 'Fix Scout visibility, opponent HUD, and banner layout'
type: 'bugfix'
created: '2026-09-20'
status: 'done'
review_loop_iteration: 0
baseline_commit: 'f49202661b4dc162db7d3d4fbb1b7bedd0c796dc'
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The opponent Scout panel and recent W/D/L HUD never appear on the current Chess.com interface because opponent discovery depends on obsolete top-player selectors and the UI is created only after a successful request. The Thinker Chess banner also uses an older embedded image and computes a short height instead of filling the right-side column.

**Approach:** Make opponent discovery resilient to current Chess.com player rows through scoped selectors plus visible-position fallbacks, use Tampermonkey's cross-origin request capability for the existing PubAPI endpoint, establish loading/render lifecycle at nickname detection, and replace the embedded banner with `Banner-ThinkerChess.png` sized to the full notation-panel height and available right column.

## Boundaries & Constraints

**Always:** Place `.tc-hud-stats` immediately after the visible top opponent name; place `#oi-zone2` beside `#krypbot-container`; preserve current-month PubAPI, strict cache, silent failures, stale-response protection, `DEBUG = false`, Auto Queue, and Ghost Mode; embed the supplied banner so the Tampermonkey script is self-contained; keep the banner responsive and aligned to the notation sidebar.

**Ask First:** Changing Scout metrics/cache schema, introducing another data provider, moving the Thinker configuration panel, or requiring a server/backend change.

**Never:** Depend on DevTools or user DOM inspection; select navigation/chat/member links as opponents; leave loading placeholders after failure; stretch the banner out of proportion; expose API/cache errors in the console; modify unrelated workspace files.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Current player DOM | Nickname appears in a current or legacy top player row | Detect normalized opponent, insert W/D/L beside that exact name, fetch/cache data, and show Scout beside Thinker panel | Debounce repeated mutations and never duplicate UI |
| Changed/anonymous DOM | No reliable top-row nickname or lobby placeholder such as `Adversário` | Do not request a fake profile or attach HUD to unrelated links | Remove stale Scout/HUD silently |
| PubAPI response | Valid current-month games | Render 10-game W/D/L and streak plus 50-game Scout | Reject stale responses after opponent/URL change |
| PubAPI failure | CORS/network/profile/JSON error | Remove loading HUD/panel and keep chess UI operational | No console output or escaped exception |
| Wide right column | Notation sidebar and free space are visible | Banner begins at sidebar top, uses its full height, and fills the free right column with `object-fit: cover` | Hide when no usable right-side slot exists |
| Narrow viewport | Little or no space to the right of notation | Avoid covering board/sidebar and avoid horizontal overflow | Hide banner until sufficient width returns |

</frozen-after-approval>

## Code Map

- `script.js:273-833` -- OpponentIntel detection, request lifecycle, HUD, Scout panel, cache and observer.
- `script.js:1991-2315` -- Thinker panel styles/markup, embedded banner and responsive positioning loop.
- `tests/test_scout_logic.js` -- existing Scout/cache/race regression suite to extend with DOM discovery and transport behavior.
- `Banner-ThinkerChess.png` -- supplied 1122×1402 banner source to embed in the userscript.

## Tasks & Acceptance

**Execution:**
- [x] `script.js` -- broaden and validate opponent-row discovery using scoped selectors and geometry-safe fallbacks; mount the HUD on the exact nickname node.
- [x] `script.js` -- route current-month PubAPI loading through a reliable asynchronous Tampermonkey transport while retaining cancellation/version guards and silent cleanup.
- [x] `script.js` -- make Scout/HUD loading and final placement deterministic beside the existing panel and opponent name without duplicates.
- [x] `script.js` -- replace the old banner payload with `Banner-ThinkerChess.png` and make its container fill the right slot at notation-sidebar height.
- [x] `tests/test_scout_logic.js` -- add regressions for current DOM selectors, invalid placeholders, transport success/failure, and rapid opponent replacement.

**Acceptance Criteria:**
- Given a live game with a recognized upper player, when its nickname renders, then a single W/D/L HUD appears immediately beside it and valid PubAPI data populates both HUD and Scout.
- Given the Thinker configuration panel exists, when Scout data loads, then the Scout card is visible directly to its right with matching top alignment.
- Given the notation sidebar and right-side slot exist, when layout changes or the window resizes, then the supplied banner remains aligned, fills the available column height, and does not cover gameplay UI.
- Given network or DOM failure, when detection retries, then no stale/duplicate UI or console spam remains.

## Spec Change Log

## Design Notes

The supplied banner is the visual source of truth. It should crop with `object-fit: cover` inside the available vertical slot rather than derive height from width. The Scout card retains the existing dark glass treatment and must align with the Thinker settings card shown in the annotated screenshot.

## Verification

**Commands:**
- `node --check script.js` -- expected: no syntax errors.
- `node tests/test_scout_logic.js` -- expected: Scout processing, DOM discovery, transport and race assertions pass.
- `git diff --check -- script.js tests/test_scout_logic.js` -- expected: no whitespace errors.
- `rg -n "console\\.(log|info|warn|trace)|games/archives" script.js` -- expected: no direct console spam or deprecated endpoint.

**Manual checks:**
- Compare the HUD, Scout position and banner proportions against the three supplied screenshots at game and lobby states.

## Suggested Review Order

**Opponent discovery and data lifecycle**

- Start with the complete cache, loading, transport, retry, and stale-response pipeline.
  [`script.js:645`](../../script.js#L645)

- Current and legacy player-row discovery rejects lobby placeholders and unrelated page links.
  [`script.js:850`](../../script.js#L850)

**Scout and HUD placement**

- Loading state mounts immediately beside the Thinker panel before PubAPI completion.
  [`script.js:724`](../../script.js#L724)

- W/D/L and streak attach directly after the resolved upper-player username node.
  [`script.js:758`](../../script.js#L758)

- Final Scout metrics replace loading content without duplicating or orphaning the panel.
  [`script.js:802`](../../script.js#L802)

**Responsive banner**

- Pure geometry calculation fills the safe right slot and honors Ghost Mode.
  [`script.js:2266`](../../script.js#L2266)

- Embedded supplied artwork remains self-contained with full-height cover cropping.
  [`script.js:2555`](../../script.js#L2555)

- Live observers keep the banner aligned through sidebar replacement and viewport changes.
  [`script.js:2582`](../../script.js#L2582)

**Verification and visual evidence**

- Regression coverage exercises current DOM, PubAPI transport, cache, races, and banner geometry.
  [`test_scout_logic.js:1`](../../tests/test_scout_logic.js#L1)

- Design QA records screenshot targets and measured live Chess.com layout results.
  [`design-qa.md:1`](../../design-qa.md#L1)
