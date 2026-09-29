import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Integration tests (SDD section 11): real MySQL. Locally the Docker DB from .env.local, in CI the
// service container. Values already in the environment (CI) are not overridden.
if (existsSync(".env.local")) process.loadEnvFile(".env.local");

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["tests/integration/**/*.test.ts"],
    setupFiles: ["tests/integration/setup.ts"],
    // One database: run files one after another so their rows never interleave.
    fileParallelism: false,
    testTimeout: 20_000,
  },
});
