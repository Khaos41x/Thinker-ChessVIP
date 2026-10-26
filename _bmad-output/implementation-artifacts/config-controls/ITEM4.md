# Item4 — availability hint spacing

Before #session-availability.hint inherited margin-top4px from .hint and no bottom margin. Measured gap above4px, below0px. The single targeted rule #session-availability { margin:8px 0; } gives8px above and below. Exact copy,11px font,17px line-height and #B9BAB3 color are unchanged.

Isolated Bot-off panel:1440/1280/1024/768 height256→268px;390 height373→385px, exactly+12px from spacing. Bot-on390 additionally wraps the already-existing duration validation message onto another line because item3 now starts empty, so the combined before/after is373→402px (+29px:12 spacing +17 text wrapping). No message was invented, shortened or hidden. This is documented instead of capping content height.

The source rule changes no console geometry. Full72-state validation,10 all-toggle states, color diff and final screenshots are attached to this commit as delivery evidence. The standalone real5050 Config screenshots are in live-real-server/.
