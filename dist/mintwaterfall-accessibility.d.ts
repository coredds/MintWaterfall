import * as d3 from 'd3';
export interface AccessibilityConfig {
    title?: string;
    summary?: string;
    totalItems?: number;
    showTotal?: boolean;
    formatNumber?: (n: number) => string;
}
export interface WaterfallDataItem {
    label: string;
    stacks: StackItem[];
    cumulative?: number;
}
export interface StackItem {
    label?: string;
    value: number;
}
export interface HierarchicalData {
    children?: HierarchicalData[];
    value?: number;
}
export interface ContrastResult {
    ratio: number;
    passesAA: boolean;
    passesAAA: boolean;
}
export interface AccessibilityResult {
    bars: d3.Selection<d3.BaseType, any, any, any>;
    focusableElements: number;
}
export interface ChartAccessibilityResult {
    accessibilitySystem: AccessibilitySystem;
    descriptionId: string;
    focusableElements: number;
}
export interface AccessibilitySystem {
    createLiveRegion(container: d3.Selection<d3.BaseType, any, any, any>): d3.Selection<HTMLDivElement, any, any, any>;
    createChartDescription(container: d3.Selection<d3.BaseType, any, any, any>, data: WaterfallDataItem[] | HierarchicalData, config?: AccessibilityConfig): string;
    makeAccessible(chartContainer: d3.Selection<d3.BaseType, any, any, any>, data: WaterfallDataItem[], config?: AccessibilityConfig): AccessibilityResult;
    handleChartKeydown(event: KeyboardEvent, data: WaterfallDataItem[], config: AccessibilityConfig): void;
    handleBarKeydown(event: KeyboardEvent, barData: WaterfallDataItem, index: number, allData: WaterfallDataItem[], config: AccessibilityConfig): void;
    moveFocus(direction: number, data: WaterfallDataItem[], config: AccessibilityConfig): void;
    focusElement(index: number, data: WaterfallDataItem[], config: AccessibilityConfig): void;
    announce(message: string): void;
    detectHighContrast(): boolean;
    applyHighContrastStyles(chartContainer: d3.Selection<d3.BaseType, any, any, any>): void;
    injectForcedColorsCSS(): void;
    respectsReducedMotion(): boolean;
    getAccessibleAnimationDuration(defaultDuration: number): number;
    validateColorContrast(foreground: string, background: string): ContrastResult;
    setAnnounceFunction(fn: (message: string) => void): AccessibilitySystem;
    getCurrentFocus(): number;
    getFocusableCount(): number;
}
export declare function createAccessibilitySystem(): AccessibilitySystem;
export declare const accessibilitySystem: AccessibilitySystem;
export declare function makeChartAccessible(chartContainer: d3.Selection<d3.BaseType, any, any, any>, data: WaterfallDataItem[], config?: AccessibilityConfig): ChartAccessibilityResult;
export default createAccessibilitySystem;
//# sourceMappingURL=mintwaterfall-accessibility.d.ts.map