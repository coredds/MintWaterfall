// MintWaterfall Chart Configuration
import * as d3 from "d3";

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
    stackPositions?: Array<{ start: number; end: number; color: string; value: number; label?: string }>;
    isTotal?: boolean;
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
    offset?: { x: number; y: number };
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

export interface AdvancedColorConfig {
    enabled: boolean;
    scaleType: "auto" | "sequential" | "diverging" | "conditional";
    themeName?: string;
    customColorScale?: (value: number) => string;
    neutralThreshold?: number;
}

export interface ConfidenceBandConfig {
    enabled: boolean;
    scenarios?: {
        optimistic: Array<{ label: string; value: number }>;
        pessimistic: Array<{ label: string; value: number }>;
    };
    opacity?: number;
    showTrendLines?: boolean;
}

export interface MilestoneConfig {
    enabled: boolean;
    milestones: Array<{
        label: string;
        value: number;
        type: "target" | "threshold" | "alert" | "achievement";
        description?: string;
    }>;
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
    enableAdvancedColors(): boolean;
    enableAdvancedColors(value: boolean): WaterfallChart;
    colorMode(): "default" | "conditional" | "sequential" | "diverging";
    colorMode(value: "default" | "conditional" | "sequential" | "diverging"): WaterfallChart;
    colorTheme(): string;
    colorTheme(value: string): WaterfallChart;
    neutralThreshold(): number;
    neutralThreshold(value: number): WaterfallChart;
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
    data(): WaterfallChart;
    data(value: any): WaterfallChart;
    (selection: d3.Selection<any, any, any, any>): void;
}

export interface ChartConfig {
    width: number;
    height: number;
    margin: MarginConfig;
    showTotal: boolean;
    totalLabel: string;
    totalColor: string;
    stacked: boolean;
    barPadding: number;
    duration: number;
    ease: (t: number) => number;
    formatNumber: (n: number) => string;
    theme: string | null;
    enableBrush: boolean;
    brushOptions: BrushOptions;
    staggeredAnimations: boolean;
    staggerDelay: number;
    scaleType: string;
    advancedColorConfig: AdvancedColorConfig;
    colorMode: "default" | "conditional" | "sequential" | "diverging";
    confidenceBandConfig: ConfidenceBandConfig;
    milestoneConfig: MilestoneConfig;
    showTrendLine: boolean;
    trendLineColor: string;
    trendLineWidth: number;
    trendLineStyle: string;
    trendLineOpacity: number;
    trendLineType: string;
    trendLineWindow: number;
    trendLineDegree: number;
    enableAccessibility: boolean;
    enableTooltips: boolean;
    tooltipConfig: TooltipConfig;
    enableExport: boolean;
    exportConfig: ExportConfig;
    enableZoom: boolean;
    zoomConfig: ZoomConfig;
    breakdownConfig: BreakdownConfig | null;
    formattingRules: Map<string, any>;
    enablePerformanceOptimization: boolean;
    performanceDashboard: boolean;
    virtualizationThreshold: number;
}

export const defaultConfig: ChartConfig = {
    width: 800,
    height: 400,
    margin: { top: 60, right: 80, bottom: 60, left: 80 },
    showTotal: false,
    totalLabel: "Total",
    totalColor: "#95A5A6",
    stacked: false,
    barPadding: 0.05,
    duration: 750,
    ease: d3.easeQuadInOut,
    formatNumber: d3.format(".0f"),
    theme: null,
    enableBrush: false,
    brushOptions: {},
    staggeredAnimations: false,
    staggerDelay: 100,
    scaleType: "auto",
    advancedColorConfig: {
        enabled: false,
        scaleType: "auto",
        themeName: "default",
        neutralThreshold: 0,
    },
    colorMode: "conditional",
    confidenceBandConfig: {
        enabled: false,
        opacity: 0.3,
        showTrendLines: true,
    },
    milestoneConfig: {
        enabled: false,
        milestones: [],
    },
    showTrendLine: false,
    trendLineColor: "#e74c3c",
    trendLineWidth: 2,
    trendLineStyle: "solid",
    trendLineOpacity: 0.8,
    trendLineType: "linear",
    trendLineWindow: 3,
    trendLineDegree: 2,
    enableAccessibility: true,
    enableTooltips: false,
    tooltipConfig: {},
    enableExport: true,
    exportConfig: {},
    enableZoom: false,
    zoomConfig: {},
    breakdownConfig: null,
    formattingRules: new Map(),
    enablePerformanceOptimization: false,
    performanceDashboard: false,
    virtualizationThreshold: 10000,
};

export function getBarWidth(scale: any, barCount: number, totalWidth: number): number {
    if (scale.bandwidth) {
        return scale.bandwidth();
    } else {
        const padding = 0.1;
        const availableWidth = totalWidth * (1 - padding);
        return availableWidth / barCount;
    }
}

export function getBarPosition(scale: any, value: any, barWidth: number): number {
    if (scale.bandwidth) {
        return scale(value);
    } else {
        return scale(value) - barWidth / 2;
    }
}

export function calculateIntelligentMargins(
    processedData: ProcessedData[],
    baseMargin: MarginConfig,
    width: number,
    height: number,
    formatNumber: (n: number) => string
): MarginConfig {
    const allValues = processedData.flatMap(d => [d.cumulativeTotal, d.prevCumulativeTotal || 0]);
    const maxValue = d3.max(allValues) || 0;
    const minValue = d3.min(allValues) || 0;

    const labelHeight = 16;
    const labelPadding = 8;
    const requiredLabelSpace = labelHeight + labelPadding;
    const safetyBuffer = 20;

    const hasNegativeValues = minValue < 0;
    const initialTopMargin = Math.max(baseMargin.top, 80);

    let tempYScale: any;
    const tempRange: [number, number] = [height - baseMargin.bottom, initialTopMargin];

    if (hasNegativeValues) {
        const range = maxValue - minValue;
        const padding = range * 0.05;
        tempYScale = d3.scaleLinear()
            .domain([minValue - padding, maxValue + padding])
            .range(tempRange);
    } else {
        const paddedMax = maxValue * 1.02;
        tempYScale = d3.scaleLinear()
            .domain([0, paddedMax])
            .range(tempRange)
            .nice();
    }

    const allLabelPositions = processedData.map(d => {
        const barTop = tempYScale(d.cumulativeTotal);
        return barTop - labelPadding;
    });

    const highestLabelPosition = Math.min(...allLabelPositions);
    const spaceNeededFromTop = Math.max(
        initialTopMargin - highestLabelPosition + requiredLabelSpace,
        requiredLabelSpace + safetyBuffer
    );
    const extraTopMarginNeeded = Math.max(0, spaceNeededFromTop - initialTopMargin);

    let extraBottomMargin = 0;
    if (hasNegativeValues) {
        const negativeData = processedData.filter(d => d.cumulativeTotal < 0);
        if (negativeData.length > 0) {
            const lowestLabelPosition = Math.max(
                ...negativeData.map(d => tempYScale(d.cumulativeTotal) + labelHeight + labelPadding)
            );
            if (lowestLabelPosition > height - baseMargin.bottom) {
                extraBottomMargin = lowestLabelPosition - (height - baseMargin.bottom);
            }
        }
    }

    const maxLabelLength = Math.max(...processedData.map(d => formatNumber(d.cumulativeTotal).length));
    const estimatedLabelWidth = maxLabelLength * 9;
    const minRightMargin = Math.max(baseMargin.right, estimatedLabelWidth / 2 + 15);

    return {
        top: initialTopMargin + extraTopMarginNeeded + safetyBuffer,
        right: minRightMargin,
        bottom: baseMargin.bottom + extraBottomMargin + (hasNegativeValues ? safetyBuffer : 10),
        left: baseMargin.left,
    };
}
