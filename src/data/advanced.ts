// MintWaterfall Advanced D3.js Data Operations
import * as d3 from "d3";
import { group, rollup, flatRollup, cross, index } from "d3-array";
import { DataItem, StackItem, AggregationType, validateData } from "./validation.js";

export { DataItem, StackItem, AggregationType };

// Advanced data operation types
export type GroupByFunction<T> = (item: T) => any;
export type GroupByKeys<T> = Array<GroupByFunction<T>>;
export type ReduceFunction<T, R> = (values: T[]) => R;

// Multi-dimensional grouping result types
export type GroupedData<T> = Map<any, T[]>;
export type NestedGroupedData<T> = Map<any, Map<any, T[]>>;
export type RollupData<R> = Map<any, R>;
export type NestedRollupData<R> = Map<any, Map<any, R>>;

// Cross-tabulation types
export interface CrossTabResult<T1, T2, R> {
    row: T1;
    col: T2;
    value: R;
}

// Index map types
export type IndexMap<T> = Map<any, T>;
export type NestedIndexMap<T> = Map<any, Map<any, T>>;

// Temporal aggregation types
export interface TemporalOptions {
    timeAccessor: (d: any) => Date;
    valueAccessor: (d: any) => number;
    interval: d3.TimeInterval;
    aggregation?: AggregationType;
}

// Advanced data processor interface extensions
export interface AdvancedDataOperations {
    // D3.js group() operations
    groupBy<T>(data: T[], ...keys: GroupByKeys<T>): GroupedData<T> | NestedGroupedData<T>;

    // D3.js rollup() operations
    rollupBy<T, R>(data: T[], reducer: ReduceFunction<T, R>, ...keys: GroupByKeys<T>): RollupData<R> | NestedRollupData<R>;

    // D3.js flatRollup() operations
    flatRollupBy<T, R>(data: T[], reducer: ReduceFunction<T, R>, ...keys: GroupByKeys<T>): Array<[...any[], R]>;

    // D3.js cross() operations
    crossTabulate<T1, T2, R>(data1: T1[], data2: T2[], combiner?: (a: T1, b: T2) => R): Array<CrossTabResult<T1, T2, R>>;

    // D3.js index() operations
    indexBy<T>(data: T[], ...keys: GroupByKeys<T>): IndexMap<T> | NestedIndexMap<T>;

    // Temporal aggregation helpers
    aggregateByTime(data: any[], options: TemporalOptions): DataItem[];

    // Waterfall-specific helpers
    createMultiDimensionalWaterfall(data: any[], groupKeys: string[], valueKey: string): DataItem[];
    aggregateWaterfallByPeriod(data: DataItem[], timeKey: string, interval: d3.TimeInterval): DataItem[];
    createBreakdownWaterfall(data: any[], primaryKey: string, breakdownKey: string, valueKey: string): DataItem[];
}

/**
 * Advanced multi-dimensional grouping using D3.js group() API
 * Supports 1-3 levels of nested grouping
 */
export function groupBy<T>(data: T[], ...keys: GroupByKeys<T>): GroupedData<T> | NestedGroupedData<T> {
    if (!Array.isArray(data)) {
        throw new Error("Data must be an array");
    }

    if (keys.length === 0) {
        throw new Error("At least one grouping key must be provided");
    }

    if (keys.length === 1) {
        return d3.group(data, keys[0]);
    } else if (keys.length === 2) {
        return d3.group(data, keys[0], keys[1]) as NestedGroupedData<T>;
    } else if (keys.length === 3) {
        return d3.group(data, keys[0], keys[1], keys[2]) as any;
    } else {
        throw new Error("Maximum 3 levels of grouping supported");
    }
}

/**
 * Advanced aggregation using D3.js rollup() API
 * Supports multi-dimensional rollup with custom reducers
 */
export function rollupBy<T, R>(data: T[], reducer: ReduceFunction<T, R>, ...keys: GroupByKeys<T>): RollupData<R> | NestedRollupData<R> {
    if (!Array.isArray(data)) {
        throw new Error("Data must be an array");
    }

    if (typeof reducer !== "function") {
        throw new Error("Reducer must be a function");
    }

    if (keys.length === 0) {
        throw new Error("At least one grouping key must be provided");
    }

    if (keys.length === 1) {
        return d3.rollup(data, reducer, keys[0]);
    } else if (keys.length === 2) {
        return d3.rollup(data, reducer, keys[0], keys[1]) as NestedRollupData<R>;
    } else if (keys.length === 3) {
        return d3.rollup(data, reducer, keys[0], keys[1], keys[2]) as any;
    } else {
        throw new Error("Maximum 3 levels of rollup supported");
    }
}

/**
 * Flatten hierarchical rollup using D3.js flatRollup() API
 * Returns array of [key1, key2, ..., value] tuples
 */
export function flatRollupBy<T, R>(data: T[], reducer: ReduceFunction<T, R>, ...keys: GroupByKeys<T>): Array<[...any[], R]> {
    if (!Array.isArray(data)) {
        throw new Error("Data must be an array");
    }

    if (typeof reducer !== "function") {
        throw new Error("Reducer must be a function");
    }

    if (keys.length === 0) {
        throw new Error("At least one grouping key must be provided");
    }

    return d3.flatRollup(data, reducer, ...keys) as Array<[...any[], R]>;
}

/**
 * Cross-tabulation using D3.js cross() API
 * Creates cartesian product with optional combiner function
 */
export function crossTabulate<T1, T2, R>(
    data1: T1[],
    data2: T2[],
    combiner?: (a: T1, b: T2) => R
): Array<CrossTabResult<T1, T2, R>> {
    if (!Array.isArray(data1) || !Array.isArray(data2)) {
        throw new Error("Both data arrays must be arrays");
    }

    if (combiner) {
        return d3.cross(data1, data2, (a, b) => ({
            row: a,
            col: b,
            value: combiner(a, b)
        }));
    } else {
        return d3.cross(data1, data2, (a, b) => ({
            row: a,
            col: b,
            value: undefined as R
        }));
    }
}

/**
 * Fast data indexing using D3.js index() API
 * Creates map-based indexes for O(1) lookups
 */
export function indexBy<T>(data: T[], ...keys: GroupByKeys<T>): IndexMap<T> | NestedIndexMap<T> {
    if (!Array.isArray(data)) {
        throw new Error("Data must be an array");
    }

    if (keys.length === 0) {
        throw new Error("At least one indexing key must be provided");
    }

    if (keys.length === 1) {
        return d3.index(data, keys[0]);
    } else if (keys.length === 2) {
        return d3.index(data, keys[0], keys[1]) as NestedIndexMap<T>;
    } else {
        throw new Error("Maximum 2 levels of indexing supported");
    }
}

/**
 * Temporal aggregation for time-series waterfall data
 * Groups data by time intervals and aggregates values
 */
export function aggregateByTime(data: any[], options: TemporalOptions): DataItem[] {
    const { timeAccessor, valueAccessor, interval, aggregation = 'sum' } = options;

    if (!Array.isArray(data)) {
        throw new Error("Data must be an array");
    }

    if (typeof timeAccessor !== "function" || typeof valueAccessor !== "function") {
        throw new Error("Time and value accessors must be functions");
    }

    // Group by time interval
    const grouped = d3.rollup(
        data,
        (values) => {
            switch (aggregation) {
                case 'sum':
                    return d3.sum(values, valueAccessor);
                case 'average':
                    return d3.mean(values, valueAccessor) || 0;
                case 'max':
                    return d3.max(values, valueAccessor) || 0;
                case 'min':
                    return d3.min(values, valueAccessor) || 0;
                default:
                    return d3.sum(values, valueAccessor);
            }
        },
        (d) => interval(timeAccessor(d))
    );

    // Convert to waterfall format
    return Array.from(grouped.entries()).map(([date, value]) => ({
        label: d3.timeFormat("%Y-%m-%d")(date),
        stacks: [{
            value: value,
            color: value >= 0 ? "#2ecc71" : "#e74c3c",
            label: `${value >= 0 ? "+" : ""}${d3.format(".2f")(value)}`
        }]
    }));
}

/**
 * Create multi-dimensional waterfall from hierarchical data
 * Groups by multiple keys and creates stacked waterfall segments
 */
export function createMultiDimensionalWaterfall(
    data: any[],
    groupKeys: string[],
    valueKey: string
): DataItem[] {
    if (!Array.isArray(data) || !Array.isArray(groupKeys)) {
        throw new Error("Data and groupKeys must be arrays");
    }

    if (groupKeys.length === 0) {
        throw new Error("At least one group key must be provided");
    }

    // Create accessor functions for the keys
    const accessors = groupKeys.map(key => (d: any) => d[key]);

    // Use flatRollup to get flat aggregated data
    const aggregated = d3.flatRollup(
        data,
        (values) => d3.sum(values, (d: any) => d[valueKey] || 0),
        ...accessors
    );

    // Convert to waterfall format
    return aggregated.map((item) => {
        const keys = item.slice(0, -1); // All but last element
        const value = item[item.length - 1]; // Last element
        const label = keys.join(" → ");
        const colors = ["#3498db", "#2ecc71", "#f39c12", "#e74c3c", "#9b59b6"];
        const colorIndex = Math.abs(keys.join("").split("").reduce((a, b) => a + b.charCodeAt(0), 0)) % colors.length;

        return {
            label,
            stacks: [{
                value: value as number,
                color: colors[colorIndex],
                label: `${value >= 0 ? "+" : ""}${d3.format(".2f")(value as number)}`
            }]
        };
    });
}

/**
 * Aggregate existing waterfall data by time periods
 * Useful for rolling up daily waterfalls into weekly/monthly
 */
export function aggregateWaterfallByPeriod(
    data: DataItem[],
    timeKey: string,
    interval: d3.TimeInterval
): DataItem[] {
    validateData(data);

    // Extract time values and group by interval
    const timeGrouped = d3.rollup(
        data,
        (items) => {
            // Aggregate all stacks across items in this time period
            const allStacks: StackItem[] = [];
            items.forEach(item => allStacks.push(...item.stacks));

            // Group stacks by color and sum values
            const stacksByColor = d3.rollup(
                allStacks,
                (stacks) => ({
                    value: d3.sum(stacks, s => s.value),
                    label: stacks[0].label,
                    color: stacks[0].color
                }),
                (s) => s.color
            );

            return Array.from(stacksByColor.values());
        },
        (item) => {
            // Try to parse time from the item (assuming it's in the label or a property)
            const timeStr = (item as any)[timeKey] || item.label;
            const date = new Date(timeStr);
            return isNaN(date.getTime()) ? new Date() : interval(date);
        }
    );

    // Convert to waterfall format
    return Array.from(timeGrouped.entries()).map(([date, stacks]) => ({
        label: d3.timeFormat("%Y-%m-%d")(date),
        stacks: stacks
    }));
}

/**
 * Create breakdown waterfall showing primary categories and their breakdowns
 * Useful for drill-down analysis
 */
export function createBreakdownWaterfall(
    data: any[],
    primaryKey: string,
    breakdownKey: string,
    valueKey: string
): DataItem[] {
    if (!Array.isArray(data)) {
        throw new Error("Data must be an array");
    }

    // First group by primary key, then by breakdown key
    const nested = d3.rollup(
        data,
        (values) => d3.sum(values, (d: any) => d[valueKey] || 0),
        (d: any) => d[primaryKey],
        (d: any) => d[breakdownKey]
    );

    // Convert to waterfall format with stacked breakdowns
    return Array.from(nested.entries()).map(([primaryValue, breakdowns]) => {
        const stacks = Array.from(breakdowns.entries()).map(([breakdownValue, value], index) => {
            const colors = ["#3498db", "#2ecc71", "#f39c12", "#e74c3c", "#9b59b6", "#1abc9c", "#34495e"];
            return {
                value: value as number,
                color: colors[index % colors.length],
                label: `${breakdownValue}: ${value >= 0 ? "+" : ""}${d3.format(".2f")(value as number)}`
            };
        });

        return {
            label: String(primaryValue),
            stacks
        };
    });
}
// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface SequenceAnalysis {
    from: string;
    to: string;
    change: number;
    changePercent: number;
    changeDirection: 'increase' | 'decrease' | 'neutral';
    magnitude: 'small' | 'medium' | 'large';
}

export interface DataMergeOptions {
    mergeStrategy: 'combine' | 'override' | 'average' | 'sum';
    conflictResolution: 'first' | 'last' | 'max' | 'min';
    keyField: string;
    valueField: string;
}

export interface TickGenerationOptions {
    count?: number;
    step?: number;
    nice?: boolean;
    format?: string;
    threshold?: number;
    includeZero?: boolean;
}

export interface DataOrderingOptions {
    field: string;
    direction: 'ascending' | 'descending';
    strategy: 'value' | 'cumulative' | 'magnitude' | 'alphabetical';
    groupBy?: string;
}

export interface AdvancedDataProcessor {
    // Sequence analysis using d3.pairs()
    analyzeSequence(data: any[]): SequenceAnalysis[];
    
    // Data reordering using d3.permute()
    optimizeDataOrder(data: any[], options: DataOrderingOptions): any[];
    
    // Complex dataset merging using d3.merge()
    mergeDatasets(datasets: any[][], options: DataMergeOptions): any[];
    
    // Custom axis tick generation using d3.ticks()
    generateCustomTicks(domain: [number, number], options: TickGenerationOptions): number[];
    
    // Advanced data transformation utilities
    createDataPairs(data: any[], accessor?: (d: any) => any): any[];
    permuteByIndices(data: any[], indices: number[]): any[];
    mergeSimilarItems(data: any[], similarityThreshold: number): any[];
    
    // Data quality and validation
    validateSequentialData(data: any[]): { isValid: boolean; errors: string[] };
    detectDataAnomalies(data: any[]): any[];
    suggestDataOptimizations(data: any[]): string[];
}

// ============================================================================
// MISSING ADVANCED DATA PROCESSOR FUNCTIONS
// ============================================================================

/**
 * Creates an advanced data processor with D3.js data manipulation functions
 */
export function createAdvancedDataProcessor() {
    
    // Group data by key using d3.group
    function groupBy<T>(data: T[], accessor: (d: T) => string): Map<string, T[]> {
        if (!data || !Array.isArray(data) || !accessor) {
            return new Map();
        }
        return group(data, accessor);
    }
    
    // Rollup data with reducer using d3.rollup
    function rollupBy<T, R>(data: T[], reducer: (values: T[]) => R, accessor: (d: T) => string): Map<string, R> {
        if (!data || !Array.isArray(data) || !reducer || !accessor) {
            return new Map();
        }
        return rollup(data, reducer, accessor);
    }
    
    // Flat rollup using d3.flatRollup
    function flatRollupBy<T, R>(data: T[], reducer: (values: T[]) => R, accessor: (d: T) => string): [string, R][] {
        if (!data || !Array.isArray(data) || !reducer || !accessor) {
            return [];
        }
        return flatRollup(data, reducer, accessor);
    }
    
    // Cross tabulate two arrays using d3.cross
    function crossTabulate<A, B, R>(a: A[], b: B[], reducer?: (a: A, b: B) => R): (R | [A, B])[] {
        if (!Array.isArray(a) || !Array.isArray(b)) {
            return [];
        }
        if (reducer) {
            return cross(a, b, reducer);
        } else {
            return cross(a, b) as [A, B][];
        }
    }
    
    // Index data by key using d3.index
    function indexBy<T>(data: T[], accessor: (d: T) => string): Map<string, T> {
        if (!data || !Array.isArray(data) || !accessor) {
            return new Map();
        }
        
        try {
            return index(data, accessor);
        } catch (error) {
            // Handle duplicate keys gracefully by creating a manual index
            const result = new Map<string, T>();
            data.forEach(item => {
                const key = accessor(item);
                if (!result.has(key)) {
                    result.set(key, item);
                }
            });
            return result;
        }
    }
    
    // Aggregate data by time periods
    function aggregateByTime<T>(
        data: T[], 
        timeAccessor: (d: T) => Date, 
        granularity: 'day' | 'week' | 'month' | 'year',
        reducer: (values: T[]) => any
    ): any[] {
        if (!data || !Array.isArray(data) || !timeAccessor || !reducer) {
            return [];
        }
        
        const timeGroups = group(data, (d: T) => {
            const date = timeAccessor(d);
            if (!date || !(date instanceof Date)) return 'invalid';
            
            switch (granularity) {
                case 'day':
                    return date.toISOString().split('T')[0];
                case 'week':
                    const week = new Date(date);
                    week.setDate(date.getDate() - date.getDay());
                    return week.toISOString().split('T')[0];
                case 'month':
                    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                case 'year':
                    return String(date.getFullYear());
                default:
                    return date.toISOString().split('T')[0];
            }
        });
        
        return Array.from(timeGroups.entries()).map(([period, values]) => ({
            period,
            data: reducer(values),
            count: values.length
        }));
    }
    
    // Create multi-dimensional waterfall
    function createMultiDimensionalWaterfall(
        multiData: Record<string, any[]>,
        options: {
            aggregationMethod?: 'sum' | 'average' | 'count' | 'max' | 'min';
            includeRegionalTotals?: boolean;
            includeGrandTotal?: boolean;
        }
    ): any[] {
        const result: any[] = [];
        const { aggregationMethod = 'sum' } = options;
        
        if (!multiData || typeof multiData !== 'object') {
            return result;
        }
        
        const regions = Object.keys(multiData);
        let grandTotal = 0;
        
        for (const region of regions) {
            const data = multiData[region];
            if (!Array.isArray(data)) continue;
            
            let regionTotal = 0;
            
            for (const item of data) {
                let value = 0;
                if (item.value !== undefined) {
                    value = item.value;
                } else if (item.stacks && Array.isArray(item.stacks)) {
                    value = item.stacks.reduce((sum: number, stack: any) => sum + (stack.value || 0), 0);
                }
                
                result.push({
                    ...item,
                    region,
                    value,
                    label: `${region}: ${item.label}`
                });
                
                switch (aggregationMethod) {
                    case 'sum':
                        regionTotal += value;
                        break;
                    case 'average':
                        regionTotal += value;
                        break;
                    case 'count':
                        regionTotal += 1;
                        break;
                    case 'max':
                        regionTotal = Math.max(regionTotal, value);
                        break;
                    case 'min':
                        regionTotal = regionTotal === 0 ? value : Math.min(regionTotal, value);
                        break;
                }
            }
            
            if (options.includeRegionalTotals) {
                result.push({
                    label: `${region} Total`,
                    value: aggregationMethod === 'average' ? regionTotal / data.length : regionTotal,
                    region,
                    isRegionalTotal: true
                });
            }
            
            grandTotal += regionTotal;
        }
        
        if (options.includeGrandTotal) {
            result.push({
                label: 'Grand Total',
                value: grandTotal,
                isGrandTotal: true
            });
        }
        
        return result;
    }
    
    // Aggregate waterfall by period with additional metrics
    function aggregateWaterfallByPeriod(
        data: any[],
        periodField: string,
        options: {
            includeMovingAverage?: boolean;
            movingAverageWindow?: number;
            calculateGrowthRates?: boolean;
            includeVariance?: boolean;
        }
    ): any[] {
        if (!data || !Array.isArray(data)) {
            return [];
        }
        
        const periodGroups = group(data, (d: any) => d[periodField] || 'unknown');
        const result = Array.from(periodGroups.entries()).map(([period, items]) => {
            const total = items.reduce((sum, item) => {
                if (item.value !== undefined) return sum + item.value;
                if (item.stacks && Array.isArray(item.stacks)) {
                    return sum + item.stacks.reduce((s: number, stack: any) => s + (stack.value || 0), 0);
                }
                return sum;
            }, 0);
            
            return {
                period,
                items,
                total,
                count: items.length,
                average: total / items.length,
                movingAverage: 0, // Will be calculated if requested
                growthRate: 0 // Will be calculated if requested
            };
        });
        
        // Add moving average if requested
        if (options.includeMovingAverage) {
            const window = options.movingAverageWindow || 3;
            result.forEach((item, index) => {
                const start = Math.max(0, index - Math.floor(window / 2));
                const end = Math.min(result.length, start + window);
                const windowData = result.slice(start, end);
                item.movingAverage = windowData.reduce((sum, w) => sum + w.total, 0) / windowData.length;
            });
        }
        
        // Add growth rates if requested
        if (options.calculateGrowthRates) {
            result.forEach((item, index) => {
                if (index > 0) {
                    const prev = result[index - 1];
                    item.growthRate = prev.total !== 0 ? (item.total - prev.total) / prev.total : 0;
                }
            });
        }
        
        return result;
    }
    
    // Create breakdown waterfall with sub-items
    function createBreakdownWaterfall(
        data: any[],
        breakdownField: string,
        options: {
            maintainOriginalStructure?: boolean;
            includeSubtotals?: boolean;
            colorByBreakdown?: boolean;
        }
    ): any[] {
        if (!data || !Array.isArray(data)) {
            return [];
        }
        
        const result: any[] = [];
        
        for (const item of data) {
            const breakdowns = item[breakdownField];
            
            if (breakdowns && Array.isArray(breakdowns)) {
                // Add main item
                if (options.maintainOriginalStructure) {
                    result.push({ ...item, isMainItem: true });
                }
                
                // Add breakdown items
                let subtotal = 0;
                breakdowns.forEach((breakdown: any, index: number) => {
                    const breakdownItem = {
                        ...breakdown,
                        parentLabel: item.label,
                        isBreakdown: true,
                        breakdownIndex: index,
                        color: options.colorByBreakdown ? `hsl(${index * 360 / breakdowns.length}, 70%, 60%)` : breakdown.color
                    };
                    result.push(breakdownItem);
                    subtotal += breakdown.value || 0;
                });
                
                // Add subtotal if requested
                if (options.includeSubtotals && breakdowns.length > 1) {
                    result.push({
                        label: `${item.label} Subtotal`,
                        value: subtotal,
                        parentLabel: item.label,
                        isSubtotal: true
                    });
                }
            } else {
                // No breakdown data, add as-is
                result.push({ ...item, hasBreakdown: false });
            }
        }
        
        return result;
    }
    
    // Additional methods needed by existing code
    function analyzeSequence(data: any[]): any[] {
        // Simplified implementation for compatibility
        if (!Array.isArray(data) || data.length < 2) {
            return [];
        }
        
        return data.slice(1).map((item, index) => {
            const prev = data[index];
            const current = item;
            const prevValue = extractValue(prev);
            const currentValue = extractValue(current);
            const change = currentValue - prevValue;
            
            return {
                index,
                from: prev.label || `Item ${index}`,
                to: current.label || `Item ${index + 1}`,
                fromValue: prevValue,
                toValue: currentValue,
                change,
                percentChange: prevValue !== 0 ? (change / prevValue) * 100 : 0,
                direction: change > 0 ? 'increase' : change < 0 ? 'decrease' : 'stable',
                magnitude: Math.abs(change) > 1000 ? 'large' : Math.abs(change) > 100 ? 'medium' : 'small'
            };
        });
    }
    
    function suggestDataOptimizations(data: any[]): any[] {
        // Simplified implementation for compatibility
        const suggestions: any[] = [];
        
        if (!Array.isArray(data) || data.length === 0) {
            return suggestions;
        }
        
        if (data.length > 20) {
            suggestions.push({
                type: 'aggregation',
                priority: 'medium',
                description: 'Consider grouping similar items for better readability',
                impact: 'Reduces visual clutter'
            });
        }
        
        return suggestions;
    }
    
    function generateCustomTicks(domain: [number, number], options: any): number[] {
        // Simplified implementation using d3.ticks
        const tickCount = options.targetTickCount || 8;
        return d3.ticks(domain[0], domain[1], tickCount);
    }
    
    function extractValue(item: any): number {
        if (typeof item === 'number') return item;
        if (item.value !== undefined) return item.value;
        if (item.stacks && Array.isArray(item.stacks)) {
            return item.stacks.reduce((sum: number, stack: any) => sum + (stack.value || 0), 0);
        }
        return 0;
    }

    // Return the processor interface
    return {
        groupBy,
        rollupBy,
        flatRollupBy,
        crossTabulate,
        indexBy,
        aggregateByTime,
        createMultiDimensionalWaterfall,
        aggregateWaterfallByPeriod,
        createBreakdownWaterfall,
        analyzeSequence,
        suggestDataOptimizations,
        generateCustomTicks
    };
}
