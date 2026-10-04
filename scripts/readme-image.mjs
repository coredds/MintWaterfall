// Regenerates the README hero image (.github/assets/chart.png) from the built bundle.
// Run after `npm run build`: node scripts/readme-image.mjs
import { chromium } from "@playwright/test";
import { mkdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const file = p => fileURLToPath(new URL(`../${p}`, import.meta.url));
const d3 = readFileSync(file("node_modules/d3/dist/d3.min.js"), "utf8");
const bundle = readFileSync(file("dist/mintwaterfall.min.js"), "utf8");

const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>body{margin:0;padding:24px;background:#fff}#chart{width:880px}</style>
<script>${d3}</script><script>${bundle}</script></head><body><div id="chart"></div><script>
  d3.select("#chart").datum([
    { label: "Revenue", stacks: [{ value: 5200 }] },
    { label: "Cost of sales", stacks: [{ value: -2100 }] },
    { label: "Gross profit", subtotal: true },
    { label: "Marketing", stacks: [{ value: -950 }] },
    { label: "R&D", stacks: [{ value: -620 }] },
    { label: "G&A", stacks: [{ value: -380 }] },
    { label: "Operating income", subtotal: true },
    { label: "Other income", stacks: [{ value: 180 }] },
    { label: "Tax", stacks: [{ value: -330 }] }
  ]).call(MintWaterfall.waterfallChart().width(880).height(380).duration(0)
    .showTotal(true).totalLabel("Net income").showLegend(true).formatNumber(d3.format("$,.0f")));
</script></body></html>`;

const browser = await chromium.launch(process.platform === "win32" && !process.env.CI ? { channel: "msedge" } : {});
const page = await browser.newPage({ deviceScaleFactor: 2, viewport: { width: 940, height: 460 } });
await page.setContent(html);
mkdirSync(file(".github/assets"), { recursive: true });
await page.locator("#chart").screenshot({ path: file(".github/assets/chart.png") });
await browser.close();
console.log("Wrote .github/assets/chart.png");
