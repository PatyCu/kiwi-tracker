const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettierConfig = require('eslint-config-prettier/flat');

module.exports = defineConfig([
  {
    ignores: ['.claude/**', '.expo/**', 'coverage/**', 'dist/**', 'node_modules/**'],
  },
  expoConfig,
  {
    files: ['__tests__/**/*.{ts,tsx}', 'src/**/*.test.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  {
    // Supabase sits behind the persistence boundary; see docs/architecture.md.
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/shared/supabase/**', 'src/modules/*/persistence/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@supabase/supabase-js',
              message: 'Use Supabase only from a persistence module.',
            },
          ],
          patterns: [
            {
              group: ['@/shared/supabase/supabaseClient'],
              message: 'Use Supabase only from a persistence module.',
            },
          ],
        },
      ],
    },
  },
  prettierConfig,
]);
