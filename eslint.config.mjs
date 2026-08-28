import pluginQuery from '@tanstack/eslint-plugin-query';
import nextConfig from 'eslint-config-next/core-web-vitals';
import prettierConfig from 'eslint-config-prettier';
import unusedImports from 'eslint-plugin-unused-imports';

export default [
  ...nextConfig,
  ...pluginQuery.configs['flat/recommended'],
  prettierConfig,
  {
    plugins: {
      'unused-imports': unusedImports,
    },
    rules: {
      'unused-imports/no-unused-imports': 'error',
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
  {
    // Backend writes must go through the authenticated wrapper so production
    // security rules (request.auth.token.backend) allow them.
    files: ['src/backend/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'firebase/firestore',
              importNames: ['runTransaction'],
              message:
                'Import runBackendTransaction from @/firebase/backend-firestore instead — it signs in the backend identity before opening the transaction.',
            },
          ],
        },
      ],
    },
  },
];
