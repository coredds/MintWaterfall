export interface Theme {
    name: string;
    background: string;
    gridColor: string;
    axisColor: string;
    textColor: string;
    totalColor: string;
    colors: string[];
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
//# sourceMappingURL=mintwaterfall-themes.d.ts.map