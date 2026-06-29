// MintWaterfall Transforms Edge Case Tests
import { transformToWaterfallFormat, sortData, filterData, aggregateData, groupData, normalizeValues, calculatePercentages } from "../src/data/transforms.js";
import { createDataProcessor } from "../src/data/pipeline.js";

describe("transformToWaterfallFormat edge cases", () => {
  test("returns empty array for empty input", () => {
    expect(transformToWaterfallFormat([])).toEqual([]);
  });

  test("passes through already-formatted data", () => {
    const data = [{ label: "X", stacks: [{ value: 100, color: "#fff", label: "" }] }];
    expect(transformToWaterfallFormat(data)).toEqual(data);
  });

  test("handles missing value column", () => {
    const result = transformToWaterfallFormat([{ label: "A" }]);
    expect(result[0].stacks[0].value).toBe(0);
  });

  test("throws on non-array input", () => {
    expect(() => transformToWaterfallFormat(null as any)).toThrow("Data must be an array");
    expect(() => transformToWaterfallFormat("string" as any)).toThrow("Data must be an array");
  });
});

describe("sortData edge cases", () => {
  const dp = createDataProcessor();

  test("throws on empty data per validation", () => {
    const dp = createDataProcessor();
    expect(() => dp.sortData([], "total", "descending")).toThrow("Data array cannot be empty");
  });

  test("handles single item", () => {
    const data = [{ label: "A", stacks: [{ value: 100, color: "#000", label: "" }] }];
    expect(dp.sortData(data, "total")).toEqual(data);
  });

  test("sort descending by total puts highest absolute first", () => {
    const data = [
      { label: "Small", stacks: [{ value: 10, color: "#000", label: "" }] },
      { label: "Big",   stacks: [{ value: 50, color: "#000", label: "" }] },
    ];
    const result = dp.sortData(data, "total", "descending");
    expect(result[0].label).toBe("Big");
  });
});

describe("filterData edge cases", () => {
  test("returns empty when nothing matches", () => {
    const dp = createDataProcessor();
    const data = [{ label: "A", stacks: [{ value: 1, color: "#000", label: "" }] }];
    expect(dp.filterData(data, () => false).length).toBe(0);
  });
});

describe("normalizeValues", () => {
  test("scales values to target max", () => {
    const dp = createDataProcessor();
    const data = [{ label: "A", stacks: [{ value: 10, color: "#000", label: "" }] }];
    const result = dp.normalizeValues(data, 100);
    expect(result[0].stacks[0].value).toBe(100);
  });

  test("handles max value of zero", () => {
    const dp = createDataProcessor();
    const data = [{ label: "A", stacks: [{ value: 0, color: "#000", label: "" }] }];
    const result = dp.normalizeValues(data, 100);
    expect(result[0].stacks[0].value).toBe(0); // unchanged
  });
});

describe("calculatePercentages", () => {
  test("computes percentages correctly", () => {
    const dp = createDataProcessor();
    const data = [{ label: "A", stacks: [{ value: 30, color: "#000", label: "" }] }];
    const result = dp.calculatePercentages(data);
    const stack = result[0].stacks[0] as any;
    expect(stack.percentage).toBe(100);
  });

  test("handles zero total", () => {
    const dp = createDataProcessor();
    const data = [{ label: "A", stacks: [{ value: 0, color: "#000", label: "" }] }];
    const result = dp.calculatePercentages(data);
    const stack = result[0].stacks[0] as any;
    expect(stack.percentage).toBe(0);
  });
});
