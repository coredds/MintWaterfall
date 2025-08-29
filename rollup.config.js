import resolve from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";
import filesize from "rollup-plugin-filesize";
import cleanup from "rollup-plugin-cleanup";

const banner = `/*!
 * MintWaterfall v${process.env.npm_package_version || "0.6.0"}
 * D3.js-compatible waterfall chart component
 * (c) 2024 David Duarte
 * Released under the MIT License
 */`;

const external = ["d3"];
const globals = { d3: "d3" };

const plugins = [
  resolve(),
  cleanup(),
  filesize()
];

const minifiedPlugins = [
  ...plugins,
  terser({
    output: {
      comments: /^!/
    }
  })
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
      sourcemap: true
    },
    plugins
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
      sourcemap: true,
      exports: "named"
    },
    plugins
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
      sourcemap: true,
      exports: "named"
    },
    plugins: minifiedPlugins
  },
  
  // CommonJS build (for Node.js)
  {
    input: "src/index.js",
    external,
    output: {
      file: "dist/mintwaterfall.cjs.js",
      format: "cjs",
      banner,
      sourcemap: true,
      exports: "named"
    },
    plugins
  }
];
