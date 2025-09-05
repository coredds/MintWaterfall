// MintWaterfall Advanced Performance Optimization - TypeScript Version
// Provides high-performance features for handling large datasets with D3.js optimization

import * as d3 from 'd3';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface QuadTreeNode {
    x: number;
    y: number;
    data: any;
    index: number;
}

export interface VirtualScrollConfig {
    containerHeight: number;
    itemHeight: number;
    overscan: number; // Number of items to render outside visible area
    threshold: number; // Minimum items before virtualization kicks in
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
    getVisibleRange(scrollTop: number): { start: number; end: number };
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
    // Spatial indexing
    createSpatialIndex(): SpatialIndex;
    
    // Virtual scrolling
    createVirtualScrollManager(config: VirtualScrollConfig): VirtualScrollManager;
    
    // Canvas rendering
    createCanvasRenderer(container: HTMLElement): CanvasRenderer;
    
    // Performance monitoring
    createPerformanceMonitor(): PerformanceMonitor;
    
    // Data optimization
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

// ============================================================================
// SPATIAL INDEXING IMPLEMENTATION
// ============================================================================

function createSpatialIndexImpl(): SpatialIndex {
    let quadTree = d3.quadtree<QuadTreeNode>()
        .x(d => d.x)
        .y(d => d.y);

    function search(x: number, y: number, radius: number = 10): QuadTreeNode[] {
        const results: QuadTreeNode[] = [];
        
        quadTree.visit((node, x1, y1, x2, y2) => {
            if (!node.length) {
                // Leaf node
                const leaf = node as any;
                if (leaf.data) {
                    const distance = Math.sqrt(
                        Math.pow(leaf.data.x - x, 2) + Math.pow(leaf.data.y - y, 2)
                    );
                    if (distance <= radius) {
                        results.push(leaf.data);
                    }
                }
            }
            // Continue search if bounds intersect with search radius
            return x1 > x + radius || y1 > y + radius || x2 < x - radius || y2 < y - radius;
        });

        return results;
    }

    function findNearest(x: number, y: number): QuadTreeNode | undefined {
        return quadTree.find(x, y);
    }

    function add(node: QuadTreeNode): void {
        quadTree.add(node);
    }

    function remove(node: QuadTreeNode): void {
        quadTree.remove(node);
    }

    function clear(): void {
        quadTree = d3.quadtree<QuadTreeNode>()
            .x(d => d.x)
            .y(d => d.y);
    }

    function size(): number {
        let count = 0;
        quadTree.visit(() => {
            count++;
            return false;
        });
        return count;
    }

    return {
        quadTree,
        search,
        findNearest,
        add,
        remove,
        clear,
        size
    };
}

// ============================================================================
// VIRTUAL SCROLLING IMPLEMENTATION
// ============================================================================

function createVirtualScrollManagerImpl(config: VirtualScrollConfig): VirtualScrollManager {
    let currentConfig = { ...config };
    let lastRenderTime = 0;
    let frameCount = 0;
    let frameRate = 60;

    function getVisibleRange(scrollTop: number): { start: number; end: number } {
        const visibleStart = Math.floor(scrollTop / currentConfig.itemHeight);
        const visibleEnd = Math.ceil(
            (scrollTop + currentConfig.containerHeight) / currentConfig.itemHeight
        );

        // Add overscan
        const start = Math.max(0, visibleStart - currentConfig.overscan);
        const end = visibleEnd + currentConfig.overscan;

        return { start, end };
    }

    function getVirtualizedData<T>(data: T[], scrollTop: number): {
        visibleData: T[];
        offsetY: number;
        totalHeight: number;
        metrics: PerformanceMetrics;
    } {
        const startTime = performance.now();

        // Check if virtualization should be active
        const virtualizationActive = data.length >= currentConfig.threshold;

        if (!virtualizationActive) {
            const endTime = performance.now();
            return {
                visibleData: data,
                offsetY: 0,
                totalHeight: data.length * currentConfig.itemHeight,
                metrics: {
                    renderTime: endTime - startTime,
                    dataProcessingTime: endTime - startTime,
                    memoryUsage: getMemoryUsage(),
                    frameRate,
                    itemsRendered: data.length,
                    totalItems: data.length,
                    virtualizationActive: false
                }
            };
        }

        const { start, end } = getVisibleRange(scrollTop);
        const visibleData = data.slice(start, Math.min(end, data.length));
        const offsetY = start * currentConfig.itemHeight;
        const totalHeight = data.length * currentConfig.itemHeight;

        const endTime = performance.now();

        // Update frame rate calculation
        frameCount++;
        if (frameCount % 60 === 0) {
            const now = performance.now();
            if (lastRenderTime > 0) {
                frameRate = 60000 / (now - lastRenderTime);
            }
            lastRenderTime = now;
        }

        return {
            visibleData,
            offsetY,
            totalHeight,
            metrics: {
                renderTime: endTime - startTime,
                dataProcessingTime: endTime - startTime,
                memoryUsage: getMemoryUsage(),
                frameRate,
                itemsRendered: visibleData.length,
                totalItems: data.length,
                virtualizationActive: true
            }
        };
    }

    function updateConfig(newConfig: Partial<VirtualScrollConfig>): void {
        currentConfig = { ...currentConfig, ...newConfig };
    }

    function destroy(): void {
        // Cleanup if needed
    }

    return {
        getVisibleRange,
        getVirtualizedData,
        updateConfig,
        destroy
    };
}

// ============================================================================
// CANVAS RENDERING IMPLEMENTATION
// ============================================================================

function createCanvasRendererImpl(container: HTMLElement): CanvasRenderer {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    
    container.appendChild(canvas);

    function render(data: any[], scales: any): void {
        const { xScale, yScale } = scales;
        
        // Clear canvas
        context.clearRect(0, 0, canvas.width, canvas.height);

        // Set drawing properties for better performance
        context.save();
        
        // Render data points efficiently
        data.forEach((item, index) => {
            const x = xScale(item.label) || 0;
            const y = yScale(item.value) || 0;
            const width = xScale.bandwidth ? xScale.bandwidth() : 20;
            const height = Math.abs(yScale(0) - y);

            // Use fillRect for better performance than path operations
            context.fillStyle = item.color || '#3498db';
            context.fillRect(x, Math.min(y, yScale(0)), width, height);

            // Add border if needed
            context.strokeStyle = '#ffffff';
            context.lineWidth = 1;
            context.strokeRect(x, Math.min(y, yScale(0)), width, height);
        });

        context.restore();
    }

    function clear(): void {
        context.clearRect(0, 0, canvas.width, canvas.height);
    }

    function getCanvas(): HTMLCanvasElement {
        return canvas;
    }

    function setDimensions(width: number, height: number): void {
        canvas.width = width;
        canvas.height = height;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
    }

    function enableHighDPI(): void {
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;
        
        context.scale(dpr, dpr);
    }

    return {
        render,
        clear,
        getCanvas,
        setDimensions,
        enableHighDPI
    };
}

// ============================================================================
// PERFORMANCE MONITORING IMPLEMENTATION
// ============================================================================

function createPerformanceMonitorImpl(): PerformanceMonitor {
    const timings: Map<string, number> = new Map();
    const completed: Map<string, number[]> = new Map();
    let frameCount = 0;
    let frameStartTime = performance.now();

    function startTiming(label: string): void {
        timings.set(label, performance.now());
    }

    function endTiming(label: string): number {
        const startTime = timings.get(label);
        if (!startTime) {
            console.warn(`No start time found for timing label: ${label}`);
            return 0;
        }

        const duration = performance.now() - startTime;
        
        // Store completed timing
        if (!completed.has(label)) {
            completed.set(label, []);
        }
        completed.get(label)!.push(duration);
        
        // Keep only last 100 measurements
        const measurements = completed.get(label)!;
        if (measurements.length > 100) {
            measurements.shift();
        }

        timings.delete(label);
        return duration;
    }

    function getMetrics(): PerformanceMetrics {
        const renderTimes = completed.get('render') || [];
        const processingTimes = completed.get('dataProcessing') || [];
        
        return {
            renderTime: renderTimes.length > 0 ? d3.mean(renderTimes) || 0 : 0,
            dataProcessingTime: processingTimes.length > 0 ? d3.mean(processingTimes) || 0 : 0,
            memoryUsage: getMemoryUsage(),
            frameRate: frameCount > 0 ? 1000 / ((performance.now() - frameStartTime) / frameCount) : 0,
            itemsRendered: 0, // To be set by caller
            totalItems: 0, // To be set by caller
            virtualizationActive: false // To be set by caller
        };
    }

    function trackFrameRate(): void {
        frameCount++;
        if (frameCount === 1) {
            frameStartTime = performance.now();
        }
    }

    function generateReport(): string {
        const metrics = getMetrics();
        return `
Performance Report:
- Average Render Time: ${metrics.renderTime.toFixed(2)}ms
- Average Processing Time: ${metrics.dataProcessingTime.toFixed(2)}ms
- Memory Usage: ${metrics.memoryUsage.toFixed(2)}MB
- Frame Rate: ${metrics.frameRate.toFixed(1)}fps
- Items Rendered: ${metrics.itemsRendered}/${metrics.totalItems}
- Virtualization: ${metrics.virtualizationActive ? 'Active' : 'Inactive'}
        `.trim();
    }

    return {
        startTiming,
        endTiming,
        getMetrics,
        getMemoryUsage,
        trackFrameRate,
        generateReport
    };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function getMemoryUsage(): number {
    if ('memory' in performance) {
        const memory = (performance as any).memory;
        return memory.usedJSHeapSize / (1024 * 1024); // Convert to MB
    }
    return 0; // Memory API not available
}

// ============================================================================
// DATA OPTIMIZATION FUNCTIONS
// ============================================================================

function optimizeDataForRenderingImpl<T>(data: T[], maxItems: number = 1000): T[] {
    if (data.length <= maxItems) {
        return data;
    }

    // Use uniform sampling to reduce data points while maintaining distribution
    const step = Math.ceil(data.length / maxItems);
    const optimized: T[] = [];

    for (let i = 0; i < data.length; i += step) {
        optimized.push(data[i]);
    }

    return optimized;
}

function createDataSamplerImpl<T>(strategy: 'uniform' | 'random' | 'importance'): (data: T[], count: number) => T[] {
    switch (strategy) {
        case 'uniform':
            return (data: T[], count: number): T[] => {
                if (count >= data.length) return data;
                const step = data.length / count;
                const result: T[] = [];
                for (let i = 0; i < count; i++) {
                    const index = Math.floor(i * step);
                    result.push(data[index]);
                }
                return result;
            };

        case 'random':
            return (data: T[], count: number): T[] => {
                if (count >= data.length) return data;
                const shuffled = [...data].sort(() => 0.5 - Math.random());
                return shuffled.slice(0, count);
            };

        case 'importance':
            return (data: T[], count: number): T[] => {
                if (count >= data.length) return data;
                // For importance sampling, we'd need a way to assess importance
                // For now, take first and last items plus uniform sampling in between
                const result: T[] = [data[0]]; // Always include first
                
                if (count > 2) {
                    const middle = createDataSamplerImpl<T>('uniform')(
                        data.slice(1, -1), 
                        count - 2
                    );
                    result.push(...middle);
                }
                
                if (count > 1) {
                    result.push(data[data.length - 1]); // Always include last
                }
                
                return result;
            };

        default:
            throw new Error(`Unknown sampling strategy: ${strategy}`);
    }
}

// ============================================================================
// MAIN SYSTEM IMPLEMENTATION
// ============================================================================

export function createAdvancedPerformanceSystem(): AdvancedPerformanceSystem {
    return {
        createSpatialIndex: createSpatialIndexImpl,
        createVirtualScrollManager: createVirtualScrollManagerImpl,
        createCanvasRenderer: createCanvasRendererImpl,
        createPerformanceMonitor: createPerformanceMonitorImpl,
        optimizeDataForRendering: optimizeDataForRenderingImpl,
        createDataSampler: createDataSamplerImpl
    };
}

// ============================================================================
// WATERFALL-SPECIFIC PERFORMANCE UTILITIES
// ============================================================================

/**
 * Create optimized spatial index for waterfall chart interactions
 * Enables O(log n) hover detection for large datasets
 */
export function createWaterfallSpatialIndex(
    data: Array<{label: string, value: number}>,
    xScale: any,
    yScale: any
): SpatialIndex {
    const spatialIndex = createSpatialIndexImpl();
    
    data.forEach((item, index) => {
        const x = (xScale(item.label) || 0) + (xScale.bandwidth ? xScale.bandwidth() / 2 : 0);
        const y = yScale(item.value) || 0;
        
        spatialIndex.add({
            x,
            y,
            data: item,
            index
        });
    });
    
    return spatialIndex;
}

/**
 * Create high-performance virtual waterfall renderer
 * Handles thousands of data points with smooth scrolling
 */
export function createVirtualWaterfallRenderer(
    container: HTMLElement,
    config: VirtualScrollConfig
): {
    virtualScrollManager: VirtualScrollManager;
    performanceMonitor: PerformanceMonitor;
    render: (data: any[], scrollTop: number) => void;
} {
    const system = createAdvancedPerformanceSystem();
    const virtualScrollManager = system.createVirtualScrollManager(config);
    const performanceMonitor = system.createPerformanceMonitor();
    
    function render(data: any[], scrollTop: number): void {
        performanceMonitor.startTiming('render');
        
        const virtualized = virtualScrollManager.getVirtualizedData(data, scrollTop);
        
        // Here you would render only the visible data
        // This is a simplified version - in practice, you'd integrate with D3.js rendering
        
        performanceMonitor.endTiming('render');
        performanceMonitor.trackFrameRate();
    }
    
    return {
        virtualScrollManager,
        performanceMonitor,
        render
    };
}

// Default export for convenience
export default createAdvancedPerformanceSystem;
