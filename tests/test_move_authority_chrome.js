const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {spawn}=require('node:child_process');
const root=path.resolve(__dirname,'..');
const out=path.join(root,'_bmad-output/implementation-artifacts/move-authority-fix');fs.mkdirSync(out,{recursive:true});
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function waitFor(test,timeout=12000){const end=Date.now()+timeout;while(Date.now()<end){try{if(await test())return;}catch{}await sleep(50);}throw Error('Timed out waiting for state');}
function connect(url){const socket=new WebSocket(url),pending=new Map();let id=0;socket.addEventListener('message',event=>{const message=JSON.parse(event.data);if(!pending.has(message.id))return;const [resolve,reject]=pending.get(message.id);pending.delete(message.id);message.error?reject(Error(message.error.message)):resolve(message.result);});return {ready:new Promise(resolve=>socket.addEventListener('open',resolve,{once:true})),send(method,params={}){return new Promise((resolve,reject)=>{pending.set(++id,[resolve,reject]);socket.send(JSON.stringify({id,method,params}));});},close(){socket.close();}};}
(async()=>{const port=29000+process.pid%1000,debug=port+1000,profile=fs.mkdtempSync(path.join(os.tmpdir(),'tc-move-authority-'));const server=spawn('python',['tests/external_config_fixture.py',String(port)],{cwd:root,stdio:'ignore'});const chrome=spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',['--headless=new','--disable-gpu','--no-first-run','--disable-background-timer-throttling',`--remote-debugging-port=${debug}`,`--user-data-dir=${profile}`,'about:blank'],{stdio:'ignore'});let client;try{
  await waitFor(async()=>(await fetch(`http://127.0.0.1:${port}/config/load`)).ok);let tabs;await waitFor(async()=>{tabs=await fetch(`http://127.0.0.1:${debug}/json/list`).then(response=>response.json());return tabs.length;});client=connect(tabs.find(tab=>tab.type==='page').webSocketDebuggerUrl);await client.ready;
  const evaluate=async expression=>{const response=await client.send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});assert(!response.exceptionDetails,JSON.stringify(response.exceptionDetails));return response.result.value;};
  await client.send('Emulation.setDeviceMetricsOverride',{width:1433,height:900,deviceScaleFactor:1,mobile:false});
  await client.send('Page.navigate',{url:`http://127.0.0.1:${port}/tests/fixtures/userscript_bootstrap.html?delay=50`});
  await waitFor(()=>evaluate(`Boolean(document.getElementById('st-on')&&document.querySelector('wc-chess-board'))`));
  await evaluate(`(()=>{
    const W='8/8/8/8/8/5k2/8/6K1 w - - 0 1';
    const state=window.moveAuthorityFixture={fen:W,side:null,turn:'w',moves:[],requests:[],pending:[],hold:false,illegal:[]};
    window.prompt=()=> 'fixture-local-only';
    const board=document.querySelector('wc-chess-board');
    board.game={getFEN:()=>state.fen,getTurn:()=>state.turn,getPlayingAs:()=>state.side,
      getLegalMoves:()=>[{from:'g1',to:'h1'},{from:'f3',to:'e3'}],
      move(move){const side=state.side===1?'w':state.side===2?'b':state.side;const turn=state.fen.split(' ')[1];if(side!==turn)state.illegal.push({side,turn,move});state.moves.push({side,turn,move,fen:state.fen});state.fen=state.fen.replace(' w ',' b ');state.turn='b';}};
    const original=window.GM_xmlhttpRequest;
    window.GM_xmlhttpRequest=options=>{
      if(!options.url.endsWith('/getmove'))return original(options);
      const body=JSON.parse(options.data);state.requests.push(body);
      const answer=()=>options.onload({status:200,responseText:JSON.stringify([body.fen.split(' ')[1]==='w'?'g1h1':'f3e3'])});
      if(state.hold)state.pending.push(answer);else setTimeout(answer,20);
      return {abort(){}};
    };
    document.getElementById('am-on').checked=true;document.getElementById('am-on').dispatchEvent(new Event('change',{bubbles:true}));
    document.getElementById('st-on').checked=true;document.getElementById('st-on').dispatchEvent(new Event('change',{bubbles:true}));
  })()`);
  await waitFor(()=>evaluate(`thinkerChessDiagnostics().bot.stage==='player-identity-unavailable'`));
  assert.equal(await evaluate('moveAuthorityFixture.requests.length'),0);
  const unknown=await evaluate('thinkerChessDiagnostics().bot');
  await evaluate('moveAuthorityFixture.side=1');
  await waitFor(()=>evaluate('moveAuthorityFixture.moves.length===1'));
  await sleep(250);
  assert.equal(await evaluate('moveAuthorityFixture.moves.length'),1);
  const waiting=await evaluate('thinkerChessDiagnostics().bot');assert.equal(waiting.moveAuthority.reason,'waiting-turn');
  await evaluate(`moveAuthorityFixture.fen='8/8/8/8/8/5k2/8/6K1 w - - 0 2';moveAuthorityFixture.turn='w';moveAuthorityFixture.hold=true`);
  await waitFor(()=>evaluate('moveAuthorityFixture.pending.length===1'));
  await evaluate(`moveAuthorityFixture.side=null;moveAuthorityFixture.pending.shift()()`);
  await sleep(150);
  assert.equal(await evaluate('moveAuthorityFixture.moves.length'),1,'Unknown identity accepted delayed response');
  await evaluate(`moveAuthorityFixture.side=1;moveAuthorityFixture.hold=false`);
  await waitFor(()=>evaluate(`thinkerChessDiagnostics().bot.stage==='move-scheduled'`));
  await evaluate('moveAuthorityFixture.side=2');
  await sleep(1150);
  assert.equal(await evaluate('moveAuthorityFixture.moves.length'),1,'Changed player identity executed scheduled move');
  await evaluate(`moveAuthorityFixture.side=1;moveAuthorityFixture.fen='8/8/8/8/8/5k2/8/6K1 w - - 0 3';moveAuthorityFixture.turn='w'`);
  await waitFor(()=>evaluate('moveAuthorityFixture.moves.length===2'));
  assert.equal(await evaluate('moveAuthorityFixture.illegal.length'),0);
  const snapshot=await evaluate('({moves:moveAuthorityFixture.moves,requestCount:moveAuthorityFixture.requests.length,illegal:moveAuthorityFixture.illegal,bot:thinkerChessDiagnostics().bot})');
  fs.writeFileSync(path.join(out,'chromium-report.json'),JSON.stringify({fixture:'Actual complete userscript, existing Flask fixture, mocked privileged engine transport and local board API; no real game',unknown,waiting,...snapshot},null,2));
  const screenshot=await client.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});fs.writeFileSync(path.join(out,'chromium-fixture.png'),Buffer.from(screenshot.data,'base64'));
  console.log('PASS actual-userscript Chromium: unknown identity blocks HTTP, numeric identity recovers, opponent turn blocked, stale response/timer rejected, valid move recovers; zero unauthorized moves');
}finally{client?.close();chrome.kill();server.kill();}})().catch(error=>{console.error(error);process.exitCode=1;});
