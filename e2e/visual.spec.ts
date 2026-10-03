import { test, expect, openDemo, openFixture, skipIfNoBaseline } from "./fixtures";

const shot = async (locator: import("@playwright/test").Locator, name: string) => {
    skipIfNoBaseline(name);
    await expect(locator).toHaveScreenshot(name);
};

test.describe("visual: demo charts", () => {
    test.beforeEach(async ({ page }) => {
        await openDemo(page);
        // keep the hover/tooltip state out of screenshots
        await page.mouse.move(0, 0);
    });

    for (const id of ["pl", "stacked", "trend", "interact"]) {
        test(id, async ({ page }) => {
            await shot(page.locator(`#chart-${id}`), `${id}.png`);
        });
    }

    for (const theme of ["Dark", "Corporate", "Accessible", "Colorful"]) {
        test(`theme ${theme}`, async ({ page }) => {
            await page.getByRole("button", { name: theme, exact: true }).click();
            await shot(page.locator("#chart-theme"), `theme-${theme.toLowerCase()}.png`);
        });
    }
});

test.describe("visual: scenarios", () => {
    const scenarios: Record<string, string> = {
        negatives: `
            d3.select("#chart").datum([
              { label: "Open", stacks: [{ value: 300 }] }, { label: "Loss A", stacks: [{ value: -900 }] },
              { label: "Loss B", stacks: [{ value: -400 }] }, { label: "Gain", stacks: [{ value: 700 }] },
              { label: "Fees", stacks: [{ value: -150 }] }
            ]).call(MintWaterfall.waterfallChart().width(720).height(320).showTotal(true));`,
        "long-labels": `
            d3.select("#chart").datum(["Operating revenue", "Cost of goods sold", "Gross margin uplift", "Selling expenses",
              "Administrative overhead", "Research and development", "Depreciation", "Interest income", "Supercalifragilistic"]
              .map((label, i) => ({ label, stacks: [{ value: (i % 3 === 0 ? 1 : -1) * (200 + i * 40) }] })))
              .call(MintWaterfall.waterfallChart().width(720).height(340));`,
        crowded: `
            d3.select("#chart").datum(Array.from({ length: 60 }, (_, i) => ({ label: "Day " + (i + 1),
              stacks: [{ value: Math.round(Math.sin(i / 4) * 300) }] })))
              .call(MintWaterfall.waterfallChart().width(720).height(320).showTotal(true));`,
        "subtotals-trend": `
            d3.select("#chart").datum([
              { label: "Q1", stacks: [{ value: 800 }] }, { label: "Q2", stacks: [{ value: 450 }] }, { label: "H1", subtotal: true },
              { label: "Q3", stacks: [{ value: -300 }] }, { label: "Q4", stacks: [{ value: 650 }] }
            ]).call(MintWaterfall.waterfallChart().width(720).height(320).showTotal(true).totalLabel("FY")
              .showTrendLine(true).trendLineType("polynomial"));`,
    };

    for (const [name, script] of Object.entries(scenarios)) {
        test(name, async ({ page }) => {
            await openFixture(page);
            await page.evaluate(script);
            await shot(page.locator("#chart"), `${name}.png`);
        });
    }

    test("mobile P&L", async ({ page }) => {
        await page.setViewportSize({ width: 390, height: 844 });
        await openDemo(page);
        await shot(page.locator("#chart-pl"), "mobile-pl.png");
    });
});
