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

describe('userscript Eval Bar authorization', () => {
  it('allows analysis and review routes', () => {
    expect(resolveChessComEvalAuthorization({ pathname: '/analysis/game/abc' } as Location, documentWith())).toBe('analysis');
    expect(resolveChessComEvalAuthorization(
      { pathname: '/analysis/collection/example/analysis' } as Location,
      documentWith(),
    )).toBe('analysis');
    expect(resolveChessComEvalAuthorization({ pathname: '/game/live/abc/review' } as Location, documentWith())).toBe('analysis');
  });

  it('authorizes active online and rated games', () => {
    expect(resolveChessComEvalAuthorization({ pathname: '/game/live/abc' } as Location, documentWith())).toBe('active-game');
    expect(resolveChessComEvalAuthorization({ pathname: '/game/12345678' } as Location, documentWith())).toBe('active-game');
    expect(resolveChessComEvalAuthorization({ pathname: '/play/online' } as Location, documentWith())).toBe('active-game');
  });

  it('classifies completed games with terminal board evidence as post-game', () => {
    expect(resolveChessComEvalAuthorization(
      { pathname: '/game/live/abc' } as Location,
      documentWith([visibleNode('Game Review', true)]),
    )).toBe('post-game');
    expect(resolveChessComEvalAuthorization(
      { pathname: '/play/online' } as Location,
      documentWith([visibleNode('Game Review', true)]),
    )).toBe('post-game');
  });

  it('presents the legacy live/game replay and authorizes the surface', () => {
    const location = { pathname: '/live/game/18582739876', search: '?move=0' } as Location;
    expect(resolveChessComEvalPresentation(location)).toBe(true);
    expect(resolveChessComEvalAuthorization(location, documentWith([visibleNode('Game Review')]))).toBe('active-game');
    expect(resolveChessComEvalAuthorization(location, documentWith([visibleNode('Game Review', true)]))).toBe('post-game');
    for (const pathname of ['/live/game/', '/live/game/abc/unknown', '/live/other/abc']) {
      expect(resolveChessComEvalPresentation({ pathname } as Location)).toBe(false);
      expect(resolveChessComEvalAuthorization({ pathname } as Location, documentWith([visibleNode('Game Review', true)]))).toBeNull();
    }
  });

  it('authorizes board training routes and stays null off board routes', () => {
    expect(resolveChessComEvalPresentation({ pathname: '/play/online' } as Location)).toBe(true);
    expect(resolveChessComEvalAuthorization({ pathname: '/puzzles' } as Location, documentWith())).toBe('analysis');
    expect(resolveChessComEvalAuthorization({ pathname: '/practice' } as Location, documentWith())).toBe('analysis');
    for (const pathname of ['/', '/settings', '/clubs/review/archive']) {
      expect(resolveChessComEvalPresentation({ pathname } as Location)).toBe(false);
      expect(resolveChessComEvalAuthorization({ pathname } as Location, documentWith())).toBeNull();
    }
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
