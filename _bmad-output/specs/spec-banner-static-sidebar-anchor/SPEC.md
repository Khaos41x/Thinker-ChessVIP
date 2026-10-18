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
  - **success:** Its document-space top equals the sidebar viewport top plus `scrollY`, its height equals the sidebar border-box height, and its left edge equals the sidebar viewport right plus `scrollX` plus 15 CSS pixels whenever the preferred banner width fits safely in the viewport.

- **CAP-2**
  - **intent:** The banner scrolls naturally with the page without continuous JavaScript repositioning.
  - **success:** Scrolling does not execute banner geometry writes, while initial mount, native sidebar resize, browser resize, and sidebar replacement each produce at most one coalesced geometry update.

- **CAP-3**
  - **intent:** The complete banner artwork remains visible in fullscreen and laterally expanded host layouts.
  - **success:** The banner's document-space right edge never exceeds `scrollX + document.documentElement.clientWidth - safeRightEdge`; the 15 CSS pixel gap is preserved while at least the minimum readable width remains, and the embedded logo and lettering are not cropped when the banner narrows.

## Constraints

- Keep the banner as a direct child of `document.body` with `position:absolute`.
- Observe only the currently resolved native sidebar with `ResizeObserver`.
- Periodic timers and scroll handlers must not calculate or write banner geometry.
- Global DOM observation may detect sidebar replacement but must not observe style/class attributes or reposition when the sidebar identity is unchanged.
- Set `transition:none` for banner geometry so `top`, `left`, `width`, and `height` do not animate.
- Use named constants for the preferred 15 CSS pixel gap, safe viewport edge, 170 CSS pixel preferred width, and 96 CSS pixel minimum readable width.
- Prefer the 15 CSS pixel sidebar gap. If the available right-side width is between the preferred and minimum widths, shrink the banner to the available width. If it is below the minimum width, keep a readable width and shift the banner left until its right edge is inside the safe viewport boundary.
- Render the existing banner artwork with `object-fit:contain` so narrowing cannot crop its embedded lettering.
- Preserve the existing visibility contract for review, post-game, Ghost Mode, active games, and `/play/online`.
- Preserve the Thinker panel, Scout layout, `menuHtml`, host grid, and DOM injection topology.

## Non-goals

- Redesigning the banner artwork or changing its visibility policy.
- Moving the Thinker panel or Scout into the Chess.com layout.
- Changing Auto Queue, gameplay, or backend behavior.

## Success signal

The banner remains vertically flush with the native sidebar before and after scroll, follows the document without scroll-triggered style writes, realigns deterministically when dimensions change, and stays fully inside the safe horizontal viewport boundary at every supported width.

## Assumptions

- In extremely constrained layouts, keeping the banner readable and fully visible may place it partially over the native sidebar; this fallback is preferable to clipping content outside the viewport and does not alter host layout flow.
