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
export declare function loadData(source: string | DataItem[] | RawDataItem[], options?: LoadDataOptions): Promise<DataItem[]>;
export declare function transformToWaterfallFormat(data: any[], options?: TransformOptions): DataItem[];
export interface DataProcessor {
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
//# sourceMappingURL=mintwaterfall-data.d.ts.map