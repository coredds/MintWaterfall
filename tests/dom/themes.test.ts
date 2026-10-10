/**
 * Theme and color helpers (src/themes.ts) with the real D3.
 */
import * as d3 from "d3";
import {
    themes,
    applyTheme,
    getThemeColorPalette,
    createSequentialScale,
    createDivergingScale,
    getConditionalColor,
    createWaterfallColorScale,
    interpolateThemeColor,
    getAdvancedBarColor,
} from "../../src/themes.js";

const isColor = (c: string) => d3.color(c) !== null && !/NaN/.test(c);

describe("theme collection", () => {
    test("every theme is complete and its colors parse", () => {
        const names = Object.keys(themes);
        expect(names).toEqual(
            expect.arrayContaining(["default", "dark", "accessible", "colorful", "financial", "professional", "heatmap"])
        );
        for (const name of names) {
            const t = (themes as any)[name];
            for (const key of ["background", "gridColor", "axisColor", "textColor", "totalColor"]) {
                expect(isColor(t[key])).toBe(true);
            }
            expect(t.colors.length).toBeGreaterThan(0);
            expect(t.colors.every(isColor)).toBe(true);
            expect(isColor(t.sequentialScale.interpolator(0.5))).toBe(true);
            expect(isColor(t.divergingScale.interpolator(0.5))).toBe(true);
            expect(Object.values(t.conditionalFormatting).every(c => isColor(c as string))).toBe(true);
        }
    });

    test("applyTheme sets the total color; unknown names fall back to default", () => {
        const chart = { totalColor: jest.fn() };
        expect(applyTheme(chart as any, "dark")).toBe(themes.dark);
        expect(chart.totalColor).toHaveBeenCalledWith(themes.dark.totalColor);
        expect(applyTheme(chart as any, "nope" as any)).toBe(themes.default);
        expect(getThemeColorPalette("colorful")).toBe(themes.colorful.colors);
        expect(getThemeColorPalette("nope" as any)).toBe(themes.default.colors);
    });
});

describe("color scales", () => {
    test("sequential and diverging scales use the theme interpolators", () => {
        const seq = createSequentialScale([0, 10], "heatmap");
        expect(seq(0)).toBe(d3.interpolateYlOrRd(0));
        expect(seq(10)).toBe(d3.interpolateYlOrRd(1));
        const div = createDivergingScale([-5, 0, 5], "financial");
        expect(div(0)).toBe(d3.interpolateRdYlGn(0.5));
        expect(div(-5)).toBe(d3.interpolateRdYlGn(0));
    });

    test("createWaterfallColorScale picks diverging only for mixed-sign data", () => {
        const mixed = createWaterfallColorScale([{ value: -4 }, { value: 2 }]);
        // symmetric domain around zero
        expect(mixed.domain()).toEqual([-4, 0, 4]);
        const positive = createWaterfallColorScale([{ value: 1 }, { value: 3 }]);
        expect(positive.domain()).toEqual([1, 3]);
        // asking for diverging on single-sign data still gives a sequential scale
        expect(createWaterfallColorScale([{ value: 1 }, { value: 3 }], "default", "diverging").domain()).toEqual([1, 3]);
        expect(createWaterfallColorScale([{ value: -4 }, { value: 2 }], "default", "sequential").domain()).toEqual([-4, 2]);
    });

    test("interpolateThemeColor clamps and handles a degenerate domain", () => {
        const i = themes.default.sequentialScale!.interpolator;
        expect(interpolateThemeColor(5, [0, 10])).toBe(i(0.5));
        expect(interpolateThemeColor(-100, [0, 10])).toBe(i(0));
        expect(interpolateThemeColor(100, [0, 10])).toBe(i(1));
        expect(interpolateThemeColor(3, [3, 3])).toBe(i(0.5));
        expect(isColor(interpolateThemeColor(3, [3, 3]))).toBe(true);
    });
});

describe("conditional and advanced bar colors", () => {
    const f = themes.default.conditionalFormatting!;

    test("getConditionalColor: positive / negative / neutral band", () => {
        expect(getConditionalColor(5)).toBe(f.positive);
        expect(getConditionalColor(-5)).toBe(f.negative);
        expect(getConditionalColor(0)).toBe(f.neutral);
        expect(getConditionalColor(3, "default", 5)).toBe(f.neutral);
        expect(getConditionalColor(-3, "default", 5)).toBe(f.neutral);
        expect(getConditionalColor(6, "default", 5)).toBe(f.positive);
        expect(getConditionalColor(-6, "default", 5)).toBe(f.negative);
        expect(getConditionalColor(1, "dark")).toBe(themes.dark.conditionalFormatting!.positive);
    });

    test("getAdvancedBarColor per color mode", () => {
        const data = [{ barTotal: 10 }, { barTotal: -10 }, { value: 0 }];
        expect(getAdvancedBarColor(5, "#000", data, "default", "conditional")).toBe(f.positive);
        expect(getAdvancedBarColor(5, "#000", data, "default", "default")).toBe("#000");
        expect(getAdvancedBarColor(10, "#000", data, "default", "sequential")).toBe(interpolateThemeColor(10, [-10, 10]));
        expect(getAdvancedBarColor(5, "#000", [], "default", "sequential")).toBe("#000");
        expect(getAdvancedBarColor(0, "#000", data, "default", "diverging")).toBe(createDivergingScale([-10, 0, 10])(0));
        expect(getAdvancedBarColor(-1, "#000", [], "default", "diverging")).toBe(f.negative);
        // all-equal data no longer produces an invalid color
        expect(isColor(getAdvancedBarColor(4, "#000", [{ barTotal: 4 }, { barTotal: 4 }], "default", "sequential"))).toBe(true);
    });
});
