// MintWaterfall Enhanced Scales System
// Provides advanced D3.js scale support including time and ordinal scales

export function createScaleSystem() {
    
    // Enhanced scale factory with auto-detection
    function createAdaptiveScale(data, dimension = "x") {
        const values = data.map(d => dimension === "x" ? d.label : d.cumulativeTotal);
        
        // Detect data type and return appropriate scale
        if (values.every(v => v instanceof Date)) {
            return createTimeScale(values);
        } else if (values.every(v => typeof v === "string" || isNaN(v))) {
            return createOrdinalScale(values);
        } else if (values.every(v => typeof v === "number")) {
            return createLinearScale(values);
        } else {
            // Mixed types - fallback to band scale
            return d3.scaleBand().domain(values);
        }
    }
    
    // Time scale with intelligent formatting
    function createTimeScale(values, options = {}) {
        const {
            range = [0, 800],
            nice = true,
            tickFormat = "auto"
        } = options;
        
        const extent = d3.extent(values);
        const scale = d3.scaleTime()
            .domain(extent)
            .range(range);
            
        if (nice) {
            scale.nice();
        }
        
        // Auto-detect appropriate time format
        if (tickFormat === "auto") {
            const timeSpan = extent[1] - extent[0];
            const days = timeSpan / (1000 * 60 * 60 * 24);
            
            if (days < 1) {
                scale.tickFormat = d3.timeFormat("%H:%M");
            } else if (days < 30) {
                scale.tickFormat = d3.timeFormat("%m/%d");
            } else if (days < 365) {
                scale.tickFormat = d3.timeFormat("%b %Y");
            } else {
                scale.tickFormat = d3.timeFormat("%Y");
            }
        }
        
        return scale;
    }
    
    // Enhanced ordinal scale with color mapping
    function createOrdinalScale(values, options = {}) {
        const {
            range = d3.schemeCategory10,
            unknown = "#ccc"
        } = options;
        
        const uniqueValues = [...new Set(values)];
        
        return d3.scaleOrdinal()
            .domain(uniqueValues)
            .range(range)
            .unknown(unknown);
    }
    
    // Enhanced linear scale with better domain calculation
    function createLinearScale(values, options = {}) {
        const {
            range = [0, 400],
            nice = true,
            padding = 0.1,
            clamp = false
        } = options;
        
        const [min, max] = d3.extent(values);
        const paddingValue = (max - min) * padding;
        
        const scale = d3.scaleLinear()
            .domain([min - paddingValue, max + paddingValue])
            .range(range)
            .clamp(clamp);
            
        if (nice) {
            scale.nice();
        }
        
        return scale;
    }
    
    // Sequential scale for continuous color mapping
    function createSequentialScale(values, colorScheme = d3.interpolateBlues) {
        const extent = d3.extent(values);
        
        return d3.scaleSequential()
            .domain(extent)
            .interpolator(colorScheme);
    }
    
    // Quantile scale for data distribution
    function createQuantileScale(values, range = d3.schemeBlues[5]) {
        return d3.scaleQuantile()
            .domain(values)
            .range(range);
    }
    
    // Threshold scale for categorical ranges
    function createThresholdScale(thresholds, colors = d3.schemeCategory10) {
        return d3.scaleThreshold()
            .domain(thresholds)
            .range(colors);
    }
    
    // Power scale with configurable exponent
    function createPowerScale(values, exponent = 2, options = {}) {
        const {
            range = [0, 400],
            nice = true
        } = options;
        
        const extent = d3.extent(values);
        const scale = d3.scalePow()
            .exponent(exponent)
            .domain(extent)
            .range(range);
            
        if (nice) {
            scale.nice();
        }
        
        return scale;
    }
    
    // Log scale with safety for zero/negative values
    function createLogScale(values, options = {}) {
        const {
            range = [0, 400],
            base = 10,
            nice = true
        } = options;
        
        // Filter out zero and negative values for log scale
        const positiveValues = values.filter(v => v > 0);
        
        if (positiveValues.length === 0) {
            console.warn("Log scale requires positive values. Falling back to linear scale.");
            return createLinearScale(values, options);
        }
        
        const extent = d3.extent(positiveValues);
        const scale = d3.scaleLog()
            .base(base)
            .domain(extent)
            .range(range);
            
        if (nice) {
            scale.nice();
        }
        
        return scale;
    }
    
    // Scale utilities
    const scaleUtils = {
        // Auto-detect best scale type for data
        detectScaleType(values) {
            if (values.every(v => v instanceof Date)) return "time";
            if (values.every(v => typeof v === "string")) return "ordinal";
            if (values.every(v => typeof v === "number" && v > 0)) return "linear"; // Could be log
            if (values.every(v => typeof v === "number")) return "linear";
            return "band"; // fallback
        },
        
        // Create appropriate axis for scale
        createAxis(scale, orientation = "bottom", options = {}) {
            const {
                tickCount = 10,
                tickFormat = null,
                tickSize = 6
            } = options;
            
            let axis;
            switch (orientation) {
                case "top":
                    axis = d3.axisTop(scale);
                    break;
                case "right":
                    axis = d3.axisRight(scale);
                    break;
                case "left":
                    axis = d3.axisLeft(scale);
                    break;
                default:
                    axis = d3.axisBottom(scale);
            }
            
            if (tickCount) axis.ticks(tickCount);
            if (tickFormat) axis.tickFormat(tickFormat);
            if (tickSize) axis.tickSize(tickSize);
            
            return axis;
        },
        
        // Get nice ticks for any scale type
        getNiceTicks(scale, count = 10) {
            if (scale.ticks) {
                return scale.ticks(count);
            } else if (scale.domain) {
                return scale.domain();
            }
            return [];
        }
    };
    
    return {
        createAdaptiveScale,
        createTimeScale,
        createOrdinalScale,
        createLinearScale,
        createSequentialScale,
        createQuantileScale,
        createThresholdScale,
        createPowerScale,
        createLogScale,
        scaleUtils
    };
}

// Export individual scale creators for convenience
export function createTimeScale(values, options) {
    return createScaleSystem().createTimeScale(values, options);
}

export function createOrdinalScale(values, options) {
    return createScaleSystem().createOrdinalScale(values, options);
}

// Default export
const scaleSystem = createScaleSystem();
export default scaleSystem;
