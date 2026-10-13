import { Chess } from 'chess.js';

const UCI_MOVE = /^[a-h][1-8][a-h][1-8][qrbn]?$/;

export const recommendationBrushes = {
  green: { key: 'best', color: '#629924', opacity: 0.92, lineWidth: 11 },
  blue: { key: 'reply', color: '#3692e7', opacity: 0.88, lineWidth: 10 },
};

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
    moves.push({ uci, san: played.san });
    shapes.push({
      orig: uci.slice(0, 2),
      dest: uci.slice(2, 4),
      brush: index === 0 ? 'green' : 'blue',
      label: { text: String(index + 1), fill: '#ffffff' },
    });
  }
  return { moves, shapes };
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
    coordinatesOnSquares: true,
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
