# Implementation Contract

## Confirmed cause

`NEW_GAME_SELECTORS` already contains general `new-game` and `play-again` candidates, but `findNewGameButton()` searches only within a game-over modal. `clickNewGame()` returns immediately when `findGameOverRoot()` returns null. The delayed pre-click check and native-click fallback repeat the same modal requirement. Therefore, once the modal is absent, no existing selector can reach the right sidebar.

## Patch boundary

The implementation is confined to the Auto Queue block around `GAME_OVER_SELECTORS`, `NEW_GAME_SELECTORS`, `findNewGameButton()`, `clickAutoQueueTarget()`, and `clickNewGame()` in `script.js`.

Before editing, record hashes for the CSS/template and DOM-injection regions. After editing and build, verify those regions are byte-identical. No generated UI source or build template may be changed.

## Selector chain

Add explicit, ordered selector groups:

1. **Modal actions:** preserve the current behavior and selector priority.
2. **Sidebar roots:** reuse the known Chess.com right-sidebar roots already recognized by the userscript, including `.play-controller-component`, `.board-layout-sidebar`, `.layout-board-sidebar`, and `#board-layout-sidebar`.
3. **Sidebar New Game actions:** stable `data-cy`, `data-test-element`, `aria-label`, `title`, and normalized visible-text signals for `New Game`/`Nova partida`/`Novo jogo`.
4. **New-game plus action:** first use trustworthy new-game semantics. When the glyph is rendered only by SVG/CSS, locate the detectable rematch control as a non-clickable anchor and select the eligible clickable peer whose rectangle overlaps the same row immediately to its left. Return no target if either part is absent.
5. **Play-online Start Game:** stable `data-cy`, `data-test-element`, `aria-label`, title, class, and exact normalized text for `Start Game`, `Iniciar partida`, or `Começar partida`, scoped to a recognized right sidebar. No geometric selection is permitted.

Delete `SIDEBAR_PLAY_AGAIN_SELECTORS` and its resolution branch. Add a hard rejection predicate over visible text, `aria-label`, `title`, `data-cy`, `data-test-element`, `data-control-view`, and class for `play-again`, `rematch`, `revanche`, retry, repeat, reload, and equivalent circular-arrow signals. The screenshot establishes that this control sends a rematch invitation and is never a new-game fallback.

Add the same hard rejection for move navigation and playback signals: next, previous, forward, back, first/last move, step, ply, navigation, pause, resume, unpause, analysis, playback, continue, and their Portuguese equivalents. This prevents the structural fallback from selecting the analysis navigation row.

All candidates continue through `isSafeAutoQueueButton()`. Global text search is forbidden for sidebar fallbacks.

## Resolution flow

Introduce one resolver that returns `{ source, root, button }`:

1. Find a visible game-over modal and its valid action.
2. If no valid modal action exists, find a recognized right-sidebar root and an explicit lobby `Start Game` action.
3. In a validated post-game sidebar, search for a labeled `New Game` action.
4. As the final post-game fallback, resolve the rematch-anchored left peer.
5. Return no target when only rematch, analysis, navigation, custom challenge, friend, or tournament actions are available.

Use this same resolver in:

- initial discovery in `clickNewGame()`;
- delayed pre-click reacquisition after the existing randomized delay;
- verification before the synthetic click fallback.

The delayed phase must prefer the newly resolved node and reject a disconnected, hidden, disabled, or semantically invalid original node.

## State-machine invariants

- Keep `sessionControlBridge.queueGate()` and `executeQueue()` unchanged.
- Keep `queueTriggered`, `auto_queue_pending`, `auto_queue_completed_fen`, URL reset, and timer cancellation semantics unchanged.
- Set the triggered state and completion FEN through the existing path only after final target validation.
- Preserve one action per completed-game state despite MutationObserver and interval races.
- Do not schedule the delayed synthetic click fallback for a sidebar target. A successful native click is the sole attempt until navigation or a confirmed new-game FEN resets the state.

## Hermetic verification

Use a fake DOM with no network or browser dependency and cover:

1. visible modal and visible sidebar: modal receives exactly one click;
2. hidden modal and visible sidebar `New Game`: sidebar action receives exactly one click;
3. absent modal with glyph-only plus at the left, circular-arrow rematch at the right, and move-navigation row below: only the left action receives one click;
4. rematch identified by selector, text, `aria-label`, title, data attribute, class, or control-view: zero clicks;
5. sidebar containing only rematch: no target and no invitation;
6. plus controls outside the sidebar or without post-game evidence: no click;
7. selected node replaced during the delay: replacement is reacquired and the stale node is untouched;
8. disabled, hidden, disconnected, `pointer-events: none`, review, share, report, and close candidates: rejected;
9. repeated observer, interval, and fallback-timer execution: one queue execution and one sidebar click;
10. Session Control gate denied: no action;
11. static regression check: CSS, `menuHtml`, panel markup, and DOM-injection regions are unchanged.
12. `/play/online` sidebar with `Start Game`, `Custom Challenge`, `Play a Friend`, and `Tournaments`: only `Start Game` receives one click;
13. repeated observer and interval execution while matchmaking is pending: no duplicate `Start Game` click.

## Implementation approval gate

No production code or tests will be changed until the user responds with `[A] Approve`. `[E] Edit` updates this specification first.
