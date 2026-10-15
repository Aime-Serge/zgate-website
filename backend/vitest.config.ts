import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@payload-config": fileURLToPath(new URL("./src/payload.config.ts", import.meta.url)),
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    // Low-memory development: at most 2 test workers locally
    // (docs/DEVELOPMENT_LOW_MEMORY.md). CI keeps Vitest's default.
    ...(process.env["CI"] ? {} : { maxWorkers: 2 }),
    environment: "node",
    include: ["src/**/*.test.ts", "tests/**/*.test.ts"],
    // Integration tests boot Payload against a real database (skipped
    // without DATABASE_URL), which takes longer than the 5 s default.
    testTimeout: 60_000,
    hookTimeout: 120_000,
    fileParallelism: false,
  },
});
