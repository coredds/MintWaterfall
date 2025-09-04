import * as d3 from 'd3';
export interface StackData {
    value: number;
    color: string;
    label?: string;
}
export interface ChartData {
    label: string;
    stacks: StackData[];
}
export interface ProcessedData extends ChartData {
    barTotal: number;
    cumulativeTotal: number;
    prevCumulativeTotal?: number;
    stackPositions?: Array<{
        start: number;
        end: number;
        color: string;
        value: number;
        label?: string;
    }>;
}
export interface MarginConfig {
    top: number;
    right: number;
    bottom: number;
    left: number;
}
export interface BrushOptions {
    extent?: [[number, number], [number, number]];
    handleSize?: number;
    [key: string]: any;
}
export interface TooltipConfig {
    enabled?: boolean;
    className?: string;
    offset?: {
        x: number;
        y: number;
    };
    [key: string]: any;
}
export interface ExportConfig {
    formats?: string[];
    filename?: string;
    [key: string]: any;
}
export interface ZoomConfig {
    scaleExtent?: [number, number];
    translateExtent?: [[number, number], [number, number]];
    [key: string]: any;
}
export interface BreakdownConfig {
    enabled: boolean;
    levels: number;
    field?: string;
    minGroupSize?: number;
    sortStrategy?: string;
    showOthers?: boolean;
    othersLabel?: string;
    maxGroups?: number;
}
export interface BarEventHandler {
    (event: Event, data: ProcessedData): void;
}
export interface WaterfallChart {
    width(): number;
    width(value: number): WaterfallChart;
    height(): number;
    height(value: number): WaterfallChart;
    margin(): MarginConfig;
    margin(value: MarginConfig): WaterfallChart;
    stacked(): boolean;
    stacked(value: boolean): WaterfallChart;
    showTotal(): boolean;
    showTotal(value: boolean): WaterfallChart;
    totalLabel(): string;
    totalLabel(value: string): WaterfallChart;
    totalColor(): string;
    totalColor(value: string): WaterfallChart;
    barPadding(): number;
    barPadding(value: number): WaterfallChart;
    duration(): number;
    duration(value: number): WaterfallChart;
    ease(): (t: number) => number;
    ease(value: (t: number) => number): WaterfallChart;
    formatNumber(): (n: number) => string;
    formatNumber(value: (n: number) => string): WaterfallChart;
    theme(): string | null;
    theme(value: string | null): WaterfallChart;
    enableBrush(): boolean;
    enableBrush(value: boolean): WaterfallChart;
    brushOptions(): BrushOptions;
    brushOptions(value: BrushOptions): WaterfallChart;
    staggeredAnimations(): boolean;
    staggeredAnimations(value: boolean): WaterfallChart;
    staggerDelay(): number;
    staggerDelay(value: number): WaterfallChart;
    scaleType(): string;
    scaleType(value: string): WaterfallChart;
    showTrendLine(): boolean;
    showTrendLine(value: boolean): WaterfallChart;
    trendLineColor(): string;
    trendLineColor(value: string): WaterfallChart;
    trendLineWidth(): number;
    trendLineWidth(value: number): WaterfallChart;
    trendLineStyle(): string;
    trendLineStyle(value: string): WaterfallChart;
    trendLineOpacity(): number;
    trendLineOpacity(value: number): WaterfallChart;
    trendLineType(): string;
    trendLineType(value: string): WaterfallChart;
    trendLineWindow(): number;
    trendLineWindow(value: number): WaterfallChart;
    trendLineDegree(): number;
    trendLineDegree(value: number): WaterfallChart;
    enableAccessibility(): boolean;
    enableAccessibility(value: boolean): WaterfallChart;
    enableTooltips(): boolean;
    enableTooltips(value: boolean): WaterfallChart;
    tooltipConfig(): TooltipConfig;
    tooltipConfig(value: TooltipConfig): WaterfallChart;
    enableExport(): boolean;
    enableExport(value: boolean): WaterfallChart;
    exportConfig(): ExportConfig;
    exportConfig(value: ExportConfig): WaterfallChart;
    enableZoom(): boolean;
    enableZoom(value: boolean): WaterfallChart;
    zoomConfig(): ZoomConfig;
    zoomConfig(value: ZoomConfig): WaterfallChart;
    breakdownConfig(): BreakdownConfig | null;
    breakdownConfig(value: BreakdownConfig | null): WaterfallChart;
    enablePerformanceOptimization(): boolean;
    enablePerformanceOptimization(value: boolean): WaterfallChart;
    performanceDashboard(): boolean;
    performanceDashboard(value: boolean): WaterfallChart;
    virtualizationThreshold(): number;
    virtualizationThreshold(value: number): WaterfallChart;
    on(event: string, handler: BarEventHandler | null): WaterfallChart;
    zoomSystemInstance?: any;
    (selection: d3.Selection<any, any, any, any>): void;
}
export declare function waterfallChart(): WaterfallChart;
//# sourceMappingURL=mintwaterfall-chart.d.ts.map