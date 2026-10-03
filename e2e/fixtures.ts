import { test as base, expect, type Page } from "@playwright/test";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const d3Source = readFileSync(fileURLToPath(new URL("../node_modules/d3/dist/d3.min.js", import.meta.url)), "utf8");

/**
 * - Serves D3 from node_modules instead of the CDN (offline + deterministic).
 * - Emulates reduced motion so charts render without transitions.
 * - Collects console errors / page errors so tests can assert there are none.
 */
export const test = base.extend<{ errors: string[] }>({
    errors: async ({ page }, use) => {
        const errors: string[] = [];
        page.on("pageerror", e => errors.push(`pageerror: ${e.message}`));
        page.on("console", m => {
            if (m.type() === "error") errors.push(m.text());
        });
        await use(errors);
    },
    page: async ({ page }, use) => {
        await page.route("https://cdn.jsdelivr.net/npm/d3@7/dist/d3.min.js", route =>
            route.fulfill({ body: d3Source, contentType: "text/javascript" })
        );
        await page.emulateMedia({ reducedMotion: "reduce" });
        await use(page);
    },
});

export { expect };

export async function openDemo(page: Page): Promise<void> {
    await page.goto("/mintwaterfall-example.html");
    await expect(page.locator("#chart-interact g.bar-group").first()).toBeVisible();
}

/** Blank page with D3 and the UMD bundle loaded, for rendering custom scenarios. */
export async function openFixture(page: Page): Promise<void> {
    await page.goto("/e2e/fixture.html");
    await page.waitForFunction(() => Boolean((window as any).MintWaterfall && (window as any).d3));
}

/**
 * Screenshot baselines are per platform. In CI, skip (rather than fail) when no baseline
 * exists yet for this platform — run the "Update visual baselines" workflow to create them.
 */
export function skipIfNoBaseline(name: string): void {
    const info = test.info();
    const path = info.snapshotPath(name, { kind: "screenshot" });
    test.skip(
        Boolean(process.env.CI) && info.config.updateSnapshots === "missing" && !existsSync(path),
        `no ${process.platform} baseline for ${name}`
    );
}
