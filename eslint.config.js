import config from '@qvlt/config-eslint';
import importPlugin from 'eslint-plugin-import';

export default [
  ...config,
  // global override using import/* rules
  {
    plugins: { import: importPlugin },
    rules: {
      'import/no-extraneous-dependencies': ['error', { peerDependencies: true }],
    },
  },
  {
    files: ['tests/**/*.{ts,tsx,js,jsx}'],
    plugins: { import: importPlugin },
    rules: {
      'import/no-extraneous-dependencies': ['error', { devDependencies: true, peerDependencies: true }],
    },
  },
  // Example files need Node.js globals and allow console
  {
    files: ['example/**/*.{js,ts}'],
    languageOptions: {
      globals: {
        console: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
      },
    },
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
  // Smoke test files need Node.js globals and allow require
  {
    files: ['tests/smoke-*.{cjs,mjs}'],
    languageOptions: {
      globals: {
        console: 'readonly',
        process: 'readonly',
        require: 'readonly',
        module: 'readonly',
        exports: 'readonly',
        __filename: 'readonly',
        __dirname: 'readonly',
      },
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
      'no-undef': 'off',
    },
  },
];
