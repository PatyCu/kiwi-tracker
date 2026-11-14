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
  {
    // React Native Web drops accessibilityState, so web screen readers never hear it.
    files: ['src/**/*.tsx'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'JSXAttribute[name.name="accessibilityState"]',
          message:
            'Use aria-selected, aria-checked, aria-expanded or aria-busy (and Pressable `disabled`), which reach both iOS and the web DOM.',
        },
      ],
    },
  },
  prettierConfig,
]);
