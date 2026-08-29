import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: false,
    fileParallelism: false,
    setupFiles: ["./tests/setup-env.ts"],
    coverage: { reporter: ["text", "json-summary"] },
  },
});
