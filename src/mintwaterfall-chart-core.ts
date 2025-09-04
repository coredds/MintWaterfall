// MintWaterfall Chart - TypeScript Core Module (Gradual Migration)
// This is the first module converted as part of gradual migration strategy

import * as d3 from 'd3';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

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
}

export interface MarginConfig {
    top: number;
    right: number;
    bottom: number;
    left: number;
}

export interface WaterfallChartConfig {
    width: number;
    height: number;
    margin: MarginConfig;
    showTotal: boolean;
    totalLabel: string;
    totalColor: string;
    stacked: boolean;
    barPadding: number;
    duration: number;
    formatNumber: (n: number) => string;
}

// ============================================================================
// MAIN CHART FACTORY FUNCTION
// ============================================================================

export function waterfallChart() {
    // Configuration with defaults
    let config: WaterfallChartConfig = {
        width: 800,
        height: 400,
        margin: { top: 60, right: 80, bottom: 60, left: 80 },
        showTotal: false,
        totalLabel: "Total",
        totalColor: "#95A5A6",
        stacked: true,
        barPadding: 0.1,
        duration: 750,
        formatNumber: d3.format(".0f")
    };

    // Cache for performance
    let lastDataHash: string | null = null;
    let cachedProcessedData: ProcessedData[] | null = null;

    function chart(selection: d3.Selection<any, any, any, any>): void {
        selection.each(function(data: ChartData[]) {
            // Basic data validation
            if (!data || !Array.isArray(data) || data.length === 0) {
                console.warn("MintWaterfall: Invalid or empty data provided");
                return;
            }

            // Process data
            const processedData = prepareData(data);
            
            // Render chart
            renderChart(d3.select(this), processedData);
        });
    }

    // ========================================================================
    // CORE PROCESSING FUNCTIONS
    // ========================================================================

    function prepareData(data: ChartData[]): ProcessedData[] {
        // Quick hash for caching
        const dataHash = JSON.stringify(data).slice(0, 100) + config.showTotal.toString();
        
        if (dataHash === lastDataHash && cachedProcessedData) {
            return cachedProcessedData;
        }

        let cumulativeTotal = 0;
        const processedData: ProcessedData[] = data.map((item, i) => {
            const barTotal = item.stacks.reduce((sum, stack) => sum + stack.value, 0);
            const prevCumulativeTotal = cumulativeTotal;
            cumulativeTotal += barTotal;

            return {
                ...item,
                barTotal,
                cumulativeTotal,
                prevCumulativeTotal: i === 0 ? 0 : prevCumulativeTotal
            };
        });

        // Add total bar if enabled
        if (config.showTotal && processedData.length > 0) {
            processedData.push({
                label: config.totalLabel,
                stacks: [{ value: cumulativeTotal, color: config.totalColor }],
                barTotal: cumulativeTotal,
                cumulativeTotal,
                prevCumulativeTotal: 0
            });
        }

        // Cache results
        lastDataHash = dataHash;
        cachedProcessedData = processedData;

        return processedData;
    }

    function renderChart(svg: d3.Selection<any, any, any, any>, data: ProcessedData[]): void {
        // Clear previous content
        svg.selectAll("*").remove();

        // Calculate dimensions
        const { width, height, margin } = config;
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        // Create main container
        const g = svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // Set up scales
        const xScale = d3.scaleBand()
            .domain(data.map(d => d.label))
            .range([0, innerWidth])
            .padding(config.barPadding);

        const yExtent = d3.extent(data, d => d.cumulativeTotal) as [number, number];
        const yScale = d3.scaleLinear()
            .domain([Math.min(0, yExtent[0]), yExtent[1]])
            .range([innerHeight, 0])
            .nice();

        // Create axes
        const xAxis = d3.axisBottom(xScale);
        const yAxis = d3.axisLeft(yScale).tickFormat((d: d3.NumberValue) => config.formatNumber(d.valueOf()));

        g.append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(0,${innerHeight})`)
            .call(xAxis);

        g.append("g")
            .attr("class", "y-axis")
            .call(yAxis);

        // Draw bars
        const bars = g.selectAll(".bar")
            .data(data)
            .enter().append("g")
            .attr("class", "bar")
            .attr("transform", d => `translate(${xScale(d.label)},0)`);

        if (config.stacked) {
            drawStackedBars(bars, xScale, yScale);
        } else {
            drawWaterfallBars(bars, xScale, yScale);
        }

        // Add value labels
        addValueLabels(bars, xScale, yScale);
    }

    function drawStackedBars(bars: d3.Selection<SVGGElement, ProcessedData, any, any>, 
                           xScale: d3.ScaleBand<string>, 
                           yScale: d3.ScaleLinear<number, number>): void {
        bars.each(function(d) {
            const bar = d3.select(this);
            let yPos = d.prevCumulativeTotal || 0;

            d.stacks.forEach(stack => {
                const rectHeight = Math.abs(yScale(yPos) - yScale(yPos + stack.value));
                const rectY = yScale(Math.max(yPos, yPos + stack.value));

                bar.append("rect")
                    .attr("width", xScale.bandwidth())
                    .attr("height", rectHeight)
                    .attr("y", rectY)
                    .attr("fill", stack.color)
                    .attr("stroke", "#fff")
                    .attr("stroke-width", 1);

                yPos += stack.value;
            });
        });
    }

    function drawWaterfallBars(bars: d3.Selection<SVGGElement, ProcessedData, any, any>,
                              xScale: d3.ScaleBand<string>,
                              yScale: d3.ScaleLinear<number, number>): void {
        bars.each(function(d) {
            const bar = d3.select(this);
            const startY = d.prevCumulativeTotal || 0;
            const endY = d.cumulativeTotal;
            const rectHeight = Math.abs(yScale(startY) - yScale(endY));
            const rectY = yScale(Math.max(startY, endY));

            // Use first stack color or generate based on positive/negative
            const color = d.stacks[0]?.color || (d.barTotal >= 0 ? "#2ecc71" : "#e74c3c");

            bar.append("rect")
                .attr("width", xScale.bandwidth())
                .attr("height", rectHeight)
                .attr("y", rectY)
                .attr("fill", color)
                .attr("stroke", "#fff")
                .attr("stroke-width", 1);
        });
    }

    function addValueLabels(bars: d3.Selection<SVGGElement, ProcessedData, any, any>,
                           xScale: d3.ScaleBand<string>,
                           yScale: d3.ScaleLinear<number, number>): void {
        bars.append("text")
            .attr("x", xScale.bandwidth() / 2)
            .attr("y", d => yScale(d.cumulativeTotal) - 5)
            .attr("text-anchor", "middle")
            .style("font-size", "12px")
            .style("font-family", "Arial, sans-serif")
            .text(d => config.formatNumber(d.cumulativeTotal));
    }

    // ========================================================================
    // GETTER/SETTER API (TypeScript style with proper overloads)
    // ========================================================================

    function createAccessor<T>(key: keyof WaterfallChartConfig) {
        return function(value?: T): any {
            if (arguments.length === 0) {
                return config[key];
            }
            (config as any)[key] = value;
            return chart;
        };
    }

    // Public API using accessor pattern
    chart.width = createAccessor<number>('width');
    chart.height = createAccessor<number>('height');
    chart.margin = createAccessor<MarginConfig>('margin');
    chart.showTotal = createAccessor<boolean>('showTotal');
    chart.totalLabel = createAccessor<string>('totalLabel');
    chart.totalColor = createAccessor<string>('totalColor');
    chart.stacked = createAccessor<boolean>('stacked');
    chart.barPadding = createAccessor<number>('barPadding');
    chart.duration = createAccessor<number>('duration');
    chart.formatNumber = createAccessor<(n: number) => string>('formatNumber');

    // Utility methods
    chart.config = function(): WaterfallChartConfig {
        return { ...config };
    };

    chart.reset = function() {
        lastDataHash = null;
        cachedProcessedData = null;
        return chart;
    };

    return chart;
}

// ============================================================================
// INTEGRATION WITH D3 (Temporary for gradual migration)
// ============================================================================

// Add to d3 namespace for compatibility
declare module 'd3' {
    interface D3 {
        waterfallChart(): any;
    }
}

// Extend d3 object
(d3 as any).waterfallChart = waterfallChart;
