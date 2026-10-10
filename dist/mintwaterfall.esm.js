/*!
 * MintWaterfall v2.2.0
 * D3.js-compatible waterfall chart component
 * (c) 2024-2026 David Duarte
 * Released under the MIT License
 */
import * as d3 from 'd3';
import { group, index, cross, flatRollup, rollup, ascending, bisector, deviation, variance, median, quantile, rgb } from 'd3';

// MintWaterfall Chart Configuration
function barKind(d) {
    if (d.isTotal)
        return "total";
    if (d.isSubtotal)
        return "subtotal";
    if (d.isStart)
        return "start";
    return d.barTotal >= 0 ? "increase" : "decrease";
}
const defaultConfig = {
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
function isBandScale(scale) {
    return typeof scale.bandwidth === "function";
}
/** Centre x of a bar's label on either scale type. Time labels are parsed as dates. */
function getBarCenter(scale, label) {
    if (isBandScale(scale))
        return (scale(label) ?? 0) + scale.bandwidth() / 2;
    return scale(new Date(label));
}
/**
 * Bar width. Band scales use their bandwidth; time scales use the smallest gap between
 * consecutive dates (so bars never overlap), falling back to an even share of the width.
 */
function getBarWidth(scale, labels, totalWidth) {
    if (isBandScale(scale)) {
        return scale.bandwidth();
    }
    const padding = 0.25;
    const count = typeof labels === "number" ? labels : labels.length;
    let width = (totalWidth * (1 - padding)) / Math.max(1, count);
    if (Array.isArray(labels) && labels.length > 1) {
        const xs = labels
            .map(l => scale(new Date(l)))
            .filter(Number.isFinite)
            .sort((a, b) => a - b);
        let gap = Infinity;
        for (let i = 1; i < xs.length; i++)
            gap = Math.min(gap, xs[i] - xs[i - 1]);
        if (Number.isFinite(gap) && gap > 0)
            width = Math.min(width, gap * (1 - padding));
    }
    return Math.max(1, width);
}
/** Left x of a bar. */
function getBarPosition(scale, label, barWidth) {
    if (isBandScale(scale)) {
        return scale(label) ?? 0;
    }
    return scale(new Date(label)) - barWidth / 2;
}
/** True for bars that are drawn from zero (opening balance, subtotals, grand total). */
function isAnchoredBar(d) {
    return Boolean(d.isTotal || d.isSubtotal || d.isStart);
}
/** The [low, high] value extent a bar covers on the y axis. */
function getBarExtent(d) {
    const start = isAnchoredBar(d) ? 0 : d.prevCumulativeTotal || 0;
    const end = d.cumulativeTotal;
    return [Math.min(start, end), Math.max(start, end)];
}
/**
 * Y domain covering every bar (and every intermediate stack position when stacked),
 * always including zero so bar lengths are honest.
 */
function computeYDomain(data, stacked) {
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
function niceDomain(domain, tickCount, maxWaste = 0.1) {
    const [lo, hi] = domain;
    const extent = hi - lo || 1;
    const [n0, n1] = d3.scaleLinear().domain(domain).nice(tickCount).domain();
    const pad = extent * 0.02;
    return [lo - n0 <= extent * maxWaste ? n0 : lo - pad, n1 - hi <= extent * maxWaste ? n1 : hi + pad];
}
const CHAR_WIDTH = 7;
/** Shorten text to `max` characters with an ellipsis (0 = unchanged). */
function truncateLabel(text, max) {
    const s = String(text);
    return max > 0 && s.length > max ? `${s.slice(0, Math.max(1, max - 1))}\u2026` : s;
}
/**
 * Layout for horizontal charts: categories on the left axis, values along the bottom.
 * The left margin fits category labels (capped at 35% of the width, longer labels are
 * truncated); value labels sit past the bar ends, so their width is reserved in the plot.
 */
function computeHorizontalLayout(data, base, width, height, _yDomain, formatNumber, showValueLabels, labelText, topExtra = 0) {
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
        if (step >= 15)
            valueLabelFontSize = 12;
        else if (step >= 12)
            valueLabelFontSize = 10;
        if (valueLabelFontSize > 0) {
            const longestValue = Math.max(1, ...data.map(d => labelText ? String(labelText(d)).length : String(formatNumber(Math.abs(d.barTotal))).length + (isAnchoredBar(d) ? 0 : 1)));
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
function wrapLabel(text, maxChars, maxLines = 2) {
    const words = String(text).split(/\s+/).filter(Boolean);
    const lines = [];
    let current = "";
    for (const word of words) {
        if (word.length > maxChars)
            return null;
        const candidate = current ? `${current} ${word}` : word;
        if (candidate.length <= maxChars) {
            current = candidate;
        }
        else {
            lines.push(current);
            current = word;
        }
    }
    if (current)
        lines.push(current);
    return lines.length <= maxLines ? lines : null;
}
/**
 * Compute margins that fit the y-axis tick labels, value labels above the tallest
 * bar, and (possibly rotated) x-axis labels.
 */
function computeLayout(data, base, width, height, yDomain, formatNumber, showValueLabels, 
/** Text of each value label; defaults to the signed formatted value. */
labelText, 
/** Extra space reserved above the plot (e.g. for a legend). */
topExtra = 0) {
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
    let wrappedXLabels = null;
    if (overflow) {
        const wrapped = new Map();
        const ok = data.every(d => {
            const lines = wrapLabel(d.label, maxChars);
            if (lines)
                wrapped.set(d.label, lines);
            return lines !== null;
        });
        if (ok)
            wrappedXLabels = wrapped;
    }
    const rotateXLabels = overflow && wrappedXLabels === null;
    const extra = rotateXLabels ? Math.min(90, longestLabel * CHAR_WIDTH * 0.57) : wrappedXLabels ? 14 : 0;
    const bottom = Math.max(base.bottom, 32 + extra);
    // Rotated labels are parallel lines; they need ~23px of horizontal spacing at -35deg
    const xLabelEvery = rotateXLabels ? Math.max(1, Math.ceil(23 / step)) : 1;
    // Value labels may overhang their bar but must fit within one step
    let valueLabelFontSize = 0;
    if (showValueLabels) {
        const longestValue = Math.max(1, ...data.map(d => labelText ? String(labelText(d)).length : String(formatNumber(Math.abs(d.barTotal))).length + (isAnchoredBar(d) ? 0 : 1)));
        const room = step * 0.94;
        if (longestValue * 7.2 <= room)
            valueLabelFontSize = 12;
        else if (longestValue * 6 <= room)
            valueLabelFontSize = 10;
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

/**
 * Compute running totals for each bar.
 *
 * - Regular bars move the running total by the sum of their stack values.
 * - `subtotal` bars show the running total at that point (drawn from zero) and do
 *   not change it.
 * - When `config.showTotal` is set, a final total bar is appended.
 */
function prepareData(data, config) {
    let cumulativeTotal = 0;
    const processedData = data.map(bar => {
        if (bar.subtotal) {
            const color = bar.stacks?.[0]?.color ?? config.totalColor;
            return {
                ...bar,
                stacks: [{ value: cumulativeTotal, color, label: bar.stacks?.[0]?.label }],
                barTotal: cumulativeTotal,
                cumulativeTotal,
                prevCumulativeTotal: 0,
                isSubtotal: true,
            };
        }
        const stacks = bar.stacks || [];
        const barTotal = stacks.reduce((sum, stack) => sum + stack.value, 0);
        if (bar.start) {
            cumulativeTotal = barTotal;
            return { ...bar, stacks, barTotal, cumulativeTotal, prevCumulativeTotal: 0, isStart: true };
        }
        const prevCumulativeTotal = cumulativeTotal;
        cumulativeTotal += barTotal;
        return {
            ...bar,
            stacks,
            barTotal,
            cumulativeTotal,
            prevCumulativeTotal,
        };
    });
    if (config.showTotal && processedData.length > 0) {
        processedData.push({
            label: config.totalLabel,
            stacks: [{ value: cumulativeTotal, color: config.totalColor }],
            barTotal: cumulativeTotal,
            cumulativeTotal,
            prevCumulativeTotal: 0,
            isTotal: true,
        });
    }
    return processedData;
}

// MintWaterfall Theme System
// Predefined themes, D3 color schemes, and color helpers.
const themes = {
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
            interpolator: (t) => d3.interpolateHsl("#ffffff", "#000000")(t),
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
function applyTheme(chart, themeName = "default") {
    const theme = themes[themeName] || themes.default;
    // Apply theme colors to chart configuration
    chart.totalColor(theme.totalColor);
    return theme;
}
function getThemeColorPalette(themeName = "default") {
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
function createSequentialScale(domain, themeName = "default") {
    const theme = themes[themeName] || themes.default;
    const interpolator = theme.sequentialScale?.interpolator || d3.interpolateBlues;
    return d3.scaleSequential(interpolator).domain(domain);
}
/**
 * Create a diverging color scale for data with a meaningful center point (e.g., zero)
 * Perfect for positive/negative value emphasis in waterfall charts
 */
function createDivergingScale(domain, themeName = "default") {
    const theme = themes[themeName] || themes.default;
    const interpolator = theme.divergingScale?.interpolator || d3.interpolateRdYlBu;
    return d3.scaleDiverging(interpolator).domain(domain);
}
/**
 * Get conditional formatting color based on value
 * Returns appropriate color for positive, negative, or neutral values
 */
function getConditionalColor(value, themeName = "default", neutralThreshold = 0) {
    const theme = themes[themeName] || themes.default;
    const formatting = theme.conditionalFormatting || {
        positive: "#2ecc71",
        negative: "#e74c3c",
        neutral: "#95a5a6",
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
function createWaterfallColorScale(data, themeName = "default", scaleType = "auto") {
    const values = data.map(d => d.value);
    const extent = d3.extent(values);
    const hasPositiveAndNegative = extent[0] < 0 && extent[1] > 0;
    // Auto-detect scale type
    if (scaleType === "auto") {
        scaleType = hasPositiveAndNegative ? "diverging" : "sequential";
    }
    if (scaleType === "diverging" && hasPositiveAndNegative) {
        const maxAbs = Math.max(Math.abs(extent[0]), Math.abs(extent[1]));
        return createDivergingScale([-maxAbs, 0, maxAbs], themeName);
    }
    else {
        return createSequentialScale(extent, themeName);
    }
}
/**
 * Apply color interpolation to a value within a range
 * Useful for creating smooth color transitions in large datasets
 */
function interpolateThemeColor(value, domain, themeName = "default") {
    const theme = themes[themeName] || themes.default;
    const interpolator = theme.sequentialScale?.interpolator || d3.interpolateBlues;
    const span = domain[1] - domain[0];
    // A degenerate domain (all values equal) maps to the midpoint, like d3.scaleSequential
    const normalizedValue = span ? (value - domain[0]) / span : 0.5;
    return interpolator(Math.max(0, Math.min(1, Number.isFinite(normalizedValue) ? normalizedValue : 0.5)));
}
/**
 * Get advanced bar color based on value, context, and theme
 * This is the main function for determining bar colors with advanced features
 */
function getAdvancedBarColor(value, defaultColor, allData = [], themeName = "default", colorMode = "conditional") {
    switch (colorMode) {
        case "conditional":
            return getConditionalColor(value, themeName);
        case "sequential":
            if (allData.length > 0) {
                const values = allData.map(d => d.barTotal || d.value || 0);
                const domain = d3.extent(values);
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
const financialThemes = {
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
            interpolator: (t) => d3.interpolateHsl("#f0f8ff", "#1f4e79")(t),
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

// MintWaterfall — resolved visual style tokens
const FONT_FAMILY = 'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
function isDark(hex) {
    const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
    if (!m)
        return false;
    const n = parseInt(m[1], 16);
    const r = (n >> 16) & 255;
    const g = (n >> 8) & 255;
    const b = n & 255;
    return 0.2126 * r + 0.7152 * g + 0.0722 * b < 128;
}
/** True when the reader's OS/browser asks for a dark color scheme. */
function prefersDarkScheme() {
    try {
        return typeof window !== "undefined" && typeof window.matchMedia === "function"
            ? window.matchMedia("(prefers-color-scheme: dark)").matches
            : false;
    }
    catch {
        return false;
    }
}
/** The concrete theme for a config: `"auto"` resolves to `"dark"` or `"default"`. */
function resolvedThemeName(config) {
    if (config.theme === "auto")
        return prefersDarkScheme() ? "dark" : "default";
    return config.theme;
}
/**
 * Build the style tokens for a render. Without an explicit theme the chart has a
 * transparent background and uses the default theme's tokens.
 */
function resolveStyle(config) {
    const name = resolvedThemeName(config);
    const explicitTheme = name ? themes[name] : undefined;
    const theme = explicitTheme || themes.default;
    const fmt = theme.conditionalFormatting || { positive: "#10b981", negative: "#ef4444"};
    const dark = isDark(theme.background);
    return {
        background: explicitTheme ? theme.background : null,
        surface: explicitTheme ? theme.background : "#ffffff",
        text: theme.textColor,
        mutedText: dark ? "#94a3b8" : "#64748b",
        grid: theme.gridColor,
        axis: theme.axisColor,
        connector: dark ? "#64748b" : "#94a3b8",
        positive: fmt.positive,
        negative: fmt.negative,
        total: config.totalColor,
        accent: theme.colors[0] || "#6366f1",
        palette: theme.colors,
        fontFamily: FONT_FAMILY,
    };
}

// MintWaterfall Enhanced Shape Generators - TypeScript Version
// Provides advanced D3.js shape generators for waterfall chart enhancements
// ============================================================================
// SHAPE GENERATOR IMPLEMENTATION
// ============================================================================
function createShapeGenerators() {
    // Available curve types for enhanced visualization
    const curveTypes = {
        linear: d3.curveLinear,
        basis: d3.curveBasis,
        cardinal: d3.curveCardinal,
        catmullRom: d3.curveCatmullRom,
        monotoneX: d3.curveMonotoneX,
        monotoneY: d3.curveMonotoneY,
        natural: d3.curveNatural,
        step: d3.curveStep,
        stepBefore: d3.curveStepBefore,
        stepAfter: d3.curveStepAfter,
        bumpX: d3.curveBumpX,
        bumpY: d3.curveBumpY,
    };
    // Available symbol types for data point markers
    const symbolTypes = {
        circle: d3.symbolCircle,
        square: d3.symbolSquare,
        triangle: d3.symbolTriangle,
        diamond: d3.symbolDiamond,
        star: d3.symbolStar,
        cross: d3.symbolCross,
        wye: d3.symbolWye,
    };
    // ========================================================================
    // AREA GENERATORS
    // ========================================================================
    /**
     * Create confidence band area for uncertainty visualization
     * Perfect for showing confidence intervals around waterfall projections
     */
    function createConfidenceBand(data, config = {}) {
        const { curve = d3.curveMonotoneX } = config;
        const areaGenerator = d3
            .area()
            .x(d => d.x)
            .y0(d => d.yLower)
            .y1(d => d.yUpper)
            .curve(curve);
        return areaGenerator(data) || "";
    }
    /**
     * Create envelope area between two data series
     * Useful for showing range between scenarios in waterfall analysis
     */
    function createEnvelopeArea(data, config = {}) {
        const { curve = d3.curveMonotoneX } = config;
        const areaGenerator = d3
            .area()
            .x(d => d.x)
            .y0(d => d.y0)
            .y1(d => d.y1)
            .curve(curve);
        return areaGenerator(data) || "";
    }
    // ========================================================================
    // SYMBOL GENERATORS
    // ========================================================================
    /**
     * Create data point markers for highlighting key values
     * Perfect for marking important milestones in waterfall progression
     */
    function createDataPointMarkers(data, config = {}) {
        const { size = 64, fillColor = "#3498db", strokeColor = "#ffffff", strokeWidth = 2 } = config;
        return data.map(point => {
            const symbolType = symbolTypes[point.type] || d3.symbolCircle;
            const symbolSize = point.size || size;
            const symbolGenerator = d3.symbol().type(symbolType).size(symbolSize);
            return {
                path: symbolGenerator() || "",
                transform: `translate(${point.x}, ${point.y})`,
                config: {
                    ...config,
                    fillColor: point.color || fillColor,
                    strokeColor,
                    strokeWidth,
                },
            };
        });
    }
    /**
     * Create custom symbol path
     * Allows for creating unique markers for specific data points
     */
    function createCustomSymbol(type, size = 64) {
        const symbolType = symbolTypes[type] || d3.symbolCircle;
        const symbolGenerator = d3.symbol().type(symbolType).size(size);
        return symbolGenerator() || "";
    }
    // ========================================================================
    // ENHANCED TREND LINES
    // ========================================================================
    /**
     * Create smooth trend line with enhanced curve support
     * Provides better visual flow for waterfall trend analysis
     */
    function createSmoothTrendLine(data, config = {}) {
        const { curve = d3.curveMonotoneX } = config;
        const lineGenerator = d3
            .line()
            .x(d => d.x)
            .y(d => d.y)
            .curve(curve);
        return lineGenerator(data) || "";
    }
    /**
     * Create multiple trend lines for comparison analysis
     * Useful for comparing different scenarios or time periods
     */
    function createMultipleTrendLines(datasets) {
        return datasets.map(dataset => {
            return createSmoothTrendLine(dataset.data, dataset.config);
        });
    }
    // ========================================================================
    // UTILITY FUNCTIONS
    // ========================================================================
    function getCurveTypes() {
        return { ...curveTypes };
    }
    function getSymbolTypes() {
        return { ...symbolTypes };
    }
    // ========================================================================
    // RETURN API
    // ========================================================================
    return {
        // Area generators
        createConfidenceBand,
        createEnvelopeArea,
        // Symbol generators
        createDataPointMarkers,
        createCustomSymbol,
        // Enhanced trend lines
        createSmoothTrendLine,
        createMultipleTrendLines,
        // Utility functions
        getCurveTypes,
        getSymbolTypes,
    };
}
function centerOf(x, label) {
    if (typeof x.bandwidth === "function") {
        const band = x;
        return (band(label) ?? 0) + band.bandwidth() / 2;
    }
    return x(label);
}
/**
 * Create confidence bands specifically for waterfall financial projections
 * Combines multiple projection scenarios into visual uncertainty bands.
 *
 * Values are changes, accumulated into running totals per scenario. Scenario entries are
 * matched to baseline items by label (falling back to position for entries without a label).
 * Baseline items flagged `subtotal` show the running total without changing it; items flagged
 * `start` reset every running total to their own (or the scenario's) value.
 */
function createWaterfallConfidenceBands(baselineData, scenarios, xScale, yScale) {
    const shapeGenerator = createShapeGenerators();
    // Calculate cumulative values for each scenario
    let baselineCumulative = 0;
    let optimisticCumulative = 0;
    let pessimisticCumulative = 0;
    const lookup = (entries) => {
        const byLabel = new Map(entries.filter(e => e.label != null).map(e => [e.label, e.value]));
        return (item, i) => byLabel.has(item.label) ? byLabel.get(item.label) : entries[i]?.label == null ? entries[i]?.value : undefined;
    };
    const optimisticValue = lookup(scenarios.optimistic);
    const pessimisticValue = lookup(scenarios.pessimistic);
    const confidenceData = baselineData.map((item, i) => {
        if (item.start) {
            baselineCumulative = item.value;
            optimisticCumulative = optimisticValue(item, i) ?? item.value;
            pessimisticCumulative = pessimisticValue(item, i) ?? item.value;
        }
        else if (!item.subtotal) {
            baselineCumulative += item.value;
            // `??` so an explicit scenario value of 0 is respected
            optimisticCumulative += optimisticValue(item, i) ?? item.value;
            pessimisticCumulative += pessimisticValue(item, i) ?? item.value;
        }
        const x = centerOf(xScale, item.label);
        return {
            x,
            y: yScale(baselineCumulative),
            yUpper: yScale(optimisticCumulative),
            yLower: yScale(pessimisticCumulative),
            label: item.label,
        };
    });
    // Create trend lines for each scenario
    const optimisticTrendData = confidenceData.map(d => ({ x: d.x, y: d.yUpper }));
    const pessimisticTrendData = confidenceData.map(d => ({ x: d.x, y: d.yLower }));
    return {
        confidencePath: shapeGenerator.createConfidenceBand(confidenceData, {
            fillColor: "rgba(52, 152, 219, 0.2)",
            curve: d3.curveMonotoneX,
        }),
        optimisticPath: shapeGenerator.createSmoothTrendLine(optimisticTrendData, {
            strokeColor: "#27ae60",
            strokeWidth: 2,
            strokeDasharray: "5,5",
            curve: d3.curveMonotoneX,
        }),
        pessimisticPath: shapeGenerator.createSmoothTrendLine(pessimisticTrendData, {
            strokeColor: "#e74c3c",
            strokeWidth: 2,
            strokeDasharray: "5,5",
            curve: d3.curveMonotoneX,
        }),
    };
}
/**
 * Create key milestone markers for waterfall charts
 * Highlights important data points like targets, thresholds, or significant events
 */
function createWaterfallMilestones(milestones, xScale, yScale) {
    const shapeGenerator = createShapeGenerators();
    const markerData = milestones.map(milestone => {
        const typeMapping = {
            target: { type: "star", color: "#f39c12", size: 100 },
            threshold: { type: "diamond", color: "#9b59b6", size: 80 },
            alert: { type: "triangle", color: "#e74c3c", size: 90 },
            achievement: { type: "circle", color: "#27ae60", size: 85 },
        };
        const styling = typeMapping[milestone.type] || typeMapping.target;
        return {
            x: centerOf(xScale, milestone.label),
            y: yScale(milestone.value),
            type: styling.type,
            size: styling.size,
            color: styling.color,
            label: milestone.description || milestone.label,
        };
    });
    return shapeGenerator.createDataPointMarkers(markerData, {
        strokeColor: "#ffffff",
        strokeWidth: 2,
    });
}

// MintWaterfall Chart Render Functions
const LEGEND_ROW = 20;
const LEGEND_SWATCH = 10;
function legendItemWidth(label) {
    return LEGEND_SWATCH + 6 + label.length * 6.6 + 18;
}
/**
 * Legend entries: stack segment labels when stacked, otherwise one entry per bar kind
 * that is drawn in a single consistent color (kinds with mixed colors are omitted).
 */
function legendItems(data, config, style) {
    const items = new Map();
    if (config.stacked) {
        for (const d of data) {
            if (isAnchoredBar(d) && !d.isStart)
                continue;
            d.stacks.forEach((s, i) => {
                if (s.label && !items.has(s.label))
                    items.set(s.label, s.color || style.palette[i % style.palette.length]);
            });
        }
        for (const d of data) {
            if (d.isTotal)
                items.set(d.label, config.totalColor);
        }
        return [...items].map(([label, color]) => ({ label, color }));
    }
    const pseudo = { config, style, data };
    const names = {
        start: "Opening",
        increase: "Increase",
        decrease: "Decrease",
        subtotal: "Subtotal",
        total: "Total",
    };
    const byKind = new Map();
    data.forEach((d, i) => {
        const kind = barKind(d);
        if (!byKind.has(kind))
            byKind.set(kind, new Set());
        byKind.get(kind).add(getBarColor(d, i, pseudo));
    });
    const order = ["start", "increase", "decrease", "subtotal", "total"];
    return order.filter(k => byKind.get(k)?.size === 1).map(k => ({ label: names[k], color: [...byKind.get(k)][0] }));
}
/** Pack legend items into rows that fit `availableWidth`. */
function layoutLegend(items, availableWidth) {
    if (items.length === 0)
        return null;
    const placed = [];
    let x = 0;
    let row = 0;
    for (const item of items) {
        const w = legendItemWidth(item.label);
        if (x > 0 && x + w > availableWidth) {
            row += 1;
            x = 0;
        }
        placed.push({ ...item, x, row });
        x += w;
    }
    return { items: placed, rows: row + 1 };
}
function legendHeight(legend) {
    return legend ? legend.rows * LEGEND_ROW + 6 : 0;
}
function drawLegend(svg, ctx) {
    const items = ctx.legend ? ctx.legend.items : [];
    const group = layer(svg, "legend-group")
        .attr("transform", `translate(${ctx.margins.left},8)`)
        .attr("role", items.length ? "list" : null)
        .attr("aria-label", items.length ? "Legend" : null);
    const sel = group.selectAll("g.legend-item").data(items, d => d.label);
    sel.exit().remove();
    const entered = sel.enter().append("g").attr("class", "legend-item").attr("role", "listitem");
    entered.append("rect").attr("rx", 2);
    entered.append("text");
    const merged = entered.merge(sel).attr("transform", d => `translate(${d.x},${d.row * LEGEND_ROW})`);
    merged
        .select("rect")
        .attr("width", LEGEND_SWATCH)
        .attr("height", LEGEND_SWATCH)
        .attr("y", 1)
        .attr("fill", d => d.color);
    merged
        .select("text")
        .attr("x", LEGEND_SWATCH + 6)
        .attr("y", 6)
        .attr("dominant-baseline", "central")
        .attr("fill", ctx.style.mutedText)
        .style("font-family", ctx.style.fontFamily)
        .style("font-size", "12px")
        .text(d => d.label);
}
const MINUS$1 = "\u2212";
/** Apply a transition when animating, otherwise return the selection itself. */
function animate(selection, ctx, delay) {
    if (ctx.duration <= 0) {
        selection.interrupt();
        return selection;
    }
    let t = selection.transition().duration(ctx.duration).ease(ctx.config.ease);
    if (delay)
        t = t.delay(delay);
    return t;
}
/** Select a direct child layer by class, creating it if necessary. */
function layer(parent, className, tag = "g") {
    let sel = parent.select(`:scope > ${tag}.${className}`);
    if (sel.empty()) {
        sel = parent.append(tag).attr("class", className);
    }
    return sel;
}
/**
 * Bar-local rectangle covering values [v0, v1] with thickness `w` along the category axis.
 * Bar groups are translated to their category offset, so the category coordinate is 0.
 */
function valueRect(ctx, v0, v1, w) {
    const a = ctx.yScale(v0);
    const b = ctx.yScale(v1);
    return ctx.horizontal
        ? { x: Math.min(a, b), y: 0, width: Math.abs(b - a), height: w }
        : { x: 0, y: Math.min(a, b), width: w, height: Math.abs(a - b) };
}
/** SVG transform placing a bar group at `pos` along the category axis. */
function categoryTranslate(ctx, pos) {
    return ctx.horizontal ? `translate(0,${pos})` : `translate(${pos},0)`;
}
function plotWidth(ctx) {
    return ctx.width - ctx.margins.left - ctx.margins.right;
}
const barWidthCache = new WeakMap();
function barWidth(ctx) {
    let w = barWidthCache.get(ctx);
    if (w === undefined) {
        w = getBarWidth(ctx.xScale, ctx.data.map(d => d.label), plotWidth(ctx));
        barWidthCache.set(ctx, w);
    }
    return w;
}
/** Centre-x lookup for shape helpers (works for band and time scales). */
function xCenter(ctx) {
    return (label) => getBarCenter(ctx.xScale, label);
}
function barX(ctx, d) {
    return getBarPosition(ctx.xScale, d.label, barWidth(ctx));
}
/** Signed, human-friendly label for a bar: deltas get +/−, totals do not. */
function formatBarValue(d, format) {
    if (isAnchoredBar(d))
        return format(d.barTotal);
    if (d.barTotal > 0)
        return `+${format(d.barTotal)}`;
    if (d.barTotal < 0)
        return `${MINUS$1}${format(Math.abs(d.barTotal))}`;
    return format(0);
}
/** Fill color for a whole (non-stacked) bar. */
function getBarColor(d, i, ctx) {
    const { config, style } = ctx;
    if (d.isTotal)
        return config.totalColor;
    if (d.isStart) {
        // Opening balances: explicit single color, otherwise the total color
        return d.stacks.length === 1 && d.stacks[0].color ? d.stacks[0].color : config.totalColor;
    }
    if (d.isSubtotal) {
        // Subtotals: explicit color, otherwise a lighter shade of the total color
        if (d.stacks[0]?.color && d.stacks[0].color !== config.totalColor)
            return d.stacks[0].color;
        const shade = d3.color(config.totalColor);
        return shade ? shade.brighter(0.7).formatHex() : config.totalColor;
    }
    if (config.advancedColorConfig.enabled) {
        const themeName = config.advancedColorConfig.themeName || "default";
        if (config.colorMode === "sequential") {
            const palette = getThemeColorPalette(themeName);
            return palette[i % palette.length];
        }
        const fallback = d.barTotal >= 0 ? style.positive : style.negative;
        return getAdvancedBarColor(d.barTotal, fallback, ctx.data, themeName, config.colorMode);
    }
    if (d.stacks.length === 1 && d.stacks[0].color) {
        return d.stacks[0].color;
    }
    return d.barTotal >= 0 ? style.positive : style.negative;
}
function drawBackground(svg, ctx) {
    const bg = svg
        .selectAll(":scope > rect.mw-background")
        .data(ctx.style.background ? [ctx.style.background] : []);
    bg.exit().remove();
    bg.enter()
        .insert("rect", ":first-child")
        .attr("class", "mw-background")
        .merge(bg)
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", ctx.width)
        .attr("height", ctx.height)
        .attr("rx", 8)
        .attr("fill", (d) => d);
}
function drawGrid(container, ctx) {
    const { yScale, margins, style } = ctx;
    const gridGroup = layer(container, "grid-group").attr("aria-hidden", "true");
    const tickValues = ctx.config.showGrid ? yScale.ticks(ctx.yTickCount) : [];
    const lines = gridGroup.selectAll("line.grid-line").data(tickValues, (d) => d);
    lines.exit().remove();
    // Grid lines run across the plot at each value tick (horizontal lines for columns, vertical for bars)
    const across = (sel, v) => ctx.horizontal
        ? sel
            .attr("x1", v)
            .attr("x2", v)
            .attr("y1", margins.top)
            .attr("y2", ctx.height - margins.bottom)
        : sel
            .attr("x1", margins.left)
            .attr("x2", ctx.width - margins.right)
            .attr("y1", v)
            .attr("y2", v);
    const entered = lines.enter().append("line").attr("class", "grid-line");
    across(entered, (d) => yScale(d));
    across(animate(entered.merge(lines), ctx), (d) => yScale(d))
        .attr("stroke", style.grid)
        .attr("stroke-width", 1)
        .attr("shape-rendering", "crispEdges");
    // Emphasised zero line whenever the domain crosses zero
    const [d0, d1] = yScale.domain();
    const zero = gridGroup.selectAll("line.zero-line").data(d0 < 0 && d1 > 0 ? [0] : []);
    zero.exit().remove();
    across(animate(zero.enter().append("line").attr("class", "zero-line").merge(zero), ctx), () => yScale(0))
        .attr("stroke", style.axis)
        .attr("stroke-width", 1.5)
        .attr("shape-rendering", "crispEdges");
}
function styleAxisText(axisGroup, ctx) {
    axisGroup
        .selectAll("text")
        .attr("fill", ctx.style.mutedText)
        .style("font-family", ctx.style.fontFamily)
        .style("font-size", "12px")
        .style("font-variant-numeric", "tabular-nums");
}
/** Axis layer for an orientation; cleared when the orientation changes (d3-axis sets some text attrs only on enter). */
function axisLayer(container, className, ctx) {
    const group = layer(container, className);
    const orientation = ctx.horizontal ? "horizontal" : "vertical";
    if (group.attr("data-orientation") !== orientation) {
        group.selectAll("*").remove();
        group.attr("data-orientation", orientation);
    }
    return group;
}
/** Horizontal charts: value axis along the bottom, category axis on the left. */
function drawHorizontalAxes(container, ctx) {
    const { yScale, margins, config, style } = ctx;
    const xScale = ctx.xScale;
    const valueAxis = axisLayer(container, "y-axis", ctx).attr("transform", `translate(0,${ctx.height - margins.bottom})`);
    animate(valueAxis, ctx).call(d3
        .axisBottom(yScale)
        .ticks(ctx.yTickCount)
        .tickSize(0)
        .tickPadding(10)
        .tickFormat(d => config.formatNumber(d.valueOf())));
    valueAxis.select(".domain").remove();
    styleAxisText(valueAxis, ctx);
    const max = ctx.categoryLabelChars;
    const categoryAxis = axisLayer(container, "x-axis", ctx).attr("transform", `translate(${margins.left},0)`);
    categoryAxis.interrupt().call(d3
        .axisLeft(xScale)
        .tickSize(0)
        .tickSizeOuter(0)
        .tickPadding(10)
        .tickFormat(l => truncateLabel(l, max)));
    categoryAxis.select(".domain").attr("stroke", style.axis).attr("stroke-width", 1).attr("shape-rendering", "crispEdges");
    styleAxisText(categoryAxis, ctx);
    const every = Math.max(1, ctx.xLabelEvery);
    categoryAxis
        .selectAll(".tick text")
        .style("font-weight", "500")
        .attr("display", (_d, i) => (i % every === 0 ? null : "none"))
        .each(function (label) {
        // Full text on hover for truncated labels
        if (max > 0 && String(label).length > max)
            d3.select(this).append("title").text(label);
    });
}
function drawAxes(container, ctx) {
    if (ctx.horizontal) {
        drawHorizontalAxes(container, ctx);
        return;
    }
    const { xScale, yScale, margins, config, style } = ctx;
    const yAxisGroup = axisLayer(container, "y-axis", ctx).attr("transform", `translate(${margins.left},0)`);
    const yAxis = d3
        .axisLeft(yScale)
        .ticks(ctx.yTickCount)
        .tickSize(0)
        .tickPadding(10)
        .tickFormat(d => config.formatNumber(d.valueOf()));
    animate(yAxisGroup, ctx).call(yAxis);
    yAxisGroup.select(".domain").remove();
    styleAxisText(yAxisGroup, ctx);
    const xAxisGroup = axisLayer(container, "x-axis", ctx).attr("transform", `translate(0,${ctx.height - margins.bottom})`);
    // Band scale: one tick per bar. Time scale: d3's date ticks for the domain.
    const xAxis = (isBandScale(xScale) ? d3.axisBottom(xScale) : d3.axisBottom(xScale).ticks(Math.max(2, Math.floor(plotWidth(ctx) / 90))))
        .tickSize(0)
        .tickSizeOuter(0)
        .tickPadding(10);
    // Not transitioned: d3-axis would re-apply text/dy at transition start and undo wrapping/rotation
    xAxisGroup.interrupt().call(xAxis);
    xAxisGroup.select(".domain").attr("stroke", style.axis).attr("stroke-width", 1).attr("shape-rendering", "crispEdges");
    styleAxisText(xAxisGroup, ctx);
    xAxisGroup.selectAll(".tick text").style("font-weight", "500");
    const tickText = xAxisGroup.selectAll(".tick text");
    if (ctx.rotateXLabels) {
        tickText.attr("text-anchor", "end").attr("dx", "-0.5em").attr("dy", "0.4em").attr("transform", "rotate(-35)");
    }
    else {
        tickText.attr("text-anchor", "middle").attr("dx", null).attr("transform", null);
    }
    const every = Math.max(1, ctx.xLabelEvery);
    tickText.attr("display", (_d, i) => (i % every === 0 ? null : "none"));
    const wrapped = ctx.wrappedXLabels;
    tickText.each(function (label) {
        const text = d3.select(this);
        const lines = wrapped ? wrapped.get(String(label)) : null;
        if (lines && lines.length > 1) {
            const y = text.attr("y");
            text.text(null);
            lines.forEach((line, i) => {
                text.append("tspan")
                    .attr("x", 0)
                    .attr("y", y)
                    .attr("dy", i === 0 ? "0.71em" : `${0.71 + i * 1.15}em`)
                    .text(line);
            });
        }
        else if (!text.select("tspan").empty()) {
            text.selectAll("tspan").remove();
            text.text(String(label));
        }
    });
}
function roundedRadius(ctx, w, h) {
    return Math.max(0, Math.min(ctx.config.barRadius, w / 2, h / 2));
}
function drawBars(container, ctx) {
    const { data } = ctx;
    const barsGroup = layer(container, "bars-group");
    const w = barWidth(ctx);
    const stagger = ctx.config.staggeredAnimations ? (_d, i) => i * ctx.config.staggerDelay : undefined;
    const barGroups = barsGroup.selectAll("g.bar-group").data(data, (d) => d.label);
    barGroups.exit().remove();
    const entered = barGroups
        .enter()
        .append("g")
        .attr("class", "bar-group")
        .attr("transform", (d) => categoryTranslate(ctx, barX(ctx, d)));
    const merged = entered.merge(barGroups);
    merged
        .classed("is-total", (d) => Boolean(d.isTotal))
        .classed("is-subtotal", (d) => Boolean(d.isSubtotal))
        .classed("is-start", (d) => Boolean(d.isStart))
        .classed("is-increase", (d) => !isAnchoredBar(d) && d.barTotal >= 0)
        .classed("is-decrease", (d) => !isAnchoredBar(d) && d.barTotal < 0);
    animate(merged, ctx, stagger).attr("transform", (d) => categoryTranslate(ctx, barX(ctx, d)));
    merged.each(function (d, i) {
        const group = d3.select(this);
        if (ctx.config.stacked && (!isAnchoredBar(d) || d.isStart) && d.stacks.length > 0) {
            group.selectAll("rect.waterfall-bar").remove();
            drawStackSegments(group, d, w, ctx, stagger ? stagger(d, i) : 0);
        }
        else {
            group.selectAll("rect.stack").remove();
            group.selectAll("text.stack-label").remove();
            drawSingleBar(group, d, i, w, ctx, stagger ? stagger(d, i) : 0);
        }
    });
    return merged;
}
function setRect(sel, r) {
    return sel.attr("x", r.x).attr("y", r.y).attr("width", r.width).attr("height", r.height);
}
function drawSingleBar(group, d, i, w, ctx, delay) {
    const [lo, hi] = getBarExtent(d);
    const r = valueRect(ctx, lo, hi, w);
    const color = getBarColor(d, i, ctx);
    const start = isAnchoredBar(d) ? 0 : d.prevCumulativeTotal || 0;
    const rect = group.selectAll("rect.waterfall-bar").data([d]);
    const entered = setRect(rect.enter().append("rect").attr("class", "waterfall-bar"), valueRect(ctx, start, start, w)).attr("fill", color);
    setRect(animate(entered.merge(rect), ctx, () => delay), r)
        .attr("rx", roundedRadius(ctx, r.width, r.height))
        .attr("fill", color);
}
function drawStackSegments(group, d, w, ctx, delay) {
    const { style } = ctx;
    let running = d.isStart ? 0 : d.prevCumulativeTotal || 0;
    const segments = d.stacks.map((stack, i) => {
        const start = running;
        running += stack.value;
        const lo = Math.min(start, running);
        const hi = Math.max(start, running);
        return {
            ...stack,
            index: i,
            color: stack.color || style.palette[i % style.palette.length],
            rect: valueRect(ctx, lo, hi, w),
            from: valueRect(ctx, start, start, w),
        };
    });
    const rects = group.selectAll("rect.stack").data(segments);
    rects.exit().remove();
    const entered = rects
        .enter()
        .append("rect")
        .attr("class", "stack")
        .attr("x", (s) => s.from.x)
        .attr("y", (s) => s.from.y)
        .attr("width", (s) => s.from.width)
        .attr("height", (s) => s.from.height);
    animate(entered.merge(rects), ctx, () => delay)
        .attr("x", (s) => s.rect.x)
        .attr("y", (s) => s.rect.y)
        .attr("width", (s) => s.rect.width)
        .attr("height", (s) => s.rect.height)
        .attr("fill", (s) => s.color)
        .attr("stroke", style.surface)
        .attr("stroke-width", 1);
    // Only label segments where the text (11px, ~6.2px/char) actually fits
    const labeled = segments.filter(s => s.label && s.rect.height >= 16 && String(s.label).length * 6.2 <= s.rect.width - 6);
    const labels = group.selectAll("text.stack-label").data(labeled);
    labels.exit().remove();
    animate(labels
        .enter()
        .append("text")
        .attr("class", "stack-label")
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "central")
        .style("pointer-events", "none")
        .merge(labels), ctx, () => delay)
        .attr("x", (s) => s.rect.x + s.rect.width / 2)
        .attr("y", (s) => s.rect.y + s.rect.height / 2)
        .attr("fill", "#ffffff")
        .style("font-family", style.fontFamily)
        .style("font-size", "11px")
        .style("font-weight", "600")
        .text((s) => s.label);
}
function drawValueLabels(container, ctx) {
    const { yScale, style, config } = ctx;
    const labelsGroup = layer(container, "labels-group").attr("aria-hidden", "true");
    const w = barWidth(ctx);
    const visible = config.showValueLabels && ctx.valueLabelFontSize > 0;
    const data = visible ? ctx.data.filter(d => (d.barTotal !== 0 || isAnchoredBar(d)) && ctx.labelText(d) !== "") : [];
    const labels = labelsGroup.selectAll("text.total-label").data(data, (d) => d.label);
    labels.exit().remove();
    // Labels sit past the bar end: above (columns) / right (bars), or below / left for bars entirely below zero
    const below = (d) => {
        const [lo, hi] = getBarExtent(d);
        return hi <= 0 && lo < 0;
    };
    const valuePos = (d) => {
        const [lo, hi] = getBarExtent(d);
        if (ctx.horizontal)
            return below(d) ? yScale(lo) - 6 : yScale(hi) + 6;
        return below(d) ? yScale(lo) + 16 : yScale(hi) - 7;
    };
    const centre = (d) => barX(ctx, d) + w / 2;
    const place = (sel) => ctx.horizontal
        ? sel
            .attr("x", valuePos)
            .attr("y", centre)
            .attr("text-anchor", (d) => (below(d) ? "end" : "start"))
            .attr("dominant-baseline", "central")
        : sel.attr("x", centre).attr("y", valuePos).attr("text-anchor", "middle").attr("dominant-baseline", null);
    const entered = place(labels.enter().append("text").attr("class", "total-label")).style("opacity", 0);
    const fontSize = `${ctx.valueLabelFontSize}px`;
    const delayFn = ctx.config.staggeredAnimations ? (_d, i) => i * ctx.config.staggerDelay : undefined;
    entered
        .merge(labels)
        .attr("text-anchor", (d) => (!ctx.horizontal ? "middle" : below(d) ? "end" : "start"))
        .attr("dominant-baseline", ctx.horizontal ? "central" : null);
    animate(entered.merge(labels), ctx, delayFn)
        .attr("x", ctx.horizontal ? valuePos : centre)
        .attr("y", ctx.horizontal ? centre : valuePos)
        .attr("fill", style.text)
        .style("font-family", style.fontFamily)
        .style("font-size", fontSize)
        .style("font-weight", (d) => (isAnchoredBar(d) ? "700" : "600"))
        .style("font-variant-numeric", "tabular-nums")
        .style("pointer-events", "none")
        .style("opacity", 1)
        .text((d) => ctx.labelText(d));
}
function drawConnectors(container, ctx) {
    const { data, yScale, config, style } = ctx;
    const group = layer(container, "connectors-group").attr("aria-hidden", "true");
    const show = config.showConnectors && !config.stacked && data.length > 1;
    const w = barWidth(ctx);
    const connectorData = [];
    if (show) {
        for (let i = 0; i < data.length - 1; i++) {
            const current = data[i];
            const next = data[i + 1];
            // From the end of this bar to the start of the next, at this bar's running total
            const c0 = barX(ctx, current) + w;
            const c1 = barX(ctx, next);
            const v = yScale(current.cumulativeTotal);
            connectorData.push(ctx.horizontal
                ? { id: `${current.label}\u2192${next.label}`, x1: v, x2: v, y1: c0, y2: c1 }
                : { id: `${current.label}\u2192${next.label}`, x1: c0, x2: c1, y1: v, y2: v });
        }
    }
    const connectors = group.selectAll("line.connector").data(connectorData, (d) => d.id);
    connectors.exit().remove();
    const entered = connectors
        .enter()
        .append("line")
        .attr("class", "connector")
        .attr("x1", (d) => d.x1)
        .attr("x2", (d) => d.x1)
        .attr("y1", (d) => d.y1)
        .attr("y2", (d) => d.y1);
    animate(entered.merge(connectors), ctx)
        .attr("x1", (d) => d.x1)
        .attr("x2", (d) => d.x2)
        .attr("y1", (d) => d.y1)
        .attr("y2", (d) => d.y2)
        .attr("stroke", style.connector)
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", "3 3")
        .attr("shape-rendering", "crispEdges");
}
/** Least-squares polynomial fit; returns coefficients [c0, c1, ..., cn]. */
function polynomialFit(xs, ys, degree) {
    const n = Math.max(1, Math.min(degree, xs.length - 1));
    const size = n + 1;
    const matrix = Array.from({ length: size }, () => new Array(size + 1).fill(0));
    for (let row = 0; row < size; row++) {
        for (let col = 0; col < size; col++) {
            matrix[row][col] = xs.reduce((s, x) => s + Math.pow(x, row + col), 0);
        }
        matrix[row][size] = xs.reduce((s, x, k) => s + Math.pow(x, row) * ys[k], 0);
    }
    // Gaussian elimination with partial pivoting
    for (let col = 0; col < size; col++) {
        let pivot = col;
        for (let r = col + 1; r < size; r++) {
            if (Math.abs(matrix[r][col]) > Math.abs(matrix[pivot][col]))
                pivot = r;
        }
        [matrix[col], matrix[pivot]] = [matrix[pivot], matrix[col]];
        const p = matrix[col][col];
        if (Math.abs(p) < 1e-12)
            continue;
        for (let c = col; c <= size; c++)
            matrix[col][c] /= p;
        for (let r = 0; r < size; r++) {
            if (r === col)
                continue;
            const factor = matrix[r][col];
            for (let c = col; c <= size; c++)
                matrix[r][c] -= factor * matrix[col][c];
        }
    }
    return matrix.map(row => row[size]);
}
/** Trend values (in data units) for each bar's running total. */
function computeTrendValues(values, type, windowSize, degree) {
    const n = values.length;
    if (type === "moving-average") {
        // Centered window, truncated (not shifted) at the edges
        const win = Math.max(1, Math.floor(windowSize));
        const half = Math.floor(win / 2);
        return values.map((_, i) => {
            const start = Math.max(0, i - half);
            const end = Math.min(n, i - half + win);
            const slice = values.slice(start, end);
            return slice.reduce((s, v) => s + v, 0) / slice.length;
        });
    }
    const xs = values.map((_, i) => i);
    const coeffs = polynomialFit(xs, values, type === "polynomial" ? Math.max(2, degree) : 1);
    return xs.map(x => coeffs.reduce((s, c, k) => s + c * Math.pow(x, k), 0));
}
function drawTrendLine(container, ctx) {
    const { config, data, yScale } = ctx;
    if (!config.showTrendLine || data.length < 2) {
        container.selectAll(".trend-group").remove();
        return;
    }
    const group = layer(container, "trend-group").attr("aria-hidden", "true");
    const w = barWidth(ctx);
    // Totals/subtotals repeat an existing running total, so they would double-weight the fit
    const series = data.filter(d => !isAnchoredBar(d));
    const values = computeTrendValues(series.map(d => d.cumulativeTotal), config.trendLineType, config.trendLineWindow, config.trendLineDegree);
    const points = series.map((d, i) => ctx.horizontal ? { x: yScale(values[i]), y: barX(ctx, d) + w / 2 } : { x: barX(ctx, d) + w / 2, y: yScale(values[i]) });
    const line = d3
        .line()
        .x(p => p.x)
        .y(p => p.y)
        .curve(config.trendLineType === "linear" ? d3.curveLinear : ctx.horizontal ? d3.curveMonotoneY : d3.curveMonotoneX);
    const dash = config.trendLineStyle === "dashed" ? "6 4" : config.trendLineStyle === "dotted" ? "2 4" : null;
    const path = group.selectAll("path.trend-line").data([points]);
    const entered = path.enter().append("path").attr("class", "trend-line").attr("fill", "none").attr("d", line);
    animate(entered.merge(path), ctx)
        .attr("d", line)
        .attr("stroke", config.trendLineColor)
        .attr("stroke-width", config.trendLineWidth)
        .attr("stroke-opacity", config.trendLineOpacity)
        .attr("stroke-linecap", "round")
        .attr("stroke-dasharray", dash);
    const dots = group.selectAll("circle.trend-point").data(points);
    dots.exit().remove();
    animate(dots.enter().append("circle").attr("class", "trend-point").merge(dots), ctx)
        .attr("cx", (p) => p.x)
        .attr("cy", (p) => p.y)
        .attr("r", 2.5)
        .attr("fill", config.trendLineColor)
        .attr("fill-opacity", config.trendLineOpacity);
}
function drawConfidenceBands(container, ctx) {
    const { config, data, yScale } = ctx;
    if (!config.confidenceBandConfig.enabled || !config.confidenceBandConfig.scenarios || ctx.horizontal) {
        container.selectAll(".confidence-bands-group").remove();
        return;
    }
    const group = layer(container, "confidence-bands-group").attr("aria-hidden", "true");
    const bands = createWaterfallConfidenceBands(data.map(d => ({ label: d.label, value: d.barTotal, subtotal: Boolean(d.isSubtotal || d.isTotal), start: Boolean(d.isStart) })), config.confidenceBandConfig.scenarios, xCenter(ctx), yScale);
    const band = group.selectAll("path.confidence-band").data([bands.confidencePath]);
    animate(band.enter().append("path").attr("class", "confidence-band").merge(band), ctx)
        .attr("d", bands.confidencePath)
        .attr("fill", ctx.style.accent)
        .attr("fill-opacity", config.confidenceBandConfig.opacity ?? 0.2)
        .attr("stroke", "none");
    const trends = config.confidenceBandConfig.showTrendLines
        ? [
            { cls: "optimistic-trend", d: bands.optimisticPath, color: ctx.style.positive },
            { cls: "pessimistic-trend", d: bands.pessimisticPath, color: ctx.style.negative },
        ]
        : [];
    const lines = group.selectAll("path.scenario-line").data(trends, (t) => t.cls);
    lines.exit().remove();
    animate(lines
        .enter()
        .append("path")
        .attr("class", (t) => `scenario-line ${t.cls}`)
        .merge(lines), ctx)
        .attr("d", (t) => t.d)
        .attr("fill", "none")
        .attr("stroke", (t) => t.color)
        .attr("stroke-width", 1.5)
        .attr("stroke-dasharray", "5 4");
}
function drawMilestones(container, ctx) {
    const { config, yScale } = ctx;
    if (!config.milestoneConfig.enabled || config.milestoneConfig.milestones.length === 0 || ctx.horizontal) {
        container.selectAll(".milestones-group").remove();
        return;
    }
    const group = layer(container, "milestones-group");
    const markers = createWaterfallMilestones(config.milestoneConfig.milestones, xCenter(ctx), yScale);
    const sel = group.selectAll("path.milestone-marker").data(markers);
    sel.exit().remove();
    animate(sel.enter().append("path").attr("class", "milestone-marker").merge(sel), ctx)
        .attr("transform", (d) => d.transform)
        .attr("d", (d) => d.path)
        .attr("fill", (d) => d.config.fillColor || "#f59e0b")
        .attr("stroke", (d) => d.config.strokeColor || ctx.style.surface)
        .attr("stroke-width", (d) => d.config.strokeWidth || 2);
}

// MintWaterfall Professional Tooltip System - TypeScript Version
// Provides intelligent positioning, rich content, and customizable styling with full type safety
/** Escape text for safe insertion into HTML. */
function escapeHtml(value) {
    return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function createTooltipSystem() {
    let tooltipContainer = null;
    let currentTooltip = null;
    let config = {
        className: "mintwaterfall-tooltip",
        theme: "default",
        position: "smart",
        offset: { x: 10, y: -10 },
        animation: {
            duration: 200,
            easing: "ease-out",
        },
        collision: {
            boundary: "viewport",
            flip: true,
            shift: true,
        },
        content: {
            maxWidth: 300,
            padding: 12,
        },
    };
    // Initialize tooltip container
    function initializeTooltip() {
        if (tooltipContainer)
            return tooltipContainer;
        tooltipContainer = d3
            .select("body")
            .append("div")
            .attr("class", config.className)
            .style("position", "absolute")
            .style("visibility", "hidden")
            .style("pointer-events", "none")
            .style("z-index", "9999")
            .style("opacity", "0")
            .style("transition", `opacity ${config.animation.duration}ms ${config.animation.easing}`);
        applyTheme(config.theme);
        return tooltipContainer;
    }
    // Apply tooltip theme
    function applyTheme(themeName) {
        if (!tooltipContainer)
            return;
        const themes = {
            default: {
                background: "rgba(15, 23, 42, 0.94)",
                color: "#f8fafc",
                border: "1px solid rgba(148, 163, 184, 0.18)",
                borderRadius: "8px",
                fontSize: "12px",
                fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
                boxShadow: "0 10px 30px -8px rgba(15, 23, 42, 0.45)",
                maxWidth: `${config.content.maxWidth}px`,
                padding: `${config.content.padding}px`,
            },
            light: {
                background: "rgba(255, 255, 255, 0.98)",
                color: "#0f172a",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                fontSize: "12px",
                fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
                boxShadow: "0 10px 30px -8px rgba(15, 23, 42, 0.25)",
                maxWidth: `${config.content.maxWidth}px`,
                padding: `${config.content.padding}px`,
            },
            minimal: {
                background: "#333333",
                color: "#ffffff",
                border: "none",
                borderRadius: "3px",
                fontSize: "12px",
                fontFamily: "monospace",
                boxShadow: "none",
                maxWidth: `${config.content.maxWidth}px`,
                padding: "8px 10px",
            },
            corporate: {
                background: "#2c3e50",
                color: "#ecf0f1",
                border: "1px solid #34495e",
                borderRadius: "4px",
                fontSize: "13px",
                fontFamily: "system-ui, -apple-system, sans-serif",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
                maxWidth: `${config.content.maxWidth}px`,
                padding: `${config.content.padding}px`,
            },
        };
        const theme = themes[themeName] || themes.default;
        Object.keys(theme).forEach((property) => {
            const cssProperty = property.replace(/([A-Z])/g, "-$1").toLowerCase();
            const value = theme[property];
            tooltipContainer.style(cssProperty, value);
        });
    }
    // Show tooltip with content
    function show(content, event, data = null) {
        if (!tooltipContainer)
            initializeTooltip();
        // Generate content
        const htmlContent = generateContent(content, data);
        tooltipContainer.html(htmlContent).style("visibility", "visible");
        // Position tooltip
        positionTooltip(event);
        // Animate in
        tooltipContainer.transition().duration(config.animation.duration).style("opacity", "1");
        currentTooltip = { content, event, data };
        return tooltipContainer;
    }
    // Hide tooltip
    function hide() {
        if (!tooltipContainer)
            return;
        tooltipContainer
            .transition()
            .duration(config.animation.duration)
            .style("opacity", "0")
            .on("end", function () {
            d3.select(this).style("visibility", "hidden");
        });
        currentTooltip = null;
        return tooltipContainer;
    }
    // Update tooltip position
    function move(event) {
        if (!tooltipContainer || !currentTooltip)
            return;
        positionTooltip(event);
        return tooltipContainer;
    }
    // Generate tooltip content
    function generateContent(content, data) {
        if (typeof content === "function") {
            return content(data);
        }
        if (typeof content === "string") {
            return content;
        }
        if (typeof content === "object" && content && "template" in content) {
            return renderTemplate(content.template, data, content.formatters);
        }
        // Default content for waterfall chart data
        if (data) {
            return generateDefaultContent(data);
        }
        return "";
    }
    // Generate default content for chart data
    function generateDefaultContent(data) {
        const formatNumber = config.formatNumber || ((n) => n.toLocaleString());
        let html = `<div class="tooltip-header"><strong>${escapeHtml(String(data.label))}</strong></div>`;
        if (data.stacks && data.stacks.length > 0) {
            const totalValue = data.stacks.reduce((sum, stack) => sum + stack.value, 0);
            html += `<div class="tooltip-total">Total: ${formatNumber(totalValue)}</div>`;
            if (data.stacks.length > 1) {
                html += '<div class="tooltip-stacks">';
                data.stacks.forEach(stack => {
                    const color = stack.color || "#666";
                    const label = escapeHtml(stack.label || formatNumber(stack.value));
                    html += `
                        <div class="tooltip-stack-item">
                            <span class="tooltip-color-indicator" style="background-color: ${color}"></span>
                            <span class="tooltip-stack-label">${label}</span>
                            <span class="tooltip-stack-value">${formatNumber(stack.value)}</span>
                        </div>
                    `;
                });
                html += "</div>";
            }
        }
        return html;
    }
    // Render template with data
    function renderTemplate(template, data, formatters = {}) {
        if (!data)
            return template;
        let rendered = template;
        // Replace placeholders like {{key}} with data values
        rendered = rendered.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (match, key) => {
            const value = getNestedValue(data, key);
            const formatter = formatters[key];
            if (formatter && typeof formatter === "function") {
                return formatter(value);
            }
            return value != null ? String(value) : "";
        });
        return rendered;
    }
    // Get nested value from object using dot notation
    function getNestedValue(obj, path) {
        return path.split(".").reduce((current, key) => current?.[key], obj);
    }
    // Position tooltip intelligently
    function positionTooltip(event) {
        if (!tooltipContainer)
            return;
        const mouseEvent = event;
        const tooltipNode = tooltipContainer.node();
        if (!tooltipNode)
            return;
        const tooltipRect = tooltipNode.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        let x = mouseEvent.pageX + config.offset.x;
        let y = mouseEvent.pageY + config.offset.y;
        // Smart positioning to avoid viewport edges
        if (config.position === "smart") {
            const position = calculateSmartPosition({ x: mouseEvent.clientX, y: mouseEvent.clientY }, { width: tooltipRect.width, height: tooltipRect.height }, { width: viewportWidth, height: viewportHeight });
            x = position.x + window.pageXOffset;
            y = position.y + window.pageYOffset;
        }
        tooltipContainer.style("left", `${x}px`).style("top", `${y}px`);
    }
    // Calculate smart position to avoid clipping
    function calculateSmartPosition(mouse, tooltip, viewport) {
        const padding = 10;
        let x = mouse.x + config.offset.x;
        let y = mouse.y + config.offset.y;
        let quadrant = 1;
        // Check right edge
        if (x + tooltip.width + padding > viewport.width) {
            x = mouse.x - tooltip.width - Math.abs(config.offset.x);
            quadrant = 2;
        }
        // Check bottom edge
        if (y + tooltip.height + padding > viewport.height) {
            y = mouse.y - tooltip.height - Math.abs(config.offset.y);
            quadrant = quadrant === 2 ? 3 : 4;
        }
        // Check left edge
        if (x < padding) {
            x = padding;
        }
        // Check top edge
        if (y < padding) {
            y = padding;
        }
        return { x, y, quadrant };
    }
    // Configure tooltip
    function configure(newConfig) {
        config = { ...config, ...newConfig };
        if (tooltipContainer && newConfig.theme) {
            applyTheme(newConfig.theme);
        }
        return tooltipSystem;
    }
    // Set theme
    function theme(themeName) {
        config.theme = themeName;
        if (tooltipContainer) {
            applyTheme(themeName);
        }
        return tooltipSystem;
    }
    // Destroy tooltip
    function destroy() {
        if (tooltipContainer) {
            tooltipContainer.remove();
            tooltipContainer = null;
        }
        currentTooltip = null;
    }
    // Check if tooltip is visible
    function isVisible() {
        return tooltipContainer !== null && tooltipContainer.style("visibility") === "visible";
    }
    // Get current tooltip data
    function getCurrentData() {
        return currentTooltip?.data || null;
    }
    const tooltipSystem = {
        show,
        hide,
        move,
        theme,
        configure,
        destroy,
        isVisible,
        getCurrentData,
    };
    return tooltipSystem;
}

// MintWaterfall Export System - TypeScript Version
// Provides SVG, PNG, PDF, and data export capabilities with full type safety
const FORMULA_START = /^[=+\-@\t\r]/;
const NUMERIC = /^[+-]?(\d+(\.\d*)?|\.\d+)(e[+-]?\d+)?$/i;
function resolveJsPDF(option) {
    if (option)
        return option;
    if (typeof window === "undefined")
        return undefined;
    const w = window;
    return w.jspdf?.jsPDF ?? w.jsPDF;
}
function createExportSystem() {
    let config = {
        filename: "waterfall-chart",
        quality: 1.0,
        scale: 1,
        background: "#ffffff",
        padding: 20,
        includeStyles: true,
        includeData: true,
    };
    // Export chart as SVG
    function exportSVG(chartContainer, options = {}) {
        const opts = { ...config, ...options };
        try {
            const svg = chartContainer.select("svg");
            if (svg.empty()) {
                throw new Error("No SVG element found in chart container");
            }
            const svgNode = svg.node();
            const serializer = new XMLSerializer();
            // Clone SVG to avoid modifying original
            const clonedSvg = svgNode.cloneNode(true);
            // Add styles if requested
            if (opts.includeStyles) {
                addInlineStyles(clonedSvg);
            }
            // Add background if specified
            if (opts.background && opts.background !== "transparent") {
                addBackground(clonedSvg, opts.background);
            }
            // Serialize to string
            const svgString = serializer.serializeToString(clonedSvg);
            // Create downloadable blob
            const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
            return {
                blob,
                url: URL.createObjectURL(blob),
                data: svgString,
                download: () => downloadBlob(blob, `${opts.filename}.svg`),
            };
        }
        catch (error) {
            console.error("SVG export failed:", error);
            throw error;
        }
    }
    // Export chart as PNG with enhanced features
    function exportPNG(chartContainer, options = {}) {
        const opts = {
            ...config,
            scale: 2, // Default to 2x for high-DPI
            quality: 0.95,
            ...options,
        };
        return new Promise((resolve, reject) => {
            try {
                const svg = chartContainer.select("svg");
                if (svg.empty()) {
                    reject(new Error("No SVG element found in chart container"));
                    return;
                }
                const svgNode = svg.node();
                const viewBox = svgNode.viewBox && svgNode.viewBox.baseVal;
                const svgWidth = (viewBox && viewBox.width) || parseFloat(svgNode.getAttribute("width") || "") || svgNode.getBBox().width;
                const svgHeight = (viewBox && viewBox.height) || parseFloat(svgNode.getAttribute("height") || "") || svgNode.getBBox().height;
                const width = Math.round((svgWidth + opts.padding * 2) * opts.scale);
                const height = Math.round((svgHeight + opts.padding * 2) * opts.scale);
                // Create high-DPI canvas
                const canvas = document.createElement("canvas");
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext("2d");
                if (!ctx) {
                    reject(new Error("Failed to get canvas context"));
                    return;
                }
                // Enable high-quality rendering
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = "high";
                // Set background
                if (opts.background && opts.background !== "transparent") {
                    ctx.fillStyle = opts.background;
                    ctx.fillRect(0, 0, width, height);
                }
                // Convert SVG to image with enhanced error handling
                const svgExport = exportSVG(chartContainer, {
                    ...opts,
                    includeStyles: true,
                    background: "transparent", // Let canvas handle background
                });
                const img = new Image();
                img.onload = () => {
                    try {
                        // Draw image with proper scaling and positioning
                        ctx.drawImage(img, opts.padding * opts.scale, opts.padding * opts.scale, svgWidth * opts.scale, svgHeight * opts.scale);
                        // Convert to blob
                        canvas.toBlob(blob => {
                            if (!blob) {
                                reject(new Error("Failed to create PNG blob"));
                                return;
                            }
                            // Clean up
                            URL.revokeObjectURL(svgExport.url);
                            resolve({
                                blob,
                                url: URL.createObjectURL(blob),
                                data: svgExport.data,
                                download: () => downloadBlob(blob, `${opts.filename}.png`),
                            });
                        }, "image/png", opts.quality);
                    }
                    catch (drawError) {
                        reject(new Error(`PNG rendering failed: ${drawError}`));
                    }
                };
                img.onerror = () => {
                    reject(new Error("Failed to load SVG image for PNG conversion"));
                };
                // Load SVG as data URL
                // encodeURIComponent keeps non-Latin-1 characters (e.g. "−", "€") intact
                img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgExport.data)}`;
            }
            catch (error) {
                reject(new Error(`PNG export failed: ${error}`));
            }
        });
    }
    // Export chart as PDF (requires jsPDF, passed as an option or loaded globally)
    function exportPDF(chartContainer, options = {}) {
        const opts = {
            ...config,
            orientation: "landscape",
            pageFormat: "a4",
            ...options,
        };
        return new Promise((resolve, reject) => {
            const JsPDF = resolveJsPDF(opts.jsPDF);
            if (!JsPDF) {
                reject(new Error('PDF export requires jsPDF: pass it as the `jsPDF` option (import { jsPDF } from "jspdf") or load jsPDF\'s UMD build.'));
                return;
            }
            try {
                // Get PNG data first
                exportPNG(chartContainer, {
                    ...opts,
                    scale: 2,
                    quality: 0.95,
                })
                    .then(pngResult => {
                    const pdf = new JsPDF({
                        orientation: opts.orientation,
                        unit: "mm",
                        format: opts.pageFormat,
                    });
                    // Calculate dimensions
                    const pdfWidth = pdf.internal.pageSize.getWidth();
                    const pdfHeight = pdf.internal.pageSize.getHeight();
                    // Add image to PDF
                    const reader = new FileReader();
                    reader.onload = () => {
                        try {
                            const imgData = reader.result;
                            // Calculate aspect ratio and size
                            const img = new Image();
                            img.onload = () => {
                                const aspectRatio = img.width / img.height;
                                let width = pdfWidth - 20; // 10mm margin on each side
                                let height = width / aspectRatio;
                                // Adjust if height is too large
                                if (height > pdfHeight - 20) {
                                    height = pdfHeight - 20;
                                    width = height * aspectRatio;
                                }
                                const x = (pdfWidth - width) / 2;
                                const y = (pdfHeight - height) / 2;
                                pdf.addImage(imgData, "PNG", x, y, width, height);
                                // Generate PDF blob
                                const pdfBlob = pdf.output("blob");
                                // Clean up
                                URL.revokeObjectURL(pngResult.url);
                                resolve({
                                    blob: pdfBlob,
                                    url: URL.createObjectURL(pdfBlob),
                                    data: pdfBlob,
                                    download: () => downloadBlob(pdfBlob, `${opts.filename}.pdf`),
                                });
                            };
                            img.src = imgData;
                        }
                        catch (pdfError) {
                            reject(new Error(`PDF generation failed: ${pdfError}`));
                        }
                    };
                    reader.onerror = () => {
                        reject(new Error("Failed to read PNG data for PDF conversion"));
                    };
                    reader.readAsDataURL(pngResult.blob);
                })
                    .catch(reject);
            }
            catch (error) {
                reject(new Error(`PDF export failed: ${error}`));
            }
        });
    }
    // Export data in various formats
    function exportData(data, options = {}) {
        const opts = {
            ...config,
            dataFormat: "json",
            includeMetadata: true,
            delimiter: ",",
            ...options,
        };
        try {
            let content;
            let mimeType;
            let extension;
            switch (opts.dataFormat) {
                case "json": {
                    const jsonData = opts.includeMetadata
                        ? {
                            data,
                            metadata: {
                                exportDate: new Date().toISOString(),
                                count: data.length,
                            },
                        }
                        : data;
                    content = JSON.stringify(jsonData, null, 2);
                    mimeType = "application/json";
                    extension = "json";
                    break;
                }
                case "csv":
                    content = convertToCSV(data, opts.delimiter || ",", opts.escapeFormulas !== false);
                    mimeType = "text/csv";
                    extension = "csv";
                    break;
                case "tsv":
                    content = convertToCSV(data, "\t", opts.escapeFormulas !== false);
                    mimeType = "text/tab-separated-values";
                    extension = "tsv";
                    break;
                default:
                    throw new Error(`Unsupported data export format: ${opts.dataFormat}`);
            }
            const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
            return {
                blob,
                url: URL.createObjectURL(blob),
                data: content,
                download: () => downloadBlob(blob, `${opts.filename}.${extension}`),
            };
        }
        catch (error) {
            console.error("Data export failed:", error);
            throw error;
        }
    }
    // Helper function to add inline styles to SVG
    function addInlineStyles(svgElement) {
        try {
            const styleSheets = Array.from(document.styleSheets);
            let styles = "";
            styleSheets.forEach(sheet => {
                try {
                    const rules = Array.from(sheet.cssRules || sheet.rules);
                    rules.forEach(rule => {
                        if (rule.type === CSSRule.STYLE_RULE) {
                            const styleRule = rule;
                            if (styleRule.selectorText &&
                                (styleRule.selectorText.includes(".mintwaterfall") ||
                                    styleRule.selectorText.includes("svg") ||
                                    styleRule.selectorText.includes("chart"))) {
                                styles += styleRule.cssText;
                            }
                        }
                    });
                }
                catch (e) {
                    // Skip inaccessible stylesheets (CORS)
                    console.warn("Could not access stylesheet:", e);
                }
            });
            if (styles) {
                const styleElement = document.createElementNS("http://www.w3.org/2000/svg", "style");
                styleElement.textContent = styles;
                svgElement.insertBefore(styleElement, svgElement.firstChild);
            }
        }
        catch (error) {
            console.warn("Failed to add inline styles:", error);
        }
    }
    // Helper function to add background to SVG
    function addBackground(svgElement, backgroundColor) {
        const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        rect.setAttribute("width", "100%");
        rect.setAttribute("height", "100%");
        rect.setAttribute("fill", backgroundColor);
        svgElement.insertBefore(rect, svgElement.firstChild);
    }
    // Helper function to convert data to CSV
    function convertToCSV(data, delimiter = ",", escapeFormulas = true) {
        if (!data || data.length === 0)
            return "";
        // Get headers from first object
        const headers = Object.keys(data[0]);
        // Create CSV content
        const csvContent = [
            headers.join(delimiter),
            ...data.map(row => headers
                .map(header => {
                const value = row[header];
                let stringValue = value != null ? String(value) : "";
                // CSV injection: text a spreadsheet would evaluate as a formula
                if (escapeFormulas && typeof value === "string" && FORMULA_START.test(stringValue) && !NUMERIC.test(stringValue)) {
                    stringValue = `'${stringValue}`;
                }
                // Escape quotes and wrap in quotes if contains delimiter
                if (stringValue.includes(delimiter) || stringValue.includes('"') || stringValue.includes("\n")) {
                    return `"${stringValue.replace(/"/g, '""')}"`;
                }
                return stringValue;
            })
                .join(delimiter)),
        ].join("\n");
        return csvContent;
    }
    // Helper function to download blob
    function downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
    // Configure export system
    function configure(newConfig) {
        config = { ...config, ...newConfig };
        return exportSystem;
    }
    // Download file utility
    function downloadFile(content, filename, mimeType = "text/plain") {
        const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
        downloadBlob(blob, filename);
    }
    const exportSystem = {
        exportSVG,
        exportPNG,
        exportPDF,
        exportData,
        configure,
        downloadFile,
    };
    return exportSystem;
}

// MintWaterfall Chart — Main Chart Factory
const MINUS = "\u2212";
let instanceCounter = 0;
function prefersReducedMotion() {
    try {
        return typeof window !== "undefined" && typeof window.matchMedia === "function"
            ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
            : false;
    }
    catch {
        return false;
    }
}
function isValidChartData(data) {
    return (Array.isArray(data) &&
        data.every(item => item &&
            typeof item.label === "string" &&
            (item.subtotal === true ||
                (Array.isArray(item.stacks) &&
                    item.stacks.every((stack) => stack &&
                        typeof stack.value === "number" &&
                        Number.isFinite(stack.value) &&
                        (stack.color === undefined || typeof stack.color === "string"))))));
}
function waterfallChart() {
    const config = {
        ...defaultConfig,
        margin: { ...defaultConfig.margin },
        advancedColorConfig: { ...defaultConfig.advancedColorConfig },
        confidenceBandConfig: { ...defaultConfig.confidenceBandConfig },
        milestoneConfig: { ...defaultConfig.milestoneConfig, milestones: [...defaultConfig.milestoneConfig.milestones] },
    };
    const instanceId = ++instanceCounter;
    let elementCounter = 0;
    const states = new WeakMap();
    const renderedSvgs = new Set();
    let lastSvg = null;
    let lastProcessed = [];
    let boundData = null;
    let tooltip = null;
    const exportSystem = createExportSystem();
    let totalColorOverride = false;
    const warned = new Set();
    /** Horizontal charts ignore vertical-only features; say so once per chart and feature. */
    function warnVerticalOnly() {
        const ignored = [
            [config.enableBrush, "enableBrush"],
            [config.enableZoom, "enableZoom"],
            [config.scaleType === "time", 'scaleType("time")'],
            [config.confidenceBandConfig.enabled, "confidence bands"],
            [config.milestoneConfig.enabled, "milestones"],
        ];
        for (const [on, name] of ignored) {
            if (on && !warned.has(name)) {
                warned.add(name);
                console.warn(`MintWaterfall: ${name} is not supported with orientation("horizontal") and is ignored.`);
            }
        }
    }
    let colorSchemeQuery = null;
    function onColorSchemeChange() {
        if (config.theme !== "auto")
            return;
        renderedSvgs.forEach(svgNode => {
            const s = states.get(svgNode);
            if (s && s.container && s.container.isConnected)
                renderElement(s.container, s.data);
        });
    }
    /** For theme("auto"): apply the theme that matches the current color scheme and watch for changes. */
    function syncAutoTheme() {
        if (config.theme !== "auto")
            return;
        const resolved = resolvedThemeName(config);
        config.advancedColorConfig.themeName = resolved;
        if (!totalColorOverride && themes[resolved])
            config.totalColor = themes[resolved].totalColor;
        if (!colorSchemeQuery && typeof window !== "undefined" && typeof window.matchMedia === "function") {
            colorSchemeQuery = window.matchMedia("(prefers-color-scheme: dark)");
            colorSchemeQuery.addEventListener?.("change", onColorSchemeChange);
        }
    }
    const listeners = d3.dispatch("barClick", "barMouseover", "barMouseout", "barFocus", "chartUpdate", "brushSelection");
    function getTooltip() {
        if (!tooltip)
            tooltip = createTooltipSystem();
        return tooltip;
    }
    function describeBar(d) {
        const fmt = config.formatNumber;
        if (d.isTotal)
            return `${d.label}: total ${fmt(d.barTotal)}`;
        if (d.isSubtotal)
            return `${d.label}: subtotal ${fmt(d.barTotal)}`;
        if (d.isStart)
            return `${d.label}: opening value ${fmt(d.barTotal)}`;
        const direction = d.barTotal >= 0 ? "increase" : "decrease";
        return `${d.label}: ${direction} of ${fmt(Math.abs(d.barTotal))}, running total ${fmt(d.cumulativeTotal)}`;
    }
    function describeChart(data) {
        const fmt = config.formatNumber;
        const deltas = data.filter(d => !isAnchoredBar(d));
        const final = data.length ? data[data.length - 1].cumulativeTotal : 0;
        const parts = [`Waterfall chart with ${data.length} bars, ending at ${fmt(final)}.`];
        const up = deltas.reduce((m, d) => (d.barTotal > 0 && (!m || d.barTotal > m.barTotal) ? d : m), null);
        const down = deltas.reduce((m, d) => (d.barTotal < 0 && (!m || d.barTotal < m.barTotal) ? d : m), null);
        if (up)
            parts.push(`Largest increase: ${up.label} (+${fmt(up.barTotal)}).`);
        if (down)
            parts.push(`Largest decrease: ${down.label} (${MINUS}${fmt(Math.abs(down.barTotal))}).`);
        return parts.join(" ");
    }
    function tooltipHtml(d, style) {
        const fmt = config.formatNumber;
        const row = (key, value, color) => '<div style="display:flex;justify-content:space-between;gap:20px;line-height:1.7">' +
            `<span style="opacity:.72">${escapeHtml(key)}</span>` +
            `<span style="font-weight:600;font-variant-numeric:tabular-nums${color ? `;color:${color}` : ""}">${escapeHtml(value)}</span></div>`;
        let html = `<div style="font-weight:600;font-size:13px;margin-bottom:2px">${escapeHtml(d.label)}</div>`;
        if (isAnchoredBar(d)) {
            html += row(d.isTotal ? "Total" : d.isSubtotal ? "Subtotal" : "Opening", fmt(d.barTotal));
            return html;
        }
        const changeColor = d.barTotal >= 0 ? style.positive : style.negative;
        html += row("Change", formatBarValue(d, fmt), changeColor);
        html += row("Running total", fmt(d.cumulativeTotal));
        if (d.stacks.length > 1) {
            html += '<div style="height:1px;background:currentColor;opacity:.15;margin:6px 0"></div>';
            d.stacks.forEach((s, i) => {
                const color = s.color || style.palette[i % style.palette.length];
                html +=
                    '<div style="display:flex;align-items:center;gap:8px;line-height:1.7">' +
                        `<span style="width:8px;height:8px;border-radius:2px;background:${escapeHtml(color)}"></span>` +
                        `<span style="flex:1;opacity:.85">${escapeHtml(s.label || `Segment ${i + 1}`)}</span>` +
                        `<span style="font-variant-numeric:tabular-nums">${escapeHtml(fmt(s.value))}</span></div>`;
            });
        }
        return html;
    }
    function applyEmphasis(svg, labels) {
        const dim = (label) => labels !== null && !labels.has(label);
        svg.selectAll("g.bar-group").style("opacity", (d) => (dim(d.label) ? 0.3 : 1));
        svg.selectAll("text.total-label").attr("fill-opacity", (d) => dim(d.label) ? 0.3 : 1);
    }
    function renderElement(node, data, durationOverride) {
        const element = d3.select(node);
        let svg;
        if (node.nodeName.toLowerCase() === "svg") {
            svg = element;
        }
        else {
            const existing = element.selectAll(":scope > svg.mintwaterfall").data([0]);
            svg = existing.enter().append("svg").attr("class", "mintwaterfall").merge(existing);
        }
        const svgNode = svg.node();
        let state = states.get(svgNode);
        if (!state) {
            state = {
                clipId: `mw-clip-${instanceId}-${++elementCounter}`,
                transform: d3.zoomIdentity,
                data,
                emphasis: null,
                zoom: null,
                brush: null,
                container: null,
                frame: null,
                resize: null,
                lastWidth: 0,
            };
            states.set(svgNode, state);
        }
        state.data = data;
        // User-supplied <svg> elements keep their own size attributes
        let width = config.width;
        let height = config.height;
        const responsiveContainer = config.responsive && node.nodeName.toLowerCase() !== "svg";
        if (responsiveContainer) {
            // Lay out at the container's real width (so text stays readable) instead of scaling a fixed drawing
            const measured = Math.floor(node.clientWidth || 0);
            if (measured > 0)
                width = measured;
            observeResize(node, svgNode, state);
        }
        else if (state.resize) {
            state.resize.disconnect();
            state.resize = null;
        }
        state.lastWidth = width;
        if (node.nodeName.toLowerCase() === "svg") {
            const w = parseFloat(svgNode.getAttribute("width") || "");
            const h = parseFloat(svgNode.getAttribute("height") || "");
            if (Number.isFinite(w) && w > 0)
                width = w;
            if (Number.isFinite(h) && h > 0)
                height = h;
        }
        state.container = node;
        syncAutoTheme();
        const processed = prepareData(data, config);
        const style = resolveStyle(config);
        const yDomain = computeYDomain(processed, config.stacked);
        const labelText = (d) => {
            const text = formatBarValue(d, config.formatNumber);
            return config.valueLabel ? String(config.valueLabel(d, text) ?? "") : text;
        };
        const legend = config.showLegend
            ? layoutLegend(legendItems(processed, config, style), Math.max(60, width - Math.max(config.margin.left, 40) - config.margin.right))
            : null;
        const horizontal = config.orientation === "horizontal";
        if (horizontal)
            warnVerticalOnly();
        const layout = (horizontal ? computeHorizontalLayout : computeLayout)(processed, config.margin, width, height, yDomain, config.formatNumber, config.showValueLabels, labelText, legendHeight(legend));
        const margins = layout.margins;
        const zoomOn = config.enableZoom && !horizontal;
        const hasLabelBelowZero = () => processed.some(d => d.cumulativeTotal < 0 && (isAnchoredBar(d) || (d.prevCumulativeTotal || 0) <= 0));
        if (horizontal && layout.valueLabelReserve > 0) {
            // Value labels sit past the bar ends: widen the domain so they stay inside the plot
            const plot = Math.max(60, width - margins.left - margins.right);
            const padHi = layout.valueLabelReserve;
            const padLo = yDomain[0] < 0 && hasLabelBelowZero() ? layout.valueLabelReserve : 0;
            const perPx = (yDomain[1] - yDomain[0]) / Math.max(20, plot - padHi - padLo);
            yDomain[1] += padHi * perPx;
            yDomain[0] -= padLo * perPx;
        }
        // Leave room under bars that sit entirely below zero (their labels go underneath)
        if (!horizontal && layout.valueLabelFontSize > 0 && yDomain[0] < 0) {
            if (hasLabelBelowZero()) {
                const plotHeight = Math.max(40, height - margins.top - margins.bottom);
                yDomain[0] -= ((yDomain[1] - yDomain[0]) * 22) / plotHeight;
            }
        }
        svg.attr("width", width)
            .attr("height", height)
            .attr("viewBox", `0 0 ${width} ${height}`)
            .attr("preserveAspectRatio", "xMidYMid meet")
            .style("font-family", style.fontFamily)
            .style("overflow", "visible")
            .style("width", config.responsive ? "100%" : "")
            .style("height", config.responsive ? "auto" : "");
        const yScale = d3
            .scaleLinear()
            .domain(niceDomain(yDomain, layout.yTickCount))
            .range(horizontal ? [margins.left, width - margins.right] : [height - margins.bottom, margins.top]);
        // Category axis: horizontal for columns (zoomable), top-to-bottom for horizontal bars
        const baseRange = horizontal ? [margins.top, height - margins.bottom] : [margins.left, width - margins.right];
        const t = zoomOn ? state.transform : d3.zoomIdentity;
        const range = baseRange.map(v => t.applyX(v));
        let xScale;
        if (config.scaleType === "time" && !horizontal) {
            const dates = processed.map(d => new Date(d.label));
            xScale = d3
                .scaleTime()
                .domain(d3.extent(dates))
                .range(range);
        }
        else {
            const padding = Math.max(0, Math.min(0.95, config.barPadding));
            xScale = d3
                .scaleBand()
                .domain(processed.map(d => d.label))
                .range(range)
                .paddingInner(padding)
                .paddingOuter(padding / 2);
        }
        const ctx = {
            config,
            style,
            width,
            height,
            margins,
            xScale,
            yScale,
            data: processed,
            duration: durationOverride ?? (prefersReducedMotion() ? 0 : Math.max(0, config.duration)),
            rotateXLabels: layout.rotateXLabels,
            wrappedXLabels: layout.wrappedXLabels,
            xLabelEvery: layout.xLabelEvery,
            valueLabelFontSize: layout.valueLabelFontSize,
            yTickCount: layout.yTickCount,
            labelText,
            legend,
            horizontal,
            categoryLabelChars: layout.categoryLabelChars,
        };
        // Accessible name/description
        if (config.enableAccessibility) {
            const summary = describeChart(processed);
            let title = svg.select(":scope > title");
            if (title.empty())
                title = svg.insert("title", ":first-child");
            title.text(summary);
            svg.attr("role", "group").attr("aria-roledescription", "waterfall chart").attr("aria-label", summary);
        }
        else {
            svg.select(":scope > title").remove();
            svg.attr("role", null).attr("aria-roledescription", null).attr("aria-label", null);
        }
        // Clip path (one per chart element, reused across renders)
        const defs = layer(svg, "mw-defs", "defs");
        const clip = defs.selectAll("clipPath").data([state.clipId]);
        const clipRect = clip
            .enter()
            .append("clipPath")
            .attr("id", (id) => id)
            .call(cp => cp.append("rect"))
            .merge(clip)
            .select("rect");
        // Clip horizontally only when zooming (otherwise edge value labels may overhang the plot)
        clipRect
            .attr("x", zoomOn ? margins.left : 0)
            .attr("y", 0)
            .attr("width", zoomOn ? Math.max(0, width - margins.left - margins.right) : width)
            .attr("height", height);
        drawBackground(svg, ctx);
        drawLegend(svg, ctx);
        const root = layer(svg, "waterfall-container");
        drawGrid(root, ctx);
        drawAxes(root, ctx);
        root.select(".x-axis").attr("clip-path", zoomOn ? `url(#${state.clipId})` : null);
        const chartGroup = layer(root, "chart-group").attr("clip-path", `url(#${state.clipId})`);
        const brushLayer = layer(chartGroup, "brush-layer");
        const connectorsLayer = layer(chartGroup, "connectors-layer");
        const barsLayer = layer(chartGroup, "bars-layer");
        const overlayLayer = layer(chartGroup, "overlay-layer");
        const labelsLayer = layer(chartGroup, "labels-layer");
        drawConnectors(connectorsLayer, ctx);
        const bars = drawBars(barsLayer, ctx);
        drawConfidenceBands(overlayLayer, ctx);
        drawTrendLine(overlayLayer, ctx);
        drawMilestones(overlayLayer, ctx);
        drawValueLabels(labelsLayer, ctx);
        bindBarInteractions(svg, barsLayer, bars, ctx);
        configureBrush(svg, brushLayer, ctx, state);
        configureZoom(svg, ctx, state);
        applyEmphasis(svg, state.emphasis);
        renderedSvgs.add(svgNode);
        lastSvg = svgNode;
        lastProcessed = processed;
        listeners.call("chartUpdate", svgNode, processed);
    }
    function observeResize(node, svgNode, state) {
        if (state.resize || typeof ResizeObserver === "undefined")
            return;
        let pending = null;
        state.resize = new ResizeObserver(entries => {
            const w = Math.floor(entries[0]?.contentRect.width || 0);
            if (w <= 0 || Math.abs(w - state.lastWidth) < 1 || pending !== null)
                return;
            pending = requestAnimationFrame(() => {
                pending = null;
                const s = states.get(svgNode);
                if (s && config.responsive)
                    renderElement(node, s.data, 0);
            });
        });
        state.resize.observe(node);
    }
    function bindBarInteractions(svg, barsLayer, bars, ctx) {
        const a11y = config.enableAccessibility;
        const clickable = typeof listeners.on("barClick") === "function";
        barsLayer.attr("role", a11y ? "list" : null).attr("aria-label", a11y ? "Bars" : null);
        bars.attr("tabindex", a11y ? 0 : null)
            .attr("role", a11y ? "listitem" : null)
            .attr("aria-label", a11y ? (d) => describeBar(d) : null)
            .style("cursor", clickable ? "pointer" : "")
            .style("outline", "none")
            .style("transition", "opacity 140ms ease")
            .on("mouseenter", function (event, d) {
            applyEmphasis(svg, new Set([d.label]));
            if (config.enableTooltips) {
                getTooltip()
                    .configure({ ...config.tooltipConfig })
                    .show(() => {
                    const html = tooltipHtml(d, ctx.style);
                    return config.tooltipContent ? String(config.tooltipContent(d, html) ?? "") : html;
                }, event, d);
            }
            listeners.call("barMouseover", this, event, d);
        })
            .on("mousemove", (event) => {
            if (config.enableTooltips && tooltip)
                tooltip.move(event);
        })
            .on("mouseleave", function (event, d) {
            const state = states.get(svg.node());
            applyEmphasis(svg, state ? state.emphasis : null);
            if (tooltip)
                tooltip.hide();
            listeners.call("barMouseout", this, event, d);
        })
            .on("click", function (event, d) {
            listeners.call("barClick", this, event, d);
        })
            .on("focus", function (event, d) {
            applyEmphasis(svg, new Set([d.label]));
            d3.select(this).selectAll("rect").attr("stroke", ctx.style.text).attr("stroke-width", 2);
            listeners.call("barFocus", this, event, d);
        })
            .on("blur", function () {
            const state = states.get(svg.node());
            applyEmphasis(svg, state ? state.emphasis : null);
            d3.select(this).selectAll("rect.waterfall-bar").attr("stroke", null).attr("stroke-width", null);
            d3.select(this).selectAll("rect.stack").attr("stroke", ctx.style.surface).attr("stroke-width", 1);
        })
            .on("keydown", function (event, d) {
            const nodes = barsLayer.selectAll("g.bar-group").nodes();
            const index = nodes.indexOf(this);
            let target;
            switch (event.key) {
                case "ArrowRight":
                case "ArrowDown":
                    target = nodes[Math.min(nodes.length - 1, index + 1)];
                    break;
                case "ArrowLeft":
                case "ArrowUp":
                    target = nodes[Math.max(0, index - 1)];
                    break;
                case "Home":
                    target = nodes[0];
                    break;
                case "End":
                    target = nodes[nodes.length - 1];
                    break;
                case "Enter":
                case " ":
                    event.preventDefault();
                    listeners.call("barClick", this, event, d);
                    return;
                default:
                    return;
            }
            event.preventDefault();
            if (target && typeof target.focus === "function")
                target.focus();
        });
    }
    function configureBrush(svg, brushLayer, ctx, state) {
        if (!config.enableBrush || ctx.horizontal) {
            brushLayer.on(".brush", null).selectAll("*").remove();
            state.emphasis = null;
            state.brush = null;
            return;
        }
        const { margins, width, height } = ctx;
        const w = barWidth(ctx);
        const brush = d3
            .brushX()
            // With zoom enabled, Shift+drag is reserved for panning
            .filter((event) => !event.ctrlKey && !event.button && !(config.enableZoom && event.shiftKey))
            .keyModifiers(!config.enableZoom)
            .extent([
            [margins.left, margins.top],
            [width - margins.right, height - margins.bottom],
        ])
            .on("end", (event) => {
            if (!event.sourceEvent)
                return;
            let selected = [];
            if (event.selection) {
                const [x0, x1] = event.selection;
                selected = ctx.data.filter(d => {
                    const cx = barX(ctx, d) + w / 2;
                    return cx >= x0 && cx <= x1;
                });
                state.emphasis = new Set(selected.map(d => d.label));
            }
            else {
                state.emphasis = null;
            }
            applyEmphasis(svg, state.emphasis);
            listeners.call("brushSelection", svg.node(), event, selected);
        });
        state.brush = brush;
        brushLayer.call(brush);
        brushLayer
            .select(".selection")
            .attr("fill", ctx.style.accent)
            .attr("fill-opacity", 0.12)
            .attr("stroke", ctx.style.accent)
            .attr("stroke-opacity", 0.6)
            .attr("rx", 4);
    }
    function configureZoom(svg, ctx, state) {
        if (!config.enableZoom || ctx.horizontal) {
            if (state.zoom) {
                svg.on(".zoom", null);
                svg.property("__zoom", d3.zoomIdentity);
                state.zoom = null;
            }
            state.transform = d3.zoomIdentity;
            return;
        }
        const { margins, width, height } = ctx;
        const extent = [
            [margins.left, margins.top],
            [width - margins.right, height - margins.bottom],
        ];
        if (!state.zoom) {
            const svgNode = svg.node();
            state.zoom = d3.zoom().on("zoom", (event) => {
                const s = states.get(svgNode);
                if (!s)
                    return;
                s.transform = event.transform;
                // A brush selection is in pixel space; it no longer matches the bars after a zoom/pan
                const hadSelection = s.emphasis !== null;
                if (s.brush) {
                    d3.select(svgNode)
                        .select(".brush-layer")
                        .call(s.brush.clear);
                }
                s.emphasis = null;
                if (hadSelection)
                    listeners.call("brushSelection", svgNode, event, []);
                // Coalesce bursts of zoom events (wheel, pan) into one render per frame
                if (s.frame === null) {
                    const raf = typeof requestAnimationFrame === "function" ? requestAnimationFrame : (cb) => setTimeout(cb, 16);
                    s.frame = raf(() => {
                        s.frame = null;
                        renderElement(svgNode, s.data, 0);
                    });
                }
            });
            svg.call(state.zoom);
        }
        // When brushing is on, plain drags belong to the brush; pan with Shift+drag (wheel always zooms)
        state.zoom.filter((event) => {
            if (event.type === "wheel")
                return true;
            if ("button" in event && event.button)
                return false;
            if (config.enableBrush && (event.type === "mousedown" || event.type === "pointerdown"))
                return event.shiftKey;
            return !event.ctrlKey;
        });
        state.zoom
            .scaleExtent(config.zoomConfig.scaleExtent || [1, 8])
            .extent(extent)
            .translateExtent(config.zoomConfig.translateExtent || extent);
    }
    const chart = function chart(selection) {
        selection.each(function (datum) {
            const data = Array.isArray(datum) ? datum : boundData;
            if (!data || !Array.isArray(data)) {
                console.warn("MintWaterfall: Invalid data provided. Expected an array.");
                return;
            }
            if (data.length === 0) {
                console.warn("MintWaterfall: Empty data array provided.");
                return;
            }
            if (!isValidChartData(data)) {
                console.error("MintWaterfall: Invalid data structure. Each item needs a 'label' string and either a 'stacks' array of { value: number, color?: string } or 'subtotal: true'.");
                return;
            }
            try {
                renderElement(this, data);
            }
            catch (error) {
                console.error("MintWaterfall rendering error:", error);
                if (!this || typeof this.nodeName !== "string")
                    return;
                const target = d3.select(this);
                const svg = this.nodeName.toLowerCase() === "svg" ? target : target.select("svg");
                if (svg && !svg.empty()) {
                    svg.selectAll("*").remove();
                    svg.append("text")
                        .attr("x", config.width / 2)
                        .attr("y", config.height / 2)
                        .attr("text-anchor", "middle")
                        .attr("fill", "#ef4444")
                        .style("font-size", "14px")
                        .text(`Chart error: ${error instanceof Error ? error.message : String(error)}`);
                }
            }
        });
    };
    // Getter/setter methods using a generic accessor pattern
    function accessor(get, set) {
        return function (value) {
            if (arguments.length === 0)
                return get();
            set(value);
            return chart;
        };
    }
    chart.width = accessor(() => config.width, v => {
        config.width = v;
    });
    chart.height = accessor(() => config.height, v => {
        config.height = v;
    });
    chart.margin = accessor(() => config.margin, v => {
        config.margin = v;
    });
    chart.stacked = accessor(() => config.stacked, v => {
        config.stacked = v;
    });
    chart.showTotal = accessor(() => config.showTotal, v => {
        config.showTotal = v;
    });
    chart.totalLabel = accessor(() => config.totalLabel, v => {
        config.totalLabel = v;
    });
    chart.totalColor = accessor(() => config.totalColor, v => {
        config.totalColor = v;
        totalColorOverride = true;
    });
    chart.barPadding = accessor(() => config.barPadding, v => {
        config.barPadding = v;
    });
    chart.duration = accessor(() => config.duration, v => {
        config.duration = v;
    });
    chart.ease = accessor(() => config.ease, v => {
        config.ease = v;
    });
    chart.formatNumber = accessor(() => config.formatNumber, v => {
        config.formatNumber = v;
    });
    chart.theme = accessor(() => config.theme, v => {
        config.theme = v;
        // A theme sets the total color; a later chart.totalColor(...) call overrides it
        totalColorOverride = false;
        if (v) {
            const resolved = resolvedThemeName(config);
            config.advancedColorConfig.enabled = true;
            config.advancedColorConfig.themeName = resolved;
            config.colorMode = "conditional";
            if (themes[resolved])
                config.totalColor = themes[resolved].totalColor;
        }
        else {
            config.advancedColorConfig.enabled = false;
            config.totalColor = defaultConfig.totalColor;
        }
    });
    chart.enableBrush = accessor(() => config.enableBrush, v => {
        config.enableBrush = v;
    });
    chart.brushOptions = accessor(() => config.brushOptions, v => {
        config.brushOptions = v;
    });
    chart.staggeredAnimations = accessor(() => config.staggeredAnimations, v => {
        config.staggeredAnimations = v;
    });
    chart.staggerDelay = accessor(() => config.staggerDelay, v => {
        config.staggerDelay = v;
    });
    chart.scaleType = accessor(() => config.scaleType, v => {
        config.scaleType = v;
    });
    chart.showTrendLine = accessor(() => config.showTrendLine, v => {
        config.showTrendLine = v;
    });
    chart.trendLineColor = accessor(() => config.trendLineColor, v => {
        config.trendLineColor = v;
    });
    chart.trendLineWidth = accessor(() => config.trendLineWidth, v => {
        config.trendLineWidth = v;
    });
    chart.trendLineStyle = accessor(() => config.trendLineStyle, v => {
        config.trendLineStyle = v;
    });
    chart.trendLineOpacity = accessor(() => config.trendLineOpacity, v => {
        config.trendLineOpacity = v;
    });
    chart.trendLineType = accessor(() => config.trendLineType, v => {
        config.trendLineType = v;
    });
    chart.trendLineWindow = accessor(() => config.trendLineWindow, v => {
        config.trendLineWindow = v;
    });
    chart.trendLineDegree = accessor(() => config.trendLineDegree, v => {
        config.trendLineDegree = v;
    });
    chart.enableAccessibility = accessor(() => config.enableAccessibility, v => {
        config.enableAccessibility = v;
    });
    chart.enableTooltips = accessor(() => config.enableTooltips, v => {
        config.enableTooltips = v;
        if (!v && tooltip)
            tooltip.hide();
    });
    chart.tooltipConfig = accessor(() => config.tooltipConfig, v => {
        config.tooltipConfig = v;
    });
    chart.enableExport = accessor(() => config.enableExport, v => {
        config.enableExport = v;
    });
    chart.exportConfig = accessor(() => config.exportConfig, v => {
        config.exportConfig = v;
    });
    chart.enableZoom = accessor(() => config.enableZoom, v => {
        config.enableZoom = v;
    });
    chart.zoomConfig = accessor(() => config.zoomConfig, v => {
        config.zoomConfig = v;
    });
    chart.responsive = accessor(() => config.responsive, v => {
        config.responsive = v;
    });
    chart.showValueLabels = accessor(() => config.showValueLabels, v => {
        config.showValueLabels = v;
    });
    chart.showConnectors = accessor(() => config.showConnectors, v => {
        config.showConnectors = v;
    });
    chart.showGrid = accessor(() => config.showGrid, v => {
        config.showGrid = v;
    });
    chart.barRadius = accessor(() => config.barRadius, v => {
        config.barRadius = v;
    });
    chart.tooltipContent = accessor(() => config.tooltipContent, v => {
        config.tooltipContent = v;
    });
    chart.valueLabel = accessor(() => config.valueLabel, v => {
        config.valueLabel = v;
    });
    chart.showLegend = accessor(() => config.showLegend, v => {
        config.showLegend = v;
    });
    chart.orientation = accessor(() => config.orientation, v => {
        config.orientation = v === "horizontal" ? "horizontal" : "vertical";
    });
    chart.enableAdvancedColors = accessor(() => config.advancedColorConfig.enabled, v => {
        config.advancedColorConfig.enabled = v;
    });
    chart.colorMode = accessor(() => config.colorMode, v => {
        config.colorMode = v;
    });
    chart.colorTheme = accessor(() => config.advancedColorConfig.themeName || "default", v => {
        config.advancedColorConfig.themeName = v;
    });
    chart.neutralThreshold = accessor(() => config.advancedColorConfig.neutralThreshold || 0, v => {
        config.advancedColorConfig.neutralThreshold = v;
    });
    // Partial objects merge into the current config (as in 1.x)
    chart.confidenceBands = accessor(() => config.confidenceBandConfig, (v) => {
        config.confidenceBandConfig = { ...config.confidenceBandConfig, ...v };
    });
    chart.enableConfidenceBands = accessor(() => config.confidenceBandConfig.enabled, v => {
        config.confidenceBandConfig.enabled = v;
    });
    chart.milestones = accessor(() => config.milestoneConfig, (v) => {
        config.milestoneConfig = {
            ...config.milestoneConfig,
            ...v,
            milestones: [...(v.milestones ?? config.milestoneConfig.milestones)],
        };
    });
    chart.enableMilestones = accessor(() => config.milestoneConfig.enabled, v => {
        config.milestoneConfig.enabled = v;
    });
    chart.addMilestone = function (milestone) {
        config.milestoneConfig.milestones.push(milestone);
        return chart;
    };
    chart.data = function (value) {
        if (arguments.length === 0)
            return boundData;
        boundData = value ?? null;
        return chart;
    };
    chart.on = function (...args) {
        const value = listeners.on.apply(listeners, args);
        return value === listeners ? chart : value;
    };
    chart.export = function (format, options = {}) {
        if (!config.enableExport) {
            return Promise.reject(new Error("MintWaterfall: export is disabled. Enable it with chart.enableExport(true)."));
        }
        if (!lastSvg) {
            return Promise.reject(new Error("MintWaterfall: render the chart before exporting."));
        }
        const svgNode = lastSvg;
        const container = { select: () => d3.select(svgNode), node: () => svgNode };
        // Pad with the theme background so dark themes don't get a white frame
        const opts = { background: resolveStyle(config).background || "#ffffff", ...config.exportConfig, ...options };
        try {
            switch (format) {
                case "svg":
                    return Promise.resolve(exportSystem.exportSVG(container, opts));
                case "png":
                    return exportSystem.exportPNG(container, opts);
                case "json":
                case "csv": {
                    const rows = lastProcessed.map(d => ({
                        label: d.label,
                        type: barKind(d),
                        value: d.barTotal,
                        runningTotal: d.cumulativeTotal,
                    }));
                    return Promise.resolve(exportSystem.exportData(rows, { ...opts, dataFormat: format }));
                }
                default:
                    return Promise.reject(new Error(`MintWaterfall: unsupported export format "${format}".`));
            }
        }
        catch (error) {
            return Promise.reject(error);
        }
    };
    chart.destroy = function () {
        if (tooltip) {
            tooltip.destroy();
            tooltip = null;
        }
        renderedSvgs.forEach(svgNode => {
            const svg = d3.select(svgNode);
            svg.on(".zoom", null);
            svg.select(".brush-layer").on(".brush", null);
            const state = states.get(svgNode);
            if (state) {
                state.zoom = null;
                if (state.resize)
                    state.resize.disconnect();
                state.resize = null;
                if (state.frame !== null && typeof cancelAnimationFrame === "function")
                    cancelAnimationFrame(state.frame);
                state.frame = null;
            }
        });
        renderedSvgs.clear();
        if (colorSchemeQuery) {
            colorSchemeQuery.removeEventListener?.("change", onColorSchemeChange);
            colorSchemeQuery = null;
        }
    };
    return chart;
}

// MintWaterfall Data Validation
function validateData(data) {
    if (!data || !Array.isArray(data)) {
        throw new Error("Data must be an array");
    }
    if (data.length === 0) {
        throw new Error("Data array cannot be empty");
    }
    const isValid = data.every((item, index) => {
        if (!item || typeof item !== "object") {
            throw new Error(`Item at index ${index} must be an object`);
        }
        if (typeof item.label !== "string") {
            throw new Error(`Item at index ${index} must have a string 'label' property`);
        }
        if (!Array.isArray(item.stacks)) {
            throw new Error(`Item at index ${index} must have an array 'stacks' property`);
        }
        if (item.stacks.length === 0) {
            throw new Error(`Item at index ${index} must have at least one stack`);
        }
        item.stacks.forEach((stack, stackIndex) => {
            if (typeof stack.value !== "number" || isNaN(stack.value)) {
                throw new Error(`Stack ${stackIndex} in item ${index} must have a numeric 'value'`);
            }
            if (typeof stack.color !== "string") {
                throw new Error(`Stack ${stackIndex} in item ${index} must have a string 'color'`);
            }
        });
        return true;
    });
    return isValid;
}
function getDataSummary(data) {
    validateData(data);
    const allValues = [];
    const allColors = [];
    let totalStacks = 0;
    data.forEach(item => {
        item.stacks.forEach(stack => {
            allValues.push(stack.value);
            allColors.push(stack.color);
            totalStacks++;
        });
    });
    return {
        totalItems: data.length,
        totalStacks,
        valueRange: { min: Math.min(...allValues), max: Math.max(...allValues) },
        cumulativeTotal: allValues.reduce((sum, value) => sum + value, 0),
        stackColors: [...new Set(allColors)],
        labels: data.map(item => item.label),
    };
}

// MintWaterfall Data Transforms
// Data loading utilities
async function loadData(source, options = {}) {
    // Reserved for future use: parseNumbers, dateColumns, valueColumn,
    // labelColumn, colorColumn, stacksColumn options
    try {
        let rawData;
        if (typeof source === "string") {
            // URL or file path
            if (source.endsWith(".csv")) {
                rawData = await d3.csv(source);
            }
            else if (source.endsWith(".json")) {
                rawData = await d3.json(source);
            }
            else if (source.endsWith(".tsv")) {
                rawData = await d3.tsv(source);
            }
            else {
                // Try to detect if it's a URL by checking for http/https
                if (source.startsWith("http")) {
                    const response = await fetch(source);
                    const contentType = response.headers.get("content-type");
                    if (contentType?.includes("application/json")) {
                        rawData = await response.json();
                    }
                    else if (contentType?.includes("text/csv")) {
                        const text = await response.text();
                        rawData = d3.csvParse(text);
                    }
                    else {
                        rawData = await response.json(); // fallback
                    }
                }
                else {
                    throw new Error(`Unsupported file format: ${source}`);
                }
            }
        }
        else if (Array.isArray(source)) {
            // Already an array
            rawData = source;
        }
        else {
            throw new Error("Source must be a URL, file path, or data array");
        }
        // Transform raw data to MintWaterfall format if needed
        return transformToWaterfallFormat(rawData, options);
    }
    catch (error) {
        console.error("Error loading data:", error);
        throw error;
    }
}
// Transform various data formats to MintWaterfall format
function transformToWaterfallFormat(data, options = {}) {
    const { valueColumn = "value", labelColumn = "label", colorColumn = "color", 
    // stacksColumn = "stacks", // Reserved for future use
    defaultColor = "#3498db", parseNumbers = true, } = options;
    if (!Array.isArray(data)) {
        throw new Error("Data must be an array");
    }
    return data.map((item, index) => {
        // If already in correct format, return as-is
        if (item.label && Array.isArray(item.stacks)) {
            return item;
        }
        // Transform flat format to stacked format
        const label = item[labelColumn] || `Item ${index + 1}`;
        let value = item[valueColumn];
        if (parseNumbers && typeof value === "string") {
            value = parseFloat(value.replace(/[,$]/g, "")) || 0;
        }
        else if (typeof value !== "number") {
            value = 0;
        }
        const color = item[colorColumn] || defaultColor;
        return {
            label: String(label),
            stacks: [
                {
                    value: value,
                    color: color,
                    label: item.stackLabel || `${value >= 0 ? "+" : ""}${value}`,
                },
            ],
        };
    });
}
function aggregateData(data, aggregateBy = "sum") {
    validateData(data);
    return data.map((item) => {
        let aggregatedValue;
        switch (aggregateBy) {
            case "sum":
                aggregatedValue = item.stacks.reduce((sum, stack) => sum + stack.value, 0);
                break;
            case "average":
                aggregatedValue = item.stacks.reduce((sum, stack) => sum + stack.value, 0) / item.stacks.length;
                break;
            case "max":
                aggregatedValue = Math.max(...item.stacks.map(s => s.value));
                break;
            case "min":
                aggregatedValue = Math.min(...item.stacks.map(s => s.value));
                break;
            default:
                aggregatedValue = item.stacks.reduce((sum, stack) => sum + stack.value, 0);
        }
        return {
            ...item,
            aggregatedValue,
            originalStacks: item.stacks,
        };
    });
}
function sortData(data, sortBy = "label", direction = "ascending") {
    validateData(data);
    const sorted = [...data].sort((a, b) => {
        let valueA, valueB;
        switch (sortBy) {
            case "label":
                valueA = a.label.toLowerCase();
                valueB = b.label.toLowerCase();
                break;
            case "total": {
                // Calculate total for each item
                const totalA = a.stacks.reduce((sum, stack) => sum + stack.value, 0);
                const totalB = b.stacks.reduce((sum, stack) => sum + stack.value, 0);
                // Smart sorting: use absolute value for comparison to handle decremental waterfalls
                // This ensures that larger impacts (whether positive or negative) are sorted appropriately
                valueA = Math.abs(totalA);
                valueB = Math.abs(totalB);
                break;
            }
            case "maxStack":
                valueA = Math.max(...a.stacks.map(s => s.value));
                valueB = Math.max(...b.stacks.map(s => s.value));
                break;
            case "minStack":
                valueA = Math.min(...a.stacks.map(s => s.value));
                valueB = Math.min(...b.stacks.map(s => s.value));
                break;
            default:
                valueA = a.label.toLowerCase();
                valueB = b.label.toLowerCase();
        }
        let comparison;
        if (typeof valueA === "string" && typeof valueB === "string") {
            comparison = valueA.localeCompare(valueB);
        }
        else {
            comparison = valueA - valueB;
        }
        return direction === "ascending" ? comparison : -comparison;
    });
    return sorted;
}
function filterData(data, filterFn) {
    validateData(data);
    return data.filter(filterFn);
}
function transformData(data, transformFn) {
    validateData(data);
    return data.map(transformFn);
}
function groupData(data, groupBy) {
    validateData(data);
    const groups = new Map();
    data.forEach(item => {
        const key = typeof groupBy === "function" ? groupBy(item) : item.label;
        if (!groups.has(key)) {
            groups.set(key, []);
        }
        groups.get(key).push(item);
    });
    return groups;
}
function transformStacks(data, transformer) {
    if (typeof transformer !== "function") {
        throw new Error("Transformer must be a function");
    }
    return data.map(item => ({
        ...item,
        stacks: item.stacks.map(transformer),
    }));
}
function normalizeValues(data, targetMax) {
    // Find the maximum absolute value across all stacks
    let maxValue = 0;
    data.forEach(item => {
        item.stacks.forEach(stack => {
            maxValue = Math.max(maxValue, Math.abs(stack.value));
        });
    });
    if (maxValue === 0)
        return data;
    const scaleFactor = targetMax / maxValue;
    return data.map(item => ({
        ...item,
        stacks: item.stacks.map(stack => ({
            ...stack,
            originalValue: stack.value,
            value: stack.value * scaleFactor,
        })),
    }));
}
function groupByCategory(data, categoryFunction) {
    if (typeof categoryFunction !== "function") {
        throw new Error("Category function must be a function");
    }
    const groups = {};
    data.forEach(item => {
        const category = categoryFunction(item);
        if (!groups[category]) {
            groups[category] = [];
        }
        groups[category].push(item);
    });
    return groups;
}
function calculatePercentages(data) {
    return data.map(item => {
        const total = item.stacks.reduce((sum, stack) => sum + Math.abs(stack.value), 0);
        return {
            ...item,
            stacks: item.stacks.map(stack => ({
                ...stack,
                percentage: total === 0 ? 0 : (Math.abs(stack.value) / total) * 100,
            })),
        };
    });
}
function interpolateData(data1, data2, t) {
    if (data1.length !== data2.length) {
        throw new Error("Data arrays must have the same length");
    }
    return data1.map((item1, index) => {
        const item2 = data2[index];
        const minStacks = Math.min(item1.stacks.length, item2.stacks.length);
        return {
            label: item1.label,
            stacks: Array.from({ length: minStacks }, (_, i) => ({
                value: item1.stacks[i].value + (item2.stacks[i].value - item1.stacks[i].value) * t,
                color: item1.stacks[i].color,
                label: item1.stacks[i].label,
            })),
        };
    });
}
function generateSampleData(itemCount, stacksPerItem, valueRange = [10, 100]) {
    const [minValue, maxValue] = valueRange;
    const colors = ["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd", "#8c564b", "#e377c2", "#7f7f7f", "#bcbd22", "#17becf"];
    return Array.from({ length: itemCount }, (_, i) => ({
        label: `Item ${i + 1}`,
        stacks: Array.from({ length: stacksPerItem }, (_, j) => ({
            value: Math.random() * (maxValue - minValue) + minValue,
            color: colors[j % colors.length],
            label: `Stack ${j + 1}`,
        })),
    }));
}

// MintWaterfall Advanced D3.js Data Operations
/**
 * Advanced multi-dimensional grouping using D3.js group() API
 * Supports 1-3 levels of nested grouping
 */
function groupBy(data, ...keys) {
    if (!Array.isArray(data)) {
        throw new Error("Data must be an array");
    }
    if (keys.length === 0) {
        throw new Error("At least one grouping key must be provided");
    }
    if (keys.length === 1) {
        return d3.group(data, keys[0]);
    }
    else if (keys.length === 2) {
        return d3.group(data, keys[0], keys[1]);
    }
    else if (keys.length === 3) {
        return d3.group(data, keys[0], keys[1], keys[2]);
    }
    else {
        throw new Error("Maximum 3 levels of grouping supported");
    }
}
/**
 * Advanced aggregation using D3.js rollup() API
 * Supports multi-dimensional rollup with custom reducers
 */
function rollupBy(data, reducer, ...keys) {
    if (!Array.isArray(data)) {
        throw new Error("Data must be an array");
    }
    if (typeof reducer !== "function") {
        throw new Error("Reducer must be a function");
    }
    if (keys.length === 0) {
        throw new Error("At least one grouping key must be provided");
    }
    if (keys.length === 1) {
        return d3.rollup(data, reducer, keys[0]);
    }
    else if (keys.length === 2) {
        return d3.rollup(data, reducer, keys[0], keys[1]);
    }
    else if (keys.length === 3) {
        return d3.rollup(data, reducer, keys[0], keys[1], keys[2]);
    }
    else {
        throw new Error("Maximum 3 levels of rollup supported");
    }
}
/**
 * Flatten hierarchical rollup using D3.js flatRollup() API
 * Returns array of [key1, key2, ..., value] tuples
 */
function flatRollupBy(data, reducer, ...keys) {
    if (!Array.isArray(data)) {
        throw new Error("Data must be an array");
    }
    if (typeof reducer !== "function") {
        throw new Error("Reducer must be a function");
    }
    if (keys.length === 0) {
        throw new Error("At least one grouping key must be provided");
    }
    return d3.flatRollup(data, reducer, ...keys);
}
/**
 * Cross-tabulation using D3.js cross() API
 * Creates cartesian product with optional combiner function
 */
function crossTabulate(data1, data2, combiner) {
    if (!Array.isArray(data1) || !Array.isArray(data2)) {
        throw new Error("Both data arrays must be arrays");
    }
    if (combiner) {
        return d3.cross(data1, data2, (a, b) => ({
            row: a,
            col: b,
            value: combiner(a, b),
        }));
    }
    else {
        return d3.cross(data1, data2, (a, b) => ({
            row: a,
            col: b,
            value: undefined,
        }));
    }
}
/**
 * Fast data indexing using D3.js index() API
 * Creates map-based indexes for O(1) lookups
 */
function indexBy(data, ...keys) {
    if (!Array.isArray(data)) {
        throw new Error("Data must be an array");
    }
    if (keys.length === 0) {
        throw new Error("At least one indexing key must be provided");
    }
    if (keys.length === 1) {
        return d3.index(data, keys[0]);
    }
    else if (keys.length === 2) {
        return d3.index(data, keys[0], keys[1]);
    }
    else {
        throw new Error("Maximum 2 levels of indexing supported");
    }
}
/**
 * Temporal aggregation for time-series waterfall data
 * Groups data by time intervals and aggregates values
 */
function aggregateByTime(data, options) {
    const { timeAccessor, valueAccessor, interval, aggregation = "sum" } = options;
    if (!Array.isArray(data)) {
        throw new Error("Data must be an array");
    }
    if (typeof timeAccessor !== "function" || typeof valueAccessor !== "function") {
        throw new Error("Time and value accessors must be functions");
    }
    // Group by time interval
    const grouped = d3.rollup(data, values => {
        switch (aggregation) {
            case "sum":
                return d3.sum(values, valueAccessor);
            case "average":
                return d3.mean(values, valueAccessor) || 0;
            case "max":
                return d3.max(values, valueAccessor) || 0;
            case "min":
                return d3.min(values, valueAccessor) || 0;
            default:
                return d3.sum(values, valueAccessor);
        }
    }, d => interval(timeAccessor(d)));
    // Convert to waterfall format
    return Array.from(grouped.entries()).map(([date, value]) => ({
        label: d3.timeFormat("%Y-%m-%d")(date),
        stacks: [
            {
                value: value,
                color: value >= 0 ? "#2ecc71" : "#e74c3c",
                label: `${value >= 0 ? "+" : ""}${d3.format(".2f")(value)}`,
            },
        ],
    }));
}
/**
 * Create multi-dimensional waterfall from hierarchical data
 * Groups by multiple keys and creates stacked waterfall segments
 */
function createMultiDimensionalWaterfall(data, groupKeys, valueKey) {
    if (!Array.isArray(data) || !Array.isArray(groupKeys)) {
        throw new Error("Data and groupKeys must be arrays");
    }
    if (groupKeys.length === 0) {
        throw new Error("At least one group key must be provided");
    }
    // Create accessor functions for the keys
    const accessors = groupKeys.map(key => (d) => d[key]);
    // Use flatRollup to get flat aggregated data
    const aggregated = d3.flatRollup(data, values => d3.sum(values, (d) => d[valueKey] || 0), ...accessors);
    // Convert to waterfall format
    return aggregated.map(item => {
        const keys = item.slice(0, -1); // All but last element
        const value = item[item.length - 1]; // Last element
        const label = keys.join(" → ");
        const colors = ["#3498db", "#2ecc71", "#f39c12", "#e74c3c", "#9b59b6"];
        const colorIndex = Math.abs(keys
            .join("")
            .split("")
            .reduce((a, b) => a + b.charCodeAt(0), 0)) % colors.length;
        return {
            label,
            stacks: [
                {
                    value: value,
                    color: colors[colorIndex],
                    label: `${value >= 0 ? "+" : ""}${d3.format(".2f")(value)}`,
                },
            ],
        };
    });
}
/**
 * Aggregate existing waterfall data by time periods
 * Useful for rolling up daily waterfalls into weekly/monthly
 */
function aggregateWaterfallByPeriod(data, timeKey, interval) {
    validateData(data);
    // Extract time values and group by interval
    const timeGrouped = d3.rollup(data, items => {
        // Aggregate all stacks across items in this time period
        const allStacks = [];
        items.forEach(item => allStacks.push(...item.stacks));
        // Group stacks by color and sum values
        const stacksByColor = d3.rollup(allStacks, stacks => ({
            value: d3.sum(stacks, s => s.value),
            label: stacks[0].label,
            color: stacks[0].color,
        }), s => s.color);
        return Array.from(stacksByColor.values());
    }, item => {
        // Try to parse time from the item (assuming it's in the label or a property)
        const timeStr = item[timeKey] || item.label;
        const date = new Date(timeStr);
        return isNaN(date.getTime()) ? new Date() : interval(date);
    });
    // Convert to waterfall format
    return Array.from(timeGrouped.entries()).map(([date, stacks]) => ({
        label: d3.timeFormat("%Y-%m-%d")(date),
        stacks: stacks,
    }));
}
/**
 * Create breakdown waterfall showing primary categories and their breakdowns
 * Useful for drill-down analysis
 */
function createBreakdownWaterfall(data, primaryKey, breakdownKey, valueKey) {
    if (!Array.isArray(data)) {
        throw new Error("Data must be an array");
    }
    // First group by primary key, then by breakdown key
    const nested = d3.rollup(data, values => d3.sum(values, (d) => d[valueKey] || 0), (d) => d[primaryKey], (d) => d[breakdownKey]);
    // Convert to waterfall format with stacked breakdowns
    return Array.from(nested.entries()).map(([primaryValue, breakdowns]) => {
        const stacks = Array.from(breakdowns.entries()).map(([breakdownValue, value], index) => {
            const colors = ["#3498db", "#2ecc71", "#f39c12", "#e74c3c", "#9b59b6", "#1abc9c", "#34495e"];
            return {
                value: value,
                color: colors[index % colors.length],
                label: `${breakdownValue}: ${value >= 0 ? "+" : ""}${d3.format(".2f")(value)}`,
            };
        });
        return {
            label: String(primaryValue),
            stacks,
        };
    });
}
// ============================================================================
// MISSING ADVANCED DATA PROCESSOR FUNCTIONS
// ============================================================================
/**
 * Creates an advanced data processor with D3.js data manipulation functions
 */
function createAdvancedDataProcessor() {
    // Group data by key using d3.group
    function groupBy(data, accessor) {
        if (!data || !Array.isArray(data) || !accessor) {
            return new Map();
        }
        return group(data, accessor);
    }
    // Rollup data with reducer using d3.rollup
    function rollupBy(data, reducer, accessor) {
        if (!data || !Array.isArray(data) || !reducer || !accessor) {
            return new Map();
        }
        return rollup(data, reducer, accessor);
    }
    // Flat rollup using d3.flatRollup
    function flatRollupBy(data, reducer, accessor) {
        if (!data || !Array.isArray(data) || !reducer || !accessor) {
            return [];
        }
        return flatRollup(data, reducer, accessor);
    }
    // Cross tabulate two arrays using d3.cross
    function crossTabulate(a, b, reducer) {
        if (!Array.isArray(a) || !Array.isArray(b)) {
            return [];
        }
        if (reducer) {
            return cross(a, b, reducer);
        }
        else {
            return cross(a, b);
        }
    }
    // Index data by key using d3.index
    function indexBy(data, accessor) {
        if (!data || !Array.isArray(data) || !accessor) {
            return new Map();
        }
        try {
            return index(data, accessor);
        }
        catch (error) {
            // Handle duplicate keys gracefully by creating a manual index
            const result = new Map();
            data.forEach(item => {
                const key = accessor(item);
                if (!result.has(key)) {
                    result.set(key, item);
                }
            });
            return result;
        }
    }
    // Aggregate data by time periods
    function aggregateByTime(data, timeAccessor, granularity, reducer) {
        if (!data || !Array.isArray(data) || !timeAccessor || !reducer) {
            return [];
        }
        const timeGroups = group(data, (d) => {
            const date = timeAccessor(d);
            if (!date || !(date instanceof Date))
                return "invalid";
            switch (granularity) {
                case "day":
                    return date.toISOString().split("T")[0];
                case "week": {
                    const week = new Date(date);
                    week.setDate(date.getDate() - date.getDay());
                    return week.toISOString().split("T")[0];
                }
                case "month":
                    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
                case "year":
                    return String(date.getFullYear());
                default:
                    return date.toISOString().split("T")[0];
            }
        });
        return Array.from(timeGroups.entries()).map(([period, values]) => ({
            period,
            data: reducer(values),
            count: values.length,
        }));
    }
    // Create multi-dimensional waterfall
    function createMultiDimensionalWaterfall(multiData, options) {
        const result = [];
        const { aggregationMethod = "sum" } = options;
        if (!multiData || typeof multiData !== "object") {
            return result;
        }
        const regions = Object.keys(multiData);
        let grandTotal = 0;
        for (const region of regions) {
            const data = multiData[region];
            if (!Array.isArray(data))
                continue;
            let regionTotal = 0;
            for (const item of data) {
                let value = 0;
                if (item.value !== undefined) {
                    value = item.value;
                }
                else if (item.stacks && Array.isArray(item.stacks)) {
                    value = item.stacks.reduce((sum, stack) => sum + (stack.value || 0), 0);
                }
                result.push({
                    ...item,
                    region,
                    value,
                    label: `${region}: ${item.label}`,
                });
                switch (aggregationMethod) {
                    case "sum":
                        regionTotal += value;
                        break;
                    case "average":
                        regionTotal += value;
                        break;
                    case "count":
                        regionTotal += 1;
                        break;
                    case "max":
                        regionTotal = Math.max(regionTotal, value);
                        break;
                    case "min":
                        regionTotal = regionTotal === 0 ? value : Math.min(regionTotal, value);
                        break;
                }
            }
            if (options.includeRegionalTotals) {
                result.push({
                    label: `${region} Total`,
                    value: aggregationMethod === "average" ? regionTotal / data.length : regionTotal,
                    region,
                    isRegionalTotal: true,
                });
            }
            grandTotal += regionTotal;
        }
        if (options.includeGrandTotal) {
            result.push({
                label: "Grand Total",
                value: grandTotal,
                isGrandTotal: true,
            });
        }
        return result;
    }
    // Aggregate waterfall by period with additional metrics
    function aggregateWaterfallByPeriod(data, periodField, options) {
        if (!data || !Array.isArray(data)) {
            return [];
        }
        const periodGroups = group(data, (d) => d[periodField] || "unknown");
        const result = Array.from(periodGroups.entries()).map(([period, items]) => {
            const total = items.reduce((sum, item) => {
                if (item.value !== undefined)
                    return sum + item.value;
                if (item.stacks && Array.isArray(item.stacks)) {
                    return sum + item.stacks.reduce((s, stack) => s + (stack.value || 0), 0);
                }
                return sum;
            }, 0);
            return {
                period,
                items,
                total,
                count: items.length,
                average: total / items.length,
                movingAverage: 0, // Will be calculated if requested
                growthRate: 0, // Will be calculated if requested
            };
        });
        // Add moving average if requested
        if (options.includeMovingAverage) {
            const window = options.movingAverageWindow || 3;
            result.forEach((item, index) => {
                const start = Math.max(0, index - Math.floor(window / 2));
                const end = Math.min(result.length, start + window);
                const windowData = result.slice(start, end);
                item.movingAverage = windowData.reduce((sum, w) => sum + w.total, 0) / windowData.length;
            });
        }
        // Add growth rates if requested
        if (options.calculateGrowthRates) {
            result.forEach((item, index) => {
                if (index > 0) {
                    const prev = result[index - 1];
                    item.growthRate = prev.total !== 0 ? (item.total - prev.total) / prev.total : 0;
                }
            });
        }
        return result;
    }
    // Create breakdown waterfall with sub-items
    function createBreakdownWaterfall(data, breakdownField, options) {
        if (!data || !Array.isArray(data)) {
            return [];
        }
        const result = [];
        for (const item of data) {
            const breakdowns = item[breakdownField];
            if (breakdowns && Array.isArray(breakdowns)) {
                // Add main item
                if (options.maintainOriginalStructure) {
                    result.push({ ...item, isMainItem: true });
                }
                // Add breakdown items
                let subtotal = 0;
                breakdowns.forEach((breakdown, index) => {
                    const breakdownItem = {
                        ...breakdown,
                        parentLabel: item.label,
                        isBreakdown: true,
                        breakdownIndex: index,
                        color: options.colorByBreakdown ? `hsl(${(index * 360) / breakdowns.length}, 70%, 60%)` : breakdown.color,
                    };
                    result.push(breakdownItem);
                    subtotal += breakdown.value || 0;
                });
                // Add subtotal if requested
                if (options.includeSubtotals && breakdowns.length > 1) {
                    result.push({
                        label: `${item.label} Subtotal`,
                        value: subtotal,
                        parentLabel: item.label,
                        isSubtotal: true,
                    });
                }
            }
            else {
                // No breakdown data, add as-is
                result.push({ ...item, hasBreakdown: false });
            }
        }
        return result;
    }
    // Additional methods needed by existing code
    function analyzeSequence(data) {
        // Simplified implementation for compatibility
        if (!Array.isArray(data) || data.length < 2) {
            return [];
        }
        return data.slice(1).map((item, index) => {
            const prev = data[index];
            const current = item;
            const prevValue = extractValue(prev);
            const currentValue = extractValue(current);
            const change = currentValue - prevValue;
            return {
                index,
                from: prev.label || `Item ${index}`,
                to: current.label || `Item ${index + 1}`,
                fromValue: prevValue,
                toValue: currentValue,
                change,
                percentChange: prevValue !== 0 ? (change / prevValue) * 100 : 0,
                direction: change > 0 ? "increase" : change < 0 ? "decrease" : "stable",
                magnitude: Math.abs(change) > 1000 ? "large" : Math.abs(change) > 100 ? "medium" : "small",
            };
        });
    }
    function suggestDataOptimizations(data) {
        // Simplified implementation for compatibility
        const suggestions = [];
        if (!Array.isArray(data) || data.length === 0) {
            return suggestions;
        }
        if (data.length > 20) {
            suggestions.push({
                type: "aggregation",
                priority: "medium",
                description: "Consider grouping similar items for better readability",
                impact: "Reduces visual clutter",
            });
        }
        return suggestions;
    }
    function generateCustomTicks(domain, options) {
        // Simplified implementation using d3.ticks
        const tickCount = options.targetTickCount || 8;
        return d3.ticks(domain[0], domain[1], tickCount);
    }
    function extractValue(item) {
        if (typeof item === "number")
            return item;
        if (item.value !== undefined)
            return item.value;
        if (item.stacks && Array.isArray(item.stacks)) {
            return item.stacks.reduce((sum, stack) => sum + (stack.value || 0), 0);
        }
        return 0;
    }
    // Return the processor interface
    return {
        groupBy,
        rollupBy,
        flatRollupBy,
        crossTabulate,
        indexBy,
        aggregateByTime,
        createMultiDimensionalWaterfall,
        aggregateWaterfallByPeriod,
        createBreakdownWaterfall,
        analyzeSequence,
        suggestDataOptimizations,
        generateCustomTicks,
    };
}

// MintWaterfall Data Pipeline - Composites all sub-modules
function createDataProcessor() {
    // Internal wrapper functions for the standalone functions
    async function loadDataWrapper(source, options = {}) {
        return await loadData(source, options);
    }
    function transformToWaterfallFormatWrapper(data, options = {}) {
        return transformToWaterfallFormat(data, options);
    }
    return {
        // Original methods
        validateData,
        loadData: loadDataWrapper,
        transformToWaterfallFormat: transformToWaterfallFormatWrapper,
        aggregateData,
        sortData,
        filterData,
        getDataSummary,
        transformData,
        groupData,
        transformStacks,
        normalizeValues,
        groupByCategory,
        calculatePercentages,
        interpolateData,
        generateSampleData,
        // Advanced D3.js data operations
        groupBy,
        rollupBy,
        flatRollupBy,
        crossTabulate,
        indexBy,
        aggregateByTime,
        createMultiDimensionalWaterfall,
        aggregateWaterfallByPeriod,
        createBreakdownWaterfall,
    };
}
// Export a default instance for backward compatibility
const dataProcessor = createDataProcessor();
// === STANDALONE ADVANCED DATA OPERATION HELPERS ===
/**
 * Create revenue waterfall by grouping sales data by multiple dimensions
 * Example: Group by Region → Product → Channel
 */
function createRevenueWaterfall(salesData, dimensions, valueField = "revenue") {
    return dataProcessor.createMultiDimensionalWaterfall(salesData, dimensions, valueField);
}
/**
 * Aggregate financial data by time periods for waterfall analysis
 * Example: Roll up daily P&L data into monthly waterfall
 */
function createTemporalWaterfall(data, timeField, valueField, interval = "month") {
    const timeIntervals = {
        day: d3.timeDay,
        week: d3.timeWeek,
        month: d3.timeMonth,
        quarter: d3.timeMonth.every(3),
        year: d3.timeYear,
    };
    return dataProcessor.aggregateByTime(data, {
        timeAccessor: d => new Date(d[timeField]),
        valueAccessor: d => d[valueField] || 0,
        interval: timeIntervals[interval],
        aggregation: "sum",
    });
}
/**
 * Create variance analysis waterfall comparing actuals vs budget
 * Shows positive/negative variances as waterfall segments
 */
function createVarianceWaterfall(data, categoryField, actualField = "actual", budgetField = "budget") {
    return data.map(item => {
        const actual = item[actualField] || 0;
        const budget = item[budgetField] || 0;
        const variance = actual - budget;
        return {
            label: item[categoryField],
            stacks: [
                {
                    value: variance,
                    color: variance >= 0 ? "#2ecc71" : "#e74c3c",
                    label: `Variance: ${variance >= 0 ? "+" : ""}${d3.format(".2f")(variance)}`,
                },
            ],
        };
    });
}
/**
 * Advanced data grouping with waterfall-optimized aggregation
 * Supports nested grouping with automatic color assignment.
 *
 * Each group becomes one bar whose value is the sum of `valueAccessor`. Labels are the group
 * keys joined with " → ", or `labelAccessor(firstRecordOfGroup)` when given.
 */
function groupWaterfallData(data, groupBy, valueAccessor, labelAccessor) {
    const grouped = d3.flatGroup(data, ...groupBy);
    const colors = ["#3498db", "#2ecc71", "#f39c12", "#e74c3c", "#9b59b6", "#1abc9c", "#34495e", "#95a5a6"];
    return grouped.map((item, index) => {
        const keys = item.slice(0, -1); // group keys
        const members = item[item.length - 1]; // records in the group
        const value = d3.sum(members, valueAccessor);
        const label = labelAccessor ? labelAccessor(members[0]) : keys.join(" → ");
        return {
            label,
            stacks: [
                {
                    value: value,
                    color: colors[index % colors.length],
                    label: `${value >= 0 ? "+" : ""}${d3.format(".2f")(value)}`,
                },
            ],
        };
    });
}
/**
 * Cross-tabulate two datasets to create comparison waterfall
 * Useful for period-over-period analysis
 */
function createComparisonWaterfall(currentPeriod, previousPeriod, categoryAccessor, valueAccessor) {
    // Index previous period for fast lookup
    const prevIndex = d3.index(previousPeriod, categoryAccessor);
    return currentPeriod.map(currentItem => {
        const category = categoryAccessor(currentItem);
        const currentValue = valueAccessor(currentItem);
        const prevItem = prevIndex.get(category);
        const prevValue = prevItem ? valueAccessor(prevItem) : 0;
        const change = currentValue - prevValue;
        return {
            label: category,
            stacks: [
                {
                    value: change,
                    color: change >= 0 ? "#2ecc71" : "#e74c3c",
                    label: `Change: ${change >= 0 ? "+" : ""}${d3.format(".2f")(change)}`,
                },
            ],
        };
    });
}
/**
 * Transform flat transaction data into hierarchical waterfall
 * Automatically detects categories and subcategories
 */
function transformTransactionData(transactions, categoryField, subcategoryField, valueField = "amount", _dateField) {
    if (subcategoryField) {
        // Two-level breakdown
        return dataProcessor.createBreakdownWaterfall(transactions, categoryField, subcategoryField, valueField);
    }
    else {
        // Simple category aggregation
        const aggregated = dataProcessor.rollupBy(transactions, values => d3.sum(values, (d) => d[valueField] || 0), (d) => d[categoryField]);
        const colors = ["#3498db", "#2ecc71", "#f39c12", "#e74c3c", "#9b59b6"];
        let colorIndex = 0;
        return Array.from(aggregated.entries()).map(([category, value]) => ({
            label: String(category),
            stacks: [
                {
                    value: value,
                    color: colors[colorIndex++ % colors.length],
                    label: `${value >= 0 ? "+" : ""}${d3.format(".2f")(value)}`,
                },
            ],
        }));
    }
}
/**
 * Create common financial reducers for rollup operations
 */
const financialReducers = {
    sum: (values) => d3.sum(values, (d) => d.value || 0),
    average: (values) => d3.mean(values, (d) => d.value || 0) || 0,
    weightedAverage: (values, weightField = "weight") => {
        const totalWeight = d3.sum(values, (d) => d[weightField] || 0);
        if (totalWeight === 0)
            return 0;
        return d3.sum(values, (d) => (d.value || 0) * (d[weightField] || 0)) / totalWeight;
    },
    variance: (values) => {
        const mean = d3.mean(values, (d) => d.value || 0) || 0;
        return d3.mean(values, (d) => Math.pow((d.value || 0) - mean, 2)) || 0;
    },
    percentile: (p) => (values) => {
        const sorted = values.map((d) => d.value || 0).sort(d3.ascending);
        return d3.quantile(sorted, p / 100) || 0;
    },
};
/**
 * Export commonly used D3.js data manipulation functions for convenience
 */
const d3DataUtils = {
    group: d3.group,
    rollup: d3.rollup,
    flatRollup: d3.flatRollup,
    cross: d3.cross,
    index: d3.index,
    sum: d3.sum,
    mean: d3.mean,
    median: d3.median,
    quantile: d3.quantile,
    min: d3.min,
    max: d3.max,
    extent: d3.extent,
    ascending: d3.ascending,
    descending: d3.descending,
};

// MintWaterfall Animation and Transitions System - TypeScript Version
// Provides smooth animations and transitions for chart updates with full type safety
function createAnimationSystem() {
    // Advanced transition configuration
    const transitionConfig = {
        staggerDelay: 100, // Default stagger delay between elements
        defaultDuration: 750, // Default animation duration
        defaultEase: "easeOutQuad",
    };
    function createEasingFunctions() {
        return {
            linear: (t) => t,
            easeInQuad: (t) => t * t,
            easeOutQuad: (t) => t * (2 - t),
            easeInOutQuad: (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
            easeInCubic: (t) => t * t * t,
            easeOutCubic: (t) => --t * t * t + 1,
            easeInOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1),
            easeInSine: (t) => 1 - Math.cos((t * Math.PI) / 2),
            easeOutSine: (t) => Math.sin((t * Math.PI) / 2),
            easeInOutSine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
            easeInElastic: (t) => {
                const c4 = (2 * Math.PI) / 3;
                return t === 0 ? 0 : t === 1 ? 1 : -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * c4);
            },
            easeOutElastic: (t) => {
                const c4 = (2 * Math.PI) / 3;
                return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
            },
            easeOutBounce: (t) => {
                const n1 = 7.5625;
                const d1 = 2.75;
                if (t < 1 / d1) {
                    return n1 * t * t;
                }
                else if (t < 2 / d1) {
                    return n1 * (t -= 1.5 / d1) * t + 0.75;
                }
                else if (t < 2.5 / d1) {
                    return n1 * (t -= 2.25 / d1) * t + 0.9375;
                }
                else {
                    return n1 * (t -= 2.625 / d1) * t + 0.984375;
                }
            },
        };
    }
    const easingFunctions = createEasingFunctions();
    function animateValue(startValue, endValue, duration, easingType = "easeOutQuad", onUpdate, onComplete) {
        const startTime = performance.now();
        const valueRange = endValue - startValue;
        const easing = easingFunctions[easingType] || easingFunctions.easeOutQuad;
        function frame(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easedProgress = easing(progress);
            const currentValue = startValue + valueRange * easedProgress;
            if (onUpdate) {
                onUpdate(currentValue, progress);
            }
            if (progress < 1) {
                requestAnimationFrame(frame);
            }
            else if (onComplete) {
                onComplete();
            }
        }
        requestAnimationFrame(frame);
    }
    function staggeredAnimation(items, animationFn, staggerDelay = 100, totalDuration = 1000) {
        if (!Array.isArray(items)) {
            throw new Error("Items must be an array");
        }
        items.forEach((item, index) => {
            const delay = index * staggerDelay;
            const adjustedDuration = totalDuration - delay;
            setTimeout(() => {
                if (adjustedDuration > 0) {
                    animationFn(item, index, adjustedDuration);
                }
            }, delay);
        });
    }
    function morphShape(fromPath, toPath, duration = 1000, easingType = "easeInOutQuad", onUpdate, onComplete) {
        // Simple path morphing for basic shapes
        // Note: In a real implementation, you'd want more sophisticated path interpolation
        if (typeof fromPath !== "string" || typeof toPath !== "string") {
            throw new Error("Path values must be strings");
        }
        const startTime = performance.now();
        const easing = easingFunctions[easingType] || easingFunctions.easeInOutQuad;
        function frame(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easedProgress = easing(progress);
            // Simple interpolation - in production, use a proper path morphing library
            const interpolatedPath = progress < 0.5 ? fromPath : toPath;
            if (onUpdate) {
                onUpdate(interpolatedPath, easedProgress);
            }
            if (progress < 1) {
                requestAnimationFrame(frame);
            }
            else if (onComplete) {
                onComplete();
            }
        }
        requestAnimationFrame(frame);
    }
    function fadeTransition(element, fromOpacity, toOpacity, duration = 500, easingType = "easeOutQuad") {
        return new Promise(resolve => {
            animateValue(fromOpacity, toOpacity, duration, easingType, value => {
                if (element && element.style) {
                    element.style.opacity = value.toString();
                }
                else if (element && element.attr) {
                    // D3 selection
                    element.attr("opacity", value);
                }
            }, () => resolve());
        });
    }
    function slideTransition(element, fromX, toX, duration = 500, easingType = "easeOutQuad") {
        return new Promise(resolve => {
            animateValue(fromX, toX, duration, easingType, value => {
                if (element && element.style) {
                    element.style.transform = `translateX(${value}px)`;
                }
                else if (element && element.attr) {
                    // D3 selection
                    element.attr("transform", `translate(${value}, 0)`);
                }
            }, () => resolve());
        });
    }
    function scaleTransition(element, fromScale, toScale, duration = 500, easingType = "easeOutQuad") {
        return new Promise(resolve => {
            animateValue(fromScale, toScale, duration, easingType, value => {
                if (element && element.style) {
                    element.style.transform = `scale(${value})`;
                }
                else if (element && element.attr) {
                    // D3 selection
                    element.attr("transform", `scale(${value})`);
                }
            }, () => resolve());
        });
    }
    function createTransitionSequence() {
        const sequence = [];
        let isRunning = false;
        function add(transitionFn, delay = 0) {
            sequence.push({ fn: transitionFn, delay });
            return transitionSequence;
        }
        function parallel(...transitionFns) {
            sequence.push({
                fn: () => Promise.all(transitionFns.map(fn => fn())),
                delay: 0,
            });
            return transitionSequence;
        }
        async function play() {
            if (isRunning) {
                throw new Error("Sequence is already running");
            }
            isRunning = true;
            try {
                for (const step of sequence) {
                    if (step.delay > 0) {
                        await new Promise(resolve => setTimeout(resolve, step.delay));
                    }
                    await step.fn();
                }
            }
            finally {
                isRunning = false;
            }
        }
        function stop() {
            isRunning = false;
            // Note: In a production system, you'd want to cancel running animations
        }
        const transitionSequence = {
            add,
            parallel,
            play,
            stop,
            get isRunning() {
                return isRunning;
            },
        };
        return transitionSequence;
    }
    function createSpringAnimation(tension = 300, friction = 20) {
        // Simple spring physics implementation
        function animate(startValue, endValue, onUpdate, onComplete) {
            let position = startValue;
            let velocity = 0;
            let lastTime = performance.now();
            function frame(currentTime) {
                const deltaTime = (currentTime - lastTime) / 1000; // Convert to seconds
                lastTime = currentTime;
                const displacement = position - endValue;
                const springForce = -tension * displacement;
                const dampingForce = -friction * velocity;
                const acceleration = springForce + dampingForce;
                velocity += acceleration * deltaTime;
                position += velocity * deltaTime;
                if (onUpdate) {
                    onUpdate(position);
                }
                // Check if animation should continue
                const isAtRest = Math.abs(displacement) < 0.01 && Math.abs(velocity) < 0.01;
                if (!isAtRest) {
                    requestAnimationFrame(frame);
                }
                else if (onComplete) {
                    onComplete();
                }
            }
            requestAnimationFrame(frame);
        }
        return { animate };
    }
    function createAnimationPresets() {
        return {
            slideInLeft: (element, duration = 500) => slideTransition(element, -100, 0, duration, "easeOutQuad"),
            slideInRight: (element, duration = 500) => slideTransition(element, 100, 0, duration, "easeOutQuad"),
            fadeIn: (element, duration = 500) => fadeTransition(element, 0, 1, duration, "easeOutQuad"),
            fadeOut: (element, duration = 500) => fadeTransition(element, 1, 0, duration, "easeOutQuad"),
            scaleIn: (element, duration = 500) => scaleTransition(element, 0, 1, duration, "easeOutElastic"),
            scaleOut: (element, duration = 500) => scaleTransition(element, 1, 0, duration, "easeInQuad"),
            pulse: (element, duration = 300) => {
                const sequence = createTransitionSequence();
                return sequence
                    .add(() => scaleTransition(element, 1, 1.1, duration / 2, "easeOutQuad"))
                    .add(() => scaleTransition(element, 1.1, 1, duration / 2, "easeInQuad"))
                    .play();
            },
            bounce: (element, duration = 600) => scaleTransition(element, 0, 1, duration, "easeOutBounce"),
        };
    }
    const presets = createAnimationPresets();
    // Advanced staggered animations
    function createStaggeredTransition(elements, animationFn, options = {}) {
        const { delay = transitionConfig.staggerDelay, duration = transitionConfig.defaultDuration, ease = transitionConfig.defaultEase, reverse = false, } = options;
        const elementArray = Array.isArray(elements) ? elements : Array.from(elements);
        const orderedElements = reverse ? [...elementArray].reverse() : elementArray;
        return Promise.all(orderedElements.map((element, index) => {
            return new Promise(resolve => {
                setTimeout(() => {
                    animationFn(element, duration, ease).then(resolve);
                }, index * delay);
            });
        }));
    }
    // Custom tweening functions
    function createCustomTween(startValue, endValue, interpolator) {
        return function (t) {
            if (typeof interpolator === "function") {
                return interpolator(startValue, endValue, t);
            }
            // Default linear interpolation
            return startValue + (endValue - startValue) * t;
        };
    }
    // Transition event handlers
    function createTransitionWithEvents(element, config) {
        const { duration = transitionConfig.defaultDuration, onStart, onEnd, onInterrupt } = config;
        let isInterrupted = false;
        const transition = {
            start() {
                if (onStart)
                    onStart();
                return this;
            },
            interrupt() {
                isInterrupted = true;
                if (onInterrupt)
                    onInterrupt();
                return this;
            },
            then(callback) {
                if (!isInterrupted && onEnd) {
                    setTimeout(() => {
                        onEnd();
                        if (callback)
                            callback();
                    }, duration);
                }
                return this;
            },
        };
        return transition;
    }
    const animationSystem = {
        easingFunctions,
        animateValue,
        staggeredAnimation,
        morphShape,
        fadeTransition,
        slideTransition,
        scaleTransition,
        createTransitionSequence,
        createSpringAnimation,
        createStaggeredTransition,
        createCustomTween,
        createTransitionWithEvents,
        transitionConfig,
        presets,
    };
    return animationSystem;
}

// MintWaterfall Enhanced Scales System - TypeScript Version
// Provides advanced D3.js scale support including time and ordinal scales with full type safety
function createScaleSystem() {
    let defaultRange = [0, 800];
    // Enhanced scale factory with auto-detection
    function createAdaptiveScale(data, dimension = "x") {
        const values = data.map(d => (dimension === "x" ? d.label : d.cumulativeTotal));
        // Detect data type and return appropriate scale (no data: an empty band scale)
        if (values.length > 0 && values.every(v => v instanceof Date)) {
            return createTimeScale(values);
        }
        else if (values.every(v => typeof v === "string" || isNaN(v))) {
            // For categorical/string data, use band scale for positioning
            return createBandScale(values);
        }
        else if (values.every(v => typeof v === "number")) {
            return createLinearScale(values);
        }
        else {
            // Mixed types - fallback to band scale
            return d3.scaleBand().domain(values.map(String)).range(defaultRange);
        }
    }
    // Time scale with intelligent formatting
    function createTimeScale(values, options = {}) {
        const { range = defaultRange, nice = true, tickFormat = "auto" } = options;
        const extent = d3.extent(values);
        const scale = d3.scaleTime().range(range);
        // With no dates, keep d3's default domain rather than an invalid one
        if (extent[0] != null && extent[1] != null)
            scale.domain(extent);
        if (nice) {
            scale.nice();
        }
        // Auto-detect appropriate time format
        let specifier = null;
        if (tickFormat === "auto" && extent[0] instanceof Date && extent[1] instanceof Date) {
            const timeSpan = extent[1].getTime() - extent[0].getTime();
            const days = timeSpan / (1000 * 60 * 60 * 24);
            specifier = days < 1 ? "%H:%M" : days < 30 ? "%m/%d" : days < 365 ? "%b %Y" : "%Y";
        }
        else if (typeof tickFormat === "string" && tickFormat !== "auto") {
            specifier = tickFormat;
        }
        if (specifier) {
            // Keep d3's tickFormat(count?, specifier?) contract (axes call it and expect a
            // formatter back); only the default format changes. An explicit specifier still wins.
            const original = scale.tickFormat.bind(scale);
            const format = d3.timeFormat(specifier);
            scale.tickFormat = (count, spec) => (spec ? original(count, spec) : format);
        }
        return scale;
    }
    // Enhanced ordinal scale with color mapping
    function createOrdinalScale(values, options = {}) {
        const { range = d3.schemeCategory10, unknown = "#ccc" } = options;
        const uniqueValues = [...new Set(values)];
        return d3
            .scaleOrdinal()
            .domain(uniqueValues)
            .range(range)
            .unknown(unknown);
    }
    // Band scale for categorical data positioning
    function createBandScale(values, options = {}) {
        const { padding = 0.1, paddingInner = null, paddingOuter = null, align = 0.5, range = defaultRange } = options;
        const uniqueValues = [...new Set(values.map(String))];
        const scale = d3.scaleBand().domain(uniqueValues).range(range).align(align);
        if (paddingInner !== null) {
            scale.paddingInner(paddingInner);
        }
        if (paddingOuter !== null) {
            scale.paddingOuter(paddingOuter);
        }
        if (paddingInner === null && paddingOuter === null) {
            scale.padding(padding);
        }
        return scale;
    }
    // Linear scale with enhanced options
    function createLinearScale(values, options = {}) {
        const { range = defaultRange, nice = true, zero = false, clamp = false } = options;
        const extent = d3.extent(values);
        // No finite values: d3's default domain instead of [NaN, NaN]
        let domain = extent[0] === undefined ? [0, 1] : extent;
        // Include zero in domain if requested
        if (zero) {
            domain = [Math.min(0, domain[0]), Math.max(0, domain[1])];
        }
        const scale = d3.scaleLinear().domain(domain).range(range);
        if (nice) {
            scale.nice();
        }
        if (clamp) {
            scale.clamp(true);
        }
        return scale;
    }
    function setDefaultRange(range) {
        defaultRange = range;
    }
    function getScaleInfo(scale) {
        const info = {
            type: "unknown",
            domain: [],
            range: [],
        };
        try {
            info.domain = scale.domain();
            info.range = scale.range();
            // Detect scale type
            if (typeof scale.bandwidth === "function") {
                info.type = "band";
                info.bandwidth = scale.bandwidth();
                if (typeof scale.step === "function") {
                    info.step = scale.step();
                }
            }
            else if (typeof scale.nice === "function") {
                // Check if it's a time scale by testing if domain contains dates
                if (info.domain.length > 0 && info.domain[0] instanceof Date) {
                    info.type = "time";
                }
                else if (typeof scale.base === "function") {
                    info.type = "log";
                }
                else {
                    info.type = "linear";
                }
            }
            else if (typeof scale.unknown === "function") {
                info.type = "ordinal";
            }
        }
        catch (e) {
            // Fallback for scales that don't support these methods
            console.warn("Could not extract complete scale info:", e);
        }
        return info;
    }
    // Log scale with fallback to linear for non-positive values
    function createLogScale(values, options = {}) {
        // Check if all values are positive for log scale
        const hasNonPositive = values.length === 0 || values.some(v => v <= 0);
        if (hasNonPositive) {
            // Fallback to linear scale
            return createLinearScale(values, options);
        }
        const { range = defaultRange, nice = true, clamp = false } = options;
        const domain = d3.extent(values);
        const scale = d3.scaleLog().domain(domain).range(range);
        if (nice) {
            scale.nice();
        }
        if (clamp) {
            scale.clamp(true);
        }
        return scale;
    }
    return {
        createAdaptiveScale,
        createTimeScale,
        createOrdinalScale,
        createBandScale,
        createLinearScale,
        createLogScale,
        setDefaultRange,
        getScaleInfo,
        scaleUtils: createScaleUtilities(),
    };
}
function createScaleUtilities() {
    function formatTickValue(scale, value) {
        if (typeof scale.tickFormat === "function") {
            // Time scales
            return scale.tickFormat()(value);
        }
        else if (scale.tickFormat) {
            // Scales with custom formatters
            return scale.tickFormat(value);
        }
        else if (typeof value === "number") {
            // Default number formatting
            if (Math.abs(value) >= 1000000) {
                return `${(value / 1000000).toFixed(1)}M`;
            }
            else if (Math.abs(value) >= 1000) {
                return `${(value / 1000).toFixed(1)}K`;
            }
            else {
                return value.toFixed(0);
            }
        }
        else {
            return String(value);
        }
    }
    function getTickCount(scale, _targetSize) {
        const range = scale.range();
        const rangeSize = Math.abs(range[1] - range[0]);
        // Aim for ticks every 50-100 pixels
        const idealTickCount = Math.max(2, Math.floor(rangeSize / 75));
        // Cap at reasonable limits
        return Math.min(10, Math.max(2, idealTickCount));
    }
    function createColorScale(domain, scheme = d3.schemeCategory10) {
        return d3
            .scaleOrdinal()
            .domain(domain)
            .range([...scheme]);
    }
    function invertScale(scale, pixel) {
        if (typeof scale.invert === "function") {
            // Linear and time scales
            return scale.invert(pixel);
        }
        else if (typeof scale.bandwidth === "function") {
            // Band scales - find the band that contains the pixel
            const domain = scale.domain();
            const bandwidth = scale.bandwidth();
            if (domain.length === 0)
                return undefined;
            for (let i = 0; i < domain.length; i++) {
                const bandStart = scale(domain[i]);
                if (pixel >= bandStart && pixel <= bandStart + bandwidth) {
                    return domain[i];
                }
            }
            // If not in any band, return closest
            const distances = domain.map((d) => Math.abs(scale(d) + bandwidth / 2 - pixel));
            const minIndex = distances.indexOf(Math.min(...distances));
            return domain[minIndex];
        }
        else {
            // Ordinal scales - return undefined for pixel-based inversion
            return undefined;
        }
    }
    function detectScaleType(values) {
        if (values.length > 0 && values.every(v => v instanceof Date)) {
            return "time";
        }
        else if (values.every(v => typeof v === "string" || isNaN(v))) {
            return "band";
        }
        else if (values.every(v => typeof v === "number")) {
            return "linear";
        }
        else {
            return "adaptive";
        }
    }
    function createAxis(scale, orientation = "bottom") {
        let axis;
        switch (orientation) {
            case "top":
                axis = d3.axisTop(scale);
                break;
            case "bottom":
                axis = d3.axisBottom(scale);
                break;
            case "left":
                axis = d3.axisLeft(scale);
                break;
            case "right":
                axis = d3.axisRight(scale);
                break;
            default:
                axis = d3.axisBottom(scale);
        }
        return axis;
    }
    return {
        formatTickValue,
        getTickCount,
        createColorScale,
        invertScale,
        detectScaleType,
        createAxis,
    };
}

// MintWaterfall Advanced Statistical Analysis - TypeScript Version
// Provides comprehensive statistical analysis features for waterfall chart data
// ============================================================================
// STATISTICAL SYSTEM IMPLEMENTATION
// ============================================================================
function createStatisticalSystem() {
    // ========================================================================
    // CORE STATISTICAL FUNCTIONS
    // ========================================================================
    /**
     * Calculate comprehensive statistical summary
     * Enhanced with D3.js statistical functions
     */
    function calculateSummary(data) {
        // Filter out null/undefined values
        const cleanData = data.filter(d => d != null && !isNaN(d)).sort(d3.ascending);
        if (cleanData.length === 0) {
            // Return empty statistical summary instead of throwing
            return {
                count: 0,
                sum: 0,
                mean: 0,
                median: 0,
                mode: [],
                variance: 0,
                standardDeviation: 0,
                min: 0,
                max: 0,
                range: 0,
                quartiles: [0, 0, 0],
                percentiles: { p5: 0, p10: 0, p25: 0, p75: 0, p90: 0, p95: 0 },
            };
        }
        const count = cleanData.length;
        const sum = d3.sum(cleanData);
        const mean = d3.mean(cleanData) || 0;
        const medianValue = median(cleanData) || 0;
        const varianceValue = variance(cleanData) || 0;
        const standardDeviation = deviation(cleanData) || 0;
        const min = d3.min(cleanData) || 0;
        const max = d3.max(cleanData) || 0;
        const range = max - min;
        // Calculate quartiles
        const q1 = quantile(cleanData, 0.25) || 0;
        const q2 = medianValue;
        const q3 = quantile(cleanData, 0.75) || 0;
        // Calculate percentiles
        const percentiles = {
            p5: quantile(cleanData, 0.05) || 0,
            p10: quantile(cleanData, 0.1) || 0,
            p25: q1,
            p75: q3,
            p90: quantile(cleanData, 0.9) || 0,
            p95: quantile(cleanData, 0.95) || 0,
        };
        // Calculate mode (most frequent value)
        const valueFreq = new Map();
        cleanData.forEach(value => {
            valueFreq.set(value, (valueFreq.get(value) || 0) + 1);
        });
        let maxFreq = 0;
        const modes = [];
        valueFreq.forEach((freq, value) => {
            if (freq > maxFreq) {
                maxFreq = freq;
                modes.length = 0;
                modes.push(value);
            }
            else if (freq === maxFreq) {
                modes.push(value);
            }
        });
        return {
            count,
            sum,
            mean,
            median: medianValue,
            mode: modes,
            variance: varianceValue,
            standardDeviation,
            min,
            max,
            range,
            quartiles: [q1, q2, q3],
            percentiles,
        };
    }
    /**
     * Detect outliers using IQR method and modified Z-score
     * Enhanced with severity classification
     */
    function detectOutliers(data, labels = []) {
        const summary = calculateSummary(data);
        const [q1, , q3] = summary.quartiles;
        const iqr = q3 - q1;
        // IQR method boundaries
        const lowerBound = q1 - 1.5 * iqr;
        const upperBound = q3 + 1.5 * iqr;
        const extremeLowerBound = q1 - 3 * iqr;
        const extremeUpperBound = q3 + 3 * iqr;
        const outliers = [];
        const cleanData = [];
        data.forEach((value, index) => {
            if (value == null || isNaN(value))
                return;
            const isOutlier = value < lowerBound || value > upperBound;
            const isExtreme = value < extremeLowerBound || value > extremeUpperBound;
            if (isOutlier) {
                outliers.push({
                    value,
                    index,
                    label: labels[index],
                    severity: isExtreme ? "extreme" : "mild",
                    type: value < lowerBound ? "lower" : "upper",
                });
            }
            else {
                cleanData.push({
                    value,
                    index,
                    label: labels[index],
                });
            }
        });
        const mildOutliers = outliers.filter(o => o.severity === "mild").length;
        const extremeOutliers = outliers.filter(o => o.severity === "extreme").length;
        return {
            outliers,
            cleanData,
            method: "iqr",
            threshold: { lowerBound, upperBound, extremeLowerBound, extremeUpperBound },
            statistics: {
                mean: summary.mean,
                median: summary.median,
                q1,
                q3,
                iqr,
            },
            summary: {
                totalOutliers: outliers.length,
                mildOutliers,
                extremeOutliers,
                outlierPercentage: data.length > 0 ? (outliers.length / data.length) * 100 : 0,
            },
        };
    }
    /**
     * Assess overall data quality
     * Provides actionable recommendations for data improvement
     */
    function assessDataQuality(data, options = {}) {
        const { expectedRange, allowedTypes = ["number"], nullTolerance = 0.05, // 5% null tolerance
        duplicateTolerance = 0.1, // 10% duplicate tolerance
         } = options;
        const totalCount = data.length;
        let nullCount = 0;
        let typeValidCount = 0;
        let rangeValidCount = 0;
        const duplicates = new Set();
        const seen = new Set();
        // Analyze each data point
        data.forEach(item => {
            // Check for null/undefined
            if (item == null || (item && item.value == null)) {
                nullCount++;
                return;
            }
            // Check data type (check the value property if it exists, otherwise the item itself)
            const valueToCheck = item && typeof item === "object" && "value" in item ? item.value : item;
            const itemType = typeof valueToCheck;
            if (allowedTypes.includes(itemType)) {
                typeValidCount++;
            }
            // Check range (for numbers)
            if (itemType === "number" && expectedRange) {
                if (valueToCheck >= expectedRange[0] && valueToCheck <= expectedRange[1]) {
                    rangeValidCount++;
                }
            }
            else if (!expectedRange) {
                rangeValidCount++; // No range constraint
            }
            // Check duplicates
            const itemStr = JSON.stringify(valueToCheck);
            if (seen.has(itemStr)) {
                duplicates.add(itemStr);
            }
            else {
                seen.add(itemStr);
            }
        });
        // Calculate quality metrics
        const completeness = (totalCount - nullCount) / totalCount;
        const validity = typeValidCount / totalCount;
        const accuracy = rangeValidCount / totalCount;
        // Consistency (coefficient of variation for numeric data)
        const numericData = data.filter(d => typeof d === "number" && !isNaN(d));
        const cv = numericData.length > 0 ? (deviation(numericData) || 0) / (d3.mean(numericData) || 1) : 0;
        const consistency = Math.max(0, 100 - cv * 100); // Invert CV for consistency score
        // Outlier analysis for numeric data
        const anomalies = numericData.length > 0
            ? detectOutliers(numericData)
            : {
                outliers: [],
                cleanData: [],
                method: "None - No numeric data",
                threshold: {},
                statistics: { mean: 0, median: 0, q1: 0, q3: 0, iqr: 0 },
                summary: { totalOutliers: 0, mildOutliers: 0, extremeOutliers: 0, outlierPercentage: 0 },
            };
        // Generate recommendations
        const recommendations = [];
        if (completeness < 1 - nullTolerance) {
            recommendations.push(`Improve data completeness: ${nullCount} missing values detected`);
            recommendations.push("Remove or impute missing values");
        }
        if (validity < 0.95) {
            recommendations.push(`Validate data types: ${totalCount - typeValidCount} invalid types found`);
        }
        if (accuracy < 0.9 && expectedRange) {
            recommendations.push(`Check data accuracy: ${totalCount - rangeValidCount} values outside expected range`);
        }
        if (duplicates.size > duplicateTolerance * totalCount) {
            recommendations.push(`Remove duplicates: ${duplicates.size} duplicate values detected`);
        }
        if (anomalies.summary.outlierPercentage > 5) {
            recommendations.push(`Investigate outliers: ${anomalies.summary.totalOutliers} outliers detected (${anomalies.summary.outlierPercentage.toFixed(1)}%)`);
        }
        // Generate issues list
        const issues = [];
        if (nullCount > 0) {
            issues.push(`${nullCount} null or missing values found`);
        }
        if (totalCount - typeValidCount > 0) {
            issues.push(`${totalCount - typeValidCount} invalid data types found`);
        }
        if (expectedRange && totalCount - rangeValidCount > 0) {
            issues.push(`${totalCount - rangeValidCount} values outside expected range`);
        }
        if (duplicates.size > 0) {
            issues.push(`${duplicates.size} duplicate values found`);
        }
        if (anomalies.summary.totalOutliers > 0) {
            issues.push(`${anomalies.summary.totalOutliers} outliers detected`);
        }
        return {
            completeness,
            consistency,
            accuracy,
            validity,
            duplicates: duplicates.size,
            issues,
            anomalies,
            recommendations,
        };
    }
    // ========================================================================
    // ADVANCED ANALYSIS FUNCTIONS
    // ========================================================================
    /**
     * Analyze variance contributions in waterfall data
     * Identifies key drivers of variability
     */
    function analyzeVariance(data) {
        const values = data.map(d => d.value);
        const totalVariance = variance(values) || 0;
        // Separate positive and negative contributions
        const positiveValues = values.filter(v => v > 0);
        const negativeValues = values.filter(v => v < 0);
        const positiveVariance = positiveValues.length > 0 ? variance(positiveValues) || 0 : 0;
        const negativeVariance = negativeValues.length > 0 ? variance(negativeValues) || 0 : 0;
        // Calculate individual contributions
        const mean = d3.mean(values) || 0;
        const varianceContributions = data.map(item => {
            const variance = Math.pow(item.value - mean, 2);
            const contribution = totalVariance > 0 ? (variance / totalVariance) * 100 : 0;
            return {
                label: item.label,
                value: item.value,
                variance,
                contribution,
            };
        });
        // Identify significant factors (top contributors)
        const sortedContributions = [...varianceContributions].sort((a, b) => b.contribution - a.contribution);
        const significantFactors = sortedContributions.slice(0, Math.min(5, sortedContributions.length)).map(item => ({
            label: item.label,
            impact: item.contribution > 20 ? "high" : item.contribution > 10 ? "medium" : "low",
            variance: item.variance,
        }));
        // Calculate additional statistical measures for ANOVA-style analysis
        const groupMean = d3.mean(values) || 0;
        // Group data by categories (try to extract category from label, fallback to positive/negative)
        const categoryGroups = new Map();
        data.forEach(item => {
            // Try to extract category from label (e.g., "A1" -> "A", "Category1" -> "Category")
            const category = item.label.match(/^([A-Za-z]+)/)?.[1] || (item.value > 0 ? "positive" : "negative");
            if (!categoryGroups.has(category)) {
                categoryGroups.set(category, []);
            }
            categoryGroups.get(category).push(item.value);
        });
        const groups = Array.from(categoryGroups.entries())
            .map(([name, values]) => ({
            name,
            values,
        }))
            .filter(g => g.values.length > 0);
        // Calculate between-group variance
        let betweenGroupVariance = 0;
        if (groups.length > 1) {
            const groupMeans = groups.map(g => d3.mean(g.values) || 0);
            const groupSizes = groups.map(g => g.values.length);
            betweenGroupVariance =
                groups.reduce((sum, group, i) => {
                    const groupMeanValue = groupMeans[i];
                    const groupSize = groupSizes[i];
                    return sum + groupSize * Math.pow(groupMeanValue - groupMean, 2);
                }, 0) /
                    (groups.length - 1);
        }
        // Within-group variance
        const withinGroupVariance = groups.length > 0
            ? groups.reduce((sum, group) => {
                const groupVar = variance(group.values) || 0;
                return sum + groupVar * (group.values.length - 1);
            }, 0) / Math.max(1, values.length - groups.length)
            : totalVariance;
        // F-statistic for variance analysis
        const fStatistic = betweenGroupVariance > 0 && withinGroupVariance > 0 ? betweenGroupVariance / withinGroupVariance : 0;
        // Significance level (simplified p-value approximation)
        const significance = fStatistic > 4 ? "significant" : fStatistic > 2 ? "moderate" : "not significant";
        return {
            totalVariance,
            positiveVariance,
            negativeVariance,
            withinGroupVariance,
            betweenGroupVariance,
            fStatistic,
            significance,
            varianceContributions,
            significantFactors,
        };
    }
    /**
     * Analyze trend patterns in time series data
     * Provides statistical trend analysis with confidence intervals
     */
    function analyzeTrend(data) {
        if (data.length < 2) {
            // Return empty trend analysis instead of throwing
            return {
                slope: 0,
                intercept: 0,
                correlation: 0,
                rSquared: 0,
                direction: "stable",
                strength: "none",
                confidence: 0,
                trend: "stable",
                projectedValues: [],
                forecast: [],
            };
        }
        const xValues = data.map(d => d.x);
        const yValues = data.map(d => d.y);
        // Calculate linear regression
        const xMean = d3.mean(xValues) || 0;
        const yMean = d3.mean(yValues) || 0;
        let numerator = 0;
        let denominator = 0;
        for (let i = 0; i < data.length; i++) {
            const xDiff = xValues[i] - xMean;
            const yDiff = yValues[i] - yMean;
            numerator += xDiff * yDiff;
            denominator += xDiff * xDiff;
        }
        const slope = denominator !== 0 ? numerator / denominator : 0;
        // Calculate correlation coefficient
        const xStd = deviation(xValues) || 0;
        const yStd = deviation(yValues) || 0;
        const correlation = xStd * yStd !== 0 ? numerator / (Math.sqrt(denominator) * yStd * Math.sqrt(data.length - 1)) : 0;
        // Determine trend characteristics
        const direction = slope > 0.01 ? "increasing" : slope < -0.01 ? "decreasing" : "stable";
        const strength = Math.abs(correlation) > 0.7 ? "strong" : Math.abs(correlation) > 0.3 ? "moderate" : "weak";
        const confidence = Math.abs(correlation) * 100;
        // Generate projections (simple linear extrapolation)
        const lastX = Math.max(...xValues);
        const projectedValues = Array.from({ length: 3 }, (_, i) => {
            const period = lastX + (i + 1);
            const value = yMean + slope * (period - xMean);
            const standardError = Math.sqrt(variance(yValues) || 0) / Math.sqrt(data.length);
            return {
                period,
                value,
                x: period, // alias for backward compatibility
                y: value, // alias for backward compatibility
                confidence: {
                    lower: value - 1.96 * standardError,
                    upper: value + 1.96 * standardError,
                },
            };
        });
        // Calculate intercept and R-squared
        const intercept = yMean - slope * xMean;
        const rSquared = correlation * correlation;
        return {
            slope,
            intercept,
            correlation,
            rSquared,
            direction,
            strength,
            confidence,
            trend: direction, // alias for backward compatibility
            projectedValues,
            forecast: projectedValues, // alias for backward compatibility
        };
    }
    // ========================================================================
    // DATA SEARCH AND OPTIMIZATION
    // ========================================================================
    /**
     * Create efficient bisector for data searching
     * Uses D3.js bisector for O(log n) lookups
     */
    function createBisector(accessor) {
        return bisector(accessor);
    }
    /**
     * Create fast search function for sorted data
     * Returns the closest data point to a given value
     */
    function createSearch(data, accessor) {
        const bisector = createBisector(accessor);
        const sortedData = [...data].sort((a, b) => ascending(accessor(a), accessor(b)));
        return (value) => {
            const index = bisector.left(sortedData, value);
            if (index === 0)
                return sortedData[0];
            if (index >= sortedData.length)
                return sortedData[sortedData.length - 1];
            // Return the closest value
            const leftItem = sortedData[index - 1];
            const rightItem = sortedData[index];
            const leftDistance = Math.abs(accessor(leftItem) - value);
            const rightDistance = Math.abs(accessor(rightItem) - value);
            return leftDistance <= rightDistance ? leftItem : rightItem;
        };
    }
    // ========================================================================
    // UTILITY FUNCTIONS
    // ========================================================================
    /**
     * Calculate moving average with configurable window
     */
    function calculateMovingAverage(data, window) {
        if (window <= 0 || window > data.length || data.length === 0) {
            return []; // Return empty array instead of throwing
        }
        const result = [];
        for (let i = 0; i <= data.length - window; i++) {
            const windowData = data.slice(i, i + window);
            const average = d3.mean(windowData) || 0;
            result.push(average);
        }
        return result;
    }
    /**
     * Calculate exponential smoothing
     */
    function calculateExponentialSmoothing(data, alpha) {
        if (alpha < 0 || alpha > 1 || data.length === 0) {
            return []; // Return empty array instead of throwing
        }
        const result = [];
        let smoothed = data[0];
        result.push(smoothed);
        for (let i = 1; i < data.length; i++) {
            smoothed = alpha * data[i] + (1 - alpha) * smoothed;
            result.push(smoothed);
        }
        return result;
    }
    /**
     * Detect seasonality in time series data
     */
    function detectSeasonality(data, period) {
        if (data.length < period * 2) {
            return false; // Need at least 2 full periods
        }
        // Calculate autocorrelation at the specified period
        const mean = d3.mean(data) || 0;
        let numerator = 0;
        let denominator = 0;
        for (let i = 0; i < data.length - period; i++) {
            numerator += (data[i] - mean) * (data[i + period] - mean);
        }
        for (let i = 0; i < data.length; i++) {
            denominator += Math.pow(data[i] - mean, 2);
        }
        const autocorrelation = denominator !== 0 ? numerator / denominator : 0;
        // Consider seasonal if autocorrelation is above threshold
        return Math.abs(autocorrelation) > 0.3;
    }
    // ========================================================================
    // RETURN API
    // ========================================================================
    return {
        // Core statistical functions
        calculateSummary,
        detectOutliers,
        assessDataQuality,
        // Advanced analysis
        analyzeVariance,
        analyzeTrend,
        // Data search and optimization
        createBisector,
        createSearch,
        // Utility functions
        calculateMovingAverage,
        calculateExponentialSmoothing,
        detectSeasonality,
    };
}
// ============================================================================
// WATERFALL-SPECIFIC STATISTICAL UTILITIES
// ============================================================================
/**
 * Analyze waterfall chart statistical patterns
 * Provides insights specific to waterfall financial data
 */
function analyzeWaterfallStatistics(data, options = {}) {
    const stats = createStatisticalSystem();
    const values = data.map(d => d.value);
    // Calculate core statistics
    const summary = stats.calculateSummary(values);
    const variance = stats.analyzeVariance(data);
    const quality = stats.assessDataQuality(values, {
        expectedRange: options.currency ? [-1e6, 1000000] : undefined,
    });
    // Generate business insights
    const insights = [];
    if (variance.significantFactors.length > 0) {
        const topFactor = variance.significantFactors[0];
        insights.push(`${topFactor.label} is the primary driver of variance (${topFactor.impact} impact)`);
    }
    if (summary.standardDeviation > Math.abs(summary.mean)) {
        insights.push("High volatility detected - consider risk management strategies");
    }
    const positiveCount = values.filter(v => v > 0).length;
    const negativeCount = values.filter(v => v < 0).length;
    const ratio = positiveCount / negativeCount;
    if (ratio > 2) {
        insights.push("Predominantly positive contributors - strong growth pattern");
    }
    else if (ratio < 0.5) {
        insights.push("Predominantly negative contributors - potential cost management focus needed");
    }
    if (quality.anomalies.summary.outlierPercentage > 10) {
        insights.push(`${quality.anomalies.summary.totalOutliers} outliers detected - data validation recommended`);
    }
    return {
        summary,
        variance,
        quality,
        insights,
    };
}

// MintWaterfall Accessibility System - TypeScript Version
// Provides WCAG 2.1 AA compliance features for screen readers and keyboard navigation with full type safety
/** WCAG 2.x relative luminance of an opaque sRGB color, or null if it can't be parsed. */
function relativeLuminance(color) {
    const c = rgb(color);
    if (![c.r, c.g, c.b].every(Number.isFinite))
        return null;
    const channel = (v) => {
        const s = v / 255;
        return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * channel(c.r) + 0.7152 * channel(c.g) + 0.0722 * channel(c.b);
}
function createAccessibilitySystem() {
    let currentFocusIndex = -1;
    let focusableElements = [];
    let announceFunction = null;
    let descriptionId = null;
    let chartSvg = null;
    // ARIA live region for dynamic announcements
    function createLiveRegion(container) {
        const liveRegion = container
            .append("div")
            .attr("id", "waterfall-live-region")
            .attr("aria-live", "polite")
            .attr("aria-atomic", "true")
            .style("position", "absolute")
            .style("left", "-10000px")
            .style("width", "1px")
            .style("height", "1px")
            .style("overflow", "hidden");
        return liveRegion;
    }
    // Create chart description for screen readers
    function createChartDescription(container, data, config = {}) {
        const { title = "Waterfall Chart", summary = "Interactive waterfall chart showing data progression", totalItems = Array.isArray(data) ? data.length : 1, showTotal: hasTotal = false, } = config;
        const descId = "waterfall-description-" + Math.random().toString(36).substr(2, 9);
        const description = container
            .append("div")
            .attr("id", descId)
            .attr("class", "sr-only")
            .style("position", "absolute")
            .style("left", "-10000px")
            .style("width", "1px")
            .style("height", "1px")
            .style("overflow", "hidden");
        // Calculate summary statistics based on data structure
        let totalValue = 0;
        let positiveCount = 0;
        let negativeCount = 0;
        if (Array.isArray(data)) {
            // Waterfall chart data structure
            totalValue = data.reduce((sum, item) => {
                if (item.stacks && Array.isArray(item.stacks)) {
                    return sum + item.stacks.reduce((stackSum, stack) => stackSum + (stack.value || 0), 0);
                }
                return sum;
            }, 0);
            positiveCount = data.filter(item => item.stacks && item.stacks.some(stack => (stack.value || 0) > 0)).length;
            negativeCount = data.filter(item => item.stacks && item.stacks.some(stack => stack.value < 0)).length;
        }
        else if (data && typeof data === "object" && data.children) {
            // Hierarchical chart data structure
            function calculateHierarchicalStats(node) {
                if (node.children && Array.isArray(node.children)) {
                    return node.children.reduce((sum, child) => sum + calculateHierarchicalStats(child), 0);
                }
                else {
                    return node.value || 0;
                }
            }
            totalValue = calculateHierarchicalStats(data);
            positiveCount = 1; // For hierarchical data, we consider it as one positive entity
            negativeCount = 0;
        }
        description.html(`
            <h3>${title}</h3>
            <p>${summary}</p>
            <p>This chart contains ${totalItems} data categories${hasTotal ? " plus a total bar" : ""}.</p>
            <p>Total value: ${config.formatNumber ? config.formatNumber(totalValue) : totalValue}</p>
            <p>${positiveCount} categories have positive values, ${negativeCount} have negative values.</p>
            <p>Use Tab to navigate between bars, Enter to hear details, and Arrow keys to move between bars.</p>
            <p>Press Escape to return focus to the chart container.</p>
        `);
        descriptionId = descId;
        return descId;
    }
    // Make chart elements keyboard accessible
    function makeAccessible(chartContainer, data, config = {}) {
        const svg = chartContainer.select("svg");
        chartSvg = svg.node();
        // Add main chart ARIA attributes
        svg.attr("role", "img").attr("aria-labelledby", descriptionId).attr("tabindex", "0").attr("aria-describedby", descriptionId);
        // Add keyboard event handlers to main SVG
        svg.on("keydown", function (event) {
            handleChartKeydown(event, data, config);
        });
        // Make individual bars focusable and accessible
        const bars = svg.selectAll(".bar-group");
        bars.each(function (d, i) {
            const bar = d3.select(this);
            const barData = d;
            bar.attr("role", "button")
                .attr("tabindex", "-1")
                .attr("aria-label", createBarAriaLabel(barData, i, config))
                .attr("aria-describedby", `bar-description-${i}`)
                .on("keydown", function (event) {
                // all bars, so arrow keys can move to the neighbours
                handleBarKeydown(event, barData, i, data, config);
            })
                .on("focus", function () {
                currentFocusIndex = i;
                const element = this;
                if (element) {
                    highlightFocusedElement(element);
                }
            })
                .on("blur", function () {
                const element = this;
                if (element) {
                    removeFocusHighlight(element);
                }
            });
        });
        // Store focusable elements
        focusableElements = bars && bars.nodes && typeof bars.nodes === "function" ? bars.nodes().filter(node => node !== null) : [];
        return {
            bars,
            focusableElements: focusableElements.length,
        };
    }
    // Create ARIA label for individual bars
    function createBarAriaLabel(data, index, config = {}) {
        if (!data || !data.stacks || !Array.isArray(data.stacks)) {
            return `Item ${index + 1}: Invalid data`;
        }
        const totalValue = data.stacks.reduce((sum, stack) => sum + stack.value, 0);
        const stackCount = data.stacks.length;
        const formatNumber = config.formatNumber || ((n) => n.toString());
        let label = `${data.label}: ${formatNumber(totalValue)}`;
        if (stackCount > 1) {
            label += `, ${stackCount} segments`;
        }
        if (data.cumulative !== undefined) {
            label += `, cumulative total: ${formatNumber(data.cumulative)}`;
        }
        label += ". Press Enter for details.";
        return label;
    }
    // Handle keyboard navigation on chart level
    function handleChartKeydown(event, data, config) {
        switch (event.key) {
            case "Tab":
                // Let default tab behavior work
                break;
            case "ArrowRight":
            case "ArrowDown":
                event.preventDefault();
                moveFocus(1, data, config);
                break;
            case "ArrowLeft":
            case "ArrowUp":
                event.preventDefault();
                moveFocus(-1, data, config);
                break;
            case "Home":
                event.preventDefault();
                focusElement(0, data, config);
                break;
            case "End":
                event.preventDefault();
                focusElement(focusableElements.length - 1, data, config);
                break;
            case "Enter":
            case " ":
                event.preventDefault();
                if (currentFocusIndex >= 0) {
                    announceBarDetails(data[currentFocusIndex], currentFocusIndex, config);
                }
                else {
                    announceChartSummary(data, config);
                }
                break;
            case "Escape":
                event.preventDefault();
                returnFocusToChart();
                break;
        }
    }
    // Handle keyboard events on individual bars
    function handleBarKeydown(event, barData, index, allData, config) {
        switch (event.key) {
            case "Enter":
            case " ":
                event.preventDefault();
                announceBarDetails(barData, index, config);
                // Trigger click event for compatibility
                d3.select(event.target).dispatch("click");
                break;
            case "ArrowRight":
            case "ArrowDown":
                event.preventDefault();
                moveFocus(1, allData, config);
                break;
            case "ArrowLeft":
            case "ArrowUp":
                event.preventDefault();
                moveFocus(-1, allData, config);
                break;
        }
    }
    // Move focus between chart elements
    function moveFocus(direction, data, config) {
        if (focusableElements.length === 0)
            return;
        let newIndex = currentFocusIndex + direction;
        // Wrap around
        if (newIndex >= focusableElements.length) {
            newIndex = 0;
        }
        else if (newIndex < 0) {
            newIndex = focusableElements.length - 1;
        }
        focusElement(newIndex, data, config);
    }
    // Focus specific element by index
    function focusElement(index, data, config) {
        if (index < 0 || index >= focusableElements.length)
            return;
        currentFocusIndex = index;
        const element = focusableElements[index];
        if (element && element.focus) {
            element.focus();
        }
        // Announce the focused element
        const barData = data[index];
        announceBarFocus(barData, index, config);
    }
    // Return focus to main chart container
    function returnFocusToChart() {
        // The chart made accessible by this system (not just the first chart on the page)
        const svgNode = (chartSvg ?? document.querySelector("svg[role='img']"));
        if (svgNode) {
            svgNode.focus?.();
            currentFocusIndex = -1;
        }
    }
    // Visual focus indicators
    function highlightFocusedElement(element) {
        d3.select(element).style("outline", "3px solid #4A90E2").style("outline-offset", "2px");
    }
    function removeFocusHighlight(element) {
        d3.select(element).style("outline", null).style("outline-offset", null);
    }
    // Screen reader announcements
    function announceBarFocus(data, index, config) {
        const formatNumber = config.formatNumber || ((n) => n.toString());
        const totalValue = data.stacks.reduce((sum, stack) => sum + stack.value, 0);
        const message = `Focused on ${data.label}, value ${formatNumber(totalValue)}`;
        announce(message);
    }
    function announceBarDetails(data, index, config) {
        const formatNumber = config.formatNumber || ((n) => n.toString());
        const totalValue = data.stacks.reduce((sum, stack) => sum + stack.value, 0);
        let message = `${data.label}: Total value ${formatNumber(totalValue)}`;
        if (data.stacks.length > 1) {
            message += `. Contains ${data.stacks.length} segments: `;
            const segments = data.stacks.map(stack => `${stack.label || formatNumber(stack.value)}`).join(", ");
            message += segments;
        }
        if (data.cumulative !== undefined) {
            message += `. Cumulative total: ${formatNumber(data.cumulative)}`;
        }
        announce(message);
    }
    function announceChartSummary(data, config) {
        const formatNumber = config.formatNumber || ((n) => n.toString());
        const totalValue = data.reduce((sum, item) => {
            return sum + item.stacks.reduce((stackSum, stack) => stackSum + stack.value, 0);
        }, 0);
        const message = `Waterfall chart with ${data.length} categories. Total value: ${formatNumber(totalValue)}. Use arrow keys to navigate between bars.`;
        announce(message);
    }
    // Announce message to screen readers
    function announce(message) {
        const liveRegion = d3.select("#waterfall-live-region");
        if (!liveRegion.empty()) {
            liveRegion.text(message);
        }
        // Also call custom announce function if provided
        if (announceFunction) {
            announceFunction(message);
        }
    }
    // High contrast mode detection and support (Updated: 2025-08-28)
    function detectHighContrast() {
        // Check for modern forced colors mode and high contrast preferences
        if (window.matchMedia) {
            // First check for modern forced-colors mode (preferred)
            if (window.matchMedia("(forced-colors: active)").matches) {
                return true;
            }
            // Then check for prefers-contrast
            if (window.matchMedia("(prefers-contrast: high)").matches) {
                return true;
            }
            // Additional modern checks for high contrast scenarios
            if (window.matchMedia("(prefers-contrast: more)").matches) {
                return true;
            }
            // Check for inverted colors which often indicates high contrast mode
            if (window.matchMedia("(inverted-colors: inverted)").matches) {
                return true;
            }
            // Fallback: detect if system colors are being used (indicates forced colors)
            try {
                const testElement = document.createElement("div");
                testElement.style.color = "rgb(1, 2, 3)";
                testElement.style.position = "absolute";
                testElement.style.visibility = "hidden";
                document.body.appendChild(testElement);
                const computedColor = window.getComputedStyle(testElement).color;
                document.body.removeChild(testElement);
                // If the computed color doesn't match what we set, forced colors is likely active
                return computedColor !== "rgb(1, 2, 3)";
            }
            catch (e) {
                // If detection fails, assume no high contrast for safety
                return false;
            }
        }
        return false;
    }
    function applyHighContrastStyles(chartContainer) {
        if (!detectHighContrast())
            return;
        const svg = chartContainer.select("svg");
        // Apply modern forced colors mode compatible styles using CSS system colors
        svg.selectAll(".bar-group rect").style("stroke", "CanvasText").style("stroke-width", "2px").style("fill", "ButtonFace");
        svg.selectAll(".x-axis, .y-axis").style("stroke", "CanvasText").style("stroke-width", "2px");
        svg.selectAll("text").style("fill", "CanvasText").style("font-weight", "bold");
        // Apply high contrast styles to trend lines if present
        svg.selectAll(".trend-line").style("stroke", "Highlight").style("stroke-width", "3px");
        // Ensure tooltips work in forced colors mode
        svg.selectAll(".tooltip").style("background", "Canvas").style("border", "2px solid CanvasText").style("color", "CanvasText");
    }
    // Inject CSS for forced colors mode support
    function injectForcedColorsCSS() {
        // Check if we're in a browser environment
        if (typeof document === "undefined")
            return; // Node.js environment
        const cssId = "mintwaterfall-forced-colors-css";
        if (document.getElementById(cssId))
            return; // Already injected
        const css = `
            @media (forced-colors: active) {
                .mintwaterfall-chart svg {
                    forced-color-adjust: none;
                }
                
                .mintwaterfall-chart .bar-group rect {
                    stroke: CanvasText !important;
                    stroke-width: 2px !important;
                }
                
                .mintwaterfall-chart .x-axis,
                .mintwaterfall-chart .y-axis {
                    stroke: CanvasText !important;
                    stroke-width: 2px !important;
                }
                
                .mintwaterfall-chart text {
                    fill: CanvasText !important;
                    font-weight: bold !important;
                }
                
                .mintwaterfall-chart .trend-line {
                    stroke: Highlight !important;
                    stroke-width: 3px !important;
                }
                
                .mintwaterfall-tooltip {
                    background: Canvas !important;
                    border: 2px solid CanvasText !important;
                    color: CanvasText !important;
                    forced-color-adjust: none;
                }
            }
            
            @media (prefers-contrast: high) {
                .mintwaterfall-chart .bar-group rect {
                    stroke-width: 2px !important;
                }
                
                .mintwaterfall-chart text {
                    font-weight: bold !important;
                }
            }
        `;
        const style = document.createElement("style");
        style.id = cssId;
        style.textContent = css;
        document.head.appendChild(style);
    }
    // Reduced motion support
    function respectsReducedMotion() {
        if (window.matchMedia) {
            return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        }
        return false;
    }
    function getAccessibleAnimationDuration(defaultDuration) {
        return respectsReducedMotion() ? 0 : defaultDuration;
    }
    // Color contrast validation: WCAG 2.x contrast ratio (normal-size text thresholds).
    // Unparseable colors give a ratio of 1 (fails).
    function validateColorContrast(foreground, background) {
        const l1 = relativeLuminance(foreground);
        const l2 = relativeLuminance(background);
        const ratio = l1 === null || l2 === null ? 1 : (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
        return {
            ratio,
            passesAA: ratio >= 4.5,
            passesAAA: ratio >= 7,
        };
    }
    // Public API
    const accessibilitySystem = {
        createLiveRegion,
        createChartDescription,
        makeAccessible,
        handleChartKeydown,
        handleBarKeydown,
        moveFocus,
        focusElement,
        announce,
        detectHighContrast,
        applyHighContrastStyles,
        injectForcedColorsCSS,
        respectsReducedMotion,
        getAccessibleAnimationDuration,
        validateColorContrast,
        // Configuration
        setAnnounceFunction(fn) {
            announceFunction = fn;
            return this;
        },
        getCurrentFocus() {
            return currentFocusIndex;
        },
        getFocusableCount() {
            return focusableElements.length;
        },
    };
    return accessibilitySystem;
}

// Generated by scripts/sync-version.mjs from package.json. Do not edit.
const version = "2.2.0";

// MintWaterfall - Main Entry Point
// D3.js-compatible waterfall chart component library with enhanced features
// Core chart functionality

export { analyzeWaterfallStatistics, applyTheme, createAccessibilitySystem, createAdvancedDataProcessor, createAnimationSystem, createComparisonWaterfall, createDataProcessor, createDivergingScale, createExportSystem, createRevenueWaterfall, createScaleSystem, createSequentialScale, createShapeGenerators, createStatisticalSystem, createTemporalWaterfall, createTooltipSystem, createVarianceWaterfall, createWaterfallColorScale, createWaterfallConfidenceBands, createWaterfallMilestones, d3DataUtils, dataProcessor, waterfallChart as default, escapeHtml, financialReducers, getAdvancedBarColor, getConditionalColor, groupWaterfallData, interpolateThemeColor, themes, transformTransactionData, version, waterfallChart };
