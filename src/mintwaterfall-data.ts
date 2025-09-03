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

export interface DataProcessor {
    validateData(data: DataItem[]): boolean;
    aggregateData(data: DataItem[], aggregateBy?: AggregationType): ProcessedDataItem[];
    sortData(data: DataItem[], sortBy?: SortBy, direction?: SortDirection): DataItem[];
    filterData(data: DataItem[], filterFn: (item: DataItem) => boolean): DataItem[];
    getDataSummary(data: DataItem[]): DataSummary;
    transformData(data: DataItem[], transformFn: (item: DataItem) => DataItem): DataItem[];
    groupData(data: DataItem[], groupBy: string | ((item: DataItem) => string)): Map<string, DataItem[]>;
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
    
    return {
        validateData,
        aggregateData,
        sortData,
        filterData,
        getDataSummary,
        transformData,
        groupData
    };
}

// Export a default instance for backward compatibility
export const dataProcessor = createDataProcessor();
