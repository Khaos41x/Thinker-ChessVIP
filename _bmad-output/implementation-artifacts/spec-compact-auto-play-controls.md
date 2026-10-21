---
title: 'Compact Auto Play controls'
type: 'refactor'
created: '2026-10-21'
status: 'done'
route: 'one-shot'
---

# Compact Auto Play controls

## Intent

**Problem:** The premium panel became oversized, “Session Control” no longer described its user-facing purpose, and Run Delay was incorrectly hidden inside that module's advanced settings.

**Approach:** Compact both cards, present the module as Auto Play, and place Run Delay directly beneath Auto Moves while preserving all internal Session Control architecture and behavior.

## Suggested Review Order

**Information architecture**

- Start with Run Delay beside the feature it directly configures.
  [`script.js:5928`](../../script.js#L5928)

- Review the semantic Auto Play heading and isolated advanced settings.
  [`script.js:6005`](../../script.js#L6005)

**Compact visual system**

- Inspect Run Delay sizing, targets, and overflow-safe compact layout.
  [`script.js:5754`](../../script.js#L5754)

- Confirm the 292px cards and 640px responsive breakpoint.
  [`script.js:5884`](../../script.js#L5884)

**Regression protection**

- Chromium validates placement, persistence, accessibility, overflow, and breakpoint boundaries.
  [`test_userscript_chrome.js:185`](../../tests/test_userscript_chrome.js#L185)

- Hermetic tests lock the rename and DOM ordering contract.
  [`ui.test.js:250`](../../tests/session_control/ui.test.js#L250)
