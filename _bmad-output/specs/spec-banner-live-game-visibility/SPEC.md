---
id: SPEC-banner-live-game-visibility
companions:
  - implementation.md
sources: []
---

> **Canonical contract.** This SPEC and its companions define the complete correction.

# Banner Visibility During Active Matches

## Why

The banner positioning and recovery paths currently show the Thinker Chess banner whenever a compatible board/sidebar exists. Chess.com game review retains those elements, so the banner appears during `/analysis/.../review` even though no match is active.

## Capabilities

- **CAP-1**
  - **intent:** Banner visibility follows one active-match decision across every lifecycle path.
  - **success:** Mount, positioning, fallback, resize, reconciliation, and watchdog paths cannot display the banner when the centralized predicate returns false.

- **CAP-2**
  - **intent:** SPA navigation updates banner visibility as gameplay state changes.
  - **success:** The banner is visible on `/play/online` and during an active `/game/live` match, while remaining hidden during review, post-game, puzzle, and unsupported states without requiring a reload.

## Constraints

- `/analysis/game/live/.../review` is always banner-ineligible.
- `/play/online` is banner-eligible when the board and gameplay sidebar are visible and no review/post-game evidence exists.
- Visible `Game Review` or game-over evidence makes the banner ineligible even if the URL resembles a game route.
- Keep the banner mounted while hidden so an active-game transition can restore it.
- Do not alter CSS rules, banner markup, geometry, `menuHtml`, panel layout, or DOM-injection topology.

## Non-goals

- Changing visibility of the Thinker control panel or Opponent Scout.
- Repositioning or redesigning the banner.
- Changing Auto Queue or gameplay logic.

## Success signal

Hermetic lifecycle tests show `display:flex` only for an active live match and `display:none` for the supplied review URL, post-game, `/play/online`, puzzles, Ghost Mode, and SPA transitions between those states.

