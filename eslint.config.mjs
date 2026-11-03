import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

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
