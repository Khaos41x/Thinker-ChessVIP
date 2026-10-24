const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const assert=require('node:assert/strict');
const {spawn,execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
const output=path.join(root,'_bmad-output/implementation-artifacts/blue-recommendation-arrows');
fs.mkdirSync(output,{recursive:true});
const before=execFileSync('git',['show','a96f8f1:script.js'],{cwd:root,encoding:'utf8',maxBuffer:2e6});
const after=fs.readFileSync(path.join(root,'script.js'),'utf8');
const extract=source=>source.slice(source.indexOf('  const SHAFT_W ='),source.indexOf('  let cached_board =',source.indexOf('  const SHAFT_W =')));
const geometry=source=>source.slice(source.indexOf('  const recommendationArrowPath ='),source.indexOf('  const get_number ='));
assert.equal(geometry(before),geometry(after),'Approved path geometry must remain byte-identical');
const color=source=>source.match(/const ARROW_COLOR = "(#[A-Fa-f0-9]+)";/)[1];
const images=Object.fromEntries(['white','black'].map(name=>[name,'data:image/png;base64,'+fs.readFileSync(path.join(root,`_bmad-output/implementation-artifacts/recommendation-arrows/initial-board${name==='black'?'-black':''}.png`)).toString('base64')]));
const renderer=String(function(target,code,arrowColor){
  const run=new Function('target','current_color','ARROW_COLOR',`
    let cached_board=target;const log=error=>{throw new Error(error);};
    const $=value=>{const nodes=typeof value==='string'?[...document.querySelectorAll(value)]:[value];return {0:nodes[0],remove(){nodes.forEach(node=>node.remove());},css(styles){nodes.forEach(node=>Object.assign(node.style,styles));},append(html){nodes.forEach(node=>typeof html==='string'?node.insertAdjacentHTML('beforeend',html):node.append(html));},hasClass(name){return nodes[0]?.classList.contains(name);},attr(name){return nodes[0]?.getAttribute(name);}};};
    ${code};return create_div;
  `);
  const draw=run(target,'#10B981',arrowColor),arrows=[];
  for(const move of ['a2a4','b2b4','g7g5','h7h5','c1g5','c8g4']){
    draw(move);const svg=target.querySelector('.myarrow');svg.dataset.move=move;arrows.push(svg.outerHTML);
  }
  target.querySelectorAll('.myarrow').forEach(node=>node.remove());target.insertAdjacentHTML('beforeend',arrows.join(''));
});
const html=`<!doctype html><meta charset="utf-8"><style>*{box-sizing:border-box}body{margin:0;padding:16px;background:#252523;color:#deded9;font:14px/20px Arial}header{height:68px}h1{font-size:18px;margin:0 0 4px}main{display:grid;grid-template-columns:repeat(2,var(--board));gap:16px}section h2{font-size:16px;margin:0 0 8px}chess-board{position:relative;display:block;width:var(--board);height:var(--board);background-size:100% 100%}</style><header><h1>Thinker Chess — color and opacity only</h1><div id="conditions"></div><div>a2 / b2: white origins, light / dark · g7 / h7: black origins, dark / light · c-file diagonals cross pieces</div></header><main><section><h2>Before · #10B981 · 0.64</h2><chess-board id="before"></chess-board></section><section><h2>After · #3B82F6 · 0.80</h2><chess-board id="after"></chess-board></section></main><script>const render=${renderer};const sources=${JSON.stringify([extract(before),extract(after)])},colors=${JSON.stringify([color(before),color(after)])},images=${JSON.stringify(images)};window.setup=(width,flipped,dpr)=>{document.documentElement.style.setProperty('--board',width+'px');document.getElementById('conditions').textContent=width+' CSS px · DPR '+dpr+' · '+(flipped?'Black orientation':'White orientation');for(const [index,id] of ['before','after'].entries()){document.querySelectorAll('.myarrow').forEach(node=>node.classList.replace('myarrow','saved-arrow'));const board=document.getElementById(id);board.querySelectorAll('svg').forEach(node=>node.remove());board.style.backgroundImage='url('+images[flipped?'black':'white']+')';board.classList.toggle('flipped',flipped);render(board,sources[index],colors[index]);}document.querySelectorAll('.saved-arrow').forEach(node=>node.classList.replace('saved-arrow','myarrow'));return [...document.querySelectorAll('chess-board')].map(board=>({id:board.id,rect:board.getBoundingClientRect().toJSON(),arrows:[...board.querySelectorAll('.myarrow')].map(svg=>({move:svg.dataset.move,path:svg.querySelector('path').getAttribute('d'),color:svg.querySelector('path').getAttribute('fill'),opacity:svg.querySelector('path').getAttribute('fill-opacity'),pointerEvents:getComputedStyle(svg).pointerEvents,zIndex:getComputedStyle(svg).zIndex}))}));};</script>`;
fs.writeFileSync(path.join(output,'before-after.html'),html);
function connect(url){const socket=new WebSocket(url),pending=new Map();let id=0;socket.addEventListener('message',event=>{const message=JSON.parse(event.data);if(!pending.has(message.id))return;const [resolve,reject]=pending.get(message.id);pending.delete(message.id);message.error?reject(new Error(message.error.message)):resolve(message.result);});return {ready:new Promise(resolve=>socket.addEventListener('open',resolve,{once:true})),send(method,params={}){return new Promise((resolve,reject)=>{pending.set(++id,[resolve,reject]);socket.send(JSON.stringify({id,method,params}));});},close(){socket.close();}};}
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
(async()=>{const port=26000+process.pid%1000,profile=fs.mkdtempSync(path.join(os.tmpdir(),'tc-blue-arrows-'));const chrome=spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',['--headless=new','--disable-gpu','--no-first-run',`--remote-debugging-port=${port}`,`--user-data-dir=${profile}`,'about:blank'],{stdio:'ignore'});let client;try{
  let tabs;for(let attempt=0;attempt<100;attempt++){try{tabs=await fetch(`http://127.0.0.1:${port}/json/list`).then(response=>response.json());if(tabs.length)break;}catch{}await sleep(100);}assert(tabs?.length);client=connect(tabs.find(tab=>tab.type==='page').webSocketDebuggerUrl);await client.ready;
  const evaluate=async expression=>{const response=await client.send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});assert(!response.exceptionDetails,JSON.stringify(response.exceptionDetails));return response.result.value;};
  await client.send('Page.navigate',{url:require('node:url').pathToFileURL(path.join(output,'before-after.html')).href});let ready=false;for(let attempt=0;attempt<100;attempt++){if(await evaluate('typeof setup === "function"')){ready=true;break;}await sleep(100);}assert(ready);
  await evaluate(`Promise.all(Object.values(images).map(src=>new Promise(resolve=>{const image=new Image();image.onload=resolve;image.src=src;}))).then(()=>true)`);
  const cases=[];
  for(const width of [400,640,900])for(const dpr of [1,2])for(const flipped of [false,true]){
    await client.send('Emulation.setDeviceMetricsOverride',{width:width*2+48,height:width+128,deviceScaleFactor:dpr,mobile:false});
    const boards=await evaluate(`setup(${width},${flipped},${dpr})`);
    assert.equal(boards[0].arrows.length,6);assert.equal(boards[1].arrows.length,6);
    for(let index=0;index<6;index++){const old=boards[0].arrows[index],current=boards[1].arrows[index];assert.equal(old.path,current.path);assert.equal(current.color,'#3B82F6');assert.equal(Number(current.opacity),0.8);assert.equal(current.zIndex,old.zIndex);assert.equal(current.pointerEvents,old.pointerEvents);}
    const filename=`before-after-${width}-dpr${dpr}-${flipped?'black':'white'}.png`;
    const screenshot=await client.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});fs.writeFileSync(path.join(output,filename),Buffer.from(screenshot.data,'base64'));
    cases.push({width,dpr,flipped,filename,boards});
    if(width===640&&dpr===1){const board=boards[1].rect;const clip=flipped?{x:board.x+80,y:board.y+480,width:160,height:160,scale:2}:{x:board.x+400,y:board.y,width:240,height:240,scale:2};const zoom=await client.send('Page.captureScreenshot',{format:'png',clip});fs.writeFileSync(path.join(output,`black-piece-dark-square-${flipped?'black':'white'}.png`),Buffer.from(zoom.data,'base64'));}
  }
  const report={beforeCommit:'a96f8f1',afterColor:color(after),afterOpacity:0.8,geometryByteIdentical:true,criterion:'Hue distinction; no 3:1 pass criterion',cases};fs.writeFileSync(path.join(output,'verification.json'),JSON.stringify(report,null,2));console.log('PASS 12 before/after Chromium cases: 6 identical arrow paths each; blue 0.8, layer and pointer events unchanged');
}finally{client?.close();chrome.kill();}})().catch(error=>{console.error(error);process.exitCode=1;});
