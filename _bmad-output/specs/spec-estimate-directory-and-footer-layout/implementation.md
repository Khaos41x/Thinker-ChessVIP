# Implementation Contract

## Backend

1. Add one record-path expansion function in `tools/elo_calibration/estimate.py`.
2. For each argument in command-line order:
   - if it is a directory, append its immediate `*.json` files sorted by stable path text;
   - otherwise append the path unchanged so existing file and error behavior remains intact.
3. Make `estimate.main()` decode the expanded paths.
4. Make `validate.main()` use the same function for `--records`.
5. Leave `fit_curve.py` unchanged because `--estimates` is a single aggregate document.

## Frontend

Replace only the `#oi-wrapper` rule with these effective properties:

```css
position: relative !important;
width: 100% !important;
display: flex !important;
justify-content: center !important;
align-items: flex-start !important;
flex-wrap: wrap !important;
gap: 20px !important;
padding: 50px 20px !important;
margin-top: 50px !important;
box-sizing: border-box !important;
z-index: 999999 !important;
pointer-events: none !important;
background: #161512 !important;
```

Keep `#oi-wrapper > * { pointer-events: auto !important; }`. Remove `position: absolute`, `top`, `left`, and `width: max-content` from the rule. Simplify `updateWorkspaceLayout()` so it only restores the wrapper as the final direct child of `document.body`; it must not calculate or write coordinates.

## Hermetic verification

- Unit-test expansion of a temporary directory containing JSON and non-JSON files.
- Unit-test deterministic order and mixed file/directory arguments.
- Exercise the estimate CLI against a temporary directory and assert its record count.
- Assert validation imports and uses the shared expansion function.
- Replace the superseded TC159 CSS/layout hash assertions with semantic assertions for the explicitly approved footer rule while retaining `menuHtml` and Session Control preservation checks.
- Run the Elo calibration test suite, `node tests/session_control/run.js`, `python scripts/build_userscript.py --check`, and `git diff --check`.
