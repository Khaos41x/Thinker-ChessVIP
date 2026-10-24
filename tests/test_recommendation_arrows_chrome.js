const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const {spawn}=require('node:child_process');
const {rendering,constants}=require('./test_recommendation_arrows');
const root=path.resolve(__dirname,'..');
const out=path.join(root,'_bmad-output/implementation-artifacts/recommendation-arrows');
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function connect(url){
  const socket=new WebSocket(url),pending=new Map();let id=0;
  socket.addEventListener('message',event=>{const message=JSON.parse(event.data);if(!pending.has(message.id))return;const [resolve,reject]=pending.get(message.id);pending.delete(message.id);message.error?reject(new Error(message.error.message)):resolve(message.result);});
  return {ready:new Promise(resolve=>socket.addEventListener('open',resolve,{once:true})),send(method,params={}){return new Promise((resolve,reject)=>{pending.set(++id,[resolve,reject]);socket.send(JSON.stringify({id,method,params}));});},close(){socket.close();}};
}
(async()=>{
  const port=24000+process.pid%1000;
  const profile=fs.mkdtempSync(path.join(os.tmpdir(),'thinker-arrows-'));
  const chrome=spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',['--headless=new','--disable-gpu','--no-first-run',`--remote-debugging-port=${port}`,`--user-data-dir=${profile}`,'about:blank'],{stdio:'ignore'});
  let client;
  try{
    let tabs;
    for(let attempt=0;attempt<100;attempt++){try{tabs=await fetch(`http://127.0.0.1:${port}/json/list`).then(response=>response.json());if(tabs.length)break;}catch{}await sleep(100);}
    assert(tabs?.length,'Chromium unavailable');client=connect(tabs.find(tab=>tab.type==='page').webSocketDebuggerUrl);await client.ready;
    const evaluate=async expression=>{const response=await client.send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});assert(!response.exceptionDetails,JSON.stringify(response.exceptionDetails));return response.result.value;};
    const boardImage='data:image/png;base64,'+fs.readFileSync(path.join(out,'initial-board.png')).toString('base64');
    const blackBoardImage='data:image/png;base64,'+fs.readFileSync(path.join(out,'initial-board-black.png')).toString('base64');
    const reference='data:image/png;base64,'+fs.readFileSync(path.join(root,'assets/chesscom-arrows.png')).toString('base64');
    const bootstrap=`
      document.body.style='margin:0;background:#252523;color:#deded9;font:16px Arial';
      document.body.innerHTML='<div id="reference" style="display:none"><p>Chess.com reference (includes native knight arrow)</p><img width="645" height="647" src="${reference}"></div><div id="subject"><p>Thinker: production renderer, initial position</p><chess-board style="position:relative;display:block;width:640px;height:640px;background-image:url(${boardImage});background-size:100% 100%"><svg class="native-arrows" style="position:absolute;pointer-events:none;z-index:12"><path d="M0,0"></path></svg><div id="piece" style="position:absolute;left:0;bottom:0;width:12.5%;height:12.5%;z-index:3"></div></chess-board></div>';
      const target=document.querySelector('chess-board');let cached_board=target;const current_color='#10B981',ARROW_COLOR='#10B981';const log=error=>{throw new Error(error);};
      const $=value=>{const nodes=typeof value==='string'?[...document.querySelectorAll(value)]:[value];return {0:nodes[0],remove(){nodes.forEach(node=>node.remove());},css(styles){nodes.forEach(node=>Object.assign(node.style,styles));},append(html){nodes.forEach(node=>typeof html==='string'?node.insertAdjacentHTML('beforeend',html):node.append(html));},hasClass(name){return nodes[0]?.classList.contains(name);},attr(name){return nodes[0]?.getAttribute(name);}};};
      ${rendering}
      globalThis.draw=create_div;globalThis.arrowPath=recommendationArrowPath;
      globalThis.drawComparison=()=>{let samples=[];for(const move of ['a2a3','b2b4','c1g5']){create_div(move);samples.push(target.querySelector('.myarrow').outerHTML);}target.querySelectorAll('.myarrow').forEach(node=>node.remove());target.insertAdjacentHTML('beforeend',samples.join(''));};
      globalThis.clicks=0;globalThis.drags=0;document.getElementById('piece').addEventListener('click',()=>clicks++);document.getElementById('piece').addEventListener('pointermove',event=>{if(event.buttons===1)drags++;});
    `;
    await evaluate(`(()=>{${bootstrap}})()`);
    await evaluate(`Promise.all([...document.images].map(image=>image.decode())).then(()=>true)`);
    const measurements=[];
    for(const width of [400,640,900])for(const dpr of [1,2])for(const flipped of [false,true]){
      await client.send('Emulation.setDeviceMetricsOverride',{width:width+40,height:width+120,deviceScaleFactor:dpr,mobile:false});
      await evaluate(`(()=>{const board=document.querySelector('chess-board');board.style.backgroundImage='url(${flipped?blackBoardImage:boardImage})';document.getElementById('piece').style.left='${flipped?87.5:0}%';document.getElementById('piece').style.bottom='${flipped?87.5:0}%';})()`);
      const result=await evaluate(`(()=>{const board=document.querySelector('chess-board');board.style.width='${width}px';board.style.height='${width}px';board.classList.toggle('flipped',${flipped});draw('a2a3');const svg=board.querySelector('.myarrow'),path=svg.querySelector('path'),rect=svg.getBoundingClientRect();return {width:${width},dpr:${dpr},flipped:${flipped},board:board.getBoundingClientRect().toJSON(),arrow:rect.toJSON(),d:path.getAttribute('d'),paths:svg.querySelectorAll('path').length,markers:svg.querySelectorAll('marker').length,highlights:board.querySelectorAll('.myhigh').length,native:board.querySelectorAll('.native-arrows').length,pointerEvents:getComputedStyle(svg).pointerEvents,filter:getComputedStyle(svg).filter,opacity:path.getAttribute('fill-opacity'),zIndex:getComputedStyle(svg).zIndex};})()`);
      assert.equal(result.arrow.width,width);assert.equal(result.arrow.height,width);assert.equal(result.paths,1);assert.equal(result.markers,0);assert.equal(result.highlights,0);assert.equal(result.native,1);assert.equal(result.pointerEvents,'none');assert.equal(result.filter,'none');assert.equal(Number(result.opacity),constants.OPACITY);
      const coords=[...result.d.matchAll(/[-+]?(?:\d*\.)?\d+/g)].map(match=>Number(match[0]));
      assert.equal(coords[6],flipped?7.5:0.5);assert.equal(coords[7],flipped?2.5:5.5);
      const origin=[flipped?7.5:0.5,flipped?1.5:6.5];
      result.measured={shaft:Math.hypot(coords[0]-coords[12],coords[1]-coords[13]),headWidth:Math.hypot(coords[4]-coords[8],coords[5]-coords[9]),headLength:Math.hypot(coords[6]-(coords[4]+coords[8])/2,coords[7]-(coords[5]+coords[9])/2),tailInset:Math.hypot((coords[0]+coords[12])/2-origin[0],(coords[1]+coords[13])/2-origin[1])};
      for(const [name,expected] of Object.entries({shaft:0.225,headWidth:0.525,headLength:0.3625,tailInset:0.3625}))assert(Math.abs(result.measured[name]-expected)<=0.02,`${name} deviates from PNG`);
      measurements.push(result);
      await evaluate('drawComparison()');
      const screenshot=await client.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});
      fs.writeFileSync(path.join(out,`arrows-${width}-dpr${dpr}-${flipped?'black':'white'}.png`),Buffer.from(screenshot.data,'base64'));
    }
    await client.send('Emulation.setDeviceMetricsOverride',{width:1320,height:740,deviceScaleFactor:1,mobile:false});
    await evaluate(`(()=>{const board=document.querySelector('chess-board');board.style.width='640px';board.style.height='640px';board.style.backgroundImage='url(${boardImage})';document.getElementById('piece').style.left='0';document.getElementById('piece').style.bottom='0';board.classList.remove('flipped');document.body.style.display='flex';document.body.style.gap='16px';document.getElementById('reference').style.display='block';drawComparison();})()`);
    const screenshot=await client.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});fs.writeFileSync(path.join(out,'reference-vs-thinker.png'),Buffer.from(screenshot.data,'base64'));
    await evaluate(`document.getElementById('reference').style.display='none';draw('a1a8')`);
    const piece=await evaluate(`document.getElementById('piece').getBoundingClientRect().toJSON()`);
    await client.send('Input.dispatchMouseEvent',{type:'mouseMoved',x:piece.x+40,y:piece.y+40});
    await client.send('Input.dispatchMouseEvent',{type:'mousePressed',x:piece.x+40,y:piece.y+40,button:'left',clickCount:1});
    await client.send('Input.dispatchMouseEvent',{type:'mouseMoved',x:piece.x+42,y:piece.y+42,buttons:1});
    await client.send('Input.dispatchMouseEvent',{type:'mouseReleased',x:piece.x+42,y:piece.y+42,button:'left',clickCount:1});
    const interactions=await evaluate('({clicks,drags})');assert.equal(interactions.clicks,1);assert(interactions.drags>=1);
    await evaluate(`draw('b2b4')`);
    const seam=await evaluate(`(async()=>{const svg=document.querySelector('.myarrow').cloneNode(true);svg.setAttribute('xmlns','http://www.w3.org/2000/svg');svg.removeAttribute('style');svg.setAttribute('width','640');svg.setAttribute('height','640');const image=new Image();image.src='data:image/svg+xml,'+encodeURIComponent(new XMLSerializer().serializeToString(svg));await image.decode();const canvas=document.createElement('canvas');canvas.width=canvas.height=640;const context=canvas.getContext('2d');context.drawImage(image,0,0);return [388,389,390,420].map(y=>({y,rgba:[...context.getImageData(120,y,1,1).data]}));})()`);
    for(const sample of seam)assert(Math.abs(sample.rgba[3]-constants.OPACITY*255)<=1,JSON.stringify(seam));
    const bounds=await evaluate(`document.querySelector('chess-board').getBoundingClientRect().toJSON()`);
    const zoom=await client.send('Page.captureScreenshot',{format:'png',clip:{x:bounds.x+88,y:bounds.y+340,width:64,height:96,scale:3}});
    fs.writeFileSync(path.join(out,'tip-and-junction-300.png'),Buffer.from(zoom.data,'base64'));
    const report={fixture:'Production arrow functions extracted unchanged from script.js; reconstructed initial-position tiles; not authenticated Chess.com',constants,measurements,interactions,seam};
    fs.writeFileSync(path.join(out,'browser-report.json'),JSON.stringify(report,null,2));
    console.log(`PASS Chromium: ${measurements.length} size/DPR/orientation cases; native arrows retained; clicks and pointer drags pass through`);
  }finally{client?.close();chrome.kill();}
})().catch(error=>{console.error(error);process.exitCode=1;});
