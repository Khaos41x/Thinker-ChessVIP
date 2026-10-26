# Item1 — baseline measured before production edits

24 states measured:1086/1280/1440/1920 and stacked1033/800, Smart Pacing off/on, Random/Immediate. Full positions, content bounds and computed CSS are in before/measurements.json; every junction is in before/sections.csv. Screenshot filenames identify viewport/mode/pacing.

At1440, viewport900, document scroll0: wrapper y1012, panel y1024. Analysis1062–1166, Strength1166–1234, Timing1234–1320, Toggles1320–1405. Dividers are present at1166/1234/1320, all1px #32322F. Each junction has0px before and4px after; content gap5px. Random and Immediate have identical geometry. Smart Pacing hides Timing; toggles follow Strength with the same0/4 asymmetry.

The current repository does not reproduce a missing Strength/Timing divider or a21px content gap. That screenshot may represent a different installed revision; no authenticated Tampermonkey version is claimed. The measurements use the actual current userscript in isolated Chromium with real Flask configuration and registry, not the authenticated Chess.com DOM.

Core171, Visuals211, Engine394, AutoPlay252; standard tails12px; Engine Smart Pacing on tail98px accepted by previous instructions. Visuals/Engine and Scout/AutoPlay bottoms match exactly.
