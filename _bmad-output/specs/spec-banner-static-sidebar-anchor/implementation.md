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

width = min(preferredBannerWidth, viewportRight - viewportLeft)

if availableWidth >= width:
    documentLeft = idealLeft
else:
    documentLeft = max(viewportLeft, viewportRight - width)

height = sidebarRect.height
```

The invariant is `documentLeft >= viewportLeft` and `documentLeft + width <= viewportRight`. The preferred constants are 15 CSS pixels for the sidebar gap, 170 CSS pixels for banner width, and 96 CSS pixels for minimum readable width. The preferred width remains stable whenever the safe viewport is at least 170 CSS pixels wide; constrained right-side space is handled by shifting left. The update is rejected and the banner is hidden only when the sidebar is absent, invisible, too small, or even the safe viewport cannot contain the minimum geometry. There is no viewport-positioning fallback and no host layout mutation.

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

The source JPEG is 1122 by 1402 pixels, while its visible logo and lettering occupy the central horizontal interval from approximately pixel 419 through 702. Render the image at 3.4 times the banner width, preserve its intrinsic aspect ratio with `height:auto`, center it on both axes, and let the banner clip only the decorative outer background. This keeps the measured central artwork within the banner independently of sidebar height. Both `cover` and `contain` are prohibited because they couple scale to the changing container aspect ratio.

## Hermetic verification

- Given sidebar `{top: 137, right: 1248, height: 742}`, `scrollX: 0`, and `scrollY: 500`, the banner receives `top: 637px`, `left: 1263px`, and `height: 742px`.
- With at least 170 CSS pixels available after the preferred gap, width is 170 CSS pixels and the left edge remains exactly 15 CSS pixels after the sidebar.
- With 120 CSS pixels available after the preferred gap, width remains 170 CSS pixels and the banner shifts left so its right edge equals the safe viewport boundary.
- With less than 96 CSS pixels available after the preferred gap, the banner still keeps its readable bounded width and shifts farther left.
- Every geometry result satisfies `left >= viewportLeft` and `left + width <= viewportRight`.
- Static checks require intrinsic-ratio artwork scaling and reject any `object-fit` dependency.
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

The user approved the fullscreen boundary refinement on 2026-10-18. Visual validation showed that `object-fit:contain` compressed the complete composition, while `object-fit:cover` still cropped its lettering as sidebar height increased. The final implementation enforces the right-edge invariant, preserves the 170 CSS pixel design width through the left-shift fallback, and scales the measured central artwork from banner width with intrinsic height.

The banner geometry, visibility, Session Control, Auto Rating, Auto Queue, Scout, syntax, and generated-region checks passed. Two consecutive deterministic builds produced the same `script.js` SHA-256: `789555F802AEDA21C9EE261E4418BDD8A98B915B13DD2580B7A8A278F93A09DE`.
