import { defineConfig } from "vitest/config";

/**
 * Vitest config. The engine tests are plain TypeScript with no DOM, so we use
 * the lightweight "node" environment and only pick up *.test.ts files under src.
 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
