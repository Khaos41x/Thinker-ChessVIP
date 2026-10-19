const DEFAULT_OPTIONS = new Map([
  ['Threads', '1'],
  ['Hash', '16'],
  ['MultiPV', '1'],
]);

export const UCI_SEARCH_STATES = Object.freeze(['idle', 'searching', 'stopping', 'completed']);

const SEARCH_TRANSITIONS = Object.freeze({
  idle: new Set(['searching']),
  searching: new Set(['stopping', 'completed']),
  stopping: new Set(['completed']),
  completed: new Set(['idle', 'searching']),
});

export function parseInfoLine(command, whiteToMove = true) {
  const parts = command.trim().split(/\s+/);
  if (parts[0] !== 'info') return null;

  const info = { pv: [], multipv: 1 };
  for (let index = 1; index < parts.length; index += 1) {
    const key = parts[index];
    if (key === 'depth') info.depth = Number(parts[++index]);
    else if (key === 'seldepth') info.seldepth = Number(parts[++index]);
    else if (key === 'nodes') info.nodes = Number(parts[++index]);
    else if (key === 'nps') info.nps = Number(parts[++index]);
    else if (key === 'time') info.time = Number(parts[++index]);
    else if (key === 'multipv') info.multipv = Number(parts[++index]);
    else if (key === 'score') {
      const scoreType = parts[++index];
      const scoreValue = Number(parts[++index]);
      const perspective = whiteToMove ? 1 : -1;
      if (scoreType === 'cp') info.cp = scoreValue * perspective;
      if (scoreType === 'mate') info.mate = scoreValue * perspective;
      if (parts[index + 1] === 'lowerbound' || parts[index + 1] === 'upperbound') {
        info.bound = parts[++index];
      }
    } else if (key === 'pv') {
      info.pv = parts.slice(index + 1);
      break;
    }
  }

  if (!Number.isFinite(info.depth) || (!Number.isFinite(info.cp) && !Number.isFinite(info.mate))) {
    return null;
  }
  return info;
}

export class UciProtocol {
  constructor({
    onEvaluation = () => {},
    onSearchComplete = () => {},
    onSearchState = () => {},
    onState = () => {},
    onError = () => {},
  } = {}) {
    this.onEvaluation = onEvaluation;
    this.onSearchComplete = onSearchComplete;
    this.onSearchState = onSearchState;
    this.onState = onState;
    this.onError = onError;
    this.options = new Map(DEFAULT_OPTIONS);
    this.send = null;
    this.ready = false;
    this.active = null;
    this.pending = null;
    this.configuring = null;
    this.readyWaiters = [];
    this.stopTimer = null;
    this.lines = new Map();
    this.engineName = 'Stockfish';
    this.searchState = 'idle';
  }

  connect(send) {
    this.send = send;
    this.onState('loading');
    this.send('uci');
  }

  disconnect() {
    clearTimeout(this.stopTimer);
    this.stopTimer = null;
    for (const waiter of this.readyWaiters) {
      clearTimeout(waiter.timer);
      waiter.reject(new Error('Engine desconectada'));
    }
    this.readyWaiters = [];
    this.send = null;
    this.ready = false;
    this.active = null;
    this.pending = null;
    this.configuring = null;
    this.lines.clear();
    this.options = new Map(DEFAULT_OPTIONS);
    this.searchState = 'idle';
    this.onSearchState('idle');
    this.onState('idle');
  }

  setOption(name, value) {
    const normalized = String(value);
    if (!this.send || this.options.get(name) === normalized) return;
    this.send(`setoption name ${name} value ${normalized}`);
    this.options.set(name, normalized);
  }

  compute(work) {
    this.pending = work ?? null;
    if (this.active) {
      this.requestStop();
      return;
    }
    this.configurePending();
  }

  stop() {
    this.pending = null;
    this.configuring = null;
    if (this.active) this.requestStop();
    else if (this.searchState === 'completed') this.transitionSearch('idle');
  }

  waitUntilReady(timeout = 15000) {
    if (this.ready) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const waiter = { resolve, reject, timer: null };
      waiter.timer = setTimeout(() => {
        this.readyWaiters = this.readyWaiters.filter(candidate => candidate !== waiter);
        reject(new Error('Tempo esgotado durante a inicialização UCI'));
      }, timeout);
      this.readyWaiters.push(waiter);
    });
  }

  receive(command) {
    const line = String(command).trim();
    const parts = line.split(/\s+/);
    if (!line) return;

    if (parts[0] === 'id' && parts[1] === 'name') {
      this.engineName = parts.slice(2).join(' ');
      return;
    }
    if (parts[0] === 'uciok') {
      this.send?.('setoption name UCI_AnalyseMode value true');
      this.send?.('ucinewgame');
      this.send?.('isready');
      return;
    }
    if (parts[0] === 'readyok') {
      this.ready = true;
      for (const waiter of this.readyWaiters) {
        clearTimeout(waiter.timer);
        waiter.resolve();
      }
      this.readyWaiters = [];
      if (this.configuring) {
        const work = this.configuring;
        this.configuring = null;
        if (this.pending) {
          this.configurePending();
          return;
        }
        this.startWork(work);
      } else {
        if (this.pending) this.configurePending();
        else this.onState('idle');
      }
      return;
    }
    if (parts[0] === 'bestmove') {
      if (!this.active || !['searching', 'stopping'].includes(this.searchState)) return;
      clearTimeout(this.stopTimer);
      this.stopTimer = null;
      const completed = this.active;
      const cancelled = completed.stopRequested || this.searchState === 'stopping';
      const lines = [...this.lines.values()].sort((a, b) => a.multipv - b.multipv);
      this.active = null;
      this.transitionSearch('completed');
      if (!cancelled) {
        this.onSearchComplete({
          searchId: completed.searchId,
          bestmove: parts[1] === '(none)' ? null : parts[1] ?? null,
          lines,
        });
      }
      if (this.pending) this.configurePending();
      else {
        this.transitionSearch('idle');
        this.onState('idle');
      }
      return;
    }
    if (parts[0] === 'info' && this.active && this.searchState === 'searching' && !this.active.stopRequested) {
      const parsed = parseInfoLine(line, this.active.whiteToMove);
      if (!parsed || parsed.bound) return;
      if ((this.lines.get(parsed.multipv)?.depth ?? -1) > parsed.depth) return;
      this.lines.set(parsed.multipv, parsed);
      const lines = [...this.lines.values()].sort((a, b) => a.multipv - b.multipv);
      this.onEvaluation({ searchId: this.active.searchId, ...parsed, lines });
      return;
    }
    if (/error/i.test(line) && !line.startsWith('option')) this.onError(new Error(line));
  }

  configurePending() {
    if (!this.send || !this.ready || this.active || this.configuring || !this.pending) return;
    const work = this.pending;
    this.pending = null;
    this.setOption('Threads', work.threads);
    this.setOption('Hash', work.hashSize);
    this.setOption('MultiPV', work.multiPv);
    this.configuring = work;
    this.ready = false;
    this.send('isready');
  }

  startWork(work) {
    if (!this.send) return;
    this.active = { ...work, stopRequested: false };
    this.lines.clear();
    this.transitionSearch('searching');
    this.send(`position fen ${work.fen}`);
    this.send(`go movetime ${work.movetime}`);
    this.onState('computing');
  }

  requestStop() {
    if (!this.active || this.active.stopRequested) return;
    this.active.stopRequested = true;
    this.transitionSearch('stopping');
    this.send?.('stop');
    clearTimeout(this.stopTimer);
    this.stopTimer = setTimeout(() => {
      this.stopTimer = null;
      this.onError(new Error('A engine não confirmou a interrupção da busca'));
    }, 5000);
  }

  transitionSearch(next) {
    if (next === this.searchState) return;
    if (!SEARCH_TRANSITIONS[this.searchState]?.has(next)) {
      throw new Error(`Invalid UCI search transition: ${this.searchState} -> ${next}`);
    }
    this.searchState = next;
    this.onSearchState(next);
  }
}
