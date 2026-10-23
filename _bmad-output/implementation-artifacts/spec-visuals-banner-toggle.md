---
title: 'Visuals banner toggle'
type: 'feature'
created: '2026-10-23'
status: 'done'
route: 'one-shot'
---

# Visuals banner toggle

## Intent

**Problem:** Users could disable Evaluation Bar but could not hide the Thinker Chess banner.

**Approach:** Add an English Banner switch to Visuals, reusing the existing toggle styling and keyboard handling. Default ON preserves existing behavior. Store the preference in localStorage under thinkerBanner, like the local Evaluation Bar preference. Gate the central visibility predicate and immediately reposition/hide without reconstructing the banner. Keep all route, ghost-mode, responsive and minimum-width restrictions.

## Suggested Review Order

1. [Userscript](../../script.js) — preference, visibility predicate, Visuals control and change binding.
2. [Unit regression](../../tests/test_banner_visibility.js) — default, off/on, repeated layout and fresh initialization.
3. [Chromium regression](../../tests/test_userscript_chrome.js) — real mounted control, mouse, Enter/Space, resize, SPA route round trip, detached-node reconciliation, no duplicate/remount on toggle and full reload.

Validation passed: banner unit tests, complete Chromium userscript smoke, 30-case responsive banner matrix, JavaScript syntax, deterministic artwork/session/Eval Bar bundle checks and whitespace checks. Banner asset, typography, positioning, ResizeObserver and backend contracts are unchanged. Independent review found a route/reconciliation test coverage gap; coverage was expanded and rerun successfully. Chromium uses a local fixture, not an authenticated Tampermonkey session.
