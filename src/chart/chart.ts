// MintWaterfall Chart — Main Chart Factory
import * as d3 from "d3";
import {
    ChartConfig,
    defaultConfig,
    WaterfallChart,
    ProcessedData,
    ChartData,
    ChartExportFormat,
    computeYDomain,
    computeLayout,
    computeHorizontalLayout,
    niceDomain,
    isAnchoredBar,
    barKind,
    XScale,
    ConfidenceBandConfig,
    MilestoneConfig,
    Milestone,
} from "./config.js";
import { prepareData } from "./lifecycle.js";
import { resolveStyle, resolvedThemeName, ResolvedStyle } from "./style.js";
import {
    RenderContext,
    AnySelection,
    layer,
    barX,
    barWidth,
    formatBarValue,
    drawBackground,
    drawLegend,
    legendItems,
    layoutLegend,
    legendHeight,
    drawGrid,
    drawAxes,
    drawBars,
    drawValueLabels,
    drawConnectors,
    drawTrendLine,
    drawConfidenceBands,
    drawMilestones,
} from "./render.js";
import { createTooltipSystem, escapeHtml, TooltipSystem } from "../tooltip.js";
import { createExportSystem } from "../export.js";
import { themes } from "../themes.js";

interface ElementState {
    clipId: string;
    transform: d3.ZoomTransform;
    data: ChartData[];
    emphasis: Set<string> | null;
    zoom: d3.ZoomBehavior<SVGSVGElement, unknown> | null;
    brush: d3.BrushBehavior<unknown> | null;
    /** The element the chart was called on (container or <svg>). */
    container: Element | null;
    /** Pending requestAnimationFrame id for a coalesced zoom render. */
    frame: number | null;
    /** Observes the container in responsive mode. */
    resize: ResizeObserver | null;
    lastWidth: number;
}

const MINUS = "\u2212";
let instanceCounter = 0;

function prefersReducedMotion(): boolean {
    try {
        return typeof window !== "undefined" && typeof window.matchMedia === "function"
            ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
            : false;
    } catch {
        return false;
    }
}

function isValidChartData(data: unknown): data is ChartData[] {
    return (
        Array.isArray(data) &&
        data.every(
            item =>
                item &&
                typeof item.label === "string" &&
                (item.subtotal === true ||
                    (Array.isArray(item.stacks) &&
                        item.stacks.every(
                            (stack: { value?: unknown; color?: unknown } | null) =>
                                stack &&
                                typeof stack.value === "number" &&
                                Number.isFinite(stack.value) &&
                                (stack.color === undefined || typeof stack.color === "string")
                        )))
        )
    );
}

export function waterfallChart(): WaterfallChart {
    const config: ChartConfig = {
        ...defaultConfig,
        margin: { ...defaultConfig.margin },
        advancedColorConfig: { ...defaultConfig.advancedColorConfig },
        confidenceBandConfig: { ...defaultConfig.confidenceBandConfig },
        milestoneConfig: { ...defaultConfig.milestoneConfig, milestones: [...defaultConfig.milestoneConfig.milestones] },
    };

    const instanceId = ++instanceCounter;
    let elementCounter = 0;
    const states = new WeakMap<Element, ElementState>();
    const renderedSvgs = new Set<SVGSVGElement>();
    let lastSvg: SVGSVGElement | null = null;
    let lastProcessed: ProcessedData[] = [];
    let boundData: ChartData[] | null = null;
    let tooltip: TooltipSystem | null = null;
    const exportSystem = createExportSystem();
    let totalColorOverride = false;
    const warned = new Set<string>();

    /** Horizontal charts ignore vertical-only features; say so once per chart and feature. */
    function warnVerticalOnly(): void {
        const ignored: Array<[boolean, string]> = [
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
    let colorSchemeQuery: MediaQueryList | null = null;

    function onColorSchemeChange(): void {
        if (config.theme !== "auto") return;
        renderedSvgs.forEach(svgNode => {
            const s = states.get(svgNode);
            if (s && s.container && s.container.isConnected) renderElement(s.container, s.data);
        });
    }

    /** For theme("auto"): apply the theme that matches the current color scheme and watch for changes. */
    function syncAutoTheme(): void {
        if (config.theme !== "auto") return;
        const resolved = resolvedThemeName(config) as string;
        config.advancedColorConfig.themeName = resolved;
        if (!totalColorOverride && themes[resolved]) config.totalColor = themes[resolved].totalColor;
        if (!colorSchemeQuery && typeof window !== "undefined" && typeof window.matchMedia === "function") {
            colorSchemeQuery = window.matchMedia("(prefers-color-scheme: dark)");
            colorSchemeQuery.addEventListener?.("change", onColorSchemeChange);
        }
    }

    const listeners = d3.dispatch("barClick", "barMouseover", "barMouseout", "barFocus", "chartUpdate", "brushSelection");

    function getTooltip(): TooltipSystem {
        if (!tooltip) tooltip = createTooltipSystem();
        return tooltip;
    }

    function describeBar(d: ProcessedData): string {
        const fmt = config.formatNumber;
        if (d.isTotal) return `${d.label}: total ${fmt(d.barTotal)}`;
        if (d.isSubtotal) return `${d.label}: subtotal ${fmt(d.barTotal)}`;
        if (d.isStart) return `${d.label}: opening value ${fmt(d.barTotal)}`;
        const direction = d.barTotal >= 0 ? "increase" : "decrease";
        return `${d.label}: ${direction} of ${fmt(Math.abs(d.barTotal))}, running total ${fmt(d.cumulativeTotal)}`;
    }

    function describeChart(data: ProcessedData[]): string {
        const fmt = config.formatNumber;
        const deltas = data.filter(d => !isAnchoredBar(d));
        const final = data.length ? data[data.length - 1].cumulativeTotal : 0;
        const parts = [`Waterfall chart with ${data.length} bars, ending at ${fmt(final)}.`];
        const up = deltas.reduce<ProcessedData | null>((m, d) => (d.barTotal > 0 && (!m || d.barTotal > m.barTotal) ? d : m), null);
        const down = deltas.reduce<ProcessedData | null>((m, d) => (d.barTotal < 0 && (!m || d.barTotal < m.barTotal) ? d : m), null);
        if (up) parts.push(`Largest increase: ${up.label} (+${fmt(up.barTotal)}).`);
        if (down) parts.push(`Largest decrease: ${down.label} (${MINUS}${fmt(Math.abs(down.barTotal))}).`);
        return parts.join(" ");
    }

    function tooltipHtml(d: ProcessedData, style: ResolvedStyle): string {
        const fmt = config.formatNumber;
        const row = (key: string, value: string, color?: string) =>
            '<div style="display:flex;justify-content:space-between;gap:20px;line-height:1.7">' +
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

    function applyEmphasis(svg: AnySelection, labels: Set<string> | null): void {
        const dim = (label: string) => labels !== null && !labels.has(label);
        svg.selectAll<SVGGElement, ProcessedData>("g.bar-group").style("opacity", (d: ProcessedData) => (dim(d.label) ? 0.3 : 1));
        svg.selectAll<SVGTextElement, ProcessedData>("text.total-label").attr("fill-opacity", (d: ProcessedData) =>
            dim(d.label) ? 0.3 : 1
        );
    }

    function renderElement(node: Element, data: ChartData[], durationOverride?: number): void {
        const element = d3.select(node);
        let svg: AnySelection;
        if (node.nodeName.toLowerCase() === "svg") {
            svg = element;
        } else {
            const existing = element.selectAll<SVGSVGElement, number>(":scope > svg.mintwaterfall").data([0]);
            svg = existing.enter().append("svg").attr("class", "mintwaterfall").merge(existing);
        }
        const svgNode = svg.node() as SVGSVGElement;

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
            const measured = Math.floor((node as HTMLElement).clientWidth || 0);
            if (measured > 0) width = measured;
            observeResize(node, svgNode, state);
        } else if (state.resize) {
            state.resize.disconnect();
            state.resize = null;
        }
        state.lastWidth = width;
        if (node.nodeName.toLowerCase() === "svg") {
            const w = parseFloat(svgNode.getAttribute("width") || "");
            const h = parseFloat(svgNode.getAttribute("height") || "");
            if (Number.isFinite(w) && w > 0) width = w;
            if (Number.isFinite(h) && h > 0) height = h;
        }

        state.container = node;
        syncAutoTheme();
        const processed = prepareData(data, config);
        const style = resolveStyle(config);
        const yDomain = computeYDomain(processed, config.stacked);
        const labelText = (d: ProcessedData): string => {
            const text = formatBarValue(d, config.formatNumber);
            return config.valueLabel ? String(config.valueLabel(d, text) ?? "") : text;
        };
        const legend = config.showLegend
            ? layoutLegend(
                  legendItems(processed, config, style),
                  Math.max(60, width - Math.max(config.margin.left, 40) - config.margin.right)
              )
            : null;
        const horizontal = config.orientation === "horizontal";
        if (horizontal) warnVerticalOnly();
        const layout = (horizontal ? computeHorizontalLayout : computeLayout)(
            processed,
            config.margin,
            width,
            height,
            yDomain,
            config.formatNumber,
            config.showValueLabels,
            labelText,
            legendHeight(legend)
        );
        const margins = layout.margins;
        const zoomOn = config.enableZoom && !horizontal;
        const hasLabelBelowZero = () =>
            processed.some(d => d.cumulativeTotal < 0 && (isAnchoredBar(d) || (d.prevCumulativeTotal || 0) <= 0));

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
        const baseRange: [number, number] = horizontal ? [margins.top, height - margins.bottom] : [margins.left, width - margins.right];
        const t = zoomOn ? state.transform : d3.zoomIdentity;
        const range = baseRange.map(v => t.applyX(v)) as [number, number];
        let xScale: XScale;
        if (config.scaleType === "time" && !horizontal) {
            const dates = processed.map(d => new Date(d.label));
            xScale = d3
                .scaleTime()
                .domain(d3.extent(dates) as [Date, Date])
                .range(range);
        } else {
            const padding = Math.max(0, Math.min(0.95, config.barPadding));
            xScale = d3
                .scaleBand()
                .domain(processed.map(d => d.label))
                .range(range)
                .paddingInner(padding)
                .paddingOuter(padding / 2);
        }

        const ctx: RenderContext = {
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
            let title: AnySelection = svg.select(":scope > title");
            if (title.empty()) title = svg.insert("title", ":first-child");
            title.text(summary);
            svg.attr("role", "group").attr("aria-roledescription", "waterfall chart").attr("aria-label", summary);
        } else {
            svg.select(":scope > title").remove();
            svg.attr("role", null).attr("aria-roledescription", null).attr("aria-label", null);
        }

        // Clip path (one per chart element, reused across renders)
        const defs = layer(svg, "mw-defs", "defs");
        const clip = defs.selectAll<SVGClipPathElement, string>("clipPath").data([state.clipId]);
        const clipRect = clip
            .enter()
            .append("clipPath")
            .attr("id", (id: string) => id)
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

    function observeResize(node: Element, svgNode: SVGSVGElement, state: ElementState): void {
        if (state.resize || typeof ResizeObserver === "undefined") return;
        let pending: number | null = null;
        state.resize = new ResizeObserver(entries => {
            const w = Math.floor(entries[0]?.contentRect.width || 0);
            if (w <= 0 || Math.abs(w - state.lastWidth) < 1 || pending !== null) return;
            pending = requestAnimationFrame(() => {
                pending = null;
                const s = states.get(svgNode);
                if (s && config.responsive) renderElement(node, s.data, 0);
            });
        });
        state.resize.observe(node);
    }

    function bindBarInteractions(svg: AnySelection, barsLayer: AnySelection, bars: AnySelection, ctx: RenderContext): void {
        const a11y = config.enableAccessibility;
        const clickable = typeof listeners.on("barClick") === "function";
        barsLayer.attr("role", a11y ? "list" : null).attr("aria-label", a11y ? "Bars" : null);

        bars.attr("tabindex", a11y ? 0 : null)
            .attr("role", a11y ? "listitem" : null)
            .attr("aria-label", a11y ? (d: ProcessedData) => describeBar(d) : null)
            .style("cursor", clickable ? "pointer" : "")
            .style("outline", "none")
            .style("transition", "opacity 140ms ease")
            .on("mouseenter", function (this: SVGGElement, event: MouseEvent, d: ProcessedData) {
                applyEmphasis(svg, new Set([d.label]));
                if (config.enableTooltips) {
                    getTooltip()
                        .configure({ ...(config.tooltipConfig as any) })
                        .show(
                            () => {
                                const html = tooltipHtml(d, ctx.style);
                                return config.tooltipContent ? String(config.tooltipContent(d, html) ?? "") : html;
                            },
                            event,
                            d as any
                        );
                }
                listeners.call("barMouseover", this, event, d);
            })
            .on("mousemove", (event: MouseEvent) => {
                if (config.enableTooltips && tooltip) tooltip.move(event);
            })
            .on("mouseleave", function (this: SVGGElement, event: MouseEvent, d: ProcessedData) {
                const state = states.get(svg.node());
                applyEmphasis(svg, state ? state.emphasis : null);
                if (tooltip) tooltip.hide();
                listeners.call("barMouseout", this, event, d);
            })
            .on("click", function (this: SVGGElement, event: MouseEvent, d: ProcessedData) {
                listeners.call("barClick", this, event, d);
            })
            .on("focus", function (this: SVGGElement, event: FocusEvent, d: ProcessedData) {
                applyEmphasis(svg, new Set([d.label]));
                d3.select(this).selectAll("rect").attr("stroke", ctx.style.text).attr("stroke-width", 2);
                listeners.call("barFocus", this, event, d);
            })
            .on("blur", function (this: SVGGElement) {
                const state = states.get(svg.node());
                applyEmphasis(svg, state ? state.emphasis : null);
                d3.select(this).selectAll("rect.waterfall-bar").attr("stroke", null).attr("stroke-width", null);
                d3.select(this).selectAll("rect.stack").attr("stroke", ctx.style.surface).attr("stroke-width", 1);
            })
            .on("keydown", function (this: SVGGElement, event: KeyboardEvent, d: ProcessedData) {
                const nodes = barsLayer.selectAll("g.bar-group").nodes() as SVGGElement[];
                const index = nodes.indexOf(this);
                let target: SVGGElement | undefined;
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
                if (target && typeof target.focus === "function") target.focus();
            });
    }

    function configureBrush(svg: AnySelection, brushLayer: AnySelection, ctx: RenderContext, state: ElementState): void {
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
            .filter((event: MouseEvent) => !event.ctrlKey && !event.button && !(config.enableZoom && event.shiftKey))
            .keyModifiers(!config.enableZoom)
            .extent([
                [margins.left, margins.top],
                [width - margins.right, height - margins.bottom],
            ])
            .on("end", (event: d3.D3BrushEvent<unknown>) => {
                if (!event.sourceEvent) return;
                let selected: ProcessedData[] = [];
                if (event.selection) {
                    const [x0, x1] = event.selection as [number, number];
                    selected = ctx.data.filter(d => {
                        const cx = barX(ctx, d) + w / 2;
                        return cx >= x0 && cx <= x1;
                    });
                    state.emphasis = new Set(selected.map(d => d.label));
                } else {
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

    function configureZoom(svg: AnySelection, ctx: RenderContext, state: ElementState): void {
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
        const extent: [[number, number], [number, number]] = [
            [margins.left, margins.top],
            [width - margins.right, height - margins.bottom],
        ];
        if (!state.zoom) {
            const svgNode = svg.node() as SVGSVGElement;
            state.zoom = d3.zoom<SVGSVGElement, unknown>().on("zoom", (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
                const s = states.get(svgNode);
                if (!s) return;
                s.transform = event.transform;
                // A brush selection is in pixel space; it no longer matches the bars after a zoom/pan
                const hadSelection = s.emphasis !== null;
                if (s.brush) {
                    d3.select(svgNode)
                        .select<SVGGElement>(".brush-layer")
                        .call(s.brush.clear as any);
                }
                s.emphasis = null;
                if (hadSelection) listeners.call("brushSelection", svgNode, event, []);
                // Coalesce bursts of zoom events (wheel, pan) into one render per frame
                if (s.frame === null) {
                    const raf =
                        typeof requestAnimationFrame === "function" ? requestAnimationFrame : (cb: () => void) => setTimeout(cb, 16);
                    s.frame = raf(() => {
                        s.frame = null;
                        renderElement(svgNode, s.data, 0);
                    }) as unknown as number;
                }
            });
            svg.call(state.zoom);
        }
        // When brushing is on, plain drags belong to the brush; pan with Shift+drag (wheel always zooms)
        state.zoom.filter((event: MouseEvent | WheelEvent | TouchEvent) => {
            if (event.type === "wheel") return true;
            if ("button" in event && event.button) return false;
            if (config.enableBrush && (event.type === "mousedown" || event.type === "pointerdown")) return event.shiftKey;
            return !event.ctrlKey;
        });
        state.zoom
            .scaleExtent((config.zoomConfig.scaleExtent as [number, number]) || [1, 8])
            .extent(extent)
            .translateExtent((config.zoomConfig.translateExtent as [[number, number], [number, number]]) || extent);
    }

    const chart: WaterfallChart = function chart(selection: d3.Selection<any, any, any, any>): void {
        selection.each(function (this: Element, datum: ChartData[]) {
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
                console.error(
                    "MintWaterfall: Invalid data structure. Each item needs a 'label' string and either a 'stacks' array of { value: number, color?: string } or 'subtotal: true'."
                );
                return;
            }
            try {
                renderElement(this, data);
            } catch (error: unknown) {
                console.error("MintWaterfall rendering error:", error);
                if (!this || typeof this.nodeName !== "string") return;
                const target = d3.select(this);
                const svg: AnySelection = this.nodeName.toLowerCase() === "svg" ? target : target.select("svg");
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
    } as any;

    // Getter/setter methods using a generic accessor pattern
    function accessor<T>(get: () => T, set: (v: T) => void): any {
        return function (value?: T) {
            if (arguments.length === 0) return get();
            set(value as T);
            return chart;
        };
    }

    chart.width = accessor(
        () => config.width,
        v => {
            config.width = v;
        }
    );
    chart.height = accessor(
        () => config.height,
        v => {
            config.height = v;
        }
    );
    chart.margin = accessor(
        () => config.margin,
        v => {
            config.margin = v;
        }
    );
    chart.stacked = accessor(
        () => config.stacked,
        v => {
            config.stacked = v;
        }
    );
    chart.showTotal = accessor(
        () => config.showTotal,
        v => {
            config.showTotal = v;
        }
    );
    chart.totalLabel = accessor(
        () => config.totalLabel,
        v => {
            config.totalLabel = v;
        }
    );
    chart.totalColor = accessor(
        () => config.totalColor,
        v => {
            config.totalColor = v;
            totalColorOverride = true;
        }
    );
    chart.barPadding = accessor(
        () => config.barPadding,
        v => {
            config.barPadding = v;
        }
    );
    chart.duration = accessor(
        () => config.duration,
        v => {
            config.duration = v;
        }
    );
    chart.ease = accessor(
        () => config.ease,
        v => {
            config.ease = v;
        }
    );
    chart.formatNumber = accessor(
        () => config.formatNumber,
        v => {
            config.formatNumber = v;
        }
    );
    chart.theme = accessor(
        () => config.theme,
        v => {
            config.theme = v;
            // A theme sets the total color; a later chart.totalColor(...) call overrides it
            totalColorOverride = false;
            if (v) {
                const resolved = resolvedThemeName(config) as string;
                config.advancedColorConfig.enabled = true;
                config.advancedColorConfig.themeName = resolved;
                config.colorMode = "conditional";
                if (themes[resolved]) config.totalColor = themes[resolved].totalColor;
            } else {
                config.advancedColorConfig.enabled = false;
                config.totalColor = defaultConfig.totalColor;
            }
        }
    );
    chart.enableBrush = accessor(
        () => config.enableBrush,
        v => {
            config.enableBrush = v;
        }
    );
    chart.brushOptions = accessor(
        () => config.brushOptions,
        v => {
            config.brushOptions = v;
        }
    );
    chart.staggeredAnimations = accessor(
        () => config.staggeredAnimations,
        v => {
            config.staggeredAnimations = v;
        }
    );
    chart.staggerDelay = accessor(
        () => config.staggerDelay,
        v => {
            config.staggerDelay = v;
        }
    );
    chart.scaleType = accessor(
        () => config.scaleType,
        v => {
            config.scaleType = v;
        }
    );
    chart.showTrendLine = accessor(
        () => config.showTrendLine,
        v => {
            config.showTrendLine = v;
        }
    );
    chart.trendLineColor = accessor(
        () => config.trendLineColor,
        v => {
            config.trendLineColor = v;
        }
    );
    chart.trendLineWidth = accessor(
        () => config.trendLineWidth,
        v => {
            config.trendLineWidth = v;
        }
    );
    chart.trendLineStyle = accessor(
        () => config.trendLineStyle,
        v => {
            config.trendLineStyle = v;
        }
    );
    chart.trendLineOpacity = accessor(
        () => config.trendLineOpacity,
        v => {
            config.trendLineOpacity = v;
        }
    );
    chart.trendLineType = accessor(
        () => config.trendLineType,
        v => {
            config.trendLineType = v;
        }
    );
    chart.trendLineWindow = accessor(
        () => config.trendLineWindow,
        v => {
            config.trendLineWindow = v;
        }
    );
    chart.trendLineDegree = accessor(
        () => config.trendLineDegree,
        v => {
            config.trendLineDegree = v;
        }
    );
    chart.enableAccessibility = accessor(
        () => config.enableAccessibility,
        v => {
            config.enableAccessibility = v;
        }
    );
    chart.enableTooltips = accessor(
        () => config.enableTooltips,
        v => {
            config.enableTooltips = v;
            if (!v && tooltip) tooltip.hide();
        }
    );
    chart.tooltipConfig = accessor(
        () => config.tooltipConfig,
        v => {
            config.tooltipConfig = v;
        }
    );
    chart.enableExport = accessor(
        () => config.enableExport,
        v => {
            config.enableExport = v;
        }
    );
    chart.exportConfig = accessor(
        () => config.exportConfig,
        v => {
            config.exportConfig = v;
        }
    );
    chart.enableZoom = accessor(
        () => config.enableZoom,
        v => {
            config.enableZoom = v;
        }
    );
    chart.zoomConfig = accessor(
        () => config.zoomConfig,
        v => {
            config.zoomConfig = v;
        }
    );
    chart.responsive = accessor(
        () => config.responsive,
        v => {
            config.responsive = v;
        }
    );
    chart.showValueLabels = accessor(
        () => config.showValueLabels,
        v => {
            config.showValueLabels = v;
        }
    );
    chart.showConnectors = accessor(
        () => config.showConnectors,
        v => {
            config.showConnectors = v;
        }
    );
    chart.showGrid = accessor(
        () => config.showGrid,
        v => {
            config.showGrid = v;
        }
    );
    chart.barRadius = accessor(
        () => config.barRadius,
        v => {
            config.barRadius = v;
        }
    );
    chart.tooltipContent = accessor(
        () => config.tooltipContent,
        v => {
            config.tooltipContent = v;
        }
    );
    chart.valueLabel = accessor(
        () => config.valueLabel,
        v => {
            config.valueLabel = v;
        }
    );
    chart.showLegend = accessor(
        () => config.showLegend,
        v => {
            config.showLegend = v;
        }
    );
    chart.orientation = accessor(
        () => config.orientation,
        v => {
            config.orientation = v === "horizontal" ? "horizontal" : "vertical";
        }
    );
    chart.enableAdvancedColors = accessor(
        () => config.advancedColorConfig.enabled,
        v => {
            config.advancedColorConfig.enabled = v;
        }
    );
    chart.colorMode = accessor(
        () => config.colorMode,
        v => {
            config.colorMode = v;
        }
    );
    chart.colorTheme = accessor(
        () => config.advancedColorConfig.themeName || "default",
        v => {
            config.advancedColorConfig.themeName = v;
        }
    );
    chart.neutralThreshold = accessor(
        () => config.advancedColorConfig.neutralThreshold || 0,
        v => {
            config.advancedColorConfig.neutralThreshold = v;
        }
    );
    // Partial objects merge into the current config (as in 1.x)
    chart.confidenceBands = accessor(
        () => config.confidenceBandConfig,
        (v: Partial<ConfidenceBandConfig>) => {
            config.confidenceBandConfig = { ...config.confidenceBandConfig, ...v };
        }
    );
    chart.enableConfidenceBands = accessor(
        () => config.confidenceBandConfig.enabled,
        v => {
            config.confidenceBandConfig.enabled = v;
        }
    );
    chart.milestones = accessor(
        () => config.milestoneConfig,
        (v: Partial<MilestoneConfig>) => {
            config.milestoneConfig = {
                ...config.milestoneConfig,
                ...v,
                milestones: [...(v.milestones ?? config.milestoneConfig.milestones)],
            };
        }
    );
    chart.enableMilestones = accessor(
        () => config.milestoneConfig.enabled,
        v => {
            config.milestoneConfig.enabled = v;
        }
    );
    chart.addMilestone = function (milestone: Milestone): WaterfallChart {
        config.milestoneConfig.milestones.push(milestone);
        return chart;
    };

    chart.data = function (value?: ChartData[] | null): any {
        if (arguments.length === 0) return boundData;
        boundData = value ?? null;
        return chart;
    } as any;

    chart.on = function (...args: any[]): any {
        const value = (listeners.on as any).apply(listeners, args);
        return value === listeners ? chart : value;
    } as any;

    chart.export = function (format: ChartExportFormat, options: Record<string, any> = {}) {
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
        } catch (error) {
            return Promise.reject(error);
        }
    } as any;

    chart.destroy = function (): void {
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
                if (state.resize) state.resize.disconnect();
                state.resize = null;
                if (state.frame !== null && typeof cancelAnimationFrame === "function") cancelAnimationFrame(state.frame);
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
