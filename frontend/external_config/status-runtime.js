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
  function interaction() {
    let started = null, returnFocus = false, bound = null, status = null, live = null, animation = null;
    function bind(region, indicator, message) {
      if (!region || bound === region) return;
      bound = region; status = indicator;
      attr(status, 'aria-live', 'off');
      attr(message, 'aria-live', 'off');
      live = region.ownerDocument.createElement('span');
      live.setAttribute('aria-live', 'polite');
      live.setAttribute('aria-atomic', 'true');
      live.style.cssText = 'position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap;border:0';
      region.append(live);
      attr(region, 'aria-busy', started !== null);
    }
    return Object.freeze({
      bind,
      active() { return started !== null; },
      begin(button, select) {
        if (started !== null) return false;
        started = performance.now();
        const active = (button || select)?.ownerDocument.activeElement;
        returnFocus = Boolean(active && (active === button || active === select || active.id === select?.id + '-picker'));
        animation?.cancel(); animation = null;
        text(live, '');
        attr(bound, 'aria-busy', true);
        return true;
      },
      async wait() {
        while (started !== null && performance.now() - started < 700) await new Promise(resolve => setTimeout(resolve, Math.max(1, Math.ceil(700 - (performance.now() - started)))));
      },
      finish(render, button, select) {
        if (started === null) { render(); return; }
        started = null;
        render();
        attr(bound, 'aria-busy', false);
        text(live, status?.textContent || '');
        if (status?.animate && !status.ownerDocument.defaultView.matchMedia('(prefers-reduced-motion: reduce)').matches) animation = status.animate([{opacity:0},{opacity:1}], {duration:180, easing:'ease-out'});
        if (returnFocus && (!bound || [button,select,bound.ownerDocument.body].includes(bound.ownerDocument.activeElement) || bound.ownerDocument.activeElement.id === select?.id + '-picker')) queueMicrotask(() => {
          const target = button && !button.hidden && !button.disabled ? button : select?.ownerDocument.getElementById(select.id + '-picker') || select;
          target?.focus({preventScroll:true});
        });
        returnFocus = false;
      }
    });
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
  root.ThinkerStatus = Object.freeze({text, prop, attr, health, reserve, interaction});
})(globalThis);
