// MintWaterfall Data Transforms
import * as d3 from "d3";
import {
    DataItem,
    StackItem,
    ProcessedDataItem,
    LoadDataOptions,
    TransformOptions,
    AggregationType,
    SortDirection,
    SortBy,
    RawDataItem,
    DataSummary,
    validateData,
} from "./validation.js";

export { DataItem, StackItem, ProcessedDataItem, LoadDataOptions, TransformOptions, AggregationType, SortDirection, SortBy, RawDataItem, DataSummary };

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

export function aggregateData(data: DataItem[], aggregateBy: AggregationType = "sum"): ProcessedDataItem[] {
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

export function sortData(data: DataItem[], sortBy: SortBy = "label", direction: SortDirection = "ascending"): DataItem[] {
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

export function filterData(data: DataItem[], filterFn: (item: DataItem) => boolean): DataItem[] {
    validateData(data);
    return data.filter(filterFn);
}

export function transformData(data: DataItem[], transformFn: (item: DataItem) => DataItem): DataItem[] {
    validateData(data);
    return data.map(transformFn);
}

export function groupData(data: DataItem[], groupBy: string | ((item: DataItem) => string)): Map<string, DataItem[]> {
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

export function transformStacks(data: DataItem[], transformer: (stack: StackItem) => StackItem): DataItem[] {
    if (typeof transformer !== 'function') {
        throw new Error('Transformer must be a function');
    }

    return data.map(item => ({
        ...item,
        stacks: item.stacks.map(transformer)
    }));
}

export function normalizeValues(data: DataItem[], targetMax: number): DataItem[] {
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

export function groupByCategory(data: DataItem[], categoryFunction: (item: DataItem) => string): { [key: string]: DataItem[] } {
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

export function calculatePercentages(data: DataItem[]): DataItem[] {
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

export function interpolateData(data1: DataItem[], data2: DataItem[], t: number): DataItem[] {
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

export function generateSampleData(itemCount: number, stacksPerItem: number, valueRange: [number, number] = [10, 100]): DataItem[] {
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
