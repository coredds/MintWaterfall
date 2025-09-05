import * as d3 from 'd3';
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
    createConfidenceBand(data: ConfidenceBandData[], config?: AreaConfig): string;
    createEnvelopeArea(data: Array<{
        x: number;
        y0: number;
        y1: number;
    }>, config?: AreaConfig): string;
    createDataPointMarkers(data: DataPointMarker[], config?: SymbolConfig): Array<{
        path: string;
        transform: string;
        config: SymbolConfig;
    }>;
    createCustomSymbol(type: string, size?: number): string;
    createSmoothTrendLine(data: Array<{
        x: number;
        y: number;
    }>, config?: TrendLineConfig): string;
    createMultipleTrendLines(datasets: Array<{
        data: Array<{
            x: number;
            y: number;
        }>;
        config?: TrendLineConfig;
    }>): string[];
    getCurveTypes(): {
        [key: string]: d3.CurveFactory;
    };
    getSymbolTypes(): {
        [key: string]: d3.SymbolType;
    };
}
export declare function createShapeGenerators(): ShapeGeneratorSystem;
/**
 * Create confidence bands specifically for waterfall financial projections
 * Combines multiple projection scenarios into visual uncertainty bands
 */
export declare function createWaterfallConfidenceBands(baselineData: Array<{
    label: string;
    value: number;
}>, scenarios: {
    optimistic: Array<{
        label: string;
        value: number;
    }>;
    pessimistic: Array<{
        label: string;
        value: number;
    }>;
}, xScale: d3.ScaleBand<string>, yScale: d3.ScaleLinear<number, number>): {
    confidencePath: string;
    optimisticPath: string;
    pessimisticPath: string;
};
/**
 * Create key milestone markers for waterfall charts
 * Highlights important data points like targets, thresholds, or significant events
 */
export declare function createWaterfallMilestones(milestones: Array<{
    label: string;
    value: number;
    type: 'target' | 'threshold' | 'alert' | 'achievement';
    description?: string;
}>, xScale: d3.ScaleBand<string>, yScale: d3.ScaleLinear<number, number>): Array<{
    path: string;
    transform: string;
    config: SymbolConfig;
}>;
export default createShapeGenerators;
//# sourceMappingURL=mintwaterfall-shapes.d.ts.map