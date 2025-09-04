// MintWaterfall Data Processing Utilities - TypeScript Version
// Provides data transformation, aggregation, and manipulation functions with full type safety

import * as d3 from 'd3';

// Type definitions for data structures
export interface StackItem {
    value: number;
    color: string;
    label: string;
}

export interface DataItem {
    label: string;
    stacks: StackItem[];
}

export interface ProcessedDataItem extends DataItem {
    aggregatedValue?: number;
    originalStacks?: StackItem[];
}

export interface LoadDataOptions {
    parseNumbers?: boolean;
    dateColumns?: string[];
    valueColumn?: string;
    labelColumn?: string;
    colorColumn?: string;
    stacksColumn?: string;
}

export interface TransformOptions {
    valueColumn?: string;
    labelColumn?: string;
    colorColumn?: string;
    stacksColumn?: string;
    defaultColor?: string;
    parseNumbers?: boolean;
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

export type AggregationType = 'sum' | 'average' | 'max' | 'min';
export type SortDirection = 'ascending' | 'descending';
export type SortBy = 'label' | 'total' | 'maxStack' | 'minStack';

// Raw data types (before transformation)
export interface RawDataItem {
    [key: string]: any;
}

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

// Data loading utilities
export async function loadData(
    source: string | DataItem[] | RawDataItem[], 
    options: LoadDataOptions = {}
): Promise<DataItem[]> {
    const {
        // parseNumbers = true, // Reserved for future use
        // dateColumns = [], // Reserved for future use
        // valueColumn = "value", // Reserved for future use
        // labelColumn = "label", // Reserved for future use
        // colorColumn = "color", // Reserved for future use
        // stacksColumn = "stacks" // Reserved for future use
    } = options;

    try {
        let rawData: any;
        
        if (typeof source === "string") {
            // URL or file path
            if (source.endsWith(".csv")) {
                rawData = await d3.csv(source);
            } else if (source.endsWith(".json")) {
                rawData = await d3.json(source);
            } else if (source.endsWith(".tsv")) {
                rawData = await d3.tsv(source);
            } else {
                // Try to detect if it's a URL by checking for http/https
                if (source.startsWith("http")) {
                    const response = await fetch(source);
                    const contentType = response.headers.get("content-type");
                    
                    if (contentType?.includes("application/json")) {
                        rawData = await response.json();
                    } else if (contentType?.includes("text/csv")) {
                        const text = await response.text();
                        rawData = d3.csvParse(text);
                    } else {
                        rawData = await response.json(); // fallback
                    }
                } else {
                    throw new Error(`Unsupported file format: ${source}`);
                }
            }
        } else if (Array.isArray(source)) {
            // Already an array
            rawData = source;
        } else {
            throw new Error("Source must be a URL, file path, or data array");
        }

        // Transform raw data to MintWaterfall format if needed
        return transformToWaterfallFormat(rawData, options);
        
    } catch (error) {
        console.error("Error loading data:", error);
        throw error;
    }
}

// Transform various data formats to MintWaterfall format
export function transformToWaterfallFormat(
    data: any[], 
    options: TransformOptions = {}
): DataItem[] {
    const {
        valueColumn = "value",
        labelColumn = "label", 
        colorColumn = "color",
        // stacksColumn = "stacks", // Reserved for future use
        defaultColor = "#3498db",
        parseNumbers = true
    } = options;
    
    if (!Array.isArray(data)) {
        throw new Error("Data must be an array");
    }
    
    return data.map((item: any, index: number): DataItem => {
        // If already in correct format, return as-is
        if (item.label && Array.isArray(item.stacks)) {
            return item as DataItem;
        }
        
        // Transform flat format to stacked format
        const label = item[labelColumn] || `Item ${index + 1}`;
        let value = item[valueColumn];
        
        if (parseNumbers && typeof value === "string") {
            value = parseFloat(value.replace(/[,$]/g, "")) || 0;
        } else if (typeof value !== "number") {
            value = 0;
        }
        
        const color = item[colorColumn] || defaultColor;
        
        return {
            label: String(label),
            stacks: [{
                value: value,
                color: color,
                label: item.stackLabel || `${value >= 0 ? "+" : ""}${value}`
            }]
        };
    });
}

export interface DataProcessor extends AdvancedDataOperations {
    validateData(data: DataItem[]): boolean;
    loadData(source: string | any[], options?: LoadDataOptions): Promise<DataItem[]>;
    transformToWaterfallFormat(data: any[], options?: TransformOptions): DataItem[];
    aggregateData(data: DataItem[], aggregateBy?: AggregationType): ProcessedDataItem[];
    sortData(data: DataItem[], sortBy?: SortBy, direction?: SortDirection): DataItem[];
    filterData(data: DataItem[], filterFn: (item: DataItem) => boolean): DataItem[];
    getDataSummary(data: DataItem[]): DataSummary;
    transformData(data: DataItem[], transformFn: (item: DataItem) => DataItem): DataItem[];
    groupData(data: DataItem[], groupBy: string | ((item: DataItem) => string)): Map<string, DataItem[]>;
    transformStacks(data: DataItem[], transformer: (stack: StackItem) => StackItem): DataItem[];
    normalizeValues(data: DataItem[], targetMax: number): DataItem[];
    groupByCategory(data: DataItem[], categoryFunction: (item: DataItem) => string): { [key: string]: DataItem[] };
    calculatePercentages(data: DataItem[]): DataItem[];
    interpolateData(data1: DataItem[], data2: DataItem[], t: number): DataItem[];
    generateSampleData(itemCount: number, stacksPerItem: number, valueRange?: [number, number]): DataItem[];
}

export interface DataSummary {
    totalItems: number;
    totalStacks: number;
    valueRange: { min: number; max: number };
    cumulativeTotal: number;
    stackColors: string[];
    labels: string[];
}

export function createDataProcessor(): DataProcessor {
    
    function validateData(data: DataItem[]): boolean {
        if (!data || !Array.isArray(data)) {
            throw new Error("Data must be an array");
        }
        
        if (data.length === 0) {
            throw new Error("Data array cannot be empty");
        }
        
        const isValid = data.every((item: DataItem, index: number) => {
            if (!item || typeof item !== "object") {
                throw new Error(`Item at index ${index} must be an object`);
            }
            
            if (typeof item.label !== "string") {
                throw new Error(`Item at index ${index} must have a string 'label' property`);
            }
            
            if (!Array.isArray(item.stacks)) {
                throw new Error(`Item at index ${index} must have an array 'stacks' property`);
            }
            
            if (item.stacks.length === 0) {
                throw new Error(`Item at index ${index} must have at least one stack`);
            }
            
            item.stacks.forEach((stack: StackItem, stackIndex: number) => {
                if (typeof stack.value !== "number" || isNaN(stack.value)) {
                    throw new Error(`Stack ${stackIndex} in item ${index} must have a numeric 'value'`);
                }
                
                if (typeof stack.color !== "string") {
                    throw new Error(`Stack ${stackIndex} in item ${index} must have a string 'color'`);
                }
            });
            
            return true;
        });
        
        return isValid;
    }
    
    function aggregateData(data: DataItem[], aggregateBy: AggregationType = "sum"): ProcessedDataItem[] {
        validateData(data);
        
        return data.map((item: DataItem): ProcessedDataItem => {
            let aggregatedValue: number;
            
            switch (aggregateBy) {
                case "sum":
                    aggregatedValue = item.stacks.reduce((sum, stack) => sum + stack.value, 0);
                    break;
                case "average":
                    aggregatedValue = item.stacks.reduce((sum, stack) => sum + stack.value, 0) / item.stacks.length;
                    break;
                case "max":
                    aggregatedValue = Math.max(...item.stacks.map(s => s.value));
                    break;
                case "min":
                    aggregatedValue = Math.min(...item.stacks.map(s => s.value));
                    break;
                default:
                    aggregatedValue = item.stacks.reduce((sum, stack) => sum + stack.value, 0);
            }
            
            return {
                ...item,
                aggregatedValue,
                originalStacks: item.stacks
            };
        });
    }
    
    function sortData(data: DataItem[], sortBy: SortBy = "label", direction: SortDirection = "ascending"): DataItem[] {
        validateData(data);
        
        const sorted = [...data].sort((a: DataItem, b: DataItem) => {
            let valueA: number | string, valueB: number | string;
            
            switch (sortBy) {
                case "label":
                    valueA = a.label.toLowerCase();
                    valueB = b.label.toLowerCase();
                    break;
                case "total":
                    // Calculate total for each item
                    const totalA = a.stacks.reduce((sum, stack) => sum + stack.value, 0);
                    const totalB = b.stacks.reduce((sum, stack) => sum + stack.value, 0);
                    
                    // Smart sorting: use absolute value for comparison to handle decremental waterfalls
                    // This ensures that larger impacts (whether positive or negative) are sorted appropriately
                    valueA = Math.abs(totalA);
                    valueB = Math.abs(totalB);
                    break;
                case "maxStack":
                    valueA = Math.max(...a.stacks.map(s => s.value));
                    valueB = Math.max(...b.stacks.map(s => s.value));
                    break;
                case "minStack":
                    valueA = Math.min(...a.stacks.map(s => s.value));
                    valueB = Math.min(...b.stacks.map(s => s.value));
                    break;
                default:
                    valueA = a.label.toLowerCase();
                    valueB = b.label.toLowerCase();
            }
            
            let comparison: number;
            if (typeof valueA === "string" && typeof valueB === "string") {
                comparison = valueA.localeCompare(valueB);
            } else {
                comparison = (valueA as number) - (valueB as number);
            }
            
            return direction === "ascending" ? comparison : -comparison;
        });
        
        return sorted;
    }
    
    function filterData(data: DataItem[], filterFn: (item: DataItem) => boolean): DataItem[] {
        validateData(data);
        return data.filter(filterFn);
    }
    
    function getDataSummary(data: DataItem[]): DataSummary {
        validateData(data);
        
        const allValues: number[] = [];
        const allColors: string[] = [];
        let totalStacks = 0;
        
        data.forEach(item => {
            item.stacks.forEach(stack => {
                allValues.push(stack.value);
                allColors.push(stack.color);
                totalStacks++;
            });
        });
        
        const valueRange = {
            min: Math.min(...allValues),
            max: Math.max(...allValues)
        };
        
        const cumulativeTotal = allValues.reduce((sum, value) => sum + value, 0);
        const stackColors = [...new Set(allColors)];
        const labels = data.map(item => item.label);
        
        return {
            totalItems: data.length,
            totalStacks,
            valueRange,
            cumulativeTotal,
            stackColors,
            labels
        };
    }
    
    function transformData(data: DataItem[], transformFn: (item: DataItem) => DataItem): DataItem[] {
        validateData(data);
        return data.map(transformFn);
    }
    
    function groupData(data: DataItem[], groupBy: string | ((item: DataItem) => string)): Map<string, DataItem[]> {
        validateData(data);
        
        const groups = new Map<string, DataItem[]>();
        
        data.forEach(item => {
            const key = typeof groupBy === "function" ? groupBy(item) : item.label;
            
            if (!groups.has(key)) {
                groups.set(key, []);
            }
            
            groups.get(key)!.push(item);
        });
        
        return groups;
    }
    
    function transformStacks(data: DataItem[], transformer: (stack: StackItem) => StackItem): DataItem[] {
        if (typeof transformer !== 'function') {
            throw new Error('Transformer must be a function');
        }
        
        return data.map(item => ({
            ...item,
            stacks: item.stacks.map(transformer)
        }));
    }
    
    function normalizeValues(data: DataItem[], targetMax: number): DataItem[] {
        // Find the maximum absolute value across all stacks
        let maxValue = 0;
        data.forEach(item => {
            item.stacks.forEach(stack => {
                maxValue = Math.max(maxValue, Math.abs(stack.value));
            });
        });
        
        if (maxValue === 0) return data;
        
        const scaleFactor = targetMax / maxValue;
        
        return data.map(item => ({
            ...item,
            stacks: item.stacks.map(stack => ({
                ...stack,
                originalValue: stack.value,
                value: stack.value * scaleFactor
            }))
        }));
    }
    
    function groupByCategory(data: DataItem[], categoryFunction: (item: DataItem) => string): { [key: string]: DataItem[] } {
        if (typeof categoryFunction !== 'function') {
            throw new Error('Category function must be a function');
        }
        
        const groups: { [key: string]: DataItem[] } = {};
        
        data.forEach(item => {
            const category = categoryFunction(item);
            if (!groups[category]) {
                groups[category] = [];
            }
            groups[category].push(item);
        });
        
        return groups;
    }
    
    function calculatePercentages(data: DataItem[]): DataItem[] {
        return data.map(item => {
            const total = item.stacks.reduce((sum, stack) => sum + Math.abs(stack.value), 0);
            
            return {
                ...item,
                stacks: item.stacks.map(stack => ({
                    ...stack,
                    percentage: total === 0 ? 0 : (Math.abs(stack.value) / total) * 100
                }))
            };
        });
    }
    
    function interpolateData(data1: DataItem[], data2: DataItem[], t: number): DataItem[] {
        if (data1.length !== data2.length) {
            throw new Error('Data arrays must have the same length');
        }
        
        return data1.map((item1, index) => {
            const item2 = data2[index];
            const minStacks = Math.min(item1.stacks.length, item2.stacks.length);
            
            return {
                label: item1.label,
                stacks: Array.from({ length: minStacks }, (_, i) => ({
                    value: item1.stacks[i].value + (item2.stacks[i].value - item1.stacks[i].value) * t,
                    color: item1.stacks[i].color,
                    label: item1.stacks[i].label
                }))
            };
        });
    }
    
    function generateSampleData(itemCount: number, stacksPerItem: number, valueRange: [number, number] = [10, 100]): DataItem[] {
        const [minValue, maxValue] = valueRange;
        const colors = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'];
        
        return Array.from({ length: itemCount }, (_, i) => ({
            label: `Item ${i + 1}`,
            stacks: Array.from({ length: stacksPerItem }, (_, j) => ({
                value: Math.random() * (maxValue - minValue) + minValue,
                color: colors[j % colors.length],
                label: `Stack ${j + 1}`
            }))
        }));
    }
    
    // === ADVANCED D3.JS DATA OPERATIONS ===
    
    /**
     * Advanced multi-dimensional grouping using D3.js group() API
     * Supports 1-3 levels of nested grouping
     */
    function groupBy<T>(data: T[], ...keys: GroupByKeys<T>): GroupedData<T> | NestedGroupedData<T> {
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
    function rollupBy<T, R>(data: T[], reducer: ReduceFunction<T, R>, ...keys: GroupByKeys<T>): RollupData<R> | NestedRollupData<R> {
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
    function flatRollupBy<T, R>(data: T[], reducer: ReduceFunction<T, R>, ...keys: GroupByKeys<T>): Array<[...any[], R]> {
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
    function crossTabulate<T1, T2, R>(
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
    function indexBy<T>(data: T[], ...keys: GroupByKeys<T>): IndexMap<T> | NestedIndexMap<T> {
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
    function aggregateByTime(data: any[], options: TemporalOptions): DataItem[] {
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
    function createMultiDimensionalWaterfall(
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
    function aggregateWaterfallByPeriod(
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
    function createBreakdownWaterfall(
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

    // Internal wrapper functions for the standalone functions
    async function loadDataWrapper(source: string | any[], options: LoadDataOptions = {}): Promise<DataItem[]> {
        return await loadData(source, options);
    }
    
    function transformToWaterfallFormatWrapper(data: any[], options: TransformOptions = {}): DataItem[] {
        return transformToWaterfallFormat(data, options);
    }

    return {
        // Original methods
        validateData,
        loadData: loadDataWrapper,
        transformToWaterfallFormat: transformToWaterfallFormatWrapper,
        aggregateData,
        sortData,
        filterData,
        getDataSummary,
        transformData,
        groupData,
        transformStacks,
        normalizeValues,
        groupByCategory,
        calculatePercentages,
        interpolateData,
        generateSampleData,
        
        // Advanced D3.js data operations
        groupBy,
        rollupBy,
        flatRollupBy,
        crossTabulate,
        indexBy,
        aggregateByTime,
        createMultiDimensionalWaterfall,
        aggregateWaterfallByPeriod,
        createBreakdownWaterfall
    };
}

// Export a default instance for backward compatibility
export const dataProcessor = createDataProcessor();

// === STANDALONE ADVANCED DATA OPERATION HELPERS ===

/**
 * Create revenue waterfall by grouping sales data by multiple dimensions
 * Example: Group by Region → Product → Channel
 */
export function createRevenueWaterfall(
    salesData: any[],
    dimensions: string[],
    valueField: string = 'revenue'
): DataItem[] {
    return dataProcessor.createMultiDimensionalWaterfall(salesData, dimensions, valueField);
}

/**
 * Aggregate financial data by time periods for waterfall analysis
 * Example: Roll up daily P&L data into monthly waterfall
 */
export function createTemporalWaterfall(
    data: any[],
    timeField: string,
    valueField: string,
    interval: 'day' | 'week' | 'month' | 'quarter' | 'year' = 'month'
): DataItem[] {
    const timeIntervals = {
        day: d3.timeDay,
        week: d3.timeWeek,
        month: d3.timeMonth,
        quarter: d3.timeMonth.every(3)!,
        year: d3.timeYear
    };
    
    return dataProcessor.aggregateByTime(data, {
        timeAccessor: (d) => new Date(d[timeField]),
        valueAccessor: (d) => d[valueField] || 0,
        interval: timeIntervals[interval],
        aggregation: 'sum'
    });
}

/**
 * Create variance analysis waterfall comparing actuals vs budget
 * Shows positive/negative variances as waterfall segments
 */
export function createVarianceWaterfall(
    data: any[],
    categoryField: string,
    actualField: string = 'actual',
    budgetField: string = 'budget'
): DataItem[] {
    return data.map(item => {
        const actual = item[actualField] || 0;
        const budget = item[budgetField] || 0;
        const variance = actual - budget;
        
        return {
            label: item[categoryField],
            stacks: [{
                value: variance,
                color: variance >= 0 ? '#2ecc71' : '#e74c3c',
                label: `Variance: ${variance >= 0 ? '+' : ''}${d3.format('.2f')(variance)}`
            }]
        };
    });
}

/**
 * Advanced data grouping with waterfall-optimized aggregation
 * Supports nested grouping with automatic color assignment
 */
export function groupWaterfallData<T extends Record<string, any>>(
    data: T[],
    groupBy: GroupByFunction<T>[],
    valueAccessor: (item: T) => number,
    labelAccessor?: (item: T) => string
): DataItem[] {
    const grouped = dataProcessor.flatRollupBy(
        data,
        (values) => d3.sum(values, valueAccessor),
        ...groupBy
    );
    
    const colors = ['#3498db', '#2ecc71', '#f39c12', '#e74c3c', '#9b59b6', '#1abc9c', '#34495e', '#95a5a6'];
    
    return grouped.map((item, index) => {
        const keys = item.slice(0, -1); // All but last element
        const value = item[item.length - 1]; // Last element
        const label = labelAccessor && data[0] 
            ? keys.map((key, i) => `${Object.keys(data[0] as object)[i]}: ${key}`).join(' | ')
            : keys.join(' → ');
            
        return {
            label,
            stacks: [{
                value: value as number,
                color: colors[index % colors.length],
                label: `${value >= 0 ? '+' : ''}${d3.format('.2f')(value as number)}`
            }]
        };
    });
}

/**
 * Cross-tabulate two datasets to create comparison waterfall
 * Useful for period-over-period analysis
 */
export function createComparisonWaterfall<T1, T2>(
    currentPeriod: T1[],
    previousPeriod: T2[],
    categoryAccessor: (item: T1 | T2) => string,
    valueAccessor: (item: T1 | T2) => number
): DataItem[] {
    // Index previous period for fast lookup
    const prevIndex = d3.index(previousPeriod, categoryAccessor);
    
    return currentPeriod.map(currentItem => {
        const category = categoryAccessor(currentItem);
        const currentValue = valueAccessor(currentItem);
        const prevItem = prevIndex.get(category);
        const prevValue = prevItem ? valueAccessor(prevItem) : 0;
        const change = currentValue - prevValue;
        
        return {
            label: category,
            stacks: [{
                value: change,
                color: change >= 0 ? '#2ecc71' : '#e74c3c',
                label: `Change: ${change >= 0 ? '+' : ''}${d3.format('.2f')(change)}`
            }]
        };
    });
}

/**
 * Transform flat transaction data into hierarchical waterfall
 * Automatically detects categories and subcategories
 */
export function transformTransactionData(
    transactions: any[],
    categoryField: string,
    subcategoryField?: string,
    valueField: string = 'amount',
    dateField?: string
): DataItem[] {
    if (subcategoryField) {
        // Two-level breakdown
        return dataProcessor.createBreakdownWaterfall(
            transactions,
            categoryField,
            subcategoryField,
            valueField
        );
    } else {
        // Simple category aggregation
        const aggregated = dataProcessor.rollupBy(
            transactions,
            (values) => d3.sum(values, (d: any) => d[valueField] || 0),
            (d: any) => d[categoryField]
        ) as Map<string, number>;
        
        const colors = ['#3498db', '#2ecc71', '#f39c12', '#e74c3c', '#9b59b6'];
        let colorIndex = 0;
        
        return Array.from(aggregated.entries()).map(([category, value]) => ({
            label: String(category),
            stacks: [{
                value: value,
                color: colors[colorIndex++ % colors.length],
                label: `${value >= 0 ? '+' : ''}${d3.format('.2f')(value)}`
            }]
        }));
    }
}

/**
 * Create common financial reducers for rollup operations
 */
export const financialReducers = {
    sum: (values: any[]) => d3.sum(values, (d: any) => d.value || 0),
    average: (values: any[]) => d3.mean(values, (d: any) => d.value || 0) || 0,
    weightedAverage: (values: any[], weightField: string = 'weight') => {
        const totalWeight = d3.sum(values, (d: any) => d[weightField] || 0);
        if (totalWeight === 0) return 0;
        return d3.sum(values, (d: any) => (d.value || 0) * (d[weightField] || 0)) / totalWeight;
    },
    variance: (values: any[]) => {
        const mean = d3.mean(values, (d: any) => d.value || 0) || 0;
        return d3.mean(values, (d: any) => Math.pow((d.value || 0) - mean, 2)) || 0;
    },
    percentile: (p: number) => (values: any[]) => {
        const sorted = values.map((d: any) => d.value || 0).sort(d3.ascending);
        return d3.quantile(sorted, p / 100) || 0;
    }
};

/**
 * Export commonly used D3.js data manipulation functions for convenience
 */
export const d3DataUtils = {
    group: d3.group,
    rollup: d3.rollup,
    flatRollup: d3.flatRollup,
    cross: d3.cross,
    index: d3.index,
    sum: d3.sum,
    mean: d3.mean,
    median: d3.median,
    quantile: d3.quantile,
    min: d3.min,
    max: d3.max,
    extent: d3.extent,
    ascending: d3.ascending,
    descending: d3.descending
};
