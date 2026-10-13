import { describe, expect, it } from 'vitest';
import { ChessSession } from '../src/chess-session.js';

describe('ChessSession', () => {
  it('loads and navigates the main line of a PGN', () => {
    const session = new ChessSession();
    session.loadPgn('[White "Ada"]\n[Black "Turing"]\n\n1. e4 e5 2. Nf3 Nc6 3. Bb5 a6');
    expect(session.totalPlies).toBe(6);
    expect(session.current.san).toBe('a6');
    expect(session.headers.White).toBe('Ada');
    session.navigate('first');
    expect(session.index).toBe(0);
    session.navigate('next');
    expect(session.current.san).toBe('e4');
  });

  it('preserves the active position when an invalid FEN is rejected', () => {
    const session = new ChessSession();
    session.play({ from: 'e2', to: 'e4' });
    const prior = session.current.fen;
    expect(() => session.loadFen('not a fen')).toThrow();
    expect(session.current.fen).toBe(prior);
  });

  it('rejects a structurally valid position where the side that moved remains in check', () => {
    const session = new ChessSession();
    expect(() => session.loadFen('4k3/4R3/8/8/8/8/8/4K3 w - - 0 1')).toThrow(/ilegal/);
  });

  it('truncates future moves after branching from an earlier ply', () => {
    const session = new ChessSession();
    session.loadPgn('1. e4 e5 2. Nf3 Nc6');
    session.goTo(2);
    session.play({ from: 'f1', to: 'c4' });
    expect(session.totalPlies).toBe(3);
    expect(session.current.san).toBe('Bc4');
  });

  it('normalizes fractional navigation indexes', () => {
    const session = new ChessSession();
    session.loadPgn('1. e4 e5');
    session.goTo(1.8);
    expect(session.index).toBe(1);
    expect(session.current.san).toBe('e4');
  });

  it('preserves color and fullmove number for setup-FEN PGNs', () => {
    const session = new ChessSession();
    session.loadPgn('[SetUp "1"]\n[FEN "8/8/8/8/8/8/4k3/6K1 b - - 0 37"]\n\n37... Kf3');
    expect(session.states[1]).toMatchObject({ color: 'b', moveNumber: 37, san: 'Kf3' });
  });
});
