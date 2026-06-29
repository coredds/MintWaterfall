// MintWaterfall Data Validation

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
    tickFormat?: string | "auto";
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

export type AggregationType = "sum" | "average" | "max" | "min";
export type SortDirection = "ascending" | "descending";
export type SortBy = "label" | "total" | "maxStack" | "minStack";

export interface RawDataItem {
    [key: string]: any;
}

export interface DataSummary {
    totalItems: number;
    totalStacks: number;
    valueRange: { min: number; max: number };
    cumulativeTotal: number;
    stackColors: string[];
    labels: string[];
}

export function validateData(data: DataItem[]): boolean {
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

export function getDataSummary(data: DataItem[]): DataSummary {
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
    return {
        totalItems: data.length,
        totalStacks,
        valueRange: { min: Math.min(...allValues), max: Math.max(...allValues) },
        cumulativeTotal: allValues.reduce((sum, value) => sum + value, 0),
        stackColors: [...new Set(allColors)],
        labels: data.map(item => item.label),
    };
}
