// smoke-node.cjs - Node.js smoke test for service-orchestrator
const pkg = require('../dist/index.cjs');

console.log('🧪 Node.js smoke test for @qvlt/service-orchestrator');

try {
  // Test that the package can be imported
  console.log('✅ Package imported successfully');

  // Test that main exports exist
  const expectedExports = [
    'startOrchestrator',
    'stopOrchestrator',
    'disposeOrchestrator',
    'registerJob',
    'triggerJob',
    'getRunningJobs',
    'getJobHistory',
    'isOrchestratorSupported',
    'getCapabilities',
    'getCapabilityWarnings',
    'getStorageQuota',
  ];

  for (const exportName of expectedExports) {
    if (typeof pkg[exportName] === 'function') {
      console.log(`✅ Export '${exportName}' is a function`);
    } else {
      console.log(`❌ Export '${exportName}' is not a function:`, typeof pkg[exportName]);
      process.exit(1);
    }
  }

  // Test browser-only functions throw in Node.js
  try {
    pkg.startOrchestrator();
    console.log('❌ startOrchestrator should throw in Node.js environment');
    process.exit(1);
  } catch (error) {
    if (error.message.includes('browser-only')) {
      console.log('✅ startOrchestrator correctly throws in Node.js');
    } else {
      console.log('❌ startOrchestrator threw unexpected error:', error.message);
      process.exit(1);
    }
  }

  console.log('🎉 All Node.js smoke tests passed!');
} catch (error) {
  console.error('❌ Smoke test failed:', error.message);
  process.exit(1);
}
