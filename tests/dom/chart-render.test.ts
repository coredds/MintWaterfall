/**
 * Rendering tests using the real D3 (no mock) in jsdom.
 * Charts are rendered with duration(0) so output is synchronous.
 */
import * as d3 from "d3";
import { waterfallChart } from "../../src/chart/chart.js";
import type { ChartData, ProcessedData } from "../../src/chart/config.js";

const PL: ChartData[] = [
    { label: "Revenue", stacks: [{ value: 5200 }] },
    { label: "Cost of sales", stacks: [{ value: -2100 }] },
    { label: "Gross profit", subtotal: true },
    { label: "Opex", stacks: [{ value: -1950 }] },
];

function mount(): HTMLDivElement {
    const div = document.createElement("div");
    document.body.appendChild(div);
    return div;
}

function render(data: ChartData[], configure: (c: ReturnType<typeof waterfallChart>) => void = () => {}) {
    const el = mount();
    const chart = waterfallChart().width(600).height(300).duration(0);
    configure(chart);
    d3.select(el)
        .datum(data)
        .call(chart as any);
    return { el, chart, svg: el.querySelector("svg") as SVGSVGElement };
}

function bars(el: Element): SVGGElement[] {
    return Array.from(el.querySelectorAll("g.bar-group"));
}

function rectOf(g: Element): { y: number; height: number; fill: string | null } {
    const r = g.querySelector("rect") as SVGRectElement;
    return { y: Number(r.getAttribute("y")), height: Number(r.getAttribute("height")), fill: r.getAttribute("fill") };
}

afterEach(() => {
    document.body.innerHTML = "";
});

describe("rendering", () => {
    test("renders one bar group per datum plus the total", () => {
        const { el } = render(PL, c => c.showTotal(true).totalLabel("Net"));
        const groups = bars(el);
        expect(groups).toHaveLength(5);
        expect(groups[4].classList.contains("is-total")).toBe(true);
        expect(groups[2].classList.contains("is-subtotal")).toBe(true);
        expect(groups[0].classList.contains("is-increase")).toBe(true);
        expect(groups[1].classList.contains("is-decrease")).toBe(true);
    });

    test("y scale includes zero, so the first bar starts at the baseline", () => {
        const { el } = render([
            { label: "A", stacks: [{ value: 1000 }] },
            { label: "B", stacks: [{ value: -100 }] },
        ]);
        const baseline = Number(
            el
                .querySelector(".x-axis")!
                .getAttribute("transform")!
                .match(/,([\d.]+)\)/)![1]
        );
        const first = rectOf(bars(el)[0]);
        expect(first.y + first.height).toBeCloseTo(baseline, 5);
    });

    test("subtotal bars run from zero to the running total", () => {
        const { el } = render(PL);
        const revenue = rectOf(bars(el)[0]);
        const subtotal = rectOf(bars(el)[2]);
        // same baseline as revenue, and height proportional to 3100 / 5200
        expect(subtotal.y + subtotal.height).toBeCloseTo(revenue.y + revenue.height, 5);
        expect(subtotal.height / revenue.height).toBeCloseTo(3100 / 5200, 3);
    });

    test("uses semantic colors when stacks have no color", () => {
        const { el } = render(PL, c => c.showTotal(true));
        const [inc, dec, sub, , total] = bars(el).map(rectOf);
        expect(inc.fill).toBe("#10b981");
        expect(dec.fill).toBe("#ef4444");
        expect(total.fill).toBe("#475569");
        expect(sub.fill).not.toBe(total.fill); // subtotal is a lighter shade
    });

    test("respects explicit stack colors", () => {
        const { el } = render([{ label: "A", stacks: [{ value: 10, color: "#123456" }] }]);
        expect(rectOf(bars(el)[0]).fill).toBe("#123456");
    });

    test("value labels are signed for deltas and unsigned for totals", () => {
        const { el } = render(PL, c => c.showTotal(true).formatNumber(d3.format(",.0f")));
        const labels = Array.from(el.querySelectorAll("text.total-label")).map(t => t.textContent);
        expect(labels).toEqual(["+5,200", "\u22122,100", "3,100", "\u22121,950", "1,150"]);
    });

    test("value labels can be hidden", () => {
        const { el } = render(PL, c => c.showValueLabels(false));
        expect(el.querySelectorAll("text.total-label")).toHaveLength(0);
    });

    test("draws connectors between consecutive bars", () => {
        const { el } = render(PL);
        expect(el.querySelectorAll("line.connector")).toHaveLength(PL.length - 1);
        const { el: el2 } = render(PL, c => c.showConnectors(false));
        expect(el2.querySelectorAll("line.connector")).toHaveLength(0);
    });

    test("stacked mode draws one rect per stack, colored from the palette", () => {
        const { el } = render(
            [
                {
                    label: "A",
                    stacks: [
                        { value: 100, label: "x" },
                        { value: 50, label: "y" },
                    ],
                },
                { label: "B", stacks: [{ value: -30 }] },
            ],
            c => c.stacked(true)
        );
        const segs = el.querySelectorAll("g.bar-group")[0].querySelectorAll("rect.stack");
        expect(segs).toHaveLength(2);
        expect(segs[0].getAttribute("fill")).not.toBe(segs[1].getAttribute("fill"));
    });

    test("re-rendering with changed data updates the bars (no stale cache)", () => {
        const long = Array.from({ length: 12 }, (_, i) => ({ label: `Item number ${i}`, stacks: [{ value: 100 }] }));
        const { el, chart } = render(long);
        const before = rectOf(bars(el)[11]).height;
        const changed = long.map((d, i) => (i === 11 ? { ...d, stacks: [{ value: 400 }] } : d));
        d3.select(el)
            .datum(changed)
            .call(chart as any);
        expect(rectOf(bars(el)[11]).height).toBeGreaterThan(before);
    });

    test("re-rendering does not accumulate defs or clip paths", () => {
        const { el, chart } = render(PL);
        for (let i = 0; i < 5; i++)
            d3.select(el)
                .datum(PL)
                .call(chart as any);
        expect(el.querySelectorAll("defs")).toHaveLength(1);
        expect(el.querySelectorAll("clipPath")).toHaveLength(1);
        expect(el.querySelectorAll("svg")).toHaveLength(1);
    });

    test("does not mutate the configured width/height", () => {
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("width", "500");
        svg.setAttribute("height", "250");
        document.body.appendChild(svg);
        const chart = waterfallChart().duration(0);
        d3.select(svg)
            .datum(PL)
            .call(chart as any);
        expect(chart.width()).toBe(800);
        expect(svg.getAttribute("viewBox")).toBe("0 0 500 250");
    });

    test("responsive mode scales to the container", () => {
        const { svg } = render(PL, c => c.responsive(true));
        expect(svg.style.width).toBe("100%");
        expect(svg.getAttribute("viewBox")).toBe("0 0 600 300");
    });

    test("theme paints a background and restyles bars", () => {
        const { el } = render(PL, c => c.theme("dark"));
        const bg = el.querySelector("rect.mw-background");
        expect(bg).not.toBeNull();
        expect(bg!.getAttribute("fill")).toBe("#0f172a");
        expect(rectOf(bars(el)[0]).fill).toBe("#34d399");
    });

    test("clearing the theme removes the background", () => {
        const { el, chart } = render(PL, c => c.theme("dark"));
        chart.theme(null);
        d3.select(el)
            .datum(PL)
            .call(chart as any);
        expect(el.querySelector("rect.mw-background")).toBeNull();
    });

    test("falls back to chart.data() when no datum is bound", () => {
        const el = mount();
        const chart = waterfallChart().duration(0).data(PL);
        d3.select(el).call(chart as any);
        expect(bars(el)).toHaveLength(PL.length);
    });

    test("trend line renders and can be removed", () => {
        const { el, chart } = render(PL, c => c.showTrendLine(true).trendLineType("polynomial"));
        expect(el.querySelector("path.trend-line")!.getAttribute("d")).toBeTruthy();
        chart.showTrendLine(false);
        d3.select(el)
            .datum(PL)
            .call(chart as any);
        expect(el.querySelector("path.trend-line")).toBeNull();
    });

    test("wraps long x labels instead of overlapping", () => {
        const data = ["Operating income", "Other income", "Cost of sales", "Gross profit", "Revenue", "Tax", "Interest", "Tax credit"].map(
            label => ({ label, stacks: [{ value: 10 }] })
        );
        const { el } = render(data, c => c.width(700));
        const tspans = el.querySelectorAll(".x-axis .tick text tspan");
        expect(tspans.length).toBeGreaterThan(0);
        expect(el.querySelector(".x-axis .tick text")!.getAttribute("transform")).toBeNull();
    });

    test("hides value labels that do not fit the bar spacing", () => {
        const data = Array.from({ length: 30 }, (_, i) => ({ label: `B${i}`, stacks: [{ value: 123456 }] }));
        const { el } = render(data, c => c.width(400));
        expect(el.querySelectorAll("text.total-label")).toHaveLength(0);
    });

    test("thins crowded rotated x labels", () => {
        const data = Array.from({ length: 40 }, (_, i) => ({ label: `Week ${i}`, stacks: [{ value: 10 }] }));
        const { el } = render(data, c => c.width(400));
        const texts = Array.from(el.querySelectorAll(".x-axis .tick text"));
        const hidden = texts.filter(t => t.getAttribute("display") === "none");
        expect(hidden.length).toBeGreaterThan(0);
        expect(texts[0].getAttribute("display")).toBeNull();
    });

    test("does not label stack segments too narrow for their text", () => {
        const data = Array.from({ length: 12 }, (_, i) => ({ label: `S${i}`, stacks: [{ value: 500, label: "Very long segment" }] }));
        const { el } = render(data, c => c.width(400).stacked(true));
        expect(el.querySelectorAll("text.stack-label")).toHaveLength(0);
    });

    test("time scale positions bars by date without overlap", () => {
        const data = ["2024-01-01", "2024-02-01", "2024-02-08", "2024-06-01"].map(label => ({ label, stacks: [{ value: 10 }] }));
        const { el } = render(data, c => c.scaleType("time").showTrendLine(true));
        const xs = bars(el).map(g => Number(g.getAttribute("transform")!.match(/translate\(([-\d.]+)/)![1]));
        expect(xs.every(Number.isFinite)).toBe(true);
        expect([...xs].sort((a, b) => a - b)).toEqual(xs); // chronological order
        const width = Number(el.querySelector("rect.waterfall-bar")!.getAttribute("width"));
        // Feb 1 → Feb 8 is the closest pair; bars must not overlap
        expect(xs[1] + width).toBeLessThanOrEqual(xs[2] + 0.001);
        expect(el.querySelector("path.trend-line")!.getAttribute("d")).not.toContain("NaN");
        expect(el.querySelectorAll("line.connector")).toHaveLength(3);
    });

    test("rotates x labels that cannot be wrapped", () => {
        const data = Array.from({ length: 10 }, (_, i) => ({ label: `Supercalifragilistic${i}`, stacks: [{ value: 10 }] }));
        const { el } = render(data);
        expect(el.querySelector(".x-axis .tick text")!.getAttribute("transform")).toBe("rotate(-35)");
    });
});

describe("accessibility", () => {
    test("svg has an accessible name summarising the chart", () => {
        const { svg } = render(PL, c => c.formatNumber(d3.format(",.0f")));
        expect(svg.getAttribute("role")).toBe("group");
        expect(svg.getAttribute("aria-label")).toContain("Waterfall chart with 4 bars");
        expect(svg.getAttribute("aria-label")).toContain("Largest increase: Revenue");
        expect(svg.querySelector("title")!.textContent).toContain("ending at 1,150");
    });

    test("bars are focusable list items with descriptive labels", () => {
        const { el } = render(PL, c => c.formatNumber(d3.format(",.0f")));
        const g = bars(el)[1];
        expect(g.getAttribute("tabindex")).toBe("0");
        expect(g.getAttribute("role")).toBe("listitem");
        expect(g.getAttribute("aria-label")).toBe("Cost of sales: decrease of 2,100, running total 3,100");
        expect(el.querySelector(".bars-layer")!.getAttribute("role")).toBe("list");
    });

    test("can be disabled", () => {
        const { el, svg } = render(PL, c => c.enableAccessibility(false));
        expect(svg.getAttribute("role")).toBeNull();
        expect(bars(el)[0].getAttribute("tabindex")).toBeNull();
    });

    test("arrow keys move focus between bars", () => {
        const { el } = render(PL);
        const [first, second] = bars(el);
        first.focus();
        first.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
        expect(document.activeElement).toBe(second);
    });
});

describe("events", () => {
    test("barClick fires on click and on Enter with the bar datum", () => {
        const handler = jest.fn();
        const { el } = render(PL, c => c.on("barClick", handler));
        bars(el)[0].dispatchEvent(new MouseEvent("click", { bubbles: true }));
        bars(el)[1].dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
        expect(handler).toHaveBeenCalledTimes(2);
        expect((handler.mock.calls[0][1] as ProcessedData).label).toBe("Revenue");
        expect((handler.mock.calls[1][1] as ProcessedData).label).toBe("Cost of sales");
    });

    test("barMouseover / barMouseout fire and emphasise the hovered bar", () => {
        const over = jest.fn();
        const out = jest.fn();
        const { el } = render(PL, c => c.on("barMouseover", over).on("barMouseout", out));
        const g = bars(el)[0];
        g.dispatchEvent(new MouseEvent("mouseenter"));
        expect(over).toHaveBeenCalledTimes(1);
        expect((bars(el)[1] as SVGGElement).style.opacity).toBe("0.3");
        g.dispatchEvent(new MouseEvent("mouseleave"));
        expect(out).toHaveBeenCalledTimes(1);
        expect((bars(el)[1] as SVGGElement).style.opacity).toBe("1");
    });

    test("chartUpdate fires after each render with processed data", () => {
        const update = jest.fn();
        render(PL, c => c.on("chartUpdate", update).showTotal(true));
        expect(update).toHaveBeenCalledTimes(1);
        expect(update.mock.calls[0][0]).toHaveLength(PL.length + 1);
    });

    test("on(type) returns the registered handler", () => {
        const fn = () => {};
        const chart = waterfallChart().on("barClick", fn);
        expect(chart.on("barClick")).toBe(fn);
    });
});

describe("tooltips", () => {
    test("shows an escaped tooltip on hover", () => {
        const { el, chart } = render([{ label: "<img src=x onerror=alert(1)>", stacks: [{ value: 5 }] }], c => c.enableTooltips(true));
        bars(el)[0].dispatchEvent(new MouseEvent("mouseenter", { clientX: 10, clientY: 10 }));
        const tip = document.querySelector(".mintwaterfall-tooltip") as HTMLElement;
        expect(tip).not.toBeNull();
        expect(tip.innerHTML).toContain("&lt;img");
        expect(tip.querySelector("img")).toBeNull();
        expect(tip.textContent).toContain("Running total");
        chart.destroy();
        expect(document.querySelector(".mintwaterfall-tooltip")).toBeNull();
    });
});

describe("brush and zoom", () => {
    test("brush layer is created only when enabled", () => {
        const { el } = render(PL, c => c.enableBrush(true));
        expect(el.querySelector(".brush-layer .overlay")).not.toBeNull();
        const { el: el2 } = render(PL);
        expect(el2.querySelector(".brush-layer .overlay")).toBeNull();
    });

    test("zoom attaches to the svg when enabled and detaches when disabled", () => {
        const { svg, chart, el } = render(PL, c => c.enableZoom(true));
        expect((svg as any).__zoom).toBeDefined();
        expect((svg as any).__on?.some((l: any) => l.name === "zoom")).toBe(true);
        chart.enableZoom(false);
        d3.select(el)
            .datum(PL)
            .call(chart as any);
        expect(((svg as any).__on || []).some((l: any) => l.name === "zoom")).toBe(false);
    });
});

describe("export", () => {
    beforeAll(() => {
        (URL as any).createObjectURL = jest.fn(() => "blob:mock");
        (URL as any).revokeObjectURL = jest.fn();
    });

    test("exports SVG markup of the last render", async () => {
        const { chart } = render(PL);
        const result = await chart.export("svg");
        expect(result.data).toContain("<svg");
        expect(result.data).toContain("waterfall-bar");
    });

    test("exports CSV rows with type and running total", async () => {
        const { chart } = render(PL, c => c.showTotal(true));
        const result = await chart.export("csv");
        const lines = String(result.data).split("\n");
        expect(lines[0]).toBe("label,type,value,runningTotal");
        expect(lines[1]).toBe("Revenue,increase,5200,5200");
        expect(lines[3]).toBe("Gross profit,subtotal,3100,3100");
        expect(lines[5]).toBe("Total,total,1150,1150");
    });

    test("rejects when export is disabled or nothing was rendered", async () => {
        await expect(waterfallChart().export("svg")).rejects.toThrow(/render the chart/);
        const { chart } = render(PL, c => c.enableExport(false));
        await expect(chart.export("svg")).rejects.toThrow(/disabled/);
    });
});

describe("validation", () => {
    test("rejects malformed data without rendering", () => {
        const spy = jest.spyOn(console, "error").mockImplementation(() => {});
        const { el } = render([{ label: "A", stacks: [{ value: "x" as any }] }]);
        expect(spy).toHaveBeenCalled();
        expect(el.querySelector("svg")).toBeNull();
        spy.mockRestore();
    });

    test("rejects non-finite values", () => {
        const spy = jest.spyOn(console, "error").mockImplementation(() => {});
        const { el } = render([{ label: "A", stacks: [{ value: NaN }] }]);
        expect(el.querySelector("svg")).toBeNull();
        spy.mockRestore();
    });
});

describe("step 6 features", () => {
    test("opening balance resets the running total and is drawn like a total", () => {
        const { el } = render(
            [
                { label: "Opening", start: true, stacks: [{ value: 1000 }] },
                { label: "Sales", stacks: [{ value: 300 }] },
                { label: "Costs", stacks: [{ value: -200 }] },
            ],
            c => c.showTotal(true).formatNumber(d3.format(",.0f"))
        );
        const groups = bars(el);
        expect(groups[0].classList.contains("is-start")).toBe(true);
        expect(groups[0].classList.contains("is-increase")).toBe(false);
        expect(rectOf(groups[0]).fill).toBe("#475569"); // total color, not "increase" green
        expect(groups[0].getAttribute("aria-label")).toBe("Opening: opening value 1,000");
        const labels = Array.from(el.querySelectorAll("text.total-label")).map(t => t.textContent);
        expect(labels).toEqual(["1,000", "+300", "\u2212200", "1,100"]);
    });

    test("a mid-series start bar replaces the running total", () => {
        const update = jest.fn();
        render(
            [
                { label: "A", stacks: [{ value: 50 }] },
                { label: "Restated", start: true, stacks: [{ value: 400 }] },
                { label: "B", stacks: [{ value: 10 }] },
            ],
            c => c.on("chartUpdate", update)
        );
        const processed = update.mock.calls[0][0] as ProcessedData[];
        expect(processed.map(d => d.cumulativeTotal)).toEqual([50, 400, 410]);
    });

    test("valueLabel customises or hides labels, and layout measures the custom text", () => {
        const { el } = render(PL, c => c.valueLabel((d, text) => (d.isSubtotal ? "" : `${text} (${d.label.length})`)));
        const labels = Array.from(el.querySelectorAll("text.total-label")).map(t => t.textContent);
        expect(labels).toHaveLength(3);
        expect(labels[0]).toBe("+5,200 (7)");
    });

    test("tooltipContent receives the default HTML and can replace it", () => {
        const fn = jest.fn((d: ProcessedData, html: string) => `<b class="custom">${d.label}</b>${html.length > 0 ? "" : "x"}`);
        const { el, chart } = render(PL, c => c.enableTooltips(true).tooltipContent(fn));
        bars(el)[0].dispatchEvent(new MouseEvent("mouseenter", { clientX: 5, clientY: 5 }));
        expect(fn).toHaveBeenCalledWith(expect.objectContaining({ label: "Revenue" }), expect.stringContaining("Change"));
        expect(document.querySelector(".mintwaterfall-tooltip b.custom")!.textContent).toBe("Revenue");
        chart.destroy();
    });

    test("legend lists bar kinds present, and stack labels when stacked", () => {
        const { el } = render(PL, c => c.showLegend(true).showTotal(true));
        const kinds = Array.from(el.querySelectorAll(".legend-item text")).map(t => t.textContent);
        expect(kinds).toEqual(["Increase", "Decrease", "Subtotal", "Total"]);

        const { el: el2 } = render(
            [
                {
                    label: "Q1",
                    stacks: [
                        { value: 10, label: "Core" },
                        { value: 5, label: "Add-ons" },
                    ],
                },
                { label: "Q2", stacks: [{ value: 4, label: "Core" }] },
            ],
            c => c.stacked(true).showLegend(true)
        );
        const items = Array.from(el2.querySelectorAll(".legend-item"));
        expect(items.map(i => i.querySelector("text")!.textContent)).toEqual(["Core", "Add-ons"]);
        const segFill = el2.querySelector("g.bar-group rect.stack")!.getAttribute("fill");
        expect(items[0].querySelector("rect")!.getAttribute("fill")).toBe(segFill);
    });

    test("legend reserves space so the plot starts below it", () => {
        const top = (el: Element) =>
            Number(
                el
                    .querySelector(".y-axis .tick:last-of-type")!
                    .getAttribute("transform")!
                    .match(/,([\d.]+)\)/)![1]
            );
        const { el: without } = render(PL);
        const { el: withLegend } = render(PL, c => c.showLegend(true));
        expect(top(withLegend)).toBeGreaterThan(top(without));
        expect(withLegend.querySelectorAll(".legend-item").length).toBeGreaterThan(0);
        expect(without.querySelectorAll(".legend-item")).toHaveLength(0);
    });

    test('theme("auto") follows prefers-color-scheme', () => {
        const listeners: Array<() => void> = [];
        let dark = true;
        const original = window.matchMedia;
        (window as any).matchMedia = (q: string) => ({
            matches: q.includes("dark") ? dark : false,
            media: q,
            addEventListener: (_: string, fn: () => void) => listeners.push(fn),
            removeEventListener: jest.fn(),
        });
        try {
            const { el, chart } = render(PL, c => c.theme("auto"));
            expect(el.querySelector("rect.mw-background")!.getAttribute("fill")).toBe("#0f172a");
            expect(rectOf(bars(el)[0]).fill).toBe("#34d399");
            dark = false;
            listeners.forEach(fn => fn());
            expect(el.querySelector("rect.mw-background")!.getAttribute("fill")).toBe("#ffffff");
            expect(rectOf(bars(el)[0]).fill).toBe("#10b981");
            expect(chart.theme()).toBe("auto");
            chart.destroy();
        } finally {
            (window as any).matchMedia = original;
        }
    });

    test("CSV export labels opening bars as start", async () => {
        (URL as any).createObjectURL = jest.fn(() => "blob:mock");
        const { chart } = render([
            { label: "Open", start: true, stacks: [{ value: 7 }] },
            { label: "B", stacks: [{ value: 1 }] },
        ]);
        const csv = String((await chart.export("csv")).data).split("\n");
        expect(csv[1]).toBe("Open,start,7,7");
    });
});

describe("horizontal orientation", () => {
    const num = (el: Element | null, attr: string) => Number(el!.getAttribute(attr));
    const translateY = (g: Element) => Number(g.getAttribute("transform")!.match(/translate\(0,([-\d.]+)\)/)![1]);

    test("categories run top to bottom and bar length is proportional to value", () => {
        const { el } = render(PL, c => c.orientation("horizontal"));
        const groups = bars(el);
        const ys = groups.map(translateY);
        expect([...ys].sort((a, b) => a - b)).toEqual(ys); // data order, top to bottom
        const rev = groups[0].querySelector("rect")!;
        const sub = groups[2].querySelector("rect")!;
        expect(num(rev, "y")).toBe(0);
        expect(num(rev, "height")).toBeGreaterThan(0);
        expect(num(sub, "width") / num(rev, "width")).toBeCloseTo(3100 / 5200, 3);
        expect(num(sub, "x")).toBeCloseTo(num(rev, "x"), 5); // both start at zero
    });

    test("axes swap: categories on the left, values along the bottom, vertical grid lines", () => {
        const { el } = render(PL, c => c.orientation("horizontal"));
        expect(el.querySelector(".x-axis")!.getAttribute("transform")).toMatch(/^translate\([\d.]+,0\)$/);
        expect(el.querySelector(".y-axis")!.getAttribute("transform")).toMatch(/^translate\(0,[\d.]+\)$/);
        const categoryText = Array.from(el.querySelectorAll(".x-axis .tick text")).map(t => t.textContent);
        expect(categoryText).toEqual(PL.map(d => d.label));
        const line = el.querySelector("line.grid-line")!;
        expect(line.getAttribute("x1")).toBe(line.getAttribute("x2"));
    });

    test("value labels sit past the bar end, inside the plot", () => {
        const { el, svg } = render(
            [
                { label: "Up", stacks: [{ value: 100 }] },
                { label: "Down a lot", stacks: [{ value: -300 }] }, // spans -200..100: label past the right end
                { label: "Further", stacks: [{ value: -50 }] }, // entirely below zero: label on the left
            ],
            c => c.orientation("horizontal").width(500)
        );
        const labels = Array.from(el.querySelectorAll("text.total-label"));
        expect(labels.map(l => l.getAttribute("text-anchor"))).toEqual(["start", "start", "end"]);
        const further = bars(el)[2].querySelector("rect")!;
        expect(num(labels[2], "x")).toBeLessThan(num(further, "x"));
        const up = bars(el)[0].querySelector("rect")!;
        expect(num(labels[0], "x")).toBeGreaterThan(num(up, "x") + num(up, "width"));
        // reserved space keeps the right-hand label inside the chart width
        expect(num(labels[0], "x") + 40).toBeLessThan(Number(svg.getAttribute("width")));
    });

    test("connectors are vertical between consecutive bars", () => {
        const { el } = render(PL, c => c.orientation("horizontal"));
        const lines = Array.from(el.querySelectorAll("line.connector"));
        expect(lines).toHaveLength(PL.length - 1);
        for (const l of lines) expect(l.getAttribute("x1")).toBe(l.getAttribute("x2"));
    });

    test("stacked segments lie side by side along the value axis", () => {
        const { el } = render(
            [
                {
                    label: "A",
                    stacks: [
                        { value: 100, label: "x" },
                        { value: 50, label: "y" },
                    ],
                },
            ],
            c => c.orientation("horizontal").stacked(true)
        );
        const [a, b] = Array.from(el.querySelectorAll("rect.stack"));
        expect(num(b, "x")).toBeCloseTo(num(a, "x") + num(a, "width"), 5);
        expect(num(a, "height")).toBe(num(b, "height"));
    });

    test("long category labels are truncated with the full text in a <title>", () => {
        const long = "An extremely long category label that would not fit in the margin";
        const { el } = render(
            [
                { label: long, stacks: [{ value: 10 }] },
                { label: "B", stacks: [{ value: 5 }] },
            ],
            c => c.orientation("horizontal").width(400)
        );
        const tick = el.querySelector(".x-axis .tick text")!;
        expect(tick.firstChild!.textContent!.endsWith("\u2026")).toBe(true);
        expect(tick.querySelector("title")!.textContent).toBe(long);
    });

    test("switching orientation re-lays out the same chart cleanly", () => {
        const { el, chart } = render(PL);
        chart.orientation("horizontal");
        d3.select(el)
            .datum(PL)
            .call(chart as any);
        expect(bars(el).every(g => /translate\(0,/.test(g.getAttribute("transform")!))).toBe(true);
        expect(el.querySelector(".x-axis .tick text")!.getAttribute("transform")).toBeNull();
        chart.orientation("vertical");
        d3.select(el)
            .datum(PL)
            .call(chart as any);
        expect(bars(el).every(g => /,0\)$/.test(g.getAttribute("transform")!))).toBe(true);
        expect(el.querySelectorAll(".x-axis .tick")).toHaveLength(PL.length);
    });

    test("vertical-only features are ignored with a single warning each", () => {
        const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
        const { el, chart } = render(PL, c => c.orientation("horizontal").enableBrush(true).enableZoom(true));
        expect(el.querySelector(".brush-layer .overlay")).toBeNull();
        d3.select(el)
            .datum(PL)
            .call(chart as any);
        const messages = warn.mock.calls.map(c => String(c[0]));
        expect(messages.filter(m => m.includes("enableBrush"))).toHaveLength(1);
        expect(messages.filter(m => m.includes("enableZoom"))).toHaveLength(1);
        warn.mockRestore();
    });

    test("keyboard navigation, tooltips and events still work", () => {
        const click = jest.fn();
        const { el } = render(PL, c => c.orientation("horizontal").on("barClick", click));
        const [first, second] = bars(el);
        first.focus();
        first.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
        expect(document.activeElement).toBe(second);
        second.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
        expect(click.mock.calls[0][1].label).toBe("Cost of sales");
    });

    test("confidence bands and milestones are ignored with a warning", () => {
        const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
        const { el } = render(PL, c =>
            c
                .orientation("horizontal")
                .confidenceBands({ enabled: true, scenarios: { optimistic: [], pessimistic: [] } })
                .enableMilestones(true)
                .addMilestone({ label: "Revenue", value: 5000, type: "target" })
        );
        expect(el.querySelector(".confidence-bands-group")).toBeNull();
        expect(el.querySelector(".milestones-group")).toBeNull();
        const messages = warn.mock.calls.map(c => String(c[0]));
        expect(messages.some(m => m.includes("confidence bands"))).toBe(true);
        expect(messages.some(m => m.includes("milestones"))).toBe(true);
        warn.mockRestore();
    });
});

/** Vertices of an SVG path (the end point of each M/L/C command). */
function pathVertices(d: string): Array<[number, number]> {
    return d
        .split(/[MLC]/)
        .filter(Boolean)
        .map(seg => {
            const nums = seg.split(/[ ,]+/).filter(Boolean).map(Number);
            return [nums[nums.length - 2], nums[nums.length - 1]] as [number, number];
        });
}

/** Centre of a bar group: translate(x,0) plus half the bar width. */
function barCenter(g: Element): number {
    const x = Number(g.getAttribute("transform")!.match(/translate\(([-\d.]+)/)![1]);
    return x + Number(g.querySelector("rect")!.getAttribute("width")) / 2;
}

describe("confidence bands", () => {
    const scenarios = {
        optimistic: [
            { label: "Revenue", value: 6000 },
            { label: "Cost of sales", value: -1800 },
            { label: "Opex", value: -1500 },
        ],
        pessimistic: [
            { label: "Revenue", value: 4500 },
            { label: "Cost of sales", value: -2500 },
            { label: "Opex", value: -2200 },
        ],
    };

    test("renders a band and scenario lines, and can be turned off", () => {
        const { el, chart } = render(PL, c => c.confidenceBands({ enabled: true, scenarios, opacity: 0.4 }));
        const band = el.querySelector("path.confidence-band")!;
        expect(band.getAttribute("d")).toMatch(/^M/);
        expect(band.getAttribute("d")).not.toContain("NaN");
        expect(band.getAttribute("fill-opacity")).toBe("0.4");
        expect(el.querySelectorAll("path.scenario-line")).toHaveLength(2);

        chart.confidenceBands({ showTrendLines: false });
        d3.select(el)
            .datum(PL)
            .call(chart as any);
        expect(el.querySelectorAll("path.scenario-line")).toHaveLength(0);
        expect(chart.confidenceBands().opacity).toBe(0.4); // partial update merged

        chart.enableConfidenceBands(false);
        d3.select(el)
            .datum(PL)
            .call(chart as any);
        expect(el.querySelector(".confidence-bands-group")).toBeNull();
    });

    test("scenario running totals follow subtotals, totals and opening balances", () => {
        const data: ChartData[] = [
            { label: "Opening", start: true, stacks: [{ value: 1000 }] },
            { label: "Revenue", stacks: [{ value: 5200 }] },
            { label: "Gross profit", subtotal: true },
            { label: "Opex", stacks: [{ value: -1950 }] },
        ];
        const { el, chart } = render(data, c =>
            c.showTotal(true).showConnectors(false).confidenceBands({ enabled: true, scenarios, showTrendLines: true })
        );
        const y = (v: number) => {
            // recover the y scale from two bars: Opening (1000) top and baseline
            const opening = rectOf(bars(el)[0]);
            const zero = opening.y + opening.height;
            return zero - (v / 1000) * opening.height;
        };
        const opt = pathVertices(el.querySelector("path.optimistic-trend")!.getAttribute("d")!).map(p => p[1]);
        const pes = pathVertices(el.querySelector("path.pessimistic-trend")!.getAttribute("d")!).map(p => p[1]);
        // Opening (no scenario entry) 1000; +6000 → 7000; subtotal holds 7000; −1500 → 5500; total holds 5500
        [1000, 7000, 7000, 5500, 5500].forEach((v, i) => expect(opt[i]).toBeCloseTo(y(v), 3));
        // Opening 1000; +4500 → 5500; holds; −2200 → 3300; holds
        [1000, 5500, 5500, 3300, 3300].forEach((v, i) => expect(pes[i]).toBeCloseTo(y(v), 3));
        // and the band is centred on the bars
        const xs = pathVertices(el.querySelector("path.optimistic-trend")!.getAttribute("d")!).map(p => p[0]);
        bars(el).forEach((g, i) => expect(xs[i]).toBeCloseTo(barCenter(g), 3));
        expect(chart.enableConfidenceBands()).toBe(true);
    });
});

describe("milestones", () => {
    test("draws one marker per milestone at its bar and value", () => {
        const { el, chart } = render(PL, c =>
            c
                .enableMilestones(true)
                .addMilestone({ label: "Revenue", value: 5200, type: "target" })
                .addMilestone({ label: "Opex", value: 1150, type: "alert", description: "Below plan" })
        );
        const markers = Array.from(el.querySelectorAll("path.milestone-marker"));
        expect(markers).toHaveLength(2);
        const revenueTop = rectOf(bars(el)[0]).y; // Revenue bar top is 5200
        const [, mx, my] = markers[0]
            .getAttribute("transform")!
            .match(/translate\(([-\d.]+), ?([-\d.]+)\)/)!
            .map(Number);
        expect(mx).toBeCloseTo(barCenter(bars(el)[0]), 3);
        expect(my).toBeCloseTo(revenueTop, 3);
        expect(markers[0].getAttribute("fill")).toBe("#f39c12"); // target
        expect(markers[1].getAttribute("fill")).toBe("#e74c3c"); // alert
        expect(markers.every(m => m.getAttribute("d"))).toBe(true);
        expect(chart.milestones().milestones).toHaveLength(2);
    });

    test("milestones() replaces the list without sharing the caller's array; disabling removes markers", () => {
        const list = [{ label: "Revenue", value: 5200, type: "achievement" as const }];
        const { el, chart } = render(PL, c => c.milestones({ enabled: true, milestones: list }));
        chart.addMilestone({ label: "Opex", value: 1150, type: "threshold" });
        expect(list).toHaveLength(1);
        d3.select(el)
            .datum(PL)
            .call(chart as any);
        expect(el.querySelectorAll("path.milestone-marker")).toHaveLength(2);
        chart.enableMilestones(false);
        d3.select(el)
            .datum(PL)
            .call(chart as any);
        expect(el.querySelector(".milestones-group")).toBeNull();
    });

    test("milestone charts don't share state between instances", () => {
        const a = waterfallChart().addMilestone({ label: "A", value: 1, type: "target" });
        const b = waterfallChart();
        expect(a.milestones().milestones).toHaveLength(1);
        expect(b.milestones().milestones).toHaveLength(0);
    });
});
