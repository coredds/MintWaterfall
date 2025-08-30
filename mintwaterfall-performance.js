// MintWaterfall - Performance optimization system for large datasets
// Implements virtualization, incremental updates, and memory optimization

/* global d3 */

// Ensure we're in a browser context with D3
if (typeof d3 === "undefined" && typeof require !== "undefined") {
     
    d3 = require("d3");
}

/**
 * Performance manager for handling large datasets
 * @returns {Object} Performance manager API
 */
export function createPerformanceManager() {
    let performanceMetrics = {
        renderTime: 0,
        dataProcessingTime: 0,
        memoryUsage: 0,
        visibleElements: 0,
        totalElements: 0,
        fps: 0,
        lastFrameTime: 0
    };
    
    let isVirtualizationEnabled = false;
    let virtualViewport = { start: 0, end: 100 }; // eslint-disable-line no-unused-vars
    let chunkSize = 1000;
    let renderThreshold = 10000;
    
    /**
     * Enables virtualization for large datasets
     * @param {Object} options - Virtualization options
     */
    function enableVirtualization(options = {}) {
        isVirtualizationEnabled = true;
        chunkSize = options.chunkSize || 1000;
        renderThreshold = options.renderThreshold || 10000;
        
        console.log(`MintWaterfall: Virtualization enabled with chunk size ${chunkSize}`);
    }
    
    /**
     * Disables virtualization
     */
    function disableVirtualization() {
        isVirtualizationEnabled = false;
        console.log("MintWaterfall: Virtualization disabled");
    }
    
    /**
     * Processes data in chunks to avoid blocking the UI
     * @param {Array} data - Input data array
     * @param {Function} processor - Processing function
     * @param {Object} options - Processing options
     * @returns {Promise} Promise that resolves with processed data
     */
    function processDataInChunks(data, processor, options = {}) {
        return new Promise((resolve) => {
            const startTime = performance.now();
            const chunkSize = options.chunkSize || 1000;
            const delay = options.delay || 0;
            
            let processedData = [];
            let currentIndex = 0;
            
            function processChunk() {
                const endIndex = Math.min(currentIndex + chunkSize, data.length);
                const chunk = data.slice(currentIndex, endIndex);
                
                // Process chunk
                const processedChunk = processor(chunk, currentIndex);
                processedData = processedData.concat(processedChunk);
                
                currentIndex = endIndex;
                
                if (currentIndex < data.length) {
                    // Schedule next chunk
                    if (delay > 0) {
                        setTimeout(processChunk, delay);
                    } else {
                        requestAnimationFrame(processChunk);
                    }
                } else {
                    // Processing complete
                    performanceMetrics.dataProcessingTime = performance.now() - startTime;
                    resolve(processedData);
                }
            }
            
            processChunk();
        });
    }
    
    /**
     * Creates a virtualized data view
     * @param {Array} data - Full dataset
     * @param {Object} viewport - Viewport configuration
     * @returns {Array} Virtualized data subset
     */
    function createVirtualizedView(data, viewport) {
        if (!isVirtualizationEnabled || data.length <= renderThreshold) {
            return data;
        }
        
        const start = Math.max(0, viewport.start);
        const end = Math.min(data.length, viewport.end);
        
        virtualViewport = { start, end };
        performanceMetrics.visibleElements = end - start;
        performanceMetrics.totalElements = data.length;
        
        return data.slice(start, end);
    }
    
    /**
     * Updates the virtual viewport
     * @param {number} start - Start index
     * @param {number} end - End index
     */
    function updateViewport(start, end) {
        virtualViewport = { start, end };
    }
    
    /**
     * Implements incremental updates for data changes
     * @param {Array} oldData - Previous data
     * @param {Array} newData - New data
     * @returns {Object} Update instructions
     */
    function calculateIncrementalUpdate(oldData, newData) {
        const startTime = performance.now();
        
        const updates = {
            added: [],
            removed: [],
            modified: [],
            unchanged: []
        };
        
        // Create maps for efficient lookup
        const oldMap = new Map(oldData.map((item, index) => [item.id || index, { item, index }]));
        const newMap = new Map(newData.map((item, index) => [item.id || index, { item, index }]));
        
        // Find added items
        for (const [id, { item, index }] of newMap) {
            if (!oldMap.has(id)) {
                updates.added.push({ item, index, id });
            }
        }
        
        // Find removed and modified items
        for (const [id, { item: oldItem, index: oldIndex }] of oldMap) {
            if (!newMap.has(id)) {
                updates.removed.push({ item: oldItem, index: oldIndex, id });
            } else {
                const { item: newItem, index: newIndex } = newMap.get(id);
                if (JSON.stringify(oldItem) !== JSON.stringify(newItem)) {
                    updates.modified.push({ 
                        oldItem, 
                        newItem, 
                        oldIndex, 
                        newIndex, 
                        id 
                    });
                } else {
                    updates.unchanged.push({ item: newItem, index: newIndex, id });
                }
            }
        }
        
        performanceMetrics.dataProcessingTime = performance.now() - startTime;
        
        return updates;
    }
    
    /**
     * Optimizes memory usage by cleaning up unused elements
     * @param {Selection} container - D3 container selection
     * @param {Array} activeData - Currently active data
     */
    function optimizeMemory(container, activeData) {
        const startTime = performance.now();
        
        // Remove unused DOM elements
        const allElements = container.selectAll("*");
        const activeIds = new Set(activeData.map(d => d.id || d.label));
        
        let removedCount = 0;
        allElements.each(function(d) {
            if (d && !activeIds.has(d.id || d.label)) {
                d3.select(this).remove();
                removedCount++;
            }
        });
        
        // Force garbage collection if available
        if (window.gc && typeof window.gc === "function") {
            window.gc();
        }
        
        console.log(`MintWaterfall: Cleaned up ${removedCount} unused elements`);
        performanceMetrics.dataProcessingTime += performance.now() - startTime;
    }
    
    /**
     * Monitors rendering performance
     * @param {Function} renderFunction - Function to monitor
     * @returns {Function} Wrapped function with performance monitoring
     */
    function monitorPerformance(renderFunction) {
        return function(...args) {
            const startTime = performance.now();
            const startMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
            
            // Execute the render function
            const result = renderFunction.apply(this, args);
            
            // Calculate metrics
            const endTime = performance.now();
            const endMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
            
            performanceMetrics.renderTime = endTime - startTime;
            performanceMetrics.memoryUsage = endMemory - startMemory;
            
            // Calculate FPS
            if (performanceMetrics.lastFrameTime > 0) {
                const frameDuration = endTime - performanceMetrics.lastFrameTime;
                performanceMetrics.fps = 1000 / frameDuration;
            }
            performanceMetrics.lastFrameTime = endTime;
            
            // Log performance warnings
            if (performanceMetrics.renderTime > 100) {
                console.warn(`MintWaterfall: Slow render detected (${performanceMetrics.renderTime.toFixed(2)}ms)`);
            }
            
            if (performanceMetrics.memoryUsage > 10 * 1024 * 1024) { // 10MB
                console.warn(`MintWaterfall: High memory usage detected (${(performanceMetrics.memoryUsage / 1024 / 1024).toFixed(2)}MB)`);
            }
            
            return result;
        };
    }
    
    /**
     * Creates a debounced version of a function
     * @param {Function} func - Function to debounce
     * @param {number} delay - Delay in milliseconds
     * @returns {Function} Debounced function
     */
    function debounce(func, delay) {
        let timeoutId;
        return function(...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    }
    
    /**
     * Creates a throttled version of a function
     * @param {Function} func - Function to throttle
     * @param {number} delay - Delay in milliseconds
     * @returns {Function} Throttled function
     */
    function throttle(func, delay) {
        let lastCall = 0;
        return function(...args) {
            const now = Date.now();
            if (now - lastCall >= delay) {
                lastCall = now;
                return func.apply(this, args);
            }
        };
    }
    
    /**
     * Implements efficient data filtering
     * @param {Array} data - Input data
     * @param {Function} predicate - Filter predicate
     * @param {Object} options - Filtering options
     * @returns {Array} Filtered data
     */
    function efficientFilter(data, predicate, options = {}) {
        const startTime = performance.now();
        const useWorker = options.useWorker && data.length > 50000;
        
        if (useWorker && typeof Worker !== "undefined") {
            // Use Web Worker for large datasets
            return new Promise((resolve) => {
                const worker = new Worker(URL.createObjectURL(new Blob([`
                    self.onmessage = function(e) {
                        const { data, predicateStr } = e.data;
                        const predicate = new Function('return ' + predicateStr)();
                        const filtered = data.filter(predicate);
                        self.postMessage(filtered);
                    };
                `], { type: "application/javascript" })));
                
                worker.onmessage = function(e) {
                    performanceMetrics.dataProcessingTime = performance.now() - startTime;
                    worker.terminate();
                    resolve(e.data);
                };
                
                worker.postMessage({
                    data,
                    predicateStr: predicate.toString()
                });
            });
        } else {
            // Use regular filtering
            const filtered = data.filter(predicate);
            performanceMetrics.dataProcessingTime = performance.now() - startTime;
            return filtered;
        }
    }
    
    /**
     * Creates performance-optimized scales
     * @param {Array} data - Input data
     * @param {Object} options - Scale options
     * @returns {Object} Optimized scales
     */
    function createOptimizedScales(data, options = {}) {
        const startTime = performance.now();
        
        // Use sampling for very large datasets
        let sampleData = data;
        if (data.length > 100000) {
            const sampleSize = Math.min(10000, Math.max(1000, data.length * 0.1));
            const step = Math.floor(data.length / sampleSize);
            sampleData = data.filter((_, i) => i % step === 0);
            console.log(`MintWaterfall: Using ${sampleData.length} samples from ${data.length} data points for scale calculation`);
        }
        
        // Create scales based on sample
        const xScale = d3.scaleBand()
            .domain(sampleData.map((d, i) => d.label || i))
            .range([0, options.width || 800])
            .padding(options.padding || 0.1);
            
        const yExtent = d3.extent(sampleData, d => d.value || 0);
        const yScale = d3.scaleLinear()
            .domain(yExtent)
            .range([options.height || 400, 0])
            .nice();
        
        performanceMetrics.dataProcessingTime = performance.now() - startTime;
        
        return { xScale, yScale };
    }
    
    /**
     * Gets current performance metrics
     * @returns {Object} Performance metrics
     */
    function getMetrics() {
        return { ...performanceMetrics };
    }
    
    /**
     * Resets performance metrics
     */
    function resetMetrics() {
        performanceMetrics = {
            renderTime: 0,
            dataProcessingTime: 0,
            memoryUsage: 0,
            visibleElements: 0,
            totalElements: 0,
            fps: 0,
            lastFrameTime: 0
        };
    }
    
    /**
     * Creates a performance dashboard
     * @param {Selection} container - Container for the dashboard
     */
    function createPerformanceDashboard(container) {
        const dashboard = container.append("div")
            .attr("class", "performance-dashboard")
            .style("position", "fixed")
            .style("top", "10px")
            .style("right", "10px")
            .style("background", "rgba(0,0,0,0.8)")
            .style("color", "white")
            .style("padding", "10px")
            .style("border-radius", "5px")
            .style("font-family", "monospace")
            .style("font-size", "12px")
            .style("z-index", "9999");
            
        function updateDashboard() {
            const metrics = getMetrics();
            dashboard.html(`
                <div>Render Time: ${metrics.renderTime.toFixed(2)}ms</div>
                <div>Data Processing: ${metrics.dataProcessingTime.toFixed(2)}ms</div>
                <div>Memory Usage: ${(metrics.memoryUsage / 1024 / 1024).toFixed(2)}MB</div>
                <div>Visible Elements: ${metrics.visibleElements}/${metrics.totalElements}</div>
                <div>FPS: ${metrics.fps.toFixed(1)}</div>
            `);
        }
        
        // Update dashboard every second
        setInterval(updateDashboard, 1000);
        updateDashboard();
    }
    
    // Public API
    return {
        enableVirtualization,
        disableVirtualization,
        processDataInChunks,
        createVirtualizedView,
        updateViewport,
        calculateIncrementalUpdate,
        optimizeMemory,
        monitorPerformance,
        debounce,
        throttle,
        efficientFilter,
        createOptimizedScales,
        getMetrics,
        resetMetrics,
        createPerformanceDashboard,
        
        // Configuration getters/setters
        get isVirtualizationEnabled() { return isVirtualizationEnabled; },
        get chunkSize() { return chunkSize; },
        set chunkSize(value) { chunkSize = value; },
        get renderThreshold() { return renderThreshold; },
        set renderThreshold(value) { renderThreshold = value; }
    };
}

/**
 * Large dataset utilities
 */
export const largeDatasetUtils = {
    /**
     * Generates sample data for testing performance
     * @param {number} count - Number of data points
     * @param {Object} options - Generation options
     * @returns {Array} Generated data
     */
    generateSampleData(count, options = {}) {
        const {
            categories = ["A", "B", "C", "D", "E"],
            valueRange = [0, 1000],
            includeNegatives = true
        } = options;
        
        const data = [];
        const colorScale = d3.scaleOrdinal(d3.schemeCategory10);
        
        for (let i = 0; i < count; i++) {
            const category = categories[i % categories.length];
            let value = Math.random() * (valueRange[1] - valueRange[0]) + valueRange[0];
            
            if (includeNegatives && Math.random() < 0.3) {
                value = -value;
            }
            
            data.push({
                id: i,
                label: `Item ${i}`,
                category,
                value: Math.round(value),
                stacks: [{
                    value: Math.round(value),
                    color: colorScale(category),
                    label: Math.round(value).toString()
                }]
            });
        }
        
        return data;
    },
    
    /**
     * Benchmarks performance with different dataset sizes
     * @param {Function} renderFunction - Function to benchmark
     * @param {Array} sizes - Array of dataset sizes to test
     * @returns {Array} Benchmark results
     */
    benchmark(renderFunction, sizes = [1000, 10000, 50000, 100000]) {
        const results = [];
        
        for (const size of sizes) {
            const data = this.generateSampleData(size);
            const startTime = performance.now();
            
            renderFunction(data);
            
            const endTime = performance.now();
            results.push({
                size,
                renderTime: endTime - startTime,
                memoryUsage: performance.memory ? performance.memory.usedJSHeapSize : 0
            });
            
            console.log(`Benchmark ${size} items: ${(endTime - startTime).toFixed(2)}ms`);
        }
        
        return results;
    },
    
    /**
     * Estimates optimal chunk size for a dataset
     * @param {number} dataSize - Size of the dataset
     * @param {number} targetFrameTime - Target frame time in ms
     * @returns {number} Recommended chunk size
     */
    estimateOptimalChunkSize(dataSize, targetFrameTime = 16) {
        // Estimate based on typical processing time per item
        const estimatedTimePerItem = 0.01; // 0.01ms per item (rough estimate)
        const maxItemsPerFrame = Math.floor(targetFrameTime / estimatedTimePerItem);
        
        // Ensure minimum and maximum chunk sizes
        return Math.max(100, Math.min(maxItemsPerFrame, 10000));
    }
};

// Create a default instance
export const performanceManager = createPerformanceManager();

// Add to d3 namespace for compatibility
if (typeof d3 !== "undefined") {
    d3.performanceManager = performanceManager;
    d3.largeDatasetUtils = largeDatasetUtils;
}
