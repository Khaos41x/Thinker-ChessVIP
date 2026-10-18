---
id: SPEC-estimate-directory-and-footer-layout
companions:
  - implementation.md
sources: []
---

> **Canonical contract.** This SPEC and the files in `companions:` are the complete, preservation-validated contract for what to build, test, and validate.

# Elo Record Directory Input and Footer Layout

## Why

The completed 6,760-pair calibration run cannot advance because the estimate CLI treats a Windows directory argument as a file. The current body-mounted Thinker workspace also uses absolute coordinates and can overlap or escape the usable page area.

## Capabilities

- **CAP-1**
  - **intent:** An operator can pass pair-record files, directories, or both to the estimate CLI.
  - **success:** Each directory contributes its immediate `*.json` files in deterministic path order, and the completed 6,760-file directory produces an estimate document with `recordCount: 6760`.

- **CAP-2**
  - **intent:** An operator can use the same record-directory input convention during artifact validation.
  - **success:** The validation CLI expands record directories through the same function and receives the same ordered records as the estimate CLI.

- **CAP-3**
  - **intent:** A player can scroll to the Thinker and Scout panels below the gameplay area without the workspace overlapping the board.
  - **success:** `#oi-wrapper` remains the last direct child of `document.body`, participates in normal flow as a relative flex container, contains both panels, and applies pointer input only to its direct children.

## Constraints

- Pair-directory expansion is non-recursive and includes only immediate files matching `*.json`.
- Expanded paths have deterministic lexical ordering independent of filesystem enumeration order.
- `fit_curve.py` continues to consume one aggregate estimates JSON document.
- The requested footer properties govern `#oi-wrapper`; no runtime code may write `top`, `left`, `bottom`, `max-height`, or `overflow` to that wrapper.
- `#oi-wrapper` remains mounted directly under `document.body`; its direct children retain `pointer-events: auto !important`.
- Existing uncommitted Session Control work must be preserved.
- Verification is hermetic and requires no network or external engine process.

## Non-goals

- Recursively scanning nested result directories.
- Changing estimation mathematics, pair decoding, fit mathematics, Session Control behavior, panel markup, or Scout data behavior.
- Moving the workspace back into the Chess.com grid or sidebar.

## Success signal

The stage-3 pair directory is accepted without `PermissionError`, all 6,760 records are counted, and static/fake-DOM verification proves that the body-mounted wrapper has no absolute viewport coordinates and remains interactive through its child panels.
