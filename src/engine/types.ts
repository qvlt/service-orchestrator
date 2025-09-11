// engine/types.ts
// Schedule, Job, Options, literal unions; shared contracts

export type IntervalSchedule = {
  type: 'interval';
  everyMs: number;
  jitterMs?: number;
  runAtStartup?: boolean;
  catchUp?: boolean;
};

export type OneShotSchedule = {
  type: 'at';
  at: number;
  skipIfPast?: boolean;
};

export type FiniteSchedule = {
  type: 'finite';
  everyMs: number;
  count: number;
  jitterMs?: number;
  runAtStartup?: boolean;
  startAt?: number; // cross-tab anchor
};

export type Schedule = IntervalSchedule | OneShotSchedule | FiniteSchedule;
export type Concurrency = 'allow' | 'skip' | 'wait';

export type JobStatus = 'idle' | 'running' | 'completed' | 'failed' | 'cancelled';

export type JobProgress = {
  current: number;
  total: number;
  message?: string;
  percentage: number;
};

export type JobRunContext = {
  /** Report UI-friendly progress for this run. */
  reportProgress(current: number, total: number, message?: string): void;
};

export type JobRunInfo = {
  jobId: string;
  runKey: string;
  scheduledAt: number;
  startedAt: number;
  completedAt?: number;
  status: JobStatus;
  progress?: JobProgress;
  error?: string;
  durationMs?: number;
};

export type Job = {
  id: string;
  /** Handler receives a context to report progress. */
  handler: (ctx: JobRunContext) => Promise<void> | void;
  schedule: Schedule;
  concurrency?: Concurrency;
  enabled?: boolean;
  canRun?: () => boolean | Promise<boolean>;
  /** Whether this job should be shown in the UI (replaces "showable"). */
  uiVisible?: boolean;
  // future: tags, metrics labels, etc
};

export type OrchestratorOptions = {
  retentionDays?: number; // default 3
  housekeeping?: boolean; // default true
  debug?: boolean; // default false
};

export type Deps = {
  clock: Clock;
  ledger: LedgerAdapter;
  lastRunStore: LastRunStore;
  jobTracker: JobTracker;
  debug?: boolean;
};

export interface Clock {
  now(): number;
}

export interface LedgerAdapter {
  claimRun(runKey: string): Promise<boolean>;
  markDone(runKey: string): Promise<void>;
  getOrCreateAnchor(jobId: string, suggestedStartAt: number): Promise<number>;
  pruneOlderThanDays(days: number): Promise<void>;
}

export interface LastRunStore {
  get(jobId: string): number | null;
  set(jobId: string, at: number): void;
}

export interface JobTracker {
  startRun(jobId: string, runKey: string, scheduledAt: number): void;
  updateProgress(runKey: string, progress: JobProgress): void;
  completeRun(runKey: string, status: 'completed' | 'failed', error?: string): void;
  getRunningJobs(): JobRunInfo[];
  getJobHistory(jobId: string, limit?: number): JobRunInfo[];
  getShowableJobs(): JobRunInfo[];
}
