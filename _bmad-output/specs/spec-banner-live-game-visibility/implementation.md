# Implementation Contract

## Confirmed cause

`positionThinkerBannerFallback()`, `positionThinkerBannerShell()`, the nested `updateBannerPosition()`, Ghost Mode recovery, and the shell watchdog can independently expose the banner. None shares an active-match visibility gate. `isThinkerSupportedRoute()` also accepts a page whenever board-like layout exists, which includes review.

## Correction

Add a pure `shouldShowThinkerBanner()` predicate that returns false when any condition holds:

- Ghost Mode is active;
- pathname begins with `/analysis/` or contains a review segment;
- pathname is puzzle or another unsupported route;
- a visible game-over root exists;
- the recognized sidebar contains visible post-game `Game Review` evidence.

The positive path accepts `/game/<id>`, `/game/live/<id>`, and `/play/online` when active board/sidebar evidence is present. Route normalization is lowercase and deterministic. `/play/online` remains eligible whether it is displaying an active game or the `Start Game` state shown in the supplied evidence.

Call the predicate before every banner exposure path:

1. `positionThinkerBannerFallback()`;
2. `positionThinkerBannerShell()`;
3. nested `updateBannerPosition()`;
4. Ghost Mode recovery scheduling;
5. shell-watchdog recovery.

When false, set the existing banner node to `display:none` and return before geometry writes. Keep the node mounted.

## Hermetic verification

- `/game/live/<id>` with active board and no terminal evidence: visible.
- `/analysis/game/live/<id>/review`: hidden.
- game-like URL with visible `Game Review`: hidden.
- game-like URL with visible game-over modal: hidden.
- `/play/online` with a visible board/sidebar and no review/post-game evidence: visible.
- puzzle and unrelated routes: hidden.
- Ghost Mode: hidden.
- SPA `/play/online` → active-game → review → `/play/online`: visible → visible → hidden → visible.
- Static protected-region check confirms CSS, banner HTML, `menuHtml`, and injection topology are unchanged.

## Approval gate

Production code and tests remain unchanged until `[A] Approve`; `[E] Edit` updates this contract.
