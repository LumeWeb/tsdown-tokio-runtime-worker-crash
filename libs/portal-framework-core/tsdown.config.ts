import { defineConfig } from "tsdown";
export default defineConfig({
    clean: true,
    dts: true,
    entry: ["src/**/*"],
    external: ["fs", "path", "lightningcss"],
    format: ["cjs", "esm"],
    hash: false,
    outputOptions(options, format) {
        options.dir = format === "es" ? "dist/esm" : "dist/cjs";
    },
    sourcemap: true,
    target: "esnext",
    tsconfig: "./tsconfig.json",
});
