import { test, expect, openDemo, openFixture } from "./fixtures";

test.describe("demo page", () => {
    test("renders every chart without errors", async ({ page, errors }) => {
        await openDemo(page);
        const counts = await page.evaluate(() =>
            ["pl", "stacked", "theme", "trend", "interact"].map(id => document.querySelectorAll(`#chart-${id} g.bar-group`).length)
        );
        expect(counts).toEqual([10, 6, 7, 12, 25]);
        await expect(page.locator("#kpis .kpi")).toHaveCount(8);
        expect(errors).toEqual([]);
    });

    test("keyboard: arrows move focus, Enter fires barClick", async ({ page }) => {
        await openDemo(page);
        const bars = page.locator("#chart-pl g.bar-group");
        await bars.first().focus();
        await page.keyboard.press("ArrowRight");
        await expect(bars.nth(1)).toBeFocused();
        await page.keyboard.press("End");
        await expect(bars.last()).toBeFocused();
        await page.keyboard.press("Enter");
        await expect(page.locator("#pl-readout")).toContainText("Net income");
    });

    test("tooltip shows on hover and stays inside the viewport", async ({ page }) => {
        await openDemo(page);
        const last = page.locator("#chart-pl g.bar-group").last();
        await last.scrollIntoViewIfNeeded();
        await last.hover();
        const tip = page.locator(".mintwaterfall-tooltip");
        await expect(tip).toContainText("Net income");
        await expect(tip).toHaveCSS("opacity", "1");
        const box = (await tip.boundingBox())!;
        const vw = page.viewportSize()!.width;
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width).toBeLessThanOrEqual(vw);
    });

    test("orientation toggle switches the P&L chart to horizontal bars and back", async ({ page, errors }) => {
        await openDemo(page);
        const first = page.locator("#chart-pl g.bar-group").first();
        await page.getByRole("button", { name: "Horizontal", exact: true }).click();
        await expect(first).toHaveAttribute("transform", /^translate\(0,/);
        await expect(page.locator("#chart-pl .x-axis .tick text").first()).toHaveText("Revenue");
        await page.getByRole("button", { name: "Vertical", exact: true }).click();
        await expect(first).toHaveAttribute("transform", /,0\)$/);
        expect(errors).toEqual([]);
    });

    test("theme switch restyles the chart", async ({ page }) => {
        await openDemo(page);
        await page.getByRole("button", { name: "Dark", exact: true }).click();
        await expect(page.locator("#chart-theme rect.mw-background")).toHaveAttribute("fill", "#0f172a");
        await page.getByRole("button", { name: "Default", exact: true }).click();
        await expect(page.locator("#chart-theme rect.mw-background")).toHaveCount(0);
    });
});

test.describe("brush and zoom", () => {
    async function setup(page: import("@playwright/test").Page) {
        await openDemo(page);
        const svg = page.locator("#chart-interact svg");
        await svg.scrollIntoViewIfNeeded();
        const box = (await svg.boundingBox())!;
        const y = box.y + box.height * 0.15;
        const firstBar = () => page.locator("#chart-interact g.bar-group").first().getAttribute("transform");
        const drag = async (x0: number, x1: number, shift = false) => {
            if (shift) await page.keyboard.down("Shift");
            await page.mouse.move(box.x + box.width * x0, y);
            await page.mouse.down();
            await page.mouse.move(box.x + box.width * x1, y, { steps: 8 });
            await page.mouse.up();
            if (shift) await page.keyboard.up("Shift");
        };
        const wheel = async () => {
            await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
            await page.mouse.wheel(0, -400);
        };
        return { firstBar, drag, wheel };
    }

    test("wheel zooms; plain drag selects without panning", async ({ page }) => {
        const { firstBar, drag, wheel } = await setup(page);
        const initial = await firstBar();
        await wheel();
        await expect.poll(firstBar).not.toBe(initial);
        const zoomed = await firstBar();
        await drag(0.3, 0.5);
        await expect(page.locator("#brush-readout")).toContainText("bars selected");
        expect(await firstBar()).toBe(zoomed);
    });

    test("Shift+drag pans and clears the stale selection", async ({ page }) => {
        const { firstBar, drag, wheel } = await setup(page);
        await wheel();
        await expect.poll(firstBar).not.toBe("translate(0,0)");
        await drag(0.3, 0.5);
        await expect(page.locator("#brush-readout")).toContainText("bars selected");
        const before = await firstBar();
        await drag(0.6, 0.4, true);
        await expect.poll(firstBar).not.toBe(before);
        await expect(page.locator("#brush-readout")).toContainText("Drag across the chart");
    });
});

test.describe("responsive layout", () => {
    test("lays out at the container width and re-lays out on resize", async ({ page }) => {
        await page.setViewportSize({ width: 390, height: 844 });
        await openDemo(page);
        const sizes = () =>
            page.evaluate(() => {
                const svg = document.querySelector("#chart-pl svg") as SVGSVGElement;
                return { rendered: Math.round(svg.getBoundingClientRect().width), viewBox: svg.viewBox.baseVal.width };
            });
        const narrow = await sizes();
        expect(narrow.viewBox).toBeLessThan(400);
        expect(Math.abs(narrow.rendered - narrow.viewBox)).toBeLessThanOrEqual(1);
        await page.setViewportSize({ width: 1280, height: 900 });
        await expect.poll(async () => (await sizes()).viewBox).toBeGreaterThan(700);
        // no horizontal page overflow on phones
        await page.setViewportSize({ width: 390, height: 844 });
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
    });
});

test.describe("export", () => {
    test("PNG export renders non-Latin-1 text at 2x with themed padding", async ({ page }) => {
        await openFixture(page);
        const result = await page.evaluate(async () => {
            const { MintWaterfall: MW, d3 } = window as any;
            const f = d3.format(",.0f");
            const chart = MW.waterfallChart().width(600).height(300).theme("dark").formatNumber((n: number) => "€" + f(n));
            d3.select("#chart").datum([{ label: "Umsatz €", stacks: [{ value: 500 }] }, { label: "Kosten", stacks: [{ value: -200 }] }]).call(chart);
            const png = await chart.export("png");
            const img = new Image();
            await new Promise((res, rej) => {
                img.onload = res;
                img.onerror = rej;
                img.src = png.url;
            });
            const c = document.createElement("canvas");
            c.width = img.width;
            c.height = img.height;
            const ctx = c.getContext("2d", { willReadFrequently: true })!;
            ctx.drawImage(img, 0, 0);
            const svg = await chart.export("svg");
            return {
                type: png.blob.type,
                w: img.width,
                h: img.height,
                corner: Array.from(ctx.getImageData(2, 2, 1, 1).data),
                svgHasEuro: svg.data.includes("€"),
            };
        });
        expect(result.type).toBe("image/png");
        expect([result.w, result.h]).toEqual([1280, 680]);
        expect(result.corner.slice(0, 3)).toEqual([15, 23, 42]); // dark theme background, not white
        expect(result.svgHasEuro).toBe(true);
    });
});
