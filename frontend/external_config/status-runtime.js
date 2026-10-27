(function(root){
  'use strict';
  const text = (node, value) => { if (node && node.textContent !== String(value)) node.textContent = String(value); };
  const prop = (node, key, value) => { if (node && node[key] !== value) node[key] = value; };
  const attr = (node, key, value) => { if (node && node.getAttribute(key) !== String(value)) node.setAttribute(key, String(value)); };
  function reserve(node, values, extra = 0) {
    if (!node) return;
    const context = node.ownerDocument.createElement('canvas').getContext('2d');
    context.font = node.ownerDocument.defaultView.getComputedStyle(node).font;
    node.style.minWidth = Math.ceil(Math.max(...values.map(value=>context.measureText(value).width)) + extra) + 'px';
  }
  function health({now = Date.now, interval = 2000} = {}) {
    let failures = 0, lastSuccess = now(), nextAt = 0;
    return Object.freeze({
      success() { failures = 0; lastSuccess = now(); nextAt = now() + interval; },
      failure() { failures++; nextAt = now() + Math.min(30000, interval * 2 ** Math.min(failures - 1, 5)); return failures >= 3 && now() - lastSuccess >= 6000; },
      reset() { failures = 0; lastSuccess = now(); nextAt = 0; },
      due() { return now() >= nextAt - (failures ? 0 : Math.min(500, interval / 4)); },
      delay() { return Math.max(0, nextAt - now()); },
      snapshot() { return {failures, lastSuccess, nextAt}; }
    });
  }
  root.ThinkerStatus = Object.freeze({text, prop, attr, health, reserve});
})(globalThis);
