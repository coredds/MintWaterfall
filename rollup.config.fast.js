import resolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";

const banner = `/*!
 * MintWaterfall v${process.env.npm_package_version || "0.8.7"} - FAST BUILD
 * D3.js-compatible waterfall chart component
 * (c) 2024 David Duarte
 * Released under the MIT License
 */`;

const external = [
  "d3",
  "d3-array",
  "d3-drag",
  "d3-force",
  "d3-color",
  "d3-selection",
];

export default {
  input: "src/index.js",
  external,
  output: {
    file: "dist/mintwaterfall.cjs.js",
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
