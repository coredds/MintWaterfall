// Advanced Data Processing Tests - Zero Coverage Critical Component  
// Tests complex data operations, transformations, and D3.js integration
import { createAdvancedDataProcessor } from "../dist/mintwaterfall.esm.js";

// Mock D3 functions that might be used in advanced data processing
const mockD3 = {
  group: jest.fn((data, accessor) => {
    const grouped = new Map();
    data.forEach(item => {
      const key = accessor(item);
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key).push(item);
    });
    return grouped;
  }),
  rollup: jest.fn((data, reducer, accessor) => {
    const groups = mockD3.group(data, accessor);
    const result = new Map();
    groups.forEach((values, key) => {
      result.set(key, reducer(values));
    });
    return result;
  }),
  flatRollup: jest.fn((data, reducer, ...accessors) => {
    return Array.from(mockD3.rollup(data, reducer, accessors[0]));
  }),
  cross: jest.fn((a, b, reducer) => {
    const result = [];
    a.forEach(itemA => {
      b.forEach(itemB => {
        result.push(reducer ? reducer(itemA, itemB) : [itemA, itemB]);
      });
    });
    return result;
  }),
  index: jest.fn((data, accessor) => {
    const indexed = new Map();
    data.forEach(item => {
      indexed.set(accessor(item), item);
    });
    return indexed;
  }),
  sum: jest.fn((data, accessor) => {
    return data.reduce((sum, item) => sum + (accessor ? accessor(item) : item), 0);
  }),
  mean: jest.fn((data, accessor) => {
    const values = accessor ? data.map(accessor) : data;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }),
  bisector: jest.fn((accessor) => ({
    left: (array, x) => {
      let low = 0, high = array.length;
      while (low < high) {
        const mid = Math.floor((low + high) / 2);
        if (accessor(array[mid]) < x) low = mid + 1;
        else high = mid;
      }
      return low;
    },
    right: (array, x) => {
      let low = 0, high = array.length;
      while (low < high) {
        const mid = Math.floor((low + high) / 2);
        if (accessor(array[mid]) <= x) low = mid + 1;
        else high = mid;
      }
      return low;
    }
  }))
};

global.d3 = mockD3;

describe("Advanced Data Processing System", () => {
  let advancedProcessor;

  beforeEach(() => {
    jest.clearAllMocks();
    advancedProcessor = createAdvancedDataProcessor();
  });

  const sampleData = [
    { label: "Q1", stacks: [{ value: 100, color: "#4F81BD" }], category: "baseline", timestamp: "2024-01" },
    { label: "Q2", stacks: [{ value: 150, color: "#9CBB58" }], category: "revenue", timestamp: "2024-02" },
    { label: "Q3", stacks: [{ value: -50, color: "#F79646" }], category: "expenses", timestamp: "2024-03" },
    { label: "Q4", stacks: [{ value: 200, color: "#8064A2" }], category: "adjustments", timestamp: "2024-04" }
  ];

  describe("System Creation", () => {
    test("should create advanced data processor with required methods", () => {
      expect(advancedProcessor).toBeDefined();
      expect(typeof advancedProcessor.groupBy).toBe("function");
      expect(typeof advancedProcessor.rollupBy).toBe("function");
      expect(typeof advancedProcessor.flatRollupBy).toBe("function");
      expect(typeof advancedProcessor.crossTabulate).toBe("function");
      expect(typeof advancedProcessor.indexBy).toBe("function");
      expect(typeof advancedProcessor.aggregateByTime).toBe("function");
      expect(typeof advancedProcessor.createMultiDimensionalWaterfall).toBe("function");
    });
  });

  describe("Data Grouping Operations", () => {
    test("should group data by category", () => {
      const grouped = advancedProcessor.groupBy(sampleData, d => d.category);
      
      expect(grouped).toBeDefined();
      expect(grouped.size).toBeGreaterThan(0);
      // Check that the grouping actually worked
      expect(grouped.has("baseline")).toBe(true);
      expect(grouped.has("revenue")).toBe(true);
    });

    test("should handle empty data for grouping", () => {
      expect(() => {
        const grouped = advancedProcessor.groupBy([], d => d.category);
        expect(grouped.size).toBe(0);
      }).not.toThrow();
    });

    test("should handle null accessor for grouping", () => {
      expect(() => {
        advancedProcessor.groupBy(sampleData, null);
      }).not.toThrow();
    });

    test("should group by multiple criteria", () => {
      const result = advancedProcessor.groupBy(sampleData, d => `${d.category}-${d.timestamp.slice(0, 4)}`);
      expect(result).toBeDefined();
    });
  });

  describe("Data Rollup Operations", () => {
    test("should rollup data with sum reducer", () => {
      const rolled = advancedProcessor.rollupBy(
        sampleData, 
        values => values.reduce((sum, v) => sum + v.stacks[0].value, 0),
        d => d.category
      );
      
      expect(rolled).toBeDefined();
      // Check that the rollup actually worked
      expect(rolled.size).toBeGreaterThan(0);
    });

    test("should handle complex rollup operations", () => {
      const rolled = advancedProcessor.rollupBy(
        sampleData,
        values => ({
          count: values.length,
          total: values.reduce((sum, v) => sum + v.stacks[0].value, 0),
          average: values.reduce((sum, v) => sum + v.stacks[0].value, 0) / values.length
        }),
        d => d.category
      );

      expect(rolled).toBeDefined();
    });

    test("should flatRollup data", () => {
      const flatRolled = advancedProcessor.flatRollupBy(
        sampleData,
        values => values.length,
        d => d.category
      );

      expect(Array.isArray(flatRolled)).toBe(true);
      // Check that the flat rollup actually worked
      expect(flatRolled.length).toBeGreaterThan(0);
    });
  });

  describe("Cross Tabulation", () => {
    test("should cross tabulate data dimensions", () => {
      const categories = ["revenue", "expenses"];
      const quarters = ["Q1", "Q2", "Q3", "Q4"];

      const crossTab = advancedProcessor.crossTabulate(
        categories,
        quarters,
        (cat, quarter) => ({
          category: cat,
          quarter: quarter,
          key: `${cat}-${quarter}`
        })
      );

      expect(crossTab).toBeDefined();
      expect(Array.isArray(crossTab)).toBe(true);
      // Check that the cross tabulation actually worked
      expect(crossTab.length).toBeGreaterThan(0);
    });

    test("should handle empty arrays for cross tabulation", () => {
      const result = advancedProcessor.crossTabulate([], [], (a, b) => [a, b]);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });

  describe("Data Indexing", () => {
    test("should index data by key", () => {
      const indexed = advancedProcessor.indexBy(sampleData, d => d.label);
      
      expect(indexed).toBeDefined();
      // Check that the indexing actually worked
      expect(indexed.size).toBeGreaterThan(0);
      expect(indexed.has("Q1")).toBe(true);
    });

    test("should handle duplicate keys in indexing", () => {
      const duplicateData = [
        ...sampleData,
        { label: "Q1", stacks: [{ value: 75, color: "#FF0000" }], category: "duplicate" }
      ];

      expect(() => {
        const indexed = advancedProcessor.indexBy(duplicateData, d => d.label);
        expect(indexed).toBeDefined();
      }).not.toThrow();
    });
  });

  describe("Time-based Aggregation", () => {
    test("should aggregate data by time periods", () => {
      const timeData = sampleData.map(item => ({
        ...item,
        date: new Date(`${item.timestamp}-01`)
      }));

      const aggregated = advancedProcessor.aggregateByTime(
        timeData,
        d => d.date,
        "month",
        values => values.reduce((sum, v) => sum + v.stacks[0].value, 0)
      );

      expect(aggregated).toBeDefined();
      expect(Array.isArray(aggregated)).toBe(true);
    });

    test("should handle different time granularities", () => {
      const timeData = sampleData.map((item, index) => ({
        ...item,
        date: new Date(2024, index, 1)
      }));

      ["day", "week", "month", "year"].forEach(granularity => {
        expect(() => {
          advancedProcessor.aggregateByTime(
            timeData,
            d => d.date,
            granularity,
            values => values.length
          );
        }).not.toThrow();
      });
    });
  });

  describe("Multi-dimensional Waterfall Creation", () => {
    test("should create multi-dimensional waterfall", () => {
      const multiData = {
        "Region A": sampleData.slice(0, 2),
        "Region B": sampleData.slice(2, 4)
      };

      const multiWaterfall = advancedProcessor.createMultiDimensionalWaterfall(
        multiData,
        {
          aggregationMethod: "sum",
          includeRegionalTotals: true,
          includeGrandTotal: true
        }
      );

      expect(multiWaterfall).toBeDefined();
      expect(Array.isArray(multiWaterfall)).toBe(true);
    });

    test("should handle empty dimensions", () => {
      expect(() => {
        const result = advancedProcessor.createMultiDimensionalWaterfall({}, {});
        expect(Array.isArray(result)).toBe(true);
      }).not.toThrow();
    });

    test("should apply different aggregation methods", () => {
      const multiData = { "Test": sampleData };

      ["sum", "average", "count", "max", "min"].forEach(method => {
        expect(() => {
          advancedProcessor.createMultiDimensionalWaterfall(multiData, {
            aggregationMethod: method
          });
        }).not.toThrow();
      });
    });
  });

  describe("Period-based Aggregation", () => {
    test("should aggregate waterfall by period", () => {
      const periodData = sampleData.map(item => ({
        ...item,
        period: item.timestamp
      }));

      const periodAggregated = advancedProcessor.aggregateWaterfallByPeriod(
        periodData,
        "period",
        {
          includeMovingAverage: true,
          movingAverageWindow: 3,
          calculateGrowthRates: true
        }
      );

      expect(periodAggregated).toBeDefined();
      expect(Array.isArray(periodAggregated)).toBe(true);
    });

    test("should include calculated metrics", () => {
      const result = advancedProcessor.aggregateWaterfallByPeriod(
        sampleData,
        "timestamp",
        {
          includeMovingAverage: true,
          calculateGrowthRates: true,
          includeVariance: true
        }
      );

      expect(result).toBeDefined();
      // Should include additional calculated fields
    });
  });

  describe("Breakdown Waterfall Creation", () => {
    test("should create breakdown waterfall", () => {
      const breakdownData = sampleData.map(item => ({
        ...item,
        breakdowns: [
          { label: `${item.label} - Part A`, value: item.stacks[0].value * 0.6 },
          { label: `${item.label} - Part B`, value: item.stacks[0].value * 0.4 }
        ]
      }));

      const breakdown = advancedProcessor.createBreakdownWaterfall(
        breakdownData,
        "breakdowns",
        {
          maintainOriginalStructure: true,
          includeSubtotals: true,
          colorByBreakdown: true
        }
      );

      expect(breakdown).toBeDefined();
      expect(Array.isArray(breakdown)).toBe(true);
    });

    test("should handle missing breakdown data", () => {
      const incompleteData = sampleData.map(item => ({ ...item })); // No breakdowns

      expect(() => {
        const result = advancedProcessor.createBreakdownWaterfall(
          incompleteData,
          "breakdowns",
          {}
        );
        expect(Array.isArray(result)).toBe(true);
      }).not.toThrow();
    });
  });

  describe("Error Handling", () => {
    test("should handle null/undefined data", () => {
      expect(() => advancedProcessor.groupBy(null, d => d.category)).not.toThrow();
      expect(() => advancedProcessor.rollupBy(undefined, x => x, d => d.key)).not.toThrow();
      expect(() => advancedProcessor.crossTabulate(null, [], (a, b) => [a, b])).not.toThrow();
    });

    test("should handle invalid accessors", () => {
      expect(() => advancedProcessor.groupBy(sampleData, null)).not.toThrow();
      expect(() => advancedProcessor.indexBy(sampleData, undefined)).not.toThrow();
    });

    test("should handle malformed data structures", () => {
      const malformedData = [
        { label: "Good", stacks: [{ value: 100, color: "#000" }] },
        { label: "Bad", stacks: null },
        { label: "Missing", /* no stacks */ },
        null,
        undefined
      ];

      expect(() => {
        advancedProcessor.groupBy(malformedData, d => d?.category || "unknown");
        advancedProcessor.rollupBy(malformedData, values => values.length, d => d?.label || "unknown");
      }).not.toThrow();
    });

    test("should handle empty results gracefully", () => {
      expect(() => {
        const empty1 = advancedProcessor.groupBy([], d => d.category);
        const empty2 = advancedProcessor.crossTabulate([], [], (a, b) => [a, b]);
        const empty3 = advancedProcessor.createMultiDimensionalWaterfall({}, {});
        
        expect(empty1.size).toBe(0);
        expect(empty2.length).toBe(0);
        expect(empty3.length).toBe(0);
      }).not.toThrow();
    });
  });

  describe("Performance and Edge Cases", () => {
    test("should handle large datasets efficiently", () => {
      const largeData = Array.from({ length: 1000 }, (_, i) => ({
        label: `Item ${i}`,
        stacks: [{ value: Math.random() * 100 - 50, color: "#000" }],
        category: `Category ${i % 10}`,
        timestamp: `2024-${String((i % 12) + 1).padStart(2, "0")}`
      }));

      expect(() => {
        advancedProcessor.groupBy(largeData, d => d.category);
        advancedProcessor.rollupBy(largeData, values => values.length, d => d.category);
        advancedProcessor.aggregateByTime(largeData, d => new Date(d.timestamp + "-01"), "month", v => v.length);
      }).not.toThrow();
    });

    test("should handle complex nested data", () => {
      const nestedData = sampleData.map(item => ({
        ...item,
        nested: {
          deep: {
            value: item.stacks[0].value,
            metadata: {
              processed: true,
              source: "test"
            }
          }
        }
      }));

      expect(() => {
        advancedProcessor.groupBy(nestedData, d => d.nested?.deep?.metadata?.source);
        advancedProcessor.rollupBy(nestedData, values => values.reduce((s, v) => s + v.nested.deep.value, 0), d => d.category);
      }).not.toThrow();
    });

    test("should maintain data integrity through transformations", () => {
      const originalSum = sampleData.reduce((sum, item) => sum + item.stacks[0].value, 0);
      
      const grouped = advancedProcessor.groupBy(sampleData, d => d.category);
      let transformedSum = 0;
      
      grouped.forEach(items => {
        transformedSum += items.reduce((sum, item) => sum + item.stacks[0].value, 0);
      });

      expect(transformedSum).toBe(originalSum);
    });
  });
});
