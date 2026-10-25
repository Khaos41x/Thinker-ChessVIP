(function(root){
  'use strict';
  const controls = ':is(button,input,select,a,[tabindex])';
  const css = `
        #krypbot-container ${controls}:focus,
        #krypbot-container :is(.kb-delay-input,.kb-timing-mode):focus-within,
        #krypbot-container .kb-timing-mode input:focus + label {
          outline:none !important; box-shadow:none !important;
        }
        #krypbot-container[data-focus-input="pointer"] ${controls}:focus {
          border-color:var(--tc-idle-border,var(--tc-console-border)) !important;
        }
        #krypbot-container[data-focus-input="pointer"] .kb-delay-input:focus-within {
          border-color:var(--tc-console-border) !important;
        }
        #krypbot-container[data-focus-input="keyboard"] ${controls}:focus-visible {
          border:1px solid #A0A19B !important; box-sizing:border-box;
        }
        #krypbot-container[data-focus-input="keyboard"] .kb-delay-input:has(input:focus-visible),
        #krypbot-container[data-focus-input="keyboard"] .kb-timing-mode:has(input:focus-visible) {
          border-color:#A0A19B !important;
        }
  `;
  function bind(host) {
    host.addEventListener('pointerdown', event => {
      const control = event.target.closest(controls);
      if (control && host.contains(control) && control !== control.ownerDocument.activeElement) {
        control.style.setProperty('--tc-idle-border', root.getComputedStyle(control).borderColor);
      }
    }, true);
  }
  root.ThinkerFocusFinish = Object.freeze({css, bind});
})(globalThis);
