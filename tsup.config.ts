import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  platform: 'browser',
  target: 'es2020',
  treeshake: true,
  minify: false,
  external: ['@qvlt/core-logger'],
});
