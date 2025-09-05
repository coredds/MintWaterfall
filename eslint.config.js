// Basic ESLint configuration for ES2021 and browser
export default [
  {
    files: ["**/*.js"],
    ignores: [
      "dist/**",
      "node_modules/**",
      "coverage/**",
      "build/**"
    ],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: "module",
      globals: {
        window: "readonly",
        document: "readonly"
      }
    },
    rules: {
      semi: ["error", "always"],
      quotes: ["error", "double"],
      "no-unused-vars": "warn"
    }
  }
];
