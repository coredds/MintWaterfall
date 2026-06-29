// MintWaterfall Lifecycle Tests
// Test prepareData — cumulative totals, total bar, edge cases
import { prepareData } from "../src/chart/lifecycle.js";
import { ChartConfig, ChartData, ProcessedData } from "../src/chart/config.js";

// Minimal config for testing
function makeConfig(overrides: Partial<ChartConfig> = {}): ChartConfig {
  return {
    width: 800, height: 400,
    margin: { top: 60, right: 80, bottom: 60, left: 80 },
    showTotal: false,
    totalLabel: "Total",
    totalColor: "#95A5A6",
    stacked: false,
    barPadding: 0.05,
    duration: 750,
    ease: (t: number) => t,
    formatNumber: (n: number) => String(n),
    theme: null,
    enableBrush: false,
    brushOptions: {},
    staggeredAnimations: false,
    staggerDelay: 100,
    scaleType: "auto",
    advancedColorConfig: { enabled: false, scaleType: "auto", themeName: "default", neutralThreshold: 0 },
    colorMode: "conditional",
    confidenceBandConfig: { enabled: false, opacity: 0.3, showTrendLines: true },
    milestoneConfig: { enabled: false, milestones: [] },
    showTrendLine: false,
    trendLineColor: "#e74c3c", trendLineWidth: 2, trendLineStyle: "solid",
    trendLineOpacity: 0.8, trendLineType: "linear", trendLineWindow: 3, trendLineDegree: 2,
    enableAccessibility: true,
    enableTooltips: false, tooltipConfig: {},
    enableExport: true, exportConfig: {},
    enableZoom: false, zoomConfig: {},
    breakdownConfig: null, formattingRules: new Map(),
    enablePerformanceOptimization: false, performanceDashboard: false, virtualizationThreshold: 10000,
    ...overrides,
  };
}

describe("prepareData", () => {
  test("calculates cumulative totals for positive values", () => {
    const data: ChartData[] = [
      { label: "A", stacks: [{ value: 100, color: "#000" }] },
      { label: "B", stacks: [{ value: 50,  color: "#000" }] },
      { label: "C", stacks: [{ value: 30,  color: "#000" }] },
    ];
    const result = prepareData(data, makeConfig());

    expect(result).toHaveLength(3);
    expect(result[0].cumulativeTotal).toBe(100);
    expect(result[0].prevCumulativeTotal).toBe(0);
    expect(result[1].cumulativeTotal).toBe(150);
    expect(result[1].prevCumulativeTotal).toBe(100);
    expect(result[2].cumulativeTotal).toBe(180);
    expect(result[2].prevCumulativeTotal).toBe(150);
  });

  test("handles negative values correctly", () => {
    const data: ChartData[] = [
      { label: "Start",   stacks: [{ value: 500, color: "#000" }] },
      { label: "Expense", stacks: [{ value: -200, color: "#000" }] },
      { label: "Refund",  stacks: [{ value: -50, color: "#000" }] },
    ];
    const result = prepareData(data, makeConfig());

    expect(result[0].cumulativeTotal).toBe(500);
    expect(result[1].cumulativeTotal).toBe(300);
    expect(result[2].cumulativeTotal).toBe(250);
  });

  test("stacks multiple values per bar correctly", () => {
    const data: ChartData[] = [
      { label: "Q1", stacks: [
        { value: 200, color: "#000" },
        { value: -50, color: "#000" },
        { value: 100, color: "#000" },
      ]},
    ];
    const result = prepareData(data, makeConfig());

    expect(result[0].barTotal).toBe(250);
    expect(result[0].cumulativeTotal).toBe(250);
  });

  test("appends total bar when showTotal is enabled", () => {
    const data: ChartData[] = [
      { label: "A", stacks: [{ value: 100, color: "#000" }] },
      { label: "B", stacks: [{ value: 50,  color: "#000" }] },
    ];
    const result = prepareData(data, makeConfig({
      showTotal: true,
      totalLabel: "Grand Total",
      totalColor: "#ff0000",
    }));

    expect(result).toHaveLength(3);
    const total = result[2];
    expect(total.label).toBe("Grand Total");
    expect(total.barTotal).toBe(150);
    expect(total.cumulativeTotal).toBe(150);
    expect(total.prevCumulativeTotal).toBe(0);
    expect(total.stacks[0].value).toBe(150);
    expect(total.stacks[0].color).toBe("#ff0000");
  });

  test("does not append total bar when showTotal is false", () => {
    const data: ChartData[] = [
      { label: "A", stacks: [{ value: 100, color: "#000" }] },
    ];
    const config = makeConfig({ showTotal: false });
    const result = prepareData(data, config);
    expect(result).toHaveLength(1);
  });

  test("handles empty data array", () => {
    const result = prepareData([], makeConfig());
    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  test("does not add total bar to empty data even if showTotal is true", () => {
    const result = prepareData([], makeConfig({ showTotal: true }));
    expect(result).toHaveLength(0);
  });

  test("preserves original label and stacks on each item", () => {
    const data: ChartData[] = [
      { label: "Foo", stacks: [{ value: 42, color: "#abc", label: "Bar" }] },
    ];
    const result = prepareData(data, makeConfig());
    expect(result[0].label).toBe("Foo");
    expect(result[0].stacks).toEqual(data[0].stacks);
  });

  test("all zero values produce correct cumulative chain", () => {
    const data: ChartData[] = [
      { label: "A", stacks: [{ value: 0, color: "#000" }] },
      { label: "B", stacks: [{ value: 0, color: "#000" }] },
      { label: "C", stacks: [{ value: 0, color: "#000" }] },
    ];
    const result = prepareData(data, makeConfig());
    expect(result[0].cumulativeTotal).toBe(0);
    expect(result[1].cumulativeTotal).toBe(0);
    expect(result[2].cumulativeTotal).toBe(0);
  });

  test("does not mutate input data", () => {
    const data: ChartData[] = [
      { label: "A", stacks: [{ value: 100, color: "#000" }] },
    ];
    const snapshot = JSON.stringify(data);
    prepareData(data, makeConfig());
    expect(JSON.stringify(data)).toBe(snapshot);
  });

  test("handles single item correctly", () => {
    const data: ChartData[] = [
      { label: "Only", stacks: [{ value: 999, color: "#000" }] },
    ];
    const result = prepareData(data, makeConfig());
    expect(result).toHaveLength(1);
    expect(result[0].barTotal).toBe(999);
    expect(result[0].cumulativeTotal).toBe(999);
    expect(result[0].prevCumulativeTotal).toBe(0);
  });

  test("total bar with negative cumulative shows correct values", () => {
    const data: ChartData[] = [
      { label: "A", stacks: [{ value: -100, color: "#000" }] },
      { label: "B", stacks: [{ value: -50,  color: "#000" }] },
    ];
    const result = prepareData(data, makeConfig({ showTotal: true }));
    const total = result[2];
    expect(total.barTotal).toBe(-150);
    expect(total.cumulativeTotal).toBe(-150);
    expect(total.prevCumulativeTotal).toBe(0);
  });
});
