import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "e2e/**",
    "playwright-report/**",
    "test-results/**",
    "src/**/__tests__/**",
    "src/**/*.test.*",
    "tests/**",
  ]),
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/ban-ts-comment": "warn",
      "@typescript-eslint/no-empty-object-type": "warn",
      "@next/next/no-html-link-for-pages": "warn",
      "react-hooks/immutability": "off",
      "react-hooks/purity": "warn",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/static-components": "warn",
      "react-hooks/use-memo": "off",
      "react/no-unescaped-entities": "warn",
    },
  },
]);

export default eslintConfig;
