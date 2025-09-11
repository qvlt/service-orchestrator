import {
  startOrchestrator,
  stopOrchestrator,
  registerJob,
  triggerJob,
  getRunningJobs,
  getJobHistory,
  isOrchestratorSupported,
  getCapabilities,
  getCapabilityWarnings,
} from '@qvlt/service-orchestrator';

async function main() {
  console.log('🚀 @qvlt/service-orchestrator Example');
  console.log('====================================\n');

  // Check browser support
  console.log('1. Browser Support Check:');
  const supported = isOrchestratorSupported();
  console.log('Orchestrator supported:', supported);
  
  if (!supported) {
    console.log('❌ Orchestrator not supported in this environment');
    return;
  }

  const capabilities = getCapabilities();
  console.log('Capabilities:', capabilities);
  
  const warnings = getCapabilityWarnings();
  if (warnings.length > 0) {
    console.log('Warnings:', warnings);
  }

  // Start the orchestrator
  console.log('\n2. Starting Orchestrator:');
  startOrchestrator({
    maxConcurrentJobs: 3,
    defaultTimeout: 30000,
  });
  console.log('✅ Orchestrator started');

  // Register some example jobs
  console.log('\n3. Registering Jobs:');

  // Job 1: Simple interval job
  const cleanupJob = registerJob({
    id: 'cleanup-temp-files',
    name: 'Cleanup Temporary Files',
    schedule: {
      type: 'interval',
      everyMs: 5000, // Every 5 seconds
      runAtStartup: false,
    },
    concurrency: 'skip',
    handler: async (ctx) => {
      console.log('🧹 Cleaning up temporary files...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('✅ Cleanup completed');
    },
  });

  // Job 2: One-shot job
  const backupJob = registerJob({
    id: 'backup-data',
    name: 'Backup Data',
    schedule: {
      type: 'at',
      at: Date.now() + 2000, // Run in 2 seconds
    },
    concurrency: 'allow',
    handler: async (ctx) => {
      console.log('💾 Starting data backup...');
      ctx.reportProgress(0, 100, 'Initializing backup');
      
      for (let i = 0; i < 100; i += 20) {
        await new Promise(resolve => setTimeout(resolve, 200));
        ctx.reportProgress(i + 20, 100, `Backing up ${i + 20}%`);
      }
      
      console.log('✅ Backup completed');
    },
  });

  // Job 3: Finite job (runs 3 times)
  const reportJob = registerJob({
    id: 'generate-report',
    name: 'Generate Report',
    schedule: {
      type: 'finite',
      everyMs: 3000, // Every 3 seconds
      count: 3, // Run 3 times total
      runAtStartup: true,
    },
    concurrency: 'wait',
    handler: async (ctx) => {
      console.log('📊 Generating report...');
      await new Promise(resolve => setTimeout(resolve, 1500));
      console.log('✅ Report generated');
    },
  });

  console.log('✅ Jobs registered');

  // Monitor running jobs
  console.log('\n4. Monitoring Jobs:');
  const monitorInterval = setInterval(() => {
    const running = getRunningJobs();
    if (running.length > 0) {
      console.log('Running jobs:', running.map(job => ({
        id: job.jobId,
        status: job.status,
        startedAt: new Date(job.startedAt).toLocaleTimeString(),
      })));
    }
  }, 1000);

  // Trigger a job manually
  console.log('\n5. Manual Job Trigger:');
  setTimeout(async () => {
    try {
      await triggerJob('backup-data');
      console.log('✅ Manual backup triggered');
    } catch (error) {
      console.log('❌ Failed to trigger backup:', error.message);
    }
  }, 1000);

  // Show job history
  console.log('\n6. Job History:');
  setTimeout(() => {
    const history = getJobHistory('generate-report', 5);
    console.log('Report job history:', history.map(run => ({
      runKey: run.runKey,
      status: run.status,
      scheduledAt: new Date(run.scheduledAt).toLocaleTimeString(),
      completedAt: run.completedAt ? new Date(run.completedAt).toLocaleTimeString() : 'N/A',
    })));
  }, 8000);

  // Cleanup after 15 seconds
  setTimeout(() => {
    console.log('\n7. Cleanup:');
    clearInterval(monitorInterval);
    
    // Unregister jobs
    cleanupJob();
    backupJob();
    reportJob();
    console.log('✅ Jobs unregistered');
    
    // Stop orchestrator
    stopOrchestrator();
    console.log('✅ Orchestrator stopped');
    
    console.log('\n🎉 Example completed successfully!');
  }, 15000);
}

main().catch(console.error);
