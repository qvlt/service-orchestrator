import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      reportsDirectory: 'coverage',
    },
    restoreMocks: true,
    clearMocks: true,
    mockReset: true,
    deps: {
      interopDefault: true,
    },
  },
});
