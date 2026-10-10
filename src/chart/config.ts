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
    /**
     * Render this bar as an opening balance: drawn from zero, colored like a total, and the
     * running total is reset to the sum of its stacks. Typically the first bar.
     */
    start?: boolean;
}

export interface ProcessedData extends ChartData {
    stacks: StackData[];
    barTotal: number;
    cumulativeTotal: number;
    prevCumulativeTotal?: number;
    stackPositions?: Array<{ start: number; end: number; color: string; value: number; label?: string }>;
    isTotal?: boolean;
    isSubtotal?: boolean;
    isStart?: boolean;
}

export type TooltipContentFn = (datum: ProcessedData, defaultHtml: string) => string;
export type ValueLabelFn = (datum: ProcessedData, defaultText: string) => string;

/** Semantic kind of a processed bar. */
export type BarKind = "start" | "increase" | "decrease" | "subtotal" | "total";

export function barKind(d: ProcessedData): BarKind {
    if (d.isTotal) return "total";
    if (d.isSubtotal) return "subtotal";
    if (d.isStart) return "start";
    return d.barTotal >= 0 ? "increase" : "decrease";
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

/** A marker drawn at `value` (on the value axis) above the bar with the same `label`. */
export interface Milestone {
    label: string;
    value: number;
    type: "target" | "threshold" | "alert" | "achievement";
    description?: string;
}

export interface MilestoneConfig {
    enabled: boolean;
    milestones: Milestone[];
}

/** Handler signatures for each chart event. `this` is the bar's `<g>` (bar events) or the `<svg>`. */
export interface ChartEventMap {
    barClick: (this: SVGGElement, event: MouseEvent | KeyboardEvent, datum: ProcessedData) => void;
    barMouseover: (this: SVGGElement, event: MouseEvent, datum: ProcessedData) => void;
    barMouseout: (this: SVGGElement, event: MouseEvent, datum: ProcessedData) => void;
    barFocus: (this: SVGGElement, event: FocusEvent, datum: ProcessedData) => void;
    chartUpdate: (this: SVGSVGElement, data: ProcessedData[]) => void;
    brushSelection: (this: SVGSVGElement, event: unknown, selected: ProcessedData[]) => void;
}

/** An event name, optionally with a d3-dispatch namespace: `"barClick"` or `"barClick.analytics"`. */
export type ChartEventName<K extends ChartEventType = ChartEventType> = K | `${K}.${string}`;

/**
 * `"auto"` follows the reader's `prefers-color-scheme` (default ↔ dark) and re-renders when it changes.
 */
export type ThemeName =
    | "auto"
    | "default"
    | "dark"
    | "corporate"
    | "accessible"
    | "colorful"
    | "financial"
    | "professional"
    | "heatmap";

/** "vertical" (default): columns. "horizontal": categories down the left, values along the bottom. */
export type Orientation = "vertical" | "horizontal";

export type TrendLineType = "linear" | "polynomial" | "moving-average";
export type TrendLineStyle = "solid" | "dashed" | "dotted";

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
    theme(): ThemeName | null;
    theme(value: ThemeName | null): WaterfallChart;
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
    trendLineStyle(): TrendLineStyle;
    trendLineStyle(value: TrendLineStyle): WaterfallChart;
    trendLineOpacity(): number;
    trendLineOpacity(value: number): WaterfallChart;
    trendLineType(): TrendLineType;
    trendLineType(value: TrendLineType): WaterfallChart;
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
    /**
     * Custom tooltip content. Receives the bar and the default HTML; return an HTML string.
     * The result is inserted as HTML: escape user-provided text with `escapeHtml`. `null` restores the default.
     */
    tooltipContent(): TooltipContentFn | null;
    tooltipContent(value: TooltipContentFn | null): WaterfallChart;
    /**
     * Custom value label text. Receives the bar and the default label (e.g. "+1,200");
     * return the text to show, or `""` to hide that bar's label. `null` restores the default.
     */
    valueLabel(): ValueLabelFn | null;
    valueLabel(value: ValueLabelFn | null): WaterfallChart;
    /**
     * Show a legend above the plot: stack segment labels when `stacked`, otherwise the bar
     * kinds present (increase, decrease, subtotal, total, opening).
     */
    showLegend(): boolean;
    showLegend(value: boolean): WaterfallChart;
    /**
     * Bar direction. Horizontal charts support bars, stacks, value labels, connectors, trend lines,
     * legend, tooltips, keyboard navigation and export; brush, zoom, time scales, confidence bands
     * and milestones are vertical-only and are ignored (with a console warning) when horizontal.
     */
    orientation(): Orientation;
    orientation(value: Orientation): WaterfallChart;
    /**
     * Shaded band between optimistic and pessimistic running totals. Scenario values are
     * per-bar changes matched to bars by label; subtotal, total and opening bars are handled
     * like the bars themselves. A partial object is merged into the current settings.
     * Vertical charts only.
     */
    confidenceBands(): ConfidenceBandConfig;
    confidenceBands(value: Partial<ConfidenceBandConfig>): WaterfallChart;
    enableConfidenceBands(): boolean;
    enableConfidenceBands(value: boolean): WaterfallChart;
    /** Milestone markers (target, threshold, alert, achievement). Vertical charts only. */
    milestones(): MilestoneConfig;
    milestones(value: Partial<MilestoneConfig>): WaterfallChart;
    enableMilestones(): boolean;
    enableMilestones(value: boolean): WaterfallChart;
    addMilestone(milestone: Milestone): WaterfallChart;
    /**
     * Register an event listener. Bar events receive `(event, datum)`;
     * `chartUpdate` receives `(processedData)`; `brushSelection` receives `(event, selectedData)`.
     * Supports d3-dispatch namespaces, e.g. `"barClick.analytics"`.
     */
    on<K extends ChartEventType>(event: ChartEventName<K>, handler: ChartEventMap[K] | null): WaterfallChart;
    on<K extends ChartEventType>(event: ChartEventName<K>): ChartEventMap[K] | undefined;
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
    theme: ThemeName | null;
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
    trendLineStyle: TrendLineStyle;
    trendLineOpacity: number;
    trendLineType: TrendLineType;
    trendLineWindow: number;
    trendLineDegree: number;
    enableAccessibility: boolean;
    enableTooltips: boolean;
    tooltipConfig: TooltipConfig;
    enableExport: boolean;
    exportConfig: ExportConfig;
    enableZoom: boolean;
    zoomConfig: ZoomConfig;
    responsive: boolean;
    showValueLabels: boolean;
    showConnectors: boolean;
    showGrid: boolean;
    barRadius: number;
    tooltipContent: TooltipContentFn | null;
    valueLabel: ValueLabelFn | null;
    showLegend: boolean;
    orientation: Orientation;
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
    responsive: false,
    showValueLabels: true,
    showConnectors: true,
    showGrid: true,
    barRadius: 3,
    tooltipContent: null,
    valueLabel: null,
    showLegend: false,
    orientation: "vertical",
};


/** Categorical (default) or time-based x scale. */
export type XScale = d3.ScaleBand<string> | d3.ScaleTime<number, number>;
export type YScale = d3.ScaleLinear<number, number>;

export function isBandScale(scale: XScale): scale is d3.ScaleBand<string> {
    return typeof (scale as d3.ScaleBand<string>).bandwidth === "function";
}

/** Centre x of a bar's label on either scale type. Time labels are parsed as dates. */
export function getBarCenter(scale: XScale, label: string): number {
    if (isBandScale(scale)) return (scale(label) ?? 0) + scale.bandwidth() / 2;
    return scale(new Date(label));
}

/**
 * Bar width. Band scales use their bandwidth; time scales use the smallest gap between
 * consecutive dates (so bars never overlap), falling back to an even share of the width.
 */
export function getBarWidth(scale: XScale, labels: string[] | number, totalWidth: number): number {
    if (isBandScale(scale)) {
        return scale.bandwidth();
    }
    const padding = 0.25;
    const count = typeof labels === "number" ? labels : labels.length;
    let width = (totalWidth * (1 - padding)) / Math.max(1, count);
    if (Array.isArray(labels) && labels.length > 1) {
        const xs = labels.map(l => scale(new Date(l))).filter(Number.isFinite).sort((a, b) => a - b);
        let gap = Infinity;
        for (let i = 1; i < xs.length; i++) gap = Math.min(gap, xs[i] - xs[i - 1]);
        if (Number.isFinite(gap) && gap > 0) width = Math.min(width, gap * (1 - padding));
    }
    return Math.max(1, width);
}

/** Left x of a bar. */
export function getBarPosition(scale: XScale, label: string, barWidth: number): number {
    if (isBandScale(scale)) {
        return scale(label) ?? 0;
    }
    return scale(new Date(label)) - barWidth / 2;
}

/** True for bars that are drawn from zero (opening balance, subtotals, grand total). */
export function isAnchoredBar(d: ProcessedData): boolean {
    return Boolean(d.isTotal || d.isSubtotal || d.isStart);
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
        if (stacked && (!isAnchoredBar(d) || d.isStart)) {
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
    /** Horizontal charts: truncate category labels to this many characters (0 = no limit). */
    categoryLabelChars: number;
    /** Horizontal charts: pixels reserved beyond bar ends for value labels. */
    valueLabelReserve: number;
}

const CHAR_WIDTH = 7;

/** Shorten text to `max` characters with an ellipsis (0 = unchanged). */
export function truncateLabel(text: string, max: number): string {
    const s = String(text);
    return max > 0 && s.length > max ? `${s.slice(0, Math.max(1, max - 1))}\u2026` : s;
}

/**
 * Layout for horizontal charts: categories on the left axis, values along the bottom.
 * The left margin fits category labels (capped at 35% of the width, longer labels are
 * truncated); value labels sit past the bar ends, so their width is reserved in the plot.
 */
export function computeHorizontalLayout(
    data: ProcessedData[],
    base: MarginConfig,
    width: number,
    height: number,
    _yDomain: [number, number],
    formatNumber: (n: number) => string,
    showValueLabels: boolean,
    labelText?: (d: ProcessedData) => string,
    topExtra = 0
): LayoutMetrics {
    const longestCategory = Math.max(1, ...data.map(d => String(d.label).length));
    const maxLeft = Math.floor(width * 0.35);
    const wantedLeft = longestCategory * CHAR_WIDTH + 18;
    const left = Math.max(base.left, Math.min(wantedLeft, maxLeft));
    const categoryLabelChars = wantedLeft > maxLeft ? Math.max(3, Math.floor((maxLeft - 18) / CHAR_WIDTH)) : 0;

    const top = Math.max(base.top, 12) + topExtra;
    const right = Math.max(base.right, 16);
    const bottom = Math.max(base.bottom, 36);

    const plotWidth = Math.max(60, width - left - right);
    const plotHeight = Math.max(1, height - top - bottom);
    const step = plotHeight / Math.max(1, data.length);
    const yTickCount = Math.max(2, Math.min(10, Math.round(plotWidth / 90)));

    // Bars are `step` tall: show every label when they fit, otherwise thin them out
    const xLabelEvery = Math.max(1, Math.ceil(14 / step));

    let valueLabelFontSize = 0;
    let valueLabelReserve = 0;
    if (showValueLabels) {
        if (step >= 15) valueLabelFontSize = 12;
        else if (step >= 12) valueLabelFontSize = 10;
        if (valueLabelFontSize > 0) {
            const longestValue = Math.max(
                1,
                ...data.map(d =>
                    labelText
                        ? String(labelText(d)).length
                        : String(formatNumber(Math.abs(d.barTotal))).length + (isAnchoredBar(d) ? 0 : 1)
                )
            );
            valueLabelReserve = Math.ceil(longestValue * (valueLabelFontSize * 0.6)) + 10;
            // Too little room for the labels: hide them rather than squash the bars
            if (valueLabelReserve * 2 > plotWidth * 0.6) {
                valueLabelFontSize = 0;
                valueLabelReserve = 0;
            }
        }
    }

    return {
        margins: { top, right, bottom, left },
        wrappedXLabels: null,
        rotateXLabels: false,
        xLabelEvery,
        valueLabelFontSize,
        yTickCount,
        categoryLabelChars,
        valueLabelReserve,
    };
}

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
    showValueLabels: boolean,
    /** Text of each value label; defaults to the signed formatted value. */
    labelText?: (d: ProcessedData) => string,
    /** Extra space reserved above the plot (e.g. for a legend). */
    topExtra = 0
): LayoutMetrics {
    const plotHeightEstimate = Math.max(60, height - base.top - base.bottom);
    const yTickCount = Math.max(2, Math.min(10, Math.round(plotHeightEstimate / 56)));
    const ticks = d3.scaleLinear().domain(yDomain).nice(yTickCount).ticks(yTickCount);
    const longestTick = Math.max(1, ...ticks.map(t => String(formatNumber(t)).length));
    const left = Math.max(base.left, longestTick * CHAR_WIDTH + 18);

    const top = Math.max(base.top, showValueLabels ? 28 : 12) + topExtra;
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
            ...data.map(d =>
                labelText
                    ? String(labelText(d)).length
                    : String(formatNumber(Math.abs(d.barTotal))).length + (isAnchoredBar(d) ? 0 : 1)
            )
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
        categoryLabelChars: 0,
        valueLabelReserve: 0,
    };
}
