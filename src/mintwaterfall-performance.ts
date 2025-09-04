// MintWaterfall Performance System - TypeScript Version
// Implements virtualization, incremental updates, and memory optimization with full type safety

import * as d3 from 'd3';

// Type definitions for performance system
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

export function createPerformanceManager(): PerformanceManager {
    
    // Performance metrics tracking
    let performanceMetrics: PerformanceMetrics = {
        renderTime: 0,
        dataProcessingTime: 0,
        memoryUsage: 0,
        visibleElements: 0,
        totalElements: 0,
        fps: 0,
        lastFrameTime: 0,
        averageFrameTime: 0,
        peakMemoryUsage: 0,
        renderCalls: 0
    };
    
    // Virtualization configuration
    let virtualizationConfig: VirtualizationConfig = {
        enabled: false,
        chunkSize: 1000,
        renderThreshold: 10000,
        bufferSize: 200,
        preloadCount: 3,
        recycleNodes: true
    };
    
    let virtualViewport: VirtualViewport = {
        start: 0,
        end: 100,
        visible: [],
        bufferStart: 0,
        bufferEnd: 100
    };
    
    // Performance optimization settings
    let optimizationConfig: PerformanceOptimization = {
        debouncing: true,
        throttling: true,
        batchUpdates: true,
        memoryPooling: true,
        geometryOptimization: true,
        cssOptimization: true
    };
    
    // Memory pool for reusing DOM elements
    let memoryPool: MemoryPool = {
        elements: new Map(),
        maxSize: 1000,
        currentSize: 0,
        hitCount: 0,
        missCount: 0
    };
    
    // Render batching system
    let currentBatch: RenderBatch | null = null;
    let batchTimeout: number | null = null;
    let updateStrategy: 'immediate' | 'debounced' | 'throttled' | 'batched' = 'immediate';
    
    // Performance profiling
    let profilers = new Map<string, PerformanceProfiler>();
    let dashboardElement: HTMLElement | null = null;
    
    // Frame rate tracking
    let frameCount = 0;
    let lastFpsTime = performance.now();
    
    function enableVirtualization(options: Partial<VirtualizationConfig> = {}): PerformanceManager {
        Object.assign(virtualizationConfig, options);
        virtualizationConfig.enabled = true;
        
        console.log('MintWaterfall: Virtualization enabled with config:', virtualizationConfig);
        return performanceManager;
    }
    
    function disableVirtualization(): PerformanceManager {
        virtualizationConfig.enabled = false;
        console.log('MintWaterfall: Virtualization disabled');
        return performanceManager;
    }
    
    function calculateVisibleRange(scrollTop: number, containerHeight: number, itemHeight: number): [number, number] {
        const start = Math.floor(scrollTop / itemHeight);
        const visibleCount = Math.ceil(containerHeight / itemHeight);
        const end = start + visibleCount;
        
        // Add buffer for smooth scrolling
        const bufferStart = Math.max(0, start - virtualizationConfig.bufferSize);
        const bufferEnd = end + virtualizationConfig.bufferSize;
        
        return [bufferStart, bufferEnd];
    }
    
    function optimizeRendering(container: d3.Selection<d3.BaseType, any, any, any>, data: any[]): PerformanceManager {
        const startTime = performance.now();
        
        performanceMetrics.totalElements = data.length;
        
        if (virtualizationConfig.enabled && data.length > virtualizationConfig.renderThreshold) {
            renderVirtualized(container, data);
        } else {
            renderDirect(container, data);
        }
        
        const endTime = performance.now();
        performanceMetrics.renderTime = endTime - startTime;
        performanceMetrics.renderCalls++;
        
        updateFPS();
        return performanceManager;
    }
    
    function renderVirtualized(container: d3.Selection<d3.BaseType, any, any, any>, data: any[]): void {
        // Implement virtualization logic
        const containerNode = container.node() as Element;
        if (!containerNode) return;
        
        const containerHeight = containerNode.clientHeight;
        const scrollTop = (containerNode as HTMLElement).scrollTop || 0;
        const itemHeight = 30; // Estimate or calculate from data
        
        const [visibleStart, visibleEnd] = calculateVisibleRange(scrollTop, containerHeight, itemHeight);
        const visibleData = data.slice(visibleStart, Math.min(visibleEnd, data.length));
        
        virtualViewport.start = visibleStart;
        virtualViewport.end = visibleEnd;
        virtualViewport.visible = visibleData.map((_, i) => i + visibleStart);
        
        performanceMetrics.visibleElements = visibleData.length;
        
        // Render only visible elements with proper typing
        const elements = container.selectAll<SVGGElement, any>('.virtual-item')
            .data(visibleData, (d: any, i: number) => `item-${i + visibleStart}`);
        
        elements.exit().remove();
        
        const enter = elements.enter().append<SVGGElement>('g')
            .attr('class', 'virtual-item');
        
        const merged = elements.merge(enter);
        merged.attr('transform', (d: any, i: number) => `translate(0, ${(i + visibleStart) * itemHeight})`);
    }
    
    function renderDirect(container: d3.Selection<d3.BaseType, any, any, any>, data: any[]): void {
        // Standard rendering for smaller datasets
        performanceMetrics.visibleElements = data.length;
        
        const elements = container.selectAll<SVGGElement, any>('.chart-element')
            .data(data);
        
        elements.exit().remove();
        
        const enter = elements.enter().append<SVGGElement>('g')
            .attr('class', 'chart-element');
        
        const merged = elements.merge(enter);
        // Apply transformations and styles here - merged variable prevents compilation errors
    }
    
    function profileOperation(name: string, operation: () => any): any {
        const startTime = performance.now();
        const result = operation();
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        if (!profilers.has(name)) {
            profilers.set(name, {
                startTime: 0,
                endTime: 0,
                samples: [],
                averageTime: 0,
                minTime: Infinity,
                maxTime: 0
            });
        }
        
        const profiler = profilers.get(name)!;
        profiler.samples.push(duration);
        profiler.minTime = Math.min(profiler.minTime, duration);
        profiler.maxTime = Math.max(profiler.maxTime, duration);
        profiler.averageTime = profiler.samples.reduce((a, b) => a + b, 0) / profiler.samples.length;
        
        // Keep only recent samples for rolling average
        if (profiler.samples.length > 100) {
            profiler.samples.shift();
        }
        
        return result;
    }
    
    function getMetrics(): PerformanceMetrics {
        // Update memory usage if available
        if ('memory' in performance) {
            const memInfo = (performance as any).memory;
            performanceMetrics.memoryUsage = memInfo.usedJSHeapSize;
            performanceMetrics.peakMemoryUsage = Math.max(performanceMetrics.peakMemoryUsage, memInfo.usedJSHeapSize);
        }
        
        return { ...performanceMetrics };
    }
    
    function resetMetrics(): PerformanceManager {
        performanceMetrics = {
            renderTime: 0,
            dataProcessingTime: 0,
            memoryUsage: 0,
            visibleElements: 0,
            totalElements: 0,
            fps: 0,
            lastFrameTime: 0,
            averageFrameTime: 0,
            peakMemoryUsage: 0,
            renderCalls: 0
        };
        
        profilers.clear();
        frameCount = 0;
        lastFpsTime = performance.now();
        
        return performanceManager;
    }
    
    function enableMemoryPooling(options: Partial<MemoryPool> = {}): PerformanceManager {
        Object.assign(memoryPool, options);
        optimizationConfig.memoryPooling = true;
        
        console.log('MintWaterfall: Memory pooling enabled');
        return performanceManager;
    }
    
    function getFromPool(type: string): any {
        if (!optimizationConfig.memoryPooling) return null;
        
        const pool = memoryPool.elements.get(type);
        if (pool && pool.length > 0) {
            memoryPool.hitCount++;
            memoryPool.currentSize--;
            return pool.pop();
        }
        
        memoryPool.missCount++;
        return null;
    }
    
    function returnToPool(type: string, element: any): void {
        if (!optimizationConfig.memoryPooling || memoryPool.currentSize >= memoryPool.maxSize) return;
        
        if (!memoryPool.elements.has(type)) {
            memoryPool.elements.set(type, []);
        }
        
        const pool = memoryPool.elements.get(type)!;
        pool.push(element);
        memoryPool.currentSize++;
    }
    
    function createRenderBatch(): RenderBatch {
        return {
            operations: [],
            priority: 1,
            timestamp: performance.now(),
            elementCount: 0
        };
    }
    
    function flushRenderBatch(batch: RenderBatch): PerformanceManager {
        const startTime = performance.now();
        
        // Sort operations by priority and type for optimal rendering
        batch.operations.sort((a, b) => {
            const typeOrder = ['remove', 'create', 'update', 'style', 'attribute'];
            return typeOrder.indexOf(a.type) - typeOrder.indexOf(b.type);
        });
        
        // Execute operations in batch
        batch.operations.forEach(operation => {
            executeRenderOperation(operation);
        });
        
        const endTime = performance.now();
        performanceMetrics.renderTime += endTime - startTime;
        
        return performanceManager;
    }
    
    function executeRenderOperation(operation: RenderOperation): void {
        const { type, element, properties } = operation;
        
        switch (type) {
            case 'create':
                // Create new element logic
                break;
            case 'update':
                // Update element data logic
                break;
            case 'remove':
                // Remove element logic
                if (element && element.remove) {
                    element.remove();
                }
                break;
            case 'style':
                // Apply styles
                if (element && properties) {
                    Object.keys(properties).forEach(prop => {
                        element.style(prop, properties[prop]);
                    });
                }
                break;
            case 'attribute':
                // Apply attributes
                if (element && properties) {
                    Object.keys(properties).forEach(prop => {
                        element.attr(prop, properties[prop]);
                    });
                }
                break;
        }
    }
    
    function setUpdateStrategy(strategy: 'immediate' | 'debounced' | 'throttled' | 'batched'): PerformanceManager {
        updateStrategy = strategy;
        console.log(`MintWaterfall: Update strategy set to ${strategy}`);
        return performanceManager;
    }
    
    function updateFPS(): void {
        frameCount++;
        const currentTime = performance.now();
        
        if (currentTime - lastFpsTime >= 1000) {
            performanceMetrics.fps = Math.round((frameCount * 1000) / (currentTime - lastFpsTime));
            performanceMetrics.averageFrameTime = (currentTime - lastFpsTime) / frameCount;
            frameCount = 0;
            lastFpsTime = currentTime;
        }
        
        performanceMetrics.lastFrameTime = currentTime;
    }
    
    function createDashboard(): HTMLElement {
        const dashboard = document.createElement('div');
        dashboard.className = 'mintwaterfall-performance-dashboard';
        dashboard.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 10px;
            border-radius: 5px;
            font-family: monospace;
            font-size: 12px;
            z-index: 10000;
            max-width: 300px;
        `;
        
        return dashboard;
    }
    
    function updateDashboard(): void {
        if (!dashboardElement) return;
        
        const metrics = getMetrics();
        const memoryMB = (metrics.memoryUsage / 1024 / 1024).toFixed(2);
        const peakMemoryMB = (metrics.peakMemoryUsage / 1024 / 1024).toFixed(2);
        
        dashboardElement.innerHTML = `
            <div><strong>MintWaterfall Performance</strong></div>
            <div>FPS: ${metrics.fps}</div>
            <div>Render Time: ${metrics.renderTime.toFixed(2)}ms</div>
            <div>Memory: ${memoryMB}MB (Peak: ${peakMemoryMB}MB)</div>
            <div>Visible Elements: ${metrics.visibleElements}/${metrics.totalElements}</div>
            <div>Render Calls: ${metrics.renderCalls}</div>
            <div>Virtualization: ${virtualizationConfig.enabled ? 'ON' : 'OFF'}</div>
            <div>Pool Hit Rate: ${memoryPool.hitCount + memoryPool.missCount > 0 ? 
                ((memoryPool.hitCount / (memoryPool.hitCount + memoryPool.missCount)) * 100).toFixed(1) : 0}%</div>
        `;
    }
    
    function enableDashboard(container?: HTMLElement): PerformanceManager {
        if (!dashboardElement) {
            dashboardElement = createDashboard();
        }
        
        const targetContainer = container || document.body;
        if (targetContainer && !targetContainer.contains(dashboardElement)) {
            targetContainer.appendChild(dashboardElement);
        }
        
        // Update dashboard periodically
        setInterval(updateDashboard, 500);
        
        return performanceManager;
    }
    
    function disableDashboard(): PerformanceManager {
        if (dashboardElement && dashboardElement.parentNode) {
            dashboardElement.parentNode.removeChild(dashboardElement);
            dashboardElement = null;
        }
        return performanceManager;
    }
    
    function getDashboard(): HTMLElement | null {
        return dashboardElement;
    }
    
    function optimizeMemory(): PerformanceManager {
        // Force garbage collection if available
        if ((window as any).gc) {
            (window as any).gc();
        }
        
        // Clear unused pools
        memoryPool.elements.forEach((pool, type) => {
            if (pool.length > 50) {
                pool.splice(25); // Keep only recent 25 elements
            }
        });
        
        // Clear old profiler samples
        profilers.forEach(profiler => {
            if (profiler.samples.length > 50) {
                profiler.samples.splice(0, profiler.samples.length - 50);
            }
        });
        
        console.log('MintWaterfall: Memory optimization completed');
        return performanceManager;
    }
    
    function getRecommendations(): string[] {
        const recommendations: string[] = [];
        const metrics = getMetrics();
        
        if (metrics.totalElements > 5000 && !virtualizationConfig.enabled) {
            recommendations.push('Enable virtualization for improved performance with large datasets');
        }
        
        if (metrics.fps < 30) {
            recommendations.push('Consider reducing visual complexity or enabling performance optimizations');
        }
        
        if (metrics.memoryUsage > 100 * 1024 * 1024) { // 100MB
            recommendations.push('Memory usage is high - consider enabling memory pooling or reducing data size');
        }
        
        if (metrics.renderTime > 100) {
            recommendations.push('Render time is slow - consider batching updates or optimizing render operations');
        }
        
        const poolEfficiency = memoryPool.hitCount / (memoryPool.hitCount + memoryPool.missCount || 1);
        if (poolEfficiency < 0.5 && optimizationConfig.memoryPooling) {
            recommendations.push('Memory pool efficiency is low - consider adjusting pool size or strategy');
        }
        
        return recommendations;
    }
    
    const performanceManager: PerformanceManager = {
        enableVirtualization,
        disableVirtualization,
        optimizeRendering,
        profileOperation,
        getMetrics,
        resetMetrics,
        enableMemoryPooling,
        createRenderBatch,
        flushRenderBatch,
        setUpdateStrategy,
        getDashboard,
        enableDashboard,
        disableDashboard,
        optimizeMemory,
        getRecommendations
    };
    
    return performanceManager;
}
