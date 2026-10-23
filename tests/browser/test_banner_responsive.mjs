import { spawn, execFileSync } from 'node:child_process';
import { readFile, writeFile, mkdir, mkdtemp } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import assert from 'node:assert/strict';

const root = resolve(import.meta.dirname, '../..');
const phase = process.argv.includes('--before') ? 'before' : 'after';
const vectorPass = process.argv.includes('--vector');
const expressivePass = process.argv.includes('--expressive');
const titlePass = process.argv.includes('--title');
const zoom = Number(process.argv.find(arg => arg.startsWith('--zoom='))?.split('=')[1] || 1);
const baseDpr = Number(process.argv.find(arg => arg.startsWith('--dpr='))?.split('=')[1] || 1);
const zoomPass = zoom !== 1;
const output = join(root, '_bmad-output/implementation-artifacts', titlePass ? 'banner-title' : expressivePass ? 'banner-expressive' : vectorPass ? 'banner-vector' : 'banner-responsive');
const captureFolder = zoomPass ? `zoom-${Math.round(zoom*100)}-dpr${baseDpr}` : phase;
await mkdir(join(output, captureFolder), { recursive: true });
const baselineRef = 'f4dbb37';
const source = phase === 'before' ? (titlePass ? execFileSync('git', ['show', '809ddd9:script.js'], { cwd: root, encoding: 'utf8' }) : vectorPass || expressivePass ? await readFile(join(output, 'before-script.js'), 'utf8') : execFileSync('git', ['show', `${baselineRef}:script.js`], { cwd: root, encoding: 'utf8' })) : await readFile(join(root, 'script.js'), 'utf8');
const start = source.indexOf('  let scheduleThinkerBannerPosition');
const end = source.indexOf('\n  function createMenu', start);
const markupStart = source.indexOf('const bannerHtml = `') + 'const bannerHtml = '.length;
const markupEnd = source.indexOf('`;', markupStart) + 1;
const markup = source.slice(markupStart, markupEnd);
const vectorArtwork = markup.includes('data-artwork="knight-symbol.svg"');
const controller = source.slice(start, end);
const boardResolvers = source.slice(source.indexOf('  function resolveThinkerBoardGame'), source.indexOf('  function get_cached_game'));
const liveSidebarLeft = { 1024: [708, 708, 708], 1280: [788, 788, 788], 1440: [808, 948, 948], 1920: [965, 1055, 1215], 2560: [1285, 1375, 1465] };
const cases = zoomPass ? [{width:1440,height:900,dpr:baseDpr,sidebarLeft:948,sidebarWidth:300}] : Object.entries(liveSidebarLeft).flatMap(([width, lefts]) => [720, 900, 1080].flatMap((height, index) => [1, 2].map(dpr => ({ width: Number(width), height, dpr, sidebarLeft: lefts[index], sidebarWidth: Number(width) >= 1920 ? 500 : 300 }))));
const server = createServer((request, response) => { response.setHeader('Content-Type', 'text/html'); response.end('<!doctype html><html><head><meta charset="utf-8"></head><body></body></html>'); });
await new Promise(resolveListen => server.listen(0, '127.0.0.1', resolveListen));
const url = `http://127.0.0.1:${server.address().port}/play/online`;
const profile = await mkdtemp(join(tmpdir(), 'thinker-banner-responsive-'));
if (zoomPass) {
  await mkdir(join(profile,'Default'),{recursive:true});
  await writeFile(join(profile,'Default/Preferences'), JSON.stringify({partition:{default_zoom_level:{x:Math.log(zoom)/Math.log(1.2)}}}));
}
const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--remote-debugging-port=0', '--window-size=1440,900', ...(zoomPass?[`--force-device-scale-factor=${baseDpr}`]:[]), `--user-data-dir=${profile}`, url], { windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'] });
try {
  const endpoint = await new Promise((accept, reject) => { let log = ''; const timeout = setTimeout(() => reject(new Error('Chrome startup timeout')), 15000); chrome.stderr.on('data', chunk => { log += chunk; const match = log.match(/DevTools listening on (ws:\/\/\S+)/); if (match) { clearTimeout(timeout); accept(match[1]); } }); chrome.on('error', reject); });
  const tabs = await (await fetch(`http://${new URL(endpoint).host}/json`)).json();
  const socket = new WebSocket(tabs.find(tab => tab.type === 'page').webSocketDebuggerUrl);
  await new Promise(resolveOpen => socket.addEventListener('open', resolveOpen, { once: true }));
  let sequence = 0;
  const pending = new Map();
  socket.addEventListener('message', ({ data }) => { const message = JSON.parse(data); const waiter = pending.get(message.id); if (waiter) { pending.delete(message.id); message.error ? waiter.reject(message.error) : waiter.resolve(message.result); } });
  const call = (method, params = {}) => new Promise((resolveCall, reject) => { const id = ++sequence; pending.set(id, { resolve: resolveCall, reject }); socket.send(JSON.stringify({ id, method, params })); });
  const evaluate = async expression => { const response = await call('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }); if (response.exceptionDetails) throw new Error(JSON.stringify(response.exceptionDetails)); return response.result.value; };
  const results = [];
  for (const scenario of cases) {
    if (!zoomPass) await call('Emulation.setDeviceMetricsOverride', { width: scenario.width, height: scenario.height, deviceScaleFactor: scenario.dpr, mobile: false });
    await call('Page.navigate', { url });
    await evaluate('new Promise(resolve => { if (document.readyState === "complete") resolve(); else addEventListener("load", resolve, {once:true}); })');
    const row = await evaluate(`(async () => {
      const scenario = ${JSON.stringify(scenario)};
      if (${zoomPass}) Object.assign(scenario,{width:innerWidth,height:innerHeight,dpr:devicePixelRatio,sidebarLeft:innerWidth-491,zoom:${zoom},baseDpr:${baseDpr},visualViewportScale:visualViewport.scale});
      document.body.style.cssText = 'margin:0;background:#302e2b;color:white;font:16px Arial;min-height:100vh';
      document.body.innerHTML = '<div class="board" style="position:absolute;left:200px;top:66px;width:400px;height:400px"></div><aside class="board-layout-sidebar" id="board-layout-sidebar"><h2>New Game</h2><button>Start Game</button><p>Custom Challenge</p><p>Play a Friend</p><p>Tournaments</p></aside>';
      const sidebar = document.querySelector('aside');
      document.querySelector('.board').style.left = (scenario.sidebarLeft - 432)+'px';
      sidebar.style.cssText = 'box-sizing:border-box;position:absolute;top:16px;padding:24px;border-radius:8px;background:#262421;left:'+scenario.sidebarLeft+'px;width:'+scenario.sidebarWidth+'px;height:'+(scenario.height-32)+'px';
      const _ghostModeActive = false; const SERVER_URL = 'http://127.0.0.1:5050';
      ${boardResolvers}
      ${controller}
      document.body.insertAdjacentHTML('beforeend', ${markup});
      const banner = document.getElementById('thinker-chess-banner');
      const image = banner.querySelector('img, svg');
      if (image.decode) await image.decode();
      await document.fonts.ready;
      thinkerBannerResizeObserver = new ResizeObserver(() => positionThinkerBannerShell());
      positionThinkerBannerShell();
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const box = node => { const r=node.getBoundingClientRect(); return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom}; };
      const b = box(banner), s = box(sidebar), art=box(image);
      const shown = getComputedStyle(banner).display !== 'none';
      const vector = image.tagName.toLowerCase() === 'svg';
      const title = banner.querySelector('.tc-banner-title');
      const titleBox = title ? box(title) : null;
      const glyph = vector && shown ? image.querySelector(':scope > g') : null;
      const glyphBox = glyph?.getBBox();
      const matrix = glyph?.getScreenCTM();
      let symbol = glyphBox ? {x:matrix.a*glyphBox.x+matrix.e,y:matrix.d*glyphBox.y+matrix.f,width:matrix.a*glyphBox.width,height:matrix.d*glyphBox.height} : null;
      const expressive = image.dataset.artwork === 'banner-horse.webp';
      let alphaCorners = null;
      if (expressive && shown) {
        const canvas = document.createElement('canvas');canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;
        const paint=canvas.getContext('2d');paint.drawImage(image,0,0);const data=paint.getImageData(0,0,canvas.width,canvas.height).data;
        let minX=canvas.width,minY=canvas.height,maxX=0,maxY=0;
        for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++)if(data[(y*canvas.width+x)*4+3]>0){minX=Math.min(minX,x);maxX=Math.max(maxX,x+1);minY=Math.min(minY,y);maxY=Math.max(maxY,y+1);}
        symbol={x:art.x+minX*art.width/canvas.width,y:art.y+minY*art.height/canvas.height,width:(maxX-minX)*art.width/canvas.width,height:(maxY-minY)*art.height/canvas.height};
        alphaCorners=[data[3],data[(canvas.width-1)*4+3],data[((canvas.height-1)*canvas.width)*4+3],data[data.length-1]];
      }
      const titleStyle = title ? getComputedStyle(title) : null;
      const luminance = rgb => {const a=rgb.map(n=>n/255).map(n=>n<=.04045?n/12.92:((n+.055)/1.055)**2.4);return .2126*a[0]+.7152*a[1]+.0722*a[2];};
      const contrast = titleStyle ? (luminance(titleStyle.color.match(/[0-9.]+/g).slice(0,3).map(Number))+.05)/(luminance([37,37,35])+.05) : null;
      const result = { ...scenario, shown, banner:b, sidebar:s, artwork:art, vector, expressive, alphaCorners, native:vector?null:{width:image.naturalWidth,height:image.naturalHeight}, deltaTop:shown?b.y-s.y:null, deltaBottom:shown?b.bottom-s.bottom:null, physicalScale:shown&&!vector?art.width*devicePixelRatio/image.naturalWidth:null, aspectError:shown?(vector?Math.abs(matrix.a-matrix.d):Math.abs(art.width/art.height-image.naturalWidth/image.naturalHeight)):null, overlap:shown?Math.max(0,s.right-b.x):0, horizontalOverflow:document.documentElement.scrollWidth>innerWidth, integerCard:!shown||[b.x,b.y,b.width,b.height].every(Number.isInteger), pointerEvents:getComputedStyle(banner).pointerEvents, textNodes:banner.innerText, title:titleBox, symbol, contrast, font:titleStyle?{family:titleStyle.fontFamily,size:titleStyle.fontSize,weight:titleStyle.fontWeight,spacing:titleStyle.letterSpacing,lineHeight:titleStyle.lineHeight,color:titleStyle.color}:null, appearance:{background:getComputedStyle(banner).backgroundColor,border:getComputedStyle(banner).borderTopColor,radius:getComputedStyle(banner).borderRadius,shadow:getComputedStyle(banner).boxShadow,filter:getComputedStyle(banner).filter}, imageRendering:getComputedStyle(image).imageRendering, objectFit:getComputedStyle(image).objectFit, transform:getComputedStyle(image).transform };
      if (title && shown) {
        const range = document.createRange();range.selectNodeContents(title);
        result.titleLines = Array.from(range.getClientRects()).map(r=>({x:r.x,y:r.y,right:r.right,bottom:r.bottom}));
        const group=title.parentElement.getBoundingClientRect();
        result.group={x:group.x,y:group.y,width:group.width,height:group.height};
        result.groupCenterOffset={x:group.x+group.width/2-(b.x+b.width/2),y:group.y+group.height/2-(b.y+b.height/2)};
        const visualTop=Math.min(symbol.y,...result.titleLines.map(r=>r.y));
        const visualBottom=Math.max(symbol.y+symbol.height,...result.titleLines.map(r=>r.bottom));
        result.visibleCenterOffsetY=(visualTop+visualBottom)/2-(b.y+b.height/2);
        result.textWidth=Math.max(...result.titleLines.map(r=>r.right-r.x));
        result.textUsefulRatio=result.textWidth/titleBox.width;
        result.gap=parseFloat(getComputedStyle(title.parentElement).rowGap);
      }
      sidebar.style.height = (scenario.height-80)+'px';
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      result.resizeDelta = shown ? box(banner).bottom-box(sidebar).bottom : null;
      window.fixturePositionBanner = positionThinkerBannerShell;
      sidebar.style.height = (scenario.height-32)+'px';
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      return result;
    })()`);
    const clipX = Math.max(0, row.sidebarLeft - 8);
    const screenshot = await call('Page.captureScreenshot', { format: 'png', clip: { x: clipX, y: 0, width: row.width - clipX, height: row.height, scale: 1 }, captureBeyondViewport: false });
    row.screenshot = `${row.width}x${row.height}-dpr${row.dpr}.png`;
    await writeFile(join(output, captureFolder, row.screenshot), Buffer.from(screenshot.data, 'base64'));
    results.push(row);
  }
  if (phase === 'after' && !zoomPass) {
    await call('Emulation.setDeviceMetricsOverride', { width:1440, height:900, deviceScaleFactor:1, mobile:false });
    const boundary = await evaluate(`(async () => {
      const sidebar = document.querySelector('aside');
      const board = document.querySelector('.board');
      const banner = document.getElementById('thinker-chess-banner');
      sidebar.style.cssText += ';left:1023px;width:300px;height:868px';
      board.style.left = '591px';
      window.fixturePositionBanner();
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const image = banner.querySelector('img, svg'); const b=banner.getBoundingClientRect(); const art=image.getBoundingClientRect();
      const title = banner.querySelector('.tc-banner-title');
      const range=document.createRange();if(title)range.selectNodeContents(title);
      const lines=title?Array.from(range.getClientRects()):[];
      const min={shown:getComputedStyle(banner).display!=='none',width:b.width,top:b.top,bottom:b.bottom,scale:art.width/image.naturalWidth,titleLeft:title?Math.min(...lines.map(r=>r.x))-b.left:art.left+412*art.width/image.naturalWidth-b.left,titleRight:title?b.right-Math.max(...lines.map(r=>r.right)):b.right-art.left-710*art.width/image.naturalWidth,titleHeight:title?.getBoundingClientRect().height||null,artwork:{x:art.x,y:art.y,width:art.width,height:art.height}};
      sidebar.style.left='1024px'; board.style.left='592px'; window.fixturePositionBanner();
      const belowShown = getComputedStyle(banner).display !== 'none';
      sidebar.style.left='1023px'; board.style.left='591px'; window.fixturePositionBanner();
      return { min, belowShown };
    })()`);
    assert.equal(boundary.min.shown, true);
    assert.equal(boundary.min.width, 96);
    assert.ok(boundary.min.titleLeft >= 1 && boundary.min.titleRight >= 1);
    assert.equal(boundary.belowShown, false);
    if (titlePass) {
      boundary.widthSweep=await evaluate(`(() => {
        const rows=[];const sidebar=document.querySelector('aside');const board=document.querySelector('.board');
        const banner=document.getElementById('thinker-chess-banner');const title=banner.querySelector('.tc-banner-title');
        for(let width=96;width<=170;width++){
          sidebar.style.left=(1119-width)+'px';board.style.left=(687-width)+'px';window.fixturePositionBanner();
          const rect=banner.getBoundingClientRect(),r=document.createRange();r.selectNodeContents(title);
          const lines=Array.from(r.getClientRects());
          rows.push({width:rect.width,lines:lines.length,fontSize:getComputedStyle(title).fontSize,insetLeft:Math.min(...lines.map(r=>r.left))-rect.left,insetRight:rect.right-Math.max(...lines.map(r=>r.right)),height:title.getBoundingClientRect().height});
        }
        sidebar.style.left='1023px';board.style.left='591px';window.fixturePositionBanner();
        return rows;
      })()`);
      for(const row of boundary.widthSweep) assert.ok(row.insetLeft>=12 && row.insetRight>=12,'Width sweep text clipping');
      boundary.firstSingleLineWidth=boundary.widthSweep.find(row=>row.lines===1)?.width;
    }
    await writeFile(join(output, 'boundary.json'), JSON.stringify(boundary, null, 2)+'\n');
    const screenshot = await call('Page.captureScreenshot', { format:'png', clip:{x:1015,y:0,width:425,height:900,scale:1}, captureBeyondViewport:false });
    await writeFile(join(output, 'minimum-96px.png'), Buffer.from(screenshot.data,'base64'));
  }
  await writeFile(join(output, `${captureFolder}.json`), JSON.stringify({ phase, provenance:zoomPass?'Actual Chromium default browser zoom set in a temporary test profile, no CSS zoom/transform or page-scale emulation':'Chromium replay of production banner code using 15 sidebar geometries measured on real, logged-out Chess.com; no installed Tampermonkey session', cases:results }, null, 2)+'\n');
  if (phase === 'after') {
    assert.equal(results.length, zoomPass ? 1 : 30);
    for (const row of results) {
      assert.equal(row.shown, zoomPass || row.width !== 1024, `visibility ${row.screenshot}`);
      if (zoomPass) {
        assert.ok(Math.abs(row.dpr/baseDpr-zoom)<.001, `browser zoom not applied: DPR ${row.dpr}`);
        assert.equal(row.visualViewportScale,1,'Pinch zoom must not substitute desktop browser zoom');
      }
      assert.equal(row.overlap, 0, `overlap ${row.screenshot}`);
      assert.equal(row.horizontalOverflow, false, `horizontal overflow ${row.screenshot}`);
      if (!zoomPass) assert.equal(row.integerCard, true, `fractional card ${row.screenshot}`);
      assert.equal(row.pointerEvents, 'none');
      assert.equal(row.imageRendering, 'auto');
      if (!row.shown) continue;
      assert.equal(row.deltaTop, 0);
      assert.equal(row.deltaBottom, 0);
      assert.equal(row.resizeDelta, 0);
      if (row.vector || row.expressive) {
        if (titlePass) {
          assert.ok(Math.abs(row.groupCenterOffset.x)<8 && Math.abs(row.groupCenterOffset.y)<8);
          assert.ok(Math.abs(row.visibleCenterOffsetY)<8);
          assert.ok(Object.values(row.group).every(Number.isInteger));
          assert.equal(row.titleLines.length,1);
          assert.ok(row.textUsefulRatio>=.75 && row.textUsefulRatio<=.85);
          assert.ok(row.gap/parseFloat(row.font.size)>=.5 && row.gap/parseFloat(row.font.size)<=.7);
        }
        assert.ok(row.contrast >= 4.5);
        assert.ok(row.artwork.width <= row.banner.width*.6);
        assert.ok(row.artwork.height <= row.banner.height*.34);
        if (!zoomPass) assert.ok([row.artwork.x,row.artwork.y,row.artwork.width,row.artwork.height,row.title.x,row.title.y,row.title.width,row.title.height].every(Number.isInteger), `fractional content ${row.screenshot}`);
        assert.ok(row.symbol.x>=row.banner.x+12 && row.symbol.x+row.symbol.width<=row.banner.right-12);
        assert.ok(row.symbol.y>=row.banner.y+12 && row.symbol.y+row.symbol.height<=row.banner.bottom-12);
        for(const line of row.titleLines) assert.ok(line.x>=row.banner.x+12 && line.right<=row.banner.right-12 && line.y>=row.banner.y+12 && line.bottom<=row.banner.bottom-12);
        assert.equal(row.appearance.background, 'rgb(37, 37, 35)');
        assert.equal(row.appearance.border, 'rgb(58, 58, 54)');
        assert.equal(row.appearance.shadow, 'none');
        assert.equal(row.appearance.filter, 'none');
        assert.equal(row.font.weight, row.expressive ? '700' : '600');
        assert.equal(row.font.color, row.expressive ? 'rgb(255, 255, 255)' : 'rgb(222, 222, 217)');
        assert.equal(row.appearance.radius, '8px');
        assert.equal(row.textNodes, row.expressive ? 'Thinker Chess' : 'THINKER CHESS');
        if (row.expressive) {
          assert.ok(row.physicalScale <= 1);
          assert.ok(row.artwork.height * row.dpr <= row.native.height);
          assert.deepEqual(row.alphaCorners, [0,0,0,0]);
          assert.equal(row.objectFit, 'contain');
          assert.equal(row.transform, 'none');
        }
      } else {
        assert.ok(row.physicalScale <= 1);
        assert.ok(row.artwork.height * row.dpr / row.native.height <= 1);
      }
      assert.ok(row.aspectError < 0.0001, `aspect ${row.screenshot}`);
    }
  }
  console.table(results.map(row => ({ viewport:`${row.width}×${row.height}`, dpr:row.dpr, shown:row.shown, x:row.banner.x, w:row.banner.width, h:row.banner.height, overlap:row.overlap, scale:row.physicalScale?.toFixed(3), top:row.deltaTop, bottom:row.deltaBottom, resize:row.resizeDelta })));
  socket.close();
} finally { chrome.kill(); server.close(); }
