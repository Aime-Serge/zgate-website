import { library } from "@zgate/config/eslint/library";

export default [
  ...library(import.meta.dirname),
  {
    // Moved verbatim from the CMS, which lints without type information.
    // Its header parsing goes through Object.fromEntries (typed `any`);
    // tightening that is a separate, reviewed change.
    files: ["src/webhook.ts"],
    rules: {
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
    },
  },
];
