const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const calls=[];
const context={
  setThinkerPageScrollbarHidden:value=>calls.push(['scrollbar',value]),
  clearInterval:id=>calls.push(['timer',id]),
  cancelAnimationFrame:id=>calls.push(['frame',id]),
  thinkerBannerFrame:1,thinkerWorkspaceFrame:2,thinkerUiReconcileTimer:3,thinkerUrlMonitorTimer:4,
  thinkerBannerResizeObserver:{disconnect:()=>calls.push(['resize-disconnect'])},
  thinkerBannerLayoutObserver:{disconnect:()=>calls.push(['mutation-disconnect'])},
  thinkerObservedBannerSidebar:{},thinkerResizeHandler:()=>{},thinkerKeyboardFocusHandler:()=>{},
  thinkerUiBound:true,_menuReady:true,
  window:{removeEventListener:(name)=>calls.push(['window-remove',name])},
  document:{removeEventListener:name=>calls.push(['document-remove',name])}
};
vm.createContext(context);
vm.runInContext(fs.readFileSync('frontend/responsive/ui-cleanup.js','utf8')+`
thinkerLayoutDisposer=()=>globalThis.disposed=true;
thinkerBannerLoadTarget={removeEventListener:()=>globalThis.loadRemoved=true};thinkerBannerLoadHandler=()=>{};
cleanupThinkerUiLifecycle();
globalThis.schedulesReset=typeof scheduleThinkerWorkspaceLayout==='function'&&typeof scheduleThinkerBannerPosition==='function';
`,context);
assert.equal(context.disposed,true);assert.equal(context.loadRemoved,true);
assert.equal(context.thinkerUiReconcileTimer,null);assert.equal(context.thinkerUrlMonitorTimer,null);
assert.equal(context.thinkerBannerResizeObserver,null);assert.equal(context.thinkerBannerLayoutObserver,null);
assert.equal(context.thinkerUiBound,false);assert.equal(context._menuReady,false);assert.equal(context.schedulesReset,true);
assert(calls.some(([type,id])=>type==='timer'&&id===3));
assert(calls.some(([type,name])=>type==='window-remove'&&name==='resize'));
vm.runInContext('cleanupThinkerUiLifecycle()',context);
assert.equal(calls.filter(([type,id])=>type==='timer'&&id===3).length,1);
console.log('PASS layout teardown cancels reconcile timer/RAFs, disposes observers/listeners/load callback and is idempotent');

require('../frontend/responsive/presentation.js');
const parent={clientLeft:2,clientTop:3,scrollLeft:4,scrollTop:5,getBoundingClientRect:()=>({left:30,top:100})};
const node={offsetParent:parent,ownerDocument:{body:parent,defaultView:{scrollX:10,scrollY:20,getComputedStyle:()=>({position:'relative'})}}};
assert.deepEqual(globalThis.ThinkerResponsive.localPoint(node,200,400),{left:162,top:282});
node.ownerDocument.defaultView.getComputedStyle=()=>({position:'static'});
assert.deepEqual(globalThis.ThinkerResponsive.localPoint(node,200,400),{left:200,top:400});
console.log('PASS document coordinates convert into positioned parent coordinates without scaling');
