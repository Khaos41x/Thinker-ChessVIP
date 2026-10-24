const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('script.js','utf8');
const harness=fs.readFileSync('tests/test_move_recovery.js','utf8');
const shared={require,console};vm.createContext(shared);
vm.runInContext(harness.slice(0,harness.indexOf('for (const turnApi'))+';globalThis.makeFixture=fixture;',shared);
const executionSource=source.slice(source.indexOf('  const auto_move_piece = function'),source.indexOf('  const SHAFT_W =',source.indexOf('  const auto_move_piece = function')));
const W='8/8/8/8/8/5k2/8/6K1 w - - 0 1';
const B=W.replace(' w ',' b ');
function fixture(){
  const value=shared.makeFixture(),{state,context,game}=value;
  const board={isConnected:true,game};
  state.side='white';state.turn='white';state.executed=[];state.tasks=[];
  state.throwSide=false;state.mode='play';
  game.getPlayingAs=()=>{if(state.throwSide)throw Error('API unavailable');return state.side;};
  game.getTurn=()=>state.turn;
  game.getLegalMoves=()=>[{from:'g1',to:'h1'},{from:'f3',to:'e3'}];
  game.move=move=>{state.executed.push(JSON.parse(JSON.stringify(move)));state.fen=state.fen.replace(/ ([wb]) /,(_,side)=>side==='w'?' b ':' w ');state.turn=state.fen.split(' ')[1];};
  context.get_cached_game=()=>({board,game});context.resolveThinkerBoardGame=()=>board.game;
  context.auto_move=true;
  context.smartPacer={cancel(){for(const task of state.tasks)if(!task.settled){task.settled=true;task.resolve(false);}},schedule(effect){let resolve;const promise=new Promise(done=>resolve=done);const task={effect,resolve,promise,settled:false};state.tasks.push(task);return {promise};}};
  context.deriveSmartPacerPhase=()=> 'middlegame';
  vm.runInContext(executionSource+';globalThis.executeSubject=auto_move_piece;',context);
  value.board=board;
  value.reply=(move='g1h1')=>state.requests.at(-1).onload({status:200,responseText:JSON.stringify([move])});
  value.run=async()=>{const task=state.tasks.findLast(item=>!item.settled);if(!task)return false;task.settled=true;const outcome=await task.effect();task.resolve(outcome);await Promise.resolve();return outcome;};
  return value;
}
async function main(){
  let checks=0;
  for(const side of ['w','white','WHITE',1,'1','b','black','BLACK',2,'2']){
    const f=fixture(),black=['b','black','BLACK',2,'2'].includes(side);
    f.state.side=side;f.state.turn=black?'black':'white';f.state.fen=black?B:W;
    f.request();assert.equal(f.state.requests.length,1);f.reply(black?'f3e3':'g1h1');assert.equal(await f.run(),true);assert.equal(f.state.executed.length,1);checks++;
  }
  for(const side of [null,undefined,0,3,'',{},'constructor','spectator']){
    const f=fixture();f.state.side=side;f.context.window.location.href+='?color=white';f.board.orientation='white';f.request();assert.equal(f.state.requests.length,0);assert.equal(f.context.thinkerMoveDiagnostic.stage,'player-identity-unavailable');checks++;
  }
  for(const side of [1,'1',2,'2']){
    const f=fixture(),white=side===1||side==='1';f.state.side=side;f.state.fen=white?B:W;f.state.turn=white?'black':'white';
    f.request();assert.equal(f.state.requests.length,0);assert.equal(f.state.executed.length,0);checks++;
  }
  for(const kind of ['missing-api','throwing-api','opponent-turn','api-fen-conflict','invalid-fen']){
    const f=fixture();
    if(kind==='missing-api')delete f.game.getPlayingAs;
    if(kind==='throwing-api')f.state.throwSide=true;
    if(kind==='opponent-turn'){f.state.fen=B;f.state.turn='black';}
    if(kind==='api-fen-conflict')f.state.turn='black';
    if(kind==='invalid-fen')f.state.fen='not-a-position';
    f.request();assert.equal(f.state.requests.length,0,kind);assert.equal(f.state.executed.length,0);checks++;
  }
  for(const point of ['response','timer','dispatch'])for(const mutation of ['side-missing','side-changed','turn-changed','fen-changed','game-replaced','board-detached','route-changed','mode-changed','disabled']){
    const f=fixture();let effect;
    if(point==='dispatch')f.context.sessionControlBridge={...f.context.sessionControlBridge,isActive:()=>true,captureMove:()=>({gate:{allowed:true}}),movePrecheck:()=>true,executeMove:(_,callback)=>{effect=callback;return Promise.resolve(false);}};
    if(point==='dispatch'){
      f.context.smartPacingV2Enabled=false;
      f.context.beginSmartPacingV2Observation=()=>null;
    }
    f.request();assert.equal(f.state.requests.length,1);
    if(point!=='response')f.reply();
    if(point==='dispatch')await f.run();
    if(mutation==='side-missing')f.state.side=null;
    if(mutation==='side-changed')f.state.side='black';
    if(mutation==='turn-changed')f.state.turn='black';
    if(mutation==='fen-changed'){f.state.fen=B;f.state.turn='black';}
    if(mutation==='game-replaced')f.board.game={...f.game};
    if(mutation==='board-detached')f.board.isConnected=false;
    if(mutation==='route-changed')f.context.window.location.href='https://www.chess.com/game/other';
    if(mutation==='mode-changed')f.context.gameMode='puzzle';
    if(mutation==='disabled')f.state.master=false;
    if(point==='response')f.reply();else if(point==='timer')await f.run();else {assert(effect);assert.equal(effect(),false);}
    assert.equal(f.state.executed.length,0,`${point}: ${mutation}`);checks++;
  }
  {
    const f=fixture();f.context.autoDelayMode='max';
    const result=f.context.executeSubject('f3','e3',f.board,0,{forceImmediate:true});
    assert.equal(result,false);assert.equal(f.state.executed.length,0);checks++;
  }
  {
    const f=fixture();delete f.game.getTurn;f.request();f.reply();await f.run();assert.equal(f.state.executed.length,1);checks++;
  }
  {
    const f=fixture();f.context.gameMode='puzzle';f.context.puzzleHint=false;f.context.puzzleAutoMove=true;f.state.side=null;f.context.autoDelayMode='max';f.request();f.reply();assert.equal(f.state.executed.length,1);checks++;
  }
  {
    const f=fixture();f.context.moveCache.set(W+'_1500','g1h1');f.request();assert.equal(f.state.requests.length,0);f.state.side=null;await f.run();assert.equal(f.state.executed.length,0);checks++;
  }
  {
    const f=fixture();f.state.side=null;f.request();assert.equal(f.state.requests.length,0);f.state.side=1;f.request();f.reply();await f.run();assert.equal(f.state.executed.length,1);checks++;
  }
  {
    const f=fixture();f.context.auto_move=false;f.request();f.reply();assert.equal(f.state.arrows,1);
    f.state.side=null;f.request();assert.equal(f.context.checkfen,'');
    f.state.side=1;f.request();assert.equal(f.state.arrows,2,'Cached recommendation must recover when identity is restored');
    assert.equal(f.state.requests.length,1,'Recovery must reuse the cached recommendation');checks++;
  }
  for(const mutation of ['side-missing','opponent-turn','game-replaced']){
    const f=fixture();let resolve;
    f.context.smartPacingV2Enabled=true;
    f.context.beginSmartPacingV2Observation=()=>({positionRevision:1,observedAtMonoMs:0});
    f.context.smartPacingV2Runtime={positionRevision:1,fen:W};
    f.context.requestSmartPacingV2Plan=()=>new Promise(done=>resolve=done);
    f.context.decideSmartPacingV2=()=>({});f.context.commitSmartPacingV2Outcome=()=>{};
    f.request();
    if(mutation==='side-missing')f.state.side=null;
    if(mutation==='opponent-turn'){f.state.fen=B;f.state.turn='black';}
    if(mutation==='game-replaced')f.board.game={...f.game};
    resolve({plan:{status:'complete',move:'g1h1'},budget:{}});
    await new Promise(done=>setImmediate(done));await f.run();
    assert.equal(f.state.executed.length,0,`V2 ${mutation}`);checks++;
  }
  {
    const f=fixture();let resolve;
    f.context.smartPacingEnabled=true;f.context.isSmartPacerTimeTrouble=()=>false;
    const analysis=new Promise(done=>resolve=done);
    f.context.requestSmartPacingAnalysis=()=>analysis;
    f.request();f.reply();f.state.side=null;resolve({});
    await new Promise(done=>setImmediate(done));
    assert.equal(f.context.checkfen,'','Rejected late analysis must not latch the position');
    assert.equal(f.state.executed.length,0);
    f.state.side=1;f.state.now+=1001;f.request();
    await new Promise(done=>setImmediate(done));await f.run();
    assert.equal(f.state.executed.length,1,'Restored identity must recover after late analysis rejection');checks++;
  }
  assert(!source.includes('if (!side) side = turn;'));
  console.log(`PASS move authority: ${checks} cases, numeric/string sides, fail-closed identity, source ownership, response/timer/dispatch races, cache, recovery and puzzles`);
}
if(require.main===module)main().catch(error=>{console.error(error);process.exitCode=1;});
module.exports={fixture,main,executionSource};
