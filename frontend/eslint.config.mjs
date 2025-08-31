// import { defineConfig } from 'eslint/config'

// import eslintPluginPrettier from 'eslint-plugin-prettier'

// export default defineConfig([
//   {
//     files: ['**/*.{js,mjs,cjs,ts,mts,cts,tsx}'],
//     ignores: ['node_modules', '.next'],
//     languageOptions: {
//       globals: globals.browser,
//     },
//     extends: [js.configs.recommended, ...tseslint.configs.recommended],
//     plugins: {
//       prettier: eslintPluginPrettier,
//     },
//     rules: {
//       'prettier/prettier': [
//         'warn',
//         {
//           arrowParens: 'always',
//           semi: false,
//           trailingComma: 'all',
//           tabWidth: 2,
//           endOfLine: 'auto', // This setting is useful in cross-platform development teams
//           useTabs: false,
//           singleQuote: true,
//           printWidth: 120,
//           jsxSingleQuote: true,
//         },
//       ],
//     },
//   },
// ])

import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.config({
    ignorePatterns: ['node_modules', '.next', 'out', 'build', 'next-env.d.ts'],
    extends: [
      'next/core-web-vitals', 
      'next/typescript',
      'prettier'
    ],
    rules: {
      semi: ['error'], // for testing
    },
  })
];

export default eslintConfig;
