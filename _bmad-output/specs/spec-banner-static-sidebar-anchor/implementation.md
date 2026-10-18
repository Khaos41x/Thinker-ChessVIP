# Implementation Contract

## Confirmed diagnosis

The absolute document anchoring and focused `ResizeObserver` already removed the scroll jitter. The remaining fullscreen defect has two causes in the current implementation:

- geometry derives banner width from whatever space remains after the 15 CSS pixel gap but does not express a preferred width and a deterministic constrained-layout fallback;
- the inner image uses `object-fit:cover`, so the box may remain inside the viewport while the embedded logo and lettering are cropped when that box becomes narrow.

The correction therefore needs both an explicit right-edge invariant for the outer box and non-cropping image fitting. It does not require a new positioning model or lifecycle trigger.

## Geometry model

Use one pure calculation based on the sidebar border box and named constants:

```text
documentTop = sidebarRect.top + window.scrollY
viewportLeft = window.scrollX + safeViewportEdge
viewportRight = window.scrollX + document.documentElement.clientWidth - safeViewportEdge
idealLeft = sidebarRect.right + window.scrollX + preferredGap
availableWidth = viewportRight - idealLeft

if availableWidth >= minimumReadableWidth:
    width = min(preferredBannerWidth, availableWidth)
    documentLeft = idealLeft
else:
    width = min(preferredBannerWidth, viewportRight - viewportLeft)
    documentLeft = max(viewportLeft, viewportRight - width)

height = sidebarRect.height
```

The invariant is `documentLeft >= viewportLeft` and `documentLeft + width <= viewportRight`. The preferred constants are 15 CSS pixels for the sidebar gap, 170 CSS pixels for banner width, and 96 CSS pixels for minimum readable width. The update is rejected and the banner is hidden only when the sidebar is absent, invisible, too small, or even the safe viewport cannot contain the minimum geometry. There is no viewport-positioning fallback and no host layout mutation.

## Lifecycle

1. Resolve the sidebar at initial mount.
2. Disconnect the previous `ResizeObserver` target before observing a replacement sidebar.
3. Run geometry through one `requestAnimationFrame` scheduler from:
   - initial binding;
   - the sidebar `ResizeObserver` callback;
   - the passive window `resize` handler;
   - a confirmed sidebar identity replacement during SPA navigation.
4. Do not schedule geometry from scroll events, periodic timers, unchanged DOM mutations, or visibility polling.
5. Keep a child-list-only DOM observer solely to detect sidebar replacement. It may rebind the observer, but it must not perform geometry writes when the resolved sidebar instance is unchanged.
6. Cleanup disconnects both observers, cancels the pending frame, and removes the resize handler idempotently.

## Presentation

The existing banner node remains under `document.body`. Change only its positioning contract:

```css
position: absolute;
transition: none;
```

Keep its image, z-index, pointer behavior, border, shadow, and visibility gate unchanged.

Change the inner image from `object-fit:cover` to `object-fit:contain`, retaining its existing source, centering, and full-box sizing. The banner lettering is part of the image asset, so CSS text overflow cannot protect it from `cover` cropping.

## Hermetic verification

- Given sidebar `{top: 137, right: 1248, height: 742}`, `scrollX: 0`, and `scrollY: 500`, the banner receives `top: 637px`, `left: 1263px`, and `height: 742px`.
- With at least 170 CSS pixels available after the preferred gap, width is 170 CSS pixels and the left edge remains exactly 15 CSS pixels after the sidebar.
- With 120 CSS pixels available after the preferred gap, width is 120 CSS pixels and the right edge remains inside the safe viewport boundary.
- With less than 96 CSS pixels available after the preferred gap, the banner keeps a readable bounded width and shifts left so its right edge equals the safe viewport boundary.
- Every geometry result satisfies `left >= viewportLeft` and `left + width <= viewportRight`.
- The inner image uses `object-fit:contain`; static checks reject `object-fit:cover` for the banner artwork.
- Changing scroll offsets without invoking an approved lifecycle trigger produces zero banner style writes.
- Repeated DOM mutations with the same sidebar instance produce zero geometry updates.
- Sidebar resize produces one coalesced update.
- Sidebar replacement disconnects the old target, observes the new target, and produces one coalesced update.
- Browser resize produces one coalesced update.
- Static checks reject `position:fixed`, banner scroll listeners, timer-driven positioning, geometry transitions, and attribute-wide mutation observation.
- Existing review/post-game/Ghost Mode and `/play/online` visibility tests remain green.

## Protected regions

- `menuHtml` and all Thinker/Scout CSS.
- `#oi-wrapper`, `#krypbot-container`, and Scout injection topology.
- Auto Queue selectors and behavior.
- Banner image payload and visual properties other than the explicitly authorized `object-fit` correction.

## Execution evidence

The user approved execution on 2026-10-18. The implementation and deterministic build completed, and the banner, Session Control, Auto Rating, Auto Queue, Scout, syntax, and build checks passed.

The user approved the fullscreen boundary refinement on 2026-10-18. The implementation now enforces the right-edge invariant, preserves readable width through the approved left-shift fallback, and renders the artwork with `object-fit:contain`.

The banner geometry, visibility, Session Control, Auto Rating, Auto Queue, Scout, syntax, and generated-region checks passed. Two consecutive deterministic builds produced the same `script.js` SHA-256: `573A45CB34B50AFB868D940FC87364F8036563A069D6A6314F71A22D2D06B9CC`.
