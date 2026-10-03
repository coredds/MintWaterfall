// MintWaterfall Chart Configuration
import * as d3 from "d3";

export interface StackData {
    value: number;
    /** Optional fill color. When omitted the chart picks a semantic/theme color. */
    color?: string;
    label?: string;
}

export interface ChartData {
    label: string;
    /** Segments of this step. May be omitted for `subtotal` bars. */
    stacks?: StackData[];
    /**
     * Render this bar as a subtotal: a bar from zero to the running total at this
     * point. The bar's own stack values are ignored for the running total.
     */
    subtotal?: boolean;
}

export interface ProcessedData extends ChartData {
    stacks: StackData[];
    barTotal: number;
    cumulativeTotal: number;
    prevCumulativeTotal?: number;
    stackPositions?: Array<{ start: number; end: number; color: string; value: number; label?: string }>;
    isTotal?: boolean;
    isSubtotal?: boolean;
}

export type ChartEventType =
    | "barClick"
    | "barMouseover"
    | "barMouseout"
    | "barFocus"
    | "chartUpdate"
    | "brushSelection";

export type ChartExportFormat = "svg" | "png" | "json" | "csv";

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
    /** Scale the SVG to the width of its container (keeps aspect ratio). */
    responsive(): boolean;
    responsive(value: boolean): WaterfallChart;
    showValueLabels(): boolean;
    showValueLabels(value: boolean): WaterfallChart;
    showConnectors(): boolean;
    showConnectors(value: boolean): WaterfallChart;
    showGrid(): boolean;
    showGrid(value: boolean): WaterfallChart;
    /** Corner radius for bars, in pixels. */
    barRadius(): number;
    barRadius(value: number): WaterfallChart;
    /** @deprecated Has no effect. Will be removed in 2.0. */
    breakdownConfig(): BreakdownConfig | null;
    /** @deprecated Has no effect. Will be removed in 2.0. */
    breakdownConfig(value: BreakdownConfig | null): WaterfallChart;
    /** @deprecated Has no effect. Will be removed in 2.0. */
    enablePerformanceOptimization(): boolean;
    /** @deprecated Has no effect. Will be removed in 2.0. */
    enablePerformanceOptimization(value: boolean): WaterfallChart;
    /** @deprecated Has no effect. Will be removed in 2.0. */
    performanceDashboard(): boolean;
    /** @deprecated Has no effect. Will be removed in 2.0. */
    performanceDashboard(value: boolean): WaterfallChart;
    /** @deprecated Has no effect. Will be removed in 2.0. */
    virtualizationThreshold(): number;
    /** @deprecated Has no effect. Will be removed in 2.0. */
    virtualizationThreshold(value: number): WaterfallChart;
    /**
     * Register an event listener. Bar events receive `(event, datum)`;
     * `chartUpdate` receives `(processedData)`; `brushSelection` receives `(event, selectedData)`.
     * Supports d3-dispatch namespaces, e.g. `"barClick.analytics"`.
     */
    on(event: string, handler: ((...args: any[]) => void) | null): WaterfallChart;
    on(event: string): ((...args: any[]) => void) | undefined;
    data(): ChartData[] | null;
    data(value: ChartData[] | null): WaterfallChart;
    /** Export the most recently rendered chart. Requires `enableExport(true)` (default). */
    export(format: ChartExportFormat, options?: Record<string, any>): Promise<{ blob: Blob; url: string; data: string | Blob; download: () => void }>;
    /** Remove the tooltip element and detach zoom/brush listeners. */
    destroy(): void;
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
    responsive: boolean;
    showValueLabels: boolean;
    showConnectors: boolean;
    showGrid: boolean;
    barRadius: number;
}

export const defaultConfig: ChartConfig = {
    width: 800,
    height: 400,
    margin: { top: 32, right: 24, bottom: 48, left: 56 },
    showTotal: false,
    totalLabel: "Total",
    totalColor: "#475569",
    stacked: false,
    barPadding: 0.24,
    duration: 650,
    ease: d3.easeCubicOut,
    formatNumber: d3.format(",.0f"),
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
    trendLineColor: "#6366f1",
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
    responsive: false,
    showValueLabels: true,
    showConnectors: true,
    showGrid: true,
    barRadius: 3,
};


export function getBarWidth(scale: any, barCount: number, totalWidth: number): number {
    if (scale.bandwidth) {
        return scale.bandwidth();
    }
    const padding = 0.25;
    return (totalWidth * (1 - padding)) / Math.max(1, barCount);
}

export function getBarPosition(scale: any, value: any, barWidth: number): number {
    if (scale.bandwidth) {
        return scale(value);
    }
    return scale(value) - barWidth / 2;
}

/** True for bars that are drawn from zero (grand total and subtotals). */
export function isAnchoredBar(d: ProcessedData): boolean {
    return Boolean(d.isTotal || d.isSubtotal);
}

/** The [low, high] value extent a bar covers on the y axis. */
export function getBarExtent(d: ProcessedData): [number, number] {
    const start = isAnchoredBar(d) ? 0 : d.prevCumulativeTotal || 0;
    const end = d.cumulativeTotal;
    return [Math.min(start, end), Math.max(start, end)];
}

/**
 * Y domain covering every bar (and every intermediate stack position when stacked),
 * always including zero so bar lengths are honest.
 */
export function computeYDomain(data: ProcessedData[], stacked: boolean): [number, number] {
    let min = 0;
    let max = 0;
    for (const d of data) {
        const [lo, hi] = getBarExtent(d);
        min = Math.min(min, lo);
        max = Math.max(max, hi);
        if (stacked && !isAnchoredBar(d)) {
            let running = d.prevCumulativeTotal || 0;
            for (const s of d.stacks) {
                running += s.value;
                min = Math.min(min, running);
                max = Math.max(max, running);
            }
        }
    }
    if (min === max) {
        max = min + 1;
    }
    return [min, max];
}

/**
 * Round the domain out to tick boundaries, but only on sides where that costs at most
 * `maxWaste` of the extent. Otherwise (e.g. a running total dipping to −8 on a 0–2,400 chart)
 * keep the data edge with a little padding instead of adding a mostly empty tick band.
 */
export function niceDomain(domain: [number, number], tickCount: number, maxWaste = 0.1): [number, number] {
    const [lo, hi] = domain;
    const extent = hi - lo || 1;
    const [n0, n1] = d3.scaleLinear().domain(domain).nice(tickCount).domain() as [number, number];
    const pad = extent * 0.02;
    return [
        lo - n0 <= extent * maxWaste ? n0 : lo - pad,
        n1 - hi <= extent * maxWaste ? n1 : hi + pad,
    ];
}

export interface LayoutMetrics {
    margins: MarginConfig;
    /** Per-label lines when labels are wrapped; null when not wrapping. */
    wrappedXLabels: Map<string, string[]> | null;
    rotateXLabels: boolean;
    /** Show every Nth x-axis label (1 = all). */
    xLabelEvery: number;
    /** Font size for value labels in px, or 0 when they do not fit and are hidden. */
    valueLabelFontSize: number;
    yTickCount: number;
}

const CHAR_WIDTH = 7;

/**
 * Greedy word-wrap into at most `maxLines` lines of `maxChars` characters.
 * Returns null when the text cannot fit.
 */
export function wrapLabel(text: string, maxChars: number, maxLines = 2): string[] | null {
    const words = String(text).split(/\s+/).filter(Boolean);
    const lines: string[] = [];
    let current = "";
    for (const word of words) {
        if (word.length > maxChars) return null;
        const candidate = current ? `${current} ${word}` : word;
        if (candidate.length <= maxChars) {
            current = candidate;
        } else {
            lines.push(current);
            current = word;
        }
    }
    if (current) lines.push(current);
    return lines.length <= maxLines ? lines : null;
}

/**
 * Compute margins that fit the y-axis tick labels, value labels above the tallest
 * bar, and (possibly rotated) x-axis labels.
 */
export function computeLayout(
    data: ProcessedData[],
    base: MarginConfig,
    width: number,
    height: number,
    yDomain: [number, number],
    formatNumber: (n: number) => string,
    showValueLabels: boolean
): LayoutMetrics {
    const plotHeightEstimate = Math.max(60, height - base.top - base.bottom);
    const yTickCount = Math.max(2, Math.min(10, Math.round(plotHeightEstimate / 56)));
    const ticks = d3.scaleLinear().domain(yDomain).nice(yTickCount).ticks(yTickCount);
    const longestTick = Math.max(1, ...ticks.map(t => String(formatNumber(t)).length));
    const left = Math.max(base.left, longestTick * CHAR_WIDTH + 18);

    const top = Math.max(base.top, showValueLabels ? 28 : 12);
    const right = Math.max(base.right, 12);

    const plotWidth = Math.max(1, width - left - right);
    const step = plotWidth / Math.max(1, data.length);
    const longestLabel = Math.max(1, ...data.map(d => String(d.label).length));
    const maxChars = Math.max(1, Math.floor((step * 0.92) / CHAR_WIDTH));
    const overflow = longestLabel > maxChars;

    let wrappedXLabels: Map<string, string[]> | null = null;
    if (overflow) {
        const wrapped = new Map<string, string[]>();
        const ok = data.every(d => {
            const lines = wrapLabel(d.label, maxChars);
            if (lines) wrapped.set(d.label, lines);
            return lines !== null;
        });
        if (ok) wrappedXLabels = wrapped;
    }
    const rotateXLabels = overflow && wrappedXLabels === null;
    const extra = rotateXLabels ? Math.min(90, longestLabel * CHAR_WIDTH * 0.57) : wrappedXLabels ? 14 : 0;
    const bottom = Math.max(base.bottom, 32 + extra);

    // Rotated labels are parallel lines; they need ~23px of horizontal spacing at -35deg
    const xLabelEvery = rotateXLabels ? Math.max(1, Math.ceil(23 / step)) : 1;

    // Value labels may overhang their bar but must fit within one step
    let valueLabelFontSize = 0;
    if (showValueLabels) {
        const longestValue = Math.max(
            1,
            ...data.map(d => String(formatNumber(Math.abs(d.barTotal))).length + (isAnchoredBar(d) ? 0 : 1))
        );
        const room = step * 0.94;
        if (longestValue * 7.2 <= room) valueLabelFontSize = 12;
        else if (longestValue * 6 <= room) valueLabelFontSize = 10;
    }

    return {
        margins: { top, right, bottom, left },
        wrappedXLabels,
        rotateXLabels,
        xLabelEvery,
        valueLabelFontSize,
        yTickCount,
    };
}
