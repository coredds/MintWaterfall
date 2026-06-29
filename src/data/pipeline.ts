// MintWaterfall Data Pipeline - Composites all sub-modules
import * as d3 from "d3";
import {
    StackItem,
    DataItem,
    ProcessedDataItem,
    LoadDataOptions,
    TransformOptions,
    AggregationType,
    SortDirection,
    SortBy,
    RawDataItem,
    DataSummary,
    validateData,
    getDataSummary,
} from "./validation.js";
import {
    loadData,
    transformToWaterfallFormat,
    aggregateData,
    sortData,
    filterData,
    transformData,
    groupData,
    transformStacks,
    normalizeValues,
    groupByCategory,
    calculatePercentages,
    interpolateData,
    generateSampleData,
} from "./transforms.js";
import {
    AdvancedDataOperations,
    GroupByFunction,
    groupBy,
    rollupBy,
    flatRollupBy,
    crossTabulate,
    indexBy,
    aggregateByTime,
    createMultiDimensionalWaterfall,
    aggregateWaterfallByPeriod,
    createBreakdownWaterfall,
} from "./advanced.js";

// Re-export all types for consumers
export {
    StackItem,
    DataItem,
    ProcessedDataItem,
    LoadDataOptions,
    TransformOptions,
    AggregationType,
    SortDirection,
    SortBy,
    RawDataItem,
    DataSummary,
    AdvancedDataOperations,
    GroupByFunction,
};

export type { TimeScaleOptions, OrdinalScaleOptions, BandScaleOptions } from "./validation.js";

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

export function createDataProcessor(): DataProcessor {

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
