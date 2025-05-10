import type { Options } from "tsdown"; // Optional: Import type for clarity

import { defineConfig } from "tsdown";

const configs: Options[] = [
  // Config 1: CJS Output
  {
    // bundle: false, // Removed: tsdown bundles by default
    clean: true,
    dts: true, // Generate d.ts files alongside CJS output
    entry: ["src/**/*"],
    external: ["fs", "path"],
    format: ["cjs"], // Format must be an array
    outDir: "dist/cjs",
    // Use outExtensions for custom extensions
    outExtensions: () => ({ js: ".cjs" }),
    sourcemap: true,
    target: "esnext",
    tsconfig: "./tsconfig.json",
  },

  // Config 2: ESM Output
  {
    // bundle: false, // Removed
    clean: true,
    dts: true, // Generate d.ts files alongside ESM output
    entry: ["src/**/*"],
    // esbuildPlugins: [fixImportsPlugin() as any], // Removed
    external: ["fs", "path"],
    format: ["esm"], // Format must be an array
    outDir: "dist/esm",
    sourcemap: true,
    target: "esnext",
    tsconfig: "./tsconfig.json",
  },
];

export default defineConfig(configs);
