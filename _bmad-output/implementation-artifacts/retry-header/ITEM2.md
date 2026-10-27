# Item2 — Banner subtitle

Removed the presentation-only Banner status map, small#banner-display-state creation and its row aria-describedby (panel.js). The subtitle was a separate24px .control-detail sibling; it did not control the banner. Existing texts included Disabled, Visible on Chess.com, Hidden by Clean View, Waiting for board/side panel, Not shown on this page, Not enough room(96px minimum), Updating position and Waiting for Chess.com. The server still provides bannerState. The switch retains its original key/role/aria-checked/aria-labelledby and Banner label. Console already had no subtitle and was not edited.

Real Flask/Chromium:10 cases,1440/1280/1024/768/390 with Banner on/off. All Config rows40px; toggle center deviation0. Visuals239→215px, exactly−24px in every case; other controls/colors unchanged. Screenshots and measurements in banner/.

Alignment constraint: Core175+Visuals215+Workspace119+two12px gaps =533px; Engine476px. Residual57px, compared with81px before. Three8px section gaps absorb only24px, leaving33px; row height already at40px maximum. No artificial stretching/tail added. A possible separate approval is moving Clean View into Visuals, removing the one-control Workspace shell: natural column466px,10px shorter than Engine, which can fit two inter-section gaps(8+2). This is a proposal only, not applied.
