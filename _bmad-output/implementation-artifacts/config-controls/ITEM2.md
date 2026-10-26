# Item2 — delay separator

Before: Config separator column3px, glyph6.5px, first-field border→glyph2px and glyph→second-field border−1.5px (actual overlap). The same undersized column affects console1086. Wider console uses11px column and8px grid gaps; measured glyph clearance10.25px on each side already passes.

Config now uses a fixed8px grid column, gap6px on both sides, centered text and integer16px line box. The glyph clearances are6.75px/6.75px; no colors/fonts or control/panel heights change. Inputs differ by at most1px distributed by floor/minmax. Config390 numeric inputs are60/61px (before67/67); labels71/72px. At1440 numeric inputs are100/100px; no input is positioned absolutely or with a negative margin.

Console1086 is NOT changed: its319px Engine content is already exactly occupied by75+75px field labels,7px separator/gaps,4px row gap and158px segmented. New20px separator/gaps needs13px more; numeric inputs64/64 become57/58px. To retain64px would require13px more Engine width, shrinking the segmented (violating its current padding), or a new row (forbidden). None is silently applied. Current and option screenshots are delivered separately. This is the remaining decision, not a claim that1086 meets6px clearance.

