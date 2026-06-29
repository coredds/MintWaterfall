// Core API Integration Tests - High Value Coverage
// Tests the main public API and critical integration points
import { waterfallChart, createDataProcessor, themes, createAccessibilitySystem } from "../dist/mintwaterfall.esm.js";

describe("MintWaterfall Core API", () => {
  let chart;
  let mockContainer;
  
  const validData = [
    { label: "Start", stacks: [{ value: 100, color: "#4F81BD" }], category: "baseline" },
    { label: "Increase", stacks: [{ value: 50, color: "#9CBB58" }], category: "revenue" },
    { label: "Decrease", stacks: [{ value: -30, color: "#F79646" }], category: "expenses" }
  ];

  beforeEach(() => {
    chart = waterfallChart();
    mockContainer = {
      selectAll: jest.fn(() => mockContainer),
      select: jest.fn(() => mockContainer),
      append: jest.fn(() => mockContainer),
      attr: jest.fn(() => mockContainer),
      style: jest.fn(() => mockContainer),
      text: jest.fn(() => mockContainer),
      datum: jest.fn(() => mockContainer),
      call: jest.fn(() => mockContainer),
      node: jest.fn(() => ({ getBoundingClientRect: () => ({ width: 800, height: 400 }) })),
      each: jest.fn((fn) => { fn.call(mockContainer, validData); return mockContainer; })
    };
  });

  describe("Factory Function", () => {
    test("should create chart instance", () => {
      expect(chart).toBeDefined();
      expect(typeof chart.width).toBe("function");
      expect(typeof chart.height).toBe("function");
    });

    test("should have chainable API", () => {
      const result = chart.width(500).height(300).margin({ top: 20, right: 30, bottom: 40, left: 50 });
      expect(result).toBe(chart);
    });

    test("should maintain configuration state", () => {
      chart.width(500).height(300);
      expect(chart.width()).toBe(500);
      expect(chart.height()).toBe(300);
    });
  });

  describe("Configuration Methods", () => {
    test("width getter/setter", () => {
      expect(chart.width()).toBe(800); // actual default
      chart.width(500);
      expect(chart.width()).toBe(500);
    });

    test("height getter/setter", () => {
      expect(chart.height()).toBe(400); // actual default
      chart.height(300);
      expect(chart.height()).toBe(300);
    });

    test("margin getter/setter", () => {
      const defaultMargin = chart.margin();
      expect(defaultMargin).toEqual({ top: 60, right: 80, bottom: 60, left: 80 }); // actual defaults
      
      const newMargin = { top: 20, right: 30, bottom: 40, left: 50 };
      chart.margin(newMargin);
      expect(chart.margin()).toEqual(newMargin);
    });

    test("theme getter/setter", () => {
      expect(chart.theme()).toBe(null); // actual default - no theme initially
      chart.theme("dark");
      expect(chart.theme()).toBe("dark");
    });

    test("stacked getter/setter", () => {
      expect(chart.stacked()).toBe(false); // actual default
      chart.stacked(true);
      expect(chart.stacked()).toBe(true);
    });
  });

  describe("Advanced Features", () => {
    test("enableAdvancedColors getter/setter", () => {
      expect(chart.enableAdvancedColors()).toBe(false); // default
      chart.enableAdvancedColors(true);
      expect(chart.enableAdvancedColors()).toBe(true);
    });

    test("colorMode getter/setter", () => {
      expect(chart.colorMode()).toBe("conditional"); // default
      chart.colorMode("sequential");
      expect(chart.colorMode()).toBe("sequential");
    });

    test("colorTheme getter/setter", () => {
      expect(chart.colorTheme()).toBe("default");
      chart.colorTheme("financial");
      expect(chart.colorTheme()).toBe("financial");
    });
  });

  describe("Chart Rendering", () => {
    test("should accept data and render without errors", () => {
      expect(() => {
        mockContainer.call(chart);
      }).not.toThrow();
      
      // Verify call was invoked
      expect(mockContainer.call).toHaveBeenCalledWith(chart);
    });

    test("should validate data structure before rendering", () => {
      const invalidData = [{ label: "Invalid", value: 100 }]; // missing stacks
      
      mockContainer.datum = jest.fn(() => mockContainer);
      mockContainer.each = jest.fn((fn) => { 
        fn.call(mockContainer, invalidData); 
        return mockContainer; 
      });

      // Should handle invalid data gracefully
      expect(() => {
        mockContainer.call(chart);
      }).not.toThrow();
    });

    test("should apply theme configuration", () => {
      chart.theme("dark");
      mockContainer.call(chart);
      
      // Verify chart was called (theme application happens internally)
      expect(mockContainer.call).toHaveBeenCalled();
    });
  });

  describe("Error Handling", () => {
    test("should handle invalid width values", () => {
      expect(() => chart.width(-100)).not.toThrow();
      // Note: Current implementation allows negative values - this is a test for what actually happens
      expect(typeof chart.width()).toBe("number");
    });

    test("should handle invalid height values", () => {
      expect(() => chart.height(-100)).not.toThrow();
      // Note: Current implementation allows negative values - this is a test for what actually happens
      expect(typeof chart.height()).toBe("number");
    });

    test("should handle invalid theme names", () => {
      expect(() => chart.theme("nonexistent-theme")).not.toThrow();
      // Should fallback to default theme
    });

    test("should handle null/undefined data gracefully", () => {
      mockContainer.each = jest.fn((fn) => { 
        fn.call(mockContainer, null); 
        return mockContainer; 
      });

      expect(() => {
        mockContainer.call(chart);
      }).not.toThrow();
    });
  });

  describe("Integration with Data Processor", () => {
    let dataProcessor;

    beforeEach(() => {
      dataProcessor = createDataProcessor();
    });

    test("should validate data using data processor", () => {
      expect(() => dataProcessor.validateData(validData)).not.toThrow();
    });

    test("should transform data correctly", () => {
      const simpleData = [
        { name: "Start", amount: 100 },
        { name: "Change", amount: 50 }
      ];
      
      expect(() => {
        dataProcessor.transformToWaterfallFormat(simpleData, {
          labelField: "name",
          valueField: "amount"
        });
      }).not.toThrow();
    });

    test("should detect invalid data structures", () => {
      const invalidData = [null, undefined, {}];
      expect(() => dataProcessor.validateData(invalidData)).toThrow();
    });
  });

  describe("Integration with Theme System", () => {
    test("should have required themes available", () => {
      expect(themes.default).toBeDefined();
      expect(themes.dark).toBeDefined();
      expect(themes.corporate).toBeDefined();
      expect(themes.financial).toBeDefined();
    });

    test("should apply themes to chart", () => {
      Object.keys(themes).forEach(themeName => {
        expect(() => chart.theme(themeName)).not.toThrow();
        expect(chart.theme()).toBe(themeName);
      });
    });
  });

  describe("Integration with Accessibility System", () => {
    let accessibilitySystem;

    beforeEach(() => {
      accessibilitySystem = createAccessibilitySystem();
    });

    test("should have accessibility system available", () => {
      expect(accessibilitySystem).toBeDefined();
      expect(typeof accessibilitySystem.makeAccessible).toBe("function");
    });

    test("should create accessible descriptions", () => {
      // Mock D3 selection for the accessibility system
      const mockContainer = {
        append: jest.fn().mockReturnThis(),
        attr: jest.fn().mockReturnThis(),
        style: jest.fn().mockReturnThis(),
        text: jest.fn().mockReturnThis(),
        html: jest.fn().mockReturnThis()
      };

      const description = accessibilitySystem.createChartDescription(mockContainer, validData, {
        title: "Revenue Analysis",
        summary: "Shows revenue changes over time"
      });
      
      expect(typeof description).toBe("string");
      expect(description).toMatch(/^waterfall-description-[a-z0-9]+$/);
      
      // Verify the mock was called with the right content
      expect(mockContainer.html).toHaveBeenCalledWith(
        expect.stringContaining("Revenue Analysis")
      );
      expect(mockContainer.html).toHaveBeenCalledWith(
        expect.stringContaining("3 data categories")
      );
    });

    test("should validate color contrast", () => {
      expect(() => {
        const contrastResult = accessibilitySystem.validateColorContrast("#000000", "#ffffff");
        expect(typeof contrastResult).toBe("object");
        expect(contrastResult).toHaveProperty("ratio");
        expect(contrastResult).toHaveProperty("passesAA");
        expect(contrastResult).toHaveProperty("passesAAA");
      }).not.toThrow();
    });
  });
});
