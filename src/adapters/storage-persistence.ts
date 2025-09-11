// adapters/storage-persistence.ts
// Persistent storage utilities for orchestrator

import { getLogger } from '@qvlt/core-logger';

/**
 * Ensures persistent storage is available for the orchestrator.
 * Requests persistent storage if not already granted.
 *
 * @returns Promise<boolean> - true if persistent storage is available, false otherwise
 */
export async function ensurePersistentStorage(): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.storage?.persist) {
    return false;
  }

  try {
    // Check if storage is already persistent
    const isPersistent = await navigator.storage.persisted();
    if (isPersistent) {
      return true;
    }

    // Request persistent storage
    const granted = await navigator.storage.persist();
    return granted;
  } catch (error) {
    getLogger('storage-persistence').warn('Failed to request persistent storage', { error: String(error) });
    return false;
  }
}

/**
 * Gets storage quota information for diagnostics.
 *
 * @returns Promise<StorageQuotaInfo | null> - quota info or null if unavailable
 */
export async function getStorageQuota(): Promise<StorageQuotaInfo | null> {
  if (typeof navigator === 'undefined' || !navigator.storage?.estimate) {
    return null;
  }

  try {
    const estimate = await navigator.storage.estimate();
    return {
      quota: estimate.quota || 0,
      usage: estimate.usage || 0,
      available: (estimate.quota || 0) - (estimate.usage || 0),
      isPersistent: await navigator.storage.persisted(),
    };
  } catch (error) {
    getLogger('storage-persistence').warn('Failed to get storage quota', { error: String(error) });
    return null;
  }
}

export interface StorageQuotaInfo {
  quota: number;
  usage: number;
  available: number;
  isPersistent: boolean;
}
