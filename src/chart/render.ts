// MintWaterfall Chart Render Functions
import * as d3 from "d3";
import {
    ChartConfig,
    ProcessedData,
    MarginConfig,
    getBarWidth,
    getBarPosition,
    getBarCenter,
    isBandScale,
    truncateLabel,
    barKind,
    BarKind,
    XScale,
    YScale,
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
    xScale: XScale;
    yScale: YScale;
    data: ProcessedData[];
    /** Effective animation duration (0 disables transitions). */
    duration: number;
    rotateXLabels: boolean;
    wrappedXLabels: Map<string, string[]> | null;
    xLabelEvery: number;
    valueLabelFontSize: number;
    yTickCount: number;
    /** Text for each bar's value label ("" hides it). */
    labelText: (d: ProcessedData) => string;
    legend: LegendLayout | null;
    /**
     * Horizontal bars. xScale is then the category scale over the vertical range and yScale the
     * value scale over the horizontal range; `barX` is always the offset along the category axis.
     */
    horizontal: boolean;
    /** Truncate category labels to this many characters (0 = no limit). */
    categoryLabelChars: number;
}

export interface LegendItem {
    label: string;
    color: string;
}

export interface LegendLayout {
    items: Array<LegendItem & { x: number; row: number }>;
    rows: number;
}

const LEGEND_ROW = 20;
const LEGEND_SWATCH = 10;

function legendItemWidth(label: string): number {
    return LEGEND_SWATCH + 6 + label.length * 6.6 + 18;
}

/**
 * Legend entries: stack segment labels when stacked, otherwise one entry per bar kind
 * that is drawn in a single consistent color (kinds with mixed colors are omitted).
 */
export function legendItems(data: ProcessedData[], config: ChartConfig, style: ResolvedStyle): LegendItem[] {
    const items = new Map<string, string>();
    if (config.stacked) {
        for (const d of data) {
            if (isAnchoredBar(d) && !d.isStart) continue;
            d.stacks.forEach((s, i) => {
                if (s.label && !items.has(s.label)) items.set(s.label, s.color || style.palette[i % style.palette.length]);
            });
        }
        for (const d of data) {
            if (d.isTotal) items.set(d.label, config.totalColor);
        }
        return [...items].map(([label, color]) => ({ label, color }));
    }
    const pseudo = { config, style, data } as RenderContext;
    const names: Record<BarKind, string> = {
        start: "Opening",
        increase: "Increase",
        decrease: "Decrease",
        subtotal: "Subtotal",
        total: "Total",
    };
    const byKind = new Map<BarKind, Set<string>>();
    data.forEach((d, i) => {
        const kind = barKind(d);
        if (!byKind.has(kind)) byKind.set(kind, new Set());
        byKind.get(kind)!.add(getBarColor(d, i, pseudo));
    });
    const order: BarKind[] = ["start", "increase", "decrease", "subtotal", "total"];
    return order
        .filter(k => byKind.get(k)?.size === 1)
        .map(k => ({ label: names[k], color: [...byKind.get(k)!][0] }));
}

/** Pack legend items into rows that fit `availableWidth`. */
export function layoutLegend(items: LegendItem[], availableWidth: number): LegendLayout | null {
    if (items.length === 0) return null;
    const placed: LegendLayout["items"] = [];
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

export function legendHeight(legend: LegendLayout | null): number {
    return legend ? legend.rows * LEGEND_ROW + 6 : 0;
}

export function drawLegend(svg: AnySelection, ctx: RenderContext): void {
    const items = ctx.legend ? ctx.legend.items : [];
    const group = layer(svg, "legend-group")
        .attr("transform", `translate(${ctx.margins.left},8)`)
        .attr("role", items.length ? "list" : null)
        .attr("aria-label", items.length ? "Legend" : null);
    const sel = group
        .selectAll<SVGGElement, LegendLayout["items"][number]>("g.legend-item")
        .data(items, d => d.label);
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

const MINUS = "\u2212";

export interface Rect {
    x: number;
    y: number;
    width: number;
    height: number;
}
interface Segment {
    value: number;
    label?: string;
    index: number;
    color: string;
    rect: Rect;
    /** Zero-length rect at the segment's starting value (enter state). */
    from: Rect;
}
interface Connector {
    id: string;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
}
interface Point {
    x: number;
    y: number;
}
interface ScenarioLine {
    cls: string;
    d: string;
    color: string;
}
type Marker = ReturnType<typeof createWaterfallMilestones>[number];

/** Apply a transition when animating, otherwise return the selection itself. */
export function animate(selection: AnySelection, ctx: RenderContext, delay?: (d: unknown, i: number) => number): any {
    if (ctx.duration <= 0) {
        selection.interrupt();
        return selection;
    }
    let t = selection.transition().duration(ctx.duration).ease(ctx.config.ease);
    if (delay) t = t.delay(delay);
    return t;
}

/**
 * D3 selections here hold heterogeneous elements and data across layers, so they are
 * intentionally loosely typed; datum callbacks and scales are typed explicitly.
 */
 
export type AnySelection = d3.Selection<any, any, any, any>;

/** Select a direct child layer by class, creating it if necessary. */
export function layer(parent: AnySelection, className: string, tag = "g"): AnySelection {
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
export function valueRect(ctx: RenderContext, v0: number, v1: number, w: number): Rect {
    const a = ctx.yScale(v0);
    const b = ctx.yScale(v1);
    return ctx.horizontal
        ? { x: Math.min(a, b), y: 0, width: Math.abs(b - a), height: w }
        : { x: 0, y: Math.min(a, b), width: w, height: Math.abs(a - b) };
}

/** SVG transform placing a bar group at `pos` along the category axis. */
export function categoryTranslate(ctx: RenderContext, pos: number): string {
    return ctx.horizontal ? `translate(0,${pos})` : `translate(${pos},0)`;
}

export function plotWidth(ctx: RenderContext): number {
    return ctx.width - ctx.margins.left - ctx.margins.right;
}

const barWidthCache = new WeakMap<RenderContext, number>();

export function barWidth(ctx: RenderContext): number {
    let w = barWidthCache.get(ctx);
    if (w === undefined) {
        w = getBarWidth(ctx.xScale, ctx.data.map(d => d.label), plotWidth(ctx));
        barWidthCache.set(ctx, w);
    }
    return w;
}

/** Centre-x lookup for shape helpers (works for band and time scales). */
export function xCenter(ctx: RenderContext): (label: string) => number {
    return (label: string) => getBarCenter(ctx.xScale, label);
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
    if (d.isStart) {
        // Opening balances: explicit single color, otherwise the total color
        return d.stacks.length === 1 && d.stacks[0].color ? d.stacks[0].color : config.totalColor;
    }
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

export function drawBackground(svg: AnySelection, ctx: RenderContext): void {
    const bg = svg.selectAll<SVGRectElement, string>(":scope > rect.mw-background").data(ctx.style.background ? [ctx.style.background] : []);
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

export function drawGrid(container: AnySelection, ctx: RenderContext): void {
    const { yScale, margins, style } = ctx;
    const gridGroup = layer(container, "grid-group").attr("aria-hidden", "true");
    const tickValues = ctx.config.showGrid ? yScale.ticks(ctx.yTickCount) : [];

    const lines = gridGroup.selectAll<SVGLineElement, number>("line.grid-line").data(tickValues, (d: number) => d);
    lines.exit().remove();

    // Grid lines run across the plot at each value tick (horizontal lines for columns, vertical for bars)
    const across = (sel: AnySelection, v: (d: number) => number) =>
        ctx.horizontal
            ? sel.attr("x1", v).attr("x2", v).attr("y1", margins.top).attr("y2", ctx.height - margins.bottom)
            : sel.attr("x1", margins.left).attr("x2", ctx.width - margins.right).attr("y1", v).attr("y2", v);

    const entered = lines.enter().append("line").attr("class", "grid-line");
    across(entered, (d: number) => yScale(d));

    across(animate(entered.merge(lines), ctx), (d: number) => yScale(d))
        .attr("stroke", style.grid)
        .attr("stroke-width", 1)
        .attr("shape-rendering", "crispEdges");

    // Emphasised zero line whenever the domain crosses zero
    const [d0, d1] = yScale.domain();
    const zero = gridGroup.selectAll<SVGLineElement, number>("line.zero-line").data(d0 < 0 && d1 > 0 ? [0] : []);
    zero.exit().remove();
    across(animate(zero.enter().append("line").attr("class", "zero-line").merge(zero), ctx), () => yScale(0))
        .attr("stroke", style.axis)
        .attr("stroke-width", 1.5)
        .attr("shape-rendering", "crispEdges");
}

function styleAxisText(axisGroup: AnySelection, ctx: RenderContext): void {
    axisGroup
        .selectAll("text")
        .attr("fill", ctx.style.mutedText)
        .style("font-family", ctx.style.fontFamily)
        .style("font-size", "12px")
        .style("font-variant-numeric", "tabular-nums");
}

/** Axis layer for an orientation; cleared when the orientation changes (d3-axis sets some text attrs only on enter). */
function axisLayer(container: AnySelection, className: string, ctx: RenderContext): AnySelection {
    const group = layer(container, className);
    const orientation = ctx.horizontal ? "horizontal" : "vertical";
    if (group.attr("data-orientation") !== orientation) {
        group.selectAll("*").remove();
        group.attr("data-orientation", orientation);
    }
    return group;
}

/** Horizontal charts: value axis along the bottom, category axis on the left. */
function drawHorizontalAxes(container: AnySelection, ctx: RenderContext): void {
    const { yScale, margins, config, style } = ctx;
    const xScale = ctx.xScale as d3.ScaleBand<string>;

    const valueAxis = axisLayer(container, "y-axis", ctx).attr("transform", `translate(0,${ctx.height - margins.bottom})`);
    animate(valueAxis, ctx).call(
        d3
            .axisBottom(yScale)
            .ticks(ctx.yTickCount)
            .tickSize(0)
            .tickPadding(10)
            .tickFormat(d => config.formatNumber(d.valueOf()))
    );
    valueAxis.select(".domain").remove();
    styleAxisText(valueAxis, ctx);

    const max = ctx.categoryLabelChars;
    const categoryAxis = axisLayer(container, "x-axis", ctx).attr("transform", `translate(${margins.left},0)`);
    categoryAxis
        .interrupt()
        .call(d3.axisLeft(xScale).tickSize(0).tickSizeOuter(0).tickPadding(10).tickFormat(l => truncateLabel(l, max)));
    categoryAxis
        .select(".domain")
        .attr("stroke", style.axis)
        .attr("stroke-width", 1)
        .attr("shape-rendering", "crispEdges");
    styleAxisText(categoryAxis, ctx);
    const every = Math.max(1, ctx.xLabelEvery);
    categoryAxis
        .selectAll<SVGTextElement, string>(".tick text")
        .style("font-weight", "500")
        .attr("display", (_d: string, i: number) => (i % every === 0 ? null : "none"))
        .each(function (this: SVGTextElement, label: string) {
            // Full text on hover for truncated labels
            if (max > 0 && String(label).length > max) d3.select(this).append("title").text(label);
        });
}

export function drawAxes(container: AnySelection, ctx: RenderContext): void {
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
    xAxisGroup
        .select(".domain")
        .attr("stroke", style.axis)
        .attr("stroke-width", 1)
        .attr("shape-rendering", "crispEdges");
    styleAxisText(xAxisGroup, ctx);
    xAxisGroup.selectAll(".tick text").style("font-weight", "500");

    const tickText = xAxisGroup.selectAll<SVGTextElement, unknown>(".tick text");
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
    tickText.attr("display", (_d: unknown, i: number) => (i % every === 0 ? null : "none"));

    const wrapped = ctx.wrappedXLabels;
    tickText.each(function (this: SVGTextElement, label: unknown) {
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

export function drawBars(container: AnySelection, ctx: RenderContext): AnySelection {
    const { data } = ctx;
    const barsGroup = layer(container, "bars-group");
    const w = barWidth(ctx);
    const stagger = ctx.config.staggeredAnimations ? (_d: unknown, i: number) => i * ctx.config.staggerDelay : undefined;

    const barGroups = barsGroup.selectAll<SVGGElement, ProcessedData>("g.bar-group").data(data, (d: ProcessedData) => d.label);

    barGroups.exit().remove();

    const entered = barGroups
        .enter()
        .append("g")
        .attr("class", "bar-group")
        .attr("transform", (d: ProcessedData) => categoryTranslate(ctx, barX(ctx, d)));

    const merged = entered.merge(barGroups);
    merged
        .classed("is-total", (d: ProcessedData) => Boolean(d.isTotal))
        .classed("is-subtotal", (d: ProcessedData) => Boolean(d.isSubtotal))
        .classed("is-start", (d: ProcessedData) => Boolean(d.isStart))
        .classed("is-increase", (d: ProcessedData) => !isAnchoredBar(d) && d.barTotal >= 0)
        .classed("is-decrease", (d: ProcessedData) => !isAnchoredBar(d) && d.barTotal < 0);

    animate(merged, ctx, stagger).attr("transform", (d: ProcessedData) => categoryTranslate(ctx, barX(ctx, d)));

    merged.each(function (this: SVGGElement, d: ProcessedData, i: number) {
        const group = d3.select(this);
        if (ctx.config.stacked && (!isAnchoredBar(d) || d.isStart) && d.stacks.length > 0) {
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

function setRect(sel: AnySelection, r: Rect): AnySelection {
    return sel.attr("x", r.x).attr("y", r.y).attr("width", r.width).attr("height", r.height);
}

function drawSingleBar(group: AnySelection, d: ProcessedData, i: number, w: number, ctx: RenderContext, delay: number): void {
    const [lo, hi] = getBarExtent(d);
    const r = valueRect(ctx, lo, hi, w);
    const color = getBarColor(d, i, ctx);
    const start = isAnchoredBar(d) ? 0 : d.prevCumulativeTotal || 0;

    const rect = group.selectAll<SVGRectElement, ProcessedData>("rect.waterfall-bar").data([d]);
    const entered = setRect(rect.enter().append("rect").attr("class", "waterfall-bar"), valueRect(ctx, start, start, w)).attr("fill", color);

    setRect(animate(entered.merge(rect), ctx, () => delay), r)
        .attr("rx", roundedRadius(ctx, r.width, r.height))
        .attr("fill", color);
}

function drawStackSegments(group: AnySelection, d: ProcessedData, w: number, ctx: RenderContext, delay: number): void {
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

    const rects = group.selectAll<SVGRectElement, Segment>("rect.stack").data(segments);
    rects.exit().remove();
    const entered = rects
        .enter()
        .append("rect")
        .attr("class", "stack")
        .attr("x", (s: Segment) => s.from.x)
        .attr("y", (s: Segment) => s.from.y)
        .attr("width", (s: Segment) => s.from.width)
        .attr("height", (s: Segment) => s.from.height);

    animate(entered.merge(rects), ctx, () => delay)
        .attr("x", (s: Segment) => s.rect.x)
        .attr("y", (s: Segment) => s.rect.y)
        .attr("width", (s: Segment) => s.rect.width)
        .attr("height", (s: Segment) => s.rect.height)
        .attr("fill", (s: Segment) => s.color)
        .attr("stroke", style.surface)
        .attr("stroke-width", 1);

    // Only label segments where the text (11px, ~6.2px/char) actually fits
    const labeled = segments.filter(s => s.label && s.rect.height >= 16 && String(s.label).length * 6.2 <= s.rect.width - 6);
    const labels = group.selectAll<SVGTextElement, Segment>("text.stack-label").data(labeled);
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
        .attr("x", (s: Segment) => s.rect.x + s.rect.width / 2)
        .attr("y", (s: Segment) => s.rect.y + s.rect.height / 2)
        .attr("fill", "#ffffff")
        .style("font-family", style.fontFamily)
        .style("font-size", "11px")
        .style("font-weight", "600")
        .text((s: Segment) => s.label);
}

export function drawValueLabels(container: AnySelection, ctx: RenderContext): void {
    const { yScale, style, config } = ctx;
    const labelsGroup = layer(container, "labels-group").attr("aria-hidden", "true");
    const w = barWidth(ctx);
    const visible = config.showValueLabels && ctx.valueLabelFontSize > 0;
    const data = visible ? ctx.data.filter(d => (d.barTotal !== 0 || isAnchoredBar(d)) && ctx.labelText(d) !== "") : [];

    const labels = labelsGroup.selectAll<SVGTextElement, ProcessedData>("text.total-label").data(data, (d: ProcessedData) => d.label);
    labels.exit().remove();

    // Labels sit past the bar end: above (columns) / right (bars), or below / left for bars entirely below zero
    const below = (d: ProcessedData) => {
        const [lo, hi] = getBarExtent(d);
        return hi <= 0 && lo < 0;
    };
    const valuePos = (d: ProcessedData) => {
        const [lo, hi] = getBarExtent(d);
        if (ctx.horizontal) return below(d) ? yScale(lo) - 6 : yScale(hi) + 6;
        return below(d) ? yScale(lo) + 16 : yScale(hi) - 7;
    };
    const centre = (d: ProcessedData) => barX(ctx, d) + w / 2;
    const place = (sel: AnySelection) =>
        ctx.horizontal
            ? sel
                  .attr("x", valuePos)
                  .attr("y", centre)
                  .attr("text-anchor", (d: ProcessedData) => (below(d) ? "end" : "start"))
                  .attr("dominant-baseline", "central")
            : sel.attr("x", centre).attr("y", valuePos).attr("text-anchor", "middle").attr("dominant-baseline", null);

    const entered = place(labels.enter().append("text").attr("class", "total-label")).style("opacity", 0);

    const fontSize = `${ctx.valueLabelFontSize}px`;
    const delayFn = ctx.config.staggeredAnimations ? (_d: unknown, i: number) => i * ctx.config.staggerDelay : undefined;

    entered
        .merge(labels)
        .attr("text-anchor", (d: ProcessedData) => (!ctx.horizontal ? "middle" : below(d) ? "end" : "start"))
        .attr("dominant-baseline", ctx.horizontal ? "central" : null);
    animate(entered.merge(labels), ctx, delayFn)
        .attr("x", ctx.horizontal ? valuePos : centre)
        .attr("y", ctx.horizontal ? centre : valuePos)
        .attr("fill", style.text)
        .style("font-family", style.fontFamily)
        .style("font-size", fontSize)
        .style("font-weight", (d: ProcessedData) => (isAnchoredBar(d) ? "700" : "600"))
        .style("font-variant-numeric", "tabular-nums")
        .style("pointer-events", "none")
        .style("opacity", 1)
        .text((d: ProcessedData) => ctx.labelText(d));
}

export function drawConnectors(container: AnySelection, ctx: RenderContext): void {
    const { data, yScale, config, style } = ctx;
    const group = layer(container, "connectors-group").attr("aria-hidden", "true");
    const show = config.showConnectors && !config.stacked && data.length > 1;
    const w = barWidth(ctx);

    const connectorData: Connector[] = [];
    if (show) {
        for (let i = 0; i < data.length - 1; i++) {
            const current = data[i];
            const next = data[i + 1];
            // From the end of this bar to the start of the next, at this bar's running total
            const c0 = barX(ctx, current) + w;
            const c1 = barX(ctx, next);
            const v = yScale(current.cumulativeTotal);
            connectorData.push(
                ctx.horizontal
                    ? { id: `${current.label}\u2192${next.label}`, x1: v, x2: v, y1: c0, y2: c1 }
                    : { id: `${current.label}\u2192${next.label}`, x1: c0, x2: c1, y1: v, y2: v }
            );
        }
    }

    const connectors = group.selectAll<SVGLineElement, Connector>("line.connector").data(connectorData, (d: Connector) => d.id);
    connectors.exit().remove();
    const entered = connectors
        .enter()
        .append("line")
        .attr("class", "connector")
        .attr("x1", (d: Connector) => d.x1)
        .attr("x2", (d: Connector) => d.x1)
        .attr("y1", (d: Connector) => d.y1)
        .attr("y2", (d: Connector) => d.y1);

    animate(entered.merge(connectors), ctx)
        .attr("x1", (d: Connector) => d.x1)
        .attr("x2", (d: Connector) => d.x2)
        .attr("y1", (d: Connector) => d.y1)
        .attr("y2", (d: Connector) => d.y2)
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

export function drawTrendLine(container: AnySelection, ctx: RenderContext): void {
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
    const points = series.map((d, i) =>
        ctx.horizontal ? { x: yScale(values[i]), y: barX(ctx, d) + w / 2 } : { x: barX(ctx, d) + w / 2, y: yScale(values[i]) }
    );

    const line = d3
        .line<{ x: number; y: number }>()
        .x(p => p.x)
        .y(p => p.y)
        .curve(config.trendLineType === "linear" ? d3.curveLinear : ctx.horizontal ? d3.curveMonotoneY : d3.curveMonotoneX);

    const dash = config.trendLineStyle === "dashed" ? "6 4" : config.trendLineStyle === "dotted" ? "2 4" : null;

    const path = group.selectAll<SVGPathElement, Point[]>("path.trend-line").data([points]);
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

    const dots = group.selectAll<SVGCircleElement, Point>("circle.trend-point").data(points);
    dots.exit().remove();
    animate(dots.enter().append("circle").attr("class", "trend-point").merge(dots), ctx)
        .attr("cx", (p: Point) => p.x)
        .attr("cy", (p: Point) => p.y)
        .attr("r", 2.5)
        .attr("fill", config.trendLineColor)
        .attr("fill-opacity", config.trendLineOpacity);
}

export function drawConfidenceBands(container: AnySelection, ctx: RenderContext): void {
    const { config, data, yScale } = ctx;
    if (!config.confidenceBandConfig.enabled || !config.confidenceBandConfig.scenarios || ctx.horizontal) {
        container.selectAll(".confidence-bands-group").remove();
        return;
    }
    const group = layer(container, "confidence-bands-group").attr("aria-hidden", "true");
    const bands = createWaterfallConfidenceBands(
        data.map(d => ({ label: d.label, value: d.barTotal, subtotal: Boolean(d.isSubtotal || d.isTotal), start: Boolean(d.isStart) })),
        config.confidenceBandConfig.scenarios,
        xCenter(ctx),
        yScale
    );

    const band = group.selectAll<SVGPathElement, string>("path.confidence-band").data([bands.confidencePath]);
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
    const lines = group.selectAll<SVGPathElement, ScenarioLine>("path.scenario-line").data(trends, (t: ScenarioLine) => t.cls);
    lines.exit().remove();
    animate(
        lines
            .enter()
            .append("path")
            .attr("class", (t: ScenarioLine) => `scenario-line ${t.cls}`)
            .merge(lines),
        ctx
    )
        .attr("d", (t: ScenarioLine) => t.d)
        .attr("fill", "none")
        .attr("stroke", (t: ScenarioLine) => t.color)
        .attr("stroke-width", 1.5)
        .attr("stroke-dasharray", "5 4");
}

export function drawMilestones(container: AnySelection, ctx: RenderContext): void {
    const { config, yScale } = ctx;
    if (!config.milestoneConfig.enabled || config.milestoneConfig.milestones.length === 0 || ctx.horizontal) {
        container.selectAll(".milestones-group").remove();
        return;
    }
    const group = layer(container, "milestones-group");
    const markers = createWaterfallMilestones(config.milestoneConfig.milestones, xCenter(ctx), yScale);

    const sel = group.selectAll<SVGPathElement, Marker>("path.milestone-marker").data(markers);
    sel.exit().remove();
    animate(sel.enter().append("path").attr("class", "milestone-marker").merge(sel), ctx)
        .attr("transform", (d: Marker) => d.transform)
        .attr("d", (d: Marker) => d.path)
        .attr("fill", (d: Marker) => d.config.fillColor || "#f59e0b")
        .attr("stroke", (d: Marker) => d.config.strokeColor || ctx.style.surface)
        .attr("stroke-width", (d: Marker) => d.config.strokeWidth || 2);
}
