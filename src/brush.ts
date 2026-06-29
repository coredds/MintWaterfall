// MintWaterfall Brush Selection System - TypeScript Version
// Provides interactive data selection with visual feedback and full type safety

import * as d3 from 'd3';

// Type definitions for brush system
export interface BrushConfig {
    enabled: boolean;
    extent: [[number, number], [number, number]];
    handleSize: number;
    filter: ((event: any) => boolean) | null;
    touchable: boolean;
    keyModifiers: boolean;
    selection: {
        fill: string;
        fillOpacity: number;
        stroke: string;
        strokeWidth: number;
        strokeDasharray: string | null;
    };
    handles: {
        fill: string;
        stroke: string;
        strokeWidth: number;
        size: number;
    };
}

export interface BrushSelection {
    x: [number, number];
    y: [number, number];
}

export interface BrushEventData {
    selection: BrushSelection | null;
    sourceEvent: any;
    type: 'start' | 'brush' | 'end';
}

export interface DataPoint {
    x: number;
    y: number;
    [key: string]: any;
}

export interface BrushSystem {
    enable(): BrushSystem;
    disable(): BrushSystem;
    attach(container: d3.Selection<SVGGElement, any, any, any>): BrushSystem;
    detach(): BrushSystem;
    clear(): BrushSystem;
    getSelection(): BrushSelection | null;
    setSelection(selection: BrushSelection | null): BrushSystem;
    getSelectedData(): DataPoint[];
    setData(data: DataPoint[]): BrushSystem;
    configure(newConfig: Partial<BrushConfig>): BrushSystem;
    setExtent(extent: [[number, number], [number, number]]): BrushSystem;
    isEnabled(): boolean;
    on(type: string, callback: (event: BrushEventData) => void): BrushSystem;
    off(type: string, callback?: (event: BrushEventData) => void): BrushSystem;
}

export type BrushEventType = 'brushstart' | 'brush' | 'brushend' | 'clear';

export function createBrushSystem(): BrushSystem {
    
    // Brush configuration
    const config: BrushConfig = {
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
    
    let brushBehavior: d3.BrushBehavior<any> | null = null;
    let currentSelection: BrushSelection | null = null;
    let brushContainer: d3.Selection<SVGGElement, any, any, any> | null = null;
    let dataPoints: DataPoint[] = [];
    
    // Event listeners
    const listeners = d3.dispatch("brushstart", "brush", "brushend", "clear");
    
    function createBrushBehavior(): d3.BrushBehavior<any> {
        if (brushBehavior) return brushBehavior;
        
        brushBehavior = d3.brush<any>()
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
    
    function handleBrushStart(event: d3.D3BrushEvent<any>): void {
        const selection = convertD3Selection(event.selection as [[number, number], [number, number]] | null);
        currentSelection = selection;
        
        const eventData: BrushEventData = {
            selection,
            sourceEvent: event.sourceEvent,
            type: 'start'
        };
        
        listeners.call("brushstart", undefined, eventData);
    }
    
    function handleBrush(event: d3.D3BrushEvent<any>): void {
        const selection = convertD3Selection(event.selection as [[number, number], [number, number]] | null);
        currentSelection = selection;
        
        const eventData: BrushEventData = {
            selection,
            sourceEvent: event.sourceEvent,
            type: 'brush'
        };
        
        listeners.call("brush", undefined, eventData);
    }
    
    function handleBrushEnd(event: d3.D3BrushEvent<any>): void {
        const selection = convertD3Selection(event.selection as [[number, number], [number, number]] | null);
        currentSelection = selection;
        
        const eventData: BrushEventData = {
            selection,
            sourceEvent: event.sourceEvent,
            type: 'end'
        };
        
        listeners.call("brushend", undefined, eventData);
    }
    
    function convertD3Selection(d3Selection: [[number, number], [number, number]] | null): BrushSelection | null {
        if (!d3Selection) return null;
        
        const [[x0, y0], [x1, y1]] = d3Selection;
        return {
            x: [Math.min(x0, x1), Math.max(x0, x1)],
            y: [Math.min(y0, y1), Math.max(y0, y1)]
        };
    }
    
    function convertToBrushSelection(selection: BrushSelection): [[number, number], [number, number]] {
        return [
            [selection.x[0], selection.y[0]],
            [selection.x[1], selection.y[1]]
        ];
    }
    
    function applyBrushStyles(): void {
        if (!brushContainer) return;
        
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
    
    function filterDataBySelection(selection: BrushSelection): DataPoint[] {
        if (!selection || dataPoints.length === 0) return [];
        
        const [x0, x1] = selection.x;
        const [y0, y1] = selection.y;
        
        return dataPoints.filter(point => {
            return point.x >= x0 && point.x <= x1 && 
                   point.y >= y0 && point.y <= y1;
        });
    }
    
    // Enable brush
    function enable(): BrushSystem {
        config.enabled = true;
        if (brushBehavior && brushContainer) {
            brushContainer.call(brushBehavior);
            applyBrushStyles();
        }
        return brushSystem;
    }
    
    // Disable brush
    function disable(): BrushSystem {
        config.enabled = false;
        if (brushContainer) {
            brushContainer.on(".brush", null);
        }
        return brushSystem;
    }
    
    // Attach brush to container
    function attach(container: d3.Selection<SVGGElement, any, any, any>): BrushSystem {
        brushContainer = container;
        
        if (config.enabled) {
            const behavior = createBrushBehavior();
            container.call(behavior);
            applyBrushStyles();
        }
        
        return brushSystem;
    }
    
    // Detach brush from container
    function detach(): BrushSystem {
        if (brushContainer) {
            brushContainer.on(".brush", null);
            brushContainer.selectAll(".brush").remove();
            brushContainer = null;
        }
        return brushSystem;
    }
    
    // Clear current selection
    function clear(): BrushSystem {
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
    function getSelection(): BrushSelection | null {
        return currentSelection;
    }
    
    // Set selection programmatically
    function setSelection(selection: BrushSelection | null): BrushSystem {
        if (brushContainer && brushBehavior) {
            if (selection) {
                const d3Selection = convertToBrushSelection(selection);
                brushContainer.call(brushBehavior.move, d3Selection);
            } else {
                brushContainer.call(brushBehavior.clear);
            }
            currentSelection = selection;
        }
        return brushSystem;
    }
    
    // Get data points within current selection
    function getSelectedData(): DataPoint[] {
        if (!currentSelection) return [];
        return filterDataBySelection(currentSelection);
    }
    
    // Set data points for selection filtering
    function setData(data: DataPoint[]): BrushSystem {
        dataPoints = [...data]; // Create a copy to avoid external mutations
        return brushSystem;
    }
    
    // Configure brush system
    function configure(newConfig: Partial<BrushConfig>): BrushSystem {
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
    function setExtent(extent: [[number, number], [number, number]]): BrushSystem {
        config.extent = extent;
        if (brushBehavior) {
            brushBehavior.extent(extent);
        }
        return brushSystem;
    }
    
    // Check if brush is enabled
    function isEnabled(): boolean {
        return config.enabled;
    }
    
    // Add event listener
    function on(type: string, callback: (event: BrushEventData) => void): BrushSystem {
        (listeners as any).on(type, callback);
        return brushSystem;
    }
    
    // Remove event listener
    function off(type: string, callback?: (event: BrushEventData) => void): BrushSystem {
        (listeners as any).on(type, null);
        return brushSystem;
    }
    
    const brushSystem: BrushSystem = {
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
export function createBrushSystemFactory() {
    function createBrush(options: { type?: 'x' | 'y' | 'xy' } = {}): any {
        const { type = 'xy' } = options;
        
        switch (type) {
            case 'x':
                return d3.brushX();
            case 'y':
                return d3.brushY();
            case 'xy':
            default:
                return d3.brush();
        }
    }
    
    function filterDataByBrush(data: any[], selection: [number, number], scale: any): any[] {
        if (!selection || !scale) return data;
        
        const [start, end] = selection;
        return data.filter(d => {
            const value = scale(d.x || d.label || d.value);
            return value >= start && value <= end;
        });
    }
    
    function getSelectedIndices(data: any[], selection: [number, number], scale: any): number[] {
        if (!selection || !scale) return [];
        
        const [start, end] = selection;
        const indices: number[] = [];
        
        data.forEach((d, i) => {
            const value = scale(d.x || d.label || d.value);
            if (value >= start && value <= end) {
                indices.push(i);
            }
        });
        
        return indices;
    }
    
    const selectionUtils = {
        createSelectionSummary(selectedData: any[]): any {
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
    
    // Event handler methods
    let startHandler: Function | null = null;
    let moveHandler: Function | null = null;
    let endHandler: Function | null = null;
    
    const brushFactory = {
        createBrush,
        filterDataByBrush,
        getSelectedIndices,
        selectionUtils,
        onStart(handler: Function) {
            startHandler = handler;
            return brushFactory;
        },
        onMove(handler: Function) {
            moveHandler = handler;
            return brushFactory;
        },
        onEnd(handler: Function) {
            endHandler = handler;
            return brushFactory;
        }
    };
    
    return brushFactory;
}