// MintWaterfall Enhanced Theme System - TypeScript Version
// Provides predefined themes, advanced D3.js color schemes, and interpolation with full type safety

import * as d3 from 'd3';

// Type definitions for enhanced theme system
export interface AdvancedColorScale {
    type: 'sequential' | 'diverging' | 'ordinal';
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
    // NEW: Advanced color features
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
        gridColor: "#e0e0e0",
        axisColor: "#666666",
        textColor: "#333333",
        totalColor: "#95A5A6",
        colors: ["#3498db", "#2ecc71", "#e74c3c", "#f39c12", "#9b59b6", "#1abc9c", "#e67e22", "#f1c40f"],
        // NEW: Advanced color features
        sequentialScale: {
            type: 'sequential',
            interpolator: d3.interpolateBlues
        },
        divergingScale: {
            type: 'diverging',
            interpolator: d3.interpolateRdYlBu
        },
        conditionalFormatting: {
            positive: "#2ecc71",
            negative: "#e74c3c",
            neutral: "#95a5a6"
        }
    },
    
    dark: {
        name: "Dark",
        background: "#2c3e50",
        gridColor: "#34495e",
        axisColor: "#bdc3c7",
        textColor: "#ecf0f1",
        totalColor: "#95a5a6",
        colors: ["#3498db", "#2ecc71", "#e74c3c", "#f39c12", "#9b59b6", "#1abc9c", "#e67e22", "#f1c40f"],
        sequentialScale: {
            type: 'sequential',
            interpolator: d3.interpolateViridis
        },
        divergingScale: {
            type: 'diverging',
            interpolator: d3.interpolatePiYG
        },
        conditionalFormatting: {
            positive: "#2ecc71",
            negative: "#e74c3c",
            neutral: "#95a5a6"
        }
    },
    
    corporate: {
        name: "Corporate",
        background: "#ffffff",
        gridColor: "#e8e8e8",
        axisColor: "#555555",
        textColor: "#333333",
        totalColor: "#7f8c8d",
        colors: ["#2c3e50", "#34495e", "#7f8c8d", "#95a5a6", "#bdc3c7", "#ecf0f1"],
        sequentialScale: {
            type: 'sequential',
            interpolator: d3.interpolateGreys
        },
        divergingScale: {
            type: 'diverging',
            interpolator: d3.interpolateRdBu
        },
        conditionalFormatting: {
            positive: "#27ae60",
            negative: "#c0392b",
            neutral: "#7f8c8d"
        }
    },
    
    accessible: {
        name: "Accessible",
        background: "#ffffff",
        gridColor: "#cccccc",
        axisColor: "#000000",
        textColor: "#000000",
        totalColor: "#666666",
        // High contrast, colorblind-friendly palette
        colors: ["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd", "#8c564b", "#e377c2", "#7f7f7f"],
        sequentialScale: {
            type: 'sequential',
            interpolator: (t: number) => d3.interpolateHsl("#ffffff", "#000000")(t)
        },
        divergingScale: {
            type: 'diverging',
            interpolator: d3.interpolateRdBu
        },
        conditionalFormatting: {
            positive: "#1f77b4",  // High contrast blue
            negative: "#d62728",  // High contrast red
            neutral: "#666666"
        }
    },
    
    colorful: {
        name: "Colorful",
        background: "#ffffff",
        gridColor: "#f0f0f0",
        axisColor: "#666666",
        textColor: "#333333",
        totalColor: "#34495e",
        colors: ["#ff6b6b", "#4ecdc4", "#45b7d1", "#f9ca24", "#f0932b", "#eb4d4b", "#6c5ce7", "#a29bfe"],
        sequentialScale: {
            type: 'sequential',
            interpolator: d3.interpolateRainbow
        },
        divergingScale: {
            type: 'diverging',
            interpolator: d3.interpolateSpectral
        },
        conditionalFormatting: {
            positive: "#4ecdc4",
            negative: "#ff6b6b",
            neutral: "#f9ca24"
        }
    }
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
    scaleType: 'auto' | 'sequential' | 'diverging' = 'auto'
): d3.ScaleSequential<string> | d3.ScaleDiverging<string> {
    const values = data.map(d => d.value);
    const extent = d3.extent(values) as [number, number];
    const hasPositiveAndNegative = extent[0] < 0 && extent[1] > 0;
    
    // Auto-detect scale type
    if (scaleType === 'auto') {
        scaleType = hasPositiveAndNegative ? 'diverging' : 'sequential';
    }
    
    if (scaleType === 'diverging' && hasPositiveAndNegative) {
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
    themeName: keyof ThemeCollection = "default",
    scaleType: 'sequential' | 'diverging' = 'sequential'
): string {
    const theme = themes[themeName] || themes.default;
    
    if (scaleType === 'diverging') {
        const maxAbs = Math.max(Math.abs(domain[0]), Math.abs(domain[1]));
        const interpolator = theme.divergingScale?.interpolator || d3.interpolateRdYlBu;
        const normalizedValue = value / maxAbs; // Normalize to [-1, 1]
        return interpolator((normalizedValue + 1) / 2); // Convert to [0, 1] for interpolator
    } else {
        const interpolator = theme.sequentialScale?.interpolator || d3.interpolateBlues;
        const normalizedValue = (value - domain[0]) / (domain[1] - domain[0]);
        return interpolator(Math.max(0, Math.min(1, normalizedValue)));
    }
}

/**
 * Get enhanced color palette with interpolated values
 * Creates a smooth color progression for data visualization
 */
export function getEnhancedColorPalette(
    steps: number = 10,
    themeName: keyof ThemeCollection = "default",
    scaleType: 'sequential' | 'diverging' = 'sequential'
): string[] {
    const theme = themes[themeName] || themes.default;
    const interpolator = scaleType === 'diverging' 
        ? (theme.divergingScale?.interpolator || d3.interpolateRdYlBu)
        : (theme.sequentialScale?.interpolator || d3.interpolateBlues);
    
    return Array.from({ length: steps }, (_, i) => {
        const t = i / (steps - 1);
        return interpolator(t);
    });
}
