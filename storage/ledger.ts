// storage/ledger.ts
// claimRun, markDone using add() first-writer-wins; falls back to Web Locks adapter on IDB failure

import { ANCHOR_PREFIX, createTabId, isConstraintError, openDb, type RunRecord, STORE } from '../adapters/storage.idb';

// Minimal local type so we don't depend on engine/types
type LockLike = {
  tryExclusive(key: string, opts?: { timeoutMs?: number }): Promise<boolean>;
};

const TAB_ID = createTabId();

export async function claimRun(runKey: string, lockAdapter: LockLike): Promise<boolean> {
  const db = await openDb();
  const tx = db.transaction(STORE, 'readwrite');
  try {
    const store = tx.objectStore();
    const now = Date.now();
    const rec: RunRecord = {
      key: runKey,
      jobId: jobIdOf(runKey),
      scheduledAt: scheduledAtOf(runKey),
      ownerId: TAB_ID,
      claimedAt: now,
    };
    const req = store.add(rec); // throws if key exists
    await new Promise<void>((resolve, reject) => {
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error ?? new Error('IDB add failed'));
    });
    await tx.done;
    return true;
  } catch (err: unknown) {
    // consume aborted tx rejection (ConstraintError path)
    try {
      await tx.done;
    } catch {
      // Transaction was aborted, which is expected for constraint errors
    }
    if (isConstraintError(err)) return false;
    // Fallback for environments where IDB is blocked/unavailable
    try {
      return await lockAdapter.tryExclusive(runKey);
    } catch {
      return false;
    }
  }
}

export async function markDone(runKey: string): Promise<void> {
  const db = await openDb();
  const tx = db.transaction(STORE, 'readwrite');
  try {
    const store = tx.objectStore();
    const req = store.get(runKey);
    const rec = await new Promise<RunRecord | undefined>((resolve, reject) => {
      req.onsuccess = () => resolve(req.result as RunRecord | undefined);
      req.onerror = () => reject(req.error ?? new Error('IDB get failed'));
    });
    if (rec && !rec.key.startsWith(ANCHOR_PREFIX)) {
      rec.doneAt = Date.now();
      const putReq = store.put(rec);
      await new Promise<void>((resolve, reject) => {
        putReq.onsuccess = () => resolve();
        putReq.onerror = () => reject(putReq.error ?? new Error('IDB put failed'));
      });
    }
    await tx.done;
  } catch {
    try {
      await tx.done;
    } catch {
      // Transaction was aborted, which is expected for non-fatal errors
    }
    // non-fatal
  }
}

// Internals ------------------------------------------------------------------

function jobIdOf(runKey: string): string {
  const at = runKey.lastIndexOf('@');
  return at > 0 ? runKey.slice(0, at) : runKey;
}

function scheduledAtOf(runKey: string): number {
  const at = runKey.lastIndexOf('@');
  const n = Number(runKey.slice(at + 1));
  return Number.isFinite(n) ? n : Date.now();
}
