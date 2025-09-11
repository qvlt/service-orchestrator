# @qvlt/service-orchestrator Example

This example demonstrates how to use the `@qvlt/service-orchestrator` package in a browser environment.

## Running the Example

### Prerequisites

1. Build the package first:
   ```bash
   pnpm run build
   ```

2. Serve the example files using a local server (required for ES modules):

   **Option A: Using Python**
   ```bash
   # Python 3
   python -m http.server 8000
   
   # Python 2
   python -m SimpleHTTPServer 8000
   ```

   **Option B: Using Node.js**
   ```bash
   npx serve .
   ```

   **Option C: Using VS Code Live Server extension**
   - Install the "Live Server" extension
   - Right-click on `index.html` and select "Open with Live Server"

3. Open your browser and navigate to `http://localhost:8000`

## What the Example Demonstrates

- **Browser Capability Detection**: Shows which browser features are available
- **Orchestrator Lifecycle**: Start/stop the orchestrator
- **Job Registration**: Register a sample backup job with interval scheduling
- **Job Monitoring**: View running jobs and their status
- **Manual Job Triggering**: Trigger jobs manually for testing
- **Progress Reporting**: See job progress updates in real-time

## Features Shown

- ✅ Browser support detection
- ✅ Orchestrator initialization with options
- ✅ Job registration with interval scheduling
- ✅ Manual job triggering
- ✅ Real-time job monitoring
- ✅ Progress reporting
- ✅ Console logging integration

## Browser Requirements

The orchestrator requires modern browser features:
- **IndexedDB** (required for job persistence)
- **Web Locks** (recommended for cross-tab coordination)
- **BroadcastChannel** (optional, for cross-tab progress updates)
- **LocalStorage** (optional, for last run tracking)

## Troubleshooting

### Import Errors
If you see import errors, make sure:
1. The package is built (`pnpm run build`)
2. You're serving the files via HTTP/HTTPS (not file://)
3. Your browser supports ES modules

### Browser Compatibility
The example will show a warning if your browser doesn't support the required features. Check the capabilities section for details.

### Job Not Running
- Ensure the orchestrator is started
- Check the browser console for any errors
- Verify that the job schedule is valid
