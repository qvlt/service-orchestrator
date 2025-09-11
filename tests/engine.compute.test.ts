import { describe, it, expect } from 'vitest';

import { alignToPeriod, jitter, nextIntervalDelay, computeScheduledAt } from '../engine/compute';

import type { Job } from '../engine/types';

describe('compute helpers', () => {
  it('alignToPeriod floors to start of period', () => {
    expect(alignToPeriod(10500, 1000)).toBe(10000);
    expect(alignToPeriod(999, 1000)).toBe(0);
  });

  it('jitter adds up to +jitterMs (deterministic rng)', () => {
    const rng = () => 0.5;
    // floor(0.5 * (10 + 1)) = floor(5.5) = 5
    expect(jitter(100, 10, rng)).toBe(105);
    expect(jitter(100, 0, rng)).toBe(100);
  });

  it('nextIntervalDelay respects catchUp=false', () => {
    const job: Job = {
      id: 'j',
      handler: async () => {},
      schedule: { type: 'interval', everyMs: 1000, catchUp: false },
    };
    expect(nextIntervalDelay(job, 1, 10_000)).toBe(1000);
  });

  it('nextIntervalDelay with catchUp=true returns 0 when missed', () => {
    const job: Job = {
      id: 'j',
      handler: async () => {},
      schedule: { type: 'interval', everyMs: 1000, catchUp: true },
    };
    const now = 5000;
    const last = 1000; // missed 4
    expect(nextIntervalDelay(job, last, now)).toBe(0);
  });

  it('computeScheduledAt: interval aligns', () => {
    const job: Job = { id: 'i', handler: () => {}, schedule: { type: 'interval', everyMs: 1000 } };
    expect(computeScheduledAt(job, 12345)).toBe(12000);
  });

  it('computeScheduledAt: finite returns current tick or null', () => {
    const job: Job = {
      id: 'f',
      handler: () => {},
      schedule: { type: 'finite', everyMs: 1000, count: 3, startAt: 5000 },
    };
    expect(computeScheduledAt(job, 5000)).toBe(5000);
    expect(computeScheduledAt(job, 6999)).toBe(6000);
    expect(computeScheduledAt(job, 9000)).toBe(null);
    expect(computeScheduledAt(job, 10001)).toBe(null);
  });

  it('computeScheduledAt: one-shot', () => {
    const at = Date.now() + 1000;
    const job: Job = { id: 'a', handler: () => {}, schedule: { type: 'at', at } };
    expect(computeScheduledAt(job, at)).toBe(at);
  });
});
