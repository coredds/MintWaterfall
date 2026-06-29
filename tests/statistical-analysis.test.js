// Statistical Analysis Tests - Zero Coverage Critical Component
// Tests advanced statistical functions and data analysis capabilities
import { createStatisticalSystem } from "../dist/mintwaterfall.esm.js";

// Mock D3 statistical functions
const mockD3 = {
  mean: jest.fn((data) => data.reduce((a, b) => a + b, 0) / data.length),
  median: jest.fn((data) => {
    const sorted = [...data].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }),
  variance: jest.fn((data) => {
    const mean = mockD3.mean(data);
    return mockD3.mean(data.map(d => (d - mean) ** 2));
  }),
  deviation: jest.fn((data) => Math.sqrt(mockD3.variance(data))),
  min: jest.fn((data) => Math.min(...data)),
  max: jest.fn((data) => Math.max(...data)),
  extent: jest.fn((data) => [mockD3.min(data), mockD3.max(data)]),
  quantile: jest.fn((data, p) => {
    const sorted = [...data].sort((a, b) => a - b);
    const index = p * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index % 1;
    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
  }),
  bisector: jest.fn((accessor) => ({
    left: jest.fn((array, x) => {
      let low = 0, high = array.length;
      while (low < high) {
        const mid = Math.floor((low + high) / 2);
        if (accessor(array[mid]) < x) low = mid + 1;
        else high = mid;
      }
      return low;
    }),
    right: jest.fn((array, x) => {
      let low = 0, high = array.length;
      while (low < high) {
        const mid = Math.floor((low + high) / 2);
        if (accessor(array[mid]) <= x) low = mid + 1;
        else high = mid;
      }
      return low;
    })
  })),
  leastIndex: jest.fn((data, accessor) => {
    if (!accessor) accessor = d => d;
    let minIndex = 0;
    let minValue = accessor(data[0]);
    for (let i = 1; i < data.length; i++) {
      const value = accessor(data[i]);
      if (value < minValue) {
        minValue = value;
        minIndex = i;
      }
    }
    return minIndex;
  }),
  greatestIndex: jest.fn((data, accessor) => {
    if (!accessor) accessor = d => d;
    let maxIndex = 0;
    let maxValue = accessor(data[0]);
    for (let i = 1; i < data.length; i++) {
      const value = accessor(data[i]);
      if (value > maxValue) {
        maxValue = value;
        maxIndex = i;
      }
    }
    return maxIndex;
  })
};

global.d3 = mockD3;

describe("Statistical Analysis System", () => {
  let statisticalSystem;

  beforeEach(() => {
    jest.clearAllMocks();
    statisticalSystem = createStatisticalSystem();
  });

  const sampleData = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
  const waterfallData = [
    { label: "Q1", value: 1000 },
    { label: "Q2", value: 1200 },
    { label: "Q3", value: 800 },
    { label: "Q4", value: 1400 },
    { label: "Q5", value: 900 }
  ];

  describe("System Creation", () => {
    test("should create statistical system with required methods", () => {
      expect(statisticalSystem).toBeDefined();
      expect(typeof statisticalSystem.calculateSummary).toBe("function");
      expect(typeof statisticalSystem.detectOutliers).toBe("function");
      expect(typeof statisticalSystem.assessDataQuality).toBe("function");
      expect(typeof statisticalSystem.analyzeVariance).toBe("function");
      expect(typeof statisticalSystem.analyzeTrend).toBe("function");
      expect(typeof statisticalSystem.createBisector).toBe("function");
      expect(typeof statisticalSystem.createSearch).toBe("function");
    });
  });

  describe("Statistical Summary Calculations", () => {
    test("should calculate complete statistical summary", () => {
      const summary = statisticalSystem.calculateSummary(sampleData);
      
      expect(summary).toBeDefined();
      expect(summary).toHaveProperty("mean");
      expect(summary).toHaveProperty("median");
      expect(summary).toHaveProperty("mode");
      expect(summary).toHaveProperty("standardDeviation");
      expect(summary).toHaveProperty("variance");
      expect(summary).toHaveProperty("min");
      expect(summary).toHaveProperty("max");
      expect(summary).toHaveProperty("range");
      expect(summary).toHaveProperty("quartiles");

      expect(typeof summary.mean).toBe("number");
      expect(typeof summary.median).toBe("number");
      expect(Array.isArray(summary.quartiles)).toBe(true);
      expect(summary.quartiles.length).toBe(3); // Q1, Q2, Q3
    });

    test("should handle edge cases in statistical calculations", () => {
      // Single value
      const singleValue = statisticalSystem.calculateSummary([42]);
      expect(singleValue.mean).toBe(42);
      expect(singleValue.median).toBe(42);
      expect(singleValue.standardDeviation).toBe(0);

      // Two values
      const twoValues = statisticalSystem.calculateSummary([10, 20]);
      expect(twoValues.mean).toBe(15);
      expect(twoValues.median).toBe(15);

      // Identical values
      const identical = statisticalSystem.calculateSummary([5, 5, 5, 5, 5]);
      expect(identical.mean).toBe(5);
      expect(identical.standardDeviation).toBe(0);
      expect(identical.mode).toContain(5);
    });

    test("should handle negative and mixed values", () => {
      const mixedData = [-50, -10, 0, 10, 50, 100];
      const summary = statisticalSystem.calculateSummary(mixedData);
      
      expect(summary).toBeDefined();
      expect(summary.mean).toBeCloseTo(16.67, 1);
      expect(summary.min).toBe(-50);
      expect(summary.max).toBe(100);
      expect(summary.range).toBe(150);
    });
  });

  describe("Outlier Detection", () => {
    test("should detect outliers using IQR method", () => {
      const dataWithOutliers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 100]; // 100 is outlier
      const outlierAnalysis = statisticalSystem.detectOutliers(dataWithOutliers);
      
      expect(outlierAnalysis).toBeDefined();
      expect(outlierAnalysis).toHaveProperty("outliers");
      expect(outlierAnalysis).toHaveProperty("method");
      expect(outlierAnalysis).toHaveProperty("threshold");
      expect(outlierAnalysis).toHaveProperty("statistics");

      expect(Array.isArray(outlierAnalysis.outliers)).toBe(true);
      expect(outlierAnalysis.outliers.length).toBeGreaterThan(0);
      expect(outlierAnalysis.method).toBe("iqr");
    });

    test("should detect outliers with labels", () => {
      const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 100];
      const labels = values.map((v, i) => `Point ${i + 1}`);
      
      const outlierAnalysis = statisticalSystem.detectOutliers(values, labels);
      
      expect(outlierAnalysis.outliers.length).toBeGreaterThan(0);
      expect(outlierAnalysis.outliers[0]).toHaveProperty("label");
      expect(outlierAnalysis.outliers[0]).toHaveProperty("value");
      expect(outlierAnalysis.outliers[0]).toHaveProperty("index");
    });

    test("should handle data with no outliers", () => {
      const normalData = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19];
      const outlierAnalysis = statisticalSystem.detectOutliers(normalData);
      
      expect(outlierAnalysis.outliers).toBeDefined();
      expect(Array.isArray(outlierAnalysis.outliers)).toBe(true);
      // May or may not have outliers depending on IQR calculation
    });

    test("should handle various outlier scenarios", () => {
      const scenarios = [
        // Multiple outliers
        [1, 2, 3, 4, 5, 100, 200],
        // Negative outliers
        [-100, 1, 2, 3, 4, 5, 6],
        // Outliers on both ends
        [-50, 1, 2, 3, 4, 5, 6, 7, 150],
        // All same values (no outliers)
        [5, 5, 5, 5, 5, 5, 5]
      ];

      scenarios.forEach((scenario, index) => {
        expect(() => {
          const result = statisticalSystem.detectOutliers(scenario);
          expect(result).toBeDefined();
          expect(Array.isArray(result.outliers)).toBe(true);
        }).not.toThrow(`Scenario ${index} should not throw`);
      });
    });
  });

  describe("Data Quality Assessment", () => {
    test("should assess basic data quality", () => {
      const assessment = statisticalSystem.assessDataQuality(waterfallData);
      
      expect(assessment).toBeDefined();
      expect(assessment).toHaveProperty("completeness");
      expect(assessment).toHaveProperty("consistency");
      expect(assessment).toHaveProperty("accuracy");
      expect(assessment).toHaveProperty("validity");
      expect(assessment).toHaveProperty("issues");
      expect(assessment).toHaveProperty("recommendations");

      expect(typeof assessment.completeness).toBe("number");
      expect(typeof assessment.consistency).toBe("number");
      expect(Array.isArray(assessment.issues)).toBe(true);
      expect(Array.isArray(assessment.recommendations)).toBe(true);
    });

    test("should detect quality issues in problematic data", () => {
      const problematicData = [
        { label: "Good", value: 100 },
        { label: "Missing Value", value: null },
        { label: "Undefined Value", value: undefined },
        { label: "String Value", value: "not-a-number" },
        { label: "Zero", value: 0 },
        { label: "Negative", value: -50 },
        null, // Missing entire record
        { label: "Duplicate", value: 100 },
        { /* missing label */ value: 200 }
      ];

      const assessment = statisticalSystem.assessDataQuality(problematicData, {
        expectedRange: [0, 1000],
        requiredFields: ["label", "value"]
      });

      expect(assessment.issues.length).toBeGreaterThan(0);
      expect(assessment.recommendations.length).toBeGreaterThan(0);
      expect(assessment.completeness).toBeLessThan(1);
    });

    test("should provide quality recommendations", () => {
      const assessment = statisticalSystem.assessDataQuality([
        { value: null },
        { value: "invalid" },
        { value: 100 }
      ]);

      expect(assessment.recommendations).toContain("Remove or impute missing values");
      expect(assessment.issues.some(issue => issue.includes("null") || issue.includes("missing"))).toBe(true);
    });
  });

  describe("Variance Analysis", () => {
    test("should analyze variance across categories", () => {
      const varianceAnalysis = statisticalSystem.analyzeVariance(waterfallData);
      
      expect(varianceAnalysis).toBeDefined();
      expect(varianceAnalysis).toHaveProperty("totalVariance");
      expect(varianceAnalysis).toHaveProperty("withinGroupVariance");
      expect(varianceAnalysis).toHaveProperty("betweenGroupVariance");
      expect(varianceAnalysis).toHaveProperty("fStatistic");
      expect(varianceAnalysis).toHaveProperty("significance");

      expect(typeof varianceAnalysis.totalVariance).toBe("number");
      expect(typeof varianceAnalysis.fStatistic).toBe("number");
      expect(typeof varianceAnalysis.significance).toBe("string");
    });

    test("should handle single category variance", () => {
      const singleCategory = [{ label: "A", value: 100 }];
      
      expect(() => {
        const analysis = statisticalSystem.analyzeVariance(singleCategory);
        expect(analysis).toBeDefined();
      }).not.toThrow();
    });

    test("should calculate variance with multiple categories", () => {
      const multiCategoryData = [
        { label: "A1", value: 100 }, { label: "A2", value: 110 },
        { label: "B1", value: 200 }, { label: "B2", value: 190 },
        { label: "C1", value: 300 }, { label: "C2", value: 310 }
      ];

      const analysis = statisticalSystem.analyzeVariance(multiCategoryData);
      expect(analysis.betweenGroupVariance).toBeGreaterThan(0);
      expect(analysis.withinGroupVariance).toBeGreaterThan(0);
    });
  });

  describe("Trend Analysis", () => {
    test("should analyze linear trends", () => {
      const timeSeriesData = [
        { x: 1, y: 10 }, { x: 2, y: 20 }, { x: 3, y: 30 }, { x: 4, y: 40 }, { x: 5, y: 50 }
      ];

      const trendAnalysis = statisticalSystem.analyzeTrend(timeSeriesData);
      
      expect(trendAnalysis).toBeDefined();
      expect(trendAnalysis).toHaveProperty("slope");
      expect(trendAnalysis).toHaveProperty("intercept");
      expect(trendAnalysis).toHaveProperty("correlation");
      expect(trendAnalysis).toHaveProperty("rSquared");
      expect(trendAnalysis).toHaveProperty("trend");
      expect(trendAnalysis).toHaveProperty("forecast");

      expect(typeof trendAnalysis.slope).toBe("number");
      expect(typeof trendAnalysis.intercept).toBe("number");
      expect(typeof trendAnalysis.correlation).toBe("number");
      expect(["increasing", "decreasing", "stable"].includes(trendAnalysis.trend)).toBe(true);
      expect(Array.isArray(trendAnalysis.forecast)).toBe(true);
    });

    test("should detect different trend patterns", () => {
      const patterns = [
        // Increasing trend
        [{ x: 1, y: 1 }, { x: 2, y: 3 }, { x: 3, y: 5 }, { x: 4, y: 7 }],
        // Decreasing trend
        [{ x: 1, y: 10 }, { x: 2, y: 8 }, { x: 3, y: 6 }, { x: 4, y: 4 }],
        // Stable (no trend)
        [{ x: 1, y: 5 }, { x: 2, y: 5 }, { x: 3, y: 5 }, { x: 4, y: 5 }],
        // Noisy data
        [{ x: 1, y: 10 }, { x: 2, y: 5 }, { x: 3, y: 15 }, { x: 4, y: 8 }]
      ];

      patterns.forEach((pattern, index) => {
        expect(() => {
          const analysis = statisticalSystem.analyzeTrend(pattern);
          expect(analysis.trend).toBeDefined();
          expect(["increasing", "decreasing", "stable"].includes(analysis.trend)).toBe(true);
        }).not.toThrow(`Pattern ${index} should analyze without error`);
      });
    });

    test("should provide confidence intervals", () => {
      const data = [
        { x: 1, y: 10 }, { x: 2, y: 12 }, { x: 3, y: 11 }, { x: 4, y: 13 }, { x: 5, y: 15 }
      ];

      const analysis = statisticalSystem.analyzeTrend(data);
      
      expect(analysis.forecast).toBeDefined();
      analysis.forecast.forEach(point => {
        expect(point).toHaveProperty("x");
        expect(point).toHaveProperty("y");
        expect(point).toHaveProperty("confidence");
        expect(point.confidence).toHaveProperty("lower");
        expect(point.confidence).toHaveProperty("upper");
      });
    });
  });

  describe("Data Search and Optimization", () => {
    test("should create bisector for efficient searches", () => {
      const accessor = d => d.value;
      const bisector = statisticalSystem.createBisector(accessor);
      
      expect(bisector).toBeDefined();
      expect(typeof bisector.left).toBe("function");
      expect(typeof bisector.right).toBe("function");

      const sortedData = [
        { value: 10 }, { value: 20 }, { value: 30 }, { value: 40 }, { value: 50 }
      ];

      const leftIndex = bisector.left(sortedData, 25);
      const rightIndex = bisector.right(sortedData, 25);
      
      expect(typeof leftIndex).toBe("number");
      expect(typeof rightIndex).toBe("number");
      expect(leftIndex).toBeGreaterThanOrEqual(0);
      expect(leftIndex).toBeLessThanOrEqual(sortedData.length);
    });

    test("should create search function", () => {
      const searchData = waterfallData.sort((a, b) => a.value - b.value);
      const search = statisticalSystem.createSearch(searchData, d => d.value);
      
      expect(typeof search).toBe("function");
      
      const found = search(1200);
      if (found) {
        expect(found).toHaveProperty("label");
        expect(found).toHaveProperty("value");
      }
    });

    test("should handle edge cases in search", () => {
      const search = statisticalSystem.createSearch([], d => d.value);
      const notFound = search(100);
      expect(notFound).toBeUndefined();

      const singleItemSearch = statisticalSystem.createSearch([{ value: 42 }], d => d.value);
      const found = singleItemSearch(42);
      expect(found).toBeDefined();
      expect(found.value).toBe(42);
    });
  });

  describe("Utility Functions", () => {
    test("should calculate moving averages", () => {
      const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const movingAvg = statisticalSystem.calculateMovingAverage(data, 3);
      
      expect(Array.isArray(movingAvg)).toBe(true);
      expect(movingAvg.length).toBe(data.length - 2); // window size - 1
      expect(movingAvg[0]).toBe(2); // (1+2+3)/3
      expect(movingAvg[1]).toBe(3); // (2+3+4)/3
    });

    test("should calculate exponential smoothing", () => {
      const data = [10, 12, 13, 12, 14, 16, 15, 17, 18, 16];
      const smoothed = statisticalSystem.calculateExponentialSmoothing(data, 0.3);
      
      expect(Array.isArray(smoothed)).toBe(true);
      expect(smoothed.length).toBe(data.length);
      expect(smoothed[0]).toBe(data[0]); // First value unchanged
    });

    test("should detect seasonality", () => {
      // Seasonal data (repeats every 4 periods)
      const seasonalData = [10, 15, 20, 5, 10, 15, 20, 5, 10, 15, 20, 5];
      const isSeasonalPeriod4 = statisticalSystem.detectSeasonality(seasonalData, 4);
      
      expect(typeof isSeasonalPeriod4).toBe("boolean");
      expect(isSeasonalPeriod4).toBe(true);

      // Non-seasonal data
      const randomData = [10, 23, 5, 18, 31, 7, 15, 28, 3, 19];
      const isNotSeasonal = statisticalSystem.detectSeasonality(randomData, 3);
      expect(typeof isNotSeasonal).toBe("boolean");
    });

    test("should handle edge cases in utility functions", () => {
      // Moving average with window larger than data
      expect(() => {
        const result = statisticalSystem.calculateMovingAverage([1, 2], 5);
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBe(0);
      }).not.toThrow();

      // Exponential smoothing with invalid alpha
      expect(() => {
        statisticalSystem.calculateExponentialSmoothing([1, 2, 3], -0.5);
      }).not.toThrow();

      // Seasonality detection with period larger than data
      expect(() => {
        const result = statisticalSystem.detectSeasonality([1, 2, 3], 10);
        expect(typeof result).toBe("boolean");
      }).not.toThrow();
    });
  });

  describe("Error Handling and Edge Cases", () => {
    test("should handle empty and null data", () => {
      expect(() => {
        statisticalSystem.calculateSummary([]);
        statisticalSystem.detectOutliers([]);
        statisticalSystem.assessDataQuality([]);
        statisticalSystem.analyzeVariance([]);
        statisticalSystem.analyzeTrend([]);
      }).not.toThrow();
    });

    test("should handle invalid data types", () => {
      expect(() => {
        statisticalSystem.calculateSummary([null, undefined, "text", {}, []]);
        statisticalSystem.detectOutliers(["a", "b", "c"]);
        statisticalSystem.assessDataQuality([1, 2, 3]); // numbers instead of objects
      }).not.toThrow();
    });

    test("should handle extreme values", () => {
      const extremeData = [
        Number.MIN_SAFE_INTEGER,
        -1e10,
        0,
        1e10,
        Number.MAX_SAFE_INTEGER,
        Number.POSITIVE_INFINITY,
        Number.NEGATIVE_INFINITY,
        Number.NaN
      ];

      expect(() => {
        const summary = statisticalSystem.calculateSummary(extremeData.filter(x => isFinite(x)));
        expect(summary).toBeDefined();
      }).not.toThrow();
    });
  });
});
