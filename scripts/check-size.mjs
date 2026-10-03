// Fails when a built bundle exceeds its gzip size budget. Run after `npm run build`.
// Raise a budget deliberately (and note why in the commit) — don't let it creep.
import { readFileSync } from "node:fs";
import { gzipSync } from "node:zlib";

const KB = 1024;
const budgets = {
    "dist/mintwaterfall.min.js": 40 * KB, // current ≈ 36.4 KB gzip
    "dist/mintwaterfall.esm.js": 70 * KB, // current ≈ 63.0 KB gzip
};

let failed = false;
for (const [file, limit] of Object.entries(budgets)) {
    const raw = readFileSync(file);
    const gz = gzipSync(raw, { level: 9 }).length;
    const ok = gz <= limit;
    failed ||= !ok;
    console.log(
        `${ok ? "  ok  " : "  FAIL"} ${file}: ${(gz / KB).toFixed(1)} KB gzip (budget ${(limit / KB).toFixed(0)} KB, ${(raw.length / KB).toFixed(0)} KB raw)`
    );
}
if (failed) process.exit(1);
