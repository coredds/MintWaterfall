// MintWaterfall Theme System
// Predefined themes, D3 color schemes, and color helpers.

import * as d3 from "d3";

export interface AdvancedColorScale {
    type: "sequential" | "diverging" | "ordinal";
    interpolator?: (t: number) => string;
    domain?: number[];
    range?: string[];
}

export interface Theme {
    name: string;
    background: string;
    gridColor: string;
    axisColor: string;
    textColor: string;
    totalColor: string;
    colors: string[];
    sequentialScale?: AdvancedColorScale;
    divergingScale?: AdvancedColorScale;
    conditionalFormatting?: {
        positive: string;
        negative: string;
        neutral: string;
    };
}

export interface ThemeCollection {
    default: Theme;
    dark: Theme;
    corporate: Theme;
    accessible: Theme;
    colorful: Theme;
    [key: string]: Theme;
}

export interface ChartWithTheme {
    totalColor(color: string): ChartWithTheme;
    [key: string]: any;
}

export const themes: ThemeCollection = {
    default: {
        name: "Default",
        background: "#ffffff",
        gridColor: "#e2e8f0",
        axisColor: "#cbd5e1",
        textColor: "#0f172a",
        totalColor: "#475569",
        colors: ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#06b6d4", "#8b5cf6", "#ec4899", "#84cc16"],
        sequentialScale: { type: "sequential", interpolator: d3.interpolateBlues },
        divergingScale: { type: "diverging", interpolator: d3.interpolateRdYlBu },
        conditionalFormatting: { positive: "#10b981", negative: "#ef4444", neutral: "#94a3b8" },
    },

    dark: {
        name: "Dark",
        background: "#0f172a",
        gridColor: "#1e293b",
        axisColor: "#334155",
        textColor: "#e2e8f0",
        totalColor: "#94a3b8",
        colors: ["#818cf8", "#34d399", "#fbbf24", "#f87171", "#22d3ee", "#a78bfa", "#f472b6", "#a3e635"],
        sequentialScale: { type: "sequential", interpolator: d3.interpolateViridis },
        divergingScale: { type: "diverging", interpolator: d3.interpolatePiYG },
        conditionalFormatting: { positive: "#34d399", negative: "#f87171", neutral: "#64748b" },
    },

    corporate: {
        name: "Corporate",
        background: "#ffffff",
        gridColor: "#e5e7eb",
        axisColor: "#d1d5db",
        textColor: "#111827",
        totalColor: "#1e3a5f",
        colors: ["#1e3a5f", "#2563eb", "#64748b", "#0ea5e9", "#94a3b8", "#0f766e"],
        sequentialScale: { type: "sequential", interpolator: d3.interpolateGreys },
        divergingScale: { type: "diverging", interpolator: d3.interpolateRdBu },
        conditionalFormatting: { positive: "#2563eb", negative: "#b91c1c", neutral: "#6b7280" },
    },

    accessible: {
        name: "Accessible",
        background: "#ffffff",
        gridColor: "#d4d4d4",
        axisColor: "#737373",
        textColor: "#000000",
        totalColor: "#404040",
        // Okabe–Ito palette: distinguishable under the common forms of color blindness
        colors: ["#0072B2", "#E69F00", "#009E73", "#D55E00", "#56B4E9", "#CC79A7", "#F0E442", "#000000"],
        sequentialScale: {
            type: "sequential",
            interpolator: (t: number) => d3.interpolateHsl("#ffffff", "#000000")(t),
        },
        divergingScale: { type: "diverging", interpolator: d3.interpolateRdBu },
        conditionalFormatting: { positive: "#0072B2", negative: "#D55E00", neutral: "#737373" },
    },

    colorful: {
        name: "Colorful",
        background: "#ffffff",
        gridColor: "#f1f5f9",
        axisColor: "#e2e8f0",
        textColor: "#1e1b4b",
        totalColor: "#7c3aed",
        colors: ["#f43f5e", "#06b6d4", "#f59e0b", "#8b5cf6", "#10b981", "#ec4899", "#3b82f6", "#84cc16"],
        sequentialScale: { type: "sequential", interpolator: d3.interpolateRainbow },
        divergingScale: { type: "diverging", interpolator: d3.interpolateSpectral },
        conditionalFormatting: { positive: "#06b6d4", negative: "#f43f5e", neutral: "#f59e0b" },
    },
};
export function applyTheme(chart: ChartWithTheme, themeName: keyof ThemeCollection = "default"): Theme {
    const theme = themes[themeName] || themes.default;
    
    // Apply theme colors to chart configuration
    chart.totalColor(theme.totalColor);
    
    return theme;
}

export function getThemeColorPalette(themeName: keyof ThemeCollection = "default"): string[] {
    const theme = themes[themeName] || themes.default;
    return theme.colors;
}

// ============================================================================
// ADVANCED COLOR SCALE FUNCTIONS
// ============================================================================

/**
 * Create a sequential color scale for continuous data visualization
 * Perfect for heat-map style conditional formatting in waterfall charts
 */
export function createSequentialScale(
    domain: [number, number], 
    themeName: keyof ThemeCollection = "default"
): d3.ScaleSequential<string> {
    const theme = themes[themeName] || themes.default;
    const interpolator = theme.sequentialScale?.interpolator || d3.interpolateBlues;
    
    return d3.scaleSequential(interpolator)
        .domain(domain);
}

/**
 * Create a diverging color scale for data with a meaningful center point (e.g., zero)
 * Perfect for positive/negative value emphasis in waterfall charts
 */
export function createDivergingScale(
    domain: [number, number, number], 
    themeName: keyof ThemeCollection = "default"
): d3.ScaleDiverging<string> {
    const theme = themes[themeName] || themes.default;
    const interpolator = theme.divergingScale?.interpolator || d3.interpolateRdYlBu;
    
    return d3.scaleDiverging(interpolator)
        .domain(domain);
}

/**
 * Get conditional formatting color based on value
 * Returns appropriate color for positive, negative, or neutral values
 */
export function getConditionalColor(
    value: number, 
    themeName: keyof ThemeCollection = "default",
    neutralThreshold: number = 0
): string {
    const theme = themes[themeName] || themes.default;
    const formatting = theme.conditionalFormatting || {
        positive: "#2ecc71",
        negative: "#e74c3c", 
        neutral: "#95a5a6"
    };
    
    if (Math.abs(value) <= Math.abs(neutralThreshold)) {
        return formatting.neutral;
    }
    return value > neutralThreshold ? formatting.positive : formatting.negative;
}

/**
 * Create a color scale for waterfall data with automatic domain detection
 * Automatically chooses between sequential or diverging based on data characteristics
 */
export function createWaterfallColorScale(
    data: Array<{value: number}>, 
    themeName: keyof ThemeCollection = "default",
    scaleType: "auto" | "sequential" | "diverging" = "auto"
): d3.ScaleSequential<string> | d3.ScaleDiverging<string> {
    const values = data.map(d => d.value);
    const extent = d3.extent(values) as [number, number];
    const hasPositiveAndNegative = extent[0] < 0 && extent[1] > 0;
    
    // Auto-detect scale type
    if (scaleType === "auto") {
        scaleType = hasPositiveAndNegative ? "diverging" : "sequential";
    }
    
    if (scaleType === "diverging" && hasPositiveAndNegative) {
        const maxAbs = Math.max(Math.abs(extent[0]), Math.abs(extent[1]));
        return createDivergingScale([-maxAbs, 0, maxAbs], themeName);
    } else {
        return createSequentialScale(extent, themeName);
    }
}

/**
 * Apply color interpolation to a value within a range
 * Useful for creating smooth color transitions in large datasets
 */
export function interpolateThemeColor(
    value: number,
    domain: [number, number],
    themeName: keyof ThemeCollection = "default"
): string {
    const theme = themes[themeName] || themes.default;
    const interpolator = theme.sequentialScale?.interpolator || d3.interpolateBlues;
    
    const normalizedValue = (value - domain[0]) / (domain[1] - domain[0]);
    return interpolator(Math.max(0, Math.min(1, normalizedValue)));
}

/**
 * Get advanced bar color based on value, context, and theme
 * This is the main function for determining bar colors with advanced features
 */
export function getAdvancedBarColor(
    value: number,
    defaultColor: string,
    allData: Array<{barTotal?: number; value?: number}> = [],
    themeName: keyof ThemeCollection = "default",
    colorMode: "default" | "conditional" | "sequential" | "diverging" = "conditional"
): string {
    switch (colorMode) {
        case "conditional":
            return getConditionalColor(value, themeName);
            
        case "sequential":
            if (allData.length > 0) {
                const values = allData.map(d => d.barTotal || d.value || 0);
                const domain = d3.extent(values) as [number, number];
                return interpolateThemeColor(value, domain, themeName);
            }
            return defaultColor;
            
        case "diverging":
            if (allData.length > 0) {
                const values = allData.map(d => d.barTotal || d.value || 0);
                const maxAbs = Math.max(...values.map(Math.abs));
                const scale = createDivergingScale([-maxAbs, 0, maxAbs], themeName);
                return scale(value);
            }
            return getConditionalColor(value, themeName);
            
        default:
            return defaultColor;
    }
}


/**
 * Additional finance-oriented themes (merged into `themes`).
 */
export const financialThemes: Partial<ThemeCollection> = {
    financial: {
        name: "Financial",
        background: "#ffffff",
        gridColor: "#eef2f6",
        axisColor: "#cbd5e1",
        textColor: "#0f172a",
        totalColor: "#0f172a",
        colors: ["#16a34a", "#dc2626", "#2563eb", "#d97706", "#7c3aed"],
        sequentialScale: { type: "sequential", interpolator: d3.interpolateRdYlGn },
        divergingScale: { type: "diverging", interpolator: d3.interpolateRdYlGn },
        conditionalFormatting: { positive: "#16a34a", negative: "#dc2626", neutral: "#94a3b8" },
    },

    professional: {
        name: "Professional",
        background: "#ffffff",
        gridColor: "#e8e8e8",
        axisColor: "#c4c4c4",
        textColor: "#262626",
        totalColor: "#1f4e79",
        colors: ["#1f4e79", "#2e75b6", "#70ad47", "#ffc000", "#c55a11"],
        sequentialScale: {
            type: "sequential",
            interpolator: (t: number) => d3.interpolateHsl("#f0f8ff", "#1f4e79")(t),
        },
        divergingScale: { type: "diverging", interpolator: d3.interpolateRdYlBu },
        conditionalFormatting: { positive: "#70ad47", negative: "#c55a11", neutral: "#7f8c8d" },
    },

    heatmap: {
        name: "Heat Map",
        background: "#ffffff",
        gridColor: "#f0f0f0",
        axisColor: "#d4d4d4",
        textColor: "#333333",
        totalColor: "#7f1d1d",
        colors: ["#ffffcc", "#ffeda0", "#fed976", "#feb24c", "#fd8d3c", "#fc4e2a", "#e31a1c", "#bd0026", "#800026"],
        sequentialScale: { type: "sequential", interpolator: d3.interpolateYlOrRd },
        divergingScale: { type: "diverging", interpolator: d3.interpolateRdYlBu },
        conditionalFormatting: { positive: "#2ca02c", negative: "#d62728", neutral: "#ff7f0e" },
    },
};

// Merge financial themes with existing themes
Object.assign(themes, financialThemes);