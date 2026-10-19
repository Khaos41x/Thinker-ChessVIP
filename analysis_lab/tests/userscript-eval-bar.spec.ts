import { describe, expect, it } from 'vitest';
import {
  BoundedLruCache,
  findChessComBoard,
  isValidChessFen,
  readChessComFen,
  resolveChessComEvalAuthorization,
  resolveChessComEvalPresentation,
} from '../../frontend/eval_bar/userscript-adapter';

function documentWith(nodes: unknown[] = []) {
  return {
    querySelectorAll: () => nodes,
  } as unknown as Pick<Document, 'querySelectorAll'>;
}

function visibleNode(textContent = '', gameOver = false) {
  return {
    isConnected: true,
    textContent,
    game: { isGameOver: () => gameOver },
    getAttribute: () => null,
    getBoundingClientRect: () => ({ width: 400, height: 400 }),
  };
}

function hiddenNode(textContent = 'Game Review') {
  return {
    ...visibleNode(textContent),
    getAttribute: (name: string) => name === 'aria-hidden' ? 'true' : null,
  };
}

describe('userscript Eval Bar authorization', () => {
  it('allows analysis and review routes', () => {
    expect(resolveChessComEvalAuthorization({ pathname: '/analysis/game/abc' } as Location, documentWith())).toBe('analysis');
    expect(resolveChessComEvalAuthorization({ pathname: '/game/live/abc/review' } as Location, documentWith())).toBe('analysis');
  });

  it('allows a completed game only with visible terminal evidence', () => {
    expect(resolveChessComEvalAuthorization({ pathname: '/game/live/abc' } as Location, documentWith())).toBeNull();
    expect(resolveChessComEvalAuthorization(
      { pathname: '/game/live/abc' } as Location,
      documentWith([visibleNode('Game Review', true)]),
    )).toBe('post-game');
  });

  it('fails closed on play, home and malformed routes', () => {
    for (const pathname of ['/play/online', '/', '/game/live/', '/puzzles', '/clubs/review/archive']) {
      expect(resolveChessComEvalAuthorization({ pathname } as Location, documentWith())).toBeNull();
    }
  });

  it('mounts UI on board routes but only authorizes online play after visible terminal evidence', () => {
    expect(resolveChessComEvalPresentation({ pathname: '/play/online' } as Location)).toBe(true);
    expect(resolveChessComEvalAuthorization(
      { pathname: '/play/online' } as Location,
      documentWith([visibleNode('Game Review', true)]),
    )).toBe('post-game');
    expect(resolveChessComEvalPresentation({ pathname: '/settings' } as Location)).toBe(false);
  });

  it('rejects hidden post-game evidence', () => {
    expect(resolveChessComEvalAuthorization(
      { pathname: '/game/live/abc' } as Location,
      documentWith([hiddenNode()]),
    )).toBeNull();
  });

  it('rejects stale review evidence when the selected board is still active', () => {
    expect(resolveChessComEvalAuthorization(
      { pathname: '/play/online' } as Location,
      documentWith([visibleNode('Game Review')]),
    )).toBeNull();
  });
});

describe('Chess.com board and FEN discovery', () => {
  const startFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

  function board(tagName: string, width: number, height: number, fen?: string) {
    return {
      tagName,
      isConnected: true,
      getBoundingClientRect: () => ({ width, height }),
      getAttribute: (name: string) => name === 'data-fen' ? fen ?? null : null,
      querySelector: () => null,
    } as unknown as HTMLElement;
  }

  it('ranks a visible square board above hidden and generic matches', () => {
    const hidden = board('WC-CHESS-BOARD', 0, 0);
    const generic = board('DIV', 800, 120);
    const visible = board('CHESS-BOARD', 640, 640);
    const document = { querySelectorAll: () => [hidden, generic, visible] } as unknown as Pick<Document, 'querySelectorAll'>;
    expect(findChessComBoard(document)).toBe(visible);
  });

  it('ranks an on-screen board above a larger off-screen template', () => {
    const view = { innerWidth: 1280, innerHeight: 800, getComputedStyle: () => ({ display: 'block', visibility: 'visible', opacity: '1' }) };
    const offscreen = board('WC-CHESS-BOARD', 900, 900);
    const visible = board('CHESS-BOARD', 600, 600);
    Object.defineProperty(offscreen, 'ownerDocument', { value: { defaultView: view } });
    Object.defineProperty(visible, 'ownerDocument', { value: { defaultView: view } });
    offscreen.getBoundingClientRect = () => ({ width: 900, height: 900, top: 900, bottom: 1800, left: 0, right: 900 } as DOMRect);
    visible.getBoundingClientRect = () => ({ width: 600, height: 600, top: 50, bottom: 650, left: 50, right: 650 } as DOMRect);
    const document = { querySelectorAll: () => [offscreen, visible] } as unknown as Pick<Document, 'querySelectorAll'>;
    expect(findChessComBoard(document)).toBe(visible);
  });

  it('accepts strict six-field FEN from board APIs and attributes', () => {
    expect(isValidChessFen(startFen)).toBe(true);
    expect(isValidChessFen('8/8/8/8/8/8/8/8 w - - 0 1')).toBe(false);
    expect(isValidChessFen('8/8/8/8/8/8/4k3/4K3 w - - 0 1')).toBe(false);
    expect(isValidChessFen('4k3/8/8/8/8/8/P7/4K3 w - - 0 1')).toBe(true);
    expect(isValidChessFen('4k3/8/8/8/8/8/8/P3K3 w - - 0 1')).toBe(false);
    expect(isValidChessFen('not-a-fen')).toBe(false);
    expect(readChessComFen(board('WC-CHESS-BOARD', 600, 600, startFen))).toBe(startFen);
    const apiBoard = board('CHESS-BOARD', 600, 600) as HTMLElement & { game: { getFEN: () => string } };
    apiBoard.game = { getFEN: () => startFen };
    expect(readChessComFen(apiBoard)).toBe(startFen);
  });
});

describe('userscript Eval Bar bounded cache', () => {
  it('uses LRU eviction and refreshes recency on reads', () => {
    const cache = new BoundedLruCache<string, number>(2);
    cache.set('a', 1);
    cache.set('b', 2);
    expect(cache.get('a')).toBe(1);
    cache.set('c', 3);
    expect(cache.get('b')).toBeUndefined();
    expect(cache.get('a')).toBe(1);
    expect(cache.get('c')).toBe(3);
  });
});
