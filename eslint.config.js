import config from '@qvlt/config-eslint';

export default [
  ...config,
  {
    rules: {
      'import/no-extraneous-dependencies': ['error', { peerDependencies: true }],
    },
  },
  {
    files: ['tests/**/*.{ts,tsx,js,jsx}'],
    rules: {
      'import/no-extraneous-dependencies': ['error', { devDependencies: true, peerDependencies: true }],
    },
  },
];
