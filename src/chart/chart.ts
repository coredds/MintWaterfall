// MintWaterfall Chart — Main Chart Factory
import * as d3 from "d3";
import {
    ChartConfig, defaultConfig, WaterfallChart, ProcessedData, ChartData,
    BrushOptions, TooltipConfig, ExportConfig, ZoomConfig, BreakdownConfig,
    AdvancedColorConfig, ConfidenceBandConfig, MilestoneConfig, MarginConfig,
    calculateIntelligentMargins,
} from "./config.js";
import { prepareData } from "./lifecycle.js";
import {
    drawGrid, drawAxes, drawBars, drawConnectors, drawTrendLine,
    drawConfidenceBands, drawMilestones,
} from "./render.js";
import { createScaleSystem } from "../scales.js";
import { createBrushSystem } from "../brush.js";
import { createAccessibilitySystem } from "../accessibility.js";
import { createTooltipSystem } from "../tooltip.js";
import { createExportSystem } from "../export.js";
import { createZoomSystem } from "../zoom.js";
import { createPerformanceManager } from "../performance.js";
import { createShapeGenerators } from "../shapes.js";
import { applyTheme } from "../themes.js";

export function waterfallChart(): WaterfallChart {
    const config: ChartConfig = {
        ...defaultConfig,
        formattingRules: new Map(),
        advancedColorConfig: { ...defaultConfig.advancedColorConfig },
        confidenceBandConfig: { ...defaultConfig.confidenceBandConfig },
        milestoneConfig: { ...defaultConfig.milestoneConfig, milestones: [...defaultConfig.milestoneConfig.milestones] },
    };

    let lastDataHash: string | null = null;
    let cachedProcessedData: ProcessedData[] | null = null;

    const scaleSystem = createScaleSystem();
    const brushSystem = createBrushSystem();
    const accessibilitySystem = createAccessibilitySystem();
    const tooltipSystem = createTooltipSystem();
    const exportSystem = createExportSystem();
    const zoomSystem = createZoomSystem();
    const shapeGeneratorSystem = createShapeGenerators();
    const performanceManager = createPerformanceManager();

    const listeners = d3.dispatch("barClick", "barMouseover", "barMouseout", "chartUpdate", "brushSelection");

    const chart: WaterfallChart = function chart(selection: d3.Selection<any, any, any, any>): void {
        selection.each(function (data: ChartData[]) {
            if (!data || !Array.isArray(data)) {
                console.warn("MintWaterfall: Invalid data provided. Expected an array.");
                return;
            }
            if (data.length === 0) {
                console.warn("MintWaterfall: Empty data array provided.");
                return;
            }

            const isValidData = data.every(item =>
                item && typeof item.label === "string" && Array.isArray(item.stacks) &&
                item.stacks.every(stack => typeof stack.value === "number" && typeof stack.color === "string")
            );
            if (!isValidData) {
                console.error("MintWaterfall: Invalid data structure. Each item must have a 'label' string and 'stacks' array with 'value' numbers and 'color' strings.");
                return;
            }

            const element = d3.select(this);
            let svg: any;
            if (this.tagName === "svg") {
                svg = element;
            } else {
                svg = element.selectAll("svg").data([0]);
                const svgEnter = svg.enter().append("svg");
                svg = svgEnter.merge(svg);
                svg.attr("width", config.width).attr("height", config.height);
            }

            const svgNode = svg.node() as SVGSVGElement;
            let actualWidth = config.width;
            let actualHeight = config.height;
            if (svgNode) {
                const w = svgNode.getAttribute("width");
                const h = svgNode.getAttribute("height");
                if (w) actualWidth = parseInt(w, 10);
                if (h) actualHeight = parseInt(h, 10);
            }

            const container = svg.selectAll(".waterfall-container").data([data]);
            const containerEnter = container.enter()
                .append("g")
                .attr("class", "waterfall-container");
            const containerUpdate = containerEnter.merge(container);

            let chartGroup: any = containerUpdate.select(".chart-group");
            if (chartGroup.empty()) {
                chartGroup = containerUpdate.append("g").attr("class", "chart-group");
            }

            const clipPathId = `chart-clip-${Date.now()}`;
            svg.select(`#${clipPathId}`).remove();
            const clipPath = svg.append("defs")
                .append("clipPath")
                .attr("id", clipPathId)
                .append("rect");
            chartGroup.attr("clip-path", `url(#${clipPathId})`);

            try {
                const dataHash = JSON.stringify(data).slice(0, 100) + `_showTotal:${config.showTotal}`;
                let processedData: ProcessedData[];
                if (dataHash === lastDataHash && cachedProcessedData) {
                    processedData = cachedProcessedData;
                } else {
                    processedData = prepareData(
                        data,
                        config
                    );
                    lastDataHash = dataHash;
                    cachedProcessedData = processedData;
                }

                const intelligentMargins = calculateIntelligentMargins(
                    processedData, config.margin, actualWidth, actualHeight, config.formatNumber
                );

                let xScale: any;
                if (config.scaleType === "auto") {
                    xScale = scaleSystem.createAdaptiveScale(processedData, "x");
                    if (xScale.padding) xScale.padding(config.barPadding);
                } else if (config.scaleType === "time") {
                    const timeValues = processedData.map(d => new Date(d.label));
                    xScale = scaleSystem.createTimeScale(timeValues);
                } else if (config.scaleType === "ordinal") {
                    xScale = scaleSystem.createOrdinalScale(processedData.map(d => d.label));
                } else {
                    xScale = d3.scaleBand()
                        .domain(processedData.map(d => d.label))
                        .padding(config.barPadding);
                }
                xScale.range([intelligentMargins.left, actualWidth - intelligentMargins.right]);
                scaleSystem.setDefaultRange([intelligentMargins.left, actualWidth - intelligentMargins.right]);

                const labelSpace = 30;
                clipPath
                    .attr("x", intelligentMargins.left)
                    .attr("y", Math.max(0, intelligentMargins.top - labelSpace))
                    .attr("width", actualWidth - intelligentMargins.left - intelligentMargins.right)
                    .attr("height", actualHeight - intelligentMargins.top - intelligentMargins.bottom + labelSpace);

                const yValues = processedData.map(d => d.cumulativeTotal);
                const [min, max] = d3.extent(yValues) as [number, number];
                const hasNegativeValues = min < 0;
                let yScale: any;
                if (hasNegativeValues) {
                    const range = max - min;
                    const padding = range * 0.05;
                    yScale = d3.scaleLinear()
                        .domain([min - padding, max + padding])
                        .range([actualHeight - intelligentMargins.bottom, intelligentMargins.top]);
                } else {
                    yScale = scaleSystem.createLinearScale(yValues, {
                        range: [actualHeight - intelligentMargins.bottom, intelligentMargins.top],
                        nice: true,
                    });
                }

                config.width = actualWidth;
                config.height = actualHeight;

                drawGrid(containerUpdate, yScale, config, intelligentMargins);
                drawAxes(containerUpdate, xScale, yScale, config, intelligentMargins);
                drawBars(chartGroup, processedData, xScale, yScale, config, intelligentMargins);
                drawConnectors(chartGroup, processedData, xScale, yScale, config);
                drawTrendLine(chartGroup, processedData, xScale, yScale, config);
                drawConfidenceBands(chartGroup, processedData, xScale, yScale, config);
                drawMilestones(chartGroup, processedData, xScale, yScale, config);

                setTimeout(() => {
                    if (config.enableAccessibility) {
                        svg.attr("role", "img")
                            .attr("aria-label", `Waterfall chart with ${processedData.length} data points`);
                    }
                    if (config.enableTooltips) {
                        tooltipSystem.configure(config.tooltipConfig);
                    }
                }, 50);
            } catch (error: any) {
                console.error("MintWaterfall rendering error:", error);
                containerUpdate.selectAll("*").remove();
                containerUpdate.append("text")
                    .attr("x", config.width / 2)
                    .attr("y", config.height / 2)
                    .attr("text-anchor", "middle")
                    .style("font-size", "14px")
                    .style("fill", "#ff6b6b")
                    .text(`Chart Error: ${error.message}`);
            }
        });
    } as any;

    // Getter/setter methods using a generic accessor pattern
    function accessor<T>(get: () => T, set: (v: T) => void): any {
        return function (this: any, value?: T) {
            if (arguments.length === 0) return get();
            set(value!);
            return chart;
        };
    }

    chart.width = accessor(() => config.width, v => { config.width = v; });
    chart.height = accessor(() => config.height, v => { config.height = v; });
    chart.margin = accessor(() => config.margin, v => { config.margin = v; });
    chart.stacked = accessor(() => config.stacked, v => { config.stacked = v; });
    chart.showTotal = accessor(() => config.showTotal, v => { config.showTotal = v; });
    chart.totalLabel = accessor(() => config.totalLabel, v => { config.totalLabel = v; });
    chart.totalColor = accessor(() => config.totalColor, v => { config.totalColor = v; });
    chart.barPadding = accessor(() => config.barPadding, v => { config.barPadding = v; });
    chart.duration = accessor(() => config.duration, v => { config.duration = v; });
    chart.ease = accessor(() => config.ease, v => { config.ease = v; });
    chart.formatNumber = accessor(() => config.formatNumber, v => { config.formatNumber = v; });
    chart.theme = accessor(() => config.theme, v => {
        config.theme = v;
        if (v) {
            config.advancedColorConfig.enabled = true;
            config.advancedColorConfig.themeName = v;
            config.colorMode = "sequential";
            applyTheme(chart as any, v as any);
        }
    });
    chart.enableBrush = accessor(() => config.enableBrush, v => { config.enableBrush = v; });
    chart.brushOptions = accessor(() => config.brushOptions, v => { config.brushOptions = v; });
    chart.staggeredAnimations = accessor(() => config.staggeredAnimations, v => { config.staggeredAnimations = v; });
    chart.staggerDelay = accessor(() => config.staggerDelay, v => { config.staggerDelay = v; });
    chart.scaleType = accessor(() => config.scaleType, v => { config.scaleType = v; });
    chart.showTrendLine = accessor(() => config.showTrendLine, v => { config.showTrendLine = v; });
    chart.trendLineColor = accessor(() => config.trendLineColor, v => { config.trendLineColor = v; });
    chart.trendLineWidth = accessor(() => config.trendLineWidth, v => { config.trendLineWidth = v; });
    chart.trendLineStyle = accessor(() => config.trendLineStyle, v => { config.trendLineStyle = v; });
    chart.trendLineOpacity = accessor(() => config.trendLineOpacity, v => { config.trendLineOpacity = v; });
    chart.trendLineType = accessor(() => config.trendLineType, v => { config.trendLineType = v; });
    chart.trendLineWindow = accessor(() => config.trendLineWindow, v => { config.trendLineWindow = v; });
    chart.trendLineDegree = accessor(() => config.trendLineDegree, v => { config.trendLineDegree = v; });
    chart.enableAccessibility = accessor(() => config.enableAccessibility, v => { config.enableAccessibility = v; });
    chart.enableTooltips = accessor(() => config.enableTooltips, v => { config.enableTooltips = v; });
    chart.tooltipConfig = accessor(() => config.tooltipConfig, v => { config.tooltipConfig = v; });
    chart.enableExport = accessor(() => config.enableExport, v => { config.enableExport = v; });
    chart.exportConfig = accessor(() => config.exportConfig, v => { config.exportConfig = v; });
    chart.enableZoom = accessor(() => config.enableZoom, v => { config.enableZoom = v; });
    chart.zoomConfig = accessor(() => config.zoomConfig, v => { config.zoomConfig = v; });
    chart.breakdownConfig = accessor(() => config.breakdownConfig, v => { config.breakdownConfig = v; });
    chart.enablePerformanceOptimization = accessor(() => config.enablePerformanceOptimization, v => { config.enablePerformanceOptimization = v; });
    chart.performanceDashboard = accessor(() => config.performanceDashboard, v => { config.performanceDashboard = v; });
    chart.virtualizationThreshold = accessor(() => config.virtualizationThreshold, v => { config.virtualizationThreshold = v; });
    chart.enableAdvancedColors = accessor(() => config.advancedColorConfig.enabled, v => { config.advancedColorConfig.enabled = v; });
    chart.colorMode = accessor(() => config.colorMode, v => { config.colorMode = v; });
    chart.colorTheme = accessor(() => config.advancedColorConfig.themeName || "default", v => { config.advancedColorConfig.themeName = v; });
    chart.neutralThreshold = accessor(() => config.advancedColorConfig.neutralThreshold || 0, v => { config.advancedColorConfig.neutralThreshold = v; });
    let boundData: any = null;
    chart.data = function (this: any, value?: any) {
        if (arguments.length === 0) return boundData;
        boundData = value;
        return chart;
    } as any;

    chart.on = function (): any {
        const value = (listeners.on as any).apply(listeners, Array.from(arguments));
        return value === listeners ? chart : value;
    };

    return chart;
}
