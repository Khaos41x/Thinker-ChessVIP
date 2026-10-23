---
title: 'Recover offscreen Banner anchors and align maximum strength defaults'
type: 'bugfix'
created: '2026-10-23'
status: 'done'
route: 'one-shot'
---

# Recover offscreen Banner anchors and align maximum strength defaults

## Intent

**Problem:** A rendered sidebar fully above the viewport was rejected when the cached anchor had been replaced or not observed yet, preventing the enabled Banner from mounting while scrolled below the board. The server's 1500 Elo default also overwrote the userscript's existing 3200 startup default.

**Approach:** Accept vertically offscreen rendered sidebar anchors while retaining hidden-node, size, horizontal visibility, route, overlay geometry and 96px cutoff checks. Align backend, external page placeholder and userscript fallback defaults at 3200, preserving explicit user selections and other settings. Clean View was discussed as an external-only presentation mode; no new hiding behavior was implemented without a direct implementation request.

The added unit reproduction fails on the prior code and passes after the fix. Real Flask plus two Chromium tabs confirm default strength 3200 and Banner recovery after sidebar replacement at scrollY=900, with top and bottom differences both 0px. Existing userscript Chromium regression, six Flask tests, fourteen Session Control suites, Scout, Banner, preferences and board-resolution suites pass. Generated bundle/raster checks pass; script.js is 635304 bytes. Independent scoped review found no concrete regressions. No authenticated Chess.com tab was available, so the user's exact live failure is not claimed as independently confirmed. Unrelated knight changes remain excluded.

## Suggested Review Order

- Sidebar detection separates vertical scrolling from actual invisibility.
  [script.js:5246](../../script.js#L5246)
- Backend and external page agree on the maximum strength default.
  [external_config.py:15](../../core/external_config.py#L15)
  [index.html:21](../../frontend/external_config/index.html#L21)
- Regression starts without a cached sidebar above the viewport.
  [test_banner_visibility.js:157](../../tests/test_banner_visibility.js#L157)
- Browser test replaces the anchor while scrolled and measures both edges.
  [test_external_config_chrome.js:94](../../tests/test_external_config_chrome.js#L94)
