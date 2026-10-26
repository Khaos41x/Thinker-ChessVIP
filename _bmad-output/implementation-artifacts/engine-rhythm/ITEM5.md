# Item5 — desktop inset

The offset is owned by updateWorkspaceLayout, not the Chess.com header. The wrapper is appended to body, positioned absolutely and centered horizontally. There is no vertical centering. Commit b33d99d (2026-10-21,22:03:21 UTC−03) introduced a112px safe clearance below max(viewport bottom, gameplay document bottom). The wrapper adds12px internal padding, producing124px total before the first panel.

The patch derives the existing desktop/stacked mode first, then uses0 extra clearance on desktop and112px on stacked. Wrapper padding remains12px. At1440x900: safe boundary900, wrapper1012→900, first panel1024→912; therefore the first panel is now12px below the safe boundary instead of124px. This moves the entire console112px upward, preserving its widths and all internal panel geometry. The separate banner block is byte-for-byte unchanged. Stacked1033/800 wrapper geometry is identical to the baseline.

This does not place the console at absolute document y12 or on top of the chessboard. The screenshot's y228 is viewport/scroll dependent and cannot establish a different DOM content boundary by itself. The verified correction removes the console-owned112px excess. Current source release is2026-10-25.3, with deterministic generated version metadata.

24 final browser states passed; divider pixels are actually #32322F for exactly1px, with panel background immediately above and below. No border is merely present in computed CSS but unpainted. See after/painted-dividers.json.
