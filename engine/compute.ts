// engine/compute.ts
// Pure time math: computeScheduledAt, nextIntervalDelay, jitter (no side effects)

import type { Job } from './types';

/** Align timestamp down to the start of its period. */
export function alignToPeriod(ts: number, periodMs: number): number {
  return Math.floor(ts / periodMs) * periodMs;
}

/** Add up to +jitterMs uniformly (deterministic if you pass a custom rng). */
export function jitter(ms: number, jitterMs?: number, rng: () => number = Math.random): number {
  const j = Math.max(0, jitterMs ?? 0);
  return ms + Math.floor(rng() * (j + 1));
}

/**
 * Compute the delay before the next interval run.
 * `now` should come from your Clock adapter so tests are deterministic.
 */
export function nextIntervalDelay(job: Job, lastRun: number | null, now: number): number {
  if (job.schedule.type !== 'interval') return 0;
  const { everyMs, catchUp } = job.schedule;
  if (!catchUp || !lastRun) return everyMs;

  const missed = Math.floor((now - lastRun) / everyMs);
  return missed > 0 ? 0 : everyMs;
}

/**
 * Compute the scheduled key time (epoch ms) for this tick.
 * Use the same `now` source the planner used to fire the timer.
 */
export function computeScheduledAt(job: Job, now: number): number | null {
  switch (job.schedule.type) {
    case 'interval': {
      const p = job.schedule.everyMs;
      return alignToPeriod(now, p);
    }
    case 'finite': {
      const { everyMs, count, startAt } = job.schedule;
      if (startAt == null) return null;
      const i = Math.max(0, Math.floor((now - startAt) / everyMs));
      if (i >= count) return null;
      return startAt + i * everyMs;
    }
    case 'at':
      return job.schedule.at;
    default: {
      // Exhaustiveness check: if a new schedule type is added, TS will error here.
      const _never: never = job.schedule as never;
      return _never;
    }
  }
}
