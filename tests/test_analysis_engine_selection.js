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
  console.log('Engine selection context and initialization race tests passed');
})();
