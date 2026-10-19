import { describe, expect, it, vi } from 'vitest';
import { parseInfoLine, UciProtocol } from '../src/engine/uci-protocol.js';

describe('parseInfoLine', () => {
  it('extracts telemetry and a white-perspective centipawn score', () => {
    const result = parseInfoLine('info depth 18 seldepth 25 multipv 2 score cp 47 nodes 120000 nps 600000 time 200 pv e2e4 e7e5', true);
    expect(result).toEqual({
      depth: 18,
      seldepth: 25,
      multipv: 2,
      cp: 47,
      nodes: 120000,
      nps: 600000,
      time: 200,
      pv: ['e2e4', 'e7e5'],
    });
  });

  it('inverts side-to-move scores when black is analyzing', () => {
    expect(parseInfoLine('info depth 12 score mate 3 nodes 40 time 4 pv g2g1q', false).mate).toBe(-3);
  });

  it('ignores incomplete engine noise', () => {
    expect(parseInfoLine('info string NNUE evaluation enabled')).toBeNull();
  });
});

describe('UciProtocol', () => {
  it('serializes replacement searches and ignores stopped output', () => {
    const sent = [];
    const evaluations = [];
    const protocol = new UciProtocol({ onEvaluation: value => evaluations.push(value) });
    protocol.connect(command => sent.push(command));
    protocol.receive('uciok');
    protocol.receive('readyok');
    protocol.compute({ searchId: 1, fen: 'fen-one', whiteToMove: true, threads: 1, hashSize: 16, multiPv: 1, movetime: 1000 });
    protocol.receive('readyok');
    protocol.compute({ searchId: 2, fen: 'fen-two', whiteToMove: false, threads: 2, hashSize: 32, multiPv: 2, movetime: 3000 });
    protocol.receive('info depth 10 score cp 50 nodes 100 time 10 pv e2e4');
    protocol.receive('bestmove e2e4');
    protocol.receive('readyok');
    protocol.receive('info depth 11 score cp 30 nodes 200 time 20 pv e7e5');

    expect(sent).toContain('stop');
    expect(sent).toContain('position fen fen-two');
    expect(sent).toContain('go movetime 3000');
    expect(sent.filter(command => command === 'isready').length).toBeGreaterThanOrEqual(3);
    expect(evaluations).toHaveLength(1);
    expect(evaluations[0]).toMatchObject({ searchId: 2, cp: -30 });
  });

  it('publishes explicit search states and completes only non-cancelled work', () => {
    const sent = [];
    const states = [];
    const completed = [];
    const protocol = new UciProtocol({
      onSearchState: state => states.push(state),
      onSearchComplete: result => completed.push(result),
    });
    protocol.connect(command => sent.push(command));
    protocol.receive('uciok');
    protocol.receive('readyok');
    protocol.compute({ searchId: 1, fen: 'fen-one', whiteToMove: true, threads: 1, hashSize: 16, multiPv: 1, movetime: 1000 });
    protocol.receive('readyok');
    protocol.receive('info depth 8 score cp 25 pv e2e4');
    protocol.receive('bestmove e2e4');

    expect(states).toEqual(['searching', 'completed', 'idle']);
    expect(completed).toEqual([
      expect.objectContaining({ searchId: 1, bestmove: 'e2e4', lines: [expect.objectContaining({ cp: 25 })] }),
    ]);
  });

  it('sends one stop, drops cancelled info, and starts only the newest replacement', () => {
    const sent = [];
    const evaluations = [];
    const completed = [];
    const protocol = new UciProtocol({
      onEvaluation: value => evaluations.push(value),
      onSearchComplete: value => completed.push(value),
    });
    protocol.connect(command => sent.push(command));
    protocol.receive('uciok');
    protocol.receive('readyok');
    protocol.compute({ searchId: 1, fen: 'fen-one', whiteToMove: true, threads: 1, hashSize: 16, multiPv: 1, movetime: 1000 });
    protocol.receive('readyok');
    protocol.compute({ searchId: 2, fen: 'fen-two', whiteToMove: true, threads: 1, hashSize: 16, multiPv: 1, movetime: 1000 });
    protocol.compute({ searchId: 3, fen: 'fen-three', whiteToMove: true, threads: 1, hashSize: 16, multiPv: 1, movetime: 1000 });
    protocol.receive('info depth 20 score cp 500 pv e2e4');
    protocol.receive('bestmove e2e4');
    protocol.receive('readyok');

    expect(sent.filter(command => command === 'stop')).toHaveLength(1);
    expect(sent).not.toContain('position fen fen-two');
    expect(sent).toContain('position fen fen-three');
    expect(evaluations).toHaveLength(0);
    expect(completed).toHaveLength(0);
  });

  it('rejects bound scores and lower-depth regressions', () => {
    const evaluations = [];
    const protocol = new UciProtocol({ onEvaluation: value => evaluations.push(value) });
    protocol.connect(() => {});
    protocol.receive('uciok');
    protocol.receive('readyok');
    protocol.compute({ searchId: 1, fen: 'fen-one', whiteToMove: true, threads: 1, hashSize: 16, multiPv: 1, movetime: 1000 });
    protocol.receive('readyok');
    protocol.receive('info depth 12 score cp 60 lowerbound pv e2e4');
    protocol.receive('info depth 20 score cp 40 pv e2e4');
    protocol.receive('info depth 18 score cp 90 pv d2d4');

    expect(evaluations).toHaveLength(1);
    expect(evaluations[0]).toMatchObject({ depth: 20, cp: 40 });
  });

  it('resets option state for a fresh engine connection', () => {
    const first = [];
    const second = [];
    const protocol = new UciProtocol();
    protocol.connect(command => first.push(command));
    protocol.receive('uciok');
    protocol.receive('readyok');
    protocol.compute({ searchId: 1, fen: 'fen-one', whiteToMove: true, threads: 2, hashSize: 32, multiPv: 2, movetime: 1000 });
    protocol.disconnect();
    protocol.connect(command => second.push(command));
    protocol.receive('uciok');
    protocol.receive('readyok');
    protocol.compute({ searchId: 2, fen: 'fen-two', whiteToMove: true, threads: 2, hashSize: 32, multiPv: 2, movetime: 1000 });

    expect(second).toContain('setoption name Threads value 2');
    expect(second).toContain('setoption name Hash value 32');
    expect(second).toContain('setoption name MultiPV value 2');
  });

  it('normalizes the UCI no-move sentinel on completion', () => {
    const completed = [];
    const protocol = new UciProtocol({ onSearchComplete: value => completed.push(value) });
    protocol.connect(() => {});
    protocol.receive('uciok');
    protocol.receive('readyok');
    protocol.compute({ searchId: 1, fen: 'fen-one', whiteToMove: true, threads: 1, hashSize: 16, multiPv: 1, movetime: 1000 });
    protocol.receive('readyok');
    protocol.receive('bestmove (none)');

    expect(completed[0].bestmove).toBeNull();
  });

  it('reports lifecycle state changes', () => {
    const onState = vi.fn();
    const protocol = new UciProtocol({ onState });
    protocol.connect(() => {});
    protocol.receive('uciok');
    protocol.receive('readyok');
    expect(onState).toHaveBeenCalledWith('loading');
    expect(onState).toHaveBeenCalledWith('idle');
  });

  it('fails a stalled UCI handshake within a bounded time', async () => {
    vi.useFakeTimers();
    const protocol = new UciProtocol();
    protocol.connect(() => {});
    const readiness = expect(protocol.waitUntilReady(50)).rejects.toThrow(/Tempo esgotado/);
    await vi.advanceTimersByTimeAsync(50);
    await readiness;
    protocol.disconnect();
    vi.useRealTimers();
  });

  it('reports an engine that never confirms stop', async () => {
    vi.useFakeTimers();
    const onError = vi.fn();
    const protocol = new UciProtocol({ onError });
    protocol.connect(() => {});
    protocol.receive('uciok');
    protocol.receive('readyok');
    protocol.compute({ searchId: 1, fen: 'fen-one', whiteToMove: true, threads: 1, hashSize: 16, multiPv: 1, movetime: 1000 });
    protocol.receive('readyok');
    protocol.compute({ searchId: 2, fen: 'fen-two', whiteToMove: true, threads: 1, hashSize: 16, multiPv: 1, movetime: 1000 });
    await vi.advanceTimersByTimeAsync(5000);
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringMatching(/interrupção/) }));
    protocol.disconnect();
    vi.useRealTimers();
  });
});
