import { describe, expect, it } from 'vitest';
import { EvalBarController, type EvalBarScheduler } from '../src/ui/eval-bar';

class FakeScheduler implements EvalBarScheduler {
  time = 0;
  nextHandle = 1;
  callbacks = new Map<number, (timestamp: number) => void>();
  maximumPending = 0;

  now = (): number => this.time;

  requestFrame = (callback: (timestamp: number) => void): number => {
    const handle = this.nextHandle++;
    this.callbacks.set(handle, callback);
    this.maximumPending = Math.max(this.maximumPending, this.callbacks.size);
    return handle;
  };

  cancelFrame = (handle: number): void => {
    this.callbacks.delete(handle);
  };

  step(milliseconds: number): void {
    this.time += milliseconds;
    const pending = [...this.callbacks.values()];
    this.callbacks.clear();
    pending.forEach(callback => callback(this.time));
  }
}

function fixture(scheduler: FakeScheduler, initialFraction = 0.5) {
  const writes: string[] = [];
  const style = new Proxy({ transform: '' }, {
    set(target, property, value) {
      writes.push(String(property));
      return Reflect.set(target, property, value);
    },
  });
  const root = { dataset: {} } as unknown as HTMLElement;
  const fill = { style } as unknown as HTMLElement;
  const label = { textContent: '0.0' } as HTMLElement;
  const controller = new EvalBarController(
    { root, fill, label },
    { scheduler, initialFraction, reducedMotion: false },
  );
  writes.length = 0;
  return { controller, fill, label, root, writes };
}

describe('EvalBarController', () => {
  it('coalesces a burst into one mailbox value and one frame', () => {
    const scheduler = new FakeScheduler();
    const { controller, label } = fixture(scheduler);
    controller.beginSearch(7);
    for (let index = 0; index < 1000; index += 1) {
      controller.publish({ searchId: 7, fraction: index / 1000, label: String(index), favoredColor: 'white' });
    }
    expect(controller.snapshot().hasPendingSample).toBe(true);
    expect(scheduler.callbacks.size).toBe(1);
    expect(scheduler.maximumPending).toBe(1);
    scheduler.step(110);
    expect(label.textContent).toBe('999');
    expect(controller.snapshot().target).toBeCloseTo(0.999, 12);
  });

  it('uses the 110ms exponential time constant', () => {
    const scheduler = new FakeScheduler();
    const { controller } = fixture(scheduler);
    controller.beginSearch(1);
    controller.publish({ searchId: 1, fraction: 0.9, label: '+1.0', favoredColor: 'white' });
    scheduler.step(110);
    expect(controller.snapshot().current).toBeCloseTo(0.5 + 0.4 * (1 - Math.exp(-1)), 12);
  });

  it('freezes the current visual on a new FEN and rejects stale samples', () => {
    const scheduler = new FakeScheduler();
    const { controller } = fixture(scheduler);
    controller.beginSearch(1);
    controller.publish({ searchId: 1, fraction: 0.9, label: '+1.0', favoredColor: 'white' });
    scheduler.step(110);
    const beforeChange = controller.snapshot().current;
    controller.beginSearch(2);
    expect(controller.snapshot().current).toBe(beforeChange);
    expect(controller.snapshot().target).toBe(beforeChange);
    expect(controller.publish({ searchId: 1, fraction: 0.1, label: '-1.0', favoredColor: 'black' })).toBe(false);
    expect(scheduler.callbacks.size).toBe(0);
  });

  it('accepts a cache hit atomically without resetting to neutral', () => {
    const scheduler = new FakeScheduler();
    const { controller } = fixture(scheduler, 0.8);
    controller.beginSearch(3, { searchId: 3, fraction: 0.7, label: '+0.8', favoredColor: 'white' });
    expect(controller.snapshot().current).toBe(0.8);
    expect(scheduler.callbacks.size).toBe(1);
    scheduler.step(110);
    expect(controller.snapshot().current).toBeGreaterThan(0.7);
    expect(controller.snapshot().current).toBeLessThan(0.8);
  });

  it('writes only transform during animation and stops after convergence', () => {
    const scheduler = new FakeScheduler();
    const { controller, writes } = fixture(scheduler);
    controller.beginSearch(4);
    controller.publish({ searchId: 4, fraction: 0.6, label: '+0.2', favoredColor: 'white' });
    for (let index = 0; index < 100 && scheduler.callbacks.size; index += 1) scheduler.step(16.67);
    expect(new Set(writes)).toEqual(new Set(['transform']));
    expect(controller.snapshot().current).toBeCloseTo(0.6, 4);
    expect(controller.snapshot().hasScheduledFrame).toBe(false);
  });

  it('changes transform origin through orientation state without layout reads', () => {
    const scheduler = new FakeScheduler();
    const { controller, root } = fixture(scheduler);
    controller.setOrientation('black');
    expect(root.dataset.orientation).toBe('black');
  });

  it('resets neutral presentation side together with fraction and label', () => {
    const scheduler = new FakeScheduler();
    const { controller, label, root } = fixture(scheduler, 0.2);
    root.dataset.favoredColor = 'black';
    controller.reset(0.5, '—');
    expect(root.dataset.favoredColor).toBe('white');
    expect(label.textContent).toBe('—');
    expect(controller.snapshot()).toMatchObject({ current: 0.5, target: 0.5 });
  });

  it('reports the first committed visual frame without changing interpolation', () => {
    const scheduler = new FakeScheduler();
    const frames: Array<ReturnType<EvalBarController['snapshot']>> = [];
    const root = { dataset: {} } as unknown as HTMLElement;
    const fill = { style: { transform: '' } } as unknown as HTMLElement;
    const label = { textContent: '0.0' } as HTMLElement;
    const controller = new EvalBarController(
      { root, fill, label },
      { scheduler, reducedMotion: false, onFrameCommitted: snapshot => frames.push(snapshot) },
    );
    controller.beginSearch(5);
    controller.publish({ searchId: 5, fraction: 0.9, label: '+1.0', favoredColor: 'white' });
    scheduler.step(16);
    expect(frames).toHaveLength(1);
    expect(frames[0].current).toBeGreaterThan(0.5);
    expect(frames[0].current).toBeLessThan(0.9);
    expect(label.textContent).toBe('+1.0');
  });

  it('commits label, favored side, and target atomically on one RAF', () => {
    const scheduler = new FakeScheduler();
    const { controller, label, root } = fixture(scheduler);
    controller.beginSearch(6);
    controller.publish({ searchId: 6, fraction: 0.2, label: '3.4', favoredColor: 'black' });
    expect(label.textContent).toBe('0.0');
    expect(root.dataset.favoredColor).toBeUndefined();
    scheduler.step(16);
    expect(label.textContent).toBe('3.4');
    expect(root.dataset.favoredColor).toBe('black');
    expect(controller.snapshot().target).toBe(0.2);
  });

  it('waits until the newly favored region can keep its label legible', () => {
    const scheduler = new FakeScheduler();
    const { controller, label, root } = fixture(scheduler, 0.99);
    root.dataset.favoredColor = 'white';
    label.textContent = '9.0';
    controller.beginSearch(7);
    controller.publish({ searchId: 7, fraction: 0.01, label: '9.0', favoredColor: 'black' });
    scheduler.step(8);
    expect(root.dataset.favoredColor).toBe('white');
    expect(label.textContent).toBe('9.0');
    scheduler.step(8);
    expect(root.dataset.favoredColor).toBe('black');
    expect(label.textContent).toBe('9.0');
    expect(controller.snapshot().current).toBeGreaterThan(0.01);
  });

  it.each([1000 / 30, 1000 / 60, 1000 / 120])(
    'pursues 100 irregular targets without overshoot at %fms frames',
    frameDuration => {
      const scheduler = new FakeScheduler();
      const { controller } = fixture(scheduler, 0.62);
      controller.beginSearch(9);
      for (let index = 0; index < 100; index += 1) {
        const target = 0.12 + ((index * 37) % 76) / 100;
        controller.publish({
          searchId: 9,
          fraction: target,
          label: (index / 10).toFixed(1),
          favoredColor: target >= 0.5 ? 'white' : 'black',
        });
        const before = controller.snapshot().current;
        scheduler.step(frameDuration * (index % 3 === 0 ? 1.7 : 1));
        const after = controller.snapshot().current;
        expect(after).toBeGreaterThanOrEqual(Math.min(before, target));
        expect(after).toBeLessThanOrEqual(Math.max(before, target));
        expect(after).not.toBe(0.5);
      }
      expect(scheduler.maximumPending).toBe(1);
    },
  );
});
