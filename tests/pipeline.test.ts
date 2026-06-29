// MintWaterfall Pipeline Tests
// Test createDataProcessor and standalone helpers
import { createDataProcessor, dataProcessor } from "../src/data/pipeline.js";

describe("createDataProcessor", () => {
  test("returns a DataProcessor with all expected methods", () => {
    const dp = createDataProcessor();
    expect(typeof dp.validateData).toBe("function");
    expect(typeof dp.loadData).toBe("function");
    expect(typeof dp.transformToWaterfallFormat).toBe("function");
    expect(typeof dp.aggregateData).toBe("function");
    expect(typeof dp.sortData).toBe("function");
    expect(typeof dp.filterData).toBe("function");
    expect(typeof dp.getDataSummary).toBe("function");
    expect(typeof dp.transformData).toBe("function");
    expect(typeof dp.groupData).toBe("function");
    expect(typeof dp.transformStacks).toBe("function");
    expect(typeof dp.normalizeValues).toBe("function");
    expect(typeof dp.groupByCategory).toBe("function");
    expect(typeof dp.calculatePercentages).toBe("function");
    expect(typeof dp.interpolateData).toBe("function");
    expect(typeof dp.generateSampleData).toBe("function");
    // Advanced operations
    expect(typeof dp.groupBy).toBe("function");
    expect(typeof dp.rollupBy).toBe("function");
    expect(typeof dp.flatRollupBy).toBe("function");
    expect(typeof dp.crossTabulate).toBe("function");
    expect(typeof dp.indexBy).toBe("function");
    expect(typeof dp.aggregateByTime).toBe("function");
  });

  test("default dataProcessor instance exists", () => {
    expect(dataProcessor).toBeDefined();
    expect(typeof dataProcessor.validateData).toBe("function");
  });

  test("validateData throws on non-array", () => {
    const dp = createDataProcessor();
    expect(() => dp.validateData(null as any)).toThrow("Data must be an array");
    expect(() => dp.validateData(undefined as any)).toThrow("Data must be an array");
  });

  test("validateData throws on empty array", () => {
    const dp = createDataProcessor();
    expect(() => dp.validateData([])).toThrow("Data array cannot be empty");
  });

  test("validateData throws on invalid items", () => {
    const dp = createDataProcessor();
    expect(() => dp.validateData([{ label: 123 } as any])).toThrow("must have a string 'label'");
    expect(() => dp.validateData([{ label: "x" } as any])).toThrow("must have an array 'stacks'");
  });
});

describe("standalone helpers", () => {
  test("createVarianceWaterfall computes actual vs budget variance", async () => {
    const { createVarianceWaterfall } = await import("../src/data/pipeline.js");
    const result = createVarianceWaterfall(
      [{ category: "Sales", actual: 150, budget: 100 }],
      "category", "actual", "budget"
    );
    expect(result).toHaveLength(1);
    expect(result[0].label).toBe("Sales");
    expect(result[0].stacks[0].value).toBe(50);
    expect(result[0].stacks[0].color).toBe("#2ecc71");
  });
});
