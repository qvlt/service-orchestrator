// engine/registry.ts
// holds Map<string, Job>, register() returns unregister, enable/disable, validations

import type { Job } from './types';

export class Registry {
  readonly jobs = new Map<string, Job>();

  register(job: Job): () => void {
    if (!job?.id) throw new Error('Job id is required');
    if (!job.schedule) throw new Error('Job schedule is required');
    if (
      (job.schedule.type === 'interval' || job.schedule.type === 'finite') &&
      !(Number.isFinite(job.schedule.everyMs) && job.schedule.everyMs > 0)
    ) {
      throw new Error(`everyMs must be a positive number for "${job.id}"`);
    }
    if (job.schedule.type === 'finite' && job.schedule.count <= 0) {
      return () => {};
    }

    const normalized: Job = {
      enabled: true,
      concurrency: 'allow',
      uiVisible: job.uiVisible ?? true,
      ...job,
    };
    this.jobs.set(normalized.id, normalized);
    return () => this.unregister(normalized.id);
  }

  get(id: string) {
    return this.jobs.get(id);
  }
  unregister(id: string) {
    this.jobs.delete(id);
  }
  clear() {
    this.jobs.clear();
  }
}
