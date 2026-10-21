import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    // Low-memory development: at most 2 test workers locally
    // (docs/DEVELOPER_GUIDE.md). CI keeps Vitest's default.
    ...(process.env["CI"] ? {} : { maxWorkers: 2 }),
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
