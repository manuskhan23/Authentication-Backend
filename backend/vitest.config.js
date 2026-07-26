import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.js"],
    coverage: {
      provider: "v8",
      include: ["app.js", "models/**/*.js"],
      reporter: ["text", "lcov"],
    },
  },
});
