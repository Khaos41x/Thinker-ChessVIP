---
id: SPEC-page-scrollbar-visual-suppression
companions:
  - implementation.md
sources: []
---

> **Canonical contract.** This SPEC and the files in `companions:` define the complete root scrollbar visual suppression.

# Root Scrollbar Visual Suppression

## Why

The Thinker and Scout panels intentionally remain below the gameplay viewport and are reached through normal page scrolling. The browser's root scrollbar exposes that additional document height and detracts from the intended full-screen presentation.

## Capabilities

- **CAP-1**
  - **intent:** Hide the visual scrollbar of the root Chess.com document without disabling navigation to below-the-fold content.
  - **success:** The root scrollbar track and thumb are absent on supported routes while mouse wheel, touchpad, touch, Page Up/Down, Home/End, keyboard focus scrolling, and programmatic scrolling retain their native behavior.

- **CAP-2**
  - **intent:** Keep scrollbar suppression isolated and reversible across SPA navigation.
  - **success:** An owned class is present on `document.documentElement` only while the Thinker UI is active on a supported route, and cleanup or navigation to an unsupported route removes it idempotently.

## Constraints

- Preserve the existing below-the-fold placement and DOM topology of `#oi-wrapper`, `#krypbot-container`, and Scout.
- Do not set `overflow:hidden`, `overflow:clip`, fixed viewport height, or any equivalent scroll lock on `html`, `body`, or host containers.
- Do not intercept or cancel wheel, touch, pointer, or keyboard events.
- Do not suppress scrollbars inside Chess.com components, the Thinker panel, Scout, dialogs, or move lists.
- Scope every new CSS selector through an owned root class.
- Preserve the banner geometry, artwork, visibility policy, and ResizeObserver lifecycle.

## Non-goals

- Changing document height or panel placement.
- Replacing native scrolling with a custom scroll engine.
- Styling internal component scrollbars.

## Success signal

The gameplay viewport presents no root scrollbar, and users can still scroll normally to the unchanged Thinker and Scout panels below the fold.

