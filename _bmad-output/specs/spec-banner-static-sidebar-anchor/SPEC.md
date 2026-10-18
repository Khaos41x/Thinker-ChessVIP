---
id: SPEC-banner-static-sidebar-anchor
companions:
  - implementation.md
sources: []
---

> **Canonical contract.** This SPEC and the files in `companions:` define the complete banner anchoring correction.

# Static Sidebar Anchoring for the Thinker Chess Banner

## Why

The banner currently appears to jitter during page scrolling and does not exactly match the native Chess.com sidebar's vertical position and height. Operators need the banner to behave like a stable document element while preserving the host layout.

## Capabilities

- **CAP-1**
  - **intent:** The banner aligns precisely with the resolved native gameplay sidebar.
  - **success:** Its document-space top equals the sidebar viewport top plus `scrollY`, its height equals the sidebar border-box height, and its left edge equals the sidebar viewport right plus `scrollX` plus 15 CSS pixels.

- **CAP-2**
  - **intent:** The banner scrolls naturally with the page without continuous JavaScript repositioning.
  - **success:** Scrolling does not execute banner geometry writes, while initial mount, native sidebar resize, browser resize, and sidebar replacement each produce at most one coalesced geometry update.

## Constraints

- Keep the banner as a direct child of `document.body` with `position:absolute`.
- Observe only the currently resolved native sidebar with `ResizeObserver`.
- Periodic timers and scroll handlers must not calculate or write banner geometry.
- Global DOM observation may detect sidebar replacement but must not observe style/class attributes or reposition when the sidebar identity is unchanged.
- Set `transition:none` for banner geometry so `top`, `left`, `width`, and `height` do not animate.
- Preserve the existing visibility contract for review, post-game, Ghost Mode, active games, and `/play/online`.
- Preserve the Thinker panel, Scout layout, `menuHtml`, host grid, and DOM injection topology.

## Non-goals

- Redesigning the banner artwork or changing its visibility policy.
- Moving the Thinker panel or Scout into the Chess.com layout.
- Changing Auto Queue, gameplay, or backend behavior.

## Success signal

The banner remains vertically flush with the native sidebar before and after scroll, follows the document without scroll-triggered style writes, and realigns deterministically when the sidebar or browser dimensions change.

## Assumptions

- Banner width remains bounded by the horizontal space between the anchored left edge and the viewport's safe right edge; exact mirroring applies to top and height.
