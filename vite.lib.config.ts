import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vite";
import { resolve } from "path";

const clientEntries = new Set([
  resolve(__dirname, "packages/index.ts"),
  resolve(__dirname, "packages/components/ui/index.ts"),
  resolve(__dirname, "packages/widgets/assistant/src/index.ts"),
]);

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  publicDir: false,
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, "packages/index.ts"),
        components: resolve(__dirname, "packages/components/ui/index.ts"),
        core: resolve(__dirname, "packages/core.ts"),
        assistant: resolve(
          __dirname,
          "packages/widgets/assistant/src/index.ts",
        ),
        "assistant-core": resolve(
          __dirname,
          "packages/widgets/assistant/src/core/index.ts",
        ),
        "assistant-transport": resolve(
          __dirname,
          "packages/widgets/assistant/src/transport/index.ts",
        ),
      },
      formats: ["es"],
    },
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      external: ["react", "react-dom", "react/jsx-runtime", "dompurify"],
      output: {
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
          "react/jsx-runtime": "ReactJSXRuntime",
        },
        assetFileNames: "styles/[name][extname]",
        banner: (chunk) =>
          chunk.facadeModuleId && clientEntries.has(chunk.facadeModuleId)
            ? '"use client";'
            : "",
      },
    },
    sourcemap: true,
    minify: false,
  },
});
