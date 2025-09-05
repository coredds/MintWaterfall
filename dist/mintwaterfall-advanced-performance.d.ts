import * as d3 from 'd3';
export interface QuadTreeNode {
    x: number;
    y: number;
    data: any;
    index: number;
}
export interface VirtualScrollConfig {
    containerHeight: number;
    itemHeight: number;
    overscan: number;
    threshold: number;
}
export interface PerformanceMetrics {
    renderTime: number;
    dataProcessingTime: number;
    memoryUsage: number;
    frameRate: number;
    itemsRendered: number;
    totalItems: number;
    virtualizationActive: boolean;
}
export interface SpatialIndex {
    quadTree: d3.Quadtree<QuadTreeNode>;
    search(x: number, y: number, radius?: number): QuadTreeNode[];
    findNearest(x: number, y: number): QuadTreeNode | undefined;
    add(node: QuadTreeNode): void;
    remove(node: QuadTreeNode): void;
    clear(): void;
    size(): number;
}
export interface VirtualScrollManager {
    getVisibleRange(scrollTop: number): {
        start: number;
        end: number;
    };
    getVirtualizedData<T>(data: T[], scrollTop: number): {
        visibleData: T[];
        offsetY: number;
        totalHeight: number;
        metrics: PerformanceMetrics;
    };
    updateConfig(config: Partial<VirtualScrollConfig>): void;
    destroy(): void;
}
export interface CanvasRenderer {
    render(data: any[], scales: any): void;
    clear(): void;
    getCanvas(): HTMLCanvasElement;
    setDimensions(width: number, height: number): void;
    enableHighDPI(): void;
}
export interface AdvancedPerformanceSystem {
    createSpatialIndex(): SpatialIndex;
    createVirtualScrollManager(config: VirtualScrollConfig): VirtualScrollManager;
    createCanvasRenderer(container: HTMLElement): CanvasRenderer;
    createPerformanceMonitor(): PerformanceMonitor;
    optimizeDataForRendering<T>(data: T[], maxItems?: number): T[];
    createDataSampler<T>(strategy: 'uniform' | 'random' | 'importance'): (data: T[], count: number) => T[];
}
export interface PerformanceMonitor {
    startTiming(label: string): void;
    endTiming(label: string): number;
    getMetrics(): PerformanceMetrics;
    getMemoryUsage(): number;
    trackFrameRate(): void;
    generateReport(): string;
}
export declare function createAdvancedPerformanceSystem(): AdvancedPerformanceSystem;
/**
 * Create optimized spatial index for waterfall chart interactions
 * Enables O(log n) hover detection for large datasets
 */
export declare function createWaterfallSpatialIndex(data: Array<{
    label: string;
    value: number;
}>, xScale: any, yScale: any): SpatialIndex;
/**
 * Create high-performance virtual waterfall renderer
 * Handles thousands of data points with smooth scrolling
 */
export declare function createVirtualWaterfallRenderer(container: HTMLElement, config: VirtualScrollConfig): {
    virtualScrollManager: VirtualScrollManager;
    performanceMonitor: PerformanceMonitor;
    render: (data: any[], scrollTop: number) => void;
};
export default createAdvancedPerformanceSystem;
//# sourceMappingURL=mintwaterfall-advanced-performance.d.ts.map