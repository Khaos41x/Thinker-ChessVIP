import './styles.css';
import { ChessSession } from './chess-session.js';
import { browserEngineSupport, StockfishAdapter } from './engine/stockfish-adapter.js';

const pieces = {
  wp: '♙', wn: '♘', wb: '♗', wr: '♖', wq: '♕', wk: '♔',
  bp: '♟', bn: '♞', bb: '♝', br: '♜', bq: '♛', bk: '♚',
};

const session = new ChessSession();
const ui = Object.fromEntries([...document.querySelectorAll('[id]')].map(element => [element.id, element]));
const state = {
  orientation: 'white',
  selected: null,
  legalTargets: [],
  engineEnabled: false,
  engineState: 'idle',
  searchId: 0,
  evaluation: null,
  terminalMessage: null,
  importMode: 'pgn',
};

const adapter = new StockfishAdapter({
  onEvaluation: evaluation => {
    if (evaluation.searchId !== state.searchId) return;
    state.evaluation = evaluation;
    renderEvaluation();
  },
  onState: engineState => {
    state.engineState = engineState;
    renderEngineState();
  },
  onError: error => showEngineError(error.message),
});

function squareOrder() {
  const ranks = state.orientation === 'white' ? [8, 7, 6, 5, 4, 3, 2, 1] : [1, 2, 3, 4, 5, 6, 7, 8];
  const files = state.orientation === 'white' ? ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] : ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a'];
  return ranks.flatMap(rank => files.map(file => `${file}${rank}`));
}

function renderBoard() {
  const chess = session.chess;
  const currentMove = session.current.uci;
  const lastSquares = currentMove ? [currentMove.slice(0, 2), currentMove.slice(2, 4)] : [];
  ui.board.replaceChildren();
  for (const square of squareOrder()) {
    const file = square.charCodeAt(0) - 97;
    const rank = Number(square[1]);
    const piece = chess.get(square);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `square ${(file + rank) % 2 ? 'light' : 'dark'}`;
    button.dataset.square = square;
    button.setAttribute('role', 'gridcell');
    button.setAttribute('aria-label', piece ? `${square}, ${piece.color === 'w' ? 'branca' : 'preta'} ${piece.type}` : square);
    if (state.selected === square) button.classList.add('selected');
    if (state.legalTargets.includes(square)) button.classList.add('legal');
    if (lastSquares.includes(square)) button.classList.add('last-move');
    if (piece) {
      const token = document.createElement('span');
      token.className = `piece ${piece.color === 'w' ? 'white-piece' : 'black-piece'}`;
      token.textContent = pieces[`${piece.color}${piece.type}`];
      button.append(token);
    }
    if ((state.orientation === 'white' && square[0] === 'a') || (state.orientation === 'black' && square[0] === 'h')) {
      const rankLabel = document.createElement('span');
      rankLabel.className = 'coordinate rank-coordinate';
      rankLabel.textContent = square[1];
      button.append(rankLabel);
    }
    if ((state.orientation === 'white' && square[1] === '1') || (state.orientation === 'black' && square[1] === '8')) {
      const fileLabel = document.createElement('span');
      fileLabel.className = 'coordinate file-coordinate';
      fileLabel.textContent = square[0];
      button.append(fileLabel);
    }
    ui.board.append(button);
  }
}

function renderMoves() {
  ui['move-list'].replaceChildren();
  if (!session.totalPlies) {
    const empty = document.createElement('p');
    empty.className = 'empty-state';
    empty.textContent = 'Importe uma partida ou mova uma peça no tabuleiro.';
    ui['move-list'].append(empty);
  } else {
    const rows = [];
    for (let index = 1; index <= session.totalPlies; index += 1) {
      const record = session.states[index];
      let row = rows.at(-1);
      if (!row || row.moveNumber !== record.moveNumber) {
        row = { moveNumber: record.moveNumber, w: null, b: null };
        rows.push(row);
      }
      row[record.color] = { index, record };
    }
    for (const entry of rows) {
      const row = document.createElement('div');
      row.className = 'move-row';
      const number = document.createElement('span');
      number.className = 'move-number';
      number.textContent = `${entry.moveNumber}.`;
      row.append(number);
      for (const color of ['w', 'b']) {
        const item = entry[color];
        if (!item) {
          const placeholder = document.createElement('span');
          placeholder.className = 'move-placeholder';
          row.append(placeholder);
          continue;
        }
        const move = document.createElement('button');
        move.type = 'button';
        move.className = 'move-button';
        if (session.index === item.index) move.classList.add('active');
        move.dataset.ply = String(item.index);
        move.textContent = item.record.san;
        row.append(move);
      }
      ui['move-list'].append(row);
    }
  }
  ui['move-count'].textContent = `${session.totalPlies} ${session.totalPlies === 1 ? 'lance' : 'lances'}`;
  ui['ply-counter'].textContent = `${session.index} / ${session.totalPlies}`;
  ui['move-list'].querySelector('.active')?.scrollIntoView({ block: 'nearest' });
}

function formatCompact(value) {
  if (!Number.isFinite(value)) return '—';
  return new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
}

function scoreLabel(evaluation, precise = false) {
  if (!evaluation) return precise ? '0.00' : '0.0';
  if (Number.isFinite(evaluation.mate)) return `#${evaluation.mate}`;
  const pawns = (evaluation.cp ?? 0) / 100;
  return `${pawns > 0 ? '+' : ''}${pawns.toFixed(precise ? 2 : 1)}`;
}

function pvToSan(fen, pv) {
  const board = session.chess;
  board.load(fen);
  const san = [];
  for (const uci of pv) {
    try {
      const move = board.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] });
      if (!move) break;
      san.push(move.san);
    } catch {
      break;
    }
  }
  return san.join(' ');
}

function renderEvaluation() {
  const evaluation = state.evaluation;
  const primary = evaluation?.lines?.[0] ?? evaluation;
  ui['main-eval'].textContent = scoreLabel(primary, true);
  ui['eval-score'].textContent = scoreLabel(primary);
  ui['metric-depth'].textContent = primary?.depth ?? '—';
  ui['metric-nodes'].textContent = formatCompact(primary?.nodes);
  ui['metric-nps'].textContent = formatCompact(primary?.nps);
  ui['metric-time'].textContent = Number.isFinite(primary?.time) ? `${(primary.time / 1000).toFixed(1)}s` : '—';

  let whitePercent = 50;
  if (Number.isFinite(primary?.mate)) whitePercent = primary.mate > 0 ? 100 : 0;
  else if (Number.isFinite(primary?.cp)) whitePercent = 100 / (1 + Math.exp(-primary.cp / 220));
  ui['eval-fill'].style.height = `${Math.max(2, Math.min(98, whitePercent))}%`;

  ui['pv-list'].replaceChildren();
  if (!evaluation?.lines?.length) {
    const empty = document.createElement('li');
    empty.className = 'empty-state';
    empty.textContent = state.terminalMessage ?? (state.engineEnabled ? 'Aguardando a primeira profundidade…' : 'Inicie a engine para analisar no navegador.');
    ui['pv-list'].append(empty);
    return;
  }
  for (const line of evaluation.lines) {
    const item = document.createElement('li');
    const score = document.createElement('strong');
    score.textContent = scoreLabel(line, true);
    const moves = document.createElement('span');
    moves.textContent = pvToSan(session.current.fen, line.pv);
    item.append(score, moves);
    ui['pv-list'].append(item);
  }
}

function renderEngineState() {
  const labels = {
    idle: state.engineEnabled ? adapter.name : 'Engine desligada',
    loading: 'Carregando Stockfish e NNUE',
    computing: `Analisando com ${adapter.name}`,
    error: 'Falha na engine',
  };
  ui['engine-label'].textContent = labels[state.engineState] ?? labels.idle;
  ui['engine-dot'].dataset.state = state.engineEnabled ? state.engineState : 'off';
  ui['search-state'].textContent = state.engineState === 'computing' ? 'ANALISANDO' : state.engineState === 'loading' ? 'CARREGANDO' : 'PRONTO';
  ui['search-state'].classList.toggle('working', ['loading', 'computing'].includes(state.engineState));
  ui['engine-toggle'].textContent = state.engineEnabled ? 'Parar engine' : 'Iniciar engine';
}

function renderPositionMeta() {
  const chess = session.chess;
  ui['turn-label'].textContent = chess.turn() === 'w' ? 'BRANCAS JOGAM' : 'PRETAS JOGAM';
  const matchup = session.headers.White && session.headers.Black ? `${session.headers.White} × ${session.headers.Black}` : null;
  ui['position-label'].textContent = matchup ?? (session.index ? `Após ${session.current.san}` : 'Posição inicial');
  ui['footer-fen'].textContent = session.current.fen;
}

function renderAll() {
  renderBoard();
  renderMoves();
  renderPositionMeta();
  renderEvaluation();
  renderEngineState();
}

function engineSettings() {
  const maximumThreads = Number(ui.threads.max);
  return {
    threads: Math.max(1, Math.min(maximumThreads, Number(ui.threads.value) || 1)),
    hashSize: Math.max(16, Math.min(256, Number(ui.hash.value) || 64)),
    multiPv: Math.max(1, Math.min(3, Number(ui.multipv.value) || 1)),
    movetime: Math.max(250, Math.min(30000, Number(ui.movetime.value) || 3000)),
  };
}

function analyzeCurrentPosition() {
  state.searchId += 1;
  state.evaluation = null;
  const chess = session.chess;
  state.terminalMessage = null;
  if (chess.isGameOver()) {
    adapter.stop();
    state.engineState = 'idle';
    state.terminalMessage = chess.isCheckmate() ? 'Xeque-mate. Esta posição não exige busca da engine.' : 'Partida encerrada por empate.';
    renderEvaluation();
    renderEngineState();
    return;
  }
  renderEvaluation();
  if (!state.engineEnabled || !adapter.module) return;
  adapter.analyze({
    searchId: state.searchId,
    fen: session.current.fen,
    whiteToMove: chess.turn() === 'w',
    ...engineSettings(),
  });
}

function positionChanged() {
  state.selected = null;
  state.legalTargets = [];
  renderAll();
  analyzeCurrentPosition();
}

function showEngineError(message) {
  adapter.destroy();
  state.engineState = 'error';
  state.engineEnabled = false;
  ui['engine-alert'].hidden = false;
  ui['engine-alert'].textContent = `${message}. Rode “npm run prepare:engine” e abra o site pelo servidor Vite.`;
  renderEngineState();
}

function selectSquare(square) {
  const chess = session.chess;
  const piece = chess.get(square);
  if (state.selected && state.legalTargets.includes(square)) {
    const movingPiece = chess.get(state.selected);
    const promotion = movingPiece?.type === 'p' && ['1', '8'].includes(square[1]) ? 'q' : undefined;
    session.play({ from: state.selected, to: square, promotion });
    positionChanged();
    return;
  }
  if (piece?.color === chess.turn()) {
    state.selected = square;
    state.legalTargets = chess.moves({ square, verbose: true }).map(move => move.to);
  } else {
    state.selected = null;
    state.legalTargets = [];
  }
  renderBoard();
}

async function toggleEngine() {
  ui['engine-alert'].hidden = true;
  if (state.engineEnabled) {
    state.engineEnabled = false;
    adapter.destroy();
    state.engineState = 'idle';
    renderEngineState();
    renderEvaluation();
    return;
  }
  ui['engine-toggle'].disabled = true;
  try {
    await adapter.boot();
    state.engineEnabled = true;
    analyzeCurrentPosition();
  } catch (error) {
    showEngineError(error.message);
  } finally {
    ui['engine-toggle'].disabled = false;
    renderEngineState();
  }
}

function setImportMode(mode) {
  state.importMode = mode;
  ui['tab-pgn'].classList.toggle('active', mode === 'pgn');
  ui['tab-fen'].classList.toggle('active', mode === 'fen');
  ui['import-value'].placeholder = mode === 'pgn' ? 'Cole uma partida em PGN...' : 'Cole uma posição FEN...';
  ui['import-error'].textContent = '';
}

function importPosition() {
  const value = ui['import-value'].value.trim();
  if (!value) {
    ui['import-error'].textContent = `Cole um ${state.importMode.toUpperCase()} antes de continuar.`;
    return;
  }
  try {
    if (state.importMode === 'pgn') session.loadPgn(value);
    else session.loadFen(value);
    ui['import-error'].textContent = '';
    ui['import-dialog'].close();
    positionChanged();
  } catch (error) {
    ui['import-error'].textContent = error.message;
  }
}

function configureCapabilities() {
  const support = browserEngineSupport();
  const cores = navigator.hardwareConcurrency || 2;
  const maximumThreads = Math.max(1, Math.min(8, Math.floor(cores / 2)));
  ui.threads.max = String(maximumThreads);
  ui.threads.value = String(Math.min(2, maximumThreads));
  const deviceMemory = Number(navigator.deviceMemory);
  const maximumHash = Number.isFinite(deviceMemory) ? (deviceMemory >= 16 ? 256 : deviceMemory >= 8 ? 128 : deviceMemory >= 4 ? 64 : 32) : 64;
  for (const option of ui.hash.options) option.disabled = Number(option.value) > maximumHash;
  ui.hash.value = String(Math.min(64, maximumHash));
  ui['isolation-badge'].textContent = support.supported ? 'WASM PRONTO' : 'SEM ISOLAMENTO';
  ui['isolation-badge'].classList.toggle('success', support.supported);
  if (!support.supported) {
    ui['engine-toggle'].disabled = true;
    ui['engine-alert'].hidden = false;
    ui['engine-alert'].textContent = `Análise indisponível: ${support.missing.join(', ')}.`;
  }
}

ui.board.addEventListener('click', event => {
  const square = event.target.closest('[data-square]')?.dataset.square;
  if (square) selectSquare(square);
});
ui['move-list'].addEventListener('click', event => {
  const ply = event.target.closest('[data-ply]')?.dataset.ply;
  if (ply !== undefined) {
    session.goTo(Number(ply));
    positionChanged();
  }
});
document.querySelector('.transport').addEventListener('click', event => {
  const direction = event.target.closest('[data-nav]')?.dataset.nav;
  if (direction) {
    session.navigate(direction);
    positionChanged();
  }
});
ui['engine-toggle'].addEventListener('click', toggleEngine);
ui['flip-board'].addEventListener('click', () => {
  state.orientation = state.orientation === 'white' ? 'black' : 'white';
  renderBoard();
});
ui['import-open'].addEventListener('click', () => ui['import-dialog'].showModal());
ui['tab-pgn'].addEventListener('click', () => setImportMode('pgn'));
ui['tab-fen'].addEventListener('click', () => setImportMode('fen'));
ui['import-submit'].addEventListener('click', importPosition);
ui['copy-fen'].addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(session.current.fen);
    ui['copy-fen'].textContent = 'OK';
  } catch {
    ui['copy-fen'].textContent = 'ERRO';
  }
  setTimeout(() => { ui['copy-fen'].textContent = 'FEN'; }, 1000);
});
for (const control of [ui.threads, ui.hash, ui.multipv, ui.movetime]) {
  control.addEventListener('change', analyzeCurrentPosition);
}
window.addEventListener('keydown', event => {
  if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName) || ui['import-dialog'].open) return;
  if (event.key === 'ArrowLeft') {
    session.navigate('prev');
    positionChanged();
  }
  if (event.key === 'ArrowRight') {
    session.navigate('next');
    positionChanged();
  }
});
window.addEventListener('beforeunload', () => adapter.destroy());

configureCapabilities();
renderAll();
