import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  publicDir: false,
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, "packages/index.ts"),
        components: resolve(__dirname, "packages/components/ui/index.ts"),
      },
      formats: ["es"],
    },
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      external: ["react", "react-dom", "react/jsx-runtime"],
      output: {
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
          "react/jsx-runtime": "ReactJSXRuntime",
        },
        assetFileNames: "styles/[name][extname]",
      },
    },
    sourcemap: true,
    minify: false,
  },
});
