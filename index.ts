import { getLogger } from '@qvlt/core-logger';

import {
  getCapabilities,
  getCapabilitiesSummary,
  isOrchestratorSupported,
  getCapabilityWarnings,
} from './adapters/capabilities';
import { ensurePersistentStorage, getStorageQuota } from './adapters/storage-persistence';
import { Orchestrator } from './engine/orchestrator';

import type { Job, JobRunInfo, OrchestratorOptions } from './engine/types';

declare global {
  interface Window {
    __QvltOrchestrator__?: Orchestrator;
  }
}

function getSingleton(): Orchestrator {
  if (typeof window === 'undefined') throw new Error('Orchestrator is browser-only');
  return (window.__QvltOrchestrator__ ??= new Orchestrator());
}

export function startOrchestrator(opts?: OrchestratorOptions) {
  getSingleton().start(opts);
}

export function stopOrchestrator() {
  getSingleton().stop();
}

export function disposeOrchestrator() {
  getSingleton().dispose();
}

export function registerJob(job: Job): () => void {
  return getSingleton().register(job);
}

export function triggerJob(id: string): Promise<void> {
  return getSingleton().trigger(id);
}

// Job tracking exports
export function getRunningJobs(): JobRunInfo[] {
  return getSingleton().getRunningJobs();
}

export function getJobHistory(jobId: string, limit?: number): JobRunInfo[] {
  return getSingleton().getJobHistory(jobId, limit);
}

export function getShowableJobs(): JobRunInfo[] {
  return getSingleton().getShowableJobs();
}

export function getRegisteredJobs(): Array<Job & { isRunning: boolean }> {
  return getSingleton().getRegisteredJobs();
}

// Optional alias with the new terminology
export function getUiVisibleJobs(): JobRunInfo[] {
  return getSingleton().getShowableJobs();
}

// Capabilities and diagnostics
export { getCapabilities, getCapabilitiesSummary, isOrchestratorSupported, getCapabilityWarnings, getStorageQuota };

// Export types for external use
export type { Job, JobRunInfo, JobProgress, JobStatus } from './engine/types';

// Export constants
export { HOUSEKEEPING_JOB_ID } from './engine/orchestrator';

// Orchestrator initialization
export interface OrchestratorConfig {
  retentionDays?: number;
  housekeeping?: boolean;
  debug?: boolean;
}

export async function initializeOrchestrator(config: OrchestratorConfig = {}): Promise<void> {
  try {
    getLogger('orchestrator').info('initialization.start');

    // Log capabilities for diagnostics
    const capabilities = getCapabilities();
    const warnings = getCapabilityWarnings();

    getLogger('orchestrator').info('capabilities.detected', {
      capabilities,
      summary: getCapabilitiesSummary(),
      supported: isOrchestratorSupported(),
    });

    if (warnings.length > 0) {
      getLogger('orchestrator').warn('capabilities.warnings', { warnings });
    }

    // Request persistent storage for better reliability
    const persistentStorage = await ensurePersistentStorage();
    if (persistentStorage) {
      getLogger('orchestrator').info('persistent.storage.granted');
    } else {
      getLogger('orchestrator').warn('persistent.storage.not.available');
    }

    // Start the orchestrator with appropriate configuration
    startOrchestrator({
      retentionDays: config.retentionDays || 3,
      housekeeping: config.housekeeping !== false,
      debug: config.debug || false,
    });

    getLogger('orchestrator').info('initialization.complete');
  } catch (error) {
    getLogger('orchestrator').error('initialization.failed', { error: String(error) }, error);
    throw error;
  }
}
