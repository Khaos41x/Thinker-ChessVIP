import { Chess } from 'chess.js';

function moveRecord(move, fen) {
  const moveNumber = Number(move.before.split(' ')[5]);
  return {
    fen,
    san: move.san,
    uci: `${move.from}${move.to}${move.promotion ?? ''}`,
    color: move.color,
    moveNumber,
  };
}

function findKing(chess, color) {
  for (const rank of chess.board()) {
    for (const piece of rank) {
      if (piece?.type === 'k' && piece.color === color) return piece.square;
    }
  }
  return null;
}

function assertLegalPosition(chess) {
  const sideToMove = chess.turn();
  const sideThatMoved = sideToMove === 'w' ? 'b' : 'w';
  const king = findKing(chess, sideThatMoved);
  if (!king || chess.isAttacked(king, sideToMove)) {
    throw new Error('A posição FEN é estruturalmente válida, mas ilegal');
  }
}

export class ChessSession {
  constructor() {
    this.headers = {};
    this.states = [{ fen: new Chess().fen(), san: null, uci: null, color: null, moveNumber: 0 }];
    this.index = 0;
  }

  get current() {
    return this.states[this.index];
  }

  get totalPlies() {
    return this.states.length - 1;
  }

  get chess() {
    return new Chess(this.current.fen);
  }

  loadFen(fen) {
    const next = new Chess(fen.trim());
    assertLegalPosition(next);
    this.headers = {};
    this.states = [{ fen: next.fen(), san: null, uci: null, color: null, moveNumber: 0 }];
    this.index = 0;
    return this.current;
  }

  loadPgn(pgn) {
    const parsed = new Chess();
    parsed.loadPgn(pgn.trim(), { strict: false });
    const moves = parsed.history({ verbose: true });
    if (!moves.length) throw new Error('O PGN não contém lances válidos');
    const headers = parsed.getHeaders();
    const initialFen = headers.FEN || new Chess().fen();
    const replay = new Chess(initialFen);
    assertLegalPosition(replay);
    const states = [{ fen: replay.fen(), san: null, uci: null, color: null, moveNumber: 0 }];
    for (const move of moves) {
      const played = replay.move({ from: move.from, to: move.to, promotion: move.promotion });
      states.push(moveRecord(played, replay.fen()));
    }
    this.headers = headers;
    this.states = states;
    this.index = states.length - 1;
    return this.current;
  }

  play(move) {
    const board = this.chess;
    const played = board.move(move);
    if (!played) throw new Error('Lance ilegal');
    this.states = this.states.slice(0, this.index + 1);
    this.states.push(moveRecord(played, board.fen()));
    this.index = this.states.length - 1;
    return this.current;
  }

  goTo(index) {
    const target = Math.trunc(Number(index));
    const bounded = Math.max(0, Math.min(this.totalPlies, target));
    this.index = Number.isFinite(bounded) ? bounded : this.index;
    return this.current;
  }

  navigate(direction) {
    if (direction === 'first') return this.goTo(0);
    if (direction === 'prev') return this.goTo(this.index - 1);
    if (direction === 'next') return this.goTo(this.index + 1);
    if (direction === 'last') return this.goTo(this.totalPlies);
    return this.current;
  }
}
