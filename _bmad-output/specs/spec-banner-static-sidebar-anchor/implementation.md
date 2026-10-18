# Implementation Contract

## Confirmed diagnosis

There is no direct banner `scroll` listener in the current userscript. The instability comes from a viewport-fixed banner combined with several independent update paths:

- initial and fallback positioning;
- a `MutationObserver` watching `class`, `style`, `hidden`, and `aria-hidden` across the entire body;
- a sidebar `ResizeObserver`;
- the window resize handler;
- reconciliation and watchdog recovery paths.

The current geometry clamps `top` and `height` to the viewport. That makes the banner's vertical box differ from the sidebar whenever the sidebar extends beyond the viewport. Because the banner uses `position:fixed`, it also cannot scroll naturally with the document.

## Geometry model

Use one pure calculation based on the sidebar border box:

```text
documentTop = sidebarRect.top + window.scrollY
documentLeft = sidebarRect.right + window.scrollX + 15
height = sidebarRect.height
availableWidth = window.scrollX + document.documentElement.clientWidth - safeRightEdge - documentLeft
```

The update is rejected and the banner is hidden when the sidebar is absent, invisible, too small, or the available width is unsafe. Remove the viewport fallback because it creates a second alignment model.

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

## Hermetic verification

- Given sidebar `{top: 137, right: 1248, height: 742}`, `scrollX: 0`, and `scrollY: 500`, the banner receives `top: 637px`, `left: 1263px`, and `height: 742px`.
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
- Banner image payload and non-positioning visual properties.

## Execution evidence

The user approved execution on 2026-10-18. The implementation and deterministic build completed, and the banner, Session Control, Auto Rating, Auto Queue, Scout, syntax, and build checks passed.
