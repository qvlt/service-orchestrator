// engine/planner.ts
// manages timers per job, initial runAtStartup, rescheduling & finite completion

import { getLogger } from '@qvlt/core-logger';

import { jitter, nextIntervalDelay } from './compute';
import { runJob } from './runtime';

import type { Job, Deps } from './types';

export class Planner {
  private timers = new Map<string, ReturnType<typeof setTimeout>>();
  private running = new Set<string>();

  constructor(private deps: Deps) {}

  clearAll() {
    for (const t of this.timers.values()) clearTimeout(t);
    this.timers.clear();
    this.running.clear();
  }

  plan(job: Job, first = false) {
    if (job.enabled === false) return;
    const now = this.deps.clock.now();
    let delay = 0;

    switch (job.schedule.type) {
      case 'interval': {
        const { jitterMs, runAtStartup } = job.schedule;
        const last = this.deps.lastRunStore.get(job.id);
        delay = first && runAtStartup ? jitter(0, jitterMs) : jitter(nextIntervalDelay(job, last, now), jitterMs);
        break;
      }
      case 'finite': {
        const { everyMs, jitterMs, runAtStartup, startAt, count } = job.schedule;
        if (startAt == null) return; // anchor async init pending
        const endAt = startAt + count * everyMs;
        if (now >= endAt + 5_000) return; // done
        delay = first && runAtStartup ? jitter(0, jitterMs) : jitter(everyMs, jitterMs);
        break;
      }
      case 'at': {
        const { at, skipIfPast } = job.schedule;
        delay = Math.max(0, at - now);
        if (delay === 0 && skipIfPast) return;
        break;
      }
    }

    this.clearTimer(job.id);
    const t = setTimeout(async () => {
      // Per-tab concurrency: handle different policies
      if (job.concurrency === 'skip' && this.running.has(job.id)) return;

      if (job.concurrency === 'wait' && this.running.has(job.id)) {
        // re-check shortly after current run finishes (avoid tight loop)
        const retry = setTimeout(() => this.plan(job), 50);
        this.timers.set(job.id, retry);
        return;
      }

      this.running.add(job.id);
      try {
        const firedAt = this.deps.clock.now();
        getLogger('orchestrator').info('tick', { id: job.id, delayMs: delay });
        await runJob(job, this.deps, firedAt);
      } finally {
        this.running.delete(job.id);
      }

      // Reschedule (but not for one-shot)
      if (job.schedule.type !== 'at') {
        this.plan(job);
      }
    }, delay);

    this.timers.set(job.id, t);
  }

  clearTimer(id: string) {
    const t = this.timers.get(id);
    if (t) clearTimeout(t);
    this.timers.delete(id);
  }
}
