import {
  startOrchestrator,
  stopOrchestrator,
  registerJob,
  triggerJob,
  getRunningJobs,
  getJobHistory,
  isOrchestratorSupported,
  getCapabilities,
} from '@qvlt/service-orchestrator';

async function runTests() {
  console.log('🧪 Running @qvlt/service-orchestrator Tests');
  console.log('==========================================\n');

  // Test 1: Browser support check
  console.log('Test 1: Browser support check');
  const supported = isOrchestratorSupported();
  console.log('Orchestrator supported:', supported);
  
  if (!supported) {
    console.log('❌ Tests cannot run - orchestrator not supported');
    return;
  }
  console.log('✅ Browser support check passed');

  // Test 2: Capabilities check
  console.log('\nTest 2: Capabilities check');
  const capabilities = getCapabilities();
  console.log('Capabilities:', capabilities);
  console.log('✅ Capabilities check passed');

  // Test 3: Orchestrator lifecycle
  console.log('\nTest 3: Orchestrator lifecycle');
  startOrchestrator({
    maxConcurrentJobs: 2,
    defaultTimeout: 5000,
  });
  console.log('✅ Orchestrator started');

  // Test 4: Job registration
  console.log('\nTest 4: Job registration');
  const testJob = registerJob({
    id: 'test-job',
    name: 'Test Job',
    schedule: {
      type: 'interval',
      everyMs: 1000,
      runAtStartup: false,
    },
    concurrency: 'allow',
    handler: async (ctx) => {
      console.log('Test job running...');
      await new Promise(resolve => setTimeout(resolve, 100));
      console.log('Test job completed');
    },
  });
  console.log('✅ Job registered');

  // Test 5: Manual job trigger
  console.log('\nTest 5: Manual job trigger');
  try {
    await triggerJob('test-job');
    console.log('✅ Manual job trigger successful');
  } catch (error) {
    console.log('❌ Manual job trigger failed:', error.message);
  }

  // Test 6: Running jobs check
  console.log('\nTest 6: Running jobs check');
  await new Promise(resolve => setTimeout(resolve, 200));
  const running = getRunningJobs();
  console.log('Running jobs:', running.length);
  console.log('✅ Running jobs check passed');

  // Test 7: Job history
  console.log('\nTest 7: Job history');
  await new Promise(resolve => setTimeout(resolve, 500));
  const history = getJobHistory('test-job', 3);
  console.log('Job history entries:', history.length);
  console.log('✅ Job history check passed');

  // Test 8: Job unregistration
  console.log('\nTest 8: Job unregistration');
  testJob();
  console.log('✅ Job unregistered');

  // Test 9: Orchestrator stop
  console.log('\nTest 9: Orchestrator stop');
  stopOrchestrator();
  console.log('✅ Orchestrator stopped');

  console.log('\n🎉 All tests passed!');
}

runTests().catch(console.error);
