import resolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import { readFileSync } from "node:fs";

const pkg = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8"));

const banner = `/*!
 * MintWaterfall v${pkg.version} - FAST BUILD
 * D3.js-compatible waterfall chart component
 * (c) 2024-2026 David Duarte
 * Released under the MIT License
 */`;

const external = id => id === "d3" || id.startsWith("d3-");

export default {
  input: "src/index.ts",
  external,
  output: {
    file: "dist/mintwaterfall.cjs",
    format: "cjs",
    banner,
    exports: "named",
  },
  plugins: [
    resolve({
      preferBuiltins: false,
    }),
    typescript({
      tsconfig: "./tsconfig.json",
      exclude: ["**/*.test.ts", "**/*.test.js", "tests/**/*"],
      compilerOptions: {
        declaration: false,
        declarationMap: false,
      },
    }),
  ],
};
