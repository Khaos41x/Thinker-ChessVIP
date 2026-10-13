import { Chess } from 'chess.js';

const UCI_MOVE = /^[a-h][1-8][a-h][1-8][qrbn]?$/;

export const recommendationBrushes = {
  green: { key: 'best', color: '#629924', opacity: 0.82, lineWidth: 9 },
  blue: { key: 'reply', color: '#4b96d1', opacity: 0.48, lineWidth: 7 },
};

const SIDE_NAMES = { w: 'Brancas', b: 'Pretas' };

export function legalDestinations(chess) {
  const destinations = new Map();
  for (const move of chess.moves({ verbose: true })) {
    const targets = destinations.get(move.from) ?? [];
    if (!targets.includes(move.to)) targets.push(move.to);
    destinations.set(move.from, targets);
  }
  return destinations;
}

export function lastMoveSquares(uci) {
  if (!UCI_MOVE.test(uci ?? '')) return undefined;
  return [uci.slice(0, 2), uci.slice(2, 4)];
}

export function promotionForMove(chess, from, to) {
  const piece = chess.get(from);
  return piece?.type === 'p' && ['1', '8'].includes(to[1]) ? 'q' : undefined;
}

export function projectPrimaryPv(fen, pv) {
  let chess;
  try {
    chess = new Chess(fen);
  } catch {
    return { moves: [], shapes: [] };
  }

  const moves = [];
  const shapes = [];
  for (const [index, uci] of (Array.isArray(pv) ? pv : []).slice(0, 2).entries()) {
    if (!UCI_MOVE.test(uci)) break;
    let played;
    try {
      played = chess.move({
        from: uci.slice(0, 2),
        to: uci.slice(2, 4),
        promotion: uci[4],
      });
    } catch {
      break;
    }
    if (!played) break;
    moves.push({ uci, san: played.san, color: played.color, side: SIDE_NAMES[played.color] });
    shapes.push({
      orig: uci.slice(0, 2),
      dest: uci.slice(2, 4),
      brush: index === 0 ? 'green' : 'blue',
    });
  }
  return { moves, shapes };
}

export function guidanceForPosition(fen, projected) {
  let turn = 'w';
  try {
    turn = new Chess(fen).turn();
  } catch {
    return { currentPrefix: 'Brancas agora', currentSan: null, replyPrefix: 'Pretas depois', replySan: null };
  }
  const currentSide = SIDE_NAMES[turn];
  const replySide = SIDE_NAMES[turn === 'w' ? 'b' : 'w'];
  const current = projected.moves[0];
  const reply = projected.moves[1];
  return {
    currentPrefix: `${current?.side ?? currentSide} agora`,
    currentSan: current?.san ?? null,
    replyPrefix: current ? `${reply?.side ?? replySide} depois de ${current.san}` : `${replySide} depois`,
    replySan: reply?.san ?? null,
  };
}

export function chessgroundConfig(chess, { focusSquare, lastMove, onMove, orientation = 'white', shapes = [] } = {}) {
  const turnColor = chess.turn() === 'w' ? 'white' : 'black';
  return {
    fen: chess.fen(),
    orientation,
    turnColor,
    check: chess.isCheck(),
    lastMove: lastMoveSquares(lastMove),
    coordinates: true,
    coordinatesOnSquares: false,
    highlight: {
      lastMove: true,
      check: true,
      custom: focusSquare ? new Map([[focusSquare, 'keyboard-focus']]) : new Map(),
    },
    animation: { enabled: true, duration: 180 },
    movable: {
      free: false,
      color: turnColor,
      dests: legalDestinations(chess),
      showDests: true,
      rookCastle: true,
      events: { after: onMove },
    },
    premovable: { enabled: false },
    draggable: { enabled: true, showGhost: true },
    selectable: { enabled: true },
    drawable: {
      enabled: false,
      visible: true,
      eraseOnMovablePieceClick: false,
      autoShapes: shapes,
      brushes: recommendationBrushes,
    },
  };
}
