# Item3 — segmented fit; no unauthorized compaction

| Viewport | Numeric input each | Segmented total | Option widths | Horizontal padding | Immediate text |
|---|---:|---:|---:|---:|---:|
|1086|64px|158px|78/78px|12px|53.55px|
|1280|54px|124px|61/61px|0px|53.55px|
|1440|54px|124px|61/61px|0px|53.55px|
|1920|54px|124px|61/61px|0px|53.55px|

The desktop console caps its wrapper at1034px, so the Engine content stays319px wide at all four requested viewports. Random and Immediate have identical geometry. Current selected background is #3A3A36 and unselected #252523 when Auto Moves is off. With Auto Moves on the existing active selected token is used. No new color is needed; no color changed in this item.

Minimum equal option width is ceil(53.55 +24) =78px. Including borders the segmented needs158px,34px more than its current124px. Keeping all other wide geometry yields numeric inputs37px instead of54px, leaving17px after their existing20px padding: a saved four-character decimal would clip. This does not increase height, but fails usability. It has not been applied.

Options requiring approval: (A) extend the already tested1086 compaction to desktop widths; it fits64px numeric inputs and158px segmented on one line, unchanged height; (B) reallocate34px of grid width to Engine from another column, which affects other panels. A is the smaller change, but the request explicitly limits compaction to1086. No own-row segmented, smaller text, overflow or altered wider input geometry was introduced. The1086 state already satisfies equal widths and12px padding.
