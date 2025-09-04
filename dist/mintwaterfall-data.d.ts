import * as d3 from 'd3';
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
export interface RawDataItem {
    [key: string]: any;
}
export type GroupByFunction<T> = (item: T) => any;
export type GroupByKeys<T> = Array<GroupByFunction<T>>;
export type ReduceFunction<T, R> = (values: T[]) => R;
export type GroupedData<T> = Map<any, T[]>;
export type NestedGroupedData<T> = Map<any, Map<any, T[]>>;
export type RollupData<R> = Map<any, R>;
export type NestedRollupData<R> = Map<any, Map<any, R>>;
export interface CrossTabResult<T1, T2, R> {
    row: T1;
    col: T2;
    value: R;
}
export type IndexMap<T> = Map<any, T>;
export type NestedIndexMap<T> = Map<any, Map<any, T>>;
export interface TemporalOptions {
    timeAccessor: (d: any) => Date;
    valueAccessor: (d: any) => number;
    interval: d3.TimeInterval;
    aggregation?: AggregationType;
}
export interface AdvancedDataOperations {
    groupBy<T>(data: T[], ...keys: GroupByKeys<T>): GroupedData<T> | NestedGroupedData<T>;
    rollupBy<T, R>(data: T[], reducer: ReduceFunction<T, R>, ...keys: GroupByKeys<T>): RollupData<R> | NestedRollupData<R>;
    flatRollupBy<T, R>(data: T[], reducer: ReduceFunction<T, R>, ...keys: GroupByKeys<T>): Array<[...any[], R]>;
    crossTabulate<T1, T2, R>(data1: T1[], data2: T2[], combiner?: (a: T1, b: T2) => R): Array<CrossTabResult<T1, T2, R>>;
    indexBy<T>(data: T[], ...keys: GroupByKeys<T>): IndexMap<T> | NestedIndexMap<T>;
    aggregateByTime(data: any[], options: TemporalOptions): DataItem[];
    createMultiDimensionalWaterfall(data: any[], groupKeys: string[], valueKey: string): DataItem[];
    aggregateWaterfallByPeriod(data: DataItem[], timeKey: string, interval: d3.TimeInterval): DataItem[];
    createBreakdownWaterfall(data: any[], primaryKey: string, breakdownKey: string, valueKey: string): DataItem[];
}
export declare function loadData(source: string | DataItem[] | RawDataItem[], options?: LoadDataOptions): Promise<DataItem[]>;
export declare function transformToWaterfallFormat(data: any[], options?: TransformOptions): DataItem[];
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
    groupByCategory(data: DataItem[], categoryFunction: (item: DataItem) => string): {
        [key: string]: DataItem[];
    };
    calculatePercentages(data: DataItem[]): DataItem[];
    interpolateData(data1: DataItem[], data2: DataItem[], t: number): DataItem[];
    generateSampleData(itemCount: number, stacksPerItem: number, valueRange?: [number, number]): DataItem[];
}
export interface DataSummary {
    totalItems: number;
    totalStacks: number;
    valueRange: {
        min: number;
        max: number;
    };
    cumulativeTotal: number;
    stackColors: string[];
    labels: string[];
}
export declare function createDataProcessor(): DataProcessor;
export declare const dataProcessor: DataProcessor;
/**
 * Create revenue waterfall by grouping sales data by multiple dimensions
 * Example: Group by Region → Product → Channel
 */
export declare function createRevenueWaterfall(salesData: any[], dimensions: string[], valueField?: string): DataItem[];
/**
 * Aggregate financial data by time periods for waterfall analysis
 * Example: Roll up daily P&L data into monthly waterfall
 */
export declare function createTemporalWaterfall(data: any[], timeField: string, valueField: string, interval?: 'day' | 'week' | 'month' | 'quarter' | 'year'): DataItem[];
/**
 * Create variance analysis waterfall comparing actuals vs budget
 * Shows positive/negative variances as waterfall segments
 */
export declare function createVarianceWaterfall(data: any[], categoryField: string, actualField?: string, budgetField?: string): DataItem[];
/**
 * Advanced data grouping with waterfall-optimized aggregation
 * Supports nested grouping with automatic color assignment
 */
export declare function groupWaterfallData<T extends Record<string, any>>(data: T[], groupBy: GroupByFunction<T>[], valueAccessor: (item: T) => number, labelAccessor?: (item: T) => string): DataItem[];
/**
 * Cross-tabulate two datasets to create comparison waterfall
 * Useful for period-over-period analysis
 */
export declare function createComparisonWaterfall<T1, T2>(currentPeriod: T1[], previousPeriod: T2[], categoryAccessor: (item: T1 | T2) => string, valueAccessor: (item: T1 | T2) => number): DataItem[];
/**
 * Transform flat transaction data into hierarchical waterfall
 * Automatically detects categories and subcategories
 */
export declare function transformTransactionData(transactions: any[], categoryField: string, subcategoryField?: string, valueField?: string, dateField?: string): DataItem[];
/**
 * Create common financial reducers for rollup operations
 */
export declare const financialReducers: {
    sum: (values: any[]) => number;
    average: (values: any[]) => number;
    weightedAverage: (values: any[], weightField?: string) => number;
    variance: (values: any[]) => number;
    percentile: (p: number) => (values: any[]) => number;
};
/**
 * Export commonly used D3.js data manipulation functions for convenience
 */
export declare const d3DataUtils: {
    group: typeof d3.group;
    rollup: typeof d3.rollup;
    flatRollup: typeof d3.flatRollup;
    cross: typeof d3.cross;
    index: typeof d3.index;
    sum: typeof d3.sum;
    mean: typeof d3.mean;
    median: typeof d3.median;
    quantile: typeof d3.quantile;
    min: typeof d3.min;
    max: typeof d3.max;
    extent: typeof d3.extent;
    ascending: typeof d3.ascending;
    descending: typeof d3.descending;
};
//# sourceMappingURL=mintwaterfall-data.d.ts.map