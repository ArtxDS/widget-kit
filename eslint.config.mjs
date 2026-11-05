import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import betterTailwind from "eslint-plugin-better-tailwindcss";
import { defineConfig, globalIgnores } from "eslint/config";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "coverage/**",
    "out/**",
    "build/**",
    "dist/**",
    "next-env.d.ts",
  ]),
  {
    files: ["app/**/*.{ts,tsx}", "packages/**/*.{ts,tsx}"],
    plugins: { "better-tailwindcss": betterTailwind },
    rules: {
      "better-tailwindcss/enforce-canonical-classes": "warn",
    },
    settings: {
      "better-tailwindcss": {
        entryPoint: "app/globals.css",
      },
    },
  },
  {
    files: [
      "packages/components/ui/**",
      "packages/widgets/**",
      "packages/hooks/**",
      "packages/lib/**",
      "packages/types/**",
      "packages/index.ts",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["**/app/**", "../app/**", "../../app/**"],
              message:
                "Library files must not import from the Next.js app/ directory.",
            },
            {
              group: [
                "**/components/dashboard/**",
                "../components/dashboard/**",
                "../../components/dashboard/**",
                "@/components/dashboard/**",
              ],
              message:
                "Library files must not import dashboard-only components.",
            },
          ],
        },
      ],
    },
  },
]);

export default eslintConfig;
