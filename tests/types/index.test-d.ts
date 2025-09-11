import { expectType } from 'tsd';

import * as pkg from '../../dist';

// Test that all main exports exist and have correct types
expectType<typeof pkg.startOrchestrator>(pkg.startOrchestrator);
expectType<typeof pkg.stopOrchestrator>(pkg.stopOrchestrator);
expectType<typeof pkg.disposeOrchestrator>(pkg.disposeOrchestrator);
expectType<typeof pkg.registerJob>(pkg.registerJob);
expectType<typeof pkg.triggerJob>(pkg.triggerJob);
expectType<typeof pkg.getRunningJobs>(pkg.getRunningJobs);
expectType<typeof pkg.getJobHistory>(pkg.getJobHistory);
expectType<typeof pkg.getShowableJobs>(pkg.getShowableJobs);
expectType<typeof pkg.getRegisteredJobs>(pkg.getRegisteredJobs);
expectType<typeof pkg.getUiVisibleJobs>(pkg.getUiVisibleJobs);
expectType<typeof pkg.getCapabilities>(pkg.getCapabilities);
expectType<typeof pkg.getCapabilitiesSummary>(pkg.getCapabilitiesSummary);
expectType<typeof pkg.isOrchestratorSupported>(pkg.isOrchestratorSupported);
expectType<typeof pkg.getCapabilityWarnings>(pkg.getCapabilityWarnings);
expectType<typeof pkg.ensurePersistentStorage>(pkg.ensurePersistentStorage);
expectType<typeof pkg.getStorageQuota>(pkg.getStorageQuota);
expectType<typeof pkg.initializeOrchestrator>(pkg.initializeOrchestrator);

// Test function signatures with correct return types
expectType<(opts?: pkg.OrchestratorOptions) => void>(pkg.startOrchestrator);
expectType<() => void>(pkg.stopOrchestrator);
expectType<() => void>(pkg.disposeOrchestrator);
expectType<(job: pkg.Job) => () => void>(pkg.registerJob);
expectType<(id: string) => Promise<void>>(pkg.triggerJob);
expectType<() => pkg.JobRunInfo[]>(pkg.getRunningJobs);
expectType<(jobId: string, limit?: number) => pkg.JobRunInfo[]>(pkg.getJobHistory);
expectType<() => pkg.JobRunInfo[]>(pkg.getShowableJobs);
expectType<() => Array<pkg.Job & { isRunning: boolean }>>(pkg.getRegisteredJobs);
expectType<() => pkg.JobRunInfo[]>(pkg.getUiVisibleJobs);
expectType<() => pkg.Capabilities>(pkg.getCapabilities);
expectType<() => string>(pkg.getCapabilitiesSummary);
expectType<() => boolean>(pkg.isOrchestratorSupported);
expectType<() => string[]>(pkg.getCapabilityWarnings);
expectType<() => Promise<boolean>>(pkg.ensurePersistentStorage);
expectType<() => Promise<pkg.StorageQuotaInfo | null>>(pkg.getStorageQuota);
expectType<(config?: pkg.OrchestratorConfig) => Promise<void>>(pkg.initializeOrchestrator);

// Test that types are exported
expectType<pkg.Job>({} as pkg.Job);
expectType<pkg.JobRunInfo>({} as pkg.JobRunInfo);
expectType<pkg.JobProgress>({} as pkg.JobProgress);
expectType<pkg.JobStatus>({} as pkg.JobStatus);
expectType<pkg.OrchestratorOptions>({} as pkg.OrchestratorOptions);
expectType<pkg.OrchestratorConfig>({} as pkg.OrchestratorConfig);
expectType<pkg.Capabilities>({} as pkg.Capabilities);
expectType<pkg.Schedule>({} as pkg.Schedule);
expectType<pkg.IntervalSchedule>({} as pkg.IntervalSchedule);
expectType<pkg.OneShotSchedule>({} as pkg.OneShotSchedule);
expectType<pkg.FiniteSchedule>({} as pkg.FiniteSchedule);
expectType<pkg.StorageQuotaInfo>({} as pkg.StorageQuotaInfo);
