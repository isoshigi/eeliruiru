import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/pure/**/*.test.ts", "tests/shared/**/*.test.ts"],
    environment: "node",
  },
});
