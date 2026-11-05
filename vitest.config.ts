import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: "jsdom",
    environmentOptions: {
      jsdom: {
        url: "http://localhost:3000",
      },
    },
    setupFiles: ["./tests/setup.ts"],
    restoreMocks: true,
    unstubGlobals: true,
    clearMocks: true,
    include: [
      "tests/**/*.{test,spec}.{ts,tsx,js,jsx}",
      "packages/**/*.{test,spec}.{ts,tsx,js,jsx}",
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
