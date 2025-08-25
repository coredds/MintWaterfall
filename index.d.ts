// TypeScript definitions for MintWaterfall v0.5.6
// Project: https://github.com/your-username/mintwaterfall
// Definitions by: MintWaterfall Team

export interface StackData {
    value: number;
    color: string;
    label: string;
}

export interface ChartData {
    label: string;
    stacks: StackData[];
}

export interface WaterfallChart {
    // Core configuration methods
    width(): number;
    width(value: number): WaterfallChart;
    
    height(): number;
    height(value: number): WaterfallChart;
    
    margin(): { top: number; right: number; bottom: number; left: number };
    margin(value: { top: number; right: number; bottom: number; left: number }): WaterfallChart;
    
    // Data and display options
    stacked(): boolean;
    stacked(value: boolean): WaterfallChart;
    
    showTotal(): boolean;
    showTotal(value: boolean): WaterfallChart;
    
    totalLabel(): string;
    totalLabel(value: string): WaterfallChart;
    
    totalColor(): string;
    totalColor(value: string): WaterfallChart;
    
    // Animation and transitions
    duration(): number;
    duration(value: number): WaterfallChart;
    
    ease(): any; // d3.EasingFunction
    ease(value: any): WaterfallChart;
    
    // Interactive Features
    accessibility(): boolean;
    accessibility(value: boolean): WaterfallChart;
    
    tooltips(): boolean;
    tooltips(value: boolean): WaterfallChart;
    
    tooltipConfig(): any;
    tooltipConfig(value: any): WaterfallChart;
    
    export(format?: string, options?: any): any;
    exportConfig(): any;
    exportConfig(value: any): WaterfallChart;
    
    // Enhanced features
    enableBrush(): boolean;
    enableBrush(value: boolean): WaterfallChart;
    
    staggeredAnimations(): boolean;
    staggeredAnimations(value: boolean): WaterfallChart;
    
    staggerDelay(): number;
    staggerDelay(value: number): WaterfallChart;
    
    scaleType(): string;
    scaleType(value: string): WaterfallChart;
    
    // Event handling
    on(event: string, handler: BarEventHandler): WaterfallChart;
    on(event: string, handler: null): WaterfallChart;
    
    // Rendering
    (selection: any): void; // d3.Selection
}

export interface BarEventHandler {
    (event: Event, data: ChartData): void;
}

// Main chart factory function
export declare function waterfallChart(): WaterfallChart;

// Theme system
export declare const themes: {
    [key: string]: {
        colors: string[];
        totalColor: string;
        backgroundColor?: string;
        textColor?: string;
    };
};

export declare function applyTheme(themeName: string): any;

// Data processing utilities
export declare const dataProcessor: {
    processData(data: ChartData[]): any;
    calculateTotals(data: ChartData[]): number[];
    sortData(data: ChartData[], sortBy: string, order: 'ascending' | 'descending'): ChartData[];
    normalizeValues(data: ChartData[], maxValue: number): ChartData[];
    filterData(data: ChartData[], predicate: (item: ChartData) => boolean): ChartData[];
    aggregateData(data: ChartData[], groupBy: string): ChartData[];
};

// Animation system
export declare const animationSystem: {
    createStaggeredAnimation(selection: any, delay: number): any;
    createBounceAnimation(selection: any): any;
    createElasticAnimation(selection: any): any;
    respectsReducedMotion(): boolean;
};

// Interactive Features
export declare function createAccessibilitySystem(): any;
export declare function createTooltipSystem(): any;
export declare function createExportSystem(): any;

export declare const accessibilitySystem: any;
export declare const tooltip: any;
export declare const exportSystem: any;

// Utility functions
export declare function makeChartAccessible(chart: any, data: ChartData[]): void;
export declare function createChartTooltip(config?: any): any;
export declare function addExportToChart(chart: any, data: ChartData[]): void;

// Enhanced features
export declare const brushSystem: any;
export declare const scaleSystem: any;

// Version
export declare const version: string;
