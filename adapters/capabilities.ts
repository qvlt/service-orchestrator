// adapters/capabilities.ts
// Browser capability detection for orchestrator diagnostics

export interface OrchestratorCapabilities {
  hasIndexedDB: boolean;
  hasWebLocks: boolean;
  hasBroadcastChannel: boolean;
  hasLocalStorage: boolean;
  hasPersistentStorage: boolean;
  hasServiceWorker: boolean;
  isSecureContext: boolean;
}

/**
 * Detects browser capabilities relevant to the orchestrator.
 * Useful for diagnostics and feature detection.
 */
export function getCapabilities(): OrchestratorCapabilities {
  return {
    hasIndexedDB: typeof indexedDB !== 'undefined',
    hasWebLocks: typeof navigator !== 'undefined' && 'locks' in navigator,
    hasBroadcastChannel: typeof BroadcastChannel !== 'undefined',
    hasLocalStorage: (() => {
      try {
        return typeof localStorage !== 'undefined' && localStorage !== null;
      } catch {
        return false;
      }
    })(),
    hasPersistentStorage: typeof navigator !== 'undefined' && 'storage' in navigator && 'persist' in navigator.storage,
    hasServiceWorker: typeof navigator !== 'undefined' && 'serviceWorker' in navigator,
    isSecureContext: typeof window !== 'undefined' && window.isSecureContext,
  };
}

/**
 * Gets a human-readable summary of capabilities for debugging.
 */
export function getCapabilitiesSummary(): string {
  const caps = getCapabilities();
  const features = [];

  if (caps.hasIndexedDB) features.push('IndexedDB');
  if (caps.hasWebLocks) features.push('Web Locks');
  if (caps.hasBroadcastChannel) features.push('BroadcastChannel');
  if (caps.hasLocalStorage) features.push('LocalStorage');
  if (caps.hasPersistentStorage) features.push('Persistent Storage');
  if (caps.hasServiceWorker) features.push('Service Worker');
  if (caps.isSecureContext) features.push('Secure Context');

  return features.length > 0 ? `Available: ${features.join(', ')}` : 'No advanced features available';
}

/**
 * Checks if the environment supports the orchestrator's core features.
 */
export function isOrchestratorSupported(): boolean {
  const caps = getCapabilities();

  // Cross-tab dedupe works with IDB alone; Locks are a quality/fallback boost.
  return caps.hasIndexedDB || caps.hasWebLocks;
}

/**
 * Gets warnings about missing capabilities that might affect functionality.
 */
export function getCapabilityWarnings(): string[] {
  const caps = getCapabilities();
  const warnings: string[] = [];

  if (!caps.hasIndexedDB) {
    warnings.push('IndexedDB not available - job persistence will not work');
  }

  if (!caps.hasWebLocks) {
    warnings.push('Web Locks not available - cross-tab coordination may be limited');
  }

  if (!caps.hasBroadcastChannel) {
    warnings.push('BroadcastChannel not available - cross-tab progress updates will not work');
  }

  if (!caps.hasLocalStorage) {
    warnings.push('LocalStorage not available - last run tracking will not work');
  }

  if (!caps.isSecureContext) {
    warnings.push('Not in secure context - some features may be limited');
  }

  return warnings;
}
