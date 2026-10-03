import { computeYDomain, computeLayout, wrapLabel, getBarExtent, niceDomain } from "../../src/chart/config.js";
import { formatBarValue, polynomialFit, computeTrendValues } from "../../src/chart/render.js";
import { prepareData } from "../../src/chart/lifecycle.js";
import { resolveStyle } from "../../src/chart/style.js";
import { defaultConfig } from "../../src/chart/config.js";
import { escapeHtml } from "../../src/tooltip.js";

const cfg = { showTotal: true, totalLabel: "Total", totalColor: "#000000" };

describe("prepareData", () => {
    test("subtotals show the running total without changing it", () => {
        const out = prepareData(
            [
                { label: "a", stacks: [{ value: 10 }] },
                { label: "s", subtotal: true },
                { label: "b", stacks: [{ value: -4 }] },
            ],
            cfg
        );
        expect(out.map(d => [d.label, d.barTotal, d.cumulativeTotal])).toEqual([
            ["a", 10, 10],
            ["s", 10, 10],
            ["b", -4, 6],
            ["Total", 6, 6],
        ]);
        expect(out[1].isSubtotal).toBe(true);
        expect(out[3].isTotal).toBe(true);
        expect(out[2].prevCumulativeTotal).toBe(10);
    });
});

describe("computeYDomain", () => {
    test("always includes zero", () => {
        const data = prepareData([{ label: "a", stacks: [{ value: 500 }] }, { label: "b", stacks: [{ value: 100 }] }], cfg);
        expect(computeYDomain(data, false)).toEqual([0, 600]);
    });

    test("covers negative running totals", () => {
        const data = prepareData([{ label: "a", stacks: [{ value: -50 }] }, { label: "b", stacks: [{ value: 20 }] }], cfg);
        expect(computeYDomain(data, false)).toEqual([-50, 0]);
    });

    test("includes intermediate stack positions when stacked", () => {
        const data = prepareData([{ label: "a", stacks: [{ value: 100 }, { value: -80 }] }], { ...cfg, showTotal: false });
        expect(computeYDomain(data, true)).toEqual([0, 100]);
        expect(computeYDomain(data, false)).toEqual([0, 20]);
    });

    test("never returns an empty domain", () => {
        const data = prepareData([{ label: "a", stacks: [{ value: 0 }] }], { ...cfg, showTotal: false });
        const [lo, hi] = computeYDomain(data, false);
        expect(hi).toBeGreaterThan(lo);
    });
});

describe("getBarExtent", () => {
    test("deltas span previous→current, totals span 0→current", () => {
        const [a, b, total] = prepareData([{ label: "a", stacks: [{ value: 10 }] }, { label: "b", stacks: [{ value: -3 }] }], cfg);
        expect(getBarExtent(a)).toEqual([0, 10]);
        expect(getBarExtent(b)).toEqual([7, 10]);
        expect(getBarExtent(total)).toEqual([0, 7]);
    });
});

describe("niceDomain", () => {
    test("rounds to tick boundaries when cheap", () => {
        expect(niceDomain([0, 940], 5)).toEqual([0, 1000]);
    });
    test("does not add a mostly empty band for a tiny overshoot", () => {
        const [lo, hi] = niceDomain([-8, 2400], 4);
        expect(lo).toBeGreaterThan(-100);
        expect(lo).toBeLessThan(-8);
        // nice upper bound with 4 ticks would be 3000 (+25%): too wasteful, so pad instead
        expect(hi).toBeCloseTo(2400 + 2408 * 0.02, 6);
    });
});

describe("wrapLabel", () => {
    test("wraps on word boundaries", () => {
        expect(wrapLabel("Operating income", 10)).toEqual(["Operating", "income"]);
        expect(wrapLabel("Tax", 10)).toEqual(["Tax"]);
    });
    test("returns null when a word or the line count does not fit", () => {
        expect(wrapLabel("Supercalifragilistic", 10)).toBeNull();
        expect(wrapLabel("a b c d e f", 1)).toBeNull();
    });
});

describe("computeLayout", () => {
    test("widens the left margin for long tick labels", () => {
        const data = prepareData([{ label: "a", stacks: [{ value: 123456789 }] }], cfg);
        const layout = computeLayout(data, defaultConfig.margin, 800, 400, [0, 123456789], n => `$${n.toLocaleString("en-US")}`, true);
        expect(layout.margins.left).toBeGreaterThan(defaultConfig.margin.left);
    });
});

describe("formatBarValue", () => {
    const fmt = (n: number) => String(n);
    test("signs deltas, not totals", () => {
        const [a, b, total] = prepareData([{ label: "a", stacks: [{ value: 5 }] }, { label: "b", stacks: [{ value: -2 }] }], cfg);
        expect(formatBarValue(a, fmt)).toBe("+5");
        expect(formatBarValue(b, fmt)).toBe("\u22122");
        expect(formatBarValue(total, fmt)).toBe("3");
    });
});

describe("trend fitting", () => {
    test("polynomialFit recovers a quadratic exactly", () => {
        const xs = [0, 1, 2, 3, 4];
        const ys = xs.map(x => 2 + 3 * x + 0.5 * x * x);
        const [c0, c1, c2] = polynomialFit(xs, ys, 2);
        expect(c0).toBeCloseTo(2, 6);
        expect(c1).toBeCloseTo(3, 6);
        expect(c2).toBeCloseTo(0.5, 6);
    });

    test("linear trend of a straight line is the line", () => {
        expect(computeTrendValues([1, 3, 5, 7], "linear", 3, 2).map(v => Math.round(v * 1e6) / 1e6)).toEqual([1, 3, 5, 7]);
    });

    test("moving average smooths with the given window", () => {
        expect(computeTrendValues([0, 3, 6], "moving-average", 3, 2)).toEqual([1.5, 3, 4.5]);
    });
});

describe("resolveStyle", () => {
    test("is transparent without a theme and paints the theme background with one", () => {
        expect(resolveStyle({ ...defaultConfig }).background).toBeNull();
        expect(resolveStyle({ ...defaultConfig, theme: "dark" }).background).toBe("#0f172a");
    });
});

describe("escapeHtml", () => {
    test("escapes markup characters", () => {
        expect(escapeHtml(`<a href="x">'&'</a>`)).toBe("&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;");
    });
});
