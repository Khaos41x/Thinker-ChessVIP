(function(root){
  'use strict';
  const css = `
        #oi-zone2.tc-scout-populated .tc-scout-subtitle,
        #oi-zone2.tc-scout-populated .tc-scout-record,
        #oi-zone2.tc-scout-populated .tc-scout-section-title,
        #oi-zone2.tc-scout-populated .tc-scout-stat-copy b,
        #oi-zone2.tc-scout-populated .tc-scout-stat-copy small,
        #oi-zone2.tc-scout-populated .tc-scout-stat-value b,
        #oi-zone2.tc-scout-populated .tc-scout-stat-value small,
        #oi-zone2.tc-scout-populated .tc-scout-opening-name,
        #oi-zone2.tc-scout-populated .tc-scout-opening-count b,
        #oi-zone2.tc-scout-populated .tc-scout-opening-count small,
        #oi-zone2.tc-scout-populated .tc-scout-section > div[style] {
          font-size:11px !important; line-height:16px !important;
        }
        #oi-zone2.tc-scout-populated .tc-scout-section-title {
          padding:0 0 var(--space-2); font-weight:600; letter-spacing:.08em;
        }
        #oi-zone2.tc-scout-populated .tc-scout-section { padding:var(--space-2) 0; }
        #oi-zone2.tc-scout-populated .tc-scout-stat-row {
          grid-template-columns:10px minmax(0,1fr) 72px; align-items:start;
          column-gap:var(--space-2); padding:var(--space-1) 0;
        }
        #oi-zone2.tc-scout-populated .tc-scout-stat-copy { gap:var(--space-1); }
        #oi-zone2.tc-scout-populated .tc-scout-stat-value {
          flex-direction:row; align-items:baseline; align-self:start; justify-content:flex-end;
          gap:var(--space-1); min-width:0; width:72px; line-height:16px;
        }
        #oi-zone2.tc-scout-populated .tc-scout-color-chip,
        #oi-zone2.tc-scout-populated .tc-scout-speed-icon {
          width:10px; height:10px; border-radius:2px; margin-top:3px;
          pointer-events:none; flex:none;
        }
        #oi-zone2.tc-scout-populated .tc-scout-opening-row {
          grid-template-columns:10px minmax(0,1fr) 56px; align-items:start;
          column-gap:var(--space-2); padding:var(--space-1) 0;
        }
        #oi-zone2.tc-scout-populated .tc-scout-opening-name {
          min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;
        }
        #oi-zone2.tc-scout-populated .tc-scout-opening-count {
          min-width:0; width:56px; align-items:flex-end; font-variant-numeric:tabular-nums;
        }
        #oi-zone2.tc-scout-populated .tc-scout-opening-count small { color:#A0A19B !important; }
  `;
  function decorate(panel) {
    panel.classList.add('tc-scout-populated');
    for (const marker of panel.querySelectorAll('.tc-scout-color-chip,.tc-scout-speed-icon')) {
      marker.setAttribute('aria-hidden', 'true');
    }
  }
  root.ThinkerScoutFinish = Object.freeze({css, decorate});
})(globalThis);
