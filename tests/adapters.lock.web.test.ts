import { describe, it, expect, vi, beforeEach } from 'vitest';

import { WebLockAdapter } from '../adapters/lock.web';

describe('WebLockAdapter.tryExclusive', () => {
  beforeEach(() => {
    // reset navigator.locks for each test
    (globalThis as any).navigator = {};
  });

  it('returns false if Web Locks API is not available', async () => {
    expect(await WebLockAdapter.tryExclusive('k')).toBe(false);
  });

  it('returns true when lock is granted', async () => {
    (globalThis as any).navigator.locks = {
      request: (_name: string, _opts: any, cb: (lock: unknown) => void) => Promise.resolve().then(() => cb({})),
    };
    await expect(WebLockAdapter.tryExclusive('abc')).resolves.toBe(true);
  });

  it('times out and returns false if request never resolves', async () => {
    vi.useFakeTimers();
    (globalThis as any).navigator.locks = {
      request: () =>
        new Promise<void>(() => {
          /* never resolve */
        }),
    };

    const p = WebLockAdapter.tryExclusive('zzz', { timeoutMs: 10 });
    await vi.advanceTimersByTimeAsync(15);
    await expect(p).resolves.toBe(false);
    vi.useRealTimers();
  });
});
