import resolve from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";
import typescript from "@rollup/plugin-typescript";
import cleanup from "rollup-plugin-cleanup";
import { readFileSync } from "node:fs";

const pkg = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8"));

const banner = `/*!
 * MintWaterfall v${pkg.version}
 * D3.js-compatible waterfall chart component
 * (c) 2024-2026 David Duarte
 * Released under the MIT License
 */`;

const external = id => {
  return id === "d3" || id.startsWith("d3-");
};
// Source imports only from "d3"; subpackage globals are a safety net for UMD builds.
const globals = id => (id === "d3" || id.startsWith("d3-") ? "d3" : undefined);

const plugins = [
  resolve({
    preferBuiltins: false,
    browser: true,
  }),
  typescript({
    tsconfig: "./tsconfig.json",
    exclude: ["**/*.test.ts", "**/*.test.js", "tests/**/*"],
    compilerOptions: {
      declaration: false,
      declarationMap: false,
      sourceMap: false,
    },
  }),
  cleanup({
    comments: "none",
  }),
];

const minifiedPlugins = [
  ...plugins,
  terser({
    output: {
      comments: /^!/,
    },
  }),
];

export default [
  // ES Module build
  {
    input: "src/index.ts",
    external,
    output: {
      file: "dist/mintwaterfall.esm.js",
      format: "es",
      banner,
    },
    plugins,
  },

  // UMD build (for browser <script> tags)
  {
    input: "src/index.ts",
    external,
    output: {
      file: "dist/mintwaterfall.umd.js",
      format: "umd",
      name: "MintWaterfall",
      globals,
      banner,
      exports: "named",
    },
    plugins,
  },

  // Minified UMD build
  {
    input: "src/index.ts",
    external,
    output: {
      file: "dist/mintwaterfall.min.js",
      format: "umd",
      name: "MintWaterfall",
      globals,
      banner,
      exports: "named",
    },
    plugins: minifiedPlugins,
  },

  // CommonJS build (for Node.js)
  {
    input: "src/index.ts",
    external,
    output: {
      file: "dist/mintwaterfall.cjs",
      format: "cjs",
      banner,
      exports: "named",
    },
    plugins,
  },

  // Experimental entry ("mintwaterfall/experimental"): ESM, CJS and a minified UMD
  {
    input: "src/experimental.ts",
    external,
    output: { file: "dist/experimental.esm.js", format: "es", banner },
    plugins,
  },
  {
    input: "src/experimental.ts",
    external,
    output: { file: "dist/experimental.cjs", format: "cjs", banner, exports: "named" },
    plugins,
  },
  {
    input: "src/experimental.ts",
    external,
    output: {
      file: "dist/mintwaterfall-experimental.min.js",
      format: "umd",
      name: "MintWaterfallExperimental",
      globals,
      banner,
      exports: "named",
    },
    plugins: minifiedPlugins,
  },
];
