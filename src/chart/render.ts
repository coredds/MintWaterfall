// MintWaterfall Chart Render Functions
import * as d3 from "d3";
import {
    ChartConfig,
    ProcessedData,
    MarginConfig,
    getBarWidth,
    getBarPosition,
    getBarExtent,
    isAnchoredBar,
} from "./config.js";
import { ResolvedStyle } from "./style.js";
import { createWaterfallConfidenceBands, createWaterfallMilestones } from "../shapes.js";
import { getAdvancedBarColor, getThemeColorPalette, ThemeCollection } from "../themes.js";

export interface RenderContext {
    config: ChartConfig;
    style: ResolvedStyle;
    width: number;
    height: number;
    margins: MarginConfig;
    xScale: any;
    yScale: any;
    data: ProcessedData[];
    /** Effective animation duration (0 disables transitions). */
    duration: number;
    rotateXLabels: boolean;
    wrappedXLabels: Map<string, string[]> | null;
    xLabelEvery: number;
    valueLabelFontSize: number;
    yTickCount: number;
}

const MINUS = "\u2212";

/** Apply a transition when animating, otherwise return the selection itself. */
export function animate(selection: any, ctx: RenderContext, delay?: (d: any, i: number) => number): any {
    if (ctx.duration <= 0) {
        selection.interrupt();
        return selection;
    }
    let t = selection.transition().duration(ctx.duration).ease(ctx.config.ease);
    if (delay) t = t.delay(delay);
    return t;
}

/** Select a direct child layer by class, creating it if necessary. */
export function layer(parent: any, className: string, tag = "g"): any {
    let sel = parent.select(`:scope > ${tag}.${className}`);
    if (sel.empty()) {
        sel = parent.append(tag).attr("class", className);
    }
    return sel;
}

export function plotWidth(ctx: RenderContext): number {
    return ctx.width - ctx.margins.left - ctx.margins.right;
}

export function barWidth(ctx: RenderContext): number {
    return getBarWidth(ctx.xScale, ctx.data.length, plotWidth(ctx));
}

export function barX(ctx: RenderContext, d: ProcessedData): number {
    return getBarPosition(ctx.xScale, d.label, barWidth(ctx));
}

/** Signed, human-friendly label for a bar: deltas get +/−, totals do not. */
export function formatBarValue(d: ProcessedData, format: (n: number) => string): string {
    if (isAnchoredBar(d)) return format(d.barTotal);
    if (d.barTotal > 0) return `+${format(d.barTotal)}`;
    if (d.barTotal < 0) return `${MINUS}${format(Math.abs(d.barTotal))}`;
    return format(0);
}

/** Fill color for a whole (non-stacked) bar. */
export function getBarColor(d: ProcessedData, i: number, ctx: RenderContext): string {
    const { config, style } = ctx;
    if (d.isTotal) return config.totalColor;
    if (d.isSubtotal) {
        // Subtotals: explicit color, otherwise a lighter shade of the total color
        if (d.stacks[0]?.color && d.stacks[0].color !== config.totalColor) return d.stacks[0].color;
        const shade = d3.color(config.totalColor);
        return shade ? shade.brighter(0.7).formatHex() : config.totalColor;
    }
    if (config.advancedColorConfig.enabled) {
        const themeName = (config.advancedColorConfig.themeName as keyof ThemeCollection) || "default";
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

export function drawBackground(svg: any, ctx: RenderContext): void {
    const bg = svg.selectAll(":scope > rect.mw-background").data(ctx.style.background ? [ctx.style.background] : []);
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
        .attr("fill", (d: string) => d);
}

export function drawGrid(container: any, ctx: RenderContext): void {
    const { yScale, margins, style } = ctx;
    const gridGroup = layer(container, "grid-group").attr("aria-hidden", "true");
    const tickValues = ctx.config.showGrid ? yScale.ticks(ctx.yTickCount) : [];

    const lines = gridGroup.selectAll("line.grid-line").data(tickValues, (d: number) => d);
    lines.exit().remove();

    const entered = lines
        .enter()
        .append("line")
        .attr("class", "grid-line")
        .attr("y1", (d: number) => yScale(d))
        .attr("y2", (d: number) => yScale(d));

    animate(entered.merge(lines), ctx)
        .attr("x1", margins.left)
        .attr("x2", ctx.width - margins.right)
        .attr("y1", (d: number) => yScale(d))
        .attr("y2", (d: number) => yScale(d))
        .attr("stroke", style.grid)
        .attr("stroke-width", 1)
        .attr("shape-rendering", "crispEdges");

    // Emphasised zero line whenever the domain crosses zero
    const [d0, d1] = yScale.domain();
    const zero = gridGroup.selectAll("line.zero-line").data(d0 < 0 && d1 > 0 ? [0] : []);
    zero.exit().remove();
    animate(zero.enter().append("line").attr("class", "zero-line").merge(zero), ctx)
        .attr("x1", margins.left)
        .attr("x2", ctx.width - margins.right)
        .attr("y1", yScale(0))
        .attr("y2", yScale(0))
        .attr("stroke", style.axis)
        .attr("stroke-width", 1.5)
        .attr("shape-rendering", "crispEdges");
}

function styleAxisText(axisGroup: any, ctx: RenderContext): void {
    axisGroup
        .selectAll("text")
        .attr("fill", ctx.style.mutedText)
        .style("font-family", ctx.style.fontFamily)
        .style("font-size", "12px")
        .style("font-variant-numeric", "tabular-nums");
}

export function drawAxes(container: any, ctx: RenderContext): void {
    const { xScale, yScale, margins, config, style } = ctx;

    const yAxisGroup = layer(container, "y-axis").attr("transform", `translate(${margins.left},0)`);
    const yAxis = d3
        .axisLeft(yScale)
        .ticks(ctx.yTickCount)
        .tickSize(0)
        .tickPadding(10)
        .tickFormat((d: any) => config.formatNumber(d as number));
    animate(yAxisGroup, ctx).call(yAxis);
    yAxisGroup.select(".domain").remove();
    styleAxisText(yAxisGroup, ctx);

    const xAxisGroup = layer(container, "x-axis").attr("transform", `translate(0,${ctx.height - margins.bottom})`);
    const xAxis = d3.axisBottom(xScale).tickSize(0).tickSizeOuter(0).tickPadding(10);
    // Not transitioned: d3-axis would re-apply text/dy at transition start and undo wrapping/rotation
    xAxisGroup.interrupt().call(xAxis);
    xAxisGroup
        .select(".domain")
        .attr("stroke", style.axis)
        .attr("stroke-width", 1)
        .attr("shape-rendering", "crispEdges");
    styleAxisText(xAxisGroup, ctx);
    xAxisGroup.selectAll(".tick text").style("font-weight", "500");

    const tickText = xAxisGroup.selectAll(".tick text");
    if (ctx.rotateXLabels) {
        tickText
            .attr("text-anchor", "end")
            .attr("dx", "-0.5em")
            .attr("dy", "0.4em")
            .attr("transform", "rotate(-35)");
    } else {
        tickText.attr("text-anchor", "middle").attr("dx", null).attr("transform", null);
    }

    const every = Math.max(1, ctx.xLabelEvery);
    tickText.attr("display", (_d: any, i: number) => (i % every === 0 ? null : "none"));

    const wrapped = ctx.wrappedXLabels;
    tickText.each(function (this: SVGTextElement, label: any) {
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
        } else if (!text.select("tspan").empty()) {
            text.selectAll("tspan").remove();
            text.text(String(label));
        }
    });
}

function roundedRadius(ctx: RenderContext, w: number, h: number): number {
    return Math.max(0, Math.min(ctx.config.barRadius, w / 2, h / 2));
}

export function drawBars(container: any, ctx: RenderContext): any {
    const { data } = ctx;
    const barsGroup = layer(container, "bars-group");
    const w = barWidth(ctx);
    const stagger = ctx.config.staggeredAnimations ? (_d: any, i: number) => i * ctx.config.staggerDelay : undefined;

    const barGroups = barsGroup.selectAll("g.bar-group").data(data, (d: any) => d.label);

    barGroups.exit().remove();

    const entered = barGroups
        .enter()
        .append("g")
        .attr("class", "bar-group")
        .attr("transform", (d: ProcessedData) => `translate(${barX(ctx, d)},0)`);

    const merged = entered.merge(barGroups);
    merged
        .classed("is-total", (d: ProcessedData) => Boolean(d.isTotal))
        .classed("is-subtotal", (d: ProcessedData) => Boolean(d.isSubtotal))
        .classed("is-increase", (d: ProcessedData) => !isAnchoredBar(d) && d.barTotal >= 0)
        .classed("is-decrease", (d: ProcessedData) => !isAnchoredBar(d) && d.barTotal < 0);

    animate(merged, ctx, stagger).attr("transform", (d: ProcessedData) => `translate(${barX(ctx, d)},0)`);

    merged.each(function (this: SVGGElement, d: ProcessedData, i: number) {
        const group = d3.select(this);
        if (ctx.config.stacked && !isAnchoredBar(d) && d.stacks.length > 0) {
            group.selectAll("rect.waterfall-bar").remove();
            drawStackSegments(group, d, w, ctx, stagger ? stagger(d, i) : 0);
        } else {
            group.selectAll("rect.stack").remove();
            group.selectAll("text.stack-label").remove();
            drawSingleBar(group, d, i, w, ctx, stagger ? stagger(d, i) : 0);
        }
    });

    return merged;
}

function drawSingleBar(group: any, d: ProcessedData, i: number, w: number, ctx: RenderContext, delay: number): void {
    const { yScale } = ctx;
    const [lo, hi] = getBarExtent(d);
    const y = yScale(hi);
    const h = Math.max(0, yScale(lo) - yScale(hi));
    const color = getBarColor(d, i, ctx);
    const start = yScale(isAnchoredBar(d) ? 0 : d.prevCumulativeTotal || 0);

    const rect = group.selectAll("rect.waterfall-bar").data([d]);
    const entered = rect
        .enter()
        .append("rect")
        .attr("class", "waterfall-bar")
        .attr("x", 0)
        .attr("width", w)
        .attr("y", start)
        .attr("height", 0)
        .attr("fill", color);

    animate(entered.merge(rect), ctx, () => delay)
        .attr("x", 0)
        .attr("width", w)
        .attr("y", y)
        .attr("height", h)
        .attr("rx", roundedRadius(ctx, w, h))
        .attr("fill", color);
}

function drawStackSegments(group: any, d: ProcessedData, w: number, ctx: RenderContext, delay: number): void {
    const { yScale, style } = ctx;
    let running = d.prevCumulativeTotal || 0;
    const segments = d.stacks.map((stack, i) => {
        const start = running;
        running += stack.value;
        const lo = Math.min(start, running);
        const hi = Math.max(start, running);
        return {
            ...stack,
            index: i,
            color: stack.color || style.palette[i % style.palette.length],
            y: yScale(hi),
            height: Math.max(0, yScale(lo) - yScale(hi)),
            startY: yScale(start),
        };
    });

    const rects = group.selectAll("rect.stack").data(segments);
    rects.exit().remove();
    const entered = rects
        .enter()
        .append("rect")
        .attr("class", "stack")
        .attr("x", 0)
        .attr("width", w)
        .attr("y", (s: any) => s.startY)
        .attr("height", 0);

    animate(entered.merge(rects), ctx, () => delay)
        .attr("x", 0)
        .attr("width", w)
        .attr("y", (s: any) => s.y)
        .attr("height", (s: any) => s.height)
        .attr("fill", (s: any) => s.color)
        .attr("stroke", style.surface)
        .attr("stroke-width", 1);

    // Only label segments where the text (11px, ~6.2px/char) actually fits
    const labeled = segments.filter(s => s.label && s.height >= 16 && String(s.label).length * 6.2 <= w - 6);
    const labels = group.selectAll("text.stack-label").data(labeled);
    labels.exit().remove();
    animate(
        labels
            .enter()
            .append("text")
            .attr("class", "stack-label")
            .attr("text-anchor", "middle")
            .attr("dominant-baseline", "central")
            .style("pointer-events", "none")
            .merge(labels),
        ctx,
        () => delay
    )
        .attr("x", w / 2)
        .attr("y", (s: any) => s.y + s.height / 2)
        .attr("fill", "#ffffff")
        .style("font-family", style.fontFamily)
        .style("font-size", "11px")
        .style("font-weight", "600")
        .text((s: any) => s.label);
}

export function drawValueLabels(container: any, ctx: RenderContext): void {
    const { yScale, style, config } = ctx;
    const labelsGroup = layer(container, "labels-group").attr("aria-hidden", "true");
    const w = barWidth(ctx);
    const visible = config.showValueLabels && ctx.valueLabelFontSize > 0;
    const data = visible ? ctx.data.filter(d => d.barTotal !== 0 || isAnchoredBar(d)) : [];

    const labels = labelsGroup.selectAll("text.total-label").data(data, (d: any) => d.label);
    labels.exit().remove();

    const position = (d: ProcessedData) => {
        const [lo, hi] = getBarExtent(d);
        if (hi <= 0 && lo < 0) return yScale(lo) + 16; // bar entirely below zero → label underneath
        return yScale(hi) - 7;
    };

    const entered = labels
        .enter()
        .append("text")
        .attr("class", "total-label")
        .attr("text-anchor", "middle")
        .attr("x", (d: ProcessedData) => barX(ctx, d) + w / 2)
        .attr("y", position)
        .style("opacity", 0);

    const fontSize = `${ctx.valueLabelFontSize}px`;
    const delayFn = ctx.config.staggeredAnimations ? (_d: any, i: number) => i * ctx.config.staggerDelay : undefined;

    animate(entered.merge(labels), ctx, delayFn)
        .attr("x", (d: ProcessedData) => barX(ctx, d) + w / 2)
        .attr("y", position)
        .attr("fill", style.text)
        .style("font-family", style.fontFamily)
        .style("font-size", fontSize)
        .style("font-weight", (d: ProcessedData) => (isAnchoredBar(d) ? "700" : "600"))
        .style("font-variant-numeric", "tabular-nums")
        .style("pointer-events", "none")
        .style("opacity", 1)
        .text((d: ProcessedData) => formatBarValue(d, config.formatNumber));
}

export function drawConnectors(container: any, ctx: RenderContext): void {
    const { data, yScale, config, style } = ctx;
    const group = layer(container, "connectors-group").attr("aria-hidden", "true");
    const show = config.showConnectors && !config.stacked && data.length > 1;
    const w = barWidth(ctx);

    const connectorData: Array<{ id: string; x1: number; x2: number; y: number }> = [];
    if (show) {
        for (let i = 0; i < data.length - 1; i++) {
            const current = data[i];
            const next = data[i + 1];
            connectorData.push({
                id: `${current.label}\u2192${next.label}`,
                x1: barX(ctx, current) + w,
                x2: barX(ctx, next),
                y: yScale(current.cumulativeTotal),
            });
        }
    }

    const connectors = group.selectAll("line.connector").data(connectorData, (d: any) => d.id);
    connectors.exit().remove();
    const entered = connectors
        .enter()
        .append("line")
        .attr("class", "connector")
        .attr("x1", (d: any) => d.x1)
        .attr("x2", (d: any) => d.x1)
        .attr("y1", (d: any) => d.y)
        .attr("y2", (d: any) => d.y);

    animate(entered.merge(connectors), ctx)
        .attr("x1", (d: any) => d.x1)
        .attr("x2", (d: any) => d.x2)
        .attr("y1", (d: any) => d.y)
        .attr("y2", (d: any) => d.y)
        .attr("stroke", style.connector)
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", "3 3")
        .attr("shape-rendering", "crispEdges");
}

/** Least-squares polynomial fit; returns coefficients [c0, c1, ..., cn]. */
export function polynomialFit(xs: number[], ys: number[], degree: number): number[] {
    const n = Math.max(1, Math.min(degree, xs.length - 1));
    const size = n + 1;
    const matrix: number[][] = Array.from({ length: size }, () => new Array(size + 1).fill(0));
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
            if (Math.abs(matrix[r][col]) > Math.abs(matrix[pivot][col])) pivot = r;
        }
        [matrix[col], matrix[pivot]] = [matrix[pivot], matrix[col]];
        const p = matrix[col][col];
        if (Math.abs(p) < 1e-12) continue;
        for (let c = col; c <= size; c++) matrix[col][c] /= p;
        for (let r = 0; r < size; r++) {
            if (r === col) continue;
            const factor = matrix[r][col];
            for (let c = col; c <= size; c++) matrix[r][c] -= factor * matrix[col][c];
        }
    }
    return matrix.map(row => row[size]);
}

/** Trend values (in data units) for each bar's running total. */
export function computeTrendValues(values: number[], type: string, windowSize: number, degree: number): number[] {
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

export function drawTrendLine(container: any, ctx: RenderContext): void {
    const { config, data, yScale } = ctx;
    if (!config.showTrendLine || data.length < 2) {
        container.selectAll(".trend-group").remove();
        return;
    }
    const group = layer(container, "trend-group").attr("aria-hidden", "true");
    const w = barWidth(ctx);
    // Totals/subtotals repeat an existing running total, so they would double-weight the fit
    const series = data.filter(d => !isAnchoredBar(d));
    const values = computeTrendValues(
        series.map(d => d.cumulativeTotal),
        config.trendLineType,
        config.trendLineWindow,
        config.trendLineDegree
    );
    const points = series.map((d, i) => ({ x: barX(ctx, d) + w / 2, y: yScale(values[i]) }));

    const line = d3
        .line<{ x: number; y: number }>()
        .x(p => p.x)
        .y(p => p.y)
        .curve(config.trendLineType === "linear" ? d3.curveLinear : d3.curveMonotoneX);

    const dash = config.trendLineStyle === "dashed" ? "6 4" : config.trendLineStyle === "dotted" ? "2 4" : null;

    const path = group.selectAll("path.trend-line").data([points]);
    const entered = path
        .enter()
        .append("path")
        .attr("class", "trend-line")
        .attr("fill", "none")
        .attr("d", line);

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
        .attr("cx", (p: any) => p.x)
        .attr("cy", (p: any) => p.y)
        .attr("r", 2.5)
        .attr("fill", config.trendLineColor)
        .attr("fill-opacity", config.trendLineOpacity);
}

export function drawConfidenceBands(container: any, ctx: RenderContext): void {
    const { config, data, xScale, yScale } = ctx;
    if (!config.confidenceBandConfig.enabled || !config.confidenceBandConfig.scenarios) {
        container.selectAll(".confidence-bands-group").remove();
        return;
    }
    const group = layer(container, "confidence-bands-group").attr("aria-hidden", "true");
    const bands = createWaterfallConfidenceBands(
        data.map(d => ({ label: d.label, value: d.barTotal })),
        config.confidenceBandConfig.scenarios,
        xScale,
        yScale
    );

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
    const lines = group.selectAll("path.scenario-line").data(trends, (t: any) => t.cls);
    lines.exit().remove();
    animate(
        lines
            .enter()
            .append("path")
            .attr("class", (t: any) => `scenario-line ${t.cls}`)
            .merge(lines),
        ctx
    )
        .attr("d", (t: any) => t.d)
        .attr("fill", "none")
        .attr("stroke", (t: any) => t.color)
        .attr("stroke-width", 1.5)
        .attr("stroke-dasharray", "5 4");
}

export function drawMilestones(container: any, ctx: RenderContext): void {
    const { config, xScale, yScale } = ctx;
    if (!config.milestoneConfig.enabled || config.milestoneConfig.milestones.length === 0) {
        container.selectAll(".milestones-group").remove();
        return;
    }
    const group = layer(container, "milestones-group");
    const markers = createWaterfallMilestones(config.milestoneConfig.milestones, xScale, yScale);

    const sel = group.selectAll("path.milestone-marker").data(markers);
    sel.exit().remove();
    animate(sel.enter().append("path").attr("class", "milestone-marker").merge(sel), ctx)
        .attr("transform", (d: any) => d.transform)
        .attr("d", (d: any) => d.path)
        .attr("fill", (d: any) => d.config.fillColor || "#f59e0b")
        .attr("stroke", (d: any) => d.config.strokeColor || ctx.style.surface)
        .attr("stroke-width", (d: any) => d.config.strokeWidth || 2);
}
