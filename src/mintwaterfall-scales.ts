// MintWaterfall Enhanced Scales System - TypeScript Version
// Provides advanced D3.js scale support including time and ordinal scales with full type safety

import * as d3 from 'd3';

// Type definitions for scale systems
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
}

export interface LinearScaleOptions {
    range?: [number, number];
    nice?: boolean;
    zero?: boolean;
    clamp?: boolean;
}

export type ScaleType = 'linear' | 'band' | 'time' | 'ordinal' | 'adaptive';
export type DimensionType = 'x' | 'y';

// Scale factory interface
export interface ScaleFactory {
    createAdaptiveScale(data: any[], dimension?: DimensionType): d3.ScaleLinear<number, number> | d3.ScaleBand<string> | d3.ScaleTime<number, number>;
    createTimeScale(values: Date[], options?: TimeScaleOptions): d3.ScaleTime<number, number>;
    createOrdinalScale(values: any[], options?: OrdinalScaleOptions): d3.ScaleOrdinal<any, string>;
    createBandScale(values: any[], options?: BandScaleOptions): d3.ScaleBand<string>;
    createLinearScale(values: number[], options?: LinearScaleOptions): d3.ScaleLinear<number, number>;
    setDefaultRange(range: [number, number]): void;
    getScaleInfo(scale: any): ScaleInfo;
}

export interface ScaleInfo {
    type: string;
    domain: any[];
    range: any[];
    bandwidth?: number;
    step?: number;
}

export function createScaleSystem(): ScaleFactory {
    let defaultRange: [number, number] = [0, 800];
    
    // Enhanced scale factory with auto-detection
    function createAdaptiveScale(data: any[], dimension: DimensionType = "x"): d3.ScaleLinear<number, number> | d3.ScaleBand<string> | d3.ScaleTime<number, number> {
        const values = data.map(d => dimension === "x" ? d.label : d.cumulativeTotal);
        
        // Detect data type and return appropriate scale
        if (values.every(v => v instanceof Date)) {
            return createTimeScale(values);
        } else if (values.every(v => typeof v === "string" || isNaN(v))) {
            // For categorical/string data, use band scale for positioning
            return createBandScale(values);
        } else if (values.every(v => typeof v === "number")) {
            return createLinearScale(values);
        } else {
            // Mixed types - fallback to band scale
            return d3.scaleBand<string>().domain(values.map(String)).range(defaultRange);
        }
    }
    
    // Time scale with intelligent formatting
    function createTimeScale(values: Date[], options: TimeScaleOptions = {}): d3.ScaleTime<number, number> {
        const {
            range = defaultRange,
            nice = true,
            tickFormat = "auto"
        } = options;
        
        const extent = d3.extent(values) as [Date, Date];
        const scale = d3.scaleTime()
            .domain(extent)
            .range(range);
            
        if (nice) {
            scale.nice();
        }
        
        // Auto-detect appropriate time format
        if (tickFormat === "auto") {
            const timeSpan = extent[1].getTime() - extent[0].getTime();
            const days = timeSpan / (1000 * 60 * 60 * 24);
            
            if (days < 1) {
                (scale as any).tickFormat = d3.timeFormat("%H:%M");
            } else if (days < 30) {
                (scale as any).tickFormat = d3.timeFormat("%m/%d");
            } else if (days < 365) {
                (scale as any).tickFormat = d3.timeFormat("%b %Y");
            } else {
                (scale as any).tickFormat = d3.timeFormat("%Y");
            }
        } else if (typeof tickFormat === "string") {
            (scale as any).tickFormat = d3.timeFormat(tickFormat);
        }
        
        return scale;
    }
    
    // Enhanced ordinal scale with color mapping
    function createOrdinalScale(values: any[], options: OrdinalScaleOptions = {}): d3.ScaleOrdinal<any, string> {
        const {
            range = d3.schemeCategory10,
            unknown = "#ccc"
        } = options;
        
        const uniqueValues = [...new Set(values)];
        
        return d3.scaleOrdinal<any, string, string>()
            .domain(uniqueValues)
            .range(range)
            .unknown(unknown);
    }
    
    // Band scale for categorical data positioning
    function createBandScale(values: any[], options: BandScaleOptions = {}): d3.ScaleBand<string> {
        const {
            padding = 0.1,
            paddingInner = null,
            paddingOuter = null,
            align = 0.5
        } = options;
        
        const uniqueValues = [...new Set(values.map(String))];
        const scale = d3.scaleBand<string>()
            .domain(uniqueValues)
            .range(defaultRange)
            .align(align);
            
        if (paddingInner !== null) {
            scale.paddingInner(paddingInner);
        }
        if (paddingOuter !== null) {
            scale.paddingOuter(paddingOuter);
        }
        if (paddingInner === null && paddingOuter === null) {
            scale.padding(padding);
        }
        
        return scale;
    }
    
    // Linear scale with enhanced options
    function createLinearScale(values: number[], options: LinearScaleOptions = {}): d3.ScaleLinear<number, number> {
        const {
            range = defaultRange,
            nice = true,
            zero = false,
            clamp = false
        } = options;
        
        let domain = d3.extent(values) as [number, number];
        
        // Include zero in domain if requested
        if (zero) {
            domain = [Math.min(0, domain[0]), Math.max(0, domain[1])];
        }
        
        const scale = d3.scaleLinear()
            .domain(domain)
            .range(range);
            
        if (nice) {
            scale.nice();
        }
        
        if (clamp) {
            scale.clamp(true);
        }
        
        return scale;
    }
    
    function setDefaultRange(range: [number, number]): void {
        defaultRange = range;
    }
    
    function getScaleInfo(scale: any): ScaleInfo {
        const info: ScaleInfo = {
            type: 'unknown',
            domain: [],
            range: []
        };
        
        try {
            info.domain = scale.domain();
            info.range = scale.range();
            
            // Detect scale type
            if (typeof scale.bandwidth === 'function') {
                info.type = 'band';
                info.bandwidth = scale.bandwidth();
                info.step = scale.step();
            } else if (typeof scale.nice === 'function') {
                // Check if it's a time scale by testing if domain contains dates
                if (info.domain.length > 0 && info.domain[0] instanceof Date) {
                    info.type = 'time';
                } else {
                    info.type = 'linear';
                }
            } else if (typeof scale.unknown === 'function') {
                info.type = 'ordinal';
            }
        } catch (e) {
            // Fallback for scales that don't support these methods
            console.warn('Could not extract complete scale info:', e);
        }
        
        return info;
    }
    
    return {
        createAdaptiveScale,
        createTimeScale,
        createOrdinalScale,
        createBandScale,
        createLinearScale,
        setDefaultRange,
        getScaleInfo
    };
}

// Standalone scale creation functions for backward compatibility
export function createTimeScale(values: Date[], options: TimeScaleOptions = {}): d3.ScaleTime<number, number> {
    const factory = createScaleSystem();
    return factory.createTimeScale(values, options);
}

export function createOrdinalScale(values: any[], options: OrdinalScaleOptions = {}): d3.ScaleOrdinal<any, string, string> {
    const factory = createScaleSystem();
    return factory.createOrdinalScale(values, options) as d3.ScaleOrdinal<any, string, string>;
}

export function createBandScale(values: any[], options: BandScaleOptions = {}): d3.ScaleBand<string> {
    const factory = createScaleSystem();
    return factory.createBandScale(values, options);
}

export function createLinearScale(values: number[], options: LinearScaleOptions = {}): d3.ScaleLinear<number, number> {
    const factory = createScaleSystem();
    return factory.createLinearScale(values, options);
}

// Enhanced scale utilities
export interface ScaleUtilities {
    formatTickValue(scale: any, value: any): string;
    getTickCount(scale: any, targetSize: number): number;
    createColorScale(domain: any[], scheme?: readonly string[]): d3.ScaleOrdinal<any, string, string>;
    invertScale(scale: any, pixel: number): any;
}

export function createScaleUtilities(): ScaleUtilities {
    
    function formatTickValue(scale: any, value: any): string {
        if (typeof scale.tickFormat === 'function') {
            // Time scales
            return scale.tickFormat()(value);
        } else if (scale.tickFormat) {
            // Scales with custom formatters
            return scale.tickFormat(value);
        } else if (typeof value === 'number') {
            // Default number formatting
            if (Math.abs(value) >= 1000000) {
                return `${(value / 1000000).toFixed(1)}M`;
            } else if (Math.abs(value) >= 1000) {
                return `${(value / 1000).toFixed(1)}K`;
            } else {
                return value.toFixed(0);
            }
        } else {
            return String(value);
        }
    }
    
    function getTickCount(scale: any, targetSize: number): number {
        const range = scale.range();
        const rangeSize = Math.abs(range[1] - range[0]);
        
        // Aim for ticks every 50-100 pixels
        const idealTickCount = Math.max(2, Math.floor(rangeSize / 75));
        
        // Cap at reasonable limits
        return Math.min(10, Math.max(2, idealTickCount));
    }
    
    function createColorScale(domain: any[], scheme: readonly string[] = d3.schemeCategory10): d3.ScaleOrdinal<any, string, string> {
        return d3.scaleOrdinal<any, string, string>()
            .domain(domain)
            .range([...scheme]);
    }
    
    function invertScale(scale: any, pixel: number): any {
        if (typeof scale.invert === 'function') {
            // Linear and time scales
            return scale.invert(pixel);
        } else if (typeof scale.bandwidth === 'function') {
            // Band scales - find the band that contains the pixel
            const domain = scale.domain();
            const bandwidth = scale.bandwidth();
            const step = scale.step();
            
            for (let i = 0; i < domain.length; i++) {
                const bandStart = scale(domain[i]);
                if (pixel >= bandStart && pixel <= bandStart + bandwidth) {
                    return domain[i];
                }
            }
            
            // If not in any band, return closest
            const distances = domain.map((d: any) => Math.abs(scale(d) + bandwidth / 2 - pixel));
            const minIndex = distances.indexOf(Math.min(...distances));
            return domain[minIndex];
        } else {
            // Ordinal scales - return undefined for pixel-based inversion
            return undefined;
        }
    }
    
    return {
        formatTickValue,
        getTickCount,
        createColorScale,
        invertScale
    };
}

// Export default instance for convenience
export const scaleUtilities = createScaleUtilities();
