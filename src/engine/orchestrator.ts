// engine/orchestrator.ts
// class that wires all the above; HMR dispose → stop()

import { getLogger } from '@qvlt/core-logger';

import { JobTracker } from './job-tracker';
import { Planner } from './planner';
import { Registry } from './registry';
import { runJob } from './runtime';
import { isOrchestratorSupported } from '../adapters/capabilities';
import { SystemClock } from '../adapters/clock';
import { WebLockAdapter } from '../adapters/lock.web';
import * as Anchors from '../storage/anchors';
import * as Ledger from '../storage/ledger';
import * as Prune from '../storage/prune';

import type { Deps, Job, JobRunInfo, OrchestratorOptions, FiniteSchedule } from './types';

const DEFAULTS: Required<OrchestratorOptions> = {
  retentionDays: 3,
  housekeeping: true,
  debug: false,
};

export const HOUSEKEEPING_JOB_ID = 'orchestrator-housekeeping';

export class Orchestrator {
  private reg = new Registry();
  private planner: Planner;
  private jobTracker = new JobTracker();
  private started = false;
  private opts: Required<OrchestratorOptions>;
  private crossTabSyncCleanup?: () => void;

  private deps: Deps = {
    clock: SystemClock,
    ledger: {
      claimRun: (runKey: string) => Ledger.claimRun(runKey, WebLockAdapter),
      markDone: Ledger.markDone,
      getOrCreateAnchor: Anchors.getOrCreateAnchor,
      pruneOlderThanDays: Prune.pruneOlderThanDays,
    },
    lastRunStore: {
      get: (id) => {
        try {
          const v = localStorage.getItem(`qvlt.orch.last.${id}`);
          const n = v ? Number(v) : NaN;
          return Number.isFinite(n) ? n : null;
        } catch {
          return null;
        }
      },
      set: (id, at) => {
        try {
          localStorage.setItem(`qvlt.orch.last.${id}`, String(at));
        } catch {
          // Ignore localStorage errors
        }
      },
    },
    jobTracker: this.jobTracker,
  };

  constructor(opts: OrchestratorOptions = {}) {
    this.opts = { ...DEFAULTS, ...opts };
    this.deps.debug = this.opts.debug;
    this.planner = new Planner(this.deps);
  }

  start(opts: OrchestratorOptions = {}) {
    if (this.started) return;
    if (!isOrchestratorSupported()) {
      getLogger('orchestrator').warn('unsupported.environment', {
        reason: 'IndexedDB and Web Locks both unavailable',
      });
      // Continue with best-effort behavior
    }
    this.opts = { ...this.opts, ...opts }; // ← apply overrides from start()
    this.started = true; // ← move this above housekeeping registration

    // Initialize cross-tab synchronization
    this.crossTabSyncCleanup = this.jobTracker.initializeCrossTabSync();

    // Start housekeeping job if enabled
    if (this.opts.housekeeping) {
      this.register({
        id: HOUSEKEEPING_JOB_ID,
        schedule: { type: 'interval', everyMs: 24 * 60 * 60 * 1000 }, // daily
        handler: async () => {
          await this.deps.ledger.pruneOlderThanDays(this.opts.retentionDays);
          this.jobTracker.cleanupOldHistory(7 * 24 * 60 * 60 * 1000); // 7 days
        },
        uiVisible: false, // Internal housekeeping job
      });
    }
  }

  stop() {
    this.planner.clearAll();
    this.crossTabSyncCleanup?.();
    this.crossTabSyncCleanup = undefined;
    this.started = false;
  }

  /**
   * Dispose of the orchestrator, cleaning up all resources.
   * This is more thorough than stop() and should be called when the orchestrator
   * is no longer needed (e.g., during HMR or app shutdown).
   */
  dispose(): void {
    this.stop();
    this.reg.clear();
    this.jobTracker.dispose(); // ← closes BC + clears state
  }

  register(job: Job): () => void {
    const unreg = this.reg.register(job);

    if (this.started && job.enabled !== false) {
      if (job.schedule.type === 'finite' && job.schedule.startAt == null) {
        // Async anchor init (first-writer-wins via IDB) then plan
        void (async () => {
          const schedule = job.schedule as FiniteSchedule; // Type assertion for finite schedule
          const aligned = Math.floor(this.deps.clock.now() / schedule.everyMs) * schedule.everyMs;
          const anchor = await this.deps.ledger.getOrCreateAnchor(job.id, aligned);
          const current = this.reg.get(job.id);
          if (!current || current.enabled === false) return;
          if (current.schedule.type === 'finite' && current.schedule.startAt == null) {
            current.schedule.startAt = anchor;
            this.planner.plan(current, true);
          }
        })();
      } else {
        this.planner.plan(job, true);
      }
    }

    return () => {
      this.planner.clearTimer(job.id);
      unreg();
    };
  }

  async trigger(id: string) {
    const job = this.reg.get(id);
    if (!job) return;
    await runJob(job, this.deps);
  }

  // Job tracking methods
  getRunningJobs(): JobRunInfo[] {
    return this.jobTracker.getRunningJobs();
  }

  getJobHistory(jobId: string, limit?: number): JobRunInfo[] {
    return this.jobTracker.getJobHistory(jobId, limit);
  }

  getShowableJobs(): JobRunInfo[] {
    const all = this.jobTracker.getShowableJobs();
    // Only include jobs whose definition is uiVisible !== false (default: true)
    return all.filter((r) => (this.reg.get(r.jobId)?.uiVisible ?? true) === true);
  }

  // Get all registered jobs with their uiVisible status
  getRegisteredJobs(): Array<Job & { isRunning: boolean }> {
    const runningJobs = this.getRunningJobs();
    const runningJobIds = new Set(runningJobs.map((j) => j.jobId));

    return Array.from(this.reg.jobs.values()).map((job) => ({
      ...job,
      isRunning: runningJobIds.has(job.id),
    }));
  }
}
