import { describe, expect, it } from 'vitest';
import { Chess } from 'chess.js';
import { chessgroundConfig, guidanceForPosition, lastMoveSquares, legalDestinations, projectPrimaryPv, promotionForMove } from '../src/board-adapter.js';

describe('board adapter', () => {
  it('maps legal moves into Chessground destinations', () => {
    const destinations = legalDestinations(new Chess());
    expect(destinations.get('e2')).toEqual(['e3', 'e4']);
    expect(destinations.get('b1')).toEqual(['a3', 'c3']);
    expect(destinations.has('e7')).toBe(false);
  });

  it('exposes turn, check, last move, and promotion destinations', () => {
    const chess = new Chess('4k3/P7/8/8/8/8/8/4K3 w - - 0 1');
    const config = chessgroundConfig(chess, { lastMove: 'e8e7' });
    expect(config.turnColor).toBe('white');
    expect(config.check).toBe(false);
    expect(config.lastMove).toEqual(['e8', 'e7']);
    expect(config.movable.dests.get('a7')).toEqual(['a8']);
    expect(promotionForMove(chess, 'a7', 'a8')).toBe('q');
    expect(promotionForMove(chess, 'e1', 'e2')).toBeUndefined();

    const checked = chessgroundConfig(new Chess('4k3/8/8/8/8/8/4R3/4K3 b - - 0 1'));
    expect(checked.check).toBe(true);
  });

  it('preserves explicit orientation across refreshed configurations', () => {
    const config = chessgroundConfig(new Chess(), { orientation: 'black' });
    expect(config.orientation).toBe('black');
  });

  it('delegates castling, en passant, and pin constraints to chess.js', () => {
    const castling = legalDestinations(new Chess('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1'));
    expect(castling.get('e1')).toEqual(expect.arrayContaining(['c1', 'g1']));

    const enPassantGame = new Chess();
    for (const move of ['e4', 'a6', 'e5', 'd5']) enPassantGame.move(move);
    expect(legalDestinations(enPassantGame).get('e5')).toContain('d6');

    const pinned = legalDestinations(new Chess('4r1k1/8/8/8/8/8/4R3/4K3 w - - 0 1'));
    expect(pinned.get('e2')).not.toContain('d2');
    expect(pinned.get('e2')).toContain('e3');
  });

  it('rejects malformed last moves', () => {
    expect(lastMoveSquares(null)).toBeUndefined();
    expect(lastMoveSquares('e2e9')).toBeUndefined();
  });

  it('projects the first two sequential legal plies from one primary PV', () => {
    const projected = projectPrimaryPv(new Chess().fen(), ['e2e4', 'e7e5', 'g1f3']);
    expect(projected.moves).toEqual([
      { uci: 'e2e4', san: 'e4', color: 'w', side: 'Brancas' },
      { uci: 'e7e5', san: 'e5', color: 'b', side: 'Pretas' },
    ]);
    expect(projected.shapes).toMatchObject([
      { orig: 'e2', dest: 'e4', brush: 'green' },
      { orig: 'e7', dest: 'e5', brush: 'blue' },
    ]);
    expect(projected.shapes.every(shape => !('label' in shape))).toBe(true);
  });

  it('omits an invalid reply and never skips ahead in the PV', () => {
    const projected = projectPrimaryPv(new Chess().fen(), ['e2e4', 'e2e3', 'e7e5']);
    expect(projected.moves).toEqual([{ uci: 'e2e4', san: 'e4', color: 'w', side: 'Brancas' }]);
    expect(projected.shapes).toHaveLength(1);
  });

  it('supports promotion and clears invalid or absent inputs', () => {
    const promotion = projectPrimaryPv('4k3/P7/8/8/8/8/8/4K3 w - - 0 1', ['a7a8q', 'e8e7']);
    expect(promotion.moves[0]).toMatchObject({ uci: 'a7a8q', san: 'a8=Q+' });
    expect(projectPrimaryPv(new Chess().fen(), []).shapes).toEqual([]);
    expect(projectPrimaryPv(new Chess().fen(), ['not-a-move']).shapes).toEqual([]);
    expect(projectPrimaryPv('invalid', ['e2e4']).shapes).toEqual([]);
  });

  it('identifies Nf6 as Black move now and Nc3 as White reply in the reported position', () => {
    const fen = 'rnbqkbnr/1ppp1pp1/p6p/4p3/2B1P3/P4Q2/1PPP1PPP/RNB1K1NR b KQkq - 1 4';
    const projected = projectPrimaryPv(fen, ['g8f6', 'b1c3']);

    expect(projected.moves).toEqual([
      { uci: 'g8f6', san: 'Nf6', color: 'b', side: 'Pretas' },
      { uci: 'b1c3', san: 'Nc3', color: 'w', side: 'Brancas' },
    ]);
    const afterDefense = new Chess(fen);
    afterDefense.move('Nf6');
    expect(afterDefense.moves({ verbose: true })).not.toContainEqual(expect.objectContaining({ from: 'f3', to: 'f7' }));
    expect(chessgroundConfig(new Chess(fen)).coordinatesOnSquares).toBe(false);
  });

  it('builds explicit current/reply copy and clears a missing reply', () => {
    const fen = 'rnbqkbnr/1ppp1pp1/p6p/4p3/2B1P3/P4Q2/1PPP1PPP/RNB1K1NR b KQkq - 1 4';
    expect(guidanceForPosition(fen, projectPrimaryPv(fen, ['g8f6', 'b1c3']))).toEqual({
      currentPrefix: 'Pretas agora',
      currentSan: 'Nf6',
      replyPrefix: 'Brancas depois de Nf6',
      replySan: 'Nc3',
    });
    expect(guidanceForPosition(fen, projectPrimaryPv(fen, []))).toEqual({
      currentPrefix: 'Pretas agora',
      currentSan: null,
      replyPrefix: 'Brancas depois',
      replySan: null,
    });
  });
});
