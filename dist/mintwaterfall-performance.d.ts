import * as d3 from 'd3';
export interface PerformanceMetrics {
    renderTime: number;
    dataProcessingTime: number;
    memoryUsage: number;
    visibleElements: number;
    totalElements: number;
    fps: number;
    lastFrameTime: number;
    averageFrameTime: number;
    peakMemoryUsage: number;
    renderCalls: number;
}
export interface VirtualizationConfig {
    enabled: boolean;
    chunkSize: number;
    renderThreshold: number;
    bufferSize: number;
    preloadCount: number;
    recycleNodes: boolean;
}
export interface VirtualViewport {
    start: number;
    end: number;
    visible: number[];
    bufferStart: number;
    bufferEnd: number;
}
export interface PerformanceOptimization {
    debouncing: boolean;
    throttling: boolean;
    batchUpdates: boolean;
    memoryPooling: boolean;
    geometryOptimization: boolean;
    cssOptimization: boolean;
}
export interface MemoryPool {
    elements: Map<string, any[]>;
    maxSize: number;
    currentSize: number;
    hitCount: number;
    missCount: number;
}
export interface RenderBatch {
    operations: RenderOperation[];
    priority: number;
    timestamp: number;
    elementCount: number;
}
export interface RenderOperation {
    type: 'create' | 'update' | 'remove' | 'style' | 'attribute';
    element: any;
    data: any;
    properties: Record<string, any>;
}
export interface PerformanceProfiler {
    startTime: number;
    endTime: number;
    samples: number[];
    averageTime: number;
    minTime: number;
    maxTime: number;
}
export interface PerformanceManager {
    enableVirtualization(options?: Partial<VirtualizationConfig>): PerformanceManager;
    disableVirtualization(): PerformanceManager;
    optimizeRendering(container: d3.Selection<d3.BaseType, any, any, any>, data: any[]): PerformanceManager;
    profileOperation(name: string, operation: () => any): any;
    getMetrics(): PerformanceMetrics;
    resetMetrics(): PerformanceManager;
    enableMemoryPooling(options?: Partial<MemoryPool>): PerformanceManager;
    createRenderBatch(): RenderBatch;
    flushRenderBatch(batch: RenderBatch): PerformanceManager;
    setUpdateStrategy(strategy: 'immediate' | 'debounced' | 'throttled' | 'batched'): PerformanceManager;
    getDashboard(): HTMLElement | null;
    enableDashboard(container?: HTMLElement): PerformanceManager;
    disableDashboard(): PerformanceManager;
    optimizeMemory(): PerformanceManager;
    getRecommendations(): string[];
}
export declare function createPerformanceManager(): PerformanceManager;
//# sourceMappingURL=mintwaterfall-performance.d.ts.map