// engine/job-tracker.ts
// Job status and progress tracking

import { getLogger } from '@qvlt/core-logger';

import { getTelemetryBus, disposeTelemetryBus, type TelemetryEvent } from '../adapters/bus.web';

import type { JobProgress, JobRunInfo } from './types';

export class JobTracker {
  private runningJobs = new Map<string, JobRunInfo>();
  private jobHistory = new Map<string, JobRunInfo[]>();
  private readonly maxHistoryPerJob = 50;
  private telemetryBus = getTelemetryBus();

  startRun(jobId: string, runKey: string, scheduledAt: number): void {
    const startedAt = Date.now();
    const runInfo: JobRunInfo = {
      jobId,
      runKey,
      scheduledAt,
      startedAt,
      status: 'running',
    };

    this.runningJobs.set(runKey, runInfo);
    getLogger('job-tracker').debug('run.started', {
      jobId,
      runKey,
      scheduledAt,
    });

    // Broadcast job started event to other tabs
    this.telemetryBus.emit({
      type: 'job-started',
      jobId,
      timestamp: startedAt,
      data: { runKey, scheduledAt },
    });
  }

  updateProgress(runKey: string, progress: JobProgress): void {
    const runInfo = this.runningJobs.get(runKey);
    if (runInfo) {
      runInfo.progress = progress;
      getLogger('job-tracker').debug('progress.updated', { runKey, progress });

      // Broadcast progress update to other tabs
      this.telemetryBus.emit({
        type: 'job-progress',
        jobId: runInfo.jobId,
        timestamp: Date.now(),
        data: { runKey, progress },
      });
    }
  }

  completeRun(runKey: string, status: 'completed' | 'failed', error?: string): void {
    const runInfo = this.runningJobs.get(runKey);
    if (!runInfo) return;

    const completedAt = Date.now();
    runInfo.completedAt = completedAt;
    runInfo.status = status;
    runInfo.error = error;
    runInfo.durationMs = completedAt - runInfo.startedAt;

    // Move to history
    this.runningJobs.delete(runKey);
    this.addToHistory(runInfo);

    getLogger('job-tracker').info('run.completed', {
      jobId: runInfo.jobId,
      runKey,
      status,
      durationMs: runInfo.durationMs,
      error,
    });

    // Broadcast job completion to other tabs
    this.telemetryBus.emit({
      type: status === 'completed' ? 'job-completed' : 'job-failed',
      jobId: runInfo.jobId,
      timestamp: completedAt,
      data: { runKey, durationMs: runInfo.durationMs, error },
    });
  }

  getRunningJobs(): JobRunInfo[] {
    return Array.from(this.runningJobs.values());
  }

  getJobHistory(jobId: string, limit: number = this.maxHistoryPerJob): JobRunInfo[] {
    const history = this.jobHistory.get(jobId) || [];
    return history.slice(-limit);
  }

  getShowableJobs(): JobRunInfo[] {
    // Return all running jobs and recent history for showable jobs
    const showableJobs = new Map<string, JobRunInfo>();

    // Add running jobs
    for (const runInfo of this.runningJobs.values()) {
      showableJobs.set(runInfo.jobId, runInfo);
    }

    // Add recent completed jobs from history
    for (const [jobId, history] of this.jobHistory.entries()) {
      const recent = history[history.length - 1];
      if (recent && !showableJobs.has(jobId)) {
        showableJobs.set(jobId, recent);
      }
    }

    return Array.from(showableJobs.values());
  }

  private addToHistory(runInfo: JobRunInfo): void {
    const { jobId } = runInfo;
    if (!this.jobHistory.has(jobId)) {
      this.jobHistory.set(jobId, []);
    }

    const history = this.jobHistory.get(jobId);
    if (!history) return;
    history.push(runInfo);

    // Keep only the most recent entries
    if (history.length > this.maxHistoryPerJob) {
      history.splice(0, history.length - this.maxHistoryPerJob);
    }
  }

  // Cleanup method for old history entries
  cleanupOldHistory(olderThanMs: number): void {
    const cutoff = Date.now() - olderThanMs;

    for (const [jobId, history] of this.jobHistory.entries()) {
      const filtered = history.filter((run) => run.completedAt && run.completedAt > cutoff);
      if (filtered.length === 0) {
        this.jobHistory.delete(jobId);
      } else {
        this.jobHistory.set(jobId, filtered);
      }
    }
  }

  // Reset method for disposal
  reset(): void {
    this.runningJobs.clear();
    this.jobHistory.clear();
  }

  // Dispose method for complete cleanup
  dispose(): void {
    // clear in-memory state
    this.reset();
    // close BroadcastChannel
    disposeTelemetryBus();
  }

  // Initialize cross-tab telemetry listening
  initializeCrossTabSync(): () => void {
    // Refresh in case a prior dispose() closed the Bus
    this.telemetryBus = getTelemetryBus();
    return this.telemetryBus.on((event) => {
      // Only process events from other tabs (not our own)
      if (event.type === 'job-progress') {
        this.handleRemoteProgress(event);
      } else if (event.type === 'job-started') {
        this.handleRemoteJobStarted(event);
      } else if (event.type === 'job-completed' || event.type === 'job-failed') {
        this.handleRemoteJobCompleted(event);
      }
    });
  }

  private handleRemoteProgress(event: TelemetryEvent): void {
    const data = event.data as { runKey: string; progress: JobProgress };
    const { runKey, progress } = data;
    let runInfo = this.runningJobs.get(runKey);
    if (!runInfo) {
      // Remote progress may arrive before "started" - create placeholder
      runInfo = {
        jobId: event.jobId,
        runKey,
        scheduledAt: Date.now(),
        startedAt: event.timestamp ?? Date.now(),
        status: 'running',
      };
      this.runningJobs.set(runKey, runInfo);
    }
    runInfo.progress = progress;
  }

  private handleRemoteJobStarted(event: TelemetryEvent): void {
    const data = event.data as { runKey: string; scheduledAt: number };
    const { runKey, scheduledAt } = data;
    const { jobId, timestamp } = event;

    // Only add if we don't already have this run
    if (!this.runningJobs.has(runKey)) {
      const runInfo: JobRunInfo = {
        jobId,
        runKey,
        scheduledAt,
        startedAt: timestamp,
        status: 'running',
      };
      this.runningJobs.set(runKey, runInfo);
    }
  }

  private handleRemoteJobCompleted(event: TelemetryEvent): void {
    const data = event.data as { runKey: string; durationMs: number; error?: string };
    const { runKey, durationMs, error } = data;
    const { jobId, timestamp } = event;

    let runInfo = this.runningJobs.get(runKey);
    if (!runInfo) {
      // Create a placeholder so the completion is reflected in history
      runInfo = {
        jobId,
        runKey,
        scheduledAt: Date.now(),
        startedAt: timestamp,
        status: 'running',
      };
      this.runningJobs.set(runKey, runInfo);
    }
    runInfo.completedAt = timestamp;
    runInfo.status = event.type === 'job-completed' ? 'completed' : 'failed';
    runInfo.error = error;
    runInfo.durationMs = durationMs;

    // Move to history
    this.runningJobs.delete(runKey);
    this.addToHistory(runInfo);
  }
}
