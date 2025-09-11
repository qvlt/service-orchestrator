// anchors.ts
// getOrCreateAnchor as a unique key; never pruned

import { ANCHOR_PREFIX, createTabId, isConstraintError, openDb, STORE, type RunRecord } from '../adapters/storage.idb';

const TAB_ID = createTabId();

/** Atomically initialize and return a cross-tab anchor value for a job. */
export async function getOrCreateAnchor(jobId: string, suggestedStartAt: number): Promise<number> {
  const key = `${ANCHOR_PREFIX}${jobId}`;
  const now = Date.now();
  const db = await openDb();
  const tx = db.transaction(STORE, 'readwrite');
  try {
    // first-writer-wins
    const store = tx.objectStore();
    const rec: RunRecord = {
      key,
      jobId,
      scheduledAt: suggestedStartAt, // store anchor in scheduledAt
      ownerId: TAB_ID,
      claimedAt: now,
      doneAt: suggestedStartAt,
    };
    const req = store.add(rec);
    await new Promise<void>((resolve, reject) => {
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error ?? new Error('IDB add failed'));
    });
    await tx.done;
    return suggestedStartAt;
  } catch (err: unknown) {
    // consume aborted tx rejection (ConstraintError path)
    try {
      await tx.done;
    } catch {
      // Transaction was aborted, which is expected for constraint errors
    }
    if (!isConstraintError(err)) throw err;
    const db2 = await openDb();
    const tx2 = db2.transaction(STORE, 'readonly');
    const store2 = tx2.objectStore();
    const req = store2.get(key);
    const rec = await new Promise<RunRecord | undefined>((resolve, reject) => {
      req.onsuccess = () => resolve(req.result as RunRecord | undefined);
      req.onerror = () => reject(req.error ?? new Error('IDB get failed'));
    });
    await tx2.done;
    return rec?.scheduledAt ?? suggestedStartAt;
  }
}
