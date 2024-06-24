import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'
import stylistic from '@stylistic/eslint-plugin'
import globals from 'globals'

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  ...tseslint.configs.recommended,
  ...tseslint.configs.stylistic,
  ...tseslint.configs.stylisticTypeChecked,
  stylistic.configs['recommended-flat'],
  {
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        ...globals.node,
      },
    },
    files: ['**/*.js', '**/*.ts'],
    rules: {
      'space-before-function-paren': [
        'error',
        {
          anonymous: 'always',
          named: 'never',
          asyncArrow: 'always',
        },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          ignoreRestSiblings: true,
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'off',
      '@stylistic/brace-style': ['error', '1tbs', { allowSingleLine: false }],
      '@stylistic/no-mixed-operators': 'error',
      // revisit - recommendedTypeChecked
      '@typescript-eslint/no-misused-promises': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/restrict-template-expressions': 'off',
      // revisit - stylisticTypeChecked
      '@typescript-eslint/non-nullable-type-assertion-style': 'off',
    },
  },
  {
    ignores: ['**/dist/**/*', '**/node_modules/**/*'],
  },
)
