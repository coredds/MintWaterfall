import resolve from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";
import typescript from "@rollup/plugin-typescript";
import cleanup from "rollup-plugin-cleanup";

const banner = `/*!
 * MintWaterfall v${process.env.npm_package_version || "0.8.10"}
 * D3.js-compatible waterfall chart component
 * (c) 2024-2026 David Duarte
 * Released under the MIT License
 */`;

const external = (id) => {
  return id === "d3" || id.startsWith("d3-");
};
const globals = {
  d3: "d3",
  "d3-array": "d3",
  "d3-drag": "d3",
  "d3-force": "d3",
  "d3-color": "d3",
  "d3-selection": "d3",
};

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
    input: "src/index.js",
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
    input: "src/index.js",
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
    input: "src/index.js",
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
    input: "src/index.js",
    external,
    output: {
      file: "dist/mintwaterfall.cjs.js",
      format: "cjs",
      banner,
      exports: "named",
    },
    plugins,
  },
];
