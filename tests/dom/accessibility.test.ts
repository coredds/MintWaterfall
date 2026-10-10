/**
 * Accessibility system (src/accessibility.ts) with the real D3.
 */
import * as d3 from "d3";
import { createAccessibilitySystem, makeChartAccessible } from "../../src/accessibility.js";

const data = [
    { label: "Revenue", stacks: [{ value: 500 }] },
    { label: "Costs", stacks: [{ value: -200, label: "COGS" }, { value: -100, label: "Opex" }], cumulative: 200 },
    { label: "Tax", stacks: [{ value: -50 }] },
];

/** A container with an <svg> holding one focusable .bar-group per datum. */
function mountChart() {
    const container = d3.select(document.body).append("div");
    const svg = container.append("svg");
    svg.selectAll("g.bar-group").data(data).enter().append("g").attr("class", "bar-group");
    return { container, svg: svg.node() as SVGSVGElement, bars: () => Array.from(svg.node()!.querySelectorAll("g.bar-group")) };
}

const key = (el: Element, k: string) => el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: false, cancelable: true }));

afterEach(() => {
    document.body.innerHTML = "";
    document.head.innerHTML = "";
});

describe("validateColorContrast (WCAG 2.x)", () => {
    const a11y = createAccessibilitySystem();

    test.each([
        ["#000000", "#ffffff", 21],
        ["#ffffff", "#ffffff", 1],
        ["#767676", "#ffffff", 4.54], // the classic lightest AA grey on white
        ["#777777", "#ffffff", 4.48], // ...and the one just below
        ["#0000ff", "#ffffff", 8.59],
        ["#ff0000", "#ffffff", 4.0],
    ])("%s on %s ≈ %f:1", (fg, bg, expected) => {
        expect(a11y.validateColorContrast(fg, bg).ratio).toBeCloseTo(expected, 1);
    });

    test("AA / AAA thresholds and symmetry", () => {
        expect(a11y.validateColorContrast("#767676", "#fff")).toMatchObject({ passesAA: true, passesAAA: false });
        expect(a11y.validateColorContrast("#777777", "#fff").passesAA).toBe(false);
        expect(a11y.validateColorContrast("#595959", "#fff").passesAAA).toBe(true);
        expect(a11y.validateColorContrast("#fff", "#123456").ratio).toBeCloseTo(a11y.validateColorContrast("#123456", "#fff").ratio, 10);
    });

    test("unparseable colors fail instead of returning NaN", () => {
        const r = a11y.validateColorContrast("not-a-color", "#fff");
        expect(r).toEqual({ ratio: 1, passesAA: false, passesAAA: false });
    });
});

describe("description, labels and live region", () => {
    test("createChartDescription summarises the data", () => {
        const a11y = createAccessibilitySystem();
        const { container } = mountChart();
        const id = a11y.createChartDescription(container, data, { title: "P&L", showTotal: true, formatNumber: n => `$${n}` });
        const text = document.getElementById(id)!.textContent!.replace(/\s+/g, " ");
        expect(text).toContain("P&L");
        expect(text).toContain("3 data categories plus a total bar");
        expect(text).toContain("Total value: $150");
        expect(text).toContain("1 categories have positive values, 2 have negative values");
    });

    test("hierarchical data sums the leaves", () => {
        const a11y = createAccessibilitySystem();
        const { container } = mountChart();
        const id = a11y.createChartDescription(container, { children: [{ value: 2 }, { children: [{ value: 3 }] }] });
        expect(document.getElementById(id)!.textContent).toContain("Total value: 5");
    });

    test("makeAccessible sets roles and bar labels", () => {
        const a11y = createAccessibilitySystem();
        const { container, svg, bars } = mountChart();
        const id = a11y.createChartDescription(container, data);
        const result = a11y.makeAccessible(container, data, { formatNumber: n => n.toFixed(1) });
        expect(result.focusableElements).toBe(3);
        expect(svg.getAttribute("role")).toBe("img");
        expect(svg.getAttribute("aria-describedby")).toBe(id);
        const [first, second] = bars();
        expect(first.getAttribute("role")).toBe("button");
        expect(first.getAttribute("aria-label")).toBe("Revenue: 500.0. Press Enter for details.");
        expect(second.getAttribute("aria-label")).toBe("Costs: -300.0, 2 segments, cumulative total: 200.0. Press Enter for details.");
    });

    test("announce writes to the live region and the custom announcer", () => {
        const a11y = createAccessibilitySystem();
        const live = a11y.createLiveRegion(d3.select(document.body));
        const spy = jest.fn();
        a11y.setAnnounceFunction(spy).announce("hello");
        expect(live.text()).toBe("hello");
        expect(live.attr("aria-live")).toBe("polite");
        expect(spy).toHaveBeenCalledWith("hello");
    });
});

describe("keyboard navigation", () => {
    function setup() {
        const a11y = createAccessibilitySystem();
        const messages: string[] = [];
        a11y.setAnnounceFunction(m => messages.push(m));
        const chart = mountChart();
        a11y.makeAccessible(chart.container, data);
        return { a11y, messages, ...chart };
    }

    test("arrow keys on a bar move to its neighbours (and wrap)", () => {
        const { a11y, messages, bars } = setup();
        const [first, second, third] = bars();
        (first as HTMLElement).focus();
        expect(a11y.getCurrentFocus()).toBe(0);
        key(first, "ArrowRight");
        expect(document.activeElement).toBe(second);
        expect(messages.at(-1)).toBe("Focused on Costs, value -300");
        key(second, "ArrowDown");
        expect(document.activeElement).toBe(third);
        key(third, "ArrowRight");
        expect(document.activeElement).toBe(first); // wraps
        key(first, "ArrowLeft");
        expect(document.activeElement).toBe(third);
    });

    test("Enter on a bar announces details and dispatches click", () => {
        const { messages, bars } = setup();
        const second = bars()[1];
        const click = jest.fn();
        second.addEventListener("click", click);
        key(second, "Enter");
        expect(messages.at(-1)).toBe("Costs: Total value -300. Contains 2 segments: COGS, Opex. Cumulative total: 200");
        expect(click).toHaveBeenCalledTimes(1);
    });

    test("chart-level keys: Home/End, Enter summary, Escape returns to this chart", () => {
        const { a11y, messages, svg, bars } = setup();
        // a second, earlier-unrelated chart on the page must not steal focus on Escape
        const other = mountChart();
        createAccessibilitySystem().makeAccessible(other.container, data);

        key(svg, "Enter");
        expect(messages.at(-1)).toBe("Waterfall chart with 3 categories. Total value: 150. Use arrow keys to navigate between bars.");
        key(svg, "End");
        expect(document.activeElement).toBe(bars()[2]);
        key(svg, "Home");
        expect(document.activeElement).toBe(bars()[0]);
        key(svg, "Escape");
        expect(document.activeElement).toBe(svg);
        expect(a11y.getCurrentFocus()).toBe(-1);
    });

    test("arrow keys do nothing without focusable bars", () => {
        const a11y = createAccessibilitySystem();
        expect(() => a11y.moveFocus(1, data, {})).not.toThrow();
        expect(a11y.getFocusableCount()).toBe(0);
    });
});

describe("preferences and styles", () => {
    const original = window.matchMedia;
    afterEach(() => {
        window.matchMedia = original;
    });
    const mockMedia = (matching: string[]) => {
        window.matchMedia = ((q: string) => ({ matches: matching.includes(q) })) as any;
    };

    test("reduced motion zeroes animation durations", () => {
        const a11y = createAccessibilitySystem();
        mockMedia(["(prefers-reduced-motion: reduce)"]);
        expect(a11y.respectsReducedMotion()).toBe(true);
        expect(a11y.getAccessibleAnimationDuration(500)).toBe(0);
        mockMedia([]);
        expect(a11y.getAccessibleAnimationDuration(500)).toBe(500);
    });

    test("high contrast detection and styles", () => {
        const a11y = createAccessibilitySystem();
        const { container, bars } = mountChart();
        bars().forEach(g => g.appendChild(document.createElementNS("http://www.w3.org/2000/svg", "rect")));
        mockMedia([]);
        expect(a11y.detectHighContrast()).toBe(false);
        a11y.applyHighContrastStyles(container);
        expect((bars()[0].firstChild as SVGElement).style.stroke).toBe("");
        mockMedia(["(forced-colors: active)"]);
        expect(a11y.detectHighContrast()).toBe(true);
        a11y.applyHighContrastStyles(container);
        expect((bars()[0].firstChild as SVGElement).style.stroke).toBe("CanvasText");
    });

    test("forced-colors CSS is injected once, on demand (not on import)", () => {
        expect(document.getElementById("mintwaterfall-forced-colors-css")).toBeNull();
        const a11y = createAccessibilitySystem();
        a11y.injectForcedColorsCSS();
        a11y.injectForcedColorsCSS();
        expect(document.querySelectorAll("#mintwaterfall-forced-colors-css")).toHaveLength(1);
    });

    test("makeChartAccessible wires everything together", () => {
        mockMedia([]);
        const { container } = mountChart();
        const result = makeChartAccessible(container, data);
        expect(result.focusableElements).toBe(3);
        expect(document.getElementById(result.descriptionId)).not.toBeNull();
        expect(document.getElementById("waterfall-live-region")).not.toBeNull();
        expect(document.getElementById("mintwaterfall-forced-colors-css")).not.toBeNull();
    });
});
