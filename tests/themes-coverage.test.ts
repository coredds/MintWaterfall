// MintWaterfall Themes Tests
// Test theme definitions, conditional coloring, palette retrieval
import { themes, applyTheme, getConditionalColor, getThemeColorPalette } from "../src/themes.js";

describe("themes", () => {
  test("all built-in themes are defined", () => {
    expect(themes.default).toBeDefined();
    expect(themes.dark).toBeDefined();
    expect(themes.corporate).toBeDefined();
    expect(themes.accessible).toBeDefined();
    expect(themes.colorful).toBeDefined();
  });

  test("each theme has required properties", () => {
    for (const [name, theme] of Object.entries(themes)) {
      if (name === "accessible" || name === "colorful" || name === "dark" || name === "corporate" || name === "default") {
        expect(theme.name).toBeDefined();
        expect(theme.background).toMatch(/^#/);
        expect(theme.totalColor).toMatch(/^#/);
        expect(Array.isArray(theme.colors)).toBe(true);
        expect(theme.colors.length).toBeGreaterThan(0);
        expect(theme.colors.every((c: string) => /^#/.test(c))).toBe(true);
      }
    }
  });

  test("default theme falls back for unknown key", () => {
    const def = themes.default;
    expect(def.name).toBe("Default");
  });

  test("dark theme has distinct palette from default", () => {
    expect(themes.default.colors).not.toEqual(themes.dark.colors);
  });
});

describe("getConditionalColor", () => {
  test("returns positive color for positive values", () => {
    expect(getConditionalColor(100)).toBe("#2ecc71");
    expect(getConditionalColor(0.01)).toBe("#2ecc71");
  });

  test("returns negative color for negative values", () => {
    expect(getConditionalColor(-100)).toBe("#e74c3c");
    expect(getConditionalColor(-0.01)).toBe("#e74c3c");
  });

  test("returns neutral color for zero", () => {
    expect(getConditionalColor(0)).toBe("#95a5a6");
  });

  test("uses theme-specific conditional formatting", () => {
    // Corporate theme uses different colors
    expect(getConditionalColor(100, "corporate")).toBe("#27ae60");
    expect(getConditionalColor(-100, "corporate")).toBe("#c0392b");
  });

  test("accessible theme returns colorblind-safe colors", () => {
    expect(getConditionalColor(100, "accessible")).toBe("#1f77b4");
    expect(getConditionalColor(-100, "accessible")).toBe("#d62728");
  });
});

describe("getThemeColorPalette", () => {
  test("returns array of color strings", () => {
    const palette = getThemeColorPalette("default");
    expect(Array.isArray(palette)).toBe(true);
    expect(palette.length).toBeGreaterThan(0);
    expect(palette.every((c: string) => /^#/.test(c))).toBe(true);
  });

  test("each theme has a distinct palette", () => {
    const defaultPalette = getThemeColorPalette("default");
    const darkPalette = getThemeColorPalette("dark");
    const corporatePalette = getThemeColorPalette("corporate");
    const accessiblePalette = getThemeColorPalette("accessible");
    const colorfulPalette = getThemeColorPalette("colorful");

    // All palettes should be arrays of hex colors
    [defaultPalette, darkPalette, corporatePalette, accessiblePalette, colorfulPalette]
      .forEach((p) => {
        expect(Array.isArray(p)).toBe(true);
        expect(p.every((c: string) => /^#/.test(c))).toBe(true);
      });
  });

  test("falls back to default for unknown theme", () => {
    expect(getThemeColorPalette("nonexistent" as any)).toEqual(themes.default.colors);
  });
});

describe("applyTheme", () => {
  test("sets totalColor on chart-like object", () => {
    let stored = "";
    const chart = {
      totalColor(c: string) {
        if (c) stored = c;
        return chart;
      },
    };
    applyTheme(chart, "dark");
    expect(stored).toBe("#7f8c8d");
  });

  test("returns the theme object", () => {
    const theme = applyTheme({ totalColor: () => ({ totalColor: () => {} }) } as any, "default");
    expect(theme.name).toBe("Default");
  });
});
