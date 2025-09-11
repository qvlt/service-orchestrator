# @qvlt/service-orchestrator

A job orchestrator for background task management in web applications.

## Features

- **Job Scheduling**: Support for interval, finite, and one-time job scheduling
- **Progress Tracking**: Real-time job progress reporting with cross-tab synchronization
- **Concurrency Control**: Configurable concurrency policies
- **Persistence**: Job history and state persistence using IndexedDB with persistent storage support
- **Cross-tab Coordination**: Ensures jobs run only once across multiple browser tabs
- **Background Resilience**: Handles timer throttling and catches up on wake
- **Browser Capabilities**: Automatic detection and graceful degradation
- **TypeScript Support**: Full TypeScript support with type definitions

## Usage

```typescript
import { startOrchestrator, registerJob, triggerJob, initializeOrchestrator } from '@qvlt/service-orchestrator';
import { getLogger } from '@qvlt/core-logger';

// Initialize logger first (recommended)
const logger = getLogger('my-app');

// Initialize orchestrator (optional but recommended)
await initializeOrchestrator({
  retentionDays: 7,
  housekeeping: true,
  debug: false,
});

// Start the orchestrator
startOrchestrator({
  retentionDays: 7,
  housekeeping: true,
  debug: false,
});

// Register a job
const unregister = registerJob({
  id: 'my-job',
  schedule: { type: 'interval', everyMs: 60000 }, // Run every minute
  handler: async (ctx) => {
    // Your job logic here
    ctx.reportProgress(50, 100, 'Processing...');
    // ... do work
    ctx.reportProgress(100, 100, 'Complete');
  },
  uiVisible: true,
});

// Trigger a job manually
await triggerJob('my-job');

// Clean up
unregister();
```

## Job Types

### Interval Jobs

Run at regular intervals:

```typescript
{
  schedule: {
    type: 'interval',
    everyMs: 60000, // 1 minute
    jitterMs: 1000, // Optional jitter
    runAtStartup: true // Run immediately on startup
  }
}
```

### Finite Jobs

Run a specific number of times:

```typescript
{
  schedule: {
    type: 'finite',
    everyMs: 60000,
    count: 10, // Run 10 times
    runAtStartup: true
  }
}
```

### One-time Jobs

Run at a specific time:

```typescript
{
  schedule: {
    type: 'at',
    at: Date.now() + 60000, // Run in 1 minute
    skipIfPast: true
  }
}
```

## Concurrency Policies

- `'allow'`: Multiple instances can run simultaneously
- `'skip'`: Skip if already running
- `'wait'`: Wait for previous instance to complete (retries every ~50ms, won't starve periodic rescheduling)

## Cross-tab Progress Synchronization

The orchestrator automatically synchronizes job progress across browser tabs using BroadcastChannel:

```typescript
// Progress updates are automatically broadcast to all tabs
const unregister = registerJob({
  id: 'data-sync',
  schedule: { type: 'interval', everyMs: 30000 },
  handler: async (ctx) => {
    ctx.reportProgress(25, 100, 'Fetching data...');
    // This progress will be visible in all tabs

    ctx.reportProgress(75, 100, 'Processing...');
    // This too...

    ctx.reportProgress(100, 100, 'Complete');
  },
});
```

Falls back to local-tab only when BroadcastChannel isn't available.

## Background Timer Handling

The orchestrator is designed to handle browser timer throttling gracefully:

- **Timer Throttling**: When tabs are in the background, browsers may throttle timers. The orchestrator detects this and catches up when the tab becomes active again.
- **Deadline-based**: Jobs are scheduled based on deadlines, not exact intervals, ensuring they run at the right time even after throttling.
- **Catch-up Logic**: Missed executions are detected and handled appropriately based on the job type.

## Persistent Storage

The orchestrator automatically requests persistent storage when available:

```typescript
// This happens automatically during initialization
await initializeOrchestrator();

// You can also check storage capabilities
import { getCapabilities, getStorageQuota } from '@qvlt/service-orchestrator';

const capabilities = getCapabilities();
console.log('Persistent storage available:', capabilities.hasPersistentStorage);

const quota = await getStorageQuota();
console.log('Storage quota:', quota);
```

## Browser Capabilities

The orchestrator automatically detects browser capabilities and provides diagnostics:

```typescript
import {
  getCapabilities,
  getCapabilitiesSummary,
  isOrchestratorSupported,
  getCapabilityWarnings,
} from '@qvlt/service-orchestrator';

// Check if orchestrator is fully supported
if (!isOrchestratorSupported()) {
  console.warn('Orchestrator may have limited functionality');
}

// Get detailed capabilities
const capabilities = getCapabilities();
console.log('IndexedDB available:', capabilities.hasIndexedDB);
console.log('Web Locks available:', capabilities.hasWebLocks);
console.log('BroadcastChannel available:', capabilities.hasBroadcastChannel);

// Get human-readable summary
console.log(getCapabilitiesSummary());

// Get warnings about missing features
const warnings = getCapabilityWarnings();
warnings.forEach((warning) => console.warn(warning));
```

## Cleanup and Disposal

For proper cleanup, especially during hot module replacement:

```typescript
import { disposeOrchestrator } from '@qvlt/service-orchestrator';

// Clean up all resources
disposeOrchestrator();
```

## License

MIT
