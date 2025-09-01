import { dirname } from 'path'
import { fileURLToPath } from 'url'
import { FlatCompat } from '@eslint/eslintrc'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({
  baseDirectory: __dirname,
})

const eslintConfig = [
  ...compat.config({
    ignorePatterns: ['node_modules', '.next', 'out', 'build', 'next-env.d.ts'],
    extends: ['next/core-web-vitals', 'next/typescript', 'plugin:prettier/recommended'],
    plugins: ['prettier'],
    rules: {
      'prettier/prettier': [
        'warn',
        {
          arrowParens: 'always',
          semi: false,
          trailingComma: 'all',
          tabWidth: 2,
          endOfLine: 'auto', // This setting is useful in cross-platform development teams
          useTabs: false,
          singleQuote: true,
          printWidth: 120,
          jsxSingleQuote: true,
        },
      ],

      '@typescript-eslint/no-unused-vars': 'warn', // unused variables
      '@typescript-eslint/no-explicit-any': 'warn', // "any" typing
      '@typescript-eslint/no-non-null-assertion': 'warn', // non-null assertion operator (!)
      '@typescript-eslint/no-empty-object-type': 'off', // empty object type

      'no-unused-vars': 'warn',
      'no-console': 'warn', // console.log, console.error, etc.
      'no-lonely-if': 'warn', // lonely if statements
      'no-duplicate-imports': 'warn', // duplicate imports
      'no-empty': 'warn', // empty blocks
      'no-undef': 'error', // undefined variables
      'no-const-assign': 'error', // reassigning const variables
      'no-multi-spaces': 'warn', // multiple spaces
      'space-before-blocks': ['warn', 'always'], // space before blocks
      'object-curly-spacing': ['warn', 'always'], // object curly spacing
      // 'array-bracket-spacing': ['warn', 'always'], // array bracket spacing
      indent: ['warn', 2], // tab size
      semi: ['error', 'never'], // semicolon ";"
      quotes: ['error', 'single'], // quotes 'single' or "double"
      'linebreak-style': 0, // linebreak style (LF or CRLF)
      'no-unexpected-multiline': 'warn',
      'keyword-spacing': ['warn', { before: true, after: true }], // keyword spacing (if, for, while, etc.)
      'comma-dangle': 'off', // trailing commas (, )
      'comma-spacing': ['warn', { before: false, after: true }], // comma spacing (, )
      'arrow-spacing': ['error', { before: true, after: true }], // arrow spacing (=>)
      'no-constant-condition': [
        // constant conditions in if statements
        'error',
        {
          checkLoops: false,
        },
      ],
      'no-trailing-spaces': [
        // trailing spaces
        'warn',
        {
          skipBlankLines: true,
          ignoreComments: true,
        },
      ],
      'no-multiple-empty-lines': [
        // multiple empty lines
        'warn',
        {
          max: 1,
          maxEOF: 0,
          maxBOF: 0,
        },
      ],
    },
  }),
]

export default eslintConfig
