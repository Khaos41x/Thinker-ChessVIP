const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const {spawn,spawnSync} = require('node:child_process');
const {createServer} = require('node:net');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'script.js'), 'utf8');
const out = path.join(root, '_bmad-output/implementation-artifacts/definitive-finish/block-a/pipeline');
fs.mkdirSync(out, {recursive:true});
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const port = () => new Promise(resolve => { const server=createServer();server.listen(0,'127.0.0.1',()=>{const value=server.address().port;server.close(()=>resolve(value));}); });
async function waitFor(test) { for(let n=0;n<300;n++){try{if(await test())return;}catch{}await sleep(50);}throw Error('Fixture state timed out'); }
async function connect(url) {
  const socket = new WebSocket(url); await new Promise(resolve=>socket.addEventListener('open',resolve,{once:true}));
  let id=0;const pending=new Map();const errors=[];
  socket.addEventListener('message',event=>{const data=JSON.parse(event.data);if(data.method==='Runtime.exceptionThrown')errors.push(data.params.exceptionDetails);const request=pending.get(data.id);if(!request)return;pending.delete(data.id);data.error?request.reject(Error(data.error.message)):request.resolve(data.result);});
  return {socket,errors,send(method,params={}){return new Promise((resolve,reject)=>{pending.set(++id,{resolve,reject});socket.send(JSON.stringify({id,method,params}));});}};
}
(async()=>{
 const backendPort=await port(),debug=await port(),base=`http://127.0.0.1:${backendPort}`;
 const profile=fs.mkdtempSync(path.join(os.tmpdir(),'thinker-recommendation-pipeline-'));
 const backend=spawn('python',['-u','tests/recommendation_pipeline_fixture.py',String(backendPort)],{cwd:root,stdio:['pipe','ignore','inherit'],windowsHide:true});
 const browser=spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',['--headless=new','--disable-gpu','--no-first-run',`--remote-debugging-port=${debug}`,`--user-data-dir=${profile}`,'about:blank'],{windowsHide:true,stdio:'ignore'});
 let client;
 try {
  await waitFor(async()=>(await fetch(base+'/',{signal:AbortSignal.timeout(1000)})).ok);await waitFor(async()=>(await fetch(`http://127.0.0.1:${debug}/json/list`)).ok);
  const tabs=await(await fetch(`http://127.0.0.1:${debug}/json/list`)).json();client=await connect(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);await client.send('Runtime.enable');await client.send('Page.enable');await client.send('Page.navigate',{url:base+'/'});
  const evaluate=async expression=>{const result=await client.send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});assert(!result.exceptionDetails,JSON.stringify(result.exceptionDetails));return result.result.value;};
  await waitFor(()=>evaluate("document.readyState==='complete'"));
  const rendering=source.slice(source.indexOf('  const SHAFT_W ='),source.indexOf('  let cached_board =',source.indexOf('  const SHAFT_W =')));
  const authority=source.slice(source.indexOf('  const normalizeThinkerMoveSide ='),source.indexOf('  const getSmartPacerClockValues ='));
  const pipeline=source.slice(source.indexOf('  function request_move()'),source.indexOf('  let scheduleThinkerBannerPosition',source.indexOf('  function request_move()')));
  const colors=source.slice(source.indexOf('  const ARROW_COLOR ='),source.indexOf('  let can_interval =',source.indexOf('  const ARROW_COLOR =')));
  const swatchStart=source.indexOf('        $("#kb-color-picker").on("input"');
  const swatch=source.slice(swatchStart,source.indexOf('        // Monitor URL changes',swatchStart));
  const externalStart=source.indexOf('          if (s.color && current_color !== s.color)');
  const external=source.slice(externalStart,source.indexOf('          if (typeof window.krypbotUpdateUI',externalStart));
  const bootstrap=`
   document.body.style='margin:0;background:#252523;color:#deded9;font:13px Arial';
   document.body.innerHTML='<input id="kb-color-picker" type="color" value="#3B82F6"><chess-board style="position:relative;display:block;width:640px;height:640px;background:repeating-conic-gradient(#e9edcc 0 25%,#779556 0 50%) 0 0/160px 160px"></chess-board>';
   const board=document.querySelector('chess-board');let cached_board=board;
   ${colors}
   let current_color=ARROW_COLOR;
   const state=window.pipelineState={master:true,fen:'',side:'w',turn:'w',requests:[],draws:0,scheduled:0,errors:[],done:false,logs:[]};
   const game={getFEN:()=>state.fen,getTurn:()=>state.turn,getPlayingAs:()=>state.side};board.game=game;
   const $=value=>{const nodes=typeof value==='string'?[...document.querySelectorAll(value)]:[value];return {0:nodes[0],remove(){nodes.forEach(n=>n.remove());},css(styles){nodes.forEach(n=>{for(const [k,v]of Object.entries(styles))n.style.setProperty(k,v);});},append(html){nodes.forEach(n=>typeof html==='string'?n.insertAdjacentHTML('beforeend',html):n.append(html));},hasClass(name){return nodes[0]?.classList.contains(name);},attr(name,value){if(value===undefined)return nodes[0]?.getAttribute(name);nodes.forEach(n=>n.setAttribute(name,value));},val(value){if(value===undefined)return nodes[0]?.value;nodes.forEach(n=>n.value=value);},on(name,callback){nodes.forEach(n=>n.addEventListener(name,callback));}};};
   let autoDelayMode='random';let can_interval=true,moveRetryAfter=0,gameMode='play',fen,checkfen='',auto_move=false,evalBarEnabled=false,thinkerBannerEnabled=false,recentFormEnabled=false,smartPacingEnabled=false,smartPacingV2Enabled=false,smartPacingV2ShadowEnabled=false;
   let thinkerMoveDiagnostic={stage:'idle',status:null};const chessBot={elo:3200,time:.02},moveCache=new Map(),puzzleMoveCache=new Map();
   const isMasterEnabled=()=>state.master,get_cached_game=()=>({board,game}),resolveThinkerBoardGame=node=>node.game,observeSmartPacingPosition=()=>performance.now(),smartPacer={cancel(){}},isLegacyAutoAdjustEffective=()=>false;
   const sessionControlBridge={moveSelectionElo:value=>value,isActive:()=>false,effectiveAutoMove:value=>state.master&&value};
   const getSmartPacerClockValues=()=>({}),isSmartPacerTimeTrouble=()=>false,requestSmartPacingAnalysis=()=>Promise.resolve({}),computeDelayValue=()=>.02,requestEval=()=>{},cleanCache=()=>{},SERVER_URL=location.origin;
   const log=message=>state.logs.push(message),engineRequestHeaders=()=>({'Content-Type':'application/json'}),handleEngineUnauthorized=response=>response.status===401;
   const auto_move_piece=()=>{state.scheduled++;state.done=true;return true;};
   const GM_xmlhttpRequest=options=>{state.requests.push(JSON.parse(options.data));const request=fetch('/recommendation',{method:'POST',headers:{'Content-Type':'application/json'},body:options.data});request.then(async response=>{options.onload({status:response.status,responseText:await response.text()});setTimeout(()=>state.done=true,0);}).catch(error=>{state.errors.push(String(error));options.onerror({status:0});state.done=true;});return{abort(){}};};
   ${rendering}

   ${authority}
   ${pipeline}
   const GM_setValue=(key,value)=>sessionStorage.setItem(key,value),pushToServer=()=>{state.savedColor=current_color;};
   ${swatch}
   window.runCase=options=>{state.master=options.master;state.side=options.side;state.turn=options.waiting?options.side==='w'?'b':'w':options.side;state.fen='rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR '+state.turn+' KQkq - 0 '+options.index;if(options.fen)state.fen=options.fen;state.done=false;state.scheduled=0;state.requests=[];state.logs=[];auto_move=options.autoMove;evalBarEnabled=options.evalBar;thinkerBannerEnabled=options.banner;recentFormEnabled=options.recentForm;smartPacingEnabled=options.smartPacing;checkfen='';can_interval=true;moveRetryAfter=0;moveCache.clear();board.classList.toggle('flipped',options.flipped);document.querySelectorAll('.myarrow,.myhigh').forEach(n=>n.remove());request_move();if(!options.master||options.waiting)state.done=true;};
   window.applyExternalColor=color=>{const s={color};${external}};
   window.pipelineSnapshot=()=>{const svg=board.querySelector('.myarrow'),p=svg?.querySelector('path'),r=svg?.getBoundingClientRect(),b=board.getBoundingClientRect(),s=svg?getComputedStyle(svg):null;return{stage:thinkerMoveDiagnostic.stage,scheduled:state.scheduled,requests:state.requests.length,errors:state.errors,logs:state.logs,arrow:svg?{rect:{x:r.x,y:r.y,width:r.width,height:r.height},board:{x:b.x,y:b.y,width:b.width,height:b.height},fill:p.getAttribute('fill'),opacity:p.getAttribute('fill-opacity'),display:s.display,visibility:s.visibility,zIndex:s.zIndex,pointerEvents:s.pointerEvents,parent:svg.parentElement.tagName,path:p.getAttribute('d')}:null};};
  `;
  await evaluate(`(()=>{${bootstrap}})()`);
  const cases=[];let index=1;
  for(const side of ['w','b'])for(const flipped of [false,true])for(let flags=0;flags<64;flags++){
   const options={side,flipped,index:index++,master:Boolean(flags&1),autoMove:Boolean(flags&2),evalBar:Boolean(flags&4),banner:Boolean(flags&8),recentForm:Boolean(flags&16),smartPacing:Boolean(flags&32)};
   await evaluate(`runCase(${JSON.stringify(options)})`);await waitFor(()=>evaluate('pipelineState.done')).catch(async error=>{console.error(JSON.stringify({options:typeof options==='undefined'?null:options,state:await evaluate('pipelineSnapshot()'),errors:client.errors}));throw error;});
   const result=await evaluate('pipelineSnapshot()');assert.equal(result.errors.length,0);
   const expected=options.master&&!options.autoMove;assert.equal(Boolean(result.arrow),expected,JSON.stringify({options,result}));
   assert.equal(result.requests,options.master?1:0);assert.equal(result.scheduled,options.master&&options.autoMove?1:0);
   if(expected){assert.deepEqual(result.arrow.rect,result.arrow.board);assert.equal(result.arrow.fill,'#3B82F6');assert.equal(Number(result.arrow.opacity),.8);assert.equal(result.arrow.pointerEvents,'none');assert.equal(result.arrow.zIndex,'11');assert.equal(result.arrow.visibility,'visible');assert.notEqual(result.arrow.display,'none');}
   cases.push({options,result});
  }
  for(const side of ['w','b']){await evaluate(`runCase(${JSON.stringify({side,flipped:side==='b',index:index++,master:true,autoMove:false,waiting:true})})`);const result=await evaluate('pipelineSnapshot()');assert.equal(result.requests,0);assert.equal(result.arrow,null);assert.equal(result.stage,'waiting-turn');}
  for(const flipped of [false,true]){
   await evaluate(`runCase(${JSON.stringify({side:flipped?'b':'w',flipped,index:index++,master:true,autoMove:false})})`);await waitFor(()=>evaluate('pipelineState.done')).catch(async error=>{console.error(JSON.stringify({options:typeof options==='undefined'?null:options,state:await evaluate('pipelineSnapshot()'),errors:client.errors}));throw error;});
   const shot=await client.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});fs.writeFileSync(path.join(out,`pipeline-${flipped?'black':'white'}.png`),Buffer.from(shot.data,'base64'));
  }
  const transitionCases=[];
  for(const side of ['w','b']){
   const options={side,flipped:side==='b',index:index++,master:true,autoMove:false,waiting:true};
   await evaluate(`runCase(${JSON.stringify(options)})`);assert.equal((await evaluate('pipelineSnapshot()')).arrow,null);
   options.waiting=false;options.fen=side==='w'?'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2':'rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR b KQkq - 0 1';
   await evaluate(`runCase(${JSON.stringify(options)})`);await waitFor(()=>evaluate('pipelineState.done'));const result=await evaluate('pipelineSnapshot()');assert(result.arrow);assert.equal(result.stage,'recommendation');transitionCases.push({kind:'opponent-position-to-own-turn',options,result});
  }
  await client.send('Page.reload');await waitFor(()=>evaluate("document.readyState==='complete'"));await evaluate(`(()=>{${bootstrap}})()`);
  await evaluate(`runCase(${JSON.stringify({side:'w',flipped:false,index:index++,master:true,autoMove:false})})`);await waitFor(()=>evaluate('pipelineState.done'));const afterReload=await evaluate('pipelineSnapshot()');assert(afterReload.arrow);assert.equal(afterReload.stage,'recommendation');
  const colorSupported=source.includes('normalizeArrowColor');
  let colorTests=null;
  if(colorSupported){
   await evaluate("document.getElementById('kb-color-picker').value='#E879F9';document.getElementById('kb-color-picker').dispatchEvent(new Event('input',{bubbles:true}));");
   let result=await evaluate('pipelineSnapshot()');assert.equal(result.arrow.fill.toUpperCase(),'#E879F9');assert.equal(Number(result.arrow.opacity),.8);assert.equal((await evaluate("localStorage.getItem('kb_color')")).toUpperCase(),'#E879F9');
   await evaluate("applyExternalColor('#F59E0B')");result=await evaluate('pipelineSnapshot()');assert.equal(result.arrow.fill.toUpperCase(),'#F59E0B');assert.equal(Number(result.arrow.opacity),.8);assert.equal((await evaluate("localStorage.getItem('kb_color')")).toUpperCase(),'#F59E0B');colorTests={actualSwatchEvent:true,actualExternalAcceptedColorHook:true};
  }
  const engine=await(await fetch(base+'/evidence')).json();assert.equal(engine.engineReady,true);assert(engine.requests.some(r=>r.status===200&&r.result?.length===1));assert.equal(client.errors.length,0);
  const report={scope:'Isolated Chromium; actual extracted request_move and arrow renderer; actual Flask /getmove with owned real Komodo; synthetic local game adapter; no authenticated Chess.com or real game manipulation',caseCount:cases.length,cases,transitionCases,afterReload,engine,colorTests,consoleErrors:client.errors};fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(`PASS actual recommendation pipeline: ${cases.length} flag/side/orientation cases, own-turn guards, real Komodo /getmove, actual DOM arrows${colorTests?', actual swatch and External Config color hooks':''}`);
 }finally{if(client){try{await client.send('Browser.close');}catch{}client.socket.close();}if(browser.exitCode===null)spawnSync('taskkill',['/PID',String(browser.pid),'/T','/F'],{windowsHide:true,stdio:'ignore'});backend.stdin.write('stop\n');backend.stdin.end();await new Promise(resolve=>{backend.once('exit',resolve);setTimeout(resolve,5000)});if(backend.exitCode===null)backend.kill();await sleep(1000);if(!profile.startsWith(path.join(os.tmpdir(),'thinker-recommendation-pipeline-')))throw Error('Unsafe profile path');try{fs.rmSync(profile,{recursive:true,force:true,maxRetries:10,retryDelay:100});}catch(error){console.error('Owned browser profile cleanup pending:',error.code);}}
})().catch(error=>{console.error(error);process.exitCode=1;});
