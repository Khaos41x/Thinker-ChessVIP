import '../src/ui/eval-bar.css';
import { createUserscriptEvalBar, type EvalRequest } from '../../frontend/eval_bar/userscript-adapter';

async function runEngineSwitchIntegration(serverUrl: string, token: string) {
  history.replaceState({}, '', '/analysis/engine-switch');
  const board = document.createElement('wc-chess-board');
  const fen = 'r2q1rk1/pp1bbppp/2np1n2/2p1p3/4P3/2NP1N2/PPPQBPPP/R1B1K2R w KQ - 4 9';
  Object.assign(board.style, { display: 'block', width: '600px', height: '600px', margin: '60px' });
  document.body.append(board);
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  let state: any = null;
  let currentScoreEngine = '';
  const accepted: string[] = [];
  const transport = (request: EvalRequest) => {
    const identity = {engineId: state.activeEngineId, selectionGeneration: state.selectionGeneration};
    const requestId = `switch:${request.requestId}`;
    const abort = new AbortController();
    fetch(`${serverUrl}/eval-bar/stream`, {method: 'POST', headers, signal: abort.signal,
      body: JSON.stringify({...identity, fen, requestId, generation: request.generation, cacheContext: request.cacheContext, context: 'analysis'})
    }).then(async response => {
      if (!response.ok || !response.body) throw new Error(`HTTP ${response.status}`);
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const {done, value} = await reader.read();
        buffer += decoder.decode(value, {stream: !done});
        const lines = buffer.split('\n'); buffer = lines.pop() || '';
        for (const line of lines) {
          if (!line) continue;
          const item = JSON.parse(line);
          if (item.engineId !== identity.engineId || item.selectionGeneration !== identity.selectionGeneration || item.fen !== fen || item.cacheContext !== request.cacheContext) throw new Error('Engine identity contamination');
          if (item.type === 'info' || item.type === 'result') {
            if (!abort.signal.aborted && state.activeEngineId === identity.engineId) {
              currentScoreEngine = identity.engineId;
              accepted.push(identity.engineId);
            }
          }
          if (item.type === 'info' || item.type === 'started') request.onProgress(item);
          else if (item.type === 'result') request.onResult(item);
          else throw new Error(item.error || item.type);
        }
        if (done) break;
      }
    }).catch(error => { if (error.name !== 'AbortError') request.onError(error); });
    return {abort() {abort.abort(); void fetch(`${serverUrl}/eval-bar/cancel`, {method:'POST', headers, body:JSON.stringify({requestId})});}};
  };
  const adapter = createUserscriptEvalBar({window,document,getFen:()=>fen,getBoard:()=>board,
    getOrientation:()=> 'white',getCacheContext:()=>state?.cacheContext || '',authorize:()=> 'analysis',
    shouldDisplay:()=>true,requestEvaluation:transport,pollIntervalMs:60000,refreshIntervalMs:60000});
  let rail: Element | null = null;
  let geometry: DOMRect | null = null;
  const results = [];
  const transforms = new Set<string>();
  for (const engineId of ['stockfish-19-1mb','stockfish-19-94mb','komodo-14.1','stockfish-19-1mb']) {
    const response=await fetch(`${serverUrl}/eval-bar/engines/select`, {method:'POST',headers,body:JSON.stringify({engineId,context:'analysis'})});
    state=await response.json();
    if(!response.ok) throw new Error(state.error);
    currentScoreEngine='';
    if(!rail) adapter.start(true); else adapter.pollNow();
    const deadline=performance.now()+12000;
    while(performance.now()<deadline && currentScoreEngine!==engineId) await new Promise(resolve=>requestAnimationFrame(resolve));
    if(currentScoreEngine!==engineId) throw new Error('Missing real engine score '+engineId);
    const root=document.querySelector('.thinker-eval-v2-rail')!;
    if(rail && root!==rail) throw new Error('Eval Bar DOM rebuilt');
    rail=root;
    const rect=root.getBoundingClientRect();
    if(geometry && (geometry.width!==rect.width || geometry.height!==rect.height || geometry.top!==rect.top)) throw new Error('Geometry changed');
    geometry=rect;
    for(let i=0;i<24;i++) {
      await new Promise(resolve=>requestAnimationFrame(resolve));
      transforms.add(root.querySelector<HTMLElement>('.thinker-eval-v2-fill')!.style.transform);
    }
    results.push({engineId,score:adapter.snapshot().lastEvaluation,geometry:{width:rect.width,height:rect.height,top:rect.top}});
  }
  const diagnostics=adapter.snapshot();
  adapter.destroy();board.remove();
  return {results,accepted,domPreserved:true,geometryPreserved:true,scaleYOnly:[...transforms].every(x=>/^scaleY\(/.test(x)),smoothFrames:transforms.size,mountCount:diagnostics.mountCount};
}
Object.assign(globalThis,{runEngineSwitchIntegration});
