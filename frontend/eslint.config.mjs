import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts,tsx}"],
    ignores: ["node_modules", ".next"],
    languageOptions: {
      globals: globals.browser,
    },
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    plugins: {},
    rules: {},
  },
]);
