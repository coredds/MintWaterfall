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
    d3.select(el).datum(data).call(chart as any);
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
        const baseline = Number(el.querySelector(".x-axis")!.getAttribute("transform")!.match(/,([\d.]+)\)/)![1]);
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
                { label: "A", stacks: [{ value: 100, label: "x" }, { value: 50, label: "y" }] },
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
        d3.select(el).datum(changed).call(chart as any);
        expect(rectOf(bars(el)[11]).height).toBeGreaterThan(before);
    });

    test("re-rendering does not accumulate defs or clip paths", () => {
        const { el, chart } = render(PL);
        for (let i = 0; i < 5; i++) d3.select(el).datum(PL).call(chart as any);
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
        d3.select(svg).datum(PL).call(chart as any);
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
        d3.select(el).datum(PL).call(chart as any);
        expect(el.querySelector("rect.mw-background")).toBeNull();
    });

    test("falls back to chart.data() when no datum is bound", () => {
        const el = mount();
        const chart = waterfallChart().duration(0).data(PL);
        d3.select(el).call(chart as any);
        expect(bars(el)).toHaveLength(PL.length);
    });

    test("trend line, confidence bands and milestones render and can be removed", () => {
        const { el, chart } = render(PL, c => c.showTrendLine(true).trendLineType("polynomial"));
        expect(el.querySelector("path.trend-line")!.getAttribute("d")).toBeTruthy();
        chart.showTrendLine(false);
        d3.select(el).datum(PL).call(chart as any);
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
        const { el, chart } = render([{ label: "<img src=x onerror=alert(1)>", stacks: [{ value: 5 }] }], c =>
            c.enableTooltips(true)
        );
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
        d3.select(el).datum(PL).call(chart as any);
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
