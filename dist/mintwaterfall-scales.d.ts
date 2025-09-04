import * as d3 from 'd3';
export interface ScaleSystemOptions {
    range?: [number, number];
    nice?: boolean;
    padding?: number;
}
export interface TimeScaleOptions {
    range?: [number, number];
    nice?: boolean;
    tickFormat?: string | 'auto';
}
export interface OrdinalScaleOptions {
    range?: string[];
    unknown?: string;
}
export interface BandScaleOptions {
    padding?: number;
    paddingInner?: number | null;
    paddingOuter?: number | null;
    align?: number;
    range?: [number, number];
}
export interface LinearScaleOptions {
    range?: [number, number];
    nice?: boolean;
    zero?: boolean;
    clamp?: boolean;
}
export type ScaleType = 'linear' | 'band' | 'time' | 'ordinal' | 'adaptive';
export type DimensionType = 'x' | 'y';
export interface ScaleFactory {
    createAdaptiveScale(data: any[], dimension?: DimensionType): d3.ScaleLinear<number, number> | d3.ScaleBand<string> | d3.ScaleTime<number, number>;
    createTimeScale(values: Date[], options?: TimeScaleOptions): d3.ScaleTime<number, number>;
    createOrdinalScale(values: any[], options?: OrdinalScaleOptions): d3.ScaleOrdinal<any, string, string>;
    createBandScale(values: any[], options?: BandScaleOptions): d3.ScaleBand<string>;
    createLinearScale(values: number[], options?: LinearScaleOptions): d3.ScaleLinear<number, number>;
    createLogScale(values: number[], options?: LinearScaleOptions): d3.ScaleLogarithmic<number, number> | d3.ScaleLinear<number, number>;
    setDefaultRange(range: [number, number]): void;
    getScaleInfo(scale: any): ScaleInfo;
    scaleUtils: ScaleUtilities;
}
export interface ScaleInfo {
    type: string;
    domain: any[];
    range: any[];
    bandwidth?: number;
    step?: number;
}
export declare function createScaleSystem(): ScaleFactory;
export declare function createTimeScale(values: Date[], options?: TimeScaleOptions): d3.ScaleTime<number, number>;
export declare function createOrdinalScale(values: any[], options?: OrdinalScaleOptions): d3.ScaleOrdinal<any, string, string>;
export declare function createBandScale(values: any[], options?: BandScaleOptions): d3.ScaleBand<string>;
export declare function createLinearScale(values: number[], options?: LinearScaleOptions): d3.ScaleLinear<number, number>;
export interface ScaleUtilities {
    formatTickValue(scale: any, value: any): string;
    getTickCount(scale: any, targetSize: number): number;
    createColorScale(domain: any[], scheme?: readonly string[]): d3.ScaleOrdinal<any, string, string>;
    invertScale(scale: any, pixel: number): any;
    detectScaleType(values: any[]): ScaleType;
    createAxis(scale: any, orientation?: 'top' | 'bottom' | 'left' | 'right'): any;
}
export declare function createScaleUtilities(): ScaleUtilities;
export declare const scaleUtilities: ScaleUtilities;
//# sourceMappingURL=mintwaterfall-scales.d.ts.map