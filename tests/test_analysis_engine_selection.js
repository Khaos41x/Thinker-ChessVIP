const assert = require('node:assert/strict');
const fs = require('node:fs');
require('../frontend/eval_bar/engine-selection.js');
(async () => {
  let context = 'analysis';
  let active = null;
  const calls = [];
  const selection = globalThis.ThinkerAnalysisEngine.create({serverUrl:'http://localhost', authorize:()=>context,headers:()=>({}),storage:{setItem(){}},
    request(options) {
      calls.push(options);
      const snapshot = {selectedEngineId:'stockfish-19-1mb',activeEngineId:active,selectionGeneration:active?1:0,cacheContext:active||''};
      if(options.method==='GET') {
        active='stockfish-19-94mb';
        queueMicrotask(()=>options.onload({status:200,responseText:JSON.stringify(snapshot)}));
      } else {
        const data=JSON.parse(options.data);
        assert.equal(data.initializeOnly,true);
        queueMicrotask(()=>options.onload({status:200,responseText:JSON.stringify({...snapshot,selectedEngineId:active,activeEngineId:active,selectionGeneration:1,cacheContext:active})}));
      }
    }});
  await selection.refresh(true, true);
  assert.equal(selection.requestIdentity().engineId,'stockfish-19-94mb');
  assert.equal(selection.cacheContext(),'stockfish-19-94mb');
  context='active-game';
  assert.equal(selection.cacheContext(),'');
  assert.deepEqual(selection.requestIdentity(),{});
  assert.equal(calls.length,2);
  let discoveryRequests=0;
  const discovery=globalThis.ThinkerAnalysisEngine.create({serverUrl:'http://localhost',authorize:()=> 'analysis',headers:()=>({}),request(options){discoveryRequests++;assert.equal(options.method,'GET');options.onload({status:200,responseText:JSON.stringify({activeEngineId:null,selectedEngineId:'stockfish-19-1mb'})});}});
  await discovery.refresh(true);
  assert.equal(discoveryRequests,1);
  let preferenceAttempts = 0;
  const engines = ['stockfish-19-1mb', 'stockfish-19-94mb', 'komodo-14.1'].map(id => ({id, installed:true}));
  const conflict = globalThis.ThinkerAnalysisEngine.create({serverUrl:'http://localhost',authorize:()=> 'active-game',headers:()=>({}),request(options){
    let status = 200;
    let result = {engines,selectedEngineId:'stockfish-19-1mb',preferenceRevision:0};
    if(options.method==='POST') {
      const data=JSON.parse(options.data);
      preferenceAttempts++;
      if(preferenceAttempts===1) {
        status=409;
        result={engines,selectedEngineId:'komodo-14.1',preferenceRevision:1,error:'Preference revision changed'};
      } else {
        assert.equal(data.expectedRevision,1,'Conflict snapshot revision was lost');
        assert.equal(data.engineId,'stockfish-19-94mb','Attempted preference was lost');
        result={ok:true,engines,selectedEngineId:data.engineId,preferenceRevision:2};
      }
    }
    options.onload({status,responseText:JSON.stringify(result)});
  }});
  await conflict.refresh(true);
  await conflict.selectPreference('stockfish-19-94mb');
  assert.equal(conflict.snapshot().state.selectedEngineId,'komodo-14.1');
  assert.equal(conflict.snapshot().state.preferenceRevision,1);
  assert.equal(conflict.snapshot().attemptedEngineId,'stockfish-19-94mb');
  await conflict.selectPreference(conflict.snapshot().attemptedEngineId);
  assert.equal(conflict.snapshot().state.selectedEngineId,'stockfish-19-94mb');
  assert.equal(conflict.snapshot().attemptedEngineId,null);
  console.log('Engine selection context and initialization race tests passed');
})();
