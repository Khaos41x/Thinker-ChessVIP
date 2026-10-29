(function(root){
  'use strict';
  const instances = new WeakMap();
  function enhance(select) {
    if (!select) return;
    if (instances.has(select)) return instances.get(select).sync();
    const doc = select.ownerDocument, win = doc.defaultView, parent = select.parentElement;
    if (!win.ResizeObserver || !win.AbortController) return;
    const text = (node,value) => { if (node.textContent !== value) node.textContent = value; };
    const scratch = doc.createElement('span').style;
    const style = (node,key,value) => { scratch[key]=value; const normalized=scratch[key]; if (node.style[key] !== normalized) node.style[key] = normalized; };
    const styles = (node,values) => { for (const [key,value] of Object.entries(values)) style(node,key,value); };
    const attr = (node,key,value) => { if (node.getAttribute(key) !== String(value)) node.setAttribute(key,String(value)); };
    const scope = new win.AbortController();
    const listen = (node,type,handler,options={}) => node.addEventListener(type,handler,{...(typeof options === 'boolean'?{capture:options}:options),signal:scope.signal});
    const button = doc.createElement('button'), menu = doc.createElement('div');
    button.type = 'button'; button.id = select.id + '-picker'; button.className = 'tc-engine-picker';
    button.setAttribute('role','combobox'); button.setAttribute('aria-haspopup','listbox');
    menu.id = select.id + '-options'; menu.className = 'tc-engine-options'; menu.setAttribute('role','listbox');
    attr(button,'aria-controls',menu.id); attr(button,'aria-expanded',false);
    const label = doc.querySelector('label[for="' + select.id + '"]');
    if (label) {
      if (label.id) { attr(button,'aria-labelledby',label.id); attr(menu,'aria-labelledby',label.id); }
      else { attr(button,'aria-label',label.textContent); attr(menu,'aria-label',label.textContent); }
      listen(label,'click',event => { event.preventDefault(); button.focus(); });
    }
    if (select.getAttribute('aria-describedby')) attr(button,'aria-describedby',select.getAttribute('aria-describedby'));
    let open = false, active = -1, signature = '', nodes = [], typed = '', typedAt = 0, restoreOnReady = false;
    let field, border, foreground, neutral, focus, observer, resizeObserver;
    const inputMode = mode => { doc.body.dataset.focusInput=mode; const workspace=select.closest('#krypbot-container'); if(workspace)workspace.dataset.focusInput=mode; style(button,'borderColor',mode==='keyboard'?focus:border); };
    if (win.getComputedStyle(parent).position === 'static') parent.style.position = 'relative';
    parent.append(button); doc.body.append(menu);
    if (typeof menu.showPopover === 'function') menu.setAttribute('popover','manual');
    styles(menu,{position:'fixed',inset:'auto',margin:'0',padding:'0',boxSizing:'border-box',boxShadow:'none',outline:'none',zIndex:'2147483647',overflowX:'hidden',overflowY:'auto',maxHeight:'194px',transition:'none',animation:'none'});
    if (!menu.hasAttribute('popover')) menu.hidden = true;
    select.style.opacity = '0'; select.style.pointerEvents = 'none'; select.tabIndex = -1; attr(select,'aria-hidden',true);
    function mark() {
      for (let i=0;i<nodes.length;i++) {
        attr(nodes[i],'aria-selected',select.options[i].value === select.value);
        style(nodes[i].querySelector('svg'),'visibility',select.options[i].value === select.value?'visible':'hidden');
        style(nodes[i],'backgroundColor',i === active || select.options[i].value === select.value ? neutral : field);
      }
      if (open && nodes[active]) {
        attr(button,'aria-activedescendant',nodes[active].id);
        const top=nodes[active].getBoundingClientRect().top-menu.getBoundingClientRect().top-menu.clientTop+menu.scrollTop;
        const bottom=top+nodes[active].offsetHeight;
        if(top<menu.scrollTop) menu.scrollTop=top;
        else if(bottom>menu.scrollTop+menu.clientHeight) menu.scrollTop=bottom-menu.clientHeight;
      }
      else button.removeAttribute('aria-activedescendant');
    }
    function close(restore=false) {
      if (open) { if (menu.hasAttribute('popover')) { if(menu.isConnected&&menu.matches(':popover-open')) menu.hidePopover(); } else menu.hidden=true; }
      open=false; attr(button,'aria-expanded',false); button.removeAttribute('aria-activedescendant');
      if (restore) button.focus({preventScroll:true});
    }
    function choose(index) {
      const option=select.options[index]; if (!option || option.disabled || select.disabled) return;
      const changed=select.value!==option.value; select.value=option.value; close(true); sync(); restoreOnReady=changed;
      if (changed) { select.dispatchEvent(new win.Event('input',{bubbles:true})); select.dispatchEvent(new win.Event('change',{bubbles:true})); }
    }
    function sync() {
      if (!select.isConnected) { close(); scope.abort(); observer?.disconnect(); resizeObserver?.disconnect(); menu.remove(); button.remove(); instances.delete(select); return; }
      const s=win.getComputedStyle(select), r=select.getBoundingClientRect();
      field=s.backgroundColor; border=s.borderColor; foreground=s.color;
      neutral=s.getPropertyValue('--tc-console-border').trim() || s.getPropertyValue('--border').trim() || border;
      focus=s.getPropertyValue('--tc-console-muted').trim() || s.getPropertyValue('--muted').trim() || foreground;
      const keyboardFocus=button.matches(':focus-visible') && (doc.body.dataset.focusInput==='keyboard'||parent.closest('[data-focus-input="keyboard"]'));
      for (const key of ['fontFamily','fontSize','fontWeight','fontStyle','letterSpacing','color','backgroundColor','backgroundImage','backgroundRepeat','backgroundPosition','backgroundSize','borderWidth','borderStyle','borderRadius','paddingTop','paddingRight','paddingBottom','paddingLeft']) style(button,key,s[key]);
      style(button,'borderColor',keyboardFocus?focus:border);
      styles(button,{position:'absolute',display:'flex',alignItems:'center',textAlign:'left',boxSizing:'border-box',margin:'0',boxShadow:'none',outline:'none',transition:'none',animation:'none',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',cursor:select.disabled?'default':'pointer'});
      style(button,'left',Math.round(select.offsetLeft)+'px'); style(button,'top',Math.round(select.offsetTop)+'px');
      style(button,'width',Math.round(r.width)+'px'); style(button,'height',Math.round(r.height)+'px'); style(button,'minHeight',Math.round(r.height)+'px');
      if (button.disabled !== select.disabled) button.disabled=select.disabled;
      if (!select.disabled && restoreOnReady) { restoreOnReady=false; if(doc.activeElement===doc.body||doc.activeElement===button) button.focus({preventScroll:true}); }
      attr(button,'aria-disabled',select.disabled); text(button,select.selectedOptions[0]?.textContent || '');
      if (button.title !== button.textContent) button.title = button.textContent;
      const next=Array.from(select.options).map(o=>[o.value,o.textContent,o.disabled]).map(value=>JSON.stringify(value)).join('|');
      if (signature!==next) {
        signature=next; nodes=Array.from(select.options).map((option,index)=>{
          const n=doc.createElement('div'); n.id=menu.id+'-'+index; n.setAttribute('role','option'); attr(n,'aria-disabled',option.disabled); n.title=option.textContent;
          const copy=doc.createElement('span');text(copy,option.textContent);styles(copy,{minWidth:'0',overflow:'hidden',textOverflow:'ellipsis'});n.append(copy);
          styles(n,{height:'32px',boxSizing:'border-box',display:'flex',alignItems:'center',padding:'0 12px',font:s.font,color:foreground,whiteSpace:'nowrap',cursor:option.disabled?'default':'pointer',outline:'none',boxShadow:'none',transition:'none',animation:'none'});
          style(n,'justifyContent','space-between');
          const check=doc.createElementNS('http://www.w3.org/2000/svg','svg');check.setAttribute('viewBox','0 0 16 16');check.setAttribute('aria-hidden','true');
          styles(check,{width:'12px',height:'12px',flexShrink:'0',marginLeft:'12px'});
          const path=doc.createElementNS('http://www.w3.org/2000/svg','path');path.setAttribute('d','M3 8l3 3 7-7');path.setAttribute('fill','none');path.setAttribute('stroke','currentColor');path.setAttribute('stroke-width','1.5');check.append(path);n.append(check);
          listen(n,'pointermove',()=>{if(!option.disabled){active=index;mark();}});
          listen(n,'pointerdown',event=>{inputMode('pointer');event.preventDefault();}); listen(n,'click',()=>choose(index)); return n;
        }); menu.replaceChildren(...nodes);
      }
      styles(menu,{backgroundColor:field,color:foreground,border:'1px solid '+border,borderRadius:s.borderRadius,font:s.font});
      if (select.disabled) close(); else if(open) { position(); mark(); }
    }
    function position() {
      const r=button.getBoundingClientRect(), viewport=win.visualViewport;
      const left=viewport?.offsetLeft || 0, top=viewport?.offsetTop || 0;
      const width=viewport?.width || doc.documentElement.clientWidth || win.innerWidth;
      const height=viewport?.height || win.innerHeight;
      if(open&&(r.bottom<=top||r.top>=top+height||r.right<=left||r.left>=left+width)){close();return;}
      const room=Math.max(0,height-16);
      const below=Math.min(room,Math.max(0,top+height-8-r.bottom-4)), above=Math.min(room,Math.max(0,r.top-4-top-8));
      const wanted=Math.min(6,select.options.length)*32+2;
      const down=below>=wanted || below>=above;
      const available=Math.floor(down?below:above), menuHeight=Math.min(wanted,available);
      const menuWidth=Math.min(Math.round(r.width),Math.max(0,Math.floor(width-16)));
      style(menu,'width',menuWidth+'px');
      style(menu,'maxHeight',Math.max(0,menuHeight)+'px');
      style(menu,'left',Math.round(Math.max(left+8,Math.min(r.left,left+width-8-menuWidth)))+'px');
      style(menu,'top',Math.round(Math.max(top+8,Math.min(down?r.bottom+4:r.top-4-menuHeight,top+height-8-menuHeight)))+'px');
    }
    function show() {
      sync(); if (select.disabled || !select.options.length) return;
      if (doc.activeElement!==button) button.focus({preventScroll:true});
      active=Array.from(select.options).findIndex(o=>o.value===select.value&&!o.disabled);
      if(active<0)active=Array.from(select.options).findIndex(o=>!o.disabled);
      if(active<0)return;
      position();
      if (menu.hasAttribute('popover')) menu.showPopover(); else menu.hidden=false;
      open=true;attr(button,'aria-expanded',true);mark();
    }
    listen(button,'click',()=>open?close():show());
    listen(button,'pointerdown',()=>inputMode('pointer'));
    listen(button,'focus',()=>{if(button.matches(':focus-visible')&&(doc.body.dataset.focusInput==='keyboard'||parent.closest('[data-focus-input="keyboard"]')))style(button,'borderColor',focus);});
    listen(button,'blur',()=>{style(button,'borderColor',border);if(!menu.contains(doc.activeElement))close();});
    listen(button,'keydown',event=>{
      const key=event.key;
      if(['Tab','Escape','Enter',' ','ArrowDown','ArrowUp','Home','End'].includes(key)||key.length===1)inputMode('keyboard');
      if(key==='Tab'){close();return;}
      if(key==='Escape'){if(open){event.preventDefault();event.stopPropagation();close(true);}return;}
      if(['Enter',' ','ArrowDown','ArrowUp','Home','End'].includes(key)){
        event.preventDefault();event.stopPropagation();
        if(!open){show();if(key==='Enter'||key===' '||key==='ArrowDown')return;}
        else if(key==='Enter'||key===' '){choose(active);return;}
        let next=key==='Home'?0:key==='End'?nodes.length-1:active+(key==='ArrowUp'?-1:1);
        const step=key==='ArrowUp'||key==='End'?-1:1;
        while(next>=0&&next<nodes.length&&select.options[next].disabled)next+=step;
        if(next>=0&&next<nodes.length){active=next;mark();}return;
      }
      if(key.length===1&&!event.ctrlKey&&!event.altKey&&!event.metaKey){
        event.preventDefault();event.stopPropagation();if(!open)show();
        const now=Date.now();typed=now-typedAt>700?key:typed+key;typedAt=now;
        const repeated=typed.split('').every(c=>c===typed[0]), search=(repeated?key:typed).toLowerCase();
        for(let offset=1;offset<=nodes.length;offset++){const i=(active+offset)%nodes.length;if(!select.options[i].disabled&&select.options[i].textContent.toLowerCase().startsWith(search)){active=i;mark();break;}}
      }
    });
    listen(doc,'pointerdown',event=>{if(!button.contains(event.target)&&!menu.contains(event.target))close();},true);
    listen(win,'resize',sync); listen(win,'scroll',event=>{if(open&&!menu.contains(event.target)){const r=button.getBoundingClientRect();if(r.bottom<=0||r.top>=win.innerHeight)close();else position();}},true);
    if(win.visualViewport){listen(win.visualViewport,'resize',sync);listen(win.visualViewport,'scroll',()=>{if(open)position();});}
    observer = new win.MutationObserver(sync); observer.observe(select,{childList:true,subtree:true,attributes:true,attributeFilter:['disabled']});
    resizeObserver = new win.ResizeObserver(sync); resizeObserver.observe(select);
    listen(select,'change',sync);
    instances.set(select,{sync,close});sync();
  }
  root.ThinkerEnginePicker=Object.freeze({enhance});
})(globalThis);
