// adapters/lock.web.ts
// Best-effort Web Locks wrapper (non-blocking). No dependency on engine types.

export const WebLockAdapter = {
  async tryExclusive(key: string, opts?: { timeoutMs?: number }): Promise<boolean> {
    const api = (
      navigator as {
        locks?: { request?: (name: string, options: unknown, callback: (lock: unknown) => void) => Promise<void> };
      }
    )?.locks;
    if (!api?.request) return false;

    const name = `qvlt:${key}`;
    const timeout = opts?.timeoutMs ?? 0;

    let timer: ReturnType<typeof setTimeout> | null = null;
    let won = false;

    // Abort politely on timeout where supported
    const ac = typeof AbortController !== 'undefined' ? new AbortController() : null;

    try {
      const req = api.request(name, { ifAvailable: true, mode: 'exclusive', signal: ac?.signal }, (lock: unknown) => {
        // If not granted, callback runs with undefined
        won = !!lock;
      });

      if (timeout > 0) {
        await Promise.race([
          req,
          new Promise((_r, rej) => {
            timer = setTimeout(() => {
              try {
                ac?.abort();
              } catch {
                // Ignore abort errors
              }
              rej(new Error('lock-timeout'));
            }, timeout);
          }),
        ]).catch(() => {
          /* swallow: best-effort */
        });
      } else {
        await req;
      }
    } catch {
      // best-effort fallback only
    } finally {
      if (timer) clearTimeout(timer);
    }

    return won;
  },
};
