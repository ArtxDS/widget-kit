import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./packages/test/setup.ts"],
    include: [
      "packages/**/*.test.ts",
      "packages/**/*.test.tsx",
    ],
    coverage: {
      provider: "v8",
      include: [
        "packages/components/ui/**",
        "packages/widgets/**",
        "packages/hooks/**",
        "packages/lib/**",
      ],
      exclude: [
        "packages/components/dashboard/**",
        "packages/test/**",
        "**/*.d.ts",
      ],
      reporter: ["text", "lcov", "html"],
    },
  },
});
