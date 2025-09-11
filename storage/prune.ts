// prune.ts
// pruneOlderThan, prunePerJobKeepLast, pruneOlderThanDays, and they skip anchor records

import { ANCHOR_PREFIX, openDb, STORE, type RunRecord } from '../adapters/storage.idb';

/** Delete all run records with scheduledAt <= cutoffMs (skips anchors). */
export async function pruneOlderThan(cutoffMs: number): Promise<void> {
  const db = await openDb();
  const tx = db.transaction(STORE, 'readwrite');
  const idx = tx.objectStore().index('byScheduledAt');
  const range = IDBKeyRange.upperBound(cutoffMs);
  await new Promise<void>((resolve, reject) => {
    const req = idx.openCursor(range);
    req.onerror = () => reject(req.error ?? new Error('openCursor failed'));
    req.onsuccess = () => {
      const cursor = req.result as IDBCursorWithValue | null;
      if (!cursor) return resolve();
      const val = cursor.value as RunRecord;
      if (val && typeof val.key === 'string' && !val.key.startsWith(ANCHOR_PREFIX)) {
        cursor.delete();
      }
      cursor.continue();
    };
  });
  await tx.done;
}

/** Keep only the most recent `keep` runs for a given job (delete older ones, skips anchors). */
export async function prunePerJobKeepLast(jobId: string, keep: number): Promise<void> {
  const db = await openDb();
  const tx = db.transaction(STORE, 'readwrite');
  const idx = tx.objectStore().index('byJobScheduledAt');
  const range = IDBKeyRange.bound([jobId, -Infinity], [jobId, Infinity]);
  let seen = 0;
  await new Promise<void>((resolve, reject) => {
    const req = idx.openCursor(range, 'prev');
    req.onerror = () => reject(req.error ?? new Error('openCursor failed'));
    req.onsuccess = () => {
      const cursor = req.result as IDBCursorWithValue | null;
      if (!cursor) return resolve();
      const val = cursor.value as RunRecord;
      if (val && typeof val.key === 'string' && !val.key.startsWith(ANCHOR_PREFIX)) {
        if (++seen > keep) cursor.delete();
      }
      cursor.continue();
    };
  });
  await tx.done;
}

/** Convenience: prune by fixed days. */
export async function pruneOlderThanDays(days: number): Promise<void> {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  await pruneOlderThan(cutoff);
}
