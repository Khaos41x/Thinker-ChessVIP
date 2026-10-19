import { describe, expect, it } from 'vitest';
import {
  BoundedLruCache,
  resolveChessComEvalAuthorization,
} from '../../frontend/eval_bar/userscript-adapter';

function documentWith(nodes: unknown[] = []) {
  return {
    querySelectorAll: () => nodes,
  } as unknown as Pick<Document, 'querySelectorAll'>;
}

function visibleNode(textContent = '') {
  return {
    isConnected: true,
    textContent,
    getAttribute: () => null,
    getBoundingClientRect: () => ({ width: 400, height: 200 }),
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
      documentWith([visibleNode('Game Review')]),
    )).toBe('post-game');
  });

  it('fails closed on play, home and malformed routes', () => {
    for (const pathname of ['/play/online', '/', '/game/live/', '/puzzles', '/clubs/review/archive']) {
      expect(resolveChessComEvalAuthorization({ pathname } as Location, documentWith([visibleNode('Game Review')]))).toBeNull();
    }
  });

  it('rejects hidden post-game evidence', () => {
    expect(resolveChessComEvalAuthorization(
      { pathname: '/game/live/abc' } as Location,
      documentWith([hiddenNode()]),
    )).toBeNull();
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
