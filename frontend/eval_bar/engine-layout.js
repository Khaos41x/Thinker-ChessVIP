(function(root){
  'use strict';
  const css = `
        #krypbot-container .kb-engine-section { margin:0; padding:0; border:0; }
        #krypbot-container .kb-engine-analysis { padding-top:var(--space-2); }
        #krypbot-container .kb-engine-section + .kb-engine-section { margin-top:var(--space-2); padding-top:var(--space-2); border-top:1px solid var(--tc-console-divider); }
        #krypbot-container .kb-engine-section .kb-strength-card,
        #krypbot-container .kb-engine-section .kb-run-delay-card { margin:0 !important; padding:0 !important; border:0 !important; }
        #krypbot-container .kb-engine-section .kb-run-delay-card + .kb-section { border-top:0 !important; }
        #krypbot-container .tc-analysis-selector { margin:0; padding:0; border:0; }
        #krypbot-container .tc-analysis-heading { display:flex; align-items:center; justify-content:space-between; gap:var(--space-2); min-height:16px; font-size:12px; }
        #krypbot-container .tc-analysis-state { display:inline-flex; align-items:center; gap:var(--space-2); white-space:nowrap; font-size:11px; line-height:16px; color:var(--tc-console-muted); }
        #krypbot-container .tc-analysis-selector select { appearance:none; -webkit-appearance:none; box-sizing:border-box; width:100%; height:var(--control-height); min-height:var(--control-height); margin-top:var(--space-2); border:1px solid var(--tc-console-border); border-radius:var(--radius-control); background-color:var(--tc-console-field); color:var(--tc-console-text); padding:0 32px 0 10px; font:inherit; font-size:12px; background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12' fill='none'%3E%3Cpath d='m3 4.5 3 3 3-3' stroke='%23aaaBa5' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E"); background-repeat:no-repeat; background-position:right 10px center; }
        #krypbot-container .tc-analysis-selector select:focus-visible { outline:1px solid var(--tc-console-focus); outline-offset:2px; }
        #krypbot-container .tc-analysis-selector p { margin:var(--space-2) 0 0; font-size:11px; line-height:15px; color:#aaaba5; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        #krypbot-container .tc-analysis-selector button { min-height:28px; margin-top:6px; padding:4px 10px; border:1px solid var(--tc-console-border); border-radius:var(--radius-control); background:transparent; color:var(--tc-console-text); font:inherit; font-size:11px; }
        #krypbot-container .kb-engine-timing .kb-run-delay-controls { grid-template-columns:minmax(0,1fr) 124px; align-items:center; gap:var(--field-gap); }
        #krypbot-container .kb-engine-timing .kb-delay-range { display:grid; grid-template-columns:round(down,calc((100% - 11px - var(--field-gap) - var(--field-gap))/2),1px) 11px minmax(0,1fr); }
        #krypbot-container .kb-engine-timing .kb-num-input { padding-left:var(--space-2); padding-right:var(--space-2); }
        #oi-wrapper { --row-h:40px; --row-height:var(--row-h); }
        #krypbot-container .kb-console-module .kb-section + .kb-section,
        #krypbot-container .kb-console-module.kb-visuals-module .kb-footer { border-top:0 !important; background:linear-gradient(var(--tc-console-divider),var(--tc-console-divider)) top / 100% 1px no-repeat; }
        #oi-wrapper[data-layout-mode="desktop"] #krypbot-container .kb-core-spacing,
        #oi-wrapper[data-layout-mode="desktop"] #krypbot-container .kb-visuals-spacing { margin-top:6px !important; }
        #oi-wrapper[data-layout-mode="desktop"] #krypbot-container .kb-engine-module { min-height:412px; }
        #krypbot-container .kb-engine-timing:has(#auto-delay-section[style*="display: none"]) { display:none; }
        #krypbot-container .kb-engine-strength .kb-slider { display:block; margin:8px 0; }
        #krypbot-container .kb-engine-strength .kb-strength-limits { margin-top:0; }
        @media(min-width:1034px) and (max-width:1086px) {
          #krypbot-container .kb-engine-timing .kb-delay-range { gap:2px; grid-template-columns:round(down,calc((100% - 3px - 2px - 2px)/2),1px) 3px minmax(0,1fr); }
        }
  `;
  function group({core, visuals, engine, autoRating, strength, timing, smartPacing, puzzle, autoMoves}) {
    const section = name => {
      const node = engine.ownerDocument.createElement('div');
      node.className = 'kb-engine-section kb-engine-' + name;
      engine.appendChild(node);
      return node;
    };
    section('analysis');
    const strengthSection = section('strength');
    if (strength) strengthSection.appendChild(strength);
    const timingSection = section('timing');
    if (timing) timingSection.appendChild(timing);
    const togglesSection = section('toggles');
    [autoRating, smartPacing].forEach(node => { if (node) togglesSection.appendChild(node); });
    if (puzzle) engine.appendChild(puzzle);
    autoMoves?.classList.add('kb-core-spacing');
    const rows = Array.from(visuals.children).filter(node => node.classList.contains('kb-section'));
    rows[1]?.classList.add('kb-visuals-spacing');
    visuals.querySelector('.kb-footer')?.classList.add('kb-visuals-spacing');
  }
  root.ThinkerEngineLayout = Object.freeze({css, group});
})(globalThis);
