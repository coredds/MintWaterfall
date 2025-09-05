// MintWaterfall Advanced Data Manipulation Utilities
// Enhanced D3.js data manipulation capabilities for comprehensive waterfall analysis

import * as d3 from 'd3';

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
// ADVANCED DATA PROCESSOR IMPLEMENTATION
// ============================================================================

export function createAdvancedDataProcessor(): AdvancedDataProcessor {
    
    // ========================================================================
    // SEQUENCE ANALYSIS (d3.pairs)
    // ========================================================================
    
    /**
     * Analyze sequential relationships in waterfall data
     * Uses d3.pairs() to understand flow between consecutive items
     */
    function analyzeSequence(data: any[]): SequenceAnalysis[] {
        if (!Array.isArray(data) || data.length < 2) {
            return [];
        }
        
        // Extract values for analysis
        const values = data.map(d => {
            if (typeof d === 'number') return d;
            if (d.value !== undefined) return d.value;
            if (d.stacks && Array.isArray(d.stacks)) {
                return d.stacks.reduce((sum: number, stack: any) => sum + (stack.value || 0), 0);
            }
            return 0;
        });
        
        // Use d3.pairs() for sequential analysis
        const sequences: SequenceAnalysis[] = d3.pairs(data, (a: any, b: any) => {
            const aValue = extractValue(a);
            const bValue = extractValue(b);
            const change = bValue - aValue;
            const changePercent = aValue !== 0 ? (change / Math.abs(aValue)) * 100 : 0;
            
            // Determine change direction
            let changeDirection: 'increase' | 'decrease' | 'neutral';
            if (Math.abs(change) < 0.01) changeDirection = 'neutral';
            else if (change > 0) changeDirection = 'increase';
            else changeDirection = 'decrease';
            
            // Determine magnitude
            const absChangePercent = Math.abs(changePercent);
            let magnitude: 'small' | 'medium' | 'large';
            if (absChangePercent < 5) magnitude = 'small';
            else if (absChangePercent < 20) magnitude = 'medium';
            else magnitude = 'large';
            
            return {
                from: getLabel(a),
                to: getLabel(b),
                change,
                changePercent,
                changeDirection,
                magnitude
            };
        });
        
        return sequences;
    }
    
    // ========================================================================
    // DATA REORDERING (d3.permute)
    // ========================================================================
    
    /**
     * Optimize data ordering for better waterfall visualization
     * Uses d3.permute() with intelligent sorting strategies
     */
    function optimizeDataOrder(data: any[], options: DataOrderingOptions): any[] {
        if (!Array.isArray(data) || data.length === 0) {
            return data;
        }
        
        const { field, direction, strategy, groupBy } = options;
        
        // Create sorting indices based on strategy
        let indices: number[];
        
        switch (strategy) {
            case 'value':
                indices = d3.range(data.length).sort((i, j) => {
                    const aValue = extractValue(data[i]);
                    const bValue = extractValue(data[j]);
                    return direction === 'ascending' ? 
                        d3.ascending(aValue, bValue) : 
                        d3.descending(aValue, bValue);
                });
                break;
                
            case 'cumulative':
                // Sort by cumulative impact on waterfall
                const cumulativeValues = calculateCumulativeValues(data);
                indices = d3.range(data.length).sort((i, j) => {
                    return direction === 'ascending' ? 
                        d3.ascending(cumulativeValues[i], cumulativeValues[j]) : 
                        d3.descending(cumulativeValues[i], cumulativeValues[j]);
                });
                break;
                
            case 'magnitude':
                indices = d3.range(data.length).sort((i, j) => {
                    const aMagnitude = Math.abs(extractValue(data[i]));
                    const bMagnitude = Math.abs(extractValue(data[j]));
                    return direction === 'ascending' ? 
                        d3.ascending(aMagnitude, bMagnitude) : 
                        d3.descending(aMagnitude, bMagnitude);
                });
                break;
                
            case 'alphabetical':
                indices = d3.range(data.length).sort((i, j) => {
                    const aLabel = getLabel(data[i]);
                    const bLabel = getLabel(data[j]);
                    return direction === 'ascending' ? 
                        d3.ascending(aLabel, bLabel) : 
                        d3.descending(aLabel, bLabel);
                });
                break;
                
            default:
                return data; // No reordering
        }
        
        // Use d3.permute() to reorder data
        return d3.permute(data, indices);
    }
    
    // ========================================================================
    // DATASET MERGING (d3.merge)
    // ========================================================================
    
    /**
     * Merge multiple datasets with sophisticated conflict resolution
     * Uses d3.merge() with custom merge strategies
     */
    function mergeDatasets(datasets: any[][], options: DataMergeOptions): any[] {
        if (!Array.isArray(datasets) || datasets.length === 0) {
            return [];
        }
        
        const { mergeStrategy, conflictResolution, keyField, valueField } = options;
        
        // Use d3.merge() to combine all datasets
        const flatData = d3.merge(datasets);
        
        // Group by key field for conflict resolution
        const grouped = d3.group(flatData, (d: any) => d[keyField] || getLabel(d));
        
        // Resolve conflicts and merge
        const mergedData: any[] = [];
        
        for (const [key, items] of grouped) {
            if (items.length === 1) {
                mergedData.push(items[0]);
                continue;
            }
            
            // Handle conflicts with multiple items
            let mergedItem: any;
            
            switch (mergeStrategy) {
                case 'combine':
                    mergedItem = combineItems(items, valueField);
                    break;
                    
                case 'override':
                    mergedItem = resolveConflict(items, conflictResolution);
                    break;
                    
                case 'average':
                    mergedItem = averageItems(items, valueField);
                    break;
                    
                case 'sum':
                    mergedItem = sumItems(items, valueField);
                    break;
                    
                default:
                    mergedItem = items[0];
            }
            
            mergedData.push(mergedItem);
        }
        
        return mergedData;
    }
    
    // ========================================================================
    // CUSTOM TICK GENERATION (d3.ticks)
    // ========================================================================
    
    /**
     * Generate custom axis ticks with advanced options
     * Uses d3.ticks() with intelligent tick selection
     */
    function generateCustomTicks(domain: [number, number], options: TickGenerationOptions): number[] {
        const {
            count = 10,
            step,
            nice = true,
            threshold = 0,
            includeZero = true
        } = options;
        
        let [min, max] = domain;
        
        // Apply nice scaling if requested
        if (nice) {
            const scale = d3.scaleLinear().domain([min, max]).nice();
            [min, max] = scale.domain() as [number, number];
        }
        
        // Generate base ticks using d3.ticks()
        let ticks: number[];
        
        if (step !== undefined) {
            // Use custom step
            ticks = d3.ticks(min, max, Math.abs(max - min) / step);
        } else {
            // Use count-based generation
            ticks = d3.ticks(min, max, count);
        }
        
        // Apply threshold filtering
        if (threshold > 0) {
            ticks = ticks.filter(tick => Math.abs(tick) >= threshold);
        }
        
        // Ensure zero is included if requested
        if (includeZero && !ticks.includes(0) && min <= 0 && max >= 0) {
            ticks.push(0);
            ticks.sort(d3.ascending);
        }
        
        return ticks;
    }
    
    // ========================================================================
    // UTILITY FUNCTIONS
    // ========================================================================
    
    function createDataPairs(data: any[], accessor?: (d: any) => any): any[] {
        if (accessor) {
            return d3.pairs(data, (a, b) => ({ a: accessor(a), b: accessor(b) }));
        }
        return d3.pairs(data);
    }
    
    function permuteByIndices(data: any[], indices: number[]): any[] {
        return d3.permute(data, indices);
    }
    
    function mergeSimilarItems(data: any[], similarityThreshold: number): any[] {
        // Group similar items and merge them
        const groups: any[][] = [];
        const used = new Set<number>();
        
        for (let i = 0; i < data.length; i++) {
            if (used.has(i)) continue;
            
            const group = [data[i]];
            used.add(i);
            
            for (let j = i + 1; j < data.length; j++) {
                if (used.has(j)) continue;
                
                const similarity = calculateSimilarity(data[i], data[j]);
                if (similarity >= similarityThreshold) {
                    group.push(data[j]);
                    used.add(j);
                }
            }
            
            groups.push(group);
        }
        
        // Merge groups using d3.merge()
        return groups.map(group => {
            if (group.length === 1) return group[0];
            return mergeGroupItems(group);
        });
    }
    
    function validateSequentialData(data: any[]): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];
        
        if (!Array.isArray(data)) {
            errors.push("Data must be an array");
            return { isValid: false, errors };
        }
        
        if (data.length < 2) {
            errors.push("Data must have at least 2 items for sequence analysis");
        }
        
        // Check for valid values
        const invalidItems = data.filter((d, i) => {
            const value = extractValue(d);
            return isNaN(value) || !isFinite(value);
        });
        
        if (invalidItems.length > 0) {
            errors.push(`Found ${invalidItems.length} items with invalid values`);
        }
        
        // Check for duplicate labels
        const labels = data.map(getLabel);
        const uniqueLabels = new Set(labels);
        if (labels.length !== uniqueLabels.size) {
            errors.push("Duplicate labels detected - may cause confusion in sequence analysis");
        }
        
        return { isValid: errors.length === 0, errors };
    }
    
    function detectDataAnomalies(data: any[]): any[] {
        const values = data.map(extractValue);
        const mean = d3.mean(values) || 0;
        const deviation = d3.deviation(values) || 0;
        const threshold = 2 * deviation; // 2-sigma rule
        
        return data.filter((d, i) => {
            const value = values[i];
            return Math.abs(value - mean) > threshold;
        });
    }
    
    function suggestDataOptimizations(data: any[]): string[] {
        const suggestions: string[] = [];
        
        // Analyze data characteristics
        const values = data.map(extractValue);
        const sequences = analyzeSequence(data);
        
        // Check for optimization opportunities
        if (values.some(v => v === 0)) {
            suggestions.push("Consider removing or combining zero-value items");
        }
        
        const smallChanges = sequences.filter(s => s.magnitude === 'small').length;
        if (smallChanges > data.length * 0.3) {
            suggestions.push("Many small changes detected - consider grouping similar items");
        }
        
        const alternatingPattern = hasAlternatingPattern(values);
        if (alternatingPattern) {
            suggestions.push("Alternating positive/negative pattern detected - consider reordering by magnitude");
        }
        
        if (data.length > 20) {
            suggestions.push("Large dataset - consider using hierarchical grouping or filtering");
        }
        
        return suggestions;
    }
    
    // ========================================================================
    // HELPER FUNCTIONS
    // ========================================================================
    
    function extractValue(item: any): number {
        if (typeof item === 'number') return item;
        if (item.value !== undefined) return item.value;
        if (item.stacks && Array.isArray(item.stacks)) {
            return item.stacks.reduce((sum: number, stack: any) => sum + (stack.value || 0), 0);
        }
        return 0;
    }
    
    function getLabel(item: any): string {
        if (typeof item === 'string') return item;
        if (item.label !== undefined) return item.label;
        if (item.name !== undefined) return item.name;
        return 'Unnamed';
    }
    
    function calculateCumulativeValues(data: any[]): number[] {
        const values = data.map(extractValue);
        const cumulative: number[] = [];
        let running = 0;
        
        for (const value of values) {
            running += value;
            cumulative.push(running);
        }
        
        return cumulative;
    }
    
    function combineItems(items: any[], valueField: string): any {
        const combined = { ...items[0] };
        const totalValue = items.reduce((sum, item) => sum + extractValue(item), 0);
        
        if (combined.value !== undefined) combined.value = totalValue;
        if (combined[valueField] !== undefined) combined[valueField] = totalValue;
        
        // Combine stacks if present
        if (combined.stacks) {
            combined.stacks = items.flatMap(item => item.stacks || []);
        }
        
        return combined;
    }
    
    function resolveConflict(items: any[], strategy: string): any {
        switch (strategy) {
            case 'first': return items[0];
            case 'last': return items[items.length - 1];
            case 'max': return items.reduce((max, item) => extractValue(item) > extractValue(max) ? item : max);
            case 'min': return items.reduce((min, item) => extractValue(item) < extractValue(min) ? item : min);
            default: return items[0];
        }
    }
    
    function averageItems(items: any[], valueField: string): any {
        const averaged = { ...items[0] };
        const avgValue = d3.mean(items, extractValue) || 0;
        
        if (averaged.value !== undefined) averaged.value = avgValue;
        if (averaged[valueField] !== undefined) averaged[valueField] = avgValue;
        
        return averaged;
    }
    
    function sumItems(items: any[], valueField: string): any {
        const summed = { ...items[0] };
        const totalValue = d3.sum(items, extractValue);
        
        if (summed.value !== undefined) summed.value = totalValue;
        if (summed[valueField] !== undefined) summed[valueField] = totalValue;
        
        return summed;
    }
    
    function calculateSimilarity(a: any, b: any): number {
        const valueA = extractValue(a);
        const valueB = extractValue(b);
        const labelA = getLabel(a);
        const labelB = getLabel(b);
        
        // Simple similarity based on value proximity and label similarity
        const valueSim = 1 - Math.abs(valueA - valueB) / (Math.abs(valueA) + Math.abs(valueB) + 1);
        const labelSim = labelA === labelB ? 1 : 0;
        
        return (valueSim + labelSim) / 2;
    }
    
    function mergeGroupItems(group: any[]): any {
        return combineItems(group, 'value');
    }
    
    function hasAlternatingPattern(values: number[]): boolean {
        if (values.length < 3) return false;
        
        let alternating = 0;
        for (let i = 1; i < values.length - 1; i++) {
            const prev = values[i - 1];
            const curr = values[i];
            const next = values[i + 1];
            
            if ((prev > 0 && curr < 0 && next > 0) || (prev < 0 && curr > 0 && next < 0)) {
                alternating++;
            }
        }
        
        return alternating > values.length * 0.3;
    }
    
    // ========================================================================
    // RETURN PROCESSOR INTERFACE
    // ========================================================================
    
    return {
        analyzeSequence,
        optimizeDataOrder,
        mergeDatasets,
        generateCustomTicks,
        createDataPairs,
        permuteByIndices,
        mergeSimilarItems,
        validateSequentialData,
        detectDataAnomalies,
        suggestDataOptimizations
    };
}

// ============================================================================
// SPECIALIZED WATERFALL UTILITIES
// ============================================================================

/**
 * Create sequence analysis specifically for waterfall data
 */
export function createWaterfallSequenceAnalyzer(data: any[]): {
    flowAnalysis: SequenceAnalysis[];
    cumulativeFlow: Array<{step: number, cumulative: number, change: number}>;
    criticalPaths: string[];
    optimizationSuggestions: string[];
} {
    const processor = createAdvancedDataProcessor();
    const flowAnalysis = processor.analyzeSequence(data);
    
    // Calculate cumulative flow
    const cumulativeFlow: Array<{step: number, cumulative: number, change: number}> = [];
    let cumulative = 0;
    
    data.forEach((item, index) => {
        const value = extractValue(item);
        cumulative += value;
        cumulativeFlow.push({
            step: index,
            cumulative,
            change: value
        });
    });
    
    // Identify critical paths (large impact changes)
    const criticalPaths = flowAnalysis
        .filter(seq => seq.magnitude === 'large')
        .map(seq => `${seq.from} → ${seq.to}`);
    
    // Generate optimization suggestions
    const optimizationSuggestions = processor.suggestDataOptimizations(data);
    
    return {
        flowAnalysis,
        cumulativeFlow,
        criticalPaths,
        optimizationSuggestions
    };
    
    function extractValue(item: any): number {
        if (typeof item === 'number') return item;
        if (item.value !== undefined) return item.value;
        if (item.stacks && Array.isArray(item.stacks)) {
            return item.stacks.reduce((sum: number, stack: any) => sum + (stack.value || 0), 0);
        }
        return 0;
    }
}

/**
 * Create optimized tick generator for waterfall charts
 */
export function createWaterfallTickGenerator(domain: [number, number], dataPoints: any[]): {
    ticks: number[];
    labels: string[];
    keyMarkers: number[];
} {
    const processor = createAdvancedDataProcessor();
    
    // Generate base ticks
    const ticks = processor.generateCustomTicks(domain, {
        count: 8,
        nice: true,
        includeZero: true,
        threshold: Math.abs(domain[1] - domain[0]) / 100
    });
    
    // Generate labels
    const labels = ticks.map(tick => {
        if (tick === 0) return '0';
        if (Math.abs(tick) >= 1000000) return `${(tick / 1000000).toFixed(1)}M`;
        if (Math.abs(tick) >= 1000) return `${(tick / 1000).toFixed(1)}K`;
        return tick.toFixed(0);
    });
    
    // Identify key markers (data points that align with ticks)
    const keyMarkers = ticks.filter(tick => {
        return dataPoints.some(d => Math.abs(extractValue(d) - tick) < Math.abs(domain[1] - domain[0]) / 50);
    });
    
    return { ticks, labels, keyMarkers };
    
    function extractValue(item: any): number {
        if (typeof item === 'number') return item;
        if (item.value !== undefined) return item.value;
        if (item.stacks && Array.isArray(item.stacks)) {
            return item.stacks.reduce((sum: number, stack: any) => sum + (stack.value || 0), 0);
        }
        return 0;
    }
}
