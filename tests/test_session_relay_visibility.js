const assert = require('node:assert/strict');
const {createExternalSessionBridge} = require('../frontend/session_control/external');
(async()=>{
  globalThis.document={hidden:true};
  const calls=[];
  let delivered=false;
  const relay=createExternalSessionBridge({clientId:'visibility-test',isOffline:()=>true,bridge:{sessionSnapshot:()=>null,status:()=>({phase:'IDLE',rolloutStage:'ACTIVE_DDA'}),exportDiagnostic:()=>({events:[]})},presenter:{applyDraft(){},update(){}},startBlocker:()=>null,createConfig:x=>x,setTimeout:()=>0,clearTimeout(){},request:async(path,body)=>{
    calls.push({path,body});
    if(path==='/config/load')return {sessionDurationMinutes:null,sessionMinimumPercent:null,sessionMaximumPercent:null};
    if(path==='/config/session/bridge'&&!delivered){delivered=true;return {owner:true,command:{id:'export-hidden',action:'export',ownerId:'visibility-test',expiresAt:Date.now()+10000,sessionIdentity:null}};}
    return {};
  }});
  await relay.start();await relay.start();relay.stop();
  assert(calls.some(c=>c.path==='/config/session/commands/export-hidden/authorize'));
  assert(calls.some(c=>c.path==='/config/session/bridge'&&c.body.ack?.ok===true));
  delete globalThis.document;
  console.log('PASS hidden Chess.com relay still authorizes Export and delivers its acknowledgement');
})().catch(error=>{console.error(error);process.exitCode=1;});
