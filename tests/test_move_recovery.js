const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('script.js', 'utf8');
const start = source.indexOf('  function request_move()');
const end = source.indexOf('  let scheduleThinkerBannerPosition', start);
const initialFen = '8/8/8/8/8/5k2/8/6K1 w - - 0 1';
function fixture() {
  const state = { now:10000, master:true, fen:initialFen, requests:[], arrows:0, moves:0, throwAuth:false };
  const game = { getFEN:()=>state.fen, getTurn:()=>'w', getPlayingAs:()=>'w' };
  const context = { console, Date:{now:()=>state.now}, can_interval:true, moveRetryAfter:0, gameMode:'play', fen:null, checkfen:'', auto_move:false,
    get_cached_game:()=>({board:{},game}), isMasterEnabled:()=>state.master, observeSmartPacingPosition:()=>0,
    isLegacyAutoAdjustEffective:()=>false, chessBot:{elo:1500,time:.5}, moveCache:new Map(), puzzleMoveCache:new Map(),
    sessionControlBridge:{moveSelectionElo:e=>e,isActive:()=>false,effectiveAutoMove:a=>a},
    smartPacingEnabled:false,smartPacingV2Enabled:false,smartPacingV2ShadowEnabled:false,autoDelayMode:'random',
    getSmartPacerClockValues:()=>({}),computeDelayValue:()=>.5,requestEval:()=>{},log:()=>{},cleanCache:()=>{},SERVER_URL:'http://fixture',
    create_div:()=>state.arrows++, auto_move_piece:()=>++state.moves, $:()=>({remove(){}}),
    engineRequestHeaders:()=>{if(state.throwAuth)throw Error('SERVER_AUTH_REQUIRED');return {};},
    handleEngineUnauthorized:r=>r.status===401, GM_xmlhttpRequest:r=>state.requests.push(r),
  };
  vm.createContext(context);
  vm.runInContext(source.slice(start,end), context);
  return {state,context,request:()=>context.request_move()};
}
for(const failure of ['401','503','invalid-json','empty','network','timeout','abort','missing-token']) {
  const {state,context,request}=fixture();
  state.throwAuth=failure==='missing-token';request();
  const pending=state.requests[0];
  if(failure==='network')pending.onerror({status:0});
  else if(failure==='timeout')pending.ontimeout();
  else if(failure==='abort')pending.onabort();
  else if(failure!=='missing-token')pending.onload({status:Number(failure)||200,responseText:failure==='invalid-json'?'broken':'[]'});
  assert.equal(context.checkfen,'',`${failure} latched FEN`);
  assert.equal(context.can_interval,true);
  const count=state.requests.length;request();assert.equal(state.requests.length,count,'retry storm');
  state.throwAuth=false;state.now+=1001;request();
  assert.equal(state.requests.length,count+1,`${failure} never recovered`);
  state.requests.at(-1).onload({status:200,responseText:'["g1h1"]'});
  assert.equal(state.arrows,1);assert.equal(context.can_interval,true);
}
{
  const {state,context,request}=fixture();request();
  state.requests[0].onload({status:200,responseText:'["g1h1"]'});
  assert.equal(state.arrows,1);
  context.auto_move=true;context.checkfen='';request();
  assert.equal(state.moves,1,'cached recommendation could not become Auto Move');
  assert.equal(state.requests.length,1,'unnecessary second engine request');
}
for(const stale of ['fen','master','mode']) {
  const {state,context,request}=fixture();request();
  if(stale==='fen')state.fen=initialFen.replace('0 1','1 1');
  if(stale==='master')state.master=false;
  if(stale==='mode')context.auto_move=true;
  state.requests[0].onload({status:200,responseText:'["g1h1"]'});
  assert.equal(state.arrows,0);assert.equal(state.moves,0);
}
assert.match(source,/auto_move = \$\(this\)\.val\(\) == "1";\s+checkfen = "";/);
async function verifyPlans() {
  for(const status of ['error','missing','reject','terminal']) {
    const {state,context,request}=fixture();let plans=0;
    context.smartPacingV2Enabled=true;
    context.beginSmartPacingV2Observation=()=>({positionRevision:1,observedAtMonoMs:0});
    context.smartPacingV2Runtime={positionRevision:1,fen:initialFen};
    context.requestSmartPacingV2Plan=()=>{plans++;return status==='reject'?Promise.reject(Error('offline')):Promise.resolve({plan:{status:status==='missing'?'ready':status,move:null},budget:{}});};
    request();await new Promise(resolve=>setImmediate(resolve));
    assert.equal(context.can_interval,true);
    state.now+=2000;request();await new Promise(resolve=>setImmediate(resolve));
    assert.equal(plans,status==='terminal'?1:2,`V2 ${status} retry contract`);
  }
  const {state,context,request}=fixture();context.gameMode='puzzle';context.puzzleHint=true;context.puzzleAutoMove=false;
  request();context.puzzleAutoMove=true;
  state.requests[0].onload({status:200,responseText:'["g1h1"]'});
  assert.equal(state.arrows,0);assert.equal(context.checkfen,'');
  assert.match(source,/auto_move = s\.autoMove;\s+checkfen = "";/);
  console.log('Move recovery: 8 failures, backoff, cache execution, stale guards, V2 error/empty/reject/terminal and puzzle transition passed');
}
verifyPlans().catch(error=>{console.error(error);process.exitCode=1;});
