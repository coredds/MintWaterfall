/*!
 * MintWaterfall v0.8.9
 * D3.js-compatible waterfall chart component
 * (c) 2024 David Duarte
 * Released under the MIT License
 */
(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('d3'), require('d3-color'), require('d3-array'), require('d3-drag'), require('d3-force')) :
    typeof define === 'function' && define.amd ? define(['exports', 'd3', 'd3-color', 'd3-array', 'd3-drag', 'd3-force'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.MintWaterfall = {}, global.d3, global.d3, global.d3, global.d3, global.d3));
})(this, (function (exports, d3, d3Color, d3Array, d3Drag, d3Force) { 'use strict';

    function _interopNamespaceDefault(e) {
        var n = Object.create(null);
        if (e) {
            Object.keys(e).forEach(function (k) {
                if (k !== 'default') {
                    var d = Object.getOwnPropertyDescriptor(e, k);
                    Object.defineProperty(n, k, d.get ? d : {
                        enumerable: true,
                        get: function () { return e[k]; }
                    });
                }
            });
        }
        n.default = e;
        return Object.freeze(n);
    }

    var d3__namespace = /*#__PURE__*/_interopNamespaceDefault(d3);

    // MintWaterfall Enhanced Scales System - TypeScript Version
    // Provides advanced D3.js scale support including time and ordinal scales with full type safety
    function createScaleSystem() {
        let defaultRange = [0, 800];
        // Enhanced scale factory with auto-detection
        function createAdaptiveScale(data, dimension = "x") {
            const values = data.map(d => dimension === "x" ? d.label : d.cumulativeTotal);
            // Detect data type and return appropriate scale
            if (values.every(v => v instanceof Date)) {
                return createTimeScale(values);
            }
            else if (values.every(v => typeof v === "string" || isNaN(v))) {
                // For categorical/string data, use band scale for positioning
                return createBandScale(values);
            }
            else if (values.every(v => typeof v === "number")) {
                return createLinearScale(values);
            }
            else {
                // Mixed types - fallback to band scale
                return d3__namespace.scaleBand().domain(values.map(String)).range(defaultRange);
            }
        }
        // Time scale with intelligent formatting
        function createTimeScale(values, options = {}) {
            const { range = defaultRange, nice = true, tickFormat = "auto" } = options;
            const extent = d3__namespace.extent(values);
            const scale = d3__namespace.scaleTime()
                .domain(extent)
                .range(range);
            if (nice) {
                scale.nice();
            }
            // Auto-detect appropriate time format
            if (tickFormat === "auto" && extent[0] && extent[1] && extent[0] instanceof Date && extent[1] instanceof Date) {
                const timeSpan = extent[1].getTime() - extent[0].getTime();
                const days = timeSpan / (1000 * 60 * 60 * 24);
                if (days < 1) {
                    scale.tickFormat = d3__namespace.timeFormat("%H:%M");
                }
                else if (days < 30) {
                    scale.tickFormat = d3__namespace.timeFormat("%m/%d");
                }
                else if (days < 365) {
                    scale.tickFormat = d3__namespace.timeFormat("%b %Y");
                }
                else {
                    scale.tickFormat = d3__namespace.timeFormat("%Y");
                }
            }
            else if (typeof tickFormat === "string") {
                scale.tickFormat = d3__namespace.timeFormat(tickFormat);
            }
            return scale;
        }
        // Enhanced ordinal scale with color mapping
        function createOrdinalScale(values, options = {}) {
            const { range = d3__namespace.schemeCategory10, unknown = "#ccc" } = options;
            const uniqueValues = [...new Set(values)];
            return d3__namespace.scaleOrdinal()
                .domain(uniqueValues)
                .range(range)
                .unknown(unknown);
        }
        // Band scale for categorical data positioning
        function createBandScale(values, options = {}) {
            const { padding = 0.1, paddingInner = null, paddingOuter = null, align = 0.5, range = defaultRange } = options;
            const uniqueValues = [...new Set(values.map(String))];
            const scale = d3__namespace.scaleBand()
                .domain(uniqueValues)
                .range(range)
                .align(align);
            if (paddingInner !== null) {
                scale.paddingInner(paddingInner);
            }
            if (paddingOuter !== null) {
                scale.paddingOuter(paddingOuter);
            }
            if (paddingInner === null && paddingOuter === null) {
                scale.padding(padding);
            }
            return scale;
        }
        // Linear scale with enhanced options
        function createLinearScale(values, options = {}) {
            const { range = defaultRange, nice = true, zero = false, clamp = false } = options;
            let domain = d3__namespace.extent(values);
            // Include zero in domain if requested
            if (zero) {
                domain = [Math.min(0, domain[0]), Math.max(0, domain[1])];
            }
            const scale = d3__namespace.scaleLinear()
                .domain(domain)
                .range(range);
            if (nice) {
                scale.nice();
            }
            if (clamp) {
                scale.clamp(true);
            }
            return scale;
        }
        function setDefaultRange(range) {
            defaultRange = range;
        }
        function getScaleInfo(scale) {
            const info = {
                type: 'unknown',
                domain: [],
                range: []
            };
            try {
                info.domain = scale.domain();
                info.range = scale.range();
                // Detect scale type
                if (typeof scale.bandwidth === 'function') {
                    info.type = 'band';
                    info.bandwidth = scale.bandwidth();
                    if (typeof scale.step === 'function') {
                        info.step = scale.step();
                    }
                }
                else if (typeof scale.nice === 'function') {
                    // Check if it's a time scale by testing if domain contains dates
                    if (info.domain.length > 0 && info.domain[0] instanceof Date) {
                        info.type = 'time';
                    }
                    else {
                        info.type = 'linear';
                    }
                }
                else if (typeof scale.unknown === 'function') {
                    info.type = 'ordinal';
                }
            }
            catch (e) {
                // Fallback for scales that don't support these methods
                console.warn('Could not extract complete scale info:', e);
            }
            return info;
        }
        // Log scale with fallback to linear for non-positive values
        function createLogScale(values, options = {}) {
            // Check if all values are positive for log scale
            const hasNonPositive = values.some(v => v <= 0);
            if (hasNonPositive) {
                // Fallback to linear scale
                return createLinearScale(values, options);
            }
            const { range = defaultRange, nice = true, clamp = false } = options;
            const domain = d3__namespace.extent(values);
            const scale = d3__namespace.scaleLog()
                .domain(domain)
                .range(range);
            if (nice) {
                scale.nice();
            }
            if (clamp) {
                scale.clamp(true);
            }
            return scale;
        }
        return {
            createAdaptiveScale,
            createTimeScale,
            createOrdinalScale,
            createBandScale,
            createLinearScale,
            createLogScale,
            setDefaultRange,
            getScaleInfo,
            scaleUtils: createScaleUtilities()
        };
    }
    function createScaleUtilities() {
        function formatTickValue(scale, value) {
            if (typeof scale.tickFormat === 'function') {
                // Time scales
                return scale.tickFormat()(value);
            }
            else if (scale.tickFormat) {
                // Scales with custom formatters
                return scale.tickFormat(value);
            }
            else if (typeof value === 'number') {
                // Default number formatting
                if (Math.abs(value) >= 1000000) {
                    return `${(value / 1000000).toFixed(1)}M`;
                }
                else if (Math.abs(value) >= 1000) {
                    return `${(value / 1000).toFixed(1)}K`;
                }
                else {
                    return value.toFixed(0);
                }
            }
            else {
                return String(value);
            }
        }
        function getTickCount(scale, targetSize) {
            const range = scale.range();
            const rangeSize = Math.abs(range[1] - range[0]);
            // Aim for ticks every 50-100 pixels
            const idealTickCount = Math.max(2, Math.floor(rangeSize / 75));
            // Cap at reasonable limits
            return Math.min(10, Math.max(2, idealTickCount));
        }
        function createColorScale(domain, scheme = d3__namespace.schemeCategory10) {
            return d3__namespace.scaleOrdinal()
                .domain(domain)
                .range([...scheme]);
        }
        function invertScale(scale, pixel) {
            if (typeof scale.invert === 'function') {
                // Linear and time scales
                return scale.invert(pixel);
            }
            else if (typeof scale.bandwidth === 'function') {
                // Band scales - find the band that contains the pixel
                const domain = scale.domain();
                const bandwidth = scale.bandwidth();
                scale.step();
                for (let i = 0; i < domain.length; i++) {
                    const bandStart = scale(domain[i]);
                    if (pixel >= bandStart && pixel <= bandStart + bandwidth) {
                        return domain[i];
                    }
                }
                // If not in any band, return closest
                const distances = domain.map((d) => Math.abs(scale(d) + bandwidth / 2 - pixel));
                const minIndex = distances.indexOf(Math.min(...distances));
                return domain[minIndex];
            }
            else {
                // Ordinal scales - return undefined for pixel-based inversion
                return undefined;
            }
        }
        function detectScaleType(values) {
            if (values.every(v => v instanceof Date)) {
                return 'time';
            }
            else if (values.every(v => typeof v === "string" || isNaN(v))) {
                return 'band';
            }
            else if (values.every(v => typeof v === "number")) {
                return 'linear';
            }
            else {
                return 'adaptive';
            }
        }
        function createAxis(scale, orientation = 'bottom') {
            let axis;
            switch (orientation) {
                case 'top':
                    axis = d3__namespace.axisTop(scale);
                    break;
                case 'bottom':
                    axis = d3__namespace.axisBottom(scale);
                    break;
                case 'left':
                    axis = d3__namespace.axisLeft(scale);
                    break;
                case 'right':
                    axis = d3__namespace.axisRight(scale);
                    break;
                default:
                    axis = d3__namespace.axisBottom(scale);
            }
            return axis;
        }
        return {
            formatTickValue,
            getTickCount,
            createColorScale,
            invertScale,
            detectScaleType,
            createAxis
        };
    }

    // MintWaterfall Brush Selection System - TypeScript Version
    // Provides interactive data selection with visual feedback and full type safety
    function createBrushSystem() {
        // Brush configuration
        const config = {
            enabled: true,
            extent: [[0, 0], [800, 400]],
            handleSize: 6,
            filter: null, // Use D3 default filter
            touchable: true,
            keyModifiers: true,
            selection: {
                fill: '#007acc',
                fillOpacity: 0.3,
                stroke: '#007acc',
                strokeWidth: 1,
                strokeDasharray: null
            },
            handles: {
                fill: '#fff',
                stroke: '#007acc',
                strokeWidth: 1,
                size: 6
            }
        };
        let brushBehavior = null;
        let currentSelection = null;
        let brushContainer = null;
        let dataPoints = [];
        // Event listeners
        const listeners = d3__namespace.dispatch("brushstart", "brush", "brushend", "clear");
        function createBrushBehavior() {
            if (brushBehavior)
                return brushBehavior;
            brushBehavior = d3__namespace.brush()
                .extent(config.extent)
                .handleSize(config.handleSize)
                .touchable(config.touchable)
                .keyModifiers(config.keyModifiers)
                .on("start", handleBrushStart)
                .on("brush", handleBrush)
                .on("end", handleBrushEnd);
            // Set filter if provided
            if (config.filter) {
                brushBehavior.filter(config.filter);
            }
            return brushBehavior;
        }
        function handleBrushStart(event) {
            const selection = convertD3Selection(event.selection);
            currentSelection = selection;
            const eventData = {
                selection,
                sourceEvent: event.sourceEvent,
                type: 'start'
            };
            listeners.call("brushstart", undefined, eventData);
        }
        function handleBrush(event) {
            const selection = convertD3Selection(event.selection);
            currentSelection = selection;
            const eventData = {
                selection,
                sourceEvent: event.sourceEvent,
                type: 'brush'
            };
            listeners.call("brush", undefined, eventData);
        }
        function handleBrushEnd(event) {
            const selection = convertD3Selection(event.selection);
            currentSelection = selection;
            const eventData = {
                selection,
                sourceEvent: event.sourceEvent,
                type: 'end'
            };
            listeners.call("brushend", undefined, eventData);
        }
        function convertD3Selection(d3Selection) {
            if (!d3Selection)
                return null;
            const [[x0, y0], [x1, y1]] = d3Selection;
            return {
                x: [Math.min(x0, x1), Math.max(x0, x1)],
                y: [Math.min(y0, y1), Math.max(y0, y1)]
            };
        }
        function convertToBrushSelection(selection) {
            return [
                [selection.x[0], selection.y[0]],
                [selection.x[1], selection.y[1]]
            ];
        }
        function applyBrushStyles() {
            if (!brushContainer)
                return;
            // Style the selection area
            brushContainer.selectAll(".selection")
                .style("fill", config.selection.fill)
                .style("fill-opacity", config.selection.fillOpacity)
                .style("stroke", config.selection.stroke)
                .style("stroke-width", config.selection.strokeWidth);
            // Apply stroke dash array only if it's not null
            if (config.selection.strokeDasharray) {
                brushContainer.selectAll(".selection")
                    .style("stroke-dasharray", config.selection.strokeDasharray);
            }
            // Style the handles
            brushContainer.selectAll(".handle")
                .style("fill", config.handles.fill)
                .style("stroke", config.handles.stroke)
                .style("stroke-width", config.handles.strokeWidth);
        }
        function filterDataBySelection(selection) {
            if (!selection || dataPoints.length === 0)
                return [];
            const [x0, x1] = selection.x;
            const [y0, y1] = selection.y;
            return dataPoints.filter(point => {
                return point.x >= x0 && point.x <= x1 &&
                    point.y >= y0 && point.y <= y1;
            });
        }
        // Enable brush
        function enable() {
            config.enabled = true;
            if (brushBehavior && brushContainer) {
                brushContainer.call(brushBehavior);
                applyBrushStyles();
            }
            return brushSystem;
        }
        // Disable brush
        function disable() {
            config.enabled = false;
            if (brushContainer) {
                brushContainer.on(".brush", null);
            }
            return brushSystem;
        }
        // Attach brush to container
        function attach(container) {
            brushContainer = container;
            if (config.enabled) {
                const behavior = createBrushBehavior();
                container.call(behavior);
                applyBrushStyles();
            }
            return brushSystem;
        }
        // Detach brush from container
        function detach() {
            if (brushContainer) {
                brushContainer.on(".brush", null);
                brushContainer.selectAll(".brush").remove();
                brushContainer = null;
            }
            return brushSystem;
        }
        // Clear current selection
        function clear() {
            if (brushContainer && brushBehavior) {
                brushContainer.call(brushBehavior.clear);
                currentSelection = null;
                listeners.call("clear", undefined, {
                    selection: null,
                    sourceEvent: null,
                    type: 'end'
                });
            }
            return brushSystem;
        }
        // Get current selection
        function getSelection() {
            return currentSelection;
        }
        // Set selection programmatically
        function setSelection(selection) {
            if (brushContainer && brushBehavior) {
                if (selection) {
                    const d3Selection = convertToBrushSelection(selection);
                    brushContainer.call(brushBehavior.move, d3Selection);
                }
                else {
                    brushContainer.call(brushBehavior.clear);
                }
                currentSelection = selection;
            }
            return brushSystem;
        }
        // Get data points within current selection
        function getSelectedData() {
            if (!currentSelection)
                return [];
            return filterDataBySelection(currentSelection);
        }
        // Set data points for selection filtering
        function setData(data) {
            dataPoints = [...data]; // Create a copy to avoid external mutations
            return brushSystem;
        }
        // Configure brush system
        function configure(newConfig) {
            const oldExtent = config.extent;
            Object.assign(config, newConfig);
            // Update brush behavior if it exists
            if (brushBehavior) {
                if (newConfig.extent && newConfig.extent !== oldExtent) {
                    brushBehavior.extent(newConfig.extent);
                }
                if (newConfig.handleSize !== undefined) {
                    brushBehavior.handleSize(newConfig.handleSize);
                }
                if (newConfig.touchable !== undefined) {
                    brushBehavior.touchable(newConfig.touchable);
                }
                if (newConfig.keyModifiers !== undefined) {
                    brushBehavior.keyModifiers(newConfig.keyModifiers);
                }
                if (newConfig.filter !== undefined) {
                    if (newConfig.filter) {
                        brushBehavior.filter(newConfig.filter);
                    }
                }
            }
            // Apply visual style updates
            if (brushContainer) {
                applyBrushStyles();
            }
            return brushSystem;
        }
        // Set brush extent
        function setExtent(extent) {
            config.extent = extent;
            if (brushBehavior) {
                brushBehavior.extent(extent);
            }
            return brushSystem;
        }
        // Check if brush is enabled
        function isEnabled() {
            return config.enabled;
        }
        // Add event listener
        function on(type, callback) {
            listeners.on(type, callback);
            return brushSystem;
        }
        // Remove event listener
        function off(type, callback) {
            listeners.on(type, null);
            return brushSystem;
        }
        const brushSystem = {
            enable,
            disable,
            attach,
            detach,
            clear,
            getSelection,
            setSelection,
            getSelectedData,
            setData,
            configure,
            setExtent,
            isEnabled,
            on,
            off
        };
        return brushSystem;
    }
    // Factory function that returns the expected test API
    function createBrushSystemFactory() {
        function createBrush(options = {}) {
            const { type = 'xy' } = options;
            switch (type) {
                case 'x':
                    return d3__namespace.brushX();
                case 'y':
                    return d3__namespace.brushY();
                case 'xy':
                default:
                    return d3__namespace.brush();
            }
        }
        function filterDataByBrush(data, selection, scale) {
            if (!selection || !scale)
                return data;
            const [start, end] = selection;
            return data.filter(d => {
                const value = scale(d.x || d.label || d.value);
                return value >= start && value <= end;
            });
        }
        function getSelectedIndices(data, selection, scale) {
            if (!selection || !scale)
                return [];
            const [start, end] = selection;
            const indices = [];
            data.forEach((d, i) => {
                const value = scale(d.x || d.label || d.value);
                if (value >= start && value <= end) {
                    indices.push(i);
                }
            });
            return indices;
        }
        const selectionUtils = {
            createSelectionSummary(selectedData) {
                if (!selectedData || selectedData.length === 0) {
                    return {
                        count: 0,
                        sum: 0,
                        average: 0,
                        min: 0,
                        max: 0
                    };
                }
                const values = selectedData.map(d => d.cumulativeTotal || d.value || d.y || 0);
                const sum = values.reduce((a, b) => a + b, 0);
                const min = Math.min(...values);
                const max = Math.max(...values);
                return {
                    count: selectedData.length,
                    sum,
                    average: sum / selectedData.length,
                    min,
                    max,
                    extent: [min, max]
                };
            }
        };
        const brushFactory = {
            createBrush,
            filterDataByBrush,
            getSelectedIndices,
            selectionUtils,
            onStart(handler) {
                return brushFactory;
            },
            onMove(handler) {
                return brushFactory;
            },
            onEnd(handler) {
                return brushFactory;
            }
        };
        return brushFactory;
    }

    // MintWaterfall Accessibility System - TypeScript Version
    // Provides WCAG 2.1 AA compliance features for screen readers and keyboard navigation with full type safety
    function createAccessibilitySystem() {
        let currentFocusIndex = -1;
        let focusableElements = [];
        let announceFunction = null;
        let descriptionId = null;
        // ARIA live region for dynamic announcements
        function createLiveRegion(container) {
            const liveRegion = container.append("div")
                .attr("id", "waterfall-live-region")
                .attr("aria-live", "polite")
                .attr("aria-atomic", "true")
                .style("position", "absolute")
                .style("left", "-10000px")
                .style("width", "1px")
                .style("height", "1px")
                .style("overflow", "hidden");
            return liveRegion;
        }
        // Create chart description for screen readers
        function createChartDescription(container, data, config = {}) {
            const { title = "Waterfall Chart", summary = "Interactive waterfall chart showing data progression", totalItems = Array.isArray(data) ? data.length : 1, showTotal: hasTotal = false } = config;
            const descId = "waterfall-description-" + Math.random().toString(36).substr(2, 9);
            const description = container.append("div")
                .attr("id", descId)
                .attr("class", "sr-only")
                .style("position", "absolute")
                .style("left", "-10000px")
                .style("width", "1px")
                .style("height", "1px")
                .style("overflow", "hidden");
            // Calculate summary statistics based on data structure
            let totalValue = 0;
            let positiveCount = 0;
            let negativeCount = 0;
            if (Array.isArray(data)) {
                // Waterfall chart data structure
                totalValue = data.reduce((sum, item) => {
                    if (item.stacks && Array.isArray(item.stacks)) {
                        return sum + item.stacks.reduce((stackSum, stack) => stackSum + (stack.value || 0), 0);
                    }
                    return sum;
                }, 0);
                positiveCount = data.filter(item => item.stacks && item.stacks.some(stack => (stack.value || 0) > 0)).length;
                negativeCount = data.filter(item => item.stacks && item.stacks.some(stack => stack.value < 0)).length;
            }
            else if (data && typeof data === "object" && data.children) {
                // Hierarchical chart data structure
                function calculateHierarchicalStats(node) {
                    if (node.children && Array.isArray(node.children)) {
                        return node.children.reduce((sum, child) => sum + calculateHierarchicalStats(child), 0);
                    }
                    else {
                        return node.value || 0;
                    }
                }
                totalValue = calculateHierarchicalStats(data);
                positiveCount = 1; // For hierarchical data, we consider it as one positive entity
                negativeCount = 0;
            }
            description.html(`
            <h3>${title}</h3>
            <p>${summary}</p>
            <p>This chart contains ${totalItems} data categories${hasTotal ? " plus a total bar" : ""}.</p>
            <p>Total value: ${config.formatNumber ? config.formatNumber(totalValue) : totalValue}</p>
            <p>${positiveCount} categories have positive values, ${negativeCount} have negative values.</p>
            <p>Use Tab to navigate between bars, Enter to hear details, and Arrow keys to move between bars.</p>
            <p>Press Escape to return focus to the chart container.</p>
        `);
            descriptionId = descId;
            return descId;
        }
        // Make chart elements keyboard accessible
        function makeAccessible(chartContainer, data, config = {}) {
            const svg = chartContainer.select("svg");
            // Add main chart ARIA attributes
            svg.attr("role", "img")
                .attr("aria-labelledby", descriptionId)
                .attr("tabindex", "0")
                .attr("aria-describedby", descriptionId);
            // Add keyboard event handlers to main SVG
            svg.on("keydown", function (event) {
                handleChartKeydown(event, data, config);
            });
            // Make individual bars focusable and accessible
            const bars = svg.selectAll(".bar-group");
            bars.each(function (d, i) {
                const bar = d3__namespace.select(this);
                const data = d;
                bar.attr("role", "button")
                    .attr("tabindex", "-1")
                    .attr("aria-label", createBarAriaLabel(data, i, config))
                    .attr("aria-describedby", `bar-description-${i}`)
                    .on("keydown", function (event) {
                    handleBarKeydown(event, data, i, [data], config);
                })
                    .on("focus", function () {
                    currentFocusIndex = i;
                    const element = this;
                    if (element) {
                        highlightFocusedElement(element);
                    }
                })
                    .on("blur", function () {
                    const element = this;
                    if (element) {
                        removeFocusHighlight(element);
                    }
                });
            });
            // Store focusable elements
            focusableElements = bars && bars.nodes && typeof bars.nodes === 'function'
                ? bars.nodes().filter(node => node !== null)
                : [];
            return {
                bars,
                focusableElements: focusableElements.length
            };
        }
        // Create ARIA label for individual bars
        function createBarAriaLabel(data, index, config = {}) {
            if (!data || !data.stacks || !Array.isArray(data.stacks)) {
                return `Item ${index + 1}: Invalid data`;
            }
            const totalValue = data.stacks.reduce((sum, stack) => sum + stack.value, 0);
            const stackCount = data.stacks.length;
            const formatNumber = config.formatNumber || ((n) => n.toString());
            let label = `${data.label}: ${formatNumber(totalValue)}`;
            if (stackCount > 1) {
                label += `, ${stackCount} segments`;
            }
            if (data.cumulative !== undefined) {
                label += `, cumulative total: ${formatNumber(data.cumulative)}`;
            }
            label += ". Press Enter for details.";
            return label;
        }
        // Handle keyboard navigation on chart level
        function handleChartKeydown(event, data, config) {
            switch (event.key) {
                case "Tab":
                    // Let default tab behavior work
                    break;
                case "ArrowRight":
                case "ArrowDown":
                    event.preventDefault();
                    moveFocus(1, data, config);
                    break;
                case "ArrowLeft":
                case "ArrowUp":
                    event.preventDefault();
                    moveFocus(-1, data, config);
                    break;
                case "Home":
                    event.preventDefault();
                    focusElement(0, data, config);
                    break;
                case "End":
                    event.preventDefault();
                    focusElement(focusableElements.length - 1, data, config);
                    break;
                case "Enter":
                case " ":
                    event.preventDefault();
                    if (currentFocusIndex >= 0) {
                        announceBarDetails(data[currentFocusIndex], currentFocusIndex, config);
                    }
                    else {
                        announceChartSummary(data, config);
                    }
                    break;
                case "Escape":
                    event.preventDefault();
                    returnFocusToChart();
                    break;
            }
        }
        // Handle keyboard events on individual bars
        function handleBarKeydown(event, barData, index, allData, config) {
            switch (event.key) {
                case "Enter":
                case " ":
                    event.preventDefault();
                    announceBarDetails(barData, index, config);
                    // Trigger click event for compatibility
                    d3__namespace.select(event.target).dispatch("click");
                    break;
                case "ArrowRight":
                case "ArrowDown":
                    event.preventDefault();
                    moveFocus(1, allData, config);
                    break;
                case "ArrowLeft":
                case "ArrowUp":
                    event.preventDefault();
                    moveFocus(-1, allData, config);
                    break;
            }
        }
        // Move focus between chart elements
        function moveFocus(direction, data, config) {
            if (focusableElements.length === 0)
                return;
            let newIndex = currentFocusIndex + direction;
            // Wrap around
            if (newIndex >= focusableElements.length) {
                newIndex = 0;
            }
            else if (newIndex < 0) {
                newIndex = focusableElements.length - 1;
            }
            focusElement(newIndex, data, config);
        }
        // Focus specific element by index
        function focusElement(index, data, config) {
            if (index < 0 || index >= focusableElements.length)
                return;
            currentFocusIndex = index;
            const element = focusableElements[index];
            if (element && element.focus) {
                element.focus();
            }
            // Announce the focused element
            const barData = data[index];
            announceBarFocus(barData, index, config);
        }
        // Return focus to main chart container
        function returnFocusToChart() {
            const svg = d3__namespace.select("svg[role='img']");
            if (!svg.empty()) {
                const svgNode = svg.node();
                if (svgNode) {
                    svgNode.focus();
                }
                currentFocusIndex = -1;
            }
        }
        // Visual focus indicators
        function highlightFocusedElement(element) {
            d3__namespace.select(element)
                .style("outline", "3px solid #4A90E2")
                .style("outline-offset", "2px");
        }
        function removeFocusHighlight(element) {
            d3__namespace.select(element)
                .style("outline", null)
                .style("outline-offset", null);
        }
        // Screen reader announcements
        function announceBarFocus(data, index, config) {
            const formatNumber = config.formatNumber || ((n) => n.toString());
            const totalValue = data.stacks.reduce((sum, stack) => sum + stack.value, 0);
            const message = `Focused on ${data.label}, value ${formatNumber(totalValue)}`;
            announce(message);
        }
        function announceBarDetails(data, index, config) {
            const formatNumber = config.formatNumber || ((n) => n.toString());
            const totalValue = data.stacks.reduce((sum, stack) => sum + stack.value, 0);
            let message = `${data.label}: Total value ${formatNumber(totalValue)}`;
            if (data.stacks.length > 1) {
                message += `. Contains ${data.stacks.length} segments: `;
                const segments = data.stacks.map(stack => `${stack.label || formatNumber(stack.value)}`).join(", ");
                message += segments;
            }
            if (data.cumulative !== undefined) {
                message += `. Cumulative total: ${formatNumber(data.cumulative)}`;
            }
            announce(message);
        }
        function announceChartSummary(data, config) {
            const formatNumber = config.formatNumber || ((n) => n.toString());
            const totalValue = data.reduce((sum, item) => {
                return sum + item.stacks.reduce((stackSum, stack) => stackSum + stack.value, 0);
            }, 0);
            const message = `Waterfall chart with ${data.length} categories. Total value: ${formatNumber(totalValue)}. Use arrow keys to navigate between bars.`;
            announce(message);
        }
        // Announce message to screen readers
        function announce(message) {
            const liveRegion = d3__namespace.select("#waterfall-live-region");
            if (!liveRegion.empty()) {
                liveRegion.text(message);
            }
            // Also call custom announce function if provided
            if (announceFunction) {
                announceFunction(message);
            }
        }
        // High contrast mode detection and support (Updated: 2025-08-28)
        function detectHighContrast() {
            // Check for modern forced colors mode and high contrast preferences
            if (window.matchMedia) {
                // First check for modern forced-colors mode (preferred)
                if (window.matchMedia("(forced-colors: active)").matches) {
                    return true;
                }
                // Then check for prefers-contrast
                if (window.matchMedia("(prefers-contrast: high)").matches) {
                    return true;
                }
                // Additional modern checks for high contrast scenarios
                if (window.matchMedia("(prefers-contrast: more)").matches) {
                    return true;
                }
                // Check for inverted colors which often indicates high contrast mode
                if (window.matchMedia("(inverted-colors: inverted)").matches) {
                    return true;
                }
                // Fallback: detect if system colors are being used (indicates forced colors)
                try {
                    const testElement = document.createElement("div");
                    testElement.style.color = "rgb(1, 2, 3)";
                    testElement.style.position = "absolute";
                    testElement.style.visibility = "hidden";
                    document.body.appendChild(testElement);
                    const computedColor = window.getComputedStyle(testElement).color;
                    document.body.removeChild(testElement);
                    // If the computed color doesn't match what we set, forced colors is likely active
                    return computedColor !== "rgb(1, 2, 3)";
                }
                catch (e) {
                    // If detection fails, assume no high contrast for safety
                    return false;
                }
            }
            return false;
        }
        function applyHighContrastStyles(chartContainer) {
            if (!detectHighContrast())
                return;
            const svg = chartContainer.select("svg");
            // Apply modern forced colors mode compatible styles using CSS system colors
            svg.selectAll(".bar-group rect")
                .style("stroke", "CanvasText")
                .style("stroke-width", "2px")
                .style("fill", "ButtonFace");
            svg.selectAll(".x-axis, .y-axis")
                .style("stroke", "CanvasText")
                .style("stroke-width", "2px");
            svg.selectAll("text")
                .style("fill", "CanvasText")
                .style("font-weight", "bold");
            // Apply high contrast styles to trend lines if present
            svg.selectAll(".trend-line")
                .style("stroke", "Highlight")
                .style("stroke-width", "3px");
            // Ensure tooltips work in forced colors mode
            svg.selectAll(".tooltip")
                .style("background", "Canvas")
                .style("border", "2px solid CanvasText")
                .style("color", "CanvasText");
        }
        // Inject CSS for forced colors mode support
        function injectForcedColorsCSS() {
            // Check if we're in a browser environment
            if (typeof document === "undefined")
                return; // Node.js environment
            const cssId = "mintwaterfall-forced-colors-css";
            if (document.getElementById(cssId))
                return; // Already injected
            const css = `
            @media (forced-colors: active) {
                .mintwaterfall-chart svg {
                    forced-color-adjust: none;
                }
                
                .mintwaterfall-chart .bar-group rect {
                    stroke: CanvasText !important;
                    stroke-width: 2px !important;
                }
                
                .mintwaterfall-chart .x-axis,
                .mintwaterfall-chart .y-axis {
                    stroke: CanvasText !important;
                    stroke-width: 2px !important;
                }
                
                .mintwaterfall-chart text {
                    fill: CanvasText !important;
                    font-weight: bold !important;
                }
                
                .mintwaterfall-chart .trend-line {
                    stroke: Highlight !important;
                    stroke-width: 3px !important;
                }
                
                .mintwaterfall-tooltip {
                    background: Canvas !important;
                    border: 2px solid CanvasText !important;
                    color: CanvasText !important;
                    forced-color-adjust: none;
                }
            }
            
            @media (prefers-contrast: high) {
                .mintwaterfall-chart .bar-group rect {
                    stroke-width: 2px !important;
                }
                
                .mintwaterfall-chart text {
                    font-weight: bold !important;
                }
            }
        `;
            const style = document.createElement("style");
            style.id = cssId;
            style.textContent = css;
            document.head.appendChild(style);
        }
        // Reduced motion support
        function respectsReducedMotion() {
            if (window.matchMedia) {
                return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
            }
            return false;
        }
        function getAccessibleAnimationDuration(defaultDuration) {
            return respectsReducedMotion() ? 0 : defaultDuration;
        }
        // Color contrast validation
        function validateColorContrast(foreground, background) {
            // Simplified contrast ratio calculation
            // In production, use a proper color contrast library
            const getLuminance = (color) => {
                // This is a simplified version - use a proper color library
                const colorRgb = d3Color.rgb(color);
                if (!colorRgb)
                    return 0;
                return (0.299 * colorRgb.r + 0.587 * colorRgb.g + 0.114 * colorRgb.b) / 255;
            };
            const l1 = getLuminance(foreground);
            const l2 = getLuminance(background);
            const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
            return {
                ratio,
                passesAA: ratio >= 4.5,
                passesAAA: ratio >= 7
            };
        }
        // Public API
        const accessibilitySystem = {
            createLiveRegion,
            createChartDescription,
            makeAccessible,
            handleChartKeydown,
            handleBarKeydown,
            moveFocus,
            focusElement,
            announce,
            detectHighContrast,
            applyHighContrastStyles,
            injectForcedColorsCSS,
            respectsReducedMotion,
            getAccessibleAnimationDuration,
            validateColorContrast,
            // Configuration
            setAnnounceFunction(fn) {
                announceFunction = fn;
                return this;
            },
            getCurrentFocus() {
                return currentFocusIndex;
            },
            getFocusableCount() {
                return focusableElements.length;
            }
        };
        return accessibilitySystem;
    }
    // Global accessibility system instance
    const accessibilitySystem = createAccessibilitySystem();
    // Inject CSS support immediately for global instance (only in browser)
    if (typeof document !== "undefined") {
        accessibilitySystem.injectForcedColorsCSS();
    }

    // MintWaterfall Professional Tooltip System - TypeScript Version
    // Provides intelligent positioning, rich content, and customizable styling with full type safety
    function createTooltipSystem() {
        let tooltipContainer = null;
        let currentTooltip = null;
        let config = {
            className: "mintwaterfall-tooltip",
            theme: "default",
            position: "smart",
            offset: { x: 10, y: -10 },
            animation: {
                duration: 200,
                easing: "ease-out"
            },
            collision: {
                boundary: "viewport",
                flip: true,
                shift: true
            },
            content: {
                maxWidth: 300,
                padding: 12
            }
        };
        // Initialize tooltip container
        function initializeTooltip() {
            if (tooltipContainer)
                return tooltipContainer;
            tooltipContainer = d3__namespace.select("body")
                .append("div")
                .attr("class", config.className)
                .style("position", "absolute")
                .style("visibility", "hidden")
                .style("pointer-events", "none")
                .style("z-index", "9999")
                .style("opacity", "0")
                .style("transition", `opacity ${config.animation.duration}ms ${config.animation.easing}`);
            applyTheme(config.theme);
            return tooltipContainer;
        }
        // Apply tooltip theme
        function applyTheme(themeName) {
            if (!tooltipContainer)
                return;
            const themes = {
                default: {
                    background: "rgba(0, 0, 0, 0.9)",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "6px",
                    fontSize: "13px",
                    fontFamily: "system-ui, -apple-system, sans-serif",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
                    maxWidth: `${config.content.maxWidth}px`,
                    padding: `${config.content.padding}px`
                },
                light: {
                    background: "rgba(255, 255, 255, 0.95)",
                    color: "#333333",
                    border: "1px solid rgba(0, 0, 0, 0.1)",
                    borderRadius: "6px",
                    fontSize: "13px",
                    fontFamily: "system-ui, -apple-system, sans-serif",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                    maxWidth: `${config.content.maxWidth}px`,
                    padding: `${config.content.padding}px`
                },
                minimal: {
                    background: "#333333",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "3px",
                    fontSize: "12px",
                    fontFamily: "monospace",
                    boxShadow: "none",
                    maxWidth: `${config.content.maxWidth}px`,
                    padding: "8px 10px"
                },
                corporate: {
                    background: "#2c3e50",
                    color: "#ecf0f1",
                    border: "1px solid #34495e",
                    borderRadius: "4px",
                    fontSize: "13px",
                    fontFamily: "system-ui, -apple-system, sans-serif",
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
                    maxWidth: `${config.content.maxWidth}px`,
                    padding: `${config.content.padding}px`
                }
            };
            const theme = themes[themeName] || themes.default;
            Object.keys(theme).forEach((property) => {
                const cssProperty = property.replace(/([A-Z])/g, "-$1").toLowerCase();
                const value = theme[property];
                tooltipContainer.style(cssProperty, value);
            });
        }
        // Show tooltip with content
        function show(content, event, data = null) {
            if (!tooltipContainer)
                initializeTooltip();
            // Generate content
            const htmlContent = generateContent(content, data);
            tooltipContainer
                .html(htmlContent)
                .style("visibility", "visible");
            // Position tooltip
            positionTooltip(event);
            // Animate in
            tooltipContainer
                .transition()
                .duration(config.animation.duration)
                .style("opacity", "1");
            currentTooltip = { content, event, data };
            return tooltipContainer;
        }
        // Hide tooltip
        function hide() {
            if (!tooltipContainer)
                return;
            tooltipContainer
                .transition()
                .duration(config.animation.duration)
                .style("opacity", "0")
                .on("end", function () {
                d3__namespace.select(this).style("visibility", "hidden");
            });
            currentTooltip = null;
            return tooltipContainer;
        }
        // Update tooltip position
        function move(event) {
            if (!tooltipContainer || !currentTooltip)
                return;
            positionTooltip(event);
            return tooltipContainer;
        }
        // Generate tooltip content
        function generateContent(content, data) {
            if (typeof content === "function") {
                return content(data);
            }
            if (typeof content === "string") {
                return content;
            }
            if (typeof content === "object" && content && 'template' in content) {
                return renderTemplate(content.template, data, content.formatters);
            }
            // Default content for waterfall chart data
            if (data) {
                return generateDefaultContent(data);
            }
            return "";
        }
        // Generate default content for chart data
        function generateDefaultContent(data) {
            const formatNumber = config.formatNumber || ((n) => n.toLocaleString());
            let html = `<div class="tooltip-header"><strong>${data.label}</strong></div>`;
            if (data.stacks && data.stacks.length > 0) {
                const totalValue = data.stacks.reduce((sum, stack) => sum + stack.value, 0);
                html += `<div class="tooltip-total">Total: ${formatNumber(totalValue)}</div>`;
                if (data.stacks.length > 1) {
                    html += "<div class=\"tooltip-stacks\">";
                    data.stacks.forEach(stack => {
                        const color = stack.color || "#666";
                        const label = stack.label || formatNumber(stack.value);
                        html += `
                        <div class="tooltip-stack-item">
                            <span class="tooltip-color-indicator" style="background-color: ${color}"></span>
                            <span class="tooltip-stack-label">${label}</span>
                            <span class="tooltip-stack-value">${formatNumber(stack.value)}</span>
                        </div>
                    `;
                    });
                    html += "</div>";
                }
            }
            return html;
        }
        // Render template with data
        function renderTemplate(template, data, formatters = {}) {
            if (!data)
                return template;
            let rendered = template;
            // Replace placeholders like {{key}} with data values
            rendered = rendered.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (match, key) => {
                const value = getNestedValue(data, key);
                const formatter = formatters[key];
                if (formatter && typeof formatter === 'function') {
                    return formatter(value);
                }
                return value != null ? String(value) : '';
            });
            return rendered;
        }
        // Get nested value from object using dot notation
        function getNestedValue(obj, path) {
            return path.split('.').reduce((current, key) => current?.[key], obj);
        }
        // Position tooltip intelligently
        function positionTooltip(event) {
            if (!tooltipContainer)
                return;
            const mouseEvent = event;
            const tooltipNode = tooltipContainer.node();
            if (!tooltipNode)
                return;
            const tooltipRect = tooltipNode.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            let x = mouseEvent.pageX + config.offset.x;
            let y = mouseEvent.pageY + config.offset.y;
            // Smart positioning to avoid viewport edges
            if (config.position === "smart") {
                const position = calculateSmartPosition({ x: mouseEvent.clientX, y: mouseEvent.clientY }, { width: tooltipRect.width, height: tooltipRect.height }, { width: viewportWidth, height: viewportHeight });
                x = position.x + window.pageXOffset;
                y = position.y + window.pageYOffset;
            }
            tooltipContainer
                .style("left", `${x}px`)
                .style("top", `${y}px`);
        }
        // Calculate smart position to avoid clipping
        function calculateSmartPosition(mouse, tooltip, viewport) {
            const padding = 10;
            let x = mouse.x + config.offset.x;
            let y = mouse.y + config.offset.y;
            let quadrant = 1;
            // Check right edge
            if (x + tooltip.width + padding > viewport.width) {
                x = mouse.x - tooltip.width - Math.abs(config.offset.x);
                quadrant = 2;
            }
            // Check bottom edge
            if (y + tooltip.height + padding > viewport.height) {
                y = mouse.y - tooltip.height - Math.abs(config.offset.y);
                quadrant = quadrant === 2 ? 3 : 4;
            }
            // Check left edge
            if (x < padding) {
                x = padding;
            }
            // Check top edge
            if (y < padding) {
                y = padding;
            }
            return { x, y, quadrant };
        }
        // Configure tooltip
        function configure(newConfig) {
            config = { ...config, ...newConfig };
            if (tooltipContainer && newConfig.theme) {
                applyTheme(newConfig.theme);
            }
            return tooltipSystem;
        }
        // Set theme
        function theme(themeName) {
            config.theme = themeName;
            if (tooltipContainer) {
                applyTheme(themeName);
            }
            return tooltipSystem;
        }
        // Destroy tooltip
        function destroy() {
            if (tooltipContainer) {
                tooltipContainer.remove();
                tooltipContainer = null;
            }
            currentTooltip = null;
        }
        // Check if tooltip is visible
        function isVisible() {
            return tooltipContainer !== null && tooltipContainer.style("visibility") === "visible";
        }
        // Get current tooltip data
        function getCurrentData() {
            return currentTooltip?.data || null;
        }
        const tooltipSystem = {
            show,
            hide,
            move,
            theme,
            configure,
            destroy,
            isVisible,
            getCurrentData
        };
        return tooltipSystem;
    }

    // MintWaterfall Export System - TypeScript Version
    // Provides SVG, PNG, PDF, and data export capabilities with full type safety
    function createExportSystem() {
        let config = {
            filename: "waterfall-chart",
            quality: 1.0,
            scale: 1,
            background: "#ffffff",
            padding: 20,
            includeStyles: true,
            includeData: true
        };
        // Export chart as SVG
        function exportSVG(chartContainer, options = {}) {
            const opts = { ...config, ...options };
            try {
                const svg = chartContainer.select("svg");
                if (svg.empty()) {
                    throw new Error("No SVG element found in chart container");
                }
                const svgNode = svg.node();
                const serializer = new XMLSerializer();
                // Clone SVG to avoid modifying original
                const clonedSvg = svgNode.cloneNode(true);
                // Add styles if requested
                if (opts.includeStyles) {
                    addInlineStyles(clonedSvg);
                }
                // Add background if specified
                if (opts.background && opts.background !== "transparent") {
                    addBackground(clonedSvg, opts.background);
                }
                // Serialize to string
                const svgString = serializer.serializeToString(clonedSvg);
                // Create downloadable blob
                const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
                return {
                    blob,
                    url: URL.createObjectURL(blob),
                    data: svgString,
                    download: () => downloadBlob(blob, `${opts.filename}.svg`)
                };
            }
            catch (error) {
                console.error("SVG export failed:", error);
                throw error;
            }
        }
        // Export chart as PNG with enhanced features
        function exportPNG(chartContainer, options = {}) {
            const opts = {
                ...config,
                scale: 2, // Default to 2x for high-DPI
                quality: 0.95,
                ...options
            };
            return new Promise((resolve, reject) => {
                try {
                    const svg = chartContainer.select("svg");
                    if (svg.empty()) {
                        reject(new Error("No SVG element found in chart container"));
                        return;
                    }
                    const svgNode = svg.node();
                    const bbox = svgNode.getBBox();
                    const width = (bbox.width + opts.padding * 2) * opts.scale;
                    const height = (bbox.height + opts.padding * 2) * opts.scale;
                    // Create high-DPI canvas
                    const canvas = document.createElement("canvas");
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext("2d");
                    if (!ctx) {
                        reject(new Error("Failed to get canvas context"));
                        return;
                    }
                    // Enable high-quality rendering
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = "high";
                    // Set background
                    if (opts.background && opts.background !== "transparent") {
                        ctx.fillStyle = opts.background;
                        ctx.fillRect(0, 0, width, height);
                    }
                    // Convert SVG to image with enhanced error handling
                    const svgExport = exportSVG(chartContainer, {
                        ...opts,
                        includeStyles: true,
                        background: "transparent" // Let canvas handle background
                    });
                    const img = new Image();
                    img.onload = () => {
                        try {
                            // Draw image with proper scaling and positioning
                            ctx.drawImage(img, opts.padding * opts.scale, opts.padding * opts.scale);
                            // Convert to blob
                            canvas.toBlob((blob) => {
                                if (!blob) {
                                    reject(new Error("Failed to create PNG blob"));
                                    return;
                                }
                                // Clean up
                                URL.revokeObjectURL(svgExport.url);
                                resolve({
                                    blob,
                                    url: URL.createObjectURL(blob),
                                    data: svgExport.data,
                                    download: () => downloadBlob(blob, `${opts.filename}.png`)
                                });
                            }, "image/png", opts.quality);
                        }
                        catch (drawError) {
                            reject(new Error(`PNG rendering failed: ${drawError}`));
                        }
                    };
                    img.onerror = () => {
                        reject(new Error("Failed to load SVG image for PNG conversion"));
                    };
                    // Load SVG as data URL
                    img.src = `data:image/svg+xml;base64,${btoa(svgExport.data)}`;
                }
                catch (error) {
                    reject(new Error(`PNG export failed: ${error}`));
                }
            });
        }
        // Export chart as PDF (requires external library like jsPDF)
        function exportPDF(chartContainer, options = {}) {
            const opts = {
                ...config,
                orientation: 'landscape',
                pageFormat: 'a4',
                ...options
            };
            return new Promise((resolve, reject) => {
                // Check if jsPDF is available
                if (typeof window === 'undefined' || !window.jsPDF) {
                    reject(new Error('jsPDF library is required for PDF export. Please include it: <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>'));
                    return;
                }
                try {
                    // Get PNG data first
                    exportPNG(chartContainer, {
                        ...opts,
                        scale: 2,
                        quality: 0.95
                    }).then((pngResult) => {
                        const jsPDF = window.jsPDF;
                        const pdf = new jsPDF({
                            orientation: opts.orientation,
                            unit: 'mm',
                            format: opts.pageFormat
                        });
                        // Calculate dimensions
                        const pdfWidth = pdf.internal.pageSize.getWidth();
                        const pdfHeight = pdf.internal.pageSize.getHeight();
                        // Add image to PDF
                        const reader = new FileReader();
                        reader.onload = () => {
                            try {
                                const imgData = reader.result;
                                // Calculate aspect ratio and size
                                const img = new Image();
                                img.onload = () => {
                                    const aspectRatio = img.width / img.height;
                                    let width = pdfWidth - 20; // 10mm margin on each side
                                    let height = width / aspectRatio;
                                    // Adjust if height is too large
                                    if (height > pdfHeight - 20) {
                                        height = pdfHeight - 20;
                                        width = height * aspectRatio;
                                    }
                                    const x = (pdfWidth - width) / 2;
                                    const y = (pdfHeight - height) / 2;
                                    pdf.addImage(imgData, 'PNG', x, y, width, height);
                                    // Generate PDF blob
                                    const pdfBlob = pdf.output('blob');
                                    // Clean up
                                    URL.revokeObjectURL(pngResult.url);
                                    resolve({
                                        blob: pdfBlob,
                                        url: URL.createObjectURL(pdfBlob),
                                        data: pdfBlob,
                                        download: () => downloadBlob(pdfBlob, `${opts.filename}.pdf`)
                                    });
                                };
                                img.src = imgData;
                            }
                            catch (pdfError) {
                                reject(new Error(`PDF generation failed: ${pdfError}`));
                            }
                        };
                        reader.onerror = () => {
                            reject(new Error("Failed to read PNG data for PDF conversion"));
                        };
                        reader.readAsDataURL(pngResult.blob);
                    }).catch(reject);
                }
                catch (error) {
                    reject(new Error(`PDF export failed: ${error}`));
                }
            });
        }
        // Export data in various formats
        function exportData(data, options = {}) {
            const opts = {
                ...config,
                dataFormat: 'json',
                includeMetadata: true,
                delimiter: ',',
                ...options
            };
            try {
                let content;
                let mimeType;
                let extension;
                switch (opts.dataFormat) {
                    case 'json':
                        const jsonData = opts.includeMetadata
                            ? {
                                data,
                                metadata: {
                                    exportDate: new Date().toISOString(),
                                    count: data.length
                                }
                            }
                            : data;
                        content = JSON.stringify(jsonData, null, 2);
                        mimeType = 'application/json';
                        extension = 'json';
                        break;
                    case 'csv':
                        content = convertToCSV(data, opts.delimiter || ',');
                        mimeType = 'text/csv';
                        extension = 'csv';
                        break;
                    case 'tsv':
                        content = convertToCSV(data, '\t');
                        mimeType = 'text/tab-separated-values';
                        extension = 'tsv';
                        break;
                    default:
                        throw new Error(`Unsupported data export format: ${opts.dataFormat}`);
                }
                const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
                return {
                    blob,
                    url: URL.createObjectURL(blob),
                    data: content,
                    download: () => downloadBlob(blob, `${opts.filename}.${extension}`)
                };
            }
            catch (error) {
                console.error("Data export failed:", error);
                throw error;
            }
        }
        // Helper function to add inline styles to SVG
        function addInlineStyles(svgElement) {
            try {
                const styleSheets = Array.from(document.styleSheets);
                let styles = '';
                styleSheets.forEach(sheet => {
                    try {
                        const rules = Array.from(sheet.cssRules || sheet.rules);
                        rules.forEach(rule => {
                            if (rule.type === CSSRule.STYLE_RULE) {
                                const styleRule = rule;
                                if (styleRule.selectorText &&
                                    (styleRule.selectorText.includes('.mintwaterfall') ||
                                        styleRule.selectorText.includes('svg') ||
                                        styleRule.selectorText.includes('chart'))) {
                                    styles += styleRule.cssText;
                                }
                            }
                        });
                    }
                    catch (e) {
                        // Skip inaccessible stylesheets (CORS)
                        console.warn('Could not access stylesheet:', e);
                    }
                });
                if (styles) {
                    const styleElement = document.createElementNS('http://www.w3.org/2000/svg', 'style');
                    styleElement.textContent = styles;
                    svgElement.insertBefore(styleElement, svgElement.firstChild);
                }
            }
            catch (error) {
                console.warn('Failed to add inline styles:', error);
            }
        }
        // Helper function to add background to SVG
        function addBackground(svgElement, backgroundColor) {
            const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            rect.setAttribute('width', '100%');
            rect.setAttribute('height', '100%');
            rect.setAttribute('fill', backgroundColor);
            svgElement.insertBefore(rect, svgElement.firstChild);
        }
        // Helper function to convert data to CSV
        function convertToCSV(data, delimiter = ',') {
            if (!data || data.length === 0)
                return '';
            // Get headers from first object
            const headers = Object.keys(data[0]);
            // Create CSV content
            const csvContent = [
                headers.join(delimiter),
                ...data.map(row => headers.map(header => {
                    const value = row[header];
                    // Escape quotes and wrap in quotes if contains delimiter
                    const stringValue = value != null ? String(value) : '';
                    if (stringValue.includes(delimiter) || stringValue.includes('"') || stringValue.includes('\n')) {
                        return `"${stringValue.replace(/"/g, '""')}"`;
                    }
                    return stringValue;
                }).join(delimiter))
            ].join('\n');
            return csvContent;
        }
        // Helper function to download blob
        function downloadBlob(blob, filename) {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }
        // Configure export system
        function configure(newConfig) {
            config = { ...config, ...newConfig };
            return exportSystem;
        }
        // Download file utility
        function downloadFile(content, filename, mimeType = 'text/plain') {
            const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
            downloadBlob(blob, filename);
        }
        const exportSystem = {
            exportSVG,
            exportPNG,
            exportPDF,
            exportData,
            configure,
            downloadFile
        };
        return exportSystem;
    }

    // MintWaterfall Zoom & Pan System - TypeScript Version
    // Provides interactive zoom and pan functionality with smooth performance and full type safety
    function createZoomSystem() {
        // Zoom configuration
        const config = {
            enabled: true,
            scaleExtent: [0.1, 10],
            translateExtent: null, // Auto-calculated based on chart dimensions
            wheelDelta: null, // Use D3 default for proper zoom in/out
            touchable: true,
            filter: null, // Custom filter function
            constrain: {
                x: true,
                y: true
            },
            duration: 250,
            ease: d3__namespace.easeQuadOut
        };
        let zoomBehavior = null;
        let currentTransform = d3__namespace.zoomIdentity;
        let chartContainer = null;
        let chartDimensions = {
            width: 800,
            height: 400,
            margin: { top: 60, right: 80, bottom: 60, left: 80 }
        };
        // Event listeners
        const listeners = d3__namespace.dispatch("zoomstart", "zoom", "zoomend", "reset");
        function createZoomBehavior() {
            if (zoomBehavior)
                return zoomBehavior;
            zoomBehavior = d3__namespace.zoom()
                .scaleExtent(config.scaleExtent)
                .touchable(config.touchable)
                .filter(config.filter || defaultFilter)
                .on("start", handleZoomStart)
                .on("zoom", handleZoom)
                .on("end", handleZoomEnd);
            // Only set wheelDelta if explicitly configured (null means use D3 default)
            if (config.wheelDelta !== null) {
                zoomBehavior.wheelDelta(config.wheelDelta);
            }
            updateTranslateExtent();
            return zoomBehavior;
        }
        function defaultFilter(event) {
            // Allow zoom on wheel, but prevent on right-click
            return (!event.ctrlKey || event.type === "wheel") && !event.button;
        }
        function updateTranslateExtent() {
            if (!zoomBehavior || !chartDimensions)
                return;
            const { width, height, margin } = chartDimensions;
            const chartWidth = width - margin.left - margin.right;
            const chartHeight = height - margin.top - margin.bottom;
            // Calculate translate extent based on zoom constraints
            const extent = config.translateExtent || [
                [-chartWidth * 2, -chartHeight * 2],
                [chartWidth * 3, chartHeight * 3]
            ];
            zoomBehavior.translateExtent(extent);
        }
        function handleZoomStart(event) {
            const eventData = {
                transform: event.transform,
                sourceEvent: event.sourceEvent
            };
            listeners.call("zoomstart", undefined, eventData);
        }
        function handleZoom(event) {
            currentTransform = event.transform;
            // Apply constraints if specified
            if (!config.constrain.x) {
                currentTransform = currentTransform.translate(-currentTransform.x, 0);
            }
            if (!config.constrain.y) {
                currentTransform = currentTransform.translate(0, -currentTransform.y);
            }
            // Apply transform to chart elements
            if (chartContainer) {
                applyTransform(chartContainer, currentTransform);
            }
            const eventData = {
                transform: currentTransform,
                sourceEvent: event.sourceEvent
            };
            listeners.call("zoom", undefined, eventData);
        }
        function handleZoomEnd(event) {
            const eventData = {
                transform: event.transform,
                sourceEvent: event.sourceEvent
            };
            listeners.call("zoomend", undefined, eventData);
        }
        function applyTransform(container, transform) {
            // Apply transform to the main chart group
            const chartGroup = container.select(".chart-group");
            if (!chartGroup.empty()) {
                chartGroup.attr("transform", transform.toString());
            }
            // Update axes if they exist
            updateAxes(container, transform);
        }
        function updateAxes(container, transform) {
            // Update X axis if constrained
            if (config.constrain.x) {
                const xAxisGroup = container.select(".x-axis");
                if (!xAxisGroup.empty()) {
                    const xScale = getScaleFromAxis(xAxisGroup);
                    if (xScale) {
                        const newXScale = transform.rescaleX(xScale);
                        xAxisGroup.call(d3__namespace.axisBottom(newXScale));
                    }
                }
            }
            // Update Y axis if constrained
            if (config.constrain.y) {
                const yAxisGroup = container.select(".y-axis");
                if (!yAxisGroup.empty()) {
                    const yScale = getScaleFromAxis(yAxisGroup);
                    if (yScale) {
                        const newYScale = transform.rescaleY(yScale);
                        yAxisGroup.call(d3__namespace.axisLeft(newYScale));
                    }
                }
            }
        }
        function getScaleFromAxis(axisGroup) {
            // This is a simplified implementation - in practice, you'd store references to scales
            // or implement a more sophisticated scale retrieval mechanism
            try {
                const axisNode = axisGroup.node();
                if (axisNode && axisNode.__scale__) {
                    return axisNode.__scale__;
                }
            }
            catch (e) {
                // Scale retrieval failed - this is expected in some cases
            }
            return null;
        }
        // Enable zoom
        function enable() {
            config.enabled = true;
            if (zoomBehavior && chartContainer) {
                chartContainer.call(zoomBehavior);
            }
            return zoomSystem;
        }
        // Disable zoom
        function disable() {
            config.enabled = false;
            if (chartContainer) {
                chartContainer.on(".zoom", null);
            }
            return zoomSystem;
        }
        // Attach zoom to container
        function attach(container) {
            chartContainer = container;
            if (config.enabled) {
                const behavior = createZoomBehavior();
                container.call(behavior);
            }
            return zoomSystem;
        }
        // Detach zoom from container
        function detach() {
            if (chartContainer) {
                chartContainer.on(".zoom", null);
                chartContainer = null;
            }
            return zoomSystem;
        }
        // Transform to specific state
        function transform(selection, newTransform, duration = 0) {
            if (!zoomBehavior)
                createZoomBehavior();
            if (duration > 0) {
                selection
                    .transition()
                    .duration(duration)
                    .ease(config.ease)
                    .call(zoomBehavior.transform, newTransform);
            }
            else {
                selection.call(zoomBehavior.transform, newTransform);
            }
            return zoomSystem;
        }
        // Reset zoom to identity
        function reset(duration = config.duration) {
            if (chartContainer) {
                transform(chartContainer, d3__namespace.zoomIdentity, duration);
                listeners.call("reset", undefined, { transform: d3__namespace.zoomIdentity, sourceEvent: null });
            }
            return zoomSystem;
        }
        // Zoom to specific bounds
        function zoomTo(bounds, duration = config.duration) {
            if (!chartContainer || !chartDimensions)
                return zoomSystem;
            const { width, height, margin } = chartDimensions;
            const chartWidth = width - margin.left - margin.right;
            const chartHeight = height - margin.top - margin.bottom;
            // Calculate transform to fit bounds
            const [x0, x1] = bounds.x;
            const [y0, y1] = bounds.y;
            const scale = Math.min(chartWidth / (x1 - x0), chartHeight / (y1 - y0));
            const translateX = chartWidth / 2 - scale * (x0 + x1) / 2;
            const translateY = chartHeight / 2 - scale * (y0 + y1) / 2;
            const newTransform = d3__namespace.zoomIdentity
                .translate(translateX, translateY)
                .scale(scale);
            transform(chartContainer, newTransform, duration);
            return zoomSystem;
        }
        // Set chart dimensions
        function setDimensions(dimensions) {
            chartDimensions = dimensions;
            updateTranslateExtent();
            return zoomSystem;
        }
        // Configure zoom system
        function configure(newConfig) {
            Object.assign(config, newConfig);
            // Update zoom behavior if it exists
            if (zoomBehavior) {
                if (newConfig.scaleExtent) {
                    zoomBehavior.scaleExtent(newConfig.scaleExtent);
                }
                if (newConfig.touchable !== undefined) {
                    zoomBehavior.touchable(newConfig.touchable);
                }
                if (newConfig.filter !== undefined) {
                    zoomBehavior.filter(newConfig.filter || defaultFilter);
                }
                if (newConfig.wheelDelta !== undefined) {
                    if (newConfig.wheelDelta) {
                        zoomBehavior.wheelDelta(newConfig.wheelDelta);
                    }
                }
            }
            updateTranslateExtent();
            return zoomSystem;
        }
        // Get current transform
        function getCurrentTransform() {
            return currentTransform;
        }
        // Check if zoom is enabled
        function isEnabled() {
            return config.enabled;
        }
        // Add event listener
        function on(type, callback) {
            listeners.on(type, callback);
            return zoomSystem;
        }
        // Remove event listener
        function off(type, callback) {
            if (callback) {
                listeners.on(type, null);
            }
            else {
                listeners.on(type, null);
            }
            return zoomSystem;
        }
        const zoomSystem = {
            enable,
            disable,
            attach,
            detach,
            transform,
            reset,
            zoomTo,
            setDimensions,
            configure,
            getCurrentTransform,
            isEnabled,
            on,
            off
        };
        return zoomSystem;
    }
    // The function is already exported above, no need for duplicate export

    // MintWaterfall Performance System - TypeScript Version
    // Implements virtualization, incremental updates, and memory optimization with full type safety
    function createPerformanceManager() {
        // Performance metrics tracking
        let performanceMetrics = {
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
        let virtualizationConfig = {
            enabled: false,
            chunkSize: 1000,
            renderThreshold: 10000,
            bufferSize: 200,
            preloadCount: 3,
            recycleNodes: true
        };
        // Performance optimization settings
        let optimizationConfig = {
            memoryPooling: true};
        // Memory pool for reusing DOM elements
        let memoryPool = {
            elements: new Map(),
            maxSize: 1000,
            currentSize: 0,
            hitCount: 0,
            missCount: 0
        };
        // Performance profiling
        let profilers = new Map();
        let dashboardElement = null;
        // Frame rate tracking
        let frameCount = 0;
        let lastFpsTime = performance.now();
        function enableVirtualization(options = {}) {
            Object.assign(virtualizationConfig, options);
            virtualizationConfig.enabled = true;
            console.log('MintWaterfall: Virtualization enabled with config:', virtualizationConfig);
            return performanceManager;
        }
        function disableVirtualization() {
            virtualizationConfig.enabled = false;
            console.log('MintWaterfall: Virtualization disabled');
            return performanceManager;
        }
        function calculateVisibleRange(scrollTop, containerHeight, itemHeight) {
            const start = Math.floor(scrollTop / itemHeight);
            const visibleCount = Math.ceil(containerHeight / itemHeight);
            const end = start + visibleCount;
            // Add buffer for smooth scrolling
            const bufferStart = Math.max(0, start - virtualizationConfig.bufferSize);
            const bufferEnd = end + virtualizationConfig.bufferSize;
            return [bufferStart, bufferEnd];
        }
        function optimizeRendering(container, data) {
            const startTime = performance.now();
            performanceMetrics.totalElements = data.length;
            if (virtualizationConfig.enabled && data.length > virtualizationConfig.renderThreshold) {
                renderVirtualized(container, data);
            }
            else {
                renderDirect(container, data);
            }
            const endTime = performance.now();
            performanceMetrics.renderTime = endTime - startTime;
            performanceMetrics.renderCalls++;
            updateFPS();
            return performanceManager;
        }
        function renderVirtualized(container, data) {
            // Implement virtualization logic
            const containerNode = container.node();
            if (!containerNode)
                return;
            const containerHeight = containerNode.clientHeight;
            const scrollTop = containerNode.scrollTop || 0;
            const itemHeight = 30; // Estimate or calculate from data
            const [visibleStart, visibleEnd] = calculateVisibleRange(scrollTop, containerHeight, itemHeight);
            const visibleData = data.slice(visibleStart, Math.min(visibleEnd, data.length));
            visibleData.map((_, i) => i + visibleStart);
            performanceMetrics.visibleElements = visibleData.length;
            // Render only visible elements with proper typing
            const elements = container.selectAll('.virtual-item')
                .data(visibleData, (d, i) => `item-${i + visibleStart}`);
            elements.exit().remove();
            const enter = elements.enter().append('g')
                .attr('class', 'virtual-item');
            const merged = elements.merge(enter);
            merged.attr('transform', (d, i) => `translate(0, ${(i + visibleStart) * itemHeight})`);
        }
        function renderDirect(container, data) {
            // Standard rendering for smaller datasets
            performanceMetrics.visibleElements = data.length;
            const elements = container.selectAll('.chart-element')
                .data(data);
            elements.exit().remove();
            const enter = elements.enter().append('g')
                .attr('class', 'chart-element');
            elements.merge(enter);
            // Apply transformations and styles here - merged variable prevents compilation errors
        }
        function profileOperation(name, operation) {
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
            const profiler = profilers.get(name);
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
        function getMetrics() {
            // Update memory usage if available
            if ('memory' in performance) {
                const memInfo = performance.memory;
                performanceMetrics.memoryUsage = memInfo.usedJSHeapSize;
                performanceMetrics.peakMemoryUsage = Math.max(performanceMetrics.peakMemoryUsage, memInfo.usedJSHeapSize);
            }
            return { ...performanceMetrics };
        }
        function resetMetrics() {
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
        function enableMemoryPooling(options = {}) {
            Object.assign(memoryPool, options);
            optimizationConfig.memoryPooling = true;
            console.log('MintWaterfall: Memory pooling enabled');
            return performanceManager;
        }
        function createRenderBatch() {
            return {
                operations: [],
                priority: 1,
                timestamp: performance.now(),
                elementCount: 0
            };
        }
        function flushRenderBatch(batch) {
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
        function executeRenderOperation(operation) {
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
        function setUpdateStrategy(strategy) {
            console.log(`MintWaterfall: Update strategy set to ${strategy}`);
            return performanceManager;
        }
        function updateFPS() {
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
        function createDashboard() {
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
        function updateDashboard() {
            if (!dashboardElement)
                return;
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
        function enableDashboard(container) {
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
        function disableDashboard() {
            if (dashboardElement && dashboardElement.parentNode) {
                dashboardElement.parentNode.removeChild(dashboardElement);
                dashboardElement = null;
            }
            return performanceManager;
        }
        function getDashboard() {
            return dashboardElement;
        }
        function optimizeMemory() {
            // Force garbage collection if available
            if (window.gc) {
                window.gc();
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
        function getRecommendations() {
            const recommendations = [];
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
        const performanceManager = {
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

    // MintWaterfall Enhanced Theme System - TypeScript Version
    // Provides predefined themes, advanced D3.js color schemes, and interpolation with full type safety
    const themes = {
        default: {
            name: "Default",
            background: "#ffffff",
            gridColor: "#e0e0e0",
            axisColor: "#666666",
            textColor: "#333333",
            totalColor: "#95A5A6",
            colors: ["#3498db", "#2ecc71", "#e74c3c", "#f39c12", "#9b59b6", "#1abc9c", "#e67e22", "#f1c40f"],
            // NEW: Advanced color features
            sequentialScale: {
                type: 'sequential',
                interpolator: d3__namespace.interpolateBlues
            },
            divergingScale: {
                type: 'diverging',
                interpolator: d3__namespace.interpolateRdYlBu
            },
            conditionalFormatting: {
                positive: "#2ecc71",
                negative: "#e74c3c",
                neutral: "#95a5a6"
            }
        },
        dark: {
            name: "Dark",
            background: "#2c3e50",
            gridColor: "#34495e",
            axisColor: "#bdc3c7",
            textColor: "#ecf0f1",
            totalColor: "#95a5a6",
            colors: ["#3498db", "#2ecc71", "#e74c3c", "#f39c12", "#9b59b6", "#1abc9c", "#e67e22", "#f1c40f"],
            sequentialScale: {
                type: 'sequential',
                interpolator: d3__namespace.interpolateViridis
            },
            divergingScale: {
                type: 'diverging',
                interpolator: d3__namespace.interpolatePiYG
            },
            conditionalFormatting: {
                positive: "#2ecc71",
                negative: "#e74c3c",
                neutral: "#95a5a6"
            }
        },
        corporate: {
            name: "Corporate",
            background: "#ffffff",
            gridColor: "#e8e8e8",
            axisColor: "#555555",
            textColor: "#333333",
            totalColor: "#7f8c8d",
            colors: ["#2c3e50", "#34495e", "#7f8c8d", "#95a5a6", "#bdc3c7", "#ecf0f1"],
            sequentialScale: {
                type: 'sequential',
                interpolator: d3__namespace.interpolateGreys
            },
            divergingScale: {
                type: 'diverging',
                interpolator: d3__namespace.interpolateRdBu
            },
            conditionalFormatting: {
                positive: "#27ae60",
                negative: "#c0392b",
                neutral: "#7f8c8d"
            }
        },
        accessible: {
            name: "Accessible",
            background: "#ffffff",
            gridColor: "#cccccc",
            axisColor: "#000000",
            textColor: "#000000",
            totalColor: "#666666",
            // High contrast, colorblind-friendly palette
            colors: ["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd", "#8c564b", "#e377c2", "#7f7f7f"],
            sequentialScale: {
                type: 'sequential',
                interpolator: (t) => d3__namespace.interpolateHsl("#ffffff", "#000000")(t)
            },
            divergingScale: {
                type: 'diverging',
                interpolator: d3__namespace.interpolateRdBu
            },
            conditionalFormatting: {
                positive: "#1f77b4", // High contrast blue
                negative: "#d62728", // High contrast red
                neutral: "#666666"
            }
        },
        colorful: {
            name: "Colorful",
            background: "#ffffff",
            gridColor: "#f0f0f0",
            axisColor: "#666666",
            textColor: "#333333",
            totalColor: "#34495e",
            colors: ["#ff6b6b", "#4ecdc4", "#45b7d1", "#f9ca24", "#f0932b", "#eb4d4b", "#6c5ce7", "#a29bfe"],
            sequentialScale: {
                type: 'sequential',
                interpolator: d3__namespace.interpolateRainbow
            },
            divergingScale: {
                type: 'diverging',
                interpolator: d3__namespace.interpolateSpectral
            },
            conditionalFormatting: {
                positive: "#4ecdc4",
                negative: "#ff6b6b",
                neutral: "#f9ca24"
            }
        }
    };
    function applyTheme(chart, themeName = "default") {
        const theme = themes[themeName] || themes.default;
        // Apply theme colors to chart configuration
        chart.totalColor(theme.totalColor);
        return theme;
    }
    // ============================================================================
    // ADVANCED COLOR SCALE FUNCTIONS
    // ============================================================================
    /**
     * Create a sequential color scale for continuous data visualization
     * Perfect for heat-map style conditional formatting in waterfall charts
     */
    function createSequentialScale(domain, themeName = "default") {
        const theme = themes[themeName] || themes.default;
        const interpolator = theme.sequentialScale?.interpolator || d3__namespace.interpolateBlues;
        return d3__namespace.scaleSequential(interpolator)
            .domain(domain);
    }
    /**
     * Create a diverging color scale for data with a meaningful center point (e.g., zero)
     * Perfect for positive/negative value emphasis in waterfall charts
     */
    function createDivergingScale(domain, themeName = "default") {
        const theme = themes[themeName] || themes.default;
        const interpolator = theme.divergingScale?.interpolator || d3__namespace.interpolateRdYlBu;
        return d3__namespace.scaleDiverging(interpolator)
            .domain(domain);
    }
    /**
     * Get conditional formatting color based on value
     * Returns appropriate color for positive, negative, or neutral values
     */
    function getConditionalColor(value, themeName = "default", neutralThreshold = 0) {
        const theme = themes[themeName] || themes.default;
        const formatting = theme.conditionalFormatting || {
            positive: "#2ecc71",
            negative: "#e74c3c",
            neutral: "#95a5a6"
        };
        if (Math.abs(value) <= Math.abs(neutralThreshold)) {
            return formatting.neutral;
        }
        return value > neutralThreshold ? formatting.positive : formatting.negative;
    }
    /**
     * Create a color scale for waterfall data with automatic domain detection
     * Automatically chooses between sequential or diverging based on data characteristics
     */
    function createWaterfallColorScale(data, themeName = "default", scaleType = 'auto') {
        const values = data.map(d => d.value);
        const extent = d3__namespace.extent(values);
        const hasPositiveAndNegative = extent[0] < 0 && extent[1] > 0;
        // Auto-detect scale type
        if (scaleType === 'auto') {
            scaleType = hasPositiveAndNegative ? 'diverging' : 'sequential';
        }
        if (scaleType === 'diverging' && hasPositiveAndNegative) {
            const maxAbs = Math.max(Math.abs(extent[0]), Math.abs(extent[1]));
            return createDivergingScale([-maxAbs, 0, maxAbs], themeName);
        }
        else {
            return createSequentialScale(extent, themeName);
        }
    }
    /**
     * Apply color interpolation to a value within a range
     * Useful for creating smooth color transitions in large datasets
     */
    function interpolateThemeColor(value, domain, themeName = "default") {
        const theme = themes[themeName] || themes.default;
        const interpolator = theme.sequentialScale?.interpolator || d3__namespace.interpolateBlues;
        const normalizedValue = (value - domain[0]) / (domain[1] - domain[0]);
        return interpolator(Math.max(0, Math.min(1, normalizedValue)));
    }
    /**
     * Get advanced bar color based on value, context, and theme
     * This is the main function for determining bar colors with advanced features
     */
    function getAdvancedBarColor(value, defaultColor, allData = [], themeName = "default", colorMode = 'conditional') {
        themes[themeName] || themes.default;
        switch (colorMode) {
            case 'conditional':
                return getConditionalColor(value, themeName);
            case 'sequential':
                if (allData.length > 0) {
                    const values = allData.map(d => d.barTotal || d.value || 0);
                    const domain = d3__namespace.extent(values);
                    return interpolateThemeColor(value, domain, themeName);
                }
                return defaultColor;
            case 'diverging':
                if (allData.length > 0) {
                    const values = allData.map(d => d.barTotal || d.value || 0);
                    const maxAbs = Math.max(...values.map(Math.abs));
                    const scale = createDivergingScale([-maxAbs, 0, maxAbs], themeName);
                    return scale(value);
                }
                return getConditionalColor(value, themeName);
            default:
                return defaultColor;
        }
    }
    /**
     * Create professional financial color schemes for waterfall charts
     */
    const financialThemes = {
        financial: {
            name: "Financial",
            background: "#ffffff",
            gridColor: "#f5f5f5",
            axisColor: "#333333",
            textColor: "#333333",
            totalColor: "#2c3e50",
            colors: ["#27ae60", "#e74c3c", "#3498db", "#f39c12", "#9b59b6"],
            sequentialScale: {
                type: 'sequential',
                interpolator: d3__namespace.interpolateRdYlGn
            },
            divergingScale: {
                type: 'diverging',
                interpolator: d3__namespace.interpolateRdYlGn
            },
            conditionalFormatting: {
                positive: "#27ae60", // Strong green for profits
                negative: "#e74c3c", // Strong red for losses
                neutral: "#95a5a6" // Neutral gray
            }
        },
        professional: {
            name: "Professional",
            background: "#ffffff",
            gridColor: "#e8e8e8",
            axisColor: "#444444",
            textColor: "#333333",
            totalColor: "#2c3e50",
            colors: ["#1f4e79", "#2e75b6", "#70ad47", "#ffc000", "#c55a11"],
            sequentialScale: {
                type: 'sequential',
                interpolator: (t) => d3__namespace.interpolateHsl("#f0f8ff", "#1f4e79")(t)
            },
            divergingScale: {
                type: 'diverging',
                interpolator: d3__namespace.interpolateRdYlBu
            },
            conditionalFormatting: {
                positive: "#70ad47", // Professional green
                negative: "#c55a11", // Professional orange-red
                neutral: "#7f8c8d" // Professional gray
            }
        },
        heatmap: {
            name: "Heat Map",
            background: "#ffffff",
            gridColor: "#f0f0f0",
            axisColor: "#333333",
            textColor: "#333333",
            totalColor: "#2c3e50",
            colors: ["#ffffcc", "#ffeda0", "#fed976", "#feb24c", "#fd8d3c", "#fc4e2a", "#e31a1c", "#bd0026", "#800026"],
            sequentialScale: {
                type: 'sequential',
                interpolator: d3__namespace.interpolateYlOrRd
            },
            divergingScale: {
                type: 'diverging',
                interpolator: d3__namespace.interpolateRdYlBu
            },
            conditionalFormatting: {
                positive: "#2ca02c",
                negative: "#d62728",
                neutral: "#ff7f0e"
            }
        }
    };
    // Merge financial themes with existing themes
    Object.assign(themes, financialThemes);

    // MintWaterfall Enhanced Shape Generators - TypeScript Version
    // Provides advanced D3.js shape generators for waterfall chart enhancements
    // ============================================================================
    // SHAPE GENERATOR IMPLEMENTATION
    // ============================================================================
    function createShapeGenerators() {
        // Available curve types for enhanced visualization
        const curveTypes = {
            linear: d3__namespace.curveLinear,
            basis: d3__namespace.curveBasis,
            cardinal: d3__namespace.curveCardinal,
            catmullRom: d3__namespace.curveCatmullRom,
            monotoneX: d3__namespace.curveMonotoneX,
            monotoneY: d3__namespace.curveMonotoneY,
            natural: d3__namespace.curveNatural,
            step: d3__namespace.curveStep,
            stepBefore: d3__namespace.curveStepBefore,
            stepAfter: d3__namespace.curveStepAfter,
            bumpX: d3__namespace.curveBumpX,
            bumpY: d3__namespace.curveBumpY
        };
        // Available symbol types for data point markers
        const symbolTypes = {
            circle: d3__namespace.symbolCircle,
            square: d3__namespace.symbolSquare,
            triangle: d3__namespace.symbolTriangle,
            diamond: d3__namespace.symbolDiamond,
            star: d3__namespace.symbolStar,
            cross: d3__namespace.symbolCross,
            wye: d3__namespace.symbolWye
        };
        // ========================================================================
        // AREA GENERATORS
        // ========================================================================
        /**
         * Create confidence band area for uncertainty visualization
         * Perfect for showing confidence intervals around waterfall projections
         */
        function createConfidenceBand(data, config = {}) {
            const { curve = d3__namespace.curveMonotoneX, opacity = 0.3, fillColor = "#95a5a6" } = config;
            const areaGenerator = d3__namespace.area()
                .x(d => d.x)
                .y0(d => d.yLower)
                .y1(d => d.yUpper)
                .curve(curve);
            return areaGenerator(data) || "";
        }
        /**
         * Create envelope area between two data series
         * Useful for showing range between scenarios in waterfall analysis
         */
        function createEnvelopeArea(data, config = {}) {
            const { curve = d3__namespace.curveMonotoneX } = config;
            const areaGenerator = d3__namespace.area()
                .x(d => d.x)
                .y0(d => d.y0)
                .y1(d => d.y1)
                .curve(curve);
            return areaGenerator(data) || "";
        }
        // ========================================================================
        // SYMBOL GENERATORS
        // ========================================================================
        /**
         * Create data point markers for highlighting key values
         * Perfect for marking important milestones in waterfall progression
         */
        function createDataPointMarkers(data, config = {}) {
            const { size = 64, fillColor = "#3498db", strokeColor = "#ffffff", strokeWidth = 2 } = config;
            return data.map(point => {
                const symbolType = symbolTypes[point.type] || d3__namespace.symbolCircle;
                const symbolSize = point.size || size;
                const symbolGenerator = d3__namespace.symbol()
                    .type(symbolType)
                    .size(symbolSize);
                return {
                    path: symbolGenerator() || "",
                    transform: `translate(${point.x}, ${point.y})`,
                    config: {
                        ...config,
                        fillColor: point.color || fillColor,
                        strokeColor,
                        strokeWidth
                    }
                };
            });
        }
        /**
         * Create custom symbol path
         * Allows for creating unique markers for specific data points
         */
        function createCustomSymbol(type, size = 64) {
            const symbolType = symbolTypes[type] || d3__namespace.symbolCircle;
            const symbolGenerator = d3__namespace.symbol()
                .type(symbolType)
                .size(size);
            return symbolGenerator() || "";
        }
        // ========================================================================
        // ENHANCED TREND LINES
        // ========================================================================
        /**
         * Create smooth trend line with enhanced curve support
         * Provides better visual flow for waterfall trend analysis
         */
        function createSmoothTrendLine(data, config = {}) {
            const { curve = d3__namespace.curveMonotoneX, strokeColor = "#e74c3c", strokeWidth = 2, opacity = 0.8 } = config;
            const lineGenerator = d3__namespace.line()
                .x(d => d.x)
                .y(d => d.y)
                .curve(curve);
            return lineGenerator(data) || "";
        }
        /**
         * Create multiple trend lines for comparison analysis
         * Useful for comparing different scenarios or time periods
         */
        function createMultipleTrendLines(datasets) {
            return datasets.map(dataset => {
                return createSmoothTrendLine(dataset.data, dataset.config);
            });
        }
        // ========================================================================
        // UTILITY FUNCTIONS
        // ========================================================================
        function getCurveTypes() {
            return { ...curveTypes };
        }
        function getSymbolTypes() {
            return { ...symbolTypes };
        }
        // ========================================================================
        // RETURN API
        // ========================================================================
        return {
            // Area generators
            createConfidenceBand,
            createEnvelopeArea,
            // Symbol generators
            createDataPointMarkers,
            createCustomSymbol,
            // Enhanced trend lines
            createSmoothTrendLine,
            createMultipleTrendLines,
            // Utility functions
            getCurveTypes,
            getSymbolTypes
        };
    }
    // ============================================================================
    // ADVANCED WATERFALL-SPECIFIC SHAPE UTILITIES
    // ============================================================================
    /**
     * Create confidence bands specifically for waterfall financial projections
     * Combines multiple projection scenarios into visual uncertainty bands
     */
    function createWaterfallConfidenceBands(baselineData, scenarios, xScale, yScale) {
        const shapeGenerator = createShapeGenerators();
        // Calculate cumulative values for each scenario
        let baselineCumulative = 0;
        let optimisticCumulative = 0;
        let pessimisticCumulative = 0;
        const confidenceData = baselineData.map((item, i) => {
            baselineCumulative += item.value;
            optimisticCumulative += scenarios.optimistic[i]?.value || item.value;
            pessimisticCumulative += scenarios.pessimistic[i]?.value || item.value;
            const x = (xScale(item.label) || 0) + xScale.bandwidth() / 2;
            return {
                x,
                y: yScale(baselineCumulative),
                yUpper: yScale(optimisticCumulative),
                yLower: yScale(pessimisticCumulative),
                label: item.label
            };
        });
        // Create trend lines for each scenario
        const optimisticTrendData = confidenceData.map(d => ({ x: d.x, y: d.yUpper }));
        const pessimisticTrendData = confidenceData.map(d => ({ x: d.x, y: d.yLower }));
        return {
            confidencePath: shapeGenerator.createConfidenceBand(confidenceData, {
                fillColor: "rgba(52, 152, 219, 0.2)",
                curve: d3__namespace.curveMonotoneX
            }),
            optimisticPath: shapeGenerator.createSmoothTrendLine(optimisticTrendData, {
                strokeColor: "#27ae60",
                strokeWidth: 2,
                strokeDasharray: "5,5",
                curve: d3__namespace.curveMonotoneX
            }),
            pessimisticPath: shapeGenerator.createSmoothTrendLine(pessimisticTrendData, {
                strokeColor: "#e74c3c",
                strokeWidth: 2,
                strokeDasharray: "5,5",
                curve: d3__namespace.curveMonotoneX
            })
        };
    }
    /**
     * Create key milestone markers for waterfall charts
     * Highlights important data points like targets, thresholds, or significant events
     */
    function createWaterfallMilestones(milestones, xScale, yScale) {
        const shapeGenerator = createShapeGenerators();
        const markerData = milestones.map(milestone => {
            const typeMapping = {
                target: { type: 'star', color: '#f39c12', size: 100 },
                threshold: { type: 'diamond', color: '#9b59b6', size: 80 },
                alert: { type: 'triangle', color: '#e74c3c', size: 90 },
                achievement: { type: 'circle', color: '#27ae60', size: 85 }
            };
            const styling = typeMapping[milestone.type] || typeMapping.target;
            return {
                x: (xScale(milestone.label) || 0) + xScale.bandwidth() / 2,
                y: yScale(milestone.value),
                type: styling.type,
                size: styling.size,
                color: styling.color,
                label: milestone.description || milestone.label
            };
        });
        return shapeGenerator.createDataPointMarkers(markerData, {
            strokeColor: "#ffffff",
            strokeWidth: 2
        });
    }

    // MintWaterfall - D3.js compatible waterfall chart component (TypeScript)
    // Usage: d3.waterfallChart().width(800).height(400).showTotal(true)(selection)
    // Utility function to get bar width from any scale type
    function getBarWidth(scale, barCount, totalWidth) {
        if (scale.bandwidth) {
            // Band scale has bandwidth method - use it directly
            const bandwidth = scale.bandwidth();
            // Using band scale bandwidth
            return bandwidth;
        }
        else {
            // For continuous scales, calculate width based on bar count
            const padding = 0.1;
            const availableWidth = totalWidth * (1 - padding);
            const calculatedWidth = availableWidth / barCount;
            // Calculated width for continuous scale
            return calculatedWidth;
        }
    }
    // Utility function to get bar position from any scale type
    function getBarPosition(scale, value, barWidth) {
        if (scale.bandwidth) {
            // Band scale - use scale directly
            return scale(value);
        }
        else {
            // Continuous scale - center the bar around the scale value
            return scale(value) - barWidth / 2;
        }
    }
    function waterfallChart() {
        let width = 800;
        let height = 400;
        let margin = { top: 60, right: 80, bottom: 60, left: 80 };
        let showTotal = false;
        let totalLabel = "Total";
        let totalColor = "#95A5A6";
        let stacked = false;
        let barPadding = 0.05;
        let duration = 750;
        let ease = d3__namespace.easeQuadInOut;
        let formatNumber = d3__namespace.format(".0f");
        let theme = null;
        // Advanced features
        let enableBrush = false;
        let brushOptions = {};
        let staggeredAnimations = false;
        let staggerDelay = 100;
        let scaleType = "auto"; // 'auto', 'linear', 'time', 'ordinal'
        // NEW: Advanced color and shape features
        let advancedColorConfig = {
            enabled: false,
            scaleType: 'auto',
            themeName: 'default',
            neutralThreshold: 0
        };
        // Advanced color mode for enhanced visual impact
        let colorMode = 'conditional';
        let confidenceBandConfig = {
            enabled: false,
            opacity: 0.3,
            showTrendLines: true
        };
        let milestoneConfig = {
            enabled: false,
            milestones: []
        };
        // Note: Advanced analytical enhancement feature variables removed
        // Features are available via exported utility functions
        // Note: Hierarchical layout variables removed
        // Features are available via exported utility functions
        // Trend line features
        let showTrendLine = false;
        let trendLineColor = "#e74c3c";
        let trendLineWidth = 2;
        let trendLineStyle = "solid"; // 'solid', 'dashed', 'dotted'
        let trendLineOpacity = 0.8;
        let trendLineType = "linear"; // 'linear', 'moving-average', 'polynomial'
        let trendLineWindow = 3; // Moving average window size
        let trendLineDegree = 2; // Polynomial degree
        // Accessibility and UX features
        let enableAccessibility = true;
        let enableTooltips = false;
        let tooltipConfig = {};
        let enableExport = true;
        let exportConfig = {};
        let enableZoom = false;
        let zoomConfig = {};
        // Enterprise features
        let breakdownConfig = null;
        let formattingRules = new Map();
        // Performance features
        let lastDataHash = null;
        let cachedProcessedData = null;
        // Initialize systems
        const scaleSystem = createScaleSystem();
        createBrushSystem();
        const tooltipSystem = createTooltipSystem();
        createZoomSystem();
        const performanceManager = createPerformanceManager();
        // Note: Advanced analytical enhancement system instances removed
        // Systems are available via exported utility functions
        // Performance configuration
        let enablePerformanceOptimization = false;
        let performanceDashboard = false;
        let virtualizationThreshold = 10000;
        // Event listeners - enhanced with brush events
        const listeners = d3__namespace.dispatch("barClick", "barMouseover", "barMouseout", "chartUpdate", "brushSelection");
        function chart(selection) {
            selection.each(function (data) {
                // Data validation
                if (!data || !Array.isArray(data)) {
                    console.warn("MintWaterfall: Invalid data provided. Expected an array.");
                    return;
                }
                if (data.length === 0) {
                    console.warn("MintWaterfall: Empty data array provided.");
                    return;
                }
                // Validate data structure
                const isValidData = data.every(item => item &&
                    typeof item.label === "string" &&
                    Array.isArray(item.stacks) &&
                    item.stacks.every(stack => typeof stack.value === "number" &&
                        typeof stack.color === "string"));
                if (!isValidData) {
                    console.error("MintWaterfall: Invalid data structure. Each item must have a 'label' string and 'stacks' array with 'value' numbers and 'color' strings.");
                    return;
                }
                // Handle both div containers and existing SVG elements
                const element = d3__namespace.select(this);
                let svg;
                if (this.tagName === 'svg') {
                    // Already an SVG element
                    svg = element;
                }
                else {
                    // Container element (div) - create or select SVG
                    svg = element.selectAll('svg').data([0]);
                    const svgEnter = svg.enter().append('svg');
                    svg = svgEnter.merge(svg);
                    // Set SVG dimensions
                    svg.attr('width', width).attr('height', height);
                }
                // Get actual SVG dimensions from attributes if available
                const svgNode = svg.node();
                if (svgNode) {
                    const svgWidth = svgNode.getAttribute('width');
                    const svgHeight = svgNode.getAttribute('height');
                    if (svgWidth)
                        width = parseInt(svgWidth, 10);
                    if (svgHeight)
                        height = parseInt(svgHeight, 10);
                }
                // Chart dimensions set
                const container = svg.selectAll(".waterfall-container").data([data]);
                // Store reference for zoom system
                const svgContainer = svg;
                // Create main container group
                const containerEnter = container.enter()
                    .append("g")
                    .attr("class", "waterfall-container");
                const containerUpdate = containerEnter.merge(container);
                // Create chart group for zoom transforms
                let chartGroup = containerUpdate.select(".chart-group");
                if (chartGroup.empty()) {
                    chartGroup = containerUpdate.append("g")
                        .attr("class", "chart-group");
                }
                // Add clipping path to prevent overflow - this will be set after margins are calculated
                const clipPathId = `chart-clip-${Date.now()}`;
                svg.select(`#${clipPathId}`).remove(); // Remove existing if any
                const clipPath = svg.append("defs")
                    .append("clipPath")
                    .attr("id", clipPathId)
                    .append("rect");
                chartGroup.attr("clip-path", `url(#${clipPathId})`);
                try {
                    // Enable performance optimization for large datasets
                    if (data.length >= virtualizationThreshold && enablePerformanceOptimization) {
                        performanceManager.enableVirtualization({
                            chunkSize: Math.min(1000, Math.floor(data.length / 10)),
                            renderThreshold: virtualizationThreshold
                        });
                    }
                    // Check if we can use cached data (include showTotal in cache key)
                    const dataHash = JSON.stringify(data).slice(0, 100) + `_showTotal:${showTotal}`; // Quick hash with showTotal
                    let processedData;
                    if (dataHash === lastDataHash && cachedProcessedData) {
                        processedData = cachedProcessedData;
                        // Using cached processed data
                    }
                    else {
                        // Prepare data with cumulative calculations
                        if (data.length > 50000) {
                            // For very large datasets, fall back to synchronous processing for now
                            // TODO: Implement proper async handling in future version
                            console.warn("MintWaterfall: Large dataset detected, using synchronous processing");
                            processedData = prepareData(data);
                        }
                        else {
                            processedData = prepareData(data);
                        }
                        // Cache the processed data
                        lastDataHash = dataHash;
                        cachedProcessedData = processedData;
                    }
                    // Process data for chart rendering
                    // Calculate intelligent margins based on data
                    const intelligentMargins = calculateIntelligentMargins(processedData, margin);
                    // Set up scales using enhanced scale system
                    let xScale;
                    if (scaleType === "auto") {
                        xScale = scaleSystem.createAdaptiveScale(processedData, "x");
                        // If it's a band scale, apply padding
                        if (xScale.padding) {
                            xScale.padding(barPadding);
                        }
                    }
                    else if (scaleType === "time") {
                        const timeValues = processedData.map(d => new Date(d.label));
                        xScale = scaleSystem.createTimeScale(timeValues);
                    }
                    else if (scaleType === "ordinal") {
                        xScale = scaleSystem.createOrdinalScale(processedData.map(d => d.label));
                    }
                    else {
                        // Default to band scale for categorical data
                        xScale = d3__namespace.scaleBand()
                            .domain(processedData.map(d => d.label))
                            .padding(barPadding);
                    }
                    // CRITICAL: Set range for x scale using intelligent margins - this must happen after scale creation
                    xScale.range([intelligentMargins.left, width - intelligentMargins.right]);
                    // Ensure the scale system uses the correct default range for future scales
                    scaleSystem.setDefaultRange([intelligentMargins.left, width - intelligentMargins.right]);
                    // Update clipping path with proper chart area dimensions
                    // IMPORTANT: Extend clipping area to include space for labels above bars
                    const labelSpace = 30; // Extra space for labels above the chart area
                    clipPath
                        .attr("x", intelligentMargins.left)
                        .attr("y", Math.max(0, intelligentMargins.top - labelSpace)) // Extend upward for labels
                        .attr("width", width - intelligentMargins.left - intelligentMargins.right)
                        .attr("height", height - intelligentMargins.top - intelligentMargins.bottom + labelSpace);
                    // Clipping path configured
                    // Scale configuration complete
                    // Enhanced Y scale using d3.extent and nice()
                    const yValues = processedData.map(d => d.cumulativeTotal);
                    // For waterfall charts, ensure proper baseline handling
                    const [min, max] = d3__namespace.extent(yValues);
                    const hasNegativeValues = min < 0;
                    let yScale;
                    if (hasNegativeValues) {
                        // When we have negative values, create scale that includes them but doesn't extend too far
                        const range = max - min;
                        const padding = range * 0.05; // 5% padding
                        yScale = d3__namespace.scaleLinear()
                            .domain([min - padding, max + padding])
                            .range([height - intelligentMargins.bottom, intelligentMargins.top]);
                    }
                    else {
                        // For positive-only data, start at 0
                        yScale = scaleSystem.createLinearScale(yValues, {
                            range: [height - intelligentMargins.bottom, intelligentMargins.top],
                            nice: true
                        });
                    }
                    // Create/update grid
                    drawGrid(containerUpdate, yScale, intelligentMargins);
                    // Create/update axes (on container, not chart group)
                    drawAxes(containerUpdate, xScale, yScale, intelligentMargins);
                    // Create/update bars with enhanced animations (in chart group for zoom)
                    drawBars(chartGroup, processedData, xScale, yScale, intelligentMargins);
                    // Create/update connectors (in chart group for zoom)
                    drawConnectors(chartGroup, processedData, xScale, yScale);
                    // Create/update trend line (handles both show and hide cases)
                    drawTrendLine(chartGroup, processedData, xScale, yScale);
                    // NEW: Draw advanced features
                    drawConfidenceBands(chartGroup, processedData, xScale, yScale);
                    drawMilestones(chartGroup, processedData, xScale, yScale);
                    // Add brush functionality if enabled
                    if (enableBrush) {
                        addBrushSelection(containerUpdate, processedData, xScale, yScale);
                    }
                    // Initialize features after rendering is complete
                    setTimeout(() => {
                        if (enableAccessibility) {
                            initializeAccessibility(svg, processedData);
                        }
                        if (enableTooltips) {
                            initializeTooltips(svg);
                        }
                        if (enableExport) {
                            initializeExport(svg, processedData);
                        }
                        if (enableZoom) {
                            // Initialize zoom system if not already created
                            if (!chart.zoomSystemInstance) {
                                chart.zoomSystemInstance = createZoomSystem();
                            }
                            // Attach zoom to the SVG container
                            chart.zoomSystemInstance.attach(svgContainer);
                            chart.zoomSystemInstance.setDimensions({ width, height, margin: intelligentMargins });
                            chart.zoomSystemInstance.enable();
                        }
                        else {
                            // Disable zoom if it was previously enabled
                            if (chart.zoomSystemInstance) {
                                chart.zoomSystemInstance.disable();
                                chart.zoomSystemInstance.detach();
                            }
                        }
                    }, 50); // Small delay to ensure DOM is ready
                }
                catch (error) {
                    console.error("MintWaterfall rendering error:", error);
                    console.error("Stack trace:", error.stack);
                    // Clear any partial rendering and show error
                    containerUpdate.selectAll("*").remove();
                    containerUpdate.append("text")
                        .attr("x", width / 2)
                        .attr("y", height / 2)
                        .attr("text-anchor", "middle")
                        .style("font-size", "14px")
                        .style("fill", "#ff6b6b")
                        .text(`Chart Error: ${error.message}`);
                }
            });
        }
        function calculateIntelligentMargins(processedData, baseMargin) {
            // Calculate required space for labels - handle all edge cases
            const allValues = processedData.flatMap(d => [d.cumulativeTotal, d.prevCumulativeTotal || 0]);
            const maxValue = d3__namespace.max(allValues) || 0;
            const minValue = d3__namespace.min(allValues) || 0;
            // Estimate label dimensions - be more generous with space
            const labelHeight = 16; // Increased from 14 to account for font size
            const labelPadding = 8; // Increased from 5 for better spacing
            const requiredLabelSpace = labelHeight + labelPadding;
            const safetyBuffer = 20; // Increased from 10 for more breathing room
            // Handle edge cases for different data scenarios
            const hasNegativeValues = minValue < 0;
            // Start with a more generous top margin to ensure labels fit
            const initialTopMargin = Math.max(baseMargin.top, 80); // Ensure minimum 80px for labels
            // Create temporary scale that matches the actual rendering logic
            let tempYScale;
            const tempRange = [height - baseMargin.bottom, initialTopMargin];
            if (hasNegativeValues) {
                // Match the actual scale logic for negative values
                const range = maxValue - minValue;
                const padding = range * 0.05; // 5% padding (same as actual scale)
                tempYScale = d3__namespace.scaleLinear()
                    .domain([minValue - padding, maxValue + padding])
                    .range(tempRange);
            }
            else {
                // For positive-only data, start at 0 with padding
                const paddedMax = maxValue * 1.02; // 2% padding (same as actual scale)
                tempYScale = d3__namespace.scaleLinear()
                    .domain([0, paddedMax])
                    .range(tempRange)
                    .nice(); // Apply nice() like the actual scale
            }
            // Find the highest point where any label will be positioned
            const allLabelPositions = processedData.map(d => {
                const barTop = tempYScale(d.cumulativeTotal);
                return barTop - labelPadding;
            });
            const highestLabelPosition = Math.min(...allLabelPositions);
            // Calculate required top margin - ensure labels have enough space above them
            const spaceNeededFromTop = Math.max(initialTopMargin - highestLabelPosition + requiredLabelSpace, requiredLabelSpace + safetyBuffer // Minimum space needed
            );
            const extraTopMarginNeeded = Math.max(0, spaceNeededFromTop - initialTopMargin);
            // For negative values, we might also need bottom space
            let extraBottomMargin = 0;
            if (hasNegativeValues) {
                const negativeData = processedData.filter(d => d.cumulativeTotal < 0);
                if (negativeData.length > 0) {
                    const lowestLabelPosition = Math.max(...negativeData.map(d => tempYScale(d.cumulativeTotal) + labelHeight + labelPadding));
                    if (lowestLabelPosition > height - baseMargin.bottom) {
                        extraBottomMargin = lowestLabelPosition - (height - baseMargin.bottom);
                    }
                }
            }
            // Calculate required right margin for labels
            const maxLabelLength = Math.max(...processedData.map(d => formatNumber(d.cumulativeTotal).length));
            const estimatedLabelWidth = maxLabelLength * 9; // Increased from 8 to 9px per character
            const minRightMargin = Math.max(baseMargin.right, estimatedLabelWidth / 2 + 15);
            const intelligentMargin = {
                top: initialTopMargin + extraTopMarginNeeded + safetyBuffer,
                right: minRightMargin,
                bottom: baseMargin.bottom + extraBottomMargin + (hasNegativeValues ? safetyBuffer : 10),
                left: baseMargin.left
            };
            // Intelligent margins calculated
            return intelligentMargin;
        }
        function prepareData(data) {
            let workingData = [...data];
            // Apply breakdown analysis if enabled
            if (breakdownConfig && breakdownConfig.enabled) {
                workingData = applyBreakdownAnalysis(workingData);
            }
            let cumulativeTotal = 0;
            let prevCumulativeTotal = 0;
            // Process each bar with cumulative totals
            const processedData = workingData.map((bar, i) => {
                const barTotal = bar.stacks.reduce((sum, stack) => sum + stack.value, 0);
                prevCumulativeTotal = cumulativeTotal;
                cumulativeTotal += barTotal;
                // Apply conditional formatting if enabled
                let processedStacks = bar.stacks;
                if (formattingRules.size > 0) {
                    processedStacks = applyConditionalFormatting(bar.stacks);
                }
                const result = {
                    ...bar,
                    stacks: processedStacks,
                    barTotal,
                    cumulativeTotal,
                    prevCumulativeTotal: i === 0 ? 0 : prevCumulativeTotal
                };
                return result;
            });
            // Add total bar if enabled
            if (showTotal && processedData.length > 0) {
                const totalValue = cumulativeTotal;
                processedData.push({
                    label: totalLabel,
                    stacks: [{ value: totalValue, color: totalColor }],
                    barTotal: totalValue,
                    cumulativeTotal: totalValue,
                    prevCumulativeTotal: 0 // Total bar starts from zero
                });
            }
            return processedData;
        }
        // Placeholder function implementations - these would be converted separately
        function applyBreakdownAnalysis(data, config) {
            // Implementation would be migrated from JavaScript version
            return data;
        }
        function applyConditionalFormatting(stacks, barData, rules) {
            // Implementation would be migrated from JavaScript version
            return stacks;
        }
        function drawGrid(container, yScale, intelligentMargins) {
            // Create horizontal grid lines
            const gridGroup = container.selectAll(".grid-group").data([0]);
            const gridGroupEnter = gridGroup.enter()
                .append("g")
                .attr("class", "grid-group");
            const gridGroupUpdate = gridGroupEnter.merge(gridGroup);
            // Get tick values from y scale
            const tickValues = yScale.ticks();
            // Create grid lines
            const gridLines = gridGroupUpdate.selectAll(".grid-line").data(tickValues);
            const gridLinesEnter = gridLines.enter()
                .append("line")
                .attr("class", "grid-line")
                .attr("x1", intelligentMargins.left)
                .attr("x2", width - intelligentMargins.right)
                .attr("stroke", "rgba(224, 224, 224, 0.5)")
                .attr("stroke-width", 1)
                .style("opacity", 0);
            gridLinesEnter.merge(gridLines)
                .transition()
                .duration(duration)
                .ease(ease)
                .attr("y1", (d) => yScale(d))
                .attr("y2", (d) => yScale(d))
                .attr("x1", intelligentMargins.left)
                .attr("x2", width - intelligentMargins.right)
                .style("opacity", 1);
            gridLines.exit()
                .transition()
                .duration(duration)
                .ease(ease)
                .style("opacity", 0)
                .remove();
        }
        function drawAxes(container, xScale, yScale, intelligentMargins) {
            // Y-axis
            const yAxisGroup = container.selectAll(".y-axis").data([0]);
            const yAxisGroupEnter = yAxisGroup.enter()
                .append("g")
                .attr("class", "y-axis")
                .attr("transform", `translate(${intelligentMargins.left},0)`);
            yAxisGroupEnter.merge(yAxisGroup)
                .transition()
                .duration(duration)
                .ease(ease)
                .call(d3__namespace.axisLeft(yScale).tickFormat((d) => formatNumber(d)));
            // X-axis
            const xAxisGroup = container.selectAll(".x-axis").data([0]);
            const xAxisGroupEnter = xAxisGroup.enter()
                .append("g")
                .attr("class", "x-axis")
                .attr("transform", `translate(0,${height - intelligentMargins.bottom})`);
            xAxisGroupEnter.merge(xAxisGroup)
                .transition()
                .duration(duration)
                .ease(ease)
                .call(d3__namespace.axisBottom(xScale));
        }
        function drawBars(container, processedData, xScale, yScale, intelligentMargins) {
            const barsGroup = container.selectAll(".bars-group").data([0]);
            const barsGroupEnter = barsGroup.enter()
                .append("g")
                .attr("class", "bars-group");
            const barsGroupUpdate = barsGroupEnter.merge(barsGroup);
            // Bar groups for each data point
            const barGroups = barsGroupUpdate.selectAll(".bar-group").data(processedData, (d) => d.label);
            // For band scales, we don't need manual positioning - the scale handles it
            const barGroupsEnter = barGroups.enter()
                .append("g")
                .attr("class", "bar-group")
                .attr("transform", (d) => {
                if (xScale.bandwidth) {
                    // Band scale - use the scale directly
                    return `translate(${xScale(d.label)}, 0)`;
                }
                else {
                    // Continuous scale - manual positioning using intelligent margins
                    const barWidth = getBarWidth(xScale, processedData.length, width - intelligentMargins.left - intelligentMargins.right);
                    const barX = getBarPosition(xScale, d.label, barWidth);
                    return `translate(${barX}, 0)`;
                }
            });
            const barGroupsUpdate = barGroupsEnter.merge(barGroups)
                .transition()
                .duration(duration)
                .ease(ease)
                .attr("transform", (d) => {
                if (xScale.bandwidth) {
                    // Band scale - use the scale directly
                    return `translate(${xScale(d.label)}, 0)`;
                }
                else {
                    // Continuous scale - manual positioning using intelligent margins
                    const barWidth = getBarWidth(xScale, processedData.length, width - intelligentMargins.left - intelligentMargins.right);
                    const barX = getBarPosition(xScale, d.label, barWidth);
                    return `translate(${barX}, 0)`;
                }
            });
            if (stacked) {
                drawStackedBars(barGroupsUpdate, xScale, yScale, intelligentMargins);
            }
            else {
                drawWaterfallBars(barGroupsUpdate, xScale, yScale, intelligentMargins, processedData);
            }
            // Add value labels
            drawValueLabels(barGroupsUpdate, xScale, yScale, intelligentMargins);
            barGroups.exit()
                .transition()
                .duration(duration)
                .ease(ease)
                .style("opacity", 0)
                .remove();
        }
        function drawStackedBars(barGroups, xScale, yScale, intelligentMargins) {
            barGroups.each(function (d) {
                const group = d3__namespace.select(this);
                const stackData = d.stacks.map((stack, i) => ({
                    ...stack,
                    stackIndex: i,
                    parent: d
                }));
                // Calculate stack positions
                let cumulativeHeight = d.prevCumulativeTotal || 0;
                stackData.forEach((stack) => {
                    stack.startY = cumulativeHeight;
                    stack.endY = cumulativeHeight + stack.value;
                    stack.y = yScale(Math.max(stack.startY, stack.endY));
                    stack.height = Math.abs(yScale(stack.startY) - yScale(stack.endY));
                    cumulativeHeight += stack.value;
                });
                const stacks = group.selectAll(".stack").data(stackData);
                // Get bar width - use scale bandwidth if available, otherwise calculate using intelligent margins
                const barWidth = xScale.bandwidth ? xScale.bandwidth() : getBarWidth(xScale, barGroups.size(), width - intelligentMargins.left - intelligentMargins.right);
                const stacksEnter = stacks.enter()
                    .append("rect")
                    .attr("class", "stack")
                    .attr("x", 0)
                    .attr("width", barWidth)
                    .attr("y", yScale(0))
                    .attr("height", 0)
                    .attr("fill", (stack) => stack.color);
                stacksEnter.merge(stacks)
                    .transition()
                    .duration(duration)
                    .ease(ease)
                    .attr("y", (stack) => stack.y)
                    .attr("height", (stack) => stack.height)
                    .attr("fill", (stack) => stack.color)
                    .attr("width", barWidth);
                stacks.exit()
                    .transition()
                    .duration(duration)
                    .ease(ease)
                    .attr("height", 0)
                    .attr("y", yScale(0))
                    .remove();
                // Add stack labels if they exist
                const stackLabels = group.selectAll(".stack-label").data(stackData.filter((s) => s.label));
                const stackLabelsEnter = stackLabels.enter()
                    .append("text")
                    .attr("class", "stack-label")
                    .attr("text-anchor", "middle")
                    .attr("x", barWidth / 2)
                    .attr("y", yScale(0))
                    .style("opacity", 0);
                stackLabelsEnter.merge(stackLabels)
                    .transition()
                    .duration(duration)
                    .ease(ease)
                    .attr("y", (stack) => stack.y + stack.height / 2 + 4)
                    .attr("x", barWidth / 2)
                    .style("opacity", 1)
                    .text((stack) => stack.label);
                stackLabels.exit()
                    .transition()
                    .duration(duration)
                    .ease(ease)
                    .style("opacity", 0)
                    .remove();
            });
        }
        function drawWaterfallBars(barGroups, xScale, yScale, intelligentMargins, allData = []) {
            barGroups.each(function (d) {
                const group = d3__namespace.select(this);
                // Get bar width - use scale bandwidth if available, otherwise calculate using intelligent margins
                const barWidth = xScale.bandwidth ? xScale.bandwidth() : getBarWidth(xScale, barGroups.size(), width - intelligentMargins.left - intelligentMargins.right);
                // Determine bar color using advanced color features
                const defaultColor = d.stacks.length === 1 ? d.stacks[0].color : "#3498db";
                const advancedColor = advancedColorConfig.enabled ?
                    getAdvancedBarColor(d.barTotal, defaultColor, allData, advancedColorConfig.themeName || 'default', colorMode) : defaultColor;
                const barData = [{
                        value: d.barTotal,
                        color: advancedColor,
                        y: d.isTotal ?
                            Math.min(yScale(0), yScale(d.cumulativeTotal)) : // Total bar: position correctly regardless of scale direction
                            yScale(Math.max(d.prevCumulativeTotal, d.cumulativeTotal)),
                        height: d.isTotal ?
                            Math.abs(yScale(0) - yScale(d.cumulativeTotal)) : // Total bar: full height from zero to total
                            Math.abs(yScale(d.prevCumulativeTotal || 0) - yScale(d.cumulativeTotal)),
                        parent: d
                    }];
                const bars = group.selectAll(".waterfall-bar").data(barData);
                const barsEnter = bars.enter()
                    .append("rect")
                    .attr("class", "waterfall-bar")
                    .attr("x", 0)
                    .attr("width", barWidth)
                    .attr("y", yScale(0))
                    .attr("height", 0)
                    .attr("fill", (bar) => bar.color);
                barsEnter.merge(bars)
                    .transition()
                    .duration(duration)
                    .ease(ease)
                    .attr("y", (bar) => bar.y)
                    .attr("height", (bar) => bar.height)
                    .attr("fill", (bar) => bar.color)
                    .attr("width", barWidth);
                bars.exit()
                    .transition()
                    .duration(duration)
                    .ease(ease)
                    .attr("height", 0)
                    .attr("y", yScale(0))
                    .remove();
            });
        }
        function drawValueLabels(barGroups, xScale, yScale, intelligentMargins) {
            // Always show value labels on bars - this is independent of the total bar setting
            // Drawing value labels
            barGroups.each(function (d) {
                const group = d3__namespace.select(this);
                const barWidth = getBarWidth(xScale, barGroups.size(), width - intelligentMargins.left - intelligentMargins.right);
                // Processing label for bar
                const labelData = [{
                        value: d.barTotal,
                        formattedValue: formatNumber(d.barTotal),
                        parent: d
                    }];
                const totalLabels = group.selectAll(".total-label").data(labelData);
                const totalLabelsEnter = totalLabels.enter()
                    .append("text")
                    .attr("class", "total-label")
                    .attr("text-anchor", "middle")
                    .attr("x", barWidth / 2)
                    .attr("y", yScale(0))
                    .style("opacity", 0)
                    .style("font-family", "Arial, sans-serif"); // Ensure font is set
                const labelUpdate = totalLabelsEnter.merge(totalLabels);
                labelUpdate
                    .transition()
                    .duration(duration)
                    .ease(ease)
                    .attr("y", (labelD) => {
                    const barTop = yScale(labelD.parent.cumulativeTotal);
                    const padding = 8;
                    const finalY = barTop - padding;
                    // Label positioning calculated
                    return finalY;
                })
                    .attr("x", barWidth / 2)
                    .style("opacity", 1)
                    .style("fill", "#333")
                    .style("font-weight", "bold")
                    .style("font-size", "14px")
                    .style("pointer-events", "none")
                    .style("visibility", "visible") // Ensure visibility
                    .style("display", "block") // Ensure display
                    .attr("clip-path", "none") // Remove any clipping from labels themselves
                    .text((labelD) => labelD.formattedValue)
                    .each(function (labelD) {
                    // Label element created
                });
                totalLabels.exit()
                    .transition()
                    .duration(duration)
                    .ease(ease)
                    .style("opacity", 0)
                    .remove();
            });
        }
        function drawConnectors(container, processedData, xScale, yScale) {
            if (stacked || processedData.length < 2)
                return; // Only show connectors for waterfall charts
            const connectorsGroup = container.selectAll(".connectors-group").data([0]);
            const connectorsGroupEnter = connectorsGroup.enter()
                .append("g")
                .attr("class", "connectors-group");
            const connectorsGroupUpdate = connectorsGroupEnter.merge(connectorsGroup);
            // Create connector data
            const connectorData = [];
            for (let i = 0; i < processedData.length - 1; i++) {
                const current = processedData[i];
                const next = processedData[i + 1];
                const barWidth = getBarWidth(xScale, processedData.length, width - margin.left - margin.right);
                const currentX = getBarPosition(xScale, current.label, barWidth);
                const nextX = getBarPosition(xScale, next.label, barWidth);
                connectorData.push({
                    x1: currentX + barWidth,
                    x2: nextX,
                    y: yScale(current.cumulativeTotal),
                    id: `${current.label}-${next.label}`
                });
            }
            // Create/update connector lines
            const connectors = connectorsGroupUpdate.selectAll(".connector").data(connectorData, (d) => d.id);
            const connectorsEnter = connectors.enter()
                .append("line")
                .attr("class", "connector")
                .attr("stroke", "#bdc3c7")
                .attr("stroke-width", 1)
                .attr("stroke-dasharray", "3,3")
                .style("opacity", 0)
                .attr("x1", (d) => d.x1)
                .attr("x2", (d) => d.x1)
                .attr("y1", (d) => d.y)
                .attr("y2", (d) => d.y);
            connectorsEnter.merge(connectors)
                .transition()
                .duration(duration)
                .ease(ease)
                .delay((d, i) => staggeredAnimations ? i * staggerDelay : 0)
                .attr("x1", (d) => d.x1)
                .attr("x2", (d) => d.x2)
                .attr("y1", (d) => d.y)
                .attr("y2", (d) => d.y)
                .style("opacity", 0.6);
            connectors.exit()
                .transition()
                .duration(duration)
                .ease(ease)
                .style("opacity", 0)
                .remove();
        }
        function drawTrendLine(container, processedData, xScale, yScale) {
            // Remove trend line if disabled or insufficient data
            if (!showTrendLine || processedData.length < 2) {
                container.selectAll(".trend-group").remove();
                return;
            }
            const trendGroup = container.selectAll(".trend-group").data([0]);
            const trendGroupEnter = trendGroup.enter()
                .append("g")
                .attr("class", "trend-group");
            const trendGroupUpdate = trendGroupEnter.merge(trendGroup);
            // Calculate trend line data points based on trend type
            const trendData = [];
            // First, collect the actual data points
            const dataPoints = [];
            for (let i = 0; i < processedData.length; i++) {
                const item = processedData[i];
                const barWidth = getBarWidth(xScale, processedData.length, width - margin.left - margin.right);
                const x = getBarPosition(xScale, item.label, barWidth) + barWidth / 2;
                const actualY = yScale(item.cumulativeTotal);
                dataPoints.push({ x, y: actualY, value: item.cumulativeTotal });
            }
            // Calculate trend based on type
            if (trendLineType === "linear") {
                // Linear regression
                const n = dataPoints.length;
                const sumX = dataPoints.reduce((sum, p, i) => sum + i, 0);
                const sumY = dataPoints.reduce((sum, p) => sum + p.value, 0);
                const sumXY = dataPoints.reduce((sum, p, i) => sum + (i * p.value), 0);
                const sumXX = dataPoints.reduce((sum, p, i) => sum + (i * i), 0);
                const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
                const intercept = (sumY - slope * sumX) / n;
                dataPoints.forEach((point, i) => {
                    const trendValue = slope * i + intercept;
                    trendData.push({ x: point.x, y: yScale(trendValue) });
                });
            }
            else if (trendLineType === "moving-average") {
                // Moving average with configurable window
                const window = trendLineWindow;
                for (let i = 0; i < dataPoints.length; i++) {
                    const start = Math.max(0, i - Math.floor(window / 2));
                    const end = Math.min(dataPoints.length, start + window);
                    const windowData = dataPoints.slice(start, end);
                    const average = windowData.reduce((sum, p) => sum + p.value, 0) / windowData.length;
                    trendData.push({ x: dataPoints[i].x, y: yScale(average) });
                }
            }
            else if (trendLineType === "polynomial") {
                // Simplified polynomial trend using D3's curve interpolation
                const n = dataPoints.length;
                if (n >= 3) {
                    // Use a simple approach: create a smooth curve using D3's cardinal interpolation
                    // and add some curvature based on the degree setting
                    const curvature = trendLineDegree / 10; // Convert degree to curvature factor
                    // Create control points for polynomial-like curve
                    for (let i = 0; i < n; i++) {
                        const point = dataPoints[i];
                        let adjustedY = point.value;
                        // Add polynomial-like adjustment based on position
                        if (n > 2) {
                            const t = i / (n - 1); // Normalize position 0-1
                            const curveFactor = Math.sin(t * Math.PI) * curvature;
                            // Apply curve adjustment to create polynomial-like behavior
                            const avgValue = dataPoints.reduce((sum, p) => sum + p.value, 0) / n;
                            adjustedY = point.value + (point.value - avgValue) * curveFactor * 0.5;
                        }
                        trendData.push({ x: point.x, y: yScale(adjustedY) });
                    }
                }
                else {
                    // Not enough points for polynomial, use linear
                    dataPoints.forEach(point => {
                        trendData.push({ x: point.x, y: point.y });
                    });
                }
            }
            else {
                // Default to connecting actual points
                dataPoints.forEach(point => {
                    trendData.push({ x: point.x, y: point.y });
                });
            }
            // Create line generator with appropriate curve type
            const line = d3__namespace.line()
                .x(d => d.x)
                .y(d => d.y)
                .curve(trendLineType === "polynomial" ? d3__namespace.curveCardinal :
                trendLineType === "moving-average" ? d3__namespace.curveMonotoneX :
                    d3__namespace.curveLinear);
            // Create/update trend line
            const trendLine = trendGroupUpdate.selectAll(".trend-line").data([trendData]);
            const trendLineEnter = trendLine.enter()
                .append("path")
                .attr("class", "trend-line")
                .attr("fill", "none")
                .attr("stroke", trendLineColor)
                .attr("stroke-width", trendLineWidth)
                .attr("stroke-opacity", trendLineOpacity)
                .style("opacity", 0);
            // Apply stroke-dasharray based on style
            function applyStrokeStyle(selection) {
                if (trendLineStyle === "dashed") {
                    selection.attr("stroke-dasharray", "5,5");
                }
                else if (trendLineStyle === "dotted") {
                    selection.attr("stroke-dasharray", "2,3");
                }
                else {
                    selection.attr("stroke-dasharray", null);
                }
            }
            applyStrokeStyle(trendLineEnter);
            const updatedTrendLine = trendLineEnter.merge(trendLine);
            applyStrokeStyle(updatedTrendLine);
            updatedTrendLine
                .transition()
                .duration(duration)
                .ease(ease)
                .attr("d", line)
                .attr("stroke", trendLineColor)
                .attr("stroke-width", trendLineWidth)
                .attr("stroke-opacity", trendLineOpacity)
                .style("opacity", 1);
            trendLine.exit()
                .transition()
                .duration(duration)
                .ease(ease)
                .style("opacity", 0)
                .remove();
        }
        function addBrushSelection(container, processedData, xScale, yScale) {
            // Stub: would add brush interaction if enabled
        }
        function initializeAccessibility(svg, processedData) {
            if (!enableAccessibility)
                return;
            // Add ARIA attributes to the SVG
            svg.attr("role", "img")
                .attr("aria-label", `Waterfall chart with ${processedData.length} data points`);
            // Add title and description for screen readers
            const title = svg.selectAll("title").data([0]);
            title.enter()
                .append("title")
                .merge(title)
                .text(`Waterfall chart showing ${stacked ? 'stacked' : 'sequential'} data visualization`);
            const desc = svg.selectAll("desc").data([0]);
            desc.enter()
                .append("desc")
                .merge(desc)
                .text(() => {
                const totalValue = processedData[processedData.length - 1]?.cumulativeTotal || 0;
                return `Chart contains ${processedData.length} data points. ` +
                    `Final cumulative value: ${formatNumber(totalValue)}. ` +
                    `Data ranges from ${processedData[0]?.label} to ${processedData[processedData.length - 1]?.label}.`;
            });
            // Add keyboard navigation
            svg.attr("tabindex", "0")
                .on("keydown", function (event) {
                const focusedElement = svg.select(".focused");
                const allBars = svg.selectAll(".waterfall-bar, .stack");
                const currentIndex = allBars.nodes().indexOf(focusedElement.node());
                switch (event.key) {
                    case "ArrowRight":
                    case "ArrowDown":
                        event.preventDefault();
                        const nextIndex = Math.min(currentIndex + 1, allBars.size() - 1);
                        focusBar(allBars, nextIndex);
                        break;
                    case "ArrowLeft":
                    case "ArrowUp":
                        event.preventDefault();
                        const prevIndex = Math.max(currentIndex - 1, 0);
                        focusBar(allBars, prevIndex);
                        break;
                    case "Home":
                        event.preventDefault();
                        focusBar(allBars, 0);
                        break;
                    case "End":
                        event.preventDefault();
                        focusBar(allBars, allBars.size() - 1);
                        break;
                }
            });
            // Helper function to focus a bar
            function focusBar(allBars, index) {
                allBars.classed("focused", false);
                const targetBar = d3__namespace.select(allBars.nodes()[index]);
                targetBar.classed("focused", true);
                // Announce the focused element
                const data = targetBar.datum();
                const announcement = `${data.parent?.label || data.label}: ${formatNumber(data.value || data.barTotal)}`;
                announceToScreenReader(announcement);
            }
            // Screen reader announcements
            function announceToScreenReader(message) {
                const announcement = d3__namespace.select("body").selectAll(".sr-announcement").data([0]);
                const announcementEnter = announcement.enter()
                    .append("div")
                    .attr("class", "sr-announcement")
                    .attr("aria-live", "polite")
                    .attr("aria-atomic", "true")
                    .style("position", "absolute")
                    .style("left", "-10000px")
                    .style("width", "1px")
                    .style("height", "1px")
                    .style("overflow", "hidden");
                announcementEnter.merge(announcement)
                    .text(message);
            }
            // Add focus styles
            const style = svg.selectAll("style.accessibility-styles").data([0]);
            style.enter()
                .append("style")
                .attr("class", "accessibility-styles")
                .merge(style)
                .text(`
                .focused {
                    stroke: #0066cc !important;
                    stroke-width: 3px !important;
                    filter: brightness(1.1);
                }
                .waterfall-bar:focus,
                .stack:focus {
                    outline: 2px solid #0066cc;
                    outline-offset: 2px;
                }
            `);
        }
        function initializeTooltips(svg) {
            if (!enableTooltips)
                return;
            // Initialize the tooltip system
            const tooltip = tooltipSystem;
            // Configure tooltip theme
            tooltip.configure(tooltipConfig);
            // Add tooltip events to all chart elements
            svg.selectAll(".waterfall-bar, .stack")
                .on("mouseover", function (event, d) {
                const element = d3__namespace.select(this);
                const data = d.parent || d; // Handle both stacked and waterfall bars
                // Create tooltip content
                const content = `
                    <div style="font-weight: bold; margin-bottom: 8px;">${data.label}</div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                        <span>Value:</span>
                        <span style="font-weight: bold;">${formatNumber(d.value || data.barTotal)}</span>
                    </div>
                    ${data.cumulativeTotal !== undefined ? `
                    <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                        <span>Cumulative:</span>
                        <span style="font-weight: bold;">${formatNumber(data.cumulativeTotal)}</span>
                    </div>
                    ` : ''}
                    ${d.label && d.label !== data.label ? `
                    <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.3);">
                        <div style="font-size: 11px; opacity: 0.8;">${d.label}</div>
                    </div>
                    ` : ''}
                `;
                // Show tooltip
                tooltip.show(content, event, {
                    label: data.label,
                    value: d.value || data.barTotal,
                    cumulative: data.cumulativeTotal,
                    color: d.color || (data.stacks && data.stacks[0] ? data.stacks[0].color : '#3498db'),
                    x: parseFloat(element.attr("x") || "0"),
                    y: parseFloat(element.attr("y") || "0"),
                    quadrant: 1
                });
                // Highlight element
                element.style("opacity", 0.8);
            })
                .on("mousemove", function (event) {
                tooltip.move(event);
            })
                .on("mouseout", function () {
                // Hide tooltip
                tooltip.hide();
                // Remove highlight
                d3__namespace.select(this).style("opacity", null);
            });
            // Also add tooltips to value labels
            svg.selectAll(".total-label")
                .on("mouseover", function (event, d) {
                const data = d.parent;
                const content = `
                    <div style="font-weight: bold; margin-bottom: 8px;">${data.label}</div>
                    <div style="display: flex; justify-content: space-between;">
                        <span>Total Value:</span>
                        <span style="font-weight: bold;">${formatNumber(data.barTotal)}</span>
                    </div>
                `;
                tooltip.show(content, event, {
                    label: data.label,
                    value: data.barTotal,
                    cumulative: data.cumulativeTotal,
                    color: '#333',
                    x: 0,
                    y: 0,
                    quadrant: 1
                });
            })
                .on("mousemove", function (event) {
                tooltip.move(event);
            })
                .on("mouseout", function () {
                tooltip.hide();
            });
        }
        function initializeExport(svg, processedData) {
            // Stub: would initialize export functionality
        }
        // Getter/setter methods using TypeScript
        chart.width = function (_) {
            return arguments.length ? (width = _, chart) : width;
        };
        chart.height = function (_) {
            return arguments.length ? (height = _, chart) : height;
        };
        chart.margin = function (_) {
            return arguments.length ? (margin = _, chart) : margin;
        };
        chart.stacked = function (_) {
            return arguments.length ? (stacked = _, chart) : stacked;
        };
        chart.showTotal = function (_) {
            return arguments.length ? (showTotal = _, chart) : showTotal;
        };
        chart.totalLabel = function (_) {
            return arguments.length ? (totalLabel = _, chart) : totalLabel;
        };
        chart.totalColor = function (_) {
            return arguments.length ? (totalColor = _, chart) : totalColor;
        };
        chart.barPadding = function (_) {
            return arguments.length ? (barPadding = _, chart) : barPadding;
        };
        chart.duration = function (_) {
            return arguments.length ? (duration = _, chart) : duration;
        };
        chart.ease = function (_) {
            return arguments.length ? (ease = _, chart) : ease;
        };
        chart.formatNumber = function (_) {
            return arguments.length ? (formatNumber = _, chart) : formatNumber;
        };
        chart.theme = function (_) {
            return arguments.length ? (theme = _, chart) : theme;
        };
        chart.enableBrush = function (_) {
            return arguments.length ? (enableBrush = _, chart) : enableBrush;
        };
        chart.brushOptions = function (_) {
            return arguments.length ? (brushOptions = { ...brushOptions, ..._ }, chart) : brushOptions;
        };
        chart.staggeredAnimations = function (_) {
            return arguments.length ? (staggeredAnimations = _, chart) : staggeredAnimations;
        };
        chart.staggerDelay = function (_) {
            return arguments.length ? (staggerDelay = _, chart) : staggerDelay;
        };
        chart.scaleType = function (_) {
            return arguments.length ? (scaleType = _, chart) : scaleType;
        };
        chart.showTrendLine = function (_) {
            return arguments.length ? (showTrendLine = _, chart) : showTrendLine;
        };
        chart.trendLineColor = function (_) {
            return arguments.length ? (trendLineColor = _, chart) : trendLineColor;
        };
        chart.trendLineWidth = function (_) {
            return arguments.length ? (trendLineWidth = _, chart) : trendLineWidth;
        };
        chart.trendLineStyle = function (_) {
            return arguments.length ? (trendLineStyle = _, chart) : trendLineStyle;
        };
        chart.trendLineOpacity = function (_) {
            return arguments.length ? (trendLineOpacity = _, chart) : trendLineOpacity;
        };
        chart.trendLineType = function (_) {
            return arguments.length ? (trendLineType = _, chart) : trendLineType;
        };
        chart.trendLineWindow = function (_) {
            return arguments.length ? (trendLineWindow = _, chart) : trendLineWindow;
        };
        chart.trendLineDegree = function (_) {
            return arguments.length ? (trendLineDegree = _, chart) : trendLineDegree;
        };
        chart.enableAccessibility = function (_) {
            return arguments.length ? (enableAccessibility = _, chart) : enableAccessibility;
        };
        chart.enableTooltips = function (_) {
            return arguments.length ? (enableTooltips = _, chart) : enableTooltips;
        };
        chart.tooltipConfig = function (_) {
            return arguments.length ? (tooltipConfig = { ...tooltipConfig, ..._ }, chart) : tooltipConfig;
        };
        chart.enableExport = function (_) {
            return arguments.length ? (enableExport = _, chart) : enableExport;
        };
        chart.exportConfig = function (_) {
            return arguments.length ? (exportConfig = { ...exportConfig, ..._ }, chart) : exportConfig;
        };
        chart.enableZoom = function (_) {
            return arguments.length ? (enableZoom = _, chart) : enableZoom;
        };
        chart.zoomConfig = function (_) {
            return arguments.length ? (zoomConfig = { ...zoomConfig, ..._ }, chart) : zoomConfig;
        };
        chart.breakdownConfig = function (_) {
            return arguments.length ? (breakdownConfig = _, chart) : breakdownConfig;
        };
        chart.enablePerformanceOptimization = function (_) {
            return arguments.length ? (enablePerformanceOptimization = _, chart) : enablePerformanceOptimization;
        };
        chart.performanceDashboard = function (_) {
            return arguments.length ? (performanceDashboard = _, chart) : performanceDashboard;
        };
        chart.virtualizationThreshold = function (_) {
            return arguments.length ? (virtualizationThreshold = _, chart) : virtualizationThreshold;
        };
        // Data method for API completeness
        chart.data = function (_) {
            // This method is for API completeness - actual data is passed to the chart function
            // Always return the chart instance for method chaining
            return chart;
        };
        // NEW: Advanced color and shape feature methods
        chart.advancedColors = function (_) {
            return arguments.length ? (advancedColorConfig = { ...advancedColorConfig, ..._ }, chart) : advancedColorConfig;
        };
        chart.enableAdvancedColors = function (_) {
            return arguments.length ? (advancedColorConfig.enabled = _, chart) : advancedColorConfig.enabled;
        };
        chart.colorScaleType = function (_) {
            return arguments.length ? (advancedColorConfig.scaleType = _, chart) : advancedColorConfig.scaleType;
        };
        // NEW: Additional advanced color methods
        chart.colorMode = function (_) {
            return arguments.length ? (colorMode = _, chart) : colorMode;
        };
        chart.colorTheme = function (_) {
            return arguments.length ? (advancedColorConfig.themeName = _, chart) : (advancedColorConfig.themeName || 'default');
        };
        chart.neutralThreshold = function (_) {
            return arguments.length ? (advancedColorConfig.neutralThreshold = _, chart) : (advancedColorConfig.neutralThreshold || 0);
        };
        chart.confidenceBands = function (_) {
            return arguments.length ? (confidenceBandConfig = { ...confidenceBandConfig, ..._ }, chart) : confidenceBandConfig;
        };
        chart.enableConfidenceBands = function (_) {
            return arguments.length ? (confidenceBandConfig.enabled = _, chart) : confidenceBandConfig.enabled;
        };
        chart.milestones = function (_) {
            return arguments.length ? (milestoneConfig = { ...milestoneConfig, ..._ }, chart) : milestoneConfig;
        };
        chart.enableMilestones = function (_) {
            return arguments.length ? (milestoneConfig.enabled = _, chart) : milestoneConfig.enabled;
        };
        chart.addMilestone = function (milestone) {
            milestoneConfig.milestones.push(milestone);
            return chart;
        };
        // Event handling methods
        chart.on = function () {
            const value = listeners.on.apply(listeners, Array.from(arguments));
            return value === listeners ? chart : value;
        };
        // NEW: Advanced feature rendering functions
        function drawConfidenceBands(container, processedData, xScale, yScale) {
            if (!confidenceBandConfig.enabled || !confidenceBandConfig.scenarios)
                return;
            // Create confidence bands group
            const confidenceGroup = container.selectAll(".confidence-bands-group").data([0]);
            const confidenceGroupEnter = confidenceGroup.enter()
                .append("g")
                .attr("class", "confidence-bands-group");
            const confidenceGroupUpdate = confidenceGroupEnter.merge(confidenceGroup);
            // Generate confidence band data using the waterfall-specific utility
            const confidenceBandData = createWaterfallConfidenceBands(processedData.map(d => ({ label: d.label, value: d.barTotal })), confidenceBandConfig.scenarios, xScale, yScale);
            // Render confidence band
            const confidencePath = confidenceGroupUpdate.selectAll(".confidence-band").data([confidenceBandData.confidencePath]);
            const confidencePathEnter = confidencePath.enter()
                .append("path")
                .attr("class", "confidence-band")
                .attr("fill", `rgba(52, 152, 219, ${confidenceBandConfig.opacity || 0.3})`)
                .attr("stroke", "none")
                .style("opacity", 0);
            confidencePathEnter.merge(confidencePath)
                .transition()
                .duration(duration)
                .ease(ease)
                .attr("d", confidenceBandData.confidencePath)
                .style("opacity", 1);
            // Render trend lines if enabled
            if (confidenceBandConfig.showTrendLines) {
                // Optimistic trend line
                const optimisticPath = confidenceGroupUpdate.selectAll(".optimistic-trend").data([confidenceBandData.optimisticPath]);
                const optimisticPathEnter = optimisticPath.enter()
                    .append("path")
                    .attr("class", "optimistic-trend")
                    .attr("fill", "none")
                    .attr("stroke", "#27ae60")
                    .attr("stroke-width", 2)
                    .attr("stroke-dasharray", "5,5")
                    .style("opacity", 0);
                optimisticPathEnter.merge(optimisticPath)
                    .transition()
                    .duration(duration)
                    .ease(ease)
                    .attr("d", confidenceBandData.optimisticPath)
                    .style("opacity", 0.8);
                // Pessimistic trend line
                const pessimisticPath = confidenceGroupUpdate.selectAll(".pessimistic-trend").data([confidenceBandData.pessimisticPath]);
                const pessimisticPathEnter = pessimisticPath.enter()
                    .append("path")
                    .attr("class", "pessimistic-trend")
                    .attr("fill", "none")
                    .attr("stroke", "#e74c3c")
                    .attr("stroke-width", 2)
                    .attr("stroke-dasharray", "5,5")
                    .style("opacity", 0);
                pessimisticPathEnter.merge(pessimisticPath)
                    .transition()
                    .duration(duration)
                    .ease(ease)
                    .attr("d", confidenceBandData.pessimisticPath)
                    .style("opacity", 0.8);
            }
            // Remove old elements
            confidencePath.exit()
                .transition()
                .duration(duration)
                .style("opacity", 0)
                .remove();
        }
        function drawMilestones(container, processedData, xScale, yScale) {
            if (!milestoneConfig.enabled || milestoneConfig.milestones.length === 0)
                return;
            // Create milestones group
            const milestonesGroup = container.selectAll(".milestones-group").data([0]);
            const milestonesGroupEnter = milestonesGroup.enter()
                .append("g")
                .attr("class", "milestones-group");
            const milestonesGroupUpdate = milestonesGroupEnter.merge(milestonesGroup);
            // Generate milestone markers using the waterfall-specific utility
            const milestoneMarkers = createWaterfallMilestones(milestoneConfig.milestones, xScale, yScale);
            // Render milestone markers
            const markers = milestonesGroupUpdate.selectAll(".milestone-marker").data(milestoneMarkers);
            const markersEnter = markers.enter()
                .append("path")
                .attr("class", "milestone-marker")
                .attr("transform", (d) => d.transform)
                .attr("d", (d) => d.path)
                .attr("fill", (d) => d.config.fillColor || "#f39c12")
                .attr("stroke", (d) => d.config.strokeColor || "#ffffff")
                .attr("stroke-width", (d) => d.config.strokeWidth || 2)
                .style("opacity", 0);
            markersEnter.merge(markers)
                .transition()
                .duration(duration)
                .ease(ease)
                .attr("transform", (d) => d.transform)
                .attr("d", (d) => d.path)
                .attr("fill", (d) => d.config.fillColor || "#f39c12")
                .style("opacity", 1);
            // Remove old markers
            markers.exit()
                .transition()
                .duration(duration)
                .style("opacity", 0)
                .remove();
        }
        return chart;
    }

    // MintWaterfall Data Processing Utilities - TypeScript Version
    // Provides data transformation, aggregation, and manipulation functions with full type safety
    // Data loading utilities
    async function loadData(source, options = {}) {
        try {
            let rawData;
            if (typeof source === "string") {
                // URL or file path
                if (source.endsWith(".csv")) {
                    rawData = await d3__namespace.csv(source);
                }
                else if (source.endsWith(".json")) {
                    rawData = await d3__namespace.json(source);
                }
                else if (source.endsWith(".tsv")) {
                    rawData = await d3__namespace.tsv(source);
                }
                else {
                    // Try to detect if it's a URL by checking for http/https
                    if (source.startsWith("http")) {
                        const response = await fetch(source);
                        const contentType = response.headers.get("content-type");
                        if (contentType?.includes("application/json")) {
                            rawData = await response.json();
                        }
                        else if (contentType?.includes("text/csv")) {
                            const text = await response.text();
                            rawData = d3__namespace.csvParse(text);
                        }
                        else {
                            rawData = await response.json(); // fallback
                        }
                    }
                    else {
                        throw new Error(`Unsupported file format: ${source}`);
                    }
                }
            }
            else if (Array.isArray(source)) {
                // Already an array
                rawData = source;
            }
            else {
                throw new Error("Source must be a URL, file path, or data array");
            }
            // Transform raw data to MintWaterfall format if needed
            return transformToWaterfallFormat(rawData, options);
        }
        catch (error) {
            console.error("Error loading data:", error);
            throw error;
        }
    }
    // Transform various data formats to MintWaterfall format
    function transformToWaterfallFormat(data, options = {}) {
        const { valueColumn = "value", labelColumn = "label", colorColumn = "color", 
        // stacksColumn = "stacks", // Reserved for future use
        defaultColor = "#3498db", parseNumbers = true } = options;
        if (!Array.isArray(data)) {
            throw new Error("Data must be an array");
        }
        return data.map((item, index) => {
            // If already in correct format, return as-is
            if (item.label && Array.isArray(item.stacks)) {
                return item;
            }
            // Transform flat format to stacked format
            const label = item[labelColumn] || `Item ${index + 1}`;
            let value = item[valueColumn];
            if (parseNumbers && typeof value === "string") {
                value = parseFloat(value.replace(/[,$]/g, "")) || 0;
            }
            else if (typeof value !== "number") {
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
    function createDataProcessor() {
        function validateData(data) {
            if (!data || !Array.isArray(data)) {
                throw new Error("Data must be an array");
            }
            if (data.length === 0) {
                throw new Error("Data array cannot be empty");
            }
            const isValid = data.every((item, index) => {
                if (!item || typeof item !== "object") {
                    throw new Error(`Item at index ${index} must be an object`);
                }
                if (typeof item.label !== "string") {
                    throw new Error(`Item at index ${index} must have a string 'label' property`);
                }
                if (!Array.isArray(item.stacks)) {
                    throw new Error(`Item at index ${index} must have an array 'stacks' property`);
                }
                if (item.stacks.length === 0) {
                    throw new Error(`Item at index ${index} must have at least one stack`);
                }
                item.stacks.forEach((stack, stackIndex) => {
                    if (typeof stack.value !== "number" || isNaN(stack.value)) {
                        throw new Error(`Stack ${stackIndex} in item ${index} must have a numeric 'value'`);
                    }
                    if (typeof stack.color !== "string") {
                        throw new Error(`Stack ${stackIndex} in item ${index} must have a string 'color'`);
                    }
                });
                return true;
            });
            return isValid;
        }
        function aggregateData(data, aggregateBy = "sum") {
            validateData(data);
            return data.map((item) => {
                let aggregatedValue;
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
        function sortData(data, sortBy = "label", direction = "ascending") {
            validateData(data);
            const sorted = [...data].sort((a, b) => {
                let valueA, valueB;
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
                let comparison;
                if (typeof valueA === "string" && typeof valueB === "string") {
                    comparison = valueA.localeCompare(valueB);
                }
                else {
                    comparison = valueA - valueB;
                }
                return direction === "ascending" ? comparison : -comparison;
            });
            return sorted;
        }
        function filterData(data, filterFn) {
            validateData(data);
            return data.filter(filterFn);
        }
        function getDataSummary(data) {
            validateData(data);
            const allValues = [];
            const allColors = [];
            let totalStacks = 0;
            data.forEach(item => {
                item.stacks.forEach(stack => {
                    allValues.push(stack.value);
                    allColors.push(stack.color);
                    totalStacks++;
                });
            });
            const valueRange = {
                min: Math.min(...allValues),
                max: Math.max(...allValues)
            };
            const cumulativeTotal = allValues.reduce((sum, value) => sum + value, 0);
            const stackColors = [...new Set(allColors)];
            const labels = data.map(item => item.label);
            return {
                totalItems: data.length,
                totalStacks,
                valueRange,
                cumulativeTotal,
                stackColors,
                labels
            };
        }
        function transformData(data, transformFn) {
            validateData(data);
            return data.map(transformFn);
        }
        function groupData(data, groupBy) {
            validateData(data);
            const groups = new Map();
            data.forEach(item => {
                const key = typeof groupBy === "function" ? groupBy(item) : item.label;
                if (!groups.has(key)) {
                    groups.set(key, []);
                }
                groups.get(key).push(item);
            });
            return groups;
        }
        function transformStacks(data, transformer) {
            if (typeof transformer !== 'function') {
                throw new Error('Transformer must be a function');
            }
            return data.map(item => ({
                ...item,
                stacks: item.stacks.map(transformer)
            }));
        }
        function normalizeValues(data, targetMax) {
            // Find the maximum absolute value across all stacks
            let maxValue = 0;
            data.forEach(item => {
                item.stacks.forEach(stack => {
                    maxValue = Math.max(maxValue, Math.abs(stack.value));
                });
            });
            if (maxValue === 0)
                return data;
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
        function groupByCategory(data, categoryFunction) {
            if (typeof categoryFunction !== 'function') {
                throw new Error('Category function must be a function');
            }
            const groups = {};
            data.forEach(item => {
                const category = categoryFunction(item);
                if (!groups[category]) {
                    groups[category] = [];
                }
                groups[category].push(item);
            });
            return groups;
        }
        function calculatePercentages(data) {
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
        function interpolateData(data1, data2, t) {
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
        function generateSampleData(itemCount, stacksPerItem, valueRange = [10, 100]) {
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
        // === ADVANCED D3.JS DATA OPERATIONS ===
        /**
         * Advanced multi-dimensional grouping using D3.js group() API
         * Supports 1-3 levels of nested grouping
         */
        function groupBy(data, ...keys) {
            if (!Array.isArray(data)) {
                throw new Error("Data must be an array");
            }
            if (keys.length === 0) {
                throw new Error("At least one grouping key must be provided");
            }
            if (keys.length === 1) {
                return d3__namespace.group(data, keys[0]);
            }
            else if (keys.length === 2) {
                return d3__namespace.group(data, keys[0], keys[1]);
            }
            else if (keys.length === 3) {
                return d3__namespace.group(data, keys[0], keys[1], keys[2]);
            }
            else {
                throw new Error("Maximum 3 levels of grouping supported");
            }
        }
        /**
         * Advanced aggregation using D3.js rollup() API
         * Supports multi-dimensional rollup with custom reducers
         */
        function rollupBy(data, reducer, ...keys) {
            if (!Array.isArray(data)) {
                throw new Error("Data must be an array");
            }
            if (typeof reducer !== "function") {
                throw new Error("Reducer must be a function");
            }
            if (keys.length === 0) {
                throw new Error("At least one grouping key must be provided");
            }
            if (keys.length === 1) {
                return d3__namespace.rollup(data, reducer, keys[0]);
            }
            else if (keys.length === 2) {
                return d3__namespace.rollup(data, reducer, keys[0], keys[1]);
            }
            else if (keys.length === 3) {
                return d3__namespace.rollup(data, reducer, keys[0], keys[1], keys[2]);
            }
            else {
                throw new Error("Maximum 3 levels of rollup supported");
            }
        }
        /**
         * Flatten hierarchical rollup using D3.js flatRollup() API
         * Returns array of [key1, key2, ..., value] tuples
         */
        function flatRollupBy(data, reducer, ...keys) {
            if (!Array.isArray(data)) {
                throw new Error("Data must be an array");
            }
            if (typeof reducer !== "function") {
                throw new Error("Reducer must be a function");
            }
            if (keys.length === 0) {
                throw new Error("At least one grouping key must be provided");
            }
            return d3__namespace.flatRollup(data, reducer, ...keys);
        }
        /**
         * Cross-tabulation using D3.js cross() API
         * Creates cartesian product with optional combiner function
         */
        function crossTabulate(data1, data2, combiner) {
            if (!Array.isArray(data1) || !Array.isArray(data2)) {
                throw new Error("Both data arrays must be arrays");
            }
            if (combiner) {
                return d3__namespace.cross(data1, data2, (a, b) => ({
                    row: a,
                    col: b,
                    value: combiner(a, b)
                }));
            }
            else {
                return d3__namespace.cross(data1, data2, (a, b) => ({
                    row: a,
                    col: b,
                    value: undefined
                }));
            }
        }
        /**
         * Fast data indexing using D3.js index() API
         * Creates map-based indexes for O(1) lookups
         */
        function indexBy(data, ...keys) {
            if (!Array.isArray(data)) {
                throw new Error("Data must be an array");
            }
            if (keys.length === 0) {
                throw new Error("At least one indexing key must be provided");
            }
            if (keys.length === 1) {
                return d3__namespace.index(data, keys[0]);
            }
            else if (keys.length === 2) {
                return d3__namespace.index(data, keys[0], keys[1]);
            }
            else {
                throw new Error("Maximum 2 levels of indexing supported");
            }
        }
        /**
         * Temporal aggregation for time-series waterfall data
         * Groups data by time intervals and aggregates values
         */
        function aggregateByTime(data, options) {
            const { timeAccessor, valueAccessor, interval, aggregation = 'sum' } = options;
            if (!Array.isArray(data)) {
                throw new Error("Data must be an array");
            }
            if (typeof timeAccessor !== "function" || typeof valueAccessor !== "function") {
                throw new Error("Time and value accessors must be functions");
            }
            // Group by time interval
            const grouped = d3__namespace.rollup(data, (values) => {
                switch (aggregation) {
                    case 'sum':
                        return d3__namespace.sum(values, valueAccessor);
                    case 'average':
                        return d3__namespace.mean(values, valueAccessor) || 0;
                    case 'max':
                        return d3__namespace.max(values, valueAccessor) || 0;
                    case 'min':
                        return d3__namespace.min(values, valueAccessor) || 0;
                    default:
                        return d3__namespace.sum(values, valueAccessor);
                }
            }, (d) => interval(timeAccessor(d)));
            // Convert to waterfall format
            return Array.from(grouped.entries()).map(([date, value]) => ({
                label: d3__namespace.timeFormat("%Y-%m-%d")(date),
                stacks: [{
                        value: value,
                        color: value >= 0 ? "#2ecc71" : "#e74c3c",
                        label: `${value >= 0 ? "+" : ""}${d3__namespace.format(".2f")(value)}`
                    }]
            }));
        }
        /**
         * Create multi-dimensional waterfall from hierarchical data
         * Groups by multiple keys and creates stacked waterfall segments
         */
        function createMultiDimensionalWaterfall(data, groupKeys, valueKey) {
            if (!Array.isArray(data) || !Array.isArray(groupKeys)) {
                throw new Error("Data and groupKeys must be arrays");
            }
            if (groupKeys.length === 0) {
                throw new Error("At least one group key must be provided");
            }
            // Create accessor functions for the keys
            const accessors = groupKeys.map(key => (d) => d[key]);
            // Use flatRollup to get flat aggregated data
            const aggregated = d3__namespace.flatRollup(data, (values) => d3__namespace.sum(values, (d) => d[valueKey] || 0), ...accessors);
            // Convert to waterfall format
            return aggregated.map((item) => {
                const keys = item.slice(0, -1); // All but last element
                const value = item[item.length - 1]; // Last element
                const label = keys.join(" → ");
                const colors = ["#3498db", "#2ecc71", "#f39c12", "#e74c3c", "#9b59b6"];
                const colorIndex = Math.abs(keys.join("").split("").reduce((a, b) => a + b.charCodeAt(0), 0)) % colors.length;
                return {
                    label,
                    stacks: [{
                            value: value,
                            color: colors[colorIndex],
                            label: `${value >= 0 ? "+" : ""}${d3__namespace.format(".2f")(value)}`
                        }]
                };
            });
        }
        /**
         * Aggregate existing waterfall data by time periods
         * Useful for rolling up daily waterfalls into weekly/monthly
         */
        function aggregateWaterfallByPeriod(data, timeKey, interval) {
            validateData(data);
            // Extract time values and group by interval
            const timeGrouped = d3__namespace.rollup(data, (items) => {
                // Aggregate all stacks across items in this time period
                const allStacks = [];
                items.forEach(item => allStacks.push(...item.stacks));
                // Group stacks by color and sum values
                const stacksByColor = d3__namespace.rollup(allStacks, (stacks) => ({
                    value: d3__namespace.sum(stacks, s => s.value),
                    label: stacks[0].label,
                    color: stacks[0].color
                }), (s) => s.color);
                return Array.from(stacksByColor.values());
            }, (item) => {
                // Try to parse time from the item (assuming it's in the label or a property)
                const timeStr = item[timeKey] || item.label;
                const date = new Date(timeStr);
                return isNaN(date.getTime()) ? new Date() : interval(date);
            });
            // Convert to waterfall format
            return Array.from(timeGrouped.entries()).map(([date, stacks]) => ({
                label: d3__namespace.timeFormat("%Y-%m-%d")(date),
                stacks: stacks
            }));
        }
        /**
         * Create breakdown waterfall showing primary categories and their breakdowns
         * Useful for drill-down analysis
         */
        function createBreakdownWaterfall(data, primaryKey, breakdownKey, valueKey) {
            if (!Array.isArray(data)) {
                throw new Error("Data must be an array");
            }
            // First group by primary key, then by breakdown key
            const nested = d3__namespace.rollup(data, (values) => d3__namespace.sum(values, (d) => d[valueKey] || 0), (d) => d[primaryKey], (d) => d[breakdownKey]);
            // Convert to waterfall format with stacked breakdowns
            return Array.from(nested.entries()).map(([primaryValue, breakdowns]) => {
                const stacks = Array.from(breakdowns.entries()).map(([breakdownValue, value], index) => {
                    const colors = ["#3498db", "#2ecc71", "#f39c12", "#e74c3c", "#9b59b6", "#1abc9c", "#34495e"];
                    return {
                        value: value,
                        color: colors[index % colors.length],
                        label: `${breakdownValue}: ${value >= 0 ? "+" : ""}${d3__namespace.format(".2f")(value)}`
                    };
                });
                return {
                    label: String(primaryValue),
                    stacks
                };
            });
        }
        // Internal wrapper functions for the standalone functions
        async function loadDataWrapper(source, options = {}) {
            return await loadData(source, options);
        }
        function transformToWaterfallFormatWrapper(data, options = {}) {
            return transformToWaterfallFormat(data, options);
        }
        return {
            // Original methods
            validateData,
            loadData: loadDataWrapper,
            transformToWaterfallFormat: transformToWaterfallFormatWrapper,
            aggregateData,
            sortData,
            filterData,
            getDataSummary,
            transformData,
            groupData,
            transformStacks,
            normalizeValues,
            groupByCategory,
            calculatePercentages,
            interpolateData,
            generateSampleData,
            // Advanced D3.js data operations
            groupBy,
            rollupBy,
            flatRollupBy,
            crossTabulate,
            indexBy,
            aggregateByTime,
            createMultiDimensionalWaterfall,
            aggregateWaterfallByPeriod,
            createBreakdownWaterfall
        };
    }
    // Export a default instance for backward compatibility
    const dataProcessor = createDataProcessor();
    // === STANDALONE ADVANCED DATA OPERATION HELPERS ===
    /**
     * Create revenue waterfall by grouping sales data by multiple dimensions
     * Example: Group by Region → Product → Channel
     */
    function createRevenueWaterfall(salesData, dimensions, valueField = 'revenue') {
        return dataProcessor.createMultiDimensionalWaterfall(salesData, dimensions, valueField);
    }
    /**
     * Aggregate financial data by time periods for waterfall analysis
     * Example: Roll up daily P&L data into monthly waterfall
     */
    function createTemporalWaterfall(data, timeField, valueField, interval = 'month') {
        const timeIntervals = {
            day: d3__namespace.timeDay,
            week: d3__namespace.timeWeek,
            month: d3__namespace.timeMonth,
            quarter: d3__namespace.timeMonth.every(3),
            year: d3__namespace.timeYear
        };
        return dataProcessor.aggregateByTime(data, {
            timeAccessor: (d) => new Date(d[timeField]),
            valueAccessor: (d) => d[valueField] || 0,
            interval: timeIntervals[interval],
            aggregation: 'sum'
        });
    }
    /**
     * Create variance analysis waterfall comparing actuals vs budget
     * Shows positive/negative variances as waterfall segments
     */
    function createVarianceWaterfall(data, categoryField, actualField = 'actual', budgetField = 'budget') {
        return data.map(item => {
            const actual = item[actualField] || 0;
            const budget = item[budgetField] || 0;
            const variance = actual - budget;
            return {
                label: item[categoryField],
                stacks: [{
                        value: variance,
                        color: variance >= 0 ? '#2ecc71' : '#e74c3c',
                        label: `Variance: ${variance >= 0 ? '+' : ''}${d3__namespace.format('.2f')(variance)}`
                    }]
            };
        });
    }
    /**
     * Advanced data grouping with waterfall-optimized aggregation
     * Supports nested grouping with automatic color assignment
     */
    function groupWaterfallData(data, groupBy, valueAccessor, labelAccessor) {
        const grouped = dataProcessor.flatRollupBy(data, (values) => d3__namespace.sum(values, valueAccessor), ...groupBy);
        const colors = ['#3498db', '#2ecc71', '#f39c12', '#e74c3c', '#9b59b6', '#1abc9c', '#34495e', '#95a5a6'];
        return grouped.map((item, index) => {
            const keys = item.slice(0, -1); // All but last element
            const value = item[item.length - 1]; // Last element
            const label = labelAccessor && data[0]
                ? keys.map((key, i) => `${Object.keys(data[0])[i]}: ${key}`).join(' | ')
                : keys.join(' → ');
            return {
                label,
                stacks: [{
                        value: value,
                        color: colors[index % colors.length],
                        label: `${value >= 0 ? '+' : ''}${d3__namespace.format('.2f')(value)}`
                    }]
            };
        });
    }
    /**
     * Cross-tabulate two datasets to create comparison waterfall
     * Useful for period-over-period analysis
     */
    function createComparisonWaterfall(currentPeriod, previousPeriod, categoryAccessor, valueAccessor) {
        // Index previous period for fast lookup
        const prevIndex = d3__namespace.index(previousPeriod, categoryAccessor);
        return currentPeriod.map(currentItem => {
            const category = categoryAccessor(currentItem);
            const currentValue = valueAccessor(currentItem);
            const prevItem = prevIndex.get(category);
            const prevValue = prevItem ? valueAccessor(prevItem) : 0;
            const change = currentValue - prevValue;
            return {
                label: category,
                stacks: [{
                        value: change,
                        color: change >= 0 ? '#2ecc71' : '#e74c3c',
                        label: `Change: ${change >= 0 ? '+' : ''}${d3__namespace.format('.2f')(change)}`
                    }]
            };
        });
    }
    /**
     * Transform flat transaction data into hierarchical waterfall
     * Automatically detects categories and subcategories
     */
    function transformTransactionData(transactions, categoryField, subcategoryField, valueField = 'amount', dateField) {
        if (subcategoryField) {
            // Two-level breakdown
            return dataProcessor.createBreakdownWaterfall(transactions, categoryField, subcategoryField, valueField);
        }
        else {
            // Simple category aggregation
            const aggregated = dataProcessor.rollupBy(transactions, (values) => d3__namespace.sum(values, (d) => d[valueField] || 0), (d) => d[categoryField]);
            const colors = ['#3498db', '#2ecc71', '#f39c12', '#e74c3c', '#9b59b6'];
            let colorIndex = 0;
            return Array.from(aggregated.entries()).map(([category, value]) => ({
                label: String(category),
                stacks: [{
                        value: value,
                        color: colors[colorIndex++ % colors.length],
                        label: `${value >= 0 ? '+' : ''}${d3__namespace.format('.2f')(value)}`
                    }]
            }));
        }
    }
    /**
     * Create common financial reducers for rollup operations
     */
    const financialReducers = {
        sum: (values) => d3__namespace.sum(values, (d) => d.value || 0),
        average: (values) => d3__namespace.mean(values, (d) => d.value || 0) || 0,
        weightedAverage: (values, weightField = 'weight') => {
            const totalWeight = d3__namespace.sum(values, (d) => d[weightField] || 0);
            if (totalWeight === 0)
                return 0;
            return d3__namespace.sum(values, (d) => (d.value || 0) * (d[weightField] || 0)) / totalWeight;
        },
        variance: (values) => {
            const mean = d3__namespace.mean(values, (d) => d.value || 0) || 0;
            return d3__namespace.mean(values, (d) => Math.pow((d.value || 0) - mean, 2)) || 0;
        },
        percentile: (p) => (values) => {
            const sorted = values.map((d) => d.value || 0).sort(d3__namespace.ascending);
            return d3__namespace.quantile(sorted, p / 100) || 0;
        }
    };
    /**
     * Export commonly used D3.js data manipulation functions for convenience
     */
    const d3DataUtils = {
        group: d3__namespace.group,
        rollup: d3__namespace.rollup,
        flatRollup: d3__namespace.flatRollup,
        cross: d3__namespace.cross,
        index: d3__namespace.index,
        sum: d3__namespace.sum,
        mean: d3__namespace.mean,
        median: d3__namespace.median,
        quantile: d3__namespace.quantile,
        min: d3__namespace.min,
        max: d3__namespace.max,
        extent: d3__namespace.extent,
        ascending: d3__namespace.ascending,
        descending: d3__namespace.descending
    };

    // MintWaterfall Animation and Transitions System - TypeScript Version
    // Provides smooth animations and transitions for chart updates with full type safety
    function createAnimationSystem() {
        // Advanced transition configuration
        const transitionConfig = {
            staggerDelay: 100, // Default stagger delay between elements
            defaultDuration: 750, // Default animation duration
            defaultEase: "easeOutQuad"
        };
        function createEasingFunctions() {
            return {
                linear: (t) => t,
                easeInQuad: (t) => t * t,
                easeOutQuad: (t) => t * (2 - t),
                easeInOutQuad: (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
                easeInCubic: (t) => t * t * t,
                easeOutCubic: (t) => (--t) * t * t + 1,
                easeInOutCubic: (t) => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
                easeInSine: (t) => 1 - Math.cos(t * Math.PI / 2),
                easeOutSine: (t) => Math.sin(t * Math.PI / 2),
                easeInOutSine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
                easeInElastic: (t) => {
                    const c4 = (2 * Math.PI) / 3;
                    return t === 0 ? 0 : t === 1 ? 1 : -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * c4);
                },
                easeOutElastic: (t) => {
                    const c4 = (2 * Math.PI) / 3;
                    return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
                },
                easeOutBounce: (t) => {
                    const n1 = 7.5625;
                    const d1 = 2.75;
                    if (t < 1 / d1) {
                        return n1 * t * t;
                    }
                    else if (t < 2 / d1) {
                        return n1 * (t -= 1.5 / d1) * t + 0.75;
                    }
                    else if (t < 2.5 / d1) {
                        return n1 * (t -= 2.25 / d1) * t + 0.9375;
                    }
                    else {
                        return n1 * (t -= 2.625 / d1) * t + 0.984375;
                    }
                }
            };
        }
        const easingFunctions = createEasingFunctions();
        function animateValue(startValue, endValue, duration, easingType = "easeOutQuad", onUpdate, onComplete) {
            const startTime = performance.now();
            const valueRange = endValue - startValue;
            const easing = easingFunctions[easingType] || easingFunctions.easeOutQuad;
            function frame(currentTime) {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const easedProgress = easing(progress);
                const currentValue = startValue + (valueRange * easedProgress);
                if (onUpdate) {
                    onUpdate(currentValue, progress);
                }
                if (progress < 1) {
                    requestAnimationFrame(frame);
                }
                else if (onComplete) {
                    onComplete();
                }
            }
            requestAnimationFrame(frame);
        }
        function staggeredAnimation(items, animationFn, staggerDelay = 100, totalDuration = 1000) {
            if (!Array.isArray(items)) {
                throw new Error("Items must be an array");
            }
            items.forEach((item, index) => {
                const delay = index * staggerDelay;
                const adjustedDuration = totalDuration - delay;
                setTimeout(() => {
                    if (adjustedDuration > 0) {
                        animationFn(item, index, adjustedDuration);
                    }
                }, delay);
            });
        }
        function morphShape(fromPath, toPath, duration = 1000, easingType = "easeInOutQuad", onUpdate, onComplete) {
            // Simple path morphing for basic shapes
            // Note: In a real implementation, you'd want more sophisticated path interpolation
            if (typeof fromPath !== "string" || typeof toPath !== "string") {
                throw new Error("Path values must be strings");
            }
            const startTime = performance.now();
            const easing = easingFunctions[easingType] || easingFunctions.easeInOutQuad;
            function frame(currentTime) {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const easedProgress = easing(progress);
                // Simple interpolation - in production, use a proper path morphing library
                const interpolatedPath = progress < 0.5 ? fromPath : toPath;
                if (onUpdate) {
                    onUpdate(interpolatedPath, easedProgress);
                }
                if (progress < 1) {
                    requestAnimationFrame(frame);
                }
                else if (onComplete) {
                    onComplete();
                }
            }
            requestAnimationFrame(frame);
        }
        function fadeTransition(element, fromOpacity, toOpacity, duration = 500, easingType = "easeOutQuad") {
            return new Promise((resolve) => {
                animateValue(fromOpacity, toOpacity, duration, easingType, (value) => {
                    if (element && element.style) {
                        element.style.opacity = value.toString();
                    }
                    else if (element && element.attr) {
                        // D3 selection
                        element.attr("opacity", value);
                    }
                }, () => resolve());
            });
        }
        function slideTransition(element, fromX, toX, duration = 500, easingType = "easeOutQuad") {
            return new Promise((resolve) => {
                animateValue(fromX, toX, duration, easingType, (value) => {
                    if (element && element.style) {
                        element.style.transform = `translateX(${value}px)`;
                    }
                    else if (element && element.attr) {
                        // D3 selection
                        element.attr("transform", `translate(${value}, 0)`);
                    }
                }, () => resolve());
            });
        }
        function scaleTransition(element, fromScale, toScale, duration = 500, easingType = "easeOutQuad") {
            return new Promise((resolve) => {
                animateValue(fromScale, toScale, duration, easingType, (value) => {
                    if (element && element.style) {
                        element.style.transform = `scale(${value})`;
                    }
                    else if (element && element.attr) {
                        // D3 selection
                        element.attr("transform", `scale(${value})`);
                    }
                }, () => resolve());
            });
        }
        function createTransitionSequence() {
            const sequence = [];
            let isRunning = false;
            function add(transitionFn, delay = 0) {
                sequence.push({ fn: transitionFn, delay });
                return transitionSequence;
            }
            function parallel(...transitionFns) {
                sequence.push({
                    fn: () => Promise.all(transitionFns.map(fn => fn())),
                    delay: 0
                });
                return transitionSequence;
            }
            async function play() {
                if (isRunning) {
                    throw new Error("Sequence is already running");
                }
                isRunning = true;
                try {
                    for (const step of sequence) {
                        if (step.delay > 0) {
                            await new Promise(resolve => setTimeout(resolve, step.delay));
                        }
                        await step.fn();
                    }
                }
                finally {
                    isRunning = false;
                }
            }
            function stop() {
                isRunning = false;
                // Note: In a production system, you'd want to cancel running animations
            }
            const transitionSequence = {
                add,
                parallel,
                play,
                stop,
                get isRunning() { return isRunning; }
            };
            return transitionSequence;
        }
        function createSpringAnimation(tension = 300, friction = 20) {
            // Simple spring physics implementation
            function animate(startValue, endValue, onUpdate, onComplete) {
                let position = startValue;
                let velocity = 0;
                let lastTime = performance.now();
                function frame(currentTime) {
                    const deltaTime = (currentTime - lastTime) / 1000; // Convert to seconds
                    lastTime = currentTime;
                    const displacement = position - endValue;
                    const springForce = -tension * displacement;
                    const dampingForce = -friction * velocity;
                    const acceleration = springForce + dampingForce;
                    velocity += acceleration * deltaTime;
                    position += velocity * deltaTime;
                    if (onUpdate) {
                        onUpdate(position);
                    }
                    // Check if animation should continue
                    const isAtRest = Math.abs(displacement) < 0.01 && Math.abs(velocity) < 0.01;
                    if (!isAtRest) {
                        requestAnimationFrame(frame);
                    }
                    else if (onComplete) {
                        onComplete();
                    }
                }
                requestAnimationFrame(frame);
            }
            return { animate };
        }
        function createAnimationPresets() {
            return {
                slideInLeft: (element, duration = 500) => slideTransition(element, -100, 0, duration, "easeOutQuad"),
                slideInRight: (element, duration = 500) => slideTransition(element, 100, 0, duration, "easeOutQuad"),
                fadeIn: (element, duration = 500) => fadeTransition(element, 0, 1, duration, "easeOutQuad"),
                fadeOut: (element, duration = 500) => fadeTransition(element, 1, 0, duration, "easeOutQuad"),
                scaleIn: (element, duration = 500) => scaleTransition(element, 0, 1, duration, "easeOutElastic"),
                scaleOut: (element, duration = 500) => scaleTransition(element, 1, 0, duration, "easeInQuad"),
                pulse: (element, duration = 300) => {
                    const sequence = createTransitionSequence();
                    return sequence
                        .add(() => scaleTransition(element, 1, 1.1, duration / 2, "easeOutQuad"))
                        .add(() => scaleTransition(element, 1.1, 1, duration / 2, "easeInQuad"))
                        .play();
                },
                bounce: (element, duration = 600) => scaleTransition(element, 0, 1, duration, "easeOutBounce")
            };
        }
        const presets = createAnimationPresets();
        // Advanced staggered animations
        function createStaggeredTransition(elements, animationFn, options = {}) {
            const { delay = transitionConfig.staggerDelay, duration = transitionConfig.defaultDuration, ease = transitionConfig.defaultEase, reverse = false } = options;
            const elementArray = Array.isArray(elements) ? elements : Array.from(elements);
            const orderedElements = reverse ? [...elementArray].reverse() : elementArray;
            return Promise.all(orderedElements.map((element, index) => {
                return new Promise(resolve => {
                    setTimeout(() => {
                        animationFn(element, duration, ease).then(resolve);
                    }, index * delay);
                });
            }));
        }
        // Custom tweening functions
        function createCustomTween(startValue, endValue, interpolator) {
            return function (t) {
                if (typeof interpolator === "function") {
                    return interpolator(startValue, endValue, t);
                }
                // Default linear interpolation
                return startValue + (endValue - startValue) * t;
            };
        }
        // Transition event handlers
        function createTransitionWithEvents(element, config) {
            const { duration = transitionConfig.defaultDuration, onStart, onEnd, onInterrupt } = config;
            let isInterrupted = false;
            const transition = {
                start() {
                    if (onStart)
                        onStart();
                    return this;
                },
                interrupt() {
                    isInterrupted = true;
                    if (onInterrupt)
                        onInterrupt();
                    return this;
                },
                then(callback) {
                    if (!isInterrupted && onEnd) {
                        setTimeout(() => {
                            onEnd();
                            if (callback)
                                callback();
                        }, duration);
                    }
                    return this;
                }
            };
            return transition;
        }
        const animationSystem = {
            easingFunctions,
            animateValue,
            staggeredAnimation,
            morphShape,
            fadeTransition,
            slideTransition,
            scaleTransition,
            createTransitionSequence,
            createSpringAnimation,
            createStaggeredTransition,
            createCustomTween,
            createTransitionWithEvents,
            transitionConfig,
            presets
        };
        return animationSystem;
    }

    // MintWaterfall Advanced Statistical Analysis - TypeScript Version
    // Provides comprehensive statistical analysis features for waterfall chart data
    // ============================================================================
    // STATISTICAL SYSTEM IMPLEMENTATION
    // ============================================================================
    function createStatisticalSystem() {
        // ========================================================================
        // CORE STATISTICAL FUNCTIONS
        // ========================================================================
        /**
         * Calculate comprehensive statistical summary
         * Enhanced with D3.js statistical functions
         */
        function calculateSummary(data) {
            // Filter out null/undefined values
            const cleanData = data.filter(d => d != null && !isNaN(d)).sort(d3__namespace.ascending);
            if (cleanData.length === 0) {
                // Return empty statistical summary instead of throwing
                return {
                    count: 0,
                    sum: 0,
                    mean: 0,
                    median: 0,
                    mode: [],
                    variance: 0,
                    standardDeviation: 0,
                    min: 0,
                    max: 0,
                    range: 0,
                    quartiles: [0, 0, 0],
                    percentiles: { p5: 0, p10: 0, p25: 0, p75: 0, p90: 0, p95: 0 }
                };
            }
            const count = cleanData.length;
            const sum = d3__namespace.sum(cleanData);
            const mean = d3__namespace.mean(cleanData) || 0;
            const medianValue = d3Array.median(cleanData) || 0;
            const varianceValue = d3Array.variance(cleanData) || 0;
            const standardDeviation = d3Array.deviation(cleanData) || 0;
            const min = d3__namespace.min(cleanData) || 0;
            const max = d3__namespace.max(cleanData) || 0;
            const range = max - min;
            // Calculate quartiles
            const q1 = d3Array.quantile(cleanData, 0.25) || 0;
            const q2 = medianValue;
            const q3 = d3Array.quantile(cleanData, 0.75) || 0;
            // Calculate percentiles
            const percentiles = {
                p5: d3Array.quantile(cleanData, 0.05) || 0,
                p10: d3Array.quantile(cleanData, 0.10) || 0,
                p25: q1,
                p75: q3,
                p90: d3Array.quantile(cleanData, 0.90) || 0,
                p95: d3Array.quantile(cleanData, 0.95) || 0
            };
            // Calculate mode (most frequent value)
            const valueFreq = new Map();
            cleanData.forEach(value => {
                valueFreq.set(value, (valueFreq.get(value) || 0) + 1);
            });
            let maxFreq = 0;
            const modes = [];
            valueFreq.forEach((freq, value) => {
                if (freq > maxFreq) {
                    maxFreq = freq;
                    modes.length = 0;
                    modes.push(value);
                }
                else if (freq === maxFreq) {
                    modes.push(value);
                }
            });
            return {
                count,
                sum,
                mean,
                median: medianValue,
                mode: modes,
                variance: varianceValue,
                standardDeviation,
                min,
                max,
                range,
                quartiles: [q1, q2, q3],
                percentiles
            };
        }
        /**
         * Detect outliers using IQR method and modified Z-score
         * Enhanced with severity classification
         */
        function detectOutliers(data, labels = []) {
            const summary = calculateSummary(data);
            const [q1, q2, q3] = summary.quartiles;
            const iqr = q3 - q1;
            // IQR method boundaries
            const lowerBound = q1 - 1.5 * iqr;
            const upperBound = q3 + 1.5 * iqr;
            const extremeLowerBound = q1 - 3 * iqr;
            const extremeUpperBound = q3 + 3 * iqr;
            const outliers = [];
            const cleanData = [];
            data.forEach((value, index) => {
                if (value == null || isNaN(value))
                    return;
                const isOutlier = value < lowerBound || value > upperBound;
                const isExtreme = value < extremeLowerBound || value > extremeUpperBound;
                if (isOutlier) {
                    outliers.push({
                        value,
                        index,
                        label: labels[index],
                        severity: isExtreme ? 'extreme' : 'mild',
                        type: value < lowerBound ? 'lower' : 'upper'
                    });
                }
                else {
                    cleanData.push({
                        value,
                        index,
                        label: labels[index]
                    });
                }
            });
            const mildOutliers = outliers.filter(o => o.severity === 'mild').length;
            const extremeOutliers = outliers.filter(o => o.severity === 'extreme').length;
            return {
                outliers,
                cleanData,
                method: 'iqr',
                threshold: { lowerBound, upperBound, extremeLowerBound, extremeUpperBound },
                statistics: {
                    mean: summary.mean,
                    median: summary.median,
                    q1,
                    q3,
                    iqr
                },
                summary: {
                    totalOutliers: outliers.length,
                    mildOutliers,
                    extremeOutliers,
                    outlierPercentage: data.length > 0 ? (outliers.length / data.length) * 100 : 0
                }
            };
        }
        /**
         * Assess overall data quality
         * Provides actionable recommendations for data improvement
         */
        function assessDataQuality(data, options = {}) {
            const { expectedRange, allowedTypes = ['number'], nullTolerance = 0.05, // 5% null tolerance
            duplicateTolerance = 0.1 // 10% duplicate tolerance
             } = options;
            const totalCount = data.length;
            let nullCount = 0;
            let typeValidCount = 0;
            let rangeValidCount = 0;
            const duplicates = new Set();
            const seen = new Set();
            // Analyze each data point
            data.forEach(item => {
                // Check for null/undefined
                if (item == null || (item && item.value == null)) {
                    nullCount++;
                    return;
                }
                // Check data type (check the value property if it exists, otherwise the item itself)
                const valueToCheck = item && typeof item === 'object' && 'value' in item ? item.value : item;
                const itemType = typeof valueToCheck;
                if (allowedTypes.includes(itemType)) {
                    typeValidCount++;
                }
                // Check range (for numbers)
                if (itemType === 'number' && expectedRange) {
                    if (valueToCheck >= expectedRange[0] && valueToCheck <= expectedRange[1]) {
                        rangeValidCount++;
                    }
                }
                else if (!expectedRange) {
                    rangeValidCount++; // No range constraint
                }
                // Check duplicates
                const itemStr = JSON.stringify(valueToCheck);
                if (seen.has(itemStr)) {
                    duplicates.add(itemStr);
                }
                else {
                    seen.add(itemStr);
                }
            });
            // Calculate quality metrics
            const completeness = (totalCount - nullCount) / totalCount;
            const validity = typeValidCount / totalCount;
            const accuracy = rangeValidCount / totalCount;
            // Consistency (coefficient of variation for numeric data)
            const numericData = data.filter(d => typeof d === 'number' && !isNaN(d));
            const cv = numericData.length > 0 ?
                (d3Array.deviation(numericData) || 0) / (d3__namespace.mean(numericData) || 1) : 0;
            const consistency = Math.max(0, 100 - (cv * 100)); // Invert CV for consistency score
            // Outlier analysis for numeric data
            const anomalies = numericData.length > 0 ?
                detectOutliers(numericData) :
                {
                    outliers: [],
                    cleanData: [],
                    method: 'None - No numeric data',
                    threshold: {},
                    statistics: { mean: 0, median: 0, q1: 0, q3: 0, iqr: 0 },
                    summary: { totalOutliers: 0, mildOutliers: 0, extremeOutliers: 0, outlierPercentage: 0 }
                };
            // Generate recommendations
            const recommendations = [];
            if (completeness < (1 - nullTolerance)) {
                recommendations.push(`Improve data completeness: ${nullCount} missing values detected`);
                recommendations.push('Remove or impute missing values');
            }
            if (validity < 0.95) {
                recommendations.push(`Validate data types: ${totalCount - typeValidCount} invalid types found`);
            }
            if (accuracy < 0.90 && expectedRange) {
                recommendations.push(`Check data accuracy: ${totalCount - rangeValidCount} values outside expected range`);
            }
            if (duplicates.size > duplicateTolerance * totalCount) {
                recommendations.push(`Remove duplicates: ${duplicates.size} duplicate values detected`);
            }
            if (anomalies.summary.outlierPercentage > 5) {
                recommendations.push(`Investigate outliers: ${anomalies.summary.totalOutliers} outliers detected (${anomalies.summary.outlierPercentage.toFixed(1)}%)`);
            }
            // Generate issues list
            const issues = [];
            if (nullCount > 0) {
                issues.push(`${nullCount} null or missing values found`);
            }
            if (totalCount - typeValidCount > 0) {
                issues.push(`${totalCount - typeValidCount} invalid data types found`);
            }
            if (expectedRange && totalCount - rangeValidCount > 0) {
                issues.push(`${totalCount - rangeValidCount} values outside expected range`);
            }
            if (duplicates.size > 0) {
                issues.push(`${duplicates.size} duplicate values found`);
            }
            if (anomalies.summary.totalOutliers > 0) {
                issues.push(`${anomalies.summary.totalOutliers} outliers detected`);
            }
            return {
                completeness,
                consistency,
                accuracy,
                validity,
                duplicates: duplicates.size,
                issues,
                anomalies,
                recommendations
            };
        }
        // ========================================================================
        // ADVANCED ANALYSIS FUNCTIONS
        // ========================================================================
        /**
         * Analyze variance contributions in waterfall data
         * Identifies key drivers of variability
         */
        function analyzeVariance(data) {
            const values = data.map(d => d.value);
            const totalVariance = d3Array.variance(values) || 0;
            // Separate positive and negative contributions
            const positiveValues = values.filter(v => v > 0);
            const negativeValues = values.filter(v => v < 0);
            const positiveVariance = positiveValues.length > 0 ? (d3Array.variance(positiveValues) || 0) : 0;
            const negativeVariance = negativeValues.length > 0 ? (d3Array.variance(negativeValues) || 0) : 0;
            // Calculate individual contributions
            const mean = d3__namespace.mean(values) || 0;
            const varianceContributions = data.map(item => {
                const variance = Math.pow(item.value - mean, 2);
                const contribution = totalVariance > 0 ? (variance / totalVariance) * 100 : 0;
                return {
                    label: item.label,
                    value: item.value,
                    variance,
                    contribution
                };
            });
            // Identify significant factors (top contributors)
            const sortedContributions = [...varianceContributions].sort((a, b) => b.contribution - a.contribution);
            const significantFactors = sortedContributions.slice(0, Math.min(5, sortedContributions.length)).map(item => ({
                label: item.label,
                impact: item.contribution > 20 ? 'high' :
                    item.contribution > 10 ? 'medium' : 'low',
                variance: item.variance
            }));
            // Calculate additional statistical measures for ANOVA-style analysis
            const groupMean = d3__namespace.mean(values) || 0;
            // Group data by categories (try to extract category from label, fallback to positive/negative)
            const categoryGroups = new Map();
            data.forEach(item => {
                // Try to extract category from label (e.g., "A1" -> "A", "Category1" -> "Category")
                const category = item.label.match(/^([A-Za-z]+)/)?.[1] ||
                    (item.value > 0 ? 'positive' : 'negative');
                if (!categoryGroups.has(category)) {
                    categoryGroups.set(category, []);
                }
                categoryGroups.get(category).push(item.value);
            });
            const groups = Array.from(categoryGroups.entries()).map(([name, values]) => ({
                name, values
            })).filter(g => g.values.length > 0);
            // Calculate between-group variance
            let betweenGroupVariance = 0;
            if (groups.length > 1) {
                const groupMeans = groups.map(g => d3__namespace.mean(g.values) || 0);
                const groupSizes = groups.map(g => g.values.length);
                values.length;
                betweenGroupVariance = groups.reduce((sum, group, i) => {
                    const groupMeanValue = groupMeans[i];
                    const groupSize = groupSizes[i];
                    return sum + (groupSize * Math.pow(groupMeanValue - groupMean, 2));
                }, 0) / (groups.length - 1);
            }
            // Within-group variance
            const withinGroupVariance = groups.length > 0 ?
                groups.reduce((sum, group) => {
                    const groupVar = d3Array.variance(group.values) || 0;
                    return sum + (groupVar * (group.values.length - 1));
                }, 0) / Math.max(1, values.length - groups.length) : totalVariance;
            // F-statistic for variance analysis
            const fStatistic = betweenGroupVariance > 0 && withinGroupVariance > 0 ?
                betweenGroupVariance / withinGroupVariance : 0;
            // Significance level (simplified p-value approximation)
            const significance = fStatistic > 4 ? 'significant' :
                fStatistic > 2 ? 'moderate' : 'not significant';
            return {
                totalVariance,
                positiveVariance,
                negativeVariance,
                withinGroupVariance,
                betweenGroupVariance,
                fStatistic,
                significance,
                varianceContributions,
                significantFactors
            };
        }
        /**
         * Analyze trend patterns in time series data
         * Provides statistical trend analysis with confidence intervals
         */
        function analyzeTrend(data) {
            if (data.length < 2) {
                // Return empty trend analysis instead of throwing
                return {
                    slope: 0,
                    intercept: 0,
                    correlation: 0,
                    rSquared: 0,
                    direction: 'stable',
                    strength: 'none',
                    confidence: 0,
                    trend: 'stable',
                    projectedValues: [],
                    forecast: []
                };
            }
            const xValues = data.map(d => d.x);
            const yValues = data.map(d => d.y);
            // Calculate linear regression
            const xMean = d3__namespace.mean(xValues) || 0;
            const yMean = d3__namespace.mean(yValues) || 0;
            let numerator = 0;
            let denominator = 0;
            for (let i = 0; i < data.length; i++) {
                const xDiff = xValues[i] - xMean;
                const yDiff = yValues[i] - yMean;
                numerator += xDiff * yDiff;
                denominator += xDiff * xDiff;
            }
            const slope = denominator !== 0 ? numerator / denominator : 0;
            // Calculate correlation coefficient
            const xStd = d3Array.deviation(xValues) || 0;
            const yStd = d3Array.deviation(yValues) || 0;
            const correlation = (xStd * yStd) !== 0 ? numerator / (Math.sqrt(denominator) * yStd * Math.sqrt(data.length - 1)) : 0;
            // Determine trend characteristics
            const direction = slope > 0.01 ? 'increasing' : slope < -0.01 ? 'decreasing' : 'stable';
            const strength = Math.abs(correlation) > 0.7 ? 'strong' :
                Math.abs(correlation) > 0.3 ? 'moderate' : 'weak';
            const confidence = Math.abs(correlation) * 100;
            // Generate projections (simple linear extrapolation)
            const lastX = Math.max(...xValues);
            const projectedValues = Array.from({ length: 3 }, (_, i) => {
                const period = lastX + (i + 1);
                const value = yMean + slope * (period - xMean);
                const standardError = Math.sqrt(d3Array.variance(yValues) || 0) / Math.sqrt(data.length);
                return {
                    period,
                    value,
                    x: period, // alias for backward compatibility
                    y: value, // alias for backward compatibility
                    confidence: {
                        lower: value - (1.96 * standardError),
                        upper: value + (1.96 * standardError)
                    }
                };
            });
            // Calculate intercept and R-squared
            const intercept = yMean - slope * xMean;
            const rSquared = correlation * correlation;
            return {
                slope,
                intercept,
                correlation,
                rSquared,
                direction,
                strength,
                confidence,
                trend: direction, // alias for backward compatibility
                projectedValues,
                forecast: projectedValues // alias for backward compatibility
            };
        }
        // ========================================================================
        // DATA SEARCH AND OPTIMIZATION
        // ========================================================================
        /**
         * Create efficient bisector for data searching
         * Uses D3.js bisector for O(log n) lookups
         */
        function createBisector(accessor) {
            return d3Array.bisector(accessor);
        }
        /**
         * Create fast search function for sorted data
         * Returns the closest data point to a given value
         */
        function createSearch(data, accessor) {
            const bisector = createBisector(accessor);
            const sortedData = [...data].sort((a, b) => d3Array.ascending(accessor(a), accessor(b)));
            return (value) => {
                const index = bisector.left(sortedData, value);
                if (index === 0)
                    return sortedData[0];
                if (index >= sortedData.length)
                    return sortedData[sortedData.length - 1];
                // Return the closest value
                const leftItem = sortedData[index - 1];
                const rightItem = sortedData[index];
                const leftDistance = Math.abs(accessor(leftItem) - value);
                const rightDistance = Math.abs(accessor(rightItem) - value);
                return leftDistance <= rightDistance ? leftItem : rightItem;
            };
        }
        // ========================================================================
        // UTILITY FUNCTIONS
        // ========================================================================
        /**
         * Calculate moving average with configurable window
         */
        function calculateMovingAverage(data, window) {
            if (window <= 0 || window > data.length || data.length === 0) {
                return []; // Return empty array instead of throwing
            }
            const result = [];
            for (let i = 0; i <= data.length - window; i++) {
                const windowData = data.slice(i, i + window);
                const average = d3__namespace.mean(windowData) || 0;
                result.push(average);
            }
            return result;
        }
        /**
         * Calculate exponential smoothing
         */
        function calculateExponentialSmoothing(data, alpha) {
            if (alpha < 0 || alpha > 1 || data.length === 0) {
                return []; // Return empty array instead of throwing
            }
            const result = [];
            let smoothed = data[0];
            result.push(smoothed);
            for (let i = 1; i < data.length; i++) {
                smoothed = alpha * data[i] + (1 - alpha) * smoothed;
                result.push(smoothed);
            }
            return result;
        }
        /**
         * Detect seasonality in time series data
         */
        function detectSeasonality(data, period) {
            if (data.length < period * 2) {
                return false; // Need at least 2 full periods
            }
            // Calculate autocorrelation at the specified period
            const mean = d3__namespace.mean(data) || 0;
            let numerator = 0;
            let denominator = 0;
            for (let i = 0; i < data.length - period; i++) {
                numerator += (data[i] - mean) * (data[i + period] - mean);
            }
            for (let i = 0; i < data.length; i++) {
                denominator += Math.pow(data[i] - mean, 2);
            }
            const autocorrelation = denominator !== 0 ? numerator / denominator : 0;
            // Consider seasonal if autocorrelation is above threshold
            return Math.abs(autocorrelation) > 0.3;
        }
        // ========================================================================
        // RETURN API
        // ========================================================================
        return {
            // Core statistical functions
            calculateSummary,
            detectOutliers,
            assessDataQuality,
            // Advanced analysis
            analyzeVariance,
            analyzeTrend,
            // Data search and optimization
            createBisector,
            createSearch,
            // Utility functions
            calculateMovingAverage,
            calculateExponentialSmoothing,
            detectSeasonality
        };
    }
    // ============================================================================
    // WATERFALL-SPECIFIC STATISTICAL UTILITIES
    // ============================================================================
    /**
     * Analyze waterfall chart statistical patterns
     * Provides insights specific to waterfall financial data
     */
    function analyzeWaterfallStatistics(data, options = {}) {
        const stats = createStatisticalSystem();
        const values = data.map(d => d.value);
        // Calculate core statistics
        const summary = stats.calculateSummary(values);
        const variance = stats.analyzeVariance(data);
        const quality = stats.assessDataQuality(values, {
            expectedRange: options.currency ? [-1e6, 1000000] : undefined
        });
        // Generate business insights
        const insights = [];
        if (variance.significantFactors.length > 0) {
            const topFactor = variance.significantFactors[0];
            insights.push(`${topFactor.label} is the primary driver of variance (${topFactor.impact} impact)`);
        }
        if (summary.standardDeviation > Math.abs(summary.mean)) {
            insights.push('High volatility detected - consider risk management strategies');
        }
        const positiveCount = values.filter(v => v > 0).length;
        const negativeCount = values.filter(v => v < 0).length;
        const ratio = positiveCount / negativeCount;
        if (ratio > 2) {
            insights.push('Predominantly positive contributors - strong growth pattern');
        }
        else if (ratio < 0.5) {
            insights.push('Predominantly negative contributors - potential cost management focus needed');
        }
        if (quality.anomalies.summary.outlierPercentage > 10) {
            insights.push(`${quality.anomalies.summary.totalOutliers} outliers detected - data validation recommended`);
        }
        return {
            summary,
            variance,
            quality,
            insights
        };
    }

    // MintWaterfall Advanced Performance Optimization - TypeScript Version
    // Provides high-performance features for handling large datasets with D3.js optimization
    // ============================================================================
    // SPATIAL INDEXING IMPLEMENTATION
    // ============================================================================
    function createSpatialIndexImpl() {
        let quadTree = d3__namespace.quadtree()
            .x(d => d.x)
            .y(d => d.y);
        function search(x, y, radius = 10) {
            const results = [];
            quadTree.visit((node, x1, y1, x2, y2) => {
                if (!node.length) {
                    // Leaf node
                    const leaf = node;
                    if (leaf.data) {
                        const distance = Math.sqrt(Math.pow(leaf.data.x - x, 2) + Math.pow(leaf.data.y - y, 2));
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
        function findNearest(x, y) {
            return quadTree.find(x, y);
        }
        function add(node) {
            quadTree.add(node);
        }
        function remove(node) {
            quadTree.remove(node);
        }
        function clear() {
            quadTree = d3__namespace.quadtree()
                .x(d => d.x)
                .y(d => d.y);
        }
        function size() {
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
    function createVirtualScrollManagerImpl(config) {
        let currentConfig = { ...config };
        let lastRenderTime = 0;
        let frameCount = 0;
        let frameRate = 60;
        function getVisibleRange(scrollTop) {
            const visibleStart = Math.floor(scrollTop / currentConfig.itemHeight);
            const visibleEnd = Math.ceil((scrollTop + currentConfig.containerHeight) / currentConfig.itemHeight);
            // Add overscan
            const start = Math.max(0, visibleStart - currentConfig.overscan);
            const end = visibleEnd + currentConfig.overscan;
            return { start, end };
        }
        function getVirtualizedData(data, scrollTop) {
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
        function updateConfig(newConfig) {
            currentConfig = { ...currentConfig, ...newConfig };
        }
        function destroy() {
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
    function createCanvasRendererImpl(container) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        container.appendChild(canvas);
        function render(data, scales) {
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
        function clear() {
            context.clearRect(0, 0, canvas.width, canvas.height);
        }
        function getCanvas() {
            return canvas;
        }
        function setDimensions(width, height) {
            canvas.width = width;
            canvas.height = height;
            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;
        }
        function enableHighDPI() {
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
    function createPerformanceMonitorImpl() {
        const timings = new Map();
        const completed = new Map();
        let frameCount = 0;
        let frameStartTime = performance.now();
        function startTiming(label) {
            timings.set(label, performance.now());
        }
        function endTiming(label) {
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
            completed.get(label).push(duration);
            // Keep only last 100 measurements
            const measurements = completed.get(label);
            if (measurements.length > 100) {
                measurements.shift();
            }
            timings.delete(label);
            return duration;
        }
        function getMetrics() {
            const renderTimes = completed.get('render') || [];
            const processingTimes = completed.get('dataProcessing') || [];
            return {
                renderTime: renderTimes.length > 0 ? d3__namespace.mean(renderTimes) || 0 : 0,
                dataProcessingTime: processingTimes.length > 0 ? d3__namespace.mean(processingTimes) || 0 : 0,
                memoryUsage: getMemoryUsage(),
                frameRate: frameCount > 0 ? 1000 / ((performance.now() - frameStartTime) / frameCount) : 0,
                itemsRendered: 0, // To be set by caller
                totalItems: 0, // To be set by caller
                virtualizationActive: false // To be set by caller
            };
        }
        function trackFrameRate() {
            frameCount++;
            if (frameCount === 1) {
                frameStartTime = performance.now();
            }
        }
        function generateReport() {
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
    function getMemoryUsage() {
        if ('memory' in performance) {
            const memory = performance.memory;
            return memory.usedJSHeapSize / (1024 * 1024); // Convert to MB
        }
        return 0; // Memory API not available
    }
    // ============================================================================
    // DATA OPTIMIZATION FUNCTIONS
    // ============================================================================
    function optimizeDataForRenderingImpl(data, maxItems = 1000) {
        if (data.length <= maxItems) {
            return data;
        }
        // Use uniform sampling to reduce data points while maintaining distribution
        const step = Math.ceil(data.length / maxItems);
        const optimized = [];
        for (let i = 0; i < data.length; i += step) {
            optimized.push(data[i]);
        }
        return optimized;
    }
    function createDataSamplerImpl(strategy) {
        switch (strategy) {
            case 'uniform':
                return (data, count) => {
                    if (count >= data.length)
                        return data;
                    const step = data.length / count;
                    const result = [];
                    for (let i = 0; i < count; i++) {
                        const index = Math.floor(i * step);
                        result.push(data[index]);
                    }
                    return result;
                };
            case 'random':
                return (data, count) => {
                    if (count >= data.length)
                        return data;
                    const shuffled = [...data].sort(() => 0.5 - Math.random());
                    return shuffled.slice(0, count);
                };
            case 'importance':
                return (data, count) => {
                    if (count >= data.length)
                        return data;
                    // For importance sampling, we'd need a way to assess importance
                    // For now, take first and last items plus uniform sampling in between
                    const result = [data[0]]; // Always include first
                    if (count > 2) {
                        const middle = createDataSamplerImpl('uniform')(data.slice(1, -1), count - 2);
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
    function createAdvancedPerformanceSystem() {
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
    function createWaterfallSpatialIndex(data, xScale, yScale) {
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
    function createVirtualWaterfallRenderer(container, config) {
        const system = createAdvancedPerformanceSystem();
        const virtualScrollManager = system.createVirtualScrollManager(config);
        const performanceMonitor = system.createPerformanceMonitor();
        function render(data, scrollTop) {
            performanceMonitor.startTiming('render');
            virtualScrollManager.getVirtualizedData(data, scrollTop);
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

    // MintWaterfall Advanced Data Manipulation Utilities
    // Enhanced D3.js data manipulation capabilities for comprehensive waterfall analysis
    // ============================================================================
    // SPECIALIZED WATERFALL UTILITIES
    // ============================================================================
    /**
     * Create sequence analysis specifically for waterfall data
     */
    function createWaterfallSequenceAnalyzer(data) {
        const processor = createAdvancedDataProcessor();
        const flowAnalysis = processor.analyzeSequence(data);
        // Calculate cumulative flow
        const cumulativeFlow = [];
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
            .filter((seq) => seq.magnitude === 'large')
            .map((seq) => `${seq.from} → ${seq.to}`);
        // Generate optimization suggestions
        const optimizationSuggestions = processor.suggestDataOptimizations(data);
        return {
            flowAnalysis,
            cumulativeFlow,
            criticalPaths,
            optimizationSuggestions
        };
        function extractValue(item) {
            if (typeof item === 'number')
                return item;
            if (item.value !== undefined)
                return item.value;
            if (item.stacks && Array.isArray(item.stacks)) {
                return item.stacks.reduce((sum, stack) => sum + (stack.value || 0), 0);
            }
            return 0;
        }
    }
    /**
     * Create optimized tick generator for waterfall charts
     */
    function createWaterfallTickGenerator(domain, dataPoints) {
        const processor = createAdvancedDataProcessor();
        // Generate base ticks
        const ticks = processor.generateCustomTicks(domain, {
            count: 8,
            nice: true,
            includeZero: true,
            threshold: Math.abs(domain[1] - domain[0]) / 100
        });
        // Generate labels
        const labels = ticks.map((tick) => {
            if (tick === 0)
                return '0';
            if (Math.abs(tick) >= 1000000)
                return `${(tick / 1000000).toFixed(1)}M`;
            if (Math.abs(tick) >= 1000)
                return `${(tick / 1000).toFixed(1)}K`;
            return tick.toFixed(0);
        });
        // Identify key markers (data points that align with ticks)
        const keyMarkers = ticks.filter((tick) => {
            return dataPoints.some(d => Math.abs(extractValue(d) - tick) < Math.abs(domain[1] - domain[0]) / 50);
        });
        return { ticks, labels, keyMarkers };
        function extractValue(item) {
            if (typeof item === 'number')
                return item;
            if (item.value !== undefined)
                return item.value;
            if (item.stacks && Array.isArray(item.stacks)) {
                return item.stacks.reduce((sum, stack) => sum + (stack.value || 0), 0);
            }
            return 0;
        }
    }
    // ============================================================================
    // MISSING ADVANCED DATA PROCESSOR FUNCTIONS
    // ============================================================================
    /**
     * Creates an advanced data processor with D3.js data manipulation functions
     */
    function createAdvancedDataProcessor() {
        // Group data by key using d3.group
        function groupBy(data, accessor) {
            if (!data || !Array.isArray(data) || !accessor) {
                return new Map();
            }
            return d3Array.group(data, accessor);
        }
        // Rollup data with reducer using d3.rollup
        function rollupBy(data, reducer, accessor) {
            if (!data || !Array.isArray(data) || !reducer || !accessor) {
                return new Map();
            }
            return d3Array.rollup(data, reducer, accessor);
        }
        // Flat rollup using d3.flatRollup
        function flatRollupBy(data, reducer, accessor) {
            if (!data || !Array.isArray(data) || !reducer || !accessor) {
                return [];
            }
            return d3Array.flatRollup(data, reducer, accessor);
        }
        // Cross tabulate two arrays using d3.cross
        function crossTabulate(a, b, reducer) {
            if (!Array.isArray(a) || !Array.isArray(b)) {
                return [];
            }
            if (reducer) {
                return d3Array.cross(a, b, reducer);
            }
            else {
                return d3Array.cross(a, b);
            }
        }
        // Index data by key using d3.index
        function indexBy(data, accessor) {
            if (!data || !Array.isArray(data) || !accessor) {
                return new Map();
            }
            try {
                return d3Array.index(data, accessor);
            }
            catch (error) {
                // Handle duplicate keys gracefully by creating a manual index
                const result = new Map();
                data.forEach(item => {
                    const key = accessor(item);
                    if (!result.has(key)) {
                        result.set(key, item);
                    }
                });
                return result;
            }
        }
        // Aggregate data by time periods
        function aggregateByTime(data, timeAccessor, granularity, reducer) {
            if (!data || !Array.isArray(data) || !timeAccessor || !reducer) {
                return [];
            }
            const timeGroups = d3Array.group(data, (d) => {
                const date = timeAccessor(d);
                if (!date || !(date instanceof Date))
                    return 'invalid';
                switch (granularity) {
                    case 'day':
                        return date.toISOString().split('T')[0];
                    case 'week':
                        const week = new Date(date);
                        week.setDate(date.getDate() - date.getDay());
                        return week.toISOString().split('T')[0];
                    case 'month':
                        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                    case 'year':
                        return String(date.getFullYear());
                    default:
                        return date.toISOString().split('T')[0];
                }
            });
            return Array.from(timeGroups.entries()).map(([period, values]) => ({
                period,
                data: reducer(values),
                count: values.length
            }));
        }
        // Create multi-dimensional waterfall
        function createMultiDimensionalWaterfall(multiData, options) {
            const result = [];
            const { aggregationMethod = 'sum' } = options;
            if (!multiData || typeof multiData !== 'object') {
                return result;
            }
            const regions = Object.keys(multiData);
            let grandTotal = 0;
            for (const region of regions) {
                const data = multiData[region];
                if (!Array.isArray(data))
                    continue;
                let regionTotal = 0;
                for (const item of data) {
                    let value = 0;
                    if (item.value !== undefined) {
                        value = item.value;
                    }
                    else if (item.stacks && Array.isArray(item.stacks)) {
                        value = item.stacks.reduce((sum, stack) => sum + (stack.value || 0), 0);
                    }
                    result.push({
                        ...item,
                        region,
                        value,
                        label: `${region}: ${item.label}`
                    });
                    switch (aggregationMethod) {
                        case 'sum':
                            regionTotal += value;
                            break;
                        case 'average':
                            regionTotal += value;
                            break;
                        case 'count':
                            regionTotal += 1;
                            break;
                        case 'max':
                            regionTotal = Math.max(regionTotal, value);
                            break;
                        case 'min':
                            regionTotal = regionTotal === 0 ? value : Math.min(regionTotal, value);
                            break;
                    }
                }
                if (options.includeRegionalTotals) {
                    result.push({
                        label: `${region} Total`,
                        value: aggregationMethod === 'average' ? regionTotal / data.length : regionTotal,
                        region,
                        isRegionalTotal: true
                    });
                }
                grandTotal += regionTotal;
            }
            if (options.includeGrandTotal) {
                result.push({
                    label: 'Grand Total',
                    value: grandTotal,
                    isGrandTotal: true
                });
            }
            return result;
        }
        // Aggregate waterfall by period with additional metrics
        function aggregateWaterfallByPeriod(data, periodField, options) {
            if (!data || !Array.isArray(data)) {
                return [];
            }
            const periodGroups = d3Array.group(data, (d) => d[periodField] || 'unknown');
            const result = Array.from(periodGroups.entries()).map(([period, items]) => {
                const total = items.reduce((sum, item) => {
                    if (item.value !== undefined)
                        return sum + item.value;
                    if (item.stacks && Array.isArray(item.stacks)) {
                        return sum + item.stacks.reduce((s, stack) => s + (stack.value || 0), 0);
                    }
                    return sum;
                }, 0);
                return {
                    period,
                    items,
                    total,
                    count: items.length,
                    average: total / items.length,
                    movingAverage: 0, // Will be calculated if requested
                    growthRate: 0 // Will be calculated if requested
                };
            });
            // Add moving average if requested
            if (options.includeMovingAverage) {
                const window = options.movingAverageWindow || 3;
                result.forEach((item, index) => {
                    const start = Math.max(0, index - Math.floor(window / 2));
                    const end = Math.min(result.length, start + window);
                    const windowData = result.slice(start, end);
                    item.movingAverage = windowData.reduce((sum, w) => sum + w.total, 0) / windowData.length;
                });
            }
            // Add growth rates if requested
            if (options.calculateGrowthRates) {
                result.forEach((item, index) => {
                    if (index > 0) {
                        const prev = result[index - 1];
                        item.growthRate = prev.total !== 0 ? (item.total - prev.total) / prev.total : 0;
                    }
                });
            }
            return result;
        }
        // Create breakdown waterfall with sub-items
        function createBreakdownWaterfall(data, breakdownField, options) {
            if (!data || !Array.isArray(data)) {
                return [];
            }
            const result = [];
            for (const item of data) {
                const breakdowns = item[breakdownField];
                if (breakdowns && Array.isArray(breakdowns)) {
                    // Add main item
                    if (options.maintainOriginalStructure) {
                        result.push({ ...item, isMainItem: true });
                    }
                    // Add breakdown items
                    let subtotal = 0;
                    breakdowns.forEach((breakdown, index) => {
                        const breakdownItem = {
                            ...breakdown,
                            parentLabel: item.label,
                            isBreakdown: true,
                            breakdownIndex: index,
                            color: options.colorByBreakdown ? `hsl(${index * 360 / breakdowns.length}, 70%, 60%)` : breakdown.color
                        };
                        result.push(breakdownItem);
                        subtotal += breakdown.value || 0;
                    });
                    // Add subtotal if requested
                    if (options.includeSubtotals && breakdowns.length > 1) {
                        result.push({
                            label: `${item.label} Subtotal`,
                            value: subtotal,
                            parentLabel: item.label,
                            isSubtotal: true
                        });
                    }
                }
                else {
                    // No breakdown data, add as-is
                    result.push({ ...item, hasBreakdown: false });
                }
            }
            return result;
        }
        // Additional methods needed by existing code
        function analyzeSequence(data) {
            // Simplified implementation for compatibility
            if (!Array.isArray(data) || data.length < 2) {
                return [];
            }
            return data.slice(1).map((item, index) => {
                const prev = data[index];
                const current = item;
                const prevValue = extractValue(prev);
                const currentValue = extractValue(current);
                const change = currentValue - prevValue;
                return {
                    index,
                    from: prev.label || `Item ${index}`,
                    to: current.label || `Item ${index + 1}`,
                    fromValue: prevValue,
                    toValue: currentValue,
                    change,
                    percentChange: prevValue !== 0 ? (change / prevValue) * 100 : 0,
                    direction: change > 0 ? 'increase' : change < 0 ? 'decrease' : 'stable',
                    magnitude: Math.abs(change) > 1000 ? 'large' : Math.abs(change) > 100 ? 'medium' : 'small'
                };
            });
        }
        function suggestDataOptimizations(data) {
            // Simplified implementation for compatibility
            const suggestions = [];
            if (!Array.isArray(data) || data.length === 0) {
                return suggestions;
            }
            if (data.length > 20) {
                suggestions.push({
                    type: 'aggregation',
                    priority: 'medium',
                    description: 'Consider grouping similar items for better readability',
                    impact: 'Reduces visual clutter'
                });
            }
            return suggestions;
        }
        function generateCustomTicks(domain, options) {
            // Simplified implementation using d3.ticks
            const tickCount = options.targetTickCount || 8;
            return d3__namespace.ticks(domain[0], domain[1], tickCount);
        }
        function extractValue(item) {
            if (typeof item === 'number')
                return item;
            if (item.value !== undefined)
                return item.value;
            if (item.stacks && Array.isArray(item.stacks)) {
                return item.stacks.reduce((sum, stack) => sum + (stack.value || 0), 0);
            }
            return 0;
        }
        // Return the processor interface
        return {
            groupBy,
            rollupBy,
            flatRollupBy,
            crossTabulate,
            indexBy,
            aggregateByTime,
            createMultiDimensionalWaterfall,
            aggregateWaterfallByPeriod,
            createBreakdownWaterfall,
            analyzeSequence,
            suggestDataOptimizations,
            generateCustomTicks
        };
    }

    // MintWaterfall Advanced Interactions
    // Sophisticated D3.js interaction capabilities for enhanced waterfall analysis
    // ============================================================================
    // ADVANCED INTERACTION SYSTEM IMPLEMENTATION
    // ============================================================================
    function createAdvancedInteractionSystem(container, xScale, yScale) {
        // Internal state
        let dragBehavior = null;
        let enhancedHoverEnabled = false;
        let currentSimulation = null;
        let currentData = [];
        let eventListeners = new Map();
        // ========================================================================
        // DRAG FUNCTIONALITY (d3.drag)
        // ========================================================================
        function enableDrag(config) {
            if (!config || !config.enabled) {
                disableDrag();
                return;
            }
            // Create drag behavior
            dragBehavior = d3Drag.drag()
                .on('start', (event, d) => {
                // Visual feedback on drag start
                d3__namespace.select(event.sourceEvent.target)
                    .raise()
                    .attr('stroke', '#ff6b6b')
                    .attr('stroke-width', 2);
                if (config.onDragStart) {
                    config.onDragStart(event, d);
                }
                trigger('dragStart', { event, data: d });
            })
                .on('drag', (event, d) => {
                const bar = d3__namespace.select(event.sourceEvent.target);
                let newValue = d.value || 0;
                // Handle axis constraints
                if (config.axis === 'vertical' || config.axis === 'both') {
                    const newY = event.y;
                    newValue = yScale.invert(newY);
                    // Apply constraints
                    if (config.constraints) {
                        const { minValue, maxValue, snapToGrid, gridSize } = config.constraints;
                        if (minValue !== undefined)
                            newValue = Math.max(minValue, newValue);
                        if (maxValue !== undefined)
                            newValue = Math.min(maxValue, newValue);
                        if (snapToGrid && gridSize) {
                            newValue = Math.round(newValue / gridSize) * gridSize;
                        }
                    }
                    // Update visual position
                    const barHeight = Math.abs(yScale(0) - yScale(newValue));
                    const barY = newValue >= 0 ? yScale(newValue) : yScale(0);
                    bar.attr('y', barY)
                        .attr('height', barHeight);
                    // Update data
                    d.value = newValue;
                    if (d.stacks && d.stacks.length > 0) {
                        d.stacks[0].value = newValue;
                    }
                }
                // Handle horizontal movement (for reordering)
                if (config.axis === 'horizontal' || config.axis === 'both') {
                    const newX = event.x;
                    // Implementation for horizontal dragging/reordering
                    const barWidth = parseFloat(bar.attr('width') || '0');
                    bar.attr('transform', `translate(${newX - barWidth / 2}, 0)`);
                }
                if (config.onDrag) {
                    config.onDrag(event, d);
                }
                trigger('drag', { event, data: d, newValue });
            })
                .on('end', (event, d) => {
                // Remove visual feedback
                d3__namespace.select(event.sourceEvent.target)
                    .attr('stroke', null)
                    .attr('stroke-width', null);
                if (config.onDragEnd) {
                    config.onDragEnd(event, d);
                }
                trigger('dragEnd', { event, data: d });
            });
            // Apply drag behavior to all bars
            container.selectAll('.bar')
                .call(dragBehavior);
            trigger('dragEnabled', config);
        }
        function disableDrag() {
            if (dragBehavior) {
                container.selectAll('.bar')
                    .on('.drag', null);
                dragBehavior = null;
                trigger('dragDisabled');
            }
        }
        function updateDragConstraints(constraints) {
            // Constraints are checked during drag events
            trigger('dragConstraintsUpdated', constraints);
        }
        // ========================================================================
        // ENHANCED HOVER DETECTION (Simplified approach)
        // ========================================================================
        function enableEnhancedHover(config) {
            if (!config || !config.enabled || currentData.length === 0) {
                disableEnhancedHover();
                return;
            }
            enhancedHoverEnabled = true;
            // Create enhanced hover zones around bars
            const hoverGroup = container.selectAll('.enhanced-hover-group')
                .data([0]);
            const hoverGroupEnter = hoverGroup.enter()
                .append('g')
                .attr('class', 'enhanced-hover-group');
            const hoverGroupMerged = hoverGroupEnter.merge(hoverGroup);
            // Add enhanced hover zones
            const zones = hoverGroupMerged.selectAll('.hover-zone')
                .data(currentData);
            zones.enter()
                .append('rect')
                .attr('class', 'hover-zone')
                .merge(zones)
                .attr('x', d => getBarCenterX(d) - getBarWidth() * 0.75)
                .attr('y', d => Math.min(getBarCenterY(d), yScale(0)) - 10)
                .attr('width', d => getBarWidth() * 1.5)
                .attr('height', d => Math.abs(yScale(0) - getBarCenterY(d)) + 20)
                .style('fill', 'transparent')
                .style('pointer-events', 'all')
                .on('mouseenter', function (event, d) {
                highlightBar(d);
                if (config.onCellEnter) {
                    config.onCellEnter(event, d);
                }
                trigger('enhancedHoverEnter', { event, data: d });
            })
                .on('mouseleave', function (event, d) {
                unhighlightBar(d);
                if (config.onCellLeave) {
                    config.onCellLeave(event, d);
                }
                trigger('enhancedHoverLeave', { event, data: d });
            })
                .on('click', function (event, d) {
                if (config.onCellClick) {
                    config.onCellClick(event, d);
                }
                trigger('enhancedHoverClick', { event, data: d });
            });
            zones.exit().remove();
            trigger('enhancedHoverEnabled', config);
        }
        function disableEnhancedHover() {
            try {
                // Only attempt to remove elements if container has proper D3 methods
                if (container && container.selectAll && typeof container.selectAll === 'function') {
                    const selection = container.selectAll('.enhanced-hover-group');
                    if (selection && selection.remove && typeof selection.remove === 'function') {
                        selection.remove();
                    }
                }
            }
            catch (error) {
                // Silently handle any DOM manipulation errors in test environment
            }
            enhancedHoverEnabled = false;
            trigger('enhancedHoverDisabled');
        }
        function updateHoverExtent(extent) {
            if (enhancedHoverEnabled) {
                // Re-enable with current data
                const currentConfig = { enabled: true, extent };
                enableEnhancedHover(currentConfig);
            }
        }
        // ========================================================================
        // FORCE SIMULATION FOR DYNAMIC LAYOUTS (d3.forceSimulation)
        // ========================================================================
        function startForceSimulation(config) {
            if (!config || !config.enabled || currentData.length === 0) {
                return d3Force.forceSimulation([]);
            }
            // Stop any existing simulation
            stopForceSimulation();
            // Create new simulation
            currentSimulation = d3Force.forceSimulation(currentData);
            // Add forces based on configuration
            if (config.forces.collision) {
                currentSimulation.force('collision', d3Force.forceCollide()
                    .radius(d => getBarWidth() / 2 + 5)
                    .strength(config.strength.collision || 0.7));
            }
            if (config.forces.centering) {
                const centerX = (xScale.range()[0] + xScale.range()[1]) / 2;
                const centerY = (yScale.range()[0] + yScale.range()[1]) / 2;
                currentSimulation.force('center', d3Force.forceCenter(centerX, centerY)
                    .strength(config.strength.centering || 0.1));
            }
            if (config.forces.positioning) {
                currentSimulation.force('x', d3__namespace.forceX(d => getBarCenterX(d))
                    .strength(config.strength.positioning || 0.5));
                currentSimulation.force('y', d3__namespace.forceY(d => getBarCenterY(d))
                    .strength(config.strength.positioning || 0.5));
            }
            if (config.forces.links && currentData.length > 1) {
                // Create links between consecutive bars
                const links = currentData.slice(1).map((d, i) => ({
                    source: currentData[i],
                    target: d
                }));
                currentSimulation.force('link', d3__namespace.forceLink(links)
                    .distance(50)
                    .strength(config.strength.links || 0.3));
            }
            // Set up tick handler
            currentSimulation.on('tick', () => {
                updateBarPositions();
                if (config.onTick && currentSimulation) {
                    config.onTick(currentSimulation);
                }
                trigger('forceTick', currentSimulation);
            });
            // Set up end handler
            currentSimulation.on('end', () => {
                if (config.onEnd && currentSimulation) {
                    config.onEnd(currentSimulation);
                }
                trigger('forceEnd', currentSimulation);
            });
            // Set alpha decay for animation duration
            if (config.duration) {
                const targetAlpha = 0.001;
                const decay = 1 - Math.pow(targetAlpha, 1 / config.duration);
                currentSimulation.alphaDecay(decay);
            }
            trigger('forceSimulationStarted', config);
            return currentSimulation;
        }
        function stopForceSimulation() {
            if (currentSimulation) {
                currentSimulation.stop();
                currentSimulation = null;
                trigger('forceSimulationStopped');
            }
        }
        function updateForces(forces) {
            if (currentSimulation) {
                // Update or remove forces based on configuration
                if (!forces.collision)
                    currentSimulation.force('collision', null);
                if (!forces.centering)
                    currentSimulation.force('center', null);
                if (!forces.positioning) {
                    currentSimulation.force('x', null);
                    currentSimulation.force('y', null);
                }
                if (!forces.links)
                    currentSimulation.force('link', null);
                currentSimulation.alpha(1).restart();
                trigger('forcesUpdated', forces);
            }
        }
        // ========================================================================
        // INTERACTION MODE MANAGEMENT
        // ========================================================================
        function setInteractionMode(mode) {
            // Disable all interactions first
            disableDrag();
            disableEnhancedHover();
            stopForceSimulation();
            const xRange = xScale.range() || [0, 800];
            const yRange = yScale.range() || [400, 0];
            switch (mode) {
                case 'drag':
                    enableDrag({
                        enabled: true,
                        axis: 'vertical',
                        constraints: { snapToGrid: true, gridSize: 10 }
                    });
                    break;
                case 'voronoi':
                    enableEnhancedHover({
                        enabled: true,
                        extent: [[0, 0], [xRange[1], yRange[0]]]
                    });
                    break;
                case 'force':
                    startForceSimulation({
                        enabled: true,
                        forces: { collision: true, positioning: true },
                        strength: { collision: 0.7, positioning: 0.5 },
                        duration: 1000
                    });
                    break;
                case 'combined':
                    enableEnhancedHover({
                        enabled: true,
                        extent: [[0, 0], [xRange[1], yRange[0]]]
                    });
                    enableDrag({
                        enabled: true,
                        axis: 'vertical'
                    });
                    break;
            }
            trigger('interactionModeChanged', mode);
        }
        function getActiveInteractions() {
            const active = [];
            if (dragBehavior)
                active.push('drag');
            if (enhancedHoverEnabled)
                active.push('hover');
            if (currentSimulation)
                active.push('force');
            return active;
        }
        // ========================================================================
        // EVENT MANAGEMENT
        // ========================================================================
        function on(event, callback) {
            if (!eventListeners.has(event)) {
                eventListeners.set(event, []);
            }
            eventListeners.get(event).push(callback);
        }
        function off(event) {
            eventListeners.delete(event);
        }
        function trigger(event, data) {
            const callbacks = eventListeners.get(event);
            if (callbacks) {
                callbacks.forEach(callback => callback(data));
            }
        }
        // ========================================================================
        // UTILITY FUNCTIONS
        // ========================================================================
        function getBarCenterX(d) {
            const scale = xScale; // Type assertion for compatibility
            if (scale.bandwidth) {
                // Band scale
                return (scale(d.label) || 0) + scale.bandwidth() / 2;
            }
            else {
                // Linear scale - assume equal spacing
                return scale(parseFloat(d.label) || 0);
            }
        }
        function getBarCenterY(d) {
            const value = d.value || (d.stacks && d.stacks[0] ? d.stacks[0].value : 0);
            return yScale(value / 2);
        }
        function getBarWidth(d) {
            const scale = xScale; // Type assertion for compatibility
            if (scale.bandwidth) {
                return scale.bandwidth();
            }
            return 40; // Default width for linear scales
        }
        function highlightBar(data) {
            container.selectAll('.bar')
                .filter((d) => d === data)
                .transition()
                .duration(150)
                .attr('opacity', 0.8)
                .attr('stroke', '#ff6b6b')
                .attr('stroke-width', 2);
        }
        function unhighlightBar(data) {
            container.selectAll('.bar')
                .filter((d) => d === data)
                .transition()
                .duration(150)
                .attr('opacity', 1)
                .attr('stroke', null)
                .attr('stroke-width', null);
        }
        function updateBarPositions() {
            if (!d3Force.forceSimulation)
                return;
            container.selectAll('.bar')
                .data(currentData)
                .attr('transform', (d) => {
                const x = d.x || getBarCenterX(d);
                const y = d.y || getBarCenterY(d);
                return `translate(${x - getBarWidth() / 2}, ${y})`;
            });
        }
        // ========================================================================
        // PUBLIC API
        // ========================================================================
        // Method to update data for interactions
        function updateData(data) {
            currentData = data;
            // Update active interactions with new data
            if (enhancedHoverEnabled) {
                const config = { enabled: true, extent: [[0, 0], [800, 600]] };
                enableEnhancedHover(config);
            }
            if (currentSimulation) {
                currentSimulation.nodes(data);
                currentSimulation.alpha(1).restart();
            }
        }
        return {
            enableDrag,
            disableDrag,
            updateDragConstraints,
            enableEnhancedHover,
            disableEnhancedHover,
            updateHoverExtent,
            startForceSimulation,
            stopForceSimulation,
            updateForces,
            setInteractionMode,
            getActiveInteractions,
            updateData,
            on,
            off,
            trigger
        };
    }
    // ============================================================================
    // SPECIALIZED WATERFALL INTERACTION UTILITIES
    // ============================================================================
    /**
     * Create drag behavior specifically optimized for waterfall charts
     */
    function createWaterfallDragBehavior(onValueChange, constraints) {
        return {
            enabled: true,
            axis: 'vertical',
            constraints: {
                minValue: constraints?.min,
                maxValue: constraints?.max,
                snapToGrid: true,
                gridSize: 100 // Snap to hundreds
            },
            onDrag: (event, data) => {
                if (onValueChange) {
                    onValueChange(data, data.value);
                }
            }
        };
    }
    /**
     * Create voronoi configuration optimized for waterfall hover detection
     */
    function createWaterfallVoronoiConfig(chartWidth, chartHeight, margin) {
        return {
            enabled: true,
            extent: [
                [margin.left, margin.top],
                [chartWidth - margin.right, chartHeight - margin.bottom]
            ],
            showCells: false,
            cellOpacity: 0.1
        };
    }
    /**
     * Create force simulation for animated waterfall reordering
     */
    function createWaterfallForceConfig(animationDuration = 1000) {
        return {
            enabled: true,
            forces: {
                collision: true,
                positioning: true,
                centering: false,
                links: false
            },
            strength: {
                collision: 0.8,
                positioning: 0.6
            },
            duration: animationDuration
        };
    }

    // MintWaterfall Hierarchical Layout Extensions
    // Advanced D3.js hierarchical layouts for multi-dimensional waterfall analysis
    // ============================================================================
    // HIERARCHICAL LAYOUT SYSTEM IMPLEMENTATION
    // ============================================================================
    function createHierarchicalLayoutSystem() {
        // ========================================================================
        // TREEMAP LAYOUT (d3.treemap)
        // ========================================================================
        function createTreemapLayout(data, config) {
            // Create hierarchy
            const root = d3__namespace.hierarchy(data)
                .sum(d => d.value || 0)
                .sort((a, b) => (b.value || 0) - (a.value || 0));
            // Create treemap layout
            const treemap = d3__namespace.treemap()
                .size([config.width, config.height])
                .padding(config.padding)
                .tile(config.tile)
                .round(config.round);
            return treemap(root);
        }
        function renderTreemap(container, layout, config) {
            const colorScale = config.colorScale || d3__namespace.scaleOrdinal(d3__namespace.schemeCategory10);
            // Create treemap group
            const treemapGroup = container.selectAll('.treemap-group')
                .data([0]);
            const treemapGroupEnter = treemapGroup.enter()
                .append('g')
                .attr('class', 'treemap-group');
            const treemapGroupMerged = treemapGroupEnter.merge(treemapGroup);
            // Get leaf nodes for rendering
            const leaves = layout.leaves();
            // Create rectangles for leaf nodes
            const cells = treemapGroupMerged.selectAll('.treemap-cell')
                .data(leaves, (d) => d.data.name);
            const cellsEnter = cells.enter()
                .append('g')
                .attr('class', 'treemap-cell');
            // Add rectangles
            cellsEnter.append('rect')
                .attr('class', 'treemap-rect');
            // Add labels
            cellsEnter.append('text')
                .attr('class', 'treemap-label');
            // Add value labels
            cellsEnter.append('text')
                .attr('class', 'treemap-value');
            const cellsMerged = cellsEnter.merge(cells);
            // Update rectangles
            cellsMerged.select('.treemap-rect')
                .transition()
                .duration(750)
                .attr('x', d => d.x0)
                .attr('y', d => d.y0)
                .attr('width', d => d.x1 - d.x0)
                .attr('height', d => d.y1 - d.y0)
                .attr('fill', d => colorScale(d.data.category || d.data.name))
                .attr('stroke', '#fff')
                .attr('stroke-width', 1)
                .attr('opacity', 0.8);
            // Update labels
            cellsMerged.select('.treemap-label')
                .attr('x', d => (d.x0 + d.x1) / 2)
                .attr('y', d => (d.y0 + d.y1) / 2 - 8)
                .attr('text-anchor', 'middle')
                .attr('font-size', d => Math.min(12, (d.x1 - d.x0) / 8))
                .attr('fill', '#333')
                .text(d => d.data.name);
            // Update value labels
            cellsMerged.select('.treemap-value')
                .attr('x', d => (d.x0 + d.x1) / 2)
                .attr('y', d => (d.y0 + d.y1) / 2 + 8)
                .attr('text-anchor', 'middle')
                .attr('font-size', d => Math.min(10, (d.x1 - d.x0) / 10))
                .attr('fill', '#666')
                .text(d => formatValue(d.value || 0));
            // Add interaction
            cellsMerged
                .style('cursor', 'pointer')
                .on('click', (event, d) => {
                if (config.onNodeClick) {
                    config.onNodeClick(d);
                }
            })
                .on('mouseenter', (event, d) => {
                d3__namespace.select(event.currentTarget).select('.treemap-rect')
                    .attr('opacity', 1)
                    .attr('stroke-width', 2);
                if (config.onNodeHover) {
                    config.onNodeHover(d);
                }
            })
                .on('mouseleave', (event, d) => {
                d3__namespace.select(event.currentTarget).select('.treemap-rect')
                    .attr('opacity', 0.8)
                    .attr('stroke-width', 1);
            });
            cells.exit()
                .transition()
                .duration(300)
                .attr('opacity', 0)
                .remove();
        }
        // ========================================================================
        // PARTITION LAYOUT (d3.partition)
        // ========================================================================
        function createPartitionLayout(data, config) {
            // Create hierarchy
            const root = d3__namespace.hierarchy(data)
                .sum(d => d.value || 0)
                .sort((a, b) => (b.value || 0) - (a.value || 0));
            // Create partition layout
            const partition = d3__namespace.partition()
                .size([2 * Math.PI, Math.min(config.width, config.height) / 2]);
            return partition(root);
        }
        function renderPartition(container, layout, config) {
            const colorScale = config.colorScale || d3__namespace.scaleOrdinal(d3__namespace.schemeCategory10);
            const radius = Math.min(config.width, config.height) / 2;
            const innerRadius = config.innerRadius || 0;
            // Create partition group
            const partitionGroup = container.selectAll('.partition-group')
                .data([0]);
            const partitionGroupEnter = partitionGroup.enter()
                .append('g')
                .attr('class', 'partition-group')
                .attr('transform', `translate(${config.width / 2}, ${config.height / 2})`);
            const partitionGroupMerged = partitionGroupEnter.merge(partitionGroup);
            if (config.type === 'sunburst') {
                renderSunburst(partitionGroupMerged, layout, colorScale, radius, innerRadius, config);
            }
            else {
                renderIcicle(partitionGroupMerged, layout, colorScale, config);
            }
        }
        function renderSunburst(container, layout, colorScale, radius, innerRadius, config) {
            const arc = d3__namespace.arc()
                .startAngle(d => d.x0)
                .endAngle(d => d.x1)
                .innerRadius(d => Math.sqrt(d.y0) * radius / Math.sqrt(layout.y1))
                .outerRadius(d => Math.sqrt(d.y1) * radius / Math.sqrt(layout.y1));
            const descendants = layout.descendants().filter(d => d.depth > 0);
            const paths = container.selectAll('.partition-arc')
                .data(descendants, (d) => d.data.name);
            const pathsEnter = paths.enter()
                .append('path')
                .attr('class', 'partition-arc')
                .attr('fill', d => colorScale(d.data.category || d.data.name))
                .attr('stroke', '#fff')
                .attr('stroke-width', 1)
                .style('cursor', 'pointer');
            pathsEnter.merge(paths)
                .transition()
                .duration(750)
                .attr('d', arc);
            // Add interaction
            pathsEnter.merge(paths)
                .on('click', (event, d) => {
                if (config.onNodeClick) {
                    config.onNodeClick(d);
                }
            });
            paths.exit()
                .transition()
                .duration(300)
                .attr('opacity', 0)
                .remove();
        }
        function renderIcicle(container, layout, colorScale, config) {
            const descendants = layout.descendants();
            const rects = container.selectAll('.partition-rect')
                .data(descendants, (d) => d.data.name);
            const rectsEnter = rects.enter()
                .append('rect')
                .attr('class', 'partition-rect')
                .attr('fill', d => colorScale(d.data.category || d.data.name))
                .attr('stroke', '#fff')
                .attr('stroke-width', 1)
                .style('cursor', 'pointer');
            rectsEnter.merge(rects)
                .transition()
                .duration(750)
                .attr('x', d => d.y0)
                .attr('y', d => d.x0)
                .attr('width', d => d.y1 - d.y0)
                .attr('height', d => d.x1 - d.x0);
            // Add interaction
            rectsEnter.merge(rects)
                .on('click', (event, d) => {
                if (config.onNodeClick) {
                    config.onNodeClick(d);
                }
            });
            rects.exit()
                .transition()
                .duration(300)
                .attr('opacity', 0)
                .remove();
        }
        // ========================================================================
        // CLUSTER LAYOUT (d3.cluster)
        // ========================================================================
        function createClusterLayout(data, config) {
            // Create hierarchy
            const root = d3__namespace.hierarchy(data);
            // Create cluster layout
            const cluster = d3__namespace.cluster()
                .size([config.width, config.height])
                .nodeSize(config.nodeSize);
            if (config.separation) {
                cluster.separation(config.separation);
            }
            return cluster(root);
        }
        function renderCluster(container, layout, config) {
            // Create cluster group
            const clusterGroup = container.selectAll('.cluster-group')
                .data([0]);
            const clusterGroupEnter = clusterGroup.enter()
                .append('g')
                .attr('class', 'cluster-group');
            const clusterGroupMerged = clusterGroupEnter.merge(clusterGroup);
            const descendants = layout.descendants();
            const links = layout.links();
            // Render links
            const linkSelection = clusterGroupMerged.selectAll('.cluster-link')
                .data(links, (d) => `${d.source.data.name}-${d.target.data.name}`);
            linkSelection.enter()
                .append('path')
                .attr('class', 'cluster-link')
                .attr('fill', 'none')
                .attr('stroke', config.linkColor || '#999')
                .attr('stroke-width', 1)
                .merge(linkSelection)
                .transition()
                .duration(750)
                .attr('d', d3__namespace.linkHorizontal()
                .x(d => d.y || 0)
                .y(d => d.x || 0));
            linkSelection.exit().remove();
            // Render nodes
            const nodeSelection = clusterGroupMerged.selectAll('.cluster-node')
                .data(descendants, (d) => d.data.name);
            const nodeEnter = nodeSelection.enter()
                .append('g')
                .attr('class', 'cluster-node');
            nodeEnter.append('circle')
                .attr('r', 5)
                .attr('fill', config.nodeColor || '#69b3a2');
            nodeEnter.append('text')
                .attr('dy', 3)
                .attr('x', 8)
                .style('font-size', '12px')
                .text(d => d.data.name);
            const nodeMerged = nodeEnter.merge(nodeSelection);
            nodeMerged
                .transition()
                .duration(750)
                .attr('transform', d => `translate(${d.y},${d.x})`);
            nodeSelection.exit()
                .transition()
                .duration(300)
                .attr('opacity', 0)
                .remove();
        }
        // ========================================================================
        // PACK LAYOUT (d3.pack)
        // ========================================================================
        function createPackLayout(data, config) {
            // Create hierarchy
            const root = d3__namespace.hierarchy(data)
                .sum(config.sizeAccessor || (d => d.value || 0))
                .sort((a, b) => (b.value || 0) - (a.value || 0));
            // Create pack layout
            const pack = d3__namespace.pack()
                .size([config.width, config.height])
                .padding(config.padding);
            return pack(root);
        }
        function renderPack(container, layout, config) {
            const colorScale = config.colorScale || d3__namespace.scaleOrdinal(d3__namespace.schemeCategory10);
            // Create pack group
            const packGroup = container.selectAll('.pack-group')
                .data([0]);
            const packGroupEnter = packGroup.enter()
                .append('g')
                .attr('class', 'pack-group');
            const packGroupMerged = packGroupEnter.merge(packGroup);
            const descendants = layout.descendants().filter(d => d.depth > 0);
            // Create circles for nodes
            const nodes = packGroupMerged.selectAll('.pack-node')
                .data(descendants, (d) => d.data.name);
            const nodesEnter = nodes.enter()
                .append('g')
                .attr('class', 'pack-node');
            // Add circles
            nodesEnter.append('circle')
                .attr('class', 'pack-circle')
                .style('cursor', 'pointer');
            // Add labels
            nodesEnter.append('text')
                .attr('class', 'pack-label')
                .attr('text-anchor', 'middle')
                .attr('dy', '0.3em')
                .style('font-size', '10px')
                .style('fill', '#333')
                .style('pointer-events', 'none');
            const nodesMerged = nodesEnter.merge(nodes);
            // Update positions and attributes
            nodesMerged
                .transition()
                .duration(750)
                .attr('transform', d => `translate(${d.x},${d.y})`);
            nodesMerged.select('.pack-circle')
                .transition()
                .duration(750)
                .attr('r', d => d.r)
                .attr('fill', d => colorScale(d.data.category || d.data.name))
                .attr('stroke', '#fff')
                .attr('stroke-width', 1)
                .attr('opacity', 0.7);
            nodesMerged.select('.pack-label')
                .text(d => d.r > 15 ? d.data.name : '')
                .attr('font-size', d => Math.min(d.r / 3, 12));
            // Add interaction
            nodesMerged
                .on('click', (event, d) => {
                if (config.onNodeClick) {
                    config.onNodeClick(d);
                }
            })
                .on('mouseenter', (event, d) => {
                d3__namespace.select(event.currentTarget).select('.pack-circle')
                    .attr('opacity', 1)
                    .attr('stroke-width', 2);
            })
                .on('mouseleave', (event, d) => {
                d3__namespace.select(event.currentTarget).select('.pack-circle')
                    .attr('opacity', 0.7)
                    .attr('stroke-width', 1);
            });
            nodes.exit()
                .transition()
                .duration(300)
                .attr('opacity', 0)
                .remove();
        }
        // ========================================================================
        // UTILITY FUNCTIONS
        // ========================================================================
        function transformWaterfallToHierarchy(waterfallData) {
            // Group data by categories if available
            const grouped = d3__namespace.group(waterfallData, d => d.category || 'Default');
            const children = [];
            for (const [category, items] of grouped) {
                const categoryNode = {
                    name: category,
                    value: d3__namespace.sum(items, d => Math.abs(extractValue(d))),
                    category,
                    children: items.map(item => ({
                        name: getLabel(item),
                        value: Math.abs(extractValue(item)),
                        category,
                        metadata: item
                    }))
                };
                children.push(categoryNode);
            }
            return {
                name: 'Root',
                children,
                value: d3__namespace.sum(children, d => d.value || 0)
            };
        }
        function createDrillDownNavigation(data) {
            const navigation = [];
            function traverse(node, path = []) {
                const currentPath = [...path, node.name];
                navigation.push({
                    path: currentPath,
                    name: node.name,
                    value: node.value,
                    level: currentPath.length - 1,
                    hasChildren: !!(node.children && node.children.length > 0)
                });
                if (node.children) {
                    node.children.forEach(child => traverse(child, currentPath));
                }
            }
            traverse(data);
            return navigation;
        }
        function calculateHierarchicalMetrics(node) {
            return {
                depth: node.depth,
                height: node.height,
                value: node.value,
                leafCount: node.leaves().length,
                descendants: node.descendants().length,
                ancestors: node.ancestors().length,
                totalValue: node.descendants().reduce((sum, d) => sum + (d.value || 0), 0),
                averageValue: node.value && node.leaves().length ? node.value / node.leaves().length : 0
            };
        }
        // Helper functions
        function extractValue(item) {
            if (typeof item === 'number')
                return item;
            if (item.value !== undefined)
                return item.value;
            if (item.stacks && Array.isArray(item.stacks)) {
                return item.stacks.reduce((sum, stack) => sum + (stack.value || 0), 0);
            }
            return 0;
        }
        function getLabel(item) {
            if (typeof item === 'string')
                return item;
            if (item.label !== undefined)
                return item.label;
            if (item.name !== undefined)
                return item.name;
            return 'Unnamed';
        }
        function formatValue(value) {
            if (Math.abs(value) >= 1000000)
                return `${(value / 1000000).toFixed(1)}M`;
            if (Math.abs(value) >= 1000)
                return `${(value / 1000).toFixed(1)}K`;
            return value.toFixed(0);
        }
        // ========================================================================
        // RETURN LAYOUT SYSTEM INTERFACE
        // ========================================================================
        return {
            createTreemapLayout,
            renderTreemap,
            createPartitionLayout,
            renderPartition,
            createClusterLayout,
            renderCluster,
            createPackLayout,
            renderPack,
            transformWaterfallToHierarchy,
            createDrillDownNavigation,
            calculateHierarchicalMetrics
        };
    }
    // ============================================================================
    // SPECIALIZED WATERFALL HIERARCHICAL UTILITIES
    // ============================================================================
    /**
     * Create hierarchical waterfall breakdown using treemap
     */
    function createWaterfallTreemap(data, container, width, height) {
        const layoutSystem = createHierarchicalLayoutSystem();
        const hierarchicalData = layoutSystem.transformWaterfallToHierarchy(data);
        const config = {
            width,
            height,
            padding: 2,
            tile: d3__namespace.treemapBinary,
            round: true,
            colorScale: d3__namespace.scaleOrdinal(d3__namespace.schemeSet3)
        };
        const layout = layoutSystem.createTreemapLayout(hierarchicalData, config);
        layoutSystem.renderTreemap(container, layout, config);
    }
    /**
     * Create circular waterfall visualization using partition layout
     */
    function createWaterfallSunburst(data, container, width, height) {
        const layoutSystem = createHierarchicalLayoutSystem();
        const hierarchicalData = layoutSystem.transformWaterfallToHierarchy(data);
        const config = {
            width,
            height,
            innerRadius: 40,
            type: 'sunburst',
            colorScale: d3__namespace.scaleOrdinal(d3__namespace.schemeCategory10)
        };
        const layout = layoutSystem.createPartitionLayout(hierarchicalData, config);
        layoutSystem.renderPartition(container, layout, config);
    }
    /**
     * Create bubble chart waterfall using pack layout
     */
    function createWaterfallBubbles(data, container, width, height) {
        const layoutSystem = createHierarchicalLayoutSystem();
        const hierarchicalData = layoutSystem.transformWaterfallToHierarchy(data);
        const config = {
            width,
            height,
            padding: 3,
            colorScale: d3__namespace.scaleOrdinal(d3__namespace.schemePastel1),
            sizeAccessor: d => Math.abs(d.value || 0)
        };
        const layout = layoutSystem.createPackLayout(hierarchicalData, config);
        layoutSystem.renderPack(container, layout, config);
    }

    // MintWaterfall - D3.js compatible hierarchical layout system - TypeScript Version
    // Implements d3.hierarchy, d3.treemap, d3.partition, and other layout algorithms with full type safety
    /**
     * Creates a hierarchical layout system for advanced data visualization
     * @returns {HierarchicalLayout} Layout system API
     */
    function createHierarchicalLayout() {
        let size = [800, 400];
        let padding = 0;
        let round = false;
        let layoutType = "treemap";
        let paddingInner = 0;
        let paddingOuter = 0;
        let paddingTop = 0;
        let paddingRight = 0;
        let paddingBottom = 0;
        let paddingLeft = 0;
        let ratio = 1.618033988749895; // Golden ratio by default
        // Additional layout-specific options
        let partitionOptions = {
            orientation: "horizontal"
        };
        let treeOptions = {
            nodeSize: null,
            separation: null
        };
        /**
         * Main layout function that processes hierarchical data
         * @param {d3.HierarchyNode<any>} data - d3.hierarchy compatible data
         * @returns {LayoutNode} Processed layout data
         */
        function layout(data) {
            if (!data) {
                console.error("MintWaterfall: No hierarchical data provided to layout");
                throw new Error("No hierarchical data provided");
            }
            // Ensure we have a d3.hierarchy object with proper sum calculation
            const root = data;
            // Apply the selected layout
            switch (layoutType) {
                case "treemap":
                    return applyTreemapLayout(root);
                case "partition":
                    return applyPartitionLayout(root);
                case "pack":
                    return applyPackLayout(root);
                case "cluster":
                    return applyClusterLayout(root);
                case "tree":
                    return applyTreeLayout(root);
                default:
                    console.warn(`MintWaterfall: Unknown layout type '${layoutType}', falling back to treemap`);
                    return applyTreemapLayout(root);
            }
        }
        /**
         * Applies treemap layout to hierarchical data
         * @param {d3.HierarchyNode<any>} root - d3.hierarchy data
         * @returns {d3.HierarchyNode<any>} Processed layout data
         */
        function applyTreemapLayout(root) {
            const treemap = d3__namespace.treemap()
                .size(size)
                .round(round)
                .padding(padding);
            // Apply additional padding options if they exist
            if (paddingInner !== undefined)
                treemap.paddingInner(paddingInner);
            if (paddingOuter !== undefined)
                treemap.paddingOuter(paddingOuter);
            if (paddingTop !== undefined)
                treemap.paddingTop(paddingTop);
            if (paddingRight !== undefined)
                treemap.paddingRight(paddingRight);
            if (paddingBottom !== undefined)
                treemap.paddingBottom(paddingBottom);
            if (paddingLeft !== undefined)
                treemap.paddingLeft(paddingLeft);
            return treemap(root);
        }
        /**
         * Applies partition layout to hierarchical data
         * @param {d3.HierarchyNode<any>} root - d3.hierarchy data
         * @returns {LayoutNode} Processed layout data
         */
        function applyPartitionLayout(root) {
            const partitionLayout = d3__namespace.partition()
                .size(size)
                .round(round)
                .padding(padding);
            // Apply partition layout
            const result = partitionLayout(root);
            // Handle orientation for partition layout
            if (partitionOptions.orientation === "vertical") {
                // Swap x/y coordinates and dimensions for vertical orientation
                result.each((node) => {
                    if (node.x0 !== undefined && node.y0 !== undefined &&
                        node.x1 !== undefined && node.y1 !== undefined) {
                        const temp = node.x0;
                        node.x0 = node.y0;
                        node.y0 = temp;
                        const tempX1 = node.x1;
                        node.x1 = node.y1;
                        node.y1 = tempX1;
                    }
                });
            }
            return result;
        }
        /**
         * Applies pack layout to hierarchical data
         * @param {d3.HierarchyNode<any>} root - d3.hierarchy data
         * @returns {LayoutNode} Processed layout data
         */
        function applyPackLayout(root) {
            return d3__namespace.pack()
                .size(size)
                .padding(padding)(root);
        }
        /**
         * Applies cluster layout to hierarchical data
         * @param {d3.HierarchyNode<any>} root - d3.hierarchy data
         * @returns {LayoutNode} Processed layout data
         */
        function applyClusterLayout(root) {
            const clusterLayout = d3__namespace.cluster()
                .size(size);
            if (treeOptions.nodeSize) {
                clusterLayout.nodeSize(treeOptions.nodeSize);
            }
            if (treeOptions.separation) {
                clusterLayout.separation(treeOptions.separation);
            }
            return clusterLayout(root);
        }
        /**
         * Applies tree layout to hierarchical data
         * @param {d3.HierarchyNode<any>} root - d3.hierarchy data
         * @returns {LayoutNode} Processed layout data
         */
        function applyTreeLayout(root) {
            const treeLayout = d3__namespace.tree()
                .size(size);
            if (treeOptions.nodeSize) {
                treeLayout.nodeSize(treeOptions.nodeSize);
            }
            if (treeOptions.separation) {
                treeLayout.separation(treeOptions.separation);
            }
            return treeLayout(root);
        }
        // Create layout object with simple object assignment
        const hierarchicalLayout = layout;
        // Add chainable methods
        hierarchicalLayout.size = function (_) {
            return arguments.length ? (size = _, hierarchicalLayout) : size;
        };
        hierarchicalLayout.padding = function (_) {
            return arguments.length ? (padding = _, hierarchicalLayout) : padding;
        };
        hierarchicalLayout.paddingInner = function (_) {
            return arguments.length ? (paddingInner = _, hierarchicalLayout) : paddingInner;
        };
        hierarchicalLayout.paddingOuter = function (_) {
            return arguments.length ? (paddingOuter = _, hierarchicalLayout) : paddingOuter;
        };
        hierarchicalLayout.paddingTop = function (_) {
            return arguments.length ? (paddingTop = _, hierarchicalLayout) : paddingTop;
        };
        hierarchicalLayout.paddingRight = function (_) {
            return arguments.length ? (paddingRight = _, hierarchicalLayout) : paddingRight;
        };
        hierarchicalLayout.paddingBottom = function (_) {
            return arguments.length ? (paddingBottom = _, hierarchicalLayout) : paddingBottom;
        };
        hierarchicalLayout.paddingLeft = function (_) {
            return arguments.length ? (paddingLeft = _, hierarchicalLayout) : paddingLeft;
        };
        hierarchicalLayout.round = function (_) {
            return arguments.length ? (round = _, hierarchicalLayout) : round;
        };
        hierarchicalLayout.ratio = function (_) {
            return arguments.length ? (ratio = _, hierarchicalLayout) : ratio;
        };
        hierarchicalLayout.type = function (_) {
            return arguments.length ? (layoutType = _, hierarchicalLayout) : layoutType;
        };
        hierarchicalLayout.partitionOrientation = function (_) {
            return arguments.length ? (partitionOptions.orientation = _, hierarchicalLayout) : partitionOptions.orientation;
        };
        hierarchicalLayout.nodeSize = function (_) {
            return arguments.length ? (treeOptions.nodeSize = _, hierarchicalLayout) : treeOptions.nodeSize;
        };
        hierarchicalLayout.separation = function (_) {
            return arguments.length ? (treeOptions.separation = _, hierarchicalLayout) : treeOptions.separation;
        };
        return hierarchicalLayout;
    }

    const version = "0.8.9";
    if (typeof window !== "undefined" && window.d3) {
      window.d3.waterfallChart = waterfallChart;
    }

    exports.analyzeWaterfallStatistics = analyzeWaterfallStatistics;
    exports.applyTheme = applyTheme;
    exports.createAccessibilitySystem = createAccessibilitySystem;
    exports.createAdvancedDataProcessor = createAdvancedDataProcessor;
    exports.createAdvancedInteractionSystem = createAdvancedInteractionSystem;
    exports.createAdvancedPerformanceSystem = createAdvancedPerformanceSystem;
    exports.createAnimationSystem = createAnimationSystem;
    exports.createBrushSystem = createBrushSystemFactory;
    exports.createComparisonWaterfall = createComparisonWaterfall;
    exports.createDataProcessor = createDataProcessor;
    exports.createDivergingScale = createDivergingScale;
    exports.createExportSystem = createExportSystem;
    exports.createHierarchicalLayout = createHierarchicalLayout;
    exports.createHierarchicalLayoutSystem = createHierarchicalLayoutSystem;
    exports.createPerformanceManager = createPerformanceManager;
    exports.createRevenueWaterfall = createRevenueWaterfall;
    exports.createScaleSystem = createScaleSystem;
    exports.createSequentialScale = createSequentialScale;
    exports.createShapeGenerators = createShapeGenerators;
    exports.createStatisticalSystem = createStatisticalSystem;
    exports.createTemporalWaterfall = createTemporalWaterfall;
    exports.createTooltipSystem = createTooltipSystem;
    exports.createVarianceWaterfall = createVarianceWaterfall;
    exports.createVirtualWaterfallRenderer = createVirtualWaterfallRenderer;
    exports.createWaterfallBubbles = createWaterfallBubbles;
    exports.createWaterfallColorScale = createWaterfallColorScale;
    exports.createWaterfallConfidenceBands = createWaterfallConfidenceBands;
    exports.createWaterfallDragBehavior = createWaterfallDragBehavior;
    exports.createWaterfallForceConfig = createWaterfallForceConfig;
    exports.createWaterfallMilestones = createWaterfallMilestones;
    exports.createWaterfallSequenceAnalyzer = createWaterfallSequenceAnalyzer;
    exports.createWaterfallSpatialIndex = createWaterfallSpatialIndex;
    exports.createWaterfallSunburst = createWaterfallSunburst;
    exports.createWaterfallTickGenerator = createWaterfallTickGenerator;
    exports.createWaterfallTreemap = createWaterfallTreemap;
    exports.createWaterfallVoronoiConfig = createWaterfallVoronoiConfig;
    exports.createZoomSystem = createZoomSystem;
    exports.d3DataUtils = d3DataUtils;
    exports.dataProcessor = dataProcessor;
    exports.default = waterfallChart;
    exports.financialReducers = financialReducers;
    exports.getAdvancedBarColor = getAdvancedBarColor;
    exports.getConditionalColor = getConditionalColor;
    exports.groupWaterfallData = groupWaterfallData;
    exports.interpolateThemeColor = interpolateThemeColor;
    exports.themes = themes;
    exports.transformTransactionData = transformTransactionData;
    exports.version = version;
    exports.waterfallChart = waterfallChart;

    Object.defineProperty(exports, '__esModule', { value: true });

}));
