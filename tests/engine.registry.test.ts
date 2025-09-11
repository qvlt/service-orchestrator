import { describe, it, expect } from 'vitest';

import { Registry } from '../src/engine/registry';

describe('Registry', () => {
  it('validates job id and schedule', () => {
    const r = new Registry();
    expect(() => r.register({} as any)).toThrow(/Job id is required/i);
    expect(() => r.register({ id: 'x' } as any)).toThrow(/schedule is required/i);
  });

  it('validates everyMs for interval/finite', () => {
    const r = new Registry();
    expect(() => r.register({ id: 'x', handler: () => {}, schedule: { type: 'interval', everyMs: 0 } as any })).toThrow(
      /everyMs must be a positive number/,
    );
  });

  it('applies defaults and unregisters', () => {
    const r = new Registry();
    const unreg = r.register({ id: 'ok', handler: () => {}, schedule: { type: 'interval', everyMs: 1000 } });
    const j = r.get('ok');
    expect(j).toBeDefined();
    expect(j.enabled).toBe(true);
    expect(j.concurrency).toBe('allow');
    expect(j.uiVisible).toBe(true);

    unreg();
    expect(r.get('ok')).toBeUndefined();
  });

  it('finite with count<=0 is a no-op (no registration)', () => {
    const r = new Registry();
    const unreg = r.register({
      id: 'noop',
      handler: () => {},
      schedule: { type: 'finite', everyMs: 1000, count: 0 },
    });
    // It returns an unregister, but no job should be present
    expect(r.get('noop')).toBeUndefined();
    unreg(); // should not throw
  });
});
