const assert = require('node:assert/strict');
const { createHash, webcrypto } = require('node:crypto');
const { createSessionGoalGuard } = require('../frontend/rating_tracker/session-goal');

const hash = name => createHash('sha256').update(`chess.com:${name}`).digest('hex');
async function until(test) { const end=Date.now()+2000;while(!test()){if(Date.now()>end)throw new Error('Timed out');await new Promise(resolve=>setImmediate(resolve));} }
function fixture({ storage, phase = 'QUEUEING' } = {}) {
  let session = { sessionId:'a'.repeat(32),accountKey:hash('alice'),phase,activationContext:{pool:'chesscom-live-blitz-v1'} };
  let username = 'alice';
  let role = 'LEADER';
  let time = 10000;
  let stopCount = 0;
  let response = { state:'tracking',target:2200,confirmedRating:1900,currentRating:1900,eligible:true,reached:false };
  let pending = null;
  let failure = null;
  let stopFailure = false;
  const requests = [];
  const guard = createSessionGoalGuard({ storage,crypto:webcrypto,getSession:()=>session,getUsername:()=>username,getRole:()=>role,now:()=>time,
    setTimer:()=>0,clearTimer:()=>{},
    transport:{request:async (_,options)=>{
      requests.push(options.body);
      if (pending) await pending;
      if (failure) throw new Error(failure);
      return {schemaVersion:1,...options.body,...response};
    }},
    stop:async()=>{stopCount++;if(stopFailure)throw new Error('LEASE_CONTENDED');session={...session,phase:'COMPLETED'};return{allowed:true};},
  });
  return { guard,requests,get session(){return session;},set session(value){session=value;},set username(value){username=value;},set role(value){role=value;},set response(value){response=value;},get response(){return response;},get stops(){return stopCount;},set time(value){time=value;},set pending(value){pending=value;},set failure(value){failure=value;},set stopFailure(value){stopFailure=value;} };
}
(async()=>{
  const x=fixture();
  try {
    assert.equal(x.guard.blocksQueue(),true);
    await x.guard.refresh();assert.equal(x.guard.blocksQueue(),false);
    assert.equal(x.requests[0].timeClass,'blitz');assert.equal(x.requests[0].username,'alice');
    x.guard.completedGame({accountKey:hash('bob'),canonicalPlatformGameId:'100'});assert.equal(x.guard.blocksQueue(),false);
    x.guard.completedGame({accountKey:hash('alice'),canonicalPlatformGameId:'100'});assert.equal(x.guard.blocksQueue(),true);
    await until(()=>x.requests.some(r=>r.completedGameUrl));
    assert(x.requests.some(r=>r.completedGameUrl==='https://www.chess.com/game/live/100'));
    const hintCount=x.requests.filter(r=>r.completedGameUrl).length;
    x.guard.completedGame({accountKey:hash('alice'),canonicalPlatformGameId:'100'});await x.guard.refresh();
    assert.equal(x.requests.filter(r=>r.completedGameUrl).length,hintCount);
    x.response={...x.response,state:'awaiting-rating',eligible:false,reached:true,confirmedRating:2300};
    await x.guard.refresh();assert.equal(x.stops,0);assert.equal(x.guard.blocksQueue(),true);
    x.response={...x.response,state:'reached',eligible:true,reached:true,confirmedRating:2300};x.role='FOLLOWER';
    await x.guard.refresh();assert.equal(x.stops,0);
    x.role='LEADER';x.stopFailure=true;await x.guard.refresh();assert.equal(x.guard.snapshot().state,'error');
    x.stopFailure=false;await x.guard.refresh();assert.equal(x.stops,2);assert.equal(x.session.phase,'COMPLETED');assert.equal(x.guard.blocksQueue(),true);
    await x.guard.refresh();assert.equal(x.stops,2);
    x.session={...x.session,sessionId:'b'.repeat(32),phase:'QUEUEING'};x.response={state:'disabled',target:null,eligible:false,reached:false};
    await x.guard.refresh();assert.equal(x.guard.blocksQueue(),false);
    x.guard.completedGame({accountKey:hash('alice'),canonicalPlatformGameId:'101'});assert.equal(x.guard.blocksQueue(),false);
    x.time=18000;assert.equal(x.guard.blocksQueue(),false);
    x.failure='offline';await x.guard.refresh();assert.equal(x.guard.blocksQueue(),false);assert.equal(x.guard.snapshot().state,'disabled');
    x.failure=null;await x.guard.refresh();assert.equal(x.guard.blocksQueue(),false);
  } finally {x.guard.destroy();}
  const y=fixture();
  try {
    let release;
    y.pending=new Promise(resolve=>{release=resolve;});const first=y.guard.refresh();
    await until(()=>y.requests.length>0);
    y.session={...y.session,sessionId:'c'.repeat(32)};y.guard.blocksQueue();
    y.response={state:'reached',target:2200,eligible:true,reached:true,confirmedRating:2300};release();await first;
    assert.equal(y.stops,0,'An old session result cannot stop a new session');
    y.pending=null;y.username='bob';await y.guard.refresh();assert.equal(y.guard.snapshot().error,'RATING_ACCOUNT_MISMATCH');assert.equal(y.stops,0);
    y.username='alice';y.session={...y.session,activationContext:{pool:'unknown'}};await y.guard.refresh();assert.equal(y.guard.snapshot().error,'RATING_CONTEXT_UNAVAILABLE');
  } finally {y.guard.destroy();}
  const saved = new Map(); const storage={getItem:key=>saved.get(key),setItem:(key,value)=>saved.set(key,value)};
  const a=fixture({storage});
  try {a.response={state:'reached',target:2200,confirmedRating:2300,currentRating:2300,eligible:true,reached:true};await a.guard.refresh();assert.equal(a.stops,1);}finally{a.guard.destroy();}
  const restored=fixture({storage,phase:'COMPLETED'});
  try {
    assert.equal(restored.guard.blocksQueue(),true,'A restored reached session never falls through to legacy queue');
    restored.response={state:'reached',target:2200,confirmedRating:2300,currentRating:2300,eligible:false,reached:true};
    await restored.guard.refresh();assert.equal(restored.guard.blocksQueue(),true);assert.equal(restored.requests[0].active,false);assert.equal(restored.stops,0);
  }finally{restored.guard.destroy();}
  const ending=fixture();
  try {
    let release;ending.pending=new Promise(resolve=>{release=resolve;});const pending=ending.guard.refresh();
    await until(()=>ending.requests.length>0);ending.session={...ending.session,phase:'COMPLETED'};release();await pending;
    ending.pending=null;await ending.guard.refresh();assert.equal(ending.requests.at(-1).active,false,'Completion while a request is in flight still retires the backend binding');
  }finally{ending.guard.destroy();}
  const pendingStore=new Map();const pendingStorage={getItem:key=>pendingStore.get(key),setItem:(key,value)=>pendingStore.set(key,value)};
  const interrupted=fixture({storage:pendingStorage});
  await interrupted.guard.refresh();interrupted.pending=new Promise(()=>{});
  interrupted.guard.completedGame({accountKey:hash('alice'),canonicalPlatformGameId:'103'});
  interrupted.guard.destroy();
  const resumed=fixture({storage:pendingStorage});
  try {
    assert.equal(resumed.guard.blocksQueue(),true);
    await resumed.guard.refresh();assert.equal(resumed.requests[0].completedGameUrl,'https://www.chess.com/game/live/103','A terminal hint survives reload before HTTP acknowledgement');
  }finally{resumed.guard.destroy();}
  const invalid=fixture();
  try {
    invalid.response={...invalid.response,state:'reached',eligible:true,reached:true,confirmedRating:'2300'};
    await invalid.guard.refresh();assert.equal(invalid.stops,0);assert.equal(invalid.guard.snapshot().reached,false);assert.equal(invalid.guard.blocksQueue(),true);
    invalid.response={...invalid.response,sessionId:'f'.repeat(32),confirmedRating:2300};
    await invalid.guard.refresh();assert.equal(invalid.guard.snapshot().error,'RATING_RESPONSE_MISMATCH');assert.equal(invalid.stops,0);
  }finally{invalid.guard.destroy();}
  console.log('PASS session goal guard: confirmation, identity/category, pending publication, leader fencing, retries, stale rejection, pinned sessions and queue latch');
})().catch(error=>{console.error(error);process.exitCode=1;});
