// Theme System Tests
import { themes, applyTheme, getThemeColorPalette } from "../mintwaterfall-themes.js";

describe("MintWaterfall Theme System", () => {
  describe("Predefined Themes", () => {
    test("should have default theme", () => {
      expect(themes.default).toBeDefined();
      expect(themes.default.name).toBe("Default");
      expect(themes.default.colors).toBeInstanceOf(Array);
      expect(themes.default.colors.length).toBeGreaterThan(0);
    });

    test("should have dark theme", () => {
      expect(themes.dark).toBeDefined();
      expect(themes.dark.name).toBe("Dark");
      expect(themes.dark.background).toBe("#2c3e50");
    });

    test("should have corporate theme", () => {
      expect(themes.corporate).toBeDefined();
      expect(themes.corporate.name).toBe("Corporate");
    });

    test("should have accessible theme", () => {
      expect(themes.accessible).toBeDefined();
      expect(themes.accessible.name).toBe("Accessible");
    });

    test("should have colorful theme", () => {
      expect(themes.colorful).toBeDefined();
      expect(themes.colorful.name).toBe("Colorful");
    });
  });

  describe("Theme Application", () => {
    test("should apply theme to chart", () => {
      const mockChart = {
        totalColor: jest.fn(() => mockChart)
      };

      const theme = applyTheme(mockChart, "dark");
      
      expect(mockChart.totalColor).toHaveBeenCalledWith(themes.dark.totalColor);
      expect(theme).toBe(themes.dark);
    });

    test("should fallback to default theme for invalid theme name", () => {
      const mockChart = {
        totalColor: jest.fn(() => mockChart)
      };

      const theme = applyTheme(mockChart, "nonexistent");
      
      expect(theme).toBe(themes.default);
    });
  });

  describe("Color Palette", () => {
    test("should return color palette for theme", () => {
      const colors = getThemeColorPalette("dark");
      expect(colors).toBe(themes.dark.colors);
      expect(Array.isArray(colors)).toBe(true);
    });

    test("should return default colors for invalid theme", () => {
      const colors = getThemeColorPalette("invalid");
      expect(colors).toBe(themes.default.colors);
    });
  });

  describe("Theme Structure", () => {
    test("all themes should have required properties", () => {
      Object.values(themes).forEach(theme => {
        expect(theme.name).toBeDefined();
        expect(theme.background).toBeDefined();
        expect(theme.gridColor).toBeDefined();
        expect(theme.axisColor).toBeDefined();
        expect(theme.textColor).toBeDefined();
        expect(theme.totalColor).toBeDefined();
        expect(Array.isArray(theme.colors)).toBe(true);
        expect(theme.colors.length).toBeGreaterThan(0);
      });
    });
  });
});
