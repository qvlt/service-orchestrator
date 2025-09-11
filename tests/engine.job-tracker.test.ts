import { describe, it, expect, vi } from 'vitest';

import { JobTracker } from '../engine/job-tracker';

describe('JobTracker', () => {
  it('tracks running -> completed and keeps history', () => {
    vi.useFakeTimers();
    const t = new JobTracker();

    t.startRun('job1', 'job1@1000', 1000);
    expect(t.getRunningJobs()).toHaveLength(1);

    t.updateProgress('job1@1000', { current: 1, total: 2, percentage: 50 });
    t.completeRun('job1@1000', 'completed');

    expect(t.getRunningJobs()).toHaveLength(0);
    const hist = t.getJobHistory('job1');
    expect(hist).toHaveLength(1);
    expect(hist[0].status).toBe('completed');
    expect(hist[0].durationMs).toBeGreaterThanOrEqual(0);

    // getShowableJobs returns latest run for each job
    const showable = t.getShowableJobs();
    expect(showable.find((r) => r.jobId === 'job1')).toBeTruthy();

    // cleanup: remove entries older than cutoff
    t.cleanupOldHistory(0); // everything older than now
    expect(t.getJobHistory('job1')).toHaveLength(0);
    vi.useRealTimers();
  });
});
