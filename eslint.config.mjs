import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  globalIgnores([
   
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "list_models_native.js",
    "query_items.js",
    "test-scraper-flipkart.js",
    "prisma/patch-images.js",
  ]),
]);

export default eslintConfig;
