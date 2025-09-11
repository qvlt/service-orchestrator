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
expectType<typeof pkg.isOrchestratorSupported>(pkg.isOrchestratorSupported);
expectType<typeof pkg.getCapabilities>(pkg.getCapabilities);
expectType<typeof pkg.getCapabilityWarnings>(pkg.getCapabilityWarnings);
expectType<typeof pkg.ensurePersistentStorage>(pkg.ensurePersistentStorage);
expectType<typeof pkg.getStorageQuota>(pkg.getStorageQuota);

// Test function signatures
expectType<(opts?: pkg.OrchestratorOptions) => void>(pkg.startOrchestrator);
expectType<() => void>(pkg.stopOrchestrator);
expectType<() => void>(pkg.disposeOrchestrator);
expectType<(job: pkg.Job) => () => void>(pkg.registerJob);
expectType<(id: string) => Promise<void>>(pkg.triggerJob);
expectType<() => pkg.JobRunInfo[]>(pkg.getRunningJobs);
expectType<(jobId: string, limit?: number) => pkg.JobRunInfo[]>(pkg.getJobHistory);
expectType<() => boolean>(pkg.isOrchestratorSupported);
expectType<() => pkg.Capabilities>(pkg.getCapabilities);
expectType<() => string[]>(pkg.getCapabilityWarnings);
expectType<() => Promise<void>>(pkg.ensurePersistentStorage);
expectType<() => Promise<{ used: number; total: number }>>(pkg.getStorageQuota);

// Test that types are exported
expectType<pkg.Job>({} as pkg.Job);
expectType<pkg.JobRunInfo>({} as pkg.JobRunInfo);
expectType<pkg.OrchestratorOptions>({} as pkg.OrchestratorOptions);
expectType<pkg.Capabilities>({} as pkg.Capabilities);
expectType<pkg.Schedule>({} as pkg.Schedule);
expectType<pkg.IntervalSchedule>({} as pkg.IntervalSchedule);
expectType<pkg.OneShotSchedule>({} as pkg.OneShotSchedule);
expectType<pkg.FiniteSchedule>({} as pkg.FiniteSchedule);
expectType<pkg.JobStatus>({} as pkg.JobStatus);
expectType<pkg.JobProgress>({} as pkg.JobProgress);
expectType<pkg.JobRunContext>({} as pkg.JobRunContext);
