// MintWaterfall Zoom & Pan System
// Provides interactive zoom and pan functionality with smooth performance

export function createZoomSystem() {
    
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
        ease: d3.easeQuadOut
    };
    
    let zoomBehavior = null;
    let currentTransform = d3.zoomIdentity;
    let chartContainer = null;
    let chartDimensions = { width: 800, height: 400, margin: { top: 60, right: 80, bottom: 60, left: 80 } };
    
    // Event listeners
    const listeners = d3.dispatch("zoomstart", "zoom", "zoomend", "reset");
    
    function createZoomBehavior() {
        if (zoomBehavior) return zoomBehavior;
        
        zoomBehavior = d3.zoom()
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
        if (!zoomBehavior || !chartDimensions) return;
        
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
        listeners.call("zoomstart", this, event, currentTransform);
    }
    
    function handleZoom(event) {
        currentTransform = event.transform;
        
        // Apply constraints if specified
        if (!config.constrain.x) {
            currentTransform.x = 0;
        }
        if (!config.constrain.y) {
            currentTransform.y = 0;
        }
        
        // Apply transform to chart elements
        if (chartContainer) {
            applyTransform(chartContainer, currentTransform);
        }
        
        listeners.call("zoom", this, event, currentTransform);
    }
    
    function handleZoomEnd(event) {
        listeners.call("zoomend", this, event, currentTransform);
    }
    
    function applyTransform(container, transform) {
        // Apply transform to the main chart group
        const chartGroup = container.select(".chart-group");
        if (!chartGroup.empty()) {
            chartGroup.attr("transform", transform);
        }
        
        // Update axes if they exist
        updateAxes(container, transform);
    }
    
    function updateAxes(container, transform) {
        // For now, we'll keep axes fixed and only transform the chart content
        // This is the expected behavior for most waterfall charts
        // The axes provide reference while the data zooms/pans
        
        // Future enhancement: could add option to zoom axes as well
        // if (config.zoomAxes) {
        //     // Update axis scales with transform
        // }
    }
    
    function getScaleFromAxis(axisGroup) {
        // Helper to extract scale from axis group
        // This is a simplified version - in practice, you'd store the original scales
        const domain = axisGroup.selectAll(".tick text").data();
        if (domain.length > 0) {
            return d3.scaleLinear().domain(d3.extent(domain));
        }
        return null;
    }
    
    // Public API
    function zoom(container, dimensions) {
        if (!container) return zoom;
        
        chartContainer = container;
        chartDimensions = dimensions || chartDimensions;
        
        // Only apply zoom behavior if enabled
        if (config.enabled) {
            const behavior = createZoomBehavior();
            container.call(behavior);
        } else {
            // Remove any existing zoom behavior
            container.on(".zoom", null);
        }
        
        return zoom;
    }
    
    // Configuration methods
    zoom.enabled = function(value) {
        if (!arguments.length) return config.enabled;
        config.enabled = value;
        
        if (chartContainer) {
            if (value) {
                chartContainer.call(createZoomBehavior());
            } else {
                chartContainer.on(".zoom", null);
            }
        }
        return zoom;
    };
    
    zoom.scaleExtent = function(value) {
        if (!arguments.length) return config.scaleExtent;
        config.scaleExtent = value;
        if (zoomBehavior) zoomBehavior.scaleExtent(value);
        return zoom;
    };
    
    zoom.translateExtent = function(value) {
        if (!arguments.length) return config.translateExtent;
        config.translateExtent = value;
        updateTranslateExtent();
        return zoom;
    };
    
    zoom.constrain = function(value) {
        if (!arguments.length) return config.constrain;
        if (typeof value === "object") {
            config.constrain = { ...config.constrain, ...value };
        } else {
            config.constrain = { x: value, y: value };
        }
        return zoom;
    };
    
    zoom.wheelDelta = function(value) {
        if (!arguments.length) return config.wheelDelta;
        config.wheelDelta = value;
        if (zoomBehavior) zoomBehavior.wheelDelta(value);
        return zoom;
    };
    
    zoom.filter = function(value) {
        if (!arguments.length) return config.filter;
        config.filter = value;
        if (zoomBehavior) zoomBehavior.filter(value);
        return zoom;
    };
    
    // Transform methods
    zoom.transform = function(value) {
        if (!arguments.length) return currentTransform;
        if (chartContainer && zoomBehavior) {
            chartContainer.call(zoomBehavior.transform, value);
        }
        return zoom;
    };
    
    zoom.translateBy = function(x, y) {
        if (chartContainer && zoomBehavior) {
            chartContainer.call(zoomBehavior.translateBy, x, y);
        }
        return zoom;
    };
    
    zoom.scaleBy = function(k) {
        if (chartContainer && zoomBehavior) {
            chartContainer.call(zoomBehavior.scaleBy, k);
        }
        return zoom;
    };
    
    zoom.scaleTo = function(k) {
        if (chartContainer && zoomBehavior) {
            chartContainer.call(zoomBehavior.scaleTo, k);
        }
        return zoom;
    };
    
    // Utility methods
    zoom.reset = function(transition = true) {
        if (!chartContainer || !zoomBehavior) return zoom;
        
        const resetTransform = d3.zoomIdentity;
        
        if (transition) {
            chartContainer.transition()
                .duration(config.duration)
                .ease(config.ease)
                .call(zoomBehavior.transform, resetTransform);
        } else {
            chartContainer.call(zoomBehavior.transform, resetTransform);
        }
        
        listeners.call("reset", this, resetTransform);
        return zoom;
    };
    
    zoom.center = function(x, y, scale = 1) {
        if (!chartContainer || !zoomBehavior) return zoom;
        
        const { width, height, margin } = chartDimensions;
        const centerX = (width - margin.left - margin.right) / 2;
        const centerY = (height - margin.top - margin.bottom) / 2;
        
        const transform = d3.zoomIdentity
            .translate(centerX - x * scale, centerY - y * scale)
            .scale(scale);
            
        chartContainer.transition()
            .duration(config.duration)
            .ease(config.ease)
            .call(zoomBehavior.transform, transform);
            
        return zoom;
    };
    
    zoom.fitExtent = function(extent, padding = 0) {
        if (!chartContainer || !zoomBehavior) return zoom;
        
        const { width, height, margin } = chartDimensions;
        const chartWidth = width - margin.left - margin.right;
        const chartHeight = height - margin.top - margin.bottom;
        
        const [[x0, y0], [x1, y1]] = extent;
        const extentWidth = x1 - x0;
        const extentHeight = y1 - y0;
        
        const scale = Math.min(
            (chartWidth - padding * 2) / extentWidth,
            (chartHeight - padding * 2) / extentHeight
        );
        
        const centerX = (x0 + x1) / 2;
        const centerY = (y0 + y1) / 2;
        
        zoom.center(centerX, centerY, scale);
        return zoom;
    };
    
    // Event handling
    zoom.on = function(type, listener) {
        listeners.on(type, listener);
        return zoom;
    };
    
    // Get current state
    zoom.getTransform = function() {
        return currentTransform;
    };
    
    zoom.getScale = function() {
        return currentTransform.k;
    };
    
    zoom.getTranslate = function() {
        return [currentTransform.x, currentTransform.y];
    };
    
    return zoom;
}

// Zoom control UI components
export function createZoomControls() {
    
    function controls(container, zoomSystem) {
        if (!container || !zoomSystem) return controls;
        
        // Create controls container
        const controlsGroup = container.append("div")
            .attr("class", "zoom-controls")
            .style("position", "absolute")
            .style("top", "10px")
            .style("right", "10px")
            .style("display", "flex")
            .style("flex-direction", "column")
            .style("gap", "5px");
        
        // Zoom in button
        const zoomInBtn = controlsGroup.append("button")
            .attr("class", "zoom-btn zoom-in")
            .style("width", "32px")
            .style("height", "32px")
            .style("border", "1px solid #ccc")
            .style("background", "white")
            .style("cursor", "pointer")
            .style("border-radius", "4px")
            .style("font-size", "16px")
            .style("display", "flex")
            .style("align-items", "center")
            .style("justify-content", "center")
            .text("+")
            .on("click", () => zoomSystem.scaleBy(1.5));
        
        // Zoom out button
        const zoomOutBtn = controlsGroup.append("button")
            .attr("class", "zoom-btn zoom-out")
            .style("width", "32px")
            .style("height", "32px")
            .style("border", "1px solid #ccc")
            .style("background", "white")
            .style("cursor", "pointer")
            .style("border-radius", "4px")
            .style("font-size", "16px")
            .style("display", "flex")
            .style("align-items", "center")
            .style("justify-content", "center")
            .text("−")
            .on("click", () => zoomSystem.scaleBy(1/1.5));
        
        // Reset button
        const resetBtn = controlsGroup.append("button")
            .attr("class", "zoom-btn zoom-reset")
            .style("width", "32px")
            .style("height", "32px")
            .style("border", "1px solid #ccc")
            .style("background", "white")
            .style("cursor", "pointer")
            .style("border-radius", "4px")
            .style("font-size", "12px")
            .style("display", "flex")
            .style("align-items", "center")
            .style("justify-content", "center")
            .text("⌂")
            .on("click", () => zoomSystem.reset());
        
        // Add hover effects
        controlsGroup.selectAll(".zoom-btn")
            .on("mouseenter", function() {
                d3.select(this).style("background", "#f0f0f0");
            })
            .on("mouseleave", function() {
                d3.select(this).style("background", "white");
            });
        
        return controls;
    }
    
    return controls;
}

// Export convenience functions
export function addZoomToChart(chart, options = {}) {
    const zoomSystem = createZoomSystem();
    
    // Configure zoom system with options
    Object.keys(options).forEach(key => {
        if (typeof zoomSystem[key] === "function") {
            zoomSystem[key](options[key]);
        }
    });
    
    // Add zoom method to chart
    chart.zoom = function(value) {
        if (!arguments.length) return zoomSystem;
        if (value === false) {
            zoomSystem.enabled(false);
        } else if (value === true) {
            zoomSystem.enabled(true);
        } else if (typeof value === "object") {
            Object.keys(value).forEach(key => {
                if (typeof zoomSystem[key] === "function") {
                    zoomSystem[key](value[key]);
                }
            });
        }
        return chart;
    };
    
    return zoomSystem;
}

// Global zoom system instance
export const zoomSystem = createZoomSystem();
