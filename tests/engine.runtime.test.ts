import { describe, it, expect, vi } from 'vitest';

import { runJob } from '../src/engine/runtime';

import type { Deps, Job } from '../src/engine/types';

const makeDeps = () => {
  const calls: any[] = [];
  const deps: Deps = {
    clock: { now: () => 1_000 },
    ledger: {
      claimRun: vi.fn().mockResolvedValue(true),
      markDone: vi.fn().mockResolvedValue(undefined),
      getOrCreateAnchor: vi.fn(),
      pruneOlderThanDays: vi.fn(),
    },
    lastRunStore: {
      get: vi.fn().mockReturnValue(null),
      set: vi.fn(),
    },
    jobTracker: {
      startRun: vi.fn(),
      updateProgress: vi.fn(),
      completeRun: vi.fn(),
      getRunningJobs: vi.fn(),
      getJobHistory: vi.fn(),
      getShowableJobs: vi.fn(),
    },
  };
  return { deps, calls };
};

describe('runJob', () => {
  it('skips if claimRun fails', async () => {
    const { deps } = makeDeps();
    (deps.ledger.claimRun as any).mockResolvedValue(false);

    const job: Job = { id: 'x', schedule: { type: 'at', at: 1000 }, handler: vi.fn() };
    await runJob(job, deps);

    expect(job.handler).not.toHaveBeenCalled();
    expect(deps.ledger.markDone).not.toHaveBeenCalled();
    expect(deps.lastRunStore.set).not.toHaveBeenCalled();
  });

  it('runs handler, reports progress, and marks done', async () => {
    const { deps } = makeDeps();

    const job: Job = {
      id: 'x',
      schedule: { type: 'at', at: 1000 },
      handler: vi.fn(async (ctx) => {
        ctx.reportProgress(1, 2, 'half');
      }),
    };

    await runJob(job, deps);

    expect(job.handler).toHaveBeenCalledTimes(1);
    expect(deps.jobTracker.startRun).toHaveBeenCalledWith('x', 'x@1000', 1000);
    expect(deps.jobTracker.updateProgress).toHaveBeenCalled();
    expect(deps.jobTracker.completeRun).toHaveBeenCalledWith('x@1000', 'completed');
    expect(deps.ledger.markDone).toHaveBeenCalledWith('x@1000');
    expect(deps.lastRunStore.set).toHaveBeenCalledWith('x', 1000);
  });

  it('marks failed when handler throws and rethrows', async () => {
    const { deps } = makeDeps();
    const job: Job = {
      id: 'x',
      schedule: { type: 'at', at: 1000 },
      handler: vi.fn(async () => {
        throw new Error('boom');
      }),
    };

    await expect(runJob(job, deps)).rejects.toThrow('boom');

    expect(deps.jobTracker.completeRun).toHaveBeenCalledWith('x@1000', 'failed', expect.stringMatching(/boom/));
    expect(deps.ledger.markDone).toHaveBeenCalledWith('x@1000');
  });

  it('respects canRun() returning false', async () => {
    const { deps } = makeDeps();
    const job: Job = {
      id: 'x',
      schedule: { type: 'at', at: 1000 },
      canRun: () => false,
      handler: vi.fn(),
    };
    await runJob(job, deps);
    expect(job.handler).not.toHaveBeenCalled();
  });
});
