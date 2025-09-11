// engine/runtime.ts
// runJob: canRun, concurrency, claim, handler, markDone

import { getLogger } from '@qvlt/core-logger';

import { computeScheduledAt } from './compute';

import type { Job, Deps } from './types';

export async function runJob(job: Job, deps: Deps, now?: number): Promise<void> {
  if (job.enabled === false) return;
  if (job.canRun && !(await Promise.resolve(job.canRun()))) return;

  const ts = now ?? deps.clock.now();
  const scheduledAt = computeScheduledAt(job, ts);
  if (scheduledAt == null) return;

  const runKey = `${job.id}@${scheduledAt}`;
  const won = await deps.ledger.claimRun(runKey);
  if (!won) return;

  // Start tracking this job run
  deps.jobTracker.startRun(job.id, runKey, scheduledAt);

  const t0 = performance.now();
  const log = getLogger('orchestrator');
  log.info('run.start', { id: job.id, scheduledAt });

  try {
    // Provide a context so handlers can report progress
    const ctx = {
      reportProgress: (current: number, total: number, message?: string) => {
        const progress = {
          current,
          total,
          message,
          percentage: total > 0 ? Math.round((current / total) * 100) : 0,
        };
        deps.jobTracker.updateProgress(runKey, progress);
      },
    };
    await Promise.resolve(job.handler(ctx));

    const durationMs = Math.round(performance.now() - t0);
    log.info('run.end', { id: job.id, outcome: 'ok', durationMs });
    deps.jobTracker.completeRun(runKey, 'completed');
  } catch (error) {
    const durationMs = Math.round(performance.now() - t0);
    const errorMessage = error instanceof Error ? error.message : String(error);
    log.error('run.end', { id: job.id, outcome: 'error', durationMs }, error);
    deps.jobTracker.completeRun(runKey, 'failed', errorMessage);
    throw error;
  } finally {
    await deps.ledger.markDone(runKey);
    deps.lastRunStore.set(job.id, scheduledAt);
  }
}
