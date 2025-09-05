// MintWaterfall Enhanced Shape Generators - TypeScript Version
// Provides advanced D3.js shape generators for waterfall chart enhancements

import * as d3 from 'd3';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface ConfidenceBandData {
    x: number;
    y: number;
    yUpper: number;
    yLower: number;
    label?: string;
}

export interface DataPointMarker {
    x: number;
    y: number;
    type: 'circle' | 'square' | 'triangle' | 'diamond' | 'star' | 'cross';
    size?: number;
    color?: string;
    label?: string;
}

export interface AreaConfig {
    curve?: d3.CurveFactory;
    opacity?: number;
    fillColor?: string;
    strokeColor?: string;
    strokeWidth?: number;
}

export interface SymbolConfig {
    type?: d3.SymbolType;
    size?: number;
    fillColor?: string;
    strokeColor?: string;
    strokeWidth?: number;
}

export interface TrendLineConfig {
    curve?: d3.CurveFactory;
    strokeColor?: string;
    strokeWidth?: number;
    strokeDasharray?: string;
    opacity?: number;
}

export interface ShapeGeneratorSystem {
    // Area generators
    createConfidenceBand(data: ConfidenceBandData[], config?: AreaConfig): string;
    createEnvelopeArea(data: Array<{x: number, y0: number, y1: number}>, config?: AreaConfig): string;
    
    // Symbol generators
    createDataPointMarkers(data: DataPointMarker[], config?: SymbolConfig): Array<{path: string, transform: string, config: SymbolConfig}>;
    createCustomSymbol(type: string, size?: number): string;
    
    // Enhanced trend lines
    createSmoothTrendLine(data: Array<{x: number, y: number}>, config?: TrendLineConfig): string;
    createMultipleTrendLines(datasets: Array<{data: Array<{x: number, y: number}>, config?: TrendLineConfig}>): string[];
    
    // Utility functions
    getCurveTypes(): { [key: string]: d3.CurveFactory };
    getSymbolTypes(): { [key: string]: d3.SymbolType };
}

// ============================================================================
// SHAPE GENERATOR IMPLEMENTATION
// ============================================================================

export function createShapeGenerators(): ShapeGeneratorSystem {
    
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
        bumpY: d3.curveBumpY
    };

    // Available symbol types for data point markers
    const symbolTypes = {
        circle: d3.symbolCircle,
        square: d3.symbolSquare,
        triangle: d3.symbolTriangle,
        diamond: d3.symbolDiamond,
        star: d3.symbolStar,
        cross: d3.symbolCross,
        wye: d3.symbolWye
    };

    // ========================================================================
    // AREA GENERATORS
    // ========================================================================

    /**
     * Create confidence band area for uncertainty visualization
     * Perfect for showing confidence intervals around waterfall projections
     */
    function createConfidenceBand(data: ConfidenceBandData[], config: AreaConfig = {}): string {
        const {
            curve = d3.curveMonotoneX,
            opacity = 0.3,
            fillColor = "#95a5a6"
        } = config;

        const areaGenerator = d3.area<ConfidenceBandData>()
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
    function createEnvelopeArea(
        data: Array<{x: number, y0: number, y1: number}>, 
        config: AreaConfig = {}
    ): string {
        const {
            curve = d3.curveMonotoneX
        } = config;

        const areaGenerator = d3.area<{x: number, y0: number, y1: number}>()
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
    function createDataPointMarkers(
        data: DataPointMarker[], 
        config: SymbolConfig = {}
    ): Array<{path: string, transform: string, config: SymbolConfig}> {
        const {
            size = 64,
            fillColor = "#3498db",
            strokeColor = "#ffffff",
            strokeWidth = 2
        } = config;

        return data.map(point => {
            const symbolType = symbolTypes[point.type as keyof typeof symbolTypes] || d3.symbolCircle;
            const symbolSize = point.size || size;
            
            const symbolGenerator = d3.symbol()
                .type(symbolType)
                .size(symbolSize);

            return {
                path: symbolGenerator() || "",
                transform: `translate(${point.x}, ${point.y})`,
                config: {
                    ...config,
                    fillColor: point.color || fillColor,
                    strokeColor,
                    strokeWidth
                }
            };
        });
    }

    /**
     * Create custom symbol path
     * Allows for creating unique markers for specific data points
     */
    function createCustomSymbol(type: string, size: number = 64): string {
        const symbolType = symbolTypes[type as keyof typeof symbolTypes] || d3.symbolCircle;
        const symbolGenerator = d3.symbol()
            .type(symbolType)
            .size(size);

        return symbolGenerator() || "";
    }

    // ========================================================================
    // ENHANCED TREND LINES
    // ========================================================================

    /**
     * Create smooth trend line with enhanced curve support
     * Provides better visual flow for waterfall trend analysis
     */
    function createSmoothTrendLine(
        data: Array<{x: number, y: number}>, 
        config: TrendLineConfig = {}
    ): string {
        const {
            curve = d3.curveMonotoneX,
            strokeColor = "#e74c3c",
            strokeWidth = 2,
            opacity = 0.8
        } = config;

        const lineGenerator = d3.line<{x: number, y: number}>()
            .x(d => d.x)
            .y(d => d.y)
            .curve(curve);

        return lineGenerator(data) || "";
    }

    /**
     * Create multiple trend lines for comparison analysis
     * Useful for comparing different scenarios or time periods
     */
    function createMultipleTrendLines(
        datasets: Array<{data: Array<{x: number, y: number}>, config?: TrendLineConfig}>
    ): string[] {
        return datasets.map(dataset => {
            return createSmoothTrendLine(dataset.data, dataset.config);
        });
    }

    // ========================================================================
    // UTILITY FUNCTIONS
    // ========================================================================

    function getCurveTypes(): { [key: string]: d3.CurveFactory } {
        return { ...curveTypes };
    }

    function getSymbolTypes(): { [key: string]: d3.SymbolType } {
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
        getSymbolTypes
    };
}

// ============================================================================
// ADVANCED WATERFALL-SPECIFIC SHAPE UTILITIES
// ============================================================================

/**
 * Create confidence bands specifically for waterfall financial projections
 * Combines multiple projection scenarios into visual uncertainty bands
 */
export function createWaterfallConfidenceBands(
    baselineData: Array<{label: string, value: number}>,
    scenarios: {
        optimistic: Array<{label: string, value: number}>,
        pessimistic: Array<{label: string, value: number}>
    },
    xScale: d3.ScaleBand<string>,
    yScale: d3.ScaleLinear<number, number>
): {
    confidencePath: string,
    optimisticPath: string,
    pessimisticPath: string
} {
    const shapeGenerator = createShapeGenerators();
    
    // Calculate cumulative values for each scenario
    let baselineCumulative = 0;
    let optimisticCumulative = 0;
    let pessimisticCumulative = 0;
    
    const confidenceData: ConfidenceBandData[] = baselineData.map((item, i) => {
        baselineCumulative += item.value;
        optimisticCumulative += scenarios.optimistic[i]?.value || item.value;
        pessimisticCumulative += scenarios.pessimistic[i]?.value || item.value;
        
        const x = (xScale(item.label) || 0) + xScale.bandwidth() / 2;
        
        return {
            x,
            y: yScale(baselineCumulative),
            yUpper: yScale(optimisticCumulative),
            yLower: yScale(pessimisticCumulative),
            label: item.label
        };
    });
    
    // Create trend lines for each scenario
    const optimisticTrendData = confidenceData.map(d => ({ x: d.x, y: d.yUpper }));
    const pessimisticTrendData = confidenceData.map(d => ({ x: d.x, y: d.yLower }));
    
    return {
        confidencePath: shapeGenerator.createConfidenceBand(confidenceData, {
            fillColor: "rgba(52, 152, 219, 0.2)",
            curve: d3.curveMonotoneX
        }),
        optimisticPath: shapeGenerator.createSmoothTrendLine(optimisticTrendData, {
            strokeColor: "#27ae60",
            strokeWidth: 2,
            strokeDasharray: "5,5",
            curve: d3.curveMonotoneX
        }),
        pessimisticPath: shapeGenerator.createSmoothTrendLine(pessimisticTrendData, {
            strokeColor: "#e74c3c",
            strokeWidth: 2,
            strokeDasharray: "5,5",
            curve: d3.curveMonotoneX
        })
    };
}

/**
 * Create key milestone markers for waterfall charts
 * Highlights important data points like targets, thresholds, or significant events
 */
export function createWaterfallMilestones(
    milestones: Array<{
        label: string,
        value: number,
        type: 'target' | 'threshold' | 'alert' | 'achievement',
        description?: string
    }>,
    xScale: d3.ScaleBand<string>,
    yScale: d3.ScaleLinear<number, number>
): Array<{path: string, transform: string, config: SymbolConfig}> {
    const shapeGenerator = createShapeGenerators();
    
    const markerData: DataPointMarker[] = milestones.map(milestone => {
        const typeMapping = {
            target: { type: 'star' as const, color: '#f39c12', size: 100 },
            threshold: { type: 'diamond' as const, color: '#9b59b6', size: 80 },
            alert: { type: 'triangle' as const, color: '#e74c3c', size: 90 },
            achievement: { type: 'circle' as const, color: '#27ae60', size: 85 }
        };
        
        const styling = typeMapping[milestone.type as keyof typeof typeMapping] || typeMapping.target;
        
        return {
            x: (xScale(milestone.label) || 0) + xScale.bandwidth() / 2,
            y: yScale(milestone.value),
            type: styling.type,
            size: styling.size,
            color: styling.color,
            label: milestone.description || milestone.label
        };
    });
    
    return shapeGenerator.createDataPointMarkers(markerData, {
        strokeColor: "#ffffff",
        strokeWidth: 2
    });
}

// Default export for convenience
export default createShapeGenerators;
