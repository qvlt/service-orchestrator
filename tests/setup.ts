// Polyfill IndexedDB for Node
import 'fake-indexeddb/auto';
import { vi } from 'vitest';

// Minimal global navigator default
(globalThis as unknown as { navigator?: object }).navigator ??= {};

// Silence logging by mocking your logger everywhere
vi.mock('@qvlt/core-logger', () => ({
  getLogger: () => ({
    info: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  }),
}));
