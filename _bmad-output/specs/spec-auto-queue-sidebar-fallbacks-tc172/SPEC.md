---
id: SPEC-auto-queue-sidebar-fallbacks-tc172
companions:
  - implementation.md
sources: []
---

> **Canonical contract.** This SPEC and the files in `companions:` are the complete, preservation-validated contract for what to build, test, and validate.

# Auto Queue Sidebar Fallbacks — TC172

## Why

Auto Queue stalls when the central game-over modal is closed or never rendered because its discovery and delayed-click paths require that modal to exist. The post-game right sidebar still exposes actions that can continue the Module 14 session loop.

## Capabilities

- **CAP-1**
  - **intent:** Auto Queue can resolve a visible new-game action through an ordered modal-first, sidebar-second chain.
  - **success:** With both surfaces present it selects the modal new-game action; without a visible modal it selects the sidebar `New Game` action, then the exact sidebar `+` action.

- **CAP-2**
  - **intent:** Auto Queue can survive SPA replacement of the selected action between discovery and execution.
  - **success:** Immediately before clicking, it reacquires a connected, visible, enabled action from the same ordered chain and never clicks a stale node.

- **CAP-3**
  - **intent:** A sidebar fallback continues the existing Module 14 queue transition exactly once.
  - **success:** The existing queue gate, randomized delay, duplicate suppression, completion FEN capture, and queue execution path remain effective for modal and sidebar actions.

- **CAP-4**
  - **intent:** Auto Queue distinguishes new-game controls from rematch controls.
  - **success:** Circular-arrow, `Play Again`, `Rematch`, and `Revanche` controls never receive a click or generate an invitation.

- **CAP-5**
  - **intent:** Auto Queue can start matchmaking from the Chess.com play-online setup screen.
  - **success:** After the post-game new-game transition reaches `/play/online`, the visible explicit `Start Game` action receives exactly one click.

## Constraints

- Change only Auto Queue JavaScript selector and action-resolution logic in `script.js`.
- Preserve all CSS, HTML, `menuHtml`, panel structure, layout, DOM injection, endpoint, payload, and backend code byte-for-byte.
- Scope sidebar fallbacks to a recognized Chess.com right-sidebar root.
- Accept only visible and enabled controls with `New Game` semantics or an exact `+` label.
- Accept a generic plus-only control only inside a validated post-game sidebar context.
- Resolve candidates deterministically: modal new-game action, sidebar `New Game`, sidebar exact `+`.
- Reject text and attributes that signal `Play Again`, `Rematch`, `Revanche`, retry, repeat, reload, or a circular-arrow action.
- Reject text and attributes that signal next/previous move, forward/back, first/last move, step, ply, or navigation.
- When glyph semantics are unavailable, use the detectable rematch control only as a geometric anchor and select the eligible clickable peer overlapping the same row immediately to its left.
- Return no target when the rematch anchor or its eligible left-row peer is absent.
- Reject pause, resume, unpause, playback, analysis, and continue controls.
- Resolve the lobby stage semantically inside a recognized right sidebar using exact `Start Game`, `Iniciar partida`, or `Começar partida` labels and stable start-game attributes; geometric fallback is forbidden.
- Exclude `Custom Challenge`, `Play a Friend`, `Tournaments`, and navigation controls from the lobby stage.
- Allow at most one sidebar click attempt per completed-game state; do not apply the delayed synthetic retry to sidebar controls.
- Preserve existing document and shadow-root traversal.

## Non-goals

- Redesigning Auto Queue timing or Module 14 state transitions.
- Adding page layout, styling, panel, injection, API, or backend behavior.
- Clicking generic plus controls outside the post-game sidebar.
- Starting a rematch or sending an invitation to the previous opponent.
- Starting a custom challenge, friend challenge, or tournament.

## Success signal

Hermetic DOM tests demonstrate the complete two-stage continuation: one post-game new-game click followed by one explicit `Start Game` click on `/play/online`, while rematch, analysis, navigation, custom challenge, friend, and tournament controls receive zero clicks.

