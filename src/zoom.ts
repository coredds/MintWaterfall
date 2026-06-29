// MintWaterfall Zoom & Pan System - TypeScript Version
// Provides interactive zoom and pan functionality with smooth performance and full type safety

import * as d3 from 'd3';

// Type definitions for zoom system
export interface ZoomConfig {
    enabled: boolean;
    scaleExtent: [number, number];
    translateExtent: [[number, number], [number, number]] | null;
    wheelDelta: ((event: WheelEvent) => number) | null;
    touchable: boolean;
    filter: ((event: any) => boolean) | null;
    constrain: {
        x: boolean;
        y: boolean;
    };
    duration: number;
    ease: (t: number) => number;
}

export interface ChartDimensions {
    width: number;
    height: number;
    margin: {
        top: number;
        right: number;
        bottom: number;
        left: number;
    };
}

export interface ZoomEventData {
    transform: d3.ZoomTransform;
    sourceEvent: any;
}

export interface ZoomTransition {
    to: d3.ZoomTransform;
    duration?: number;
    ease?: (t: number) => number;
}

export interface ZoomBounds {
    x: [number, number];
    y: [number, number];
}

export interface ZoomSystem {
    enable(): ZoomSystem;
    disable(): ZoomSystem;
    attach(container: d3.Selection<any, any, any, any>): ZoomSystem;
    detach(): ZoomSystem;
    transform(selection: d3.Selection<any, any, any, any>, transform: d3.ZoomTransform, duration?: number): ZoomSystem;
    reset(duration?: number): ZoomSystem;
    zoomTo(bounds: ZoomBounds, duration?: number): ZoomSystem;
    setDimensions(dimensions: ChartDimensions): ZoomSystem;
    configure(newConfig: Partial<ZoomConfig>): ZoomSystem;
    getCurrentTransform(): d3.ZoomTransform;
    isEnabled(): boolean;
    on(type: string, callback: (event: ZoomEventData) => void): ZoomSystem;
    off(type: string, callback?: (event: ZoomEventData) => void): ZoomSystem;
}

export type ZoomEventType = 'zoomstart' | 'zoom' | 'zoomend' | 'reset';

export function createZoomSystem(): ZoomSystem {
    
    // Zoom configuration
    const config: ZoomConfig = {
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
    
    let zoomBehavior: d3.ZoomBehavior<any, any> | null = null;
    let currentTransform: d3.ZoomTransform = d3.zoomIdentity;
    let chartContainer: d3.Selection<any, any, any, any> | null = null;
    let chartDimensions: ChartDimensions = { 
        width: 800, 
        height: 400, 
        margin: { top: 60, right: 80, bottom: 60, left: 80 } 
    };
    
    // Event listeners
    const listeners = d3.dispatch("zoomstart", "zoom", "zoomend", "reset");
    
    function createZoomBehavior(): d3.ZoomBehavior<any, any> {
        if (zoomBehavior) return zoomBehavior;
        
        zoomBehavior = d3.zoom<any, any>()
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
    
    function defaultFilter(event: any): boolean {
        // Allow zoom on wheel, but prevent on right-click
        return (!event.ctrlKey || event.type === "wheel") && !event.button;
    }
    
    function updateTranslateExtent(): void {
        if (!zoomBehavior || !chartDimensions) return;
        
        const { width, height, margin } = chartDimensions;
        const chartWidth = width - margin.left - margin.right;
        const chartHeight = height - margin.top - margin.bottom;
        
        // Calculate translate extent based on zoom constraints
        const extent: [[number, number], [number, number]] = config.translateExtent || [
            [-chartWidth * 2, -chartHeight * 2],
            [chartWidth * 3, chartHeight * 3]
        ];
        
        zoomBehavior.translateExtent(extent);
    }
    
    function handleZoomStart(event: d3.D3ZoomEvent<any, any>): void {
        const eventData: ZoomEventData = {
            transform: event.transform,
            sourceEvent: event.sourceEvent
        };
        listeners.call("zoomstart", undefined, eventData);
    }
    
    function handleZoom(event: d3.D3ZoomEvent<any, any>): void {
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
        
        const eventData: ZoomEventData = {
            transform: currentTransform,
            sourceEvent: event.sourceEvent
        };
        listeners.call("zoom", undefined, eventData);
    }
    
    function handleZoomEnd(event: d3.D3ZoomEvent<any, any>): void {
        const eventData: ZoomEventData = {
            transform: event.transform,
            sourceEvent: event.sourceEvent
        };
        listeners.call("zoomend", undefined, eventData);
    }
    
    function applyTransform(container: d3.Selection<any, any, any, any>, transform: d3.ZoomTransform): void {
        // Apply transform to the main chart group
        const chartGroup = container.select(".chart-group");
        if (!chartGroup.empty()) {
            chartGroup.attr("transform", transform.toString());
        }
        
        // Update axes if they exist
        updateAxes(container, transform);
    }
    
    function updateAxes(container: d3.Selection<any, any, any, any>, transform: d3.ZoomTransform): void {
        // Update X axis if constrained
        if (config.constrain.x) {
            const xAxisGroup = container.select(".x-axis");
            if (!xAxisGroup.empty()) {
                const xScale = getScaleFromAxis(xAxisGroup);
                if (xScale) {
                    const newXScale = transform.rescaleX(xScale);
                    (xAxisGroup as any).call(d3.axisBottom(newXScale));
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
                    (yAxisGroup as any).call(d3.axisLeft(newYScale));
                }
            }
        }
    }
    
    function getScaleFromAxis(axisGroup: d3.Selection<any, any, any, any>): d3.ScaleLinear<number, number> | null {
        // This is a simplified implementation - in practice, you'd store references to scales
        // or implement a more sophisticated scale retrieval mechanism
        try {
            const axisNode = axisGroup.node();
            if (axisNode && (axisNode as any).__scale__) {
                return (axisNode as any).__scale__;
            }
        } catch (e) {
            // Scale retrieval failed - this is expected in some cases
        }
        return null;
    }
    
    // Enable zoom
    function enable(): ZoomSystem {
        config.enabled = true;
        if (zoomBehavior && chartContainer) {
            chartContainer.call(zoomBehavior);
        }
        return zoomSystem;
    }
    
    // Disable zoom
    function disable(): ZoomSystem {
        config.enabled = false;
        if (chartContainer) {
            chartContainer.on(".zoom", null);
        }
        return zoomSystem;
    }
    
    // Attach zoom to container
    function attach(container: d3.Selection<any, any, any, any>): ZoomSystem {
        chartContainer = container;
        
        if (config.enabled) {
            const behavior = createZoomBehavior();
            container.call(behavior);
        }
        
        return zoomSystem;
    }
    
    // Detach zoom from container
    function detach(): ZoomSystem {
        if (chartContainer) {
            chartContainer.on(".zoom", null);
            chartContainer = null;
        }
        return zoomSystem;
    }
    
    // Transform to specific state
    function transform(selection: d3.Selection<any, any, any, any>, newTransform: d3.ZoomTransform, duration: number = 0): ZoomSystem {
        if (!zoomBehavior) createZoomBehavior();
        
        if (duration > 0) {
            selection
                .transition()
                .duration(duration)
                .ease(config.ease)
                .call(zoomBehavior!.transform, newTransform);
        } else {
            selection.call(zoomBehavior!.transform, newTransform);
        }
        
        return zoomSystem;
    }
    
    // Reset zoom to identity
    function reset(duration: number = config.duration): ZoomSystem {
        if (chartContainer) {
            transform(chartContainer, d3.zoomIdentity, duration);
            listeners.call("reset", undefined, { transform: d3.zoomIdentity, sourceEvent: null });
        }
        return zoomSystem;
    }
    
    // Zoom to specific bounds
    function zoomTo(bounds: ZoomBounds, duration: number = config.duration): ZoomSystem {
        if (!chartContainer || !chartDimensions) return zoomSystem;
        
        const { width, height, margin } = chartDimensions;
        const chartWidth = width - margin.left - margin.right;
        const chartHeight = height - margin.top - margin.bottom;
        
        // Calculate transform to fit bounds
        const [x0, x1] = bounds.x;
        const [y0, y1] = bounds.y;
        
        const scale = Math.min(
            chartWidth / (x1 - x0),
            chartHeight / (y1 - y0)
        );
        
        const translateX = chartWidth / 2 - scale * (x0 + x1) / 2;
        const translateY = chartHeight / 2 - scale * (y0 + y1) / 2;
        
        const newTransform = d3.zoomIdentity
            .translate(translateX, translateY)
            .scale(scale);
        
        transform(chartContainer, newTransform, duration);
        return zoomSystem;
    }
    
    // Set chart dimensions
    function setDimensions(dimensions: ChartDimensions): ZoomSystem {
        chartDimensions = dimensions;
        updateTranslateExtent();
        return zoomSystem;
    }
    
    // Configure zoom system
    function configure(newConfig: Partial<ZoomConfig>): ZoomSystem {
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
    function getCurrentTransform(): d3.ZoomTransform {
        return currentTransform;
    }
    
    // Check if zoom is enabled
    function isEnabled(): boolean {
        return config.enabled;
    }
    
    // Add event listener
    function on(type: string, callback: (event: ZoomEventData) => void): ZoomSystem {
        (listeners as any).on(type, callback);
        return zoomSystem;
    }
    
    // Remove event listener
    function off(type: string, callback?: (event: ZoomEventData) => void): ZoomSystem {
        if (callback) {
            (listeners as any).on(type, null);
        } else {
            (listeners as any).on(type, null);
        }
        return zoomSystem;
    }
    
    const zoomSystem: ZoomSystem = {
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