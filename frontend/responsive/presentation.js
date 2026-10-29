(function(root){
  'use strict';
  const css = `
    #krypbot-container .kb-engine-module { container-type:inline-size; container-name:tc-engine; }
    #krypbot-container .kb-auto-play-module { container-type:inline-size; container-name:tc-autoplay; }
    #krypbot-container .kb-engine-timing .kb-run-delay-controls { grid-template-columns:minmax(0,1fr) 158px; gap:4px; }
    #krypbot-container .kb-engine-timing .kb-delay-range { grid-template-columns:round(down,calc((100% - 20px)/2),1px) 8px minmax(0,1fr); gap:6px; }
    #krypbot-container .kb-engine-timing .kb-delay-input { grid-template-columns:minmax(0,1fr) 17px; }
    #krypbot-container .kb-engine-timing .kb-delay-unit { width:17px; padding:0 10px 0 0; }
    #krypbot-container .kb-engine-timing .kb-delay-separator { width:8px; line-height:16px; text-align:center; }
    #krypbot-container .kb-engine-timing .kb-run-delay-card .kb-radio-group.kb-timing-mode:has(input[name="delayMode"]) { grid-template-columns:round(down,50%,1px) minmax(0,1fr); }
    #krypbot-container .kb-engine-timing .kb-run-delay-card .kb-radio-group.kb-timing-mode:has(input[name="delayMode"]) label { padding:0 12px; }
    @container tc-engine (width < 310px) {
      #krypbot-container .kb-engine-timing .kb-run-delay-controls { grid-template-columns:minmax(0,1fr); gap:8px; }
    }
    @container tc-autoplay (width < 540px) {
      #krypbot-container .kb-auto-play-module .kb-session-fields,
      #krypbot-container .kb-auto-play-module .kb-session-actions { grid-template-columns:round(down,calc((100% - 8px)/2),1px) minmax(0,1fr); }
      #krypbot-container #kb-session-start { grid-column:1/-1; }
      #krypbot-container #kb-session-stop,
      #krypbot-container .kb-auto-play-module #kb-session-export { grid-column:auto; }
      #krypbot-container .kb-auto-play-module .kb-session-status { grid-template-columns:max-content minmax(0,1fr); }
    }
  `;
  function localPoint(node, left, top) {
    const doc = node.ownerDocument, win = doc.defaultView, parent = node.offsetParent;
    if (!parent || parent === doc.body && win.getComputedStyle(parent).position === 'static') return {left, top};
    const rect = parent.getBoundingClientRect();
    return {left:left - rect.left - win.scrollX - parent.clientLeft + parent.scrollLeft, top:top - rect.top - win.scrollY - parent.clientTop + parent.scrollTop};
  }
  root.ThinkerResponsive = Object.freeze({css, localPoint});
})(globalThis);
