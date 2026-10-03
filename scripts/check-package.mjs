// Verifies the published package works for consumers:
// npm pack → install into a clean temp project → type-check (nodenext + bundler) → load via ESM and CJS.
// Run after `npm run build`. Usage: node scripts/check-package.mjs
import { execSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const dir = mkdtempSync(join(tmpdir(), "mintwaterfall-pkg-"));
const run = (cmd, cwd = dir) => execSync(cmd, { cwd, stdio: ["ignore", "pipe", "pipe"], encoding: "utf8" });

let failed = false;
const check = (name, fn) => {
    try {
        fn();
        console.log(`  ok   ${name}`);
    } catch (error) {
        failed = true;
        const output = String(error.stdout || "") + String(error.stderr || "") || error.message;
        console.log(`  FAIL ${name}\n${output.split("\n").slice(0, 30).join("\n")}`);
    }
};

try {
    console.log(`Packing into ${dir}`);
    run(`npm pack --pack-destination "${dir}"`, root);
    const tarball = readdirSync(dir).find(f => f.endsWith(".tgz"));
    writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "consumer", private: true, type: "module" }));
    run(`npm install --no-audit --no-fund "${join(dir, tarball)}" d3@7 @types/d3@7 typescript@5`);

    writeFileSync(
        join(dir, "consumer.ts"),
        [
            'import { waterfallChart, themes, createStatisticalSystem, type ChartData } from "mintwaterfall";',
            'import { createHierarchicalLayout, createZoomSystem } from "mintwaterfall/experimental";',
            'const data: ChartData[] = [{ label: "A", stacks: [{ value: 1 }] }, { label: "S", subtotal: true }];',
            "const chart = waterfallChart().width(400).showTotal(true).on(\"barClick\", (_e, d) => console.log(d));",
            "const width: number = chart.width();",
            "const background: string = themes.dark.background;",
            "export { chart, width, background, data, createStatisticalSystem, createHierarchicalLayout, createZoomSystem };",
        ].join("\n")
    );

    const tsc = `node ${join("node_modules", "typescript", "bin", "tsc")} --noEmit --strict --skipLibCheck false --target es2022 --lib es2022,dom`;
    check("types resolve (moduleResolution nodenext)", () => run(`${tsc} --module nodenext --moduleResolution nodenext consumer.ts`));
    check("types resolve (moduleResolution bundler)", () => run(`${tsc} --module esnext --moduleResolution bundler consumer.ts`));
    check("ESM import", () => {
        const out = run("node --input-type=module -e \"import('mintwaterfall').then(m => console.log(typeof m.waterfallChart))\"");
        if (out.trim() !== "function") throw new Error(`unexpected: ${out}`);
    });
    check("experimental entry (ESM + CJS)", () => {
        const esm = run("node --input-type=module -e \"import('mintwaterfall/experimental').then(m => console.log(typeof m.createZoomSystem))\"");
        const cjs = run("node -e \"console.log(typeof require('mintwaterfall/experimental').createZoomSystem)\"");
        if (esm.trim() !== "function" || cjs.trim() !== "function") throw new Error(`unexpected: ${esm} ${cjs}`);
    });
    check("CommonJS require", () => {
        const out = run("node -e \"console.log(typeof require('mintwaterfall').waterfallChart)\"");
        if (out.trim() !== "function") throw new Error(`unexpected: ${out}`);
    });
} finally {
    rmSync(dir, { recursive: true, force: true });
}

if (failed) {
    console.error("Package check failed.");
    process.exit(1);
}
console.log("Package check passed.");
