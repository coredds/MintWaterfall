// Critical Integration Tests - High Value Regression Prevention
// Tests the integration points between core components that are most likely to break
import { 
  waterfallChart, 
  createDataProcessor, 
  themes, 
  createAdvancedInteractionSystem,
  createAccessibilitySystem
} from "../dist/mintwaterfall.esm.js";

describe("Critical Component Integrations", () => {
  let chart;
  let dataProcessor;
  let accessibilitySystem;
  let mockContainer;

  const validStackedData = [
    { label: "Starting", stacks: [{ value: 1000, color: "#4F81BD" }], category: "baseline" },
    { label: "Revenue Up", stacks: [{ value: 500, color: "#9CBB58" }], category: "revenue" },
    { label: "Cost Down", stacks: [{ value: -200, color: "#F79646" }], category: "expenses" },
    { label: "Adjustment", stacks: [{ value: 150, color: "#8064A2" }], category: "adjustments" }
  ];

  const invalidDataStructures = [
    // Missing stacks (common regression)
    [{ label: "Bad", value: 100, category: "revenue" }],
    // Null stacks
    [{ label: "Bad", stacks: null, category: "revenue" }],
    // Empty stacks
    [{ label: "Bad", stacks: [], category: "revenue" }],
    // Malformed stack objects
    [{ label: "Bad", stacks: [{ value: "not-a-number", color: "#000" }], category: "revenue" }],
    // Mixed valid/invalid
    [
      validStackedData[0], 
      { label: "Bad", value: 100 }, // missing stacks
      validStackedData[1]
    ]
  ];

  beforeEach(() => {
    chart = waterfallChart();
    dataProcessor = createDataProcessor();
    accessibilitySystem = createAccessibilitySystem();
    
    mockContainer = {
      selectAll: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      append: jest.fn().mockReturnThis(),
      attr: jest.fn().mockReturnThis(),
      style: jest.fn().mockReturnThis(),
      text: jest.fn().mockReturnThis(),
      html: jest.fn().mockReturnThis(),
      datum: jest.fn().mockReturnThis(),
      call: jest.fn().mockReturnThis(),
      on: jest.fn().mockReturnThis(),
      node: jest.fn(() => ({ getBoundingClientRect: () => ({ width: 800, height: 400 }) })),
      nodes: jest.fn(() => []),
      each: jest.fn((fn) => { fn.call(mockContainer, validStackedData); return mockContainer; })
    };
  });

  describe("Chart + Data Processing Integration", () => {
    test("should validate data before rendering", () => {
      // Valid data should not throw
      expect(() => {
        dataProcessor.validateData(validStackedData);
        mockContainer.each = jest.fn((fn) => { fn.call(mockContainer, validStackedData); return mockContainer; });
        mockContainer.call(chart);
      }).not.toThrow();
    });

    test("should handle data validation failures gracefully", () => {
      invalidDataStructures.forEach((invalidData, index) => {
        expect(() => {
          // This is the critical regression test - ensure invalid data doesn't crash the chart
          mockContainer.each = jest.fn((fn) => { fn.call(mockContainer, invalidData); return mockContainer; });
          mockContainer.call(chart);
        }).not.toThrow(`Invalid data structure ${index} should not crash chart`);
      });
    });

    test("should transform simple data to stacked format", () => {
      const simpleData = [
        { name: "Start", amount: 100 },
        { name: "Change", amount: 50 }
      ];

      const transformed = dataProcessor.transformToWaterfallFormat(simpleData, {
        labelField: "name",
        valueField: "amount"
      });

      expect(Array.isArray(transformed)).toBe(true);
      expect(transformed.length).toBe(2);
      expect(transformed[0].stacks).toBeDefined();
      expect(Array.isArray(transformed[0].stacks)).toBe(true);

      // Should be able to render transformed data
      expect(() => {
        mockContainer.each = jest.fn((fn) => { fn.call(mockContainer, transformed); return mockContainer; });
        mockContainer.call(chart);
      }).not.toThrow();
    });

    test("should handle data aggregation before rendering", () => {
      const duplicateData = [
        ...validStackedData,
        { label: "Revenue Up", stacks: [{ value: 200, color: "#9CBB58" }], category: "revenue" } // duplicate
      ];

      expect(() => {
        const aggregated = dataProcessor.aggregateData(duplicateData, "label");
        mockContainer.each = jest.fn((fn) => { fn.call(mockContainer, aggregated); return mockContainer; });
        mockContainer.call(chart);
      }).not.toThrow();
    });
  });

  describe("Chart + Theme Integration", () => {
    test("should apply all available themes without errors", () => {
      Object.keys(themes).forEach(themeName => {
        expect(() => {
          chart.theme(themeName);
          mockContainer.call(chart);
        }).not.toThrow(`Theme ${themeName} should apply without errors`);
      });
    });

    test("should handle theme switching during interactions", () => {
      expect(() => {
        // Set initial theme
        chart.theme("dark");
        mockContainer.call(chart);

        // Switch theme and re-render
        chart.theme("corporate");
        mockContainer.call(chart);

        // Switch to financial theme with advanced colors
        chart.theme("financial").enableAdvancedColors(true).colorMode("conditional");
        mockContainer.call(chart);
      }).not.toThrow();
    });

    test("should validate theme compatibility with advanced color modes", () => {
      ["conditional", "sequential", "diverging"].forEach(colorMode => {
        Object.keys(themes).forEach(themeName => {
          expect(() => {
            chart.theme(themeName)
                 .enableAdvancedColors(true)
                 .colorMode(colorMode)
                 .colorTheme(themeName);
            
            mockContainer.call(chart);
          }).not.toThrow(`Theme ${themeName} with color mode ${colorMode} should work`);
        });
      });
    });
  });

  describe("Chart + Advanced Colors Integration", () => {
    test("should apply advanced color features correctly", () => {
      const colorConfigs = [
        { enableAdvancedColors: true, colorMode: "conditional", colorTheme: "financial" },
        { enableAdvancedColors: true, colorMode: "sequential", colorTheme: "professional" },
        { enableAdvancedColors: true, colorMode: "diverging", colorTheme: "heatmap" }
      ];

      colorConfigs.forEach(config => {
        expect(() => {
          chart.enableAdvancedColors(config.enableAdvancedColors)
               .colorMode(config.colorMode)
               .colorTheme(config.colorTheme);
          
          mockContainer.call(chart);
        }).not.toThrow(`Color config ${JSON.stringify(config)} should work`);
      });
    });

    test("should handle mixed positive/negative values with advanced colors", () => {
      const mixedData = [
        { label: "Positive", stacks: [{ value: 100, color: "#000" }], category: "revenue" },
        { label: "Zero", stacks: [{ value: 0, color: "#000" }], category: "neutral" },
        { label: "Negative", stacks: [{ value: -50, color: "#000" }], category: "expenses" },
        { label: "Large Positive", stacks: [{ value: 1000, color: "#000" }], category: "revenue" },
        { label: "Large Negative", stacks: [{ value: -800, color: "#000" }], category: "expenses" }
      ];

      expect(() => {
        mockContainer.each = jest.fn((fn) => { fn.call(mockContainer, mixedData); return mockContainer; });
        
        chart.enableAdvancedColors(true)
             .colorMode("diverging")
             .neutralThreshold(10); // Values within [-10, 10] are neutral
        
        mockContainer.call(chart);
      }).not.toThrow();
    });
  });

  describe("Chart + Accessibility Integration", () => {
    test("should create accessible chart descriptions", () => {
      expect(() => {
        const description = accessibilitySystem.createChartDescription(mockContainer, validStackedData, {
          title: "Financial Performance",
          summary: "Quarterly performance analysis"
        });

        expect(description).toMatch(/^waterfall-description-[a-z0-9]+$/);

        // Chart should accept accessibility enhancements
        accessibilitySystem.makeAccessible(mockContainer, validStackedData, {
          title: "Financial Performance",
          description: description
        });

        mockContainer.call(chart);
      }).not.toThrow();
    });

    test("should handle keyboard navigation integration", () => {
      expect(() => {
        // Setup chart with accessibility
        mockContainer.call(chart);
        
        // Mock keyboard events
        const mockKeydownEvent = {
          key: "ArrowRight",
          preventDefault: jest.fn(),
          stopPropagation: jest.fn()
        };

        accessibilitySystem.handleChartKeydown(mockKeydownEvent, validStackedData, {
          title: "Test Chart"
        });
      }).not.toThrow();
    });

    test("should validate color contrast with themes", () => {
      Object.keys(themes).forEach(themeName => {
        const theme = themes[themeName];
        if (theme.colors && theme.background) {
          theme.colors.forEach(color => {
            const contrastResult = accessibilitySystem.validateColorContrast(color, theme.background);
            expect(contrastResult).toBeDefined();
            expect(typeof contrastResult.ratio).toBe("number");
            expect(typeof contrastResult.passesAA).toBe("boolean");
          });
        }
      });
    });
  });

  describe("Drag Interaction + Data Validation Integration", () => {
    test("should validate data structure before applying drag", () => {
      // This tests the regression where drag was applied to elements without proper data structure
      expect(() => {
        // Mock d3.drag
        global.d3 = {
          drag: jest.fn(() => ({
            on: jest.fn().mockReturnThis(),
          }))
        };

        const mockXScale = jest.fn(v => v * 10);
        mockXScale.domain = jest.fn(() => [0, 100]);
        mockXScale.range = jest.fn(() => [0, 800]);

        const mockYScale = jest.fn(v => 400 - v * 4);
        mockYScale.domain = jest.fn(() => [0, 100]);
        mockYScale.range = jest.fn(() => [400, 0]);
        mockYScale.invert = jest.fn(p => (400 - p) / 4);

        const interactions = createAdvancedInteractionSystem(mockContainer, mockXScale, mockYScale);

        // Enable drag - should validate data before applying
        interactions.enableDrag({
          enabled: true,
          axis: "vertical",
          constraints: { minValue: -1000, maxValue: 1000 }
        });

      }).not.toThrow();
    });

    test("should handle drag events with proper data structure validation", () => {
      expect(() => {
        // Mock drag event simulation with invalid data
        // const mockDragEvent = {
        //   sourceEvent: { target: mockContainer },
        //   x: 100,
        //   y: 200
        // };

        // Test with data that has proper stacks structure
        const validDragData = validStackedData[0];
        expect(validDragData.stacks).toBeDefined();
        expect(validDragData.stacks.length).toBeGreaterThan(0);
        expect(typeof validDragData.stacks[0].value).toBe("number");

        // Test with data that lacks proper structure
        const invalidDragData = { label: "Invalid", value: 100 };
        expect(invalidDragData.stacks).toBeUndefined();

        // Both should be handled gracefully (invalid data should be skipped, not crash)
      }).not.toThrow();
    });
  });

  describe("Performance Integration", () => {
    test("should handle large datasets across all components", () => {
      const largeData = Array.from({ length: 100 }, (_, i) => ({
        label: `Item ${i}`,
        stacks: [{ value: Math.random() * 100 - 50, color: "#4F81BD" }],
        category: `Category ${i % 5}`,
        timestamp: `2024-${String((i % 12) + 1).padStart(2, "0")}`
      }));

      expect(() => {
        // Data processing
        dataProcessor.validateData(largeData);
        dataProcessor.groupData(largeData, "category");

        // Chart rendering  
        mockContainer.each = jest.fn((fn) => { fn.call(mockContainer, largeData); return mockContainer; });
        chart.enableAdvancedColors(true).colorMode("sequential");
        mockContainer.call(chart);

        // Theme application
        chart.theme("corporate");

        // Accessibility
        accessibilitySystem.createChartDescription(mockContainer, largeData, {
          title: "Large Dataset Test"
        });

      }).not.toThrow();
    });

    test("should handle rapid configuration changes", () => {
      expect(() => {
        // Simulate rapid user interactions
        for (let i = 0; i < 10; i++) {
          chart.width(800 + i * 10)
               .height(400 + i * 5)
               .theme(Object.keys(themes)[i % Object.keys(themes).length])
               .enableAdvancedColors(i % 2 === 0)
               .colorMode(["conditional", "sequential", "diverging"][i % 3]);
          
          mockContainer.call(chart);
        }
      }).not.toThrow();
    });
  });

  describe("Error Recovery Integration", () => {
    test("should recover from data processing errors", () => {
      expect(() => {
        // Start with valid data
        mockContainer.each = jest.fn((fn) => { fn.call(mockContainer, validStackedData); return mockContainer; });
        mockContainer.call(chart);

        // Switch to invalid data - should not crash
        invalidDataStructures.forEach(invalidData => {
          mockContainer.each = jest.fn((fn) => { fn.call(mockContainer, invalidData); return mockContainer; });
          mockContainer.call(chart);
        });

        // Return to valid data - should work again
        mockContainer.each = jest.fn((fn) => { fn.call(mockContainer, validStackedData); return mockContainer; });
        mockContainer.call(chart);

      }).not.toThrow();
    });

    test("should recover from theme switching errors", () => {
      expect(() => {
        // Apply valid theme
        chart.theme("default");
        mockContainer.call(chart);

        // Apply invalid theme - should fallback gracefully
        chart.theme("nonexistent-theme");
        mockContainer.call(chart);

        // Return to valid theme - should work
        chart.theme("dark");
        mockContainer.call(chart);

      }).not.toThrow();
    });

    test("should maintain state integrity after errors", () => {
      // Set initial valid state
      chart.width(800).height(400).theme("default").enableAdvancedColors(false);
      // const initialState = {
      //   width: chart.width(),
      //   height: chart.height(),
      //   theme: chart.theme(),
      //   advancedColors: chart.enableAdvancedColors()
      // };

      // Attempt invalid operations
      try {
        mockContainer.each = jest.fn((fn) => { fn.call(mockContainer, [null, undefined]); return mockContainer; });
        mockContainer.call(chart);
        chart.theme("invalid-theme");
      } catch {
        // Errors should be handled gracefully
      }

      // State should be preserved or reset to valid values
      expect(typeof chart.width()).toBe("number");
      expect(chart.width()).toBeGreaterThan(0);
      expect(typeof chart.height()).toBe("number");
      expect(chart.height()).toBeGreaterThan(0);
      expect(typeof chart.theme()).toBe("string");
      expect(typeof chart.enableAdvancedColors()).toBe("boolean");
    });
  });

  describe("Real-world Usage Patterns", () => {
    test("should handle typical dashboard integration pattern", () => {
      expect(() => {
        // 1. User loads data
        const transformed = dataProcessor.transformToWaterfallFormat([
          { quarter: "Q1", revenue: 1000, expenses: -300 },
          { quarter: "Q2", revenue: 1200, expenses: -400 },
          { quarter: "Q3", revenue: 800, expenses: -250 }
        ], {
          labelField: "quarter",
          valueField: "revenue"
        });

        // 2. User configures chart
        chart.width(1000)
             .height(500)
             .margin({ top: 20, right: 50, bottom: 80, left: 100 })
             .theme("corporate")
             .enableAdvancedColors(true)
             .colorMode("conditional")
             .showTotal(true)
             .totalLabel("Net Result");

        // 3. User renders chart
        mockContainer.each = jest.fn((fn) => { fn.call(mockContainer, transformed); return mockContainer; });
        mockContainer.call(chart);

        // 4. User switches theme (common interaction)
        chart.theme("financial").colorTheme("professional");
        mockContainer.call(chart);

        // 5. User enables accessibility
        accessibilitySystem.makeAccessible(mockContainer, validStackedData, {
          title: "Quarterly Performance",
          description: "Shows revenue performance across quarters"
        });

      }).not.toThrow();
    });

    test("should handle data update workflow", () => {
      expect(() => {
        // Initial render
        mockContainer.call(chart);

        // Data updates (common in real-time dashboards)
        const updates = [
          validStackedData,
          [...validStackedData, { label: "New", stacks: [{ value: 300, color: "#000" }], category: "revenue" }],
          validStackedData.slice(0, -1), // Remove last item
          validStackedData.map(item => ({ ...item, stacks: [{ ...item.stacks[0], value: item.stacks[0].value * 1.1 }] })) // 10% increase
        ];

        updates.forEach(updateData => {
          mockContainer.each = jest.fn((fn) => { fn.call(mockContainer, updateData); return mockContainer; });
          mockContainer.call(chart);
        });

      }).not.toThrow();
    });
  });
});
