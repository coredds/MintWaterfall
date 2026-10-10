/**
 * Scale system (src/scales.ts) with the real D3.
 */
import * as d3 from "d3";
import {
    createScaleSystem,
    createTimeScale,
    createBandScale,
    createLinearScale,
    createOrdinalScale,
    scaleUtilities,
} from "../../src/scales.js";

const day = (d: number, m = 0, y = 2024) => new Date(y, m, d);

afterEach(() => {
    document.body.innerHTML = "";
});

/** Render an axis and return its tick labels. */
function tickLabels(axis: d3.Axis<any>): string[] {
    const g = d3.select(document.body).append("svg").append("g");
    g.call(axis);
    return g
        .selectAll<SVGTextElement, unknown>(".tick text")
        .nodes()
        .map(n => n.textContent ?? "");
}

describe("time scales", () => {
    test.each([
        ["hours", [new Date(2024, 0, 1, 8), new Date(2024, 0, 1, 18)], "%H:%M"],
        ["days", [day(1), day(20)], "%m/%d"],
        ["months", [day(1, 0), day(1, 6)], "%b %Y"],
        ["years", [day(1, 0, 2020), day(1, 0, 2024)], "%Y"],
    ])("auto tick format for a span of %s", (_name, dates, specifier) => {
        const scale = createScaleSystem().createTimeScale(dates as Date[]);
        const sample = (dates as Date[])[0];
        expect(scale.tickFormat()(sample)).toBe(d3.timeFormat(specifier as string)(sample));
    });

    test("works with d3 axes and formatTickValue (tickFormat keeps d3's contract)", () => {
        const sys = createScaleSystem();
        const scale = sys.createTimeScale([day(1, 0), day(1, 5)]);
        const labels = tickLabels(sys.scaleUtils.createAxis(scale).ticks(4));
        expect(labels.length).toBeGreaterThan(1);
        expect(labels.every(l => /^[A-Z][a-z]{2} 2024$/.test(l))).toBe(true);
        expect(sys.scaleUtils.formatTickValue(scale, day(1, 2))).toBe("Mar 2024");
        // an explicit specifier passed by the caller still wins
        expect(scale.tickFormat(5, "%Y-%m")(day(1, 2))).toBe("2024-03");
    });

    test("custom format, nice and range options; empty input keeps a valid domain", () => {
        const scale = createTimeScale([day(3), day(17)], { tickFormat: "%d", range: [0, 100], nice: false });
        expect(scale.range()).toEqual([0, 100]);
        expect(scale.domain()).toEqual([day(3), day(17)]);
        expect(scale.tickFormat()(day(9))).toBe("09");
        const empty = createScaleSystem().createTimeScale([]);
        expect(empty.domain().every(d => Number.isFinite(+d))).toBe(true);
    });
});

describe("band, ordinal and linear scales", () => {
    test("band scale: unique string domain, padding variants, default ranges", () => {
        const sys = createScaleSystem();
        const band = sys.createBandScale(["a", "b", "a", 3]);
        expect(band.domain()).toEqual(["a", "b", "3"]);
        expect(band.range()).toEqual([0, 800]);
        expect(band.padding()).toBeCloseTo(0.1);
        const inner = sys.createBandScale(["a", "b"], { paddingInner: 0.5, range: [0, 100] });
        expect(inner.paddingInner()).toBe(0.5);
        expect(inner.paddingOuter()).toBe(0);
        // standalone helper defaults to a 400px range
        expect(createBandScale(["x"]).range()).toEqual([0, 400]);
    });

    test("ordinal scale: deduplicated domain and an unknown color", () => {
        const scale = createOrdinalScale(["x", "y", "x"], { range: ["red", "blue"], unknown: "gray" });
        expect(scale.domain()).toEqual(["x", "y"]);
        expect(scale("y")).toBe("blue");
        expect(scale("z")).toBe("gray");
        expect(createScaleSystem().createOrdinalScale(["q"])("q")).toBe(d3.schemeCategory10[0]);
    });

    test("linear scale: nice, zero, clamp; empty input", () => {
        const sys = createScaleSystem();
        expect(sys.createLinearScale([3, 97]).domain()).toEqual([0, 100]);
        expect(sys.createLinearScale([3, 97], { nice: false }).domain()).toEqual([3, 97]);
        expect(sys.createLinearScale([20, 30], { zero: true, nice: false }).domain()).toEqual([0, 30]);
        expect(sys.createLinearScale([-5, -2], { zero: true, nice: false }).domain()).toEqual([-5, 0]);
        const clamped = createLinearScale([0, 10], { clamp: true, range: [0, 100] });
        expect(clamped(20)).toBe(100);
        expect(sys.createLinearScale([]).domain()).toEqual([0, 1]);
        expect(sys.createLinearScale([], { zero: true }).domain()).toEqual([0, 1]);
    });

    test("log scale falls back to linear for non-positive or empty values", () => {
        const sys = createScaleSystem();
        const log = sys.createLogScale([1, 1000], { range: [0, 300] });
        expect(log(100)).toBeCloseTo(200);
        expect(sys.getScaleInfo(log).type).toBe("log");
        expect(sys.getScaleInfo(sys.createLogScale([0, 10])).type).toBe("linear");
        expect(sys.getScaleInfo(sys.createLogScale([])).type).toBe("linear");
        expect(sys.createLogScale([2, 50], { nice: false, clamp: true }).domain()).toEqual([2, 50]);
    });

    test("setDefaultRange applies to later scales", () => {
        const sys = createScaleSystem();
        sys.setDefaultRange([10, 20]);
        expect(sys.createLinearScale([0, 1]).range()).toEqual([10, 20]);
        expect(sys.createBandScale(["a"]).range()).toEqual([10, 20]);
    });
});

describe("adaptive scales and type detection", () => {
    const sys = createScaleSystem();

    test("picks a scale from the data", () => {
        expect(sys.getScaleInfo(sys.createAdaptiveScale([{ label: "A" }, { label: "B" }])).type).toBe("band");
        expect(sys.getScaleInfo(sys.createAdaptiveScale([{ label: day(1) }, { label: day(9) }])).type).toBe("time");
        expect(sys.getScaleInfo(sys.createAdaptiveScale([{ cumulativeTotal: 5 }, { cumulativeTotal: 9 }], "y")).type).toBe("linear");
        // mixed types fall back to a band scale over the stringified values
        const mixed = sys.createAdaptiveScale([{ label: 1 }, { label: null }]) as d3.ScaleBand<string>;
        expect(mixed.domain()).toEqual(["1", "null"]);
        // no data: an empty band scale, not a time scale with an invalid domain
        expect(sys.getScaleInfo(sys.createAdaptiveScale([])).type).toBe("band");
    });

    test("detectScaleType", () => {
        const u = scaleUtilities;
        expect(u.detectScaleType([day(1)])).toBe("time");
        expect(u.detectScaleType(["a", "b"])).toBe("band");
        expect(u.detectScaleType([1, 2])).toBe("linear");
        expect(u.detectScaleType([1, null])).toBe("adaptive");
        expect(u.detectScaleType([])).toBe("band");
    });

    test("getScaleInfo reports band metrics and ordinal scales", () => {
        const band = d3.scaleBand().domain(["a", "b"]).range([0, 100]);
        expect(sys.getScaleInfo(band)).toMatchObject({ type: "band", bandwidth: 50, step: 50, domain: ["a", "b"], range: [0, 100] });
        expect(sys.getScaleInfo(d3.scaleOrdinal().domain(["a"]).range(["red"])).type).toBe("ordinal");
        const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
        expect(sys.getScaleInfo({}).type).toBe("unknown");
        warn.mockRestore();
    });
});

describe("scale utilities", () => {
    const u = scaleUtilities;

    test("formatTickValue", () => {
        // continuous scales use their own tickFormat (precision follows the tick step)
        const linear = d3.scaleLinear().domain([0, 1]);
        expect(u.formatTickValue(linear, 0.25)).toBe(linear.tickFormat()(0.25));
        const band = d3.scaleBand().domain(["a"]);
        expect(u.formatTickValue(band, 2_500_000)).toBe("2.5M");
        expect(u.formatTickValue(band, -1500)).toBe("-1.5K");
        expect(u.formatTickValue(band, 42.4)).toBe("42");
        expect(u.formatTickValue(band, "Opex")).toBe("Opex");
    });

    test("getTickCount aims for ~75px per tick within [2, 10]", () => {
        expect(u.getTickCount(d3.scaleLinear().range([0, 300]), 0)).toBe(4);
        expect(u.getTickCount(d3.scaleLinear().range([300, 0]), 0)).toBe(4);
        expect(u.getTickCount(d3.scaleLinear().range([0, 50]), 0)).toBe(2);
        expect(u.getTickCount(d3.scaleLinear().range([0, 5000]), 0)).toBe(10);
    });

    test("invertScale for continuous and band scales", () => {
        expect(u.invertScale(d3.scaleLinear().domain([0, 10]).range([0, 100]), 25)).toBe(2.5);
        const band = d3.scaleBand().domain(["a", "b", "c"]).range([0, 300]).padding(0.2);
        expect(u.invertScale(band, 150)).toBe("b");
        // in the padding between bands: the closest band
        expect(u.invertScale(band, band("b")! - 1)).toBe("b");
        expect(u.invertScale(band, 299)).toBe("c");
        expect(u.invertScale(d3.scaleBand().domain([]), 10)).toBeUndefined();
        expect(u.invertScale(d3.scaleOrdinal(), 10)).toBeUndefined();
    });

    test("createColorScale and createAxis orientations", () => {
        const colors = u.createColorScale(["a", "b"], ["#111", "#222"]);
        expect(colors("b")).toBe("#222");
        expect(u.createColorScale(["a"])("a")).toBe(d3.schemeCategory10[0]);
        const linear = d3.scaleLinear().domain([0, 10]).range([0, 100]);
        for (const o of ["top", "bottom", "left", "right"] as const) {
            expect(tickLabels(u.createAxis(linear, o)).length).toBeGreaterThan(1);
        }
        expect(tickLabels(u.createAxis(linear, "diagonal" as any))).toEqual(tickLabels(u.createAxis(linear, "bottom")));
    });
});
