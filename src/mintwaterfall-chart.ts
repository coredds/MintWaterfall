// MintWaterfall - D3.js compatible waterfall chart component (TypeScript)
// Usage: d3.waterfallChart().width(800).height(400).showTotal(true)(selection)

import * as d3 from 'd3';
// Import TypeScript modules where available
import { DataItem, StackItem, ProcessedDataItem, dataProcessor, createDataProcessor } from './mintwaterfall-data.js';
import { createScaleSystem, createTimeScale, createOrdinalScale } from './mintwaterfall-scales.js';
// Import JavaScript modules for remaining components during gradual migration
import { createBrushSystem } from "../mintwaterfall-brush.js";
import { createAccessibilitySystem } from "../mintwaterfall-accessibility.js";
import { createTooltipSystem } from "../mintwaterfall-tooltip.js";
import { createExportSystem } from "../mintwaterfall-export.js";
import { createZoomSystem } from "../mintwaterfall-zoom.js";
import { createPerformanceManager } from "../mintwaterfall-performance.js";

// Type definitions
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

export interface BarEventHandler {
    (event: Event, data: ProcessedData): void;
}

export interface WaterfallChart {
    // Core configuration methods
    width(): number;
    width(value: number): WaterfallChart;
    
    height(): number;
    height(value: number): WaterfallChart;
    
    margin(): MarginConfig;
    margin(value: MarginConfig): WaterfallChart;
    
    // Data and display options
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
    
    // Animation and transitions
    duration(): number;
    duration(value: number): WaterfallChart;
    
    ease(): (t: number) => number;
    ease(value: (t: number) => number): WaterfallChart;
    
    // Formatting
    formatNumber(): (n: number) => string;
    formatNumber(value: (n: number) => string): WaterfallChart;
    
    theme(): string | null;
    theme(value: string | null): WaterfallChart;
    
    // Advanced features
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
    
    // Trend line features
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
    
    // Accessibility and UX features
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
    
    // Enterprise features
    breakdownConfig(): BreakdownConfig | null;
    breakdownConfig(value: BreakdownConfig | null): WaterfallChart;
    
    // Performance features
    enablePerformanceOptimization(): boolean;
    enablePerformanceOptimization(value: boolean): WaterfallChart;
    
    performanceDashboard(): boolean;
    performanceDashboard(value: boolean): WaterfallChart;
    
    virtualizationThreshold(): number;
    virtualizationThreshold(value: number): WaterfallChart;
    
    // Event handling
    on(event: string, handler: BarEventHandler | null): WaterfallChart;
    
    // Rendering
    (selection: d3.Selection<any, any, any, any>): void;
}

// Utility function to get bar width from any scale type
function getBarWidth(scale: any, barCount: number, totalWidth: number): number {
    if (scale.bandwidth) {
        // Band scale has bandwidth method
        return scale.bandwidth();
    } else {
        // For continuous scales, calculate width based on bar count
        const padding = 0.1;
        const availableWidth = totalWidth * (1 - padding);
        return availableWidth / barCount;
    }
}

// Utility function to get bar position from any scale type
function getBarPosition(scale: any, value: any, barWidth: number): number {
    if (scale.bandwidth) {
        // Band scale - use scale directly
        return scale(value);
    } else {
        // Continuous scale - center the bar around the scale value
        return scale(value) - barWidth / 2;
    }
}

export function waterfallChart(): WaterfallChart {
    let width: number = 800;
    let height: number = 400;
    let margin: MarginConfig = { top: 60, right: 80, bottom: 60, left: 80 };
    let showTotal: boolean = false;
    let totalLabel: string = "Total";
    let totalColor: string = "#95A5A6";
    let stacked: boolean = true;
    let barPadding: number = 0.1;
    let duration: number = 750;
    let ease: (t: number) => number = d3.easeQuadInOut;
    let formatNumber: (n: number) => string = d3.format(".0f");
    let theme: string | null = null;
    
    // Advanced features
    let enableBrush: boolean = false;
    let brushOptions: BrushOptions = {};
    let staggeredAnimations: boolean = false;
    let staggerDelay: number = 100;
    let scaleType: string = "auto"; // 'auto', 'linear', 'time', 'ordinal'
    
    // Trend line features
    let showTrendLine: boolean = false;
    let trendLineColor: string = "#e74c3c";
    let trendLineWidth: number = 2;
    let trendLineStyle: string = "solid"; // 'solid', 'dashed', 'dotted'
    let trendLineOpacity: number = 0.8;
    let trendLineType: string = "linear"; // 'linear', 'moving-average', 'polynomial'
    
    // Accessibility and UX features
    let enableAccessibility: boolean = true;
    let enableTooltips: boolean = false;
    let tooltipConfig: TooltipConfig = {};
    let enableExport: boolean = true;
    let exportConfig: ExportConfig = {};
    let enableZoom: boolean = false;
    let zoomConfig: ZoomConfig = {};
    
    // Enterprise features
    let breakdownConfig: BreakdownConfig | null = null;
    let formattingRules: Map<string, any> = new Map();
    
    // Performance features
    let lastDataHash: string | null = null;
    let cachedProcessedData: ProcessedData[] | null = null;
    
    // Initialize systems
    const scaleSystem = createScaleSystem();
    const brushSystem = createBrushSystem();
    const accessibilitySystem = createAccessibilitySystem();
    const tooltipSystem = createTooltipSystem();
    const exportSystem = createExportSystem();
    const zoomSystem = createZoomSystem();
    const performanceManager = createPerformanceManager();
    
    // Performance configuration
    let enablePerformanceOptimization: boolean = false;
    let performanceDashboard: boolean = false;
    let virtualizationThreshold: number = 10000;
    
    // Event listeners - enhanced with brush events
    const listeners = d3.dispatch("barClick", "barMouseover", "barMouseout", "chartUpdate", "brushSelection");

    function chart(selection: d3.Selection<any, any, any, any>): void {
        selection.each(function(data: ChartData[]) {
            // Data validation
            if (!data || !Array.isArray(data)) {
                console.warn("MintWaterfall: Invalid data provided. Expected an array.");
                return;
            }

            if (data.length === 0) {
                console.warn("MintWaterfall: Empty data array provided.");
                return;
            }

            // Validate data structure
            const isValidData = data.every(item => 
                item && 
                typeof item.label === "string" && 
                Array.isArray(item.stacks) &&
                item.stacks.every(stack => 
                    typeof stack.value === "number" && 
                    typeof stack.color === "string"
                )
            );

            if (!isValidData) {
                console.error("MintWaterfall: Invalid data structure. Each item must have a 'label' string and 'stacks' array with 'value' numbers and 'color' strings.");
                return;
            }

            const svg = d3.select(this);
            const container = svg.selectAll<SVGGElement, ChartData[]>(".waterfall-container").data([data]);
            
            // Store reference for zoom system
            const svgContainer = svg;
            
            // Create main container group
            const containerEnter = container.enter()
                .append("g")
                .attr("class", "waterfall-container");
            
            const containerUpdate = containerEnter.merge(container);
            
            // Create chart group for zoom transforms
            let chartGroup = containerUpdate.select(".chart-group");
            if (chartGroup.empty()) {
                chartGroup = containerUpdate.append("g")
                    .attr("class", "chart-group");
            }

            try {
                // Enable performance optimization for large datasets
                if (data.length >= virtualizationThreshold && enablePerformanceOptimization) {
                    performanceManager.enableVirtualization({
                        chunkSize: Math.min(1000, Math.floor(data.length / 10)),
                        renderThreshold: virtualizationThreshold
                    });
                }
                
                // Check if we can use cached data (include showTotal in cache key)
                const dataHash = JSON.stringify(data).slice(0, 100) + `_showTotal:${showTotal}`; // Quick hash with showTotal
                let processedData: ProcessedData[];
                
                if (dataHash === lastDataHash && cachedProcessedData) {
                    processedData = cachedProcessedData;
                    console.log("MintWaterfall: Using cached processed data");
                } else {
                    // Prepare data with cumulative calculations
                    if (data.length > 50000) {
                        // For very large datasets, fall back to synchronous processing for now
                        // TODO: Implement proper async handling in future version
                        console.warn("MintWaterfall: Large dataset detected, using synchronous processing");
                        processedData = prepareData(data);
                    } else {
                        processedData = prepareData(data);
                    }
                    
                    // Cache the processed data
                    lastDataHash = dataHash;
                    cachedProcessedData = processedData;
                }
                
                console.log("🔧 processedData in chart:", processedData.map(d => ({
                    label: d.label,
                    barTotal: d.barTotal,
                    cumulativeTotal: d.cumulativeTotal,
                    stackCount: d.stacks?.length
                })));
                
                // Calculate intelligent margins based on data
                const intelligentMargins = calculateIntelligentMargins(processedData, margin);
                
                // Set up scales using enhanced scale system
                let xScale: any;
                if (scaleType === "auto") {
                    xScale = scaleSystem.createAdaptiveScale(processedData, "x");
                    // If it's a band scale, apply padding
                    if (xScale.padding) {
                        xScale.padding(barPadding);
                    }
                } else if (scaleType === "time") {
                    const timeValues = processedData.map(d => new Date(d.label));
                    xScale = scaleSystem.createTimeScale(timeValues);
                } else if (scaleType === "ordinal") {
                    xScale = scaleSystem.createOrdinalScale(processedData.map(d => d.label));
                } else {
                    // Default to band scale for categorical data
                    xScale = d3.scaleBand()
                        .domain(processedData.map(d => d.label))
                        .padding(barPadding);
                }
                
                // Set range for x scale using intelligent margins
                xScale.range([intelligentMargins.left, width - intelligentMargins.right]);

                // Enhanced Y scale using d3.extent and nice()
                const yValues = processedData.map(d => d.cumulativeTotal);
                
                // For waterfall charts, ensure proper baseline handling
                const [min, max] = d3.extent(yValues) as [number, number];
                const hasNegativeValues = min < 0;
                
                let yScale: any;
                if (hasNegativeValues) {
                    // When we have negative values, create scale that includes them but doesn't extend too far
                    const range = max - min;
                    const padding = range * 0.05; // 5% padding
                    yScale = d3.scaleLinear()
                        .domain([min - padding, max + padding])
                        .range([height - intelligentMargins.bottom, intelligentMargins.top]);
                } else {
                    // For positive-only data, start at 0
                    yScale = scaleSystem.createLinearScale(yValues, {
                        range: [height - intelligentMargins.bottom, intelligentMargins.top],
                        nice: true,
                        padding: 0.02,
                        includeZero: true
                    });
                }

                // Create/update grid
                drawGrid(containerUpdate, yScale, intelligentMargins);
                
                // Create/update axes (on container, not chart group)
                drawAxes(containerUpdate, xScale, yScale, intelligentMargins);
                
                // Create/update bars with enhanced animations (in chart group for zoom)
                drawBars(chartGroup, processedData, xScale, yScale, intelligentMargins);
                
                // Create/update connectors (in chart group for zoom)
                drawConnectors(chartGroup, processedData, xScale, yScale);
                
                // Create/update trend line if enabled (in chart group for zoom)
                if (showTrendLine) {
                    drawTrendLine(chartGroup, processedData, xScale, yScale);
                }
                
                // Add brush functionality if enabled
                if (enableBrush) {
                    addBrushSelection(containerUpdate, processedData, xScale, yScale);
                }
                
                // Initialize features after rendering is complete
                setTimeout(() => {
                    if (enableAccessibility) {
                        initializeAccessibility(svg, processedData);
                    }
                    
                    if (enableTooltips) {
                        initializeTooltips(svg);
                    }
                    
                    if (enableExport) {
                        initializeExport(svg, processedData);
                    }
                    
                    if (enableZoom) {
                        initializeZoom(svgContainer, { width, height, margin: intelligentMargins });
                    } else {
                        // Disable zoom if it was previously enabled
                        zoomSystem.enabled(false);
                        svgContainer.on(".zoom", null);
                    }
                }, 50); // Small delay to ensure DOM is ready
                
            } catch (error: any) {
                console.error("MintWaterfall rendering error:", error);
                console.error("Stack trace:", error.stack);
                
                // Clear any partial rendering and show error
                containerUpdate.selectAll("*").remove();
                containerUpdate.append("text")
                    .attr("x", width / 2)
                    .attr("y", height / 2)
                    .attr("text-anchor", "middle")
                    .style("font-size", "14px")
                    .style("fill", "#ff6b6b")
                    .text(`Chart Error: ${error.message}`);
            }
        });
    }

    function calculateIntelligentMargins(processedData: ProcessedData[], baseMargin: MarginConfig): MarginConfig {
        // Calculate required space for labels - handle all edge cases
        const allValues = processedData.flatMap(d => [d.cumulativeTotal, d.prevCumulativeTotal || 0]);
        const maxValue = d3.max(allValues) || 0;
        const minValue = d3.min(allValues) || 0;
        
        // Estimate label dimensions
        const labelHeight = 14;
        const labelPadding = 5;
        const requiredLabelSpace = labelHeight + labelPadding;
        const safetyBuffer = 10;
        
        // Handle edge cases for different data scenarios
        const hasNegativeValues = minValue < 0;
        
        // Create temporary scale that matches the actual rendering logic
        let tempYScale: any;
        const tempRange: [number, number] = [height - baseMargin.bottom, baseMargin.top];
        
        if (hasNegativeValues) {
            // Match the actual scale logic for negative values
            const range = maxValue - minValue;
            const padding = range * 0.05; // 5% padding (same as actual scale)
            tempYScale = d3.scaleLinear()
                .domain([minValue - padding, maxValue + padding])
                .range(tempRange);
        } else {
            // For positive-only data, start at 0 with padding
            const paddedMax = maxValue * 1.02; // 2% padding (same as actual scale)
            tempYScale = d3.scaleLinear()
                .domain([0, paddedMax])
                .range(tempRange)
                .nice(); // Apply nice() like the actual scale
        }
        
        // Find the highest point where any label will be positioned
        const allLabelPositions = processedData.map(d => {
            const barTop = tempYScale(d.cumulativeTotal);
            return barTop - labelPadding;
        });
        
        const highestLabelPosition = Math.min(...allLabelPositions);
        
        // Calculate required top margin
        const spaceNeededFromTop = baseMargin.top - highestLabelPosition + requiredLabelSpace;
        const extraTopMarginNeeded = Math.max(0, spaceNeededFromTop);
        
        // For negative values, we might also need bottom space
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
        
        // Calculate required right margin for labels
        const maxLabelLength = Math.max(...processedData.map(d => 
            formatNumber(d.cumulativeTotal).length
        ));
        const estimatedLabelWidth = maxLabelLength * 8; // Rough estimate: 8px per character
        const minRightMargin = Math.max(baseMargin.right, estimatedLabelWidth / 2 + 10);
        
        const intelligentMargin: MarginConfig = {
            top: baseMargin.top + extraTopMarginNeeded + safetyBuffer,
            right: minRightMargin,
            bottom: baseMargin.bottom + extraBottomMargin + (hasNegativeValues ? safetyBuffer : 5),
            left: baseMargin.left
        };
        
        return intelligentMargin;
    }

    function prepareData(data: ChartData[]): ProcessedData[] {
        let workingData = [...data];
        
        // Apply breakdown analysis if enabled
        if (breakdownConfig && breakdownConfig.enabled) {
            workingData = applyBreakdownAnalysis(workingData, breakdownConfig);
        }
        
        let cumulativeTotal = 0;
        let prevCumulativeTotal = 0;

        // Process each bar with cumulative totals
        const processedData: ProcessedData[] = workingData.map((bar, i) => {
            const barTotal = bar.stacks.reduce((sum, stack) => sum + stack.value, 0);
            prevCumulativeTotal = cumulativeTotal;
            cumulativeTotal += barTotal;
            
            // Apply conditional formatting if enabled
            let processedStacks = bar.stacks;
            if (formattingRules.size > 0) {
                processedStacks = applyConditionalFormatting(bar.stacks, bar, formattingRules);
            }
            
            const result: ProcessedData = {
                ...bar,
                stacks: processedStacks,
                barTotal,
                cumulativeTotal,
                prevCumulativeTotal: i === 0 ? 0 : prevCumulativeTotal
            };

            return result;
        });

        // Add total bar if enabled
        if (showTotal && processedData.length > 0) {
            const totalValue = cumulativeTotal;
            processedData.push({
                label: totalLabel,
                stacks: [{ value: totalValue, color: totalColor }],
                barTotal: totalValue,
                cumulativeTotal: totalValue,
                prevCumulativeTotal: 0 // Total bar starts from zero
            });
        }

        return processedData;
    }

    // Placeholder function implementations - these would be converted separately
    function applyBreakdownAnalysis(data: ChartData[], config: BreakdownConfig): ChartData[] {
        // Implementation would be migrated from JavaScript version
        return data;
    }

    function applyConditionalFormatting(stacks: StackData[], barData: ChartData, rules: Map<string, any>): StackData[] {
        // Implementation would be migrated from JavaScript version
        return stacks;
    }

    function drawGrid(container: any, yScale: any, intelligentMargins: MarginConfig): void {
        // Implementation would be migrated from JavaScript version
    }

    function drawAxes(container: any, xScale: any, yScale: any, intelligentMargins: MarginConfig): void {
        // Implementation would be migrated from JavaScript version
    }

    function drawBars(container: any, processedData: ProcessedData[], xScale: any, yScale: any, intelligentMargins: MarginConfig): void {
        // Implementation would be migrated from JavaScript version
    }

    function drawConnectors(container: any, processedData: ProcessedData[], xScale: any, yScale: any): void {
        // Implementation would be migrated from JavaScript version
    }

    function drawTrendLine(container: any, processedData: ProcessedData[], xScale: any, yScale: any): void {
        // Implementation would be migrated from JavaScript version
    }

    function addBrushSelection(container: any, processedData: ProcessedData[], xScale: any, yScale: any): void {
        // Implementation would be migrated from JavaScript version
    }

    function initializeAccessibility(svg: any, processedData: ProcessedData[]): void {
        // Implementation would be migrated from JavaScript version
    }

    function initializeTooltips(svg: any): void {
        // Implementation would be migrated from JavaScript version
    }

    function initializeExport(svg: any, processedData: ProcessedData[]): void {
        // Implementation would be migrated from JavaScript version
    }

    function initializeZoom(svgContainer: any, config: { width: number; height: number; margin: MarginConfig }): void {
        // Implementation would be migrated from JavaScript version
    }

    // Getter/setter methods using TypeScript
    chart.width = function(_?: number): number | WaterfallChart {
        return arguments.length ? (width = _, chart) : width;
    } as any;

    chart.height = function(_?: number): number | WaterfallChart {
        return arguments.length ? (height = _, chart) : height;
    } as any;

    chart.margin = function(_?: MarginConfig): MarginConfig | WaterfallChart {
        return arguments.length ? (margin = _, chart) : margin;
    } as any;

    chart.stacked = function(_?: boolean): boolean | WaterfallChart {
        return arguments.length ? (stacked = _, chart) : stacked;
    } as any;

    chart.showTotal = function(_?: boolean): boolean | WaterfallChart {
        return arguments.length ? (showTotal = _, chart) : showTotal;
    } as any;

    chart.totalLabel = function(_?: string): string | WaterfallChart {
        return arguments.length ? (totalLabel = _, chart) : totalLabel;
    } as any;

    chart.totalColor = function(_?: string): string | WaterfallChart {
        return arguments.length ? (totalColor = _, chart) : totalColor;
    } as any;

    chart.barPadding = function(_?: number): number | WaterfallChart {
        return arguments.length ? (barPadding = _, chart) : barPadding;
    } as any;

    chart.duration = function(_?: number): number | WaterfallChart {
        return arguments.length ? (duration = _, chart) : duration;
    } as any;

    chart.ease = function(_?: (t: number) => number): ((t: number) => number) | WaterfallChart {
        return arguments.length ? (ease = _, chart) : ease;
    } as any;

    chart.formatNumber = function(_?: (n: number) => string): ((n: number) => string) | WaterfallChart {
        return arguments.length ? (formatNumber = _, chart) : formatNumber;
    } as any;

    chart.theme = function(_?: string | null): (string | null) | WaterfallChart {
        return arguments.length ? (theme = _, chart) : theme;
    } as any;

    chart.enableBrush = function(_?: boolean): boolean | WaterfallChart {
        return arguments.length ? (enableBrush = _, chart) : enableBrush;
    } as any;

    chart.brushOptions = function(_?: BrushOptions): BrushOptions | WaterfallChart {
        return arguments.length ? (brushOptions = { ...brushOptions, ..._ }, chart) : brushOptions;
    } as any;

    chart.staggeredAnimations = function(_?: boolean): boolean | WaterfallChart {
        return arguments.length ? (staggeredAnimations = _, chart) : staggeredAnimations;
    } as any;

    chart.staggerDelay = function(_?: number): number | WaterfallChart {
        return arguments.length ? (staggerDelay = _, chart) : staggerDelay;
    } as any;

    chart.scaleType = function(_?: string): string | WaterfallChart {
        return arguments.length ? (scaleType = _, chart) : scaleType;
    } as any;

    chart.showTrendLine = function(_?: boolean): boolean | WaterfallChart {
        return arguments.length ? (showTrendLine = _, chart) : showTrendLine;
    } as any;

    chart.trendLineColor = function(_?: string): string | WaterfallChart {
        return arguments.length ? (trendLineColor = _, chart) : trendLineColor;
    } as any;

    chart.trendLineWidth = function(_?: number): number | WaterfallChart {
        return arguments.length ? (trendLineWidth = _, chart) : trendLineWidth;
    } as any;

    chart.trendLineStyle = function(_?: string): string | WaterfallChart {
        return arguments.length ? (trendLineStyle = _, chart) : trendLineStyle;
    } as any;

    chart.trendLineOpacity = function(_?: number): number | WaterfallChart {
        return arguments.length ? (trendLineOpacity = _, chart) : trendLineOpacity;
    } as any;

    chart.trendLineType = function(_?: string): string | WaterfallChart {
        return arguments.length ? (trendLineType = _, chart) : trendLineType;
    } as any;

    chart.enableAccessibility = function(_?: boolean): boolean | WaterfallChart {
        return arguments.length ? (enableAccessibility = _, chart) : enableAccessibility;
    } as any;

    chart.enableTooltips = function(_?: boolean): boolean | WaterfallChart {
        return arguments.length ? (enableTooltips = _, chart) : enableTooltips;
    } as any;

    chart.tooltipConfig = function(_?: TooltipConfig): TooltipConfig | WaterfallChart {
        return arguments.length ? (tooltipConfig = { ...tooltipConfig, ..._ }, chart) : tooltipConfig;
    } as any;

    chart.enableExport = function(_?: boolean): boolean | WaterfallChart {
        return arguments.length ? (enableExport = _, chart) : enableExport;
    } as any;

    chart.exportConfig = function(_?: ExportConfig): ExportConfig | WaterfallChart {
        return arguments.length ? (exportConfig = { ...exportConfig, ..._ }, chart) : exportConfig;
    } as any;

    chart.enableZoom = function(_?: boolean): boolean | WaterfallChart {
        return arguments.length ? (enableZoom = _, chart) : enableZoom;
    } as any;

    chart.zoomConfig = function(_?: ZoomConfig): ZoomConfig | WaterfallChart {
        return arguments.length ? (zoomConfig = { ...zoomConfig, ..._ }, chart) : zoomConfig;
    } as any;

    chart.breakdownConfig = function(_?: BreakdownConfig | null): (BreakdownConfig | null) | WaterfallChart {
        return arguments.length ? (breakdownConfig = _, chart) : breakdownConfig;
    } as any;

    chart.enablePerformanceOptimization = function(_?: boolean): boolean | WaterfallChart {
        return arguments.length ? (enablePerformanceOptimization = _, chart) : enablePerformanceOptimization;
    } as any;

    chart.performanceDashboard = function(_?: boolean): boolean | WaterfallChart {
        return arguments.length ? (performanceDashboard = _, chart) : performanceDashboard;
    } as any;

    chart.virtualizationThreshold = function(_?: number): number | WaterfallChart {
        return arguments.length ? (virtualizationThreshold = _, chart) : virtualizationThreshold;
    } as any;

    // Event handling methods
    chart.on = function(): any {
        const value = listeners.on.apply(listeners, arguments);
        return value === listeners ? chart : value;
    };

    return chart as WaterfallChart;
}
