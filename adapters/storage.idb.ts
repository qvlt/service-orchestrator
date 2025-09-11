// storage.idb.ts
// Low-level IndexedDB operations and constants

export const DB_NAME = 'qvlt-orchestrator';
export const DB_VER = 4; // indexes + anchor helper
export const STORE = 'runs';
export const ANCHOR_PREFIX = 'anchor:';

export type RunRecord = {
  key: string; // primary key: `${jobId}@${scheduledAt}` or `anchor:${jobId}`
  jobId: string;
  scheduledAt: number; // ms epoch (for anchor: the anchor value)
  ownerId: string; // tab id (random)
  claimedAt: number; // ms
  doneAt?: number; // ms
  leaseMs?: number; // reserved for future "rescue" logic
};

type WrappedDB = {
  transaction(
    name: string,
    mode: IDBTransactionMode,
  ): {
    objectStore(): IDBObjectStore;
    done: Promise<void>;
  };
};

let _dbPromise: Promise<WrappedDB> | null = null;

export async function openDb(): Promise<WrappedDB> {
  if (_dbPromise) return _dbPromise;
  _dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VER);
    req.onupgradeneeded = () => {
      const db = req.result;
      let store: IDBObjectStore;
      if (!db.objectStoreNames.contains(STORE)) {
        store = db.createObjectStore(STORE, { keyPath: 'key' });
      } else {
        store = (req.transaction as IDBTransaction).objectStore(STORE);
      }
      // Indexes for fast pruning
      if (!store.indexNames.contains('byScheduledAt')) {
        store.createIndex('byScheduledAt', 'scheduledAt', { unique: false });
      }
      if (!store.indexNames.contains('byJobScheduledAt')) {
        store.createIndex('byJobScheduledAt', ['jobId', 'scheduledAt'], { unique: false });
      }
    };
    req.onsuccess = () => resolve(wrapDB(req.result));
    req.onerror = () => {
      _dbPromise = null;
      reject(req.error);
    };
    req.onblocked = () => {
      _dbPromise = null;
      reject(new Error('IndexedDB open blocked'));
    };
  });
  return _dbPromise;
}

function wrapDB(db: IDBDatabase): WrappedDB {
  return {
    transaction(storeName: string, mode: IDBTransactionMode) {
      const tx = db.transaction(storeName, mode);
      const os = tx.objectStore(storeName);
      const done = new Promise<void>((res, rej) => {
        tx.oncomplete = () => res();
        tx.onerror = () => rej(tx.error ?? new Error('IDB transaction error'));
        tx.onabort = () => rej(tx.error ?? new Error('IDB transaction aborted'));
      });
      return { objectStore: () => os, done };
    },
  };
}

export function isConstraintError(err: unknown): boolean {
  return (err as { name?: string })?.name === 'ConstraintError';
}

export function createTabId(): string {
  const rand = Math.random().toString(16).slice(2);
  const ts = Date.now().toString(16);
  return `${rand}-${ts}`;
}
