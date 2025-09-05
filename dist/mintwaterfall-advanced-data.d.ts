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
    analyzeSequence(data: any[]): SequenceAnalysis[];
    optimizeDataOrder(data: any[], options: DataOrderingOptions): any[];
    mergeDatasets(datasets: any[][], options: DataMergeOptions): any[];
    generateCustomTicks(domain: [number, number], options: TickGenerationOptions): number[];
    createDataPairs(data: any[], accessor?: (d: any) => any): any[];
    permuteByIndices(data: any[], indices: number[]): any[];
    mergeSimilarItems(data: any[], similarityThreshold: number): any[];
    validateSequentialData(data: any[]): {
        isValid: boolean;
        errors: string[];
    };
    detectDataAnomalies(data: any[]): any[];
    suggestDataOptimizations(data: any[]): string[];
}
export declare function createAdvancedDataProcessor(): AdvancedDataProcessor;
/**
 * Create sequence analysis specifically for waterfall data
 */
export declare function createWaterfallSequenceAnalyzer(data: any[]): {
    flowAnalysis: SequenceAnalysis[];
    cumulativeFlow: Array<{
        step: number;
        cumulative: number;
        change: number;
    }>;
    criticalPaths: string[];
    optimizationSuggestions: string[];
};
/**
 * Create optimized tick generator for waterfall charts
 */
export declare function createWaterfallTickGenerator(domain: [number, number], dataPoints: any[]): {
    ticks: number[];
    labels: string[];
    keyMarkers: number[];
};
//# sourceMappingURL=mintwaterfall-advanced-data.d.ts.map