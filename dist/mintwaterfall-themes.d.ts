import * as d3 from 'd3';
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
export declare const themes: ThemeCollection;
export declare function applyTheme(chart: ChartWithTheme, themeName?: keyof ThemeCollection): Theme;
export declare function getThemeColorPalette(themeName?: keyof ThemeCollection): string[];
/**
 * Create a sequential color scale for continuous data visualization
 * Perfect for heat-map style conditional formatting in waterfall charts
 */
export declare function createSequentialScale(domain: [number, number], themeName?: keyof ThemeCollection): d3.ScaleSequential<string>;
/**
 * Create a diverging color scale for data with a meaningful center point (e.g., zero)
 * Perfect for positive/negative value emphasis in waterfall charts
 */
export declare function createDivergingScale(domain: [number, number, number], themeName?: keyof ThemeCollection): d3.ScaleDiverging<string>;
/**
 * Get conditional formatting color based on value
 * Returns appropriate color for positive, negative, or neutral values
 */
export declare function getConditionalColor(value: number, themeName?: keyof ThemeCollection, neutralThreshold?: number): string;
/**
 * Create a color scale for waterfall data with automatic domain detection
 * Automatically chooses between sequential or diverging based on data characteristics
 */
export declare function createWaterfallColorScale(data: Array<{
    value: number;
}>, themeName?: keyof ThemeCollection, scaleType?: 'auto' | 'sequential' | 'diverging'): d3.ScaleSequential<string> | d3.ScaleDiverging<string>;
/**
 * Apply color interpolation to a value within a range
 * Useful for creating smooth color transitions in large datasets
 */
export declare function interpolateThemeColor(value: number, domain: [number, number], themeName?: keyof ThemeCollection, scaleType?: 'sequential' | 'diverging'): string;
/**
 * Get enhanced color palette with interpolated values
 * Creates a smooth color progression for data visualization
 */
export declare function getEnhancedColorPalette(steps?: number, themeName?: keyof ThemeCollection, scaleType?: 'sequential' | 'diverging'): string[];
//# sourceMappingURL=mintwaterfall-themes.d.ts.map