/**
 * Shape helpers with the real D3.
 */
import * as d3 from "d3";
import { createShapeGenerators, createWaterfallConfidenceBands, createWaterfallMilestones } from "../../src/shapes.js";

/** Vertices of a path (end point of each M/L/C command). */
function vertices(d: string): Array<[number, number]> {
    return d
        .split(/[MLCZ]/)
        .filter(s => s.trim())
        .map(seg => {
            const nums = seg.split(/[ ,]+/).filter(Boolean).map(Number);
            return [nums[nums.length - 2], nums[nums.length - 1]] as [number, number];
        });
}

const identity = d3.scaleLinear(); // domain = range = [0, 1]: y(v) === v
const indexX = (labels: string[]) => (label: string) => labels.indexOf(label) * 10;

describe("createShapeGenerators", () => {
    const shapes = createShapeGenerators();
    const pts = [
        { x: 0, y: 0 },
        { x: 10, y: 5 },
        { x: 20, y: 2 },
    ];

    test("trend lines pass through every point with any curve", () => {
        expect(vertices(shapes.createSmoothTrendLine(pts))).toEqual(pts.map(p => [p.x, p.y]));
        const linear = shapes.createSmoothTrendLine(pts, { curve: d3.curveLinear });
        expect(linear).toBe("M0,0L10,5L20,2");
        expect(shapes.createMultipleTrendLines([{ data: pts }, { data: pts, config: { curve: d3.curveLinear } }])).toEqual([
            shapes.createSmoothTrendLine(pts),
            linear,
        ]);
        expect(shapes.createSmoothTrendLine([])).toBe("");
    });

    test("confidence band and envelope areas span lower to upper", () => {
        const band = shapes.createConfidenceBand(
            [
                { x: 0, y: 5, yUpper: 8, yLower: 2 },
                { x: 10, y: 6, yUpper: 9, yLower: 3 },
            ],
            { curve: d3.curveLinear }
        );
        expect(band).toBe("M0,8L10,9L10,3L0,2Z");
        const env = shapes.createEnvelopeArea(
            [
                { x: 0, y0: 1, y1: 4 },
                { x: 10, y0: 2, y1: 5 },
            ],
            { curve: d3.curveLinear }
        );
        expect(env).toBe("M0,4L10,5L10,2L0,1Z");
        expect(shapes.createConfidenceBand([])).toBe("");
    });

    test("data point markers: position, per-point overrides and defaults", () => {
        const markers = shapes.createDataPointMarkers(
            [
                { x: 3, y: 4, type: "star", color: "#123456", size: 200 },
                { x: 5, y: 6, type: "nope" as any },
            ],
            { fillColor: "#abcdef", strokeWidth: 3 }
        );
        expect(markers[0].transform).toBe("translate(3, 4)");
        expect(markers[0].config.fillColor).toBe("#123456");
        expect(markers[1].config.fillColor).toBe("#abcdef");
        expect(markers[1].config.strokeColor).toBe("#ffffff");
        expect(markers[1].config.strokeWidth).toBe(3);
        expect(markers[0].path).toBe(d3.symbol().type(d3.symbolStar).size(200)()!);
        // unknown type falls back to a circle of the default size
        expect(markers[1].path).toBe(d3.symbol().type(d3.symbolCircle).size(64)()!);
    });

    test("custom symbols and type registries", () => {
        expect(shapes.createCustomSymbol("diamond", 50)).toBe(d3.symbol().type(d3.symbolDiamond).size(50)()!);
        expect(shapes.createCustomSymbol("unknown")).toBe(d3.symbol().type(d3.symbolCircle).size(64)()!);
        const curves = shapes.getCurveTypes();
        expect(curves.monotoneX).toBe(d3.curveMonotoneX);
        delete curves.monotoneX; // returned objects are copies
        expect(shapes.getCurveTypes().monotoneX).toBe(d3.curveMonotoneX);
        expect(Object.keys(shapes.getSymbolTypes())).toEqual(
            expect.arrayContaining(["circle", "square", "triangle", "diamond", "star", "cross", "wye"])
        );
    });
});

describe("createWaterfallConfidenceBands", () => {
    const labels = ["Open", "A", "Sub", "B", "Total"];
    const x = indexX(labels);
    const ys = (d: string) => vertices(d).map(p => p[1]);

    test("accumulates changes; subtotals hold, starts reset; scenarios match by label", () => {
        const bands = createWaterfallConfidenceBands(
            [
                { label: "Open", value: 100, start: true },
                { label: "A", value: 50 },
                { label: "Sub", value: 150, subtotal: true },
                { label: "B", value: -30 },
                { label: "Total", value: 120, subtotal: true },
            ],
            {
                // order differs from the baseline: matched by label, not position
                optimistic: [
                    { label: "B", value: -10 },
                    { label: "A", value: 80 },
                ],
                pessimistic: [
                    { label: "Open", value: 90 },
                    { label: "B", value: 0 }, // explicit 0 is respected
                ],
            },
            x,
            identity
        );
        expect(ys(bands.optimisticPath)).toEqual([100, 180, 180, 170, 170]);
        expect(ys(bands.pessimisticPath)).toEqual([90, 140, 140, 140, 140]);
        expect(vertices(bands.optimisticPath).map(p => p[0])).toEqual([0, 10, 20, 30, 40]);
        expect(bands.confidencePath).toMatch(/^M0,100/);
    });

    test("scenario entries without labels fall back to position", () => {
        const bands = createWaterfallConfidenceBands(
            [
                { label: "A", value: 10 },
                { label: "B", value: 10 },
            ],
            { optimistic: [{ value: 20 } as any, { value: 30 } as any], pessimistic: [] },
            indexX(["A", "B"]),
            identity
        );
        expect(ys(bands.optimisticPath)).toEqual([20, 50]);
        expect(ys(bands.pessimisticPath)).toEqual([10, 20]);
    });

    test("accepts a band scale (centres in the band)", () => {
        const band = d3.scaleBand<string>().domain(["A", "B"]).range([0, 100]);
        const bands = createWaterfallConfidenceBands(
            [
                { label: "A", value: 1 },
                { label: "B", value: 1 },
            ],
            { optimistic: [], pessimistic: [] },
            band,
            identity
        );
        expect(vertices(bands.optimisticPath).map(p => p[0])).toEqual([25, 75]);
    });
});

describe("createWaterfallMilestones", () => {
    test("maps milestone types to symbol, colour and size", () => {
        const x = indexX(["A", "B", "C", "D"]);
        const markers = createWaterfallMilestones(
            [
                { label: "A", value: 1, type: "target" },
                { label: "B", value: 2, type: "threshold" },
                { label: "C", value: 3, type: "alert" },
                { label: "D", value: 4, type: "achievement" },
            ],
            x,
            identity
        );
        expect(markers.map(m => m.transform)).toEqual(["translate(0, 1)", "translate(10, 2)", "translate(20, 3)", "translate(30, 4)"]);
        expect(markers.map(m => m.config.fillColor)).toEqual(["#f39c12", "#9b59b6", "#e74c3c", "#27ae60"]);
        expect(markers[0].path).toBe(d3.symbol().type(d3.symbolStar).size(100)()!);
        expect(markers[3].path).toBe(d3.symbol().type(d3.symbolCircle).size(85)()!);
    });

    test("unknown types fall back to target styling", () => {
        const [m] = createWaterfallMilestones([{ label: "A", value: 1, type: "bogus" as any }], () => 0, identity);
        expect(m.config.fillColor).toBe("#f39c12");
    });
});
