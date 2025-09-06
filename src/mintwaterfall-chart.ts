// MintWaterfall - D3.js compatible waterfall chart component (TypeScript)
// Usage: d3.waterfallChart().width(800).height(400).showTotal(true)(selection)

import * as d3 from 'd3';
// Import TypeScript modules where available
import { DataItem, StackItem, ProcessedDataItem, dataProcessor, createDataProcessor } from './mintwaterfall-data.js';
import { createScaleSystem, createTimeScale, createOrdinalScale } from './mintwaterfall-scales.js';
// Import JavaScript modules for remaining components during gradual migration
import { createBrushSystem } from "./mintwaterfall-brush.js";
import { createAccessibilitySystem } from "./mintwaterfall-accessibility.js";
import { createTooltipSystem } from "./mintwaterfall-tooltip.js";
import { createExportSystem } from "./mintwaterfall-export.js";
import { createZoomSystem } from "./mintwaterfall-zoom.js";
import { createPerformanceManager } from "./mintwaterfall-performance.js";

// NEW: Import advanced features
import { 
    createSequentialScale, 
    createDivergingScale, 
    getConditionalColor,
    createWaterfallColorScale,
    interpolateThemeColor,
    getAdvancedBarColor,
    ThemeCollection 
} from './mintwaterfall-themes.js';
import { 
    createShapeGenerators, 
    createWaterfallConfidenceBands, 
    createWaterfallMilestones 
} from './mintwaterfall-shapes.js';

// NEW: Import MEDIUM PRIORITY analytical enhancement features
import { 
    createAdvancedDataProcessor,
    createWaterfallSequenceAnalyzer,
    createWaterfallTickGenerator
} from './mintwaterfall-advanced-data.js';
import { 
    createAdvancedInteractionSystem,
    createWaterfallDragBehavior,
    createWaterfallVoronoiConfig,
    createWaterfallForceConfig
} from './mintwaterfall-advanced-interactions.js';
import { 
    createHierarchicalLayoutSystem,
    createWaterfallTreemap,
    createWaterfallSunburst,
    createWaterfallBubbles
} from './mintwaterfall-hierarchical-layouts.js';

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

// NEW: Advanced feature configurations
export interface AdvancedColorConfig {
    enabled: boolean;
    scaleType: 'auto' | 'sequential' | 'diverging' | 'conditional';
    themeName?: string;
    customColorScale?: (value: number) => string;
    neutralThreshold?: number;
}

export interface ConfidenceBandConfig {
    enabled: boolean;
    scenarios?: {
        optimistic: Array<{label: string, value: number}>;
        pessimistic: Array<{label: string, value: number}>;
    };
    opacity?: number;
    showTrendLines?: boolean;
}

export interface MilestoneConfig {
    enabled: boolean;
    milestones: Array<{
        label: string;
        value: number;
        type: 'target' | 'threshold' | 'alert' | 'achievement';
        description?: string;
    }>;
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
    
    // NEW: Advanced color features
    enableAdvancedColors(): boolean;
    enableAdvancedColors(value: boolean): WaterfallChart;
    
    colorMode(): 'default' | 'conditional' | 'sequential' | 'diverging';
    colorMode(value: 'default' | 'conditional' | 'sequential' | 'diverging'): WaterfallChart;
    
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
    
    trendLineWindow(): number;
    trendLineWindow(value: number): WaterfallChart;
    
    trendLineDegree(): number;
    trendLineDegree(value: number): WaterfallChart;
    
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
    
    // Note: MEDIUM PRIORITY analytical enhancement features are available 
    // via the exported utility functions but not integrated into the main chart API
    
    // Internal system instances
    zoomSystemInstance?: any;
    
    // Rendering
    (selection: d3.Selection<any, any, any, any>): void;
}

// Utility function to get bar width from any scale type
function getBarWidth(scale: any, barCount: number, totalWidth: number): number {
    if (scale.bandwidth) {
        // Band scale has bandwidth method - use it directly
        const bandwidth = scale.bandwidth();
        // Using band scale bandwidth
        return bandwidth;
    } else {
        // For continuous scales, calculate width based on bar count
        const padding = 0.1;
        const availableWidth = totalWidth * (1 - padding);
        const calculatedWidth = availableWidth / barCount;
        // Calculated width for continuous scale
        return calculatedWidth;
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
    let stacked: boolean = false;
    let barPadding: number = 0.05;
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
    
    // NEW: Advanced color and shape features
    let advancedColorConfig: AdvancedColorConfig = {
        enabled: false,
        scaleType: 'auto',
        themeName: 'default',
        neutralThreshold: 0
    };
    
    // Advanced color mode for enhanced visual impact
    let colorMode: 'default' | 'conditional' | 'sequential' | 'diverging' = 'conditional';
    
    let confidenceBandConfig: ConfidenceBandConfig = {
        enabled: false,
        opacity: 0.3,
        showTrendLines: true
    };
    
    let milestoneConfig: MilestoneConfig = {
        enabled: false,
        milestones: []
    };
    
    // Note: Advanced analytical enhancement feature variables removed
    // Features are available via exported utility functions
    
    // Note: Hierarchical layout variables removed
    // Features are available via exported utility functions
    
    // Trend line features
    let showTrendLine: boolean = false;
    let trendLineColor: string = "#e74c3c";
    let trendLineWidth: number = 2;
    let trendLineStyle: string = "solid"; // 'solid', 'dashed', 'dotted'
    let trendLineOpacity: number = 0.8;
    let trendLineType: string = "linear"; // 'linear', 'moving-average', 'polynomial'
    let trendLineWindow: number = 3; // Moving average window size
    let trendLineDegree: number = 2; // Polynomial degree
    
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
    
    // NEW: Initialize advanced feature systems
    const shapeGeneratorSystem = createShapeGenerators();
    const performanceManager = createPerformanceManager();
    
    // Note: Advanced analytical enhancement system instances removed
    // Systems are available via exported utility functions
    
    
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

            // Handle both div containers and existing SVG elements
            const element = d3.select(this);
            let svg: any;
            
            if (this.tagName === 'svg') {
                // Already an SVG element
                svg = element;
            } else {
                // Container element (div) - create or select SVG
                svg = element.selectAll('svg').data([0]);
                const svgEnter = svg.enter().append('svg');
                svg = svgEnter.merge(svg);
                
                // Set SVG dimensions
                svg.attr('width', width).attr('height', height);
            }
            
            // Get actual SVG dimensions from attributes if available
            const svgNode = svg.node() as SVGSVGElement;
            if (svgNode) {
                const svgWidth = svgNode.getAttribute('width');
                const svgHeight = svgNode.getAttribute('height');
                if (svgWidth) width = parseInt(svgWidth, 10);
                if (svgHeight) height = parseInt(svgHeight, 10);
            }
            
            // Chart dimensions set
            
            const container = svg.selectAll(".waterfall-container").data([data]);
            
            // Store reference for zoom system
            const svgContainer = svg;
            
            // Create main container group
            const containerEnter = container.enter()
                .append("g")
                .attr("class", "waterfall-container");
            
            const containerUpdate = containerEnter.merge(container);
            
            // Create chart group for zoom transforms
            let chartGroup: any = containerUpdate.select(".chart-group");
            if (chartGroup.empty()) {
                chartGroup = containerUpdate.append("g")
                    .attr("class", "chart-group");
            }

            // Add clipping path to prevent overflow - this will be set after margins are calculated
            const clipPathId = `chart-clip-${Date.now()}`;
            svg.select(`#${clipPathId}`).remove(); // Remove existing if any
            const clipPath = svg.append("defs")
                .append("clipPath")
                .attr("id", clipPathId)
                .append("rect");
                
            chartGroup.attr("clip-path", `url(#${clipPathId})`);

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
                    // Using cached processed data
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
                
                // Process data for chart rendering
                
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
                
                // CRITICAL: Set range for x scale using intelligent margins - this must happen after scale creation
                xScale.range([intelligentMargins.left, width - intelligentMargins.right]);
                
                // Ensure the scale system uses the correct default range for future scales
                scaleSystem.setDefaultRange([intelligentMargins.left, width - intelligentMargins.right]);
                
                // Update clipping path with proper chart area dimensions
                // IMPORTANT: Extend clipping area to include space for labels above bars
                const labelSpace = 30; // Extra space for labels above the chart area
                clipPath
                    .attr("x", intelligentMargins.left)
                    .attr("y", Math.max(0, intelligentMargins.top - labelSpace)) // Extend upward for labels
                    .attr("width", width - intelligentMargins.left - intelligentMargins.right)
                    .attr("height", height - intelligentMargins.top - intelligentMargins.bottom + labelSpace);
                
                // Clipping path configured
                
                // Scale configuration complete

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
                        nice: true
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
                
                // Create/update trend line (handles both show and hide cases)
                drawTrendLine(chartGroup, processedData, xScale, yScale);
                
                // NEW: Draw advanced features
                drawConfidenceBands(chartGroup, processedData, xScale, yScale);
                drawMilestones(chartGroup, processedData, xScale, yScale);
                
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
                        // Initialize zoom system if not already created
                        if (!(chart as any).zoomSystemInstance) {
                            (chart as any).zoomSystemInstance = createZoomSystem();
                        }
                        
                        // Attach zoom to the SVG container
                        (chart as any).zoomSystemInstance.attach(svgContainer);
                        (chart as any).zoomSystemInstance.setDimensions({ width, height, margin: intelligentMargins });
                        (chart as any).zoomSystemInstance.enable();
                    } else {
                        // Disable zoom if it was previously enabled
                        if ((chart as any).zoomSystemInstance) {
                            (chart as any).zoomSystemInstance.disable();
                            (chart as any).zoomSystemInstance.detach();
                        }
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
        
        // Estimate label dimensions - be more generous with space
        const labelHeight = 16; // Increased from 14 to account for font size
        const labelPadding = 8; // Increased from 5 for better spacing
        const requiredLabelSpace = labelHeight + labelPadding;
        const safetyBuffer = 20; // Increased from 10 for more breathing room
        
        // Handle edge cases for different data scenarios
        const hasNegativeValues = minValue < 0;
        
        // Start with a more generous top margin to ensure labels fit
        const initialTopMargin = Math.max(baseMargin.top, 80); // Ensure minimum 80px for labels
        
        // Create temporary scale that matches the actual rendering logic
        let tempYScale: any;
        const tempRange: [number, number] = [height - baseMargin.bottom, initialTopMargin];
        
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
        
        // Calculate required top margin - ensure labels have enough space above them
        const spaceNeededFromTop = Math.max(
            initialTopMargin - highestLabelPosition + requiredLabelSpace,
            requiredLabelSpace + safetyBuffer // Minimum space needed
        );
        const extraTopMarginNeeded = Math.max(0, spaceNeededFromTop - initialTopMargin);
        
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
        const estimatedLabelWidth = maxLabelLength * 9; // Increased from 8 to 9px per character
        const minRightMargin = Math.max(baseMargin.right, estimatedLabelWidth / 2 + 15);
        
        const intelligentMargin: MarginConfig = {
            top: initialTopMargin + extraTopMarginNeeded + safetyBuffer,
            right: minRightMargin,
            bottom: baseMargin.bottom + extraBottomMargin + (hasNegativeValues ? safetyBuffer : 10),
            left: baseMargin.left
        };
        
        // Intelligent margins calculated
        
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
        // Create horizontal grid lines
        const gridGroup = container.selectAll(".grid-group").data([0]);
        const gridGroupEnter = gridGroup.enter()
            .append("g")
            .attr("class", "grid-group");
        const gridGroupUpdate = gridGroupEnter.merge(gridGroup);

        // Get tick values from y scale
        const tickValues = yScale.ticks();
        
        // Create grid lines
        const gridLines = gridGroupUpdate.selectAll(".grid-line").data(tickValues);
        
        const gridLinesEnter = gridLines.enter()
            .append("line")
            .attr("class", "grid-line")
            .attr("x1", intelligentMargins.left)
            .attr("x2", width - intelligentMargins.right)
            .attr("stroke", "rgba(224, 224, 224, 0.5)")
            .attr("stroke-width", 1)
            .style("opacity", 0);

        gridLinesEnter.merge(gridLines)
            .transition()
            .duration(duration)
            .ease(ease)
            .attr("y1", (d: any) => yScale(d))
            .attr("y2", (d: any) => yScale(d))
            .attr("x1", intelligentMargins.left)
            .attr("x2", width - intelligentMargins.right)
            .style("opacity", 1);

        gridLines.exit()
            .transition()
            .duration(duration)
            .ease(ease)
            .style("opacity", 0)
            .remove();
    }

    function drawAxes(container: any, xScale: any, yScale: any, intelligentMargins: MarginConfig): void {
        // Y-axis
        const yAxisGroup = container.selectAll(".y-axis").data([0]);
        const yAxisGroupEnter = yAxisGroup.enter()
            .append("g")
            .attr("class", "y-axis")
            .attr("transform", `translate(${intelligentMargins.left},0)`);
        
        yAxisGroupEnter.merge(yAxisGroup)
            .transition()
            .duration(duration)
            .ease(ease)
            .call(d3.axisLeft(yScale).tickFormat((d: any) => formatNumber(d as number)));

        // X-axis
        const xAxisGroup = container.selectAll(".x-axis").data([0]);
        const xAxisGroupEnter = xAxisGroup.enter()
            .append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(0,${height - intelligentMargins.bottom})`);
        
        xAxisGroupEnter.merge(xAxisGroup)
            .transition()
            .duration(duration)
            .ease(ease)
            .call(d3.axisBottom(xScale));
    }

    function drawBars(container: any, processedData: ProcessedData[], xScale: any, yScale: any, intelligentMargins: MarginConfig): void {
        const barsGroup = container.selectAll(".bars-group").data([0]);
        const barsGroupEnter = barsGroup.enter()
            .append("g")
            .attr("class", "bars-group");
        const barsGroupUpdate = barsGroupEnter.merge(barsGroup);

        // Bar groups for each data point
        const barGroups = barsGroupUpdate.selectAll(".bar-group").data(processedData, (d: any) => d.label);
        
        // For band scales, we don't need manual positioning - the scale handles it
        const barGroupsEnter = barGroups.enter()
            .append("g")
            .attr("class", "bar-group")
            .attr("transform", (d: any) => {
                if (xScale.bandwidth) {
                    // Band scale - use the scale directly
                    return `translate(${xScale(d.label)}, 0)`;
                } else {
                    // Continuous scale - manual positioning using intelligent margins
                    const barWidth = getBarWidth(xScale, processedData.length, width - intelligentMargins.left - intelligentMargins.right);
                    const barX = getBarPosition(xScale, d.label, barWidth);
                    return `translate(${barX}, 0)`;
                }
            });

        const barGroupsUpdate = barGroupsEnter.merge(barGroups)
            .transition()
            .duration(duration)
            .ease(ease)
            .attr("transform", (d: any) => {
                if (xScale.bandwidth) {
                    // Band scale - use the scale directly
                    return `translate(${xScale(d.label)}, 0)`;
                } else {
                    // Continuous scale - manual positioning using intelligent margins
                    const barWidth = getBarWidth(xScale, processedData.length, width - intelligentMargins.left - intelligentMargins.right);
                    const barX = getBarPosition(xScale, d.label, barWidth);
                    return `translate(${barX}, 0)`;
                }
            });

        if (stacked) {
            drawStackedBars(barGroupsUpdate, xScale, yScale, intelligentMargins);
        } else {
            drawWaterfallBars(barGroupsUpdate, xScale, yScale, intelligentMargins, processedData);
        }

        // Add value labels
        drawValueLabels(barGroupsUpdate, xScale, yScale, intelligentMargins);

        barGroups.exit()
            .transition()
            .duration(duration)
            .ease(ease)
            .style("opacity", 0)
            .remove();
    }

    function drawStackedBars(barGroups: any, xScale: any, yScale: any, intelligentMargins: MarginConfig): void {
        barGroups.each(function(this: SVGGElement, d: any) {
            const group = d3.select(this);
            const stackData = d.stacks.map((stack: any, i: number) => ({
                ...stack,
                stackIndex: i,
                parent: d
            }));

            // Calculate stack positions
            let cumulativeHeight = d.prevCumulativeTotal || 0;
            stackData.forEach((stack: any) => {
                stack.startY = cumulativeHeight;
                stack.endY = cumulativeHeight + stack.value;
                stack.y = yScale(Math.max(stack.startY, stack.endY));
                stack.height = Math.abs(yScale(stack.startY) - yScale(stack.endY));
                cumulativeHeight += stack.value;
            });

            const stacks = group.selectAll(".stack").data(stackData);
            
            // Get bar width - use scale bandwidth if available, otherwise calculate using intelligent margins
            const barWidth = xScale.bandwidth ? xScale.bandwidth() : getBarWidth(xScale, barGroups.size(), width - intelligentMargins.left - intelligentMargins.right);
            
            const stacksEnter = stacks.enter()
                .append("rect")
                .attr("class", "stack")
                .attr("x", 0)
                .attr("width", barWidth)
                .attr("y", yScale(0))
                .attr("height", 0)
                .attr("fill", (stack: any) => stack.color);

            (stacksEnter as any).merge(stacks)
                .transition()
                .duration(duration)
                .ease(ease)
                .attr("y", (stack: any) => stack.y)
                .attr("height", (stack: any) => stack.height)
                .attr("fill", (stack: any) => stack.color)
                .attr("width", barWidth);

            stacks.exit()
                .transition()
                .duration(duration)
                .ease(ease)
                .attr("height", 0)
                .attr("y", yScale(0))
                .remove();

            // Add stack labels if they exist
            const stackLabels = group.selectAll(".stack-label").data(stackData.filter((s: any) => s.label));
            
            const stackLabelsEnter = stackLabels.enter()
                .append("text")
                .attr("class", "stack-label")
                .attr("text-anchor", "middle")
                .attr("x", barWidth / 2)
                .attr("y", yScale(0))
                .style("opacity", 0);

            (stackLabelsEnter as any).merge(stackLabels)
                .transition()
                .duration(duration)
                .ease(ease)
                .attr("y", (stack: any) => stack.y + stack.height / 2 + 4)
                .attr("x", barWidth / 2)
                .style("opacity", 1)
                .text((stack: any) => stack.label);

            stackLabels.exit()
                .transition()
                .duration(duration)
                .ease(ease)
                .style("opacity", 0)
                .remove();
        });
    }

    function drawWaterfallBars(barGroups: any, xScale: any, yScale: any, intelligentMargins: MarginConfig, allData: ProcessedData[] = []): void {
        barGroups.each(function(this: SVGGElement, d: any) {
            const group = d3.select(this);
            
            // Get bar width - use scale bandwidth if available, otherwise calculate using intelligent margins
            const barWidth = xScale.bandwidth ? xScale.bandwidth() : getBarWidth(xScale, barGroups.size(), width - intelligentMargins.left - intelligentMargins.right);
            
            // Determine bar color using advanced color features
            const defaultColor = d.stacks.length === 1 ? d.stacks[0].color : "#3498db";
            const advancedColor = advancedColorConfig.enabled ? 
                getAdvancedBarColor(
                    d.barTotal, 
                    defaultColor, 
                    allData, 
                    advancedColorConfig.themeName as keyof ThemeCollection || 'default',
                    colorMode
                ) : defaultColor;
            
            const barData = [{
                value: d.barTotal,
                color: advancedColor,
                y: d.isTotal ? 
                    Math.min(yScale(0), yScale(d.cumulativeTotal)) : // Total bar: position correctly regardless of scale direction
                    yScale(Math.max(d.prevCumulativeTotal, d.cumulativeTotal)),
                height: d.isTotal ? 
                    Math.abs(yScale(0) - yScale(d.cumulativeTotal)) : // Total bar: full height from zero to total
                    Math.abs(yScale(d.prevCumulativeTotal || 0) - yScale(d.cumulativeTotal)),
                parent: d
            }];

            const bars = group.selectAll(".waterfall-bar").data(barData);
            
            const barsEnter = bars.enter()
                .append("rect")
                .attr("class", "waterfall-bar")
                .attr("x", 0)
                .attr("width", barWidth)
                .attr("y", yScale(0))
                .attr("height", 0)
                .attr("fill", (bar: any) => bar.color);

            (barsEnter as any).merge(bars)
                .transition()
                .duration(duration)
                .ease(ease)
                .attr("y", (bar: any) => bar.y)
                .attr("height", (bar: any) => bar.height)
                .attr("fill", (bar: any) => bar.color)
                .attr("width", barWidth);

            bars.exit()
                .transition()
                .duration(duration)
                .ease(ease)
                .attr("height", 0)
                .attr("y", yScale(0))
                .remove();
        });
    }

    function drawValueLabels(barGroups: any, xScale: any, yScale: any, intelligentMargins: MarginConfig): void {
        // Always show value labels on bars - this is independent of the total bar setting
        // Drawing value labels

        barGroups.each(function(this: SVGGElement, d: any) {
            const group = d3.select(this);
            const barWidth = getBarWidth(xScale, barGroups.size(), width - intelligentMargins.left - intelligentMargins.right);
            
            // Processing label for bar
            
            const labelData = [{
                value: d.barTotal,
                formattedValue: formatNumber(d.barTotal),
                parent: d
            }];

            const totalLabels = group.selectAll(".total-label").data(labelData);
            
            const totalLabelsEnter = totalLabels.enter()
                .append("text")
                .attr("class", "total-label")
                .attr("text-anchor", "middle")
                .attr("x", barWidth / 2)
                .attr("y", yScale(0))
                .style("opacity", 0)
                .style("font-family", "Arial, sans-serif"); // Ensure font is set

            const labelUpdate = (totalLabelsEnter as any).merge(totalLabels);
            
            labelUpdate
                .transition()
                .duration(duration)
                .ease(ease)
                .attr("y", (labelD: any) => {
                    const barTop = yScale(labelD.parent.cumulativeTotal);
                    const padding = 8;
                    const finalY = barTop - padding;
                    
                    // Label positioning calculated
                    
                    return finalY;
                })
                .attr("x", barWidth / 2)
                .style("opacity", 1)
                .style("fill", "#333")
                .style("font-weight", "bold")
                .style("font-size", "14px")
                .style("pointer-events", "none")
                .style("visibility", "visible") // Ensure visibility
                .style("display", "block") // Ensure display
                .attr("clip-path", "none") // Remove any clipping from labels themselves
                .text((labelD: any) => labelD.formattedValue)
                .each(function(this: SVGTextElement, labelD: any) {
                    // Label element created
                });

            totalLabels.exit()
                .transition()
                .duration(duration)
                .ease(ease)
                .style("opacity", 0)
                .remove();
        });
    }

    function drawConnectors(container: any, processedData: ProcessedData[], xScale: any, yScale: any): void {
        if (stacked || processedData.length < 2) return; // Only show connectors for waterfall charts

        const connectorsGroup = container.selectAll(".connectors-group").data([0]);
        const connectorsGroupEnter = connectorsGroup.enter()
            .append("g")
            .attr("class", "connectors-group");
        const connectorsGroupUpdate = connectorsGroupEnter.merge(connectorsGroup);

        // Create connector data
        const connectorData: any[] = [];
        for (let i = 0; i < processedData.length - 1; i++) {
            const current = processedData[i];
            const next = processedData[i + 1];
            
            const barWidth = getBarWidth(xScale, processedData.length, width - margin.left - margin.right);
            const currentX = getBarPosition(xScale, current.label, barWidth);
            const nextX = getBarPosition(xScale, next.label, barWidth);
            
            connectorData.push({
                x1: currentX + barWidth,
                x2: nextX,
                y: yScale(current.cumulativeTotal),
                id: `${current.label}-${next.label}`
            });
        }

        // Create/update connector lines
        const connectors = connectorsGroupUpdate.selectAll(".connector").data(connectorData, (d: any) => d.id);
        
        const connectorsEnter = connectors.enter()
            .append("line")
            .attr("class", "connector")
            .attr("stroke", "#bdc3c7")
            .attr("stroke-width", 1)
            .attr("stroke-dasharray", "3,3")
            .style("opacity", 0)
            .attr("x1", (d: any) => d.x1)
            .attr("x2", (d: any) => d.x1)
            .attr("y1", (d: any) => d.y)
            .attr("y2", (d: any) => d.y);

        connectorsEnter.merge(connectors)
            .transition()
            .duration(duration)
            .ease(ease)
            .delay((d: any, i: number) => staggeredAnimations ? i * staggerDelay : 0)
            .attr("x1", (d: any) => d.x1)
            .attr("x2", (d: any) => d.x2)
            .attr("y1", (d: any) => d.y)
            .attr("y2", (d: any) => d.y)
            .style("opacity", 0.6);

        connectors.exit()
            .transition()
            .duration(duration)
            .ease(ease)
            .style("opacity", 0)
            .remove();
    }

    function drawTrendLine(container: any, processedData: ProcessedData[], xScale: any, yScale: any): void {
        // Remove trend line if disabled or insufficient data
        if (!showTrendLine || processedData.length < 2) {
            container.selectAll(".trend-group").remove();
            return;
        }

        const trendGroup = container.selectAll(".trend-group").data([0]);
        const trendGroupEnter = trendGroup.enter()
            .append("g")
            .attr("class", "trend-group");
        const trendGroupUpdate = trendGroupEnter.merge(trendGroup);

        // Calculate trend line data points based on trend type
        const trendData: { x: number; y: number }[] = [];
        
        // First, collect the actual data points
        const dataPoints: { x: number; y: number; value: number }[] = [];
        for (let i = 0; i < processedData.length; i++) {
            const item = processedData[i];
            const barWidth = getBarWidth(xScale, processedData.length, width - margin.left - margin.right);
            const x = getBarPosition(xScale, item.label, barWidth) + barWidth / 2;
            const actualY = yScale(item.cumulativeTotal);
            dataPoints.push({ x, y: actualY, value: item.cumulativeTotal });
        }
        
        // Calculate trend based on type
        if (trendLineType === "linear") {
            // Linear regression
            const n = dataPoints.length;
            const sumX = dataPoints.reduce((sum, p, i) => sum + i, 0);
            const sumY = dataPoints.reduce((sum, p) => sum + p.value, 0);
            const sumXY = dataPoints.reduce((sum, p, i) => sum + (i * p.value), 0);
            const sumXX = dataPoints.reduce((sum, p, i) => sum + (i * i), 0);
            
            const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
            const intercept = (sumY - slope * sumX) / n;
            
            dataPoints.forEach((point, i) => {
                const trendValue = slope * i + intercept;
                trendData.push({ x: point.x, y: yScale(trendValue) });
            });
        } else if (trendLineType === "moving-average") {
            // Moving average with configurable window
            const window = trendLineWindow;
            for (let i = 0; i < dataPoints.length; i++) {
                const start = Math.max(0, i - Math.floor(window / 2));
                const end = Math.min(dataPoints.length, start + window);
                const windowData = dataPoints.slice(start, end);
                const average = windowData.reduce((sum, p) => sum + p.value, 0) / windowData.length;
                trendData.push({ x: dataPoints[i].x, y: yScale(average) });
            }
        } else if (trendLineType === "polynomial") {
            // Simplified polynomial trend using D3's curve interpolation
            const n = dataPoints.length;
            
            if (n >= 3) {
                // Use a simple approach: create a smooth curve using D3's cardinal interpolation
                // and add some curvature based on the degree setting
                const curvature = trendLineDegree / 10; // Convert degree to curvature factor
                
                // Create control points for polynomial-like curve
                for (let i = 0; i < n; i++) {
                    const point = dataPoints[i];
                    let adjustedY = point.value;
                    
                    // Add polynomial-like adjustment based on position
                    if (n > 2) {
                        const t = i / (n - 1); // Normalize position 0-1
                        const mid = 0.5;
                        
                        // Create a curved adjustment based on distance from middle
                        const distFromMid = Math.abs(t - mid);
                        const curveFactor = Math.sin(t * Math.PI) * curvature;
                        
                        // Apply curve adjustment to create polynomial-like behavior
                        const avgValue = dataPoints.reduce((sum, p) => sum + p.value, 0) / n;
                        adjustedY = point.value + (point.value - avgValue) * curveFactor * 0.5;
                    }
                    
                    trendData.push({ x: point.x, y: yScale(adjustedY) });
                }
            } else {
                // Not enough points for polynomial, use linear
                dataPoints.forEach(point => {
                    trendData.push({ x: point.x, y: point.y });
                });
            }
        } else {
            // Default to connecting actual points
            dataPoints.forEach(point => {
                trendData.push({ x: point.x, y: point.y });
            });
        }

        // Create line generator with appropriate curve type
        const line = d3.line<{ x: number; y: number }>()
            .x(d => d.x)
            .y(d => d.y)
            .curve(trendLineType === "polynomial" ? d3.curveCardinal : 
                   trendLineType === "moving-average" ? d3.curveMonotoneX : 
                   d3.curveLinear);

        // Create/update trend line
        const trendLine = trendGroupUpdate.selectAll(".trend-line").data([trendData]);
        
        const trendLineEnter = trendLine.enter()
            .append("path")
            .attr("class", "trend-line")
            .attr("fill", "none")
            .attr("stroke", trendLineColor)
            .attr("stroke-width", trendLineWidth)
            .attr("stroke-opacity", trendLineOpacity)
            .style("opacity", 0);

        // Apply stroke-dasharray based on style
        function applyStrokeStyle(selection: any) {
            if (trendLineStyle === "dashed") {
                selection.attr("stroke-dasharray", "5,5");
            } else if (trendLineStyle === "dotted") {
                selection.attr("stroke-dasharray", "2,3");
            } else {
                selection.attr("stroke-dasharray", null);
            }
        }

        applyStrokeStyle(trendLineEnter);

        const updatedTrendLine = trendLineEnter.merge(trendLine);
        applyStrokeStyle(updatedTrendLine);
        
        updatedTrendLine
            .transition()
            .duration(duration)
            .ease(ease)
            .attr("d", line)
            .attr("stroke", trendLineColor)
            .attr("stroke-width", trendLineWidth)
            .attr("stroke-opacity", trendLineOpacity)
            .style("opacity", 1);

        trendLine.exit()
            .transition()
            .duration(duration)
            .ease(ease)
            .style("opacity", 0)
            .remove();
    }

    function addBrushSelection(container: any, processedData: ProcessedData[], xScale: any, yScale: any): void {
        // Stub: would add brush interaction if enabled
    }

    function initializeAccessibility(svg: any, processedData: ProcessedData[]): void {
        if (!enableAccessibility) return;

        // Add ARIA attributes to the SVG
        svg.attr("role", "img")
           .attr("aria-label", `Waterfall chart with ${processedData.length} data points`);

        // Add title and description for screen readers
        const title = svg.selectAll("title").data([0]);
        title.enter()
            .append("title")
            .merge(title)
            .text(`Waterfall chart showing ${stacked ? 'stacked' : 'sequential'} data visualization`);

        const desc = svg.selectAll("desc").data([0]);
        desc.enter()
            .append("desc")
            .merge(desc)
            .text(() => {
                const totalValue = processedData[processedData.length - 1]?.cumulativeTotal || 0;
                return `Chart contains ${processedData.length} data points. ` +
                       `Final cumulative value: ${formatNumber(totalValue)}. ` +
                       `Data ranges from ${processedData[0]?.label} to ${processedData[processedData.length - 1]?.label}.`;
            });

        // Add keyboard navigation
        svg.attr("tabindex", "0")
           .on("keydown", function(event: KeyboardEvent) {
               const focusedElement = svg.select(".focused");
               const allBars = svg.selectAll(".waterfall-bar, .stack");
               const currentIndex = allBars.nodes().indexOf(focusedElement.node());

               switch(event.key) {
                   case "ArrowRight":
                   case "ArrowDown":
                       event.preventDefault();
                       const nextIndex = Math.min(currentIndex + 1, allBars.size() - 1);
                       focusBar(allBars, nextIndex);
                       break;
                   case "ArrowLeft":
                   case "ArrowUp":
                       event.preventDefault();
                       const prevIndex = Math.max(currentIndex - 1, 0);
                       focusBar(allBars, prevIndex);
                       break;
                   case "Home":
                       event.preventDefault();
                       focusBar(allBars, 0);
                       break;
                   case "End":
                       event.preventDefault();
                       focusBar(allBars, allBars.size() - 1);
                       break;
               }
           });

        // Helper function to focus a bar
        function focusBar(allBars: any, index: number) {
            allBars.classed("focused", false);
            const targetBar = d3.select(allBars.nodes()[index]);
            targetBar.classed("focused", true);
            
            // Announce the focused element
            const data = targetBar.datum() as any;
            const announcement = `${data.parent?.label || data.label}: ${formatNumber(data.value || data.barTotal)}`;
            announceToScreenReader(announcement);
        }

        // Screen reader announcements
        function announceToScreenReader(message: string) {
            const announcement = d3.select("body").selectAll(".sr-announcement").data([0]);
            const announcementEnter = announcement.enter()
                .append("div")
                .attr("class", "sr-announcement")
                .attr("aria-live", "polite")
                .attr("aria-atomic", "true")
                .style("position", "absolute")
                .style("left", "-10000px")
                .style("width", "1px")
                .style("height", "1px")
                .style("overflow", "hidden");

            (announcementEnter as any).merge(announcement)
                .text(message);
        }

        // Add focus styles
        const style = svg.selectAll("style.accessibility-styles").data([0]);
        style.enter()
            .append("style")
            .attr("class", "accessibility-styles")
            .merge(style)
            .text(`
                .focused {
                    stroke: #0066cc !important;
                    stroke-width: 3px !important;
                    filter: brightness(1.1);
                }
                .waterfall-bar:focus,
                .stack:focus {
                    outline: 2px solid #0066cc;
                    outline-offset: 2px;
                }
            `);
    }

    function initializeTooltips(svg: any): void {
        if (!enableTooltips) return;
        
        // Initialize the tooltip system
        const tooltip = tooltipSystem;
        
        // Configure tooltip theme
        tooltip.configure(tooltipConfig);
        
        // Add tooltip events to all chart elements
        svg.selectAll(".waterfall-bar, .stack")
            .on("mouseover", function(this: SVGElement, event: MouseEvent, d: any) {
                const element = d3.select(this);
                const data = d.parent || d; // Handle both stacked and waterfall bars
                
                // Create tooltip content
                const content = `
                    <div style="font-weight: bold; margin-bottom: 8px;">${data.label}</div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                        <span>Value:</span>
                        <span style="font-weight: bold;">${formatNumber(d.value || data.barTotal)}</span>
                    </div>
                    ${data.cumulativeTotal !== undefined ? `
                    <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                        <span>Cumulative:</span>
                        <span style="font-weight: bold;">${formatNumber(data.cumulativeTotal)}</span>
                    </div>
                    ` : ''}
                    ${d.label && d.label !== data.label ? `
                    <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.3);">
                        <div style="font-size: 11px; opacity: 0.8;">${d.label}</div>
                    </div>
                    ` : ''}
                `;
                
                // Show tooltip
                tooltip.show(content, event, {
                    label: data.label,
                    value: d.value || data.barTotal,
                    cumulative: data.cumulativeTotal,
                    color: d.color || (data.stacks && data.stacks[0] ? data.stacks[0].color : '#3498db'),
                    x: parseFloat(element.attr("x") || "0"),
                    y: parseFloat(element.attr("y") || "0"),
                    quadrant: 1
                });
                
                // Highlight element
                element.style("opacity", 0.8);
            })
            .on("mousemove", function(this: SVGElement, event: MouseEvent) {
                tooltip.move(event);
            })
            .on("mouseout", function(this: SVGElement) {
                // Hide tooltip
                tooltip.hide();
                
                // Remove highlight
                d3.select(this).style("opacity", null);
            });
            
        // Also add tooltips to value labels
        svg.selectAll(".total-label")
            .on("mouseover", function(this: SVGElement, event: MouseEvent, d: any) {
                const data = d.parent;
                
                const content = `
                    <div style="font-weight: bold; margin-bottom: 8px;">${data.label}</div>
                    <div style="display: flex; justify-content: space-between;">
                        <span>Total Value:</span>
                        <span style="font-weight: bold;">${formatNumber(data.barTotal)}</span>
                    </div>
                `;
                
                tooltip.show(content, event, {
                    label: data.label,
                    value: data.barTotal,
                    cumulative: data.cumulativeTotal,
                    color: '#333',
                    x: 0,
                    y: 0,
                    quadrant: 1
                });
            })
            .on("mousemove", function(this: SVGElement, event: MouseEvent) {
                tooltip.move(event);
            })
            .on("mouseout", function(this: SVGElement) {
                tooltip.hide();
            });
    }

    function initializeExport(svg: any, processedData: ProcessedData[]): void {
        // Stub: would initialize export functionality
    }

    function initializeZoom(svgContainer: any, config: { width: number; height: number; margin: MarginConfig }): void {
        // Stub: would initialize zoom functionality
    }

    // Getter/setter methods using TypeScript
    chart.width = function(_?: number): number | WaterfallChart {
        return arguments.length ? (width = _!, chart) : width;
    } as any;

    chart.height = function(_?: number): number | WaterfallChart {
        return arguments.length ? (height = _!, chart) : height;
    } as any;

    chart.margin = function(_?: MarginConfig): MarginConfig | WaterfallChart {
        return arguments.length ? (margin = _!, chart) : margin;
    } as any;

    chart.stacked = function(_?: boolean): boolean | WaterfallChart {
        return arguments.length ? (stacked = _!, chart) : stacked;
    } as any;

    chart.showTotal = function(_?: boolean): boolean | WaterfallChart {
        return arguments.length ? (showTotal = _!, chart) : showTotal;
    } as any;

    chart.totalLabel = function(_?: string): string | WaterfallChart {
        return arguments.length ? (totalLabel = _!, chart) : totalLabel;
    } as any;

    chart.totalColor = function(_?: string): string | WaterfallChart {
        return arguments.length ? (totalColor = _!, chart) : totalColor;
    } as any;

    chart.barPadding = function(_?: number): number | WaterfallChart {
        return arguments.length ? (barPadding = _!, chart) : barPadding;
    } as any;

    chart.duration = function(_?: number): number | WaterfallChart {
        return arguments.length ? (duration = _!, chart) : duration;
    } as any;

    chart.ease = function(_?: (t: number) => number): ((t: number) => number) | WaterfallChart {
        return arguments.length ? (ease = _!, chart) : ease;
    } as any;

    chart.formatNumber = function(_?: (n: number) => string): ((n: number) => string) | WaterfallChart {
        return arguments.length ? (formatNumber = _!, chart) : formatNumber;
    } as any;

    chart.theme = function(_?: string | null): (string | null) | WaterfallChart {
        return arguments.length ? (theme = _!, chart) : theme;
    } as any;

    chart.enableBrush = function(_?: boolean): boolean | WaterfallChart {
        return arguments.length ? (enableBrush = _!, chart) : enableBrush;
    } as any;

    chart.brushOptions = function(_?: BrushOptions): BrushOptions | WaterfallChart {
        return arguments.length ? (brushOptions = { ...brushOptions, ..._! }, chart) : brushOptions;
    } as any;

    chart.staggeredAnimations = function(_?: boolean): boolean | WaterfallChart {
        return arguments.length ? (staggeredAnimations = _!, chart) : staggeredAnimations;
    } as any;

    chart.staggerDelay = function(_?: number): number | WaterfallChart {
        return arguments.length ? (staggerDelay = _!, chart) : staggerDelay;
    } as any;

    chart.scaleType = function(_?: string): string | WaterfallChart {
        return arguments.length ? (scaleType = _!, chart) : scaleType;
    } as any;

    chart.showTrendLine = function(_?: boolean): boolean | WaterfallChart {
        return arguments.length ? (showTrendLine = _!, chart) : showTrendLine;
    } as any;

    chart.trendLineColor = function(_?: string): string | WaterfallChart {
        return arguments.length ? (trendLineColor = _!, chart) : trendLineColor;
    } as any;

    chart.trendLineWidth = function(_?: number): number | WaterfallChart {
        return arguments.length ? (trendLineWidth = _!, chart) : trendLineWidth;
    } as any;

    chart.trendLineStyle = function(_?: string): string | WaterfallChart {
        return arguments.length ? (trendLineStyle = _!, chart) : trendLineStyle;
    } as any;

    chart.trendLineOpacity = function(_?: number): number | WaterfallChart {
        return arguments.length ? (trendLineOpacity = _!, chart) : trendLineOpacity;
    } as any;

    chart.trendLineType = function(_?: string): string | WaterfallChart {
        return arguments.length ? (trendLineType = _!, chart) : trendLineType;
    } as any;

    chart.trendLineWindow = function(_?: number): number | WaterfallChart {
        return arguments.length ? (trendLineWindow = _!, chart) : trendLineWindow;
    } as any;

    chart.trendLineDegree = function(_?: number): number | WaterfallChart {
        return arguments.length ? (trendLineDegree = _!, chart) : trendLineDegree;
    } as any;

    chart.enableAccessibility = function(_?: boolean): boolean | WaterfallChart {
        return arguments.length ? (enableAccessibility = _!, chart) : enableAccessibility;
    } as any;

    chart.enableTooltips = function(_?: boolean): boolean | WaterfallChart {
        return arguments.length ? (enableTooltips = _!, chart) : enableTooltips;
    } as any;

    chart.tooltipConfig = function(_?: TooltipConfig): TooltipConfig | WaterfallChart {
        return arguments.length ? (tooltipConfig = { ...tooltipConfig, ..._ }, chart) : tooltipConfig;
    } as any;

    chart.enableExport = function(_?: boolean): boolean | WaterfallChart {
        return arguments.length ? (enableExport = _!, chart) : enableExport;
    } as any;

    chart.exportConfig = function(_?: ExportConfig): ExportConfig | WaterfallChart {
        return arguments.length ? (exportConfig = { ...exportConfig, ..._ }, chart) : exportConfig;
    } as any;

    chart.enableZoom = function(_?: boolean): boolean | WaterfallChart {
        return arguments.length ? (enableZoom = _!, chart) : enableZoom;
    } as any;

    chart.zoomConfig = function(_?: ZoomConfig): ZoomConfig | WaterfallChart {
        return arguments.length ? (zoomConfig = { ...zoomConfig, ..._ }, chart) : zoomConfig;
    } as any;

    chart.breakdownConfig = function(_?: BreakdownConfig | null): (BreakdownConfig | null) | WaterfallChart {
        return arguments.length ? (breakdownConfig = _!, chart) : breakdownConfig;
    } as any;

    chart.enablePerformanceOptimization = function(_?: boolean): boolean | WaterfallChart {
        return arguments.length ? (enablePerformanceOptimization = _!, chart) : enablePerformanceOptimization;
    } as any;

    chart.performanceDashboard = function(_?: boolean): boolean | WaterfallChart {
        return arguments.length ? (performanceDashboard = _!, chart) : performanceDashboard;
    } as any;

    chart.virtualizationThreshold = function(_?: number): number | WaterfallChart {
        return arguments.length ? (virtualizationThreshold = _!, chart) : virtualizationThreshold;
    } as any;

    // Data method for API completeness
    chart.data = function(_?: ChartData[]): ChartData[] | WaterfallChart {
        // This method is for API completeness - actual data is passed to the chart function
        // Always return the chart instance for method chaining
        return chart;
    } as any;

    // NEW: Advanced color and shape feature methods
    chart.advancedColors = function(_?: AdvancedColorConfig): AdvancedColorConfig | WaterfallChart {
        return arguments.length ? (advancedColorConfig = { ...advancedColorConfig, ..._! }, chart) : advancedColorConfig;
    } as any;

    chart.enableAdvancedColors = function(_?: boolean): boolean | WaterfallChart {
        return arguments.length ? (advancedColorConfig.enabled = _!, chart) : advancedColorConfig.enabled;
    } as any;

    chart.colorScaleType = function(_?: 'auto' | 'sequential' | 'diverging' | 'conditional'): 'auto' | 'sequential' | 'diverging' | 'conditional' | WaterfallChart {
        return arguments.length ? (advancedColorConfig.scaleType = _!, chart) : advancedColorConfig.scaleType;
    } as any;
    
    // NEW: Additional advanced color methods
    chart.colorMode = function(_?: 'default' | 'conditional' | 'sequential' | 'diverging'): 'default' | 'conditional' | 'sequential' | 'diverging' | WaterfallChart {
        return arguments.length ? (colorMode = _!, chart) : colorMode;
    } as any;
    
    chart.colorTheme = function(_?: string): string | WaterfallChart {
        return arguments.length ? (advancedColorConfig.themeName = _!, chart) : (advancedColorConfig.themeName || 'default');
    } as any;
    
    chart.neutralThreshold = function(_?: number): number | WaterfallChart {
        return arguments.length ? (advancedColorConfig.neutralThreshold = _!, chart) : (advancedColorConfig.neutralThreshold || 0);
    } as any;

    chart.confidenceBands = function(_?: ConfidenceBandConfig): ConfidenceBandConfig | WaterfallChart {
        return arguments.length ? (confidenceBandConfig = { ...confidenceBandConfig, ..._! }, chart) : confidenceBandConfig;
    } as any;

    chart.enableConfidenceBands = function(_?: boolean): boolean | WaterfallChart {
        return arguments.length ? (confidenceBandConfig.enabled = _!, chart) : confidenceBandConfig.enabled;
    } as any;

    chart.milestones = function(_?: MilestoneConfig): MilestoneConfig | WaterfallChart {
        return arguments.length ? (milestoneConfig = { ...milestoneConfig, ..._! }, chart) : milestoneConfig;
    } as any;

    chart.enableMilestones = function(_?: boolean): boolean | WaterfallChart {
        return arguments.length ? (milestoneConfig.enabled = _!, chart) : milestoneConfig.enabled;
    } as any;

    chart.addMilestone = function(milestone: {label: string, value: number, type: 'target' | 'threshold' | 'alert' | 'achievement', description?: string}): WaterfallChart {
        milestoneConfig.milestones.push(milestone);
        return chart;
    } as any;

    // Event handling methods
    chart.on = function(): any {
        const value = (listeners.on as any).apply(listeners, Array.from(arguments));
        return value === listeners ? chart : value;
    };

    // NEW: Advanced feature rendering functions
    function drawConfidenceBands(container: any, processedData: ProcessedData[], xScale: any, yScale: any): void {
        if (!confidenceBandConfig.enabled || !confidenceBandConfig.scenarios) return;

        // Create confidence bands group
        const confidenceGroup = container.selectAll(".confidence-bands-group").data([0]);
        const confidenceGroupEnter = confidenceGroup.enter()
            .append("g")
            .attr("class", "confidence-bands-group");

        const confidenceGroupUpdate = confidenceGroupEnter.merge(confidenceGroup);

        // Generate confidence band data using the waterfall-specific utility
        const confidenceBandData = createWaterfallConfidenceBands(
            processedData.map(d => ({ label: d.label, value: d.barTotal })),
            confidenceBandConfig.scenarios,
            xScale,
            yScale
        );

        // Render confidence band
        const confidencePath = confidenceGroupUpdate.selectAll(".confidence-band").data([confidenceBandData.confidencePath]);
        
        const confidencePathEnter = confidencePath.enter()
            .append("path")
            .attr("class", "confidence-band")
            .attr("fill", `rgba(52, 152, 219, ${confidenceBandConfig.opacity || 0.3})`)
            .attr("stroke", "none")
            .style("opacity", 0);

        confidencePathEnter.merge(confidencePath)
            .transition()
            .duration(duration)
            .ease(ease)
            .attr("d", confidenceBandData.confidencePath)
            .style("opacity", 1);

        // Render trend lines if enabled
        if (confidenceBandConfig.showTrendLines) {
            // Optimistic trend line
            const optimisticPath = confidenceGroupUpdate.selectAll(".optimistic-trend").data([confidenceBandData.optimisticPath]);
            
            const optimisticPathEnter = optimisticPath.enter()
                .append("path")
                .attr("class", "optimistic-trend")
                .attr("fill", "none")
                .attr("stroke", "#27ae60")
                .attr("stroke-width", 2)
                .attr("stroke-dasharray", "5,5")
                .style("opacity", 0);

            optimisticPathEnter.merge(optimisticPath)
                .transition()
                .duration(duration)
                .ease(ease)
                .attr("d", confidenceBandData.optimisticPath)
                .style("opacity", 0.8);

            // Pessimistic trend line
            const pessimisticPath = confidenceGroupUpdate.selectAll(".pessimistic-trend").data([confidenceBandData.pessimisticPath]);
            
            const pessimisticPathEnter = pessimisticPath.enter()
                .append("path")
                .attr("class", "pessimistic-trend")
                .attr("fill", "none")
                .attr("stroke", "#e74c3c")
                .attr("stroke-width", 2)
                .attr("stroke-dasharray", "5,5")
                .style("opacity", 0);

            pessimisticPathEnter.merge(pessimisticPath)
                .transition()
                .duration(duration)
                .ease(ease)
                .attr("d", confidenceBandData.pessimisticPath)
                .style("opacity", 0.8);
        }

        // Remove old elements
        confidencePath.exit()
            .transition()
            .duration(duration)
            .style("opacity", 0)
            .remove();
    }

    function drawMilestones(container: any, processedData: ProcessedData[], xScale: any, yScale: any): void {
        if (!milestoneConfig.enabled || milestoneConfig.milestones.length === 0) return;

        // Create milestones group
        const milestonesGroup = container.selectAll(".milestones-group").data([0]);
        const milestonesGroupEnter = milestonesGroup.enter()
            .append("g")
            .attr("class", "milestones-group");

        const milestonesGroupUpdate = milestonesGroupEnter.merge(milestonesGroup);

        // Generate milestone markers using the waterfall-specific utility
        const milestoneMarkers = createWaterfallMilestones(
            milestoneConfig.milestones,
            xScale,
            yScale
        );

        // Render milestone markers
        const markers = milestonesGroupUpdate.selectAll(".milestone-marker").data(milestoneMarkers);
        
        const markersEnter = markers.enter()
            .append("path")
            .attr("class", "milestone-marker")
            .attr("transform", (d: any) => d.transform)
            .attr("d", (d: any) => d.path)
            .attr("fill", (d: any) => d.config.fillColor || "#f39c12")
            .attr("stroke", (d: any) => d.config.strokeColor || "#ffffff")
            .attr("stroke-width", (d: any) => d.config.strokeWidth || 2)
            .style("opacity", 0);

        markersEnter.merge(markers)
            .transition()
            .duration(duration)
            .ease(ease)
            .attr("transform", (d: any) => d.transform)
            .attr("d", (d: any) => d.path)
            .attr("fill", (d: any) => d.config.fillColor || "#f39c12")
            .style("opacity", 1);

        // Remove old markers
        markers.exit()
            .transition()
            .duration(duration)
            .style("opacity", 0)
            .remove();
    }

    return chart as WaterfallChart;
}
