import { describe, it, expect } from 'vitest';

import { openDb, STORE, ANCHOR_PREFIX } from '../src/adapters/storage.idb';
import * as Anchors from '../src/storage/anchors';
import * as Ledger from '../src/storage/ledger';
import * as Prune from '../src/storage/prune';

const getRecord = async (key: string) => {
  const db = await openDb();
  const tx = db.transaction(STORE, 'readonly');
  const os = tx.objectStore();
  const req: IDBRequest = (os as any).get(key);
  const rec = await new Promise<any>((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('IDB get failed'));
  });
  await tx.done;
  return rec;
};

describe('IndexedDB-backed storage', () => {
  it('anchors: first-writer-wins', async () => {
    const a1 = await Anchors.getOrCreateAnchor('jobA', 5000);
    expect(a1).toBe(5000);

    const a2 = await Anchors.getOrCreateAnchor('jobA', 9999);
    expect(a2).toBe(5000); // existing anchor preserved

    const rec = await getRecord(`${ANCHOR_PREFIX}jobA`);
    expect(rec?.scheduledAt).toBe(5000);
  });

  it('ledger: claimRun add once, then reject; markDone sets doneAt', async () => {
    const key = 'jobB@1000';
    const ok1 = await Ledger.claimRun(key, { tryExclusive: async () => false });
    const ok2 = await Ledger.claimRun(key, { tryExclusive: async () => false });
    expect(ok1).toBe(true);
    expect(ok2).toBe(false);

    await Ledger.markDone(key);
    const rec = await getRecord(key);
    expect(rec.doneAt).toBeDefined();
  });

  it('prune: removes old non-anchor records and respects keep-last per job', async () => {
    // seed runs
    await Ledger.claimRun('jobC@1000', { tryExclusive: async () => false });
    await Ledger.markDone('jobC@1000');
    await Ledger.claimRun('jobC@2000', { tryExclusive: async () => false });
    await Ledger.markDone('jobC@2000');
    await Ledger.claimRun('jobC@3000', { tryExclusive: async () => false });
    await Ledger.markDone('jobC@3000');

    // and an anchor record
    await Anchors.getOrCreateAnchor('jobC', 1234);

    // prune <= 2000
    await Prune.pruneOlderThan(2000);
    const r1 = await getRecord('jobC@1000');
    const r2 = await getRecord('jobC@2000');
    let r3 = await getRecord('jobC@3000');
    const anchor = await getRecord(`${ANCHOR_PREFIX}jobC`);
    expect(r1).toBeUndefined();
    expect(r2).toBeUndefined();
    expect(r3).toBeDefined();
    expect(anchor).toBeDefined(); // never pruned

    // keep only the latest 1 run (should keep 3000)
    await Prune.prunePerJobKeepLast('jobC', 1);
    r3 = await getRecord('jobC@3000');
    expect(r3).toBeDefined();
  });
});
