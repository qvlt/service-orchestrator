import { describe, it, expect, vi } from 'vitest';

import { SystemClock } from '../adapters/clock';

describe('SystemClock', () => {
  it('delegates to Date.now()', () => {
    const spy = vi.spyOn(Date, 'now').mockReturnValue(123456);
    expect(SystemClock.now()).toBe(123456);
    spy.mockRestore();
  });
});
